import { useState, useCallback } from 'react';
import { 
  submitStudentAnnotations, 
  runAiPrediction, 
  getPredictionComparison 
} from '@/lib/api';

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

interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
}

interface PredictionResult {
  id: number;
  has_student_predictions: boolean;
  has_ai_predictions: boolean;
  student_prediction_count: number;
  ai_prediction_count: number;
  ai_max_confidence: number | null;
  ai_inference_time: number | null;
  detections: any[];
}

interface ComparisonResult {
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
  };
}

interface UseFracturePredictionAPIReturn {
  currentPrediction: PredictionResult | null;
  comparison: ComparisonResult | null;
  allDetections: Detection[];
  isSubmittingAnnotations: boolean;
  isRunningAI: boolean;
  error: string | null;
  setCurrentPrediction: (prediction: PredictionResult | null) => void;
  setAllDetections: (detections: Detection[]) => void;
  submitAnnotations: (predictionId: number, annotations: StudentAnnotation[], token: string) => Promise<void>;
  runAI: (predictionId: number, token: string) => Promise<void>;
  fetchComparison: (predictionId: number, token: string) => Promise<void>;
  clearPrediction: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useFracturePredictionAPI(): UseFracturePredictionAPIReturn {
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [allDetections, setAllDetections] = useState<Detection[]>([]);
  const [isSubmittingAnnotations, setIsSubmittingAnnotations] = useState(false);
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAnnotations = useCallback(async (
    predictionId: number,
    studentAnnotations: StudentAnnotation[],
    token: string
  ) => {
    if (studentAnnotations.length === 0) return;

    setIsSubmittingAnnotations(true);
    setError(null);

    try {
      const annotations = studentAnnotations.map(ann => ({
        x_min: Math.floor(ann.x),
        y_min: Math.floor(ann.y),
        x_max: Math.floor(ann.x + ann.width),
        y_max: Math.floor(ann.y + ann.height),
        width: Math.floor(ann.width),
        height: Math.floor(ann.height),
        notes: ann.notes || ''
      }));

      await submitStudentAnnotations(predictionId, annotations, token);
      
      // Update current prediction
      setCurrentPrediction(prev => prev ? {
        ...prev,
        has_student_predictions: true,
        student_prediction_count: annotations.length
      } : null);

      // Convert annotations to detections for display
      const studentDetections: Detection[] = studentAnnotations.map((ann, index) => ({
        id: ann.id,
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        label: `Student #${index + 1}`,
        color: '#3b82f6',
        source: 'student'
      }));

      setAllDetections(prev => [
        ...prev.filter(d => d.source !== 'student'),
        ...studentDetections
      ]);

    } catch (err: any) {
      console.error('Submit annotations error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSubmittingAnnotations(false);
    }
  }, []);

  const runAI = useCallback(async (predictionId: number, token: string) => {
    setIsRunningAI(true);
    setError(null);

    try {
      const result = await runAiPrediction(predictionId, token);
      
      // Update prediction status
      setCurrentPrediction(prev => prev ? {
        ...prev,
        has_ai_predictions: true,
        ai_prediction_count: result.detection_count,
        ai_max_confidence: result.max_confidence
      } : null);

      // Get updated prediction data with detections
      const updatedPrediction = await fetch(`${API_BASE_URL}/api/fracture/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json());

      // Convert AI detections for display
      const aiDetections: Detection[] = updatedPrediction.detections
        .filter((d: any) => d.source === 'ai')
        .map((detection: any, index: number) => ({
          id: detection.id,
          x: detection.x_min,
          y: detection.y_min,
          width: detection.width,
          height: detection.height,
          label: `AI #${index + 1}`,
          confidence: detection.confidence,
          color: '#ef4444',
          source: 'ai' as const
        }));

      setAllDetections(prev => [
        ...prev.filter(d => d.source !== 'ai'),
        ...aiDetections
      ]);

    } catch (err: any) {
      console.error('AI prediction error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsRunningAI(false);
    }
  }, []);

  const fetchComparison = useCallback(async (predictionId: number, token: string) => {
    try {
      const comparisonResult = await getPredictionComparison(predictionId, token);
      setComparison(comparisonResult);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message);
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setCurrentPrediction(null);
    setComparison(null);
    setAllDetections([]);
    setError(null);
  }, []);

  return {
    currentPrediction,
    comparison,
    allDetections,
    isSubmittingAnnotations,
    isRunningAI,
    error,
    setCurrentPrediction,
    setAllDetections,
    submitAnnotations,
    runAI,
    fetchComparison,
    clearPrediction
  };
}