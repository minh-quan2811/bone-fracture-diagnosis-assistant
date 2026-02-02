from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.schemas.fracture_prediction import FracturePredictionOut
from app.schemas.document_upload import DocumentUploadOut
from app.utils.image_utils import validate_image_file
from app.utils.document_utils import validate_document_file
from app.services.upload_service import upload_service

router = APIRouter()


@router.post("/image", response_model=FracturePredictionOut)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and resize image to 640x640 for fracture prediction"""
    validate_image_file(file)
    
    try:
        file_content = await file.read()
        result, status_code = upload_service.upload_image(file_content, file.filename, current_user, db)
        
        if status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.post("/document", response_model=DocumentUploadOut)
async def upload_document(
    file: UploadFile = File(...),
    collection_name: str = "medical_documents",
    index_id: str = "medical_doc_index",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document (PDF, DOCX) and process it through the embedding pipeline.
    The document will be parsed, chunked, embedded, and stored in the vector database.
    """
    validate_document_file(file)
    
    try:
        file_content = await file.read()
        result, status_code = upload_service.upload_document(
            file_content, file.filename, current_user, collection_name, index_id, db
        )
        
        if status_code == 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("error"))
        elif status_code == 500:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result.get("error"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}"
        )


@router.get("/documents/history", response_model=List[DocumentUploadOut])
async def get_document_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all document uploads for the current user"""
    documents = upload_service.get_document_history(current_user, db)
    return documents