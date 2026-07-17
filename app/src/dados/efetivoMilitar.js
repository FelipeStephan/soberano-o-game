// ═══════════════════════════════════════════════════════════════════════
// EFETIVO MILITAR — o teto humano do exército (soldados) e a reserva
// ═══════════════════════════════════════════════════════════════════════
// A "Infantaria" do jogo (dados/forcas.js) SÃO os soldados: gente, recrutada em levas
// de milhares, e cada ficha de país já semeia o efetivo ativo real (Brasil ~360 mil,
// China ~2 milhões). Faltava o TETO: até quantos soldados um país consegue pôr em pé.
// Sem teto, "recrutar" seria um botão infinito. Com teto, recrutar é uma DECISÃO — e a
// reserva, o alistamento e a conscrição são os caminhos (com preços políticos) até ele.
//
// Os números são aproximações realistas do efetivo militar ATIVO e da RESERVA mobilizável
// de cada país (mesmo espírito de dados/populacaoMundo.js — protótipo acadêmico). Cada
// teto fica ACIMA do que a ficha do país semeia, pra sobrar margem real de recrutamento.

// Efetivo ativo máximo (soldados que o país sustenta em pé de guerra).
export const EFETIVO_ATIVO = {
  USA: 1300000, CHN: 2100000, RUS: 1150000, IND: 1450000, BRA: 480000,
  DEU: 250000, FRA: 270000, GBR: 190000, JPN: 320000, KOR: 600000,
  ISR: 220000, IRN: 720000, TUR: 425000, SAU: 320000, EGY: 520000,
  UKR: 900000, PRK: 1300000, PAK: 750000, VEN: 180000, IDN: 480000,
  _default: 150000,
};

// Reserva mobilizável (gente que pode ser CONVOCADA de volta às armas). É separada do
// ativo: "Convocar Reserva" transfere daqui para os soldados; alistamento voluntário e
// obrigatório trazem gente NOVA sem tocar nesta pool.
export const RESERVA_MILITAR = {
  USA: 800000, CHN: 510000, RUS: 2000000, IND: 1150000, BRA: 1340000,
  DEU: 60000, FRA: 40000, GBR: 30000, JPN: 56000, KOR: 3100000,
  ISR: 465000, IRN: 350000, TUR: 380000, SAU: 25000, EGY: 480000,
  UKR: 900000, PRK: 600000, PAK: 290000, VEN: 600000, IDN: 400000,
  _default: 100000,
};

export function tetoSoldados(iso) { return EFETIVO_ATIVO[iso] || EFETIVO_ATIVO._default; }
export function reservaInicial(iso) { return RESERVA_MILITAR[iso] || RESERVA_MILITAR._default; }

// Quanto ainda cabe de soldado até o teto do país (nunca negativo).
export function espacoSoldados(estado) {
  const iso = estado?.iso || 'USA';
  return Math.max(0, tetoSoldados(iso) - (estado?.forcas?.infantaria || 0));
}
