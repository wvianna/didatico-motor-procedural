/**
 * Ímãs permanentes do estator: dois setores de coroa colados à face interna
 * da carcaça, defasados de 180°.
 */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { ferrite } from '../materials.js';
import { annularSectorShape, shadedMesh } from './util.js';

const CENTERS = [Math.PI * 0.75, Math.PI * 1.75];

function makePole(centerAngle) {
  const { inner, outer, arc, length } = D.magnet;

  const shape = annularSectorShape(
    inner,
    outer,
    centerAngle - arc / 2,
    centerAngle + arc / 2,
  );
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 28,
  });
  geometry.translate(0, 0, -length / 2);

  const group = new THREE.Group();
  const pole = shadedMesh(geometry, ferrite());
  group.add(pole);
  group.userData.centerAngle = centerAngle;
  return group;
}

export function buildMagnets() {
  const group = new THREE.Group();
  group.name = 'magnets';

  const poles = CENTERS.map((angle) => {
    const pole = makePole(angle);
    group.add(pole);
    return pole;
  });

  return { group, poles };
}
