from celery_app import celery_app
from app.core.database import SessionLocal
from app.models.user import User
from app.services.upload_service import UploadService


@celery_app.task(name='app.tasks.document_tasks.process_document')
def process_document(user_id: int, file_content_b64: str, filename: str, collection_name: str, index_id: str):
    """
    Process document upload in background
    """
    import base64
    
    db = SessionLocal()
    try:
        # Decode file content
        file_content = base64.b64decode(file_content_b64)
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "error", "error": "User not found"}
        
        # Process document
        result, status_code = UploadService.upload_document(
            file_content=file_content,
            filename=filename,
            current_user=user,
            collection_name=collection_name,
            index_id=index_id,
            db=db
        )
        
        if status_code == 200:
            return {
                "status": "success",
                "result": {
                    "id": result["id"],
                    "filename": result["filename"],
                    "file_type": result["file_type"],
                    "status": result["status"],
                    "created_at": result["created_at"],
                    "storage_path": result.get("storage_path"),
                    "storage_mode": result.get("storage_mode"),
                    "message": result.get("message")
                }
            }
        else:
            return {"status": "error", "error": result.get("error", "Unknown error")}
            
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()