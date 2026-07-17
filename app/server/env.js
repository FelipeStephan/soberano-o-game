// ═══════════════════════════════════════════════════════════════════════
// CARREGAMENTO DO .env — precisa rodar ANTES de qualquer outro módulo do servidor
// ═══════════════════════════════════════════════════════════════════════
// Ordem importa: ai.js e admin.js leem process.env no topo (const cfg = {...},
// const SENHA = ...). Se o .env carregasse depois deles, essas constantes nasceriam
// vazias. Por isso este módulo é importado PRIMEIRO no index.js — imports ES rodam
// na ordem em que aparecem, então este preenche process.env antes dos outros lerem.
//
// Sem dependência: usa o process.loadEnvFile nativo (Node 20.6+). Se o host já
// injeta as variáveis (Render/Railway/Fly/Docker -e), o arquivo nem precisa existir.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const envPath = join(dirname(dirname(fileURLToPath(import.meta.url))), '.env');
  if (existsSync(envPath) && process.loadEnvFile) process.loadEnvFile(envPath);
} catch {
  // As variáveis já vêm do ambiente do host — seguimos sem arquivo.
}
