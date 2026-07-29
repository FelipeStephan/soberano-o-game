// ═══════════════════════════════════════════════════════════════════════
// A ABERTURA — os vinte segundos antes de você existir
// ═══════════════════════════════════════════════════════════════════════
// Fase 3 de ENREDO-E-CAMPANHA.md, Cena 1. O jogo abria direto na lista de países:
// o jogador escolhia uma bandeira sem que nada tivesse dito a ele o que estava em
// jogo, quanto tempo tinha, ou por que aquela escolha importava. Uma tela de seleção
// não é uma premissa — e sem premissa, "escolher a Rússia" é escolher uma cor.
//
// Quatro batidas, vinte segundos, e o jogador entra sabendo três coisas que ele NÃO
// sabia antes: a década é o prazo, as outras cadeiras têm gente sentada, e no fim
// alguém vai ser lembrado.
//
// ── POR QUE ELA NÃO SE REPETE ─────────────────────────────────────────
// Toca uma vez por navegador e some. Cinemática obrigatória na quinta partida é
// pedágio, e pedágio ensina o jogador a procurar o botão de pular antes mesmo de ler
// — que é o oposto do que ela existe para fazer. Quem quiser rever tem o link na
// home; quem já viu vai direto ao jogo.
//
// ── E POR QUE ELA NÃO TEM FUNDO PRÓPRIO ───────────────────────────────
// O planeta da home já está girando atrás. Desenhar um segundo globo aqui seria
// carregar three.js duas vezes para mostrar a mesma coisa. O overlay é escuro e
// translúcido: o mundo continua lá, e é justamente o ponto — ele existe antes de
// você, e vai continuar existindo depois.
import { ico } from './icones.js';
import { tocarTrilha } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CHAVE = 'soberano_viu_abertura';
export function jaViuAbertura() { try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; } }
function marcarVisto() { try { localStorage.setItem(CHAVE, '1'); } catch { /* modo privado: mostra sempre, e tudo bem */ } }

export const DUR_ABERTURA = 20000;
// A 3ª batida é a mais longa: é onde o jogador lê as regras da década (dez anos,
// três desfechos) e onde ele decide se está prestando atenção. As outras são placas.
const RITMO = [4200, 5200, 6600, 4000];

// As manchetes que sobem na primeira batida. Ficção plausível sobre um 2026 que não
// aconteceu — mesma regra do resto do jogo: os países são reais, os acontecimentos
// são inventados. Elas existem para dizer, sem narrador, que o mundo já estava
// pegando fogo antes de você chegar.
const MANCHETES = [
  'BRENT FECHA A US$ 96 — O TERCEIRO SALTO EM SEIS SEMANAS',
  'CONSELHO DE SEGURANÇA SE REÚNE PELA QUARTA VEZ NO ANO. NADA É APROVADO',
  'DOIS GOVERNOS CAEM NO MESMO MÊS, E NENHUM DOS DOIS AVISOU O ALIADO',
  'RELATÓRIO: METADE DO MUNDO GASTA MAIS COM DEFESA DO QUE COM SAÚDE',
  'ACORDO DE NÃO-AGRESSÃO É ASSINADO ÀS PRESSAS E QUESTIONADO NO MESMO DIA',
  'NOVO SURTO É DETECTADO. A OMS PEDE CALMA PELA SEGUNDA VEZ EM UM ANO',
  'CHANCELARIAS FALAM EM "JANELA DE OPORTUNIDADE". OS GENERAIS FALAM EM PRAZO',
];

const CENAS = [
  () => `<div class="ab-cena ab-manchetes">
    <div class="ab-ano">2026</div>
    <div class="ab-k">${ico('radio', 11)} O MUNDO ANTES DE VOCÊ</div>
    <div class="ab-fitas">
      ${MANCHETES.map((m, i) => `<div class="ab-fita" style="animation-delay:${180 + i * 340}ms">${esc(m)}</div>`).join('')}
    </div>
  </div>`,

  () => `<div class="ab-cena ab-centro">
    <div class="ab-k">${ico('users-round', 11)} AS CADEIRAS ESTÃO OCUPADAS</div>
    <h1 class="ab-tit">Vinte nações.<br>Vinte pessoas achando que sabem o que fazem.</h1>
    <p class="ab-txt">Uma delas é você. As outras dezenove não vão esperar você aprender.</p>
  </div>`,

  () => `<div class="ab-cena ab-centro ab-regras">
    <div class="ab-k">${ico('hourglass', 11)} O PRAZO</div>
    <h1 class="ab-tit ab-decada">DEZ ANOS</h1>
    <p class="ab-txt">Cento e vinte meses no comando. Uma hora do seu relógio. No fim deles,
      só existem três saídas — e você escolhe qual perseguir a partir do primeiro dia.</p>
    <div class="ab-tres">
      <div class="ab-t" style="--tc:var(--ambar)">${ico('crown', 16)}<b>IMPÉRIO</b><span>fechar o tabuleiro antes do apito</span></div>
      <div class="ab-t" style="--tc:var(--cyan)">${ico('landmark', 16)}<b>LEGADO</b><span>chegar ao fim de pé e ser medido por tudo que fez</span></div>
      <div class="ab-t" style="--tc:var(--perigo)">${ico('skull', 16)}<b>QUEDA</b><span>ser arrancado da cadeira antes da hora</span></div>
    </div>
  </div>`,

  () => `<div class="ab-cena ab-centro">
    <h1 class="ab-tit ab-final">Uma vai ser lembrada.</h1>
    <p class="ab-txt ab-final-sub">As outras vão ter de ser explicadas.</p>
    <div class="ab-marca">SOBERANO</div>
  </div>`,
];

// Devolve um CANCELADOR, como as outras cinemáticas do jogo: se a home for desmontada
// no meio (o jogador apertou voltar, a conexão caiu), quem chamou cancela e some tudo
// — timers, trilha e DOM — sem disparar o `aoFim` numa tela que já não existe.
export function abrirAbertura(aoFim) {
  // Duas aberturas ao mesmo tempo seriam duas trilhas tocando por cima uma da outra.
  if (document.querySelector('.ab-over')) return () => {};
  const timers = [];
  const emT = (fn, ms) => timers.push(setTimeout(fn, ms));
  let encerrado = false;
  let trilha = null;

  const raiz = document.createElement('div');
  raiz.className = 'ab-over';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-label', 'Abertura');
  raiz.innerHTML = `
    <div class="ab-palco" id="ab-palco"></div>
    <div class="ab-pe">
      <div class="ab-prog"><i></i></div>
      <button class="ab-pular" type="button">PULAR ${ico('chevron-right', 13)}</button>
    </div>`;
  document.body.appendChild(raiz);

  const palco = raiz.querySelector('#ab-palco');
  const barra = raiz.querySelector('.ab-prog i');
  const naTecla = (ev) => { if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fim(); } };

  const limpar = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    clearInterval(raiz._tick);
    window.removeEventListener('keydown', naTecla);
    trilha?.parar();
    trilha = null;
    raiz.classList.add('saindo');
    setTimeout(() => raiz.remove(), 420);
  };
  const fim = () => {
    if (encerrado) return;
    encerrado = true;
    marcarVisto();      // pular também conta como visto: quem pulou já decidiu
    limpar();
    try { aoFim?.(); } catch (e) { console.error('[abertura] aoFim falhou', e); }
  };

  raiz.querySelector('.ab-pular').addEventListener('click', fim);
  window.addEventListener('keydown', naTecla);
  trilha = tocarTrilha('conselho-suspense');

  let t = 0;
  CENAS.forEach((cena, i) => {
    const entrar = () => {
      palco.innerHTML = cena();
      palco.dataset.cena = String(i + 1);
    };
    if (i === 0) entrar(); else emT(entrar, t);
    t += RITMO[i];
  });

  // Barra pelo relógio de parede e não por transição CSS: no frame em que o overlay
  // entra no DOM o estilo inicial ainda não foi resolvido, e a transição vira salto.
  const inicio = Date.now();
  raiz._tick = setInterval(() => {
    const pct = Math.max(0, Math.min(100, ((Date.now() - inicio) / DUR_ABERTURA) * 100));
    barra.style.width = `${pct.toFixed(2)}%`;
  }, 100);

  emT(fim, DUR_ABERTURA);

  return () => { if (encerrado) return; encerrado = true; limpar(); };
}
