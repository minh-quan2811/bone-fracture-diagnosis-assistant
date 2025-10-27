import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.fracture_prediction import FracturePrediction, FractureDetection
from app.enums.prediction_source import PredictionSource
from app.enums.fracture_type import FractureType
from app.schemas.fracture_prediction import (
    FracturePredictionOut,
    StudentAnnotationsSubmit,
    PredictionComparison
)
from app.services.bone_fracture_predict.predictor import fracture_predictor
from app.services.annotation_comparision import comparison_service

router = APIRouter()


@router.post("/predictions/{prediction_id}/student-annotations")
async def submit_student_annotations(
    prediction_id: int,
    annotations: StudentAnnotationsSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit student annotations for a prediction"""
    prediction = db.query(FracturePrediction).filter(
        FracturePrediction.id == prediction_id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Prediction not found"
        )
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied"
        )
    
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
    prediction = db.query(FracturePrediction).filter(
        FracturePrediction.id == prediction_id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Prediction not found"
        )
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied"
        )
    
    if not os.path.exists(prediction.image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Image file not found"
        )
    
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
            
            # Ensure fracture_type is properly set
            fracture_type_value = detection.get("fracture_type")
            
            # Convert string to enum if needed
            if fracture_type_value and isinstance(fracture_type_value, str):
                try:
                    fracture_type_enum = FractureType(fracture_type_value.lower())
                except ValueError:
                    print(f"Warning: Invalid fracture_type '{fracture_type_value}', setting to None")
                    fracture_type_enum = None
            else:
                fracture_type_enum = fracture_type_value
            
            db_detection = FractureDetection(
                prediction_id=prediction_id,
                source=PredictionSource.AI,
                class_id=detection["class_id"],
                class_name=detection["class_name"],
                confidence=detection["confidence"],
                fracture_type=fracture_type_enum,  # Properly set fracture_type
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
        
        # Log for debugging
        print(f"AI Prediction completed: {prediction_result['detection_count']} detections")
        for i, det in enumerate(prediction_result["detections"]):
            print(f"  Detection {i+1}: class_id={det['class_id']}, fracture_type={det.get('fracture_type')}, confidence={det['confidence']:.2f}")
        
        return {
            "message": "AI prediction completed successfully",
            "has_fracture": prediction_result["has_fracture"],
            "detection_count": prediction_result["detection_count"],
            "max_confidence": prediction_result["max_confidence"],
            "inference_time": prediction_result["inference_time"]
        }
        
    except Exception as e:
        db.rollback()
        print(f"AI prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
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
    prediction = db.query(FracturePrediction).filter(
        FracturePrediction.id == prediction_id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Prediction not found"
        )
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied"
        )
    
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
    prediction = db.query(FracturePrediction).filter(
        FracturePrediction.id == prediction_id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Prediction not found"
        )
    
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied"
        )
    
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