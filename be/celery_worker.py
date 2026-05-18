"""
Celery worker entry point
Run with: celery -A celery_worker worker --pool=solo --loglevel=info
"""
from celery import Celery
from app.core.config import settings

# Create Celery app
app = Celery(
    "fracture_detection",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configure Celery
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    worker_pool='solo',
)

# Import tasks to register them
from app.tasks.fracture_tasks import run_ai_prediction
from app.tasks.document_tasks import process_document

# Register tasks
app.task(name='app.tasks.fracture_tasks.run_ai_prediction')(run_ai_prediction)
app.task(name='app.tasks.document_tasks.process_document')(process_document)