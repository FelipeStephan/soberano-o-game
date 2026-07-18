// ═══════════════════════════════════════════════════════════════════════
// DESPACHOS DE GUERRA — a IA escreve a cobertura ao vivo do ataque
// ═══════════════════════════════════════════════════════════════════════
// ── A DECISÃO DE ARQUITETURA QUE IMPORTA AQUI ────────────────────────
// A cena do ataque dura ~60 segundos e mostra 8-10 despachos. O caminho ingênuo seria
// pedir um despacho à IA a cada 6 segundos. Isso seria um desastre:
//   • 10 chamadas de rede = 10 chances de latência travar a cena no meio;
//   • cada chamada custa tokens e paga o system prompt de novo;
//   • a IA não veria os despachos anteriores, e repetiria a si mesma.
//
// Então: **UMA chamada, no segundo zero, que devolve o LOTE inteiro.** A cena então
// consome esse array no seu próprio ritmo, sem tocar na rede de novo. Se a IA demorar,
// o fallback local já está rodando — o jogador nunca vê tela parada.
//
// É o mesmo princípio de prompt caching que o resto da maquina/ usa: pagar uma vez,
// consumir muitas.
import { chamarIA } from './openrouter.js';
import { extrairJSON } from './contrato.js';
import { PETROLEO } from '../dados/petroleo.js';
import { UNIDADE_POR_ID } from '../dados/forcas.js';
import { rand } from '../jogo/rng.js';

const sorteioDe = (a) => a[Math.floor(rand() * a.length)];

// ── ALVOS REAIS ───────────────────────────────────────────────────────
// Um despacho que diz "a capital foi atingida" é genérico. Um que diz "Zhongnanhai
// está sob ataque" é o jogo inteiro. A IA recebe esta tabela pra não inventar
// geografia — e o fallback local usa a mesma.
export const ALVOS = {
  USA: { capital: 'Washington', sede: 'o Pentágono', simbolo: 'a Casa Branca', porto: 'Norfolk', cidade: 'Nova York' },
  CHN: { capital: 'Pequim', sede: 'Zhongnanhai', simbolo: 'a Praça Tiananmen', porto: 'Xangai', cidade: 'Shenzhen' },
  RUS: { capital: 'Moscou', sede: 'o Kremlin', simbolo: 'a Praça Vermelha', porto: 'Sebastopol', cidade: 'São Petersburgo' },
  BRA: { capital: 'Brasília', sede: 'o Planalto', simbolo: 'o Congresso', porto: 'Santos', cidade: 'Rio de Janeiro' },
  IND: { capital: 'Nova Délhi', sede: 'o Rashtrapati Bhavan', simbolo: 'o Portal da Índia', porto: 'Mumbai', cidade: 'Bangalore' },
  DEU: { capital: 'Berlim', sede: 'a Chancelaria', simbolo: 'o Portão de Brandemburgo', porto: 'Hamburgo', cidade: 'Munique' },
  FRA: { capital: 'Paris', sede: 'o Eliseu', simbolo: 'a Torre Eiffel', porto: 'Marselha', cidade: 'Lyon' },
  GBR: { capital: 'Londres', sede: 'Downing Street', simbolo: 'Westminster', porto: 'Portsmouth', cidade: 'Manchester' },
  JPN: { capital: 'Tóquio', sede: 'o Kantei', simbolo: 'o Palácio Imperial', porto: 'Yokosuka', cidade: 'Osaka' },
  KOR: { capital: 'Seul', sede: 'o Gabinete Presidencial', simbolo: 'o Gyeongbokgung', porto: 'Busan', cidade: 'Incheon' },
  PRK: { capital: 'Pyongyang', sede: 'a Sede do Partido', simbolo: 'a Praça Kim Il-sung', porto: 'Nampo', cidade: 'Hamhung' },
  IRN: { capital: 'Teerã', sede: 'o gabinete do Líder Supremo', simbolo: 'a Torre Azadi', porto: 'Bandar Abbas', cidade: 'Isfahan' },
  ISR: { capital: 'Jerusalém', sede: 'a Kirya', simbolo: 'o Knesset', porto: 'Haifa', cidade: 'Tel Aviv' },
  SAU: { capital: 'Riade', sede: 'o Palácio Real', simbolo: 'a Torre do Reino', porto: 'Jidá', cidade: 'Dammam' },
  TUR: { capital: 'Ancara', sede: 'o Complexo Presidencial', simbolo: 'o Mausoléu de Atatürk', porto: 'Izmir', cidade: 'Istambul' },
  EGY: { capital: 'Cairo', sede: 'o Palácio de Heliópolis', simbolo: 'a Praça Tahrir', porto: 'Alexandria', cidade: 'Port Said' },
  UKR: { capital: 'Kiev', sede: 'o Bankova', simbolo: 'a Praça Maidan', porto: 'Odessa', cidade: 'Lviv' },
  PAK: { capital: 'Islamabad', sede: 'o QG em Rawalpindi', simbolo: 'a Mesquita Faisal', porto: 'Karachi', cidade: 'Lahore' },
  VEN: { capital: 'Caracas', sede: 'o Palácio de Miraflores', simbolo: 'o Panteão Nacional', porto: 'La Guaira', cidade: 'Maracaibo' },
  IDN: { capital: 'Jacarta', sede: 'o Palácio Merdeka', simbolo: 'o Monumento Nacional', porto: 'Surabaya', cidade: 'Bandung' },
  MEX: { capital: 'Cidade do México', sede: 'o Palácio Nacional', simbolo: 'o Zócalo', porto: 'Veracruz', cidade: 'Monterrey' },
  TWN: { capital: 'Taipé', sede: 'o Gabinete Presidencial', simbolo: 'o Taipei 101', porto: 'Kaohsiung', cidade: 'Taichung' },
};

export function alvosDe(iso, nome) {
  return ALVOS[iso] || {
    capital: `a capital de ${nome}`, sede: 'o palácio de governo', simbolo: 'a praça central',
    porto: 'o porto principal', cidade: 'a segunda maior cidade',
  };
}

// ── REAÇÕES DO MUNDO ─────────────────────────────────────────────────
// Um ataque não acontece no vácuo: os aliados do alvo reagem EM CENA, cada um com
// um balão saindo do próprio território. Fallback local por postura; a IA, quando
// ligada, escreve tudo no MESMO lote dos despachos (uma chamada só — ver topo).
const REACOES_POOL = {
  condena: [
    (n, alvo) => `${n} convoca o embaixador e fala em "agressão imperdoável contra ${alvo}".`,
    (n) => `${n} coloca as forças armadas em prontidão máxima. "Não assistiremos calados."`,
    (n, alvo) => `${n} anuncia ponte aérea de suprimentos para ${alvo}. O recado é pro atacante.`,
    (n) => `${n} fecha o espaço aéreo para aeronaves do agressor, efeito imediato.`,
  ],
  observa: [
    (n) => `${n} pede "contenção de ambos os lados" — a frase de quem não vai fazer nada.`,
    (n) => `${n} convoca reunião de emergência do gabinete. Nenhuma decisão anunciada.`,
    (n) => `Bolsas de ${n} despencam na abertura. O dinheiro entendeu antes dos diplomatas.`,
  ],
  aproveita: [
    (n) => `${n} declara "profunda preocupação" — e ninguém no plenário segurou o sorriso.`,
    (n) => `${n} aproveita o vácuo e move tropas na própria fronteira. Ninguém está olhando.`,
  ],
};

export function reacoesLocais(reagentes) {
  const rand2 = (a) => a[Math.floor(rand() * a.length)];
  return (reagentes || []).map((r) => ({
    iso: r.iso,
    tom: r.postura === 'condena' ? 'ruim' : r.postura === 'aproveita' ? 'neutro' : 'aviso',
    txt: rand2(REACOES_POOL[r.postura] || REACOES_POOL.observa)(r.nome, r.alvoNome || 'o alvo'),
  }));
}

// ── O PROMPT ──────────────────────────────────────────────────────────
function montarPrompt({ atacante, alvoIso, alvoNome, deploy, venceu, presidente, reagentes }) {
  const A = alvosDe(alvoIso, alvoNome);
  const forca = Object.entries(deploy || {})
    .filter(([, q]) => q > 0)
    .map(([id, q]) => `${q.toLocaleString('pt-BR')} ${UNIDADE_POR_ID[id]?.nome || id}`)
    .join(', ');
  const petro = PETROLEO[alvoIso];

  return `Você é a cobertura ao vivo de uma ofensiva militar no jogo SOBERANO.

A OPERAÇÃO:
  Atacante: ${atacante} (chefe de Estado: ${presidente})
  Alvo: ${alvoNome}
  Força enviada: ${forca || 'força mista'}
  Desfecho já decidido: ${venceu ? 'o atacante VENCE' : 'o atacante FRACASSA'}

GEOGRAFIA REAL DO ALVO (use estes nomes, não invente):
  capital: ${A.capital} · sede do governo: ${A.sede} · símbolo nacional: ${A.simbolo}
  porto principal: ${A.porto} · segunda cidade: ${A.cidade}
${petro ? `  petróleo: ${petro.producao} Mb/d, ${petro.reservas} bi de barris em reservas` : '  sem petróleo relevante'}

PAÍSES REAGINDO (aliados/vizinhos do alvo — escreva 1 reação curta pra cada):
${(reagentes || []).map((r) => `  ${r.iso} · ${r.nome} · postura: ${r.postura}`).join('\n') || '  (nenhum)'}

ESCREVA 9 DESPACHOS em ordem cronológica, cobrindo o ataque do primeiro radar ao desfecho.

REGRAS DURAS:
1. Cada despacho tem NO MÁXIMO 130 caracteres. É um alerta de tela, não um parágrafo.
2. Escreva CRU, adulto, +18. Podem ser secos, cínicos, brutais. Nada de frase de criança.
3. Use a geografia REAL acima. "${A.sede} está em chamas" > "a capital foi atingida".
4. Seja concreto e sensorial: o que se vê, o que se ouve, quem morre, o que para de funcionar.
5. NÃO faça piada com civis mortos, fome ou refugiado. O cinismo é com GOVERNOS e generais.
6. Progressão obrigatória: detecção → primeiro impacto → combate → consequência civil/econômica → desfecho.
7. Varie o ângulo: radar militar, transmissão estatal, rede social, mercado financeiro, um soldado.

Responda SÓ com JSON, sem cercas:
{"despachos":[{"tom":"aviso|ruim|neutro|bom","txt":"..."}],
 "reacoes":[{"iso":"<ISO do país>","tom":"ruim|aviso|neutro","txt":"<reação em até 130 chars>"}]}

tom: "ruim" = destruição/morte · "aviso" = tensão/ameaça · "neutro" = observação fria · "bom" = vitória do atacante.`;
}

// ── A CHAMADA (uma só) ────────────────────────────────────────────────
// Devolve array de {tom, txt}. Nunca lança: se falhar, quem chama usa o fallback.
export async function gerarDespachos(ctx, { signal } = {}) {
  try {
    const r = await chamarIA({
      system: 'Você escreve cobertura de guerra para um jogo. Responde SÓ com JSON válido.',
      user: montarPrompt(ctx),
      temperature: 1,
      signal,
    });
    const j = extrairJSON(r?.texto);
    const limpa = (arr) => (Array.isArray(arr) ? arr : [])
      .map((d) => ({
        iso: d?.iso ? String(d.iso) : null,
        tom: ['aviso', 'ruim', 'neutro', 'bom'].includes(d?.tom) ? d.tom : 'neutro',
        txt: String(d?.txt || '').trim().slice(0, 150),
      }))
      .filter((d) => d.txt.length > 8);
    const despachos = limpa(j?.despachos);
    const reacoes = limpa(j?.reacoes).filter((r2) => r2.iso);
    return despachos.length >= 4 ? { despachos, reacoes } : null;
  } catch {
    return null;
  }
}

// ── FALLBACK LOCAL ────────────────────────────────────────────────────
// Roda quando a IA está desligada, falha ou demora. Usa a MESMA tabela de alvos
// reais, então mesmo sem IA o texto cita Isfahan e o Planalto — não "a capital".
export function despachosLocais({ alvoIso, alvoNome, deploy, venceu, petro }) {
  const A = alvosDe(alvoIso, alvoNome);
  const d = [];
  const tem = (k) => (deploy?.[k] || 0) > 0;
  const q = (k) => (deploy?.[k] || 0).toLocaleString('pt-BR');

  d.push({ tom: 'aviso', txt: `Radares de ${alvoNome} detectaram a formação. As sirenes começaram.` });

  if (tem('misseis')) {
    d.push({ tom: 'ruim', txt: sorteioDe([
      `${q('misseis')} mísseis cruzam a fronteira. A defesa antiaérea abre fogo.`,
      `Primeira salva atinge ${A.sede}. A transmissão estatal saiu do ar no meio da frase.`,
      `Os mísseis passaram sob o radar. ${A.capital} descobriu quando as janelas explodiram.`,
    ]) });
  }
  if (tem('bombardeiros')) {
    d.push({ tom: 'ruim', txt: sorteioDe([
      `Bombardeiros sobre ${A.capital}. O que está embaixo deixa de existir em ondas.`,
      `${q('bombardeiros')} bombardeiros despejam carga sobre a infraestrutura de ${A.cidade}.`,
    ]) });
  }
  if (tem('cacas')) {
    d.push({ tom: 'aviso', txt: sorteioDe([
      `${q('cacas')} caças em combate aéreo sobre ${A.cidade}. Eles decolaram o que tinham.`,
      `Superioridade aérea contestada. Caem aviões dos dois lados sobre ${A.capital}.`,
    ]) });
  }
  if (tem('navios') || tem('porta_avioes')) {
    d.push({ tom: 'aviso', txt: sorteioDe([
      `Nossa frota bloqueia ${A.porto}. Nenhum cargueiro entra ou sai.`,
      `Grupo de batalha ao largo de ${A.porto}. Os cruzeiro começaram a sair dos tubos.`,
    ]) });
  }
  if (tem('submarinos')) {
    d.push({ tom: 'neutro', txt: 'Submarinos em posição. Ninguém sabe onde estão — inclusive nós, oficialmente.' });
  }
  if (tem('blindados') || tem('infantaria')) {
    d.push({ tom: 'ruim', txt: sorteioDe([
      `${q('blindados')} blindados cruzaram a fronteira. Acabou a conversa de operação limitada.`,
      `${q('infantaria')} soldados em solo estrangeiro. A partir daqui, cada dia custa caixões.`,
      `Coluna blindada a 40 km de ${A.capital}. A resistência é maior do que previmos.`,
    ]) });
  }
  if (tem('drones')) {
    d.push({ tom: 'neutro', txt: 'Enxame de drones satura a defesa. Cada interceptador deles custa cem vezes o alvo.' });
  }
  if (petro) {
    d.push({ tom: 'aviso', txt: `O Brent disparou. ${alvoNome} bombeia ${petro.producao} Mb/d e o mercado precificou o risco.` });
  }
  d.push({ tom: 'neutro', txt: sorteioDe([
    `${A.simbolo} está cercado de gente tentando sair da cidade.`,
    `A ONU convocou sessão de emergência. Vai durar seis horas e não decidir nada.`,
    `As redes de ${alvoNome} viraram um mural de gente procurando parente.`,
  ]) });
  d.push({ tom: venceu ? 'bom' : 'ruim', txt: venceu
    ? `A resistência de ${alvoNome} colapsou. Pedem cessar-fogo pelo canal suíço.`
    : `Nossa ofensiva perdeu o ímpeto. ${alvoNome} está contra-atacando.` });

  return d;
}
