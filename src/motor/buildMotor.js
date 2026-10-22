/**
 * Montagem do motor: cria a hierarquia definitiva e registra cada peça.
 *
 * Regra de ouro da árvore:
 *   - `rotorGroup` é o ÚNICO nó que gira (rotação em Z);
 *   - carcaça, tampas, ímãs, escovas e base são IRMÃOS do rotor, nunca filhos;
 *   - mancais são filhos das respectivas tampas (movem-se junto na explosão);
 *   - cada nó que se desloca declara seu offset em `userData.explode`.
 *
 * As posições de repouso são lidas depois, pelo controlador de explosão,
 * a partir da própria cena — não são duplicadas em nenhuma tabela.
 */

import * as THREE from 'three';
import { buildBase } from './geometries/base.js';
import { buildBearings } from './geometries/bearings.js';
import { buildBrushes } from './geometries/brushes.js';
import { buildCommutator } from './geometries/commutator.js';
import { buildCovers } from './geometries/covers.js';
import { buildFasteners } from './geometries/fasteners.js';
import { buildHousing } from './geometries/housing.js';
import { buildMagnets } from './geometries/magnets.js';
import { buildRotorCore } from './geometries/rotorCore.js';
import { buildShaft } from './geometries/shaft.js';
import { buildTerminals } from './geometries/terminals.js';
import { buildWindings } from './geometries/windings.js';

/** Direções de separação da vista explodida. */
export const EXPLODE = {
  housing: { dir: new THREE.Vector3(0.62, 0.78, 0), dist: 5.2 },
  frontCover: { dir: new THREE.Vector3(0, 0, 1), dist: 2.4 },
  rearCover: { dir: new THREE.Vector3(0, 0, -1), dist: 2.4 },
  bearing: { dir: new THREE.Vector3(0, 0, 1), dist: 1.0 },
  terminals: { dir: new THREE.Vector3(0, 0.34, -1).normalize(), dist: 3.3 },
  magnets: { dir: new THREE.Vector3(0, 1, 0), dist: 1.5 },
  brushes: { dir: new THREE.Vector3(1, 0, 0), dist: 1.4 },
  base: { dir: new THREE.Vector3(0, -1, 0), dist: 2.6 },
  screwsFront: { dir: new THREE.Vector3(0, 0, 1), dist: 2.6 },
  screwsRear: { dir: new THREE.Vector3(0, 0, -1), dist: 2.6 },
};

export function buildMotor() {
  const root = new THREE.Group();
  root.name = 'motorRoot';

  const statics = new THREE.Group();
  statics.name = 'staticGroup';

  const rotorGroup = new THREE.Group();
  rotorGroup.name = 'rotorGroup';

  root.add(statics, rotorGroup);

  /** @type {Map<string, THREE.Object3D>} */
  const parts = new Map();

  function register(node, id, explode) {
    node.userData.partId = id;
    if (explode) node.userData.explode = explode;
    parts.set(id, node);
    return node;
  }

  // ------------------------------------------------------------ conjuntos
  const { front: frontCover, rear: rearCover } = buildCovers();
  const { front: frontBearing, rear: rearBearing } = buildBearings();

  // Os mancais ficam DENTRO das tampas: acompanham o movimento delas.
  frontCover.add(frontBearing);
  frontBearing.position.z -= frontCover.position.z;
  rearCover.add(rearBearing);
  rearBearing.position.z -= rearCover.position.z;

  register(frontBearing, 'frontBearing', EXPLODE.bearing);
  register(rearBearing, 'rearBearing', {
    dir: EXPLODE.bearing.dir.clone().negate(),
    dist: EXPLODE.bearing.dist,
  });

  // ------------------------------------------------------------------ base
  const base = buildBase();
  statics.add(base);
  register(base, 'base', EXPLODE.base);

  // ----------------------------------------------------------------- tampas
  statics.add(frontCover, rearCover);
  register(frontCover, 'frontCover', EXPLODE.frontCover);
  register(rearCover, 'rearCover', EXPLODE.rearCover);

  // ------------------------------------------------------------- terminais
  const terminals = buildTerminals();
  statics.add(terminals);
  register(terminals, 'terminals', EXPLODE.terminals);

  // -------------------------------------------------------------- parafusos
  const fasteners = buildFasteners();
  statics.add(fasteners);
  register(fasteners, 'fasteners');
  for (const screw of fasteners.userData.screws) {
    screw.userData.explode =
      screw.userData.screwDirection > 0 ? EXPLODE.screwsFront : EXPLODE.screwsRear;
  }

  // ---------------------------------------------------------------- escovas
  const { group: brushGroup, assemblies: brushAssemblies } = buildBrushes();
  statics.add(brushGroup);
  register(brushGroup, 'brushes');
  brushAssemblies.forEach((assembly, index) => {
    assembly.userData.explode = {
      dir: EXPLODE.brushes.dir.clone().multiplyScalar(index === 0 ? 1 : -1),
      dist: EXPLODE.brushes.dist,
    };
  });

  // ------------------------------------------------------------------ ímãs
  const { group: magnetGroup, poles } = buildMagnets();
  statics.add(magnetGroup);
  register(magnetGroup, 'magnets');
  poles.forEach((pole) => {
    // Cada polo sai na própria direção radial (135° e 315°).
    const angle = pole.userData.centerAngle ?? 0;
    pole.userData.explode = {
      dir: new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0),
      dist: EXPLODE.magnets.dist,
    };
  });

  // ---------------------------------------------------------------- carcaça
  const housing = buildHousing();
  statics.add(housing);
  register(housing, 'housing', EXPLODE.housing);

  // ------------------------------------------------- conjunto girante (rígido)
  const shaft = buildShaft();
  const rotorCore = buildRotorCore();
  const windings = buildWindings();
  const commutator = buildCommutator();

  rotorGroup.add(shaft, rotorCore, windings, commutator);
  register(shaft, 'shaft');
  register(rotorCore, 'rotorCore');
  register(windings, 'windings');
  register(commutator, 'commutator');

  return {
    root,
    statics,
    rotorGroup,
    parts,
  };
}
