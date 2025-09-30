import React from 'react';

export function UsageTips() {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="font-medium text-gray-900 mb-2 text-sm">💡 How it works</h4>
      <div className="text-xs text-gray-600 space-y-1">
        <p>1. Upload an X-ray image</p>
        <p>2. Annotate fractures you can see</p>
        <p>3. Run AI prediction for comparison</p>
        <p>4. Compare your findings with AI results</p>
      </div>
    </div>
  );
}