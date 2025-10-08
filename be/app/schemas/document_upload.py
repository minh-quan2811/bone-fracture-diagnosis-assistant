from pydantic import BaseModel
from datetime import datetime
from app.enums.document_status import DocumentStatus
from typing import Optional

class DocumentUploadOut(BaseModel):
    id: int
    user_id: int
    filename: str
    file_type: Optional[str]
    status: DocumentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True