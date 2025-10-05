import os
import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from PIL import Image
import io

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.fracture_prediction import FracturePrediction
from app.schemas.fracture_prediction import FracturePredictionOut
from app.services.bone_fracture_predict.predictor import fracture_predictor

from app.services.rag_service import VectorStorageManager

from app.api.api_utils.image_utils import validate_image_file, resize_image_to_640, save_uploaded_file
from app.api.api_utils.document_utils import validate_document_file, save_document_file

router = APIRouter()

# IMAGE UPLOAD 
@router.post("/image", response_model=FracturePredictionOut)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and resize image to 640x640 for fracture prediction"""
    validate_image_file(file)
    
    try:
        # Read original file
        file_content = await file.read()
        
        # Resize image to 640x640
        resized_bytes, original_width, original_height, padding_info = resize_image_to_640(file_content)
        
        # Save resized image
        file_path = save_uploaded_file(resized_bytes, file.filename, current_user.id)
        
        # Create prediction record with padding info
        db_prediction = FracturePrediction(
            user_id=current_user.id,
            image_filename=file.filename,
            image_path=file_path,
            image_size=len(resized_bytes),
            image_width=640,
            image_height=640,
            image_format=os.path.splitext(file.filename)[1][1:].lower(),
            has_student_predictions=False,
            has_ai_predictions=False,
            student_prediction_count=0,
            ai_prediction_count=0,
            model_version="YOLOv8",
            confidence_threshold=fracture_predictor.confidence_threshold
        )
        
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        # Add padding info to response
        response_dict = {
            **db_prediction.__dict__,
            "padding_info": padding_info
        }
        
        return response_dict
        
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


# DOCUMENT UPLOAD
@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    collection_name: str = "medical_documents",
    index_id: str = "medical_doc_index",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document (PDF, DOCX) and process it into embeddings.
    The document will be saved and chunked into the vector database.
    """
    validate_document_file(file)
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Save document file
        file_path = save_document_file(file_content, file.filename, current_user.id)
        
        # Process document into nodes
        nodes = document_embedding_service.process_file_bytes(
            file_bytes=file_content,
            filename=file.filename
        )
        
        # Initialize storage manager and store nodes
        storage_manager = VectorStorageManager(
            collection_name=collection_name,
            index_id=index_id
        )
        
        storage_manager.add_nodes_to_db(nodes=nodes, insert_batch_size=20)
        
        return {
            "message": "Document uploaded and embedded successfully",
        }
        
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}"
        )