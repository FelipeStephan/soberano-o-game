// ═══════════════════════════════════════════════════════════════════════
// QUANDO O MUNDO ATACA VOCÊ — a metade que faltava da guerra
// ═══════════════════════════════════════════════════════════════════════
// `mundoVivo.js:148` tem uma linha que resume o buraco:
//     if (r.a === eu || r.b === eu) continue;   // guerra SUA é outra mecânica
// A intenção era certa (guerra do jogador não é evento ambiente), mas "a outra mecânica"
// nunca foi escrita. O resultado: **ninguém jamais atacava o jogador**. Toda guerra do
// jogo começava com o jogador clicando em "lançar ofensiva".
//
// Isso tornava impossível o cenário que o dono do jogo mais queria ver: o BRICS
// respondendo a um ataque AO BRASIL, quando o Brasil é você. Não faltava a reação —
// faltava o ataque. Este arquivo é a outra mecânica.
//
// ── O PRINCÍPIO ──────────────────────────────────────────────────────
// A agressão não é sorteio: é consequência. Ela nasce de coisas que o jogador fez —
// hostilizar alguém até o fundo, esquentar o mundo, ficar militarmente fraco enquanto
// alguém te odeia. Um jogador que apanha "por azar" aprende a salvar-e-recarregar; um
// que apanha por ter deixado a relação com a Rússia em -80 aprende a jogar.
import { PAISES, souEu, jogadorIso, oPais, dePais, verbo } from '../dados/paises.js';
import { forcaCombate, UNIDADES } from '../dados/forcas.js';
import { forcaDe, ajustarBase, fichaForca } from './forcasMundo.js';
import { coalizaoDoJogador, materializarCoalizao } from './coalizao.js';
import { aplicarEfeitos } from './efeitos.js';
import { estadosCarregados, estadosDe, estadoPorId, ehMeu, resolverAtaqueAoEstado, aplicarAtaqueAoEstado } from './territorio.js';
import { planoDeCampanha, aplicarCampanha } from './campanha.js';
import { portoDe } from '../dados/portosNavais.js';
import { rand } from './rng.js';

const BONUS_OGIVA = 3;

// ── CULPA DO JOGADOR ──────────────────────────────────────────────────
// O mundo não te ataca "por azar": ele responde ao que VOCÊ faz. Jogar limpo (sem
// ofensivas, mundo frio, relações ok) mantém a paz; atacar alguém ou deixar o clima de
// guerra ferver ACENDE o apetite dos rivais. Resolve a queixa "não fiz nada e me atacaram".
function ofensivasRecentes(estado) {
  const agora = estado.turno || 0;
  return (estado.minhasOfensivas || []).filter((o) => agora - (o.turno || 0) <= 6).length;
}
export function culpaDoJogador(estado) {
  const of = ofensivasRecentes(estado);
  const quente = (estado.temp_guerra || 30) / 100;
  const calmo = Math.min(1, (estado.turnosDeCalmaria ?? 10) / 10);   // começa em paz
  const porOfensiva = Math.min(1.6, of * 0.55);                       // cada ataque MEU pesa
  const porClima = quente > 0.6 ? (quente - 0.6) * 2.0 : 0;           // só o mundo MUITO quente puxa
  // BASE 0.45 (não 1): num mundo pacífico e sem provocação minha, o apetite fica baixo o
  // suficiente pra quase nunca cruzar o piso de risco. Provocar sobe rápido.
  let culpa = (0.45 + porOfensiva + porClima) * (1 - calmo * 0.55);
  return Math.max(0.12, culpa);
}

// Quanto tempo (em BATIDAS do mundo) o agressor leva pra MONTAR o ataque. Ataque grande
// demora mais a se armar (e é mais fácil de flagrar); ataque pequeno é rápido e sorrateiro.
export function duracaoMobilizacao(agressor) {
  return Math.max(2, Math.min(7, Math.round(2 + (agressor.forca || 30) / 22)));
}
// Chance de a INTELIGÊNCIA detectar a mobilização nesta batida. Intel alta vê cedo; intel
// baixa só percebe quando o tanque já está na fronteira — aí é surpresa. (EUA com intel
// alta NUNCA deveria apanhar sem aviso; país de intel baixa, sim.)
export function chanceDeteccao(estado, mob) {
  const intel = Number(estado.inteligencia || 0);
  const elapsed = 1 - (mob.restante / Math.max(1, mob.total));
  return Math.max(0, Math.min(0.98, (intel / 100) * 0.55 + elapsed * 0.4));
}

// ── O ALVO DA PRIMEIRA ONDA ───────────────────────────────────────────
// De onde o agressor parte: o porto naval dele (base real de projeção) ou, sem
// porto, o centro dos estados dele já carregados no catálogo. Sem nada, null.
function posicaoDoAgressor(iso) {
  const porto = portoDe(iso);
  if (porto) return { lat: porto.lat, lng: porto.lng };
  const deles = estadosDe(iso);
  if (!deles.length) return null;
  return {
    lat: deles.reduce((a, e) => a + e.lat, 0) / deles.length,
    lng: deles.reduce((a, e) => a + e.lng, 0) / deles.length,
  };
}

// O MEU estado mais provável de receber a primeira onda: o mais próximo do ponto
// de partida do agressor. É o que a inteligência revela ("a ofensiva mira a Flórida")
// e o que a invasão prioriza quando amadurece. Puro; devolve {id, nome} ou null
// (fallback silencioso quando o mapa ainda não carregou).
export function alvoProvavel(estado, agressorIso) {
  if (!estadosCarregados()) return null;
  const meus = estadosDe(estado.iso || 'USA').filter((e) => ehMeu(estado, e.id));
  if (!meus.length) return null;
  const pos = posicaoDoAgressor(agressorIso);
  if (!pos) return null;
  let melhor = null; let dMin = Infinity;
  for (const e of meus) {
    const d = Math.hypot(e.lat - pos.lat, (e.lng - pos.lng) * 0.7);
    if (d < dMin) { dMin = d; melhor = e; }
  }
  return melhor ? { id: melhor.id, nome: melhor.nome } : null;
}

// Quem tem motivo pra me atacar, e quanto. Devolve a lista ordenada por risco.
// Puro: não muda nada. A UI pode usar isto pra AVISAR o jogador antes ("a Rússia está
// mobilizando") — porque ser invadido sem aviso nenhum é injusto, e o jogo já tem um
// canal pra isso: o feed e os flashes urgentes.
export function ameacas(estado) {
  const eu = jogadorIso();
  const culpa = culpaDoJogador(estado);            // o mundo responde ao que VOCÊ faz
  const out = [];
  for (const [iso, info] of Object.entries(PAISES)) {
    if (souEu(iso)) continue;
    const rel = Number(estado[info.rel] ?? 0);
    if (rel > -35) continue;                       // ninguém invade quem tolera (aliados idem)

    const forca = forcaDe(estado, iso);
    const minha = forcaCombate(estado.forcas) + (estado.ogivas || 0) * BONUS_OGIVA;

    // Três ingredientes do apetite. Ódio é o gatilho; oportunidade é a permissão.
    const odio = (-rel - 35) / 65;                          // 0 em -35 · 1 em -100
    const oportunidade = Math.max(0, Math.min(1, (forca - minha * 0.55) / Math.max(1, forca)));
    const mundoQuente = (estado.temp_guerra || 30) / 100;

    // Dissuasão nuclear é real e precisa MORDER: ninguém invade quem tem 5.000 ogivas.
    // Sem este freio, o modelo mandaria a Rússia invadir os EUA num mundo quente.
    const dissuasao = Math.min(0.85, (estado.ogivas || 0) / 400);

    const risco = Math.max(0, (odio * 0.5 + oportunidade * 0.3 + mundoQuente * 0.2) * (1 - dissuasao) * culpa);
    if (risco < 0.18) continue;
    out.push({
      iso, nome: info.nome, rel: Math.round(rel), forca,
      risco: Math.round(risco * 100),
      motivo: rel <= -70 ? 'hostilidade aberta' : rel <= -50 ? 'relação em frangalhos' : 'oportunismo',
    });
  }
  return out.sort((a, b) => b.risco - a.risco);
}

// Roda no fechamento do turno: alguém decide invadir?
// Devolve null (o normal — invasão tem de ser rara pra ser evento) ou o agressor.
export function sortearAgressao(estado) {
  const lista = ameacas(estado);
  if (!lista.length) return null;
  const top = lista[0];
  // Teto duro: mesmo no pior cenário, ~14% por turno. Ser invadido todo turno não é
  // tensão, é castigo — e castigo previsível o jogador só aprende a evitar desligando o jogo.
  const p = Math.min(0.14, (top.risco / 100) * 0.16);
  if (rand() > p) return null;
  return top;
}

// ── A INVASÃO ─────────────────────────────────────────────────────────
// Resolve o ataque contra você. É aqui que a coalizão do jogador finalmente serve pra
// alguma coisa: seus aliados mandam aço, e esse aço entra na conta ANTES do primeiro
// tiro — e fica no mapa depois, como qualquer outro apoio.
export function resolverAgressao(estado, agressor) {
  const eu = jogadorIso();

  // 1. Quem vem me defender. Materializa ANTES da batalha: o reforço tem de existir
  //    no estado, não ser um número de mentira somado só nesta função.
  const coalizao = coalizaoDoJogador(estado, agressor.iso);
  const apoios = coalizao.membros.length
    ? materializarCoalizao(estado, coalizao, eu, 'defesa contra invasão')
    : [];

  // 2. As contas. Minha defesa = meu inventário real + ogivas + o que os aliados mandaram.
  const meuInventario = forcaCombate(estado.forcas);
  const boostAliado = fichaForca(estado, eu).boost;
  const minhaDefesa = meuInventario + (estado.ogivas || 0) * BONUS_OGIVA + boostAliado;

  // Defender em casa vale ouro: terreno conhecido, linhas curtas, população mobilizada.
  const vantagemCasa = 1.25;
  const meuPoder = minhaDefesa * vantagemCasa * (0.9 + rand() * 0.2);
  const poderDele = agressor.forca * (0.9 + rand() * 0.3);

  const rounds = [];
  let meu = meuPoder; let ini = poderDele;
  for (let n = 1; n <= 5 && meu > 0 && ini > 0; n += 1) {
    const dMeu = ini * (0.10 + rand() * 0.12);
    const dIni = meu * (0.12 + rand() * 0.14);
    meu = Math.max(0, meu - dMeu); ini = Math.max(0, ini - dIni);
    rounds.push({ n, meu: Math.round(meu), ini: Math.round(ini) });
  }
  const repeliu = meu > ini;

  // 3. As baixas caem no MEU inventário real — o jogador perde tanque de verdade.
  const perdaFrac = Math.max(0.04, Math.min(0.45, 1 - meu / Math.max(1, meuPoder)));
  const perdas = [];
  for (const u of UNIDADES) {
    const tenho = estado.forcas?.[u.id] || 0;
    if (!tenho) continue;
    const perdido = Math.round(tenho * perdaFrac * (0.5 + rand() * 0.7));
    if (perdido > 0) {
      estado.forcas[u.id] = Math.max(0, tenho - perdido);
      perdas.push({ id: u.id, nome: u.nome, icone: u.icone, perdido });
    }
  }

  // 4. O agressor também sangra — e isso FICA (ele volta mais fraco no próximo turno).
  ajustarBase(estado, agressor.iso, repeliu ? -Math.round(agressor.forca * 0.3) : -Math.round(agressor.forca * 0.1));

  // 5. Consequências no estado. Repelir uma invasão é o maior presente político que um
  //    presidente pode receber; não repelir é o fim.
  const relKey = PAISES[agressor.iso]?.rel;
  const efeitos = repeliu
    ? { aprovacao: 22, estabilidade: 6, temp_guerra: 28, poder_militar: -6, soft_power: 10, ...(relKey ? { [relKey]: -40 } : {}) }
    : { aprovacao: -26, estabilidade: -20, temp_guerra: 32, poder_militar: -22, territorio: -1, ...(relKey ? { [relKey]: -50 } : {}) };
  const mudancas = aplicarEfeitos(estado, efeitos);

  estado.emGuerra = estado.emGuerra || [];
  if (!estado.emGuerra.includes(agressor.iso)) estado.emGuerra.push(agressor.iso);

  // 6. TERRITÓRIO DE VERDADE: se a invasão avançou e o mapa está carregado, a primeira
  //    onda morde estados reais — PRIORIZANDO o alvo que a mobilização apontou
  //    (mob.alvoEstadoId). É aqui que reforçar o alvo revelado defende de fato: a
  //    guarnição posicionada nele entra na conta da razão (com a vantagem do defensor)
  //    e pode segurar o estado mesmo com a invasão "vencida" no agregado.
  let campanha = null;
  if (!repeliu && estadosCarregados() && estadosDe(eu).length) {
    const alvoId = agressor.alvoEstadoId && estadoPorId(agressor.alvoEstadoId) ? agressor.alvoEstadoId : null;
    // A PRIMEIRA ONDA (60% da força do agressor) bate primeiro no alvo apontado — e a
    // guarnição que você posicionou LÁ resolve o combate local com a vantagem do
    // defensor (1,6×, ver territorio.js). Se ela segura, a ofensiva morre na praia e
    // nenhum estado cai. É isto que faz "reforce antes que cheguem" ser conselho real.
    const primeiraOnda = poderDele * 0.6;
    let choque = null;
    if (alvoId) {
      choque = resolverAtaqueAoEstado(estado, alvoId, primeiraOnda);
      aplicarAtaqueAoEstado(estado, choque, agressor.iso);
    }
    if (choque?.segurou) {
      campanha = { segurou: true, caem: [], alvoId, alvoNome: choque.nome };
    } else {
      const razao = poderDele / Math.max(1, meuPoder);
      const plano = planoDeCampanha(estado, eu, razao, posicaoDoAgressor(agressor.iso), alvoId ? [alvoId] : null);
      if (plano.caem.length) aplicarCampanha(estado, plano, agressor.iso);
      const caem = plano.caem.map((e) => ({ id: e.id, nome: e.nome }));
      // o choque já tomou o alvo mesmo que a fração da campanha tenha arredondado a zero
      if (choque && !caem.some((e) => e.id === alvoId)) caem.unshift({ id: alvoId, nome: choque.nome });
      campanha = { segurou: false, caem, alvoId };
    }
  }

  let resumo = resumoDaInvasao(agressor, coalizao, repeliu);
  if (campanha?.caem?.length) {
    resumo += ` A primeira onda tomou ${campanha.caem.map((e) => e.nome).join(', ')}.`;
  } else if (campanha?.segurou && campanha.alvoNome) {
    resumo += ` A guarnição de ${campanha.alvoNome} segurou o alvo da primeira onda.`;
  }

  return {
    agressor, coalizao, apoios, rounds, repeliu, perdas, mudancas, campanha,
    meuInventario, boostAliado, minhaDefesa: Math.round(minhaDefesa), poderDele: Math.round(poderDele),
    resumo,
  };
}

// O texto que a Máquina lê. Precisa conter a coalizão: se a China mandou 34 pra me
// defender e a IA não souber, ela narra uma guerra bilateral que o jogador não jogou.
function resumoDaInvasao(agressor, coalizao, repeliu) {
  const base = `${maiusc(oPais(agressor.nome))} ${verbo(agressor.nome, 'INVADIU', 'INVADIRAM')} nosso território (relação ${agressor.rel}).`;
  const ajuda = coalizao.membros.length
    ? ` Nossos aliados responderam: ${coalizao.membros.map((m) => `${m.nome} ${verbo(m.nome, 'enviou', 'enviaram')} +${m.poder} (${m.motivo})`).join('; ')}.`
    : ' Nenhum aliado se mexeu: estamos sozinhos.';
  const fim = repeliu
    ? ' A invasão foi REPELIDA.'
    : ' A invasão AVANÇOU e perdemos território.';
  return base + ajuda + fim;
}

// Frase de manchete pro feed — sem jargão, com o peso do que é.
// Artigo em início de frase precisa de maiúscula: "os Estados Unidos e o Japão não
// deixaram..." vinha logo depois de um ponto final.
const maiusc = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function mancheteDaInvasao(res) {
  const N = maiusc(oPais(res.agressor.nome));
  const atacou = verbo(res.agressor.nome, 'atacou', 'atacaram');
  const rompeu = verbo(res.agressor.nome, 'rompeu', 'romperam');
  const quem = res.coalizao.membros.slice(0, 2).map((m) => m.nome);
  const quemComArtigo = quem.map((x) => oPais(x));

  if (res.repeliu) {
    return quem.length
      ? `${N} ${atacou} e não ${verbo(res.agressor.nome, 'passou', 'passaram')}. ${maiusc(quemComArtigo.join(' e '))} não deixaram você cair sozinho.`
      : `${N} ${atacou}. Você segurou. Sozinho.`;
  }
  return quem.length
    ? `${N} ${rompeu} nossas linhas. Nem o aço ${dePais(quem[0])} chegou a tempo.`
    : `${N} ${rompeu} nossas linhas e ninguém veio. Ninguém.`;
}
