// ═══════════════════════════════════════════════════════════════════════
// FISCAL — a dívida como PRESSÃO, não como muro
// ═══════════════════════════════════════════════════════════════════════
// O que este arquivo conserta: o jogo matava você quando a dívida passava de
// 200% do PIB. Isso não acontece no mundo real, e o contra-exemplo é gritante —
// o JAPÃO convive com ~250% há anos e ninguém decretou o fim do Japão. A Grécia
// bateu 180%, apanhou muito e continuou existindo. Já o Líbano quebrou com ~150%.
//
// A diferença entre os três não é o NÚMERO da dívida. É a CONFIANÇA. Dívida alta
// com mercado calmo é o Japão: juro perto de zero, rola pra sempre. Dívida média
// com mercado apavorado é a Argentina: juro de 15% que devora o orçamento e vira
// espiral. Então aqui a dívida não te mata — ela te ESTRANGULA, e quem te mata é
// o colapso político que vem depois (aprovação a zero = golpe).
//
// Nenhum país "fica sem dinheiro" e some. Ele se endivida, corta, imprime, toma
// resgate ou dá calote. Cada uma dessas saídas tem um preço diferente — e é isso
// que vira decisão sua, em vez de uma barra que esvazia e encerra a partida.
import { aplicarEfeitos } from './efeitos.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (n) => Math.round(n * 100) / 100;

// ── O JURO QUE O MERCADO COBRA DE VOCÊ ────────────────────────────────
// A CREDIBILIDADE é a variável mestra, e a dívida só morde através dela.
//
// Uma primeira versão disto somava "prêmio da dívida" e "prêmio do medo" em
// paralelo — e produzia o absurdo de o Japão (250% de dívida, mercado calmo)
// pagar MAIS que a Argentina (90%, mercado em pânico). Exatamente o oposto do
// mundo real, e do que este arquivo dizia fazer.
//
// O conserto: a dívida não é cara por ser grande, é cara por ser DUVIDOSA. Quem
// tem credibilidade rola qualquer montanha barato (Tóquio); quem não tem paga
// caro por qualquer morro (Buenos Aires). Por isso o prêmio da dívida é
// multiplicado por (1 − credibilidade)² — com confiança alta ele quase some.
export function taxaJuros(estado) {
  const base = 0.015;
  const cred = clamp((estado.temp_economia ?? 50) / 100, 0, 1);
  const desconfianca = (1 - cred) ** 2;                       // curva, não reta
  const excesso = Math.max(0, ((estado.divida || 0) - 50) / 100);
  const premioDivida = excesso * 0.14 * desconfianca;
  const premioMedo = desconfianca * 0.10;
  return clamp(base + premioDivida + premioMedo, 0.004, 0.25);
}

// Rótulo do juro pra UI — o jogador precisa VER por que está pagando caro.
export function lerJuros(estado) {
  const t = taxaJuros(estado);
  if (t <= 0.03) return { taxa: t, rot: 'BARATO', txt: 'O mercado confia. Você rola a dívida pagando quase nada — o luxo de quem tem credibilidade.' };
  if (t <= 0.06) return { taxa: t, rot: 'NORMAL', txt: 'Juro de país sério. A dívida custa, mas não sufoca.' };
  if (t <= 0.11) return { taxa: t, rot: 'CARO', txt: 'O mercado está desconfiado e cobra por isso. Cada turno, os juros comem mais do orçamento.' };
  return { taxa: t, rot: 'ASFIXIA', txt: 'O mercado te trata como caloteiro. O juro devora a receita e a dívida cresce sozinha — é assim que começa a espiral.' };
}

// ── CLASSIFICAÇÃO FISCAL (o "rating" do país) ─────────────────────────
export function estadoFiscal(estado) {
  const d = estado.divida || 0;
  const conf = estado.temp_economia ?? 50;
  // O mesmo número de dívida significa coisas opostas dependendo da confiança.
  const risco = d * (1.4 - conf / 100);
  if (risco < 60) return { nivel: 'solido', rot: 'SÓLIDO', cls: 'bom', txt: 'Contas sob controle. Você pode gastar sem olhar por cima do ombro.' };
  if (risco < 110) return { nivel: 'atencao', rot: 'ATENÇÃO', cls: 'amb', txt: 'A dívida cresce mais rápido que a economia. Ainda dá pra virar — mas não ignorando.' };
  if (risco < 170) return { nivel: 'pressao', rot: 'SOB PRESSÃO', cls: 'amb', txt: 'Agências rebaixaram sua nota. O juro subiu e o dinheiro está fugindo.' };
  if (risco < 240) return { nivel: 'critico', rot: 'CRÍTICO', cls: 'ruim', txt: 'Você está à beira do calote. Os credores já falam do seu país no passado.' };
  return { nivel: 'colapso', rot: 'COLAPSO FISCAL', cls: 'ruim', txt: 'Ninguém te empresta mais nada. A conta chegou e não há de onde tirar.' };
}

// A crise fiscal exige decisão? Só quando aperta de verdade — e não toda hora,
// senão vira burocracia em vez de drama.
export function precisaDecidir(estado) {
  const f = estadoFiscal(estado);
  if (f.nivel !== 'critico' && f.nivel !== 'colapso') return false;
  const ultimo = estado._ultimaCriseFiscal ?? -99;
  return (estado.turno || 0) - ultimo >= 3;   // no máximo a cada 3 turnos
}

// ── AS SAÍDAS ─────────────────────────────────────────────────────────
// Todo país endividado do mundo escolheu uma destas. Nenhuma é de graça.
export function opcoesDeCrise(estado) {
  const d = estado.divida || 0;
  const pib = estado.pib || 1;
  const opcoes = [
    {
      id: 'austeridade',
      titulo: 'Austeridade',
      texto: 'Cortar saúde, educação e obra pública até a conta fechar. O mercado aplaude, a rua queima.',
      custoReal: 'A Grécia fez. Funcionou nas planilhas e custou uma geração.',
      efeitos: { divida: -18, temp_economia: 10, aprovacao: -14, estabilidade: -9 },
    },
    {
      id: 'impostos',
      titulo: 'Aumentar impostos',
      texto: 'Mais imposto, mais receita. E mais gente decidindo que você é o inimigo.',
      custoReal: 'Arrecada de verdade — e o custo vem na urna, não na planilha.',
      efeitos: { aliquota: 6, divida: -10, aprovacao: -11, temp_economia: -4 },
    },
    {
      id: 'imprimir',
      titulo: 'Imprimir dinheiro',
      texto: 'A máquina resolve hoje e cobra amanhã, em inflação. O rombo some, o seu salário também.',
      custoReal: 'Foi o caminho da Argentina e da Venezuela. Sempre parece de graça no começo.',
      efeitos: { tesouro: round2(pib * 0.06), divida: -6, temp_economia: -20, aprovacao: -7 },
    },
  ];

  // Resgate só existe quando você já está de joelhos — e cobra soberania.
  if (d >= 120) {
    opcoes.push({
      id: 'fmi',
      titulo: 'Resgate internacional (FMI)',
      texto: 'Eles pagam a conta e passam a mandar no orçamento. Você troca autonomia por oxigênio.',
      custoReal: 'O dinheiro chega rápido. As condições ficam por uma década.',
      efeitos: { divida: -45, tesouro: round2(pib * 0.05), soft_power: -16, aprovacao: -13, liberdades: -4, temp_economia: 12 },
    });
  }
  // Calote: a saída do desesperado. Limpa a dívida e queima seu nome por anos.
  if (d >= 100) {
    opcoes.push({
      id: 'calote',
      titulo: 'Dar o calote',
      texto: 'Declarar que não vai pagar. A dívida evapora e, com ela, a sua reputação no mercado.',
      custoReal: 'A Argentina fez nove vezes. Sobreviveu — sem crédito, por décadas.',
      efeitos: { divida: -70, temp_economia: -32, soft_power: -24, estabilidade: -8, aprovacao: 4 },
    });
  }
  return opcoes;
}

export function aplicarOpcaoFiscal(estado, id) {
  const op = opcoesDeCrise(estado).find((o) => o.id === id);
  if (!op) return { falha: 'Opção inválida.' };
  const mudancas = aplicarEfeitos(estado, op.efeitos);
  estado._ultimaCriseFiscal = estado.turno || 0;
  return { op, mudancas, manchete: mancheteFiscal(estado, op) };
}

function mancheteFiscal(estado, op) {
  const M = {
    austeridade: 'O governo anuncia o maior corte de gastos da história recente. Hospitais e escolas entram na conta — e a rua já respondeu.',
    impostos: 'Nova carga tributária aprovada. O caixa respira; o contribuinte, não. As redes já batizaram o pacote de confisco.',
    imprimir: 'O banco central liga a máquina. Economistas usam a palavra que ninguém queria ouvir: hiperinflação.',
    fmi: 'Acordo fechado com o FMI. O dinheiro entra amanhã; as condições ficam por dez anos. A oposição chama de rendição.',
    calote: 'O país declara moratória. Não vamos pagar. O mercado internacional fechou a porta — e jogou a chave fora.',
  };
  return M[op.id] || 'O governo mexeu nas contas públicas.';
}
