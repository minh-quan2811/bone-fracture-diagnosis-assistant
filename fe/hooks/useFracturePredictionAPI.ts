import { useState, useCallback } from 'react';
import { FractureService } from '@/services/fractureService';
import { StudentAnnotation, Detection, PredictionResult, ComparisonResult } from '../types/fracture';

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
    // Allow empty annotations (student predicts no fracture)
    setIsSubmittingAnnotations(true);
    setError(null);

    try {
      await FractureService.submitAnnotations(predictionId, studentAnnotations, token);
      
      // Update current prediction
      setCurrentPrediction(prev => prev ? {
        ...prev,
        has_student_predictions: true,
        student_prediction_count: studentAnnotations.length
      } : null);

      // Convert annotations to detections for display (only if there are annotations)
      if (studentAnnotations.length > 0) {
        const studentDetections: Detection[] = studentAnnotations.map((ann, index) => ({
          id: ann.id,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
          label: ann.fracture_type || 'Unknown',
          color: '#3b82f6',
          source: 'student',
          fracture_type: ann.fracture_type
          // body_region removed
        }));

        setAllDetections(prev => [
          ...prev.filter(d => d.source !== 'student'),
          ...studentDetections
        ]);
      } else {
        // Remove any existing student detections if submitting empty
        setAllDetections(prev => prev.filter(d => d.source !== 'student'));
      }

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
      const result = await FractureService.runAI(predictionId, token);
      
      // Update prediction status
      setCurrentPrediction(prev => prev ? {
        ...prev,
        has_ai_predictions: true,
        ai_prediction_count: result.detection_count,
        ai_max_confidence: result.max_confidence
      } : null);

      // Get updated prediction data with detections
      const updatedPrediction = await FractureService.getPredictionDetails(predictionId, token);

      // Convert AI detections for display
      const aiDetections: Detection[] = updatedPrediction.detections
        .filter((d: any) => d.source === 'ai')
        .map((detection: any, index: number) => ({
          id: detection.id,
          x: detection.x_min,
          y: detection.y_min,
          width: detection.width,
          height: detection.height,
          label: `AI: ${detection.fracture_type || 'Unknown'}`,
          confidence: detection.confidence,
          color: '#ef4444',
          source: 'ai' as const,
          fracture_type: detection.fracture_type
          // body_region removed
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
      const comparisonResult = await FractureService.getComparison(predictionId, token);
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