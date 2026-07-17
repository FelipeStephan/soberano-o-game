// DRAMATURGIA — o tom do jogo. Cru, adulto, +18. Frases que dão peso e emoção às ações.
// Nada de criancice: aqui o embaixador xinga, o mercado sangra e o povo cospe no seu nome.

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Soma os deltas de todas as ações + da carta, por variável.
export function agregarDeltas(resultados, cartaMudancas) {
  const soma = {};
  const add = (m) => { for (const x of m || []) soma[x.chave] = (soma[x.chave] || 0) + (x.delta || 0); };
  for (const r of resultados || []) add(r.mudancas);
  add(cartaMudancas);
  return soma;
}

// ── VEREDITO — o primeiro slide do turno ──────────────────────────────
// A regra do pedido: o jogador tem que bater o olho e SENTIR na hora — "dever
// cumprido" ou "nossa, me ferrei". Nada de resumo morno. O título é grande, a
// linha de baixo é curta e direta, e nenhuma das duas explica: elas VEREDICTAM.
// O detalhe (o que deu certo, o que custou) vem nos slides seguintes.
const VEREDITOS = {
  triunfo: {
    tom: 'triunfo',
    titulos: ['DEVER CUMPRIDO', 'SAIU TUDO', 'NA MOSCA', 'AULA DE GOVERNO'],
    linhas: ['Tudo o que você mandou fazer, foi feito.', 'Nenhuma ordem falhou. Aproveite: é raro.',
      'O gabinete não tem o que reclamar hoje.', 'Se governar fosse sempre assim, você era eterno.'],
  },
  bom: {
    tom: 'bom',
    titulos: ['NO PLACAR, VOCÊ GANHOU', 'DEU CERTO — QUASE TUDO', 'SALDO POSITIVO'],
    linhas: ['A maior parte saiu como você queria. O resto, o mundo cobra depois.',
      'Mais acerto que erro. É o que dá pra pedir.', 'Você avançou. Não sem arranhão.'],
  },
  misto: {
    tom: 'misto',
    titulos: ['METADE DE PÉ, METADE NO CHÃO', 'EMPATE FEIO', 'FICOU NO MEIO'],
    linhas: ['Uns acertos, uns tombos. O mundo não decidiu se te respeita.',
      'Nem vitória, nem derrota. Só conta pra pagar.', 'Você não perdeu. Também não ganhou nada.'],
  },
  ruim: {
    tom: 'ruim',
    titulos: ['NOSSA, ME FERREI', 'SAIU PELA CULATRA', 'ISSO DOEU'],
    linhas: ['A maior parte do que você mandou fazer explodiu na sua mão.',
      'Mais erro que acerto. E o mundo estava olhando.', 'Alguém vai ter que explicar isso. Você.'],
  },
  desastre: {
    tom: 'desastre',
    titulos: ['DESASTRE COMPLETO', 'NADA. DEU. CERTO.', 'DIA PARA ESQUECER'],
    linhas: ['Nenhuma ordem sua funcionou. Nenhuma.', 'Fracasso em toda a linha. O gabinete está em silêncio.',
      'Você gastou o turno inteiro para piorar tudo.'],
  },
};

// O veredito lê SÓ o que o jogador mandou fazer (as ações da fila) — é o julgamento
// das ORDENS DELE, não do mundo. O que o mundo aprontou vem depois, e é outra briga.
export function veredito({ resultados }) {
  const n = resultados?.length || 0;
  if (!n) return null;
  const ok = resultados.filter((r) => r.sucesso).length;
  const taxa = ok / n;
  let k;
  if (taxa === 1) k = 'triunfo';
  else if (taxa === 0) k = 'desastre';
  else if (taxa >= 0.66) k = 'bom';
  else if (taxa >= 0.34) k = 'misto';
  else k = 'ruim';
  const v = VEREDITOS[k];
  return { tom: v.tom, titulo: rand(v.titulos), linha: rand(v.linhas), ok, total: n };
}

// A manchete do turno — a "frase legal do ocorrido", sem tecniquês.
export function mancheteDoTurno({ soma, resultados, economia }) {
  const nuke = (resultados || []).some((r) => r.id === 'ogiva' && r.sucesso);
  const guerra = (resultados || []).some((r) => /guerra|conquista/.test(r.id) && r.sucesso);
  const golpe = (resultados || []).some((r) => /golpe|purga/.test(r.id) && r.sucesso);
  const apro = soma.aprovacao || 0;
  const dinh = (soma.tesouro || 0) + (economia?.saldo || 0);

  if (nuke) return rand([
    'O cogumelo ainda é teórico. O medo, não. O mundo inteiro sabe agora do que você é capaz.',
    'Você entrou no clube mais exclusivo e mais sujo do planeta. Ninguém mais vai te encarar de igual pra igual.',
  ]);
  if (guerra) return rand([
    'Fronteiras se movem a sangue. Cartógrafos vão ter trabalho — coveiros também.',
    'Você mandou os garotos pra picadeiro. Alguns voltam com medalha, muitos não voltam.',
  ]);
  if (golpe) return rand([
    'Uma faca no escuro, um governo a menos. Ninguém vai provar nada — mas todo mundo sabe.',
    'A oposição amanheceu quieta. Quieta demais. Do jeito que você gosta.',
  ]);
  if (apro <= -10) return rand([
    'O povo está com a corda no pescoço e o dedo apontado pra você. Isso não termina bem.',
    'Nas ruas já cospem seu nome como quem cospe no chão. Você perdeu a plateia.',
  ]);
  if (apro >= 10) return rand([
    'Por enquanto, você é o queridinho. Aproveite — multidão é a amante mais infiel que existe.',
    'Te aplaudem de pé. Amanhã pode ser a mesma multidão com tochas, mas hoje, aplausos.',
  ]);
  if (dinh >= 0.5) return rand([
    'O cofre transborda. E onde há dinheiro parado, há abutre farejando.',
    'Você fez chover no caixa. Os mercados te beijam a mão — enquanto der lucro.',
  ]);
  if (dinh <= -0.5) return rand([
    'Você torrou uma fortuna. Espero que valha a pena, porque a conta sempre chega.',
    'O caixa sangra. Contadores empalideceram, credores afiaram os dentes.',
  ]);
  return rand([
    'Mais um dia no comando do mundo. Ninguém disse que seria limpo.',
    'A engrenagem girou. Alguém ganhou, alguém perdeu, e a Máquina apenas observa.',
    'Nada explodiu hoje. Guarde o alívio — ele é sempre temporário.',
    'A história registrou seu turno. Se com respeito ou nojo, o tempo dirá.',
  ]);
}

// Despachos — reações cruas de figuras (embaixador, general, mercado, povo).
export function despachosDoTurno({ soma, resultados }) {
  const out = [];
  const sancionou = (resultados || []).some((r) => /sancao|sabotar/.test(r.id));
  const guerra = (resultados || []).some((r) => /guerra/.test(r.id));
  const apro = soma.aprovacao || 0;
  const lib = soma.liberdades || 0;

  if (guerra) out.push({ autor: 'Embaixador estrangeiro', tom: 'furia', texto: rand([
    '"Diga ao seu presidente que ele acabou de assinar a porra da própria sentença. Isto é guerra."',
    '"Vocês americanos acham que o mundo é quintal de vocês. Vão descobrir que não é, na marra."',
  ]) });
  if (sancionou) out.push({ autor: 'Embaixador estrangeiro', tom: 'furia', texto: rand([
    '"Sanções? Que gracinha. Cortem nosso petróleo e vamos ver quem chora primeiro, filhos da mãe."',
    '"Cada centavo que vocês nos tiram, nós cobramos em dobro. Anotem aí."',
  ]) });
  if (apro <= -8) out.push({ autor: 'Líder da oposição', tom: 'furia', texto: rand([
    '"Esse governo é uma vergonha nacional. O povo não aguenta mais essa palhaçada."',
    '"Enquanto vocês brincam de império, tem gente passando fome aqui dentro. Cadê a decência?"',
  ]) });
  if (lib <= -8) out.push({ autor: 'Jornalista independente', tom: 'medo', texto: rand([
    '"Primeiro calam a imprensa. Depois calam você. Anotem quem disse isso — se me deixarem."',
    '"Cada câmera a mais na rua é uma liberdade a menos. Mas quem liga, né?"',
  ]) });
  if ((soma.soft_power || 0) >= 8) out.push({ autor: 'Analista geopolítico', tom: 'respeito', texto:
    '"Jogada de mestre. O mundo inteiro reparou — e reparar é meio caminho pra obedecer."' });
  if (out.length === 0) out.push({ autor: 'General do Estado-Maior', tom: 'seco', texto: rand([
    '"Cumprimos as ordens, senhor. O tabuleiro mudou. Agora aguentamos o troco."',
    '"Feito. Não pergunte se foi certo — pergunte se estamos prontos pro que vem."',
  ]) });
  return out.slice(0, 2);
}

// Detecta um evento ÉPICO (dispara popup gigante com sirene). Retorna null ou objeto.
export function epicoDoTurno({ soma, resultados, bandaAntes, bandaDepois, estado, economia }) {
  const nuke = (resultados || []).some((r) => r.id === 'ogiva' && r.sucesso);
  const guerra = (resultados || []).some((r) => /guerra|conquista/.test(r.id) && r.sucesso);

  if (nuke) return { tipo: 'bom', titulo: 'POTÊNCIA NUCLEAR', texto: 'Sua primeira ogiva está operacional. A partir de agora, ninguém ergue a voz na sua frente sem pensar duas vezes. O planeta acaba de mudar de dono — e o dono é você.' };
  if (guerra) return { tipo: 'bom', titulo: 'TERRITÓRIO CONQUISTADO', texto: 'As botas cruzaram a fronteira e não recuaram. Um novo pedaço do mundo carrega sua bandeira — pintado com sangue, como todo império sempre foi.' };
  if (bandaAntes && bandaDepois && bandaDepois.min > bandaAntes.min) return {
    tipo: 'bom', titulo: `ASCENSÃO: ${bandaDepois.nome.toUpperCase()}`,
    texto: `A História abriu espaço na primeira fila. Você subiu de patamar e agora joga entre os grandes. Não olhe pra trás — atrás só tem quem você deixou comendo poeira.` };
  if (bandaAntes && bandaDepois && bandaDepois.min < bandaAntes.min) return {
    tipo: 'ruim', titulo: `QUEDA: ${bandaDepois.nome.toUpperCase()}`,
    texto: `O chão cedeu sob seus pés. Você despencou de nível e o mundo sentiu o cheiro de sangue. Reaja agora, ou vire nota de rodapé.` };
  if (estado.aprovacao <= 12) return {
    tipo: 'ruim', titulo: 'REVOLTA IMINENTE', texto: 'As ruas estão em chamas e seu nome é a palavra de ordem dos que gritam. Mais um empurrão e o seu governo vira pó. O relógio está correndo.' };
  return null;
}

// Frase de IMPACTO da ação, citando o presidente pelo nome. Uma linha que dói ou orgulha.
export function fraseImpacto(r, presidente) {
  const P = presidente || 'O presidente';
  const id = r.id || '';
  if (/guerra|conquista/.test(id)) {
    return r.sucesso
      ? `${P} assistiu à bandeira subir${r.alvo ? ` em ${r.alvo}` : ''} de dentro da Sala de Crise. Não sorriu — sabia o preço em caixões.`
      : `${P} foi informado da derrota às 4h da manhã. Não voltou a dormir. Lá fora, o mundo já ria.`;
  }
  if (/ogiva|nuclear/.test(id)) {
    return r.sucesso
      ? `${P} recebeu a confirmação num envelope lacrado. A partir de hoje, ninguém mais fala com ele do mesmo jeito.`
      : `O programa vazou antes de existir. ${P} agora é um pária segurando urânio e uma desculpa.`;
  }
  if (/golpe|purga/.test(id)) {
    return r.sucesso
      ? `${P} nunca assinou nada. Mas o governo caiu, e todo mundo sabe de quem foi a mão.`
      : `A trama estourou na mesa de ${P}. Agora o vilão da história tem nome e sobrenome — o dele.`;
  }
  if (/publicidade|propaganda|influen/.test(id)) {
    return r.sucesso
      ? `A imagem de ${P} apareceu em cada tela do país. Funcionou. Sempre funciona, até parar de funcionar.`
      : `A campanha foi ao ar e morreu no ar. ${P} pagou caro pra ser ignorado.`;
  }
  if (/imposto_up|reforma/.test(id)) return `${P} assinou sabendo que ia doer. A conta chega no bolso de quem votou nele.`;
  if (/imposto_down|subsidio|bem_estar/.test(id)) return `${P} abriu o cofre e o povo aplaudiu. Os credores anotaram tudo em silêncio.`;
  if (/espionar|satelite|cyber|vigilancia|aviao_espiao/.test(id)) {
    return r.sucesso ? `${P} agora sabe de coisas que não pode admitir que sabe.`
      : `A operação queimou. ${P} vai ter que explicar o inexplicável.`;
  }
  if (/inf|blindados|helis|cacas|porta_avioes|submarino|hipersonico|mobilizar/.test(id)) {
    return r.sucesso ? `${P} apertou a mão dos generais na frente das câmeras. O aço chegou; a conta também.`
      : `A entrega falhou. ${P} vai fingir que o prazo sempre foi outro.`;
  }
  // ── POLÍTICA: quando a jogada esperta dá certo × quando estoura na mão ──
  if (/comprar_congresso|propina|caixa_dois|perseguir_opositor/.test(id)) {
    return r.sucesso
      ? `Correu tudo nos bastidores. ${P} sorri pra câmera enquanto o acordo é selado no escuro — por enquanto, ninguém viu nada.`
      : `Vazou. O áudio já roda em cada celular do país e o nome de ${P} está na chamada de todos os jornais. Agora é dano.`;
  }
  if (/anticorrupcao/.test(id)) {
    return r.sucesso ? `${P} entregou os grandes às manchetes e virou herói da semana. Os que sobraram tomaram nota do endereço.`
      : `A operação mirou alto e ricocheteou. ${P} descobriu, tarde, de quem era o teto que tentou derrubar.`;
  }
  if (/censura_imprensa|estado_excecao/.test(id)) {
    return r.sucesso ? `${P} baixou o pano sobre o barulho. Dentro do país fez silêncio; fora dele, o mundo anotou mais um nome na lista.`
      : `A mão pesada escorregou. ${P} virou manchete justamente onde queria calar.`;
  }
  if (/pronunciamento|pacote_congresso|base_aliada|reforma_impopular/.test(id)) {
    return r.sucesso ? `${P} costurou o acordo na madrugada e saiu com a base fechada. Governar é isto: telefonema por telefonema.`
      : `A articulação de ${P} desandou na porta do gabinete. Aliado de véspera é adversário de manhã.`;
  }
  // ── FALLBACK ──────────────────────────────────────────────────────
  // Era UMA frase fixa, e por isso aparecia três vezes na mesma tela.
  // Agora é um repertório com memória: a mesma linha não volta enquanto
  // houver outra disponível. E o texto muda conforme o PESO da jogada —
  // gastar 1 tri não pode soar igual a gastar 30 bilhões.
  const caro = (r.custo || 0) >= 0.5;
  const pool = r.sucesso
    ? (caro ? [
      `${P} assinou o cheque sem piscar. Números desse tamanho já não significam nada pra ele — e é exatamente esse o problema.`,
      `Saiu caro e saiu feito. ${P} vai chamar de investimento; o Tesouro vai chamar de buraco.`,
      `${P} bancou até o fim. Quando o dinheiro é grande assim, o recuo custa mais que o erro.`,
      `Feito. ${P} torrou uma fortuna e conseguiu o que queria — que é como se compra tempo neste ofício.`,
    ] : [
      `${P} riscou mais um item da lista. O país nem percebeu — e é assim que se governa.`,
      `Executado sem ruído. ${P} aprendeu que as jogadas que funcionam raramente viram manchete.`,
      `${P} despachou o assunto entre dois cafés. Burocracia é onde o poder mora de verdade.`,
      `Deu certo, e ninguém aplaudiu. ${P} já parou de esperar aplauso.`,
      `${P} resolveu num telefonema o que os antecessores deixaram apodrecer por anos.`,
      `Saiu como planejado. ${P} anotou mentalmente: mais uma coisa que só ele sabe que aconteceu.`,
    ])
    : (caro ? [
      `${P} queimou uma fortuna e não comprou nada. Esse tipo de conta, alguém sempre paga na eleição seguinte.`,
      `O dinheiro sumiu e o resultado não veio. ${P} vai passar meses explicando esse rombo.`,
      `Fracasso caro é o pior tipo: ${P} não pode nem fingir que foi um teste barato.`,
    ] : [
      `Não saiu como ${P} prometeu. Ninguém vai deixar ele esquecer.`,
      `Falhou. ${P} vai enterrar isso num relatório que ninguém lê — se tiver sorte.`,
      `${P} calculou errado. Acontece. O problema é que ele calculou errado em público.`,
      `Não funcionou, e os assessores já estão ensaiando de quem foi a culpa. Não vai ser dele.`,
    ]);
  return semRepetir(pool);
}

// Memória curta de frases: evita a mesma linha duas vezes seguidas na tela.
// Guarda até 12 — o suficiente pra cobrir um turno inteiro sem eco.
const _ditas = [];
function semRepetir(pool) {
  const livres = pool.filter((f) => !_ditas.includes(f));
  const f = livres.length ? livres[Math.floor(Math.random() * livres.length)]
    : pool[Math.floor(Math.random() * pool.length)];
  _ditas.push(f);
  if (_ditas.length > 12) _ditas.shift();
  return f;
}

// Frase curta e visceral por resultado, temática conforme o tipo de ação.
export function faseFraseResultado(r) {
  const id = r.id || '';
  if (/guerra|conquista/.test(id)) {
    return r.sucesso
      ? rand([`As linhas inimigas ruíram. O território${r.alvo ? ' de ' + r.alvo : ''} é seu — pago em sangue.`, 'Blindados cruzaram a fronteira e não recuaram. Vitória a ferro e fogo.'])
      : rand([`A invasão foi repelida. Nossos rapazes ficaram no barro${r.alvo ? ' de ' + r.alvo : ''}, e o mundo assistiu à humilhação.`, 'Empurraram a gente de volta. Caixões chegando, manchetes rindo da sua cara.']);
  }
  if (/golpe/.test(id)) {
    return r.sucesso
      ? rand([`O governo${r.alvo ? ' de ' + r.alvo : ' alvo'} caiu de madrugada. Ninguém prova nada — mas todos sabem.`, 'Peças trocadas no tabuleiro sem um tiro público. Limpo e sujo ao mesmo tempo.'])
      : rand(['A trama vazou. Agora somos os vilões da história, com o dedo apontado no telão.', 'Os agentes foram pegos. Escândalo internacional na certa — e o troco vem.']);
  }
  if (/sabotar/.test(id)) {
    return r.sucesso ? 'A infraestrutura deles virou fumaça. Silêncio total do nosso lado.'
      : 'Fomos pegos com a mão na massa. Prepare-se pra retaliação.';
  }
  if (/ogiva|nuclear/.test(id)) {
    return r.sucesso ? 'Ogiva operacional. O planeta inteiro acaba de sentir um calafrio.'
      : 'O programa falhou e vazou. Agora somos um pária com urânio nas mãos.';
  }
  if (/purga/.test(id)) {
    return r.sucesso ? 'A oposição amanheceu quieta. Do jeito que você gosta.'
      : 'A repressão explodiu na sua mão. As ruas estão em fúria.';
  }
  if (r.sucesso) return rand(['Executado com precisão cirúrgica.', 'Deu certo. Anote a vitória.', 'No alvo. Limpo.', 'Ordem cumprida à risca.']);
  return rand(['Fracassou feio. Alguém vai pagar por isso.', 'Deu tudo errado. Que merda.', 'Falhou — e o custo não volta.', 'Abortada no pior momento.']);
}
