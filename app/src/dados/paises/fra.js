// FICHA DO MUNDO — França, era 2026. Mesmo esquema do FICHA_EUA_2026.
// Líder FICTÍCIO por regra do projeto (o jogo tem missões de assassinato).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_FRA = {
  ficha: {
    ano: 2026,
    pais: 'França',
    iso: 'FRA',
    presidente: 'Presidente Aurélien Mercier', // FICTÍCIO
    capital: 'Paris',
    pino: { lat: 48.86, lng: 2.35 },

    resumo: `A única potência nuclear da União Europeia desde o Brexit, e ela nunca deixa ninguém
esquecer. Tem tudo que a Alemanha não tem: bomba própria, porta-aviões nuclear, assento
permanente no Conselho de Segurança e a doutrina de não perguntar a Washington antes de agir —
De Gaulle tirou o país do comando integrado da OTAN em 1966 e o país só voltou em 2009, de mau
humor. Cinquenta e seis reatores geram 70% da eletricidade: enquanto a Alemanha comprava gás
russo, a França comprava urânio do Níger, e as duas descobriram que a conta chega igual.
Economia grande e travada, dívida em 112% do PIB, e uma Assembleia tão fragmentada que derrubar
governo virou esporte. Exército de verdade, e o único da Europa com hábito recente de usá-lo
sozinho — o Sahel que o diga, até ser expulso de lá.`,

    relacoes: {
      // A França é fundadora e cofundadora da UE — por isso não há rel_ue aqui.
      rel_eua: 48,        // aliado que desconfia por doutrina desde De Gaulle. E aí veio o AUKUS
      rel_china: -5,      // pragmatismo: vende Airbus, reclama de Taiwan em voz baixa
      rel_russia: -60,
      rel_ira: -30,
      rel_brasil: 40,     // vizinha de fato: a Guiana Francesa faz fronteira com o Amapá
      rel_israel: 30,     // a maior comunidade judaica e a maior comunidade muçulmana da Europa
      rel_taiwan: 10,
      rel_arabia: 35,     // cliente de Rafale, e cliente não se contraria
      rel_reino: 40,      // mil anos de rivalidade e o tratado de Lancaster House. As duas coisas
      rel_ucrania: 62,
      rel_india: 60,      // Rafale, submarinos, satélites. O melhor cliente e quase um aliado
      rel_japao: 45,
      rel_coreia: 35,
      rel_norte: -50,
      rel_mexico: 25,
      rel_canada: 50,     // e a França ainda finge que o Quebec é assunto dela
      rel_australia: 5,   // o AUKUS cancelou 56 bilhões em submarinos por SMS. Paris chamou o embaixador de volta
      rel_turquia: -15,   // atrito no Mediterrâneo Oriental, na Líbia e sobre o genocídio armênio
      rel_paquistao: 0,
      rel_venezuela: -15,
      rel_indonesia: 35,  // comprou 42 Rafale em 2022
      rel_egito: 45,      // primeiro cliente estrangeiro do Rafale, e não faz perguntas
    },

    tensoes: [
      'Dívida em 112% do PIB e déficit fora das regras que a própria França ajudou a escrever',
      'Assembleia fragmentada: derrubar governo virou rotina',
      'Perda de influência no Sahel — expulsa do Mali, Burkina e Níger',
      'Extrema-direita perto do poder pela primeira vez desde a guerra',
      'Bancar sozinha a dissuasão nuclear europeia se os EUA saírem',
    ],

    estadoInicial: {
      aprovacao: 30,       // impopularidade é o clima permanente da Quinta República
      estabilidade: 48,    // parlamento sem maioria + tradição de queimar pneu na rua
      soft_power: 76,
      seguranca: 62,
      temp_guerra: 35,
      temp_economia: 38,
      liberdades: 80,
      // poder_militar 62: menor que o dos EUA, muito maior que o alemão. A diferença
      // não é dinheiro — é doutrina. A França manteve a capacidade de agir sozinha.
      poder_militar: 62,
      pib: 3.1,
      tesouro: 0.25,
      divida: 112,         // e subindo. Bruxelas reclama, Paris ignora, é assim desde 2007
      aliquota: 46,        // a maior carga tributária da OCDE. E os serviços realmente funcionam
      inteligencia: 68,    // a DGSE opera na África como se ainda fosse 1975
      capacidade_ind: 66,
      // uranio 70: turno nuclear completo — enriquece, reprocessa e faz combustível em casa.
      // A Orano é o motivo. O minério vem do Níger e do Cazaquistão, o que é um problema à parte.
      uranio: 70,
      territorio: 1,
      ogivas: 290,         // a "force de frappe": subs e caças, sem componente terrestre desde 1996
    },

    fiosSemente: [
      { tema: 'Dívida e déficit fora do teto europeu', intensidade: 58, alvo_pressao: 'divida', atores: [] },
      { tema: 'Assembleia fragmentada e governos que caem', intensidade: 55, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Expulsão do Sahel e o vácuo que a Rússia ocupou', intensidade: 50, alvo_pressao: 'soft_power', atores: ['russia'] },
      { tema: 'Dissuasão nuclear europeia sem os americanos', intensidade: 45, alvo_pressao: 'seguranca', atores: ['eua', 'russia'] },
    ],
  },

  // 4 SSBN classe Le Triomphant + 6 SSN classe Suffren/Rubis = 10 submarinos, todos nucleares.
  // A França não opera submarino diesel — só vende para os outros.
  forcas: {
    infantaria: 200000,
    blindados: 200,
    artilharia: 110,
    helicopteros: 300,
    cacas: 250,
    bombardeiros: 0,     // a bomba vai pendurada no Rafale. Bombardeiro estratégico foi aposentado em 1996
    drones: 25,
    navios: 40,
    submarinos: 10,
    porta_avioes: 1,     // Charles de Gaulle: o único porta-aviões nuclear fora dos EUA
    misseis: 180,
    defesa_aerea: 12,    // SAMP/T Mamba, o único sistema europeu que rivaliza com o Patriot
    ogivas: 290,
  },

  empresas: [
    { id: 'edf', nome: 'EDF', setor: 'Energia', estatal: true, participacao: 100, valor: 0.06, margem: 0.05,
      logo: null, bonus: { pib: 0.14, capacidade_ind: 3 },
      desc: 'Renacionalizada em 2023. Cinquenta e seis reatores nucleares — 70% da eletricidade francesa. A independência energética que o resto da Europa inveja.' },
    { id: 'total', nome: 'TotalEnergies', setor: 'Energia', estatal: false, participacao: 6, valor: 0.15, margem: 0.07,
      petroleo: 2.0, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/54/TotalEnergies_logo.svg/250px-TotalEnergies_logo.svg.png',
      bonus: { pib: 0.14 },
      desc: 'Petróleo francês com tentáculos na África inteira. Onde há um golpe no Sahel, há um contrato da Total por perto.' },
    { id: 'orano', nome: 'Orano', setor: 'Mineração', estatal: true, participacao: 90, valor: 0.02, margem: 0.06,
      logo: null, bonus: { uranio: 5, capacidade_ind: 2 },
      desc: 'Ex-Areva, rebatizada depois de quase quebrar. Minera urânio no Níger e no Cazaquistão, enriquece em Tricastin e reprocessa em La Hague. É por causa dela que a bomba francesa não depende de ninguém — e é por causa dela que um golpe em Niamey vira assunto de segurança nacional em Paris.' },
    { id: 'naval', nome: 'Naval Group', setor: 'Defesa', estatal: true, participacao: 62, valor: 0.01, margem: 0.05,
      logo: null, bonus: { capacidade_ind: 3 },
      desc: 'O Estado tem 62% e a Thales o resto. Faz o porta-aviões nuclear e os submarinos — e perdeu o maior contrato da história quando a Austrália trocou de fornecedor por telefone.' },
    { id: 'thales', nome: 'Thales', setor: 'Defesa', estatal: true, participacao: 26, valor: 0.04, margem: 0.09,
      logo: null, bonus: { capacidade_ind: 2, inteligencia: 3 },
      desc: 'O Estado é o maior acionista com 26% — o bastante para mandar. Radar, criptografia e guerra eletrônica. Também faz o sistema que controla o tráfego aéreo de meio mundo, o que dá uma ideia do acesso.' },
    { id: 'airbus', nome: 'Airbus', setor: 'Aeroespacial', estatal: true, participacao: 11, valor: 0.13, margem: 0.05,
      logo: null, bonus: { capacidade_ind: 3, soft_power: 1 },
      desc: 'França, Alemanha e Espanha dividem o controle acionário para que nenhuma mande sozinha. Bateu a Boeing em entregas e ainda assim precisa de três governos para aprovar uma linha de montagem.' },
  ],

  equipamentos: {
    _nome: 'França',
    blindados:    { nome: 'AMX Leclerc',        fab: 'KNDS France',           origem: 'FRA', proprio: true,
      foto: `${W}/f/fc/Leclerc-openphotonet_PICT6015.JPG/330px-Leclerc-openphotonet_PICT6015.JPG` },
    cacas:        { nome: 'Dassault Rafale',    fab: 'Dassault Aviation',     origem: 'FRA', proprio: true,
      foto: `${W}/6/64/Rafale_-_RIAT_2009_%283751416421%29.jpg/330px-Rafale_-_RIAT_2009_%283751416421%29.jpg` },
    porta_avioes: { nome: 'Charles de Gaulle',  fab: 'Naval Group',           origem: 'FRA', proprio: true,
      foto: `${W}/f/fe/French_aircraft_carrier_Charles_de_Gaulle_%28R91%29_underway_in_the_Ionian_Sea_on_17_March_2022_%28220317-N-DH793-1322%29cropped.JPG/330px-French_aircraft_carrier_Charles_de_Gaulle_%28R91%29_underway_in_the_Ionian_Sea_on_17_March_2022_%28220317-N-DH793-1322%29cropped.JPG` },
    submarinos:   { nome: 'Classe Suffren',     fab: 'Naval Group',           origem: 'FRA', proprio: true,
      foto: `${W}/d/d4/Suffren_at_Cape_Brun_off_Toulon_on_26_July_2020.jpg/330px-Suffren_at_Cape_Brun_off_Toulon_on_26_July_2020.jpg` },
    artilharia:   { nome: 'CAESAR 155mm',       fab: 'KNDS France',           origem: 'FRA', proprio: true,
      foto: `${W}/4/4f/French_Army_CAESAR_self-propelled_wheeled_howitzer%2C_2021.jpg/330px-French_Army_CAESAR_self-propelled_wheeled_howitzer%2C_2021.jpg` },
    helicopteros: { nome: 'Eurocopter Tigre HAD', fab: 'Airbus Helicopters',  origem: 'FRA', proprio: true,
      foto: `${W}/3/38/French_Army%2C_6010%2C_Eurocopter_EC_665_Tiger_HAD_%2849580123847%29.jpg/330px-French_Army%2C_6010%2C_Eurocopter_EC_665_Tiger_HAD_%2849580123847%29.jpg` },
    navios:       { nome: 'Fragata FREMM Aquitaine', fab: 'Naval Group',      origem: 'FRA', proprio: true,
      foto: `${W}/0/04/Fr%C3%A9gate_Aquitaine_1.jpg/330px-Fr%C3%A9gate_Aquitaine_1.jpg` },
    misseis:      { nome: 'SCALP EG',           fab: 'MBDA',                  origem: 'FRA', proprio: true,
      foto: `${W}/4/42/Storm_Shadow_p1220865.jpg/330px-Storm_Shadow_p1220865.jpg` },
  },
};
