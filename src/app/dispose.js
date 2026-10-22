/**
 * Descarte de recursos de GPU.
 *
 * Chamado quando a cena é recriada (troca de motor, reinício completo, perda
 * de contexto WebGL). Percorre a árvore liberando geometrias, materiais e
 * texturas — sem isso, cada reconstrução deixa buffers na memória da placa.
 */

export function disposeObject(root) {
  if (!root) return;

  root.traverse((node) => {
    if (node.geometry) {
      node.geometry.dispose();
      node.geometry = null;
    }

    const materials = Array.isArray(node.material)
      ? node.material
      : node.material
        ? [node.material]
        : [];

    for (const material of materials) {
      for (const key of Object.keys(material)) {
        const value = material[key];
        if (value && value.isTexture) value.dispose();
      }
      material.dispose();
    }

    if (node.isInstancedMesh) {
      node.dispose();
    }
  });

  root.clear?.();
}

/**
 * Descarta somente as geometrias e materiais de um objeto, mantendo a árvore.
 * Útil quando o modelo é reconstruído mas o grupo raiz é reaproveitado.
 */
export function disposeOwnResources(object) {
  if (!object) return;
  object.geometry?.dispose();
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  for (const material of materials) material?.dispose();
}
