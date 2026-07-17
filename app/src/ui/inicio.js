// ═══════════════════════════════════════════════════════════════════════
// HOME CINEMÁTICA + LOBBY — a primeira tela É o jogo
// ═══════════════════════════════════════════════════════════════════════
// O planeta gira em tela cheia atrás de tudo; a UI flutua sobre ele no vocabulário
// da cabine (chanfro, trilho, mono). Três caminhos:
//   • NOVO JOGO  — offline, contra a Máquina (o fluxo clássico: escolher país → ASSUMIR).
//   • HOSPEDAR   — cria uma sala; outros humanos entram, pegam um país e jogam no mesmo
//                  universo. Interações em tempo real (ver docs/ONLINE.md).
//   • ENTRAR     — lista de partidas abertas + entrar por código.
// O lobby mostra código, jogadores (com país), e o START (host) / "aguardando host".
import Globe from 'globe.gl';
import { temChave } from '../config.js';
import { GRUPOS, cartaoDe, existe, jogaveis, fichaDe } from '../dados/registro.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { resumoSave, apagarSave } from '../jogo/save.js';
import { conectarLobby } from '../net/lobby.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TEX = 'https://cdn.jsdelivr.net/npm/three-globe/example/img';

export function mostrarInicio(container, onStart) {
  const modo = temChave() ? 'MÁQUINA · IA ATIVA' : 'DEMONSTRAÇÃO · SEM CHAVE';
  let sel = 'USA';
  let nomeJogador = localStorage.getItem('soberano_nome') || '';
  let globo = null;
  let timerRotacao = null;
  let saindo = false;

  // ── ESTADO DE TELA ──────────────────────────────────────────────────
  let tela = 'modo';            // 'modo' | 'pais' | 'lobby'
  let net = null;               // conexão viva (só no online)
  let sala = null;              // { codigo, host, jogadores, max }
  let salasAbertas = [];        // lista de partidas abertas
  let erroLobby = '';

  container.innerHTML = `
    <div class="hm" id="hm">
      <div class="hm-globo" id="hm-globo"></div>
      <div class="hm-veu"></div>

      <header class="hm-topo">
        <h1 class="marca hm-marca">SOBERANO</h1>
        <div class="hm-sub">O GRANDE JOGO — A MÁQUINA OBSERVA</div>
      </header>

      <div class="hm-continuar" id="hm-continuar"></div>
      <nav class="hm-nav" id="hm-nav" aria-label="Nações"></nav>
      <aside class="hm-ficha" id="hm-ficha"></aside>

      <footer class="hm-rodape">
        <span class="hm-modo"><i class="hm-dot ${temChave() ? 'on' : ''}"></i> ${modo}</span>
        <span class="hm-aviso">Trabalho acadêmico ficcional. Países e veículos de imprensa são reais;
          líderes, declarações e acontecimentos são inventados. Marcas pertencem aos seus titulares,
          que não endossam nem participam deste projeto.</span>
        <span class="hm-versao">SOBERANO · PROTÓTIPO</span>
      </footer>
    </div>`;

  // ── O PLANETA DE FUNDO ────────────────────────────────────────────────
  function montarGloboHome() {
    const el = container.querySelector('#hm-globo');
    globo = Globe()(el)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl(`${TEX}/earth-blue-marble.jpg`)
      .bumpImageUrl(`${TEX}/earth-topology.png`)
      .showAtmosphere(true)
      .atmosphereColor('#4aa8ff')
      .atmosphereAltitude(0.28);
    const c = globo.controls();
    c.autoRotate = true;
    c.autoRotateSpeed = 0.42;
    c.enableZoom = false;
    globo.pointOfView({ lat: 14, lng: -40, altitude: 2.4 }, 0);
    const resize = () => { globo.width(el.clientWidth); globo.height(el.clientHeight); };
    resize();
    window.addEventListener('resize', resize);
  }

  function voarPara(iso) {
    if (!globo) return;
    const pino = fichaDe(iso)?.pino;
    if (!pino) return;
    const c = globo.controls();
    c.autoRotate = false;
    globo.pointOfView({ lat: pino.lat, lng: pino.lng, altitude: 1.75 }, 1300);
    clearTimeout(timerRotacao);
    timerRotacao = setTimeout(() => { if (!saindo) c.autoRotate = true; }, 5200);
  }

  // ── TELA 1 · ESCOLHA DE MODO ────────────────────────────────────────
  function modoHTML() {
    return `<div class="hm-modos">
      <div class="hmm-cab"><span class="hmm-k">// SELECIONE O TEATRO</span><h2>Como você vai jogar?</h2></div>
      <button class="hmm-op" data-modo="offline">
        <div class="hmm-ic">${ico('cpu', 22)}</div>
        <div class="hmm-txt"><b>NOVO JOGO</b><span>Você contra a Máquina. O mundo inteiro reage às suas decisões, offline.</span></div>
        ${ico('chevron-right', 16)}
      </button>
      <button class="hmm-op online" data-modo="hospedar">
        <div class="hmm-ic">${ico('radio-tower', 22)}</div>
        <div class="hmm-txt"><b>HOSPEDAR PARTIDA</b><span>Abra um universo. Outros humanos entram, pegam um país e decidem junto com você.</span></div>
        ${ico('chevron-right', 16)}
      </button>
      <button class="hmm-op online" data-modo="entrar">
        <div class="hmm-ic">${ico('log-in', 22)}</div>
        <div class="hmm-txt"><b>ENTRAR EM PARTIDA</b><span>Junte-se a uma sala aberta ou entre por código. Escolha um país livre.</span></div>
        ${ico('chevron-right', 16)}
      </button>
    </div>`;
  }

  // ── FICHA (offline) — painel de vidro com a nação escolhida ──────────
  function fichaHTML(iso) {
    const c = cartaoDe(iso);
    if (!c) return '';
    const barra = (v, cor) => `<span class="hmf-barra"><i style="width:${Math.max(2, Math.min(100, v))}%;background:${cor}"></i></span>`;
    return `<div class="hmf">
      <button class="hmf-voltar" id="hmf-voltar">${ico('chevron-left', 13)} MODOS</button>
      <div class="hmf-cab">
        ${ISO2_DE[iso] ? `<img class="hmf-flag" src="${bandeira(ISO2_DE[iso], 160)}" alt="">` : ''}
        <div><h2>${esc(c.nome)}</h2><div class="hmf-lider">${ico('crown', 11)} ${esc(c.lider)} · ${esc(c.capital)}</div></div>
      </div>
      <p class="hmf-resumo">${esc(c.resumo)}</p>
      <div class="hmf-linhas">
        <div class="hmf-l"><span>PIB</span>${barra((c.pib / 28) * 100, 'var(--ambar)')}<b>${c.pib} tri</b></div>
        <div class="hmf-l"><span>Militar</span>${barra(c.militar, 'var(--perigo)')}<b>${c.militar}</b></div>
        <div class="hmf-l"><span>Liberdades</span>${barra(c.liberdades, 'var(--cyan)')}<b>${c.liberdades}</b></div>
        <div class="hmf-l"><span>Ogivas</span>${barra((c.ogivas / 55) * 100, 'var(--roxo)')}<b>${c.ogivas || '—'}</b></div>
      </div>
      <div class="hmf-nome">
        <label>${ico('user', 11)} SEU NOME NO COMANDO</label>
        <input type="text" id="hmf-presidente" maxlength="38" value="${esc(nomeJogador || c.lider)}"
          placeholder="${esc(c.lider)}" spellcheck="false" autocomplete="off">
        <small>É este nome que a Máquina cita nas manchetes, nos boletins e nos xingamentos.</small>
      </div>
      <button class="hmf-assumir" id="hmf-assumir">${ico('crown', 17)} <span>ASSUMIR ${esc(c.nome.toUpperCase())}</span></button>
    </div>`;
  }

  // ── LOBBY (online) — código, jogadores, país, iniciar ────────────────
  function lobbyHTML() {
    const est = net?.estado() || {};
    const conectando = !est.conectado;
    const jogadores = sala?.jogadores || [];
    const meusPaises = new Set(jogadores.map((j) => j.pais).filter(Boolean));
    const euHost = sala?.host;

    if (!sala) {
      // ainda escolhendo/entrando: hospedar mostra "criando"; entrar mostra a lista
      return `<div class="hm-lobby">
        <button class="hmf-voltar" id="lb-voltar">${ico('chevron-left', 13)} MODOS</button>
        <div class="lb-cab"><span class="hmm-k">// ${modoOnline === 'hospedar' ? 'ABRINDO UNIVERSO' : 'PARTIDAS ABERTAS'}</span>
          <h2>${modoOnline === 'hospedar' ? 'Hospedar partida' : 'Entrar em partida'}</h2></div>
        ${erroLobby ? `<div class="lb-erro">${ico('triangle-alert', 13)} ${esc(erroLobby)}</div>` : ''}
        ${conectando ? `<div class="lb-conectando">${ico('loader', 15)} conectando ao servidor…</div>` : modoOnline === 'hospedar' ? `<div class="lb-conectando">${ico('loader', 15)} abrindo a sala…</div>` : modoOnline === 'entrar' ? `
          <div class="lb-codigo">
            <input type="text" id="lb-cod" placeholder="CÓDIGO (ex: SOBER-4821)" maxlength="12" autocomplete="off" spellcheck="false">
            <button id="lb-entrar-cod">${ico('log-in', 14)} ENTRAR</button>
          </div>
          <div class="lb-lista-rot">${ico('list', 12)} SALAS ABERTAS <button id="lb-atualizar" class="lb-refresh">${ico('rotate-cw', 11)}</button></div>
          <div class="lb-lista">
            ${salasAbertas.length ? salasAbertas.map((s) => `
              <button class="lb-sala" data-cod="${esc(s.codigo)}">
                <b>${esc(s.codigo)}</b>
                <span>${s.jogadores}/${s.max} jogadores · host ${esc(s.host)}</span>
                <i>${ico('chevron-right', 14)}</i>
              </button>`).join('') : `<div class="lb-vazio">Nenhuma sala aberta agora. Que tal <b>hospedar</b> uma?</div>`}
          </div>` : ''}
      </div>`;
    }

    // dentro de uma sala
    return `<div class="hm-lobby">
      <button class="hmf-voltar" id="lb-sair">${ico('log-out', 13)} SAIR DA SALA</button>
      <div class="lb-sala-cab">
        <div><span class="hmm-k">// SALA ${euHost ? '· VOCÊ É O HOST' : ''}</span>
          <div class="lb-codigo-big">${esc(sala.codigo)}</div></div>
        <div class="lb-copiar" id="lb-copiar" title="Copiar código">${ico('copy', 14)}</div>
      </div>
      <div class="lb-jogadores-rot">${ico('users', 12)} JOGADORES (${jogadores.length}/${sala.max})</div>
      <div class="lb-jogadores">
        ${jogadores.map((j) => `<div class="lb-jog ${j.pais === sel ? 'eu' : ''}">
          ${j.pais && ISO2_DE[j.pais] ? `<img src="${bandeira(ISO2_DE[j.pais], 40)}" alt="">` : `<span class="lb-semflag">?</span>`}
          <div><b>${esc(j.nome)}</b><span>${j.pais ? esc(cartaoDe(j.pais)?.nome || j.pais) : 'escolhendo…'}</span></div>
          ${j.host ? `<i class="lb-host">${ico('crown', 11)}</i>` : ''}
        </div>`).join('')}
      </div>
      <div class="lb-escolha">
        <div class="lb-escolha-rot">SEU PAÍS: <b>${esc(cartaoDe(sel)?.nome || sel)}</b>
          ${meusPaises.has(sel) && jogadores.find((j) => j.pais === sel && !j.host && j.pais !== sel) ? '' : ''}</div>
        <input type="text" id="lb-nome" maxlength="38" value="${esc(nomeJogador || cartaoDe(sel)?.lider || '')}"
          placeholder="${esc(cartaoDe(sel)?.lider || 'Seu nome')}" spellcheck="false" autocomplete="off">
      </div>
      ${euHost
        ? `<button class="hmf-assumir" id="lb-iniciar" ${jogadores.length < 1 ? 'disabled' : ''}>${ico('play', 16)} <span>INICIAR PARTIDA</span></button>`
        : `<div class="lb-aguardando">${ico('loader', 14)} Aguardando o host iniciar…</div>
           <button class="hmf-assumir lb-entrar-agora" id="lb-iniciar">${ico('crown', 15)} <span>ASSUMIR ${esc((cartaoDe(sel)?.nome || sel).toUpperCase())}</span></button>`}
    </div>`;
  }

  let modoOnline = null;   // 'hospedar' | 'entrar'

  function bannerContinuar() {
    const r = resumoSave();
    const alvo = container.querySelector('#hm-continuar');
    if (!r || tela !== 'pais') { alvo.innerHTML = ''; return; }
    alvo.innerHTML = `<div class="hm-save">
      ${ISO2_DE[r.iso] ? `<img src="${bandeira(ISO2_DE[r.iso], 80)}" alt="">` : ''}
      <div class="hms-txt"><b>${esc(r.presidente || r.pais)}</b>
        <span>${esc(r.pais)} · turno ${r.turno} · Destino ${r.destino}/100</span></div>
      <button class="hms-retomar" id="hms-retomar">${ico('play', 14)} RETOMAR</button>
      <button class="hms-apagar" id="hms-apagar" title="Descartar">${ico('trash-2', 13)}</button>
    </div>`;
    alvo.querySelector('#hms-retomar').addEventListener('click', () => partir({ continuar: true }));
    alvo.querySelector('#hms-apagar').addEventListener('click', () => { apagarSave(); bannerContinuar(); });
  }

  // ── SAÍDA CINEMÁTICA ────────────────────────────────────────────────
  function partir(args) {
    if (saindo) return;
    saindo = true;
    container.querySelector('#hm').classList.add('saindo');
    const alvo = args.continuar ? resumoSave()?.iso : (args.pais || sel);
    const pino = alvo ? fichaDe(alvo)?.pino : null;
    if (globo && pino) {
      globo.controls().autoRotate = false;
      globo.pointOfView({ lat: pino.lat, lng: pino.lng, altitude: 0.65 }, 1050);
    }
    setTimeout(() => { globo?.pauseAnimation?.(); onStart(args); }, 1100);
  }

  // ── CONEXÃO ONLINE ──────────────────────────────────────────────────
  function abrirConexao() {
    if (net) return;
    net = conectarLobby({
      nome: nomeJogador || 'Anônimo',
      onConexao: () => { if (tela === 'lobby') render(); if (modoOnline === 'entrar') net.listar(); },
      onSala: (msg) => { sala = { codigo: msg.codigo, host: msg.host === net.estado().id, jogadores: msg.jogadores, max: msg.max }; erroLobby = ''; if (tela === 'lobby') render(); },
      onSalas: (lista) => { salasAbertas = lista; if (tela === 'lobby' && !sala) render(); },
      onErro: (m) => { erroLobby = m; if (tela === 'lobby') render(); },
    });
  }

  // ── RENDER PRINCIPAL ────────────────────────────────────────────────
  function render() {
    const nav = container.querySelector('#hm-nav');
    const ficha = container.querySelector('#hm-ficha');
    // a navegação de países só aparece quando faz sentido escolher um
    nav.style.display = (tela === 'pais' || (tela === 'lobby' && sala)) ? '' : 'none';
    nav.innerHTML = (tela === 'pais' || (tela === 'lobby' && sala)) ? navHTML() : '';

    ficha.innerHTML = tela === 'modo' ? modoHTML() : tela === 'pais' ? fichaHTML(sel) : lobbyHTML();
    ficha.className = `hm-ficha tela-${tela}`;
    bannerContinuar();
    ligarInteracoes();
  }

  function navHTML() {
    const est = net?.estado();
    const ocupados = new Set((sala?.jogadores || []).filter((j) => j.pais !== sel).map((j) => j.pais));
    return GRUPOS.map((g, gi) => {
      const disp = g.isos.filter(existe);
      if (!disp.length) return '';
      return `<section class="hm-grupo" style="animation-delay:${120 + gi * 90}ms">
        <header title="${esc(g.nota)}">${esc(g.rot)}</header>
        ${disp.map((iso) => {
          const c = cartaoDe(iso);
          const travado = ocupados.has(iso);
          return `<button class="hm-item ${sel === iso ? 'sel' : ''} ${travado ? 'travado' : ''}" data-i="${iso}" ${travado ? 'disabled' : ''}>
            ${ISO2_DE[iso] ? `<img src="${bandeira(ISO2_DE[iso], 40)}" alt="">` : ''}
            <b>${esc(c.nome)}</b>
            <span>${travado ? 'ocupado' : `${c.pib} tri${c.ogivas ? ` · ${c.ogivas} ogv` : ''}`}</span>
          </button>`;
        }).join('')}
      </section>`;
    }).join('') + `<button class="hm-dado" id="hm-dado">${ico('dices', 14)} DESTINO ALEATÓRIO</button>`;
  }

  // ── LIGAÇÕES (delegadas ao re-render) ───────────────────────────────
  function ligarInteracoes() {
    // navegação de países
    container.querySelectorAll('.hm-item:not([disabled])').forEach((b) => b.addEventListener('click', () => {
      if (sel === b.dataset.i) return;
      sel = b.dataset.i;
      voarPara(sel);
      if (tela === 'lobby' && sala) net?.escolherPais(sel);
      render();
      container.querySelector('.hm-item.sel')?.scrollIntoView({ block: 'nearest' });
    }));
    container.querySelector('#hm-dado')?.addEventListener('click', () => {
      const ocup = new Set((sala?.jogadores || []).filter((j) => j.pais !== sel).map((j) => j.pais));
      const todos = jogaveis().filter((i) => i !== sel && !ocup.has(i));
      sel = todos[Math.floor(Math.random() * todos.length)] || sel;
      voarPara(sel);
      if (tela === 'lobby' && sala) net?.escolherPais(sel);
      render();
    });

    // MODO (tela 1)
    container.querySelectorAll('.hmm-op').forEach((b) => b.addEventListener('click', () => {
      const m = b.dataset.modo;
      if (m === 'offline') { tela = 'pais'; voarPara(sel); render(); return; }
      modoOnline = m; tela = 'lobby'; erroLobby = '';
      abrirConexao();
      render();
      if (m === 'hospedar') net?.criar({ pais: sel, aberta: true });
      else net?.listar();
    }));

    // FICHA (offline)
    const campo = container.querySelector('#hmf-presidente');
    campo?.addEventListener('input', () => { nomeJogador = campo.value.trim(); });
    container.querySelector('#hmf-voltar')?.addEventListener('click', () => { tela = 'modo'; render(); });
    container.querySelector('#hmf-assumir')?.addEventListener('click', () => {
      const nome = (campo?.value || '').trim() || cartaoDe(sel).lider;
      localStorage.setItem('soberano_nome', nome === cartaoDe(sel).lider ? '' : nome);
      partir({ pais: sel, ano: '2026', presidente: nome });
    });

    // LOBBY (online)
    container.querySelector('#lb-voltar')?.addEventListener('click', () => { modoOnline = null; tela = 'modo'; render(); });
    container.querySelector('#lb-sair')?.addEventListener('click', () => { net?.sair(); sala = null; modoOnline === 'entrar' ? net?.listar() : (tela = 'modo'); render(); });
    container.querySelector('#lb-atualizar')?.addEventListener('click', () => net?.listar());
    container.querySelector('#lb-entrar-cod')?.addEventListener('click', () => {
      const cod = container.querySelector('#lb-cod')?.value?.trim()?.toUpperCase();
      if (cod) net?.entrar(cod);
    });
    container.querySelectorAll('.lb-sala').forEach((b) => b.addEventListener('click', () => net?.entrar(b.dataset.cod)));
    container.querySelector('#lb-copiar')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(sala.codigo).catch(() => {});
      const el = container.querySelector('#lb-copiar'); if (el) el.innerHTML = ico('check', 14);
    });
    const nomeLb = container.querySelector('#lb-nome');
    nomeLb?.addEventListener('input', () => { nomeJogador = nomeLb.value.trim(); });
    container.querySelector('#lb-iniciar')?.addEventListener('click', () => {
      const nome = (nomeLb?.value || '').trim() || cartaoDe(sel)?.lider || 'Comandante';
      localStorage.setItem('soberano_nome', nome);
      net?.escolherPais(sel);
      partir({ pais: sel, ano: '2026', presidente: nome, online: true, net, sala, jogadores: sala?.jogadores || [] });
    });
  }

  montarGloboHome();
  render();
}
