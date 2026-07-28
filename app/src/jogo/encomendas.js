// ═══════════════════════════════════════════════════════════════════════
// ENCOMENDAS — comprar arma de OUTRO JOGADOR vira uma relação, não um clique
// ═══════════════════════════════════════════════════════════════════════
// O buraco que isto tapa: no mercado, comprar um Leopard da Alemanha era idêntico
// jogando sozinho ou numa sala com um humano governando Berlim. O alemão nem ficava
// sabendo. O dado rolava, o material aparecia, e a maior alavanca geopolítica que
// existe entre dois países — "eu tenho a fábrica que você precisa" — não existia.
//
// Aqui a compra passa a ter TRÊS PARTES e um tempo entre elas:
//
//   1. PEDIDO      — o comprador escolhe o item e um fornecedor HUMANO que o fabrica.
//   2. APROVAÇÃO   — o fornecedor decide. Ele pode dizer não porque te odeia, porque
//                    está em guerra com você, ou só porque não quer armar um rival
//                    que amanhã aponta esse mesmo material pra ele.
//   3. PRODUÇÃO    — aprovado, entra numa LINHA DE MONTAGEM que leva MESES (batidas).
//                    Ninguém entrega porta-avião no mês seguinte. Os dois lados veem
//                    a barra andando: um esperando a arma, o outro esperando o resto
//                    do dinheiro.
//
// ── A DECISÃO DE PAGAMENTO (e por que ela é assim) ────────────────────
// 30% de ENTRADA + 70% na ENTREGA. A entrada sai do caixa do comprador na hora do
// pedido e só troca de mãos quando o fornecedor APROVA — recusou, volta inteira
// (ninguém abriu linha nenhuma). Aprovou, é dele e não volta mais, mesmo que o
// comprador desista: a fábrica já parou de fazer outra coisa pra fazer a sua.
//
// E o CALOTE é possível, de propósito. Os 70% só são cobrados no dia da entrega,
// meses depois — e em meses um país quebra, é sancionado ou tem o caixa congelado
// pelo Conselho. Se o dinheiro não estiver lá, a carga NÃO EMBARCA: o fabricante
// fica com a entrada E com o material (já está pronto, entra no arsenal dele), e a
// relação entre os dois desaba 25 pontos. É a tensão que faz a encomenda valer a
// pena existir: você não está só comprando, está prometendo pagar depois.
//
// ── POR QUE ISTO É MELHOR NEGÓCIO QUE COMPRAR DE NPC ──────────────────
// Do NPC você compra com um DADO (podeComprar/chance) e recebe em segundos na fila
// de comando. Do humano você compra 10% mais barato (negócio direto entre governos,
// sem ágio de tabela) e SEM dado — aprovou, é certo. O preço é o tempo: meses, e a
// dependência de outra pessoa querer te vender. Rapidez × preço × confiança: escolha
// duas.
//
// ── AUTORIDADE (o servidor é relay burro) ─────────────────────────────
// Cada lado manda o bilhete sobre o PRÓPRIO lado da transação:
//   comprador → cria o pedido, paga a entrada, paga (ou dá o calote) na entrega;
//   fornecedor → aprova/recusa, roda a linha de produção, avisa quando fica pronto.
// Ninguém precisa confiar no relógio do outro: os MESES são fixados na aprovação e
// os dois contam a mesma coisa localmente. Se o fornecedor sumir da sala e a linha
// vencer sem embarque, o comprador cancela sozinho e reave a entrada (ver EXPIRA).
import { ARSENAL, ARSENAL_POR_ID } from '../dados/arsenal.js';
import { PRECO } from '../dados/mercado.js';
import { UNIDADE_POR_ID, aplicarForcas } from '../dados/forcas.js';
import { FORNECEDORES, descontoMilitar } from '../dados/blocos.js';
import { NACOES } from '../dados/registro.js';
import { PAISES } from '../dados/paises.js';
import { chaveRelDe, relacaoCom } from './compras.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round4 = (n) => Math.round(n * 1e4) / 1e4;
const round6 = (n) => Math.round(n * 1e6) / 1e6;
const nomeDe = (iso) => PAISES[iso]?.nome || iso;

// Fração paga na assinatura do contrato. O resto vence na entrega.
export const ENTRADA = 0.3;

// Quantas batidas o comprador espera ALÉM do prazo antes de dar a linha por perdida.
// Duas: uma pode ser um desencontro de relógio entre clientes, duas é o fornecedor
// tendo saído da sala. Sem esta válvula, sair do jogo prenderia o dinheiro do outro
// pra sempre — o pior tipo de bug, porque parece maldade do adversário.
const TOLERANCIA_ATRASO = 2;

// ── QUEM FABRICA O QUÊ ────────────────────────────────────────────────
// Duas travas, e as duas precisam passar:
//
//   1. CATÁLOGO — o país precisa ter uma linha de montagem daquela classe no
//      arsenal do mundo (dados/arsenal.js, campo `origem`). Quem não tem estaleiro
//      não vende submarino, por mais rico que seja. Itens de política `nunca` ficam
//      de fora: se o F-22 jamais é exportado pra NPC, não é uma sala online que vai
//      abrir essa porta — a mística do sistema irreplicável é regra do jogo, não
//      detalhe de mercado.
//   2. CAPACIDADE INDUSTRIAL — o número `capacidade_ind` (0–100) do estado precisa
//      alcançar o piso da classe. É o que impede um país de vender porta-aviões
//      porque um dia teve um no catálogo: se a indústria despencou (guerra, sanção,
//      caixa torrado), a linha fecha. E é o que dá VALOR a investir em indústria:
//      capacidade alta não só destrava classes pesadas como ENCURTA o prazo.
//
// Os FORNECEDORES tradicionais (dados/blocos.js) entram por uma porta lateral: mesmo
// sem item específico no catálogo, quem é exportador histórico de armas vende as
// classes LEVES (piso ≤ 30). É o que evita o absurdo de a Coreia do Sul não conseguir
// vender munição/blindado leve por falta de uma entrada na tabela.
export const CLASSE_ENCOMENDAVEL = {
  infantaria:   { meses: 1,  capMin: 0,  rot: 'Equipar e treinar tropa' },
  artilharia:   { meses: 3,  capMin: 20, rot: 'Linha de artilharia' },
  blindados:    { meses: 3,  capMin: 25, rot: 'Linha de blindados' },
  drones:       { meses: 2,  capMin: 15, rot: 'Montagem de drones' },
  helicopteros: { meses: 4,  capMin: 30, rot: 'Aviação leve' },
  defesa_aerea: { meses: 5,  capMin: 40, rot: 'Baterias e radares' },
  misseis:      { meses: 5,  capMin: 40, rot: 'Complexo de mísseis' },
  cacas:        { meses: 7,  capMin: 45, rot: 'Aviação de combate' },
  bombardeiros: { meses: 9,  capMin: 65, rot: 'Aviação estratégica' },
  navios:       { meses: 11, capMin: 50, rot: 'Estaleiro naval' },
  submarinos:   { meses: 13, capMin: 60, rot: 'Estaleiro de submarinos' },
  porta_avioes: { meses: 20, capMin: 75, rot: 'Obra de década' },
};

// A capacidade industrial de um país. A minha vem do estado vivo; a dos outros vem
// dos stats que cada jogador transmite por batida (`_statsHumanos[iso].cap`) e, na
// falta deles, da ficha inicial da nação. A ordem importa: número vivo antes de
// número de tabela, senão um país arrasado continuaria vendendo porta-aviões.
export function capacidadeIndustrialDe(estado, iso) {
  if (!iso) return 0;
  if (iso === (estado.iso || 'USA')) return Number(estado.capacidade_ind ?? 0);
  const vivo = Number(estado._statsHumanos?.[iso]?.cap);
  if (Number.isFinite(vivo)) return vivo;
  return Number(NACOES[iso]?.ficha?.estadoInicial?.capacidade_ind ?? 0);
}

// Os itens do catálogo que `iso` pode legitimamente vender naquela classe.
export function itensFabricados(iso, unidadeId) {
  return ARSENAL.filter((a) => a.origem === iso && a.unidade === unidadeId && a.politica !== 'nunca');
}

// { pode, motivo, cap, capMin, itens } — a resposta completa, porque a UI precisa
// dizer POR QUE não pode (falta indústria? falta fábrica?), não só esconder o botão.
export function podeFornecer(estado, iso, unidadeId) {
  const classe = CLASSE_ENCOMENDAVEL[unidadeId];
  if (!classe) return { pode: false, motivo: 'Classe não encomendável.', cap: 0, capMin: 0, itens: [] };
  const cap = capacidadeIndustrialDe(estado, iso);
  const itens = itensFabricados(iso, unidadeId);
  const exportadorTradicional = FORNECEDORES.includes(iso) && classe.capMin <= 30;
  if (!itens.length && !exportadorTradicional) {
    return { pode: false, motivo: `${nomeDe(iso)} não tem linha de montagem desta classe.`, cap, capMin: classe.capMin, itens };
  }
  if (cap < classe.capMin) {
    return { pode: false, motivo: `Capacidade industrial ${Math.round(cap)} — a classe exige ${classe.capMin}.`, cap, capMin: classe.capMin, itens };
  }
  return { pode: true, motivo: classe.rot, cap, capMin: classe.capMin, itens };
}

// ── TEMPO DE PRODUÇÃO (em MESES = batidas do mundo) ───────────────────
// Três forças, e a calibragem foi feita pra que a espera SEJA sentida sem virar
// castigo (uma batida = 30s de relógio real; ver ui/tempoReal.js):
//
//   base da classe .... 1 mês pra fardar tropa, 20 pra um porta-aviões. É a
//                       diferença entre encomendar fuzil e encomendar uma década
//                       de obra naval — se os dois saíssem juntos, a classe do
//                       equipamento não significaria nada.
//   tamanho do lote ... +35% por DOBRA do passo da unidade (log2). Pedir 2 caças ou
//                       20 não pode custar o mesmo tempo, mas também não pode ser
//                       linear: fábrica de verdade ganha ritmo em série.
//   indústria do FORNECEDOR ... ×1.35 (cap 0) a ×0.65 (cap 100). Comprar de quem
//                       tem parque industrial de ponta chega quase pela metade do
//                       tempo de comprar de quem improvisa — e é isso que faz a
//                       Coreia entregar em meses o que a Alemanha entrega em anos.
//
// Clamp 1–36 meses: nada é instantâneo e nada passa de três anos, senão o pedido
// deixa de ser uma decisão e vira uma aposta que ninguém vive pra ver.
export function tempoDeProducao(unidadeId, qtd = 1, estado = null, isoFornecedor = null) {
  const classe = CLASSE_ENCOMENDAVEL[unidadeId];
  if (!classe) return 1;
  const passo = UNIDADE_POR_ID[unidadeId]?.passo || 1;
  const dobras = Math.max(0, Math.log2(Math.max(1, qtd) / passo));
  let t = classe.meses * (1 + 0.35 * dobras);
  if (estado && isoFornecedor) {
    const cap = capacidadeIndustrialDe(estado, isoFornecedor);
    t *= clamp(1.35 - (cap / 100) * 0.7, 0.65, 1.35);
  }
  return clamp(Math.round(t), 1, 36);
}

// ── PREÇO ─────────────────────────────────────────────────────────────
// Governo com governo não paga ágio de tabela: 10% abaixo do preço que o mesmo item
// sairia do NPC. É o incentivo pra procurar um humano em vez de clicar no catálogo —
// e o desconto de aliança militar (blocos.descontoMilitar) ainda entra por cima, o
// que dá um motivo econômico concreto pra manter o pacto de pé.
export function precoDeEncomenda(estado, { iso, itemId, unidadeId }) {
  const item = itemId ? ARSENAL_POR_ID[itemId] : null;
  let base = item ? item.preco : (PRECO[unidadeId] || 0);
  // Relação ruim encarece: quem te vende sem gostar de você cobra o risco.
  const rel = relacaoCom(estado, iso);
  if (rel < 0) base *= 1.15;
  const desc = descontoMilitar(estado).fracao;
  return round6(base * 0.9 * (1 - Math.min(0.4, desc)));
}

// ── O ESTADO ──────────────────────────────────────────────────────────
// Uma lista só, serializável no autosave. Cada lado guarda a MESMA encomenda com o
// MESMO id (gerado pelo comprador); quem sou eu nela sai de `de`/`para`, não de um
// campo duplicado que a primeira dessincronização deixaria mentindo.
//
// status: pendente → producao → entregue
//                  ↘ recusado   ↘ calote
//                               ↘ expirado (fornecedor sumiu da sala)
function lista(estado) {
  estado.encomendas = estado.encomendas || [];
  return estado.encomendas;
}
export function encomendas(estado) { return lista(estado); }
export function encomendaPorId(estado, id) { return lista(estado).find((p) => p.id === id) || null; }

export function pedidosRecebidos(estado) {
  const eu = estado.iso || 'USA';
  return lista(estado).filter((p) => p.para === eu);
}
export function pedidosEnviados(estado) {
  const eu = estado.iso || 'USA';
  return lista(estado).filter((p) => p.de === eu);
}
export function pedidosAguardandoMinhaResposta(estado) {
  return pedidosRecebidos(estado).filter((p) => p.status === 'pendente');
}
// Quanto do meu caixa está preso em entradas de encomendas ainda não respondidas.
export function caixaEmEncomendas(estado) {
  const eu = estado.iso || 'USA';
  return round4(lista(estado)
    .filter((p) => p.de === eu && p.status === 'pendente')
    .reduce((a, p) => a + p.entrada, 0));
}

// ── 1. PEDIDO (lado COMPRADOR) ────────────────────────────────────────
// Debita a entrada na hora. Custódia, não pagamento: ela só vira dinheiro do
// fornecedor quando ele aprovar.
export function criarPedido(estado, { de, deNome, para, paraNome, unidadeId, itemId, nomeItem, qtd, precoUnit }) {
  if (!para || !unidadeId) return { falha: 'Pedido incompleto.' };
  if (de === para) return { falha: 'Você não encomenda de si mesmo — isso é produção nacional.' };
  const q = Math.max(1, Math.round(Number(qtd) || 0));
  const av = podeFornecer(estado, para, unidadeId);
  if (!av.pode) return { falha: av.motivo };

  const unit = Number(precoUnit) || precoDeEncomenda(estado, { iso: para, itemId, unidadeId });
  const total = round4(unit * q);
  const entrada = round4(total * ENTRADA);
  if (entrada > estado.tesouro) {
    return { falha: `A entrada de ${entrada.toFixed(3)} tri (30% do contrato) não cabe no caixa.` };
  }
  estado.tesouro = round4(estado.tesouro - entrada);

  const pedido = {
    id: `enc_${de}_${para}_${unidadeId}_${Date.now().toString(36)}`,
    de, deNome: deNome || nomeDe(de), para, paraNome: paraNome || nomeDe(para),
    unidadeId, itemId: itemId || null,
    nomeItem: nomeItem || ARSENAL_POR_ID[itemId]?.nome || UNIDADE_POR_ID[unidadeId]?.nome || unidadeId,
    qtd: q, precoUnit: unit, total, entrada, saldo: round4(total - entrada),
    status: 'pendente', motivo: null,
    meses: null, restante: null, atraso: 0,
    criadoEm: estado.turno || 0, respondidoEm: null, entregueEm: null,
  };
  lista(estado).push(pedido);
  return { ok: true, pedido };
}

// O FORNECEDOR recebe o bilhete e grava o pedido do outro lado. Nada de dinheiro
// muda aqui: o caixa dele só se mexe quando ELE decidir.
export function registrarPedidoRecebido(estado, bruto) {
  if (!bruto?.id) return null;
  const ja = encomendaPorId(estado, bruto.id);
  if (ja) return ja;
  const pedido = { ...bruto, status: 'pendente', atraso: 0 };
  lista(estado).push(pedido);
  return pedido;
}

// ── 2. APROVAÇÃO (lado FORNECEDOR) ────────────────────────────────────
// Aprovar é receber a entrada e abrir a linha. Os MESES são cravados aqui e viajam
// no bilhete de resposta — os dois lados contam o mesmo número, sem negociar relógio.
export function aprovarPedido(estado, pedidoId) {
  const p = encomendaPorId(estado, pedidoId);
  if (!p) return { falha: 'Pedido inexistente.' };
  if (p.status !== 'pendente') return { falha: 'Este pedido já foi respondido.' };
  const av = podeFornecer(estado, p.para, p.unidadeId);
  if (!av.pode) return { falha: `Você não pode mais produzir isto: ${av.motivo}` };

  const meses = tempoDeProducao(p.unidadeId, p.qtd, estado, p.para);
  p.status = 'producao';
  p.meses = meses;
  p.restante = meses;
  p.respondidoEm = estado.turno || 0;
  p.motivo = null;
  // A entrada é sua a partir de agora, e não volta mais: a fábrica parou de fazer
  // outra coisa pra fazer a dele.
  if (p.para === (estado.iso || 'USA')) estado.tesouro = round4(estado.tesouro + p.entrada);
  return { ok: true, pedido: p, meses };
}

export function recusarPedido(estado, pedidoId, motivo) {
  const p = encomendaPorId(estado, pedidoId);
  if (!p) return { falha: 'Pedido inexistente.' };
  if (p.status !== 'pendente') return { falha: 'Este pedido já foi respondido.' };
  p.status = 'recusado';
  p.motivo = motivo || 'Sem justificativa.';
  p.respondidoEm = estado.turno || 0;
  // Recusar armar alguém não é neutro: quem pediu registrou o não.
  const k = chaveRelDe(estado, p.de);
  if (k) estado[k] = clamp((estado[k] || 0) - 5, -100, 100);
  return { ok: true, pedido: p };
}

// A resposta chega ao COMPRADOR. Aprovada, ele passa a contar os mesmos meses;
// recusada, a entrada volta inteira (não se produziu nada).
export function aplicarResposta(estado, { id, aceito, motivo, meses }) {
  const p = encomendaPorId(estado, id);
  if (!p || p.status !== 'pendente') return null;
  p.respondidoEm = estado.turno || 0;
  if (aceito) {
    p.status = 'producao';
    p.meses = Math.max(1, Number(meses) || tempoDeProducao(p.unidadeId, p.qtd, estado, p.para));
    p.restante = p.meses;
    return p;
  }
  p.status = 'recusado';
  p.motivo = motivo || 'Recusado sem justificativa.';
  if (p.de === (estado.iso || 'USA')) estado.tesouro = round4(estado.tesouro + p.entrada);
  return p;
}

// Desistir depois de aprovado CUSTA a entrada: a linha já está rodando. Antes da
// resposta, a entrada volta — ainda não havia contrato, havia proposta.
export function cancelarEncomenda(estado, pedidoId) {
  const p = encomendaPorId(estado, pedidoId);
  if (!p || p.de !== (estado.iso || 'USA')) return { falha: 'Não é um pedido seu.' };
  if (p.status === 'pendente') {
    p.status = 'cancelado';
    estado.tesouro = round4(estado.tesouro + p.entrada);
    p.motivo = 'Você retirou a proposta antes da resposta — a entrada voltou.';
    return { ok: true, pedido: p, devolvido: p.entrada };
  }
  if (p.status === 'producao') {
    p.status = 'cancelado';
    p.motivo = 'Você cancelou com a linha rodando. A entrada ficou com o fabricante.';
    return { ok: true, pedido: p, devolvido: 0 };
  }
  return { falha: 'Este pedido já se encerrou.' };
}

// ── 3. A LINHA DE PRODUÇÃO (uma batida do mundo) ──────────────────────
// Roda nos DOIS clientes, mas com papéis diferentes, e é essa divisão que faz o
// relay burro funcionar:
//   • sou o FORNECEDOR → a linha é minha. Chegou a zero, a carga está pronta e eu
//     aviso o comprador (`prontas` — o chamador emite `pedido_entregue`).
//   • sou o COMPRADOR → a barra só anda pra eu VER. Quem embarca é ele. Se o prazo
//     vencer e nenhum bilhete chegar (fornecedor saiu da sala), depois de
//     TOLERANCIA_ATRASO batidas eu dou a linha por perdida e reavo a entrada.
//
// Devolve { prontas, expiradas } — as prontas são as que ENTREGARAM do meu lado de
// fornecedor; as expiradas, as minhas compras que morreram sem embarque.
export function tickEncomendas(estado) {
  const eu = estado.iso || 'USA';
  const prontas = [];
  const expiradas = [];
  for (const p of lista(estado)) {
    if (p.status !== 'producao') continue;
    p.restante = Math.max(0, (p.restante ?? p.meses ?? 1) - 1);
    if (p.restante > 0) continue;
    if (p.para === eu) {
      p.status = 'pronto';                 // pronto no pátio, esperando o pagamento final
      prontas.push(p);
    } else if (p.de === eu) {
      p.atraso = (p.atraso || 0) + 1;
      if (p.atraso > TOLERANCIA_ATRASO) {
        p.status = 'expirado';
        p.motivo = `${p.paraNome} sumiu do mapa com a sua encomenda. A entrada voltou.`;
        estado.tesouro = round4(estado.tesouro + p.entrada);
        expiradas.push(p);
      }
    }
  }
  return { prontas, expiradas };
}

// ── 4. ENTREGA E PAGAMENTO FINAL (lado COMPRADOR) ─────────────────────
// O momento da verdade: os 70% vencem AGORA. Tem caixa, a carga entra no arsenal.
// Não tem, é calote — e o calote é uma escolha do mundo, não um bug: meses se passaram
// e o seu caixa é outro. Devolve { pago } pro chamador avisar o fornecedor.
export function receberEntrega(estado, pedidoId) {
  const p = encomendaPorId(estado, pedidoId);
  if (!p) return { falha: 'Encomenda desconhecida.' };
  if (p.status === 'entregue' || p.status === 'calote') return { falha: 'Já resolvida.' };
  p.entregueEm = estado.turno || 0;
  p.restante = 0;
  if (estado.tesouro < p.saldo) {
    p.status = 'calote';
    p.motivo = `Sem caixa para os ${p.saldo.toFixed(3)} tri finais. A carga não embarcou e ${p.paraNome} ficou com tudo.`;
    const k = chaveRelDe(estado, p.para);
    if (k) estado[k] = clamp((estado[k] || 0) - 25, -100, 100);
    return { ok: true, pago: false, pedido: p };
  }
  estado.tesouro = round4(estado.tesouro - p.saldo);
  aplicarForcas(estado.forcas, { [p.unidadeId]: p.qtd });
  p.status = 'entregue';
  p.motivo = `Entregue e quitado: ${p.saldo.toFixed(3)} tri no embarque.`;
  const k = chaveRelDe(estado, p.para);
  if (k) estado[k] = clamp((estado[k] || 0) + 6, -100, 100);   // negócio cumprido aproxima
  return { ok: true, pago: true, pedido: p };
}

// O desfecho do pagamento chega ao FORNECEDOR. Pagou: entra o saldo. Deu calote: o
// material fica com ele (já está pronto, e é dele por direito) e a relação desaba.
// Ficar com um lote de caças que você não pediu não é prêmio — é capital parado
// que você agora precisa usar ou vender.
export function aplicarPagamento(estado, { id, pago, motivo }) {
  const p = encomendaPorId(estado, id);
  if (!p || p.para !== (estado.iso || 'USA')) return null;
  p.entregueEm = estado.turno || 0;
  if (pago) {
    estado.tesouro = round4(estado.tesouro + p.saldo);
    p.status = 'entregue';
    p.motivo = motivo || `${p.deNome} quitou o contrato no embarque.`;
    const k = chaveRelDe(estado, p.de);
    if (k) estado[k] = clamp((estado[k] || 0) + 6, -100, 100);
    return p;
  }
  p.status = 'calote';
  p.motivo = motivo || `${p.deNome} não pagou o saldo. O lote ficou no pátio — e agora é nosso.`;
  aplicarForcas(estado.forcas, { [p.unidadeId]: p.qtd });
  const k = chaveRelDe(estado, p.de);
  if (k) estado[k] = clamp((estado[k] || 0) - 25, -100, 100);
  return p;
}

// ── LEITURA PRA UI ────────────────────────────────────────────────────
// Um pedido tem quatro números que a tela precisa: quanto falta de tempo, quanto
// já andou (em %), quanto foi pago e quanto vence. Centralizado aqui pra os dois
// painéis (recebidos e enviados) não calcularem cada um do seu jeito.
export function progressoDe(pedido) {
  const total = Math.max(1, pedido.meses || 1);
  const feito = total - Math.max(0, pedido.restante ?? total);
  return {
    pct: clamp(Math.round((feito / total) * 100), 0, 100),
    restante: Math.max(0, pedido.restante ?? total),
    total,
  };
}

// Um pedido é "vivo" (ocupa espaço na tela e no dinheiro) enquanto não fechou.
export const STATUS_VIVO = new Set(['pendente', 'producao', 'pronto']);
export function vivos(l) { return l.filter((p) => STATUS_VIVO.has(p.status)); }
export function encerrados(l) { return l.filter((p) => !STATUS_VIVO.has(p.status)); }

// O aviso que o fornecedor precisa ver ANTES de aprovar. Vender pra quem está em
// guerra com você não é ilegal no jogo — é burrice documentada, e a tela tem que
// dizer isso na cara em vez de deixar o clique acontecer no automático.
export function alertaDeVenda(estado, pedido) {
  const emGuerra = (estado.emGuerra || []).includes(pedido.de);
  const rel = relacaoCom(estado, pedido.de);
  if (emGuerra) {
    return { tom: 'perigo', texto: `VOCÊ ESTÁ EM GUERRA COM ${String(pedido.deNome || '').toUpperCase()}. Este material vai ser usado contra você.` };
  }
  if (rel <= -30) {
    return { tom: 'perigo', texto: `Relação ${rel}: ${pedido.deNome} é hostil. O que sair da sua fábrica hoje aponta pra você amanhã.` };
  }
  if (rel < 20) {
    return { tom: 'aviso', texto: `Relação ${rel}. Não é aliado — é cliente. Armar um neutro é apostar em qual lado ele escolhe depois.` };
  }
  return { tom: 'ok', texto: `Relação ${rel}. Fornecer arma a um parceiro amarra os dois: ele passa a depender das suas peças.` };
}

export { nomeDe as nomePais };
