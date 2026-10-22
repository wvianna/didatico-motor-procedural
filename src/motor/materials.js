/**
 * Paleta de materiais PBR.
 *
 * Cada fábrica devolve uma **nova instância**: o realce de seleção altera
 * `emissive` no material, e materiais compartilhados entre peças fariam o
 * destaque vazar para o motor inteiro.
 */

import * as THREE from 'three';

/** Aço claro — eixo, parafusos, pistas de rolamento. */
export function steel({ color = 0x9aa6b2, roughness = 0.32, metalness = 0.95 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 1.2 });
}

/** Aço escuro — núcleo laminado, suportes. */
export function darkSteel({ color = 0x5b6672, roughness = 0.55, metalness = 0.85 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 1.0 });
}

/**
 * Carcaça translúcida: vidro metálico azulado.
 *
 * `depthWrite: false` é essencial — sem isso a casca esconde o rotor mesmo
 * sendo transparente, porque ela gravaria profundidade na frente de tudo.
 */
export function housingPaint() {
  return new THREE.MeshStandardMaterial({
    color: 0x8fb6d2,
    roughness: 0.18,
    metalness: 0.35,
    envMapIntensity: 1.7,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/** Cobre dos enrolamentos e do comutador. */
export function copper({ color = 0xb87333, roughness = 0.34 } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 1.0,
    envMapIntensity: 1.35,
  });
}

/** Cobre mais escuro para os segmentos do comutador (área de atrito). */
export function commutatorCopper() {
  return new THREE.MeshStandardMaterial({
    color: 0xc47a3e,
    roughness: 0.28,
    metalness: 1.0,
    envMapIntensity: 1.45,
  });
}

/** Bronze das molas de pressão. */
export function bronze() {
  return new THREE.MeshStandardMaterial({
    color: 0xc08a4a,
    roughness: 0.38,
    metalness: 0.95,
    envMapIntensity: 1.2,
  });
}

/** Ferrite dos ímãs permanentes. */
export function ferrite() {
  return new THREE.MeshStandardMaterial({
    color: 0x24262c,
    roughness: 0.62,
    metalness: 0.4,
    envMapIntensity: 0.85,
  });
}

/** Grafite das escovas. */
export function graphite() {
  return new THREE.MeshStandardMaterial({
    color: 0x1c1d20,
    roughness: 0.92,
    metalness: 0.18,
    envMapIntensity: 0.6,
  });
}

/** Isolante / mica / plástico preto. */
export function insulation({ color = 0x15171b, roughness = 0.7 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}

/** Cápsula de identificação dos terminais. */
export function plastic(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 });
}

/** Material do piso da cena. */
export function groundMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x0b1016,
    roughness: 0.96,
    metalness: 0.04,
  });
}
