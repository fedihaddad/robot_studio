/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ROS_BRIDGE_URL: string;
  readonly VITE_SERVO_COMMAND_TOPIC: string;
  readonly VITE_SERVO_STATE_TOPIC: string;
  readonly VITE_EMERGENCY_STOP_TOPIC: string;
  readonly VITE_ROBOT_STATE_TOPIC: string;
  readonly VITE_SERVO_COMMAND_MSG_TYPE: string;
  readonly VITE_SERVO_STATE_MSG_TYPE: string;
  readonly VITE_ROBOT_STATE_MSG_TYPE: string;
  readonly VITE_RASPBERRY_PI_HOST: string;
  readonly VITE_RASPBERRY_PI_PORT: string;
  readonly VITE_CAMERA_STREAM_URL: string;
  readonly VITE_CAMERA_ENABLED: string;
  readonly VITE_SIMULATION_MODE: string;
  readonly VITE_SIMULATION_SERVO_DELAY: string;
  readonly VITE_HEAD_SERVO_COUNT: string;
  readonly VITE_ARM_SERVO_COUNT: string;
  readonly VITE_SERVO_MIN_ANGLE: string;
  readonly VITE_SERVO_MAX_ANGLE: string;
  readonly VITE_SERVO_DEFAULT_ANGLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
