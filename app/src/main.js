// ═══════════════════════════════════════════════════════════════════════
// PONTO DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════
// Duas mudanças do modo online entram aqui:
//   1. A ÁREA ADMINISTRATIVA SAIU DAQUI. Ela não é mais uma tela do jogo (#admin
//      no cliente) — virou uma página do SERVIDOR em /admin, atrás de senha. O
//      jogador nunca a alcança pelo app.
//   2. BOOTSTRAP DA IA: antes de desenhar qualquer coisa, perguntamos ao servidor
//      se a IA está ligada (sem receber a chave). Assim a home já mostra o status
//      certo e o loading de guerra sabe se pode gerar despachos.
import './estilo.css';
// Folhas de estilo por feature. Nasceram separadas porque `estilo.css` já passou dos
// 5 mil e linhas e virou um arquivo que ninguém abre inteiro — e porque quatro frentes
// mexeram no visual ao mesmo tempo. Importadas aqui, na ordem, DEPOIS da base: cada uma
// só acrescenta o que é dela.
import './estilo-nuclear.css';
import './estilo-onu.css';
import './estilo-onu-abertura.css';
import './estilo-relatorio.css';
import { mostrarInicio } from './ui/inicio.js';
import { iniciarJogo } from './ui/jogo.js';
import { Jogo } from './jogo/motor.js';

import { imprensaDe } from './dados/imprensa.js';
import { fichaDe, existe, elencoDoPais } from './dados/registro.js';
import { definirJogador } from './dados/paises.js';
import { carregarPartida } from './jogo/save.js';
import { bootstrapIA } from './config.js';
import { carregarPerfil, sincronizarNuvem } from './jogo/nuvem.js';
import { iniciarAudio } from './ui/audio.js';

const app = document.querySelector('#app');

function comecarJogo({ pais, presidente, continuar, online, net, sala, jogadores, semNucleares }) {
  // CONTINUAR: reergue a partida salva. O estado é JSON puro — restaurar é só ler.
  const save = continuar ? carregarPartida() : null;
  const iso = save ? save.iso : (existe(pais) ? pais : 'USA');
  // ANTES DE TUDO: quem é você. O globo, o painel de país e o mercado leem isso
  // pra saber o que é "casa".
  definirJogador(iso);
  const ficha = fichaDe(iso);
  const elenco = elencoDoPais(iso);         // gabinete do país (não mais o dos EUA)
  const veiculos = imprensaDe(iso);         // imprensa do país + internacionais
  const jogo = new Jogo({ ficha, elenco, veiculos, presidente, saveRestaurado: save, semNucleares: !!semNucleares });
  // ONLINE: a home já conectou à sala e escolheu o país. Passamos o cano (net) e a
  // lista de jogadores adiante pro jogo ligar as interações em tempo real.
  iniciarJogo(app, jogo, {
    online: !!online, net: net || null, sala: sala || null, jogadores: jogadores || [],
    // ── #11 · RENASCER NA MESMA SALA ────────────────────────────────────
    // O jogador caiu, a Máquina assumiu o país dele e ele escolheu outra nação. Em vez
    // de um `location.reload()` — que o expulsaria da sala e o obrigaria a entrar de
    // novo pela home — reconstruímos a partida AQUI, reusando a MESMA conexão `net`.
    // Funciona porque `iniciarJogo` reescreve o container do zero e `ligarOnline`
    // reassume os handlers via `net.setHandlers` (merge, não reconexão): a presença na
    // sala nunca cai, e o mundo compartilhado é readotado no boot pelo `mundo_atual`
    // que o servidor guarda. É o mesmo caminho de quem entra tarde numa sala em curso.
    renascer: (novoIso, novoPresidente) => comecarJogo({
      pais: novoIso, presidente: novoPresidente || presidente,
      continuar: false, online, net, sala, jogadores,
      // a regra da SALA continua valendo pra quem renasce nela
      semNucleares: !!jogo.estado.semNucleares,
    }),
  });
}

async function iniciar() {
  // Som antes de tudo: a música é do MENU também, e o click universal vale em
  // qualquer tela. Se o navegador bloquear autoplay, destrava no primeiro gesto.
  iniciarAudio();
  // Em paralelo: descobre se a IA está ligada e registra o perfil na nuvem.
  await Promise.allSettled([bootstrapIA(), carregarPerfil()]);
  // Sincroniza a partida local com a nuvem (se houver save mais novo lá).
  sincronizarNuvem();
  mostrarInicio(app, comecarJogo);
}

iniciar();
