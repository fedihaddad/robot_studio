import React from 'react';
import { ROSState } from '../types';

interface StatusBarProps {
  ros: ROSState;
  cameraEnabled: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ ros, cameraEnabled }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center gap-4">
        {/* ROS Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${ros.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            ROS: {ros.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Camera Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium">
            Camera: {cameraEnabled ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {ros.error && (
        <div className="text-sm text-red-400">
          {ros.error}
        </div>
      )}

      {/* ROS URL */}
      <div className="text-xs text-gray-400">
        {ros.rosUrl}
      </div>
    </div>
  );
};

export default StatusBar;
