// FICHA DO MUNDO — China, era 2026. Mesmo formato do eua-2026.js.
// Snapshot que a Máquina é OBRIGADA a respeitar.
//
// LÍDER FICTÍCIO: Wen Jiarong. Não é ninguém. O jogo tem missões de assassinato —
// não se modela violência contra pessoa real. Vale para todas as fichas.

export const PAIS_CHN = {
  ficha: {
    ano: 2026,
    pais: 'China',
    iso: 'CHN',
    presidente: 'Wen Jiarong',
    capital: 'Pequim',
    bandeira: '🐉',
    pino: { lat: 39.9, lng: 116.4 },

    resumo: `Segunda economia do planeta e a única fábrica que o resto do mundo não consegue
substituir: 30% da manufatura global saem daqui. Maior marinha do mundo em número de cascos —
e nenhuma experiência de combate desde 1979. Refina 90% das terras raras do planeta, o que dá
a ela a mão no pescoço da indústria americana. Em troca, importa 70% do petróleo que queima e
quase tudo passa por Malaca, um estreito que a Sétima Frota fecha num fim de semana. Demografia
em queda livre, setor imobiliário em coma induzido, e uma dívida local que ninguém audita.
Taiwan é a questão que o regime não pode perder e não sabe vencer barato.`,

    // Ponto de vista DA CHINA. Sem rel_china — o país não se relaciona consigo mesmo.
    relacoes: {
      // o rival que define tudo
      rel_eua: -45,
      rel_taiwan: -75,     // não é país, é "província rebelde" — e é a linha vermelha do regime
      rel_japao: -40,      // Senkaku, memória de 1937, e o rearmamento que Tóquio finalmente admitiu
      rel_india: -35,      // tropa morrendo a pauladas em Galwan, 2020, pra não violar o acordo de não usar arma de fogo
      rel_australia: -20,  // AUKUS de um lado, minério de ferro do outro: hostilidade que não pode custar caro
      // parceria sem tratado — o arranjo mais importante e o menos formalizado
      rel_russia: 68,      // "amizade sem limites" com limites: a Rússia vende barato porque não tem outro comprador
      rel_norte: 45,       // aliado por tratado e vergonha alheia; a alternativa é refugiado na fronteira
      rel_paquistao: 72,   // corredor CPEC e o inimigo do meu inimigo indiano
      rel_ira: 55,         // petróleo com desconto sancionado — quem mais compraria?
      // Sul Global: onde a China compra influência a preço de infraestrutura
      rel_brasil: 55,      // maior parceiro comercial: soja e minério indo, tudo o mais voltando
      rel_venezuela: 48,   // emprestou bilhões e recebe em barril; um mau negócio virou dependência mútua
      rel_indonesia: 45,
      rel_egito: 42,
      rel_arabia: 50,      // intermediou a paz com o Irã em 2023, na frente do Estado que se dizia dono da região
      rel_turquia: 25,     // OTAN de carteirinha, mas compra o que ninguém quer vender
      rel_mexico: 20,
      // Europa: comércio grande demais pra romper, desconfiança grande demais pra confiar
      rel_ue: 15,
      rel_reino: -10,
      rel_canada: -15,     // preso desde a detenção da executiva da Huawei
      rel_coreia: 10,      // sanção informal desde o THAAD; o comércio nunca voltou ao que era
      rel_israel: 12,
      rel_ucrania: -5,     // neutralidade que ninguém em Kiev acredita
    },

    tensoes: [
      'Taiwan: reunificação como dogma, invasão como aposta impagável',
      'Crise imobiliária e dívida dos governos locais',
      'Colapso demográfico e envelhecimento acelerado',
      'Cerco tecnológico: sanções de semicondutores e controle de exportação',
      'Dependência do estreito de Malaca para importar energia',
    ],

    estadoInicial: {
      aprovacao: 62,
      estabilidade: 70,
      // soft_power baixo pro tamanho: exporta produto, não desejo. Ninguém emigra pra Chongqing
      // sonhando, e a Ponte/Cinturão comprou porto sem comprar simpatia.
      soft_power: 45,
      seguranca: 72,
      temp_guerra: 35,
      temp_economia: 55,
      // liberdades no chão: partido único, grande firewall, crédito social. É desenho, não defeito.
      liberdades: 18,
      poder_militar: 82,  // maior marinha do mundo em cascos, zero combate desde 1979
      // economia (US$ trilhões)
      pib: 18.5,
      tesouro: 3.3,       // reservas cambiais ~US$ 3,2 tri, as maiores do planeta
      divida: 88,         // dívida/PIB oficial; com os veículos dos governos locais, ninguém sabe
      aliquota: 21,
      // capacidades (0–100)
      inteligencia: 72,
      capacidade_ind: 92, // ~30% da manufatura mundial. É aqui que a China ganha ou perde tudo
      uranio: 55,         // produz pouco, importa de Cazaquistão e Namíbia
      territorio: 1,
      ogivas: 500,        // arsenal em expansão rápida — era ~200 em 2019
    },

    fiosSemente: [
      { tema: 'Reunificação de Taiwan', intensidade: 62, alvo_pressao: 'temp_guerra', atores: ['taiwan', 'eua', 'japao'] },
      { tema: 'Crise imobiliária e dívida local', intensidade: 58, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Cerco de semicondutores', intensidade: 55, alvo_pressao: 'capacidade_ind', atores: ['eua', 'taiwan'] },
      { tema: 'Inverno demográfico', intensidade: 40, alvo_pressao: 'estabilidade', atores: [] },
    ],
  },

  // Ordem de batalha aproximada (IISS/Balanço Militar, arredondado).
  forcas: {
    infantaria: 2000000,  // maior exército permanente do mundo
    blindados: 5000,
    artilharia: 9800,
    helicopteros: 900,
    cacas: 1900,
    bombardeiros: 220,    // H-6 é um Tu-16 dos anos 50 remendado com míssil moderno
    drones: 500,
    navios: 300,
    submarinos: 60,       // maioria diesel: barulhenta e presa ao litoral
    porta_avioes: 3,      // Liaoning, Shandong, Fujian — o terceiro com catapulta eletromagnética
    misseis: 3000,        // a Força de Foguetes é a joia: DF-21D e DF-26, os "matadores de porta-aviões"
    defesa_aerea: 110,   // HQ-9 nacional + S-400 comprado da Rússia; cobre todo o litoral e o Estreito
    ogivas: 500,
  },

  // Reaproveitadas de dados/empresas.js (chave CHN). Aqui o Estado não é acionista: é a economia.
  empresas: [
    { id: 'cnpc', nome: 'CNPC / PetroChina', setor: 'Energia', estatal: true, participacao: 84, valor: 0.22, margem: 0.09,
      petroleo: 2.4, logo: null, bonus: { pib: 0.16 },
      desc: 'A maior petroleira estatal da China. Bombeia em Daqing, na Ásia Central, na África — em qualquer lugar que não faça perguntas.' },
    { id: 'sinopec', nome: 'Sinopec', setor: 'Energia', estatal: true, participacao: 68, valor: 0.4, margem: 0.08,
      petroleo: 1.3, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Sinopec_logo.svg/330px-Sinopec_logo.svg.png',
      bonus: { pib: 0.18 },
      desc: 'Gigante estatal de refino. O Estado é o acionista controlador e o presidente é nomeado pelo Partido. Não há ficção de independência.' },
    { id: 'norinco', nome: 'Norinco', setor: 'Defesa', estatal: true, participacao: 100, valor: 0.08, margem: 0.1,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Norinco_headquarters_at_46_Sanlihe_Rd_%2820200921163658%29.jpg/3840px-Norinco_headquarters_at_46_Sanlihe_Rd_%2820200921163658%29.jpg',
      bonus: { capacidade_ind: 4 },
      desc: 'Cem por cento do Estado. Arma metade do Sul Global com equipamento que custa um terço do ocidental e funciona dois terços do tempo.' },
    { id: 'sgcc', nome: 'State Grid', setor: 'Infraestrutura', estatal: true, participacao: 100, valor: 0.12, margem: 0.05,
      logo: null, bonus: { pib: 0.14, capacidade_ind: 3 },
      desc: 'A maior empresa de energia elétrica do planeta por receita. Um bilhão de clientes. E dona de pedaços da rede elétrica de Brasil, Portugal e Itália.' },
  ],

  // Fotos: todas resolvidas pela API do Commons (imageinfo/thumburl), nunca montadas à mão.
  equipamentos: {
    _nome: 'China',
    infantaria:   { nome: 'Fuzileiro do EPL (QBZ-95)', fab: 'Norinco', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Soldiers_of_the_Chinese_People%27s_Liberation_Army_-_2011.jpg/330px-Soldiers_of_the_Chinese_People%27s_Liberation_Army_-_2011.jpg' },
    blindados:    { nome: 'ZTZ-99A', fab: 'Norinco', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/ZTZ-99A_tank_front_20170902.jpg/330px-ZTZ-99A_tank_front_20170902.jpg' },
    artilharia:   { nome: 'PLZ-05', fab: 'Norinco', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/PLZ-05_Self-Propelled_Artillery_20170902.jpg/330px-PLZ-05_Self-Propelled_Artillery_20170902.jpg' },
    helicopteros: { nome: 'CAIC Z-10', fab: 'Changhe', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Changhe_Z-10_helicopter_armament.jpg/330px-Changhe_Z-10_helicopter_armament.jpg' },
    cacas:        { nome: 'Chengdu J-20', fab: 'Chengdu Aerospace', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/J-20_at_CCAS2022_%2820220827103424%29.jpg/330px-J-20_at_CCAS2022_%2820220827103424%29.jpg' },
    bombardeiros: { nome: 'Xian H-6K', fab: 'Xian Aircraft', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Xian_H-6_bombers%2C_China_Aviation_Museum.jpg/330px-Xian_H-6_bombers%2C_China_Aviation_Museum.jpg' },
    drones:       { nome: 'Wing Loong II', fab: 'AVIC / Chengdu', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Wing_Loong_I_at_Dubai_Airshow_2017.jpg/330px-Wing_Loong_I_at_Dubai_Airshow_2017.jpg' },
    navios:       { nome: 'Destróier Type 055', fab: 'CSSC', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/PLANS_Nanchang_%28DDG-101%29_20210427.jpg/330px-PLANS_Nanchang_%28DDG-101%29_20210427.jpg' },
    submarinos:   { nome: 'SSBN Type 094 Jin', fab: 'Bohai Shipyard', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Type_094_SSBN.JPG/330px-Type_094_SSBN.JPG' },
    porta_avioes: { nome: 'Porta-aviões Shandong', fab: 'Dalian / Jiangnan', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Chinese_aircraft_carrier_Shandong_in_2019.jpg/330px-Chinese_aircraft_carrier_Shandong_in_2019.jpg' },
    misseis:      { nome: 'DF-21D', fab: 'CASIC', origem: 'CHN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/DF-21A_TEL_-_Chinese_Military_Museum_Beijing.jpg/330px-DF-21A_TEL_-_Chinese_Military_Museum_Beijing.jpg' },
  },
};
