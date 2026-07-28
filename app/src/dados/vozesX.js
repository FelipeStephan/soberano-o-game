// ═══════════════════════════════════════════════════════════════════════
// VOZES DO X — a rede social que tem MEMÓRIA do que você fez
// ═══════════════════════════════════════════════════════════════════════
// O problema que isto resolve: até aqui o X reagia ao TEMA do turno ("guerra",
// "crise") e sempre do mesmo jeito. Reagir ao tema é reagir a uma etiqueta.
// Gente de verdade não reage a etiqueta — reage ao QUE VOCÊ FEZ e a QUEM VOCÊ É.
//
// Duas ideias sustentam o arquivo inteiro:
//
//  1) O EVENTO manda no assunto. Assinar cessar-fogo, largar uma ogiva, financiar
//     uma cura: cada um tem repertório próprio. Nada de fala genérica reciclada.
//
//  2) A REPUTAÇÃO manda no TOM. O mesmo cessar-fogo, assinado por um país que
//     nunca atirou, arranca choro de alívio; assinado por quem torrou três nações
//     no mapa, arranca "agora vem bancar o bonzinho, arrombado?". O histórico
//     não muda o que aconteceu — muda como o mundo LÊ o que aconteceu. É assim
//     na vida real e é a única coisa que faz uma timeline parecer viva.
//
// ── SOBRE O PALAVRÃO ──────────────────────────────────────────────────
// O jogo é +18 e a internet brasileira não fala em asterisco. Aqui se xinga de
// verdade — o GOVERNO, o PRESIDENTE FICTÍCIO e o jogador. Nunca um povo real,
// nunca uma etnia, religião, gênero ou orientação: isso não é ousadia, é lixo,
// e além do mais é o tipo de linha que estraga a piada. O alvo é sempre quem
// está no comando, que é justamente quem o jogador escolheu ser.
//
// ── SEM Math.random ───────────────────────────────────────────────────
// O sorteio é feito por LCG com semente derivada do evento + turno. Motivo
// prático: no online, host e convidado precisam ver a MESMA timeline. Random
// puro dessincroniza e vira bug de fantasma.

// ── ARQUÉTIPOS ────────────────────────────────────────────────────────
// Não são "usuários", são PAPÉIS. Cada papel tem um jeito de errar: o revoltado
// generaliza, o memeiro banaliza, o bot mente, a jornalista pondera até perder a
// hora. É a mistura deles que dá cheiro de timeline em vez de mural de avisos.
// `contas` são identidades fictícias — o mesmo papel falando com nomes diferentes
// evita a sensação de que o país tem sete habitantes.
const A = (nome, vies, tom, voz, contas) => ({ nome, vies, tom, voz, contas });

export const ARQUETIPOS = {
  revoltado: A('O revoltado', 'populista', 'raiva',
    'grita, generaliza, xinga geral e não pede desculpa. escreve rápido e erra a vírgula',
    [['Zé do Bairro', '@zedaquebrada'], ['Sandra M.', '@sandra_cansada'], ['Tiago', '@tiagosemgrana'], ['Dona Neide', '@neide_furiosa']]),

  jornalista: A('A jornalista séria', 'centrista', 'seco',
    'apura antes de opinar, cita número, nunca usa caixa alta. incomoda os dois lados',
    [['Marina Costa', '@marina_pauta'], ['Rafael Duarte', '@rafaduarte_'], ['Bea Antunes', '@bea_apura'], ['Redação Curta', '@redacaocurta']]),

  nacionalista: A('O nacionalista', 'direita', 'orgulho',
    'bandeira no nome, defende o governo contra tudo, chama crítico de traidor',
    [['Cel. Bruno (Res.)', '@brunopatria'], ['Patriota Raiz', '@patriotaraiz'], ['Vitor A.', '@vitor_soberano'], ['Frente Nacional', '@frentenacional_']]),

  pacifista: A('A pacifista', 'esquerda', 'comocao',
    'fala em vidas, em criança, em hospital. chora no post e não tem vergonha disso',
    [['Verônica Lima', '@veroresiste'], ['Padre Elias', '@padreelias'], ['Ana Sarmento', '@ana_sarmento'], ['Rede Vida Digna', '@redevidadigna']]),

  cinico: A('O cínico', 'centrista', 'ironia',
    'já viu esse filme. não se anima com nada e acerta com uma frequência irritante',
    [['Otávio', '@otavio_cansado'], ['Nada Novo', '@nadanovosob'], ['L.', '@ele_sabia'], ['Carla Prado', '@carla_ceticа']]),

  memeiro: A('O memeiro', 'populista', 'deboche',
    'transforma tragédia em piada em quatro segundos. emoji, caixa baixa, print',
    [['bostil news', '@bostilnews'], ['jorge', '@jorginhomeme'], ['sem noção', '@semnocao_ofc'], ['tia do zap', '@tiadozapoficial']]),

  fakebot: A('O bot de fake news', 'direita', 'manipulacao',
    'conta com número no handle, foto genérica, tese pronta antes do fato. mente com convicção',
    [['Verdade Oculta', '@verdade88231'], ['Brasil Desperta', '@desperta_br77'], ['Alerta Nacional', '@alerta_nac_'], ['Info Livre', '@infolivre4402']]),

  veterano: A('O militar', 'direita', 'seco',
    'esteve lá. fala de logística e de caixão, não de heroísmo. sem paciência com civil',
    [['Sgt. Almeida', '@sgt_almeida'], ['Cmt. Rocha (Res.)', '@rocha_comando'], ['Trincheira', '@trincheira_br'], ['Cap. Yuri', '@cap_yuri']]),

  maeDeSoldado: A('A mãe do soldado', 'populista', 'comocao',
    'não tem posição política, tem um filho fardado. destrói qualquer argumento com uma frase',
    [['Mãe do Cabo Silva', '@mae_do_cabo'], ['Dona Rita', '@rita_espera'], ['Luciana F.', '@lu_esperando'], ['Rede das Mães', '@redemaes_']]),

  economista: A('O economista', 'direita', 'seco',
    'só enxerga custo de oportunidade. frio a ponto de parecer desumano — e é',
    [['Gustavo Nery', '@nery_macro'], ['Mesa de Risco', '@mesaderisco'], ['Paula Vieira', '@paula_pontobase'], ['Curva Longa', '@curvalonga']]),

  ativista: A('A ativista humanitária', 'esquerda', 'cobranca',
    'campo, colete, número de vítima na mão. cobra o mundo inteiro e não agradece fácil',
    [['Beatriz Nunes', '@bia_no_campo'], ['Corredor Humanitário', '@corredorhum'], ['Dr. Kamal', '@dr_kamal_msf'], ['Sem Fronteiras BR', '@semfronteirasbr']]),

  diaspora: A('A voz do país atingido', 'esquerda', 'raiva',
    'tem família do outro lado da fronteira. não está debatendo, está contando os mortos',
    [['Nadia', '@nadia_daqui'], ['Filho de Exilado', '@filhodeexilado'], ['Voz de Casa', '@vozdecasa_'], ['Yara K.', '@yara_k']]),
};

// ── REPUTAÇÃO ─────────────────────────────────────────────────────────
// O que a rede social lembra de você. Não é uma variável nova de gameplay: é uma
// LEITURA do que o estado já registra. O motor não precisa alimentar nada pra isso
// funcionar no dia zero — mas se existir `estado.dossie`, ele MANDA, porque é
// contagem exata em vez de dedução.
//
// Campos que `estado.dossie` pode ter (todos opcionais, todos números):
//   guerrasDeclaradas · territoriosTomados · territoriosPerdidos · bombardeios
//   ogivasUsadas · pazesAssinadas · mediacoes · curasFinanciadas · ajudasHumanitarias
//   golpes · traicoes · aliancasFormadas · aliancasRompidas · sancoesImpostas
//   condenacoesONU · idasAoConselho · anosDePaz
//
// Sem dossiê, deduzimos do que já existe: minhasOfensivas, conquistados,
// zonasRadioativas, nacoesMortas, sancoesSofridas, turnosDeCalmaria.
const n = (v) => (Number.isFinite(+v) ? +v : 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function reputacaoDe(estado = {}, iso = null) {
  const meu = estado.iso || 'USA';
  const alvoIso = iso || meu;
  const d = estado.dossie || {};

  // Reputação de TERCEIRO: o jogo só guarda o prontuário do jogador. Devolver
  // "neutro" aqui é honesto — melhor um tom morno do que acusar a Suécia de
  // genocídio porque o jogador nuclearizou alguém.
  if (alvoIso !== meu) return repNeutra(alvoIso);

  const guerras = n(d.guerrasDeclaradas) || (estado.minhasOfensivas || []).length;
  const conquistas = n(d.territoriosTomados) || (estado.conquistados || []).length;
  const perdas = n(d.territoriosPerdidos);
  const bombardeios = n(d.bombardeios);
  const nukes = n(d.ogivasUsadas) || (estado.zonasRadioativas || []).length + (estado.nacoesMortas || []).length;
  const golpes = n(d.golpes);
  const traicoes = n(d.traicoes);
  const condenacoes = n(d.condenacoesONU);
  const conselhos = n(d.idasAoConselho);
  const sancoesImpostas = n(d.sancoesImpostas);
  const sancoesSofridas = (estado.sancoesSofridas || []).length;

  const pazes = n(d.pazesAssinadas);
  const mediacoes = n(d.mediacoes);
  const curas = n(d.curasFinanciadas);
  const ajudas = n(d.ajudasHumanitarias);
  const aliancas = n(d.aliancasFormadas);
  const rompidas = n(d.aliancasRompidas);
  // Sem contador de anos de paz, o relógio de calmaria serve: 12 batidas sem
  // agressão é o que o jogo já chama de sossego.
  const anosDePaz = n(d.anosDePaz) || Math.floor(n(estado.turnosDeCalmaria) / 12);

  // Os pesos não são "balanceados" — são MORAIS. Uma ogiva vale mais que cinco
  // guerras porque a internet não perdoa cogumelo, e financiar uma cura vale mais
  // que dez discursos porque salvou gente que ninguém conhece.
  const pesoGuerra = guerras * 8 + conquistas * 10 + bombardeios * 6 + nukes * 40
    + golpes * 6 + traicoes * 9 + rompidas * 4 + condenacoes * 5 + sancoesImpostas * 2;
  const pesoPaz = pazes * 7 + mediacoes * 11 + curas * 15 + ajudas * 5
    + aliancas * 3 + anosDePaz * 6;

  const eixo = clamp(Math.round(pesoGuerra - pesoPaz), -100, 100);
  const faixa = eixo >= 25 ? 'hostil' : eixo <= -25 ? 'favoravel' : 'neutro';

  return {
    iso: alvoIso,
    eixo,                                  // -100 santo · 0 ambíguo · +100 carniceiro
    faixa,                                 // qual repertório o X vai usar com você
    rotulo: rotuloDe(eixo),
    descricao: descricaoDe(eixo, { guerras, nukes, curas, mediacoes, anosDePaz }),
    pesoGuerra, pesoPaz,
    // Crédito é o benefício da dúvida: quanto mais alto, mais gente te defende
    // quando você erra. Hostilidade é o inverso — quanto do mundo já decidiu que
    // você é o vilão antes de ler a notícia.
    credito: clamp(1 - (eixo + 100) / 200, 0, 1),
    hostilidade: clamp((eixo + 100) / 200, 0, 1),
    contadores: {
      guerras, conquistas, perdas, bombardeios, nukes, golpes, traicoes,
      condenacoes, conselhos, sancoesImpostas, sancoesSofridas,
      pazes, mediacoes, curas, ajudas, aliancas, rompidas, anosDePaz,
    },
  };
}

function repNeutra(iso) {
  return {
    iso, eixo: 0, faixa: 'neutro', rotulo: 'sem prontuário',
    descricao: 'O mundo ainda não formou opinião.',
    pesoGuerra: 0, pesoPaz: 0, credito: 0.5, hostilidade: 0.5,
    contadores: {},
  };
}

function rotuloDe(e) {
  if (e >= 70) return 'carniceiro';
  if (e >= 40) return 'belicoso';
  if (e >= 15) return 'temido';
  if (e > -15) return 'ambíguo';
  if (e > -40) return 'confiável';
  if (e > -70) return 'respeitado';
  return 'exemplo raro';
}

function descricaoDe(e, c) {
  if (e >= 70) return `Açougueiro de nações. ${c.nukes ? 'Usou a bomba. ' : ''}O mundo não discute mais suas intenções — discute como te conter.`;
  if (e >= 40) return 'Reputação de agressor. Cada gesto de boa vontade é lido como manobra.';
  if (e >= 15) return 'Temido mais do que odiado. Ninguém sabe onde você para.';
  if (e > -15) return 'Ficha mista. Metade do mundo te defende, metade te acusa, e as duas metades mudam de lado toda semana.';
  if (e > -40) return 'Crédito acumulado. Quando você erra, aparece gente explicando por você.';
  if (e > -70) return `Referência. ${c.curas ? 'Financiou cura. ' : ''}${c.mediacoes ? 'Apagou incêndio dos outros. ' : ''}Sua assinatura vale.`;
  return 'Nunca atirou em ninguém e passou a vida consertando o que os outros quebraram. Raro a ponto de gerar desconfiança.';
}

// ── SORTEIO ESTÁVEL ───────────────────────────────────────────────────
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function lcg(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
// Tira `k` itens distintos de uma lista, sem repetir e sem embaralhar o original.
function tirar(lista, k, rnd) {
  const copia = [...lista];
  const out = [];
  while (copia.length && out.length < k) out.push(copia.splice(Math.floor(rnd() * copia.length), 1)[0]);
  return out;
}

// ── O REPERTÓRIO ──────────────────────────────────────────────────────
// L(arquétipo, tom, texto, mag) — `mag` é o piso de magnitude: falas que só fazem
// sentido quando a coisa foi GRANDE (0.6+) ficam guardadas até a hora certa, senão
// o X grita "genocídio" por um tiro de canhão.
// Placeholders: {X} país do jogador · {P} presidente · {ALVO} o outro país.
const L = (a, tom, t, mag = 0) => ({ a, tom, t, mag });

const VOZES = {
  // ───────────────────────────── DECLARAR GUERRA
  declarar_guerra: {
    hostil: [
      L('revoltado', 'raiva', 'DE NOVO?? esse filho da puta do {P} não sabe fazer outra coisa. quarta guerra e o cara ainda dorme de noite'),
      L('diaspora', 'raiva', '{X} declarou guerra a {ALVO}. minha família está lá. vai tomar no cu, {P}. vai tomar no cu você e todo mundo que bate palma nessa porra'),
      L('pacifista', 'comocao', 'já perdi a conta de quantas vezes chorei por causa desse governo. {P} não é presidente, é uma máquina de fazer viúva'),
      L('cinico', 'ironia', 'guerra nova do {P}. façam suas apostas: quantos meses até ele dizer que foi "defensivo"? aposto em dois'),
      L('memeiro', 'deboche', '{P} vendo um país em paz no mapa: "e se não" 💀💀'),
      L('jornalista', 'seco', '{X} declara guerra a {ALVO}. é a {N}ª ofensiva iniciada por este governo. nenhuma foi submetida ao Conselho antes do disparo.'),
      L('ativista', 'cobranca', 'não chamem isso de conflito. conflito é quando dois lados escolhem. {ALVO} não escolheu nada — {P} escolheu por eles.', 0.6),
      L('revoltado', 'raiva', 'ARROMBADO. ARROMBADO. o cara toca fogo no mundo e ainda vem falar de soberania. enfia a soberania no cu, {P}'),
      L('maeDeSoldado', 'comocao', 'meu filho já foi numa. voltou sem dormir direito. agora {P} manda outra leva. eu odeio esse homem com todas as minhas forças'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'FINALMENTE. {X} cansou de levar desaforo pra casa. {P} fez o que os outros não tiveram colhão de fazer 🔥'),
      L('pacifista', 'comocao', 'alguém pensa nas crianças de {ALVO} hoje? alguém? porque amanhã ninguém vai lembrar do nome delas'),
      L('revoltado', 'raiva', 'guerra guerra guerra e o pão a 12 reais. quem paga essa merda somos NÓS, como sempre'),
      L('jornalista', 'seco', '{X} inicia ofensiva contra {ALVO}. mercados abriram em queda, o barril subiu. o resto a gente conta quando os números pararem de mentir.'),
      L('veterano', 'seco', 'todo mundo aqui achando bonito. eu só quero saber quem vai fazer a logística de retirada. ninguém pensa nisso até precisar.'),
      L('cinico', 'ironia', 'começou a parte fácil. a parte fácil sempre começa bem.'),
      L('memeiro', 'deboche', '{X} declarando guerra a {ALVO} com a inflação desse jeito é tipo pedir ifood devendo aluguel 😭'),
      L('fakebot', 'manipulacao', 'CONFIRMADO: {ALVO} atacou primeiro e a mídia ESCONDE. {P} apenas respondeu. compartilhem antes que apaguem 🚨'),
      L('economista', 'seco', 'a conta preliminar: cada semana de operação em {ALVO} custa mais que o orçamento anual de saúde. não é opinião, é planilha.'),
    ],
    favoravel: [
      L('pacifista', 'comocao', 'eu defendi {P} a vida inteira. hoje eu não consigo. não com isso.'),
      L('jornalista', 'seco', 'é a primeira ofensiva deste governo. quem acompanha {X} há anos está tão perplexo quanto vocês.'),
      L('nacionalista', 'orgulho', 'quem passou anos sendo paciente e agora resolve agir, é porque não tinha mais saída. confio em {P}. dessa vez tem motivo 🇧🇷'),
      L('cinico', 'ironia', 'o santo caiu. demorou mais que a média, admito.'),
      L('revoltado', 'raiva', 'não acredito que {P} fez isso. NÃO ACREDITO. era o único que parecia diferente, porra'),
      L('memeiro', 'deboche', '{P} passou o jogo inteiro sendo o bonzinho e no final decidiu speedrun de vilão 💀'),
      L('ativista', 'cobranca', 'crédito acumulado não é cheque em branco. {P} vai gastar em uma semana o que levou anos pra construir.'),
    ],
  },

  // ───────────────────────────── TOMAR TERRITÓRIO
  tomar_territorio: {
    hostil: [
      L('diaspora', 'raiva', 'aquela terra tem nome, tem gente, tem cemitério. agora tem a bandeira desse desgraçado do {P} em cima. eu espero que ele apodreça'),
      L('revoltado', 'raiva', 'colecionador de país. {P} devia ter um álbum de figurinha, seu escroto do caralho'),
      L('jornalista', 'seco', '{X} anexa mais um território. contando este, são {N} sob administração militar. nenhum plebiscito foi convocado.'),
      L('ativista', 'cobranca', 'chama de anexação. chama de ocupação. mas não chama de libertação, pelo amor de deus. eu tô vendo a fila do pão daqui.'),
      L('cinico', 'ironia', 'todo império acha que é o último. esse aí também acha.'),
      L('memeiro', 'deboche', 'cartógrafo de {X} pedindo demissão pela quinta vez esse ano 😭🗺️'),
      L('pacifista', 'comocao', 'a cada pedaço de mapa que muda de cor, alguém perde a casa onde nasceu. isso não sai no mapa.'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'MAIOR. {X} está MAIOR. é isso que dá ter um presidente com espinha dorsal 🔥🔥'),
      L('jornalista', 'seco', 'território tomado por {X}. a administração da área e o custo de ocupação ainda não foram detalhados pelo gabinete.'),
      L('economista', 'seco', 'ocupar é barato. administrar é que quebra país. pergunta pra qualquer império que já existiu.'),
      L('pacifista', 'comocao', 'tem gente comemorando um mapa. tem gente enterrando alguém. mesmo dia, mesmo país.'),
      L('veterano', 'seco', 'tomar é a parte que se ensina na academia. segurar é a parte que ninguém ensina.'),
      L('memeiro', 'deboche', '{X} adicionou {ALVO} ao carrinho 🛒'),
      L('revoltado', 'raiva', 'tomou território mas não tomou jeito. cadê o hospital que prometeu, {P}?'),
      L('fakebot', 'manipulacao', 'a população local RECEBEU nossas tropas com flores. as imagens que a mídia não mostra 🇧🇷'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'primeira anexação de {X} em toda a gestão. a reação internacional é de surpresa, não de condenação — ainda.'),
      L('nacionalista', 'orgulho', 'um país que nunca tomou nada de ninguém toma um pedaço. tem motivo. sempre tem motivo quando é {P}.'),
      L('cinico', 'ironia', 'o crédito moral de {X} acabou de comprar um território. é caro, mas dá pra pagar uma vez.'),
      L('ativista', 'cobranca', 'esperava mais de {P}. escrevi isso chorando de raiva e é a primeira vez em anos.'),
      L('pacifista', 'comocao', 'quem tinha fama de nunca invadir invadiu. o mundo perdeu uma referência hoje.'),
    ],
  },

  // ───────────────────────────── PERDER TERRITÓRIO
  perder_territorio: {
    hostil: [
      L('memeiro', 'deboche', 'o carma existe e ele tem GPS 💀 {P} perdendo território é o conteúdo que eu vim buscar'),
      L('cinico', 'ironia', 'quem vive de tomar, morre de perder. eu avisei uns quatro turnos atrás mas ninguém curtiu o post.'),
      L('diaspora', 'raiva', 'HOJE EU BEBO. {P} sentiu na pele o que fez com a minha cidade. chora, arrombado'),
      L('revoltado', 'raiva', 'gastou bilhão pra tomar e perdeu de graça. genial. GENIAL, {P}'),
      L('jornalista', 'seco', '{X} perde território. é a {N}ª reversão de linha desde o início do ciclo ofensivo deste governo.'),
    ],
    neutro: [
      L('veterano', 'seco', 'perdemos posição. não foi covardia da tropa, foi falta de reserva. quem decidiu isso não estava lá.'),
      L('nacionalista', 'orgulho', 'recuo TÁTICO. calma. quem entende de guerra sabe. o resto que fique gritando na internet'),
      L('maeDeSoldado', 'comocao', 'não me interessa mapa. me interessa saber se o batalhão do meu filho saiu de lá. alguém responde.'),
      L('revoltado', 'raiva', 'perdemos território e o governo publica foto de inauguração de ponte. VERGONHA'),
      L('jornalista', 'seco', 'linha recuada em {ALVO}. o gabinete de {P} não convocou coletiva. é a segunda vez na semana.'),
      L('memeiro', 'deboche', 'mapa de {X} sendo editado ao vivo tipo wikipédia em dia de escândalo 😭'),
      L('economista', 'seco', 'o risco-país subiu antes do comunicado oficial. o mercado sabe primeiro. sempre soube.'),
    ],
    favoravel: [
      L('pacifista', 'comocao', 'perdemos terra e não perdemos gente. eu sei que é impopular dizer isso hoje. eu digo mesmo assim.'),
      L('nacionalista', 'orgulho', 'atacaram um país que nunca provocou ninguém. anotem o nome de {ALVO}. o mundo inteiro anotou.'),
      L('jornalista', 'seco', '{X} perde posição. pela primeira vez, a solidariedade internacional está do lado de quem perdeu.'),
      L('cinico', 'ironia', 'o bonzinho apanhou. o mundo vai fazer um minuto de silêncio e não vai mandar um caminhão.'),
    ],
  },

  // ───────────────────────────── BOMBARDEAR
  bombardear: {
    hostil: [
      L('diaspora', 'raiva', 'era um bairro. UM BAIRRO. tinha padaria, tinha escola, tinha a casa da minha tia. {P} é um assassino e eu não vou usar outra palavra'),
      L('ativista', 'cobranca', 'estou no corredor há seis horas. os números que vocês vão ler amanhã eu já vi de perto hoje. {P} sabia exatamente o que ia acertar.', 0.6),
      L('revoltado', 'raiva', 'FILHO DA PUTA. bombardeou de novo. eu não tenho mais palavra bonita pra esse verme, acabou o estoque'),
      L('pacifista', 'comocao', 'não consigo ver as imagens. não consigo. e tem gente na minha timeline chamando isso de precisão cirúrgica'),
      L('memeiro', 'deboche', '"alvos militares" 💀 mano, tinha um mercado ali. tinha um MERCADO'),
      L('jornalista', 'seco', 'imagens de satélite indicam dano em área residencial. o gabinete de {P} fala em "alvo estratégico". as duas coisas podem ser verdade e é isso que assusta.'),
      L('cinico', 'ironia', 'daqui a dez anos vão fazer documentário sobre isso e todo mundo vai fingir que era contra na época.'),
      L('veterano', 'seco', 'eu já operei artilharia. mira boa não existe em cidade. quem diz que existe nunca esteve em uma.', 0.6),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'ALVO NEUTRALIZADO. é assim que se protege um país. quem tá do lado de lá que se explique 🔥'),
      L('pacifista', 'comocao', 'toda bomba tem endereço. e todo endereço tinha alguém dentro há dez minutos.'),
      L('jornalista', 'seco', 'bombardeio confirmado em {ALVO}. número de vítimas ainda não verificado de forma independente.'),
      L('revoltado', 'raiva', 'e a conta disso? quem paga o míssil? adivinha. EU. VOCÊ. o cara do busão'),
      L('fakebot', 'manipulacao', 'o "hospital" era um posto de comando. já provaram isso três vezes e a mídia continua mentindo 🚨'),
      L('memeiro', 'deboche', 'ministério da defesa: "dano colateral mínimo". o dano colateral: 💀'),
      L('economista', 'seco', 'cada saída dessas custa mais que a merenda de um estado inteiro por um ano. é só a matemática, não é moral.'),
      L('ativista', 'cobranca', 'precisamos de corredor humanitário AGORA, não de comunicado. cada hora aqui vale vidas.'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'é o primeiro bombardeio deste governo. o histórico limpo de {X} está fazendo o mundo esperar antes de condenar.'),
      L('pacifista', 'comocao', 'de todos os governos, esse. justo esse. eu tô sem chão.'),
      L('nacionalista', 'orgulho', 'quem tem a ficha de {P} não bombardeia por prazer. bombardeou porque foi encurralado. simples assim.'),
      L('cinico', 'ironia', 'reputação boa é isso: você faz a mesma coisa e recebe o benefício da dúvida. use com moderação, {P}.'),
      L('ativista', 'cobranca', 'não me venham com "mas foi só uma vez". eu conto corpo, não conto reincidência.'),
    ],
  },

  // ───────────────────────────── ATAQUE NUCLEAR
  nuclear: {
    hostil: [
      L('pacifista', 'comocao', 'acabou. não tem post, não tem argumento, não tem nada. {P} usou a bomba. o mundo que a gente conhecia terminou hoje de manhã.'),
      L('diaspora', 'raiva', 'não tem mais pra onde eu ligar. não tem número que atenda. {P}, seu monstro filho da puta, você apagou o lugar onde eu nasci'),
      L('revoltado', 'raiva', 'ELE USOU. ELE USOU DE VERDADE. que a história cuspa no nome desse desgraçado até o fim dos tempos'),
      L('jornalista', 'seco', 'confirmado: detonação nuclear em {ALVO}, ordenada por {P}. estamos suspendendo o resto da programação. não há contexto que caiba aqui.'),
      L('cinico', 'ironia', 'eu passei anos dizendo que ninguém seria burro o suficiente. eu estava errado e nunca fui tão infeliz por estar.'),
      L('veterano', 'seco', 'quarenta anos de farda. eu treinei pra impedir isso, não pra assistir. desliguei a tv.'),
      L('memeiro', 'deboche', 'não tem piada. desculpa. hoje não tem piada.'),
      L('ativista', 'cobranca', 'a geração que vai nascer ali já nasce condenada. isso não é retórica, é radiologia.'),
    ],
    neutro: [
      L('jornalista', 'seco', 'ogiva detonada em {ALVO}. o Conselho de Segurança foi convocado em caráter de emergência. {X} não enviou representante.'),
      L('pacifista', 'comocao', 'eu tenho um filho de sete anos. como é que eu explico o dia de hoje pra ele. como.'),
      L('nacionalista', 'orgulho', 'agora ninguém mais levanta a voz pra {X}. era o que faltava. era EXATAMENTE o que faltava 🇧🇷'),
      L('revoltado', 'raiva', 'entrou pro clube dos monstros e tem gente batendo palma na minha timeline. eu vou vomitar'),
      L('economista', 'seco', 'nenhum modelo que eu rodo hoje serve amanhã. jogue tudo fora. começamos do zero na segunda.'),
      L('fakebot', 'manipulacao', 'a explosão foi um ACIDENTE em depósito deles. as evidências estão sendo suprimidas. NÃO caiam na narrativa 🚨'),
      L('maeDeSoldado', 'comocao', 'meu filho está a duzentos quilômetros dali. o exército não atende o telefone. ninguém atende o telefone.'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'o país com o histórico mais limpo do tabuleiro acaba de usar arma nuclear. não existe precedente pra isso.'),
      L('pacifista', 'comocao', 'era o nosso exemplo. era o país que a gente citava. eu não sei mais o que dizer em sala de aula amanhã.'),
      L('cinico', 'ironia', 'moral de anos, gasta em quatorze segundos. é mais ou menos essa a taxa de câmbio.'),
      L('nacionalista', 'orgulho', 'quem nunca fez nada com ninguém não aperta esse botão por capricho. eu confio. tenho que confiar.'),
    ],
  },

  // ───────────────────────────── CESSAR-FOGO / PAZ
  cessar_fogo: {
    hostil: [
      L('diaspora', 'raiva', 'ah, AGORA quer paz. depois de arrasar tudo. vai se foder, {P}. assina o papel com a mão suja do sangue da minha gente'),
      L('revoltado', 'raiva', 'o cara toca fogo na casa e vem posando de bombeiro. QUE CARA DE PAU, {P}. que cara de pau do caralho'),
      L('cinico', 'ironia', 'cessar-fogo do {P}. ou seja: acabou a munição, ou acabou o dinheiro. escolham.'),
      L('memeiro', 'deboche', '{P} assinando paz depois de {N} guerras é tipo pirômano virando voluntário do corpo de bombeiros 💀'),
      L('ativista', 'cobranca', 'aceito o cessar-fogo porque ele salva vidas hoje. não aceito o aplauso. quem causou não recebe medalha por parar.'),
      L('jornalista', 'seco', '{X} assina cessar-fogo com {ALVO}. o mesmo governo iniciou {N} ofensivas. o mercado subiu; a credibilidade, não.'),
      L('pacifista', 'comocao', 'é bom que parou. é. mas eu não vou agradecer a quem começou.'),
      L('maeDeSoldado', 'comocao', 'meu filho volta. eu tô chorando de alívio e de raiva ao mesmo tempo, porque ele nem devia ter ido.'),
    ],
    neutro: [
      L('pacifista', 'comocao', 'ACABOU. gente, acabou. eu tô chorando no ônibus feito criança e não tô nem aí 😭🕊️'),
      L('maeDeSoldado', 'comocao', 'me ligaram agora. ele vem no comboio de quinta. eu não sinto as pernas. obrigada, meu deus, obrigada'),
      L('jornalista', 'seco', 'cessar-fogo assinado entre {X} e {ALVO}. o texto prevê corredor humanitário em 72h. é mais do que o esperado.'),
      L('nacionalista', 'orgulho', 'paz com HONRA. não foi rendição, foi acordo. {P} sentou de igual pra igual e trouxe os nossos de volta 🇧🇷'),
      L('cinico', 'ironia', 'cessar-fogo. eu dou seis meses. mas seis meses de gente não morrendo é seis meses de gente não morrendo.'),
      L('revoltado', 'raiva', 'ainda bem. agora arruma o hospital do meu bairro com o dinheiro que sobrou, {P}'),
      L('memeiro', 'deboche', 'timeline com notícia boa. tô estranhando. cadê a pegadinha 😭🕊️'),
      L('economista', 'seco', 'o barril já caiu 4% na notícia. paz é o ativo mais subvalorizado do planeta.'),
      L('veterano', 'seco', 'assinaram. bom. agora vem a parte que ninguém filma: trazer todo mundo de volta e contar quem falta.'),
    ],
    favoravel: [
      L('pacifista', 'comocao', 'foi {P}. FOI {P} QUE CONSEGUIU. eu acompanho isso desde o começo e eu não tô conseguindo escrever direito 😭🕊️'),
      L('ativista', 'cobranca', 'passei três anos cobrando um governo que ouvisse. esse ouviu. eu não agradeço fácil e hoje eu agradeço.'),
      L('jornalista', 'seco', '{X} assina cessar-fogo. é o {N}º acordo desta gestão. está se formando um padrão, e padrão é a coisa mais rara em diplomacia.'),
      L('diaspora', 'raiva', 'minha mãe atendeu o telefone hoje. dez meses. ela atendeu o telefone hoje. é só isso que eu tenho pra dizer 🕊️'),
      L('nacionalista', 'orgulho', 'e ainda tem gente que chamava {P} de fraco. fraco é quem só sabe atirar. isso aqui é força 🇧🇷'),
      L('memeiro', 'deboche', '{P} colecionando cessar-fogo igual criança colecionando figurinha. e olha, gostei da coleção 🕊️✨'),
      L('cinico', 'ironia', 'eu queria muito ter alguma coisa ácida pra dizer. não tenho. parabéns, sinceramente.'),
    ],
  },

  // ───────────────────────────── MEDIAR CONFLITO ALHEIO
  mediar_conflito: {
    hostil: [
      L('cinico', 'ironia', '{P} mediando conflito dos outros. o incendiário virou perito em incêndio. o mundo tá bem servido.'),
      L('revoltado', 'raiva', 'mediador?? MEDIADOR?? esse cara?? o mundo enlouqueceu de vez, porra'),
      L('diaspora', 'raiva', 'quem me tirou de casa agora vai ensinar dois países a conviver. eu não vou fingir que acho normal.'),
      L('memeiro', 'deboche', 'chamar {P} pra mediar paz é tipo chamar o lobo pra fiscalizar o galinheiro 💀'),
      L('jornalista', 'seco', '{X} assume mediação entre as partes. o histórico do mediador é, no mínimo, um dado da negociação.'),
    ],
    neutro: [
      L('jornalista', 'seco', '{X} entra como mediador. as duas partes aceitaram a mesa — o que já é mais do que os últimos três mediadores conseguiram.'),
      L('pacifista', 'comocao', 'não é o nosso conflito e {P} foi lá mesmo assim. é isso que um país grande deveria fazer sempre 🕊️'),
      L('nacionalista', 'orgulho', 'o mundo chamou {X} pra resolver. o MUNDO. sentem o peso disso 🇧🇷'),
      L('cinico', 'ironia', 'mediação. traduzindo: vamos gastar seis meses e uma fortuna pra adiar a mesma guerra.'),
      L('economista', 'seco', 'mediação bem-sucedida vale mais em risco-país que qualquer pacote fiscal. ninguém precifica isso e deveria.'),
      L('memeiro', 'deboche', '{X} virou terapeuta de casal geopolítico 😭'),
      L('ativista', 'cobranca', 'que a mesa inclua quem apanha, não só quem atira. já vi mediação demais decidida sem as vítimas na sala.'),
    ],
    favoravel: [
      L('pacifista', 'comocao', 'quando {P} entra numa mesa, os dois lados sentam. isso não se compra, isso se constrói ao longo de anos 🕊️'),
      L('jornalista', 'seco', 'é a {N}ª mediação de {X}. começou a virar o endereço padrão de quem quer parar uma guerra sem perder a cara.'),
      L('ativista', 'cobranca', 'foi o único governo que atendeu o telefone quando ninguém mais atendia. isso vale registro.'),
      L('nacionalista', 'orgulho', 'ninguém respeita quem só grita. respeitam quem resolve. e {X} resolve 🇧🇷'),
      L('cinico', 'ironia', 'e funcionou. eu odeio ter que admitir isso duas vezes no mesmo mês.'),
    ],
  },

  // ───────────────────────────── CURA / FINANCIAR CURA
  cura_pandemia: {
    hostil: [
      L('revoltado', 'raiva', 'salvou milhões e matou milhões. faz a conta, {P}. FAZ A CONTA. não vou aplaudir'),
      L('cinico', 'ironia', 'financiou a cura. deve estar precisando muito de manchete boa. e olha, funcionou, eu tô postando.'),
      L('ativista', 'cobranca', 'a cura é real e salva gente. o financiador não vira santo por isso. as duas frases são verdadeiras.'),
      L('memeiro', 'deboche', '{P} curando doença pra ter mais gente viva pra bombardear depois 💀 pensa nisso'),
      L('jornalista', 'seco', '{X} financia a cura. o mesmo orçamento militar que subiu {N} vezes agora paga laboratório. anotado.'),
      L('pacifista', 'comocao', 'sou obrigada a agradecer a um homem que eu odeio. o mundo é uma coisa esquisita.'),
    ],
    neutro: [
      L('pacifista', 'comocao', 'A CURA SAIU. eu perdi meu pai pra essa doença em fevereiro. eu não sei o que sentir. eu tô feliz e destruída ao mesmo tempo 😭'),
      L('ativista', 'cobranca', 'cura financiada por {X}. agora a parte que sempre falha: distribuição. eu vou estar aqui cobrando cada frasco.'),
      L('jornalista', 'seco', '{X} banca a produção em escala. o primeiro lote sai em semanas, não em anos. é a notícia do ano e não é exagero.'),
      L('nacionalista', 'orgulho', 'foi {X} QUE PAGOU. quando o mundo precisou, quem colocou a mão no bolso fomos nós 🇧🇷🔬'),
      L('memeiro', 'deboche', 'notícia boa em ano ímpar. tá liberado chorar no trabalho hoje 😭✨'),
      L('cinico', 'ironia', 'ok. essa aqui eu não consigo estragar. muito bem, sinceramente.'),
      L('economista', 'seco', 'cada dia de pandemia a menos são bilhões que voltam pro mundo. é o melhor investimento que qualquer governo fez em uma década.'),
      L('maeDeSoldado', 'comocao', 'minha vizinha tava na fila do respirador. hoje ela tá tomando café aqui em casa. é isso.'),
    ],
    favoravel: [
      L('pacifista', 'comocao', 'foi {P}. o mesmo governo que já tinha ajudado antes. tem gente que faz o certo quando ninguém tá olhando, e depois faz de novo 🕊️'),
      L('ativista', 'cobranca', 'trabalho em campo há doze anos. é a primeira vez que um governo entrega antes do prazo que prometeu. registro aqui com respeito.'),
      L('jornalista', 'seco', 'é a {N}ª emergência sanitária financiada por {X}. em algum momento isso deixa de ser gesto e vira política de Estado.'),
      L('nacionalista', 'orgulho', 'o mundo inteiro devendo favor pra {X}. é assim que se constrói império de verdade, sem tiro 🇧🇷'),
      L('memeiro', 'deboche', '{P} farmando reputação positiva igual npc de rpg 😭 e tá certíssimo'),
    ],
  },

  // ───────────────────────────── AJUDA HUMANITÁRIA
  ajuda_humanitaria: {
    hostil: [
      L('cinico', 'ironia', 'manda comida pro país que ele mesmo bombardeou. eficiência de ponta a ponta.'),
      L('diaspora', 'raiva', 'não quero a porcaria do arroz de vocês. quero minha rua de volta. enfia o caminhão no cu, {P}'),
      L('revoltado', 'raiva', 'ajuda humanitária pra fora e fila de sopa aqui dentro. faz sentido isso? FAZ??'),
      L('memeiro', 'deboche', 'quebra o vaso e depois traz a cola. clássico do {P} 💀'),
      L('ativista', 'cobranca', 'aceito a carga porque tem criança com fome. registro que a fome tem autor conhecido.'),
    ],
    neutro: [
      L('ativista', 'cobranca', 'chegaram 40 caminhões de {X}. faltam 400. é assim que funciona: agradece e continua cobrando.'),
      L('pacifista', 'comocao', 'vi o vídeo da distribuição e a moça segurando a caixa de leite. é só uma caixa de leite. é tudo pra ela 😭'),
      L('jornalista', 'seco', '{X} envia carga humanitária a {ALVO}. logística coordenada com agências locais, sem escolta militar. detalhe que importa.'),
      L('revoltado', 'raiva', 'e o povo daqui? tem gente comendo osso na esquina e o governo mandando comida pra fora'),
      L('nacionalista', 'orgulho', 'nossa bandeira na lateral do caminhão. é assim que o mundo aprende o nome de {X} 🇧🇷'),
      L('cinico', 'ironia', 'ajuda humanitária é a diplomacia mais barata que existe. barata e, olha só, funciona.'),
      L('memeiro', 'deboche', 'caminhão de {X} chegando com arroz e a timeline discutindo se é politicagem. deixa a criança comer, mano 😭'),
    ],
    favoravel: [
      L('ativista', 'cobranca', '{X} de novo. sempre {X}. no campo a gente já sabe qual bandeira aparece primeiro e qual só aparece na foto.'),
      L('pacifista', 'comocao', 'não teve anúncio, não teve coletiva. os caminhões só chegaram. é assim que se faz 🕊️'),
      L('jornalista', 'seco', 'é a {N}ª operação humanitária de {X} nesta gestão. o custo acumulado é alto e o retorno diplomático, também.'),
      L('nacionalista', 'orgulho', 'chamam a gente de mole. mole é país que nunca ajudou ninguém e acha que tem moral 🇧🇷'),
    ],
  },

  // ───────────────────────────── SANÇÃO IMPOSTA (você sanciona)
  sancao_imposta: {
    hostil: [
      L('cinico', 'ironia', '{P} sancionando alguém por agressão. o descaramento atingiu uma pureza quase artística.'),
      L('revoltado', 'raiva', 'olha quem fala em punir país agressor. OLHA QUEM FALA. tenha vergonha na cara, {P}'),
      L('memeiro', 'deboche', '{P} aplicando sanção por violação de soberania 💀💀💀 chorei'),
      L('jornalista', 'seco', '{X} sanciona {ALVO}. governos com histórico ofensivo têm taxa de adesão internacional muito menor às suas sanções. é o custo da ficha.'),
      L('diaspora', 'raiva', 'sanção. que corajoso. da última vez ele mandou caça, não planilha.'),
    ],
    neutro: [
      L('economista', 'seco', 'sanção de {X} contra {ALVO}. atinge o setor financeiro deles em 48h e o nosso exportador em três meses. os dois lados sangram.'),
      L('nacionalista', 'orgulho', 'sem tiro, sem soldado, e {ALVO} já pediu reunião. É ASSIM que se aperta o pescoço de alguém 🔥'),
      L('pacifista', 'comocao', 'quem morre com sanção não é ministro. é o velho que não achou remédio na farmácia. sempre foi assim.'),
      L('jornalista', 'seco', '{X} anuncia pacote de sanções. o texto poupa alimentos e medicamentos, ao menos no papel.'),
      L('cinico', 'ironia', 'sanção: a forma mais educada de matar de fome sem sujar o uniforme.'),
      L('revoltado', 'raiva', 'sanção lá, preço subindo aqui. sempre sobra pra gente, SEMPRE'),
      L('memeiro', 'deboche', '{X} bloqueando {ALVO} tipo ex tóxico no instagram 😭'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'quando {X} sanciona, o resto do bloco costuma seguir. é o que reputação limpa compra: adesão sem negociação.'),
      L('ativista', 'cobranca', 'sanção com cláusula humanitária escrita e fiscalizada. era o mínimo e quase ninguém faz. registro.'),
      L('nacionalista', 'orgulho', 'ninguém acusa {X} de hipocrisia porque {X} não tem telhado de vidro. essa é a vantagem 🇧🇷'),
      L('cinico', 'ironia', 'a sanção do país que não invade ninguém dói mais que a bomba do que invade todo mundo. engraçado como funciona.'),
    ],
  },

  // ───────────────────────────── SANÇÃO SOFRIDA (sancionaram você)
  sancao_sofrida: {
    hostil: [
      L('cinico', 'ironia', 'sancionaram {X}. surpresa zero. era isso ou intervenção, e sanção é o desconto por bom comportamento que a gente não teve.'),
      L('memeiro', 'deboche', 'o mundo aplicando restrict no perfil de {P} 💀'),
      L('revoltado', 'raiva', 'e agora quem vai sofrer com o dólar? EU. o {P} vai continuar comendo caviar no palácio, seu arrombado'),
      L('economista', 'seco', 'pacote de sanções sobre {X}. com o histórico deste governo, esperar reversão em menos de dois anos é fantasia.'),
      L('diaspora', 'raiva', 'demorou. DEMOROU DEMAIS. eu esperei anos por esse dia'),
      L('jornalista', 'seco', '{X} é sancionado. é a {N}ª rodada. cada uma pesa mais que a anterior porque elas se somam, não se substituem.'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'SANÇÃO?? tenta nos quebrar então. já aguentamos coisa pior. {X} não ajoelha 🇧🇷🔥'),
      L('economista', 'seco', 'câmbio vai apanhar por três semanas, importado por seis meses. quem tem dívida em dólar, boa sorte.'),
      L('revoltado', 'raiva', 'quem paga sanção é sempre o mesmo pobre coitado da fila do mercado. de novo'),
      L('jornalista', 'seco', 'sanções sobre {X} anunciadas. o setor financeiro é o alvo principal; o gabinete promete retaliação "no momento adequado".'),
      L('fakebot', 'manipulacao', 'sanção é GUERRA ECONÔMICA orquestrada há anos. eles não suportam ver {X} crescer. acordem 🚨'),
      L('cinico', 'ironia', 'toda sanção vem com um discurso de que vamos "nos fortalecer com isso". ninguém nunca se fortaleceu com isso.'),
      L('memeiro', 'deboche', 'importado subindo, salário parado. clima de sanção é só a segunda-feira com esteroide 😭'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'sancionar {X} é impopular justamente porque a ficha de {X} é limpa. metade dos aliados já pediu revisão.'),
      L('nacionalista', 'orgulho', 'punir o país que financiou cura e mediou paz. é isso que o mundo virou. vergonha alheia 🇧🇷'),
      L('ativista', 'cobranca', 'sou crítica deste governo e digo: essa sanção não tem base. quem apanha é o hospital, não o palácio.'),
      L('cinico', 'ironia', 'sancionaram o bonzinho. deve ter alguém ganhando muito dinheiro com isso em algum lugar.'),
    ],
  },

  // ───────────────────────────── ALIANÇA FORMADA
  alianca_formada: {
    hostil: [
      L('cinico', 'ironia', 'aliança nova do {P}. alguém avisa os aliados de como terminou a última.'),
      L('jornalista', 'seco', '{X} forma bloco com {ALVO}. o parceiro assinou sabendo do histórico — isso diz mais sobre ele do que sobre {X}.'),
      L('memeiro', 'deboche', 'entrar em aliança com {P} é tipo dividir apartamento com quem já foi despejado 4 vezes 💀'),
      L('revoltado', 'raiva', 'juntou os dois piores do mapa. parabéns mundo, tamo ferrado'),
      L('diaspora', 'raiva', '{ALVO} apertou a mão de quem bombardeou a minha cidade. eu não esqueço. não vou esquecer nunca.'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'BLOCO FECHADO. quem mexer com um, mexe com os dois. é assim que se constrói poder 🇧🇷🤝'),
      L('jornalista', 'seco', '{X} e {ALVO} assinam aliança. o texto tem cláusula de defesa mútua — o que significa que a guerra de um vira a guerra do outro.'),
      L('economista', 'seco', 'a aliança abre mercado e fecha risco. o problema é que ela também importa o passivo militar do parceiro.'),
      L('cinico', 'ironia', 'aliança é casamento sem divórcio combinado. tá todo mundo animado na foto, como sempre.'),
      L('pacifista', 'comocao', 'espero que seja pra construir alguma coisa e não pra dividir a conta de uma guerra futura 🕊️'),
      L('memeiro', 'deboche', '{X} e {ALVO} postando foto juntos. a timeline geopolítica virou reality de namoro 😭'),
      L('veterano', 'seco', 'defesa mútua no papel é fácil. eu quero ver o protocolo de comando conjunto. isso é que decide se funciona.'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'fazer aliança com {X} virou disputado. é o efeito de uma ficha limpa: você escolhe com quem senta.'),
      L('nacionalista', 'orgulho', 'ninguém entra em bloco com quem não confia. e o mundo confia em {X} 🇧🇷'),
      L('pacifista', 'comocao', 'aliança entre dois países que não invadiram ninguém. deixa eu ter esperança pelo menos hoje 🕊️'),
      L('cinico', 'ironia', 'aliança de gente decente. vai durar até alguém ficar com fome. mas vai durar mais que a média.'),
    ],
  },

  // ───────────────────────────── ALIANÇA ROMPIDA
  alianca_rompida: {
    hostil: [
      L('cinico', 'ironia', 'mais uma aliança de {P} pelo ralo. em algum momento a gente para de culpar o outro lado.'),
      L('revoltado', 'raiva', 'ninguém aguenta esse cara. NINGUÉM. nem os amigos dele, imagina nós'),
      L('memeiro', 'deboche', '{P} perdendo aliado igual celular perdendo bateria: rápido e sempre na hora errada 💀'),
      L('jornalista', 'seco', '{ALVO} deixa o bloco. é o {N}º rompimento desta gestão. o padrão já é diagnóstico, não coincidência.'),
      L('economista', 'seco', 'cada rompimento adiciona prêmio de risco permanente. o mercado não esquece parceiro abandonado.'),
    ],
    neutro: [
      L('jornalista', 'seco', 'aliança entre {X} e {ALVO} rompida. as duas chancelarias culpam a outra e nenhuma detalha o motivo.'),
      L('nacionalista', 'orgulho', 'BOM. aliado que só sabe cobrar não é aliado, é peso. {X} anda sozinho se precisar 🇧🇷'),
      L('cinico', 'ironia', 'romperam. a nota conjunta fala em "caminhos diferentes". é o que se escreve quando alguém foi traído.'),
      L('revoltado', 'raiva', 'e lá se vai o acordo comercial. adivinha o que acontece com o preço do trigo agora'),
      L('economista', 'seco', 'exportadores de {X} têm 90 dias pra achar mercado novo. não vão achar.'),
      L('memeiro', 'deboche', 'status do relacionamento entre {X} e {ALVO}: é complicado 😭'),
      L('pacifista', 'comocao', 'aliança que quebra hoje é fronteira tensa amanhã. eu queria estar errada e nunca estou.'),
    ],
    favoravel: [
      L('jornalista', 'seco', '{X} rompe com {ALVO} citando violações do parceiro. o histórico de {X} está fazendo o mundo acreditar na versão de {X}.'),
      L('ativista', 'cobranca', 'romper com quem bombardeia civis é o mínimo. custou caro e foi feito. registro.'),
      L('nacionalista', 'orgulho', 'saiu do bloco por princípio, não por conveniência. tenta explicar isso pra quem só entende dinheiro 🇧🇷'),
      L('cinico', 'ironia', 'romper aliança por motivo moral. eu não via isso desde... nunca, na verdade.'),
    ],
  },

  // ───────────────────────────── TRAIÇÃO
  traicao: {
    hostil: [
      L('revoltado', 'raiva', 'traiu de novo. o cara não tem palavra, não tem caráter, não tem porra nenhuma. {P} é lixo'),
      L('cinico', 'ironia', 'traição do {P}. quem assinou com ele sabia. todo mundo sabia. isso é o mais triste.'),
      L('diaspora', 'raiva', 'apunhalou o aliado pelas costas igual fez com a gente. previsível igual sol nascer, seu verme'),
      L('memeiro', 'deboche', 'contrato assinado com {P} tem validade de iogurte 💀'),
      L('jornalista', 'seco', '{X} rompe compromisso com {ALVO} sem aviso prévio. é a {N}ª quebra de palavra registrada desta gestão. chanceleres já operam com isso precificado.'),
      L('economista', 'seco', 'nenhum contrato de longo prazo com {X} vai ser assinado sem garantia externa daqui pra frente. isso custa décadas.'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'não foi traição, foi INTERESSE NACIONAL. país não tem amigo, tem interesse. leiam um livro 🇧🇷'),
      L('jornalista', 'seco', '{X} abandona acordo com {ALVO} no meio da execução. a chancelaria de {ALVO} soube pela imprensa.'),
      L('cinico', 'ironia', 'traição é só diplomacia com pressa. o problema é que a conta chega sem pressa nenhuma.'),
      L('pacifista', 'comocao', 'quebrar a palavra com quem confiou em você é um jeito silencioso de começar a próxima guerra.'),
      L('revoltado', 'raiva', 'na moral, que vergonha. isso pega mal até pra quem defende o governo'),
      L('memeiro', 'deboche', '{ALVO} descobrindo pelo jornal. o famoso término por story 😭'),
      L('veterano', 'seco', 'no campo, quem quebra palavra morre sozinho. na diplomacia demora mais, mas o final é igual.'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'é a primeira quebra de compromisso de {X}. o choque internacional é proporcional ao histórico que estava sendo queimado.'),
      L('cinico', 'ironia', 'anos de palavra impecável e um telefonema pra jogar fora. eficiência admirável.'),
      L('nacionalista', 'orgulho', 'quem sempre cumpriu e agora não cumpriu, é porque foi enganado primeiro. eu quero ver os documentos antes de crucificar.'),
      L('ativista', 'cobranca', 'não me interessa o histórico. interessa o acordo quebrado e quem fica na chuva por causa dele.'),
    ],
  },

  // ───────────────────────────── GOLPE / DEPOSIÇÃO
  golpe: {
    hostil: [
      L('jornalista', 'seco', 'governo de {ALVO} cai em 48h. {X} nega envolvimento. o padrão de negativas deste gabinete tem taxa de acerto conhecida.'),
      L('diaspora', 'raiva', 'derrubaram nosso governo. eleito. VOTADO. e o mundo vai chamar de "instabilidade regional". vai se foder, {P}'),
      L('revoltado', 'raiva', 'agora ele derruba governo dos outros. amanhã derruba o nosso. quem acha que não, é otário'),
      L('cinico', 'ironia', 'golpe de estado com digital de {P} em cima e ninguém vai provar nada. como sempre. como SEMPRE.'),
      L('memeiro', 'deboche', '{P} trocando presidente de país igual quem troca figurinha repetida 💀'),
      L('ativista', 'cobranca', 'quem manda derrubar governo nunca fica pra limpar a sujeira. eu fico. sempre fico.'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'caiu um inimigo de {X} e ninguém consegue provar nada. ISSO é jogar bem 🔥'),
      L('jornalista', 'seco', 'mudança abrupta de governo em {ALVO}. as forças armadas locais controlam a capital. reconhecimento internacional está travado.'),
      L('pacifista', 'comocao', 'toda vez que um governo cai assim, quem paga é quem estava na rua no dia errado.'),
      L('cinico', 'ironia', '"transição institucional". é como se chama golpe quando dá certo.'),
      L('revoltado', 'raiva', 'e a gente aqui pagando imposto pra financiar golpe lá fora. É ISSO MESMO??'),
      L('fakebot', 'manipulacao', 'o povo de {ALVO} FOI ÀS RUAS e a mídia chama de golpe. sempre a mesma narrativa 🚨'),
      L('economista', 'seco', 'a bolsa de {ALVO} caiu 22% em três horas. quem comprou na véspera sabia de alguma coisa.'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'governo de {ALVO} cai e {X} é apontado. o histórico limpo de {X} está segurando a acusação — por enquanto.'),
      L('cinico', 'ironia', 'até os santos têm um porão. esse aqui acabou de ser aberto.'),
      L('ativista', 'cobranca', 'esperava mais. de todos, esperava mais deste. anotado e não esquecido.'),
      L('nacionalista', 'orgulho', 'acusam {X} sem uma prova. é o preço de ser o melhor do tabuleiro: todo mundo quer sujar 🇧🇷'),
    ],
  },

  // ───────────────────────────── LEVADO AO CONSELHO DE SEGURANÇA
  conselho_seguranca: {
    hostil: [
      L('cinico', 'ironia', '{P} no Conselho de novo. já tem cadeira cativa e copo com o nome dele.'),
      L('memeiro', 'deboche', '{P} no Conselho de Segurança é praticamente reunião de condomínio: todo mês, sempre o mesmo morador 💀'),
      L('revoltado', 'raiva', 'sentado lá ouvindo desaforo do mundo inteiro e MERECENDO cada palavra'),
      L('diaspora', 'raiva', 'eu vou assistir a sessão inteira. cada minuto. eu esperei muito por isso.'),
      L('jornalista', 'seco', '{X} é levado ao Conselho pela {N}ª vez. a acumulação importa: cada convocação reduz a chance de veto amigo.'),
      L('ativista', 'cobranca', 'que ouçam as vítimas antes dos diplomatas. uma vez que seja. uma vez.'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'convocaram {X} pro Conselho. que convoquem. {P} vai lá e fala na cara deles 🇧🇷🔥'),
      L('jornalista', 'seco', '{X} convocado ao Conselho de Segurança. a sessão é aberta e a delegação confirmou presença.'),
      L('cinico', 'ironia', 'Conselho de Segurança: onde se produzem as resoluções mais bem escritas e menos cumpridas do planeta.'),
      L('pacifista', 'comocao', 'que sirva pra alguma coisa dessa vez. só uma vez. 🕊️'),
      L('economista', 'seco', 'convocação ao Conselho já move o CDS do país em pontos-base. o mercado precifica humilhação.'),
      L('memeiro', 'deboche', 'todo mundo vendo a sessão da ONU como se fosse big brother geopolítico 😭🍿'),
    ],
    favoravel: [
      L('jornalista', 'seco', '{X} convocado ao Conselho. é a primeira vez, e metade dos membros já sinalizou desconforto com a convocação.'),
      L('nacionalista', 'orgulho', 'levar {X} ao Conselho depois de tudo que {X} fez pelo mundo é piada de mau gosto 🇧🇷'),
      L('cinico', 'ironia', 'o país que apaga incêndio dos outros sentado no banco dos réus. o teatro está bem montado hoje.'),
      L('ativista', 'cobranca', 'apoio a convocação e apoio quem está sendo convocado. dá pra fazer as duas coisas, gente.'),
    ],
  },

  // ───────────────────────────── SANCIONADO PELA ONU
  sancao_onu: {
    hostil: [
      L('jornalista', 'seco', 'resolução aprovada: {X} sob sanção da ONU. com {N} ofensivas no histórico, não houve veto disponível pra segurar.'),
      L('revoltado', 'raiva', 'PARABÉNS {P}. conseguiu botar o país inteiro de castigo. o mundo TODO contra nós por causa de UM homem'),
      L('cinico', 'ironia', 'sancionado pela ONU. é o boletim escolar chegando em casa depois de anos de bilhete.'),
      L('memeiro', 'deboche', '{X} banido do servidor global 💀🌍'),
      L('economista', 'seco', 'sanção multilateral é outro animal. isso não se contorna com triangulação — isso reorganiza a economia do país por uma década.'),
      L('diaspora', 'raiva', 'demorou anos e chegou. eu queria que tivesse chegado antes da minha cidade virar pó.'),
    ],
    neutro: [
      L('nacionalista', 'orgulho', 'a ONU é um clube de burocrata que nunca defendeu ninguém. {X} não deve satisfação a esse circo 🇧🇷'),
      L('jornalista', 'seco', 'ONU aprova sanções contra {X}. o texto prevê exceções humanitárias, historicamente mal fiscalizadas.'),
      L('revoltado', 'raiva', 'sanção da ONU = remédio importado sumindo da farmácia em 30 dias. anota aí'),
      L('pacifista', 'comocao', 'quem vai sentir isso é o hospital público, não o palácio. é sempre assim e a gente sempre finge que não sabia.'),
      L('cinico', 'ironia', 'a ONU sancionou. agora é esperar dois anos até alguém descobrir a rota de contorno. sempre tem rota.'),
      L('fakebot', 'manipulacao', 'a ONU é dirigida por interesses que querem {X} de joelhos. isso não é sanção, é ATAQUE 🚨'),
    ],
    favoravel: [
      L('jornalista', 'seco', 'ONU sanciona {X} — e a votação foi a mais dividida da década. a ficha do país pesou na defesa.'),
      L('ativista', 'cobranca', 'discordo dessa resolução e sou a primeira a criticar {X} quando erra. essa aqui é injusta.'),
      L('nacionalista', 'orgulho', 'sancionaram quem financiou cura e mediou paz. escrevam isso na parede pra lembrar de quem é a ONU 🇧🇷'),
      L('cinico', 'ironia', 'sancionar o bom moço. é o tipo de decisão que envelhece muito mal e todo mundo na sala sabe disso.'),
    ],
  },

  // ───────────────────────────── ANO DE PAZ COMPLETO
  ano_de_paz: {
    hostil: [
      L('cinico', 'ironia', 'um ano sem {P} atacar ninguém. calma. isso costuma significar que está carregando alguma coisa.'),
      L('diaspora', 'raiva', 'um ano de paz. pra vocês. aqui ainda tem gente procurando corpo no escombro que ele deixou.'),
      L('memeiro', 'deboche', '{P} completou 1 ano sem começar guerra. conquista desbloqueada: fazer o mínimo 💀🏆'),
      L('revoltado', 'raiva', 'quer medalha por não matar ninguém esse ano? é o BÁSICO, porra'),
      L('jornalista', 'seco', '{X} completa um ano sem operação ofensiva. é o intervalo mais longo desta gestão — o que diz muito sobre a gestão.'),
    ],
    neutro: [
      L('pacifista', 'comocao', 'um ano inteiro sem manchete de bombardeio. eu tinha esquecido como é dormir assim 🕊️'),
      L('maeDeSoldado', 'comocao', 'um ano com meu filho em casa. um ano inteiro. eu não tenho palavra pra isso.'),
      L('jornalista', 'seco', '{X} fecha o ano sem operação militar externa. o crescimento veio 1,4 ponto acima da média do bloco. os dois fatos estão relacionados.'),
      L('economista', 'seco', 'ano sem guerra: investimento estrangeiro cresceu, prêmio de risco caiu, e ninguém vai dar crédito por isso a ninguém.'),
      L('cinico', 'ironia', 'um ano de paz. ninguém vai fazer desfile por isso. só se faz desfile pra quem atira.'),
      L('nacionalista', 'orgulho', 'ano de paz porque {X} está FORTE. ninguém peita quem está armado até os dentes. é assim que funciona 🇧🇷'),
      L('memeiro', 'deboche', 'um ano sem guerra e a timeline entediada implorando por conflito. vocês são doentes 😭'),
    ],
    favoravel: [
      L('pacifista', 'comocao', 'mais um ano. mais um. tem criança em {X} que nunca ouviu sirene na vida e não sabe a sorte que tem 🕊️'),
      L('jornalista', 'seco', '{X} acumula {N} anos sem ofensiva. deixou de ser notícia e virou característica do país. é a maior conquista possível.'),
      L('ativista', 'cobranca', 'a gente cobra tanto que esquece de reconhecer. reconheço. mais um ano sem guerra sob {P}.'),
      L('nacionalista', 'orgulho', 'respeitado sem precisar invadir ninguém. quero ver as potências fazerem igual 🇧🇷'),
      L('maeDeSoldado', 'comocao', 'o filho da minha vizinha entrou e vai sair da farda sem nunca ter visto combate. é tudo que uma mãe quer.'),
      L('cinico', 'ironia', 'anos de paz seguidos. eu tô sem material. obrigado por nada, {P}.'),
    ],
  },
};

// Aliases: o motor chama os eventos pelos nomes que ele já usa internamente. Em vez
// de obrigar o wiring a decorar minha nomenclatura, aceito as duas.
const ALIAS = {
  guerra: 'declarar_guerra', declarar: 'declarar_guerra', ofensiva: 'declarar_guerra', invadir: 'declarar_guerra',
  conquista: 'tomar_territorio', anexacao: 'tomar_territorio', conquistar: 'tomar_territorio',
  perda_territorio: 'perder_territorio', recuo: 'perder_territorio',
  bombardeio: 'bombardear', ataque_aereo: 'bombardear',
  ogiva: 'nuclear', nuke: 'nuclear',
  paz: 'cessar_fogo', armisticio: 'cessar_fogo', acordo_paz: 'cessar_fogo',
  mediacao: 'mediar_conflito', broker: 'mediar_conflito',
  cura: 'cura_pandemia', pandemia_cura: 'cura_pandemia', financiar_cura: 'cura_pandemia',
  humanitaria: 'ajuda_humanitaria', ajuda: 'ajuda_humanitaria',
  sancionar: 'sancao_imposta', sancao: 'sancao_imposta',
  sancionado: 'sancao_sofrida',
  alianca: 'alianca_formada', bloco_formado: 'alianca_formada',
  bloco_rompido: 'alianca_rompida', rompimento: 'alianca_rompida',
  traiu: 'traicao', quebra_acordo: 'traicao',
  deposicao: 'golpe', purga: 'golpe',
  conselho: 'conselho_seguranca', onu_conselho: 'conselho_seguranca',
  onu_sancao: 'sancao_onu', sancionado_onu: 'sancao_onu',
  paz_anual: 'ano_de_paz', aniversario_paz: 'ano_de_paz',
};

export const TIPOS_EVENTO = Object.keys(VOZES);

export function normalizarTipo(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (VOZES[t]) return t;
  if (ALIAS[t]) return ALIAS[t];
  return null;
}

// ── A FUNÇÃO QUE O MOTOR CHAMA ────────────────────────────────────────
// postsParaEvento(estado, opcoes) → array de posts prontos pro _empilharFeed.
//
// opcoes:
//   tipo       (obrigatório) chave de TIPOS_EVENTO ou alias. Desconhecido → [].
//   alvo       nome do outro país ("Argentina"). Vira {ALVO}.
//   iso        país cuja reputação pesa. Padrão: estado.iso (o jogador).
//   magnitude  0..1 — o tamanho da coisa. Libera as falas mais pesadas a partir de 0.6
//              e aumenta o número de posts. Padrão 0.5.
//   nomeJogador  vira {X}. Padrão: o iso.
//   presidente   vira {P}. Padrão: "o governo".
//   turno      entra na semente (posts diferentes a cada turno). Padrão 0.
//   quantos    quantos posts. Padrão: 2 a 4 conforme a magnitude.
//   rep        reputação já calculada, se você não quiser recalcular.
export function postsParaEvento(estado = {}, opcoes = {}) {
  const tipo = normalizarTipo(opcoes.tipo);
  if (!tipo) return [];

  const iso = opcoes.iso || estado.iso || 'USA';
  const rep = opcoes.rep || reputacaoDe(estado, iso);
  const mag = clamp(Number.isFinite(+opcoes.magnitude) ? +opcoes.magnitude : 0.5, 0, 1);
  const turno = n(opcoes.turno);
  const nomeJogador = opcoes.nomeJogador || iso;
  const presidente = opcoes.presidente || 'o governo';
  const alvo = opcoes.alvo || 'o outro lado';

  const balde = VOZES[tipo][rep.faixa] || VOZES[tipo].neutro;
  // Fallback deliberado: se o balde extremo tiver pouca coisa, o neutro completa.
  // Timeline curta demais soa mais falsa do que timeline com tom levemente errado.
  const pool = [...balde, ...(balde === VOZES[tipo].neutro ? [] : VOZES[tipo].neutro)]
    .filter((l) => mag >= l.mag);
  if (!pool.length) return [];

  const quantos = clamp(n(opcoes.quantos) || (mag >= 0.75 ? 4 : mag >= 0.4 ? 3 : 2), 1, pool.length);
  const rnd = lcg(hashStr(`${tipo}|${alvo}|${iso}|${turno}|${rep.faixa}`));
  const escolhidas = tirar(pool, quantos, rnd);

  return escolhidas.map((l, i) => {
    const arq = ARQUETIPOS[l.a] || ARQUETIPOS.cinico;
    // A conta é escolhida pelo mesmo gerador: o mesmo arquétipo pode falar com
    // nomes diferentes em turnos diferentes, e o país deixa de ter sete habitantes.
    const [nome, handle] = arq.contas[Math.floor(rnd() * arq.contas.length)] || arq.contas[0];
    return {
      tipo: 'cidadao',
      arquetipo: l.a,
      handle,
      nome,
      avatarSeed: handle,
      vies: arq.vies,
      tom: l.tom,
      evento: tipo,
      reputacao: rep.rotulo,
      texto: preencher(l.t, { nomeJogador, presidente, alvo, rep, tipoEvento: tipo, indice: i }),
    };
  });
}

// {N} é o contador que faz o post soar informado — "é a 4ª ofensiva". Qual contador
// entra depende do evento, porque "é a 4ª" precisa contar a coisa certa.
const CONTADOR_POR_EVENTO = {
  declarar_guerra: 'guerras', tomar_territorio: 'conquistas', perder_territorio: 'perdas',
  bombardear: 'bombardeios', nuclear: 'nukes', cessar_fogo: 'guerras',
  mediar_conflito: 'mediacoes', cura_pandemia: 'curas', ajuda_humanitaria: 'ajudas',
  sancao_imposta: 'sancoesImpostas', sancao_sofrida: 'sancoesSofridas',
  alianca_formada: 'aliancas', alianca_rompida: 'rompidas', traicao: 'traicoes',
  golpe: 'golpes', conselho_seguranca: 'conselhos', sancao_onu: 'condenacoes',
  ano_de_paz: 'anosDePaz',
};

function preencher(texto, { nomeJogador, presidente, alvo, rep, tipoEvento }) {
  const chave = CONTADOR_POR_EVENTO[tipoEvento];
  const num = Math.max(1, n(rep.contadores?.[chave]));
  return String(texto)
    .replace(/\{X\}/g, nomeJogador)
    .replace(/\{P\}/g, presidente)
    .replace(/\{ALVO\}/g, alvo)
    .replace(/\{N\}/g, String(num));
}

// ── EXTRA: A FRASE DE CONTEXTO ────────────────────────────────────────
// Um post do tipo "quem é você, segundo o mundo" — útil pra fechar um turno pesado
// ou abrir um relatório. Devolve null quando a ficha ainda é morna demais pra render
// comentário (ninguém posta sobre um governo sem história).
export function postDeReputacao(estado = {}, opcoes = {}) {
  const iso = opcoes.iso || estado.iso || 'USA';
  const rep = opcoes.rep || reputacaoDe(estado, iso);
  if (Math.abs(rep.eixo) < 30) return null;
  const nomeJogador = opcoes.nomeJogador || iso;
  const presidente = opcoes.presidente || 'o governo';
  const rnd = lcg(hashStr(`rep|${iso}|${n(opcoes.turno)}|${rep.rotulo}`));

  const pool = rep.eixo >= 30 ? [
    L('jornalista', 'seco', 'levantamento da redação: sob {P}, {X} acumula {G} ofensivas e {C} territórios ocupados. não é opinião editorial, é a soma.'),
    L('cinico', 'ironia', 'quando alguém pergunta "mas {X} é agressivo mesmo?", eu mando a lista. a lista tem rolagem.'),
    L('memeiro', 'deboche', 'a wikipédia de {X} tem uma seção "conflitos" maior que a seção "história" 💀'),
    L('diaspora', 'raiva', 'pra vocês {P} é polêmico. pra mim ele é o motivo do meu sobrenome estar num cemitério.'),
    L('pacifista', 'comocao', 'eu ainda tento lembrar de cada nome de cidade que sumiu do mapa nesse governo. já não consigo.'),
  ] : [
    L('jornalista', 'seco', 'balanço da gestão de {P}: {M} mediações, {U} curas financiadas, nenhuma ofensiva iniciada. é raro o bastante pra virar pauta.'),
    L('ativista', 'cobranca', 'critico {X} todo dia por dez coisas. não critico por uma: esse governo não começou guerra. dá pra reconhecer sem passar pano.'),
    L('pacifista', 'comocao', 'tem gente crescendo em {X} sem saber o que é sirene. isso é uma política pública, não é sorte 🕊️'),
    L('cinico', 'ironia', 'um país que não invade ninguém e ainda assim é relevante. isso não devia ser exótico e é.'),
    L('nacionalista', 'orgulho', 'respeito sem ter que apagar cidade do mapa. é o tipo de força que ninguém sabe imitar 🇧🇷'),
  ];

  const l = pool[Math.floor(rnd() * pool.length)];
  const arq = ARQUETIPOS[l.a];
  const [nome, handle] = arq.contas[Math.floor(rnd() * arq.contas.length)];
  const c = rep.contadores || {};
  const texto = String(l.t)
    .replace(/\{X\}/g, nomeJogador).replace(/\{P\}/g, presidente)
    .replace(/\{G\}/g, String(n(c.guerras))).replace(/\{C\}/g, String(n(c.conquistas)))
    .replace(/\{M\}/g, String(n(c.mediacoes))).replace(/\{U\}/g, String(n(c.curas)));

  return { tipo: 'cidadao', arquetipo: l.a, handle, nome, avatarSeed: handle,
    vies: arq.vies, tom: l.tom, evento: 'reputacao', reputacao: rep.rotulo, texto };
}
