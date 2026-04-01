/**
 * Servo-to-Mesh Mapping Configuration
 * Maps servo IDs and URDF joints to STL mesh files with proper positioning
 * Based on InMoov robot URDF structure and servo hardware configuration
 */

export interface MeshConfig {
  name: string;
  stlFile: string;
  parentJoint?: string; // Parent URDF joint name
  servoId?: number; // Associated servo ID (if animated)
  color?: number;
  scale?: number; // Scale multiplier for STL (default 1.0)
  offset?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  visible?: boolean;
}

export interface JointMeshMap {
  [jointName: string]: MeshConfig;
}

// Comprehensive mesh configuration for InMoov head with all components
export const headMeshConfig: JointMeshMap = {
  // ========== BASE STRUCTURE ==========
  head_base_link: {
    name: 'Head Base (Support)',
    stlFile: '/meshes/head_base.stl',
    color: 0xE8E8E8,
    visible: true,
  },

  // ========== MAIN HEAD COMPONENTS ==========
  head_link: {
    name: 'Head Main',
    stlFile: '/meshes/head.stl',
    parentJoint: 'head_pan_joint',
    servoId: 12, // Head pan servo
    color: 0xE8E8E8,
    visible: true,
  },

  face_link: {
    name: 'Face',
    stlFile: '/meshes/face.stl',
    color: 0xF5F5F5,
    offset: { x: 0, y: 0, z: 0 },
    visible: true,
  },

  skull_link: {
    name: 'Skull',
    stlFile: '/meshes/skull.stl',
    parentJoint: 'skull_joint',
    color: 0xE0E0E0,
    offset: { x: 0.044, y: 0, z: -0.0245 },
    visible: true,
  },

  // ========== EARS ==========
  left_ear_link: {
    name: 'Left Ear',
    stlFile: '/meshes/earleftv1.stl',
    color: 0xE8E8E8,
    offset: { x: 0.035, y: 0.056, z: 0.0437 },
    visible: true,
  },

  right_ear_link: {
    name: 'Right Ear',
    stlFile: '/meshes/earrightv1.stl',
    color: 0xE8E8E8,
    offset: { x: 0.035, y: -0.056, z: 0.0437 },
    visible: true,
  },

  // ========== JAW ==========
  jaw_link: {
    name: 'Jaw',
    stlFile: '/meshes/jaw.stl',
    parentJoint: 'jaw_joint',
    servoId: 14, // Jaw servo (14-15 for left/right)
    color: 0xE0E0E0,
    offset: { x: 0.036, y: 0.001, z: 0.042 },
    rotation: { x: 0, y: 0.08, z: 0 },
    visible: true,
  },

  // ========== EYEGLASS ==========
  eyeglass_link: {
    name: 'Eyeglass',
    stlFile: '/meshes/EyeglassV4.stl',
    color: 0xF5F5F5,
    offset: { x: 0.131, y: 0.001, z: 0.076 },
    rotation: { x: 9.43, y: 0.01, z: -1.6 },
    visible: true,
  },

  // ========== EYE SYSTEM - Support Structures ==========
  eyesupport_link: {
    name: 'Eyes Support (Central)',
    stlFile: '/meshes/eyesupport.stl',
    color: 0xD0D0D0,
    offset: { x: 0, y: 0, z: 0 },
    visible: false, // HIDE - creating internal clutter
  },

  // ========== LEFT EYE ==========
  l_eyesupport_link: {
    name: 'Left Eye Support',
    stlFile: '/meshes/l_eyesupport.stl',
    parentJoint: 'l_eye_pan_joint',
    servoId: 1, // Left eye pan (servo 1-2)
    color: 0xC8C8C8,
    offset: { x: 0.126, y: -0.03, z: 0.040 },
    visible: false, // HIDE internal support
  },

  l_eye_link: {
    name: 'Left Eye (Eyeball)',
    stlFile: '/meshes/eye.stl',
    color: 0xFFFFFF,
    scale: 0.001, // Original size
    offset: { x: 0.126, y: -0.03, z: 0.042 },
    visible: true,
  },

  l_iris_link: {
    name: 'Left Iris',
    stlFile: '/meshes/iris.stl',
    color: 0x0066FF,
    scale: 0.001, // Original size
    offset: { x: 0.128, y: -0.03, z: 0.044 },
    visible: true,
  },

  l_pupil_link: {
    name: 'Left Pupil',
    stlFile: '/meshes/iris.stl',
    color: 0x000000, // Black pupil
    scale: 0.0007, // Smaller than iris (~70% of iris size)
    offset: { x: -0.013, y: -0.028, z: 0.022 },
    visible: false, // Hide pupils for now
  },

  l_camera_link: {
    name: 'Left Camera',
    stlFile: '/meshes/camera.stl',
    color: 0x1a1a1a,
    offset: { x: -0.020, y: -0.028, z: 0.008 },
    visible: false, // Usually hidden
  },

  // ========== RIGHT EYE ==========
  r_eyesupport_link: {
    name: 'Right Eye Support',
    stlFile: '/meshes/r_eyesupport.stl',
    parentJoint: 'eyes_pan_joint',
    servoId: 5, // Right eye pan (servo 5-6)
    color: 0xC8C8C8,
    offset: { x: 0.126, y: 0.03, z: 0.040 },
    visible: false, // HIDE internal support
  },

  r_eye_link: {
    name: 'Right Eye (Eyeball)',
    stlFile: '/meshes/eye.stl',
    color: 0xFFFFFF,
    scale: 0.001, // Original size
    offset: { x: 0.126, y: 0.03, z: 0.042 },
    visible: true,
  },

  r_iris_link: {
    name: 'Right Iris',
    stlFile: '/meshes/iris.stl',
    color: 0x0066FF,
    scale: 0.001, // Original size
    offset: { x: 0.128, y: 0.03, z: 0.044 },
    visible: true,
  },

  r_pupil_link: {
    name: 'Right Pupil',
    stlFile: '/meshes/iris.stl',
    color: 0x000000, // Black pupil
    scale: 0.0007, // Smaller than iris (~70% of iris size)
    offset: { x: -0.013, y: 0.028, z: 0.022 },
    visible: false, // Hide pupils for now
  },

  r_camera_link: {
    name: 'Right Camera',
    stlFile: '/meshes/camera.stl',
    color: 0x1a1a1a,
    offset: { x: -0.020, y: 0.028, z: 0.008 },
    visible: false,
  },

  // ========== FACIAL FEATURES - NON-RIGID ANIMATIONS ==========
  // These components animate but don't have URDF joint definitions
  // They're controlled directly by servo values

  eyebrow_left_link: {
    name: 'Left Eyebrow',
    stlFile: '/meshes/EyebrowV3.stl',
    servoId: 10, // Left eyebrow servo
    color: 0x505050,
    offset: { x: -0.022, y: -0.015, z: 0.008 },
    visible: true,
  },

  eyebrow_right_link: {
    name: 'Right Eyebrow',
    stlFile: '/meshes/EyebrowV3.stl',
    servoId: 11, // Right eyebrow servo (inverted)
    color: 0x505050,
    offset: { x: -0.022, y: 0.015, z: 0.008 },
    rotation: { x: 0, y: 0, z: Math.PI }, // Flipped for right side
    visible: true,
  },

  cheek_link: {
    name: 'Cheek Puller',
    stlFile: '/meshes/CheekPullerV3.stl',
    servoId: 13, // Cheek servo
    color: 0xD8D8D8,
    offset: { x: 0.002, y: 0.028, z: 0.005 },
    visible: true,
  },

  // ========== EYE LIDS & SUPPORT STRUCTURES ==========
  // Note: Eye lids (servo 3-4, 7-8) don't have dedicated meshes in current config
  // They're typically integrated into eyesupport structure or use visibility toggling

  forehead_support_left: {
    name: 'Forehead Support Left',
    stlFile: '/meshes/ForHeadSupportV2.stl',
    color: 0xD0D0D0,
    offset: { x: -0.015, y: -0.015, z: 0.016 },
    visible: false, // STEP 2: Eye cage
  },

  forehead_support_right: {
    name: 'Forehead Support Right',
    stlFile: '/meshes/ForHeadSupportV2.stl',
    color: 0xD0D0D0,
    offset: { x: -0.015, y: 0.015, z: 0.016 },
    rotation: { x: 0, y: 0, z: Math.PI },
    visible: false, // STEP 2: Eye cage
  },

  forehead_top: {
    name: 'Forehead (Top)',
    stlFile: '/meshes/ForHeadsV4.stl',
    color: 0xE8E8E8,
    offset: { x: -0.025, y: 0, z: 0.020 },
    visible: false, // STEP 2: Eye cage
  },

  // ========== OPTIONAL STRUCTURAL COMPONENTS ==========
  // These are structural elements that support the head assembly

  eye_base_left: {
    name: 'Eye Base Left',
    stlFile: '/meshes/Eye-L-BaseV5.stl',
    color: 0xD0D0D0,
    offset: { x: -0.010, y: -0.030, z: 0.008 },
    visible: false, // REMOVED - wait for step 2
  },

  eye_base_right: {
    name: 'Eye Base Right',
    stlFile: '/meshes/Eye-R-BaseV5.stl',
    color: 0xD0D0D0,
    offset: { x: -0.010, y: 0.030, z: 0.008 },
    visible: false, // REMOVED - wait for step 2
  },

  eyebrow_support_left: {
    name: 'Left Eyebrow Support Bracket',
    stlFile: '/meshes/EyebrowSupportV3.stl',
    color: 0x3a3a3a,
    offset: { x: -0.020, y: -0.018, z: 0.012 },
    visible: false, // REMOVED - wait for step
  },

  eyebrow_support_right: {
    name: 'Right Eyebrow Support Bracket',
    stlFile: '/meshes/EyebrowSupportV3.stl',
    color: 0x3a3a3a,
    offset: { x: -0.020, y: 0.018, z: 0.012 },
    rotation: { x: 0, y: 0, z: Math.PI },
    visible: false, // REMOVED - wait for step
  },

  jaw_hinge: {
    name: 'Jaw Hinge Mechanism',
    stlFile: '/meshes/JawHingeV4.stl',
    color: 0x1a1a1a,
    offset: { x: -0.005, y: 0, z: 0.008 },
    visible: false, // Hide internal mechanism
  },

  jaw_support: {
    name: 'Jaw Support Structure',
    stlFile: '/meshes/JawSupportV2.stl',
    color: 0x2a2a2a,
    offset: { x: -0.010, y: 0, z: 0.015 },
    visible: false, // Hide internal support
  },

  teeth_top_holder: {
    name: 'Top Teeth/Lip Holder',
    stlFile: '/meshes/TeethTopHolderV3.stl',
    color: 0xC8C8C8,
    offset: { x: -0.015, y: 0, z: 0.015 },
    visible: false, // Hide internal
  },

  upper_lip: {
    name: 'Upper Lip Structure',
    stlFile: '/meshes/UpperLipV2.stl',
    color: 0xD8D8D8,
    offset: { x: -0.018, y: 0, z: 0.018 },
    visible: false, // Hide - displacing face
  },

  ring_support: {
    name: 'Ring Support Structure',
    stlFile: '/meshes/RingV2.stl',
    color: 0x1a1a1a,
    offset: { x: 0.025, y: 0, z: 0 },
    visible: false, // Hide backend support
  },

  main_gear: {
    name: 'Main Gear Support',
    stlFile: '/meshes/MainGearV2.stl',
    color: 0x3a3a3a,
    offset: { x: 0.02, y: 0, z: -0.01 },
    visible: false, // Hide backend mechanism
  },

  servo_gear: {
    name: 'Servo Gear',
    stlFile: '/meshes/ServoGearV2.stl',
    color: 0x505050,
    offset: { x: 0.015, y: 0, z: -0.02 },
    visible: false, // Hide backend mechanism
  },

  servo_adapter: {
    name: 'Servo Adapter',
    stlFile: '/meshes/servoAdapterV1.stl',
    color: 0x4a4a4a,
    offset: { x: 0.02, y: 0, z: 0.01 },
    visible: false, // Hide backend mechanism
  },

  gear_holder: {
    name: 'Gear Holder',
    stlFile: '/meshes/GearHolderV3.stl',
    color: 0x3a3a3a,
    offset: { x: 0.015, y: 0, z: -0.025 },
    visible: false, // Hide backend support
  },

  // Virtual placeholder for reference
  virtual_link: {
    name: 'Virtual Reference',
    stlFile: '/meshes/virtual.stl',
    color: 0x00FF00,
    visible: false,
  },
};

/**
 * Get mesh configuration by joint name
 */
export function getMeshConfig(jointName: string): MeshConfig | undefined {
  return headMeshConfig[jointName];
}

/**
 * Get all servo-associated joints
 */
export function getServoJoints(): Map<number, string[]> {
  const servoJoints = new Map<number, string[]>();

  Object.entries(headMeshConfig).forEach(([jointName, config]) => {
    if (config.servoId) {
      if (!servoJoints.has(config.servoId)) {
        servoJoints.set(config.servoId, []);
      }
      servoJoints.get(config.servoId)!.push(jointName);
    }
  });

  return servoJoints;
}

/**
 * Servo ID to URDF Joint Name mapping
 * For animating the 3D model based on servo commands
 * Based on Arduino head servo controller configuration
 */
export const servoToJointMap: { [servoId: number]: string[] } = {
  // LEFT EYE (Servos 1-4)
  1: ['l_eye_pan_joint'], // Left eye L/R pan
  2: ['eyes_tilt_joint'], // Both eyes U/D tilt (shared joint)
  3: ['l_eye_lid_top'], // Left eye top lid (visual only)
  4: ['l_eye_lid_bottom'], // Left eye bottom lid (visual only)

  // RIGHT EYE (Servos 5-8)
  5: ['eyes_pan_joint'], // Right eye L/R pan
  6: ['eyes_tilt_joint'], // Both eyes U/D tilt (shared with servo 2)
  7: ['r_eye_lid_top'], // Right eye top lid (visual only)
  8: ['r_eye_lid_bottom'], // Right eye bottom lid (visual only)

  // MOUTH & FACIAL (Servos 9-13)
  9: ['mouth_joint'], // Mouth open/close (visual only)
  10: ['eyebrow_left_joint'], // Left eyebrow (visual only)
  11: ['eyebrow_right_joint'], // Right eyebrow (visual only, inverted)
  12: ['head_pan_joint'], // Head pan L/R rotation
  13: ['cheek_joint'], // Cheek puller (visual only)

  // JAW (Servos 14-15)
  14: ['jaw_joint'], // Jaw L/R component
  15: ['jaw_joint'], // Jaw L/R component
};

/**
 * URDF Joint constraints and animation properties
 */
export const jointProperties: { [jointName: string]: { lower: number; upper: number; axis: 'x' | 'y' | 'z' } } = {
  // Eye movement joints
  eyes_tilt_joint: { lower: -0.5236, upper: 0.5236, axis: 'y' }, // ±30° vertical
  eyes_pan_joint: { lower: -0.7854, upper: 0.7854, axis: 'z' }, // ±45° horizontal (right)
  l_eye_pan_joint: { lower: -0.7854, upper: 0.7854, axis: 'z' }, // ±45° horizontal (left)
  
  // Head control
  head_pan_joint: { lower: 0, upper: 3.14159, axis: 'z' }, // 0-180° rotation
  
  // Jaw control
  jaw_joint: { lower: 0, upper: 0.5236, axis: 'y' }, // 0-30° open
  
  // Visual-only joints (for non-URDF servo animations)
  l_eye_lid_top: { lower: 0, upper: 0.7854, axis: 'x' }, // Top eyelid
  l_eye_lid_bottom: { lower: 0, upper: 0.7854, axis: 'x' }, // Bottom eyelid
  r_eye_lid_top: { lower: 0, upper: 0.7854, axis: 'x' }, // Top eyelid
  r_eye_lid_bottom: { lower: 0, upper: 0.7854, axis: 'x' }, // Bottom eyelid
  mouth_joint: { lower: 0, upper: 1.5708, axis: 'y' }, // 0-90° open
  eyebrow_left_joint: { lower: -0.5236, upper: 0.5236, axis: 'x' }, // ±30° brow
  eyebrow_right_joint: { lower: -0.5236, upper: 0.5236, axis: 'x' }, // ±30° brow (inverted)
  cheek_joint: { lower: 0, upper: 0.3491, axis: 'z' }, // 0-20° pucker
};
