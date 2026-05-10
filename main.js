import * as THREE from "three";
import { gsap } from "gsap";

const canvas = document.getElementById("webgl-stage");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03050c, 0.11);

const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0.4, 8.5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const group = new THREE.Group();
scene.add(group);

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const pointA = new THREE.PointLight(0x7af7ff, 30, 20, 2);
pointA.position.set(3.2, 2.4, 4);
scene.add(pointA);

const pointB = new THREE.PointLight(0xff7ea0, 26, 20, 2);
pointB.position.set(-3.6, -1.8, 3.2);
scene.add(pointB);

const glowGeometry = new THREE.IcosahedronGeometry(1.5, 12);
const glowMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x0f2742,
  emissive: 0x44c6ff,
  emissiveIntensity: 0.75,
  roughness: 0.15,
  metalness: 0.65,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  wireframe: true,
  transparent: true,
  opacity: 0.34,
});

const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x061323,
  emissive: 0x5ef1ff,
  emissiveIntensity: 0.28,
  roughness: 0.2,
  metalness: 0.8,
  transparent: true,
  opacity: 0.9,
});

const glowShell = new THREE.Mesh(glowGeometry, glowMaterial);
const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 10), coreMaterial);
group.add(glowShell);
group.add(core);

const particleCount = 1800;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const scales = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i += 1) {
  const i3 = i * 3;
  const radius = 2.8 + Math.random() * 5.4;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = radius * Math.cos(phi) * 0.62;
  positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  scales[i] = Math.random();
}

particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

const particlesMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0x79f7ff) },
    uColorB: { value: new THREE.Color(0xff7ea0) },
  },
  vertexShader: `
    uniform float uTime;
    attribute float aScale;
    varying float vMix;

    void main() {
      vec3 transformed = position;
      float wave = sin(uTime * 0.35 + transformed.x * 0.55 + transformed.z * 0.4) * 0.18;
      transformed.y += wave;
      transformed.x += cos(uTime * 0.2 + transformed.y * 0.4) * 0.08;

      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = (6.0 + aScale * 10.0) * (1.0 / -mvPosition.z);
      vMix = aScale;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying float vMix;

    void main() {
      float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
      float strength = 0.12 / distanceToCenter - 0.16;
      vec3 color = mix(uColorA, uColorB, vMix);
      gl_FragColor = vec4(color, strength);
    }
  `,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 16, 80, 80),
  new THREE.ShaderMaterial({
    transparent: true,
    wireframe: true,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      varying float vElevation;

      void main() {
        vec3 transformed = position;
        float elevation = sin(transformed.x * 0.45 + uTime * 0.5) * 0.18;
        elevation += cos(transformed.y * 0.4 + uTime * 0.32) * 0.12;
        transformed.z += elevation;
        vElevation = elevation;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying float vElevation;

      void main() {
        float alpha = 0.12 + vElevation * 0.22;
        gl_FragColor = vec4(0.45, 0.92, 1.0, alpha);
      }
    `,
  })
);

plane.position.set(0, -3.2, -5.4);
plane.rotation.x = -1.18;
scene.add(plane);

const pointer = { x: 0, y: 0 };

window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
});

if (!prefersReducedMotion) {
  gsap.from(".site-header", {
    y: -28,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });

  gsap.from(".hero-copy > *", {
    y: 36,
    opacity: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: "power3.out",
    delay: 0.15,
  });

  gsap.from(".hero-panel .panel-card", {
    y: 32,
    opacity: 0,
    duration: 1.15,
    stagger: 0.14,
    ease: "power3.out",
    delay: 0.28,
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");

      if (!prefersReducedMotion) {
        gsap.to(entry.target, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
        });
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const clock = new THREE.Clock();

const animate = () => {
  const elapsed = clock.getElapsedTime();

  particlesMaterial.uniforms.uTime.value = elapsed;
  plane.material.uniforms.uTime.value = elapsed;

  group.rotation.x = elapsed * 0.18;
  group.rotation.y = elapsed * 0.26;
  particles.rotation.y = elapsed * 0.035;
  particles.rotation.x = elapsed * 0.02;

  if (!prefersReducedMotion) {
    group.position.x += (pointer.x * 0.85 - group.position.x) * 0.03;
    group.position.y += (pointer.y * 0.45 - group.position.y) * 0.03;

    camera.position.x += (pointer.x * 0.32 - camera.position.x) * 0.02;
    camera.position.y += (pointer.y * 0.18 + 0.4 - camera.position.y) * 0.02;
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
