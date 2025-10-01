import React, { useState } from 'react';

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

interface AnnotationDetailsModalProps {
  annotation: StudentAnnotation;
  isOpen: boolean;
  onClose: () => void;
  onSave: (annotation: StudentAnnotation) => void;
}

const FRACTURE_TYPES = [
  { value: 'greenstick', label: 'Greenstick' },
  { value: 'transverse', label: 'Transverse' },
  { value: 'comminuted', label: 'Comminuted' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'compound', label: 'Compound' },
  { value: 'oblique', label: 'Oblique' },
  { value: 'compression', label: 'Compression' },
  { value: 'avulsion', label: 'Avulsion' },
  { value: 'hairline', label: 'Hairline' }
];

const BODY_REGIONS = [
  { value: 'arm', label: 'Arm' },
  { value: 'leg', label: 'Leg' },
  { value: 'hand', label: 'Hand' },
  { value: 'foot', label: 'Foot' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'hip', label: 'Hip' },
  { value: 'spine', label: 'Spine' },
  { value: 'ribs', label: 'Ribs' },
  { value: 'skull', label: 'Skull' },
  { value: 'pelvis', label: 'Pelvis' },
  { value: 'wrist', label: 'Wrist' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'elbow', label: 'Elbow' },
  { value: 'knee', label: 'Knee' }
];

export function AnnotationDetailsModal({
  annotation,
  isOpen,
  onClose,
  onSave
}: AnnotationDetailsModalProps) {
  const [fractureType, setFractureType] = useState(annotation.fracture_type || '');
  const [bodyRegion, setBodyRegion] = useState(annotation.body_region || '');
  const [notes, setNotes] = useState(annotation.notes || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...annotation,
      fracture_type: fractureType || undefined,
      body_region: bodyRegion || undefined,
      notes: notes || undefined
    });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Annotation Details
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Size: {Math.round(annotation.width)}×{Math.round(annotation.height)}px
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Body Region Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body Region <span className="text-red-500">*</span>
            </label>
            <select
              value={bodyRegion}
              onChange={(e) => setBodyRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select body region...</option>
              {BODY_REGIONS.map(region => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fracture Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fracture Type <span className="text-red-500">*</span>
            </label>
            <select
              value={fractureType}
              onChange={(e) => setFractureType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select fracture type...</option>
              {FRACTURE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any observations or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-xs text-blue-800">
                  Both body region and fracture type are required to help improve 
                  the accuracy of your annotations and comparisons with AI predictions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!bodyRegion || !fractureType}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}