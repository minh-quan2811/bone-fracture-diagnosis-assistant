# Backend - Medical AI Learning Platform

FastAPI-based backend for the Medical AI Learning Platform, providing authentication, chatbot API, fracture detection, and document processing.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Student Chatbot**: AI-powered medical assistant for bone fracture education
- **Fracture Detection**: YOLOv8-based fracture detection from X-ray images
- **Document Processing**: RAG pipeline with embedding and vector storage
- **Async Tasks**: Celery workers for background AI processing
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations

## Tech Stack

- **FastAPI** — Python web framework
- **PostgreSQL** — primary database
- **Redis** — message broker for Celery
- **Celery** — async task queue
- **SQLAlchemy + Alembic** — ORM and migrations
- **PyTorch + YOLOv8** — bone fracture detection model
- **LangChain + LangGraph** — conversational AI framework
- **LlamaIndex** — RAG framework for document processing
- **Qdrant** — vector database for embeddings
- **AWS S3** — file storage for images and documents

## Installation

### Prerequisites
- Python 3.11 or higher
- PostgreSQL 13 or higher
- pip package manager

# Setup Steps

## Option 1 — Without Docker
1. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```

4. **Run migrations**:
```bash
alembic upgrade head
```

5. **Start development server**:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 6. Start the Celery worker (separate terminal)

```bash
celery -A celery_app worker -Q fracture_queue,document_queue --loglevel=info --pool=solo
```

## Option 2 — With Docker

### 1. Build and start all containers

```bash
docker compose up --build
```

To run in the background:

```bash
docker compose up --build -d
```

### 2. View logs

```bash
# All containers
docker compose logs -f

# API only
docker compose logs -f api

# Celery only
docker compose logs -f celery_worker
```

### 3. Stop all containers

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```