// ═══════════════════════════════════════════════════════════════════════
// ARMA NUCLEAR — a jogada que não tem volta
// ═══════════════════════════════════════════════════════════════════════
// Uma ogiva não é "um ataque maior". É a linha que, cruzada, redefine o jogo.
// O design aqui persegue uma sensação: o poder embriagante do gatilho e o horror
// da conta que vem depois. Você APAGA um alvo — e o mundo inteiro apaga VOCÊ da
// lista de gente com quem se negocia.
//
// A física do jogo em três atos:
//   1. DEVASTAÇÃO — o alvo deixa de ser um adversário e vira uma zona morta:
//      força pulverizada, economia no chão, território radioativo por gerações.
//   2. CAOS GLOBAL — o TABU quebrou. Não importa quão justo você achava o ataque:
//      todo país recua de você. Relações despencam no mundo TODO, o soft power
//      colapsa, o preço do petróleo e o medo explodem.
//   3. RETALIAÇÃO / MAD — se o alvo (ou os aliados dele) também tem ogivas, a
//      resposta pode ser nuclear. Destruição Mútua Assegurada não é ameaça
//      abstrata: é a mecânica que faz você hesitar com o dedo no botão.
import { PAISES, chaveRelacao } from '../dados/paises.js';
import { reacaoDeBloco } from '../dados/blocos.js';
import { NACOES } from '../dados/registro.js';
import { aplicarEfeitos } from './efeitos.js';
import { rand } from './rng.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (n) => Math.round(n * 100) / 100;

// Quantas ogivas o alvo tem — pra decidir se há retaliação (MAD).
function ogivasDoAlvo(iso) {
  return NACOES[iso]?.ficha?.estadoInicial?.ogivas || 0;
}

// CHANCE DE INTERCEPTAÇÃO: o alvo consegue abater a ogiva na reentrada?
// Escudo antimíssil de verdade é caro e raro. Só potências com forças de ponta,
// segurança alta e defesa aérea concreta derrubam um ICBM com alguma confiança —
// é o que faz valer a pena mirar um vizinho fraco em vez da superpotência blindada.
export function chanceInterceptacao(iso) {
  const ini = NACOES[iso]?.ficha?.estadoInicial || {};
  // ATENÇÃO ao modelo de dados: só um punhado de países preenche
  // `ficha.forcasIniciais` no rodapé do próprio arquivo. Para todos os outros as
  // forças moram em `NACOES[iso].forcas`, e quem costura os dois é o fichaDe()
  // do registro.js. Ler só o primeiro caminho fazia Rússia e China aparecerem com
  // ZERO baterias antiaéreas — as duas maiores redes do planeta.
  const forcas = NACOES[iso]?.ficha?.forcasIniciais || NACOES[iso]?.forcas || {};
  const pm = ini.poder_militar || 0;        // 0-100
  const seg = ini.seguranca || 0;           // 0-100
  const defAerea = forcas.defesa_aerea || 0; // baterias antiaéreas concretas
  // As baterias antiaéreas concretas são o que mais pesa: é ferro no chão, não
  // reputação. ~60 baterias (padrão de superpotência) já valem o teto do bônus.
  const base = pm / 380 + seg / 500 + Math.min(0.26, defAerea / 260);
  return Math.max(0, Math.min(0.72, base));
}

// Pode disparar? Precisa ter ogiva, e o alvo não pode ser você mesmo.
export function podeDispararOgiva(estado, isoAlvo) {
  if ((estado.ogivas || 0) <= 0) {
    return { pode: false, motivo: 'Você não tem ogivas operacionais. Construa o programa nuclear primeiro.' };
  }
  if (isoAlvo === (estado.iso || 'USA')) {
    return { pode: false, motivo: 'Você não pode lançar contra o próprio território.' };
  }
  return { pode: true };
}

// Avalia o que aconteceria — sem aplicar. A UI usa pra mostrar as consequências
// ANTES de o jogador confirmar. Um ataque nuclear tem de vir com a conta à vista.
export function avaliarOgiva(estado, isoAlvo) {
  const nome = PAISES[isoAlvo]?.nome || isoAlvo;
  const ogivasAlvo = ogivasDoAlvo(isoAlvo);
  const bloco = reacaoDeBloco(isoAlvo);
  // aliados nucleares do alvo (bloco militar) também podem revidar
  const guardioes = bloco.isos.filter((i) => ogivasDoAlvo(i) > 0 && bloco.intensidade >= 55);
  const risco = ogivasAlvo > 0 || guardioes.length > 0;
  const chanceIntercept = chanceInterceptacao(isoAlvo);
  return {
    nome, isoAlvo, ogivasAlvo,
    riscoRetaliacao: risco,
    guardioes: guardioes.map((i) => PAISES[i]?.nome || i),
    chanceIntercept,                                   // 0..0.7
    escudoForte: chanceIntercept >= 0.4,               // vale avisar o jogador
    bloco,
  };
}

// ── O LANÇAMENTO ──────────────────────────────────────────────────────
// Aplica tudo ao estado e devolve um relato rico pra a UI narrar o caos.
export function dispararOgiva(estado, isoAlvo) {
  const av = avaliarOgiva(estado, isoAlvo);
  estado.ogivas = Math.max(0, (estado.ogivas || 0) - 1);

  // ── 0. INTERCEPTAÇÃO ────────────────────────────────────────────────
  // O escudo do alvo pode abater a ogiva no ar. Ela ainda é gasta, mas não há
  // devastação — só a marca indelével de que VOCÊ tentou o impensável e falhou.
  if (rand() < av.chanceIntercept) {
    return dispararInterceptado(estado, av, isoAlvo);
  }

  // ── 1. DEVASTAÇÃO DO ALVO ──────────────────────────────────────────
  // O alvo vira zona morta: se estava em guerra com você, a guerra acabou —
  // não há mais o que conquistar, só ruína radioativa que ninguém quer ocupar.
  estado.emGuerra = (estado.emGuerra || []).filter((i) => i !== isoAlvo);
  estado.zonasRadioativas = estado.zonasRadioativas || [];
  if (!estado.zonasRadioativas.includes(isoAlvo)) estado.zonasRadioativas.push(isoAlvo);
  // se era território ocupado seu, você acabou de irradiar o próprio espólio
  const ocupava = (estado.conquistados || []).some((c) => c.iso === isoAlvo);
  estado.conquistados = (estado.conquistados || []).filter((c) => c.iso !== isoAlvo);

  // ── 2. CAOS GLOBAL — o tabu quebrou, o mundo recua de você ──────────
  const relKeys = Object.keys(estado).filter((k) => k.startsWith('rel_'));
  const relAlvo = PAISES[isoAlvo]?.rel || chaveRelacao?.({ properties: { ISO_A3: isoAlvo } });
  const reacoes = [];
  for (const k of relKeys) {
    const antes = Number(estado[k] ?? 0);
    // o alvo (se ainda existe como relação) vai ao fundo do poço; o resto do
    // mundo despenca também, proporcional a quão perto era de você (aliado
    // horrorizado cai MAIS — sentiu na pele que pode ser o próximo).
    let delta;
    if (k === relAlvo) delta = -100;
    else if (antes >= 40) delta = -45;   // aliado que te via como civilizado
    else if (antes >= 0) delta = -30;
    else delta = -15;                     // já era inimigo; menos a perder
    estado[k] = clamp(antes + delta, -100, 100);
    if (estado[k] - antes <= -20) reacoes.push({ chave: k, nome: nomeDaRel(k), delta: estado[k] - antes });
  }

  // Os medidores desabam: você virou pária de um golpe.
  const efeitos = {
    soft_power: -40,
    temp_guerra: 60,
    seguranca: -15,
    aprovacao: -10,        // parte da sua população também recua horrorizada
    estabilidade: -12,
    territorio: ocupava ? -1 : 0,
  };
  const mudancas = aplicarEfeitos(estado, efeitos);

  // Petróleo e mundo: o barril entra em pânico nuclear.
  estado.preco_petroleo = clamp((estado.preco_petroleo || 78) + 55, 18, 260);

  // ── 3. RETALIAÇÃO / MAD ────────────────────────────────────────────
  let retaliacao = null;
  if (av.riscoRetaliacao) {
    // quem revida: o alvo, se tinha ogiva; senão um guardião nuclear do bloco.
    const vingador = av.ogivasAlvo > 0 ? isoAlvo
      : av.bloco.isos.find((i) => ogivasDoAlvo(i) > 0 && av.bloco.intensidade >= 55);
    // chance sobe com o arsenal do vingador e a intensidade do bloco
    const arsenalVingador = ogivasDoAlvo(vingador);
    const chance = Math.min(0.9, 0.35 + arsenalVingador / 400 + av.bloco.intensidade / 300);
    if (rand() < chance) {
      // VOCÊ leva uma de volta. Não apaga o país (é 1 ogiva), mas é catastrófico.
      const danoRet = aplicarEfeitos(estado, {
        aprovacao: -25, estabilidade: -20, poder_militar: -18, pib: -round2((estado.pib || 28) * 0.15),
        soft_power: -10, seguranca: -20,
      });
      // uma cidade sua vira zona radioativa (representada no medidor, não no mapa do alvo)
      estado.territorio = Math.max(1, (estado.territorio || 1));
      retaliacao = {
        vingador, vingadorNome: PAISES[vingador]?.nome || vingador,
        arsenal: arsenalVingador, dano: danoRet,
      };
    } else {
      retaliacao = { vingador, vingadorNome: PAISES[vingador]?.nome || vingador, arsenal: arsenalVingador, dano: null, interceptada: true };
    }
  }

  return { av, ogivasRestantes: estado.ogivas, reacoes, mudancas, retaliacao, ocupava };
}

// ── O ATAQUE ABATIDO ──────────────────────────────────────────────────
// A ogiva não chegou — mas o mundo viu você apertar o botão. Sem cidade morta,
// sem zona radioativa. Só a conta diplomática de ter tentado, que não é pequena.
function dispararInterceptado(estado, av, isoAlvo) {
  const relKeys = Object.keys(estado).filter((k) => k.startsWith('rel_'));
  const relAlvo = PAISES[isoAlvo]?.rel;
  const reacoes = [];
  for (const k of relKeys) {
    const antes = Number(estado[k] ?? 0);
    let delta;
    if (k === relAlvo) delta = -85;         // quem você tentou apagar não esquece
    else if (antes >= 40) delta = -22;      // aliados horrorizados com a tentativa
    else if (antes >= 0) delta = -14;
    else delta = -8;
    estado[k] = clamp(antes + delta, -100, 100);
    if (estado[k] - antes <= -14) reacoes.push({ chave: k, nome: nomeDaRel(k), delta: estado[k] - antes });
  }
  const mudancas = aplicarEfeitos(estado, {
    soft_power: -22, temp_guerra: 45, seguranca: -8, aprovacao: -6, estabilidade: -5,
  });
  estado.preco_petroleo = clamp((estado.preco_petroleo || 78) + 18, 18, 260);
  return { av, interceptado: true, ogivasRestantes: estado.ogivas, reacoes, mudancas, retaliacao: null };
}

function nomeDaRel(chave) {
  const alvo = Object.values(PAISES).find((p) => p.rel === chave);
  return alvo?.nome || String(chave).replace(/^rel_/, '');
}

// ── FEED: o mundo grita ───────────────────────────────────────────────
// Manchetes que a UI empilha no X depois do cogumelo. É a resposta contextual.
export function manchetesNucleares(estado, relato) {
  const nome = relato.av.nome;
  const meu = PAISES[estado.iso]?.nome || 'Nossa nação';

  // ── O ATAQUE ABATIDO ────────────────────────────────────────────────
  // Sem cogumelo, sem cidade morta. Mas o mundo viu o dedo no botão — e essa
  // imagem não tem escudo que derrube.
  if (relato.interceptado) {
    return [
      { tom: 'ruim', texto: `URGENTE: ${meu} LANÇOU uma ogiva nuclear contra ${nome} — e o escudo antimíssil de ${nome} a ABATEU em pleno voo.` },
      { tom: 'ruim', texto: `Não houve cogumelo. Houve algo pior para você: o mundo inteiro viu ${meu} tentar o impensável e falhar. ${nome} virou vítima e herói no mesmo minuto.` },
      { tom: 'ruim', texto: `${relato.reacoes.length} chancelarias romperam o diálogo em uma hora. "Um Estado que aperta o botão não erra por bondade — erra por incompetência", disse um embaixador.` },
      { tom: 'aviso', texto: `O petróleo disparou e o mundo entrou em prontidão. A próxima ogiva que cruzar o céu ninguém vai esperar interceptar.` },
    ];
  }

  const linhas = [
    { tom: 'ruim', texto: `URGENTE: ${estado.iso ? PAISES[estado.iso]?.nome || 'Nossa nação' : 'Nossa nação'} DETONOU uma arma nuclear sobre ${nome}. O tabu de 80 anos acabou de ser quebrado.` },
    { tom: 'ruim', texto: `${nome} é uma zona morta. As primeiras imagens são incompatíveis com qualquer palavra que a diplomacia tenha.` },
    { tom: 'ruim', texto: `Chancelarias do mundo inteiro convocam nossos embaixadores. A palavra "pária" apareceu em ${relato.reacoes.length} comunicados oficiais em uma hora.` },
  ];
  if (relato.retaliacao?.dano) {
    linhas.push({ tom: 'ruim', texto: `${relato.retaliacao.vingadorNome} RETALIOU com uma ogiva própria. Destruição Mútua Assegurada deixou de ser teoria. Ninguém venceu isto.` });
  } else if (relato.retaliacao?.interceptada) {
    linhas.push({ tom: 'aviso', texto: `${relato.retaliacao.vingadorNome} lançou a resposta — interceptada no último minuto. Estivemos a segundos do fim.` });
  }
  linhas.push({ tom: 'ruim', texto: `O preço do petróleo explodiu. O mundo inteiro se prepara para um inverno que pode não ser só político.` });
  return linhas;
}
