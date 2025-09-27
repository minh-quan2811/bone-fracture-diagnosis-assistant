import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/types';

interface Detection {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  color: string;
}

interface PredictionResult {
  id: number;
  has_fracture: boolean;
  detection_count: number;
  max_confidence: number | null;
  inference_time: number | null;
  detections: Array<{
    id: number;
    class_name: string;
    confidence: number;
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
    width: number;
    height: number;
  }>;
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
  const [aiPredictions, setAiPredictions] = useState<Detection[]>([]);
  const [showAiPredictions, setShowAiPredictions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const runFracturePrediction = async () => {
    if (!imageFile || !token) {
      setError('Please upload an image and ensure you are logged in');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`${API_BASE_URL}/api/fracture/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result: PredictionResult = await response.json();
      setPredictionResult(result);

      const predictions: Detection[] = result.detections.map((detection, index) => ({
        id: detection.id,
        x: detection.x_min,
        y: detection.y_min,
        width: detection.width,
        height: detection.height,
        label: detection.class_name,
        confidence: detection.confidence,
        color: '#ef4444'
      }));

      setAiPredictions(predictions);

    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      setImageFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setAiPredictions([]);
          setPredictionResult(null);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
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

    if (showAiPredictions) {
      aiPredictions.forEach(prediction => {
        ctx.strokeStyle = prediction.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          prediction.x * scaleX,
          prediction.y * scaleY,
          prediction.width * scaleX,
          prediction.height * scaleY
        );

        ctx.fillStyle = prediction.color;
        ctx.font = '12px Arial';
        ctx.setLineDash([]);
        const confidenceText = `${prediction.label} (${(prediction.confidence * 100).toFixed(1)}%)`;
        ctx.fillText(confidenceText, prediction.x * scaleX, prediction.y * scaleY - 5);
      });
    }
  }, [image, aiPredictions, showAiPredictions]);

  useEffect(() => {
    drawCanvas();
    window.addEventListener('resize', drawCanvas);
    return () => {
      window.removeEventListener('resize', drawCanvas);
    };
  }, [image, aiPredictions, showAiPredictions, drawCanvas]);

  const clearAll = () => {
    setAiPredictions([]);
    setPredictionResult(null);
    setError(null);
    setImage(null);
    setImageFile(null);
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
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
          {predictionResult && (
            <div className={`text-sm font-medium ${predictionResult.has_fracture ? 'text-red-600' : 'text-green-600'}`}>
              {predictionResult.has_fracture ? '⚠️ Fracture Detected' : '✅ Normal'}
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        // This is the main content area for the panel, now configured as flex-col
        <div className="flex-1 p-4 flex flex-col overflow-y-auto">
          <div className="mb-4"> {/* Top controls: Upload button, description */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload X-ray Image
            </button>
            <p className="text-xs text-gray-500 mt-1 text-center">
              JPEG, PNG, BMP, TIFF (max 20MB)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {image && ( // These controls only appear if an image is loaded
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={runFracturePrediction}
                  disabled={isLoading || !token}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳' :
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                  {isLoading ? 'Analyzing...' : 'Detect'}
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAiPredictions}
                  onChange={(e) => setShowAiPredictions(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Show AI Predictions
              </label>
            </div>
          )}

          {/* This container needs to grow to fill space and center its content */}
          <div ref={imageContainerRef} className="flex-1 border-2 border-gray-300 rounded-lg overflow-hidden mb-4 bg-white flex items-center justify-center p-2">
            {image ? (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full block"
              />
            ) : (
              // This placeholder also needs to take full height of its flex-1 parent
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center w-full h-full flex flex-col items-center justify-center text-gray-500">
                <div className="text-4xl mb-2">📷</div> {/* Slightly larger icon for the main empty state */}
                <p className="text-base">Upload an X-ray image</p> {/* Slightly larger text */}
              </div>
            )}
          </div>

          {predictionResult && ( // These results appear at the bottom if present
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Analysis Results</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Detections:</span>
                  <span>{predictionResult.detection_count}</span>
                </div>
                {predictionResult.max_confidence && (
                  <div className="flex justify-between">
                    <span>Max Confidence:</span>
                    <span>{(predictionResult.max_confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
                {predictionResult.inference_time && (
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span>{(predictionResult.inference_time * 1000).toFixed(0)}ms</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {aiPredictions.length > 0 && ( // These predictions appear at the bottom if present
            <div className="bg-red-50 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-2 text-sm">
                Detected Fractures ({aiPredictions.length})
              </h4>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {aiPredictions.map((prediction, index) => (
                  <div key={prediction.id} className="text-xs p-2 bg-red-100 rounded">
                    <div className="font-medium">{prediction.label} #{index + 1}</div>
                    <div className="text-red-700">
                      Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}