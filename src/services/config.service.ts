/**
 * Configuration Utility
 * Centralized configuration for environment variables and settings
 */

export interface AppConfig {
  // ROS Configuration
  ros: {
    bridgeUrl: string;
    topics: {
      servoCommand: string;
      servoState: string;
      emergencyStop: string;
      robotState: string;
    };
    messageTypes: {
      servoCommand: string;
      servoState: string;
      robotState: string;
    };
  };

  // Raspberry Pi Configuration
  raspberryPi: {
    host: string;
    port: number;
  };

  // Camera Configuration
  camera: {
    streamUrl: string;
    enabled: boolean;
  };

  // Simulation Configuration
  simulation: {
    mode: boolean;
    servoDelay: number;
  };

  // Servo Configuration
  servos: {
    headCount: number;
    armCount: number;
    minAngle: number;
    maxAngle: number;
    defaultAngle: number;
  };
}

class Configuration {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      ros: {
        bridgeUrl: import.meta.env.VITE_ROS_BRIDGE_URL || 'ws://  :9090',
        topics: {
          servoCommand: import.meta.env.VITE_SERVO_COMMAND_TOPIC || '/servo/cmd',
          servoState: import.meta.env.VITE_SERVO_STATE_TOPIC || '/servo/state',
          emergencyStop: import.meta.env.VITE_EMERGENCY_STOP_TOPIC || '/emergency/stop',
          robotState: import.meta.env.VITE_ROBOT_STATE_TOPIC || '/robot/state',
        },
        messageTypes: {
          servoCommand: import.meta.env.VITE_SERVO_COMMAND_MSG_TYPE || 'std_msgs/Float64MultiArray',
          servoState: import.meta.env.VITE_SERVO_STATE_MSG_TYPE || 'sensor_msgs/JointState',
          robotState: import.meta.env.VITE_ROBOT_STATE_MSG_TYPE || 'std_msgs/String',
        },
      },
      raspberryPi: {
        host: import.meta.env.VITE_RASPBERRY_PI_HOST || '192.168.1.100',
        port: parseInt(import.meta.env.VITE_RASPBERRY_PI_PORT || '8080'),
      },
      camera: {
        streamUrl: import.meta.env.VITE_CAMERA_STREAM_URL || 'http://192.168.1.100:8080/?action=stream',
        enabled: import.meta.env.VITE_CAMERA_ENABLED === 'true',
      },
      simulation: {
        mode: import.meta.env.VITE_SIMULATION_MODE === 'true',
        servoDelay: parseInt(import.meta.env.VITE_SIMULATION_SERVO_DELAY || '100'),
      },
      servos: {
        headCount: parseInt(import.meta.env.VITE_HEAD_SERVO_COUNT || '15'),
        armCount: parseInt(import.meta.env.VITE_ARM_SERVO_COUNT || '10'),
        minAngle: parseInt(import.meta.env.VITE_SERVO_MIN_ANGLE || '0'),
        maxAngle: parseInt(import.meta.env.VITE_SERVO_MAX_ANGLE || '180'),
        defaultAngle: parseInt(import.meta.env.VITE_SERVO_DEFAULT_ANGLE || '90'),
      },
    };
  }

  /**
   * Get the entire configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get ROS configuration
   */
  getRosConfig() {
    return this.config.ros;
  }

  /**
   * Get Raspberry Pi configuration
   */
  getRaspberryPiConfig() {
    return this.config.raspberryPi;
  }

  /**
   * Get camera configuration
   */
  getCameraConfig() {
    return this.config.camera;
  }

  /**
   * Get simulation configuration
   */
  getSimulationConfig() {
    return this.config.simulation;
  }

  /**
   * Get servo configuration
   */
  getServoConfig() {
    return this.config.servos;
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(partial: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...partial,
    };
  }

  /**
   * Check if simulation mode is enabled
   */
  isSimulationEnabled(): boolean {
    return this.config.simulation.mode;
  }

  /**
   * Get ROS URL for WebSocket connection
   */
  getRosUrl(): string {
    return this.config.ros.bridgeUrl;
  }

  /**
   * Get camera stream URL
   */
  getCameraUrl(): string {
    return this.config.camera.streamUrl;
  }

  /**
   * Get formatted Raspberry Pi URL
   */
  getRaspberryPiUrl(): string {
    return `http://${this.config.raspberryPi.host}:${this.config.raspberryPi.port}`;
  }
}

// Export singleton instance
export const config = new Configuration();

export default Configuration;
