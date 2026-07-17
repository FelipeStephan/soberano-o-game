// SISTEMA DE DESBLOQUEIO. Ações com `desbloqueio` ficam travadas até a condição bater.
// Quando uma trava cai, vira surpresa (popup). Ações travadas aparecem com dica.
//
// Formato do campo `desbloqueio` (em dados/acoes.js):
//   { capacidade_ind: '>=70', inteligencia: '>=50' }   → atributos (via cumpreRequisito)
//   { _acao: 'espionar' }                              → já EXECUTOU espionar com sucesso 1x
//   { _acao: { id: 'espionar', vezes: 3 } }            → executou 3x com sucesso
// `_acao` lê estado.acoesFeitas (mapa id → nº de execuções bem-sucedidas). Se o estado
// ainda não registra acoesFeitas, a condição _acao simplesmente não bate — ninguém
// precisa preencher nada hoje pra nada quebrar (nenhuma ação usa _acao por enquanto).
import { ACOES } from '../dados/acoes.js';
import { cumpreRequisito } from '../maquina/validador.js';

// Condição por AÇÃO EXECUTADA: `_acao` dentro de `desbloqueio`.
function cumpreAcaoFeita(cond, estado) {
  if (!cond) return true;
  const alvo = typeof cond === 'string' ? { id: cond, vezes: 1 } : cond;
  const feitas = estado?.acoesFeitas || {};
  return (feitas[alvo.id] || 0) >= (alvo.vezes || 1);
}

export function estaDesbloqueada(acao, estado) {
  if (!acao.desbloqueio) return true;
  const { _acao, ...atributos } = acao.desbloqueio;
  if (!cumpreAcaoFeita(_acao, estado)) return false;
  return Object.keys(atributos).length === 0 || cumpreRequisito(atributos, estado);
}

// Conjunto de ids desbloqueados no estado atual.
export function idsDesbloqueados(estado) {
  return new Set(ACOES.filter((a) => estaDesbloqueada(a, estado)).map((a) => a.id));
}

// Ações que passaram de travadas → desbloqueadas entre dois conjuntos.
export function novasDesbloqueadas(antes, depois) {
  return ACOES.filter((a) => a.desbloqueio && !antes.has(a.id) && depois.has(a.id));
}
