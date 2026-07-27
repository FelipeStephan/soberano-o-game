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
import { tempoDe, ACAO_POR_ID } from '../dados/acoes.js';
import { estaDesbloqueada } from '../jogo/desbloqueios.js';
import { registrarFila } from '../jogo/filaComando.js';
// As penas do Conselho de Segurança são predicados puros (não dependem do controlador
// da ONU estar montado) exatamente pra poderem ser checadas aqui, no gargalo da fila.
import { caixaCongelado, armasEmbargadas } from './onu.js';
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
  registrarFila((a) => enfileirar(a)); // encomendas de arsenal (ficha/mercado) entram nesta fila

  function podeEnfileirar(acao) {
    const custo = jogo.custoDe(acao);
    // ── #9 · CAIXA CONGELADO PELO CONSELHO ────────────────────────────
    // A pena mais dura da ONU não tira o seu dinheiro: tira o seu ACESSO a ele. O
    // tesouro continua na HUD, intacto, e nenhuma ordem que custe um centavo sai do
    // papel — é essa dissonância que faz a pena doer. A trava mora aqui, na única
    // porta por onde TODA ordem paga passa; espalhar a checagem pelos painéis seria
    // garantir que um deles ficaria de fora.
    const gelo = caixaCongelado(jogo.estado);
    if (gelo.bloqueado && custo > 0) {
      return { ok: false, motivo: `Caixa CONGELADO pelo Conselho de Segurança — ${gelo.restante} mês(es) restantes. Nenhuma ordem paga sai do papel.` };
    }
    // EMBARGO DE ARMAS: o que está barrado é COMPRAR material (fichas de equipamento e
    // encomendas do mercado carregam `forcas`/`_compraArsenal`). Mobilizar, treinar e
    // mover tropa que você já tem continua liberado — embargo não desarma, só não repõe.
    const compraArsenal = !!(acao?._compraArsenal || acao?.forcas);
    if (compraArsenal) {
      const emb = armasEmbargadas(jogo.estado);
      if (emb.bloqueado) {
        return { ok: false, motivo: `EMBARGO DE ARMAS do Conselho — ${emb.restante} mês(es) restantes. Nenhum fornecedor aceita o pedido.` };
      }
    }
    if (jogo.estado.tesouro < custo) return { ok: false, motivo: 'Sem caixa para esta ordem.' };
    if (fila.length >= MAX_FILA) return { ok: false, motivo: 'Fila cheia — espere concluir.' };
    // REVALIDAÇÃO DOS GATES (auditoria 2026-07-17, fato 5): antes, só caixa e tamanho da
    // fila eram checados — o `disabled` do chip era a única proteção de requer/desbloqueio,
    // e qualquer chamada programática (ou UI defasada) furava o gate. Para ações do
    // CATÁLOGO, revalidamos requer/PA/tesouro via jogo.podeEnfileirar e o desbloqueio via
    // estaDesbloqueada. Ações sintéticas (_marker, investimentos com id derivado etc.)
    // não estão em ACAO_POR_ID e seguem pelo caminho de sempre.
    const daCatalogo = acao?.id && ACAO_POR_ID[acao.id];
    if (daCatalogo) {
      if (!estaDesbloqueada(daCatalogo, jogo.estado)) return { ok: false, motivo: 'Ação ainda bloqueada.' };
      const chk = jogo.podeEnfileirar(acao.id);
      if (!chk.ok) return { ok: false, motivo: chk.motivo || 'Requisito não atendido.' };
    }
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

    // A batida do mundo. MUNDO ÚNICO: numa sala online, SÓ O HOST bate o relógio do
    // mundo — os convidados recebem a batida dele pela rede (beatExterno) e aplicam.
    // Sem isso, cada cliente vivia num mês diferente (o bug do "abril vs outubro").
    ateBeat -= 1;
    if (ateBeat <= 0) {
      ateBeat = BEAT_S;
      const souAutoridade = hooks.souBeatLocal ? hooks.souBeatLocal() : true;
      if (souAutoridade) { const res = jogo.beatMundo(); hooks.aposBeat?.(res); }
    }

    renderFila();
  }

  // A batida VEIO DO HOST (convidado): roda o beat local em sincronia (a seed da sala
  // garante os mesmos dados), aplica o mundo compartilhado por cima e reseta o trilho.
  function beatExterno(dadosHost) {
    if (jogo.fase === 'fim') return null;
    if (Number.isFinite(dadosHost?.turno)) { jogo.turno = dadosHost.turno - 1; jogo.estado.turno = jogo.turno; }
    const res = jogo.beatMundo();
    jogo.aplicarMundoCompartilhado?.(dadosHost);
    ateBeat = BEAT_S;
    hooks.aposBeat?.(res);
    renderFila();
    return res;
  }

  function iniciar() { if (!timer) { timer = setInterval(tick, 1000); } }
  function parar() { if (timer) { clearInterval(timer); timer = null; } }

  // Pinta SÓ a fila + o relógio (barato, roda a cada segundo). O grid de ações é
  // redesenhado só quando muda (enfileirar/cancelar → hooks.render).
  function renderFila() {
    const alvo = document.querySelector('#fila-tempo');
    if (!alvo) return;
    // UMA FILA SÓ: as ações do jogador e as OFENSIVAS EM PREPARO (estado.operacoes, a
    // guerra com tempo do motor) dividem a mesma barra. A operação entra como um chip
    // ⚔ (não cancelável aqui — quem resolve é o motor); a ação continua cancelável.
    const ops = jogo.estado.operacoes || [];
    if (!fila.length && !ops.length) {
      alvo.innerHTML = '<span class="ft-vazia">fila livre — escolha uma ação; ela roda no relógio</span>';
    } else {
      const chipsAcoes = fila.map((it, i) => {
        const pct = Math.max(0, Math.min(100, ((it.tempo - it.restante) / it.tempo) * 100));
        return `<button class="ft-chip ${it.rodando ? 'rodando' : 'espera'}" data-idx="${i}" title="Cancelar e devolver o caixa">
          <span class="ft-ic">${it.acao.icone || ''}</span>
          <span class="ft-nome">${esc(it.acao.nome)}</span>
          <span class="ft-t">${it.rodando ? `${it.restante}s` : 'na fila'}</span>
          <i class="ft-fill" style="width:${pct}%"></i>
          ${ico('x', 10)}
        </button>`;
      });
      const chipsOps = ops.map((o) => {
        const pct = Math.max(0, Math.min(100, ((o.total - o.restante) / o.total) * 100));
        return `<div class="ft-chip op ${o.detectado ? 'detectada' : 'rodando'}">
          <span class="ft-ic">${o.detectado ? '⚠' : '⚔'}</span>
          <span class="ft-nome">${esc(o.alvoNome)}</span>
          <span class="ft-t">${o.detectado ? 'DETECTADA' : `${Math.max(1, o.restante)} ${Math.max(1, o.restante) > 1 ? 'meses' : 'mês'}`}</span>
          <i class="ft-fill" style="width:${pct}%"></i>
        </div>`;
      });
      alvo.innerHTML = [...chipsAcoes, ...chipsOps].join('');
      alvo.querySelectorAll('.ft-chip[data-idx]').forEach((b) => b.addEventListener('click', () => cancelar(Number(b.dataset.idx))));
    }
    const rel = document.querySelector('#tr-relogio');
    if (rel) rel.textContent = fmtTempo(jogo.estado.relogio.segundos);
    const bt = document.querySelector('#tr-beat');
    if (bt) bt.style.width = `${Math.max(0, Math.min(100, (1 - ateBeat / BEAT_S) * 100))}%`;
  }

  return { enfileirar, cancelar, podeEnfileirar, iniciar, parar, renderFila, beatExterno, CAP, BEAT_S,
    get fila() { return fila; }, get segundos() { return jogo.estado.relogio.segundos; }, get ateBeat() { return ateBeat; } };
}

// mm:ss de tempo de JOGO
function fmtTempo(s) {
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
