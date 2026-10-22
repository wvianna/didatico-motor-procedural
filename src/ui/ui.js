/**
 * Camada de interface (DOM).
 *
 * Este módulo não conhece Three.js: recebe comandos do `App` e devolve
 * intenções do usuário por callbacks. É o que mantém a UI testável e evita
 * que a lógica da animação dependa do layout.
 */

import { createLegend } from './legend.js';
import { createInfoPanel } from './infoPanel.js';

const STATE_TEXT = {
  INITIALIZED: { label: 'Inicializando', hint: 'Preparando a cena 3D…' },
  ASSEMBLED: {
    label: 'Montado',
    hint: 'Motor parado e montado. Use Reproduzir para iniciar a demonstração.',
  },
  RUNNING: {
    label: 'Em funcionamento',
    hint: 'O rotor gira dentro do campo dos ímãs; carcaça e escovas permanecem paradas.',
  },
  DECELERATING: {
    label: 'Desacelerando',
    hint: 'Fim das cinco voltas: o eixo perde velocidade até parar exatamente em 1800°.',
  },
  EXPLODING: {
    label: 'Desmontando',
    hint: 'As peças se separam na ordem inversa da montagem.',
  },
  EXPLODED: {
    label: 'Vista explodida',
    hint: 'Clique em uma peça (ou use a lista) para ver sua função.',
  },
  REASSEMBLING: {
    label: 'Remontando',
    hint: 'As peças voltam às posições originais de montagem.',
  },
};

function formatTurns(value) {
  return value.toFixed(2).replace('.', ',');
}

export function createUI({
  catalog,
  onPlay,
  onPause,
  onToggle,
  onToggleDescriptions,
  onReset,
  onSelect,
}) {
  const pill = document.getElementById('state-pill');
  const hint = document.getElementById('state-hint');
  const turnsValue = document.getElementById('turns-value');
  const turnsBar = document.getElementById('turns-bar');
  const segments = Array.from(turnsBar.querySelectorAll('span'));

  const btnPlay = document.getElementById('btn-play');
  const btnPause = document.getElementById('btn-pause');
  const btnToggle = document.getElementById('btn-toggle');
  const btnDescriptions = document.getElementById('btn-descriptions');
  const btnReset = document.getElementById('btn-reset');

  const legend = createLegend({
    listElement: document.getElementById('legend-list'),
    catalog,
    onSelect,
  });

  const info = createInfoPanel({
    titleElement: document.getElementById('info-title'),
    summaryElement: document.getElementById('info-summary'),
    metaElement: document.getElementById('info-meta'),
    materialElement: document.getElementById('info-material'),
    observeElement: document.getElementById('info-observe'),
  });

  btnPlay.addEventListener('click', () => onPlay?.());
  btnPause.addEventListener('click', () => onPause?.());
  btnToggle.addEventListener('click', () => onToggle?.());
  btnDescriptions.addEventListener('click', () => onToggleDescriptions?.());
  btnReset.addEventListener('click', () => onReset?.());

  let currentState = 'INITIALIZED';
  let paused = false;

  function paintState() {
    if (paused) {
      pill.dataset.state = 'PAUSED';
      pill.textContent = 'Pausado';
      hint.textContent = 'Animação pausada. Use Pausar novamente para continuar.';
      return;
    }
    const entry = STATE_TEXT[currentState] ?? STATE_TEXT.INITIALIZED;
    pill.dataset.state = currentState;
    pill.textContent = entry.label;
    hint.textContent = entry.hint;
  }

  function onKeyDown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, textarea, select')) return;

    switch (event.key) {
      case ' ':
      case 'Spacebar':
        // Se o foco está em um botão, o espaço já dispara o clique dele.
        if (target instanceof HTMLElement && target.closest('button')) return;
        event.preventDefault();
        onPause?.();
        break;
      case 'e':
      case 'E':
        event.preventDefault();
        onToggle?.();
        break;
      case 'd':
      case 'D':
        event.preventDefault();
        onToggleDescriptions?.();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        onReset?.();
        break;
      default:
        break;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  return {
    setState(state) {
      currentState = state;
      paintState();
    },
    setPaused(value) {
      paused = value;
      btnPause.setAttribute('aria-pressed', String(value));
      btnPause.textContent = value ? 'Continuar' : 'Pausar';
      paintState();
    },
    setButtons({ play, pause, toggle, reset, toggleLabel }) {
      btnPlay.disabled = !play;
      btnPause.disabled = !pause;
      btnToggle.disabled = !toggle;
      btnReset.disabled = !reset;
      if (toggleLabel) btnToggle.textContent = toggleLabel;
    },
    setDescriptionsVisible(visible) {
      document.body.classList.toggle('descriptions-hidden', !visible);
      btnDescriptions.setAttribute('aria-pressed', String(visible));
      btnDescriptions.title = visible
        ? 'Ocultar as descrições dos componentes'
        : 'Mostrar as descrições dos componentes';
    },
    setTurns(value) {
      const clamped = Math.min(Math.max(value, 0), 5);
      turnsValue.textContent = `${formatTurns(clamped)} / 5,00`;
      turnsBar.setAttribute('aria-valuenow', clamped.toFixed(2));
      turnsBar.setAttribute('aria-valuetext', `${formatTurns(clamped)} de 5 voltas`);
      // Cada segmento representa uma volta inteira.
      segments.forEach((segment, index) => {
        const fill = Math.min(Math.max(clamped - index, 0), 1);
        segment.style.setProperty('--fill', fill.toFixed(3));
      });
    },
    showInfo(entry) {
      info.show(entry);
    },
    setActivePart(id) {
      legend.setActive(id);
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
