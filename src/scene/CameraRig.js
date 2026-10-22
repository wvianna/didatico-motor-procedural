/**
 * Enquadramento de câmera: `OrbitControls` + tween próprio.
 *
 * Duas decisões que mudam o resultado na tela:
 *
 * 1. **Enquadra pelas caixas reais das peças**, não pela AABB do conjunto.
 *    Na vista explodida as peças ficam espalhadas e a caixa do conjunto é
 *    quase toda vazio — enquadrá-la deixaria o modelo minúsculo no centro.
 *
 * 2. **Desloca o frustum** (`setViewOffset`) em vez de mover o alvo. Assim o
 *    modelo fica centralizado na área livre da tela (fora dos painéis) sem
 *    que o pivô da órbita saia do centro do motor.
 */

import * as THREE from 'three';
import { easeInOutCubic } from '../animation/easing.js';

export function createCameraRig({ camera, controls }) {
  let tween = null;
  let shift = { x: 0, y: 0 };
  let viewport = { w: 1, h: 1 };

  function currentDirection() {
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (dir.lengthSq() < 1e-9) dir.set(0.62, 0.42, 1);
    return dir.normalize();
  }

  function basisFor(axis) {
    const forward = axis.clone().negate();
    const upWorld =
      Math.abs(forward.y) > 0.985 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, upWorld).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    return { right, up };
  }

  function applyViewOffset() {
    if (Math.abs(shift.x) < 1e-4 && Math.abs(shift.y) < 1e-4) {
      camera.clearViewOffset();
      return;
    }
    const { w, h } = viewport;
    camera.setViewOffset(w, h, (-shift.x * w) / 2, (shift.y * h) / 2, w, h);
  }

  /**
   * Distância mínima para que os cantos de TODAS as caixas caibam na
   * sub-área útil da tela. Para cada canto vale
   *
   *   |x'| <= tanH * (D - z')   =>   D >= |x'|/tanH + z'
   *
   * e o máximo é tomado **por canto**, sem somar meias-extensões.
   */
  function distanceFor(boxes, center, axis, safeX, safeY) {
    const { right, up } = basisFor(axis);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * (camera.aspect || 1);
    const tanVeff = Math.max(tanV * safeY, 1e-3);
    const tanHeff = Math.max(tanH * safeX, 1e-3);

    let needed = 0;
    const corner = new THREE.Vector3();
    for (const box of boxes) {
      for (let i = 0; i < 8; i += 1) {
        corner
          .set(
            (i & 1) === 1 ? box.max.x : box.min.x,
            (i & 2) === 2 ? box.max.y : box.min.y,
            (i & 4) === 4 ? box.max.z : box.min.z,
          )
          .sub(center);
        const depth = corner.dot(axis);
        needed = Math.max(
          needed,
          Math.abs(corner.dot(right)) / tanHeff + depth,
          Math.abs(corner.dot(up)) / tanVeff + depth,
        );
      }
    }
    return Math.max(needed, 3);
  }

  /**
   * `safeX`/`safeY` são as frações da tela efetivamente livres para o modelo
   * (0..1). A câmera é posicionada de modo que o conjunto caiba nessa
   * sub-área, e o frustum é deslocado para centralizá-lo nela.
   */
  function fitBoxes(input, options = {}) {
    const list = (Array.isArray(input) ? input : [input]).filter((box) => box && !box.isEmpty());
    if (list.length === 0) return;

    const {
      dir,
      margin = 1.12,
      duration = 1.5,
      instant = false,
      onComplete,
      safeX = 1,
      safeY = 1,
    } = options;

    const union = new THREE.Box3();
    for (const box of list) union.union(box);
    const center = union.getCenter(new THREE.Vector3());
    const axis = (dir ? dir.clone() : currentDirection()).normalize();

    const distance = distanceFor(list, center, axis, safeX, safeY) * margin;

    shift = { x: safeX - 1, y: 1 - safeY };
    applyViewOffset();

    const toTarget = center.clone();
    const toPosition = center.clone().addScaledVector(axis, distance);

    if (instant || duration <= 0) {
      tween = null;
      controls.enabled = true;
      camera.position.copy(toPosition);
      controls.target.copy(toTarget);
      controls.update();
      onComplete?.();
      return;
    }

    tween = {
      elapsed: 0,
      duration,
      fromPosition: camera.position.clone(),
      toPosition,
      fromTarget: controls.target.clone(),
      toTarget,
      onComplete,
    };
    controls.enabled = false;
  }

  /** Mantém o deslocamento de frustum correto após um redimensionamento. */
  function setViewport(width, height) {
    if (width === viewport.w && height === viewport.h) return;
    viewport = { w: Math.max(width, 1), h: Math.max(height, 1) };
    applyViewOffset();
  }

  function update(dt) {
    if (!tween) {
      controls.update();
      return;
    }

    tween.elapsed += dt;
    const k = Math.min(tween.elapsed / tween.duration, 1);
    const eased = easeInOutCubic(k);
    camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
    controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
    camera.lookAt(controls.target);

    if (k >= 1) {
      const callback = tween.onComplete;
      tween = null;
      controls.enabled = true;
      controls.update();
      callback?.();
    }
  }

  function cancel() {
    if (!tween) return;
    tween = null;
    controls.enabled = true;
  }

  return {
    fitBoxes,
    fitBox(box, options) {
      fitBoxes([box], options);
    },
    setViewport,
    update,
    cancel,
    get isTweening() {
      return tween !== null;
    },
    dispose() {
      tween = null;
      camera.clearViewOffset();
    },
  };
}
