// FICHA DO EQUIPAMENTO — clicar num item militar abre isto (não é uma "ação de turno").
// Mostra o material REAL que o seu país opera, origem, cadeia produtiva, e deixa
// comprar/vender direto daqui.
import { equipamentoDe, fatorProducao } from '../dados/equipamentos.js';
import { UNIDADE_POR_ID, aplicarForcas } from '../dados/forcas.js';
import { PRECO, precoVendaBase, compradores, melhorOferta, reservaMinima } from '../dados/mercado.js';
import { bandeira } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { dinheiro } from '../jogo/formato.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ISO2 = { USA: 'us', CHN: 'cn', RUS: 'ru', IRN: 'ir', BRA: 'br', IND: 'in', DEU: 'de', FRA: 'fr', GBR: 'gb', JPN: 'jp', KOR: 'kr', PRK: 'kp', ISR: 'il', SAU: 'sa', MEX: 'mx', CAN: 'ca', UKR: 'ua', TWN: 'tw', AUS: 'au', TUR: 'tr', ITA: 'it', SWE: 'se' };
const PA = 1;

export function abrirEquipamento(unidadeId, jogo, { onFim } = {}) {
  const u = UNIDADE_POR_ID[unidadeId];
  if (!u) return;
  const meuIso = jogo.ficha.iso || 'USA';
  const eq = equipamentoDe(meuIso, unidadeId);
  const relOrigem = eq.origem && PAISES[eq.origem] ? Number(jogo.estado[PAISES[eq.origem].rel] ?? 0) : null;
  const prod = fatorProducao(jogo.estado, eq, relOrigem);
  const precoUnit = (PRECO[unidadeId] || 0) * prod.fator;
  const estoque = jogo.estado.forcas?.[unidadeId] || 0;
  let qtd = u.passo;

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  modal.innerHTML = `<div class="eq-painel">
    <div class="eq-foto"><img src="${eq.foto}" alt="" onerror="this.parentElement.innerHTML='<span class=\\'eq-emoji\\'>${u.icone}</span>'">
      <button class="pp-fechar eq-x">✕</button>
      <div class="eq-titulo">
        <div class="eq-nome">${esc(eq.nome || u.nome)}</div>
        <div class="eq-tipo">${u.icone} ${esc(u.nome)} · ${esc(u.dominio)}</div>
      </div>
    </div>

    <div class="eq-corpo">
      <div class="eq-fabricante">
        ${eq.origem && ISO2[eq.origem] ? `<img class="eq-flag" src="${bandeira(ISO2[eq.origem], 40)}" alt="">` : ''}
        <div><span>FABRICANTE</span><b>${esc(eq.fab)}</b></div>
        <div class="eq-prod" style="color:${prod.cor};border-color:${prod.cor}">${esc(prod.rot)}</div>
      </div>
      ${eq.generico ? '<div class="eq-nota">⚠️ Seu país não produz este material — é comprado no mercado internacional.</div>' : ''}
      ${eq.sugerido ? '<div class="eq-nota sug">📷 Foto genérica: não achei imagem livre deste item. O modelo está correto.</div>' : ''}
      ${prod.fator > 1 ? `<div class="eq-nota ${relOrigem < 0 ? 'ruim' : ''}">${relOrigem < 0
        ? `🚫 Você depende de <b>${esc(PAISES[eq.origem]?.nome)}</b> — e a relação está em <b>${relOrigem}</b>. Eles cobram caro de quem não gostam.`
        : `📦 Importado: custa ${Math.round((prod.fator - 1) * 100)}% mais caro que produção nacional.`}</div>` : ''}
      ${prod.fator < 1 ? '<div class="eq-nota bom">🏭 Produção nacional: 20% mais barato e ninguém pode te cortar o fornecimento.</div>' : ''}

      <div class="eq-stats">
        <div class="eq-s"><span>No arsenal</span><b>${estoque.toLocaleString('pt-BR')}</b></div>
        <div class="eq-s"><span>Poder por unidade</span><b>${u.poder}</b></div>
        <div class="eq-s"><span>Preço por unidade</span><b class="amb">${dinheiro(precoUnit)}</b></div>
        <div class="eq-s"><span>Envio por unidade</span><b>${dinheiro(u.custoLog)}</b></div>
      </div>

      <div class="eq-abas">
        <button class="eq-aba ativa" data-t="comprar">🛒 Comprar</button>
        <button class="eq-aba" data-t="vender" ${estoque <= 0 ? 'disabled' : ''}>💰 Vender</button>
      </div>
      <div id="eq-acao"></div>
    </div>
  </div>`;
  document.body.appendChild(modal);

  const fechar = () => { modal.remove(); onFim?.(); };
  modal.querySelector('.eq-x').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

  let aba = 'comprar';
  let oferta = null;
  let ofertas = [];
  modal.querySelectorAll('.eq-aba').forEach((b) => b.addEventListener('click', () => {
    aba = b.dataset.t; qtd = aba === 'comprar' ? u.passo : Math.min(u.passo, estoque);
    if (aba === 'vender') { ofertas = compradores(jogo.estado, unidadeId); oferta = melhorOferta(ofertas); }
    modal.querySelectorAll('.eq-aba').forEach((x) => x.classList.toggle('ativa', x.dataset.t === aba));
    renderAcao();
  }));

  function renderAcao() {
    const alvo = modal.querySelector('#eq-acao');
    if (aba === 'comprar') {
      const maxQ = Math.max(u.passo, Math.floor((jogo.estado.tesouro / precoUnit) / u.passo) * u.passo);
      const custo = precoUnit * qtd;
      const reserva = reservaMinima(jogo.estado);
      const sobra = jogo.estado.tesouro - custo;
      alvo.innerHTML = `
        <input type="range" class="ip-slider" id="eq-q" min="${u.passo}" max="${maxQ}" step="${u.passo}" value="${Math.min(qtd, maxQ)}">
        <div class="eq-linha"><span>Quantidade</span><b>${qtd.toLocaleString('pt-BR')}</b></div>
        <div class="eq-linha"><span>Custo total</span><b class="amb">${dinheiro(custo)}</b></div>
        <div class="eq-linha"><span>Caixa depois</span><b class="${sobra < reserva ? 'ruim' : ''}">${dinheiro(sobra)}</b></div>
        ${sobra < reserva ? `<div class="eq-nota ruim">⚠️ Abaixo da reserva de segurança (${dinheiro(reserva)}). Um choque agora e você não reage.</div>` : ''}
        <button class="eq-ok" id="eq-go" ${custo > jogo.estado.tesouro || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
          ${jogo.estado.pontos_acao < PA ? `SEM PONTOS DE AÇÃO (⚡${PA})` : `COMPRAR ${qtd.toLocaleString('pt-BR')} POR ${dinheiro(custo)} ⚡${PA}`}
        </button>`;
    } else {
      const base = precoVendaBase(unidadeId, qtd);
      const total = oferta ? base * oferta.mult : base;
      alvo.innerHTML = `
        <input type="range" class="ip-slider" id="eq-q" min="${Math.min(u.passo, estoque)}" max="${estoque}" step="${u.passo}" value="${qtd}">
        <div class="eq-linha"><span>Quantidade</span><b>${qtd.toLocaleString('pt-BR')}</b></div>
        <div class="eq-ofertas">${ofertas.map((o) => `
          <button class="eq-of ${o.perfil} ${oferta?.iso === o.iso ? 'sel' : ''}" data-o="${o.iso}">
            ${ISO2[o.iso] ? `<img src="${bandeira(ISO2[o.iso], 40)}" alt="">` : ''}
            <span class="eq-of-n">${esc(o.nome)}</span>
            <span class="eq-of-p">${dinheiro(base * o.mult)}</span>
          </button>`).join('')}</div>
        ${oferta?.perfil === 'rival' ? '<div class="eq-nota ruim">⚠️ Armando um rival. Paga mais hoje, aponta pra você amanhã.</div>' : ''}
        <button class="eq-ok vender" id="eq-go" ${!oferta || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
          VENDER ${qtd.toLocaleString('pt-BR')} POR ${dinheiro(total)} ⚡${PA}
        </button>`;
      alvo.querySelectorAll('.eq-of[data-o]').forEach((b) => b.addEventListener('click', () => {
        oferta = ofertas.find((o) => o.iso === b.dataset.o); renderAcao();
      }));
    }
    alvo.querySelector('#eq-q')?.addEventListener('input', (ev) => { qtd = Number(ev.target.value); renderAcao(); });
    alvo.querySelector('#eq-go')?.addEventListener('click', confirmar);
  }

  function confirmar() {
    if (aba === 'comprar') {
      const custo = round2(precoUnit * qtd);
      if (custo > jogo.estado.tesouro) return;
      jogo.estado.tesouro = round2(jogo.estado.tesouro - custo);
      jogo.estado.pontos_acao -= PA;
      aplicarForcas(jogo.estado.forcas, { [unidadeId]: qtd });
      jogo.registrarMercado?.({ tipo: 'compra', unidade: { nome: eq.nome || u.nome }, qtd, valor: custo });
    } else {
      const total = round2(precoVendaBase(unidadeId, qtd) * oferta.mult);
      jogo.estado.tesouro = round2(jogo.estado.tesouro + total);
      jogo.estado.pontos_acao -= PA;
      aplicarForcas(jogo.estado.forcas, { [unidadeId]: -qtd });
      aplicarEfeitos(jogo.estado, oferta.efeitos);
      jogo.registrarMercado?.({ tipo: 'venda', unidade: { nome: eq.nome || u.nome }, qtd, valor: total, comprador: oferta });
    }
    fechar();
  }

  renderAcao();
}

function round2(n) { return Math.round(n * 100) / 100; }
