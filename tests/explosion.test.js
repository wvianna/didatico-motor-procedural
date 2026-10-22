import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createExplosion } from '../src/animation/ExplosionController.js';
import { easeInOutCubic } from '../src/animation/easing.js';

function fixture() {
  const root = new THREE.Group();

  const parent = new THREE.Group();
  parent.position.set(1, 2, 3);
  parent.userData.explode = { dir: new THREE.Vector3(0, 0, 1), dist: 2 };

  const child = new THREE.Group();
  child.position.set(0, 0, 0.5);
  child.userData.explode = { dir: new THREE.Vector3(1, 0, 0), dist: 3 };

  parent.add(child);
  root.add(parent);

  const untouched = new THREE.Group();
  untouched.position.set(-1, -1, -1);
  root.add(untouched);

  return { root, parent, child, untouched };
}

describe('controlador da vista explodida', () => {
  it('coleta apenas os nós que declaram deslocamento', () => {
    const { root } = fixture();
    const explosion = createExplosion(root);
    expect(explosion.size).toBe(2);
  });

  it('progresso 0 mantém as posições de montagem', () => {
    const { root, parent, child, untouched } = fixture();
    const explosion = createExplosion(root);
    explosion.setProgress(0);
    expect(parent.position.toArray()).toEqual([1, 2, 3]);
    expect(child.position.toArray()).toEqual([0, 0, 0.5]);
    expect(untouched.position.toArray()).toEqual([-1, -1, -1]);
  });

  it('progresso 1 aplica direção e distância no espaço local', () => {
    const { root, parent, child, untouched } = fixture();
    const explosion = createExplosion(root);
    explosion.setProgress(1);
    expect(parent.position.toArray()).toEqual([1, 2, 5]);
    expect(child.position.toArray()).toEqual([3, 0, 0.5]);
    expect(untouched.position.toArray()).toEqual([-1, -1, -1]);
  });

  it('ida e volta restauram a posição exata de repouso', () => {
    const { root, parent, child } = fixture();
    const explosion = createExplosion(root);
    explosion.setProgress(1);
    explosion.setProgress(0);
    expect(parent.position.toArray()).toEqual([1, 2, 3]);
    expect(child.position.toArray()).toEqual([0, 0, 0.5]);
  });

  it('percorre o caminho completo em `duration` segundos', () => {
    const { root, parent } = fixture();
    const explosion = createExplosion(root, { duration: 2 });
    explosion.setDirection(1);

    let finished = false;
    let elapsed = 0;
    while (!finished && elapsed < 5) {
      finished = explosion.update(0.1);
      elapsed += 0.1;
    }
    expect(finished).toBe(true);
    expect(explosion.progress).toBe(1);
    expect(parent.position.z).toBeCloseTo(3 + 2, 10);
  });

  it('a remontagem percorre o caminho inverso e termina em zero', () => {
    const { root } = fixture();
    const explosion = createExplosion(root, { duration: 1 });
    explosion.setProgress(1);
    explosion.setDirection(-1);

    let finished = false;
    let elapsed = 0;
    while (!finished && elapsed < 5) {
      finished = explosion.update(0.1);
      elapsed += 0.1;
    }
    expect(finished).toBe(true);
    expect(explosion.progress).toBe(0);
  });

  it('posição intermediária segue a curva de suavização', () => {
    const { root, parent } = fixture();
    const explosion = createExplosion(root);
    explosion.setProgress(0.5);
    expect(parent.position.z).toBeCloseTo(3 + 2 * easeInOutCubic(0.5), 10);
  });

  it('não produz NaN e satura em [0, 1]', () => {
    const { root, parent } = fixture();
    const explosion = createExplosion(root);
    explosion.setProgress(5);
    expect(explosion.progress).toBe(1);
    explosion.setProgress(-3);
    expect(explosion.progress).toBe(0);
    expect(Number.isFinite(parent.position.z)).toBe(true);
  });

  it('aceita direção não normalizada', () => {
    const root = new THREE.Group();
    const node = new THREE.Group();
    node.userData.explode = { dir: new THREE.Vector3(0, 6, 0), dist: 1.5 };
    root.add(node);
    const explosion = createExplosion(root);
    explosion.setProgress(1);
    expect(node.position.y).toBeCloseTo(1.5, 10);
  });
});
