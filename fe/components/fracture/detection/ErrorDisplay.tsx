import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">❌</span>
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 font-bold text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}