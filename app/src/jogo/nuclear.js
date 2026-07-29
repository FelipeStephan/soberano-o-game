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

// ── A PARTIDA ONDE A BOMBA NUNCA FOI INVENTADA ────────────────────────
// Quem monta a sala pode querer um mundo em que a chantagem nuclear simplesmente
// não existe — e aí a guerra volta a ser decidida por exército, dinheiro e conversa.
// FONTE ÚNICA DA VERDADE: qualquer lugar que pergunte "existe ogiva neste jogo?"
// pergunta AQUI. O erro que isto conserta é sutil e fatal: zerar `estado.ogivas`
// desarmava só o JOGADOR — os NPCs continuavam com o arsenal da ficha estática
// (NACOES[iso].ficha.estadoInicial.ogivas), porque a ficha é imutável e não sabe
// nada da sua partida. Sem esta flag, "sem nucleares" viraria "sem nucleares só
// pra você" — o pior desequilíbrio possível.
export function partidaSemNucleares(estado) {
  return !!estado?.semNucleares;
}

// Quantas ogivas o alvo tem — pra decidir se há retaliação (MAD).
// Recebe o estado (e não só o iso) exatamente por causa do parágrafo acima: a
// resposta depende da PARTIDA, não só do país.
export function ogivasDoAlvo(estado, iso) {
  if (partidaSemNucleares(estado)) return 0;
  return NACOES[iso]?.ficha?.estadoInicial?.ogivas || 0;
}

// CHANCE DE INTERCEPTAÇÃO: o alvo consegue abater a ogiva na reentrada?
// Escudo antimíssil de verdade é caro e raro. Só potências com forças de ponta,
// segurança alta e defesa aérea concreta derrubam um ICBM com alguma confiança —
// é o que faz valer a pena mirar um vizinho fraco em vez da superpotência blindada.
export function chanceInterceptacao(iso, estado = null) {
  // Numa partida sem nucleares nenhuma ogiva cruza o céu — logo não há reentrada
  // pra interceptar. Devolver 0 aqui evita o absurdo de a UI anunciar "escudo
  // antimíssil: 61%" num mundo onde a arma que ele abate não existe.
  if (estado && partidaSemNucleares(estado)) return 0;
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
  // A trava mais importante vem primeiro, e com voz própria: "não tem ogiva" e
  // "a bomba não existe nesta partida" são recusas diferentes, e o jogador merece
  // saber qual delas está olhando — uma se resolve minerando urânio, a outra não.
  if (partidaSemNucleares(estado)) {
    return { pode: false, semNucleares: true, motivo: 'Esta partida foi criada SEM armas nucleares. Nenhum país do mundo tem arsenal — esta guerra se decide com exército, dinheiro e conversa.' };
  }
  // Já morreu: um país apagado não lança nada. Sem isto, o cadáver ainda revida.
  if (estado.nacaoMorta) {
    return { pode: false, motivo: 'A sua nação foi apagada do mapa. Não há mais cadeia de comando para autorizar um lançamento.' };
  }
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
  const bloco = reacaoDeBloco(isoAlvo);
  // PARTIDA SEM NUCLEARES: a avaliação sai zerada de propósito e carimbada. Se
  // deixássemos os números reais passarem, a UI desenharia uma conta de guerra
  // atômica plausível — com arsenal, guardiões e escudo — pra uma jogada que o
  // motor vai recusar. Mentir na antevisão é pior do que não mostrar nada.
  if (partidaSemNucleares(estado)) {
    return {
      nome, isoAlvo, ogivasAlvo: 0, semNucleares: true,
      riscoRetaliacao: false, guardioes: [], chanceIntercept: 0, escudoForte: false, bloco,
    };
  }
  const ogivasAlvo = ogivasDoAlvo(estado, isoAlvo);
  // aliados nucleares do alvo (bloco militar) também podem revidar
  const guardioes = bloco.isos.filter((i) => ogivasDoAlvo(estado, i) > 0 && bloco.intensidade >= 55);
  const risco = ogivasAlvo > 0 || guardioes.length > 0;
  const chanceIntercept = chanceInterceptacao(isoAlvo, estado);
  return {
    nome, isoAlvo, ogivasAlvo,
    riscoRetaliacao: risco,
    guardioes: guardioes.map((i) => PAISES[i]?.nome || i),
    chanceIntercept,                                   // 0..0.7
    escudoForte: chanceIntercept >= 0.4,               // vale avisar o jogador
    bloco,
  };
}

// ── A CICATRIZ, APLICADA ONDE QUER QUE ELA SEJA VISTA ─────────────────
// #6.1 — Antes, a zona morta nascia DENTRO do disparo, no cliente de quem lançou.
// Resultado no online: o país virava deserto radioativo no mapa do agressor e
// continuava um país normal no mapa de todos os outros — duas verdades sobre a
// mesma cratera. Isto aqui é a verdade única: uma função pura que qualquer cliente
// roda ao saber do impacto (o de quem lançou, o de quem levou, o da plateia) e
// termina com o mesmo mundo na tela.
// `porIso` é quem apertou o botão — informado, o mundo também recua DELE aqui,
// que é como a plateia descobre que existe um pária novo sem precisar adivinhar.
export function aplicarZonaMorta(estado, isoAlvo, { porIso = null, porNome = null, semRepercussao = false } = {}) {
  if (!estado || !isoAlvo) return { ok: false, iso: isoAlvo || null, linhas: [] };
  const nome = PAISES[isoAlvo]?.nome || isoAlvo;

  // 1. A marca no mapa. Idempotente de propósito: no relay um evento pode chegar
  //    duas vezes, e a segunda não pode duplicar cratera nem re-narrar o horror.
  estado.zonasRadioativas = estado.zonasRadioativas || [];
  const inedito = !estado.zonasRadioativas.includes(isoAlvo);
  if (inedito) estado.zonasRadioativas.push(isoAlvo);

  // 2. A guerra com um cadáver não continua. Não há frente, não há capital a tomar.
  const eraGuerra = (estado.emGuerra || []).includes(isoAlvo);
  estado.emGuerra = (estado.emGuerra || []).filter((i) => i !== isoAlvo);

  // 3. O espólio irradiado. Quem ocupava aquele chão acabou de perder o chão —
  //    e as tropas que estavam lá dentro. Ocupação, guarnição e base viram pó junto.
  const ocupava = (estado.conquistados || []).some((c) => c.iso === isoAlvo);
  estado.conquistados = (estado.conquistados || []).filter((c) => c.iso !== isoAlvo);
  if (estado.ocupacoes) delete estado.ocupacoes[isoAlvo];

  const prefixo = `${isoAlvo}-`;
  let tropasPerdidas = 0;
  estado.guarnicoes = estado.guarnicoes || {};
  for (const id of Object.keys(estado.guarnicoes)) {
    if (!id.startsWith(prefixo)) continue;
    const g = estado.guarnicoes[id];
    if (g && typeof g === 'object') for (const q of Object.values(g)) tropasPerdidas += Number(q) || 0;
    delete estado.guarnicoes[id];
  }
  // donoEstado guarda só a EXCEÇÃO (ver estado.js). Duas exceções morrem aqui: os
  // estados DO país apagado (não há mais o que dominar) e os estados que o país
  // apagado ocupava mundo afora — o ocupante virou cinza, o chão volta a quem é.
  estado.donoEstado = estado.donoEstado || {};
  let ocupacoesLibertadas = 0;
  for (const [id, dono] of Object.entries(estado.donoEstado)) {
    if (id.startsWith(prefixo)) { delete estado.donoEstado[id]; continue; }
    if (dono === isoAlvo) { delete estado.donoEstado[id]; ocupacoesLibertadas++; }
  }

  const basesPerdidas = (estado.bases || []).filter((b) => b.iso === isoAlvo).length;
  estado.bases = (estado.bases || []).filter((b) => b.iso !== isoAlvo);

  // 4. Tudo que estava a caminho perde o destino ou o remetente. Uma ofensiva que
  //    ainda chegasse contra (ou de) um país inexistente é o tipo de fantasma que
  //    trava a partida três meses depois, sem ninguém entender por quê.
  const operacoesCanceladas = (estado.operacoes || []).filter((o) => o.alvoIso === isoAlvo).length;
  estado.operacoes = (estado.operacoes || []).filter((o) => o.alvoIso !== isoAlvo);
  const mobilizacoesCanceladas = (estado.mobilizacoes || []).filter((m) => m.iso === isoAlvo).length;
  estado.mobilizacoes = (estado.mobilizacoes || []).filter((m) => m.iso !== isoAlvo);
  estado.minhasOfensivas = (estado.minhasOfensivas || []).filter((o) => o.alvo !== isoAlvo);

  // 5. Alianças: um membro apagado sai do bloco. Papel assinado não protege ruína.
  let aliancasRompidas = 0;
  for (const al of estado.aliancas || []) {
    if ((al.membros || []).includes(isoAlvo)) {
      al.membros = al.membros.filter((i) => i !== isoAlvo); aliancasRompidas++;
    }
    if ((al.convites || []).includes(isoAlvo)) al.convites = al.convites.filter((i) => i !== isoAlvo);
  }

  // 6. A REPERCUSSÃO NA PLATEIA. Só vale pra quem NÃO lançou: o cliente de quem
  //    apertou o botão já paga a conta inteira dentro de dispararOgiva, e cobrar
  //    duas vezes seria punir o mesmo crime em dobro.
  let repercussao = null;
  if (!semRepercussao && porIso && porIso !== (estado.iso || null) && inedito) {
    const k = PAISES[porIso]?.rel;
    if (k) {
      const antes = Number(estado[k] ?? 0);
      // Quem era íntimo recua mais: descobrir que o amigo usa a bomba é descobrir
      // que você pode ser o próximo endereço.
      const delta = antes >= 40 ? -60 : antes >= 0 ? -45 : -25;
      estado[k] = clamp(antes + delta, -100, 100);
      repercussao = { chave: k, iso: porIso, nome: porNome || PAISES[porIso]?.nome || porIso, delta: estado[k] - antes };
    }
    // O mundo inteiro fica mais perigoso, inclusive pra quem só assistiu.
    aplicarEfeitos(estado, { temp_guerra: 35, seguranca: -6 });
    estado.preco_petroleo = clamp((estado.preco_petroleo || 78) + 40, 18, 260);
  }

  const linhas = [];
  if (inedito) linhas.push(`${nome} deixou de ser um país e virou uma zona morta. É permanente: ninguém ocupa, ninguém reconstrói.`);
  if (eraGuerra) linhas.push(`A guerra contra ${nome} acabou sem vencedor — não sobrou frente para disputar.`);
  if (ocupava) linhas.push(`O território que você ocupava em ${nome} agora é solo radioativo. O espólio virou cinza.`);
  if (tropasPerdidas > 0) linhas.push(`${tropasPerdidas.toLocaleString('pt-BR')} efetivos estavam guarnecendo aquele chão. Não voltam.`);
  if (basesPerdidas > 0) linhas.push(`${basesPerdidas} instalação(ões) militar(es) na região foram apagadas junto.`);
  if (ocupacoesLibertadas > 0) linhas.push(`${ocupacoesLibertadas} território(s) que ${nome} ocupava ficaram sem ocupante — não havia mais quem os segurasse.`);

  return {
    ok: true, iso: isoAlvo, nome, inedito, eraGuerra, ocupava,
    tropasPerdidas, basesPerdidas, ocupacoesLibertadas,
    operacoesCanceladas, mobilizacoesCanceladas, aliancasRompidas,
    repercussao, linhas,
  };
}

// ── O JOGADOR APAGADO ─────────────────────────────────────────────────
// #6.2 — Zona morta é geografia; isto aqui é o outro lado, que o jogo não tinha:
// o país atingido deixa de ser um adversário VIVO. Todo país apagado entra em
// `estado.nacoesMortas` (a lista que a UI usa pra parar de oferecer diplomacia,
// comércio e guerra contra um cemitério). Se o apagado for VOCÊ, o registro sobe
// pra `estado.nacaoMorta` — a chave única que diz "esta partida acabou para este
// jogador" — e a máquina de guerra é zerada na hora: arsenal, exército, ocupações.
// Um morto não retalia depois. O `espolio` guarda o que você era no instante do
// clarão, porque a tela de derrota (e a volta ao jogo, #11) precisa contar isso.
// ATENÇÃO: aqui NÃO se decide o destino da partida — só se REGISTRA. Quem desenha
// game over, congela a fila e oferece voltar é a UI (ver ui/jogo.js).
export function marcarNacaoMorta(estado, iso, { porIso = null, porNome = null, turno = null } = {}) {
  if (!estado || !iso) return { ok: false, souEu: false, linhas: [] };
  const nome = PAISES[iso]?.nome || iso;
  const registro = {
    iso, nome,
    por: porIso || null,
    porNome: porNome || (porIso ? (PAISES[porIso]?.nome || porIso) : null),
    desde: turno ?? (estado.turno ?? null),
    em: Date.now(),
  };
  estado.nacoesMortas = estado.nacoesMortas || [];
  const jaEstava = estado.nacoesMortas.some((n) => n.iso === iso);
  if (!jaEstava) estado.nacoesMortas.push(registro);

  const souEu = iso === (estado.iso || 'USA');
  let espolio = null;
  if (souEu && !estado.nacaoMorta) {
    espolio = {
      ogivas: estado.ogivas || 0,
      forcas: { ...(estado.forcas || {}) },
      ocupados: (estado.conquistados || []).length,
      pib: estado.pib ?? null,
      tesouro: estado.tesouro ?? null,
      territorio: estado.territorio ?? null,
    };
    // O ARSENAL MORRE COM O PAÍS. É a pergunta mais importante do #6.2: as suas
    // ogivas estavam em silos DENTRO do território que virou cratera. Quem foi
    // apagado não revida no turno seguinte — senão "morrer" viraria só um debuff.
    estado.ogivas = 0;
    for (const k of Object.keys(estado.forcas || {})) estado.forcas[k] = 0;
    if (typeof estado.reservaMilitar === 'number') estado.reservaMilitar = 0;
    estado.guarnicoes = {};
    estado.emGuerra = [];
    estado.conquistados = [];
    estado.ocupacoes = {};
    estado.operacoes = [];
    estado.mobilizacoes = [];
    estado.bases = [];
    estado.nacaoMorta = { ...registro, espolio };
  }

  const linhas = [];
  if (!jaEstava) {
    linhas.push(souEu
      ? `A sua nação foi APAGADA${registro.porNome ? ` por ${registro.porNome}` : ''}. Não é uma derrota: é o fim do endereço.`
      : `${nome} foi APAGADO${registro.porNome ? ` por ${registro.porNome}` : ''}. Não perdeu uma guerra — deixou de existir.`);
    if (souEu && espolio?.ogivas > 0) linhas.push(`${espolio.ogivas} ogiva(s) que você guardava evaporaram nos silos. Não há revide.`);
  }
  return { ok: true, iso, nome, souEu, registro, espolio, jaEstava, linhas };
}

// ── O LANÇAMENTO ──────────────────────────────────────────────────────
// Aplica tudo ao estado e devolve um relato rico pra a UI narrar o caos.
// `forcarIntercepcao` existe por causa do VOO DE DOZE SEGUNDOS (ver jogo/voo.js): o
// resultado do abate não pode mais ser sorteado no instante do lançamento, porque o
// alvo tem a janela do voo para comprar reforço de defesa. Quem chama resolve o dado
// no IMPACTO, já com o reforço que tiver chegado, e entrega a decisão pronta aqui.
// Quando vem `null` (o caminho antigo, e o da IA), a função sorteia como sempre — a
// mudança não obriga ninguém a saber do voo.
export function dispararOgiva(estado, isoAlvo, { alvoHumano = false, alvoJogador = null, forcarIntercepcao = null } = {}) {
  // A ÚLTIMA TRAVA FICA NO MOTOR, não na tela. Se a partida não tem nucleares, o
  // botão nem devia existir — mas botão sumido não é regra, é decoração. A regra
  // é esta linha: nenhum caminho (atalho, IA, evento, save antigo) fura o acordo.
  if (partidaSemNucleares(estado)) {
    return { bloqueado: true, motivo: 'Esta partida foi criada sem armas nucleares. Não há ogiva a lançar.', av: avaliarOgiva(estado, isoAlvo) };
  }
  const av = avaliarOgiva(estado, isoAlvo);
  if ((estado.ogivas || 0) <= 0) {
    return { bloqueado: true, motivo: 'Sem ogivas operacionais no arsenal.', av };
  }
  estado.ogivas = Math.max(0, (estado.ogivas || 0) - 1);

  // ── 0. INTERCEPTAÇÃO ────────────────────────────────────────────────
  // O escudo do alvo pode abater a ogiva no ar. Ela ainda é gasta, mas não há
  // devastação — só a marca indelével de que VOCÊ tentou o impensável e falhou.
  const abateu = forcarIntercepcao == null ? (rand() < av.chanceIntercept) : !!forcarIntercepcao;
  if (abateu) {
    return dispararInterceptado(estado, av, isoAlvo);
  }

  // ── 1. DEVASTAÇÃO DO ALVO ──────────────────────────────────────────
  // Uma verdade só: a mesma função que o cliente de quem RECEBE o evento vai rodar.
  // `semRepercussao` porque a conta diplomática de quem lançou é a do bloco 2 logo
  // abaixo, muito mais pesada — a daqui é a da plateia.
  const zona = aplicarZonaMorta(estado, isoAlvo, { porIso: estado.iso || null, semRepercussao: true });
  const ocupava = zona.ocupava;
  // O alvo deixa de ser um adversário vivo — no online, um JOGADOR acabou de sair
  // do mapa. Quem lançou também precisa disso no estado: é o que impede a UI de
  // seguir oferecendo aliança, comércio e guerra contra um cemitério.
  const morte = marcarNacaoMorta(estado, isoAlvo, {
    porIso: estado.iso || null,
    porNome: PAISES[estado.iso]?.nome || null,
  });

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
      : av.bloco.isos.find((i) => ogivasDoAlvo(estado, i) > 0 && av.bloco.intensidade >= 55);
    // chance sobe com o arsenal do vingador e a intensidade do bloco
    const arsenalVingador = ogivasDoAlvo(estado, vingador);
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

  // `zona` e `morte` viajam no relato porque a UI precisa narrar o que é PERMANENTE
  // (a cratera, o espólio irradiado) separado do que é conjuntura (medidor caindo).
  // `alvoHumano` é a diferença entre "derrotei um rival" e "apaguei uma pessoa da
  // partida" — e o texto do desfecho não pode confundir as duas coisas.
  return {
    av, ogivasRestantes: estado.ogivas, reacoes, mudancas, retaliacao, ocupava,
    zona, morte, alvoHumano: !!alvoHumano, alvoJogador: alvoJogador || null,
  };
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
  if (!relato || relato.bloqueado) return [];   // não houve lançamento: não há o que noticiar
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
  // O alvo era GENTE. A manchete tem de dizer isso com todas as letras: no online
  // não morreu uma IA, saiu um jogador da mesa — e a sala inteira lê esta linha.
  if (relato.alvoHumano) {
    linhas.push({ tom: 'ruim', texto: `${relato.alvoJogador ? `${relato.alvoJogador}, de ${nome},` : `O governo de ${nome}`} não existe mais. Não foi derrotado: foi APAGADO. Não há capital, não há sucessor, não há a quem entregar um bilhete de rendição.` });
  }
  if (relato.retaliacao?.dano) {
    linhas.push({ tom: 'ruim', texto: `${relato.retaliacao.vingadorNome} RETALIOU com uma ogiva própria. Destruição Mútua Assegurada deixou de ser teoria. Ninguém venceu isto.` });
  } else if (relato.retaliacao?.interceptada) {
    linhas.push({ tom: 'aviso', texto: `${relato.retaliacao.vingadorNome} lançou a resposta — interceptada no último minuto. Estivemos a segundos do fim.` });
  }
  linhas.push({ tom: 'ruim', texto: `O preço do petróleo explodiu. O mundo inteiro se prepara para um inverno que pode não ser só político.` });
  return linhas;
}
