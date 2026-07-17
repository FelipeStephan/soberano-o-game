// REGISTRO ÚNICO DE VARIÁVEIS DO ESTADO DO MUNDO.
// Fonte da verdade para: HUD (rótulo/grupo), validação da IA (teto) e limites (min/max).
// Adicionar uma variável ao jogo = adicionar uma entrada aqui.

export const VARS = {
  // ── Medidores de opinião/força (0–100, barras) ──────────────────────
  aprovacao:      { rotulo: 'Aprovação',        grupo: 'medidor', min: 0, max: 100, cap: 25, cor: '#4fd1ff', dica: 'Quanto o seu povo te apoia. Cai muito e vêm protestos.' },
  estabilidade:   { rotulo: 'Estabilidade',     grupo: 'medidor', min: 0, max: 100, cap: 25, cor: '#47e0a0', dica: 'O quão firme está o país por dentro. Baixa = risco de caos e golpe.' },
  soft_power:     { rotulo: 'Influência',       grupo: 'medidor', min: 0, max: 100, cap: 25, cor: '#b98cff', dica: 'Seu poder de convencer o mundo sem disparar um tiro — cultura, diplomacia, respeito.' },
  seguranca:      { rotulo: 'Segurança',        grupo: 'medidor', min: 0, max: 100, cap: 25, cor: '#ffcc4f', dica: 'O quão protegido o país está de ataques, espiões e sabotagem.' },
  temp_guerra:    { rotulo: 'Clima de Guerra',  grupo: 'medidor', min: 0, max: 100, cap: 25, cor: '#ff5a6e', dica: 'A tensão militar no mundo. Perto de 100, qualquer faísca vira guerra.' },
  temp_economia:  { rotulo: 'Confiança do Mercado', grupo: 'medidor', min: 0, max: 100, cap: 25, cor: '#4fe0c8', dica: 'A fé dos investidores na sua economia. Baixa = fuga de dinheiro e recessão.' },
  liberdades:     { rotulo: 'Liberdades',       grupo: 'medidor', min: 0, max: 100, cap: 25, cor: '#7fa8ff', dica: 'Direitos e liberdade do seu povo. Sufocar rende controle, mas custa apoio.' },
  poder_militar:  { rotulo: 'Poder Militar',    grupo: 'medidor', min: 0, max: 100, cap: 20, cor: '#ff8c42', dica: 'A força bruta das suas Forças Armadas — quem pesa, dita a mesa.' },

  // ── Economia (US$ trilhões) ─────────────────────────────────────────
  pib:      { rotulo: 'PIB',           grupo: 'economia', min: 0, max: 200, cap: 4, dinheiro: true, dica: 'Tudo o que o país produz de riqueza em um ano. Quanto maior, mais forte a nação.' },
  tesouro:  { rotulo: 'Tesouro Nacional', grupo: 'economia', min: 0, max: 9999, cap: 2, dinheiro: true, dica: 'O caixa do país — o dinheiro que você tem em mãos para gastar agora.' }, // caixa acumulável
  divida:   { rotulo: 'Endividamento',  grupo: 'economia', min: 0, max: 300, cap: 25, sufixo: '% do PIB', dica: 'Quanto o país deve, comparado ao que produz num ano. Acima de 100% = deve mais de um ano inteiro de produção.' },
  aliquota: { rotulo: 'Impostos',      grupo: 'economia', min: 0, max: 60, cap: 8, sufixo: '%', dica: 'A fatia da economia que vira imposto. Mais imposto enche o caixa, mas irrita o povo e o mercado.' },

  // ── Capacidades (0–100) ─────────────────────────────────────────────
  inteligencia:   { rotulo: 'Inteligência',    grupo: 'capacidade', min: 0, max: 100, cap: 25, dica: 'A força dos seus espiões: descobrir segredos, sabotar, prever golpes.' },
  capacidade_ind: { rotulo: 'Indústria',       grupo: 'capacidade', min: 0, max: 100, cap: 25, dica: 'A capacidade das suas fábricas — produzir armas, equipamentos e bens em escala.' },
  uranio:         { rotulo: 'Urânio',          grupo: 'capacidade', min: 0, max: 100, cap: 25, dica: 'Combustível do programa nuclear. Sem urânio, não há ogiva.' },

  // ── Poder territorial / arsenal ─────────────────────────────────────
  territorio: { rotulo: 'Territórios', grupo: 'poder', min: 0, max: 999, cap: 2, dica: 'Quantos territórios você controla — o seu, mais os que conquistou.' },
  ogivas:     { rotulo: 'Ogivas Nucleares', grupo: 'poder', min: 0, max: 500, cap: 5, dica: 'Bombas nucleares prontas. A arma que ninguém quer usar — e todo mundo teme.' },

  // ── Eixos políticos (-100..+100) ────────────────────────────────────
  eixo_economico:  { rotulo: 'Rumo Econômico',  grupo: 'politico', min: -100, max: 100, cap: 25, dica: 'De Estado controlando tudo (-) a livre mercado (+). Define o tipo da sua economia.' },
  eixo_autoridade: { rotulo: 'Estilo de Governo', grupo: 'politico', min: -100, max: 100, cap: 25, dica: 'De mais liberdade ao povo (-) a mais controle e mão firme (+).' },
};

// Qualitativos (valor string de conjunto fechado) — não numéricos.
export const QUALITATIVOS = {
  risco_exposicao: ['baixo', 'medio', 'alto'],
};

// Listas derivadas (por grupo), úteis pra HUD e prompt.
export const porGrupo = (g) => Object.keys(VARS).filter((k) => VARS[k].grupo === g);
export const MEDIDORES = porGrupo('medidor');
export const ECONOMIA = porGrupo('economia');
export const CAPACIDADES = porGrupo('capacidade');
export const POLITICOS = porGrupo('politico');

// Chave de efeito válida? (numérica do registro, relação, ou qualitativo)
export function chaveValida(chave) {
  return Boolean(VARS[chave]) || chave.startsWith('rel_') || Boolean(QUALITATIVOS[chave]);
}

// Teto por chave (para o validador aparar valores).
export function tetoDe(chave) {
  if (VARS[chave]) return VARS[chave].cap;
  if (chave.startsWith('rel_')) return 40;
  return 0;
}

// Limites por chave (para aplicar efeitos).
export function limitesDe(chave) {
  if (VARS[chave]) return { min: VARS[chave].min, max: VARS[chave].max };
  if (chave.startsWith('rel_')) return { min: -100, max: 100 };
  return { min: -Infinity, max: Infinity };
}
