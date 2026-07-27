// ═══════════════════════════════════════════════════════════════════════
// CHAT DO BLOCO — a sala fechada dos aliados (#10.2)
// ═══════════════════════════════════════════════════════════════════════
// O que faltava: a aliança já existia de verdade (coalizão, defesa mútua, desconto
// de armas, visor de blocos) — mas os membros não tinham como CONVERSAR. Combinar um
// ataque conjunto, avisar que uma frota está subindo a costa, pedir socorro: tudo isso
// tinha de sair no telefone 1:1, um por um, ou no X, onde o inimigo lê junto.
//
// ── POR QUE NÃO TEM BROADCAST DE GRUPO NO SERVIDOR ─────────────────────
// O `server/lobby.js` conhece dois canais: `evento` (difunde pra sala INTEIRA — é o
// feed público) e `direto` (1:1 por país). Não existe "mandar pro grupo X", e criar
// isso no servidor significaria o servidor ter de saber quem é membro de qual bloco —
// ou seja, replicar no back-end um estado que hoje vive só no cliente, com sincronia,
// entrada e saída de membros. Caro, e por uma feature de chat.
//
// O caminho barato e honesto: o CLIENTE itera os membros e manda um `direto` pra cada
// um. Do ponto de vista de quem recebe é idêntico; a única diferença é que a entrega
// é best-effort membro a membro (quem estiver offline simplesmente não recebe, e o
// remetente vê isso). Para um bloco de 3 a 8 países é barato. Se um dia um bloco tiver
// dezenas de humanos, aí vale o broadcast no servidor — não antes.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const flag = (iso) => (ISO2_DE[iso] ? `<img class="bch-flag" src="${bandeira(ISO2_DE[iso], 40)}" alt="" onerror="this.style.display='none'">` : '');

export function montarChatBloco(jogo, net, { ehHumano } = {}) {
  const meuIso = jogo.estado.iso || 'USA';
  const threads = new Map();      // blocoId → [{ de, deNome, texto, ts }]
  const conhecidos = new Map();   // blocoId → { id, nome, membros }

  function guardar(blocoId, msg) {
    const th = threads.get(blocoId) || [];
    th.push(msg);
    if (th.length > 200) th.shift();
    threads.set(blocoId, th);
  }

  // ── RECEBER ────────────────────────────────────────────────────────
  // Devolve true se consumiu a mensagem (o roteador em ui/jogo.js só passa adiante
  // pra telefonia o que NÃO for do bloco).
  function aoDireto(msg) {
    if (msg?.tipo !== 'bloco') return false;
    const d = msg.dados || {};
    if (!d.blocoId) return true;
    conhecidos.set(d.blocoId, { id: d.blocoId, nome: d.blocoNome || 'Bloco', membros: d.membros || [] });
    guardar(d.blocoId, { de: msg.dePais, deNome: msg.deNome, texto: String(d.texto || '').slice(0, 400), ts: msg.ts });
    const aberto = document.querySelector(`.bloco-chat[data-bl="${CSS.escape(d.blocoId)}"]`);
    if (aberto) pintar(aberto, d.blocoId);
    else notificar(d.blocoId, d.blocoNome, msg.deNome || nomeDe(msg.dePais), d.texto);
    return true;
  }

  function notificar(blocoId, blocoNome, quem, texto) {
    document.querySelectorAll(`.bch-notif[data-bl="${CSS.escape(blocoId)}"]`).forEach((e) => e.remove());
    const el = document.createElement('div');
    el.className = 'bch-notif'; el.dataset.bl = blocoId;
    el.innerHTML = `<div class="bchn-in">${ico('users', 15)}
      <div class="bchn-txt"><b>${esc(blocoNome || 'Bloco')} · ${esc(quem)}</b><span>${esc(String(texto || '')).slice(0, 90)}</span></div>
      ${ico('message-square', 14)}</div>`;
    document.body.appendChild(el);
    el.addEventListener('click', () => { el.remove(); abrir(conhecidos.get(blocoId) || { id: blocoId, nome: blocoNome, membros: [] }); });
    setTimeout(() => el.remove(), 10000);
  }

  // ── A JANELA ───────────────────────────────────────────────────────
  function pintar(el, blocoId) {
    const corpo = el.querySelector('.bch-corpo');
    const th = threads.get(blocoId) || [];
    corpo.innerHTML = th.length
      ? th.map((m) => `<div class="bch-msg ${m.de === meuIso ? 'meu' : ''}">
          ${m.de === meuIso ? '' : `<span class="bch-quem">${flag(m.de)}${esc(m.deNome || nomeDe(m.de))}</span>`}
          <span class="bch-bolha">${esc(m.texto)}</span></div>`).join('')
      : `<div class="bch-vazio">${ico('lock', 12)} Canal do bloco. Só os membros leem — nada disto sai no X.</div>`;
    corpo.scrollTop = corpo.scrollHeight;
  }

  function abrir(bloco) {
    if (!bloco?.id) return;
    conhecidos.set(bloco.id, bloco);
    document.querySelectorAll('.bloco-chat').forEach((e) => e.remove());
    const membros = (bloco.membros || []).filter((m) => m !== meuIso);
    // Quem está NA SALA agora é quem vai receber. Dizer isso na cara evita o pior
    // bug de percepção possível num chat: achar que falou e não ter falado com ninguém.
    const online = membros.filter((m) => ehHumano?.(m));
    const el = document.createElement('div');
    el.className = 'bloco-chat';
    el.dataset.bl = bloco.id;
    el.innerHTML = `<div class="bch-cab">
        <span class="bch-ic">${ico('users', 14)}</span>
        <div class="bch-tit"><b>${esc(bloco.nome || 'Bloco')}</b>
          <span>${online.length ? `${online.length} de ${membros.length} membro(s) na sala agora` : 'nenhum aliado humano na sala — ninguém vai ler'}</span></div>
        <button class="pp-fechar bch-x">${ico('x', 13)}</button>
      </div>
      <div class="bch-membros">${membros.map((m) => `<span class="bch-m ${ehHumano?.(m) ? 'on' : ''}" title="${esc(nomeDe(m))}${ehHumano?.(m) ? ' · na sala' : ' · fora da sala'}">${flag(m)}</span>`).join('') || `<i class="bch-so">Você é o único membro deste bloco.</i>`}</div>
      <div class="bch-corpo"></div>
      <form class="bch-form"><input maxlength="400" placeholder="Falar com o bloco…" autocomplete="off" ${online.length ? '' : 'disabled'}><button type="submit" ${online.length ? '' : 'disabled'}>${ico('send', 14)}</button></form>`;
    document.body.appendChild(el);
    pintar(el, bloco.id);
    el.querySelector('.bch-x').addEventListener('click', () => el.remove());
    el.querySelector('.bch-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const inp = el.querySelector('input');
      const texto = inp.value.trim();
      if (!texto) return;
      for (const iso of online) {
        net.direto('bloco', iso, { texto, blocoId: bloco.id, blocoNome: bloco.nome, membros: bloco.membros || [] });
      }
      guardar(bloco.id, { de: meuIso, deNome: jogo.ficha?.pais || nomeDe(meuIso), texto, ts: Date.now() });
      inp.value = '';
      pintar(el, bloco.id);
    });
    setTimeout(() => el.querySelector('input')?.focus(), 40);
  }

  return { abrir, aoDireto, naoLidas: (blocoId) => (threads.get(blocoId) || []).length };
}
