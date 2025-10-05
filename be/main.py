from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.database import engine, Base
from app.api import auth, student_chat, fracture_prediction

# create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bone Fracture Helper API")

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
uploads_path = "uploads"
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

app.include_router(auth, prefix="/auth", tags=["Auth"])
app.include_router(student_chat, prefix="/chat", tags=["Chat"])
app.include_router(fracture_prediction, prefix="/api/fracture", tags=["Fracture Detection"])


@app.get("/")
def root():
    return {
        "message": "Medical AI API with YOLOv8 Fracture Detection",
        "endpoints": {
            "auth": "/api/auth",
            "chat": "/api/chat",
            "fracture_detection": "/api/fracture"
        }
    }