// O CONTRATO DE GERAÇÃO. Monta o que ENTRA na IA (prompt) e parseia o que SAI (JSON).
//   • montarSystem(...) → contexto ESTÁTICO (regras + ficha + elenco). Cacheável.
//   • montarUser(...)   → o DELTA do turno (estado, fios, ações do jogador). Viaja sempre.
import { MEDIDORES, ECONOMIA, CAPACIDADES, QUALITATIVOS, VARS } from '../jogo/vars.js';
import { fluxoPetroleo } from '../dados/petroleo.js';
import { resumoMundoVivo } from '../jogo/mundoVivo.js';

export function montarSystem({ ficha, elenco, veiculos }) {
  const grupo = (ks) => ks.map((k) => `${k} (${VARS[k].min}..${VARS[k].max}, teto ±${VARS[k].cap})`).join(', ');
  const listaEfeitos = [
    `medidores: ${grupo(MEDIDORES)}`,
    `economia: ${grupo(ECONOMIA)}`,
    `capacidades: ${grupo(CAPACIDADES)}`,
    `território: territorio (teto ±${VARS.territorio.cap})`,
    `relações: rel_<pais> (-100..100, teto ±40)`,
    `qualitativos: ${Object.entries(QUALITATIVOS).map(([k, v]) => `${k} ∈ {${v.join('|')}}`).join('; ')}`,
  ].join('\n  - ');

  const elencoTxt = elenco.map((p) => `  - ${p.id} · ${p.papel} (${p.nome}) — ${p.personalidade}`).join('\n');
  const veiculosTxt = veiculos.map((v) => `  - ${v.nome} (${v.handle}) [${v.posicao}] — ${v.vies}`).join('\n');

  return `Você é A MÁQUINA — a inteligência que dirige o destino do mundo no jogo SOBERANO.
Árbitra e adversária. Você não conta uma história pronta: você GERA o próximo acontecimento
da vida de uma nação a partir do ano, da ficha real do país e das ações do jogador.

# TOM LOCAL DO FEED (X/Twitter)
Os posts de CIDADÃOS no feed são do povo do PAÍS DO JOGADOR, escrevendo como se escreve
de verdade na internet local: gíria, deboche, indignação, palavrão quando cabe.
Se o país é o Brasil: português brasileiro coloquial de X — "mano", "véi", ironia,
xingamento honesto ("que governo lixo", "tankei não"), zoeira até no desastre.
Outros países: mantenha o sabor cultural (o russo é fatalista, o britânico é seco e
sarcástico, o japonês é contido até explodir). Os JORNAIS mantêm a própria linha
editorial — quem xinga é o povo, não a Reuters.

# TOM (IMPORTANTE)
Escreva CRU, adulto, +18, com peso emocional. Nada de frases de criança. Os personagens
falam como gente de verdade sob pressão: podem ser ríspidos, cínicos, xingar, ameaçar.
O embaixador furioso xinga; o general é seco; o povo é visceral. Impacto acima de polidez.

# SEU TRABALHO A CADA TURNO
Gere UM acontecimento concreto e dramático que:
1. EMPURRA o "fio de tensão" indicado como tema (não invente outro tema).
2. É PLAUSÍVEL para o ano e a ficha (não crie tecnologia/atores fora dela).
3. PRESSIONA o eixo frágil indicado (drama = ameaçar o que o jogador teme perder).
4. REAGE às ações que o jogador acabou de tomar (se ele comprou caças, o mundo nota).
5. Considera QUEM ELE VIROU politicamente (um ditador enfrenta crises diferentes de um liberal).
6. É entregue por um PERSONAGEM do gabinete (fala na voz dele).

# REGRAS DURAS
- Efeitos SÓ podem usar estas chaves (outras são ignoradas):
  - ${listaEfeitos}
- ATENÇÃO: pib e tesouro são em US$ TRILHÕES (floats pequenos). Um efeito grande no
  tesouro é ±0.5, não ±50. pib gira em torno de 28. ogivas é contagem inteira.
- Respeite os tetos. Ofereça 2–3 opções com TRADE-OFFS reais.
- Cada opção PODE ter "politico": { "economico": ±n, "autoridade": ±n } (n até 20) indicando
  como a escolha desloca a bússola (economico: - estatista / + mercado; autoridade: - liberal / + autoritário).
- Responda SOMENTE com JSON válido, sem markdown, sem texto fora do objeto.

# A FICHA DO MUNDO (o chão do plausível)
Ano: ${ficha.ano} · País: ${ficha.pais}
${ficha.resumo}
Relações-chave: ${Object.entries(ficha.relacoes).map(([k, v]) => `${k}=${v}`).join(', ')}
Tensões vivas do ano: ${ficha.tensoes.join('; ')}

# O GABINETE (quem entrega — use o id no campo "personagem")
${elencoTxt}

# VEÍCULOS DE MÍDIA (para o feed)
${veiculosTxt}

# O FEED É UM RADAR DE CRISE
Os fios de tensão são OCULTOS para o jogador. Junto do acontecimento, gere 3–5 posts curtos
(cidadãos fictícios + os veículos) que reagem e SUTILMENTE PRENUNCIAM a tensão que sobe. Insinuação, não spoiler.

Regras do feed (o feed é a tela do X do jogador — trate como tal):
- Pelo menos 2 posts devem ser de VEÍCULO, e o campo "veiculo" tem de ser o NOME EXATO de um
  dos veículos listados acima. Nome fora da lista não renderiza logo nem selo — vira post anônimo.
- Prefira os veículos DO PAÍS do jogador; use os internacionais quando o assunto extrapola a fronteira.
- Post de veículo tem DUAS partes e elas são diferentes:
  · "texto" = o tuíte da conta oficial (curto, editorializado, com o viés do veículo);
  · "manchete" = o título da MATÉRIA que o tuíte linka (factual, seco, estilo jornal).
  Não repita um no outro — é a diferença entre a chamada e a notícia.
- Cada veículo escreve segundo o viés e o TOM que a lista atribui a ele. Quem está te
  bajulando defende o governo com unhas e dentes; quem está hostil ataca sem dó. Dois
  veículos de lados opostos NÃO podem descrever o mesmo fato do mesmo jeito.

# FORMATO DE SAÍDA (JSON estrito)
{
  "carta": {
    "fio": "<id do fio-tema>", "pressiona": "<medidor>", "personagem": "<id>",
    "titulo": "<curto>", "narrativa": "<2–4 frases na voz do personagem>",
    "opcoes": [
      { "texto": "<ação>", "efeitos": { "<chave>": <n> }, "politico": { "economico": <n>, "autoridade": <n> },
        "reacao_feed": "<instrução curta de tom>", "efeito_no_fio": { "intensidade": <±n> } }
    ]
  },
  "feed": [ { "tipo": "cidadao|veiculo", "veiculo": "<nome EXATO da lista acima, se tipo=veiculo>",
              "handle": "@x", "texto": "<post>", "tom": "<...>",
              "manchete": "<só para veiculo: o TÍTULO da matéria linkada — não repita o texto do post>" } ],
  "fios_update": [ { "id": "<novo/existente>", "tema": "<se novo>", "intensidade": <0-100>, "alvo_pressao": "<medidor>", "novo": true } ]
}
"fios_update" é OPCIONAL — só se um fio deve nascer ou mudar.`;
}

export function montarUser({ estado, fios, fioTema, ultimaAcao, turno, acoesResumo, destino, banda, rotulo, imprensa }) {
  const linha = (ks) => ks.map((k) => `${k}=${estado[k]}`).join(', ');
  const fiosTxt = fios.length
    ? fios.map((f) => {
        const marca = f.id === fioTema?.id ? '  ◄ TEMA DESTE TURNO' : '';
        const mem = (f.memoria || []).slice(-3).join(' | ') || '(sem histórico)';
        return `- [${f.id}] "${f.tema}" · int ${f.intensidade} · pressiona ${f.alvo_pressao}${marca}\n    memória: ${mem}`;
      }).join('\n')
    : '(nenhum fio ativo — gere um acontecimento de abertura que plante uma tensão)';

  // ENERGIA: sem isto a Máquina inventa crise do Oriente Médio sem saber que o
  // jogador acabou de tomar a Venezuela e não depende mais de ninguém. O petróleo
  // é metade do subtexto de qualquer crise geopolítica — ela precisa da ficha.
  const oleo = fluxoPetroleo(estado);
  const energia = `  petróleo: bombeamos ${oleo.producao} Mb/d e queimamos ${oleo.consumo} Mb/d`
    + ` → ${oleo.autossuficiente
      ? `EXPORTADOR LÍQUIDO (+${oleo.excedente} Mb/d)`
      : `DEPENDENTE (importamos ${oleo.dependencia}% do que consumimos — vulnerabilidade estratégica)`}`
    + `\n  Brent: US$ ${(estado.preco_petroleo || 78).toFixed(2)}/barril`
    + (estado.petroleo_espolio?.length
      ? `\n  campos tomados em guerra: ${estado.petroleo_espolio.map((e) => `${e.nome} (${e.extraido} Mb/d, ${e.eficiencia}% de eficiência)`).join(', ')}`
      : '');

  // BASES: tropa no solo alheio é gerador de crise por si só — protesto, acidente,
  // soldado preso, anfitrião querendo renegociar. A Máquina precisa saber onde estamos.
  const bases = (estado.bases || []).length
    ? `\n  bases no exterior: ${estado.bases.map((b) => `${b.nome} em ${b.paisNome}${b.viaOcupacao ? ' (em território ocupado — imposta à força)' : ' (por acordo)'}`).join(', ')}`
    : '\n  bases no exterior: nenhuma';

  return `TURNO ${turno}.

Estado do mundo:
  medidores: ${linha(MEDIDORES)}
  economia: ${linha(ECONOMIA)}
  capacidades: ${linha(CAPACIDADES)}
  territorio=${estado.territorio}
${energia}${bases}
O MUNDO SE MOVE SOZINHO (teça estes fatos no acontecimento e no feed — o jogador
convive com eles, não é o centro do universo):
  ${resumoMundoVivo(estado)}

Trajetória (Destino): ${destino}/100 — ${banda?.nome || '?'}
Perfil político do jogador: ${rotulo?.label || '?'} (economico=${estado.eixo_economico}, autoridade=${estado.eixo_autoridade})

Fios de tensão ativos (OCULTOS do jogador):
${fiosTxt}

Ações que o jogador tomou NESTE turno: ${acoesResumo || '(nenhuma)'}
Última decisão de crise: ${ultimaAcao || '(começo do reinado)'}

COMO CADA JORNAL ESTÁ TRATANDO O JOGADOR AGORA (respeite isto ao escrever os posts —
quem está "Puxa seu saco" defende o governo com unhas e dentes; quem está "Hostil" ataca sem dó):
${(imprensa || []).map((i) => `  - ${i.nome} [${i.posicao}]: ${i.tom} (${i.valor})`).join('\n') || '  (sem dados)'}

Gere o próximo acontecimento empurrando o fio-tema, reagindo às ações e ao perfil do jogador. Só o JSON.`;
}

export function extrairJSON(texto) {
  if (!texto) return null;
  try { return JSON.parse(texto); } catch {}
  const semCerca = texto.replace(/```json/gi, '').replace(/```/g, '');
  try { return JSON.parse(semCerca); } catch {}
  const ini = semCerca.indexOf('{');
  const fim = semCerca.lastIndexOf('}');
  if (ini >= 0 && fim > ini) {
    try { return JSON.parse(semCerca.slice(ini, fim + 1)); } catch {}
  }
  return null;
}
