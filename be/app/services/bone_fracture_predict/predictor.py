import os
import cv2
import numpy as np
from typing import Dict, List
from ultralytics import YOLO
import time

class BoneFracturePredictorModel:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "fracture_model.pt")
        self.model = None
        self.confidence_threshold = 0.25
        self.iou_threshold = 0.45
        self.load_model()
    
    def load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                print(f"✅ YOLOv8 fracture model loaded from {self.model_path}")
                print(f"📋 Model classes: {self.model.names}")
            else:
                print(f"⚠️  Model file not found at {self.model_path}")
                self.model = YOLO('yolov8n.pt')
                print("🔄 Loaded YOLOv8 nano model for demonstration")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise Exception("Could not load YOLOv8 model")
    
############################### MOCK DATA #############################################
    # Mock prediction function (having no prediction)
    # def predict(image_data: bytes) -> dict:
    #     return {
    #         "has_fracture": False,
    #         "detection_count": 0,
    #         "max_confidence": None,
    #         "detections": [],
    #         "inference_time": 0.0987,
    #         "image_dimensions": {
    #             "width": 1024,
    #             "height": 768,
    #             "channels": 3
    #         }
    #     }

    # Mock prediction function (having prediction)
    def predict(image_data: bytes) -> dict:
        return {
            "has_fracture": True,
            "detection_count": 2,
            "max_confidence": 0.92,
            "detections": [
                {
                    "class_id": 0,
                    "class_name": "fracture",
                    "confidence": 0.92,
                    "bounding_box": {
                        "x_min": 120,
                        "y_min": 200,
                        "x_max": 340,
                        "y_max": 480,
                        "width": 220,
                        "height": 280
                    }
                },
                {
                    "class_id": 1,
                    "class_name": "bone",
                    "confidence": 0.85,
                    "bounding_box": {
                        "x_min": 400,
                        "y_min": 150,
                        "x_max": 600,
                        "y_max": 450,
                        "width": 200,
                        "height": 300
                    }
                }
            ],
            "inference_time": 0.1542,
            "image_dimensions": {
                "width": 1024,
                "height": 768,
                "channels": 3
            }
        }
#############################################

    # Real prediction function commented out for now
    # def predict(self, image_data: bytes) -> Dict:
    #     try:
    #         # Decode image
    #         nparr = np.frombuffer(image_data, np.uint8)
    #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
    #         if image is None:
    #             raise ValueError("Could not decode image")
            
    #         # Get image dimensions
    #         height, width = image.shape[:2]
    #         channels = image.shape[2] if len(image.shape) > 2 else 1
            
    #         # Run YOLOv8 inference
    #         start_time = time.time()
    #         results = self.model(
    #             image,
    #             conf=self.confidence_threshold,
    #             iou=self.iou_threshold,
    #             verbose=False
    #         )
    #         inference_time = time.time() - start_time
            
    #         # Process results
    #         detections = []
    #         max_confidence = 0.0
            
    #         for result in results:
    #             if result.boxes is not None and len(result.boxes) > 0:
    #                 for i, box in enumerate(result.boxes):
    #                     # Get detection data
    #                     xyxy = box.xyxy[0].cpu().numpy()
    #                     conf = float(box.conf[0].cpu().numpy())
    #                     cls_id = int(box.cls[0].cpu().numpy())
                        
    #                     # Get class name
    #                     class_name = self.model.names.get(cls_id, f"class_{cls_id}")
                        
    #                     # Convert coordinates to integers
    #                     x1, y1, x2, y2 = map(int, xyxy)
                        
    #                     detection = {
    #                         "class_id": cls_id,
    #                         "class_name": class_name,
    #                         "confidence": conf,
    #                         "bounding_box": {
    #                             "x_min": x1,
    #                             "y_min": y1,
    #                             "x_max": x2,
    #                             "y_max": y2,
    #                             "width": x2 - x1,
    #                             "height": y2 - y1
    #                         }
    #                     }
    #                     detections.append(detection)
    #                     max_confidence = max(max_confidence, conf)
            
    #         # Prepare response
    #         return {
    #             "has_fracture": len(detections) > 0,
    #             "detection_count": len(detections),
    #             "max_confidence": max_confidence if detections else None,
    #             "detections": detections,
    #             "inference_time": inference_time,
    #             "image_dimensions": {
    #                 "width": width,
    #                 "height": height,
    #                 "channels": channels
    #             }
    #         }
            
    #     except Exception as e:
    #         raise Exception(f"YOLOv8 prediction failed: {str(e)}")
    
    def predict_from_file(self, file_path: str) -> Dict:
        try:
            with open(file_path, 'rb') as f:
                image_data = f.read()
            return self.predict(image_data)
        except Exception as e:
            raise Exception(f"File prediction failed: {str(e)}")
    
    def get_model_info(self) -> Dict:
        return {
            "model_path": self.model_path,
            "confidence_threshold": self.confidence_threshold,
            "iou_threshold": self.iou_threshold,
            "classes": self.model.names if self.model else {}
        }

# Initialize the predictor instance
fracture_predictor = BoneFracturePredictorModel()