import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StudentAnnotation, Detection } from '../../types/fracture';

interface AnnotationCanvasProps {
  image: HTMLImageElement | null;
  annotations: StudentAnnotation[];
  detections: Detection[];
  currentRect: StudentAnnotation | null;
  isAnnotating: boolean;
  showStudentAnnotations: boolean;
  showAiPredictions: boolean;
  isDrawing: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

import { User } from '@/types';
import { useFractureImage } from '@/hooks/useFractureImage';
import { useAnnotationDrawing } from '@/hooks/useAnnotationDrawing';
import { useFracturePredictionAPI } from '@/hooks/useFracturePredictionAPI';
import { AnnotationCanvas, AnnotationCanvasRef } from './AnnotationCanvas';
import { ImageUploadZone } from './ImageUploadZone';
import { ComparisonResultsCard } from './ComparisonResultsCard';
import { DetectionLists } from './DetectionLists';
import { ErrorDisplay } from './ErrorDisplay';
import { AnnotationAttributeSelector } from './AnnotationAttributeSelector';

interface FractureDetectionPanelProps {
  token: string;
  user: User | null;
}

export function FractureDetectionPanel({ token, user }: FractureDetectionPanelProps) {
  const canvasRef = useRef<AnnotationCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { 
    image, 
    isUploading, 
    error: imageError, 
    uploadImage, 
    clearImage,
    setError: setImageError 
  } = useFractureImage();

  const {
    annotations,
    isAnnotating,
    isDrawing,
    currentRect,
    pendingAnnotation,
    setIsAnnotating,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    handleMouseDown: onMouseDown,
    handleMouseMove: onMouseMove,
    handleMouseUp: onMouseUp,
    setPendingAnnotation,
    confirmPendingAnnotation,
    cancelPendingAnnotation
  } = useAnnotationDrawing();

  const {
    currentPrediction,
    comparison,
    allDetections,
    isSubmittingAnnotations,
    isRunningAI,
    error: apiError,
    setCurrentPrediction,
    setAllDetections,
    submitAnnotations: submitAnnotationsAPI,
    runAI,
    fetchComparison,
    clearPrediction
  } = useFracturePredictionAPI();

  // UI states
  const [showStudentAnnotations, setShowStudentAnnotations] = React.useState(true);
  const [showAiPredictions, setShowAiPredictions] = React.useState(true);

  // Combined error
  const error = imageError || apiError;
  const setError = (err: string | null) => {
    setImageError(err);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      const prediction = await uploadImage(file, token);
      setCurrentPrediction(prediction);
      clearAnnotations();
      setAllDetections([]);
    } catch (err: any) {
      console.error('Upload error:', err);
    }
  };

  // Handle canvas mouse events with coordinate transformation
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating || !image) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / canvas.clientWidth;
    const scaleY = image.height / canvas.clientHeight;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    onMouseDown(x, y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !image) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / canvas.clientWidth;
    const scaleY = image.height / canvas.clientHeight;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    onMouseMove(x, y);
  };

  const handleCanvasMouseUp = () => {
    onMouseUp();
  };

  // Handle annotation details save
  const handleSaveAnnotationDetails = (annotation: any) => {
    updateAnnotation(annotation.id, {
      fracture_type: annotation.fracture_type,
      notes: annotation.notes
    });
  };

  // Handle submit annotations (including empty submissions)
  const handleSubmitAnnotations = async () => {
    if (!currentPrediction) return;
    
    // Check if annotations have required details
    if (annotations.length > 0) {
      const missingDetails = annotations.some(ann => !ann.fracture_type);
      
      if (missingDetails) {
        setError('Please select fracture type for all annotations');
        return;
      }
    }
    
    // Allow empty submissions (no fracture detected)
    await submitAnnotationsAPI(currentPrediction.id, annotations, token);
    clearAnnotations();
    setIsAnnotating(false);
  };

  // Handle submit "no fracture" explicitly
  const handleSubmitNoFracture = async () => {
    if (!currentPrediction) return;
    
    // Submit empty annotations
    await submitAnnotationsAPI(currentPrediction.id, [], token);
    clearAnnotations();
    setIsAnnotating(false);
  };

  // Handle run AI prediction
  const handleRunAiPrediction = async () => {
    if (!currentPrediction) return;
    await runAI(currentPrediction.id, token);
  };

  // Handle clear all
  const handleClearAll = () => {
    clearPrediction();
    clearImage();
    clearAnnotations();
    setIsAnnotating(false);
  };

  // Auto-fetch comparison when both predictions exist
  useEffect(() => {
    if (
      currentPrediction?.has_student_predictions && 
      currentPrediction?.has_ai_predictions && 
      !comparison
    ) {
      fetchComparison(currentPrediction.id, token);
    }
  }, [currentPrediction?.has_student_predictions, currentPrediction?.has_ai_predictions, comparison, fetchComparison, token, currentPrediction?.id]);

  // Check if all annotations have details
  const allAnnotationsHaveDetails = annotations.length === 0 || annotations.every(
    ann => ann.fracture_type
  );

  // Determine if we show comparison only
  const showComparisonOnly = currentPrediction?.has_student_predictions && currentPrediction?.has_ai_predictions && comparison;

  // Collapse state
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Check if student can submit
  const canSubmit = currentPrediction && !currentPrediction.has_student_predictions;

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-600 hover:text-gray-900 transition-colors p-1 hover:bg-gray-200 rounded"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="font-semibold text-gray-900 text-lg">🦴 Fracture Detection</h3>
          </div>
          <button
            onClick={handleClearAll}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
          {/* Error Display */}
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />

          {/* Upload Zone or Image Display */}
          {!image ? (
            <ImageUploadZone 
              onImageUpload={handleImageUpload}
              isUploading={isUploading}
            />
          ) : (
            <>
              {/* Full Width Image Container */}
              <div 
                ref={containerRef} 
                className="w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center relative"
                style={{ minHeight: '400px' }}
              >
                <AnnotationCanvas
                  ref={canvasRef}
                  image={image}
                  annotations={annotations}
                  detections={allDetections}
                  currentRect={currentRect}
                  isAnnotating={isAnnotating}
                  showStudentAnnotations={showStudentAnnotations}
                  showAiPredictions={showAiPredictions}
                  isDrawing={isDrawing}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  containerRef={containerRef}
                />
              </div>

              {/* Controls Below Image - Split Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Student Action Buttons */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 text-sm">Student Actions</h4>
                  
                  {/* Show prediction status */}
                  {currentPrediction?.has_student_predictions && (
                    <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                      <p className="text-green-800 text-xs font-medium">
                        ✅ You've submitted your prediction
                        {currentPrediction.student_prediction_count === 0 
                          ? ' (No fractures detected)' 
                          : ` (${currentPrediction.student_prediction_count} fracture${currentPrediction.student_prediction_count > 1 ? 's' : ''})`
                        }
                      </p>
                    </div>
                  )}
                  
                  {canSubmit && (
                    <>
                      <button
                        onClick={() => setIsAnnotating(!isAnnotating)}
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
                            onClick={handleSubmitAnnotations}
                            disabled={isSubmittingAnnotations || !allAnnotationsHaveDetails}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="text-lg">{isSubmittingAnnotations ? '⏳' : '✅'}</span>
                            {isSubmittingAnnotations ? 'Submitting...' : `Confirm ${annotations.length} Fracture${annotations.length !== 1 ? 's' : ''}`}
                          </button>

                          <button
                            onClick={clearAnnotations}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            <span className="text-lg">🗑️</span>
                            Clear Draft
                          </button>
                        </>
                      )}

                      {/* Submit No Fracture button - always visible when no submission yet */}
                      {annotations.length === 0 && !isAnnotating && (
                        <button
                          onClick={handleSubmitNoFracture}
                          disabled={isSubmittingAnnotations}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="text-lg">{isSubmittingAnnotations ? '⏳' : '🚫'}</span>
                          {isSubmittingAnnotations ? 'Submitting...' : 'Submit: No Fractures'}
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={handleRunAiPrediction}
                    disabled={isRunningAI}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-lg">{isRunningAI ? '⏳' : '🤖'}</span>
                    {isRunningAI ? 'Running AI...' : 'Run AI Prediction'}
                  </button>

                  {/* Visibility Controls */}
                  <div className="pt-2 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showStudentAnnotations}
                        onChange={(e) => setShowStudentAnnotations(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">
                        🎓 Show Student ({currentPrediction?.student_prediction_count || annotations.length})
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAiPredictions}
                        onChange={(e) => setShowAiPredictions(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-red-600 rounded"
                      />
                      <span className="text-sm text-gray-900">
                        🤖 Show AI ({currentPrediction?.ai_prediction_count || 0})
                      </span>
                    </label>
                  </div>
                </div>

                {/* Right: Annotation Attributes */}
                <div>
                  <AnnotationAttributeSelector
                    annotations={annotations}
                    onUpdateAnnotation={handleSaveAnnotationDetails}
                    onRemoveAnnotation={removeAnnotation}
                    isAnnotating={isAnnotating}
                  />
                </div>
              </div>

              {/* Annotation Instructions */}
              {isAnnotating && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-blue-900 font-medium text-sm">💡 Annotation Mode Active</p>
                  <p className="text-blue-800 text-sm mt-1">
                    Click and drag on the image to mark fracture areas. 
                    Select fracture type for each annotation on the right.
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    If you don't see any fractures, stop annotating and click "Submit: No Fractures"
                  </p>
                </div>
              )}

              {/* Results Section */}
              {showComparisonOnly ? (
                // Show only comparison when both predictions exist
                <ComparisonResultsCard comparison={comparison} />
              ) : (
                // Show individual detection lists when not both available
                currentPrediction && (currentPrediction.has_student_predictions || currentPrediction.has_ai_predictions) && (
                  <DetectionLists detections={allDetections} />
                )
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}