// ═══════════════════════════════════════════════════════════════════════
// CAMPANHA — a guerra deixa de ser um interruptor e vira um mapa
// ═══════════════════════════════════════════════════════════════════════
// O que este arquivo conserta: a invasão era binária. Ou `territorio: 1` e o país
// inteiro virava seu, ou nada. Uma ofensiva que quase deu certo e uma que foi
// aniquilada terminavam no mesmo lugar — o nada. Isso é ruim de duas formas:
// apaga o esforço do jogador e mente sobre como guerra funciona. Ninguém "toma a
// Ucrânia"; toma-se Donetsk, Lugansk, e para na porta de Kiev.
//
// Agora a ofensiva RENDE TERRITÓRIO PROPORCIONAL. A razão entre a força que você
// mandou e a defesa que te esperava decide QUANTOS estados caem — e quais. Você
// pode perder a campanha e ainda ficar com três estados de fronteira; pode vencer
// e ainda não ter tomado a capital. É essa fração que vira o espólio, o petróleo
// e a linha vermelha no mapa.
//
// A ordem em que caem não é sorteio: começa pela fronteira (onde a bota entra),
// avança pelo interior, e a CAPITAL é a última — porque é onde está o governo, o
// exército e a vontade de resistir. Tomar 90% de um país e não tomar a capital é
// exatamente a história de metade das guerras do século XX.
import {
  estadosDe, estadoPorId, guarnicaoDefensiva, estadoCapitalDe,
  resolverAtaqueAoEstado, aplicarAtaqueAoEstado,
} from './territorio.js';
import { PAISES } from '../dados/paises.js';
import { UNIDADES, poderDeploy, custoDeploy } from '../dados/forcas.js';
import { reacaoDeBloco } from '../dados/blocos.js';
import { aplicarEfeitos } from './efeitos.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ── QUANTO DO PAÍS CAI ────────────────────────────────────────────────
// `razao` = força efetiva sua ÷ defesa efetiva dele.
// A curva é deliberadamente generosa embaixo e avara em cima: é fácil arrancar um
// pedaço de fronteira, é caríssimo tomar o país inteiro. 3:1 é a doutrina real
// para ofensiva bem-sucedida — e aqui é o que compra o mapa todo.
export function fracaoConquistada(razao) {
  if (razao >= 2.6) return 1;                                 // rolo compressor (era 3:1)
  if (razao >= 1.5) return 0.55 + ((razao - 1.5) / 1.1) * 0.4; // 55% → 95% — mais tropa RENDE mais
  if (razao >= 1) return 0.22 + ((razao - 1) / 0.5) * 0.33;   // 22% → 55%
  if (razao >= 0.6) return ((razao - 0.6) / 0.4) * 0.22;      //  0% → 22%
  return 0;                                                   // aniquilado, nada
}

// ── QUAIS ESTADOS, E EM QUE ORDEM ─────────────────────────────────────
// Fronteira → interior → capital. Determinístico: a mesma campanha cai igual,
// senão o replay do save contaria outra história.
export function ordemDeQueda(estado, iso, origem, prioridades = null) {
  const alvos = estadosDe(iso);
  if (!alvos.length) return [];
  const cap = estadoCapitalDe(iso);

  // `prioridades` pode ser um id só (retrocompat) ou uma LISTA de ids escolhidos no
  // mapa — na ORDEM em que o jogador quer que caiam. Eles vêm primeiro, o resto depois.
  const prio = Array.isArray(prioridades) ? prioridades : (prioridades ? [prioridades] : []);
  const prioIdx = new Map(prio.map((id, i) => [id, i]));
  const primeiro = prio.length ? alvos.find((e) => e.id === prio[0]) : null;

  // O eixo de avanço parte do PRIMEIRO alvo escolhido; sem escolha, do ponto de
  // lançamento (você entra pelo lado de onde veio).
  const de = primeiro || origem || centroDe(alvos);
  const dist = (e) => Math.hypot(e.lat - de.lat, (e.lng - de.lng) * 0.7);
  // Se a capital está entre os alvos escolhidos, ela não é mais empurrada pro fim.
  const capUltimo = !(prio.length && cap && prioIdx.has(cap.id));

  return alvos
    .map((e) => ({
      ...e,
      d: dist(e),
      ehCapital: cap && e.id === cap.id,
      peso: guarnicaoDefensiva(estado, e.id),   // guarnição real (sua) ou estimada (do NPC) pesa na ordem de queda
    }))
    .sort((a, b) => {
      const pa = prioIdx.has(a.id); const pb = prioIdx.has(b.id);
      if (pa || pb) {                                       // escolhidos primeiro, na ordem da seleção
        if (pa && pb) return prioIdx.get(a.id) - prioIdx.get(b.id);
        return pa ? -1 : 1;
      }
      if (capUltimo && a.ehCapital !== b.ehCapital) return a.ehCapital ? 1 : -1;
      return (a.d + a.peso * 8) - (b.d + b.peso * 8);
    });
}

// (A capital agora vem de estadoCapitalDe em territorio.js — resolvida pela cidade
// marcada como capital nacional em cidades.json, com fallback no estado de maior peso.)

function centroDe(alvos) {
  const lat = alvos.reduce((a, e) => a + e.lat, 0) / alvos.length;
  const lng = alvos.reduce((a, e) => a + e.lng, 0) / alvos.length;
  return { lat, lng };
}

// ── O PLANO DA CAMPANHA ───────────────────────────────────────────────
// Devolve QUAIS estados caem, em ORDEM, sem aplicar nada. A UI usa isto pra
// revelar a conquista em tempo real durante a cinemática, um estado por vez.
export function planoDeCampanha(estado, iso, razao, origem = null, prioridade = null) {
  const ordem = ordemDeQueda(estado, iso, origem, prioridade);
  if (!ordem.length) return { caem: [], resistem: [], fracao: 0, total: 0, tomouCapital: false };
  const fracao = fracaoConquistada(razao);
  let n = Math.floor(ordem.length * fracao);
  // BUG QUE ISTO CONSERTA: se o jogador ESCOLHEU estados no mapa, a ofensiva não pode
  // "transbordar" e tomar estados que ele não pediu. A força limita QUANTOS dos
  // escolhidos caem (dos primeiros pra frente), mas nunca passa da lista. Sem escolha,
  // a Máquina decide pela força, como antes.
  const prio = Array.isArray(prioridade) ? prioridade : (prioridade ? [prioridade] : []);
  const dirigida = prio.length > 0;
  if (dirigida) n = Math.min(n, prio.length);
  let caem = ordem.slice(0, n);
  // ── A RESERVA DO DEFENSOR ────────────────────────────────────────────
  // O inimigo NÃO joga tudo de uma vez: guarda tropa e BLINDA a capital. O coração do
  // país só cai com força ESMAGADORA (razão ≥ 2.4). Num ataque comum você toma a
  // fronteira e o interior, mas a capital resiste — e é por isso que dominar 100% de um
  // país exige VOLTAR mais forte: a cada ataque a base dele enfraquece (ajustarBase),
  // a razão sobe, e um dia o coração cede. Guerra vira campanha, não um clique.
  const LIMIAR_CAPITAL = 2.4;
  if (razao < LIMIAR_CAPITAL && caem.some((e) => e.ehCapital)) {
    caem = caem.filter((e) => !e.ehCapital);
  }
  const caiSet = new Set(caem);
  const resistem = ordem.filter((e) => !caiSet.has(e));
  // A fração REAL do país que mudou de dono (não a "capacidade" da força). Num ataque
  // dirigido a 4 de 27 estados, o espólio de petróleo e a barra têm de refletir 4/27,
  // não a força bruta que você tinha sobrando.
  const fracaoReal = ordem.length ? caem.length / ordem.length : 0;
  return {
    caem, resistem, fracao: fracaoReal, total: ordem.length, dirigida,
    tomouCapital: caem.some((e) => e.ehCapital),
    capitalResistiu: razao < LIMIAR_CAPITAL && ordem.some((e) => e.ehCapital),
    capital: ordem.find((e) => e.ehCapital) || null,
  };
}

// ── APLICAR ───────────────────────────────────────────────────────────
// Troca o dono dos estados que caíram e dizima a guarnição deles. Chamado DEPOIS
// da cinemática — a revelação mostra o que vai acontecer, isto faz acontecer.
export function aplicarCampanha(estado, plano, isoAtacante) {
  estado.donoEstado = estado.donoEstado || {};
  estado.guarnicoes = estado.guarnicoes || {};
  for (const e of plano.caem) {
    estado.donoEstado[e.id] = isoAtacante;
    delete estado.guarnicoes[e.id];   // quem perde o território perde o que guardava nele
  }
  return plano.caem.length;
}

// ── OFENSIVA DIRIGIDA A UM ESTADO ─────────────────────────────────────
// O que isto conserta: o Teatro de Operações designava alvo, abria o painel, o
// jogador mandava tropa… e NADA acontecia. Sem guerra, sem relação caindo, sem
// opinião pública, sem território. O painel era teatro no pior sentido da palavra.
//
// Agora um envio a solo alheio é um ATO DE GUERRA com todas as contas: a guarnição
// local resolve o combate (defensor vale 1,6× — ver territorio.js), o território
// muda de dono se cair, a relação despenca, o bloco do alvo reage, o povo opina, e
// a força enviada volta menor do que foi.
export function resolverEnvio(estado, idEstado, isoAlvo, deploy) {
  const poder = poderDeploy(deploy);
  if (poder <= 0) return { falha: 'Nenhuma força designada.' };

  const custo = custoDeploy(deploy);
  if (custo > estado.tesouro) {
    return { falha: `Sem caixa: o transporte custa ${custo} tri e você tem ${round2(estado.tesouro)} tri.` };
  }
  estado.tesouro = round2(estado.tesouro - custo);

  const eu = estado.iso || 'USA';
  const jaEmGuerra = (estado.emGuerra || []).includes(isoAlvo);
  const alvo = estadoPorId(idEstado);

  // 1. O COMBATE no território
  const res = resolverAtaqueAoEstado(estado, idEstado, poder);
  aplicarAtaqueAoEstado(estado, res, eu);
  const tomou = !res.segurou;

  // 2. AS BAIXAS — só na força enviada, proporcional ao que o defensor cobrou
  const perdas = [];
  for (const u of UNIDADES) {
    const enviado = deploy?.[u.id] || 0;
    if (!enviado) continue;
    const perdido = Math.min(enviado, Math.round(enviado * (res.perdaAtacante / 100)));
    if (perdido > 0) {
      estado.forcas[u.id] = Math.max(0, (estado.forcas[u.id] || 0) - perdido);
      perdas.push({ id: u.id, nome: u.nome, icone: u.icone, perdido, enviado });
    }
  }
  // o que sobreviveu e tomou o território FICA lá guarnecendo — é conquista, não raide
  if (tomou) {
    estado.guarnicoes = estado.guarnicoes || {};
    const g = {};
    for (const u of UNIDADES) {
      const sobrou = Math.round((deploy?.[u.id] || 0) * (1 - res.perdaAtacante / 100));
      if (sobrou > 0) g[u.id] = sobrou;
    }
    if (Object.keys(g).length) estado.guarnicoes[idEstado] = g;
  }

  // 3. A GUERRA — pisar em solo alheio abre conflito, ponto
  estado.emGuerra = estado.emGuerra || [];
  if (!estado.emGuerra.includes(isoAlvo)) estado.emGuerra.push(isoAlvo);

  // 4. O PREÇO POLÍTICO. Começar guerra custa mais caro que continuar uma:
  // a primeira bota é notícia, a décima é rotina.
  const relKey = PAISES[isoAlvo]?.rel;
  const bloco = reacaoDeBloco(isoAlvo);
  const reacaoBloco = [];
  for (const k of bloco.relKeys || []) {
    const antes = Number(estado[k] ?? 0);
    estado[k] = clamp(antes + (jaEmGuerra ? -6 : -14), -100, 100);
    reacaoBloco.push({ chave: k, delta: estado[k] - antes });
  }
  const efeitos = {
    [relKey]: jaEmGuerra ? -18 : -40,
    temp_guerra: jaEmGuerra ? 8 : 20,
    soft_power: jaEmGuerra ? -4 : -11,
    // a opinião pública premia a vitória e pune a aventura fracassada
    aprovacao: tomou ? 5 : -9,
    poder_militar: tomou ? 0 : -4,
  };
  const mudancas = aplicarEfeitos(estado, efeitos);

  return {
    res, tomou, custo, poder, perdas, mudancas, reacaoBloco, bloco,
    jaEmGuerra, idEstado, isoAlvo,
    nomeEstado: alvo?.nome || idEstado,
    manchete: mancheteEnvio(estado, alvo?.nome || idEstado, isoAlvo, tomou, jaEmGuerra),
  };
}

function mancheteEnvio(estado, nomeEstado, isoAlvo, tomou, jaEmGuerra) {
  const meu = PAISES[estado.iso]?.nome || 'Nossa nação';
  const deles = PAISES[isoAlvo]?.nome || isoAlvo;
  if (tomou && !jaEmGuerra) {
    return `GUERRA: ${meu} invadiu ${deles} e tomou ${nomeEstado}. Não houve ultimato, não houve declaração — houve bota no chão.`;
  }
  if (tomou) return `${meu} avança em ${deles}: ${nomeEstado} caiu. A linha de frente se moveu, e o mapa com ela.`;
  if (!jaEmGuerra) {
    return `GUERRA: ${meu} atacou ${nomeEstado}, em ${deles} — e foi repelido. Começou uma guerra e perdeu a primeira batalha dela no mesmo dia.`;
  }
  return `Ofensiva de ${meu} sobre ${nomeEstado} fracassa. ${deles} segurou a linha.`;
}

function round2(n) { return Math.round(n * 100) / 100; }

// ── LEITURA PRO JOGADOR ───────────────────────────────────────────────
// O texto que explica um desfecho que agora tem meio-termo. "Derrota" com três
// estados na mão não é derrota — e o jogo tem de dizer isso na cara.
export function lerCampanha(plano, nomePais) {
  const pct = Math.round(plano.fracao * 100);
  if (!plano.caem.length) {
    return {
      rot: 'REPELIDOS', cls: 'fail',
      txt: `Nenhum palmo de ${nomePais} mudou de dono. A força voltou com menos gente do que foi.`,
    };
  }
  if (plano.fracao >= 1) {
    return {
      rot: 'OCUPAÇÃO TOTAL', cls: 'ok',
      txt: `${nomePais} caiu inteiro — ${plano.total} territórios, capital incluída. Não sobrou governo para negociar.`,
    };
  }
  if (plano.tomouCapital) {
    return {
      rot: 'CAPITAL TOMADA', cls: 'ok',
      txt: `A capital é sua e ${plano.caem.length} de ${plano.total} territórios caíram (${pct}%). O governo fugiu, mas o interior ainda não sabe disso.`,
    };
  }
  if (plano.fracao >= 0.5) {
    return {
      rot: 'AVANÇO PROFUNDO', cls: 'ok',
      txt: `${plano.caem.length} de ${plano.total} territórios de ${nomePais} são seus (${pct}%) — mas a capital resistiu. Você tem metade do país e nenhum acordo.`,
    };
  }
  return {
    rot: 'CABEÇA DE PONTE', cls: 'parcial',
    txt: `A ofensiva parou, mas não foi à toa: ${plano.caem.length} território(s) de ${nomePais} ficaram (${pct}%). Dá para extrair recurso deles — e para tentar de novo a partir dali.`,
  };
}
