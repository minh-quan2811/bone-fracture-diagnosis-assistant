import os
import shutil
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.fracture_prediction import FracturePrediction, FractureDetection
from app.schemas.fracture_prediction import (
    FracturePredictionOut,
    PredictionSummary,
    YOLOv8Response,
    PredictionStats
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

@router.post("/predict", response_model=FracturePredictionOut)
async def predict_fracture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    validate_image_file(file)
    
    try:
        # Save uploaded file
        file_path = save_uploaded_file(file, current_user.id)
        
        # Read file for prediction
        file.file.seek(0)
        file_content = await file.read()
        
        # Get YOLOv8 prediction
        prediction_result = fracture_predictor.predict(file_content)
        
        # Create prediction record
        db_prediction = FracturePrediction(
            user_id=current_user.id,
            image_filename=file.filename,
            image_path=file_path,
            image_size=len(file_content),
            image_width=prediction_result["image_dimensions"]["width"],
            image_height=prediction_result["image_dimensions"]["height"],
            image_format=os.path.splitext(file.filename)[1][1:].lower(),
            has_fracture=prediction_result["has_fracture"],
            detection_count=prediction_result["detection_count"],
            max_confidence=prediction_result["max_confidence"],
            model_version="YOLOv8",
            inference_time=prediction_result["inference_time"],
            confidence_threshold=fracture_predictor.confidence_threshold
        )
        
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        # Save individual detections
        for detection in prediction_result["detections"]:
            bbox = detection["bounding_box"]
            db_detection = FractureDetection(
                prediction_id=db_prediction.id,
                class_id=detection["class_id"],
                class_name=detection["class_name"],
                confidence=detection["confidence"],
                x_min=bbox["x_min"],
                y_min=bbox["y_min"],
                x_max=bbox["x_max"],
                y_max=bbox["y_max"],
                width=bbox["width"],
                height=bbox["height"]
            )
            db.add(db_detection)
        
        db.commit()
        db.refresh(db_prediction)
        
        return db_prediction
        
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/test-prediction", response_model=YOLOv8Response)
async def test_prediction(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    validate_image_file(file)
    
    try:
        file_content = await file.read()
        result = fracture_predictor.predict(file_content)
        return YOLOv8Response(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test prediction failed: {str(e)}"
        )

@router.get("/predictions", response_model=List[PredictionSummary])
def get_predictions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    has_fracture: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FracturePrediction).filter(FracturePrediction.user_id == current_user.id)
    
    if has_fracture is not None:
        query = query.filter(FracturePrediction.has_fracture == has_fracture)
    
    predictions = query.order_by(FracturePrediction.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        PredictionSummary(
            id=p.id,
            image_filename=p.image_filename,
            has_fracture=p.has_fracture,
            detection_count=p.detection_count,
            max_confidence=p.max_confidence,
            created_at=p.created_at
        )
        for p in predictions
    ]

@router.get("/predictions/{prediction_id}", response_model=FracturePredictionOut)
def get_prediction_details(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return prediction

@router.get("/predictions/{prediction_id}/image")
def get_prediction_image(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if not os.path.exists(prediction.image_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file not found")
    
    return FileResponse(prediction.image_path, media_type="image/jpeg", filename=prediction.image_filename)

@router.delete("/predictions/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(FracturePrediction).filter(FracturePrediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Delete image file
    if os.path.exists(prediction.image_path):
        try:
            os.remove(prediction.image_path)
        except Exception as e:
            print(f"Warning: Could not delete image file: {e}")
    
    # Delete database records
    db.delete(prediction)
    db.commit()
    
    return {"message": "Prediction deleted successfully"}

@router.get("/stats", response_model=PredictionStats)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(FracturePrediction).filter(FracturePrediction.user_id == current_user.id).count()
    
    fracture_count = db.query(FracturePrediction).filter(
        FracturePrediction.user_id == current_user.id,
        FracturePrediction.has_fracture == True
    ).count()
    
    avg_confidence = db.query(func.avg(FracturePrediction.max_confidence)).filter(
        FracturePrediction.user_id == current_user.id,
        FracturePrediction.max_confidence.isnot(None)
    ).scalar()
    
    return PredictionStats(
        total_predictions=total,
        fracture_predictions=fracture_count,
        normal_predictions=total - fracture_count,
        average_confidence=float(avg_confidence) if avg_confidence else 0.0
    )

@router.get("/model-info")
def get_model_info(current_user: User = Depends(get_current_user)):
    return fracture_predictor.get_model_info()