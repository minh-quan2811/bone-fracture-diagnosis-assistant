// Re-export all functions from main API
export * from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Additional fracture-specific API functions

export async function getPredictionHistory(
  token: string,
  params?: {
    skip?: number;
    limit?: number;
    has_student_predictions?: boolean;
    has_ai_predictions?: boolean;
  }
) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
  if (params?.has_student_predictions !== undefined) {
    searchParams.append('has_student_predictions', params.has_student_predictions.toString());
  }
  if (params?.has_ai_predictions !== undefined) {
    searchParams.append('has_ai_predictions', params.has_ai_predictions.toString());
  }
  
  const url = `${API_BASE}/api/fracture/predictions${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch prediction history");
  }
  
  return res.json();
}

export async function exportPredictionData(predictionId: number, token: string) {
  const res = await fetch(`${API_BASE}/api/fracture/predictions/${predictionId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to export prediction data");
  }
  
  return res.blob();
}

export async function getPredictionImage(predictionId: number, token: string) {
  const res = await fetch(`${API_BASE}/api/fracture/predictions/${predictionId}/image`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch prediction image");
  }
  
  return res.blob();
}

export async function deletePrediction(predictionId: number, token: string) {
  const res = await fetch(`${API_BASE}/api/fracture/predictions/${predictionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to delete prediction");
  }
  
  return res.json();
}

export async function updateStudentAnnotation(
  predictionId: number,
  annotationId: number,
  updates: {
    notes?: string;
    x_min?: number;
    y_min?: number;
    x_max?: number;
    y_max?: number;
    width?: number;
    height?: number;
  },
  token: string
) {
  const res = await fetch(`${API_BASE}/api/fracture/predictions/${predictionId}/annotations/${annotationId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(updates),
  });
  
  if (!res.ok) {
    throw new Error("Failed to update annotation");
  }
  
  return res.json();
}

export async function getDetailedComparison(
  predictionId: number,
  token: string,
  options?: {
    include_metrics?: boolean;
    include_feedback?: boolean;
    iou_threshold?: number;
  }
) {
  const searchParams = new URLSearchParams();
  if (options?.include_metrics) searchParams.append('include_metrics', 'true');
  if (options?.include_feedback) searchParams.append('include_feedback', 'true');
  if (options?.iou_threshold) searchParams.append('iou_threshold', options.iou_threshold.toString());
  
  const url = `${API_BASE}/api/fracture/predictions/${predictionId}/detailed-comparison${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch detailed comparison");
  }
  
  return res.json();
}

export async function generatePerformanceReport(
  token: string,
  dateRange?: {
    start_date?: string;
    end_date?: string;
  }
) {
  const searchParams = new URLSearchParams();
  if (dateRange?.start_date) searchParams.append('start_date', dateRange.start_date);
  if (dateRange?.end_date) searchParams.append('end_date', dateRange.end_date);
  
  const url = `${API_BASE}/api/fracture/performance-report${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to generate performance report");
  }
  
  return res.json();
}

export async function getModelInfo(token: string) {
  const res = await fetch(`${API_BASE}/api/fracture/model-info`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch model info");
  }
  
  return res.json();
}

// Utility functions for client-side processing

export function calculateAnnotationStats(annotations: any[]) {
  if (!annotations.length) {
    return {
      total: 0,
      averageSize: 0,
      averageConfidence: 0,
      sizeDistribution: { small: 0, medium: 0, large: 0 }
    };
  }
  
  const sizes = annotations.map(ann => ann.width * ann.height);
  const confidences = annotations.filter(ann => ann.confidence).map(ann => ann.confidence);
  
  const averageSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
  const averageConfidence = confidences.length > 0 
    ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
    : 0;
  
  // Categorize sizes (arbitrary thresholds)
  const sizeDistribution = sizes.reduce((dist, size) => {
    if (size < 5000) dist.small++;
    else if (size < 20000) dist.medium++;
    else dist.large++;
    return dist;
  }, { small: 0, medium: 0, large: 0 });
  
  return {
    total: annotations.length,
    averageSize,
    averageConfidence,
    sizeDistribution
  };
}

export function validateAnnotation(annotation: {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (annotation.width < 10) {
    errors.push("Annotation width must be at least 10 pixels");
  }
  
  if (annotation.height < 10) {
    errors.push("Annotation height must be at least 10 pixels");
  }
  
  if (annotation.x_min < 0 || annotation.y_min < 0) {
    errors.push("Annotation coordinates cannot be negative");
  }
  
  if (annotation.x_max <= annotation.x_min || annotation.y_max <= annotation.y_min) {
    errors.push("Invalid annotation coordinates");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}