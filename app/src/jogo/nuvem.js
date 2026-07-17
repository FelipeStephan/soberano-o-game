// ═══════════════════════════════════════════════════════════════════════
// SINCRONIZAÇÃO COM A NUVEM — a partida deixa de morrer com o navegador
// ═══════════════════════════════════════════════════════════════════════
// A ponte entre o save LOCAL (jogo/save.js, localStorage) e o save na NUVEM (o
// backend). A regra de ouro: o local nunca deixa de funcionar. A nuvem é uma
// segunda cópia e um passo rumo ao multiplayer — se o servidor cair, o jogo segue
// salvando localmente como sempre.
//
// Fluxo:
//   • no boot, registra o perfil no servidor (id estável que o cliente já tinha);
//   • a cada autosave, empurra o save pra nuvem em segundo plano (fire-and-forget);
//   • se a nuvem tem um save MAIS NOVO que o local (ex.: você jogou noutra máquina),
//     ele desce e vira o "Continuar" — sem sobrescrever nada à força.
import { carregarPerfil as perfilLocal } from './save.js';
import { salvarPartida as salvarLocal, carregarPartida as carregarLocal } from './save.js';
import { apiDisponivel, sincronizarPerfil, salvarNaNuvem, carregarDaNuvem } from '../net/api.js';

let _perfil = null;
let _online = false;

// Boot: garante o perfil (local sempre; nuvem se der).
export async function carregarPerfil() {
  _perfil = perfilLocal();                 // id estável, criado localmente
  _online = await apiDisponivel();
  if (_online) await sincronizarPerfil(_perfil);
  return _perfil;
}

// Chamado depois do boot: se a nuvem tem save mais novo, traz pro local.
export async function sincronizarNuvem() {
  if (!_online || !_perfil) return;
  const nuvem = await carregarDaNuvem(_perfil.id);
  if (!nuvem) return;
  const local = carregarLocal();
  const tNuvem = Date.parse(nuvem.salvoEm || 0) || 0;
  const tLocal = Date.parse(local?.salvoEm || 0) || 0;
  // A nuvem só vence se for ESTRITAMENTE mais nova — nunca apaga progresso local.
  if (tNuvem > tLocal) {
    try { localStorage.setItem('soberano_save_v1', JSON.stringify(nuvem)); } catch { /* cota */ }
  }
}

// Empurra um save pra nuvem sem travar o jogo (o local já foi gravado).
export function empurrarParaNuvem(save) {
  if (!_online || !_perfil) return;
  salvarNaNuvem(_perfil.id, save);   // fire-and-forget: falha não afeta a partida
}

export function perfilAtual() { return _perfil; }
export function estaOnline() { return _online; }
