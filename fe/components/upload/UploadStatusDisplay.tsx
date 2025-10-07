import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { UploadStatusDisplayProps } from '@/types';

export function UploadStatusDisplay({ 
  status, 
  message, 
  fileName 
}: UploadStatusDisplayProps) {
  if (status === 'idle') return null;

  const configs = {
    uploading: {
      icon: <Loader className="w-5 h-5 animate-spin text-indigo-600" />,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-900'
    },
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900'
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900'
    }
  };

  const config = configs[status];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        {fileName && (
          <p className={`text-sm font-medium ${config.textColor} truncate`}>
            {fileName}
          </p>
        )}
        {message && (
          <p className={`text-sm ${config.textColor} ${fileName ? 'mt-1' : ''}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}