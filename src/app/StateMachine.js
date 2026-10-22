/**
 * Máquina de estados explícita da demonstração.
 *
 *   INITIALIZED → ASSEMBLED → RUNNING → DECELERATING → EXPLODING → EXPLODED
 *                    ↑                                                │
 *                    └────────────── REASSEMBLING ←──────────────────┘
 *
 * `RESET` é aceito de qualquer estado e sempre leva a ASSEMBLED.
 * A pausa NÃO é um estado: é uma flag do relógio, o que evita combinatória
 * de "RUNNING pausado", "EXPLODING pausado" etc.
 *
 * Um evento inválido é recusado (retorna false). Em modo estrito (usado nos
 * testes) ele lança, para que erros de sequência apareçam imediatamente.
 */

export const STATES = Object.freeze({
  INITIALIZED: 'INITIALIZED',
  ASSEMBLED: 'ASSEMBLED',
  RUNNING: 'RUNNING',
  DECELERATING: 'DECELERATING',
  EXPLODING: 'EXPLODING',
  EXPLODED: 'EXPLODED',
  REASSEMBLING: 'REASSEMBLING',
});

export const EVENTS = Object.freeze({
  READY: 'READY',
  PLAY: 'PLAY',
  DECEL_START: 'DECEL_START',
  STOPPED: 'STOPPED',
  EXPLODE: 'EXPLODE',
  DONE: 'DONE',
  REASSEMBLE: 'REASSEMBLE',
  RESET: 'RESET',
});

const TABLE = Object.freeze({
  [STATES.INITIALIZED]: { [EVENTS.READY]: STATES.ASSEMBLED },
  [STATES.ASSEMBLED]: {
    [EVENTS.PLAY]: STATES.RUNNING,
    [EVENTS.EXPLODE]: STATES.EXPLODING,
  },
  [STATES.RUNNING]: { [EVENTS.DECEL_START]: STATES.DECELERATING },
  [STATES.DECELERATING]: { [EVENTS.STOPPED]: STATES.EXPLODING },
  [STATES.EXPLODING]: { [EVENTS.DONE]: STATES.EXPLODED },
  [STATES.EXPLODED]: { [EVENTS.REASSEMBLE]: STATES.REASSEMBLING },
  [STATES.REASSEMBLING]: { [EVENTS.DONE]: STATES.ASSEMBLED },
});

export function createStateMachine({ initial = STATES.INITIALIZED, strict = false, onChange } = {}) {
  let state = initial;
  const listeners = new Set();
  if (onChange) listeners.add(onChange);

  function resolve(event) {
    if (event === EVENTS.RESET) {
      return state === STATES.INITIALIZED ? null : STATES.ASSEMBLED;
    }
    return TABLE[state]?.[event] ?? null;
  }

  return {
    get state() {
      return state;
    },
    can(event) {
      return resolve(event) !== null;
    },
    send(event) {
      const next = resolve(event);
      if (next === null) {
        const message = `Transição inválida: ${state} --${event}-->`;
        if (strict) throw new Error(message);
        // Em produção apenas registra; a UI nunca deve conseguir chegar aqui.
        console.warn(`[fsm] ${message}`);
        return false;
      }
      const previous = state;
      state = next;
      for (const listener of listeners) listener(state, previous, event);
      return true;
    },
    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Apenas para testes: reinicia sem disparar eventos. */
    _force(nextState) {
      state = nextState;
    },
  };
}
