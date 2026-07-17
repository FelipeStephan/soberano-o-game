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
import { mostrarInicio } from './ui/inicio.js';
import { iniciarJogo } from './ui/jogo.js';
import { Jogo } from './jogo/motor.js';

import { imprensaDe } from './dados/imprensa.js';
import { fichaDe, existe, elencoDoPais } from './dados/registro.js';
import { definirJogador } from './dados/paises.js';
import { carregarPartida } from './jogo/save.js';
import { bootstrapIA } from './config.js';
import { carregarPerfil, sincronizarNuvem } from './jogo/nuvem.js';

const app = document.querySelector('#app');

function comecarJogo({ pais, presidente, continuar, online, net, sala, jogadores }) {
  // CONTINUAR: reergue a partida salva. O estado é JSON puro — restaurar é só ler.
  const save = continuar ? carregarPartida() : null;
  const iso = save ? save.iso : (existe(pais) ? pais : 'USA');
  // ANTES DE TUDO: quem é você. O globo, o painel de país e o mercado leem isso
  // pra saber o que é "casa".
  definirJogador(iso);
  const ficha = fichaDe(iso);
  const elenco = elencoDoPais(iso);         // gabinete do país (não mais o dos EUA)
  const veiculos = imprensaDe(iso);         // imprensa do país + internacionais
  const jogo = new Jogo({ ficha, elenco, veiculos, presidente, saveRestaurado: save });
  // ONLINE: a home já conectou à sala e escolheu o país. Passamos o cano (net) e a
  // lista de jogadores adiante pro jogo ligar as interações em tempo real.
  iniciarJogo(app, jogo, { online: !!online, net: net || null, sala: sala || null, jogadores: jogadores || [] });
}

async function iniciar() {
  // Em paralelo: descobre se a IA está ligada e registra o perfil na nuvem.
  await Promise.allSettled([bootstrapIA(), carregarPerfil()]);
  // Sincroniza a partida local com a nuvem (se houver save mais novo lá).
  sincronizarNuvem();
  mostrarInicio(app, comecarJogo);
}

iniciar();
