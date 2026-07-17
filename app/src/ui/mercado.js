// ═══════════════════════════════════════════════════════════════════════
// MERCADO INTERNACIONAL DE ARMAS
// ═══════════════════════════════════════════════════════════════════════
// A versão anterior vendia "Caças — US$ 8 bi/un" numa grade de fotos genéricas.
// Funcionava, e não dizia nada: comprar caça era escolher um número.
//
// Agora você navega 67 sistemas reais — F-35, Su-57, Rafale, Bayraktar, S-400 —
// cada um com bandeira de origem, fabricante, geração e POLÍTICA DE EXPORTAÇÃO.
// A pergunta deixou de ser "quanto custa" e virou "eles vendem PRA MIM?".
//
// LAYOUT (o pedido era "sem bagunça, limpo"):
//   coluna esquerda → categorias
//   centro          → grade de cards com foto, bandeira e selo de política
//   direita         → ficha do item + ação
import { UNIDADES, aplicarForcas } from '../dados/forcas.js';
import { ARSENAL, arsenalDaUnidade, POLITICAS, podeComprar, precoEfetivo } from '../dados/arsenal.js';
import { solicitar, cancelarPedido, pedidosPendentes, relacaoCom, caixaEmCustodia, historicoPedidos, resumoPedidos } from '../jogo/compras.js';
import { precoVendaBase, compradores, melhorOferta } from '../dados/mercado.js';
import { bandeira, ISO2_DE, FOTO_UNIDADE } from '../dados/imagens.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { PAISES } from '../dados/paises.js';
import { dinheiro } from '../jogo/formato.js';
import { ico, ICO } from './icones.js';
import { tipAttr } from './tip.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PA = 1;
const round4 = (n) => Math.round(n * 1e4) / 1e4;

export function abrirMercado(jogo, { onFim } = {}) {
  let cat = 'cacas';
  let sel = null;
  let qtd = 1;
  let aba = 'comprar';
  // venda
  let selV = null; let qtdV = 0; let oferta = null; let ofertasCache = {};

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);

  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);

  const meuIso = () => jogo.estado.iso || 'USA';

  function render() {
    const pend = pedidosPendentes(jogo.estado);
    const custodia = caixaEmCustodia(jogo.estado);
    modal.innerHTML = `<div class="mk-painel">
      <div class="mk-cab">
        <span class="mk-ic">${ico('crosshair', 22)}</span>
        <div class="mk-tit">
          <h2>Mercado Internacional de Armas</h2>
          <div class="mk-sub">${ARSENAL.length} sistemas · ${new Set(ARSENAL.map((a) => a.origem)).size} países fornecedores</div>
        </div>
        <div class="mk-caixa">
          <span>Caixa</span><b>${dinheiro(jogo.estado.tesouro)}</b>
          ${custodia > 0 ? `<i>${dinheiro(custodia)} reservado no pedido</i>` : ''}
        </div>
        <button class="pp-fechar" id="mk-x" title="Fechar (Esc)">${ico('x', 16)}</button>
      </div>
      <div class="mk-abas">
        <button class="mk-aba ${aba === 'comprar' ? 'on' : ''}" data-a="comprar">${ico('package', 14)} Catálogo</button>
        <button class="mk-aba ${aba === 'pedidos' ? 'on' : ''}" data-a="pedidos">${ico('clock', 14)} Pedidos${pend.length ? ` <i>${pend.length}</i>` : ''}</button>
        <button class="mk-aba ${aba === 'vender' ? 'on' : ''}" data-a="vender">${ico('tag', 14)} Vender arsenal</button>
      </div>
      <div class="mk-corpo">${aba === 'comprar' ? corpoCatalogo() : aba === 'pedidos' ? corpoPedidos() : corpoVender()}</div>
    </div>`;

    modal.querySelector('#mk-x').addEventListener('click', fechar);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });
    modal.querySelectorAll('.mk-aba').forEach((b) => b.addEventListener('click', () => {
      aba = b.dataset.a; render();
    }));
    if (aba === 'comprar') ligarCatalogo();
    if (aba === 'pedidos') ligarPedidos();
    if (aba === 'vender') ligarVender();
  }

  // ── CATÁLOGO ────────────────────────────────────────────────────────
  function corpoCatalogo() {
    const itens = arsenalDaUnidade(cat);
    return `<div class="mk-grid">
      <nav class="mk-cats">${UNIDADES.map((u) => {
        const n = arsenalDaUnidade(u.id).length;
        if (!n) return '';
        return `<button class="mk-cat ${cat === u.id ? 'on' : ''}" data-c="${u.id}">
          <span class="mkc-ic">${ico(ICO[u.id] || 'circle', 15)}</span>
          <span class="mkc-nome">${esc(u.nome)}</span>
          <span class="mkc-n">${n}</span>
        </button>`;
      }).join('')}</nav>
      <div class="mk-lista">${itens.map((it) => cardItem(it)).join('')}</div>
      <aside class="mk-ficha" id="mk-ficha">${sel ? fichaHTML(sel) : vazioHTML()}</aside>
    </div>`;
  }

  function cardItem(it) {
    const rel = relacaoCom(jogo.estado, it.origem);
    const av = podeComprar(it, jogo.estado, rel, meuIso());
    const p = POLITICAS[it.politica];
    const preco = precoEfetivo(it, rel, meuIso());
    const bd = ISO2_DE[it.origem] ? bandeira(ISO2_DE[it.origem], 40) : null;
    return `<button class="mk-card ${sel?.id === it.id ? 'sel' : ''} ${!av.pode ? 'travado' : ''}" data-id="${it.id}">
      <div class="mkd-foto">
        <img src="${it.foto || FOTO_UNIDADE[it.unidade] || ''}" alt="" loading="lazy">
        ${bd ? `<img class="mkd-flag" src="${bd}" alt="">` : ''}
        ${av.nacional ? `<span class="mkd-selo nac">${ico('factory', 9)} NACIONAL</span>`
          : !av.pode ? `<span class="mkd-selo bloq">${ico(p.ic, 9)} ${esc(p.rot)}</span>` : ''}
      </div>
      <div class="mkd-info">
        <div class="mkd-nome">${esc(it.nome)}</div>
        <div class="mkd-fab">${esc(it.fab)}</div>
        <div class="mkd-rod">
          <span class="mkd-preco">${dinheiro(preco)}</span>
          <span class="mkd-pol" style="--pc:${p.cor}" title="${esc(p.rot)}">${ico(p.ic, 11)}</span>
        </div>
      </div>
    </button>`;
  }

  function vazioHTML() {
    return `<div class="mk-vazio">
      ${ico('crosshair', 32)}
      <b>Selecione um sistema</b>
      <span>Cada arma tem um dono, um preço e uma política. Nem tudo que você quer está à venda para você.</span>
    </div>`;
  }

  function fichaHTML(it) {
    const rel = relacaoCom(jogo.estado, it.origem);
    const av = podeComprar(it, jogo.estado, rel, meuIso());
    const p = POLITICAS[it.politica];
    const preco = precoEfetivo(it, rel, meuIso());
    const total = round4(preco * qtd);
    const bd = ISO2_DE[it.origem] ? bandeira(ISO2_DE[it.origem], 80) : null;
    const noArsenal = jogo.estado.forcas?.[it.unidade] || 0;
    const maxQ = Math.max(1, Math.min(
      Math.floor(jogo.estado.tesouro / Math.max(preco, 1e-9)),
      it.unidade === 'infantaria' ? 100000 : 400,
    ));
    const semPA = jogo.estado.pontos_acao < PA;

    return `<div class="mf">
      <div class="mf-hero">
        <img src="${it.foto || FOTO_UNIDADE[it.unidade] || ''}" alt="">
        <div class="mf-hero-txt"><h3>${esc(it.nome)}</h3><span>${esc(it.geracao)}</span></div>
      </div>
      <div class="mf-origem">
        ${bd ? `<img src="${bd}" alt="">` : ''}
        <div><b>${esc(PAISES[it.origem]?.nome || it.origem)}</b><small>${esc(it.fab)}</small></div>
        ${it.origem !== meuIso() ? `<span class="mf-rel ${rel >= 30 ? 'bom' : rel <= -30 ? 'ruim' : ''}">relação ${rel}</span>` : ''}
      </div>
      <p class="mf-desc">${esc(it.desc)}</p>
      <div class="mf-pol" style="--pc:${p.cor}">
        ${ico(p.ic, 14)}
        <div><b>${esc(p.rot)}</b><span>${esc(av.motivo)}</span></div>
      </div>
      <div class="mf-nums">
        <div class="mfn"><span>No arsenal</span><b>${noArsenal.toLocaleString('pt-BR')}</b></div>
        <div class="mfn"><span>Poder / un</span><b>${it.poder}</b></div>
        <div class="mfn"><span>Preço / un</span><b class="amb">${dinheiro(preco)}</b></div>
      </div>
      ${av.pode ? `
        <div class="mf-qtd">
          <label>Quantidade
            <input id="mf-q" class="mf-q-input" type="text" inputmode="numeric" value="${Math.min(qtd, maxQ)}"
              ${tipAttr('Clique e digite a quantidade exata que você quer — ou use a barra e os atalhos abaixo.', { t: 'Quantidade', k: 'CLIQUE PARA DIGITAR' })}>
            <span class="mf-q-de">de ${maxQ.toLocaleString('pt-BR')}</span>
          </label>
          <input type="range" id="mf-slider" min="1" max="${maxQ}" value="${Math.min(qtd, maxQ)}">
          <div class="mf-atalhos">
            ${[1, 10, 50, 100].filter((n) => n <= maxQ).map((n) => `<button class="mf-at" data-q="${n}">${n}</button>`).join('')}
            <button class="mf-at" data-q="${maxQ}">MÁX</button>
          </div>
          <div class="mf-linha"><span>Custo total</span><b class="${total > jogo.estado.tesouro ? 'ruim' : 'amb'}" id="mf-total">${dinheiro(total)}</b></div>
          <div class="mf-linha"><span>Caixa depois</span><b id="mf-depois">${dinheiro(round4(jogo.estado.tesouro - total))}</b></div>
          ${!av.nacional ? `<div class="mf-linha"><span>Chance de aprovação</span><b class="${av.chance >= 0.7 ? 'bom' : av.chance >= 0.45 ? 'amb' : 'ruim'}">${Math.round(av.chance * 100)}%</b></div>` : ''}
        </div>
        <button class="mf-btn ${av.nacional ? 'nac' : ''}" id="mf-go" ${total > jogo.estado.tesouro || semPA ? 'disabled' : ''}>
          ${ico(av.nacional ? 'factory' : 'send', 16)}
          <span id="mf-btxt">${av.nacional ? `PRODUZIR — ${dinheiro(total)}` : `SOLICITAR COMPRA — ${dinheiro(total)}`}</span>
        </button>
        ${av.nacional
          ? `<div class="mf-nota ok">${ico('check', 12)} Produção nacional: entrega imediata, 20% mais barato, e ninguém pode cortar seu fornecimento.</div>`
          : `<div class="mf-nota">${ico('info', 12)} O dinheiro fica em custódia até ${esc(PAISES[it.origem]?.nome || it.origem)} responder, no fim do turno. Se negarem, ele volta — mas a negativa vira notícia.</div>`}
        ${semPA ? `<div class="mf-nota ruim">${ico('ban', 12)} Sem pontos de ação neste turno.</div>` : ''}
      ` : `
        <div class="mf-bloq">
          ${ico('lock', 20)}
          <b>Indisponível para você</b>
          <span>${esc(av.motivo)}</span>
        </div>
        ${it.politica !== 'nunca'
          ? `<div class="mf-nota">${ico('handshake', 12)} Melhore a relação com ${esc(PAISES[it.origem]?.nome || it.origem)} — acordo comercial, ajuda ou aliança — e volte aqui.</div>`
          : `<div class="mf-nota">${ico('factory', 12)} Sistemas jamais exportados só existem para quem os constrói. A única via é desenvolver o seu.</div>`}
      `}
    </div>`;
  }

  function ligarCatalogo() {
    modal.querySelectorAll('.mk-cat').forEach((b) => b.addEventListener('click', () => {
      cat = b.dataset.c; sel = null; qtd = 1; render();
    }));
    modal.querySelectorAll('.mk-card').forEach((b) => b.addEventListener('click', () => {
      sel = ARSENAL.find((a) => a.id === b.dataset.id); qtd = 1; render();
    }));
    ligarFicha();
  }

  // Três formas de dizer "quero N": arrastar a barra, teclar o número, ou tocar um
  // atalho. As três desembocam em aplicarQtd(), que só reescreve os números — nunca
  // redesenha a ficha inteira, senão o arrasto morria a cada frame.
  function ligarFicha() {
    const sl = modal.querySelector('#mf-slider');
    const inp = modal.querySelector('#mf-q');
    if (!sl) { modal.querySelector('#mf-go')?.addEventListener('click', comprar); return; }
    const maxQ = Number(sl.max);

    const aplicarQtd = (n, { mexeuInput = true, mexeuSlider = true } = {}) => {
      qtd = Math.max(1, Math.min(maxQ, Math.round(Number(n) || 1)));
      const rel = relacaoCom(jogo.estado, sel.origem);
      const av = podeComprar(sel, jogo.estado, rel, meuIso());
      const preco = precoEfetivo(sel, rel, meuIso());
      const total = round4(preco * qtd);
      // Só NÃO reescrevemos o campo quando a mudança VEIO dele (mexeuInput:false) —
      // aí o jogador está digitando e sobrescrever brigaria com o cursor. Atalho e
      // barra sempre atualizam o número, mesmo com o campo focado.
      if (mexeuInput && inp) inp.value = qtd;
      if (mexeuSlider) sl.value = qtd;
      const elT = modal.querySelector('#mf-total');
      elT.textContent = dinheiro(total);
      elT.className = total > jogo.estado.tesouro ? 'ruim' : 'amb';
      modal.querySelector('#mf-depois').textContent = dinheiro(round4(jogo.estado.tesouro - total));
      modal.querySelector('#mf-btxt').textContent = av.nacional
        ? `PRODUZIR — ${dinheiro(total)}` : `SOLICITAR COMPRA — ${dinheiro(total)}`;
      const btn = modal.querySelector('#mf-go');
      btn.disabled = total > jogo.estado.tesouro || jogo.estado.pontos_acao < PA;
    };

    sl.addEventListener('input', () => aplicarQtd(sl.value, { mexeuSlider: false }));

    // O número é editável: clicar seleciona tudo pra sobrescrever de imediato.
    inp?.addEventListener('focus', () => inp.select());
    inp?.addEventListener('input', () => {
      const bruto = inp.value.replace(/\D/g, '');
      if (bruto === '') return;                       // deixa apagar sem pular pra 1
      aplicarQtd(bruto, { mexeuInput: false });
      // Estourou o teto? Corrige na hora — não dá pra encomendar mais do que cabe.
      if (Number(bruto) > maxQ) inp.value = qtd;
    });
    inp?.addEventListener('blur', () => { if (inp.value !== String(qtd)) inp.value = qtd; });
    inp?.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });

    modal.querySelectorAll('.mf-at').forEach((b) => b.addEventListener('click', () => aplicarQtd(b.dataset.q)));
    modal.querySelector('#mf-go')?.addEventListener('click', comprar);
  }

  function comprar() {
    const r = solicitar(jogo.estado, sel.id, qtd);
    if (r.falha) return;
    jogo.estado.pontos_acao -= PA;
    jogo.registrarPedido?.(r);
    if (!r.imediato) aba = 'pedidos';
    render();
  }

  // ── PEDIDOS ─────────────────────────────────────────────────────────
  // Duas seções: PENDENTES (aguardando resposta) e CONCLUÍDOS (histórico com desfecho).
  // O buraco que isto tapa: o usuário fazia um pedido e não tinha ONDE ver se foi
  // aprovado ou negado — a resposta se perdia no feed. Agora tem endereço fixo.
  function corpoPedidos() {
    const ps = pedidosPendentes(jogo.estado);
    const hist = historicoPedidos(jogo.estado);
    const rs = resumoPedidos(jogo.estado);

    const selo = { aprovado: ['check', 'bom', 'Aprovado'], produzido: ['factory', 'bom', 'Produzido'],
      negado: ['x', 'ruim', 'Negado'], cancelado_por_eles: ['ban', 'ruim', 'Cancelado por eles'],
      cancelado: ['undo-2', 'amb', 'Cancelado por você'] };

    return `<div class="mk-pedidos">
      <div class="mkp-resumo">
        <div class="mkr"><span>Pendentes</span><b>${rs.pendentes}</b></div>
        <div class="mkr"><span>Aprovados</span><b class="bom">${rs.aprovados}</b></div>
        <div class="mkr"><span>Negados</span><b class="ruim">${rs.negados}</b></div>
        <div class="mkr"><span>Gasto total</span><b class="amb">${dinheiro(rs.gasto)}</b></div>
      </div>

      ${ps.length ? `<div class="mkp-sec">${ico('clock', 12)} Aguardando resposta</div>
      <div class="mkp-topo">${ico('info', 13)} <span>Respondidos no fechamento do turno, usando a relação <b>daquele momento</b>. Ataque um aliado agora e o pedido dele morre junto.</span></div>
      ${ps.map((p) => {
        const bd = ISO2_DE[p.origem] ? bandeira(ISO2_DE[p.origem], 40) : null;
        const relAgora = relacaoCom(jogo.estado, p.origem);
        return `<div class="mkp">
          ${bd ? `<img class="mkp-flag" src="${bd}" alt="">` : ''}
          <div class="mkp-txt">
            <b>${p.qtd.toLocaleString('pt-BR')}× ${esc(p.nomeItem)}</b>
            <small>${esc(PAISES[p.origem]?.nome || p.origem)} · relação ${relAgora} · ${dinheiro(p.total)} em custódia</small>
          </div>
          <div class="mkp-chance ${p.chance >= 0.7 ? 'bom' : p.chance >= 0.45 ? 'amb' : 'ruim'}">
            <b>${Math.round(p.chance * 100)}%</b><span>aprovação</span>
          </div>
          <button class="mkp-cancel" data-p="${p.id}" title="Cancelar e reaver o dinheiro">${ico('x', 14)}</button>
        </div>`;
      }).join('')}` : ''}

      ${hist.length ? `<div class="mkp-sec">${ico('history', 12)} Concluídos</div>
      ${hist.map((h) => {
        const bd = ISO2_DE[h.origem] ? bandeira(ISO2_DE[h.origem], 40) : null;
        const [sIc, sCls, sTxt] = selo[h.status] || ['circle', '', h.status];
        return `<div class="mkp hist ${sCls}">
          ${bd ? `<img class="mkp-flag" src="${bd}" alt="">` : ''}
          <div class="mkp-txt">
            <b>${h.qtd.toLocaleString('pt-BR')}× ${esc(h.nomeItem)}</b>
            <small>${esc(PAISES[h.origem]?.nome || h.origem)} · ${dinheiro(h.total)} · turno ${h.turnoResposta}</small>
            ${h.motivo ? `<i class="mkp-motivo">${esc(h.motivo)}</i>` : ''}
          </div>
          <div class="mkp-selo ${sCls}">${ico(sIc, 13)} <span>${sTxt}</span></div>
        </div>`;
      }).join('')}` : ''}

      ${!ps.length && !hist.length ? `<div class="mk-vazio grande">
        ${ico('clock', 32)}
        <b>Nenhum pedido ainda</b>
        <span>Quando você solicita armamento estrangeiro, ele fica aqui — aguardando resposta, e depois com o desfecho: aprovado, negado, e por quê.</span>
      </div>` : ''}
    </div>`;
  }

  function ligarPedidos() {
    modal.querySelectorAll('.mkp-cancel').forEach((b) => b.addEventListener('click', () => {
      cancelarPedido(jogo.estado, b.dataset.p); render();
    }));
  }

  // ── VENDER ──────────────────────────────────────────────────────────
  function corpoVender() {
    const meus = UNIDADES.filter((u) => (jogo.estado.forcas?.[u.id] || 0) > 0);
    return `<div class="mk-grid vender">
      <nav class="mk-cats">${meus.map((u) => `
        <button class="mk-cat ${selV?.id === u.id ? 'on' : ''}" data-v="${u.id}">
          <span class="mkc-ic">${ico(ICO[u.id] || 'circle', 15)}</span>
          <span class="mkc-nome">${esc(u.nome)}</span>
          <span class="mkc-n">${(jogo.estado.forcas[u.id]).toLocaleString('pt-BR')}</span>
        </button>`).join('')}</nav>
      <div class="mk-lista sozinho" id="mk-vdet">${selV ? vendaHTML() : `
        <div class="mk-vazio grande">
          ${ico('tag', 32)}
          <b>Escolha o que colocar à venda</b>
          <span>Vender enche o caixa e esvazia a ordem de batalha. Rivais pagam mais — e o mundo inteiro repara.</span>
        </div>`}</div>
    </div>`;
  }

  function vendaHTML() {
    const tenho = jogo.estado.forcas[selV.id];
    const ofertas = ofertasCache[selV.id] || (ofertasCache[selV.id] = compradores(jogo.estado, selV.id));
    if (!oferta) oferta = melhorOferta(ofertas);
    const base = precoVendaBase(selV.id, qtdV || selV.passo);
    const total = oferta ? base * oferta.mult : base;
    return `<div class="mv">
      <div class="mv-cab">
        <img class="mv-foto" src="${FOTO_UNIDADE[selV.id] || ''}" alt="">
        <div><b>${esc(selV.nome)}</b><small>${tenho.toLocaleString('pt-BR')} no arsenal</small></div>
      </div>
      <label class="mv-lab">Quantidade <b id="mv-q">${(qtdV || selV.passo).toLocaleString('pt-BR')}</b></label>
      <input type="range" id="mv-slider" min="${Math.min(selV.passo, tenho)}" max="${tenho}" step="${selV.passo}" value="${qtdV || selV.passo}">
      <div class="mv-rot">${ico('users', 12)} Compradores encontrados</div>
      <div class="mv-ofertas">${ofertas.map((o) => `
        <button class="mv-oferta ${o.perfil} ${oferta?.iso === o.iso ? 'sel' : ''}" data-o="${o.iso}">
          ${ISO2_DE[o.iso] ? `<img class="mv-flag" src="${bandeira(ISO2_DE[o.iso], 40)}" alt="">` : ''}
          <div class="mv-o-info">
            <div class="mv-o-nome">${esc(o.nome)} <span class="mv-o-perfil ${o.perfil}">${o.perfil.toUpperCase()}</span></div>
            <div class="mv-o-nota">${esc(o.nota)}</div>
          </div>
          <div class="mv-o-preco">${dinheiro(base * o.mult)}<span>${o.mult >= 1 ? '+' : ''}${Math.round((o.mult - 1) * 100)}%</span></div>
        </button>`).join('')}</div>
      ${oferta?.perfil === 'rival' ? `<div class="mf-nota ruim">${ico('triangle-alert', 12)} Você está armando um rival. Ele paga o dobro hoje e aponta isso pra você amanhã.</div>` : ''}
      <button class="mf-btn vender" id="mv-ok" ${!oferta || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
        ${ico('tag', 16)} <span>VENDER POR ${dinheiro(total)}</span>
      </button>
    </div>`;
  }

  function ligarVender() {
    modal.querySelectorAll('.mk-cat[data-v]').forEach((b) => b.addEventListener('click', () => {
      selV = UNIDADES.find((u) => u.id === b.dataset.v);
      qtdV = selV.passo; oferta = null; render();
    }));
    modal.querySelector('#mv-slider')?.addEventListener('input', (ev) => {
      qtdV = Number(ev.target.value);
      modal.querySelector('#mk-vdet').innerHTML = vendaHTML();
      ligarVender();
    });
    modal.querySelectorAll('.mv-oferta[data-o]').forEach((b) => b.addEventListener('click', () => {
      oferta = (ofertasCache[selV.id] || []).find((o) => o.iso === b.dataset.o);
      modal.querySelector('#mk-vdet').innerHTML = vendaHTML();
      ligarVender();
    }));
    modal.querySelector('#mv-ok')?.addEventListener('click', () => {
      const total = round4(precoVendaBase(selV.id, qtdV) * oferta.mult);
      jogo.estado.tesouro = round4(jogo.estado.tesouro + total);
      jogo.estado.pontos_acao -= PA;
      aplicarForcas(jogo.estado.forcas, { [selV.id]: -qtdV });
      aplicarEfeitos(jogo.estado, oferta.efeitos);
      jogo.registrarMercado?.({ tipo: 'venda', unidade: selV, qtd: qtdV, valor: total, comprador: oferta });
      ofertasCache = {}; selV = null; oferta = null; qtdV = 0;
      render();
    });
  }

  render();
}
