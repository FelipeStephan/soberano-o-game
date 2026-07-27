// A IMPRENSA MUNDIAL — marcas reais (protótipo local, sem fins comerciais).
// Cada veículo tem POSIÇÃO POLÍTICA e SIMPATIA por você (0–100). Investir em mídia
// compra cobertura; ir contra a linha editorial dela custa caro.
//
// `eixo`: onde o veículo se situa (economico -100..+100, autoridade -100..+100).
//   Um jornal de esquerda te elogia se você é estatista; um de direita, se é liberal.
// `simpatia`: 0 hostil · 50 neutro · 100 comprado. Sobe com propaganda/publicidade.

export const VEICULOS = [
  // O PERFIL DE FOFOCA que engole qualquer boato — é por ele que a FAKE NEWS do
  // jogador entra no timeline. Sem linha editorial, sem checagem: só alcance.
  {
    nome: 'Choquei', handle: '@choquei', dominio: 'choquei.com.br', cor: '#111111', pais: 'Brasil',
    posicao: 'Agregador viral', eixo: { economico: 0, autoridade: 0 }, simpatia: 50,
    vies: 'Republica tudo que engaja, sem apurar. Boato vira manchete em minutos — e a correção nunca vem.',
  },
  {
    nome: 'CNN', handle: '@CNN', dominio: 'cnn.com', cor: '#cc0000', pais: 'EUA',
    posicao: 'Centro-liberal', eixo: { economico: 15, autoridade: -25 }, simpatia: 50,
    vies: 'Cobertura 24h, urgência, "BREAKING NEWS". Liberal-centrista: defende instituições e direitos, dramatiza crises e desconfia de mão-de-ferro.',
  },
  {
    nome: 'Fox News', handle: '@FoxNews', dominio: 'foxnews.com', cor: '#003366', pais: 'EUA',
    posicao: 'Direita', eixo: { economico: 60, autoridade: 45 }, simpatia: 50,
    vies: 'Conservador, hawkish, nacionalista. Aplaude força militar, corte de impostos e lei-e-ordem. Ataca fraqueza, gastança e "globalismo".',
  },
  {
    nome: 'BBC News', handle: '@BBCWorld', dominio: 'bbc.com', cor: '#bb1919', pais: 'Reino Unido',
    posicao: 'Centro', eixo: { economico: 0, autoridade: -15 }, simpatia: 50,
    vies: 'Sóbrio, britânico, factual. Não se empolga nem se revolta: contextualiza, pondera e cobra provas. Alérgico a retórica.',
  },
  {
    nome: 'Reuters', handle: '@Reuters', dominio: 'reuters.com', cor: '#ff8000', pais: 'Global',
    posicao: 'Neutro / agência', eixo: { economico: 10, autoridade: 0 }, simpatia: 50,
    vies: 'Agência: seco, direto, sem adjetivo. Só fatos, números, mercados. Nunca opina — o que é uma opinião em si.',
  },
  {
    nome: 'O Globo', handle: '@JornalOGlobo', dominio: 'oglobo.globo.com', cor: '#0d4c8f', pais: 'Brasil',
    posicao: 'Centro-direita', eixo: { economico: 40, autoridade: 10 }, simpatia: 50,
    vies: 'Brasileiro, olhar do Sul Global sobre as potências. Liberal na economia, institucionalista. Cobra responsabilidade fiscal e critica aventuras militares.',
  },
  {
    nome: 'Al Jazeera', handle: '@AJEnglish', dominio: 'aljazeera.com', cor: '#fa9000', pais: 'Catar',
    posicao: 'Progressista / anti-hegemônico', eixo: { economico: -30, autoridade: -35 }, simpatia: 45,
    vies: 'Perspectiva do Oriente Médio/Sul Global. Crítico feroz do intervencionismo ocidental, ocupação e sanções. Dá voz a quem apanha.',
  },
  {
    nome: 'Financial Times', handle: '@FT', dominio: 'ft.com', cor: '#e5b98a', pais: 'Reino Unido',
    posicao: 'Liberal econômico', eixo: { economico: 70, autoridade: -10 }, simpatia: 50,
    vies: 'Econômico e frio. Só se importa com mercados, dívida, juros e risco. Aplaude reforma e disciplina fiscal; despreza populismo de qualquer lado.',
  },
  {
    nome: 'The Guardian', handle: '@guardian', dominio: 'theguardian.com', cor: '#052962', pais: 'Reino Unido',
    posicao: 'Esquerda', eixo: { economico: -55, autoridade: -50 }, simpatia: 45,
    vies: 'Esquerda progressista. Defende liberdades civis, meio ambiente e Estado social. Detesta vigilância, repressão e guerra. Moralista quando quer.',
  },
];

export const VEICULO_POR_NOME = Object.fromEntries(VEICULOS.map((v) => [v.nome, v]));

// Alinhamento entre a linha editorial do veículo e o SEU regime (-100..+100).
// Perto de 100 = ele te ama por ideologia. Perto de -100 = você é tudo que ele odeia.
export function alinhamento(veiculo, estado) {
  const dE = Math.abs(veiculo.eixo.economico - estado.eixo_economico);
  const dA = Math.abs(veiculo.eixo.autoridade - estado.eixo_autoridade);
  const dist = (dE + dA) / 2;                       // 0 (idêntico) .. ~100 (oposto)
  return Math.round(100 - dist * 2);                // +100 .. -100
}

// Tom final: ideologia + simpatia comprada + seu desempenho.
// Calibrado pra um CENTRISTA começar NEUTRO com todo mundo — ninguém ama quem não
// se posiciona. Você tem que escolher um lado (ou comprar a redação).
export function tomDaCobertura(veiculo, estado) {
  const ideo = alinhamento(veiculo, estado) * 0.35;
  const compra = ((veiculo.simpatia ?? 50) - 50) * 1.1;
  const desempenho = ((estado.aprovacao - 50) * 0.25) + ((estado.soft_power - 50) * 0.15) - ((estado.temp_guerra - 40) * 0.25);
  const v = Math.max(-100, Math.min(100, Math.round(ideo + compra + desempenho)));
  if (v >= 55) return { valor: v, rot: 'Puxa seu saco', cor: '#22e0a0' };
  if (v >= 25) return { valor: v, rot: 'Favorável', cor: '#9ff0cf' };
  if (v > -25) return { valor: v, rot: 'Neutro', cor: '#7488ad' };
  if (v > -55) return { valor: v, rot: 'Crítico', cor: '#ffb020' };
  return { valor: v, rot: 'Hostil', cor: '#ff3b5c' };
}

// Investir em mídia: sobe a simpatia (e mais ainda se já for alinhada).
export function investirNaMidia(veiculo, estado, intensidade = 12) {
  const bonusIdeo = alinhamento(veiculo, estado) > 0 ? 1.4 : 0.7; // fácil comprar quem já gosta
  veiculo.simpatia = Math.max(0, Math.min(100, (veiculo.simpatia ?? 50) + Math.round(intensidade * bonusIdeo)));
  return veiculo.simpatia;
}

// Decaimento: a lealdade comprada evapora (todo turno volta ao natural).
export function decairSimpatia() {
  for (const v of VEICULOS) {
    if (v.simpatia == null) v.simpatia = 50;
    v.simpatia += v.simpatia > 50 ? -2 : v.simpatia < 50 ? 1 : 0;
  }
}
