from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from celery.result import AsyncResult

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from celery_app import celery_app

router = APIRouter()


@router.get("/tasks/{task_id}")
def get_task_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get status of a Celery task
    
    Returns:
        - PENDING: Task is waiting
        - SUCCESS: Task completed successfully
        - FAILURE: Task failed
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.state == 'PENDING':
        return {
            "status": "PENDING",
            "result": None
        }
    elif task_result.state == 'SUCCESS':
        return {
            "status": "SUCCESS",
            "result": task_result.result
        }
    elif task_result.state == 'FAILURE':
        return {
            "status": "FAILURE",
            "error": str(task_result.info)
        }
    else:
        return {
            "status": task_result.state,
            "result": None
        }