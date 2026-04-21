// ROS Types
export interface ROSState {
  isConnected: boolean;
  rosUrl: string;
  error: string | null;
}

export interface TopicMessage {
  topic: string;
  data: any;
  timestamp?: number;
}

// Camera Types
export interface CameraFeedConfig {
  url: string;
  enabled: boolean;
  fps?: number;
}

// Dashboard Types
export interface DashboardState {
  ros: ROSState;
  camera: CameraFeedConfig;
  isLoading: boolean;
}

// AXEL Robot Types
export interface ServoCommand {
  id: number;
  angle: number;
  speed?: number;
}

export interface ServoState {
  id: number;
  angle: number;
  temperature?: number;
  voltage?: number;
}

export interface RobotState {
  connected: boolean;
  battery: number;
  temperature: number;
  mode: 'idle' | 'manual' | 'autonomous';
  emergency_stop: boolean;
}

export interface ROS2Topic {
  name: string;
  type: string;
  latestMessage?: any;
  lastUpdate?: number;
}

export interface ServoPreset {
  name: string;
  description: string;
  positions: Map<number, number>; // servo_id -> angle
}

// Robot Mode Types
export type RobotMode = 'GENERAL' | 'SECURITY' | 'SOCIAL' | 'MANUAL';

export interface RobotModeCapabilities {
  mode: RobotMode;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  allowedTools: string[];
  allowPhysicalActions: boolean;
  allowWebSearch: boolean;
  allowVisionAnalysis: boolean;
  safetyLevel: 'low' | 'medium' | 'high';
  systemPrompt?: string;
}

// Time Synchronization Types
export interface TimeSyncState {
  dashboardTime: number;
  robotTime: number;
  offset: number;
  isSynced: boolean;
  lastSyncTime: number;
  syncStatus: 'synced' | 'syncing' | 'desynchronized';
}

export interface TimestampedCommand extends ServoCommand {
  timestamp: number;
  syncedTime: number;
}

// Inverse Kinematics Types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface IKTarget {
  position: Vector3;
  orientation?: {
    roll?: number;
    pitch?: number;
    yaw?: number;
  };
}

export interface IKSolution {
  valid: boolean;
  angles: {
    shoulder: number;
    elbow: number;
    wrist?: number;
  };
  error?: string;
  reachDistance?: number;
}

export interface ArmControlMode {
  mode: 'direct' | 'inverse_kinematics';
  selectedArm: 'left_arm' | 'right_arm';
}

// Application Configuration
export interface AppConfig {
  rosUrl: string;
  cameraUrl: string;
  robotIp: string;
  robotName: string;
}
