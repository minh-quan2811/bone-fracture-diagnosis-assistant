import React from 'react';

interface ComparisonMetrics {
  student_count: number;
  ai_count: number;
  both_found_fractures: boolean;
  student_only: boolean;
  ai_only: boolean;
  both_normal: boolean;
}

interface ComparisonResult {
  prediction_id: number;
  image_filename: string;
  student_detections: any[];
  ai_detections: any[];
  comparison_metrics: ComparisonMetrics;
}

interface ComparisonResultsCardProps {
  comparison: ComparisonResult;
}

export function ComparisonResultsCard({ comparison }: ComparisonResultsCardProps) {
  const { comparison_metrics } = comparison;

  return (
    <div className="bg-yellow-50 rounded-lg p-3">
      <h4 className="font-medium text-yellow-900 mb-2 text-sm">🎯 Comparison Results</h4>
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Student Found:</span>
              <span className="font-medium">{comparison_metrics.student_count} fractures</span>
            </div>
            <div className="flex justify-between">
              <span>AI Found:</span>
              <span className="font-medium">{comparison_metrics.ai_count} fractures</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-center">
              {comparison_metrics.both_found_fractures && (
                <div className="text-orange-600 font-medium">⚖️ Agreement</div>
              )}
              {comparison_metrics.both_normal && (
                <div className="text-green-600 font-medium">✅ Both Normal</div>
              )}
              {comparison_metrics.student_only && (
                <div className="text-blue-600 font-medium">🎓 Student Only</div>
              )}
              {comparison_metrics.ai_only && (
                <div className="text-red-600 font-medium">🤖 AI Only</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-yellow-200">
          <p className="text-yellow-800 text-xs">
            {comparison_metrics.both_found_fractures && 
              "Great! Both you and the AI identified fractures. Compare the locations to see how well they match."}
            {comparison_metrics.both_normal && 
              "Perfect agreement! Both you and the AI found no fractures in this image."}
            {comparison_metrics.student_only && 
              "You identified fractures that the AI missed. This could be a learning opportunity for the AI model."}
            {comparison_metrics.ai_only && 
              "The AI found fractures that you may have missed. Review the AI's findings to improve your detection skills."}
          </p>
        </div>
      </div>
    </div>
  );
}