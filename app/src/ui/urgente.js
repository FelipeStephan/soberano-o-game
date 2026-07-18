// POPUP URGENTE com cronômetro. Dispara sozinho durante o planejamento.
// Não decidiu a tempo? A opção padrão cai na sua cabeça.
import { sortearFlash } from '../dados/urgentes.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { aplicarPolitico } from '../jogo/politico.js';
import { flashTela } from './efeitos.js';
import { tocarEfeito } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let timerAgendado = null;

// Agenda o próximo flash urgente (chamar ao entrar na fase de planejamento).
// ── RITMO ─────────────────────────────────────────────────────────────
// ERA 12–38s. O jogador levava um flash urgente atrás do outro, sem respiro, e o
// que devia ser uma interrupção rara e assustadora virou spam ignorável. Urgência
// que acontece o tempo todo deixa de ser urgência.
//
// Agora 150–320s, no MÁXIMO um por turno E com 40% dos turnos SEM flash nenhum
// (o dono pediu MENOS urgência ainda: susto raro é susto de verdade).
const ATRASO_MIN = 150000;
const ATRASO_VAR = 170000;
const CHANCE_TURNO_QUIETO = 0.4;
let flashNesteTurno = 0;
let turnoDoFlash = -1;

export function agendarFlash(jogo, aoResolver) {
  cancelarFlash();
  // Um por turno. Dois seguidos no mesmo turno é o que fazia parecer metralhadora.
  if (turnoDoFlash !== jogo.turno) {
    turnoDoFlash = jogo.turno;
    // sorteia já na virada: turno quieto fica quieto até o fim (não re-sorteia a cada agendamento)
    flashNesteTurno = Math.random() < CHANCE_TURNO_QUIETO ? 1 : 0;
  }
  if (flashNesteTurno >= 1) return;

  const atraso = ATRASO_MIN + Math.random() * ATRASO_VAR;
  timerAgendado = setTimeout(() => {
    if (jogo.fase !== 'planejamento') return;
    // NUNCA por cima de outra cena. Um aviso de gabinete estourando no meio de uma
    // ofensiva de 60 segundos destrói exatamente o clímax que a ofensiva construiu.
    if (document.querySelector('.modal-fundo') || document.querySelector('.lg-barra')) {
      agendarFlash(jogo, aoResolver);   // tenta de novo mais tarde, sem atropelar
      return;
    }
    const flash = sortearFlash(jogo.estado);
    if (flash) { flashNesteTurno += 1; mostrarFlash(flash, jogo, aoResolver); }
  }, atraso);
}

export function cancelarFlash() {
  if (timerAgendado) { clearTimeout(timerAgendado); timerAgendado = null; }
}

function mostrarFlash(flash, jogo, aoResolver) {
  // guarda a instância pra PARAR quando a ação for resolvida (o alarme não pode
  // continuar tocando depois que o jogador decide).
  const somAlarme = tocarEfeito('alarme', { volume: 0.5 });
  const pararAlarme = () => { if (somAlarme) { try { somAlarme.pause(); somAlarme.currentTime = 0; } catch {} } };
  flashTela(true);

  const modal = document.createElement('div');
  modal.className = 'modal-fundo urgente';
  modal.innerHTML = `<div class="urg-card">
    <div class="urg-luz"></div>
    <div class="urg-topo">
      <span class="urg-tag">⚠ ${esc(flash.tag)}</span>
      <span class="urg-relogio" id="urg-rel">${flash.tempo}s</span>
    </div>
    <div class="urg-barra"><div class="urg-fill" id="urg-fill"></div></div>
    <h2 class="urg-tit">${esc(flash.titulo)}</h2>
    <div class="urg-txt">${esc(flash.texto)}</div>
    <div class="urg-opcoes">
      ${flash.opcoes.map((o, i) => `<button class="urg-op" data-i="${i}">${esc(o.texto)}</button>`).join('')}
    </div>
  </div>`;
  document.body.appendChild(modal);

  const fill = modal.querySelector('#urg-fill');
  const rel = modal.querySelector('#urg-rel');
  const t0 = performance.now();
  const dur = flash.tempo * 1000;
  let acabou = false;

  const tick = () => {
    if (acabou) return;
    const passou = performance.now() - t0;
    const restante = Math.max(0, dur - passou);
    fill.style.width = `${(restante / dur) * 100}%`;
    rel.textContent = `${Math.ceil(restante / 1000)}s`;
    if (restante <= dur * 0.35) modal.querySelector('.urg-card').classList.add('critico');
    if (restante <= 0) { escolher(null); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  function escolher(i) {
    if (acabou) return;
    acabou = true;
    pararAlarme();   // decidiu (ou o tempo esgotou) → o alarme cala
    let efeitos; let politico = null; let nota;
    if (i === null) {
      efeitos = flash.efeitosPadrao || flash.opcoes[flash.padrao]?.efeitos || {};
      nota = flash.padraoTexto || 'Você não decidiu. O mundo decidiu por você.';
    } else {
      efeitos = flash.opcoes[i].efeitos || {};
      politico = flash.opcoes[i].politico;
      nota = `Decisão tomada: “${flash.opcoes[i].texto}”.`;
    }
    const mud = aplicarEfeitos(jogo.estado, efeitos);
    aplicarPolitico(jogo.estado, politico);
    jogo.registrarFlash?.(flash, i, nota);

    modal.querySelector('.urg-card').innerHTML = `
      <div class="urg-desfecho ${i === null ? 'ruim' : ''}">
        <div class="urg-d-tag">${i === null ? '⏱ TEMPO ESGOTADO' : '✔ ORDEM DADA'}</div>
        <div class="urg-d-txt">${esc(nota)}</div>
        <div class="urg-d-mud" id="urg-mud"></div>
        <button class="avancar" id="urg-ok">CONTINUAR ▸</button>
      </div>`;
    modal.querySelector('#urg-mud').innerHTML = mud.filter((m) => m.delta)
      .map((m) => `<span class="mud ${m.delta > 0 ? 'bom' : 'ruim'}">${m.chave} <b>${m.delta > 0 ? '+' : ''}${Math.round(m.delta * 100) / 100}</b></span>`).join('');
    modal.querySelector('#urg-ok').addEventListener('click', () => { modal.remove(); aoResolver?.(); });
  }

  modal.querySelectorAll('.urg-op').forEach((b) => b.addEventListener('click', () => escolher(Number(b.dataset.i))));
}
