// FICHA DO MUNDO — Coreia do Sul, era 2026. Mesmo esquema do FICHA_EUA_2026.
// Líder FICTÍCIO por regra do projeto (o jogo tem missões de assassinato).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_KOR = {
  ficha: {
    ano: 2026,
    pais: 'Coreia do Sul',
    iso: 'KOR',
    presidente: 'Presidente Seo Jin-woo', // FICTÍCIO
    capital: 'Seul',
    pino: { lat: 37.57, lng: 126.98 },

    resumo: `Saiu de mais pobre que Gana para décima economia do mundo em duas gerações — e
cobrou o preço: a menor taxa de fecundidade já registrada em qualquer país, 0,7 filho por
mulher, o que significa que cada geração encolhe dois terços. Metade da população mora numa
área metropolitana que está no alcance da artilharia convencional norte-coreana; não precisa de
bomba para achatar Seul, basta o que já está apontado. Faz chip, navio, carro e K-pop, e nos
últimos anos virou grande exportadora de armas: a Polônia comprou tanque e obuseiro sul-coreano
porque a Coreia entrega em dois anos e a Alemanha em dez. A democracia é jovem e nervosa —
teve lei marcial decretada e revogada em seis horas em dezembro de 2024, e todo ex-presidente
que sai do cargo tende a acabar respondendo processo. Sem ogivas, protegida pelo guarda-chuva
americano, e com uma parte da opinião pública perguntando alto se não deveria ter as suas.`,

    relacoes: {
      // O país é a Coreia do Sul — por isso não há rel_coreia aqui.
      rel_eua: 78,        // 28 mil soldados em Camp Humphreys, a maior base americana fora dos EUA
      rel_china: -15,     // maior parceiro comercial. Que boicotou a Coreia inteira por causa do THAAD
      rel_russia: -30,    // azedou quando Moscou começou a pagar Pyongyang em tecnologia militar
      rel_ira: 5,
      rel_brasil: 35,
      rel_israel: 20,
      rel_taiwan: 20,     // concorrente direta em chips, e ninguém fala disso em voz alta
      rel_arabia: 45,     // construiu meio Golfo nos anos 70 e ainda constrói. Petróleo por concreto
      rel_ue: 50,
      rel_reino: 40,
      rel_ucrania: 30,    // vende munição que "vai para os EUA" e depois ninguém pergunta onde foi parar
      rel_india: 40,
      // Espelho do que está em jpn.js: dois aliados dos EUA, o mesmo inimigo, e história
      // demais. Ocupação de 1910–45, trabalho forçado, mulheres de conforto, as rochas de
      // Dokdo/Takeshima. Comércio enorme, confiança nenhuma. Não é um número alto por decisão.
      rel_japao: 25,
      rel_norte: -80,     // tecnicamente em guerra desde 1953: existe armistício, não existe paz
      rel_mexico: 30,
      rel_canada: 45,
      rel_australia: 50,
      rel_turquia: 45,    // "países irmãos de sangue": a Turquia mandou tropa em 1950 e a Coreia nunca esqueceu
      rel_paquistao: 10,
      rel_venezuela: 0,
      rel_indonesia: 45,  // sócia minoritária do KF-21 — e atrasou a parte dela do pagamento
      rel_egito: 30,      // comprou o obuseiro K9 e monta em casa
    },

    tensoes: [
      'Fecundidade de 0,7: o país mais rápido do mundo a desaparecer',
      'Seul no alcance da artilharia convencional do Norte',
      'Democracia nervosa: lei marcial de 2024 e presidentes que acabam processados',
      'Dependência da China no comércio versus dependência dos EUA na defesa',
      'Debate público sobre construir a própria bomba',
    ],

    estadoInicial: {
      aprovacao: 38,
      estabilidade: 50,    // o susto da lei marcial de dezembro de 2024 não passou
      soft_power: 74,      // BTS, Parasita, Round 6. A exportação cultural mais eficiente do século
      seguranca: 45,       // o vizinho tem bomba e a capital está no alcance do canhão
      temp_guerra: 55,     // a mais alta da lista: a guerra nunca acabou formalmente
      temp_economia: 48,
      liberdades: 74,
      poder_militar: 66,   // conscrição de 18 meses, 500 mil na ativa e reserva de milhões
      pib: 1.9,
      tesouro: 0.42,       // reservas cambiais de ~US$ 420 bi, construídas como trauma de 1997
      divida: 55,          // baixa. O trauma do FMI em 1997 virou disciplina fiscal permanente
      aliquota: 30,
      inteligencia: 62,
      capacidade_ind: 82,  // semicondutor, estaleiro, bateria. A cadeia global passa por aqui
      uranio: 30,          // reatores sim, turno não: o acordo com os EUA proíbe enriquecer
      territorio: 1,
      ogivas: 0,           // e cerca de 70% da população dizendo em pesquisa que queria ter
    },

    fiosSemente: [
      { tema: 'Colapso demográfico: 0,7 filho por mulher', intensidade: 65, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Artilharia norte-coreana apontada para Seul', intensidade: 60, alvo_pressao: 'seguranca', atores: ['norte', 'china'] },
      { tema: 'Debate sobre construir a própria bomba', intensidade: 48, alvo_pressao: 'ogivas', atores: ['eua', 'norte'] },
      { tema: 'Preso entre o comércio chinês e a defesa americana', intensidade: 52, alvo_pressao: 'temp_economia', atores: ['china', 'eua'] },
    ],
  },

  // O Dokdo é um navio de assalto anfíbio sem catapulta e sem rampa — não opera caça.
  // Entra como porta_avioes porque é o topo da capacidade naval do país, mas é generoso.
  forcas: {
    infantaria: 500000,
    blindados: 2500,
    artilharia: 3000,    // a resposta doutrinária ao canhão do Norte é ter mais canhão
    helicopteros: 700,
    cacas: 400,
    bombardeiros: 0,
    drones: 30,
    navios: 60,
    submarinos: 20,
    porta_avioes: 1,
    misseis: 300,        // os Hyunmoo: o plano é decapitar Pyongyang antes que Seul vire pó
    defesa_aerea: 35,    // Cheongung KM-SAM nacional + Patriot: o escudo contra a artilharia de Pyongyang
    ogivas: 0,
  },

  empresas: [
    { id: 'kepco', nome: 'KEPCO', setor: 'Energia', estatal: true, participacao: 51, valor: 0.02, margem: -0.02,
      logo: null, bonus: { pib: 0.12, capacidade_ind: 3 },
      desc: 'O Estado tem 51% e usa a empresa como controle de inflação: segurou a tarifa durante a crise energética e a estatal acumulou 150 bilhões de dólares em dívida fazendo esse favor. Vende reator para os Emirados enquanto perde dinheiro vendendo luz em casa.' },
    { id: 'kogas', nome: 'Korea Gas', sigla: 'KOGAS', setor: 'Energia', estatal: true, participacao: 54, valor: 0.01, margem: 0.02,
      logo: null, bonus: { pib: 0.05, seguranca: 2 },
      desc: 'Monopólio estatal de importação de gás para um país que não produz uma molécula do próprio. Um dos maiores compradores de GNL do planeta — e por isso o preço do gás no Catar é assunto de política interna em Seul.' },
    { id: 'kdb', nome: 'Korea Development Bank', sigla: 'KDB', setor: 'Financeiro', estatal: true, participacao: 100, valor: 0.04, margem: 0.03,
      logo: null, bonus: { capacidade_ind: 3, temp_economia: 2 },
      desc: 'Cem por cento do Estado, e o banco que construiu os chaebol na marra a partir dos anos 60: crédito dirigido para quem o general mandasse crescer. Ainda hoje é ele que decide se um estaleiro falido quebra ou é resgatado.' },
    { id: 'knoc', nome: 'KNOC', setor: 'Energia', estatal: true, participacao: 100, valor: 0.01, margem: 0.01,
      petroleo: 0.06, logo: null, bonus: { seguranca: 2 },
      desc: 'Petroleira estatal de um país sem petróleo. Guarda a reserva estratégica em cavernas e compra participação em poço alheio com resultados que já renderam CPI. Existe porque ficar sem combustível, aqui, não é crise econômica: é derrota militar.' },
    { id: 'hanwha', nome: 'Hanwha Aerospace', setor: 'Defesa', estatal: false, participacao: 0, valor: 0.03, margem: 0.12,
      logo: null, bonus: { capacidade_ind: 3 },
      desc: 'Faz o obuseiro K9, que virou o mais vendido do mundo pela razão mais simples possível: a linha de montagem nunca parou desde 1999, porque o cliente original nunca teve o luxo de achar que a guerra tinha acabado. A Europa acordou em 2022 e descobriu que só a Coreia tinha fábrica quente.' },
    { id: 'rotem', nome: 'Hyundai Rotem', setor: 'Defesa', estatal: false, participacao: 0, valor: 0.01, margem: 0.08,
      logo: null, bonus: { capacidade_ind: 2 },
      desc: 'Faz o K2 Black Panther e entregou os primeiros à Polônia em quatro meses. A Alemanha ainda estava montando a apresentação de PowerPoint sobre o prazo do Leopard.' },
  ],

  equipamentos: {
    _nome: 'Coreia do Sul',
    blindados:    { nome: 'K2 Black Panther',   fab: 'Hyundai Rotem',         origem: 'KOR', proprio: true,
      foto: `${W}/4/41/U.S.%2C_ROK_forces_forge_interoperability_with_combined_arms_exercise_-_8_of_8.jpg/330px-U.S.%2C_ROK_forces_forge_interoperability_with_combined_arms_exercise_-_8_of_8.jpg` },
    artilharia:   { nome: 'K9 Thunder',         fab: 'Hanwha Aerospace',      origem: 'KOR', proprio: true,
      foto: `${W}/e/ed/2011.2.17_%EC%9C%A1%EA%B5%B06%ED%8F%AC%EB%B3%91%EC%97%AC%EB%8B%A8_k-9%2Ck-55_%EC%9E%90%EC%A3%BC%ED%8F%AC%EC%82%AC%EA%B2%A9_%287633864346%29.jpg/330px-2011.2.17_%EC%9C%A1%EA%B5%B06%ED%8F%AC%EB%B3%91%EC%97%AC%EB%8B%A8_k-9%2Ck-55_%EC%9E%90%EC%A3%BC%ED%8F%AC%EC%82%AC%EA%B2%A9_%287633864346%29.jpg` },
    cacas:        { nome: 'KF-21 Boramae',      fab: 'KAI',                   origem: 'KOR', proprio: true,
      foto: `${W}/0/0c/KF-21_Boramae_First_Production.jpg/330px-KF-21_Boramae_First_Production.jpg` },
    porta_avioes: { nome: 'ROKS Dokdo',         fab: 'Hanjin Heavy',          origem: 'KOR', proprio: true,
      foto: `${W}/4/4d/ROKS_Dokdo_%28LPH_6111%29_-_Invincible_Spirit.jpg/330px-ROKS_Dokdo_%28LPH_6111%29_-_Invincible_Spirit.jpg` },
    navios:       { nome: 'Destróier Sejong o Grande', fab: 'Hyundai Heavy / Hanwha Ocean', origem: 'KOR', proprio: true,
      foto: `${W}/1/1b/ROKS_Sejong_the_Great_%28DDG-991%29%2C_broadside_view_in_July_2010.jpg/330px-ROKS_Sejong_the_Great_%28DDG-991%29%2C_broadside_view_in_July_2010.jpg` },
    submarinos:   { nome: 'Classe Dosan Ahn Changho', fab: 'Hanwha Ocean / HHI', origem: 'KOR', proprio: true,
      foto: `${W}/e/eb/260621-N-DP708-1007_ROKS_Dosan_ahn_Chang-ho_%28SS-083%29_arrives_at_Pearl_Harbor-Hickam_for_RIMPAC_2026.jpg/330px-260621-N-DP708-1007_ROKS_Dosan_ahn_Chang-ho_%28SS-083%29_arrives_at_Pearl_Harbor-Hickam_for_RIMPAC_2026.jpg` },
    misseis:      { nome: 'Hyunmoo-3',          fab: 'LIG Nex1 / ADD',        origem: 'KOR', proprio: true,
      foto: `${W}/9/9e/Hyunmoo-3_missile_carrier.jpg/330px-Hyunmoo-3_missile_carrier.jpg` },
    helicopteros: { nome: 'KUH-1 Surion',       fab: 'KAI / Airbus',          origem: 'KOR', proprio: true,
      foto: `${W}/e/ed/KUH-1_Surion_Demo_flight.jpg/330px-KUH-1_Surion_Demo_flight.jpg` },
  },
};
