import json
import logging
from groq import AsyncGroq
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

# Initialize clients safely
groq_client = None
if settings.GROQ_API_KEY:
    groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
else:
    logger.warning("GROQ_API_KEY is not defined in environment settings.")

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not defined. Gemini fallback will be unavailable.")

async def call_groq_with_fallback(system_prompt: str, user_prompt: str) -> dict:
    """
    Asynchronously queries Groq (llama-3.3-70b-versatile) with JSON response mode.
    Falls back to Gemini 2.0 Flash if Groq fails or is rate-limited.
    """
    # 1. Primary path: Groq API
    if groq_client:
        try:
            logger.info("Attempting to call Groq API (llama-3.3-70b-versatile)...")
            response = await groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
            )
            raw_text = response.choices[0].message.content
            logger.info("Successfully received and parsed response from Groq.")
            return json.loads(raw_text)
        except Exception as e:
            logger.error(f"Groq API call encountered an error: {str(e)}. Checking fallback options...")
            if not settings.GEMINI_API_KEY:
                logger.error("No Gemini API key available for fallback.")
                raise e
    else:
        logger.warning("Groq client not initialized. Checking Gemini fallback...")
        if not settings.GEMINI_API_KEY:
            raise ValueError("No AI API Keys (Groq or Gemini) are configured in the backend environment.")

    # 2. Fallback path: Gemini API (gemini-2.0-flash)
    try:
        logger.info("Attempting fallback call to Gemini API (gemini-2.0-flash)...")
        # Use GenerativeModel from google.generativeai
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_prompt
        )
        
        # Async model call
        response = await model.generate_content_async(
            contents=user_prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.4
            }
        )
        
        raw_text = response.text
        logger.info("Successfully received and parsed response from Gemini fallback.")
        return json.loads(raw_text)
    except Exception as gemini_e:
        logger.error(f"Gemini fallback API call failed: {str(gemini_e)}")
        raise ValueError(
            f"Both primary Groq API and fallback Gemini API failed. "
            f"Groq error: {str(e) if 'e' in locals() else 'Not initialized'}. "
            f"Gemini error: {str(gemini_e)}"
        )
