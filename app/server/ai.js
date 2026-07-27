// ═══════════════════════════════════════════════════════════════════════
// PROXY DE IA — a chave vive AQUI, no servidor, e nunca sai daqui
// ═══════════════════════════════════════════════════════════════════════
// O buraco de segurança que isto fecha: antes a chave OpenRouter ficava no
// localStorage do NAVEGADOR. Qualquer jogador abria o DevTools e a copiava — e no
// build público ela iria embutida no JS pra qualquer um ler. Uma chave de API num
// cliente web é dinheiro do dono na mão de estranhos.
//
// Agora o cliente NUNCA vê a chave. Ele chama /api/ai/generate DESTE servidor; o
// servidor injeta a chave (de OPENROUTER_API_KEY, variável de ambiente) e repassa
// ao OpenRouter. O navegador só recebe o texto gerado. É o mesmo padrão que todo
// app de produção usa: o segredo mora no backend.
//
// Bônus que cai no colo: como o proxy centraliza as chamadas, a telemetria de uso
// (tokens, latência, custo) agora é REAL e do servidor — não uma estimativa por
// navegador. É o que a área administrativa mostra.
import { Router } from 'express';
import { buscar, salvar, apagar } from './store.js';

const OR_BASE = 'https://openrouter.ai/api/v1';

// Configuração do servidor. O `.env` é o PISO; o painel manda por cima.
// Motivo: publicado na nuvem, trocar a chave via .env exige redeploy — e o dono
// não vai fazer deploy só pra rotacionar uma chave que vazou ou acabou o crédito.
// Pelo painel é um campo e um clique, com a chave persistida no store.
const cfg = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
  referer: process.env.PUBLIC_URL || 'http://localhost:8787',
  title: 'SOBERANO',
  fonteChave: process.env.OPENROUTER_API_KEY ? 'env' : 'nenhuma',
};

// ── CHAVE GERENCIADA PELO PAINEL ──────────────────────────────────────
// Persistida no store (arquivo em casa, Postgres na nuvem) pra sobreviver a
// restart e deploy. Nunca, em hipótese alguma, volta inteira para o navegador:
// o admin só recebe a versão mascarada (ver mascarar()).
const COL = 'config';
const ID = 'ia';

export async function carregarConfigPersistida() {
  try {
    const salva = await buscar(COL, ID);
    if (salva?.apiKey) { cfg.apiKey = salva.apiKey; cfg.fonteChave = 'painel'; }
    if (salva?.model) cfg.model = salva.model;
    return { carregou: Boolean(salva), fonte: cfg.fonteChave };
  } catch { return { carregou: false, fonte: cfg.fonteChave }; }
}

async function persistir() {
  try {
    await salvar(COL, ID, {
      apiKey: cfg.fonteChave === 'painel' ? cfg.apiKey : '',
      model: cfg.model,
      atualizadoEm: Date.now(),
    });
    return true;
  } catch { return false; }
}

// sk-or-v1-abc…wxyz — o bastante pro dono reconhecer QUAL chave está lá, e de
// menos pra alguém usá-la se espiar a tela.
function mascarar(k) {
  if (!k) return '';
  if (k.length <= 14) return `${k.slice(0, 4)}${'•'.repeat(6)}`;
  return `${k.slice(0, 10)}${'•'.repeat(8)}${k.slice(-4)}`;
}

export async function definirChave(chave) {
  const k = String(chave || '').trim();
  if (!k) return { ok: false, erro: 'Chave vazia.' };
  if (!/^sk-or-/.test(k)) {
    return { ok: false, erro: 'Isso não parece uma chave do OpenRouter (elas começam com "sk-or-").' };
  }
  cfg.apiKey = k;
  cfg.fonteChave = 'painel';
  const persistiu = await persistir();
  return { ok: true, mascarada: mascarar(k), persistiu };
}

export async function limparChave() {
  cfg.apiKey = process.env.OPENROUTER_API_KEY || '';
  cfg.fonteChave = process.env.OPENROUTER_API_KEY ? 'env' : 'nenhuma';
  try { await apagar(COL, ID); } catch { /* já não existia */ }
  await persistir();
  return { ok: true, fonte: cfg.fonteChave };
}

// Testa uma chave AVULSA sem gravá-la — pra o dono conferir antes de salvar.
export async function testarChave(chave) {
  const k = String(chave || '').trim() || cfg.apiKey;
  if (!k) return { ok: false, erro: 'Sem chave para testar.' };
  const resp = await fetch(`${OR_BASE}/key`, { headers: { Authorization: `Bearer ${k}` } });
  if (!resp.ok) return { ok: false, erro: `OpenRouter recusou a chave (${resp.status}).` };
  const d = await resp.json().catch(() => ({}));
  const info = d?.data || {};
  return {
    ok: true,
    limite: info.limit ?? null,
    usado: info.usage ?? null,
    restante: info.limit != null && info.usage != null ? Math.max(0, info.limit - info.usage) : null,
    ehGratuita: Boolean(info.is_free_tier),
  };
}

// Telemetria em memória (as últimas N chamadas). O admin lê; some no restart —
// suficiente pra um protótipo. Persistir é trocar por store.js se precisar.
const telemetria = [];
function registrar(t) {
  telemetria.unshift({ ts: Date.now(), ...t });
  if (telemetria.length > 200) telemetria.length = 200;
}

export function estadoIA() {
  const ok = telemetria.filter((x) => x.ok);
  return {
    disponivel: Boolean(cfg.apiKey),
    model: cfg.model,
    // A chave NUNCA sai daqui inteira — só o suficiente pra o dono reconhecê-la.
    chaveMascarada: mascarar(cfg.apiKey),
    fonteChave: cfg.fonteChave,   // 'painel' | 'env' | 'nenhuma'
    chamadas: telemetria.length,
    sucessos: ok.length,
    falhas: telemetria.length - ok.length,
    totalPromptTokens: ok.reduce((a, b) => a + (b.pt || 0), 0),
    totalCompletionTokens: ok.reduce((a, b) => a + (b.ct || 0), 0),
    latenciaMedia: ok.length ? Math.round(ok.reduce((a, b) => a + (b.latenciaMs || 0), 0) / ok.length) : 0,
    recentes: telemetria.slice(0, 20),
  };
}

export function definirModelo(model) {
  if (typeof model === 'string' && model.trim()) {
    cfg.model = model.trim();
    persistir();   // o modelo escolhido também sobrevive ao restart
    return true;
  }
  return false;
}

// Chamada real ao OpenRouter. Usada pelas rotas e pelo teste do admin.
// ── CACHE DE RESPOSTA (10 min) ────────────────────────────────────────
// No online, N clientes geram a MESMA manchete para o MESMO evento — o custo
// multiplicava por jogador. Aqui a segunda chamada idêntica sai de graça.
const cacheIA = new Map();          // hash → { texto, usage, model, quando }
const CACHE_TTL = 10 * 60 * 1000;
function chaveCache(system, user, temperature) {
  let h = 0x811c9dc5;
  const str = `${temperature}|${system}|${user}`;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + ':' + str.length;
}
function doCache(k) {
  const v = cacheIA.get(k);
  if (!v) return null;
  if (Date.now() - v.quando > CACHE_TTL) { cacheIA.delete(k); return null; }
  return v;
}

async function chamarOpenRouter({ system, user, temperature = 0.9, jsonMode = true, maxTokens = null, signal }) {
  if (!cfg.apiKey) {
    const e = new Error('IA não configurada no servidor (defina OPENROUTER_API_KEY).');
    e.code = 'SEM_CHAVE';
    throw e;
  }
  // CACHE: pergunta idêntica nos últimos 10 min → resposta de graça.
  const ck = chaveCache(system, user, temperature);
  const emCache = doCache(ck);
  if (emCache) return { ...emCache, cacheado: true };

  const body = {
    model: cfg.model,
    temperature,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    // TETO DE SAÍDA: sem isto, uma manchete de 12 palavras podia devolver 800 tokens
    // (e ser cobrada como tal). Cada tipo de chamada declara o quanto precisa.
    max_tokens: Math.max(32, Math.min(2000, Number(maxTokens) || 700)),
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const t0 = Date.now();
  const resp = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': cfg.referer,
      'X-Title': cfg.title,
    },
    body: JSON.stringify(body),
  });
  const latenciaMs = Date.now() - t0;

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    registrar({ model: cfg.model, ok: false, latenciaMs, erro: `${resp.status}` });
    const e = new Error(`OpenRouter ${resp.status}: ${txt.slice(0, 300)}`);
    e.status = resp.status;
    throw e;
  }
  const data = await resp.json();
  const texto = data?.choices?.[0]?.message?.content;
  const usage = data?.usage || null;
  registrar({ model: cfg.model, ok: true, latenciaMs, pt: usage?.prompt_tokens || 0, ct: usage?.completion_tokens || 0 });
  if (!texto) throw new Error('Resposta da IA veio vazia.');
  const saida = { texto, usage, latenciaMs, model: cfg.model };
  cacheIA.set(ck, { ...saida, quando: Date.now() });
  if (cacheIA.size > 400) cacheIA.delete(cacheIA.keys().next().value);   // teto de memória
  return saida;
}

export { chamarOpenRouter };

// ── RATE-LIMIT ────────────────────────────────────────────────────────
// O proxy protege a CHAVE, não o ORÇAMENTO. São coisas diferentes e só a primeira
// estava resolvida: com a chave escondida no servidor, ninguém a rouba — mas qualquer
// um com o endereço do jogo pode chamar /api/ai/generate num laço e gastar os créditos
// do dono. Numa página pública isso não é hipótese; é questão de tempo.
//
// Janela deslizante em memória, por IP. Simples de propósito: um protótipo com dezenas
// de jogadores não precisa de Redis, e uma dependência a mais no container custa mais
// do que resolve. Some no restart — e tudo bem: o teto existe pra travar abuso contínuo,
// não pra ser contabilidade.
const JANELA_MS = 60_000;
const LIMITE_MIN = Number(process.env.AI_LIMITE_POR_MINUTO || 12);   // por IP
const TETO_DIA = Number(process.env.AI_TETO_DIARIO || 600);          // global, o freio de mão
const acessos = new Map();   // ip → number[] (timestamps)
let gastoDia = { dia: null, n: 0 };

function limitar(req, res, next) {
  const agora = Date.now();

  // Freio global: o pior caso não é um jogador abusando — é o jogo viralizar num dia e
  // a fatura chegar antes da notícia. Este teto é o que o dono consegue pagar, não o que
  // o servidor aguenta.
  const hoje = new Date().toISOString().slice(0, 10);
  if (gastoDia.dia !== hoje) gastoDia = { dia: hoje, n: 0 };
  if (gastoDia.n >= TETO_DIA) {
    return res.status(429).json({
      erro: 'Teto diário de gerações atingido. O jogo continua em Modo Demonstração.',
      code: 'TETO_DIARIO',
    });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'anon';
  const lista = (acessos.get(ip) || []).filter((t) => agora - t < JANELA_MS);
  if (lista.length >= LIMITE_MIN) {
    const esperar = Math.ceil((JANELA_MS - (agora - lista[0])) / 1000);
    res.set('Retry-After', String(esperar));
    return res.status(429).json({
      erro: `Muitas gerações seguidas. Tente de novo em ${esperar}s.`,
      code: 'RATE_LIMIT',
    });
  }
  lista.push(agora);
  acessos.set(ip, lista);
  gastoDia.n += 1;

  // Higiene: sem isto o Map cresce pra sempre com IPs que passaram uma vez.
  if (acessos.size > 500) {
    for (const [k, v] of acessos) if (!v.some((t) => agora - t < JANELA_MS)) acessos.delete(k);
  }
  next();
}

export function estadoDoLimite() {
  return { limitePorMinuto: LIMITE_MIN, tetoDiario: TETO_DIA, usadoHoje: gastoDia.n, ipsAtivos: acessos.size };
}

// ── ROTAS PÚBLICAS (o cliente usa) ────────────────────────────────────
export function rotasIA() {
  const r = Router();

  // O cliente pergunta se a IA está ligada — sem NUNCA receber a chave.
  r.get('/status', (req, res) => {
    res.json({ disponivel: Boolean(cfg.apiKey), model: cfg.model });
  });

  // A geração que o jogo consome. Recebe só system+user; a chave é do servidor.
  r.post('/generate', limitar, async (req, res) => {
    const { system, user, temperature, jsonMode, maxTokens } = req.body || {};
    if (!system || !user) return res.status(400).json({ erro: 'system e user são obrigatórios.' });
    try {
      const out = await chamarOpenRouter({ system, user, temperature, jsonMode, maxTokens });
      res.json(out);
    } catch (e) {
      if (e.code === 'SEM_CHAVE') return res.status(503).json({ erro: e.message, code: 'SEM_CHAVE' });
      res.status(502).json({ erro: e.message });
    }
  });

  return r;
}

// Lista os modelos do OpenRouter (endpoint público deles; a chave ajuda mas não é obrigatória).
export async function listarModelos() {
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
  const resp = await fetch(`${OR_BASE}/models`, { headers });
  if (!resp.ok) throw new Error(`OpenRouter /models ${resp.status}`);
  const data = await resp.json();
  return data?.data || [];
}
