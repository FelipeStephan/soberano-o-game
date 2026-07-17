// ═══════════════════════════════════════════════════════════════════════
// PREPARAR TERRITÓRIOS — transforma dados brutos do Natural Earth no que o jogo carrega
// ═══════════════════════════════════════════════════════════════════════
// Por que este script existe: o admin-1 completo do Natural Earth tem 39 MB e 4.596
// estados do planeta inteiro. Mandar isso pro navegador mataria a home cinemática
// antes de ela abrir. O jogo só precisa dos estados das 20 nações jogáveis, com
// precisão de globo — não de cartografia.
//
// O que fazemos aqui, uma vez, na máquina do dev:
//   1. Filtrar para as 20 nações        (4.596 → ~900 estados)
//   2. Jogar fora toda propriedade que o jogo não lê (o NE traz ~80 colunas)
//   3. Arredondar coordenadas para 2 casas (~1 km — invisível num globo 3D)
//   4. Remover pontos que viraram duplicados depois do arredondamento
//   5. Descartar ilhotas minúsculas que não rendem nem um pixel
//
// ── POR QUE FATIADO POR PAÍS, E NÃO UM ARQUIVO SÓ ────────────────────
// A v1 gerava um `estados.geojson` com as 20 nações jogáveis: 862 KB baixados de
// uma vez, e o resto do mundo simplesmente não tinha território — não dava pra
// abrir os estados do México nem atacar a Argentina.
//
// A medição resolveu o impasse. Com TODOS os 229 países num arquivo só, dá 2,74 MB.
// Fatiado por país, a MEDIANA é 6,5 KB e o pior caso (Rússia, 86 estados) é 220 KB.
// Ou seja: clicar num país e baixar só ele é mais rápido que o que fazíamos antes —
// e ainda libera o planeta inteiro. Não havia trade-off; havia uma decisão errada.
//
// Rodar: node scripts/prepararTerritorios.mjs [--limpar]
// Entra: public/ne_estados_10m.geojson + public/ne_cidades_10m.geojson (brutos)
// Sai:   public/estados/<ISO>.geojson (um por país) + public/estados/_index.json
//        public/cidades.json
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const DIR_EST = join(PUB, 'estados');

// As 20 jogáveis continuam existindo como conceito — mas só pra priorizar cidades.
// O território agora é de todo mundo.
const NACOES = ['USA', 'CHN', 'RUS', 'IND', 'GBR', 'FRA', 'DEU', 'JPN', 'BRA', 'KOR',
  'TUR', 'SAU', 'ISR', 'EGY', 'IRN', 'UKR', 'PRK', 'VEN', 'PAK', 'IDN'];

const CASAS = 2;                 // ~1,1 km no equador. Um globo não vê melhor que isso.
const MIN_PONTOS_ANEL = 4;       // anel com menos que isto não é polígono, é ruído
const MIN_AREA = 0.02;           // graus² — abaixo disso a ilha não rende um pixel
const TOLERANCIA = 0.035;        // ~4 km: o desvio máximo que aceitamos ao retificar

const arred = (n) => Math.round(n * 10 ** CASAS) / 10 ** CASAS;

// ── DOUGLAS-PEUCKER ───────────────────────────────────────────────────
// Só arredondar não bastou: o Natural Earth desenha uma fronteira com centenas de
// pontos porque ela precisa servir a um mapa impresso. Num globo girando, 90% deles
// caem dentro do mesmo pixel. O DP mantém os pontos que definem a SILHUETA (os
// cantos) e joga fora os que só engordam a reta entre eles.
function distPerpendicular(p, a, b) {
  const [px, py] = p; const [ax, ay] = a; const [bx, by] = b;
  const dx = bx - ax; const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function douglasPeucker(pts, tol) {
  if (pts.length <= 2) return pts;
  let maxD = 0; let idx = 0;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const d = distPerpendicular(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= tol) return [pts[0], pts[pts.length - 1]];
  const esq = douglasPeucker(pts.slice(0, idx + 1), tol);
  const dir = douglasPeucker(pts.slice(idx), tol);
  return esq.slice(0, -1).concat(dir);
}

// Área aproximada de um anel (fórmula do laço). Só pra decidir o que é ilhota.
function area(anel) {
  let a = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i, i += 1) {
    a += (anel[j][0] + anel[i][0]) * (anel[j][1] - anel[i][1]);
  }
  return Math.abs(a / 2);
}

// Simplifica (DP) → arredonda → colapsa repetidos. Nesta ordem: o DP corta a massa
// de pontos, o arredondamento corta os bytes de cada um que sobrou.
function limparAnel(anel) {
  const simples = douglasPeucker(anel, TOLERANCIA);
  const out = [];
  for (const [x, y] of simples) {
    const p = [arred(x), arred(y)];
    const ult = out[out.length - 1];
    if (!ult || ult[0] !== p[0] || ult[1] !== p[1]) out.push(p);
  }
  // fecha o anel (o primeiro ponto tem de ser igual ao último)
  if (out.length > 1) {
    const a = out[0]; const z = out[out.length - 1];
    if (a[0] !== z[0] || a[1] !== z[1]) out.push([a[0], a[1]]);
  }
  return out;
}

function limparPoligono(poli) {
  return poli.map(limparAnel).filter((anel, i) => {
    if (anel.length < MIN_PONTOS_ANEL) return false;
    if (i === 0) return true;              // anel externo sempre fica
    return area(anel) >= MIN_AREA / 4;     // buraco pequeno some
  });
}

function limparGeometria(g) {
  if (!g) return null;
  if (g.type === 'Polygon') {
    const p = limparPoligono(g.coordinates);
    return p.length ? { type: 'Polygon', coordinates: p } : null;
  }
  if (g.type === 'MultiPolygon') {
    const ps = g.coordinates.map(limparPoligono)
      .filter((p) => p.length && area(p[0]) >= MIN_AREA);
    if (!ps.length) return null;
    return ps.length === 1 ? { type: 'Polygon', coordinates: ps[0] } : { type: 'MultiPolygon', coordinates: ps };
  }
  return null;
}

// ── ESTADOS (um arquivo por país) ─────────────────────────────────────
function fazerEstados() {
  const bruto = JSON.parse(readFileSync(join(PUB, 'ne_estados_10m.geojson'), 'utf8'));
  const porPais = {};
  const usados = new Set();
  for (const f of bruto.features) {
    const p = f.properties;
    if (!p.adm0_a3 || p.adm0_a3 === 'ATA') continue;   // Antártida fora, como no mapa de países
    const geo = limparGeometria(f.geometry);
    if (!geo) continue;
    // id estável: é a CHAVE DAS GUARNIÇÕES (estado.guarnicoes['BRA-RJ']), então
    // duplicata aqui faz dois territórios compartilharem a mesma tropa. O Natural
    // Earth repete iso_3166_2 em alguns países (o Irã tem dois "IR-07"), e sem este
    // desempate a guarnição de um estado defenderia o outro por acidente.
    const sigla = (p.iso_3166_2 || '').split('-')[1] || String(p.name || '').slice(0, 3).toUpperCase();
    let id = `${p.adm0_a3}-${sigla}`;
    if (usados.has(id)) {
      let n = 2;
      while (usados.has(`${id}${n}`)) n += 1;
      id = `${id}${n}`;
    }
    usados.add(id);
    (porPais[p.adm0_a3] ||= []).push({
      type: 'Feature',
      properties: {
        id,
        nome: p.name || p.woe_name || sigla,
        pais: p.adm0_a3,
        tipo: p.type_en || 'Estado',
        lat: arred(Number(p.latitude)),
        lng: arred(Number(p.longitude)),
      },
      geometry: geo,
    });
  }

  mkdirSync(DIR_EST, { recursive: true });
  const indice = {};
  let total = 0;
  for (const [iso, feats] of Object.entries(porPais)) {
    const fc = { type: 'FeatureCollection', features: feats };
    writeFileSync(join(DIR_EST, `${iso}.geojson`), JSON.stringify(fc));
    indice[iso] = feats.length;
    total += feats.length;
  }
  // O índice diz QUEM tem estados sem baixar nada. É o que permite ao globo saber,
  // antes de qualquer clique, se vale abrir o país ou tratá-lo como bloco único.
  writeFileSync(join(DIR_EST, '_index.json'), JSON.stringify(indice));
  return { total, paises: Object.keys(porPais).length };
}

// ── CIDADES ───────────────────────────────────────────────────────────
// Sem geometria de polígono: cidade é um ponto. Guardamos população e se é
// capital — é o que dá o "contexto simples, mais rico na capital".
function fazerCidades() {
  const bruto = JSON.parse(readFileSync(join(PUB, 'ne_cidades_10m.geojson'), 'utf8'));
  const feats = [];
  for (const f of bruto.features) {
    const p = f.properties;
    if (!p.adm0_a3 || p.adm0_a3 === 'ATA') continue;
    const cla = String(p.featurecla || '');
    const capitalPais = /Admin-0 capital/.test(cla);
    const capitalEstado = /Admin-1 (region )?capital/.test(cla);
    // Cidade pequena e sem importância política vira ruído no globo. O corte é mais
    // frouxo nas 20 jogáveis (onde o jogador vai olhar de perto) e mais duro no resto
    // do mundo — senão o arquivo dobra pra mostrar subúrbio que ninguém vai clicar.
    const pop = Number(p.pop_max) || 0;
    const jogavel = NACOES.includes(p.adm0_a3);
    const corte = jogavel ? 500_000 : 1_500_000;
    if (!capitalPais && !capitalEstado && pop < corte) continue;
    if (!jogavel && !capitalPais && pop < 800_000) continue;   // fora das jogáveis: capital ou cidade grande
    feats.push({
      nome: p.name,
      pais: p.adm0_a3,
      estado: p.adm1name || '',
      pop,
      lat: arred(Number(p.latitude)),
      lng: arred(Number(p.longitude)),
      capitalPais,
      capitalEstado,
    });
  }
  feats.sort((a, b) => b.pop - a.pop);
  writeFileSync(join(PUB, 'cidades.json'), JSON.stringify(feats));
  return feats.length;
}

const est = fazerEstados();
const nC = fazerCidades();

const kb = (caminho) => `${(readFileSync(caminho).length / 1024).toFixed(0)} KB`;
const tamanhos = Object.keys(JSON.parse(readFileSync(join(DIR_EST, '_index.json'), 'utf8')))
  .map((iso) => ({ iso, b: readFileSync(join(DIR_EST, `${iso}.geojson`)).length }))
  .sort((a, b) => b.b - a.b);
const mediana = tamanhos[Math.floor(tamanhos.length / 2)];
console.log(`estados/       → ${est.total} estados em ${est.paises} países (um arquivo cada)`);
console.log(`                 maior: ${tamanhos[0].iso} ${(tamanhos[0].b / 1024).toFixed(0)} KB · mediana: ${(mediana.b / 1024).toFixed(1)} KB`);
console.log(`cidades.json   → ${nC} cidades · ${kb(join(PUB, 'cidades.json'))}`);

// Os brutos são enormes (39 MB) e não vão pro git nem pro deploy — mas só apagamos
// se pedirem. Apagar por padrão obrigava a rebaixar 40 MB a cada ajuste de tolerância.
if (process.argv.includes('--limpar')) {
  for (const tmp of ['ne_estados_10m.geojson', 'ne_cidades_10m.geojson', 'ne_estados_raw.geojson', 'ne_cidades_raw.geojson']) {
    if (existsSync(join(PUB, tmp))) unlinkSync(join(PUB, tmp));
  }
  console.log('brutos removidos.');
} else {
  console.log('(brutos mantidos — rode com --limpar para apagá-los)');
}
