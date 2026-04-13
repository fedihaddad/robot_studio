/**
 * INTEGRATION GUIDE - How to Connect MoveIt to Your Dashboard
 * 
 * This shows how to add MoveIt to your existing ros.service.ts
 */

// ============================================================================
// BEFORE: Your current ros.service.ts looks like this
// ============================================================================

/*
import * as rcljs from 'rcljs';

export class ROSService {
  private node: rcljs.Node | null = null;
  private initialized = false;

  async init() {
    // Initialize ROS2 node
    this.node = new rcljs.Node('axel_client');
    this.initialized = true;
  }

  // ... existing methods for camera, servo control, etc
}
*/

// ============================================================================
// AFTER: Updated ros.service.ts WITH MoveIt integration
// ============================================================================

import * as rcljs from 'rcljs';
import { moveItService } from './moveItService'; // ← ADD THIS IMPORT

export class ROSService {
  private node: rcljs.Node | null = null;
  private initialized = false;
  private moveItInitialized = false; // ← ADD THIS

  async init() {
    try {
      // Initialize ROS2 node
      this.node = new rcljs.Node('axel_client');
      this.initialized = true;
      
      // ← ADD MOVEIT INITIALIZATION
      await this.initializeMoveIt();
      
      console.log('✅ ROS Service initialized (with MoveIt)');
    } catch (error) {
      console.error('❌ Failed to initialize ROS Service:', error);
      throw error;
    }
  }

  // ← ADD THIS NEW METHOD
  private async initializeMoveIt() {
    try {
      await moveItService.init();
      this.moveItInitialized = true;
      console.log('✅ MoveIt service initialized');
    } catch (error) {
      console.warn('⚠️  MoveIt not available:', error);
      // Don't throw - app can still work without MoveIt
    }
  }

  /**
   * ← ADD THESE NEW MOVEIT CONTROL METHODS
   */

  /**
   * Move a single joint using MoveIt
   */
  async moveJoint(jointName: string, angle: number, duration: number = 2.0) {
    if (!this.moveItInitialized) {
      throw new Error('MoveIt not initialized');
    }
    return await moveItService.moveJoint(jointName, angle, duration);
  }

  /**
   * Move a planning group (arm, head, etc)
   */
  async moveGroup(group: string, angles: number[], duration: number = 2.0) {
    if (!this.moveItInitialized) {
      throw new Error('MoveIt not initialized');
    }
    return await moveItService.moveGroup(group, angles, duration);
  }

  /**
   * Move multiple joints at once
   */
  async moveMultiple(
    movements: Array<{ joint: string; angle: number }>,
    duration: number = 2.0
  ) {
    if (!this.moveItInitialized) {
      throw new Error('MoveIt not initialized');
    }
    return await moveItService.moveMultiple(movements, duration);
  }

  /**
   * Use preset poses (home, rest, grasp)
   */
  async moveToPreset(preset: 'home' | 'rest' | 'grasp') {
    if (!this.moveItInitialized) {
      throw new Error('MoveIt not initialized');
    }
    return await moveItService.moveToPreset(preset);
  }

  /**
   * Get status of MoveIt service
   */
  getMoveItStatus() {
    if (!this.moveItInitialized) {
      return { initialized: false };
    }
    return moveItService.getStatus();
  }

  /**
   * Get list of all available joints
   */
  getAllJoints(): string[] {
    return moveItService.getAllJoints();
  }

  /**
   * Get list of planning groups
   */
  getPlanningGroups(): string[] {
    return moveItService.listPlanningGroups();
  }

  // ← KEEP YOUR EXISTING METHODS BELOW
  // ... existing servo control methods ...
  // ... existing camera methods ...
  // ... etc
}

// Export singleton
export const rosService = new ROSService();

// ============================================================================
// USAGE IN COMPONENTS
// ============================================================================

/*
// In your components, use it like this:

import { rosService } from '@/services/ros.service';

// Example 1: Move right arm
await rosService.moveGroup('right_arm', [0.5, 1.2, 0.3, -1.5, 0.0], 3.0);

// Example 2: Move single joint
await rosService.moveJoint('r_shoulder_out_joint', 0.5, 2.0);

// Example 3: Move multiple joints
await rosService.moveMultiple([
  { joint: 'r_shoulder_out_joint', angle: 0.5 },
  { joint: 'head_pan_joint', angle: 0.3 },
], 2.0);

// Example 4: Use presets
await rosService.moveToPreset('grasp');
*/

// ============================================================================
// IN YOUR DASHBOARD COMPONENT
// ============================================================================

/*
import React, { useEffect } from 'react';
import { rosService } from '@/services/ros.service';
import { MoveItControlPanel } from '@/components/MoveItControlPanel';

export const Dashboard: React.FC = () => {
  useEffect(() => {
    // Initialize ROS on mount
    const init = async () => {
      try {
        await rosService.init();
        const status = rosService.getMoveItStatus();
        console.log('MoveIt Status:', status);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };
    init();
  }, []);

  return (
    <div className="p-6">
      <h1>AXEL Dashboard</h1>
      
      {/* Add MoveIt control panel */}
      <MoveItControlPanel enabled={true} />
      
      {/* Your other components */}
    </div>
  );
};
*/

// ============================================================================
// WHAT YOU NEED TO DO
// ============================================================================

/*
1. ✅ Copy moveItService.ts to src/services/
2. ✅ Copy MoveItControlPanel.tsx to src/components/  
3. ✅ Copy MoveIt config files to src/ros/moveit_config/config/
4. ✅ Update your ros.service.ts with the code above (add MoveIt methods)
5. ✅ Add <MoveItControlPanel /> to your Dashboard component
6. ✅ Test in browser console:
      await rosService.moveJoint('r_shoulder_out_joint', 0.5);
*/

// ============================================================================
// EXPECTED FLOW
// ============================================================================

/*
User Dashboard
      ↓
MoveItControlPanel (UI sliders)
      ↓
rosService.moveGroup() or rosService.moveJoint()
      ↓
moveItService methods
      ↓
ROS2 MoveIt Action Client
      ↓
MoveIt Move Group (running on Ubuntu/ROS machine)
      ↓
Trajectory Planning
      ↓
Robot Joint Controllers
      ↓
🤖 Robot Moves!
*/

export {};
