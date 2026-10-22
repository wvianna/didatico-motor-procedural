/**
 * Núcleo laminado do rotor.
 *
 * A seção é um `Shape` com oito dentes e um furo central (o eixo atravessa).
 * As 24 lâminas são instâncias da MESMA geometria: um único draw call e a
 * leitura de "pacote de chapas" aparece nas frestas entre elas.
 */

import * as THREE from 'three';
import { D } from '../dimensions.js';
import { darkSteel } from '../materials.js';

function coreShape(rOuter, rSlot, teeth) {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  const toothSpan = step * 0.55;

  for (let i = 0; i < teeth; i += 1) {
    const start = i * step;
    const end = start + toothSpan;

    if (i === 0) {
      shape.moveTo(Math.cos(start) * rOuter, Math.sin(start) * rOuter);
    } else {
      shape.lineTo(Math.cos(start) * rOuter, Math.sin(start) * rOuter);
    }

    shape.absarc(0, 0, rOuter, start, end, false);
    shape.lineTo(Math.cos(end) * rSlot, Math.sin(end) * rSlot);
    shape.absarc(0, 0, rSlot, end, start + step, false);
    shape.lineTo(Math.cos(start + step) * rOuter, Math.sin(start + step) * rOuter);
  }
  shape.closePath();

  const bore = new THREE.Path();
  bore.absarc(0, 0, D.rotor.boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  return shape;
}

export function buildRotorCore() {
  const group = new THREE.Group();
  group.name = 'rotorCore';

  const { outerRadius, slotRadius, teeth, laminations, laminationThickness } = D.rotor;

  const geometry = new THREE.ExtrudeGeometry(coreShape(outerRadius, slotRadius, teeth), {
    depth: laminationThickness,
    bevelEnabled: false,
    curveSegments: 6,
  });

  const material = darkSteel({ color: 0x66717d, roughness: 0.5, metalness: 0.9 });
  const mesh = new THREE.InstancedMesh(geometry, material, laminations);

  const pitch = laminationThickness + 0.006;
  const startZ = -((laminations - 1) * pitch + laminationThickness) / 2;

  const matrix = new THREE.Matrix4();
  for (let i = 0; i < laminations; i += 1) {
    matrix.makeTranslation(0, 0, startZ + i * pitch);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  group.add(mesh);
  return group;
}
