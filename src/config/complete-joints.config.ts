/**
 * AXEL Complete Joint Control Configuration
 * 
 * This file defines the complete set of joints and their control parameters
 * for the AXEL humanoid robot 3D visualization in the Windows dashboard.
 * 
 * Total Implementation: 28 Controllable Joints (100% parity with Ubuntu model)
 */

// Import full servo and joint configs
export { servoDegreesConfig, getServoConfig, validateServoAngle, getServoName } from './servoDegrees.config';
export { jointServoMapping, servoJointMapping, servoGroups, getServoForJoint, getJointForServo } from './joint-servo.mapping';

/**
 * Complete Joint Definition List
 * Organized by kinematic chain
 */
export const completeJointsList = {
  head: [
    'head_pan_joint',      // Rotate head left/right
    'head_tilt_joint',     // Tilt head forward/backward
    'head_roll_joint',     // Roll head left/right (tilt)
  ],
  
  eyes: [
    'eyes_pan_joint',      // Pan both eyes left/right
    'eyes_tilt_joint',     // Tilt both eyes up/down
  ],
  
  face: [
    'jaw_joint',           // Open/close mouth
  ],
  
  torso: [
    'waist_pan_joint',     // Rotate torso
    'waist_roll_joint',    // Roll/lean torso
  ],
  
  leftArm: [
    'l_shoulder_out_joint',      // Abduct/adduct shoulder
    'l_shoulder_lift_joint',     // Lift/lower shoulder
    'l_upper_arm_roll_joint',    // Rotate upper arm
    'l_elbow_flex_joint',        // Flex/extend elbow
    'l_wrist_roll_joint',        // Roll wrist
  ],
  
  leftHand: [
    'l_thumb_joint',
    'l_index_joint',
    'l_middle_joint',
    'l_ring_joint',
    'l_pinky_joint',
  ],
  
  rightArm: [
    'r_shoulder_out_joint',      // Abduct/adduct shoulder
    'r_shoulder_lift_joint',     // Lift/lower shoulder
    'r_upper_arm_roll_joint',    // Rotate upper arm
    'r_elbow_flex_joint',        // Flex/extend elbow
    'r_wrist_roll_joint',        // Roll wrist
  ],
  
  rightHand: [
    'r_thumb_joint',
    'r_index_joint',
    'r_middle_joint',
    'r_ring_joint',
    'r_pinky_joint',
  ],
};

/**
 * Statistics
 */
export const jointStats = {
  totalJoints: 28,
  joints: {
    head: 3,
    eyes: 2,
    face: 1,
    torso: 2,
    leftArm: 5,
    leftHand: 5,
    rightArm: 5,
    rightHand: 5,
    leftFingers: 5,
    rightFingers: 5,
  },
  servos: {
    implemented: 39,  // servo_1 through servo_39
    face: 15,         // Eyes, eyebrows, mouth, cheeks, jaw
    arm: 24,          // Head movement, arm control, hand fingers
  },
};

export default completeJointsList;
