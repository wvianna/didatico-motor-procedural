/**
 * Comutador segmentado.
 *
 * Oito segmentos de cobre separados por finas ranhuras, montados sobre um
 * cilindro de mica. Gira solidário ao eixo: é ele que troca a corrente nas
 * bobinas a cada meia volta.
 */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { commutatorCopper, darkSteel, insulation } from '../materials.js';
import { mergeAll, shadedMesh } from './util.js';

export function buildCommutator() {
  const group = new THREE.Group();
  group.name = 'commutator';

  const { z, length, radius, segments, micaRadius, hubRadius } = D.commutator;
  group.position.z = z;

  const step = (Math.PI * 2) / segments;
  const gap = 0.055;

  const segmentGeometries = [];
  for (let i = 0; i < segments; i += 1) {
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      12,
      1,
      false,
      i * step + gap / 2,
      step - gap,
    );
    geometry.rotateX(Math.PI / 2);
    segmentGeometries.push(geometry);
  }

  const copper = shadedMesh(mergeAll(segmentGeometries), commutatorCopper());
  group.add(copper);

  const mica = shadedMesh(
    new THREE.CylinderGeometry(micaRadius, micaRadius, length, 40),
    insulation({ color: 0x2a2622, roughness: 0.75 }),
  );
  mica.rotation.x = Math.PI / 2;
  group.add(mica);

  const hub = shadedMesh(
    new THREE.CylinderGeometry(hubRadius, hubRadius, length * 1.25, 24),
    darkSteel({ color: 0x59636e, roughness: 0.55 }),
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  return group;
}
