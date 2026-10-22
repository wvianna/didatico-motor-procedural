/**
 * Tampas dianteira e traseira.
 *
 * Cada tampa é um perfil de revolução fechado: chapa com chanfro no aro e um
 * ressalto central que serve de assento ao rolamento.
 */

import * as THREE from 'three';
import { COVER_Z, D } from '../dimensions.js';
import { steel } from '../materials.js';
import { closedProfile, latheZ, shadedMesh } from './util.js';

function coverProfile(direction) {
  const { radius, thickness, hole, bossRadius, bossHeight } = D.cover;
  const chamfer = 0.06;

  const points = [
    [hole, 0],
    [radius - chamfer, 0],
    [radius, chamfer],
    [radius, thickness - chamfer],
    [radius - chamfer, thickness],
    [bossRadius, thickness],
    [bossRadius, thickness + bossHeight],
    [hole, thickness + bossHeight],
  ];

  return closedProfile(
    points.map(([r, z]) => [r, direction > 0 ? z : -z]),
  );
}

function makeCover(direction) {
  const group = new THREE.Group();
  const material = steel({ color: 0x8e9aa6, roughness: 0.36 });
  material.side = THREE.DoubleSide;

  const shell = shadedMesh(latheZ(coverProfile(direction), 64), material);
  group.add(shell);

  // Anel de vedação entre tampa e carcaça.
  const gasketMaterial = new THREE.MeshStandardMaterial({
    color: 0x11151a,
    roughness: 0.85,
    metalness: 0.05,
  });
  const gasket = shadedMesh(
    new THREE.TorusGeometry(D.cover.radius - 0.09, 0.035, 8, 64),
    gasketMaterial,
    { cast: false },
  );
  gasket.position.z = direction * 0.012;
  group.add(gasket);

  group.position.z = direction * COVER_Z;
  return group;
}

export function buildCovers() {
  const front = makeCover(1);
  front.name = 'frontCover';
  const rear = makeCover(-1);
  rear.name = 'rearCover';
  return { front, rear };
}
