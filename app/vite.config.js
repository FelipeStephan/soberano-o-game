import { defineConfig } from 'vite';

// Config do dev. O servidor de dev resolve os módulos ES.
//
// PROXY (a razão dele existir): em produção um processo só serve o jogo e a API na
// MESMA origem, e `/api/...` funciona sozinho. Em dev o Vite (5173) e o backend
// (8787) são origens diferentes — e chamar 8787 direto do 5173 é cross-origin, o que
// esbarra em CORS e, pior, falha de um jeito que o jogo interpretava como "IA
// indisponível" e caía calado no modo demonstração.
//
// Com o proxy, o cliente SEMPRE chama caminho relativo (`/api/...`), em dev e em
// produção. Some o CORS, some a URL condicional no cliente, e o dev vira igual à
// produção — que é o ponto: ambiente que mente sobre produção não serve de ambiente.
// A PORTA DEIXOU DE SER CRAVADA. 5173 continua sendo o padrão (é o que os docs, o
// scripts/dev.js e o hábito dizem), mas quando `PORT` vem do ambiente ela manda. O
// motivo é prosaico e recorrente: basta um outro projeto Vite aberto na máquina pra
// 5173 estar ocupada, e aí subir o SOBERANO virava "feche o outro app primeiro".
// Quando a porta vem de fora, o `open` também é desligado — quem passou PORT é uma
// ferramenta que já vai abrir a página sozinha, e duas janelas é uma a mais.
const PORTA = Number(process.env.PORT) || 5173;

export default defineConfig({
  server: {
    port: PORTA,
    open: !process.env.PORT,
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8787', ws: true },
    },
  },
});
