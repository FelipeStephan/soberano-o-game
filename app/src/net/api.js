// ═══════════════════════════════════════════════════════════════════════
// CLIENTE DE REDE — a única ponte entre o jogo e o backend
// ═══════════════════════════════════════════════════════════════════════
// Todo contato do cliente com o servidor passa por aqui. Centralizar tem uma razão
// concreta: o jogo precisa rodar em DOIS cenários sem mudar de código —
//   • produção: servido pelo próprio backend (mesma origem, /api/* funciona);
//   • dev com Vite (porta 5173): o backend está noutra porta (8787).
// A base resolve isso sozinha, e o resto do jogo nunca precisa saber onde o
// servidor está.
//
// E o princípio que mantém o jogo jogável mesmo offline: NADA aqui pode DERRUBAR
// o jogo se falhar. Sem servidor, `apiDisponivel` vira false e o jogo cai no modo
// local (IA demo + save em localStorage). Rede é melhoria, não requisito.

// SEMPRE caminho relativo — em dev o Vite proxya /api e /ws pra 8787 (vite.config.js).
// Antes isto apontava pra http://localhost:8787 quando a porta era 5173, o que fazia
// dev ser cross-origin (CORS) enquanto produção era same-origin. Duas realidades
// diferentes = bug que só aparece num dos dois. Agora é um caminho só.
const BASE = '';

let _online = null;   // cache do health check (null = ainda não checado)

async function req(caminho, opts = {}) {
  let resp;
  try {
    resp = await fetch(BASE + caminho, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...opts,
    });
  } catch (e) {
    // O backend não respondeu (não está de pé, DNS, offline). Isto é DIFERENTE de
    // "respondeu dizendo não" — e a diferença importa: quem chama precisa saber que
    // o problema é o servidor ausente, não a IA desconfigurada. Sem este código, o
    // erro chegava como TypeError anônimo e o jogo o tratava como falha genérica.
    if (e?.name === 'AbortError') throw e;      // cancelamento é intenção, não falha
    const err = new Error('Servidor do SOBERANO inacessível.');
    err.code = 'OFFLINE';
    throw err;
  }
  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({}));
    const e = new Error(erro.erro || `HTTP ${resp.status}`);
    e.status = resp.status;
    e.code = erro.code;
    throw e;
  }
  return resp.json();
}

// O backend está de pé? Cacheado — checa uma vez por sessão.
export async function apiDisponivel() {
  if (_online !== null) return _online;
  try {
    await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2500) });
    _online = true;
  } catch { _online = false; }
  return _online;
}

// ── IA ─────────────────────────────────────────────────────────────────
export async function iaStatus() {
  try { return await req('/api/ai/status'); }
  catch { return { disponivel: false, model: null }; }
}

export async function iaGerar({ system, user, temperature, jsonMode, signal }) {
  return req('/api/ai/generate', {
    method: 'POST', signal,
    body: JSON.stringify({ system, user, temperature, jsonMode }),
  });
}

// ── PERFIL + SAVE NA NUVEM ───────────────────────────────────────────
export async function sincronizarPerfil(perfil) {
  try { return await req(`/api/profile/${perfil.id}`, { method: 'PUT', body: JSON.stringify({ nome: perfil.nome }) }); }
  catch { return null; }
}

export async function salvarNaNuvem(perfilId, save) {
  try { return await req(`/api/save/${perfilId}`, { method: 'PUT', body: JSON.stringify({ save }) }); }
  catch { return null; }   // silencioso: o save local já garantiu a partida
}

export async function carregarDaNuvem(perfilId) {
  try { return await req(`/api/save/${perfilId}`); }
  catch { return null; }
}

export async function placar() {
  try { return await req('/api/placar'); }
  catch { return []; }
}

export { BASE };
