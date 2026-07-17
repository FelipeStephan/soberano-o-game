// FICHA DO MUNDO — Turquia, era 2026.
//
// A Turquia é o país mais mal-encaixado do tabuleiro: membro da OTAN desde 1952 com o
// segundo maior exército da aliança, e o único que comprou sistema antiaéreo russo e
// levou expulsão do programa do F-35 por isso. Candidata à União Europeia desde 1999 e
// mais longe de entrar hoje do que estava então. A ficha modela essa posição — não é
// incoerência do país, é a alavanca dele: quem está nos dois lados cobra dos dois.
//
// Líder FICTÍCIO por regra de projeto.
import { FOTO_UNIDADE } from '../imagens.js';

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';
const WC = 'https://upload.wikimedia.org/wikipedia/commons';

export const PAIS_TUR = {
  ficha: {
    forcasIniciais: null,
    ano: 2026,
    pais: 'Turquia',
    iso: 'TUR',
    presidente: 'Kemal Yıldırım Doğan', // FICTÍCIO. Cargo: Presidente.
    cargo: 'Presidente',
    capital: 'Ancara',
    bandeira: '🌙',
    pino: { lat: 39.93, lng: 32.86 },

    resumo: `Oitenta e cinco milhões de habitantes sentados sobre a única passagem entre o Mar Negro e o
Mediterrâneo — e a Convenção de Montreux de 1936 dá a Ancara a chave do Bósforo por escrito. Segundo
maior exército da OTAN e o mais indisciplinado dela: comprou o S-400 russo, foi expulsa do F-35, e
segue hospedando armas nucleares americanas em Incirlik. A indústria de defesa nacional saiu do zero
para exportar Bayraktar TB2 para trinta países e reescrever o manual da guerra com drone barato.
Economia grande e febril: inflação que passou de 80%, lira em queda de anos, e um banco central que
alternou entre heterodoxia e pânico. Presidencialismo forte desde 2018, imprensa concentrada, Curdos
como ferida de meio século, e uma política externa que negocia com Moscou, Kiev, Washington e Teerã
na mesma semana — porque pode.`,

    // -100..+100, do ponto de vista de Ancara. Sem rel_turquia (é o próprio país).
    relacoes: {
      rel_eua: 25,        // aliada de tratado que levou sanção CAATSA do próprio aliado. É isso mesmo
      rel_china: 20,      // comércio crescente e silêncio calculado sobre Xinjiang
      rel_russia: 35,     // gás, turismo, Akkuyu e o S-400 — e lados opostos na Síria, Líbia e Cáucaso
      rel_ira: 15,        // vizinho, fornecedor de gás, e rival em cada tabuleiro regional
      rel_brasil: 30,     // comércio crescendo; Baykar abriu escritório e vende drone
      rel_israel: -25,    // rompeu comércio em 2024; a relação já foi aliança militar nos anos 1990
      rel_taiwan: 5,
      rel_arabia: 30,     // reconciliação de conveniência depois de anos de guerra fria por Catar
      rel_ue: 15,         // maior parceiro comercial, união aduaneira desde 1995, e candidatura morta
                          // há 25 anos. O acordo migratório de 2016 é a única alavanca que restou
      rel_reino: 45,      // sem os vetos que vêm de Paris e Atenas
      rel_ucrania: 55,    // vende TB2 e não aplica sanção à Rússia. Mediou o acordo dos grãos
      rel_india: 5,       // Ancara apoia o Paquistão na Caxemira; Nova Délhi não esquece
      rel_japao: 35,
      rel_coreia: 40,     // parceria de tanque: o motor do Altay veio da Coreia do Sul
      rel_norte: -25,
      rel_mexico: 15,
      rel_canada: 15,     // embargou componente de drone em 2020 e destravou em 2022
      rel_australia: 20,
      rel_paquistao: 65,  // aliança de verdade: fragatas MILGEM construídas em Karachi
      rel_venezuela: 25,  // ouro venezuelano refinado na Turquia quando ninguém mais quis
      rel_indonesia: 45,
      rel_egito: 15,      // reataram embaixadores em 2023 depois de dez anos de ruptura por Morsi
    },

    tensoes: [
      'Inflação crônica e a credibilidade do banco central',
      'Questão curda: PKK, o nordeste da Síria e o custo interno de cada operação',
      'Posição ambígua na OTAN: S-400, F-35 e o preço de agradar Moscou e Washington',
      'Fluxo de refugiados sírios e a virada da opinião pública contra ele',
      'Mediterrâneo Oriental: gás, zonas econômicas e o atrito permanente com a Grécia',
    ],

    estadoInicial: {
      aprovacao: 42,
      estabilidade: 48,   // sobreviveu a uma tentativa de golpe em 2016 e ao expurgo que veio depois
      soft_power: 45,     // séries de TV em 150 países, Turkish Airlines em mais destinos que qualquer
                          // outra, mediação de grãos — o país sabe fazer isso e faz
      seguranca: 55,
      temp_guerra: 45,
      temp_economia: 32,  // inflação que a população sente no pão, não na planilha
      liberdades: 32,     // eleições competitivas e disputadas de verdade — a oposição venceu Istambul
                          // e Ancara em 2019 e 2024. E: imprensa muito concentrada, jornalistas presos,
                          // prefeitos eleitos depostos, Judiciário sob pressão. Baixo-médio é o número
                          // honesto: não é autocracia fechada, não é democracia liberal
      poder_militar: 58,
      // economia (US$ trilhões)
      pib: 1.3,           // ~US$ 1,3 tri. Economia do tamanho da espanhola, com a volatilidade de outra liga
      tesouro: 0.16,      // reservas brutas ~US$ 160 bi; as líquidas já foram negativas nesta década
      divida: 26,         // dívida/PIB baixa — o problema turco nunca foi esse, foi o câmbio
      aliquota: 23,
      // capacidades (0–100)
      inteligencia: 62,   // o MIT opera do Cáucaso ao Sahel; sequestrou opositores em terceiros países
      capacidade_ind: 68, // A GRANDE HISTÓRIA: dependência de importação caiu de ~80% pra ~20% em vinte
                          // anos. Baykar, Aselsan, TAI, Roketsan. Fez o que a maioria dos emergentes só
                          // anuncia em feira de defesa
      uranio: 25,         // Akkuyu é usina russa, com combustível russo e operação russa. Não é programa
      // poder territorial / arsenal
      territorio: 1,
      ogivas: 0,          // ZERO — e o detalhe importa: a Turquia hospeda cerca de 50 bombas B61
                          // americanas na base de Incirlik desde a Guerra Fria, sob o arranjo de
                          // compartilhamento nuclear da OTAN. As armas são dos EUA, os códigos são
                          // dos EUA, e o avião que as levaria teria de ser autorizado por Washington.
                          // Hospedar não é possuir. Por isso ogivas: 0 — e por isso a base é,
                          // ao mesmo tempo, uma garantia e um refém
    },

    fiosSemente: [
      { tema: 'Inflação e a lira que não para de cair', intensidade: 70, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Equilíbrio impossível entre OTAN e Moscou', intensidade: 60, alvo_pressao: 'seguranca', atores: ['eua', 'russia'] },
      { tema: 'Questão curda e operações no norte da Síria', intensidade: 55, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Gás e fronteiras marítimas no Mediterrâneo Oriental', intensidade: 45, alvo_pressao: 'temp_guerra', atores: ['ue'] },
    ],
  },

  // ── ORDEM DE BATALHA ───────────────────────────────────────────────────
  // ~355 mil ativos: o segundo maior efetivo da OTAN, atrás só dos EUA.
  // O TCG Anadolu conta como porta-aviões na contabilidade do jogo, com uma ressalva:
  // foi projetado pra operar F-35B, a Turquia foi expulsa do programa, e o navio virou
  // o primeiro porta-DRONES do mundo. Adaptação forçada virou pioneirismo — mas o convés
  // ainda é grande demais pro que ele carrega.
  forcas: {
    infantaria: 355000,
    blindados: 2300,      // Leopard 2 alemães, M60 modernizados por Israel (nos anos 1990), Altay nacional
    artilharia: 1100,
    helicopteros: 340,    // inclui o T129 ATAK, feito sob licença italiana
    cacas: 270,           // frota de F-16, boa parte modernizada em casa por não haver F-35
    bombardeiros: 0,
    drones: 200,          // TB2, Akinci, Anka — a vitrine industrial do país
    navios: 30,
    submarinos: 12,       // Type 209 alemães; a classe Reis (Type 214) está entrando
    porta_avioes: 1,      // TCG Anadolu
    misseis: 250,
    defesa_aerea: 15,    // S-400 russo (que custou o caça F-35 americano) mais o Hisar nacional
    ogivas: 0,
  },

  // ── ESTATAIS E CAMPEÃS NACIONAIS ──────────────────────────────────────
  // Reaproveita a Baykar de dados/empresas.js e expande com o resto do complexo.
  empresas: [
    { id: 'baykar', nome: 'Baykar', setor: 'Defesa', estatal: false, participacao: 0, valor: 0.01, margem: 0.15,
      logo: `${WC}/7/7a/BaykarLogo.png`, bonus: { capacidade_ind: 2 },
      desc: 'Familiar, privada, e mudou a guerra moderna com o TB2. O genro do presidente é o diretor de tecnologia — o que ajuda nas licenças.' },
    { id: 'aselsan', nome: 'Aselsan', setor: 'Defesa', estatal: true, participacao: 74, valor: 0.02, margem: 0.12,
      logo: null, bonus: { capacidade_ind: 4, inteligencia: 2 },
      desc: 'Controlada pela fundação das Forças Armadas — o exército é o acionista majoritário da própria fornecedora. Faz radar, guerra eletrônica e o sistema de tiro do Altay. Ninguém chama isso de conflito de interesse em Ancara.' },
    { id: 'tai', nome: 'Turkish Aerospace Industries', sigla: 'TAI', setor: 'Aeroespacial', estatal: true, participacao: 54,
      valor: 0.015, margem: 0.08, logo: null, bonus: { capacidade_ind: 4 },
      desc: 'Montava F-16 sob licença e agora tenta o KAAN, caça de quinta geração com motor americano que Washington pode negar a qualquer momento. O projeto inteiro é uma aposta em não ser sancionado.' },
    { id: 'roketsan', nome: 'Roketsan', setor: 'Defesa', estatal: true, participacao: 55,
      valor: 0.008, margem: 0.11, logo: null, bonus: { capacidade_ind: 3, seguranca: 2 },
      desc: 'Faz o míssil que o drone da Baykar carrega. Vertical de ponta a ponta: o país que não conseguia comprar munição guiada em 2010 agora vende o pacote completo.' },
    { id: 'botas', nome: 'BOTAŞ', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.02, margem: 0.02, logo: null, bonus: { pib: 0.06, estabilidade: 2 },
      desc: 'Estatal dos dutos. O gás russo, azeri e iraniano atravessa a Turquia pra chegar à Europa — e o TurkStream fez de Ancara o pedágio que Moscou precisa. Vende barato pra dentro por decisão política e acumula prejuízo bilionário. É subsídio com outro nome.' },
    { id: 'ziraat', nome: 'Ziraat Bankası', setor: 'Financeiro', estatal: true, participacao: 100,
      valor: 0.03, margem: 0.05, logo: null, bonus: { temp_economia: 3, estabilidade: 2 },
      desc: 'O maior banco do país, cem por cento do Estado, fundado em 1863. Abre crédito quando o governo precisa de crescimento antes de eleição. É política monetária pela porta dos fundos.' },
  ],

  // ── EQUIPAMENTO ────────────────────────────────────────────────────────
  equipamentos: {
    _nome: 'Turquia',
    blindados:    { nome: 'Altay',           fab: 'BMC / Otokar',      origem: 'TUR', proprio: true,
      foto: `${W}/e/eb/Altay_Tank.jpg/330px-Altay_Tank.jpg` },
    drones:       { nome: 'Bayraktar TB2',   fab: 'Baykar',            origem: 'TUR', proprio: true,
      foto: `${W}/4/4d/Bayraktar_TB2_Runway.jpg/330px-Bayraktar_TB2_Runway.jpg` },
    porta_avioes: { nome: 'TCG Anadolu',     fab: 'Sedef Shipyard',    origem: 'TUR', proprio: 'licenca',
      foto: `${W}/1/10/Turkish_Navy_amphibious_assault_ship_TCG_Anadolu_%28L400%29_steams_in_the_Mediterranean_Sea.jpg/330px-Turkish_Navy_amphibious_assault_ship_TCG_Anadolu_%28L400%29_steams_in_the_Mediterranean_Sea.jpg` },
    cacas:        { nome: 'F-16C Fighting Falcon', fab: 'Lockheed / TAI', origem: 'USA', proprio: 'licenca',
      foto: `${W}/d/da/Turkish_air_force_F-16_in_Jordan.jpg/330px-Turkish_air_force_F-16_in_Jordan.jpg` },
    artilharia:   { nome: 'T-155 Fırtına',   fab: 'MKE / Hanwha',      origem: 'TUR', proprio: 'licenca',
      foto: `${W}/5/58/Firtina_obus_kzlsngr.JPG/330px-Firtina_obus_kzlsngr.JPG` },
    submarinos:   { nome: 'Classe Reis (Type 214)', fab: 'thyssenkrupp / Gölcük', origem: 'DEU', proprio: 'licenca',
      foto: FOTO_UNIDADE.submarinos, sugerido: true },
    navios:       { nome: 'Fragata MILGEM (Ada)', fab: 'STM / Estaleiro de Istambul', origem: 'TUR', proprio: true,
      foto: FOTO_UNIDADE.navios, sugerido: true },
    helicopteros: { nome: 'T129 ATAK',       fab: 'TAI / Leonardo',    origem: 'ITA', proprio: 'licenca',
      foto: FOTO_UNIDADE.helicopteros, sugerido: true },
    misseis:      { nome: 'SOM / Bora',      fab: 'Roketsan',          origem: 'TUR', proprio: true,
      foto: FOTO_UNIDADE.misseis, sugerido: true },
  },
};

PAIS_TUR.ficha.forcasIniciais = PAIS_TUR.forcas;
