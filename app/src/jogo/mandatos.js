// ═══════════════════════════════════════════════════════════════════════
// OS MANDATOS — o que transforma a Doutrina em enredo
// ═══════════════════════════════════════════════════════════════════════
// Fase 2 de ENREDO-E-CAMPANHA.md, metade 2. A Doutrina, sozinha, é regra de
// PONTUAÇÃO: ela diz como você vai ser medido no minuto 60 e some da tela até lá.
// Isso resolve "o jogo não tem rumo" no papel, mas não no minuto a minuto — o
// jogador continua abrindo a partida com sessenta ações igualmente válidas.
//
// O Mandato é a cobrança. A cada 2 anos o SEU PRÓPRIO PAÍS te dá uma meta concreta,
// derivada da sua doutrina, com prazo. Cinco por década, escalando.
//
// Ele resolve três coisas que nenhuma outra peça resolvia:
//   • RUMO CURTO. "Tome mais 2 territórios até o Ano II" é uma frase que cabe na
//     cabeça durante uma partida. "Maximize seu Legado" não é.
//   • FRACASSO PARCIAL. Dá pra falhar um Mandato e se recuperar. Antes o jogo só
//     tinha dois estados: de pé ou deposto.
//   • CAUSA NARRATIVA PARA A QUEDA. Falhar dois Mandatos seguidos derruba estabilidade
//     e aprovação de verdade — então quem cai, cai por uma história ("o gabinete
//     cansou de promessa"), não por uma barra que zerou no escuro.
//
// ── AS DUAS FORMAS DE MEDIR (e por que precisam ser duas) ─────────────
//   'feito' → N a mais de um tipo de feito DESDE A EMISSÃO. Usa `somaDeFeitos`, que
//     é a conta corrente real (anos fechados + ano em aberto). O alvo é congelado no
//     ato da emissão: "mais 2 territórios" tem de significar 2 a mais do que você já
//     tinha, senão quem chega no Ano IV com 14 conquistas cumpre tudo de graça.
//   'nivel' → um indicador do estado atinge um valor. Serve para o que não é evento:
//     caixa, PIB, ciência, inteligência. O alvo pode ser uma função avaliada UMA VEZ
//     na emissão (ex.: `pib + 4`), pelo mesmo motivo.
//
// ── POR QUE O MANDATO NÃO PODE SER IMPOSSÍVEL ─────────────────────────
// Todo alvo aqui foi calibrado para ser alcançável em 24 batidas por quem está
// jogando naquela doutrina, e desconfortável para quem não está. Um Mandato
// impossível não cria tensão — cria a decisão racional de ignorar o sistema inteiro,
// e aí o enredo morre no Ano IV.
import { somaDeFeitos, DOUTRINAS } from './doutrinas.js';
import { BATIDAS_POR_ANO, anoDoTurno } from './feitos.js';

export const ANOS_POR_MANDATO = 2;
export const TOTAL_MANDATOS = 5;

// Ano em que cada Mandato vence: II, IV, VI, VIII, X.
export function anoDeVencimento(n) { return n * ANOS_POR_MANDATO; }
export function turnoDeVencimento(n) { return anoDeVencimento(n) * BATIDAS_POR_ANO; }

const rom = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export const roman = (n) => rom[n] || String(n);

// ═══════════════════════════════════════════════════════════════════════
// O CATÁLOGO — cinco cobranças por doutrina
// ═══════════════════════════════════════════════════════════════════════
// A VOZ importa tanto quanto a meta. Quem cobra não é "o jogo": é o Estado-Maior, o
// conselho econômico, o Itamaraty, a opinião pública, a casa. Cada doutrina é cobrada
// por quem faria sentido cobrá-la, e é isso que faz o Mandato parecer política
// interna em vez de missão de tutorial.
const C = {
  conquistador: [
    { quem: 'O ESTADO-MAIOR', titulo: 'A PRIMEIRA FRONTEIRA',
      fala: 'Você assumiu prometendo mapa novo. Até o Ano II queremos ver a bandeira em mais dois territórios — ou os generais vão concluir que o discurso era só discurso.',
      meta: { tipo: 'feito', feito: 'conquista', mais: 2, rot: 'territórios tomados' } },
    { quem: 'O ESTADO-MAIOR', titulo: 'NÃO ACEITAMOS MAIS PROMESSA',
      fala: 'O primeiro avanço provou que dá. Agora provem que não foi sorte: mais quatro territórios até o Ano IV.',
      meta: { tipo: 'feito', feito: 'conquista', mais: 4, rot: 'territórios tomados' } },
    { quem: 'O ESTADO-MAIOR', titulo: 'UMA BANDEIRA A MENOS NO MAPA',
      fala: 'Ocupar é administrar problema dos outros. Anexe uma nação inteira até o Ano VI e o mundo para de tratar isto como aventura.',
      meta: { tipo: 'feito', feito: 'anexacao', mais: 1, rot: 'nações anexadas' } },
    { quem: 'O ALTO COMANDO', titulo: 'A CAMPANHA NÃO PODE PARAR',
      fala: 'Exército parado é exército que começa a pensar. Mais seis territórios até o Ano VIII.',
      meta: { tipo: 'feito', feito: 'conquista', mais: 6, rot: 'territórios tomados' } },
    { quem: 'A HISTÓRIA', titulo: 'O IMPÉRIO OU NADA',
      fala: 'Nenhum conquistador é lembrado pelo que tomou e devolveu. Chegue ao fim da década com oito territórios sob a sua bandeira.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.territorio) || 1, alvo: 8, rot: 'territórios sob a bandeira' } },
  ],
  industrial: [
    { quem: 'O CONSELHO ECONÔMICO', titulo: 'CAIXA ANTES DE DISCURSO',
      fala: 'Não se constrói nada com o cofre no vermelho. Queremos US$ 2 tri em caixa até o Ano II.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.tesouro) || 0, alvo: 2, rot: 'tri em caixa', casas: 2 } },
    { quem: 'A FEDERAÇÃO DAS INDÚSTRIAS', titulo: 'O BALCÃO ABRE',
      fala: 'Fabricar para si é indústria. Fabricar para os outros é poder. US$ 1 tri em armamento vendido até o Ano IV.',
      meta: { tipo: 'feito', feito: 'armas_vendidas', mais: 1, rot: 'tri em armas vendidas', casas: 2 } },
    { quem: 'O CONSELHO ECONÔMICO', titulo: 'CRESCER OU EXPLICAR',
      fala: 'A economia mundial não espera. Some quatro trilhões ao PIB até o Ano VI, ou explique isso ao Congresso.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.pib) || 0, alvo: (e) => (Number(e.pib) || 0) + 4, rot: 'tri de PIB', casas: 1 } },
    { quem: 'O MINISTÉRIO DE MINAS', titulo: 'O BARRIL É A ALAVANCA',
      fala: 'Quem domina a tecnologia do petróleo domina o preço de todo mundo. Ciência aplicada em 60 até o Ano VIII.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.tec_petroleo) || 0, alvo: 60, rot: 'de tecnologia do petróleo' } },
    { quem: 'O MERCADO', titulo: 'A FORTUNA DE UMA POTÊNCIA',
      fala: 'Termine a década com US$ 8 tri em caixa. Não é ganância: é o que separa quem manda de quem pede.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.tesouro) || 0, alvo: 8, rot: 'tri em caixa', casas: 2 } },
  ],
  arquiteto: [
    { quem: 'O ITAMARATY', titulo: 'A PRIMEIRA ASSINATURA',
      fala: 'Uma doutrina de alianças que não fecha nenhuma aliança é uma tese. Sele um pacto até o Ano II.',
      meta: { tipo: 'feito', feito: 'alianca', mais: 1, rot: 'pactos selados' } },
    { quem: 'O ITAMARATY', titulo: 'UM BLOCO, NÃO UM ACORDO',
      fala: 'Dois países são um acordo. Precisamos de mais um pacto até o Ano IV para isso virar bloco.',
      meta: { tipo: 'feito', feito: 'alianca', mais: 1, rot: 'pactos selados' } },
    { quem: 'A CHANCELARIA', titulo: 'A ORDEM PRECISA DE DENTES',
      fala: 'Bloco que não pune não é ordem, é clube. Faça valer uma sanção até o Ano VI.',
      meta: { tipo: 'feito', feito: 'sancao_aplicada', mais: 1, rot: 'sanções impostas' } },
    { quem: 'O ITAMARATY', titulo: 'O CENTRO DE GRAVIDADE',
      fala: 'Queremos o mapa se organizando em volta desta capital. Mais dois pactos até o Ano VIII.',
      meta: { tipo: 'feito', feito: 'alianca', mais: 2, rot: 'pactos selados' } },
    { quem: 'A HISTÓRIA', titulo: 'O QUE SOBREVIVE A VOCÊ',
      fala: 'Termine a década com soft power em 70. Instituição que depende de uma pessoa não é instituição.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.soft_power) || 0, alvo: 70, rot: 'de soft power' } },
  ],
  farol: [
    { quem: 'A OPINIÃO PÚBLICA', titulo: 'PÔR DINHEIRO ONDE ESTÁ A DOR',
      fala: 'Você prometeu contar os vivos. Invista meio trilhão em saúde até o Ano II — promessa sem orçamento é campanha.',
      meta: { tipo: 'feito', feito: 'cura_invest', mais: 0.5, rot: 'tri investidos em saúde', casas: 2 } },
    { quem: 'A DIPLOMACIA', titulo: 'SENTAR OS DOIS LADOS',
      fala: 'Mediar cansa e raramente rende manchete. Três rodadas de mediação até o Ano IV.',
      meta: { tipo: 'feito', feito: 'mediacao', mais: 3, rot: 'rodadas de mediação' } },
    { quem: 'A COMUNIDADE CIENTÍFICA', titulo: 'A CURA TEM DE TER SOBRENOME',
      fala: 'Financiar pesquisa é fácil de anunciar. Queremos uma doença enterrada até o Ano VI.',
      meta: { tipo: 'feito', feito: 'cura_final', mais: 1, rot: 'pandemias curadas' } },
    { quem: 'A OPINIÃO PÚBLICA', titulo: 'ACABAR UMA GUERRA QUE NÃO É SUA',
      fala: 'Encerre um conflito alheio até o Ano VIII. É a coisa mais difícil desta lista e a única que ninguém mais vai fazer.',
      meta: { tipo: 'feito', feito: 'paz_final', mais: 1, rot: 'guerras encerradas' } },
    { quem: 'O MUNDO', titulo: 'DERRUBAR A TEMPERATURA',
      fala: 'Termine a década com a tensão global abaixo de 25. Não depende só de você — e é exatamente por isso que vale.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.temp_guerra) || 0, alvo: 25, inverso: true, rot: 'de clima de guerra' } },
  ],
  sombra: [
    { quem: 'A CASA', titulo: 'O PRIMEIRO OUVIDO NA PAREDE',
      fala: 'Sem rede, você governa lendo jornal como todo mundo. Um vazamento até o Ano II.',
      meta: { tipo: 'feito', feito: 'espionagem', mais: 1, rot: 'segredos roubados' } },
    { quem: 'A CASA', titulo: 'REDE, NÃO SORTE',
      fala: 'Uma operação é acaso. Mais duas até o Ano IV, e passa a ser capacidade instalada.',
      meta: { tipo: 'feito', feito: 'espionagem', mais: 2, rot: 'segredos roubados' } },
    { quem: 'A CASA', titulo: 'SABER ANTES',
      fala: 'Inteligência em 70 até o Ano VI. Quem sabe primeiro não precisa atirar.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.inteligencia) || 0, alvo: 70, rot: 'de inteligência' } },
    { quem: 'A CASA', titulo: 'O TRABALHO NÃO PARA',
      fala: 'Mais três vazamentos até o Ano VIII. Um serviço que descansa é um serviço que vaza.',
      meta: { tipo: 'feito', feito: 'espionagem', mais: 3, rot: 'segredos roubados' } },
    { quem: 'A CASA', titulo: 'NENHUMA DIGITAL',
      fala: 'Termine a década sem uma única condenação no Conselho de Segurança. Tudo o que conseguimos vale zero se tiver o seu nome escrito.',
      meta: { tipo: 'nivel', ler: (e) => Number(e.dossie?.condenacoesONU) || 0, alvo: 0, inverso: true, rot: 'condenações na ONU' } },
  ],
};

// ── RECOMPENSA E CASTIGO ──────────────────────────────────────────────
// CALIBRAGEM: os medidores vão de 0 a 100 e uma ação forte mexe ~5 pontos. O Mandato
// acontece 5 vezes numa partida, então ele PODE pesar mais que uma ação — mas não
// pode decidir a partida sozinho. Cumprir dá o equivalente a duas ações boas;
// falhar tira o mesmo. O que realmente machuca é a REINCIDÊNCIA (ver `castigo`):
// falhar dois seguidos dobra o tombo, porque é aí que a história vira "o gabinete
// cansou" em vez de "um ano ruim".
const PREMIO = { aprovacao: 6, estabilidade: 5, soft_power: 2 };
const CASTIGO = { aprovacao: -6, estabilidade: -7 };

export function cofreMandato(estado) {
  if (!estado.mandatos || typeof estado.mandatos !== 'object') {
    estado.mandatos = { atual: null, historico: [], falhasSeguidas: 0 };
  }
  estado.mandatos.historico = estado.mandatos.historico || [];
  return estado.mandatos;
}

// ── EMITIR ────────────────────────────────────────────────────────────
// Congela o alvo no ato. É a decisão mais importante deste arquivo: um Mandato que
// mede total acumulado em vez de progresso desde a emissão premia quem já fez, e
// deixa de ser cobrança para virar troféu de participação.
export function emitirMandato(estado, n) {
  const doutrinaId = estado.doutrina?.id;
  const lista = C[doutrinaId];
  if (!lista || n < 1 || n > TOTAL_MANDATOS) return null;
  const base = lista[n - 1];
  const c = cofreMandato(estado);
  const m = {
    n, doutrina: doutrinaId, quem: base.quem, titulo: base.titulo, fala: base.fala,
    emitidoEm: estado.turno || 1,
    venceEm: turnoDeVencimento(n),
    anoVence: anoDeVencimento(n),
    tipo: base.meta.tipo, rot: base.meta.rot, casas: base.meta.casas || 0,
    inverso: !!base.meta.inverso,
  };
  if (base.meta.tipo === 'feito') {
    const soma = somaDeFeitos(estado);
    m.feito = base.meta.feito;
    m.partida = Math.round(((soma[base.meta.feito] || 0)) * 100) / 100;
    m.alvo = Math.round((m.partida + base.meta.mais) * 100) / 100;
  } else {
    m.partida = base.meta.ler(estado);
    m.alvo = typeof base.meta.alvo === 'function' ? base.meta.alvo(estado) : base.meta.alvo;
  }
  c.atual = m;
  return m;
}

// ── LER O PROGRESSO ───────────────────────────────────────────────────
// Devolve `{ atual, alvo, pct, cumprido, texto }`. Usado tanto pela barra na HUD
// (que precisa disso a cada batida) quanto pelo julgamento no vencimento — uma
// função só, para a barra nunca discordar do veredito.
export function progressoMandato(estado, m = null) {
  const man = m || cofreMandato(estado).atual;
  if (!man) return null;
  let atual;
  if (man.tipo === 'feito') {
    const soma = somaDeFeitos(estado);
    atual = Math.round(((soma[man.feito] || 0)) * 100) / 100;
  } else {
    const base = C[man.doutrina]?.[man.n - 1]?.meta;
    atual = base?.ler ? base.ler(estado) : 0;
  }
  const fmt = (v) => (man.casas ? Number(v).toFixed(man.casas) : String(Math.round(v)));
  // METAS INVERSAS (derrubar a tensão, não ter condenação) medem o caminho ao
  // contrário: o progresso é quanto você DESCEU da largada até o alvo. Sem isto a
  // barra do FAROL nasceria em 100% cheia e só desceria — o oposto da leitura certa.
  let pct;
  if (man.inverso) {
    const largada = Math.max(man.partida, man.alvo + 1);
    pct = atual <= man.alvo ? 100 : Math.max(0, Math.min(99, ((largada - atual) / Math.max(1, largada - man.alvo)) * 100));
  } else {
    const faixa = Math.max(0.0001, man.alvo - man.partida);
    pct = Math.max(0, Math.min(100, ((atual - man.partida) / faixa) * 100));
  }
  const cumprido = man.inverso ? atual <= man.alvo : atual >= man.alvo;
  return {
    atual, alvo: man.alvo, pct: Math.round(pct), cumprido,
    texto: man.inverso ? `${fmt(atual)} — alvo: ${fmt(man.alvo)} ou menos` : `${fmt(atual)} de ${fmt(man.alvo)}`,
    rot: man.rot,
  };
}

// ── JULGAR ────────────────────────────────────────────────────────────
// Chamado na virada de ano PAR. Devolve o veredito com os efeitos JÁ calculados —
// quem chama só aplica e desenha, e por isso não tem como esquecer metade.
export function julgarMandato(estado, m = null) {
  const c = cofreMandato(estado);
  const man = m || c.atual;
  if (!man) return null;
  const p = progressoMandato(estado, man);
  const ok = !!p?.cumprido;

  c.falhasSeguidas = ok ? 0 : (c.falhasSeguidas || 0) + 1;
  // A REINCIDÊNCIA é o que dói. Uma falha é um ano ruim; duas seguidas é o gabinete
  // concluindo que o problema é você. O multiplicador para em 2× — mais que isso
  // vira espiral da morte, e derrubar o jogador por acumulação automática seria
  // exatamente a "queda sem motivo" que este sistema existe para acabar.
  const mult = ok ? 1 : Math.min(2, c.falhasSeguidas);
  const efeitos = {};
  for (const [k, v] of Object.entries(ok ? PREMIO : CASTIGO)) efeitos[k] = Math.round(v * mult);

  c.historico.push({ n: man.n, titulo: man.titulo, cumprido: ok, ano: man.anoVence, alvo: man.alvo, atingido: p?.atual });
  c.atual = null;
  return { mandato: man, progresso: p, cumprido: ok, efeitos, reincidencia: c.falhasSeguidas, mult };
}

// Quantos foram cumpridos até agora — entra no Legado e na tela final.
export function placarDeMandatos(estado) {
  const h = cofreMandato(estado).historico;
  return { total: h.length, cumpridos: h.filter((x) => x.cumprido).length, historico: h };
}

// O Mandato que DEVERIA estar valendo neste turno. Existe para o save antigo (e para
// quem escolhe a doutrina no meio da partida) começarem no lugar certo em vez de
// receberem o Mandato I no Ano VIII.
export function mandatoDoTurno(turno) {
  const n = Math.floor((anoDoTurno(turno) - 1) / ANOS_POR_MANDATO) + 1;
  return Math.min(TOTAL_MANDATOS, Math.max(1, n));
}
