from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.message import MessageOut

class ConversationCreate(BaseModel):
    title: Optional[str] = None

class ConversationOut(BaseModel):
    id: int
    title: Optional[str]
    user_id: int
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True
