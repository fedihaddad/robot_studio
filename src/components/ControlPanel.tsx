import React, { useState } from 'react';

interface ControlPanelProps {
  rosUrl: string;
  cameraUrl: string;
  onROSUrlChange: (url: string) => void;
  onCameraUrlChange: (url: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  rosUrl,
  cameraUrl,
  onROSUrlChange,
  onCameraUrlChange,
}) => {
  const [rosInput, setRosInput] = useState(rosUrl);
  const [cameraInput, setCameraInput] = useState(cameraUrl);

  const handleUpdateROS = () => {
    if (rosInput.trim()) {
      onROSUrlChange(rosInput);
    }
  };

  const handleUpdateCamera = () => {
    if (cameraInput.trim()) {
      onCameraUrlChange(cameraInput);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
      <h2 className="text-lg font-semibold">Quick Controls</h2>

      {/* ROS Connection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">ROS Bridge URL</label>
        <input
          type="text"
          value={rosInput}
          onChange={(e) => setRosInput(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="ws://axel.local:9090"
        />
        <button
          onClick={handleUpdateROS}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200"
        >
          Connect
        </button>
      </div>

      {/* Camera URL */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Camera Stream URL</label>
        <input
          type="text"
          value={cameraInput}
          onChange={(e) => setCameraInput(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          placeholder="http://localhost:8080/?action=stream"
        />
        <button
          onClick={handleUpdateCamera}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200"
        >
          Update Stream
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2 border-t border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-300">Actions</h3>
        <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors duration-200">
          Refresh Feed
        </button>
        <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors duration-200">
          Reset Streams
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="text-xs text-gray-400 bg-gray-900 rounded p-3 space-y-1">
          <p><strong>Tip:</strong> Check your ROS bridge is running</p>
          <p><strong>Tip:</strong> Verify MJPEG server on target port</p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
