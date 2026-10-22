/**
 * Quatro parafusos de fixação: dois entrando pela tampa dianteira, dois pela
 * traseira. Cada parafuso é um subgrupo próprio para receber um deslocamento
 * de explosão individual.
 */

import * as THREE from 'three';
import { COVER_Z, D } from '../dimensions.js';
import { steel } from '../materials.js';
import { mergeAll, shadedMesh } from './util.js';

const { headRadius, headHeight, shankRadius, shankLength, ringRadius } = D.screw;
const ANGLES = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];

function makeScrew(direction, angle) {
  const group = new THREE.Group();
  const material = steel({ color: 0xb6c0ca, roughness: 0.28 });

  const faceZ = direction * (COVER_Z + D.cover.thickness);

  const head = new THREE.CylinderGeometry(headRadius, headRadius, headHeight, 6);
  head.rotateX(Math.PI / 2);
  head.translate(0, 0, faceZ + direction * (headHeight / 2));

  const washer = new THREE.CylinderGeometry(headRadius * 1.35, headRadius * 1.35, 0.02, 16);
  washer.rotateX(Math.PI / 2);
  washer.translate(0, 0, faceZ + direction * 0.012);

  const shank = new THREE.CylinderGeometry(shankRadius, shankRadius, shankLength, 10);
  shank.rotateX(Math.PI / 2);
  shank.translate(0, 0, faceZ - direction * (shankLength / 2));

  const merged = mergeAll([head, washer, shank]);
  const mesh = shadedMesh(merged, material);
  group.add(mesh);

  group.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
  group.userData.screwDirection = direction;
  return group;
}

export function buildFasteners() {
  const group = new THREE.Group();
  group.name = 'fasteners';

  const screws = [];
  ANGLES.forEach((angle, index) => {
    const direction = index < 2 ? 1 : -1;
    const screw = makeScrew(direction, angle);
    screw.userData.explode = {
      dir: new THREE.Vector3(0, 0, direction),
      dist: 3.6,
    };
    screws.push(screw);
    group.add(screw);
  });

  group.userData.screws = screws;
  return group;
}
