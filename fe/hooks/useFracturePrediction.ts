import { useState, useCallback } from 'react';

interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
}

interface Detection {
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

interface FracturePrediction {
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
  detections: any[];
}

interface UseFracturePredictionReturn {
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

export function useFracturePrediction(): UseFracturePredictionReturn {
  const [prediction, setPrediction] = useState<FracturePrediction | null>(null);
  const [annotations, setAnnotations] = useState<StudentAnnotation[]>([]);
  const [allDetections, setAllDetections] = useState<Detection[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState<StudentAnnotation | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const addAnnotation = useCallback((annotation: StudentAnnotation) => {
    setAnnotations(prev => [...prev, annotation]);
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<StudentAnnotation>) => {
    setAnnotations(prev => prev.map(ann => 
      ann.id === id ? { ...ann, ...updates } : ann
    ));
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    setCurrentRect(null);
    setIsDrawing(false);
    setStartPoint(null);
  }, []);

  const addDetections = useCallback((newDetections: Detection[]) => {
    setAllDetections(prev => [...prev, ...newDetections]);
  }, []);

  const removeDetectionsBySource = useCallback((source: 'student' | 'ai') => {
    setAllDetections(prev => prev.filter(detection => detection.source !== source));
  }, []);

  // Computed values
  const hasUnsavedAnnotations = annotations.length > 0;
  const studentDetections = allDetections.filter(d => d.source === 'student');
  const aiDetections = allDetections.filter(d => d.source === 'ai');

  return {
    // State
    prediction,
    annotations,
    allDetections,
    isAnnotating,
    isDrawing,
    currentRect,
    startPoint,

    // Actions
    setPrediction,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    clearAnnotations,
    
    setAllDetections,
    addDetections,
    removeDetectionsBySource,
    
    setIsAnnotating,
    setIsDrawing,
    setCurrentRect,
    setStartPoint,

    // Computed values
    hasUnsavedAnnotations,
    studentDetections,
    aiDetections
  };
}