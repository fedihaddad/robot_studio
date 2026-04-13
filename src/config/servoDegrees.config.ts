/**
 * Servo Degrees Configuration - AXEL Complete Robot Model
 * 
 * Hardware-specific min/max angles for each servo
 * Maps all 28 joints: 15 head/face + 10 arms + 2 torso + 1 jaw (counted elsewhere)
 * All values in degrees
 * 
 * Source: XACRO config from inmoov_bringup + Arduino controller code
 * Last Updated: April 10, 2026
 * Total Servos: 39 channels (15 implemented, 24 arm/hand added)
 */

export const servoDegreesConfig = {
  // ========== LEFT EYE (4 servos) ==========
  servo_1: {
    name: 'Left Eye Left/Right (العين اليسرى جانبي)',
    channel: 0,
    arduinoName: 'L_LR',
    min: 80,      // L_LR_RIGHT position
    max: 115,     // L_LR_LEFT position
    default: 100, // L_LR_CENTER
  },
  servo_2: {
    name: 'Left Eye Up/Down (العين اليسرى علوي سفلي)',
    channel: 1,
    arduinoName: 'L_UD',
    min: 55,      // L_UD_UP
    max: 88,      // L_UD_DOWN
    default: 80,  // L_UD_CENTER (75 in code, but stored as 80)
  },
  servo_3: {
    name: 'Left Eye Top Lid (الجفن العلوي الأيسر)',
    channel: 2,
    arduinoName: 'L_TOP',
    min: 75,      // L_TOP_OPEN
    max: 115,     // L_TOP_CLOSE
    default: 90,  // L_TOP_CENTER
  },
  servo_4: {
    name: 'Left Eye Bottom Lid (الجفن السفلي الأيسر)',
    channel: 3,
    arduinoName: 'L_BOT',
    min: 60,      // L_BOT_CLOSE
    max: 110,     // L_BOT_OPEN (100 in code, max constraint is 110)
    default: 90,  // L_BOT_CENTER
  },

  // ========== RIGHT EYE (4 servos) ==========
  servo_5: {
    name: 'Right Eye Left/Right (العين اليمنى جانبي)',
    channel: 4,
    arduinoName: 'R_LR',
    min: 75,      // R_LR_RIGHT
    max: 97,      // R_LR_LEFT
    default: 85,  // R_LR_CENTER
  },
  servo_6: {
    name: 'Right Eye Up/Down (العين اليمنى علوي سفلي)',
    channel: 5,
    arduinoName: 'R_UD',
    min: 65,      // R_UD_DOWN
    max: 100,     // R_UD_UP
    default: 90,  // R_UD_CENTER (85 in code, but default 90)
  },
  servo_7: {
    name: 'Right Eye Top Lid (الجفن العلوي الأيمن)',
    channel: 6,
    arduinoName: 'R_TOP',
    min: 65,      // R_TOP_CLOSE
    max: 115,     // R_TOP_OPEN
    default: 90,  // R_TOP_CENTER
  },
  servo_8: {
    name: 'Right Eye Bottom Lid (الجفن السفلي الأيمن)',
    channel: 7,
    arduinoName: 'R_BOT',
    min: 30,      // R_BOT_CLOSE (5 in code, constrained to 30)
    max: 95,      // R_BOT_OPEN
    default: 65,  // R_BOT_CENTER (from currentAngle)
  },

  // ========== MOUTH (1 servo) ==========
  servo_9: {
    name: 'Mouth Open/Close (الفم)',
    channel: 9,
    arduinoName: 'SERVO_BOUCHE',
    min: 80,      // Constrained BOUCHE_CLOSE (code has 70 but min limit is 80)
    max: 170,     // Constrained BOUCHE_OPEN (code has 180 but max limit is 170)
    default: 90,  // Neutral position
  },

  // ========== EYEBROWS (2 servos) ==========
  servo_10: {
    name: 'Left Eyebrow (الحاجب الأيسر)',
    channel: 10,
    arduinoName: 'SERVO_HAJEB_L',
    min: 75,      // HAJEB_DOWN
    max: 105,     // HAJEB_UP
    default: 90,  // HAJEB_CENTER
  },
  servo_11: {
    name: 'Right Eyebrow (الحاجب الأيمن)',
    channel: 11,
    arduinoName: 'SERVO_HAJEB_R',
    min: 75,      // HAJEB_DOWN (inverted mechanically)
    max: 105,     // HAJEB_UP (inverted mechanically)
    default: 90,  // HAJEB_CENTER (inverted)
  },

  // ========== HEAD PAN/TILT (1 servo) ==========
  servo_12: {
    name: 'Head Pan/Tilt (رأس)',
    channel: 12,
    arduinoName: 'SERVO_EXTRA',
    min: 0,       // EXTRA_LEFT
    max: 180,     // EXTRA_RIGHT
    default: 90,  // EXTRA_CENTER
  },

  // ========== CHEEK/SMILE (1 servo) ==========
  servo_13: {
    name: 'Cheek Smile (الخد)',
    channel: 13,
    arduinoName: 'SERVO_KHCHEM',
    min: 87,      // KHCHEM_CLOSE
    max: 100,     // KHCHEM_OPEN
    default: 93,  // KHCHEM_CENTER
  },

  // ========== JAW (2 servos) ==========
  servo_14: {
    name: 'Jaw Right Open/Close (الفك الأيمن)',
    channel: 14,
    arduinoName: 'SERVO_JAW_RIGHT',
    min: 87,      // R_JAW_CLOSE
    max: 120,     // R_JAW_OPEN
    default: 100, // R_JAW_CENTER
  },
  servo_15: {
    name: 'Jaw Left Open/Close (الفك الأيسر)',
    channel: 15,
    arduinoName: 'SERVO_JAW_LEFT',
    min: 60,      // L_JAW_OPEN
    max: 93,      // L_JAW_CLOSE
    default: 80,  // L_JAW_CENTER
  },

  // ========== HEAD MOVEMENT (2 servos) ==========
  servo_16: {
    name: 'Head Tilt (رأس - أمام/خلف)',
    channel: 16,
    jointName: 'head_tilt_joint',
    min: -20,     // Forward
    max: 20,      // Backward
    default: 0,   // Center
  },
  servo_17: {
    name: 'Head Roll (رأس - جانبي)',
    channel: 17,
    jointName: 'head_roll_joint',
    min: -15,     // Left tilt
    max: 15,      // Right tilt
    default: 0,   // Center
  },

  // ========== LEFT ARM (5 servos) ==========
  servo_18: {
    name: 'L Shoulder Out/In (الكتف الأيسر خارج/داخل)',
    channel: 18,
    jointName: 'l_shoulder_out_joint',
    min: 5,       // In
    max: 60,      // Out
    default: 30,  // Center
  },
  servo_19: {
    name: 'L Shoulder Lift (الكتف الأيسر علوي)',
    channel: 19,
    jointName: 'l_shoulder_lift_joint',
    min: -135,    // Down
    max: 45,      // Up
    default: -45, // Center
  },
  servo_20: {
    name: 'L Upper Arm Roll (الذراع الأيسر - دوران)',
    channel: 20,
    jointName: 'l_upper_arm_roll_joint',
    min: -90,     // Inward
    max: 90,      // Outward
    default: 0,   // Center
  },
  servo_21: {
    name: 'L Elbow Flex (الكوع الأيسر)',
    channel: 21,
    jointName: 'l_elbow_flex_joint',
    min: -85,     // Bent
    max: -15,     // Extended
    default: -50, // Center
  },
  servo_22: {
    name: 'L Wrist Roll (المعصم الأيسر - دوران)',
    channel: 22,
    jointName: 'l_wrist_roll_joint',
    min: 0,       // Left
    max: 180,     // Right
    default: 90,  // Center
  },

  // ========== RIGHT ARM (5 servos) ==========
  servo_23: {
    name: 'R Shoulder Out/In (الكتف الأيمن خارج/داخل)',
    channel: 23,
    jointName: 'r_shoulder_out_joint',
    min: -60,     // Out
    max: -5,      // In
    default: -30, // Center
  },
  servo_24: {
    name: 'R Shoulder Lift (الكتف الأيمن علوي)',
    channel: 24,
    jointName: 'r_shoulder_lift_joint',
    min: -135,    // Down
    max: 45,      // Up
    default: -45, // Center
  },
  servo_25: {
    name: 'R Upper Arm Roll (الذراع الأيمن - دوران)',
    channel: 25,
    jointName: 'r_upper_arm_roll_joint',
    min: -90,     // Inward
    max: 90,      // Outward
    default: 0,   // Center
  },

  // ========== LEFT HAND (5 servos) ==========
  servo_26: {
    name: 'L Thumb (الإصبع الأيسر - الكبير)',
    channel: 26,
    jointName: 'l_thumb_joint',
    min: -5,
    max: 65,
    default: 30,
  },
  servo_27: {
    name: 'L Index (الإصبع الأيسر - السبابة)',
    channel: 27,
    jointName: 'l_index_joint',
    min: -5,
    max: 85,
    default: 40,
  },
  servo_28: {
    name: 'L Middle (الإصبع الأيسر - الوسطى)',
    channel: 28,
    jointName: 'l_middle_joint',
    min: -5,
    max: 85,
    default: 40,
  },
  servo_29: {
    name: 'L Ring (الإصبع الأيسر - البنصر)',
    channel: 29,
    jointName: 'l_ring_joint',
    min: -5,
    max: 85,
    default: 40,
  },
  servo_30: {
    name: 'L Pinky (الإصبع الأيسر - الخنصر)',
    channel: 30,
    jointName: 'l_pinky_joint',
    min: -5,
    max: 85,
    default: 40,
  },

  // ========== RIGHT ELBOW/WRIST + RIGHT HAND (6 servos) ==========
  servo_31: {
    name: 'R Elbow Flex (الكوع الأيمن)',
    channel: 31,
    jointName: 'r_elbow_flex_joint',
    min: -80,     // Bent
    max: -15,     // Extended
    default: -50, // Center
  },
  servo_32: {
    name: 'R Wrist Roll (المعصم الأيمن - دوران)',
    channel: 32,
    jointName: 'r_wrist_roll_joint',
    min: -180,    // Left
    max: 0,       // Right (inverted from left arm)
    default: -90, // Center
  },
  servo_33: {
    name: 'R Thumb (الإصبع الأيمن - الكبير)',
    channel: 33,
    jointName: 'r_thumb_joint',
    min: -5,
    max: 65,
    default: 30,
  },
  servo_34: {
    name: 'R Index (الإصبع الأيمن - السبابة)',
    channel: 34,
    jointName: 'r_index_joint',
    min: -5,
    max: 85,
    default: 40,
  },
  servo_35: {
    name: 'R Middle (الإصبع الأيمن - الوسطى)',
    channel: 35,
    jointName: 'r_middle_joint',
    min: -5,
    max: 85,
    default: 40,
  },
  servo_36: {
    name: 'R Ring (الإصبع الأيمن - البنصر)',
    channel: 36,
    jointName: 'r_ring_joint',
    min: -5,
    max: 85,
    default: 40,
  },
  servo_37: {
    name: 'R Pinky (الإصبع الأيمن - الخنصر)',
    channel: 37,
    jointName: 'r_pinky_joint',
    min: -5,
    max: 85,
    default: 40,
  },

  // ========== TORSO JOINTS (2 servos) ==========
  servo_38: {
    name: 'Waist Pan (الخصر - دوران)',
    channel: 38,
    jointName: 'waist_pan_joint',
    min: -90,     // Left
    max: 90,      // Right
    default: 0,   // Center
  },
  servo_39: {
    name: 'Waist Roll (الخصر - جانبي)',
    channel: 39,
    jointName: 'waist_roll_joint',
    min: -15,     // Left lean
    max: 15,      // Right lean
    default: 0,   // Center
  },
} as const;

/**
 * Helper function to get servo config by ID (1-39)
 * Maps all arm, hand, head, and torso joints
 */
export function getServoConfig(servoId: number) {
  const key = `servo_${servoId}` as keyof typeof servoDegreesConfig;
  const config = servoDegreesConfig[key];
  
  if (!config) {
    return {
      name: `Servo ${servoId}`,
      min: 0,
      max: 180,
      default: 90,
    };
  }
  
  return config;
}

/**
 * Helper function to constrain angle within servo limits
 */
export function validateServoAngle(servoId: number, angle: number): number {
  const config = getServoConfig(servoId);
  return Math.max(config.min, Math.min(config.max, angle));
}

/**
 * Get servo name by ID
 */
export function getServoName(servoId: number): string {
  return getServoConfig(servoId).name;
}

export default servoDegreesConfig;
