// FICHA DO MUNDO — Ucrânia, era 2026.
// Segue o molde de eua-2026.js. Valores aproximados; a guerra move tudo depressa.
//
// AVISO DE TOM: esta é a única ficha do jogo em que a guerra não é hipótese. O cinismo
// aqui é com os governos e com os incentivos — nunca com quem está debaixo das bombas.
//
// Líder FICTÍCIO (regra do projeto: o jogo tem missões de assassinato e não modelamos
// violência contra pessoas reais).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_UKR = {
  ficha: {
    ano: 2026,
    pais: 'Ucrânia',
    iso: 'UKR',
    presidente: 'Ostap Voloshyn',   // fictício
    capital: 'Kiev',
    bandeira: '🌻',
    pino: { lat: 50.45, lng: 30.52 },

    resumo: `Estado em guerra existencial desde 2022, sustentado por ajuda externa que chega
em parcelas e sempre com atraso. Economia de US$ 180 bilhões operando em modo de guerra:
orçamento militar maior que a arrecadação, o resto financiado por Bruxelas e Washington.
Perdeu território no leste e no sul. Ganhou, em compensação, a doutrina de drones mais
avançada do planeta — inventada por necessidade, copiada agora por todo mundo. Soft power
altíssimo: é o país mais apoiado retoricamente e o mais mal financiado na prática.
Zero ogivas — por escolha própria, em 1994. Ver estadoInicial.ogivas.`,

    // Relações do PONTO DE VISTA da Ucrânia. Sem rel_ucrania (o país não se relaciona consigo).
    relacoes: {
      rel_russia: -100,     // não é "tensão diplomática", é invasão em curso. O piso da escala.
      rel_norte: -75,       // fornece munição de artilharia e homens para o outro lado
      rel_ira: -70,         // os Shahed que caem em Kiev saem de projeto iraniano
      rel_china: -25,       // não condena a invasão e compra o petróleo que a financia
      rel_eua: 70,          // maior doador militar — e o que pode virar a chave a qualquer eleição
      rel_ue: 85,           // candidata à adesão; a UE virou o financiador de última instância
      rel_reino: 88,        // primeiro a mandar tanque pesado, e o mais barulhento no apoio
      rel_canada: 80,       // 1,3 milhão de descendentes de ucranianos votam lá
      rel_australia: 60,
      rel_japao: 65,        // dinheiro e reconstrução, sem armas letais (a Constituição não deixa)
      rel_coreia: 45,       // vende obus para a Polônia, que repassa. Todo mundo finge que não vê.
      rel_turquia: 55,      // vende os Bayraktar E mantém o Bósforo aberto para os russos. Ambos.
      rel_israel: 15,       // recusou sistemas antiaéreos para não irritar Moscou na Síria
      rel_arabia: 20,
      rel_india: -5,        // "não-alinhamento" que na prática refina o cru russo
      rel_brasil: 5,        // ofereceu mediação; para Kiev, mediar é legitimar
      rel_taiwan: 40,       // solidariedade entre quem tem vizinho grande demais
      rel_mexico: 10,
      rel_paquistao: 25,    // vendeu munição de 155mm discretamente, e negou
      rel_venezuela: -40,
      rel_indonesia: 10,
      rel_egito: 5,
    },

    tensoes: [
      'Guerra de atrito com a Rússia; linha de frente estática e cara',
      'Dependência total de ajuda externa que depende de eleições alheias',
      'Ataques sistemáticos à rede elétrica e à infraestrutura civil',
      'Mobilização e desgaste demográfico',
      'Adesão à UE e à OTAN travada enquanto a guerra durar',
    ],

    estadoInicial: {
      aprovacao: 62,        // apoio real à resistência, corroído pelo cansaço de anos
      estabilidade: 35,     // o Estado funciona, mas sob apagão e alarme aéreo
      soft_power: 70,       // a maior vitória diplomática da década — e não paga a conta
      seguranca: 18,        // não há retaguarda: míssil chega em Lviv como chega em Kiev
      temp_guerra: 95,      // guerra total. Não dá pra subir muito mais.
      temp_economia: 22,    // economia de guerra: funciona porque alguém de fora paga
      liberdades: 45,       // democracia sob lei marcial: eleições suspensas, imprensa restrita
      poder_militar: 58,    // veterana, criativa e cronicamente sem munição
      // economia (US$ trilhões)
      pib: 0.18,            // ~US$ 180 bi. Era 0.2 antes de 2022 e chegou a cair um terço em um ano.
      tesouro: 0.01,        // praticamente zero: o caixa é a próxima parcela do FMI/UE
      divida: 92,           // dívida/PIB ~92% e subindo — ninguém cobra de país invadido, por ora
      aliquota: 20,
      // capacidades (0–100)
      inteligencia: 72,     // a HUR opera fundo dentro da Rússia; é o ativo mais subestimado da ficha
      capacidade_ind: 40,   // monta drone em garagem por milhares; blindado pesado, nenhum
      uranio: 25,           // tem minério e engenheiros. Não tem programa — ver ogivas.
      territorio: 1,
      // O FATO MAIS AMARGO DA FICHA:
      // Em 1994 a Ucrânia tinha o 3º maior arsenal nuclear do mundo — cerca de 1.900 ogivas
      // herdadas da URSS. Devolveu TODAS a Moscou no Memorando de Budapeste, em troca de
      // garantias escritas de integridade territorial assinadas por Rússia, EUA e Reino Unido.
      // Um dos garantidores invadiu. Os outros dois mandaram ajuda em parcelas.
      // O documento não tinha cláusula de execução. Nunca teve.
      ogivas: 0,
    },

    fiosSemente: [
      { tema: 'Ofensiva russa de atrito no leste', intensidade: 92, alvo_pressao: 'seguranca', atores: ['russia'] },
      { tema: 'Parcela de ajuda travada no Congresso aliado', intensidade: 70, alvo_pressao: 'temp_economia', atores: ['eua', 'ue'] },
      { tema: 'Rede elétrica sob ataque sistemático', intensidade: 65, alvo_pressao: 'estabilidade', atores: ['russia'] },
      { tema: 'Desgaste da mobilização e do efetivo', intensidade: 58, alvo_pressao: 'aprovacao', atores: [] },
    ],
  },

  // ORDEM DE BATALHA (aproximada).
  // Por que 800 mil de infantaria e só 70 caças? Porque é isso que a doutrina permite.
  // Homem se mobiliza por decreto; caça de 4ª geração leva uma década e um aliado disposto.
  // E por que 5.000 drones? Porque o drone é o que a Ucrânia CONSEGUE fabricar sozinha, hoje,
  // aos milhares, sem pedir licença a ninguém. Foi a resposta ao que ela não tem: aviação,
  // artilharia de longo alcance e munição. A doutrina de drones desta guerra nasceu aqui,
  // por falta de alternativa — e o mundo inteiro está copiando.
  forcas: {
    infantaria: 800000,
    blindados: 1000,      // mix soviético (T-64/T-72) + Leopard e Abrams doados em lotes pequenos
    artilharia: 1800,     // calibre OTAN e soviético convivendo: pesadelo logístico permanente
    helicopteros: 90,     // frota Mi soviética, desgastada e sem peça de reposição de origem
    cacas: 70,            // MiG-29/Su-27 remendados; F-16 chegando a conta-gotas
    bombardeiros: 12,     // Su-24 adaptados às pressas para míssil de cruzeiro ocidental
    drones: 5000,         // a arma nacional. Ver comentário acima.
    navios: 10,           // frota de superfície praticamente extinta em 2022
    submarinos: 0,        // o único sub foi tomado na anexação da Crimeia em 2014
    porta_avioes: 0,      // vendeu o casco inacabado à China nos anos 1990. Virou o Liaoning.
    misseis: 300,         // Neptune nacional + doados, sempre com restrição de alcance do doador
    defesa_aerea: 25,    // Patriot, IRIS-T e NASAMS doados sobre um esqueleto S-300 soviético; cada tiro é contado
    ogivas: 0,
  },

  empresas: [
    { id: 'naftogaz', nome: 'Naftogaz', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.01, margem: 0.02, petroleo: 0.05, logo: null,
      bonus: { pib: 0.03, estabilidade: 2 },
      desc: 'Foi o maior negócio do país e a maior fonte de corrupção dele, nessa ordem. Hoje é a empresa que tenta manter aquecimento em cidade bombardeada no inverno. O gasoduto que enriqueceu meia elite dos anos 90 hoje é alvo militar.' },
    { id: 'ukroboronprom', nome: 'Ukroboronprom', sigla: 'UOP', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.008, margem: 0.03, logo: null,
      bonus: { capacidade_ind: 5, poder_militar: 3 },
      desc: 'Herdou um terço do complexo militar soviético e passou vinte anos vendendo o acervo em vez de modernizá-lo. Reorganizada na marra depois de 2022. Agora produz drone e Neptune — o que sobrou depois que as fábricas grandes viraram alvo.' },
    { id: 'energoatom', nome: 'Energoatom', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.012, margem: 0.04, logo: null,
      bonus: { pib: 0.04, capacidade_ind: 3 },
      desc: 'Mais da metade da eletricidade do país sai de reatores. Um deles, Zaporizhzhia, é o maior da Europa e está ocupado por tropa estrangeira desde 2022 — a primeira vez na história que uma usina nuclear vira posição de combate.' },
    { id: 'ukrzaliznytsia', nome: 'Ukrzaliznytsia', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.006, margem: -0.01, logo: null,
      bonus: { estabilidade: 4, aprovacao: 3 },
      desc: 'A ferrovia nunca parou de circular, nem no primeiro dia da invasão. Sem aeroporto civil operando, é assim que entra visita de Estado, sai gente e chega carga. Dá prejuízo e é infraestrutura crítica de guerra. Vender é impensável.' },
    { id: 'privatbank', nome: 'PrivatBank', setor: 'Financeiro', estatal: true, participacao: 100,
      valor: 0.009, margem: 0.06, logo: null,
      bonus: { temp_economia: 3, estabilidade: 2 },
      desc: 'Nacionalizado em 2016 com um rombo de US$ 5,5 bilhões que os donos anteriores negam até hoje. O contribuinte pagou a conta e ficou com o banco. É o maior do país e o litígio ainda corre em Londres.' },
  ],

  equipamentos: {
    _nome: 'Ucrânia',
    blindados:    { nome: 'T-64BV',              fab: 'Fábrica Malyshev',      origem: 'UKR', proprio: true,
      foto: `${W}/d/d3/NGU_T-64BV_MBT.jpg/330px-NGU_T-64BV_MBT.jpg` },
    cacas:        { nome: 'MiG-29',              fab: 'Mikoyan (herdado da URSS)', origem: 'RUS', proprio: false,
      foto: `${W}/0/03/Ukrainian_Falcons_Mig-29.jpg/330px-Ukrainian_Falcons_Mig-29.jpg` },
    // Ironia da ficha: o caça de linha da Ucrânia é russo, herdado, e sem peça original desde 2014.
    drones:       { nome: 'Bayraktar TB2',       fab: 'Baykar',                origem: 'TUR', proprio: false,
      foto: `${W}/d/da/BayraktarTB2_Teknofest2019_%282%29.jpg/330px-BayraktarTB2_Teknofest2019_%282%29.jpg` },
    misseis:      { nome: 'R-360 Neptune',       fab: 'Luch',                  origem: 'UKR', proprio: true,
      foto: `${W}/6/69/Neptune_R-360_missile%2C_Kyiv_2021%2C_01.jpg/330px-Neptune_R-360_missile%2C_Kyiv_2021%2C_01.jpg` },
    artilharia:   { nome: 'M777',                fab: 'BAE Systems',           origem: 'USA', proprio: false,
      foto: `${W}/7/78/UA_148th_bde_M777_howitzer_01.jpg/330px-UA_148th_bde_M777_howitzer_01.jpg` },
    helicopteros: { nome: 'Mi-24',               fab: 'Mil (herdado da URSS)', origem: 'RUS', proprio: false,
      foto: `${W}/0/04/Ukrainian_Helicopter_MI-24_%2826106002854%29.jpg/330px-Ukrainian_Helicopter_MI-24_%2826106002854%29.jpg` },
    bombardeiros: { nome: 'Su-24M',              fab: 'Sukhoi (herdado da URSS)', origem: 'RUS', proprio: false,
      foto: `${W}/6/69/Ukrainian_Air_Force_Sukhoi_Su-24M_at_Starokonstantinov.jpg/330px-Ukrainian_Air_Force_Sukhoi_Su-24M_at_Starokonstantinov.jpg` },
    navios:       { nome: 'Drone naval Magura V5', fab: 'GUR / indústria local', origem: 'UKR', proprio: true,
      foto: null, sugerido: true },
    // Sem foto verificada: o Magura é recente e as imagens em circulação são de origem oficial
    // não confirmada no Commons. Regra do projeto: não se inventa URL.
    submarinos:   { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
    porta_avioes: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
  },
};
