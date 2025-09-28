import React from 'react';

interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
}

interface AnnotationControlsProps {
  // State
  isAnnotating: boolean;
  isSubmittingAnnotations: boolean;
  isRunningAI: boolean;
  annotations: StudentAnnotation[];
  hasStudentPredictions: boolean;
  hasAiPredictions: boolean;
  showStudentAnnotations: boolean;
  showAiPredictions: boolean;
  studentCount: number;
  aiCount: number;
  
  // Actions
  onToggleAnnotating: () => void;
  onSubmitAnnotations: () => void;
  onRunAiPrediction: () => void;
  onClearAll: () => void;
  onToggleStudentAnnotations: (show: boolean) => void;
  onToggleAiPredictions: (show: boolean) => void;
  onRemoveAnnotation?: (id: string) => void;
  
  // Optional customization
  disabled?: boolean;
  className?: string;
}

export function AnnotationControls({
  // State
  isAnnotating,
  isSubmittingAnnotations,
  isRunningAI,
  annotations,
  hasStudentPredictions,
  hasAiPredictions,
  showStudentAnnotations,
  showAiPredictions,
  studentCount,
  aiCount,
  
  // Actions
  onToggleAnnotating,
  onSubmitAnnotations,
  onRunAiPrediction,
  onClearAll,
  onToggleStudentAnnotations,
  onToggleAiPredictions,
  onRemoveAnnotation,
  
  // Optional
  disabled = false,
  className = ""
}: AnnotationControlsProps) {
  
  const hasUnsavedAnnotations = annotations.length > 0;
  const canSubmitAnnotations = hasUnsavedAnnotations && !isSubmittingAnnotations;
  const canRunAI = !isRunningAI;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary Action Buttons */}
      <div className="space-y-2">
        {/* Annotation Toggle */}
        <button
          onClick={onToggleAnnotating}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isAnnotating 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-lg">✏️</span>
          {isAnnotating ? 'Stop Annotating' : 'Start Annotating'}
        </button>

        {/* Submit Annotations */}
        {hasUnsavedAnnotations && (
          <button
            onClick={onSubmitAnnotations}
            disabled={!canSubmitAnnotations || disabled}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">{isSubmittingAnnotations ? '⏳' : '✅'}</span>
            {isSubmittingAnnotations ? 'Submitting...' : `Confirm ${annotations.length} Annotation${annotations.length !== 1 ? 's' : ''}`}
          </button>
        )}

        {/* AI Prediction */}
        <button
          onClick={onRunAiPrediction}
          disabled={!canRunAI || disabled}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-lg">{isRunningAI ? '⏳' : '🤖'}</span>
          {isRunningAI ? 'Running AI...' : 'Run AI Prediction'}
        </button>

        {/* Clear All */}
        <button
          onClick={onClearAll}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-lg">🗑️</span>
          Clear All
        </button>
      </div>

      {/* Visibility Controls */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Visibility</h4>
        
        <div className="space-y-2">
          {/* Student Annotations Toggle */}
          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={showStudentAnnotations}
              onChange={(e) => onToggleStudentAnnotations(e.target.checked)}
              disabled={disabled}
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">🎓</span>
              <span className="text-sm font-medium text-blue-700">Student Predictions</span>
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {hasStudentPredictions ? studentCount : annotations.length}
              </span>
            </div>
          </label>

          {/* AI Predictions Toggle */}
          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={showAiPredictions}
              onChange={(e) => onToggleAiPredictions(e.target.checked)}
              disabled={disabled}
              className="form-checkbox h-4 w-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium text-red-700">AI Predictions</span>
              <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {aiCount}
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Annotation Status */}
      {(hasStudentPredictions || hasAiPredictions || hasUnsavedAnnotations) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Status</h4>
          
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {/* Student Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">🎓</span>
                <span>Your Predictions:</span>
              </span>
              <span className={`font-medium ${
                hasStudentPredictions ? 'text-green-600' : 
                hasUnsavedAnnotations ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {hasStudentPredictions ? '✓' : hasUnsavedAnnotations ? '○' : '—'} 
                {hasStudentPredictions ? studentCount : hasUnsavedAnnotations ? `${annotations.length} draft` : '0'}
              </span>
            </div>

            {/* AI Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>AI Predictions:</span>
              </span>
              <span className={`font-medium ${hasAiPredictions ? 'text-green-600' : 'text-gray-500'}`}>
                {hasAiPredictions ? '✓' : '○'} {aiCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Draft Annotations List */}
      {hasUnsavedAnnotations && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-blue-700">
              Draft Annotations ({annotations.length})
            </h4>
            {annotations.length > 0 && (
              <button
                onClick={() => annotations.forEach(ann => onRemoveAnnotation?.(ann.id))}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="max-h-32 overflow-y-auto space-y-1">
            {annotations.map((annotation, index) => (
              <div
                key={annotation.id}
                className="flex items-center justify-between text-xs bg-blue-50 rounded p-2"
              >
                <span className="font-medium">
                  Annotation #{index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {Math.round(annotation.width)}×{Math.round(annotation.height)}
                  </span>
                  {onRemoveAnnotation && (
                    <button
                      onClick={() => onRemoveAnnotation(annotation.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {isAnnotating && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                Annotation Mode Active
              </p>
              <p className="text-xs text-blue-700">
                Click and drag on the image to mark fracture areas. 
                Click "Confirm" when done to save your annotations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}