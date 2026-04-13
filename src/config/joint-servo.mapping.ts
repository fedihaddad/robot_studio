/**
 * Joint to Servo Mapping - AXEL Complete Robot Model
 * 
 * Maps each URDF joint name to its corresponding servo ID
 * Used by 3D visualization, control panels, and ROS interfaces
 */

export const jointServoMapping = {
  // Head & Face Joints
  'head_pan_joint': 12,
  'head_tilt_joint': 16,
  'head_roll_joint': 17,
  'eyes_pan_joint': 1, // Multichannel: servo_1-2 (left), servo_5-6 (right)
  'eyes_tilt_joint': 2,
  'jaw_joint': 9,

  // Waist/Torso Joints
  'waist_pan_joint': 38,
  'waist_roll_joint': 39,

  // Left Arm Joints
  'l_shoulder_out_joint': 18,
  'l_shoulder_lift_joint': 19,
  'l_upper_arm_roll_joint': 20,
  'l_elbow_flex_joint': 21,
  'l_wrist_roll_joint': 22,

  // Right Arm Joints
  'r_shoulder_out_joint': 23,
  'r_shoulder_lift_joint': 24,
  'r_upper_arm_roll_joint': 25,
  'r_elbow_flex_joint': 31,
  'r_wrist_roll_joint': 32,

  // Left Hand Fingers
  'l_thumb_joint': 26,
  'l_index_joint': 27,
  'l_middle_joint': 28,
  'l_ring_joint': 29,
  'l_pinky_joint': 30,

  // Right Hand Fingers
  'r_thumb_joint': 33,
  'r_index_joint': 34,
  'r_middle_joint': 35,
  'r_ring_joint': 36,
  'r_pinky_joint': 37,
} as const;

/**
 * Reverse mapping: Servo ID to Joint Name
 */
export const servoJointMapping: Record<number, string> = Object.entries(
  jointServoMapping,
).reduce((acc, [joint, servo]) => {
  acc[servo] = joint;
  return acc;
}, {} as Record<number, string>);

/**
 * Get servo ID for a joint
 */
export function getServoForJoint(jointName: string): number | undefined {
  return jointServoMapping[jointName as keyof typeof jointServoMapping];
}

/**
 * Get joint name for a servo
 */
export function getJointForServo(servoId: number): string | undefined {
  return servoJointMapping[servoId];
}

/**
 * Group servos by functional area
 */
export const servoGroups = {
  head: {
    name: 'Head',
    servos: [12, 16, 17],
    joints: ['head_pan_joint', 'head_tilt_joint', 'head_roll_joint'],
  },
  eyes: {
    name: 'Eyes',
    servos: [1, 2, 5, 6],
    joints: ['eyes_pan_joint', 'eyes_tilt_joint'],
  },
  face: {
    name: 'Face',
    servos: [3, 4, 7, 8, 9, 10, 11, 13, 14, 15],
    joints: ['jaw_joint'],
  },
  leftArm: {
    name: 'Left Arm',
    servos: [18, 19, 20, 21, 22],
    joints: [
      'l_shoulder_out_joint',
      'l_shoulder_lift_joint',
      'l_upper_arm_roll_joint',
      'l_elbow_flex_joint',
      'l_wrist_roll_joint',
    ],
  },
  leftHand: {
    name: 'Left Hand',
    servos: [26, 27, 28, 29, 30],
    joints: [
      'l_thumb_joint',
      'l_index_joint',
      'l_middle_joint',
      'l_ring_joint',
      'l_pinky_joint',
    ],
  },
  rightArm: {
    name: 'Right Arm',
    servos: [23, 24, 25, 31, 32],
    joints: [
      'r_shoulder_out_joint',
      'r_shoulder_lift_joint',
      'r_upper_arm_roll_joint',
      'r_elbow_flex_joint',
      'r_wrist_roll_joint',
    ],
  },
  rightHand: {
    name: 'Right Hand',
    servos: [33, 34, 35, 36, 37],
    joints: [
      'r_thumb_joint',
      'r_index_joint',
      'r_middle_joint',
      'r_ring_joint',
      'r_pinky_joint',
    ],
  },
  waist: {
    name: 'Waist/Torso',
    servos: [38, 39],
    joints: ['waist_pan_joint', 'waist_roll_joint'],
  },
};

export default jointServoMapping;
