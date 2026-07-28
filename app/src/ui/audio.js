// ═══════════════════════════════════════════════════════════════════════
// ÁUDIO — música de fundo + efeitos, um motor só
// ═══════════════════════════════════════════════════════════════════════
// Regras da casa:
//   • A música toca desde o MENU, baixa por padrão — é fundo, não protagonista.
//   • O jogador controla: um botão de alto-falante (menu e in-game) abre volume + mudo.
//     A escolha persiste no localStorage e vale pra sessão inteira.
//   • Navegador bloqueia autoplay: se o play falhar, a música arma um gatilho e
//     começa no PRIMEIRO clique/tecla — invisível pro jogador.
//   • Efeitos: click universal (tudo que é clicável), digitando (hover em "?"/tooltip),
//     swoosh (transição menu→jogo), radar (ataque naval), trilha nuclear (ducking:
//     a música de fundo abaixa enquanto a da bomba toca, e volta sozinha).
import { ico } from './icones.js';

const CHAVE = 'soberano_audio';                // { vol: 0..1, mudo: bool }
const URLS = {
  musica:    '/audio/musica-fundo.mp3',
  click:     '/audio/click.mp3',
  digitando: '/audio/digitando.mp3',
  swoosh:    '/audio/swoosh.mp3',
  radar:     '/audio/radar.mp3',
  nuclear:   '/audio/nuclear.mp3',
  alarme:         '/audio/alarme.mp3',           // ações urgentes (o dono pediu: não muito alto)
  'alerta-nuclear': '/audio/alerta-nuclear.mp3', // aviso ao ARMAR o sistema nuclear
  'guerra-fundo': '/audio/guerra-fundo.mp3',     // eco ao clicar num país em guerra
  'missil-1': '/audio/missil-1.mp3',             // swooshs de míssil (variam por salva)
  'missil-2': '/audio/missil-2.mp3',
  'missil-3': '/audio/missil-3.mp3',
  'conselho-suspense': '/audio/conselho-suspense.mp3', // abertura do Conselho de Segurança
};
// DECISÃO DO DONO: o slider de volume controla SÓ A MÚSICA DE FUNDO. Efeitos
// (click, radar, míssil…) tocam num volume fixo calibrado — o mute silencia tudo.
const ESCALA_MUSICA = 0.45;
const VOL_EFEITOS = 0.85;

const salvo = (() => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } })();
const estado = {
  vol: typeof salvo.vol === 'number' ? Math.max(0, Math.min(1, salvo.vol)) : 0.5,
  mudo: !!salvo.mudo,
  ligado: false,          // vira true quando o navegador deixa tocar
};
const persistir = () => { try { localStorage.setItem(CHAVE, JSON.stringify({ vol: estado.vol, mudo: estado.mudo })); } catch {} };

// ── MÚSICA DE FUNDO ────────────────────────────────────────────────────
const musica = new Audio(URLS.musica);
musica.loop = true;
musica.preload = 'auto';

let duckando = false;    // trilha nuclear no ar → música de fundo abaixada
function volumeMusica() {
  const base = estado.mudo ? 0 : estado.vol * ESCALA_MUSICA;
  return duckando ? base * 0.25 : base;
}
function aplicarVolumes() {
  musica.volume = volumeMusica();
  musica.muted = estado.mudo;
  if (nuclearAtual) nuclearAtual.volume = estado.mudo ? 0 : VOL_EFEITOS;
  if (conselhoAtual) conselhoAtual.volume = estado.mudo ? 0 : VOL_EFEITOS;
  document.querySelectorAll('.aud-ctl').forEach(pintarWidget);
}

function tentarTocarMusica() {
  if (estado.ligado) return;
  musica.volume = volumeMusica();
  musica.play().then(() => { estado.ligado = true; }).catch(() => {
    // Autoplay bloqueado: primeiro gesto do jogador destrava. Uma vez só.
    const destravar = () => {
      musica.play().then(() => { estado.ligado = true; }).catch(() => {});
      window.removeEventListener('pointerdown', destravar);
      window.removeEventListener('keydown', destravar);
    };
    window.addEventListener('pointerdown', destravar);
    window.addEventListener('keydown', destravar);
  });
}

// ── EFEITOS ────────────────────────────────────────────────────────────
// Cache de buffers: cada efeito é um <audio> clonado no disparo, pra sobrepor
// (dois cliques rápidos = dois sons, não um cortado).
const cache = {};
function tocarEfeito(nome, { volume = 1 } = {}) {
  if (estado.mudo || !URLS[nome]) return null;
  if (!cache[nome]) { cache[nome] = new Audio(URLS[nome]); cache[nome].preload = 'auto'; }
  const a = cache[nome].cloneNode();
  // efeitos independem do slider (que é só da música) — volume fixo calibrado
  a.volume = Math.max(0, Math.min(1, VOL_EFEITOS * volume));
  a.play().catch(() => {});
  return a;
}

// Míssil: alterna entre as 3 variações pra salva não soar repetida.
let misIdx = 0;
function tocarMissil(volume = 0.5) {
  misIdx = (misIdx % 3) + 1;
  return tocarEfeito(`missil-${misIdx}`, { volume });
}

// ── TRILHA NUCLEAR (ducking) ───────────────────────────────────────────
let nuclearAtual = null;
function tocarNuclear() {
  if (nuclearAtual) { nuclearAtual.pause(); nuclearAtual = null; }
  duckando = true;
  musica.volume = volumeMusica();
  nuclearAtual = tocarEfeito('nuclear', { volume: 1 });
  if (!nuclearAtual) { duckando = false; return; }
  nuclearAtual.addEventListener('ended', () => {
    duckando = false; nuclearAtual = null;
    musica.volume = volumeMusica();
  });
}

// ── TRILHA DO CONSELHO (ducking + fade de saída) ───────────────────────
// A abertura do Conselho de Segurança dura 15s, o arquivo tem ~18,9s. Ou seja:
// a cinemática SEMPRE termina antes da música. Por isso o parar() não corta seco
// — desce o volume em 800ms enquanto a tela vira pra votação. Sem isso o corte
// soava como um cabo arrancado, e a cena que o dono quis "bonitinha" azedava no
// último segundo. Também não faz loop: a música é longa demais pra precisar.
// GENERALIZADA para servir a QUALQUER cinemática (a abertura do Conselho foi a
// primeira; o fim da era é a segunda). O que ela faz é o que toda cena longa precisa:
// abaixa a música de fundo, toca a faixa por cima, e devolve um `parar()` que sobe o
// volume de volta sem corte seco. `tocarConselho()` continua existindo como o nome
// curto de quem já a chamava.
//
// TROCAR A FAIXA DO FIM DA ERA é mudar uma string: ponha o mp3 em `public/audio/` e
// passe o nome dele em `ui/fimDaEra.js`. Hoje as duas cenas dividem a mesma trilha
// de suspense porque não existe outra no acervo — e uma cena muda seria pior.
let conselhoAtual = null;
export function tocarConselho() { return tocarTrilha('conselho-suspense'); }
export function tocarTrilha(nome) {
  // Duas cinemáticas emendadas (jogador pulou uma e outra abriu) não podem sobrepor
  // duas trilhas: a anterior morre agora.
  if (conselhoAtual) { try { conselhoAtual.pause(); } catch {} conselhoAtual = null; }
  duckando = true;
  musica.volume = volumeMusica();
  const restaurar = () => { duckando = false; musica.volume = volumeMusica(); };

  const a = tocarEfeito(nome, { volume: 1 });
  // Mudo global (ou arquivo faltando): a cinemática roda muda, mas quem chamou
  // ainda recebe um { parar() } válido — não é trabalho dele saber do mute.
  if (!a) { restaurar(); return { parar() {} }; }
  conselhoAtual = a;
  a.addEventListener('ended', () => {
    if (conselhoAtual !== a) return;
    conselhoAtual = null; restaurar();
  });
  return {
    parar() {
      if (conselhoAtual !== a) return;   // já parada/substituída
      conselhoAtual = null;
      fade(a, a.volume ?? VOL_EFEITOS, 0, 800, () => { try { a.pause(); a.currentTime = 0; } catch {} });
      restaurar();                       // a música de fundo já pode voltar a subir
    },
  };
}

// ── FADE genérico de um <audio> (sobe/desce o volume aos poucos) ───────
// Usado pra entrar/sair do eco de guerra sem corte seco. Cancela qualquer fade
// anterior no mesmo elemento (guardado em _fade) pra não brigarem.
function fade(el, de, para, ms, aoFim) {
  if (!el) return;
  clearInterval(el._fade);
  const passos = Math.max(1, Math.round(ms / 40));
  let i = 0;
  try { el.volume = Math.max(0, Math.min(1, de)); } catch {}
  el._fade = setInterval(() => {
    i += 1;
    const v = de + (para - de) * (i / passos);
    try { el.volume = Math.max(0, Math.min(1, v)); } catch {}
    if (i >= passos) { clearInterval(el._fade); el._fade = null; aoFim?.(); }
  }, 40);
}

// ── ECO DE GUERRA (uma instância só, com FADE de entrada e saída) ──────
// Ambiência de seleção: entra suave ao clicar num país em guerra e SAI AOS POUCOS
// ao deselecionar/trocar (o dono reclamou do corte brusco). Instância única —
// sem isso cada clique empilhava um clone e o mar de guerra "grudava" no jogo.
const GUERRA_VOL = 0.4;
let guerraAtual = null;
function tocarGuerraFundo() {
  if (guerraAtual) return;           // já tocando este país — não reinicia
  if (estado.mudo) return;
  guerraAtual = tocarEfeito('guerra-fundo', { volume: 0.001 });
  if (guerraAtual) { guerraAtual.loop = true; fade(guerraAtual, 0, GUERRA_VOL, 900); }
}
function pararGuerraFundo() {
  const el = guerraAtual;
  guerraAtual = null;
  if (!el) return;
  fade(el, el.volume ?? GUERRA_VOL, 0, 1100, () => { try { el.pause(); el.currentTime = 0; } catch {} });
}

// ── CLICK UNIVERSAL + DIGITANDO NO HOVER ───────────────────────────────
// Capture=true: mesmo handlers que dão stopPropagation não silenciam o click.
const CLICAVEL = 'button, a, [role="button"], .hm-item, .hmm-op, .lb-sala, .ft-chip, input[type="checkbox"], input[type="radio"], select, summary, [data-tip]';
let sonsGlobaisLigados = false;
function ligarSonsGlobais() {
  if (sonsGlobaisLigados) return;
  sonsGlobaisLigados = true;
  document.addEventListener('click', (e) => {
    if (e.target.closest?.(CLICAVEL)) tocarEfeito('click', { volume: 0.8 });
  }, true);
  // "digitando" quando o mouse pousa numa info (?, data-tip) — 1x por entrada
  let ultimoTip = null;
  let somTip = null;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('[data-tip], .tip-q');
    if (!el || el === ultimoTip) { if (!el) ultimoTip = null; return; }
    ultimoTip = el;
    somTip?.pause();
    somTip = tocarEfeito('digitando', { volume: 0.55 });
  }, true);
  document.addEventListener('mouseout', (e) => {
    if (ultimoTip && !e.relatedTarget?.closest?.('[data-tip], .tip-q')) {
      ultimoTip = null; somTip?.pause(); somTip = null;
    }
  }, true);
}

// ── INICIALIZAÇÃO (chamada única no main.js) ───────────────────────────
export function iniciarAudio() {
  ligarSonsGlobais();
  tentarTocarMusica();
  aplicarVolumes();
}

// ── WIDGET DE CONTROLE — alto-falante + slider, IDÊNTICO no menu e in-game ──
// O painel (VOLUME + slider + mute) abre por CLIQUE no alto-falante (toggle) e
// também por hover — assim funciona igual nos dois lugares, sem depender de hover
// (que falhava in-game). O ícone de mute (X vermelho) vive DENTRO do painel, como
// no menu: arrastar o slider ajusta, clicar no X silencia.
function pintarWidget(raiz) {
  const btn = raiz.querySelector('.aud-btn');
  const pop = raiz._pop || raiz;   // o painel vive num portal no <body> (raiz._pop)
  const range = pop.querySelector?.('.aud-range');
  const mute = pop.querySelector?.('.aud-mute');
  const icoNome = estado.mudo || estado.vol === 0 ? 'volume-x' : estado.vol < 0.5 ? 'volume-1' : 'volume-2';
  if (btn) { btn.innerHTML = ico(icoNome, 16); btn.classList.toggle('mudo', estado.mudo); }
  if (mute) { mute.innerHTML = ico(estado.mudo ? 'volume-x' : 'volume-2', 15); mute.classList.toggle('on', estado.mudo); }
  if (range && document.activeElement !== range) range.value = String(Math.round(estado.vol * 100));
}

export function montarControleAudio({ semDica = false } = {}) {
  const raiz = document.createElement('div');
  raiz.className = 'aud-ctl';
  const dica = semDica ? 'aria-label="Som"' : 'data-tip="Som do jogo" data-tip-t="ÁUDIO" aria-label="Som"';
  raiz.innerHTML = `<button class="aud-btn" ${dica}></button>`;

  // PORTAL: o painel vive no <body>, NÃO dentro do header — o clip-path chanfrado do
  // topo do jogo CORTA A PINTURA de qualquer descendente (mesmo position:fixed), e era
  // por isso que in-game o volume "não funcionava": o painel abria invisível.
  const pop = document.createElement('div');
  pop.className = 'aud-pop';
  pop.innerHTML = `<div class="aud-pop-in">
    <span class="aud-rot">VOLUME</span>
    <input class="aud-range" type="range" min="0" max="100" step="1">
    <button class="aud-mute" aria-label="Silenciar"></button>
  </div>`;
  document.body.appendChild(pop);

  const posicionar = () => {
    const r = raiz.querySelector('.aud-btn').getBoundingClientRect();
    const larguraTela = document.documentElement.clientWidth || 1280;
    const largPop = pop.offsetWidth || 190;
    const left = Math.max(8, Math.min(r.right - largPop, larguraTela - largPop - 8));
    pop.style.top = `${Math.round(r.bottom)}px`;
    pop.style.left = `${Math.round(left)}px`;
  };
  const abrir = () => { posicionar(); pop.classList.add('aberto'); posicionar(); };
  const fechar = () => pop.classList.remove('aberto');

  // CLIQUE alterna; hover abre; clicar fora fecha. O mute mora DENTRO do painel.
  raiz.querySelector('.aud-btn').addEventListener('click', (ev) => {
    ev.stopPropagation();
    pop.classList.contains('aberto') ? fechar() : abrir();
  });
  raiz.addEventListener('mouseenter', abrir);
  let tFecha = null;
  const agendaFechar = () => { clearTimeout(tFecha); tFecha = setTimeout(fechar, 450); };
  raiz.addEventListener('mouseleave', agendaFechar);
  pop.addEventListener('mouseenter', () => clearTimeout(tFecha));
  pop.addEventListener('mouseleave', agendaFechar);
  document.addEventListener('click', (ev) => { if (!raiz.contains(ev.target) && !pop.contains(ev.target)) fechar(); });

  pop.querySelector('.aud-range').addEventListener('input', (e) => {
    estado.vol = Number(e.target.value) / 100;
    if (estado.vol > 0 && estado.mudo) estado.mudo = false;
    persistir(); aplicarVolumes();
  });
  pop.querySelector('.aud-mute').addEventListener('click', (ev) => {
    ev.stopPropagation();
    estado.mudo = !estado.mudo;
    persistir(); aplicarVolumes();
  });
  // pintarWidget varre .aud-ctl (botão) e .aud-pop (slider/mute) — liga os dois nós
  raiz._pop = pop;
  pintarWidget(raiz);
  return raiz;
}

export { tocarEfeito, tocarNuclear, tocarMissil, tocarGuerraFundo, pararGuerraFundo };
