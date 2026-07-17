// FICHA DO MUNDO — Taiwan, era 2026. Mesmo formato EXATO de src/dados/paises/bra.js.
//
// LÍDER FICTÍCIO: Lin Chih-yuan. Personagem inventado (regra do projeto: o jogo tem
// missões de assassinato e não se modela violência contra pessoa viva real).
//
// País hoje NPC (já tem entrada em paises.js: forca 45) — este módulo é o rascunho
// completo pronto para promovê-lo a jogável.

export const PAIS_TWN = {
  ficha: {
    ano: 2026,
    pais: 'Taiwan',
    iso: 'TWN',
    presidente: 'Presidente Lin Chih-yuan',
    capital: 'Taipé',
    bandeira: '🏝️',
    pino: { lat: 25.03, lng: 121.56 },

    resumo: `A ilha que fabrica mais de 60% dos semicondutores do mundo e mais de 90% dos chips mais
avançados — e por isso é ao mesmo tempo a mais indispensável e a mais ameaçada do planeta. Uma
única empresa, a TSMC, é o gargalo por onde passa a inteligência artificial, o celular, o carro e
o míssil de todo mundo; o Ocidente chama essa dependência de "escudo de silício" e reza para ele
funcionar. Democracia mais livre da Ásia, com 23 milhões de pessoas que na maioria não se sentem
chinesas — e um vizinho de 1,4 bilhão que jura reunificar a ilha, à força se preciso, e manda
caça cruzar a linha mediana do estreito quase todo dia. Só uma dúzia de países reconhece Taiwan
formalmente; o resto comercia por baixo do pano e treina para o dia do bloqueio. Estendeu o
serviço militar de volta a um ano, lançou o primeiro submarino de projeto próprio, e vive a
pergunta que nenhum outro país vive tão de perto: quando, e não se.`,

    // Ponto de vista DE TAIWAN. Sem rel_taiwan (a ilha não se relaciona consigo).
    relacoes: {
      rel_eua: 80,        // o garantidor de fato: vende arma, treina, e a "ambiguidade estratégica" é o seguro
      rel_china: -90,     // não é rivalidade, é ameaça existencial de anexação. O piso da escala
      rel_ue: 45,         // comércio de chip e simpatia democrática, sem reconhecimento formal
      rel_reino: 40,
      rel_russia: -25,    // alinhada a Pequim e fornecedora do modelo de "reunificação pela força"
      rel_india: 35,      // parceria tecnológica crescente, sem laço formal por causa de Pequim
      rel_japao: 70,      // o vizinho que mais teme a queda de Taiwan: "emergência de Taiwan é emergência do Japão"
      rel_canada: 40,
      rel_australia: 50,  // sócia do arco democrático do Indo-Pacífico
      rel_coreia: 20,     // concorrente direta em chips (Samsung x TSMC), e ninguém fala disso alto
      rel_israel: 35,     // troca discreta de tecnologia de defesa
      rel_ira: -15,
      rel_arabia: 20,
      rel_turquia: 20,
      rel_egito: 15,
      rel_indonesia: 30,  // grande investimento taiwanês em fábrica, sem relação formal
      rel_mexico: 25,
      rel_venezuela: -10,
      rel_ucrania: 40,    // solidariedade entre quem tem vizinho grande demais; Taipé observa a guerra como ensaio
      rel_paquistao: 10,
      rel_norte: -40,
      rel_brasil: 8,      // sem relação formal — Pequim não deixaria; comércio via terceiros
    },

    tensoes: [
      'Ameaça de invasão ou bloqueio da China; caça cruzando a linha diária',
      'Dependência do mundo na TSMC — bênção e alvo ao mesmo tempo',
      'Isolamento diplomático: pouquíssimos reconhecem Taiwan',
      'Legislativo dividido travando o orçamento de defesa',
    ],

    estadoInicial: {
      aprovacao: 45,
      estabilidade: 55,    // democracia sólida, mas legislativo dividido e pressão externa constante
      soft_power: 60,      // farol democrático da Ásia e a marca TSMC — mas diplomaticamente isolada
      seguranca: 40,       // ameaça existencial permanente: bloqueio naval derruba a ilha sem invadir
      temp_guerra: 60,     // a mais alta junto com a Coreia: incursão aérea da China é rotina diária
      temp_economia: 62,   // a potência do chip: a cadeia global de IA passa por aqui
      liberdades: 80,      // a sociedade mais livre da Ásia
      poder_militar: 50,   // moderno e motivado, mas em desvantagem numérica brutal contra o EPL
      // economia (US$ trilhões)
      pib: 0.79,
      tesouro: 0.57,       // reservas cambiais ~US$ 570 bi, entre as maiores do mundo
      divida: 28,          // dívida/PIB baixíssima
      aliquota: 20,
      // capacidades (0–100)
      inteligencia: 58,    // o Gabinete de Segurança Nacional, focado num único adversário conhecido de cor
      capacidade_ind: 88,  // a TSMC: o pico industrial do planeta em semicondutor avançado
      uranio: 15,          // teve programa nuclear secreto nos anos 70–80; os EUA o encerraram
      territorio: 1,
      ogivas: 0,
    },

    fiosSemente: [
      { tema: 'Ameaça de invasão ou bloqueio da China', intensidade: 68, alvo_pressao: 'seguranca', atores: ['china', 'eua'] },
      { tema: 'A TSMC como escudo de silício e como alvo', intensidade: 55, alvo_pressao: 'temp_economia', atores: ['eua', 'china'] },
      { tema: 'Isolamento diplomático e aliados formais minguando', intensidade: 50, alvo_pressao: 'soft_power', atores: ['china'] },
      { tema: 'Legislativo dividido trava o orçamento de defesa', intensidade: 45, alvo_pressao: 'estabilidade', atores: [] },
    ],
  },

  // ORDEM DE BATALHA (aproximada). Doutrina "porco-espinho": tornar a ilha cara demais para
  // invadir. Muito míssil antinavio, defesa aérea densa e caça moderno — o problema não é a
  // qualidade, é a aritmética: o outro lado tem vinte vezes tudo.
  forcas: {
    infantaria: 170000,   // ativa ~150 mil; serviço militar estendido de volta para 1 ano em 2024
    blindados: 1000,      // M60A3, CM-11 Brave Tiger nacional, e os M1A2T Abrams chegando (~108)
    artilharia: 1000,     // M109, rebocada, e o MLRS Thunderbolt-2000 nacional
    helicopteros: 200,    // AH-64E Apache (~29), AH-1W Cobra, UH-60M Black Hawk
    cacas: 400,           // F-16V (~140), Mirage 2000 (~46), F-CK-1 Ching-kuo nacional (~130), F-5 saindo
    bombardeiros: 0,
    drones: 30,
    navios: 90,           // fragatas Kang Ding/Cheng Kung, destróieres Kee Lung (ex-Kidd), lanchas-míssil
    submarinos: 4,        // 2 Guppy dos anos 40, 2 Hai Lung holandeses — e o inédito Hai Kun nacional
    porta_avioes: 0,
    misseis: 300,         // Hsiung Feng II/III antinavio, Sky Bow/Tien Kung SAM, Yun Feng de longo alcance
    defesa_aerea: 30,     // Patriot PAC-3 + Tien Kung III nacional: o céu mais defendido por km² da Ásia
    ogivas: 0,
  },

  empresas: [
    { id: 'tsmc', nome: 'TSMC', sigla: 'Taiwan Semiconductor', setor: 'Tecnologia', estatal: false, participacao: 6, valor: 0.8, margem: 0.4,
      logo: null, bonus: { pib: 0.3, capacidade_ind: 8, soft_power: 4 },
      desc: 'A empresa mais estrategicamente importante do planeta, e não é força de expressão: fabrica mais de 90% dos chips mais avançados do mundo. O fundo soberano taiwanês tem uma fatia, mas o poder de veto real é geopolítico — o "escudo de silício" que faz o mundo inteiro ter interesse pessoal na sobrevivência da ilha. Abrir fábrica no Arizona sob pressão americana é a maior negociação de segurança nacional do século.' },
    { id: 'honhai', nome: 'Hon Hai (Foxconn)', setor: 'Eletrônicos', estatal: false, participacao: 0, valor: 0.07, margem: 0.03,
      logo: null, bonus: { capacidade_ind: 4, temp_economia: 3 },
      desc: 'A maior montadora de eletrônicos do mundo: monta o iPhone e metade dos gadgets do planeta, quase toda a produção em solo chinês — o que faz da empresa taiwanesa mais exposta ao risco que ela mais teme. Agora corre para diversificar para a Índia e o Vietnã antes que a geografia cobre a conta.' },
    { id: 'mediatek', nome: 'MediaTek', setor: 'Tecnologia', estatal: false, participacao: 0, valor: 0.06, margem: 0.2,
      logo: null, bonus: { capacidade_ind: 4, pib: 0.06 },
      desc: 'Projeta o chip que roda a maioria dos celulares Android do mundo — a segunda maior fabricante de chip móvel do planeta. Se a TSMC é a fábrica, a MediaTek é o cérebro que desenha: a prova de que Taiwan domina as duas pontas da cadeia do silício, do design à litografia.' },
    { id: 'cpc', nome: 'CPC Corporation', setor: 'Energia', estatal: true, participacao: 100, valor: 0.01, margem: -0.01,
      petroleo: 0.0, logo: null, bonus: { seguranca: 3, estabilidade: 2 },
      desc: 'A petroleira estatal de uma ilha sem uma gota de petróleo, que importa 98% da energia por mar. Existe porque, para Taiwan, combustível não é economia: é a contagem regressiva de um bloqueio naval. A reserva estratégica dela é medida em semanas, e todo mundo em Taipé sabe o número.' },
    { id: 'ncsist', nome: 'NCSIST', sigla: 'Instituto Chung-Shan', setor: 'Defesa', estatal: true, participacao: 100, valor: 0.005, margem: 0.04,
      logo: null, bonus: { capacidade_ind: 5, poder_militar: 4 },
      desc: 'O instituto estatal que faz o míssil Hsiung Feng "matador de navios", o SAM Tien Kung e o cérebro do submarino Hai Kun. É a aposta taiwanesa na autossuficiência de armamento: enquanto os EUA atrasam a entrega de Abrams e F-16, o NCSIST constrói o que a ilha não pode esperar comprar — porque, no dia do bloqueio, não há entrega possível.' },
  ],

  equipamentos: {
    _nome: 'Taiwan',
    // FOTOS VERIFICADAS no Wikimedia Commons (páginas de arquivo abertas e URL direta conferida):
    cacas:        { nome: 'F-CK-1 Ching-kuo (IDF)', fab: 'AIDC', origem: 'TWN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/2/27/2021-09-14_AIDC_F-CK-1_Ching-kuo.jpg' },
    misseis:      { nome: 'Hsiung Feng III', fab: 'NCSIST', origem: 'TWN', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Hsiung_Feng_III_Anti-Ship_Missile_Display_in_Chengkungling_20111009a.jpg' },
    // SEM foto verificada — regra do projeto: não se inventa URL:
    blindados:    { nome: 'CM-11 Brave Tiger', fab: 'ARDC / General Dynamics', origem: 'TWN', proprio: 'licenca', foto: null, sugerido: true },
    artilharia:   { nome: 'Thunderbolt-2000 (MLRS)', fab: 'NCSIST', origem: 'TWN', proprio: true, foto: null, sugerido: true },
    infantaria:   { nome: 'Fuzileiro (T91)', fab: 'Armaria 205', origem: 'TWN', proprio: true, foto: null, sugerido: true },
    helicopteros: { nome: 'AH-64E Apache Guardian', fab: 'Boeing', origem: 'USA', proprio: false, foto: null, sugerido: true },
    navios:       { nome: 'Fragata classe Kang Ding (La Fayette)', fab: 'DCN', origem: 'FRA', proprio: false, foto: null, sugerido: true },
    submarinos:   { nome: 'Hai Kun (Narwhal, submarino de projeto próprio)', fab: 'CSBC / NCSIST', origem: 'TWN', proprio: true, foto: null, sugerido: true },
    defesa_aerea: { nome: 'Tien Kung III (Sky Bow III)', fab: 'NCSIST', origem: 'TWN', proprio: true, foto: null, sugerido: true },
    drones:       { nome: 'Teng Yun (Cloud Sentry)', fab: 'NCSIST', origem: 'TWN', proprio: true, foto: null, sugerido: true },
  },
};

/* AUXILIARES — snippets prontos pra colar nos arquivos de src/dados/ quando TWN virar jogável.
   (NÃO editar src/ neste lote — só referência.)

// ── src/dados/paises.js → PAISES ──────────────────────────────────────
// JÁ EXISTE em paises.js: TWN: { nome: 'Taiwan', rel: 'rel_taiwan', bloco: 'Parceiro', forca: 45 }
// Mantida a forca 45 (moderno, mas pequeno e em desvantagem numérica) — coerente com o catálogo.
TWN: { nome: 'Taiwan',           rel: 'rel_taiwan', bloco: 'Parceiro',        forca: 45 },
// Artigo (paises.js → ARTIGO): 'Taiwan': ''  (SEM artigo) — já consta: "de Taiwan", "com Taiwan"

// ── src/dados/efetivoMilitar.js ───────────────────────────────────────
// Serviço estendido para 1 ano em 2024; reserva mobilizável na casa dos milhões
TWN: 170000,   // em EFETIVO_ATIVO
TWN: 1650000,  // em RESERVA_MILITAR (grande base de reservistas; mobilização total prevista)

// ── src/dados/petroleo.js → PETROLEO ──────────────────────────────────
// JÁ EXISTE em petroleo.js (mantido):
// TWN: { reservas: 0, producao: 0.0, consumo: 1.0, custo: 0, tipo: 'Nenhum', campo: '—',
//        nota: 'Importa tudo por mar. Um bloqueio naval não precisa invadir Taiwan — basta esperar o combustível acabar em semanas.' }

// ── src/dados/gabinetes.js → GABINETES (5 conselheiros, ids estáveis, NOMES FICTÍCIOS) ──
TWN: [
  { id: 'sec_defesa', papel: 'Ministro da Defesa Nacional', nome: 'Almirante Kuo Wei-cheng',
    personalidade: 'Planeja a defesa de uma ilha contra um adversário que tem vinte vezes tudo, e sua doutrina é uma só: tornar a invasão cara demais para valer a pena. Aposta em míssil, mina e submarino nacional porque sabe que, no dia do bloqueio, nenhuma entrega americana atravessa o cerco. "Não precisamos vencer a China, presidente. Precisamos fazê-la duvidar."' },
  { id: 'dir_cia', papel: 'Diretor-Geral do Gabinete de Segurança Nacional (NSB)', nome: 'Tsai Ming-hui',
    personalidade: 'Vigia um único adversário que conhece de cor e persegue a infiltração que mais o assusta: a compra de general reformado e de deputado com dinheiro de Pequim. Sabe que a próxima guerra pode começar não com míssil, mas com sabotagem e desinformação. "A invasão talvez nunca venha, senhor. A subversão já chegou."' },
  { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Wang Chien-ping',
    personalidade: 'Guarda reservas cambiais gigantes e a dívida mais baixa do mundo desenvolvido — e sabe que tudo isso repousa sobre uma única empresa e uma única ilha. Cada fábrica que a TSMC abre no exterior o alivia e o assombra ao mesmo tempo. "Somos ricos, presidente, e nossa riqueza cabe num raio de mísseis."' },
  { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Hsu Kuo-tung',
    personalidade: 'Faz política externa de um país que quase ninguém reconhece formalmente, e transformou isso numa arte: escritório comercial que é embaixada com outro nome, e o chip como a moeda diplomática mais forte que existe. Conta os aliados formais nos dedos e vê Pequim comprá-los um a um. "Não temos assento na ONU, senhor. Temos a TSMC. Escolha qual você prefere."' },
  { id: 'chefe_gabinete', papel: 'Secretário-Geral da Presidência', nome: 'Chang Li-wei',
    personalidade: 'Costura maioria num legislativo dividido onde a oposição trava o orçamento de defesa em nome de não provocar Pequim. Sabe que a ameaça externa não impede a briga interna — às vezes a alimenta. "O senhor governa a ilha, presidente. Governar o Yuan Legislativo é que é a guerra de verdade."' },
],
*/
