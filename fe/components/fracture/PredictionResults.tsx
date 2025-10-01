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
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <h4 className="font-semibold text-black mb-2 text-sm">Analysis Status</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-black">Student Predictions:</span>
            <span className={prediction.has_student_predictions ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
              {prediction.has_student_predictions ? '✓' : '○'} {prediction.student_prediction_count}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">AI Predictions:</span>
            <span className={prediction.has_ai_predictions ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
              {prediction.has_ai_predictions ? '✓' : '○'} {prediction.ai_prediction_count}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          {prediction.ai_max_confidence && (
            <div className="flex justify-between">
              <span className="text-black">AI Confidence:</span>
              <span className="font-medium">{(prediction.ai_max_confidence * 100).toFixed(1)}%</span>
            </div>
          )}
          {prediction.ai_inference_time && (
            <div className="flex justify-between">
              <span className="text-black">AI Time:</span>
              <span className="font-medium">{(prediction.ai_inference_time * 1000).toFixed(0)}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
