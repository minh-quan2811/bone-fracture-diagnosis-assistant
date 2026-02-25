from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "fracture_detection",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_routes={
        'app.tasks.document_tasks.*': {'queue': 'document_queue'},
        'app.tasks.fracture_tasks.*': {'queue': 'fracture_queue'},
    }
)

celery_app.autodiscover_tasks(['app.tasks'])

from app.tasks import document_tasks, fracture_tasks