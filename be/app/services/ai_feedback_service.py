import os
import base64
from typing import Dict, List, Optional
from io import BytesIO
from PIL import Image, ImageDraw

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

from app.models.fracture_prediction import FractureDetection
from app.services.annotation_comparision import comparison_service
from app.core.config import settings

class AIImageAnalysisFeedback:
    """Pydantic model for structured LLM output"""
    def __init__(self, image_analysis: str, overall: str, detection_performance: str, 
                 classification_performance: str, suggestions: List[str]):
        self.image_analysis = image_analysis
        self.overall = overall
        self.detection_performance = detection_performance
        self.classification_performance = classification_performance
        self.suggestions = suggestions


# Pydantic schema for structured output
from pydantic import BaseModel, Field

class AIFeedbackSchema(BaseModel):
    """Schema for AI-generated feedback with structured output"""
    image_analysis: str = Field(
        description="Detailed visual analysis of the X-ray image, describing fracture patterns, bone structure, and anatomical features visible"
    )
    overall: str = Field(
        description="Overall assessment comparing student and AI predictions"
    )
    detection_performance: str = Field(
        description="Evaluation of how well the student detected the fracture location"
    )
    classification_performance: str = Field(
        description="Evaluation of how accurately the student classified the fracture type"
    )
    suggestions: List[str] = Field(
        description="List of actionable suggestions for improvement"
    )


class AIFeedbackService:
    """Service for generating AI-powered image analysis feedback"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=settings.GEMINI_API_KEY
        )
    
    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string"""
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()
    
    def _draw_bounding_boxes(
        self, 
        image_path: str, 
        student_detections: List[FractureDetection],
        ai_detections: List[FractureDetection]
    ) -> Image.Image:
        """Draw student (blue) and AI (red) bounding boxes on image"""
        # Load image
        from app.utils.storage_manager import storage_manager
        file_content = storage_manager.get_file_bytes(image_path)
        image = Image.open(BytesIO(file_content)).convert("RGB")
        
        draw = ImageDraw.Draw(image)
        
        # Draw student boxes (blue)
        for detection in student_detections:
            draw.rectangle(
                [detection.x_min, detection.y_min, detection.x_max, detection.y_max],
                outline="blue",
                width=4
            )
        
        # Draw AI boxes (red)
        for detection in ai_detections:
            draw.rectangle(
                [detection.x_min, detection.y_min, detection.x_max, detection.y_max],
                outline="red",
                width=4
            )
        
        return image
    
    def _build_prompt(
        self,
        student_detections: List[FractureDetection],
        ai_detections: List[FractureDetection],
        comparison_result: Dict
    ) -> str:
        """Build comprehensive prompt for LLM analysis"""
        
        summary = comparison_result['summary']
        iou_metrics = comparison_result['iou_metrics']
        fracture_metrics = comparison_result['fracture_type_metrics']
        matches = comparison_result['matches']
        
        # Extract student notes
        student_notes_text = ""
        for detection in student_detections:
            if detection.student_notes:
                fracture_type = detection.fracture_type or "unknown"
                student_notes_text += f"\n- {fracture_type.capitalize()}: {detection.student_notes}"
        
        prompt = f"""You are an expert bone fracture instructor specializing in radiographic interpretation and anatomical analysis.

Your role is to provide comprehensive feedback on a student's fracture detection and classification work based on an X-ray image.

## Image Information
You are provided with an X-ray image showing bone fracture(s). The image has bounding boxes:
- **Blue Boxes**: Student's annotations of fracture locations
- **Red Boxes**: AI model's predictions of fracture locations

## Student Work
**Number of detections**: {summary['student_count']}
**Fracture types identified**: {', '.join([d.fracture_type or 'unknown' for d in student_detections])}

**Student's reasoning notes**:{student_notes_text if student_notes_text else " (No notes provided)"}

## AI Model Predictions
**Number of detections**: {summary['ai_count']}
**Fracture types detected**: {', '.join([d.fracture_type or 'unknown' for d in ai_detections])}

## Detection Performance Metrics (IoU-based)
- **Matched detections**: {summary['matched_count']}/{summary['student_count']}
- **Average IoU**: {iou_metrics['avg_iou']:.2%}
- **Precision**: {iou_metrics['precision']:.2%}
- **Recall**: {iou_metrics['recall']:.2%}
- **F1 Score**: {iou_metrics['f1_score']:.2%}

## Classification Performance
- **Correct fracture types**: {fracture_metrics['correct_count']}
- **Incorrect fracture types**: {fracture_metrics['incorrect_count']}
- **Accuracy**: {fracture_metrics['accuracy']:.2%}

## Detailed Match Analysis
"""
        
        # Add match details
        if matches:
            prompt += "**Matched detections**:\n"
            for i, match in enumerate(matches, 1):
                prompt += f"{i}. Student: {match['student_fracture_type']} | AI: {match['ai_fracture_type']} | IoU: {match['iou']:.2%} | Match: {'✓' if match['fracture_type_match'] else '✗'}\n"
        
        prompt += f"""

## Your Task
Provide detailed educational feedback in the following structure:

1. **image_analysis**: Analyze the X-ray image visually. Describe:
   - What fracture patterns are visible in the image
   - Bone structure and anatomical features you observe
   - Specific characteristics that indicate the fracture type(s)
   - Any subtle details that are important for diagnosis

2. **overall**: Overall assessment of the student's performance
   - Whether they correctly identified fractures
   - General accuracy of their work
   - Key strengths and weaknesses

3. **detection_performance**: Evaluate the student's ability to locate fractures
   - How accurately they placed bounding boxes
   - Any missed fractures or false positives
   - Comparison with AI detection locations

4. **classification_performance**: Evaluate fracture type classification
   - Accuracy of fracture type identification
   - Common classification errors
   - Understanding of fracture characteristics

5. **suggestions**: Provide 2-4 specific, actionable suggestions for improvement
   - Areas to study further
   - Techniques to improve detection
   - Resources or concepts to review

Be educational, supportive, and reference specific visual features from the X-ray image.
"""
        
        return prompt
    
    async def generate_feedback(
        self,
        image_path: str,
        student_detections: List[FractureDetection],
        ai_detections: List[FractureDetection],
        comparison_result: Dict
    ) -> Dict:
        """
        Generate AI-powered image analysis feedback
        
        Returns dict with keys: image_analysis, overall, detection_performance, 
        classification_performance, suggestions
        """
        
        # If LLM not available, return fallback
        if not self.llm:
            return {
                'image_analysis': 'AI image analysis unavailable. Please configure GEMINI_API_KEY.',
                'overall': comparison_service.generate_feedback(comparison_result)['overall'],
                'detection_performance': comparison_service.generate_feedback(comparison_result)['detection_performance'],
                'classification_performance': comparison_service.generate_feedback(comparison_result)['classification_performance'],
                'suggestions': comparison_service.generate_feedback(comparison_result)['suggestions']
            }
        
        try:
            # Draw annotated image
            annotated_image = self._draw_bounding_boxes(
                image_path, student_detections, ai_detections
            )
            
            # Convert to base64
            image_base64 = self._image_to_base64(annotated_image)
            
            # Build prompt
            prompt_text = self._build_prompt(
                student_detections, ai_detections, comparison_result
            )
            
            # Create structured LLM with schema
            structured_llm = self.llm.with_structured_output(AIFeedbackSchema)
            
            # Create message with image and text
            message_content = [
                {
                    "type": "text",
                    "text": prompt_text
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image_base64}"
                    }
                }
            ]
            
            # Get structured response
            response = await structured_llm.ainvoke([HumanMessage(content=message_content)])
            
            # Convert Pydantic model to dict
            return {
                'image_analysis': response.image_analysis,
                'overall': response.overall,
                'detection_performance': response.detection_performance,
                'classification_performance': response.classification_performance,
                'suggestions': response.suggestions
            }
            
        except Exception as e:
            print(f"AI analysis error: {str(e)}")
            # Fallback to rule-based feedback
            fallback = comparison_service.generate_feedback(comparison_result)
            return {
                'image_analysis': f'Unable to perform AI image analysis: {str(e)}',
                'overall': fallback['overall'],
                'detection_performance': fallback['detection_performance'],
                'classification_performance': fallback['classification_performance'],
                'suggestions': fallback['suggestions']
            }


# Singleton instance
ai_feedback_service = AIFeedbackService()