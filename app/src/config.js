// ═══════════════════════════════════════════════════════════════════════
// CONFIG DA IA — agora o cliente NÃO guarda chave nenhuma
// ═══════════════════════════════════════════════════════════════════════
// Antes este arquivo lia a chave do OpenRouter do localStorage e do .env do build.
// Isso era a falha de segurança: a chave chegava ao navegador. REMOVIDO.
//
// Agora o cliente só sabe uma coisa sobre a IA: se o SERVIDOR tem uma chave e está
// pronto para gerar. Ele descobre isso perguntando ao backend (/api/ai/status) no
// bootstrap, e cacheia a resposta para os pontos que checam de forma síncrona
// (a home, o badge, o loading de guerra).
//
// Quem CONFIGURA a IA (chave, modelo) é a área administrativa do servidor, atrás de
// senha — fora do alcance do jogador. É lá que essas decisões vivem agora.
import { iaStatus } from './net/api.js';

let _ligada = false;   // cache síncrono do status da IA do servidor
let _model = null;

// Chamado uma vez no início (main.js) — pergunta ao servidor e cacheia.
export async function bootstrapIA() {
  try {
    const s = await iaStatus();
    _ligada = Boolean(s?.disponivel);
    _model = s?.model || null;
  } catch {
    _ligada = false;
  }
  return _ligada;
}

// Síncrono: os renders perguntam "a IA está ligada?". Reflete o último bootstrap.
export function temChave() { return _ligada; }
export function modeloAtual() { return _model; }
