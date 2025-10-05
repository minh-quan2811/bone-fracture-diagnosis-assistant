import { useMemo } from 'react';
import { PredictionComparison } from '@/types/fracture';

export interface OverallStats {
  total_images: number;
  avg_iou_accuracy: number;
  fracture_type_accuracy: number;
  total_matches: number;
  total_student_predictions: number;
  total_ai_predictions: number;
}

export function useOverallStats(
  comparisons: Map<number, PredictionComparison>
): OverallStats {
  return useMemo(() => {
    const comparisonArray = Array.from(comparisons.values());
    
    if (comparisonArray.length === 0) {
      return {
        total_images: 0,
        avg_iou_accuracy: 0,
        fracture_type_accuracy: 0,
        total_matches: 0,
        total_student_predictions: 0,
        total_ai_predictions: 0,
      };
    }

    const totalMatches = comparisonArray.reduce(
      (sum, c) => sum + c.detailed_comparison.summary.matched_count, 
      0
    );
    
    const totalStudentPredictions = comparisonArray.reduce(
      (sum, c) => sum + c.detailed_comparison.summary.student_count, 
      0
    );
    
    const totalAiPredictions = comparisonArray.reduce(
      (sum, c) => sum + c.detailed_comparison.summary.ai_count, 
      0
    );

    const avgIoU = comparisonArray.reduce(
      (sum, c) => sum + c.detailed_comparison.iou_metrics.f1_score, 
      0
    ) / comparisonArray.length;

    const fractureTypeAccuracy = comparisonArray.reduce(
      (sum, c) => sum + c.detailed_comparison.fracture_type_metrics.accuracy, 
      0
    ) / comparisonArray.length;

    return {
      total_images: comparisonArray.length,
      avg_iou_accuracy: avgIoU * 100,
      fracture_type_accuracy: fractureTypeAccuracy * 100,
      total_matches: totalMatches,
      total_student_predictions: totalStudentPredictions,
      total_ai_predictions: totalAiPredictions,
    };
  }, [comparisons]);
}