import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import firebase_admin
from firebase_admin import credentials

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.routers.analyze import router as analyze_router
from app.routers.resume import router as resume_router

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# 1. Initialize Firebase Admin SDK
firebase_initialized = False
try:
    sa_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
    if os.path.exists(sa_path):
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin successfully initialized from certificate.")
        firebase_initialized = True
    else:
        logger.warning(
            f"Firebase service account file '{sa_path}' was not found. "
            "Protected endpoints will fall back to developer bypass mode until the key is present."
        )
except Exception as e:
    logger.error(f"Error occurred during Firebase Admin SDK initialization: {str(e)}")

# 2. FastAPI Setup
app = FastAPI(
    title="AI LinkedIn Profile Reviewer API",
    description="Secure FastAPI proxy service for analyzing LinkedIn profiles.",
    version="1.0.0"
)

# 3. Rate Limiting setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 4. CORS config (supports requests from React development port 5173 and production urls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Routing
app.include_router(analyze_router)
app.include_router(resume_router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "firebase_active": firebase_initialized,
        "docs": "/docs"
    }
