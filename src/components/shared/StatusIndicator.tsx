import React from 'react';

interface StatusIndicatorProps {
  label: string;
  status: 'connected' | 'disconnected' | 'warning' | 'error';
  value?: string | number;
}

const statusColors = {
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-600',
};

const statusTextColors = {
  connected: 'text-green-400',
  disconnected: 'text-red-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  label, 
  status, 
  value 
}) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
      <div className={`w-3 h-3 rounded-full ${statusColors[status]} animate-pulse`} />
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-sm font-semibold ${statusTextColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
          {value && ` • ${value}`}
        </p>
      </div>
    </div>
  );
};

export default StatusIndicator;
