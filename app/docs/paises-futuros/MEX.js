// FICHA DO MUNDO — México, era 2026. Mesmo formato EXATO do bra.js.
// MÓDULO FUTURO: pronto para virar src/dados/paises/mex.js quando o México sair de NPC.
//
// LÍDER FICTÍCIO: Presidenta Valentina Orozco Béjar. Personagem inventada — regra do
// projeto (o jogo tem missão de assassinato; nunca modelamos violência contra pessoa real).
//
// Fotos: URLs verificadas na hora contra o Wikimedia (upload.wikimedia.org resolve). O que
// não foi confirmado do item certo vai com foto:null + sugerido:true, como no bra.js.

export const PAIS_MEX = {
  ficha: {
    ano: 2026,
    pais: 'México',
    iso: 'MEX',
    presidente: 'Presidenta Valentina Orozco Béjar', // FICTÍCIA — ver nota no topo
    capital: 'Cidade do México',
    bandeira: '🇲🇽',
    pino: { lat: 19.43, lng: -99.13 },

    resumo: `Décima quarta economia do mundo, vizinha da maior potência do planeta e refém dela
por 3.000 km de fronteira e uma dependência que beira 80% das exportações. Faz metade dos carros
que os Estados Unidos dirigem e agora colhe o nearshoring que a briga entre Washington e Pequim
jogou no seu colo. E ainda assim enterra mais gente por ano do que muita guerra de verdade: o
crime organizado controla território, refina fentanil e negocia de igual para igual com o Estado.
Tem exército grande e nenhum caça de combate — aposentou os últimos F-5 e nunca os repôs, porque
a única fronteira que importa é interna. A Pemex, que já foi orgulho nacional, virou a petroleira
mais endividada do mundo. O soft power é imenso e de graça: comida, música e uma diáspora de 38
milhões do outro lado do muro. É o país que segura a mão de quem o aperta.`,

    // Ponto de vista DO MÉXICO. Sem rel_mexico. Vizinhança forçada, não escolhida.
    relacoes: {
      rel_eua: 40,        // sócio, patrão e ameaça — tudo no mesmo tratado comercial
      rel_china: 30,      // investe, vende barato e é o motivo das tarifas americanas na sua cabeça
      rel_ue: 42,         // acordo global renegociado; a Europa é a diversificação que nunca vem de verdade
      rel_reino: 35,
      rel_russia: 20,
      rel_india: 28,
      rel_japao: 45,      // montadora japonesa em Guanajuato é meio PIB industrial do Bajío
      rel_canada: 48,     // o terceiro banco do T-MEC, aliado por necessidade contra o gigante do meio
      rel_australia: 22,
      rel_coreia: 42,     // Kia, Samsung e a outra metade das fábricas
      rel_israel: 20,
      rel_ira: 15,
      rel_arabia: 25,
      rel_turquia: 25,
      rel_egito: 22,
      rel_indonesia: 25,
      rel_brasil: 38,     // dois gigantes latinos que comerciam pouco e reclamam disso há décadas
      rel_venezuela: 22,  // ideologia à esquerda, migração pela selva do Darién, e nenhuma boa opção
      rel_ucrania: 20,    // neutralidade que irritou Kiev e não custou nada a Moscou
      rel_taiwan: 12,
      rel_paquistao: 12,
      rel_norte: 5,
    },

    tensoes: [
      'Cartéis com domínio territorial e a guerra do fentanil',
      'Dependência dos EUA e a espada das tarifas sobre o T-MEC',
      'Pemex: a petroleira mais endividada do mundo drenando o Tesouro',
      'Migração de trânsito e a pressão de Washington para conter a fronteira sul',
    ],

    estadoInicial: {
      aprovacao: 50,
      estabilidade: 42,   // instituições de pé, mas há regiões onde o Estado não manda
      soft_power: 55,     // cultura, cozinha e a maior diáspora do hemisfério
      seguranca: 25,      // ~30 mil homicídios/ano; aqui o inimigo é interno e tem folha de pagamento
      temp_guerra: 12,    // guerra externa, nenhuma; guerra interna, permanente
      temp_economia: 50,  // nearshoring puxa pra cima, Pemex e juro puxam pra baixo
      liberdades: 60,
      poder_militar: 22,
      // economia (US$ trilhões)
      pib: 1.85,
      tesouro: 0.22,      // reservas internacionais ~US$ 225 bi
      divida: 50,         // dívida bruta/PIB — moderada para o padrão da região
      aliquota: 17,       // carga tributária baixíssima: arrecada pouco e depende do petróleo
      // capacidades (0–100)
      inteligencia: 30,   // o CNI é pequeno e o combate ao narco terceirizou inteligência aos EUA
      capacidade_ind: 55, // hub automotivo e aeroespacial; a manufatura é o ativo real do país
      uranio: 20,
      territorio: 1,
      ogivas: 0,
    },

    fiosSemente: [
      { tema: 'Cartéis e domínio territorial', intensidade: 65, alvo_pressao: 'seguranca', atores: ['eua'] },
      { tema: 'Tarifas americanas e o futuro do T-MEC', intensidade: 52, alvo_pressao: 'temp_economia', atores: ['eua', 'china'] },
      { tema: 'Dívida da Pemex e o rombo fiscal', intensidade: 50, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Pressão migratória e a fronteira sul', intensidade: 45, alvo_pressao: 'soft_power', atores: ['eua'] },
    ],
  },

  // Ordem de batalha aproximada. Efetivo grande de segurança pública fardada; poder de fogo
  // convencional escasso — sem MBT, sem caça de combate, sem submarino. Doutrina virada pra dentro.
  forcas: {
    infantaria: 215000,   // SEDENA + Marinha + Guarda Nacional militarizada
    blindados: 400,       // rodas, não lagartas: ERC-90, DN-XI, Sandcat. Nenhum tanque de batalha
    artilharia: 350,
    helicopteros: 130,    // UH-60M e Mi-17, muito usado em operação antinarco
    cacas: 0,             // aposentou os F-5E em 2016 e nunca repôs. O céu de combate é dos EUA
    bombardeiros: 0,
    drones: 15,           // Hermes 900 israelense para vigilância de fronteira
    navios: 50,           // muitas patrulhas oceânicas (OPV) e poucas fragatas de fato
    submarinos: 0,
    porta_avioes: 0,
    misseis: 10,
    defesa_aerea: 2,      // praticamente inexistente — o país nunca temeu um ataque aéreo
    ogivas: 0,
  },

  empresas: [
    { id: 'pemex', nome: 'Pemex', setor: 'Energia', estatal: true, participacao: 100, valor: 0.06, margem: -0.02,
      petroleo: 1.6, logo: null, bonus: { pib: 0.1 },
      desc: 'A petroleira estatal mais endividada do planeta — mais de US$ 100 bi. Já foi a joia soberana da nação (a nacionalização de 1938 é feriado); hoje é uma dívida com uma refinaria anexa que o Tesouro socorre todo ano.' },
    { id: 'cfe', nome: 'CFE', setor: 'Energia', estatal: true, participacao: 100, valor: 0.03, margem: 0.03,
      logo: null, bonus: { pib: 0.06, seguranca: 2 },
      desc: 'A Comissão Federal de Eletricidade acende o país inteiro e virou instrumento de política: o governo blindou a estatal contra a geração privada. Monopólio de fato onde importa.' },
    { id: 'amx', nome: 'América Móvil', setor: 'Telecom', estatal: false, participacao: 0, valor: 0.05, margem: 0.12,
      logo: null, bonus: { soft_power: 1, inteligencia: 1 },
      desc: 'A maior operadora da América Latina, construída pelo homem mais rico do país. Passa por 25 mercados — quem controla o cano de dados de meio continente sabe coisas.' },
    { id: 'gmexico', nome: 'Grupo México', setor: 'Mineração', estatal: false, participacao: 0, valor: 0.05, margem: 0.15,
      logo: null, bonus: { capacidade_ind: 2 },
      desc: 'Cobre para o mundo eletrificar, mais uma ferrovia que atravessa o país. Quando o cobre sobe com a transição energética, o balanço deles parece um poço de petróleo.' },
    { id: 'cemex', nome: 'Cemex', setor: 'Construção', estatal: false, participacao: 0, valor: 0.015, margem: 0.10,
      logo: null, bonus: { capacidade_ind: 2 },
      desc: 'Cimento mexicano em quatro continentes — uma das maiores cimenteiras do mundo, feita a golpe de aquisição agressiva. Exporta o insumo mais básico do poder: concreto.' },
  ],

  equipamentos: {
    _nome: 'México',
    infantaria:   { nome: 'Fuzileiro (FX-05 Xiuhcóatl)', fab: 'SEDENA / Dirección de Fábricas', origem: 'MEX', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/FX-05_Xiuhcoatl.png/330px-FX-05_Xiuhcoatl.png' },
    helicopteros: { nome: 'UH-60M Black Hawk', fab: 'Sikorsky', origem: 'USA', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/National-Guard-UH-60-Black-Hawk-operations-at-Fort-McCoy.jpg/330px-National-Guard-UH-60-Black-Hawk-operations-at-Fort-McCoy.jpg' },
    navios:       { nome: 'POLA ARM Reformador', fab: 'Damen / ASTIMAR (Marinha)', origem: 'MEX', proprio: 'licenca', foto: null, sugerido: true },
    blindados:    { nome: 'DN-XI', fab: 'SEDENA', origem: 'MEX', proprio: true, foto: null, sugerido: true },
    artilharia:   { nome: 'Obus M101 105mm', fab: 'Rock Island', origem: 'USA', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'Hermes 900', fab: 'Elbit Systems', origem: 'ISR', proprio: false, foto: null, sugerido: true },
    cacas:        { nome: 'Sem caça de combate (F-5E aposentado)', fab: '—', origem: '—', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'Sem míssil de ataque de longo alcance', fab: '—', origem: '—', proprio: false, foto: null, sugerido: true },
    defesa_aerea: { nome: 'Defesa aérea pontual (MANPADS)', fab: '—', origem: '—', proprio: false, foto: null, sugerido: true },
  },
};

/* ══════════════════════════ AUXILIARES (colar nos arquivos de src/dados) ══════════════════════════

// ── src/dados/paises.js  →  PAISES ── (já existe como NPC; atualizar forca se quiser)
MEX: { nome: 'México',           rel: 'rel_mexico',  bloco: 'Vizinho',         forca: 28 },

// ── src/dados/efetivoMilitar.js ──
EFETIVO_ATIVO:   MEX: 285000,   // teto de fardados sustentáveis (SEDENA + SEMAR + Guarda Nacional)
RESERVA_MILITAR: MEX: 82000,    // reserva mobilizável

// ── src/dados/petroleo.js  →  PETROLEO ── (já existe; reproduzido para referência)
MEX: { reservas: 6,   producao: 1.6,  consumo: 1.9,  custo: 24, tipo: 'Maya (pesado)',  campo: 'Ku-Maloob-Zaap',
       nota: 'Cantarell secou e levou junto a mágica. A Pemex é uma dívida com uma refinaria.' },

// ── src/dados/soldados.js  →  SOLDADO_POR_PAIS ──
MEX: { nome: 'Fuzileiro (FX-05 Xiuhcóatl)', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/FX-05_Xiuhcoatl.png/330px-FX-05_Xiuhcoatl.png' },

// ── src/dados/gabinetes.js  →  GABINETES ── (nomes FICTÍCIOS; ids estáveis; cargos reais do México)
MEX: [
  { id: 'sec_defesa', papel: 'Secretário da Defesa Nacional (SEDENA)', nome: 'General Rómulo Arizmendi',
    personalidade: 'Comanda um exército que virou empreiteira: constrói aeroporto, ferrovia e refinaria, e adora a missão porque orçamento de obra não se audita como orçamento de guerra. O verdadeiro inimigo dele tem folha de pagamento nos dois lados. "Presidenta, o Exército não é polícia. Mas já é tarde para dizer isso."' },
  { id: 'dir_cia', papel: 'Diretor do Centro Nacional de Inteligência (CNI)', nome: 'Ismael Cuéllar',
    personalidade: 'Herdou um serviço esvaziado e dependente do que a DEA e o FBI decidem compartilhar. Sabe qual governador janta com qual chefe de praça e não pode escrever isso em lugar nenhum. "A gente não tem inteligência, senhora. Tem o que os gringos deixam cair da mesa."' },
  { id: 'sec_tesouro', papel: 'Secretário da Fazenda e Crédito Público', nome: 'Doménica Villaseñor',
    personalidade: 'Faz malabarismo entre a menor carga tributária da OCDE e a Pemex sangrando o caixa a cada trimestre. Sabe que qualquer reforma fiscal séria custa a rua. "Não temos economia frágil, senhora. Temos uma estatal que a gente insiste em chamar de patrimônio."' },
  { id: 'sec_estado', papel: 'Secretário de Relações Exteriores', nome: ' Embaixador Nicolás Rendón',
    personalidade: 'Toda a política externa dele cabe numa palavra: Washington. Negocia migração, tarifa e fentanil na mesma reunião e chama isso de soberania compartilhada porque o resto seria admitir o óbvio. Trata o T-MEC como cordão umbilical: aperta e ninguém respira.' },
  { id: 'chefe_gabinete', papel: 'Chefe do Gabinete da Presidência', nome: 'Aurelia Zambrano',
    personalidade: 'Conta o preço da tortilla e da gasolina como quem lê pressão arterial — é o que derruba governo aqui, não a geopolítica. Traz a pesquisa ruim junto com o nome do prefeito que vazou. "A senhora perde o país no jantar, não na fronteira."' },
],
════════════════════════════════════════════════════════════════════════════════════════════════ */
