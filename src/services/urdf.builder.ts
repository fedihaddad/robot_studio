import * as THREE from 'three';
import { URDFRobot, URDFLink, URDFJoint } from './urdf.loader';

/**
 * STL File Loader - Loads binary STL geometry
 */
export class STLLoader {
  static async load(url: string): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      console.log(`[STLLoader] Fetching: ${url}`);
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          console.log(`[STLLoader] Loaded: ${url}`);
          return response.arrayBuffer();
        })
        .then((buffer) => {
          try {
            const geometry = STLLoader.parseSTL(buffer);
            geometry.computeVertexNormals();
            console.log(`[STLLoader] Parsed: ${url} (vertices: ${geometry.attributes.position.count})`);
            resolve(geometry);
          } catch (error) {
            console.error(`[STLLoader] Parse error for ${url}:`, error);
            reject(new Error(`Failed to parse STL: ${error}`));
          }
        })
        .catch((error) => {
          console.error(`[STLLoader] Fetch error for ${url}:`, error);
          reject(error);
        });
    });
  }

  private static parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry {
    const view = new DataView(buffer);
    const isASCII = STLLoader.isASCIISTL(buffer);

    if (isASCII) {
      return STLLoader.parseASCII(new TextDecoder().decode(buffer));
    } else {
      return STLLoader.parseBinary(buffer);
    }
  }

  private static isASCIISTL(buffer: ArrayBuffer): boolean {
    const view = new Uint8Array(buffer);
    const header = new TextDecoder().decode(view.subarray(0, 5));
    return header === 'solid';
  }

  private static parseBinary(arrayBuffer: ArrayBuffer): THREE.BufferGeometry {
    const view = new DataView(arrayBuffer);
    const faces = view.getUint32(80, true);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];

    let offset = 84;
    for (let i = 0; i < faces; i++) {
      const nx = view.getFloat32(offset, true);
      offset += 4;
      const ny = view.getFloat32(offset, true);
      offset += 4;
      const nz = view.getFloat32(offset, true);
      offset += 4;

      // Skip vertex data for now
      for (let j = 0; j < 3; j++) {
        const x = view.getFloat32(offset, true);
        vertices.push(x);
        offset += 4;
        const y = view.getFloat32(offset, true);
        vertices.push(y);
        offset += 4;
        const z = view.getFloat32(offset, true);
        vertices.push(z);
        offset += 4;

        normals.push(nx, ny, nz);
      }

      offset += 2; // Skip attribute byte count
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), 3)
    );

    return geometry;
  }

  private static parseASCII(data: string): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];

    const patternNormal = /normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;
    const patternVertex = /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;

    let normalMatch;
    let currentNormal = [0, 0, 1];

    while ((normalMatch = patternNormal.exec(data))) {
      currentNormal = [
        parseFloat(normalMatch[1]),
        parseFloat(normalMatch[3]),
        parseFloat(normalMatch[5]),
      ];
    }

    let vertexMatch;
    while ((vertexMatch = patternVertex.exec(data))) {
      vertices.push(parseFloat(vertexMatch[1]), parseFloat(vertexMatch[3]), parseFloat(vertexMatch[5]));
      normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), 3)
    );
    geometry.computeVertexNormals();

    return geometry;
  }
}

/**
 * URDF to Three.js Scene Builder
 */
export class URDFBuilder {
  private urdf: URDFRobot;
  private scene: THREE.Group;
  private linkMeshes: Map<string, THREE.Group> = new Map();
  private jointObjects: Map<string, THREE.Group> = new Map();
  private onProgress?: (msg: string) => void;

  constructor(urdf: URDFRobot, onProgress?: (msg: string) => void) {
    this.urdf = urdf;
    this.scene = new THREE.Group();
    this.scene.name = urdf.name;
    this.onProgress = onProgress;
  }

  /**
   * Build the Three.js scene from URDF
   */
  async build(): Promise<THREE.Group> {
    try {
      // Step 1: Create mesh groups for all links
      this.log('Creating link geometries...');
      await this.createLinkMeshes();

      // Step 2: Build kinematic hierarchy
      this.log('Building kinematic hierarchy...');
      this.buildKinematicTree();

      this.log('✓ URDF scene built successfully');
      return this.scene;
    } catch (error) {
      this.log(`✗ Error building URDF scene: ${error}`);
      throw error;
    }
  }

  /**
   * Create Three.js meshes for each link in the URDF
   */
  private async createLinkMeshes(): Promise<void> {
    for (const link of this.urdf.links) {
      const linkGroup = new THREE.Group();
      linkGroup.name = link.name;

      try {
        if (link.geometry?.type === 'mesh' && link.geometry.filename) {
          this.log(`Loading mesh: ${link.name} from ${link.geometry.filename}`);
          
          const meshPath = this.resolveMeshPath(link.geometry.filename);
          this.log(`Resolved path: ${meshPath}`);
          const geometry = await STLLoader.load(meshPath);
          
          const material = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            emissive: 0x1a1a1a,
            shininess: 100,
            side: THREE.DoubleSide,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Apply scale from URDF geometry
          if (link.geometry.scale) {
            const [sx, sy, sz] = link.geometry.scale;
            mesh.scale.set(sx, sy, sz);
            this.log(`Applied scale: ${sx} ${sy} ${sz}`);
          }

          this.applyVisualOrigin(mesh, link);

          linkGroup.add(mesh);
          this.log(`✓ Loaded: ${link.name}`);
        } else if (link.geometry?.type === 'box') {
          // Create placeholder box geometry
          const dims = link.geometry.dimensions || {};
          const geometry = new THREE.BoxGeometry(
            dims.x || 0.1,
            dims.y || 0.1,
            dims.z || 0.1
          );
          const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
          const mesh = new THREE.Mesh(geometry, material);
          this.applyVisualOrigin(mesh, link);
          linkGroup.add(mesh);
        } else if (link.geometry?.type === 'cylinder') {
          const dims = link.geometry.dimensions || {};
          const geometry = new THREE.CylinderGeometry(
            dims.radius || 0.05,
            dims.radius || 0.05,
            dims.length || 0.2
          );
          // URDF cylinders are along Z axis, Three.js cylinders are along Y axis.
          geometry.rotateX(Math.PI / 2);
          const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
          const mesh = new THREE.Mesh(geometry, material);
          this.applyVisualOrigin(mesh, link);
          linkGroup.add(mesh);
        } else if (link.geometry?.type === 'sphere') {
          const dims = link.geometry.dimensions || {};
          const geometry = new THREE.SphereGeometry(dims.radius || 0.1);
          const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
          const mesh = new THREE.Mesh(geometry, material);
          this.applyVisualOrigin(mesh, link);
          linkGroup.add(mesh);
        }
      } catch (error) {
        this.log(`⚠ Failed to load ${link.name}: ${error}`);
      }

      this.linkMeshes.set(link.name, linkGroup);
    }
  }

  /**
   * Build the kinematic tree hierarchy using URDF joint definitions
   */
  private buildKinematicTree(): void {
    // Find root link (link with no parent joint)
    const childLinks = new Set(this.urdf.joints.map(j => j.child));
    const rootLink = this.urdf.links.find(l => !childLinks.has(l.name));

    if (!rootLink) {
      this.log('⚠ No root link found');
      return;
    }

    // Build tree recursively
    this.buildTreeNode(rootLink.name, this.scene);
  }

  /**
   * Recursively build the kinematic tree
   */
  private buildTreeNode(linkName: string, parentGroup: THREE.Group): void {
    const linkMesh = this.linkMeshes.get(linkName);
    if (!linkMesh) return;

    parentGroup.add(linkMesh);

    // Find all joints with this link as parent
    const childJoints = this.urdf.joints.filter(j => j.parent === linkName);

    for (const joint of childJoints) {
      const jointGroup = new THREE.Group();
      jointGroup.name = joint.name;

      // Store joint for later animation
      this.jointObjects.set(joint.name, jointGroup);

      // Apply joint origin transform
      if (joint.origin) {
        const [x, y, z] = joint.origin.xyz;
        jointGroup.position.set(x, y, z);

        const [rx, ry, rz] = joint.origin.rpy;
        jointGroup.rotation.order = 'XYZ';
        jointGroup.rotation.x = rx;
        jointGroup.rotation.y = ry;
        jointGroup.rotation.z = rz;
      }

      // Store rotation axis
      const rotationAxis = joint.axis?.xyz || [0, 0, 1];
      (jointGroup as any)._rotationAxis = rotationAxis;
      (jointGroup as any)._jointType = joint.type;
      // Keep the URDF origin rotation as a base transform.
      // Joint motion must be applied relative to this quaternion.
      (jointGroup as any)._baseQuaternion = jointGroup.quaternion.clone();

      linkMesh.add(jointGroup);

      // Process child link
      this.buildTreeNode(joint.child, jointGroup);
    }
  }

  /**
   * Resolve package:// URLs to local paths
   */
  private resolveMeshPath(filename: string): string {
    if (filename.startsWith('package://')) {
      // Examples:
      // - package://meshes/head.stl -> /meshes/head.stl
      // - package://inmoov_description/meshes/v2/head.stl -> /meshes/v2/head.stl
      const withoutProtocol = filename.substring('package://'.length);

      if (withoutProtocol.startsWith('meshes/')) {
        return `/${withoutProtocol}`;
      }

      const meshesIndex = withoutProtocol.indexOf('/meshes/');
      if (meshesIndex >= 0) {
        return withoutProtocol.substring(meshesIndex);
      }

      // Fallback: keep only the last segment under /meshes
      const meshFile = withoutProtocol.split('/').pop();
      return `/meshes/${meshFile}`;
    }
    if (filename.startsWith('file://')) {
      // Remove file:// protocol
      return filename.substring(7);
    }
    return filename;
  }

  private applyVisualOrigin(mesh: THREE.Mesh, link: URDFLink): void {
    if (!link.origin) return;

    const [x, y, z] = link.origin.xyz;
    mesh.position.set(x, y, z);

    const [rx, ry, rz] = link.origin.rpy;
    mesh.rotation.order = 'XYZ';
    mesh.rotation.x = rx;
    mesh.rotation.y = ry;
    mesh.rotation.z = rz;
  }

  /**
   * Update joint angle for animation
   */
  updateJoint(jointName: string, angle: number): void {
    const jointGroup = this.jointObjects.get(jointName);
    if (!jointGroup) return;

    const axis = (jointGroup as any)._rotationAxis || [0, 0, 1];
    const baseQuaternion = (jointGroup as any)._baseQuaternion as THREE.Quaternion | undefined;
    const [ax, ay, az] = axis;

    // Create rotation quaternion
    const quaternion = new THREE.Quaternion();
    const axis3 = new THREE.Vector3(ax, ay, az).normalize();
    quaternion.setFromAxisAngle(axis3, angle);

    // Apply joint rotation relative to URDF origin orientation
    if (baseQuaternion) {
      jointGroup.quaternion.copy(baseQuaternion).multiply(quaternion);
    } else {
      jointGroup.quaternion.copy(quaternion);
    }
  }

  /**
   * Get the scene
   */
  getScene(): THREE.Group {
    return this.scene;
  }

  /**
   * Get all joint objects
   */
  getJoints(): Map<string, THREE.Group> {
    return this.jointObjects;
  }

  /**
   * Log message
   */
  private log(message: string): void {
    console.log(`[URDF] ${message}`);
    this.onProgress?.(message);
  }
}
