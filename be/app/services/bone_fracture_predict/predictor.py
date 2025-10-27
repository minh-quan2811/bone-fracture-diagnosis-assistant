from typing import List, Dict, Any
import numpy as np
from PIL import Image
import io
from ultralytics import YOLO
import os

# Model class mapping
CLASS_TO_FRACTURE_TYPE = {
    0: "comminuted",
    1: "greenstick",
    2: "oblique",
    3: "spiral",
    4: "transverse"
}

class FracturePredictor:
    """Service for running bone fracture predictions"""
    
    def __init__(self, model_path: str = None, confidence_threshold: float = 0.25):
        """
        Initialize the predictor
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None
        
        # Load model if path provided
        if model_path:
            self._load_model()
    
    def _load_model(self):
        """Load the YOLO model"""
        try:
            self.model = YOLO(self.model_path)
            print(f"Fracture detection model loaded from {self.model_path}")
        except Exception as e:
            print(f"Failed to load model: {e}")
            self.model = None
    
    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Run prediction on image bytes
        """
        if self.model is None:
            raise ValueError("Model not loaded. Cannot run predictions.")
        
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Run inference
        results = self.model.predict(
            image,
            conf=self.confidence_threshold,
            verbose=False
        )
        
        # Process results
        detections = []
        max_confidence = 0.0
        
        if len(results) > 0:
            result = results[0]
            
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes.xyxy.cpu().numpy()  # [x_min, y_min, x_max, y_max]
                confidences = result.boxes.conf.cpu().numpy()
                class_ids = result.boxes.cls.cpu().numpy().astype(int)
                
                for box, conf, class_id in zip(boxes, confidences, class_ids):
                    x_min, y_min, x_max, y_max = box
                    width = int(x_max - x_min)
                    height = int(y_max - y_min)
                    
                    # Map class_id to fracture_type
                    fracture_type = CLASS_TO_FRACTURE_TYPE.get(class_id, None)
                    
                    detection = {
                        "class_id": int(class_id),
                        "class_name": "fracture",
                        "confidence": float(conf),
                        "fracture_type": fracture_type,
                        "bounding_box": {
                            "x_min": int(x_min),
                            "y_min": int(y_min),
                            "x_max": int(x_max),
                            "y_max": int(y_max),
                            "width": width,
                            "height": height
                        }
                    }
                    
                    detections.append(detection)
                    max_confidence = max(max_confidence, float(conf))
        
        return {
            "has_fracture": len(detections) > 0,
            "detection_count": len(detections),
            "max_confidence": max_confidence if len(detections) > 0 else None,
            "detections": detections,
            "inference_time": 0.0
        }


current_dir = os.path.dirname(os.path.abspath(__file__))

fracture_predictor = FracturePredictor(
    model_path=os.path.join(current_dir, "Our_YOLO.pt"),
    confidence_threshold=0.25
)

# Testing predictions
# if __name__ == "__main__":
#     print("\nRunning self-test for BoneFracturePredictorModel...\n")

#     MODEL_PATH = r"C:\Users\Admin\Desktop\School_Projects\Bone_Fractures\be\app\services\bone_fracture_predict\fracture_model.pt"
#     TEST_IMAGE = r"C:\Users\Admin\Downloads\7.jpg"
#     # Model classes: {0: 'comminuted', 1: 'compound', 2: 'greenstick', 3: 'splint', 4: 'transverse'}

#     # Initialize model
#     model = BoneFracturePredictorModel(model_path=MODEL_PATH)

#     if os.path.exists(TEST_IMAGE):
#         print(f"Running detection on: {TEST_IMAGE}\n")
#         result = model.predict_from_file(TEST_IMAGE)
#         print("Detection Result:")
#         print(result)
#     else:
#         print(f"Test image not found at: {TEST_IMAGE}")
