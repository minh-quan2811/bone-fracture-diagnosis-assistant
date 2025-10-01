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
  fracture_type?: string;
  body_region?: string;
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
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {studentDetections.map((detection, index) => (
              <div key={detection.id} className="text-xs p-2 bg-blue-100 rounded">
                <div className="font-medium">Detection #{index + 1}</div>
                <div className="text-blue-700 mt-1 space-y-1">
                  {detection.body_region && (
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span className="font-medium">Body Region:</span>
                      <span className="capitalize">{detection.body_region}</span>
                    </div>
                  )}
                  {detection.fracture_type && (
                    <div className="flex items-center gap-1">
                      <span>🔍</span>
                      <span className="font-medium">Fracture Type:</span>
                      <span className="capitalize">{detection.fracture_type}</span>
                    </div>
                  )}
                  <div className="text-blue-600">
                    Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) • 
                    Size: {Math.round(detection.width)}×{Math.round(detection.height)}
                  </div>
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
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {aiDetections.map((detection, index) => (
              <div key={detection.id} className="text-xs p-2 bg-red-100 rounded">
                <div className="font-medium">Detection #{index + 1}</div>
                <div className="text-red-700 mt-1 space-y-1">
                  {detection.confidence && (
                    <div className="flex items-center gap-1">
                      <span>🎯</span>
                      <span className="font-medium">Confidence:</span>
                      <span>{(detection.confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {detection.body_region && (
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span className="font-medium">Body Region:</span>
                      <span className="capitalize">{detection.body_region}</span>
                    </div>
                  )}
                  {detection.fracture_type && (
                    <div className="flex items-center gap-1">
                      <span>🔍</span>
                      <span className="font-medium">Fracture Type:</span>
                      <span className="capitalize">{detection.fracture_type}</span>
                    </div>
                  )}
                  <div className="text-red-600">
                    Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) • 
                    Size: {Math.round(detection.width)}×{Math.round(detection.height)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}