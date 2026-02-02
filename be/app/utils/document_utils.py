import os
import time
from fastapi import HTTPException, status, UploadFile

DOCUMENT_UPLOAD_DIRECTORY = "uploads/medical_documents"
DOCUMENT_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
DOCUMENT_MAX_FILE_SIZE = 50 * 1024 * 1024

os.makedirs(DOCUMENT_UPLOAD_DIRECTORY, exist_ok=True)


def validate_document_file(file: UploadFile) -> None:
    """Validate uploaded document file"""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in DOCUMENT_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Supported: {', '.join(DOCUMENT_ALLOWED_EXTENSIONS)}"
        )

    if getattr(file, "size", None) and file.size > DOCUMENT_MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {DOCUMENT_MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )


def save_document_file(file_bytes: bytes, filename: str, user_id: int) -> str:
    """Save uploaded document to disk"""
    timestamp = int(time.time())
    unique_filename = f"user_{user_id}_{timestamp}_{filename}"
    file_path = os.path.join(DOCUMENT_UPLOAD_DIRECTORY, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)

    return file_path.replace("\\", "/")
