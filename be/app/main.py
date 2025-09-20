from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import auth, student_chat

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

app.include_router(auth, prefix="/auth", tags=["Auth"])
app.include_router(student_chat.router, prefix="/chat", tags=["Chat"])
