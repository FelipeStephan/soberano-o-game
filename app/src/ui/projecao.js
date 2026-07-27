// ═══════════════════════════════════════════════════════════════════════
// PROJEÇÃO — achatar um país num SVG que cabe na cabine
// ═══════════════════════════════════════════════════════════════════════
// Isto morava dentro de `mapaEstados.js` e era usado por uma tela só. O MODO DEFESA
// precisa exatamente da mesma matemática (o meu país achatado, os estados clicáveis),
// e duplicar a projeção seria criar duas verdades sobre a forma do mesmo país. Uma
// única fonte: quem quiser desenhar um país em 2D pergunta aqui.
//
// A correção de aspecto por cos(lat) é o detalhe que impede a Rússia de sair como uma
// panqueca e o Chile como um fio: mais perto do polo, mais estreito vale um grau de
// longitude. Sem ela o mapa mente sobre a forma do próprio país do jogador.

// Projeta as features num viewBox 2D. Devolve o conversor + as dimensões calculadas.
export function projetar(feats, W = 680, pad = 16) {
  let minLng = Infinity; let maxLng = -Infinity; let minLat = Infinity; let maxLat = -Infinity;
  const anelBBox = (anel) => {
    for (const [lng, lat] of anel) {
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    }
  };
  const varrer = (g) => {
    if (!g) return;
    if (g.type === 'Polygon') g.coordinates.forEach(anelBBox);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p.forEach(anelBBox));
  };
  feats.forEach((f) => varrer(f.geometry));
  const midLat = (minLat + maxLat) / 2;
  const kx = Math.max(0.15, Math.cos((midLat * Math.PI) / 180));
  const gw = (maxLng - minLng) * kx || 1; const gh = (maxLat - minLat) || 1;
  const escala = (W - pad * 2) / gw;
  const H = gh * escala + pad * 2;
  const toXY = (lng, lat) => [pad + (lng - minLng) * kx * escala, pad + (maxLat - lat) * escala];
  return { toXY, W, H, minLng, maxLng, minLat, maxLat };
}

function anelParaPath(anel, toXY) {
  return anel.map(([lng, lat], i) => `${i ? 'L' : 'M'}${toXY(lng, lat).map((n) => n.toFixed(1)).join(' ')}`).join('') + 'Z';
}

export function geoParaPath(g, toXY) {
  if (!g) return '';
  if (g.type === 'Polygon') return g.coordinates.map((a) => anelParaPath(a, toXY)).join('');
  if (g.type === 'MultiPolygon') return g.coordinates.map((p) => p.map((a) => anelParaPath(a, toXY)).join('')).join('');
  return '';
}

// CENTRO VISUAL de uma feature no plano projetado — é onde o pino/pulso do estado
// deve nascer. Média dos vértices do maior anel: não é o centroide exato, mas é o que
// a vista lê como "o meio deste estado", e nunca cai fora da silhueta em país côncavo.
export function centroProjetado(g, toXY) {
  if (!g) return null;
  const aneis = g.type === 'Polygon' ? g.coordinates
    : g.type === 'MultiPolygon' ? g.coordinates.map((p) => p[0]) : [];
  if (!aneis.length) return null;
  const maior = aneis.reduce((a, b) => (b.length > a.length ? b : a));
  let sx = 0; let sy = 0;
  for (const [lng, lat] of maior) { const [x, y] = toXY(lng, lat); sx += x; sy += y; }
  return { x: sx / maior.length, y: sy / maior.length };
}

// Carrega o GeoJSON de estados de um país (o mesmo que o globo usa). Devolve [] em
// vez de explodir: país sem malha continua jogável, só perde o mapa.
export async function carregarMalha(iso) {
  try {
    const geo = await fetch(`/estados/${iso}.geojson`).then((r) => r.json());
    return geo?.features || [];
  } catch { return []; }
}
