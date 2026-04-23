import React, { useMemo, useState, useEffect } from 'react';
import { AppConfig, ROSState, RobotMode } from '../types';
import { ROSService } from '../services/ros.service';
import DiagnosticsPanel from '../components/shared/DiagnosticsPanel';

interface SettingsPageProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onSave: () => void;
  onLoad: () => void;
  rosState: ROSState;
  rosService: ROSService | null;
  currentMode: RobotMode;
  aiNodeActive: boolean;
  onReconnectROS?: () => void;
  isReconnecting?: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  onConfigChange,
  onSave,
  onLoad,
  rosState,
  rosService,
  currentMode,
  aiNodeActive,
  onReconnectROS,
  isReconnecting = false,
}) => {
  const [formData, setFormData] = useState(config);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(true);
  const [rosTest, setRosTest] = useState<
    | { status: 'idle' }
    | { status: 'testing' }
    | { status: 'ok'; latencyMs: number; topicsCount: number }
    | { status: 'fail'; error: string }
  >({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (field: keyof AppConfig, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onConfigChange(newData);
  };

  const normalizeRosUrl = (value: string): string => {
    const raw = value.trim();
    if (!raw) return raw;
    if (raw.startsWith('ws://') || raw.startsWith('wss://')) return raw;
    const hostPort = raw.replace(/^https?:\/\//, '');
    const hasPort = /:\d+$/.test(hostPort);
    if (hasPort) return `ws://${hostPort}`;
    return `ws://${hostPort}:9090`;
  };

  const effectiveRosUrl = useMemo(() => normalizeRosUrl(formData.rosUrl), [formData.rosUrl]);

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

  const handleTestConnection = async (url: string, label: string) => {
    setSaveMessage(`🧪 Testing ${label}...`);
    const success = await testConnection(url);
    if (success) {
      setSaveMessage(`✅ ${label} connected successfully!`);
    } else {
      setSaveMessage(`❌ ${label} connection failed. Check the URL and ensure the service is running.`);
    }
    setTimeout(() => setSaveMessage(null), 5000);
  };

  const testRosbridge = async () => {
    const url = effectiveRosUrl;
    setRosTest({ status: 'testing' });

    const start = performance.now();
    try {
      if (!window.ROSLIB) {
        throw new Error('ROSLIB not loaded in renderer');
      }

      const ros = new (window as any).ROSLIB.Ros({ url });
      const result = await new Promise<{ topicsCount: number }>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          try {
            ros.close();
          } catch {
            // ignore
          }
          reject(new Error('Timeout connecting to rosbridge'));
        }, 3500);

        ros.on('connection', () => {
          ros.getTopics(
            (topics: any) => {
              window.clearTimeout(timeout);
              try {
                ros.close();
              } catch {
                // ignore
              }
              const count = Array.isArray(topics?.topics) ? topics.topics.length : 0;
              resolve({ topicsCount: count });
            },
            (err: any) => {
              window.clearTimeout(timeout);
              try {
                ros.close();
              } catch {
                // ignore
              }
              reject(new Error(typeof err === 'string' ? err : 'getTopics failed'));
            }
          );
        });
        ros.on('error', (err: any) => {
          window.clearTimeout(timeout);
          try {
            ros.close();
          } catch {
            // ignore
          }
          reject(new Error(err?.message || 'WebSocket error'));
        });
      });

      const latencyMs = Math.round(performance.now() - start);
      setRosTest({ status: 'ok', latencyMs, topicsCount: result.topicsCount });
      setSaveMessage(`✅ ROSBridge OK (${latencyMs}ms, topics: ${result.topicsCount})`);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRosTest({ status: 'fail', error: msg });
      setSaveMessage(`❌ ROSBridge failed: ${msg}`);
      setTimeout(() => setSaveMessage(null), 6000);
    }
  };

  const copyConfig = async () => {
    const payload = {
      ...formData,
      rosUrlNormalized: effectiveRosUrl,
      rosConnected: rosState.isConnected,
      currentMode,
      aiNodeActive,
      exportedAt: new Date().toISOString(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const resetDefaults = () => {
    const defaults: AppConfig = {
      rosUrl: 'ws://10.151.21.13:9090',
      cameraUrl: 'http://localhost:8080/?action=stream',
      robotIp: '10.151.21.13',
      robotName: 'AXEL',
    };
    setFormData(defaults);
    onConfigChange(defaults);
    setSaveMessage('Defaults restored (not saved yet)');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const testConnection = async (url: string) => {
    try {
      // Check if it's a WebSocket URL
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        // Test WebSocket connection
        return new Promise((resolve) => {
          const ws = new WebSocket(url);
          const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
          }, 3000);

          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
        });
      } else {
        // Test HTTP connection
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return true;
      }
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

      {/* Quick Actions */}
      <div className="axel-surface rounded-xl border border-slate-700/60 p-4 flex flex-wrap items-center gap-2">
        <button onClick={testRosbridge} className="axel-button-primary px-4 py-2 rounded-xl text-sm font-bold">
          {rosTest.status === 'testing' ? 'Testing ROSBridge…' : 'Test ROSBridge'}
        </button>
        <button
          onClick={() => onReconnectROS?.()}
          disabled={!onReconnectROS || isReconnecting}
          className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {isReconnecting ? 'Reconnecting…' : 'Reconnect ROS'}
        </button>
        <button onClick={copyConfig} className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold">
          {copied ? 'Copied' : 'Copy config'}
        </button>
        <button onClick={resetDefaults} className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold">
          Reset defaults
        </button>

        <div className="ml-auto text-xs axel-muted">
          ROS: <span className={rosState.isConnected ? 'text-emerald-300' : 'text-rose-300'}>{rosState.isConnected ? 'Connected' : 'Disconnected'}</span>
          <span className="mx-2 opacity-40">|</span>
          Mode: <span className="text-cyan-200">{currentMode}</span>
        </div>
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
                    onClick={() => handleTestConnection(`http://${formData.robotIp}:8080`, 'Camera Stream')}
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
                    onBlur={() => {
                      const normalized = normalizeRosUrl(formData.rosUrl);
                      if (normalized !== formData.rosUrl) {
                        handleChange('rosUrl', normalized);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    placeholder="ws://192.168.1.100:9090"
                  />
                  <button
                    onClick={() => handleTestConnection(formData.rosUrl, 'ROS Bridge')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors whitespace-nowrap"
                  >
                    🧪 Test
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Normalized: <span className="font-mono text-slate-200">{effectiveRosUrl}</span>
                </p>
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
                    onClick={() => handleTestConnection(formData.cameraUrl, 'MJPEG Camera')}
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

      {/* Diagnostics (embedded) */}
      <div className="axel-surface rounded-xl border border-slate-700/60 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">🧪 Diagnostics</h2>
            <p className="text-sm axel-muted">Logs & debug (useful for soutenance)</p>
          </div>
          <button
            onClick={() => setShowDiagnostics((v) => !v)}
            className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold"
          >
            {showDiagnostics ? 'Hide' : 'Show'}
          </button>
        </div>

        {showDiagnostics && (
          <DiagnosticsPanel
            rosState={rosState}
            rosService={rosService}
            currentMode={currentMode}
            aiNodeActive={aiNodeActive}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
