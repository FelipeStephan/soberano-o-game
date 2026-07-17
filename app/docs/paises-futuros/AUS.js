// FICHA DO MUNDO — Austrália, era 2026. Mesmo formato EXATO do bra.js.
// MÓDULO FUTURO: pronto para virar src/dados/paises/aus.js quando a Austrália sair de NPC.
//
// LÍDER FICTÍCIO: Primeiro-Ministro Gordon Hayes. Personagem inventado — regra do projeto
// (o jogo tem missão de assassinato; nunca modelamos violência contra pessoa real).
//
// Fotos: URLs verificadas na hora contra o Wikimedia (upload.wikimedia.org resolve). O que
// não foi confirmado do item certo vai com foto:null + sugerido:true, como no bra.js.

export const PAIS_AUS = {
  ficha: {
    ano: 2026,
    pais: 'Austrália',
    iso: 'AUS',
    presidente: 'Primeiro-Ministro Gordon Hayes', // FICTÍCIO — ver nota no topo
    capital: 'Canberra',
    bandeira: '🇦🇺',
    pino: { lat: -35.28, lng: 149.13 },

    resumo: `Um continente inteiro para uma nação só: 27 milhões de pessoas sentadas sobre o maior
estoque de minério de ferro, lítio, carvão e urânio do planeta — e vendendo quase tudo para a China,
o país de quem mais tem medo. É a contradição australiana em uma frase: o melhor cliente é o principal
adversário. Assinou o AUKUS para ter submarino de propulsão nuclear e não os verá na água antes de
2040; até lá, defende as rotas de que sua economia depende com seis submarinos diesel dos anos 90 e uma
marinha pequena demais para um oceano imenso. Democracia robusta, membro do Five Eyes, aliada de
Washington por tratado desde 1951 — e cada vez mais consciente de que fica sozinha do lado errado do
mapa se o Indo-Pacífico pegar fogo. Rica, distante e estrategicamente nervosa: o país que exporta a
matéria-prima do inimigo e reza para nunca precisar cobrar a fatura em outra moeda.`,

    // Ponto de vista DA AUSTRÁLIA. Sem rel_australia. A tirania da distância é a doutrina.
    relacoes: {
      rel_eua: 68,        // ANZUS, AUKUS e a base de Pine Gap: aliança de tratado e de espinha dorsal
      rel_china: -20,     // maior parceiro comercial E a ameaça que organiza toda a defesa nacional
      rel_ue: 50,         // parceiro distante; a negociação comercial travou na carne e no nome do queijo
      rel_reino: 65,      // Coroa, Commonwealth e o "AU" do AUKUS: parente que virou fornecedor de submarino
      rel_russia: -50,
      rel_india: 55,      // pilar do Quad, contrapeso à China, e uma diáspora que cresce rápido
      rel_japao: 62,      // quase-aliado do Quad; parceria de segurança que virou rotina
      rel_brasil: 25,     // concorrente direto no minério de ferro para o mesmo comprador chinês
      rel_canada: 58,     // primo do Five Eyes e do Commonwealth, mesma ansiedade de escala
      rel_coreia: 55,     // vende K9 e fragata; compra carvão e gás. Parceria industrial crescente
      rel_israel: 30,
      rel_ira: -25,
      rel_arabia: 25,
      rel_turquia: 28,
      rel_egito: 25,
      rel_indonesia: 45,  // o vizinho gigante de 280 milhões logo ao norte: relação sensível e obrigatória
      rel_mexico: 22,
      rel_venezuela: -10,
      rel_ucrania: 45,
      rel_taiwan: 20,     // sem laço formal, mas o estreito é o gatilho de tudo que a assusta
      rel_paquistao: 20,
      rel_norte: -40,
    },

    tensoes: [
      'Dependência comercial da China que também é a principal ameaça militar',
      'AUKUS: os submarinos nucleares que só chegam depois de 2040',
      'Defender um continente e rotas marítimas com uma força pequena',
      'Ilhas do Pacífico disputadas pela influência e pelo dinheiro chinês',
    ],

    estadoInicial: {
      aprovacao: 45,
      estabilidade: 72,
      soft_power: 68,
      seguranca: 72,       // segura em casa; a insegurança é do tamanho do oceano ao redor
      temp_guerra: 28,     // sem inimigo à porta, mas o Indo-Pacífico esquenta e ela está no meio
      temp_economia: 55,   // o boom de commodities banca a prosperidade — enquanto a China comprar
      liberdades: 86,
      poder_militar: 45,
      // economia (US$ trilhões)
      pib: 1.75,
      tesouro: 0.06,       // reservas internacionais ~US$ 60 bi
      divida: 50,          // dívida bruta/PIB moderada
      aliquota: 30,
      // capacidades (0–100)
      inteligencia: 62,    // Five Eyes e Pine Gap: pesa muito acima do próprio tamanho
      capacidade_ind: 45,  // economia de recursos; a manufatura é limitada e a defesa importa quase tudo
      uranio: 95,          // a MAIOR reserva de urânio do mundo (Olympic Dam) — e não usa uma grama
      territorio: 1,
      ogivas: 0,           // signatária convicta do TNP; abriga inteligência, não bomba
    },

    fiosSemente: [
      { tema: 'A China: cliente número um e ameaça número um', intensidade: 60, alvo_pressao: 'temp_economia', atores: ['china'] },
      { tema: 'AUKUS e a lacuna dos submarinos até 2040', intensidade: 52, alvo_pressao: 'poder_militar', atores: ['eua', 'reino'] },
      { tema: 'Disputa por influência nas ilhas do Pacífico', intensidade: 46, alvo_pressao: 'soft_power', atores: ['china'] },
      { tema: 'Distância estratégica e cadeias de suprimento frágeis', intensidade: 44, alvo_pressao: 'seguranca', atores: [] },
    ],
  },

  // Ordem de batalha aproximada. Pequena, moderna, cara e tecnológica — desenhada para lutar
  // JUNTO dos EUA numa coalizão, não sozinha. Sem porta-aviões (dois LHD Canberra fazem o desembarque).
  forcas: {
    infantaria: 47000,    // ADF profissional e pequena; total ativo com marinha e força aérea ~58 mil
    blindados: 400,       // M1A1/A2 Abrams no topo, mais Boxer CRV e a frota Bushmaster/Hawkei
    artilharia: 120,      // M777 e o novo K9 Huntsman coreano montado na Austrália; HIMARS a caminho
    helicopteros: 100,    // AH-64E Apache substituindo o Tiger, mais Chinook e Black Hawk
    cacas: 100,           // F-35A, Super Hornet e os Growler de guerra eletrônica: força aérea de ponta
    bombardeiros: 0,
    drones: 15,           // MQ-4C Triton de vigilância e o MQ-28 Ghost Bat, drone de combate nacional
    navios: 40,           // 3 destroieres Hobart, 8 fragatas Anzac, patrulha e 2 LHD Canberra
    submarinos: 6,        // classe Collins (diesel); os de propulsão nuclear do AUKUS vêm depois de 2040
    porta_avioes: 0,
    misseis: 20,          // Tomahawk e LRASM em aquisição, mais a fabricação nacional de mísseis
    defesa_aerea: 4,      // NASAMS terrestre entrando; a defesa de área ainda é das fragatas
    ogivas: 0,
  },

  empresas: [
    { id: 'bhp', nome: 'BHP', setor: 'Mineração', estatal: false, participacao: 0, valor: 0.14, margem: 0.25,
      logo: null, bonus: { capacidade_ind: 3, pib: 0.1 },
      desc: 'A maior mineradora do mundo. Vende o minério de ferro que vira o aço da China — e sabe que sua maior fonte de lucro é o país que a defesa nacional inteira trata como ameaça.' },
    { id: 'riotinto', nome: 'Rio Tinto', setor: 'Mineração', estatal: false, participacao: 0, valor: 0.11, margem: 0.22,
      logo: null, bonus: { capacidade_ind: 2 },
      desc: 'Ferro, alumínio, cobre e lítio para a transição energética do planeta. Explodiu um sítio aborígene de 46 mil anos por um veio de minério em 2020 e quase não sobreviveu à reação.' },
    { id: 'cba', nome: 'Commonwealth Bank', setor: 'Financeiro', estatal: false, participacao: 0, valor: 0.15, margem: 0.30,
      logo: null, bonus: { temp_economia: 3 },
      desc: 'O maior dos quatro pilares bancários que dominam o país. Cresceu à sombra do maior boom imobiliário do mundo desenvolvido — e reza para que ele nunca desande.' },
    { id: 'woodside', nome: 'Woodside Energy', setor: 'Energia', estatal: false, participacao: 0, valor: 0.04, margem: 0.18,
      petroleo: 0.35, logo: null, bonus: { pib: 0.08 },
      desc: 'A maior de gás natural liquefeito do país. A Austrália brigou anos com o Catar pelo posto de maior exportador de GNL do mundo — e a Woodside é a razão de estar sempre no pódio.' },
    { id: 'fortescue', nome: 'Fortescue', setor: 'Mineração', estatal: false, participacao: 0, valor: 0.05, margem: 0.20,
      logo: null, bonus: { capacidade_ind: 2 },
      desc: 'Nasceu do nada e virou a quarta gigante do minério de ferro. Agora aposta bilhões em hidrogênio verde — a tentativa de transformar o país que exporta carvão no que exporta energia limpa.' },
  ],

  equipamentos: {
    _nome: 'Austrália',
    infantaria:   { nome: 'Fuzileiro (F88 Austeyr)', fab: 'Thales Australia (Steyr AUG)', origem: 'AUT', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Steyr_AUG_5%2C56_mm.JPG/330px-Steyr_AUG_5%2C56_mm.JPG' },
    blindados:    { nome: 'M1A2 SEPv3 Abrams', fab: 'General Dynamics', origem: 'USA', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/M1A2_SEP_v3.jpg/330px-M1A2_SEP_v3.jpg' },
    cacas:        { nome: 'F-35A Lightning II', fab: 'Lockheed Martin', origem: 'USA', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/F-35A_flight_%28cropped%29.jpg/330px-F-35A_flight_%28cropped%29.jpg' },
    navios:       { nome: 'Destroier classe Hobart', fab: 'ASC / Navantia (F-100)', origem: 'ESP', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/HMAS_Hobart_December_2017.jpg/330px-HMAS_Hobart_December_2017.jpg' },
    submarinos:   { nome: 'Submarino classe Collins', fab: 'ASC / Kockums', origem: 'SWE', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/HMAS_Rankin_2006.jpg/330px-HMAS_Rankin_2006.jpg' },
    drones:       { nome: 'MQ-28A Ghost Bat', fab: 'Boeing Australia', origem: 'AUS', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/MQ-28_Ghost_Bat_prepares_to_conduct_a_taxi_test_during_Exercise_Valiant_Shield_2026_at_Rota.jpg/330px-MQ-28_Ghost_Bat_prepares_to_conduct_a_taxi_test_during_Exercise_Valiant_Shield_2026_at_Rota.jpg' },
    artilharia:   { nome: 'AS9 Huntsman (K9)', fab: 'Hanwha Defence Australia', origem: 'KOR', proprio: 'licenca', foto: null, sugerido: true },
    helicopteros: { nome: 'AH-64E Apache Guardian', fab: 'Boeing', origem: 'USA', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'Tomahawk / LRASM', fab: 'Raytheon / Lockheed Martin', origem: 'USA', proprio: false, foto: null, sugerido: true },
    defesa_aerea: { nome: 'NASAMS', fab: 'Kongsberg / Raytheon', origem: 'NOR', proprio: 'licenca', foto: null, sugerido: true },
  },
};

/* ══════════════════════════ AUXILIARES (colar nos arquivos de src/dados) ══════════════════════════

// ── src/dados/paises.js  →  PAISES ── (já existe como NPC; atualizar forca se quiser)
AUS: { nome: 'Austrália',        rel: 'rel_australia', bloco: 'Aliado',        forca: 42 },

// ── src/dados/efetivoMilitar.js ──
EFETIVO_ATIVO:   AUS: 100000,    // teto de fardados sustentáveis (Australian Defence Force)
RESERVA_MILITAR: AUS: 32000,     // reserva ativa mobilizável

// ── src/dados/petroleo.js  →  PETROLEO ── (NOVO: adicionar. Gigante do GNL/carvão, mas IMPORTA petróleo)
AUS: { reservas: 2,   producao: 0.35, consumo: 1.0,  custo: 35, tipo: 'Leve / condensado', campo: 'Bacia de Gippsland / Carnarvon',
       nota: 'Rei do gás e do carvão, pigmeu do petróleo: a produção de cru despencou e o país importa quase todo o combustível que queima. A vulnerabilidade que o AUKUS não resolve.' },

// ── src/dados/soldados.js  →  SOLDADO_POR_PAIS ──
AUS: { nome: 'Fuzileiro (F88 Austeyr)', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Steyr_AUG_5%2C56_mm.JPG/330px-Steyr_AUG_5%2C56_mm.JPG' },

// ── src/dados/gabinetes.js  →  GABINETES ── (nomes FICTÍCIOS; ids estáveis; cargos reais da Austrália)
AUS: [
  { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Warwick Fenner',
    personalidade: 'Vendeu o AUKUS ao país e agora administra a década em que ele não entrega nada: seis submarinos velhos guardando uma lacuna de vinte anos. Sabe que a força é pequena e o oceano é grande. "Não compramos submarinos, primeiro-ministro. Compramos uma promessa com data para 2040."' },
  { id: 'dir_cia', papel: 'Diretor-Geral da ASIS', nome: 'Lachlan Merriweather',
    personalidade: 'Vigia o Pacífico ilha por ilha enquanto Pequim assina pacto de segurança debaixo do nariz de Camberra. O Five Eyes lhe dá olhos globais e Pine Gap lhe dá o que os EUA quiserem partilhar. "Sabemos de tudo, senhor. Só não sabemos o que fazer quando eles compram a ilha antes de nós."' },
  { id: 'sec_tesouro', papel: 'Tesoureiro da Comunidade', nome: 'Beatrice Halloran',
    personalidade: 'Todo o orçamento equilibra num único produto e num único comprador: minério de ferro para a China. Sabe que o dia em que Pequim comprar de outro é o dia em que o superávit vira défice. "Nossa prosperidade tem um cliente só, e a gente treinou o exército para lutar contra ele."' },
  { id: 'sec_estado', papel: 'Ministra dos Negócios Estrangeiros', nome: 'Priya Ashwood',
    personalidade: 'Faz o impossível todo dia: manter aberto o comércio com quem a defesa trata de inimigo. Corteja Jacarta, tranquiliza as ilhas do Pacífico e reza para o estreito de Taiwan continuar frio. "Não temos o luxo de escolher entre economia e segurança. Temos de mentir para as duas."' },
  { id: 'chefe_gabinete', papel: 'Chefe de Gabinete do Primeiro-Ministro', nome: 'Desmond Kirby',
    personalidade: 'Conta cadeira em dois estados que decidem toda eleição e o preço da energia que decide o resto. Voto obrigatório significa que o eleitor irritado sempre aparece. "Aqui ninguém falta na urna, senhor. É por isso que o senhor não pode faltar com o preço da conta de luz."' },
],
════════════════════════════════════════════════════════════════════════════════════════════════ */
