import React from 'react';
import { Detection } from '../../types/fracture';

interface DetectionListsProps {
  detections: Detection[];
}

export function DetectionLists({ detections }: DetectionListsProps) {
  const studentDetections = detections.filter(d => d.source === 'student');
  const aiDetections = detections.filter(d => d.source === 'ai');

  if (detections.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Student Detections */}
      {studentDetections.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3 text-base">
              Your Predictions ({studentDetections.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {studentDetections.map((detection, index) => (
              <div key={detection.id} className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                <div className="font-semibold text-gray-900 text-sm mb-2">
                  Detection #{index + 1}
                </div>
                <div className="text-gray-900 space-y-1.5 text-sm">
                  {detection.fracture_type && (
                    <div className="flex items-center gap-2">
                      <span>🔍</span>
                      <span className="font-medium">Fracture Type:</span>
                      <span className="capitalize">{detection.fracture_type}</span>
                    </div>
                  )}
                  <div className="text-gray-700 text-xs">
                    Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) • 
                    Size: {Math.round(detection.width)}×{Math.round(detection.height)}px
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Detections */}
      {aiDetections.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-3 text-base">
              AI Predictions ({aiDetections.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {aiDetections.map((detection, index) => (
              <div key={detection.id} className="bg-red-100 rounded-lg p-3 border border-red-300">
                <div className="font-semibold text-gray-900 text-sm mb-2">
                  Detection #{index + 1}
                </div>
                <div className="text-gray-900 space-y-1.5 text-sm">
                  {detection.confidence && (
                    <div className="flex items-center gap-2">
                      <span>🎯</span>
                      <span className="font-medium">Confidence:</span>
                      <span className="font-semibold">{(detection.confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {detection.fracture_type && (
                    <div className="flex items-center gap-2">
                      <span>🔍</span>
                      <span className="font-medium">Fracture Type:</span>
                      <span className="capitalize">{detection.fracture_type}</span>
                    </div>
                  )}
                  <div className="text-gray-700 text-xs">
                    Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) • 
                    Size: {Math.round(detection.width)}×{Math.round(detection.height)}px
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