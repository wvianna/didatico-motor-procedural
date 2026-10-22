/**
 * Criação do renderer, da cena, da câmera e dos controles de órbita.
 * Também concentra o redimensionamento e o descarte de recursos de GPU.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { groundMaterial } from '../motor/materials.js';

const GROUND_Y = -2.52;

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a1017, 30, 68);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
  camera.position.set(8.5, 6, 13);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.rotateSpeed = 0.85;
  controls.zoomSpeed = 0.9;
  controls.minDistance = 5.5;
  controls.maxDistance = 46;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI - 0.22;
  controls.target.set(0, 0, 0);
  controls.listenToKeyEvents(window);

  // ---------------------------------------------------------------- cenário
  const stage = new THREE.Group();
  stage.name = 'stage';

  const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 72), groundMaterial());
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  ground.receiveShadow = true;
  stage.add(ground);

  const grid = new THREE.GridHelper(40, 40, 0x1f2f3f, 0x141d27);
  grid.position.y = GROUND_Y + 0.01;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  grid.material.depthWrite = false;
  stage.add(grid);

  scene.add(stage);

  // ------------------------------------------------------------ dimensionar
  function resize() {
    const width = Math.max(container.clientWidth || 1, 1);
    const height = Math.max(container.clientHeight || 1, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
  }

  let resizeObserver = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', resize, { passive: true });
  resize();

  return {
    renderer,
    scene,
    camera,
    controls,
    resize,
    dispose() {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', resize);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export { GROUND_Y };
