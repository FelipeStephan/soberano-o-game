// FICHA DO MUNDO — Arábia Saudita, era 2026.
//
// NOTA DE MÉTODO: a guerra do Iêmen (2015–) matou centenas de milhares de pessoas, a
// maioria por fome e doença, e todos os lados têm responsabilidade documentada. Não é
// pano de fundo pitoresco. A ficha trata disso como o que é para o Estado saudita: um
// custo estratégico e reputacional que ele não conseguiu encerrar. O julgamento é sobre
// decisões de gabinete, não sobre sauditas nem sobre iemenitas.
//
// Líder FICTÍCIO por regra de projeto.
import { FOTO_UNIDADE } from '../imagens.js';

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_SAU = {
  ficha: {
    forcasIniciais: null,
    ano: 2026,
    pais: 'Arábia Saudita',
    iso: 'SAU',
    presidente: 'Rei Faisal bin Turki Al Saud', // FICTÍCIO. Cargo: Rei.
    cargo: 'Rei',
    capital: 'Riade',
    bandeira: '🕋',
    pino: { lat: 24.71, lng: 46.68 },

    resumo: `Uma monarquia absoluta sentada sobre 267 bilhões de barris que custam US$ 3 para extrair —
o petróleo mais barato do planeta, o que significa lucro a qualquer preço de mercado. É o único
produtor com capacidade ociosa relevante: pode abrir ou fechar a torneira e mover o preço mundial
sozinho, e isso é a política externa inteira em uma frase. Guardiã de Meca e Medina, o que dá
autoridade religiosa sobre 1,9 bilhão de muçulmanos. A Visão 2030 é uma aposta de trilhões: converter
petróleo em turismo, tecnologia e cidades no deserto antes que o petróleo deixe de pagar a conta —
o ponto de equilíbrio fiscal do reino está acima do preço atual do barril, o que é o problema todo.
Compra o melhor equipamento militar do mundo e não conseguiu vencer a guerra do Iêmen em uma década.
Reatou com Teerã em 2023 por mediação chinesa e negocia com Israel sem reconhecê-lo.`,

    // -100..+100, do ponto de vista de Riade. Sem rel_arabia (é o próprio país).
    relacoes: {
      rel_eua: 55,        // o pacto de 1945: petróleo por segurança. Abalado por Khashoggi e pela
                          // sensação, em Riade, de que Washington não respondeu ao ataque a Abqaiq
      rel_china: 55,      // maior comprador do petróleo saudita e o mediador do acordo com o Irã.
                          // Pequim entregou em 2023 o que Washington não entregou em dez anos
      rel_russia: 40,     // OPEP+ é uma sociedade: cortam produção juntos e sustentam o preço juntos
      rel_ira: -30,       // embaixadas reabertas em 2023; a disputa por influência regional segue inteira
      rel_brasil: 30,     // PIF investindo em porto e agro; carne halal em volume
      rel_israel: 20,     // sem relações formais. Normalização negociada e condicionada — o preço
                          // subiu desde 2023 e Riade sabe que subiu
      rel_taiwan: 5,
      rel_ue: 35,
      rel_reino: 55,      // Typhoon, contratos e uma amizade que sobrevive a qualquer manchete
      rel_ucrania: 15,    // hospedou cúpula de paz e não sanciona a Rússia. Neutralidade rentável
      rel_india: 55,      // 2,6 milhões de indianos trabalham no reino e mandam dinheiro pra casa
      rel_japao: 50,      // cliente de petróleo desde sempre, sem nenhuma opinião sobre política interna
      rel_coreia: 50,     // constrói metade da Neom e vendeu o pacote nuclear civil que os EUA travaram
      rel_norte: -25,
      rel_mexico: 5,      // concorrente de petróleo e nada mais
      rel_canada: 5,      // rompimento diplomático em 2018 por um tuíte sobre direitos humanos
      rel_australia: 25,
      rel_turquia: 30,    // reconciliação depois do caso Khashoggi e da guerra fria por causa do Catar
      rel_paquistao: 60,  // dinheiro saudita, soldados paquistaneses, e uma velha suspeita nunca
                          // provada de que a bomba paquistanesa tem um endereço reserva
      rel_venezuela: 10,  // sócios de OPEP que se detestam desde a guerra de preço de 2015
      rel_indonesia: 45,  // o maior contingente de peregrinos do Hajj do mundo
      rel_egito: 60,      // Riade banca o Cairo desde 2013; Tiran e Sanafir mudaram de dono na conta
    },

    tensoes: [
      'Visão 2030: converter petróleo em outra coisa antes que a janela feche',
      'Iêmen: uma guerra de dez anos sem vitória e com custo reputacional permanente',
      'Rivalidade com o Irã e a segurança das instalações de Abqaiq',
      'Normalização com Israel: preço político em casa e no mundo árabe',
      'Preço do barril abaixo do equilíbrio fiscal do reino',
    ],

    estadoInicial: {
      aprovacao: 55,      // não há eleição pra medir; o contrato social é subsídio e emprego público
      estabilidade: 60,   // sucessão centralizada e sem contestação visível — e sem válvula de escape
      soft_power: 35,     // Meca dá autoridade; futebol, golfe e boxe compram manchete; o histórico
                          // de direitos humanos come o saldo todo turno
      seguranca: 50,      // arsenal caríssimo e Abqaiq foi atingida em 2019 mesmo assim
      temp_guerra: 45,
      temp_economia: 55,  // depende do barril, e o barril não está no preço que o orçamento pede
      liberdades: 18,     // monarquia absoluta: sem partidos, sem parlamento eleito, sem imprensa
                          // independente, dissidência criminalizada. Mulheres dirigem desde 2018 e as
                          // ativistas que pediram isso foram presas no mesmo ano. O número descreve
                          // o regime jurídico do Estado — não a sociedade saudita, que muda mais
                          // rápido que a lei
      poder_militar: 45,  // dinheiro não compra doutrina: o Iêmen provou isso por dez anos
      // economia (US$ trilhões)
      pib: 1.1,           // ~US$ 1,1 tri, a maior economia árabe
      tesouro: 0.44,      // reservas do SAMA ~US$ 440 bi, sem contar o PIF. Caixa de verdade
      divida: 30,         // baixa e subindo: a Visão 2030 é financiada com emissão, não só com barril
      aliquota: 15,       // não há imposto de renda pessoal. O petróleo paga o Estado, e é esse o pacto
      // capacidades (0–100)
      inteligencia: 48,   // capacidade real dentro do Golfo, dependência de parceiros fora dele
      capacidade_ind: 30, // compra tudo e fabrica quase nada. A SAMI existe pra mudar isso e é jovem
      uranio: 30,         // tem minério e quer enriquecer em casa; recusa o padrão-ouro de não-proliferação
                          // que os EUA exigem. Declarou publicamente que segue o Irã se o Irã testar
      // poder territorial / arsenal
      territorio: 1,
      ogivas: 0,          // ZERO. Signatário do TNP, sem programa conhecido. O que existe é uma
                          // declaração pública de intenção condicional — "se eles tiverem, nós
                          // teremos" — e mísseis balísticos chineses DF-3/DF-21 comprados em 1988
                          // sem ogiva pra pôr em cima. Um vetor sem carga é uma ameaça de PowerPoint
    },

    fiosSemente: [
      { tema: 'Visão 2030 contra o relógio do petróleo', intensidade: 65, alvo_pressao: 'temp_economia', atores: [] },
      { tema: 'Contenção do Irã e defesa das instalações petrolíferas', intensidade: 62, alvo_pressao: 'seguranca', atores: ['ira', 'eua'] },
      { tema: 'O atoleiro do Iêmen e o custo de sair dele', intensidade: 55, alvo_pressao: 'soft_power', atores: ['ira'] },
      { tema: 'Normalização com Israel e o preço interno dela', intensidade: 50, alvo_pressao: 'aprovacao', atores: ['israel', 'eua'] },
    ],
  },

  // ── ORDEM DE BATALHA ───────────────────────────────────────────────────
  // ~250 mil ativos (Forças Armadas + a Guarda Nacional, que responde direto à Casa Real
  // e existe, entre outras coisas, como contrapeso ao Exército — golpe se previne no
  // organograma). Zero submarinos: o reino nunca comprou nenhum, apesar de ter litoral
  // no Mar Vermelho e no Golfo. Zero porta-aviões. O dinheiro foi todo pro ar.
  forcas: {
    infantaria: 250000,
    blindados: 1000,      // M1A2S Abrams, ~1.400 no papel; nem todos operacionais depois do Iêmen
    artilharia: 700,
    helicopteros: 250,
    cacas: 270,           // F-15SA, Typhoon, Tornado — uma das melhores frotas fora do G7
    bombardeiros: 0,
    drones: 60,           // comprou Wing Loong e CH-4 chineses quando os EUA recusaram vender
    navios: 25,           // fragatas francesas e americanas; classe Al-Riyadh e Avante 2200
    submarinos: 0,
    porta_avioes: 0,
    misseis: 400,         // inclui os DF-3/DF-21 chineses e uma parede de baterias Patriot
    defesa_aerea: 25,    // parede de Patriot — a única do mundo que intercepta míssil de verdade toda semana (Houthis)
    ogivas: 0,
  },

  // ── ESTATAIS ───────────────────────────────────────────────────────────
  // Reaproveita Aramco e PIF de dados/empresas.js e expande.
  // Petróleo coerente com dados/petroleo.js: SAU 9,7 Mb/d, custo US$ 3/barril, campo de Ghawar.
  empresas: [
    { id: 'aramco', nome: 'Saudi Aramco', setor: 'Energia', estatal: true, participacao: 90, valor: 1.8, margem: 0.14,
      petroleo: 9.7, logo: null, bonus: { pib: 0.35, soft_power: 2 },
      desc: 'A empresa mais lucrativa da história do capitalismo, e o Estado tem 90%. Extrai a US$ 3 o barril e vende a 78. O reino inteiro é um apêndice dela.' },
    { id: 'pif', nome: 'Fundo de Investimento Público', sigla: 'PIF', setor: 'Financeiro', estatal: true, participacao: 100,
      valor: 0.7, margem: 0.06, logo: null, bonus: { soft_power: 4, temp_economia: 3 },
      desc: 'Compra clubes de futebol, ligas de golfe e cidades inteiras no deserto. Petróleo virando influência antes que o petróleo acabe.' },
    { id: 'sabic', nome: 'SABIC', setor: 'Industrial', estatal: true, participacao: 70,
      valor: 0.07, margem: 0.07, logo: null, bonus: { pib: 0.1, capacidade_ind: 3 },
      desc: 'A Aramco comprou 70% da SABIC do PIF em 2020 — o Estado vendeu pra si mesmo por US$ 69 bi e transferiu o caixa de um bolso pro outro pra financiar a Visão 2030. Petroquímica é o plano B que ainda depende do plano A.' },
    { id: 'sami', nome: 'Saudi Arabian Military Industries', sigla: 'SAMI', setor: 'Defesa', estatal: true, participacao: 100,
      valor: 0.01, margem: 0.04, logo: null, bonus: { capacidade_ind: 3 },
      desc: 'Criada em 2017 com a meta de localizar 50% do gasto militar até 2030. Hoje monta veículo blindado e integra sistema alheio. Comprar arma é fácil quando se tem dinheiro; fabricar exige uma coisa que dinheiro não compra rápido.' },
    { id: 'maaden', nome: "Ma'aden", setor: 'Mineração', estatal: true, participacao: 67,
      valor: 0.03, margem: 0.08, logo: null, bonus: { capacidade_ind: 2, pib: 0.05, uranio: 1 },
      desc: 'Fosfato, ouro, bauxita e o urânio que o reino diz que vai enriquecer em casa. O subsolo saudita tem mais coisa além de hidrocarboneto — só nunca precisou.' },
    { id: 'neom', nome: 'NEOM', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.05, margem: -0.06, logo: null, bonus: { soft_power: 3, temp_economia: -1 },
      desc: 'Uma cidade linear de 170 km no deserto, orçada em US$ 500 bi e já redimensionada pra uma fração disso. Dá prejuízo, atrasa e é intocável: virou a métrica pública do próprio projeto de país.' },
  ],

  // ── EQUIPAMENTO ────────────────────────────────────────────────────────
  // O padrão é `proprio: false` em quase tudo — e essa é a informação.
  equipamentos: {
    _nome: 'Arábia Saudita',
    cacas:        { nome: 'F-15SA Eagle',    fab: 'Boeing',            origem: 'USA', proprio: false,
      foto: `${W}/5/54/Boeing_F-15SA_Eagle_Royal_Saudi_Air_Force_5D4_2291_%2853919688252%29.jpg/330px-Boeing_F-15SA_Eagle_Royal_Saudi_Air_Force_5D4_2291_%2853919688252%29.jpg` },
    blindados:    { nome: 'M1A2S Abrams',    fab: 'General Dynamics',  origem: 'USA', proprio: false,
      foto: `${W}/d/dc/Saudi_tank_moves_into_position_220913-Z-XQ828-442.jpg/330px-Saudi_tank_moves_into_position_220913-Z-XQ828-442.jpg` },
    bombardeiros: { nome: 'Eurofighter Typhoon', fab: 'BAE Systems',   origem: 'GBR', proprio: false,
      foto: `${W}/9/90/Eurofighter_Typhoon_of_the_Royal_Saudi_Air_Force_at_Airpower_11.jpg/330px-Eurofighter_Typhoon_of_the_Royal_Saudi_Air_Force_at_Airpower_11.jpg` },
    misseis:      { nome: 'MIM-104 Patriot', fab: 'Raytheon',          origem: 'USA', proprio: false,
      foto: FOTO_UNIDADE.misseis, sugerido: true },
    helicopteros: { nome: 'AH-64E Apache',   fab: 'Boeing',            origem: 'USA', proprio: false,
      foto: FOTO_UNIDADE.helicopteros },
    navios:       { nome: 'Fragata Al-Riyadh', fab: 'Naval Group',     origem: 'FRA', proprio: false,
      foto: FOTO_UNIDADE.navios, sugerido: true },
    drones:       { nome: 'CH-4 Rainbow',    fab: 'CASC',              origem: 'CHN', proprio: false,
      foto: FOTO_UNIDADE.drones, sugerido: true },
    artilharia:   { nome: 'PLZ-45',          fab: 'Norinco',           origem: 'CHN', proprio: false,
      foto: FOTO_UNIDADE.artilharia, sugerido: true },
  },
};

PAIS_SAU.ficha.forcasIniciais = PAIS_SAU.forcas;
