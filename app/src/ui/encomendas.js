// ═══════════════════════════════════════════════════════════════════════
// ENCOMENDAS — a tela onde se decide armar (ou não armar) outro governo
// ═══════════════════════════════════════════════════════════════════════
// O motor (jogo/encomendas.js) já resolve dinheiro, prazo e calote. O que faltava era
// o LUGAR onde a decisão acontece — e uma encomenda tem DOIS lados que não podem ser
// desenhados do mesmo jeito:
//
//   RECEBIDOS (eu fabrico) → é um julgamento moral com prazo. A tela existe pra você
//     não clicar APROVAR no automático: o aviso de guerra/hostilidade vem ANTES dos
//     botões, em faixa vermelha, ocupando espaço. Armar um inimigo continua permitido —
//     só não pode ser feito por distração.
//   MEUS PEDIDOS (eu compro) → é uma espera. Aqui o protagonista é a BARRA: você pagou
//     30%, a fábrica é de outra pessoa, e a única coisa que você tem é o tempo andando.
//     Por isso o prazo restante em meses vem em corpo grande, e o custo de desistir
//     aparece à vista antes do clique — desistir com a linha rodando queima a entrada.
//
// ── AUTORIDADE: este painel NÃO fala com a rede ───────────────────────
// Ele aplica a decisão no estado local (o motor) e devolve o resultado por callback.
// Quem emite o bilhete é o dono da conexão (ui/jogo.js), porque só ele sabe se a sala
// existe. Assim o painel funciona idêntico offline, em teste e num save carregado —
// e nenhuma tela fica dependendo de um `net` que pode ser null.
import '../estilo-encomendas.css';
import { ico } from './icones.js';
import { dinheiro } from '../jogo/formato.js';
import { bandeira, ISO2_DE, FOTO_UNIDADE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import {
  pedidosRecebidos, pedidosEnviados, pedidosAguardandoMinhaResposta,
  progressoDe, vivos, encerrados, caixaEmEncomendas, alertaDeVenda,
  aprovarPedido, recusarPedido, cancelarEncomenda, tempoDeProducao, ENTRADA,
} from '../jogo/encomendas.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const flag = (iso, t = 40) => (ISO2_DE[iso] ? `<img class="enc-flag" src="${bandeira(ISO2_DE[iso], t)}" alt="">` : '');
const meses = (n) => `${n} ${n === 1 ? 'mês' : 'meses'}`;

// O vocabulário de status em UMA tabela. Se cada painel inventasse o próprio rótulo,
// "pronto" viraria três palavras diferentes na mesma tela.
const SELO = {
  pendente:  { rot: 'AGUARDANDO DECISÃO', cor: 'var(--ambar)', ic: 'clock' },
  producao:  { rot: 'EM PRODUÇÃO',        cor: 'var(--cyan)',  ic: 'factory' },
  pronto:    { rot: 'PRONTO NO PÁTIO',    cor: 'var(--verde)', ic: 'package-check' },
  entregue:  { rot: 'ENTREGUE',           cor: 'var(--verde)', ic: 'check' },
  recusado:  { rot: 'RECUSADO',           cor: 'var(--perigo)', ic: 'x' },
  cancelado: { rot: 'CANCELADO',          cor: 'var(--ambar)', ic: 'undo-2' },
  calote:    { rot: 'CALOTE',             cor: 'var(--perigo)', ic: 'triangle-alert' },
  expirado:  { rot: 'CONTRATO PERDIDO',   cor: 'var(--fraco)', ic: 'ban' },
};
const selo = (st) => SELO[st] || { rot: String(st || '').toUpperCase(), cor: 'var(--fraco)', ic: 'circle' };

// As três justificativas de recusa. São CANNED de propósito: texto livre entre jogadores
// já existe no chat e no telefone — aqui o que importa é o registro diplomático, e três
// motivos fechados dizem mais (e mais rápido) do que uma caixa de texto vazia.
const MOTIVOS = [
  { id: 'inimigo',  txt: 'Não armamos quem pode apontar isso para nós.' },
  { id: 'fila',     txt: 'A fila nacional vem primeiro. Nossa indústria não é sua.' },
  { id: 'silencio', txt: 'Recusado sem justificativa.' },
];

// ═══════════════════════════════════════════════════════════════════════
// PAINEL
// ═══════════════════════════════════════════════════════════════════════
// abrirEncomendas(jogo, opcoes) → { atualizar, fechar }
//   aba          'recebidos' | 'enviados'  (default 'recebidos')
//   onFim()                      — chamado ao fechar
//   onResponder(pedido, resp)    — EU decidi como fornecedor. resp = { aceito, motivo, meses }
//   onCancelar(pedido)           — EU desisti como comprador
//   onMudou()                    — qualquer coisa que mexeu no caixa/estado (pra HUD)
// O retorno tem `atualizar()` de propósito: a produção só anda nas batidas do mundo, e
// quem sabe que uma batida aconteceu é ui/jogo.js — não faz sentido este painel manter
// um setInterval próprio adivinhando o relógio do jogo.
export function abrirEncomendas(jogo, { aba = 'recebidos', onFim, onResponder, onCancelar, onMudou } = {}) {
  let recusando = null;    // id do pedido com as justificativas abertas
  let confirmando = null;  // id do pedido de compra com o custo de cancelar à vista

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);

  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);

  function render() {
    const b = badgeEncomendas(jogo.estado);
    const preso = caixaEmEncomendas(jogo.estado);
    modal.innerHTML = `<div class="enc-painel">
      <div class="enc-cab">
        <span class="enc-cab-ic">${ico('factory', 22)}</span>
        <div class="enc-tit">
          <h2>Encomendas Militares</h2>
          <div class="enc-sub">Contrato entre governos · ${Math.round(ENTRADA * 100)}% na assinatura, ${Math.round((1 - ENTRADA) * 100)}% no embarque</div>
        </div>
        <div class="enc-caixa">
          <span>Caixa</span><b>${dinheiro(jogo.estado.tesouro)}</b>
          ${preso > 0 ? `<i>${dinheiro(preso)} de entrada em propostas sem resposta</i>` : ''}
        </div>
        <button class="pp-fechar" id="enc-x" title="Fechar (Esc)">${ico('x', 16)}</button>
      </div>
      <div class="enc-abas">
        <button class="enc-aba ${aba === 'recebidos' ? 'on' : ''}" data-a="recebidos">
          ${ico('inbox', 14)} Pedidos recebidos${b.aguardando ? ` <i class="urg">${b.aguardando}</i>` : b.recebidos ? ` <i>${b.recebidos}</i>` : ''}
        </button>
        <button class="enc-aba ${aba === 'enviados' ? 'on' : ''}" data-a="enviados">
          ${ico('truck', 14)} Meus pedidos${b.enviados ? ` <i>${b.enviados}</i>` : ''}
        </button>
      </div>
      <div class="enc-corpo">${aba === 'recebidos' ? corpoRecebidos() : corpoEnviados()}</div>
    </div>`;

    modal.querySelector('#enc-x').addEventListener('click', fechar);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });
    modal.querySelectorAll('.enc-aba').forEach((el) => el.addEventListener('click', () => {
      aba = el.dataset.a; recusando = null; confirmando = null; render();
    }));
    if (aba === 'recebidos') ligarRecebidos(); else ligarEnviados();
  }

  // ── RECEBIDOS (sou a fábrica) ───────────────────────────────────────
  function corpoRecebidos() {
    const todos = pedidosRecebidos(jogo.estado);
    const abertos = vivos(todos);
    const hist = encerrados(todos);
    if (!todos.length) {
      return vazio('inbox', 'Ninguém encomendou nada de você',
        'Quando outro governo quiser comprar da SUA indústria, o pedido chega aqui — com o nome de quem pede, o que ele quer e o que a sua relação com ele diz sobre isso. Aprovar é abrir a linha de montagem; recusar é dizer não com todas as letras.');
    }
    return `${abertos.map(cardRecebido).join('')}
      ${hist.length ? `<div class="enc-sec">${ico('history', 12)} Encerrados</div>${hist.map(cardHistorico).join('')}` : ''}`;
  }

  function cardRecebido(p) {
    const s = selo(p.status);
    const prazo = p.meses || tempoDeProducao(p.unidadeId, p.qtd, jogo.estado, p.para);
    const pr = progressoDe(p);
    const av = p.status === 'pendente' ? alertaDeVenda(jogo.estado, p) : null;
    return `<div class="enc-card ${p.status}" style="--sc:${s.cor}" data-id="${esc(p.id)}">
      <div class="enc-topo">
        ${flag(p.de)}
        <div class="enc-quem">
          <b>${esc(p.deNome || nomeDe(p.de))}</b>
          <small>quer comprar da nossa indústria</small>
        </div>
        <div class="enc-selo">${ico(s.ic, 12)} ${s.rot}</div>
      </div>

      <div class="enc-item">
        <img class="enc-foto" src="${FOTO_UNIDADE[p.unidadeId] || ''}" alt="">
        <div class="enc-item-txt">
          <b>${p.qtd.toLocaleString('pt-BR')}× ${esc(p.nomeItem)}</b>
          <small>${dinheiro(p.precoUnit)} por unidade</small>
        </div>
        <div class="enc-nums">
          <div class="encn"><span>Contrato</span><b class="amb">${dinheiro(p.total)}</b></div>
          <div class="encn"><span>Entrada (${Math.round(ENTRADA * 100)}%)</span><b class="bom">${dinheiro(p.entrada)}</b></div>
          <div class="encn"><span>No embarque</span><b>${dinheiro(p.saldo)}</b></div>
          <div class="encn"><span>${p.status === 'pendente' ? 'Prazo estimado' : 'Linha'}</span><b class="cy">${meses(prazo)}</b></div>
        </div>
      </div>

      ${p.status === 'pendente' ? `
        <div class="enc-alerta ${av.tom}">${ico(av.tom === 'perigo' ? 'triangle-alert' : av.tom === 'aviso' ? 'info' : 'handshake', 15)}<span>${esc(av.texto)}</span></div>
        ${recusando === p.id ? `
          <div class="enc-motivos">
            <div class="enc-motivos-rot">Com que palavras?</div>
            ${MOTIVOS.map((m) => `<button class="enc-motivo" data-rec="${esc(p.id)}" data-m="${m.id}">${esc(m.txt)}</button>`).join('')}
            <button class="enc-voltar" data-volta="1">${ico('undo-2', 12)} voltar</button>
          </div>
        ` : `
          <div class="enc-acoes">
            <button class="enc-sim" data-ok="${esc(p.id)}">${ico('check', 14)} APROVAR — LINHA DE ${meses(prazo).toUpperCase()}</button>
            <button class="enc-nao" data-nao="${esc(p.id)}">${ico('x', 14)} RECUSAR</button>
          </div>
          <div class="enc-nota">${ico('info', 12)} Aprovando, os ${dinheiro(p.entrada)} de entrada entram no caixa AGORA e não voltam — nem se ele desistir depois.</div>
        `}
      ` : ''}

      ${p.status === 'producao' ? `
        ${barra(pr, `Fabricando para ${esc(p.deNome || nomeDe(p.de))}`)}
        <div class="enc-nota">${ico('clock', 12)} Faltam ${meses(pr.restante)} para o embarque. Os ${dinheiro(p.saldo)} finais só entram se o caixa dele aguentar no dia.</div>
      ` : ''}

      ${p.status === 'pronto' ? `
        <div class="enc-nota ok">${ico('package-check', 12)} O lote está no pátio esperando ${esc(p.deNome || nomeDe(p.de))} pagar os ${dinheiro(p.saldo)} restantes. Se ele não pagar, o material fica com você.</div>
      ` : ''}
    </div>`;
  }

  function ligarRecebidos() {
    modal.querySelectorAll('[data-ok]').forEach((btn) => btn.addEventListener('click', () => {
      const p = pedidosRecebidos(jogo.estado).find((x) => x.id === btn.dataset.ok);
      const r = aprovarPedido(jogo.estado, btn.dataset.ok);
      if (r.falha) return avisar(btn, r.falha);
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '🏭 Indústria de Defesa', cor: '#35e0ff',
        texto: `Contrato assinado com ${p.deNome || nomeDe(p.de)}: ${p.qtd}× ${p.nomeItem} em ${meses(r.meses)}. A entrada já está no caixa.` }]);
      onResponder?.(r.pedido, { aceito: true, motivo: null, meses: r.meses });
      onMudou?.(); render();
    }));
    modal.querySelectorAll('[data-nao]').forEach((btn) => btn.addEventListener('click', () => {
      recusando = btn.dataset.nao; render();
    }));
    modal.querySelectorAll('[data-volta]').forEach((btn) => btn.addEventListener('click', () => { recusando = null; render(); }));
    modal.querySelectorAll('[data-rec]').forEach((btn) => btn.addEventListener('click', () => {
      const motivo = MOTIVOS.find((m) => m.id === btn.dataset.m)?.txt || null;
      const p = pedidosRecebidos(jogo.estado).find((x) => x.id === btn.dataset.rec);
      const r = recusarPedido(jogo.estado, btn.dataset.rec, motivo);
      if (r.falha) return avisar(btn, r.falha);
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '🏭 Indústria de Defesa', cor: '#ffb020',
        texto: `Negamos o material a ${p.deNome || nomeDe(p.de)}. Um "não" desses não se esquece — e ele vai procurar outro fornecedor.` }]);
      onResponder?.(r.pedido, { aceito: false, motivo, meses: null });
      recusando = null; onMudou?.(); render();
    }));
  }

  // ── ENVIADOS (sou o comprador esperando) ────────────────────────────
  function corpoEnviados() {
    const todos = pedidosEnviados(jogo.estado);
    const abertos = vivos(todos);
    const hist = encerrados(todos);
    if (!todos.length) {
      return vazio('truck', 'Você não encomendou nada de ninguém',
        'No Mercado, quando outro presidente na sala fabrica o que você quer, aparece a opção de encomendar DELE: 10% mais barato que o catálogo e sem sorteio de aprovação — em troca de meses de espera e da boa vontade de outra pessoa.');
    }
    return `${abertos.map(cardEnviado).join('')}
      ${hist.length ? `<div class="enc-sec">${ico('history', 12)} Encerrados</div>${hist.map(cardHistorico).join('')}` : ''}`;
  }

  function cardEnviado(p) {
    const s = selo(p.status);
    const pr = progressoDe(p);
    return `<div class="enc-card ${p.status}" style="--sc:${s.cor}" data-id="${esc(p.id)}">
      <div class="enc-topo">
        ${flag(p.para)}
        <div class="enc-quem">
          <b>${esc(p.paraNome || nomeDe(p.para))}</b>
          <small>${p.status === 'pendente' ? 'ainda não respondeu' : 'é o nosso fornecedor'}</small>
        </div>
        <div class="enc-selo">${ico(s.ic, 12)} ${s.rot}</div>
      </div>

      <div class="enc-item">
        <img class="enc-foto" src="${FOTO_UNIDADE[p.unidadeId] || ''}" alt="">
        <div class="enc-item-txt">
          <b>${p.qtd.toLocaleString('pt-BR')}× ${esc(p.nomeItem)}</b>
          <small>${dinheiro(p.precoUnit)} por unidade</small>
        </div>
        <div class="enc-nums">
          <div class="encn"><span>Contrato</span><b class="amb">${dinheiro(p.total)}</b></div>
          <div class="encn"><span>Já pago</span><b class="bom">${dinheiro(p.entrada)}</b></div>
          <div class="encn"><span>Vence na entrega</span><b class="${jogo.estado.tesouro < p.saldo ? 'ruim' : ''}">${dinheiro(p.saldo)}</b></div>
        </div>
      </div>

      ${p.status === 'producao' ? barra(pr, `Linha de montagem em ${esc(p.paraNome || nomeDe(p.para))}`) : ''}
      ${p.status === 'producao' && jogo.estado.tesouro < p.saldo
        ? `<div class="enc-alerta perigo">${ico('triangle-alert', 15)}<span>O seu caixa hoje não cobre os ${dinheiro(p.saldo)} do embarque. Se chegar assim no dia, a carga não sai e você perde tudo o que já pagou.</span></div>` : ''}
      ${p.status === 'pronto' ? `<div class="enc-nota ok">${ico('package-check', 12)} A carga está pronta. Falta o embarque — e os ${dinheiro(p.saldo)} finais.</div>` : ''}

      ${p.status === 'pendente' || p.status === 'producao' ? (confirmando === p.id ? `
        <div class="enc-conf">
          <span>${p.status === 'producao'
            ? `A linha já está rodando: cancelar QUEIMA os ${dinheiro(p.entrada)} da entrada e não devolve nada.`
            : `Ainda não houve resposta: a entrada de ${dinheiro(p.entrada)} volta inteira para o caixa.`}</span>
          <button class="enc-conf-ok" data-cancel="${esc(p.id)}">${ico('check', 12)} CONFIRMAR</button>
          <button class="enc-voltar" data-volta="1">voltar</button>
        </div>
      ` : `
        <div class="enc-acoes">
          <button class="enc-cancelar" data-pede="${esc(p.id)}">${ico('undo-2', 13)}
            CANCELAR — ${p.status === 'producao' ? `PERCO ${dinheiro(p.entrada)}` : `RECEBO ${dinheiro(p.entrada)} DE VOLTA`}</button>
        </div>
      `) : ''}
    </div>`;
  }

  function ligarEnviados() {
    modal.querySelectorAll('[data-pede]').forEach((b) => b.addEventListener('click', () => { confirmando = b.dataset.pede; render(); }));
    modal.querySelectorAll('[data-volta]').forEach((b) => b.addEventListener('click', () => { confirmando = null; render(); }));
    modal.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', () => {
      const p = pedidosEnviados(jogo.estado).find((x) => x.id === b.dataset.cancel);
      const r = cancelarEncomenda(jogo.estado, b.dataset.cancel);
      if (r.falha) return avisar(b, r.falha);
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '📉 Chancelaria', cor: '#ffb020',
        texto: `Cancelamos a encomenda de ${p.qtd}× ${p.nomeItem} com ${p.paraNome || nomeDe(p.para)}.${r.devolvido ? '' : ' A entrada ficou lá.'}` }]);
      onCancelar?.(r.pedido);
      confirmando = null; onMudou?.(); render();
    }));
  }

  // ── PEÇAS COMUNS ────────────────────────────────────────────────────
  function cardHistorico(p) {
    const s = selo(p.status);
    const eu = jogo.estado.iso || 'USA';
    const outro = p.de === eu ? (p.paraNome || nomeDe(p.para)) : (p.deNome || nomeDe(p.de));
    return `<div class="enc-hist ${p.status}" style="--sc:${s.cor}">
      ${flag(p.de === eu ? p.para : p.de)}
      <div class="enc-hist-txt">
        <b>${p.qtd.toLocaleString('pt-BR')}× ${esc(p.nomeItem)}</b>
        <small>${esc(outro)} · ${dinheiro(p.total)}</small>
        ${p.motivo ? `<i>${esc(p.motivo)}</i>` : ''}
      </div>
      <div class="enc-selo">${ico(s.ic, 12)} ${s.rot}</div>
    </div>`;
  }

  function vazio(icone, titulo, texto) {
    return `<div class="enc-vazio">${ico(icone, 34)}<b>${esc(titulo)}</b><span>${esc(texto)}</span></div>`;
  }

  // Erro do motor mostrado NO BOTÃO que falhou, não num alert que rouba a tela. O
  // jogador precisa saber por que aquele clique não pegou, ali, sem perder o contexto.
  function avisar(btn, txt) {
    const antes = btn.innerHTML;
    btn.classList.add('falhou');
    btn.innerHTML = esc(txt);
    setTimeout(() => { btn.classList.remove('falhou'); btn.innerHTML = antes; }, 2600);
  }

  render();
  return { atualizar: render, fechar };
}

// A barra é a peça central deste sistema: é o único jeito de fazer "meses" — que aqui
// são batidas de 30s — parecerem tempo de verdade. Os meses restantes vêm em corpo
// grande porque é o número que o jogador realmente quer, e a régua de meses embaixo dá
// a noção de quanto já foi.
function barra(pr, rotulo) {
  return `<div class="enc-linha">
    <div class="enc-linha-cab"><span>${rotulo}</span><b>${pr.pct}%</b></div>
    <div class="enc-barra"><i style="width:${pr.pct}%"></i></div>
    <div class="enc-linha-pe">
      <span>${pr.restante > 0 ? 'faltam' : 'concluída'}</span>
      ${pr.restante > 0 ? `<b>${pr.restante}</b><span>${pr.restante === 1 ? 'mês' : 'meses'} de ${pr.total}</span>` : ''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// CARTÃO DE NOTIFICAÇÃO — o pedido novo que chega enquanto você joga
// ═══════════════════════════════════════════════════════════════════════
// cartaoPedidoRecebido(jogo, pedido, opcoes) → { fechar }
//   onResponder(pedido, { aceito, motivo, meses })  — mesma assinatura do painel
//   onAbrirPainel()                                  — "ver no painel" (adiar a decisão)
//   segundos = 30                                    — timer até o silêncio decidir
//
// Segue o padrão `.onl-alerta` (ui/online.js) de propósito: pedido de material é do
// mesmo naipe de proposta de aliança — chega sem avisar, tem dois botões e um relógio.
// A diferença de DESIGN é o que o timer faz ao zerar: aliança expirada vira recusa, e
// aqui NÃO. Expirar só fecha o cartão; o pedido continua pendente no painel. Recusar
// alguém tem custo diplomático (-5 de relação no motor) e ninguém deve pagar isso por
// ter ido buscar café.
export function cartaoPedidoRecebido(jogo, pedido, { onResponder, onAbrirPainel, segundos = 30 } = {}) {
  document.querySelectorAll('.onl-alerta.enc-cartao').forEach((e) => e.remove());
  const av = alertaDeVenda(jogo.estado, pedido);
  const prazo = tempoDeProducao(pedido.unidadeId, pedido.qtd, jogo.estado, pedido.para);
  const cor = av.tom === 'perigo' ? '#ff3b5c' : av.tom === 'aviso' ? '#ffb020' : '#35e0ff';

  const el = document.createElement('div');
  el.className = `onl-alerta enc-cartao ${av.tom === 'perigo' ? 'urgente' : ''}`;
  el.style.setProperty('--oc', cor);
  el.innerHTML = `
    <div class="onl-cab">${ico('factory', 15)} <b>${esc(pedido.deNome || nomeDe(pedido.de))}</b> <span>QUER COMPRAR DE VOCÊ</span></div>
    <div class="onl-txt">
      <b>${pedido.qtd.toLocaleString('pt-BR')}× ${esc(pedido.nomeItem)}</b> por ${dinheiro(pedido.total)} —
      ${dinheiro(pedido.entrada)} entram na assinatura, o resto no embarque, em ${meses(prazo)}.
    </div>
    <div class="enc-cartao-av ${av.tom}">${ico(av.tom === 'perigo' ? 'triangle-alert' : 'info', 12)} ${esc(av.texto)}</div>
    <div class="onl-timer"><i style="animation-duration:${segundos}s"></i></div>
    <div class="onl-acoes">
      <button class="onl-sim">${ico('check', 14)} APROVAR</button>
      <button class="onl-nao">${ico('x', 14)} RECUSAR</button>
    </div>
    <button class="enc-cartao-depois">${ico('clock', 11)} DECIDIR NO PAINEL</button>`;
  document.body.appendChild(el);

  let t = null;
  const fechar = () => { clearTimeout(t); el.remove(); };
  const decidir = (aceito) => {
    if (aceito) {
      const r = aprovarPedido(jogo.estado, pedido.id);
      if (!r.falha) onResponder?.(r.pedido, { aceito: true, motivo: null, meses: r.meses });
    } else {
      const motivo = MOTIVOS[0].txt;
      const r = recusarPedido(jogo.estado, pedido.id, motivo);
      if (!r.falha) onResponder?.(r.pedido, { aceito: false, motivo, meses: null });
    }
    fechar();
  };
  el.querySelector('.onl-sim').addEventListener('click', () => decidir(true));
  el.querySelector('.onl-nao').addEventListener('click', () => decidir(false));
  el.querySelector('.enc-cartao-depois').addEventListener('click', () => { fechar(); onAbrirPainel?.(); });
  t = setTimeout(fechar, segundos * 1000);   // silêncio NÃO é recusa: o pedido fica no painel
  return { fechar };
}

// ═══════════════════════════════════════════════════════════════════════
// BADGE — os números que o cabeçalho precisa
// ═══════════════════════════════════════════════════════════════════════
// badgeEncomendas(estado) → { recebidos, enviados, emProducao, aguardando, prontos, total }
//   aguardando → pedidos parados esperando a MINHA decisão. É o único número urgente
//                (alguém do outro lado está olhando a tela dele esperando você).
//   emProducao → linhas rodando nos dois papéis: é a contagem de barras andando.
//   prontos    → lotes prontos no meu pátio esperando o comprador pagar.
//   total      → soma pra pintar o pontinho no botão quando há QUALQUER coisa viva.
export function badgeEncomendas(estado) {
  const rec = vivos(pedidosRecebidos(estado));
  const env = vivos(pedidosEnviados(estado));
  return {
    recebidos: rec.length,
    enviados: env.length,
    aguardando: pedidosAguardandoMinhaResposta(estado).length,
    emProducao: [...rec, ...env].filter((p) => p.status === 'producao').length,
    prontos: rec.filter((p) => p.status === 'pronto').length,
    total: rec.length + env.length,
  };
}
