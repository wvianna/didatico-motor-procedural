/**
 * Composition root.
 *
 * Liga cena, modelo, animações, máquina de estados e interface. Nenhuma regra
 * de negócio vive aqui: só a orquestração de quem faz o quê e quando.
 */

import * as THREE from 'three';
import { createClock } from './Clock.js';
import { createStateMachine } from './StateMachine.js';
import { disposeObject } from './dispose.js';
import { createScene } from '../scene/createScene.js';
import { createLighting } from '../scene/lighting.js';
import { createCameraRig } from '../scene/CameraRig.js';
import { buildMotor } from '../motor/buildMotor.js';
import { PART_BY_ID, PARTS } from '../motor/parts.js';
import { createRotationProfile } from '../animation/RotationDriver.js';
import { createExplosion } from '../animation/ExplosionController.js';
import { createPicker } from '../interaction/Picker.js';
import { createLabels } from '../interaction/Labels.js';
import { createUI } from '../ui/ui.js';

/** Direções de apresentação (do centro para a câmera). */
const VIEWS = {
  assembled: { dir: new THREE.Vector3(0.62, 0.4, 1), margin: 1.2 },
  exploded: { dir: new THREE.Vector3(0.92, 0.42, 0.62), margin: 1.12 },
};

/** Respiro entre o eixo parar e a desmontagem começar. */
const HOLD_BEFORE_EXPLODE = 0.35;

const PAUSABLE = ['RUNNING', 'DECELERATING', 'EXPLODING', 'REASSEMBLING'];

export function createApp(container) {
  const { renderer, scene, camera, controls, dispose: disposeScene } = createScene(container);

  const lighting = createLighting(scene, renderer);
  const cameraRig = createCameraRig({ camera, controls });

  const motor = buildMotor();
  scene.add(motor.root);

  const explosion = createExplosion(motor.root);
  const profile = createRotationProfile();
  const clock = createClock();

  // ------------------------------------------------------------- limites 3D
  // Uma caixa por peça (e não a AABB do conjunto): na vista explodida a
  // caixa do conjunto é quase toda vazio e arruinaria o enquadramento.
  function collectBoxes(parts) {
    const boxes = [];
    for (const node of parts.values()) {
      const box = new THREE.Box3().setFromObject(node);
      if (!box.isEmpty()) boxes.push(box);
    }
    return boxes;
  }

  motor.root.updateMatrixWorld(true);
  const assembledBoxes = collectBoxes(motor.parts);

  explosion.setProgress(1);
  motor.root.updateMatrixWorld(true);
  const explodedBoxes = collectBoxes(motor.parts);
  explosion.setProgress(0);
  motor.root.updateMatrixWorld(true);

  // ------------------------------------------------------------------ estado
  let stopHold = 0;
  let rafId = 0;
  let lastTime = performance.now();
  let descriptions = true;

  const fsm = createStateMachine({ onChange: handleStateChange });

  const labels = createLabels({
    container,
    camera,
    parts: motor.parts,
    catalog: PARTS,
  });

  const ui = createUI({
    catalog: PARTS,
    onPlay: startDemo,
    onPause: togglePause,
    onToggle: toggleExploded,
    onToggleDescriptions: toggleDescriptions,
    onReset: restart,
    onSelect: handleLegendSelect,
  });

  const picker = createPicker({
    camera,
    domElement: renderer.domElement,
    root: motor.root,
    onSelect: handleSceneSelect,
  });

  /** Fração da tela realmente livre de painéis, usada pelo enquadramento. */
  function safeArea() {
    const width = Math.max(window.innerWidth || 1, 1);
    const height = Math.max(window.innerHeight || 1, 1);
    const visible = (element) => element && element.offsetParent !== null;

    let right = 0;
    const side = document.getElementById('side');
    if (visible(side)) right = width - side.getBoundingClientRect().left + 16;

    let bottom = 0;
    for (const selector of ['.turns', '.controls']) {
      const element = document.querySelector(selector);
      if (visible(element)) {
        bottom = Math.max(bottom, height - element.getBoundingClientRect().top + 16);
      }
    }

    return {
      safeX: Math.min(Math.max((width - right) / width, 0.5), 1),
      safeY: Math.min(Math.max((height - bottom) / height, 0.5), 1),
    };
  }

  let viewBounds = { right: 0, bottom: 0, obstacles: [] };
  let measured = { w: 0, h: 0 };

  /** Área útil dos rótulos, remedida só quando o layout muda. */
  function measureView(width, height, force = false) {
    if (!force && width === measured.w && height === measured.h) return;
    measured = { w: width, h: height };
    const { safeX, safeY } = safeArea();
    const header = document.querySelector('.header');
    viewBounds = {
      right: width * safeX,
      bottom: height * safeY,
      obstacles: header ? [header.getBoundingClientRect()] : [],
    };
  }

  /** Reenquadra conforme o estado atual e a área livre disponível. */
  function frameCurrentView(duration) {
    const expanded = fsm.state === 'EXPLODING' || fsm.state === 'EXPLODED';
    const view = expanded ? VIEWS.exploded : VIEWS.assembled;
    cameraRig.fitBoxes(expanded ? explodedBoxes : assembledBoxes, {
      dir: view.dir,
      margin: view.margin,
      duration,
      ...safeArea(),
    });
  }

  /** Os rótulos 3D seguem o mesmo interruptor das descrições. */
  function syncLabels() {
    const explodedPhase = fsm.state === 'EXPLODING' || fsm.state === 'EXPLODED';
    labels.setVisible(descriptions && explodedPhase && explosion.progress > 0.82);
  }

  // ------------------------------------------------------------------ lógica
  function handleStateChange(state) {
    ui.setState(state);
    refreshButtons();

    if (state === 'EXPLODING') {
      explosion.setDirection(1);
      frameCurrentView(1.5);
      return;
    }

    if (state === 'REASSEMBLING') {
      explosion.setDirection(-1);
      frameCurrentView(1.4);
      syncLabels();
    }
  }

  function refreshButtons() {
    const state = fsm.state;
    ui.setButtons({
      play: state === 'ASSEMBLED',
      pause: PAUSABLE.includes(state) || clock.paused,
      toggle: state === 'ASSEMBLED' || state === 'EXPLODED',
      reset: state !== 'INITIALIZED',
      toggleLabel: state === 'EXPLODED' ? 'Montar' : 'Desmontar',
    });
  }

  function startDemo() {
    clock.reset();
    clock.resume();
    ui.setPaused(false);
    stopHold = 0;
    motor.rotorGroup.rotation.z = 0;
    explosion.setProgress(0);
    explosion.setDirection(0);
    ui.setTurns(0);
    picker.clear();
    ui.showInfo(null);
    ui.setActivePart(null);
    fsm.send('PLAY');
    syncLabels();
  }

  function restart() {
    cameraRig.cancel();
    if (fsm.state !== 'ASSEMBLED') {
      fsm.send('RESET');
    }
    cameraRig.fitBoxes(assembledBoxes, {
      dir: VIEWS.assembled.dir,
      margin: VIEWS.assembled.margin,
      duration: 0.9,
      ...safeArea(),
    });
    startDemo();
  }

  function toggleDescriptions() {
    descriptions = !descriptions;
    ui.setDescriptionsVisible(descriptions);
    syncLabels();
    // Com mais (ou menos) tela livre, o enquadramento e os rótulos mudam.
    measureView(
      renderer.domElement.clientWidth || 1,
      renderer.domElement.clientHeight || 1,
      true,
    );
    frameCurrentView(0.7);
  }

  function togglePause() {
    if (clock.paused) {
      clock.resume();
      ui.setPaused(false);
    } else if (PAUSABLE.includes(fsm.state)) {
      clock.pause();
      ui.setPaused(true);
    }
    refreshButtons();
  }

  function toggleExploded() {
    if (fsm.state === 'ASSEMBLED') fsm.send('EXPLODE');
    else if (fsm.state === 'EXPLODED') fsm.send('REASSEMBLE');
  }

  function handleSceneSelect(partId) {
    const entry = partId ? PART_BY_ID.get(partId) ?? null : null;
    ui.showInfo(entry);
    ui.setActivePart(partId ?? null);
    labels.select(partId ?? null);
  }

  function handleLegendSelect(partId) {
    const node = motor.parts.get(partId);
    if (!node) return;
    picker.select(node);
  }

  // -------------------------------------------------------------- laço principal
  function step(rawDelta) {
    const delta = clock.update(rawDelta);
    const state = fsm.state;

    if (delta > 0 && (state === 'RUNNING' || state === 'DECELERATING')) {
      const sample = profile.sample(clock.elapsed);
      motor.rotorGroup.rotation.z = sample.theta;
      ui.setTurns(sample.turns);

      if (state === 'RUNNING' && sample.phase === 'decel') {
        fsm.send('DECEL_START');
      }

      if (sample.done) {
        stopHold += delta;
        if (stopHold >= HOLD_BEFORE_EXPLODE) fsm.send('STOPPED');
      }
    }

    if (delta > 0 && (fsm.state === 'EXPLODING' || fsm.state === 'REASSEMBLING')) {
      const finished = explosion.update(delta);
      // Os rótulos entram só no fim da separação: durante o movimento eles
      // brigariam com as peças em trânsito.
      syncLabels();
      if (finished) fsm.send('DONE');
    }

    cameraRig.update(delta);

    const width = renderer.domElement.clientWidth || 1;
    const height = renderer.domElement.clientHeight || 1;
    cameraRig.setViewport(width, height);
    measureView(width, height);
    labels.update(Math.min(rawDelta, 0.1), width, height, viewBounds);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const rawDelta = Math.max((now - lastTime) / 1000, 0);
    lastTime = now;
    step(rawDelta);
    render();
  }

  // ---------------------------------------------------------------- ciclo de vida
  function onContextLost(event) {
    event.preventDefault();
    cancelAnimationFrame(rafId);
    rafId = 0;
    ui.setState('INITIALIZED');
  }

  function onContextRestored() {
    if (rafId) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  // ---------------------------------------------------------------- início
  cameraRig.setViewport(
    renderer.domElement.clientWidth || 1,
    renderer.domElement.clientHeight || 1,
  );
  frameCurrentView(0);
  fsm.send('READY');
  startDemo();
  refreshButtons();
  rafId = requestAnimationFrame(frame);

  // Gancho de depuração: abra a página com ?debug=1 para inspecionar câmera,
  // cena e estado pelo console do navegador. `advance()` permite rodar a
  // animação quadro a quadro mesmo com a aba em segundo plano.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')) {
    window.__motorApp = {
      scene,
      camera,
      controls,
      motor,
      explosion,
      clock,
      fsm,
      renderer,
      advance(seconds, delta = 1 / 60) {
        let remaining = seconds;
        while (remaining > 0) {
          const slice = Math.min(delta, remaining);
          step(slice);
          remaining -= slice;
        }
        render();
      },
    };
  }

  return {
    dispose() {
      cancelAnimationFrame(rafId);
      rafId = 0;
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      picker.dispose();
      labels.dispose();
      ui.dispose();
      cameraRig.dispose();
      lighting.dispose();
      scene.remove(motor.root);
      disposeObject(motor.root);
      disposeScene();
    },
  };
}
