import * as THREE from 'three';
import { URDFRobot, URDFLink, URDFJoint } from './urdf.loader';

/**
 * STL File Loader - Loads binary STL geometry
 */
export class STLLoader {
  private static geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private static loadingPromises: Map<string, Promise<THREE.BufferGeometry>> = new Map();

  static async load(url: string): Promise<THREE.BufferGeometry> {
    const cached = STLLoader.geometryCache.get(url);
    if (cached) {
      console.log(`[STLLoader] Cache hit: ${url}`);
      return cached.clone();
    }

    const inFlight = STLLoader.loadingPromises.get(url);
    if (inFlight) {
      console.log(`[STLLoader] In-flight: ${url}`);
      const geometry = await inFlight;
      return geometry.clone();
    }

    const loadPromise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
      console.log(`[STLLoader] Starting fetch: ${url}`);
      fetch(url, {
        headers: { 'Accept': '*/*' },
        mode: 'cors'
      })
        .then((response) => {
          console.log(`[STLLoader] Response received for ${url}: status=${response.status} ok=${response.ok}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then((buffer) => {
          try {
            console.log(`[STLLoader] Buffer received, size: ${buffer.byteLength} bytes`);
            const geometry = STLLoader.parseSTL(buffer);
            geometry.computeVertexNormals();
            STLLoader.geometryCache.set(url, geometry);
            console.log(`[STLLoader] ✓ Success: ${url} (vertices: ${geometry.attributes.position.count})`);
            resolve(geometry);
          } catch (error) {
            console.error(`[STLLoader] Parse error for ${url}:`, error);
            reject(new Error(`Failed to parse STL: ${error}`));
          }
        })
        .catch((error) => {
          console.error(`[STLLoader] Fetch error for ${url}:`, error);
          reject(error);
        })
        .finally(() => {
          STLLoader.loadingPromises.delete(url);
        });
    });

    STLLoader.loadingPromises.set(url, loadPromise);
    const geometry = await loadPromise;
    return geometry.clone();
  }

  static clearCache(): void {
    STLLoader.geometryCache.clear();
    STLLoader.loadingPromises.clear();
  }

  static async preload(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => STLLoader.load(url).then(() => undefined)));
  }

  private static loadWithoutCache(url: string): Promise<THREE.BufferGeometry> {
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
    // Robust detection: many binary STL files also start with "solid".
    if (STLLoader.isBinarySTL(buffer)) {
      return STLLoader.parseBinary(buffer);
    }

    try {
      const asciiGeometry = STLLoader.parseASCII(new TextDecoder().decode(buffer));
      const positionAttr = asciiGeometry.getAttribute('position');
      if (positionAttr && positionAttr.count > 0) {
        return asciiGeometry;
      }
    } catch {
      // Fallback to binary parser below.
    }

    return STLLoader.parseBinary(buffer);
  }

  private static isBinarySTL(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 84) {
      return false;
    }

    const view = new DataView(buffer);
    const faceCount = view.getUint32(80, true);
    const expectedSize = 84 + (faceCount * 50);

    // Binary STL has a strict layout size.
    return expectedSize === buffer.byteLength;
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

      // Diagnostic: log all registered joints
      console.log(`[URDFBuilder] ========== JOINTS DIAGNOSTIC ==========`);
      console.log(`[URDFBuilder] Total joints registered: ${this.jointObjects.size}`);
      console.log(`[URDFBuilder] Joint names:`, Array.from(this.jointObjects.keys()));
      console.log(`[URDFBuilder] ================================================`);

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
    const failedMeshes: { name: string; error: string }[] = [];

    for (const link of this.urdf.links) {
      const linkGroup = new THREE.Group();
      linkGroup.name = link.name;

      try {
        if (link.geometry?.type === 'mesh' && link.geometry.filename) {
          this.log(`Loading mesh: ${link.name} from ${link.geometry.filename}`);

          const meshPath = this.resolveMeshPath(link.geometry.filename);
          console.log(`[URDFBuilder] Resolved mesh path for ${link.name}: ${meshPath}`);
          this.log(`Resolved path: ${meshPath}`);

          const geometry = await STLLoader.load(meshPath);

          const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.4,
            roughness: 0.6,
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
          console.log(`[URDFBuilder] ✓ Successfully loaded: ${link.name}`);
          this.log(`✓ Loaded: ${link.name}`);
        } else if (link.geometry?.type === 'box') {
          // Create placeholder box geometry
          const dims = link.geometry.dimensions || {};
          const geometry = new THREE.BoxGeometry(
            dims.x || 0.1,
            dims.y || 0.1,
            dims.z || 0.1
          );
          const material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.5 });
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
          const material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.5 });
          const mesh = new THREE.Mesh(geometry, material);
          this.applyVisualOrigin(mesh, link);
          linkGroup.add(mesh);
        } else if (link.geometry?.type === 'sphere') {
          const dims = link.geometry.dimensions || {};
          const geometry = new THREE.SphereGeometry(dims.radius || 0.1);
          const material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.5 });
          const mesh = new THREE.Mesh(geometry, material);
          this.applyVisualOrigin(mesh, link);
          linkGroup.add(mesh);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[URDFBuilder] ✗ Failed to load ${link.name}:`, error);
        this.log(`✗ Failed to load ${link.name}: ${errorMsg}`);
        failedMeshes.push({ name: link.name, error: errorMsg });
      }

      this.linkMeshes.set(link.name, linkGroup);
    }

    if (failedMeshes.length > 0) {
      console.warn(`[URDFBuilder] ${failedMeshes.length} meshes failed to load:`, failedMeshes);
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
      jointGroup.userData = { isJoint: true, jointName: joint.name };

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
        return this.resolvePublicAssetPath(withoutProtocol);
      }

      const meshesIndex = withoutProtocol.indexOf('/meshes/');
      if (meshesIndex >= 0) {
        return this.resolvePublicAssetPath(withoutProtocol.substring(meshesIndex + 1));
      }

      // Fallback: keep only the last segment under /meshes
      const meshFile = withoutProtocol.split('/').pop();
      return this.resolvePublicAssetPath(`meshes/${meshFile}`);
    }
    if (filename.startsWith('file://')) {
      // Remove file:// protocol
      return filename.substring(7);
    }
    return filename;
  }

  private resolvePublicAssetPath(relativePath: string): string {
    const normalized = relativePath.replace(/^\/+/, '');

    // For Electron apps running in file:// protocol
    if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
      try {
        // In packaged Electron, renderer entry is in .../renderer/<window>/index.html
        // and static assets are copied next to it (e.g. .../renderer/<window>/meshes/...).
        const baseDir = new URL('./', window.location.href);
        return new URL(normalized, baseDir).toString();
      } catch {
        return normalized;
      }
    }

    // For web/dev environment
    return `/${normalized}`;
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
    if (!jointGroup) {
      return;
    }

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
