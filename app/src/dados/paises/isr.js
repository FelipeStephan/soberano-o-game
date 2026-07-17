// FICHA DO MUNDO — Israel, era 2026.
// Mesmo contrato do FICHA_EUA_2026: é o snapshot que a Máquina é OBRIGADA a respeitar.
//
// NOTA DE MÉTODO (vale para todo o Oriente Médio deste pacote):
// Israel/Palestina não é um cenário de fantasia — é uma guerra com mortos reais dos dois
// lados. A ficha descreve INCENTIVOS E CAPACIDADES DE ESTADO: o que este governo pode
// fazer, o que ele teme, o que lhe custa caro. Não descreve povos, nem religiões, nem
// julga quem tem razão. O cinismo aqui é dirigido a gabinetes, nunca a populações.
//
// O líder é FICTÍCIO por regra de projeto: o jogo tem missões de assassinato e não
// modelamos violência contra pessoas reais.
import { FOTO_UNIDADE } from '../imagens.js';

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';
const WP = 'https://upload.wikimedia.org/wikipedia';

export const PAIS_ISR = {
  ficha: {
    forcasIniciais: null, // preenchido abaixo com `forcas` (ver rodapé do arquivo)
    ano: 2026,
    pais: 'Israel',
    iso: 'ISR',
    presidente: 'Ariel Ben-Shahar', // FICTÍCIO. Cargo: Primeiro-Ministro.
    cargo: 'Primeiro-Ministro',
    capital: 'Jerusalém',
    bandeira: '✡️',
    pino: { lat: 31.78, lng: 35.22 },

    resumo: `Nove milhões de habitantes e a força armada mais tecnológica do Oriente Médio, sustentada
por um pacto de US$ 3,8 bi/ano com Washington que dura desde os anos 1980. Economia pequena e
densíssima: mais startups por habitante que qualquer país do mundo, e um setor de defesa que exporta
o que testa em casa. Doutrina de dissuasão baseada em superioridade qualitativa e num arsenal nuclear
que o Estado nunca confirmou nem negou em setenta anos. Politicamente fraturado: coalizões de
sobrevivência, disputa sobre o Judiciário, e a ocupação da Cisjordânia como questão que divide a
própria sociedade israelense. Cercado por fronteiras que nenhum tratado resolveu de fato.`,

    // -100..+100, do ponto de vista de Israel. Sem rel_israel (é o próprio país).
    relacoes: {
      rel_eua: 85,        // o cheque, o veto no Conselho de Segurança e o F-35. A relação que define tudo
      rel_china: 5,       // comércio e portos (Haifa) — e Washington reclamando de cada contrato
      rel_russia: -15,    // canal aberto na Síria por necessidade, S-300 vendido ao Irã por despeito
      rel_ira: -95,       // o adversário declarado; ataque direto de Estado a Estado desde 2024
      rel_brasil: 5,      // relação esfriada até o osso desde 2024; embaixadas em modo mínimo
      rel_taiwan: 10,
      rel_arabia: 20,     // sem relações formais e com interesses idênticos contra Teerã. O paradoxo do século
      rel_ue: 25,         // maior parceiro comercial e maior fonte de crítica pública ao mesmo tempo
      rel_reino: 40,
      rel_ucrania: 20,    // simpatia sem armas: mandar Iron Dome pra Kiev azeda a Rússia na Síria
      rel_india: 60,      // maior comprador de armas israelenses do planeta. Puro negócio, e funciona
      rel_japao: 30,
      rel_coreia: 35,
      rel_norte: -60,     // vendeu tecnologia de míssil pra meio inimigo de Israel
      rel_mexico: 15,
      rel_canada: 45,
      rel_australia: 45,
      rel_turquia: -25,   // membro da OTAN que rompeu comércio em 2024 e hospeda o Hamas político
      rel_paquistao: -55, // não reconhece Israel; o único arsenal nuclear de país muçulmano
      rel_venezuela: -50,
      rel_indonesia: -30, // maior país muçulmano do mundo, sem relações formais
      rel_egito: 30,      // paz fria de Camp David (1979): funciona há 46 anos e ninguém comemora
    },

    tensoes: [
      'Guerra em Gaza e o custo internacional que ela cobra a cada mês',
      'Programa nuclear iraniano e a janela de ação militar que encolhe',
      'Hezbollah e a fronteira norte que nunca estabilizou',
      'Fratura interna: reforma judicial, serviço militar dos haredim, deslegitimação mútua',
      'Cisjordânia: assentamentos, violência de colonos e o fim prático da solução de dois Estados',
    ],

    estadoInicial: {
      aprovacao: 38,      // governos de coalizão aqui vivem no fio; protesto de rua é instituição
      estabilidade: 45,   // sociedade coesa contra ameaça externa, dilacerada em tudo o mais
      soft_power: 35,     // capital diplomático em queda desde 2023; o Sul Global fechou a porta
      seguranca: 55,      // a melhor defesa aérea do mundo e nenhuma fronteira quieta
      temp_guerra: 75,    // não é hipótese: é a condição de operação
      temp_economia: 50,  // reservistas fora do trabalho e prêmio de risco fazem o PIB tossir
      liberdades: 60,     // imprensa combativa, Suprema Corte ativa e eleições disputadas de verdade
                          // — o número não é maior porque censura militar e o regime jurídico
                          // dual da Cisjordânia são fatos, não opinião
      poder_militar: 62,  // pequeno em massa, brutal em qualidade
      // economia (US$ trilhões)
      pib: 0.55,          // ~US$ 550 bi. PIB per capita de país europeu rico
      tesouro: 0.21,      // reservas do Banco de Israel, ~US$ 210 bi — colchão enorme pro tamanho
      divida: 69,         // dívida/PIB; era 60% antes da guerra
      aliquota: 32,
      // capacidades (0–100)
      inteligencia: 92,   // Mossad, Aman e a Unidade 8200 — que é, na prática, a maior escola de
                          // engenharia de software do país. Metade do Vale do Silício israelense
                          // saiu de lá. É a vantagem estrutural nº 1 e por isso o número é quase teto
      capacidade_ind: 58, // base industrial pequena, mas Rafael/IAI/Elbit fazem de tudo
      uranio: 40,         // Dimona opera desde 1963. Estoque suficiente, sem programa civil de vitrine
      // poder territorial / arsenal
      territorio: 1,
      ogivas: 90,         // AMBIGUIDADE DELIBERADA: Israel nunca confirmou nem negou ter arsenal
                          // nuclear — é a política de "amimut", em vigor desde os anos 1960.
                          // Não assinou o TNP e não aceita inspeção. As estimativas públicas
                          // (SIPRI, FAS) ficam em 80–90 ogivas. O jogo adota 90 como número
                          // OPERACIONAL, não como fato confirmado: dissuasão que ninguém admite
                          // ter continua dissuadindo. É esse o ponto da doutrina.
    },

    fiosSemente: [
      { tema: 'Corrida contra o relógio nuclear iraniano', intensidade: 78, alvo_pressao: 'seguranca', atores: ['ira', 'eua'] },
      { tema: 'Custo internacional da guerra em Gaza', intensidade: 70, alvo_pressao: 'soft_power', atores: ['ue', 'brasil', 'turquia'] },
      { tema: 'Fronteira norte e o Hezbollah', intensidade: 60, alvo_pressao: 'temp_guerra', atores: ['ira'] },
      { tema: 'Fratura interna sobre o Estado de direito', intensidade: 55, alvo_pressao: 'estabilidade', atores: [] },
    ],
  },

  // ── ORDEM DE BATALHA (aproximada, fontes abertas: IISS Military Balance) ──
  // ~170 mil ativos, e outros ~465 mil reservistas que o país convoca em 48 horas —
  // o jogo conta só o efetivo permanente. Zero porta-aviões: a doutrina é aérea e terrestre,
  // não expedicionária. Israel não projeta poder do outro lado do oceano; ele defende 470 km.
  forcas: {
    infantaria: 170000,
    blindados: 1300,      // frota Merkava, projeto e fabricação nacionais
    artilharia: 650,
    helicopteros: 130,
    cacas: 340,           // F-35I, F-16I, F-15
    bombardeiros: 0,      // não existe: os caças fazem o trabalho, e o alvo está a 2 horas de voo
    drones: 190,
    navios: 15,           // marinha de corvetas: protege plataformas de gás e o litoral
    submarinos: 5,        // classe Dolphin, alemães. O braço de dissuasão que ninguém comenta
    porta_avioes: 0,
    misseis: 300,
    defesa_aerea: 15,    // Domo de Ferro, Funda de Davi e Arrow — a defesa mais densa do mundo por km²
    ogivas: 90,
  },

  // ── ESTATAIS E CAMPEÃS NACIONAIS ──────────────────────────────────────
  // Reaproveita a Elbit de dados/empresas.js e expande: a IAI é 100% do Estado, e a
  // Rafael saiu de dentro do Ministério da Defesa em 2002 sem nunca sair do Estado.
  empresas: [
    { id: 'iai', nome: 'Israel Aerospace Industries', sigla: 'IAI', setor: 'Aeroespacial', estatal: true, participacao: 100,
      valor: 0.02, margem: 0.08, logo: null,
      bonus: { capacidade_ind: 4, inteligencia: 2 },
      desc: 'Cem por cento do governo. Faz satélite espião, o radar do Iron Dome e o drone Heron. Vende pra Índia e pra Alemanha o que projetou pra si mesma — e o Estado é dono, cliente e vendedor na mesma mesa.' },
    { id: 'rafael', nome: 'Rafael Advanced Defense Systems', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.015, margem: 0.11, logo: null,
      bonus: { capacidade_ind: 3, seguranca: 3 },
      desc: 'Era literalmente um departamento do Ministério da Defesa até 2002. Virou empresa e continuou 100% estatal. Fez o Iron Dome, que intercepta foguete de US$ 800 com míssil de US$ 50 mil — a matemática é péssima e é a única que existe.' },
    { id: 'elbit', nome: 'Elbit Systems', setor: 'Defesa', estatal: false, participacao: 5, valor: 0.02, margem: 0.13,
      logo: `${WP}/en/thumb/7/74/Elbit_Systems_logo-en.svg/250px-Elbit_Systems_logo-en.svg.png`,
      bonus: { capacidade_ind: 3, inteligencia: 2 },
      desc: 'Exporta guerra testada em campo. O argumento de venda é macabro e funciona: "usado em combate real".' },
    { id: 'iec', nome: 'Israel Electric Corporation', sigla: 'IEC', setor: 'Infraestrutura', estatal: true, participacao: 99,
      valor: 0.01, margem: 0.03, logo: null,
      bonus: { pib: 0.04, estabilidade: 2 },
      desc: 'Estatal de energia num país sem vizinho pra puxar cabo. Ilha elétrica: se apagar, não tem de quem importar. Por isso o gás de Leviatã virou assunto de segurança nacional.' },
    { id: 'imi_leviatan', nome: 'Consórcio de Gás Leviatã', setor: 'Energia', estatal: false, participacao: 20,
      valor: 0.02, margem: 0.1, logo: null,
      bonus: { pib: 0.06, soft_power: 2 },
      desc: 'Descobriram gás no mar em 2010 e o país passou de importador a exportador — vende pro Egito e pra Jordânia, que é como se compra paz a prazo. Plataforma no mar aberto também é alvo no mar aberto.' },
  ],

  // ── EQUIPAMENTO ────────────────────────────────────────────────────────
  // Fotos: Wikimedia Commons, todas resolvidas via API (action=query&prop=imageinfo).
  equipamentos: {
    _nome: 'Israel',
    blindados:    { nome: 'Merkava Mk.4',        fab: 'IDF / MANTAK',        origem: 'ISR', proprio: true,
      foto: `${W}/4/43/Merkava-Mk4m-whiteback01.jpg/330px-Merkava-Mk4m-whiteback01.jpg` },
    cacas:        { nome: 'F-35I Adir',          fab: 'Lockheed / IAI',      origem: 'USA', proprio: 'licenca',
      foto: FOTO_UNIDADE.cacas },
    misseis:      { nome: 'Iron Dome',           fab: 'Rafael',              origem: 'ISR', proprio: true,
      foto: `${W}/0/08/IDF_Iron_Dome_2021.jpg/330px-IDF_Iron_Dome_2021.jpg` },
    submarinos:   { nome: 'Classe Dolphin',      fab: 'thyssenkrupp Marine', origem: 'DEU', proprio: false,
      foto: `${W}/d/dd/INS_Tanin%2C_Dolphin_AIP_submarine.jpg/330px-INS_Tanin%2C_Dolphin_AIP_submarine.jpg` },
    navios:       { nome: "Corveta Sa'ar 6",     fab: 'thyssenkrupp / IAI',  origem: 'DEU', proprio: 'licenca',
      foto: `${W}/3/35/Sa%27ar-6-class-corvette-0026.jpg/330px-Sa%27ar-6-class-corvette-0026.jpg` },
    drones:       { nome: 'IAI Heron',           fab: 'IAI',                 origem: 'ISR', proprio: true,
      foto: `${W}/a/af/IAI_Heron_1_in_flight_2.JPEG/330px-IAI_Heron_1_in_flight_2.JPEG` },
    helicopteros: { nome: 'AH-64 Apache (Peten)', fab: 'Boeing',             origem: 'USA', proprio: false,
      foto: FOTO_UNIDADE.helicopteros },
    artilharia:   { nome: 'M109 Doher',          fab: 'BAE Systems',         origem: 'USA', proprio: false,
      foto: FOTO_UNIDADE.artilharia, sugerido: true },
  },
};

// A ficha e a ordem de batalha são o mesmo objeto — evita divergir se alguém editar um só.
PAIS_ISR.ficha.forcasIniciais = PAIS_ISR.forcas;
