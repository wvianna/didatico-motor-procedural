/** Auxiliares geométricos compartilhados pelos construtores de peças. */

import * as THREE from 'three';
import { mergeGeometries as mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Junta geometrias em uma só. `mergeGeometries` exige que todas sejam
 * indexadas ou todas não-indexadas, por isso normalizamos para não-indexado.
 */
export function mergeAll(geometries) {
  const list = geometries.filter((geometry) => geometry && geometry.attributes.position);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  const normalized = list.map((geometry) => {
    if (!geometry.index) return geometry;
    const flat = geometry.toNonIndexed();
    geometry.dispose();
    return flat;
  });

  return mergeBufferGeometries(normalized);
}

/**
 * Perfil revolucionado em torno do eixo Z (o eixo do motor).
 * `points` são pares [raio, z].
 */
export function latheZ(points, segments = 64) {
  const profile = points.map(([radius, z]) => new THREE.Vector2(Math.max(radius, 0), z));
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** Setor de coroa circular, no plano XY — base para ímãs e berços. */
export function annularSectorShape(rInner, rOuter, startAngle, endAngle) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOuter, startAngle, endAngle, false);
  shape.absarc(0, 0, rInner, endAngle, startAngle, true);
  shape.closePath();
  return shape;
}

/** Furo circular para usar em `Shape.holes`. */
export function circularHole(radius, segments = 40) {
  const path = new THREE.Path();
  path.absarc(0, 0, radius, 0, Math.PI * 2, true);
  path.curves.forEach(() => {});
  path.userData = { segments };
  return path;
}

/** Mola helicoidal ao longo de +X. */
export function springGeometry({ length, radius, turns, wireRadius }) {
  const steps = Math.max(24, Math.round(turns * 18));
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    points.push(
      new THREE.Vector3(t * length, Math.cos(angle) * radius, Math.sin(angle) * radius),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, steps * 2, wireRadius, 6, false);
}

/** Cria uma malha já configurada para sombras. */
export function shadedMesh(geometry, material, { cast = true, receive = true } = {}) {
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = cast;
  object.receiveShadow = receive;
  return object;
}

/** Fecha um perfil de revolução (último ponto = primeiro). */
export function closedProfile(points) {
  const [first] = points;
  const [last] = points.slice(-1);
  if (!first || !last) return points;
  const same = Math.abs(first[0] - last[0]) < 1e-9 && Math.abs(first[1] - last[1]) < 1e-9;
  return same ? points : [...points, first];
}
