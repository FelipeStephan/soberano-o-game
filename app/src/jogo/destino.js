// A BARRA DE DESTINO — a trajetória da nação, de "Em Colapso" a "Imperador do Mundo".
// É um índice composto (0–100) recalculado a cada turno. As bandas dão o tom do jogo
// e definem vitória/derrota no fim da era.

// Calcula o Destino a partir do estado.
export function calcularDestino(estado) {
  // vigor interno/externo (0–100)
  const vigor = media([
    estado.aprovacao, estado.estabilidade, estado.soft_power,
    estado.seguranca, estado.poder_militar,
  ]);

  // saúde econômica (0–100) — escala de trilhões: pib base ~28, tesouro ~3, dívida ~120%
  const econ = clamp(
    50 + estado.tesouro * 8 + (estado.pib - 28) * 2 - (estado.divida - 100) * 0.4,
    0, 100,
  );

  // Expansão territorial empurra o topo (rumo a Imperador), mas com TETO: conquistar
  // é significativo, não é botão de vitória. O território sozinho leva no máximo até a
  // faixa de Hegemon; passar disso exige uma nação forte em tudo (vigor + economia).
  const bonusTerritorio = Math.min(28, Math.max(0, estado.territorio - 1) * 4);

  // penalidades
  const penalidade = estado.temp_guerra * 0.1;

  const bruto = 0.5 * vigor + 0.3 * econ + bonusTerritorio - penalidade;

  // ── O TETO DO IMPÉRIO ────────────────────────────────────────────────
  // Virar "Imperador do Mundo" é o objetivo do jogo — e por isso NÃO pode cair no
  // colo de quem só tem economia boa. Sem IMPÉRIO de verdade (muito território, na
  // ordem de um continente) E muito dinheiro, o Destino trava na faixa de Hegemon (90).
  // Cada nível acima disso pede mais conquista: território 12 abre a porta; ~22 chega
  // ao topo. É assim que o jogo transparece "domine o mundo, não uma planilha".
  const territorio = estado.territorio || 1;
  const rico = (estado.tesouro || 0) >= 6;                       // caixa de superpotência
  let teto = 90;
  if (territorio >= 12 && rico) teto = 90 + Math.min(10, (territorio - 12) * 1.0);
  else if (territorio >= 12) teto = 93;                          // domina, mas quebrado: não fecha o império

  return Math.round(clamp(bruto, 0, teto));
}

// Bandas da linha do Destino.
export const BANDAS = [
  { min: 0,  max: 12,  nome: 'Em Colapso',        icone: '☠️', cor: '#ff5a6e' },
  { min: 13, max: 28,  nome: 'Nação à Beira',     icone: '🩹', cor: '#ff8c42' },
  { min: 29, max: 44,  nome: 'Potência Regional', icone: '🛡️', cor: '#ffcc4f' },
  { min: 45, max: 60,  nome: 'Grande Potência',   icone: '⚔️', cor: '#4fe0c8' },
  { min: 61, max: 75,  nome: 'Superpotência',     icone: '🌐', cor: '#4fd1ff' },
  { min: 76, max: 90,  nome: 'Hegemon Global',    icone: '🦅', cor: '#b98cff' },
  { min: 91, max: 100, nome: 'Imperador do Mundo', icone: '👑', cor: '#ffd447' },
];

export function bandaDe(destino) {
  return BANDAS.find((b) => destino >= b.min && destino <= b.max) || BANDAS[0];
}

// Verifica fim por Destino/era. Retorna null ou { tipo, titulo, texto }.
export function checarDestino(estado, destino, turno, eraTurnoMax) {
  if (destino >= 95) {
    return { tipo: 'vitoria', titulo: '👑 Imperador do Mundo', texto: 'A Máquina se cala. Nenhuma nação rivaliza com a sua. Você não apenas sobreviveu à história — você a dobrou à sua vontade.' };
  }
  if (destino <= 4) {
    return { tipo: 'derrota', titulo: '☠️ Colapso Total', texto: 'A nação implodiu sob seu comando. A Máquina embaralha as cartas e seu nome vira nota de rodapé.' };
  }
  if (turno >= eraTurnoMax) {
    const banda = bandaDe(destino);
    const venceu = destino >= 61; // Superpotência+ conta como reinado vitorioso
    return {
      tipo: venceu ? 'vitoria' : 'derrota',
      titulo: `Fim da Era — ${banda.icone} ${banda.nome}`,
      texto: venceu
        ? `O relógio da Máquina zerou e você terminou como ${banda.nome}. Um reinado que entra pra história.`
        : `O relógio da Máquina zerou. Você terminou apenas como ${banda.nome} — sobreviveu, mas não dominou. A história seguirá sem você.`,
    };
  }
  return null;
}

function media(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
