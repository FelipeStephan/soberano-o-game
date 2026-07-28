// Aplica efeitos ao Estado do Mundo, respeitando os limites de cada variável (vars.js).
import { VARS, QUALITATIVOS, limitesDe } from './vars.js';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Retorna um registro das mudanças, para a UI mostrar "+8 aprovação" etc.
export function aplicarEfeitos(estado, efeitos) {
  const mudancas = [];
  for (const [chave, valor] of Object.entries(efeitos || {})) {
    // ── #6.4 · PARTIDA SEM NUCLEARES: O CHOKE POINT ────────────────────
    // Toda ogiva que entra no jogo entra por aqui — a ação do catálogo, uma carta da
    // Máquina, um evento futuro que ninguém escreveu ainda. Bloquear a chave NESTE
    // ponto é o que garante que "sem nucleares" signifique sem nucleares, em vez de
    // uma lista de gates espalhados que alguém vai esquecer de atualizar amanhã.
    // Deltas NEGATIVOS passam: gastar/perder ogiva num mundo sem elas é inofensivo.
    if (chave === 'ogivas' && estado?.semNucleares && Number(valor) > 0) continue;
    if (QUALITATIVOS[chave]) {
      estado[chave] = valor;
      mudancas.push({ chave, delta: 0, valor });
      continue;
    }
    if (VARS[chave] || chave.startsWith('rel_')) {
      const { min, max } = limitesDe(chave);
      const antes = estado[chave] ?? 0;
      estado[chave] = clamp(antes + Number(valor), min, max);
      mudancas.push({ chave, delta: estado[chave] - antes });
    }
  }
  return mudancas;
}

// Derrotas "duras" (as suaves ficam em destino.js via a barra de Destino).
//
// O QUE SAIU DAQUI E POR QUÊ: existia um `if (estado.divida >= 200) → derrota
// 'Falência'`. Era irreal e frustrante — o caixa zerava, o rombo virava dívida
// sozinho, a dívida cruzava 200% e a partida acabava sem o jogador ter feito
// nada de catastrófico. Mas nenhum país deixa de existir por dever demais: o
// Japão vive com ~250% do PIB, a Grécia bateu 180% e sobreviveu. Quem quebra é
// quem perde a confiança e depois o governo.
//
// Agora a dívida ESTRANGULA em vez de matar (ver fiscal.js e a espiral em
// economia.js): encarece o juro, corrói a confiança, derruba o PIB e a aprovação
// — e é a APROVAÇÃO no chão que te depõe. A morte passou a ser política, que é
// como acontece de verdade. Dívida é o caminho, não a sentença.
// ── A VIGÍLIA — a caixa-preta que faltava para explicar a queda ────────
// O DEFEITO QUE ISTO CONSERTA: o jogo depunha o jogador com "Sua aprovação chegou
// a zero" e ponto final. Uma frase que descreve o placar e esconde a partida — o
// jogador nunca soube se aquilo desabou de uma vez ou se vinha apodrecendo há um
// ano na cara dele. E não havia como saber: o estado guarda o AGORA, nunca guardou
// o percurso.
//
// Então passamos a guardar o mínimo indispensável: há quantos meses cada indicador
// letal está no vermelho, e quanto ele andou no último mês. É barato (números
// soltos, entram no autosave junto com o resto) e é a diferença entre "você perdeu"
// e "você perdeu, começou no mês 41, e olha o que dava pra ter feito".
const ZONAS = {
  aprovacao:    { rot: 'Aprovação',      limite: 20,  pior: 'menor', socorro: 'gasto social, vitória diplomática ou qualquer coisa que a imprensa amiga pudesse vender' },
  estabilidade: { rot: 'Estabilidade',   limite: 25,  pior: 'menor', socorro: 'concessão às instituições, recuo numa medida impopular ou repressão assumida — mas alguma coisa' },
  tesouro:      { rot: 'Caixa',          limite: 0.5, pior: 'menor', socorro: 'corte de gasto, venda de ativo ou emissão antes de o cofre raspar o fundo' },
  divida:       { rot: 'Dívida',         limite: 130, pior: 'maior', socorro: 'ajuste fiscal enquanto ainda havia crédito barato' },
  temp_guerra:  { rot: 'Clima de guerra', limite: 70, pior: 'maior', socorro: 'um cessar-fogo, um tratado, qualquer desescalada' },
  soft_power:   { rot: 'Soft power',     limite: 25,  pior: 'menor', socorro: 'diplomacia e cultura — o telefone que você deixou tocar' },
};

// Roda uma vez por turno (é chamada de dentro de checarFim, que o motor invoca em
// ambos os modos). O `_marca` evita contar duas vezes se alguém chamar de novo no
// mesmo turno — streak inflada mentiria no relatório, e o relatório é o produto.
function vigiar(estado) {
  const v = estado._vigilia || (estado._vigilia = {});
  const marca = Number.isFinite(estado.turno) ? estado.turno : (v._n || 0) + 1;
  const repetido = v._marca === marca;
  v._marca = marca; v._n = (v._n || 0) + 1;
  for (const [ch, z] of Object.entries(ZONAS)) {
    const atual = Number(estado[ch]) || 0;
    const anterior = v[`${ch}_ant`];
    const noVermelho = z.pior === 'menor' ? atual <= z.limite : atual >= z.limite;
    if (!repetido) v[ch] = noVermelho ? (v[ch] || 0) + 1 : 0;
    if (!repetido) v[`${ch}_delta`] = Number.isFinite(anterior) ? Math.round((atual - anterior) * 10) / 10 : 0;
    v[`${ch}_ant`] = atual;
  }
  return v;
}

// Lê a vigília para quem vai narrar: quem está no vermelho, há quanto tempo, e
// caindo quão rápido. Ordenado pelo que está apodrecendo há mais tempo.
export function resumoVigilia(estado) {
  const v = estado?._vigilia || {};
  return Object.entries(ZONAS)
    .map(([ch, z]) => ({
      chave: ch, rot: z.rot, socorro: z.socorro,
      meses: v[ch] || 0,
      valor: Number(estado?.[ch]) || 0,
      delta: v[`${ch}_delta`] || 0,
    }))
    .filter((x) => x.meses > 0)
    .sort((a, b) => b.meses - a.meses);
}

// Frase honesta sobre o tempo: se a vigília não pegou o histórico (save antigo,
// partida importada), dizemos que é leitura do momento em vez de inventar um mês.
function desdeQuando(meses) {
  if (!meses) return 'Não há registro de por quanto tempo isso vinha se arrastando — esta é a leitura do momento da queda';
  if (meses === 1) return 'Cruzou a linha vermelha no mês passado e ninguém puxou o freio';
  if (meses <= 3) return `Estava no vermelho há ${meses} meses`;
  if (meses <= 11) return `Estava no vermelho há ${meses} meses — quase um ano de aviso ignorado`;
  const anos = Math.floor(meses / 12);
  return `Estava no vermelho há ${meses} meses — ${anos} ano${anos > 1 ? 's' : ''} de aviso ignorado`;
}

export function checarFim(estado) {
  const v = vigiar(estado);
  const acompanhantes = resumoVigilia(estado).filter((x) => x.chave !== 'aprovacao' && x.chave !== 'estabilidade');
  // O que mais estava apodrecendo JUNTO — é quase sempre isto que derrubou o
  // indicador letal, e é o que o jogador precisa ver para não repetir.
  const junto = acompanhantes[0];
  const arrasto = junto
    ? ` E não foi sozinho: ${junto.rot.toLowerCase()} em ${junto.chave === 'tesouro' ? `US$ ${junto.valor.toFixed(2)} tri` : Math.round(junto.valor)} há ${junto.meses} ${junto.meses === 1 ? 'mês' : 'meses'} — ${junto.socorro} teria comprado o tempo que faltou.`
    : '';

  if (estado.aprovacao <= 0) {
    const meses = v.aprovacao || 0;
    return {
      tipo: 'derrota', causa: 'aprovacao', titulo: 'Deposto',
      motivo: 'aprovação zerada', indicador: 'Aprovação', meses,
      queda: v.aprovacao_delta || 0,
      evitaria: ZONAS.aprovacao.socorro,
      texto: `Aprovação em zero — e um governante sem povo é um homem sozinho numa sala grande. ${desdeQuando(meses)}, e o gabinete leu o mesmo número que você.${arrasto} O golpe foi silencioso porque ninguém achou que valia a pena fazer barulho por você.`,
    };
  }
  if (estado.estabilidade <= 0) {
    const meses = v.estabilidade || 0;
    return {
      tipo: 'derrota', causa: 'estabilidade', titulo: 'O país se partiu',
      motivo: 'estabilidade zerada', indicador: 'Estabilidade', meses,
      queda: v.estabilidade_delta || 0,
      evitaria: ZONAS.estabilidade.socorro,
      texto: `Estabilidade em zero: as instituições pararam de segurar a nação e cada região passou a responder a si mesma. ${desdeQuando(meses)} — o país foi rachando por dentro enquanto o noticiário falava de outra coisa.${arrasto} Não foi um dia ruim; foi a conta de todos eles.`,
    };
  }
  return null;
}
