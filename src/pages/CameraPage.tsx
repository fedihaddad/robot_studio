import React, { useState } from 'react';

interface CameraPageProps {
  cameraUrl: string;
  onUrlChange: (url: string) => void;
}

const CameraPage: React.FC<CameraPageProps> = ({ cameraUrl, onUrlChange }) => {
  const [tempUrl, setTempUrl] = useState(cameraUrl);

  const handleUpdateUrl = () => {
    if (tempUrl.trim()) {
      onUrlChange(tempUrl);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Camera & Vision</h1>
        <p className="text-gray-400">Live camera feed with computer vision overlay</p>
      </div>

      {/* Main Camera View */}
      <div className="grid grid-cols-3 gap-6">
        {/* Camera Feed - Takes up 2/3 */}
        <div className="col-span-2">
          <div className="relative bg-black rounded-lg overflow-hidden border border-gray-700 aspect-video">
            <img
              src={cameraUrl}
              alt="Robot Camera"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
              }}
            />

            {/* Live Indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-1 rounded">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-semibold text-sm">LIVE</span>
            </div>


          </div>

          {/* Camera Controls */}
          <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Camera Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stream URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    placeholder="http://robot-ip:8080/?action=stream"
                  />
                  <button
                    onClick={handleUpdateUrl}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Space - Vision features can be added later */}
      </div>
    </div>
  );
};

export default CameraPage;
