// A BARRA DE DESTINO — a trajetória da nação, de "Em Colapso" a "Imperador do Mundo".
// É um índice composto (0–100) recalculado a cada turno. As bandas dão o tom do jogo
// e definem vitória/derrota no fim da era.

// Calcula o Destino a partir do estado.
export function calcularDestino(estado) {
  // vigor interno/externo (0–100)
  const vigor = media([
    estado.aprovacao, estado.estabilidade, estado.soft_power,
    estado.seguranca, estado.poder_militar,
  ]);

  // saúde econômica (0–100) — escala de trilhões: pib base ~28, tesouro ~3, dívida ~120%
  const econ = clamp(
    50 + estado.tesouro * 8 + (estado.pib - 28) * 2 - (estado.divida - 100) * 0.4,
    0, 100,
  );

  // Expansão territorial empurra o topo (rumo a Imperador), mas com TETO: conquistar
  // é significativo, não é botão de vitória. O território sozinho leva no máximo até a
  // faixa de Hegemon; passar disso exige uma nação forte em tudo (vigor + economia).
  const bonusTerritorio = Math.min(28, Math.max(0, estado.territorio - 1) * 4);

  // penalidades
  const penalidade = estado.temp_guerra * 0.1;

  const bruto = 0.5 * vigor + 0.3 * econ + bonusTerritorio - penalidade;

  // ── O TETO DO IMPÉRIO ────────────────────────────────────────────────
  // Virar "Imperador do Mundo" é o objetivo do jogo — e por isso NÃO pode cair no
  // colo de quem só tem economia boa. Sem IMPÉRIO de verdade (muito território, na
  // ordem de um continente) E muito dinheiro, o Destino trava na faixa de Hegemon (90).
  // Cada nível acima disso pede mais conquista: território 12 abre a porta; ~22 chega
  // ao topo. É assim que o jogo transparece "domine o mundo, não uma planilha".
  const territorio = estado.territorio || 1;
  const rico = (estado.tesouro || 0) >= 6;                       // caixa de superpotência
  let teto = 90;
  if (territorio >= 12 && rico) teto = 90 + Math.min(10, (territorio - 12) * 1.0);
  else if (territorio >= 12) teto = 93;                          // domina, mas quebrado: não fecha o império

  return Math.round(clamp(bruto, 0, teto));
}

// Bandas da linha do Destino.
export const BANDAS = [
  { min: 0,  max: 12,  nome: 'Em Colapso',        icone: '☠️', cor: '#ff5a6e' },
  { min: 13, max: 28,  nome: 'Nação à Beira',     icone: '🩹', cor: '#ff8c42' },
  { min: 29, max: 44,  nome: 'Potência Regional', icone: '🛡️', cor: '#ffcc4f' },
  { min: 45, max: 60,  nome: 'Grande Potência',   icone: '⚔️', cor: '#4fe0c8' },
  { min: 61, max: 75,  nome: 'Superpotência',     icone: '🌐', cor: '#4fd1ff' },
  { min: 76, max: 90,  nome: 'Hegemon Global',    icone: '🦅', cor: '#b98cff' },
  { min: 91, max: 100, nome: 'Imperador do Mundo', icone: '👑', cor: '#ffd447' },
];

export function bandaDe(destino) {
  return BANDAS.find((b) => destino >= b.min && destino <= b.max) || BANDAS[0];
}

// ═══════════════════════════════════════════════════════════════════════
// OS TRÊS DESFECHOS — e por que o terceiro precisou existir
// ═══════════════════════════════════════════════════════════════════════
// O RELATO DO DONO: "uma potência fez tanta coisa boa e foi deposto com um texto
// arrasador, nem mostrou o motivo — e saiu dizendo que o relógio zerou".
//
// Ele estava certo, e não era bug: chegar ao fim dos 120 meses devolvia
// `tipo: 'derrota'` sempre que o Destino fechasse abaixo de 61. Isso jogava quem
// governou uma década inteira e virou GRANDE POTÊNCIA na MESMA tela de quem foi
// deposto por aprovação zero — caveira, "FIM DE LINHA", flash vermelho — com um
// texto que só dizia o que a nação NÃO virou ("terminou apenas como X").
//
// Duas coisas estavam confundidas num campo só: "o jogo acabou como?" e "você
// perdeu?". Terminar o mandato não é ser deposto. Agora são três:
//   • 'vitoria' — você fechou o jogo: Imperador do Mundo. Só isso.
//   • 'derrota' — o comando foi ARRANCADO de você: colapso total, deposição.
//   • 'legado'  — a era acabou com você ainda no poder. Retrospectiva, não sentença.
// O nível ('imperio'…'sofrido') gradua o TOM dentro do legado, para a tela poder
// ser digna com quem governou bem sem virar bajulação para quem não governou.

// O retrato do fim de era. REGRA DE ESCRITA: diga o que a nação VIROU, com números
// dela — nunca o que ela deixou de virar. Sarcasmo só na faixa de baixo, onde o
// país de fato foi mal tratado; quem construiu merece dignidade, não alfinetada.
const RETRATO_ERA = {
  imperio: (b, e) => `A década fecha com o mundo girando em torno da sua capital. ${terr(e)} Nenhuma decisão relevante do planeta foi tomada sem alguém antes perguntar o que você acharia. Você não terminou a era: você definiu a próxima.`,
  triunfo: (b, e) => `Você entrega uma nação que dita a agenda do planeta. ${terr(e)} Governos que hoje se dizem soberanos passam metade do expediente calculando a sua reação — e é assim que se mede hegemonia. A era acaba com o seu nome no topo de todas as listas.`,
  solido: (b, e) => `Dez anos depois, sua nação é uma das poucas que o resto do mundo tem de levar a sério em toda mesa. ${terr(e)} Não é o império que a Máquina prometeu no primeiro dia — é algo mais raro: uma potência de verdade, construída e entregue de pé.`,
  respeitavel: (b, e) => `A era termina com uma nação forte, respeitada e senhora do próprio destino. ${terr(e)} Você não dobrou o planeta, e ninguém dobrou você: entrega um país que decide sozinho o que faz amanhã. É mais do que a maioria dos governantes deixa.`,
  modesto: (b, e) => `A era termina com a sua nação firme no próprio quintal: peso reconhecido na região, voz que os vizinhos escutam. ${terr(e)} O tabuleiro global seguiu sendo decidido em outras salas — mas a sua ficou de pé, e havia caminhos abertos para ir bem mais longe.`,
  sofrido: (b, e) => `A era termina com a nação inteira — e é sobre isso que os livros vão discutir. ${terr(e)} Você atravessou a década segurando as pontas enquanto o mundo corria por fora; ficou o país, ficaram as feridas, e ficou a conta do que não foi construído.`,
};
function terr(e) {
  const t = Number(e?.territorio) || 1;
  const pib = Number(e?.pib) || 0;
  if (t > 1) return `São ${t} territórios sob sua bandeira e um PIB de US$ ${pib.toFixed(1)} tri.`;
  return `Fronteiras intactas e um PIB de US$ ${pib.toFixed(1)} tri.`;
}

function nivelDaEra(destino) {
  if (destino >= 91) return 'imperio';
  if (destino >= 76) return 'triunfo';
  if (destino >= 61) return 'solido';
  if (destino >= 45) return 'respeitavel';
  if (destino >= 29) return 'modesto';
  return 'sofrido';
}

// Verifica fim por Destino/era. Retorna null ou { tipo, causa, titulo, texto, ... }.
export function checarDestino(estado, destino, turno, eraTurnoMax) {
  if (destino >= 95) {
    return { tipo: 'vitoria', causa: 'dominio', destino, banda: bandaDe(destino), titulo: '👑 Imperador do Mundo', texto: 'A Máquina se cala. Nenhuma nação rivaliza com a sua. Você não apenas sobreviveu à história — você a dobrou à sua vontade.' };
  }
  if (destino <= 4) {
    return { tipo: 'derrota', causa: 'colapso', destino, banda: bandaDe(destino), titulo: '☠️ Colapso Total', texto: 'A nação implodiu sob seu comando. A Máquina embaralha as cartas e seu nome vira nota de rodapé.' };
  }
  if (turno >= eraTurnoMax) {
    const banda = bandaDe(destino);
    const nivel = nivelDaEra(destino);
    return {
      tipo: 'legado', causa: 'tempo', nivel, destino, banda,
      // Sem "apenas": o título nomeia a nação que existe, não a que faltou.
      titulo: `Fim da Era — ${banda.icone} ${banda.nome}`,
      texto: RETRATO_ERA[nivel](banda, estado),
    };
  }
  return null;
}

// ── O TOM DA TELA FINAL — um lugar só pra decidir cor, ícone e etiqueta ──
// Antes a UI decidia isso com `fim.tipo === 'vitoria'`, e todo desfecho que não
// fosse vitória caía no ramo caveira-vermelho-flash. Com três tipos, esse if vira
// mentira: quem fecha a era como Superpotência não pode receber o mesmo tratamento
// visual de quem foi deposto. A UI passa a perguntar aqui, e nunca mais precisa
// saber quantos desfechos existem.
export function tomDoFim(fim) {
  const tipo = fim?.tipo;
  if (tipo === 'vitoria') {
    return { classe: 'v', icone: 'crown', flash: false, bom: true,
      tag: 'FIM DO REINADO · LEGADO GARANTIDO', acento: 'var(--ambar)' };
  }
  if (tipo === 'legado') {
    const alto = ['imperio', 'triunfo', 'solido'].includes(fim.nivel);
    const medio = fim.nivel === 'respeitavel';
    return {
      classe: 'l', icone: alto ? 'landmark' : 'hourglass', flash: false, bom: alto || medio,
      tag: alto ? 'FIM DA ERA · A DÉCADA FOI SUA'
        : medio ? 'FIM DA ERA · MANDATO CUMPRIDO ATÉ O FIM'
        : 'FIM DA ERA · VOCÊ CHEGOU AO FIM DE PÉ',
      acento: fim.banda?.cor || 'var(--cyan)',
    };
  }
  return { classe: 'd', icone: 'skull', flash: true, bom: false,
    tag: 'FIM DO REINADO · A HISTÓRIA SEGUIU SEM VOCÊ', acento: 'var(--perigo)' };
}

// Onde você estava e quanto faltava para o degrau seguinte. Existe porque
// "faltaram 4 pontos" é informação; "você não dominou" é xingamento.
export function proximaBanda(destino) {
  const i = BANDAS.findIndex((b) => destino >= b.min && destino <= b.max);
  const idx = i < 0 ? 0 : i;
  const proxima = BANDAS[idx + 1] || null;
  return { atual: BANDAS[idx], proxima, faltam: proxima ? Math.max(1, proxima.min - destino) : 0 };
}

// ── O QUE SEGUROU A NAÇÃO — engenharia reversa da fórmula acima ─────────
// A tela de fim dizia "nenhum indicador isolado explica: foi o conjunto da obra".
// Para quem perdeu, isso é um insulto sem informação — o jogador sai sem saber o
// que fazer diferente na próxima partida. Aqui a própria fórmula do Destino é lida
// de trás pra frente: cada alavanca devolve quantos PONTOS DE DESTINO ela ainda
// tinha para dar. Os pesos (0.5 vigor / 0.3 econ / território direto) são os mesmos
// de calcularDestino() — se alguém mexer lá, mexa aqui também.
export function lacunasDeDestino(estado, destino = null) {
  const e = estado || {};
  const num = (v) => Math.round(Number(v) || 0);
  const d = destino == null ? calcularDestino(e) : destino;
  const lac = [];

  // Vigor: média de 5 indicadores com peso 0.5 → cada ponto vale 0.1 de Destino.
  const VIGOR = [
    ['aprovacao', 'Aprovação', 'o povo é o combustível de tudo'],
    ['estabilidade', 'Estabilidade', 'país que treme não projeta força'],
    ['soft_power', 'Soft power', 'influência sem tiro é a mais barata'],
    ['seguranca', 'Segurança', 'quem não dorme tranquilo não planeja longe'],
    ['poder_militar', 'Poder militar', 'a mesa só respeita quem pode dizer não'],
  ];
  for (const [ch, rot, porque] of VIGOR) {
    const v = num(e[ch]);
    if (v >= 85) continue;
    lac.push({ k: rot, v: `${v}`, ganho: Math.round((85 - v) * 0.1 * 10) / 10,
      txt: `${porque} — cada 10 pontos aqui valem 1 de Destino` });
  }

  // Território: bônus direto, 4 pontos por país anexado, teto de 28.
  const t = Number(e.territorio) || 1;
  const bonusAtual = Math.min(28, Math.max(0, t - 1) * 4);
  if (bonusAtual < 28) {
    lac.push({ k: 'Território', v: `${t}`, ganho: Math.round((28 - bonusAtual) * 10) / 10,
      txt: `cada país anexado vale 4 de Destino, até o teto de 28${t >= 8 ? '' : ' — é a alavanca mais rápida do jogo'}` });
  }

  // Economia: peso 0.3 sobre um índice que responde a caixa, PIB e dívida.
  const tesouro = Number(e.tesouro) || 0;
  if (tesouro < 6) {
    lac.push({ k: 'Tesouro', v: `US$ ${tesouro.toFixed(2)} tri`, ganho: Math.round((6 - tesouro) * 8 * 0.3 * 10) / 10,
      txt: 'cada US$ 1 tri em caixa vale ~2,4 de Destino (e US$ 6 tri é o piso de superpotência)' });
  }
  const divida = num(e.divida);
  if (divida > 100) {
    lac.push({ k: 'Dívida', v: `${divida}% do PIB`, ganho: Math.round((divida - 100) * 0.4 * 0.3 * 10) / 10,
      txt: 'cada 10 p.p. acima de 100% custam 1,2 de Destino — e sufocam PIB e aprovação por fora' });
  }
  const guerra = num(e.temp_guerra);
  if (guerra > 20) {
    lac.push({ k: 'Clima de guerra', v: `${guerra}`, ganho: Math.round((guerra - 20) * 0.1 * 10) / 10,
      txt: 'tensão permanente é desconto direto no Destino — cada 10 pontos custam 1' });
  }

  // ── O TETO DO IMPÉRIO, dito em voz alta ──────────────────────────────
  // Sem isto, o jogador com economia impecável e 1 território bate em 90 e nunca
  // entende por quê. A regra existe em calcularDestino(); esconder ela do relatório
  // é o mesmo que não ter regra.
  if (d >= 84 && !(t >= 12 && tesouro >= 6)) {
    lac.push({ k: 'Teto do império', v: t >= 12 ? 'caixa curto' : `${t} território(s)`, ganho: 100 - d,
      txt: t >= 12
        ? 'você domina o mapa mas está quebrado: o topo pede US$ 6 tri em caixa'
        : 'o Destino trava em 90 sem império de verdade: 12 territórios abrem a porta, ~22 chegam ao trono' });
  }

  return lac.sort((a, b) => b.ganho - a.ganho).filter((l) => l.ganho >= 0.5);
}

function media(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
