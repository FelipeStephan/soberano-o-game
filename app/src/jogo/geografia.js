// ═══════════════════════════════════════════════════════════════════════
// GEOGRAFIA ESTRATÉGICA — o poder que vem do mapa, não do exército
// ═══════════════════════════════════════════════════════════════════════
// O pedido foi exato: "cada país pode ter um recurso diferente devido geolocalização,
// como por exemplo o Irã taxar o Estreito de Ormuz — então se alguém dominar, vai ter
// esse direito."
//
// Isso muda o cálculo de conquista de forma profunda. Invadir Omã não é sobre Omã:
// é sobre sentar na saída de Ormuz, por onde passa um quinto do petróleo do planeta.
// O Egito não tem petróleo relevante — tem o Canal de Suez, e isso vale mais.
//
// TRÊS DIREITOS QUE A GEOGRAFIA CONCEDE:
//   TAXAR   → pedágio sobre o fluxo. Dinheiro todo turno, e o mundo range os dentes.
//   BLOQUEAR→ fecha a passagem. Arma econômica brutal: o preço do petróleo explode
//             e quem depende do estreito te odeia para sempre.
//   ESCOLTAR→ garante passagem segura. Ganha soft power e gratidão de quem depende.
//
// Você exerce o direito se CONTROLA o país que domina o estreito — sendo ele, ou
// tendo tomado ele à força.
import { ESTREITOS } from '../dados/petroleo.js';
import { PAISES } from '../dados/paises.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (n) => Math.round(n * 100) / 100;

// Você controla um país? (é você, ou você o ocupa)
export function controla(estado, isoCode) {
  if (isoCode === (estado.iso || 'USA')) return true;
  return (estado.conquistados || []).some((c) => c.iso === isoCode);
}

// Quais estreitos estão sob o seu controle agora, e por quê.
export function estreitosControlados(estado) {
  const out = [];
  for (const [id, e] of Object.entries(ESTREITOS)) {
    const via = e.controle.find((iso) => controla(estado, iso));
    if (!via) continue;
    out.push({
      id, ...e, via,
      viaNome: PAISES[via]?.nome || via,
      porConquista: via !== (estado.iso || 'USA'),
      regime: estado.estreitos_regime?.[id] || 'livre',
    });
  }
  return out;
}

// ── O PEDÁGIO ─────────────────────────────────────────────────────────
// Fluxo (Mb/d) × preço × taxa × 91 dias × fator de jogo (o mesmo 6 do resto do
// sistema de petróleo, pra a escala conversar com o balanço).
const TAXA = 0.04;          // 4% do valor do que passa — alto, mas é o que um
                            // Estado que controla um gargalo cobraria de fato
const DIAS = 91;
const FATOR_JOGO = 6;

export function receitaPedagio(estado) {
  const preco = estado.preco_petroleo || 78;
  let total = 0;
  const linhas = [];
  for (const e of estreitosControlados(estado)) {
    if (e.regime !== 'taxado') continue;
    const v = round2((e.fluxo * preco * TAXA * DIAS * FATOR_JOGO) / 1e6);
    total += v;
    linhas.push({ id: e.id, nome: e.nome, valor: v, fluxo: e.fluxo });
  }
  return { total: round2(total), linhas };
}

// ── OS DIREITOS ───────────────────────────────────────────────────────
export const REGIMES = {
  livre: {
    id: 'livre', rot: 'Passagem livre', ic: 'ship', cor: '#7488ad',
    desc: 'Ninguém paga, ninguém reclama. O comércio flui e você não ganha nada com isso.',
    efeitos: {},
  },
  taxado: {
    id: 'taxado', rot: 'Pedágio', ic: 'circle-dollar-sign', cor: '#ffb020',
    desc: 'Cobra 4% do valor de tudo que passa. Receita permanente, e cada navio que paga volta pra casa com raiva do seu país.',
    efeitos: { soft_power: -6 },
  },
  escoltado: {
    id: 'escoltado', rot: 'Escolta naval', ic: 'shield', cor: '#22e0a0',
    desc: 'Garante passagem segura com a sua marinha. Custa caro e compra gratidão — quem depende do estreito passa a te dever.',
    efeitos: { soft_power: 8, poder_militar: -3 },
    custo: 0.06,
  },
  bloqueado: {
    id: 'bloqueado', rot: 'Bloqueio', ic: 'ban', cor: '#ff3b5c',
    desc: 'Fecha a passagem. O preço do petróleo explode no mundo inteiro e quem depende disto vira seu inimigo mortal — inclusive quem era amigo.',
    efeitos: { soft_power: -25, temp_guerra: 30, seguranca: -10 },
  },
};

// Muda o regime de um estreito. Retorna o que aconteceu, pro feed.
export function definirRegime(estado, estreitoId, regimeId) {
  const e = ESTREITOS[estreitoId];
  const r = REGIMES[regimeId];
  if (!e || !r) return { falha: 'Estreito ou regime inválido.' };
  const meu = estreitosControlados(estado).find((x) => x.id === estreitoId);
  if (!meu) return { falha: `Você não controla ${e.nome}.` };
  if (r.custo && estado.tesouro < r.custo) return { falha: `Sem caixa: a escolta custa ${r.custo} tri.` };

  estado.estreitos_regime = estado.estreitos_regime || {};
  const antes = estado.estreitos_regime[estreitoId] || 'livre';
  estado.estreitos_regime[estreitoId] = regimeId;
  if (r.custo) estado.tesouro = round2(estado.tesouro - r.custo);

  // O bloqueio é a jogada mais violenta do jogo sem disparar um tiro.
  estado.estreitos_bloqueados = Object.entries(estado.estreitos_regime)
    .filter(([, v]) => v === 'bloqueado').map(([k]) => k);

  // Quem depende do estreito reage — e reage forte.
  const reacoes = [];
  if (regimeId === 'bloqueado' || regimeId === 'taxado') {
    const peso = regimeId === 'bloqueado' ? -30 : -8;
    for (const iso of e.depende) {
      const k = PAISES[iso]?.rel;
      if (!k || !(k in estado)) continue;
      const antesRel = estado[k];
      estado[k] = clamp(antesRel + peso, -100, 100);
      reacoes.push({ iso, nome: PAISES[iso]?.nome || iso, delta: estado[k] - antesRel });
    }
  } else if (regimeId === 'escoltado') {
    for (const iso of e.depende) {
      const k = PAISES[iso]?.rel;
      if (!k || !(k in estado)) continue;
      const antesRel = estado[k];
      estado[k] = clamp(antesRel + 7, -100, 100);
      reacoes.push({ iso, nome: PAISES[iso]?.nome || iso, delta: estado[k] - antesRel });
    }
  }

  return { estreito: e, regime: r, antes, reacoes, texto: mensagem(e, r, reacoes) };
}

function mensagem(e, r, reacoes) {
  const afetados = reacoes.map((x) => x.nome).join(', ');
  if (r.id === 'bloqueado') {
    return `${e.nome} FECHADO. ${e.fluxo} Mb/d saíram do mercado mundial de uma vez. `
      + `O Brent está em pânico e ${afetados || 'meio planeta'} acabou de descobrir o que significa depender de um estreito que não é seu.`;
  }
  if (r.id === 'taxado') {
    return `Pedágio instituído em ${e.nome}: 4% sobre tudo que passa. `
      + `${afetados || 'Os usuários'} vão pagar e vão lembrar. É dinheiro certo e amizade cara.`;
  }
  if (r.id === 'escoltado') {
    return `Nossa marinha assumiu a escolta em ${e.nome}. ${afetados || 'Quem depende da passagem'} agora navega sob a nossa proteção — e nos deve por isso.`;
  }
  return `${e.nome} devolvido à passagem livre. O comércio respira.`;
}

// ── PRO FEED, TODO TURNO ──────────────────────────────────────────────
export function tickGeografia(estado) {
  const eventos = [];
  const ped = receitaPedagio(estado);
  if (ped.total > 0) {
    estado.tesouro = round2(estado.tesouro + ped.total);
    eventos.push({
      tom: 'bom',
      texto: `Pedágio arrecadado: ${ped.total.toFixed(3)} tri em ${ped.linhas.map((l) => l.nome).join(', ')}. `
        + `Cobrar de quem não tem alternativa é o negócio mais estável do planeta.`,
    });
  }
  // Escolta custa manutenção
  for (const e of estreitosControlados(estado)) {
    if (e.regime !== 'escoltado') continue;
    estado.tesouro = round2(estado.tesouro - (REGIMES.escoltado.custo || 0));
  }
  // Bloqueio prolongado apodrece
  for (const e of estreitosControlados(estado)) {
    if (e.regime !== 'bloqueado') continue;
    eventos.push({
      tom: 'ruim',
      texto: `${e.nome} segue fechado. Cada dia de bloqueio soma um país à lista de quem quer a sua cabeça.`,
    });
  }
  return eventos;
}
