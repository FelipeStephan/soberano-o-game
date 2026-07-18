// SISTEMA DE GUERRA. Você escolhe QUAIS unidades enviar e QUANTAS. O custo logístico
// sai do que foi enviado. As baixas caem só sobre a força enviada — o que fica em casa
// está a salvo. Atacar membro de bloco = o bloco reage.
import { UNIDADES, UNIDADE_POR_ID, forcaCombate, poderDeploy, custoDeploy } from '../dados/forcas.js';
import { iso, nomePais, chaveRelacao } from '../dados/paises.js';
import { reacaoDeBloco } from '../dados/blocos.js';
import { PETROLEO } from '../dados/petroleo.js';
import { aplicarEfeitos } from './efeitos.js';
import { forcaDe, detalheForca, ajustarBase } from './forcasMundo.js';
import { coalizaoDefensiva, materializarCoalizao, resumoCoalizao } from './coalizao.js';
import { planoDeCampanha, aplicarCampanha, lerCampanha } from './campanha.js';
import { estadosCarregados, estadosDe, donoDe } from './territorio.js';
import { garantirOcupacao } from './manutencao.js';
import { rand } from './rng.js';

const BONUS_OGIVA = 3;

// ── BAIXAS DO INIMIGO, EM EQUIPAMENTO ─────────────────────────────────
// A defesa do alvo é um número (`av.inimigo`). O jogador, porém, quer VER o que
// destruiu: tantos tanques, tantos caças, tanta bateria antiaérea. Aqui traduzimos o
// PODER destruído na batalha numa composição plausível de uma força de defesa e
// contamos as unidades (poder ÷ poder-unitário). Não é inventário real do NPC — é a
// leitura fiel do estrago, com foto. A perda PERSISTENTE já é aplicada em `ajustarBase`
// (a base do país cai de verdade; ele terá que reconstruir).
const MIX_DEFENSOR = [
  { id: 'infantaria', w: 0.30 }, { id: 'blindados', w: 0.17 }, { id: 'artilharia', w: 0.13 },
  { id: 'defesa_aerea', w: 0.11 }, { id: 'cacas', w: 0.11 }, { id: 'helicopteros', w: 0.07 },
  { id: 'navios', w: 0.06 }, { id: 'misseis', w: 0.05 },
];
function sintetizarPerdasInimigo(poderDestruido) {
  if (poderDestruido <= 0) return [];
  const out = [];
  for (const m of MIX_DEFENSOR) {
    const u = UNIDADE_POR_ID[m.id];
    if (!u || !u.poder) continue;
    const n = Math.round((poderDestruido * m.w) / u.poder);
    if (n > 0) out.push({ id: m.id, nome: u.nome, icone: u.icone, perdido: n });
  }
  return out.sort((a, b) => b.perdido - a.perdido);
}

// ── O COMBUSTÍVEL DA GUERRA ───────────────────────────────────────────
// Uma divisão blindada bebe. Um porta-aviões bebe muito. A logística de combustível
// derrubou mais campanhas na história que qualquer batalha — Rommel parou no Egito
// por falta de diesel, não por falta de tanque.
//
// ── POR QUE ESTE MODELO NÃO É UMA SUBTRAÇÃO SIMPLES ──────────────────
// A primeira versão fazia: "consumo da campanha > produção nacional? então falta".
// Testei e deu 0,01 Mb/d contra 13,2 de produção — nunca mordia, nunca importava.
//
// E o problema não era calibragem: é que a matemática real NÃO produz esse conflito.
// O militar americano queima ~1 Mb/d em guerra plena, contra 20 Mb/d de consumo
// nacional. Combustível militar é ~5% da demanda de um país. Comparar campanha com
// produção nacional é a conta errada.
//
// A conta CERTA é outra: para um IMPORTADOR LÍQUIDO, todo barril que o exército
// queima é um barril comprado lá fora, ao preço do dia. Então o combustível não é
// um teste de escassez — é uma FATURA que infla com o Brent. Atacar com o barril a
// US$ 150 custa o dobro de atacar a US$ 78. E como bombardear petroestado faz o
// Brent subir, a sua própria guerra encarece a sua própria guerra.
//
// FRACAO_COMBUSTIVEL é um botão de design (como o FATOR_JOGO de dados/petroleo.js):
// ancora a fatura em ~28% do custo logístico no preço-base, pra a decisão pesar.
const FRACAO_COMBUSTIVEL = 0.28;
const PRECO_ANCORA = 78;

// Barris/dia por unidade em campanha. São números reais (um porta-aviões nuclear não
// queima pro casco, mas a ala aérea e a escolta dele queimam ~120 mil b/d juntos).
// Servem para MOSTRAR a escala ao jogador — a fatura sai da fórmula abaixo.
const CONSUMO_BARRIL = {
  infantaria: 0.08, blindados: 35, artilharia: 12, helicopteros: 120,
  cacas: 240, bombardeiros: 900, drones: 15, navios: 1400,
  submarinos: 150, porta_avioes: 12000, misseis: 2, defesa_aerea: 10,
};

// Quantos Mb/d (milhões de barris/dia) uma composição queima em operação.
export function consumoDeploy(deploy) {
  let b = 0;
  for (const [id, q] of Object.entries(deploy || {})) b += (q || 0) * (CONSUMO_BARRIL[id] || 0);
  return Math.round((b / 1e6) * 100) / 100;
}

export function combustivelDaGuerra(estado, deploy, custoLogistico = 0) {
  const consumo = consumoDeploy(deploy);
  const preco = estado.preco_petroleo || PRECO_ANCORA;
  const producao = estado.petroleo_producao || 0;
  const consumoCivil = estado.petroleo_consumo || 0;

  // Você é importador líquido? Então cada barril da campanha vem de fora.
  const importador = producao < consumoCivil;
  const folga = round2(producao - consumoCivil);   // negativo = déficit estrutural

  // A fatura: fração do custo logístico, escalada pelo preço do barril.
  // Importador paga 35% a mais — compra no mercado, com frete e prêmio de risco.
  const mult = (preco / PRECO_ANCORA) * (importador ? 1.35 : 1);
  const custoExtra = round2(custoLogistico * FRACAO_COMBUSTIVEL * mult);

  // A moral só sofre quando o barril está caro E você depende de fora: é quando
  // o comboio de reabastecimento vira alvo e a fila de espera aparece na frente.
  const estrangulado = importador && preco >= 120;

  return {
    consumo, producao, consumoCivil, folga, importador, preco,
    custoExtra, cobre: !estrangulado, estrangulado,
    // quanto do preço é culpa da carestia (pro texto explicar)
    inflacao: Math.round((preco / PRECO_ANCORA - 1) * 100),
  };
}

// Avalia antes de lançar: o que você tem, o que ele tem, QUEM VEM COM ELE, e quem reage.
//
// A mudança que importa: `inimigo` deixou de ser só a força do alvo. Agora é a força do
// alvo MAIS a coalizão que se forma pra defendê-lo. Invadir o Brasil não é mais enfrentar
// 48; é enfrentar 48 + o que China, Rússia e Índia mandarem — e você vê isso ANTES de
// lançar, no planejador. A guerra fácil que existia era um artefato do bloco ser cenário.
export function avaliarGuerra(estado, feature) {
  const alvoIso = iso(feature);
  const soAlvo = forcaDe(estado, alvoIso, feature);
  const coalizao = coalizaoDefensiva(estado, alvoIso, feature);
  const inimigo = soAlvo + coalizao.poderExtra;
  const moral = 0.6 + (estado.poder_militar / 100) * 0.6;
  return {
    nome: nomePais(feature),
    iso: alvoIso,
    forcaTotal: forcaCombate(estado.forcas) + (estado.ogivas || 0) * BONUS_OGIVA,
    inimigo,
    soAlvo,                                   // o alvo sozinho — pra UI mostrar a diferença
    detalheAlvo: detalheForca(estado, alvoIso, feature),
    coalizao,                                 // quem vem, quanto manda e por quê
    moral: Math.round(moral * 100),
    bloco: reacaoDeBloco(alvoIso),
    sugestao: sugerirDeploy(estado, inimigo),
  };
}

// Composição sugerida: força suficiente pra ~1.7x o inimigo, proporcional ao que você tem.
export function sugerirDeploy(estado, inimigoPoder) {
  const total = forcaCombate(estado.forcas) || 1;
  const frac = Math.min(1, (inimigoPoder * 1.7) / total);
  const d = {};
  for (const u of UNIDADES) {
    const disp = estado.forcas?.[u.id] || 0;
    if (!disp) continue;
    const q = Math.round((disp * frac) / u.passo) * u.passo;
    d[u.id] = Math.max(0, Math.min(disp, q));
  }
  return d;
}

// opts.multPoder → bônus da base de lançamento (1 = ataque saindo de casa)
// opts.custo     → custo logístico já com o desconto da base aplicado
export function resolverGuerra(estado, feature, deploy, opts = {}) {
  const av = avaliarGuerra(estado, feature);
  const multPoder = opts.multPoder || 1;
  const custo = opts.custo ?? custoDeploy(deploy);
  const poderEnviado = Math.round(poderDeploy(deploy) * multPoder);

  if (poderEnviado <= 0) return { falha: 'Nenhuma força designada para a ofensiva.' };

  // COMBUSTÍVEL: a fatura escala com o Brent. Se você importa, paga mais — e se o
  // barril está caro porque VOCÊ bombardeou um petroestado, a conta é sua duas vezes.
  const comb = combustivelDaGuerra(estado, deploy, custo);
  const custoTotal = round2(custo + comb.custoExtra);
  // `custoJaPago`: a ofensiva com TEMPO já debitou o caixa no commit (jogo/ofensiva.js).
  if (!opts.custoJaPago) {
    if (estado.tesouro < custoTotal) {
      return { falha: `Tesouro insuficiente: logística ${custo} tri + combustível ${comb.custoExtra} tri = ${custoTotal} tri.` };
    }
    estado.tesouro = round2(estado.tesouro - custoTotal);
  }
  // Importador com barril a 120+: o comboio de reabastecimento vira o gargalo.
  const penalCombustivel = comb.estrangulado ? 0.82 : 1;

  // multSurpresa (>1 se o alvo NÃO detectou) e multDefesaAlvo (>1 se detectou e reforçou).
  const moral = (av.moral / 100) * penalCombustivel * (opts.multSurpresa || 1);
  const minhaEfetiva = (poderEnviado + (estado.ogivas || 0) * BONUS_OGIVA) * moral;
  const defensor = av.inimigo * (0.95 + rand() * 0.3) * (opts.multDefesaAlvo || 1);

  let meu = minhaEfetiva; let ini = defensor;
  const rounds = [];
  for (let n = 1; n <= 5 && meu > 0 && ini > 0; n += 1) {
    const dMeu = ini * (0.10 + rand() * 0.12);
    const dIni = meu * (0.12 + rand() * 0.14);
    meu = Math.max(0, meu - dMeu); ini = Math.max(0, ini - dIni);
    rounds.push({ n, meu: Math.round(meu), ini: Math.round(ini), baixasMinhas: Math.round(dMeu), baixasDele: Math.round(dIni) });
  }

  let resultado;
  if (ini <= 0 && meu > 0) resultado = 'vitoria_total';
  else if (meu <= 0) resultado = 'derrota_total';
  else if (meu > ini) resultado = 'vitoria';
  else resultado = 'derrota';
  const venceu = resultado.startsWith('vitoria');

  // ── O MAPA DA CAMPANHA ──────────────────────────────────────────────
  // A guerra deixou de ser interruptor. A razão entre a minha força efetiva e a
  // defesa decide QUANTOS estados do alvo caem — e a ofensiva que "perdeu" ainda
  // pode ficar com uma cabeça de ponte na fronteira. Ver jogo/campanha.js.
  const razao = defensor > 0 ? minhaEfetiva / defensor : 9;
  const plano = estadosCarregados()
    ? planoDeCampanha(estado, av.iso, razao, opts.origem || null, opts.prioridade || null)
    : { caem: [], resistem: [], fracao: venceu ? 1 : 0, total: 0, tomouCapital: venceu };

  // baixas SÓ na força enviada
  const perdaFrac = clamp(1 - meu / Math.max(1, minhaEfetiva), 0.05, 0.6);
  const perdas = [];
  for (const u of UNIDADES) {
    const enviado = deploy?.[u.id] || 0;
    if (!enviado) continue;
    const perdido = Math.min(enviado, Math.round(enviado * perdaFrac * (0.6 + rand() * 0.8)));
    if (opts.forcaEmTransito) {
      // A força já saiu do inventário no commit (ofensiva com tempo) — devolve os sobreviventes.
      const sobreviventes = enviado - perdido;
      if (sobreviventes > 0) estado.forcas[u.id] = (estado.forcas[u.id] || 0) + sobreviventes;
      if (perdido > 0) perdas.push({ id: u.id, nome: u.nome, icone: u.icone, perdido, enviado });
    } else if (perdido > 0) {
      estado.forcas[u.id] = Math.max(0, (estado.forcas[u.id] || 0) - perdido);
      perdas.push({ id: u.id, nome: u.nome, icone: u.icone, perdido, enviado });
    }
  }

  // O que a DEFESA do alvo perdeu na batalha (poder destruído = defensor − sobrou).
  // Vira o breakdown com foto no relatório. A queda persistente da base é aplicada
  // logo abaixo em `ajustarBase` — não some do inventário porque o NPC não tem um,
  // mas a força dele cai de verdade e ele reconstrói ao longo dos turnos.
  const perdasInimigo = sintetizarPerdasInimigo(Math.max(0, defensor - ini));

  // A APROVAÇÃO SEGUE O MAPA, NÃO O RÓTULO. Antes era binário: venceu +8, perdeu -14.
  // Agora um "avanço profundo" que parou antes da capital rende menos que uma ocupação
  // total, e uma derrota que deixou uma cabeça de ponte dói menos que a aniquilação —
  // porque o povo lê o mapa, não a nota do gabinete.
  const relAlvo = chaveRelacao(feature);
  const f = plano.fracao;
  // O CHOQUE GLOBAL escala com o PESO do alvo: atacar uma potência mexe o mundo mais que
  // atacar um vizinho pequeno. `av.soAlvo` é a força-base do alvo; um país grande (EUA,
  // China) empurra a temperatura de guerra muito mais que um menor — e é isso que o
  // preço do barril e a tensão global leem. Realismo: invadir um soberano de peso é um
  // abalo sistêmico, não um incidente de fronteira.
  const choque = Math.min(34, Math.round((av.soAlvo || 40) / 5));
  const efeitos = venceu
    // TERRITÓRIO agora é PROPORCIONAL, não 1-por-estado: um estado não é um país. Tomar
    // o Brasil inteiro rende ~2; tomar 4 estados rende 1. Antes cada estado somava +1 e
    // 27 estados × +7 no Destino faziam você virar "Imperador do Mundo" num único ataque.
    ? { territorio: Math.max(1, Math.round((f || 0) * 2)), [relAlvo]: -45, soft_power: -12, temp_guerra: 14 + choque,
        aprovacao: Math.round(2 + f * 8) }
    : { [relAlvo]: -35, soft_power: -6, temp_guerra: 12 + choque,
        // perder inteiro custa 16 de aprovação; perder com território na mão custa 4
        aprovacao: -Math.round(16 - f * 12),
        poder_militar: -Math.round(10 - f * 5) };
  const mudancas = aplicarEfeitos(estado, efeitos);

  // O território agora entra estado por estado (ver campanha.js). `conquistados`
  // (país inteiro) só existe quando a ocupação é TOTAL — senão o jogo diria que
  // você "ocupou o Brasil" tendo tomado o Acre.
  const nEstados = estadosCarregados() ? aplicarCampanha(estado, plano, estado.iso || 'USA') : 0;

  // ── CONQUISTA TOTAL (100%) ───────────────────────────────────────────
  // O país só "cai por inteiro" quando TODOS os estados dele são seus — o que pode
  // levar VÁRIOS ataques (a capital resiste até você vir esmagador, ver campanha.js).
  // Antes bastava `fracao>=1` de UM ataque; agora contamos a posse real, então uma
  // campanha acumulada (tomo a fronteira hoje, o interior amanhã, a capital depois)
  // fecha a conquista quando o último estado cede. Sem estados mapeados, cai no
  // comportamento antigo (fracao>=1) pros países sem território detalhado.
  const euIso = estado.iso || 'USA';
  const doPais = estadosCarregados() ? estadosDe(av.iso) : [];
  const conquistaTotal = doPais.length
    ? doPais.every((s) => donoDe(estado, s.id) === euIso)
    : plano.fracao >= 1;
  const jaEra = (estado.conquistados || []).some((c) => c.iso === av.iso);
  if (conquistaTotal && !jaEra) {
    estado.conquistados = estado.conquistados || [];
    estado.conquistados.push({ iso: av.iso, nome: av.nome, insurgencia: 35, desde: 0 });
    garantirOcupacao(estado, av.iso);   // registro rico de ocupação (upkeep/anexação)
  }

  // zona de guerra (pra o mapa pulsar). Ocupação parcial MANTÉM a guerra aberta:
  // você está lá dentro, eles não se renderam. É o estado mais comum da coisa real.
  // Conquista TOTAL encerra a guerra nesse front (não há mais o que tomar).
  estado.emGuerra = estado.emGuerra || [];
  const guerraSegue = !conquistaTotal;
  if (guerraSegue && !estado.emGuerra.includes(av.iso)) estado.emGuerra.push(av.iso);
  if (!guerraSegue) estado.emGuerra = estado.emGuerra.filter((i) => i !== av.iso);
  // EU ATAQUEI: o mundo tem memória curta disso — sobe a chance de um rival plausível
  // revidar (culpaDoJogador). Ataque = consequência, não gatilho gratuito.
  estado.minhasOfensivas = estado.minhasOfensivas || [];
  estado.minhasOfensivas.push({ turno: estado.turno ?? 0, alvo: av.iso });
  estado.turnosDeCalmaria = 0;

  // ── A REAÇÃO DO BLOCO — diplomática E material ──────────────────────
  // Antes existia só a primeira metade: relações caíam e acabou. O bloco reclamava.
  const reacaoBloco = [];
  for (const k of av.bloco.relKeys) {
    const antes = Number(estado[k] ?? 0);
    estado[k] = clamp(antes + (venceu ? -18 : -12), -100, 100);
    reacaoBloco.push({ chave: k, delta: estado[k] - antes });
  }

  // A metade que faltava: quem prometeu aço no planejador MANDA o aço, e ele fica lá.
  // Os apoios entram em `forcasMundo` com prazo — então se você atacar o Brasil de novo
  // no próximo turno, vai encontrar as tropas chinesas ainda posicionadas. É isto que
  // transforma "o BRICS condena" em "o BRICS está no seu caminho".
  const apoiosEnviados = av.coalizao.membros.length
    ? materializarCoalizao(estado, av.coalizao, av.iso, 'defesa de aliado')
    : [];

  // A guerra MARCA o alvo. Perder metade do exército tem de valer alguma coisa no mapa:
  // um país esmagado fica mais fraco pros próximos turnos, e um que resistiu sai
  // endurecido. Sem isto, `base` seria eterna e o mundo esqueceria toda guerra.
  ajustarBase(estado, av.iso, venceu ? -Math.round(av.soAlvo * 0.35) : Math.round(av.soAlvo * 0.08), feature);

  // O ESPÓLIO: se o país que você acabou de tomar tem petróleo, isso precisa
  // aparecer no desfecho. Conquistar a Venezuela são 303 bi de barris mudando de
  // dono — a maior transferência de riqueza do jogo não pode passar despercebida.
  const petroleo = venceu ? PETROLEO[av.iso] || null : null;

  return {
    av, rounds, resultado, venceu, perdas, perdasInimigo, mudancas,
    conquistaTotal, capitalResistiu: plano.capitalResistiu || false,
    // O mapa da campanha: quais estados caíram, quantos resistiram, e a leitura
    // em português do meio-termo. A UI revela isto um estado por vez.
    campanha: plano, nEstados, leitura: lerCampanha(plano, av.nome),
    custo, custoTotal, combustivel: comb, poderEnviado, multPoder, petroleo,
    bloco: av.bloco, reacaoBloco,
    coalizao: av.coalizao, apoiosEnviados,
    // Vai pro prompt: a Máquina precisa saber que a China entrou, senão ela narra uma
    // guerra que não é a que o jogador acabou de ver na tela.
    resumoCoalizao: resumoCoalizao(av.coalizao, av.nome),
  };
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function round2(n) { return Math.round(n * 100) / 100; }
