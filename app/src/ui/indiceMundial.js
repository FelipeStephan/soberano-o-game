// ═══════════════════════════════════════════════════════════════════════
// ÍNDICE MUNDIAL — o painel do ranking global
// ═══════════════════════════════════════════════════════════════════════
// Abas de PIB / Militar / Petróleo / Território / Crescimento. Cada linha traz posição,
// bandeira, valor e a variação desde o turno passado. A SUA nação vem destacada e o
// topo mostra "Você: 7º". Um narrador de IA resume a régua numa frase (com fallback).
import { montarIndice } from '../jogo/indiceMundial.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { ico } from './icones.js';
import { chamarIA } from '../maquina/openrouter.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ABAS = ['pib', 'militar', 'petroleo', 'territorio', 'crescimento'];
const cacheNarr = {};   // narração da IA por métrica (não repete a chamada ao trocar de aba)

export function abrirIndiceMundial(jogo) {
  if (document.querySelector('.im-modal')) return;
  const idx = montarIndice(jogo.estado);
  const meu = jogo.ficha?.pais || 'sua nação';
  let atual = 'pib';

  const modal = document.createElement('div');
  modal.className = 'modal-fundo im-modal';
  document.body.appendChild(modal);
  const fechar = () => modal.remove();
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  function seta(delta) {
    if (!delta) return '<span class="im-d zero">–</span>';
    return delta > 0 ? `<span class="im-d sobe">▲ ${fmtD(delta)}</span>` : `<span class="im-d cai">▼ ${fmtD(Math.abs(delta))}</span>`;
  }
  function fmtD(v) { return Number.isInteger(v) ? v : v.toFixed(2); }

  function listaHTML(metrica) {
    const bloco = idx[metrica];
    if (!bloco?.linhas.length) return `<div class="im-vazio">${ico('info', 15)} Sem dados para esta régua ainda.</div>`;
    return bloco.linhas.slice(0, 24).map((l, i) => `
      <div class="im-linha ${l.eu ? 'eu' : ''}" style="animation-delay:${(i * 0.02).toFixed(2)}s">
        <span class="im-pos">${l.pos}º</span>
        <img class="im-flag" src="${bandeira(ISO2_DE[l.iso], 40) || ''}" alt="" onerror="this.style.visibility='hidden'">
        <span class="im-nome">${esc(l.nome)}${l.eu ? ' <i>você</i>' : ''}</span>
        <span class="im-val">${esc(l.fmt)}</span>
        ${metrica === 'crescimento' ? '' : seta(l.delta)}
      </div>`).join('');
  }

  function render() {
    const bloco = idx[atual];
    const euPos = bloco?.euPos;
    modal.innerHTML = `<div class="im-painel">
      <div class="im-cab">
        <div class="im-ic">${ico('trophy', 20)}</div>
        <div class="im-tit"><h2>ÍNDICE MUNDIAL</h2><span>O placar do planeta — o mesmo pra todos os jogadores</span></div>
        <button class="pp-fechar im-x">${ico('x', 16)}</button>
      </div>
      <div class="im-abas">
        ${ABAS.map((m) => `<button class="im-aba ${m === atual ? 'on' : ''}" data-m="${m}">${ico(idx[m].ic, 13)} ${esc(idx[m].rot)}</button>`).join('')}
      </div>
      <div class="im-eu">${euPos ? `${ico('user', 12)} Sua posição em <b>${esc(bloco.rot)}</b>: <b class="im-eu-pos">${euPos}º</b> de ${bloco.linhas.length}` : `${ico('user', 12)} ${esc(meu)} ainda não pontua nesta régua.`}</div>
      <div class="im-narr" id="im-narr"><i class="im-narr-load">${ico('loader', 12)} lendo o tabuleiro…</i></div>
      <div class="im-lista">${listaHTML(atual)}</div>
    </div>`;
    modal.querySelector('.im-x').addEventListener('click', fechar);
    modal.querySelectorAll('.im-aba').forEach((b) => b.addEventListener('click', () => { atual = b.dataset.m; render(); }));
    narrar(atual, bloco);
  }

  // NARRADOR IA: uma frase por régua, no tom de um analista. Cacheado; fallback forte.
  async function narrar(metrica, bloco) {
    const alvo = modal.querySelector('#im-narr');
    if (!alvo || !bloco?.linhas.length) return;
    if (cacheNarr[metrica]) { alvo.innerHTML = esc(cacheNarr[metrica]); return; }
    const top = bloco.linhas[0];
    const euPos = bloco.euPos;
    const fb = fallbackNarr(bloco, meu);
    try {
      const system = 'Você é um analista geopolítico seco e afiado. Comente um ranking mundial em UMA frase curta (máx. 20 palavras), sem clichê, sem emoji, sem aspas. Português do Brasil.';
      const user = `Régua: ${bloco.rot}. Líder: ${top.nome} (${top.fmt}). ${meu} está em ${euPos || '—'}º de ${bloco.linhas.length}. Comente.`;
      const { texto } = await chamarIA({ system, user, temperature: 0.9, jsonMode: false });
      const limpo = String(texto || '').trim().replace(/^["']|["'.]$/g, '').split('\n')[0];
      cacheNarr[metrica] = limpo.length > 6 ? limpo : fb;
    } catch { cacheNarr[metrica] = fb; }
    if (atual === metrica && alvo.isConnected) alvo.innerHTML = esc(cacheNarr[metrica]);
  }

  render();
}

function fallbackNarr(bloco, meu) {
  const top = bloco.linhas[0];
  const p = bloco.euPos;
  if (!p) return `${top.nome} lidera em ${bloco.rot.toLowerCase()} com ${top.fmt}.`;
  if (p === 1) return `${meu} está no TOPO em ${bloco.rot.toLowerCase()} — a coroa é sua, por enquanto.`;
  if (p <= 3) return `${meu} respira na nuca de ${top.nome}: ${p}º em ${bloco.rot.toLowerCase()}.`;
  return `${top.nome} domina o ranking; ${meu} aparece só em ${p}º. Há muito o que subir.`;
}
