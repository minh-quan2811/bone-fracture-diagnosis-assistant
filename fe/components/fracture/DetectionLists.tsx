import React from 'react';

interface Detection {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence?: number;
  color: string;
  source: 'student' | 'ai';
}

interface DetectionListsProps {
  detections: Detection[];
}

export function DetectionLists({ detections }: DetectionListsProps) {
  const studentDetections = detections.filter(d => d.source === 'student');
  const aiDetections = detections.filter(d => d.source === 'ai');

  if (detections.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Student Detections */}
      {studentDetections.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2 text-sm">
            🎓 Your Predictions ({studentDetections.length})
          </h4>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {studentDetections.map((detection) => (
              <div key={detection.id} className="text-xs p-2 bg-blue-100 rounded">
                <div className="font-medium">{detection.label}</div>
                <div className="text-blue-700">
                  Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) 
                  Size: {Math.round(detection.width)}×{Math.round(detection.height)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Detections */}
      {aiDetections.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3">
          <h4 className="font-medium text-red-900 mb-2 text-sm">
            🤖 AI Predictions ({aiDetections.length})
          </h4>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {aiDetections.map((detection) => (
              <div key={detection.id} className="text-xs p-2 bg-red-100 rounded">
                <div className="font-medium">{detection.label}</div>
                <div className="text-red-700">
                  Confidence: {detection.confidence ? (detection.confidence * 100).toFixed(1) + '%' : 'N/A'}
                </div>
                <div className="text-red-700">
                  Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) 
                  Size: {Math.round(detection.width)}×{Math.round(detection.height)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}