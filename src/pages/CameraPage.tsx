import React, { useState } from 'react';

interface CameraPageProps {
  cameraUrl: string;
  onUrlChange: (url: string) => void;
}

const CameraPage: React.FC<CameraPageProps> = ({ cameraUrl, onUrlChange }) => {
  const [tempUrl, setTempUrl] = useState(cameraUrl);
  const [streamActive, setStreamActive] = useState(true);

  const handleUpdateUrl = () => {
    if (tempUrl.trim()) {
      onUrlChange(tempUrl);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
          📷 Camera & Vision
        </h1>
        <p className="text-gray-400 text-lg">Real-time camera feed and vision analysis</p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Camera Feed - Takes up 2/3 */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Camera Stream */}
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-cyan-700/50 aspect-video backdrop-blur-sm shadow-2xl">
            <img
              src={cameraUrl}
              alt="Robot Camera"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
              }}
            />

            {/* Live Indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-gradient-to-r from-red-900/80 to-red-800/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-600/50">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
              <span className="text-red-300 font-bold text-sm">LIVE STREAM</span>
            </div>

            {/* Camera Stats Overlay */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gradient-to-r from-blue-900/80 to-cyan-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-600/50 text-xs text-cyan-300">
              <span>📊 Resolution: 1280x720</span>
            </div>

            {/* Recording Indicator */}
            {streamActive && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-green-900/80 to-emerald-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-600/50">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 font-semibold text-xs">RECORDING</span>
              </div>
            )}
          </div>

          {/* Camera Controls Panel */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>⚙️</span> Camera Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">📡 Stream URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/75 focus:bg-gray-700/70 transition-all backdrop-blur-sm"
                    placeholder="http://robot-ip:8080/?action=stream"
                  />
                  <button
                    onClick={handleUpdateUrl}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/50"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStreamActive(!streamActive)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    streamActive
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200'
                  }`}
                >
                  {streamActive ? '⏹️ Stop Stream' : '▶️ Start Stream'}
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all text-white">
                  📸 Screenshot
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Vision Features */}
        <div className="flex flex-col gap-4">
          {/* Stream Info Card */}
          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-cyan-700/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
              <span>ℹ️</span> Stream Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`font-semibold ${streamActive ? 'text-green-400' : 'text-gray-400'}`}>
                  {streamActive ? '🟢 Active' : '⚫ Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">FPS</span>
                <span className="text-cyan-400 font-semibold">30 FPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Latency</span>
                <span className="text-cyan-400 font-semibold">~50ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bitrate</span>
                <span className="text-cyan-400 font-semibold">2.5 Mbps</span>
              </div>
            </div>
          </div>

          {/* Vision Modes */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
              <span>🔍</span> Vision Modes
            </h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-600/50 rounded-lg text-purple-200 text-sm font-medium transition-all">
                👁️ Object Detection
              </button>
              <button className="w-full px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-600/50 rounded-lg text-purple-200 text-sm font-medium transition-all">
                😊 Face Recognition
              </button>
              <button className="w-full px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-600/50 rounded-lg text-purple-200 text-sm font-medium transition-all">
                ✋ Hand Detection
              </button>
              <button className="w-full px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-600/50 rounded-lg text-purple-200 text-sm font-medium transition-all">
                🏷️ Label Objects
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
              <span>📈</span> Performance
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">CPU Usage</span>
                  <span className="text-green-400 font-semibold">35%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-green-500 to-emerald-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Memory</span>
                  <span className="text-green-400 font-semibold">52%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-gradient-to-r from-green-500 to-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
