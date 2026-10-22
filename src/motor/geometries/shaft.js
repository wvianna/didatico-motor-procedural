/**
 * Eixo de saída.
 *
 * Perfil de revolução aberto nas pontas (raio 0 fecha sozinho), com degraus
 * que correspondem aos assentos reais: rolamentos, núcleo e comutador.
 * O rasgo de chaveta fica fora de escopo (exigiria operação booleana).
 */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { steel } from '../materials.js';
import { latheZ, shadedMesh } from './util.js';

export function buildShaft() {
  const group = new THREE.Group();
  group.name = 'shaft';

  const { radius: r, seatRadius: sr, rearEnd, frontEnd } = D.shaft;
  const bearingZ = D.bearing.z;
  const seatHalf = D.bearing.width / 2 + 0.05;

  const profile = [
    [0, rearEnd],
    [r * 0.62, rearEnd],
    [r * 0.62, rearEnd + 0.4],
    [sr, rearEnd + 0.4],
    [sr, -(bearingZ + seatHalf)],
    [r, -(bearingZ + seatHalf)],
    [r, bearingZ + seatHalf],
    [sr, bearingZ + seatHalf],
    [sr, frontEnd - 1.15],
    [r, frontEnd - 1.15],
    [r, frontEnd - 0.15],
    [r * 0.72, frontEnd],
    [0, frontEnd],
  ];

  const shaft = shadedMesh(
    latheZ(profile, 48),
    steel({ color: 0xa8b3bd, roughness: 0.24, metalness: 0.98 }),
  );
  group.add(shaft);

  return group;
}
