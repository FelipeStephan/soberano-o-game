// FICHA DO MUNDO — Coreia do Norte, era 2026.
// Segue o molde de eua-2026.js.
//
// AVISO DE DADOS: praticamente todo número aqui é ESTIMATIVA de terceiros (Banco da Coreia
// do Sul, ONU, IISS). A RPDC não publica estatística econômica desde os anos 1960. Onde há
// chute, está comentado.
//
// AVISO DE TOM: o cinismo desta ficha é com o regime. A fome no país é real, documentada e
// matou gente — não é material de piada. Ver comentário em `aprovacao`.
//
// Líder FICTÍCIO (regra do projeto).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_PRK = {
  ficha: {
    ano: 2026,
    pais: 'Coreia do Norte',
    iso: 'PRK',
    presidente: 'Ri Chol-min',      // fictício. Cargo real: Líder Supremo.
    cargo: 'Líder Supremo',
    capital: 'Pyongyang',
    bandeira: '⭐',
    pino: { lat: 39.03, lng: 125.75 },

    resumo: `O Estado mais fechado do planeta e o mais bem-sucedido em uma coisa só:
sobreviver. Economia de talvez US$ 30 bilhões — menos que a de um estado médio brasileiro —
sustentando o 4º maior exército do mundo em efetivo. Sancionada desde 2006 e ainda assim
com arsenal nuclear operacional e ICBM testado. Financia o Estado com o que consegue:
carvão contrabandeado, trabalhadores exportados e roubo de criptomoeda em escala industrial.
Dependente da China para quase tudo que atravessa a fronteira. A arma nuclear não é
ambição — é a apólice de seguro do regime, e ele sabe exatamente o que aconteceu com
Kadafi depois que ele abriu mão da dele.`,

    // Ponto de vista de Pyongyang. Sem rel_norte.
    relacoes: {
      rel_eua: -85,         // tecnicamente em guerra desde 1953: houve armistício, nunca tratado de paz
      rel_coreia: -55,      // ver comentário abaixo — é a relação mais complicada da ficha
      rel_japao: -80,       // colonização até 1945 e a questão dos sequestrados: ferida não fechada
      rel_china: 55,        // ~90% do comércio externo. Não é amizade, é dependência com ressentimento.
      rel_russia: 70,       // munição e homens em troca de comida, combustível e tecnologia. O melhor negócio do regime em décadas.
      rel_ira: 45,          // cooperação de mísseis de longa data, discreta e mútua
      rel_ue: -50,
      rel_reino: -50,
      rel_israel: -45,
      rel_taiwan: -20,
      rel_arabia: -25,
      rel_ucrania: -60,     // consequência direta do alinhamento com Moscou
      rel_india: -10,
      rel_brasil: 5,        // mantém embaixada em Brasília. Quase ninguém sabe.
      rel_mexico: -5,
      rel_canada: -55,
      rel_australia: -50,
      rel_turquia: -15,
      rel_paquistao: 25,    // histórico de troca: centrífuga por míssil, nos anos 90
      rel_venezuela: 30,
      rel_indonesia: 15,    // uma das poucas relações antigas e cordiais, herança do não-alinhamento
      rel_egito: 20,        // vínculo militar desde 1973
    },
    // rel_coreia: negativo, mas "complicado" é a palavra certa. São o MESMO POVO dividido
    // por uma linha traçada em 1945 por dois estranhos olhando um mapa. Há famílias separadas
    // há três gerações que nunca mais se viram. O regime trata Seul como inimigo e como
    // província a reunificar, ao mesmo tempo, e a doutrina oficial oscila entre as duas
    // coisas conforme a conveniência. Não é ódio simples. Nunca foi.

    tensoes: [
      'Programa nuclear e testes de ICBM sob sanções da ONU',
      'Dependência quase total da China para comércio e combustível',
      'Insegurança alimentar crônica',
      'Armistício de 1953 sem tratado de paz com Seul e Washington',
      'Aproximação militar com Moscou desde 2023',
    ],

    estadoInicial: {
      // 85 de "aprovação" NÃO é apoio. É o que um Estado mede quando dissentir custa a
      // liberdade da sua família até a terceira geração por culpa hereditária. O número
      // alto aqui é sintoma de repressão, não de legitimidade — e é frágil exatamente
      // por isso: ninguém sabe o que há embaixo, inclusive o próprio regime.
      aprovacao: 85,
      estabilidade: 70,     // estável no sentido de que não muda. Três sucessões dinásticas sem golpe.
      soft_power: 8,        // nenhum. O país é uma anedota diplomática e uma ameaça, nessa ordem.
      seguranca: 55,        // a dissuasão nuclear funciona; o resto do aparato é de 1980
      temp_guerra: 45,      // permanentemente mobilizado, permanentemente sem atacar
      temp_economia: 18,    // economia de comando + sanção total
      liberdades: 2,        // o país mais fechado do planeta. Sem internet, sem saída, sem imprensa.
      poder_militar: 52,    // gigante no papel, obsoleto no hangar, letal no arsenal estratégico
      // economia (US$ trilhões)
      // ~US$ 30 bi é ESTIMATIVA do Banco da Coreia do Sul, feita por inferência (imagem de
      // satélite, dados de comércio da China, fluxo de energia). A margem de erro é enorme.
      // A RPDC não divulga PIB. Ninguém sabe o número real, provavelmente nem Pyongyang.
      pib: 0.03,
      tesouro: 0.002,       // caixa opaco: cripto roubada, carvão contrabandeado, mão de obra exportada
      divida: 25,           // deu calote nos anos 1980 e nunca mais tomou emprestado de ninguém que cobre
      aliquota: 0,          // aboliu impostos em 1974 por decreto. O Estado é dono de tudo, então não precisa.
      // capacidades (0–100)
      inteligencia: 62,     // o Lazarus Group rouba cripto em escala de bilhões e financia o programa
                            // de mísseis com isso. É o ciberexército mais lucrativo do mundo.
      capacidade_ind: 38,   // faz míssil balístico intercontinental e não faz peça de trator
      uranio: 70,           // minério doméstico abundante + Yongbyon enriquecendo há décadas
      territorio: 1,
      ogivas: 50,           // estimativa (~50). Material físsil para talvez o dobro.
    },

    fiosSemente: [
      { tema: 'Teste de ICBM e resposta do Conselho de Segurança', intensidade: 70, alvo_pressao: 'seguranca', atores: ['eua', 'coreia', 'japao'] },
      { tema: 'Dependência de Pequim para combustível e comida', intensidade: 60, alvo_pressao: 'temp_economia', atores: ['china'] },
      { tema: 'Insegurança alimentar e colheita ruim', intensidade: 55, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Munição e tropas trocadas com Moscou', intensidade: 50, alvo_pressao: 'soft_power', atores: ['russia', 'ucrania'] },
    ],
  },

  // ORDEM DE BATALHA (estimativas do IISS — não há dado oficial).
  // O paradoxo da ficha: o 4º maior exército do mundo em EFETIVO e um dos mais obsoletos
  // em EQUIPAMENTO. 1,2 milhão de fardas com material de 1970. A doutrina real não é
  // vencer uma guerra convencional — é tornar o custo de invadir alto demais, e o resto
  // é dissuasão nuclear e artilharia apontada para Seul, a 40 km da fronteira.
  forcas: {
    infantaria: 1200000,
    blindados: 3500,      // Chonma-ho e Pokpung-ho: derivados locais do T-62. O T-62 é de 1961.
    artilharia: 8000,     // a arma real do regime. Milhares de tubos ao alcance da capital vizinha —
                          // é isso, e não o míssil, que congela qualquer opção militar contra o país.
    helicopteros: 200,    // inclui Hughes 500 comprados por triangulação nos anos 80, driblando embargo
    cacas: 400,           // MiG-21, MiG-23, alguns MiG-29. Museu voador — e voa pouco: não há
                          // querosene para treinar. Piloto norte-coreano voa poucas horas por ano.
    bombardeiros: 80,     // Il-28, projeto de 1948. Continua na ordem de batalha.
    drones: 300,          // cópias de modelos antigos + reconhecimento rudimentar
    navios: 400,          // quase tudo lancha costeira. Marinha de negação de área, não de mar aberto.
    submarinos: 70,       // o número engana. A maioria é mini-submarino Sang-O/Yono de 20–30 metros,
                          // costeiro, para infiltrar comando — não para patrulhar oceano. Muitos
                          // ficam atracados: falta combustível e peça. Mas em 2010 um deles afundou
                          // a corveta Cheonan e matou 46 marinheiros. Obsoleto não é inofensivo.
    porta_avioes: 0,
    misseis: 600,         // A DOUTRINA. Scud, Nodong, Hwasong. Tudo que o país não consegue fazer
    defesa_aerea: 40,    // KN-06 novo por cima de um parque S-200 dos anos 60 — quantidade cobrindo obsolescência
                          // convencionalmente foi despejado no programa balístico — é o único setor
                          // com dinheiro, engenheiro e prioridade.
    ogivas: 50,
  },

  empresas: [
    { id: 'korea_mining', nome: 'Korea Mining Development Trading Corp', sigla: 'KOMID', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.002, margem: 0.15, logo: null,
      bonus: { capacidade_ind: 3, poder_militar: 2 },
      desc: 'A maior exportadora de armas do país e a primeira entidade norte-coreana sancionada pela ONU. Vendeu míssil para o Irã, Síria e Egito. Continua vendendo, agora com outro nome e outro CNPJ — é mais barato trocar de fachada que de negócio.' },
    { id: 'korea_kumgang', nome: 'Korea Kumgang Group', setor: 'Mineração', estatal: true, participacao: 100,
      valor: 0.004, margem: 0.08, logo: null,
      bonus: { pib: 0.01, uranio: 3 },
      desc: 'Carvão, ferro e magnesita, que o país tem em abundância e não consegue vender legalmente. A frota vai até o alto-mar, desliga o transponder e transborda a carga para navio chinês. A ONU fotografa, publica relatório e o navio volta na semana seguinte.' },
    { id: 'air_koryo', nome: 'Air Koryo', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.001, margem: -0.02, logo: null,
      bonus: { soft_power: 1 },
      desc: 'A única companhia aérea do país e a única do mundo já classificada com uma estrela por avaliadores independentes. Voa para Pequim e Vladivostok, e basicamente para mais lugar nenhum. Frota soviética. É menos uma empresa que um cordão umbilical.' },
    { id: 'lazarus', nome: 'Bureau 121', setor: 'Tecnologia', estatal: true, participacao: 100,
      valor: 0.003, margem: 0.40, logo: null,
      bonus: { inteligencia: 6, tesouro: 0.001 },
      desc: 'A unidade cibernética militar. Roubou mais de um bilhão de dólares em criptomoeda de exchanges mundo afora e financia com isso o programa de mísseis. Margem de 40% porque o custo de produção é um prédio, eletricidade e alguns milhares de operadores. É a estatal mais rentável da ficha, e a única que não precisa de porto.' },
  ],

  equipamentos: {
    _nome: 'Coreia do Norte',
    blindados:    { nome: 'Pokpung-ho',          fab: 'Segunda Comissão Econômica', origem: 'PRK', proprio: true,
      foto: `${W}/5/53/North_Korea_Victory_Day_122_%289465927866%29.jpg/330px-North_Korea_Victory_Day_122_%289465927866%29.jpg` },
    artilharia:   { nome: 'M-1978 Koksan',       fab: 'Indústria estatal',     origem: 'PRK', proprio: true,
      foto: `${W}/9/99/M-1978_Koksan.jpg/330px-M-1978_Koksan.jpg` },
    misseis:      { nome: 'Hwasong (série)',     fab: 'Academia de Ciências da Defesa', origem: 'PRK', proprio: true,
      foto: `${W}/3/35/North_Korea%27s_ballistic_missile_-_North_Korea_Victory_Day-2013_01.jpg/330px-North_Korea%27s_ballistic_missile_-_North_Korea_Victory_Day-2013_01.jpg` },
    submarinos:   { nome: 'Classe Sang-O',       fab: 'Estaleiro de Sinpo',    origem: 'PRK', proprio: true,
      foto: `${W}/b/b9/Gangneung_sub_8990.jpg/330px-Gangneung_sub_8990.jpg` },
    // A foto do Sang-O é de um que encalhou em Gangneung, na Coreia do Sul, em 1996, durante
    // uma missão de infiltração que deu errado. É a melhor imagem pública que existe da classe —
    // porque foi o outro lado que fotografou.
    cacas:        { nome: 'MiG-29',              fab: 'Mikoyan / montagem local', origem: 'RUS', proprio: 'licenca',
      foto: null, sugerido: true },
    // Sem foto verificada: não há imagem confirmada de MiG-29 da RPDC no Commons. O país
    // não faz air show. Regra do projeto: não se inventa URL.
    helicopteros: { nome: 'Mi-2',                fab: 'Mil / PZL',             origem: 'RUS', proprio: false, foto: null, sugerido: true },
    bombardeiros: { nome: 'Il-28',               fab: 'Ilyushin',              origem: 'RUS', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'Banghyun (série)',    fab: 'Indústria estatal',     origem: 'PRK', proprio: true,  foto: null, sugerido: true },
    navios:       { nome: 'Corveta classe Nampo', fab: 'Estaleiros estatais',  origem: 'PRK', proprio: true,  foto: null, sugerido: true },
    porta_avioes: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
  },
};
