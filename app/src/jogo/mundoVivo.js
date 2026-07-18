// ═══════════════════════════════════════════════════════════════════════
// MUNDO VIVO — os outros 190 países não existem só quando você clica neles
// ═══════════════════════════════════════════════════════════════════════
// O pedido: "que o mundo seja vivo e você sendo mais um nele". Guerras entre NPCs,
// pactos, pandemias — acontecendo COM ou SEM você, visíveis no mapa.
//
// ── A DIVISÃO DE TRABALHO COM A IA (a decisão de arquitetura) ────────
// A lógica SISTÊMICA decide O QUE acontece: quem entra em guerra, quem assina pacto,
// onde nasce o vírus, pra onde ele se espalha. Determinística, testável, barata,
// e serializável (multiplayer-ready: é tudo JSON puro dentro de `estado`).
// A IA escreve AS PALAVRAS: o resumo dos eventos entra no prompt do turno
// (montarUser) e a Máquina tece essas notícias no feed e na crise — SEM nenhuma
// chamada extra de rede. Se um dia a IA sumir, o mundo continua girando com os
// textos locais daqui.
//
// Regra de ouro: nada aqui depende de UI. O globo LÊ este estado e desenha;
// este módulo nunca toca no DOM.
import { PAISES } from '../dados/paises.js';
import { ehPetroestado } from '../dados/petroleo.js';
import { populacaoDe } from '../dados/populacaoMundo.js';
import { sinaisPrecocesPandemia } from '../dados/opiniao.js';
import { rand } from './rng.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sorteioDe = (a) => a[Math.floor(rand() * a.length)];
const chance = (p) => rand() < p;

// ── O GRAFO DE RIVALIDADES (tensão de base, dos dois lados reais) ─────
// Cada par tem uma tensão 0-100 que é a PROBABILIDADE ESTRUTURAL de virar guerra.
// Não é roteiro: é geografia e história comprimidas num número.
const RIVALIDADES = [
  { a: 'IND', b: 'PAK', tensao: 62, tema: 'Caxemira' },
  { a: 'ISR', b: 'IRN', tensao: 70, tema: 'o programa nuclear e os proxies' },
  { a: 'PRK', b: 'KOR', tensao: 55, tema: 'a península' },
  { a: 'CHN', b: 'TWN', tensao: 60, tema: 'a reunificação' },
  { a: 'SAU', b: 'IRN', tensao: 52, tema: 'a hegemonia do Golfo' },
  { a: 'TUR', b: 'GRC', tensao: 30, tema: 'o Egeu' },
  { a: 'EGY', b: 'ETH', tensao: 35, tema: 'a barragem do Nilo' },
  { a: 'USA', b: 'VEN', tensao: 32, tema: 'o petróleo e o regime' },
  { a: 'CHN', b: 'IND', tensao: 38, tema: 'a fronteira do Himalaia' },
  { a: 'RUS', b: 'UKR', tensao: 95, tema: 'a invasão' },
  { a: 'DZA', b: 'MAR', tensao: 28, tema: 'o Saara Ocidental' },
];

// Pares com afinidade — candidatos a pacto/acordo (o oposto do grafo acima).
const AFINIDADES = [
  { a: 'CHN', b: 'RUS', tema: 'energia e desafio à ordem ocidental' },
  { a: 'RUS', b: 'IRN', tema: 'drones por tecnologia nuclear' },
  { a: 'RUS', b: 'PRK', tema: 'munição por comida e mísseis' },
  { a: 'USA', b: 'JPN', tema: 'a contenção da China' },
  { a: 'USA', b: 'AUS', tema: 'submarinos do AUKUS' },
  { a: 'FRA', b: 'DEU', tema: 'o eixo europeu de defesa' },
  { a: 'IND', b: 'FRA', tema: 'caças e reatores' },
  { a: 'SAU', b: 'CHN', tema: 'petróleo em yuan' },
  { a: 'BRA', b: 'IND', tema: 'comércio Sul-Sul' },
  { a: 'TUR', b: 'PAK', tema: 'defesa e drones' },
];

// ── REGIÕES (pra pandemia se espalhar por vizinhança, não por teletransporte) ──
const REGIOES = {
  americas: ['USA', 'CAN', 'MEX', 'BRA', 'VEN', 'COL', 'ARG', 'CHL', 'PER'],
  europa: ['GBR', 'FRA', 'DEU', 'ITA', 'ESP', 'POL', 'UKR', 'SWE', 'GRC', 'ROU'],
  orienteMedio: ['ISR', 'IRN', 'SAU', 'TUR', 'EGY', 'IRQ', 'ARE', 'QAT', 'KWT', 'JOR'],
  asia: ['CHN', 'JPN', 'KOR', 'PRK', 'TWN', 'IND', 'PAK', 'IDN', 'VNM', 'THA', 'MYS'],
  africa: ['NGA', 'ETH', 'KEN', 'ZAF', 'DZA', 'MAR', 'AGO', 'EGY'],
  oceania: ['AUS', 'IDN', 'PHL'],
};

// PATÓGENOS — doenças REAIS retornando como novas variantes/cepas/escapes, cada uma
// com uma HISTÓRIA que justifica o surto (o dono pediu: "traga algo que justifique a
// nova pandemia, e um texto de história sobre cada vírus"). r0 = velocidade de contágio;
// letal = letalidade % (faixas sorteadas no nascimento). São ficção plausível sobre base
// real — variantes inventadas de doenças conhecidas, não afirmações sobre as reais.
const PATOGENOS = [
  { nome: 'Covid-19 · Variante Cérbero-Σ', tipo: 'coronavírus (escape imune)', r0: [2.0, 3.2], letal: [0.6, 1.8],
    historia: 'Descendente distante de Ômicron, a Cérbero-Σ acumulou mutações na proteína spike que enganam a memória das vacinas antigas. Circulou meses como "só mais um resfriado" antes de os hospitais notarem que a onda não passava.' },
  { nome: 'Ebola · Cepa Makona-2', tipo: 'filovírus', r0: [1.4, 2.0], letal: [30, 60],
    historia: 'Uma reintrodução do Ebola a partir de reservatório animal na bacia do Congo, com uma mutação que estende o período infeccioso ANTES dos sintomas — o que sempre segurou o Ebola. Dessa vez ele viajou de avião antes de sangrar.' },
  { nome: 'Febre Amarela · Surto Urbano', tipo: 'arbovírus (reurbanização)', r0: [1.6, 2.4], letal: [15, 35],
    historia: 'A febre amarela voltou às cidades pela porta que nunca fechou: o Aedes aegypti. Décadas de cobertura vacinal em queda deixaram metrópoles inteiras suscetíveis, e um único caso silvestre bastou pra reacender o ciclo urbano.' },
  { nome: 'H5N1 · Salto Mamífero', tipo: 'influenza aviária adaptada', r0: [1.8, 2.8], letal: [8, 20],
    historia: 'A gripe aviária que assombrava granjas finalmente encontrou a chave da transmissão entre mamíferos, saltando de fazendas de visons para humanos. O mundo tinha vacinas para a gripe humana — não para esta.' },
  { nome: 'Marburg · Vazamento de Laboratório', tipo: 'filovírus (bioseg.)', r0: [1.2, 1.8], letal: [40, 70],
    historia: 'Primo hemorrágico do Ebola, o Marburg escapou de um laboratório de nível 4 num acidente que ninguém assume. Governos trocam acusações enquanto a linhagem — idêntica a uma amostra de pesquisa — não deixa dúvida sobre a origem.' },
  { nome: 'Cólera · Cepa El Tor-9', tipo: 'bacteriana (saneamento)', r0: [1.5, 2.2], letal: [2, 8],
    historia: 'Onde a guerra e a enchente quebram o saneamento, a cólera espera. A El Tor-9 é uma linhagem resistente aos antibióticos de primeira linha, e se espalha pela água mais rápido do que se constroem estações de tratamento.' },
  { nome: 'Sarampo · Retorno MVX', tipo: 'recrudescência vacinal', r0: [3.0, 4.0], letal: [0.3, 1.2],
    historia: 'O sarampo nunca foi embora — só esperou a imunidade de rebanho cair. Com a vacinação em mínimas históricas, o vírus mais contagioso que se conhece varreu escolas inteiras antes de qualquer boletim oficial.' },
  { nome: 'MERS-CoV · Linhagem Camelo-7', tipo: 'coronavírus zoonótico', r0: [1.3, 1.9], letal: [20, 34],
    historia: 'A síndrome respiratória do Oriente Médio ganhou eficiência humana sem perder a letalidade que a tornava temida. Saltou de novo dos camelos, dessa vez com fôlego para cadeias de transmissão urbanas.' },
];
const rrange = ([a, b]) => a + rand() * (b - a);

// Países que participam do mundo vivo mas não são jogáveis (não estão em PAISES).
// Sem isto o feed imprime "EGY abre fogo contra ETH" — sigla crua quebra a ficção.
const NOMES_EXTRA = {
  ETH: 'Etiópia', GRC: 'Grécia', MAR: 'Marrocos', DZA: 'Argélia', COL: 'Colômbia',
  ARG: 'Argentina', CHL: 'Chile', PER: 'Peru', ITA: 'Itália', ESP: 'Espanha',
  POL: 'Polônia', SWE: 'Suécia', ROU: 'Romênia', IRQ: 'Iraque', ARE: 'Emirados',
  QAT: 'Catar', KWT: 'Kuwait', JOR: 'Jordânia', VNM: 'Vietnã', THA: 'Tailândia',
  MYS: 'Malásia', NGA: 'Nigéria', KEN: 'Quênia', ZAF: 'África do Sul', AGO: 'Angola',
  PHL: 'Filipinas',
};
const nomeDe = (iso) => PAISES[iso]?.nome || NOMES_EXTRA[iso] || iso;

// ── SEMENTE ───────────────────────────────────────────────────────────
// O mundo já começa em movimento: a guerra Rússia–Ucrânia está acontecendo em 2026,
// não esperando o jogador dar o primeiro clique.
export function semearMundoVivo(estado) {
  if (estado.conflitosNPC) return;
  estado.conflitosNPC = [];
  estado.pactosNPC = [];
  estado.pandemias = [];
  const eu = estado.iso || 'USA';
  if (eu !== 'RUS' && eu !== 'UKR') {
    estado.conflitosNPC.push({
      id: 'rus_ukr', a: 'RUS', b: 'UKR', intensidade: 82, turnos: 0, tema: 'a invasão',
    });
  }
}

// ── O TICK (fechamento de cada turno) ────────────────────────────────
// Retorna eventos [{tom, texto, visual}] — `visual` é a instrução pro mapa:
//   {tipo:'conflito'|'pacto'|'pandemia'|'fimConflito', a, b, isos...}
export function tickMundoVivo(estado) {
  semearMundoVivo(estado);
  const eu = estado.iso || 'USA';
  const eventos = [];

  // 1) CONFLITOS ATIVOS evoluem: escalam, sangram ou terminam
  for (const c of [...estado.conflitosNPC]) {
    c.turnos += 1;
    c.intensidade = clamp(c.intensidade + (rand() * 24 - 10), 5, 100);

    if (c.intensidade < 14 || (c.turnos > 5 && chance(0.3))) {
      estado.conflitosNPC = estado.conflitosNPC.filter((x) => x.id !== c.id);
      eventos.push({
        tom: 'bom', visual: { tipo: 'fimConflito', a: c.a, b: c.b },
        texto: sorteioDe([
          `${nomeDe(c.a)} e ${nomeDe(c.b)} assinam cessar-fogo. A disputa (${c.tema}) segue sem solução — ninguém venceu, os dois anunciam vitória.`,
          `Trégua entre ${nomeDe(c.a)} e ${nomeDe(c.b)} — exaustão dos dois lados vestida de diplomacia.`,
        ]),
      });
      continue;
    }
    if (c.intensidade > 70 && chance(0.55)) {
      eventos.push({
        tom: 'ruim', visual: { tipo: 'conflito', a: c.a, b: c.b },
        texto: sorteioDe([
          `${nomeDe(c.a)} lança a maior ofensiva do ano contra ${nomeDe(c.b)}. A linha de frente moveu — e o cemitério também.`,
          `Bombardeio pesado de ${nomeDe(c.a)} sobre ${nomeDe(c.b)}. As imagens de satélite amanheceram diferentes.`,
          `${nomeDe(c.b)} contra-ataca ${nomeDe(c.a)} de surpresa. A guerra que parecia congelada acordou.`,
        ]),
      });
      // guerra entre petroestados sacode o barril de todo mundo — inclusive o seu
      if (ehPetroestado(c.a) || ehPetroestado(c.b)) {
        estado.preco_petroleo = clamp((estado.preco_petroleo || 78) + 9, 18, 240);
      }
    }
  }

  // 2) CONFLITO NOVO nasce da rivalidade estrutural + temperatura do mundo
  if (estado.conflitosNPC.length < 3) {
    const quente = (estado.temp_guerra || 30) / 100;
    for (const r of RIVALIDADES) {
      if (r.a === eu || r.b === eu) continue;                       // guerra SUA é outra mecânica
      if (estado.conflitosNPC.find((c) => c.a === r.a && c.b === r.b)) continue;
      if (chance((r.tensao / 100) * 0.07 + quente * 0.03)) {
        const novo = { id: `${r.a}_${r.b}_${estado.turno || 0}`, a: r.a, b: r.b, intensidade: 45 + rand() * 25, turnos: 0, tema: r.tema };
        estado.conflitosNPC.push(novo);
        eventos.push({
          tom: 'ruim', visual: { tipo: 'conflito', a: r.a, b: r.b, novo: true },
          texto: `GUERRA: ${nomeDe(r.a)} abre fogo contra ${nomeDe(r.b)} — o estopim: ${r.tema}. O mundo tinha planos pra esta década.`,
        });
        break;   // um conflito novo por turno é suficiente — mais que isso vira ruído
      }
    }
  }

  // 3) PACTOS: o mundo também coopera (e cooperação alheia também é ameaça)
  if (chance(0.16)) {
    const a = sorteioDe(AFINIDADES.filter((p) => p.a !== eu && p.b !== eu
      && !estado.pactosNPC.find((x) => x.a === p.a && x.b === p.b)));
    if (a) {
      estado.pactosNPC.push({ a: a.a, b: a.b, tema: a.tema, turno: estado.turno || 0 });
      if (estado.pactosNPC.length > 6) estado.pactosNPC.shift();
      eventos.push({
        tom: 'aviso', visual: { tipo: 'pacto', a: a.a, b: a.b },
        texto: `${nomeDe(a.a)} e ${nomeDe(a.b)} fecham acordo sobre ${a.tema}. Assinaram sorrindo — pergunte-se contra quem.`,
      });
    }
  }

  // 4) PANDEMIA — a ameaça que não respeita fronteira nem míssil
  eventos.push(...tickPandemias(estado, eu));

  return eventos;
}

// ── PANDEMIAS ─────────────────────────────────────────────────────────
function tickPandemias(estado, eu) {
  const eventos = [];

  // NASCE como PRÉ-SURTO (rumor, ainda não oficial) — só os sinais no X denunciam. Intel
  // alta ganha mais antecedência pra reagir barato antes de virar notícia.
  if (!estado.pandemias.length && chance(0.045)) {
    const p = sorteioDe(PATOGENOS);
    const regiao = sorteioDe(Object.keys(REGIOES));
    const origem = sorteioDe(REGIOES[regiao]);
    const antecedencia = 2 + Math.floor(rand() * 3) + Math.floor((estado.inteligencia || 0) / 25);
    estado.pandemias.push({
      id: `${p.nome}_${estado.turno || 0}`.replace(/\s/g, '_'),
      nome: p.nome, tipo: p.tipo, historia: p.historia, origem, regiao, paises: [],
      turnos: 0, fase: 'presurto', r0: rrange(p.r0), letalidade: rrange(p.letal),
      gravidade: 4 + rand() * 6, gravidadeAnt: 5, mortos: 0,
      curaAcumulada: 0, contencaoAcumulada: 0, turnosPresurtoRestantes: antecedencia,
      antecedenciaTotal: antecedencia, contidoEm: {},
    });
    // sem evento de feed "sistema" — o presurto se anuncia SÓ pelos rumores no X.
  }

  for (const p of [...estado.pandemias]) {
    p.turnos += 1;
    p.gravidadeAnt = p.gravidade;

    // ── FASE PRÉ-SURTO: rumores no X, chance de abafar ANTES de estourar ──
    if (p.fase === 'presurto') {
      p.turnosPresurtoRestantes -= 1;
      p.gravidade = clamp(p.gravidade + 1 + rand() * 2, 0, 40);
      estado._pandemiaPosts = estado._pandemiaPosts || [];
      estado._pandemiaPosts.push(...sinaisPrecocesPandemia(estado.iso || eu, p, nomeDe(p.origem), p.antecedenciaTotal));
      // abafado a tempo? some sem NUNCA virar notícia oficial (recompensa agir cedo).
      if ((p.contencaoAcumulada + p.curaAcumulada * 0.6) >= 35) {
        estado.pandemias = estado.pandemias.filter((x) => x.id !== p.id);
        estado.soft_power = clamp((estado.soft_power || 0) + 12, 0, 100);
        estado.inteligencia = clamp((estado.inteligencia || 0) + 4, 0, 100);
        eventos.push({ tom: 'bom', visual: { tipo: 'fimPandemia', isos: [p.origem] },
          texto: `Um foco em ${nomeDe(p.origem)} foi contido em segredo antes de virar notícia. O que vocês evitaram, só os arquivos confidenciais sabem.` });
        continue;
      }
      if (p.turnosPresurtoRestantes <= 0) {
        p.fase = 'surto'; p.paises = [p.origem];
        eventos.push({ tom: 'aviso', visual: { tipo: 'pandemia', isos: [p.origem] },
          texto: `A OMS confirma surto de ${p.nome} (${p.tipo}) em ${nomeDe(p.origem)}. "Sob controle", diz o governo local — a frase que sempre antecede o caos.` });
      }
      continue;
    }

    // ── GRAVIDADE: cresce por R0×alcance, freia com contenção+cura ──
    const resistencia = clamp((p.contencaoAcumulada || 0) + (p.curaAcumulada || 0) * 0.6, 0, 100);
    const empurrao = p.r0 * 5.5 * (Math.max(1, p.paises.length) ** 0.35);
    p.gravidade = clamp(p.gravidade + empurrao - resistencia * 0.11 + (rand() * 4 - 2), 0, 100);

    if (p.gravidade <= 8 && p.turnos > 3) p.fase = 'declinio';
    else if (p.gravidade >= 62 || p.paises.length >= 5) p.fase = 'pandemia';
    else if (p.gravidade >= 30 || p.paises.length >= 2) p.fase = 'epidemia';
    else p.fase = 'surto';

    if (p.fase === 'declinio') {
      if (p.gravidade <= 3 || p.turnos >= 16) {
        estado.pandemias = estado.pandemias.filter((x) => x.id !== p.id);
        eventos.push({ tom: 'bom', visual: { tipo: 'fimPandemia', isos: p.paises },
          texto: `A OMS declara o fim da emergência de ${p.nome}. ${p.mortos.toLocaleString('pt-BR')} mortos, ${p.paises.length} países atravessados.` });
        continue;
      }
    } else {
      const chanceEspalhar = clamp(0.05 + p.r0 * 0.09 - (p.contencaoAcumulada || 0) / 180, 0.02, 0.6);
      if (chance(chanceEspalhar)) {
        const dentroDa = REGIOES[p.regiao].filter((i) => !p.paises.includes(i) && !p.contidoEm[i]);
        const salto = chance(0.3);
        const novos = [];
        if (dentroDa.length && !salto) novos.push(sorteioDe(dentroDa));
        else {
          const outra = sorteioDe(Object.keys(REGIOES).filter((r) => r !== p.regiao));
          const cand = REGIOES[outra].filter((i) => !p.paises.includes(i));
          if (cand.length) { novos.push(sorteioDe(cand)); p.regiao = outra; }
        }
        if (novos.length) {
          p.paises.push(...novos);
          eventos.push({ tom: 'ruim', visual: { tipo: 'pandemia', isos: novos, salto },
            texto: salto ? `${p.nome} salta de continente: primeiro caso em ${nomeDe(novos[0])}.`
              : `${p.nome} cruza a fronteira: ${nomeDe(novos[0])} confirma transmissão comunitária.` });
        }
      }
    }

    // MORTOS acumulam por gravidade × letalidade × população exposta.
    const popExposta = p.paises.reduce((a, c) => a + populacaoDe(c), 0);
    p.mortos += Math.round(popExposta * 1e6 * (p.letalidade / 100) * (p.gravidade / 100) * 0.00028);

    // VOCÊ FOI ALCANÇADO — o efeito escala com a gravidade.
    if (p.paises.includes(eu)) {
      const escala = p.gravidade / 50;
      if (!p.jaTeAlcancou) {
        p.jaTeAlcancou = true;
        estado.aprovacao = clamp((estado.aprovacao || 50) - 4 * escala, 0, 100);
        estado.temp_economia = clamp((estado.temp_economia || 50) - 7 * escala, 0, 100);
        estado.estabilidade = clamp((estado.estabilidade || 50) - 3 * escala, 0, 100);
        eventos.push({ tom: 'ruim', visual: { tipo: 'pandemia', isos: [eu] },
          texto: `${p.nome} chegou ao SEU território. Hospitais lotando, mercado em pânico.` });
      } else {
        estado.temp_economia = clamp((estado.temp_economia || 50) - (p.gravidade / 100) * 1.2, 0, 100);
      }
    }
    if (p.paises.length >= 3 && p.fase !== 'declinio') {
      estado.preco_petroleo = clamp((estado.preco_petroleo || 78) - Math.round(p.gravidade / 20), 18, 240);
    }
  }

  return eventos;
}

// Tendência da gravidade (pra UI): subindo, recuando ou estável.
export function tendenciaPandemia(pd) {
  const d = (pd.gravidade || 0) - (pd.gravidadeAnt || 0);
  return d > 1.5 ? 'crescendo' : d < -1.5 ? 'recuando' : 'estavel';
}

// ── RESUMO PRA IA ─────────────────────────────────────────────────────
// Vai dentro do prompt do turno (montarUser): a Máquina tece o mundo vivo na crise
// e no feed sem nenhuma chamada extra de rede.
export function resumoMundoVivo(estado) {
  const linhas = [];
  for (const c of estado.conflitosNPC || []) {
    linhas.push(`guerra ativa: ${nomeDe(c.a)} × ${nomeDe(c.b)} por ${c.tema} (intensidade ${Math.round(c.intensidade)}, há ${c.turnos} turnos)`);
  }
  for (const p of estado.pandemias || []) {
    linhas.push(`pandemia: ${p.nome} (${p.tipo}) em ${p.paises.length} países, fase ${p.fase}${p.paises.includes(estado.iso) ? ' — INCLUSIVE O NOSSO' : ''}`);
  }
  for (const pc of (estado.pactosNPC || []).slice(-3)) {
    linhas.push(`pacto recente: ${nomeDe(pc.a)} + ${nomeDe(pc.b)} (${pc.tema})`);
  }
  return linhas.length ? linhas.join('\n  ') : '(mundo em calmaria tensa)';
}

// ── ESCARAMUÇA AO VIVO ────────────────────────────────────────────────
// Pra fase de planejamento não ser um mundo congelado: sorteia um conflito ativo
// pra UI animar (arco + balão) enquanto você pensa. Só decide O QUE; a UI desenha.
const ESCARAMUCAS = [
  (a, b) => `Artilharia de ${a} varre posições de ${b} durante a madrugada.`,
  (a, b) => `Drones de ${a} atingem um depósito de combustível em ${b}. A coluna de fumaça aparece do espaço.`,
  (a, b) => `${b} derruba dois caças de ${a}. Os destroços caíram em área civil.`,
  (a, b) => `Tropas de ${a} tentam avançar sobre ${b} e recuam com baixas. O comunicado oficial chama de "reposicionamento".`,
];
export function escaramucaAleatoria(estado) {
  const c = sorteioDe(estado.conflitosNPC || []);
  if (!c) return null;
  const invertido = chance(0.5);
  const [de, para] = invertido ? [c.b, c.a] : [c.a, c.b];
  return { de, para, texto: sorteioDe(ESCARAMUCAS)(nomeDe(de), nomeDe(para)) };
}

// ── PULSO AO VIVO (entre turnos) ──────────────────────────────────────
// O mundo se mexe SEM você passar o turno. A cada batida o planeta faz UMA coisa —
// uma escaramuça que sacode o barril, um recuo de tropa, um murmúrio de mercado — e
// devolve um evento pra UI empurrar no X e, às vezes, no plantão. É a Máquina viva:
// países da IA agindo e te notificando com notícias que te impactam de verdade.
const MURMURIOS = [
  { texto: 'Mercados asiáticos abrem no vermelho com o clima de guerra. Capital corre pra o dólar e pro ouro.', tom: 'aviso' },
  { texto: 'Um porta-aviões estrangeiro cruza um estreito estratégico "em exercício de rotina". Ninguém acredita na palavra rotina.', tom: 'aviso' },
  { texto: 'Cúpula de emergência convocada por três potências. Você não foi convidado — e é isso que deveria te preocupar.', tom: 'neutro' },
  { texto: 'Vazamento de documentos expõe conversas secretas entre dois governos. As chancelarias negam tudo, rápido demais.', tom: 'aviso' },
  { texto: 'Rota comercial marítima é reaberta após semanas de tensão. Os fretes respiram; os traders, nem tanto.', tom: 'bom' },
];
const nomeAoVivo = (iso) => nomeDe(iso);
export function pulsoAoVivo(estado) {
  const eu = estado.iso || 'USA';
  const conflitos = (estado.conflitosNPC || []).filter((c) => c.a !== eu && c.b !== eu);
  // 1) Guerra num PETRO-ESTADO sacode o SEU barril — e vira plantão.
  const petro = conflitos.find((c) => ehPetroestado(c.a) || ehPetroestado(c.b));
  if (petro && chance(0.4)) {
    const alta = 4 + Math.round(rand() * 8);
    const antes = estado.preco_petroleo || 78;
    estado.preco_petroleo = clamp(antes + alta, 18, 240);
    const iso = ehPetroestado(petro.a) ? petro.a : petro.b;
    const motivo = `Escalada ${nomeAoVivo(petro.a)}×${nomeAoVivo(petro.b)} aperta o fornecimento`;
    return {
      tipo: 'petroleo', iso, barril: alta, motivo, tom: 'ruim', breaking: true,
      texto: `Escalada entre ${nomeAoVivo(petro.a)} e ${nomeAoVivo(petro.b)} aperta o fornecimento — o Brent salta ${alta} no pregão. Quem importa petróleo sente no caixa.`,
    };
  }
  // 2) Escaramuça de um conflito ativo (mapa + feed).
  const esc = escaramucaAleatoria(estado);
  if (esc && chance(0.65)) return { tipo: 'escaramuca', de: esc.de, para: esc.para, texto: esc.texto, tom: 'aviso' };
  // 3) Murmúrio de mundo (quando não há guerra pra mostrar).
  return { tipo: 'murmurio', ...sorteioDe(MURMURIOS) };
}
