// FORÇAS ARMADAS — o inventário militar de verdade (ordem de batalha).
// Cada unidade tem um "poder" (peso de combate por unidade). A força de combate total
// é a soma de quantidade × poder. As compras militares somam unidades concretas aqui,
// e a guerra consome/destrói unidades.

// poder = peso de combate por unidade · custoLog = custo logístico (US$ tri) por unidade enviada
export const UNIDADES = [
  { id: 'infantaria',   nome: 'Soldados',          icone: '🪖', dominio: 'Terra',       poder: 0.00008, custoLog: 0.0000015, passo: 5000 },
  { id: 'blindados',    nome: 'Blindados',         icone: '🚜', dominio: 'Terra',       poder: 0.010,   custoLog: 0.00004,   passo: 50 },
  { id: 'artilharia',   nome: 'Artilharia',        icone: '💥', dominio: 'Terra',       poder: 0.008,   custoLog: 0.00003,   passo: 50 },
  { id: 'helicopteros', nome: 'Helicópteros',      icone: '🚁', dominio: 'Ar',          poder: 0.015,   custoLog: 0.0002,    passo: 10 },
  { id: 'cacas',        nome: 'Caças',             icone: '✈️', dominio: 'Ar',          poder: 0.030,   custoLog: 0.0004,    passo: 10 },
  { id: 'bombardeiros', nome: 'Bombardeiros',      icone: '🛩️', dominio: 'Ar',          poder: 0.080,   custoLog: 0.001,     passo: 5 },
  { id: 'drones',       nome: 'Drones',            icone: '🛸', dominio: 'Ar',          poder: 0.020,   custoLog: 0.0001,    passo: 10 },
  { id: 'navios',       nome: 'Navios de Guerra',  icone: '🚢', dominio: 'Mar',         poder: 0.050,   custoLog: 0.002,     passo: 2 },
  { id: 'submarinos',   nome: 'Submarinos',        icone: '🌊', dominio: 'Mar',         poder: 0.060,   custoLog: 0.0015,    passo: 2 },
  { id: 'porta_avioes', nome: 'Porta-aviões',      icone: '🛳️', dominio: 'Mar',         poder: 0.500,   custoLog: 0.020,     passo: 1 },
  { id: 'misseis',      nome: 'Mísseis',           icone: '🚀', dominio: 'Estratégico', poder: 0.040,   custoLog: 0.00008,   passo: 25 },
  // Defesa aérea entrou tarde e é metade da guerra moderna: sem ela, todo o resto
  // do seu arsenal caro vira alvo caro. Não tem custoLog de ataque porque é DEFENSIVA —
  // fica em casa protegendo você (ver bonusDefensivo em jogo/guerra.js).
  { id: 'defesa_aerea', nome: 'Defesa Aérea',      icone: '🛡️', dominio: 'Defesa',      poder: 0.045,   custoLog: 0,         passo: 2 },
];

// Poder e custo de uma composição enviada (deploy = { unidadeId: quantidade }).
export function poderDeploy(deploy) {
  let t = 0;
  for (const u of UNIDADES) t += (deploy?.[u.id] || 0) * u.poder;
  return Math.round(t);
}
export function custoDeploy(deploy) {
  let t = 0;
  for (const u of UNIDADES) t += (deploy?.[u.id] || 0) * u.custoLog;
  return Math.round(t * 100) / 100;
}
// Ogivas nucleares são rastreadas à parte (estado.ogivas) — dão bônus de dissuasão na guerra.

export const UNIDADE_POR_ID = Object.fromEntries(UNIDADES.map((u) => [u.id, u]));
export const DOMINIOS = ['Terra', 'Ar', 'Mar', 'Estratégico', 'Defesa'];

// ── TECNOLOGIA POR VEÍCULO ────────────────────────────────────────────
// O que faz cada veículo jogar diferente no mar e no ar. `alcance` = quão longe projeta
// força (graus no globo, limita o quanto você arrasta o pino); `deteccao` = raio em que
// ENXERGA outras frotas; `furtividade` = quão difícil é SER detectado (0–100). O
// submarino é quase invisível — é a tecnologia que muda o jogo.
export const TECH_UNIDADE = {
  navios:       { alcance: 22, deteccao: 12, furtividade: 20 },
  submarinos:   { alcance: 26, deteccao: 9,  furtividade: 92 },
  porta_avioes: { alcance: 34, deteccao: 18, furtividade: 8 },
  cacas:        { alcance: 14, deteccao: 12, furtividade: 34 },
  bombardeiros: { alcance: 22, deteccao: 8,  furtividade: 38 },
  drones:       { alcance: 18, deteccao: 15, furtividade: 60 },
  helicopteros: { alcance: 8,  deteccao: 6,  furtividade: 16 },
  misseis:      { alcance: 40, deteccao: 0,  furtividade: 25 },
};

// ── ALCANCE OPERACIONAL (km) — LOGÍSTICA DE ATAQUE ────────────────────
// Quão longe cada arma projeta força SOZINHA. É o que impede atacar o outro lado do
// mundo só com infantaria e caça de curto alcance: sem porta-aviões, mísseis ou uma
// BASE avançada por perto, o alvo distante fica fora de alcance. O porta-aviões é uma
// base MÓVEL (alcance enorme) — é ele que destrava campanhas transoceânicas.
export const ALCANCE_KM = {
  infantaria: 1500, blindados: 1600, artilharia: 1400,
  helicopteros: 700, cacas: 1600, drones: 2200, bombardeiros: 9000,
  navios: 6000, submarinos: 8000, porta_avioes: 14000,
  misseis: 11000, defesa_aerea: 0,
};

// O alcance de um ATAQUE é o do ativo de MAIOR pernada na composição (o comboio anda
// no ritmo do mais longo, não do mais curto). Deploy só de tropa terrestre = regional.
export function alcanceDoDeploy(deploy) {
  let max = 0;
  for (const [id, q] of Object.entries(deploy || {})) {
    if ((q || 0) > 0 && (ALCANCE_KM[id] || 0) > max) max = ALCANCE_KM[id];
  }
  return max;
}

// A tech AGREGADA de uma frota: alcance/detecção = o MELHOR do grupo; furtividade = a do
// mais BARULHENTO (um porta-aviões entrega a esquadra inteira). Frota só de submarino some.
export function techDaFrota(unidades) {
  const ids = Object.keys(unidades || {}).filter((k) => (unidades[k] || 0) > 0 && TECH_UNIDADE[k]);
  if (!ids.length) return { alcance: 10, deteccao: 8, furtividade: 30 };
  return {
    alcance: Math.max(...ids.map((k) => TECH_UNIDADE[k].alcance)),
    deteccao: Math.max(...ids.map((k) => TECH_UNIDADE[k].deteccao)),
    furtividade: Math.min(...ids.map((k) => TECH_UNIDADE[k].furtividade)),
  };
}

// Ordem de batalha inicial dos EUA (aproximada, ilustrativa).
export const FORCAS_EUA = {
  infantaria: 450000,
  blindados: 5500,
  artilharia: 5200,
  helicopteros: 900,
  cacas: 1300,
  bombardeiros: 140,
  drones: 400,
  navios: 90,
  submarinos: 66,
  porta_avioes: 11,
  misseis: 900,
  defesa_aerea: 60,   // baterias Patriot/THAAD
  ogivas: 0,
};

// Força de combate total (número abstrato de comparação).
export function forcaCombate(forcas) {
  let total = 0;
  for (const u of UNIDADES) total += (forcas?.[u.id] || 0) * u.poder;
  return Math.round(total);
}

// ── COMPOSIÇÃO PLAUSÍVEL (só para MOSTRAR a guarnição de um NPC) ────────
// Os países-NPC guardam a força como UM escalar (jogo/forcasMundo.js). Quando o jogador
// mira um estado inimigo, ele precisa VER quem defende — não um número seco. Isto
// converte uma força de combate (poder) numa ordem de batalha crível, com o perfil de
// uma guarnição real: espinha de infantaria, uma ponta de blindado/artilharia e um véu
// de defesa aérea. É ESTIMATIVA de exibição — o combate usa o número de força, não isto.
const PERFIL_GUARNICAO = [
  ['infantaria', 0.42], ['blindados', 0.18], ['artilharia', 0.14],
  ['defesa_aerea', 0.12], ['cacas', 0.09], ['helicopteros', 0.05],
];
export function composicaoPlausivel(iso, forca) {
  const g = {};
  if (!forca || forca <= 0) return g;
  for (const [id, frac] of PERFIL_GUARNICAO) {
    const u = UNIDADE_POR_ID[id];
    if (!u) continue;
    let n = Math.round((forca * frac) / u.poder);
    if (u.passo > 1) n = Math.round(n / u.passo) * u.passo;   // números redondos, como no resto do jogo
    if (n > 0) g[id] = n;
  }
  return g;
}

// Aplica um delta de unidades (compra ou baixa). Nunca deixa negativo.
export function aplicarForcas(forcas, delta) {
  const mud = [];
  for (const [id, q] of Object.entries(delta || {})) {
    if (!UNIDADE_POR_ID[id]) continue;
    const antes = forcas[id] || 0;
    forcas[id] = Math.max(0, Math.round(antes + q));
    mud.push({ id, delta: forcas[id] - antes });
  }
  return mud;
}
