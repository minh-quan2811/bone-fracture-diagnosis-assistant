import React from 'react';
import { StudentAnnotation } from '../../types/fracture';

interface StudentActionButtonsProps {
  // State
  isAnnotating: boolean;
  annotations: StudentAnnotation[];
  isSubmittingAnnotations: boolean;
  allAnnotationsHaveDetails: boolean;
  canSubmit: boolean;

  // Actions
  onToggleAnnotating: () => void;
  onSubmitAnnotations: () => void;
  onSubmitNoFracture: () => void;
  onClearAnnotations: () => void;
}

export function StudentActionButtons({
  isAnnotating,
  annotations,
  isSubmittingAnnotations,
  allAnnotationsHaveDetails,
  canSubmit,
  onToggleAnnotating,
  onSubmitAnnotations,
  onSubmitNoFracture,
  onClearAnnotations
}: StudentActionButtonsProps) {
  if (!canSubmit) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Toggle Annotation Mode */}
      <button
        onClick={onToggleAnnotating}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          isAnnotating
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
      >
        <span className="text-lg">✏️</span>
        {isAnnotating ? 'Stop Annotating' : 'Start Annotating'}
      </button>

      {/* Submit with annotations */}
      {annotations.length > 0 && (
        <>
          <button
            onClick={onSubmitAnnotations}
            disabled={isSubmittingAnnotations || !allAnnotationsHaveDetails}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title={
              !allAnnotationsHaveDetails
                ? 'Please select fracture type for all annotations'
                : ''
            }
          >
            <span className="text-lg">
              {isSubmittingAnnotations ? '⏳' : '✅'}
            </span>
            {isSubmittingAnnotations
              ? 'Submitting...'
              : `Submit ${annotations.length} Fracture${
                  annotations.length !== 1 ? 's' : ''
                }`}
          </button>

          <button
            onClick={onClearAnnotations}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <span className="text-lg">🗑️</span>
            Clear Draft
          </button>
        </>
      )}

      {/* Submit No Fracture button - when no annotations */}
      {annotations.length === 0 && !isAnnotating && (
        <button
          onClick={onSubmitNoFracture}
          disabled={isSubmittingAnnotations}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-lg">
            {isSubmittingAnnotations ? '⏳' : '🚫'}
          </span>
          {isSubmittingAnnotations ? 'Submitting...' : 'Submit: No Fractures'}
        </button>
      )}
    </div>
  );
}