/**
 * MarkerArray Renderer
 * Renders visualization markers (boxes, spheres, arrows, text) from ROS MarkerArray messages
 * Handles marker lifecycle (add, update, remove)
 */

import * as THREE from 'three';

export interface Marker {
  id: number;
  action: number; // 0=ADD, 1=DEPRECATE, 2=DELETE
  type: number; // 0=ARROW, 1=CUBE, 2=SPHERE, 3=CYLINDER, 4=LINE_STRIP, 5=LINE_LIST, 6=CUBE_LIST, 7=SPHERE_LIST, 8=POINTS, 9=TEXT_VIEW_FACING, 10=MESH_RESOURCE
  name: string;
  ns: string;
  frame_id: string;
  pose: {
    position: { x: number; y: number; z: number };
    orientation: { x: number; y: number; z: number; w: number };
  };
  scale: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number; a: number };
  lifetime: { secs: number; nsecs: number };
  mesh_use_embedded_materials?: boolean;
  text?: string;
  mesh_resource?: string;
  points?: Array<{ x: number; y: number; z: number }>;
  colors?: Array<{ r: number; g: number; b: number; a: number }>;
}

export class MarkerArrayRenderer {
  private scene: THREE.Scene;
  private markers: Map<string, THREE.Object3D> = new Map(); // Key: ns:id
  private markerGroup: THREE.Group;
  private markerData: Map<string, Marker> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.markerGroup = new THREE.Group();
    this.markerGroup.name = 'markers';
    this.scene.add(this.markerGroup);
  }

  /**
   * Process MarkerArray message
   */
  updateMarkerArray(markers: Marker[]): void {
    markers.forEach(marker => {
      this.updateMarker(marker);
    });
  }

  /**
   * Update single marker
   */
  updateMarker(marker: Marker): void {
    const key = `${marker.ns}:${marker.id}`;

    // Clear existing timer for this marker
    if (this.cleanupTimers.has(key)) {
      clearTimeout(this.cleanupTimers.get(key)!);
      this.cleanupTimers.delete(key);
    }

    if (marker.action === 2) {
      // DELETE
      this.deleteMarker(key);
      return;
    }

    if (marker.action === 1) {
      // DEPRECATE - will auto-delete
      if (marker.lifetime && marker.lifetime.secs > 0) {
        const timeout = setTimeout(() => {
          this.deleteMarker(key);
        }, marker.lifetime.secs * 1000 + (marker.lifetime.nsecs || 0) / 1000000);
        this.cleanupTimers.set(key, timeout);
      }
      return;
    }

    // ADD or UPDATE (action 0)
    let object = this.markers.get(key);

    if (object) {
      // Update existing marker
      this.markerGroup.remove(object);
    }

    // Create new marker geometry
    object = this.createMarkerGeometry(marker);
    if (!object) return;

    this.markers.set(key, object);
    this.markerData.set(key, marker);
    this.markerGroup.add(object);

    // Set auto-delete timer if lifetime is set
    if (marker.lifetime && marker.lifetime.secs > 0) {
      const timeout = setTimeout(() => {
        this.deleteMarker(key);
      }, marker.lifetime.secs * 1000 + (marker.lifetime.nsecs || 0) / 1000000);
      this.cleanupTimers.set(key, timeout);
    }
  }

  /**
   * Create THREE.js geometry from marker type
   */
  private createMarkerGeometry(marker: Marker): THREE.Object3D | null {
    let geometry: THREE.BufferGeometry | null = null;
    let mesh: THREE.Mesh | THREE.Group | null = null;

    const color = new THREE.Color(marker.color.r, marker.color.g, marker.color.b);
    const opacity = marker.color.a;
    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity,
      wireframe: false,
      side: THREE.DoubleSide,
    });

    switch (marker.type) {
      case 0: // ARROW
        mesh = this.createArrow(color, marker.scale, opacity);
        break;

      case 1: // CUBE
        geometry = new THREE.BoxGeometry(
          marker.scale.x,
          marker.scale.y,
          marker.scale.z
        );
        mesh = new THREE.Mesh(geometry, material);
        break;

      case 2: // SPHERE
        geometry = new THREE.SphereGeometry(
          Math.max(marker.scale.x, marker.scale.y, marker.scale.z) * 0.5,
          16,
          16
        );
        mesh = new THREE.Mesh(geometry, material);
        break;

      case 3: // CYLINDER
        geometry = new THREE.CylinderGeometry(
          marker.scale.x * 0.5,
          marker.scale.x * 0.5,
          marker.scale.z,
          16
        );
        mesh = new THREE.Mesh(geometry, material);
        break;

      case 9: // TEXT_VIEW_FACING
        mesh = this.createTextMesh(marker.text || '', color, opacity);
        break;

      case 10: // MESH_RESOURCE
        if (marker.mesh_resource) {
          // For now, render as sphere placeholder
          geometry = new THREE.SphereGeometry(0.1, 16, 16);
          mesh = new THREE.Mesh(geometry, material);
        }
        break;

      default:
        // Unknown marker type
        return null;
    }

    if (!mesh) return null;

    // Apply pose
    const pos = marker.pose.position;
    mesh.position.set(pos.x, pos.y, pos.z);

    const quat = new THREE.Quaternion(
      marker.pose.orientation.x,
      marker.pose.orientation.y,
      marker.pose.orientation.z,
      marker.pose.orientation.w
    );
    mesh.quaternion.copy(quat);

    mesh.name = `marker_${marker.ns}_${marker.id}`;
    mesh.userData.marker = marker;

    return mesh;
  }

  /**
   * Create arrow visualization
   */
  private createArrow(
    color: THREE.Color,
    scale: { x: number; y: number; z: number },
    opacity: number
  ): THREE.Group {
    const group = new THREE.Group();

    // Arrow shaft (cylinder)
    const shaftGeometry = new THREE.CylinderGeometry(
      scale.x * 0.1,
      scale.x * 0.1,
      scale.z * 0.8,
      8
    );
    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity,
    });
    const shaft = new THREE.Mesh(shaftGeometry, material);
    shaft.position.z = scale.z * 0.4;
    group.add(shaft);

    // Arrow head (cone)
    const headGeometry = new THREE.ConeGeometry(scale.x * 0.3, scale.z * 0.2, 8);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.z = scale.z * 0.9;
    group.add(head);

    return group;
  }

  /**
   * Create text mesh (simple 2D text)
   */
  private createTextMesh(
    text: string,
    color: THREE.Color,
    opacity: number
  ): THREE.Group {
    const group = new THREE.Group();

    // Create a canvas texture for text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    if (!ctx) return group;

    // Draw text on canvas
    ctx.fillStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${opacity})`;
    ctx.font = 'Bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.substring(0, 10), 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    return group;
  }

  /**
   * Delete marker
   */
  private deleteMarker(key: string): void {
    const object = this.markers.get(key);
    if (object) {
      this.markerGroup.remove(object);
      this.markers.delete(key);
      this.markerData.delete(key);
    }

    if (this.cleanupTimers.has(key)) {
      clearTimeout(this.cleanupTimers.get(key));
      this.cleanupTimers.delete(key);
    }
  }

  /**
   * Toggle marker visibility
   */
  setMarkerVisibility(visible: boolean): void {
    this.markerGroup.visible = visible;
  }

  /**
   * Get marker group
   */
  getMarkerGroup(): THREE.Group {
    return this.markerGroup;
  }

  /**
   * Clear all markers
   */
  clear(): void {
    Array.from(this.markers.keys()).forEach(key => this.deleteMarker(key));
    this.cleanupTimers.forEach(timer => clearTimeout(timer));
    this.cleanupTimers.clear();
  }

  /**
   * Get marker count
   */
  getMarkerCount(): number {
    return this.markers.size;
  }
}
