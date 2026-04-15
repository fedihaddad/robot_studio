/**
 * Collision Mesh Loader
 * Loads and manages collision geometries for the robot
 * Separates collision meshes from visual meshes for state visualization
 */

import * as THREE from 'three';
import { URDFLink } from './urdf.loader';
import { STLLoader } from './stl.loader';

export interface CollisionGeometry {
  link: string;
  geometry: THREE.BufferGeometry;
  mesh: THREE.Mesh;
  isColliding: boolean;
}

export class CollisionMeshLoader {
  private collisionMeshes: Map<string, CollisionGeometry> = new Map();
  private collisionGroup: THREE.Group;
  private stlLoader: STLLoader;
  private normalMaterial: THREE.MeshPhongMaterial;
  private collisionMaterial: THREE.MeshPhongMaterial;

  constructor() {
    this.collisionGroup = new THREE.Group();
    this.collisionGroup.name = 'collision_meshes';
    this.stlLoader = new STLLoader();

    // Normal state: transparent material
    this.normalMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a90a4,
      transparent: true,
      opacity: 0.2,
      wireframe: false,
      side: THREE.DoubleSide,
    });

    // Collision state: red semi-transparent
    this.collisionMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.5,
      wireframe: false,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Load collision mesh for a link
   */
  async loadCollisionMesh(
    link: URDFLink,
    basePath: string
  ): Promise<CollisionGeometry | null> {
    try {
      if (!link.collision || !link.collision.geometry) {
        return null;
      }

      const geometry = link.collision.geometry;

      let bufferGeometry: THREE.BufferGeometry | null = null;

      if (geometry.type === 'mesh' && geometry.url) {
        // Load STL/Mesh file
        const meshUrl = this.resolveMeshUrl(geometry.url, basePath);
        bufferGeometry = await this.stlLoader.load(meshUrl);
      } else if (geometry.type === 'box' && geometry.size) {
        // Create box geometry
        const [x, y, z] = geometry.size;
        bufferGeometry = new THREE.BoxGeometry(x, y, z);
      } else if (geometry.type === 'cylinder' && geometry.radius && geometry.length) {
        // Create cylinder geometry
        bufferGeometry = new THREE.CylinderGeometry(
          geometry.radius,
          geometry.radius,
          geometry.length,
          16
        );
      } else if (geometry.type === 'sphere' && geometry.radius) {
        // Create sphere geometry
        bufferGeometry = new THREE.SphereGeometry(geometry.radius, 16, 16);
      }

      if (!bufferGeometry) {
        return null;
      }

      // Apply scale if needed
      if (geometry.scale && geometry.scale.length === 3) {
        bufferGeometry.scale(geometry.scale[0], geometry.scale[1], geometry.scale[2]);
      }

      // Create mesh with collision material
      const mesh = new THREE.Mesh(bufferGeometry, this.normalMaterial);
      mesh.name = `collision_${link.name}`;
      mesh.userData.linkName = link.name;

      // Apply origin transform
      if (link.collision.origin) {
        const [x, y, z] = link.collision.origin.position;
        const [rx, ry, rz] = link.collision.origin.rpy;

        mesh.position.set(x, y, z);
        mesh.rotation.order = 'XYZ';
        mesh.rotation.x = rx;
        mesh.rotation.y = ry;
        mesh.rotation.z = rz;
      }

      const collisionGeometry: CollisionGeometry = {
        link: link.name,
        geometry: bufferGeometry,
        mesh,
        isColliding: false,
      };

      this.collisionMeshes.set(link.name, collisionGeometry);
      this.collisionGroup.add(mesh);

      return collisionGeometry;
    } catch (error) {
      console.warn(`Failed to load collision mesh for ${link.name}:`, error);
      return null;
    }
  }

  /**
   * Load all collision meshes from links
   */
  async loadAllCollisionMeshes(links: URDFLink[], basePath: string): Promise<void> {
    const promises = links
      .filter(link => link.collision)
      .map(link => this.loadCollisionMesh(link, basePath));

    await Promise.all(promises);
  }

  /**
   * Toggle collision mesh visibility
   */
  setCollisionVisibility(visible: boolean): void {
    this.collisionGroup.visible = visible;
  }

  /**
   * Set collision state for a link (red if colliding)
   */
  setCollisionState(linkName: string, isColliding: boolean): void {
    const collision = this.collisionMeshes.get(linkName);
    if (collision) {
      collision.isColliding = isColliding;
      collision.mesh.material = isColliding ? this.collisionMaterial : this.normalMaterial;
    }
  }

  /**
   * Set collision state for multiple links
   */
  setCollisionStates(states: Record<string, boolean>): void {
    Object.entries(states).forEach(([linkName, isColliding]) => {
      this.setCollisionState(linkName, isColliding);
    });
  }

  /**
   * Get collision group (for adding to scene)
   */
  getCollisionGroup(): THREE.Group {
    return this.collisionGroup;
  }

  /**
   * Get collision mesh for a link
   */
  getCollisionMesh(linkName: string): CollisionGeometry | undefined {
    return this.collisionMeshes.get(linkName);
  }

  /**
   * Get all collision meshes
   */
  getAllCollisionMeshes(): Map<string, CollisionGeometry> {
    return this.collisionMeshes;
  }

  /**
   * Resolve mesh URL
   */
  private resolveMeshUrl(url: string, basePath: string): string {
    if (url.startsWith('package://')) {
      const parts = url.replace('package://', '').split('/');
      const packageName = parts[0];
      const filePath = parts.slice(1).join('/');

      // Try different path resolutions
      if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        // Electron app
        return `${basePath}${filePath}`;
      }
      return `/meshes/${filePath}`;
    }

    if (url.startsWith('file://')) {
      return url.substring(7);
    }

    if (url.startsWith('http')) {
      return url;
    }

    return `${basePath}${url}`;
  }

  /**
   * Clear all collision meshes
   */
  clear(): void {
    this.collisionMeshes.forEach(collision => {
      collision.geometry.dispose();
      (collision.mesh.material as THREE.Material).dispose();
      this.collisionGroup.remove(collision.mesh);
    });
    this.collisionMeshes.clear();
  }
}

export const collisionMeshLoader = new CollisionMeshLoader();
