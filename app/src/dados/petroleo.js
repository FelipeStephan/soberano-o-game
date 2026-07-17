// ═══════════════════════════════════════════════════════════════════════
// PETRÓLEO — O SANGUE DO MUNDO
// ═══════════════════════════════════════════════════════════════════════
// Por que isso existe: sem petróleo, conquistar um país é um número que sobe.
// Com petróleo, conquistar a Venezuela é 303 bilhões de barris entrando no seu
// balanço — e o mundo inteiro percebendo o que você acabou de fazer.
//
// O MODELO:
//   reservas  → bilhões de barris provados (o prêmio de uma conquista)
//   producao  → milhões de barris/dia (o que entra de caixa TODO turno)
//   consumo   → milhões de barris/dia (o que você QUEIMA todo turno)
//   saldo     = producao − consumo → exportador (dinheiro) ou importante (sangria)
//
// A SACADA DE DESIGN: os EUA produzem 13,2 Mb/d e consomem ~20. Você começa
// DEPENDENTE. Todo turno o petróleo sai do seu caixa. Isso não é bug — é o motor
// que transforma "por que eu invadiria a Venezuela?" em "eu PRECISO da Venezuela".
//
// Fontes dos números: EIA/OPEC/BP Statistical Review (ordens de grandeza de 2024).
// FATOR_JOGO amplifica o impacto no caixa — ver comentário em receitaPetroleo().

// ── ESTREITOS: o petróleo do mundo passa por seis buracos de agulha ──
// Quem controla o estreito, controla quem depende dele. Bloquear = arma econômica.
export const ESTREITOS = {
  hormuz: {
    nome: 'Estreito de Ormuz', fluxo: 21, controle: ['IRN', 'OMN', 'ARE'],
    desc: 'Um quinto do petróleo do planeta passa por 33 km de água entre o Irã e Omã. O Irã sabe disso.',
    depende: ['SAU', 'IRQ', 'ARE', 'KWT', 'QAT', 'IRN'],
  },
  malaca: {
    nome: 'Estreito de Malaca', fluxo: 16, controle: ['MYS', 'IDN', 'SGP'],
    desc: 'A jugular da China. Quase todo o petróleo que ela importa passa aqui — e ela não controla nada.',
    depende: ['CHN', 'JPN', 'KOR'],
  },
  suez: {
    nome: 'Canal de Suez / SUMED', fluxo: 9, controle: ['EGY'],
    desc: 'O atalho entre o Golfo e a Europa. Fechou seis dias em 2021 e o mundo entrou em pânico.',
    depende: ['DEU', 'FRA', 'ITA', 'GBR'],
  },
  bab_el_mandeb: {
    nome: 'Bab el-Mandeb', fluxo: 8, controle: ['YEM', 'DJI', 'ERI'],
    desc: 'A porta do Mar Vermelho. Estreita, rasa, e cercada de gente com míssil.',
    depende: ['EGY', 'SAU'],
  },
  bosforo: {
    nome: 'Estreito de Bósforo', fluxo: 3, controle: ['TUR'],
    desc: 'O petróleo russo e do Cáspio saindo pro Mediterrâneo. A Turquia cobra pedágio político.',
    depende: ['RUS', 'KAZ', 'AZE'],
  },
  panama: {
    nome: 'Canal do Panamá', fluxo: 1, controle: ['PAN'],
    desc: 'Menos petróleo, mas encurta 13 mil km. A seca já o estrangulou uma vez.',
    depende: ['USA', 'CHL', 'PER'],
  },
};

// ── OPEP / OPEP+ : o cartel que decide o preço na porrada ──
export const OPEP = ['SAU', 'IRN', 'IRQ', 'ARE', 'KWT', 'VEN', 'NGA', 'LBY', 'DZA', 'COG', 'GNQ', 'GAB'];
export const OPEP_MAIS = ['RUS', 'KAZ', 'MEX', 'OMN', 'AZE', 'BHR', 'BRN', 'MYS', 'SDN', 'SSD'];

// ── AS FICHAS DE PETRÓLEO ──────────────────────────────────────────────
// reservas: bi de barris provados · producao/consumo: Mb/d · custo: US$/barril pra extrair
// O `custo` é o que separa a Arábia (US$ 3/barril, imprime dinheiro) do Canadá
// (US$ 40/barril de areia betuminosa, só vale a pena se o preço estiver alto).
export const PETROLEO = {
  VEN: { reservas: 303, producao: 0.8,  consumo: 0.5,  custo: 22, tipo: 'Pesado extra',  campo: 'Faixa do Orinoco',
         nota: 'A maior reserva do planeta, apodrecendo. Infraestrutura em ruínas — quem investir, herda um império.' },
  SAU: { reservas: 267, producao: 9.7,  consumo: 3.8,  custo: 3,  tipo: 'Leve doce',      campo: 'Ghawar',
         nota: 'Ghawar é o maior campo já encontrado. Custo de extração de US$ 3/barril: eles lucram a qualquer preço.' },
  IRN: { reservas: 209, producao: 3.4,  consumo: 1.9,  custo: 9,  tipo: 'Médio azedo',    campo: 'Ahvaz',
         nota: 'Sancionado até a medula e ainda assim bombeando. Vende à China com desconto e em segredo.' },
  CAN: { reservas: 170, producao: 5.0,  consumo: 2.3,  custo: 40, tipo: 'Areia betuminosa', campo: 'Athabasca',
         nota: 'Areia encharcada de alcatrão. Caríssimo de extrair, ambientalmente tóxico, e 100% seu vizinho.' },
  IRQ: { reservas: 145, producao: 4.3,  consumo: 0.9,  custo: 6,  tipo: 'Leve doce',      campo: 'Rumaila',
         nota: 'Barato, abundante e sentado sobre uma falha sectária que nunca fechou.' },
  RUS: { reservas: 80,  producao: 9.5,  consumo: 3.7,  custo: 20, tipo: 'Urals',          campo: 'Samotlor',
         nota: 'A alavanca da Rússia sobre a Europa. Cortar o gás no inverno é política externa.' },
  KWT: { reservas: 102, producao: 2.5,  consumo: 0.5,  custo: 5,  tipo: 'Médio',          campo: 'Burgan',
         nota: 'Burgan é o segundo maior campo do mundo. Já foi motivo de uma invasão — pode ser de novo.' },
  ARE: { reservas: 111, producao: 3.2,  consumo: 1.0,  custo: 4,  tipo: 'Leve doce',      campo: 'Zakum',
         nota: 'Transformou petróleo em arranha-céu e fundo soberano. Diversificou antes de acabar.' },
  USA: { reservas: 47,  producao: 13.2, consumo: 20.0, custo: 35, tipo: 'Xisto (shale)',  campo: 'Bacia do Permiano',
         nota: 'Maior produtor do mundo E maior consumidor. O xisto te deu independência que o apetite tira de volta.' },
  LBY: { reservas: 48,  producao: 1.2,  consumo: 0.3,  custo: 8,  tipo: 'Leve doce',      campo: 'Sarir',
         nota: 'Petróleo excelente, Estado inexistente. Milícias controlam os terminais.' },
  NGA: { reservas: 37,  producao: 1.4,  consumo: 0.5,  custo: 15, tipo: 'Bonny Light',    campo: 'Delta do Níger',
         nota: 'O Delta é roubado por dentro. Perde centenas de milhares de barris/dia pra pirataria.' },
  KAZ: { reservas: 30,  producao: 1.9,  consumo: 0.3,  custo: 18, tipo: 'Médio',          campo: 'Tengiz',
         nota: 'Encravado. Todo barril precisa atravessar a Rússia ou a China pra chegar ao mar.' },
  CHN: { reservas: 26,  producao: 4.2,  consumo: 16.0, custo: 30, tipo: 'Médio',          campo: 'Daqing',
         nota: 'Consome quatro vezes o que produz. Toda a estratégia chinesa cabe nessa frase.' },
  QAT: { reservas: 25,  producao: 1.3,  consumo: 0.3,  custo: 6,  tipo: 'Condensado',     campo: 'North Field',
         nota: 'O gás é o verdadeiro tesouro: North Field é o maior campo de gás do planeta.' },
  BRA: { reservas: 13,  producao: 3.4,  consumo: 2.4,  custo: 28, tipo: 'Pré-sal',        campo: 'Búzios / Tupi',
         nota: 'Pré-sal: petróleo a 7 km de profundidade sob uma camada de sal. Engenharia de outro planeta.' },
  DZA: { reservas: 12,  producao: 1.0,  consumo: 0.4,  custo: 12, tipo: 'Sahara Blend',   campo: 'Hassi Messaoud',
         nota: 'Alimenta o gás da Europa por dutos submarinos. Alternativa à Rússia — e sabe disso.' },
  NOR: { reservas: 8,   producao: 1.8,  consumo: 0.2,  custo: 25, tipo: 'Brent',          campo: 'Johan Sverdrup',
         nota: 'Pegou o petróleo e virou o maior fundo soberano do mundo. Fizeram certo.' },
  AGO: { reservas: 8,   producao: 1.1,  consumo: 0.1,  custo: 26, tipo: 'Cabinda',        campo: 'Bacia do Baixo Congo',
         nota: 'Offshore profundo, quase todo exportado pra China por dívida.' },
  MEX: { reservas: 6,   producao: 1.6,  consumo: 1.9,  custo: 24, tipo: 'Maya (pesado)',  campo: 'Ku-Maloob-Zaap',
         nota: 'Cantarell secou e levou junto a mágica. A Pemex é uma dívida com uma refinaria.' },
  OMN: { reservas: 5,   producao: 1.0,  consumo: 0.2,  custo: 20, tipo: 'Médio',          campo: 'Yibal',
         nota: 'Pouco petróleo, mas senta na saída de Ormuz. A geografia vale mais que o subsolo.' },
  GBR: { reservas: 3,   producao: 0.7,  consumo: 1.5,  custo: 32, tipo: 'Brent',          campo: 'Mar do Norte',
         nota: 'O Brent ainda dá nome ao preço do mundo. Os campos, esses já estão morrendo.' },
  IND: { reservas: 4,   producao: 0.7,  consumo: 5.5,  custo: 28, tipo: 'Médio',          campo: 'Mumbai High',
         nota: 'Importa 85% do que queima. Compra russo com desconto e não pede desculpa a ninguém.' },
  IDN: { reservas: 2,   producao: 0.6,  consumo: 1.8,  custo: 27, tipo: 'Minas',          campo: 'Duri',
         nota: 'Saiu da OPEP quando virou importador líquido. Humilhação de cartel.' },
  EGY: { reservas: 3,   producao: 0.6,  consumo: 0.9,  custo: 22, tipo: 'Suez Blend',     campo: 'Golfo de Suez',
         nota: 'O petróleo é pouco. O Canal é tudo.' },
  COL: { reservas: 2,   producao: 0.8,  consumo: 0.4,  custo: 25, tipo: 'Vasconia',       campo: 'Rubiales',
         nota: 'Dutos são alvo predileto de guerrilha. Cada explosão é um dia de produção no chão.' },

  // ── OS QUE SÓ QUEIMAM ──────────────────────────────────────────────
  // BUG QUE ISTO CONSERTA: países sem ficha aqui recebiam produção 0 E consumo 0.
  // O teste `producao >= consumo` passava trivialmente e o jogo declarava o JAPÃO
  // exportador de petróleo — o país que importa 99% do que queima e cuja política
  // externa inteira gira em torno disso desde 1941.
  //
  // Reserva zero não é ausência de dado: é o dado. Estas nações são potências
  // industriais reféns de um cano que não é delas. É a vulnerabilidade que define
  // a partida com cada uma.
  JPN: { reservas: 0, producao: 0.0, consumo: 3.3, custo: 0, tipo: 'Nenhum', campo: '—',
         nota: 'Importa 99% do petróleo. O embargo americano de 1941 levou ao ataque a Pearl Harbor — o Japão nunca esqueceu o que significa depender de um cano alheio.' },
  DEU: { reservas: 0, producao: 0.0, consumo: 2.3, custo: 0, tipo: 'Nenhum', campo: '—',
         nota: 'Apostou o parque industrial no gás russo barato e descobriu em 2022 o preço da aposta. Reindustrializar sem energia própria é o problema alemão do século.' },
  KOR: { reservas: 0, producao: 0.0, consumo: 2.8, custo: 0, tipo: 'Nenhum', campo: '—',
         nota: 'Zero petróleo, e mesmo assim é um dos maiores refinadores do planeta. Compra cru do Golfo, vende derivado pro mundo, e vive com a jugular em Ormuz.' },
  ISR: { reservas: 0, producao: 0.0, consumo: 0.25, custo: 0, tipo: 'Nenhum', campo: '—',
         nota: 'Cercado de petróleo e sem uma gota. O gás do Leviatã no Mediterrâneo é a primeira independência energética real da história do país.' },
  TWN: { reservas: 0, producao: 0.0, consumo: 1.0, custo: 0, tipo: 'Nenhum', campo: '—',
         nota: 'Importa tudo por mar. Um bloqueio naval não precisa invadir Taiwan — basta esperar o combustível acabar em semanas.' },
  UKR: { reservas: 0.4, producao: 0.05, consumo: 0.2, custo: 30, tipo: 'Marginal', campo: 'Bacia do Dnieper',
         nota: 'Pouco petróleo e muito duto: era o corredor do gás russo pra Europa, e essa geografia é metade do motivo da guerra.' },
  PAK: { reservas: 0.3, producao: 0.07, consumo: 0.5, custo: 28, tipo: 'Marginal', campo: 'Sui',
         nota: 'Importa quase tudo e vive à beira do calote cambial. Cada alta do Brent é uma crise de balanço de pagamentos.' },
  PRK: { reservas: 0, producao: 0.0, consumo: 0.02, custo: 0, tipo: 'Nenhum', campo: '—',
         nota: 'Consome quase nada porque quase não tem — o país é movido a carvão e trabalho humano. A China manda o mínimo pra o regime não cair.' },
  FRA: { reservas: 0.1, producao: 0.02, consumo: 1.5, custo: 30, tipo: 'Marginal', campo: 'Bacia de Paris',
         nota: 'Praticamente sem petróleo — e resolveu o problema por outro caminho: 56 reatores nucleares geram 70% da eletricidade. É o único grande país ocidental que escolheu não depender do Golfo.' },
  TUR: { reservas: 0.3, producao: 0.07, consumo: 1.0, custo: 26, tipo: 'Marginal', campo: 'Batman',
         nota: 'Quase nenhum petróleo, e a geografia mais valiosa da região: todo duto do Cáspio e do Curdistão que queira chegar ao Mediterrâneo passa por aqui. Vende passagem, não barril.' },
};

// ── AUDITORIA DE COBERTURA ────────────────────────────────────────────
// Todo país JOGÁVEL precisa de ficha aqui — inclusive (e principalmente) os que
// não têm petróleo nenhum. Sem ficha, produção e consumo caem a 0, o teste
// `producao >= consumo` passa trivialmente, e o jogo declara o Japão exportador
// de petróleo. Foi exatamente o que aconteceu, e só apareceu ao rodar os 20 países.
//
// Se você adicionar uma nação jogável nova, adicione a ficha dela acima — mesmo
// que seja tudo zero. Zero declarado é dado; zero por omissão é bug.
export function auditarCobertura(isosJogaveis) {
  return isosJogaveis.filter((i) => !PETROLEO[i]);
}

// Países sem ficha: derivam de zero (não são potências de petróleo).
export function petroleoDe(isoCode) {
  return PETROLEO[isoCode] || null;
}

export function ehPetroestado(isoCode) {
  const p = PETROLEO[isoCode];
  if (!p) return false;
  return p.producao > p.consumo * 1.5 && p.reservas >= 20;
}

// Quais estreitos um país controla / de quais depende.
export function estreitosDe(isoCode) {
  return Object.entries(ESTREITOS)
    .filter(([, e]) => e.controle.includes(isoCode))
    .map(([id, e]) => ({ id, ...e }));
}

// ── PREÇO GLOBAL ───────────────────────────────────────────────────────
export const PRECO_BASE = 78;  // US$/barril, o mundo em paz

// Bandas narrativas do preço — a UI mostra o nome, não só o número.
export function bandaPreco(p) {
  if (p >= 160) return { rot: 'CHOQUE',    cls: 'ruim',  txt: 'O mundo está em pânico. Filas nos postos, governos caindo.' };
  if (p >= 120) return { rot: 'CRISE',     cls: 'ruim',  txt: 'Inflação corroendo tudo. Importadores sangrando.' };
  if (p >= 95)  return { rot: 'TENSO',     cls: 'aviso', txt: 'Caro. Os exportadores sorriem, o resto aperta o cinto.' };
  if (p >= 65)  return { rot: 'NORMAL',    cls: '',      txt: 'O preço que o mundo aprendeu a tolerar.' };
  if (p >= 45)  return { rot: 'BARATO',    cls: 'aviso', txt: 'Bom pra quem queima, ruim pra quem bombeia.' };
  return          { rot: 'COLAPSO',  cls: 'ruim',  txt: 'Abaixo do custo de extração de metade do planeta. Petroestados quebrando.' };
}

// ── O CAIXA DO PETRÓLEO ────────────────────────────────────────────────
// FATOR_JOGO: a matemática real dá ~US$ 48 bi/trimestre de déficit pros EUA —
// verdadeiro, mas invisível ao lado de um PIB de 28 tri. O jogo multiplica por 6
// pra que a decisão de petróleo PESE. É um botão de design, não um erro de conta.
const FATOR_JOGO = 6;
const DIAS_TURNO = 30; // uma batida do mundo ≈ um MÊS (calendário mensal)

// Retorna o fluxo de petróleo do turno, em US$ trilhões (+ entra, − sai).
export function fluxoPetroleo(estado) {
  const producao = estado.petroleo_producao || 0;
  const consumo = estado.petroleo_consumo || 0;
  const preco = estado.preco_petroleo || PRECO_BASE;
  const custoBarril = estado.petroleo_custo || 30;

  // Receita bruta do que você bombeia − custo de extrair
  const receita = (producao * (preco - custoBarril) * DIAS_TURNO * FATOR_JOGO) / 1e6;
  // O que falta pro seu consumo, você COMPRA no mercado a preço cheio
  const deficit = Math.max(0, consumo - producao);
  const importacao = (deficit * preco * DIAS_TURNO * FATOR_JOGO) / 1e6;
  // O que sobra, você EXPORTA
  const excedente = Math.max(0, producao - consumo);

  return {
    producao, consumo, preco, custoBarril,
    saldoBarris: round1(producao - consumo),
    receita: round2(receita),
    importacao: round2(importacao),
    excedente: round1(excedente),
    liquido: round2(receita - importacao),
    autossuficiente: producao >= consumo,
    // Dependência: quanto do que você queima vem de fora (0–100%)
    dependencia: consumo > 0 ? Math.round((deficit / consumo) * 100) : 0,
  };
}

// Preço alto machuca quem importa e engorda quem exporta — em aprovação e PIB.
export function impactoPreco(estado) {
  const preco = estado.preco_petroleo || PRECO_BASE;
  const f = fluxoPetroleo(estado);
  const desvio = (preco - PRECO_BASE) / PRECO_BASE; // +1 = dobrou

  if (f.autossuficiente) {
    return { aprovacao: Math.round(desvio * 4), pib: round2(desvio * 0.5), exportador: true };
  }
  // Importador: preço alto é gasolina cara, é inflação, é gente com raiva
  const peso = f.dependencia / 100;
  return {
    aprovacao: Math.round(-desvio * 14 * peso),
    pib: round2(-desvio * 1.6 * peso),
    exportador: false,
  };
}

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }
