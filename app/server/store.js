// ═══════════════════════════════════════════════════════════════════════
// STORE — persistência trocável: arquivo JSON em casa, Postgres na nuvem
// ═══════════════════════════════════════════════════════════════════════
// A aposta que este arquivo fez na 24ª leva acabou de ser cobrada e paga: "TODO acesso
// a dados passa por esta interface; trocar por Postgres é reescrever SÓ este arquivo,
// sem tocar nas rotas". Foi exatamente isso. `saves.js` — o único consumidor — não mudou
// uma linha. As quatro funções (buscar/salvar/listar/apagar) continuam idênticas.
//
// ── A ESCOLHA É AUTOMÁTICA E ESSE É O PONTO ──────────────────────────
// Tem `DATABASE_URL`? Postgres. Não tem? Arquivo JSON. Ninguém precisa configurar nada
// pra rodar em casa, e a nuvem não precisa de código diferente. Um ambiente que exige
// banco pra abrir o jogo local é um ambiente que as pessoas param de usar.
//
// ── POR QUE UMA TABELA SÓ, E NÃO UMA POR COLEÇÃO ─────────────────────
// O contrato aqui SEMPRE foi chave-valor: `coleção → { id: registro }`. Postgres com
// jsonb serve isso direto, sem inventar esquema pra algo que não tem esquema fixo (o
// save é o estado inteiro do jogo — ele MUDA a cada leva de desenvolvimento). Migração
// de coluna a cada campo novo do jogo seria imposto sobre o design. Se um dia uma
// consulta precisar de índice (o placar, por exemplo), cria-se um índice de expressão
// sobre o jsonb — sem quebrar o resto.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_BD = process.env.DATABASE_URL || '';
export const usandoPostgres = Boolean(URL_BD);

// ═══════════════════════════════════════════════════════════════════════
// BACKEND A — POSTGRES (produção)
// ═══════════════════════════════════════════════════════════════════════
let pool = null;
let prontoBD = null;

async function bd() {
  if (pool) return pool;
  const { default: pg } = await import('pg');
  pool = new pg.Pool({
    connectionString: URL_BD,
    // Neon (e a maioria dos Postgres gerenciados) exige TLS. `rejectUnauthorized:false`
    // porque o certificado é de uma CA que o Node não traz por padrão — é o padrão
    // documentado deles; a conexão continua criptografada.
    ssl: URL_BD.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 5,                       // free tier tem limite de conexão; 5 sobra pro protótipo
    idleTimeoutMillis: 30_000,
  });
  return pool;
}

// Cria a tabela no primeiro uso. Idempotente, então roda a cada boot sem medo — e
// significa que subir o serviço num banco vazio simplesmente FUNCIONA, sem passo manual
// de migração que alguém vai esquecer às 2 da manhã.
async function garantirTabela() {
  if (prontoBD) return prontoBD;
  prontoBD = (async () => {
    const p = await bd();
    await p.query(`
      CREATE TABLE IF NOT EXISTS registros (
        colecao       TEXT NOT NULL,
        id            TEXT NOT NULL,
        dados         JSONB NOT NULL,
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (colecao, id)
      );
    `);
    // O placar ordena por coleção + data. Sem índice, a cada abertura do placar o
    // Postgres varre a tabela inteira — barato com 10 jogadores, burro com 10 mil.
    await p.query(`CREATE INDEX IF NOT EXISTS idx_registros_colecao
                   ON registros (colecao, atualizado_em DESC);`);
  })();
  return prontoBD;
}

const pgStore = {
  async buscar(colecao, id) {
    await garantirTabela();
    const p = await bd();
    const { rows } = await p.query('SELECT dados FROM registros WHERE colecao = $1 AND id = $2', [colecao, id]);
    return rows[0]?.dados || null;
  },
  async salvar(colecao, id, registro) {
    await garantirTabela();
    const p = await bd();
    const doc = { ...registro, id, atualizadoEm: new Date().toISOString() };
    // UPSERT: salvar é sempre "grave isto", nunca "existe? então atualize" — duas
    // requisições do mesmo jogador não podem competir e uma sumir.
    await p.query(
      `INSERT INTO registros (colecao, id, dados, atualizado_em)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (colecao, id) DO UPDATE SET dados = $3, atualizado_em = now()`,
      [colecao, id, JSON.stringify(doc)],
    );
    return doc;
  },
  async listar(colecao, filtro = null) {
    await garantirTabela();
    const p = await bd();
    const { rows } = await p.query(
      'SELECT dados FROM registros WHERE colecao = $1 ORDER BY atualizado_em DESC LIMIT 500',
      [colecao],
    );
    const arr = rows.map((r) => r.dados);
    return filtro ? arr.filter(filtro) : arr;
  },
  async apagar(colecao, id) {
    await garantirTabela();
    const p = await bd();
    const r = await p.query('DELETE FROM registros WHERE colecao = $1 AND id = $2', [colecao, id]);
    return r.rowCount > 0;
  },
};

// ═══════════════════════════════════════════════════════════════════════
// BACKEND B — ARQUIVO JSON (dev local, sem banco)
// ═══════════════════════════════════════════════════════════════════════
// Deliberadamente burro: cada coleção é um objeto { id: registro } num .json. Escrita
// atômica (grava em .tmp e renomeia) pra não corromper em crash.
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
const cache = new Map();
const locks = new Map();

async function garantirDir() {
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
}

async function carregar(colecao) {
  if (cache.has(colecao)) return cache.get(colecao);
  await garantirDir();
  const arq = join(DIR, `${colecao}.json`);
  let dados = {};
  if (existsSync(arq)) {
    try { dados = JSON.parse(await readFile(arq, 'utf8')); } catch { dados = {}; }
  }
  cache.set(colecao, dados);
  return dados;
}

async function persistir(colecao) {
  const anterior = locks.get(colecao) || Promise.resolve();
  const agora = anterior.then(async () => {
    await garantirDir();
    const arq = join(DIR, `${colecao}.json`);
    const tmp = `${arq}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(cache.get(colecao) || {}, null, 2));
    await rename(tmp, arq);
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`[store] falha ao persistir ${colecao}:`, e.message);
  });
  locks.set(colecao, agora);
  return agora;
}

const arquivoStore = {
  async buscar(colecao, id) {
    const dados = await carregar(colecao);
    return dados[id] || null;
  },
  async salvar(colecao, id, registro) {
    const dados = await carregar(colecao);
    dados[id] = { ...registro, id, atualizadoEm: new Date().toISOString() };
    await persistir(colecao);
    return dados[id];
  },
  async listar(colecao, filtro = null) {
    const dados = await carregar(colecao);
    const arr = Object.values(dados);
    return filtro ? arr.filter(filtro) : arr;
  },
  async apagar(colecao, id) {
    const dados = await carregar(colecao);
    if (dados[id]) { delete dados[id]; await persistir(colecao); return true; }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════
// A INTERFACE — inalterada desde a 24ª leva. É o contrato que permitiu esta troca.
// ═══════════════════════════════════════════════════════════════════════
const impl = usandoPostgres ? pgStore : arquivoStore;

export const buscar = (colecao, id) => impl.buscar(colecao, id);
export const salvar = (colecao, id, registro) => impl.salvar(colecao, id, registro);
export const listar = (colecao, filtro) => impl.listar(colecao, filtro);
export const apagar = (colecao, id) => impl.apagar(colecao, id);

// O /admin e o /api/health mostram onde os dados estão morando. Num deploy, "o save
// sumiu" quase sempre é "o banco não conectou e caiu no arquivo do container, que
// evapora no restart" — melhor dizer isso na cara do que deixar descobrir depois.
export function estadoDoStore() {
  return { backend: usandoPostgres ? 'postgres' : 'arquivo', persistente: usandoPostgres };
}
