// ═══════════════════════════════════════════════════════════════════════
// ÁREA ADMINISTRATIVA — página separada, atrás de senha, FORA do jogo
// ═══════════════════════════════════════════════════════════════════════
// O problema que o dono apontou: a config de IA era um #admin acessível por
// qualquer jogador, dentro do bundle do jogo. Errado por dois motivos:
//   1. estava no código que TODO jogador baixa (bastava saber a rota);
//   2. deixava o jogador mexer no que é do dono (modelo, chave, custo).
//
// A correção estrutural: o admin agora é uma página HTML servida SÓ por este
// servidor, em /admin, atrás de LOGIN por senha (ADMIN_PASSWORD). Não está no
// bundle do jogo — o cliente do jogador nem sabe que ela existe. Quem abre /admin
// sem sessão vê só a tela de senha.
//
// Autenticação: senha → token de sessão (em memória, expira em 12h) → cookie
// httpOnly. Simples e suficiente pra um painel de dono único. Não é multiusuário
// nem quer ser: é a sala de máquinas, não um produto.
import { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  estadoIA, definirModelo, listarModelos, chamarOpenRouter,
  definirChave, limparChave, testarChave,
} from './ai.js';

const SENHA = process.env.ADMIN_PASSWORD || '';
const sessoes = new Map();        // token → expiraEm
const DOZE_HORAS = 12 * 60 * 60 * 1000;

function novoToken() {
  const t = randomBytes(24).toString('hex');
  sessoes.set(t, Date.now() + DOZE_HORAS);
  return t;
}
function tokenValido(t) {
  const exp = sessoes.get(t);
  if (!exp) return false;
  if (Date.now() > exp) { sessoes.delete(t); return false; }
  return true;
}
// Comparação em tempo constante — senha curta não vaza por timing de resposta.
function senhaConfere(tentativa) {
  if (!SENHA) return false;
  const a = Buffer.from(String(tentativa));
  const b = Buffer.from(SENHA);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
function lerCookie(req, nome) {
  const raw = req.headers.cookie || '';
  const m = raw.match(new RegExp(`(?:^|; )${nome}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// Gate: exige sessão válida. Usado nas rotas de API do admin.
function exigirSessao(req, res, next) {
  const t = lerCookie(req, 'sob_admin');
  if (tokenValido(t)) return next();
  res.status(401).json({ erro: 'não autenticado' });
}

export function rotasAdmin() {
  const r = Router();

  // ── LOGIN ────────────────────────────────────────────────────────────
  r.post('/login', (req, res) => {
    if (!SENHA) return res.status(503).json({ erro: 'ADMIN_PASSWORD não configurada no servidor.' });
    if (!senhaConfere(req.body?.senha)) return res.status(401).json({ erro: 'senha incorreta' });
    const t = novoToken();
    res.setHeader('Set-Cookie', `sob_admin=${t}; HttpOnly; Path=/; Max-Age=${DOZE_HORAS / 1000}; SameSite=Strict`);
    res.json({ ok: true });
  });

  r.post('/logout', (req, res) => {
    const t = lerCookie(req, 'sob_admin');
    if (t) sessoes.delete(t);
    res.setHeader('Set-Cookie', 'sob_admin=; HttpOnly; Path=/; Max-Age=0');
    res.json({ ok: true });
  });

  // Estado da sessão (a página pergunta se já está logada).
  r.get('/sessao', (req, res) => {
    res.json({ autenticado: tokenValido(lerCookie(req, 'sob_admin')), senhaDefinida: Boolean(SENHA) });
  });

  // ── DADOS (protegidos) ───────────────────────────────────────────────
  r.get('/estado', exigirSessao, (req, res) => res.json(estadoIA()));

  r.get('/modelos', exigirSessao, async (req, res) => {
    try {
      const ms = await listarModelos();
      res.json(ms.map((m) => ({ id: m.id, nome: m.name, ctx: m.context_length, preco: m.pricing })));
    } catch (e) { res.status(502).json({ erro: e.message }); }
  });

  r.post('/modelo', exigirSessao, (req, res) => {
    if (definirModelo(req.body?.model)) return res.json({ ok: true, model: req.body.model });
    res.status(400).json({ erro: 'model inválido' });
  });

  // ── CHAVE DA IA ──────────────────────────────────────────────────────
  // Cadastrar/trocar/remover a chave pela web, sem redeploy. A chave ENTRA por
  // aqui e nunca mais sai: as respostas devolvem só a versão mascarada.
  r.post('/chave', exigirSessao, async (req, res) => {
    const out = await definirChave(req.body?.chave);
    if (!out.ok) return res.status(400).json(out);
    res.json(out);
  });

  r.delete('/chave', exigirSessao, async (req, res) => {
    res.json(await limparChave());
  });

  // Confere uma chave (a enviada, ou a que já está ativa) contra o OpenRouter e
  // devolve crédito restante — sem gravar nada.
  r.post('/chave/testar', exigirSessao, async (req, res) => {
    try {
      const out = await testarChave(req.body?.chave);
      res.status(out.ok ? 200 : 400).json(out);
    } catch (e) { res.status(502).json({ ok: false, erro: e.message }); }
  });

  // Teste de ponta a ponta: uma geração real, pra o dono confirmar que a IA responde.
  r.post('/testar', exigirSessao, async (req, res) => {
    try {
      const out = await chamarOpenRouter({
        system: 'Você é um teste. Responda SÓ com JSON: {"ok": true, "mensagem": "<frase curta em português>"}.',
        user: 'Confirme que você está funcionando para o jogo SOBERANO.',
        temperature: 0.3,
      });
      res.json({ ok: true, ...out });
    } catch (e) {
      res.status(502).json({ ok: false, erro: e.message });
    }
  });

  return r;
}

// ── A PÁGINA (HTML server-rendered, zero dependência do bundle do jogo) ──
// Servida em /admin. Se não há sessão, o JS da própria página mostra o login.
export function paginaAdmin() {
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>SOBERANO · Administração</title>
<style>
  :root { --bg:#05070d; --painel:#0c1524; --borda:#1c3350; --cyan:#35e0ff; --ambar:#ffb020;
    --verde:#22e0a0; --perigo:#ff3b5c; --texto:#dfe8ff; --fraco:#7488ad; }
  * { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--texto);
    font-family:system-ui,sans-serif; min-height:100vh; }
  body::before { content:''; position:fixed; inset:0;
    background:radial-gradient(1000px 600px at 70% -10%,#10233f,transparent 60%); pointer-events:none; }
  .wrap { max-width:960px; margin:0 auto; padding:28px 20px 60px; position:relative; }
  h1 { font-size:22px; letter-spacing:.14em; margin:0 0 2px; }
  h1 b { color:var(--cyan); }
  .tag { font-family:ui-monospace,monospace; font-size:10px; letter-spacing:.2em; color:var(--ambar);
    border:1px solid var(--ambar); border-radius:20px; padding:2px 9px; }
  .top { display:flex; align-items:center; gap:14px; margin-bottom:24px; }
  .card { background:var(--painel); border:1px solid var(--borda); border-radius:12px;
    padding:18px 20px; margin-bottom:16px; }
  .card h2 { font-size:14px; letter-spacing:.08em; text-transform:uppercase; color:var(--cyan); margin:0 0 12px; }
  label { display:block; font-size:11px; color:var(--fraco); text-transform:uppercase; letter-spacing:.08em; margin:10px 0 5px; }
  input { width:100%; padding:10px 12px; background:#060d18; border:1px solid var(--borda);
    border-radius:7px; color:var(--texto); font-family:ui-monospace,monospace; font-size:13px; }
  input:focus { outline:none; border-color:var(--cyan); }
  button { padding:9px 15px; border-radius:7px; border:1px solid var(--borda); background:#0e1b2e;
    color:var(--texto); font-weight:600; cursor:pointer; font-size:13px; }
  button.primario { background:linear-gradient(120deg,var(--cyan),#0fa8cc); color:#041018; border:none; }
  button:hover { border-color:var(--cyan); }
  .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:8px; }
  .grade { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; }
  .kpi { background:#0a1626; border:1px solid var(--borda); border-radius:8px; padding:12px; text-align:center; }
  .kpi span { display:block; font-family:ui-monospace,monospace; font-size:9px; color:var(--fraco); text-transform:uppercase; }
  .kpi b { font-family:ui-monospace,monospace; font-size:20px; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--fraco); }
  .dot.on { background:var(--verde); box-shadow:0 0 10px var(--verde); }
  .dot.off { background:var(--perigo); }
  .modelos { max-height:260px; overflow:auto; margin-top:10px; display:grid; gap:4px; }
  .modelo { display:flex; justify-content:space-between; gap:8px; padding:8px 10px; background:#0a1626;
    border:1px solid var(--borda); border-radius:6px; cursor:pointer; font-size:12px; }
  .modelo:hover { border-color:var(--cyan); }
  .modelo small { color:var(--fraco); font-family:ui-monospace,monospace; }
  .msg { font-size:12px; padding:9px 11px; border-radius:7px; margin-top:10px; line-height:1.5; }
  .msg.ok { background:rgba(34,224,160,.1); border:1px solid var(--verde); color:#a8f0d4; }
  .msg.erro { background:rgba(255,59,92,.1); border:1px solid var(--perigo); color:#ffb3c0; }
  .login { max-width:380px; margin:14vh auto 0; }
  .oculto { display:none; }
  .dica { font-size:11px; color:var(--fraco); line-height:1.6; margin:8px 0 0; }
  code { background:#0a1626; padding:1px 6px; border-radius:4px; color:var(--ambar); font-size:11px; }
</style></head>
<body><div class="wrap">
  <div class="top"><h1><b>SOBERANO</b> · ADMINISTRAÇÃO</h1><span class="tag">ÁREA RESTRITA</span></div>

  <div id="login" class="login card oculto">
    <h2>Acesso do administrador</h2>
    <label>Senha</label>
    <input id="senha" type="password" placeholder="senha do painel" autocomplete="current-password">
    <div class="row"><button class="primario" id="entrar">Entrar</button></div>
    <div id="login-msg"></div>
    <p class="dica">Defina a senha na variável de ambiente <code>ADMIN_PASSWORD</code> do servidor.</p>
  </div>

  <div id="painel" class="oculto">
    <div class="card">
      <h2>Estado da IA</h2>
      <div class="row" style="margin-bottom:12px"><span id="ia-dot" class="dot"></span> <span id="ia-status">verificando…</span></div>
      <div class="grade" id="kpis"></div>
    </div>

    <div class="card">
      <h2>Chave do OpenRouter</h2>
      <div class="row" style="margin-bottom:10px">
        Chave ativa: <b id="chave-atual" style="font-family:ui-monospace,monospace;color:var(--ambar)">—</b>
        <span id="chave-fonte" class="tag" style="border-color:var(--fraco);color:var(--fraco)">—</span>
      </div>
      <label>Colar nova chave</label>
      <input id="chave" type="password" placeholder="sk-or-v1-..." autocomplete="off" spellcheck="false">
      <div class="row">
        <button class="primario" id="salvar-chave">Salvar chave</button>
        <button id="testar-chave">Testar sem salvar</button>
        <button id="remover-chave" style="margin-left:auto">Remover</button>
      </div>
      <div id="chave-msg"></div>
      <p class="dica">A chave é gravada no servidor e sobrevive a reinício e deploy — não precisa mexer no <code>.env</code> nem publicar de novo. Ela nunca é enviada ao navegador do jogador (nem a esta tela: você só vê a versão mascarada). Pegue a sua em <code>openrouter.ai/keys</code>.</p>
    </div>

    <div class="card">
      <h2>Modelo</h2>
      <div class="row">Modelo atual: <b id="modelo-atual" style="font-family:ui-monospace,monospace;color:var(--ambar)">—</b></div>
      <div class="row"><button id="carregar">Carregar biblioteca OpenRouter</button>
        <input id="filtro" placeholder="filtrar (claude, gpt, gemini, free…)" style="flex:1"></div>
      <div class="modelos" id="modelos"></div>
      <label>Ou defina o ID manualmente</label>
      <div class="row"><input id="modelo-manual" placeholder="anthropic/claude-3.5-sonnet" style="flex:1">
        <button id="definir">Definir</button></div>
      <div id="modelo-msg"></div>
    </div>

    <div class="card">
      <h2>Testar a IA</h2>
      <p class="dica">Roda uma geração real de ponta a ponta usando a chave do servidor.</p>
      <button class="primario" id="testar">Rodar teste</button>
      <div id="teste-msg"></div>
    </div>

    <div class="row"><button id="sair">Sair</button>
      <a href="/" style="margin-left:auto;color:var(--fraco);font-size:12px;text-decoration:none">▸ ir ao jogo</a></div>
  </div>
</div>
<script>
const $ = (s) => document.querySelector(s);
const api = (p, opt) => fetch('/api/admin' + p, { credentials:'same-origin', headers:{'Content-Type':'application/json'}, ...opt }).then(r => r.json().then(j => ({ status:r.status, j })));
let MODELOS = [];

async function boot() {
  const { j } = await api('/sessao');
  if (j.autenticado) mostrarPainel(); else mostrarLogin(j.senhaDefinida);
}
function mostrarLogin(temSenha) {
  $('#login').classList.remove('oculto'); $('#painel').classList.add('oculto');
  if (!temSenha) $('#login-msg').innerHTML = '<div class="msg erro">Servidor sem ADMIN_PASSWORD — configure e reinicie.</div>';
}
function mostrarPainel() {
  $('#login').classList.add('oculto'); $('#painel').classList.remove('oculto');
  carregarEstado();
}
const FONTE_ROT = { painel: 'salva pelo painel', env: 'vinda do .env', nenhuma: 'nenhuma' };
async function carregarEstado() {
  const { j } = await api('/estado');
  $('#ia-dot').className = 'dot ' + (j.disponivel ? 'on' : 'off');
  $('#ia-status').textContent = j.disponivel ? 'IA conectada e pronta' : 'IA SEM CHAVE — cadastre a chave do OpenRouter abaixo';
  $('#chave-atual').textContent = j.chaveMascarada || 'nenhuma cadastrada';
  $('#chave-fonte').textContent = FONTE_ROT[j.fonteChave] || j.fonteChave || '—';
  $('#modelo-atual').textContent = j.model;
  $('#kpis').innerHTML = [
    ['Chamadas', j.chamadas], ['Sucessos', j.sucessos], ['Falhas', j.falhas],
    ['Tokens entrada', j.totalPromptTokens], ['Tokens saída', j.totalCompletionTokens], ['Latência média', j.latenciaMedia + 'ms'],
  ].map(([k,v]) => '<div class="kpi"><span>'+k+'</span><b>'+v+'</b></div>').join('');
}

$('#entrar').onclick = async () => {
  const { status } = await api('/login', { method:'POST', body: JSON.stringify({ senha: $('#senha').value }) });
  if (status === 200) mostrarPainel();
  else $('#login-msg').innerHTML = '<div class="msg erro">Senha incorreta.</div>';
};
$('#senha').onkeydown = (e) => { if (e.key === 'Enter') $('#entrar').click(); };
$('#sair').onclick = async () => { await api('/logout', { method:'POST' }); location.reload(); };

// ── CHAVE ─────────────────────────────────────────────────────────────
const msgChave = (cls, txt) => { $('#chave-msg').innerHTML = '<div class="msg '+cls+'">'+txt+'</div>'; };
const creditoTxt = (j) => {
  if (j.restante != null) return ' Crédito restante: <b>US$ '+Number(j.restante).toFixed(2)+'</b>.';
  if (j.ehGratuita) return ' Conta no plano gratuito.';
  return ' Sem limite declarado (crédito pré-pago).';
};
$('#salvar-chave').onclick = async () => {
  const chave = $('#chave').value.trim();
  if (!chave) return msgChave('erro', 'Cole a chave antes de salvar.');
  msgChave('ok', 'Salvando…');
  const { status, j } = await api('/chave', { method:'POST', body: JSON.stringify({ chave }) });
  if (status !== 200) return msgChave('erro', j.erro || 'Falhou.');
  $('#chave').value = '';
  msgChave('ok', 'Chave salva: <b>'+j.mascarada+'</b>.' + (j.persistiu ? ' Vai sobreviver a reinício e deploy.' : ' <b>Atenção:</b> não consegui persistir — ela vale só até o servidor reiniciar.'));
  carregarEstado();
};
$('#testar-chave').onclick = async () => {
  msgChave('ok', 'Consultando o OpenRouter…');
  const { j } = await api('/chave/testar', { method:'POST', body: JSON.stringify({ chave: $('#chave').value.trim() }) });
  msgChave(j.ok ? 'ok' : 'erro', j.ok ? 'Chave válida.' + creditoTxt(j) : (j.erro || 'Chave recusada.'));
};
$('#remover-chave').onclick = async () => {
  const { j } = await api('/chave', { method:'DELETE' });
  msgChave('ok', j.fonte === 'env' ? 'Chave do painel removida — voltou a valer a do .env.' : 'Chave removida. O jogo volta ao Modo Demonstração.');
  carregarEstado();
};
$('#chave').onkeydown = (e) => { if (e.key === 'Enter') $('#salvar-chave').click(); };

$('#carregar').onclick = async () => {
  $('#modelos').innerHTML = '<div class="dica">carregando…</div>';
  const { j } = await api('/modelos');
  MODELOS = Array.isArray(j) ? j : [];
  render();
};
$('#filtro').oninput = render;
function render() {
  const f = $('#filtro').value.toLowerCase();
  $('#modelos').innerHTML = MODELOS.filter(m => !f || m.id.toLowerCase().includes(f) || (m.nome||'').toLowerCase().includes(f))
    .slice(0, 60).map(m => '<div class="modelo" data-id="'+m.id+'"><span>'+m.id+'</span><small>'+(m.ctx?(m.ctx/1000|0)+'k ctx':'')+'</small></div>').join('');
  document.querySelectorAll('.modelo').forEach(el => el.onclick = () => definir(el.dataset.id));
}
async function definir(id) {
  const { status } = await api('/modelo', { method:'POST', body: JSON.stringify({ model:id }) });
  if (status === 200) { $('#modelo-msg').innerHTML = '<div class="msg ok">Modelo definido: '+id+'</div>'; carregarEstado(); }
}
$('#definir').onclick = () => definir($('#modelo-manual').value);
$('#testar').onclick = async () => {
  $('#teste-msg').innerHTML = '<div class="dica">rodando…</div>';
  const { j } = await api('/testar', { method:'POST', body:'{}' });
  $('#teste-msg').innerHTML = j.ok
    ? '<div class="msg ok">OK · '+(j.latenciaMs||0)+'ms · '+(j.model||'')+'<br>'+(j.texto||'').slice(0,200)+'</div>'
    : '<div class="msg erro">'+(j.erro||'falhou')+'</div>';
  carregarEstado();
};
boot();
</script>
</body></html>`;
}
