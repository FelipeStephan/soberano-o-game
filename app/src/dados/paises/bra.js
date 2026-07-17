// FICHA DO MUNDO — Brasil, era 2026. Mesmo formato do eua-2026.js.
//
// LÍDER FICTÍCIO: Otávio Brandão Ferraz. Personagem inventado.

export const PAIS_BRA = {
  ficha: {
    ano: 2026,
    pais: 'Brasil',
    iso: 'BRA',
    presidente: 'Otávio Brandão Ferraz',
    capital: 'Brasília',
    bandeira: '🌎',
    pino: { lat: -15.8, lng: -47.9 },

    resumo: `Nona economia do mundo, sem inimigo externo há 150 anos, e ainda assim mata mais gente
por ano do que muita guerra de verdade. Alimenta um bilhão de pessoas, tira petróleo de 7 km de
profundidade sob camada de sal e faz o terceiro melhor avião comercial do planeta — e não consegue
comprar caça sem parcelar em quinze anos. Tem a maior reserva de água doce, a segunda de nióbio,
a sexta de urânio e o único programa de submarino nuclear do Sul Global, arrastado desde 1979.
A diplomacia é boa: fala com Washington, Pequim, Moscou e Teerã na mesma semana sem ser expulsa
de lugar nenhum. É o ativo mais subestimado do país — e o único que não depende de orçamento.`,

    // Ponto de vista DO BRASIL. Sem rel_brasil. Não-alinhamento por doutrina, não por indecisão.
    relacoes: {
      rel_eua: 30,        // maior investidor, e a memória de 1964 nunca sai da mesa
      rel_china: 55,      // maior parceiro comercial desde 2009: um terço do agro sai daqui pra lá
      rel_ue: 45,         // Mercosul-UE negociado desde 1999. Vinte e seis anos. Ainda "quase"
      rel_reino: 35,
      rel_russia: 35,     // BRICS e fertilizante: sem o russo, a safra encarece
      rel_india: 50,      // BRICS, genéricos e etanol
      rel_japao: 48,      // a maior colônia japonesa fora do Japão mora em São Paulo
      rel_canada: 32,     // a Bombardier processou a Embraer na OMC; ninguém esqueceu
      rel_australia: 25,  // concorrente direto no minério de ferro
      rel_coreia: 35,
      rel_israel: 10,     // relação estremecida desde Gaza
      rel_ira: 15,
      rel_arabia: 30,
      rel_turquia: 28,
      rel_egito: 30,
      rel_indonesia: 32,
      rel_mexico: 38,     // dois gigantes latinos que comerciam pouco entre si e reclamam disso há décadas
      rel_venezuela: 25,  // vizinho de 2.200 km, crise migratória em Roraima, e nenhuma boa opção
      rel_ucrania: 12,    // a neutralidade brasileira irritou Kiev e não agradou Moscou
      rel_taiwan: 8,      // sem relação formal — Pequim não deixaria
      rel_paquistao: 15,
      rel_norte: 5,
    },

    tensoes: [
      'Violência urbana e crime organizado transnacional',
      'Desmatamento amazônico e pressão internacional',
      'Dívida pública e juro real entre os maiores do mundo',
      'Polarização política e desconfiança institucional',
    ],

    estadoInicial: {
      aprovacao: 45,
      estabilidade: 52,
      // soft_power alto pro tamanho da economia: o país é simpático de graça. Futebol, música,
      // e uma diplomacia que fala com todo mundo. É o maior ativo estratégico do Brasil.
      soft_power: 58,
      // seguranca baixa apesar de zero ameaça externa: aqui o inimigo é interno. ~40 mil homicídios
      // por ano, facção com domínio territorial. O medidor mede a rua, não a fronteira.
      seguranca: 38,
      temp_guerra: 8,     // o menor da lista: último conflito real terminou em 1870
      temp_economia: 48,
      liberdades: 66,
      poder_militar: 30,
      // economia (US$ trilhões)
      pib: 2.3,
      tesouro: 0.36,      // reservas internacionais ~US$ 355 bi
      divida: 78,         // dívida bruta/PIB
      aliquota: 33,       // carga tributária de país nórdico, serviço público de país pobre
      // capacidades (0–100)
      inteligencia: 35,   // ABIN pequena e politizada; o país não investe no que não vê
      capacidade_ind: 45, // Embraer e Avibras de ponta, cercadas de desindustrialização
      uranio: 70,         // sexta maior reserva do mundo e só 30% do território prospectado
      territorio: 1,
      ogivas: 0,          // TNP e Constituição proíbem. O submarino nuclear é propulsão, não bomba
    },

    fiosSemente: [
      { tema: 'Crime organizado e domínio territorial', intensidade: 60, alvo_pressao: 'seguranca', atores: [] },
      { tema: 'Pressão internacional sobre a Amazônia', intensidade: 48, alvo_pressao: 'soft_power', atores: ['eua', 'ue'] },
      { tema: 'Dívida pública e juro real', intensidade: 52, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Polarização política', intensidade: 45, alvo_pressao: 'estabilidade', atores: [] },
    ],
  },

  // Ordem de batalha aproximada. Efetivo grande, meio de combate escasso — o padrão da região.
  forcas: {
    infantaria: 360000,
    blindados: 400,       // Leopard 1A5 comprado usado da Bélgica; o Guarani é o que há de novo
    artilharia: 700,
    helicopteros: 180,
    cacas: 40,            // F-5 modernizado e Gripen entrando a conta-gotas: 36 encomendados em 2014
    bombardeiros: 0,      // o país nunca teve um. Não faz sentido pra doutrina daqui
    drones: 30,
    navios: 40,
    submarinos: 6,        // classe Riachuelo; o de propulsão nuclear é promessa desde 1979
    porta_avioes: 0,      // o São Paulo foi afundado em 2023 com amianto a bordo. Fim da era
    misseis: 60,
    defesa_aerea: 4,     // RBS-70 e Igla de curtíssimo alcance. Na prática, o céu brasileiro é aberto
    ogivas: 0,
  },

  // Reaproveitadas de dados/empresas.js (chave BRA).
  empresas: [
    { id: 'petro', nome: 'Petrobras', setor: 'Energia', estatal: true, participacao: 51, valor: 0.11, margem: 0.11,
      petroleo: 2.6, logo: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Sede_Petrobras_en_R%C3%ADo_de_Janeiro.jpg',
      bonus: { pib: 0.2 },
      desc: 'A União tem 51% das ações com voto. Tirou petróleo de 7 km de profundidade sob uma camada de sal — engenharia que ninguém mais no mundo domina. E é palanque de todo governo desde sempre.' },
    { id: 'eletro', nome: 'Eletrobras', setor: 'Energia', estatal: true, participacao: 43, valor: 0.03, margem: 0.07,
      logo: null, bonus: { pib: 0.12, capacidade_ind: 2 },
      desc: 'Privatizada em 2022, mas a União manteve poder de veto e assento no conselho. Itaipu, Angra, e um terço da geração do país.' },
    { id: 'bndes', nome: 'BNDES', setor: 'Financeiro', estatal: true, participacao: 100, valor: 0.04, margem: 0.06,
      logo: null, bonus: { capacidade_ind: 3, temp_economia: 2 },
      desc: 'O banco que decide quais empresas brasileiras existem. Crédito subsidiado como política industrial — ou como favor, dependendo de quem conta a história.' },
    { id: 'vale', nome: 'Vale', setor: 'Mineração', estatal: false, participacao: 10, valor: 0.06, margem: 0.1,
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/97/Vale_logo.svg/120px-Vale_logo.svg.png',
      bonus: { capacidade_ind: 2 },
      desc: 'Ferro e níquel pro mundo inteiro. E o nióbio, que só o Brasil tem em escala — e sobre o qual todo mundo tem uma teoria.' },
    { id: 'embraer', nome: 'Embraer', setor: 'Aeroespacial', estatal: false, participacao: 5, valor: 0.02, margem: 0.06,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Sede-da-embraer.jpg',
      bonus: { capacidade_ind: 3 },
      desc: 'Terceira maior fabricante de aviões do mundo. A União mantém a golden share: pode vetar a venda pra estrangeiro. Já usou.' },
  ],

  // Cinco fotos verificadas (reaproveitadas de equipamentos.js). O resto ficou null:
  // não achei no Commons imagem que fosse comprovadamente do item certo, e foto errada
  // no painel é pior que foto nenhuma.
  equipamentos: {
    _nome: 'Brasil',
    blindados:    { nome: 'VBTP-MR Guarani', fab: 'Iveco / Exército Brasileiro', origem: 'BRA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/19_04_2022-_Dia_do_Ex%C3%A9rcito_Brasileiro_%2852016606453%29.jpg/330px-19_04_2022-_Dia_do_Ex%C3%A9rcito_Brasileiro_%2852016606453%29.jpg' },
    cacas:        { nome: 'F-39 Gripen E', fab: 'Saab / Embraer', origem: 'SWE', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg/330px-Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg' },
    artilharia:   { nome: 'ASTROS II', fab: 'Avibras', origem: 'BRA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Avibras_ASTROS-II_SS-30.JPEG/330px-Avibras_ASTROS-II_SS-30.JPEG' },
    navios:       { nome: 'Fragata Tamandaré', fab: 'thyssenkrupp / Emgepron', origem: 'BRA', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Fragata_%E2%80%9CTamandar%C3%A9%E2%80%9D_chega_pela_primeira_vez_ao_Rio_de_Janeiro_%2855336643549%29_%28cropped%29.jpg/330px-Fragata_%E2%80%9CTamandar%C3%A9%E2%80%9D_chega_pela_primeira_vez_ao_Rio_de_Janeiro_%2855336643549%29_%28cropped%29.jpg' },
    submarinos:   { nome: 'Submarino Riachuelo', fab: 'Naval Group / Itaguaí', origem: 'BRA', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Submarino_Riachuelo_%28S40%29_%2852816921064%29_%28cropped%29.jpg/330px-Submarino_Riachuelo_%28S40%29_%2852816921064%29_%28cropped%29.jpg' },
    infantaria:   { nome: 'Fuzileiro (IA2 5,56)', fab: 'IMBEL', origem: 'BRA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Exerc%C3%ADcio_conjunto_de_enfrentamento_ao_terrorismo_%2827103014582%29.jpg' },
    helicopteros: { nome: 'HM-4 Jaguar', fab: 'Helibras / Airbus', origem: 'FRA', proprio: 'licenca', foto: null, sugerido: true },
    drones:       { nome: 'Nauru 1000C', fab: 'XMobots', origem: 'BRA', proprio: true, foto: null, sugerido: true },
    porta_avioes: { nome: 'PHM Atlântico', fab: 'ex-Royal Navy', origem: 'GBR', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'MANSUP', fab: 'Avibras / Marinha', origem: 'BRA', proprio: true, foto: null, sugerido: true },
    bombardeiros: { nome: 'KC-390 (transporte)', fab: 'Embraer', origem: 'BRA', proprio: true, foto: null, sugerido: true },
  },
};
