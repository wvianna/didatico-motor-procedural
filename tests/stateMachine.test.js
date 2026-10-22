import { describe, expect, it, vi } from 'vitest';
import { EVENTS, STATES, createStateMachine } from '../src/app/StateMachine.js';

describe('máquina de estados da demonstração', () => {
  it('percorre o fluxo completo na ordem prevista', () => {
    const fsm = createStateMachine({ strict: true });
    expect(fsm.state).toBe(STATES.INITIALIZED);

    fsm.send(EVENTS.READY);
    expect(fsm.state).toBe(STATES.ASSEMBLED);

    fsm.send(EVENTS.PLAY);
    expect(fsm.state).toBe(STATES.RUNNING);

    fsm.send(EVENTS.DECEL_START);
    expect(fsm.state).toBe(STATES.DECELERATING);

    fsm.send(EVENTS.STOPPED);
    expect(fsm.state).toBe(STATES.EXPLODING);

    fsm.send(EVENTS.DONE);
    expect(fsm.state).toBe(STATES.EXPLODED);

    fsm.send(EVENTS.REASSEMBLE);
    expect(fsm.state).toBe(STATES.REASSEMBLING);

    fsm.send(EVENTS.DONE);
    expect(fsm.state).toBe(STATES.ASSEMBLED);
  });

  it('recusa saltos inválidos em vez de mudar de estado', () => {
    const fsm = createStateMachine({ strict: true });
    expect(() => fsm.send(EVENTS.STOPPED)).toThrow();
    expect(fsm.state).toBe(STATES.INITIALIZED);

    fsm.send(EVENTS.READY);
    expect(() => fsm.send(EVENTS.DONE)).toThrow();
    expect(fsm.state).toBe(STATES.ASSEMBLED);
  });

  it('em produção apenas avisa e mantém o estado', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fsm = createStateMachine();
    expect(fsm.send(EVENTS.STOPPED)).toBe(false);
    expect(fsm.state).toBe(STATES.INITIALIZED);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('RESET funciona de qualquer estado ativo', () => {
    const fsm = createStateMachine({ strict: true });
    fsm.send(EVENTS.READY);
    fsm.send(EVENTS.PLAY);
    fsm.send(EVENTS.DECEL_START);
    fsm.send(EVENTS.STOPPED);
    expect(fsm.state).toBe(STATES.EXPLODING);
    fsm.send(EVENTS.RESET);
    expect(fsm.state).toBe(STATES.ASSEMBLED);

    fsm.send(EVENTS.EXPLODE);
    fsm.send(EVENTS.DONE);
    fsm.send(EVENTS.RESET);
    expect(fsm.state).toBe(STATES.ASSEMBLED);
  });

  it('não reinicia a partir de INITIALIZED (o motor ainda não existe)', () => {
    const fsm = createStateMachine({ strict: true });
    expect(fsm.can(EVENTS.RESET)).toBe(false);
  });

  it('avisa os interessados com estado anterior e evento', () => {
    const events = [];
    const fsm = createStateMachine();
    fsm.on((state, previous, event) => events.push([previous, event, state]));
    fsm.send(EVENTS.READY);
    fsm.send(EVENTS.PLAY);
    expect(events).toEqual([
      [STATES.INITIALIZED, EVENTS.READY, STATES.ASSEMBLED],
      [STATES.ASSEMBLED, EVENTS.PLAY, STATES.RUNNING],
    ]);
  });

  it('permite desmontar direto da montagem (sem passar pela rotação)', () => {
    const fsm = createStateMachine({ strict: true });
    fsm.send(EVENTS.READY);
    fsm.send(EVENTS.EXPLODE);
    expect(fsm.state).toBe(STATES.EXPLODING);
  });
});
