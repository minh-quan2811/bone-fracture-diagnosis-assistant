from typing import List, Dict, Tuple, Optional
from app.models.fracture_prediction import FractureDetection


class ComparisonService:
    """Service to compare student annotations with AI predictions"""
    
    def __init__(self, iou_threshold: float = 0.3):
        """
        Initialize comparison service
        
        Args:
            iou_threshold: Minimum IoU to consider a match (default: 0.3)
        """
        self.iou_threshold = iou_threshold
    
    @staticmethod
    def calculate_iou(box1: Dict, box2: Dict) -> float:
        """
        Calculate Intersection over Union (IoU) between two bounding boxes
        
        Args:
            box1: First bounding box {x_min, y_min, x_max, y_max}
            box2: Second bounding box {x_min, y_min, x_max, y_max}
            
        Returns:
            IoU score between 0 and 1
        """
        # Calculate intersection coordinates
        x_left = max(box1['x_min'], box2['x_min'])
        y_top = max(box1['y_min'], box2['y_min'])
        x_right = min(box1['x_max'], box2['x_max'])
        y_bottom = min(box1['y_max'], box2['y_max'])
        
        # Check if there is an intersection
        if x_right < x_left or y_bottom < y_top:
            return 0.0
        
        # Calculate intersection area
        intersection_area = (x_right - x_left) * (y_bottom - y_top)
        
        # Calculate union area
        box1_area = (box1['x_max'] - box1['x_min']) * (box1['y_max'] - box1['y_min'])
        box2_area = (box2['x_max'] - box2['x_min']) * (box2['y_max'] - box2['y_min'])
        union_area = box1_area + box2_area - intersection_area
        
        # Calculate IoU
        if union_area == 0:
            return 0.0
        
        iou = intersection_area / union_area
        return iou
    
    def find_best_match(
        self, 
        student_detection: FractureDetection, 
        ai_detections: List[FractureDetection]
    ) -> Tuple[Optional[FractureDetection], float]:
        """
        Find the best matching AI detection for a student detection
        
        Args:
            student_detection: Student's detection
            ai_detections: List of AI detections
            
        Returns:
            Tuple of (best_match, best_iou) or (None, 0.0) if no match
        """
        student_box = {
            'x_min': student_detection.x_min,
            'y_min': student_detection.y_min,
            'x_max': student_detection.x_max,
            'y_max': student_detection.y_max
        }
        
        best_match = None
        best_iou = 0.0
        
        for ai_detection in ai_detections:
            ai_box = {
                'x_min': ai_detection.x_min,
                'y_min': ai_detection.y_min,
                'x_max': ai_detection.x_max,
                'y_max': ai_detection.y_max
            }
            
            iou = self.calculate_iou(student_box, ai_box)
            
            if iou > best_iou:
                best_iou = iou
                best_match = ai_detection
        
        return best_match, best_iou
    
    def compare_predictions(
        self,
        student_detections: List[FractureDetection],
        ai_detections: List[FractureDetection]
    ) -> Dict:
        """
        Compare student and AI predictions using IoU and fracture type matching
        
        Args:
            student_detections: List of student detections
            ai_detections: List of AI detections
            
        Returns:
            Comprehensive comparison metrics
        """
        matches = []
        unmatched_student = []
        unmatched_ai = list(ai_detections)
        
        # Match each student detection with AI detections
        for student_det in student_detections:
            best_ai_match, best_iou = self.find_best_match(student_det, unmatched_ai)
            
            if best_ai_match and best_iou >= self.iou_threshold:
                # Check if fracture types match
                fracture_type_match = (
                    student_det.fracture_type and 
                    best_ai_match.fracture_type and 
                    student_det.fracture_type.lower() == best_ai_match.fracture_type.lower()
                )
                
                matches.append({
                    'student_id': student_det.id,
                    'ai_id': best_ai_match.id,
                    'iou': round(best_iou, 4),
                    'fracture_type_match': fracture_type_match,
                    'student_fracture_type': student_det.fracture_type,
                    'ai_fracture_type': best_ai_match.fracture_type,
                    'ai_confidence': best_ai_match.confidence
                })
                
                # Remove matched AI detection from unmatched list
                unmatched_ai.remove(best_ai_match)
            else:
                unmatched_student.append({
                    'id': student_det.id,
                    'fracture_type': student_det.fracture_type,
                    'best_iou': round(best_iou, 4) if best_iou > 0 else 0.0
                })
        
        # Calculate metrics
        total_student = len(student_detections)
        total_ai = len(ai_detections)
        matched_count = len(matches)
        correct_fracture_types = sum(1 for m in matches if m['fracture_type_match'])
        
        # Calculate average IoU for matches
        avg_iou = sum(m['iou'] for m in matches) / matched_count if matched_count > 0 else 0.0
        
        # Calculate precision, recall, and F1 score
        precision = matched_count / total_student if total_student > 0 else 0.0
        recall = matched_count / total_ai if total_ai > 0 else 0.0
        f1_score = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        # Fracture type accuracy (among matched detections)
        fracture_type_accuracy = correct_fracture_types / matched_count if matched_count > 0 else 0.0
        
        return {
            'summary': {
                'student_count': total_student,
                'ai_count': total_ai,
                'matched_count': matched_count,
                'unmatched_student_count': len(unmatched_student),
                'unmatched_ai_count': len(unmatched_ai),
                'both_found_fractures': total_student > 0 and total_ai > 0,
                'student_only': total_student > 0 and total_ai == 0,
                'ai_only': total_student == 0 and total_ai > 0,
                'both_normal': total_student == 0 and total_ai == 0
            },
            'iou_metrics': {
                'avg_iou': round(avg_iou, 4),
                'iou_threshold': self.iou_threshold,
                'precision': round(precision, 4),
                'recall': round(recall, 4),
                'f1_score': round(f1_score, 4)
            },
            'fracture_type_metrics': {
                'correct_count': correct_fracture_types,
                'incorrect_count': matched_count - correct_fracture_types,
                'accuracy': round(fracture_type_accuracy, 4)
            },
            'matches': matches,
            'unmatched_student': unmatched_student,
            'unmatched_ai': [
                {
                    'id': ai_det.id,
                    'fracture_type': ai_det.fracture_type,
                    'confidence': ai_det.confidence
                } 
                for ai_det in unmatched_ai
            ]
        }
    
    def generate_feedback(self, comparison_result: Dict) -> Dict[str, str]:
        """
        Generate educational feedback based on comparison results
        
        Args:
            comparison_result: Results from compare_predictions
            
        Returns:
            Dictionary with feedback messages
        """
        summary = comparison_result['summary']
        iou_metrics = comparison_result['iou_metrics']
        fracture_metrics = comparison_result['fracture_type_metrics']
        
        feedback = {
            'overall': '',
            'detection_performance': '',
            'classification_performance': '',
            'suggestions': []
        }
        
        # Overall feedback
        if summary['both_normal']:
            feedback['overall'] = "Excellent! Both you and the AI agree there are no fractures."
        elif summary['both_found_fractures']:
            if iou_metrics['f1_score'] >= 0.7:
                feedback['overall'] = "Great work! Your detection closely matches the AI."
            elif iou_metrics['f1_score'] >= 0.4:
                feedback['overall'] = "Good effort! Some detections match, but there's room for improvement."
            else:
                feedback['overall'] = "Keep learning! Your detections differ significantly from the AI."
        elif summary['student_only']:
            feedback['overall'] = "You detected fractures that the AI didn't find. Double-check your findings."
        else:  # ai_only
            feedback['overall'] = "The AI detected fractures you may have missed. Review the image carefully."
        
        # Detection performance
        if summary['matched_count'] > 0:
            feedback['detection_performance'] = (
                f"Detection Match: {summary['matched_count']}/{summary['student_count']} "
                f"of your detections matched AI detections (IoU ≥ {iou_metrics['iou_threshold']}). "
                f"Average IoU: {iou_metrics['avg_iou']:.2f}"
            )
        
        # Classification performance
        if fracture_metrics['correct_count'] > 0 or fracture_metrics['incorrect_count'] > 0:
            total_classified = fracture_metrics['correct_count'] + fracture_metrics['incorrect_count']
            feedback['classification_performance'] = (
                f"Classification: {fracture_metrics['correct_count']}/{total_classified} "
                f"fracture types correct ({fracture_metrics['accuracy']*100:.1f}% accuracy)"
            )
        
        # Suggestions
        if summary['unmatched_student_count'] > 0:
            feedback['suggestions'].append(
                f"You have {summary['unmatched_student_count']} detection(s) that don't match AI predictions. "
                "These might be false positives or the AI might have missed them."
            )
        
        if summary['unmatched_ai_count'] > 0:
            feedback['suggestions'].append(
                f"The AI found {summary['unmatched_ai_count']} fracture(s) you didn't detect. "
                "Review these areas to improve your detection skills."
            )
        
        if fracture_metrics['incorrect_count'] > 0:
            feedback['suggestions'].append(
                f"{fracture_metrics['incorrect_count']} fracture type(s) were misclassified. "
                "Study the characteristics of different fracture types."
            )
        
        if iou_metrics['avg_iou'] < 0.5 and summary['matched_count'] > 0:
            feedback['suggestions'].append(
                "Try to draw bounding boxes more precisely around the fracture areas."
            )
        
        return feedback


# Singleton instance
comparison_service = ComparisonService(iou_threshold=0.3)