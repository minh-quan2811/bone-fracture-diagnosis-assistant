import React from 'react';

interface ComparisonMetrics {
  student_count: number;
  ai_count: number;
  both_found_fractures: boolean;
  student_only: boolean;
  ai_only: boolean;
  both_normal: boolean;
}

interface FractureDetection {
  id: number;
  source: 'student' | 'ai';
  class_name: string;
  confidence: number | null;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
  student_notes?: string;
}

interface PredictionComparison {
  prediction_id: number;
  image_filename: string;
  student_detections: FractureDetection[];
  ai_detections: FractureDetection[];
  comparison_metrics: ComparisonMetrics;
}

interface ComparisonViewProps {
  comparison: PredictionComparison;
  className?: string;
}

export function ComparisonView({ comparison, className = "" }: ComparisonViewProps) {
  const { comparison_metrics, student_detections, ai_detections } = comparison;

  const getComparisonMessage = () => {
    if (comparison_metrics.both_found_fractures) {
      return {
        icon: "⚖️",
        title: "Agreement: Both Found Fractures",
        message: "Great! Both you and the AI identified fractures. Compare the locations to see how well they match.",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    }
    if (comparison_metrics.both_normal) {
      return {
        icon: "✅",
        title: "Perfect Agreement: Both Normal",
        message: "Excellent! Both you and the AI found no fractures in this image.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    }
    if (comparison_metrics.student_only) {
      return {
        icon: "🎓",
        title: "Student Found Fractures",
        message: "You identified fractures that the AI missed. This could be a learning opportunity for the AI model, or consider if these might be false positives.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    }
    if (comparison_metrics.ai_only) {
      return {
        icon: "🤖",
        title: "AI Found Fractures",
        message: "The AI found fractures that you may have missed. Review the AI's findings to improve your detection skills.",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      };
    }
    return {
      icon: "❓",
      title: "Unknown Comparison",
      message: "Unable to determine comparison result.",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    };
  };

  const comparisonInfo = getComparisonMessage();

  return (
    <div className={`${comparisonInfo.bgColor} ${comparisonInfo.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">{comparisonInfo.icon}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${comparisonInfo.color} mb-2`}>
            {comparisonInfo.title}
          </h3>
          <p className={`text-sm ${comparisonInfo.color.replace('600', '700')} mb-3`}>
            {comparisonInfo.message}
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Your Predictions:</span>
            <span className={`font-bold ${comparison_metrics.student_count > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
              {comparison_metrics.student_count} fracture{comparison_metrics.student_count !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">AI Predictions:</span>
            <span className={`font-bold ${comparison_metrics.ai_count > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {comparison_metrics.ai_count} fracture{comparison_metrics.ai_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-center">
            <div className="text-lg font-bold mb-1">
              {comparison_metrics.both_found_fractures && '🤝'}
              {comparison_metrics.both_normal && '✨'}
              {comparison_metrics.student_only && '🎯'}
              {comparison_metrics.ai_only && '🔍'}
            </div>
            <div className="text-xs text-gray-600">
              {comparison_metrics.both_found_fractures && 'Agreement'}
              {comparison_metrics.both_normal && 'Both Normal'}
              {comparison_metrics.student_only && 'Student Only'}
              {comparison_metrics.ai_only && 'AI Only'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Detection Lists */}
      {(student_detections.length > 0 || ai_detections.length > 0) && (
        <div className="border-t pt-3 mt-3">
          <h4 className="font-medium text-gray-900 mb-3 text-sm">Detection Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Detections */}
            {student_detections.length > 0 && (
              <div>
                <h5 className="font-medium text-blue-700 mb-2 text-xs">
                  🎓 Your Detections ({student_detections.length})
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {student_detections.map((detection, index) => (
                    <div key={detection.id} className="bg-blue-100 rounded p-2 text-xs">
                      <div className="font-medium">Detection #{index + 1}</div>
                      <div className="text-blue-700">
                        Position: ({detection.x_min}, {detection.y_min})
                      </div>
                      <div className="text-blue-700">
                        Size: {detection.width}×{detection.height}
                      </div>
                      {detection.student_notes && (
                        <div className="text-blue-600 mt-1 italic">
                          Note: {detection.student_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Detections */}
            {ai_detections.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 mb-2 text-xs">
                  🤖 AI Detections ({ai_detections.length})
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {ai_detections.map((detection, index) => (
                    <div key={detection.id} className="bg-red-100 rounded p-2 text-xs">
                      <div className="font-medium">Detection #{index + 1}</div>
                      <div className="text-red-700">
                        Confidence: {detection.confidence ? (detection.confidence * 100).toFixed(1) + '%' : 'N/A'}
                      </div>
                      <div className="text-red-700">
                        Position: ({detection.x_min}, {detection.y_min})
                      </div>
                      <div className="text-red-700">
                        Size: {detection.width}×{detection.height}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Learning Insights */}
      <div className="border-t pt-3 mt-3">
        <h4 className="font-medium text-gray-900 mb-2 text-sm">💡 Learning Insights</h4>
        <div className="text-xs text-gray-600 space-y-1">
          {comparison_metrics.both_found_fractures && (
            <p>• Compare the exact locations of your predictions with the AI's to understand detection precision.</p>
          )}
          {comparison_metrics.student_only && (
            <p>• Consider reviewing medical imaging principles to understand potential false positives.</p>
          )}
          {comparison_metrics.ai_only && (
            <p>• Study the AI's detected areas to improve your fracture recognition skills.</p>
          )}
          {comparison_metrics.both_normal && (
            <p>• Well done! This demonstrates good agreement in identifying normal bone structure.</p>
          )}
        </div>
      </div>
    </div>
  );
}