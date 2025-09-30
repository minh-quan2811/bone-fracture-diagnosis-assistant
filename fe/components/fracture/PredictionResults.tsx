import React from 'react';

interface PredictionResult {
  id: number;
  has_student_predictions: boolean;
  has_ai_predictions: boolean;
  student_prediction_count: number;
  ai_prediction_count: number;
  ai_max_confidence: number | null;
  ai_inference_time: number | null;
}

interface PredictionResultsProps {
  prediction: PredictionResult;
}

export function PredictionResults({ prediction }: PredictionResultsProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="font-medium text-gray-900 mb-2 text-sm">Analysis Status</h4>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Student Predictions:</span>
            <span className={prediction.has_student_predictions ? 'text-green-600' : 'text-gray-500'}>
              {prediction.has_student_predictions ? '✓' : '○'} {prediction.student_prediction_count}
            </span>
          </div>
          <div className="flex justify-between">
            <span>AI Predictions:</span>
            <span className={prediction.has_ai_predictions ? 'text-green-600' : 'text-gray-500'}>
              {prediction.has_ai_predictions ? '✓' : '○'} {prediction.ai_prediction_count}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          {prediction.ai_max_confidence && (
            <div className="flex justify-between">
              <span>AI Confidence:</span>
              <span>{(prediction.ai_max_confidence * 100).toFixed(1)}%</span>
            </div>
          )}
          {prediction.ai_inference_time && (
            <div className="flex justify-between">
              <span>AI Time:</span>
              <span>{(prediction.ai_inference_time * 1000).toFixed(0)}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}