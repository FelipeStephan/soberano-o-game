// ═══════════════════════════════════════════════════════════════════════
// FROTAS — movimento por TEMPO, detecção por RADAR, combate frota × frota
// ═══════════════════════════════════════════════════════════════════════
// O que faltava: a frota TELEPORTAVA. Você mandava e ela aparecia lá. Agora ela ZARPA de
// um porto (dados/portosNavais.js) e LEVA TEMPO pra chegar — tempo proporcional à distância,
// nunca instantâneo, nunca uma hora. O deslocamento é guardado no PRÓPRIO objeto da frota
// (origem/destino/partiuEm/chegaEm), não numa animação solta — então é determinístico e,
// no dia do online, cada cliente interpola a mesma rota a partir dos mesmos números.
//
// Sobre esse trilho entram duas mecânicas que o jogo pedia: DETECÇÃO (você enxerga a frota
// inimiga se chegar perto o bastante — o radar dela contra a furtividade dela) e COMBATE
// NAVAL (frota × frota, a MAIOR força vence, com baixas proporcionais à briga).
import { UNIDADES, techDaFrota } from '../dados/forcas.js';
import { PAISES } from '../dados/paises.js';
import { portoDe } from '../dados/portosNavais.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Distância no globo, achatando a longitude (a mesma métrica do resto do jogo).
export function distGraus(a, b) { return Math.hypot(a.lat - b.lat, (a.lng - b.lng) * 0.7); }

// DURAÇÃO ∝ DISTÂNCIA. Hop curto na costa ~8s; travessia transoceânica ~90s. É o "não
// instantâneo, mas não uma hora" — e escala linear com a distância (quanto menor, menos tempo).
export function duracaoTransito(dg) { return Math.round(clamp(dg * 750, 8000, 90000)); }

// ── ROTA POR ÁGUA (polilinha) ─────────────────────────────────────────
// A frota não pode importar o globo (camadas!), então quem SABE calcular rota marítima
// (ui/globo.js, via jogo/rotasMar.js) REGISTRA um provedor aqui na montagem. Sem provedor
// (ou com a malha ainda montando), o trânsito cai na reta antiga — nunca quebra.
let provedorRota = null;
export function setProvedorRota(fn) { provedorRota = typeof fn === 'function' ? fn : null; }

// Delta de longitude com WRAP no antimeridiano: uma rota que cruza o Pacífico salta de
// +179 pra -179 — sem isto, a interpolação varreria o mapa inteiro no sentido errado.
function dLngWrap(a, b) { let d = b - a; if (d > 180) d -= 360; else if (d < -180) d += 360; return d; }
function distSeg(p, q) { return Math.hypot(q.lat - p.lat, dLngWrap(p.lng, q.lng) * 0.7); }
function normLng(l) { return l > 180 ? l - 360 : l < -180 ? l + 360 : l; }

// Comprimento REAL da polilinha (soma dos segmentos, com wrap de longitude).
export function comprimentoRota(rota) {
  let t = 0;
  for (let i = 1; i < rota.length; i += 1) t += distSeg(rota[i - 1], rota[i]);
  return t;
}

// Ponto a uma FRAÇÃO (0–1) do comprimento da rota — interpola por distância acumulada,
// segmento a segmento, pra velocidade constante ao longo da polilinha.
function pontoNaRota(rota, frac) {
  const total = comprimentoRota(rota);
  if (total <= 0) return { lat: rota[rota.length - 1].lat, lng: rota[rota.length - 1].lng };
  let alvo = clamp(frac, 0, 1) * total;
  for (let i = 1; i < rota.length; i += 1) {
    const seg = distSeg(rota[i - 1], rota[i]);
    if (alvo <= seg || i === rota.length - 1) {
      const t = seg > 0 ? clamp(alvo / seg, 0, 1) : 1;
      return {
        lat: rota[i - 1].lat + (rota[i].lat - rota[i - 1].lat) * t,
        lng: normLng(rota[i - 1].lng + dLngWrap(rota[i - 1].lng, rota[i].lng) * t),
      };
    }
    alvo -= seg;
  }
  return { lat: rota[rota.length - 1].lat, lng: rota[rota.length - 1].lng };
}

// Põe a frota EM TRÂNSITO até `destino`, a partir de AGORA (Date.now()). Guarda tudo no
// objeto — quem desenha só interpola. Devolve a duração em ms.
// `rota` (opcional) é uma polilinha [{lat,lng},...] por ÁGUA; sem ela, tenta o provedor
// registrado (rotaMaritima do globo); se nada vier, reta como sempre (fallback seguro).
export function iniciarTransito(fr, destino, agora, rota) {
  const origem = { lat: fr.lat, lng: fr.lng };
  fr.origem = origem;
  fr.destino = { lat: destino.lat, lng: destino.lng };
  let r = Array.isArray(rota) && rota.length >= 2 ? rota : null;
  if (!r && provedorRota) {
    try { const p = provedorRota(origem, fr.destino); if (Array.isArray(p) && p.length >= 2) r = p; } catch { r = null; }
  }
  fr.rota = r ? r.map((p) => ({ lat: p.lat, lng: p.lng })) : null;
  if (!fr.rota) delete fr.rota;
  // Duração pelo comprimento REAL do caminho (contornar a África demora mais que a reta),
  // com a MESMA constante de sempre (750ms/grau, clamp 8s–90s).
  const dist = fr.rota ? comprimentoRota(fr.rota) : distGraus(origem, fr.destino);
  fr.partiuEm = agora;
  fr.chegaEm = agora + duracaoTransito(dist);
  return fr.chegaEm - fr.partiuEm;
}

export function emTransito(fr, agora) { return !!(fr && fr.destino && fr.chegaEm && agora < fr.chegaEm); }

// Posição interpolada AGORA, com easing de embarcação (arranca suave, cruza, freia suave).
// Com `fr.rota`, o easing anda AO LONGO da polilinha (distância acumulada por segmento) —
// a frota costeia o continente; sem rota, reta origem→destino como antes.
export function posicaoAtual(fr, agora) {
  if (!fr.destino || !fr.chegaEm || !fr.origem) return { lat: fr.lat, lng: fr.lng, k: 1 };
  const dur = Math.max(1, fr.chegaEm - fr.partiuEm);
  const k = clamp((agora - fr.partiuEm) / dur, 0, 1);
  const e = k < 0.15 ? (k / 0.15) ** 2 * 0.15
    : k > 0.85 ? 1 - ((1 - k) / 0.15) ** 2 * 0.15
      : 0.15 + (k - 0.15) / 0.70 * 0.70;
  if (Array.isArray(fr.rota) && fr.rota.length >= 2) {
    const p = pontoNaRota(fr.rota, e);
    return { lat: p.lat, lng: p.lng, k };
  }
  return {
    lat: fr.origem.lat + (fr.destino.lat - fr.origem.lat) * e,
    lng: fr.origem.lng + (fr.destino.lng - fr.origem.lng) * e,
    k,
  };
}

// O TIQUE do movimento: atualiza a posição de cada frota em trânsito e ASSENTA as que
// chegaram (limpa os campos de trânsito). Devolve as que chegaram AGORA (pra notificar).
// Serve tanto pras minhas frotas quanto pras inimigas (NPC também navega).
export function tickTransito(frotas, agora) {
  const chegaram = [];
  for (const fr of frotas || []) {
    if (!fr.destino) continue;
    const p = posicaoAtual(fr, agora);
    fr.lat = p.lat; fr.lng = p.lng;
    if (agora >= fr.chegaEm) {
      fr.lat = fr.destino.lat; fr.lng = fr.destino.lng;
      delete fr.origem; delete fr.destino; delete fr.partiuEm; delete fr.chegaEm; delete fr.rota;
      chegaram.push(fr);
    }
  }
  return chegaram;
}

// Força de combate CRUA de uma frota (não arredondada) — é o que o combate compara, pra
// não empatar tudo em zero (o poder de um navio é pequeno; arredondar apagava a diferença).
export function forcaFrota(fr) {
  let t = 0;
  for (const u of UNIDADES) t += (fr?.unidades?.[u.id] || 0) * u.poder;
  return t;
}
// Poder naval LEGÍVEL pra exibir (índice 1–99): a força crua ×10, pra o jogador comparar
// "23 contra 4" em vez de "2 contra 0".
export function poderNaval(fr) { return Math.max(1, Math.round(forcaFrota(fr) * 10)); }

// ── DETECÇÃO ───────────────────────────────────────────────────────────
// Minhas frotas enxergam uma frota inimiga se ela cair dentro do alcance de detecção do
// meu radar — descontada a FURTIVIDADE dela (submarino puro é quase invisível). Devolve as
// inimigas VISÍVEIS agora, com a distância e quem as pegou.
export function frotasDetectadas(minhas, inimigas, agora) {
  const vis = [];
  for (const ini of inimigas || []) {
    const techI = techDaFrota(ini.unidades || {});
    let melhor = null;
    for (const m of minhas || []) {
      const techM = techDaFrota(m.unidades || {});
      const alcance = Math.max(4, techM.deteccao * (1 - techI.furtividade / 140));
      const d = distGraus(m, ini);
      if (d <= alcance && (!melhor || d < melhor.d)) melhor = { d, por: m };
    }
    if (melhor) vis.push({ frota: ini, distancia: melhor.d, porFrota: melhor.por });
  }
  return vis.sort((a, b) => a.distancia - b.distancia);
}

// ── COMBATE FROTA × FROTA ────────────────────────────────────────────────
// A MAIOR força vence — direto, como o dono pediu. O vencedor não sai ileso: perde uma
// fatia proporcional a quão apertada foi a briga (goleada quase não custa; vitória no
// detalhe machuca). O perdedor é destruído. Determinístico (sem dado) — no online, os dois
// lados calculam o mesmo resultado a partir das mesmas forças.
export function resolverBatalhaNaval(atacante, defensor) {
  const fa = forcaFrota(atacante);
  const fd = forcaFrota(defensor);
  const venceu = fa >= fd;
  const razaoPerdedor = venceu ? fd / Math.max(1, fa) : fa / Math.max(1, fd);
  const perdaVencedor = clamp(razaoPerdedor * 0.6, 0.03, 0.85);
  // aplica as baixas no VENCEDOR (o perdedor é removido pela UI)
  const venc = venceu ? atacante : defensor;
  const perd = venceu ? defensor : atacante;
  const sobreviv = {};
  for (const [k, q] of Object.entries(venc.unidades || {})) {
    const s = Math.round(q * (1 - perdaVencedor));
    if (s > 0) sobreviv[k] = s;
  }
  return {
    venceu, forcaAtacante: fa, forcaDefensor: fd,
    perdaVencedorPct: Math.round(perdaVencedor * 100),
    vencedor: venc, perdedor: perd, sobreviventesVencedor: sobreviv,
  };
}

// ── FROTAS INIMIGAS (NPC) — pra ter o que caçar no mar ───────────────────
// Sem frota inimiga no mapa, "detectar e atacar no mar" não existe. Isto semeia patrulhas
// dos países HOSTIS/RIVAIS com marinha, ancoradas perto do porto real de cada um. A
// composição sai da força do país (mais forte = esquadra maior). No online, essas viram as
// frotas dos outros JOGADORES — a mesma mecânica, sem NPC.
function composicaoFrotaNPC(forca) {
  const navios = Math.max(2, Math.round(forca / 14));
  const submarinos = Math.max(0, Math.round(forca / 30));
  const porta_avioes = forca >= 70 ? 1 : 0;
  const u = { navios };
  if (submarinos) u.submarinos = submarinos;
  if (porta_avioes) u.porta_avioes = porta_avioes;
  return u;
}

export function semearFrotasInimigas(estado, ondeEsta, { max = 5 } = {}) {
  estado.frotasInimigas = estado.frotasInimigas || [];
  if (estado.frotasInimigas.length) return estado.frotasInimigas;
  const eu = estado.iso || 'USA';
  const candidatos = Object.entries(PAISES)
    .filter(([code]) => code !== eu && portoDe(code))
    .map(([code, info]) => ({ code, info, rel: Number(estado[info.rel] ?? 0), forca: info.forca || 30 }))
    // hostis e rivais primeiro; entre eles, os mais fortes
    .sort((a, b) => (a.rel - b.rel) || (b.forca - a.forca))
    .slice(0, max);
  for (const c of candidatos) {
    const p = portoDe(c.code);
    // ancora um pouco AO LARGO do porto (empurra pro mar na direção oposta ao centro do país)
    const centro = ondeEsta?.(c.code) || p;
    const dx = p.lng - centro.lng, dy = p.lat - centro.lat;
    const n = Math.hypot(dx, dy) || 1;
    estado.frotasInimigas.push({
      id: `fi_${c.code}`,
      code: c.code, nome: c.info.nome,
      lat: p.lat + (dy / n) * 2.5, lng: p.lng + (dx / n) * 2.5,
      unidades: composicaoFrotaNPC(c.forca),
      presenca: Math.round(c.forca / 3),
      npc: true,
    });
  }
  return estado.frotasInimigas;
}
