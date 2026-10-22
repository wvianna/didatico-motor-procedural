/**
 * Rótulos da vista explodida.
 *
 * Cada peça recebe um número e um nome, posicionados como **chamadas
 * técnicas**: o rótulo sai do centro projetado da peça no sentido radial,
 * as linhas-guia ligam o rótulo à peça, e cada metade da tela é empacotada
 * verticalmente para que nada se sobreponha.
 *
 * O posicionamento é feito em coordenadas de tela (não em CSS2D) porque o
 * layout precisa de anti-sobreposição e de recorte nas bordas — coisas que um
 * objeto ancorado em 3D não dá.
 */

import * as THREE from 'three';

const RADIAL_OFFSET = 58;
const MIN_GAP = 4;
const PAD = 10;
const REFRESH_INTERVAL = 0.1;

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createLabels({ container, camera, parts, catalog }) {
  const root = document.createElement('div');
  root.className = 'label-layer';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'label-lines');
  root.appendChild(svg);

  container.appendChild(root);

  const entries = [];
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  const projected = new THREE.Vector3();

  for (const entry of catalog) {
    const node = parts.get(entry.id);
    if (!node) continue;

    const element = document.createElement('div');
    element.className = 'label';
    element.innerHTML = `<span class="label-index">${entry.index}</span><span class="label-name">${entry.name}</span>`;
    root.appendChild(element);

    const line = document.createElementNS(SVG_NS, 'line');
    svg.appendChild(line);

    entries.push({
      entry,
      node,
      element,
      line,
      sx: 0,
      sy: 0,
      w: 0,
      h: 0,
      onScreen: false,
    });
  }

  let visible = false;
  let accumulator = REFRESH_INTERVAL;
  let selectedId = null;

  function hideAll() {
    for (const item of entries) {
      item.element.style.display = 'none';
      item.line.style.display = 'none';
    }
  }

  function measure(item) {
    if (item.w > 0) return;
    item.w = item.element.offsetWidth || 120;
    item.h = item.element.offsetHeight || 22;
  }

  function layout(width, height, view) {
    if (!visible) return;

    const maxRight = Math.max((view?.right ?? width) - PAD, PAD + 60);
    const maxBottom = Math.max((view?.bottom ?? height) - PAD, PAD + 30);
    const obstacles = view?.obstacles ?? [];

    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (const item of entries) {
      box.setFromObject(item.node);
      if (box.isEmpty()) {
        item.onScreen = false;
        continue;
      }
      box.getCenter(center);
      projected.copy(center).project(camera);

      item.sx = (projected.x * 0.5 + 0.5) * width;
      item.sy = (-projected.y * 0.5 + 0.5) * height;
      item.onScreen = projected.z > -1 && projected.z < 1;

      if (item.onScreen) {
        measure(item);
        sumX += item.sx;
        sumY += item.sy;
        count += 1;
      }
    }

    if (count === 0) {
      hideAll();
      return;
    }

    const cx = sumX / count;
    const cy = sumY / count;
    const halves = { left: [], right: [] };

    for (const item of entries) {
      if (!item.onScreen) {
        item.element.style.display = 'none';
        item.line.style.display = 'none';
        continue;
      }

      const dx = item.sx - cx;
      const dy = item.sy - cy;
      const length = Math.hypot(dx, dy);
      const ux = length > 1e-3 ? dx / length : 0;
      const uy = length > 1e-3 ? dy / length : -1;

      item.ax = item.sx + ux * RADIAL_OFFSET;
      item.ay = item.sy + uy * RADIAL_OFFSET;
      item.side = item.ax < cx ? -1 : 1;
      (item.side < 0 ? halves.left : halves.right).push(item);
    }

    for (const group of [halves.left, halves.right]) {
      group.sort((a, b) => a.ay - b.ay);

      let bottom = -Infinity;
      for (const item of group) {
        item.ly = Math.max(item.ay - item.h / 2, bottom + MIN_GAP);
        bottom = item.ly + item.h;
      }

      // Se a coluna passou do rodapé, sobe todo mundo junto.
      const overflow = bottom - (maxBottom - PAD);
      if (overflow > 0) {
        for (const item of group) item.ly -= overflow;
      }
    }

    // Cada coluna alinha numa borda comum: sem isso, rótulos de larguras
    // diferentes na mesma altura se sobrepõem horizontalmente.
    const leftEdge = halves.left.length
      ? Math.min(...halves.left.map((item) => item.ax))
      : 0;
    const rightEdge = halves.right.length
      ? Math.max(...halves.right.map((item) => item.ax))
      : 0;

    for (const item of entries) {
      if (!item.onScreen) continue;

      let lx = item.side < 0 ? leftEdge - item.w : rightEdge;
      lx = Math.min(Math.max(lx, PAD), Math.max(maxRight - item.w, PAD));
      let ly = Math.min(Math.max(item.ly, PAD), Math.max(maxBottom - item.h, PAD));

      // Desvia de blocos fixos da interface (título).
      for (const rect of obstacles) {
        const intersects =
          lx < rect.right && lx + item.w > rect.left && ly < rect.bottom && ly + item.h > rect.top;
        if (intersects) {
          ly = Math.min(rect.bottom + MIN_GAP + 2, Math.max(maxBottom - item.h, PAD));
        }
      }

      item.element.style.display = '';
      item.element.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;

      const anchorX = item.side < 0 ? lx + item.w : lx;
      const anchorY = ly + item.h / 2;
      item.line.style.display = '';
      item.line.setAttribute('x1', item.sx.toFixed(1));
      item.line.setAttribute('y1', item.sy.toFixed(1));
      item.line.setAttribute('x2', anchorX.toFixed(1));
      item.line.setAttribute('y2', anchorY.toFixed(1));
    }

    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    if (selectedId) markSelected(selectedId);
  }

  function markSelected(id) {
    selectedId = id;
    for (const item of entries) {
      item.element.classList.toggle('is-active', item.entry.id === id);
    }
  }

  return {
    setVisible(value) {
      if (visible === value) return;
      visible = value;
      root.classList.toggle('is-on', value);
      if (value) {
        accumulator = REFRESH_INTERVAL;
      } else {
        hideAll();
        svg.setAttribute('width', 0);
        svg.setAttribute('height', 0);
      }
    },
    get visible() {
      return visible;
    },
    select(id) {
      markSelected(id);
    },
    update(dt, width, height, view) {
      if (!visible) return;
      accumulator += dt;
      if (accumulator < REFRESH_INTERVAL) return;
      accumulator = 0;
      layout(width, height, view);
    },
    dispose() {
      root.remove();
      entries.length = 0;
    },
  };
}
