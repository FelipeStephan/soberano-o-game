// ═══════════════════════════════════════════════════════════════════════
// O MANDATO — a cobrança, o placar e o veredito
// ═══════════════════════════════════════════════════════════════════════
// Três telas para o mesmo sistema (jogo/mandatos.js), e as três são pequenas de
// propósito. O Mandato precisa ser onipresente sem ser intrusivo: ele é o rumo do
// minuto a minuto, não mais um painel para abrir.
//
//   1. A COBRANÇA (modal, 1× a cada 2 anos) — o gabinete te olha na cara e pede.
//   2. O PLACAR (faixa fixa na HUD) — a barra que o jogador consulta de canto de olho
//      sem clicar em nada. É a peça mais importante das três: um objetivo que só
//      aparece de dois em dois anos é um objetivo esquecido em três minutos.
//   3. O VEREDITO (modal, no vencimento) — cumpriu ou não, e o que isso custou.
//
// ── POR QUE A COBRANÇA É UM MODAL E O PLACAR NÃO ──────────────────────
// A cobrança acontece 5 vezes numa hora de partida: pode parar o jogo, e DEVE — é o
// momento em que o enredo fala. O placar acontece o tempo todo: se fosse modal, ou
// viraria spam ou seria fechado e nunca mais aberto. Regra da casa: cerimônia para o
// que é raro, visor para o que é contínuo.
import { ico } from './icones.js';
import { DOUTRINAS } from '../jogo/doutrinas.js';
import { progressoMandato, roman, TOTAL_MANDATOS } from '../jogo/mandatos.js';
import { tocarEfeito } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── 1 · A COBRANÇA ────────────────────────────────────────────────────
// BUG QUE O `:not(.saindo)` CONSERTA: o veredito chama `onFim` no clique e só remove o
// próprio nó 260ms depois (o tempo da animação de saída). Nesses 260ms a cobrança do
// mandato SEGUINTE tentava abrir, batia na trava de "já existe um modal" e desistia em
// silêncio — o jogador cumpria o Mandato I e ficava dois anos sem nenhum objetivo,
// exatamente o vazio que este sistema veio preencher. A trava continua existindo (dois
// modais empilhados seria pior), mas agora ela ignora quem já está de saída.
export function abrirCobranca(jogo, m, { onFim } = {}) {
  if (!m || document.querySelector('.mnd-over:not(.saindo)')) return () => {};
  const d = DOUTRINAS[m.doutrina] || {};
  const over = document.createElement('div');
  over.className = 'mnd-over';
  over.innerHTML = `
    <div class="mnd-card" style="--cd:${esc(d.cor || 'var(--cyan)')}">
      <div class="mnd-cab">
        <div class="mnd-ic">${ico(d.ic || 'scroll', 24)}</div>
        <div class="mnd-cab-txt">
          <span class="mnd-k">MANDATO ${esc(roman(m.n))} DE ${TOTAL_MANDATOS} · ${esc(d.nome || 'DOUTRINA')}</span>
          <b>${esc(m.quem)}</b>
        </div>
        <span class="mnd-prazo">${ico('clock', 11)} ATÉ O ANO ${esc(roman(m.anoVence))}</span>
      </div>
      <h2 class="mnd-tit">${esc(m.titulo)}</h2>
      <p class="mnd-fala">${esc(m.fala)}</p>
      <div class="mnd-meta">
        <span class="mnd-meta-k">O QUE SERÁ COBRADO</span>
        <b>${esc(alvoLegivel(m))}</b>
      </div>
      <div class="mnd-consq">
        <div class="mnd-c bom">${ico('trending-up', 13)}<span><i>CUMPRIR</i>o gabinete respira, o povo aprova e o próximo pedido vem maior</span></div>
        <div class="mnd-c ruim">${ico('trending-down', 13)}<span><i>FALHAR</i>estabilidade e aprovação caem — e falhar duas vezes seguidas dói em dobro</span></div>
      </div>
      <button class="mnd-ok" id="mnd-ok">${ico('check', 15)} ENTENDIDO</button>
    </div>`;
  document.body.appendChild(over);
  try { tocarEfeito('radar', { volume: 0.3 }); } catch { /* sem áudio */ }

  const fechar = () => { over.classList.add('saindo'); setTimeout(() => over.remove(), 260); };
  over.querySelector('#mnd-ok').addEventListener('click', () => { fechar(); onFim?.(); });
  return fechar;
}

// "mais 4 territórios tomados" lê melhor que "conquista >= 17" — o jogador não sabe
// (nem deve saber) qual era o acumulado dele antes do Mandato começar.
function alvoLegivel(m) {
  const fmt = (v) => (m.casas ? Number(v).toFixed(m.casas) : String(Math.round(v)));
  if (m.inverso) return `${m.rot.charAt(0).toUpperCase()}${m.rot.slice(1)} em ${fmt(m.alvo)} ou menos`;
  if (m.tipo === 'feito') return `Mais ${fmt(m.alvo - m.partida)} ${m.rot}`;
  return `${fmt(m.alvo)} ${m.rot}`;
}

// ── 2 · O PLACAR NA HUD ───────────────────────────────────────────────
// Devolve o HTML da faixa, ou string vazia se não há mandato. Quem chama injeta num
// nó fixo e chama de novo a cada batida — sem estado guardado aqui, para não haver
// uma segunda versão da verdade sobre o progresso.
export function faixaMandatoHTML(estado) {
  const m = estado?.mandatos?.atual;
  if (!m) return '';
  const p = progressoMandato(estado, m);
  if (!p) return '';
  const d = DOUTRINAS[m.doutrina] || {};
  const mesesRestantes = Math.max(0, m.venceEm - (estado.turno || 0));
  // O APERTO visual entra nos últimos 4 meses e só quando ainda falta cumprir. Antes
  // disso seria alarme falso — e alarme falso é o caminho mais rápido para o jogador
  // aprender a ignorar a faixa.
  const apertado = mesesRestantes <= 4 && !p.cumprido;
  return `<div class="mnd-faixa ${p.cumprido ? 'ok' : ''} ${apertado ? 'apertado' : ''}" style="--cd:${esc(d.cor || 'var(--cyan)')}"
      data-tip="${esc(m.fala)}" data-tip-t="${esc(m.titulo)}" data-tip-k="MANDATO ${esc(roman(m.n))} · ${esc(m.quem)}">
    <div class="mnd-f-cab">
      <span class="mnd-f-k">${ico(p.cumprido ? 'check-check' : d.ic || 'scroll', 10)} MANDATO ${esc(roman(m.n))}</span>
      <span class="mnd-f-prazo">${mesesRestantes === 0 ? 'VENCE AGORA' : `${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`}</span>
    </div>
    <div class="mnd-f-tit">${esc(m.titulo)}</div>
    <div class="mnd-f-trilho"><i style="width:${Math.max(2, p.pct)}%"></i></div>
    <div class="mnd-f-num">${esc(p.texto)} <b>${esc(p.rot)}</b></div>
  </div>`;
}

// ── 3 · O VEREDITO ────────────────────────────────────────────────────
export function abrirVeredito(jogo, res, { onFim } = {}) {
  if (!res || document.querySelector('.mnd-over:not(.saindo)')) { onFim?.(); return () => {}; }
  const ok = res.cumprido;
  const d = DOUTRINAS[res.mandato.doutrina] || {};
  const efeitos = Object.entries(res.efeitos || {})
    .map(([k, v]) => `<span class="mnd-ef ${v >= 0 ? 'bom' : 'ruim'}">${esc(ROT_VAR[k] || k)} <b>${v > 0 ? '+' : ''}${v}</b></span>`).join('');

  const over = document.createElement('div');
  over.className = `mnd-over veredito ${ok ? 'ok' : 'falhou'}`;
  over.innerHTML = `
    <div class="mnd-card" style="--cd:${ok ? esc(d.cor || 'var(--verde)') : 'var(--perigo)'}">
      <div class="mnd-selo">${ico(ok ? 'badge-check' : 'file-x', 40)}</div>
      <span class="mnd-k">MANDATO ${esc(roman(res.mandato.n))} · ANO ${esc(roman(res.mandato.anoVence))}</span>
      <h2 class="mnd-tit">${ok ? 'CUMPRIDO' : 'NÃO CUMPRIDO'}</h2>
      <div class="mnd-meta"><span class="mnd-meta-k">${esc(res.mandato.titulo)}</span>
        <b>${esc(res.progresso?.texto || '')} ${esc(res.progresso?.rot || '')}</b></div>
      <p class="mnd-fala">${esc(frase(res))}</p>
      <div class="mnd-efeitos">${efeitos}</div>
      <button class="mnd-ok" id="mnd-ok">${ico('chevron-right', 15)} SEGUIR</button>
    </div>`;
  document.body.appendChild(over);
  try { tocarEfeito(ok ? 'radar' : 'alarme', { volume: 0.4 }); } catch { /* sem áudio */ }

  const fechar = () => { over.classList.add('saindo'); setTimeout(() => over.remove(), 260); };
  over.querySelector('#mnd-ok').addEventListener('click', () => { fechar(); onFim?.(); });
  return fechar;
}

const ROT_VAR = { aprovacao: 'Aprovação', estabilidade: 'Estabilidade', soft_power: 'Soft power' };

// A frase do veredito também tem banco — pelo mesmo motivo da tela de fim: cinco
// mandatos por partida, várias partidas, e uma frase fixa vira ruído no terceiro.
// A REINCIDÊNCIA muda o texto: falhar a segunda vez seguida não é "que pena", é o
// gabinete começando a conspirar, e o jogador tem de sentir a diferença.
const OK = [
  'O gabinete não comemora — mas parou de sussurrar no corredor. É o mais perto de elogio que este prédio chega.',
  'Cumprido no prazo. A próxima cobrança já está sendo redigida, e vai ser maior.',
  'Ninguém agradece o que era obrigação. Mas repare: hoje ninguém te contestou.',
];
const FALHA_1 = [
  'Não foi entregue. O gabinete anotou, sorriu para a imprensa e marcou uma reunião que você não vai presidir.',
  'A meta ficou no papel. Um ano ruim ainda é só um ano ruim — desde que seja um só.',
  'Falhou. Ninguém disse nada em voz alta, e é exatamente isso que deveria preocupar.',
];
const FALHA_2 = [
  'A segunda seguida. Agora não é mais incompetência técnica na cabeça deles: é escolha sua. O gabinete começou a conversar sem você na sala.',
  'Duas em sequência. A partir daqui, cada reunião tem uma pauta oculta, e o assunto é a sua cadeira.',
  'Falhou de novo. Quem te sustentava agora precisa explicar por que ainda te sustenta — e ninguém gosta de explicar isso duas vezes.',
];
function frase(res) {
  const lista = res.cumprido ? OK : (res.reincidencia >= 2 ? FALHA_2 : FALHA_1);
  return lista[(res.mandato.n + (res.reincidencia || 0)) % lista.length];
}
