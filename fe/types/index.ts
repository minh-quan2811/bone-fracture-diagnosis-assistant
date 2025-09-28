export interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
  sender_id?: number;
}

// Base conversation without messages
export interface ConversationBase {
  id: number;
  title: string;
  created_at: string;
}

// Full conversation with messages
export interface Conversation extends ConversationBase {
  messages: Message[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Fracture detection types
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

export interface StudentAnnotation {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
  notes?: string;
}

export interface PredictionComparison {
  prediction_id: number;
  image_filename: string;
  student_detections: FractureDetection[];
  ai_detections: FractureDetection[];
  comparison_metrics: {
    student_count: number;
    ai_count: number;
    both_found_fractures: boolean;
    student_only: boolean;
    ai_only: boolean;
    both_normal: boolean;
  };
}

export interface PredictionStats {
  total_predictions: number;
  student_predictions: number;
  ai_predictions: number;
  average_ai_confidence: number;
}