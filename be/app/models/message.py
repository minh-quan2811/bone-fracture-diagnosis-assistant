from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.enums.roles import RoleEnum

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    role = Column(Enum(RoleEnum), nullable=False)

    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
