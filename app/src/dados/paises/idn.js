// FICHA DO MUNDO — Indonésia, era 2026.
// Segue o molde de eua-2026.js.
//
// Coerente com dados/petroleo.js: IDN tem apenas 2 bi de barris de reserva, produz 0,6 e
// consome 1,8 milhão de barris/dia. Ou seja: importa o triplo do que bombeia. Saiu da OPEP
// quando virou importador líquido — ver comentário na ficha da Pertamina.
//
// Líder FICTÍCIO (regra do projeto).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_IDN = {
  ficha: {
    ano: 2026,
    pais: 'Indonésia',
    iso: 'IDN',
    presidente: 'Bagas Wirakusuma',   // fictício
    capital: 'Jacarta',
    bandeira: '🌋',
    pino: { lat: -6.2, lng: 106.85 },

    resumo: `Quarto país mais populoso do planeta, ~280 milhões de pessoas, a maior população
muçulmana do mundo, e um arquipélago de 17 mil ilhas espalhado por 5 mil km — três fusos
horários de país. PIB de US$ 1,4 trilhão, o maior do sudeste asiático, crescendo ~5% ao ano
com estabilidade que envergonha vizinho. Democracia funcional desde 1998, o que é notável
para quem passou 32 anos sob ditadura militar. Não-alinhada por doutrina desde a Conferência
de Bandung, em 1955 — que ela própria organizou. Sentada no Estreito de Malaca, por onde
passa um quarto do comércio marítimo do mundo, e sobre a maior reserva de níquel do planeta,
que é a peça que faz bateria de carro elétrico. Duas alavancas que ela sabe que tem.`,

    // Ponto de vista de Jacarta. Sem rel_indonesia.
    relacoes: {
      rel_china: 35,       // maior parceiro comercial E o país que reivindica água dentro da ZEE
                           // indonésia perto de Natuna. Jacarta vende níquel e manda navio de
                           // patrulha na mesma semana. Isso não é contradição, é a doutrina.
      rel_eua: 40,         // parceria estratégica sem aliança. Jacarta não assina tratado com ninguém.
      rel_japao: 60,       // maior investidor histórico; a indústria automotiva do país é japonesa
      rel_australia: 35,   // vizinho grande, relação em turnos: Timor-Leste, escuta telefônica,
                           // AUKUS. Coopera e desconfia em proporções estáveis.
      rel_india: 50,       // Oceano Índico, exercício naval conjunto, e ambos não-alinhados de ofício
      rel_coreia: 55,      // sócios no caça KF-21 — no qual Jacarta atrasou o pagamento e renegociou
      rel_ue: 25,          // litígio na OMC sobre a proibição de exportar níquel bruto. Bruxelas
                           // ganhou o caso; Jacarta manteve a política e recorreu. Ver Antam.
      rel_reino: 30,
      rel_russia: 25,      // comprou Su-27/Su-30 e desistiu dos Su-35 sob ameaça de sanção americana
      rel_arabia: 45,      // Meca e a maior operação de peregrinação do mundo, todo ano
      rel_ira: 20,
      rel_israel: -55,     // não tem relação diplomática. Custo interno de ter seria alto demais.
      rel_turquia: 45,
      rel_brasil: 30,      // dois gigantes de commodity que quase não se falam
      rel_ucrania: 10,     // ofereceu plano de paz em 2023 e apanhou de todo mundo por isso
      rel_norte: 15,       // relação antiga e cordial, herança da era Sukarno e do não-alinhamento
      rel_taiwan: 15,      // Uma China no papel; comércio e mão de obra na prática
      rel_paquistao: 45,
      rel_canada: 25,
      rel_mexico: 15,
      rel_venezuela: 10,
      rel_egito: 40,       // Al-Azhar forma clero indonésio há um século
    },

    tensoes: [
      'Mar do Sul da China e a ZEE das ilhas Natuna',
      'Controle da cadeia de níquel e litígio comercial com a UE',
      'Mudança da capital para Nusantara e o custo dela',
      'Separatismo em Papua',
      'Segurança do Estreito de Malaca',
    ],

    estadoInicial: {
      aprovacao: 58,
      estabilidade: 62,     // democracia consolidada, alternância pacífica, e um Estado que
                            // administra 17 mil ilhas sem se partir — o que é a proeza real da ficha
      soft_power: 45,       // G20, ASEAN, presidiu Bandung. Influência subestimada e ela sabe.
      seguranca: 58,
      temp_guerra: 20,      // sem guerra e sem intenção. Não-alinhamento é política de Estado, não de governo.
      temp_economia: 62,    // ~5% ao ano há uma década, inflação controlada, demografia jovem
      liberdades: 55,
      poder_militar: 42,    // ver comentário em `forcas`
      // economia (US$ trilhões)
      pib: 1.4,             // maior economia do sudeste asiático, 16ª do mundo
      tesouro: 0.145,       // reservas cambiais sólidas, ~7 meses de importação
      divida: 39,           // dívida/PIB ~39%. Teto legal de 60% escrito em lei desde a crise
                            // asiática de 1998 — aprenderam a lição na marra e mantiveram.
      aliquota: 12,         // arrecadação baixa para o tamanho: o buraco fiscal estrutural
      // capacidades (0–100)
      inteligencia: 45,
      capacidade_ind: 55,   // faz navio, munição e monta caça em parceria; não faz motor nem chip
      uranio: 15,           // tem minério mapeado e nenhum programa. Zero ambição nuclear militar.
      territorio: 1,
      ogivas: 0,            // signatária do TNP e do Tratado de Bangkok, que faz do sudeste asiático
                            // zona livre de armas nucleares. Não é falta de capacidade — é escolha.
    },

    fiosSemente: [
      { tema: 'Incursões chinesas na ZEE de Natuna', intensidade: 55, alvo_pressao: 'seguranca', atores: ['china'] },
      { tema: 'Guerra do níquel e litígio com a UE', intensidade: 50, alvo_pressao: 'temp_economia', atores: ['china'] },
      { tema: 'Custo da nova capital em Nusantara', intensidade: 45, alvo_pressao: 'aprovacao', atores: [] },
      { tema: 'Separatismo em Papua', intensidade: 40, alvo_pressao: 'estabilidade', atores: [] },
    ],
  },

  // ORDEM DE BATALHA (aproximada).
  // Um país que é 17 mil ilhas deveria ter marinha e aviação enormes, e tem exército de terra.
  // Motivo histórico: as Forças Armadas foram desenhadas na era Suharto para segurança INTERNA —
  // conter separatismo e sustentar o regime — não para projetar poder. A doutrina mudou depois
  // de 1998; o inventário está mudando devagar, porque casco e caça levam décadas.
  forcas: {
    infantaria: 400000,
    blindados: 400,       // Leopard 2A4 alemães usados, comprados quando Berlim ainda vendia
    artilharia: 800,      // inclui o Astros brasileiro da Avibras — cliente antigo
    helicopteros: 180,    // AH-64E Apache e frota de transporte, essencial num arquipélago
    cacas: 110,           // a frota mais eclética do mundo: F-16 americanos, Su-27/Su-30 russos,
                          // Hawk britânicos, Rafale franceses a caminho e o KF-21 coreano em
                          // desenvolvimento. Isso é não-alinhamento virando logística: nenhum
                          // fornecedor consegue embargar Jacarta sozinho, porque nenhum é único.
                          // O preço é um pesadelo de manutenção com cinco cadeias de peça distintas.
    bombardeiros: 0,
    drones: 60,           // CH-4 chineses + ANKA turcos encomendados
    navios: 160,          // muitos cascos, quase todos pequenos: corveta, patrulha, desembarque.
                          // Para 17 mil ilhas, quantidade importa mais que tonelagem.
    submarinos: 4,        // Type 209 alemães + Nagapasa montados com a Coreia do Sul. Em 2021 o
                          // KRI Nanggala afundou em exercício e morreram os 53 a bordo — o país
                          // perdeu um terço da frota submarina e uma tripulação inteira num dia.
    porta_avioes: 0,
    misseis: 100,         // antinavio Exocet, Yakhont e C-802: a doutrina de negação de estreito
    defesa_aerea: 6,     // NASAMS em Jacarta e pouco mais: 17 mil ilhas, quase nenhum guarda-chuva
    ogivas: 0,
  },

  empresas: [
    { id: 'pertamina', nome: 'Pertamina', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.06, margem: 0.05, petroleo: 0.6, logo: null,
      bonus: { pib: 0.1, estabilidade: 2 },
      desc: 'Fundador da OPEP em 1962 e a única a sair do cartel por vergonha aritmética: em 2008 o país passou a importar mais petróleo do que produzia, e ficar num clube de exportadores importando ficou insustentável. Voltou em 2015, saiu de novo em 2016. Hoje bombeia 0,6 e o país consome 1,8 — a conta de importação é o maior item do orçamento e o subsídio ao combustível é a terceira linha. Mexer no preço da gasolina aqui já derrubou governo.' },
    { id: 'antam', nome: 'Aneka Tambang', sigla: 'ANTM', setor: 'Mineração', estatal: true, participacao: 65,
      valor: 0.005, margem: 0.10, logo: null,
      bonus: { pib: 0.06, capacidade_ind: 4 },
      desc: 'Níquel, ouro e bauxita. A Indonésia tem a maior reserva de níquel do planeta e fez a jogada mais inteligente de um país de commodity em décadas: proibiu a exportação do minério bruto em 2020 e obrigou quem quisesse comprar a construir fundição em solo indonésio. A UE processou na OMC e ganhou. Jacarta recorreu, manteve a política, e viu a exportação de produto de níquel saltar de US$ 3 bi para mais de US$ 30 bi. Perdeu o caso e ganhou a década.' },
    { id: 'pln', nome: 'Perusahaan Listrik Negara', sigla: 'PLN', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.03, margem: 0.02, logo: null,
      bonus: { capacidade_ind: 3, aprovacao: 2 },
      desc: 'Monopólio elétrico de um país feito de ilhas — cada rede é uma ilha, literalmente, e não dá pra interligar oceano. Movida a carvão porque o país tem carvão de sobra, o que faz dela o problema climático nacional e a fonte de energia barata que sustenta a fundição de níquel. As duas coisas, ao mesmo tempo.' },
    { id: 'pindad', nome: 'Pindad', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.002, margem: 0.06, logo: null,
      bonus: { capacidade_ind: 3, poder_militar: 2 },
      desc: 'Faz fuzil, munição e blindado leve em Bandung. O Anoa roda em missão da ONU e virou exportação. Modesta e funcional — e num arquipélago que compra de cinco fornecedores diferentes, a fábrica que não precisa de licença de ninguém vale mais do que o balanço mostra.' },
    { id: 'ptdi', nome: 'Dirgantara Indonesia', sigla: 'PTDI', setor: 'Aeroespacial', estatal: true, participacao: 100,
      valor: 0.002, margem: 0.01, logo: null,
      bonus: { capacidade_ind: 3, soft_power: 1 },
      desc: 'A aposta industrial de Suharto: um país de terceiro mundo fabricando avião. Quase quebrou na crise de 1998 e o FMI mandou fechar. Sobreviveu. Hoje faz o CN-235 sob licença espanhola, exporta para vizinho e é sócia minoritária no caça coreano KF-21 — sociedade em que Jacarta já atrasou o pagamento e renegociou a fatia para baixo.' },
    { id: 'bri', nome: 'Bank Rakyat Indonesia', sigla: 'BRI', setor: 'Financeiro', estatal: true, participacao: 53,
      valor: 0.04, margem: 0.20, logo: null,
      bonus: { temp_economia: 4, estabilidade: 3 },
      desc: 'O maior banco de microcrédito do mundo: milhões de contas em vilarejo onde não existe agência de mais ninguém. Margem de 20% emprestando pouco para muita gente — o oposto do que a teoria diz que dá certo. Dá.' },
  ],

  equipamentos: {
    _nome: 'Indonésia',
    blindados:    { nome: 'Leopard 2A4',         fab: 'Krauss-Maffei (usado, ex-Bundeswehr)', origem: 'DEU', proprio: false,
      foto: `${W}/7/7e/Ranpur_Leopard_2A4_melaksanakan_Latihan_Taktis_Tingkat_Kompi_sebagai_latihan_pemantapan_kemampuan_bertempur%2C_Grati%2C_Pasuruan_17-09-2021.jpg/330px-Ranpur_Leopard_2A4_melaksanakan_Latihan_Taktis_Tingkat_Kompi_sebagai_latihan_pemantapan_kemampuan_bertempur%2C_Grati%2C_Pasuruan_17-09-2021.jpg` },
    submarinos:   { nome: 'Classe Nagapasa',     fab: 'DSME / PT PAL',         origem: 'KOR', proprio: 'licenca',
      foto: `${W}/d/d3/Submarine_KRI_Nagapasa%2C_Indonesian_Navy.jpg/330px-Submarine_KRI_Nagapasa%2C_Indonesian_Navy.jpg` },
    cacas:        { nome: 'F-16C/D Fighting Falcon', fab: 'Lockheed Martin',   origem: 'USA', proprio: false, foto: null, sugerido: true },
    // Sem foto verificada de F-16 indonésio no Commons — as buscas só retornaram exemplares
    // de outras forças aéreas. Logo/bandeira errada já apareceu no jogo uma vez; não repetimos.
    helicopteros: { nome: 'AH-64E Apache Guardian', fab: 'Boeing',            origem: 'USA', proprio: false, foto: null, sugerido: true },
    artilharia:   { nome: 'ASTROS II',           fab: 'Avibras',               origem: 'BRA', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'CH-4 Rainbow',        fab: 'CASC',                  origem: 'CHN', proprio: false, foto: null, sugerido: true },
    navios:       { nome: 'Fragata classe Martadinata', fab: 'Damen / PT PAL', origem: 'IDN', proprio: 'licenca', foto: null, sugerido: true },
    misseis:      { nome: 'C-705 / Exocet MM40', fab: 'CASIC / MBDA',          origem: 'CHN', proprio: false, foto: null, sugerido: true },
    bombardeiros: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
    porta_avioes: { nome: '—',                   fab: '—',                     origem: '—',   proprio: false, foto: null },
  },
};
