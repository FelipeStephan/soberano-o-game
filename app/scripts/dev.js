// ═══════════════════════════════════════════════════════════════════════
// DEV — sobe o BACKEND e o VITE juntos, com uma ordem entre eles
// ═══════════════════════════════════════════════════════════════════════
// Por que este arquivo existe: `npm run dev` subia só o Vite. O backend (8787) ficava
// morto, toda chamada de IA falhava por rede, e o jogo caía calado nas cartas de
// reserva. O sintoma que chegava ao jogador era "a IA não tem contexto do meu país" —
// quando na verdade a IA nunca tinha sido chamada. Um comando faltando custou uma
// investigação inteira.
//
// Escrito à mão em vez de `concurrently` por um motivo simples: uma dependência a
// menos num projeto que precisa buildar num container. São 40 linhas de child_process.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// Chamamos o entry JS do Vite com o próprio Node, em vez de `npx vite`. Duas dores
// evitadas de uma vez no Windows: `shell: true` concatena argumentos sem escapar (e
// "C:\Program Files\nodejs" tem espaço — o spawn quebrava literalmente em 'C:\Program'),
// e o Node moderno recusa spawnar .cmd sem shell. Sem shell, sem npx, sem drama.
const VITE = join(RAIZ, 'node_modules', 'vite', 'bin', 'vite.js');

// Aviso ANTES de subir: sem .env o jogo roda, mas em Modo Demonstração — e é melhor
// dizer isso na cara agora do que deixar o jogador descobrir por uma carta estranha.
if (!existsSync(join(RAIZ, '.env'))) {
  console.log('\n\x1b[33m⚠  app/.env não existe.\x1b[0m O jogo vai subir em MODO DEMONSTRAÇÃO (sem IA).');
  console.log('   Copie .env.example para .env e preencha OPENROUTER_API_KEY.\n');
}

const filhos = [];
function subir(nome, args, cor) {
  const p = spawn(process.execPath, args, { cwd: RAIZ });
  const prefixo = `\x1b[${cor}m[${nome}]\x1b[0m`;
  const escrever = (buf) => String(buf).split('\n').filter(Boolean)
    .forEach((l) => console.log(`${prefixo} ${l}`));
  p.stdout.on('data', escrever);
  p.stderr.on('data', escrever);
  p.on('exit', (code) => {
    // Se um cai, o outro não deve ficar zumbi fingindo que está tudo bem — foi
    // exatamente esse "meio funcionando" que escondeu o bug original.
    console.log(`${prefixo} saiu (código ${code}). Derrubando o resto.`);
    encerrar();
  });
  filhos.push(p);
  return p;
}

function encerrar() {
  for (const p of filhos) { try { p.kill(); } catch { /* já morreu */ } }
  process.exit(0);
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);

subir('servidor', ['server/index.js'], '36');  // ciano
subir('vite', [VITE], '35');                   // magenta

console.log('\n\x1b[32m▸ SOBERANO em desenvolvimento\x1b[0m');
console.log('  jogo:     http://localhost:5173  (o Vite proxya /api e /ws pro backend)');
console.log('  admin:    http://localhost:8787/admin');
console.log('  Ctrl+C derruba os dois.\n');
