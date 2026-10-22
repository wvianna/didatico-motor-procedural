/** Carcaça cilíndrica: casco de chapa com chanfros e placa de identificação. */

import * as THREE from 'three';
import { D, HOUSING_HALF } from '../dimensions.js';
import { housingPaint, darkSteel } from '../materials.js';
import { closedProfile, latheZ, shadedMesh } from './util.js';

export function buildHousing() {
  const group = new THREE.Group();
  group.name = 'housing';
  // Marca a peça como "atravessável": cliques preferem o que estiver atrás
  // dela, mas ela continua selecionável quando nada está por trás.
  group.userData.seeThrough = true;

  const { radius, wall } = D.housing;
  const half = HOUSING_HALF;
  const inner = radius - wall;
  const chamfer = 0.06;

  const shellProfile = closedProfile([
    [inner, -half],
    [radius - chamfer, -half],
    [radius, -half + chamfer],
    [radius, half - chamfer],
    [radius - chamfer, half],
    [inner, half],
  ]);

  const material = housingPaint();
  material.side = THREE.DoubleSide;

  // A casca transparente não projeta sombra: uma sombra opaca no chão
  // denunciaria uma parede que a vista mostra vazada.
  const shell = shadedMesh(latheZ(shellProfile, 72), material, { cast: false });
  group.add(shell);

  // Placa de identificação no topo da carcaça.
  const plateMaterial = darkSteel({ color: 0x2b3a47, roughness: 0.42, metalness: 0.7 });
  const plate = shadedMesh(new THREE.BoxGeometry(0.72, 0.05, 1.5), plateMaterial);
  plate.position.set(0, radius - 0.035, 0.6);
  group.add(plate);

  return group;
}
