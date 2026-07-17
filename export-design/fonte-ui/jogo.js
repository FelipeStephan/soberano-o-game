// A tela de jogo — centro de comando: globo 3D, HUD tático, feed, catálogo de ações,
// painel de país, popups de crise e de desbloqueio.
import { MEDIDORES, ECONOMIA, CAPACIDADES, VARS } from '../jogo/vars.js';
import { ACOES, CATEGORIAS, ACAO_POR_ID } from '../dados/acoes.js';
import { estaDesbloqueada } from '../jogo/desbloqueios.js';
import { dinheiro } from '../jogo/formato.js';
import { acoesPais } from '../jogo/diplomacia.js';
import { UNIDADES, DOMINIOS, forcaCombate } from '../dados/forcas.js';
import { descontoMilitar } from '../dados/blocos.js';
import { iso, souEu, rotuloRelacao, relacaoAtual, nomePais, verbo } from '../dados/paises.js';
import { ocupacaoDe, acoesOcupacao } from '../jogo/ocupacao.js';
import { riscoDe } from '../dados/riscos.js';
import { podeInstalarBase, basesEm } from '../dados/bases.js';
import { petroleoDe, bandaPreco } from '../dados/petroleo.js';
import { reservasControladas } from '../jogo/petroleo.js';
import { abrirBases } from './bases.js';
import { abrirNuclear } from './nuclear.js';
import { abrirAjuda } from './ajuda.js';
import { abrirCriseFiscal } from './fiscal.js';
import { abrirReforco } from './reforco.js';
import { abrirEnvio } from './envio.js';
import { alvosDeAjuda } from '../jogo/ajuda.js';
import { abrirGuerra } from './guerra.js';
import { abrirMercado } from './mercado.js';
import { abrirEquipamento } from './equipamento.js';
import { abrirEmpresas } from './empresas.js';
import { abrirConselheiro } from './conselheiro.js';
import { equipamentoDe } from '../dados/equipamentos.js';
import { PRECO } from '../dados/mercado.js';
import { agendarFlash, cancelarFlash } from './urgente.js';
import { bandeiraDeFeature, bandeira, ISO2_DE, FOTO_ACAO, FOTO_UNIDADE, logoDe, retrato } from '../dados/imagens.js';
import { mancheteDaInvasao } from '../jogo/agressao.js';
import { VEICULO_POR_NOME } from '../dados/veiculos.js';
import { imprensaPorNome } from '../dados/imprensa.js';
import { ico, icoDe } from './icones.js';
import { montarGlobo, tensaoGlobal } from './globo.js';
import { conectarLobby } from '../net/lobby.js';
import { escaramucaAleatoria } from '../jogo/mundoVivo.js';
import { temChave } from '../config.js';
import { agregarDeltas, mancheteDoCiclo, despachosDoCiclo, epicoDoCiclo, fraseImpacto } from '../dados/dramaturgia.js';
import { sirene, flashTela } from './efeitos.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// O logotipo do X (a rede social). SVG inline — nada de imagem externa, nada de emoji.
// É o glifo oficial do X, desenhado à mão em path pra herdar currentColor.
function logoX(tam = 20) {
  return `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="currentColor" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>`;
}
const prob = (p) => (p >= 1 ? '100%' : `${Math.round(p * 100)}%`);

const ISO2_MAPA = { USA: 'us', BRA: 'br', CHN: 'cn', RUS: 'ru', DEU: 'de', FRA: 'fr', GBR: 'gb', IND: 'in', JPN: 'jp', KOR: 'kr', ISR: 'il', TUR: 'tr', IRN: 'ir', ITA: 'it', SWE: 'se' };

export function iniciarJogo(container, jogo) {
  const f = jogo.ficha;
  const ISO2_JOGADOR = ISO2_MAPA[f.iso] || 'us';
  let catAtual = 'Militar';
  let globoCtrl = null;
  let consoleAberto = false; // barra de ações começa minimizada (o planeta é o herói)

  container.innerHTML = `
    <div class="jogo">
      <header class="topo">
        <div class="marca-topo"><span class="titulo">SOBERANO</span><span class="linha-status">// COMANDO ESTRATÉGICO</span></div>
        <div class="topo-nacao">
          <img class="topo-flag" src="${bandeira(ISO2_JOGADOR, 80)}" alt="" onerror="this.style.display='none'">
          <div><span class="rot">Nação</span><span class="val">${esc(f.pais)}</span></div>
        </div>
        <div class="topo-sep"></div>
        <div class="stat"><span class="rot">Ciclo</span><span class="val"><span id="t-turno">0</span> <i>/ ${jogo.eraTurnoMax}</i></span></div>
        <div class="stat destaque"><span class="rot">Tesouro Nacional</span><span class="val" id="t-tesouro">–</span></div>
        <div class="stat"><span class="rot">Pontos de Ação</span><span class="val" id="t-pa">–</span></div>
        <div class="topo-sep"></div>
        <div class="stat" title="Trajetória do reinado"><span class="rot">Destino</span><span class="val" id="t-destino">–</span></div>
        <div class="stat" title="Preço do barril"><span class="rot">${ico('fuel', 11)} Brent</span><span class="val" id="t-brent">–</span></div>
        <div class="stat" title="Conflitos e focos ativos no mundo"><span class="rot">${ico('flame', 11)} Focos</span><span class="val" id="t-focos">–</span></div>
        <span class="espaco"></span>
        <button class="btn-mercado conselho" id="btn-conselho" title="Recomendações do gabinete">${ico('brain', 15)} CONSELHEIRO</button>
        <button class="btn-mercado empresas" id="btn-empresas" title="Complexo econômico">${ico('building-2', 15)} EMPRESAS</button>
        <button class="btn-mercado" id="btn-mercado" title="Mercado de armas">${ico('store', 15)} MERCADO</button>
        <span class="badge" id="badge-modo">–</span>
        <span class="online-badge" id="online-badge" title="Jogadores online"></span>
      </header>

      <section class="globo" id="globo-wrap">
        <div class="globo-canvas" id="globo"></div>

        <div class="mundo-vivo">
          <div class="mv-cab"><span class="mv-dot"></span> MUNDO AO VIVO</div>
          <div class="mv-linha"><span>Tensão global</span><b id="mv-tensao">–</b></div>
          <div class="mv-barra"><div class="mv-fill" id="mv-fill"></div></div>
          <div class="mv-rodape"><span id="mv-relogio">--:--:--</span><span id="mv-focos"></span></div>
        </div>

        <div class="globo-ctrl">
          <button class="gc-btn" id="btn-textura" title="Alternar satélite / político">${ico('layers', 14)} <span id="tx-rot">SATÉLITE</span></button>
          <button class="gc-btn gc-teatro" id="btn-teatro" title="Teatro de Operações: arma o mapa. Seu território se abre e clicar em solo alheio designa alvo para envio de tropas.">${ico('crosshair', 14)} <span id="tt-rot">TEATRO</span></button>
          <button class="gc-btn" id="btn-girar" title="Girar globo">${ico('rotate-cw', 14)} GIRAR</button>
        </div>

        <details class="mapa-legenda">
          <summary>${ico('map', 12)} O QUE ESTÁ NO MAPA?</summary>
          <div class="ml-itens">
            <span><i class="lg voce"></i> Sua nação</span>
            <span><i class="lg ocup"></i> Território ocupado</span>
            <span><i class="lg guerra"></i> Em guerra</span>
            <span><i class="lg aliado"></i> Aliado</span>
            <span><i class="lg hostil"></i> Hostil</span>
            <span>🔥 Conflito · 🏴 Ocupação · ✊ Revolta</span>
            <span>🚢 Frota · ✈️ Força aérea · ☢️ Arsenal</span>
            <span>⚠️ Rival em tensão crítica</span>
          </div>
        </details>

        <div class="carta-wrap" id="carta-wrap"></div>
      </section>

      <aside class="hud" id="hud"></aside>

      <section class="feed">
        <div class="x-cabX">
          <span class="x-logoX">${logoX(20)}</span>
          <div class="x-abas">
            <button class="x-aba on" data-fx="timeline">Para você</button>
            <button class="x-aba" data-fx="sistema">Alertas <i id="x-alertas-n"></i></button>
          </div>
          <button class="x-min" id="x-min" title="Recolher">${ico('chevron-right', 15)}</button>
        </div>
        <div class="lista" id="feed-lista"></div>
      </section>

      <footer class="acoes" id="acoes"></footer>
    </div>
  `;

  const el = {
    turno: container.querySelector('#t-turno'),
    tesouro: container.querySelector('#t-tesouro'),
    pa: container.querySelector('#t-pa'),
    badge: container.querySelector('#badge-modo'),
    hud: container.querySelector('#hud'),
    feed: container.querySelector('#feed-lista'),
    carta: container.querySelector('#carta-wrap'),
    acoes: container.querySelector('#acoes'),
  };

  // PRESENÇA ONLINE: conecta ao lobby e mostra quantos humanos estão jogando agora,
  // e — o gancho do multiplayer — recebe em tempo real quando outro jogador age
  // contra você (guerra, sanção). Silencioso e opcional: sem servidor, some.
  conectarLobby(jogo, {
    onPresenca: (n) => {
      const b = container.querySelector('#online-badge');
      if (b) b.innerHTML = n > 0 ? `${ico('users', 12)} ${n} online` : '';
    },
    onEvento: (ev) => {
      // Um humano fez algo contra você → entra como alerta urgente no feed do X.
      if (ev.tipo === 'guerra' || ev.tipo === 'sancao' || ev.tipo === 'pacto') {
        jogo._empilharFeed?.([{ tipo: 'sistema', handle: `${ev.deNome || 'Jogador'} (${ev.dePais || '??'})`,
          texto: ev.texto || 'agiu no tabuleiro', cor: ev.tipo === 'guerra' ? '#ff3b5c' : '#ffb020' }]);
        renderFeed();
        globoCtrl?.balao?.(globoCtrl.ondeEsta?.(ev.dePais), ev.texto || '', ev.tipo === 'guerra' ? 'ruim' : 'aviso');
      }
    },
  });

  const refresh = () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); };
  container.querySelector('#btn-mercado').addEventListener('click', () => {
    if (jogo.fase !== 'planejamento') return;
    abrirMercado(jogo, { onFim: refresh });
  });
  container.querySelector('#btn-empresas').addEventListener('click', () => {
    if (jogo.fase !== 'planejamento') return;
    abrirEmpresas(jogo, { onFim: refresh });
  });
  container.querySelector('#btn-conselho').addEventListener('click', () => {
    if (jogo.fase !== 'planejamento') return;
    // O Conselheiro pode enfileirar ações: refresh na hora que aplica e ao fechar.
    abrirConselheiro(jogo, { onAplicar: refresh, onFim: refresh });
  });

  // ── MUNDO AO VIVO: tensão global + relógio ───────────────────────────
  function renderMundoVivo() {
    const t = tensaoGlobal(jogo.estado);
    const el2 = container.querySelector('#mv-tensao');
    const fill = container.querySelector('#mv-fill');
    if (!el2) return;
    el2.textContent = `${t}%`;
    el2.style.color = t >= 70 ? 'var(--perigo)' : t >= 40 ? 'var(--ambar)' : 'var(--verde)';
    fill.style.width = `${Math.max(2, t)}%`;
    // o gradiente é esticado pro tamanho do TRILHO: a cor na ponta = a temperatura real
    fill.style.backgroundSize = `${t > 0 ? (100 / t) * 100 : 100}% 100%`;
    fill.className = `mv-fill ${t >= 70 ? 'alto' : t >= 40 ? 'medio' : ''}`;
    const focos = (jogo.estado.emGuerra?.length || 0) + (jogo.estado.conquistados?.filter((c) => c.insurgencia >= 60).length || 0);
    container.querySelector('#mv-focos').textContent = focos ? `${focos} foco(s) quente(s)` : 'sem focos ativos';
  }
  setInterval(() => {
    const r = container.querySelector('#mv-relogio');
    if (r) r.textContent = new Date().toLocaleTimeString('pt-BR');
  }, 1000);

  // ── ESCARAMUÇAS AO VIVO ─────────────────────────────────────────────
  // O mundo não congela enquanto você pensa. A cada ~40s de fase de planejamento,
  // um conflito NPC ativo dá um sinal de vida NO MAPA: um arco de fogo entre os
  // dois, um balão contando o que explodiu. Você levanta o olho da HUD e o planeta
  // está respirando — que é exatamente a sensação que um jogo de mapa deve dar.
  function iniciarEscaramucas(ctrl) {
    setInterval(() => {
      if (jogo.fase !== 'planejamento') return;
      // nunca por cima de outra cena (modal, flash, ofensiva)
      if (document.querySelector('.modal-fundo') || document.querySelector('.lg-barra')) return;
      if (Math.random() < 0.45) return;   // nem todo tick anima — previsibilidade mata
      const e = escaramucaAleatoria(jogo.estado);
      if (!e) return;
      const de = ctrl.ondeEsta?.(e.de);
      const para = ctrl.ondeEsta?.(e.para);
      if (!de || !para) return;
      ctrl.desenharLinha?.(para, 'ataque', 7000, de);
      ctrl.salvaMisseis?.(para, 2, de);
      ctrl.balao?.(para, e.texto, 'aviso');
    }, 40000);
  }

  container.querySelector('#btn-textura').addEventListener('click', () => {
    const real = globoCtrl?.alternarTextura();
    container.querySelector('#tx-rot').textContent = real ? 'SATÉLITE' : 'POLÍTICO';
  });
  container.querySelector('#btn-girar').addEventListener('click', () => {
    const c = globoCtrl?.globe?.controls(); if (c) c.autoRotate = !c.autoRotate;
  });
  // TEATRO DE OPERAÇÕES: arma o mapa. Na primeira vez baixa ~1 MB de divisas e
  // cidades, então o botão avisa que está carregando em vez de fingir que travou.
  container.querySelector('#btn-teatro').addEventListener('click', async (ev) => {
    const btn = ev.currentTarget;
    const rot = container.querySelector('#tt-rot');
    if (btn.disabled) return;
    btn.disabled = true; rot.textContent = 'ARMANDO…';
    try {
      const armado = await globoCtrl?.alternarTeatro();
      btn.classList.toggle('on', armado);
      container.querySelector('.globo')?.classList.toggle('armado', armado);
      rot.textContent = armado ? 'TEATRO ATIVO' : 'TEATRO';
    } catch (e) {
      rot.textContent = 'FALHOU';
      setTimeout(() => { rot.textContent = 'TEATRO'; }, 2000);
    } finally { btn.disabled = false; }
  });

  // Recolher a coluna do X — o pedido foi "layout mais livre". O estado persiste:
  // quem joga sempre com o feed fechado não quer reabrir toda partida.
  const jogoEl = container.querySelector('.jogo');
  if (localStorage.getItem('soberano_feed_oculto') === '1') jogoEl.classList.add('feed-oculto');
  container.addEventListener('click', (ev) => {
    if (!ev.target.closest('#x-min')) return;
    const oculto = jogoEl.classList.toggle('feed-oculto');
    localStorage.setItem('soberano_feed_oculto', oculto ? '1' : '0');
    setTimeout(() => globoCtrl?.globe && (globoCtrl.globe.width(container.querySelector('#globo').clientWidth)), 60);
  });

  // monta o globo 3D
  montarGlobo(container.querySelector('#globo'), jogo, {
    onPaisClick: abrirPainelPais,
    onEstadoClick: (f) => abrirReforco(f, jogo, {
      globoCtrl,
      onFim: () => { renderHud(); renderTopo(); },
    }),
    // No Teatro, clicar em solo alheio designa alvo: abre o envio de tropas —
    // que é, na prática, o ato de guerra.
    onAlvoEstado: (f) => abrirEnvio(f, jogo, {
      globoCtrl,
      onFim: () => { renderHud(); renderTopo(); renderFeed(); },
    }),
    onPaisSelecionado: () => { /* o mapa já se abre sozinho; nada a fazer na HUD */ },
  })
    .then((ctrl) => {
      globoCtrl = ctrl;
      window.__globo = ctrl; // hook de debug (dev)
      renderMundoVivo();
      iniciarEscaramucas(ctrl);
      // atalho de debug/teste: abrir o painel de um país por ISO (ex.: __abrirPais('BRA'))
      window.__abrirPais = (code) => {
        const f = ctrl.features?.find((x) => iso(x) === code);
        if (f) abrirPainelPais(f); else console.warn('país não encontrado', code);
      };
    });

  // ── badge ────────────────────────────────────────────────────────────
  // O badge dizia "● RESERVA" e parava aí. Quem lê isso não tem como saber que está
  // vendo carta local em vez da Máquina — e foi assim que o jogo passou uma sessão
  // inteira fingindo ter IA. Agora cada estado carrega o PORQUÊ e a cura, no title.
  function renderBadge(origem) {
    const mapa = {
      maquina:      ['maquina', '● IA ATIVA',  'A Máquina gerou este turno.'],
      demonstracao: ['demo', '● SEM CHAVE',    'O servidor está no ar, mas sem OPENROUTER_API_KEY. As cartas são da reserva local. Preencha a chave em app/.env e reinicie.'],
      offline:      ['demo', '● SERVIDOR FORA', 'O backend (8787) não respondeu — as cartas são da reserva local. Rode `npm run dev` (sobe Vite + servidor).'],
      limite:       ['demo', '● NO LIMITE',    'O servidor recusou a geração por limite de uso (rate-limit ou teto diário). As cartas são da reserva local até liberar.'],
      fallback:     ['demo', '● RESERVA',      'O servidor respondeu, mas a IA falhou. Veja o console para o motivo.'],
    };
    const [cls, txt, dica] = mapa[origem] || (temChave()
      ? mapa.maquina
      : ['demo', '● SEM IA', 'A Máquina não está ligada — as cartas são da reserva local.']);
    el.badge.className = `badge ${cls}`;
    el.badge.textContent = txt;
    el.badge.title = dica;
  }

  // ── HUD ──────────────────────────────────────────────────────────────
  function renderTopo() {
    el.turno.textContent = jogo.turno;
    el.tesouro.textContent = dinheiro(jogo.estado.tesouro);
    el.pa.textContent = jogo.estado.pontos_acao;
    // O cabeçalho estava com espaço ocioso — agora carrega o pulso do mundo:
    const dst = container.querySelector('#t-destino');
    if (dst) { dst.textContent = `${jogo.destino}`; dst.style.color = jogo.banda?.cor || 'var(--texto)'; }
    const brent = container.querySelector('#t-brent');
    if (brent) {
      const p = jogo.estado.preco_petroleo || 78;
      brent.textContent = `$${p.toFixed(0)}`;
      brent.style.color = p >= 120 ? 'var(--perigo)' : p >= 95 ? 'var(--ambar)' : 'var(--texto)';
    }
    const focos = container.querySelector('#t-focos');
    if (focos) {
      const n = (jogo.estado.conflitosNPC?.length || 0) + (jogo.estado.emGuerra?.length || 0)
        + (jogo.estado.pandemias?.length || 0);
      focos.textContent = n ? `${n}` : '0';
      focos.style.color = n >= 3 ? 'var(--perigo)' : n ? 'var(--ambar)' : 'var(--fraco)';
    }
  }

  function barra(v, min, max, cor) {
    const p = ((v - min) / (max - min)) * 100;
    return `<div class="barra"><div class="preench" style="width:${Math.max(0, Math.min(100, p))}%;background:${cor}"></div></div>`;
  }

  function valorFmt(k) {
    const v = jogo.estado[k];
    if (VARS[k].dinheiro) return dinheiro(v);
    if (k === 'divida' || k === 'aliquota') return `${Math.round(v)}%`;
    return Math.round(v);
  }

  function renderHud(mudancas = []) {
    const dl = (chave) => {
      const m = mudancas.find((x) => x.chave === chave);
      if (!m || !m.delta) return '';
      const val = VARS[chave]?.dinheiro ? (m.delta > 0 ? '+' : '') + m.delta.toFixed(2) : (m.delta > 0 ? '+' : '') + Math.round(m.delta);
      return `<span class="delta ${m.delta > 0 ? 'pos' : 'neg'}">${val}</span>`;
    };

    const b = jogo.banda;
    const destino = `
      <div class="bloco destino" style="--c:${b.cor}">
        <div class="linha"><span class="banda">${b.icone} <b>${b.nome}</b></span><span class="mono">${jogo.destino}<span class="fraco">/100</span></span></div>
        ${barra(jogo.destino, 0, 100, b.cor)}
        <div class="escala"><span>☠ COLAPSO</span><span>IMPERADOR 👑</span></div>
      </div>`;

    const r = jogo.rotulo;
    const comp = (v) => barra(v, -100, 100, '#b98cff');
    const politico = `
      <div class="bloco">
        <h3>${icoDe('regime', 14)} Perfil do Regime</h3>
        <div class="rotulo-pol">${r.icone} <b>${esc(r.label)}</b></div>
        <div class="pol-desc">${esc(r.descricao)}</div>
        <div class="linha mini" title="De um lado, o Estado controla a economia; do outro, o mercado é livre."><span>◄ Estado controla</span><span>Livre mercado ►</span></div>${comp(jogo.estado.eixo_economico)}
        <div class="linha mini" title="De um lado, mais liberdade ao povo; do outro, mais controle e mão firme."><span>◄ Mais liberdade</span><span>Mais controle ►</span></div>${comp(jogo.estado.eixo_autoridade)}
      </div>`;

    const fx = jogo.fluxoPreview();
    const eco = `
      <div class="bloco">
        <h3>${icoDe('dinheiro', 14)} Economia <span class="tri">US$ trilhões</span></h3>
        <div class="grade eco-grade">
          ${ECONOMIA.map((k) => `<div class="cel" title="${esc(VARS[k].dica || '')}"><span class="rot">${VARS[k].rotulo}</span><span class="v">${valorFmt(k)}${dl(k)}</span></div>`).join('')}
        </div>
        <div class="fluxo">
          <span>Receita <b class="pos">${dinheiro(fx.receita)}</b></span>
          <span>Despesa <b class="neg">-${dinheiro(fx.despesa)}</b></span>
          <span>Saldo <b class="${fx.saldo >= 0 ? 'pos' : 'neg'}">${fx.saldo >= 0 ? '+' : ''}${dinheiro(fx.saldo)}</b></span>
        </div>
      </div>`;

    // ── PETRÓLEO ───────────────────────────────────────────────────
    // A linha mais brutal do balanço: os EUA bombeiam 13,2 Mb/d e queimam 20.
    // Essa lacuna é o motivo de o mapa ter dono — e precisa estar na cara do jogador.
    const oleo = fx.oleo;
    const banda = bandaPreco(oleo.preco);
    const res = reservasControladas(jogo.estado);
    const petroleo = `
      <div class="bloco petro">
        <h3>${ico('fuel', 14)} Petróleo <span class="tri" title="Brent é o barril de referência que o mundo usa pra precificar petróleo.">preço do barril (US$)</span></h3>
        <div class="pt-preco">
          <span class="ptp-num ${banda.cls}">US$ ${oleo.preco.toFixed(2)}</span>
          <span class="ptp-banda ${banda.cls}">${banda.rot}</span>
        </div>
        <div class="pt-nota">${esc(banda.txt)}</div>
        <div class="pt-grade">
          <div class="ptc" title="Milhões de barris que o país produz por dia."><span>Produção</span><b class="bom">${oleo.producao}<small>mi barris/dia</small></b></div>
          <div class="ptc" title="Milhões de barris que o país consome por dia."><span>Consumo</span><b class="amb">${oleo.consumo}<small>mi barris/dia</small></b></div>
          <div class="ptc" title="Total de petróleo ainda no subsolo, em bilhões de barris."><span>Reservas</span><b>${res.total}<small>bi de barris</small></b></div>
        </div>
        ${oleo.autossuficiente
          ? `<div class="pt-saldo bom">${ico('trending-up', 13)} Vendemos mais do que gastamos: sobram <b>+${oleo.excedente} mi barris/dia</b> pro mercado. O preço alto é a nossa receita.</div>`
          : `<div class="pt-saldo ruim">${ico('trending-down', 13)} <b>${oleo.dependencia}% do que queimamos vem de fora.</b> Cada dólar no barril sai do nosso caixa.</div>`}
        <div class="pt-linha ${fx.petroleo >= 0 ? 'pos' : 'neg'}">
          <span>Impacto no caixa</span>
          <b>${fx.petroleo >= 0 ? '+' : ''}${dinheiro(fx.petroleo)}<small>/ciclo</small></b>
        </div>
        ${res.conquistadas.length
          ? `<div class="pt-espolio">${ico('flag', 12)} Espólio: ${res.conquistadas.map((c) => `${esc(c.nome)} <b>${c.reservas} bi</b>`).join(' · ')}</div>` : ''}
      </div>`;

    const medidores = `
      <div class="bloco">
        <h3>${icoDe('indicadores', 14)} Indicadores</h3>
        ${MEDIDORES.map((k) => {
          const risco = riscoDe(k, jogo.estado[k]);
          return `<div class="medidor ${risco ? 'perigo' : ''}">
            <div class="linha"><span title="${esc(VARS[k].dica || '')}">${VARS[k].rotulo}${VARS[k].dica ? '<i class="med-ajuda">?</i>' : ''}${risco ? `<span class="med-alerta" data-risco="${k}" title="Clique: risco">⚠️</span>` : ''} ${dl(k)}</span><span class="mono">${Math.round(jogo.estado[k])}</span></div>
            ${barra(jogo.estado[k], 0, 100, VARS[k].cor)}
          </div>`;
        }).join('')}
      </div>`;

    const caps = `
      <div class="bloco">
        <h3>${icoDe('capacidades', 14)} Capacidades</h3>
        <div class="grade">
          ${CAPACIDADES.map((k) => `<div class="cel" title="${esc(VARS[k].dica || '')}"><span class="rot">${VARS[k].rotulo}</span><span class="v">${valorFmt(k)}${dl(k)}</span></div>`).join('')}
          <div class="cel"><span class="rot">Territórios</span><span class="v">${jogo.estado.territorio}${dl('territorio')}</span></div>
          <div class="cel arsenal"><span class="rot">☢ Ogivas</span><span class="v">${jogo.estado.ogivas}${dl('ogivas')}</span></div>
        </div>
      </div>`;

    // Forças Armadas — o inventário real, por domínio
    const dm = descontoMilitar(jogo.estado);
    const forcasHtml = DOMINIOS.map((d) => {
      const us = UNIDADES.filter((u) => u.dominio === d);
      return `<div class="fa-dominio">
        <div class="fa-d-rot">${d}</div>
        <div class="fa-lista">
          ${us.map((u) => {
            const eq = equipamentoDe(jogo.ficha.iso || 'USA', u.id);
            return `<button class="fa-un" data-equip="${u.id}" title="${esc(eq.nome || u.nome)} — ver ficha">
              <img class="fa-img" src="${eq.foto}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('${u.icone}'))">
              <span class="fa-n">${(jogo.estado.forcas?.[u.id] || 0).toLocaleString('pt-BR')}</span>
              <span class="fa-nome">${esc(eq.nome || u.nome)}</span>
            </button>`;
          }).join('')}
        </div></div>`;
    }).join('');
    const forcas = `
      <div class="bloco forcas">
        <h3>${icoDe('forcas', 14)} Forças Armadas <span class="tri">força ${forcaCombate(jogo.estado.forcas)}</span></h3>
        ${forcasHtml}
        <div class="fa-nuke">${ico('radiation', 14)} Ogivas nucleares <b>${jogo.estado.ogivas}</b></div>
        ${dm.fracao > 0 ? `<div class="fa-desc">🤝 Desconto de ${Math.round(dm.fracao * 100)}% em compras militares — aliança com ${esc(dm.aliados.join(', '))}</div>` : ''}
      </div>`;

    el.hud.innerHTML = destino + politico + eco + petroleo + medidores + forcas + caps;
    // inventário: clicar numa unidade abre a ficha do equipamento
    el.hud.querySelectorAll('.fa-un[data-equip]').forEach((b) => b.addEventListener('click', () => {
      abrirEquipamento(b.dataset.equip, jogo, { onFim: () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); } });
    }));
    // avisos de risco clicáveis
    el.hud.querySelectorAll('.med-alerta').forEach((b) => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      document.querySelector('.risco-pop')?.remove();
      const r = riscoDe(b.dataset.risco, jogo.estado[b.dataset.risco]);
      if (!r) return;
      const pop = document.createElement('div');
      pop.className = 'risco-pop';
      pop.innerHTML = `<h4>⚠️ ${esc(r.titulo)}</h4><p>${esc(r.texto)}</p>`;
      document.body.appendChild(pop);
      const rect = b.getBoundingClientRect();
      pop.style.top = `${Math.min(window.innerHeight - 150, rect.bottom + 8)}px`;
      pop.style.left = `${Math.max(8, rect.left - 270)}px`;
      const fora = () => { pop.remove(); document.removeEventListener('click', fora); };
      setTimeout(() => document.addEventListener('click', fora), 10);
    }));
    renderTopo();
    globoCtrl?.atualizar();
    renderMundoVivo();
  }

  // ── Feed ─────────────────────────────────────────────────────────────
  // Feed estilo X: avatar, selo verificado, métricas e preview de link dos jornais.

  // O BUG QUE ISTO MATA: a IA recebe no prompt a imprensa DESTA partida (imprensa.js,
  // jornais reais por país — Folha e O Globo se você joga de Brasil, Xinhua se joga de
  // China) e escreve os posts com esses nomes. Mas a UI procurava o nome no catálogo
  // VELHO (veiculos.js, 8 nomes globais). "Folha de S.Paulo" não estava lá → lookup
  // nulo → o post do jornal caía no ramo de CIDADÃO: avatar genérico, sem selo, sem
  // card de link. O card nunca sumiu; ele só nunca era alcançado.
  //
  // `imprensaPorNome()` foi escrita na 22ª leva exatamente pra isto e nunca foi
  // importada por ninguém. Duas fontes da verdade, e a UI ficou apontada pra morta.
  const _porNome = { ...VEICULO_POR_NOME, ...imprensaPorNome(jogo.ficha?.iso || 'USA') };
  function veiculoDe(nome) {
    if (!nome) return null;
    // A lista VIVA da partida vem primeiro: é ela que carrega a simpatia mutável (o
    // jornal que você comprou). O catálogo é só rede de segurança pra nome antigo.
    return jogo.veiculos?.find((v) => v.nome === nome) || _porNome[nome] || null;
  }

  function numFake(seed, base) {
    let h = 0; for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const n = base + (h % base);
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
  }

  // O feed virou X: duas abas. "Para você" = a timeline (povo + jornais). "Alertas" =
  // os avisos de sistema (Comando, Mercado, Estreitos) que ANTES poluíam a timeline —
  // o usuário pediu explicitamente pra separar. Alerta não é tuíte.
  let feedAba = 'timeline';
  function renderFeed() {
    const posts = jogo.feed.filter((p) => feedAba === 'sistema' ? p.tipo === 'sistema' : p.tipo !== 'sistema');
    const nAlertas = jogo.feed.filter((p) => p.tipo === 'sistema').length;
    const badge = container.querySelector('#x-alertas-n');
    if (badge) badge.textContent = nAlertas ? String(nAlertas) : '';

    el.feed.innerHTML = posts.map((p, idx) => {
      if (p.tipo === 'sistema') {
        return `<div class="x-sistema" style="--lc:${p.cor || 'var(--borda)'}">
          <span class="x-sis-h">${esc(p.handle || 'Sistema')}</span>
          <span class="x-sis-t">${esc(p.texto)}</span>
        </div>`;
      }
      const v = veiculoDe(p.veiculo);
      const nome = p.veiculo || (p.handle || '').replace('@', '');
      // Logo REAL do jornal, derivado do domínio (CNN, Globo, Fox… todos, não só 4).
      const logo = v ? logoDe(v) : null;
      const avatar = v
        ? (logo ? `<img class="x-avatar logo" src="${logo}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'x-avatar wordmark',textContent:'${esc(nome.slice(0, 2).toUpperCase())}',style:'background:${v.cor}'}))">`
                : `<div class="x-avatar wordmark" style="background:${v.cor}">${esc(nome.slice(0, 2).toUpperCase())}</div>`)
        : `<img class="x-avatar" src="${retrato(p.handle || nome, 'avataaars')}" alt="" loading="lazy">`;
      const preview = v ? `<a class="x-link" href="#" onclick="return false">
          <div class="x-link-img" style="background:${v.cor}">${logo ? `<img src="${logo}" alt="" onerror="this.style.display='none'">` : `<span class="x-link-word">${esc(v.nome)}</span>`}</div>
          <div class="x-link-info">
            <div class="x-link-dom">${ico('link', 10)} ${esc(v.dominio)}</div>
            <div class="x-link-tit">${esc(p.manchete || p.texto.slice(0, 72))}${!p.manchete && p.texto.length > 72 ? '…' : ''}</div>
            <div class="x-link-sub">${esc(v.nome)} · há ${1 + (idx % 9)} min</div>
          </div></a>` : '';
      const seed = (p.handle || nome) + idx;
      return `<article class="x-post">
        ${avatar}
        <div class="x-corpo">
          <div class="x-cab">
            <span class="x-nome">${esc(nome)}</span>
            ${v ? `<span class="x-verif" title="Conta verificada">${ico('badge-check', 13)}</span>` : ''}
            <span class="x-handle">${esc(p.handle)} · ${1 + (idx % 9)}min</span>
          </div>
          <div class="x-txt">${esc(p.texto)}</div>
          ${preview}
          <div class="x-acoes">
            <span>${ico('message-circle', 13)} ${numFake(seed, 40)}</span>
            <span>${ico('repeat-2', 13)} ${numFake(seed + 'r', 200)}</span>
            <span>${ico('heart', 13)} ${numFake(seed + 'l', 800)}</span>
          </div>
        </div>
      </article>`;
    }).join('') || `<div class="x-vazio">${ico(feedAba === 'sistema' ? 'bell-off' : 'ghost', 22)}<span>${feedAba === 'sistema' ? 'Nenhum alerta de sistema.' : 'Silêncio no éter…'}</span></div>`;

    container.querySelectorAll('.x-aba').forEach((b) => {
      b.onclick = () => { feedAba = b.dataset.fx; container.querySelectorAll('.x-aba').forEach((x) => x.classList.toggle('on', x === b)); renderFeed(); };
    });
  }

  // ── Catálogo de ações + fila ─────────────────────────────────────────
  function chipAcao(a) {
    const desbloq = estaDesbloqueada(a, jogo.estado);
    if (!desbloq) {
      return `<div class="acao-chip travada" title="${esc(a.dica || '')}">
        <div class="ac-top">${a.icone} <span class="ac-nome">${esc(a.nome)}</span> <span class="cadeado">🔒</span></div>
        <div class="ac-dica">🔓 ${esc(a.dica || 'Requisitos a cumprir')}</div>
      </div>`;
    }
    if (a.escalavel) {
      const ok = jogo.estado.pontos_acao >= (a.custoPA || 1) && jogo.estado.tesouro >= 0.1;
      return `<button class="acao-chip investir" data-inv="${a.id}" ${ok ? '' : 'disabled'} title="${esc(a.descricao)}">
        <div class="ac-top">${a.icone} <span class="ac-nome">${esc(a.nome)}</span></div>
        <div class="ac-desc">${esc(a.descricao)}</div>
        <div class="ac-info"><span class="custo">você define o valor 💵</span><span title="Custa ${a.custoPA || 1} ponto(s) de ação neste ciclo.">⚡${a.custoPA || 1}</span></div>
      </button>`;
    }
    const pode = jogo.podeEnfileirar(a.id);
    const pol = a.politico ? Object.entries(a.politico).map(([k, v]) => `<span class="tag">${k[0].toUpperCase()}${v > 0 ? '+' : ''}${v}</span>`).join('') : '';
    const efetivo = jogo.custoDe(a);
    const temDesc = efetivo < (a.custo || 0) - 0.0001;
    const custoHtml = a.custo > 0
      ? `<span class="custo">${temDesc ? `<s>${dinheiro(a.custo)}</s> ` : ''}${dinheiro(efetivo)}</span>${temDesc ? '<span class="tag-desc">🤝 aliança</span>' : ''}`
      : '<span class="custo">grátis</span>';
    // EQUIPAMENTO (tem unidades): não é ação de turno — abre a ficha do material.
    const unidadeId = a.forcas ? Object.keys(a.forcas)[0] : null;
    if (unidadeId) {
      const eq = equipamentoDe(jogo.ficha.iso || 'USA', unidadeId);
      const estoque = jogo.estado.forcas?.[unidadeId] || 0;
      return `<button class="acao-chip equip" data-equip="${unidadeId}" title="Ver ficha de ${esc(eq.nome || a.nome)}">
        <div class="ac-foto"><img src="${eq.foto}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${a.icone}'">
          <span class="ac-selo-eq">FICHA ▸</span></div>
        <div class="ac-corpo">
          <div class="ac-top"><span class="ac-nome">${esc(eq.nome || a.nome)}</span></div>
          <div class="ac-info"><span class="custo">${dinheiro(PRECO[unidadeId] || 0)}<span class="un">/un</span></span><span class="ac-est">arsenal ${estoque.toLocaleString('pt-BR')}</span></div>
        </div>
      </button>`;
    }
    const foto = FOTO_ACAO[a.id];
    return `<button class="acao-chip ${foto ? 'com-foto' : ''}" data-acao="${a.id}" ${pode.ok ? '' : 'disabled'} title="${esc(a.descricao)}">
      ${foto ? `<div class="ac-foto"><img src="${foto}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>` : ''}
      <div class="ac-corpo">
        <div class="ac-top">${a.icone} <span class="ac-nome">${esc(a.nome)}</span></div>
        <div class="ac-desc">${esc(a.descricao)}</div>
        <div class="ac-info">${custoHtml}<span title="Custa ${a.custoPA} ponto(s) de ação neste ciclo.">⚡${a.custoPA}</span><span class="prob ${a.prob < 0.7 ? 'risco' : ''}">${prob(a.prob)}</span>${pol}</div>
        ${pode.ok ? '' : `<div class="ac-bloq">${esc(pode.motivo)}</div>`}
      </div>
    </button>`;
  }

  function renderAcoes() {
    if (jogo.fase !== 'planejamento') {
      el.acoes.innerHTML = `<div class="acoes-bloqueado">▲ Resolva a crise para retomar o comando</div>`;
      return;
    }
    // o mundo não espera: agenda o próximo flash urgente com cronômetro
    agendarFlash(jogo, () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); });
    const tabs = CATEGORIAS.map((c) => `<button class="tab ${c.nome === catAtual && consoleAberto ? 'ativa' : ''}" data-cat="${c.nome}">${icoDe(c.nome, 15)} <span>${c.nome}</span></button>`).join('');
    const lista = ACOES.filter((a) => a.categoria === catAtual).map(chipAcao).join('');
    const fila = jogo.fila.length
      ? jogo.fila.map((it, i) => `<button class="fila-chip" data-idx="${i}" title="Cancelar">${esc(it.acao.nome)} ${ico('x', 11)}</button>`).join('')
      : '<span class="fila-vazia">Fila de comando vazia</span>';

    el.acoes.className = `acoes ${consoleAberto ? 'aberto' : 'minimizado'}`;
    el.acoes.innerHTML = `
      <div class="acoes-cab">
        <div class="tabs">${tabs}</div>
        <div class="acoes-status">
          <span title="Pontos de Ação: quantas jogadas você pode fazer neste ciclo antes de avançar o turno.">${ico('zap', 12)} ${jogo.estado.pontos_acao} <small>ações restantes</small></span>
          <span>${dinheiro(jogo.estado.tesouro)}</span>
          <button class="ac-toggle" id="ac-toggle" title="${consoleAberto ? 'Minimizar' : 'Expandir'}">${ico(consoleAberto ? 'chevron-down' : 'chevron-up', 14)}</button>
        </div>
      </div>
      <div class="acoes-painel">
        <div class="acao-grade">${lista}</div>
      </div>
      <div class="fila-barra">
        <div class="fila">${fila}</div>
        <button class="passar" id="btn-passar">EXECUTAR CICLO ${ico('chevrons-right', 14)}</button>
      </div>`;

    el.acoes.querySelector('#ac-toggle').addEventListener('click', () => { consoleAberto = !consoleAberto; renderAcoes(); });
    el.acoes.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
      if (catAtual === b.dataset.cat && consoleAberto) consoleAberto = false;
      else { catAtual = b.dataset.cat; consoleAberto = true; }
      renderAcoes();
    }));
    el.acoes.querySelectorAll('.acao-chip[data-acao]').forEach((b) => b.addEventListener('click', () => {
      if (jogo.enfileirar(b.dataset.acao).ok) { renderAcoes(); renderTopo(); }
    }));
    el.acoes.querySelectorAll('.acao-chip[data-inv]').forEach((b) => b.addEventListener('click', () => abrirInvestimento(ACAO_POR_ID[b.dataset.inv])));
    el.acoes.querySelectorAll('.acao-chip[data-equip]').forEach((b) => b.addEventListener('click', () => {
      abrirEquipamento(b.dataset.equip, jogo, { onFim: () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); } });
    }));
    el.acoes.querySelectorAll('.fila-chip').forEach((b) => b.addEventListener('click', () => { jogo.cancelar(Number(b.dataset.idx)); renderAcoes(); renderTopo(); }));
    el.acoes.querySelector('#btn-passar')?.addEventListener('click', passarTurno);
  }

  // ── Painel de país (globo) ───────────────────────────────────────────
  function cardAcaoPais(a) {
    const bloqueado = jogo.estado.pontos_acao < a.custoPA || jogo.estado.tesouro < a.custo || !cumpre(a.requer);
    return `<button class="pais-acao ${a.recomendada ? 'rec' : ''}" data-id="${a.id}" ${bloqueado ? 'disabled' : ''}>
      <div class="pa-top">${a.icone} <b>${esc(a.nome)}</b> ${a.recomendada ? '<span class="rec-selo">RECOMENDADO</span>' : ''}</div>
      <div class="pa-desc">${esc(a.descricao)}</div>
      <div class="pa-info"><span>${a.custo > 0 ? dinheiro(a.custo) : 'grátis'}</span><span title="Custa ${a.custoPA} ponto(s) de ação neste ciclo.">⚡${a.custoPA}</span><span class="prob ${a.prob < 0.7 ? 'risco' : ''}">${prob(a.prob)}</span></div>
    </button>`;
  }

  function abrirPainelPais(feature) {
    if (jogo.fase !== 'planejamento') return;
    const code = iso(feature);
    const ehJogador = souEu(code);
    const oc = ocupacaoDe(jogo.estado, code);

    // BASES: parceiro (rel ≥ 40) aceita negociar; território ocupado não é consultado.
    // O botão só existe onde a jogada é real — nada de oferecer o que não dá pra fazer.
    const relAqui = ehJogador ? 0 : relacaoAtual(jogo.estado, feature);
    const elegBase = ehJogador ? { pode: false } : podeInstalarBase(jogo.estado, code, relAqui);
    const basesAqui = basesEm(jogo.estado, code);
    const botaoBase = (elegBase.pode || basesAqui.length)
      ? `<button class="pp-base ${basesAqui.length ? 'tem' : ''}" id="pp-base">
          ${ico('radio-tower', 16)}
          <span>${basesAqui.length
            ? `${basesAqui.length} INSTALAÇÃO(ÕES) ATIVA(S) — GERENCIAR`
            : 'INSTALAR BASE MILITAR'}</span>
        </button>`
      : '';

    let cabecalho; let corpo; let acoes;
    if (oc) {
      // ── TERRITÓRIO OCUPADO: administração ──
      acoes = acoesOcupacao(jogo.estado, oc);
      const nivel = oc.insurgencia >= 70 ? 'critica' : oc.insurgencia >= 40 ? 'alta' : 'baixa';
      const bd = bandeiraDeFeature(feature);
      cabecalho = `<div class="pp-cab">${bd ? `<img class="pp-flag ocupada" src="${bd}" alt="">` : ''}<h2>${esc(oc.nome)}</h2><span class="pp-rel rel-ocupado">SOB OCUPAÇÃO</span><button class="pp-fechar">${ico('x', 15)}</button></div>`;
      const petro = petroleoDe(code);
      corpo = `<div class="pp-ocup">
          <div class="ppo-linha"><span>Insurgência</span><b class="ins-${nivel}">${oc.insurgencia}%</b></div>
          <div class="barra"><div class="preench" style="width:${oc.insurgencia}%;background:${oc.insurgencia >= 70 ? '#ff3b5c' : oc.insurgencia >= 40 ? '#ffb020' : '#22e0a0'}"></div></div>
          <div class="ppo-nota">${oc.insurgencia >= 70 ? 'A qualquer momento perdemos o território. Aja AGORA.' : 'A insurgência sobe todo turno. Integre, guarneça ou reprima.'}</div>
          <div class="ppo-desde">Ocupado há ${oc.desde || 0} ciclo(s)</div>
          ${petro ? `<div class="ppo-oleo">${ico('fuel', 13)}
            <span><b>${petro.reservas} bi de barris</b> em reservas provadas · extraindo ${
              (jogo.estado.petroleo_espolio || []).find((e) => e.iso === code)?.extraido ?? 0
            } de ${petro.producao} Mb/d.<br><i>${esc(petro.nota)}</i></span></div>` : ''}
        </div>${botaoBase}`;
    } else if (ehJogador) {
      // ── SUA PRÓPRIA NAÇÃO: nada de "acordo comercial consigo mesmo" ──
      acoes = [];
      const bd = bandeiraDeFeature(feature);
      const fc = forcaCombate(jogo.estado.forcas);
      cabecalho = `<div class="pp-cab">${bd ? `<img class="pp-flag" src="${bd}" alt="">` : ''}<h2>${esc(jogo.ficha.pais)}</h2><span class="pp-rel rel-voce">SUA NAÇÃO</span><button class="pp-fechar">✕</button></div>`;
      corpo = `<div class="pp-eu">
          <div class="ppe-grid">
            <div class="ppe-cel"><span>Força de combate</span><b>${fc}</b></div>
            <div class="ppe-cel"><span>Territórios</span><b>${jogo.estado.territorio}</b></div>
            <div class="ppe-cel"><span>Ogivas</span><b>${jogo.estado.ogivas}</b></div>
            <div class="ppe-cel"><span>Tesouro</span><b>${dinheiro(jogo.estado.tesouro)}</b></div>
          </div>
          <div class="ppe-nota">Aqui é casa. Use o console embaixo para agir — e o globo para agir sobre os outros.</div>
        </div>`;
    } else {
      const dados = acoesPais(feature, jogo.estado);
      acoes = dados.acoes;
      const rel = dados.rel;
      const relTxt = rel >= 30 ? 'Aliado' : rel <= -30 ? 'Hostil' : rel < 0 ? 'Tenso' : 'Neutro';
      const bd = bandeiraDeFeature(feature);
      cabecalho = `<div class="pp-cab">${bd ? `<img class="pp-flag" src="${bd}" alt="">` : ''}<h2>${esc(dados.nome)}</h2><span class="pp-rel rel-${relTxt.toLowerCase()}">${relTxt} · ${rel}</span><button class="pp-fechar">${ico('x', 15)}</button></div>`;
      const petro = petroleoDe(code);
      corpo = `${petro ? `<div class="pp-oleo">${ico('fuel', 15)}
          <div><b>${petro.reservas} bi de barris</b> · ${petro.producao} Mb/d · ${esc(petro.tipo)}
          <small>${esc(petro.nota)}</small></div>
        </div>` : ''}
        <button class="pp-guerra" id="pp-guerra">${ico('swords', 16)} <span>PLANEJAR OFENSIVA MILITAR</span></button>
        ${botaoBase}
        ${alvosDeAjuda(jogo.estado).some((a) => a.iso === code) ? `<button class="pp-ajuda" id="pp-ajuda">${ico('heart-handshake', 16)} <span>APOIAR NESTA GUERRA</span><i>em conflito</i></button>` : ''}
        ${(jogo.estado.ogivas > 0 && !souEu(code)) ? `<button class="pp-nuke" id="pp-nuke">${ico('radiation', 16)} <span>LANÇAMENTO NUCLEAR</span><i>${jogo.estado.ogivas} ogiva(s)</i></button>` : ''}`;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-fundo';
    modal.innerHTML = `<div class="pais-painel">
      ${cabecalho}${corpo}
      <div class="pais-acoes">${acoes.map(cardAcaoPais).join('')}</div>
    </div>`;
    document.body.appendChild(modal);
    const fechar = () => modal.remove();
    modal.querySelector('.pp-fechar').addEventListener('click', fechar);
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
    const atualizarTudo = () => { renderHud(); renderFeed(); renderAcoes(); renderTopo(); globoCtrl?.atualizar(); };
    modal.querySelector('#pp-guerra')?.addEventListener('click', () => {
      fechar();
      globoCtrl?.focar?.(feature);
      abrirGuerra(feature, jogo, { onFim: atualizarTudo });
    });
    modal.querySelector('#pp-nuke')?.addEventListener('click', () => {
      fechar();
      globoCtrl?.focar?.(feature);
      abrirNuclear(feature, jogo, { onFim: atualizarTudo, globoCtrl });
    });
    modal.querySelector('#pp-ajuda')?.addEventListener('click', () => {
      fechar();
      globoCtrl?.focar?.(feature);
      abrirAjuda(feature, jogo, { onFim: atualizarTudo, globoCtrl });
    });
    modal.querySelector('#pp-base')?.addEventListener('click', () => {
      fechar();
      globoCtrl?.focar?.(feature);
      abrirBases(feature, jogo, {
        relValor: relAqui, nome: oc?.nome || nomePais(feature),
        onFim: atualizarTudo,
        onAtualizar: atualizarTudo,   // a HUD atualiza NA HORA, não só ao fechar
      });
    });
    modal.querySelectorAll('.pais-acao[data-id]').forEach((b) => b.addEventListener('click', () => {
      const a = acoes.find((x) => x.id === b.dataset.id);
      if (jogo.enfileirarCustom(a).ok) {
        // BUG QUE ISTO CONSERTA: TODA ação disparava uma esquadrilha de caças até o
        // alvo. Fechar um acordo comercial mandava jato. A animação precisa dizer a
        // verdade sobre o que está acontecendo — senão vira ruído bonito.
        //
        // Agora cada ação tem a sua linguagem visual, e só a violência voa:
        const tipo = /guerra|golpe|sabotar/.test(a.id) ? 'ataque'
          : /espiar|intel|vigil/.test(a.id) ? 'espionagem'
            : /comercio|alianca|ajuda|acordo/.test(a.id) ? 'comercio'
              : /sancao|embargo/.test(a.id) ? 'sancao' : 'foco';
        globoCtrl?.desenharLinha?.(feature, tipo, 6000);
        // Só ação militar move ferro. O resto é uma linha no mapa e pronto.
        if (tipo === 'ataque') globoCtrl?.lancarEsquadrilha?.(feature, 'ataque');
        fechar(); renderAcoes(); renderTopo();
      }
    }));
  }

  // ── Investimento de valor livre (você define quanto) ─────────────────
  function abrirInvestimento(a) {
    if (!a?.escalavel) return;
    const e = a.escalavel;
    const maxV = Math.max(0.1, Math.floor(jogo.estado.tesouro * 10) / 10);
    let val = Math.min(1, maxV);

    const modal = document.createElement('div');
    modal.className = 'modal-fundo';
    modal.innerHTML = `<div class="invest-painel">
      <div class="ip-cab"><span class="ip-ic">${a.icone}</span><h2>${esc(a.nome)}</h2><button class="pp-fechar">✕</button></div>
      <div class="ip-desc">${esc(a.descricao)}</div>
      <div class="ip-valor" id="ip-valor">${dinheiro(val)}</div>
      <input type="range" id="ip-slider" min="0.1" max="${maxV}" step="0.1" value="${val}" class="ip-slider" />
      <div class="ip-limites"><span>US$ 0.1 tri</span><span>máx ${dinheiro(maxV)}</span></div>
      <div class="ip-projecao" id="ip-proj"></div>
      <button class="ip-confirmar primario" id="ip-ok">INVESTIR</button>
    </div>`;
    document.body.appendChild(modal);

    const proj = () => {
      const efe = { [e.chave]: Math.round(val * e.porTri) };
      for (const [k, r] of Object.entries(e.extra || {})) efe[k] = Math.round(val * r * 0.5) || (r > 0 ? 1 : 0);
      modal.querySelector('#ip-proj').innerHTML = `<div class="ipp-tit">Impacto projetado</div><div class="ipp-chips">${chipsMudancas(Object.entries(efe).map(([chave, delta]) => ({ chave, delta })))}</div>`;
      return efe;
    };
    proj();
    modal.querySelector('#ip-slider').addEventListener('input', (ev) => {
      val = Number(ev.target.value);
      modal.querySelector('#ip-valor').textContent = dinheiro(val);
      proj();
    });
    const fechar = () => modal.remove();
    modal.querySelector('.pp-fechar').addEventListener('click', fechar);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });
    modal.querySelector('#ip-ok').addEventListener('click', () => {
      const efeitos = proj();
      const acao = { id: `${a.id}_${Date.now()}`, icone: a.icone, nome: `${a.nome} (${dinheiro(val)})`, custo: val, custoPA: a.custoPA || 1, prob: 1, efeitos, categoria: a.categoria };
      if (jogo.enfileirarCustom(acao).ok) { fechar(); renderAcoes(); renderTopo(); }
    });
  }

  function cumpre(req) {
    if (!req) return true;
    for (const [k, expr] of Object.entries(req)) {
      const m = /^\s*([<>]=?)\s*(-?\d+)\s*$/.exec(expr); if (!m) continue;
      const [, op, alvo] = m; const a = Number(jogo.estado[k] ?? 0); const n = Number(alvo);
      if (!((op === '>' && a > n) || (op === '>=' && a >= n) || (op === '<' && a < n) || (op === '<=' && a <= n))) return false;
    }
    return true;
  }

  // ── Crise (overlay) ──────────────────────────────────────────────────
  function renderCarta(carta, opcoes, origem, resultados) {
    renderBadge(origem);
    const p = jogo.personagem(carta.personagem);
    const quem = p ? `<div class="quem"><div class="avatar">🗣️</div><div><div class="papel">${esc(p.papel)}</div><div class="nome">${esc(p.nome)}</div></div></div>` : '';
    const resumo = resultados?.length ? `<div class="resultados">${resultados.map((r) => `<span class="res ${r.sucesso ? 'ok' : 'fail'}">${r.icone} ${esc(r.nome)} ${r.sucesso ? '✓' : '✗'}</span>`).join('')}</div>` : '';
    const botoes = opcoes.map((op, i) => `<button class="opcao" data-i="${i}" ${op.bloqueada ? 'disabled' : ''}><span>${esc(op.texto)}</span>${op.bloqueada ? '<span class="cadeado">🔒</span>' : ''}</button>`).join('');
    el.carta.innerHTML = `<div class="carta">${resumo}${quem}<h2>${esc(carta.titulo)}</h2><div class="narr">${esc(carta.narrativa)}</div><div class="opcoes">${botoes}</div></div>`;
    el.carta.querySelectorAll('.opcao').forEach((b) => b.addEventListener('click', () => escolher(Number(b.dataset.i))));
  }

  // ── Sequência cinematográfica do ciclo ───────────────────────────────
  let bandaAntes = null;
  let ultimaRes = null;

  const RUIM_SOBE = new Set(['divida', 'temp_guerra']);
  function descreverMudancas(mudancas) {
    return (mudancas || []).filter((m) => m.delta).map((m) => {
      const v = VARS[m.chave];
      const dinh = v?.dinheiro;
      const txt = dinh ? (m.delta > 0 ? '+' : '') + dinheiro(m.delta) : (m.delta > 0 ? '+' : '') + Math.round(m.delta);
      const bom = RUIM_SOBE.has(m.chave) ? m.delta < 0 : m.delta > 0;
      // nada de "rel_ira" na tela do jogador
      const rotulo = v?.rotulo || (m.chave.startsWith('rel_') ? rotuloRelacao(m.chave) : m.chave);
      return { rotulo, texto: txt, bom };
    });
  }

  // ── Motor de JORNADA: páginas encadeadas com "PRÓXIMO" ────────────────
  function jornada(paginas, aoFim) {
    let i = 0;
    const passo = () => {
      if (i >= paginas.length) return aoFim?.();
      const p = paginas[i]; i += 1;
      const ultima = i >= paginas.length;
      el.carta.innerHTML = `<div class="cena jrn ${p.classe || ''}">
        <div class="jrn-topo">
          <div class="cena-cab">${p.cab}</div>
          <div class="jrn-passos">${paginas.map((_, k) => `<span class="jp ${k < i ? 'on' : ''}"></span>`).join('')}</div>
        </div>
        <div class="jrn-corpo">${p.corpo}</div>
        <button class="avancar" id="jrn-go">${ultima ? (p.btnFim || 'ASSUMIR O PRÓXIMO CICLO') : (p.btn || 'PRÓXIMO')} ${ico('chevron-right', 15)}</button>
      </div>`;
      el.carta.querySelector('#jrn-go').addEventListener('click', passo);
      p.aoMostrar?.();
    };
    passo();
  }

  // Post no estilo X (mesmo do feed) — usado na página de imprensa da jornada.
  function postX(p, idx = 0) {
    const v = veiculoDe(p.veiculo);   // mesma correção do renderFeed: lista viva da partida
    const nome = p.veiculo || (p.handle || '').replace('@', '');
    const logo = logoDe(v);   // pelo domínio: o mapa manual só cobre 4 veículos
    const avatar = v
      ? (logo ? `<img class="x-avatar logo" src="${logo}" alt="">` : `<div class="x-avatar wordmark" style="background:${v.cor}">${esc(nome.slice(0, 2).toUpperCase())}</div>`)
      : `<img class="x-avatar" src="${retrato(p.handle || nome, 'avataaars')}" alt="">`;
    return `<article class="x-post na-jornada">
      ${avatar}
      <div class="x-corpo">
        <div class="x-cab"><span class="x-nome">${esc(nome)}</span>${v ? '<span class="x-verif">✔</span>' : ''}<span class="x-handle">${esc(p.handle)} · ${1 + idx}min</span></div>
        <div class="x-txt">${esc(p.texto)}</div>
        ${v ? `<div class="x-link"><div class="x-link-img" style="background:${v.cor}">${logo ? `<img src="${logo}" alt="">` : `<span class="x-link-word">${esc(v.nome)}</span>`}</div>
          <div class="x-link-info"><div class="x-link-dom">${ico('link', 10)} ${esc(v.dominio)}</div>
          <div class="x-link-tit">${esc(p.manchete || p.texto.slice(0, 64))}${!p.manchete && p.texto.length > 64 ? '…' : ''}</div>
          <div class="x-link-sub">${esc(v.nome)} · ${esc(v.posicao)}</div></div></div>` : ''}
      </div></article>`;
  }
  function chipsMudancas(mudancas) {
    const d = descreverMudancas(mudancas);
    if (!d.length) return '<span class="sem-mud">sem impacto direto</span>';
    return d.map((x) => `<span class="mud ${x.bom ? 'bom' : 'ruim'}">${esc(x.rotulo)} <b>${esc(x.texto)}</b></span>`).join('');
  }
  function jornais() {
    const posts = jogo.feed.filter((p) => p.veiculo).slice(0, 2);
    if (!posts.length) return '';
    return `<div class="jornais">${posts.map((p) => `
      <div class="jornal" style="--jc:${p.cor || '#8a97b8'}">
        <div class="j-masthead">${esc(p.veiculo)}</div>
        <div class="j-manchete">${esc(p.manchete || p.texto)}</div>
        <div class="j-byline">${esc(p.handle)} · redação</div>
      </div>`).join('')}</div>`;
  }

  async function passarTurno() {
    cancelarFlash();
    bandaAntes = jogo.banda;
    el.carta.innerHTML = `<div class="cena"><div class="carregando"><span class="spin"></span> Executando ordens · o mundo reage…</div></div>`;
    el.acoes.innerHTML = `<div class="acoes-bloqueado">◐ Ciclo em execução…</div>`;
    try {
      const res = await jogo.passarTurno();
      ultimaRes = res;
      renderHud(); renderFeed(); renderBadge(res.origem);
      cenaResultados(res);
    } catch (err) {
      el.carta.innerHTML = `<div class="cena"><div class="narr" style="color:var(--perigo)">A Máquina travou: ${esc(err.message)}</div><button class="avancar" id="tentar">Tentar de novo</button></div>`;
      el.carta.querySelector('#tentar').addEventListener('click', passarTurno);
    }
  }

  // Cena 1 — JORNADA: uma página por ação executada
  function cenaResultados(res) {
    if (!res.resultados.length) return cenaCrise(res);
    const P = jogo.presidente?.nome;
    const paginas = res.resultados.map((r, i) => ({
      classe: r.sucesso ? 'jrn-ok' : 'jrn-fail',
      cab: `${ico('scroll-text', 13)} AÇÃO ${i + 1} DE ${res.resultados.length}`,
      btn: 'PRÓXIMO',
      btnFim: 'VER O DESDOBRAMENTO',
      corpo: `
        <div class="ja-selo ${r.sucesso ? 'ok' : 'fail'}">${ico(r.sucesso ? 'circle-check' : 'circle-x', 15)} ${r.sucesso ? 'SUCESSO' : 'FRACASSO'}</div>
        <h2 class="ja-nome">${r.icone} ${esc(r.nome)}</h2>
        <div class="ja-frase">"${esc(fraseImpacto(r, P))}"</div>
        <div class="ja-sub">${ico('activity', 12)} IMPACTO</div>
        <div class="ja-pills">
          ${(r.ganhoForcas || []).map((g) => `<span class="ja-pill bom">${g.icone} <b>+${g.delta.toLocaleString('pt-BR')}</b> ${esc(g.nome)}</span>`).join('')}
          ${descreverMudancas(r.mudancas).map((m) => `<span class="ja-pill ${m.bom ? 'bom' : 'ruim'}"><b>${esc(m.texto)}</b> ${esc(m.rotulo)}</span>`).join('')}
          ${!r.mudancas?.length && !r.ganhoForcas?.length ? '<span class="sem-mud">sem impacto direto</span>' : ''}
        </div>`,
    }));
    jornada(paginas, () => {
      if (res.desbloqueios?.length) popupDesbloqueio(res.desbloqueios, () => cenaCrise(res));
      else cenaCrise(res);
    });
  }

  // Cena 2 — a crise da Máquina
  function cenaCrise(res) {
    renderCarta(res.carta, res.opcoesDisponiveis, res.origem, null);
  }

  // ── EVENTOS DO MUNDO VIVO, animados no globo ao fechar o ciclo ────────
  // Cada evento chega com uma instrução `visual`. Escalonados (2,2s entre cada):
  // três arcos simultâneos viram macarrão; em fila viram narrativa.
  function animarEventosVivos(eventos) {
    let atraso = 1200;
    for (const e of eventos || []) {
      const v = e.visual;
      if (!v) continue;
      setTimeout(() => {
        const g = globoCtrl;
        if (!g) return;
        if (v.tipo === 'conflito') {
          const de = g.ondeEsta?.(v.a); const para = g.ondeEsta?.(v.b);
          if (de && para) {
            g.desenharLinha?.(para, 'ataque', 8000, de);
            if (v.novo) g.salvaMisseis?.(para, 3, de);
            g.balao?.(para, e.texto, 'ruim');
          }
        } else if (v.tipo === 'pacto') {
          const de = g.ondeEsta?.(v.a); const para = g.ondeEsta?.(v.b);
          if (de && para) { g.desenharLinha?.(para, 'comercio', 8000, de); g.balao?.(para, e.texto, 'bom'); }
        } else if (v.tipo === 'pandemia' && v.isos?.length) {
          const c = g.ondeEsta?.(v.isos[0]);
          if (c) g.balao?.(c, e.texto, 'aviso');
        } else if (v.tipo === 'fimConflito' || v.tipo === 'fimPandemia') {
          const c = g.ondeEsta?.(v.a || v.isos?.[0]);
          if (c) g.balao?.(c, e.texto, 'bom');
        }
      }, atraso);
      atraso += 2200;
    }
  }

  function escolher(i) {
    const r = jogo.resolverCarta(i);
    renderHud(r.mudancas); renderFeed();

    const soma = agregarDeltas(ultimaRes?.resultados, r.mudancas);
    const epico = epicoDoCiclo({ soma, resultados: ultimaRes?.resultados, bandaAntes, bandaDepois: jogo.banda, estado: jogo.estado, economia: r.economia });

    globoCtrl?.atualizar();
    animarEventosVivos(r.eventosVivos);
    // A crise fiscal entra DEPOIS das consequências do ciclo: o jogador precisa
    // ver o estrago (juro comendo o caixa) antes de escolher o remédio.
    const prosseguir = () => {
      if (r.fim) return mostrarFim(r.fim);
      cenaConsequencias(r, soma, r.criseFiscal
        ? () => abrirCriseFiscal(jogo, { onFim: () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); } })
        : null);
    };
    const comDesbloq = () => (r.desbloqueios?.length ? popupDesbloqueio(r.desbloqueios, prosseguir) : prosseguir());

    if (epico) { sirene({ ruim: epico.tipo === 'ruim' }); flashTela(epico.tipo === 'ruim'); popupEpico(epico, comDesbloq); }
    else comDesbloq();
  }

  // Cena 3 — JORNADA do desfecho: impacto → mundo → imprensa → balanço
  // `aoTerminar` é opcional e hoje serve à crise fiscal: ela só aparece depois
  // que o jogador VIU o balanço, nunca antes.
  function cenaConsequencias(r, soma, aoTerminar) {
    const ciclo = jogo.turno - 1;
    const manchete = mancheteDoCiclo({ soma, resultados: ultimaRes?.resultados, economia: r.economia });
    const despachos = despachosDoCiclo({ soma, resultados: ultimaRes?.resultados });
    const posts = jogo.feed.filter((p) => p.tipo !== 'sistema').slice(0, 3);
    const paginas = [];

    // 1) A decisão da crise e o que ela custou
    paginas.push({
      cab: `${ico('gavel', 13)} CICLO ${ciclo} · A DECISÃO`,
      corpo: `
        <div class="manchete">"${esc(manchete)}"</div>
        <div class="ja-sub">${ico('activity', 12)} O QUE MUDOU</div>
        <div class="ja-pills">${descreverMudancas(r.mudancas).map((m) => `<span class="ja-pill ${m.bom ? 'bom' : 'ruim'}"><b>${esc(m.texto)}</b> ${esc(m.rotulo)}</span>`).join('') || '<span class="sem-mud">sem impacto direto</span>'}</div>
        <div class="jd-despachos">${despachos.map((d) => `<div class="despacho ${d.tom}"><div class="d-autor">${ico('quote', 11)} ${esc(d.autor)}</div><div class="d-txt">${esc(d.texto)}</div></div>`).join('')}</div>`,
    });

    // 1.5) VOCÊ FOI INVADIDO — a página que rouba a cena, e deve mesmo.
    // Vem logo depois da decisão e antes do resto porque é a maior coisa que pode
    // acontecer num ciclo: alguém cruzou sua fronteira. Se isto aparecesse como uma
    // linha no painel do mundo, o jogador leria "fui invadido" no mesmo peso visual de
    // "a Turquia assinou um acordo de gás".
    if (r.invasao) {
      const iv = r.invasao;
      paginas.push({
        classe: iv.repeliu ? 'inv repeliu' : 'inv caiu',
        cab: `${ico('siren', 13)} INVASÃO · ${esc(iv.agressor.nome.toUpperCase())} ${verbo(iv.agressor.nome, 'CRUZOU', 'CRUZARAM')} A FRONTEIRA`,
        corpo: `
          <div class="manchete">"${esc(mancheteDaInvasao(iv))}"</div>
          <div class="inv-conta">
            <div class="inv-lado ${iv.repeliu ? 'ok' : 'mal'}">
              <div class="inv-rot">SUA DEFESA</div>
              <div class="inv-num">${iv.minhaDefesa}</div>
              <div class="inv-det">${iv.meuInventario} seu${iv.boostAliado > 0 ? ` <b>+ ${iv.boostAliado} de aliados</b>` : ' · ninguém veio'}</div>
            </div>
            <div class="inv-vs">${iv.repeliu ? 'SEGUROU' : 'CEDEU'}</div>
            <div class="inv-lado">
              <div class="inv-rot">${esc(iv.agressor.nome)}</div>
              <div class="inv-num">${iv.poderDele}</div>
              <div class="inv-det">relação ${iv.agressor.rel} · ${esc(iv.agressor.motivo)}</div>
            </div>
          </div>
          ${iv.apoios.length ? `<div class="inv-aliados">
            <div class="ja-sub">${ico('users', 12)} QUEM VEIO POR VOCÊ</div>
            ${iv.apoios.map((a) => `<div class="inv-al-item">
              <img class="gp-coa-flag" src="${bandeira(ISO2_DE[a.de], 40) || ''}" alt="" onerror="this.style.visibility='hidden'">
              <span class="gp-coa-nome">${esc(a.nomeDe)}</span>
              <span class="gp-coa-motivo">${esc(a.motivoTexto || a.motivo)}</span>
              <span class="inv-al-poder">+${a.poder}</span>
            </div>`).join('')}
          </div>` : `<div class="inv-sozinho">${ico('triangle-alert', 14)} Nenhum aliado se mexeu. Você estava sozinho — e agora sabe disso.</div>`}
          <div class="ja-sub">${ico('activity', 12)} O QUE ISSO CUSTOU</div>
          <div class="ja-pills">${descreverMudancas(iv.mudancas).map((m) => `<span class="ja-pill ${m.bom ? 'bom' : 'ruim'}"><b>${esc(m.texto)}</b> ${esc(m.rotulo)}</span>`).join('')}</div>
          ${iv.perdas.length ? `<div class="inv-perdas">${iv.perdas.map((p) => `<span class="mud ruim">${esc(p.nome)} <b>-${p.perdido.toLocaleString('pt-BR')}</b></span>`).join('')}</div>` : ''}`,
        aoMostrar: () => { sirene(); flashTela(); },
      });
    }

    // 2) O mundo se moveu
    if (r.eventosMundo?.length) {
      paginas.push({
        cab: `${ico('globe', 13)} ENQUANTO ISSO, NO RESTO DO MUNDO`,
        corpo: `<div class="jd-mundo">${r.eventosMundo.map((e) => `<div class="mm-linha ${e.tom}">${esc(e.texto)}</div>`).join('')}</div>`,
      });
    }

    // 3) A imprensa — posts do X de verdade
    if (posts.length) {
      const imp = jogo.imprensa().sort((a, b) => b.valor - a.valor);
      paginas.push({
        cab: `${ico('radio', 13)} A IMPRENSA REAGE`,
        corpo: `<div class="jd-feed">${posts.map((p, i) => postX(p, i)).join('')}</div>
          <div class="jd-tom">${imp.slice(0, 4).map((i) => `<span class="jt" style="color:${i.cor};border-color:${i.cor}">${esc(i.nome)}: ${esc(i.tom)}</span>`).join('')}</div>`,
      });
    }

    // 4) Balanço final do ciclo
    paginas.push({
      cab: `${ico('chart-line', 13)} BALANÇO DO CICLO ${ciclo}`,
      btnFim: 'ASSUMIR O PRÓXIMO CICLO',
      corpo: `
        <div class="jd-balanco">
          <div class="jb-item"><span>Caixa do ciclo</span><b class="${r.economia.saldo >= 0 ? 'bom' : 'ruim'}">${r.economia.saldo >= 0 ? '+' : ''}${dinheiro(r.economia.saldo)}</b></div>
          <div class="jb-item"><span>Tesouro agora</span><b class="amb">${dinheiro(jogo.estado.tesouro)}</b></div>
          <div class="jb-item"><span>Trajetória</span><b style="color:${jogo.banda.cor}">${jogo.banda.nome}</b></div>
          <div class="jb-item"><span>Destino</span><b style="color:${jogo.banda.cor}">${jogo.destino}/100</b></div>
        </div>
        <div class="jd-barra"><div class="preench" style="width:${jogo.destino}%;background:${jogo.banda.cor}"></div></div>
        <div class="jd-regime">${ico('landmark', 13)} O mundo te vê como <b>${esc(jogo.rotulo.label)}</b> — ${esc(jogo.rotulo.descricao)}</div>`,
    });

    jornada(paginas, () => {
      el.carta.innerHTML = ''; renderAcoes(); renderTopo();
      aoTerminar?.();   // a crise fiscal, quando o ciclo fechou no vermelho
    });
  }

  // Popup ÉPICO com sirene
  function popupEpico(ep, onClose) {
    const m = document.createElement('div');
    m.className = `modal-fundo epico ${ep.tipo}`;
    m.innerHTML = `<div class="epico-card ${ep.tipo}">
      <div class="sirene-luz"></div>
      <div class="ep-tag">◉ ALERTA MÁXIMO ◉</div>
      <div class="ep-titulo">${esc(ep.titulo)}</div>
      <div class="ep-texto">${esc(ep.texto)}</div>
      <button class="ep-ok primario">PROSSEGUIR</button>
    </div>`;
    document.body.appendChild(m);
    m.querySelector('.ep-ok').addEventListener('click', () => { m.remove(); onClose?.(); });
  }

  // ── Popup de desbloqueio (surpresa) ──────────────────────────────────
  function popupDesbloqueio(lista, onClose) {
    const modal = document.createElement('div');
    modal.className = 'modal-fundo pop-desbloqueio';
    modal.innerHTML = `<div class="desbloqueio-card">
      <div class="db-brilho"></div>
      <div class="db-icone">🔓</div>
      <div class="db-titulo">NOVA CAPACIDADE DESBLOQUEADA</div>
      <div class="db-lista">${lista.map((a) => `<div class="db-item"><span class="db-i">${a.icone}</span><div><b>${esc(a.nome)}</b><span class="db-cat">${esc(a.categoria)}</span></div></div>`).join('')}</div>
      <button class="db-ok primario">EXCELENTE</button>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.db-ok').addEventListener('click', () => { modal.remove(); onClose?.(); });
  }

  function mostrarFim(fim) {
    cancelarFlash();
    const venceu = fim.tipo === 'vitoria';
    const e = jogo.estado;
    const anos = jogo.turno; // 1 ciclo = 1 ano de mandato
    const guerras = jogo.historico.filter((h) => /guerra|ofensiva/i.test(h.carta || '')).length;
    const conq = e.conquistados?.length || 0;
    const imprensaFinal = jogo.imprensa().sort((a, b) => b.valor - a.valor);
    const amiga = imprensaFinal[0]; const inimiga = imprensaFinal[imprensaFinal.length - 1];

    const legado = venceu
      ? (e.territorio > 1 ? 'Conquistador. Redesenhou o mapa e obrigou o mundo a decorar seu nome.' : 'Estadista. Atravessou a tempestade sem afundar o barco — e poucos conseguem isso.')
      : (e.aprovacao <= 5 ? 'Deposto. O povo que te aplaudiu foi o mesmo que te arrancou da cadeira.'
        : e.divida >= 200 ? 'Quebrado. Você tinha o maior PIB do planeta e ainda assim deixou a conta na mesa.'
        : 'Esquecido. Nem herói, nem vilão — só mais um nome numa lista longa.');

    const pill = (rot, val, cor) => `<div class="fim-pill"><span>${rot}</span><b style="color:${cor || 'var(--texto)'}">${val}</b></div>`;

    container.insertAdjacentHTML('beforeend', `
      <div class="modal-fundo fim-fundo ${venceu ? 'v' : 'd'}">
        <div class="fim-card ${venceu ? 'v' : 'd'}">
          <div class="fim-luz"></div>
          <div class="fim-selo">${ico(venceu ? 'crown' : 'skull', 46)}</div>
          <div class="fim-tag">${venceu ? 'FIM DO REINADO · LEGADO GARANTIDO' : 'FIM DO REINADO · A HISTÓRIA SEGUIU SEM VOCÊ'}</div>
          <h1 class="fim-tit">${esc(fim.titulo)}</h1>
          <p class="fim-txt">${esc(fim.texto)}</p>

          <div class="fim-legado">${ico('gavel', 15)} <span>${esc(legado)}</span></div>

          <div class="fim-sec">${ico('chart-line', 13)} O QUE VOCÊ DEIXOU PRA TRÁS</div>
          <div class="fim-grid">
            ${pill('Anos no poder', anos, 'var(--cyan)')}
            ${pill('Destino final', `${jogo.destino}/100`, jogo.banda.cor)}
            ${pill('Regime', jogo.rotulo.label, 'var(--roxo)')}
            ${pill('PIB', dinheiro(e.pib), 'var(--ambar)')}
            ${pill('Tesouro', dinheiro(e.tesouro), 'var(--ambar)')}
            ${pill('Dívida/PIB', `${Math.round(e.divida)}%`, e.divida >= 150 ? 'var(--perigo)' : 'var(--texto)')}
            ${pill('Territórios', e.territorio, e.territorio > 1 ? 'var(--verde)' : 'var(--texto)')}
            ${pill('Ogivas', e.ogivas, e.ogivas ? 'var(--perigo)' : 'var(--fraco)')}
            ${pill('Força militar', forcaCombate(e.forcas), 'var(--cyan)')}
            ${pill('Aprovação', Math.round(e.aprovacao), e.aprovacao < 30 ? 'var(--perigo)' : 'var(--verde)')}
            ${pill('Soft Power', Math.round(e.soft_power), 'var(--roxo)')}
            ${pill('Ocupações', conq, conq ? '#ff9628' : 'var(--fraco)')}
          </div>

          <div class="fim-sec">${ico('radio', 13)} COMO A IMPRENSA VAI TE LEMBRAR</div>
          <div class="fim-imprensa">
            <div class="fim-jor"><b style="color:${amiga.cor}">${esc(amiga.nome)}</b><span>${esc(amiga.tom)}</span></div>
            <div class="fim-jor"><b style="color:${inimiga.cor}">${esc(inimiga.nome)}</b><span>${esc(inimiga.tom)}</span></div>
          </div>

          ${jogo.historico.length ? `<div class="fim-sec">${ico('scale', 13)} DECISÕES QUE TE DEFINIRAM</div>
          <div class="fim-hist">${jogo.historico.slice(-4).reverse().map((h) => `
            <div class="fim-h"><span class="fh-t">Ciclo ${h.turno}</span><span class="fh-c">${esc(h.carta)}</span><span class="fh-e">${esc(h.escolha)}</span></div>`).join('')}</div>` : ''}

          <button class="fim-btn" onclick="location.reload()">${ico('rotate-ccw', 16)} NOVO REINADO</button>
        </div>
      </div>`);
  }

  renderBadge(); renderHud(); renderFeed(); renderAcoes();
  window.__jogo = jogo; // hook de debug (dev)
  window.__render = { renderFeed, renderHud, renderAcoes, renderTopo }; // hook de debug (dev)
}
