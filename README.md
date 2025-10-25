# bone-fracture-diagnosis-assistant

A comprehensive web application for medical students to learn bone fracture detection through AI-assisted education. The platform combines interactive chatbot assistance, AI-powered fracture detection, and document-based learning with RAG (Retrieval Augmented Generation).

# Overview
This platform bridges theoretical medical education with practical diagnostic skills:

Fracture Detection Engine: Deep learning model trained on X-ray images for bone fracture identification
Conversational AI: LangChain/LangGraph-based chatbot for medical Q&A and learning guidance
RAG System: LlamaIndex pipeline with Qdrant vector store for document-enhanced responses
Learning Model: Students annotate → AI predicts → System compares → Feedback provided
Supported Fracture Types: Not yet decide
Body Regions: Not yet decide

## Project Structure

```
.
├── be/                 # Backend (FastAPI)
│   ├── alembic/       # Database migrations
│   ├── app/           # Application code
│   └── requirements.txt
├── fe/                # Frontend (Next.js)
    ├── app/          # Next.js pages
    ├── components/   # React components
    ├── lib/          # API client
    └── package.json
```

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI/ML**: 
  - Deep Learning model for bone fracture detection
  - Custom embedding pipeline for RAG
  - Vector database for document storage
- **Migration**: Alembic

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS


## Features

### Student Features
- **Interactive Chatbot**: Ask questions about bone fractures, treatments, and symptoms
- **Fracture Detection Practice**: 
  - Upload X-ray images for analysis
  - Make your own fracture predictions
  - Compare your predictions with AI model results
  - Receive detailed feedback on accuracy
- **Document Upload & RAG**: Upload medical documents (PDF, DOCX,..) for context-aware chatbot responses

### Teacher Features
- Dashboard access for monitoring student progress
- Administrative capabilities
