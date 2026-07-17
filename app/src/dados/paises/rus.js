// FICHA DO MUNDO — Rússia, era 2026. Mesmo formato do eua-2026.js.
//
// LÍDER FICTÍCIO: Arkadi Volkov. Personagem inventado.

export const PAIS_RUS = {
  ficha: {
    ano: 2026,
    pais: 'Rússia',
    iso: 'RUS',
    presidente: 'Arkadi Volkov',
    capital: 'Moscou',
    bandeira: '🐻',
    pino: { lat: 55.75, lng: 37.6 },

    resumo: `O maior país do mundo em território e o 11º em economia — um posto de gasolina com
ogivas, como disse o senador americano, e a piada só irrita porque acerta. Tem o maior arsenal
nuclear do planeta e um exército que levou três anos para tomar cidades a 30 km da própria
fronteira. A economia sobrevive sob a sanção porque a Índia e a China compram o barril com
desconto e ninguém fiscaliza a frota-fantasma. A indústria de defesa é a única que gira a todo
vapor — e é isso que segura o PIB, o que é uma forma cara de crescer. Um milhão de pessoas com
diploma foram embora desde 2022. Não voltam.`,

    // Ponto de vista DA RÚSSIA. Sem rel_russia.
    relacoes: {
      rel_eua: -70,
      rel_ucrania: -90,    // não há número menor; a guerra é a variável independente de tudo aqui
      rel_ue: -65,
      rel_reino: -75,      // Londres é a cidade que Moscou mais odeia e onde mais comprou apartamento
      rel_canada: -60,
      rel_australia: -45,
      rel_japao: -50,      // as Curilas impedem tratado de paz desde 1945: tecnicamente a 2ª Guerra não acabou
      rel_coreia: -30,
      // o sócio maior que não admite ser o maior
      rel_china: 70,       // vende energia com desconto porque não há segundo comprador. Parceria com dono
      rel_norte: 60,       // munição de artilharia e soldado em troca de tecnologia. Aliança de necessidade
      rel_ira: 62,         // Shahed pelo atacado; dois sancionados dividindo fornecedor
      rel_india: 65,       // cliente de armas desde a URSS e agora comprador de petróleo. Não julga
      rel_brasil: 40,      // BRICS e fertilizante: 20% do que o agro brasileiro usa vem daqui
      rel_venezuela: 55,
      rel_arabia: 45,      // OPEP+: os dois combinam o preço e fingem que é mercado
      rel_turquia: 30,     // derruba avião russo, compra S-400, media grão. Membro da OTAN, e ainda assim
      rel_egito: 40,
      rel_indonesia: 25,
      rel_mexico: 15,
      rel_israel: 5,       // relação estragada quando o Irã virou fornecedor de drone
      rel_taiwan: -10,
      rel_paquistao: 10,
    },

    tensoes: [
      'Guerra na Ucrânia: baixas, mobilização e economia de guerra',
      'Sanções, teto de preço do petróleo e frota-fantasma',
      'Dependência crescente da China como único comprador',
      'Fuga de cérebros e colapso demográfico',
      'Facções armadas e lealdade das elites de segurança',
    ],

    estadoInicial: {
      aprovacao: 58,      // número de pesquisa em país onde responder "não" tem custo
      estabilidade: 48,
      // soft_power no chão do mapa: a invasão de 2022 queimou o que restava. Exporta gás, medo
      // e Tolstói — e só um dos três ainda funciona. Wagner virou marca melhor que a bandeira.
      soft_power: 18,
      seguranca: 45,      // ataque de drone chega a refinaria a 1.000 km da fronteira
      temp_guerra: 85,    // não é ameaça de guerra: é guerra
      temp_economia: 35,
      liberdades: 12,     // imprensa criminalizada, oposição presa, morta ou exilada
      poder_militar: 70,  // arsenal enorme, desempenho medíocre — a diferença ficou pública em 2022
      // economia (US$ trilhões)
      pib: 2.2,           // menor que o da Itália. O PIB não faz jus ao lugar na mesa
      tesouro: 0.6,       // fundo soberano + reservas líquidas; ~US$ 300 bi seguem congelados no Ocidente
      divida: 20,         // dívida/PIB baixíssima — não é virtude, é falta de quem empreste
      aliquota: 33,
      // capacidades (0–100)
      inteligencia: 75,   // SVR/GRU/FSB: a competência que sobreviveu à URSS intacta
      capacidade_ind: 58, // só o setor de defesa gira; o resto importa até rolamento
      uranio: 90,         // Rosatom domina o enriquecimento mundial — inclusive o dos reatores americanos
      territorio: 1,
      ogivas: 5500,       // o maior arsenal do planeta. É a única coisa que ninguém contesta
    },

    fiosSemente: [
      { tema: 'Guerra na Ucrânia', intensidade: 80, alvo_pressao: 'temp_guerra', atores: ['ucrania', 'eua', 'ue'] },
      { tema: 'Sanções e teto do petróleo', intensidade: 62, alvo_pressao: 'temp_economia', atores: ['ue', 'eua'] },
      { tema: 'Lealdade das elites de segurança', intensidade: 50, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Dependência do comprador chinês', intensidade: 45, alvo_pressao: 'soft_power', atores: ['china'] },
    ],
  },

  // Ordem de batalha aproximada — pós-2022, o que está OPERACIONAL, não o que está no papel.
  forcas: {
    infantaria: 1100000,
    blindados: 2000,      // milhares a mais enferrujando em depósito na Sibéria; contar aqueles é mentir
    artilharia: 4200,     // a arma que a Rússia de fato sabe usar
    helicopteros: 950,
    cacas: 1100,
    bombardeiros: 120,    // Tu-95 de 1956 ainda voando missão de verdade
    drones: 800,          // Orlan e Lancet: o que funcionou barato
    navios: 80,
    submarinos: 64,       // a força submarina segue de primeira linha; a de superfície, não
    porta_avioes: 1,      // Kuznetsov: em reforma desde 2017, pegou fogo duas vezes. Existe no papel
    misseis: 2000,
    defesa_aerea: 120,   // S-300/S-400: a rede antiaérea mais densa do planeta — e a doutrina inteira depende dela
    ogivas: 5500,
  },

  // Reaproveitadas de dados/empresas.js (chave RUS).
  empresas: [
    { id: 'gazprom', nome: 'Gazprom', setor: 'Energia', estatal: true, participacao: 50, valor: 0.09, margem: 0.12,
      petroleo: 1.5, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/11/Gazprom-Logo.svg/500px-Gazprom-Logo.svg.png',
      bonus: { pib: 0.2 },
      desc: 'O gás é a arma. O Estado tem 50,2% — o suficiente pra mandar. Fecha a torneira em janeiro e a Europa negocia de casaco.' },
    { id: 'rosneft', nome: 'Rosneft', setor: 'Energia', estatal: true, participacao: 40, valor: 0.07, margem: 0.1,
      petroleo: 4.7, logo: null, bonus: { pib: 0.18 },
      desc: 'Engoliu a Yukos depois que o dono foi preso. Maior produtora de petróleo da Rússia — e um recado sobre o que acontece com quem contraria o Kremlin.' },
    { id: 'rostec', nome: 'Rostec', setor: 'Defesa', estatal: true, participacao: 100, valor: 0.05, margem: 0.09,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Rostekh2018.jpeg', bonus: { capacidade_ind: 4 },
      desc: 'Conglomerado estatal de defesa. Do Kalashnikov ao Su-57. Oitocentas empresas sob um chapéu e um amigo do presidente no comando.' },
  ],

  equipamentos: {
    _nome: 'Rússia',
    infantaria:   { nome: 'Fuzileiro motorizado (AK-12)', fab: 'Kalashnikov', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/4/43/An_AK-15_carried_by_Russian_soldier.jpg' },
    blindados:    { nome: 'T-90M Proryv', fab: 'Uralvagonzavod', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/T-90M.jpg/330px-T-90M.jpg' },
    artilharia:   { nome: '2S19 Msta-S', fab: 'Uraltransmash', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/2S19_Msta-S_PM_MWB_09.jpg/330px-2S19_Msta-S_PM_MWB_09.jpg' },
    helicopteros: { nome: 'Ka-52 Alligator', fab: 'Kamov / Rostec', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Ka-52_at_an_air_show_in_Voronezh_2014.jpg/330px-Ka-52_at_an_air_show_in_Voronezh_2014.jpg' },
    cacas:        { nome: 'Sukhoi Su-57', fab: 'Sukhoi / UAC', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Sukhoi_Design_Bureau%2C_054%2C_Sukhoi_T-50_%28Su-57_prototype%29_%2849581303977%29.jpg/330px-Sukhoi_Design_Bureau%2C_054%2C_Sukhoi_T-50_%28Su-57_prototype%29_%2849581303977%29.jpg' },
    bombardeiros: { nome: 'Tu-160 Blackjack', fab: 'Tupolev / UAC', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Tupolev_Tu-160_overflying_Moscow_fix.jpg/330px-Tupolev_Tu-160_overflying_Moscow_fix.jpg' },
    drones:       { nome: 'Orlan-10', fab: 'STC / Rostec', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/UAV_Orlan-10.JPG/330px-UAV_Orlan-10.JPG' },
    navios:       { nome: 'Fragata Almirante Gorshkov', fab: 'Severnaya Verf', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Admiral_Gorshkov_frigate_03.jpg/330px-Admiral_Gorshkov_frigate_03.jpg' },
    // Só encontrei foto de maquete de exposição no Commons — foto real do casco, não.
    // Melhor nada do que ilustrar um submarino nuclear com miniatura de feira.
    // K-560 Severodvinsk, o primeiro da classe, atracado — foto verificada no Commons.
    submarinos:   { nome: 'Classe Yasen', fab: 'Sevmash', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/%D0%9A-560_%C2%AB%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BE%D0%B4%D0%B2%D0%B8%D0%BD%D1%81%D0%BA%C2%BB.jpg/330px-%D0%9A-560_%C2%AB%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BE%D0%B4%D0%B2%D0%B8%D0%BD%D1%81%D0%BA%C2%BB.jpg' },
    porta_avioes: { nome: 'Almirante Kuznetsov', fab: 'Nikolayev South', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Admiral_Kuznetsov_aircraft_carrier.jpg/330px-Admiral_Kuznetsov_aircraft_carrier.jpg' },
    misseis:      { nome: 'Iskander-M', fab: 'KBM', origem: 'RUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Army2016demo-075.jpg/330px-Army2016demo-075.jpg' },
  },
};
