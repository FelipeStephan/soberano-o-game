// ═══════════════════════════════════════════════════════════════════════
// ÍNDICE MUNDIAL — o ranking global das nações
// ═══════════════════════════════════════════════════════════════════════
// Dado IGUAL pra todos (no online, o placar é o mesmo pra sala inteira) — é o que
// transforma "eu joguei bem" em "eu SUBI no ranking". Cinco réguas: PIB, Poder
// Militar, Reservas de Petróleo, Território e Crescimento (Δ do turno). Cada linha
// carrega a variação desde o turno passado, então o jogador VÊ quem subiu e quem caiu.
//
// De onde vem cada número: PIB e área de MUNDO_STATS (mundo real aproximado), militar
// de forcaDe() (dinâmico — rearma com o tempo e com apoios), petróleo de PETROLEO. A
// SUA nação injeta os valores VIVOS (o seu PIB, o seu petróleo controlado) — é assim
// que crescer no jogo te faz subir na lista.
import { PAISES } from '../dados/paises.js';
import { PETROLEO } from '../dados/petroleo.js';
import { MUNDO_STATS } from '../dados/mundoStats.js';
import { forcaDe } from './forcasMundo.js';
import { reservasControladas } from './petroleo.js';

function pool(estado) {
  const s = new Set([...Object.keys(MUNDO_STATS), ...Object.keys(PETROLEO)]);
  if (estado.iso) s.add(estado.iso);
  return [...s];
}

// Os quatro números-base de um país, com a SUA nação usando valores vivos.
function statsDe(estado, iso) {
  const eu = iso === (estado.iso || 'USA');
  return {
    pib: eu ? Math.round((estado.pib || 0) * 10) / 10 : (MUNDO_STATS[iso]?.pib ?? null),
    mil: Math.round(forcaDe(estado, iso)),
    petro: Math.round((PETROLEO[iso]?.reservas || 0) + (eu ? controlado(estado) : 0)),
    area: MUNDO_STATS[iso] ? Math.round((MUNDO_STATS[iso].area + (eu ? Math.max(0, (estado.territorio || 1) - 1) * 0.2 : 0)) * 100) / 100 : null,
  };
}
function controlado(estado) { try { return Number(reservasControladas(estado)) || 0; } catch { return 0; } }

const METRICAS = {
  pib:        { rot: 'PIB', ic: 'circle-dollar-sign', fmt: (v) => `US$ ${Number(v).toFixed(1)} tri` },
  militar:    { rot: 'Poder Militar', ic: 'swords', fmt: (v) => `${Math.round(v)}` },
  petroleo:   { rot: 'Petróleo', ic: 'fuel', fmt: (v) => `${Math.round(v)} bi bbl` },
  territorio: { rot: 'Território', ic: 'map', fmt: (v) => `${Number(v).toFixed(2)} mi km²` },
  crescimento:{ rot: 'Crescimento', ic: 'trending-up', fmt: (v) => `${v > 0 ? '+' : ''}${v}%` },
};
const CAMPO = { pib: 'pib', militar: 'mil', petroleo: 'petro', territorio: 'area' };

// Crescimento anual "de base" (PIB real aproximado, % a.a.). O ranking de CRESCIMENTO
// PARTE daqui — antes ele ficava VAZIO até alguém agir (só mostrava quem mexeu a força).
// Agora toda nação tem seu ritmo realista (Índia/China na frente, Alemanha/Japão atrás)
// e as AÇÕES vivas empurram pra cima ou pra baixo.
const CRESC_BASE = {
  IND: 6.5, CHN: 4.8, IDN: 5.0, VNM: 6.0, PHL: 5.5, BGD: 6.0, ETH: 6.2, SAU: 3.0,
  TUR: 3.4, EGY: 3.5, NGA: 3.0, KAZ: 4.0, DZA: 3.0, IRN: 3.3, PAK: 2.6, BRA: 2.2,
  USA: 2.5, MEX: 2.2, KOR: 2.2, ESP: 2.0, AUS: 1.5, CAN: 1.2, GBR: 1.1, FRA: 1.0,
  JPN: 0.9, RUS: 1.3, ITA: 0.7, DEU: 0.4, ZAF: 1.0, ARG: 2.0, UKR: 3.0, VEN: 4.0,
  ISR: 3.2, PRK: 1.0,
};
const CRESC_PAD = 2.5;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function metricasIndice() { return METRICAS; }

// Monta TODAS as réguas de uma vez. Retorna { [metrica]: { rot, ic, linhas:[{iso,nome,eu,valor,fmt,delta,pos}], euPos } }.
export function montarIndice(estado) {
  const eu = estado.iso || 'USA';
  const snap = estado._rankSnap || {};
  const linhas = pool(estado).map((iso) => ({ iso, nome: PAISES[iso]?.nome || iso, eu: iso === eu, s: statsDe(estado, iso), a: snap[iso] || null }));

  const out = {};
  for (const [metrica, campo] of Object.entries(CAMPO)) {
    const m = METRICAS[metrica];
    const rows = linhas.filter((l) => l.s[campo] != null && l.s[campo] > 0)
      .sort((x, y) => y.s[campo] - x.s[campo])
      .map((l, i) => {
        const antes = l.a?.[campo];
        const delta = antes != null ? Math.round((l.s[campo] - antes) * 100) / 100 : 0;
        return { iso: l.iso, nome: l.nome, eu: l.eu, valor: l.s[campo], fmt: m.fmt(l.s[campo]), delta, pos: i + 1 };
      });
    out[metrica] = { rot: m.rot, ic: m.ic, linhas: rows, euPos: rows.find((r) => r.eu)?.pos || null };
  }

  // Crescimento: PARTE de um baseline realista (PIB %/ano por país) e as ações VIVAS
  // empurram pra cima ou pra baixo. Antes filtrava só quem mexeu a força → régua vazia
  // até alguém agir. Agora o ranking está SEMPRE cheio e reflete a realidade + o jogador.
  const cresc = linhas.map((l) => {
    const base = CRESC_BASE[l.iso] ?? CRESC_PAD;
    const pibAntes = l.a?.pib; const milAntes = l.a?.mil;
    const dPib = (pibAntes && l.s.pib != null) ? ((l.s.pib - pibAntes) / pibAntes) * 100 : 0;
    const dMil = milAntes ? ((l.s.mil - milAntes) / milAntes) * 100 : 0;
    // o PIB pesa muito (é a mão do jogador na economia); a força dá um tempero.
    const pct = Math.round(clamp(base + dPib * 3 + dMil * 0.6, -12, 20) * 10) / 10;
    return { iso: l.iso, nome: l.nome, eu: l.eu, pct };
  }).sort((x, y) => y.pct - x.pct)
    .map((l, i) => ({ iso: l.iso, nome: l.nome, eu: l.eu, valor: l.pct, fmt: METRICAS.crescimento.fmt(l.pct), delta: 0, pos: i + 1 }));
  out.crescimento = { rot: METRICAS.crescimento.rot, ic: METRICAS.crescimento.ic, linhas: cresc, euPos: cresc.find((r) => r.eu)?.pos || null };

  return out;
}

// Fotografa os números pro Δ do próximo turno. Chamar no fim de cada turno.
export function snapshotIndice(estado) {
  const snap = {};
  for (const iso of pool(estado)) snap[iso] = statsDe(estado, iso);
  estado._rankSnap = snap;
}
