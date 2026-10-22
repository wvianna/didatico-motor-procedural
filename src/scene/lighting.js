/**
 * Iluminação e ambiente de reflexão.
 *
 * O `RoomEnvironment` é gerado em memória e filtrado com PMREM: dá aos metais
 * algo para refletir sem depender de nenhum arquivo HDR externo (e sem
 * questão de licença).
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createLighting(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);

  const room = new RoomEnvironment();
  const envTarget = pmrem.fromScene(room, 0.04);
  scene.environment = envTarget.texture;
  // Propriedade disponível a partir de r163; ignorada em versões anteriores.
  if ('environmentIntensity' in scene) {
    scene.environmentIntensity = 0.62;
  }

  room.traverse((object) => {
    if (object.isMesh) {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material?.dispose();
    }
  });
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff4e8, 2.9);
  key.position.set(7, 11, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 46;
  key.shadow.camera.left = -13;
  key.shadow.camera.right = 13;
  key.shadow.camera.top = 13;
  key.shadow.camera.bottom = -13;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 2;
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.DirectionalLight(0x86b6ff, 1.9);
  rim.position.set(-8, 5, -7);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffc79a, 0.55);
  fill.position.set(-5, -4, 7);
  scene.add(fill);

  const hemisphere = new THREE.HemisphereLight(0xa8c6ff, 0x140f0a, 0.75);
  scene.add(hemisphere);

  return {
    key,
    rim,
    fill,
    hemisphere,
    envTarget,
    dispose() {
      envTarget.dispose();
      scene.environment = null;
      for (const light of [key, rim, fill, hemisphere]) {
        light.dispose?.();
        scene.remove(light);
      }
      scene.remove(key.target);
    },
  };
}
