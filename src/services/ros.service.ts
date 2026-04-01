/**
 * ROS Utilities and Services
 * Handles communication with ROS2 through roslib
 */

import { ServoCommand, ROS2Topic, TimestampedCommand } from '../types';
import { timeSyncService } from './timeSynchronization.service';

declare global {
  interface Window {
    ROSLIB: any;
  }
}

export class ROSService {
  private ros: any;
  private subscribers: Map<string, any> = new Map();
  private publishers: Map<string, any> = new Map();
  private topicCache: Map<string, any> = new Map();
  private isConnectedFlag: boolean = false;

  constructor(rosUrl: string) {
    if (!window.ROSLIB) {
      throw new Error('ROSLIB not loaded');
    }

    this.ros = new window.ROSLIB.Ros({
      url: rosUrl,
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ros.on('connection', () => {
        this.isConnectedFlag = true;
        resolve();
      });
      this.ros.on('error', reject);
      this.ros.on('close', () => {
        this.isConnectedFlag = false;
        reject(new Error('Connection closed'));
      });
    });
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  disconnect(): void {
    this.subscribers.forEach(sub => sub.unsubscribe());
    this.publishers.forEach(pub => pub.unsubscribe());
    if (this.ros) {
      this.ros.close();
    }
  }

  subscribe(topic: string, messageType: string, callback: (msg: any) => void): void {
    if (this.subscribers.has(topic)) {
      return;
    }

    const subscriber = new window.ROSLIB.Topic({
      ros: this.ros,
      name: topic,
      messageType: messageType,
    });

    subscriber.subscribe((msg: any) => {
      this.topicCache.set(topic, { message: msg, timestamp: Date.now() });
      callback(msg);
    });
    this.subscribers.set(topic, subscriber);
  }

  unsubscribe(topic: string): void {
    const subscriber = this.subscribers.get(topic);
    if (subscriber) {
      subscriber.unsubscribe();
      this.subscribers.delete(topic);
      this.topicCache.delete(topic);
    }
  }

  publish(topic: string, messageType: string, message: any): void {
    if (!this.publishers.has(topic)) {
      const publisher = new window.ROSLIB.Topic({
        ros: this.ros,
        name: topic,
        messageType: messageType,
      });
      this.publishers.set(topic, publisher);
    }

    const publisher = this.publishers.get(topic);
    publisher.publish(message);
  }

  // Servo-specific methods
  publishServoCommand(servo: ServoCommand): void {
    this.publish(
      '/servo/cmd',
      'std_msgs/Float64MultiArray',
      {
        data: [servo.id, servo.angle],
      }
    );
  }

  publishVelocity(linear: number, angular: number): void {
    this.publish(
      '/cmd_vel',
      'geometry_msgs/Twist',
      {
        linear: { x: linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: angular },
      }
    );
  }

  publishEmergencyStop(stop: boolean): void {
    this.publish(
      '/emergency/stop',
      'std_msgs/Bool',
      { data: stop }
    );
  }

  subscribeToTopic(topic: string, messageType: string): Promise<any> {
    return new Promise((resolve) => {
      this.subscribe(topic, messageType, (msg) => {
        resolve(msg);
      });
    });
  }

  // Subscribe to joint states and convert to servo angles (radians to degrees)
  subscribeToJointStates(callback: (joints: Record<number, number>) => void): void {
    this.subscribe('/joint_states', 'sensor_msgs/JointState', (msg) => {
      // msg.name contains joint names, msg.position contains angles in radians
      const joints: Record<number, number> = {};
      
      if (msg.name && msg.position) {
        msg.name.forEach((jointName: string, index: number) => {
          // Convert from radians to degrees
          const angleDegrees = (msg.position[index] * 180) / Math.PI;
          
          // Map joint names to servo IDs (you may need to adjust these mappings)
          let servoId = mapJointNameToServoId(jointName);
          if (servoId !== -1) {
            joints[servoId] = angleDegrees;
          }
        });
      }
      
      callback(joints);
    });
  }

  async getTopics(): Promise<ROS2Topic[]> {
    return new Promise((resolve, reject) => {
      this.ros.getTopics((topics: any) => {
        const topicList: ROS2Topic[] = (topics.topics || []).map((name: string) => {
          const cached = this.topicCache.get(name);
          return {
            name,
            type: topics.types ? topics.types[topics.topics.indexOf(name)] : 'unknown',
            latestMessage: cached?.message,
            lastUpdate: cached?.timestamp,
          };
        });
        resolve(topicList);
      }, reject);
    });
  }

  async getServices(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.ros.getServices((services: any) => {
        resolve(services.services || []);
      }, reject);
    });
  }

  getTopicCache(topic: string): any {
    return this.topicCache.get(topic);
  }

  getAllTopicsCache(): Map<string, any> {
    return this.topicCache;
  }

  /**
   * Synchronize dashboard time with robot time
   * Subscribes to /clock topic for ROS time
   */
  synchronizeTime(): void {
    this.subscribe(
      '/clock',
      'rosgraph_msgs/Clock',
      (msg: any) => {
        if (msg.clock && msg.clock.secs) {
          const robotTimeMs = msg.clock.secs * 1000 + (msg.clock.nsecs || 0) / 1000000;
          timeSyncService.updateSync(robotTimeMs);
        }
      }
    );
  }

  /**
   * Initialize time sync with current time
   */
  initializeTimeSync(): void {
    timeSyncService.initializeSync(Date.now());
  }

  /**
   * Get synchronized time
   */
  getSynchronizedTime(): number {
    return timeSyncService.getSynchronizedTime();
  }

  /**
   * Publish servo command with timestamp
   */
  publishServoCommandWithTimestamp(servo: ServoCommand): void {
    const timestamp = timeSyncService.getSynchronizedTime();
    const commandData = {
      data: [servo.id, servo.angle, timestamp, timeSyncService.getOffset()],
    };
    this.publish('/servo/cmd', 'std_msgs/Float64MultiArray', commandData);
  }

  /**
   * Subscribe to servo state updates (current angles, speeds, etc.)
   */
  subscribeToServoState(
    callback?: (states: any) => void
  ): (() => void) | undefined {
    if (!callback) {
      // If no callback provided, still subscribe but just cache
      this.subscribe('/joint_states', 'sensor_msgs/JointState', (msg: any) => {
        // Cache the message
      });
      return () => this.unsubscribe('/joint_states');
    }

    this.subscribe('/joint_states', 'sensor_msgs/JointState', callback);
    return () => this.unsubscribe('/joint_states');
  }

  /**
   * Get the latest cached servo/joint state
   */
  getLatestServoState(): any {
    return this.topicCache.get('/joint_states')?.message;
  }

  /**
   * Get time sync state
   */
  getTimeSyncState() {
    return timeSyncService.getSyncState();
  }

  /**
   * Load URDF robot description from ROS2
   * Fetches /robot_description parameter and returns URDF XML string
   */
  async loadURDF(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Use ROS2 parameter service to get robot_description
        const param = new window.ROSLIB.Param({
          ros: this.ros,
          name: 'robot_description',
        });

        param.get((value: string) => {
          if (!value) {
            reject(new Error('robot_description parameter is empty'));
            return;
          }
          resolve(value);
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error('URDF load timeout - robot_description not found'));
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Map ROS2 joint names to servo IDs
 * Updated based on actual InMoov URDF joint names from /joint_states
 */
function mapJointNameToServoId(jointName: string): number {
  // Head joints
  const headMapping: Record<string, number> = {
    'head_roll_joint': 0,           // Head roll (left/right)
    'head_tilt_joint': 1,           // Head tilt (up/down)
    'head_pan_joint': 2,            // Head pan
    
    // Jaw/mouth
    'jaw_joint': 3,
    
    // Eyes
    'eyes_tilt_joint': 4,
    'eyes_pan_joint': 5,
    'l_eye_pan_joint': 6,
    
    // Right arm
    'r_shoulder_out_joint': 7,
    'r_shoulder_lift_joint': 8,
    'r_upper_arm_roll_joint': 9,
    'r_elbow_flex_joint': 10,
    'r_wrist_roll_joint': 11,
    
    // Left arm
    'l_shoulder_out_joint': 12,
    'l_shoulder_lift_joint': 13,
    'l_upper_arm_roll_joint': 14,
    'l_elbow_flex_joint': 15,
    'l_wrist_roll_joint': 16,
    
    // Right hand fingers
    'r_thumb1_joint': 17,
    'r_thumb_joint': 18,
    'r_thumb3_joint': 19,
    'r_index1_joint': 20,
    'r_index_joint': 21,
    'r_index3_joint': 22,
    'r_middle1_joint': 23,
    'r_middle_joint': 24,
    'r_middle3_joint': 25,
    'r_ring1_joint': 26,
    'r_ring_joint': 27,
    'r_ring3_joint': 28,
    'r_ring4_joint': 29,
    'r_pinky1_joint': 30,
    'r_pinky_joint': 31,
    'r_pinky3_joint': 32,
    'r_pinky4_joint': 33,
    
    // Left hand fingers
    'l_thumb1_joint': 34,
    'l_thumb_joint': 35,
    'l_thumb3_joint': 36,
    'l_index1_joint': 37,
    'l_index_joint': 38,
    'l_index3_joint': 39,
    'l_middle1_joint': 40,
    'l_middle_joint': 41,
    'l_middle3_joint': 42,
    'l_ring1_joint': 43,
    'l_ring_joint': 44,
    'l_ring3_joint': 45,
    'l_ring4_joint': 46,
    'l_pinky1_joint': 47,
    'l_pinky_joint': 48,
    'l_pinky3_joint': 49,
    'l_pinky4_joint': 50,
    
    // Waist
    'waist_pan_joint': 51,
    'waist_roll_joint': 52,
  };
  
  return headMapping[jointName] ?? -1;
}
