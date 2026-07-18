// ═══════════════════════════════════════════════════════════════════════
// INTERVIR PARA ENCERRAR UMA GUERRA NPC — mediação com peso real
// ═══════════════════════════════════════════════════════════════════════
// Antes "propor mediação" era um clique de -12 de intensidade que a guerra repunha no
// tick seguinte (o dono: "dificilmente resolve"). Agora é uma CAMPANHA: cada tentativa
// custa caixa + prestígio e RENDE PONTOS; ao cruzar a meta, a guerra ACABA de verdade
// (some de conflitosNPC). Três frentes, cada uma mais cara/forte, com dificuldade e
// chance honestas (a MESMA fórmula no preview e no dado). Puro, sem DOM.
import { PAISES } from '../dados/paises.js';
import { aplicarEfeitos } from './efeitos.js';
import { rand } from './rng.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// META de pontos pra fechar a guerra — escala com o quão travada ela está.
export function metaDe(c) {
  return Math.round(40 + (c.intensidade || 50) * 0.6 + Math.min(30, (c.turnos || 0) * 2));
}

// As três frentes. custo em US$ tri; softMin = prestígio mínimo pra sentar as partes;
// ganhoBase = pontos por tentativa bem-sucedida; tempo em SEGUNDOS (fila do tempo real).
export const FRENTES = {
  mediar: { nome: 'Mediação diplomática', ic: 'handshake', custo: 0.12, custoPA: 1, tempo: 16, softMin: 30, ganhoBase: 22, riscoFalha: 0.35 },
  pressionar: { nome: 'Pressão econômica conjunta', ic: 'landmark', custo: 0.3, custoPA: 1, tempo: 22, softMin: 45, ganhoBase: 32, riscoFalha: 0.3 },
  forcar: { nome: 'Intervenção militar de paz', ic: 'shield', custo: 0.8, custoPA: 2, tempo: 28, softMin: 55, ganhoBase: 48, riscoFalha: 0.4, requerPoderMilitar: 40 },
};

// Chance de a TENTATIVA render pontos (não é "chance de acabar a guerra" — é chance de
// PROGREDIR). Cresce com soft_power/poder_militar e com legitimidade (relação média com
// os dois lados); cai com a intensidade da guerra.
export function chanceTentativa(estado, c, frente) {
  const relA = Number(estado[PAISES[c.a]?.rel] ?? 0);
  const relB = Number(estado[PAISES[c.b]?.rel] ?? 0);
  const relMedia = (relA + relB) / 2;
  const alavanca = frente === 'forcar' ? (estado.poder_militar || 0) / 100 : (estado.soft_power || 0) / 100;
  const base = 0.35 + alavanca * 0.4 + Math.max(0, relMedia / 200);
  const penalidade = ((c.intensidade || 50) / 100) * 0.3;
  return clamp(base - penalidade, 0.08, 0.9);
}

export function podeTentar(estado, frente) {
  const f = FRENTES[frente];
  if ((estado.soft_power || 0) < f.softMin) return { ok: false, motivo: `precisa de ${f.softMin} de Influência` };
  if (f.requerPoderMilitar && (estado.poder_militar || 0) < f.requerPoderMilitar) return { ok: false, motivo: `precisa de ${f.requerPoderMilitar} de Poder Militar` };
  if ((estado.tesouro || 0) < f.custo) return { ok: false, motivo: 'sem caixa' };
  return { ok: true };
}

// Resolve UMA tentativa (quando o tempo dela zera na fila do tempo real).
export function tentarIntervencao(estado, conflitoId, frente) {
  const c = (estado.conflitosNPC || []).find((x) => x.id === conflitoId);
  if (!c) return { falha: 'A guerra já terminou antes da sua diplomacia chegar.' };
  const f = FRENTES[frente];
  c.mediacao = c.mediacao || { pontos: 0, meta: metaDe(c), tentativas: 0 };
  c.mediacao.tentativas += 1;

  const chance = chanceTentativa(estado, c, frente);
  const sucesso = rand() < chance;
  aplicarEfeitos(estado, { soft_power: -(frente === 'forcar' ? 6 : 4) });  // toda tentativa gasta prestígio

  if (sucesso) {
    c.mediacao.pontos += Math.round(f.ganhoBase * (0.8 + rand() * 0.4));
    c.intensidade = clamp((c.intensidade || 50) - 10, 5, 100);
  } else if (rand() < f.riscoFalha) {
    c.intensidade = clamp((c.intensidade || 50) + 8, 5, 100);   // fracasso feio: esquenta
  }

  const terminou = c.mediacao.pontos >= c.mediacao.meta;
  const nomeA = PAISES[c.a]?.nome || c.a; const nomeB = PAISES[c.b]?.nome || c.b;
  if (terminou) {
    estado.conflitosNPC = (estado.conflitosNPC || []).filter((x) => x.id !== c.id);
    aplicarEfeitos(estado, { soft_power: 14, estabilidade: 3, [PAISES[c.a]?.rel]: 10, [PAISES[c.b]?.rel]: 10 });
    return { terminou: true, sucesso: true, nomeA, nomeB,
      texto: `CESSAR-FOGO: a guerra ${nomeA}×${nomeB} termina sob mediação de ${PAISES[estado.iso]?.nome || 'nossa nação'}. O mundo credita a paz a quem sentou as partes à mesa.` };
  }
  return { terminou: false, sucesso, pontos: c.mediacao.pontos, meta: c.mediacao.meta, nomeA, nomeB,
    texto: sucesso ? `Diplomacia avança na guerra ${nomeA}×${nomeB}: ${c.mediacao.pontos}/${c.mediacao.meta} rumo ao cessar-fogo.`
      : `Tentativa de paz entre ${nomeA} e ${nomeB} emperra${rand() < f.riscoFalha ? ' — e a tensão sobe.' : '.'}` };
}
