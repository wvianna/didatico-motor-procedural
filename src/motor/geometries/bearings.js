/**
 * Rolamentos de esferas.
 *
 * Duas pistas (interna e externa) + esferas em `InstancedMesh`. É uma
 * simplificação: não há gaiola nem perfil de ranhura de pista, mas a leitura
 * de "rolamento" fica imediata e o custo é baixo.
 */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { steel } from '../materials.js';
import { closedProfile, latheZ, shadedMesh } from './util.js';

const { z, innerRace, outerRace, ballRadius, ballOrbit, balls, width } = D.bearing;

function raceProfile(range, direction) {
  const [rInner, rOuter] = range;
  const chamfer = 0.012;
  return closedProfile(
    [
      [rInner, -width / 2],
      [rOuter - chamfer, -width / 2],
      [rOuter, -width / 2 + chamfer],
      [rOuter, width / 2 - chamfer],
      [rOuter - chamfer, width / 2],
      [rInner, width / 2],
    ].map(([r, zz]) => [r, direction > 0 ? zz : -zz]),
  );
}

function makeBearing(direction) {
  const group = new THREE.Group();

  const raceMaterial = steel({ color: 0xc2ccd6, roughness: 0.18, metalness: 0.98 });
  raceMaterial.side = THREE.DoubleSide;

  const inner = shadedMesh(latheZ(raceProfile(innerRace, direction), 48), raceMaterial);
  group.add(inner);

  const outer = shadedMesh(
    latheZ(raceProfile(outerRace, direction), 48),
    steel({ color: 0xaab5c0, roughness: 0.2, metalness: 0.98 }),
  );
  group.add(outer);

  const ballMaterial = steel({ color: 0xdde5ec, roughness: 0.1, metalness: 1.0 });
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 14, 10);
  const ballMesh = new THREE.InstancedMesh(ballGeometry, ballMaterial, balls);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < balls; i += 1) {
    const angle = (i / balls) * Math.PI * 2;
    matrix.makeTranslation(Math.cos(angle) * ballOrbit, Math.sin(angle) * ballOrbit, 0);
    ballMesh.setMatrixAt(i, matrix);
  }
  ballMesh.instanceMatrix.needsUpdate = true;
  ballMesh.frustumCulled = false;
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;
  group.add(ballMesh);

  group.position.z = direction * z;
  return group;
}

export function buildBearings() {
  const front = makeBearing(1);
  front.name = 'frontBearing';
  const rear = makeBearing(-1);
  rear.name = 'rearBearing';
  return { front, rear };
}
