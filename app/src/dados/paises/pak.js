// FICHA DO MUNDO — Paquistão, era 2026.
// Segue o molde de eua-2026.js. Valores aproximados.
//
// Líder FICTÍCIO (regra do projeto). Cargo real do chefe de governo: Primeiro-Ministro.
// Observação de desenho: no Paquistão o cargo mais poderoso não é necessariamente o do
// Primeiro-Ministro. Ver comentário em `estabilidade`.

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_PAK = {
  ficha: {
    ano: 2026,
    pais: 'Paquistão',
    iso: 'PAK',
    presidente: 'Tariq Nadeem Bhatti',   // fictício
    cargo: 'Primeiro-Ministro',
    capital: 'Islamabad',
    bandeira: '🌙',
    pino: { lat: 33.68, lng: 73.05 },

    resumo: `Quinto país mais populoso do planeta, ~250 milhões de pessoas, e economia de
US$ 370 bilhões — o que dá menos de US$ 1.500 por habitante. Potência nuclear declarada
desde 1998, com o arsenal crescendo mais rápido que o PIB. Quatro guerras com a Índia e
uma disputa sobre a Caxemira que nunca fechou. Cliente do FMI em série: mais de vinte
programas desde 1958, nenhum concluído até o fim. Estrategicamente indispensável e
cronicamente insolvente — uma combinação que funciona melhor do que deveria, porque
credor nenhum quer descobrir o que acontece se um Estado nuclear de 250 milhões quebra
de verdade.`,

    // Ponto de vista de Islamabad. Sem rel_paquistao.
    relacoes: {
      rel_india: -85,       // quatro guerras (1947, 1965, 1971, 1999), duas delas pela Caxemira, e a
                            // de 1971 partiu o país em dois — Bangladesh era o Paquistão Oriental.
                            // Desde 1998 os dois têm bomba. É a única fronteira do mundo onde duas
                            // potências nucleares trocam tiro de artilharia com alguma regularidade.
      rel_china: 88,        // o aliado real. CPEC: US$ 62 bi em corredor econômico. Pequim tem
                            // dívida, porto (Gwadar) e o JF-17 no pacote. Aliança de verdade.
      rel_eua: 25,          // casamento por conveniência, três vezes: Guerra Fria, Afeganistão 1979,
                            // Guerra ao Terror. Terminou mal as três. Ninguém confia em ninguém.
      rel_arabia: 65,       // Riade paga a conta quando o FMI demora. Em troca, tropa e discrição.
      rel_ira: 20,          // vizinho, fronteira porosa no Baluchistão, e os dois já se bombardearam
                            // em 2024 — cada um alegando perseguir separatista no quintal do outro
      rel_turquia: 70,      // afinidade real, cooperação de defesa, apoio mútuo em fórum multilateral
      rel_norte: 25,        // ver ficha da RPDC: houve troca de centrífuga por míssil nos anos 90
      rel_russia: 15,       // esteve do lado errado da Guerra Fria; hoje compra petróleo com desconto
      rel_ue: 30,           // preferência comercial GSP+ para o têxtil, que é metade da exportação
      rel_reino: 35,        // 1,6 milhão de britânicos de origem paquistanesa e a herança colonial
      rel_ucrania: 25,      // vendeu munição de 155mm discretamente e negou publicamente
      rel_israel: -70,      // não reconhece o Estado de Israel. Passaporte diz "válido para todos os
                            // países EXCETO Israel", por escrito.
      rel_japao: 30,
      rel_coreia: 25,
      rel_taiwan: -10,      // política de Uma China: o preço de ter Pequim como sócio
      rel_brasil: 10,
      rel_mexico: 5,
      rel_canada: 20,
      rel_australia: 20,
      rel_venezuela: 5,
      rel_indonesia: 45,    // solidariedade entre os dois maiores países muçulmanos por população
      rel_egito: 35,
    },

    tensoes: [
      'Caxemira e a Linha de Controle com a Índia',
      'Crise de balanço de pagamentos e programa do FMI',
      'Militância no noroeste e insurgência no Baluchistão',
      'Tutela militar sobre o governo civil',
      'Dívida com Pequim pelo corredor CPEC',
    ],

    estadoInicial: {
      aprovacao: 38,        // inflação de dois dígitos corrói qualquer governo civil
      // 42 de estabilidade porque o Paquistão tem um problema estrutural: teve três golpes
      // consumados e NENHUM primeiro-ministro completou um mandato de cinco anos desde 1947.
      // Nenhum. O Exército não precisa governar diretamente para decidir política externa,
      // nuclear e de segurança — ele já decide. O governo civil administra o resto.
      estabilidade: 42,
      soft_power: 25,
      seguranca: 40,        // insurgência no Baluchistão e militância na fronteira afegã
      temp_guerra: 55,      // a Linha de Controle nunca esfria de verdade
      temp_economia: 28,    // reservas cambiais que já chegaram a cobrir três semanas de importação
      liberdades: 35,       // imprensa pressionada, judiciário sob disputa, oposição presa em turnos
      poder_militar: 62,    // exército grande, competente e nuclear — e caro demais para o PIB
      // economia (US$ trilhões)
      pib: 0.37,            // ~US$ 370 bi para ~250 milhões de pessoas
      tesouro: 0.012,       // reservas em nível de emergência, sustentadas por rolagem amiga
      divida: 75,           // dívida/PIB ~75%, com metade do orçamento indo em serviço da dívida
      aliquota: 11,         // arrecadação de ~11% do PIB — o buraco real da ficha. Agricultura
                            // praticamente não paga imposto e a elite rural veta qualquer reforma.
      // capacidades (0–100)
      inteligencia: 68,     // o ISI é um dos serviços mais capazes e mais autônomos do mundo —
                            // autônomo inclusive em relação ao próprio governo eleito
      capacidade_ind: 45,   // faz caça em parceria e ogiva sozinho; não faz motor nem semicondutor
      uranio: 65,           // Kahuta enriquece desde os anos 80; turno doméstico fechado
      territorio: 1,
      ogivas: 170,          // estimativa. Cresce ~10/ano. Único arsenal do mundo islâmico.
    },

    fiosSemente: [
      { tema: 'Escalada na Linha de Controle com a Índia', intensidade: 68, alvo_pressao: 'seguranca', atores: ['india'] },
      { tema: 'Programa do FMI e crise cambial', intensidade: 72, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Tutela militar sobre o governo civil', intensidade: 60, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Dívida e dependência do corredor CPEC', intensidade: 52, alvo_pressao: 'soft_power', atores: ['china'] },
    ],
  },

  // ORDEM DE BATALHA (aproximada).
  // Exército desenhado inteiro para um cenário só: a Índia. Daí a proporção estranha —
  // blindado e caça em quantidade de potência média, marinha de fundo de quintal. O mar
  // nunca foi o problema; a planície do Punjab sempre foi.
  forcas: {
    infantaria: 650000,
    blindados: 2500,      // Al-Khalid (com a China) + T-80UD ucranianos comprados nos anos 90
    artilharia: 4500,
    helicopteros: 300,    // AH-1 Cobra americanos dos anos 80, mantidos com peça de canibalização
    cacas: 400,           // F-16 americanos (com restrição de uso que Washington fiscaliza de verdade)
                          // + JF-17 sino-paquistanês. O JF-17 existe exatamente PORQUE o F-16 vem
                          // com coleira: é o caça que ninguém pode embargar no meio de uma crise.
    bombardeiros: 0,      // nenhum bombardeiro estratégico. A entrega nuclear é míssil e caça.
    drones: 200,          // Burraq nacional + Wing Loong e CH-4 chineses
    navios: 30,           // fragatas Type 054A/P chinesas — a marinha inteira está virando chinesa
    submarinos: 8,        // 5 Agosta franceses + Hangor chineses a caminho. O Agosta 90B tem
                          // propulsão independente de ar: some por semanas. É a carta naval real.
    porta_avioes: 0,
    misseis: 400,         // Shaheen, Ghauri, Babur. É a perna principal da tríade — que não é tríade.
    defesa_aerea: 15,    // HQ-9/P e LY-80 chineses: o céu é comprado em Pequim
    ogivas: 170,
  },

  empresas: [
    { id: 'pia', nome: 'Pakistan International Airlines', sigla: 'PIA', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.001, margem: -0.08, logo: null,
      bonus: { aprovacao: -1, soft_power: 1 },
      desc: 'Já foi a companhia que ensinou a Emirates a voar — literalmente, treinou a tripulação dela nos anos 80. Hoje acumula prejuízo bilionário e ninguém quer comprar nem de graça: o leilão de 2024 atraiu um único proponente, que ofereceu menos de um décimo do preço mínimo. Privatizar é humilhante. Manter é mais caro.' },
    { id: 'ogdcl', nome: 'Oil & Gas Development Company', sigla: 'OGDCL', setor: 'Energia', estatal: true, participacao: 85,
      valor: 0.005, margem: 0.22, logo: null,
      bonus: { pib: 0.02 },
      desc: 'A maior empresa do país e a mais lucrativa. Gás doméstico que cobre parte do consumo e adia a fatura de importação — que é o que decide se as reservas cambiais duram três semanas ou seis.' },
    { id: 'pac', nome: 'Pakistan Aeronautical Complex', sigla: 'PAC', setor: 'Aeroespacial', estatal: true, participacao: 100,
      valor: 0.002, margem: 0.10, logo: null,
      bonus: { capacidade_ind: 4, poder_militar: 3 },
      desc: 'Monta o JF-17 em Kamra, em parceria com Chengdu. O motor é russo, a aviônica é chinesa, e a montagem é local — mas é um caça que Washington não pode embargar no meio de uma crise. Foi essa a ideia o tempo todo.' },
    { id: 'pofs', nome: 'Pakistan Ordnance Factories', sigla: 'POF', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.002, margem: 0.12, logo: null,
      bonus: { capacidade_ind: 3 },
      desc: 'Munição, fuzil e obus em Wah Cantonment desde 1951. Exporta para meio mundo com pouca pergunta na alfândega — inclusive 155mm que apareceram na Ucrânia em 2023, o que Islamabad negou com todas as letras.' },
    { id: 'fauji', nome: 'Fauji Foundation', setor: 'Industrial', estatal: false, participacao: 0,
      valor: 0.008, margem: 0.09, logo: null,
      bonus: { estabilidade: 2, capacidade_ind: 2 },
      desc: 'Cimento, fertilizante, cereal, energia e banco — um conglomerado bilionário formalmente privado, controlado pela instituição de bem-estar dos veteranos das Forças Armadas. Não aparece no orçamento militar e responde a uma cadeia de comando que não é a do Ministério da Fazenda. É a razão pela qual "cortar gasto militar" no Paquistão é uma frase sem sentido prático.' },
  ],

  equipamentos: {
    _nome: 'Paquistão',
    blindados:    { nome: 'Al-Khalid',           fab: 'HIT / Norinco',         origem: 'PAK', proprio: 'licenca',
      foto: `${W}/2/2c/Al-Khalid_IDEAS_2012.jpg/330px-Al-Khalid_IDEAS_2012.jpg` },
    cacas:        { nome: 'JF-17 Thunder',       fab: 'PAC / Chengdu',         origem: 'PAK', proprio: 'licenca',
      foto: `${W}/4/4d/Black_Panther_JF-17.jpg/330px-Black_Panther_JF-17.jpg` },
    submarinos:   { nome: 'Classe Agosta 90B',   fab: 'DCNS / KS&EW',          origem: 'FRA', proprio: 'licenca',
      foto: `${W}/5/58/Agosta-90B.jpg/330px-Agosta-90B.jpg` },
    misseis:      { nome: 'Shaheen-III',         fab: 'NESCOM',                origem: 'PAK', proprio: true,
      foto: `${W}/c/ce/IRBM_of_Pakistan_at_IDEAS_2008.jpg/330px-IRBM_of_Pakistan_at_IDEAS_2008.jpg` },
    helicopteros: { nome: 'AH-1F Cobra',         fab: 'Bell',                  origem: 'USA', proprio: false, foto: null, sugerido: true },
    artilharia:   { nome: 'M109A5',              fab: 'BAE Systems',           origem: 'USA', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'Burraq',              fab: 'NESCOM',                origem: 'PAK', proprio: true,  foto: null, sugerido: true },
    navios:       { nome: 'Fragata Type 054A/P', fab: 'CSSC (Hudong-Zhonghua)', origem: 'CHN', proprio: false, foto: null, sugerido: true },
    bombardeiros: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
    porta_avioes: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
  },
};
