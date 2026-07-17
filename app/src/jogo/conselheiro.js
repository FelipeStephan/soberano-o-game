// ═══════════════════════════════════════════════════════════════════════
// O CONSELHEIRO — o chefe de gabinete que lê a mesa e recomenda a jogada
// ═══════════════════════════════════════════════════════════════════════
// A Máquina é árbitra e adversária: ela GERA a crise. O Conselheiro é o oposto —
// está do SEU lado. Ele olha o estado atual (indicador sangrando, guerra aberta,
// caixa parado, oportunidade madura) e sugere 2 a 4 movimentos, cada um com o
// "porque" na frente. Quando um conselho casa com uma ação REAL do catálogo, ele
// devolve o id — e a UI vira aquilo num botão de enfileirar. Sem a ação, é conselho
// estratégico livre.
//
// Dois cérebros, mesma saída:
//   • gerarConselho() pergunta se a IA está viva. Se está, ela escreve a leitura e as
//     sugestões (mais rica, mais surpreendente). Se não está (modo demonstração, sem
//     chave), cai em conselhoLocal() — heurística determinística que NUNCA quebra a
//     tela. É o mesmo princípio de maquina/fallback.js: degradar é aceitável; sumir, não.
//
// Formato normalizado (contrato com a UI):
//   { leitura: string, sugestoes: [{ titulo, porque, acaoId?, urgencia }], fonte: 'ia'|'local' }
import { chamarIA, iaLigada } from '../maquina/openrouter.js';
import { extrairJSON } from '../maquina/contrato.js';
import { ACAO_POR_ID, ACOES } from '../dados/acoes.js';
import { estaDesbloqueada } from './desbloqueios.js';
import { nomeDeRelacao, comPais } from '../dados/paises.js';
import { MEDIDORES, CAPACIDADES } from './vars.js';

const URGENCIAS = ['alta', 'media', 'baixa'];
const pct = (n) => Math.round(Number(n) || 0);

// ── Leitura do estado: onde dói, onde sobra ────────────────────────────
// O rival não é constante — é quem está pior comigo AGORA (mesmo princípio do
// fallback). O parceiro é quem está melhor. Servem de gancho pra diplomacia.
function lerRelacoes(estado) {
  const pares = Object.entries(estado || {})
    .filter(([k, v]) => k.startsWith('rel_') && typeof v === 'number')
    .map(([k, v]) => ({ chave: k, nome: nomeDeRelacao(k), valor: v }));
  if (!pares.length) return { rival: null, parceiro: null };
  const ord = [...pares].sort((a, b) => a.valor - b.valor);
  return { rival: ord[0], parceiro: ord[ord.length - 1] };
}

// O medidor mais fraco entre os que importam pra opinião/força. É o coração do
// diagnóstico: drama de governo é sempre o buraco que você fingiu não ver.
function medidorMaisFraco(estado) {
  const cand = MEDIDORES
    .filter((k) => k !== 'temp_guerra') // temp_guerra ALTA é ruim; invertido, tratamos à parte
    .map((k) => ({ chave: k, valor: Number(estado[k] ?? 50) }))
    .sort((a, b) => a.valor - b.valor);
  return cand[0];
}

// Uma ação do catálogo serve de sugestão só se existe, está desbloqueada e cabe no
// caixa (ou é de graça). Sem isso o Conselheiro recomendaria comprar porta-aviões
// com o cofre vazio — conselho que não vira jogada é ruído.
function acaoViavel(id, estado) {
  const a = ACAO_POR_ID[id];
  if (!a) return null;
  if (!estaDesbloqueada(a, estado)) return null;
  if ((a.custo || 0) > (estado.tesouro || 0) + 0.001) return null;
  return a;
}
// Primeira ação viável de uma lista de preferências (da melhor pra pior).
function primeiraViavel(ids, estado) {
  for (const id of ids) { const a = acaoViavel(id, estado); if (a) return a; }
  return null;
}

// ── O PROMPT (quando a IA está viva) ───────────────────────────────────
export function montarPromptConselho(estado, ctx = {}) {
  const { ficha = {}, imprensa = [], acoesDisponiveis = [] } = ctx;
  const { rival, parceiro } = lerRelacoes(estado);

  const linha = (ks) => ks.map((k) => `${k}=${pct(estado[k])}`).join(', ');
  const emGuerra = (estado.emGuerra || []).length
    ? estado.emGuerra.join(', ')
    : '(nenhuma guerra aberta)';
  const catalogo = acoesDisponiveis.length
    ? acoesDisponiveis.map((a) => `${a.id} — ${a.nome} [${a.categoria}]`).join('\n  ')
    : '(sem catálogo)';

  const system = `Você é O CONSELHEIRO — o chefe de gabinete do líder de ${ficha.pais || 'uma nação'} no jogo SOBERANO.
Você NÃO é a Máquina: você está do lado do jogador. Sua função é ler a situação de governo
e recomendar de 2 a 4 movimentos concretos para o próximo turno, cada um com uma justificativa curta e afiada.

# TOM
Fale como um estrategista veterano e leal: direto, adulto, sem rodeio nem papo de manual.
Uma frase sua pesa. Português brasileiro. Público 16+: pode ser cru, nunca infantil.

# COMO PENSAR
- Priorize o que está SANGRANDO: o indicador mais fraco, a guerra aberta, o caixa parado ou vazio.
- Cada sugestão tem um "porque" que conecta a recomendação ao número real do estado.
- Quando um movimento corresponder a uma AÇÃO DO CATÁLOGO abaixo, devolva o "acaoId" EXATO dela
  (assim o jogador enfileira com um clique). Se for conselho estratégico sem ação no catálogo, omita "acaoId".
- "urgencia": 'alta' (apaga incêndio agora), 'media' (importante, não emergência), 'baixa' (aposta de longo prazo).

# AÇÕES DISPONÍVEIS (use o id EXATO no campo acaoId)
  ${catalogo}

# SAÍDA (JSON estrito, sem markdown, sem texto fora do objeto)
{
  "leitura": "<1 parágrafo lendo o cenário atual como um briefing de gabinete>",
  "sugestoes": [
    { "titulo": "<movimento curto e imperativo>", "porque": "<1-2 frases: por que agora, ancorado no estado>",
      "acaoId": "<id do catálogo, se casar; senão omita>", "urgencia": "alta|media|baixa" }
  ]
}`;

  const user = `SITUAÇÃO DO GOVERNO — turno ${estado.turno ?? '?'}
Medidores: ${linha(MEDIDORES)}
Capacidades: ${linha(CAPACIDADES)}
Caixa (Tesouro, US$ tri): ${(estado.tesouro || 0).toFixed(2)} · PIB: ${(estado.pib || 0).toFixed(1)} · Pontos de Ação disponíveis: ${estado.pontos_acao ?? 0}
Guerras abertas: ${emGuerra}
Ogivas: ${estado.ogivas ?? 0} · Territórios: ${estado.territorio ?? 1}
Pior relação: ${rival ? `${rival.nome} (${pct(rival.valor)})` : '—'} · Melhor relação: ${parceiro ? `${parceiro.nome} (${pct(parceiro.valor)})` : '—'}
Como a imprensa te trata: ${(imprensa || []).map((i) => `${i.nome}: ${i.tom}`).join(' · ') || '(sem dados)'}

Leia esta mesa e me dê de 2 a 4 recomendações para o próximo turno. Só o JSON.`;

  return { system, user };
}

// ── O FALLBACK LOCAL (quando não há IA) ────────────────────────────────
// Heurística: acha o buraco mais fundo, olha guerra e caixa, e monta conselhos
// referenciando ações reais quando casam. Determinístico, jogável, sem rede.
export function conselhoLocal(estado = {}) {
  const s = [];
  const { rival, parceiro } = lerRelacoes(estado);
  const tesouro = Number(estado.tesouro || 0);
  const emGuerra = (estado.emGuerra || []).filter(Boolean);
  const fraco = medidorMaisFraco(estado);

  // 1) GUERRA ABERTA — some acima de tudo.
  if (emGuerra.length) {
    const reforco = primeiraViavel(['inv_militar', 'mobilizar', 'blindados', 'inf'], estado);
    s.push({
      peso: 100, urgencia: 'alta',
      titulo: reforco ? 'Reforçar a linha antes que ela ceda' : 'Segurar a frente e buscar saída',
      porque: `Você tem ${emGuerra.length} guerra(s) aberta(s) e Poder Militar em ${pct(estado.poder_militar)}. Ferro na mesa agora decide se isso vira vitória ou atoleiro — hesitar é escolher o atoleiro.`,
      acaoId: reforco?.id,
    });
  }

  // 2) O INDICADOR QUE SANGRA — o buraco mais fundo puxa a recomendação.
  if (fraco && fraco.valor < 45) {
    const mapa = {
      aprovacao: { ids: ['inv_midia', 'publicidade', 'subsidio'], txt: `Aprovação em ${pct(fraco.valor)} é o chão tremendo sob seus pés. Sem povo, todo o resto é fachada — recupere a rua antes que ela recupere você.` },
      estabilidade: { ids: ['subsidio', 'propaganda'], txt: `Estabilidade em ${pct(fraco.valor)}: o país range nas juntas. Comprar paz social agora é mais barato que reprimir revolta depois.` },
      seguranca: { ids: ['inv_intel', 'satelite', 'submarino'], txt: `Segurança em ${pct(fraco.valor)} deixa portas abertas que inimigo nenhum vai educadamente ignorar. Feche-as antes que alguém entre.` },
      soft_power: { ids: ['cupula', 'ajuda'], txt: `Soft Power em ${pct(fraco.valor)}: ninguém te ouve na mesa grande. Prestígio se constrói antes da crise, não durante.` },
      temp_economia: { ids: ['imposto_down', 'reforma'], txt: `Confiança econômica em ${pct(fraco.valor)} espanta investimento e emprego. O mercado precisa de um sinal de que você tem plano.` },
      liberdades: { ids: ['universidades'], txt: `Liberdades em ${pct(fraco.valor)}: cada ponto a menos é lenha para o próximo protesto e munição para a imprensa hostil.` },
      poder_militar: { ids: ['inv_militar', 'cacas', 'inf'], txt: `Poder Militar em ${pct(fraco.valor)} convida agressão. No tabuleiro, fraqueza percebida é fraqueza real.` },
    };
    const r = mapa[fraco.chave];
    if (r) {
      const a = primeiraViavel(r.ids, estado);
      s.push({
        peso: 80 + (45 - fraco.valor),
        urgencia: fraco.valor < 30 ? 'alta' : 'media',
        titulo: a ? `Estancar a queda: ${a.nome}` : `Atacar o ponto fraco: ${fraco.chave}`,
        porque: r.txt, acaoId: a?.id,
      });
    }
  }

  // 3) O CAIXA — dinheiro parado é oportunidade perdida; cofre vazio, emergência.
  if (tesouro >= 1.5) {
    const a = primeiraViavel(['inv_economia', 'infra', 'inv_ciencia', 'inv_militar'], estado);
    s.push({
      peso: 55, urgencia: 'media',
      titulo: a ? `Pôr o caixa para trabalhar: ${a.nome}` : 'Investir o caixa acumulado',
      porque: `Você senta em US$ ${tesouro.toFixed(2)} tri parados no cofre. Dinheiro que não vira poder, PIB ou influência é só um número esperando a próxima crise engolir.`,
      acaoId: a?.id,
    });
  } else if (tesouro < 0.25) {
    const a = primeiraViavel(['divida', 'imposto_up'], estado);
    s.push({
      peso: 70, urgencia: 'alta',
      titulo: a ? `Levantar caixa: ${a.nome}` : 'Recompor o cofre',
      porque: `O Tesouro está em US$ ${tesouro.toFixed(2)} tri — perto do osso. Governo sem caixa não decide nada; ele reage e apanha. Encha o cofre antes de precisar dele.`,
      acaoId: a?.id,
    });
  }

  // 4) DIPLOMACIA — se há um rival perigoso, avise; se há parceiro maduro, aproveite.
  if (rival && rival.valor <= -25) {
    const a = primeiraViavel(['cupula', 'sancoes', 'espionar'], estado);
    s.push({
      peso: 50, urgencia: 'media',
      titulo: `Administrar a tensão ${comPais(rival.nome)}`,
      porque: `Sua relação com ${rival.nome} está em ${pct(rival.valor)} — o território onde erro de cálculo vira estopim. Decida se corteja ou pressiona, mas não deixe apodrecer no escuro.`,
      acaoId: a?.id,
    });
  } else if (parceiro && parceiro.valor >= 40 && s.length < 3) {
    const a = primeiraViavel(['bloco', 'cupula', 'ajuda'], estado);
    s.push({
      peso: 30, urgencia: 'baixa',
      titulo: `Colher a amizade ${comPais(parceiro.nome)}`,
      porque: `${parceiro.nome} está em ${pct(parceiro.valor)} com você — aliança madura raramente fica de graça duas vezes. Transforme boa vontade em vantagem concreta enquanto dura.`,
      acaoId: a?.id,
    });
  }

  // Ordena por severidade, corta em 4, garante mínimo de 2 com uma rede de segurança.
  s.sort((a, b) => b.peso - a.peso);
  let escolhidas = s.slice(0, 4);
  if (escolhidas.length < 2) {
    const a = primeiraViavel(['inv_economia', 'inv_midia', 'inv_intel'], estado);
    escolhidas.push({
      urgencia: 'baixa',
      titulo: a ? `Consolidar a base: ${a.nome}` : 'Consolidar a base',
      porque: 'Sem incêndio à vista, o movimento certo é acumular vantagem: quem cresce na calmaria dita o ritmo da próxima tempestade.',
      acaoId: a?.id,
    });
  }

  const leitura = montarLeituraLocal(estado, { fraco, emGuerra, tesouro, rival });
  return {
    leitura,
    sugestoes: escolhidas.map(({ peso, ...rest }) => rest),
    fonte: 'local',
  };
}

// Um parágrafo de briefing montado do estado — sem IA, mas com voz.
function montarLeituraLocal(estado, { fraco, emGuerra, tesouro, rival }) {
  const partes = [];
  if (emGuerra.length) partes.push(`Há sangue no tabuleiro: ${emGuerra.length} conflito(s) aberto(s) consumindo sua atenção e seu caixa.`);
  if (fraco && fraco.valor < 45) partes.push(`O ponto que mais ameaça o reinado é ${rotuloDe(fraco.chave)}, em ${pct(fraco.valor)} — é por aí que a próxima crise vai entrar.`);
  if (tesouro >= 1.5) partes.push(`Do lado bom, o cofre tem fôlego (US$ ${tesouro.toFixed(2)} tri): há munição para agir, se você tiver a coragem de gastá-la.`);
  else if (tesouro < 0.25) partes.push(`E o cofre está raspando o fundo (US$ ${tesouro.toFixed(2)} tri): cada decisão vem com etiqueta de preço.`);
  if (rival && rival.valor <= -25) partes.push(`${rival.nome} segue sendo a pedra no seu sapato diplomático, em ${pct(rival.valor)}.`);
  if (!partes.length) partes.push('A mesa está estranhamente calma. Nenhum incêndio grita mais alto — o que significa que este é o turno de plantar o que você vai colher sob pressão.');
  return partes.join(' ');
}

function rotuloDe(chave) {
  const a = { aprovacao: 'a Aprovação', estabilidade: 'a Estabilidade', seguranca: 'a Segurança',
    soft_power: 'o Soft Power', temp_economia: 'a Confiança Econômica', liberdades: 'as Liberdades',
    poder_militar: 'o Poder Militar' };
  return a[chave] || chave;
}

// ── Normalização: a IA é criativa, mas a UI precisa de forma fixa ──────
function normalizar(bruto, fonte) {
  const leitura = typeof bruto?.leitura === 'string' && bruto.leitura.trim()
    ? bruto.leitura.trim()
    : 'O gabinete revisou os números e destacou os movimentos abaixo para o próximo turno.';
  const lista = Array.isArray(bruto?.sugestoes) ? bruto.sugestoes : [];
  const sugestoes = lista.slice(0, 4).map((x) => {
    const acaoId = x?.acaoId && ACAO_POR_ID[x.acaoId] ? x.acaoId : undefined;
    const urgencia = URGENCIAS.includes(x?.urgencia) ? x.urgencia : 'media';
    return {
      titulo: String(x?.titulo || 'Recomendação').trim(),
      porque: String(x?.porque || '').trim(),
      acaoId,
      urgencia,
    };
  }).filter((x) => x.titulo);
  if (!sugestoes.length) return null; // saída vazia → deixa o chamador cair no local
  return { leitura, sugestoes, fonte };
}

// ── A PORTA DE ENTRADA ─────────────────────────────────────────────────
// Pergunta se a IA está viva. Viva → ela escreve. Morta (ou falhando) → conselhoLocal.
// Nunca lança para a UI: qualquer tropeço vira o fallback determinístico.
export async function gerarConselho(jogo, { signal } = {}) {
  const estado = { ...jogo.estado, turno: jogo.turno };
  const acoesDisponiveis = ACOES
    .filter((a) => !a.escalavel && estaDesbloqueada(a, estado))
    .map((a) => ({ id: a.id, nome: a.nome, categoria: a.categoria }));

  let ligada = false;
  try { ligada = await iaLigada(); } catch { ligada = false; }
  if (!ligada) return conselhoLocal(estado);

  try {
    const ctx = {
      ficha: jogo.ficha || {},
      imprensa: typeof jogo.imprensa === 'function' ? jogo.imprensa() : [],
      acoesDisponiveis,
    };
    const { system, user } = montarPromptConselho(estado, ctx);
    const { texto } = await chamarIA({ system, user, temperature: 0.7, jsonMode: true, signal });
    const parsed = extrairJSON(texto);
    const norm = normalizar(parsed, 'ia');
    return norm || conselhoLocal(estado);
  } catch {
    // Sem chave, offline, limite, JSON quebrado — o jogador não pode ficar sem conselho.
    return conselhoLocal(estado);
  }
}
