// ═══════════════════════════════════════════════════════════════════════
// SOLICITAÇÃO DE COMPRA — você não compra armamento, você PEDE
// ═══════════════════════════════════════════════════════════════════════
// No mundo real ninguém entra numa loja e sai com um F-35. Você solicita, um governo
// estrangeiro avalia, o Congresso deles opina, e a resposta pode ser não — mesmo com
// o dinheiro na mesa. A Turquia PAGOU pelos F-35 e foi expulsa do programa.
//
// COMO FUNCIONA AQUI:
//   1. Você solicita no mercado (o dinheiro fica RESERVADO, não gasto).
//   2. No fechamento do turno, o país de origem decide contra a relação real.
//   3. Aprovado  → as unidades entram no arsenal, o dinheiro sai.
//      Negado    → o dinheiro volta, e a relação com eles piora um pouco
//                  (pedir e levar não é de graça: expõe sua dependência).
//
// Produção nacional é entrega imediata: a fábrica é sua, não tem a quem pedir.
import { ARSENAL_POR_ID, podeComprar, precoEfetivo } from '../dados/arsenal.js';
import { PAISES } from '../dados/paises.js';
import { tetoSoldados } from '../dados/efetivoMilitar.js';
import { UNIDADE_POR_ID } from '../dados/forcas.js';
import { filaRegistrada, enfileirarNaFila } from './filaComando.js';
import { rand } from './rng.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round4 = (n) => Math.round(n * 1e4) / 1e4;

// ── TEMPO DE ENTREGA ──────────────────────────────────────────────────
// Nenhuma arma cai do céu: TODA aquisição entra na FILA DE COMANDO com um
// tempo de produção/entrega proporcional ao PESO industrial do item.
//
//   infantaria / material leve ......... ~15s   (recrutar e fardar é rápido)
//   blindados / artilharia / def.aérea . ~25s   (linha de montagem pesada)
//   helicópteros / drones .............. ~30s   (aviação leve)
//   caças / bombardeiros / mísseis ..... ~40s   (aviação de combate, alta tecnologia)
//   navios / submarinos ................ ~60s   (estaleiro: meses viram anos)
//   porta-aviões ....................... ~90s   (a obra de engenharia de uma década)
//
// Modificadores: produção NACIONAL é 30% mais rápida (a fábrica é sua, sem
// alfândega nem navio de carga); pedido GRANDE (mais de 3 passos da unidade)
// custa +20% (a linha satura). Clamp final 10s–120s.
const TEMPO_ENTREGA_BASE = {
  infantaria: 15,
  blindados: 25, artilharia: 25, defesa_aerea: 25,
  helicopteros: 30, drones: 30,
  cacas: 40, bombardeiros: 40, misseis: 40,
  navios: 60, submarinos: 60,
  porta_avioes: 90,
};

export function tempoEntrega(unidadeId, qtd = 1, nacional = false) {
  let t = TEMPO_ENTREGA_BASE[unidadeId] || 25;
  const passo = UNIDADE_POR_ID[unidadeId]?.passo || 1;
  if (qtd > passo * 3) t *= 1.2;      // encomenda grande satura a linha
  if (nacional) t *= 0.7;             // fábrica própria: 30% mais rápido
  return clamp(Math.round(t), 10, 120);
}

// Monta a ação sintética de encomenda que roda na fila de comando. Quando o
// tempo dela acaba, motor.executarAcaoTempo reconhece `_compraArsenal` e
// incorpora as unidades ao arsenal.
export function acaoDeEncomenda({ unidadeId, qtd, nome, custo, nacional }) {
  return {
    id: `compra_${unidadeId}_${Date.now()}`,
    nome: `Encomenda: ${nome} ×${qtd.toLocaleString('pt-BR')}`,
    icone: '📦', categoria: 'Arsenal',
    custo, custoPA: 1,
    tempo: tempoEntrega(unidadeId, qtd, nacional),
    prob: 1,
    _compraArsenal: { unidadeId, qtd, nomeItem: nome },
  };
}

// Chave de relação de um país (rel_brasil, rel_china...) ou sintetizada pelo ISO.
export function chaveRelDe(estado, isoCode) {
  const nomeada = PAISES[isoCode]?.rel;
  if (nomeada && nomeada in estado) return nomeada;
  const k = `rel_${String(isoCode).toLowerCase()}`;
  return k in estado ? k : null;
}

export function relacaoCom(estado, isoCode) {
  if (isoCode === (estado.iso || 'USA')) return 100;
  const k = chaveRelDe(estado, isoCode);
  return k ? Number(estado[k] ?? 0) : 0;
}

// ── SOLICITAR ─────────────────────────────────────────────────────────
export function solicitar(estado, itemId, qtd) {
  const item = ARSENAL_POR_ID[itemId];
  if (!item) return { falha: 'Item inexistente.' };
  if (qtd <= 0) return { falha: 'Quantidade inválida.' };

  const meuIso = estado.iso || 'USA';
  // Soldados (infantaria) têm TETO humano por país: nem no mercado dá pra passar dele.
  if (item.unidade === 'infantaria') {
    const espaco = Math.max(0, tetoSoldados(meuIso) - (estado.forcas?.infantaria || 0));
    if (espaco <= 0) return { falha: `Efetivo no teto (${tetoSoldados(meuIso).toLocaleString('pt-BR')} soldados). Dê baixa ou espere — o país já está no limite humano.` };
    if (qtd > espaco) return { falha: `Só cabem mais ${espaco.toLocaleString('pt-BR')} soldados até o teto do país (${tetoSoldados(meuIso).toLocaleString('pt-BR')}).` };
  }
  const rel = relacaoCom(estado, item.origem);
  const av = podeComprar(item, estado, rel, meuIso);
  if (!av.pode) return { falha: av.motivo };

  const preco = precoEfetivo(item, rel, meuIso);
  const total = round4(preco * qtd);
  if (total > estado.tesouro) {
    return { falha: `Sem caixa: o pedido custa ${total.toFixed(3)} tri e você tem ${estado.tesouro.toFixed(2)} tri.` };
  }

  // O dinheiro sai do caixa AGORA (fica em custódia). Se negarem, volta.
  estado.tesouro = round4(estado.tesouro - total);
  estado.pedidos = estado.pedidos || [];

  // Produção nacional não pede licença a ninguém — mas fabricar leva TEMPO.
  // Com o tempo real ativo, a encomenda entra na FILA DE COMANDO e as unidades
  // só chegam quando a linha de montagem termina (motor resolve _compraArsenal).
  if (av.nacional) {
    if (filaRegistrada()) {
      // Devolve a custódia: quem debita o caixa é a própria fila ao enfileirar.
      estado.tesouro = round4(estado.tesouro + total);
      const acao = acaoDeEncomenda({ unidadeId: item.unidade, qtd, nome: item.nome, custo: total, nacional: true });
      const r = enfileirarNaFila(acao);
      if (!r.ok) return { falha: r.motivo || 'Fila de comando cheia — espere concluir uma ordem.' };
      registrarNoHistorico(estado, {
        id: acao.id, itemId, qtd, total, origem: item.origem, nomeItem: item.nome, unidade: item.unidade,
        pedidoNoTurno: estado.turno || 0, turnoResposta: estado.turno || 0,
        status: 'produzido', chance: 1,
        motivo: `Produção nacional — a linha de montagem é nossa. Encomenda na fila de comando; entrega em ~${acao.tempo}s.`,
      });
      return { encomendado: true, item, qtd, total, nacional: true, tempo: acao.tempo };
    }
    // Compat (modo antigo / testes, sem fila registrada): entrega imediata.
    estado.forcas[item.unidade] = (estado.forcas[item.unidade] || 0) + qtd;
    registrarNoHistorico(estado, {
      id: `nac_${itemId}_${(estado.historicoPedidos || []).length}`,
      itemId, qtd, total, origem: item.origem, nomeItem: item.nome, unidade: item.unidade,
      pedidoNoTurno: estado.turno || 0, turnoResposta: estado.turno || 0,
      status: 'produzido', chance: 1,
      motivo: 'Produção nacional — a linha de montagem é nossa. Entrega imediata, sem pedir licença a ninguém.',
    });
    return { imediato: true, item, qtd, total, nacional: true };
  }

  const pedido = {
    id: `${itemId}_${estado.pedidos.length}_${qtd}`,
    itemId, qtd, total, chance: av.chance,
    origem: item.origem, nomeItem: item.nome, unidade: item.unidade,
    pedidoNoTurno: estado.turno || 0,
  };
  estado.pedidos.push(pedido);
  return { pedido, item, qtd, total, chance: av.chance };
}

export function cancelarPedido(estado, pedidoId) {
  const i = (estado.pedidos || []).findIndex((p) => p.id === pedidoId);
  if (i < 0) return null;
  const [p] = estado.pedidos.splice(i, 1);
  estado.tesouro = round4(estado.tesouro + p.total);   // devolve a custódia
  registrarNoHistorico(estado, { ...p, status: 'cancelado', turnoResposta: estado.turno || 0 });
  return p;
}

export function pedidosPendentes(estado) { return estado.pedidos || []; }

// ── HISTÓRICO ─────────────────────────────────────────────────────────
// O buraco que isto tapa: você solicitava, o turno passava, e a resposta se perdia
// no meio do feed. Não havia LUGAR nenhum pra consultar "o que aconteceu com o meu
// pedido de F-35?". Agora todo pedido termina aqui — aprovado, negado ou cancelado —
// com país de origem, valor, quando e POR QUÊ.
export function registrarNoHistorico(estado, registro) {
  estado.historicoPedidos = estado.historicoPedidos || [];
  estado.historicoPedidos.unshift(registro);
  if (estado.historicoPedidos.length > 40) estado.historicoPedidos.length = 40;
}

export function historicoPedidos(estado) { return estado.historicoPedidos || []; }

export function resumoPedidos(estado) {
  const h = historicoPedidos(estado);
  const aprovados = h.filter((p) => p.status === 'aprovado');
  const negados = h.filter((p) => p.status === 'negado' || p.status === 'cancelado_por_eles');
  return {
    pendentes: (estado.pedidos || []).length,
    aprovados: aprovados.length,
    negados: negados.length,
    gasto: round4(aprovados.reduce((a, p) => a + p.total, 0)),
    // A taxa de aprovação é um retrato de quão isolado você está no mundo.
    taxa: h.length ? Math.round((aprovados.length / h.filter((p) => p.status !== 'cancelado').length || 0) * 100) : null,
  };
}

// Quanto do seu caixa está preso em pedidos aguardando resposta.
export function caixaEmCustodia(estado) {
  return round4((estado.pedidos || []).reduce((a, p) => a + p.total, 0));
}

// ── RESOLVER (fechamento do turno) ────────────────────────────────────
// Retorna os desfechos pro feed. Cada pedido é um dado contra a chance calculada
// a partir da relação REAL no momento da resposta — não no momento do pedido.
// Se você atacou um aliado no meio do turno, o pedido dele pode morrer por causa disso.
export function resolverPedidos(estado) {
  const saidas = [];
  for (const p of estado.pedidos || []) {
    const item = ARSENAL_POR_ID[p.itemId];
    const relAgora = relacaoCom(estado, p.origem);
    const av = podeComprar(item, estado, relAgora, estado.iso || 'USA');

    const turno = estado.turno || 0;

    // A relação pode ter DESABADO entre o pedido e a resposta.
    if (!av.pode) {
      estado.tesouro = round4(estado.tesouro + p.total);
      const motivo = `A relação caiu para ${relAgora} entre o pedido e a resposta. ${av.motivo}`;
      registrarNoHistorico(estado, { ...p, status: 'cancelado_por_eles', turnoResposta: turno, relFinal: relAgora, motivo });
      saidas.push({
        ok: false, pedido: p, item, motivo: 'relacao',
        texto: `${nomeDe(p.origem)} CANCELOU a venda de ${p.qtd}× ${p.nomeItem}. ${av.motivo} O dinheiro voltou; a humilhação, não.`,
      });
      continue;
    }

    const aprovado = rand() < av.chance;
    if (aprovado) {
      estado.forcas[p.unidade] = (estado.forcas[p.unidade] || 0) + p.qtd;
      registrarNoHistorico(estado, {
        ...p, status: 'aprovado', turnoResposta: turno, relFinal: relAgora,
        motivo: `Aprovado com ${Math.round(av.chance * 100)}% de chance. Relação ${relAgora}.`,
      });
      saidas.push({
        ok: true, pedido: p, item,
        texto: `${nomeDe(p.origem)} APROVOU a venda de ${p.qtd}× ${p.nomeItem} por ${p.total.toFixed(3)} tri. As unidades entram na ordem de batalha neste turno.`,
      });
    } else {
      estado.tesouro = round4(estado.tesouro + p.total);
      // Pedir e levar não sai de graça: você expôs sua dependência e eles anotaram.
      const k = chaveRelDe(estado, p.origem);
      if (k) estado[k] = clamp((estado[k] || 0) - 4, -100, 100);
      registrarNoHistorico(estado, {
        ...p, status: 'negado', turnoResposta: turno, relFinal: relAgora,
        motivo: `Negado. Tinha ${Math.round(av.chance * 100)}% de chance com relação ${relAgora} — e o dado caiu do outro lado. Relação caiu 4 pontos.`,
      });
      saidas.push({
        ok: false, pedido: p, item, motivo: 'negado',
        texto: `${nomeDe(p.origem)} NEGOU a venda de ${p.qtd}× ${p.nomeItem}. Sem justificativa pública — e nenhuma era necessária. Agora o mundo sabe o que você não consegue comprar.`,
      });
    }
  }
  estado.pedidos = [];
  return saidas;
}

function nomeDe(isoCode) { return PAISES[isoCode]?.nome || isoCode; }
