from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.enums.roles import RoleEnum
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token


class UserService:
    """Business logic for user authentication and management"""
    
    @staticmethod
    def register_user(
        username: str,
        email: str,
        password: str,
        is_admin: bool,
        db: Session
    ) -> Tuple[Dict, int]:
        """
        Register a new user
        """
        # Check if user already exists
        exists = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
        
        if exists:
            return {
                "error": "User with email or username already exists",
                "status": 400
            }, 400
        
        try:
            # Determine role based on is_admin flag
            role = RoleEnum.TEACHER if is_admin else RoleEnum.STUDENT
            
            db_user = User(
                username=username,
                email=email,
                hashed_password=hash_password(password),
                is_admin=is_admin,
                role=role,
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
            return {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email,
                "is_admin": db_user.is_admin,
                "role": db_user.role.value,
                "status": 201
            }, 201
            
        except Exception as e:
            db.rollback()
            return {
                "error": f"Registration failed: {str(e)}",
                "status": 500
            }, 500
    
    @staticmethod
    def login_user(
        email: str,
        password: str,
        db: Session
    ) -> Tuple[Dict, int]:
        """
        Login a user and return access token
        """
        db_user = db.query(User).filter(User.email == email).first()
        
        if not db_user or not verify_password(password, db_user.hashed_password):
            return {
                "error": "Invalid credentials",
                "status": 401
            }, 401
        
        try:
            token = create_access_token({
                "sub": db_user.email,
                "is_admin": db_user.is_admin,
                "username": db_user.username,
                "role": db_user.role.value
            })
            
            return {
                "access_token": token,
                "token_type": "bearer",
                "status": 200
            }, 200
            
        except Exception as e:
            return {
                "error": f"Login failed: {str(e)}",
                "status": 500
            }, 500
    
    @staticmethod
    def get_user_by_token(
        token: str,
        db: Session
    ) -> Tuple[Optional[Dict], int]:
        """
        Get user information from token
        """
        payload = decode_access_token(token)
        
        if not payload:
            return {
                "error": "Invalid or expired token",
                "status": 401
            }, 401
        
        email = payload.get("sub")
        
        if not email:
            return {
                "error": "Invalid token payload",
                "status": 401
            }, 401
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return {
                "error": "User not found",
                "status": 404
            }, 404
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "role": user.role.value,
            "status": 200
        }, 200
    
    @staticmethod
    def verify_token(token: str) -> bool:
        """
        Verify if a token is valid
        """
        payload = decode_access_token(token)
        return payload is not None


user_service = UserService()