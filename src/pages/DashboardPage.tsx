import React, { useState, useEffect } from 'react';
import StatusIndicator from '../components/shared/StatusIndicator';
import EmergencyStopButton from '../components/shared/EmergencyStopButton';
import { RobotState, ROSState } from '../../types';

interface DashboardPageProps {
  rosState: ROSState;
  cameraConnected: boolean;
  onEmergencyStop: (active: boolean) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  rosState,
  cameraConnected,
  onEmergencyStop,
}) => {
  const [robotState, setRobotState] = useState<RobotState>({
    connected: rosState.isConnected,
    battery: 85,
    temperature: 45,
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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">AXEL Dashboard</h1>
        <p className="text-gray-400">Real-time monitoring and control</p>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-6">
        <StatusIndicator
          label="ROS Connection"
          status={rosState.isConnected ? 'connected' : 'disconnected'}
          value={rosState.rosUrl}
        />
        <StatusIndicator
          label="Camera Feed"
          status={cameraConnected ? 'connected' : 'disconnected'}
        />
      </div>

      {/* System Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Robot Mode</span>
            <span className="font-semibold text-blue-400 capitalize">{robotState.mode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Power Status</span>
            <span className="font-semibold text-green-400">Mains Connected</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">All Systems</span>
            <span className="font-semibold text-green-400">✓ Operational</span>
          </div>
        </div>
      </div>

      {/* Emergency Control */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Safety Control</h2>
        <EmergencyStopButton
          active={robotState.emergency_stop}
          onToggle={(active) => {
            setRobotState(prev => ({ ...prev, emergency_stop: active }));
            onEmergencyStop(active);
          }}
        />
        <p className="text-xs text-gray-500 mt-3">
          Press to activate emergency stop. Robot will halt all motors immediately.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-400">15</p>
          <p className="text-sm text-gray-400">Head Servos</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-400">10</p>
          <p className="text-sm text-gray-400">Arm Servos</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-400">25</p>
          <p className="text-sm text-gray-400">Total Servos</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
