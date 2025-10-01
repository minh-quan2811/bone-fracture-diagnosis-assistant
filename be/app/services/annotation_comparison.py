from typing import List, Dict, Any, Tuple, Optional
from app.models.fracture_prediction import FractureDetection
import math

class AnnotationComparison:
    """Service for comparing student annotations with AI predictions"""
    
    @staticmethod
    def calculate_iou(detection1: FractureDetection, detection2: FractureDetection) -> float:
        """
        Calculate Intersection over Union (IoU) between two bounding boxes
        
        Args:
            detection1: First detection
            detection2: Second detection
            
        Returns:
            IoU score between 0 and 1
        """
        # Calculate intersection coordinates
        x1 = max(detection1.x_min, detection2.x_min)
        y1 = max(detection1.y_min, detection2.y_min)
        x2 = min(detection1.x_max, detection2.x_max)
        y2 = min(detection1.y_max, detection2.y_max)
        
        # No intersection
        if x2 <= x1 or y2 <= y1:
            return 0.0
        
        # Calculate intersection area
        intersection_area = (x2 - x1) * (y2 - y1)
        
        # Calculate union area
        area1 = detection1.width * detection1.height
        area2 = detection2.width * detection2.height
        union_area = area1 + area2 - intersection_area
        
        return intersection_area / union_area if union_area > 0 else 0.0
    
    @staticmethod
    def calculate_distance(detection1: FractureDetection, detection2: FractureDetection) -> float:
        """
        Calculate Euclidean distance between centers of two bounding boxes
        
        Args:
            detection1: First detection
            detection2: Second detection
            
        Returns:
            Distance in pixels
        """
        center1_x = detection1.x_min + detection1.width / 2
        center1_y = detection1.y_min + detection1.height / 2
        center2_x = detection2.x_min + detection2.width / 2
        center2_y = detection2.y_min + detection2.height / 2
        
        return math.sqrt((center1_x - center2_x)**2 + (center1_y - center2_y)**2)
    
    @classmethod
    def find_matches(cls, 
                    student_detections: List[FractureDetection],
                    ai_detections: List[FractureDetection],
                    iou_threshold: float = 0.3,
                    distance_threshold: float = 100.0) -> Dict[str, Any]:
        """
        Find matching detections between student and AI predictions
        
        Args:
            student_detections: List of student detections
            ai_detections: List of AI detections
            iou_threshold: Minimum IoU for considering a match
            distance_threshold: Maximum distance for considering a match
            
        Returns:
            Dictionary containing match analysis
        """
        matches = []
        student_matched = set()
        ai_matched = set()
        
        # Find matches based on IoU and distance
        for i, student_det in enumerate(student_detections):
            best_match = None
            best_score = 0.0
            
            for j, ai_det in enumerate(ai_detections):
                if j in ai_matched:
                    continue
                    
                iou = cls.calculate_iou(student_det, ai_det)
                distance = cls.calculate_distance(student_det, ai_det)
                
                # Combined score (IoU is more important than distance)
                if iou >= iou_threshold and distance <= distance_threshold:
                    score = iou * 0.7 + (1 - min(distance / distance_threshold, 1.0)) * 0.3
                    
                    if score > best_score:
                        best_score = score
                        best_match = {
                            'student_index': i,
                            'ai_index': j,
                            'student_detection': student_det,
                            'ai_detection': ai_det,
                            'iou': iou,
                            'distance': distance,
                            'score': score,
                            'fracture_type_match': student_det.fracture_type == ai_det.fracture_type if (student_det.fracture_type and ai_det.fracture_type) else None,
                            'body_region_match': student_det.body_region == ai_det.body_region if (student_det.body_region and ai_det.body_region) else None
                        }
            
            if best_match:
                matches.append(best_match)
                student_matched.add(i)
                ai_matched.add(best_match['ai_index'])
        
        # Identify unmatched detections
        unmatched_student = [
            {'index': i, 'detection': det} 
            for i, det in enumerate(student_detections) 
            if i not in student_matched
        ]
        
        unmatched_ai = [
            {'index': i, 'detection': det} 
            for i, det in enumerate(ai_detections) 
            if i not in ai_matched
        ]
        
        # Calculate classification accuracy
        fracture_type_correct = sum(1 for m in matches if m.get('fracture_type_match') == True)
        body_region_correct = sum(1 for m in matches if m.get('body_region_match') == True)
        
        return {
            'matches': matches,
            'unmatched_student': unmatched_student,
            'unmatched_ai': unmatched_ai,
            'match_count': len(matches),
            'student_count': len(student_detections),
            'ai_count': len(ai_detections),
            'precision': len(matches) / len(student_detections) if student_detections else 1.0,
            'recall': len(matches) / len(ai_detections) if ai_detections else 1.0,
            'fracture_type_accuracy': fracture_type_correct / len(matches) if matches else 0.0,
            'body_region_accuracy': body_region_correct / len(matches) if matches else 0.0
        }
    
    @classmethod
    def calculate_performance_metrics(cls,
                                    student_detections: List[FractureDetection],
                                    ai_detections: List[FractureDetection],
                                    iou_threshold: float = 0.3) -> Dict[str, float]:
        """
        Calculate performance metrics for student predictions
        
        Args:
            student_detections: List of student detections
            ai_detections: List of AI detections (ground truth)
            iou_threshold: IoU threshold for considering a match
            
        Returns:
            Dictionary containing precision, recall, F1-score and classification accuracy
        """
        matches = cls.find_matches(student_detections, ai_detections, iou_threshold)
        
        true_positives = matches['match_count']
        false_positives = len(matches['unmatched_student'])
        false_negatives = len(matches['unmatched_ai'])
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        return {
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'true_positives': true_positives,
            'false_positives': false_positives,
            'false_negatives': false_negatives,
            'fracture_type_accuracy': matches['fracture_type_accuracy'],
            'body_region_accuracy': matches['body_region_accuracy']
        }
    
    @classmethod
    def generate_feedback(cls,
                         student_detections: List[FractureDetection],
                         ai_detections: List[FractureDetection]) -> Dict[str, Any]:
        """
        Generate educational feedback based on comparison
        
        Args:
            student_detections: List of student detections
            ai_detections: List of AI detections
            
        Returns:
            Dictionary containing feedback messages and suggestions
        """
        matches = cls.find_matches(student_detections, ai_detections)
        metrics = cls.calculate_performance_metrics(student_detections, ai_detections)
        
        feedback = {
            'summary': '',
            'strengths': [],
            'improvements': [],
            'suggestions': [],
            'metrics': metrics
        }
        
        student_count = len(student_detections)
        ai_count = len(ai_detections)
        match_count = matches['match_count']
        
        # Generate summary
        if student_count == 0 and ai_count == 0:
            feedback['summary'] = "Both you and the AI found no fractures. Perfect agreement!"
        elif student_count == 0 and ai_count > 0:
            feedback['summary'] = f"The AI detected {ai_count} fracture(s) that you missed."
        elif student_count > 0 and ai_count == 0:
            feedback['summary'] = f"You detected {student_count} fracture(s) that the AI did not find."
        else:
            feedback['summary'] = f"You found {student_count} fracture(s), AI found {ai_count}. {match_count} match(es)."
        
        # Identify strengths
        if match_count > 0:
            feedback['strengths'].append(f"Successfully identified {match_count} fracture location(s)")
            
        if metrics['precision'] >= 0.8:
            feedback['strengths'].append("High precision - few false positive detections")
            
        if metrics['recall'] >= 0.8:
            feedback['strengths'].append("High recall - detected most of the fractures")
        
        if metrics['fracture_type_accuracy'] >= 0.8:
            feedback['strengths'].append(f"Excellent fracture type classification ({metrics['fracture_type_accuracy']:.0%} accuracy)")
        
        if metrics['body_region_accuracy'] >= 0.8:
            feedback['strengths'].append(f"Excellent body region identification ({metrics['body_region_accuracy']:.0%} accuracy)")
        
        # Identify areas for improvement
        if matches['unmatched_student']:
            feedback['improvements'].append(f"Consider reviewing {len(matches['unmatched_student'])} potential false positive(s)")
            
        if matches['unmatched_ai']:
            feedback['improvements'].append(f"Missed {len(matches['unmatched_ai'])} fracture(s) detected by AI")
            
        if metrics['precision'] < 0.6:
            feedback['improvements'].append("Work on reducing false positive detections")
            
        if metrics['recall'] < 0.6:
            feedback['improvements'].append("Focus on identifying more subtle fractures")
        
        if metrics['fracture_type_accuracy'] < 0.6 and match_count > 0:
            feedback['improvements'].append("Review fracture type classification - study different fracture patterns")
        
        if metrics['body_region_accuracy'] < 0.6 and match_count > 0:
            feedback['improvements'].append("Improve body region identification - review anatomical landmarks")
        
        # Generate suggestions
        if student_count > ai_count * 2:
            feedback['suggestions'].append("You may be over-detecting. Look for clear fracture lines and discontinuities.")
            
        if ai_count > student_count * 2:
            feedback['suggestions'].append("You may be under-detecting. Examine bone edges and cortical interruptions more carefully.")
            
        if match_count > 0:
            avg_iou = sum(match['iou'] for match in matches['matches']) / len(matches['matches'])
            if avg_iou < 0.5:
                feedback['suggestions'].append("Work on more precise localization of fracture boundaries.")
        
        # Classification-specific suggestions
        fracture_type_mismatches = sum(1 for m in matches['matches'] if m.get('fracture_type_match') == False)
        if fracture_type_mismatches > 0:
            feedback['suggestions'].append(f"Review {fracture_type_mismatches} fracture type misclassification(s). Study fracture patterns: transverse, spiral, comminuted, etc.")
        
        body_region_mismatches = sum(1 for m in matches['matches'] if m.get('body_region_match') == False)
        if body_region_mismatches > 0:
            feedback['suggestions'].append(f"Review {body_region_mismatches} body region misidentification(s). Study anatomical structures and landmarks.")
        
        return feedback