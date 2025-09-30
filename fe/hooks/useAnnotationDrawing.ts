import { useState, useCallback } from 'react';

interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
}

interface UseAnnotationDrawingReturn {
  annotations: StudentAnnotation[];
  isAnnotating: boolean;
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentRect: StudentAnnotation | null;
  setIsAnnotating: (value: boolean) => void;
  addAnnotation: (annotation: StudentAnnotation) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  handleMouseDown: (x: number, y: number) => void;
  handleMouseMove: (x: number, y: number) => void;
  handleMouseUp: () => void;
}

export function useAnnotationDrawing(): UseAnnotationDrawingReturn {
  const [annotations, setAnnotations] = useState<StudentAnnotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<StudentAnnotation | null>(null);

  const handleMouseDown = useCallback((x: number, y: number) => {
    if (!isAnnotating) return;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({
      id: `temp-${Date.now()}`,
      x,
      y,
      width: 0,
      height: 0
    });
  }, [isAnnotating]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!isDrawing || !startPoint) return;

    const width = x - startPoint.x;
    const height = y - startPoint.y;

    setCurrentRect({
      id: `temp-${Date.now()}`,
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(width),
      height: Math.abs(height)
    });
  }, [isDrawing, startPoint]);

  const handleMouseUp = useCallback(() => {
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

    setAnnotations(prev => [...prev, newAnnotation]);
    setCurrentRect(null);
    setIsDrawing(false);
    setStartPoint(null);
  }, [isDrawing, currentRect]);

  const addAnnotation = useCallback((annotation: StudentAnnotation) => {
    setAnnotations(prev => [...prev, annotation]);
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    setCurrentRect(null);
    setIsDrawing(false);
    setStartPoint(null);
  }, []);

  return {
    annotations,
    isAnnotating,
    isDrawing,
    startPoint,
    currentRect,
    setIsAnnotating,
    addAnnotation,
    removeAnnotation,
    clearAnnotations,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}