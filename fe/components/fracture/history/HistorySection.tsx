import React from 'react';

interface HistorySectionProps {
  onNavigateToHistory: () => void;
}

export function HistorySection({ onNavigateToHistory }: HistorySectionProps) {
  return (
    <div 
      className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border-2 border-green-200 hover:border-green-300 transition-all cursor-pointer hover:shadow-md"
      onClick={onNavigateToHistory}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="font-bold text-[var(--color-text-primary)] text-base">Prediction History</h4>
            <p className="text-sm text-gray-600 mb-3">View all your previous predictions and performance</p>
          </div>
        </div>
        <svg 
          className="w-6 h-6 text-[var(--color-primary)]" 
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