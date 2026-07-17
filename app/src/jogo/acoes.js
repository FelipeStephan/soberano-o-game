// RESOLUÇÃO DAS AÇÕES ENFILEIRADAS — o dado de RPG.
// Cada ação rola contra sua probabilidade: sucesso aplica efeitos; fracasso aplica
// efeitos_falha (geralmente pior). As tags políticas valem SEMPRE (a intenção define
// quem você é, mesmo que a execução falhe).
import { aplicarEfeitos } from './efeitos.js';
import { aplicarPolitico } from './politico.js';
import { aplicarForcas, UNIDADE_POR_ID } from '../dados/forcas.js';
import { tetoSoldados } from '../dados/efetivoMilitar.js';
import { aplicarOcupacao } from './ocupacao.js';
import { VEICULOS, investirNaMidia } from '../dados/veiculos.js';

// `veiculos` é a imprensa VIVA da partida (a que imprensaDe(iso) devolveu e que a IA
// conhece pelo nome). Sem ela, comprar mídia subia a simpatia do catálogo global de
// veiculos.js — uma lista que esta partida nem usa. O jogador pagava e nada mudava.
export function resolverFila(estado, fila, veiculos = null) {
  const resultados = [];
  for (const item of fila) {
    const a = item.acao;
    const sucesso = Math.random() < a.prob;
    const efeitos = sucesso ? a.efeitos : (a.efeitos_falha || {});
    const mudancas = aplicarEfeitos(estado, efeitos);
    aplicarPolitico(estado, a.politico);
    // unidades militares concretas entram no inventário só no sucesso
    // administração de território ocupado (integrar/extrair/reprimir/libertar)
    if (sucesso && a.ocupacao) aplicarOcupacao(estado, a.ocupacao);
    // ações de mídia compram cobertura favorável (mais fácil em quem já te apoia)
    if (sucesso && a.categoria === 'Mídia') {
      const forca = a.id === 'propaganda' ? 16 : a.id === 'influen' ? 10 : 12;
      for (const v of (veiculos?.length ? veiculos : VEICULOS)) {
        investirNaMidia(v, estado, forca * (0.6 + Math.random() * 0.8));
      }
    }
    let ganhoForcas = [];
    if (sucesso && a.forcas) {
      // Soldados (infantaria) respeitam o TETO do país mesmo comprados como "brigada":
      // gente é gente, e o limite humano vale pra qualquer via de aquisição.
      const compra = { ...a.forcas };
      if (compra.infantaria) {
        const teto = tetoSoldados(estado.iso || 'USA');
        compra.infantaria = Math.max(0, Math.min(compra.infantaria, teto - (estado.forcas.infantaria || 0)));
        if (!compra.infantaria) delete compra.infantaria;
      }
      ganhoForcas = aplicarForcas(estado.forcas, compra)
        .map((m) => ({ id: m.id, nome: UNIDADE_POR_ID[m.id]?.nome || m.id, icone: UNIDADE_POR_ID[m.id]?.icone || '', delta: m.delta }));
    }
    // ── RECRUTAMENTO (soldados) ────────────────────────────────────────
    // Diferente de a.forcas (compra de equipamento): aqui entra GENTE, com TETO por país
    // (dados/efetivoMilitar.js) e, quando `usaReserva`, saindo da reserva mobilizável.
    // Recrutar acima do teto simplesmente não rende — o país já está no limite humano.
    if (sucesso && a.recruta) {
      const teto = tetoSoldados(estado.iso || 'USA');
      const entradas = {};
      for (const [uid, desejo0] of Object.entries(a.recruta)) {
        const desejo = a.usaReserva ? Math.min(desejo0, estado.reservaMilitar || 0) : desejo0;
        const atual = estado.forcas[uid] || 0;
        const permitido = uid === 'infantaria' ? Math.max(0, Math.min(desejo, teto - atual)) : desejo;
        if (permitido > 0) entradas[uid] = permitido;
      }
      if (Object.keys(entradas).length) {
        const mud = aplicarForcas(estado.forcas, entradas);
        if (a.usaReserva) estado.reservaMilitar = Math.max(0, (estado.reservaMilitar || 0) - (entradas.infantaria || 0));
        ganhoForcas = ganhoForcas.concat(mud.map((m) => ({ id: m.id, nome: UNIDADE_POR_ID[m.id]?.nome || m.id, icone: UNIDADE_POR_ID[m.id]?.icone || '', delta: m.delta })));
      }
    }
    const major = a.major || /ogiva|conquista|guerra|golpe|nuclear|purga/.test(a.id);
    resultados.push({
      id: a.id, nome: a.nome, icone: a.icone, categoria: a.categoria,
      // custoPago (não a.custo): é o que SAIU do caixa, já com descontos de aliança
      // e indústria. A dramaturgia usa isso pra calibrar o peso da frase.
      custo: item.custoPago ?? a.custo ?? 0,
      sucesso, prob: a.prob, mudancas, ganhoForcas, alvo: a.alvo || null, relKey: a.relKey || null, major,
    });
  }
  return resultados;
}
