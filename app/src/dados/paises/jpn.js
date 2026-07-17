// FICHA DO MUNDO — Japão, era 2026. Mesmo esquema do FICHA_EUA_2026.
// Líder FICTÍCIO por regra do projeto (o jogo tem missões de assassinato).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_JPN = {
  ficha: {
    ano: 2026,
    pais: 'Japão',
    iso: 'JPN',
    presidente: 'Primeiro-Ministro Kenji Arakawa', // FICTÍCIO
    capital: 'Tóquio',
    pino: { lat: 35.68, lng: 139.69 },

    resumo: `Quarta economia do mundo, dívida de 255% do PIB — a maior do planeta, folgada — e
mesmo assim o país mais previsível da Ásia. Passou trinta anos em deflação e acaba de descobrir
a inflação de novo, o que teoricamente é bom e na prática assusta um povo que envelhece:
morrem mais japoneses por ano do que nascem, e a diferença passa de meio milhão. A Constituição
de 1947, escrita por americanos, renuncia à guerra no Artigo 9 — e o país tem quatro
"contratorpedeiros porta-helicópteros" que operam F-35B, o que é um porta-aviões com um nome
comprido o suficiente para não violar o artigo. Rearmando pela primeira vez desde a rendição:
prometeu 2% do PIB em defesa e mísseis de contra-ataque. Tem plutônio separado suficiente para
milhares de ogivas e nenhuma ogiva. É o único país que já apanhou de bomba atômica, e isso
ainda decide eleição.`,

    relacoes: {
      // O país é o Japão — por isso não há rel_japao aqui.
      rel_eua: 82,        // Tratado de 1960: 54 mil soldados americanos, e Okinawa detesta cada um
      rel_china: -35,     // Senkaku, e o maior parceiro comercial ao mesmo tempo. É insustentável e dura décadas
      rel_russia: -55,    // as Curilas: tecnicamente ainda não assinaram a paz da Segunda Guerra
      rel_ira: 10,        // compra petróleo e não briga. Tóquio já mediou entre Teerã e Washington
      rel_brasil: 45,     // a maior diáspora japonesa do mundo mora em São Paulo, e ela volta pra trabalhar
      rel_israel: 20,
      rel_taiwan: 45,     // sem relação oficial, e as ilhas japonesas mais ao sul ficam a 110 km de lá
      rel_arabia: 50,     // 90% do petróleo japonês vem do Golfo. Isso não é diplomacia, é sobrevivência
      rel_ue: 55,
      rel_reino: 60,      // o GCAP: o caça de sexta geração, com Londres e Roma. A primeira parceria militar séria fora dos EUA
      rel_ucrania: 45,
      rel_india: 60,      // Quad
      // A RELAÇÃO MAIS ESTRANHA DA LISTA: Japão e Coreia do Sul são os dois maiores aliados
      // dos EUA na Ásia, dividem o mesmo inimigo, trocam bilhões em comércio — e não se suportam.
      // Mulheres de conforto, trabalho forçado, os livros didáticos, as rochas de Dokdo/Takeshima.
      // Washington passa metade do tempo obrigando os dois a sentarem na mesma sala. Por isso 22
      // e não 70: aliados por necessidade americana, não por afeto.
      rel_coreia: 22,
      rel_norte: -75,     // sequestrou cidadãos japoneses nos anos 70 e joga míssil por cima de Hokkaido
      rel_mexico: 30,
      rel_canada: 45,
      rel_australia: 65,  // Quad, e o fornecedor de gás que mantém a luz acesa
      rel_turquia: 25,
      rel_paquistao: 15,
      rel_venezuela: 0,
      rel_indonesia: 50,
      rel_egito: 25,
    },

    tensoes: [
      'Demografia: o país encolhe meio milhão de pessoas por ano',
      'Dívida de 255% do PIB e o Banco do Japão dono de metade dela',
      'China nas Senkaku e o cenário Taiwan a 110 km de Yonaguni',
      'Coreia do Norte lançando míssil por cima do arquipélago',
      'Rearmamento contra o Artigo 9 e o pacifismo de setenta anos',
    ],

    estadoInicial: {
      aprovacao: 36,
      // POR QUE estabilidade 72 com a maior dívida do mundo: porque a dívida é DOMÉSTICA.
      // Mais de 90% dos títulos estão em mãos japonesas — Banco do Japão, bancos, fundos de
      // pensão, o próprio poupador. O país deve para si mesmo, na sua moeda, que ele imprime.
      // Não existe credor estrangeiro para forçar calote, não existe corrida cambial. É frágil
      // no papel e sólido na rua: o Japão é o maior credor líquido do planeta, com mais de
      // US$ 3 tri em ativos externos. Grécia devia para fora e quebrou; Japão deve para dentro
      // e financia o mundo.
      estabilidade: 72,
      soft_power: 80,      // anime, games, comida, e a reputação de que tudo funciona
      seguranca: 58,
      temp_guerra: 40,     // três vizinhos armados e nenhum amigo
      temp_economia: 42,
      liberdades: 76,
      poder_militar: 58,   // tecnicamente excelente, doutrinariamente amarrado pelo Artigo 9
      pib: 4.1,
      tesouro: 1.2,        // reservas cambiais de US$ 1,2 tri — as segundas maiores do mundo
      divida: 255,         // a maior do planeta. Ver a nota da estabilidade acima
      aliquota: 34,
      inteligencia: 50,    // não tem serviço de espionagem externa de verdade. Herança do pós-guerra
      capacidade_ind: 80,  // robótica, máquina-ferramenta, materiais. Metade do mundo depende disso
      // uranio 55: não minera nada, mas tem ~45 toneladas de plutônio separado e a usina de
      // Rokkasho. Capacidade latente: dizem que faria a bomba em meses. Nunca testaram a tese.
      uranio: 55,
      territorio: 1,
      ogivas: 0,           // os Três Princípios Não-Nucleares. E Hiroshima como argumento final
    },

    fiosSemente: [
      { tema: 'Colapso demográfico e falta de mão de obra', intensidade: 62, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Pressão chinesa nas Senkaku', intensidade: 55, alvo_pressao: 'seguranca', atores: ['china', 'taiwan'] },
      { tema: 'Mísseis norte-coreanos sobre o arquipélago', intensidade: 50, alvo_pressao: 'temp_guerra', atores: ['norte'] },
      { tema: 'Rearmamento contra o pacifismo do Artigo 9', intensidade: 45, alvo_pressao: 'estabilidade', atores: ['eua'] },
    ],
  },

  // Os 4 "porta-helicópteros" (Izumo, Kaga, Hyuga, Ise) entram como porta_avioes: os dois
  // primeiros já operam F-35B depois da reforma do convés. Chamar de contratorpedeiro é
  // ficção jurídica para não acordar o Artigo 9 — e todo mundo, inclusive Pequim, sabe disso.
  forcas: {
    infantaria: 250000,
    blindados: 600,
    artilharia: 400,
    helicopteros: 350,
    cacas: 330,
    bombardeiros: 0,     // proibido por doutrina: arma "ofensiva" não passa no Artigo 9
    drones: 15,
    navios: 50,
    submarinos: 22,      // diesel-elétricos e silenciosos. A maior frota convencional da região
    porta_avioes: 4,
    misseis: 100,
    defesa_aerea: 30,    // Patriot PAC-3 em terra e Aegis no mar — calibrado para míssil norte-coreano
    ogivas: 0,
  },

  empresas: [
    { id: 'mhi', nome: 'Mitsubishi Heavy', setor: 'Industrial', estatal: false, participacao: 4, valor: 0.03, margem: 0.06,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Marunouchi_Nij%C5%ABbashi_Building.jpg',
      bonus: { capacidade_ind: 3 },
      desc: 'Do Type 10 aos reatores de Fukushima. A espinha industrial do Japão — e a mesma empresa que fez o Zero na guerra.' },
    { id: 'ntt', nome: 'NTT', setor: 'Tecnologia', estatal: true, participacao: 33, valor: 0.1, margem: 0.07,
      logo: null, bonus: { soft_power: 1, inteligencia: 2 },
      desc: 'A lei obriga o Estado a manter no mínimo um terço das ações — está escrito, não é acidente. Dona da espinha dorsal da internet japonesa. Privatizada em 1985 e nunca solta de verdade.' },
    { id: 'jpost', nome: 'Japan Post Holdings', setor: 'Financeiro', estatal: true, participacao: 33, valor: 0.06, margem: 0.03,
      logo: null, bonus: { estabilidade: 2, temp_economia: 2 },
      desc: 'Correio e banco no mesmo balcão, com uns 2 trilhões de dólares em depósitos de aposentado. Boa parte disso volta como título do governo — é o vovô japonês financiando a dívida de 255% sem saber que é o credor.' },
    { id: 'jbic', nome: 'JBIC', setor: 'Financeiro', estatal: true, participacao: 100, valor: 0.03, margem: 0.03,
      logo: null, bonus: { capacidade_ind: 2, soft_power: 2 },
      desc: 'Banco estatal que financia empresa japonesa no exterior. Se há uma usina, um porto ou uma ferrovia japonesa em algum lugar do Sudeste Asiático, o dinheiro saiu daqui — é política externa com planilha em vez de canhão.' },
    { id: 'jogmec', nome: 'JOGMEC', setor: 'Energia', estatal: true, participacao: 100, valor: 0.02, margem: 0.02,
      petroleo: 0.4, logo: null, bonus: { seguranca: 3, pib: 0.04 },
      desc: 'Estatal criada para uma coisa só: garantir que a ilha sem petróleo, sem gás e sem terras raras nunca fique sem. Mantém a reserva estratégica e compra participação em poço alheio. O trauma de 1941 — quando o embargo de petróleo americano precipitou Pearl Harbor — virou uma agência com orçamento.' },
  ],

  equipamentos: {
    _nome: 'Japão',
    blindados:    { nome: 'Type 10',            fab: 'Mitsubishi Heavy',      origem: 'JPN', proprio: true,
      foto: `${W}/7/76/Type10MBT.jpg/330px-Type10MBT.jpg` },
    porta_avioes: { nome: 'Classe Izumo',       fab: 'JMU',                   origem: 'JPN', proprio: true,
      foto: `${W}/2/23/JS_Izumo%EF%BC%88DDH-183%EF%BC%89seen_from_the_sky_10-03-2021.jpg/330px-JS_Izumo%EF%BC%88DDH-183%EF%BC%89seen_from_the_sky_10-03-2021.jpg` },
    navios:       { nome: 'Destróier Classe Maya', fab: 'Japan Marine United', origem: 'JPN', proprio: true,
      foto: `${W}/1/10/JS_Maya_%28DDG-179%29.jpg/330px-JS_Maya_%28DDG-179%29.jpg` },
    submarinos:   { nome: 'Classe Sōryū',       fab: 'Mitsubishi / Kawasaki', origem: 'JPN', proprio: true,
      foto: `${W}/b/b0/JMSDF-S%C5%8Dry%C5%AB-class_submarine_in_Kure_Naval_Base-3.jpg/330px-JMSDF-S%C5%8Dry%C5%AB-class_submarine_in_Kure_Naval_Base-3.jpg` },
    cacas:        { nome: 'Mitsubishi F-15J',   fab: 'Mitsubishi / Boeing',   origem: 'USA', proprio: 'licenca',
      foto: `${W}/d/df/20181208_Mitsubishi_F-15J_takeoff_Naha_Air_Show_2018-7.jpg/330px-20181208_Mitsubishi_F-15J_takeoff_Naha_Air_Show_2018-7.jpg` },
    artilharia:   { nome: 'Type 99 155mm',      fab: 'Japan Steel Works',     origem: 'JPN', proprio: true,
      foto: `${W}/3/3f/Type_99_155_mm_self-propelled_howitzer_of_the_JGSDF_2nd_Artillery_Regiment_2nd_Battalion.jpg/330px-Type_99_155_mm_self-propelled_howitzer_of_the_JGSDF_2nd_Artillery_Regiment_2nd_Battalion.jpg` },
    misseis:      { nome: 'Type 12 (anti-navio)', fab: 'Mitsubishi Heavy',    origem: 'JPN', proprio: true,
      foto: `${W}/5/52/Type_12_Surface-to-Ship_Missile.jpg/330px-Type_12_Surface-to-Ship_Missile.jpg` },
  },
};
