// ═══════════════════════════════════════════════════════════════════════
// MODO TEMPO REAL — o relógio que substitui o "passar turno"
// ═══════════════════════════════════════════════════════════════════════
// O jogo deixa de ser por turnos: um RELÓGIO central corre sozinho. Cada ação leva
// SEGUNDOS pra concluir (barra rodando na fila), até um limite de ações simultâneas
// (a "capacidade de comando"). A cada BATIDA (~30s de jogo) o mundo avança de verdade —
// economia, guerras NPC, invasões — via jogo.beatMundo(). É esse tempo que dá espaço
// pra inteligência detectar um ataque antes de ele acontecer (ver detecção no motor).
//
// O controlador é dono APENAS da fila de ações do jogador e do relógio. Tudo que muda o
// mundo mora no motor (beatMundo/executarAcaoTempo) — aqui só orquestramos o tempo.
import { tempoDe } from '../dados/acoes.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function criarTempoReal(jogo, hooks = {}) {
  const CAP = 2;            // ações rodando ao mesmo tempo (capacidade de comando)
  const BEAT_S = 30;        // a cada 30s de jogo, o mundo dá uma batida
  const MAX_FILA = 6;
  let fila = [];            // [{ acao, custoPago, tempo, restante, rodando }]
  let ateBeat = BEAT_S;
  let timer = null;
  jogo.estado.relogio = jogo.estado.relogio || { segundos: 0 };

  function podeEnfileirar(acao) {
    const custo = jogo.custoDe(acao);
    if (jogo.estado.tesouro < custo) return { ok: false, motivo: 'Sem caixa para esta ordem.' };
    if (fila.length >= MAX_FILA) return { ok: false, motivo: 'Fila cheia — espere concluir.' };
    return { ok: true, custo };
  }

  // Enfileira uma ação (paga o dinheiro na hora; o TEMPO corre na fila).
  function enfileirar(acao) {
    const chk = podeEnfileirar(acao);
    if (!chk.ok) return chk;
    jogo.estado.tesouro = Math.round((jogo.estado.tesouro - chk.custo) * 100) / 100;
    const t = tempoDe(acao);
    fila.push({ acao, custoPago: chk.custo, tempo: t, restante: t, rodando: false });
    hooks.render?.();
    return { ok: true };
  }

  function cancelar(idx) {
    const it = fila[idx];
    if (!it) return;
    jogo.estado.tesouro = Math.round((jogo.estado.tesouro + it.custoPago) * 100) / 100;  // devolve o caixa
    fila.splice(idx, 1);
    hooks.render?.();
  }

  // A batida do relógio (1s de jogo). Avança as ações rodando e, na hora certa, o mundo.
  function tick() {
    if (jogo.fase === 'fim') { parar(); return; }
    // PAUSA enquanto uma cena grande ou um modal está aberto (ofensiva, carta, mercado,
    // flash urgente, decisão de país…) — o mundo espera o jogador sair; senão a economia
    // corre por baixo de um modal e uma batida empilha outra cena por cima da atual.
    if (document.querySelector('.lg-barra') || document.querySelector('.carta-wrap .cena')
      || document.querySelector('.defesa-modal') || document.querySelector('.modal-fundo')) return;

    jogo.estado.relogio.segundos += 1;

    // Ativa ações até a capacidade de comando; avança as que já rodam.
    let rodando = fila.filter((f) => f.rodando).length;
    for (const it of fila) { if (rodando >= CAP) break; if (!it.rodando) { it.rodando = true; rodando += 1; } }
    const concluidas = [];
    for (const it of fila) { if (it.rodando) { it.restante -= 1; if (it.restante <= 0) concluidas.push(it); } }
    for (const it of concluidas) {
      fila = fila.filter((f) => f !== it);
      const res = jogo.executarAcaoTempo(it.acao, it.custoPago);
      hooks.aposAcao?.(res, it.acao);
    }

    // A batida do mundo.
    ateBeat -= 1;
    if (ateBeat <= 0) { ateBeat = BEAT_S; const res = jogo.beatMundo(); hooks.aposBeat?.(res); }

    renderFila();
  }

  function iniciar() { if (!timer) { timer = setInterval(tick, 1000); } }
  function parar() { if (timer) { clearInterval(timer); timer = null; } }

  // Pinta SÓ a fila + o relógio (barato, roda a cada segundo). O grid de ações é
  // redesenhado só quando muda (enfileirar/cancelar → hooks.render).
  function renderFila() {
    const alvo = document.querySelector('#fila-tempo');
    if (!alvo) return;
    if (!fila.length) {
      alvo.innerHTML = '<span class="ft-vazia">fila livre — escolha uma ação; ela roda no relógio</span>';
    } else {
      alvo.innerHTML = fila.map((it, i) => {
        const pct = Math.max(0, Math.min(100, ((it.tempo - it.restante) / it.tempo) * 100));
        return `<button class="ft-chip ${it.rodando ? 'rodando' : 'espera'}" data-idx="${i}" title="Cancelar e devolver o caixa">
          <span class="ft-ic">${it.acao.icone || ''}</span>
          <span class="ft-nome">${esc(it.acao.nome)}</span>
          <span class="ft-t">${it.rodando ? `${it.restante}s` : 'na fila'}</span>
          <i class="ft-fill" style="width:${pct}%"></i>
          ${ico('x', 10)}
        </button>`;
      }).join('');
      alvo.querySelectorAll('.ft-chip').forEach((b) => b.addEventListener('click', () => cancelar(Number(b.dataset.idx))));
    }
    const rel = document.querySelector('#tr-relogio');
    if (rel) rel.textContent = fmtTempo(jogo.estado.relogio.segundos);
    const bt = document.querySelector('#tr-beat');
    if (bt) bt.style.width = `${Math.max(0, Math.min(100, (1 - ateBeat / BEAT_S) * 100))}%`;
    renderOperacoes();
  }

  // OFENSIVAS EM PREPARO — as MINHAS operações se montando (guerra com tempo). Mostra
  // progresso e se o alvo já detectou. Pintado por batida, junto da fila.
  function renderOperacoes() {
    const barra = document.querySelector('#op-barra');
    const alvo = document.querySelector('#fila-op');
    if (!barra || !alvo) return;
    const ops = jogo.estado.operacoes || [];
    barra.style.display = ops.length ? '' : 'none';
    if (!ops.length) { alvo.innerHTML = ''; return; }
    alvo.innerHTML = ops.map((o) => {
      const pct = Math.max(0, Math.min(100, ((o.total - o.restante) / o.total) * 100));
      return `<div class="ft-chip op ${o.detectado ? 'detectada' : 'rodando'}">
        <span class="ft-ic">${o.detectado ? '⚠' : '⚔'}</span>
        <span class="ft-nome">${esc(o.alvoNome)}</span>
        <span class="ft-t">${o.detectado ? 'DETECTADA' : `${Math.max(1, o.restante)} batida(s)`}</span>
        <i class="ft-fill" style="width:${pct}%"></i>
      </div>`;
    }).join('');
  }

  return { enfileirar, cancelar, podeEnfileirar, iniciar, parar, renderFila, CAP, BEAT_S,
    get fila() { return fila; }, get segundos() { return jogo.estado.relogio.segundos; }, get ateBeat() { return ateBeat; } };
}

// mm:ss de tempo de JOGO
function fmtTempo(s) {
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
