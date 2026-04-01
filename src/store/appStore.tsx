import React, { useState, createContext, useContext, ReactNode } from 'react';
import { AppConfig } from '../types';

interface AppStoreContextType {
  config: AppConfig;
  updateConfig: (config: AppConfig) => void;
  saveConfig: () => void;
  loadConfig: () => void;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

const DEFAULT_CONFIG: AppConfig = {
  rosUrl: 'ws://10.151.21.13:9090',
  cameraUrl: 'http://localhost:8080/?action=stream',
  robotIp: '10.151.21.13',
  robotName: 'AXEL-01',
};

interface AppStoreProviderProps {
  children: ReactNode;
}

export const AppStoreProvider: React.FC<AppStoreProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('axelConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
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

  return (
    <AppStoreContext.Provider value={{ config, updateConfig, saveConfig, loadConfig }}>
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
