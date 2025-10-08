import React from 'react';

interface DocumentHistorySectionProps {
  onNavigateToHistory: () => void;
}

export function DocumentHistorySection({ onNavigateToHistory }: DocumentHistorySectionProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-indigo-300 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900 text-base mb-1">
            Document Upload History
          </h4>
          <p className="text-sm text-gray-600">
            View all uploaded medical documents and their processing status
          </p>
        </div>
        <button
          onClick={onNavigateToHistory}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View History
        </button>
      </div>
    </div>
  );
}