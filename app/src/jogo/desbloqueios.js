// SISTEMA DE DESBLOQUEIO. Ações com `desbloqueio` ficam travadas até a condição bater.
// Quando uma trava cai, vira surpresa (popup). Ações travadas aparecem com dica.
import { ACOES } from '../dados/acoes.js';
import { cumpreRequisito } from '../maquina/validador.js';

export function estaDesbloqueada(acao, estado) {
  return !acao.desbloqueio || cumpreRequisito(acao.desbloqueio, estado);
}

// Conjunto de ids desbloqueados no estado atual.
export function idsDesbloqueados(estado) {
  return new Set(ACOES.filter((a) => estaDesbloqueada(a, estado)).map((a) => a.id));
}

// Ações que passaram de travadas → desbloqueadas entre dois conjuntos.
export function novasDesbloqueadas(antes, depois) {
  return ACOES.filter((a) => a.desbloqueio && !antes.has(a.id) && depois.has(a.id));
}
