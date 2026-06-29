import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Request
from pydantic import BaseModel

from app.models.schemas import (
    StructuredResumeData,
    ResumeAnalysis,
    ResumeUploadResponse
)
from app.core.auth import verify_firebase_token
from app.core.rate_limiter import limiter
from app.services.pdf_parser import extract_text_from_pdf
from app.services.groq_client import call_groq_with_fallback
from app.services.prompt_builders import (
    build_resume_structuring_system_prompt,
    build_resume_structuring_user_prompt,
    build_resume_analysis_system_prompt,
    build_resume_analysis_user_prompt
)

# Firebase Admin imports for DB storage
import firebase_admin
from firebase_admin import firestore

router = APIRouter(prefix="/api/resume", tags=["Resume Upload and Extraction"])

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

class ResumeAnalysisRequest(BaseModel):
    fileName: str
    text: str
    structuredData: StructuredResumeData

@router.post("/upload", response_model=ResumeUploadResponse)
@limiter.limit("5/minute")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    user=Depends(verify_firebase_token)
):
    """
    Accepts a PDF resume, extracts the raw text, uses AI to structure the contact info,
    experience, education, skills, and projects, and returns the parsed result.
    """
    # 1. Validate File Type
    filename = file.filename or "resume.pdf"
    if file.content_type != "application/pdf" and not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted."
        )

    # 2. Validate File Size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB limit."
        )

    # 3. Extract Text via PyMuPDF
    try:
        extraction = extract_text_from_pdf(content)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

    # 4. Use AI to structure the extracted text
    try:
        system_prompt = build_resume_structuring_system_prompt()
        user_prompt = build_resume_structuring_user_prompt(extraction["text"])
        ai_structured_json = await call_groq_with_fallback(system_prompt, user_prompt)
        
        # Parse into Pydantic Model
        structured_data = StructuredResumeData(**ai_structured_json)
    except Exception as e:
        # Fallback to empty structured data if AI structuring fails
        structured_data = StructuredResumeData()

    return ResumeUploadResponse(
        success=True,
        fileName=filename,
        pages=extraction["pages"],
        characters=extraction["characters"],
        wordCount=extraction["wordCount"],
        estimatedReadingTime=extraction["estimatedReadingTime"],
        text=extraction["text"],
        structuredData=structured_data,
        analysis=None
    )


@router.post("/analyze", response_model=ResumeAnalysis)
@limiter.limit("5/minute")
async def analyze_resume_endpoint(
    request: Request,
    data: ResumeAnalysisRequest,
    user=Depends(verify_firebase_token)
):
    """
    Accepts the (possibly edited) extracted text and structured data, performs AI resume analysis,
    and stores the resulting analysis in the authenticated user's Firestore collection.
    """
    # 1. Call AI to analyze the structured resume
    try:
        system_prompt = build_resume_analysis_system_prompt()
        user_prompt = build_resume_analysis_user_prompt(data.structuredData.model_dump())
        ai_analysis_json = await call_groq_with_fallback(system_prompt, user_prompt)
        
        analysis = ResumeAnalysis(**ai_analysis_json)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )

    # 2. Store in Firestore (graceful fallback if Firebase is not active)
    user_id = user.get("uid") if user else "anonymous"
    analysis_id = str(uuid.uuid4())
    
    payload = {
        "analysisId": analysis_id,
        "fileName": data.fileName,
        "uploadDate": datetime.now(timezone.utc).isoformat(),
        "extractedText": data.text,
        "structuredData": data.structuredData.model_dump(),
        "analysis": analysis.model_dump(),
        "scores": {
            "ats": analysis.atsScore,
            "recruiter": analysis.recruiterScore,
            "seo": analysis.seoScore,
            "profileStrength": analysis.profileStrength
        }
    }

    if firebase_admin._apps:
        try:
            db = firestore.client()
            user_ref = db.collection("users").document(user_id)
            # Store in subcollection
            user_ref.collection("resumeAnalyses").document(analysis_id).set(payload)
        except Exception as db_err:
            # Log error but don't fail the API call for the user
            print(f"Failed to store resume analysis in Firestore: {str(db_err)}")

    return analysis
