// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DA QUEDA — a Máquina escreve o seu obituário político
// ═══════════════════════════════════════════════════════════════════════
// O dono: "se o jogador é deposto, ele precisa SABER POR QUÊ — e seria ótimo se a IA
// contasse a história da queda, irônica, engraçada, às vezes mais pesada."
//
// Duas camadas, nesta ordem:
//   1. O DIAGNÓSTICO (determinístico, sempre existe): a causa formal + os números que
//      cavaram a cova, lidos do estado. Isto NUNCA depende da IA.
//   2. O OBITUÁRIO (IA, opcional): um necrológio político com sarcasmo de colunista.
//      Se a IA estiver desligada/falhar, cai num fallback escrito à mão que continua
//      afiado — o jogador jamais fica sem explicação.
import { chamarIA } from '../maquina/openrouter.js';

const CAUSA_ROT = {
  aprovacao: { rot: 'DEPOSTO PELO PRÓPRIO GABINETE', dica: 'aprovação zerada' },
  estabilidade: { rot: 'O PAÍS SE PARTIU NA SUA MÃO', dica: 'estabilidade zerada' },
  colapso: { rot: 'COLAPSO TOTAL DO REINADO', dica: 'destino no fundo' },
  tempo: { rot: 'O RELÓGIO ZEROU', dica: 'fim do mandato' },
  dominio: { rot: 'DOMÍNIO ABSOLUTO', dica: 'destino máximo' },
};

// ── O DIAGNÓSTICO — os fatos que explicam a queda, em ordem de culpa ───
export function diagnosticoQueda(jogo, fim) {
  const e = jogo.estado;
  const culpados = [];
  const num = (v) => Math.round(Number(v) || 0);
  if (num(e.aprovacao) <= 15) culpados.push({ k: 'Aprovação', v: `${num(e.aprovacao)}%`, txt: 'o povo deixou de te querer', peso: 3 });
  if (num(e.estabilidade) <= 20) culpados.push({ k: 'Estabilidade', v: `${num(e.estabilidade)}`, txt: 'as instituições rangeram até quebrar', peso: 3 });
  if (num(e.divida) >= 120) culpados.push({ k: 'Dívida', v: `${num(e.divida)}% do PIB`, txt: 'você hipotecou o país', peso: 2 });
  if (num(e.temp_guerra) >= 65) culpados.push({ k: 'Clima de guerra', v: `${num(e.temp_guerra)}`, txt: 'viveu em pé de guerra o tempo todo', peso: 2 });
  if ((e.emGuerra || []).length >= 2) culpados.push({ k: 'Guerras abertas', v: `${e.emGuerra.length}`, txt: 'brigou com meio mundo ao mesmo tempo', peso: 2 });
  if (num(e.soft_power) <= 25) culpados.push({ k: 'Soft power', v: `${num(e.soft_power)}`, txt: 'ninguém mais atendia seu telefonema', peso: 1 });
  if (num(e.tesouro) <= 0.5) culpados.push({ k: 'Caixa', v: `US$ ${Number(e.tesouro || 0).toFixed(2)} tri`, txt: 'o cofre secou', peso: 2 });
  culpados.sort((a, b) => b.peso - a.peso);
  return {
    causaRot: CAUSA_ROT[fim?.causa]?.rot || (fim?.tipo === 'vitoria' ? 'REINADO ENCERRADO' : 'FIM DE LINHA'),
    causaDica: CAUSA_ROT[fim?.causa]?.dica || '',
    culpados: culpados.slice(0, 4),
    conquistas: (e.conquistados || []).length,
    anexados: Object.values(e.ocupacoes || {}).filter((o) => o?.anexado).length,
    meses: jogo.turno || 0,
  };
}

// ── O OBITUÁRIO — a IA escreve o necrológio político ──────────────────
export async function obituarioDaQueda(jogo, fim, diag) {
  const e = jogo.estado;
  const vitoria = fim?.tipo === 'vitoria';
  const manchetes = (jogo.feed || []).filter((p) => p.manchete || p.texto).slice(0, 8)
    .map((p) => `- ${String(p.manchete || p.texto).slice(0, 120)}`).join('\n');

  const system = vitoria
    ? 'Você é um colunista político veterano escrevendo o RETRATO FINAL de um governante que terminou o mandato no topo. Tom: irônico, elegante, com admiração relutante — elogio que ainda alfineta. 3 parágrafos curtos. Português do Brasil. Sem emoji, sem títulos, sem aspas na abertura. Devolva só o texto.'
    : 'Você é um colunista político mordaz escrevendo o OBITUÁRIO POLÍTICO de um governante que acabou de cair. Tom: sarcástico e cruel na medida, com humor negro e frases curtas que doem — mas ancorado nos NÚMEROS que te derem. Nada de clichê motivacional. 3 parágrafos curtos. Português do Brasil. Sem emoji, sem títulos, sem aspas na abertura. Devolva só o texto.';

  const user = `Governante: ${jogo.ficha?.presidente || 'O presidente'} — país: ${jogo.ficha?.pais}.
Desfecho oficial: ${fim?.titulo} (${fim?.tipo}). Causa formal: ${diag.causaRot} (${diag.causaDica}).
Tempo no poder: ${diag.meses} meses. Destino final: ${jogo.destino}/100 (${jogo.banda?.nome || '—'}).
Números do fim: aprovação ${Math.round(e.aprovacao)}%, estabilidade ${Math.round(e.estabilidade)}, dívida ${Math.round(e.divida)}% do PIB, tesouro US$ ${Number(e.tesouro || 0).toFixed(2)} tri, PIB ${Number(e.pib || 0).toFixed(1)} tri, soft power ${Math.round(e.soft_power)}, clima de guerra ${Math.round(e.temp_guerra)}.
Guerras abertas: ${(e.emGuerra || []).length}. Territórios ocupados: ${diag.conquistas}. Países anexados: ${diag.anexados}.
O que mais pesou: ${diag.culpados.map((c) => `${c.k} ${c.v} (${c.txt})`).join('; ') || 'nada em particular — apenas o tempo'}.
Manchetes do reinado:
${manchetes || '- (o noticiário mal registrou este governo)'}

Escreva o texto final sobre a queda/encerramento deste governo.`;

  try {
    const { texto } = await chamarIA({ system, user, temperature: 1, jsonMode: false });
    const limpo = String(texto || '').trim().replace(/^["']|["']$/g, '');
    return limpo.length > 40 ? limpo : fallbackObituario(jogo, fim, diag);
  } catch { return fallbackObituario(jogo, fim, diag); }
}

// Fallback afiado: sem IA o jogador AINDA recebe uma narrativa com personalidade.
function fallbackObituario(jogo, fim, diag) {
  const nome = jogo.ficha?.presidente || 'O presidente';
  const pais = jogo.ficha?.pais || 'a nação';
  const principal = diag.culpados[0];
  if (fim?.tipo === 'vitoria') {
    return `${nome} deixa o poder com o que todo governante jura buscar e quase nenhum alcança: ${pais} maior do que encontrou. ${diag.meses} meses, destino ${jogo.destino}/100.\n\n`
      + `Os manuais dirão que foi visão estratégica. Os arquivos dirão que também foi sorte, e que ninguém checou a conta enquanto o gráfico subia.\n\n`
      + `De qualquer forma, a História é escrita por quem fica de pé no fim — e desta vez, foi você.`;
  }
  return `${nome} governou ${pais} por ${diag.meses} meses e saiu pela porta dos fundos. Causa oficial: ${diag.causaDica || 'o próprio governo'}.\n\n`
    + (principal
      ? `O detalhe que ninguém no gabinete queria olhar: ${principal.k.toLowerCase()} em ${principal.v}. Foi assim — ${principal.txt} — enquanto os discursos ficavam cada vez mais longos.\n\n`
      : `Não houve um desastre único. Houve a soma paciente de decisões medianas, que é como a maioria dos governos morre.\n\n`)
    + `${diag.conquistas ? `Deixa ${diag.conquistas} território(s) ocupado(s) e uma fatura que outro vai pagar. ` : ''}A Máquina embaralha as cartas. O próximo já está a caminho, prometendo exatamente as mesmas coisas.`;
}
