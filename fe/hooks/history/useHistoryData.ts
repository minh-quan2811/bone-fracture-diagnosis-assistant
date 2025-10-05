import { useState, useEffect } from 'react';
import { FracturePrediction, PredictionComparison } from '@/types/fracture';
import { getAllPredictions, getPredictionComparison } from '@/lib/fracture-api';

export function useHistoryData(token: string) {
  const [predictions, setPredictions] = useState<FracturePrediction[]>([]);
  const [comparisons, setComparisons] = useState<Map<number, PredictionComparison>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        setError(null);
        
        const allPredictions = await getAllPredictions(token);
        
        const completedPredictions = allPredictions.filter(
          (p: FracturePrediction) => p.has_student_predictions && p.has_ai_predictions
        );
        
        setPredictions(completedPredictions);
        
        const comparisonMap = new Map<number, PredictionComparison>();
        
        for (const prediction of completedPredictions) {
          try {
            const comparison = await getPredictionComparison(
              prediction.id, 
              token
            );
            comparisonMap.set(prediction.id, comparison);
          } catch (err) {
            console.error(
              `Failed to fetch comparison for prediction ${prediction.id}:`,
              err
            );
          }
        }
        
        setComparisons(comparisonMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
        console.error("Error loading history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadHistory();
    }
  }, [token]);

  const refetch = () => {
    setIsLoading(true);
    setError(null);
  };

  return { 
    predictions, 
    comparisons, 
    isLoading, 
    error,
    refetch 
  };
}