/**
 * URDF Loader and Parser
 * Handles loading and parsing URDF robot description files
 * Prepares robot structure for Three.js visualization
 */

export interface URDFLink {
  name: string;
  inertia?: {
    mass: number;
  };
  geometry?: {
    type: 'box' | 'cylinder' | 'sphere' | 'mesh';
    dimensions?: {
      x?: number;
      y?: number;
      z?: number;
      radius?: number;
      length?: number;
    };
    filename?: string;
    scale?: [number, number, number];
  };
  origin?: {
    xyz: [number, number, number];
    rpy: [number, number, number];
  };
}

export interface URDFJoint {
  name: string;
  type: string;
  parent: string;
  child: string;
  origin?: {
    xyz: [number, number, number];
    rpy: [number, number, number];
  };
  axis?: {
    xyz: [number, number, number];
  };
  limit?: {
    lower: number;
    upper: number;
    effort: number;
    velocity: number;
  };
}

export interface URDFRobot {
  name: string;
  links: URDFLink[];
  joints: URDFJoint[];
}

/**
 * Load URDF from file or string
 */
export async function loadURDF(source: string | File): Promise<URDFRobot> {
  let xmlString: string;

  if (typeof source === 'string') {
    // Assume it's a file path or URL
    const response = await fetch(source);
    xmlString = await response.text();
  } else {
    // It's a File object
    xmlString = await source.text();
  }

  return parseURDF(xmlString);
}

/**
 * Parse URDF XML string
 */
export function parseURDF(xmlString: string): URDFRobot {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Failed to parse URDF XML');
  }

  const robotElement = xmlDoc.querySelector('robot');
  if (!robotElement) {
    throw new Error('No robot element found in URDF');
  }

  const robot: URDFRobot = {
    name: robotElement.getAttribute('name') || 'robot',
    links: parseLinks(xmlDoc),
    joints: parseJoints(xmlDoc),
  };

  return robot;
}

/**
 * Parse all links from URDF
 */
function parseLinks(xmlDoc: Document): URDFLink[] {
  const links: URDFLink[] = [];
  const linkElements = xmlDoc.querySelectorAll('link');

  linkElements.forEach((linkElement) => {
    const link: URDFLink = {
      name: linkElement.getAttribute('name') || '',
    };

    // Parse inertia
    const inertial = linkElement.querySelector('inertial');
    if (inertial) {
      const mass = inertial.querySelector('mass');
      if (mass) {
        link.inertia = {
          mass: parseFloat(mass.getAttribute('value') || '1'),
        };
      }
    }

    // Parse geometry
    const visual = linkElement.querySelector('visual');
    if (visual) {
      const geometry = visual.querySelector('geometry');
      if (geometry) {
        const box = geometry.querySelector('box');
        const cylinder = geometry.querySelector('cylinder');
        const sphere = geometry.querySelector('sphere');
        const mesh = geometry.querySelector('mesh');

        if (box) {
          link.geometry = {
            type: 'box',
            dimensions: parseVector(box.getAttribute('size')),
          };
        } else if (cylinder) {
          link.geometry = {
            type: 'cylinder',
            dimensions: {
              radius: parseFloat(cylinder.getAttribute('radius') || '0.1'),
              length: parseFloat(cylinder.getAttribute('length') || '0.5'),
            },
          };
        } else if (sphere) {
          link.geometry = {
            type: 'sphere',
            dimensions: {
              radius: parseFloat(sphere.getAttribute('radius') || '0.1'),
            },
          };
        } else if (mesh) {
          link.geometry = {
            type: 'mesh',
            filename: mesh.getAttribute('filename') || '',
            scale: parseVector(mesh.getAttribute('scale') || '1 1 1') as [number, number, number],
          };
        }
      }

      // Parse origin
      const origin = visual.querySelector('origin');
      if (origin) {
        link.origin = {
          xyz: parseVector(origin.getAttribute('xyz')) as [number, number, number],
          rpy: parseVector(origin.getAttribute('rpy')) as [number, number, number],
        };
      }
    }

    links.push(link);
  });

  return links;
}

/**
 * Parse all joints from URDF
 */
function parseJoints(xmlDoc: Document): URDFJoint[] {
  const joints: URDFJoint[] = [];
  const jointElements = xmlDoc.querySelectorAll('joint');

  jointElements.forEach((jointElement) => {
    const joint: URDFJoint = {
      name: jointElement.getAttribute('name') || '',
      type: jointElement.getAttribute('type') || 'fixed',
      parent: jointElement.querySelector('parent')?.getAttribute('link') || '',
      child: jointElement.querySelector('child')?.getAttribute('link') || '',
    };

    // Parse origin
    const origin = jointElement.querySelector('origin');
    if (origin) {
      joint.origin = {
        xyz: parseVector(origin.getAttribute('xyz')) as [number, number, number],
        rpy: parseVector(origin.getAttribute('rpy')) as [number, number, number],
      };
    }

    // Parse axis
    const axis = jointElement.querySelector('axis');
    if (axis) {
      joint.axis = {
        xyz: parseVector(axis.getAttribute('xyz')) as [number, number, number],
      };
    }

    // Parse limits
    const limit = jointElement.querySelector('limit');
    if (limit) {
      joint.limit = {
        lower: parseFloat(limit.getAttribute('lower') || '0'),
        upper: parseFloat(limit.getAttribute('upper') || '0'),
        effort: parseFloat(limit.getAttribute('effort') || '0'),
        velocity: parseFloat(limit.getAttribute('velocity') || '0'),
      };
    }

    joints.push(joint);
  });

  return joints;
}

/**
 * Parse space-separated values into array of numbers
 */
function parseVector(
  value: string | null,
  defaultValue: number = 0
): number[] {
  if (!value) {
    return [defaultValue, defaultValue, defaultValue];
  }

  return value
    .trim()
    .split(/\s+/)
    .map((v) => parseFloat(v) || defaultValue);
}

/**
 * Convert URDF rotation (RPY) to radians
 */
export function rpyToRadians(
  rpy: [number, number, number]
): [number, number, number] {
  return [rpy[0] * (Math.PI / 180), rpy[1] * (Math.PI / 180), rpy[2] * (Math.PI / 180)];
}

/**
 * Map URDF joint limits to servo config
 */
export function mapJointLimits(
  joints: URDFJoint[]
): Record<string, { min: number; max: number; default: number }> {
  const config: Record<string, { min: number; max: number; default: number }> = {};

  joints.forEach((joint) => {
    if (joint.limit) {
      config[joint.name] = {
        min: joint.limit.lower * (180 / Math.PI), // Convert to degrees
        max: joint.limit.upper * (180 / Math.PI),
        default: ((joint.limit.lower + joint.limit.upper) / 2) * (180 / Math.PI),
      };
    }
  });

  return config;
}
