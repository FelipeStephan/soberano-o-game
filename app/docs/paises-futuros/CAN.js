// FICHA DO MUNDO — Canadá, era 2026. Mesmo formato EXATO do bra.js.
// MÓDULO FUTURO: pronto para virar src/dados/paises/can.js quando o Canadá sair de NPC.
//
// LÍDER FICTÍCIO: Primeiro-Ministro Malcolm Rutherford. Personagem inventado — regra do
// projeto (o jogo tem missão de assassinato; nunca modelamos violência contra pessoa real).
//
// Fotos: URLs verificadas na hora contra o Wikimedia (upload.wikimedia.org resolve). O que
// não foi confirmado do item certo vai com foto:null + sugerido:true, como no bra.js.

export const PAIS_CAN = {
  ficha: {
    ano: 2026,
    pais: 'Canadá',
    iso: 'CAN',
    presidente: 'Primeiro-Ministro Malcolm Rutherford', // FICTÍCIO — ver nota no topo
    capital: 'Ottawa',
    bandeira: '🇨🇦',
    pino: { lat: 45.42, lng: -75.70 },

    resumo: `Segundo maior território do planeta, décima economia, e um país inteiro apertado numa
faixa de 200 km ao norte da fronteira americana — porque é lá que o inverno deixa gente morar. Tem
a terceira maior reserva de petróleo do mundo presa em areia betuminosa que custa caro e suja tudo,
o maior urânio do Ocidente, água doce sem fim, e vende quase tudo isso para um único cliente que de
vez em quando ameaça taxar. É do Five Eyes, do G7 e da OTAN, e mesmo assim mantém forças armadas de
país médio: 68 mil fardados, quatro submarinos que mal mergulham e um Ártico que derrete e se abre
para russo e chinês sem que Ottawa tenha com o que patrulhá-lo. Educado, próspero, multicultural —
e permanentemente ansioso sobre até onde vai a proteção americana, agora que o próprio protetor
resolveu cobrar pedágio e falar em anexação como piada que ninguém achou graça.`,

    // Ponto de vista DO CANADÁ. Sem rel_canada. Aliança por geografia e por hábito de um século.
    relacoes: {
      rel_eua: 55,        // o aliado, o mercado, o guarda-chuva — e agora a ameaça tarifária e verbal
      rel_china: -25,     // preso Meng, reféns dos "dois Michaels", e agora interferência eleitoral
      rel_ue: 60,         // CETA em vigor; a Europa é o plano B que o Canadá finge que já tem
      rel_reino: 62,      // a Coroa ainda está na moeda; a Commonwealth é família
      rel_russia: -60,    // rivais no Ártico, e Ottawa abriga a maior diáspora ucraniana do mundo
      rel_india: -20,     // crise diplomática desde o assassinato de um líder sikh em solo canadense
      rel_japao: 52,
      rel_brasil: 32,     // a Bombardier processou a Embraer na OMC; ninguém dos dois lados esqueceu
      rel_australia: 58,  // primo do Five Eyes e do Commonwealth, mesma ansiedade de escala
      rel_coreia: 48,
      rel_israel: 35,
      rel_ira: -20,
      rel_arabia: 20,     // briga diplomática por direitos humanos que congelou o comércio
      rel_turquia: 30,
      rel_egito: 28,
      rel_indonesia: 30,
      rel_mexico: 48,     // o terceiro sócio do T-MEC, aliado por necessidade contra o gigante do meio
      rel_venezuela: -15,
      rel_ucrania: 70,    // 1,4 milhão de descendentes e uma das maiores redes de apoio do planeta
      rel_taiwan: 25,
      rel_paquistao: 22,
      rel_norte: -35,
    },

    tensoes: [
      'Dependência dos EUA e a ameaça de tarifas e anexação retórica',
      'Ártico derretendo e indefensável diante de russos e chineses',
      'Areia betuminosa: riqueza fóssil versus metas climáticas e oleodutos travados',
      'Forças armadas subfinanciadas e a cobrança dos 2% da OTAN',
    ],

    estadoInicial: {
      aprovacao: 40,
      estabilidade: 68,
      soft_power: 70,      // simpatia planetária, multiculturalismo e passaporte que abre porta
      seguranca: 70,       // um dos países mais seguros do mundo — a ameaça é externa e fria
      temp_guerra: 20,     // sem inimigo à porta, mas o Ártico esquenta enquanto derrete
      temp_economia: 48,
      liberdades: 88,
      poder_militar: 38,
      // economia (US$ trilhões)
      pib: 2.2,
      tesouro: 0.12,       // reservas internacionais ~US$ 120 bi
      divida: 106,         // dívida bruta/PIB alta; a líquida é bem menor (fundos previdenciários)
      aliquota: 34,
      // capacidades (0–100)
      inteligencia: 60,    // membro pleno do Five Eyes — pesa acima do próprio tamanho
      capacidade_ind: 60,  // aeroespacial, automotivo integrado aos EUA, mineração e nuclear (CANDU)
      uranio: 85,          // um dos maiores produtores do mundo — Saskatchewan alimenta reatores alheios
      territorio: 1,
      ogivas: 0,           // abriu mão das armas nucleares em 1984; hoje é NORAD e guarda-chuva alheio
    },

    fiosSemente: [
      { tema: 'Tarifas e retórica anexionista dos EUA', intensidade: 58, alvo_pressao: 'temp_economia', atores: ['eua'] },
      { tema: 'Soberania do Ártico em degelo', intensidade: 50, alvo_pressao: 'seguranca', atores: ['russia', 'china'] },
      { tema: 'Oleodutos travados e a briga do petróleo sujo', intensidade: 48, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Cobrança dos 2% e as forças armadas sucateadas', intensidade: 45, alvo_pressao: 'poder_militar', atores: ['eua'] },
    ],
  },

  // Ordem de batalha aproximada. Força pequena e profissional, montada para operar COM os EUA,
  // não sem eles. Sem porta-aviões, sem míssil de longo alcance, defesa aérea terrestre quase nula.
  forcas: {
    infantaria: 45000,    // força regular enxuta; o total ativo com marinha e aeronáutica ~68 mil
    blindados: 400,       // Leopard 2 (A4M/A6M) mais a frota de LAV 6.0 sobre rodas
    artilharia: 150,      // M777 155mm — a mesma peça que o Canadá doou às centenas para a Ucrânia
    helicopteros: 150,    // CH-146 Griffon, CH-147F Chinook, CH-148 Cyclone naval
    cacas: 85,            // CF-18 Hornet envelhecendo enquanto o F-35A entra a conta-gotas
    bombardeiros: 0,
    drones: 10,           // capacidade mínima; MQ-9B em aquisição
    navios: 30,           // 12 fragatas Halifax e uma frota de patrulha ártica nova
    submarinos: 4,        // classe Victoria, usados britânicos, mais tempo na doca que no mar
    porta_avioes: 0,
    misseis: 10,
    defesa_aerea: 1,      // aposentou a defesa aérea terrestre nos anos 90; depende do NORAD
    ogivas: 0,
  },

  empresas: [
    { id: 'rbc', nome: 'Royal Bank of Canada', setor: 'Financeiro', estatal: false, participacao: 0, valor: 0.18, margem: 0.30,
      logo: null, bonus: { temp_economia: 3 },
      desc: 'O maior banco do país num sistema de cinco gigantes que atravessou a crise de 2008 sem um arranhão. Conservador ao ponto do tédio — e é exatamente por isso que o Canadá não quebra.' },
    { id: 'enbridge', nome: 'Enbridge', setor: 'Energia', estatal: false, participacao: 0, valor: 0.09, margem: 0.15,
      logo: null, bonus: { pib: 0.08, seguranca: 2 },
      desc: 'A maior rede de oleodutos da América do Norte. Move o petróleo canadense para o único cliente que existe — e cada novo duto é uma guerra judicial de dez anos com tribo, província e ambientalista.' },
    { id: 'suncor', nome: 'Suncor Energy', setor: 'Energia', estatal: false, participacao: 0, valor: 0.06, margem: 0.12,
      petroleo: 0.8, logo: null, bonus: { pib: 0.1 },
      desc: 'Inventou a extração da areia betuminosa de Athabasca. Só dá lucro com o barril alto — abaixo de certo preço, extrair alcatrão de areia é queimar dinheiro para provar um ponto.' },
    { id: 'nutrien', nome: 'Nutrien', setor: 'Agro', estatal: false, participacao: 0, valor: 0.03, margem: 0.15,
      logo: null, bonus: { pib: 0.05 },
      desc: 'A maior produtora de potássio do mundo — o fertilizante sem o qual meio planeta não come. Quando a Rússia e a Belarus saíram do mapa, Saskatchewan virou a segurança alimentar de continentes.' },
    { id: 'bombardier', nome: 'Bombardier', setor: 'Aeroespacial', estatal: false, participacao: 0, valor: 0.01, margem: 0.08,
      logo: null, bonus: { capacidade_ind: 3 },
      desc: 'Vendeu a divisão de aviões comerciais e virou fabricante de jatos executivos de luxo. O Estado a socorreu tantas vezes que a linha entre privada e estatal é mais ideológica que contábil.' },
  ],

  equipamentos: {
    _nome: 'Canadá',
    blindados:    { nome: 'Leopard 2A4M CAN', fab: 'KNDS (ex-Krauss-Maffei)', origem: 'DEU', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG/330px-Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG' },
    cacas:        { nome: 'CF-188 Hornet', fab: 'McDonnell Douglas / Boeing', origem: 'USA', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/CAFDay-27_%28cropped%29.jpg/330px-CAFDay-27_%28cropped%29.jpg' },
    navios:       { nome: 'Fragata classe Halifax', fab: 'Irving / Seaspan', origem: 'CAN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/HMCS_Regina_in_2025.jpg/330px-HMCS_Regina_in_2025.jpg' },
    submarinos:   { nome: 'Submarino classe Victoria', fab: 'ex-Vickers (Upholder)', origem: 'GBR', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/HMCS_Corner_Brook_in_2025.jpg/330px-HMCS_Corner_Brook_in_2025.jpg' },
    helicopteros: { nome: 'CH-148 Cyclone', fab: 'Sikorsky', origem: 'USA', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Canadian_CH-148_Departs_Flight_Deck_During_Keen_Sword_21_%28cropped%29.jpg/330px-Canadian_CH-148_Departs_Flight_Deck_During_Keen_Sword_21_%28cropped%29.jpg' },
    infantaria:   { nome: 'Fuzileiro (C7A2)', fab: 'Colt Canada', origem: 'CAN', proprio: 'licenca', foto: null, sugerido: true },
    artilharia:   { nome: 'Obus M777 155mm', fab: 'BAE Systems', origem: 'GBR', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'MQ-9B SkyGuardian (aquisição)', fab: 'General Atomics', origem: 'USA', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'Sem míssil de ataque de longo alcance', fab: '—', origem: '—', proprio: false, foto: null, sugerido: true },
    defesa_aerea: { nome: 'Defesa aérea terrestre aposentada (NORAD supre)', fab: '—', origem: '—', proprio: false, foto: null, sugerido: true },
  },
};

/* ══════════════════════════ AUXILIARES (colar nos arquivos de src/dados) ══════════════════════════

// ── src/dados/paises.js  →  PAISES ── (já existe como NPC; atualizar forca se quiser)
CAN: { nome: 'Canadá',           rel: 'rel_canada',  bloco: 'Aliado',          forca: 35 },

// ── src/dados/efetivoMilitar.js ──
EFETIVO_ATIVO:   CAN: 95000,     // teto de fardados sustentáveis (Forças Armadas Canadenses)
RESERVA_MILITAR: CAN: 30000,     // reserva primária mobilizável

// ── src/dados/petroleo.js  →  PETROLEO ── (já existe; reproduzido para referência)
CAN: { reservas: 170, producao: 5.0,  consumo: 2.3,  custo: 40, tipo: 'Areia betuminosa', campo: 'Athabasca',
       nota: 'Areia encharcada de alcatrão. Caríssimo de extrair, ambientalmente tóxico, e 100% seu vizinho.' },

// ── src/dados/soldados.js  →  SOLDADO_POR_PAIS ──
CAN: { nome: 'Fuzileiro (C7A2)', foto: null },   // sugerido: buscar foto verificada do C7 canadense no Commons

// ── src/dados/gabinetes.js  →  GABINETES ── (nomes FICTÍCIOS; ids estáveis; cargos reais do Canadá)
CAN: [
  { id: 'sec_defesa', papel: 'Ministro da Defesa Nacional', nome: 'Gordon Whitlock',
    personalidade: 'Herdou forças armadas que faltam gente, peça e navio, e uma promessa dos 2% da OTAN que o Tesouro não deixa pagar. Sabe que o Ártico é indefensável e que ninguém em Ottawa quer ouvir isso. "Não temos exército pequeno, primeiro-ministro. Temos um país grande demais para ele."' },
  { id: 'dir_cia', papel: 'Diretor do CSIS', nome: 'Malcolm Fraser-Doyle',
    personalidade: 'Passa metade do tempo perseguindo interferência eleitoral chinesa e a outra metade explicando por que não pode contar o que sabe. O Five Eyes lhe dá acesso a tudo e permissão de agir em nada. "Somos ótimos em saber, senhor. Péssimos em fazer."' },
  { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Eleanor Baptiste',
    personalidade: 'Equilibra o custo de vida de eleitor endividado com uma dívida bruta que assusta no papel. Sabe que a dependência de um único cliente comercial é uma faca no pescoço da planilha. "Não temos economia frágil. Temos uma economia com um cliente só, e ele anda de mau humor."' },
  { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Raymond Osei',
    personalidade: 'Faz malabarismo entre um vizinho que fala em anexação de brincadeira, uma China que prende reféns e uma Índia que se ofendeu de morte. Prega diversificação de mercado e sabe que ela não existe. Trata a Europa como plano B que nunca virou plano A.' },
  { id: 'chefe_gabinete', papel: 'Chefe de Gabinete do Primeiro-Ministro', nome: 'Cassandra Nowak',
    personalidade: 'Conta assento no Parlamento e humor da imprensa de Toronto — um governo de minoria cai por uma manchete errada. Traz a pesquisa ruim e o deputado que ameaça cruzar a linha no mesmo memorando. "A oposição não derruba o senhor. A própria bancada, sim."' },
],
════════════════════════════════════════════════════════════════════════════════════════════════ */
