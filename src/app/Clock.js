/**
 * Relógio da aplicação.
 *
 * Toda a animação depende do `deltaTime` devolvido por `update()`. O valor é
 * limitado a `maxDelta` para que uma aba em segundo plano (ou um travamento
 * momentâneo) não faça o motor "saltar" dezenas de graus em um único quadro.
 */

export function createClock({ maxDelta = 0.1 } = {}) {
  let elapsed = 0;
  let paused = false;

  return {
    /** Avança o tempo e devolve o delta efetivamente aplicado (0 se pausado). */
    update(rawDelta) {
      if (paused) return 0;
      const delta = Math.min(Math.max(Number(rawDelta) || 0, 0), maxDelta);
      elapsed += delta;
      return delta;
    },
    get elapsed() {
      return elapsed;
    },
    get paused() {
      return paused;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      elapsed = 0;
    },
  };
}
