import React, { useState, createContext, useContext, ReactNode } from 'react';
import { AppConfig, RobotMode } from '../types';

interface AppStoreContextType {
  config: AppConfig;
  updateConfig: (config: AppConfig) => void;
  saveConfig: () => void;
  loadConfig: () => void;
  // Offline mode joint state tracking
  jointStates: Record<string, number>;
  updateJointState: (jointName: string, angle: number) => void;
  updateJointStates: (states: Record<string, number>) => void;
  resetJointStates: () => void;
  // Robot mode management
  currentMode: RobotMode;
  setCurrentMode: (mode: RobotMode) => void;
  saveModePreference: () => void;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

const DEFAULT_CONFIG: AppConfig = {
  rosUrl: 'ws://10.151.21.13:9090',
  cameraUrl: 'http://localhost:8080/?action=stream',
  robotIp: '10.151.21.13',
  robotName: 'AXEL',
};

interface AppStoreProviderProps {
  children: ReactNode;
}

export const AppStoreProvider: React.FC<AppStoreProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('axelConfig');
    const loadedConfig = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    
    // Migration: Update AXEL-01 to AXEL
    if (loadedConfig.robotName === 'AXEL-01') {
      loadedConfig.robotName = 'AXEL';
      localStorage.setItem('axelConfig', JSON.stringify(loadedConfig));
    }
    
    return loadedConfig;
  });

  const [jointStates, setJointStates] = useState<Record<string, number>>({});

  const [currentMode, setCurrentMode] = useState<RobotMode>(() => {
    const saved = localStorage.getItem('axelRobotMode');
    return (saved as RobotMode) || 'GENERAL';
  });

  const updateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  const saveConfig = () => {
    localStorage.setItem('axelConfig', JSON.stringify(config));
  };

  const loadConfig = () => {
    const saved = localStorage.getItem('axelConfig');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  };

  const updateJointState = (jointName: string, angle: number) => {
    setJointStates(prev => ({
      ...prev,
      [jointName]: angle,
    }));
  };

  const updateJointStates = (states: Record<string, number>) => {
    setJointStates(prev => ({
      ...prev,
      ...states,
    }));
  };

  const resetJointStates = () => {
    setJointStates({});
  };

  const handleSetCurrentMode = (mode: RobotMode) => {
    setCurrentMode(mode);
  };

  const saveModePreference = () => {
    localStorage.setItem('axelRobotMode', currentMode);
  };

  return (
    <AppStoreContext.Provider 
      value={{ 
        config, 
        updateConfig, 
        saveConfig, 
        loadConfig,
        jointStates,
        updateJointState,
        updateJointStates,
        resetJointStates,
        currentMode,
        setCurrentMode: handleSetCurrentMode,
        saveModePreference,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return context;
};
