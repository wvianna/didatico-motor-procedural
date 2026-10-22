/**
 * Bobinas do rotor.
 *
 * Cada dente recebe uma bobina concentrada: o fio sobe por uma ranhura, dá a
 * volta sobre a cabeça do dente e desce pela ranhura vizinha, fechando pela
 * outra extremidade. Duas bobinas vizinhas compartilham a mesma ranhura em
 * raios diferentes (duas camadas), como num rotor real.
 */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { copper } from '../materials.js';
import { mergeAll, shadedMesh } from './util.js';

const LAYER_RADIUS = [0.8, 0.94];

function coilCurve(centerAngle, halfSlot, radius, zHalf) {
  const point = (r, angle, z) =>
    new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, z);

  const inner = zHalf - 0.12;
  const lip = zHalf + 0.2;
  const over = radius + 0.16;

  const points = [
    point(radius, centerAngle - halfSlot, -inner),
    point(radius, centerAngle - halfSlot, -zHalf * 0.4),
    point(radius, centerAngle - halfSlot, zHalf * 0.4),
    point(radius, centerAngle - halfSlot, inner),
    point(radius + 0.08, centerAngle - halfSlot * 0.55, lip - 0.06),
    point(over, centerAngle, lip),
    point(radius + 0.08, centerAngle + halfSlot * 0.55, lip - 0.06),
    point(radius, centerAngle + halfSlot, inner),
    point(radius, centerAngle + halfSlot, zHalf * 0.4),
    point(radius, centerAngle + halfSlot, -zHalf * 0.4),
    point(radius, centerAngle + halfSlot, -inner),
    point(radius + 0.08, centerAngle + halfSlot * 0.55, -lip + 0.06),
    point(over, centerAngle, -lip),
    point(radius + 0.08, centerAngle - halfSlot * 0.55, -lip + 0.06),
  ];

  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.35);
}

export function buildWindings() {
  const group = new THREE.Group();
  group.name = 'windings';

  const { teeth, coreLength } = D.rotor;
  const step = (Math.PI * 2) / teeth;
  const halfSlot = step * 0.5;
  const zHalf = coreLength / 2;

  const geometries = [];
  for (let i = 0; i < teeth; i += 1) {
    // O dente i ocupa [i·passo, i·passo + 0,55·passo]; seu centro fica em 0,275.
    const centerAngle = i * step + step * 0.275;
    const radius = LAYER_RADIUS[i % 2];
    const curve = coilCurve(centerAngle, halfSlot, radius, zHalf);
    geometries.push(new THREE.TubeGeometry(curve, 140, 0.062, 7, true));
  }

  const merged = mergeAll(geometries);
  const mesh = shadedMesh(merged, copper({ color: 0xb06a2c, roughness: 0.36 }));
  group.add(mesh);

  return group;
}
