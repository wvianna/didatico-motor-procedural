/** Terminais de alimentação: dois pinos isolados na tampa traseira. */

import * as THREE from 'three';
import { COVER_Z, D } from '../dimensions.js';
import { insulation, plastic, steel } from '../materials.js';
import { shadedMesh } from './util.js';

const FACE_Z = -(COVER_Z + D.cover.thickness);

function makeTerminal(x, y, color) {
  const group = new THREE.Group();

  const post = shadedMesh(
    new THREE.CylinderGeometry(D.terminal.radius, D.terminal.radius, D.terminal.length, 14),
    steel({ color: 0xd0b26a, roughness: 0.3, metalness: 0.9 }),
  );
  post.rotation.x = Math.PI / 2;
  post.position.z = FACE_Z - D.terminal.length / 2;
  group.add(post);

  const sleeve = shadedMesh(
    new THREE.CylinderGeometry(D.terminal.radius * 1.9, D.terminal.radius * 1.9, 0.1, 14),
    insulation({ color: 0x101318 }),
  );
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.z = FACE_Z - 0.05;
  group.add(sleeve);

  const cap = shadedMesh(
    new THREE.CylinderGeometry(D.terminal.radius * 1.6, D.terminal.radius * 1.6, 0.16, 14),
    plastic(color),
  );
  cap.rotation.x = Math.PI / 2;
  cap.position.z = FACE_Z - D.terminal.length + 0.08;
  group.add(cap);

  // Aba de solda.
  const tab = shadedMesh(new THREE.BoxGeometry(0.16, 0.03, 0.2), steel({ color: 0xcbb26f }));
  tab.position.set(0, 0, FACE_Z - D.terminal.length + 0.02);
  group.add(tab);

  group.position.set(x, y, 0);
  return group;
}

export function buildTerminals() {
  const group = new THREE.Group();
  group.name = 'terminals';

  const x = D.terminal.x * 1.35;
  const y = D.terminal.y;
  group.add(makeTerminal(-x, y, 0xc0392b));
  group.add(makeTerminal(x, y, 0x1c1c1c));

  return group;
}
