from fastapi import APIRouter, Depends, Request, HTTPException
from app.models.schemas import (
    ProfileInput, ProfileAnalysisResponse,
    HeadlineInput, HeadlineSuggestionsResponse,
    SkillsInput, SkillsRecommendationsResponse,
    SeoInput, SeoScoreResponse,
    PremiumAnalysisResponse, ChatInput, ChatResponse
)
from app.core.auth import verify_firebase_token
from app.core.rate_limiter import limiter
from app.services.groq_client import call_groq_with_fallback
from app.services.prompt_builders import (
    build_analysis_system_prompt, build_analysis_user_prompt,
    build_headline_system_prompt, build_headline_user_prompt,
    build_skills_system_prompt, build_skills_user_prompt,
    build_seo_system_prompt, build_seo_user_prompt,
    build_premium_analysis_system_prompt, build_premium_analysis_user_prompt,
    build_chat_system_prompt, build_chat_user_prompt
)
from app.services.scoring import calculate_rules_score, blend_seo_score

router = APIRouter(prefix="/api", tags=["LinkedIn Profile Optimization"])

@router.post("/analyze-profile", response_model=ProfileAnalysisResponse)
@limiter.limit("5/minute")
async def analyze_profile(
    request: Request,
    data: ProfileInput,
    user=Depends(verify_firebase_token)
):
    """
    Analyzes profile headline, summary, work history, and skills against target role,
    returning detailed strengths, weaknesses, tone feedback, and missing sections.
    """
    if (
        len(data.headline.strip()) < 3
        or len(data.about.strip()) < 10
        or len(data.experience.strip()) < 10
        or len(data.targetRole.strip()) < 3
    ):
        raise HTTPException(
            status_code=400,
            detail="Insufficient profile text. Please provide realistic descriptions (Headline/Role min 3 chars, About/Experience min 10 chars) for an accurate audit."
        )

    system_prompt = build_analysis_system_prompt()
    user_prompt = build_analysis_user_prompt(data)
    
    try:
        result = await call_groq_with_fallback(system_prompt, user_prompt)
        return ProfileAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis API failed: {str(e)}")

@router.post("/headline-suggestions", response_model=HeadlineSuggestionsResponse)
@limiter.limit("5/minute")
async def generate_headlines(
    request: Request,
    data: HeadlineInput,
    user=Depends(verify_firebase_token)
):
    """
    Generates 5 optimized copyable headlines with rationales matching desired keywords.
    """
    system_prompt = build_headline_system_prompt()
    user_prompt = build_headline_user_prompt(data)
    
    try:
        result = await call_groq_with_fallback(system_prompt, user_prompt)
        return HeadlineSuggestionsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Headline generation failed: {str(e)}")

@router.post("/skills-recommendations", response_model=SkillsRecommendationsResponse)
@limiter.limit("5/minute")
async def recommend_skills(
    request: Request,
    data: SkillsInput,
    user=Depends(verify_firebase_token)
):
    """
    Recommends 6-8 trending or in-demand skills for target role + current skills.
    """
    system_prompt = build_skills_system_prompt()
    user_prompt = build_skills_user_prompt(data)
    
    try:
        result = await call_groq_with_fallback(system_prompt, user_prompt)
        return SkillsRecommendationsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skills advisory failed: {str(e)}")

@router.post("/seo-score", response_model=SeoScoreResponse)
@limiter.limit("5/minute")
async def audit_seo_score(
    request: Request,
    data: SeoInput,
    user=Depends(verify_firebase_token)
):
    """
    Audits searchability metrics of full profile text, blending rule constraints
    and qualitative AI density/quality metrics.
    """
    system_prompt = build_seo_system_prompt()
    user_prompt = build_seo_user_prompt(data)
    
    # Calculate rule-based heuristics locally (40% weight)
    rules_data = calculate_rules_score(data.fullProfileText, data.targetRole)
    
    try:
        # Call Groq/Gemini for qualitative factors (60% weight)
        ai_data = await call_groq_with_fallback(system_prompt, user_prompt)
        
        # Blend scores
        score, breakdown, fixes = blend_seo_score(rules_data, ai_data)
        
        return SeoScoreResponse(
            score=score,
            breakdown=breakdown,
            fixes=fixes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SEO scoring API failed: {str(e)}")

@router.post("/analyze-profile-premium", response_model=PremiumAnalysisResponse)
@limiter.limit("5/minute")
async def analyze_profile_premium(
    request: Request,
    data: ProfileInput,
    user=Depends(verify_firebase_token)
):
    """
    Performs a deep structured analysis of the profile, returning comprehensive dashboard metrics.
    """
    if (
        len(data.headline.strip()) < 3
        or len(data.about.strip()) < 10
        or len(data.experience.strip()) < 10
        or len(data.targetRole.strip()) < 3
    ):
        raise HTTPException(
            status_code=400,
            detail="Insufficient profile text. Please provide realistic descriptions (Headline/Role min 3 chars, About/Experience min 10 chars) for an accurate audit."
        )

    system_prompt = build_premium_analysis_system_prompt()
    user_prompt = build_premium_analysis_user_prompt(data)
    
    try:
        result = await call_groq_with_fallback(system_prompt, user_prompt)
        return PremiumAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Premium Analysis API failed: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("15/minute")
async def chat_assistant(
    request: Request,
    data: ChatInput,
    user=Depends(verify_firebase_token)
):
    """
    Provides context-aware conversational career advice based on the user's analyzed profile.
    """
    system_prompt = build_chat_system_prompt(data.profileContext)
    user_prompt = build_chat_user_prompt(data.message, data.history)
    
    try:
        result = await call_groq_with_fallback(system_prompt, user_prompt)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot assistant API failed: {str(e)}")
