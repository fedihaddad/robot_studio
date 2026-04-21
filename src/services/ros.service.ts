/**
 * ROS Utilities and Services
 * Handles communication with ROS2 through roslib
 */

import { ServoCommand, ROS2Topic, TimestampedCommand } from '../types';
import { timeSyncService } from './timeSynchronization.service';

declare global {
  interface Window {
    ROSLIB: any;
    terminalLogger?: {
      log: (message: string, data?: unknown) => void;
    };
  }
}

export class ROSService {
  private ros: any;
  private subscribers: Map<
    string,
    {
      topic: any;
      callbacks: Set<(msg: any) => void>;
    }
  > = new Map();
  private publishers: Map<string, any> = new Map();
  private topicCache: Map<string, any> = new Map();
  private isConnectedFlag = false;
  private lastJointPositions: Map<string, number> = new Map();
  private readonly jointDeltaThreshold = 1e-4; // radians
  private readonly dashboardTrajectoryTopic = '/joint_trajectory_controller/joint_trajectory';

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
    this.subscribers.forEach((entry) => entry.topic.unsubscribe());
    this.subscribers.clear();
    this.publishers.forEach(pub => pub.unsubscribe());
    this.topicCache.clear();
    this.lastJointPositions.clear();
    if (this.ros) {
      this.ros.close();
    }
  }

  subscribe(topic: string, messageType: string, callback: (msg: any) => void): void {
    const existing = this.subscribers.get(topic);
    if (existing) {
      existing.callbacks.add(callback);
      return;
    }

    const subscriber = new window.ROSLIB.Topic({
      ros: this.ros,
      name: topic,
      messageType: messageType,
    });

    const callbacks = new Set<(msg: any) => void>();
    callbacks.add(callback);

    subscriber.subscribe((msg: any) => {
      this.topicCache.set(topic, { message: msg, timestamp: Date.now() });
      if (topic === '/joint_states') {
        this.logJointStateDelta(msg);
      }
      callbacks.forEach((cb) => {
        try {
          cb(msg);
        } catch (error) {
          console.error(`[ROSService] Callback error on topic ${topic}:`, error);
        }
      });
    });

    this.subscribers.set(topic, {
      topic: subscriber,
      callbacks,
    });
  }

  private logJointStateDelta(msg: any): void {
    if (!msg?.name || !msg?.position || !Array.isArray(msg.name) || !Array.isArray(msg.position)) {
      window.terminalLogger?.log('[ROS RX] /joint_states (invalid payload)', msg);
      return;
    }

    const deltas: Array<{
      joint: string;
      previous: number | null;
      current: number;
      delta: number;
    }> = [];

    msg.name.forEach((jointName: string, index: number) => {
      const current = msg.position[index];
      if (!Number.isFinite(current)) return;

      const previous = this.lastJointPositions.get(jointName);
      this.lastJointPositions.set(jointName, current);

      if (previous === undefined) {
        deltas.push({
          joint: jointName,
          previous: null,
          current,
          delta: 0,
        });
        return;
      }

      const delta = current - previous;
      if (Math.abs(delta) >= this.jointDeltaThreshold) {
        deltas.push({
          joint: jointName,
          previous,
          current,
          delta,
        });
      }
    });

    if (deltas.length > 0) {
      window.terminalLogger?.log(`[ROS RX][DELTA] /joint_states changed (${deltas.length})`, deltas);
    }
  }

  unsubscribe(topic: string, callback?: (msg: any) => void): void {
    const subscriber = this.subscribers.get(topic);
    if (!subscriber) {
      return;
    }

    if (callback) {
      subscriber.callbacks.delete(callback);
      if (subscriber.callbacks.size > 0) {
        return;
      }
    }

    subscriber.topic.unsubscribe();
    this.subscribers.delete(topic);
    this.topicCache.delete(topic);
  }

  publish(topic: string, messageType: string, message: any): void {
    // Check if ROS is connected
    if (!this.isConnectedFlag) {
      console.warn(`[ROS] Cannot publish to ${topic}: ROS not connected`);
      return;
    }

    if (!this.publishers.has(topic)) {
      try {
        const publisher = new window.ROSLIB.Topic({
          ros: this.ros,
          name: topic,
          messageType: messageType,
        });
        this.publishers.set(topic, publisher);
      } catch (error) {
        console.error(`[ROS] Failed to create publisher for ${topic}:`, error);
        return;
      }
    }

    try {
      const publisher = this.publishers.get(topic);
      if (publisher) {
        publisher.publish(message);
        window.terminalLogger?.log(`[ROS TX] Published to ${topic}`, message);
      }
    } catch (error) {
      console.error(`[ROS] Failed to publish to ${topic}:`, error);
    }
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

    // Also bridge dashboard commands to ROS trajectory controller so motion is visible in ROS.
    this.publishServoAsJointTrajectory(servo);
  }

  private publishServoAsJointTrajectory(servo: ServoCommand): void {
    const jointName = SERVO_ID_TO_JOINT_NAME[servo.id];
    if (!jointName) {
      return;
    }

    const targetRadians = (servo.angle * Math.PI) / 180;
    const latestJointState = this.getLatestServoState();

    // Preferred: publish full joint vector based on latest /joint_states so controllers
    // that require complete joint goals can accept the command.
    if (
      latestJointState?.name &&
      latestJointState?.position &&
      Array.isArray(latestJointState.name) &&
      Array.isArray(latestJointState.position) &&
      latestJointState.name.length === latestJointState.position.length
    ) {
      const jointNames: string[] = [...latestJointState.name];
      const positions: number[] = [...latestJointState.position];
      const targetIndex = jointNames.indexOf(jointName);

      if (targetIndex !== -1) {
        positions[targetIndex] = targetRadians;
        this.publishJointTrajectory(jointNames, positions, 0.25);
        window.terminalLogger?.log('[ROS TX] dashboard trajectory (full-state)', {
          joint: jointName,
          targetRadians,
          topic: this.dashboardTrajectoryTopic,
        });
        return;
      }
    }

    // Fallback: publish a single-joint trajectory.
    this.publishJointTrajectory([jointName], [targetRadians], 0.25);
    window.terminalLogger?.log('[ROS TX] dashboard trajectory (single-joint)', {
      joint: jointName,
      targetRadians,
      topic: this.dashboardTrajectoryTopic,
    });
  }

  private publishJointTrajectory(
    jointNames: string[],
    positions: number[],
    durationSeconds = 0.25
  ): void {
    const sec = Math.max(0, Math.floor(durationSeconds));
    const nanosec = Math.max(0, Math.floor((durationSeconds - sec) * 1e9));

    this.publish(
      this.dashboardTrajectoryTopic,
      'trajectory_msgs/JointTrajectory',
      {
        joint_names: jointNames,
        points: [
          {
            positions,
            time_from_start: {
              sec,
              nanosec,
            },
          },
        ],
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
          const servoId = mapJointNameToServoId(jointName);
          if (servoId !== -1) {
            joints[servoId] = angleDegrees;
          }
        });
      }
      
      callback(joints);
    });
  }

  // Subscribe to joint states and return both:
  // 1) servo-id mapped degrees (legacy controls)
  // 2) joint-name mapped radians (full URDF animation)
  subscribeToJointStatesFull(
    callback: (
      servoJoints: Record<number, number>,
      jointStatesByName: Record<string, number>
    ) => void
  ): void {
    this.subscribe('/joint_states', 'sensor_msgs/JointState', (msg) => {
      const servoJoints: Record<number, number> = {};
      const jointStatesByName: Record<string, number> = {};

      if (msg.name && msg.position) {
        msg.name.forEach((jointName: string, index: number) => {
          const angleRadians = msg.position[index];
          if (!Number.isFinite(angleRadians)) return;
          jointStatesByName[jointName] = angleRadians;

          const angleDegrees = (angleRadians * 180) / Math.PI;
          const servoId = mapJointNameToServoId(jointName);
          if (servoId !== -1) {
            servoJoints[servoId] = angleDegrees;
          }
        });
      }

      callback(servoJoints, jointStatesByName);
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
      const noopCallback = (_msg: any) => {
        // Cache the message
      };
      this.subscribe('/joint_states', 'sensor_msgs/JointState', noopCallback);
      return () => this.unsubscribe('/joint_states', noopCallback);
    }

    this.subscribe('/joint_states', 'sensor_msgs/JointState', callback);
    return () => this.unsubscribe('/joint_states', callback);
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
   * Subscribe to MarkerArray (scene objects, obstacles, goals)
   */
  subscribeToMarkerArray(callback: (markers: any[]) => void): void {
    this.subscribe(
      '/axel/scene_markers',
      'visualization_msgs/MarkerArray',
      (msg: any) => {
        callback(msg.markers || []);
      }
    );
  }

  /**
   * Subscribe to Marker (single marker updates)
   */
  subscribeToMarker(callback: (marker: any) => void): void {
    this.subscribe(
      '/visualization_marker',
      'visualization_msgs/Marker',
      (msg: any) => {
        callback(msg);
      }
    );
  }

  /**
   * Subscribe to TF transforms (coordinate frames)
   */
  subscribeToTF(callback: (transforms: any[]) => void): void {
    this.subscribe(
      '/tf',
      'tf2_msgs/TFMessage',
      (msg: any) => {
        callback(msg.transforms || []);
      }
    );
  }

  /**
   * Subscribe to static TF transforms
   */
  subscribeToTFStatic(callback: (transforms: any[]) => void): void {
    this.subscribe(
      '/tf_static',
      'tf2_msgs/TFMessage',
      (msg: any) => {
        callback(msg.transforms || []);
      }
    );
  }

  /**
   * Subscribe to collision state (self-collision detection)
   */
  subscribeToCollisionState(callback: (collisionPairs: any[]) => void): void {
    this.subscribe(
      '/monitored_planning_scene',
      'moveit_msgs/PlanningScene',
      (msg: any) => {
        if (msg.robot_state && msg.robot_state.is_diff) {
          // Extract collision state if available
          callback(msg.allowed_collisions || []);
        }
      }
    );
  }

  /**
   * Subscribe to trajectories (motion plans)
   */
  subscribeToTrajectory(callback: (trajectory: any) => void): void {
    this.subscribe(
      '/execute_trajectory/state',
      'control_msgs/FollowJointTrajectoryActionResult',
      (msg: any) => {
        callback(msg.result || msg);
      }
    );
  }

  /**
   * Publish trajectory for execution
   */
  publishTrajectory(jointNames: string[], points: any[]): void {
    const trajectory = {
      joint_names: jointNames,
      points: points,
    };

    this.publish(
      '/execute_trajectory/goal',
      'control_msgs/FollowJointTrajectoryActionGoal',
      {
        goal: {
          trajectory: trajectory,
        },
      }
    );
  }

  /**
   * Load URDF robot description from ROS2
   * Try multiple strategies:
   * 1. robot_state_publisher:robot_description (ROS2 node-scoped)
   * 2. /robot_description (global parameter)
   * 3. Subscribe to /robot_description topic as fallback
   */
  async loadURDF(): Promise<string> {
    return new Promise((resolve, reject) => {
      let timeoutHandle: any = null;
      let resolved = false;

      const cleanup = () => {
        resolved = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);
      };

      const attemptParameterLoad = (paramName: string, isSecondAttempt = false) => {
        console.log(`[ROSService] Attempt ${isSecondAttempt ? 2 : 1}: Loading URDF from parameter: ${paramName}`);
        
        const urdfParam = new window.ROSLIB.Param({
          ros: this.ros,
          name: paramName,
        });

        // Log when get() is called
        console.log(`[ROSService] Calling urdfParam.get() for: ${paramName}`);

        urdfParam.get(
          (urdfString: any) => {
            console.log(`[ROSService] ✅ urdfParam.get() callback fired for ${paramName}`);
            
            if (resolved) return;
            
            if (!urdfString || (typeof urdfString === 'string' && urdfString.trim().length === 0)) {
              console.warn(`[ROSService] ⚠️ Parameter ${paramName} is empty, trying fallback...`);
              if (!isSecondAttempt) {
                attemptParameterLoad('/robot_description', true);
              } else {
                attemptTopicFallback();
              }
              return;
            }

            cleanup();
            console.log('[ROSService] ✅ URDF loaded successfully from parameter');
            console.log('[ROSService] URDF length:', urdfString.length, 'bytes');
            console.log('[ROSService] URDF first 300 chars:', urdfString.substring(0, 300));
            resolve(urdfString);
          },
          (error: any) => {
            console.warn(`[ROSService] Parameter ${paramName} get() error:`, error);
            if (!isSecondAttempt && !resolved) {
              attemptParameterLoad('/robot_description', true);
            } else if (resolved === false) {
              attemptTopicFallback();
            }
          }
        );
      };

      const attemptTopicFallback = () => {
        if (resolved) return;
        
        console.log('[ROSService] Falling back to topic subscription: /robot_description');
        
        const topicListener = new window.ROSLIB.Topic({
          ros: this.ros,
          name: '/robot_description',
          messageType: 'std_msgs/String',
        });

        topicListener.subscribe((msg: any) => {
          console.log('[ROSService] ✅ Received URDF from /robot_description topic');
          if (resolved) return;
          
          const urdfString = msg.data || msg;
          if (urdfString && urdfString.length > 0) {
            cleanup();
            console.log('[ROSService] URDF length:', urdfString.length, 'bytes');
            resolve(urdfString);
            topicListener.unsubscribe();
          }
        });

        // Topic fallback timeout
        setTimeout(() => {
          if (!resolved) {
            console.error('[ROSService] ❌ Topic fallback also timed out');
            topicListener.unsubscribe();
            reject(new Error('URDF loading failed: parameter unavailable and topic subscription timed out'));
          }
        }, 5000);
      };

      // Start with ROS2 node-scoped parameter
      attemptParameterLoad('robot_state_publisher:robot_description', false);

      // Primary timeout (10 seconds total for all attempts)
      timeoutHandle = setTimeout(() => {
        if (!resolved) {
          console.error('[ROSService] ⚠️ Timeout: All URDF loading attempts failed after 10 seconds');
          console.info('[ROSService] Diagnostics:');
          console.info('[ROSService] - Verify robot_state_publisher is running: ros2 node list');
          console.info('[ROSService] - Check parameter exists: ros2 param list | grep description');
          console.info('[ROSService] - Check parameter value: ros2 param get robot_state_publisher robot_description');
          cleanup();
          reject(new Error('URDF loading failed: parameter and topic unavailable'));
        }
      }, 10000);
    });
  }
}

/**
 * Map ROS2 joint names to servo IDs
 * Updated based on InMoov upper-body joint names from /joint_states.
 * Target profile: 57 joints (IDs 0..56).
 */
export const JOINT_NAME_TO_SERVO_ID: Record<string, number> = {
  // Head joints
  head_roll_joint: 0,
  head_tilt_joint: 1,
  head_pan_joint: 2,

  // Jaw / mouth
  jaw_joint: 3,

  // Eyes
  eyes_tilt_joint: 4,
  eyes_pan_joint: 5,
  l_eye_pan_joint: 6,

  // Right arm
  r_shoulder_out_joint: 7,
  r_shoulder_lift_joint: 8,
  r_upper_arm_roll_joint: 9,
  r_elbow_flex_joint: 10,
  r_wrist_roll_joint: 11,

  // Left arm
  l_shoulder_out_joint: 12,
  l_shoulder_lift_joint: 13,
  l_upper_arm_roll_joint: 14,
  l_elbow_flex_joint: 15,
  l_wrist_roll_joint: 16,

  // Right hand fingers
  r_thumb1_joint: 17,
  r_thumb_joint: 18,
  r_thumb3_joint: 19,
  r_index1_joint: 20,
  r_index_joint: 21,
  r_index3_joint: 22,
  r_middle1_joint: 23,
  r_middle_joint: 24,
  r_middle3_joint: 25,
  r_ring1_joint: 26,
  r_ring_joint: 27,
  r_ring3_joint: 28,
  r_ring4_joint: 29,
  r_pinky1_joint: 30,
  r_pinky_joint: 31,
  r_pinky3_joint: 32,
  r_pinky4_joint: 33,

  // Left hand fingers
  l_thumb1_joint: 34,
  l_thumb_joint: 35,
  l_thumb3_joint: 36,
  l_index1_joint: 37,
  l_index_joint: 38,
  l_index3_joint: 39,
  l_middle1_joint: 40,
  l_middle_joint: 41,
  l_middle3_joint: 42,
  l_ring1_joint: 43,
  l_ring_joint: 44,
  l_ring3_joint: 45,
  l_ring4_joint: 46,
  l_pinky1_joint: 47,
  l_pinky_joint: 48,
  l_pinky3_joint: 49,
  l_pinky4_joint: 50,

  // Waist
  waist_pan_joint: 51,
  waist_roll_joint: 52,

  // Extra visual joints used in Ubuntu flows / facial-eye chain
  // (kept for a 57-joint unified mapping profile).
  l_eye_joint: 53,
  r_eye_joint: 54,
  l_iris_joint: 55,
  r_iris_joint: 56,
};

export const SERVO_ID_TO_JOINT_NAME: Record<number, string> = Object.entries(
  JOINT_NAME_TO_SERVO_ID
).reduce((acc, [joint, servoId]) => {
  acc[servoId] = joint;
  return acc;
}, {} as Record<number, string>);

function mapJointNameToServoId(jointName: string): number {
  return JOINT_NAME_TO_SERVO_ID[jointName] ?? -1;
}
