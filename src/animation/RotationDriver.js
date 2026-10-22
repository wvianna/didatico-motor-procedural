/**
 * Perfil de velocidade angular das cinco voltas.
 *
 * O ângulo NÃO é acumulado quadro a quadro (`theta += omega * dt`): ele é uma
 * função fechada do tempo decorrido. Isso garante três coisas ao mesmo tempo:
 *
 *   1. independência da taxa de quadros;
 *   2. ausência de erro acumulado;
 *   3. total exato de 1800° — a área sob o perfil vale exatamente 1, e
 *      `theta(t) = 10π · A(t)` com `A(1) = 1`.
 *
 * Perfil trapezoidal normalizado em t ∈ [0, 1]:
 *
 *        v_peak ┌───────────────┐
 *               /                 \
 *              /                   \
 *     0 ______/                     \______  → omega = 0 no início e no fim
 *              a              1-d
 *
 * `a = aceleração/T`, `d = desaceleração/T` e `v_peak = 1 / (1 - (a+d)/2)`
 * (escolhido para que a área total seja 1).
 */

export const DEFAULT_ROTATION = Object.freeze({
  totalTurns: 5,
  duration: 7.0,
  accel: 0.8,
  decel: 1.6,
});

const TAU = Math.PI * 2;

export function createRotationProfile(options = {}) {
  const totalTurns = options.totalTurns ?? DEFAULT_ROTATION.totalTurns;
  const duration = Math.max(options.duration ?? DEFAULT_ROTATION.duration, 1e-3);

  // Mantém a soma das rampas abaixo de 90% da duração (evita pico infinito).
  const maxRamp = duration * 0.45;
  const accel = Math.min(Math.max(options.accel ?? DEFAULT_ROTATION.accel, 1e-4), maxRamp);
  const decel = Math.min(Math.max(options.decel ?? DEFAULT_ROTATION.decel, 1e-4), maxRamp);

  const a = accel / duration;
  const d = decel / duration;
  const vPeak = 1 / (1 - (a + d) / 2);

  const totalAngle = totalTurns * TAU;
  const angleRate = totalAngle / duration;
  const decelStartTime = duration - decel;

  /** Área acumulada normalizada (0..1) e velocidade normalizada. */
  function kinematics(t) {
    const u = t / duration;
    if (u <= 0) return { area: 0, speed: 0 };
    if (u < a) return { area: (vPeak * u * u) / (2 * a), speed: vPeak * (u / a) };
    if (u <= 1 - d) return { area: (vPeak * a) / 2 + vPeak * (u - a), speed: vPeak };
    const remaining = 1 - u;
    return { area: 1 - (vPeak * remaining * remaining) / (2 * d), speed: (vPeak * remaining) / d };
  }

  function sample(rawTime) {
    const t = Math.min(Math.max(Number(rawTime) || 0, 0), duration);
    const { area, speed } = kinematics(t);
    const progress = area >= 1 ? 1 : area;

    let phase;
    if (t >= duration) phase = 'done';
    else if (t < accel) phase = 'accel';
    else if (t < decelStartTime) phase = 'cruise';
    else phase = 'decel';

    return {
      time: t,
      progress,
      theta: progress === 1 ? totalAngle : totalAngle * progress,
      omega: t >= duration ? 0 : angleRate * speed,
      turns: progress === 1 ? totalTurns : totalTurns * progress,
      phase,
      done: t >= duration,
      duration,
      accelTime: accel,
      decelStartTime,
    };
  }

  return {
    totalTurns,
    duration,
    accelTime: accel,
    decelStartTime,
    totalAngle,
    sample,
    /** Instante em que a desaceleração começa (para o estado DECELERATING). */
    get stopTime() {
      return duration;
    },
  };
}
