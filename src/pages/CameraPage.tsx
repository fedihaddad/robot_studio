import React, { useEffect, useMemo, useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/solid';
import { ROSService } from '../services/ros.service';

interface CameraPageProps {
  cameraUrl: string;
  /** Reports whether the stream is reachable (img load success). */
  onConnectionChange?: (connected: boolean) => void;
  rosService?: ROSService | null;
  rosConnected?: boolean;
}

const CameraPage: React.FC<CameraPageProps> = ({
  cameraUrl,
  onConnectionChange,
  rosService,
  rosConnected = false,
}) => {
  const [streamActive, setStreamActive] = useState(true);
  // Start offline until we successfully load the first frame.
  const [streamReachable, setStreamReachable] = useState<boolean>(false);
  const [streamResolution, setStreamResolution] = useState<{ width: number; height: number } | null>(null);
  const [selectedVisionMode, setSelectedVisionMode] = useState<string | null>(null);
  const [visionToast, setVisionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const streamSrc = useMemo(() => {
    // Bust cache to force reload on retry (mjpeg endpoints usually ignore query, but safe).
    const stamp = Date.now();
    const sep = cameraUrl.includes('?') ? '&' : '?';
    return `${cameraUrl}${sep}t=${stamp}`;
  }, [cameraUrl, streamActive]);

  // When URL (or stream on/off) changes, treat it as offline until we load again.
  useEffect(() => {
    if (!streamActive) return;
    setStreamReachable(false);
    setStreamResolution(null);
  }, [streamSrc, streamActive]);

  useEffect(() => {
    const connected = streamActive && streamReachable;
    onConnectionChange?.(connected);
  }, [onConnectionChange, streamActive, streamReachable]);

  useEffect(() => {
    if (!streamActive || !streamReachable) {
      setStreamResolution(null);
    }
  }, [streamActive, streamReachable]);

  const publishVisionMode = (mode: string) => {
    if (!rosConnected || !rosService?.isConnected()) {
      setVisionToast({ type: 'error', message: 'ROS not connected (start rosbridge on Ubuntu).' });
      return;
    }
    try {
      rosService.publish('/axel/vision/mode', 'std_msgs/String', { data: mode });
      setSelectedVisionMode(mode);
      setVisionToast({ type: 'success', message: `Vision mode: ${mode.replaceAll('_', ' ')}` });
    } catch {
      setVisionToast({ type: 'error', message: 'Failed to publish vision mode.' });
    } finally {
      window.setTimeout(() => setVisionToast(null), 1800);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'var(--axel-bg)', color: 'var(--axel-text)' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center">
            <VideoCameraIcon className="w-7 h-7 text-cyan-300" aria-hidden />
          </div>
          <h1 className="text-5xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Camera &amp; Vision
            </span>
          </h1>
        </div>
        <p className="axel-muted text-lg">Real-time camera feed and vision analysis</p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Camera Feed - Takes up 2/3 */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Camera Stream */}
          <div className="relative rounded-xl overflow-hidden border border-cyan-700/25 aspect-video backdrop-blur-sm shadow-2xl" style={{ background: 'var(--axel-surface)' }}>
            <img
              src={streamActive ? streamSrc : ''}
              alt="Robot Camera"
              className="w-full h-full object-cover"
              onLoad={(e) => {
                setStreamReachable(true);
                const img = e.currentTarget;
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
                  setStreamResolution({ width: w, height: h });
                }
              }}
              onError={(e) => {
                setStreamReachable(false);
                setStreamResolution(null);
              }}
            />

            {/* Live Indicator */}
            <div
              className="absolute top-4 left-4 flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-lg border"
              style={{ background: 'rgba(15, 23, 42, 0.55)', borderColor: 'var(--axel-border)', color: 'var(--axel-text)' }}
            >
              <span
                className={`w-3 h-3 rounded-full shadow-lg ${
                  streamActive && streamReachable
                    ? 'bg-emerald-400 animate-pulse shadow-emerald-500/40'
                    : 'bg-rose-400 shadow-rose-500/30'
                }`}
              />
              <span className="font-bold text-sm">
                {streamActive ? (streamReachable ? 'LIVE STREAM' : 'STREAM OFFLINE') : 'STREAM PAUSED'}
              </span>
            </div>

            {/* Camera Stats Overlay */}
            <div
              className="absolute bottom-4 right-4 flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-lg border text-xs"
              style={{ background: 'rgba(15, 23, 42, 0.55)', borderColor: 'var(--axel-border)', color: 'var(--axel-text)' }}
            >
              <span className="axel-muted">Resolution</span>
              <span className="font-bold">
                {streamActive && streamReachable && streamResolution
                  ? `${streamResolution.width}×${streamResolution.height}`
                  : '—'}
              </span>
            </div>

            {/* Recording Indicator */}
            {/* Intentionally no "RECORDING" label: this page is only viewing the stream. */}
          </div>

          {/* Camera Controls Panel */}
          <div className="axel-surface rounded-xl p-6 backdrop-blur-sm" style={{ borderColor: 'var(--axel-border)' }}>
            <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--axel-text)' }}>
              <span>⚙️</span> Camera Controls
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStreamActive(!streamActive)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    streamActive
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'axel-button-secondary'
                  }`}
                >
                  {streamActive ? '⏹️ Stop Stream' : '▶️ Start Stream'}
                </button>
                <button className="axel-button-secondary px-4 py-2 rounded-lg font-medium transition-all">
                  📸 Screenshot
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Vision Features */}
        <div className="flex flex-col gap-4">
          {visionToast && (
            <div
              className={`rounded-xl border p-3 text-xs font-semibold ${
                visionToast.type === 'success'
                  ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-900/20 border-rose-500/30 text-rose-200'
              }`}
            >
              {visionToast.message}
            </div>
          )}

          {/* Stream Info Card */}
          <div className="axel-surface rounded-xl p-6 backdrop-blur-sm border" style={{ borderColor: 'var(--axel-border)' }}>
            <h3 className="text-lg font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--axel-text)' }}>
              <span className="text-cyan-600 dark:text-cyan-300">ℹ️</span> Stream Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="axel-muted">Status</span>
                <span
                  className={`font-semibold ${
                    !streamActive
                      ? 'axel-muted'
                      : streamReachable
                        ? 'text-emerald-600 dark:text-emerald-300'
                        : 'text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {!streamActive ? '⏸ Paused' : streamReachable ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="axel-muted">Reachable</span>
                <span className={`font-semibold ${streamActive && streamReachable ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                  {streamActive ? (streamReachable ? '🟢 Yes' : '🔴 No') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="axel-muted">Resolution</span>
                <span className="font-semibold" style={{ color: 'var(--axel-text)' }}>
                  {streamActive && streamReachable && streamResolution
                    ? `${streamResolution.width}×${streamResolution.height}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Vision Modes */}
          <div className="axel-surface rounded-xl p-6 backdrop-blur-sm border" style={{ borderColor: 'var(--axel-border)' }}>
            <h3 className="text-lg font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--axel-text)' }}>
              <span className="text-cyan-600 dark:text-cyan-300">🔍</span> Vision Modes
            </h3>
            <div className="space-y-2">
              <button
                disabled={!rosConnected}
                onClick={() => publishVisionMode('object_detection')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                  selectedVisionMode === 'object_detection'
                    ? 'axel-button-primary text-white border-cyan-500/40'
                    : 'axel-button-secondary'
                } ${!rosConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                👁️ Object Detection
              </button>
              <button
                disabled={!rosConnected}
                onClick={() => publishVisionMode('face_recognition')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                  selectedVisionMode === 'face_recognition'
                    ? 'axel-button-primary text-white border-cyan-500/40'
                    : 'axel-button-secondary'
                } ${!rosConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                😊 Face Recognition
              </button>
              <button
                disabled={!rosConnected}
                onClick={() => publishVisionMode('face_tracking')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                  selectedVisionMode === 'face_tracking'
                    ? 'axel-button-primary text-white border-cyan-500/40'
                    : 'axel-button-secondary'
                } ${!rosConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🎯 Face Tracking
              </button>
              <button
                disabled={!rosConnected}
                onClick={() => publishVisionMode('hand_detection')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                  selectedVisionMode === 'hand_detection'
                    ? 'axel-button-primary text-white border-cyan-500/40'
                    : 'axel-button-secondary'
                } ${!rosConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ✋ Hand Detection
              </button>
              <button
                disabled={!rosConnected}
                onClick={() => publishVisionMode('arm_detection')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                  selectedVisionMode === 'arm_detection'
                    ? 'axel-button-primary text-white border-cyan-500/40'
                    : 'axel-button-secondary'
                } ${!rosConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                💪 Arm Detection
              </button>
            </div>
          </div>

          {/* Performance card removed: values were not real. */}
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
