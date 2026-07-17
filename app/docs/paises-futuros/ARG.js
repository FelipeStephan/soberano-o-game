// FICHA DO MUNDO — Argentina, era 2026. Mesmo formato EXATO de src/dados/paises/bra.js.
//
// LÍDER FICTÍCIO: Ramiro Costa. Personagem inventado (regra do projeto: o jogo tem
// missões de assassinato e não se modela violência contra pessoa viva real).
//
// País hoje NPC — este módulo é o rascunho pronto para promovê-lo a jogável.

export const PAIS_ARG = {
  ficha: {
    ano: 2026,
    pais: 'Argentina',
    iso: 'ARG',
    presidente: 'Presidente Ramiro Costa',
    capital: 'Buenos Aires',
    bandeira: '☀️',
    pino: { lat: -34.6, lng: -58.38 },

    resumo: `O país que já foi o sétimo mais rico do mundo em 1913 e passou o século seguinte
provando que se pode empobrecer sem guerra, sem praga e sem invasão — só com política econômica.
Deu ao planeta a maior seleção de futebol, um Papa, o tango, e a tabela periódica de crises
cambiais: nove calotes soberanos, uma hiperinflação de 3000%, e a maior dívida já contraída com o
FMI. E, ao mesmo tempo, senta sobre Vaca Muerta — a segunda maior reserva de gás de xisto do
planeta — enriquece o próprio urânio, faz reator de pesquisa que exporta e lançou satélite ao
espaço com foguete nacional. Tem tudo para ser rico e uma memória muscular de como não ser. A
questão das Malvinas, perdida em 1982, ainda ferve na Constituição e no discurso, mas não no
orçamento: as Forças Armadas, sucateadas desde a ditadura e a derrota, mal conseguem manter um
submarino boiando. O talento sobra; o dólar, nunca.`,

    // Ponto de vista DA ARGENTINA. Sem chave própria (não há rel_argentina no catálogo padrão).
    relacoes: {
      rel_eua: 55,        // o FMI é Washington, e Washington decide se a próxima parcela sai
      rel_china: 40,      // swap de moeda que segura as reservas, soja e o porto que Pequim quer
      rel_ue: 45,         // Mercosul-UE eterno, e a Espanha e a Itália como matriz de meio país
      rel_reino: -35,     // Malvinas: a ferida de 1982 que a Constituição não deixa cicatrizar
      rel_russia: 15,
      rel_india: 30,
      rel_japao: 35,
      rel_canada: 30,     // concorrente no agro e no lítio
      rel_australia: 25,  // rival direto no minério e na carne
      rel_coreia: 30,
      rel_israel: 25,     // maior colônia judaica da América Latina, e os atentados de 1992 e 1994 sem resposta
      rel_ira: -30,       // suspeito dos atentados à AMIA; ferida aberta há três décadas
      rel_arabia: 25,
      rel_turquia: 25,
      rel_egito: 20,
      rel_indonesia: 20,
      rel_mexico: 40,     // dois pesos-pesados latinos que se admiram e comerciam pouco
      rel_venezuela: 10,  // dois modelos econômicos opostos e a memória do chavismo como fantasma eleitoral
      rel_ucrania: 20,
      rel_taiwan: 15,     // sem relação formal — o comércio e o swap com Pequim pesam
      rel_paquistao: 10,
      rel_norte: -20,
      rel_brasil: 55,     // o vizinho, o rival de campo e o maior parceiro comercial: casamento sem divórcio possível
    },

    tensoes: [
      'Inflação, dívida com o FMI e a fuga eterna para o dólar',
      'Malvinas: a soberania perdida que segue na Constituição',
      'Forças Armadas sucateadas desde a ditadura e 1982',
      'Vaca Muerta: a riqueza de xisto que falta capital e duto para escoar',
    ],

    estadoInicial: {
      aprovacao: 40,       // montanha-russa: o ajuste dói antes de a inflação ceder
      estabilidade: 38,    // instabilidade crônica, choque de austeridade, rua tensa
      soft_power: 55,      // Messi, o Papa, o tango, Malbec e uma diáspora cultural imensa
      seguranca: 48,       // sem ameaça externa real; o crime cresce em Rosário, não na fronteira
      temp_guerra: 12,     // baixíssimo: Malvinas está congelada, não quente
      temp_economia: 25,   // economia em terapia intensiva: austeridade para matar a inflação
      liberdades: 68,
      poder_militar: 22,   // Forças Armadas esvaziadas por 40 anos de crise e desconfiança pós-ditadura
      // economia (US$ trilhões)
      pib: 0.63,           // volátil como poucos: o número muda com o câmbio
      tesouro: 0.03,       // reservas líquidas historicamente magras, por vezes negativas
      divida: 85,          // o maior devedor da história do FMI
      aliquota: 29,
      // capacidades (0–100)
      inteligencia: 30,    // a SIDE, reformada e refundada mil vezes, mais voltada para dentro
      capacidade_ind: 42,  // INVAP (reatores, radar, satélite) e CNEA de ponta, cercados de desindustrialização
      uranio: 45,          // enriquece urânio para fins pacíficos; ABACC com o Brasil; INVAP exporta reator
      territorio: 1,
      ogivas: 0,           // teve programa nuclear militar nos anos 70–80; abandonado, hoje 100% civil
    },

    fiosSemente: [
      { tema: 'Inflação e a próxima parcela do FMI', intensidade: 70, alvo_pressao: 'temp_economia', atores: ['eua'] },
      { tema: 'Fuga para o dólar e corrida cambial', intensidade: 60, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Malvinas e a soberania inegociável', intensidade: 35, alvo_pressao: 'aprovacao', atores: ['reino'] },
      { tema: 'Vaca Muerta: capital e duto para escoar o xisto', intensidade: 45, alvo_pressao: 'pib', atores: ['eua', 'china'] },
    ],
  },

  // ORDEM DE BATALHA (aproximada). Forças esvaziadas: efetivo razoável, meio de combate
  // envelhecido, e uma marinha que perdeu um submarino inteiro (ARA San Juan, 2017) sem
  // ter caixa para repô-lo. O talento humano existe; a manutenção, não.
  forcas: {
    infantaria: 75000,    // conscrição abolida em 1994; força profissional pequena
    blindados: 300,       // TAM (Tanque Argentino Mediano) nacional + SK-105 austríacos envelhecidos
    artilharia: 200,      // CITER 155mm nacional e peças rebocadas legadas
    helicopteros: 50,
    cacas: 24,            // os F-16 comprados usados da Dinamarca em 2024 — a primeira supersônica em anos
    bombardeiros: 0,
    drones: 10,
    navios: 15,           // destróieres MEKO 360, corvetas MEKO 140, patrulheiros — todos veteranos
    submarinos: 1,        // o ARA Santa Cruz (TR-1700); o irmão San Juan afundou com 44 a bordo em 2017
    porta_avioes: 0,      // o ARA Veinticinco de Mayo virou sucata há décadas
    misseis: 20,          // Exocet legado da era das Malvinas
    defesa_aerea: 5,      // praticamente inexistente: o céu argentino é aberto
    ogivas: 0,
  },

  empresas: [
    { id: 'ypf', nome: 'YPF', setor: 'Energia', estatal: true, participacao: 51, valor: 0.015, margem: 0.08,
      petroleo: 0.6, logo: null, bonus: { pib: 0.15, capacidade_ind: 3 },
      desc: 'Renacionalizada em 2012 tomando as ações da espanhola Repsol — processo que ainda corre em Nova York e pode custar bilhões. É a chave de Vaca Muerta: a segunda maior reserva de gás de xisto do mundo, parada por falta de duto, dólar e paciência. Se o país tem uma saída pela riqueza, ela passa por aqui.' },
    { id: 'tenaris', nome: 'Tenaris', setor: 'Siderurgia', estatal: false, participacao: 0, valor: 0.02, margem: 0.14,
      logo: null, bonus: { capacidade_ind: 3, pib: 0.05 },
      desc: 'O braço de tubos de aço do grupo Techint, líder mundial em tubulação sem costura para poço de petróleo. Uma multinacional argentina de verdade, que vende para todos os campos do planeta — inclusive para escoar Vaca Muerta em casa. O que a Argentina consegue exportar apesar da Argentina.' },
    { id: 'meli', nome: 'Mercado Libre', sigla: 'MELI', setor: 'Tecnologia', estatal: false, participacao: 0, valor: 0.09, margem: 0.1,
      logo: null, bonus: { temp_economia: 4, pib: 0.06 },
      desc: 'A empresa mais valiosa da América Latina nasceu numa garagem em Buenos Aires e virou o Amazon e o PayPal do continente ao mesmo tempo. Vale mais que o resto da bolsa argentina somada — e opera com sede fiscal fora do país, porque ninguém constrói uma fortuna dessas confiando no peso.' },
    { id: 'invap', nome: 'INVAP', setor: 'Defesa', estatal: true, participacao: 100, valor: 0.001, margem: 0.05,
      logo: null, bonus: { capacidade_ind: 5, inteligencia: 2 },
      desc: 'A joia escondida: estatal da província de Río Negro que projeta reator nuclear de pesquisa e o exporta para a Austrália, a Holanda e o Egito, faz radar militar e constrói satélite. A prova viva de que a Argentina sabe fazer alta tecnologia quando a crise deixa — e a crise raramente deixa.' },
    { id: 'arcor', nome: 'Arcor', setor: 'Alimentos', estatal: false, participacao: 0, valor: 0.003, margem: 0.07,
      logo: null, bonus: { pib: 0.03, soft_power: 2 },
      desc: 'A maior fabricante de balas e doces do mundo saiu de Córdoba e conquistou prateleira em 120 países. Multinacional familiar que sobreviveu a todas as crises argentinas fazendo a coisa mais anticíclica que existe: açúcar barato que a gente compra justamente quando está mal.' },
  ],

  equipamentos: {
    _nome: 'Argentina',
    // FOTO VERIFICADA no Wikimedia Commons (página de arquivo aberta e URL direta conferida):
    blindados:    { nome: 'TAM (Tanque Argentino Mediano)', fab: 'TAMSE', origem: 'ARG', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Tanque_Argentino_Mediano.jpg' },
    // SEM foto verificada — regra do projeto: não se inventa URL:
    cacas:        { nome: 'F-16AM Fighting Falcon (ex-dinamarquês)', fab: 'Lockheed Martin', origem: 'USA', proprio: false, foto: null, sugerido: true },
    infantaria:   { nome: 'Fuzileiro (FM FAL 7,62)', fab: 'Fabricaciones Militares', origem: 'BEL', proprio: 'licenca', foto: null, sugerido: true },
    artilharia:   { nome: 'Obús CITER 155mm', fab: 'Fabricaciones Militares', origem: 'ARG', proprio: true, foto: null, sugerido: true },
    navios:       { nome: 'Destróier ARA Almirante Brown (MEKO 360)', fab: 'Blohm+Voss', origem: 'DEU', proprio: false, foto: null, sugerido: true },
    submarinos:   { nome: 'ARA Santa Cruz (classe TR-1700)', fab: 'Thyssen Nordseewerke', origem: 'DEU', proprio: false, foto: null, sugerido: true },
    helicopteros: { nome: 'Bell UH-1H Huey II', fab: 'Bell', origem: 'USA', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'Exocet MM38', fab: 'MBDA (Aérospatiale)', origem: 'FRA', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'VANT SARA / Guardián', fab: 'Nostromo Defensa', origem: 'ARG', proprio: true, foto: null, sugerido: true },
  },
};

/* AUXILIARES — snippets prontos pra colar nos arquivos de src/dados/ quando ARG virar jogável.
   (NÃO editar src/ neste lote — só referência.)

// ── src/dados/paises.js → PAISES ──────────────────────────────────────
ARG: { nome: 'Argentina',        rel: 'rel_argentina', bloco: 'Não-alinhado',   forca: 26 },
// Artigo (paises.js → ARTIGO): 'Argentina': 'a'  → "da Argentina", "com a Argentina"

// ── src/dados/efetivoMilitar.js ───────────────────────────────────────
// Sem conscrição desde 1994: força profissional pequena, reserva modesta
ARG: 75000,    // em EFETIVO_ATIVO
ARG: 55000,    // em RESERVA_MILITAR

// ── src/dados/petroleo.js → PETROLEO ──────────────────────────────────
// Vaca Muerta muda a escala: xisto imenso, produção convencional em alta, quase autossuficiente
ARG: { reservas: 2.5, producao: 0.7, consumo: 0.6, custo: 30, tipo: 'Xisto / Médio', campo: 'Vaca Muerta',
       nota: 'Senta sobre a segunda maior reserva de gás de xisto do planeta e a quarta de óleo de xisto — e passou anos importando energia por falta de duto e de dólar para investir. Vaca Muerta é a promessa que a Argentina não consegue cumprir sozinha: falta capital, não geologia.' },

// ── src/dados/gabinetes.js → GABINETES (5 conselheiros, ids estáveis, NOMES FICTÍCIOS) ──
ARG: [
  { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'General Hernán Bustamante',
    personalidade: 'Comanda uma força que a política tratou como suspeita desde 1983 e a economia tratou como despesa. Sabe que os F-16 dinamarqueses são a primeira boa notícia em vinte anos e o único submarino boia com fé. "Presidente, não me peça para projetar poder. Me deixe manter o que temos ligado."' },
  { id: 'dir_cia', papel: 'Director de la SIDE', nome: 'Ernesto Villalba',
    personalidade: 'Herdou um serviço reformado, refundado e desacreditado tantas vezes que ninguém lembra a sigla atual. Passa metade do tempo provando que não espiona juiz e jornalista — e a outra metade fazendo exatamente isso. Os atentados de 1992 e 1994 são o fracasso que assombra a casa. "Sabemos quem foi, senhor. Nunca pudemos provar."' },
  { id: 'sec_tesouro', papel: 'Ministro de Economía', nome: 'Federico Aguirre',
    personalidade: 'O cargo que derruba presidentes. Trata cada dia sem corrida ao dólar como vitória e cada anúncio como um evento de risco cambial. Conhece o número real das reservas e ele lhe tira o sono. "A inflação a gente mata, presidente. A desconfiança de 50 milhões de pessoas com a moeda, essa leva uma geração."' },
  { id: 'sec_estado', papel: 'Ministro de Relaciones Exteriores', nome: 'Ignacio Peralta',
    personalidade: 'Equilibra o swap chinês, a parcela do FMI e a herança europeia de meio país sem poder desagradar ninguém. Levanta Malvinas quando a inflação sai no jornal e sabe exatamente por quê. "Soberania não se negocia, senhor — mas a próxima parcela, sim, e ela vence na sexta."' },
  { id: 'chefe_gabinete', papel: 'Jefe de Gabinete de Ministros', nome: 'Rodrigo Sáenz',
    personalidade: 'Conta praça na Plaza de Mayo e humor do caminhoneiro, porque aqui a rua e o piquete derrubam governo mais rápido que a oposição. Traz a pesquisa ruim junto com o índice de pobreza. "O ajuste funciona nos números antes de funcionar na geladeira, presidente. E a geladeira vota."' },
],
*/
