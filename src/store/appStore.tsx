import React, { useState, createContext, useContext, ReactNode } from 'react';
import { AppConfig, RobotMode } from '../types';
import { Language, translate } from '../i18n';
import {
  DEFAULT_ROSBRIDGE_HOSTNAME,
  DEFAULT_ROSBRIDGE_URL,
  isLegacyRosbridgeDefault,
  normalizeRosbridgeUrl,
} from '../services/ros-endpoint.service';


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
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, fallback?: string) => string;
}


const AppStoreContext = createContext<AppStoreContextType | null>(null);



const DEFAULT_CONFIG: AppConfig = {
  rosUrl: DEFAULT_ROSBRIDGE_URL,
  cameraUrl: 'http://axel.local:8000/?action=stream',
  robotIp: DEFAULT_ROSBRIDGE_HOSTNAME,
  robotName: 'AXEL',
  passwordEnabled: false,
  password: '',
};



interface AppStoreProviderProps {

  children: ReactNode;

}



export const AppStoreProvider: React.FC<AppStoreProviderProps> = ({ children }) => {

  const [config, setConfig] = useState<AppConfig>(() => {

    const saved = localStorage.getItem('axelConfig');

    const loadedConfig = saved ? JSON.parse(saved) : DEFAULT_CONFIG;

    if (!loadedConfig.rosUrl || isLegacyRosbridgeDefault(loadedConfig.rosUrl)) {
      loadedConfig.rosUrl = DEFAULT_ROSBRIDGE_URL;
    } else {
      loadedConfig.rosUrl = normalizeRosbridgeUrl(loadedConfig.rosUrl);
    }

    if (!loadedConfig.robotIp || loadedConfig.robotIp === '10.151.21.13' || loadedConfig.robotIp === '192.168.1.100') {
      loadedConfig.robotIp = DEFAULT_ROSBRIDGE_HOSTNAME;
    }

    

    // Migration: Update AXEL-01 to AXEL

    if (loadedConfig.robotName === 'AXEL-01') {

      loadedConfig.robotName = 'AXEL';

      localStorage.setItem('axelConfig', JSON.stringify(loadedConfig));

    }

    // Migration: Update old camera URLs to axel.local:8000
    if (!loadedConfig.cameraUrl || loadedConfig.cameraUrl === 'http://localhost:8080/?action=stream' || loadedConfig.cameraUrl === 'http://axel.local:8080/?action=stream') {
      loadedConfig.cameraUrl = 'http://axel.local:8000/?action=stream';
      localStorage.setItem('axelConfig', JSON.stringify(loadedConfig));
    }

    

    return loadedConfig;

  });



  const [jointStates, setJointStates] = useState<Record<string, number>>({});



  const [currentMode, setCurrentMode] = useState<RobotMode>(() => {
    const saved = localStorage.getItem('axelRobotMode');
    return (saved as RobotMode) || 'GENERAL';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('axelLanguage');
    return saved === 'fr' ? 'fr' : 'en';
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
      const parsed = JSON.parse(saved);
      setConfig({
        ...parsed,
        rosUrl: !parsed.rosUrl || isLegacyRosbridgeDefault(parsed.rosUrl)
          ? DEFAULT_ROSBRIDGE_URL
          : normalizeRosbridgeUrl(parsed.rosUrl),
        robotIp: !parsed.robotIp || parsed.robotIp === '10.151.21.13' || parsed.robotIp === '192.168.1.100'
          ? DEFAULT_ROSBRIDGE_HOSTNAME
          : parsed.robotIp,
      });

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
    localStorage.setItem('axelRobotMode', mode);
  };

  const saveModePreference = () => {
    localStorage.setItem('axelRobotMode', currentMode);
  };

  const handleSetLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem('axelLanguage', nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  const t = (key: string, fallback?: string) => translate(language, key, fallback);


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
        language,
        setLanguage: handleSetLanguage,
        t,
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

