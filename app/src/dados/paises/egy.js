// FICHA DO MUNDO — Egito, era 2026.
//
// O Egito é o país que mais desmente a régua de "força = PIB": tem o maior exército
// árabe, quatro mil blindados e dois porta-helicópteros — e um PIB menor que o de
// Israel, que tem um quarto da população. A explicação é o Canal e a geografia:
// Washington paga US$ 1,3 bi/ano em ajuda militar desde Camp David, e o Golfo cobre o
// resto quando o Cairo balança. É um Estado grande demais pra deixar cair, e essa é
// literalmente a estratégia de sobrevivência dele.
//
// Líder FICTÍCIO por regra de projeto.
import { FOTO_UNIDADE } from '../imagens.js';

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_EGY = {
  ficha: {
    forcasIniciais: null,
    ano: 2026,
    pais: 'Egito',
    iso: 'EGY',
    presidente: 'Hisham Abdel-Karim Fawzy', // FICTÍCIO. Cargo: Presidente.
    cargo: 'Presidente',
    capital: 'Cairo',
    bandeira: '🐫',
    pino: { lat: 30.04, lng: 31.24 },

    resumo: `Cento e quinze milhões de pessoas espremidas em 5% do território — a faixa verde do Nilo — e
uma economia de US$ 380 bi que não dá conta delas. O ativo real não é o subsolo: é o Canal de Suez,
por onde passa cerca de 12% do comércio mundial e 9 Mb/d de petróleo, e cujo pedágio rendia US$ 10 bi
por ano até os ataques no Mar Vermelho derrubarem o tráfego a partir de 2024. Maior exército do mundo
árabe e o que menos combate: a paz fria com Israel dura desde 1979 e é o produto mais valioso que o
Cairo vende. As Forças Armadas não são só exército — são conglomerado: constroem estrada, engarrafam
água, produzem cimento e macarrão, com isenção fiscal e mão de obra de recruta. Dívida externa em
espiral, inflação que já passou de 35%, e uma capital administrativa nova no deserto que custou
dezenas de bilhões enquanto o país renegociava com o FMI pela quarta vez.`,

    // -100..+100, do ponto de vista do Cairo. Sem rel_egito (é o próprio país).
    relacoes: {
      rel_eua: 50,        // US$ 1,3 bi/ano de ajuda militar desde 1979 — o segundo maior beneficiário
                          // histórico. Vem com sermão sobre direitos humanos e sem condicionalidade real
      rel_china: 45,      // construiu a torre da capital nova e financia o que o Ocidente hesita
      rel_russia: 40,     // trigo, a usina nuclear de El Dabaa e uma memória afetuosa de Assuã
      rel_ira: 5,         // relações congeladas desde 1980 — o Egito assinou a paz com Israel e deu
                          // asilo ao Xá; Teerã batizou uma rua com o nome do assassino de Sadat
      rel_brasil: 30,     // maior comprador de carne bovina brasileira no norte da África
      rel_israel: 30,     // paz fria de Camp David: 46 anos sem um tiro e sem um abraço. Coordenação
                          // real em segurança no Sinai, e uma opinião pública que nunca ratificou nada
      rel_taiwan: 0,
      rel_arabia: 60,     // Riade sustenta o caixa do Cairo desde 2013. Tiran e Sanafir foram
                          // transferidas em 2016 e ninguém no Egito engoliu bem
      rel_ue: 40,         // pacote de € 7,4 bi em 2024, e o subtexto é migração: Bruxelas paga
                          // pra que o Mediterrâneo continue sendo problema do Cairo
      rel_reino: 35,
      rel_ucrania: 10,    // era o maior fornecedor de trigo do Egito. A guerra virou pão mais caro
      rel_india: 35,
      rel_japao: 40,
      rel_coreia: 35,
      rel_norte: -20,     // cooperação de míssil nos anos 1980 que o Cairo prefere não comentar
      rel_mexico: 10,
      rel_canada: 25,
      rel_australia: 25,
      rel_turquia: 15,    // dez anos de ruptura por causa da Irmandade e reatamento em 2023
      rel_paquistao: 35,
      rel_venezuela: 5,
      rel_indonesia: 35,
    },

    tensoes: [
      'Receita do Canal de Suez derrubada pelos ataques no Mar Vermelho',
      'Dívida externa, inflação e a quarta rodada com o FMI',
      'Barragem do Renascimento na Etiópia: o Nilo como questão existencial',
      'Fronteira com Gaza: Rafah, o deslocamento de população e a linha vermelha do Cairo',
      'Militares como conglomerado econômico e o setor privado que não consegue competir',
    ],

    estadoInicial: {
      aprovacao: 45,
      estabilidade: 50,   // aparelho de segurança pesado, e um país que já derrubou dois governos
                          // em três anos entre 2011 e 2013. Ninguém no Cairo esqueceu isso
      soft_power: 40,     // Al-Azhar, o cinema e a música egípcia formaram o imaginário árabe por
                          // um século. O prestígio é real e vem sobretudo do passado
      seguranca: 50,
      temp_guerra: 40,
      temp_economia: 30,  // libra desvalorizada três vezes, inflação em dois dígitos altos,
                          // serviço da dívida comendo mais de um terço da receita
      liberdades: 30,     // eleições sem oposição competitiva, imprensa alinhada, ONGs sob lei
                          // restritiva, dezenas de milhares de presos políticos por contagem de
                          // organizações internacionais. Baixo-médio: há vida civil, sindicato
                          // e Judiciário que às vezes contraria — dentro de um teto bem definido
      poder_militar: 52,  // massa impressionante, prontidão e manutenção outra conversa
      // economia (US$ trilhões)
      pib: 0.38,          // ~US$ 380 bi. Menor que o de Israel, com treze vezes mais gente
      tesouro: 0.047,     // reservas ~US$ 47 bi, boa parte depósito do Golfo que pode ser sacado
      divida: 90,         // dívida/PIB alta e cara: o serviço da dívida é o maior item do orçamento
      aliquota: 14,       // arrecadação fraca; economia informal enorme e isenção militar ampla
      // capacidades (0–100)
      inteligencia: 55,   // a Mukhabarat é antiga, competente e o principal canal do Cairo com todo
                          // mundo — inclusive é ela, não o Ministério das Relações Exteriores, quem
                          // media entre Israel e o Hamas há vinte anos
      capacidade_ind: 40, // a Organização Árabe para Industrialização monta M1A1 sob licença desde
                          // 1988; o resto é montagem e cimento
      uranio: 20,         // El Dabaa é usina russa, com combustível russo. Programa civil, e olhe lá
      // poder territorial / arsenal
      territorio: 1,
      ogivas: 0,          // ZERO. Signatário do TNP desde 1981. O Egito é, na verdade, o principal
                          // promotor da proposta de zona livre de armas nucleares no Oriente Médio —
                          // uma iniciativa cujo alvo evidente é o arsenal não-declarado de Israel, e
                          // que por isso nunca saiu do papel em quarenta anos. Não ter a bomba é a
                          // posição diplomática do país, não um acidente
    },

    fiosSemente: [
      { tema: 'Colapso da receita do Canal de Suez', intensidade: 68, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Dívida externa e as condições do FMI', intensidade: 62, alvo_pressao: 'estabilidade', atores: ['eua', 'ue', 'arabia'] },
      { tema: 'A Barragem do Renascimento e a água do Nilo', intensidade: 58, alvo_pressao: 'seguranca', atores: [] },
      { tema: 'Pressão na fronteira de Rafah', intensidade: 55, alvo_pressao: 'temp_guerra', atores: ['israel'] },
    ],
  },

  // ── ORDEM DE BATALHA ───────────────────────────────────────────────────
  // ~440 mil ativos: o maior exército árabe. ~4.000 blindados — a quarta maior frota de
  // tanques do mundo, boa parte M1A1 montada em Helwan sob licença, e ainda M60 dos anos
  // 1970 no inventário. Os 2 "porta-aviões" são os Mistral que a França construiu pra
  // Rússia, não pôde entregar depois da Crimeia em 2014, e revendeu ao Cairo com dinheiro
  // saudita. Um constrangimento diplomático francês que virou capacidade anfíbia egípcia.
  forcas: {
    infantaria: 440000,
    blindados: 4000,
    artilharia: 1200,
    helicopteros: 250,    // inclui os Ka-52 russos comprados pra voar dos Mistral
    cacas: 250,           // F-16 americanos, Rafale franceses, MiG-29M russos — três doutrinas
                          // incompatíveis no mesmo hangar, e é isso que diversificar custa
    bombardeiros: 0,
    drones: 50,           // Wing Loong chineses: os EUA não vendem armado, Pequim não pergunta
    navios: 45,
    submarinos: 8,        // Type 209 e Type 209/1400 alemães
    porta_avioes: 2,      // Mistral: Gamal Abdel Nasser (L1010) e Anwar El Sadat (L1020)
    misseis: 200,
    defesa_aerea: 20,    // S-300VM Antey, Buk e Patriot: compra de todo mundo para não depender de ninguém
    ogivas: 0,
  },

  // ── ESTATAIS ───────────────────────────────────────────────────────────
  // No Egito a fronteira entre "estatal" e "militar" não existe — e essa é a ficha.
  // Petróleo coerente com dados/petroleo.js: EGY produz 0,6 Mb/d e consome 0,9.
  // O país é importador líquido de petróleo. O Canal é que paga.
  empresas: [
    { id: 'suez', nome: 'Autoridade do Canal de Suez', sigla: 'SCA', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.08, margem: 0.2, logo: null, bonus: { pib: 0.18, soft_power: 3, seguranca: 2 },
      desc: 'Nacionalizado em 1956 e o resultado foi uma invasão de três países — que perderam. Rende bilhões por ano em pedágio de algo que o Egito não produz: geografia. Um navio atravessado por seis dias em 2021 parou o comércio do planeta, e desde 2024 os cargueiros preferem dar a volta pela África.' },
    { id: 'egpc', nome: 'Egyptian General Petroleum Corporation', sigla: 'EGPC', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.02, margem: 0.04, petroleo: 0.6, logo: null, bonus: { pib: 0.05 },
      desc: 'Bombeia menos do que o país queima — o Egito é importador líquido de petróleo. O gás de Zohr prometeu independência em 2015 e a produção já começou a cair. Também opera o SUMED, o duto que faz o trabalho do Canal quando o navio é grande demais pra ele.' },
    { id: 'aoi', nome: 'Organização Árabe para Industrialização', sigla: 'AOI', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.01, margem: 0.05, logo: null, bonus: { capacidade_ind: 3 },
      desc: 'Monta o M1A1 Abrams em Helwan sob licença desde 1988 — quatro décadas depois, o motor e o canhão ainda vêm dos Estados Unidos. Licença não é soberania: é uma linha de montagem com um interruptor em Washington.' },
    { id: 'nsp', nome: 'Serviço Nacional de Projetos Militares', setor: 'Industrial', estatal: true, participacao: 100,
      valor: 0.04, margem: 0.09, logo: null, bonus: { pib: 0.08, capacidade_ind: 2, temp_economia: -2 },
      desc: 'O braço econômico das Forças Armadas: cimento, massa, água mineral, estrada, condomínio. Não paga imposto, usa recruta como mão de obra e ganha licitação por decreto. Estimativas do peso disso no PIB vão de 2% a 40% — a diferença entre os números é o próprio segredo.' },
    { id: 'nbe', nome: 'National Bank of Egypt', sigla: 'NBE', setor: 'Financeiro', estatal: true, participacao: 100,
      valor: 0.03, margem: 0.05, logo: null, bonus: { temp_economia: 2, estabilidade: 2 },
      desc: 'O maior banco do país, estatal desde 1960. Emite certificado de depósito a juro alto pra segurar a poupança em libra quando a moeda começa a fugir pro dólar. É contenção de pânico com planilha.' },
    { id: 'elnasr', nome: 'El Nasr Housing & Development', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.02, margem: 0.03, logo: null, bonus: { aprovacao: 2, pib: 0.04 },
      desc: 'Constrói a Nova Capital Administrativa: uma cidade do zero no deserto a 45 km do Cairo, com o obelisco mais alto do mundo e um distrito de negócios erguido por chineses. Custou dezenas de bilhões enquanto o país renegociava com o FMI. Faraó nenhum inventou isso — só repetiu.' },
  ],

  // ── EQUIPAMENTO ────────────────────────────────────────────────────────
  equipamentos: {
    _nome: 'Egito',
    cacas:        { nome: 'Rafale DM',       fab: 'Dassault Aviation', origem: 'FRA', proprio: false,
      foto: `${W}/b/bc/9265_Rafale_DM_Egyptian_Air_Force_El_Alamein_5.9.24_%2854025821284%29.jpg/330px-9265_Rafale_DM_Egyptian_Air_Force_El_Alamein_5.9.24_%2854025821284%29.jpg` },
    porta_avioes: { nome: 'Mistral Gamal Abdel Nasser', fab: 'Chantiers de l\'Atlantique', origem: 'FRA', proprio: false,
      foto: `${W}/a/ae/ENS_Gamal_Adbel_Nasser_%28L_1010%29_%2852322694653%29_%28cropped%29.jpg/330px-ENS_Gamal_Adbel_Nasser_%28L_1010%29_%2852322694653%29_%28cropped%29.jpg` },
    bombardeiros: { nome: 'MiG-29M/M2',      fab: 'Mikoyan / UAC',     origem: 'RUS', proprio: false,
      foto: `${W}/4/4b/8701_Mig-29M_Egyptian_Air_Force_El_Alamein_4.9.24_%2854020815562%29.jpg/330px-8701_Mig-29M_Egyptian_Air_Force_El_Alamein_4.9.24_%2854020815562%29.jpg` },
    blindados:    { nome: 'M1A1 Abrams (Helwan)', fab: 'AOI / General Dynamics', origem: 'USA', proprio: 'licenca',
      foto: FOTO_UNIDADE.blindados, sugerido: true },
    submarinos:   { nome: 'Type 209/1400',   fab: 'thyssenkrupp Marine', origem: 'DEU', proprio: false,
      foto: FOTO_UNIDADE.submarinos, sugerido: true },
    navios:       { nome: 'Fragata FREMM Tahya Misr', fab: 'Fincantieri', origem: 'ITA', proprio: false,
      foto: FOTO_UNIDADE.navios, sugerido: true },
    helicopteros: { nome: 'Ka-52 Alligator', fab: 'Kamov / Russian Helicopters', origem: 'RUS', proprio: false,
      foto: FOTO_UNIDADE.helicopteros, sugerido: true },
    drones:       { nome: 'Wing Loong I',    fab: 'CAIG',              origem: 'CHN', proprio: false,
      foto: FOTO_UNIDADE.drones, sugerido: true },
    misseis:      { nome: 'MIM-104 Patriot / Buk-M2', fab: 'Raytheon / Almaz-Antey', origem: 'USA', proprio: false,
      foto: FOTO_UNIDADE.misseis, sugerido: true },
    artilharia:   { nome: 'M109A5 / RM-70',  fab: 'BAE Systems',       origem: 'USA', proprio: false,
      foto: FOTO_UNIDADE.artilharia, sugerido: true },
  },
};

PAIS_EGY.ficha.forcasIniciais = PAIS_EGY.forcas;
