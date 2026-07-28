// ═══════════════════════════════════════════════════════════════════════
// OS TRÊS ATOS — o mundo muda de comportamento ao longo da década
// ═══════════════════════════════════════════════════════════════════════
// Fase 2 de ENREDO-E-CAMPANHA.md, metade 1. O problema que isto resolve: uma hora de
// partida com o mundo se comportando exatamente igual do minuto 1 ao 60 não tem
// clímax — tem duração. O jogador aprende o ritmo nos primeiros dez minutos e depois
// executa o mesmo loop cinquenta vezes.
//
// ── O QUE MUDA EM CADA ATO (e por quê) ────────────────────────────────
//
// ATO I · anos 1–3 (18 min) — O MUNDO FRIO.
//   Guerra entre NPCs quase não nasce. É o tempo de escolher aliados, montar economia
//   e errar sem morrer. Um jogo que te mata no minuto 5 por não conhecer as telas não
//   é difícil, é hostil.
//
// ATO II · anos 4–7 (24 min) — O MUNDO ENDURECE.
//   Os NPCs ficam ambiciosos e as guerras nascem no ritmo normal. É onde as alianças
//   feitas no Ato I são testadas, e onde a maioria das quedas acontece.
//
// ATO III · anos 8–10 (18 min) — A CORRIDA.
//   Guerra nasce MAIS que no Ato II, e duas regras institucionais mudam: o Índice
//   Mundial vira público e permanente (todo mundo vê quem está ganhando — e vira
//   contra o líder) e o cooldown do Conselho de Segurança cai pela metade, para dar
//   tempo de sabotar o líder por via institucional antes do apito final.
//
// ── POR QUE ISTO É UM MÓDULO PURO DE 3 CONSTANTES ─────────────────────
// A tentação era espalhar `if (turno > 84)` pelos arquivos que precisam saber. Seria o
// caminho mais curto para o Ato III existir em `mundoVivo.js` e não existir em
// `onu.js` — e ninguém perceber por um mês. Aqui a régua é uma só, e quem precisa
// pergunta. Nenhum estado é guardado: o ato é função do turno, e o turno já viaja
// pelo save e pela rede.
import { BATIDAS_POR_ANO } from './feitos.js';

export const ATOS = [
  {
    n: 1, nome: 'O MUNDO FRIO', ateAno: 3, ic: 'snowflake', cor: 'var(--cyan)',
    lema: 'Ninguém está olhando para você ainda.',
    texto: 'As chancelarias trabalham, os generais esperam. É o tempo de escolher de que lado do tabuleiro você vai estar quando alguém finalmente atirar.',
    // Multiplicador sobre a chance de nascer guerra entre NPCs (ver mundoVivo).
    guerraNPC: 0.35,
    indicePublico: false,
    cooldownONU: 1,
  },
  {
    n: 2, nome: 'O MUNDO ENDURECE', ateAno: 7, ic: 'flame', cor: 'var(--ambar)',
    lema: 'Agora as promessas vão ser cobradas.',
    texto: 'As rivalidades que dormiam acordaram todas no mesmo ano. Os pactos assinados no começo da década começam a ser testados — e alguns não vão passar no teste.',
    guerraNPC: 1,
    indicePublico: false,
    cooldownONU: 1,
  },
  {
    n: 3, nome: 'A CORRIDA', ateAno: 99, ic: 'trophy', cor: 'var(--perigo)',
    lema: 'Todo mundo já sabe quem está ganhando.',
    texto: 'O placar é público. Quem lidera vira alvo de todos, e o Conselho de Segurança passa a poder ser convocado no dobro da frequência. Os últimos anos não são de construção: são de sabotagem.',
    guerraNPC: 1.45,
    indicePublico: true,
    // Cooldown do Conselho pela METADE. É a peça que dá aos perdedores uma arma
    // institucional contra o líder — sem ela, quem abriu vantagem no Ato II só precisa
    // não fazer nada por vinte minutos.
    cooldownONU: 0.5,
  },
];

export function anoDoTurno(turno) { return Math.floor((Math.max(1, turno | 0) - 1) / BATIDAS_POR_ANO) + 1; }

export function atoDoTurno(turno) {
  const ano = anoDoTurno(turno);
  return ATOS.find((a) => ano <= a.ateAno) || ATOS[ATOS.length - 1];
}

// Verdade só na PRIMEIRA batida de um ato novo — é o gatilho da cena de virada. Usa o
// turno e não um contador guardado no estado: no online a batida do host e a do
// convidado podem cair no mesmo mês, e contador paralelo dessincroniza.
export function viradaDeAto(turno) {
  const t = turno | 0;
  if (t <= 1) return null;
  const agora = atoDoTurno(t);
  const antes = atoDoTurno(t - 1);
  return agora.n !== antes.n ? agora : null;
}

// Os multiplicadores, com fallback seguro: se alguém chamar com turno inválido, o
// mundo se comporta como no Ato II (o ritmo "normal"), nunca congelado nem em pânico.
export function ritmoDeGuerra(turno) { return atoDoTurno(turno)?.guerraNPC ?? 1; }
export function indiceEhPublico(turno) { return !!atoDoTurno(turno)?.indicePublico; }
export function fatorCooldownONU(turno) { return atoDoTurno(turno)?.cooldownONU ?? 1; }
