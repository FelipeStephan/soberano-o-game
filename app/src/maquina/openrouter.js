// ═══════════════════════════════════════════════════════════════════════
// O ÚNICO PONTO QUE FALA COM A IA — agora via PROXY do servidor
// ═══════════════════════════════════════════════════════════════════════
// MUDANÇA ESTRUTURAL DE SEGURANÇA: antes este arquivo chamava o OpenRouter direto,
// com a chave lida do localStorage do navegador. Isso expunha a chave a qualquer
// jogador (DevTools) e ao build público. Agora ele chama /api/ai/generate DO NOSSO
// SERVIDOR, que guarda a chave e repassa. O navegador nunca mais toca no segredo.
//
// A interface `chamarIA` continua idêntica pra quem consome (gerador, despachos):
// a troca de "chama OpenRouter" pra "chama nosso proxy" ficou contida aqui, que era
// exatamente o motivo de todo o código de IA viver isolado em maquina/.
import { iaGerar, iaStatus } from '../net/api.js';
import { registrar } from './telemetria.js';

export class SemChaveError extends Error {
  constructor() { super('IA indisponível — rodando em Modo Demonstração.'); this.name = 'SemChaveError'; }
}

// O servidor não respondeu. Erro DIFERENTE de SemChave, e a distinção não é
// preciosismo: "sem chave" se resolve no /admin, "offline" se resolve subindo o
// backend. Antes os dois casos viravam a mesma queda muda pro fallback, e o jogador
// (e eu) ficava sem saber qual dos dois mundos estava vivendo.
export class IAOfflineError extends Error {
  constructor() { super('Servidor de IA fora do ar — o backend não respondeu.'); this.name = 'IAOfflineError'; }
}

// O servidor recusou POR LIMITE (rate-limit ou teto diário de custo). Insistir é o
// oposto do que se deve fazer: a segunda tentativa bate no mesmo muro e ainda gasta
// tempo do jogador esperando. Erro próprio pra o gerador cair na reserva na hora.
export class LimiteError extends Error {
  constructor(msg) { super(msg || 'Limite de gerações atingido.'); this.name = 'LimiteError'; }
}

// Chamada de geração. Retorna { texto, usage, latenciaMs, model }.
// A chave é do servidor; aqui só mandamos o prompt.
// `maxTokens` é o TETO DE SAÍDA — quem chama declara o quanto precisa. Sem ele o
// modelo pode devolver (e cobrar) 800 tokens numa manchete de 12 palavras.
export async function chamarIA({ system, user, temperature = 0.9, jsonMode = true, maxTokens = 700, signal }) {
  const t0 = performance.now();
  try {
    const out = await iaGerar({ system, user, temperature, jsonMode, maxTokens, signal });
    registrar({ model: out.model, ok: true, latenciaMs: out.latenciaMs || Math.round(performance.now() - t0),
      pt: out.usage?.prompt_tokens || 0, ct: out.usage?.completion_tokens || 0 });
    return out;
  } catch (err) {
    // Servidor sem chave → cai no modo demo, como sempre fez.
    if (err.code === 'SEM_CHAVE' || err.status === 503) throw new SemChaveError();
    // Servidor ausente → erro próprio, para o gerador não confundir com falha da IA
    // e para o jogador ver "backend fora" em vez de silêncio.
    if (err.code === 'OFFLINE') {
      registrar({ model: '?', ok: false, latenciaMs: Math.round(performance.now() - t0), erro: 'backend offline' });
      throw new IAOfflineError();
    }
    if (err.status === 429 || err.code === 'RATE_LIMIT' || err.code === 'TETO_DIARIO') {
      registrar({ model: '?', ok: false, latenciaMs: Math.round(performance.now() - t0), erro: 'limite' });
      throw new LimiteError(err.message);
    }
    registrar({ model: '?', ok: false, latenciaMs: Math.round(performance.now() - t0), erro: err.message });
    throw err;
  }
}

// Pergunta ao servidor se a IA está ligada (sem receber a chave).
export async function iaLigada() {
  const s = await iaStatus();
  return Boolean(s?.disponivel);
}
