from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "fracture_detection",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        'app.tasks.fracture_tasks',
        'app.tasks.document_tasks',
        'app.tasks.memory_tasks'
    ]
)

celery_app.conf.update(
    task_routes={
        'app.tasks.fracture_tasks.run_ai_prediction': {'queue': 'fracture_queue'},
        'app.tasks.document_tasks.process_document': {'queue': 'document_queue'},
        'app.tasks.memory_tasks.record_turn': {'queue': 'memory_queue'},
        'app.tasks.memory_tasks.summarize_session': {'queue': 'memory_queue'},
    },
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)