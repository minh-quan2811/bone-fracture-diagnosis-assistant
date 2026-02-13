import React from 'react';
import { OverallStats } from '@/hooks/fracture/history';

interface OverallStatsCardProps {
  stats: OverallStats;
}

export function OverallStatsCard({ stats }: OverallStatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-[var(--color-border)]">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
        Overall Performance Summary
      </h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Images</div>
          <div className="text-3xl font-bold text-blue-900">{stats.total_images}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Avg IoU Accuracy (F1)</div>
          <div className="text-3xl font-bold text-green-900">
            {stats.avg_iou_accuracy.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Fracture Type Accuracy</div>
          <div className="text-3xl font-bold text-purple-900">
            {stats.fracture_type_accuracy.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}