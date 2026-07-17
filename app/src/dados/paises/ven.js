// FICHA DO MUNDO — Venezuela, era 2026.
// Segue o molde de eua-2026.js.
//
// AVISO DE TOM: o colapso venezuelano produziu a maior crise de deslocamento do hemisfério
// ocidental — cerca de 7,7 milhões de pessoas saíram do país. Isso não é piada de ficha.
// O cinismo aqui é com quem administrou o colapso, não com quem o atravessou a pé.
//
// A ficha é COERENTE com dados/petroleo.js: VEN tem 303 bi de barris de reserva provada —
// a maior do planeta, à frente da Arábia Saudita — e produz 0,8 milhão de barris/dia.
// A PDVSA é reaproveitada de dados/empresas.js sem alteração.
//
// Líder FICTÍCIO (regra do projeto).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_VEN = {
  ficha: {
    ano: 2026,
    pais: 'Venezuela',
    iso: 'VEN',
    presidente: 'Efraín Colmenares',   // fictício
    capital: 'Caracas',
    bandeira: '🛢️',
    pino: { lat: 10.48, lng: -66.9 },

    resumo: `Senta sobre a maior reserva de petróleo do planeta e importa gasolina. A economia
encolheu cerca de 80% entre 2013 e 2021 — a maior contração de um país em paz na história
econômica moderna, pior que a Grande Depressão americana e mais profunda que a de vários
países em guerra. Hiperinflação queimou três reformas monetárias e catorze zeros. Sete
milhões e setecentas mil pessoas foram embora. Sancionada por Washington, sustentada por
crédito de Pequim e por técnico cubano. O petróleo é a única variável que importa nesta
ficha: consertar a PDVSA é a jogada, e o prêmio é indecente.`,

    // Ponto de vista de Caracas. Sem rel_venezuela.
    relacoes: {
      rel_eua: -80,        // sanção ao petróleo desde 2019 e reconhecimento de governo paralelo.
                           // Ironia estrutural: os EUA foram o maior comprador do cru venezuelano
                           // por 80 anos, e as refinarias da Costa do Golfo são das poucas do mundo
                           // desenhadas para processar aquele óleo pesado. Os dois se odeiam e
                           // continuam sendo o par comercial natural um do outro.
      rel_china: 60,       // emprestou mais de US$ 50 bi em troca de barril futuro. Hoje é credor
                           // preso: se Caracas cai, o empréstimo cai junto. Pequim precisa que dure.
      rel_russia: 70,      // Su-30, dívida rolada e apoio no Conselho de Segurança
      rel_ira: 75,         // manda condensado para diluir o óleo pesado e técnico para as refinarias.
                           // Dois sancionados fazendo escambo fora do sistema do dólar.
      rel_norte: 30,
      rel_brasil: 15,      // fronteira de 2.200 km, disputa sobre Essequibo no colo e Roraima
                           // recebendo migrante. Relação instável por geografia, não por ideologia.
      rel_ue: -35,
      rel_reino: -45,      // litígio sobre o ouro do Banco Central retido no Banco da Inglaterra
      rel_israel: -60,
      rel_ucrania: -20,
      rel_india: 25,       // virou comprador relevante do cru com desconto
      rel_japao: -10,
      rel_coreia: -15,
      rel_taiwan: -20,
      rel_arabia: 15,      // sócios de OPEP que competem pelo mesmo comprador
      rel_mexico: 35,
      rel_canada: -50,     // sancionou junto com Washington
      rel_australia: -25,
      rel_turquia: 45,     // rota de exportação do ouro quando o resto fechou
      rel_paquistao: 5,
      rel_indonesia: 10,
      rel_egito: 10,
    },

    tensoes: [
      'Sanções ao petróleo e ao setor financeiro',
      'Colapso produtivo da PDVSA e da infraestrutura elétrica',
      'Reivindicação sobre o Essequibo e atrito com a Guiana',
      'Emigração em massa e perda de mão de obra qualificada',
      'Dívida externa em default e ouro retido no exterior',
    ],

    estadoInicial: {
      aprovacao: 30,
      estabilidade: 25,     // o Estado não caiu, mas parou de funcionar em pedaços: apagão
                            // nacional de vários dias, água intermitente, hospital sem insumo
      soft_power: 15,
      seguranca: 30,
      temp_guerra: 25,      // Essequibo é retórica de mobilização barata — e barata sai caro
      temp_economia: 15,    // o número mais baixo da ficha, e é generoso
      liberdades: 20,
      poder_militar: 28,    // ver comentário em `forcas`
      // economia (US$ trilhões)
      // ~US$ 100 bi. Era ~US$ 370 bi em 2012. A queda de ~80% do PIB entre 2013 e 2021 é a
      // maior contração já registrada em um país que não estava em guerra. Não é estimativa
      // de oposição: é dado do FMI e do próprio Banco Central quando ele voltou a publicar.
      pib: 0.10,
      tesouro: 0.005,       // reservas quase todas em ouro, e parte do ouro está retida em Londres
      divida: 160,          // dívida/PIB ~160%, em default seletivo desde 2017
      aliquota: 14,         // arrecadar imposto de uma economia informal e dolarizada é ficção
      // capacidades (0–100)
      inteligencia: 35,     // o SEBIN funciona; o resto do aparato de Estado, nem tanto
      capacidade_ind: 18,   // não refina a própria gasolina. Importa combustível sentado
                            // sobre 303 bilhões de barris.
      uranio: 0,            // sem programa, sem turno, sem minério explorado. Zero, e é zero mesmo.
      territorio: 1,
      ogivas: 0,
    },

    fiosSemente: [
      { tema: 'Sanções ao petróleo e licenças de exceção', intensidade: 75, alvo_pressao: 'temp_economia', atores: ['eua'] },
      { tema: 'Colapso da PDVSA e da rede elétrica', intensidade: 70, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Disputa sobre o Essequibo com a Guiana', intensidade: 55, alvo_pressao: 'temp_guerra', atores: ['brasil'] },
      { tema: 'Emigração em massa e fuga de técnicos', intensidade: 60, alvo_pressao: 'aprovacao', atores: ['brasil'] },
    ],
  },

  // ORDEM DE BATALHA (aproximada).
  // O problema desta ficha não é o inventário — é a manutenção. Ver `cacas`.
  forcas: {
    infantaria: 120000,   // + milícia territorial que existe muito mais no decreto que no campo
    blindados: 200,       // AMX-30 franceses dos anos 70 e alguns BMP-3 russos
    artilharia: 400,
    helicopteros: 60,     // Mi-17 russos; parte relevante fora de operação por falta de peça
    cacas: 40,            // 21 Su-30MK2 russos comprados em 2006, quando o barril estava a US$ 70
                          // e sobrava dinheiro. Hoje voa uma fração deles: o Su-30 exige revisão
                          // de fábrica, peça russa e piloto com centenas de horas de treino — e
                          // os três acabaram junto com o câmbio. O resto do número é F-16 dos
                          // anos 80 embargados desde 2006, mantidos por canibalização. Ter caça
                          // no hangar e ter poder aéreo são coisas diferentes, e esta ficha é a
                          // prova mais limpa disso no jogo.
    bombardeiros: 0,
    drones: 30,           // Mohajer iranianos montados sob licença em Maracay
    navios: 20,           // patrulha costeira, pouca disponibilidade
    submarinos: 2,        // dois Type 209 alemães dos anos 70. Manutenção duvidosa há anos.
    porta_avioes: 0,
    misseis: 50,          // Igla-S e antinavio de origem russa/chinesa
    defesa_aerea: 12,    // S-300VM e Buk-M2 russos: pouca coisa, mas o suficiente para encarecer uma invasão
    ogivas: 0,
  },

  // PDVSA vem de dados/empresas.js SEM ALTERAÇÃO — mesma redação, mesmos números.
  // Coerente com petroleo.js: producao 0.8 milhão de barris/dia, 303 bi de reserva.
  empresas: [
    { id: 'pdvsa', nome: 'PDVSA', setor: 'Energia', estatal: true, participacao: 100, valor: 0.03, margem: 0.02,
      petroleo: 0.8, logo: null, bonus: { pib: 0.08 },
      desc: 'Senta sobre a maior reserva do planeta e produz menos que a Colômbia. Trinta mil engenheiros demitidos por greve política em 2003, e a empresa nunca mais se levantou. O prêmio de quem consertar isso é indecente.' },
    { id: 'corpoelec', nome: 'Corpoelec', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.004, margem: -0.06, logo: null,
      bonus: { estabilidade: 3, capacidade_ind: 2 },
      desc: 'Estatizada em 2007 e responsável por 100% da rede. Em março de 2019 o país inteiro ficou sem luz por quase uma semana. O governo culpou sabotagem externa; os engenheiros que sobraram apontaram a manutenção que não se fez em Guri por doze anos. As duas versões continuam oficiais.' },
    { id: 'cvg', nome: 'Corporación Venezolana de Guayana', sigla: 'CVG', setor: 'Mineração', estatal: true, participacao: 100,
      valor: 0.003, margem: -0.04, logo: null,
      bonus: { pib: 0.01, capacidade_ind: 2 },
      desc: 'Ferro, bauxita, alumínio e ouro em Guayana. Já empregou 30 mil pessoas e exportou para o mundo; hoje opera a uma fração da capacidade, e o ouro que sai da região sai em grande parte por fora do balanço — garimpo, avião pequeno e destino que a contabilidade não registra.' },
    { id: 'bandes', nome: 'Banco de Desarrollo Económico y Social', sigla: 'BANDES', setor: 'Financeiro', estatal: true, participacao: 100,
      valor: 0.002, margem: 0.01, logo: null,
      bonus: { temp_economia: 2 },
      desc: 'O banco de fomento que financiou aliado continental na época do barril caro. Sancionado por Washington em 2019. Hoje é menos um banco de desenvolvimento que um canal de pagamento para o que ainda atravessa o cerco financeiro.' },
  ],

  equipamentos: {
    _nome: 'Venezuela',
    cacas:        { nome: 'Su-30MK2',            fab: 'Sukhoi',                origem: 'RUS', proprio: false,
      foto: `${W}/7/76/Sukhoi_Su-30MK2_de_Venezuela.jpg/330px-Sukhoi_Su-30MK2_de_Venezuela.jpg` },
    helicopteros: { nome: 'Mi-17',               fab: 'Mil / Russian Helicopters', origem: 'RUS', proprio: false,
      foto: `${W}/1/19/Mil_Mi-17_Hip%2C_Venezuela_-_Army_JP5971426.jpg/330px-Mil_Mi-17_Hip%2C_Venezuela_-_Army_JP5971426.jpg` },
    blindados:    { nome: 'AMX-30V',             fab: 'GIAT / Nexter',         origem: 'FRA', proprio: false,
      foto: `${W}/6/61/AMX-30B2_%E2%80%982940_0173%E2%80%99_at_Mus%C3%A9e_des_Blind%C3%A9s%2C_Saumur%2C_France_%2853334731254%29.jpg/330px-AMX-30B2_%E2%80%982940_0173%E2%80%99_at_Mus%C3%A9e_des_Blind%C3%A9s%2C_Saumur%2C_France_%2853334731254%29.jpg`,
      sugerido: true },
    // A foto do AMX-30 é de um exemplar francês em museu, não de um venezuelano — não há
    // imagem verificada da variante V no Commons. Marcado como sugerido: é o veículo certo,
    // a bandeira errada.
    submarinos:   { nome: 'Classe Sábalo (Type 209)', fab: 'Howaldtswerke',    origem: 'DEU', proprio: false, foto: null, sugerido: true },
    artilharia:   { nome: 'BM-30 Smerch',        fab: 'Splav',                 origem: 'RUS', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'Mohajer-2 (ANSU-100)', fab: 'HESA / CAVIM',         origem: 'IRN', proprio: 'licenca', foto: null, sugerido: true },
    misseis:      { nome: 'Igla-S',              fab: 'KBM',                   origem: 'RUS', proprio: false, foto: null, sugerido: true },
    navios:       { nome: 'Patrulha classe Guaiquerí', fab: 'Navantia',        origem: 'ESP', proprio: false, foto: null, sugerido: true },
    bombardeiros: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
    porta_avioes: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
  },
};
