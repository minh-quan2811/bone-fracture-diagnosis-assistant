import React from 'react';
import { PredictionResult } from '../../types/fracture';

interface PredictionStatusCardProps {
  currentPrediction: PredictionResult | null;
  isRevising: boolean;
  onRevise: () => void;
}

export function PredictionStatusCard({
  currentPrediction,
  isRevising,
  onRevise
}: PredictionStatusCardProps) {
  if (!currentPrediction?.has_student_predictions) {
    return null;
  }

  const hasAiPredictions = currentPrediction.has_ai_predictions;
  const fractureCount = currentPrediction.student_prediction_count;
  const fractureText = fractureCount === 0
    ? ' (No fractures detected)'
    : ` (${fractureCount} fracture${fractureCount > 1 ? 's' : ''})`;

  // State 1: Submitted but no AI yet - Can revise
  if (!hasAiPredictions) {
    return (
      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-green-800 text-xs font-medium mb-1">
              Prediction Submitted{fractureText}
            </p>
            <p className="text-green-700 text-xs">
              You can still revise your prediction before running AI comparison
            </p>
          </div>
          <button
            onClick={onRevise}
            disabled={isRevising}
            className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isRevising ? 'Loading...' : 'Revise'}
          </button>
        </div>
      </div>
    );
  }

  // State 2: AI prediction run - Locked
  return (
    <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
      <p className="text-blue-800 text-xs font-medium">
        Prediction Locked{fractureText}
      </p>
      <p className="text-blue-700 text-xs mt-1">
        AI comparison completed. Clear all to start new prediction.
      </p>
    </div>
  );
}