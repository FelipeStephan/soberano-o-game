// FICHA DO MUNDO — Irã, era 2026.
//
// NOTA DE MÉTODO: o Irã é um Estado, não uma caricatura. A ficha modela o que a
// República Islâmica PODE fazer e o que lhe custa — não a religião de 90 milhões de
// pessoas nem a cultura persa. A população iraniana é jovem, escolarizada e, em boa
// parte, adversária do próprio governo; isso é um FATO ESTRUTURAL do país e está
// codificado abaixo (estabilidade baixa, liberdades baixas), não uma torcida.
//
// Líder FICTÍCIO por regra de projeto.
import { FOTO_UNIDADE } from '../imagens.js';

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_IRN = {
  ficha: {
    forcasIniciais: null,
    ano: 2026,
    pais: 'Irã',
    iso: 'IRN',
    presidente: 'Ayatollah Mahdi Sarrafi', // FICTÍCIO. Cargo: Líder Supremo.
    cargo: 'Líder Supremo',
    capital: 'Teerã',
    bandeira: '🕌',
    pino: { lat: 35.69, lng: 51.39 },

    resumo: `Noventa milhões de habitantes sobre a terceira maior reserva de petróleo e a segunda de gás
do planeta — e uma economia do tamanho da do Chile, porque quatro décadas de sanções fizeram
exatamente o que prometeram. O rial perdeu mais de 99% do valor desde 1979. O poder real não está no
presidente eleito: está no Líder Supremo e na Guarda Revolucionária, que é ao mesmo tempo exército
paralelo, holding econômica e polícia política. A doutrina militar é assimétrica por necessidade —
a força aérea é do tempo do Xá, então o país construiu o maior arsenal de mísseis balísticos do
Oriente Médio e uma rede de milícias aliadas do Líbano ao Iêmen. Enriquece urânio a 60%, a um passo
técnico do grau militar, e usa exatamente esse passo como moeda de troca. Senta sobre o Estreito de
Ormuz, por onde passa um quinto do petróleo do mundo, e nunca deixa ninguém esquecer disso.`,

    // -100..+100, do ponto de vista de Teerã. Sem rel_ira (é o próprio país).
    relacoes: {
      rel_eua: -90,        // desde 1979, e a conta é longa dos dois lados: 1953, 1988, 2020
      rel_china: 65,       // acordo de 25 anos e o único comprador do petróleo sancionado — com desconto
      rel_russia: 60,      // parceria de conveniência: Shahed pra Ucrânia, Su-35 prometido há anos
      rel_brasil: 35,      // navios iranianos atracaram no Rio em 2023; comércio de carne e milho
      rel_israel: -95,     // o adversário existencial declarado
      rel_taiwan: 0,
      rel_arabia: -30,     // reataram em 2023 com mediação chinesa; a rivalidade não foi a lugar nenhum
      rel_ue: -45,         // o acordo nuclear de 2015 morreu e levou junto a última ponte
      rel_reino: -55,
      rel_ucrania: -50,    // vender drone pro lado que invade não sai do currículo
      rel_india: 30,       // Chabahar: o porto que dá à Índia acesso à Ásia Central sem passar pelo Paquistão
      rel_japao: 10,
      rel_coreia: -5,
      rel_norte: 45,       // cooperação de míssil que ninguém dos dois lados confirma
      rel_mexico: 5,
      rel_canada: -60,     // relações rompidas desde 2012
      rel_australia: -30,
      rel_turquia: 15,     // vizinho, comércio de gás, e rivais em cada tabuleiro do Cáucaso ao Levante
      rel_paquistao: 20,   // trocaram mísseis na fronteira em 2024 e voltaram a conversar na semana seguinte
      rel_venezuela: 60,   // dois sancionados trocando gasolina por ouro. Solidariedade de pária
      rel_indonesia: 25,
      rel_egito: 5,        // relações congeladas desde 1980; reaproximação lenta e sem embaixador
    },

    tensoes: [
      'Programa nuclear: enriquecimento a 60% e a ameaça permanente de ataque preventivo',
      'Sanções e o colapso do rial: inflação de três dígitos e fuga de cérebros',
      'Descontentamento interno e a legitimidade do regime perante a própria juventude',
      'Rede de milícias aliadas e o custo de mantê-la',
      'Estreito de Ormuz como alavanca — e como convite a intervenção',
    ],

    estadoInicial: {
      aprovacao: 30,      // eleições com comparecimento em mínimas históricas dizem o bastante
      estabilidade: 35,   // 2009, 2017, 2019, 2022: o turno de protesto e repressão não fecha
      soft_power: 20,     // influência real via milícias, quase nenhuma via atração
      seguranca: 45,      // aparato de segurança enorme e espaço aéreo que não se defende sozinho
      temp_guerra: 70,
      temp_economia: 25,  // inflação alta e crônica, moeda em queda livre, petróleo vendido com deságio
      liberdades: 15,     // imprensa sob controle estatal, Conselho de Guardiões vetando candidatura,
                          // polícia da moralidade, execuções em número entre os maiores do mundo.
                          // O número é baixo porque a descrição é institucional — não é opinião
                          // sobre iranianos, é o desenho do regime
      poder_militar: 48,  // massa e mísseis; qualidade de frota aérea de museu
      // economia (US$ trilhões)
      pib: 0.40,          // ~US$ 400 bi nominais. Por PPC seria o triplo — as sanções vivem no câmbio
      tesouro: 0.03,      // reservas acessíveis são uma fração do declarado: boa parte está congelada
      divida: 35,         // dívida externa baixa — ninguém empresta pra você mesmo
      aliquota: 8,        // arrecadação fraca; o Estado vive de petróleo e de fundações religiosas
      // capacidades (0–100)
      inteligencia: 60,   // VEVAK e a inteligência da Guarda são competentes em casa e no exterior —
                          // e foram penetrados de forma humilhante nos últimos anos
      capacidade_ind: 52, // sob embargo desde 1979, o país aprendeu a fabricar quase tudo mal e barato.
                          // O Shahed-136 custa ~US$ 20 mil e mudou a economia da guerra moderna
      uranio: 85,         // O PONTO DO PAÍS. Estoque de urânio enriquecido a 60% — nível que só faz
                          // sentido se o próximo degrau for 90% (grau militar). Fordow está enterrada
                          // sob 80 m de montanha justamente pra sobreviver a bombardeio. É a maior
                          // capacidade nuclear NÃO-armada do planeta, e é deliberado: manter-se a
                          // semanas da bomba dá quase toda a dissuasão sem pagar o preço de tê-la
      // poder territorial / arsenal
      territorio: 1,
      ogivas: 0,          // ZERO, e é intencional na ficha: o Irã não tem arma nuclear montada.
                          // A AIEA nunca confirmou desvio pra arma; a fatwa de 2003 contra armas
                          // nucleares é doutrina oficial declarada. O regime opera na condição de
                          // "limiar": urânio 85 + ogivas 0 é a posição estratégica exata, e a
                          // tensão do jogo mora nesse par de números
    },

    fiosSemente: [
      { tema: 'Corrida ao limiar nuclear', intensidade: 80, alvo_pressao: 'uranio', atores: ['israel', 'eua'] },
      { tema: 'Economia estrangulada por sanções', intensidade: 72, alvo_pressao: 'temp_economia', atores: ['eua', 'ue'] },
      { tema: 'Legitimidade do regime perante a própria população', intensidade: 65, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Ormuz como alavanca e como risco', intensidade: 58, alvo_pressao: 'seguranca', atores: ['eua', 'arabia'] },
    ],
  },

  // ── ORDEM DE BATALHA ───────────────────────────────────────────────────
  // ~600 mil ativos (Exército + Guarda Revolucionária, que é uma força paralela e maior
  // em prestígio). Massa enorme, qualidade irregular. A frota aérea é uma peça de museu
  // voadora: F-14 Tomcat comprados pelo Xá nos anos 1970 e mantidos vivos com peça
  // canibalizada e engenharia reversa há meio século. Por isso a doutrina é míssil, não avião.
  forcas: {
    infantaria: 600000,
    blindados: 1500,      // muitos T-72 e Chieftain do Xá; o "Karrar" é um T-72 reformado com boa foto
    artilharia: 2000,
    helicopteros: 100,
    cacas: 150,           // F-14/F-4/F-5 da era do Xá + MiG-29 e Su-24 herdados/comprados
    bombardeiros: 0,
    drones: 500,          // aqui o país é competitivo de verdade, e o mundo inteiro descobriu isso
    navios: 70,           // muita lancha rápida: a doutrina é enxame em água rasa, não frota de linha
    submarinos: 19,       // na maioria mini-subs classe Ghadir, projetados pra Golfo raso. 3 Kilo russos
    porta_avioes: 0,
    misseis: 3000,        // O CORAÇÃO DA DOUTRINA: sem força aérea utilizável, o país transferiu todo
    defesa_aerea: 30,    // Bavar-373 nacional e S-300PMU2: o que sobrou depois de décadas de embargo
                          // o poder de fogo pra mísseis balísticos e de cruzeiro. Maior arsenal do
                          // Oriente Médio. É a resposta racional de quem não pode ganhar no ar
    ogivas: 0,
  },

  // ── ESTATAIS ───────────────────────────────────────────────────────────
  // Reaproveita a NIOC de dados/empresas.js e expande. Petróleo coerente com
  // dados/petroleo.js: IRN produz 3,4 Mb/d, consome 1,9, custo US$ 9/barril.
  empresas: [
    { id: 'nioc', nome: 'NIOC', setor: 'Energia', estatal: true, participacao: 100, valor: 0.06, margem: 0.09,
      petroleo: 3.4, logo: null, bonus: { pib: 0.12 },
      desc: 'Nacionalizada em 1951 — e o golpe que derrubou Mossadegh no ano seguinte foi por causa disso. Sancionada até a medula e ainda bombeando.' },
    { id: 'nigc', nome: 'National Iranian Gas Company', sigla: 'NIGC', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.03, margem: 0.05, logo: null, bonus: { pib: 0.07 },
      desc: 'Segunda maior reserva de gás do planeta, dividida com o Catar no mesmo campo submarino. O Catar exporta LNG e ficou rico; o Irã não tem a tecnologia de liquefação porque ela é americana. O gás está ali e não sai.' },
    { id: 'khatam', nome: 'Khatam al-Anbiya', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.02, margem: 0.07, logo: null, bonus: { capacidade_ind: 3, estabilidade: -1 },
      desc: 'A empreiteira da Guarda Revolucionária. Ganha licitação de duto, metrô e barragem sem concorrente — porque o concorrente entendeu o recado. Um exército que também é a maior construtora do país não é uma anomalia: é o modelo.' },
    { id: 'dio', nome: 'Defense Industries Organization', sigla: 'DIO', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.01, margem: 0.06, logo: null, bonus: { capacidade_ind: 4 },
      desc: 'Fabrica de munição a míssil balístico sob embargo total desde 1979. Engenharia reversa como política industrial: o que não se compra, se copia. Funciona pior que o original e custa um décimo.' },
    { id: 'hesa', nome: 'HESA', setor: 'Aeroespacial', estatal: true, participacao: 100,
      valor: 0.005, margem: 0.09, logo: null, bonus: { capacidade_ind: 3 },
      desc: 'Faz o Shahed-136, o drone descartável de US$ 20 mil que obriga o inimigo a gastar um interceptador de US$ 500 mil. É a única equação econômica que o Irã venceu em quarenta anos.' },
    { id: 'imidro', nome: 'IMIDRO', setor: 'Mineração', estatal: true, participacao: 100,
      valor: 0.02, margem: 0.06, logo: null, bonus: { capacidade_ind: 2, pib: 0.04 },
      desc: 'Holding estatal de mineração: cobre, aço, alumínio e o urânio de Saghand. O subsolo é bom. O comprador é que é escasso.' },
  ],

  // ── EQUIPAMENTO ────────────────────────────────────────────────────────
  equipamentos: {
    _nome: 'Irã',
    drones:       { nome: 'Shahed-136',      fab: 'HESA',                  origem: 'IRN', proprio: true,
      foto: `${W}/3/37/2023_IRGC_Aerospace_Force_achievements_Exhibition_in_Qom_%2833%29.jpg/330px-2023_IRGC_Aerospace_Force_achievements_Exhibition_in_Qom_%2833%29.jpg` },
    misseis:      { nome: 'Fateh-110',       fab: 'Ind. de Defesa do Irã', origem: 'IRN', proprio: true,
      foto: `${W}/a/a2/Fateh-110_Missile_by_YPA.IR_02.jpg/330px-Fateh-110_Missile_by_YPA.IR_02.jpg` },
    cacas:        { nome: 'F-14A Tomcat',    fab: 'Grumman (era do Xá)',   origem: 'USA', proprio: false,
      foto: `${W}/3/3e/Irani_F-14_Tomcats_carrying_AIM-54_Phoenixs.jpg/330px-Irani_F-14_Tomcats_carrying_AIM-54_Phoenixs.jpg` },
    submarinos:   { nome: 'Classe Ghadir',   fab: 'Ind. Naval do Irã',     origem: 'IRN', proprio: true,
      foto: `${W}/8/86/2012_Bandar_Abbas_new_equipment_induction_ceremony_-_Ghadir-class_submarine_%2814%29.jpg/330px-2012_Bandar_Abbas_new_equipment_induction_ceremony_-_Ghadir-class_submarine_%2814%29.jpg` },
    blindados:    { nome: 'Karrar',          fab: 'DIO',                   origem: 'IRN', proprio: true,
      foto: FOTO_UNIDADE.blindados, sugerido: true },
    navios:       { nome: 'Fragata Moudge',  fab: 'Ind. Naval do Irã',     origem: 'IRN', proprio: true,
      foto: FOTO_UNIDADE.navios, sugerido: true },
    artilharia:   { nome: 'HM41 / Fajr-5',   fab: 'DIO',                   origem: 'IRN', proprio: true,
      foto: FOTO_UNIDADE.artilharia, sugerido: true },
  },
};

PAIS_IRN.ficha.forcasIniciais = PAIS_IRN.forcas;
