/**
 * Catálogo didático das peças.
 *
 * `id`      — chave usada por geometria, rótulos, legenda e painel de informações.
 * `index`   — número exibido no rótulo 3D e na legenda (ordem de montagem).
 * `summary` — função mecânica, em uma frase.
 * `material`, `observe` — detalhes mostrados no painel ao selecionar a peça.
 */

export const PARTS = [
  {
    id: 'base',
    index: 1,
    name: 'Base de fixação',
    material: 'Aço dobrado',
    summary:
      'Berço que sustenta a carcaça e fixa o motor à bancada. Não participa do circuito magnético.',
    observe:
      'Os berços abraçam a carcaça por baixo; o peso do conjunto passa por eles, não pelas tampas.',
  },
  {
    id: 'rearCover',
    index: 2,
    name: 'Tampa traseira',
    material: 'Aço',
    summary:
      'Fecha a carcaça pelo lado oposto à saída e aloja o mancal traseiro, o porta-escovas e os terminais.',
    observe:
      'É a tampa que concentra as conexões elétricas e o acesso às escovas em motores reais.',
  },
  {
    id: 'terminals',
    index: 3,
    name: 'Terminais de alimentação',
    material: 'Latão + plástico',
    summary:
      'Dois pinos isolados que levam a corrente contínua da fonte até as escovas (positivo e negativo).',
    observe:
      'Invertendo a polaridade, o motor inverte o sentido de rotação — o campo do ímã é fixo.',
  },
  {
    id: 'fasteners',
    index: 4,
    name: 'Parafusos de fixação',
    material: 'Aço',
    summary:
      'Quatro parafusos longos prendem as duas tampas à carcaça e mantêm o conjunto alinhado.',
    observe:
      'Eles atravessam o comprimento do motor: a carcaça trabalha comprimida entre as tampas.',
  },
  {
    id: 'rearBearing',
    index: 5,
    name: 'Mancal traseiro (rolamento)',
    material: 'Aço temperado',
    summary:
      'Apoia a extremidade traseira do eixo com baixo atrito, mantendo-o centrado no estator.',
    observe:
      'O anel interno gira com o eixo; o externo fica preso na tampa. As esferas rolam entre eles.',
  },
  {
    id: 'brushes',
    index: 6,
    name: 'Escovas e molas',
    material: 'Grafite + bronze',
    summary:
      'Duas escovas de grafite pressionadas contra o comutador levam corrente ao rotor que gira.',
    observe:
      'As escovas NÃO giram: deslizam sobre o comutador. A mola compensa o desgaste do grafite.',
  },
  {
    id: 'commutator',
    index: 7,
    name: 'Comutador segmentado',
    material: 'Cobre + mica',
    summary:
      'Anel de segmentos de cobre que inverte a corrente nas bobinas a cada meia volta.',
    observe:
      'Gira junto com o eixo. A inversão de corrente é o que mantém o torque sempre no mesmo sentido.',
  },
  {
    id: 'rotorCore',
    index: 8,
    name: 'Núcleo laminado do rotor',
    material: 'Aço silicioso',
    summary:
      'Pacote de chapas finas que conduz o fluxo magnético e sustenta as bobinas.',
    observe:
      'As lâminas são isoladas entre si para reduzir as correntes de Foucault e o aquecimento.',
  },
  {
    id: 'windings',
    index: 9,
    name: 'Bobinas do rotor',
    material: 'Fio de cobre esmaltado',
    summary:
      'Enrolamentos por onde circula a corrente; imersos no campo dos ímãs, produzem o torque.',
    observe:
      'Giram com o rotor. Cada bobina é alimentada por um par de segmentos do comutador.',
  },
  {
    id: 'magnets',
    index: 10,
    name: 'Ímãs permanentes (estator)',
    material: 'Ferrite',
    summary:
      'Dois polos fixos, colados à carcaça, criam o campo magnético constante do estator.',
    observe:
      'Ficam parados. O rotor gira dentro desse campo — é o que define o sentido do torque.',
  },
  {
    id: 'housing',
    index: 11,
    name: 'Carcaça cilíndrica',
    material: 'Aço',
    summary:
      'Fechamento estrutural e magnético: fecha o caminho do fluxo e protege o conjunto interno.',
    observe:
      'Note a parede fina e os chanfros: é uma peça de chapa conformada, não um tubo maciço.',
  },
  {
    id: 'frontBearing',
    index: 12,
    name: 'Mancal dianteiro (rolamento)',
    material: 'Aço temperado',
    summary:
      'Apoia a extremidade dianteira do eixo, do lado da ponta de saída.',
    observe:
      'Os dois mancais definem a linha do eixo; qualquer folga aqui vira vibração.',
  },
  {
    id: 'frontCover',
    index: 13,
    name: 'Tampa dianteira',
    material: 'Aço',
    summary:
      'Fecha a carcaça do lado da saída e centraliza o mancal dianteiro.',
    observe:
      'O ressalto central serve de assento para o rolamento e de batente axial do eixo.',
  },
  {
    id: 'shaft',
    index: 14,
    name: 'Eixo de saída',
    material: 'Aço',
    summary:
      'Transmite o torque do rotor para fora do motor e define o eixo de rotação de todo o conjunto.',
    observe:
      'Os degraus são assentos de precisão: mancais, núcleo e comutador ficam prensados nele.',
  },
];

/** Índice por id, para consulta O(1). */
export const PART_BY_ID = new Map(PARTS.map((part) => [part.id, part]));

/** Ids das peças que se deslocam na vista explodida (referência para testes). */
export const EXPLODED_PART_IDS = Object.freeze([
  'base',
  'rearCover',
  'terminals',
  'fasteners',
  'rearBearing',
  'brushes',
  'magnets',
  'housing',
  'frontBearing',
  'frontCover',
]);

/** Peças que permanecem solidárias ao rotor e não se deslocam. */
export const RIGID_ROTOR_PART_IDS = Object.freeze([
  'shaft',
  'rotorCore',
  'windings',
  'commutator',
]);
