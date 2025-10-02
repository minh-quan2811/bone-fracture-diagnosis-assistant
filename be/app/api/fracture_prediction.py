import os
import shutil
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.fracture_prediction import FracturePrediction, FractureDetection
from app.enums.prediction_source import PredictionSource
from app.schemas.fracture_prediction import (
    FracturePredictionOut,
    StudentAnnotationsSubmit,
    PredictionComparison
)
from app.services.bone_fracture_predict.predictor import fracture_predictor

router = APIRouter()

# Configuration
UPLOAD_DIRECTORY = "uploads/fracture_images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

def validate_image_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )

def save_uploaded_file(file: UploadFile, user_id: int) -> str:
    timestamp = int(time.time())
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"user_{user_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

@router.post("/upload", response_model=FracturePredictionOut)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload an image for fracture prediction (without running AI prediction yet)"""
    validate_image_file(file)
    
    try:
        # Save uploaded file
        file_path = save_uploaded_file(file, current_user.id)
        
        # Read file to get dimensions
        file.file.seek(0)
        file_content = await file.read()
        
        # Get basic image info without running prediction
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(file_content))
        width, height = img.size
        
        # Create prediction record without AI results
        db_prediction = FracturePrediction(
            user_id=current_user.id,
            image_filename=file.filename,
            image_path=file_path,
            image_size=len(file_content),
            image_width=width,
            image_height=height,
            image_format=os.path.splitext(file.filename)[1][1:].lower(),
            has_student_predictions=False,
            has_ai_predictions=False,
            student_prediction_count=0,
            ai_prediction_count=0,
            model_version="YOLOv8",
            confidence_threshold=fracture_predictor.confidence_threshold
        )
        
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        return db_prediction
        
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/predictions/{prediction_id}/student-annotations")
async def submit_student_annotations(
    prediction_id: int,
    annotations: StudentAnnotationsSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit student annotations for a prediction"""
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    try:
        # Remove existing student annotations
        db.query(FractureDetection).filter(
            FractureDetection.prediction_id == prediction_id,
            FractureDetection.source == PredictionSource.STUDENT
        ).delete()
        
        # Add new student annotations
        for annotation in annotations.annotations:
            db_detection = FractureDetection(
                prediction_id=prediction_id,
                source=PredictionSource.STUDENT,
                class_id=0,
                class_name="fracture",
                confidence=None,
                fracture_type=annotation.fracture_type,
                body_region=annotation.body_region,
                x_min=annotation.x_min,
                y_min=annotation.y_min,
                x_max=annotation.x_max,
                y_max=annotation.y_max,
                width=annotation.width,
                height=annotation.height,
                student_notes=annotation.notes
            )
            db.add(db_detection)
        
        # Update prediction record
        prediction.has_student_predictions = len(annotations.annotations) > 0
        prediction.student_prediction_count = len(annotations.annotations)
        prediction.student_predictions_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prediction)
        
        return {"message": "Student annotations saved successfully", "count": len(annotations.annotations)}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save annotations: {str(e)}"
        )

@router.post("/predictions/{prediction_id}/ai-predict", response_model=dict)
async def run_ai_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run AI prediction on an uploaded image"""
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if not os.path.exists(prediction.image_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file not found")
    
    try:
        # Read image file
        with open(prediction.image_path, 'rb') as f:
            file_content = f.read()
        
        # Get AI prediction
        prediction_result = fracture_predictor.predict(file_content)
        
        # Remove existing AI predictions
        db.query(FractureDetection).filter(
            FractureDetection.prediction_id == prediction_id,
            FractureDetection.source == PredictionSource.AI
        ).delete()
        
        # Save AI detections
        for detection in prediction_result["detections"]:
            bbox = detection["bounding_box"]
            db_detection = FractureDetection(
                prediction_id=prediction_id,
                source=PredictionSource.AI,
                class_id=detection["class_id"],
                class_name=detection["class_name"],
                confidence=detection["confidence"],
                fracture_type=detection.get("fracture_type"),
                body_region=detection.get("body_region"),
                x_min=bbox["x_min"],
                y_min=bbox["y_min"],
                x_max=bbox["x_max"],
                y_max=bbox["y_max"],
                width=bbox["width"],
                height=bbox["height"]
            )
            db.add(db_detection)
        
        # Update prediction record
        prediction.has_ai_predictions = prediction_result["detection_count"] > 0
        prediction.ai_prediction_count = prediction_result["detection_count"]
        prediction.ai_max_confidence = prediction_result["max_confidence"]
        prediction.ai_inference_time = prediction_result["inference_time"]
        prediction.ai_predictions_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prediction)
        
        return {
            "message": "AI prediction completed successfully",
            "has_fracture": prediction_result["has_fracture"],
            "detection_count": prediction_result["detection_count"],
            "max_confidence": prediction_result["max_confidence"],
            "inference_time": prediction_result["inference_time"]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI prediction failed: {str(e)}"
        )

@router.get("/predictions/{prediction_id}/comparison", response_model=PredictionComparison)
def get_prediction_comparison(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comparison between student and AI predictions"""
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Get student and AI detections separately
    student_detections = db.query(FractureDetection).filter(
        FractureDetection.prediction_id == prediction_id,
        FractureDetection.source == PredictionSource.STUDENT
    ).all()
    
    ai_detections = db.query(FractureDetection).filter(
        FractureDetection.prediction_id == prediction_id,
        FractureDetection.source == PredictionSource.AI
    ).all()
    
    # Calculate comparison metrics
    comparison_metrics = {
        "student_count": len(student_detections),
        "ai_count": len(ai_detections),
        "both_found_fractures": len(student_detections) > 0 and len(ai_detections) > 0,
        "student_only": len(student_detections) > 0 and len(ai_detections) == 0,
        "ai_only": len(student_detections) == 0 and len(ai_detections) > 0,
        "both_normal": len(student_detections) == 0 and len(ai_detections) == 0,
        "fracture_type_matches": sum(1 for s in student_detections for a in ai_detections 
                                     if s.fracture_type and a.fracture_type and s.fracture_type == a.fracture_type),
        "body_region_matches": sum(1 for s in student_detections for a in ai_detections 
                                   if s.body_region and a.body_region and s.body_region == a.body_region)
    }
    
    return PredictionComparison(
        prediction_id=prediction_id,
        image_filename=prediction.image_filename,
        student_detections=student_detections,
        ai_detections=ai_detections,
        comparison_metrics=comparison_metrics
    )

@router.get("/predictions/{prediction_id}", response_model=FracturePredictionOut)
def get_prediction_details(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific fracture prediction."""
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return prediction