// ═══════════════════════════════════════════════════════════════════════
// DOUTRINAS E LEGADO — a espinha que faltava (Fase 1 de ENREDO-E-CAMPANHA.md)
// ═══════════════════════════════════════════════════════════════════════
// O DIAGNÓSTICO QUE ORIGINOU ISTO: "o jogo tem milhares de funcionalidades, mas sem
// rumo, sem história". O problema não era falta de conteúdo — era que o jogador não
// conseguia dizer, numa frase, o que estava tentando fazer. Sessenta ações
// igualmente válidas não são escolha, são planilha.
//
// ── A DECISÃO CENTRAL: A DOUTRINA NÃO TRAVA NADA ──────────────────────
// A tentação óbvia era fazer a Doutrina BLOQUEAR ações ("Conquistador não faz
// diplomacia"). Recusei: é o caminho mais curto para o jogador se sentir preso num
// jogo que ele escolheu justamente por ser aberto. A Doutrina muda como você é
// MEDIDO, não o que você pode fazer. Desviar custa eficiência (peso 1 em vez de 3),
// nunca legitimidade. É a diferença entre um rumo e uma coleira.
//
// ── POR QUE MÓDULO PURO, SEM DOM ──────────────────────────────────────
// Mesma regra de feitos.js: isto vive dentro de `estado.doutrina`, e `estado` é o
// que o save serializa (save.js) e o que viaja pela rede (statsVivos). Um único nó
// de DOM aqui quebraria o JSON.stringify da partida.
//
// ── A ARMADILHA DO ACÚMULO (e por que existe o `tally`) ───────────────
// `feitos.js` DESCARTA os registros crus a cada virada de ano (limparAno) — é o que
// impede o save de crescer para sempre numa década. Se o Legado fosse calculado
// lendo os registros, ele seria zerado todo 31 de dezembro. Por isso o ano fecha
// SOMANDO no `tally`, um acumulador de dez anos que cabe em ~20 números.
import { PAISES } from '../dados/paises.js';
import { placarDoAno, anoDoTurno } from './feitos.js';

// ── AS CINCO DOUTRINAS ────────────────────────────────────────────────
// Cada uma foi escolhida por consumir um SUBSISTEMA INTEIRO que hoje quase ninguém
// toca. O FAROL sozinho justifica todo o motor de pandemia e mediação; A SOMBRA dá
// propósito à espionagem, a mecânica mais órfã do jogo. Não são cinco sabores da
// mesma coisa — são cinco partes do jogo que estavam mortas por falta de motivo.
export const DOUTRINAS = {
  conquistador: {
    id: 'conquistador', nome: 'O CONQUISTADOR', ic: 'swords', cor: 'var(--perigo)',
    lema: 'O mapa é um rascunho.',
    promessa: 'O mundo vai lembrar do tamanho que você tinha, não do discurso que fez.',
    mede: 'Território sob a sua bandeira',
    usa: 'guerra · campanha por estados · anexação · bases militares',
    // Os tipos de feito que valem TRIPLO para quem segue esta doutrina.
    pesados: ['conquista', 'anexacao', 'ofensiva', 'invasao_repelida'],
    // A voz do país quando o mandato cobra (Fase 2 usa; já fica escrito aqui porque
    // é a mesma personalidade e separar em outro arquivo só espalharia o tom).
    voz: 'O Estado-Maior não aceita mais promessa.',
  },
  industrial: {
    id: 'industrial', nome: 'O INDUSTRIAL', ic: 'factory', cor: 'var(--ambar)',
    lema: 'Quem fabrica, manda.',
    promessa: 'Não precisa invadir quem depende de você para respirar.',
    mede: 'PIB, petróleo e o arsenal do mundo',
    usa: 'empresas · mercado · encomendas · ciência do petróleo',
    pesados: ['armas_vendidas', 'pib_delta'],
    voz: 'O conselho econômico quer números, não intenções.',
  },
  arquiteto: {
    id: 'arquiteto', nome: 'O ARQUITETO', ic: 'handshake', cor: 'var(--cyan)',
    lema: 'Sozinho ninguém atravessa uma década.',
    promessa: 'O bloco que você construir vai durar mais que o seu mandato.',
    mede: 'O bloco que você montou e manteve de pé',
    usa: 'alianças · Conselho de Segurança · socorro a aliado',
    pesados: ['alianca', 'sancao_aplicada'],
    voz: 'O Itamaraty avisa que promessa não assinada não conta.',
  },
  farol: {
    id: 'farol', nome: 'O FAROL', ic: 'heart-pulse', cor: 'var(--verde)',
    lema: 'Contar os vivos também é geopolítica.',
    promessa: 'O mundo vai lembrar do que você curou, não do que conquistou.',
    mede: 'Vidas salvas e guerras encerradas',
    usa: 'cura de pandemia · mediação · ajuda humanitária · paz global',
    pesados: ['cura_final', 'cura_invest', 'paz_final', 'mediacao', 'ajuda', 'libertacao'],
    voz: 'A opinião pública cobra o que foi prometido no primeiro dia.',
  },
  sombra: {
    id: 'sombra', nome: 'A SOMBRA', ic: 'eye-off', cor: 'var(--roxo)',
    lema: 'Assinatura é prova.',
    promessa: 'Tudo que você conseguir vai parecer que aconteceu sozinho.',
    mede: 'O que você conseguiu sem assinar nada',
    usa: 'espionagem · fake news · golpes · sanções',
    pesados: ['espionagem'],
    voz: 'A casa quer resultado sem digital.',
  },
};

export const ORDEM_DOUTRINAS = ['conquistador', 'industrial', 'arquiteto', 'farol', 'sombra'];

// ── QUANTO VALE CADA FEITO EM PONTOS DE LEGADO ────────────────────────
// CALIBRAGEM (o porquê dos números): o Destino final entra inteiro na conta e vale
// no máximo 100. Um Legado precisa ficar na MESMA ordem de grandeza, senão uma das
// duas metades vira decoração. Uma década muito ativa produz algo como 15 conquistas,
// 3 anexações e 2 curas — o que dá ~150 na doutrina certa. Somado ao Destino, um bom
// jogador fecha entre 200 e 300, e o pódio se decide por dezenas, não por milhares.
//
// A unidade de `valor` é a que TIPOS documenta em feitos.js — e é aqui que um erro
// de mão custa caro: `ajuda` e `cura_invest` chegam em TRILHÕES (0,5 é muito), não
// em contagem. Por isso valem 6 e 8 por unidade, e não 1.
const VALOR = {
  conquista: 5,          // por estado tomado
  anexacao: 22,          // apagar um país do mapa é o feito mais caro do jogo
  libertacao: 18,        // devolver soberania é raro, e o jogo tem de pagar por isso
  ofensiva: 2,
  invasao_repelida: 6,
  territorio_perdido: -4, // perder é a única entrada negativa: o placar não é só acúmulo
  nuclear: -30,          // detonar destrói legado. Ganha a guerra e perde a década.
  cura_invest: 8,        // por trilhão
  cura_final: 30,        // curar uma pandemia é o feito civil mais caro
  mediacao: 4,
  paz_final: 25,
  ajuda: 6,              // por trilhão
  alianca: 14,
  sancao_aplicada: 3,
  sancao_sofrida: -5,
  espionagem: 7,
  armas_vendidas: 4,     // por trilhão vendido
  pib_delta: 3,          // por ponto percentual de PIB no ano
};

// Os rótulos curtos de cada tipo, para o detalhamento do Legado. Vivem AQUI, junto de
// `VALOR`, e não na tela: são a mesma lista, e listas irmãs em arquivos diferentes é
// como um tipo novo entra na conta e nunca ganha nome na tela. Note que são diferentes
// dos rótulos de `feitos.js` — lá é voz de jornal ("Territórios tomados" numa manchete),
// aqui é coluna de placar, texto curto que precisa ser lido de relance.
export const ROTULO_FEITO = {
  conquista: 'Territórios tomados', anexacao: 'Nações anexadas', libertacao: 'Soberanias devolvidas',
  ofensiva: 'Ofensivas lançadas', invasao_repelida: 'Invasões repelidas', territorio_perdido: 'Territórios perdidos',
  nuclear: 'Ogivas detonadas', cura_invest: 'Investido em saúde (tri)', cura_final: 'Pandemias curadas',
  mediacao: 'Rodadas de mediação', paz_final: 'Guerras encerradas', ajuda: 'Ajuda enviada (tri)',
  alianca: 'Pactos selados', sancao_aplicada: 'Sanções impostas', sancao_sofrida: 'Sanções sofridas',
  espionagem: 'Segredos roubados', armas_vendidas: 'Armas vendidas (tri)', pib_delta: 'Riqueza gerada (%)',
};

const PESO_DENTRO = 3;   // feito da SUA doutrina
const PESO_FORA = 1;     // feito de outra — conta, mas não define
const round1 = (n) => Math.round(n * 10) / 10;

// ── O COFRE ───────────────────────────────────────────────────────────
export function cofreDoutrina(estado) {
  if (!estado.doutrina || typeof estado.doutrina !== 'object') estado.doutrina = { id: null, tally: {}, anos: [] };
  estado.doutrina.tally = estado.doutrina.tally || {};
  estado.doutrina.anos = estado.doutrina.anos || [];
  return estado.doutrina;
}

export function doutrinaDe(estado) {
  const id = cofreDoutrina(estado).id;
  return id ? (DOUTRINAS[id] || null) : null;
}

export function temDoutrina(estado) { return !!cofreDoutrina(estado).id; }

export function definirDoutrina(estado, id) {
  if (!DOUTRINAS[id]) return null;
  const c = cofreDoutrina(estado);
  // Escolha é IRREVERSÍVEL de propósito. Se desse pra trocar no Ano IX pela que
  // estava rendendo mais, a Doutrina deixaria de ser um rumo e viraria um filtro de
  // pontuação — e o jogador escolheria sempre a que já ganhou.
  if (c.id) return DOUTRINAS[c.id];
  c.id = id;
  c.escolhidaEm = estado.turno || 1;
  return DOUTRINAS[id];
}

// ── FECHAR O ANO NO ACUMULADOR ────────────────────────────────────────
// Chamado na virada de ano, ANTES de `limparAno` apagar os registros crus. Recebe a
// linha do placar do próprio jogador (o mesmo objeto que o relatório anual já
// calculou) — não recalcula nada, só soma.
//
// A GUARDA `anos` é o que impede contar duas vezes: no online, a batida do host e a
// batida local do convidado podem cair no mesmo mês. Mesma trava do `jaFechou`.
export function acumularAno(estado, linhaPlacar, ano) {
  const c = cofreDoutrina(estado);
  const a = Number(ano) || anoDoTurno(estado?.turno || 1);
  if (c.anos.includes(a)) return c.tally;
  if (!linhaPlacar) { c.anos.push(a); return c.tally; }
  for (const [tipo, v] of Object.entries(linhaPlacar)) {
    if (!(tipo in VALOR)) continue;              // 'nome', 'total', 'marcos'… não são feitos
    if (!Number.isFinite(v)) continue;
    c.tally[tipo] = round1((c.tally[tipo] || 0) + v);
  }
  c.anos.push(a);
  if (c.anos.length > 12) c.anos.splice(0, c.anos.length - 12);
  return c.tally;
}

// ── O CÁLCULO DO LEGADO ───────────────────────────────────────────────
// LEGADO = feitos da SUA doutrina (×3) + feitos das outras (×1) + Destino final.
//
// O ano CORRENTE entra por fora: o `tally` só tem anos fechados, e uma partida que
// termina em março (queda, ou império no Ano VII) perderia tudo que foi feito desde
// janeiro. Quem fecha uma década inteira não sente diferença — quem cai no meio,
// sente muita.
// A CONTA CORRENTE DE FEITOS: o acumulador dos anos fechados MAIS o ano ainda em
// aberto. É a única leitura honesta de "quanto eu já fiz até agora" — o `tally`
// sozinho ignora tudo que aconteceu desde janeiro, e `placarDoAno` sozinho ignora os
// nove anos anteriores. Exportada porque os Mandatos (jogo/mandatos.js) precisam
// exatamente disto para medir progresso no meio do caminho.
export function somaDeFeitos(estado) {
  const c = cofreDoutrina(estado);
  const soma = { ...c.tally };
  const meu = estado.iso || 'USA';
  const ano = anoDoTurno(estado.turno || 1);
  if (!c.anos.includes(ano)) {
    let linha = null;
    try { linha = placarDoAno(estado, { isos: [meu], ano })[meu]; } catch { linha = null; }
    for (const [tipo, v] of Object.entries(linha || {})) {
      if (!(tipo in VALOR) || !Number.isFinite(v)) continue;
      soma[tipo] = round1((soma[tipo] || 0) + v);
    }
  }
  return soma;
}

export function calcularLegado(estado, { destino = null, incluirAnoCorrente = true } = {}) {
  const c = cofreDoutrina(estado);
  const dout = c.id ? DOUTRINAS[c.id] : null;
  const pesados = new Set(dout?.pesados || []);
  const soma = incluirAnoCorrente ? somaDeFeitos(estado) : { ...c.tally };

  const linhas = [];
  let dentro = 0; let fora = 0;
  for (const [tipo, qtd] of Object.entries(soma)) {
    const base = VALOR[tipo];
    if (!base || !qtd) continue;
    const naDoutrina = pesados.has(tipo);
    // Feito NEGATIVO nunca é amortecido pela doutrina: detonar uma ogiva custa 30
    // pontos seja você Conquistador ou Farol. Punição com desconto não é punição.
    const peso = base < 0 ? 1 : (naDoutrina ? PESO_DENTRO : PESO_FORA);
    // INTEIRO, sempre. `qtd` é fracionário nos tipos em trilhões (1,2 tri de ajuda),
    // e "+21,6" ao lado de "+180" faz o placar parecer contabilidade, não legado.
    // Arredonda para longe do zero para que um feito pequeno nunca valha 0 pontos.
    const bruto = base * qtd * peso;
    const pts = bruto > 0 ? Math.max(1, Math.round(bruto)) : Math.min(-1, Math.round(bruto));
    if (!pts) continue;
    if (naDoutrina && base > 0) dentro += pts; else fora += pts;
    linhas.push({ tipo, qtd: round1(qtd), pontos: pts, naDoutrina: naDoutrina && base > 0, negativo: pts < 0 });
  }
  linhas.sort((a, b) => Math.abs(b.pontos) - Math.abs(a.pontos));

  const dest = Number.isFinite(destino) ? Math.round(destino) : 0;
  const total = Math.round(dentro + fora + dest);
  return { total, dentro: Math.round(dentro), fora: Math.round(fora), destino: dest, linhas, doutrina: dout };
}

// ── AS PATENTES DO LEGADO ─────────────────────────────────────────────
// O DONO OLHOU A TELA E PERGUNTOU: "o que seria esses números? não é pontos? é o que
// precisa de número certo? recorde? não sei..."
//
// Ele estava certo em não saber — a tela mostrava 480 e não dizia nem a UNIDADE nem a
// RÉGUA. Um número sem escala não é informação: é um enfeite grande. O jogador não
// tinha como responder a única pergunta que importa ali, que é "isso é bom?".
//
// Então o Legado ganhou faixas, exatamente como o Destino já tem (`BANDAS` em
// destino.js) — e pela mesma razão. A calibragem vem do teto real: uma década
// intensa produz ~15 conquistas, 3 anexações e 2 curas, o que dá ~150 na doutrina
// certa; somado ao Destino (até 100) e ao que sobra fora da doutrina, um jogador
// muito bom fecha entre 300 e 500. Passar de 700 exige uma década quase perfeita —
// por isso a última faixa é rara de propósito. Faixa que todo mundo alcança não
// classifica ninguém.
export const FAIXAS_LEGADO = [
  { min: 700, nome: 'LENDA DA DÉCADA',   nota: 'Praticamente o teto. Quase ninguém chega aqui.' },
  { min: 450, nome: 'DÉCADA HISTÓRICA',  nota: 'Um governo que os livros vão citar pelo nome.' },
  { min: 280, nome: 'DÉCADA DE PESO',    nota: 'Uma potência de verdade, construída e entregue.' },
  { min: 150, nome: 'NOME LEMBRADO',     nota: 'Fez o suficiente para não virar nota de rodapé.' },
  { min: 60,  nome: 'MANDATO DISCRETO',  nota: 'Governou. O mundo seguiu sem reparar muito.' },
  { min: -999, nome: 'RODAPÉ DA HISTÓRIA', nota: 'Pouco ficou de pé, e menos ainda ficou registrado.' },
];
export function faixaDeLegado(total) {
  const t = Number(total) || 0;
  const i = FAIXAS_LEGADO.findIndex((f) => t >= f.min);
  const atual = FAIXAS_LEGADO[i < 0 ? FAIXAS_LEGADO.length - 1 : i];
  // A faixa SEGUINTE e quanto faltou. É a informação que transforma "480" numa
  // história — "faltaram 220 pontos para LENDA" dá ao jogador um motivo concreto
  // para começar a próxima década. É a mesma lógica de `proximaBanda` no Destino.
  const acima = FAIXAS_LEGADO[Math.max(0, (i < 0 ? FAIXAS_LEGADO.length - 1 : i) - 1)];
  const proxima = acima && acima !== atual ? acima : null;
  return { atual, proxima, faltam: proxima ? Math.max(1, proxima.min - t) : 0 };
}

// ── O RANKING FINAL ───────────────────────────────────────────────────
// `outros` vem de `estado._statsHumanos` (o retrato que cada humano transmite a cada
// batida — ver indiceMundial.statsVivos). Offline ele vem vazio e o ranking tem uma
// linha só, o que é honesto: não existe "melhor país" quando os outros são simulação.
//
// AS DUAS RESPOSTAS AO MESMO TEMPO (modelo do Civilization): um CAMPEÃO único, que
// responde "quem foi o melhor", e uma COROA POR DOUTRINA, que garante que quem foi
// ótimo no próprio caminho e perdeu no geral ainda tenha o que contar. Sem a segunda,
// quatro dos cinco jogadores saem da mesa de mãos vazias.
export function rankingLegado(estado, { meuLegado = 0, meuDestino = 0 } = {}) {
  const meu = estado.iso || 'USA';
  const c = cofreDoutrina(estado);
  const linhas = [{
    iso: meu, nome: PAISES[meu]?.nome || meu, legado: Math.round(meuLegado),
    destino: Math.round(meuDestino), doutrina: c.id || null, eu: true,
  }];
  for (const [iso, s] of Object.entries(estado._statsHumanos || {})) {
    if (iso === meu || !s) continue;
    if (!Number.isFinite(s.leg)) continue;      // quem não transmite Legado não entra no pódio
    linhas.push({
      iso, nome: PAISES[iso]?.nome || iso, legado: Math.round(s.leg),
      destino: Math.round(s.dest || 0), doutrina: s.dout || null, eu: false,
    });
  }
  linhas.sort((a, b) => b.legado - a.legado || b.destino - a.destino);
  linhas.forEach((l, i) => { l.pos = i + 1; });

  // Uma coroa por doutrina REPRESENTADA. Doutrina sem ninguém não vira troféu vazio.
  const coroas = [];
  for (const id of ORDEM_DOUTRINAS) {
    const cands = linhas.filter((l) => l.doutrina === id);
    if (!cands.length) continue;
    coroas.push({ doutrina: id, nome: DOUTRINAS[id].nome, ic: DOUTRINAS[id].ic, cor: DOUTRINAS[id].cor, vencedor: cands[0] });
  }
  return { linhas, campeao: linhas[0] || null, coroas, disputado: linhas.length > 1 };
}

// ── O TÍTULO DA DÉCADA ────────────────────────────────────────────────
// A frase que a tela final usa como manchete do jogador. Escolhida pela doutrina E
// pela posição — porque "o maior Conquistador" e "o segundo Conquistador" são duas
// histórias diferentes, e o jogo tem de saber contar as duas.
const EPITETO = {
  conquistador: ['O IMPERADOR DA DÉCADA', 'O GENERAL QUE QUASE CHEGOU', 'A CAMPANHA INACABADA'],
  industrial:   ['O DONO DA FÁBRICA DO MUNDO', 'A SEGUNDA MAIOR ECONOMIA', 'A INDÚSTRIA QUE NÃO DECOLOU'],
  arquiteto:    ['O ARQUITETO DA ORDEM', 'O SÓCIO INDISPENSÁVEL', 'O PACTO QUE NÃO PEGOU'],
  farol:        ['O FAROL DA DÉCADA', 'A MÃO QUE SEGUROU MUITA GENTE', 'A BOA INTENÇÃO'],
  sombra:       ['A MÃO INVISÍVEL', 'O NOME QUE NUNCA APARECEU', 'A SOMBRA CURTA'],
};
export function epitetoDaDecada(doutrinaId, posicao = 1, disputado = false) {
  const lista = EPITETO[doutrinaId];
  if (!lista) return posicao === 1 ? 'A DÉCADA FOI SUA' : 'MANDATO CUMPRIDO';
  if (!disputado) return lista[0];
  return lista[Math.min(2, Math.max(0, posicao - 1))];
}
