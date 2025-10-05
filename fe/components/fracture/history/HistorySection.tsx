import React from 'react';

interface HistorySectionProps {
  onNavigateToHistory: () => void;
}

export function HistorySection({ onNavigateToHistory }: HistorySectionProps) {
  return (
    <div 
      className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200 hover:border-purple-300 transition-all cursor-pointer hover:shadow-md"
      onClick={onNavigateToHistory}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="font-bold text-gray-900 text-base">Prediction History</h4>
            <p className="text-sm text-gray-600">View all your previous predictions and performance</p>
          </div>
        </div>
        <svg 
          className="w-6 h-6 text-purple-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}