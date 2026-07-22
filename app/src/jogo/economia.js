// ECONOMIA POR TURNO, em US$ TRILHÕES. Receita − Despesa = Saldo.
// PIB e Tesouro são trilhões de dólares (floats). Você enriquece ou quebra.
//
// O PETRÓLEO ENTRA AQUI e é a linha mais brutal do balanço: os EUA queimam 20 Mb/d
// e bombeiam 13,2. A diferença é comprada no mercado, a preço de mercado, todo turno.
// Quando você bombardeia um petroestado e o Brent salta, essa linha sangra mais —
// o seu próprio ataque te cobra a conta.
import { fluxoPetroleo } from '../dados/petroleo.js';
import { custoBases } from '../dados/bases.js';
import { taxaJuros } from './fiscal.js';
import { rendaAlianca } from './aliancas.js';

// ── CADÊNCIA MENSAL ───────────────────────────────────────────────────
// Cada batida do mundo é UM MÊS (não um ano). `pib`, `aliquota`, `poder_militar`,
// `divida` e a taxa de juros continuam sendo grandezas ANUAIS — só a FATIA creditada
// por batida é 1/12 delas. Assim o calendário anda mês a mês sem inflar/drenar 12× rápido.
const MES = 12;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Fator de confiança do mercado (temp_economia): 0.35× em pânico, 1.5× em confiança plena.
function fatorConfianca(estado) { return clamp(0.35 + (estado.temp_economia ?? 50) / 100 * 1.15, 0.35, 1.5); }
// Parcerias: cada relação forte (rel_* ≥ 60) vale +2% de renda, até +30%.
function fatorParcerias(estado) {
  const fortes = Object.keys(estado).filter((k) => k.startsWith('rel_') && estado[k] >= 60).length;
  return Math.min(0.3, fortes * 0.02);
}
// A RENDA DE SOBERANIA: o valor "substancial" que mantém o jogador líquido — comércio,
// investimento, crescimento que a arrecadação pura não capta. 0,4% do PIB/mês, escalado
// por confiança e parcerias. Cresce quando o país melhora (PIB↑, confiança↑, aliados↑).
export function dividendoSoberania(estado) {
  const base = estado.pib * 0.004;
  return round2(base * fatorConfianca(estado) * (1 + fatorParcerias(estado)));
}

// CUSTO DAS SANÇÕES SOFRIDAS: cada país que te sancionou aperta a sua economia — comércio
// perdido, capital que foge, custo de contornar o bloqueio. Dreno mensal proporcional à soma
// das intensidades e ao PIB, com teto. `estado.sancoesSofridas` é preenchido quando um
// jogador (ou NPC) te sanciona no online; sem sanções, custa 0 (a linha nem aparece).
export function custoSancoes(estado) {
  const lista = Array.isArray(estado.sancoesSofridas) ? estado.sancoesSofridas : [];
  if (!lista.length) return 0;
  const intensidade = Math.min(300, lista.reduce((s, x) => s + (Number(x?.intensidade) || 20), 0));
  return round2(Math.min(estado.pib * 0.02, intensidade * 0.0004 * (estado.pib || 1)));
}

// Calcula o fluxo do MÊS SEM aplicar (para a HUD mostrar a projeção).
export function calcularFluxo(estado) {
  const receita = round2(estado.pib * (estado.aliquota / 100) / MES);      // arrecadação/mês
  const gastoSocial = round2(estado.pib * 0.12 / MES);                      // saúde, educação, previdência
  const manutencaoMilitar = round2(estado.poder_militar * 0.02 / MES);     // manter as forças
  // O JURO NÃO É FIXO — o mercado cobra pelo medo (ver taxaJuros). Taxa ANUAL / 12 = mês.
  const taxa = taxaJuros(estado);
  const juros = round2((estado.divida / 100) * estado.pib * taxa / MES);   // serviço da dívida/mês
  const bases = round2(custoBases(estado) / MES);                          // presença global custa caro
  const sancoes = custoSancoes(estado);                                    // prejuízo das sanções sofridas

  // Petróleo: já é por período (DIAS_TURNO=30 = um mês). Positivo se exporta, negativo se importa.
  const oleo = fluxoPetroleo(estado);
  const petroleo = oleo.liquido;

  const dividendo = dividendoSoberania(estado);   // a renda de soberania (mantém o jogador líquido)
  const bloco = rendaAlianca(estado);             // comércio interno de uma união econômica (aliancas.js)

  const despesa = round2(gastoSocial + manutencaoMilitar + juros + bases + sancoes);
  const saldo = round2(receita - despesa + petroleo + dividendo + bloco);
  return { receita, despesa, saldo, juros, taxa, manutencaoMilitar, gastoSocial, bases, sancoes, petroleo, dividendo, bloco, oleo };
}

// TENDÊNCIA FISCAL: lê o histórico de saldos (anel de ~12 meses) e diz se o país está
// poupando, no vermelho e há quanto tempo. É o que o painel usa pra o selo "POUPANDO/NO
// VERMELHO". Sem histórico ainda, deduz do saldo do mês.
export function tendenciaFiscal(estado) {
  const h = Array.isArray(estado._histSaldo) ? estado._histSaldo : [];
  if (h.length < 2) {
    const s = calcularFluxo(estado).saldo;
    return { dir: s > 0.02 ? 'sobe' : s < -0.02 ? 'desce' : 'estavel', mesesNoVermelho: s < 0 ? 1 : 0, media: s,
      rot: s > 0.02 ? 'POUPANDO' : s < -0.02 ? 'NO VERMELHO' : 'EQUILIBRADO' };
  }
  const media = round2(h.reduce((s, x) => s + x, 0) / h.length);
  const inclin = h[h.length - 1] - h[0];
  let mesesNoVermelho = 0;
  for (let i = h.length - 1; i >= 0 && h[i] < 0; i -= 1) mesesNoVermelho += 1;
  const dir = inclin > 0.02 ? 'sobe' : inclin < -0.02 ? 'desce' : 'estavel';
  const rot = mesesNoVermelho >= 2 ? `NO VERMELHO há ${mesesNoVermelho} meses`
    : media > 0.02 ? 'POUPANDO' : media < -0.02 ? 'NO VERMELHO' : 'EQUILIBRADO';
  return { dir, mesesNoVermelho, media, rot };
}

// Aplica o fluxo ao estado no fechamento do turno. Retorna um resumo pra UI.
export function aplicarFluxo(estado) {
  const fluxo = calcularFluxo(estado);
  estado.tesouro = round2(estado.tesouro + fluxo.saldo);

  // HISTÓRICO p/ a TENDÊNCIA: anel dos últimos 12 saldos mensais (barato, JSON puro).
  estado._histSaldo = [...(Array.isArray(estado._histSaldo) ? estado._histSaldo : []), fluxo.saldo].slice(-12);

  // Caixa negativo vira dívida — é o que TODO país faz: emite título e cobre o
  // rombo. Ninguém "fica sem dinheiro" e deixa de existir; fica devendo. O caixa
  // no zero não é o fim da linha, é o começo da conta.
  let virouDivida = 0;
  if (estado.tesouro < 0) {
    virouDivida = round2(-estado.tesouro / estado.pib * 100 * 0.6);
    estado.divida = Math.min(300, round2(estado.divida + virouDivida));
    estado.tesouro = 0;
  }

  // ── A ESPIRAL ───────────────────────────────────────────────────────
  // Aqui a dívida cobra o preço dela: corroendo a CONFIANÇA, não decretando
  // game over. Confiança baixa encarece o juro (ver taxaJuros), o juro maior
  // aumenta o rombo, o rombo aumenta a dívida — e a espiral se fecha. Dá pra
  // sair dela (cortando, taxando, crescendo), e é por isso que ela é jogo e
  // não sentença.
  let corrosao = 0;
  if (estado.divida > 90) {
    corrosao = Math.min(6, (estado.divida - 90) / 22);
    estado.temp_economia = Math.max(0, round2(estado.temp_economia - corrosao));
  } else if (estado.divida < 45 && estado.temp_economia < 70) {
    // contas em ordem devolvem confiança devagar — a recompensa por arrumar a casa
    estado.temp_economia = Math.min(100, round2(estado.temp_economia + 0.8));
  }

  // Deriva natural do PIB por MÊS: confiança e guerra puxam o crescimento. Valores /4 do
  // que eram por "ano" — um mês não move o PIB tão rápido (evita explosão de renda).
  let driftPib = 0;
  if (estado.temp_economia >= 60) driftPib += 0.075;
  if (estado.temp_economia <= 35) driftPib -= 0.075;
  if (estado.temp_guerra >= 70) driftPib -= 0.15;
  estado.pib = round2(Math.max(0, Math.min(200, estado.pib + driftPib)));

  return { ...fluxo, virouDivida, driftPib, corrosao };
}

function round2(n) { return Math.round(n * 100) / 100; }
