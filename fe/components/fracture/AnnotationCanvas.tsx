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
  paddingInfo?: {
    offset_x: number;
    offset_y: number;
    content_width: number;
    content_height: number;
  } | null;
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
  containerRef,
  paddingInfo
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed display size: 640x640
    const displayWidth = 640;
    const displayHeight = 640;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = displayWidth * window.devicePixelRatio;
    canvas.height = displayHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    // Since the server returns a 640x640 image with padding already applied,
    // and annotations are stored in the CONTENT coordinate space (without padding),
    // we need to map content coordinates to display coordinates
    const offsetX = paddingInfo?.offset_x || 0;
    const offsetY = paddingInfo?.offset_y || 0;
    const contentWidth = paddingInfo?.content_width || displayWidth;
    const contentHeight = paddingInfo?.content_height || displayHeight;

    // Annotations are stored relative to content area, scale to display
    const scaleX = 1; // Content and display are same size
    const scaleY = 1;

    // Draw confirmed AI detections
    if (showAiPredictions) {
      detections.filter(d => d.source === 'ai').forEach(detection => {
        ctx.strokeStyle = detection.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          detection.x * scaleX + offsetX,
          detection.y * scaleY + offsetY,
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
        
        ctx.fillText(label, detection.x * scaleX + offsetX, detection.y * scaleY + offsetY - 5);
      });
    }

    // Draw confirmed student detections
    if (showStudentAnnotations) {
      detections.filter(d => d.source === 'student').forEach(detection => {
        ctx.strokeStyle = detection.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(
          detection.x * scaleX + offsetX,
          detection.y * scaleY + offsetY,
          detection.width * scaleX,
          detection.height * scaleY
        );

        ctx.fillStyle = detection.color;
        ctx.font = 'bold 14px Arial';
        
        let label = 'Student';
        if (detection.fracture_type) {
          label = `Student: ${detection.fracture_type}`;
        }
        
        ctx.fillText(label, detection.x * scaleX + offsetX, detection.y * scaleY + offsetY - 5);
      });
    }

    // Draw draft annotations
    if (showStudentAnnotations) {
      annotations.forEach((annotation, index) => {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(
          annotation.x * scaleX + offsetX,
          annotation.y * scaleY + offsetY,
          annotation.width * scaleX,
          annotation.height * scaleY
        );

        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 14px Arial';
        
        let label = `Draft #${index + 1}`;
        if (annotation.fracture_type) {
          label = `Draft: ${annotation.fracture_type}`;
        }
        
        ctx.fillText(label, annotation.x * scaleX + offsetX, annotation.y * scaleY + offsetY - 5);
      });
    }

    // Draw current rectangle being drawn
    if (currentRect && isDrawing) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        currentRect.x * scaleX + offsetX,
        currentRect.y * scaleY + offsetY,
        currentRect.width * scaleX,
        currentRect.height * scaleY
      );
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px Arial';
      ctx.setLineDash([]);
      ctx.fillText('Drawing...', currentRect.x * scaleX + offsetX, currentRect.y * scaleY + offsetY - 5);
    }
  }, [
    image, 
    detections, 
    annotations, 
    currentRect, 
    isDrawing, 
    showStudentAnnotations, 
    showAiPredictions,
    containerRef,
    paddingInfo
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
      className={`block ${isAnnotating ? 'cursor-crosshair' : 'cursor-default'}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />
  );
});

AnnotationCanvas.displayName = 'AnnotationCanvas';