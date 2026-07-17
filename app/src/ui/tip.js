// ═══════════════════════════════════════════════════════════════════════
// TIP — o cartão que se digita sozinho
// ═══════════════════════════════════════════════════════════════════════
// O que isto substitui: o `title` nativo. Ele tem três defeitos que matam o clima
// de um terminal de comando — demora ~1s pra aparecer, é uma caixinha branca do
// sistema operacional, e não aceita uma vírgula de estilo. O jogo inteiro é uma
// cabine militar e o texto de ajuda vinha do Windows.
//
// Aqui o cartão abre NA HORA e o texto se DIGITA, como se o terminal estivesse
// respondendo à consulta. É o mesmo gesto do jogo: você pergunta, a máquina responde.
//
// Uso — em qualquer elemento, sem JS por componente:
//   <span data-tip="O que isto significa.">              ← só o corpo
//   <span data-tip="..." data-tip-t="PIB">               ← com título
//   <span data-tip="..." data-tip-t="Focos" data-tip-k="MUNDO EM CHAMAS">
//   <i class="tip-q" data-tip="...">                     ← o ícone de interrogação
// e uma vez só, no boot: ligarTips().
//
// A delegação é no document de propósito: a HUD é redesenhada por innerHTML a cada
// turno e qualquer listener preso ao elemento morreria junto. Aqui o alvo pode nem
// existir quando isto roda.

const VEL = 9;            // ms por caractere — rápido: é resposta de máquina, não datilografia
const MAX_MS = 620;       // teto: texto longo acelera em vez de fazer o jogador esperar

let caixa = null;
let alvoAtual = null;
let raf = null;
let fimCursor = null;
let ligado = false;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const menos = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function montar() {
  if (caixa) return caixa;
  caixa = document.createElement('div');
  caixa.className = 'tipd';
  caixa.setAttribute('role', 'tooltip');
  caixa.innerHTML = '<div class="tipd-k"></div><div class="tipd-t"></div><div class="tipd-c"><span class="tipd-txt"></span><i class="tipd-cur"></i></div>';
  document.body.appendChild(caixa);
  return caixa;
}

// Escrever caractere a caractere. O cursor pisca no fim enquanto escreve e some
// quando termina — é o que faz parecer que a máquina está respondendo agora.
//
// rAF e não setInterval: o intervalo entrega o número de TICKS, não o tempo que
// passou, então sob carga (o globo 3D é vizinho de quadro) ele atrasa e o texto sai
// lento. Aqui a fatia vem do relógio — quantos caracteres cabem no tempo decorrido —
// e a duração é a mesma independente de quantos quadros o navegador conseguiu dar.
function parar() { if (raf) cancelAnimationFrame(raf); raf = null; clearTimeout(fimCursor); }

function digitar(texto) {
  const span = caixa.querySelector('.tipd-txt');
  const cur = caixa.querySelector('.tipd-cur');
  parar();
  if (menos()) { span.textContent = texto; cur.style.display = 'none'; return; }
  span.textContent = '';
  cur.style.display = '';
  const dur = Math.min(MAX_MS, texto.length * VEL);   // texto longo acelera, não demora mais
  const t0 = performance.now();
  const passo = (agora) => {
    const p = Math.min(1, (agora - t0) / dur);
    span.textContent = texto.slice(0, Math.ceil(p * texto.length));
    if (p < 1) { raf = requestAnimationFrame(passo); return; }
    raf = null;
    fimCursor = setTimeout(() => { cur.style.display = 'none'; }, 400);
  };
  raf = requestAnimationFrame(passo);
}

// Encostar na borda da tela e ser cortado é o jeito mais rápido de um tooltip
// perder a serventia. Ele vira de lado/pra cima antes de vazar.
function posicionar(el) {
  const r = el.getBoundingClientRect();
  const c = caixa.getBoundingClientRect();
  const M = 10;
  let x = r.left + r.width / 2 - c.width / 2;
  let y = r.top - c.height - 9;
  if (y < M) y = r.bottom + 9;                                    // não cabe em cima → embaixo
  x = Math.max(M, Math.min(x, window.innerWidth - c.width - M));
  y = Math.max(M, Math.min(y, window.innerHeight - c.height - M));
  caixa.style.left = `${Math.round(x)}px`;
  caixa.style.top = `${Math.round(y)}px`;
}

function mostrar(el) {
  const texto = el.getAttribute('data-tip');
  if (!texto) return;
  alvoAtual = el;
  montar();
  const t = el.getAttribute('data-tip-t') || '';
  const k = el.getAttribute('data-tip-k') || '';
  const et = caixa.querySelector('.tipd-t');
  const ek = caixa.querySelector('.tipd-k');
  et.textContent = t; et.style.display = t ? '' : 'none';
  ek.textContent = k; ek.style.display = k ? '' : 'none';
  caixa.className = `tipd on${el.getAttribute('data-tip-cor') ? ' ' + el.getAttribute('data-tip-cor') : ''}`;
  caixa.querySelector('.tipd-txt').textContent = texto;   // mede na largura final...
  posicionar(el);
  digitar(texto);                                          // ...e só então digita
}

function esconder() {
  alvoAtual = null;
  parar();
  if (caixa) caixa.className = 'tipd';
}

export function ligarTips() {
  if (ligado) return;
  ligado = true;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (!el || el === alvoAtual) return;
    // REGRA DO PONTO DE INTERROGAÇÃO: quando o elemento tem um `?` (.tip-q) dentro, só o
    // PRÓPRIO `?` abre o cartão — não o corpo inteiro. Assim o jogador não recebe a
    // info só por passar o mouse pela célula; ele mira o `?`. Elementos sem `?`
    // (botões, selos) seguem abrindo no hover, que é a única porta que têm.
    if (!el.classList.contains('tip-q') && el.querySelector?.('.tip-q')) return;
    // O title nativo brigaria com o nosso: duas caixas pro mesmo texto.
    if (el.title) el.removeAttribute('title');
    mostrar(el);
  });
  document.addEventListener('mouseout', (e) => {
    if (!alvoAtual) return;
    const p = e.relatedTarget?.closest?.('[data-tip]');
    if (p === alvoAtual) return;
    esconder();
  });
  // Rolar/clicar com o cartão aberto deixaria ele órfão flutuando no lugar errado.
  document.addEventListener('scroll', esconder, true);
  document.addEventListener('click', esconder, true);
  window.addEventListener('blur', esconder);
}

// O ícone de interrogação. Existe porque o jogador pediu um ponto onde CLARAMENTE
// há explicação — sem isso ele só descobre o tooltip por acidente de mouse.
export function q(tip, { t = '', k = '', cor = '' } = {}) {
  return `<i class="tip-q" tabindex="0" data-tip="${esc(tip)}"${t ? ` data-tip-t="${esc(t)}"` : ''}${k ? ` data-tip-k="${esc(k)}"` : ''}${cor ? ` data-tip-cor="${esc(cor)}"` : ''}>?</i>`;
}

// Atalho pra montar os atributos direto num elemento existente.
export function tipAttr(tip, { t = '', k = '', cor = '' } = {}) {
  return `data-tip="${esc(tip)}"${t ? ` data-tip-t="${esc(t)}"` : ''}${k ? ` data-tip-k="${esc(k)}"` : ''}${cor ? ` data-tip-cor="${esc(cor)}"` : ''}`;
}
