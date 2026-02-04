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
}

export interface AnnotationCanvasRef {
  redraw: () => void;
}

export const AnnotationCanvas = forwardRef<AnnotationCanvasRef, AnnotationCanvasProps>(({
  image,
  annotations,
  detections,
  currentRect,
  isAnnotating,
  showStudentAnnotations,
  showAiPredictions,
  isDrawing,
  onMouseDown,
  onMouseMove,
  onMouseUp
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image natural size for 1:1 pixel mapping
    canvas.width = image.width;
    canvas.height = image.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image at full resolution
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // No scaling needed - we draw at 1:1 scale
    const scaleX = 1;
    const scaleY = 1;

    // Draw confirmed AI detections
    if (showAiPredictions) {
      detections.filter(d => d.source === 'ai').forEach(detection => {
        ctx.strokeStyle = detection.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          detection.x * scaleX,
          detection.y * scaleY,
          detection.width * scaleX,
          detection.height * scaleY
        );

        ctx.fillStyle = detection.color;
        ctx.font = 'bold 14px Arial';
        ctx.setLineDash([]);
        
        let label = 'AI';
        if (detection.fracture_type) {
          label = `AI: ${detection.fracture_type}`;
        }
        if (detection.confidence) {
          label += ` (${(detection.confidence * 100).toFixed(1)}%)`;
        }
        
        ctx.fillText(label, detection.x * scaleX, detection.y * scaleY - 5);
      });
    }

    // Draw confirmed student detections
    if (showStudentAnnotations) {
      detections.filter(d => d.source === 'student').forEach(detection => {
        ctx.strokeStyle = detection.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(
          detection.x * scaleX,
          detection.y * scaleY,
          detection.width * scaleX,
          detection.height * scaleY
        );

        ctx.fillStyle = detection.color;
        ctx.font = 'bold 14px Arial';
        
        let label = 'Student';
        if (detection.fracture_type) {
          label = `Student: ${detection.fracture_type}`;
        }
        
        ctx.fillText(label, detection.x * scaleX, detection.y * scaleY - 5);
      });
    }

    // Draw draft annotations (not yet confirmed)
    if (showStudentAnnotations) {
      annotations.forEach((annotation, index) => {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(
          annotation.x * scaleX,
          annotation.y * scaleY,
          annotation.width * scaleX,
          annotation.height * scaleY
        );

        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 14px Arial';
        
        let label = `Draft #${index + 1}`;
        if (annotation.fracture_type) {
          label = `Draft: ${annotation.fracture_type}`;
        }
        
        ctx.fillText(label, annotation.x * scaleX, annotation.y * scaleY - 5);
      });
    }

    // Draw current rectangle being drawn
    if (currentRect && isDrawing) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        currentRect.x * scaleX,
        currentRect.y * scaleY,
        currentRect.width * scaleX,
        currentRect.height * scaleY
      );
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px Arial';
      ctx.setLineDash([]);
      ctx.fillText('Drawing...', currentRect.x * scaleX, currentRect.y * scaleY - 5);
    }
  }, [
    image, 
    detections, 
    annotations, 
    currentRect, 
    isDrawing, 
    showStudentAnnotations, 
    showAiPredictions
  ]);

  useEffect(() => {
    drawCanvas();
    window.addEventListener('resize', drawCanvas);
    return () => {
      window.removeEventListener('resize', drawCanvas);
    };
  }, [drawCanvas]);

  useImperativeHandle(ref, () => ({
    redraw: drawCanvas
  }));

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full max-h-full block ${isAnnotating ? 'cursor-crosshair' : 'cursor-default'}`}
      style={{ objectFit: 'contain' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />
  );
});

AnnotationCanvas.displayName = 'AnnotationCanvas';