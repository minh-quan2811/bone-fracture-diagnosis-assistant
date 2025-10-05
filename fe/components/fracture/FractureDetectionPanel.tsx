import React, { useRef, useEffect } from 'react';
import { User } from '@/types';
import { useFractureImage } from '@/hooks/useFractureImage';
import { useAnnotationDrawing } from '@/hooks/useAnnotationDrawing';
import { useFracturePredictionAPI } from '@/hooks/useFracturePredictionAPI';
import { usePredictionRevision } from '@/hooks/usePredictionRevision';
import { AnnotationCanvas, AnnotationCanvasRef } from './AnnotationCanvas';
import { ImageUploadZone } from './ImageUploadZone';
import { ComparisonResultsCard } from './ComparisonResultsCard';
import { DetectionLists } from './DetectionLists';
import { ErrorDisplay } from './ErrorDisplay';
import { AnnotationAttributeSelector } from './AnnotationAttributeSelector';
import { PredictionStatusCard } from './PredictionStatusCard';
import { StudentActionButtons } from './StudentActionButtons';
import { Detection } from '@/types/fracture';
import { HistorySection } from './history/HistorySection';
import { HistoryPage } from './history/HistoryPage';

interface FractureDetectionPanelProps {
  token: string;
  user: User | null;
}

export function FractureDetectionPanel({ token, user }: FractureDetectionPanelProps) {
  const canvasRef = useRef<AnnotationCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showHistory, setShowHistory] = React.useState(false);
  const [showStudentAnnotations, setShowStudentAnnotations] = React.useState(true);
  const [showAiPredictions, setShowAiPredictions] = React.useState(true);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [paddingInfo, setPaddingInfo] = React.useState<{
    offset_x: number;
    offset_y: number;
    content_width: number;
    content_height: number;
  } | null>(null);

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
    setIsAnnotating,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    handleMouseDown: onMouseDown,
    handleMouseMove: onMouseMove,
    handleMouseUp: onMouseUp,
    addAnnotation
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

  const {
    isRevising,
    reviseError,
    loadPredictionForRevision,
    clearReviseError
  } = usePredictionRevision();

  const error = imageError || apiError || reviseError;
  const setError = (err: string | null) => {
    setImageError(err);
    clearReviseError();
  };

  const allAnnotationsHaveDetails = annotations.length === 0 || annotations.every(
    ann => ann.fracture_type
  );

  const showComparisonOnly = currentPrediction?.has_student_predictions && 
    currentPrediction?.has_ai_predictions && 
    comparison;

  const canSubmit = currentPrediction && !currentPrediction.has_student_predictions;

  useEffect(() => {
    if (
      currentPrediction?.has_student_predictions && 
      currentPrediction?.has_ai_predictions && 
      !comparison
    ) {
      fetchComparison(currentPrediction.id, token);
    }
  }, [
    currentPrediction?.has_student_predictions, 
    currentPrediction?.has_ai_predictions, 
    comparison, 
    fetchComparison, 
    token, 
    currentPrediction?.id
  ]);

  if (showHistory) {
    return <HistoryPage token={token} onBack={() => setShowHistory(false)} />;
  }

  const handleImageUpload = async (file: File) => {
    try {
      const prediction = await uploadImage(file, token);
      setCurrentPrediction(prediction);
      
      // Extract padding info if present
      if (prediction.padding_info) {
        setPaddingInfo(prediction.padding_info);
      } else {
        setPaddingInfo(null);
      }
      
      clearAnnotations();
      setAllDetections([]);
    } catch (err: any) {
      console.error('Upload error:', err);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating || !image) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas (which is 640x640)
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // Account for padding offset - convert to content coordinates
    const offsetX = paddingInfo?.offset_x || 0;
    const offsetY = paddingInfo?.offset_y || 0;
    
    // Subtract offset to get position within content area
    const x = canvasX - offsetX;
    const y = canvasY - offsetY;

    // Only allow annotation within content area
    if (x >= 0 && y >= 0 && 
        x <= (paddingInfo?.content_width || 640) && 
        y <= (paddingInfo?.content_height || 640)) {
      onMouseDown(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !image) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas (which is 640x640)
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // Account for padding offset - convert to content coordinates
    const offsetX = paddingInfo?.offset_x || 0;
    const offsetY = paddingInfo?.offset_y || 0;
    
    // Subtract offset to get position within content area
    const x = canvasX - offsetX;
    const y = canvasY - offsetY;

    onMouseMove(x, y);
  };

  const handleCanvasMouseUp = () => {
    onMouseUp();
  };

  const handleSaveAnnotationDetails = (annotation: any) => {
    updateAnnotation(annotation.id, {
      fracture_type: annotation.fracture_type,
      notes: annotation.notes
    });
  };

  const handleSubmitAnnotations = async () => {
    if (!currentPrediction) return;
    
    if (annotations.length > 0) {
      const missingDetails = annotations.some(ann => !ann.fracture_type);
      
      if (missingDetails) {
        setError('Please select fracture type for all annotations');
        return;
      }
    }
    
    await submitAnnotationsAPI(currentPrediction.id, annotations, token);
    clearAnnotations();
    setIsAnnotating(false);
  };

  const handleSubmitNoFracture = async () => {
    if (!currentPrediction) return;
    
    await submitAnnotationsAPI(currentPrediction.id, [], token);
    clearAnnotations();
    setIsAnnotating(false);
  };

  const handleRevisePrediction = async () => {
    if (!currentPrediction) return;

    try {
      await loadPredictionForRevision(
        currentPrediction.id,
        token,
        (loadedAnnotations) => {
          setAllDetections(
            Array.isArray(allDetections)
              ? allDetections.filter((d: Detection) => d.source !== 'student')
              : []
          );
          
          clearAnnotations();
          
          loadedAnnotations.forEach(ann => {
            addAnnotation(ann);
          });
          
          if (currentPrediction) {
            setCurrentPrediction({
              ...currentPrediction,
              has_student_predictions: false,
              student_prediction_count: 0
            });
          }
          
          setIsAnnotating(true);
        }
      );
    } catch (err) {
      console.error('Error revising prediction:', err);
    }
  };

  const handleRunAiPrediction = async () => {
    if (!currentPrediction) return;
    await runAI(currentPrediction.id, token);
  };

  const handleClearAll = () => {
    clearPrediction();
    clearImage();
    clearAnnotations();
    setIsAnnotating(false);
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
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
            <h3 className="font-semibold text-gray-900 text-lg">Fracture Detection</h3>
          </div>
          <button
            onClick={handleClearAll}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            <ErrorDisplay error={error} onDismiss={() => setError(null)} />

            {!image ? (
              <>
                <ImageUploadZone 
                  onImageUpload={handleImageUpload}
                  isUploading={isUploading}
                />
                <HistorySection onNavigateToHistory={() => setShowHistory(true)} />
              </>
            ) : (
              <>
                <div 
                  ref={containerRef} 
                  className="w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center"
                  style={{ width: '640px', height: '640px' }}
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
                    paddingInfo={paddingInfo}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm">Student Actions</h4>
                    
                    <PredictionStatusCard
                      currentPrediction={currentPrediction}
                      isRevising={isRevising}
                      onRevise={handleRevisePrediction}
                    />
                    
                    <StudentActionButtons
                      isAnnotating={isAnnotating}
                      annotations={annotations}
                      isSubmittingAnnotations={isSubmittingAnnotations}
                      allAnnotationsHaveDetails={allAnnotationsHaveDetails}
                      canSubmit={!!canSubmit}
                      onToggleAnnotating={() => setIsAnnotating(!isAnnotating)}
                      onSubmitAnnotations={handleSubmitAnnotations}
                      onSubmitNoFracture={handleSubmitNoFracture}
                      onClearAnnotations={clearAnnotations}
                    />

                    <button
                      onClick={handleRunAiPrediction}
                      disabled={isRunningAI || !currentPrediction?.has_student_predictions}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title={!currentPrediction?.has_student_predictions ? 'Submit your prediction first' : ''}
                    >
                      <span className="text-lg">{isRunningAI ? '⏳' : '🤖'}</span>
                      {isRunningAI ? 'Running AI...' : 'Run AI Prediction'}
                    </button>
                    
                    {!currentPrediction?.has_student_predictions && (
                      <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                        <p className="text-yellow-800 text-xs">
                          Submit your prediction first to unlock AI comparison
                        </p>
                      </div>
                    )}

                    <div className="pt-2 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showStudentAnnotations}
                          onChange={(e) => setShowStudentAnnotations(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-900">
                          Show Student ({currentPrediction?.student_prediction_count || annotations.length})
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
                          Show AI ({currentPrediction?.ai_prediction_count || 0})
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <AnnotationAttributeSelector
                      annotations={annotations}
                      onUpdateAnnotation={handleSaveAnnotationDetails}
                      onRemoveAnnotation={removeAnnotation}
                      isAnnotating={isAnnotating}
                    />
                  </div>
                </div>

                {isAnnotating && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-900 font-medium text-sm">Annotation Mode Active</p>
                    <p className="text-blue-800 text-sm mt-1">
                      Click and drag on the image to mark fracture areas. 
                      Select fracture type for each annotation on the right.
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      If you don't see any fractures, stop annotating and click "Submit: No Fractures"
                    </p>
                  </div>
                )}

                {showComparisonOnly ? (
                  <ComparisonResultsCard comparison={comparison} />
                ) : (
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