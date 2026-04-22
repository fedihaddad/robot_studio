import React, { useState, useEffect } from 'react';
import StatusIndicator from '../components/shared/StatusIndicator';
import EmergencyStopButton from '../components/shared/EmergencyStopButton';
import { RobotState, ROSState } from '../../types';

interface DashboardPageProps {
  rosState: ROSState;
  cameraConnected: boolean;
  onEmergencyStop: (active: boolean) => void;
  onReconnectROS: () => void;
  isReconnecting: boolean;
  onModeChange?: (mode: string) => Promise<boolean>;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  rosState,
  cameraConnected,
  onEmergencyStop,
  onReconnectROS,
  isReconnecting,
  onModeChange,
}) => {
  const [robotState, setRobotState] = useState<RobotState>({
    connected: rosState.isConnected,
    battery: 0,
    temperature: 0,
    mode: 'idle',
    emergency_stop: false,
  });

  useEffect(() => {
    setRobotState(prev => ({
      ...prev,
      connected: rosState.isConnected,
    }));
  }, [rosState.isConnected]);

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'var(--axel-bg)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl axel-title axel-gradient-text mb-2">
          AXEL Dashboard
        </h1>
        <p className="axel-muted text-base">Real-time monitoring and intelligent control</p>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* ROS Connection */}
        <div className={`relative overflow-hidden rounded-xl border ${
          rosState.isConnected 
            ? 'bg-emerald-900/10 border-emerald-500/35' 
            : 'bg-rose-900/10 border-rose-500/35'
        } p-6 transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="axel-muted text-sm font-medium">ROS Connection</p>
              <p className={`text-2xl font-bold mt-2 ${rosState.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {rosState.isConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-xs axel-muted mt-1">{rosState.rosUrl}</p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              rosState.isConnected 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {rosState.isConnected ? '✓' : '✕'}
            </div>
          </div>
        </div>

        {/* Camera Feed */}
        <div className={`relative overflow-hidden rounded-xl border ${
          cameraConnected 
            ? 'bg-cyan-900/10 border-cyan-500/35' 
            : 'bg-slate-800/40 border-slate-600/60'
        } p-6 transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="axel-muted text-sm font-medium">Camera Feed</p>
              <p className={`text-2xl font-bold mt-2 ${cameraConnected ? 'text-blue-400' : 'text-gray-400'}`}>
                {cameraConnected ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs axel-muted mt-1">{cameraConnected ? 'Stream active' : 'No feed'}</p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              cameraConnected 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {cameraConnected ? '●' : '○'}
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Alert */}
      {!rosState.isConnected && (
        <div className="bg-rose-900/15 border border-rose-500/35 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">ROS Connection Lost</h2>
              <p className="text-sm text-gray-300">
                Reconnect directly without restarting the app.
              </p>
            </div>
            <button
              onClick={onReconnectROS}
              disabled={isReconnecting}
              className={`px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                isReconnecting
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                  : 'axel-button-primary text-white'
              }`}
            >
              {isReconnecting ? '🔄 Reconnecting...' : '🔗 Reconnect ROS'}
            </button>
          </div>
          {rosState.error && (
            <p className="text-xs text-red-300 mt-3 break-all">Error: {rosState.error}</p>
          )}
        </div>
      )}

      {/* System Health */}
      <div className="grid grid-cols-2 gap-6">
        {/* Power Status */}
        <div className="axel-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">⚡ Power Supply</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-600/20 rounded-lg border border-green-700/50">
              <span className="text-gray-300 text-sm font-medium">Main Power</span>
              <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm font-semibold">
                ✓ Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">Voltage</span>
              <span className="text-green-400 font-semibold">230V AC</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">Power Status</span>
              <span className="text-green-400 font-semibold">Stable</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="axel-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">🔧 System Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">Robot Mode</span>
              <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm font-semibold capitalize">
                {robotState.mode}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">Motor Status</span>
              <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm font-semibold">
                ✓ Operational
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">All Systems</span>
              <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm font-semibold">
                ✓ Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Control */}
      <div className="bg-rose-900/10 border border-rose-500/35 rounded-xl p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">🛑 Emergency Stop</h3>
            <p className="text-sm text-gray-400">
              Press to halt all motors immediately
            </p>
          </div>
          <EmergencyStopButton
            active={robotState.emergency_stop}
            onToggle={(active) => {
              setRobotState(prev => ({ ...prev, emergency_stop: active }));
              onEmergencyStop(active);
            }}
          />
        </div>
      </div>



      {/* Servo Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">
            15
          </div>
          <p className="axel-muted text-sm font-medium">Head Servos</p>
          <p className="text-xs axel-muted mt-1">Motors</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">
            10
          </div>
          <p className="axel-muted text-sm font-medium">Arm Servos</p>
          <p className="text-xs axel-muted mt-1">Motors</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">
            25
          </div>
          <p className="axel-muted text-sm font-medium">Total Servos</p>
          <p className="text-xs axel-muted mt-1">Active</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
