// GUARDA-CORPOS — mantém a IA nos trilhos. Filosofia "consertar em vez de rejeitar":
// chaves fora do vocabulário são descartadas, valores fora do teto são aparados.
// O vocabulário e os tetos vêm do registro único (jogo/vars.js).
import { chaveValida, tetoDe, QUALITATIVOS, VARS } from '../jogo/vars.js';

function aparar(valor, teto) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  const aparado = Math.max(-teto, Math.min(teto, n));
  return Math.round(aparado * 100) / 100; // mantém 2 casas (dinheiro em trilhões)
}

export function sanearEfeitos(efeitos, log = []) {
  const limpo = {};
  if (!efeitos || typeof efeitos !== 'object') return limpo;
  for (const [chave, valor] of Object.entries(efeitos)) {
    if (QUALITATIVOS[chave]) {
      if (QUALITATIVOS[chave].includes(valor)) limpo[chave] = valor;
      else log.push(`valor qualitativo inválido em ${chave}`);
    } else if (chaveValida(chave)) {
      limpo[chave] = aparar(valor, tetoDe(chave));
    } else {
      log.push(`chave fora do vocabulário descartada: ${chave}`);
    }
  }
  return limpo;
}

// Tags políticas de uma opção: { economico: ±, autoridade: ± }, aparadas a ±20.
export function sanearPolitico(politico) {
  if (!politico || typeof politico !== 'object') return null;
  const out = {};
  for (const eixo of ['economico', 'autoridade']) {
    if (politico[eixo] != null) out[eixo] = aparar(politico[eixo], 20);
  }
  return Object.keys(out).length ? out : null;
}

export function validarCarta(bruta) {
  const log = [];
  if (!bruta || typeof bruta !== 'object') return { ok: false, carta: null, log: ['carta não é objeto'] };

  const narrativa = String(bruta.narrativa || '').trim();
  const opcoesBrutas = Array.isArray(bruta.opcoes) ? bruta.opcoes : [];
  if (!narrativa || opcoesBrutas.length === 0) {
    return { ok: false, carta: null, log: ['carta sem narrativa ou sem opções'] };
  }

  const opcoes = opcoesBrutas.slice(0, 4).map((op, i) => ({
    texto: String(op?.texto || `Opção ${i + 1}`).trim(),
    efeitos: sanearEfeitos(op?.efeitos, log),
    politico: sanearPolitico(op?.politico),
    reacao_feed: typeof op?.reacao_feed === 'string' ? op.reacao_feed : '',
    efeito_no_fio: sanearEfeitoNoFio(op?.efeito_no_fio),
    requer_capacidade: sanearRequisito(op?.requer_capacidade),
  }));

  const carta = {
    id: String(bruta.id || `gen_${Date.now()}`),
    fio: bruta.fio ? String(bruta.fio) : null,
    pressiona: VARS[bruta.pressiona]?.grupo === 'medidor' ? bruta.pressiona : null,
    personagem: bruta.personagem ? String(bruta.personagem) : null,
    titulo: String(bruta.titulo || 'Um acontecimento').trim(),
    narrativa,
    opcoes,
  };
  return { ok: true, carta, log };
}

function sanearEfeitoNoFio(ef) {
  if (!ef || typeof ef !== 'object') return null;
  const out = {};
  if (ef.intensidade != null) out.intensidade = aparar(ef.intensidade, 40);
  if (ef.pode_mutar === true) out.pode_mutar = true;
  if (ef.status && ['ativo', 'esfriando', 'resolvido', 'mutou'].includes(ef.status)) out.status = ef.status;
  return Object.keys(out).length ? out : null;
}

function sanearRequisito(req) {
  if (!req || typeof req !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(req)) {
    if (VARS[k] && typeof v === 'string') out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

// Testa um requer_capacidade contra o estado. Ex.: { inteligencia: ">40" }.
export function cumpreRequisito(req, estado) {
  if (!req) return true;
  for (const [chave, expr] of Object.entries(req)) {
    const atual = Number(estado[chave] ?? 0);
    const m = /^\s*([<>]=?)\s*(-?\d+)\s*$/.exec(expr);
    if (!m) continue;
    const [, op, alvoStr] = m;
    const alvo = Number(alvoStr);
    const passa =
      (op === '>' && atual > alvo) || (op === '>=' && atual >= alvo) ||
      (op === '<' && atual < alvo) || (op === '<=' && atual <= alvo);
    if (!passa) return false;
  }
  return true;
}
