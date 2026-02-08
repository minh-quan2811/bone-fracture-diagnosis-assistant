import React from 'react';

interface ImageNavigatorProps {
  currentIndex: number;
  totalImages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function ImageNavigator({ 
  currentIndex, 
  totalImages, 
  onPrevious, 
  onNext 
}: ImageNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="p-3 bg-[var(--color-gray-700)] text-white rounded-lg hover:bg-[var(--color-gray-800)] disabled:bg-[var(--color-gray-300)] disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        aria-label="Previous image"
        title="Previous (←)"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 19l-7-7 7-7" 
          />
        </svg>
      </button>
      
      <div className="text-center min-w-[120px]">
        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
          {currentIndex + 1} / {totalImages}
        </div>
        <div className="text-sm text-[var(--color-text-secondary)]">Image</div>
      </div>
      
      <button
        onClick={onNext}
        disabled={currentIndex === totalImages - 1}
        className="p-3 bg-[var(--color-gray-700)] text-white rounded-lg hover:bg-[var(--color-gray-800)] disabled:bg-[var(--color-gray-300)] disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        aria-label="Next image"
        title="Next (→)"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </button>
    </div>
  );
}