/**
 * Inverse Kinematics (IK) Solver for AXEL Humanoid Robot
 * Converts target cartesian position (X, Y, Z) to servo angles
 * Implements analytical 2-DOF IK for arm control
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ArmConfiguration {
  name: string; // 'left_arm' or 'right_arm'
  baseServo: number; // Shoulder servo ID
  shoulderLength: number; // mm from shoulder to elbow
  forearmLength: number; // mm from elbow to wrist
  isLeftArm: boolean;
}

export interface IKSolution {
  valid: boolean;
  angles: {
    shoulder: number; // degrees
    elbow: number; // degrees
    wrist?: number; // degrees (optional)
  };
  error?: string;
  reachDistance?: number; // how far from target
}

export interface IKTarget {
  position: Vector3;
  orientation?: {
    roll?: number;
    pitch?: number;
    yaw?: number;
  };
}

export class InverseKinematicsSolver {
  private leftArm: ArmConfiguration = {
    name: 'left_arm',
    baseServo: 16,
    shoulderLength: 80, // mm - adjust based on AXEL specs
    forearmLength: 100, // mm - adjust based on AXEL specs
    isLeftArm: true,
  };

  private rightArm: ArmConfiguration = {
    name: 'right_arm',
    baseServo: 21,
    shoulderLength: 80,
    forearmLength: 100,
    isLeftArm: false,
  };

  // Joint angle limits (degrees)
  private angleLimits = {
    shoulder: { min: 0, max: 180 },
    elbow: { min: 0, max: 180 },
    wrist: { min: 0, max: 180 },
  };

  /**
   * Solve IK for target position
   * Uses analytical 2-DOF solution
   */
  solve(target: IKTarget, armConfig: ArmConfiguration): IKSolution {
    const { position } = target;

    // Extract 2D problem in the arm plane
    const a1 = armConfig.shoulderLength;
    const a2 = armConfig.forearmLength;

    // Distance from shoulder to target
    const d = Math.sqrt(position.x ** 2 + position.z ** 2);

    // Check if target is reachable
    const maxReach = a1 + a2;
    const minReach = Math.abs(a1 - a2);

    if (d > maxReach || d < minReach) {
      return {
        valid: false,
        angles: { shoulder: 90, elbow: 90 },
        error: `Target unreachable. Distance: ${d.toFixed(0)}mm, max reach: ${maxReach}mm`,
        reachDistance: d - maxReach,
      };
    }

    // Analytical IK solution using law of cosines
    const cos_elbow = (d ** 2 - a1 ** 2 - a2 ** 2) / (2 * a1 * a2);
    
    // Clamp to [-1, 1] to avoid NaN from floating point errors
    const clamped = Math.max(-1, Math.min(1, cos_elbow));
    const elbowRad = Math.acos(clamped);
    const elbow = 180 - (elbowRad * 180) / Math.PI;

    // Shoulder angle
    const k1 = a2 * Math.sin(elbowRad);
    const k2 = a1 + a2 * Math.cos(elbowRad);
    const alphaRad = Math.atan2(position.z, position.x);
    const betaRad = Math.atan2(k1, k2);
    const shoulder = ((alphaRad - betaRad) * 180) / Math.PI + 90;

    // Validate angles within limits
    const validShoulder = this.clampAngle(shoulder, this.angleLimits.shoulder);
    const validElbow = this.clampAngle(elbow, this.angleLimits.elbow);

    return {
      valid: true,
      angles: {
        shoulder: validShoulder,
        elbow: validElbow,
        wrist: 90, // Default neutral position
      },
    };
  }

  /**
   * Solve IK for left arm
   */
  solveLeftArm(target: IKTarget): IKSolution {
    return this.solve(target, this.leftArm);
  }

  /**
   * Solve IK for right arm
   */
  solveRightArm(target: IKTarget): IKSolution {
    return this.solve(target, this.rightArm);
  }

  /**
   * Forward kinematics - compute end-effector position from angles
   */
  computeForwardKinematics(
    shoulder: number,
    elbow: number,
    armConfig: ArmConfiguration
  ): Vector3 {
    const shoulderRad = (shoulder - 90) * (Math.PI / 180);
    const elbowRad = (180 - elbow) * (Math.PI / 180);

    const a1 = armConfig.shoulderLength;
    const a2 = armConfig.forearmLength;

    const x = a1 * Math.cos(shoulderRad) + a2 * Math.cos(shoulderRad + elbowRad);
    const z = a1 * Math.sin(shoulderRad) + a2 * Math.sin(shoulderRad + elbowRad);

    return { x, y: 0, z };
  }

  /**
   * Set arm configuration (link lengths)
   */
  setArmConfiguration(armName: 'left_arm' | 'right_arm', shoulder: number, forearm: number): void {
    if (armName === 'left_arm') {
      this.leftArm.shoulderLength = shoulder;
      this.leftArm.forearmLength = forearm;
    } else {
      this.rightArm.shoulderLength = shoulder;
      this.rightArm.forearmLength = forearm;
    }
  }

  /**
   * Set joint angle limits
   */
  setAngleLimits(joint: 'shoulder' | 'elbow' | 'wrist', min: number, max: number): void {
    this.angleLimits[joint] = { min, max };
  }

  /**
   * Get current angle limits
   */
  getAngleLimits(): typeof this.angleLimits {
    return this.angleLimits;
  }

  /**
   * Clamp angle to valid range
   */
  private clampAngle(angle: number, limits: { min: number; max: number }): number {
    return Math.max(limits.min, Math.min(limits.max, angle));
  }

  /**
   * Calculate distance error between target and actual position
   */
  calculateError(target: Vector3, actual: Vector3): number {
    return Math.sqrt((target.x - actual.x) ** 2 + (target.y - actual.y) ** 2 + (target.z - actual.z) ** 2);
  }
}

// Global instance
export const ikSolver = new InverseKinematicsSolver();
