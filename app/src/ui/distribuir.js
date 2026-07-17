// ═══════════════════════════════════════════════════════════════════════
// DISTRIBUIÇÃO AUTOMÁTICA DE TROPAS — o fim do "estado por estado na mão"
// ═══════════════════════════════════════════════════════════════════════
// Abre pela insígnia da SUA nação. Pega toda a reserva do quartel e espalha pelos
// seus estados segundo uma doutrina que VOCÊ escolhe — defesa de fronteira, cobertura
// uniforme ou concentração na capital. O ajuste fino continua no clique por estado.
import { ico } from './icones.js';
import { distribuirAuto, tropaLivre, estadosDe } from '../jogo/territorio.js';
import { UNIDADE_POR_ID } from '../dados/forcas.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

const DOUTRINAS = [
  { id: 'fronteira', ic: 'shield', rot: 'DEFESA DE FRONTEIRA', desc: 'Concentra a tropa perto de quem você está em guerra. Se ninguém te ameaça, protege o coração do país.' },
  { id: 'uniforme', ic: 'grid-3x3', rot: 'COBERTURA UNIFORME', desc: 'Espalha igual por todos os estados. Ninguém fica descoberto, ninguém fica forte.' },
  { id: 'capital', ic: 'landmark', rot: 'MURALHA DA CAPITAL', desc: 'Empilha o grosso na capital e no núcleo. Aposta tudo em segurar o centro do poder.' },
];

export function abrirDistribuir(jogo, { onFim, globoCtrl } = {}) {
  if (document.querySelector('.dist-modal')) return;
  const estado = jogo.estado;
  const meuIso = estado.iso || 'USA';

  const modal = document.createElement('div');
  modal.className = 'modal-fundo dist-modal';
  document.body.appendChild(modal);
  let modo = 'fronteira';

  function forcaLivre() {
    const livre = tropaLivre(estado);
    return Object.entries(livre).reduce((t, [u, q]) => t + (u === 'ogivas' ? 0 : (q || 0) * (UNIDADE_POR_ID[u]?.poder || 0)), 0);
  }
  function totalLivre() {
    const livre = tropaLivre(estado);
    return Object.entries(livre).reduce((t, [u, q]) => t + (u === 'ogivas' ? 0 : (q || 0)), 0);
  }

  function render() {
    const nEstados = estadosDe(meuIso).length;
    const livreTot = totalLivre();
    modal.innerHTML = `<div class="dist-painel">
      <div class="dist-cab">
        <div class="dist-ic">${ico('network', 20)}</div>
        <div class="dist-tit"><h2>DISTRIBUIR TROPAS</h2><span>${esc(jogo.ficha.pais)} · ${nEstados} estados · <b>${fmt(livreTot)}</b> em reserva</span></div>
        <button class="pp-fechar dist-x">${ico('x', 16)}</button>
      </div>

      ${nEstados === 0 ? `<div class="dist-vazio">${ico('info', 16)} Seu país não tem estados mapeados — a defesa aqui é no agregado.</div>`
        : livreTot <= 0 ? `<div class="dist-vazio">${ico('info', 16)} Não há tropa em reserva no quartel. Tudo já está posicionado ou você não tem exército sobrando.</div>`
        : `
        <p class="dist-intro">Escolha a doutrina. Toda a reserva vai pros estados de uma vez — depois, clique num estado no mapa pra ajustar na mão.</p>
        <div class="dist-doutrinas">
          ${DOUTRINAS.map((d) => `<button class="dist-op ${modo === d.id ? 'on' : ''}" data-modo="${d.id}">
            <div class="dop-ic">${ico(d.ic, 18)}</div>
            <div class="dop-txt"><b>${d.rot}</b><span>${esc(d.desc)}</span></div>
            <i class="dop-check">${ico('check', 14)}</i>
          </button>`).join('')}
        </div>
        <button class="dist-aplicar" id="dist-go">${ico('send', 15)} DISTRIBUIR AGORA</button>
      `}
    </div>`;

    modal.querySelector('.dist-x').addEventListener('click', fechar);
    modal.querySelectorAll('.dist-op').forEach((b) => b.addEventListener('click', () => { modo = b.dataset.modo; render(); }));
    modal.querySelector('#dist-go')?.addEventListener('click', aplicar);
  }

  function aplicar() {
    const r = distribuirAuto(estado, { modo, ondeEsta: (iso) => globoCtrl?.ondeEsta?.(iso) });
    if (!r.ok) { avisar(r.motivo); return; }
    globoCtrl?.atualizar?.();
    const resumo = Object.entries(r.movido).map(([u, q]) => `${fmt(q)} ${UNIDADE_POR_ID[u]?.nome || u}`).join(' · ');
    modal.querySelector('.dist-painel').innerHTML = `<div class="dist-feito">
      <div class="dist-ok-ic">${ico('shield-check', 30)}</div>
      <h2>TROPAS POSICIONADAS</h2>
      <p>${DOUTRINAS.find((d) => d.id === r.modo)?.rot} — reforço espalhado por <b>${r.estados}</b> estado(s).</p>
      <div class="dist-resumo">${esc(resumo)}</div>
      <button class="dist-aplicar" id="dist-fim">${ico('check', 15)} PRONTO</button>
    </div>`;
    modal.querySelector('#dist-fim').addEventListener('click', fechar);
  }

  function avisar(msg) {
    const el = modal.querySelector('.dist-intro') || modal.querySelector('.dist-vazio');
    if (el) { el.textContent = msg; el.classList.add('erro'); }
  }

  function fechar() { modal.remove(); onFim?.(); }
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
  render();
}
