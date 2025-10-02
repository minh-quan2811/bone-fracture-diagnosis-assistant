import { useState, useCallback } from 'react';
import { StudentAnnotation, Detection, FracturePrediction } from '../types/fracture';

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