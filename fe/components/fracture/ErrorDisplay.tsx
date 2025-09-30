import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="text-red-800 text-sm">{error}</div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 ml-2"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}