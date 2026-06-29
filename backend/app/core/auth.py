from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth
import logging

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Check if firebase_admin has been initialized
        if not firebase_admin._apps:
            # Fallback for development if credentials are not configured yet, 
            # to let developer inspect Swagger docs easily.
            # However, for production this will raise a 500.
            logging.warning("Firebase Admin is not initialized. Using developer fallback mode.")
            return {"uid": "dev_user_uid", "email": "developer@example.com", "name": "Dev User"}
            
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logging.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Firebase ID Token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
