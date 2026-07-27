import React from 'react';

interface ComparisonResultsButtonProps {
  isOpen: boolean;
  onClick: () => void;
  /** Whether comparison data exists for the currently selected image */
  hasData: boolean;
}

export function ComparisonResultsButton({ isOpen, onClick, hasData }: ComparisonResultsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasData}
      aria-pressed={isOpen}
      aria-label={isOpen ? 'Hide comparison results' : 'Show comparison results'}
      title={
        hasData
          ? isOpen
            ? 'Hide comparison results'
            : 'Show comparison results'
          : 'No comparison available for this image'
      }
      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors duration-150 flex-shrink-0 ${
        isOpen
          ? 'bg-blue-50 border-blue-300 text-blue-700'
          : 'border-gray-200 text-gray-500 hover:border-[#2E7D5C] hover:text-[#2E7D5C]'
      } disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3v18M4 6h5m-5 6h5m-5 6h5M15 3v18m5-15h-5m5 6h-5m5 6h-5"
        />
      </svg>
    </button>
  );
}