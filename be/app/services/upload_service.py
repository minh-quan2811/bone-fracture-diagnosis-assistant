import os
from typing import Dict, Tuple, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.fracture_prediction import FracturePrediction
from app.models.document_upload import DocumentUpload
from app.enums.document_status import DocumentStatus
from app.services.bone_fracture_predict.predictor import fracture_predictor
from app.services.rag_service import VectorStorageManager
from app.services.embedding_service import EmbeddingPipeline
from app.utils.image_utils import resize_image_to_640, save_uploaded_file
from app.utils.document_utils import save_document_file


class UploadService:
    """Business logic for file uploads"""
    
    @staticmethod
    def upload_image(
        file_content: bytes,
        filename: str,
        current_user: User,
        db: Session
    ) -> Tuple[Dict, int]:
        """
        Upload and process a fracture image
        """
        try:
            # Resize image to 640x640
            resized_bytes, original_width, original_height, padding_info = resize_image_to_640(file_content)
            
            # Save resized image
            file_path = save_uploaded_file(resized_bytes, filename, current_user.id)
            
            # Create prediction record with padding info
            db_prediction = FracturePrediction(
                user_id=current_user.id,
                image_filename=filename,
                image_path=file_path,
                image_size=len(resized_bytes),
                image_width=640,
                image_height=640,
                image_format=os.path.splitext(filename)[1][1:].lower(),
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
                "padding_info": padding_info,
                "status": 200
            }
            
            return response_dict, 200
            
        except Exception as e:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            
            return {
                "error": f"Upload failed: {str(e)}",
                "status": 500
            }, 500
    
    @staticmethod
    def upload_document(
        file_content: bytes,
        filename: str,
        current_user: User,
        collection_name: str,
        index_id: str,
        db: Session
    ) -> Tuple[Dict, int]:
        """
        Upload and process a document (PDF, DOCX)
        """
        file_path = None
        
        # Create initial document upload record
        db_document = DocumentUpload(
            user_id=current_user.id,
            filename=filename,
            file_type=os.path.splitext(filename)[1][1:].lower(),
            status=DocumentStatus.UPLOADING
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        try:
            file_path = save_document_file(file_content, filename, current_user.id)
            
            # Update status to processing
            db_document.status = DocumentStatus.PROCESSING
            db.commit()
            
            # Process file through embedding pipeline
            embedding_pipeline = EmbeddingPipeline()
            nodes = embedding_pipeline.process_file(file_path=file_path, embed_nodes=True)
            
            # Store nodes in vector database
            storage_manager = VectorStorageManager(
                collection_name=collection_name,
                index_id=index_id
            )
            
            storage_manager.add_nodes_to_db(nodes=nodes, insert_batch_size=20)
            
            # Update status to completed
            db_document.status = DocumentStatus.COMPLETED
            db.commit()
            db.refresh(db_document)
            
            return {
                "id": db_document.id,
                "filename": db_document.filename,
                "file_type": db_document.file_type,
                "status": db_document.status.value,
                "created_at": db_document.created_at.isoformat(),
                "message": "Document processed successfully",
                "status_code": 200
            }, 200
            
        except ValueError as ve:
            # Update status to failed
            db_document.status = DocumentStatus.FAILED
            db.commit()
            
            # Clean up file if processing failed
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
            
            return {
                "error": str(ve),
                "status": 400
            }, 400
            
        except Exception as e:
            # Update status to failed
            db_document.status = DocumentStatus.FAILED
            db.commit()
            
            # Clean up file if processing failed
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
            
            return {
                "error": f"Document processing failed: {str(e)}",
                "status": 500
            }, 500
    
    @staticmethod
    def get_document_history(
        current_user: User,
        db: Session
    ) -> list:
        """
        Get all document uploads for the current user
        """
        documents = db.query(DocumentUpload)\
            .filter(DocumentUpload.user_id == current_user.id)\
            .order_by(DocumentUpload.created_at.desc())\
            .all()
        
        return documents


upload_service = UploadService()