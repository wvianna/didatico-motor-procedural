/**
 * Cotas do motor, em centímetros.
 *
 * Convenção de eixos
 * ------------------
 * O eixo de rotação do motor é o eixo **+Z**. A ponta de saída do eixo
 * aponta para +Z ("dianteira"). A origem está no centro geométrico da carcaça.
 *
 * Todas as peças devem ser construídas a partir destes valores: mudar uma cota
 * aqui reposiciona a montagem inteira, sem números mágicos espalhados.
 */

export const AXIS = 'z';

export const D = {
  housing: {
    /** Comprimento da carcaça cilíndrica. */
    length: 7.2,
    /** Raio externo. */
    radius: 1.55,
    /** Espessura da parede. */
    wall: 0.12,
  },

  cover: {
    radius: 1.52,
    /** Espessura da chapa da tampa. */
    thickness: 0.34,
    /** Raio do furo central (deixa passar o assento do mancal). */
    hole: 0.5,
    /** Raio e altura do ressalto que aloja o mancal. */
    bossRadius: 0.82,
    bossHeight: 0.3,
  },

  shaft: {
    radius: 0.22,
    seatRadius: 0.28,
    rearEnd: -4.45,
    frontEnd: 5.2,
  },

  bearing: {
    /** Posição axial do plano médio do rolamento. */
    z: 3.7,
    innerRace: [0.28, 0.32],
    outerRace: [0.43, 0.48],
    ballRadius: 0.055,
    ballOrbit: 0.375,
    balls: 9,
    width: 0.3,
  },

  rotor: {
    outerRadius: 1.02,
    slotRadius: 0.72,
    boreRadius: 0.3,
    teeth: 8,
    laminations: 24,
    laminationThickness: 0.14,
    coreLength: 3.6,
  },

  winding: {
    turnRadius: 0.88,
    tubeRadius: 0.075,
  },

  commutator: {
    z: -2.55,
    length: 0.9,
    radius: 0.6,
    segments: 8,
    micaRadius: 0.555,
    hubRadius: 0.34,
  },

  brush: {
    z: -2.55,
    /** Raio interno (encosta no comutador) e externo da escova. */
    inner: 0.56,
    outer: 1.02,
    width: 0.3,
    depth: 0.5,
  },

  magnet: {
    inner: 1.24,
    outer: 1.42,
    /** Abertura angular de cada polo. */
    arc: Math.PI * 0.4,
    length: 3.8,
  },

  screw: {
    headRadius: 0.13,
    headHeight: 0.1,
    shankRadius: 0.055,
    shankLength: 1.1,
    ringRadius: 1.16,
  },

  terminal: {
    radius: 0.075,
    length: 0.5,
    x: 0.62,
    y: -0.55,
  },

  base: {
    cradleInner: 1.56,
    cradleOuter: 1.74,
    cradleWidth: 0.24,
    cradleZ: 1.9,
    plateY: -2.4,
    plateWidth: 2.1,
    plateLength: 4.6,
    plateThickness: 0.12,
  },
};

/** Meia-extensão da carcaça (fronteira entre carcaça e tampas). */
export const HOUSING_HALF = D.housing.length / 2;

/** Posição axial de cada tampa (face interna encostada na carcaça). */
export const COVER_Z = HOUSING_HALF;
