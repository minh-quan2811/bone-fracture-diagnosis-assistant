from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, func
from app.core.database import Base
from app.enums.document_status import DocumentStatus

class DocumentUpload(Base):
    __tablename__ = "document_uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    status = Column(
        Enum(DocumentStatus, name='documentstatus', values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=DocumentStatus.UPLOADING
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())