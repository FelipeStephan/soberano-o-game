// FICHA DO MUNDO — Polônia, era 2026. Mesmo formato EXATO de src/dados/paises/bra.js.
//
// LÍDER FICTÍCIO: Marek Zawadzki. Personagem inventado (regra do projeto: o jogo tem
// missões de assassinato e não se modela violência contra pessoa viva real).
//
// País hoje NPC — este módulo é o rascunho pronto para promovê-lo a jogável.

export const PAIS_POL = {
  ficha: {
    ano: 2026,
    pais: 'Polônia',
    iso: 'POL',
    presidente: 'Presidente Marek Zawadzki',
    capital: 'Varsóvia',
    bandeira: '🦅',
    pino: { lat: 52.23, lng: 21.01 },

    resumo: `O país que aprendeu geografia da pior maneira: espremido entre a Alemanha e a Rússia,
partilhado e apagado do mapa três vezes, e sobrevivente das duas ocupações mais brutais do século
XX. Tirou a lição óbvia — nunca mais depender da bondade de ninguém — e virou o Estado que mais
rearma no planeta hoje: gasta acima de 4% do PIB em defesa, comprou tanque, obuseiro e caça
sul-coreano e americano aos milhares porque a Coreia entrega em dois anos e a Alemanha em dez.
É a maior economia do Leste europeu e a que mais cresce no bloco, o corredor logístico por onde
passa metade da ajuda à Ucrânia, e a fronteira física da OTAN com a guerra. Não tem ogivas — e há
quem, em voz cada vez menos baixa, pergunte por que não deveria hospedar as americanas. A rua é
dividida, o Judiciário virou campo de batalha político, e a única coisa em que todo polonês
concorda é sobre quem mora do outro lado do rio Bug.`,

    // Ponto de vista DA POLÔNIA. Sem chave própria (não há rel_polonia no catálogo padrão).
    relacoes: {
      rel_eua: 82,        // o aliado que importa: bases americanas, Patriot, Abrams. Washington é o seguro de vida
      rel_china: 10,      // comércio sim, confiança nenhuma — e a China abastecendo a máquina de guerra russa
      rel_ue: 55,         // maior beneficiária de fundos da história do bloco, e a mais briguenta sobre soberania
      rel_reino: 60,      // aliado de trincheira na OTAN, linha-dura sobre a Rússia como Varsóvia
      rel_russia: -95,    // não é rivalidade, é história pessoal: partilhas, Katyn, 1939, 1945. O piso da escala
      rel_india: 25,
      rel_japao: 45,
      rel_canada: 55,     // um milhão de descendentes de poloneses vota lá
      rel_australia: 35,
      rel_coreia: 78,     // o novo melhor amigo militar: K2, K9 e FA-50 salvaram o rearmamento
      rel_israel: 20,     // relação tensa por causa da lei do Holocausto e da memória de Jedwabne
      rel_ira: -20,
      rel_arabia: 25,
      rel_turquia: 40,    // sócios na OTAN e no drone Bayraktar
      rel_egito: 25,
      rel_indonesia: 20,
      rel_mexico: 20,
      rel_venezuela: -25,
      rel_ucrania: 65,    // irmão de armas E irrita ferida: o grão ucraniano barato quebra o fazendeiro polonês
      rel_taiwan: 25,     // simpatia entre quem tem vizinho grande demais, sem relação formal
      rel_paquistao: 15,
      rel_norte: -70,     // fornece munição e homens à Rússia — inimigo por procuração
      rel_brasil: 30,
    },

    tensoes: [
      'Fronteira direta com a guerra e com o aliado russo Belarus',
      'Judiciário e imprensa como campo de batalha político interno',
      'Rearmamento acelerado versus custo fiscal e dependência de fornecedor externo',
      'Grão e caminhoneiro ucranianos contra o produtor polonês',
    ],

    estadoInicial: {
      aprovacao: 42,
      estabilidade: 58,    // democracia sólida, mas polarizada e com instituições em disputa
      soft_power: 50,      // o capital moral de Estado-fronteira e o legado do Solidariedade
      seguranca: 40,       // guarda-chuva da OTAN por cima, drone russo cruzando a fronteira por baixo
      temp_guerra: 45,     // a fronteira mais quente da OTAN: hospeda a logística da guerra vizinha
      temp_economia: 60,   // a economia grande que mais cresce na UE
      liberdades: 70,
      poder_militar: 55,   // o maior exército terrestre da UE em formação acelerada
      // economia (US$ trilhões)
      pib: 0.86,
      tesouro: 0.21,       // reservas internacionais ~US$ 210 bi
      divida: 50,          // dívida/PIB moderada, subindo com o rearmamento
      aliquota: 35,
      // capacidades (0–100)
      inteligencia: 48,    // AW e SKW competentes e focadas no Leste, mas pequenas ao lado dos vizinhos
      capacidade_ind: 62,  // a PGZ reergue a base industrial de defesa — mas o grosso ainda é importado
      uranio: 20,
      territorio: 1,
      ogivas: 0,           // debate público real sobre hospedar ogivas americanas (nuclear sharing)
    },

    fiosSemente: [
      { tema: 'Fronteira com a guerra e provocação de Belarus', intensidade: 62, alvo_pressao: 'seguranca', atores: ['russia', 'ucrania'] },
      { tema: 'Rearmamento a 4% do PIB e o custo fiscal', intensidade: 50, alvo_pressao: 'temp_economia', atores: ['eua', 'coreia'] },
      { tema: 'Judiciário e imprensa em disputa política', intensidade: 48, alvo_pressao: 'estabilidade', atores: ['ue'] },
      { tema: 'Debate sobre hospedar ogivas americanas', intensidade: 40, alvo_pressao: 'ogivas', atores: ['eua', 'russia'] },
    ],
  },

  // ORDEM DE BATALHA (aproximada, 2024–2026). O exército em plena transformação:
  // legado soviético e Leopard saindo, K2/Abrams e K9 entrando aos lotes.
  forcas: {
    infantaria: 200000,   // ativa ~150 mil + Defesa Territorial (WOT) ~40 mil, rumo a 300 mil
    blindados: 700,       // Leopard 2, M1 Abrams, K2 Black Panther, PT-91 Twardy, T-72 saindo
    artilharia: 800,      // AHS Krab e K9 Thunder nacionais/coreanos, WR-40 Langusta, HIMARS
    helicopteros: 200,
    cacas: 100,           // F-16C/D Block 52, FA-50, MiG-29 e Su-22 legados, F-35 encomendado
    bombardeiros: 0,
    drones: 40,           // Bayraktar TB2, FlyEye e Warmate nacionais
    navios: 30,           // marinha pequena: fragatas ex-americanas, corvetas, o programa Miecznik
    submarinos: 1,        // o único, o ORP Orzeł classe Kobben, veterano e à beira da aposentadoria
    porta_avioes: 0,
    misseis: 100,         // HIMARS, Naval Strike Missile costeiro, Piorun MANPADS
    defesa_aerea: 20,     // Patriot (programa Wisła) + Narew + Piorun: o escudo em construção
    ogivas: 0,
  },

  empresas: [
    { id: 'orlen', nome: 'Orlen', setor: 'Energia', estatal: true, participacao: 49, valor: 0.02, margem: 0.05,
      petroleo: 0.7, logo: null, bonus: { pib: 0.12, seguranca: 2 },
      desc: 'O campeão nacional que engoliu a Lotos e a PGNiG e virou uma petroleira, uma distribuidora de gás e um instrumento de política externa num CNPJ só. O Estado manda, e usa a empresa para tirar a Polônia do gás russo — comprou o terminal de GNL e o gasoduto da Noruega para nunca mais depender de um cano de Moscou.' },
    { id: 'pge', nome: 'PGE', sigla: 'Polska Grupa Energetyczna', setor: 'Energia', estatal: true, participacao: 57, valor: 0.006, margem: 0.03,
      logo: null, bonus: { pib: 0.06, capacidade_ind: 2 },
      desc: 'Setenta por cento da eletricidade polonesa ainda sai de carvão, e é esta empresa que queima. Presa entre a meta climática de Bruxelas e a mina que emprega a Silésia inteira — descarbonizar aqui não é planilha, é questão de emprego e de voto.' },
    { id: 'kghm', nome: 'KGHM', setor: 'Mineração', estatal: true, participacao: 32, valor: 0.008, margem: 0.09,
      logo: null, bonus: { capacidade_ind: 2, pib: 0.05 },
      desc: 'Cobre e prata do subsolo da Baixa Silésia, e um dos maiores produtores de prata do mundo. O Estado tem o bloco de controle e trata a empresa como ativo estratégico: cobre é cabo, é munição, é a matéria-prima de tudo que se eletrifica ou explode.' },
    { id: 'pkobp', nome: 'PKO Bank Polski', setor: 'Financeiro', estatal: true, participacao: 29, valor: 0.02, margem: 0.08,
      logo: null, bonus: { temp_economia: 3, estabilidade: 2 },
      desc: 'O maior banco da Europa Central e o cofre por onde passa a economia polonesa. O Estado é o maior acionista e nomeia o conselho — quando o governo quer que o crédito flua para onde importa, é aqui que a torneira abre.' },
    { id: 'pgz', nome: 'PGZ', sigla: 'Polska Grupa Zbrojeniowa', setor: 'Defesa', estatal: true, participacao: 100, valor: 0.005, margem: 0.06,
      logo: null, bonus: { capacidade_ind: 5, poder_militar: 3 },
      desc: 'O conglomerado estatal que faz o obuseiro Krab, o blindado Rosomak sob licença e o MANPADS Piorun que virou best-seller de guerra. Cem por cento do Estado, e o coração da aposta polonesa de nunca mais depender de fábrica estrangeira para se defender — ainda que hoje monte metade sob licença coreana.' },
  ],

  equipamentos: {
    _nome: 'Polônia',
    // FOTOS VERIFICADAS no Wikimedia Commons (páginas de arquivo abertas e URL direta conferida):
    artilharia:   { nome: 'AHS Krab', fab: 'Huta Stalowa Wola', origem: 'POL', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Polish_Army_AHS_Krab_at_Radom-2023.jpg' },
    cacas:        { nome: 'F-16C Block 52+ Jastrząb', fab: 'Lockheed Martin', origem: 'USA', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Polish_Air_Force_%284041%29_F-16C_Block_52_%2826821408781%29.jpg' },
    infantaria:   { nome: 'Fuzileiro (FB MSBS Grot)', fab: 'FB Radom', origem: 'POL', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/MSBS_GROT%2C_Kyiv_2018%2C_51.jpg' },
    // SEM foto verificada — regra do projeto: não se inventa URL (foto errada é pior que foto nenhuma):
    blindados:    { nome: 'K2 Black Panther (K2PL)', fab: 'Hyundai Rotem / PGZ', origem: 'KOR', proprio: 'licenca', foto: null, sugerido: true },
    helicopteros: { nome: 'W-3 Sokół', fab: 'PZL-Świdnik', origem: 'POL', proprio: true, foto: null, sugerido: true },
    navios:       { nome: 'Fragata Gen. K. Pułaski (classe Oliver Hazard Perry)', fab: 'ex-US Navy', origem: 'USA', proprio: false, foto: null, sugerido: true },
    submarinos:   { nome: 'ORP Orzeł (classe Kobben)', fab: 'ex-Kongsberg / RDM', origem: 'NOR', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'M142 HIMARS', fab: 'Lockheed Martin', origem: 'USA', proprio: false, foto: null, sugerido: true },
    defesa_aerea: { nome: 'Piorun (MANPADS)', fab: 'Mesko / PGZ', origem: 'POL', proprio: true, foto: null, sugerido: true },
    drones:       { nome: 'FlyEye / Warmate', fab: 'WB Group', origem: 'POL', proprio: true, foto: null, sugerido: true },
  },
};

/* AUXILIARES — snippets prontos pra colar nos arquivos de src/dados/ quando POL virar jogável.
   (NÃO editar src/ neste lote — só referência.)

// ── src/dados/paises.js → PAISES ──────────────────────────────────────
POL: { nome: 'Polônia',          rel: 'rel_polonia', bloco: 'OTAN / UE',      forca: 58 },
// Artigo (paises.js → ARTIGO): 'Polônia': 'a'  → "da Polônia", "com a Polônia"

// ── src/dados/efetivoMilitar.js ───────────────────────────────────────
// EFETIVO_ATIVO: ativo ~150 mil regulares + ~40 mil Defesa Territorial; teto de recrutamento acima disso
POL: 216000,   // em EFETIVO_ATIVO
POL: 300000,   // em RESERVA_MILITAR (grande base de reservistas e alistáveis; meta de 300 mil na ativa)

// ── src/dados/petroleo.js → PETROLEO ──────────────────────────────────
// Importador: quase sem petróleo próprio, dependência histórica do cru russo (rompida via Orlen/Noruega)
POL: { reservas: 0.15, producao: 0.02, consumo: 0.6, custo: 30, tipo: 'Marginal', campo: 'Bacia dos Cárpatos',
       nota: 'Quase nenhum petróleo próprio. Passou 30 anos dependendo do oleoduto Druzhba russo e gastou uma fortuna para se livrar dele — terminal de GNL em Świnoujście e o gasoduto Baltic Pipe da Noruega. Energia, aqui, é segurança nacional antes de ser economia.' },

// ── src/dados/gabinetes.js → GABINETES (5 conselheiros, ids estáveis, NOMES FICTÍCIOS) ──
POL: [
  { id: 'sec_defesa', papel: 'Ministro da Defesa Nacional', nome: 'General Marek Ostrowski',
    personalidade: 'Rearma o país no ritmo de quem ouve o relógio da história bater. Compra tanque coreano e Abrams americano ao mesmo tempo e defende as duas coisas sem piscar — "não temos o luxo de esperar a fábrica europeia acordar". A fronteira com Belarus é a linha que ele desenha em toda reunião.' },
  { id: 'dir_cia', papel: 'Chefe da Agência de Inteligência (AW)', nome: 'Kazimierz Dąbrowski',
    personalidade: 'Sabe mais sobre Minsk e Kaliningrado do que sobre qualquer outra coisa, e acha que é assim que deve ser. Trata o serviço russo como adversário de família — três séculos de prática de parte a parte. "O senhor quer surpresa? Eu ofereço aviso. Escolha um."' },
  { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Wojciech Malinowski',
    personalidade: 'Administra a economia que mais cresce na UE e a conta de defesa que mais sobe no planeta, e reza para as duas curvas não se cruzarem. Vê o fundo europeu como oxigênio e como coleira. "Crescemos rápido, presidente. Só não me peça para pagar o exército inteiro à vista."' },
  { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Aleksander Nowak',
    personalidade: 'Briga com Bruxelas sobre soberania de manhã e implora coesão contra Moscou à tarde, e não vê contradição. Acha que a Europa Ocidental levou 2022 para acreditar no que a Polônia dizia desde 1991. Cita a partilha de 1795 quando alguém sugere confiar demais em alguém.' },
  { id: 'chefe_gabinete', papel: 'Chefe da Chancelaria do Primeiro-Ministro', nome: 'Piotr Sikorski',
    personalidade: 'Conta cadeira no Sejm e manchete no tabloide católico com a mesma precisão. Sabe qual juiz e qual bispo movem qual voto. Traz a pesquisa ruim junto com o lembrete de que aqui todo governo cai por briga interna antes de cair por inimigo externo.' },
],
*/
