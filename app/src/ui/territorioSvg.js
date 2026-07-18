// ═══════════════════════════════════════════════════════════════════════
// SILHUETA DO TERRITÓRIO — o vetor da forma do estado, em miniatura
// ═══════════════════════════════════════════════════════════════════════
// O pedido do dono: sempre que uma tela citar um estado/cidade, mostrar a FORMA
// dele ao lado do nome — o Rio de Janeiro tem cara de Rio de Janeiro. Isto pega a
// geometria GeoJSON (que o globo já baixou) e projeta num mini-SVG normalizado ao
// bounding box, com a longitude corrigida pela latitude (senão estado do norte
// sai espremido). Leve: só o anel externo de cada polígono, amostrado.
const cache = new Map();

// Converte uma geometry (Polygon/MultiPolygon) num path SVG normalizado 0..100.
function pathDe(geometry) {
  if (!geometry) return null;
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  if (!polys.length) return null;

  // bounding box com correção de latitude
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let latMed = 0, n = 0;
  for (const poly of polys) for (const [lng, lat] of poly[0]) { latMed += lat; n += 1; }
  latMed = n ? latMed / n : 0;
  const kx = Math.cos(latMed * Math.PI / 180) || 1;
  for (const poly of polys) for (const [lng, lat] of poly[0]) {
    const x = lng * kx; const y = -lat;                    // -lat: SVG cresce pra baixo
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const w = maxX - minX || 1; const h = maxY - minY || 1;
  const esc = 100 / Math.max(w, h);                        // encaixa no quadrado 100×100
  const dx = (100 - w * esc) / 2; const dy = (100 - h * esc) / 2;

  const partes = [];
  for (const poly of polys) {
    const anel = poly[0];
    // amostra: no máx ~90 pontos por anel (silhueta, não cartografia)
    const passo = Math.max(1, Math.floor(anel.length / 90));
    let d = '';
    for (let i = 0; i < anel.length; i += passo) {
      const [lng, lat] = anel[i];
      const x = ((lng * kx - minX) * esc + dx).toFixed(1);
      const y = ((-lat - minY) * esc + dy).toFixed(1);
      d += (d ? 'L' : 'M') + x + ' ' + y;
    }
    if (d) partes.push(d + 'Z');
  }
  return partes.join(' ');
}

// O mini-SVG pronto pra interpolar num template. Cacheado por id (a geometria de um
// estado não muda no meio da partida).
export function silhuetaDe(geometry, { id = null, tam = 26, cor = 'var(--cyan)' } = {}) {
  const chave = id ? `${id}|${tam}|${cor}` : null;
  if (chave && cache.has(chave)) return cache.get(chave);
  const d = pathDe(geometry);
  if (!d) return '';
  const svg = `<svg class="terr-silhueta" viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
    <path d="${d}" fill="rgba(53,224,255,.10)" stroke="${cor}" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  if (chave) cache.set(chave, svg);
  return svg;
}
