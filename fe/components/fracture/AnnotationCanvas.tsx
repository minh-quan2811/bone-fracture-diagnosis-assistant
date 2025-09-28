import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
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
  containerRef: React.RefObject<HTMLDivElement>;
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

    // Draw confirmed detections
    detections.forEach(detection => {
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
      annotations.forEach((annotation, index) => {
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