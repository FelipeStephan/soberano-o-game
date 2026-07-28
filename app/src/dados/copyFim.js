// ═══════════════════════════════════════════════════════════════════════
// O BANCO DE FRASES DO FIM — a copy do último minuto de partida
// ═══════════════════════════════════════════════════════════════════════
// O PEDIDO DO DONO: "melhora essas copys para não ficar repetitivo e ter um banco de
// frases pré prontas para cada situação. (...) eu não gosto desses textos não
// humanizados e ruim. Quero uma copy mais criativa."
//
// ── O BUG QUE ELE FLAGROU NO MEIO DO PEDIDO ───────────────────────────
// Ele colou um obituário que dizia "governou por 120 MESES e saiu pela porta dos
// fundos". Cento e vinte meses é a DÉCADA INTEIRA — esse governo não caiu, ele
// terminou. O gerador só tinha dois caminhos (venceu / não venceu), e tudo que não
// era império caía no texto de deposto. Quem entregou o mandato levava um necrológio
// de derrubado. Agora são TRÊS desfechos e nove nuances, e nenhuma frase de queda
// pode alcançar quem chegou ao fim de pé.
//
// ── POR QUE UM BANCO, E NÃO FRASES ESPALHADAS NA TELA ─────────────────
// Três razões práticas:
//   1. REPETIÇÃO. A tela de fim é a que o jogador mais relê — ele perde, recomeça,
//      perde de novo. Uma frase fixa vira piada interna no terceiro reinado.
//   2. TOM. Com o texto espalhado por três arquivos, ninguém percebe que a etapa 1
//      está debochando de quem a etapa 3 está tratando com respeito.
//   3. EDIÇÃO. O dono vai querer mexer nisto. Mexer tem de ser abrir UM arquivo e
//      trocar uma linha — não caçar template string dentro de função de render.
//
// ── A REGRA DE ESCRITA (a mesma do resto do jogo) ─────────────────────
// • CONCRETO vence abstrato. "Alguém já está sentado na sua cadeira" é abstrato;
//   "o carro oficial saiu do pátio às seis e não voltou" é uma imagem. Coisas do
//   mundo: a cadeira, o cofre, o comboio, o rádio, a chave, o carimbo, o corredor.
// • O jogo é +18 e cínico com GOVERNOS — nunca com povos. Xingamento aqui é contra
//   o poder, e o alvo é sempre ficcional.
// • DIGNIDADE PARA QUEM CONSTRUIU. Quem atravessa dez anos de pé recebe uma frase
//   que reconhece isso, mesmo tendo terminado pequeno. Sarcasmo só desce na faixa em
//   que o país de fato foi mal tratado.
// • Nada de clichê motivacional, nada de "jornada", nada de reticências dramáticas.

// ── O SORTEIO ─────────────────────────────────────────────────────────
// Uma partida, uma escolha. O índice sai de um hash da SEMENTE (país + presidente +
// mês do fim), então: a mesma tela redesenhada dez vezes mostra o mesmo texto (senão
// a frase mudaria enquanto o jogador lê), e duas partidas diferentes quase nunca
// mostram o mesmo. O `sal` desencontra os slots entre si — sem ele, todos os slots
// cairiam no mesmo índice e a tela inteira andaria em bloco.
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
export function escolher(lista, semente, sal = 0) {
  if (!Array.isArray(lista) || !lista.length) return '';
  return lista[(hash(String(semente || 'x')) + sal * 2654435761) % lista.length];
}

// Os textos do diagnóstico (`diag.culpados[].txt`) nascem em minúscula, porque lá eles
// são complemento de frase ("Aprovação 3% — o povo deixou de te querer"). Aqui viram
// frase inteira depois de um ponto, e "3%. o povo deixou" é o tipo de detalhe que faz
// o texto parecer gerado por máquina.
const cap = (s) => { const t = String(s || '').trim(); return t ? t[0].toUpperCase() + t.slice(1) : ''; };

// ═══════════════════════════════════════════════════════════════════════
// AS NOVE SITUAÇÕES
// ═══════════════════════════════════════════════════════════════════════
// Três desfechos × as nuances que mudam o que se pode dizer sem mentir:
//
//   derrota → povo · divida · guerra · colapso · generico
//   legado  → alto · medio · baixo
//   vitoria → (uma só: chegar aqui já é a nuance)
//
// `situacaoDoFim` traduz o estado bruto nisso. Ele mora aqui e não na tela porque é
// uma regra de CONTEÚDO — quem escreve as frases é quem tem de decidir quando cada
// uma pode aparecer.
export function situacaoDoFim({ tipo, nivel, aprovacao = 50, divida = 0, estabilidade = 50, guerras = 0 } = {}) {
  if (tipo === 'vitoria') return 'vitoria';
  if (tipo === 'legado') {
    if (['imperio', 'triunfo', 'solido'].includes(nivel)) return 'alto';
    if (nivel === 'respeitavel') return 'medio';
    return 'baixo';
  }
  // Deposição: a ORDEM importa. Um governo que caiu com o povo na rua E dívida alta
  // caiu pelo povo — a dívida foi o motivo, a rua foi o fato. Contar o motivo no
  // lugar do fato é o erro que faz o texto soar de planilha.
  if (Number(aprovacao) <= 8) return 'povo';
  if (Number(estabilidade) <= 8) return 'colapso';
  if (guerras > 0) return 'guerra';
  if (Number(divida) >= 180) return 'divida';
  return 'generico';
}

// ── ETAPA 1 · O VEREDITO ──────────────────────────────────────────────
// O rótulo é a placa (mono, pequeno), o título é o soco (display, grande), e o
// subtítulo é a imagem concreta que faz a coisa parecer real.
export const VEREDITO = {
  povo: {
    rot: ['A RUA CHEGOU PRIMEIRO', 'CENTO E TREZE DIAS DE PANELA', 'O CERCO FECHOU NA AVENIDA'],
    tit: ['O POVO TE TIROU', 'ACABOU NA CALÇADA', 'ELES VIERAM BUSCAR'],
    sub: [
      'A guarda do palácio não foi vencida — ela simplesmente parou de aparecer no turno da noite.',
      'O mesmo som que te elegeu, buzina e panela, foi o que ninguém conseguiu desligar no último mês.',
      'Você tinha o exército, o cofre e a televisão. Não tinha mais ninguém disposto a atender o telefone.',
    ],
  },
  colapso: {
    rot: ['O ESTADO SE PARTIU', 'AS PROVÍNCIAS PARARAM DE LIGAR', 'NÃO HÁ MAIS UM GOVERNO SÓ'],
    tit: ['O PAÍS RACHOU', 'CADA UM POR SI', 'O CENTRO NÃO SEGUROU'],
    sub: [
      'Não houve golpe. Houve três capitais dando ordens diferentes na mesma manhã, e nenhuma era a sua.',
      'O país não foi tomado: ele se dividiu sozinho, e cada pedaço já imprimiu a própria papelada.',
      'A última ordem que saiu do gabinete foi cumprida em dois estados. Nos outros, arquivaram.',
    ],
  },
  guerra: {
    rot: ['A FRENTE ENGOLIU O GOVERNO', 'PERDEU A GUERRA E O CARGO', 'O ESTADO-MAIOR MUDOU DE LADO'],
    tit: ['CAIU NA GUERRA', 'A CONTA DA FRENTE', 'DERRUBADO EM CAMPANHA'],
    sub: [
      'Governo nenhum sobrevive a uma guerra que não termina. O seu tentou, e virou parte do custo.',
      'Os generais aguentaram enquanto havia vitória para anunciar. Acabaram as vitórias, acabou você.',
      'Você prometeu que seria rápido. Foi — só não do jeito, nem para o lado, que você disse.',
    ],
  },
  divida: {
    rot: ['O COFRE FECHOU POR DENTRO', 'CREDOR NÃO ESPERA MANDATO', 'A CONTA VENCEU ANTES'],
    tit: ['QUEBROU O PAÍS', 'A FATURA CHEGOU', 'FALIU EM EXERCÍCIO'],
    sub: [
      'Não faltou dinheiro no primeiro ano. Faltou alguém disposto a dizer, em voz alta, que ele ia acabar.',
      'O governo caiu na semana em que o funcionalismo abriu o contracheque e viu metade.',
      'Você entregou um país com PIB grande e caixa vazio. É a combinação que derruba mais rápido.',
    ],
  },
  generico: {
    rot: ['O MANDATO FOI INTERROMPIDO', 'ENCERRADO ANTES DO PRAZO', 'O GABINETE DESISTIU'],
    tit: ['O GOVERNO CAIU', 'FIM ANTECIPADO', 'INTERROMPIDO'],
    sub: [
      'Não houve um desastre único. Houve a soma paciente de decisões medianas — é assim que morre a maioria dos governos.',
      'Ninguém aponta o dia exato em que virou. Todo mundo aponta o mês.',
      'Havia um projeto ali. Ele só não sobreviveu ao próprio governo.',
    ],
  },
  alto: {
    rot: ['CENTO E VINTE MESES CUMPRIDOS', 'A DÉCADA INTEIRA NO COMANDO', 'MANDATO ENCERRADO NO PRAZO'],
    tit: ['A DÉCADA FOI SUA', 'DEZ ANOS DE PÉ', 'ENTREGUE POR INTEIRO'],
    sub: [
      'A troca de comando foi na hora marcada, com fotógrafo, chave na mão e o cofre aberto para conferência.',
      'Você sai pela porta da frente, no dia previsto — o que estatisticamente quase ninguém neste jogo faz.',
      'Dez anos depois, o país que você recebeu não é mais o mesmo. E dessa vez isso é elogio.',
    ],
  },
  medio: {
    rot: ['MANDATO CUMPRIDO ATÉ O FIM', 'A DÉCADA FECHOU', 'DEZ ANOS, SEM INTERRUPÇÃO'],
    tit: ['A DÉCADA ACABOU', 'MANDATO CUMPRIDO', 'ATÉ O ÚLTIMO DIA'],
    sub: [
      'Nenhuma estátua foi encomendada. Também nenhuma foi derrubada — e uma coisa vale a outra.',
      'Você entrega um país que decide sozinho o que faz amanhã. É mais do que a maioria deixa.',
      'A História vai citar seu nome nas notas de rodapé, e o rodapé é onde moram os governos que funcionaram.',
    ],
  },
  baixo: {
    rot: ['SOBREVIVEU À DÉCADA', 'DEZ ANOS SEGURANDO AS PONTAS', 'O RELÓGIO CHEGOU AO FIM'],
    tit: ['VOCÊ CHEGOU AO FIM', 'AINDA DE PÉ', 'A DÉCADA PASSOU'],
    sub: [
      'O mundo correu por fora e você segurou as pontas. Ficou o país, ficaram as feridas, ficou a conta do que não foi construído.',
      'Não é o governo que os livros vão discutir. É o governo que os vizinhos vão lembrar de não ter afundado.',
      'Atravessar dez anos sem ser deposto é menos glamouroso do que parece — e mais difícil do que parece.',
    ],
  },
  vitoria: {
    rot: ['O TABULEIRO FECHOU', 'NÃO HÁ MAIS O QUE DISPUTAR', 'A MÁQUINA SE CALOU'],
    tit: ['VOCÊ DOBROU A HISTÓRIA', 'O MUNDO É SEU', 'IMPERADOR DE FATO'],
    sub: [
      'Não terminou a era: definiu a próxima. As outras capitais agora planejam o ano olhando o seu calendário.',
      'Chefes de Estado soberanos passam metade do expediente calculando a sua reação. É assim que se mede isto.',
      'Nenhuma decisão relevante do planeta foi tomada sem alguém antes perguntar o que você acharia.',
    ],
  },
};

// ── ETAPA 2 · O BALANÇO ───────────────────────────────────────────────
export const BALANCO = {
  rot: {
    queda: ['O QUE FICA PARA O PRÓXIMO', 'O INVENTÁRIO DA SAÍDA', 'O QUE O SUCESSOR ENCONTRA'],
    legado: ['O QUE FICOU DE PÉ', 'O PAÍS QUE VOCÊ ENTREGA', 'DEZ ANOS EM NÚMEROS'],
    vitoria: ['O IMPÉRIO EM NÚMEROS', 'O TAMANHO DA COISA', 'O QUE PASSA A EXISTIR'],
  },
  sub: {
    queda: [
      'O próximo não vai perguntar como o país chegou assim. Vai só assinar por cima e culpar você por dois anos.',
      'Nenhum destes números aparece no discurso de posse dele. Todos aparecem na auditoria.',
      'É o que sobrou no cofre e no mapa. A partir de amanhã, é problema de outro.',
    ],
    legado: [
      'É o país que você entrega. Números fechados, sem arredondamento a seu favor.',
      'Dez anos de decisão cabem nesta grade. Nenhuma delas dá para desfazer agora.',
      'Não é o que você prometeu no primeiro dia. É o que ficou — e é isso que conta.',
    ],
    vitoria: [
      'É o que passa a existir depois de você. E vai existir por muito tempo.',
      'Cada linha desta grade custou alguma coisa a alguém. Nenhuma delas foi de graça.',
      'Os livros vão discutir o método. Estes números eles não vão poder discutir.',
    ],
  },
};

// ── ETAPA 3 · O DIAGNÓSTICO ───────────────────────────────────────────
export const DIAGNOSTICO = {
  rot: {
    queda: ['O QUE DERRUBOU VOCÊ', 'A AUTÓPSIA DO GOVERNO', 'ONDE A CONTA NÃO FECHOU'],
    legado: ['O QUE PESOU NA BALANÇA', 'AS DUAS COLUNAS', 'O SALDO DA DÉCADA'],
    vitoria: ['COMO SE CHEGA AQUI', 'A CONTA QUE FECHOU', 'O QUE SUSTENTOU O TOPO'],
  },
};

// ── ETAPA 7 · A IMPRENSA ──────────────────────────────────────────────
export const IMPRENSA = {
  sub: {
    queda: [
      'Os dois jornais que mais falaram de você escreveram hoje. Um com pena, o outro com pressa.',
      'A imprensa que te sustentou e a que te enterrou fecharam a edição na mesma hora.',
      'Amanhã eles estarão elogiando o próximo com as mesmas palavras que usaram em você no começo.',
    ],
    legado: [
      'Dez anos de manchete cabem em duas linhas. Estas são as suas.',
      'Você aparece nas duas primeiras páginas de amanhã. Depois disso, é assunto de arquivo.',
      'Nenhum dos dois vai escrever o que você gostaria. Os dois vão escrever o seu nome.',
    ],
    vitoria: [
      'Os que te odiavam vão ter de escrever o seu nome do mesmo jeito. E soletrado certo.',
      'A crítica não sumiu — ela só passou a ser publicada em página par.',
      'Não existe editorial neutro sobre alguém que fechou o tabuleiro. Só há o lado escolhido.',
    ],
  },
};

// ── O BOTÃO QUE FECHA ─────────────────────────────────────────────────
export const FECHAR = {
  queda: ['RECOMEÇAR EM OUTRA NAÇÃO', 'VIRAR A PÁGINA', 'PEGAR OUTRA BANDEIRA'],
  legado: ['ENCERRAR O MANDATO', 'ENTREGAR A CHAVE', 'FECHAR A DÉCADA'],
  vitoria: ['ENCERRAR O REINADO', 'DESCER DO TRONO', 'FECHAR O TABULEIRO'],
};

// ═══════════════════════════════════════════════════════════════════════
// O OBITUÁRIO SEM IA
// ═══════════════════════════════════════════════════════════════════════
// Três parágrafos montados de três bancos independentes: ABERTURA (o que aconteceu),
// MEIO (o número que explica) e FECHO (o que vem depois). Sorteados com sais
// diferentes, então as combinações se multiplicam — 3 × 3 × 3 por situação já dá 27
// obituários distintos por nuance, sem contar os números que entram no texto.
//
// Ele existe porque a IA pode estar desligada, sem cota ou fora do ar — e a última
// tela da partida NÃO pode ser a que revela isso ao jogador.
const OBITO = {
  queda: {
    abre: [
      (c) => `${c.nome} governou ${c.pais} por ${c.meses} meses e saiu sem discurso de despedida. Causa formal: ${c.causa}.`,
      (c) => `O governo ${c.nome} durou ${c.meses} meses. Terminou numa tarde de quarta, sem cerimônia e sem foto oficial.`,
      (c) => `Registre-se: ${c.meses} meses de mandato, encerrados por ${c.causa}. ${c.pais} amanheceu com outro nome na porta.`,
    ],
    meio: [
      (c) => c.principal
        ? `O detalhe que ninguém no gabinete quis olhar: ${c.principal.k.toLowerCase()} em ${c.principal.v}. ${cap(c.principal.txt)} — enquanto os discursos ficavam cada vez mais longos.`
        : 'Não houve um desastre único. Houve a soma paciente de decisões medianas, que é como a maioria dos governos morre.',
      (c) => c.principal
        ? `Havia um número na pasta que ninguém lia em voz alta: ${c.principal.k.toLowerCase()}, ${c.principal.v}. Ele estava certo o tempo todo.`
        : 'Nenhuma manchete isolada explica. Explica o conjunto — e o conjunto estava à vista de todos.',
      (c) => c.principal
        ? `Se um dia perguntarem onde começou, a resposta cabe em duas palavras e um número: ${c.principal.k.toLowerCase()}, ${c.principal.v}.`
        : 'O erro não foi uma decisão. Foi a média delas, sustentada por tempo demais.',
    ],
    fecha: [
      (c) => `${c.conquistas ? `Ficam ${c.conquistas} território(s) ocupado(s) e uma fatura que outro vai pagar. ` : ''}A Máquina embaralha as cartas. O próximo já está a caminho, prometendo exatamente as mesmas coisas.`,
      (c) => `${c.conquistas ? `Ficam ${c.conquistas} ocupação(ões) sem plano de saída. ` : ''}Em seis meses ninguém lembra o seu nome. Em seis anos, alguém escreve uma tese defendendo você.`,
      () => 'O sucessor tomou posse prometendo transparência. O primeiro ato foi lacrar os arquivos do período anterior.',
    ],
  },
  legado: {
    abre: [
      (c) => `${c.nome} entrega ${c.pais} depois de ${c.meses} meses — a década inteira, sem interrupção. Destino final: ${c.destino}/100.`,
      (c) => `Dez anos exatos. ${c.nome} atravessou ${c.meses} meses de mandato e entregou o cargo na data marcada, o que quase nunca acontece por aqui.`,
      (c) => `Encerra-se o governo ${c.nome}: ${c.meses} meses, nenhuma deposição, um país inteiro passado adiante.`,
    ],
    meio: [
      (c) => c.feito
        ? `O que vai sobrar no arquivo: ${c.feito.k.toLowerCase()} em ${c.feito.v}. Não é pouco — a maior parte dos governos não deixa uma linha assim.`
        : 'Não houve o feito único que os manuais gostam de citar. Houve dez anos sem o desastre que quase todo mundo comete.',
      (c) => c.principal
        ? `Também fica o que não foi resolvido: ${c.principal.k.toLowerCase()} em ${c.principal.v}. O sucessor herda isso junto com a chave.`
        : 'A gestão foi previsível, e previsível é uma palavra que só soa ruim para quem nunca governou.',
      (c) => `Governar é escolher o que vai ficar sem resposta. ${c.nome} escolheu, ao longo de ${c.meses} meses, e a lista está aí em cima.`,
    ],
    fecha: [
      () => 'A transmissão de cargo levou onze minutos. Foi a coisa mais tranquila que este país fez na década.',
      () => 'Ninguém encomendou estátua. Ninguém derrubou nenhuma. É o retrato mais honesto que um mandato pode receber.',
      (c) => `${c.pais} segue existindo, com fronteiras, moeda e governo — e há dez anos isso não era garantido.`,
    ],
  },
  vitoria: {
    abre: [
      (c) => `${c.nome} deixa o poder com o que todo governante jura buscar e quase nenhum alcança: ${c.pais} maior do que encontrou. ${c.meses} meses, destino ${c.destino}/100.`,
      (c) => `Ao fim de ${c.meses} meses, não há mais o que ${c.pais} precise pedir a alguém. É a definição técnica de império, e ela foi cumprida.`,
      (c) => `O governo ${c.nome} termina sem adversário à altura. ${c.destino} de destino, e nenhuma capital do planeta indiferente.`,
    ],
    meio: [
      () => 'Os manuais dirão que foi visão estratégica. Os arquivos dirão que também foi sorte, e que ninguém checou a conta enquanto o gráfico subia.',
      (c) => `${c.conquistas ? `Foram ${c.conquistas} ocupações e um número de acordos que nem o Itamaraty contabilizou direito. ` : ''}Grandeza tem custo, e o custo foi pago por gente que não votou nisso.`,
      () => 'Perguntaram, na última entrevista, se valeu a pena. A resposta durou quarenta minutos e não continha a palavra "não".',
    ],
    fecha: [
      () => 'A História é escrita por quem fica de pé no fim. Desta vez, foi você.',
      (c) => `Daqui a vinte anos, meia dúzia de países ainda vai organizar a política interna em torno de decisões que ${c.nome} tomou numa terça-feira.`,
      () => 'O próximo vai passar o mandato inteiro sendo comparado a você. E vai perder a comparação.',
    ],
  },
};

// Monta o obituário completo. `ctx` traz nome, país, meses, destino, causa, o
// principal culpado, o principal feito e as ocupações — tudo já formatado por quem
// chamou (esta camada não sabe ler `estado`).
export function obituarioLocal(situacao, ctx) {
  const familia = situacao === 'vitoria' ? 'vitoria'
    : ['alto', 'medio', 'baixo'].includes(situacao) ? 'legado' : 'queda';
  const b = OBITO[familia];
  const s = ctx.semente || `${ctx.pais}${ctx.nome}${ctx.meses}`;
  const p = (lista, sal) => {
    const fn = escolher(lista, s, sal);
    try { return typeof fn === 'function' ? fn(ctx) : String(fn); } catch { return ''; }
  };
  return [p(b.abre, 1), p(b.meio, 5), p(b.fecha, 9)].filter(Boolean).join('\n\n');
}

// A família de copy (queda / legado / vitoria) a partir da situação. As etapas 2, 3
// e 7 e o botão de fechar usam esta régua mais grossa — nelas a nuance da queda não
// muda o que dá para dizer, e nove variações de "O QUE FICA PARA O PRÓXIMO" seria
// trabalho sem retorno.
export function familiaDe(situacao) {
  if (situacao === 'vitoria') return 'vitoria';
  return ['alto', 'medio', 'baixo'].includes(situacao) ? 'legado' : 'queda';
}
