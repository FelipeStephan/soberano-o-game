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
import { PAISES, souEu, oPais, jogadorIso } from '../dados/paises.js';
import { blocosDoIso, meusAliadosDeBloco } from '../dados/blocos.js';
import { forcaDe, emprestarTropas } from './forcasMundo.js';
import { estadosDe, estadoPorId, donoDe } from './territorio.js';
import { aliancaCom, defesaMutuaViva, honrarPacto, racharPacto } from './aliancas.js';
import { aplicarEfeitos } from './efeitos.js';

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

// ═══════════════════════════════════════════════════════════════════════
// SOCORRO A ALIADO — a coalizão vista do outro lado
// ═══════════════════════════════════════════════════════════════════════
// Tudo acima deste ponto responde "quem entra na guerra do OUTRO". Isto responde a
// pergunta inversa, que é a que o jogador vive: alguém tomou território de um aliado
// meu — eu vou? É o mesmo assunto de cabeça pra baixo, por isso mora no mesmo arquivo:
// se um dia a IA precisar decidir isso por um NPC, a régua já está aqui do lado.
//
// A REGRA DE OURO DESTE MÓDULO: o território retomado VOLTA PRO ALIADO. Socorro que
// termina com a sua bandeira no chão dele não é socorro, é aproveitar a confusão — e o
// jogo permite (ver `ficarComTerritorio`), porque é uma jogada boa demais pra proibir.
// Mas permite COBRANDO, e dizendo o preço antes.
//
// PRAZO: 3 minutos de relógio real, não turnos. O Modo Tempo Real fez do relógio a
// unidade de urgência do jogo, e um chamado de socorro é a coisa mais urgente que
// existe. Quem some por 3 minutos enquanto o aliado sangra fez uma escolha.
export const PRAZO_SOCORRO_MS = 180000;

const chaveRel = (iso) => PAISES[iso]?.rel || `rel_${String(iso).toLowerCase()}`;

// ── ABRIR O CHAMADO ───────────────────────────────────────────────────
// Chamado por quem detecta a perda: o handler de `guerra_resultado`/`ataque_estado`
// no online, ou a resolução de uma ofensiva NPC contra um aliado meu. Idempotente por
// (aliado, agressor): um segundo ataque na mesma guerra ACUMULA territórios no chamado
// que já está aberto, em vez de empilhar três modais na cara do jogador.
export function registrarSocorro(estado, { aliado, agressor, estados = [], remoto = false }) {
  const eu = estado.iso || jogadorIso();
  if (!aliado || !agressor) return null;
  if (aliado === eu || agressor === eu) return null;      // a minha guerra tem outro caminho
  const al = aliancaCom(estado, aliado);
  if (!al) return null;                                    // não é meu aliado: não é comigo
  estado.socorros = estado.socorros || [];
  const aberto = estado.socorros.find((s) => s.aliado === aliado && s.agressor === agressor && s.honrado == null);
  if (aberto) {
    aberto.estados = [...new Set([...(aberto.estados || []), ...estados])];
    aberto.prazo = Date.now() + PRAZO_SOCORRO_MS;          // ataque novo reabre a janela
    return aberto;
  }
  const s = {
    id: `soc_${aliado}_${agressor}_${Date.now()}`,
    aliado, agressor, remoto: !!remoto,
    alianca: { id: al.id, nome: al.nome },
    defesaMutua: defesaMutuaViva(al),
    estados: [...new Set(estados)],
    abertoEm: Date.now(),
    prazo: Date.now() + PRAZO_SOCORRO_MS,
    honrado: null,          // null = aberto · true = atendido · false = abandonado
    motivoFim: null,        // 'atendido' | 'recusado' | 'silencio'
    retomados: [], mantidos: [],
  };
  estado.socorros.push(s);
  return s;
}

export function socorrosAbertos(estado) {
  return (estado?.socorros || []).filter((s) => s.honrado == null);
}
export function socorroPorId(estado, id) {
  return (estado?.socorros || []).find((s) => s.id === id) || null;
}
// O chamado aberto de um aliado específico — é o que o clique no país no mapa pergunta.
export function socorroDe(estado, iso) {
  return socorrosAbertos(estado).find((s) => s.aliado === iso) || null;
}

// ── O PRAZO VENCEU ────────────────────────────────────────────────────
// Chamar na batida do relógio. Devolve os chamados que viraram silêncio, já com as
// consequências aplicadas — quem chama só precisa narrar.
export function expirarSocorros(estado, agora = Date.now()) {
  const vencidos = socorrosAbertos(estado).filter((s) => agora >= (s.prazo || 0));
  return vencidos.map((s) => ({ socorro: s, resultado: abandonarSocorro(estado, s.id, { silencio: true }) }));
}

// ── O QUE DÁ PRA RETOMAR ──────────────────────────────────────────────
// Territórios que NASCERAM do aliado e hoje estão em mãos alheias. Duas fontes,
// porque o catálogo de estados carrega por país e sob demanda: os estados já
// carregados do aliado e as exceções gravadas em `donoEstado` com o prefixo dele
// (que chegam pela rede mesmo sem o catálogo). `donoDe` resolve a posse — e resolve
// também a anexação, então um aliado ANEXADO inteiro devolve o país todo aqui.
export function territoriosRetomaveis(estado, isoAliado) {
  const eu = estado.iso || jogadorIso();
  const ids = new Set(estadosDe(isoAliado).map((e) => e.id));
  for (const id of Object.keys(estado?.donoEstado || {})) {
    if ((estadoPorId(id)?.pais || String(id).split('-')[0]) === isoAliado) ids.add(id);
  }
  const out = [];
  for (const id of ids) {
    const dono = donoDe(estado, id);
    if (dono === isoAliado) continue;                       // ainda é dele: não há o que retomar
    const e = estadoPorId(id);
    out.push({
      id, dono,
      nome: e?.nome || id,
      lat: e?.lat, lng: e?.lng,
      // JÁ ESTÁ NA MINHA MÃO: retomei antes, ou tomei dele numa vida passada. Não há
      // combate a fazer — há uma decisão moral: devolver ou não.
      meu: dono === eu,
    });
  }
  return out.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

// ── ATENDER ───────────────────────────────────────────────────────────
// O momento em que a assinatura vira sangue. Honrar o pacto NÃO é só um bônus de
// relação: é uma declaração de guerra ao agressor, com tudo que isso arrasta (temp de
// guerra, relação no chão, e um inimigo novo que agora tem motivo pra vir na sua
// direção). Por isso a tela mostra as duas colunas antes do clique.
export function atenderSocorro(estado, id) {
  const s = socorroPorId(estado, id);
  if (!s || s.honrado != null) return { falha: 'Este chamado já foi decidido.' };
  const al = aliancaCom(estado, s.aliado);
  s.honrado = true; s.motivoFim = 'atendido'; s.decididoEm = Date.now();

  // A GUERRA. Entrar não é opcional depois de dizer sim — quem manda tropa contra
  // quem ocupa o aliado já está em guerra, o resto é papelada.
  estado.emGuerra = estado.emGuerra || [];
  const jaEmGuerra = estado.emGuerra.includes(s.agressor);
  if (!jaEmGuerra) estado.emGuerra.push(s.agressor);
  const custoGuerra = aplicarEfeitos(estado, {
    [chaveRel(s.agressor)]: jaEmGuerra ? -12 : -50,
    temp_guerra: jaEmGuerra ? 5 : 14,
  });

  const pacto = honrarPacto(estado, al, s.aliado);
  return {
    ok: true, socorro: s, jaEmGuerra,
    mudancas: [...(pacto.mudancas || []), ...custoGuerra],
    linhas: [
      ...pacto.linhas,
      jaEmGuerra
        ? `Já estávamos em guerra com ${PAISES[s.agressor]?.nome || s.agressor}. Agora estamos por dois motivos.`
        : `Estamos em guerra com ${PAISES[s.agressor]?.nome || s.agressor}. Foi uma escolha nossa, tomada por causa de outro país.`,
    ],
  };
}

// ── ABANDONAR ─────────────────────────────────────────────────────────
// `silencio: true` só vem do prazo vencido (expirarSocorros). O jogador que clica
// RECUSAR paga menos — ver a assimetria explicada em aliancas.js.
export function abandonarSocorro(estado, id, { silencio = false } = {}) {
  const s = socorroPorId(estado, id);
  if (!s || s.honrado != null) return { falha: 'Este chamado já foi decidido.' };
  const al = aliancaCom(estado, s.aliado);
  s.honrado = false; s.motivoFim = silencio ? 'silencio' : 'recusado'; s.decididoEm = Date.now();
  const r = racharPacto(estado, al, s.aliado, { silencio });
  return { ok: true, socorro: s, silencio, ...r };
}

// ── DEVOLVER (o ato que separa socorro de oportunismo) ─────────────────
// Depois de `resolverEnvio` com `{ resgate: true }`, o território está gravado como
// MEU (é o que `aplicarAtaqueAoEstado` faz com qualquer conquista). Devolver é apagar
// essa exceção: sem entrada em `donoEstado`, `donoDe` volta a responder o dono nativo,
// que é o aliado. Não existe "transferir posse" no modelo — existe abrir mão dela.
//
// A tropa sobrevivente VOLTA PRA CASA em vez de ficar guarnecendo solo alheio. Não é
// preguiça: `tropaLivre` só desconta guarnições em território cujo dono sou eu, então
// tropa parada em chão do aliado sumiria do extrato e poderia ser reenviada — a mesma
// divisão em dois lugares. Enquanto não houver um modelo de base no exterior, ela volta.
export function restituirAoAliado(estado, idEstado, isoAliado) {
  const eu = estado.iso || jogadorIso();
  if (donoDe(estado, idEstado) !== eu) return { falha: 'Este território não está sob o seu controle.' };
  const devolvida = estado.guarnicoes?.[idEstado] || null;
  if (estado.donoEstado) delete estado.donoEstado[idEstado];
  if (estado.conflitosEstado) delete estado.conflitosEstado[idEstado];
  if (estado.guarnicoes) delete estado.guarnicoes[idEstado];   // a coluna volta pro quartel
  const nome = estadoPorId(idEstado)?.nome || idEstado;
  return {
    ok: true, idEstado, nome, isoAliado, devolvida,
    linha: `${nome} foi devolvido a ${PAISES[isoAliado]?.nome || isoAliado}. Nossa tropa saiu junto — entrou pra libertar, não pra ficar.`,
  };
}

// ── FICAR COM ELE (a facada elegante) ─────────────────────────────────
// O dono perguntou se deveria existir a opção de ficar com o território retomado.
// Deve — é a jogada mais interessante do sistema inteiro, e proibir seria fingir que o
// jogador é boa gente. O preço é o correto: você libertou o chão e plantou a SUA
// bandeira nele, na frente do dono. Isso não conta como pacto honrado (o socorro vira
// oportunismo), racha a aliança e o mundo vê. Você ganha território e perde o bloco —
// que é exatamente a conta que um oportunista faz de olhos abertos.
export function ficarComTerritorio(estado, idEstado, isoAliado, socorro = null) {
  const eu = estado.iso || jogadorIso();
  if (donoDe(estado, idEstado) !== eu) return { falha: 'Este território não está sob o seu controle.' };
  const al = aliancaCom(estado, isoAliado);
  const nome = estadoPorId(idEstado)?.nome || idEstado;
  if (socorro) {
    socorro.mantidos = [...new Set([...(socorro.mantidos || []), idEstado])];
    socorro.oportunismo = true;
  }
  const ef = { [chaveRel(isoAliado)]: -35, soft_power: -10 };
  const mudancas = aplicarEfeitos(estado, ef);
  const racha = al ? racharPacto(estado, al, isoAliado, { silencio: false }) : { linhas: [], mudancas: [] };
  return {
    ok: true, idEstado, nome,
    mudancas: [...mudancas, ...(racha.mudancas || [])],
    linhas: [
      `${nome} foi tomado de ${PAISES[socorro?.agressor || '']?.nome || 'o ocupante'} — e ficou conosco. ${PAISES[isoAliado]?.nome || isoAliado} pediu socorro e recebeu um novo senhorio.`,
      ...(racha.linhas || []),
    ],
    ...racha,
  };
}

// A frase que o aliado (e o mundo) lê. Existe pra o online: quem foi socorrido precisa
// VER que alguém veio — metade da recompensa de uma aliança é essa notificação.
export function resumoSocorro(s, { retomados = 0, mantidos = 0 } = {}) {
  const aliado = PAISES[s?.aliado]?.nome || s?.aliado;
  const agressor = PAISES[s?.agressor]?.nome || s?.agressor;
  if (!retomados && !mantidos) return `Operação de socorro a ${oPais(aliado)} contra ${agressor} não recuperou território.`;
  if (mantidos && !retomados) return `${mantidos} território(s) de ${aliado} foram tomados de ${agressor} — e NÃO devolvidos.`;
  return `${retomados} território(s) de ${aliado} retomados de ${agressor} e devolvidos${mantidos ? `, ${mantidos} retido(s)` : ''}.`;
}

// Resumo em uma linha pro prompt da IA. A Máquina precisa saber que a China entrou na
// guerra pra narrar isso — senão o texto contradiz a mecânica, que é o pior dos mundos:
// o jogador vê "+40 China" na tela e lê uma narrativa que não menciona a China.
export function resumoCoalizao(coalizao, nomeAlvo) {
  if (!coalizao?.membros?.length) return `${oPais(nomeAlvo)} está sozinho: nenhum aliado se mexeu.`;
  const partes = coalizao.membros.map((m) => `${m.nome} (+${m.poder}, ${m.motivo})`);
  return `${coalizao.blocoNome || 'Aliados'} reforçou ${oPais(nomeAlvo)} com ${coalizao.poderExtra} de poder: ${partes.join('; ')}.`;
}
