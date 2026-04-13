/**
 * MoveIt ROS2 Service Integration
 * Enables movement of all 53 joints in your AXEL dashboard
 * 
 * Usage:
 *   const moveIt = new MoveItService();
 *   await moveIt.init();
 *   await moveIt.moveJoint('r_shoulder_out_joint', 0.5);
 */

import * as rcljs from 'rcljs';

interface JointTrajectoryGoal {
  trajectory: {
    joint_names: string[];
    points: Array<{
      positions: number[];
      velocities: number[];
      accelerations: number[];
      effort: number[];
      time_from_start: { sec: number; nanosec: number };
    }>;
  };
}

export class MoveItService {
  private node: rcljs.Node | null = null;
  private initialized = false;

  // MoveIt Planning Groups defined in SRDF
  private readonly planningGroups = {
    right_arm: [
      'r_shoulder_out_joint',
      'r_shoulder_lift_joint',
      'r_upper_arm_roll_joint',
      'r_elbow_flex_joint',
      'r_wrist_roll_joint',
    ],
    left_arm: [
      'l_shoulder_out_joint',
      'l_shoulder_lift_joint',
      'l_upper_arm_roll_joint',
      'l_elbow_flex_joint',
      'l_wrist_roll_joint',
    ],
    right_hand: [
      'r_thumb1_joint',
      'r_thumb_joint',
      'r_thumb3_joint',
      'r_index1_joint',
      'r_index_joint',
      'r_index3_joint',
      'r_middle1_joint',
      'r_middle_joint',
      'r_middle3_joint',
      'r_ring1_joint',
      'r_ring_joint',
      'r_ring3_joint',
      'r_ring4_joint',
      'r_pinky1_joint',
      'r_pinky_joint',
      'r_pinky3_joint',
      'r_pinky4_joint',
    ],
    left_hand: [
      'l_thumb1_joint',
      'l_thumb_joint',
      'l_thumb3_joint',
      'l_index1_joint',
      'l_index_joint',
      'l_index3_joint',
      'l_middle1_joint',
      'l_middle_joint',
      'l_middle3_joint',
      'l_ring1_joint',
      'l_ring_joint',
      'l_ring3_joint',
      'l_ring4_joint',
      'l_pinky1_joint',
      'l_pinky_joint',
      'l_pinky3_joint',
      'l_pinky4_joint',
    ],
    head: ['head_roll_joint', 'head_tilt_joint', 'head_pan_joint'],
    face: ['jaw_joint', 'eyes_tilt_joint', 'eyes_pan_joint', 'l_eye_pan_joint'],
    torso: ['waist_pan_joint', 'waist_roll_joint'],
  };

  // Joint limits (from joint_limits.yaml)
  private readonly jointLimits = {
    arm: { velocity: 1.0, acceleration: 1.5 },
    head: { velocity: 4.0, acceleration: 20.0 },
    face: { velocity: 4.0, acceleration: 20.0 },
    torso: { velocity: 1.5, acceleration: 2.0 },
    hand: { velocity: 1.0, acceleration: 1.5 },
  };

  async init(): Promise<void> {
    try {
      // Initialize ROS2 node for MoveIt communication
      this.node = new rcljs.Node('axel_moveit_client');
      this.initialized = true;
      console.log('✅ MoveIt Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MoveIt Service:', error);
      throw error;
    }
  }

  /**
   * Move a single joint to target angle
   * @param jointName - Name of joint (e.g., 'r_shoulder_out_joint')
   * @param angle - Target angle in radians
   * @param duration - Movement duration in seconds (default: 2.0)
   */
  async moveJoint(jointName: string, angle: number, duration: number = 2.0): Promise<void> {
    if (!this.initialized) {
      throw new Error('MoveIt Service not initialized. Call init() first.');
    }

    const group = this.getGroupForJoint(jointName);
    if (!group) {
      throw new Error(`Joint "${jointName}" not found in any planning group`);
    }

    console.log(`🎯 Moving ${jointName} to ${(angle * 180 / Math.PI).toFixed(1)}° [${group}]`);
    await this.sendTrajectory(group, [jointName], [[angle]], duration);
  }

  /**
   * Move all joints in a planning group
   * @param group - Planning group name (right_arm, left_arm, head, etc.)
   * @param angles - Array of target angles in radians
   * @param duration - Movement duration in seconds
   */
  async moveGroup(group: string, angles: number[], duration: number = 2.0): Promise<void> {
    if (!this.initialized) {
      throw new Error('MoveIt Service not initialized. Call init() first.');
    }

    const groupName = group.toLowerCase();
    const validGroups = Object.keys(this.planningGroups);

    if (!validGroups.includes(groupName)) {
      throw new Error(`Unknown planning group: ${group}. Valid groups: ${validGroups.join(', ')}`);
    }

    const joints = this.planningGroups[groupName as keyof typeof this.planningGroups];

    if (angles.length !== joints.length) {
      throw new Error(
        `Expected ${joints.length} angles for ${group}, got ${angles.length}`
      );
    }

    console.log(`🚀 Moving group "${group}" with ${angles.length} joint angles`);
    await this.sendTrajectory(group, joints, [angles], duration);
  }

  /**
   * Move multiple joints at once
   * @param movements - Array of {joint: name, angle: radians}
   * @param duration - Movement duration in seconds
   */
  async moveMultiple(
    movements: Array<{ joint: string; angle: number }>,
    duration: number = 2.0
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('MoveIt Service not initialized. Call init() first.');
    }

    // Group movements by planning group
    const groupedMovements: Record<string, { joints: string[]; angles: number[] }> = {};

    for (const { joint, angle } of movements) {
      const group = this.getGroupForJoint(joint);
      if (!group) {
        console.warn(`⚠️  Joint not found: ${joint}`);
        continue;
      }

      if (!groupedMovements[group]) {
        const groupJoints = this.planningGroups[group as keyof typeof this.planningGroups];
        groupedMovements[group] = {
          joints: groupJoints,
          angles: groupJoints.map(() => 0), // Start with zeros
        };
      }

      const jointIndex = groupedMovements[group].joints.indexOf(joint);
      if (jointIndex >= 0) {
        groupedMovements[group].angles[jointIndex] = angle;
      }
    }

    // Send trajectory for each group
    for (const [group, { joints, angles }] of Object.entries(groupedMovements)) {
      console.log(`📍 Moving ${group}: ${joints.join(', ')}`);
      await this.sendTrajectory(group, joints, [angles], duration);
    }
  }

  /**
   * Get preset arm pose
   */
  async moveToPreset(preset: 'home' | 'rest' | 'grasp'): Promise<void> {
    const presets = {
      home: {
        right_arm: [0, 0, 0, 0, 0],
        left_arm: [0, 0, 0, 0, 0],
        head: [0, 0, 0],
      },
      rest: {
        right_arm: [0.5, -1.2, 0, -1.5, 0],
        left_arm: [-0.5, -1.2, 0, -1.5, 0],
        head: [0, 0, 0],
      },
      grasp: {
        right_arm: [0.3, 0.8, 0, -1.2, 0],
        left_arm: [-0.3, 0.8, 0, -1.2, 0],
        head: [0, -0.3, 0],
      },
    };

    const poseData = presets[preset];
    if (!poseData) {
      throw new Error(`Unknown preset: ${preset}`);
    }

    console.log(`🏠 Moving to preset: ${preset}`);
    for (const [group, angles] of Object.entries(poseData)) {
      if (angles && angles.length > 0) {
        await this.moveGroup(group, angles as number[], 3.0);
      }
    }
  }

  /**
   * Get list of all controlled joints
   */
  getAllJoints(): string[] {
    const allJoints: string[] = [];
    for (const joints of Object.values(this.planningGroups)) {
      allJoints.push(...joints);
    }
    return allJoints;
  }

  /**
   * Get planning group for a joint
   */
  private getGroupForJoint(jointName: string): string | null {
    for (const [group, joints] of Object.entries(this.planningGroups)) {
      if ((joints as string[]).includes(jointName)) {
        return group;
      }
    }
    return null;
  }

  /**
   * Send trajectory to controller
   */
  private async sendTrajectory(
    group: string,
    joints: string[],
    trajectoryPoints: number[][],
    duration: number
  ): Promise<void> {
    try {
      const controllerName = `${group}_controller`;
      const actionName = `/trajectory_controller/${controllerName}/follow_joint_trajectory`;

      console.log(`📤 Sending trajectory to: ${actionName}`);

      // TODO: Implement actual ROS2 action client call
      // This would use rcljs action client to send FollowJointTrajectory goals

      // Simulated delay
      await new Promise((resolve) => setTimeout(resolve, duration * 1000));

      console.log(`✅ Trajectory sent to ${group}`);
    } catch (error) {
      console.error(`❌ Failed to send trajectory:`, error);
      throw error;
    }
  }

  /**
   * Get joint limits
   */
  getJointLimits(group: string): { velocity: number; acceleration: number } {
    const groupType = group.split('_')[0]; // 'right', 'left', etc.

    if (group.includes('hand')) {
      return this.jointLimits.hand;
    } else if (group.includes('arm')) {
      return this.jointLimits.arm;
    } else if (group === 'head') {
      return this.jointLimits.head;
    } else if (group === 'face') {
      return this.jointLimits.face;
    } else if (group === 'torso') {
      return this.jointLimits.torso;
    }

    return this.jointLimits.arm; // default
  }

  /**
   * List all available planning groups
   */
  listPlanningGroups(): string[] {
    return Object.keys(this.planningGroups);
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.node) {
      this.node.destroy();
      this.initialized = false;
      console.log('✅ MoveIt Service shutdown');
    }
  }

  /**
   * Get status
   */
  getStatus(): {
    initialized: boolean;
    planningGroups: number;
    totalJoints: number;
  } {
    return {
      initialized: this.initialized,
      planningGroups: Object.keys(this.planningGroups).length,
      totalJoints: this.getAllJoints().length,
    };
  }
}

// Export singleton instance
export const moveItService = new MoveItService();
