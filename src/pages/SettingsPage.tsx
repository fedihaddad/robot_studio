import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';

interface SettingsPageProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onSave: () => void;
  onLoad: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  onConfigChange,
  onSave,
  onLoad,
}) => {
  const [formData, setFormData] = useState(config);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (field: keyof AppConfig, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onConfigChange(newData);
  };

  const handleSave = () => {
    onSave();
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleLoad = () => {
    onLoad();
    setSaveMessage('Settings loaded from storage!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const testConnection = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure AXEL robot connection parameters</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-4 text-green-200">
          ✓ {saveMessage}
        </div>
      )}

      {/* Configuration Sections */}
      <div className="grid grid-cols-2 gap-8">
        {/* Robot Configuration */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">🤖 Robot Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Robot Name
                </label>
                <input
                  type="text"
                  value={formData.robotName}
                  onChange={(e) => handleChange('robotName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., AXEL-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Robot IP Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.robotIp}
                    onChange={(e) => handleChange('robotIp', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 192.168.1.100"
                  />
                  <button
                    onClick={() => testConnection(`http://${formData.robotIp}:8080`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors whitespace-nowrap"
                  >
                    🧪 Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Configuration */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">🌐 Network Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ROS Bridge WebSocket URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.rosUrl}
                    onChange={(e) => handleChange('rosUrl', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    placeholder="ws://192.168.1.100:9090"
                  />
                  <button
                    onClick={() => testConnection(formData.rosUrl)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors whitespace-nowrap"
                  >
                    🧪 Test
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  WebSocket URL for ROS2 bridge communication
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MJPEG Camera Stream URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cameraUrl}
                    onChange={(e) => handleChange('cameraUrl', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    placeholder="http://192.168.1.100:8080/?action=stream"
                  />
                  <button
                    onClick={() => testConnection(formData.cameraUrl)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors whitespace-nowrap"
                  >
                    🧪 Test
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  HTTP URL for MJPEG camera stream
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-white"
        >
          💾 Save Configuration
        </button>
        <button
          onClick={handleLoad}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-white"
        >
          📂 Load Configuration
        </button>
      </div>

      {/* Configuration Preview */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">📋 Configuration Summary</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Robot Name:</span>
            <span className="text-blue-400">{formData.robotName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Robot IP:</span>
            <span className="text-blue-400">{formData.robotIp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ROS URL:</span>
            <span className="text-blue-400">{formData.rosUrl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Camera URL:</span>
            <span className="text-blue-400 truncate">{formData.cameraUrl}</span>
          </div>
        </div>
      </div>

      {/* Connection Guide */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 space-y-3">
        <h3 className="text-lg font-bold text-blue-200">ℹ️ Connection Guide</h3>
        <ul className="text-sm text-blue-100 space-y-2">
          <li>✓ Ensure your robot is on and connected to the network</li>
          <li>✓ ROS2 and rosbridge_suite must be running on the robot</li>
          <li>✓ MJPEG-Streamer must be running on port 8080</li>
          <li>✓ Use your robot's IP address (e.g., 192.168.x.x)</li>
          <li>✓ Test connections to verify before saving</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage;
