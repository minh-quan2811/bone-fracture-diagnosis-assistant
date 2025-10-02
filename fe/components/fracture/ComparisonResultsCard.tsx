import React from 'react';

interface FractureDetection {
  id: number;
  prediction_id: number;
  source: 'student' | 'ai';
  class_id: number;
  class_name: string;
  confidence: number | null;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
  fracture_type?: string;
  body_region?: string;
  student_notes?: string;
  created_at: string;
}

interface ComparisonMetrics {
  student_count: number;
  ai_count: number;
  both_found_fractures: boolean;
  student_only: boolean;
  ai_only: boolean;
  both_normal: boolean;
  fracture_type_matches: number;
  body_region_matches: number;
}

interface PredictionComparison {
  prediction_id: number;
  image_filename: string;
  student_detections: FractureDetection[];
  ai_detections: FractureDetection[];
  comparison_metrics: ComparisonMetrics;
}

interface ComparisonResultsCardProps {
  comparison: PredictionComparison | null;
}

export function ComparisonResultsCard({ comparison }: ComparisonResultsCardProps) {
  if (!comparison) return null;

  const { comparison_metrics, student_detections, ai_detections } = comparison;

  // Determine result type
  let resultType: 'agreement' | 'disagreement' | 'student_only' | 'ai_only' | 'both_normal';
  let resultIcon: string;
  let resultText: string;
  let resultColor: string;

  if (comparison_metrics.both_normal) {
    resultType = 'both_normal';
    resultIcon = '✅';
    resultText = 'Both Agree: No Fracture';
    resultColor = 'bg-green-50 border-green-300 text-green-900';
  } else if (comparison_metrics.both_found_fractures) {
    resultType = 'agreement';
    resultIcon = '⚖️';
    resultText = 'Both Found Fractures';
    resultColor = 'bg-orange-50 border-orange-300 text-orange-900';
  } else if (comparison_metrics.student_only) {
    resultType = 'student_only';
    resultIcon = '🎓';
    resultText = 'Only You Found Fracture';
    resultColor = 'bg-blue-50 border-blue-300 text-blue-900';
  } else if (comparison_metrics.ai_only) {
    resultType = 'ai_only';
    resultIcon = '🤖';
    resultText = 'Only AI Found Fracture';
    resultColor = 'bg-red-50 border-red-300 text-red-900';
  } else {
    resultType = 'disagreement';
    resultIcon = '⚠️';
    resultText = 'Results Differ';
    resultColor = 'bg-yellow-50 border-yellow-300 text-yellow-900';
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${resultColor}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{resultIcon}</span>
        <div>
          <h3 className="font-bold text-lg">Comparison Results</h3>
          <p className="text-sm font-medium">{resultText}</p>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Your Detections</div>
          <div className="text-2xl font-bold text-blue-600">{comparison_metrics.student_count}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">AI Detections</div>
          <div className="text-2xl font-bold text-red-600">{comparison_metrics.ai_count}</div>
        </div>
      </div>

      {/* Matches */}
      {(comparison_metrics.fracture_type_matches > 0 || comparison_metrics.body_region_matches > 0) && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
          <div className="font-semibold text-gray-900 mb-2 text-sm">Matches Found:</div>
          <div className="space-y-1 text-sm text-gray-900">
            {comparison_metrics.fracture_type_matches > 0 && (
              <div className="flex items-center gap-2">
                <span>🔍</span>
                <span>{comparison_metrics.fracture_type_matches} Fracture Type Match{comparison_metrics.fracture_type_matches !== 1 ? 'es' : ''}</span>
              </div>
            )}
            {comparison_metrics.body_region_matches > 0 && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{comparison_metrics.body_region_matches} Body Region Match{comparison_metrics.body_region_matches !== 1 ? 'es' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Detections Side by Side */}
      {(student_detections.length > 0 || ai_detections.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {/* Student Detections */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">🎓 Your Predictions</h4>
            {student_detections.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {student_detections.map((detection, index) => (
                  <div key={detection.id} className="bg-blue-100 rounded p-2 border border-blue-300">
                    <div className="font-medium text-gray-900 text-xs mb-1">#{index + 1}</div>
                    <div className="space-y-1 text-xs text-gray-900">
                      {detection.body_region && (
                        <div className="capitalize">📍 {detection.body_region}</div>
                      )}
                      {detection.fracture_type && (
                        <div className="capitalize">🔍 {detection.fracture_type}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-100 rounded p-3 text-center text-xs text-gray-600">
                No predictions
              </div>
            )}
          </div>

          {/* AI Detections */}
          <div>
            <h4 className="font-semibold text-red-900 mb-2 text-sm">🤖 AI Predictions</h4>
            {ai_detections.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ai_detections.map((detection, index) => (
                  <div key={detection.id} className="bg-red-100 rounded p-2 border border-red-300">
                    <div className="font-medium text-gray-900 text-xs mb-1">
                      #{index + 1} 
                      {detection.confidence && (
                        <span className="ml-1">({(detection.confidence * 100).toFixed(0)}%)</span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-gray-900">
                      {detection.body_region && (
                        <div className="capitalize">📍 {detection.body_region}</div>
                      )}
                      {detection.fracture_type && (
                        <div className="capitalize">🔍 {detection.fracture_type}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-100 rounded p-3 text-center text-xs text-gray-600">
                No predictions
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback based on result */}
      <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
        <div className="text-xs text-gray-900">
          {resultType === 'both_normal' && (
            <p>✅ <strong>Great!</strong> Both you and the AI agree there are no fractures in this image.</p>
          )}
          {resultType === 'agreement' && (
            <p>🎉 <strong>Good work!</strong> Both you and the AI detected fractures. Review the specific locations and classifications to see how closely they match.</p>
          )}
          {resultType === 'student_only' && (
            <p>🤔 <strong>Interesting!</strong> You detected fractures that the AI didn't. Double-check your findings - you might have caught something subtle, or it could be a false positive.</p>
          )}
          {resultType === 'ai_only' && (
            <p>👀 <strong>Review needed!</strong> The AI detected fractures that you didn't mark. Take another look at the image to see if you missed anything.</p>
          )}
          {resultType === 'disagreement' && (
            <p>⚠️ <strong>Mixed results!</strong> There are differences between your predictions and the AI's. Carefully compare both to learn and improve.</p>
          )}
        </div>
      </div>
    </div>
  );
}