// ═══════════════════════════════════════════════════════════════════════
// CRISE FISCAL — a hora em que a conta chega e alguém tem que assinar
// ═══════════════════════════════════════════════════════════════════════
// Este painel existe porque o jogo antes resolvia a falência sozinho: a dívida
// passava de 200% e a partida acabava. Uma barra esvaziando não é decisão — é
// sentença. Aqui a crise vira o que ela é na vida real: um governo encurralado
// escolhendo QUAL preço vai pagar, sabendo que todos doem em lugares diferentes.
import { opcoesDeCrise, aplicarOpcaoFiscal, estadoFiscal, lerJuros } from '../jogo/fiscal.js';
import { dinheiro } from '../jogo/formato.js';
import { VARS } from '../jogo/vars.js';
import { sirene } from './efeitos.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rot = (k) => VARS[k]?.rotulo || k;

export function abrirCriseFiscal(jogo, { onFim } = {}) {
  const e = jogo.estado;
  const f = estadoFiscal(e);
  const j = lerJuros(e);
  const opcoes = opcoesDeCrise(e);

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  sirene({ ruim: true });

  modal.innerHTML = `<div class="fisc-painel">
    <div class="fisc-cab">
      <span class="fisc-simbolo">${ico('trending-down', 24)}</span>
      <div class="fisc-tit">
        <h2>CRISE FISCAL</h2>
        <div class="fisc-sub">A conta chegou · o gabinete espera sua ordem</div>
      </div>
      <span class="fisc-selo ${f.cls}">${esc(f.rot)}</span>
    </div>

    <div class="fisc-quadro">
      <div class="fisc-cel"><span>Dívida</span><b class="${e.divida >= 120 ? 'ruim' : 'amb'}">${Math.round(e.divida)}%</b><i>do PIB</i></div>
      <div class="fisc-cel"><span>Juro que você paga</span><b class="${j.taxa > 0.11 ? 'ruim' : j.taxa > 0.06 ? 'amb' : 'bom'}">${(j.taxa * 100).toFixed(1)}%</b><i>${esc(j.rot)}</i></div>
      <div class="fisc-cel"><span>Caixa</span><b>${dinheiro(e.tesouro)}</b><i>disponível</i></div>
      <div class="fisc-cel"><span>Confiança</span><b class="${e.temp_economia < 35 ? 'ruim' : 'amb'}">${Math.round(e.temp_economia)}</b><i>do mercado</i></div>
    </div>

    <p class="fisc-lead">${esc(f.txt)} ${esc(j.txt)}</p>
    <div class="fisc-aviso">${ico('info', 13)} Seu país <b>não vai deixar de existir</b> por dever demais — o Japão convive com 250% do PIB. O que derruba governo é o povo perdendo a paciência. Escolha onde doer.</div>

    <div class="fisc-opcoes">
      ${opcoes.map((o) => `
        <button class="fisc-op" data-id="${o.id}">
          <div class="fo-cab"><b>${esc(o.titulo)}</b></div>
          <p class="fo-txt">${esc(o.texto)}</p>
          <div class="fo-efeitos">
            ${Object.entries(o.efeitos).map(([k, v]) => `<span class="fo-ef ${v > 0 ? 'bom' : 'ruim'}">${esc(rot(k))} ${v > 0 ? '+' : ''}${typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : v}</span>`).join('')}
          </div>
          <div class="fo-real">${ico('book-open', 11)} ${esc(o.custoReal)}</div>
        </button>`).join('')}
    </div>
  </div>`;

  modal.querySelectorAll('.fisc-op').forEach((b) => b.addEventListener('click', () => {
    const res = aplicarOpcaoFiscal(jogo.estado, b.dataset.id);
    if (res.falha) return;
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Economia', texto: res.manchete, cor: '#ffb020' }]);
    mostrarDesfecho(res);
  }));

  function mostrarDesfecho(res) {
    const f2 = estadoFiscal(jogo.estado);
    const j2 = lerJuros(jogo.estado);
    modal.innerHTML = `<div class="fisc-painel fisc-fim">
      <div class="fisc-simbolo grande">${ico('landmark', 34)}</div>
      <h2>${esc(res.op.titulo.toUpperCase())}</h2>
      <p class="fisc-lead">${esc(res.manchete)}</p>
      <div class="fisc-grade">
        ${res.mudancas.filter((m) => m.delta).map((m) => `<span class="mud ${m.delta > 0 ? 'bom' : 'ruim'}">${esc(rot(m.chave))} ${m.delta > 0 ? '+' : ''}${m.delta}</span>`).join('')}
      </div>
      <div class="fisc-agora">
        <span class="fisc-selo ${f2.cls}">${esc(f2.rot)}</span>
        <span>Dívida <b>${Math.round(jogo.estado.divida)}%</b> · juro <b>${(j2.taxa * 100).toFixed(1)}%</b></span>
      </div>
      <button class="avancar" id="fisc-ok">SEGUIR GOVERNANDO ${ico('chevron-right', 15)}</button>
    </div>`;
    modal.querySelector('#fisc-ok').addEventListener('click', () => { modal.remove(); onFim?.(); });
  }
}
