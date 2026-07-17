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
import { donoDe, guarnicao, forcaGuarnicao, guarnicaoDefensivaDetalhe, estadoPorId } from '../jogo/territorio.js';
import { temIntel } from '../jogo/espionagem.js';
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
// Um estado em CONFLITO ativo (alguém tentando retomar) manda na cor acima de tudo:
// é a informação mais urgente do mapa. Depois vem a posse.
export function classificar(estado, idEstado) {
  const eu = estado.iso || 'USA';
  if (estado.conflitosEstado?.[idEstado]) return 'conflito';
  const dono = donoDe(estado, idEstado);
  const natural = estadoPorId(idEstado)?.pais || idEstado.split('-')[0];
  if (dono === eu && natural === eu) return 'meu';
  if (dono === eu) return 'conquistado';
  if (natural === eu) return 'perdido';
  return 'terceiro';
}

// ── RESUMO DE DOMÍNIOS (pro badge do país fechado) ────────────────────
// Em vez de explodir TODO país com território disputado em dezenas de estados o
// tempo todo (o que trava o globo quando o domínio cresce), o país fechado vira um
// SELO compacto. Este resumo alimenta esse selo: por país, quantos territórios eu
// tomei, quantos me tomaram e quantos estão em conflito AGORA. Chaveado pelo país
// NATURAL do estado (é onde o selo pousa no mapa).
export function resumoDominios(estado) {
  const eu = estado.iso || 'USA';
  const mapa = {};
  const get = (iso) => (mapa[iso] = mapa[iso] || { dominados: 0, perdidos: 0, conflito: 0 });
  for (const [id, dono] of Object.entries(estado.donoEstado || {})) {
    const natural = estadoPorId(id)?.pais || id.split('-')[0];
    if (dono === eu && natural !== eu) get(natural).dominados += 1;       // tomei de outro
    else if (dono !== eu && natural === eu) get(natural).perdidos += 1;   // perderam pra mim… digo, perdi
  }
  for (const id of Object.keys(estado.conflitosEstado || {})) {
    const natural = estadoPorId(id)?.pais || id.split('-')[0];
    get(natural).conflito += 1;
  }
  return mapa;
}

// AZUL é a cor da minha nação — e agora também dos territórios que TOMEI. Um estado
// conquistado não é mais "âmbar de outro": é meu, pinta de azul. O tom homeland (ciano)
// e o tom conquista (azul-royal) só se distinguem de perto; de longe o mapa diz "isto é
// tudo meu". Vermelho = perdido (o alvo da retomada). Laranja-fogo = disputa AGORA.
const CORES = {
  meu:         { cap: 'rgba(53,224,255,.42)',  linha: 'rgba(120,235,255,.85)' },
  conquistado: { cap: 'rgba(58,150,255,.44)',  linha: 'rgba(130,190,255,.92)' },
  perdido:     { cap: 'rgba(255,59,92,.46)',   linha: 'rgba(255,120,150,.9)' },
  conflito:    { cap: 'rgba(255,92,44,.52)',   linha: 'rgba(255,160,80,1)' },
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
  // Território em conflito sobe: o relevo grita "aqui está pegando fogo".
  if (estado.conflitosEstado?.[f.properties.id]) return 0.05;
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
  // Guarnição real (sua) OU estimada (do defensor NPC) — assim território inimigo
  // deixa de mentir "aberto" quando na verdade tem um exército inteiro parado nele.
  const det = guarnicaoDefensivaDetalhe(estado, p.id);
  const g = det.g;
  const fc = det.forca;
  const estimada = det.estimada;
  // SEGREDO DE ESTADO: a força que um país guarda em cada estado é OCULTA. Só se revela
  // se você tiver espionagem ativa sobre o dono (vazamento 'forcas_estado').
  const oculto = estimada && !temIntel(estado, dono, 'forcas_estado');
  const unidades = Object.entries(g).filter(([, q]) => q > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Tag e cor do trilho por relação com o território (a mesma família visual do
  // tooltip de cidade: chanfro, trilho, etiqueta numa linha própria — não colada).
  const conf = estado.conflitosEstado?.[p.id];
  const TAG = {
    meu: 'SEU TERRITÓRIO', conquistado: 'CONQUISTADO POR VOCÊ',
    perdido: 'PERDIDO — RECONQUISTE', conflito: '⚔ EM CONFLITO',
    terceiro: esc(nomePais(dono)).toUpperCase(),
  };
  const TOM = { meu: 'meu', conquistado: 'conquistado', perdido: 'perdido', conflito: 'conflito', terceiro: 'terceiro' };
  const cta = cls === 'conflito' ? 'reforce AGORA ou perca o território'
    : (cls === 'meu' || cls === 'conquistado') ? 'clique para reforçar'
      : (cls === 'perdido' && !teatro) ? 'clique para planejar a retomada'
        : (teatro && cls !== 'meu' && cls !== 'conquistado') ? '⌖ clique para DESIGNAR ALVO' : '';

  return `<div class="gt-cidade estado tom-${TOM[cls]}" style="display:block;position:static">
    <div class="gtc2-tag">${TAG[cls]}</div>
    <div class="gtc2-nome">${esc(p.nome)}</div>
    <div class="gtc2-meta">${esc(p.tipo || 'Território')}</div>
    ${conf ? `<div class="gtc2-conf">${esc(nomePais(conf.por))} avança para retomar · pressão ${Math.round(conf.intensidade || 0)}/100</div>` : ''}
    ${oculto
      ? ''
      : fc
        ? `<div class="gtc2-guarn"><b>Guarnição · força ${fc}${estimada ? ' <small class="gtc2-est">intel</small>' : ''}</b>
            <div class="tt-un">${unidades.map(([u, q]) => `<span>${UNIDADE_POR_ID[u]?.icone || ''} ${q.toLocaleString('pt-BR')} ${esc(UNIDADE_POR_ID[u]?.nome || u)}</span>`).join('')}</div></div>`
        : '<div class="gtc2-vazio">Sem tropas posicionadas · território aberto</div>'}
    ${cta ? `<div class="gtc2-cta ${teatro && cls !== 'meu' && cls !== 'conquistado' ? 'armado' : ''}">${cta}</div>` : ''}
  </div>`;
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
    return `<div class="gt-cidade tom-tropa" style="display:block;position:static">
      <div class="gtc2-nome">${esc(d.rot.split(' · ')[0])}</div>
      <div class="gtc2-meta">${esc(d.rot.split(' · ')[1] || '')}</div></div>`;
  }
  const tom = d.capitalPais ? 'capital' : d.capitalEstado ? 'estadual' : 'cidade';
  const sel = d.capitalPais ? 'CAPITAL NACIONAL' : d.capitalEstado ? 'CAPITAL ESTADUAL' : 'CIDADE';
  const pop = d.pop >= 1e6 ? `${(d.pop / 1e6).toFixed(1)} milhões` : `${Math.round(d.pop / 1000)} mil`;
  return `<div class="gt-cidade tom-${tom}" style="display:block;position:static">
    <div class="gtc2-tag">${sel}</div>
    <div class="gtc2-nome">${esc(d.nome)}</div>
    <div class="gtc2-meta">${pop} de habitantes${d.estado ? ` · ${esc(d.estado)}` : ''}</div>
    ${d.capitalPais ? `<p class="gtc2-nota"><b>Sede do governo de ${esc(nomePais(d.pais))}.</b> Tomar a capital derruba o regime — é o primeiro alvo de qualquer invasão séria.</p>` : ''}
  </div>`;
}
