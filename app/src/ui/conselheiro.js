// ═══════════════════════════════════════════════════════════════════════
// PAINEL DO CONSELHEIRO — o briefing de gabinete antes da jogada
// ═══════════════════════════════════════════════════════════════════════
// A ergonomia aqui é de ALÍVIO: a tela de guerra assusta, a nuclear pesa; esta acolhe.
// Você abre, o gabinete "analisa" por um instante, e volta com a leitura da mesa e de 2
// a 4 cartões de recomendação. Cada cartão diz O QUE fazer e POR QUÊ — e, quando existe
// ação real por trás, um botão enfileira aquilo com um clique, sem você caçar no console.
//
// Um selo no cabeçalho é honesto sobre a fonte: 'A MÁQUINA ACONSELHA' quando veio da IA,
// 'ANÁLISE LOCAL' quando é a heurística de reserva. O jogador merece saber quem falou.
import { gerarConselho } from '../jogo/conselheiro.js';
import { ACAO_POR_ID } from '../dados/acoes.js';
import { dinheiro } from '../jogo/formato.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const URG = {
  alta: { rot: 'URGENTE', cls: 'urg-alta' },
  media: { rot: 'IMPORTANTE', cls: 'urg-media' },
  baixa: { rot: 'DE OLHO', cls: 'urg-baixa' },
};

export function abrirConselheiro(jogo, { onAplicar, onFim } = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);

  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
  const sair = () => { fechar(); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', tecla);

  // Cabeçalho fixo + corpo que troca de "analisando" para o resultado.
  const cabecalho = (selo) => `
    <div class="cs-cab">
      <span class="cs-simbolo">${ico('brain', 24)}</span>
      <div class="cs-tit">
        <h2>CONSELHEIRO</h2>
        <div class="cs-sub">Briefing de gabinete · turno ${jogo.turno ?? '?'}</div>
      </div>
      ${selo}
      <button class="pp-fechar" id="cs-x">${ico('x', 16)}</button>
    </div>`;

  const pintar = (corpo, selo = '') => {
    modal.innerHTML = `<div class="cs-painel">${cabecalho(selo)}${corpo}</div>`;
    modal.querySelector('#cs-x').addEventListener('click', sair);
  };

  // Fundo fecha só fora dos cartões (não no meio de uma leitura).
  modal.addEventListener('click', (ev) => { if (ev.target === modal) sair(); });

  // ── Estado 1: analisando ──────────────────────────────────────────────
  pintar(`
    <div class="cs-analise">
      <div class="cs-spinner">${ico('loader', 30)}</div>
      <div class="cs-analise-txt">
        <b>O gabinete está lendo a mesa…</b>
        <span>Cruzando indicadores, guerras abertas, caixa e relações para montar sua recomendação.</span>
      </div>
    </div>`);

  // ── Gera (IA ou local) e pinta o resultado ────────────────────────────
  gerarConselho(jogo, {}).then((conselho) => {
    if (!modal.isConnected) return; // jogador já fechou
    renderResultado(conselho);
  }).catch(() => {
    if (!modal.isConnected) return;
    pintar(`<div class="cs-erro">${ico('triangle-alert', 16)} O gabinete não conseguiu fechar a análise. Confie no seu faro neste turno.</div>`);
  });

  function renderResultado(conselho) {
    const daIA = conselho.fonte === 'ia';
    const selo = `<span class="cs-fonte ${daIA ? 'cs-fonte-ia' : 'cs-fonte-local'}">
      ${ico(daIA ? 'sparkles' : 'cpu', 12)} ${daIA ? 'A MÁQUINA ACONSELHA' : 'ANÁLISE LOCAL'}</span>`;

    const cartoes = conselho.sugestoes.map((sug, i) => cartao(sug, i)).join('');

    pintar(`
      <div class="cs-leitura">${ico('quote', 14)}<p>${esc(conselho.leitura)}</p></div>
      <div class="cs-lista">${cartoes}</div>
      <div class="cs-rodape">${ico('info', 12)} ${daIA
        ? 'Recomendações da Máquina no seu papel de conselheira. A decisão — e a conta — continuam sendo suas.'
        : 'IA indisponível: análise gerada localmente a partir do estado. Mais previsível, sempre honesta.'}</div>`, selo);

    // Liga os botões "Enfileirar esta ação".
    modal.querySelectorAll('.cs-aplicar').forEach((btn) => {
      btn.addEventListener('click', () => {
        const acao = ACAO_POR_ID[btn.dataset.acao];
        if (!acao) return;
        const res = jogo.enfileirarCustom(acao);
        const cartaoEl = btn.closest('.cs-cartao');
        if (res.ok) {
          cartaoEl.classList.add('cs-feito');
          btn.outerHTML = `<div class="cs-ok">${ico('check', 14)} Ação enfileirada para este turno</div>`;
          onAplicar?.(acao);
        } else {
          btn.disabled = true;
          const motivo = res.motivo || 'não foi possível enfileirar';
          btn.insertAdjacentHTML('afterend', `<div class="cs-falha">${ico('ban', 13)} ${esc(motivo)}</div>`);
        }
      });
    });
  }

  function cartao(sug, i) {
    const u = URG[sug.urgencia] || URG.media;
    const acao = sug.acaoId ? ACAO_POR_ID[sug.acaoId] : null;
    const custoTxt = acao && acao.custo ? ` · ${dinheiro(acao.custo)}` : '';
    return `<div class="cs-cartao ${u.cls}" style="animation-delay:${i * 60}ms">
      <div class="cs-c-topo">
        <span class="cs-urg">${u.rot}</span>
        <b class="cs-c-tit">${esc(sug.titulo)}</b>
      </div>
      <p class="cs-c-porque">${esc(sug.porque)}</p>
      ${acao ? `<button class="cs-aplicar" data-acao="${esc(sug.acaoId)}">
          ${ico('plus', 14)} <span>Enfileirar: ${esc(acao.nome)}</span>
          <i class="cs-custo">${acao.custoPA || 1} PA${custoTxt}</i>
        </button>` : `<div class="cs-livre">${ico('compass', 13)} Conselho estratégico — sua chamada</div>`}
    </div>`;
  }
}
