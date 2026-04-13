import React, { useState } from 'react';
import { DashboardState } from '../types';
import CameraFeed from './CameraFeed';
import StatusBar from './StatusBar';
import ControlPanel from './ControlPanel';
import { QuickMoveButtons } from './QuickMoveButtons';

interface DashboardProps {
  state: DashboardState;
  setState: (state: DashboardState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, setState }) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleCameraUrlChange = (newUrl: string) => {
    setState({
      ...state,
      camera: { ...state.camera, url: newUrl },
    });
  };

  const handleROSUrlChange = (newUrl: string) => {
    setState({
      ...state,
      ros: { ...state.ros, rosUrl: newUrl },
    });
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 shadow-lg">
        <h1 className="text-2xl font-bold text-blue-400">Axel Dashboard</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
        >
          {showSettings ? 'Close Settings' : 'Settings'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Camera Feed - Left Side */}
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-lg font-semibold mb-2 ml-1">Camera Feed</h2>
          <div className="flex-1 min-h-0">
            <CameraFeed
              url={state.camera.url}
              enabled={state.camera.enabled}
            />
          </div>
        </div>

        {/* Control Panel - Right Side */}
        {!showSettings && (
          <div className="w-96 space-y-4 overflow-y-auto">
            <QuickMoveButtons />
            <ControlPanel
              rosUrl={state.ros.rosUrl}
              cameraUrl={state.camera.url}
              onROSUrlChange={handleROSUrlChange}
              onCameraUrlChange={handleCameraUrlChange}
            />
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-t border-gray-700 p-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ROS Bridge URL</label>
                <input
                  type="text"
                  value={state.ros.rosUrl}
                  onChange={(e) => handleROSUrlChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="ws://localhost:9090"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">MJPEG Stream URL</label>
                <input
                  type="text"
                  value={state.camera.url}
                  onChange={(e) => handleCameraUrlChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="http://localhost:8080/?action=stream"
                />
              </div>

              <div className="text-xs text-gray-400">
                <p className="mb-2">
                  <strong>MJPEG Stream:</strong> Configure the URL for your MJPEG stream server.
                  This is typically provided by mjpeg-streamer or similar tools.
                </p>
                <p>
                  <strong>ROS Bridge:</strong> The WebSocket URL for your ROS2 bridge server.
                  Ensure rosbridge_suite is running on this address.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <StatusBar ros={state.ros} cameraEnabled={state.camera.enabled} />
    </div>
  );
};

export default Dashboard;
