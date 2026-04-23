import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  StopCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import EmergencyStopButton from '../components/shared/EmergencyStopButton';
import { RobotState, ROSState } from '../types';

interface DashboardPageProps {
  rosState: ROSState;
  cameraConnected: boolean;
  onEmergencyStop: (active: boolean) => void;
  /** When defined, E-stop UI mirrors ROS `std_msgs/Bool` (see `VITE_EMERGENCY_STOP_STATE_TOPIC`). */
  emergencyStopRemote?: boolean;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  rosState,
  cameraConnected,
  onEmergencyStop,
  emergencyStopRemote,
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
    setRobotState((prev) => ({
      ...prev,
      connected: rosState.isConnected,
    }));
  }, [rosState.isConnected]);

  useEffect(() => {
    if (emergencyStopRemote !== undefined) {
      setRobotState((prev) => ({ ...prev, emergency_stop: emergencyStopRemote }));
    }
  }, [emergencyStopRemote]);

  const estopActive =
    emergencyStopRemote !== undefined ? emergencyStopRemote : robotState.emergency_stop;

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'var(--axel-bg)' }}>
      <div className="mb-8">
        <h1 className="text-4xl axel-title axel-gradient-text mb-2">AXEL Dashboard</h1>
        <p className="axel-muted text-base">Real-time monitoring and intelligent control</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div
          className={`relative overflow-hidden rounded-xl border ${
            rosState.isConnected
              ? 'bg-emerald-900/10 border-emerald-500/35'
              : 'bg-rose-900/10 border-rose-500/35'
          } p-6 transition-all duration-300`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="axel-muted text-sm font-medium">ROS Connection</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  rosState.isConnected ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {rosState.isConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-xs axel-muted mt-1 truncate">{rosState.rosUrl}</p>
              {!rosState.isConnected && (
                <p className="mt-3 text-xs axel-muted flex items-start gap-2">
                  <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" aria-hidden />
                  <span>Reconnect from the status banner or Connection Center.</span>
                </p>
              )}
            </div>
            <div
              className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                rosState.isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {rosState.isConnected ? (
                <CheckCircleIcon className="w-8 h-8" aria-hidden />
              ) : (
                <XCircleIcon className="w-8 h-8" aria-hidden />
              )}
            </div>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-xl border ${
            cameraConnected
              ? 'bg-cyan-900/10 border-cyan-500/35'
              : 'bg-slate-800/40 border-slate-600/60'
          } p-6 transition-all duration-300`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="axel-muted text-sm font-medium">Camera Feed</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  cameraConnected ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {cameraConnected ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs axel-muted mt-1">
                {cameraConnected ? 'Stream active' : 'No feed'}
              </p>
            </div>
            <div
              className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                cameraConnected ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {cameraConnected ? (
                <VideoCameraIcon className="w-8 h-8" aria-hidden />
              ) : (
                <VideoCameraSlashIcon className="w-8 h-8" aria-hidden />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="axel-card p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-amber-400 shrink-0" aria-hidden />
            Power Supply
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-600/20 rounded-lg border border-green-700/50">
              <span className="text-gray-300 text-sm font-medium">Main Power</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm font-semibold">
                <CheckCircleIcon className="w-4 h-4" aria-hidden />
                Connected
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

        <div className="axel-card p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5 text-slate-300 shrink-0" aria-hidden />
            System Status
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">Robot Mode</span>
              <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm font-semibold capitalize">
                {robotState.mode}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">Motor Status</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm font-semibold">
                <CheckCircleIcon className="w-4 h-4" aria-hidden />
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-400 text-sm">All Systems</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm font-semibold">
                <CheckCircleIcon className="w-4 h-4" aria-hidden />
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-rose-900/10 border border-rose-500/35 rounded-xl p-6">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <StopCircleIcon className="w-5 h-5 text-red-400 shrink-0" aria-hidden />
              Emergency Stop
            </h3>
            <p className="text-sm text-gray-400">Press to halt all motors immediately</p>
            {emergencyStopRemote !== undefined && (
              <p className="text-xs axel-muted mt-2 flex items-center gap-1.5">
                <InformationCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                State synced from ROS
              </p>
            )}
          </div>
          <EmergencyStopButton
            active={estopActive}
            onToggle={(active) => {
              setRobotState((prev) => ({ ...prev, emergency_stop: active }));
              onEmergencyStop(active);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">15</div>
          <p className="axel-muted text-sm font-medium">Head servos</p>
          <p className="text-xs axel-muted mt-1">Face / head</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">3</div>
          <p className="axel-muted text-sm font-medium">Neck servos</p>
          <p className="text-xs axel-muted mt-1">Motors</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">20</div>
          <p className="axel-muted text-sm font-medium">Arm servos</p>
          <p className="text-xs axel-muted mt-1">10 per hand</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">38</div>
          <p className="axel-muted text-sm font-medium">Total servos</p>
          <p className="text-xs axel-muted mt-1">Active</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
