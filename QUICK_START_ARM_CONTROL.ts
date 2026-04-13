/**
 * AXEL Robot - Arm Control Implementation Quick Start
 * 
 * This guide shows EXACTLY what to do next to enable arm control
 * Follow these steps in order for fastest implementation
 */

import { servoDegreesConfig } from './servoDegrees.config';
import { jointServoMapping, servoGroups } from './joint-servo.mapping';

/**
 * QUICK START: Next 3 Things to Do
 * 
 * Copy this code into your files to continue...
 */

/**
 * STEP 1: Update src/types/index.ts
 * ===================================
 * 
 * ADD THIS to extend serialize support:
 * 
 * // Extend ServoCommand interface
 * export interface ServoCommand {
 *   servo_id: number;        // 1-39 (was 1-15)
 *   angle: number;
 *   duration?: number;
 * }
 * 
 * // New interface for arm-specific state
 * export interface ArmState {
 *   left_shoulder_out: number;
 *   left_shoulder_lift: number;
 *   left_upper_arm_roll: number;
 *   left_elbow_flex: number;
 *   left_wrist_roll: number;
 *   right_shoulder_out: number;
 *   right_shoulder_lift: number;
 *   right_upper_arm_roll: number;
 *   right_elbow_flex: number;
 *   right_wrist_roll: number;
 * }
 * 
 * // New interface for complete body state
 * export interface RobotState {
 *   head: { pan: number; tilt: number; roll: number };
 *   eyes: { pan: number; tilt: number };
 *   leftArm: ArmState;
 *   rightArm: ArmState;
 *   torso: { waist_pan: number; waist_roll: number };
 * }
 */

/**
 * STEP 2: Create ArmControlPanel.tsx
 * ===================================
 * 
 * Location: src/components/shared/ArmControlPanel.tsx
 * 
 * Template to use:
 * 
 * import React, { useState } from 'react';
 * import ServoSlider from './ServoSlider';
 * import { servoDegreesConfig } from '@/config/servoDegrees.config';
 * 
 * export function ArmControlPanel() {
 *   const [armAngles, setArmAngles] = useState<Record<number, number>>({
 *     18: 30,   // l_shoulder_out
 *     19: -45,  // l_shoulder_lift
 *     20: 0,    // l_upper_arm_roll
 *     21: -50,  // l_elbow_flex
 *     22: 90,   // l_wrist_roll
 *     23: -30,  // r_shoulder_out
 *     24: -45,  // r_shoulder_lift
 *     25: 0,    // r_upper_arm_roll
 *     31: -50,  // r_elbow_flex
 *     32: -90,  // r_wrist_roll
 *   });
 * 
 *   const updateServo = (servoId: number, angle: number) => {
 *     setArmAngles(prev => ({ ...prev, [servoId]: angle }));
 *     // TODO: Send to ROS via publishServoCommand()
 *   };
 * 
 *   return (
 *     <div className="grid grid-cols-2 gap-4">
 *       <div className="bg-blue-900 p-4 rounded">
 *         <h3 className="text-white font-bold mb-2">Left Arm</h3>
 *         {[18, 19, 20, 21, 22].map(servoId => (
 *           <ServoSlider
 *             key={servoId}
 *             servoId={servoId}
 *             angle={armAngles[servoId]}
 *             onAngleChange={(angle) => updateServo(servoId, angle)}
 *           />
 *         ))}
 *       </div>
 *       <div className="bg-red-900 p-4 rounded">
 *         <h3 className="text-white font-bold mb-2">Right Arm</h3>
 *         {[23, 24, 25, 31, 32].map(servoId => (
 *           <ServoSlider
 *             key={servoId}
 *             servoId={servoId}
 *             angle={armAngles[servoId]}
 *             onAngleChange={(angle) => updateServo(servoId, angle)}
 *           />
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */

/**
 * STEP 3: Update ROS Service
 * ===========================
 * 
 * In src/services/ros.service.ts, extend handleServoStateMessage:
 * 
 * private handleServoStateMessage(msg: ServoState) {
 *   // Existing code for servo_id 1-15:
 *   // ... (keep existing)
 *   
 *   // ADD THIS for arm servos (16-39):
 *   const jointName = servoJointMapping[msg.servo_id];
 *   if (jointName) {
 *     this.robotState[jointName] = msg.angle;
 *     
 *     // Map to 3D mesh
 *     const meshName = this.getMeshForJoint(jointName);
 *     if (meshName) {
 *       this.updateMeshRotation(meshName, msg.angle);
 *     }
 *   }
 * }
 */

/**
 * TESTING: How to verify it works
 * =================================
 * 
 * 1. Check types compile:
 *    npm run type-check
 * 
 * 2. Check no TypeScript errors:
 *    npm run build
 * 
 * 3. Import the new mapping:
 *    import { jointServoMapping } from '@/config/joint-servo.mapping';
 * 
 * 4. Loop through all joints:
 *    Object.entries(jointServoMapping).forEach(([joint, servo]) => {
 *      console.log(`${joint} → servo_${servo}`);
 *    });
 *    // Should print all 28 joints mapped correctly
 */

/**
 * DEBUGGING TIPS
 * ===============
 * 
 * If servo angles don't show up:
 *   → Check ServoCommand is publishing servo_id 16-39
 *   → Check servo config has valid min/max for that servo
 * 
 * If 3D mesh doesn't move:
 *   → Check jointServoMapping has the joint name
 *   → Check mesh-servo.mapping has the mesh binding
 *   → Check updateMeshRotation() is being called
 * 
 * If ROS doesn't receive commands:
 *   → Check ros.service subscribesTo correct topics
 *   → Check servo command format: { servo_id, angle }
 *   → Check ROS bridge is running and connected
 */

/**
 * IMPORT THESE IN YOUR COMPONENT
 * ================================
 */

// Use these imports everywhere you need them:
const imports = {
  config: "import { servoDegreesConfig, getServoConfig } from '@/config/servoDegrees.config';",
  mapping: "import { jointServoMapping, servoGroups, getServoForJoint } from '@/config/joint-servo.mapping';",
  joints: "import { completeJointsList } from '@/config/complete-joints.config';",
};

/**
 * HELPFUL SNIPPETS FOR ARM CONTROL
 * ==================================
 */

// Get all left arm servo IDs
const leftArmServos = servoGroups.leftArm.servos;  // [18, 19, 20, 21, 22]

// Get servo name by ID
const servoName = servoDegreesConfig[`servo_23` as keyof typeof servoDegreesConfig]?.name;

// Find which servo controls a joint
const servoForShoulder = jointServoMapping['r_shoulder_out_joint'];  // Returns 23

// Loop through arm joints
Object.entries(jointServoMapping)
  .filter(([joint]) => joint.includes('shoulder') || joint.includes('elbow'))
  .forEach(([joint, servo]) => {
    console.log(`${joint} controlled by servo_${servo}`);
  });

export default {
  status: 'Implementation Guide',
  nextSteps: [
    '1. Update types/index.ts',
    '2. Create ArmControlPanel.tsx',
    '3. Update ros.service.ts',
    '4. Test in dashboard',
  ],
};
