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
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          🤖 AXEL Dashboard
        </h1>
        <p className="text-gray-400 text-lg">Real-time monitoring and intelligent control</p>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* ROS Connection */}
        <div className={`relative overflow-hidden rounded-xl border ${
          rosState.isConnected 
            ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50' 
            : 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-700/50'
        } p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-${rosState.isConnected ? 'green' : 'red'}-500/20`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">📡 ROS Connection</p>
              <p className={`text-2xl font-bold mt-2 ${rosState.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {rosState.isConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{rosState.rosUrl}</p>
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
            ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/50' 
            : 'bg-gradient-to-br from-gray-700/30 to-gray-800/30 border-gray-700/50'
        } p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">📷 Camera Feed</p>
              <p className={`text-2xl font-bold mt-2 ${cameraConnected ? 'text-blue-400' : 'text-gray-400'}`}>
                {cameraConnected ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{cameraConnected ? 'Stream active' : 'No feed'}</p>
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
        <div className="bg-gradient-to-r from-red-900/40 to-rose-900/40 border border-red-700/50 rounded-xl p-6 backdrop-blur-sm">
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
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-cyan-500/50'
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
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
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
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
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
      <div className="bg-gradient-to-br from-red-900/20 to-rose-900/20 border border-red-700/50 rounded-xl p-6 backdrop-blur-sm">
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
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-xl p-6 backdrop-blur-sm text-center hover:shadow-lg hover:shadow-blue-500/20 transition-all">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            15
          </div>
          <p className="text-gray-400 text-sm font-medium">Head Servos</p>
          <p className="text-xs text-gray-500 mt-1">Motors</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-xl p-6 backdrop-blur-sm text-center hover:shadow-lg hover:shadow-purple-500/20 transition-all">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            10
          </div>
          <p className="text-gray-400 text-sm font-medium">Arm Servos</p>
          <p className="text-xs text-gray-500 mt-1">Motors</p>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6 backdrop-blur-sm text-center hover:shadow-lg hover:shadow-green-500/20 transition-all">
          <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            25
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Servos</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
