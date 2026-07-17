// FICHA DO MUNDO — Alemanha, era 2026. Mesmo esquema do FICHA_EUA_2026.
//
// O líder é FICTÍCIO por regra do projeto: o jogo tem missões de assassinato e não
// modelamos violência contra pessoas reais. Vale para todas as fichas.
//
// Fotos de equipamento: só URLs conferidas na API do Wikimedia Commons (imageinfo
// com iiurlwidth=330 devolve a thumburl real). O que não foi conferido vai com
// `foto: null` + `sugerido: true` — logo inventado já apareceu no jogo uma vez e foi vergonhoso.

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_DEU = {
  ficha: {
    ano: 2026,
    pais: 'Alemanha',
    iso: 'DEU',
    presidente: 'Chanceler Katharina Vogler', // FICTÍCIA — ver nota no topo
    capital: 'Berlim',
    pino: { lat: 52.52, lng: 13.40 },

    resumo: `Maior economia da Europa e terceira do mundo, presa num paradoxo que ela mesma
construiu: fábrica do continente sem energia barata desde que desligou o último reator em 2023
e a Rússia fechou o gás. Exporta máquina, carro e química para todo mundo — inclusive para a
China, que virou concorrente do que ela vende. Anunciou a Zeitenwende, o "ponto de virada" de
cem bilhões de euros para a Bundeswehr, e três anos depois ainda faltava munição para uma
semana de guerra. Potência industrial com força armada de país médio. Sem ogivas, sem
porta-aviões, e com o guarda-chuva nuclear alugado de Washington — um aluguel que ninguém
sabe até quando vale.`,

    relacoes: {
      // A Alemanha É a UE no que interessa — por isso não há rel_ue aqui.
      rel_eua: 62,        // aliado essencial e desconfiado: as tarifas e o "paguem os 2%" doeram
      rel_china: -10,     // maior parceiro comercial E rival industrial. A VW vende lá e apanha lá
      rel_russia: -65,    // Nord Stream, Zeitenwende, e trinta anos de Ostpolitik na lata do lixo
      rel_ira: -35,
      rel_brasil: 35,
      rel_israel: 55,     // Staatsräson: apoiar Israel é doutrina de Estado desde 1949
      rel_taiwan: 15,
      rel_arabia: 15,
      rel_reino: 55,      // pós-Brexit: cordial, e mais fácil agora que ninguém precisa negociar
      rel_ucrania: 65,    // segundo maior doador do planeta, e sempre acusado de fazer pouco
      rel_india: 30,
      rel_japao: 55,
      rel_coreia: 40,
      rel_norte: -55,
      rel_mexico: 25,
      rel_canada: 55,
      rel_australia: 45,
      rel_turquia: 5,     // aliado de OTAN, três milhões de turcos em casa, e atrito constante
      rel_paquistao: 5,
      rel_venezuela: -20,
      rel_indonesia: 20,
      rel_egito: 15,
    },

    tensoes: [
      'Desindustrialização: energia cara e a China copiando o que a Alemanha vende',
      'Bundeswehr sucateada apesar do fundo especial de cem bilhões',
      'Ascensão da extrema-direita e fratura entre o Leste e o Oeste',
      'Dependência do guarda-chuva nuclear americano num momento de dúvida sobre a OTAN',
      'Freio da dívida constitucional versus a conta do rearmamento',
    ],

    estadoInicial: {
      aprovacao: 34,       // chanceler alemão impopular é o estado natural das coisas
      estabilidade: 58,
      soft_power: 72,      // "made in Germany" ainda abre porta
      seguranca: 55,
      temp_guerra: 38,     // o front leste fica a mil quilômetros de Berlim
      temp_economia: 30,   // estagnação desde 2022: a locomotiva parou no trilho
      liberdades: 82,
      // POR QUE poder_militar 42 com o terceiro maior PIB do mundo: por desenho.
      // O país foi reconstruído para não ter capacidade ofensiva, gastou décadas abaixo
      // dos 2% e hoje tem tanque de sobra no papel e peça de reposição em falta na oficina.
      // Dinheiro não vira divisão blindada em três anos.
      poder_militar: 42,
      pib: 4.5,
      tesouro: 0.35,
      divida: 63,          // baixa para o padrão ocidental: o freio da dívida está na Constituição
      aliquota: 39,        // carga alta, e o contribuinte alemão sabe exatamente quanto paga
      inteligencia: 55,    // o BND é o primo pobre dos Five Eyes, e foi grampeado por eles
      capacidade_ind: 78,  // o Mittelstand: mil empresas que ninguém conhece e todo mundo depende
      uranio: 15,          // desligou os reatores e não tem programa. O urânio aqui é folclore
      territorio: 1,
      ogivas: 0,           // zero por tratado e por trauma. Só hospeda bombas americanas em Büchel
    },

    fiosSemente: [
      { tema: 'Desindustrialização e energia cara', intensidade: 60, alvo_pressao: 'temp_economia', atores: ['china', 'russia'] },
      { tema: 'Rearmamento contra o freio da dívida', intensidade: 52, alvo_pressao: 'poder_militar', atores: ['eua', 'russia'] },
      { tema: 'Extrema-direita e a fratura Leste–Oeste', intensidade: 55, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Dúvida sobre o guarda-chuva nuclear americano', intensidade: 45, alvo_pressao: 'seguranca', atores: ['eua', 'russia'] },
    ],
  },

  // Ordem de batalha aproximada. Bombardeiro estratégico: zero — é proibido pelo desenho
  // pós-1945, e o Tornado só existe para largar a bomba americana que não é dela.
  forcas: {
    infantaria: 180000,
    blindados: 300,      // Leopard 2 na conta oficial; quantos ligam de manhã é outra conversa
    artilharia: 120,
    helicopteros: 190,
    cacas: 130,
    bombardeiros: 0,
    drones: 20,
    navios: 30,
    submarinos: 6,       // Type 212A, os melhores diesel-elétricos do mundo. Seis.
    porta_avioes: 0,
    misseis: 60,
    defesa_aerea: 12,    // Patriot mais o IRIS-T SLM nacional — o rearmamento que a Ucrânia forçou
    ogivas: 0,
  },

  empresas: [
    { id: 'rheinmetall', nome: 'Rheinmetall', setor: 'Defesa', estatal: false, participacao: 8, valor: 0.04, margem: 0.11,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Rheinmetall_Zentrale_D%C3%BCsseldorf.jpg/3840px-Rheinmetall_Zentrale_D%C3%BCsseldorf.jpg',
      bonus: { capacidade_ind: 3 },
      desc: 'Faz o Leopard 2 e a munição que a Europa inteira encomendou de uma vez só em 2022. A ação multiplicou por dez.' },
    { id: 'db', nome: 'Deutsche Bahn', setor: 'Infraestrutura', estatal: true, participacao: 100, valor: 0.03, margem: -0.01,
      logo: null, bonus: { pib: 0.08, capacidade_ind: 2 },
      desc: 'Cem por cento do Estado alemão, e mesmo assim os trens atrasam. Uma piada nacional com valor estratégico: move blindado da OTAN pro leste.' },
    { id: 'uniper', nome: 'Uniper', setor: 'Energia', estatal: true, participacao: 99, valor: 0.02, margem: 0.03,
      logo: null, bonus: { pib: 0.06, seguranca: 3 },
      desc: 'Nacionalizada às pressas em 2022 por 13 bilhões de euros quando o gás russo secou e a empresa ia levar a rede junto. O Estado que pregava mercado livre comprou a conta inteira num fim de semana.' },
    { id: 'kfw', nome: 'KfW', setor: 'Financeiro', estatal: true, participacao: 100, valor: 0.08, margem: 0.04,
      logo: null, bonus: { temp_economia: 3, capacidade_ind: 2 },
      desc: 'Banco público criado com dinheiro do Plano Marshall e nunca devolvido. Terceiro maior banco do país, financia desde a padaria da esquina até o resgate da Lufthansa. Ninguém chama de estatal porque soa mal.' },
    { id: 'telekom', nome: 'Deutsche Telekom', setor: 'Tecnologia', estatal: true, participacao: 30, valor: 0.14, margem: 0.06,
      logo: null, bonus: { soft_power: 1, inteligencia: 2 },
      desc: 'O Estado ainda tem quase um terço, direto e via KfW. Dona da T-Mobile americana, que hoje vale mais que a mãe alemã — a colônia ficou mais rica que a metrópole.' },
  ],

  equipamentos: {
    _nome: 'Alemanha',
    blindados:    { nome: 'Leopard 2A7',        fab: 'KNDS / Rheinmetall',    origem: 'DEU', proprio: true,
      foto: `${W}/a/a7/Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG/330px-Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG` },
    cacas:        { nome: 'Eurofighter Typhoon', fab: 'Airbus / BAE / Leonardo', origem: 'DEU', proprio: true,
      foto: `${W}/8/8b/30%2B68_German_Air_Force_Eurofighter_Typhoon_EF2000_ILA_Berlin_2016_06.jpg/330px-30%2B68_German_Air_Force_Eurofighter_Typhoon_EF2000_ILA_Berlin_2016_06.jpg` },
    submarinos:   { nome: 'U-Boot Type 212A',   fab: 'thyssenkrupp Marine',   origem: 'DEU', proprio: true,
      foto: `${W}/a/af/U_34_in_Fahrt.jpg/330px-U_34_in_Fahrt.jpg` },
    artilharia:   { nome: 'Panzerhaubitze 2000', fab: 'KNDS / Rheinmetall',   origem: 'DEU', proprio: true,
      foto: `${W}/6/69/Panzerhaubitze_2000_-_Bundeswehr_Military_History_Museum%2C_Dresden.jpg/330px-Panzerhaubitze_2000_-_Bundeswehr_Military_History_Museum%2C_Dresden.jpg` },
    helicopteros: { nome: 'Eurocopter Tiger UHT', fab: 'Airbus Helicopters',  origem: 'DEU', proprio: true,
      foto: `${W}/f/f1/German_Army_Eurocopter_EC_665_Tiger_UHT_98-18_5.jpg/330px-German_Army_Eurocopter_EC_665_Tiger_UHT_98-18_5.jpg` },
    navios:       { nome: 'Fragata F125 Baden-Württemberg', fab: 'thyssenkrupp / Lürssen', origem: 'DEU', proprio: true,
      foto: `${W}/d/d6/F222_-_Baden-W%C3%BCrttemberg.JPG/330px-F222_-_Baden-W%C3%BCrttemberg.JPG` },
    misseis:      { nome: 'Taurus KEPD 350',    fab: 'Taurus Systems / MBDA', origem: 'DEU', proprio: true,
      foto: `${W}/f/f1/Taurus_KEPD_350.jpg/330px-Taurus_KEPD_350.jpg` },
    // Drone armado alemão não existe: o país comprou israelense e passou anos discutindo
    // no parlamento se podia pendurar míssil nele. Importado, e refém de Tel Aviv.
    drones:       { nome: 'Heron TP',           fab: 'IAI / Airbus',          origem: 'ISR', proprio: false,
      foto: `${W}/4/47/IAI_Heron_TP_GAF_92%2B52_at_Schleswig_AB_2025.JPG/330px-IAI_Heron_TP_GAF_92%2B52_at_Schleswig_AB_2025.JPG` },
  },
};
