export interface ComparisonMetrics {
  student_count: number;
  ai_count: number;
  both_found_fractures: boolean;
  student_only: boolean;
  ai_only: boolean;
  both_normal: boolean;
  fracture_type_matches: number;
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
  student_detections: any[];
  ai_detections: any[];
  comparison_metrics: ComparisonMetrics;
  detailed_comparison: DetailedComparison;
  feedback: ComparisonFeedback;
}

export interface ComparisonResult {
  prediction_id: number;
  image_filename: string;
  student_detections: any[];
  ai_detections: any[];
  comparison_metrics: ComparisonMetrics;
  detailed_comparison: DetailedComparison;
  feedback: ComparisonFeedback;
}
