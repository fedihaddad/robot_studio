/**
 * Servo Degrees Configuration - AXEL Head Servos
 * 
 * Hardware-specific min/max angles for each servo
 * Extracted from Arduino head servo controller code
 * All values in degrees (0-180)
 * 
 * Source: AXEL_Head_Servo_Controller.ino
 * Last Updated: March 30, 2026
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

  // ========== ARM SERVOS (10 servos) - Placeholder ==========
  servo_16: { name: 'Arm Servo 1', min: 0, max: 180, default: 90 },
  servo_17: { name: 'Arm Servo 2', min: 0, max: 180, default: 90 },
  servo_18: { name: 'Arm Servo 3', min: 0, max: 180, default: 90 },
  servo_19: { name: 'Arm Servo 4', min: 0, max: 180, default: 90 },
  servo_20: { name: 'Arm Servo 5', min: 0, max: 180, default: 90 },
  servo_21: { name: 'Arm Servo 6', min: 0, max: 180, default: 90 },
  servo_22: { name: 'Arm Servo 7', min: 0, max: 180, default: 90 },
  servo_23: { name: 'Arm Servo 8', min: 0, max: 180, default: 90 },
  servo_24: { name: 'Arm Servo 9', min: 0, max: 180, default: 90 },
  servo_25: { name: 'Arm Servo 10', min: 0, max: 180, default: 90 },
} as const;

/**
 * Helper function to get servo config by ID (1-25)
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
