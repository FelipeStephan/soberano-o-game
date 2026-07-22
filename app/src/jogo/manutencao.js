// ═══════════════════════════════════════════════════════════════════════
// OCUPAÇÃO: CUSTO DE MANUTENÇÃO → ANEXAÇÃO
// ═══════════════════════════════════════════════════════════════════════
// Conquistar um país é o começo, não o fim. Manter território custa CAIXA todo turno
// (guarnição + supressão de insurgência + descontentamento + logística), e o jogador
// PRECISA VER esse custo em vez de pagar no escuro. Se segurar o país estável por tempo
// suficiente, libera ANEXÁ-LO — aí ele vira seu de vez (PIB/território incorporados,
// sem mais insurgência nem upkeep). É a jornada "tomei → aguentei → consolidei".
//
// `estado.ocupacoes[iso]` COMPLEMENTA `estado.conquistados` (não substitui — não quebra
// save): a insurgência/desde continuam vivendo no objeto de `conquistados`; aqui mora só
// o que é novo (upkeep pago, dias sem pagar, dias estável, flags de anexação).
import { PAISES } from '../dados/paises.js';
import { estadosDe } from './territorio.js';
import { aplicarEfeitos } from './efeitos.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

export const ANEXACAO_TURNOS_ESTAVEL = 6;   // batidas seguidas estável pra liberar anexação
export const ANEXACAO_INSURGENCIA_MAX = 15; // insurgência no momento do clique

// Garante o registro rico de uma ocupação (lazy — saves antigos ganham no 1º acesso).
export function garantirOcupacao(estado, iso) {
  estado.ocupacoes = estado.ocupacoes || {};
  if (!estado.ocupacoes[iso]) {
    estado.ocupacoes[iso] = { desde: 0, upkeepPago: 0, turnosSemPagar: 0, turnosEstavel: 0, anexavel: false, anexado: false };
  }
  return estado.ocupacoes[iso];
}

const pesoDoPais = (iso) => Math.max(0.5, (PAISES[iso]?.forca || 60) / 120);
function fatorDistancia(estado, isoAlvo) {
  const meu = PAISES[estado.iso]?.bloco; const dele = PAISES[isoAlvo]?.bloco;
  return meu && dele && meu === dele ? 0.6 : 1.3;   // vizinho de bloco é barato; longe dói
}

// O upkeep de UMA ocupação (US$ tri/turno), quebrado em componentes que o jogador entende
// e pode atacar: reduzir insurgência barateia a supressão; o resto é estrutural.
export function upkeepDe(estado, conq) {
  const peso = pesoDoPais(conq.iso);
  const nEstados = estadosDe(conq.iso).length || 1;
  const ins = conq.insurgencia || 0;
  const guarnicao = round3(0.02 * peso * Math.min(1.4, nEstados / 20 + 0.4));
  const supressao = round3(0.00045 * (ins ** 1.55) / 10);
  const descontent = round3(0.01 * peso * Math.min(2, (conq.desde || 0) / 10));
  const logistica = round3(0.012 * peso * fatorDistancia(estado, conq.iso));
  const total = round3(guarnicao + supressao + descontent + logistica);
  return { guarnicao, supressao, descontent, logistica, total, peso, nEstados };
}

// AÇÃO de 1 clique: paga upkeep adiantado (com desconto de lote) e reprime a insurgência.
export function acaoManterOrdem(estado, iso) {
  const c = (estado.conquistados || []).find((x) => x.iso === iso);
  if (!c) return { falha: 'Território não está sob ocupação.' };
  const uk = upkeepDe(estado, c);
  const custo = round2(uk.total * 1.8);   // ~2 turnos adiantados, mais barato que reagir turno a turno
  if ((estado.tesouro || 0) < custo) return { falha: `Tesouro insuficiente: manter a ordem em ${c.nome} custa ${custo} tri.` };
  const antes = c.insurgencia || 0;
  estado.tesouro = round2(estado.tesouro - custo);
  c.insurgencia = Math.max(0, antes - 22);
  const oc = garantirOcupacao(estado, iso); oc.turnosSemPagar = 0; oc.upkeepPago = round2(oc.upkeepPago + custo);
  return { ok: true, custo, insurgenciaAntes: antes, insurgenciaDepois: c.insurgencia, uk };
}

// A ocupação está pronta pra virar anexação?
export function podeAnexar(estado, iso) {
  const c = (estado.conquistados || []).find((x) => x.iso === iso);
  const oc = estado.ocupacoes?.[iso];
  if (!c || !oc) return { pode: false, motivo: 'Território não ocupado.' };
  if (oc.anexado) return { pode: false, motivo: 'Já anexado.' };
  if ((oc.turnosEstavel || 0) < ANEXACAO_TURNOS_ESTAVEL) {
    return { pode: false, motivo: `Segure o controle: ${oc.turnosEstavel || 0}/${ANEXACAO_TURNOS_ESTAVEL} meses estáveis (insurgência baixa + upkeep em dia).` };
  }
  if ((c.insurgencia || 0) > ANEXACAO_INSURGENCIA_MAX) {
    return { pode: false, motivo: `Insurgência em ${c.insurgencia}% — precisa cair abaixo de ${ANEXACAO_INSURGENCIA_MAX}% pra anexar.` };
  }
  return { pode: true };
}

// ANEXAR: o país deixa de ser "ocupação" (com insurgência/upkeep/risco) e vira TERRITÓRIO
// NACIONAL de vez — PIB/território incorporados, mas o mundo condena.
export function acaoAnexar(estado, iso, feature = null) {
  const chk = podeAnexar(estado, iso);
  if (!chk.pode) return { falha: chk.motivo };
  const info = PAISES[iso] || {};
  const nome = (estado.conquistados || []).find((x) => x.iso === iso)?.nome || info.nome || iso;

  estado.conquistados = (estado.conquistados || []).filter((c) => c.iso !== iso);
  // POSSE REAL (pedido do dono): anexar não é só tirar da lista de ocupação — TODO
  // estado daquele país passa a ser MEU em `donoEstado`. É isso que faz o mapa
  // tático, o índice e o mundo inteiro enxergarem o território como nacional.
  estado.donoEstado = estado.donoEstado || {};
  for (const e of estadosDe(iso)) estado.donoEstado[e.id] = estado.iso || 'USA';
  const oc = garantirOcupacao(estado, iso); oc.anexado = true;

  // PIB incorporado: do GeoJSON se veio a feature (mais preciso), senão pela força do país.
  const pibFeature = feature ? Number(feature.properties?.GDP_MD || 0) / 1e6 : 0;
  const pibGanho = round2(pibFeature > 0 ? Math.min(4, pibFeature * 0.5) : pesoDoPais(iso) * 0.8);
  const relKey = info.rel;
  const efeitos = {
    pib: pibGanho, territorio: 1, soft_power: -14, aprovacao: 6, estabilidade: -4,
    ...(relKey ? { [relKey]: -25 } : {}),
  };
  const mudancas = aplicarEfeitos(estado, efeitos);
  return { ok: true, iso, nome, pibGanho, mudancas };
}
