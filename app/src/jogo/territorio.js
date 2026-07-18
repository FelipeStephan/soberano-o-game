// ═══════════════════════════════════════════════════════════════════════
// TERRITÓRIO — o jogo desce do país para o ESTADO
// ═══════════════════════════════════════════════════════════════════════
// A mudança de eixo: até aqui a unidade atômica era o PAÍS. Você tinha 1.100.000
// soldados e eles existiam em toda parte e em lugar nenhum — atacar o Brasil era
// atacar um bloco monolítico. Isto quebra esse bloco.
//
// Agora as forças TÊM ENDEREÇO. Um exército parado em Manaus não defende o Rio, e
// é isso que faz o cenário existir: o inimigo manda pouca tropa contra um estado
// que você reforçou, a guarnição segura, e o território continua seu. Defesa deixa
// de ser um número global e vira uma decisão de ONDE colocar o quê.
//
// Modelo de dados (mora no save, é JSON puro):
//   estado.guarnicoes = { 'BRA-RJ': { infantaria: 50000, defesa_aerea: 4, ... } }
//   estado.donoEstado = { 'BRA-RJ': 'ARG' }   // só quem MUDOU de dono aparece aqui
//
// A regra do dono é implícita de propósito: 892 estados no save seria desperdício.
// Quem não está em `donoEstado` pertence ao país do prefixo do id. Só a exceção
// (território perdido ou conquistado) é gravada.
import { UNIDADE_POR_ID, composicaoPlausivel } from '../dados/forcas.js';
import { forcaDe } from './forcasMundo.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(DIACRITICOS, '').trim();

// Cache dos estados carregados. O catálogo cresce POR PAÍS, conforme o jogador
// clica — os 4.223 estados do mundo nunca estão todos aqui ao mesmo tempo, e não
// precisam estar: o que importa é o país que ele está olhando.
let CATALOGO = [];        // [{ id, nome, pais, tipo, lat, lng }]
let PORID = new Map();
const PAISES_CARREGADOS = new Set();

// Acrescenta (não substitui). Chamar duas vezes com o mesmo país é inofensivo.
export function registrarEstados(lista, iso = null) {
  for (const e of lista) {
    if (PORID.has(e.id)) continue;
    CATALOGO.push(e);
    PORID.set(e.id, e);
  }
  if (iso) PAISES_CARREGADOS.add(iso);
}
export function estadosCarregados() { return CATALOGO.length > 0; }
export function paisCarregado(iso) { return PAISES_CARREGADOS.has(iso); }
export function estadosDe(iso) { return CATALOGO.filter((e) => e.pais === iso); }
export function estadoPorId(id) { return PORID.get(id) || null; }
export function todosEstados() { return CATALOGO; }

// ── DE QUEM É ESTE TERRITÓRIO ─────────────────────────────────────────
export function donoDe(estado, idEstado) {
  const excecao = estado.donoEstado?.[idEstado];
  if (excecao) return excecao;
  return PORID.get(idEstado)?.pais || idEstado.split('-')[0];
}
export function ehMeu(estado, idEstado) { return donoDe(estado, idEstado) === (estado.iso || 'USA'); }

// Territórios que eu perdi (eram meus por nascimento, hoje são de outro) — é o que
// pinta de vermelho no mapa e dá ao jogador o alvo da reconquista.
export function meusPerdidos(estado) {
  const eu = estado.iso || 'USA';
  return Object.entries(estado.donoEstado || {})
    .filter(([id, dono]) => dono !== eu && (PORID.get(id)?.pais || id.split('-')[0]) === eu)
    .map(([id, dono]) => ({ ...PORID.get(id), id, dono }));
}
// Territórios que eu tomei de outros.
export function meusConquistados(estado) {
  const eu = estado.iso || 'USA';
  return Object.entries(estado.donoEstado || {})
    .filter(([id, dono]) => dono === eu && (PORID.get(id)?.pais || id.split('-')[0]) !== eu)
    .map(([id]) => ({ ...PORID.get(id), id }));
}

// ── GUARNIÇÕES ────────────────────────────────────────────────────────
export function guarnicao(estado, idEstado) {
  return estado.guarnicoes?.[idEstado] || {};
}

// A força de uma guarnição: mesma conta do resto do jogo (quantidade × poder).
export function forcaGuarnicao(g) {
  let t = 0;
  for (const [id, q] of Object.entries(g || {})) t += (q || 0) * (UNIDADE_POR_ID[id]?.poder || 0);
  return Math.round(t * 100) / 100;
}

// ── IMPORTÂNCIA DO ESTADO (base para a distribuição realista) ──────────
// O pedido: "cada país já tem o poder militar dividido pelos estados com base na
// realidade". A realidade que temos é POPULAÇÃO (cidades.json soma habitantes por
// estado) e CAPITAL (a cidade marcada como capital nacional). É o mesmo critério de
// um Estado-maior de verdade: guarnece onde há gente, indústria e o governo.
let POP_ESTADO = new Map();   // `${pais}::${nomeNormalizado}` → população somada das cidades
let CAP_PAIS = new Map();     // iso → nome normalizado do estado que abriga a capital nacional

// Chamada uma vez, quando o índice de cidades chega (ver ui/globo.js). Idempotente.
export function registrarCidades(lista) {
  for (const c of lista || []) {
    if (!c.pais || !c.estado) continue;
    const k = `${c.pais}::${norm(c.estado)}`;
    POP_ESTADO.set(k, (POP_ESTADO.get(k) || 0) + (c.pop || 0));
    if (c.capitalPais) CAP_PAIS.set(c.pais, norm(c.estado));
  }
}

// Peso de importância de UM estado (≥1). População entra pela raiz (achata os
// gigantes: São Paulo pesa mais que o Acre, mas não 40×), e a capital ganha um
// multiplicador — é onde ficam o comando e a guarda pretoriana. Estados sem cidade
// mapeada caem no piso 1 (guarnição simbólica), o que é realista.
export function pesoImportancia(e) {
  if (!e) return 1;
  const pop = POP_ESTADO.get(`${e.pais}::${norm(e.nome)}`) || 0;
  let w = 1 + Math.sqrt(pop / 1e6) * 0.9;
  if (CAP_PAIS.get(e.pais) === norm(e.nome)) w *= 1.8;
  return w;
}

// O estado-capital de um país (o que abriga a capital nacional). Sem cidade-capital
// mapeada, cai no estado de MAIOR peso — o coração econômico faz as vezes de capital.
export function estadoCapitalDe(iso) {
  const alvos = estadosDe(iso);
  if (!alvos.length) return null;
  const capNome = CAP_PAIS.get(iso);
  if (capNome) { const m = alvos.find((e) => norm(e.nome) === capNome); if (m) return m; }
  return alvos.reduce((a, b) => (pesoImportancia(b) > pesoImportancia(a) ? b : a));
}

// ── GUARNIÇÃO DEFENSIVA DE QUALQUER ESTADO (inclusive dos NPCs) ─────────
// O BUG QUE ISTO CONSERTA: atacar São Paulo mostrava "guarnição nenhuma". O jogador
// tem inventário concreto por estado (estado.guarnicoes); os NPCs têm só um escalar
// de força (forcaDe). Sem uma ponte, todo estado inimigo parecia deserto — e invadir
// era de graça. Aqui a força TOTAL do país-dono é espalhada pelos estados dele por
// importância, e este estado recebe a fatia dele. Guerra volta a ter defensor.
const FRACAO_GUARNICAO_NPC = 0.72;   // o país não empilha 100% na linha: guarda reserva estratégica

export function forcaDefensivaNPC(estado, iso, idEstado) {
  const alvos = estadosDe(iso);
  if (!alvos.length) return 0;
  const alvo = alvos.find((e) => e.id === idEstado);
  if (!alvo) return 0;
  const soma = alvos.reduce((a, e) => a + pesoImportancia(e), 0) || 1;
  const total = forcaDe(estado, iso);   // escalar do país, mesma unidade de forcaGuarnicao
  const share = pesoImportancia(alvo) / soma;
  return Math.round(total * FRACAO_GUARNICAO_NPC * share * 100) / 100;
}

// A força defensiva REAL de um estado, resolvida pelo dono:
//   • é seu / você conquistou → a guarnição concreta que você posicionou
//   • é de NPC → a fatia sintetizada da força do país (forcaDefensivaNPC)
// Retorna um NÚMERO de força (o multiplicador 1,6× do defensor é aplicado por quem chama).
export function guarnicaoDefensiva(estado, idEstado) {
  const eu = estado.iso || 'USA';
  const dono = donoDe(estado, idEstado);
  if (dono === eu) return forcaGuarnicao(guarnicao(estado, idEstado));
  // guarnição que EU deixei num estado que tomei de terceiros conta como defesa minha
  const minha = forcaGuarnicao(guarnicao(estado, idEstado));
  if (minha > 0 && estado.donoEstado?.[idEstado] === eu) return minha;
  return forcaDefensivaNPC(estado, dono, idEstado);
}

// A COMPOSIÇÃO defensiva pra MOSTRAR (tooltip, painel de alvo): converte a força
// sintetizada numa ordem de batalha plausível (infantaria + blindados + AA...).
// Se for guarnição real do jogador, devolve a real; se for NPC, devolve a estimada.
export function guarnicaoDefensivaDetalhe(estado, idEstado) {
  const eu = estado.iso || 'USA';
  const dono = donoDe(estado, idEstado);
  const real = guarnicao(estado, idEstado);
  if (dono === eu || (Object.keys(real).length && estado.donoEstado?.[idEstado] === eu)) {
    return { g: real, forca: forcaGuarnicao(real), estimada: false, dono };
  }
  const forca = forcaDefensivaNPC(estado, dono, idEstado);
  return { g: composicaoPlausivel(dono, forca), forca, estimada: true, dono };
}

// Quanto do meu arsenal ainda está em casa, sem endereço (o "quartel central").
// É daqui que sai todo reforço — e é isto que impede o jogador de posicionar
// tropa que não tem.
export function tropaLivre(estado) {
  const livre = { ...(estado.forcas || {}) };
  for (const [id, g] of Object.entries(estado.guarnicoes || {})) {
    // As frotas no mar (MAR_*) SÃO minhas embarcações comprometidas — donoDe não as
    // reconhece (a chave não tem prefixo de país), então tratamos explícito. Sem isto,
    // navio posicionado numa frota continuava contando como "livre" e dava pra deployar
    // a mesma esquadra duas vezes. Agora frota ocupa a tropa de verdade.
    const minha = id.startsWith('MAR_') || donoDe(estado, id) === (estado.iso || 'USA');
    if (!minha) continue;
    for (const [u, q] of Object.entries(g || {})) livre[u] = Math.max(0, (livre[u] || 0) - (q || 0));
  }
  return livre;
}

// ── REFORÇAR ──────────────────────────────────────────────────────────
// Tira do quartel central e põe no estado. Só o que você tem, só onde é seu.
export function reforcar(estado, idEstado, envio) {
  if (!ehMeu(estado, idEstado)) return { falha: 'Você não controla este território.' };
  const livre = tropaLivre(estado);
  for (const [u, q] of Object.entries(envio || {})) {
    if (!q) continue;
    if ((livre[u] || 0) < q) {
      return { falha: `Você só tem ${(livre[u] || 0).toLocaleString('pt-BR')} de ${UNIDADE_POR_ID[u]?.nome || u} sem posição.` };
    }
  }
  estado.guarnicoes = estado.guarnicoes || {};
  const g = { ...(estado.guarnicoes[idEstado] || {}) };
  let moveu = 0;
  for (const [u, q] of Object.entries(envio || {})) {
    if (!q) continue;
    g[u] = (g[u] || 0) + q; moveu += q;
  }
  if (!moveu) return { falha: 'Nenhuma unidade selecionada.' };
  estado.guarnicoes[idEstado] = g;
  return { ok: true, idEstado, envio, forca: forcaGuarnicao(g), moveu };
}

// Recolher tropa de um estado de volta ao quartel central.
export function recolher(estado, idEstado, envio) {
  const g = { ...(estado.guarnicoes?.[idEstado] || {}) };
  for (const [u, q] of Object.entries(envio || {})) {
    if (!q) continue;
    if ((g[u] || 0) < q) return { falha: `Não há ${q} de ${UNIDADE_POR_ID[u]?.nome || u} neste território.` };
  }
  for (const [u, q] of Object.entries(envio || {})) {
    if (!q) continue;
    g[u] = Math.max(0, (g[u] || 0) - q);
    if (!g[u]) delete g[u];
  }
  if (Object.keys(g).length) estado.guarnicoes[idEstado] = g;
  else delete estado.guarnicoes[idEstado];
  return { ok: true };
}

// ── RECOLHER TUDO — o botão de pânico do Estado-Maior ─────────────────
// Devolve TODAS as guarnições terrestres à reserva de uma vez (frotas no mar ficam:
// recolher navio é decisão separada, via recolherFrota). É o reset que faltava quando
// o jogador distribuía tudo e ficava travado sem reserva.
export function recolherTudo(estado) {
  const eu = estado.iso || 'USA';
  const devolvido = {};
  let estados = 0;
  for (const [id, g] of Object.entries(estado.guarnicoes || {})) {
    if (id.startsWith('MAR_')) continue;               // frota se recolhe no mar, não daqui
    if (donoDe(estado, id) !== eu) continue;           // guarnição em território que não é mais seu: perdida
    for (const [u, q] of Object.entries(g || {})) devolvido[u] = (devolvido[u] || 0) + (q || 0);
    delete estado.guarnicoes[id];
    estados += 1;
  }
  const total = Object.values(devolvido).reduce((a, b) => a + b, 0);
  if (!total) return { ok: false, motivo: 'Nenhuma tropa guarnecida para recolher.' };
  return { ok: true, devolvido, estados, total };
}

// ── ONDE ESTÃO AS MINHAS TROPAS — o extrato da ocupação ───────────────
// Responde a pergunta que o jogador fazia sem resposta: "se não há tropa livre, onde
// ela ESTÁ?". Lista cada compromisso (estado guarnecido ou frota no mar) com a
// composição — é a fonte do painel Pentágono e do aviso naval "sem embarcação livre".
export function ondeComprometidas(estado, { unidades = null } = {}) {
  const eu = estado.iso || 'USA';
  const filtra = (g) => {
    if (!unidades) return g;
    const f = {};
    for (const u of unidades) if (g[u]) f[u] = g[u];
    return f;
  };
  const out = [];
  for (const [id, g] of Object.entries(estado.guarnicoes || {})) {
    if (donoDe(estado, id) !== eu && !id.startsWith('MAR_')) continue;
    const comp = filtra(g || {});
    const total = Object.values(comp).reduce((a, b) => a + (b || 0), 0);
    if (!total) continue;
    if (id.startsWith('MAR_')) {
      const fr = (estado.frotas || []).find((f) => f.guarnKey === id);
      out.push({ tipo: 'frota', id, frotaId: fr?.id || null, nome: fr?.portoNome ? `Frota (zarpou de ${fr.portoNome})` : 'Frota no mar', g: comp, total, lat: fr?.lat, lng: fr?.lng });
    } else {
      out.push({ tipo: 'estado', id, nome: PORID.get(id)?.nome || id, g: comp, total, lat: PORID.get(id)?.lat, lng: PORID.get(id)?.lng });
    }
  }
  return out.sort((a, b) => b.total - a.total);
}

// ── DEFESA DE UM ESTADO CONTRA UM ATAQUE ──────────────────────────────
// O coração do pedido: "alguém me ataca pelo Rio, mas o Rio está reforçado e a
// tropa dele era pouca — eu seguro o território".
//
// Defender é mais barato que atacar (o defensor conhece o terreno, está entrincheirado
// e não precisa atravessar oceano). Por isso a guarnição vale mais que o número cru:
// é o mesmo motivo pelo qual a doutrina real pede 3:1 pra tomar posição defendida.
const VANTAGEM_DEFENSOR = 1.6;

export function resolverAtaqueAoEstado(estado, idEstado, forcaAtacante) {
  // A defesa REAL: guarnição concreta se o estado for seu/tomado, ou a fatia sintetizada
  // do país-dono (NPC) se não for. Antes lia só o mapa do jogador — e todo estado inimigo
  // defendia com ZERO, então invadir era de graça. Este é o combate que faltava ao alvo.
  const bruta = guarnicaoDefensiva(estado, idEstado);
  const defesa = Math.round(bruta * VANTAGEM_DEFENSOR * 100) / 100;
  const ataque = Math.round((forcaAtacante || 0) * 100) / 100;
  const segurou = defesa >= ataque;
  // A margem decide o estrago: vitória apertada machuca os dois, goleada quase não.
  const razao = defesa > 0 ? ataque / defesa : 99;
  const perdaDefensor = clamp(segurou ? razao * 0.45 : 0.75, 0, 0.9);
  const perdaAtacante = clamp(segurou ? 0.55 / Math.max(0.35, razao) : 0.25, 0, 0.9);
  return {
    idEstado,
    nome: PORID.get(idEstado)?.nome || idEstado,
    defesa, ataque, segurou,
    perdaDefensor: Math.round(perdaDefensor * 100),
    perdaAtacante: Math.round(perdaAtacante * 100),
  };
}

// Aplica o resultado: dizima a guarnição e, se caiu, troca o dono.
export function aplicarAtaqueAoEstado(estado, res, isoAtacante) {
  const g = { ...(estado.guarnicoes?.[res.idEstado] || {}) };
  for (const u of Object.keys(g)) {
    g[u] = Math.floor(g[u] * (1 - res.perdaDefensor / 100));
    if (!g[u]) delete g[u];
  }
  if (Object.keys(g).length) estado.guarnicoes[res.idEstado] = g;
  else delete estado.guarnicoes?.[res.idEstado];

  if (!res.segurou) {
    estado.donoEstado = estado.donoEstado || {};
    estado.donoEstado[res.idEstado] = isoAtacante;
    // Quem perde território perde também o que estava guardado nele.
    delete estado.guarnicoes?.[res.idEstado];
  }
  return res;
}

// ── DISTRIBUIÇÃO INICIAL ──────────────────────────────────────────────
// Nenhum país deixa o exército inteiro num pátio. Espalhamos parte das forças
// pelos estados no começo da partida, com peso na capital — que é o que todo
// Estado-maior do mundo faz. O resto fica no quartel central pra o jogador
// posicionar como quiser.
export function semearGuarnicoes(estado, { fracao = 0.55 } = {}) {
  if (estado.guarnicoes && Object.keys(estado.guarnicoes).length) return;
  const eu = estado.iso || 'USA';
  const meus = estadosDe(eu);
  if (!meus.length) return;
  estado.guarnicoes = {};

  // A capital e os grandes centros pesam mais — distribuição por população real
  // (pesoImportancia), não mais o proxy "primeiro estado da lista".
  const pesos = meus.map((e) => ({ e, peso: pesoImportancia(e) }));
  const soma = pesos.reduce((a, x) => a + x.peso, 0) || 1;

  for (const [u, total] of Object.entries(estado.forcas || {})) {
    if (u === 'ogivas') continue;                 // ogiva não é guarnição
    const espalhar = Math.floor((total || 0) * fracao);
    if (espalhar <= 0) continue;
    for (const { e, peso } of pesos) {
      const q = Math.floor(espalhar * (peso / soma));
      if (q <= 0) continue;
      estado.guarnicoes[e.id] = estado.guarnicoes[e.id] || {};
      estado.guarnicoes[e.id][u] = q;
    }
  }
}

// ── DISTRIBUIÇÃO AUTOMÁTICA ────────────────────────────────────────────
// O pedido: "não quero designar tropa estado por estado na mão". Isto pega TODA a
// reserva do quartel (tropaLivre) e espalha pelos seus estados segundo uma doutrina:
//   • uniforme  → todo estado igual (cobertura ampla)
//   • capital   → concentra na capital e no coração do país
//   • fronteira → mais tropa perto de quem você está em guerra (defesa de verdade)
// Retorna quanto moveu e pra quantos estados — pra UI mostrar o resultado.
export function distribuirAuto(estado, { modo = 'fronteira', ondeEsta = null, frotasInimigas = null, conflitos = null } = {}) {
  const eu = estado.iso || 'USA';
  const meus = estadosDe(eu);
  if (!meus.length) return { ok: false, motivo: 'Este país não tem estados mapeados.' };
  const livre = tropaLivre(estado);
  const totalLivre = Object.entries(livre).reduce((a, [u, q]) => a + (u === 'ogivas' ? 0 : (q || 0)), 0);
  if (totalLivre <= 0) return { ok: false, motivo: 'Não há tropa em reserva no quartel para distribuir.' };

  const inimigos = ((estado.emGuerra || []).map((iso) => ondeEsta?.(iso)).filter(Boolean));
  // Fontes de AMEAÇA pro contra-ataque: países em guerra, frotas hostis no mar e os
  // estados que JÁ estão sob pressão (conflitosEstado). O modo 'counter' empilha tropa
  // onde a facada está vindo — é o "descobrir por onde vêm e concentrar lá".
  const frotasHostis = frotasInimigas || estado.frotasInimigas || [];
  const conf = conflitos || estado.conflitosEstado || {};
  const pesos = meus.map((e) => {
    let w = 1;
    if (modo === 'capital') w = pesoImportancia(e);           // concentra na capital e nos grandes centros
    else if (modo === 'fronteira') {
      if (inimigos.length) {
        const d = Math.min(...inimigos.map((en) => Math.hypot(e.lat - en.lat, e.lng - en.lng)));
        w = 1 / (1 + d / 18);                                 // mais perto do inimigo, mais peso
      } else { w = pesoImportancia(e); }                      // sem guerra: doutrina de capital/população
    } else if (modo === 'counter') {
      // 1) estado sob pressão AGORA pesa muito (a linha que está sangrando)
      const pressao = conf[e.id]?.intensidade || 0;
      w = 1 + pressao / 12;
      // 2) proximidade de país em guerra (por onde a invasão terrestre vem)
      if (inimigos.length) {
        const dTerra = Math.min(...inimigos.map((en) => Math.hypot(e.lat - en.lat, e.lng - en.lng)));
        w += 3 / (1 + dTerra / 14);
      }
      // 3) proximidade de frota hostil no mar (por onde o desembarque vem)
      if (frotasHostis.length) {
        const dMar = Math.min(...frotasHostis.map((f) => Math.hypot(e.lat - f.lat, (e.lng - f.lng) * 0.7)));
        if (dMar <= 22) w += 2.4 / (1 + dMar / 10);           // só litoral ameaçado, decai rápido
      }
    }
    return { e, w };
  });
  const somaW = pesos.reduce((a, x) => a + x.w, 0) || 1;

  estado.guarnicoes = estado.guarnicoes || {};
  const movido = {};
  let alcancou = new Set();
  for (const [u, q] of Object.entries(livre)) {
    if (u === 'ogivas' || (q || 0) <= 0) continue;
    let resto = q;
    for (const { e, w } of pesos) {
      const n = Math.floor(q * (w / somaW));
      if (n <= 0) continue;
      estado.guarnicoes[e.id] = estado.guarnicoes[e.id] || {};
      estado.guarnicoes[e.id][u] = (estado.guarnicoes[e.id][u] || 0) + n;
      resto -= n; movido[u] = (movido[u] || 0) + n; alcancou.add(e.id);
    }
    if (resto > 0) {                                          // sobra vai pro estado de maior peso
      const top = pesos.reduce((a, b) => (b.w > a.w ? b : a)).e;
      estado.guarnicoes[top.id] = estado.guarnicoes[top.id] || {};
      estado.guarnicoes[top.id][u] = (estado.guarnicoes[top.id][u] || 0) + resto;
      movido[u] = (movido[u] || 0) + resto; alcancou.add(top.id);
    }
  }
  return { ok: true, modo, estados: alcancou.size, movido };
}
