// ═══════════════════════════════════════════════════════════════════════
// PONTE PARA A FILA DE COMANDO — desacopla telas de compra do tempo real
// ═══════════════════════════════════════════════════════════════════════
// O problema que isto resolve: a ficha de equipamento e o mercado precisam
// ENFILEIRAR ações sintéticas (encomendas com tempo de produção/entrega) na
// fila de comando do modo tempo real — mas não têm como receber o controlador
// `tr` sem furar a arquitetura (ui/jogo.js e ui/tempoReal.js são donos dele).
//
// A solução é um registro global mínimo: o tempo real, ao nascer, registra
// aqui a sua função `enfileirar`; qualquer tela chama `enfileirarNaFila`.
// Se NINGUÉM registrou (modo antigo, testes), `filaRegistrada()` devolve
// false e as telas caem no comportamento instantâneo de sempre — nada quebra.
let _enfileirar = null;

export function registrarFila(fn) { _enfileirar = typeof fn === 'function' ? fn : null; }

export function filaRegistrada() { return typeof _enfileirar === 'function'; }

// Devolve o mesmo contrato de tempoReal.enfileirar: { ok, motivo? }.
export function enfileirarNaFila(acao) {
  if (!_enfileirar) return { ok: false, motivo: 'Fila de comando indisponível.' };
  const r = _enfileirar(acao);
  return r && typeof r === 'object' ? r : { ok: true };
}
