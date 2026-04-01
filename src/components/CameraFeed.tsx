import React from 'react';

interface CameraFeedProps {
  url: string;
  enabled: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ url, enabled }) => {
  if (!enabled) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
        <p className="text-gray-400">Camera feed disabled</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-lg">
      <img
        src={url}
        alt="MJPEG Stream"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '';
          console.error('Failed to load camera stream from:', url);
        }}
      />
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-sm">
        <span className="text-green-400 animate-pulse">● LIVE</span>
      </div>
    </div>
  );
};

export default CameraFeed;
