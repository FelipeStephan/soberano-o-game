// A tela de jogo — centro de comando: globo 3D, HUD tático, feed, catálogo de ações,
// painel de país, popups de crise e de desbloqueio.
import { MEDIDORES, ECONOMIA, CAPACIDADES, VARS } from '../jogo/vars.js';
import { ACOES, CATEGORIAS, ACAO_POR_ID, tempoDe } from '../dados/acoes.js';
import { estaDesbloqueada } from '../jogo/desbloqueios.js';
import { dinheiro } from '../jogo/formato.js';
import { acoesPais } from '../jogo/diplomacia.js';
import { UNIDADES, DOMINIOS, forcaCombate } from '../dados/forcas.js';
import { descontoMilitar } from '../dados/blocos.js';
import { iso, souEu, rotuloRelacao, relacaoAtual, nomePais, verbo, PAISES } from '../dados/paises.js';
import { ocupacaoDe, acoesOcupacao } from '../jogo/ocupacao.js';
import { upkeepDe, acaoManterOrdem, acaoAnexar, podeAnexar, devolverSoberania, ANEXACAO_TURNOS_ESTAVEL } from '../jogo/manutencao.js';
import { riscoDe } from '../dados/riscos.js';
import { podeInstalarBase, basesEm } from '../dados/bases.js';
import { petroleoDe, bandaPreco } from '../dados/petroleo.js';
import { reservasControladas } from '../jogo/petroleo.js';
import { abrirBases } from './bases.js';
import { abrirNuclear } from './nuclear.js';
import { abrirAjuda } from './ajuda.js';
import { montarControleAudio } from './audio.js';
import { abrirCriseFiscal } from './fiscal.js';
import { abrirReforco } from './reforco.js';
import { abrirDistribuir } from './distribuir.js';
import { abrirIntervencao } from './intervencao.js';
import { abrirPandemia } from './pandemia.js';
import { abrirPaz } from './paz.js';
import { nivelEsp } from '../jogo/espionagem.js';
import { abrirEnvio } from './envio.js';
import { donoDe as donoDeEstado } from '../jogo/territorio.js';
import { abrirPosicaoNaval } from './naval.js';
import { alvosDeAjuda } from '../jogo/ajuda.js';
import { abrirGuerra, desfechoCarrossel } from './guerra.js';
import { resolverGuerra } from '../jogo/guerra.js';
import { multiplicadoresOfensiva } from '../jogo/ofensiva.js';
import { dispararBreaking } from './breaking.js';
import { abrirPontosQuentes, fecharPontosQuentes } from './pontosQuentes.js';
import { abrirIndiceMundial } from './indiceMundial.js';
import { statsVivos } from '../jogo/indiceMundial.js';
import { diagnosticoQueda, obituarioDaQueda } from './relatorioQueda.js';
import { abrirFakeNews } from './fakeNews.js';
import { abrirBlocosVisor } from './blocos.js';
import { montarTelefonia } from './telefone.js';
import { abrirMercado } from './mercado.js';
import { abrirEquipamento } from './equipamento.js';
import { abrirSoldados } from './soldados.js';
import { abrirEmpresas } from './empresas.js';
import { abrirConselheiro } from './conselheiro.js';
import { equipamentoDe } from '../dados/equipamentos.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { tetoSoldados } from '../dados/efetivoMilitar.js';
import { PRECO } from '../dados/mercado.js';
import { agendarFlash, cancelarFlash } from './urgente.js';
import { bandeiraDeFeature, bandeira, ISO2_DE, FOTO_ACAO, FOTO_UNIDADE, logoDe, retrato } from '../dados/imagens.js';
import { mancheteDaInvasao } from '../jogo/agressao.js';
import { VEICULO_POR_NOME } from '../dados/veiculos.js';
import { imprensaPorNome } from '../dados/imprensa.js';
import { ico, icoDe } from './icones.js';
import { ligarTips, q, tipAttr } from './tip.js';
import { ligarFaHover } from './faHover.js';
import { liderDe } from '../dados/lideres.js';
import { cartaoDe } from '../dados/registro.js';
import { blocosDoIso } from '../dados/blocos.js';
import { montarGlobo, tensaoGlobal } from './globo.js';
import { ligarOnline } from './online.js';
import { escaramucaAleatoria, pulsoAoVivo } from '../jogo/mundoVivo.js';
import { criarTempoReal } from './tempoReal.js';
import { anunciarResultado, INVERTIDAS } from './resultadoAcao.js';
import { reacoesSociais } from '../dados/opiniao.js';
import { temChave } from '../config.js';
import { agregarDeltas, mancheteDoTurno, despachosDoTurno, epicoDoTurno, fraseImpacto, veredito } from '../dados/dramaturgia.js';
import { sirene, flashTela, alertaUrgente } from './efeitos.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// TEMPO NO PODER: cada batida do mundo (turno) é um ANO de mandato. Como não há mais
// "passar turno", faz mais sentido ver o ANO correndo — e, no fim, quantos anos você durou.
// TEMPO NO PODER em MESES: cada batida do mundo é UM MÊS. Mostra "jan/2026" e, a cada 12
// meses, vira o ano — mais realista, e um jogo longo não fica futurístico.
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const ANO_BASE = 2026;
function mesAnoDoJogo(t) {
  const tt = Math.max(1, t || 0);
  const idx = (tt - 1) % 12;
  const ano = ANO_BASE + Math.floor((tt - 1) / 12);
  return { mes: MESES[idx], ano, label: `${MESES[idx]}/${ano}` };
}

// O logotipo do X (a rede social). SVG inline — nada de imagem externa, nada de emoji.
// É o glifo oficial do X, desenhado à mão em path pra herdar currentColor.
function logoX(tam = 20) {
  return `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="currentColor" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>`;
}
const prob = (p) => (p >= 1 ? '100%' : `${Math.round(p * 100)}%`);

export function iniciarJogo(container, jogo, opts = {}) {
  const online = !!opts.online;
  const net = opts.net || null;
  // Um listener no document cobre a HUD inteira, pra sempre: os cartões seguem
  // funcionando depois de cada redesenho por innerHTML, e modal novo já nasce com tip.
  ligarTips();
  // O dossiê visual das Forças Armadas: o resolver conhece o arsenal e o estado atual,
  // e devolve a foto ampliada + as infos complementares de cada unidade no hover.
  ligarFaHover((equipId) => {
    const u = UNIDADES.find((x) => x.id === equipId);
    if (!u) return null;
    const eq = equipamentoDe(jogo.ficha.iso || 'USA', u.id);
    const qtd = jogo.estado.forcas?.[u.id] || 0;
    return {
      foto: eq.foto, icone: u.icone, nome: eq.nome || u.nome, fab: eq.fab || '',
      dominio: u.dominio, qtd, poder: u.poder,
      contribui: Math.round(qtd * u.poder * 100) / 100,
      origem: eq.proprio === true ? 'nacional' : eq.proprio === 'licenca' ? 'licenca' : 'importado',
    };
  });
  const f = jogo.ficha;
  // Bandeira do topo pelo mapa CANÔNICO e completo (imagens.js). Antes usava um mapa local
  // com só 15 países — UKR/SAU/EGY/PRK/PAK/VEN/IDN caíam na bandeira dos EUA ('us').
  const ISO2_JOGADOR = ISO2_DE[f.iso] || 'us';
  let catAtual = 'Militar';
  let globoCtrl = null;
  let tr = null; // controlador do MODO TEMPO REAL (relógio + fila de ações com custo em segundos)
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
        <div class="stat" data-tip="O mês do seu mandato. O mundo corre em tempo real — o calendário anda mês a mês; a cada 12 meses o ano vira. Seu reinado termina quando o tempo (ou o povo) acabar." data-tip-t="Tempo no poder" data-tip-k="TEMPO REAL"><span class="rot">Período</span><span class="val"><span id="t-turno">${mesAnoDoJogo(1).label}</span></span></div>
        <div class="stat destaque"><span class="rot">Tesouro Nacional</span><span class="val" id="t-tesouro">–</span></div>
        <div class="topo-sep"></div>
        <div class="stat" ${tipAttr('Para onde o seu governo está indo, somando tudo o que você fez até aqui. É a sentença que a História vai escrever se você continuar neste caminho.', { t: 'Destino', k: 'TRAJETÓRIA DO REINADO' })}><span class="rot">Destino${q('Para onde o seu governo está indo, somando tudo o que você fez até aqui. É a sentença que a História vai escrever se você continuar neste caminho.', { t: 'Destino', k: 'TRAJETÓRIA DO REINADO' })}</span><span class="val" id="t-destino">–</span></div>
        <button class="stat stat-btn brent-stat" id="t-brent-stat"><span class="rot">${ico('fuel', 11)} Brent</span><span class="val"><span id="t-brent">–</span> <span class="brent-mov" id="t-brent-mov"></span> <span class="stat-seta">${ico('chevron-down', 13)}</span></span></button>
        <button class="stat stat-btn crises-btn" id="t-focos-stat"><span class="rot">${ico('flame', 11)} Crises</span><span class="val"><span id="t-focos">–</span> <span class="stat-seta">${ico('chevron-down', 13)}</span></span></button>
        <span class="espaco"></span>
        <div class="topo-acoes">
          <button class="ta-btn conselho" id="btn-conselho" ${tipAttr('Seu gabinete lê o cenário inteiro — economia, guerra, opinião pública — e diz o que faria no seu lugar, com o motivo de cada sugestão. Conselho de quem só enxerga os números; a decisão continua sendo sua.', { t: 'Conselheiro', k: 'GABINETE', cor: 'roxo' })}>${ico('brain', 15)}<span>CONSELHEIRO</span></button>
          <button class="ta-btn empresas" id="btn-empresas" ${tipAttr('As empresas que operam sob a sua bandeira: quem produz, quanto rende e o que dá pra estatizar, privatizar ou incentivar. É o motor do PIB — mexer aqui muda a economia inteira.', { t: 'Empresas', k: 'COMPLEXO ECONÔMICO', cor: 'verde' })}>${ico('building-2', 15)}<span>EMPRESAS</span></button>
          <button class="ta-btn mercado" id="btn-mercado" ${tipAttr('Onde se compra material de guerra: caça, tanque, navio, satélite. Preço e prazo mudam com o bloco a que você pertence e com o clima do mundo — em tempo de tensão, tudo fica mais caro.', { t: 'Mercado', k: 'COMPRA DE ARMAS', cor: 'ambar' })}>${ico('store', 15)}<span>MERCADO</span></button>
          <button class="ta-btn blocos" id="btn-blocos" ${tipAttr('O tabuleiro das alianças: todos os blocos ativos — militares e econômicos — com membros, poder somado, PIB e intensidade. É onde você funda e acompanha a sua própria aliança.', { t: 'Blocos', k: 'ALIANÇAS GLOBAIS', cor: 'cyan' })}>${ico('handshake', 15)}<span>BLOCOS</span></button>
          <button class="ta-btn indice" id="btn-indice" ${tipAttr('O placar do planeta — o mesmo pra todos os jogadores. Veja quem lidera em PIB, poder militar, petróleo e território, e onde VOCÊ está no ranking.', { t: 'Índice Mundial', k: 'RANKING GLOBAL', cor: 'cyan' })}>${ico('trophy', 15)}<span>ÍNDICE</span></button>
        </div>
        <span class="badge" id="badge-modo">–</span>
        <span class="online-badge" id="online-badge" data-tip="Jogadores online"></span>
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
          <button class="gc-btn" id="btn-textura" data-tip="Alternar satélite / político">${ico('layers', 14)} <span id="tx-rot">SATÉLITE</span></button>
          <button class="gc-btn gc-teatro" id="btn-teatro" ${tipAttr('Arma o mapa para a ofensiva. Com ele ligado, o globo se abre em estados e cada clique em solo alheio vira um alvo: você escolhe por onde a tropa entra. É assim que se invade — no Teatro de Operações, o nome militar da coisa. Clique de novo para desarmar.', { t: 'Modo Ataque', k: 'TEATRO DE OPERAÇÕES', cor: 'perigo' })}>${ico('crosshair', 14)} <span id="tt-rot">ATACAR</span></button>
          <button class="gc-btn" id="btn-girar" data-tip="Girar globo">${ico('rotate-cw', 14)} GIRAR</button>
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
          <button class="x-min" id="x-min" data-tip="Recolher">${ico('chevron-right', 15)}</button>
        </div>
        <div class="lista" id="feed-lista"></div>
      </section>

      <footer class="acoes" id="acoes"></footer>
    </div>
  `;

  // Controle de som no topo, junto das ações — o mesmo widget do menu.
  container.querySelector('.topo-acoes').appendChild(montarControleAudio({ semDica: true }));

  const el = {
    turno: container.querySelector('#t-turno'),
    tesouro: container.querySelector('#t-tesouro'),
    badge: container.querySelector('#badge-modo'),
    hud: container.querySelector('#hud'),
    feed: container.querySelector('#feed-lista'),
    carta: container.querySelector('#carta-wrap'),
    acoes: container.querySelector('#acoes'),
  };

  // PRESENÇA ONLINE: conecta ao lobby e mostra quantos humanos estão jogando agora,
  // e — o gancho do multiplayer — recebe em tempo real quando outro jogador age
  // contra você (guerra, sanção). Silencioso e opcional: sem servidor, some.
  // ONLINE: se a home nos entregou uma sala conectada, ligamos as interações em tempo
  // real (guerra/aliança/comércio de outros humanos → feed, globo, alertas, Modo Defesa).
  // Em modo offline, `net` é null e nada disto roda.
  let onlineCtrl = null;
  // Flag legível por qualquer UI: em sala online algumas telas mudam de comportamento
  // (ex.: o planejador de guerra NÃO mostra prognóstico determinístico — mata a emoção
  // e entrega informação demais contra humanos; ver AUDITORIA-ONLINE).
  jogo.ehOnline = !!(online && net);
  // MUNDO ÚNICO (Etapa 1): o código da sala vira a SEED compartilhada — todo cliente
  // rola os mesmos dados na mesma batida (ver motor.beatMundo + jogo/rng.js).
  jogo._seedSala = (online && opts.sala?.codigo) ? opts.sala.codigo : null;
  let telefonia = null;   // linha direta entre presidentes (chamada de voz + DM)
  if (online && net) {
    onlineCtrl = ligarOnline(jogo, net, {
      container,
      globoCtrl: () => globoCtrl,
      renderFeed: () => renderFeed(),
      atualizar: () => { renderHud(); renderFeed(); renderTopo(); globoCtrl?.atualizar(); },
      sincronizarPeriodo: () => renderTopo(),   // convidado: relógio da sala mudou → repinta o topo
      // A BATIDA DO HOST chegou: o convidado roda o beat local em sincronia (seed da
      // sala = mesmos dados) e aplica o mundo compartilhado por cima. UM calendário.
      aoBeatHost: (dados) => tr?.beatExterno(dados),
    });
    // Canal de saída pra qualquer módulo (naval, nuclear, envio, frota) ecoar a ação
    // na sala sem depender do onlineCtrl no escopo: jogo._relayOnline(tipo, alvo, texto, dados).
    jogo._relayOnline = (tipo, alvo, texto, dados) => onlineCtrl?.notificar(tipo, alvo, texto, dados);
    jogo._relayFrota = (dados) => onlineCtrl?.relayFrota(dados);
    jogo._ehHumanoOnline = (iso) => !!onlineCtrl?.ehHumano(iso);   // a mesa de alianças pergunta isto
    jogo._relayFrotaSaiu = (id) => onlineCtrl?.relayFrotaSaiu(id);
    // TELEFONE VERMELHO: escuta o canal `direto` (que ligarOnline não usa — setHandlers
    // faz merge, então onDireto entra sem atropelar onSala/onEvento).
    telefonia = montarTelefonia(jogo, net, { globoCtrl: () => globoCtrl });
    net.setHandlers({
      onDireto: (m) => telefonia.aoDireto(m),
      onDiretoFalhou: (m) => { /* alvo saiu da sala no meio: a UI da chamada resolve pelo timeout */ },
    });
  }

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
    // O Conselheiro enfileira no TEMPO REAL (`tr`): a ação recomendada entra na fila
    // de comando com tempo normal, como qualquer ordem. Refresh ao aplicar e fechar.
    abrirConselheiro(jogo, { tr, onAplicar: refresh, onFim: refresh });
  });
  // ÍNDICE MUNDIAL: o ranking global — pode abrir a qualquer hora (é só leitura).
  container.querySelector('#btn-indice')?.addEventListener('click', () => abrirIndiceMundial(jogo));
  container.querySelector('#btn-blocos')?.addEventListener('click', () => abrirBlocosVisor(jogo));
  // BRENT: clicar abre o histórico de impactos no barril (alta/baixa + motivo).
  container.querySelector('#t-brent-stat')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    abrirBrentHist(container.querySelector('#t-brent-stat'));
  });
  // PONTOS QUENTES: abre a lista de focos do mundo; clicar num foco voa até ele.
  container.querySelector('#t-focos-stat')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (document.querySelector('.pq-painel')) { fecharPontosQuentes(); return; }
    abrirPontosQuentes(container.querySelector('#t-focos-stat'), jogo, globoCtrl, {
      onIntervir: (dados) => (dados?.tipo === 'pandemia'
        ? abrirPandemia(dados, jogo, { tr, onFim: () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); } })
        : abrirIntervencao(dados, jogo, { globoCtrl, tr, onFim: () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); } })),
    });
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

  // ── MUNDO AO VIVO ───────────────────────────────────────────────────
  // O planeta se mexe SEM você passar o turno. A cada ~24s de planejamento, um PULSO:
  // uma escaramuça no mapa, uma guerra em petro-estado que sacode o SEU barril, um
  // murmúrio de mercado. O evento vira post no X (a timeline anda em tempo real) e,
  // quando é forte (petróleo disparando), estoura um PLANTÃO. É a Máquina viva: você
  // levanta o olho da HUD e o mundo está respirando — e às vezes cutucando você.
  const HANDLES_MUNDO = ['@radar_geo', '@fio_internacional', '@mercado_ao_vivo', '@boletim_mundo', '@olho_no_mapa'];
  let pulsoN = 0;
  function iniciarMundoAoVivo(ctrl) {
    setInterval(() => {
      if (jogo.fase !== 'planejamento') return;
      // MUNDO COMPARTILHADO: numa sala online, SÓ o host gera o mundo ao vivo. O convidado
      // não roda o seu (que divergia) — ele recebe do host via ligarOnline/aplicarMundo.
      if (jogo.ehOnline && onlineCtrl && !onlineCtrl.souHost?.()) return;
      // nunca por cima de outra cena (modal, flash, ofensiva)
      if (document.querySelector('.modal-fundo') || document.querySelector('.lg-barra')) return;
      if (Math.random() < 0.35) return;   // nem todo tick pulsa — previsibilidade mata
      const p = pulsoAoVivo(jogo.estado);
      if (!p) return;
      pulsoN += 1;
      // eu (host, ou offline) gerei este pulso — se sou host, RETRANSMITO pra sala inteira
      const postsRelay = [];

      // 1) ANIMA o mapa quando é escaramuça/petróleo.
      if (p.tipo === 'escaramuca') {
        const de = ctrl.ondeEsta?.(p.de); const para = ctrl.ondeEsta?.(p.para);
        if (de && para) { ctrl.desenharLinha?.(para, 'ataque', 7000, de); ctrl.salvaMisseis?.(para, 2, de, { som: false }); ctrl.balao?.(para, p.texto, 'aviso'); }
      } else if (p.tipo === 'petroleo' && p.iso) {
        const c = ctrl.ondeEsta?.(p.iso); if (c) { ctrl.ondaRadar?.(c, { cor: 0xffb020, max: 55 }); ctrl.balao?.(c, p.texto, 'ruim'); }
      }

      // 2) EMPURRA no X — a timeline anda em tempo real (não só ao passar turno).
      const postMundo = { tipo: 'cidadao', handle: HANDLES_MUNDO[pulsoN % HANDLES_MUNDO.length], nome: 'Boletim Mundo', texto: p.texto };
      jogo._empilharFeed?.([postMundo]); postsRelay.push(postMundo);
      // às vezes, um perfil com viés reage ao que aconteceu no mundo
      if (Math.random() < 0.5) {
        const tema = p.tipo === 'petroleo' ? 'crise' : p.tom === 'aviso' ? 'guerra' : null;
        const posts = tema ? reacoesSociais(jogo.estado.iso || 'USA', tema, jogo.ficha?.pais, pulsoN).slice(0, 1) : [];
        if (posts.length) { jogo._empilharFeed?.(posts); postsRelay.push(...posts); }
      }

      // 3) O barril mexeu? Atualiza o topo (seta ▲ + motivo + histórico) e solta PLANTÃO.
      if (p.tipo === 'petroleo') {
        jogo.estado.brent_delta = p.barril;
        jogo.estado.brent_motivo = p.motivo;
        jogo.estado.brent_hist = jogo.estado.brent_hist || [];
        jogo.estado.brent_hist.unshift({ turno: jogo.turno, preco: Math.round(jogo.estado.preco_petroleo), delta: p.barril, motivo: p.motivo, tom: 'ruim' });
        jogo.estado.brent_hist = jogo.estado.brent_hist.slice(0, 12);
        renderTopo();
        if (p.breaking) dispararBreaking(jogo, { assunto: `Petróleo dispara para US$ ${Math.round(jogo.estado.preco_petroleo)} com guerra no exterior`, contexto: p.motivo, tom: 'quente' });
      }

      // HOST retransmite o pulso (posts + animação + período) pra sala inteira ver o MESMO mundo
      if (jogo.ehOnline && onlineCtrl?.souHost?.()) {
        onlineCtrl.relayMundo({
          posts: postsRelay,
          anim: p.tipo === 'escaramuca' ? { tipo: 'escaramuca', de: p.de, para: p.para } : p.tipo === 'petroleo' ? { tipo: 'petroleo', iso: p.iso } : null,
          turno: jogo.turno,
        });
      }

      renderFeed();
    }, 24000);
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
      // "ATAQUE ARMADO" e não "TEATRO ATIVO": o rótulo tem que dizer o que ACONTECE
      // se você clicar no mapa agora. Jargão militar decora, não avisa.
      rot.textContent = armado ? 'ATAQUE ARMADO' : 'ATACAR';
    } catch (e) {
      rot.textContent = 'FALHOU';
      setTimeout(() => { rot.textContent = 'ATACAR'; }, 2000);
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

  // BOTÃO DIREITO = FECHAR (pedido do dono). Em vez do menu do navegador, o clique-direito
  // fecha a janela/modal aberta mais recente da sessão. Se não há nada aberto, some a
  // seleção. A lista está do mais "por cima" (chat/telefone) pro mais de fundo (modal-fundo);
  // fecha UM por clique — clicar o próprio botão de fechar do modal (que dispara o onFim/
  // limpeza dele) e, sem botão, remove o nó.
  const SELETORES_FECHAVEIS = ['.tel-chat', '.tel-dm-notif', '.tel-over', '.tel-toque', '.nrel-flut', '.nva-flut', '.escn-wrap', '.pen-modal', '.blv-modal', '.alc-modal', '.modal-fundo'];
  window.addEventListener('contextmenu', (ev) => {
    // deixa o menu nativo só em campos de texto (copiar/colar numa DM, por ex.)
    if (ev.target?.closest?.('input, textarea')) return;
    ev.preventDefault();
    for (const sel of SELETORES_FECHAVEIS) {
      const abertos = document.querySelectorAll(sel);
      if (abertos.length) {
        const alvo = abertos[abertos.length - 1];   // o último no DOM = o mais recente
        const x = alvo.querySelector('.pp-fechar, .tel-x, .nva-x, .blv-x, .alc-x, .pen-x, #nv-x, #ref-x');
        if (x) x.click(); else alvo.remove();
        return;
      }
    }
    globoCtrl?.limparSelecao?.();
  });

  // monta o globo 3D
  montarGlobo(container.querySelector('#globo'), jogo, {
    onPaisClick: abrirPainelPais,
    onEstadoClick: (f) => {
      // TERRITÓRIO PERDIDO (era meu, o inimigo tomou): não é beco sem saída — abre o
      // fluxo de RESGATE (enviar tropas pra retomar), com custo de petróleo+dinheiro.
      const id = f.properties?.id;
      const eu = jogo.estado.iso || 'USA';
      const natural = (id || '').split('-')[0];
      const dono = donoDeEstado(jogo.estado, id);
      if (id && natural === eu && dono !== eu) {
        abrirEnvio(f, jogo, { globoCtrl, resgate: true, onFim: () => { renderHud(); renderTopo(); renderFeed(); } });
        return;
      }
      abrirReforco(f, jogo, { globoCtrl, onFim: () => { renderHud(); renderTopo(); } });
    },
    // No Teatro, clicar em solo alheio designa alvo: abre o envio de tropas —
    // que é, na prática, o ato de guerra.
    onAlvoEstado: (f) => abrirEnvio(f, jogo, {
      globoCtrl,
      onFim: () => { renderHud(); renderTopo(); renderFeed(); },
    }),
    // Clique no MAR com o Teatro armado: posiciona a frota. Não é ataque — é
    // presença. Um porta-aviões parado no Golfo não dispara nada e muda tudo.
    onAlvoMar: (c) => abrirPosicaoNaval(c, jogo, {
      globoCtrl,
      onFim: () => { renderHud(); renderTopo(); renderFeed(); },
    }),
    onPaisSelecionado: () => { /* o mapa já se abre sozinho; nada a fazer na HUD */ },
    // Insígnia da SUA nação → distribuição automática de tropas pelos estados.
    onDistribuir: () => abrirDistribuir(jogo, { globoCtrl, onFim: () => { renderHud(); renderTopo(); } }),
    // Clicar num conflito/pandemia do Mundo Vivo → intervir (ajuda, mediação, pesquisa).
    // BUG QUE ISTO CONSERTA: sem o `tr`, a mediação clicada PELO GLOBO nunca entrava
    // na fila — a UI dizia "ORDEM ENFILEIRADA" e nada acontecia (falso positivo).
    onIntervir: (dados) => abrirIntervencao(dados, jogo, { globoCtrl, tr, onFim: () => { renderHud(); renderFeed(); renderTopo(); } }),
    // ONLINE: país jogado por humano ganha ENTRAR EM CONTATO no dock (embaixo de DECIDIR).
    ehHumano: (iso) => !!onlineCtrl?.ehHumano(iso),
    onContato: (iso) => telefonia?.abrirContato(iso),
  })
    .then((ctrl) => {
      globoCtrl = ctrl;
      window.__globo = ctrl; // hook de debug (dev)
      renderMundoVivo();
      iniciarMundoAoVivo(ctrl);
      // atalho de debug/teste: abrir o painel de um país por ISO (ex.: __abrirPais('BRA'))
      window.__abrirPais = (code) => {
        const f = ctrl.features?.find((x) => iso(x) === code);
        if (f) abrirPainelPais(f); else console.warn('país não encontrado', code);
      };
    });

  // ── badge ────────────────────────────────────────────────────────────
  // O badge dizia "● RESERVA" e parava aí. Quem lê isso não tem como saber que está
  // vendo carta local em vez da Máquina — e foi assim que o jogo passou uma sessão
  // inteira fingindo ter IA. Agora cada estado carrega o PORQUÊ e a cura, no cartão.
  function renderBadge(origem) {
    const mapa = {
      maquina:      ['maquina', '● IA ATIVA',  'A Máquina gerou este turno: a crise que você acabou de ler foi escrita agora, para o seu cenário, e não saiu de uma lista pronta.'],
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
    el.badge.setAttribute('data-tip', dica);
    el.badge.setAttribute('data-tip-t', cls === 'maquina' ? 'A Máquina está no ar' : 'A Máquina está fora');
    el.badge.setAttribute('data-tip-k', 'ORIGEM DAS CARTAS');
    el.badge.setAttribute('data-tip-cor', cls === 'maquina' ? 'verde' : 'ambar');
  }

  // ── HUD ──────────────────────────────────────────────────────────────
  function renderTopo() {
    // numa sala online, o RELÓGIO é o do host (jogo._periodoSala) — todos veem o mesmo mês.
    const turnoExibido = (jogo.ehOnline && Number.isFinite(jogo._periodoSala)) ? jogo._periodoSala : jogo.turno;
    el.turno.textContent = mesAnoDoJogo(turnoExibido).label;
    el.tesouro.textContent = dinheiro(jogo.estado.tesouro);
    // O cabeçalho estava com espaço ocioso — agora carrega o pulso do mundo:
    const dst = container.querySelector('#t-destino');
    if (dst) { dst.textContent = `${jogo.destino}`; dst.style.color = jogo.banda?.cor || 'var(--texto)'; }
    const brent = container.querySelector('#t-brent');
    if (brent) {
      const p = jogo.estado.preco_petroleo || 78;
      brent.textContent = `$${p.toFixed(0)}`;
      brent.style.color = p >= 120 ? 'var(--perigo)' : p >= 95 ? 'var(--ambar)' : 'var(--texto)';
    }
    // MOVIMENTO DO BRENT: seta ▲/▼ com a variação do último turno; o MOTIVO vai no hover
    // (o motor grava brent_delta/brent_motivo depois do tickPreco). Atacar um petro-estado
    // já entra aqui via emGuerra → o barril sobe e o topo mostra por quê.
    const mov = container.querySelector('#t-brent-mov');
    const stat = container.querySelector('#t-brent-stat');
    const d = Math.round(jogo.estado.brent_delta || 0);
    if (mov) {
      if (d > 0) { mov.textContent = `▲ ${d}`; mov.className = 'brent-mov sobe'; }
      else if (d < 0) { mov.textContent = `▼ ${Math.abs(d)}`; mov.className = 'brent-mov cai'; }
      else { mov.textContent = ''; mov.className = 'brent-mov'; }
    }
    if (stat) {
      const base = 'Preço do barril (Brent). Mexe no seu caixa todo turno: exporta = receita, importa = despesa.';
      const motivo = jogo.estado.brent_motivo ? ` — ${jogo.estado.brent_motivo}` : '';
      stat.setAttribute('data-tip', base + motivo);
      stat.setAttribute('data-tip-t', 'Brent');
      stat.setAttribute('data-tip-k', d > 0 ? 'BARRIL SUBINDO' : d < 0 ? 'BARRIL CAINDO' : 'PREÇO DO BARRIL');
      stat.setAttribute('data-tip-cor', d > 0 ? 'perigo' : d < 0 ? 'verde' : 'ambar');
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
    // O --f alimenta o glow da barra no CSS. Antes o box-shadow usava currentColor,
    // que herdava a cor do TEXTO — todo brilho saía esbranquiçado, não da cor da métrica.
    return `<div class="barra"><div class="preench" style="width:${Math.max(0, Math.min(100, p))}%;background:${cor};--f:${cor}"></div></div>`;
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
    // FLASH DE IMPACTO: quando a ação mexeu neste indicador, a linha inteira pulsa —
    // verde se a mudança foi BOA, vermelho se foi RUIM (polaridade de INVERTIDAS:
    // dívida/clima de guerra subindo é ruim). O renderHud recria os nós, então a
    // animação CSS dispara sozinha a cada render que carrega a mudança.
    const fl = (chave) => {
      const m = mudancas.find((x) => x.chave === chave);
      if (!m || !m.delta) return '';
      const bom = INVERTIDAS.has(chave) ? m.delta < 0 : m.delta > 0;
      return bom ? ' flash-bom' : ' flash-ruim';
    };

    const b = jogo.banda;
    // O herói da HUD: número gigante, banda à direita, régua com os degraus das
    // 7 bandas — o jogador VÊ quanto falta pro próximo título sem ler nada.
    const destino = `
      <div class="bloco destino" style="--c:${b.cor}">
        <h3><i class="hx">01</i> Destino <i class="fio"></i><span class="tri">${mesAnoDoJogo(jogo.turno).label}</span></h3>
        <span class="dst-marca">${b.icone}</span>
        <div class="dst-topo">
          <div class="dst-num">${jogo.destino}<i>/100</i></div>
          <div class="dst-banda"><b>${b.icone} ${esc(b.nome)}</b><span>trajetória do reinado</span></div>
        </div>
        <div class="barra dst-barra"><div class="preench" style="width:${jogo.destino}%;background:linear-gradient(90deg, color-mix(in srgb, ${b.cor} 55%, #06101f), ${b.cor});--f:${b.cor}"></div></div>
        <div class="escala"><span>☠ COLAPSO</span><span>IMPERADOR 👑</span></div>
      </div>`;

    const r = jogo.rotulo;
    // Eixo político é -100..+100 — a barra preenche A PARTIR DO CENTRO, pro lado
    // em que o regime pende. Barra cheia-da-esquerda mentia sobre o dado.
    const comp = (v) => {
      const pct = Math.max(-100, Math.min(100, Number(v) || 0));
      const w = Math.abs(pct) / 2;
      const left = pct >= 0 ? 50 : 50 - w;
      return `<div class="eixo"><i class="eixo-fill" style="left:${left}%;width:${w}%"></i></div>`;
    };
    const politico = `
      <div class="bloco regime">
        <h3><i class="hx">02</i> Perfil do Regime <i class="fio"></i></h3>
        <div class="rotulo-pol">${r.icone} <b>${esc(r.label)}</b></div>
        <div class="pol-desc">${esc(r.descricao)}</div>
        <div class="linha mini" data-tip="De um lado, o Estado controla a economia; do outro, o mercado é livre."><span>◄ Estado controla</span><span>Livre mercado ►</span></div>${comp(jogo.estado.eixo_economico)}
        <div class="linha mini" data-tip="De um lado, mais liberdade ao povo; do outro, mais controle e mão firme."><span>◄ Mais liberdade</span><span>Mais controle ►</span></div>${comp(jogo.estado.eixo_autoridade)}
      </div>`;

    const fx = jogo.fluxoPreview();
    const eco = `
      <div class="bloco eco">
        <h3><i class="hx">03</i> Economia <i class="fio"></i><span class="tri">US$ trilhões</span></h3>
        <div class="grade eco-grade">
          ${ECONOMIA.map((k) => `<div class="cel${fl(k)}" ${tipAttr(VARS[k].dica || '', { t: VARS[k].rotulo, k: 'ECONOMIA', cor: 'ambar' })}><span class="rot">${VARS[k].rotulo}${q(VARS[k].dica || '', { t: VARS[k].rotulo, k: 'ECONOMIA', cor: 'ambar' })}</span><span class="v">${valorFmt(k)}${dl(k)}</span></div>`).join('')}
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
        <h3><i class="hx">04</i> Petróleo <i class="fio"></i><span class="tri" ${tipAttr('Brent é o barril de referência que o mundo inteiro usa pra precificar petróleo. Quando o noticiário diz "o petróleo subiu", é deste preço que está falando.', { t: 'Brent', k: 'PREÇO DE REFERÊNCIA', cor: 'ambar' })}>barril (US$)${q('Brent é o barril de referência que o mundo inteiro usa pra precificar petróleo. Quando o noticiário diz "o petróleo subiu", é deste preço que está falando.', { t: 'Brent', k: 'PREÇO DE REFERÊNCIA', cor: 'ambar' })}</span></h3>
        <div class="pt-preco">
          <span class="ptp-num ${banda.cls}">US$ ${oleo.preco.toFixed(2)}</span>
          <span class="ptp-banda ${banda.cls}">${banda.rot}</span>
        </div>
        <div class="pt-nota">${esc(banda.txt)}</div>
        <div class="pt-grade">
          <div class="ptc" ${tipAttr('Quantos milhões de barris o país tira do chão por dia. É o que você tem pra vender — ou pra queimar em casa.', { t: 'Produção', k: 'MILHÕES DE BARRIS/DIA', cor: 'verde' })}><span>Produção${q('Quantos milhões de barris o país tira do chão por dia. É o que você tem pra vender — ou pra queimar em casa.', { t: 'Produção', k: 'MILHÕES DE BARRIS/DIA', cor: 'verde' })}</span><b class="bom">${oleo.producao}<small>mi barris/dia</small></b></div>
          <div class="ptc" ${tipAttr('Quantos milhões de barris o país queima por dia — carro, avião, fábrica, usina. Consumir mais do que produz significa comprar a diferença lá fora.', { t: 'Consumo', k: 'MILHÕES DE BARRIS/DIA', cor: 'ambar' })}><span>Consumo${q('Quantos milhões de barris o país queima por dia — carro, avião, fábrica, usina. Consumir mais do que produz significa comprar a diferença lá fora.', { t: 'Consumo', k: 'MILHÕES DE BARRIS/DIA', cor: 'ambar' })}</span><b class="amb">${oleo.consumo}<small>mi barris/dia</small></b></div>
          <div class="ptc" ${tipAttr('Todo o petróleo que ainda está no subsolo sob a sua bandeira, incluindo o de territórios conquistados. É o seu estoque estratégico — e um motivo para invadirem você.', { t: 'Reservas', k: 'BILHÕES DE BARRIS' })}><span>Reservas${q('Todo o petróleo que ainda está no subsolo sob a sua bandeira, incluindo o de territórios conquistados. É o seu estoque estratégico — e um motivo para invadirem você.', { t: 'Reservas', k: 'BILHÕES DE BARRIS' })}</span><b>${res.total}<small>bi de barris</small></b></div>
        </div>
        ${oleo.autossuficiente
          ? `<div class="pt-saldo bom">${ico('trending-up', 13)} Vendemos mais do que gastamos: sobram <b>+${oleo.excedente} mi barris/dia</b> pro mercado. O preço alto é a nossa receita.</div>`
          : `<div class="pt-saldo ruim">${ico('trending-down', 13)} <b>${oleo.dependencia}% do que queimamos vem de fora.</b> Cada dólar no barril sai do nosso caixa.</div>`}
        <div class="pt-linha ${fx.petroleo >= 0 ? 'pos' : 'neg'}" ${tipAttr(fx.petroleo >= 0
          ? 'Você produz mais do que consome, então o excedente vira dinheiro vivo no seu caixa a cada turno. Petróleo caro é bom para você.'
          : 'Você queima mais do que produz e paga a diferença ao mercado, todo turno. Petróleo caro sangra o seu caixa — e você não controla o preço.',
          { t: 'Impacto no caixa', k: 'POR TURNO', cor: fx.petroleo >= 0 ? 'verde' : 'perigo' })}>
          <span>Impacto no caixa${q(fx.petroleo >= 0
            ? 'Você produz mais do que consome, então o excedente vira dinheiro vivo no seu caixa a cada turno. Petróleo caro é bom para você.'
            : 'Você queima mais do que produz e paga a diferença ao mercado, todo turno. Petróleo caro sangra o seu caixa — e você não controla o preço.',
            { t: 'Impacto no caixa', k: 'POR TURNO', cor: fx.petroleo >= 0 ? 'verde' : 'perigo' })}</span>
          <b>${fx.petroleo >= 0 ? '+' : ''}${dinheiro(fx.petroleo)}<small>/turno</small></b>
        </div>
        ${res.conquistadas.length
          ? `<div class="pt-espolio">${ico('flag', 12)} Espólio: ${res.conquistadas.map((c) => `${esc(c.nome)} <b>${c.reservas} bi</b>`).join(' · ')}</div>` : ''}
      </div>`;

    const medidores = `
      <div class="bloco medd">
        <h3><i class="hx">05</i> Indicadores <i class="fio"></i></h3>
        ${MEDIDORES.map((k) => {
          const risco = riscoDe(k, jogo.estado[k]);
          return `<div class="medidor ${risco ? 'perigo' : ''}${fl(k)}">
            <div class="linha"><span ${tipAttr(VARS[k].dica || '', { t: VARS[k].rotulo, k: 'INDICADOR', cor: risco ? 'perigo' : '' })}><i class="med-chip" style="background:${VARS[k].cor};color:${VARS[k].cor}"></i>${VARS[k].rotulo}${VARS[k].dica ? q(VARS[k].dica, { t: VARS[k].rotulo, k: 'INDICADOR', cor: risco ? 'perigo' : '' }) : ''}${risco ? `<span class="med-alerta" data-risco="${k}" ${tipAttr(`${VARS[k].rotulo} está em zona de risco. Clique para ver o que isso ameaça — e o que ainda dá pra fazer.`, { t: 'Zona de risco', k: 'ALERTA', cor: 'perigo' })}>⚠️</span>` : ''} ${dl(k)}</span><span class="mono">${Math.round(jogo.estado[k])}</span></div>
            ${barra(jogo.estado[k], 0, 100, VARS[k].cor)}
          </div>`;
        }).join('')}
      </div>`;

    const caps = `
      <div class="bloco caps">
        <h3><i class="hx">07</i> Capacidades <i class="fio"></i></h3>
        <div class="grade">
          ${CAPACIDADES.map((k) => {
            // capacidade 0–100 agora é INDICADOR VISÍVEL: chip colorido + valor na cor +
            // mini-barra do progresso. É o que faz Indústria/Inteligência/Urânio "aparecerem"
            // como algo que se acompanha, e não texto perdido na grade.
            const cor = VARS[k].cor || '#8fb4ff';
            return `<div class="cel cap-med${fl(k)}" ${tipAttr(VARS[k].dica || '', { t: VARS[k].rotulo, k: 'CAPACIDADE' })}>
              <span class="rot"><i class="med-chip" style="background:${cor};color:${cor}"></i>${VARS[k].rotulo}${q(VARS[k].dica || '', { t: VARS[k].rotulo, k: 'CAPACIDADE' })}</span>
              <span class="v" style="color:${cor}">${valorFmt(k)}${dl(k)}</span>
              ${barra(jogo.estado[k], 0, 100, cor)}
            </div>`;
          }).join('')}
          <div class="cel" ${tipAttr(VARS.territorio.dica, { t: 'Territórios', k: 'CAPACIDADE' })}><span class="rot">Territórios${q(VARS.territorio.dica, { t: 'Territórios', k: 'CAPACIDADE' })}</span><span class="v">${jogo.estado.territorio}${dl('territorio')}</span></div>
          <div class="cel arsenal" ${tipAttr(VARS.ogivas.dica, { t: 'Ogivas Nucleares', k: 'ARSENAL ESTRATÉGICO', cor: 'perigo' })}><span class="rot">☢ Ogivas${q(VARS.ogivas.dica, { t: 'Ogivas Nucleares', k: 'ARSENAL ESTRATÉGICO', cor: 'perigo' })}</span><span class="v">${jogo.estado.ogivas}${dl('ogivas')}</span></div>
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
            // usa a fonte com precedência do país (registro.js) — é ela que traz a foto
            // do SOLDADO por país; cai no catálogo antigo (equipamentoDe) como reforço.
            const eq = equipamentosDoPais(jogo.ficha.iso || 'USA')?.[u.id] || equipamentoDe(jogo.ficha.iso || 'USA', u.id);
            return `<button class="fa-un" data-equip="${u.id}">
              <img class="fa-img" src="${eq.foto}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('${u.icone}'))">
              <span class="fa-n">${(jogo.estado.forcas?.[u.id] || 0).toLocaleString('pt-BR')}</span>
              <span class="fa-nome">${esc(eq.nome || u.nome)}</span>
            </button>`;
          }).join('')}
        </div></div>`;
    }).join('');
    const forcas = `
      <div class="bloco forcas">
        <h3><i class="hx">06</i> Forças Armadas <i class="fio"></i><span class="tri">força ${forcaCombate(jogo.estado.forcas)}</span></h3>
        ${forcasHtml}
        ${(() => {
          const sold = jogo.estado.forcas?.infantaria || 0;
          const teto = tetoSoldados(jogo.ficha.iso || 'USA');
          const res = jogo.estado.reservaMilitar || 0;
          const pctT = Math.min(100, Math.round((sold / teto) * 100));
          return `<div class="fa-soldados" data-tip="Soldados em pé: ${sold.toLocaleString('pt-BR')} de um teto de ${teto.toLocaleString('pt-BR')} (o limite humano do país). A RESERVA (${res.toLocaleString('pt-BR')}) pode ser convocada às armas em Política ▸ Convocar a Reserva." data-tip-t="Efetivo militar" data-tip-k="SOLDADOS">
            <div class="fa-sold-top">🪖 <b>Soldados</b> ${sold.toLocaleString('pt-BR')} <span class="fa-sold-teto">/ ${teto.toLocaleString('pt-BR')}</span> <span class="fa-sold-res">reserva ${res.toLocaleString('pt-BR')}</span></div>
            <div class="fa-sold-barra"><i style="width:${pctT}%"></i></div>
          </div>`;
        })()}
        <div class="fa-nuke">${ico('radiation', 14)} Ogivas nucleares <b>${jogo.estado.ogivas}</b></div>
        ${dm.fracao > 0 ? `<div class="fa-desc">🤝 Desconto de ${Math.round(dm.fracao * 100)}% em compras militares — aliança com ${esc(dm.aliados.join(', '))}</div>` : ''}
      </div>`;

    el.hud.innerHTML = destino + politico + eco + petroleo + medidores + forcas + caps;
    // inventário: clicar numa unidade abre a ficha do equipamento — MAS soldado não é
    // equipamento: infantaria abre o dossiê de RECRUTAMENTO (gente, não fabricante).
    const aoAbrirUnidade = (equip) => {
      const onFim = () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); };
      if (equip === 'infantaria') abrirSoldados(jogo, { tr, onFim });
      else abrirEquipamento(equip, jogo, { onFim });
    };
    el.hud.querySelectorAll('.fa-un[data-equip]').forEach((b) => b.addEventListener('click', () => aoAbrirUnidade(b.dataset.equip)));
    // o medidor de Soldados também abre o dossiê de recrutamento
    el.hud.querySelector('.fa-soldados')?.addEventListener('click', () => aoAbrirUnidade('infantaria'));
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

  // Rótulo do viés do perfil (a bolinha colorida no post de opinião pública).
  const VIES_ROT = { esquerda: 'Perfil de esquerda', direita: 'Perfil de direita', populista: 'Perfil populista', centrista: 'Perfil de centro' };

  // O feed virou X: duas abas. "Para você" = a timeline (povo + jornais). "Alertas" =
  // os avisos de sistema (Comando, Mercado, Estreitos) que ANTES poluíam a timeline —
  // o usuário pediu explicitamente pra separar. Alerta não é tuíte.
  let feedAba = 'timeline';
  let feedFiltro = 'mundo';   // online: 'mundo' (World Trends) | 'nacao' (Minha Nação)
  function renderFeed() {
    const meuIso = jogo.estado.iso || 'USA';
    let posts = jogo.feed.filter((p) => feedAba === 'sistema' ? p.tipo === 'sistema' : p.tipo !== 'sistema');
    // ONLINE — filtro do X: "Minha Nação" (o que fala de/afeta você) × "World Trends"
    // (a sala inteira, todos os jogadores). Sugestão do dono, adotada.
    if (online && feedAba !== 'sistema' && feedFiltro === 'nacao') {
      posts = posts.filter((p) => p.paisAlvo === meuIso || p.paisOrigem === meuIso || (!p.paisOrigem && !p.paisAlvo));
    }
    const nAlertas = jogo.feed.filter((p) => p.tipo === 'sistema').length;
    const badge = container.querySelector('#x-alertas-n');
    if (badge) badge.textContent = nAlertas ? String(nAlertas) : '';

    const filtroUI = (online && feedAba !== 'sistema')
      ? `<div class="x-filtro">
          <button class="xf ${feedFiltro === 'mundo' ? 'on' : ''}" data-ff="mundo">${ico('globe', 11)} World Trends</button>
          <button class="xf ${feedFiltro === 'nacao' ? 'on' : ''}" data-ff="nacao">${ico('flag', 11)} Minha Nação</button>
        </div>` : '';

    const postsHTML = posts.map((p, idx) => {
      // ONLINE: ação de outro jogador humano — card distinto, com trilho na cor do ato.
      if (p.tipo === 'jogador') {
        return `<article class="x-jogador" style="--jc:${p.cor || 'var(--cyan)'}">
          ${p.paisOrigem && ISO2_DE[p.paisOrigem] ? `<img class="xj-flag" src="${bandeira(ISO2_DE[p.paisOrigem], 40)}" alt="">` : `<span class="xj-ic">${ico('user', 13)}</span>`}
          <div class="xj-corpo"><div class="xj-cab"><b>${esc(p.handle || 'Jogador')}</b>${p.paisAlvo && ISO2_DE[p.paisAlvo] ? `<span class="xj-alvo">→ <img src="${bandeira(ISO2_DE[p.paisAlvo], 40)}" alt=""></span>` : ''}</div>
          <div class="xj-txt">${esc(p.texto)}</div></div>
        </article>`;
      }
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
            ${p.vies ? `<span class="x-vies ${esc(p.vies)}" data-tip="${VIES_ROT[p.vies] || ''}"></span>` : ''}
            <span class="x-nome">${esc(nome)}</span>
            ${v ? `<span class="x-verif" data-tip="Conta verificada">${ico('badge-check', 13)}</span>` : ''}
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
    }).join('') || `<div class="x-vazio">${ico(feedAba === 'sistema' ? 'bell-off' : 'ghost', 22)}<span>${feedAba === 'sistema' ? 'Nenhum alerta de sistema.' : feedFiltro === 'nacao' ? 'Nada sobre a sua nação por enquanto.' : 'Silêncio no éter…'}</span></div>`;
    el.feed.innerHTML = filtroUI + postsHTML;

    container.querySelectorAll('.x-aba').forEach((b) => {
      b.onclick = () => { feedAba = b.dataset.fx; container.querySelectorAll('.x-aba').forEach((x) => x.classList.toggle('on', x === b)); renderFeed(); };
    });
    container.querySelectorAll('.xf').forEach((b) => {
      b.onclick = () => { feedFiltro = b.dataset.ff; renderFeed(); };
    });
  }

  // ── Tags de IMPACTO do card de ação ──────────────────────────────────
  // Antes o card mostrava só "E+5" (críptico). Agora mostra rótulos legíveis do que a
  // ação mexe (Aprovação, Segurança, Indústria…), COLORIDOS com a identidade do próprio
  // indicador (VARS.cor) — as mesmas cores da coluna de indicadores. Influência=roxo,
  // Estabilidade=verde, Aprovação=azul, Clima de Guerra=vermelho, Confiança=teal.
  const COR_IMP = {
    inteligencia: '#35e0ff', capacidade_ind: '#ffa94f', uranio: '#9be15d',
    pib: '#8fe388', tesouro: '#22e0a0', divida: '#ff8c66', aliquota: '#ffcc4f',
    territorio: '#4fd1ff', ogivas: '#ff5a6e',
    // eixos políticos (a.politico usa chaves curtas 'autoridade'/'economico')
    autoridade: '#d0a6ff', economico: '#a6d0b0', eixo_economico: '#a6d0b0', eixo_autoridade: '#d0a6ff',
  };
  // a.politico traz chaves curtas; damos rótulos legíveis
  const ROT_IMP = { autoridade: 'Autoridade', economico: 'Rumo Econômico' };
  const corImp = (k) => VARS[k]?.cor || COR_IMP[k] || (k.startsWith('rel_') ? '#7fd0ff' : '#9fb0d0');
  const rotuloImp = (k) => VARS[k]?.rotulo || ROT_IMP[k] || (k.startsWith('rel_') ? `Relação ${nomePais(k.slice(4)) || k.slice(4).toUpperCase()}` : k);
  function tagsImpacto(a) {
    const itens = [];
    for (const [k, v] of Object.entries(a.efeitos || {})) if (typeof v === 'number' && v !== 0) itens.push({ k, v });
    for (const [k, v] of Object.entries(a.politico || {})) if (typeof v === 'number' && v !== 0) itens.push({ k, v });
    if (!itens.length) return '';
    itens.sort((x, y) => Math.abs(y.v) - Math.abs(x.v));
    const mostra = itens.slice(0, 4);
    const resto = itens.length - mostra.length;
    const chips = mostra.map(({ k, v }) => {
      const rot = rotuloImp(k); const sobe = v > 0;
      return `<span class="ac-imp" style="--ic:${corImp(k)}" data-tip="${esc(rot)} ${sobe ? 'sobe' : 'cai'} com esta ação" data-tip-k="IMPACTO">${sobe ? '▲' : '▼'} ${esc(rot)}</span>`;
    }).join('');
    return `<div class="ac-imps">${chips}${resto > 0 ? `<span class="ac-imp mais" data-tip="e mais ${resto} efeito(s)">+${resto}</span>` : ''}</div>`;
  }

  // ── Catálogo de ações + fila ─────────────────────────────────────────
  function chipAcao(a) {
    const desbloq = estaDesbloqueada(a, jogo.estado);
    if (!desbloq) {
      return `<div class="acao-chip travada" data-tip="${esc(a.dica || '')}">
        <div class="ac-top">${a.icone} <span class="ac-nome">${esc(a.nome)}</span> <span class="cadeado">🔒</span></div>
        <div class="ac-dica">🔓 ${esc(a.dica || 'Requisitos a cumprir')}</div>
      </div>`;
    }
    if (a.escalavel) {
      const ok = jogo.estado.pontos_acao >= (a.custoPA || 1) && jogo.estado.tesouro >= 0.1;
      return `<button class="acao-chip investir" data-inv="${a.id}" ${ok ? '' : 'disabled'} data-tip="${esc(a.descricao)}">
        <div class="ac-top">${a.icone} <span class="ac-nome">${esc(a.nome)}</span></div>
        <div class="ac-desc">${esc(a.descricao)}</div>
        <div class="ac-info"><span class="custo">você define o valor 💵</span></div>
      </button>`;
    }
    const pode = jogo.podeEnfileirar(a.id);
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
      return `<button class="acao-chip equip" data-equip="${unidadeId}" data-tip="Ver ficha de ${esc(eq.nome || a.nome)}">
        <div class="ac-foto"><img src="${eq.foto}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${a.icone}'">
          <span class="ac-selo-eq">FICHA ▸</span></div>
        <div class="ac-corpo">
          <div class="ac-top"><span class="ac-nome">${esc(eq.nome || a.nome)}</span></div>
          <div class="ac-info"><span class="custo">${dinheiro(PRECO[unidadeId] || 0)}<span class="un">/un</span></span><span class="ac-est">arsenal ${estoque.toLocaleString('pt-BR')}</span></div>
        </div>
      </button>`;
    }
    const foto = FOTO_ACAO[a.id];
    return `<button class="acao-chip ${foto ? 'com-foto' : ''}" data-acao="${a.id}" ${pode.ok ? '' : 'disabled'} data-tip="${esc(a.descricao)}">
      ${foto ? `<div class="ac-foto"><img src="${foto}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>` : ''}
      <div class="ac-corpo">
        <div class="ac-top">${a.icone} <span class="ac-nome">${esc(a.nome)}</span></div>
        <div class="ac-desc">${esc(a.descricao)}</div>
        <div class="ac-info">${custoHtml}<span data-tip="Esta ordem leva um tempo pra concluir (roda na fila do relógio). Ações de maior impacto demoram mais." data-tip-t="Tempo de execução" data-tip-k="TEMPO REAL">${ico('clock', 11)} ${tempoDe(a)}s</span><span class="prob ${a.prob < 0.7 ? 'risco' : ''}">${prob(a.prob)}</span></div>
        ${tagsImpacto(a)}
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

    // MODO TEMPO REAL: sem "passar turno". Um RELÓGIO corre; cada ordem leva SEGUNDOS
    // pra concluir (barra rodando na fila), até a capacidade de comando. A cada batida
    // (~30s) o mundo avança sozinho — economia, guerras, invasões.
    el.acoes.className = `acoes ${consoleAberto ? 'aberto' : 'minimizado'}`;
    el.acoes.innerHTML = `
      <div class="acoes-cab">
        <div class="tabs">${tabs}</div>
        <div class="acoes-status">
          <span class="tr-relogio" data-tip="Tempo de jogo. O mundo corre sozinho — a cada mês a economia, as guerras e as invasões avançam. Não há mais 'passar turno': aja e o relógio segue." data-tip-t="Tempo real" data-tip-k="O MUNDO NÃO ESPERA" data-tip-cor="ambar">${ico('clock', 12)} <b id="tr-relogio">00:00</b><i class="tr-beat-trilho" data-tip="Contagem para a virada do mês."><i id="tr-beat"></i></i></span>
          <span>${dinheiro(jogo.estado.tesouro)}</span>
          <button class="ac-toggle" id="ac-toggle" data-tip="${consoleAberto ? 'Minimizar' : 'Expandir'}">${ico(consoleAberto ? 'chevron-down' : 'chevron-up', 14)}</button>
        </div>
      </div>
      <div class="acoes-painel">
        <div class="acao-grade">${lista}</div>
      </div>
      <div class="fila-barra tempo">
        <div class="fila-rot">${ico('list-ordered', 12)} <span>Fila de comando</span> <small class="fila-cap">até ${tr?.CAP || 2} em execução</small></div>
        <div class="fila" id="fila-tempo"></div>
      </div>`;

    el.acoes.querySelector('#ac-toggle').addEventListener('click', () => { consoleAberto = !consoleAberto; renderAcoes(); });
    el.acoes.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
      if (catAtual === b.dataset.cat && consoleAberto) consoleAberto = false;
      else { catAtual = b.dataset.cat; consoleAberto = true; }
      renderAcoes();
    }));
    el.acoes.querySelectorAll('.acao-chip[data-acao]').forEach((b) => b.addEventListener('click', () => {
      // AÇÕES QUE ABREM TELA (não vão pra fila): o jogador decide o conteúdo primeiro.
      const especial = ACAO_POR_ID[b.dataset.acao]?._modal;
      if (especial === 'fakenews') { abrirFakeNews(jogo, { onFim: () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); } }); return; }
      const r = tr?.enfileirar(ACAO_POR_ID[b.dataset.acao]);
      if (r && !r.ok && r.motivo) toastFila(r.motivo);
      renderAcoes(); renderTopo();
    }));
    el.acoes.querySelectorAll('.acao-chip[data-inv]').forEach((b) => b.addEventListener('click', () => abrirInvestimento(ACAO_POR_ID[b.dataset.inv])));
    el.acoes.querySelectorAll('.acao-chip[data-equip]').forEach((b) => b.addEventListener('click', () => {
      const onFim = () => { renderHud(); renderFeed(); renderTopo(); renderAcoes(); };
      if (b.dataset.equip === 'infantaria') abrirSoldados(jogo, { tr, onFim });
      else abrirEquipamento(b.dataset.equip, jogo, { onFim });
    }));
    tr?.renderFila();
  }

  // Avisinho efêmero (fila cheia / sem caixa) sobre o console de ações.
  function toastFila(msg) {
    let t = el.acoes.querySelector('.tr-toast');
    if (!t) { t = document.createElement('div'); t.className = 'tr-toast'; el.acoes.appendChild(t); }
    t.textContent = msg;
    t.classList.remove('mostra'); void t.offsetWidth; t.classList.add('mostra');
    clearTimeout(t._tmr); t._tmr = setTimeout(() => t.classList.remove('mostra'), 2200);
  }

  // ── HOOKS DO TEMPO REAL ────────────────────────────────────────────────
  // A UI reage às duas coisas que o relógio dispara: uma AÇÃO concluída e a BATIDA do mundo.
  function refreshTempo(mudancas) { renderHud(mudancas || []); renderFeed(); renderTopo(); globoCtrl?.atualizar?.(); }

  // RESULTADO VIVO: quando o relógio conclui uma ação, o card de veredito sobe no
  // canto inferior esquerdo do globo. `res` é o objeto de resolverFila; ações
  // sintéticas (paz/espionagem/mediação) voltam sem id/nome — completamos com a
  // própria `acao` pra o card ter ícone e nome. Mesmo objeto que o online empurrará.
  function aposAcaoTempo(res, acao) {
    refreshTempo(res?.mudancas);
    if (res) anunciarResultado({ id: acao?.id, nome: acao?.nome, icone: acao?.icone, categoria: acao?.categoria, ...res });
  }

  function aposBeatTempo(res) {
    // MUNDO ÚNICO: o HOST transmite a batida à sala — o servidor cacheia o retrato
    // pro próximo que entrar, e cada convidado avança o mês em sincronia.
    if (jogo.ehOnline && onlineCtrl?.souHost()) onlineCtrl.relayBeat(jogo.snapshotMundo());
    // TODO jogador (host e convidado) publica os PRÓPRIOS números a cada batida: é o
    // que faz o Índice Mundial e as forças serem reais e iguais pra sala inteira.
    if (jogo.ehOnline) onlineCtrl?.relayStats(statsVivos(jogo.estado));
    refreshTempo(res?.economia?.mudancas);
    consumirBreakingDoTurno(res);           // plantão (petróleo/mídia) no máximo 1 por batida
    animarEventosVivos(res.eventosVivos);   // arcos/conflitos no globo
    avisarMobilizacoes();                   // a inteligência detectou um ataque se montando?
    avisarOperacoesDetectadas();            // o ALVO detectou a MINHA ofensiva se montando?
    if (res.desbloqueios?.length) popupDesbloqueio(res.desbloqueios, () => {});
    if (res.invasao) cenaInvasaoTempo(res.invasao); // a batida pausa enquanto a cena está aberta
    else if (res.ofensivas?.length) cenaOfensivasResolvidas(res.ofensivas.slice()); // minhas ofensivas amadureceram
    if (res.fim) { tr?.parar(); mostrarFim(res.fim); }
  }

  // O ALVO flagrou minha ofensiva em preparo → aviso (ele vai reforçar a defesa).
  function avisarOperacoesDetectadas() {
    const novos = (jogo.estado.operacoes || []).filter((o) => o.novoAviso);
    if (!novos.length) return;
    novos.forEach((o) => { o.novoAviso = false; });
    if (document.querySelector('.carta-wrap .cena') || document.querySelector('.lg-barra')) return;
    const o = novos[0];
    alertaUrgente({ titulo: 'OPERAÇÃO COMPROMETIDA', texto: `${o.alvoNome} detectou nossa mobilização — espere resistência reforçada quando o ataque chegar.`, tom: 'alerta', comSom: false });
  }

  // Minhas ofensivas que amadureceram resolvem AGORA (com a feature real do globo), tocam
  // os visuais no planeta e o desfecho — uma de cada vez, em fila.
  function cenaOfensivasResolvidas(fila) {
    const proxima = () => {
      const o = fila.shift();
      if (!o || o.tipo !== 'guerra') { if (o) proxima(); return; }
      const feature = (globoCtrl?.features || []).find((f) => iso(f) === o.alvoIso);
      if (!feature) { renderHud(); renderFeed(); renderTopo(); proxima(); return; }
      const m = multiplicadoresOfensiva(o);
      const res = resolverGuerra(jogo.estado, feature, o.deploy, {
        multPoder: o.multPoder, custo: o.custo, origem: o.origem, prioridade: o.prioridade,
        custoJaPago: true, forcaEmTransito: true, multDefesaAlvo: m.multDefesaAlvo, multSurpresa: m.multSurpresa,
      });
      if (res.falha) { proxima(); return; }
      jogo.aplicarGuerra(feature, res);
      // MUNDO ÚNICO: o desfecho da ofensiva viaja pra sala — os territórios tomados
      // mudam de dono no mapa de TODOS, e o atacado vê o próprio país marcado.
      if (jogo.ehOnline) {
        const caem = (res.campanha?.caem || []).map((x) => x.id).filter(Boolean);
        jogo._relayOnline?.('guerra_resultado', o.alvoIso,
          `Ofensiva de ${jogo.ficha.presidente || jogo.ficha.pais} contra ${o.alvoNome}: ${caem.length} território(s) tomado(s)${res.campanha?.tomouCapital ? ' — a CAPITAL caiu' : ''}.`,
          { caem, tomouCapital: !!res.campanha?.tomouCapital });
      }
      // visuais no globo: o eixo de ataque + a esquadrilha voando até o alvo
      const alvoC = globoCtrl?.ondeEsta?.(o.alvoIso);
      if (alvoC) { globoCtrl?.desenharLinha?.(alvoC, 'ataque', 6000, globoCtrl?.ondeEsta?.(jogo.estado.iso)); globoCtrl?.lancarEsquadrilha?.(alvoC, 'ataque'); }
      sirene({ ruim: !res.venceu }); flashTela(!res.venceu);
      consumirBreakingDoTurno({ resultados: [] });
      desfechoCarrossel(el.carta, res, jogo, feature, () => { el.carta.innerHTML = ''; renderHud(); renderFeed(); renderTopo(); globoCtrl?.atualizar?.(); proxima(); });
    };
    proxima();
  }

  // INTELIGÊNCIA detectou uma mobilização inimiga: alerta urgente na tela com a janela de
  // reação. Só dispara UMA vez por mobilização (flag novoAviso), e não por cima de uma cena.
  function avisarMobilizacoes() {
    const novos = (jogo.estado.mobilizacoes || []).filter((m) => m.novoAviso);
    if (!novos.length) return;
    const m = novos[0];
    novos.forEach((x) => { x.novoAviso = false; });
    if (document.querySelector('.carta-wrap .cena') || document.querySelector('.lg-barra')) return;
    alertaUrgente({ titulo: 'AMEAÇA DETECTADA', texto: `${m.nome} mobiliza forças contra você — ataque em ~${Math.max(1, m.restante)} ${Math.max(1, m.restante) > 1 ? 'meses' : 'mês'}. Reforce a defesa enquanto há tempo.`, tom: 'alerta', comSom: false });
  }

  // VOCÊ FOI INVADIDO, no tempo real: alerta urgente + a mesma página de invasão do turno,
  // como uma jornada de 1 página. O relógio pausa sozinho enquanto a cena está aberta.
  function cenaInvasaoTempo(iv) {
    jornada([{ ...paginaInvasao(iv), btnFim: 'ASSUMIR O COMANDO' }], () => { el.carta.innerHTML = ''; renderAcoes(); renderTopo(); });
  }

  // ANEXAÇÃO CONCLUÍDA — o país deixou de ser ocupação e virou território nacional.
  function cenaAnexacao(res, oc, feature, aoFim) {
    const bd = bandeiraDeFeature(feature, 80);
    jornada([{
      classe: 'gdw-vrd gdw-ok gdw-anex',
      cab: `${ico('crown', 13)} ANEXAÇÃO CONCLUÍDA · VITÓRIA DEFINITIVA · ${esc((res.nome || oc?.nome || '').toUpperCase())}`,
      btnFim: 'ASSUMIR O COMANDO',
      aoMostrar: () => { sirene({ ruim: false }); flashTela(false); },
      corpo: `<div class="gdw-selo">${ico('crown', 44)}</div>
        <div class="gdw-super ok">${esc((res.nome || '').toUpperCase())} É TERRITÓRIO NACIONAL — DE VEZ</div>
        <h1 class="gdw-tit">A bandeira não desce mais.</h1>
        ${bd ? `<div class="gdw-flagcai"><img src="${bd}" alt=""></div>` : ''}
        <div class="gdw-linha">${esc(res.nome || 'O país')} deixou de ser ocupação — sem mais insurgência, sem mais upkeep. É seu de vez: <b>+${res.pibGanho} tri de PIB</b> incorporado. O mundo condena; sua base comemora.</div>`,
    }], () => { el.carta.innerHTML = ''; aoFim?.(); renderAcoes(); renderTopo(); });
  }

  // ── Painel de país (globo) ───────────────────────────────────────────
  function cardAcaoPais(a) {
    const bloqueado = jogo.estado.tesouro < a.custo || !cumpre(a.requer);
    return `<button class="pais-acao ${a.recomendada ? 'rec' : ''}" data-id="${a.id}" ${bloqueado ? 'disabled' : ''}>
      <div class="pa-top">${a.icone} <b>${esc(a.nome)}</b> ${a.recomendada ? '<span class="rec-selo">RECOMENDADO</span>' : ''}</div>
      <div class="pa-desc">${esc(a.descricao)}</div>
      <div class="pa-info"><span>${a.custo > 0 ? dinheiro(a.custo) : 'grátis'}</span><span class="prob ${a.prob < 0.7 ? 'risco' : ''}">${prob(a.prob)}</span></div>
    </button>`;
  }

  function abrirPainelPais(feature) {
    if (jogo.fase !== 'planejamento') return;
    const code = iso(feature);
    // ANEXADO É MEU: o país incorporado entra no ramo "SUA NAÇÃO" — sem planejar
    // ofensiva contra si mesmo, sem espionar a própria província, sem nuke em casa.
    const meuAnexado = !!jogo.estado.ocupacoes?.[code]?.anexado;
    const ehJogador = souEu(code) || meuAnexado;
    const oc = ocupacaoDe(jogo.estado, code);

    // BASES: parceiro (rel ≥ 40) aceita negociar; território ocupado não é consultado.
    // O botão só existe onde a jogada é real — nada de oferecer o que não dá pra fazer.
    const relAqui = ehJogador ? 0 : relacaoAtual(jogo.estado, feature);
    const elegBase = ehJogador ? { pode: false } : podeInstalarBase(jogo.estado, code, relAqui);
    const basesAqui = basesEm(jogo.estado, code);
    const botaoBase = (elegBase.pode || basesAqui.length)
      ? `<button class="pp-base ${basesAqui.length ? 'tem' : ''}" id="pp-base">
          ${ico('radio-tower', 15)}
          <span>${basesAqui.length
            ? `${basesAqui.length} INSTALAÇÃO(ÕES) ATIVA(S) — GERENCIAR`
            : 'INSTALAR BASE MILITAR'}</span>
        </button>`
      : '';

    let cabecalho; let corpo; let acoes; let geral = false;
    if (oc) {
      // ── TERRITÓRIO OCUPADO: administração ──
      acoes = acoesOcupacao(jogo.estado, oc);
      const nivel = oc.insurgencia >= 70 ? 'critica' : oc.insurgencia >= 40 ? 'alta' : 'baixa';
      const bd = bandeiraDeFeature(feature);
      cabecalho = `<div class="pp-cab">${bd ? `<img class="pp-flag ocupada" src="${bd}" alt="">` : ''}<h2>${esc(oc.nome)}</h2><span class="pp-rel rel-ocupado">SOB OCUPAÇÃO</span><button class="pp-fechar">${ico('x', 15)}</button></div>`;
      const petro = petroleoDe(code);
      const uk = upkeepDe(jogo.estado, oc);
      const ocMeta = jogo.estado.ocupacoes?.[code] || {};
      const anexa = podeAnexar(jogo.estado, code);
      const custoManter = Math.round(uk.total * 1.8 * 100) / 100;
      const insDepois = Math.max(0, oc.insurgencia - 22);
      const insIgnora = Math.min(100, oc.insurgencia + (ocMeta.turnosSemPagar > 0 ? 16 : 11));
      const barU = (rot, val, cor) => `<div class="ppu-linha"><span>${rot}</span><b>${dinheiro(val)}</b></div>
        <div class="ppu-barra"><div style="width:${uk.total ? Math.min(100, (val / uk.total) * 100) : 0}%;background:${cor}"></div></div>`;
      corpo = `<div class="pp-ocup">
          <div class="ppo-linha"><span>Insurgência</span><b class="ins-${nivel}">${oc.insurgencia}%</b></div>
          <div class="barra"><div class="preench" style="width:${oc.insurgencia}%;background:${oc.insurgencia >= 70 ? '#ff3b5c' : oc.insurgencia >= 40 ? '#ffb020' : '#22e0a0'}"></div></div>
          <div class="ppo-nota">${oc.insurgencia >= 70 ? 'A qualquer momento perdemos o território. Aja AGORA.' : 'A insurgência sobe todo turno sem manutenção.'}</div>
          <div class="ppo-desde">Ocupado há ${oc.desde || 0} turno(s)</div>

          <div class="ppu-bloco">
            <div class="ppu-tit">${ico('receipt', 13)} CUSTO DE MANUTENÇÃO · ${dinheiro(uk.total)}/turno</div>
            ${barU('Guarnição', uk.guarnicao, 'var(--cyan)')}
            ${barU('Supressão de insurgência', uk.supressao, 'var(--perigo)')}
            ${barU('Descontentamento', uk.descontent, 'var(--ambar)')}
            ${barU('Logística/distância', uk.logistica, 'var(--fraco)')}
            ${ocMeta.turnosSemPagar > 0 ? `<div class="ppu-alerta">${ico('triangle-alert', 12)} ${ocMeta.turnosSemPagar} turno(s) sem pagar — a insurgência está acelerando.</div>` : ''}
          </div>

          <button class="ppu-manter" id="ppu-manter" ${jogo.estado.tesouro >= custoManter ? '' : 'disabled'}>
            ${ico('shield-check', 15)} <span>MANTER A ORDEM — ${dinheiro(custoManter)}</span>
            <i>insurgência ${oc.insurgencia}% → ${insDepois}%</i>
          </button>
          <div class="ppu-projecao">
            <div class="ppu-proj ok">${ico('check', 11)} se manter: ${insDepois}%</div>
            <div class="ppu-proj ruim">${ico('x', 11)} se ignorar: ${insIgnora}%${insIgnora >= 100 ? ' · PERDA' : ''}</div>
          </div>

          <div class="ppu-anexo ${anexa.pode ? 'pronto' : ''}">
            <div class="ppu-anexo-tit">${ico('landmark', 13)} ANEXAÇÃO ${anexa.pode ? '· PRONTA' : `· ${ocMeta.turnosEstavel || 0}/${ANEXACAO_TURNOS_ESTAVEL}`}</div>
            <div class="ppu-anexo-barra"><div style="width:${Math.min(100, ((ocMeta.turnosEstavel || 0) / ANEXACAO_TURNOS_ESTAVEL) * 100)}%"></div></div>
            <div class="ppu-anexo-nota">${anexa.pode ? 'Controle consolidado. Torne este país seu de vez — PIB e território incorporados.' : anexa.motivo}</div>
            <button class="ppu-anexar" id="ppu-anexar" ${anexa.pode ? '' : 'disabled'}>${ico('flag', 15)} <span>ANEXAR ${esc(oc.nome).toUpperCase()}</span></button>
          </div>
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
      // PROVÍNCIA ANEXADA: mesmo painel de "casa", com a memória de quem ela foi —
      // e a única decisão que ainda cabe aqui: devolver a soberania.
      const nomeAntigo = PAISES[code]?.nome || nomePais(feature) || code;
      cabecalho = meuAnexado
        ? `<div class="pp-cab">${bd ? `<img class="pp-flag" src="${bd}" alt="">` : ''}<h2>${esc(nomeAntigo)}</h2><span class="pp-rel rel-voce">PROVÍNCIA · ${esc((jogo.ficha.pais || '').toUpperCase())}</span><button class="pp-fechar">✕</button></div>`
        : `<div class="pp-cab">${bd ? `<img class="pp-flag" src="${bd}" alt="">` : ''}<h2>${esc(jogo.ficha.pais)}</h2><span class="pp-rel rel-voce">SUA NAÇÃO</span><button class="pp-fechar">✕</button></div>`;
      corpo = `<div class="pp-eu">
          ${meuAnexado ? `<div class="ppe-anexado">${ico('landmark', 14)}
            <span><b>Território anexado.</b> ${esc(nomeAntigo)} deixou de ser um país — é província de ${esc(jogo.ficha.pais)}.
            Sem insurgência, sem upkeep: distribua tropa daqui como em qualquer estado seu.</span></div>` : ''}
          <div class="ppe-grid">
            <div class="ppe-cel"><span>Força de combate</span><b>${fc}</b></div>
            <div class="ppe-cel"><span>Territórios</span><b>${jogo.estado.territorio}</b></div>
            <div class="ppe-cel"><span>Ogivas</span><b>${jogo.estado.ogivas}</b></div>
            <div class="ppe-cel"><span>Tesouro</span><b>${dinheiro(jogo.estado.tesouro)}</b></div>
          </div>
          ${meuAnexado
            ? `<button class="ppe-devolver" id="ppe-devolver">${ico('flag-off', 15)} <span>DEVOLVER A SOBERANIA DE ${esc(nomeAntigo.toUpperCase())}</span>
                 <i>o mundo aplaude · sua base não</i></button>`
            : `<div class="ppe-nota">Aqui é casa. Use o console embaixo para agir — e o globo para agir sobre os outros.</div>`}
        </div>`;
    } else {
      // ── O PAINEL DO GENERAL ──────────────────────────────────────────
      // Antes era um modal estreito (560px) com a mesma cara de card. Agora é a mesa
      // de guerra: largo, em duas colunas. À esquerda o DOSSIÊ do país (presidente
      // fictício + o que ele é, relação, PIB, petróleo, arsenal, blocos); à direita as
      // JOGADAS — a ofensiva em destaque, e a diplomacia em grade.
      geral = true;
      const dados = acoesPais(feature, jogo.estado);
      acoes = dados.acoes;
      const rel = dados.rel;
      const relTxt = rel >= 30 ? 'Aliado' : rel <= -30 ? 'Hostil' : rel < 0 ? 'Tenso' : 'Neutro';
      const bd = bandeiraDeFeature(feature);
      const lider = liderDe(code, dados.nome);
      const cartao = cartaoDe(code);
      const petro = petroleoDe(code);
      const blocos = blocosDoIso(code).map((b) => b.nome);
      const emGuerra = (jogo.estado.emGuerra || []).includes(code);
      const pib = cartao?.pib || (Number(feature.properties?.GDP_MD || 0) / 1e6).toFixed(1);
      const tomStatus = emGuerra ? 'guerra' : relTxt.toLowerCase();

      cabecalho = `<div class="gp2-cab tom-${tomStatus}">
        ${bd ? `<img class="gp2-flag" src="${bd}" alt="">` : ''}
        <div class="gp2-tit"><h2>${esc(dados.nome)}</h2>
          <span class="gp2-sub">MESA DE DECISÃO · ${emGuerra ? 'EM GUERRA COM VOCÊ' : `${relTxt.toUpperCase()} · RELAÇÃO ${rel}`}</span></div>
        <button class="pp-fechar">${ico('x', 16)}</button></div>`;

      const dossie = `<div class="gp2-dossie">
        <div class="gp2-lider">
          <div class="gpl-cab">${ico('crown', 13)}<div class="gpl-id"><b>${esc(lider.nome)}</b><span>${esc(lider.arquetipo?.nome || 'Chefe de Estado')}${cartao?.capital ? ` · ${esc(cartao.capital)}` : ''}</span></div></div>
          ${lider.arquetipo?.desc ? `<p class="gpl-desc">"${esc(lider.arquetipo.desc)}"</p>` : ''}
        </div>
        <div class="gp2-stats">
          <div class="gp2-cel"><span>Relação</span><b class="rel-${relTxt.toLowerCase()}">${rel}</b></div>
          <div class="gp2-cel"><span>PIB</span><b>${pib} tri</b></div>
          <div class="gp2-cel"><span>Poder militar</span><b>${cartao?.militar ?? '—'}</b></div>
          <div class="gp2-cel"><span>Ogivas</span><b class="${cartao?.ogivas ? 'perigo' : ''}">${cartao?.ogivas || '—'}</b></div>
        </div>
        ${petro ? `<div class="gp2-oleo">${ico('fuel', 14)}<div><b>${petro.reservas} bi de barris</b> · ${petro.producao} Mb/d · ${esc(petro.tipo)}<small>${esc(petro.nota)}</small></div></div>` : ''}
        ${blocos.length ? `<div class="gp2-blocos">${ico('shield', 11)} ${blocos.map((b) => `<span>${esc(b)}</span>`).join('')}</div>` : ''}
      </div>`;

      const jogadas = `<div class="gp2-jogadas">
        ${onlineCtrl?.ehHumano(code) ? `<button class="pp-contato" id="pp-contato">${ico('phone', 15)} <span>ENTRAR EM CONTATO</span><i>msg ou ligação</i></button>` : ''}
        <button class="pp-guerra" id="pp-guerra">${ico('swords', 15)} <span>PLANEJAR OFENSIVA MILITAR</span></button>
        ${emGuerra ? `<button class="pp-paz" id="pp-paz">${ico('handshake', 16)} <span>NEGOCIAR SAÍDA DA GUERRA</span><i>em guerra</i></button>` : ''}
        ${!souEu(code) ? `<button class="pp-espiao" id="pp-espiao">${ico('eye', 15)} <span>ESPIONAR ESTE PAÍS</span><i>US$ 40 bi · rede: ${nivelEsp(jogo.estado, code)}/100</i></button>` : ''}
        ${botaoBase}
        ${alvosDeAjuda(jogo.estado).some((a) => a.iso === code) ? `<button class="pp-ajuda" id="pp-ajuda">${ico('heart-handshake', 16)} <span>APOIAR NESTA GUERRA</span><i>em conflito</i></button>` : ''}
        ${(jogo.estado.ogivas > 0 && !souEu(code)) ? `<button class="pp-nuke" id="pp-nuke">${ico('radiation', 16)} <span>LANÇAMENTO NUCLEAR</span><i>${jogo.estado.ogivas} ogiva(s)</i></button>` : ''}
        <div class="gp2-dip-rot">${ico('handshake', 12)} DIPLOMACIA</div>
        <div class="gp2-dip">${acoes.map(cardAcaoPais).join('')}</div>
      </div>`;

      corpo = `<div class="gp2-corpo">${dossie}${jogadas}</div>`;
      // acoes permanece populado — os cards já foram renderizados dentro de .gp2-dip,
      // mas o handler de clique (mais abaixo) ainda precisa do array pra achar a ação.
    }

    const modal = document.createElement('div');
    modal.className = 'modal-fundo';
    modal.innerHTML = geral
      ? `<div class="pais-painel geral">${cabecalho}${corpo}</div>`
      : `<div class="pais-painel">${cabecalho}${corpo}
          <div class="pais-acoes">${acoes.map(cardAcaoPais).join('')}</div>
        </div>`;
    document.body.appendChild(modal);
    const fechar = () => modal.remove();
    modal.querySelector('.pp-fechar').addEventListener('click', fechar);
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
    const atualizarTudo = () => { renderHud(); renderFeed(); renderAcoes(); renderTopo(); globoCtrl?.atualizar(); };
    // TELEFONE VERMELHO: contato direto com o humano que joga este país (mensagem/ligação)
    modal.querySelector('#pp-contato')?.addEventListener('click', () => { fechar(); telefonia?.abrirContato(code); });
    modal.querySelector('#pp-guerra')?.addEventListener('click', () => {
      fechar();
      globoCtrl?.focar?.(feature);
      abrirGuerra(feature, jogo, {
        origemCasa: globoCtrl?.ondeEsta?.(jogo.estado.iso || 'USA'),
        onFim: atualizarTudo,
        onLancar: (info) => {
          // MUNDO ÚNICO: TODA ofensiva ecoa na sala — todos veem a linha e os mísseis
          // no globo. Se o alvo for humano, ele ainda entra em MODO DEFESA na hora.
          if (jogo.ehOnline) {
            const de = globoCtrl?.ondeEsta?.(jogo.estado.iso || 'USA');
            const para = globoCtrl?.ondeEsta?.(code);
            onlineCtrl?.notificar('guerra', code,
              `${jogo.ficha.presidente || jogo.ficha.pais} lançou uma ofensiva militar contra ${PAISES[code]?.nome || code}!`,
              { alvoEstado: info?.alvoEstado || null, de, para });
          }
        },
      });
    });
    modal.querySelector('#pp-paz')?.addEventListener('click', () => {
      fechar();
      globoCtrl?.focar?.(feature);
      abrirPaz(feature, jogo, { tr, onFim: atualizarTudo });
    });
    // ESPIONAR: injeta agentes contra o país (sobe a rede). Cada leva de espionagem custa
    // tempo e dinheiro e VAI raising o nível — quanto maior, maior a chance de vazamentos.
    modal.querySelector('#pp-espiao')?.addEventListener('click', () => {
      const acao = {
        id: `espiao_${code}_${Date.now()}`, nome: `Operação de espionagem — ${code}`,
        icone: '🕵️', categoria: 'Inteligência', custo: 0.04, custoPA: 1, tempo: 20, prob: 1,
        _espiaoIso: code, _espiaoGanho: 28,
      };
      const r = tr?.enfileirar(acao);
      if (r && !r.ok) return;
      // ONLINE (#4): espionar um HUMANO agora ecoa pra ele — a contra-inteligência detecta a
      // operação. Antes o botão principal de espionagem era mudo no online (só os cards de
      // diplomacia avisavam), então espionar um jogador era invisível pra ele.
      if (onlineCtrl?.ehHumano(code)) {
        onlineCtrl.notificar('espionagem', code, `A contra-inteligência de ${jogo.ficha.pais || 'uma potência'} detectou uma operação de espionagem contra você.`);
      }
      fechar(); renderAcoes(); renderTopo();
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
    // OCUPAÇÃO: manter a ordem (paga upkeep, reprime) e anexar (país vira seu de vez).
    modal.querySelector('#ppu-manter')?.addEventListener('click', () => {
      const r = acaoManterOrdem(jogo.estado, code);
      if (r.falha) { toastFila(r.falha); return; }
      fechar(); atualizarTudo(); abrirPainelPais(feature);
    });
    // DEVOLVER A SOBERANIA: desfaz a anexação — no meu estado e no mapa de todos.
    modal.querySelector('#ppe-devolver')?.addEventListener('click', () => {
      const r = devolverSoberania(jogo.estado, code);
      if (r.falha) { toastFila(r.falha); return; }
      if (jogo.ehOnline) {
        onlineCtrl?.notificar('devolucao', code,
          `${jogo.ficha.presidente || jogo.ficha.pais} DEVOLVEU a soberania de ${r.nome}. O país volta ao mapa.`,
          { iso: code, nome: r.nome });
      }
      dispararBreaking(jogo, {
        assunto: `${jogo.ficha.pais} devolve a soberania de ${r.nome}`,
        contexto: `Depois da ocupação, a retirada: ${r.nome} volta a existir como país independente. Gesto raro — e caro em política interna.`,
        tom: 'frio', iso: code,
      });
      fechar(); atualizarTudo();
    });
    modal.querySelector('#ppu-anexar')?.addEventListener('click', () => {
      const r = acaoAnexar(jogo.estado, code, feature);
      if (r.falha) { toastFila(r.falha); return; }
      // ANEXAÇÃO É PÚBLICA: o mundo inteiro atualiza o mapa (o país vira meu em todos
      // os clientes) e a notícia sai no X e nos jornais de todos — nunca privada.
      if (jogo.ehOnline) {
        onlineCtrl?.notificar('anexacao', code,
          `${jogo.ficha.presidente || jogo.ficha.pais} ANEXOU ${r.nome} — o país deixou de existir como nação soberana.`,
          { iso: code, nome: r.nome });
      }
      dispararBreaking(jogo, {
        assunto: `${jogo.ficha.pais} anexa ${r.nome}`,
        contexto: `A ocupação virou incorporação: ${r.nome} deixa de ser um país e passa a ser território de ${jogo.ficha.pais}. PIB incorporado: ${r.pibGanho} tri.`,
        tom: 'quente', iso: code,
      });
      fechar(); cenaAnexacao(r, oc, feature, atualizarTudo);
    });
    modal.querySelectorAll('.pais-acao[data-id]').forEach((b) => b.addEventListener('click', () => {
      const a = acoes.find((x) => x.id === b.dataset.id);
      if (tr?.enfileirar(a).ok) {
        // ONLINE: se o alvo é humano, ele sente a jogada em tempo real (proposta de
        // aliança/comércio → aceita/recusa; sanção/espionagem → alerta).
        if (onlineCtrl?.ehHumano(code)) {
          const tp = /alianca/.test(a.id) ? 'alianca' : /comercio/.test(a.id) ? 'comercio'
            : /ajuda/.test(a.id) ? 'ajuda' : /sancao|embargo/.test(a.id) ? 'sancao'
              : /espiar|golpe|intel/.test(a.id) ? 'espionagem' : 'sancao';
          onlineCtrl.notificar(tp, code, `${jogo.ficha.presidente || 'Um chefe de Estado'}: ${a.nome}.`);
        }
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
      if (tr?.enfileirar(acao).ok) { fechar(); renderAcoes(); renderTopo(); }
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

  // ── Sequência cinematográfica do turno ───────────────────────────────
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
        <button class="avancar" id="jrn-go">${ultima ? (p.btnFim || 'ASSUMIR O PRÓXIMO TURNO') : (p.btn || 'PRÓXIMO')} ${ico('chevron-right', 15)}</button>
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

  // A ESPERA É PARTE DO JOGO. Antes era um spinner e a frase "Executando ordens" —
  // tempo morto. Mas este é o único momento em que o jogador não pode fazer nada e já
  // não pode voltar atrás: é exatamente onde a ansiedade mora. Então a espera passou a
  // ser encenada — as etapas caem uma a uma, com as SUAS ordens nominalmente citadas,
  // e a última linha é sempre o mundo se preparando para responder.
  function encenarEspera() {
    const nomes = jogo.fila.map((it) => it.acao.nome);
    const etapas = [
      { t: 'Ordens transmitidas ao gabinete', d: 0 },
      ...nomes.slice(0, 3).map((n, i) => ({ t: `Executando: ${n}`, d: 420 + i * 380 })),
      { t: 'O mundo toma conhecimento', d: 420 + Math.min(3, nomes.length) * 380 + 200 },
      { t: 'Aguardando a reação…', d: 420 + Math.min(3, nomes.length) * 380 + 750, tenso: true },
    ];
    el.carta.innerHTML = `<div class="cena esperando">
      <div class="esp-selo">${ico('radio', 13)} TRANSMISSÃO EM CURSO</div>
      <div class="esp-lista">${etapas.map((e, i) => `<div class="esp-linha ${e.tenso ? 'tenso' : ''}" style="animation-delay:${e.d}ms" data-i="${i}"><i class="esp-dot"></i><span>${esc(e.t)}</span></div>`).join('')}</div>
      <div class="esp-barra"><i></i></div>
    </div>`;
  }

  // O CLIFFHANGER, em uma variável: o turno TERMINA na carta do gabinete. O que o
  // mundo fez em cima da sua resposta — invasão, imprensa, balanço — fica guardado
  // aqui e ABRE o próximo turno. Você fecha a noite sem saber no que deu.
  let desfechoPendente = null;

  async function passarTurno() {
    cancelarFlash();
    // Antes de executar as novas ordens, pague o suspense do turno anterior: o
    // jogador vê agora a consequência da decisão com que fechou a sessão.
    if (desfechoPendente) return reproduzirDesfecho(executarOrdens);
    return executarOrdens();
  }

  // HISTÓRICO DO BARRIL — a listinha de impactos (alta/baixa + motivo) que abre no clique.
  function abrirBrentHist(ancora) {
    document.querySelector('.brent-hist-pop')?.remove();
    const jaAberto = ancora.dataset.histOn === '1';
    if (jaAberto) { ancora.dataset.histOn = '0'; ancora.classList.remove('aberto'); return; }
    ancora.dataset.histOn = '1';
    ancora.classList.add('aberto');
    const hist = jogo.estado.brent_hist || [];
    const pop = document.createElement('div');
    pop.className = 'brent-hist-pop';
    pop.innerHTML = `
      <div class="bh-cab">${ico('fuel', 12)} PETRÓLEO · US$ ${Math.round(jogo.estado.preco_petroleo || 78)} <small>por que mexeu</small></div>
      <div class="bh-lista">
        ${hist.length ? hist.map((h) => `
          <div class="bh-item ${h.delta > 0 ? 'sobe' : h.delta < 0 ? 'cai' : ''}">
            <span class="bh-d">${h.delta > 0 ? '▲' : h.delta < 0 ? '▼' : '•'} ${h.delta > 0 ? '+' : ''}${h.delta}</span>
            <span class="bh-txt"><b>Turno ${h.turno} · US$ ${h.preco}</b><span>${esc(h.motivo || 'oscilação de mercado')}</span></span>
          </div>`).join('')
        : `<div class="bh-vazio">Sem movimentos registrados ainda. Aja no mundo e o barril reage.</div>`}
      </div>`;
    const r = ancora.getBoundingClientRect();
    pop.style.top = `${r.bottom + 8}px`;
    pop.style.left = `${Math.max(12, r.left - 60)}px`;
    document.body.appendChild(pop);
    const fora = (e) => { if (!pop.contains(e.target) && !ancora.contains(e.target)) { pop.remove(); ancora.dataset.histOn = '0'; ancora.classList.remove('aberto'); document.removeEventListener('click', fora, true); } };
    setTimeout(() => document.addEventListener('click', fora, true), 0);
  }

  // PLANTÃO no fechamento do turno: no máximo UM por turno, priorizando o mais quente
  // (petróleo disparando > mídia). A guerra e a reconquista já disparam o próprio
  // plantão no momento em que acontecem.
  function consumirBreakingDoTurno(res) {
    const e = jogo.estado;
    const d = Math.round(e.brent_delta || 0);
    if (Math.abs(d) >= 12) {
      dispararBreaking(jogo, {
        assunto: `Petróleo ${d > 0 ? 'dispara' : 'despenca'} para US$ ${Math.round(e.preco_petroleo)} o barril`,
        contexto: e.brent_motivo || (d > 0 ? 'choque de oferta no mercado global' : 'alívio na oferta global'),
        tom: d > 0 ? 'quente' : 'frio',
      });
      return;
    }
    // Investiu pesado em mídia? O jornal reage — o dono pediu isso explicitamente.
    const midia = (res?.resultados || []).find((r) => r?.acao?.categoria === 'Mídia' && r?.sucesso !== false);
    if (midia) {
      dispararBreaking(jogo, {
        assunto: `${jogo.ficha?.pais || 'O governo'} amplia sua ofensiva de comunicação`,
        contexto: `campanha de mídia e narrativa (${midia.acao?.nome || 'ação de mídia'}) mira a opinião pública`,
        tom: 'frio',
      });
    }
  }

  async function executarOrdens() {
    bandaAntes = jogo.banda;
    encenarEspera();
    el.acoes.innerHTML = `<div class="acoes-bloqueado">◐ Turno em execução…</div>`;
    try {
      const res = await jogo.passarTurno();
      ultimaRes = res;
      renderHud(res.mudancas || []); renderFeed(); renderBadge(res.origem);
      consumirBreakingDoTurno(res);
      cenaResultados(res);
    } catch (err) {
      el.carta.innerHTML = `<div class="cena"><div class="narr" style="color:var(--perigo)">A Máquina travou: ${esc(err.message)}</div><button class="avancar" id="tentar">Tentar de novo</button></div>`;
      el.carta.querySelector('#tentar').addEventListener('click', executarOrdens);
    }
  }

  // Reproduz o desfecho guardado (épico → desbloqueios → consequências → crise fiscal)
  // e só então segue para `aoFim` (a execução do novo turno).
  function reproduzirDesfecho(aoFim) {
    const { r, soma, epico } = desfechoPendente;
    desfechoPendente = null;
    const seguir = () => {
      if (r.criseFiscal) {
        abrirCriseFiscal(jogo, { onFim: () => { renderHud(); renderFeed(); renderTopo(); aoFim(); } });
      } else aoFim();
    };
    const consequencias = () => cenaConsequencias(r, soma, seguir);
    const comDesbloq = () => (r.desbloqueios?.length ? popupDesbloqueio(r.desbloqueios, consequencias) : consequencias());
    if (epico) { sirene({ ruim: epico.tipo === 'ruim' }); flashTela(epico.tipo === 'ruim'); popupEpico(epico, comDesbloq); }
    else comDesbloq();
  }

  // Cena 1 — JORNADA: uma página por ação executada
  function cenaResultados(res) {
    if (!res.resultados.length) return cenaCrise(res);
    const P = jogo.presidente?.nome;

    // SLIDE 1 — o veredito. Antes o turno abria em "AÇÃO 1 DE 3", que é um índice, não
    // uma emoção: o jogador lia três telas antes de saber se tinha se dado bem. Agora a
    // sentença vem primeiro e o resto vira a prestação de contas dela.
    const v = veredito({ resultados: res.resultados });
    const paginas = [{
      classe: `vrd vrd-${v.tom}`,
      // jogo.turno, sem -1: quem avança o contador é responder a carta, e o veredito
      // acontece antes disso. (cenaConsequencias roda DEPOIS e por isso subtrai.)
      cab: `${ico('gavel', 13)} TURNO ${jogo.turno} · VEREDITO`,
      btn: 'VER O QUE ACONTECEU',
      corpo: `
        <div class="vrd-placar">${v.ok}<i>/${v.total}</i><small>ordens cumpridas</small></div>
        <h1 class="vrd-tit">${esc(v.titulo)}</h1>
        <div class="vrd-linha">${esc(v.linha)}</div>`,
      aoMostrar: () => { if (v.tom === 'desastre' || v.tom === 'ruim') flashTela(true); },
    }];

    paginas.push(...res.resultados.map((r, i) => ({
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
    })));
    jornada(paginas, () => {
      if (res.desbloqueios?.length) popupDesbloqueio(res.desbloqueios, () => cenaCrise(res));
      else cenaCrise(res);
    });
  }

  // Cena 2 — a crise da Máquina
  function cenaCrise(res) {
    renderCarta(res.carta, res.opcoesDisponiveis, res.origem, null);
  }

  // ── EVENTOS DO MUNDO VIVO, animados no globo ao fechar o turno ────────
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
            if (v.novo) g.salvaMisseis?.(para, 3, de, { som: false });   // conflito NPC×NPC: mudo
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
    const epico = epicoDoTurno({ soma, resultados: ultimaRes?.resultados, bandaAntes, bandaDepois: jogo.banda, estado: jogo.estado, economia: r.economia });

    globoCtrl?.atualizar();
    animarEventosVivos(r.eventosVivos);

    // Fim de jogo não espera: se a decisão encerra o reinado, mostra agora.
    if (r.fim) return mostrarFim(r.fim);

    // CLIFFHANGER — o turno acaba aqui. As consequências (invasão, imprensa, balanço)
    // já estão aplicadas no estado, mas o jogador só as VÊ na abertura do próximo
    // turno. Guardamos o desfecho inteiro para reproduzir lá, com os números
    // congelados agora (antes de qualquer ordem nova mexer no caixa).
    desfechoPendente = { r, soma, epico };
    selarTurno(r);
  }

  // A tela de "decisão selada": o turno fechou, o mundo vai responder, e a resposta
  // só vem quando você EXECUTAR o próximo. É o que transforma o fim do turno em
  // suspense em vez de anticlímax — sem revelar nada.
  function selarTurno(r) {
    const temTrovao = r.invasao || r.eventosMundo?.some((e) => e.tom === 'ruim') || (r.economia?.saldo || 0) < 0;
    el.carta.innerHTML = `<div class="cena selado">
      <div class="sel-selo">${ico('lock', 22)}</div>
      <div class="sel-cab">DECISÃO SELADA · TURNO ${jogo.turno - 1}</div>
      <div class="sel-txt">${temTrovao
        ? 'O gabinete cumpriu suas ordens. Agora o mundo prepara a resposta — e ela não parece amistosa.'
        : 'Suas ordens estão dadas. O mundo já se move nos bastidores para responder.'}</div>
      <div class="sel-rev">A consequência abre o próximo turno.</div>
      <button class="avancar sel-go" id="sel-fechar">FECHAR O TURNO ${ico('chevron-right', 15)}</button>
    </div>`;
    el.carta.querySelector('#sel-fechar').addEventListener('click', () => {
      el.carta.innerHTML = ''; renderAcoes(); renderTopo();
    });
  }

  // Cena 3 — JORNADA do desfecho: impacto → mundo → imprensa → balanço
  // `aoTerminar` é opcional e hoje serve à crise fiscal: ela só aparece depois
  // que o jogador VIU o balanço, nunca antes.
  // A página "VOCÊ FOI INVADIDO" — a que rouba a cena. Usada no fechamento do turno
  // (cenaConsequencias) e ao vivo no tempo real (cenaInvasaoTempo).
  function paginaInvasao(iv) {
    return {
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
      aoMostrar: () => alertaUrgente({ titulo: 'VOCÊ ESTÁ SOB ATAQUE', texto: `${iv.agressor.nome} cruzou a sua fronteira.`, tom: 'ataque' }),
    };
  }

  function cenaConsequencias(r, soma, aoTerminar) {
    const nTurno = jogo.turno - 1;
    const manchete = mancheteDoTurno({ soma, resultados: ultimaRes?.resultados, economia: r.economia });
    const despachos = despachosDoTurno({ soma, resultados: ultimaRes?.resultados });
    const posts = jogo.feed.filter((p) => p.tipo !== 'sistema').slice(0, 3);
    const paginas = [];

    // 1) A decisão da crise e o que ela custou
    paginas.push({
      cab: `${ico('gavel', 13)} TURNO ${nTurno} · A DECISÃO`,
      corpo: `
        <div class="manchete">"${esc(manchete)}"</div>
        <div class="ja-sub">${ico('activity', 12)} O QUE MUDOU</div>
        <div class="ja-pills">${descreverMudancas(r.mudancas).map((m) => `<span class="ja-pill ${m.bom ? 'bom' : 'ruim'}"><b>${esc(m.texto)}</b> ${esc(m.rotulo)}</span>`).join('') || '<span class="sem-mud">sem impacto direto</span>'}</div>
        <div class="jd-despachos">${despachos.map((d) => `<div class="despacho ${d.tom}"><div class="d-autor">${ico('quote', 11)} ${esc(d.autor)}</div><div class="d-txt">${esc(d.texto)}</div></div>`).join('')}</div>`,
    });

    // 1.5) VOCÊ FOI INVADIDO — a página que rouba a cena, e deve mesmo.
    // Vem logo depois da decisão e antes do resto porque é a maior coisa que pode
    // acontecer num turno: alguém cruzou sua fronteira. Se isto aparecesse como uma
    // linha no painel do mundo, o jogador leria "fui invadido" no mesmo peso visual de
    // "a Turquia assinou um acordo de gás".
    if (r.invasao) paginas.push(paginaInvasao(r.invasao));

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

    // 4) Balanço final do turno
    paginas.push({
      cab: `${ico('chart-line', 13)} BALANÇO DO TURNO ${nTurno}`,
      btnFim: 'EXECUTAR AS MINHAS ORDENS',
      corpo: `
        <div class="jd-balanco">
          <div class="jb-item"><span>Caixa do turno</span><b class="${r.economia.saldo >= 0 ? 'bom' : 'ruim'}">${r.economia.saldo >= 0 ? '+' : ''}${dinheiro(r.economia.saldo)}</b></div>
          <div class="jb-item"><span>Tesouro agora</span><b class="amb">${dinheiro(jogo.estado.tesouro)}</b></div>
          <div class="jb-item"><span>Trajetória</span><b style="color:${jogo.banda.cor}">${jogo.banda.nome}</b></div>
          <div class="jb-item"><span>Destino</span><b style="color:${jogo.banda.cor}">${jogo.destino}/100</b></div>
        </div>
        <div class="jd-barra"><div class="preench" style="width:${jogo.destino}%;background:${jogo.banda.cor}"></div></div>
        <div class="jd-regime">${ico('landmark', 13)} O mundo te vê como <b>${esc(jogo.rotulo.label)}</b> — ${esc(jogo.rotulo.descricao)}</div>`,
    });

    // Não voltamos ao console aqui: o desfecho ABRE o turno novo, então a última
    // página emenda direto na execução das ordens (via aoTerminar), sem intervalo
    // morto de planejamento no meio da revelação.
    jornada(paginas, () => { aoTerminar?.(); });
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
  // Padrão terminal: painel chanfrado, etiqueta --mono, condição cumprida por linha.
  const ROTULO_DESB = {
    capacidade_ind: 'Cap. Industrial', inteligencia: 'Inteligência', seguranca: 'Segurança',
    soft_power: 'Soft Power', uranio: 'Urânio', ogivas: 'Ogivas', temp_economia: 'Temp. Econômica',
    temp_guerra: 'Clima de Guerra', estabilidade: 'Estabilidade', aprovacao: 'Aprovação',
    poder_militar: 'Poder Militar', liberdades: 'Liberdades', pib: 'PIB', tesouro: 'Tesouro',
  };
  // "{ capacidade_ind: '>=70', inteligencia: '>=50' }" → "Cap. Industrial ≥70 · Inteligência ≥50 — atingido"
  function condicaoCumprida(a) {
    if (!a.desbloqueio) return 'Condição cumprida';
    const partes = Object.entries(a.desbloqueio).filter(([k]) => k !== '_acao')
      .map(([k, v]) => `${ROTULO_DESB[k] || k} ${String(v).replace('>=', '≥').replace('<=', '≤').replace(/\s+/g, '')}`);
    return `${partes.join(' · ')} — atingido`;
  }
  function popupDesbloqueio(lista, onClose) {
    // Sem emoji de cadeado: Lucide, com fallback seguro se o nome não existir na lib.
    const icoTopo = ico('unlock', 15) || ico('lock-open', 15) || ico('circle-check', 15);
    const icoOk = ico('circle-check', 11) || ico('check', 11);
    const modal = document.createElement('div');
    modal.className = 'modal-fundo pop-desbloqueio';
    modal.innerHTML = `<div class="desb-card">
      <div class="desb-trilho"></div>
      <div class="desb-etiqueta">${icoTopo}<span>ACESSO LIBERADO · P&D NACIONAL</span></div>
      <div class="desb-titulo">NOVA CAPACIDADE DESBLOQUEADA</div>
      <div class="desb-lista">${lista.map((a, i) => `
        <div class="desb-item" style="animation-delay:${120 + i * 110}ms">
          <span class="desb-i">${a.icone}</span>
          <div class="desb-info">
            <div class="desb-nome"><b>${esc(a.nome)}</b><span class="desb-cat">${esc(a.categoria).toUpperCase()}</span></div>
            <div class="desb-cond">${icoOk}<span>${esc(condicaoCumprida(a))}</span></div>
          </div>
        </div>`).join('')}</div>
      <button class="desb-ok">INCORPORAR ÀS OPÇÕES ${ico('chevron-right', 13)}</button>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.desb-ok').addEventListener('click', () => { modal.remove(); onClose?.(); });
  }

  function mostrarFim(fim) {
    cancelarFlash();
    const venceu = fim.tipo === 'vitoria';
    const e = jogo.estado;
    const diag = diagnosticoQueda(jogo, fim);   // POR QUE caiu — determinístico, sempre existe
    // Tempo no poder em anos + meses (cada batida = 1 mês).
    const anosI = Math.floor(jogo.turno / 12); const mesesI = jogo.turno % 12;
    const anos = anosI > 0
      ? `${anosI} ano${anosI > 1 ? 's' : ''}${mesesI ? ` e ${mesesI} ${mesesI > 1 ? 'meses' : 'mês'}` : ''}`
      : `${mesesI || 1} ${(mesesI || 1) === 1 ? 'mês' : 'meses'}`;
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

          <!-- POR QUE VOCÊ CAIU: causa formal + os números que cavaram a cova. Sempre
               existe (não depende da IA). O obituário narrado chega logo abaixo. -->
          <div class="fim-causa">
            <div class="fim-causa-rot">${ico('search', 13)} ${esc(diag.causaRot)}</div>
            ${diag.culpados.length ? `<div class="fim-culpados">${diag.culpados.map((c) => `
              <span class="fim-culpado"><i>${esc(c.k)}</i><b>${esc(c.v)}</b><small>${esc(c.txt)}</small></span>`).join('')}</div>`
    : '<div class="fim-culpados-vazio">Nenhum indicador isolado explica: foi o conjunto da obra.</div>'}
          </div>

          <div class="fim-sec">${ico('feather', 13)} O OBITUÁRIO POLÍTICO</div>
          <div class="fim-obito" id="fim-obito"><i class="fim-obito-load">${ico('loader', 13)} a imprensa está escrevendo sobre você…</i></div>

          <div class="fim-sec">${ico('chart-line', 13)} O QUE VOCÊ DEIXOU PRA TRÁS</div>
          <div class="fim-grid">
            ${pill('Tempo no poder', anos, 'var(--cyan)')}
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
            <div class="fim-h"><span class="fh-t">Turno ${h.turno}</span><span class="fh-c">${esc(h.carta)}</span><span class="fh-e">${esc(h.escolha)}</span></div>`).join('')}</div>` : ''}

          <button class="fim-btn" onclick="location.reload()">${ico('rotate-ccw', 16)} NOVO REINADO</button>
        </div>
      </div>`);

    // O OBITUÁRIO chega depois (a IA escreve enquanto o jogador lê os números). Se a
    // IA estiver desligada, o fallback escrito à mão entra no lugar — nunca fica vazio.
    obituarioDaQueda(jogo, fim, diag).then((texto) => {
      const alvo = container.querySelector('#fim-obito');
      if (!alvo) return;
      alvo.innerHTML = String(texto).split(/\n{2,}/).map((p) => `<p>${esc(p.trim())}</p>`).join('');
    }).catch(() => {});
  }

  // MODO TEMPO REAL: cria o relógio (fila + batida do mundo) e o liga. Sem "passar turno".
  tr = criarTempoReal(jogo, {
    render: renderAcoes, aposAcao: aposAcaoTempo, aposBeat: aposBeatTempo,
    // MUNDO ÚNICO: numa sala online, só o HOST bate o relógio do mundo — o convidado
    // recebe a batida pela rede (aoBeatHost em ligarOnline → tr.beatExterno).
    souBeatLocal: () => !jogo.ehOnline || !!onlineCtrl?.souHost(),
  });
  if (jogo.fase !== 'fim') tr.iniciar();

  // RECÉM-CHEGADO NA SALA: adota o retrato do mundo que o servidor entregou no
  // `entrar` (mês, Brent, guerras NPC) — nasce no MESMO calendário de todo mundo.
  if (jogo.ehOnline && net?.estado?.().mundoAtual) {
    jogo.aplicarMundoCompartilhado(net.estado().mundoAtual);
    renderTopo();
  }
  // MEMÓRIA DA SALA (#8): adota os fatos inter-jogador que já rolaram — territórios tomados,
  // frotas no mar — pra a explosão/conquista APARECER pra quem chega depois (e pro dono).
  if (jogo.ehOnline && net?.estado?.().estadoSala) {
    onlineCtrl?.aplicarEstadoSala?.(net.estado().estadoSala);
  }

  renderBadge(); renderHud(); renderFeed(); renderAcoes();
  window.__jogo = jogo; // hook de debug (dev)
  window.__tr = tr; // hook de debug (dev)
  window.__render = { renderFeed, renderHud, renderAcoes, renderTopo }; // hook de debug (dev)
  window.__fim = mostrarFim; // hook de debug (dev): testar a tela de queda sem esperar cair
}
