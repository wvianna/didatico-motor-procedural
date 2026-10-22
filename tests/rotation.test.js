import { describe, expect, it } from 'vitest';
import { createRotationProfile, DEFAULT_ROTATION } from '../src/animation/RotationDriver.js';

const TAU = Math.PI * 2;
const ALVO = 5 * TAU;

describe('perfil de cinco rotações', () => {
  const profile = createRotationProfile();

  it('respeita os parâmetros padrão do projeto', () => {
    expect(profile.totalTurns).toBe(DEFAULT_ROTATION.totalTurns);
    expect(profile.duration).toBe(DEFAULT_ROTATION.duration);
    expect(profile.totalAngle).toBe(ALVO);
  });

  it('começa em repouso, no ângulo zero', () => {
    const sample = profile.sample(0);
    expect(sample.theta).toBe(0);
    expect(sample.turns).toBe(0);
    expect(sample.omega).toBeCloseTo(0, 12);
    expect(sample.phase).toBe('accel');
  });

  it('termina exatamente em 1800°', () => {
    const sample = profile.sample(profile.duration);
    expect(sample.theta).toBe(ALVO);
    expect(sample.turns).toBe(5);
    expect(sample.omega).toBe(0);
    expect(sample.done).toBe(true);
  });

  it('mantém o total mesmo com aceleração e desaceleração diferentes', () => {
    for (const options of [
      { duration: 3, accel: 0.4, decel: 0.9 },
      { duration: 12, accel: 2.5, decel: 4 },
      { duration: 5, accel: 0.1, decel: 0.1 },
    ]) {
      const custom = createRotationProfile(options);
      expect(custom.sample(custom.duration).theta).toBe(ALVO);
      expect(custom.sample(custom.duration).omega).toBe(0);
    }
  });

  it('nunca ultrapassa 1800°, nem antes nem depois do fim', () => {
    for (let i = 0; i <= 2000; i += 1) {
      const time = (i / 2000) * (profile.duration + 5);
      const sample = profile.sample(time);
      expect(sample.theta).toBeGreaterThanOrEqual(0);
      expect(sample.theta).toBeLessThanOrEqual(ALVO);
    }
    expect(profile.sample(profile.duration * 10).theta).toBe(ALVO);
  });

  it('é estritamente monótona durante o movimento', () => {
    let previous = -1;
    for (let i = 0; i <= 5000; i += 1) {
      const time = (i / 5000) * profile.duration;
      const { theta } = profile.sample(time);
      expect(theta).toBeGreaterThan(previous);
      previous = theta;
    }
  });

  it('é contínua na velocidade (C¹) nos joelhos do perfil', () => {
    const knees = [profile.accelTime, profile.decelStartTime];
    for (const knee of knees) {
      const before = profile.sample(knee - 1e-6).omega;
      const after = profile.sample(knee + 1e-6).omega;
      expect(Math.abs(after - before)).toBeLessThan(1e-4);
    }
  });

  it('não depende da taxa de quadros', () => {
    for (const hz of [24, 30, 60, 144, 240]) {
      const dt = 1 / hz;
      let elapsed = 0;
      let last = profile.sample(0);
      while (elapsed < profile.duration) {
        const step = Math.min(dt, profile.duration - elapsed);
        elapsed += step;
        last = profile.sample(elapsed);
      }
      expect(last.theta).toBe(ALVO);
      expect(last.turns).toBe(5);
    }
  });

  it('tolera delta grande sem saltar além do alvo', () => {
    // Simula um quadro perdido (aba em segundo plano) já perto do fim.
    const sample = profile.sample(profile.duration - 1e-9 + 0.5);
    expect(sample.theta).toBe(ALVO);
  });

  it('anuncia a desaceleração antes do fim', () => {
    expect(profile.sample(profile.decelStartTime - 1e-6).phase).toBe('cruise');
    expect(profile.sample(profile.decelStartTime + 1e-6).phase).toBe('decel');
    expect(profile.sample(profile.duration - 0.2).phase).toBe('decel');
  });

  it('a velocidade no pico corresponde ao tempo total', () => {
    const mid = profile.sample(profile.duration / 2);
    expect(mid.omega).toBeGreaterThan(0);
    // 5 voltas em 7 s sem rampas dariam 2π·5/7 ≈ 4,49 rad/s; com rampas, um pouco mais.
    expect(mid.omega).toBeGreaterThan(4.4);
    expect(mid.omega).toBeLessThan(6.5);
  });
});
