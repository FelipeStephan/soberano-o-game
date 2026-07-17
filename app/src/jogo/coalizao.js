// ═══════════════════════════════════════════════════════════════════════
// COALIZÃO — quando você ataca um país, quem entra na guerra junto com ele
// ═══════════════════════════════════════════════════════════════════════
// A pergunta que o jogo não sabia responder: "se eu invadir o Brasil, o BRICS faz o quê?"
// A resposta antiga era: perde 18 pontos de relação com você e publica uma nota. A força
// do Brasil na batalha era exatamente a mesma com ou sem BRICS. O bloco era cenário.
//
// Aqui o bloco vira ATOR. Cada membro decide, por conta própria, se manda aço — e o que
// manda entra no cálculo do combate e FICA no mapa depois (via forcasMundo).
//
// ── POR QUE É DETERMINÍSTICO (e não sorteado) ─────────────────────────
// A tentação era jogar um dado: "60% de chance da China ajudar". Recusei por uma razão
// de design: o planejador de ofensiva MOSTRA a coalizão antes de você atacar. Se houvesse
// RNG, a previsão e o resultado divergiriam — o jogador veria "China: +40", atacaria
// contando com isso, e receberia outra coisa. Isso não é tensão, é mentira da interface.
//
// Determinístico significa que a coalizão é LEGÍVEL: ela sai do estado, e o jogador pode
// mudá-la jogando. Quer invadir o Brasil sem encarar a China? Passe três turnos melhorando
// a relação com Pequim antes. Isso é estratégia. Dado não é.
import { PAISES, souEu, oPais } from '../dados/paises.js';
import { blocosDoIso, meusAliadosDeBloco } from '../dados/blocos.js';
import { forcaDe, emprestarTropas } from './forcasMundo.js';

// Quanto de si um aliado está disposto a mandar, de 0 a 1.
//
// Três forças em jogo, e elas brigam entre si:
//   · o COMPROMISSO do bloco (a OTAN tem Artigo 5; o BRICS tem comunicado conjunto);
//   · o ÓDIO a você — quem já te detesta não precisa de convite pra armar seu inimigo;
//   · o MEDO — se você é muito mais forte que o bloco inteiro, entrar na guerra é suicídio
//     e a solidariedade descobre limites. Países pequenos condenam; não morrem.
function disposicao(estado, membroIso, intensidadeBloco) {
  const info = PAISES[membroIso];
  if (!info) return 0;

  // Base: o compromisso formal do bloco. É o piso e o teto do resto.
  let d = intensidadeBloco / 100;

  // A relação DELE comigo. Só temos `estado.rel_*` (minha relação com cada país), e ela
  // serve: relação é recíproca no modelo do jogo. Quem está em -80 comigo entra na guerra
  // com prazer; quem está em +60 hesita em atirar num parceiro.
  const rel = Number(estado[info.rel] ?? 0);
  d += (-rel / 100) * 0.45;      // rel -100 → +0.45 · rel +100 → -0.45

  return Math.max(0, Math.min(1, d));
}

// Um aliado não se despe pra defender o vizinho: manda no máximo ~30% do que tem, e
// escalado pela disposição. Quem manda tudo perde a própria casa no turno seguinte —
// e o jogo precisa que ajudar tenha custo, senão todo mundo ajuda sempre.
const TETO_ENVIO = 0.3;

// A coalizão que se forma para DEFENDER `isoAlvo` de um ataque MEU.
// Puro: não muda o estado. Serve tanto para o preview do planejador quanto para o
// cálculo real — e é por serem a MESMA função que os dois nunca divergem.
export function coalizaoDefensiva(estado, isoAlvo, featureAlvo = null) {
  const membros = [];
  let blocoNome = null;
  let intensidade = 0;

  for (const b of blocosDoIso(isoAlvo)) {
    if (b.intensidade > intensidade) { intensidade = b.intensidade; blocoNome = b.nome; }
    for (const iso of b.isos) {
      if (iso === isoAlvo || souEu(iso)) continue;      // nem o alvo, nem eu
      if (membros.find((m) => m.iso === iso)) continue; // país em dois blocos entra uma vez
      const d = disposicao(estado, iso, b.intensidade);
      if (d < 0.25) continue;                           // abaixo disso: só nota de repúdio
      const poderTotal = forcaDe(estado, iso);
      const poder = Math.round(poderTotal * TETO_ENVIO * d);
      if (poder < 1) continue;
      membros.push({
        iso, nome: PAISES[iso]?.nome || iso, poder, bloco: b.nome,
        disposicao: Math.round(d * 100),
        motivo: motivoDe(estado, iso, b),
      });
    }
  }

  membros.sort((a, b) => b.poder - a.poder);
  return {
    blocoNome, intensidade, membros,
    poderExtra: membros.reduce((s, m) => s + m.poder, 0),
  };
}

// A frase que explica a decisão daquele país. Existe porque um número sem porquê não
// ensina o jogador a jogar: ele precisa entender que a China veio por causa DELE.
function motivoDe(estado, iso, bloco) {
  const rel = Number(estado[PAISES[iso]?.rel] ?? 0);
  if (rel <= -50) return `odeia você (relação ${Math.round(rel)}) e não perdeu a chance`;
  if (rel <= -15) return `relação ruim com você (${Math.round(rel)}) — entrou sem hesitar`;
  if (bloco.militar) return `${bloco.nome}: compromisso militar`;
  return `${bloco.nome}: solidariedade de bloco`;
}

// ── E QUANDO SOU EU QUE APANHO ────────────────────────────────────────
// O sentido que nunca existiu no código. `reacaoDeBloco` só sabia "eu ataquei alguém".
// Este é o "alguém me atacou" — e é ele que realiza o pedido original: o BRICS
// respondendo a um ataque ao Brasil, quando o Brasil é VOCÊ.
export function coalizaoDoJogador(estado, isoAgressor) {
  const membros = [];
  for (const a of meusAliadosDeBloco()) {
    if (a.iso === isoAgressor) continue;   // quem me ataca não me defende
    const d = disposicao(estado, a.iso, a.intensidade);
    // Pra me defender, o que pesa é a relação DELE comigo ser BOA — o inverso do caso
    // ofensivo. Refaço a conta com o sinal certo em vez de reaproveitar por preguiça.
    const rel = Number(estado[a.rel] ?? 0);
    const vontade = Math.max(0, Math.min(1, (a.intensidade / 100) * 0.6 + (rel / 100) * 0.5));
    if (vontade < 0.25) continue;
    const poder = Math.round(forcaDe(estado, a.iso) * TETO_ENVIO * vontade);
    if (poder < 1) continue;
    membros.push({
      iso: a.iso, nome: a.nome, poder, bloco: a.bloco,
      disposicao: Math.round(vontade * 100),
      motivo: rel >= 55 ? `aliado próximo (relação ${Math.round(rel)})` : `${a.bloco}: obrigação de bloco`,
      _d: d,
    });
  }
  membros.sort((x, y) => y.poder - x.poder);
  return { membros, poderExtra: membros.reduce((s, m) => s + m.poder, 0) };
}

// ── Materializar ──────────────────────────────────────────────────────
// Até aqui tudo era cálculo. Isto ESCREVE no mundo: as tropas saem de um país e entram
// no outro, com prazo, e ficam lá nos próximos turnos. É a diferença entre a coalizão
// ser um número na tela da batalha e ser um fato do mapa.
export function materializarCoalizao(estado, coalizao, isoDestino, motivoBase = 'coalizão') {
  const feitos = [];
  for (const m of coalizao.membros || []) {
    const r = emprestarTropas(estado, {
      de: m.iso, para: isoDestino, poder: m.poder,
      motivo: m.bloco || motivoBase, turnos: 4,
    });
    if (r) feitos.push({ ...r, motivoTexto: m.motivo });
  }
  return feitos;
}

// Resumo em uma linha pro prompt da IA. A Máquina precisa saber que a China entrou na
// guerra pra narrar isso — senão o texto contradiz a mecânica, que é o pior dos mundos:
// o jogador vê "+40 China" na tela e lê uma narrativa que não menciona a China.
export function resumoCoalizao(coalizao, nomeAlvo) {
  if (!coalizao?.membros?.length) return `${oPais(nomeAlvo)} está sozinho: nenhum aliado se mexeu.`;
  const partes = coalizao.membros.map((m) => `${m.nome} (+${m.poder}, ${m.motivo})`);
  return `${coalizao.blocoNome || 'Aliados'} reforçou ${oPais(nomeAlvo)} com ${coalizao.poderExtra} de poder: ${partes.join('; ')}.`;
}
