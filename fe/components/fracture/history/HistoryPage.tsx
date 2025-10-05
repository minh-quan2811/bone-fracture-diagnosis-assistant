// fe/components/fracture/history/HistoryPage.tsx
// SIMPLIFIED VERSION - Just show image with canvas overlay

import React, { useState, useEffect, useRef } from 'react';
import { useHistoryData } from '../../../hooks/history/useHistoryData';
import { useOverallStats } from '../../../hooks/history/useOverallStats';
import { OverallStatsCard } from './OverallStatsCard';
import { ImageNavigator } from './ImageNavigator';
import { ComparisonResultsCard } from '../ComparisonResultsCard';
import { Detection } from '../../../types/fracture';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HistoryPageProps {
  token: string;
  onBack: () => void;
}

export function HistoryPage({ token, onBack }: HistoryPageProps) {
  const { predictions, comparisons, isLoading, error } = useHistoryData(token);
  const stats = useOverallStats(comparisons);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
        setFadeIn(true);
      }, 150);
    }
  };

  const handleNext = () => {
    if (currentIndex < predictions.length - 1) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(predictions.length - 1, prev + 1));
        setFadeIn(true);
      }, 150);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onBack();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, predictions.length]);

  // Draw annotations on canvas when image loads
  const drawAnnotations = () => {
    if (!canvasRef.current || !imgRef.current || predictions.length === 0) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPrediction = predictions[currentIndex];
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all detections
    currentPrediction.detections.forEach(detection => {
      const color = detection.source === 'student' ? '#3b82f6' : '#ef4444';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(detection.x_min, detection.y_min, detection.width, detection.height);
      
      // Draw label background
      const label = `${detection.fracture_type || detection.class_name}${
        detection.confidence ? ` ${(detection.confidence * 100).toFixed(0)}%` : ''
      }`;
      
      ctx.font = '14px Arial';
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = color;
      ctx.fillRect(detection.x_min, detection.y_min - 20, textWidth + 10, 20);
      
      ctx.fillStyle = 'white';
      ctx.fillText(label, detection.x_min + 5, detection.y_min - 5);
    });
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-600 text-lg">Loading history...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Detection
          </button>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-800">
              <div className="font-semibold text-lg">Error Loading History</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Detection
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Predictions Yet</h2>
            <p className="text-gray-600">
              Start making predictions to see your history here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentPrediction = predictions[currentIndex];
  const currentComparison = comparisons.get(currentPrediction.id);
  
  const studentCount = currentPrediction.detections.filter(d => d.source === 'student').length;
  const aiCount = currentPrediction.detections.filter(d => d.source === 'ai').length;

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-6 pb-16">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Detection
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Prediction History
        </h1>

        <OverallStatsCard stats={stats} />

        <div className="bg-white rounded-lg shadow-md p-6">
          <ImageNavigator
            currentIndex={currentIndex}
            totalImages={predictions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </div>

        <div 
          className={`transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {currentPrediction.image_filename}
              </h3>
              <span className="text-sm text-gray-500">
                {new Date(currentPrediction.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {/* Image with Canvas Overlay */}
            <div 
              ref={containerRef}
              className="bg-gray-100 rounded-lg flex items-center justify-center p-8 min-h-[500px] relative"
            >
              <div className="relative">
                <img 
                  ref={imgRef}
                  src={`${API_BASE}/${currentPrediction.image_path}`}
                  alt={currentPrediction.image_filename}
                  className="max-w-full max-h-[600px] object-contain"
                  onLoad={drawAnnotations}
                  onError={(e) => {
                    console.error('Failed to load image:', currentPrediction.image_path);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* Image Metadata */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-600">Dimensions</div>
                <div className="font-semibold text-gray-900">
                  {currentPrediction.image_width} × {currentPrediction.image_height}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-600">Format</div>
                <div className="font-semibold text-gray-900 uppercase">
                  {currentPrediction.image_format || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-600">Size</div>
                <div className="font-semibold text-gray-900">
                  {currentPrediction.image_size 
                    ? `${(currentPrediction.image_size / 1024).toFixed(1)} KB`
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">
                  Student Predictions ({studentCount})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">
                  AI Predictions ({aiCount})
                </span>
              </div>
            </div>
          </div>

          {/* Comparison Results Card */}
          {currentComparison && (
            <ComparisonResultsCard comparison={currentComparison} />
          )}
        </div>
      </div>
    </div>
  );
}