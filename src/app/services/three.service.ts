import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Injectable({ providedIn: 'root' })
export class ThreeService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationId?: number;
  private artwork?: THREE.Group;

  init(canvas: HTMLCanvasElement): void {
    const width = canvas.clientWidth || 560;
    const height = canvas.clientHeight || 470;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, .1, 100);
    this.camera.position.set(0, .15, 5.2);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0x000000, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(2, 3, 4);
    this.scene.add(light);

    this.artwork = new THREE.Group();
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.05, .32, 128, 24),
      new THREE.MeshStandardMaterial({ color: 0xee5b3f, roughness: .25, metalness: .12 })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, .018, 12, 96),
      new THREE.MeshBasicMaterial({ color: 0x17201d, transparent: true, opacity: .45 })
    );
    ring.rotation.x = Math.PI / 2.4;
    this.artwork.add(knot, ring);
    this.scene.add(this.artwork);
    this.animate();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (this.artwork) {
      this.artwork.rotation.y += .006;
      this.artwork.rotation.x = Math.sin(Date.now() * .0007) * .08;
    }
    this.renderer.render(this.scene, this.camera);
  }

  loadModel(path: string, onLoad?: (gltf: unknown) => void, onError?: (error: unknown) => void): void {
    new GLTFLoader().load(path, (gltf) => { this.scene.add(gltf.scene); onLoad?.(gltf); }, undefined, (error) => onError?.(error));
  }

  cleanup(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.scene?.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    });
    this.renderer?.dispose();
  }
}
