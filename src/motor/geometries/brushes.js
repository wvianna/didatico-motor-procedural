/**
 * Conjunto de escovas: duas montagens opostas (0° e 180°), cada uma com
 * escova de grafite, porta-escova, mola de pressão e braço de fixação na
 * tampa traseira.
 *
 * As escovas encostam no comutador e NÃO giram — são irmãs do rotor na
 * hierarquia, não filhas.
 */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { bronze, darkSteel, graphite, steel } from '../materials.js';
import { shadedMesh, springGeometry } from './util.js';

function makeBrushAssembly(side) {
  const group = new THREE.Group();

  const { inner, outer, width, depth } = D.brush;
  const span = outer - inner;
  const centerX = (inner + outer) / 2;

  const brush = shadedMesh(new THREE.BoxGeometry(span, width, depth), graphite());
  brush.position.set(side * centerX, 0, 0);
  group.add(brush);

  const holderMaterial = darkSteel({ color: 0x6b7784, roughness: 0.42, metalness: 0.85 });

  for (const sign of [-1, 1]) {
    const plate = shadedMesh(
      new THREE.BoxGeometry(span + 0.06, 0.035, depth + 0.09),
      holderMaterial,
    );
    plate.position.set(side * centerX, sign * (width / 2 + 0.025), 0);
    group.add(plate);
  }

  const backPlate = shadedMesh(
    new THREE.BoxGeometry(0.05, width + 0.12, depth + 0.09),
    darkSteel({ color: 0x5c6873, roughness: 0.45, metalness: 0.85 }),
  );
  backPlate.position.set(side * (outer + 0.03), 0, 0);
  group.add(backPlate);

  // Mola helicoidal empurrando a escova contra o comutador.
  const spring = shadedMesh(
    springGeometry({ length: 0.3, radius: 0.085, turns: 4.5, wireRadius: 0.026 }),
    bronze(),
  );
  spring.position.set(side * (outer + 0.055), 0, 0);
  if (side < 0) spring.rotation.y = Math.PI;
  group.add(spring);

  // Braço que prende o porta-escova à tampa traseira.
  const arm = shadedMesh(
    new THREE.BoxGeometry(0.09, 0.09, 0.72),
    steel({ color: 0x83909c, roughness: 0.4, metalness: 0.9 }),
  );
  arm.position.set(side * (outer + 0.03), 0, -0.52);
  group.add(arm);

  return group;
}

export function buildBrushes() {
  const group = new THREE.Group();
  group.name = 'brushes';
  group.position.z = D.brush.z;

  const assemblies = [makeBrushAssembly(1), makeBrushAssembly(-1)];
  assemblies.forEach((assembly) => group.add(assembly));

  return { group, assemblies };
}
