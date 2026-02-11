import React, { useRef, useEffect, useState } from 'react';
import { DocumentUpload } from '@/types';
import { Detection, StudentAnnotation } from '@/types/fracture';
import { useFractureImage } from '@/hooks/useFractureImage';
import { useAnnotationDrawing } from '@/hooks/useAnnotationDrawing';
import { useFracturePredictionAPI } from '@/hooks/useFracturePredictionAPI';
import { usePredictionRevision } from '@/hooks/usePredictionRevision';
import { AnnotationCanvas, AnnotationCanvasRef } from './AnnotationCanvas';
import { AnnotationDialog } from './AnnotationDialog';
import { AnnotationVisibilityToggle } from './AnnotationVisibilityToggle';
import { ImageUploadZone } from './ImageUploadZone';
import { ComparisonResultsCard } from './ComparisonResultsCard';
import { DetectionLists } from './DetectionLists';
import { ErrorDisplay } from './ErrorDisplay';
import { PredictionStatusCard } from './PredictionStatusCard';
import { StudentActionButtons } from './StudentActionButtons';
import { FractureReferencePanel } from './FractureReferencePanel';

// Import History Components
import { HistorySection } from './history/HistorySection';
import { HistoryPage } from './history/HistoryPage';
import { DocumentHistorySection } from './document/DocumentHistorySection';
import { DocumentHistoryPage } from './document/DocumentHistoryPage';

interface FractureDetectionPanelProps {
  token: string;
  documentHistory?: DocumentUpload[];
  onRefreshDocuments?: () => void;
}

export function FractureDetectionPanel({ 
  token, 
  documentHistory = [],
  onRefreshDocuments
}: FractureDetectionPanelProps) {
  const canvasRef = useRef<AnnotationCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // History navigation state
  const [showHistory, setShowHistory] = React.useState(false);
  const [showDocumentHistory, setShowDocumentHistory] = React.useState(false);

  // UI states
  const [showStudentAnnotations, setShowStudentAnnotations] = React.useState(true);
  const [showAiPredictions, setShowAiPredictions] = React.useState(true);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [isFetchingComparison, setIsFetchingComparison] = useState(false);

  // Custom hooks (existing)
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

  // Derived state
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

  // Auto-open dialog when new annotation is created
  useEffect(() => {
    if (annotations.length > 0 && !isDrawing) {
      const latestAnnotation = annotations[annotations.length - 1];
      if (!latestAnnotation.fracture_type) {
        setOpenDialogId(latestAnnotation.id);
        setActiveAnnotationId(latestAnnotation.id);
      }
    }
  }, [annotations.length, isDrawing]);

  // Auto-fetch comparison when both predictions exist
  useEffect(() => {
    if (
      currentPrediction?.has_student_predictions && 
      currentPrediction?.has_ai_predictions && 
      !comparison
    ) {
      setIsFetchingComparison(true);
      fetchComparison(currentPrediction.id, token)
        .finally(() => setIsFetchingComparison(false));
    }
  }, [
    currentPrediction?.has_student_predictions, 
    currentPrediction?.has_ai_predictions, 
    comparison, 
    fetchComparison, 
    token, 
    currentPrediction?.id
  ]);

  // Show history pages
  if (showHistory) {
    return <HistoryPage token={token} onBack={() => setShowHistory(false)} />;
  }

  if (showDocumentHistory) {
    return (
      <DocumentHistoryPage 
        token={token} 
        onBack={() => setShowDocumentHistory(false)}
        documents={documentHistory}
        onRefresh={onRefreshDocuments}
      />
    );
  }

  // EVENT HANDLERS
  const handleImageUpload = async (file: File) => {
    try {
      const prediction = await uploadImage(file, token);
      setCurrentPrediction(prediction);
      clearAnnotations();
      setAllDetections([]);
      setOpenDialogId(null);
      setActiveAnnotationId(null);
    } catch (err: Error | unknown) {
      console.error('Upload error:', err);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / rect.width;
    const scaleY = image.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isAnnotating) {
      onMouseDown(x, y);
    } else {
      for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        if (x >= ann.x && x <= ann.x + ann.width &&
            y >= ann.y && y <= ann.y + ann.height) {
          handleAnnotationClick(ann);
          return;
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !image) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / rect.width;
    const scaleY = image.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    onMouseMove(x, y);
  };

  const handleCanvasMouseUp = () => {
    onMouseUp();
  };

  const handleAnnotationClick = (annotation: StudentAnnotation) => {
    if (openDialogId === annotation.id) {
      setOpenDialogId(null);
      setActiveAnnotationId(null);
    } else {
      setActiveAnnotationId(annotation.id);
      setOpenDialogId(annotation.id);
    }
  };

  const handleUpdateAnnotation = (annotation: StudentAnnotation) => {
    updateAnnotation(annotation.id, {
      fracture_type: annotation.fracture_type || '',
      notes: annotation.notes
    });
  };

  const handleCloseDialog = () => {
    setOpenDialogId(null);
  };

  const handleRemoveAnnotation = (id: string) => {
    removeAnnotation(id);
    if (openDialogId === id) {
      setOpenDialogId(null);
    }
    if (activeAnnotationId === id) {
      setActiveAnnotationId(null);
    }
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
    setOpenDialogId(null);
    setActiveAnnotationId(null);
  };

  const handleSubmitNoFracture = async () => {
    if (!currentPrediction) return;
    
    await submitAnnotationsAPI(currentPrediction.id, [], token);
    clearAnnotations();
    setIsAnnotating(false);
    setOpenDialogId(null);
    setActiveAnnotationId(null);
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
          setOpenDialogId(null);
          setActiveAnnotationId(null);
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
    setOpenDialogId(null);
    setActiveAnnotationId(null);
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-visible">
      {/* Header */}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            {/* Error Display */}
            <ErrorDisplay error={error} onDismiss={() => setError(null)} />

            {/* Upload Zone or Image Display */}
            {!image ? (
              <>
                <ImageUploadZone 
                  onImageUpload={handleImageUpload}
                  isUploading={isUploading}
                />
                
                {/* Prediction History Section */}
                <HistorySection onNavigateToHistory={() => setShowHistory(true)} />
                
                {/* Document History Section */}
                <DocumentHistorySection 
                  onNavigateToHistory={() => setShowDocumentHistory(true)}
                  recentDocuments={documentHistory}
                />
              </>
            ) : (
              <>
                {/* Image Container with Overlays */}
                <div className="space-y-3">
                  {/* Status Card */}
                  <PredictionStatusCard
                    currentPrediction={currentPrediction}
                    isRevising={isRevising}
                    onRevise={handleRevisePrediction}
                    isRunningAI={isRunningAI}
                    onRunAI={handleRunAiPrediction}
                  />

                  {/* Image with Canvas */}
                  <div 
                    ref={containerRef} 
                    className="relative w-full bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center p-4"
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
                      activeAnnotationId={activeAnnotationId}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onAnnotationClick={handleAnnotationClick}
                    />

                    {/* Visibility Toggle */}
                    {image && (
                      <AnnotationVisibilityToggle
                        showStudentAnnotations={showStudentAnnotations}
                        showAiPredictions={showAiPredictions}
                        onToggleStudent={() => setShowStudentAnnotations(!showStudentAnnotations)}
                        onToggleAi={() => setShowAiPredictions(!showAiPredictions)}
                        studentCount={currentPrediction?.student_prediction_count || annotations.length}
                        aiCount={currentPrediction?.ai_prediction_count || 0}
                        hasAiPredictions={!!currentPrediction?.has_ai_predictions}
                      />
                    )}
                  </div>

                  {/* Annotation Dialogs */}
                  {image && annotations.map((annotation, index) => {
                    if (openDialogId !== annotation.id) return null;

                    return (
                      <AnnotationDialog
                        key={annotation.id}
                        annotation={annotation}
                        index={index}
                        canvasRef={canvasRef}
                        image={image}
                        onUpdate={handleUpdateAnnotation}
                        onRemove={handleRemoveAnnotation}
                        onClose={handleCloseDialog}
                        isActive={activeAnnotationId === annotation.id}
                      />
                    );
                  })}

                  {/* Horizontal Action Buttons */}
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

                  {/* Fracture Reference Panel */}
                  {!currentPrediction?.has_student_predictions && <FractureReferencePanel />}
                </div>

                {/* Comparison or Detection Lists */}
                {showComparisonOnly ? (
                  <ComparisonResultsCard comparison={comparison} />
                ) : (
                  currentPrediction && (currentPrediction.has_student_predictions || currentPrediction.has_ai_predictions) && (
                    <DetectionLists 
                      detections={allDetections} 
                      isRunningAI={isRunningAI}
                      isFetchingComparison={isFetchingComparison}
                    />
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