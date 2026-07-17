// ═══════════════════════════════════════════════════════════════════════
// CAMADA TÁTICA — o globo desce ao nível do estado
// ═══════════════════════════════════════════════════════════════════════
// O que este arquivo resolve visualmente: no modo país, o mapa responde "de quem
// é o Brasil". No modo tático, ele responde "quem segura o Rio, com o quê, e o
// que eu perdi". São perguntas diferentes e por isso é uma camada separada, que
// só carrega quando o jogador pede (os 862 KB de estados nunca tocam a home).
//
// A gramática de cor é deliberadamente pobre — quatro cores e pronto. Mapa tático
// com paleta de arco-íris é bonito no print e inútil na decisão:
//   ciano  = seu território
//   vermelho = território SEU que você PERDEU (é o alvo da reconquista)
//   âmbar  = território que você TOMOU de outro
//   cinza  = de terceiros, não é da sua conta agora
import { donoDe, guarnicao, forcaGuarnicao, estadoPorId } from '../jogo/territorio.js';
import { UNIDADE_POR_ID } from '../dados/forcas.js';
import { PAISES } from '../dados/paises.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomePais = (iso) => PAISES[iso]?.nome || iso;

// ── O QUE ENTRA NO MAPA TÁTICO ────────────────────────────────────────
// O filtro é de DESIGN, não de performance: você não precisa ver as províncias da
// Indonésia enquanto decide se reforça o Rio. O mapa tático responde a uma pergunta
// só — "onde eu estou exposto?" — e isso é o SEU território, o que te tomaram, o
// que você tomou e o de quem está em guerra com você. Os outros 865 estados do
// planeta são ruído bonito: cada um deles seria um polígono extrudado e uma decisão
// a menos de clareza.
//
// (Nota pra quem vier depois: cheguei aqui achando que os 892 estados travavam o
// renderizador. Não travavam — o rAF estava parado porque a aba de teste estava em
// segundo plano. O filtro fica porque é a leitura certa do mapa, não porque salva
// frames. Se um dia precisar mostrar o mundo todo, o custo real é menor do que eu
// supus; meça antes de recusar.)
// `selecionado` é o país que o jogador acabou de clicar no globo: se ele escolheu
// olhar a China, as províncias da China entram no mapa mesmo sem guerra nenhuma.
// É o que transforma a seleção num FILTRO — clico no país, vejo os estados dele.
export function estadosVisiveis(estado, todos, selecionado = null) {
  const eu = estado.iso || 'USA';
  const relevantes = new Set([eu, ...(estado.emGuerra || [])]);
  if (selecionado) relevantes.add(selecionado);
  for (const dono of Object.values(estado.donoEstado || {})) relevantes.add(dono);
  return todos.filter((f) => {
    const p = f.properties || f;
    if (relevantes.has(p.pais)) return true;
    // exceções: um estado solto que mudou de dono (perdido/conquistado) sempre aparece
    const excecao = estado.donoEstado?.[p.id];
    return Boolean(excecao) && (excecao === eu || p.pais === eu);
  });
}

// ── COR DO ESTADO ─────────────────────────────────────────────────────
export function classificar(estado, idEstado) {
  const eu = estado.iso || 'USA';
  const dono = donoDe(estado, idEstado);
  const natural = estadoPorId(idEstado)?.pais || idEstado.split('-')[0];
  if (dono === eu && natural === eu) return 'meu';
  if (dono === eu) return 'conquistado';
  if (natural === eu) return 'perdido';
  return 'terceiro';
}

const CORES = {
  meu:         { cap: 'rgba(53,224,255,.42)',  linha: 'rgba(120,235,255,.85)' },
  conquistado: { cap: 'rgba(255,176,32,.42)',  linha: 'rgba(255,205,110,.85)' },
  perdido:     { cap: 'rgba(255,59,92,.46)',   linha: 'rgba(255,120,150,.9)' },
  terceiro:    { cap: 'rgba(120,144,180,.14)', linha: 'rgba(150,175,210,.28)' },
};

export function corEstado(estado, f) {
  return CORES[classificar(estado, f.properties.id)].cap;
}
export function linhaEstado(estado, f) {
  return CORES[classificar(estado, f.properties.id)].linha;
}
// Território com tropa fica mais alto: relevo é leitura instantânea de "aqui tem gente".
export function alturaEstado(estado, f) {
  const g = guarnicao(estado, f.properties.id);
  const fc = forcaGuarnicao(g);
  if (!fc) return 0.006;
  return Math.min(0.05, 0.008 + fc / 400);
}

// ── TOOLTIP DO ESTADO ─────────────────────────────────────────────────
export function tipEstado(estado, f, teatro = false) {
  const p = f.properties;
  const cls = classificar(estado, p.id);
  const dono = donoDe(estado, p.id);
  const g = guarnicao(estado, p.id);
  const fc = forcaGuarnicao(g);
  const unidades = Object.entries(g).filter(([, q]) => q > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 4);

  const SELO = {
    meu: '<span class="gtc-sub" style="border-color:#35e0ff;color:#35e0ff">SEU TERRITÓRIO</span>',
    conquistado: '<span class="gtc-sub" style="border-color:#ffb020;color:#ffb020">CONQUISTADO POR VOCÊ</span>',
    perdido: '<span class="gtc-sub gtc-guerra">PERDIDO — RECONQUISTE</span>',
    terceiro: `<span class="gtc-sub">${esc(nomePais(dono)).toUpperCase()}</span>`,
  };

  return `<b>${esc(p.nome)}</b>${SELO[cls]}
    <p>${esc(p.tipo)} · ${esc(nomePais(dono))}</p>
    ${fc ? `<p><b>Guarnição:</b> força ${fc}</p>
      <div class="tt-un">${unidades.map(([u, q]) => `<span>${UNIDADE_POR_ID[u]?.icone || ''} ${q.toLocaleString('pt-BR')} ${esc(UNIDADE_POR_ID[u]?.nome || u)}</span>`).join('')}</div>`
    : '<p class="tt-vazio">Sem tropas posicionadas. Território aberto.</p>'}
    ${cls === 'meu' || cls === 'conquistado' ? '<span class="gtc-cta">clique para reforçar</span>' : ''}
    ${cls === 'perdido' && !teatro ? '<span class="gtc-cta">clique para planejar a retomada</span>' : ''}
    ${teatro && cls !== 'meu' && cls !== 'conquistado' ? '<span class="gtc-cta armado">⌖ clique para DESIGNAR ALVO</span>' : ''}`;
}

// ── PONTOS: cidades + tropas ──────────────────────────────────────────
// Tudo numa camada só (pointsData), discriminado por `tipo`. Dois motivos: o
// globe.gl só tem uma camada de pontos, e o pointLabel dela já dá o "nome só no
// hover" que o mapa precisa pra não virar sopa de letrinha.

// As tropas viram um punhado de pontinhos ao redor do centro do estado — não um
// número. Um enxame comunica "muita gente aqui" mais rápido que "80.000".
function pontinhosDeTropa(centro, n, cor, rot) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    // espiral determinística: mesmo estado, mesmo desenho a cada frame (nada de
    // tropa tremendo no mapa por causa de Math.random no render)
    const a = i * 2.399963;                    // ângulo áureo
    const r = 0.55 + Math.sqrt(i) * 0.42;
    pts.push({
      tipo: 'tropa', cor, rot,
      lat: centro.lat + Math.sin(a) * r,
      lng: centro.lng + Math.cos(a) * r * 1.35,
    });
  }
  return pts;
}

// Quantos pontinhos: log, não linear. 50 mil e 500 mil precisam parecer diferentes
// sem que o segundo cubra o continente.
//
// A escala precisou do ×100: a "força" de uma guarnição de infantaria é um número
// pequeno (o poder de um soldado é 0,00008), então o Rio com 7.000 homens dava
// força 0,8 → log10(1,8) → DOIS pontinhos. Duas bolinhas não dizem "aqui tem
// exército". Deslocando a escala, a mesma guarnição vira um punhado visível e o
// contraste entre um estado forte e um vazio aparece de longe.
function quantosPontos(forca) {
  if (forca <= 0) return 0;
  return Math.max(2, Math.min(13, Math.round(Math.log10(forca * 100 + 1) * 4)));
}

export function montarPontos(estado, { cidades, estados, mostrarTropas = true, mostrarCidades = true }) {
  const out = [];

  if (mostrarCidades) {
    // Mesma lógica dos polígonos: só as cidades dos países que estão no mapa. As
    // 968 do mundo inteiro seriam um oceano de bolinhas sem sentido de leitura.
    const paisesNoMapa = new Set(estados.map((e) => e.pais));
    for (const c of cidades) {
      if (!paisesNoMapa.has(c.pais)) continue;
      out.push({
        tipo: 'cidade', ...c,
        cor: c.capitalPais ? '#ffd76a' : c.capitalEstado ? '#9fd8ff' : 'rgba(200,220,255,.5)',
        raio: c.capitalPais ? 0.28 : c.capitalEstado ? 0.18 : 0.1,
      });
    }
  }

  if (mostrarTropas) {
    for (const e of estados) {
      const g = guarnicao(estado, e.id);
      const fc = forcaGuarnicao(g);
      if (!fc) continue;
      const cls = classificar(estado, e.id);
      // VERDE = tropa defendendo (sua). VERMELHO = tropa de quem tomou de você.
      // A cor responde "isto me protege ou me ameaça?", não "de que país é".
      const cor = cls === 'meu' || cls === 'conquistado' ? '#22e0a0' : '#ff3b5c';
      const rot = `${e.nome} · força ${fc}`;
      out.push(...pontinhosDeTropa(e, quantosPontos(fc), cor, rot));
    }
  }
  return out;
}

// Rótulo do ponto no hover — o "não precisa ter nome, aparece no mouse".
export function tipPonto(d) {
  if (d.tipo === 'tropa') {
    return `<div class="gt-conflito" style="display:block;position:static;width:auto">
      <b>${esc(d.rot.split(' · ')[0])}</b><p>${esc(d.rot.split(' · ')[1] || '')}</p></div>`;
  }
  const sel = d.capitalPais ? 'CAPITAL NACIONAL' : d.capitalEstado ? 'CAPITAL ESTADUAL' : 'CIDADE';
  const pop = d.pop >= 1e6 ? `${(d.pop / 1e6).toFixed(1)} milhões` : `${Math.round(d.pop / 1000)} mil`;
  return `<div class="gt-conflito" style="display:block;position:static;width:auto">
    <b>${esc(d.nome)}</b>
    <span class="gtc-sub" ${d.capitalPais ? 'style="border-color:#ffd76a;color:#ffd76a"' : ''}>${sel}</span>
    <p>${pop} de habitantes${d.estado ? ` · ${esc(d.estado)}` : ''}</p>
    ${d.capitalPais ? `<p><b>Sede do governo de ${esc(nomePais(d.pais))}.</b> Tomar a capital derruba o regime — e é o primeiro alvo de qualquer invasão séria.</p>` : ''}
  </div>`;
}
