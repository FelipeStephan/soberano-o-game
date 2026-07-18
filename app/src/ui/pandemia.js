// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE PANDEMIA — o jogador finalmente PODE agir contra a doença
// ═══════════════════════════════════════════════════════════════════════
// Status (gravidade, fase, mortos, tendência, cura, contenção) + ações escaláveis que
// ENFILEIRAM na fila do tempo real (custam segundos e caixa) em vez de resolver na hora.
// Doença pequena mina com um aporte; grande exige campanha. No pré-surto o nome é oculto.
import { opcoesPandemia, dificuldadeDe } from '../jogo/pandemiaAcoes.js';
import { tendenciaPandemia } from '../jogo/mundoVivo.js';
import { dinheiro } from '../jogo/formato.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function abrirPandemia(dados, jogo, { tr, onFim } = {}) {
  const pd = dados?.ref;
  if (!pd) return;
  if (document.querySelector('.pdm-modal')) return;
  const modal = document.createElement('div');
  modal.className = 'modal-fundo pdm-modal';
  document.body.appendChild(modal);
  const fechar = () => modal.remove();
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

  let valorSlider = Math.min(0.5, Math.max(0.1, Math.floor((jogo.estado.tesouro || 0) * 2) / 10));

  function render() {
    const vivo = (jogo.estado.pandemias || []).some((x) => x.id === pd.id);
    if (!vivo) { modal.innerHTML = `<div class="pdm-painel"><div class="pdm-fim">${ico('check-circle', 22)} A emergência de ${esc(pd.nome)} foi encerrada.</div><button class="pdm-x2" id="pdm-ok">FECHAR</button></div>`; modal.querySelector('#pdm-ok').addEventListener('click', fechar); return; }
    const presurto = pd.fase === 'presurto';
    const g = Math.round(pd.gravidade || 0);
    const dif = dificuldadeDe(pd.gravidade || 0);
    const tend = tendenciaPandemia(pd);
    const tendIco = tend === 'crescendo' ? '▲' : tend === 'recuando' ? '▼' : '▬';
    const tendCor = tend === 'crescendo' ? 'var(--perigo)' : tend === 'recuando' ? 'var(--verde,#22e0a0)' : 'var(--fraco)';
    const { ops } = opcoesPandemia(pd, jogo.estado, valorSlider);

    modal.innerHTML = `<div class="pdm-painel">
      <div class="pdm-cab ${presurto ? 'presurto' : ''}">
        <div class="pdm-ic">${ico(presurto ? 'help-circle' : 'biohazard', 20)}</div>
        <div class="pdm-tit">
          <h2>${presurto ? 'AGENTE NÃO IDENTIFICADO' : esc(pd.nome)}</h2>
          <span>${presurto ? 'Rumor não confirmado — agir cedo é muito mais barato' : `${esc(pd.tipo)} · ${esc(pd.fase.toUpperCase())}`}</span>
        </div>
        <button class="pp-fechar pdm-x">${ico('x', 16)}</button>
      </div>

      ${!presurto && pd.historia ? `<div class="pdm-historia">${ico('book-open', 12)} <span>${esc(pd.historia)}</span></div>` : ''}

      <div class="pdm-status">
        <div class="pdm-grav">
          <div class="pdm-grav-top"><span>GRAVIDADE</span><b style="color:${dif.cor}">${g}/100 · ${dif.rot}</b><i style="color:${tendCor}">${tendIco} ${tend}</i></div>
          <div class="pdm-grav-barra"><div style="width:${g}%;background:linear-gradient(90deg,var(--ambar),var(--perigo))"></div></div>
        </div>
        <div class="pdm-cels">
          ${presurto ? '' : `<div class="pdm-cel"><span>Países</span><b>${(pd.paises || []).length}</b></div>
          <div class="pdm-cel"><span>Mortos</span><b>${(pd.mortos || 0).toLocaleString('pt-BR')}</b></div>`}
          <div class="pdm-cel"><span>Cura</span><b class="ciano">${Math.round(pd.curaAcumulada || 0)}%</b></div>
          <div class="pdm-cel"><span>Contenção</span><b class="roxo">${Math.round(pd.contencaoAcumulada || 0)}%</b></div>
        </div>
        ${(!presurto && pd.paises?.length) ? `<div class="pdm-flags">${pd.paises.slice(0, 12).map((c) => `<img src="${bandeira(ISO2_DE[c], 40) || ''}" alt="" onerror="this.style.display='none'">`).join('')}${pd.paises.includes(jogo.estado.iso) ? '<span class="pdm-voce">inclui SEU país</span>' : ''}</div>` : ''}
      </div>

      <div class="pdm-acoes">${ops.map((op, i) => `
        <button class="pdm-acao ${op.bloqueada ? 'bloq' : ''}" data-i="${i}" ${op.bloqueada || (op.custo > (jogo.estado.tesouro || 0)) ? 'disabled' : ''}
          ${op.bloqueada ? `data-tip="${esc(op.desc)}"` : ''}>
          <span class="pdm-a-ic">${ico(op.ic, 16)}</span>
          <span class="pdm-a-corpo"><b>${esc(op.rot)}</b><small>${esc(op.desc)}</small></span>
          <span class="pdm-a-meta">${dinheiro(op.custo)}<i>${ico('clock', 10)} ${op.tempo}s</i></span>
        </button>
        ${op.escalavel ? `<div class="pdm-slider-wrap">
          <input type="range" class="pdm-slider" id="pdm-sl" min="0.1" max="${Math.max(0.1, Math.floor((jogo.estado.tesouro || 0.1) * 10) / 10)}" step="0.1" value="${valorSlider}">
          <span class="pdm-sl-val">${dinheiro(valorSlider)}</span>
        </div>` : ''}`).join('')}
      </div>
      <div class="pdm-rodape">${ico('info', 12)} As ordens rodam na FILA DE COMANDO (embaixo). O resultado chega quando o tempo delas fecha.</div>
    </div>`;

    modal.querySelector('.pdm-x').addEventListener('click', fechar);
    const sl = modal.querySelector('#pdm-sl');
    if (sl) sl.addEventListener('input', (e) => { valorSlider = Number(e.target.value) || 0.1; modal.querySelector('.pdm-sl-val').textContent = dinheiro(valorSlider); modal.querySelectorAll('.pdm-acao').forEach((b) => { const o = ops[Number(b.dataset.i)]; if (o?.escalavel) { b.querySelector('.pdm-a-meta').firstChild.textContent = dinheiro(valorSlider); } }); });
    modal.querySelectorAll('.pdm-acao:not(.bloq)').forEach((b) => b.addEventListener('click', () => {
      const op = opcoesPandemia(pd, jogo.estado, valorSlider).ops[Number(b.dataset.i)];
      if (!op || op.bloqueada) return;
      const acao = {
        id: `pandemia_${op.id}_${pd.id}_${Date.now()}`,
        nome: `${op.rot} — ${pd.fase === 'presurto' ? 'foco' : pd.nome}`,
        icone: '🧬', categoria: 'Saúde', custo: op.custo, custoPA: 1, tempo: op.tempo, prob: op.prob,
        efeitos: op.efeitos || {}, efeitos_falha: op.efeitos_falha || {},
        pandemiaAlvo: { ...op.pandemiaAlvo, pandemiaId: pd.id },
      };
      const r = tr?.enfileirar(acao);
      if (r && !r.ok) { const rod = modal.querySelector('.pdm-rodape'); if (rod) rod.innerHTML = `<b style="color:var(--perigo)">${ico('triangle-alert', 12)} ${esc(r.motivo || 'Não deu para enfileirar.')}</b>`; return; }
      fechar(); onFim?.();
    }));
  }
  render();
}
