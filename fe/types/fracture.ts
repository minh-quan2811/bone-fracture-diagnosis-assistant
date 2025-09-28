// Core interfaces for fracture detection system
export interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
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
}

export interface FractureDetection {
  id: number;
  prediction_id: number;
  source: 'student' | 'ai';
  class_id: number;
  class_name: string;
  confidence: number | null;
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

export interface PredictionSummary {
  id: number;
  image_filename: string;
  has_student_predictions: boolean;
  has_ai_predictions: boolean;
  student_prediction_count: number;
  ai_prediction_count: number;
  ai_max_confidence?: number;
  created_at: string;
}

export interface ComparisonMetrics {
  student_count: number;
  ai_count: number;
  both_found_fractures: boolean;
  student_only: boolean;
  ai_only: boolean;
  both_normal: boolean;
}

export interface PredictionComparison {
  prediction_id: number;
  image_filename: string;
  student_detections: FractureDetection[];
  ai_detections: FractureDetection[];
  comparison_metrics: ComparisonMetrics;
}

export interface DetailedComparisonMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  average_iou?: number;
  matches?: Array<{
    student_detection: FractureDetection;
    ai_detection: FractureDetection;
    iou: number;
    distance: number;
    score: number;
  }>;
}

export interface DetailedPredictionComparison extends PredictionComparison {
  detailed_metrics: DetailedComparisonMetrics;
  feedback?: {
    summary: string;
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
}

export interface PredictionStats {
  total_predictions: number;
  student_predictions: number;
  ai_predictions: number;
  average_ai_confidence: number;
}

export interface PerformanceReport {
  user_id: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
  overall_stats: {
    total_predictions: number;
    total_student_annotations: number;
    total_ai_predictions: number;
    average_precision: number;
    average_recall: number;
    average_f1_score: number;
  };
  timeline: Array<{
    date: string;
    predictions_count: number;
    average_precision: number;
    average_recall: number;
  }>;
  improvement_trends: {
    precision_trend: 'improving' | 'declining' | 'stable';
    recall_trend: 'improving' | 'declining' | 'stable';
    consistency_score: number;
  };
}

export interface ModelInfo {
  model_path: string;
  confidence_threshold: number;
  iou_threshold: number;
  classes: Record<string, string>;
  version: string;
  last_updated?: string;
}

// Canvas and annotation related types
export interface CanvasState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentRect: StudentAnnotation | null;
  scale: { x: number; y: number };
}

export interface DrawingOptions {
  strokeStyle?: string;
  lineWidth?: number;
  lineDash?: number[];
  showLabel?: boolean;
  labelFont?: string;
}

export interface AnnotationValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// API request/response types
export interface UploadImageResponse {
  id: number;
  image_filename: string;
  image_width: number;
  image_height: number;
  message: string;
}

export interface SubmitAnnotationsRequest {
  annotations: Array<{
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
    width: number;
    height: number;
    notes?: string;
  }>;
}

export interface SubmitAnnotationsResponse {
  message: string;
  count: number;
}

export interface RunAiPredictionResponse {
  message: string;
  has_fracture: boolean;
  detection_count: number;
  max_confidence?: number;
  inference_time: number;
}

// UI state types
export interface FractureDetectionState {
  // Image state
  image: HTMLImageElement | null;
  imageFile: File | null;
  
  // Prediction state
  currentPrediction: FracturePrediction | null;
  allDetections: Detection[];
  
  // Annotation state
  studentAnnotations: StudentAnnotation[];
  isAnnotating: boolean;
  
  // Canvas state
  canvasState: CanvasState;
  
  // UI state
  showStudentAnnotations: boolean;
  showAiPredictions: boolean;
  isCollapsed: boolean;
  
  // Loading states
  isUploading: boolean;
  isRunningAI: boolean;
  isSubmittingAnnotations: boolean;
  
  // Error state
  error: string | null;
  
  // Comparison state
  comparison: PredictionComparison | null;
}

// Hook return types
export interface UseFracturePredictionReturn {
  // State
  prediction: FracturePrediction | null;
  annotations: StudentAnnotation[];
  allDetections: Detection[];
  isAnnotating: boolean;
  isDrawing: boolean;
  currentRect: StudentAnnotation | null;
  startPoint: { x: number; y: number } | null;

  // Actions
  setPrediction: (prediction: FracturePrediction | null) => void;
  addAnnotation: (annotation: StudentAnnotation) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<StudentAnnotation>) => void;
  clearAnnotations: () => void;
  
  setAllDetections: (detections: Detection[]) => void;
  addDetections: (detections: Detection[]) => void;
  removeDetectionsBySource: (source: 'student' | 'ai') => void;
  
  setIsAnnotating: (isAnnotating: boolean) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setCurrentRect: (rect: StudentAnnotation | null) => void;
  setStartPoint: (point: { x: number; y: number } | null) => void;
  
  // Computed values
  hasUnsavedAnnotations: boolean;
  studentDetections: Detection[];
  aiDetections: Detection[];
}

export interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  redraw: () => void;
  getCoordinates: (event: React.MouseEvent) => { x: number; y: number };
  isPointInBounds: (x: number, y: number) => boolean;
}

// Event types
export interface AnnotationEvent {
  type: 'start' | 'update' | 'end' | 'cancel';
  annotation?: StudentAnnotation;
  point?: { x: number; y: number };
}

export interface DetectionEvent {
  type: 'add' | 'remove' | 'update' | 'clear';
  detections?: Detection[];
  source?: 'student' | 'ai';
}

// Utility types
export type PredictionSource = 'student' | 'ai';
export type ComparisonResult = 'agreement' | 'disagreement' | 'student_only' | 'ai_only' | 'both_normal';
export type AnnotationTool = 'rectangle' | 'circle' | 'polygon' | 'freehand';
export type ViewMode = 'annotation' | 'comparison' | 'review';

// Configuration types
export interface FractureDetectionConfig {
  minAnnotationSize: number;
  maxAnnotationSize: number;
  defaultConfidenceThreshold: number;
  defaultIoUThreshold: number;
  colors: {
    student: string;
    ai: string;
    current: string;
    hover: string;
  };
  canvas: {
    maxWidth: number;
    maxHeight: number;
    devicePixelRatio: number;
  };
}