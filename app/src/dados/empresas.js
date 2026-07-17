// ═══════════════════════════════════════════════════════════════════════
// AS ESTATAIS — O ESTADO COMO EMPRESÁRIO
// ═══════════════════════════════════════════════════════════════════════
// O problema da versão anterior: você tinha 12% da Lockheed, 8% da Exxon, 3% da Apple.
// Fatia nenhuma = agência nenhuma. Clicar em "investir" como acionista minoritário não é
// uma jogada de RPG, é uma planilha.
//
// A CORREÇÃO: cada país agora tem ESTATAIS DE VERDADE — entidades que o Estado controla
// de fato. E sim, os EUA têm: a TVA (100% federal), os Correios (100%), a Reserva
// Estratégica de Petróleo (100%), a Fannie Mae (sob tutela federal desde 2008).
// Não é licença poética. É o balanço da União.
//
// E O PETRÓLEO ENTRA AQUI:
//   Empresa com `petroleo: N` bombeia N milhões de barris/dia PROPORCIONAL à sua fatia.
//   Investir na Petrobras sobe a produção nacional. Privatizar a Aramco derruba.
//   É o elo que faz economia e geopolítica serem a mesma coisa.
//
// AS JOGADAS:
//   Investir     → +valor, +margem, +produção de petróleo (custa caixa)
//   Privatizar   → caixa AGORA, lucro nunca mais, mercado ama, sua base odeia
//   Estatizar    → controle a preço de prêmio, mercado foge
//   Nacionalizar → confisco do que falta. Paga 0,6× e o capital do mundo te trata como pária.

const W = 'https://upload.wikimedia.org/wikipedia';

export const SETORES = ['Energia', 'Defesa', 'Tecnologia', 'Mineração', 'Aeroespacial', 'Industrial', 'Infraestrutura', 'Financeiro'];

export const EMPRESAS_POR_PAIS = {
  // ── ESTADOS UNIDOS ───────────────────────────────────────────────────
  // Contra o mito: a União americana controla ativos gigantescos. Só não chama de estatal.
  USA: [
    { id: 'spr', nome: 'Reserva Estratégica de Petróleo', sigla: 'SPR', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.05, margem: 0.04, petroleo: 1.2, logo: null,
      bonus: { pib: 0.1, seguranca: 4 },
      desc: 'Setecentos milhões de barris enterrados em domos de sal na Louisiana e no Texas. Quando o preço explode, você abre a torneira e derruba o mercado mundial sozinho. É uma arma econômica disfarçada de depósito.' },
    { id: 'tva', nome: 'Tennessee Valley Authority', sigla: 'TVA', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.06, margem: 0.06, logo: null,
      bonus: { pib: 0.12, capacidade_ind: 2 },
      desc: 'A maior estatal de energia dos EUA, criada por Roosevelt em 1933 pra tirar o Sul da miséria. Sete estados, dez milhões de pessoas, e nuclear no portfólio.' },
    { id: 'usps', nome: 'Serviço Postal', sigla: 'USPS', setor: 'Infraestrutura', estatal: true, participacao: 100,
      valor: 0.02, margem: -0.02, logo: null,
      bonus: { aprovacao: 1, estabilidade: 2 },
      desc: 'Dá prejuízo há décadas e é intocável: chega a cada endereço do país, inclusive onde não dá lucro. Fechar é suicídio político. Manter é caro. Bem-vindo ao governo.' },
    { id: 'fnma', nome: 'Fannie Mae', sigla: 'FNMA', setor: 'Financeiro', estatal: true, participacao: 80,
      valor: 0.09, margem: 0.05, logo: null,
      bonus: { temp_economia: 3, estabilidade: 2 },
      desc: 'Sob tutela federal desde que quebrou em 2008 e levou o mundo junto. Garante metade das hipotecas do país. Você é dono do mercado imobiliário e finge que não.' },
    { id: 'lmt', nome: 'Lockheed Martin', setor: 'Defesa', estatal: false, participacao: 12, valor: 0.11, margem: 0.09,
      logo: null,
      bonus: { capacidade_ind: 2 },
      desc: 'A maior fabricante de armas do planeta. Faz o F-35 que você compra de você mesmo. Nacionalizar seria a maior intervenção estatal desde a guerra — e o Congresso te enforcaria.' },
    { id: 'xom', nome: 'ExxonMobil', setor: 'Energia', estatal: false, participacao: 8, valor: 0.48, margem: 0.07,
      petroleo: 3.8, logo: `${W}/commons/a/ae/Cube_xom_mine.png`,
      bonus: { pib: 0.15 },
      desc: 'Petróleo, gás e influência em cada capital que tem poço. Sobreviveu à dissolução do truste da Standard Oil e voltou maior do que era.' },
    { id: 'aapl', nome: 'Apple', setor: 'Tecnologia', estatal: false, participacao: 3, valor: 3.4, margem: 0.05,
      logo: `${W}/commons/thumb/f/fa/Apple_logo_black.svg/960px-Apple_logo_black.svg.png`,
      bonus: { soft_power: 2, inteligencia: 1 },
      desc: 'Soft power em forma de vitrine. O mundo inteiro no seu bolso — e a cadeia de montagem inteira na China, o que é exatamente o seu problema.' },
  ],

  // ── BRASIL ───────────────────────────────────────────────────────────
  BRA: [
    { id: 'petro', nome: 'Petrobras', setor: 'Energia', estatal: true, participacao: 51, valor: 0.11, margem: 0.11,
      petroleo: 2.6, logo: `${W}/commons/6/60/Sede_Petrobras_en_R%C3%ADo_de_Janeiro.jpg`,
      bonus: { pib: 0.2 },
      desc: 'A União tem 51% das ações com voto. Tirou petróleo de 7 km de profundidade sob uma camada de sal — engenharia que ninguém mais no mundo domina. E é palanque de todo governo desde sempre.' },
    { id: 'eletro', nome: 'Eletrobras', setor: 'Energia', estatal: true, participacao: 43, valor: 0.03, margem: 0.07,
      logo: null, bonus: { pib: 0.12, capacidade_ind: 2 },
      desc: 'Privatizada em 2022, mas a União manteve poder de veto e assento no conselho. Itaipu, Angra, e um terço da geração do país.' },
    { id: 'bndes', nome: 'BNDES', setor: 'Financeiro', estatal: true, participacao: 100, valor: 0.04, margem: 0.06,
      logo: null, bonus: { capacidade_ind: 3, temp_economia: 2 },
      desc: 'O banco que decide quais empresas brasileiras existem. Crédito subsidiado como política industrial — ou como favor, dependendo de quem conta a história.' },
    { id: 'vale', nome: 'Vale', setor: 'Mineração', estatal: false, participacao: 10, valor: 0.06, margem: 0.1,
      logo: `${W}/en/thumb/9/97/Vale_logo.svg/120px-Vale_logo.svg.png`,
      bonus: { capacidade_ind: 2 },
      desc: 'Ferro e níquel pro mundo inteiro. E o nióbio, que só o Brasil tem em escala — e sobre o qual todo mundo tem uma teoria.' },
    { id: 'embraer', nome: 'Embraer', setor: 'Aeroespacial', estatal: false, participacao: 5, valor: 0.02, margem: 0.06,
      logo: `${W}/commons/f/f4/Sede-da-embraer.jpg`,
      bonus: { capacidade_ind: 3 },
      desc: 'Terceira maior fabricante de aviões do mundo. A União mantém a golden share: pode vetar a venda pra estrangeiro. Já usou.' },
  ],

  // ── CHINA ────────────────────────────────────────────────────────────
  // Aqui não tem debate ideológico: o Estado É a economia.
  CHN: [
    { id: 'cnpc', nome: 'CNPC / PetroChina', setor: 'Energia', estatal: true, participacao: 84, valor: 0.22, margem: 0.09,
      petroleo: 2.4, logo: null, bonus: { pib: 0.16 },
      desc: 'A maior petroleira estatal da China. Bombeia em Daqing, na Ásia Central, na África — em qualquer lugar que não faça perguntas.' },
    { id: 'sinopec', nome: 'Sinopec', setor: 'Energia', estatal: true, participacao: 68, valor: 0.4, margem: 0.08,
      petroleo: 1.3, logo: `${W}/en/thumb/6/6f/Sinopec_logo.svg/330px-Sinopec_logo.svg.png`,
      bonus: { pib: 0.18 },
      desc: 'Gigante estatal de refino. O Estado é o acionista controlador e o presidente é nomeado pelo Partido. Não há ficção de independência.' },
    { id: 'norinco', nome: 'Norinco', setor: 'Defesa', estatal: true, participacao: 100, valor: 0.08, margem: 0.1,
      logo: `${W}/commons/thumb/a/a9/Norinco_headquarters_at_46_Sanlihe_Rd_%2820200921163658%29.jpg/3840px-Norinco_headquarters_at_46_Sanlihe_Rd_%2820200921163658%29.jpg`,
      bonus: { capacidade_ind: 4 },
      desc: 'Cem por cento do Estado. Arma metade do Sul Global com equipamento que custa um terço do ocidental e funciona dois terços do tempo.' },
    { id: 'sgcc', nome: 'State Grid', setor: 'Infraestrutura', estatal: true, participacao: 100, valor: 0.12, margem: 0.05,
      logo: null, bonus: { pib: 0.14, capacidade_ind: 3 },
      desc: 'A maior empresa de energia elétrica do planeta por receita. Um bilhão de clientes. E dona de pedaços da rede elétrica de Brasil, Portugal e Itália.' },
  ],

  // ── RÚSSIA ───────────────────────────────────────────────────────────
  RUS: [
    { id: 'gazprom', nome: 'Gazprom', setor: 'Energia', estatal: true, participacao: 50, valor: 0.09, margem: 0.12,
      petroleo: 1.5, logo: `${W}/en/thumb/1/11/Gazprom-Logo.svg/500px-Gazprom-Logo.svg.png`,
      bonus: { pib: 0.2 },
      desc: 'O gás é a arma. O Estado tem 50,2% — o suficiente pra mandar. Fecha a torneira em janeiro e a Europa negocia de casaco.' },
    { id: 'rosneft', nome: 'Rosneft', setor: 'Energia', estatal: true, participacao: 40, valor: 0.07, margem: 0.1,
      petroleo: 4.7, logo: null, bonus: { pib: 0.18 },
      desc: 'Engoliu a Yukos depois que o dono foi preso. Maior produtora de petróleo da Rússia — e um recado sobre o que acontece com quem contraria o Kremlin.' },
    { id: 'rostec', nome: 'Rostec', setor: 'Defesa', estatal: true, participacao: 100, valor: 0.05, margem: 0.09,
      logo: `${W}/commons/d/d9/Rostekh2018.jpeg`, bonus: { capacidade_ind: 4 },
      desc: 'Conglomerado estatal de defesa. Do Kalashnikov ao Su-57. Oitocentas empresas sob um chapéu e um amigo do presidente no comando.' },
  ],

  // ── PETROESTADOS: a estatal É o país ─────────────────────────────────
  SAU: [
    { id: 'aramco', nome: 'Saudi Aramco', setor: 'Energia', estatal: true, participacao: 90, valor: 1.8, margem: 0.14,
      petroleo: 9.7, logo: null, bonus: { pib: 0.35, soft_power: 2 },
      desc: 'A empresa mais lucrativa da história do capitalismo, e o Estado tem 90%. Extrai a US$ 3 o barril e vende a 78. O reino inteiro é um apêndice dela.' },
    { id: 'pif', nome: 'Fundo de Investimento Público', sigla: 'PIF', setor: 'Financeiro', estatal: true, participacao: 100,
      valor: 0.7, margem: 0.06, logo: null, bonus: { soft_power: 4, temp_economia: 3 },
      desc: 'Compra clubes de futebol, ligas de golfe e cidades inteiras no deserto. Petróleo virando influência antes que o petróleo acabe.' },
  ],
  VEN: [
    { id: 'pdvsa', nome: 'PDVSA', setor: 'Energia', estatal: true, participacao: 100, valor: 0.03, margem: 0.02,
      petroleo: 0.8, logo: null, bonus: { pib: 0.08 },
      desc: 'Senta sobre a maior reserva do planeta e produz menos que a Colômbia. Trinta mil engenheiros demitidos por greve política em 2003, e a empresa nunca mais se levantou. O prêmio de quem consertar isso é indecente.' },
  ],
  IRN: [
    { id: 'nioc', nome: 'NIOC', setor: 'Energia', estatal: true, participacao: 100, valor: 0.06, margem: 0.09,
      petroleo: 3.4, logo: null, bonus: { pib: 0.12 },
      desc: 'Nacionalizada em 1951 — e o golpe que derrubou Mossadegh no ano seguinte foi por causa disso. Sancionada até a medula e ainda bombeando.' },
  ],
  MEX: [
    { id: 'pemex', nome: 'Pemex', setor: 'Energia', estatal: true, participacao: 100, valor: 0.02, margem: -0.03,
      petroleo: 1.6, logo: null, bonus: { pib: 0.05, aprovacao: 2 },
      desc: 'A petroleira mais endividada do mundo. Dá prejuízo e é intocável: a nacionalização de 1938 é feriado nacional. Símbolo caro demais pra fechar.' },
  ],
  NOR: [
    { id: 'equinor', nome: 'Equinor', setor: 'Energia', estatal: true, participacao: 67, valor: 0.09, margem: 0.12,
      petroleo: 1.8, logo: null, bonus: { pib: 0.16, soft_power: 3 },
      desc: 'O Estado tem 67% e joga todo o lucro num fundo soberano de US$ 1,7 tri — o maior do mundo. Fizeram com o petróleo o que ninguém mais teve disciplina de fazer.' },
  ],

  // ── EUROPA / ÁSIA ────────────────────────────────────────────────────
  DEU: [
    { id: 'rheinmetall', nome: 'Rheinmetall', setor: 'Defesa', estatal: false, participacao: 8, valor: 0.04, margem: 0.11,
      logo: `${W}/commons/thumb/c/c1/Rheinmetall_Zentrale_D%C3%BCsseldorf.jpg/3840px-Rheinmetall_Zentrale_D%C3%BCsseldorf.jpg`,
      bonus: { capacidade_ind: 3 },
      desc: 'Faz o Leopard 2 e a munição que a Europa inteira encomendou de uma vez só em 2022. A ação multiplicou por dez.' },
    { id: 'db', nome: 'Deutsche Bahn', setor: 'Infraestrutura', estatal: true, participacao: 100, valor: 0.03, margem: -0.01,
      logo: null, bonus: { pib: 0.08, capacidade_ind: 2 },
      desc: 'Cem por cento do Estado alemão, e mesmo assim os trens atrasam. Uma piada nacional com valor estratégico: move blindado da OTAN pro leste.' },
  ],
  FRA: [
    { id: 'edf', nome: 'EDF', setor: 'Energia', estatal: true, participacao: 100, valor: 0.06, margem: 0.05,
      logo: null, bonus: { pib: 0.14, capacidade_ind: 3 },
      desc: 'Renacionalizada em 2023. Cinquenta e seis reatores nucleares — 70% da eletricidade francesa. A independência energética que o resto da Europa inveja.' },
    { id: 'total', nome: 'TotalEnergies', setor: 'Energia', estatal: false, participacao: 6, valor: 0.15, margem: 0.07,
      petroleo: 2.0, logo: `${W}/en/thumb/5/54/TotalEnergies_logo.svg/250px-TotalEnergies_logo.svg.png`,
      bonus: { pib: 0.14 },
      desc: 'Petróleo francês com tentáculos na África inteira. Onde há um golpe no Sahel, há um contrato da Total por perto.' },
  ],
  IND: [
    { id: 'ongc', nome: 'ONGC', setor: 'Energia', estatal: true, participacao: 58, valor: 0.03, margem: 0.07,
      petroleo: 0.7, logo: null, bonus: { pib: 0.1 },
      desc: 'Estatal do petróleo indiano. Produz pouco pro tamanho da fome do país — a Índia importa 85% do que queima.' },
    { id: 'hal', nome: 'Hindustan Aeronautics', setor: 'Aeroespacial', estatal: true, participacao: 71, valor: 0.03, margem: 0.08,
      logo: `${W}/en/thumb/3/3e/Hindustan_Aeronautics_Limited_Logo.svg/330px-Hindustan_Aeronautics_Limited_Logo.svg.png`,
      bonus: { capacidade_ind: 3 },
      desc: 'Estatal que faz o Tejas — projeto iniciado em 1984, primeiro esquadrão em 2016. Orgulho nacional e atraso crônico na mesma fábrica.' },
  ],
  JPN: [{ id: 'mhi', nome: 'Mitsubishi Heavy', setor: 'Industrial', estatal: false, participacao: 4, valor: 0.03, margem: 0.06,
    logo: `${W}/commons/f/f8/Marunouchi_Nij%C5%ABbashi_Building.jpg`,
    bonus: { capacidade_ind: 3 },
    desc: 'Do Type 10 aos reatores de Fukushima. A espinha industrial do Japão — e a mesma empresa que fez o Zero na guerra.' }],
  ISR: [{ id: 'elbit', nome: 'Elbit Systems', setor: 'Defesa', estatal: false, participacao: 5, valor: 0.02, margem: 0.13,
    logo: `${W}/en/thumb/7/74/Elbit_Systems_logo-en.svg/250px-Elbit_Systems_logo-en.svg.png`,
    bonus: { capacidade_ind: 3, inteligencia: 2 },
    desc: 'Exporta guerra testada em campo. O argumento de venda é macabro e funciona: "usado em combate real".' }],
  TUR: [{ id: 'baykar', nome: 'Baykar', setor: 'Defesa', estatal: false, participacao: 0, valor: 0.01, margem: 0.15,
    logo: `${W}/commons/7/7a/BaykarLogo.png`,
    bonus: { capacidade_ind: 2 },
    desc: 'Familiar, privada, e mudou a guerra moderna com o TB2. O genro do presidente é o diretor de tecnologia — o que ajuda nas licenças.' }],
  ITA: [{ id: 'leonardo', nome: 'Leonardo', setor: 'Defesa', estatal: true, participacao: 30, valor: 0.02, margem: 0.08,
    logo: `${W}/en/c/ca/Finmeccanica_sede_centrale.jpg`,
    bonus: { capacidade_ind: 2 },
    desc: 'O Estado italiano é o maior acionista com 30% — o suficiente pra mandar num capital pulverizado. Helicópteros e guerra eletrônica.' }],
  SWE: [{ id: 'saab', nome: 'Saab', setor: 'Defesa', estatal: false, participacao: 0, valor: 0.02, margem: 0.1,
    logo: `${W}/en/thumb/6/6e/Saab_Technologies_logo.svg/960px-Saab_Technologies_logo.svg.png`,
    bonus: { capacidade_ind: 3 },
    desc: 'Faz o Gripen — e vende pro Brasil com transferência de tecnologia real, coisa que americano nunca ofereceu.' }],
  GBR: [{ id: 'bae', nome: 'BAE Systems', setor: 'Defesa', estatal: false, participacao: 0, valor: 0.05, margem: 0.09,
    logo: null, bonus: { capacidade_ind: 3 },
    desc: 'O Estado britânico tem uma golden share: pode vetar qualquer estrangeiro que queira comprar. Submarino nuclear não se vende.' }],
};

export function empresasDe(iso) {
  return (EMPRESAS_POR_PAIS[iso] || []).map((e) => ({ ...e }));
}

// ── PETRÓLEO: o elo entre a planilha e o mapa ──────────────────────────
// Produção nacional = soma do que cada empresa bombeia × a sua fatia nela.
// Investir na Petrobras faz o Brasil produzir mais. É literal.
export function producaoPetroleo(empresas) {
  let t = 0;
  for (const e of empresas || []) {
    if (!e.petroleo) continue;
    t += e.petroleo * (e.participacao / 100);
  }
  return Math.round(t * 10) / 10;
}

export function petroleiras(empresas) {
  return (empresas || []).filter((e) => e.petroleo > 0);
}

// ── LUCRO E BÔNUS ──────────────────────────────────────────────────────
// Petroleira lucra conforme o PREÇO do barril — por isso recebe o estado (opcional).
export function lucroDoTurno(empresas, estado = null) {
  let t = 0;
  for (const e of empresas || []) {
    let margem = e.margem;
    if (e.petroleo && estado?.preco_petroleo) {
      // preço acima da base engorda a margem da petroleira; abaixo, come
      margem *= 1 + ((estado.preco_petroleo - 78) / 78) * 0.8;
    }
    t += e.valor * margem * (e.participacao / 100);
  }
  // Margem é ANUAL; o mundo bate a cada mês → credita 1/12 do lucro por batida.
  return Math.round((t / 12) * 1000) / 1000;
}

export function bonusDoTurno(empresas) {
  const b = {};
  for (const e of empresas || []) {
    if (!e.bonus || e.participacao < 20) continue; // só manda quem tem fatia relevante
    const peso = e.participacao / 100;
    for (const [k, v] of Object.entries(e.bonus)) b[k] = round2((b[k] || 0) + v * peso);
  }
  return b;
}

// ── AÇÕES ──────────────────────────────────────────────────────────────
export function custoInvestir(e) { return round3(e.valor * 0.25); }
export function ganhoPrivatizar(e, pct) { return round3(e.valor * (pct / 100) * 1.15); } // ágio de venda
export function custoEstatizar(e, pct) { return round3(e.valor * (pct / 100) * 1.45); }  // prêmio de recompra
// Nacionalizar = confisco do que falta. Paga pouco (0,6×) e o capital do mundo foge.
export function custoNacionalizar(e) { return round3(e.valor * ((100 - e.participacao) / 100) * 0.6); }

export function ehEstatal(e) { return e.participacao >= 50; }
export function ehControle(e) { return e.participacao >= 20; }

// Defesa nacional forte = desconto extra ao comprar armas (produção própria de verdade).
export function descontoIndustrial(empresas) {
  const def = (empresas || []).filter((e) => e.setor === 'Defesa');
  const forca = def.reduce((a, e) => a + (e.participacao / 100), 0);
  return Math.min(0.2, forca * 0.12);
}

// Resumo do complexo estatal — pro cabeçalho do painel.
export function resumoEstatal(empresas) {
  const estatais = (empresas || []).filter(ehEstatal);
  const valorTotal = (empresas || []).reduce((a, e) => a + e.valor * (e.participacao / 100), 0);
  return {
    total: (empresas || []).length,
    estatais: estatais.length,
    patrimonio: round3(valorTotal),
    petroleo: producaoPetroleo(empresas),
  };
}

function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }
