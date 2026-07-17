// ═══════════════════════════════════════════════════════════════════════
// SERVIDOR SOBERANO — um processo, tudo dentro: jogo + IA + admin + online
// ═══════════════════════════════════════════════════════════════════════
// O que este processo faz, em ordem de importância:
//   1. Serve o jogo (o build estático do Vite em dist/).
//   2. Proxia a IA com a chave escondida no servidor  (/api/ai/*).
//   3. Hospeda a área administrativa atrás de senha    (/admin, /api/admin/*).
//   4. Guarda perfis e saves na nuvem                  (/api/profile, /api/save).
//   5. Abre o lobby WebSocket do multiplayer           (/ws).
//
// Um único `node server/index.js` sobe tudo. É o que torna o deploy trivial:
// não há microsserviço, fila, nem orquestração — um container, uma porta.
import './env.js';   // PRIMEIRO de tudo: carrega o .env antes de qualquer módulo ler process.env
import express from 'express';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { rotasIA, carregarConfigPersistida, estadoIA } from './ai.js';
import { estadoDoStore } from './store.js';
import { rotasAdmin, paginaAdmin } from './admin.js';
import { rotasSaves } from './saves.js';
import { montarLobby } from './lobby.js';

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));  // app/
const DIST = join(RAIZ, 'dist');
const PORTA = Number(process.env.PORT || 8787);

const app = express();
app.use(express.json({ limit: '2.5mb' }));

// ── SAÚDE (pro balanceador/host saber que está de pé) ────────────────
// O health check do Render bate aqui. Ele também diz ONDE os dados estão morando: num
// deploy, "o save sumiu" quase sempre é "o DATABASE_URL não chegou, o store caiu no
// arquivo do container, e o container é efêmero". Melhor descobrir por um GET do que
// por um jogador reclamando.
app.get('/api/health', (req, res) => res.json({
  ok: true, uptime: process.uptime(), store: estadoDoStore(),
}));

// ── API ──────────────────────────────────────────────────────────────
app.use('/api/ai', rotasIA());
app.use('/api/admin', rotasAdmin());
app.use('/api', rotasSaves());

// ── ADMIN (página separada, fora do bundle do jogo) ──────────────────
app.get('/admin', (req, res) => res.type('html').send(paginaAdmin()));

// ── O JOGO (build estático) ──────────────────────────────────────────
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  // SPA fallback: qualquer rota não-API devolve o index (o roteamento é no cliente).
  // Express 5 não aceita '*' — regex casa tudo que não começa com /api ou /admin.
  app.get(/^\/(?!api|admin|ws).*/, (req, res) => res.sendFile(join(DIST, 'index.html')));
} else {
  app.get('/', (req, res) => res.type('html').send(
    '<h1>SOBERANO</h1><p>Build não encontrado. Rode <code>npm run build</code> antes de <code>npm start</code>.</p>'
    + '<p>Para desenvolvimento use <code>npm run dev</code> (Vite na 5173) — este servidor cuida da API na 8787.</p>',
  ));
}

// ── SOBE HTTP + WEBSOCKET no MESMO servidor (uma porta só) ───────────
const server = createServer(app);
const lobby = montarLobby(server);

server.listen(PORTA, async () => {
  // A chave cadastrada pelo painel tem precedência sobre o .env e precisa ser
  // carregada ANTES de anunciar o estado — senão o log mente dizendo "modo demo"
  // num servidor que tem chave salva.
  const cfgIA = await carregarConfigPersistida();
  const chave = estadoIA().disponivel
    ? `IA ligada (chave ${cfgIA.fonte === 'painel' ? 'do painel' : 'do .env'})`
    : 'IA SEM CHAVE (modo demo) — cadastre em /admin';
  const senha = process.env.ADMIN_PASSWORD ? 'admin protegido' : 'ADMIN SEM SENHA (defina ADMIN_PASSWORD)';
  // eslint-disable-next-line no-console
  console.log(`\n  SOBERANO no ar → http://localhost:${PORTA}`);
  // eslint-disable-next-line no-console
  console.log(`  ${chave} · ${senha} · lobby /ws pronto\n`);
});

// Encerramento limpo (o host manda SIGTERM ao reiniciar/escalar).
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { server.close(() => process.exit(0)); });
}

export { app, lobby };
