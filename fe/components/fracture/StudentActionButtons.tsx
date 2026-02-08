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
            ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
            : 'bg-[var(--color-primary-lightest)] text-[var(--color-primary-darkest)] hover:bg-[var(--color-primary-light)]'
        }`}
      >
        {isAnnotating ? 'Stop Annotating' : 'Start Annotating'}
      </button>

      {/* Submit with annotations */}
      {annotations.length > 0 && (
        <>
          <button
            onClick={onSubmitAnnotations}
            disabled={isSubmittingAnnotations || !allAnnotationsHaveDetails}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-success)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:bg-[var(--color-gray-400)] disabled:cursor-not-allowed transition-colors"
            title={
              !allAnnotationsHaveDetails
                ? 'Please select fracture type for all annotations'
                : ''
            }
          >
            {isSubmittingAnnotations
              ? 'Submitting...'
              : `Submit ${annotations.length} Fracture${
                  annotations.length !== 1 ? 's' : ''
                }`}
          </button>

          <button
            onClick={onClearAnnotations}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-warning)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
          >
            Clear Draft
          </button>
        </>
      )}

      {/* Submit No Fracture button - when no annotations */}
      {annotations.length === 0 && !isAnnotating && (
        <button
          onClick={onSubmitNoFracture}
          disabled={isSubmittingAnnotations}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-error)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:bg-[var(--color-gray-400)] disabled:cursor-not-allowed transition-colors"
        >
          {isSubmittingAnnotations ? 'Submitting...' : 'Submit: No Fractures'}
        </button>
      )}
    </div>
  );
}