// GLOBO 3D CINEMÁTICO — Terra por satélite, marcadores que GRUDAM na superfície,
// linhas de ação traçando o planeta e satélites em órbita.
//
// REGRAS APRENDIDAS NA MARRA:
//  1. htmlElementsData só existe com CSS2DRenderer em extraRenderers.
//  2. globe.gl compara arrays por REFERÊNCIA → sempre criar array novo.
//  3. NUNCA pôr `transform` no elemento raiz do marcador: o globe.gl usa transform
//     pra posicionar. Animação vai num filho.
import Globe from 'globe.gl';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as THREE from 'three';
import { iso, nomePais, relacaoAtual, souEu, jogadorIso, PAISES } from '../dados/paises.js';
import { detalheForca } from '../jogo/forcasMundo.js';
import { blocosDoIso } from '../dados/blocos.js';
import { cartaoDe } from '../dados/registro.js';
import { liderDe } from '../dados/lideres.js';
import { bandeiraDeFeature, bandeira, ISO2_DE, FOTO_UNIDADE } from '../dados/imagens.js';
import { techDaFrota, forcaCombate } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { abrirAcoesNaval } from './navalAcoes.js';
import { abrirGovernanca } from './governanca.js';
import { estaOcupado, ocupacaoDe } from '../jogo/ocupacao.js';
import { MODELOS, luzes } from './modelos3d.js';
import { TIPOS_BASE } from '../dados/bases.js';
import { construirMalha, rotaMaritima } from '../jogo/rotasMar.js';
import { PETROLEO, ESTREITOS } from '../dados/petroleo.js';
import { NACOES } from '../dados/registro.js';
import { ico } from './icones.js';

import { registrarEstados, registrarCidades, semearGuarnicoes, todosEstados, paisCarregado, tropaLivre } from '../jogo/territorio.js';
import { tickTransito, emTransito, iniciarTransito, comprimentoRota, frotasDetectadas, resolverBatalhaNaval, forcaFrota, poderNaval, semearFrotasInimigas, distGraus, setProvedorRota } from '../jogo/frotas.js';
import { temIntel } from '../jogo/espionagem.js';
import { corEstado, linhaEstado, alturaEstado, tipEstado, montarPontos, tipPonto, estadosVisiveis, resumoDominios } from './tatico.js';

const TEX = 'https://cdn.jsdelivr.net/npm/three-globe/example/img';
const centro = (f) => ({ lat: Number(f?.properties?.LABEL_Y ?? 0), lng: Number(f?.properties?.LABEL_X ?? 0) });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iso2 = (f) => (f?.properties?.ISO_A2_EH || f?.properties?.ISO_A2 || '').replace('-99', '');


function corPais(estado, f, realista) {
  const code = iso(f);
  if (souEu(code)) return 'rgba(255, 200, 60, 0.30)';   // discreto: quem marca é o pino
  if (estaOcupado(estado, code)) return 'rgba(255, 150, 40, 0.55)';
  if ((estado.emGuerra || []).includes(code)) return 'rgba(255, 59, 92, 0.55)';
  const r = relacaoAtual(estado, f);
  if (realista) {
    if (r >= 30) return 'rgba(34, 224, 160, 0.16)';
    if (r <= -30) return 'rgba(255, 59, 92, 0.18)';
    return 'rgba(0,0,0,0)';
  }
  if (r >= 30) return 'rgba(34, 224, 160, 0.5)';
  if (r <= -30) return 'rgba(255, 59, 92, 0.45)';
  if (r <= -1) return 'rgba(255, 176, 32, 0.28)';
  return 'rgba(53, 224, 255, 0.14)';
}

// Relevo mínimo: nada de blocos gigantes saindo do planeta.
function altitudeDe(estado, f) {
  const code = iso(f);
  if (estaOcupado(estado, code)) return 0.012;
  if ((estado.emGuerra || []).includes(code)) return 0.012;
  return 0.006;
}

// ── HOVER DO PAÍS ─────────────────────────────────────────────────────
// Redesenhado como product designer, não como despejo de variáveis.
//
// O problema da versão anterior: cinco linhas de "rótulo: valor" com o mesmo peso
// visual. "Relação -55" e "PIB 18.5 tri" competiam pela mesma atenção, e o jogador
// tinha de LER tudo pra achar o que importa.
//
// A hierarquia certa, de cima pra baixo:
//   1. QUEM É   — bandeira + nome. Reconhecimento instantâneo.
//   2. O QUE É PRA MIM — a faixa de status colorida. É a única coisa que decide
//      se você clica ou não. Ganha cor, caixa e o topo.
//   3. POSSO GANHAR/PERDER O QUÊ — força, PIB, petróleo, ogivas. Em grade, ícones,
//      escaneável sem ler.
//   4. O QUE FAZER — a chamada pra ação, discreta no rodapé.
//
// Cada linha só aparece se tiver informação. Tooltip que mostra "Ogivas: 0" pra
// todo mundo é ruído.
function tooltip(estado, f, selecionado = false) {
  const code = iso(f);
  const p = f.properties || {};
  const oc = ocupacaoDe(estado, code);
  const guerra = (estado.emGuerra || []).includes(code);
  const eu = souEu(code);
  const rel = relacaoAtual(estado, f);
  const bd = bandeiraDeFeature(f, 80);
  const petro = PETROLEO[code];
  const ficha = NACOES[code]?.ficha?.estadoInicial;
  const bases = (estado.bases || []).filter((b) => b.iso === code);
  const pibGeo = Number(p.GDP_MD || 0) / 1e6;
  const pib = ficha?.pib || (pibGeo > 0 ? round2(pibGeo) : 0);

  // 2. O QUE É PRA MIM — a decisão cabe aqui.
  let faixa; let cor;
  if (eu) { faixa = { rot: 'SUA NAÇÃO', sub: 'Aqui é casa' }; cor = '#ffc83c'; }
  else if (oc) {
    faixa = { rot: 'SOB SUA OCUPAÇÃO', sub: `Insurgência ${oc.insurgencia}% · ocupado há ${oc.desde || 0} turno(s)` };
    cor = oc.insurgencia >= 60 ? '#ff3b5c' : '#ff9628';
  } else if (guerra) { faixa = { rot: 'EM GUERRA', sub: 'Conflito ativo com você' }; cor = '#ff3b5c'; }
  else if (rel >= 60) { faixa = { rot: 'ALIADO', sub: `Relação ${rel} · vendem o que você pedir` }; cor = '#22e0a0'; }
  else if (rel >= 30) { faixa = { rot: 'PARCEIRO', sub: `Relação ${rel} · aceitam base e negócio` }; cor = '#22e0a0'; }
  else if (rel <= -60) { faixa = { rot: 'HOSTIL', sub: `Relação ${rel} · nada a negociar` }; cor = '#ff3b5c'; }
  else if (rel <= -20) { faixa = { rot: 'TENSO', sub: `Relação ${rel} · desconfiança mútua` }; cor = '#ffb020'; }
  else { faixa = { rot: 'NEUTRO', sub: `Relação ${rel} · nem amigo nem inimigo` }; cor = '#35e0ff'; }

  // 3. O QUE ESTÁ EM JOGO — só o que existe.
  const dados = [];
  // Força REAL, com o que os aliados emprestaram. Antes vinha de estimaForca() — a tabela
  // fixa — então um país reforçado pelo bloco aparecia no tooltip com o mesmo número de
  // sempre, e o jogador atacava achando que enfrentaria 48. O reforço tem de ser visível
  // ANTES do tiro, senão a surpresa não é estratégia, é armadilha.
  const df = detalheForca(estado, code, f);
  dados.push({
    ic: 'swords', rot: 'Força',
    v: df.boost > 0 ? `${df.total} (${df.base} + ${df.boost} aliado)` : df.total,
    alerta: df.boost > 0,
  });
  if (pib) dados.push({ ic: 'circle-dollar-sign', rot: 'PIB', v: `${pib} tri` });
  if (ficha?.ogivas > 0) dados.push({ ic: 'radiation', rot: 'Ogivas', v: ficha.ogivas, alerta: true });
  if (petro) dados.push({ ic: 'fuel', rot: 'Reservas', v: `${petro.reservas} bi`, oleo: true });

  const blocos = blocosDoIso(code).map((b) => b.nome).join(' · ');
  // O trunfo geográfico: o motivo de invadir Omã não é Omã.
  const estreito = Object.values(ESTREITOS).find((e) => e.controle.includes(code));

  return `<div class="gt" style="--c:${cor}">
    <div class="gt-cab">
      ${bd ? `<img class="gt-flag" src="${bd}" alt="">` : ''}
      <div class="gt-id">
        <b>${esc(nomePais(f))}</b>
        ${blocos ? `<span>${esc(blocos)}</span>` : ''}
      </div>
    </div>

    <div class="gt-faixa">
      <b>${faixa.rot}</b>
      <span>${esc(faixa.sub)}</span>
    </div>

    <div class="gt-grade">${dados.map((d) => `
      <div class="gt-d ${d.alerta ? 'alerta' : ''} ${d.oleo ? 'oleo' : ''}">
        ${ico(d.ic, 11)}
        <span>${d.rot}</span>
        <b>${d.v}</b>
      </div>`).join('')}</div>

    ${estreito ? `<div class="gt-tag geo">${ico('anchor', 10)} Controla ${esc(estreito.nome)} — ${estreito.fluxo} Mb/d passam aqui</div>` : ''}
    ${bases.length ? `<div class="gt-tag base">${ico('radio-tower', 10)} ${bases.length} instalação(ões) sua(s) no solo</div>` : ''}
    ${eu ? '' : `<div class="gt-cta ${selecionado ? 'armado' : ''}">${ico('mouse-pointer-click', 10)} ${selecionado ? 'clique de novo para agir' : 'clique para selecionar'}</div>`}
  </div>`;
}
function round2(n) { return Math.round(n * 100) / 100; }

export function tensaoGlobal(estado) {
  const rels = Object.keys(estado).filter((k) => k.startsWith('rel_'));
  const media = rels.length ? rels.reduce((a, k) => a + estado[k], 0) / rels.length : 0;
  // O mundo NUNCA está em paz total — há sempre uma Ucrânia, um Oriente Médio. Uma base
  // de tensão + o que o Mundo Vivo cospe (guerras entre NPCs, pandemias) somam ao seu
  // próprio clima de guerra. Atacar um país soberano de peso puxa isto pra cima de
  // verdade: temp_guerra sobe (escalado pela importância do alvo, ver jogo/guerra.js),
  // você entra em `emGuerra`, e a relação com o bloco dele despenca.
  const BASE = 14;
  const npc = (estado.conflitosNPC || []).reduce((a, c) => a + 3 + (c.intensidade || 40) / 20, 0);
  const pand = (estado.pandemias?.length || 0) * 4;
  const t = BASE + (estado.temp_guerra * 0.6) + Math.max(0, -media) * 0.5
    + (estado.emGuerra?.length || 0) * 9 + npc + pand;
  return Math.max(0, Math.min(100, Math.round(t)));
}

export async function montarGlobo(container, jogo, {
  onPaisClick, onEstadoClick, onPaisSelecionado, onAlvoEstado, onAlvoMar, onDistribuir, onIntervir,
}) {
  let features = [];
  try {
    const geo = await fetch('/paises-110m.geojson').then((r) => r.json());
    features = (geo.features || []).filter((f) => iso(f) !== 'ATA');
  } catch (e) {
    container.innerHTML = `<div class="globo-erro">Falha ao carregar o mapa: ${e.message}</div>`;
    return { atualizar() {}, features: [] };
  }

  let realista = true;
  let marcadores = [];
  let ultimoTickFrota = 0;   // throttle da interpolação de frotas em trânsito (~22fps)
  // POOL DE IDENTIDADE DA FROTA: o globe.gl cacheia o nó DOM (e seus listeners de
  // hover/arrasto) pela IDENTIDADE do objeto de dado. Se recriarmos o objeto da frota a
  // cada atualizar(), ele destrói/recria o pino — e o hover quebra (o cursor fica parado
  // sobre o pino novo e mouseenter não dispara). Reusando o MESMO objeto por frota, o nó
  // sobrevive e o hover/arrasto continuam funcionando. (WeakMap = some sozinho quando a
  // frota é removida.)
  const poolFrota = new WeakMap();
  const poolInimiga = new WeakMap();   // pinos de frota inimiga detectada (hover estável)
  let sinoNotif = null; let painelNotif = null; let notifLidas = 0; // central de alertas
  let arcos = [];        // efêmeros: ações do jogador, somem sozinhos
  let arcosMundo = [];   // persistentes: guerras NPC — vivem enquanto o conflito viver
  let arcoGuia = null;   // ARRAY de segmentos: a rota que o jogador DESENHA arrastando a frota
  const pintarArcos = () => globe.arcsData([...arcosMundo, ...arcos, ...(arcoGuia || [])]);

  // ── TERRITÓRIOS ─────────────────────────────────────────────────────
  // Os 862 KB de estados + 126 KB de cidades NÃO entram no carregamento inicial —
  // a home cinemática não paga por uma camada que talvez nunca abra. Carregam na
  // primeira seleção de país, uma vez, e ficam.
  let estadosGeo = null;      // features do admin-1 dos países já abertos
  let cidadesLista = null;
  let indiceEstados = null;   // { ISO: nºestados } — quem tem território, sem baixar
  let carregando = null;      // promessa do índice em voo

  // ── TEATRO DE OPERAÇÕES ─────────────────────────────────────────────
  // O mapa armado. Com ele ligado o seu território se abre (você precisa ver de
  // onde a força sai), e clicar em solo alheio deixa de ser diplomacia e passa a
  // ser designação de alvo.
  let teatro = false;

  // ── SELEÇÃO EM DOIS TEMPOS ──────────────────────────────────────────
  // Clicar num país costumava abrir o modal na cara — o que impedia o mapa de ser
  // usado como MAPA. Agora o primeiro clique SELECIONA (o país acende, a câmera
  // vai até ele, e "ver estados" passa a falar dele); o segundo clique no mesmo
  // país é que abre as ações. Selecionar deixou de custar um modal.
  let selecionado = null;   // ISO do país em foco
  let cliqueNaEsfera = false;  // o último clique acertou o globo (país/estado/mar)? senão foi no vazio

  const globe = Globe({ extraRenderers: [new CSS2DRenderer()] })(container)
    .backgroundColor('rgba(0,0,0,0)')
    .globeImageUrl(`${TEX}/earth-blue-marble.jpg`)
    .bumpImageUrl(`${TEX}/earth-topology.png`)
    .showAtmosphere(true).atmosphereColor('#4aa8ff').atmosphereAltitude(0.22)
    .polygonsData(features)
    .polygonCapColor((f) => corPais(jogo.estado, f, realista))
    .polygonSideColor(() => 'rgba(53, 224, 255, 0.04)')
    .polygonStrokeColor(() => 'rgba(150, 205, 240, 0.18)')
    .polygonAltitude((f) => altitudeDe(jogo.estado, f))
    .polygonLabel((f) => tooltip(jogo.estado, f))
    // O clique lê o que foi clicado, não "em que modo estou".
    //   Estado  → reforçar (seu) ou designar alvo (alheio, no Teatro).
    //   País    → 1º clique SELECIONA e o abre em estados; 2º clique agrega ações.
    .onPolygonClick(async (f) => {
      cliqueNaEsfera = true;                 // o raio acertou um país/estado — não é clique no vazio
      if (ehEstado(f)) {
        const meu = f.properties.pais === (jogo.estado.iso || 'USA');
        if (teatro && !meu) onAlvoEstado?.(f);   // mapa armado + solo alheio = alvo
        else onEstadoClick?.(f);
        return;
      }
      const code = iso(f);
      if (selecionado !== code) {
        selecionado = code;
        desenharLinha(f, 'foco');
        focar(f);
        atualizar();                  // acende o selecionado e ergue a insígnia
        onPaisSelecionado?.(f);
        // Selecionar É o filtro: o país se abre em estados sozinho. Antes isso
        // exigia um botão "ver estados", e ninguém quer "ver estados" — quer ver
        // os estados DAQUELE país. Baixa SÓ o país clicado (mediana 6,3 KB); o mapa
        // repinta quando chegar, sem travar o clique.
        await carregarPais(code);
        if (selecionado === code) pintarCamada();
        return;
      }
      onPaisClick(f);                 // 2º clique no mesmo país: agora sim, agir
    })
    .onPolygonHover((h) => {
      // Estados têm altura própria (a guarnição). Só países reagem ao hover — e o
      // selecionado fica levantado sempre, senão a seleção pisca quando o mouse sai.
      globe.polygonAltitude((d) => {
        if (ehEstado(d)) return alturaEstado(jogo.estado, d);
        if (iso(d) === selecionado) return 0.035;
        return d === h ? 0.03 : altitudeDe(jogo.estado, d);
      });
      container.style.cursor = h ? 'pointer' : 'grab';
    })
    // Clicar no mar: com o Teatro armado é uma posição naval; sem ele, é o gesto
    // universal de "deixa pra lá" e a seleção some.
    .onGlobeClick((c) => {
      cliqueNaEsfera = true;                 // avisa o handler de fundo que o raio ACERTOU o globo
      if (teatro) { onAlvoMar?.(c); return; }
      if (selecionado) limparSelecao();
    })
    // RADAR DE CONFLITO — anéis que se propagam do país e ficam enquanto durar a
    // guerra/ocupação. Cada foco carrega a própria cor e velocidade: vermelho rápido
    // pra guerra ativa, laranja lento pra ocupação, âmbar pra tensão diplomática.
    .ringColor((d) => (t) => `${d.cor || 'rgba(255,59,92,'}${(1 - t) * (d.forca || 1)})`)
    .ringMaxRadius((d) => d.raio || 6)
    .ringPropagationSpeed((d) => d.vel || 2.4)
    .ringRepeatPeriod((d) => d.periodo || 700)
    // BUG QUE ISTO CONSERTA: os anéis nasciam na altitude 0 — ABAIXO dos polígonos de
    // país em guerra (0.012), que os engoliam. O radar de conflito "sumia sob o país".
    // Agora ele flutua acima do terreno e das nações, então o pulso aparece de verdade.
    .ringAltitude((d) => d.alt ?? 0.022)
    .labelsData(features.filter((f) => iso2(f) && (PAISES[iso(f)] || Number(f.properties?.POP_EST || 0) > 4e7)))
    .labelLat((f) => centro(f).lat).labelLng((f) => centro(f).lng)
    .labelText((f) => iso2(f))
    .labelSize(0.7).labelDotRadius(0.18)
    .labelColor((f) => (souEu(iso(f)) ? '#ffc83c' : 'rgba(210,232,255,.6)'))
    .labelResolution(2)
    // LINHAS DE AÇÃO traçando o globo
    .arcsData(arcos)
    .arcColor('cor').arcAltitudeAutoScale(0.45)
    .arcStroke(0.55).arcDashLength(0.45).arcDashGap(0.15)
    .arcDashAnimateTime((d) => d.vel || 2200)
    .arcsTransitionDuration(400)
    // MARCADORES colados na superfície
    .htmlElementsData(marcadores)
    .htmlLat('lat').htmlLng('lng').htmlAltitude(0.03)
    // SEM TWEEN de posição: o padrão do three-globe é animar CADA reposicionamento por
    // 1000ms (Quadratic.InOut) — e ele NÃO cancela tweens antigos. Re-setar os dados no
    // meio de um trânsito criava dezenas de tweens simultâneos brigando pela mesma
    // posição: o pino andava atrasado, travado, e "saltava" quando um tween velho
    // terminava por cima do novo. Com 0, o digest ASSENTA na posição real na hora —
    // quem anima o pino da frota é o loop anima() (por frame, direto no objeto 3D).
    .htmlTransitionDuration(0)
    .htmlElement((d) => {
      const el = document.createElement('div');
      el.className = 'mm';                       // SEM transform aqui!
      el.innerHTML = `<div class="mm-in ${d.tipo} ${d.foto ? 'com-foto' : ''} ${d.avistada ? (d.avistadaHostil ? 'avistada-hostil' : 'avistada') : (d.frotaRef ? 'discreta' : '')}">
          ${d.foto ? `<img class="mm-frota-foto" src="${d.foto}" alt="" onerror="this.style.display='none'">`
            : (d.flag ? `<img class="mm-flag" src="${d.flag}" alt="">` : '')}
          <span class="mm-ic">${d.svg}</span>
          ${d.rot ? `<span class="mm-rot">${d.rot}</span>` : ''}
          ${d.avistada ? `<i class="mm-olho">${ico('eye', 9)}</i>` : ''}
          ${d.tip && d.acao !== 'pais' && !d.semInfo ? '<i class="mm-info">?</i>' : ''}
        </div>`;
      // HOVER RICO: marcadores com `tip` (guerra, pandemia, zona radioativa) mostram
      // um cartão flutuante com o status do conflito. Sem `tip`, cai no title nativo.
      if (d.tip) {
        el.addEventListener('mouseenter', () => mostrarTipMarcador(d.tip));
        el.addEventListener('mouseleave', esconderTipMarcador);
      } else {
        el.title = d.titulo || '';
      }
      // Conflito/pandemia do Mundo Vivo: clicar ABRE a intervenção (ajuda, mediação,
      // pesquisa). É a porta pra o jogador mexer no que acontece no resto do mundo.
      if (d.intervir) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (ev) => { ev.stopPropagation(); esconderTipMarcador(); onIntervir?.(d.intervir); });
      }
      // BADGE DE DOMÍNIO: clicar abre os estados daquele país (mesmo fluxo do clique no
      // país — seleciona, centra a câmera, BAIXA os estados e repinta). stopPropagation
      // impede o clique-fora de desselecionar.
      if (d.abrirPais) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', async (ev) => {
          ev.stopPropagation(); esconderTipMarcador();
          const code = d.abrirPais;
          selecionado = code; focar(d); atualizar();
          await carregarPais(code);
          if (selecionado === code) pintarCamada();
        });
      }
      // FROTA: arraste o pino pra reposicionar (com traçado), ou clique pra abrir as
      // ações rápidas. O drag desliga a órbita do globo enquanto acontece.
      if (d.frotaRef) {
        el.style.cursor = 'grab';
        prepararArrastoFrota(el, d);
      }
      // FROTA INIMIGA detectada: clicar ENGAJA (combate naval se você tiver frota no alcance).
      if (d.frotaInimigaRef) {
        el.style.cursor = 'crosshair';
        el.addEventListener('click', (ev) => { ev.stopPropagation(); onFrotaInimigaClick(d.frotaInimigaRef); });
      }
      return el;
    });

  globe.globeMaterial().bumpScale = 6;

  // A máscara de terra das rotas marítimas monta em fatias logo após a abertura.
  // NÃO usar requestIdleCallback aqui: o globo renderiza todo frame via rAF e o
  // navegador nunca fica "idle" — o callback simplesmente não dispara (testado).
  setTimeout(() => construirMalha(features), 700);
  // Registra o PROVEDOR DE ROTA nas frotas: qualquer iniciarTransito (inclusive o deploy
  // porto→destino disparado por ui/naval.js) passa a navegar por ÁGUA. Enquanto a malha
  // não fica pronta, rotaMaritima devolve null e frotas.js cai na reta — nunca trava.
  setProvedorRota((origem, destino) => rotaMaritima(origem, destino));

  // ── CAMADA 3D: satélites em órbita + esquadrilhas em missão ─────────
  const orbitas = new THREE.Group();
  globe.scene().add(orbitas);
  // Os modelos usam MeshPhongMaterial: SEM este rig eles renderizam pretos.
  globe.scene().add(luzes());
  const R = globe.getGlobeRadius();

  // ── ARRASTAR A FROTA ────────────────────────────────────────────────
  // globe.gl não tem callback de "hover na superfície", então fazemos o raycast à mão:
  // do ponteiro (em NDC) contra a esfera do globo, e o ponto de impacto vira lat/lng via
  // globe.toGeoCoords. É o que permite arrastar o pino da frota pra onde o jogador quiser.
  const _raycaster = new THREE.Raycaster();
  const _esferaGlobo = new THREE.Sphere(new THREE.Vector3(0, 0, 0), R);
  function telaParaLatLng(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    _raycaster.setFromCamera(ndc, globe.camera());
    const p = new THREE.Vector3();
    if (!_raycaster.ray.intersectSphere(_esferaGlobo, p)) return null;
    const g = globe.toGeoCoords(p);
    return { lat: g.lat, lng: g.lng };
  }

  // wrap de longitude no antimeridiano (rota cruzando o Pacífico salta de +179 pra -179)
  const dLngW = (a, b) => { let x = b - a; if (x > 180) x -= 360; else if (x < -180) x += 360; return x; };
  const dSeg = (p, q) => Math.hypot(q.lat - p.lat, dLngW(p.lng, q.lng) * 0.7);

  // Corta a polilinha no COMPRIMENTO máximo (o alcance da frota vale pro caminho REAL,
  // não pra reta). Devolve a rota truncada — o último ponto vira o novo destino.
  function cortarRota(rota, maxLen) {
    if (!rota || rota.length < 2 || comprimentoRota(rota) <= maxLen) return rota;
    const out = [rota[0]];
    let acc = 0;
    for (let i = 1; i < rota.length; i += 1) {
      const seg = dSeg(rota[i - 1], rota[i]);
      if (acc + seg >= maxLen) {
        const t = seg > 0 ? (maxLen - acc) / seg : 0;
        let lng = rota[i - 1].lng + dLngW(rota[i - 1].lng, rota[i].lng) * t;
        if (lng > 180) lng -= 360; else if (lng < -180) lng += 360;
        out.push({ lat: rota[i - 1].lat + (rota[i].lat - rota[i - 1].lat) * t, lng });
        return out;
      }
      acc += seg;
      out.push(rota[i]);
    }
    return out;
  }

  // CALLBACKS DE CHEGADA por id de frota: quando o tickTransito (no anima()) reporta que
  // a frota assentou, disparamos o que ficou agendado aqui (ex.: abrir as ações navais
  // porque o jogador arrastou o pino pra cima de um país hostil).
  const aoChegarFrota = new Map();

  // Põe a frota pra NAVEGAR até o destino pelo TRILHO ÚNICO de trânsito (jogo/frotas.js):
  // iniciarTransito grava origem/destino/rota/chegaEm no objeto e o tique em anima()
  // interpola TODO frame — nada de rAF paralelo mutando lat/lng por fora (era isso que
  // fazia o pino brigar consigo mesmo e saltar). Aqui só sobra: disparar o trânsito,
  // desenhar a esteira UMA vez e agendar o aoChegar.
  function navegarFrota(d, origem, destino, aoChegar, rotaManual) {
    esconderTipMarcador();
    const fr = d.frotaRef;
    // rota manual (desenhada no arrasto) ou automática por ÁGUA; reta como último recurso
    let rota = (Array.isArray(rotaManual) && rotaManual.length >= 2) ? rotaManual : null;
    if (!rota) {
      const marinha = rotaMaritima(origem, destino);
      rota = (marinha && marinha.length >= 2) ? marinha : [origem, destino];
    }
    // ALCANCE vale pro COMPRIMENTO do caminho: se a rota passa do alcance, corta ali —
    // e o destino passa a ser o ponto onde o combustível acaba.
    const alc = d.frotaTech?.alcance || 20;
    rota = cortarRota(rota, alc);
    const alvoFinal = rota[rota.length - 1];
    const dur = iniciarTransito(fr, alvoFinal, Date.now(), rota);
    // A ESTEIRA segue a rota: desenha a polilinha em trechos, UMA vez, no início — o
    // movimento em si é do tique de trânsito, não destes arcos efêmeros.
    const vida = Math.min(9000, dur);
    if (rota.length > 2) {
      const passos = Math.min(8, rota.length - 1);
      for (let i = 0; i < passos; i += 1) {
        const a = rota[Math.round((i / passos) * (rota.length - 1))];
        const b = rota[Math.round(((i + 1) / passos) * (rota.length - 1))];
        desenharLinha(b, 'foco', vida, a);
      }
    } else desenharLinha(alvoFinal, 'foco', vida, origem);
    aoChegarFrota.set(fr.id || fr, () => { onFrotaMovida?.(fr); aoChegar?.(); });
  }

  // Liga o arrasto num pino de frota. CLIQUE abre as ações; ARRASTAR DESENHA A ROTA:
  // a trilha do cursor vira waypoints (só sobre ÁGUA), mostrada ao vivo em cyan; ao
  // SOLTAR, o navio navega por ela. Arrasto reto (sem waypoints) cai na rota automática.
  function prepararArrastoFrota(el, d) {
    let moveu = false; let origem = null; let destino = null;
    let waypoints = []; let ultimoPintar = 0;
    const ultimoPonto = () => (waypoints.length ? waypoints[waypoints.length - 1] : origem);
    const pintarGuia = (agora) => {
      // um segmento cyan por PAR de waypoints + o rabo até o cursor
      const cam = [origem, ...waypoints, destino];
      const segs = [];
      for (let i = 1; i < cam.length; i += 1) {
        segs.push({
          startLat: cam[i - 1].lat, startLng: cam[i - 1].lng,
          endLat: cam[i].lat, endLng: cam[i].lng,
          cor: ['#35e0ff', i === cam.length - 1 ? '#35e0ff00' : '#35e0ff'], vel: 900,
        });
      }
      arcoGuia = segs;
      if (agora - ultimoPintar > 50) { pintarArcos(); ultimoPintar = agora; }   // ~20 fps basta pra guia
    };
    const onMove = (ev) => {
      const geo = telaParaLatLng(ev.clientX, ev.clientY);
      if (!geo) return;
      if (Math.hypot(geo.lat - origem.lat, geo.lng - origem.lng) > 0.8) moveu = true;
      destino = geo;
      // COLETA DE WAYPOINTS: amostra a trilha do cursor a cada ≥1.5° do último ponto
      // aceito, e DESCARTA pontos em terra (navio não desenha rota por cima de país).
      if (dSeg(geo, ultimoPonto()) >= 1.5 && paisDoPonto(geo.lat, geo.lng) === null) {
        waypoints.push({ lat: geo.lat, lng: geo.lng });
      }
      pintarGuia(ev.timeStamp || performance.now());
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ctrl.enabled = true;
      el.style.cursor = 'grab';
      arcoGuia = null; pintarArcos();
      if (moveu && destino) {
        // ROTA FINAL: o que o jogador desenhou. Com <3 pontos (arrasto reto), deixa a
        // rota automática por água decidir o caminho (navegarFrota chama rotaMaritima).
        const rotaManual = waypoints.length ? [origem, ...waypoints, destino] : null;
        // ARRASTAR PARA DENTRO DE UM PAÍS = dispara ação: a frota navega até a costa e, ao
        // chegar, abre as ações navais mirando aquele alvo (pressão/ofensiva a partir do mar).
        const alvoIso = paisDoPonto(destino.lat, destino.lng);
        const meuIso = jogo.estado.iso || 'USA';
        navegarFrota(d, origem, destino, (alvoIso && alvoIso !== meuIso)
          ? () => { esconderTipMarcador(); onFrotaClick?.(d.frotaRef); }
          : null, rotaManual);
      } else { esconderTipMarcador(); onFrotaClick?.(d.frotaRef); }   // foi só um clique
    };
    el.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation(); ev.preventDefault();
      moveu = false; destino = null; waypoints = []; ultimoPintar = 0;
      origem = { lat: d.frotaRef.lat, lng: d.frotaRef.lng };
      ctrl.enabled = false;                 // trava a órbita enquanto arrasta
      el.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  // Que país está SOB um ponto (lat/lng)? Ray-casting local sobre o GeoJSON já carregado
  // (sem lib nova) — usado pra saber se a frota foi arrastada pra DENTRO de um país.
  function pontoEmAnel(x, y, ring) {
    let dentro = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0]; const yi = ring[i][1]; const xj = ring[j][0]; const yj = ring[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) dentro = !dentro;
    }
    return dentro;
  }
  function paisDoPonto(lat, lng) {
    for (const f of features) {
      const g = f.geometry; if (!g) continue;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const poly of polys) { if (poly[0] && pontoEmAnel(lng, lat, poly[0])) return iso(f); }
    }
    return null;
  }

  // Países mais próximos de uma frota (pra detecção/ameaça). Reusa a métrica achatada.
  function paisesProximos(fr) {
    const eu = jogo.estado.iso || 'USA';
    const out = [];
    for (const [code, info] of Object.entries(PAISES)) {
      if (code === eu) continue;
      const c = ondeEsta(code); if (!c) continue;
      const d = Math.hypot(c.lat - fr.lat, (c.lng - fr.lng) * 0.7);
      if (d > 26) continue;
      const rel = Number(jogo.estado[info.rel] ?? 0);
      out.push({ code, nome: info.nome, d, rel, hostil: rel <= -20, parceiro: rel >= 30 });
    }
    return out.sort((a, b) => a.d - b.d);
  }

  // AVISTAMENTO: quem TEM condição de detectar a frota AGORA — contraste da furtividade
  // dela contra o "radar" do vizinho (força militar do país × alcance que decai com a
  // distância). Devolve o observador mais próximo que consegue ver, ou null (indetectada).
  function avistamentoDe(fr, tech) {
    const furt = tech?.furtividade ?? 50;
    let melhor = null;
    for (const p of paisesProximos(fr)) {
      const forcaObs = PAISES[p.code]?.forca || 30;
      const alcanceRadar = p.d <= 6 ? 58 : p.d <= 12 ? 40 : p.d <= 20 ? 24 : 9;
      const poderRadar = alcanceRadar * (forcaObs / 100 + 0.4);
      if (poderRadar >= furt && (!melhor || p.d < melhor.d)) melhor = { ...p, poderRadar };
    }
    return melhor;
  }

  // Clicar no pino da frota abre as AÇÕES RÁPIDAS (reposicionar, voltar pra casa, atacar).
  function onFrotaClick(fr) {
    abrirAcoesNaval(fr, jogo, {
      paisesProximos, ondaRadar, atualizar,
      onFim: () => {},
    });
  }

  // Clicar numa FROTA INIMIGA detectada: se eu tiver uma esquadra no alcance de engajamento,
  // resolve o COMBATE NAVAL — a maior força vence (jogo/frotas.js). Senão, avisa pra aproximar.
  function onFrotaInimigaClick(fr) {
    const e = jogo.estado;
    let atacante = null; let melhorD = Infinity;
    for (const m of (e.frotas || [])) {
      const alc = Math.max(6, (techDaFrota(m.unidades || {}).alcance || 20) * 0.5);
      const d = distGraus(m, fr);
      if (d <= alc && d < melhorD) { atacante = m; melhorD = d; }
    }
    esconderTipMarcador();
    const nomeIni = PAISES[fr.code]?.nome || fr.code;
    if (!atacante) {
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Marinha', cor: '#ffb020',
        texto: `Frota de ${nomeIni} avistada (força ${forcaFrota(fr)}), mas nenhuma esquadra sua está em alcance de engajamento. Aproxime uma frota para atacar.` }]);
      return;
    }
    const res = resolverBatalhaNaval(atacante, fr);
    const pnMeu = Math.round(res.forcaAtacante * 10);   // poder naval legível (índice)
    const pnEle = Math.round(res.forcaDefensor * 10);
    e.emGuerra = e.emGuerra || []; if (!e.emGuerra.includes(fr.code)) e.emGuerra.push(fr.code);
    const chave = PAISES[fr.code]?.rel; if (chave) e[chave] = Math.max(-100, (e[chave] || 0) - 30);
    e.temp_guerra = Math.min(100, (e.temp_guerra || 0) + 12);
    ondaRadar?.({ lat: fr.lat, lng: fr.lng }, { cor: res.venceu ? 0x22e0a0 : 0xff3b5c, max: 62 });
    if (res.venceu) {
      e.frotasInimigas = (e.frotasInimigas || []).filter((f) => f.id !== fr.id);
      atacante.unidades = res.sobreviventesVencedor;
      if (!Object.values(atacante.unidades).some((q) => q > 0)) {
        e.frotas = (e.frotas || []).filter((f) => f.id !== atacante.id);
        if (atacante.guarnKey) delete e.guarnicoes?.[atacante.guarnKey];
      } else if (atacante.guarnKey && e.guarnicoes) { e.guarnicoes[atacante.guarnKey] = { ...atacante.unidades }; }
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Marinha', cor: '#22e0a0',
        texto: `⚓ VITÓRIA NO MAR: sua frota (força ${pnMeu}) afundou a esquadra de ${nomeIni} (força ${pnEle}). Suas baixas: ${res.perdaVencedorPct}%.` }]);
    } else {
      e.frotas = (e.frotas || []).filter((f) => f.id !== atacante.id);
      if (atacante.guarnKey) delete e.guarnicoes?.[atacante.guarnKey];   // a tropa afundou junto
      fr.unidades = res.sobreviventesVencedor;
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Marinha', cor: '#ff3b5c',
        texto: `☠️ DERROTA NO MAR: a esquadra de ${nomeIni} (força ${pnEle}) afundou sua frota (força ${pnMeu}). O mar ficou com eles.` }]);
    }
    atualizar();
  }

  // Depois de arrastar a frota: quem sente? Se a frota NÃO é furtiva e parou perto de um
  // hostil, ele DETECTA e mobiliza — aviso na tela. Submarino não dispara aviso nenhum.
  function onFrotaMovida(fr) {
    const u = fr.unidades || {};
    const soSub = !u.navios && !u.porta_avioes && u.submarinos;
    const perto = paisesProximos(fr);
    const hostil = perto.find((p) => p.hostil && p.d <= 9);
    const territ = perto.find((p) => p.d <= 6 && !p.parceiro);
    jogo.estado._toastsGlobo = jogo.estado._toastsGlobo || [];
    if (soSub) {
      jogo.estado._toastsGlobo.push({ tom: 'conflito', titulo: 'FROTA FURTIVA', texto: `Seus submarinos deslizam sem deixar rastro. Ninguém no radar te viu.` });
    } else if (territ) {
      jogo.estado._toastsGlobo.push({ tom: 'perda', titulo: 'CONTATO NAVAL', texto: `${territ.nome} DETECTOU sua frota nas águas dele e mobiliza a defesa. Um passo de virar incidente.` });
      const chave = PAISES[territ.code]?.rel; if (chave) jogo.estado[chave] = Math.max(-100, (jogo.estado[chave] || 0) - 8);
    } else if (hostil) {
      jogo.estado._toastsGlobo.push({ tom: 'conflito', titulo: 'NAVIO SE APROXIMANDO', texto: `${hostil.nome} rastreou sua frota e enviou escolta pra observar. Clima pesado no mar.` });
    }
    dispararToastsGlobo();
  }

  const sats = [];
  const missoes = [];
  const explosoes = [];
  const nukes = [];   // detonações nucleares em curso (multi-fase: flash + onda + cogumelo)
  const ondas = [];   // ondas de radar (interceptação, pulsos de energia) — anéis que abrem e somem
  let balaoN = 0;   // contador pro espalhamento em ângulo áureo dos balões

  // ── GEOMETRIA: lat/lng → XYZ ────────────────────────────────────────
  // BUG QUE CUSTOU CARO: eu tinha um paraVetor() feito à mão com
  // `theta = (lng + 180)`. O three-globe usa `theta = (90 - lng)`. Resultado: TUDO
  // que eu posicionava em 3D (mísseis, esquadrilhas, explosões) saía rotacionado 90°
  // — o ataque partia do lugar errado e ia pro lugar errado.
  //
  // A lição: a globe.gl já expõe getCoords(), que é a MESMA função que ela usa pra
  // posicionar os polígonos e marcadores. Reimplementar essa matemática é garantir
  // divergência. `alt` é fração do raio (0.02 = 2% acima da superfície).
  const vetor = (lat, lng, alt = 0.01) => {
    const c = globe.getCoords(lat, lng, alt);
    return new THREE.Vector3(c.x, c.y, c.z);
  };

  function montarSatelites(n) {
    for (const s of sats) { orbitas.remove(s.mesh); orbitas.remove(s.trilha); }
    sats.length = 0;
    for (let i = 0; i < n; i += 1) {
      const g = MODELOS.satelite(1);
      const raio = R * 1.35 + i * 8;
      const incl = (Math.PI / 180) * (22 + i * 24);
      const trilha = new THREE.Mesh(new THREE.TorusGeometry(raio, 0.14, 6, 100),
        new THREE.MeshBasicMaterial({ color: 0x35e0ff, transparent: true, opacity: 0.12 }));
      trilha.rotation.x = Math.PI / 2 - incl;
      orbitas.add(trilha); orbitas.add(g);
      sats.push({ mesh: g, trilha, raio, incl, fase: Math.random() * Math.PI * 2, vel: 0.00018 + i * 0.00005 });
    }
  }

  // ── DOMÍNIO DE MOVIMENTO ────────────────────────────────────────────
  // BUG QUE ISTO CONSERTA: os navios seguiam a MESMA curva aérea dos caças e voavam
  // por cima do planeta. Um porta-aviões a 40 km de altitude não é estilo, é erro.
  //
  // Cada domínio tem a sua física no mapa:
  //   ar        → arco alto, sobe e desce (o caça atravessa por cima de tudo)
  //   mar       → rasante na superfície, altitude ~0 (o navio NAVEGA)
  //   submarino → LEVEMENTE ABAIXO da superfície: ele some no oceano, é o ponto dele
  const DOMINIO = {
    ataque:    { alt: 0.02, arco: 0.40, vel: 0.0055, cor: 0xff8fa3 },
    aereo:     { alt: 0.02, arco: 0.40, vel: 0.0055, cor: 0xdfe8ff },
    missil:    { alt: 0.02, arco: 0.55, vel: 0.0140, cor: 0xffd8a8 },
    naval:     { alt: 0.002, arco: 0.004, vel: 0.0022, cor: 0xb8c6de },
    frota:     { alt: 0.002, arco: 0.004, vel: 0.0018, cor: 0x9fb0c8 },
    submarino: { alt: -0.004, arco: 0.0, vel: 0.0026, cor: 0x5a6a80 },
  };

  // Lança uma esquadrilha 3D que segue até o alvo pelo domínio certo.
  // `origem` é opcional: se você tem uma BASE perto do alvo, o ataque sai DE LÁ —
  // e a diferença fica visível no globo (arco curto vs. travessia de oceano).
  function lancarEsquadrilha(alvo, tipo = 'ataque', origem = null) {
    const eu = origem || ondeEsta(jogadorIso());
    const c = alvo?.properties ? centro(alvo) : alvo;
    if (!eu || !c) return;
    const dom = DOMINIO[tipo] || DOMINIO.aereo;
    // ESCALA REDUZIDA 50%: navio e avião estavam gigantes sobre o globo — quebravam a
    // proporção. Metade do tamanho e a leitura fica de esquadrilha, não de brinquedo.
    const criar = { ataque: () => MODELOS.caca(0xff8fa3, 0.5), aereo: () => MODELOS.caca(0xdfe8ff, 0.5),
      naval: () => MODELOS.navio(0xb8c6de, 0.4), submarino: () => MODELOS.submarino(0x5a6a80, 0.4),
      frota: () => MODELOS.portaAvioes(0x9fb0c8, 0.28) }[tipo] || (() => MODELOS.caca(0xdfe8ff, 0.5));

    const p0 = vetor(eu.lat, eu.lng, dom.alt);
    const p1 = vetor(c.lat, c.lng, dom.alt);
    const dist = p0.distanceTo(p1);

    let curva;
    let velCurva = dom.vel;
    if (dom.arco <= 0.01) {
      // MAR. Primeiro tenta a ROTA MARÍTIMA DE VERDADE (A* sobre a máscara de terra,
      // ver jogo/rotasMar.js): o navio contorna a África, cruza Suez, respeita o
      // planeta. Só cai no grande círculo se a máscara ainda não terminou de montar.
      const rota = rotaMaritima(eu, c);
      if (rota && rota.length > 2) {
        const pts = rota.map((p) => vetor(p.lat, p.lng, dom.alt));
        curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
        // Rota costeira longa não pode ter a MESMA duração de um estreito: a
        // velocidade cai com o comprimento, senão a frota cruza o Pacífico em 4s.
        velCurva = Math.max(0.0007, Math.min(dom.vel, 0.11 / rota.length));
      } else {
        // fallback: grande círculo rasante (feio sobre continente, mas nunca trava)
        const pts = [];
        const passos = 40;
        const a = p0.clone().normalize();
        const b = p1.clone().normalize();
        const raio = R * (1 + dom.alt);
        for (let i = 0; i <= passos; i += 1) {
          const q = new THREE.Vector3().copy(a).lerp(b, i / passos).normalize().multiplyScalar(raio);
          if (dom.alt > 0) q.multiplyScalar(1 + Math.sin((i / passos) * Math.PI * 6) * 0.0006);
          pts.push(q);
        }
        curva = new THREE.CatmullRomCurve3(pts);
      }
    } else {
      // AR: arco alto. Mais rasante quando a origem é perto — dá leitura de
      // "decolou aqui do lado" em vez de "atravessou o mundo".
      const altura = R * (1 + dom.alt + Math.min(dom.arco, dist / (R * 5)));
      const meio = p0.clone().add(p1).multiplyScalar(0.5).normalize().multiplyScalar(altura);
      curva = new THREE.QuadraticBezierCurve3(p0, meio, p1);
    }

    const n = tipo === 'ataque' ? 3 : tipo === 'naval' ? 2 : 1;
    for (let i = 0; i < n; i += 1) {
      const m = criar();
      orbitas.add(m);
      missoes.push({
        mesh: m, curva, t: -i * 0.07, vel: velCurva, tipo, alvo: c,
        impacta: tipo === 'ataque' && i === n - 1,
      });
    }
  }

  // ── SALVA DE MÍSSEIS ───────────────────────────────────────────────
  // Traçantes finos e rápidos com cauda que se apaga. É o "tiro" que faltava:
  // o jogador precisa VER a violência saindo do ponto de lançamento.
  function salvaMisseis(alvo, n = 6, origem = null) {
    const eu = origem || ondeEsta(jogadorIso());
    const c = alvo?.properties ? centro(alvo) : alvo;
    if (!eu || !c) return;
    for (let i = 0; i < n; i += 1) {
      // dispersão: cada míssil sai com um desvio próprio, não é um trem de brinquedo
      const desvio = (Math.random() - 0.5) * 6;
      const p0 = vetor(eu.lat + desvio * 0.3, eu.lng + desvio * 0.3, 0.01);
      const p1 = vetor(c.lat, c.lng, 0.01);
      const meio = p0.clone().add(p1).multiplyScalar(0.5).normalize()
        .multiplyScalar(R * (1.2 + Math.random() * 0.25));
      const curva = new THREE.QuadraticBezierCurve3(p0, meio, p1);

      const traco = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curva.getPoints(48)),
        new THREE.LineBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.9 }),
      );
      traco.geometry.setDrawRange(0, 2);
      orbitas.add(traco);

      const ogiva = MODELOS.missil(0.6);
      orbitas.add(ogiva);
      missoes.push({ mesh: ogiva, traco, curva, t: -i * 0.05, vel: 0.014, tipo: 'missil', alvo: c, impacta: true });
    }
  }

  // ── MODO ALERTA ────────────────────────────────────────────────────
  // Quando alguém ataca, os países ligados ao alvo não podem ficar parados no mapa
  // como se fosse terça-feira. Isto acende anéis âmbar pulsando NELES durante a cena:
  // o mundo inteiro visivelmente prendendo a respiração.
  let alertasTemp = [];   // [{iso, ate}]
  function alertaTemporario(isos, ms = 60000) {
    const ate = performance.now() + ms;
    for (const code of isos || []) {
      if (!alertasTemp.find((a) => a.iso === code)) alertasTemp.push({ iso: code, ate });
    }
    atualizar();
    setTimeout(() => {
      alertasTemp = alertasTemp.filter((a) => a.ate > performance.now());
      atualizar();
    }, ms + 200);
  }

  // ── BALÃO DE DESPACHO ──────────────────────────────────────────────
  // Um status que NASCE no país atingido e sobe. É o pedido literal: "esses status
  // poderiam ser mensagens interagindo com o mapa saindo do país atingido".
  // Usa CSS2D (o mesmo renderer dos marcadores), então gruda na geografia e
  // acompanha a rotação do globo.
  function balao(coord, texto, tom = 'neutro') {
    if (!coord) return;
    const el = document.createElement('div');
    el.className = 'mm';   // raiz limpa: o globe.gl usa transform aqui pra posicionar
    el.innerHTML = `<div class="bl-in ${tom}">${esc(texto)}</div>`;
    const obj = new CSS2DObject(el);
    // DISPERSÃO EM ANEL: os balões nascem em volta do alvo, não em cima dele.
    // Empilhar no centro (o que a primeira versão fazia) deixava três textos
    // sobrepostos e ilegíveis. Cada balão pega um ângulo do relógio e um raio
    // com ruído — fica legível e ainda lê como "saindo do país".
    const ang = (balaoN * 2.39996) % (Math.PI * 2);   // ângulo áureo: espalha sem repetir
    balaoN += 1;
    const raio = 9 + Math.random() * 5;
    obj.position.copy(vetor(
      Math.max(-80, Math.min(80, coord.lat + Math.sin(ang) * raio)),
      coord.lng + Math.cos(ang) * raio * 1.4,
      0.07,
    ));
    orbitas.add(obj);
    setTimeout(() => {
      el.querySelector('.bl-in')?.classList.add('sai');
      setTimeout(() => orbitas.remove(obj), 700);
    }, 3400);
  }

  // ── IMPACTO ────────────────────────────────────────────────────────
  // Uma bola que cresce e some. Sem isso o ataque some no ar e não "acontece".
  function impacto(c) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: 0.85 }),
    );
    m.position.copy(vetor(c.lat, c.lng, 0.01));
    orbitas.add(m);
    explosoes.push({ mesh: m, t: 0 });
  }

  // ── ARMA NUCLEAR — o ICBM e a detonação ────────────────────────────
  // Um lançamento nuclear tem de PARECER diferente de tudo. A ogiva sobe num arco
  // altíssimo (sai da atmosfera), reentra sobre o alvo, e o que acontece embaixo
  // não é uma bolinha laranja — é flash cegante, cogumelo que sobe e onda de choque
  // que varre o continente. `origem` opcional (sai do seu país por padrão).
  function lancarOgiva(alvo, origem = null, aoDetonar = null, opts = {}) {
    const eu = origem || ondeEsta(jogadorIso());
    const c = alvo?.properties ? centro(alvo) : alvo;
    if (!eu || !c) return;
    focar(alvo);   // a câmera precisa TESTEMUNHAR

    const p0 = vetor(eu.lat, eu.lng, 0.02);
    const p1 = vetor(c.lat, c.lng, 0.02);
    // apogeu bem alto: um ICBM risca o espaço, não plana como um caça
    const meio = p0.clone().add(p1).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.9);
    const curva = new THREE.QuadraticBezierCurve3(p0, meio, p1);

    const m = MODELOS.missil(0.9);
    orbitas.add(m);
    // rastro branco brilhante da trajetória balística
    const traco = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curva.getPoints(60)),
      new THREE.LineBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.9 }),
    );
    traco.geometry.setDrawRange(0, 2);
    orbitas.add(traco);

    // INTERCEPTAÇÃO: se o alvo tem escudo à altura, a ogiva é abatida na reentrada
    // (uns ~72% do caminho). Em vez de cogumelo, um clarão defensivo no céu + uma
    // varredura de radar gigante no solo. A defesa venceu — desta vez.
    const interceptaEm = opts.interceptado ? 0.68 + Math.random() * 0.08 : null;
    missoes.push({ mesh: m, traco, curva, t: 0, vel: 0.006, tipo: 'ogiva', alvo: c, impacta: false,
      interceptaEm, aoInterceptar: opts.aoInterceptar,
      aoChegar: () => { detonacaoNuclear(c); aoDetonar?.(); } });
  }

  // INTERCEPTAÇÃO no ar: clarão ciano de plasma (a arma defensiva) + destroços +
  // uma onda de radar enorme varrendo o solo do defensor. Nada toca a terra.
  function interceptacaoNuclear(pos, c) {
    // clarão defensivo no ponto de abate
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 1 }));
    flash.position.copy(pos); orbitas.add(flash);
    explosoes.push({ mesh: flash, t: 0 });
    const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
    nucleo.position.copy(pos); orbitas.add(nucleo);
    explosoes.push({ mesh: nucleo, t: 0 });
    // a varredura de radar defensivo, imensa, no solo do alvo
    ondaRadar(c, { cor: 0x35e0ff, max: 130 });
    ondaRadar(c, { cor: 0x8ff0ff, max: 80 });
  }

  // Onda de radar: um anel rasante que abre gigante sobre um país e some. Serve pra
  // interceptação (defesa) e pode marcar qualquer pulso de energia no mapa.
  function ondaRadar(c, { cor = 0x35e0ff, max = 100, alt = 0.006 } = {}) {
    const base = vetor(c.lat, c.lng, alt);
    const normal = base.clone().normalize();
    const anel = new THREE.Mesh(new THREE.TorusGeometry(1, 0.18, 8, 48),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 }));
    anel.position.copy(base);
    anel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    orbitas.add(anel);
    ondas.push({ mesh: anel, t: 0, max });
  }

  // A detonação: 5 elementos vivos num objeto só, animados por fase no loop.
  function detonacaoNuclear(c) {
    const base = vetor(c.lat, c.lng, 0.005);
    const normal = base.clone().normalize();
    const grupo = new THREE.Group();

    // 1) FLASH — esfera branca cegante que estoura e some
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
    flash.position.copy(base); grupo.add(flash);

    // 2) BOLA DE FOGO — laranja, cresce e vira o cogumelo
    const fogo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.95 }));
    fogo.position.copy(base); grupo.add(fogo);

    // 3) COLUNA do cogumelo (sobe pela normal da esfera)
    const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 8, 10),
      new THREE.MeshBasicMaterial({ color: 0xd8925a, transparent: true, opacity: 0 }));
    coluna.position.copy(base.clone().add(normal.clone().multiplyScalar(R * 0.04)));
    coluna.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    grupo.add(coluna);

    // 4) CHAPÉU do cogumelo
    const chapeu = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xe0a868, transparent: true, opacity: 0 }));
    chapeu.position.copy(base.clone().add(normal.clone().multiplyScalar(R * 0.08)));
    grupo.add(chapeu);

    // 5) ONDA DE CHOQUE — anel rasante que varre a superfície
    const onda = new THREE.Mesh(new THREE.TorusGeometry(1, 0.25, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.85 }));
    onda.position.copy(base);
    onda.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    grupo.add(onda);

    orbitas.add(grupo);
    nukes.push({ grupo, flash, fogo, coluna, chapeu, onda, normal, base, t: 0 });

    // clarão global na tela + sirene ficam a cargo da UI (efeitos.js) que chama isto
  }

  // Estado da INSÍGNIA DOCADA (declarado aqui, ANTES do laço de animação, senão o
  // primeiro frame — que roda síncrono — acessaria a variável no TDZ e explodiria).
  let dadosDock = null;   // { code, lat, lng, tom, nome, status, rel, flag, lider, ... }
  let dockCodigo = null;  // qual país está no dock agora (evita redesenhar à toa)
  let insDock = null; let insSvg = null;

  (function anima() {
    const now = performance.now();
    for (const s of sats) {
      const a = s.fase + now * s.vel;
      s.mesh.position.set(Math.cos(a) * s.raio, Math.sin(a) * s.raio * Math.sin(s.incl), Math.sin(a) * s.raio * Math.cos(s.incl));
      s.mesh.rotation.y += 0.008;
      const pisca = s.mesh.getObjectByName('pisca');
      if (pisca) pisca.visible = Math.sin(now * 0.006) > 0;
    }
    for (let i = missoes.length - 1; i >= 0; i -= 1) {
      const m = missoes[i];
      m.t += m.vel;
      // ABATIDA no ar antes de chegar? A defesa do alvo interceptou.
      if (m.interceptaEm && m.t >= m.interceptaEm) {
        const pAbate = m.curva.getPointAt(Math.min(0.999, m.interceptaEm));
        interceptacaoNuclear(pAbate, m.alvo);
        m.aoInterceptar?.();
        orbitas.remove(m.mesh);
        if (m.traco) orbitas.remove(m.traco);
        missoes.splice(i, 1); continue;
      }
      if (m.t >= 1) {
        // chegou: quem carrega ogiva explode no alvo
        if (m.impacta && m.alvo) impacto(m.alvo);
        if (m.aoChegar) m.aoChegar();   // a ogiva detona aqui
        orbitas.remove(m.mesh);
        if (m.traco) orbitas.remove(m.traco);
        missoes.splice(i, 1); continue;
      }
      if (m.t < 0) continue;
      const pos = m.curva.getPointAt(Math.min(0.999, m.t));
      m.mesh.position.copy(pos);
      const olhar = m.curva.getPointAt(Math.min(0.999, m.t + 0.01));
      // A ordem importa: `up` ANTES do lookAt, senão o modelo rola pro lado.
      // Um navio precisa ficar SEMPRE com a quilha pra baixo — o `up` dele é a
      // normal da esfera, que é literalmente "onde fica o fundo do mar".
      m.mesh.up.copy(pos.clone().normalize());
      m.mesh.lookAt(olhar);
      // peças vivas: a chama pulsa, o radar varre, a hélice gira
      const chama = m.mesh.getObjectByName('chama');
      if (chama) chama.scale.z = 0.8 + Math.sin(now * 0.02) * 0.4;
      const radar = m.mesh.getObjectByName('radar');
      if (radar) radar.rotation.y += 0.06;
      const helice = m.mesh.getObjectByName('helice');
      if (helice) helice.rotation.z += 0.25;
      // a cauda do míssil é desenhada até onde ele já passou
      if (m.traco) {
        m.traco.geometry.setDrawRange(0, Math.max(2, Math.floor(m.t * 48)));
        m.traco.material.opacity = 0.9 * (1 - m.t * 0.5);
      }
    }
    for (let i = explosoes.length - 1; i >= 0; i -= 1) {
      const e = explosoes[i];
      e.t += 0.045;
      if (e.t >= 1) { orbitas.remove(e.mesh); explosoes.splice(i, 1); continue; }
      e.mesh.scale.setScalar(1 + e.t * 7);       // cresce
      e.mesh.material.opacity = 0.85 * (1 - e.t); // e desaparece
    }
    // ── DETONAÇÕES NUCLEARES (multi-fase, ~4s) ─────────────────────────
    for (let i = nukes.length - 1; i >= 0; i -= 1) {
      const k = nukes[i];
      k.t += 0.006;                 // ~4 segundos de horror em câmera
      if (k.t >= 1) { orbitas.remove(k.grupo); nukes.splice(i, 1); continue; }
      const t = k.t;
      // FLASH: estoura instantâneo (primeiros 8%) e apaga
      k.flash.scale.setScalar(1 + Math.min(t, 0.08) * 90);
      k.flash.material.opacity = t < 0.08 ? 1 : Math.max(0, 0.5 - (t - 0.08) * 6);
      // BOLA DE FOGO: cresce rápido e some
      k.fogo.scale.setScalar(1 + t * 14);
      k.fogo.material.opacity = Math.max(0, 0.95 - t * 1.3);
      // ONDA DE CHOQUE: anel que varre a superfície e se dissipa
      k.onda.scale.setScalar(1 + t * 60);
      k.onda.material.opacity = Math.max(0, 0.85 - t * 0.95);
      // COGUMELO: a coluna sobe e o chapéu incha depois do flash (a partir de ~12%)
      if (t > 0.12) {
        const u = (t - 0.12) / 0.88;
        k.coluna.material.opacity = Math.min(0.75, u * 1.2) * (1 - u * 0.5);
        k.coluna.scale.set(1 + u * 0.5, 1 + u * 2.2, 1 + u * 0.5);
        k.coluna.position.copy(k.base.clone().add(k.normal.clone().multiplyScalar(R * (0.04 + u * 0.06))));
        k.chapeu.material.opacity = Math.min(0.7, u * 1.1) * (1 - u * 0.4);
        k.chapeu.scale.setScalar(1 + u * 1.6);
        k.chapeu.position.copy(k.base.clone().add(k.normal.clone().multiplyScalar(R * (0.09 + u * 0.09))));
      }
    }
    // ── ONDAS DE RADAR (interceptação / pulsos) — abrem gigante e somem ──
    for (let i = ondas.length - 1; i >= 0; i -= 1) {
      const o = ondas[i];
      o.t += 0.022;
      if (o.t >= 1) { orbitas.remove(o.mesh); ondas.splice(i, 1); continue; }
      o.mesh.scale.setScalar(1 + o.t * o.max);
      o.mesh.material.opacity = 0.9 * (1 - o.t);
    }
    // a linha viva capital → dock acompanha a rotação do globo
    if (typeof posicionarConexao === 'function') posicionarConexao();
    // ── FROTAS EM TRÂNSITO ─────────────────────────────────────────────
    // Interpola por TEMPO a posição de cada frota navegando (minha e inimiga) e reposiciona
    // os pinos. Throttle ~22fps (mesma cadência de navegarFrota) pra não pesar. Quando uma
    // frota CHEGA, recomputa o mapa (detecção/avistamento mudam com a nova posição).
    if (jogo?.estado) {
      const agoraFr = Date.now();
      const todasFr = [...(jogo.estado.frotas || []), ...(jogo.estado.frotasInimigas || [])];
      const emMovimento = todasFr.some((f) => f.destino);
      if (emMovimento && agoraFr - ultimoTickFrota > 33) {   // ~30fps: suave, já que htmlTransitionDuration=0
        const chegaram = tickTransito(todasFr, agoraFr);
        for (const d of marcadores) if (d.frotaRef) { d.lat = d.frotaRef.lat; d.lng = d.frotaRef.lng; }
        globe.htmlElementsData(marcadores);
        ultimoTickFrota = agoraFr;
        if (chegaram.length) {
          // dispara o que ficou agendado pra CHEGADA (ex.: abrir ações navais no alvo)
          for (const fr of chegaram) {
            const cb = aoChegarFrota.get(fr.id || fr);
            if (cb) { aoChegarFrota.delete(fr.id || fr); try { cb(fr); } catch { /* nunca derruba o loop */ } }
          }
          atualizar();
        }
      }
    }
    requestAnimationFrame(anima);
  }());

  const ctrl = globe.controls();
  ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.22;
  ctrl.enableZoom = true; ctrl.minDistance = 170; ctrl.maxDistance = 520;
  // ROTAÇÃO como TOGGLE: antes o globo girava sozinho e não dava pra TRAVAR parado.
  // Agora um botão liga/desliga. Em modo "girar", pausa enquanto o mouse está em cima
  // (pra não brigar com quem está mirando); em modo "parado", fica travado de vez.
  let autoGiro = true;
  container.addEventListener('pointerenter', () => { if (autoGiro) ctrl.autoRotate = false; });
  container.addEventListener('pointerleave', () => { ctrl.autoRotate = autoGiro; });
  const btnGiro = document.createElement('button');
  btnGiro.className = 'globo-fab gc-giro';
  const pintarGiro = () => {
    btnGiro.innerHTML = `${ico(autoGiro ? 'pause' : 'play', 12)} <span>${autoGiro ? 'PARAR' : 'GIRAR'}</span>`;
    btnGiro.setAttribute('data-tip', autoGiro ? 'Travar o globo parado' : 'Voltar a girar o globo');
  };
  btnGiro.addEventListener('click', (e) => { e.stopPropagation(); autoGiro = !autoGiro; ctrl.autoRotate = autoGiro; pintarGiro(); });
  pintarGiro();
  container.appendChild(btnGiro);
  // SINO da central de alertas (histórico de notificações), logo acima do botão de girar.
  sinoNotif = document.createElement('button');
  sinoNotif.className = 'globo-fab gc-sino';
  sinoNotif.setAttribute('data-tip', 'Central de alertas — histórico dos avisos');
  sinoNotif.innerHTML = `${ico('bell', 13)}<i class="gn-num">0</i>`;
  sinoNotif.addEventListener('click', (e) => { e.stopPropagation(); abrirCentralNotif(); });
  container.appendChild(sinoNotif);
  atualizarSinoNotif();
  // CLIQUE NO VAZIO: o preto ao redor da esfera. O raio da globe.gl não acerta país,
  // estado nem mar, então onPolygonClick/onGlobeClick não disparam e a flag fica false
  // → desselecionamos aqui. Cliques na insígnia/dock/marcadores são poupados.
  container.addEventListener('click', (e) => {
    const noOverlay = e.target.closest?.('.ins-dock, .mm, .float-tooltip-kap, .globo-ctrl, .globo-fab, .notif-central, .mundo-vivo, .mapa-legenda');
    if (!cliqueNaEsfera && !noOverlay && selecionado && !teatro) limparSelecao();
    cliqueNaEsfera = false;
  });
  globe.pointOfView({ lat: 22, lng: -55, altitude: 2.3 }, 0);

  const resize = () => { globe.width(container.clientWidth); globe.height(container.clientHeight); };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(container);
  window.addEventListener('resize', resize);

  const ondeEsta = (code) => { const f = features.find((x) => iso(x) === code); return f ? centro(f) : null; };

  // ── TOOLTIP FLUTUANTE dos marcadores de conflito ────────────────────
  // Segue o mouse, some ao sair. Um só elemento reaproveitado (sem lixo no DOM).
  let tipEl = null;
  function mostrarTipMarcador(html) {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'gt-conflito';
      document.body.appendChild(tipEl);
      document.addEventListener('mousemove', moverTip);
    }
    tipEl.innerHTML = html;
    // O rover naval (fah-nav) é mais largo (268px) que o tooltip padrão (244px) — sem
    // isto ele transbordava a caixa (o bug do hover da frota). 'largo' alarga a caixa.
    tipEl.classList.toggle('largo', html.includes('fah-nav'));
    tipEl.style.display = 'block';
    // ENQUANTO o tip do marcador está aberto, o tooltip do polígono (rover do país/
    // estado) fica escondido — senão os dois se empilham (o bug dos "dois hovers").
    container.classList.add('marcador-hover');
  }
  function moverTip(ev) {
    if (!tipEl) return;
    const larg = tipEl.classList.contains('largo') ? 312 : 260;
    tipEl.style.left = `${Math.min(ev.clientX + 16, window.innerWidth - larg)}px`;
    tipEl.style.top = `${Math.min(ev.clientY + 16, window.innerHeight - 240)}px`;
  }
  function esconderTipMarcador() { if (tipEl) tipEl.style.display = 'none'; container.classList.remove('marcador-hover'); }

  // ── INSÍGNIA DOCADA — a janela de decidir vive NO LADO do globo ──────
  // O problema que isto mata: a insígnia pairava sobre o país, tapava os estados e o
  // DECIDIR caía no estado atrás. Agora a janela é DOCADA (posição fixa, fora da frente
  // do mapa) e uma linha viva a liga à capital — a linha é redesenhada por frame
  // conforme o globo gira (posicionarConexao). O estado (dadosDock/insDock/insSvg) foi
  // declarado lá em cima, antes do laço de animação.
  function montarDock() {
    if (insDock) return;
    insSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    insSvg.setAttribute('class', 'ins-conn');
    insSvg.innerHTML = '<line class="ins-conn-l"></line><circle class="ins-conn-o cap" r="4.5"></circle><circle class="ins-conn-pulso" r="4.5"></circle><circle class="ins-conn-o dock" r="3"></circle>';
    container.appendChild(insSvg);
    insDock = document.createElement('div');
    insDock.className = 'ins-dock';
    container.appendChild(insDock);
  }

  function atualizarDock() {
    if (!dadosDock) {
      dockCodigo = null;
      if (insDock) insDock.classList.remove('on');
      if (insSvg) insSvg.classList.remove('on');
      return;
    }
    montarDock();
    const k = dadosDock;
    const cor = { neutro: 'var(--cyan)', aliado: 'var(--verde)', hostil: 'var(--ambar)', ocupado: '#ff9628', guerra: 'var(--perigo)' }[k.tom] || 'var(--cyan)';
    insSvg.classList.add('on');
    insSvg.style.setProperty('--ins-c', cor);   // a linha herda a cor do status
    insDock.className = `ins-dock on tom-${k.tom}`;
    // só re-renderiza o conteúdo quando MUDA o país (senão mata a animação de digitar)
    if (dockCodigo !== k.code) {
      dockCodigo = k.code;
      insDock.innerHTML = k.self
        ? `<div class="ins-cab">
            ${k.flag ? `<img class="ins-flag" src="${k.flag}" alt="">` : ''}
            <div class="ins-id"><b>${esc(k.nome)}</b><span class="ins-st">${esc(k.status)}</span></div>
          </div>
          <div class="ins-meta">${k.capital ? `<span>${ico('map-pin', 9)} ${esc(k.capital)}</span>` : ''}<span>${ico('users', 9)} ${(k.reserva || 0).toLocaleString('pt-BR')} em reserva</span></div>
          <button class="ins-go" type="button">${ico('network', 12)} <span class="ins-go-txt">DISTRIBUIR TROPAS</span></button>
          <button class="ins-go ins-governar" type="button">${ico('landmark', 12)} <span>GOVERNAR</span></button>`
        : `<div class="ins-cab">
            ${k.flag ? `<img class="ins-flag" src="${k.flag}" alt="">` : ''}
            <div class="ins-id"><b>${esc(k.nome)}</b><span class="ins-st">${esc(k.status)}${Number.isFinite(k.rel) ? ` · ${k.rel}` : ''}</span></div>
          </div>
          ${k.lider ? `<div class="ins-lider">${ico('crown', 10)} <b>${esc(k.lider)}</b>${k.arquetipo ? ` <i class="ins-arq">${esc(k.arquetipo)}</i>` : ''}</div>` : ''}
          ${(k.capital || k.pib) ? `<div class="ins-meta">${k.capital ? `<span>${ico('map-pin', 9)} ${esc(k.capital)}</span>` : ''}${k.pib ? `<span>${ico('circle-dollar-sign', 9)} ${k.pib} tri</span>` : ''}</div>` : ''}
          <button class="ins-go" type="button">${ico('gavel', 12)} <span class="ins-go-txt">DECIDIR</span></button>`;
      const btn = insDock.querySelector('.ins-go');
      const txt = insDock.querySelector('.ins-go-txt');
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (btn.dataset.abrindo) return;
        btn.dataset.abrindo = '1';
        insDock.classList.add('abrindo');
        const alvo = features.find((f) => iso(f) === k.code);
        const frase = k.self ? 'ABRINDO COMANDO…' : 'ABRINDO CANAL…';
        const rot = k.self ? 'DISTRIBUIR TROPAS' : 'DECIDIR';
        // O texto se digita como enfeite (pode engasgar numa aba de fundo, tudo bem).
        let i = 0;
        const timer = setInterval(() => { i += 1; txt.textContent = frase.slice(0, i); if (i >= frase.length) clearInterval(timer); }, 32);
        // A AÇÃO dispara num timeout ÚNICO — confiável mesmo se o interval for
        // estrangulado (antes ela só rodava DEPOIS de digitar tudo, e travava).
        setTimeout(() => {
          clearInterval(timer);
          if (k.self) onDistribuir?.(); else if (alvo) onPaisClick(alvo);
          btn.dataset.abrindo = ''; insDock.classList.remove('abrindo'); txt.textContent = rot;
        }, 520);
      });
      // GOVERNAR — só na SUA nação: abre o gabinete civil (impostos, leis, panorama).
      // Guerra fica no DISTRIBUIR acima; aqui é governo. onFim re-renderiza o dock.
      insDock.querySelector('.ins-governar')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        abrirGovernanca(jogo, { onFim: () => { dockCodigo = null; atualizarDock(); } });
      });
    }
    posicionarConexao();   // posição inicial já correta (o rAF só mantém viva depois)
  }

  // Desenha a linha capital → dock, por frame. Se a capital estiver na FACE OCULTA do
  // globo (atrás), esconde a linha (ela cruzaria o planeta), mas mantém o dock.
  const _v = new THREE.Vector3(); const _s = new THREE.Vector3();
  function posicionarConexao() {
    if (!dadosDock || !insSvg || !insDock || !insDock.classList.contains('on')) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width) return;
    insSvg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    insSvg.setAttribute('width', rect.width); insSvg.setAttribute('height', rect.height);

    const cam = globe.camera();
    const cc = globe.getCoords(dadosDock.lat, dadosDock.lng, 0.012);
    _v.set(cc.x, cc.y, cc.z);
    const surf = globe.getCoords(dadosDock.lat, dadosDock.lng, 0);
    _s.set(surf.x, surf.y, surf.z);
    // face oculta? normal da superfície vs. direção pra câmera
    const frente = _s.clone().normalize().dot(cam.position.clone().sub(_s).normalize()) > 0.02;

    _v.project(cam);
    const sx = (_v.x * 0.5 + 0.5) * rect.width;
    const sy = (-_v.y * 0.5 + 0.5) * rect.height;
    // âncora do dock: borda esquerda, centro vertical
    const dr = insDock.getBoundingClientRect();
    const dx = dr.left - rect.left;
    const dy = dr.top - rect.top + dr.height / 2;

    const linha = insSvg.querySelector('.ins-conn-l');
    const cap = insSvg.querySelector('.ins-conn-o.cap');
    const pulso = insSvg.querySelector('.ins-conn-pulso');
    const doc = insSvg.querySelector('.ins-conn-o.dock');
    linha.setAttribute('x1', sx); linha.setAttribute('y1', sy);
    linha.setAttribute('x2', dx); linha.setAttribute('y2', dy);
    cap.setAttribute('cx', sx); cap.setAttribute('cy', sy);
    pulso.setAttribute('cx', sx); pulso.setAttribute('cy', sy);
    doc.setAttribute('cx', dx); doc.setAttribute('cy', dy);
    insSvg.classList.toggle('atras', !frente);
  }

  // ── LINHA DE AÇÃO: traça do seu país até o alvo ────────────────────
  const CORES_LINHA = { foco: '#35e0ff', ataque: '#ff3b5c', comercio: '#22e0a0', espionagem: '#b98cff', venda: '#ffb020' };
  function desenharLinha(alvo, tipo = 'foco', duracao = 5200, origem = null) {
    const eu = origem || ondeEsta(jogadorIso());
    const c = alvo?.properties ? centro(alvo) : alvo;
    if (!eu || !c || (c.lat === eu.lat && c.lng === eu.lng)) return;
    const cor = CORES_LINHA[tipo] || CORES_LINHA.foco;
    const arco = { startLat: eu.lat, startLng: eu.lng, endLat: c.lat, endLng: c.lng, cor: [cor, `${cor}00`], vel: tipo === 'ataque' ? 900 : 2200 };
    arcos = [...arcos, arco];
    pintarArcos();
    setTimeout(() => { arcos = arcos.filter((a) => a !== arco); pintarArcos(); }, duracao);
  }

  function atualizar() {
    // Os polígonos têm dois donos possíveis (países ou estados) — quem decide é
    // pintarCamada(). Repintar com as cores de PAÍS aqui apagaria os estados na
    // primeira atualização de HUD depois de ligar o tático. Os marcadores, radares
    // e arcos abaixo valem nos DOIS modos e seguem normalmente.
    pintarCamada();

    const focos = [];
    const novos = [];
    const meuFlag = bandeira(ISO2_DE[jogadorIso()] || 'us', 40);

    const eu = ondeEsta(jogadorIso());
    if (eu) novos.push({ ...eu, tipo: 'capital', svg: ico('star', 12), flag: meuFlag, titulo: `${jogo.ficha.pais} — sua nação` });

    // MODO ALERTA (temporário): aliados do alvo de um ataque em curso. Âmbar,
    // médio, urgente — o mundo observando de arma engatilhada.
    for (const a of alertasTemp) {
      const c = ondeEsta(a.iso); if (!c) continue;
      focos.push({ ...c, cor: 'rgba(255,176,32,', raio: 6, vel: 2.2, periodo: 750, forca: 0.85 });
      novos.push({ ...c, tipo: 'alerta', svg: ico('siren', 12), flag: bandeira(ISO2_DE[a.iso], 40), rot: 'ALERTA', titulo: `${PAISES[a.iso]?.nome || a.iso} — em alerta máximo` });
    }

    // ZONAS RADIOATIVAS: onde uma ogiva caiu. Verde-nuclear pulsando, permanente —
    // uma cicatriz que não sara. É o registro visual de que você cruzou A linha.
    for (const code of jogo.estado.zonasRadioativas || []) {
      const c = ondeEsta(code); if (!c) continue;
      focos.push({ ...c, cor: 'rgba(120,230,90,', raio: 8, vel: 1.4, periodo: 900, forca: 0.9 });
      novos.push({ ...c, tipo: 'radioativa', svg: ico('radiation', 13), rot: 'ZONA MORTA',
        titulo: `${PAISES[code]?.nome || code} — devastado por arma nuclear`,
        tip: `<b>${esc(PAISES[code]?.nome || code)}</b><span class="gtc-sub">ZONA RADIOATIVA</span><p>Devastado por detonação nuclear. Inabitável por gerações. Ninguém ocupa, ninguém reconstrói, ninguém esquece.</p>` });
    }

    // GUERRA ATIVA: radar vermelho, largo e agressivo. Duas ondas (uma lenta, uma
    // rápida) pra dar a sensação de varredura de radar. Fica enquanto durar o conflito.
    for (const code of jogo.estado.emGuerra || []) {
      const c = ondeEsta(code); if (!c) continue;
      focos.push({ ...c, cor: 'rgba(255,59,92,', raio: 14, vel: 3.4, periodo: 460, forca: 1 });
      focos.push({ ...c, cor: 'rgba(255,120,60,', raio: 9, vel: 1.7, periodo: 900, forca: 0.7 });
      novos.push({ ...c, tipo: 'guerra', svg: ico('swords', 13), flag: bandeira(ISO2_DE[code], 40), rot: 'GUERRA',
        titulo: `Conflito — ${PAISES[code]?.nome || code}`,
        tip: `<b>${esc(PAISES[code]?.nome || code)}</b><span class="gtc-sub gtc-guerra">EM GUERRA COM VOCÊ</span><p>Conflito aberto e ativo. Suas ofensivas partem contra este território, e a insurgência dele mira o seu.</p>` });
    }
    // OCUPAÇÃO: radar laranja, mais lento. A intensidade acompanha a insurgência —
    // território calmo pulsa devagar; território fervendo pisca feito alarme.
    for (const oc of jogo.estado.conquistados || []) {
      const c = ondeEsta(oc.iso); if (!c) continue;
      const critico = oc.insurgencia >= 60;
      focos.push({
        ...c, cor: critico ? 'rgba(255,59,92,' : 'rgba(255,150,40,',
        raio: critico ? 8 : 5.5, vel: critico ? 2.8 : 1.5,
        periodo: critico ? 600 : 1300, forca: 0.55 + (oc.insurgencia / 100) * 0.45,
      });
      novos.push({ ...c, tipo: critico ? 'revolta' : 'ocupado', svg: ico(critico ? 'triangle-alert' : 'flag', 12),
        flag: bandeira(ISO2_DE[oc.iso], 40), rot: `${oc.insurgencia}%`, titulo: `${oc.nome} · insurgência ${oc.insurgencia}%`,
        tip: `<b>${esc(oc.nome)}</b><span class="gtc-sub ${critico ? 'gtc-guerra' : ''}">TERRITÓRIO OCUPADO</span><p>Sob sua bandeira, mas ${critico ? '<b>em pé de revolta</b>' : 'ainda inquieto'}. Insurgência em <b>${oc.insurgencia}%</b> — acima de 60% o território pode se levantar e você perde o controle.</p><div class="gtc-barra"><i style="width:${oc.insurgencia}%"></i></div>` });
    }
    if (eu) {
      const f = jogo.estado.forcas || {};
      const navios = (f.navios || 0) + (f.porta_avioes || 0);
      if (navios) novos.push({ lat: eu.lat - 11, lng: eu.lng - 26, tipo: 'frota', svg: ico('ship', 12), rot: `${navios}`, titulo: 'Frota em patrulha',
        tip: `<b>Sua Marinha</b><span class="gtc-sub">FROTA EM PATRULHA</span><p><b>${navios.toLocaleString('pt-BR')}</b> embarcações no mar — ${(f.navios || 0).toLocaleString('pt-BR')} navios de guerra e ${(f.porta_avioes || 0)} porta-aviões. É o que projeta o seu poder longe de casa.</p>` });
      if (f.cacas) novos.push({ lat: eu.lat + 11, lng: eu.lng + 16, tipo: 'aereo', svg: ico('plane', 12), rot: `${f.cacas}`, titulo: 'Força aérea',
        tip: `<b>Sua Força Aérea</b><span class="gtc-sub">CAÇAS DE PRONTIDÃO</span><p><b>${f.cacas.toLocaleString('pt-BR')}</b> caças prontos para decolar. Quem domina o céu decide a guerra moderna.</p>` });
      if (jogo.estado.ogivas) novos.push({ lat: eu.lat + 4, lng: eu.lng - 12, tipo: 'nuke', svg: ico('radiation', 12), rot: `${jogo.estado.ogivas}`, titulo: 'Arsenal nuclear',
        tip: `<b>Seu Arsenal Nuclear</b><span class="gtc-sub gtc-guerra">${jogo.estado.ogivas} OGIVA(S) PRONTA(S)</span><p>Bombas nucleares prontas para lançamento. A arma que redesenha o mapa — e o tabu que ninguém quer ser o primeiro a quebrar. Clique num país inimigo para mirar.</p>` });
    }
    // AS BASES: projeção de poder tem de ser visível. Cada instalação é um
    // ponto no mapa de onde o próximo ataque pode sair.
    for (const b of jogo.estado.bases || []) {
      novos.push({
        lat: b.lat, lng: b.lng, tipo: 'base',
        svg: ico(TIPOS_BASE[b.tipo]?.ic || 'tent', 12),
        flag: bandeira(ISO2_DE[b.iso], 40), rot: 'BASE',
        titulo: `${b.nome} — ${TIPOS_BASE[b.tipo]?.nome || 'Instalação'} em ${b.paisNome}`,
      });
    }

    // ── FROTAS POSICIONADAS: cada uma é um PIN de radar no mar ─────────
    // Antes a frota só existia como o objeto 3D que voava até lá e sumia. Agora ela
    // FICA no mapa como um pino que diz o tipo (porta-avião, navio, submarino) e, no
    // hover, a composição. O anel de radar sob o pino é o "ponto estranho" que o
    // adversário detecta no online se tiver inteligência (ver docs/ONLINE.md).
    const ICO_NAVAL = { porta_avioes: 'anchor', navios: 'ship', submarinos: 'waves', bombardeiros: 'plane', cacas: 'plane', drones: 'radar' };
    const NOME_NAVAL = { porta_avioes: 'Porta-aviões', navios: 'Navio de Guerra', submarinos: 'Submarino', bombardeiros: 'Bombardeiro', cacas: 'Caça', drones: 'Drone' };
    const DOM_AR = new Set(['bombardeiros', 'cacas', 'drones']);
    const meuIsoFr = jogo.estado.iso || 'USA';
    const ORDEM_DOM = ['porta_avioes', 'navios', 'submarinos', 'bombardeiros', 'cacas', 'drones'];
    for (const fr of jogo.estado.frotas || []) {
      const u = fr.unidades || {};
      const presentes = ORDEM_DOM.filter((k) => u[k] > 0);
      const dom = presentes[0] || 'navios';
      const total = presentes.reduce((s, k) => s + (u[k] || 0), 0);
      const tech = techDaFrota(u);
      // furtiva só se TODA a força for de submarino (nada de superfície nem aéreo entrega)
      const soSub = presentes.length === 1 && presentes[0] === 'submarinos';
      const eq = equipamentosDoPais(meuIsoFr)?.[dom];
      const foto = eq?.foto || FOTO_UNIDADE[dom];
      const nomeReal = eq?.nome || NOME_NAVAL[dom];
      const linhas = presentes.map((k) => `${u[k]} × ${NOME_NAVAL[k]}`).join(' · ');
      const badgeDom = DOM_AR.has(dom) && !u.porta_avioes ? 'AR' : 'MAR';
      const forcaPin = poderNaval(fr);   // poder naval legível (índice) — mesma escala do inimigo
      // AVISTAMENTO: submarino puro é sempre indetectado; senão, contrasta com o radar
      // do vizinho mais próximo.
      const av = soSub ? null : avistamentoDe(fr, tech);
      const avLinha = av
        ? `<div class="fah-avistado ${av.hostil ? 'hostil' : ''}">${ico('eye', 10)} AVISTADA por <b>${esc(av.nome)}</b> a ${av.d.toFixed(0)}°</div>`
        : `<div class="fah-avistado oculta">${ico('eye-off', 10)} NÃO DETECTADA — furtividade ${tech.furtividade} supera o radar próximo</div>`;
      // ROVER RICO (igual à ficha de Forças Armadas): foto + grade de tech. Sem o "?".
      const rover = `<div class="fah-nav">
        <div class="fah-foto">${foto ? `<img src="${foto}" alt="" onerror="this.parentElement.innerHTML='${ico(ICO_NAVAL[dom], 22)}'">` : ico(ICO_NAVAL[dom], 22)}<span class="fah-dom">${badgeDom}</span></div>
        <div class="fah-corpo">
          <div class="fah-nome">${esc(nomeReal)}</div>
          <div class="fah-fab">${esc(linhas || 'força naval')}</div>
          <div class="fah-grade">
            <span class="destaq"><i>Força</i><b>${forcaPin}</b></span>
            <span><i>Presença</i><b>${fr.presenca}</b></span>
            <span><i>Alcance</i><b>${tech.alcance}°</b></span>
            <span><i>Detecção</i><b>${tech.deteccao}°</b></span>
            <span class="${soSub ? 'furtivo' : ''}"><i>Furtividade</i><b>${tech.furtividade}${soSub ? ' 🥷' : ''}</b></span>
          </div>
          ${avLinha}
          <div class="fah-cta">${ico('move', 10)} arraste para reposicionar · clique para agir</div>
        </div></div>`;
      // Reusa o MESMO objeto por frota (pool) — não recria o pino, o hover sobrevive.
      const d = poolFrota.get(fr) || {};
      if (!poolFrota.has(fr)) poolFrota.set(fr, d);
      Object.assign(d, {
        lat: fr.lat, lng: fr.lng, tipo: 'frota-pos', foto, svg: ico(ICO_NAVAL[dom], 12), rot: `${total}`,
        semInfo: true, frotaRef: fr, frotaTech: tech, frotaSoSub: soSub,
        avistada: !!av, avistadaHostil: !!(av && av.hostil),
        titulo: `${nomeReal} · presença ${fr.presenca}`,
        tip: rover,
      });
      novos.push(d);
      // O radar sob o pino cresce com o PODER da frota (mais veículos = varredura maior);
      // só não pisca se for furtiva — submarino não aparece no mapa de ninguém.
      // Radar do mar DISCRETO: raio base 2 (era 3), bônus até 2.5 (era 4), força fixa ~0.4 —
      // o pulso no globo estava grande demais pra um pino de frota.
      if (!soSub) focos.push({ lat: fr.lat, lng: fr.lng, cor: 'rgba(143,180,255,', raio: 2 + Math.min(2.5, total * 0.3), vel: 1.4, periodo: 1200, forca: 0.4 });
    }

    // ── FROTAS INIMIGAS DETECTADAS ──────────────────────────────────
    // Só há o que caçar no mar se houver caça: semeamos patrulhas dos rivais quando você já
    // tem esquadra flutuando, e mostramos SÓ as que o seu radar alcança agora (o resto é
    // oceano vazio — a névoa de guerra do mar). Clicar numa engaja o combate frota × frota.
    if ((jogo.estado.frotas || []).length) {
      semearFrotasInimigas(jogo.estado, ondeEsta);
      const inimigasTodas = jogo.estado.frotasInimigas || [];
      const detectadas = frotasDetectadas(jogo.estado.frotas || [], inimigasTodas);
      const jaVis = new Set(detectadas.map((d) => d.frota.id));
      // ESPIONAGEM NAVAL: frotas de um país que você grampeou (intel 'naval') aparecem no
      // seu mapa MESMO fora do radar — o vazamento entrega os movimentos deles.
      const viaIntel = inimigasTodas.filter((fi) => !jaVis.has(fi.id) && temIntel(jogo.estado, fi.code, 'naval')).map((fi) => ({ frota: fi, distancia: distGraus((jogo.estado.frotas || [])[0] || fi, fi), viaIntel: true }));
      const inimigasVis = [...detectadas, ...viaIntel];
      for (const { frota: fi, distancia } of inimigasVis) {
        const u = fi.unidades || {};
        const presentes = ORDEM_DOM.filter((k) => u[k] > 0);
        const domI = presentes[0] || 'navios';
        const totalI = presentes.reduce((s, k) => s + (u[k] || 0), 0);
        const techI = techDaFrota(u);
        const eqI = equipamentosDoPais(fi.code)?.[domI];
        const fotoI = eqI?.foto || FOTO_UNIDADE[domI];
        const nomeI = PAISES[fi.code]?.nome ? `Frota de ${PAISES[fi.code].nome}` : (eqI?.nome || NOME_NAVAL[domI]);
        const linhasI = presentes.map((k) => `${u[k]} × ${NOME_NAVAL[k]}`).join(' · ');
        const forcaI = poderNaval(fi);
        const roverI = `<div class="fah-nav inimiga">
          <div class="fah-foto">${fotoI ? `<img src="${fotoI}" alt="" onerror="this.parentElement.innerHTML='${ico(ICO_NAVAL[domI], 22)}'">` : ico(ICO_NAVAL[domI], 22)}<span class="fah-dom hostil">HOSTIL</span></div>
          <div class="fah-corpo">
            <div class="fah-nome">${esc(nomeI)}</div>
            <div class="fah-fab">${esc(linhasI || 'força naval')}</div>
            <div class="fah-grade">
              <span class="destaq"><i>Força</i><b>${forcaI}</b></span>
              <span><i>Distância</i><b>${distancia.toFixed(0)}°</b></span>
              <span><i>Alcance</i><b>${techI.alcance}°</b></span>
              <span><i>Detecção</i><b>${techI.deteccao}°</b></span>
            </div>
            <div class="fah-avistado hostil">${ico('crosshair', 10)} FROTA INIMIGA · clique para ENGAJAR</div>
          </div></div>`;
        const di = poolInimiga.get(fi) || {};
        if (!poolInimiga.has(fi)) poolInimiga.set(fi, di);
        Object.assign(di, {
          lat: fi.lat, lng: fi.lng, tipo: 'frota-inimiga', foto: fotoI, svg: ico(ICO_NAVAL[domI], 12), rot: `${totalI}`,
          semInfo: true, frotaInimigaRef: fi, avistada: true, avistadaHostil: true,
          titulo: `${nomeI} · força ${forcaI}`, tip: roverI,
        });
        novos.push(di);
        focos.push({ lat: fi.lat, lng: fi.lng, cor: 'rgba(255,59,92,', raio: 2 + Math.min(2.5, totalI * 0.3), vel: 1.5, periodo: 1100, forca: 0.4 });
      }
    }

    // ── INSÍGNIA DOCADA ─────────────────────────────────────────────
    // A porta pras ações do país inteiro. ANTES ela pairava sobre o país e o DECIDIR
    // caía no estado atrás. AGORA a janela vive DOCADA no lado do globo (fora da frente
    // do mapa) e uma linha VIVA a liga à capital — o desenho é feito por frame em
    // posicionarConexao(). Aqui só montamos os DADOS; quem pinta é atualizarDock().
    if (selecionado && !souEu(selecionado)) {
      // A linha sai da CAPITAL de verdade (não do centroide do país). A capital vem da
      // base de cidades (flag capitalPais); sem ela, cai no centro do país como reserva.
      const cap = (cidadesLista || []).find((x) => x.pais === selecionado && x.capitalPais);
      const c = cap || ondeEsta(selecionado);
      if (c) {
        const info = PAISES[selecionado];
        const rel = info ? Number(jogo.estado[info.rel] ?? 0) : 0;
        const nome = info?.nome || selecionado;
        const cartao = cartaoDe(selecionado);
        const lider = liderDe(selecionado, nome);
        const emGuerra = (jogo.estado.emGuerra || []).includes(selecionado);
        const oc = ocupacaoDe(jogo.estado, selecionado);
        const tom = emGuerra ? 'guerra' : oc ? 'ocupado' : rel >= 30 ? 'aliado' : rel <= -30 ? 'hostil' : 'neutro';
        const statusTxt = emGuerra ? 'EM GUERRA' : oc ? 'SOB OCUPAÇÃO' : rel >= 30 ? 'ALIADO' : rel <= -30 ? 'HOSTIL' : 'NEUTRO';
        dadosDock = {
          code: selecionado, lat: c.lat, lng: c.lng,
          tom, nome, status: statusTxt, rel,
          flag: bandeira(ISO2_DE[selecionado], 80),
          lider: lider?.nome || null,
          arquetipo: lider?.arquetipo?.nome || null,
          capital: cartao?.capital || null,
          pib: cartao?.pib || null,
          emGuerra,
        };
      } else dadosDock = null;
    } else if (selecionado && souEu(selecionado)) {
      // A SUA nação também ganha dock — mas a ação é COMANDAR: distribuir tropas pelos
      // estados sem ter que fazer estado por estado na mão.
      const cap = (cidadesLista || []).find((x) => x.pais === selecionado && x.capitalPais);
      const c = cap || ondeEsta(selecionado);
      if (c) {
        const livre = tropaLivre(jogo.estado);
        const reserva = Object.entries(livre).reduce((t, [u, q]) => t + (u === 'ogivas' ? 0 : (q || 0)), 0);
        dadosDock = {
          code: selecionado, lat: c.lat, lng: c.lng, self: true, tom: 'eu',
          nome: jogo.ficha.pais, status: 'SUA NAÇÃO', reserva,
          flag: bandeira(ISO2_DE[selecionado], 80),
          capital: cap?.nome || null,
        };
      } else dadosDock = null;
    } else dadosDock = null;
    atualizarDock();

    for (const [code, info] of Object.entries(PAISES)) {
      const rel = Number(jogo.estado[info.rel] ?? 0);
      if (rel > -55) continue;
      const c = ondeEsta(code); if (!c) continue;
      novos.push({ ...c, tipo: 'tensao', svg: ico('zap', 12), flag: bandeira(ISO2_DE[code], 40), rot: `${rel}`, titulo: `${info.nome} — relação ${rel}`,
        tip: `<b>${esc(info.nome)}</b><span class="gtc-sub ${rel <= -75 ? 'gtc-guerra' : ''}">RELAÇÃO ${rel} / 100</span><p>${rel <= -75 ? 'À beira do confronto. Uma provocação e vira guerra.' : 'Relação hostil. Diplomacia aqui está por um fio.'} Quanto mais negativa, maior a chance de ataque, sabotagem e traição.</p>` });
      // Tensão diplomática grave: radar âmbar, lento e discreto — é aviso, não guerra.
      if (rel <= -75) focos.push({ ...c, cor: 'rgba(255,176,32,', raio: 4, vel: 1.1, periodo: 1800, forca: 0.5 });
    }

    // ── BADGES DE DOMÍNIO ───────────────────────────────────────────
    // Cada país FECHADO que guarda territórios disputados meus vira um selo:
    // "⚑ 13 dominados" / "⚔ 2 em conflito". Clicar no selo abre os estados daquele
    // país. É o que substitui o antigo "todo país aberto pra sempre" — o resumo fica
    // sempre visível, os 27 polígonos só aparecem sob demanda.
    {
      const abertosAgora = paisesAbertos();
      const resumo = resumoDominios(jogo.estado);   // vazio → o laço não faz nada
      for (const [code, ag] of Object.entries(resumo)) {
        if (abertosAgora.has(code)) continue;               // aberto já mostra os estados
        if (!(ag.dominados || ag.perdidos || ag.conflito)) continue;
        const c = ondeEsta(code); if (!c) continue;
        const nome = PAISES[code]?.nome || code;
        const emConflito = ag.conflito > 0;
        const souDono = ag.dominados > 0 && ag.perdidos === 0;
        const tipoBadge = emConflito ? 'dominio-war' : souDono ? 'dominio-meu' : 'dominio-perda';
        const rot = emConflito ? `${ag.conflito}` : souDono ? `${ag.dominados}` : `${ag.perdidos}`;
        const linhas = [];
        if (ag.dominados) linhas.push(`<span class="gtc-dom ok">${ico('flag', 10)} <b>${ag.dominados}</b> sob seu controle</span>`);
        if (ag.perdidos) linhas.push(`<span class="gtc-dom bad">${ico('flag-off', 10)} <b>${ag.perdidos}</b> território(s) seu(s) tomado(s)</span>`);
        if (ag.conflito) linhas.push(`<span class="gtc-dom war">${ico('swords', 10)} <b>${ag.conflito}</b> em conflito AGORA</span>`);
        novos.push({
          ...c, tipo: tipoBadge, abrirPais: code,
          svg: ico(emConflito ? 'swords' : souDono ? 'flag' : 'flag-off', 12),
          rot, flag: bandeira(ISO2_DE[code], 40),
          titulo: `${nome} — clique para abrir os territórios`,
          tip: `<div class="gtc-cab"><img src="${bandeira(ISO2_DE[code], 40) || ''}" onerror="this.style.display='none'"><b>${esc(nome)}</b></div>
            <span class="gtc-sub ${emConflito ? 'gtc-guerra' : ''}">${emConflito ? 'TERRITÓRIO EM DISPUTA' : 'TERRITÓRIO OCUPADO'}</span>
            ${linhas.join('')}
            <span class="gtc-cta">${ico('mouse-pointer-click', 9)} clique para abrir os estados</span>`,
        });
        if (emConflito) {
          focos.push({ ...c, cor: 'rgba(255,80,60,', raio: 8, vel: 2.4, periodo: 700, forca: 0.85 });
          focos.push({ ...c, cor: 'rgba(255,150,60,', raio: 5, vel: 1.4, periodo: 1100, forca: 0.6 });
        }
      }
    }

    marcadores = novos;
    // ringsData/htmlElementsData são setados LÁ EMBAIXO, depois que o Mundo Vivo
    // (guerras NPC, pandemias) também empurra seus radares e marcadores — senão
    // esses focos entram tarde demais e o radar da guerra alheia fica fraco.
    // ── MUNDO VIVO NO MAPA ────────────────────────────────────────
    // Guerras entre NPCs: arco vermelho PERSISTENTE ligando os dois + radar em ambos.
    // O jogador olha pro globo e VÊ onde o mundo está pegando fogo sem clicar em nada.
    arcosMundo = [];
    for (const c of jogo.estado.conflitosNPC || []) {
      const pa = ondeEsta(c.a); const pb = ondeEsta(c.b);
      if (!pa || !pb) continue;
      const forca = 0.4 + (c.intensidade / 100) * 0.6;
      arcosMundo.push({
        startLat: pa.lat, startLng: pa.lng, endLat: pb.lat, endLng: pb.lng,
        cor: ['rgba(255,59,92,.75)', 'rgba(255,120,60,.15)'], vel: 1600,
      });
      for (const ponta of [pa, pb]) {
        focos.push({ ...ponta, cor: 'rgba(255,59,92,', raio: 12, vel: 3, periodo: 560, forca });
        focos.push({ ...ponta, cor: 'rgba(255,140,60,', raio: 7.5, vel: 1.6, periodo: 1000, forca: forca * 0.7 });
      }
      // um marcador só, no meio do arco, nomeando o conflito — com HOVER RICO
      const na = PAISES[c.a]?.nome || c.a; const nb = PAISES[c.b]?.nome || c.b;
      const nivel = c.intensidade >= 70 ? 'total' : c.intensidade >= 40 ? 'intensa' : 'de baixa escala';
      novos.push({
        lat: (pa.lat + pb.lat) / 2, lng: (pa.lng + pb.lng) / 2, tipo: 'guerra_npc',
        svg: ico('swords', 12), rot: `${(na).slice(0, 3).toUpperCase()}×${(nb).slice(0, 3).toUpperCase()}`,
        titulo: `Guerra: ${na} × ${nb} — ${c.tema}`,
        intervir: { tipo: 'conflito', a: c.a, b: c.b, nomeA: na, nomeB: nb, tema: c.tema, intensidade: c.intensidade, ref: c },
        tip: `<div class="gtc-cab"><img src="${bandeira(ISO2_DE[c.a], 40) || ''}" onerror="this.style.display='none'"><b>${esc(na)}</b><span class="gtc-vs">×</span><b>${esc(nb)}</b><img src="${bandeira(ISO2_DE[c.b], 40) || ''}" onerror="this.style.display='none'"></div>
          <span class="gtc-sub gtc-guerra">GUERRA ${nivel.toUpperCase()}</span>
          <p>Disputa por <b>${esc(c.tema)}</b>. Intensidade ${Math.round(c.intensidade)}/100 · há ${c.turnos || 0} turno(s).</p>
          <div class="gtc-barra"><i style="width:${Math.round(c.intensidade)}%"></i></div>
          <span class="gtc-cta">${ico('mouse-pointer-click', 9)} clique para intervir</span>`,
      });
    }

    // Pandemias: anel roxo lento e largo — a ameaça que se espalha em silêncio.
    for (const pd of jogo.estado.pandemias || []) {
      const presurto = pd.fase === 'presurto';
      const g = Math.round(pd.gravidade || 0);
      for (const code of (pd.paises || [])) {
        const c = ondeEsta(code); if (!c) continue;
        focos.push({ ...c, cor: 'rgba(185,140,255,', raio: 6 + g / 12, vel: presurto ? 2.2 : 1.1, periodo: 1500, forca: 0.35 + g / 130 });
      }
      const origem = ondeEsta(pd.origem);
      if (origem) {
        const difCor = g >= 70 ? '#ff3b5c' : g >= 45 ? '#ff8c3c' : g >= 20 ? '#ffb020' : '#22e0a0';
        novos.push({
          ...origem, tipo: presurto ? 'pandemia presurto' : 'pandemia', svg: ico(presurto ? 'help-circle' : 'biohazard', 12),
          rot: presurto ? '?' : `${(pd.paises || []).length}`,
          titulo: presurto ? 'Sinal não confirmado — clique para investigar' : `${pd.nome} (${pd.tipo}) — ${(pd.paises || []).length} países · fase ${pd.fase}`,
          intervir: { tipo: 'pandemia', ref: pd },
          tip: presurto
            ? `<b>SINAL NÃO CONFIRMADO</b><span class="gtc-sub" style="border-color:#b98cff;color:#b98cff">RUMOR</span><p>Boatos circulando no X sobre algo estranho nesta região. Ainda não é oficial — agir agora é MUITO mais barato.</p><span class="gtc-cta">${ico('mouse-pointer-click', 9)} clique para investigar</span>`
            : `<b>${esc(pd.nome)}</b><span class="gtc-sub" style="border-color:${difCor};color:${difCor}">${esc((pd.fase || '').toUpperCase())} · GRAVIDADE ${g}</span><div class="gtc-barra"><i style="width:${g}%;background:linear-gradient(90deg,var(--ambar),var(--perigo))"></i></div><p>${(pd.paises || []).length} país(es) · ${(pd.mortos || 0).toLocaleString('pt-BR')} mortos · cura ${Math.round(pd.curaAcumulada || 0)}%</p><span class="gtc-cta">${ico('mouse-pointer-click', 9)} clique para agir</span>`,
        });
      }
    }

    // Agora sim: com TODOS os radares e marcadores empilhados (inclusive Mundo Vivo),
    // manda pro globo de uma vez.
    globe.ringsData(focos);
    globe.htmlElementsData(marcadores);
    montarSatelites(Math.min(4, Math.floor((jogo.estado.inteligencia || 0) / 25)));
    pintarArcos();
    dispararToastsGlobo();
  }

  // ── TOASTS DE TERRITÓRIO ────────────────────────────────────────────
  // O alarme na área do globo: a Máquina tentou retomar um estado seu (ou conseguiu).
  // O motor enfileira em estado._toastsGlobo a cada turno; aqui esvaziamos a fila,
  // mostramos um card por evento e ele some sozinho. Clicar leva ao território.
  let toastLayer = null;
  const TOASTS_VISIVEIS = 3;   // no máximo 3 flutuando; o resto vai pra CENTRAL DE ALERTAS
  function dispararToastsGlobo() {
    const fila = jogo.estado._toastsGlobo;
    if (!fila || !fila.length) return;
    if (!toastLayer) {
      toastLayer = document.createElement('div');
      toastLayer.className = 'globo-toasts';
      container.appendChild(toastLayer);
    }
    jogo.estado._notificacoes = jogo.estado._notificacoes || [];
    for (const t of fila) {
      // REGISTRO permanente (central de alertas) — não se perde no meio do fluxo.
      jogo.estado._notificacoes.unshift({ tom: t.tom, titulo: t.titulo, texto: t.texto, estadoId: t.estadoId || null });
      if (jogo.estado._notificacoes.length > 50) jogo.estado._notificacoes.length = 50;
      // FLUTUANTE: mostra, mas com TETO — se já há 3, o mais antigo sai pra dar lugar.
      while (toastLayer.children.length >= TOASTS_VISIVEIS) toastLayer.firstChild.remove();
      const el = document.createElement('div');
      el.className = `gtoast ${t.tom}`;
      el.innerHTML = `<span class="gtoast-ic">${ico(t.tom === 'perda' ? 'flag-off' : t.titulo === 'INTELIGÊNCIA' ? 'radar' : 'swords', 16)}</span>
        <div class="gtoast-txt"><b>${esc(t.titulo)}</b><span>${esc(t.texto)}</span></div>
        <i class="gtoast-x">${ico('x', 12)}</i>`;
      el.addEventListener('click', () => {
        if (t.estadoId) { const code = t.estadoId.split('-')[0]; selecionarPais(code); const c = ondeEsta(code); if (c) focar(c); }
        el.remove();
      });
      toastLayer.appendChild(el);
      setTimeout(() => { el.classList.add('sai'); setTimeout(() => el.remove(), 480); }, 7000);
    }
    jogo.estado._toastsGlobo = [];
    atualizarSinoNotif();
  }

  // CENTRAL DE ALERTAS — o histórico dos avisos, pra nada se perder no flood. Um sino com
  // contador no canto do globo abre o painel; ler zera o "não lido". (As variáveis são
  // declaradas lá em cima porque o sino é montado ANTES desta seção.)
  function atualizarSinoNotif() {
    if (!sinoNotif) return;
    const total = (jogo.estado._notificacoes || []).length;
    const naoLidas = Math.max(0, total - notifLidas);
    sinoNotif.querySelector('.gn-num').textContent = naoLidas > 9 ? '9+' : String(naoLidas);
    sinoNotif.classList.toggle('tem', naoLidas > 0);
  }
  function abrirCentralNotif() {
    if (painelNotif) { painelNotif.remove(); painelNotif = null; return; }
    const lista = jogo.estado._notificacoes || [];
    painelNotif = document.createElement('div');
    painelNotif.className = 'notif-central';
    painelNotif.innerHTML = `<div class="nc-cab">${ico('bell', 13)} CENTRAL DE ALERTAS <button class="nc-x">${ico('x', 13)}</button></div>
      <div class="nc-lista">${lista.length ? lista.map((n) => `
        <div class="nc-item ${n.tom || ''}" ${n.estadoId ? `data-code="${n.estadoId.split('-')[0]}"` : ''}>
          <b>${esc(n.titulo || 'Alerta')}</b><span>${esc(n.texto || '')}</span>
        </div>`).join('') : '<div class="nc-vazio">Nenhum alerta ainda. O mundo está quieto — por enquanto.</div>'}</div>`;
    container.appendChild(painelNotif);
    painelNotif.querySelector('.nc-x').addEventListener('click', () => { painelNotif.remove(); painelNotif = null; });
    painelNotif.querySelectorAll('.nc-item[data-code]').forEach((it) => it.addEventListener('click', () => {
      const code = it.dataset.code; selecionarPais(code); const c = ondeEsta(code); if (c) focar(c);
      painelNotif.remove(); painelNotif = null;
    }));
    notifLidas = lista.length; atualizarSinoNotif();
  }

  atualizar();

  // ── VER ESTADOS ─────────────────────────────────────────────────────
  // Troca a camada de polígonos: países ⇄ estados. Carrega os dados na primeira
  // vez e reaproveita depois.
  // ── TERRITÓRIO SOB DEMANDA, POR PAÍS ────────────────────────────────
  // Antes isto baixava um `estados.geojson` de 862 KB com as 20 nações jogáveis —
  // e o resto do mundo simplesmente não tinha território pra clicar. Agora são 228
  // arquivos, um por país: a mediana é 6,3 KB. Clicar num país e baixar só ele é
  // MAIS RÁPIDO que o que fazíamos, e o planeta inteiro virou jogável.
  //
  // `_index.json` diz quem tem estados sem baixar nada — é o que deixa o globo
  // saber, antes do clique, se vale abrir o país ou tratá-lo como bloco.
  const carregandoPais = new Map();   // iso → promessa em voo (clique duplo não baixa 2×)

  async function carregarIndice() {
    if (indiceEstados) return indiceEstados;
    if (!carregando) {
      carregando = (async () => {
        const [idx, ci] = await Promise.all([
          fetch('/estados/_index.json').then((r) => r.json()).catch(() => ({})),
          fetch('/cidades.json').then((r) => r.json()).catch(() => []),
        ]);
        indiceEstados = idx;
        cidadesLista = ci;
        registrarCidades(ci);   // alimenta o peso por população/capital das guarnições (territorio.js)
        return idx;
      })();
    }
    await carregando;
    return indiceEstados;
  }

  // Carrega os estados de UM país. Devolve false se o país não tem território
  // no Natural Earth (microestados, ilhas) — aí ele continua sendo um bloco só.
  async function carregarPais(iso) {
    if (!iso) return false;
    await carregarIndice();
    if (!indiceEstados?.[iso]) return false;
    if (paisCarregado(iso)) return true;
    if (carregandoPais.has(iso)) return carregandoPais.get(iso);
    const p = (async () => {
      try {
        const ge = await fetch(`/estados/${iso}.geojson`).then((r) => r.json());
        estadosGeo = [...(estadosGeo || []), ...ge.features];
        registrarEstados(ge.features.map((f) => f.properties), iso);
        if (iso === (jogo.estado.iso || 'USA')) semearGuarnicoes(jogo.estado);
        return true;
      } catch { return false; } finally { carregandoPais.delete(iso); }
    })();
    carregandoPais.set(iso, p);
    return p;
  }

  // Compatível com quem chamava a versão antiga: garante o índice + o SEU país.
  async function carregarTerritorios() {
    await carregarIndice();
    await carregarPais(jogo.estado.iso || 'USA');
    return true;
  }

  // TEATRO DE OPERAÇÕES — arma o mapa. Precisa do SEU território (de onde a força
  // sai) e do de quem já está em guerra com você.
  async function alternarTeatro(forcar = null) {
    const querLigar = forcar === null ? !teatro : forcar;
    if (querLigar) {
      await carregarTerritorios();
      await Promise.all((jogo.estado.emGuerra || []).map((i) => carregarPais(i)));
      if (selecionado) await carregarPais(selecionado);
    }
    teatro = querLigar;
    pintarCamada();
    return teatro;
  }

  // ── A CAMADA MISTA ──────────────────────────────────────────────────
  // O globe.gl só tem UMA camada de polígonos, então países e estados não podiam
  // coexistir: ou o mundo inteiro virava províncias, ou nada virava. Era por isso
  // que existia um botão "ver estados" — e o botão estava errado. Ninguém quer
  // "ver estados"; quer ver os estados DAQUELE país.
  //
  // A saída é montar UM array híbrido: os países todos, MENOS os que estão abertos,
  // MAIS os estados de quem está aberto. O jogador clica no Brasil e o Brasil se
  // parte em 27; o resto do mundo continua liso. É a seleção que vira o filtro.
  //
  // Quem se abre: o país selecionado, e — no Teatro de Operações — o seu, porque
  // pra projetar força você precisa ver de onde ela sai.
  // Quem se abre em estados: SÓ o país que o jogador está olhando agora (+ no Teatro,
  // o seu e os inimigos ativos). Antes, TODO país com território disputado ficava
  // aberto pra sempre — bastava conquistar alguns estados e o mundo inteiro explodia
  // em polígonos, travando o globo. Agora o país fechado vira um SELO compacto
  // (ver "BADGES DE DOMÍNIO" mais abaixo) e só abre quando clicado.
  function paisesAbertos() {
    const abertos = new Set();
    if (selecionado) abertos.add(selecionado);
    if (teatro) {
      abertos.add(jogo.estado.iso || 'USA');
      for (const g of jogo.estado.emGuerra || []) abertos.add(g);
    }
    return abertos;
  }

  const ehEstado = (f) => Boolean(f?.properties?.id && f.properties.pais);

  function pintarCamada() {
    const abertos = estadosGeo ? paisesAbertos() : new Set();
    const paisesLisos = features.filter((f) => !abertos.has(iso(f)));
    const estadosAbertos = estadosGeo
      ? estadosGeo.filter((f) => abertos.has(f.properties.pais))
      : [];
    const mistura = [...paisesLisos, ...estadosAbertos];

    globe
      .polygonsData(mistura)
      // Um accessor, dois tipos de feature. Cada um sabe se pintar.
      .polygonCapColor((f) => {
        // durante a revelação, o que acabou de cair é âmbar-conquista e vem por cima
        if (ehEstado(f) && tomados.has(f.properties.id)) return 'rgba(255,176,32,.62)';
        if (ehEstado(f)) return corEstado(jogo.estado, f);
        return iso(f) === selecionado ? 'rgba(53, 224, 255, 0.55)' : corPais(jogo.estado, f, realista);
      })
      .polygonStrokeColor((f) => {
        if (ehEstado(f) && tomados.has(f.properties.id)) return 'rgba(255,220,140,1)';
        if (ehEstado(f)) return linhaEstado(jogo.estado, f);
        return iso(f) === selecionado ? 'rgba(120, 235, 255, 0.95)' : 'rgba(150, 205, 240, 0.18)';
      })
      .polygonAltitude((f) => {
        if (ehEstado(f) && tomados.has(f.properties.id)) return 0.042;   // sobe ao cair
        if (ehEstado(f)) return alturaEstado(jogo.estado, f);
        return iso(f) === selecionado ? 0.035 : altitudeDe(jogo.estado, f);
      })
      .polygonLabel((f) => (ehEstado(f)
        ? tipEstado(jogo.estado, f, teatro)
        : tooltip(jogo.estado, f, iso(f) === selecionado)))
      // A sigla do país some de quem está aberto — senão "BRA" flutua sobre 27 estados.
      .labelsData(features.filter((f) => iso2(f) && !abertos.has(iso(f))
        && (PAISES[iso(f)] || Number(f.properties?.POP_EST || 0) > 4e7)))
      .pointsData(estadosAbertos.length ? montarPontos(jogo.estado, {
        cidades: cidadesLista || [],
        estados: estadosAbertos.map((f) => f.properties),
      }) : [])
      .pointLat('lat').pointLng('lng')
      .pointColor('cor')
      .pointAltitude((d) => (d.tipo === 'tropa' ? 0.012 : 0.008))
      .pointRadius((d) => (d.tipo === 'tropa' ? 0.09 : d.raio))
      .pointResolution(4)
      .pointLabel((d) => tipPonto(d));
  }

  // ── REVELAÇÃO DA CAMPANHA ───────────────────────────────────────────
  // O território cai NA TELA, um estado por vez, enquanto a cinemática roda. Antes
  // a conquista aparecia de uma vez no fim, num número — "territórios +1". Aqui o
  // jogador VÊ a linha avançar: cada estado acende âmbar, dispara um radar, e o
  // próximo cai. É o mapa contando a guerra em vez do relatório.
  //
  // Pinta ANTES de o estado mudar de dono no modelo (a aplicação vem depois da
  // cinemática), então usamos um overlay próprio em vez das cores de `tatico.js`.
  let tomados = new Set();
  async function revelarConquista(plano, { intervalo = 900, aoCair } = {}) {
    if (!plano?.caem?.length) return;
    // abre o país alvo no mapa e leva a câmera até lá
    const isoAlvo = plano.caem[0].pais;
    await carregarPais(isoAlvo);
    selecionado = isoAlvo;
    pintarCamada();
    for (const e of plano.caem) {
      tomados.add(e.id);
      ondaRadar({ lat: e.lat, lng: e.lng }, { cor: 0xffb020, max: 26 });
      pintarCamada();
      aoCair?.(e);
      await new Promise((r) => setTimeout(r, intervalo));
    }
  }
  function limparRevelacao() { tomados = new Set(); pintarCamada(); }

  // A insígnia é montada por atualizar(), então toda troca de seleção passa por ele —
  // com pintarCamada() sozinho a insígnia só apareceria no turno seguinte.
  function selecionarPais(code) {
    selecionado = code || null;
    atualizar();
    return selecionado;
  }
  function limparSelecao() {
    selecionado = null;
    atualizar();
  }

  function focar(f) {
    const c = f?.properties ? centro(f) : f;
    globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.6 }, 900);
  }

  // Toggle satélite ⇄ político — SEM apagar o globo (era o bug: image null = preto).
  function alternarTextura() {
    realista = !realista;
    if (realista) {
      globe.globeImageUrl(`${TEX}/earth-blue-marble.jpg`).bumpImageUrl(`${TEX}/earth-topology.png`);
      globe.polygonStrokeColor(() => 'rgba(150, 205, 240, 0.18)');
      globe.atmosphereColor('#4aa8ff');
    } else {
      // mapa político: textura escura de base (nunca null) + polígonos fortes
      globe.globeImageUrl(`${TEX}/earth-dark.jpg`).bumpImageUrl(null);
      globe.polygonStrokeColor(() => 'rgba(53, 224, 255, 0.45)');
      globe.atmosphereColor('#35e0ff');
    }
    atualizar();
    return realista;
  }

  return {
    atualizar, focar, alternarTextura, desenharLinha, lancarEsquadrilha,
    salvaMisseis, impacto, balao, alertaTemporario, lancarOgiva, detonacaoNuclear,
    ondaRadar, interceptacaoNuclear, ondeEsta, globe, features,
    alternarTeatro, carregarTerritorios, carregarPais, selecionarPais, limparSelecao,
    revelarConquista, limparRevelacao,
    temEstados: (iso) => Boolean(indiceEstados?.[iso]),
    get realista() { return realista; },
    get teatro() { return teatro; },
    get selecionado() { return selecionado; },
  };
}
