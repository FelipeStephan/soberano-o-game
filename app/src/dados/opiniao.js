// ═══════════════════════════════════════════════════════════════════════
// OPINIÃO PÚBLICA — os perfis de rede social que reagem a você
// ═══════════════════════════════════════════════════════════════════════
// O que isto traz: a timeline deixa de ser só jornal e povo genérico. Agora tem PERFIS
// RECORRENTES com viés político — esquerda, direita, populista, centrão — que reagem às
// SUAS ações e às da Máquina com cara de rede social de verdade: ácido, engajado, atual.
// A mesma jogada faz a esquerda vaiar e a direita aplaudir (e vice-versa) — é o cabo de
// guerra da opinião, que é metade da graça de governar.
//
// Cada perfil: { nome, handle, seed (avatar), vies, voz }. `voz` orienta a IA/gabarito.
// Por país quando dá; senão cai no GENERICO (handles neutros).

const P = (nome, handle, vies, voz) => ({ nome, handle, seed: handle, vies, voz });

export const PERFIS_POR_PAIS = {
  BRA: [
    P('Verônica Lima', '@veroresiste', 'esquerda', 'militante progressista, ironia ácida, fala em direitos e desigualdade'),
    P('Cel. Bruno (Res.)', '@brunopatria', 'direita', 'conservador linha-dura, ordem, família, "mimimi"'),
    P('Zé do Bairro', '@zedaquebrada', 'populista', 'povão revoltado com preço, político e imposto — xinga geral'),
    P('Marina Costa', '@marina_pauta', 'centrista', 'jornalista cética, pondera os dois lados, cobra dado'),
  ],
  USA: [
    P('Ashley Rivera', '@ashrivera_', 'esquerda', 'progressive, snarky, talks equity, climate, healthcare'),
    P('Chuck Dalton', '@realchuckd', 'direita', 'MAGA-style, flags, "America First", owns the libs'),
    P('BuzzPolitics', '@buzzpolitics', 'populista', 'outrage account, everything is a scandal, ALL CAPS'),
    P('Dana Whitfield', '@d_whitfield', 'centrista', 'wonky centrist pundit, "let us look at the numbers"'),
  ],
  RUS: [
    P('Katya V.', '@katya_pravda', 'esquerda', 'crítica cansada, ironia soviética, fala baixinho'),
    P('Igor Silovik', '@igor_sila', 'direita', 'nacionalista, orgulho imperial, "o Ocidente que se cuide"'),
    P('Narod News', '@narod_now', 'populista', 'revolta popular com preço e corrupção'),
    P('Lena A.', '@lena_analiz', 'centrista', 'analista fria, pesa custos'),
  ],
  CHN: [
    P('小李 (Xiao Li)', '@xiaoli_talk', 'esquerda', 'jovem urbano, sarcasmo velado, fala em desigualdade'),
    P('国安 (GuoAn)', '@guoan_zheng', 'direita', 'nacionalista, orgulho, "estabilidade acima de tudo"'),
    P('民声 (MinSheng)', '@minsheng_now', 'populista', 'reclama de emprego, moradia, preço'),
    P('观察者 Zhao', '@zhao_watch', 'centrista', 'analista mede consequências'),
  ],
  GENERICO: [
    P('The Citizen', '@thecitizen_x', 'esquerda', 'progressive citizen, cares about rights & inequality'),
    P('National Voice', '@natvoice', 'direita', 'nationalist, order & tradition'),
    P('Street Pulse', '@streetpulse', 'populista', 'angry populist, prices & elites'),
    P('The Analyst', '@the_analyst', 'centrista', 'measured skeptic, weighs both sides'),
  ],
};

// Contas virais globais — aparecem em qualquer país (o "mundo comentando").
export const PERFIS_INTERNACIONAIS = [
  P('World in Chaos', '@worldinchaos', 'populista', 'viral doom account, dramatic global takes'),
  P('GeoBrief', '@geobrief', 'centrista', 'sober geopolitics thread account'),
];

export function opiniaoDe(iso) {
  return [...(PERFIS_POR_PAIS[iso] || PERFIS_POR_PAIS.GENERICO), ...PERFIS_INTERNACIONAIS];
}

// ── GABARITO DE FALAS por TEMA × VIÉS ─────────────────────────────────
// O fallback forte (sem IA). Cada tema tem uma fala por viés — a esquerda e a direita
// leem o MESMO fato de formas opostas. `{X}` é o nome do jogador/país.
const FALAS = {
  guerra: {
    esquerda: 'de novo bilhões pra bomba enquanto hospital cai aos pedaços. {X} escolheu a guerra. escolheu errado 🕊️',
    direita: 'FINALMENTE um governo com coragem. {X} não abaixou a cabeça pra ninguém. é isso 🇺🇸🔥',
    populista: 'guerra guerra guerra e o pão subindo. quem paga essa conta somos NÓS de novo??',
    centrista: 'ofensiva de {X} tem lógica estratégica, mas o custo político e no barril vai aparecer. fica o alerta.',
  },
  corrupcao: {
    esquerda: 'a máscara caiu. {X} governando pra si e pros amigos. cadê a "nova política"? 🤡',
    direita: 'mídia militante inventando escândalo pra atacar {X}. não caio nessa. seletividade escancarada.',
    populista: 'É TUDO LADRÃO. avisei. de {X} pra baixo é tudo a mesma quadrilha 🤬',
    centrista: 'as denúncias contra {X} são graves e precisam de apuração. sem linchamento, mas sem passar pano.',
  },
  repressao: {
    esquerda: '{X} calando quem discorda. isso tem nome e a história já ensinou onde termina.',
    direita: 'ordem restaurada. baderna não é liberdade. {X} fez o que tinha que ser feito.',
    populista: 'primeiro calam a gente, depois tomam tudo. acordem!!',
    centrista: 'medidas de {X} podem estabilizar no curto prazo, mas corroem instituição. conta chega.',
  },
  reforma: {
    esquerda: 'reforma de {X} = tirar de quem tem pouco pra dar a quem tem tudo. clássico.',
    direita: 'coragem de fazer o impopular. {X} tá modernizando o país. mercado responde na hora.',
    populista: 'reforma pra quem? pro andar de cima. pro povo é sempre "aperta o cinto".',
    centrista: 'a reforma de {X} melhora as contas no médio prazo. o custo social imediato é real — não dá pra ignorar.',
  },
  vitoria: {
    esquerda: 'ok, {X} acertou dessa vez. anotado. mas seguimos de olho.',
    direita: 'É {X}! É ASSIM QUE SE FAZ. chora quem não vota 👑',
    populista: 'até que enfim uma boa notícia nesse país. dura quanto?',
    centrista: 'bom momento pra {X}. os números sustentam. veremos se dura.',
  },
  crise: {
    esquerda: 'colhendo o que plantou. {X} governou pra poucos e agora a conta chegou.',
    direita: 'sabotagem. {X} tá sendo atacado por dentro e por fora. resistir!',
    populista: 'tá tudo caindo e ninguém resolve. cansei de {X} e de todos eles.',
    centrista: 'cenário se deteriora sob {X}. hora de decisões difíceis, não de narrativa.',
  },
};

// Escolhe o TEMA dominante do turno a partir das ações e da variação de estado.
export function temaDoTurno(resultados = [], mudancas = []) {
  const ids = resultados.map((r) => r.id || '').join(' ');
  if (/guerra|conquista|inf|blindados|cacas|mobilizar|nuclear|ogiva/.test(ids)) return 'guerra';
  if (/comprar_congresso|propina|caixa_dois|anticorrupcao/.test(ids)) return 'corrupcao';
  if (/perseguir_opositor|censura|estado_excecao|purga|propaganda/.test(ids)) return 'repressao';
  if (/reforma|imposto_up|austeridade/.test(ids)) return 'reforma';
  const dAprov = (mudancas.find((m) => m.chave === 'aprovacao')?.delta) || 0;
  if (dAprov <= -5) return 'crise';
  if (dAprov >= 5) return 'vitoria';
  return null;
}

// Monta 2–3 posts de perfis de VIESES OPOSTOS reagindo ao tema. É o fallback; a IA
// pode enriquecer por cima (ver contrato.js). `nomeJogador` entra no lugar de {X}.
export function reacoesSociais(iso, tema, nomeJogador, turno = 0) {
  if (!tema || !FALAS[tema]) return [];
  const perfis = opiniaoDe(iso);
  // Garante contraste: 1 esquerda, 1 direita, e 1 de populista/centrista (alternado).
  const porVies = (v) => perfis.filter((p) => p.vies === v);
  const pick = (v, i = 0) => (porVies(v)[i % Math.max(1, porVies(v).length)] || null);
  const terceiro = turno % 2 === 0 ? 'populista' : 'centrista';
  const escolhidos = [pick('esquerda'), pick('direita'), pick(terceiro)].filter(Boolean);
  return escolhidos.map((perfil) => ({
    tipo: 'cidadao',
    handle: perfil.handle,
    nome: perfil.nome,
    avatarSeed: perfil.seed,
    vies: perfil.vies,
    texto: (FALAS[tema][perfil.vies] || '').replace(/\{X\}/g, nomeJogador || 'o governo'),
  }));
}

// ── SINAIS PRECOCES DE PANDEMIA (PRÉ-SURTO) ───────────────────────────
// ANTES de a OMS confirmar, o X já sussurra. Perfis com viés postam rumores cada vez
// mais fortes (estágio 0→2) conforme a doença se aproxima de estourar — a dica pro
// jogador atento agir cedo (barato) em vez de tarde (caro). {LOCAL} = país de origem.
const RUMORES_PRESURTO = {
  0: {
    esquerda: 'relatos soltos de gente passando mal em {LOCAL}. governo já sabe e não fala nada, claro.',
    direita: 'rumor de doença em {LOCAL}. provavelmente fake news de sempre, mas vamos observar.',
    populista: 'gente jurando que tem coisa MUITO estranha rolando em {LOCAL}. tomara que seja boato 🙏',
    centrista: 'médicos em {LOCAL} relatam aumento incomum de casos respiratórios. sem confirmação oficial ainda.',
  },
  1: {
    esquerda: 'hospitais em {LOCAL} lotando e ninguém no governo levanta a mão. quantos precisam adoecer?',
    direita: 'antes do pânico: {LOCAL} tem uma situação de saúde sendo MONITORADA. calma, gente.',
    populista: 'JÁ ERA. hospital de {LOCAL} sem leito. e a OMS dormindo igual sempre 😤',
    centrista: 'a OMS abriu investigação preliminar sobre o quadro em {LOCAL}. ainda não é emergência — mas está perto.',
  },
  2: {
    esquerda: 'a essa altura já dá pra saber: {LOCAL} tem um surto e vão esconder enquanto puderem.',
    direita: '{LOCAL} sob controle das autoridades. parem de espalhar pânico antes da confirmação.',
    populista: 'AMANHÃ é tarde demais pra fingir que não é nada em {LOCAL}. marquem minhas palavras 🚨',
    centrista: 'sinais em {LOCAL} agora são fortes o bastante pra preocupar epidemiologistas sérios. anúncio é questão de dias.',
  },
};
export function sinaisPrecocesPandemia(iso, pd, localNome, antecedenciaTotal) {
  const passou = (antecedenciaTotal || 3) - (pd.turnosPresurtoRestantes || 0);
  const estagio = Math.max(0, Math.min(2, Math.floor((passou / Math.max(1, antecedenciaTotal)) * 3)));
  const perfis = opiniaoDe(iso);
  const pick = (v) => perfis.find((p) => p.vies === v);
  const escolhidos = [pick('populista'), pick('centrista'), Math.random() < 0.4 ? PERFIS_INTERNACIONAIS[0] : null].filter(Boolean);
  return escolhidos.map((perfil) => ({
    tipo: 'cidadao', handle: perfil.handle, nome: perfil.nome, avatarSeed: perfil.seed, vies: perfil.vies,
    texto: (RUMORES_PRESURTO[estagio][perfil.vies] || RUMORES_PRESURTO[estagio].centrista).replace(/\{LOCAL\}/g, localNome || 'uma região'),
  }));
}
