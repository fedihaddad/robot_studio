/**
 * SRDF Parser Service
 * Parses Semantic Robot Description Format (SRDF) files
 * Extracts collision geometries, joint groups, and disabled collision pairs
 */

export interface DisabledCollisionPair {
  link1: string;
  link2: string;
  reason: string;
}

export interface SRDFData {
  robotName: string;
  groups: Map<string, string[]>;
  endEffectors: Map<string, { parentLink: string; group: string }>;
  disabledCollisions: DisabledCollisionPair[];
  collisionLinks: string[];
}

export class SRDFParser {
  /**
   * Parse SRDF XML string
   */
  static parse(srdfXml: string): SRDFData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(srdfXml, 'text/xml');

    if (doc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Failed to parse SRDF XML');
    }

    const robotElement = doc.documentElement;
    const robotName = robotElement.getAttribute('name') || 'robot';

    // Parse groups
    const groups = new Map<string, string[]>();
    const groupElements = robotElement.getElementsByTagName('group');
    for (let i = 0; i < groupElements.length; i++) {
      const groupEl = groupElements[i];
      const groupName = groupEl.getAttribute('name') || '';
      const joints: string[] = [];

      // Get direct joints
      const jointElements = groupEl.getElementsByTagName('joint');
      for (let j = 0; j < jointElements.length; j++) {
        const jointName = jointElements[j].getAttribute('name') || '';
        if (jointName) joints.push(jointName);
      }

      // Get links from chains
      const chainElements = groupEl.getElementsByTagName('chain');
      for (let j = 0; j < chainElements.length; j++) {
        const baseLinkAttr = chainElements[j].getAttribute('base_link') || '';
        const tipLinkAttr = chainElements[j].getAttribute('tip_link') || '';
        if (baseLinkAttr) joints.push(`chain:${baseLinkAttr}->${tipLinkAttr}`);
      }

      if (groupName) {
        groups.set(groupName, joints);
      }
    }

    // Parse end effectors
    const endEffectors = new Map<string, { parentLink: string; group: string }>();
    const eeElements = robotElement.getElementsByTagName('end_effector');
    for (let i = 0; i < eeElements.length; i++) {
      const eeEl = eeElements[i];
      const name = eeEl.getAttribute('name') || '';
      const parentLink = eeEl.getAttribute('parent_link') || '';
      const group = eeEl.getAttribute('group') || '';
      if (name) {
        endEffectors.set(name, { parentLink, group });
      }
    }

    // Parse disabled collisions
    const disabledCollisions: DisabledCollisionPair[] = [];
    const disableElements = robotElement.getElementsByTagName('disable_collisions');
    for (let i = 0; i < disableElements.length; i++) {
      const disableEl = disableElements[i];
      const link1 = disableEl.getAttribute('link1') || '';
      const link2 = disableEl.getAttribute('link2') || '';
      const reason = disableEl.getAttribute('reason') || '';
      if (link1 && link2) {
        disabledCollisions.push({ link1, link2, reason });
      }
    }

    // Extract all collision links
    const collisionLinks = new Set<string>();
    disabledCollisions.forEach(pair => {
      collisionLinks.add(pair.link1);
      collisionLinks.add(pair.link2);
    });

    return {
      robotName,
      groups,
      endEffectors,
      disabledCollisions,
      collisionLinks: Array.from(collisionLinks),
    };
  }

  /**
   * Load SRDF from URL
   */
  static async loadFromUrl(url: string): Promise<SRDFData> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch SRDF: ${response.statusText}`);
      }
      const xmlText = await response.text();
      return this.parse(xmlText);
    } catch (error) {
      throw new Error(`Failed to load SRDF from ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if collision is disabled between two links
   */
  static isCollisionDisabled(
    link1: string,
    link2: string,
    disabledCollisions: DisabledCollisionPair[]
  ): boolean {
    return disabledCollisions.some(
      pair =>
        (pair.link1 === link1 && pair.link2 === link2) ||
        (pair.link1 === link2 && pair.link2 === link1)
    );
  }
}
