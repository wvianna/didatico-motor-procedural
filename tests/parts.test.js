import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildMotor } from '../src/motor/buildMotor.js';
import {
  EXPLODED_PART_IDS,
  PARTS,
  PART_BY_ID,
  RIGID_ROTOR_PART_IDS,
} from '../src/motor/parts.js';
import { createExplosion } from '../src/animation/ExplosionController.js';

function isDescendantOf(node, ancestor) {
  let current = node;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

describe('catálogo de peças', () => {
  it('usa ids únicos e numeração sequencial', () => {
    expect(new Set(PARTS.map((part) => part.id)).size).toBe(PARTS.length);
    PARTS.forEach((part, index) => {
      expect(part.index).toBe(index + 1);
    });
  });

  it('tem texto didático em todas as entradas', () => {
    for (const part of PARTS) {
      expect(part.name.length).toBeGreaterThan(2);
      expect(part.summary.length).toBeGreaterThan(30);
      expect(part.observe.length).toBeGreaterThan(20);
      expect(part.material.length).toBeGreaterThan(2);
    }
  });

  it('mantém as listas auxiliares coerentes com o catálogo', () => {
    for (const id of [...EXPLODED_PART_IDS, ...RIGID_ROTOR_PART_IDS]) {
      expect(PART_BY_ID.has(id)).toBe(true);
    }
  });

  it('não classifica a mesma peça como explodida e como rígida', () => {
    const overlap = EXPLODED_PART_IDS.filter((id) => RIGID_ROTOR_PART_IDS.includes(id));
    expect(overlap).toEqual([]);
  });
});

describe('montagem do motor', () => {
  const motor = buildMotor();

  it('registra exatamente uma entrada por peça do catálogo', () => {
    expect(motor.parts.size).toBe(PARTS.length);
    for (const id of PART_BY_ID.keys()) {
      expect(motor.parts.has(id)).toBe(true);
    }
  });

  it('cada nó registrado carrega o próprio partId', () => {
    for (const [id, node] of motor.parts) {
      expect(node.userData.partId).toBe(id);
    }
  });

  it('o eixo, o núcleo, as bobinas e o comutador giram juntos', () => {
    for (const id of RIGID_ROTOR_PART_IDS) {
      const node = motor.parts.get(id);
      expect(isDescendantOf(node, motor.rotorGroup)).toBe(true);
    }
  });

  it('carcaça, tampas, ímãs, escovas e base ficam fora do rotor', () => {
    for (const id of ['housing', 'frontCover', 'rearCover', 'magnets', 'brushes', 'base']) {
      const node = motor.parts.get(id);
      expect(isDescendantOf(node, motor.rotorGroup)).toBe(false);
    }
  });

  it('os mancais acompanham as tampas', () => {
    expect(isDescendantOf(motor.parts.get('frontBearing'), motor.parts.get('frontCover'))).toBe(
      true,
    );
    expect(isDescendantOf(motor.parts.get('rearBearing'), motor.parts.get('rearCover'))).toBe(
      true,
    );
  });

  it('girar o rotor não move nenhuma peça estática', () => {
    const statics = ['housing', 'frontCover', 'rearCover', 'magnets', 'brushes', 'base', 'terminals'];
    const before = statics.map((id) => motor.parts.get(id).getWorldPosition(new THREE.Vector3()));

    motor.root.updateMatrixWorld(true);
    motor.rotorGroup.rotation.z = Math.PI / 3;
    motor.root.updateMatrixWorld(true);

    statics.forEach((id, index) => {
      const after = motor.parts.get(id).getWorldPosition(new THREE.Vector3());
      expect(after.distanceTo(before[index])).toBeLessThan(1e-9);
    });

    motor.rotorGroup.rotation.z = 0;
    motor.root.updateMatrixWorld(true);
  });

  it('a explosão desloca as peças externas e preserva o conjunto do rotor', () => {
    const explosion = createExplosion(motor.root);
    expect(explosion.size).toBeGreaterThanOrEqual(9);

    const rest = new Map();
    for (const id of RIGID_ROTOR_PART_IDS) {
      rest.set(id, motor.parts.get(id).position.clone());
    }

    explosion.setProgress(1);

    for (const id of RIGID_ROTOR_PART_IDS) {
      const node = motor.parts.get(id);
      expect(node.position.distanceTo(rest.get(id))).toBeLessThan(1e-12);
    }
    expect(motor.parts.get('housing').position.length()).toBeGreaterThan(3);
    expect(motor.parts.get('frontCover').position.z).toBeGreaterThan(4);

    explosion.setProgress(0);
  });

  it('todo nó deslocável pertence a uma peça do catálogo', () => {
    let found = 0;
    motor.root.traverse((node) => {
      if (!node.userData.explode) return;
      found += 1;
      let current = node;
      while (current && !current.userData.partId) current = current.parent;
      expect(current).toBeTruthy();
      expect(PART_BY_ID.has(current.userData.partId)).toBe(true);
    });
    expect(found).toBeGreaterThanOrEqual(9);
  });

  it('deslocar e voltar não deixa resíduo numérico', () => {
    const explosion = createExplosion(motor.root);
    const rest = new Map();
    motor.root.traverse((node) => {
      if (node.userData.explode) rest.set(node, node.position.clone());
    });

    for (let i = 0; i <= 10; i += 1) explosion.setProgress(i / 10);
    explosion.setProgress(0);

    for (const [node, position] of rest) {
      expect(node.position.distanceTo(position)).toBeLessThan(1e-12);
    }
  });
});
