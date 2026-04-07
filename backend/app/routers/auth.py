import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from ..database import get_db
from ..models.user import User, Role
from ..schemas.user import Token, UserRead, UserCreate
from ..services.auth import AuthService
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = AuthService.decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.email == form_data.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning(f"Login failure: User not found for email {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not AuthService.verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Login failure: Incorrect password for user {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = AuthService.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "full_name": user.full_name
    }

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/google", response_model=Token)
async def google_login(
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    """Verify a Google ID token and log in the user if they already have an account."""
    credential = payload.get("credential")
    if not credential:
        raise HTTPException(status_code=400, detail="Missing Google credential token")
    
    # Verify the token with Google's API
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        logger.warning(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    email = id_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google")
    
    # Check if user exists in our database
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning(f"Google login blocked: No account found for {email}")
        raise HTTPException(
            status_code=403,
            detail="No account found for this Google email. Please contact your administrator to get access."
        )
    
    # Issue our own JWT token
    access_token = AuthService.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    logger.info(f"Google login success for {email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name
    }
