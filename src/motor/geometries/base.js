/** Base de fixação: dois berços que abraçam a carcaça, paredes e chapa de piso. */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { darkSteel } from '../materials.js';
import { annularSectorShape, shadedMesh } from './util.js';

export function buildBase() {
  const group = new THREE.Group();
  group.name = 'base';

  const {
    cradleInner,
    cradleOuter,
    cradleWidth,
    cradleZ,
    plateY,
    plateWidth,
    plateLength,
    plateThickness,
  } = D.base;

  const material = darkSteel({ color: 0x4d5b68, roughness: 0.48, metalness: 0.75 });

  // Berços em meia-lua, abraçando a carcaça por baixo (200° → 340°).
  const cradleShape = annularSectorShape(
    cradleInner,
    cradleOuter,
    Math.PI * 1.1,
    Math.PI * 1.9,
  );
  const cradleGeometry = new THREE.ExtrudeGeometry(cradleShape, {
    depth: cradleWidth,
    bevelEnabled: false,
    curveSegments: 24,
  });
  cradleGeometry.translate(0, 0, -cradleWidth / 2);

  for (const z of [-cradleZ, cradleZ]) {
    const cradle = shadedMesh(cradleGeometry.clone(), material);
    cradle.position.z = z;
    group.add(cradle);
  }
  cradleGeometry.dispose();

  // Paredes laterais que ligam os berços à chapa de piso.
  const wallTop = -cradleOuter + 0.05;
  const wallHeight = Math.abs(plateY - wallTop);
  for (const z of [-cradleZ, cradleZ]) {
    const wall = shadedMesh(
      new THREE.BoxGeometry(plateWidth, wallHeight, 0.14),
      darkSteel({ color: 0x44515d, roughness: 0.55, metalness: 0.7 }),
    );
    wall.position.set(0, wallTop - wallHeight / 2, z);
    group.add(wall);
  }

  const plate = shadedMesh(
    new THREE.BoxGeometry(plateWidth, plateThickness, plateLength),
    darkSteel({ color: 0x38444f, roughness: 0.62, metalness: 0.6 }),
  );
  plate.position.set(0, plateY + plateThickness / 2, 0);
  group.add(plate);

  // Furos de fixação sugeridos por pequenos ressaltos.
  for (const x of [-plateWidth / 2 + 0.28, plateWidth / 2 - 0.28]) {
    for (const z of [-plateLength / 2 + 0.35, plateLength / 2 - 0.35]) {
      const boss = shadedMesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.05, 14),
        darkSteel({ color: 0x2c363f, roughness: 0.7 }),
        { cast: false },
      );
      boss.position.set(x, plateY + plateThickness + 0.02, z);
      group.add(boss);
    }
  }

  return group;
}
