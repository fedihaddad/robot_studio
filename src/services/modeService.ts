import { RobotMode } from '../types';

/**
 * Service for managing robot mode commands
 * Handles publishing mode changes to ROS and managing mode state
 */
export class ModeService {
  private rosBridge: any;
  private modePublisher: any;
  private currentMode: RobotMode = 'GENERAL';

  constructor(rosBridge: any) {
    this.rosBridge = rosBridge;
    this.initializeModePublisher();
  }

  /**
   * Initialize ROS publisher for mode commands
   */
  private initializeModePublisher() {
    if (!this.rosBridge || !this.rosBridge.ros) {
      console.warn('ROS Bridge not initialized for ModeService');
      return;
    }

    try {
      // Create a simple string topic publisher for mode commands
      // The robot will subscribe to /robot/mode_command topic
      this.modePublisher = new this.rosBridge.ros.Topic({
        ros: this.rosBridge.ros,
        name: '/robot/mode_command',
        messageType: 'std_msgs/String',
      });

      console.log('Mode publisher initialized on /robot/mode_command');
    } catch (error) {
      console.error('Error initializing mode publisher:', error);
    }
  }

  /**
   * Publish a mode change command to the robot
   */
  public async publishModeCommand(mode: RobotMode): Promise<boolean> {
    try {
      if (!this.modePublisher) {
        console.warn('Mode publisher not initialized, caching mode locally');
        this.currentMode = mode;
        return false;
      }

      const message = new this.rosBridge.ros.Message({
        data: mode,
      });

      this.modePublisher.publish(message);
      this.currentMode = mode;
      
      console.log(`Mode changed to: ${mode}`);
      return true;
    } catch (error) {
      console.error('Error publishing mode command:', error);
      return false;
    }
  }

  /**
   * Get current mode (local state)
   */
  public getCurrentMode(): RobotMode {
    return this.currentMode;
  }

  /**
   * Set current mode locally (when publishing fails)
   */
  public setCurrentMode(mode: RobotMode) {
    this.currentMode = mode;
  }

  /**
   * Disconnect and cleanup
   */
  public disconnect() {
    if (this.modePublisher) {
      this.modePublisher.unsubscribe();
    }
  }
}
