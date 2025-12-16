# Backend - Medical AI Learning Platform

FastAPI-based backend for the Medical AI Learning Platform, providing authentication, chatbot API, fracture detection, and document processing.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Student Chatbot**: AI-powered medical assistant for bone fracture education
- **Fracture Detection**: YOLOv8-based fracture detection from X-ray images
- **Document Processing**: RAG pipeline with embedding and vector storage
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic for database version control

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migration tool
- **PostgreSQL**: Primary database
- **Pillow**: Image processing
- **PyTorch**: Deep learning framework for YOLOv8
- **JWT**: Token-based authentication
- **LangChain & LangGraph**: Conversational AI framework for building the chatbot
- **LlamaIndex**: RAG (Retrieval Augmented Generation) framework for document processing
- **Qdrant**: Vector database for storing document embeddings

## Project Structure

```
be/
├── alembic/
│   ├── versions/          # Migration files
│   ├── env.py             # Alembic configuration
│   └── script.py.mako     # Migration template
├── app/
│   ├── api/               # API endpoints
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── student_chat.py # Chatbot endpoints
│   │   ├── fracture_prediction.py # Fracture detection endpoints
│   │   ├── upload.py      # File upload endpoints
│   │   └── api_utils/     # Utility functions
│   ├── core/              # Core functionality
│   │   ├── config.py      # Configuration
│   │   ├── database.py    # Database connection
│   │   └── security.py    # Security utilities
│   ├── models/            # SQLAlchemy models
│   │   ├── user.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   ├── fracture_prediction.py
│   │   └── document_upload.py
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   │   ├── student_chatbot.py
│   │   ├── bone_fracture_predict/
│   │   ├── rag_service.py
│   │   └── embedding_service.py
│   ├── enums/             # Enum definitions
│   └── main.py            # Application entry point
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Installation

### Prerequisites
- Python 3.9 or higher
- PostgreSQL 13 or higher
- pip package manager

### Setup Steps

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