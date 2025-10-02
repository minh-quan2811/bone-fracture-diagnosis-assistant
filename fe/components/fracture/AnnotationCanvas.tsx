import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
  fracture_type?: string;
  body_region?: string;
}

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
  fracture_type?: string;
  body_region?: string;
}

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
  onMouseUp,
  containerRef
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
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
        if (detection.body_region && detection.fracture_type) {
          label = `AI: ${detection.body_region} - ${detection.fracture_type}`;
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
        if (detection.body_region && detection.fracture_type) {
          label = `Student: ${detection.body_region} - ${detection.fracture_type}`;
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
        if (annotation.body_region && annotation.fracture_type) {
          label = `Draft: ${annotation.body_region} - ${annotation.fracture_type}`;
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
    showAiPredictions,
    containerRef
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
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />
  );
});

AnnotationCanvas.displayName = 'AnnotationCanvas';