// ═══════════════════════════════════════════════════════════════════════
// DOSSIÊ DO EQUIPAMENTO — o que a sua nação opera, e o que custa ter mais
// ═══════════════════════════════════════════════════════════════════════
// Isto era uma tela de duas abas: comprar e vender. A venda saiu, e o motivo é de
// arquitetura, não de gosto: o MERCADO já é a tela de venda — com compradores,
// perfil (aliado/rival), a nota de que armar um rival tem preço, e o histórico de
// pedidos. Ter um segundo lugar pra vender significava duas telas fazendo a mesma
// coisa com regras diferentes, e a pior delas ganhando por estar mais à mão.
//
// Sem a aba, esta tela vira o que ela deveria ser desde o começo: o DOSSIÊ do
// material — quem fabrica, de onde vem, quanto pesa em combate, o que custa manter,
// e um caminho curto pra comprar mais. Uma coisa, bem feita.
import { equipamentoDe, fatorProducao } from '../dados/equipamentos.js';
import { UNIDADE_POR_ID, aplicarForcas } from '../dados/forcas.js';
import { PRECO, reservaMinima } from '../dados/mercado.js';
import { bandeira } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { dinheiro } from '../jogo/formato.js';
import { acaoDeEncomenda } from '../jogo/compras.js';
import { filaRegistrada, enfileirarNaFila } from '../jogo/filaComando.js';
import { ico, ICO } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ISO2 = { USA: 'us', CHN: 'cn', RUS: 'ru', IRN: 'ir', BRA: 'br', IND: 'in', DEU: 'de', FRA: 'fr', GBR: 'gb', JPN: 'jp', KOR: 'kr', PRK: 'kp', ISR: 'il', SAU: 'sa', MEX: 'mx', CAN: 'ca', UKR: 'ua', TWN: 'tw', AUS: 'au', TUR: 'tr', ITA: 'it', SWE: 'se' };
const PA = 1;

export function abrirEquipamento(unidadeId, jogo, { onFim, tr } = {}) {
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
    <div class="eq-foto">
      <img src="${eq.foto}" alt="" onerror="this.parentElement.innerHTML='<span class=\\'eq-emoji\\'>${u.icone}</span>'">
      <button class="pp-fechar eq-x">${ico('x', 15)}</button>
      <div class="eq-titulo">
        <div class="eq-dom">${ico(ICO[u.dominio] || 'circle', 10)} ${esc(u.dominio)} · ${esc(u.nome)}</div>
        <div class="eq-nome">${esc(eq.nome || u.nome)}</div>
      </div>
    </div>

    <div class="eq-corpo">
      <div class="eq-fabricante">
        ${eq.origem && ISO2[eq.origem] ? `<img class="eq-flag" src="${bandeira(ISO2[eq.origem], 40)}" alt="">` : ''}
        <div><span>Fabricante</span><b>${esc(eq.fab)}</b></div>
        <div class="eq-prod" style="--pc:${prod.cor}">${esc(prod.rot)}</div>
      </div>

      ${eq.generico ? `<div class="eq-nota">${ico('triangle-alert', 13)} <span>Seu país não produz este material — é comprado no mercado internacional.</span></div>` : ''}
      ${eq.sugerido ? `<div class="eq-nota sug">${ico('camera', 13)} <span>Foto genérica: não achei imagem livre deste item. O modelo está correto.</span></div>` : ''}
      ${prod.fator > 1 ? `<div class="eq-nota ${relOrigem < 0 ? 'ruim' : ''}">${ico(relOrigem < 0 ? 'ban' : 'package', 13)} <span>${relOrigem < 0
        ? `Você depende de <b>${esc(PAISES[eq.origem]?.nome)}</b> — e a relação está em <b>${relOrigem}</b>. Eles cobram caro de quem não gostam.`
        : `Importado: custa ${Math.round((prod.fator - 1) * 100)}% mais caro que produção nacional.`}</span></div>` : ''}
      ${prod.fator < 1 ? `<div class="eq-nota bom">${ico('factory', 13)} <span>Produção nacional: 20% mais barato e ninguém pode te cortar o fornecimento.</span></div>` : ''}

      <div class="eq-stats">
        <div class="eq-s"><span>No arsenal</span><b>${estoque.toLocaleString('pt-BR')}</b></div>
        <div class="eq-s"><span>Poder / unidade</span><b>${u.poder}</b></div>
        <div class="eq-s"><span>Preço / unidade</span><b class="amb">${dinheiro(precoUnit)}</b></div>
        <div class="eq-s"><span>Envio / unidade</span><b>${dinheiro(u.custoLog)}</b></div>
      </div>

      <div class="eq-sec">${ico('package-plus', 11)} Encomendar mais</div>
      <div id="eq-acao"></div>

      <div class="eq-rodape">
        ${ico('store', 12)} <span>Para <b>vender</b> este material — ou comprar de outro país —, use o
        <b>Mercado de Armas</b>. Lá você vê quem compra, por quanto, e o que custa armar um rival.</span>
      </div>
    </div>
  </div>`;
  document.body.appendChild(modal);

  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.querySelector('.eq-x').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

  function renderAcao() {
    const alvo = modal.querySelector('#eq-acao');
    const maxQ = Math.max(u.passo, Math.floor((jogo.estado.tesouro / precoUnit) / u.passo) * u.passo);
    const custo = precoUnit * qtd;
    const reserva = reservaMinima(jogo.estado);
    const sobra = jogo.estado.tesouro - custo;
    const semPA = jogo.estado.pontos_acao < PA;
    alvo.innerHTML = `
      <div class="eq-qtd">
        <label>Quantidade <b>${qtd.toLocaleString('pt-BR')}</b></label>
        <input type="range" class="ip-slider" id="eq-q" min="${u.passo}" max="${maxQ}" step="${u.passo}" value="${Math.min(qtd, maxQ)}">
      </div>
      <div class="eq-linha"><span>Custo total</span><b class="amb">${dinheiro(custo)}</b></div>
      <div class="eq-linha"><span>Caixa depois</span><b class="${sobra < reserva ? 'ruim' : ''}">${dinheiro(sobra)}</b></div>
      ${sobra < reserva ? `<div class="eq-nota ruim">${ico('triangle-alert', 13)} <span>Abaixo da reserva de segurança (${dinheiro(reserva)}). Um choque agora e você não reage.</span></div>` : ''}
      <button class="eq-ok" id="eq-go" ${custo > jogo.estado.tesouro || semPA ? 'disabled' : ''}>
        ${ico('package-plus', 15)}
        <span>${semPA ? `SEM PONTOS DE AÇÃO (⚡${PA})` : `ENCOMENDAR ${qtd.toLocaleString('pt-BR')} — ${dinheiro(custo)}`}</span>
        ${semPA ? '' : `<i>⚡${PA}</i>`}
      </button>`;
    alvo.querySelector('#eq-q')?.addEventListener('input', (ev) => { qtd = Number(ev.target.value); renderAcao(); });
    alvo.querySelector('#eq-go')?.addEventListener('click', confirmar);
  }

  // A ENCOMENDA NÃO CAI DO CÉU: com o tempo real ativo, o material entra na
  // FILA DE COMANDO como uma ação sintética com tempo de produção/entrega
  // (jogo/compras.js:tempoEntrega) — o motor incorpora ao arsenal quando o
  // relógio dela zera. Sem fila (modo antigo/testes), compat: entrega na hora.
  function confirmar() {
    const custo = round2(precoUnit * qtd);
    if (custo > jogo.estado.tesouro) return;
    const filaFn = tr ? (a) => tr.enfileirar(a) : (filaRegistrada() ? enfileirarNaFila : null);
    if (filaFn) {
      const acao = acaoDeEncomenda({ unidadeId, qtd, nome: eq.nome || u.nome, custo, nacional: prod.fator < 1 });
      const r = filaFn(acao);
      if (!r?.ok) { renderAcao(); return; }   // fila cheia / sem caixa — a fila já explicou
      jogo.estado.pontos_acao -= PA;          // a fila debita o caixa; o PA sai aqui
      jogo.registrarMercado?.({ tipo: 'compra', unidade: { nome: eq.nome || u.nome }, qtd, valor: custo });
      fechar();
      return;
    }
    jogo.estado.tesouro = round2(jogo.estado.tesouro - custo);
    jogo.estado.pontos_acao -= PA;
    aplicarForcas(jogo.estado.forcas, { [unidadeId]: qtd });
    jogo.registrarMercado?.({ tipo: 'compra', unidade: { nome: eq.nome || u.nome }, qtd, valor: custo });
    fechar();
  }

  renderAcao();
}

function round2(n) { return Math.round(n * 100) / 100; }
