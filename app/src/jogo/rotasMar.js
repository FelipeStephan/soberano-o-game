// ═══════════════════════════════════════════════════════════════════════
// ROTAS MARÍTIMAS — o navio navega PELO MAR, não por cima do Cazaquistão
// ═══════════════════════════════════════════════════════════════════════
// O BUG QUE ISTO MATA: a frota seguia o grande círculo entre origem e alvo. De
// Washington a Teerã, o grande círculo passa por cima da Groenlândia e da Rússia —
// e o destróier atravessava a Sibéria de quilha erguida. Quebrava a fantasia inteira.
//
// A SOLUÇÃO, em três peças:
//   1. MÁSCARA DE TERRA — uma grade de 1°×1° (360×180 células) onde cada célula
//      sabe se o CENTRO dela cai em terra ou mar. Construída UMA vez, por
//      ray-casting contra os polígonos do próprio GeoJSON que o globo já carregou.
//      Amostragem por centro (e não por cobertura) é deliberada: mantém estreitos
//      de 1 célula navegáveis em vez de fechá-los porque a célula "encosta" em terra.
//   2. CANAIS FORÇADOS — Suez e Panamá são TERRA no mapa físico, mas navio passa.
//      Gibraltar, Ormuz, Malaca, Bab el-Mandeb e Bósforo são estreitos que uma
//      grade grosseira poderia fechar por azar de amostragem. Whitelist explícita.
//   3. A* — busca de caminho sobre a grade, custo esférico (passo de longitude
//      encurta com o cosseno da latitude), com wrap de longitude (o Pacífico é
//      uma rota, não uma parede).
//
// O que sai daqui é uma lista de {lat,lng} costeando o planeta. O globo transforma
// em curva suave e o navio finalmente CONTORNA a África em vez de atropelá-la.
//
// CUSTO: a máscara leva ~100ms pra construir — por isso é montada em idle, depois
// do primeiro frame. Se uma frota zarpar antes de ficar pronta, o chamador cai no
// slerp antigo (uma viagem feia é melhor que uma tela travada).

const W = 360;                 // colunas (1° de longitude)
const H = 180;                 // linhas (1° de latitude)
let mascara = null;            // Uint8Array W*H — 1 = terra, 0 = mar
let construindo = false;

const idx = (x, y) => y * W + x;
const paraXY = (lat, lng) => ({
  x: ((Math.floor(lng + 180) % W) + W) % W,
  y: Math.max(0, Math.min(H - 1, Math.floor(lat + 90))),
});
const paraLatLng = (x, y) => ({ lat: y - 90 + 0.5, lng: x - 180 + 0.5 });

// ── CANAIS E ESTREITOS (lng, lat) — forçados a MAR na máscara ─────────
// Cada entrada é uma cadeia de células que garante a passagem aberta.
const CANAIS = [
  // Suez: Mediterrâneo → Mar Vermelho (o canal é terra no mapa físico)
  [32, 31], [32, 30], [33, 29], [33, 28],
  // Panamá: Caribe → Pacífico
  [-80, 9], [-79, 9], [-80, 8],
  // Gibraltar: Atlântico → Mediterrâneo (14 km — a grade fecharia fácil)
  [-6, 36], [-5, 36], [-4, 36],
  // Ormuz: Golfo Pérsico → Índico
  [56, 26], [57, 26], [56, 27],
  // Bab el-Mandeb: Mar Vermelho → Índico
  [43, 12], [43, 13], [44, 12],
  // Malaca: Índico → Mar da China
  [100, 3], [101, 2], [102, 1], [103, 1],
  // Bósforo + Dardanelos: Mar Negro → Mediterrâneo
  [29, 41], [28, 40], [26, 40],
  // Dover: Atlântico → Mar do Norte
  [1, 50], [1, 51],
  // Øresund: Mar do Norte → Báltico
  [12, 55], [12, 56], [10, 57],
  // Tsushima: Mar da China → Mar do Japão
  [129, 34], [128, 34],
];

// ── PONTO-EM-POLÍGONO (ray casting) ───────────────────────────────────
function dentroDoAnel(lng, lat, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function dentroDaFeature(lng, lat, geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) {
    // anel externo dentro, e fora de todos os buracos
    if (dentroDoAnel(lng, lat, poly[0])) {
      let noBuraco = false;
      for (let h = 1; h < poly.length; h += 1) {
        if (dentroDoAnel(lng, lat, poly[h])) { noBuraco = true; break; }
      }
      if (!noBuraco) return true;
    }
  }
  return false;
}

function bboxDe(geom) {
  let x0 = 999, y0 = 999, x1 = -999, y1 = -999;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) for (const [x, y] of poly[0]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

// ── CONSTRUÇÃO DA MÁSCARA ─────────────────────────────────────────────
// Chamada com as features do GeoJSON que o globo já baixou. Idempotente.
// FATIADA em macrotasks de 12 linhas: a versão síncrona custava ~550ms, e o plano
// original de rodar em requestIdleCallback NUNCA disparava — o globo renderiza todo
// frame via rAF, então o navegador nunca declara "idle". Lição: em página com rAF
// contínuo, idle callback é promessa vazia; fatie o trabalho você mesmo.
export function construirMalha(features) {
  if (mascara || construindo || !features?.length) return;
  construindo = true;
  const t0 = performance.now();

  const m = new Uint8Array(W * H);
  const geoms = features
    .map((f) => f.geometry)
    .filter(Boolean)
    .map((g) => ({ g, bbox: bboxDe(g) }));

  let y = 0;
  const fatia = () => {
    const fimY = Math.min(H, y + 12);
    for (; y < fimY; y += 1) {
      const lat = y - 90 + 0.5;
      // O GeoJSON do jogo filtra a Antártida (ATA) — sem isto, o mar austral "abaixo"
      // dela viraria rota válida ATRAVÉS do continente. Bloqueio bruto: nada navega
      // ao sul de -62 (a Passagem de Drake fica em ~-57, continua aberta).
      if (lat < -62) { for (let x = 0; x < W; x += 1) m[idx(x, y)] = 1; continue; }
      for (let x = 0; x < W; x += 1) {
        const lng = x - 180 + 0.5;
        for (const { g, bbox } of geoms) {
          if (lng < bbox[0] || lng > bbox[2] || lat < bbox[1] || lat > bbox[3]) continue;
          if (dentroDaFeature(lng, lat, g)) { m[idx(x, y)] = 1; break; }
        }
      }
    }
    if (y < H) { setTimeout(fatia, 0); return; }

    // fura os canais e estreitos
    for (const [lng, lat] of CANAIS) {
      const c = paraXY(lat, lng);
      m[idx(c.x, c.y)] = 0;
    }
    mascara = m;
    construindo = false;
    // eslint-disable-next-line no-console
    console.info(`[rotasMar] máscara 1° pronta em ${Math.round(performance.now() - t0)}ms (fatiada)`);
  };
  fatia();
}

export function malhaPronta() { return Boolean(mascara); }

// ── VIZINHO DE ÁGUA MAIS PRÓXIMO ──────────────────────────────────────
// A capital fica no interior (Brasília, Kansas). O navio zarpa da COSTA mais
// próxima — busca em espiral até achar mar.
function aguaMaisProxima(lat, lng, raioMax = 25) {
  const { x, y } = paraXY(lat, lng);
  if (mascara[idx(x, y)] === 0) return { x, y };
  for (let r = 1; r <= raioMax; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;   // só o anel
        const nx = ((x + dx) % W + W) % W;
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        if (mascara[idx(nx, ny)] === 0) return { x: nx, y: ny };
      }
    }
  }
  return null;
}

// ── A* ────────────────────────────────────────────────────────────────
// Heap binário mínimo — 65k células pedem melhor que lista ordenada.
class Heap {
  constructor() { this.a = []; }
  push(n) {
    const a = this.a; a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1; const r = l + 1; let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

const rad = Math.PI / 180;
// GELO: acima de ~66°N a navegação real exige quebra-gelo e seguro de guerra.
// Sem esta taxa, o A* descobre que perto do polo cruzar longitudes é quase de graça
// (cosseno → 0) e manda a frota Reino Unido→Japão POR CIMA do Ártico. A Rota do
// Norte existe, mas não é grátis — o multiplicador faz Suez voltar a ganhar.
function taxaGelo(y) {
  const lat = y - 90 + 0.5;
  if (lat > 74) return 6;     // banquisa permanente: praticamente fechado
  if (lat > 66) return 2.5;   // Rota do Norte: possível, caro
  return 1;
}
function custoPasso(dx, dy, y) {
  // passo de longitude encurta com o cosseno da latitude (1° em Singapura ≠ 1° em Oslo)
  const c = Math.max(0.08, Math.cos((y - 90 + 0.5) * rad));
  return Math.hypot(dx * c, dy) * taxaGelo(y);
}
function heuristica(x, y, gx, gy) {
  let dx = Math.abs(x - gx);
  if (dx > W / 2) dx = W - dx;   // wrap: o Pacífico é caminho
  const c = Math.max(0.08, Math.cos((y - 90 + 0.5) * rad));
  return Math.hypot(dx * c, Math.abs(y - gy));
}

const VIZINHOS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// Rota marítima entre dois {lat,lng}. Retorna array de {lat,lng} (costa → costa)
// ou null (máscara ainda não pronta / bacias desconexas tipo Cáspio).
export function rotaMaritima(de, ate) {
  if (!mascara || !de || !ate) return null;
  const a = aguaMaisProxima(de.lat, de.lng);
  const b = aguaMaisProxima(ate.lat, ate.lng);
  if (!a || !b) return null;

  const g = new Float32Array(W * H).fill(Infinity);
  const veio = new Int32Array(W * H).fill(-1);
  const fechado = new Uint8Array(W * H);
  const heap = new Heap();

  g[idx(a.x, a.y)] = 0;
  heap.push({ x: a.x, y: a.y, f: heuristica(a.x, a.y, b.x, b.y) });

  let achou = false;
  let iter = 0;
  const MAX_ITER = 90000;   // trava de segurança: pior caso global ~65k células

  while (heap.size && iter < MAX_ITER) {
    iter += 1;
    const n = heap.pop();
    const ni = idx(n.x, n.y);
    if (fechado[ni]) continue;
    fechado[ni] = 1;
    if (n.x === b.x && n.y === b.y) { achou = true; break; }

    for (const [dx, dy] of VIZINHOS) {
      const nx = ((n.x + dx) % W + W) % W;
      const ny = n.y + dy;
      if (ny < 0 || ny >= H) continue;
      const vi = idx(nx, ny);
      if (mascara[vi] === 1 || fechado[vi]) continue;
      // diagonal não corta quina de terra (senão o navio "pula" o cabo)
      if (dx && dy) {
        if (mascara[idx(((n.x + dx) % W + W) % W, n.y)] === 1) continue;
        if (mascara[idx(n.x, ny)] === 1) continue;
      }
      const custo = g[ni] + custoPasso(dx, dy, ny);
      if (custo < g[vi]) {
        g[vi] = custo;
        veio[vi] = ni;
        heap.push({ x: nx, y: ny, f: custo + heuristica(nx, ny, b.x, b.y) });
      }
    }
  }
  if (!achou) return null;

  // reconstrói e SIMPLIFICA: colapsa trechos colineares (a curva suaviza o resto)
  const celulas = [];
  let cur = idx(b.x, b.y);
  while (cur !== -1) {
    celulas.push(cur);
    cur = veio[cur];
  }
  celulas.reverse();

  const pontos = [];
  let dirAnt = null;
  for (let i = 0; i < celulas.length; i += 1) {
    const x = celulas[i] % W;
    const y = Math.floor(celulas[i] / W);
    if (i > 0 && i < celulas.length - 1) {
      const xa = celulas[i - 1] % W;
      const ya = Math.floor(celulas[i - 1] / W);
      const dir = `${((x - xa + W + 1) % W) - 1},${y - ya}`;
      if (dir === dirAnt && i % 3 !== 0) continue;   // guarda 1 a cada 3 nos retões
      dirAnt = dir;
    }
    pontos.push(paraLatLng(x, y));
  }
  // ancora nas coordenadas reais de partida/chegada (a costa, não o centro da célula)
  pontos.unshift({ lat: de.lat, lng: de.lng });
  pontos.push({ lat: ate.lat, lng: ate.lng });
  return pontos;
}
