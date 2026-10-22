/**
 * Seleção e realce de peças.
 *
 * O `partId` vive no grupo da peça; o raycast atinge a malha, então subimos
 * pela hierarquia até encontrar o ancestral que declara o id. O realce mexe
 * em `emissive` e restaura o valor original — os materiais são exclusivos por
 * peça, logo o efeito não vaza para o resto do motor.
 */

import * as THREE from 'three';

const HOVER_COLOR = 0x2c6a92;
const HOVER_INTENSITY = 0.55;
const SELECT_COLOR = 0x2f8ec9;
const SELECT_INTENSITY = 1.15;

function findPartNode(object) {
  let node = object;
  while (node && !node.userData?.partId) node = node.parent;
  return node ?? null;
}

export function createPicker({ camera, domElement, root, onSelect }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const originals = new Map();
  let hovered = null;
  let selected = null;
  let pointerDown = null;

  function remember(material) {
    if (originals.has(material)) return;
    originals.set(material, {
      color: material.emissive.getHex(),
      intensity: material.emissiveIntensity,
    });
  }

  function paint(node, color, intensity) {
    node.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!material || !material.emissive) continue;
        remember(material);
        material.emissive.setHex(color);
        material.emissiveIntensity = intensity;
      }
    });
  }

  function restore(node) {
    node.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        const original = originals.get(material);
        if (!original) continue;
        material.emissive.setHex(original.color);
        material.emissiveIntensity = original.intensity;
      }
    });
  }

  function pick(event) {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(root, true);

    // Peças translúcidas (a carcaça) são o último recurso: se houver algo
    // sólido atrás delas, é isso que o usuário quis clicar.
    let seeThrough = null;
    for (const hit of hits) {
      const node = findPartNode(hit.object);
      if (!node) continue;
      if (node.userData.seeThrough) {
        seeThrough ??= node;
        continue;
      }
      return node;
    }
    return seeThrough;
  }

  function setHovered(node) {
    if (hovered === node) return;
    if (hovered && hovered !== selected) restore(hovered);
    hovered = node;
    if (hovered && hovered !== selected) paint(hovered, HOVER_COLOR, HOVER_INTENSITY);
    domElement.style.cursor = node ? 'pointer' : 'grab';
  }

  function select(node) {
    if (selected === node) {
      onSelect?.(node ? node.userData.partId : null);
      return;
    }
    if (selected) restore(selected);
    selected = node;
    if (selected) paint(selected, SELECT_COLOR, SELECT_INTENSITY);
    onSelect?.(node ? node.userData.partId : null);
  }

  function onPointerMove(event) {
    setHovered(pick(event));
  }

  function onPointerDown(event) {
    pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
  }

  function onPointerUp(event) {
    if (!pointerDown) return;
    const dx = event.clientX - pointerDown.x;
    const dy = event.clientY - pointerDown.y;
    const moved = Math.hypot(dx, dy);
    const elapsed = performance.now() - pointerDown.time;
    pointerDown = null;
    // Arrastar a câmera não deve selecionar peças.
    if (moved > 5 || elapsed > 600) return;
    select(pick(event));
  }

  function onPointerLeave() {
    setHovered(null);
  }

  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointerup', onPointerUp);
  domElement.addEventListener('pointerleave', onPointerLeave);

  return {
    select(node) {
      select(node);
    },
    clear() {
      setHovered(null);
      if (selected) restore(selected);
      selected = null;
    },
    dispose() {
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointerleave', onPointerLeave);
      originals.clear();
    },
  };
}
