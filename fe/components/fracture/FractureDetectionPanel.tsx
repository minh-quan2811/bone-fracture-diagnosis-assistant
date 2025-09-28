import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { 
  uploadFractureImage, 
  submitStudentAnnotations, 
  runAiPrediction, 
  getPredictionComparison 
  } from '@/lib/api';

interface Detection {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence?: number;
  color: string;
  source: 'student' | 'ai';
}

interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
}

interface PredictionResult {
  id: number;
  has_student_predictions: boolean;
  has_ai_predictions: boolean;
  student_prediction_count: number;
  ai_prediction_count: number;
  ai_max_confidence: number | null;
  ai_inference_time: number | null;
  detections: Array<{
    id: number;
    source: 'student' | 'ai';
    class_name: string;
    confidence: number | null;
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
    width: number;
    height: number;
    student_notes?: string;
  }>;
}

interface ComparisonResult {
  prediction_id: number;
  image_filename: string;
  student_detections: any[];
  ai_detections: any[];
  comparison_metrics: {
    student_count: number;
    ai_count: number;
    both_found_fractures: boolean;
    student_only: boolean;
    ai_only: boolean;
    both_normal: boolean;
  };
}

interface FractureDetectionPanelProps {
  token: string;
  user: User | null;
}

export function FractureDetectionPanel({ token, user }: FractureDetectionPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [allDetections, setAllDetections] = useState<Detection[]>([]);
  const [studentAnnotations, setStudentAnnotations] = useState<StudentAnnotation[]>([]);
  
  // UI states
  const [showStudentAnnotations, setShowStudentAnnotations] = useState(true);
  const [showAiPredictions, setShowAiPredictions] = useState(true);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [currentRect, setCurrentRect] = useState<StudentAnnotation | null>(null);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [isSubmittingAnnotations, setIsSubmittingAnnotations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, BMP, or TIFF)');
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 20MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // Upload to backend first
      const prediction = await uploadFractureImage(file, token);
      setCurrentPrediction(prediction);
      setImageFile(file);

      // Load image for display
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          clearAnnotations();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const clearAnnotations = () => {
    setStudentAnnotations([]);
    setAllDetections([]);
    setComparison(null);
    setCurrentRect(null);
    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating || !image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / canvas.clientWidth;
    const scaleY = image.height / canvas.clientHeight;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({
      id: `temp-${Date.now()}`,
      x,
      y,
      width: 0,
      height: 0
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / canvas.clientWidth;
    const scaleY = image.height / canvas.clientHeight;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    setCurrentRect({
      id: `temp-${Date.now()}`,
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentRect || currentRect.width < 10 || currentRect.height < 10) {
      setIsDrawing(false);
      setCurrentRect(null);
      return;
    }

    const newAnnotation: StudentAnnotation = {
      id: `annotation-${Date.now()}`,
      x: currentRect.x,
      y: currentRect.y,
      width: currentRect.width,
      height: currentRect.height,
      notes: ''
    };

    setStudentAnnotations(prev => [...prev, newAnnotation]);
    setCurrentRect(null);
    setIsDrawing(false);
    setStartPoint(null);
  };

  const removeAnnotation = (id: string) => {
    setStudentAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  const submitAnnotations = async () => {
    if (!currentPrediction || studentAnnotations.length === 0) return;

    setIsSubmittingAnnotations(true);
    setError(null);

    try {
      const annotations = studentAnnotations.map(ann => ({
        x_min: Math.floor(ann.x),
        y_min: Math.floor(ann.y),
        x_max: Math.floor(ann.x + ann.width),
        y_max: Math.floor(ann.y + ann.height),
        width: Math.floor(ann.width),
        height: Math.floor(ann.height),
        notes: ann.notes || ''
      }));

      await submitStudentAnnotations(currentPrediction.id, annotations, token);
      
      // Update current prediction
      setCurrentPrediction(prev => prev ? {
        ...prev,
        has_student_predictions: true,
        student_prediction_count: annotations.length
      } : null);

      // Convert annotations to detections for display
      const studentDetections: Detection[] = studentAnnotations.map((ann, index) => ({
        id: ann.id,
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        label: `Student #${index + 1}`,
        color: '#3b82f6',
        source: 'student'
      }));

      setAllDetections(prev => [
        ...prev.filter(d => d.source !== 'student'),
        ...studentDetections
      ]);

    } catch (err: any) {
      console.error('Submit annotations error:', err);
      setError(err.message);
    } finally {
      setIsSubmittingAnnotations(false);
    }
  };

  const handleRunAiPrediction  = async () => {
    if (!currentPrediction) return;

    setIsRunningAI(true);
    setError(null);

    try {
      const result = await runAiPrediction(currentPrediction.id, token);
      
      // Update prediction status
      setCurrentPrediction(prev => prev ? {
        ...prev,
        has_ai_predictions: true,
        ai_prediction_count: result.detection_count,
        ai_max_confidence: result.max_confidence
      } : null);

      // Get updated prediction data with detections
      const updatedPrediction = await fetch(`${API_BASE_URL}/api/fracture/predictions/${currentPrediction.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json());

      // Convert AI detections for display
      const aiDetections: Detection[] = updatedPrediction.detections
        .filter((d: any) => d.source === 'ai')
        .map((detection: any, index: number) => ({
          id: detection.id,
          x: detection.x_min,
          y: detection.y_min,
          width: detection.width,
          height: detection.height,
          label: `AI #${index + 1}`,
          confidence: detection.confidence,
          color: '#ef4444',
          source: 'ai' as const
        }));

      setAllDetections(prev => [
        ...prev.filter(d => d.source !== 'ai'),
        ...aiDetections
      ]);

    } catch (err: any) {
      console.error('AI prediction error:', err);
      setError(err.message);
    } finally {
      setIsRunningAI(false);
    }
  };

  const getComparison = async () => {
    if (!currentPrediction) return;

    try {
      const comparisonResult = await getPredictionComparison(currentPrediction.id, token);
      setComparison(comparisonResult);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message);
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const imageAspectRatio = image.width / image.height;
    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > imageAspectRatio) {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * imageAspectRatio;
    } else {
      canvasWidth = containerWidth;
      canvasHeight = containerWidth / imageAspectRatio;
    }

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

    const scaleX = canvasWidth / image.width;
    const scaleY = canvasHeight / image.height;

    // Draw confirmed detections
    allDetections.forEach(detection => {
      if ((detection.source === 'student' && showStudentAnnotations) || 
          (detection.source === 'ai' && showAiPredictions)) {
        ctx.strokeStyle = detection.color;
        ctx.lineWidth = 2;
        ctx.setLineDash(detection.source === 'student' ? [] : [5, 5]);
        ctx.strokeRect(
          detection.x * scaleX,
          detection.y * scaleY,
          detection.width * scaleX,
          detection.height * scaleY
        );

        ctx.fillStyle = detection.color;
        ctx.font = '12px Arial';
        ctx.setLineDash([]);
        const label = detection.confidence 
          ? `${detection.label} (${(detection.confidence * 100).toFixed(1)}%)`
          : detection.label;
        ctx.fillText(label, detection.x * scaleX, detection.y * scaleY - 5);
      }
    });

    // Draw student annotations being created
    if (showStudentAnnotations) {
      studentAnnotations.forEach((annotation, index) => {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(
          annotation.x * scaleX,
          annotation.y * scaleY,
          annotation.width * scaleX,
          annotation.height * scaleY
        );

        ctx.fillStyle = '#3b82f6';
        ctx.font = '12px Arial';
        ctx.fillText(`Draft #${index + 1}`, annotation.x * scaleX, annotation.y * scaleY - 5);
      });
    }

    // Draw current rectangle being drawn
    if (currentRect && isDrawing) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(
        currentRect.x * scaleX,
        currentRect.y * scaleY,
        currentRect.width * scaleX,
        currentRect.height * scaleY
      );
    }
  }, [image, allDetections, studentAnnotations, currentRect, isDrawing, showStudentAnnotations, showAiPredictions]);

  useEffect(() => {
    drawCanvas();
    window.addEventListener('resize', drawCanvas);
    return () => {
      window.removeEventListener('resize', drawCanvas);
    };
  }, [drawCanvas]);

  // Auto-fetch comparison when both predictions exist
  useEffect(() => {
    if (currentPrediction?.has_student_predictions && currentPrediction?.has_ai_predictions && !comparison) {
      getComparison();
    }
  }, [currentPrediction?.has_student_predictions, currentPrediction?.has_ai_predictions]);

  const clearAll = () => {
    setCurrentPrediction(null);
    setImage(null);
    setImageFile(null);
    clearAnnotations();
    setError(null);
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
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
          
          {comparison && (
            <div className="text-xs">
              {comparison.comparison_metrics.both_found_fractures && (
                <span className="text-orange-600 font-medium">⚖️ Both Found Fractures</span>
              )}
              {comparison.comparison_metrics.student_only && (
                <span className="text-blue-600 font-medium">🎓 Student Only</span>
              )}
              {comparison.comparison_metrics.ai_only && (
                <span className="text-red-600 font-medium">🤖 AI Only</span>
              )}
              {comparison.comparison_metrics.both_normal && (
                <span className="text-green-600 font-medium">✅ Both Normal</span>
              )}
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {/* Upload Controls */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400"
              >
                {isUploading ? (
                  <>⏳ Uploading...</>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload X-ray Image
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                JPEG, PNG, BMP, TIFF (max 20MB)
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            {/* Image Controls */}
            {image && currentPrediction && (
              <div className="space-y-2">
                {/* Action Buttons */}
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
                  
                  {studentAnnotations.length > 0 && (
                    <button
                      onClick={submitAnnotations}
                      disabled={isSubmittingAnnotations}
                      className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
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
                    onClick={clearAll}
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
                    <span className="text-blue-600">🎓 Student ({currentPrediction?.student_prediction_count || studentAnnotations.length})</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showAiPredictions}
                      onChange={(e) => setShowAiPredictions(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-red-600"
                    />
                    <span className="text-red-600">🤖 AI ({currentPrediction?.ai_prediction_count || 0})</span>
                  </label>
                </div>

                {/* Annotation Instructions */}
                {isAnnotating && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="text-blue-800 font-medium">💡 Annotation Mode Active</p>
                    <p className="text-blue-700 mt-1">Click and drag on the image to mark fracture areas. Click "Confirm" when done.</p>
                  </div>
                )}

                {/* Current Annotations List */}
                {studentAnnotations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">
                      Draft Annotations ({studentAnnotations.length})
                    </h4>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {studentAnnotations.map((annotation, index) => (
                        <div key={annotation.id} className="flex items-center justify-between text-xs bg-blue-100 rounded p-2">
                          <span>Annotation #{index + 1}</span>
                          <button
                            onClick={() => removeAnnotation(annotation.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Image Display Container */}
            <div 
              ref={imageContainerRef} 
              className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center relative"
              style={{ height: '300px', minHeight: '300px' }}
            >
              {image ? (
                <canvas
                  ref={canvasRef}
                  className={`max-w-full max-h-full block ${isAnnotating ? 'cursor-crosshair' : 'cursor-default'}`}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
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
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Analysis Status</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Student Predictions:</span>
                      <span className={currentPrediction.has_student_predictions ? 'text-green-600' : 'text-gray-500'}>
                        {currentPrediction.has_student_predictions ? '✓' : '○'} {currentPrediction.student_prediction_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Predictions:</span>
                      <span className={currentPrediction.has_ai_predictions ? 'text-green-600' : 'text-gray-500'}>
                        {currentPrediction.has_ai_predictions ? '✓' : '○'} {currentPrediction.ai_prediction_count}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {currentPrediction.ai_max_confidence && (
                      <div className="flex justify-between">
                        <span>AI Confidence:</span>
                        <span>{(currentPrediction.ai_max_confidence * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {currentPrediction.ai_inference_time && (
                      <div className="flex justify-between">
                        <span>AI Time:</span>
                        <span>{(currentPrediction.ai_inference_time * 1000).toFixed(0)}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Results */}
            {comparison && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <h4 className="font-medium text-yellow-900 mb-2 text-sm">🎯 Comparison Results</h4>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Student Found:</span>
                        <span className="font-medium">{comparison.comparison_metrics.student_count} fractures</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Found:</span>
                        <span className="font-medium">{comparison.comparison_metrics.ai_count} fractures</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-center">
                        {comparison.comparison_metrics.both_found_fractures && (
                          <div className="text-orange-600 font-medium">⚖️ Agreement</div>
                        )}
                        {comparison.comparison_metrics.both_normal && (
                          <div className="text-green-600 font-medium">✅ Both Normal</div>
                        )}
                        {comparison.comparison_metrics.student_only && (
                          <div className="text-blue-600 font-medium">🎓 Student Only</div>
                        )}
                        {comparison.comparison_metrics.ai_only && (
                          <div className="text-red-600 font-medium">🤖 AI Only</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-yellow-200">
                    <p className="text-yellow-800 text-xs">
                      {comparison.comparison_metrics.both_found_fractures && 
                        "Great! Both you and the AI identified fractures. Compare the locations to see how well they match."}
                      {comparison.comparison_metrics.both_normal && 
                        "Perfect agreement! Both you and the AI found no fractures in this image."}
                      {comparison.comparison_metrics.student_only && 
                        "You identified fractures that the AI missed. This could be a learning opportunity for the AI model."}
                      {comparison.comparison_metrics.ai_only && 
                        "The AI found fractures that you may have missed. Review the AI's findings to improve your detection skills."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detection Lists */}
            {allDetections.length > 0 && (
              <div className="space-y-2">
                {/* Student Detections */}
                {allDetections.filter(d => d.source === 'student').length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">
                      🎓 Your Predictions ({allDetections.filter(d => d.source === 'student').length})
                    </h4>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {allDetections.filter(d => d.source === 'student').map((detection, index) => (
                        <div key={detection.id} className="text-xs p-2 bg-blue-100 rounded">
                          <div className="font-medium">{detection.label}</div>
                          <div className="text-blue-700">
                            Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) 
                            Size: {Math.round(detection.width)}×{Math.round(detection.height)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Detections */}
                {allDetections.filter(d => d.source === 'ai').length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-medium text-red-900 mb-2 text-sm">
                      🤖 AI Predictions ({allDetections.filter(d => d.source === 'ai').length})
                    </h4>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {allDetections.filter(d => d.source === 'ai').map((detection, index) => (
                        <div key={detection.id} className="text-xs p-2 bg-red-100 rounded">
                          <div className="font-medium">{detection.label}</div>
                          <div className="text-red-700">
                            Confidence: {detection.confidence ? (detection.confidence * 100).toFixed(1) + '%' : 'N/A'}
                          </div>
                          <div className="text-red-700">
                            Position: ({Math.round(detection.x)}, {Math.round(detection.y)}) 
                            Size: {Math.round(detection.width)}×{Math.round(detection.height)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            {!currentPrediction && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">💡 How it works</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>1. Upload an X-ray image</p>
                  <p>2. Annotate fractures you can see</p>
                  <p>3. Run AI prediction for comparison</p>
                  <p>4. Compare your findings with AI results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
                