from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.core.database import get_db
from app.models.user import User
from app.services.user_service import user_service
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user from JWT token"""
    token = credentials.credentials
    result, status_code = user_service.get_user_by_token(token, db)
    
    if status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error")
        )
    
    # Return the actual user object from database
    email = result.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    result, status_code = user_service.register_user(
        user.username, user.email, user.password, user.is_admin, db
    )
    
    if status_code != 201:
        raise HTTPException(status_code=status_code, detail=result.get("error"))
    
    return UserResponse(
        id=result["id"],
        username=result["username"],
        email=result["email"],
        is_admin=result["is_admin"],
        role=result["role"]
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    result, status_code = user_service.login_user(payload.email, payload.password, db)
    
    if status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error")
        )
    
    return TokenResponse(
        access_token=result["access_token"],
        token_type=result["token_type"]
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    token = credentials.credentials
    result, status_code = user_service.get_user_by_token(token, db)
    
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error"))
    
    return UserResponse(
        id=result["id"],
        username=result["username"],
        email=result["email"],
        is_admin=result["is_admin"],
        role=result["role"]
    )