import React from 'react';
import { PredictionComparison } from '../../types/fracture';

interface ComparisonResultsCardProps {
  comparison: PredictionComparison | null;
}

export function ComparisonResultsCard({ comparison }: ComparisonResultsCardProps) {
  if (!comparison) return null;

  const { comparison_metrics, student_detections, ai_detections, detailed_comparison, feedback } = comparison;

  // Determine result type
  let resultType: 'agreement' | 'disagreement' | 'student_only' | 'ai_only' | 'both_normal';
  let resultIcon: string;
  let resultText: string;
  let resultColor: string;

  if (comparison_metrics.both_normal) {
    resultType = 'both_normal';
    resultText = 'Both Agree: No Fracture';
    resultColor = 'bg-green-50 border-green-300 text-green-900';
  } else if (comparison_metrics.both_found_fractures) {
    resultType = 'agreement';
    resultText = 'Both Found Fractures';
    resultColor = 'bg-orange-50 border-orange-300 text-orange-900';
  } else if (comparison_metrics.student_only) {
    resultType = 'student_only';
    resultIcon = '🎓';
    resultText = 'Only You Found Fracture';
    resultColor = 'bg-blue-50 border-blue-300 text-blue-900';
  } else if (comparison_metrics.ai_only) {
    resultType = 'ai_only';
    resultText = 'Only AI Found Fracture';
    resultColor = 'bg-red-50 border-red-300 text-red-900';
  } else {
    resultType = 'disagreement';
    resultText = 'Results Differ';
    resultColor = 'bg-yellow-50 border-yellow-300 text-yellow-900';
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${resultColor}`}>
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h3 className="font-bold text-lg">Comparison Results</h3>
          <p className="text-sm font-medium">{resultText}</p>
        </div>
      </div>

      {/* Overall Feedback */}
      {feedback?.overall && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
          <p className="text-sm text-gray-900">{feedback.overall}</p>
        </div>
      )}

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

      {/* IoU Metrics */}
      {detailed_comparison?.iou_metrics && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
          <div className="font-semibold text-gray-900 mb-2 text-sm">📊 Detection Performance (IoU-based)</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Matched:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {detailed_comparison.summary.matched_count}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Avg IoU:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {(detailed_comparison.iou_metrics.avg_iou * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Precision:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {(detailed_comparison.iou_metrics.precision * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Recall:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {(detailed_comparison.iou_metrics.recall * 100).toFixed(1)}%
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">F1 Score:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {(detailed_comparison.iou_metrics.f1_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          {feedback?.detection_performance && (
            <p className="text-xs text-gray-700 mt-2">{feedback.detection_performance}</p>
          )}
        </div>
      )}

      {/* Fracture Type Metrics */}
      {detailed_comparison?.fracture_type_metrics && detailed_comparison.summary.matched_count > 0 && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
          <div className="font-semibold text-gray-900 mb-2 text-sm">🔍 Classification Performance</div>
          <div className="space-y-1 text-sm text-gray-900">
            <div className="flex justify-between">
              <span>Correct Classifications:</span>
              <span className="font-semibold text-green-600">
                {detailed_comparison.fracture_type_metrics.correct_count}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Incorrect Classifications:</span>
              <span className="font-semibold text-red-600">
                {detailed_comparison.fracture_type_metrics.incorrect_count}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span>Accuracy:</span>
              <span className="font-semibold text-blue-600">
                {(detailed_comparison.fracture_type_metrics.accuracy * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          {feedback?.classification_performance && (
            <p className="text-xs text-gray-700 mt-2">{feedback.classification_performance}</p>
          )}
        </div>
      )}

      {/* Matched Detections */}
      {detailed_comparison?.matches && detailed_comparison.matches.length > 0 && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
          <div className="font-semibold text-gray-900 mb-2 text-sm">✅ Matched Detections</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {detailed_comparison.matches.map((match, index) => (
              <div key={index} className="bg-green-50 rounded p-2 border border-green-200">
                <div className="flex justify-between items-start text-xs">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Match #{index + 1} - IoU: {(match.iou * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-700 mt-1">
                      <div>Your: {match.student_fracture_type || 'Unknown'}</div>
                      <div>
                        AI: {match.ai_fracture_type || 'Unknown'} (
                        {typeof match.ai_confidence === 'number'
                          ? `${(match.ai_confidence * 100).toFixed(0)}%`
                          : 'Confidence N/A'}
                        )
                      </div>
                    </div>
                  </div>
                  {match.fracture_type_match ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmatched Detections */}
      {detailed_comparison?.unmatched_student && detailed_comparison.unmatched_student.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 mb-4">
          <div className="font-semibold text-yellow-900 mb-2 text-sm">
            ⚠️ Your Unmatched Detections ({detailed_comparison.unmatched_student.length})
          </div>
          <div className="space-y-1 text-xs text-yellow-800">
            {detailed_comparison.unmatched_student.map((item, index) => (
              <div key={index}>
                • {item.fracture_type || 'Unknown'} {(typeof item.best_iou === 'number' && item.best_iou > 0) && `(Best IoU: ${(item.best_iou * 100).toFixed(1)}%)`}
              </div>
            ))}
          </div>
        </div>
      )}

      {detailed_comparison?.unmatched_ai && detailed_comparison.unmatched_ai.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200 mb-4">
          <div className="font-semibold text-red-900 mb-2 text-sm">
            🚨 Missed AI Detections ({detailed_comparison.unmatched_ai.length})
          </div>
          <div className="space-y-1 text-xs text-red-800">
            {detailed_comparison.unmatched_ai.map((item, index) => (
              <div key={index}>
                • {item.fracture_type || 'Unknown'} ({typeof item.confidence === 'number' ? `${(item.confidence * 100).toFixed(0)}% confidence` : 'Confidence N/A'})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {feedback?.suggestions && feedback.suggestions.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="font-semibold text-blue-900 mb-2 text-sm">Suggestions for Improvement</div>
          <div className="space-y-1">
            {feedback.suggestions.map((suggestion, index) => (
              <p key={index} className="text-xs text-blue-800">{suggestion}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}