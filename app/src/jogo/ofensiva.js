// ═══════════════════════════════════════════════════════════════════════
// OFENSIVAS DO JOGADOR EM PREPARO — o espelho de `mobilizacoes`
// ═══════════════════════════════════════════════════════════════════════
// Antes: clicou em LANÇAR OFENSIVA → resolvia na hora. Agora um ataque grande LEVA TEMPO
// pra montar (proporcional à força): vira uma OPERAÇÃO com contagem de batidas. Durante o
// preparo, o ALVO (NPC de intel alta, ou humano) pode DETECTAR e reforçar a defesa —
// ataque telegrafado apanha resistência; ataque-surpresa ganha bônus. Puro, sem DOM: a
// resolução da batalha (com a feature real) roda na UI quando a operação amadurece.
import { PAISES } from '../dados/paises.js';
import { NACOES } from '../dados/registro.js';
import { avaliarGuerra, combustivelDaGuerra } from './guerra.js';
import { poderDeploy, custoDeploy } from '../dados/forcas.js';
import { rand } from './rng.js';

export const MAX_OPERACOES = 3;   // capacidade de comando — não empilha cinemáticas
const round2 = (n) => Math.round(n * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Tempo de preparo (batidas). Ataque maior = mais lento de montar E mais fácil de flagrar.
export function duracaoOfensiva(poderEnviado = 0) {
  return Math.max(2, Math.min(9, Math.round(2 + poderEnviado / 45)));
}

// ESCOPO DA OFENSIVA: tomar 3 estados de 27 não pode demorar o mesmo que o país inteiro.
// Fórmula: fator = 0.35 + 0.65 × (nEstados/totalEstados), clamp [0.25, 1] — 3/27 ≈ 42%
// do tempo cheio; sem seleção (país inteiro) = 100%; piso 25% do base, teto o base atual.
export function fatorEscopoOfensiva(nEstados = 0, totalEstados = 0) {
  if (!nEstados || !totalEstados || nEstados >= totalEstados) return 1;
  return clamp(0.35 + 0.65 * (nEstados / totalEstados), 0.25, 1);
}

// Chance de o ALVO flagrar a operação NESTA batida. Lê a inteligência do alvo (NPC) e a
// sua contra-inteligência (segurança); cresce com o tempo decorrido. Intel alta do alvo =
// detecta cedo (defesa reforçada); intel baixa = você pega ele de surpresa.
export function chanceDeteccaoAlvo(estado, op) {
  // ALVO HUMANO usa a inteligência REAL dele (transmitida a cada batida em statsVivos),
  // não a ficha estática do NPC. É o que faz "investir em Inteligência" comprar de fato
  // a chance de flagrar a ofensiva antes de ela cair — inclusive contra outro jogador.
  const intelHumano = Number(estado._statsHumanos?.[op.alvoIso]?.intel);
  const intelAlvo = Number.isFinite(intelHumano) ? intelHumano
    : Number(NACOES[op.alvoIso]?.ficha?.estadoInicial?.inteligencia ?? 30);
  const contraIntel = Math.min(0.35, Number(estado.seguranca || 0) / 285);
  const elapsed = 1 - op.restante / Math.max(1, op.total);
  const base = (intelAlvo / 100) * 0.5;
  return clamp((base + elapsed * 0.4) * (1 - contraIntel), 0, 0.97);
}

// Detectado cedo = alvo reforçou → defesa mais dura. Não detectado = surpresa → bônus.
export function multiplicadoresOfensiva(op) {
  if (!op.detectado) return { multDefesaAlvo: 1, multSurpresa: 1.15 };
  const antecedencia = Math.max(0, op.restanteNaDeteccao ?? 0) / Math.max(1, op.total);
  return { multDefesaAlvo: 1 + Math.min(0.4, 0.12 + antecedencia * 0.28), multSurpresa: 1 };
}

// COMMIT: paga o custo, tira a força do inventário ("a caminho"), entra na fila de operações.
export function iniciarOperacaoGuerra(estado, feature, deploy, opts = {}) {
  estado.operacoes = estado.operacoes || [];
  if (estado.operacoes.length >= MAX_OPERACOES) return { falha: `Comando ocupado — ${MAX_OPERACOES} operações já em preparo.` };
  const av = avaliarGuerra(estado, feature);
  const multPoder = opts.multPoder || 1;
  const custo = opts.custo ?? custoDeploy(deploy);
  const poderEnviado = Math.round(poderDeploy(deploy) * multPoder);
  if (poderEnviado <= 0) return { falha: 'Nenhuma força designada para a ofensiva.' };
  const comb = combustivelDaGuerra(estado, deploy, custo);
  const custoTotal = round2(custo + comb.custoExtra);
  if ((estado.tesouro || 0) < custoTotal) return { falha: `Tesouro insuficiente: ${custoTotal} tri (logística + combustível).` };

  estado.tesouro = round2(estado.tesouro - custoTotal);
  for (const [id, q] of Object.entries(deploy)) if (q) estado.forcas[id] = Math.max(0, (estado.forcas[id] || 0) - q);

  // tempo escala com o ESCOPO: menos estados-alvo = preparo mais curto (ver fatorEscopoOfensiva)
  const fator = fatorEscopoOfensiva(opts.nEstados || 0, opts.totalEstados || 0);
  const total = Math.max(1, Math.round(duracaoOfensiva(poderEnviado) * fator));
  const op = {
    id: `op_${estado.turno || 0}_${Math.round(poderEnviado)}_${(estado.operacoes.length)}`, tipo: 'guerra',
    alvoIso: av.iso, alvoNome: av.nome, deploy: { ...deploy },
    origem: opts.origem || null, prioridade: opts.prioridade || null, multPoder, custo, poderEnviado,
    total, restante: total, detectado: false, novoAviso: false, restanteNaDeteccao: null,
  };
  estado.operacoes.push(op);
  return { ok: true, op };
}

// Progride TODAS as operações uma batida; devolve as que amadureceram (a UI resolve a
// batalha com a feature real e toca o desfecho).
export function processarOperacoes(estado) {
  estado.operacoes = estado.operacoes || [];
  const prontas = [];
  for (const op of estado.operacoes) {
    op.restante -= 1;
    if (!op.detectado && rand() < chanceDeteccaoAlvo(estado, op)) {
      op.detectado = true; op.novoAviso = true; op.restanteNaDeteccao = op.restante;
    }
    if (op.restante <= 0) prontas.push(op);
  }
  if (prontas.length) estado.operacoes = estado.operacoes.filter((o) => !prontas.includes(o));
  return prontas;
}

// Recall: cancela uma operação em preparo, devolve a força e parte do caixa.
export function cancelarOperacao(estado, opId) {
  const op = (estado.operacoes || []).find((o) => o.id === opId);
  if (!op) return { falha: 'Operação não encontrada.' };
  estado.operacoes = estado.operacoes.filter((o) => o.id !== opId);
  for (const [id, q] of Object.entries(op.deploy || {})) if (q) estado.forcas[id] = (estado.forcas[id] || 0) + q;
  const comb = combustivelDaGuerra(estado, op.deploy, op.custo);
  estado.tesouro = round2(estado.tesouro + (op.custo + comb.custoExtra) * 0.6);   // 60% de volta
  return { ok: true, alvoNome: op.alvoNome };
}

export const nomeAlvo = (iso) => PAISES[iso]?.nome || iso;
