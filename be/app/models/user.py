from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Enum
from app.core.database import Base 
from app.enums.roles import RoleEnum

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(50), unique=True, nullable=False, index=True)

    email = Column(String(100), unique=True, nullable=False, index=True)

    hashed_password = Column(String(255), nullable=False)

    is_admin = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.STUDENT)