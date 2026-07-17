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
import { bandeiraDeFeature, bandeira, ISO2_DE } from '../dados/imagens.js';
import { estaOcupado, ocupacaoDe } from '../jogo/ocupacao.js';
import { MODELOS, luzes } from './modelos3d.js';
import { TIPOS_BASE } from '../dados/bases.js';
import { construirMalha, rotaMaritima } from '../jogo/rotasMar.js';
import { PETROLEO, ESTREITOS } from '../dados/petroleo.js';
import { NACOES } from '../dados/registro.js';
import { ico } from './icones.js';

import { registrarEstados, semearGuarnicoes, todosEstados } from '../jogo/territorio.js';
import { corEstado, linhaEstado, alturaEstado, tipEstado, montarPontos, tipPonto, estadosVisiveis } from './tatico.js';

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
    faixa = { rot: 'SOB SUA OCUPAÇÃO', sub: `Insurgência ${oc.insurgencia}% · ocupado há ${oc.desde || 0} ciclo(s)` };
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
  const t = (estado.temp_guerra * 0.6) + Math.max(0, -media) * 0.5 + (estado.emGuerra?.length || 0) * 8;
  return Math.max(0, Math.min(100, Math.round(t)));
}

export async function montarGlobo(container, jogo, {
  onPaisClick, onEstadoClick, onPaisSelecionado, onAlvoEstado, onAlvoMar,
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
  let arcos = [];        // efêmeros: ações do jogador, somem sozinhos
  let arcosMundo = [];   // persistentes: guerras NPC — vivem enquanto o conflito viver
  const pintarArcos = () => globe.arcsData([...arcosMundo, ...arcos]);

  // ── TERRITÓRIOS ─────────────────────────────────────────────────────
  // Os 862 KB de estados + 126 KB de cidades NÃO entram no carregamento inicial —
  // a home cinemática não paga por uma camada que talvez nunca abra. Carregam na
  // primeira seleção de país, uma vez, e ficam.
  let estadosGeo = null;    // features do admin-1
  let cidadesLista = null;
  let carregando = null;    // promessa em voo (evita baixar duas vezes num clique duplo)

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
        pintarCamada();               // acende o selecionado (ainda como país)
        onPaisSelecionado?.(f);
        // Selecionar É o filtro: o país se abre em estados sozinho. Antes isso
        // exigia um botão "ver estados", e ninguém quer "ver estados" — quer ver
        // os estados DAQUELE país. Os dados chegam depois; o mapa repinta quando
        // chegarem, sem travar o clique.
        await carregarTerritorios();
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
    .htmlElement((d) => {
      const el = document.createElement('div');
      el.className = 'mm';                       // SEM transform aqui!
      el.innerHTML = `<div class="mm-in ${d.tipo}">
          ${d.flag ? `<img class="mm-flag" src="${d.flag}" alt="">` : ''}
          <span class="mm-ic">${d.svg}</span>
          ${d.rot ? `<span class="mm-rot">${d.rot}</span>` : ''}
        </div>`;
      // HOVER RICO: marcadores com `tip` (guerra, pandemia, zona radioativa) mostram
      // um cartão flutuante com o status do conflito. Sem `tip`, cai no title nativo.
      if (d.tip) {
        el.addEventListener('mouseenter', () => mostrarTipMarcador(d.tip));
        el.addEventListener('mouseleave', esconderTipMarcador);
      } else {
        el.title = d.titulo || '';
      }
      return el;
    });

  globe.globeMaterial().bumpScale = 6;

  // A máscara de terra das rotas marítimas monta em fatias logo após a abertura.
  // NÃO usar requestIdleCallback aqui: o globo renderiza todo frame via rAF e o
  // navegador nunca fica "idle" — o callback simplesmente não dispara (testado).
  setTimeout(() => construirMalha(features), 700);

  // ── CAMADA 3D: satélites em órbita + esquadrilhas em missão ─────────
  const orbitas = new THREE.Group();
  globe.scene().add(orbitas);
  // Os modelos usam MeshPhongMaterial: SEM este rig eles renderizam pretos.
  globe.scene().add(luzes());
  const R = globe.getGlobeRadius();
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
    requestAnimationFrame(anima);
  }());

  const ctrl = globe.controls();
  ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.22;
  ctrl.enableZoom = true; ctrl.minDistance = 170; ctrl.maxDistance = 520;
  container.addEventListener('pointerenter', () => { ctrl.autoRotate = false; });
  container.addEventListener('pointerleave', () => { ctrl.autoRotate = true; });
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
    tipEl.style.display = 'block';
  }
  function moverTip(ev) {
    if (!tipEl) return;
    tipEl.style.left = `${Math.min(ev.clientX + 16, window.innerWidth - 260)}px`;
    tipEl.style.top = `${Math.min(ev.clientY + 16, window.innerHeight - 160)}px`;
  }
  function esconderTipMarcador() { if (tipEl) tipEl.style.display = 'none'; }

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

    for (const [code, info] of Object.entries(PAISES)) {
      const rel = Number(jogo.estado[info.rel] ?? 0);
      if (rel > -55) continue;
      const c = ondeEsta(code); if (!c) continue;
      novos.push({ ...c, tipo: 'tensao', svg: ico('zap', 12), flag: bandeira(ISO2_DE[code], 40), rot: `${rel}`, titulo: `${info.nome} — relação ${rel}`,
        tip: `<b>${esc(info.nome)}</b><span class="gtc-sub ${rel <= -75 ? 'gtc-guerra' : ''}">RELAÇÃO ${rel} / 100</span><p>${rel <= -75 ? 'À beira do confronto. Uma provocação e vira guerra.' : 'Relação hostil. Diplomacia aqui está por um fio.'} Quanto mais negativa, maior a chance de ataque, sabotagem e traição.</p>` });
      // Tensão diplomática grave: radar âmbar, lento e discreto — é aviso, não guerra.
      if (rel <= -75) focos.push({ ...c, cor: 'rgba(255,176,32,', raio: 4, vel: 1.1, periodo: 1800, forca: 0.5 });
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
        tip: `<div class="gtc-cab"><img src="${bandeira(ISO2_DE[c.a], 40) || ''}" onerror="this.style.display='none'"><b>${esc(na)}</b><span class="gtc-vs">×</span><b>${esc(nb)}</b><img src="${bandeira(ISO2_DE[c.b], 40) || ''}" onerror="this.style.display='none'"></div>
          <span class="gtc-sub gtc-guerra">GUERRA ${nivel.toUpperCase()}</span>
          <p>Disputa por <b>${esc(c.tema)}</b>. Intensidade ${Math.round(c.intensidade)}/100 · há ${c.turnos || 0} ciclo(s).</p>
          <div class="gtc-barra"><i style="width:${Math.round(c.intensidade)}%"></i></div>
          <span class="gtc-cta">Clique num dos países para ofertar ajuda</span>`,
      });
    }

    // Pandemias: anel roxo lento e largo — a ameaça que se espalha em silêncio.
    for (const pd of jogo.estado.pandemias || []) {
      for (const code of pd.paises) {
        const c = ondeEsta(code); if (!c) continue;
        focos.push({ ...c, cor: 'rgba(185,140,255,', raio: 7, vel: 1.1, periodo: 1500, forca: 0.8 });
      }
      const origem = ondeEsta(pd.origem);
      if (origem) {
        novos.push({
          ...origem, tipo: 'pandemia', svg: ico('biohazard', 12),
          rot: `${pd.paises.length}`, titulo: `${pd.nome} (${pd.tipo}) — ${pd.paises.length} países · fase ${pd.fase}`,
          tip: `<b>${esc(pd.nome)}</b><span class="gtc-sub" style="border-color:#b98cff;color:#b98cff">PANDEMIA · ${esc((pd.fase || '').toUpperCase())}</span><p>Patógeno do tipo <b>${esc(pd.tipo)}</b> já em <b>${pd.paises.length} país(es)</b>. Não respeita fronteira nem míssil — se chegar ao seu território, derruba aprovação e economia.</p>`,
        });
      }
    }

    // Agora sim: com TODOS os radares e marcadores empilhados (inclusive Mundo Vivo),
    // manda pro globo de uma vez.
    globe.ringsData(focos);
    globe.htmlElementsData(marcadores);
    montarSatelites(Math.min(4, Math.floor((jogo.estado.inteligencia || 0) / 25)));
    pintarArcos();
  }
  atualizar();

  // ── VER ESTADOS ─────────────────────────────────────────────────────
  // Troca a camada de polígonos: países ⇄ estados. Carrega os dados na primeira
  // vez e reaproveita depois.
  // Baixa os territórios uma vez. Concorrente-seguro: dois cliques rápidos não
  // disparam dois downloads de 862 KB.
  async function carregarTerritorios() {
    if (estadosGeo) return true;
    if (carregando) return carregando;
    carregando = (async () => {
      const [ge, ci] = await Promise.all([
        fetch('/estados.geojson').then((r) => r.json()),
        fetch('/cidades.json').then((r) => r.json()),
      ]);
      estadosGeo = ge.features;
      cidadesLista = ci;
      registrarEstados(estadosGeo.map((f) => f.properties));
      semearGuarnicoes(jogo.estado);   // primeira vez: o exército ganha endereço
      return true;
    })();
    return carregando;
  }

  // TEATRO DE OPERAÇÕES — arma o mapa.
  async function alternarTeatro(forcar = null) {
    const querLigar = forcar === null ? !teatro : forcar;
    if (querLigar) await carregarTerritorios();
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
  function paisesAbertos() {
    const abertos = new Set();
    if (selecionado) abertos.add(selecionado);
    if (teatro) {
      abertos.add(jogo.estado.iso || 'USA');
      for (const g of jogo.estado.emGuerra || []) abertos.add(g);
    }
    for (const [id, dono] of Object.entries(jogo.estado.donoEstado || {})) {
      abertos.add(dono); abertos.add(id.split('-')[0]);   // território disputado sempre aberto
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
        if (ehEstado(f)) return corEstado(jogo.estado, f);
        return iso(f) === selecionado ? 'rgba(53, 224, 255, 0.55)' : corPais(jogo.estado, f, realista);
      })
      .polygonStrokeColor((f) => {
        if (ehEstado(f)) return linhaEstado(jogo.estado, f);
        return iso(f) === selecionado ? 'rgba(120, 235, 255, 0.95)' : 'rgba(150, 205, 240, 0.18)';
      })
      .polygonAltitude((f) => {
        if (ehEstado(f)) return alturaEstado(jogo.estado, f);
        return iso(f) === selecionado ? 0.035 : altitudeDe(jogo.estado, f);
      })
      .polygonLabel((f) => (ehEstado(f)
        ? `<div class="gt-conflito" style="display:block;position:static;width:250px">${tipEstado(jogo.estado, f, teatro)}</div>`
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

  function selecionarPais(code) {
    selecionado = code || null;
    pintarCamada();
    return selecionado;
  }
  function limparSelecao() {
    selecionado = null;
    pintarCamada();
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
    alternarTeatro, carregarTerritorios, selecionarPais, limparSelecao,
    get realista() { return realista; },
    get teatro() { return teatro; },
    get selecionado() { return selecionado; },
  };
}
