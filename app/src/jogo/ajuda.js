// ═══════════════════════════════════════════════════════════════════════
// AJUDA EXTERNA — o outro jeito de mover o tabuleiro sem disparar um tiro
// ═══════════════════════════════════════════════════════════════════════
// O pedido: poder OFERECER ajuda a países em guerra — dinheiro, arsenal — e com
// isso inclinar o conflito e comprar gratidão. É a versão soft do poder: você não
// invade ninguém, mas escolhe quem ganha a guerra dos outros, e o mundo registra
// de que lado você estava.
//
// Duas formas de ajudar, dois preços:
//   FINANCEIRA — sai do seu caixa. Rápida, discreta, some no orçamento deles.
//   ARSENAL    — sai da sua ordem de batalha. Visível, provocadora, decisiva no campo.
//
// A consequência sistêmica: a intensidade do conflito e o lado favorecido mudam;
// a relação com quem você ajudou sobe (gratidão) e com o inimigo dele desce (você
// escolheu um lado); o seu soft power sobe (protetor) ou o mundo te vê tomando
// partido, dependendo de quem você apoia.
import { PAISES } from '../dados/paises.js';
import { UNIDADES, UNIDADE_POR_ID } from '../dados/forcas.js';
import { aplicarEfeitos } from './efeitos.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (n) => Math.round(n * 100) / 100;

// Países a quem você PODE ajudar agora: os envolvidos em conflitos NPC + os países
// com quem você já tem alguma relação e estão sob pressão (em guerra com você não
// conta — a esses você não ajuda, ataca).
export function alvosDeAjuda(estado) {
  const eu = estado.iso || 'USA';
  const set = new Map();
  for (const c of estado.conflitosNPC || []) {
    for (const [lado, contra] of [[c.a, c.b], [c.b, c.a]]) {
      if (lado === eu) continue;
      set.set(lado, {
        iso: lado, nome: PAISES[lado]?.nome || lado,
        contexto: `Em guerra com ${PAISES[contra]?.nome || contra} por ${c.tema}`,
        conflito: c, inimigo: contra,
        rel: relDe(estado, lado),
      });
    }
  }
  return [...set.values()];
}

function relDe(estado, iso) {
  const k = PAISES[iso]?.rel;
  return k ? Number(estado[k] ?? 0) : 0;
}

// ── AJUDA FINANCEIRA ──────────────────────────────────────────────────
export function ajudarComDinheiro(estado, iso, valorTri) {
  if (valorTri <= 0) return { falha: 'Valor inválido.' };
  if (valorTri > estado.tesouro) return { falha: 'Sem caixa para essa ajuda.' };
  estado.tesouro = round2(estado.tesouro - valorTri);

  const k = PAISES[iso]?.rel;
  const ganho = Math.round(clamp(valorTri * 60, 4, 30));   // quanto o dinheiro compra de gratidão
  if (k) estado[k] = clamp((estado[k] || 0) + ganho, -100, 100);

  // inclina o conflito a favor de quem recebeu
  const conflito = (estado.conflitosNPC || []).find((c) => c.a === iso || c.b === iso);
  if (conflito) inclinarConflito(estado, conflito, iso, valorTri * 8);

  const efeitos = aplicarEfeitos(estado, { soft_power: 4 });
  return { tipo: 'dinheiro', iso, valor: valorTri, ganhoRel: ganho, efeitos, inimigo: inimigoDe(conflito, iso) };
}

// ── AJUDA MILITAR (transfere unidades do seu arsenal) ─────────────────
export function ajudarComArsenal(estado, iso, deploy) {
  const total = Object.values(deploy || {}).reduce((a, q) => a + (q || 0), 0);
  if (total <= 0) return { falha: 'Nenhuma unidade selecionada.' };
  // desconta do seu arsenal
  for (const [id, q] of Object.entries(deploy)) {
    if (!q) continue;
    if ((estado.forcas[id] || 0) < q) return { falha: `Você não tem ${q} de ${UNIDADE_POR_ID[id]?.nome || id}.` };
  }
  for (const [id, q] of Object.entries(deploy)) {
    if (q) estado.forcas[id] = Math.max(0, (estado.forcas[id] || 0) - q);
  }

  const k = PAISES[iso]?.rel;
  const peso = Object.entries(deploy).reduce((a, [id, q]) => a + (q || 0) * (UNIDADE_POR_ID[id]?.poder || 0), 0);
  const ganho = Math.round(clamp(peso * 30 + 6, 6, 35));
  if (k) estado[k] = clamp((estado[k] || 0) + ganho, -100, 100);

  // arsenal inclina o conflito com mais força que dinheiro
  const conflito = (estado.conflitosNPC || []).find((c) => c.a === iso || c.b === iso);
  if (conflito) inclinarConflito(estado, conflito, iso, peso * 120);

  // você tomou lado às claras: soft power sobe (protetor) mas o inimigo dele te marca
  const inimigo = inimigoDe(conflito, iso);
  const ik = inimigo && PAISES[inimigo]?.rel;
  if (ik) estado[ik] = clamp((estado[ik] || 0) - 12, -100, 100);
  const efeitos = aplicarEfeitos(estado, { soft_power: 6, temp_guerra: 4 });

  return { tipo: 'arsenal', iso, deploy, ganhoRel: ganho, efeitos, inimigo };
}

// Empurra a intensidade do conflito na direção do favorecido. Se a ajuda for grande
// o bastante e o favorecido estiver por cima, a guerra pode virar a favor dele.
function inclinarConflito(estado, conflito, favorecido, forca) {
  // representamos o "momentum" como um viés na intensidade: ajudar o lado A reduz a
  // intensidade contra A (ele está ganhando fôlego). Simples, legível, e o tickMundoVivo
  // já resolve o desfecho a partir da intensidade.
  const delta = Math.min(20, forca);
  conflito.intensidade = clamp(conflito.intensidade - delta, 5, 100);
  conflito.favorecido = favorecido;   // registro pro mundo vivo narrar
}

function inimigoDe(conflito, iso) {
  if (!conflito) return null;
  return conflito.a === iso ? conflito.b : conflito.a;
}

// Texto pro feed
export function mancheteAjuda(estado, res) {
  const nome = PAISES[res.iso]?.nome || res.iso;
  const meu = PAISES[estado.iso]?.nome || 'Nossa nação';
  if (res.tipo === 'dinheiro') {
    return `${meu} anuncia ${res.valor.toFixed(2)} tri em ajuda a ${nome}. ${res.inimigo ? `${PAISES[res.inimigo]?.nome || res.inimigo} chama de "interferência hostil".` : 'O gesto compra gratidão e uma fatura moral.'}`;
  }
  const itens = Object.entries(res.deploy).filter(([, q]) => q > 0)
    .map(([id, q]) => `${q.toLocaleString('pt-BR')} ${UNIDADE_POR_ID[id]?.nome || id}`).join(', ');
  return `${meu} envia armamento a ${nome}: ${itens}. Tomar lado numa guerra alheia tem preço — e ${res.inimigo ? `${PAISES[res.inimigo]?.nome || res.inimigo} acabou de anotar o seu nome.` : 'o mundo reparou.'}`;
}
