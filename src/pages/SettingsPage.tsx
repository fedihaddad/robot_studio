import React, { useMemo, useState, useEffect } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SignalIcon,
  SunIcon,
  VideoCameraIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
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
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-cyan-200" aria-hidden />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[color:var(--axel-text)]">Settings</h1>
              <p className="text-sm md:text-base axel-muted mt-1">Connection parameters and diagnostics</p>
            </div>
          </div>
        </div>

        <div className="axel-surface rounded-2xl border border-slate-700/60 px-4 py-3 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${rosState.isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="axel-muted">ROS</span>
            <span className={rosState.isConnected ? 'text-emerald-200' : 'text-rose-200'}>
              {rosState.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-300" aria-hidden />
            <span className="axel-muted">Mode</span>
            <span className="text-cyan-200 font-semibold">{currentMode}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="axel-surface rounded-2xl border border-slate-700/60 p-4 flex flex-wrap items-center gap-2">
        <button onClick={testRosbridge} className="axel-button-primary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2">
          <BeakerIcon className="w-4 h-4" aria-hidden />
          {rosTest.status === 'testing' ? 'Testing ROSBridge…' : 'Test ROSBridge'}
        </button>
        <button onClick={copyConfig} className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2">
          <ClipboardDocumentIcon className="w-4 h-4" aria-hidden />
          {copied ? 'Copied' : 'Copy config'}
        </button>
        <button onClick={resetDefaults} className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2">
          <WrenchScrewdriverIcon className="w-4 h-4" aria-hidden />
          Reset defaults
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs axel-muted hidden sm:block">Theme</span>
          <button
            type="button"
            onClick={onToggleTheme}
            className="axel-button-secondary px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2"
            title="Toggle theme"
          >
            {theme === 'dark' ? <MoonIcon className="w-4 h-4" aria-hidden /> : <SunIcon className="w-4 h-4" aria-hidden />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="axel-surface rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-4 text-emerald-200 text-sm">
          {saveMessage}
        </div>
      )}

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Robot Configuration */}
        <div className="space-y-6">
          <div className="axel-surface rounded-2xl border border-slate-700/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] flex items-center justify-center">
                <ComputerDesktopIcon className="w-5 h-5 text-slate-200" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[color:var(--axel-text)] leading-tight">Robot</h2>
                <p className="text-xs axel-muted">Identity and local network address</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Robot name</label>
                <input
                  type="text"
                  value={formData.robotName}
                  onChange={(e) => handleChange('robotName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60"
                  placeholder="e.g., AXEL-01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Robot IP address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.robotIp}
                    onChange={(e) => handleChange('robotIp', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60"
                    placeholder="e.g., 192.168.1.100"
                  />
                  <button
                    onClick={() => handleTestConnection(`http://${formData.robotIp}:8080`, 'Camera Stream')}
                    className="axel-button-secondary px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <BeakerIcon className="w-4 h-4" aria-hidden />
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Configuration */}
        <div className="space-y-6">
          <div className="axel-surface rounded-2xl border border-slate-700/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] flex items-center justify-center">
                <SignalIcon className="w-5 h-5 text-slate-200" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[color:var(--axel-text)] leading-tight">Network</h2>
                <p className="text-xs axel-muted">ROSBridge and camera endpoints</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">ROSBridge WebSocket URL</label>
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
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono text-sm"
                    placeholder="ws://192.168.1.100:9090"
                  />
                  <button
                    onClick={() => handleTestConnection(formData.rosUrl, 'ROS Bridge')}
                    className="axel-button-secondary px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <BeakerIcon className="w-4 h-4" aria-hidden />
                    Test
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Normalized: <span className="font-mono text-slate-200">{effectiveRosUrl}</span>
                </p>
                <p className="text-xs axel-muted mt-1">WebSocket URL for rosbridge communication.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">MJPEG camera stream URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cameraUrl}
                    onChange={(e) => handleChange('cameraUrl', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono text-sm"
                    placeholder="http://192.168.1.100:8080/?action=stream"
                  />
                  <button
                    onClick={() => handleTestConnection(formData.cameraUrl, 'MJPEG Camera')}
                    className="axel-button-secondary px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <VideoCameraIcon className="w-4 h-4" aria-hidden />
                    Test
                  </button>
                </div>
                <p className="text-xs axel-muted mt-1">HTTP URL to your MJPEG stream (e.g. `/?action=stream`).</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleSave}
          className="axel-button-primary px-6 py-3 rounded-2xl font-extrabold text-white inline-flex items-center justify-center gap-2"
        >
          <ArrowDownTrayIcon className="w-5 h-5" aria-hidden />
          Save
        </button>
        <button
          onClick={handleLoad}
          className="axel-button-secondary px-6 py-3 rounded-2xl font-extrabold inline-flex items-center justify-center gap-2"
        >
          <ArrowUpTrayIcon className="w-5 h-5" aria-hidden />
          Load
        </button>
      </div>

      {/* Configuration Preview */}
      <div className="axel-surface rounded-2xl border border-slate-700/60 p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardDocumentIcon className="w-5 h-5 text-slate-200" aria-hidden />
            <h3 className="text-lg font-extrabold text-[color:var(--axel-text)]">Summary</h3>
          </div>
          <button onClick={copyConfig} className="axel-button-secondary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2">
            <ClipboardDocumentIcon className="w-4 h-4" aria-hidden />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[color:var(--axel-border)] bg-[var(--axel-surface-soft)] p-4">
            <p className="text-xs axel-muted mb-1">Robot</p>
            <p className="text-[color:var(--axel-text)] font-semibold">{formData.robotName}</p>
            <p className="text-xs axel-muted mt-2">IP</p>
            <p className="text-[color:var(--axel-text)] font-mono text-sm">{formData.robotIp}</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--axel-border)] bg-[var(--axel-surface-soft)] p-4">
            <p className="text-xs axel-muted mb-1">ROS URL</p>
            <p className="text-[color:var(--axel-text)] font-mono text-sm break-all">{formData.rosUrl}</p>
            <p className="text-xs axel-muted mt-2">Camera URL</p>
            <p className="text-[color:var(--axel-text)] font-mono text-sm break-all">{formData.cameraUrl}</p>
          </div>
        </div>
      </div>

      {/* Diagnostics (embedded) */}
      <div className="axel-surface rounded-xl border border-slate-700/60 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BeakerIcon className="w-5 h-5 text-slate-200" aria-hidden />
              <h2 className="text-2xl font-extrabold text-[color:var(--axel-text)]">Diagnostics</h2>
            </div>
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
