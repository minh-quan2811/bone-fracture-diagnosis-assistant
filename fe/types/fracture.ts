// Core interfaces for fracture detection system
export interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
  fracture_type?: string;
  // body_region removed
}

export interface Detection {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence?: number;
  color: string;
  source: 'student' | 'ai';
  fracture_type?: string;
  // body_region removed
}

export interface FractureDetection {
  id: number;
  prediction_id: number;
  source: 'student' | 'ai';
  class_id: number;
  class_name: string;
  confidence: number | null;
  fracture_type?: string;
  // body_region removed
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
  student_notes?: string;
  created_at: string;
}

export interface FracturePrediction {
  id: number;
  user_id: number;
  image_filename: string;
  image_path: string;
  image_size?: number;
  image_width?: number;
  image_height?: number;
  image_format?: string;
  has_student_predictions: boolean;
  has_ai_predictions: boolean;
  student_prediction_count: number;
  ai_prediction_count: number;
  model_version: string;
  ai_inference_time?: number;
  confidence_threshold: number;
  ai_max_confidence?: number;
  created_at: string;
  student_predictions_at?: string;
  ai_predictions_at?: string;
  detections: FractureDetection[];
}

export interface ComparisonMetrics {
  student_count: number;
  ai_count: number;
  both_found_fractures: boolean;
  student_only: boolean;
  ai_only: boolean;
  both_normal: boolean;
  fracture_type_matches: number;
  // body_region_matches removed
}

export interface IoUMatch {
  student_id: number;
  ai_id: number;
  iou: number;
  fracture_type_match: boolean;
  student_fracture_type?: string;
  ai_fracture_type?: string;
  ai_confidence?: number;
}

export interface UnmatchedDetection {
  id: number;
  fracture_type?: string;
  confidence?: number;
  best_iou?: number;
}

export interface DetailedComparisonSummary {
  student_count: number;
  ai_count: number;
  matched_count: number;
  unmatched_student_count: number;
  unmatched_ai_count: number;
  both_found_fractures: boolean;
  student_only: boolean;
  ai_only: boolean;
  both_normal: boolean;
}

export interface IoUMetrics {
  avg_iou: number;
  iou_threshold: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface FractureTypeMetrics {
  correct_count: number;
  incorrect_count: number;
  accuracy: number;
}

export interface DetailedComparison {
  summary: DetailedComparisonSummary;
  iou_metrics: IoUMetrics;
  fracture_type_metrics: FractureTypeMetrics;
  matches: IoUMatch[];
  unmatched_student: UnmatchedDetection[];
  unmatched_ai: UnmatchedDetection[];
}

export interface ComparisonFeedback {
  overall: string;
  detection_performance: string;
  classification_performance: string;
  suggestions: string[];
}

export interface PredictionComparison {
  prediction_id: number;
  image_filename: string;
  student_detections: FractureDetection[];
  ai_detections: FractureDetection[];
  comparison_metrics: ComparisonMetrics;  // Legacy for backward compatibility
  detailed_comparison: DetailedComparison;  // New IoU-based comparison
  feedback: ComparisonFeedback;  // Educational feedback
}

export interface PredictionResult {
  id: number;
  has_student_predictions: boolean;
  has_ai_predictions: boolean;
  student_prediction_count: number;
  ai_prediction_count: number;
  ai_max_confidence: number | null;
  ai_inference_time: number | null;
  detections: any[];
}

export interface ComparisonResult {
  prediction_id: number;
  image_filename: string;
  student_detections: any[];
  ai_detections: any[];
  comparison_metrics: {
    student_count: number;
    ai_count: number;
    both_found_fractures: boolean;
    student_only: boolean;
    ai_only: boolean;
    both_normal: boolean;
    fracture_type_matches: number;
    // body_region_matches removed
  };
  detailed_comparison: DetailedComparison;
  feedback: ComparisonFeedback;
}