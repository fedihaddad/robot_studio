import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './shared/Sidebar';
import DashboardPage from '../pages/DashboardPage';
import CameraPage from '../pages/CameraPage';
import ServoPage from '../pages/ServoPage';
import ManualServoControlPage from '../pages/ManualServoControlPage';
import Visualization3DPage from '../pages/Visualization3DPage';
import RosMonitorPage from '../pages/RosMonitorPage';
import SettingsPage from '../pages/SettingsPage';
import { useAppStore } from '../store/appStore';
import { ServoCommand, ROS2Topic, ROSState } from '../types';
import { ROSService } from '../services/ros.service';

const App: React.FC = () => {
  const { config, updateConfig, saveConfig, loadConfig } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [cameraConnected, setCameraConnected] = useState(true);
  const [joints, setJoints] = useState<Record<number, number>>({});
  const [rosState, setRosState] = useState<ROSState>({
    isConnected: false,
    rosUrl: config.rosUrl,
    error: null,
  });
  const [topics, setTopics] = useState<ROS2Topic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const rosServiceRef = useRef<ROSService | null>(null);

  // Initialize ROS connection
  useEffect(() => {
    const initROS = async () => {
      try {
        rosServiceRef.current = new ROSService(config.rosUrl);
        await rosServiceRef.current.connect();
        setRosState({
          isConnected: true,
          rosUrl: config.rosUrl,
          error: null,
        });

        // Subscribe to joint states
        rosServiceRef.current.subscribeToJointStates((joints) => {
          setJoints(joints);
        });

        // Load topics
        setIsLoadingTopics(true);
        const topicList = await rosServiceRef.current.getTopics();
        setTopics(topicList);
        setIsLoadingTopics(false);
      } catch (error) {
        setRosState(prev => ({
          ...prev,
          isConnected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        }));
        setIsLoadingTopics(false);
      }
    };

    // Delay initialization to allow roslibjs to load
    const timer = setTimeout(initROS, 1000);
    return () => clearTimeout(timer);
  }, [config.rosUrl]);

  const handleServoCommand = (command: ServoCommand) => {
    if (rosServiceRef.current?.isConnected()) {
      rosServiceRef.current.publishServoCommand(command);
    }
  };

  const handleEmergencyStop = (active: boolean) => {
    if (rosServiceRef.current?.isConnected()) {
      rosServiceRef.current.publishEmergencyStop(active);
    }
  };

  const handleCameraUrlChange = (url: string) => {
    updateConfig({ ...config, cameraUrl: url });
    setCameraConnected(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <DashboardPage
            rosState={rosState}
            cameraConnected={cameraConnected}
            onEmergencyStop={handleEmergencyStop}
          />
        );
      case 2:
        return (
          <CameraPage
            cameraUrl={config.cameraUrl}
            onUrlChange={handleCameraUrlChange}
          />
        );
      case 3:
        return <ServoPage onServoCommand={handleServoCommand} />;
      case 6:
        return <Visualization3DPage joints={joints} onServoCommand={handleServoCommand} rosService={rosServiceRef.current} />;
      case 7:
        return <ManualServoControlPage joints={joints} onServoCommand={handleServoCommand} rosService={rosServiceRef.current} />;
      case 4:
        return <RosMonitorPage topics={topics} isLoading={isLoadingTopics} />;
      case 5:
        return (
          <SettingsPage
            config={config}
            onConfigChange={updateConfig}
            onSave={saveConfig}
            onLoad={loadConfig}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        rosConnected={rosState.isConnected}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Status Bar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 px-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                rosState.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-400">ROS:</span>
            <span className={rosState.isConnected ? 'text-green-400' : 'text-red-400'}>
              {rosState.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                cameraConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-400">Camera:</span>
            <span className={cameraConnected ? 'text-green-400' : 'text-red-400'}>
              {cameraConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-gray-400">Robot:</span>
            <span className="text-blue-400 font-semibold">{config.robotName}</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default App;
