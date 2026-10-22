/**
 * Controlador da vista explodida.
 *
 * Cada nó que deve se deslocar declara, em `userData.explode`:
 *
 *   { dir: Vector3, dist: number }
 *
 * A posição é reconstruída como `repouso + direção · distância · ease(q)`.
 * Como o deslocamento acontece no espaço local do pai, offsets de grupo se
 * compõem naturalmente com offsets de filhos (por exemplo: tampa → mancal).
 * Nada é "lembrado" em variáveis paralelas, então ir e voltar é exato.
 */

import * as THREE from 'three';
import { clamp01, easeInOutCubic } from './easing.js';

export function createExplosion(root, { duration = 1.8 } = {}) {
  const entries = [];

  root.traverse((node) => {
    const spec = node.userData?.explode;
    if (!spec) return;
    entries.push({
      node,
      rest: node.position.clone(),
      dir: new THREE.Vector3().copy(spec.dir).normalize(),
      dist: spec.dist,
    });
  });

  let progress = 0;
  let direction = 0;

  function apply() {
    const ease = easeInOutCubic(progress);
    for (const entry of entries) {
      entry.node.position.copy(entry.rest).addScaledVector(entry.dir, entry.dist * ease);
    }
  }

  function setProgress(value) {
    progress = clamp01(value);
    apply();
  }

  function setDirection(next) {
    direction = Math.sign(next);
  }

  return {
    /** Quantidade de nós com deslocamento declarado. */
    get size() {
      return entries.length;
    },
    get progress() {
      return progress;
    },
    get direction() {
      return direction;
    },
    setProgress,
    setDirection,
    /** Avança conforme o sinal de `direction`; devolve true ao atingir o fim. */
    update(dt) {
      if (direction === 0) return false;
      progress = clamp01(progress + (dt / duration) * direction);
      apply();
      return direction > 0 ? progress >= 1 : progress <= 0;
    },
    /** Fim do curso no sentido atual. */
    atEnd() {
      if (direction > 0) return progress >= 1;
      if (direction < 0) return progress <= 0;
      return true;
    },
    apply,
  };
}
