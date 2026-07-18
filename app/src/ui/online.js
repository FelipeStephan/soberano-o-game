// ═══════════════════════════════════════════════════════════════════════
// ONLINE — as interações entre humanos, em tempo real
// ═══════════════════════════════════════════════════════════════════════
// Modelo em docs/ONLINE.md. Este módulo é a ponte entre a sala (net/lobby.js) e o
// jogo: quando OUTRO humano age contra você, o golpe chega AGORA — vira post no X,
// balão no globo, e, se for guerra, dispara o MODO DEFESA. É o coração da ansiedade
// online: você não espera turno pra sentir que alguém se moveu.
//
// Também expõe o caminho de SAÍDA: quando VOCÊ age sobre um país controlado por um
// humano, o jogo chama notificar() e o alvo recebe o alerta.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { abrirDefesa } from './defesa.js';
import { alertaUrgente } from './efeitos.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;

// Como cada tipo de evento se anuncia: cor, se é urgente (banner INCOMING), e o verbo.
const ESTILO = {
  guerra:     { cor: '#ff3b5c', urgente: true,  rot: 'DECLAROU GUERRA', ic: 'swords' },
  ataque_estado: { cor: '#ff3b5c', urgente: true, rot: 'ATACOU SEU TERRITÓRIO', ic: 'crosshair' },
  nuclear:    { cor: '#ff3b5c', urgente: true,  rot: 'LANÇAMENTO NUCLEAR', ic: 'radiation' },
  sancao:     { cor: '#ffb020', urgente: false, rot: 'IMPÔS SANÇÕES', ic: 'ban' },
  espionagem: { cor: '#b98cff', urgente: false, rot: 'OPERAÇÃO DE ESPIONAGEM', ic: 'eye' },
  alianca:    { cor: '#22e0a0', urgente: true,  rot: 'PROPÔS ALIANÇA', ic: 'handshake' },
  comercio:   { cor: '#22e0a0', urgente: true,  rot: 'PROPÔS ACORDO COMERCIAL', ic: 'coins' },
  ajuda:      { cor: '#22e0a0', urgente: false, rot: 'ENVIOU AJUDA', ic: 'heart-handshake' },
  resposta:   { cor: '#35e0ff', urgente: false, rot: 'RESPONDEU', ic: 'reply' },
};

export function ligarOnline(jogo, net, hooks) {
  const meuIso = jogo.estado.iso || jogo.ficha?.iso;
  let jogadores = [];                 // [{ id, nome, pais, host }]
  const porPais = new Map();          // iso → jogador (quem é humano)

  const badge = hooks.container?.querySelector('#online-badge');

  // Recalcula quem é humano a partir de uma lista de jogadores da sala.
  function absorverJogadores(lista) {
    jogadores = (lista || []).filter((j) => j.pais);
    porPais.clear();
    for (const j of jogadores) if (j.pais && j.pais !== meuIso) porPais.set(j.pais, j);
    pintarBadge();
  }

  // BUG QUE ISTO CONSERTA: quem ENTRAVA por último no jogo começava com jogadores=[]
  // e só populava no PRÓXIMO broadcast de sala — que nunca vinha se ninguém mais mexia.
  // Resultado: o convidado não "via" o host como humano (sem botão de contato, ligação
  // só funcionava num sentido). O cliente do lobby JÁ guarda o último roster em
  // net.estado().jogadores — semeamos dele na hora de ligar.
  absorverJogadores(net.estado().jogadores);

  function pintarBadge() {
    if (!badge) return;
    const est = net.estado();
    const n = jogadores.length;
    badge.innerHTML = `${ico('users', 12)} <b>${n}</b> na sala${est.sala ? ` · <span class="ob-sala">${esc(est.sala)}</span>` : ''}`;
    badge.classList.add('online-ativo');
  }

  function humano(iso) { return porPais.get(iso) || null; }

  // ── EVENTO CHEGANDO de outro humano ────────────────────────────────
  function receber(ev) {
    if (!ev || ev.dePais === meuIso) return;   // ignora eco do próprio
    // MUNDO COMPARTILHADO: o host é a autoridade do "mundo ao vivo". Ele retransmite os
    // posts do X, plantões e o período; os convidados APLICAM (em vez de gerar os seus,
    // que divergiam). Assim a sala inteira vê a MESMA timeline e o mesmo relógio.
    if (ev.tipo === 'mundo') { aplicarMundo(ev.dados || {}); return; }
    const est = ESTILO[ev.tipo] || { cor: '#7488ad', urgente: false, rot: (ev.tipo || 'AGIU').toUpperCase(), ic: 'radio' };
    const origem = ev.deNome ? `${ev.deNome} (${nomeDe(ev.dePais)})` : nomeDe(ev.dePais);

    // 1) sempre vira notícia no X — é o feed compartilhado da sala. Marcado com o país
    //    de origem pra o filtro (Minha Nação × World Trends) funcionar.
    jogo._empilharFeed?.([{
      tipo: 'jogador', handle: origem, paisOrigem: ev.dePais, paisAlvo: ev.alvo || null,
      texto: ev.texto || `${est.rot.toLowerCase()}`, cor: est.cor,
    }]);
    hooks.renderFeed?.();

    // 2) balão no globo, no país de quem agiu
    const g = hooks.globoCtrl?.();
    g?.balao?.(g.ondeEsta?.(ev.dePais), ev.texto || est.rot, est.urgente ? 'ruim' : 'aviso');

    // 3) se a bomba é COM VOCÊ, alerta urgente — e, se for guerra/ataque, MODO DEFESA
    if (ev.paraVoce || ev.alvo === meuIso) {
      if (ev.tipo === 'guerra' || ev.tipo === 'ataque_estado') {
        alertaUrgente({ titulo: 'VOCÊ ESTÁ SOB ATAQUE', texto: `${ev.deNome || nomeDe(ev.dePais)} lançou uma ofensiva contra você.`, tom: 'ataque' });
        abrirDefesa(jogo, {
          agressor: { iso: ev.dePais, nome: ev.deNome || nomeDe(ev.dePais) },
          dados: ev.dados || null,
          onFim: () => hooks.atualizar?.(),
        });
      } else if (ev.tipo === 'alianca' || ev.tipo === 'comercio') {
        propostaRecebida(ev, est);
      } else {
        alertaIncoming(origem, est, ev.texto);
      }
    }
  }

  // ── PROPOSTA recebida (aliança/comércio) — aceitar/recusar com timer ──
  function propostaRecebida(ev, est) {
    fecharAlerta();
    const el = document.createElement('div');
    el.className = 'onl-alerta proposta';
    el.style.setProperty('--oc', est.cor);
    el.innerHTML = `
      <div class="onl-cab">${ico(est.ic, 15)} <b>${esc(ev.deNome || nomeDe(ev.dePais))}</b> <span>${est.rot}</span></div>
      <div class="onl-txt">${esc(ev.texto || 'Quer estreitar laços com você.')}</div>
      <div class="onl-timer"><i></i></div>
      <div class="onl-acoes">
        <button class="onl-sim">${ico('check', 14)} ACEITAR</button>
        <button class="onl-nao">${ico('x', 14)} RECUSAR</button>
      </div>`;
    document.body.appendChild(el);
    const responder = (aceito) => {
      net.evento('resposta', ev.dePais, aceito ? 'Aceitou a proposta.' : 'Recusou a proposta.', { sobre: ev.tipo, aceito });
      if (aceito) {
        // aceitar melhora a relação localmente
        const k = `rel_${ev.dePais?.toLowerCase()}`;
        if (k in jogo.estado) jogo.estado[k] = Math.min(100, (jogo.estado[k] || 0) + 20);
        hooks.atualizar?.();
      }
      fecharAlerta();
    };
    el.querySelector('.onl-sim').addEventListener('click', () => responder(true));
    el.querySelector('.onl-nao').addEventListener('click', () => responder(false));
    // timer de 20s: deixar expirar recusa por omissão — decidir rápido É a ansiedade
    autoFechar = setTimeout(() => responder(false), 20000);
  }

  // ── ALERTA urgente simples (sanção, espionagem, etc.) ──
  function alertaIncoming(origem, est, texto) {
    fecharAlerta();
    const el = document.createElement('div');
    el.className = `onl-alerta ${est.urgente ? 'urgente' : ''}`;
    el.style.setProperty('--oc', est.cor);
    el.innerHTML = `
      <div class="onl-cab">${ico(est.ic, 15)} <b>${esc(origem)}</b> <span>${est.rot}</span></div>
      <div class="onl-txt">${esc(texto || '')}</div>
      <button class="onl-ok">ENTENDIDO</button>`;
    document.body.appendChild(el);
    el.querySelector('.onl-ok').addEventListener('click', fecharAlerta);
    autoFechar = setTimeout(fecharAlerta, 8000);
  }

  let autoFechar = null;
  function fecharAlerta() {
    clearTimeout(autoFechar);
    document.querySelectorAll('.onl-alerta').forEach((e) => e.remove());
  }

  // ── MUNDO recebido do host (convidado aplica) ──────────────────────────
  function aplicarMundo(d) {
    if (Array.isArray(d.posts) && d.posts.length) { jogo._empilharFeed?.(d.posts); hooks.renderFeed?.(); }
    // animação no globo espelhando o host (escaramuça/petróleo)
    const g = hooks.globoCtrl?.();
    if (d.anim && g) {
      const de = g.ondeEsta?.(d.anim.de); const para = g.ondeEsta?.(d.anim.para || d.anim.iso);
      if (d.anim.tipo === 'escaramuca' && de && para) { g.desenharLinha?.(para, 'ataque', 6000, de); g.salvaMisseis?.(para, 2, de); }
      else if (d.anim.tipo === 'petroleo' && para) g.ondaRadar?.(para, { cor: 0xffb020, max: 55 });
    }
    // relógio da sala: o período do HOST vira o período mostrado (sem mexer no turno local)
    if (Number.isFinite(d.turno)) { jogo._periodoSala = d.turno; hooks.sincronizarPeriodo?.(d.turno); }
  }

  // Reassume os callbacks da conexão que a home abriu (sem reconectar).
  net.setHandlers({
    onSala: (msg) => { absorverJogadores(msg.jogadores); hooks.onRoster?.(jogadores); },
    onEvento: receber,
    onConexao: (ok) => { if (badge && !ok) badge.classList.remove('online-ativo'); },
  });
  pintarBadge();

  return {
    humano,
    jogadores: () => jogadores.slice(),
    // AUTORIDADE DO MUNDO: quem é host gera o mundo ao vivo e o retransmite; convidado só aplica.
    souHost: () => !!net.estado().host,
    relayMundo: (dados) => net.evento('mundo', null, '', dados),
    // VOCÊ agiu sobre um país. Se for humano, dispara o alerta pra ele. Sempre publica
    // no feed da sala (todos veem o impacto — é o World Trends).
    notificar: (tipo, alvoIso, texto, dados) => {
      net.evento(tipo, alvoIso, texto, dados);
    },
    ehHumano: (iso) => porPais.has(iso),
  };
}
