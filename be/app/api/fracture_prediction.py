import os
import shutil
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import datetime
from PIL import Image
import io

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
from app.services.annotation_comparision import comparison_service

router = APIRouter()

# Configuration
UPLOAD_DIRECTORY = "uploads/fracture_images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
TARGET_SIZE = (640, 640)  # Standard size for YOLO models

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

def resize_image_to_640(image_bytes: bytes) -> tuple[bytes, int, int, dict]:
    """
    Resize image to 640x640 while maintaining aspect ratio with padding.
    Returns: (resized_image_bytes, original_width, original_height, padding_info)
    """
    img = Image.open(io.BytesIO(image_bytes))
    original_width, original_height = img.size
    
    # Convert RGBA to RGB if necessary
    if img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Calculate aspect ratio and resize with padding
    aspect_ratio = original_width / original_height
    
    if aspect_ratio > 1:
        new_width = TARGET_SIZE[0]
        new_height = int(TARGET_SIZE[0] / aspect_ratio)
    else:
        new_height = TARGET_SIZE[1]
        new_width = int(TARGET_SIZE[1] * aspect_ratio)
    
    # Resize image
    img = img.resize((new_width, new_height), Image.LANCZOS)
    
    # Create new image with padding
    new_img = Image.new('RGB', TARGET_SIZE, (0, 0, 0))
    paste_x = (TARGET_SIZE[0] - new_width) // 2
    paste_y = (TARGET_SIZE[1] - new_height) // 2
    new_img.paste(img, (paste_x, paste_y))
    
    # Store padding info for frontend coordinate mapping
    padding_info = {
        "offset_x": paste_x,
        "offset_y": paste_y,
        "content_width": new_width,
        "content_height": new_height
    }
    
    # Convert back to bytes
    output = io.BytesIO()
    new_img.save(output, format='JPEG', quality=95)
    resized_bytes = output.getvalue()
    
    return resized_bytes, original_width, original_height, padding_info

def save_uploaded_file(file_bytes: bytes, filename: str, user_id: int) -> str:
    timestamp = int(time.time())
    file_ext = os.path.splitext(filename)[1].lower()
    unique_filename = f"user_{user_id}_{timestamp}_{filename}"
    file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)
    
    return file_path.replace('\\', '/')

@router.post("/upload", response_model=FracturePredictionOut)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and resize image to 640x640 for fracture prediction"""
    validate_image_file(file)
    
    try:
        # Read original file
        file_content = await file.read()
        
        # Resize image to 640x640
        resized_bytes, original_width, original_height, padding_info = resize_image_to_640(file_content)
        
        # Save resized image
        file_path = save_uploaded_file(resized_bytes, file.filename, current_user.id)
        
        # Create prediction record with padding info
        db_prediction = FracturePrediction(
            user_id=current_user.id,
            image_filename=file.filename,
            image_path=file_path,
            image_size=len(resized_bytes),
            image_width=640,  # Always 640 after resize
            image_height=640,  # Always 640 after resize
            image_format=os.path.splitext(file.filename)[1][1:].lower(),
            has_student_predictions=False,
            has_ai_predictions=False,
            student_prediction_count=0,
            ai_prediction_count=0,
            model_version="YOLOv8",
            confidence_threshold=fracture_predictor.confidence_threshold
        )
        
        # Store padding info in a custom field or return it separately
        # For now, we'll add it to the response
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        # Add padding info to response
        response_dict = {
            **db_prediction.__dict__,
            "padding_info": padding_info
        }
        
        return response_dict
        
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
    
    if prediction.has_ai_predictions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revise student predictions after AI comparison has been run"
        )
    
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
        prediction.has_student_predictions = True
        prediction.student_prediction_count = len(annotations.annotations)
        prediction.student_predictions_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prediction)
        
        message = (
            f"Student annotations saved: {len(annotations.annotations)} fracture(s) detected" 
            if len(annotations.annotations) > 0 
            else "Student prediction saved: No fractures detected"
        )
        
        return {
            "message": message,
            "count": len(annotations.annotations),
            "no_fracture_predicted": len(annotations.annotations) == 0,
            "can_revise": not prediction.has_ai_predictions
        }
        
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
    """Run AI prediction on a 640x640 resized image"""
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if not os.path.exists(prediction.image_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file not found")
    
    try:
        # Read the already resized 640x640 image
        with open(prediction.image_path, 'rb') as f:
            file_content = f.read()
        
        # Run AI prediction
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
    """Get detailed comparison between student and AI predictions"""
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if not prediction.has_student_predictions or not prediction.has_ai_predictions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both student and AI predictions are required for comparison"
        )
    
    student_detections = db.query(FractureDetection).filter(
        FractureDetection.prediction_id == prediction_id,
        FractureDetection.source == PredictionSource.STUDENT
    ).all()
    
    ai_detections = db.query(FractureDetection).filter(
        FractureDetection.prediction_id == prediction_id,
        FractureDetection.source == PredictionSource.AI
    ).all()
    
    comparison_result = comparison_service.compare_predictions(
        student_detections,
        ai_detections
    )
    
    feedback = comparison_service.generate_feedback(comparison_result)
    
    legacy_metrics = {
        "student_count": comparison_result['summary']['student_count'],
        "ai_count": comparison_result['summary']['ai_count'],
        "both_found_fractures": comparison_result['summary']['both_found_fractures'],
        "student_only": comparison_result['summary']['student_only'],
        "ai_only": comparison_result['summary']['ai_only'],
        "both_normal": comparison_result['summary']['both_normal'],
        "fracture_type_matches": comparison_result['fracture_type_metrics']['correct_count'],
    }
    
    return PredictionComparison(
        prediction_id=prediction_id,
        image_filename=prediction.image_filename,
        student_detections=student_detections,
        ai_detections=ai_detections,
        comparison_metrics=legacy_metrics,
        detailed_comparison=comparison_result,
        feedback=feedback
    )

@router.get("/predictions/{prediction_id}", response_model=FracturePredictionOut)
def get_prediction_details(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific fracture prediction"""
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return prediction

@router.get("/predictions", response_model=List[FracturePredictionOut])
def get_all_predictions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all fracture predictions for the current logged-in user"""
    query = db.query(FracturePrediction).filter(
        FracturePrediction.user_id == current_user.id
    )
    
    query = query.order_by(FracturePrediction.created_at.desc())
    predictions = query.offset(skip).limit(limit).all()
    
    return predictions