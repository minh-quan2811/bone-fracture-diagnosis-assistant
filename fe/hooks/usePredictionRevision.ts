import { useState, useCallback } from 'react';
import { StudentAnnotation, PredictionResult } from '../types/fracture';

interface UsePredictionRevisionReturn {
  isRevising: boolean;
  reviseError: string | null;
  loadPredictionForRevision: (
    predictionId: number,
    token: string,
    onSuccess: (annotations: StudentAnnotation[]) => void
  ) => Promise<void>;
  clearReviseError: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function usePredictionRevision(): UsePredictionRevisionReturn {
  const [isRevising, setIsRevising] = useState(false);
  const [reviseError, setReviseError] = useState<string | null>(null);

  const loadPredictionForRevision = useCallback(async (
    predictionId: number,
    token: string,
    onSuccess: (annotations: StudentAnnotation[]) => void
  ) => {
    setIsRevising(true);
    setReviseError(null);

    try {
      // Fetch current prediction details
      const response = await fetch(
        `${API_BASE_URL}/api/fracture/predictions/${predictionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch prediction details');
      }

      const predictionData = await response.json();

      // Extract student detections
      const studentDetections = predictionData.detections.filter(
        (d: any) => d.source === 'student'
      );

      // Convert database format to annotation format
      const editableAnnotations: StudentAnnotation[] = studentDetections.map(
        (det: any) => ({
          id: `edit-${det.id}-${Date.now()}`,
          x: det.x_min,
          y: det.y_min,
          width: det.width,
          height: det.height,
          fracture_type: det.fracture_type,
          notes: det.student_notes || ''
        })
      );

      // Call success callback with loaded annotations
      onSuccess(editableAnnotations);

    } catch (err: any) {
      console.error('Error loading prediction for revision:', err);
      setReviseError(err.message || 'Failed to load prediction for revision');
      throw err;
    } finally {
      setIsRevising(false);
    }
  }, []);

  const clearReviseError = useCallback(() => {
    setReviseError(null);
  }, []);

  return {
    isRevising,
    reviseError,
    loadPredictionForRevision,
    clearReviseError
  };
}