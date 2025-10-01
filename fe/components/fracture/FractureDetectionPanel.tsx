import React, { useRef, useEffect } from 'react';
import { User } from '@/types';
import { useFractureImage } from '@/hooks/useFractureImage';
import { useAnnotationDrawing } from '@/hooks/useAnnotationDrawing';
import { useFracturePredictionAPI } from '@/hooks/useFracturePredictionAPI';
import { AnnotationCanvas, AnnotationCanvasRef } from './AnnotationCanvas';
import { AnnotationDetailsModal } from './AnnotationDetailsModal';
import { ImageUploadZone } from './ImageUploadZone';
import { PredictionResults } from './PredictionResults';
import { ComparisonResultsCard } from './ComparisonResultsCard';
import { DetectionLists } from './DetectionLists';
import { UsageTips } from './UsageTips';
import { ErrorDisplay } from './ErrorDisplay';

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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
    setPendingAnnotation(annotation);
    confirmPendingAnnotation();
  };

  // Handle submit annotations
  const handleSubmitAnnotations = async () => {
    if (!currentPrediction || annotations.length === 0) return;
    
    // Check if all annotations have required details
    const missingDetails = annotations.some(
      ann => !ann.body_region || !ann.fracture_type
    );
    
    if (missingDetails) {
      setError('Please provide body region and fracture type for all annotations');
      return;
    }
    
    await submitAnnotationsAPI(currentPrediction.id, annotations, token);
    clearAnnotations();
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

  // Get comparison summary for header
  const getComparisonSummary = () => {
    if (!comparison) return null;
    
    const { comparison_metrics } = comparison;
    if (comparison_metrics.both_found_fractures) return { icon: '⚖️', text: 'Both Found Fractures', color: 'text-orange-600' };
    if (comparison_metrics.student_only) return { icon: '🎓', text: 'Student Only', color: 'text-blue-600' };
    if (comparison_metrics.ai_only) return { icon: '🤖', text: 'AI Only', color: 'text-red-600' };
    if (comparison_metrics.both_normal) return { icon: '✅', text: 'Both Normal', color: 'text-green-600' };
    return null;
  };

  const comparisonSummary = getComparisonSummary();

  // Check if all annotations have details
  const allAnnotationsHaveDetails = annotations.every(
    ann => ann.body_region && ann.fracture_type
  );

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Annotation Details Modal */}
      {pendingAnnotation && (
        <AnnotationDetailsModal
          annotation={pendingAnnotation}
          isOpen={!!pendingAnnotation}
          onClose={cancelPendingAnnotation}
          onSave={handleSaveAnnotationDetails}
        />
      )}

      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">🦴 Fracture Detection</h3>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700 text-sm p-1 rounded hover:bg-gray-100"
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          
          {comparisonSummary && (
            <div className="text-xs">
              <span className={`${comparisonSummary.color} font-medium`}>
                {comparisonSummary.icon} {comparisonSummary.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {/* Upload Controls */}
            <ImageUploadZone 
              onImageUpload={handleImageUpload}
              isUploading={isUploading}
            />

            {/* Error Display */}
            <ErrorDisplay error={error} onDismiss={() => setError(null)} />

            {/* Action Controls */}
            {image && currentPrediction && (
              <div className="space-y-2">
                {/* Primary Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAnnotating(!isAnnotating)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded transition-colors ${
                      isAnnotating 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    ✏️ {isAnnotating ? 'Stop Annotating' : 'Start Annotating'}
                  </button>
                  
                  {annotations.length > 0 && (
                    <button
                      onClick={handleSubmitAnnotations}
                      disabled={isSubmittingAnnotations || !allAnnotationsHaveDetails}
                      className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                      title={!allAnnotationsHaveDetails ? 'All annotations need body region and fracture type' : ''}
                    >
                      {isSubmittingAnnotations ? '⏳' : '✓'} Confirm
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleRunAiPrediction}
                    disabled={isRunningAI}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {isRunningAI ? '⏳' : '🤖'} 
                    {isRunningAI ? 'Running AI...' : 'Run AI Prediction'}
                  </button>
                  
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    🗑️
                  </button>
                </div>

                {/* Visibility Controls */}
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showStudentAnnotations}
                      onChange={(e) => setShowStudentAnnotations(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="text-blue-600">
                      🎓 Student ({currentPrediction?.student_prediction_count || annotations.length})
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showAiPredictions}
                      onChange={(e) => setShowAiPredictions(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-red-600"
                    />
                    <span className="text-red-600">
                      🤖 AI ({currentPrediction?.ai_prediction_count || 0})
                    </span>
                  </label>
                </div>

                {/* Annotation Instructions */}
                {isAnnotating && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="text-blue-800 font-medium">💡 Annotation Mode Active</p>
                    <p className="text-blue-700 mt-1">
                      Click and drag on the image to mark fracture areas. 
                      You'll be asked to specify body region and fracture type for each annotation.
                    </p>
                  </div>
                )}

                {/* Draft Annotations List */}
                {annotations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900 text-sm">
                        Draft Annotations ({annotations.length})
                      </h4>
                      {!allAnnotationsHaveDetails && (
                        <span className="text-xs text-red-600">
                          ⚠️ Missing details
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {annotations.map((annotation, index) => (
                        <div 
                          key={annotation.id} 
                          className="flex items-start justify-between text-xs bg-blue-100 rounded p-2"
                        >
                          <div className="flex-1">
                            <div className="font-medium">Annotation #{index + 1}</div>
                            {annotation.body_region && annotation.fracture_type ? (
                              <div className="text-blue-700 mt-1">
                                <div>📍 {annotation.body_region}</div>
                                <div>🔍 {annotation.fracture_type}</div>
                                {annotation.notes && (
                                  <div className="text-blue-600 italic mt-1">
                                    "{annotation.notes}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-red-600 mt-1">
                                ⚠️ Missing details
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            {(!annotation.body_region || !annotation.fracture_type) && (
                              <button
                                onClick={() => setPendingAnnotation(annotation)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                ✏️ Edit
                              </button>
                            )}
                            <button
                              onClick={() => removeAnnotation(annotation.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Image Display Container */}
            <div 
              ref={containerRef} 
              className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center relative"
              style={{ height: '300px', minHeight: '300px' }}
            >
              {image ? (
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
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-base">Upload an X-ray image</p>
                </div>
              )}
            </div>

            {/* Prediction Results */}
            {currentPrediction && (
              <PredictionResults prediction={currentPrediction} />
            )}

            {/* Comparison Results */}
            {comparison && (
              <ComparisonResultsCard comparison={comparison} />
            )}

            {/* Detection Lists */}
            <DetectionLists detections={allDetections} />

            {/* Usage Tips */}
            {!currentPrediction && <UsageTips />}
          </div>
        </div>
      )}
    </div>
  );
}