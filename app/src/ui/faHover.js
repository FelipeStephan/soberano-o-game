// ═══════════════════════════════════════════════════════════════════════
// FA-HOVER — a foto do equipamento cresce, com a ficha ao lado
// ═══════════════════════════════════════════════════════════════════════
// O pedido: passar o mouse numa unidade das Forças Armadas e ver a foto AMPLIADA,
// como uma janela maior, com "informações complementares" — não a ficha detalhada
// (essa abre no clique), só o suficiente pra reconhecer e situar. Tom digital.
//
// Por que não é o tooltip de texto (tip.js): aqui o protagonista é a IMAGEM. O tip
// digita uma frase; isto abre um dossiê visual. São gestos diferentes.
//
// A HUD se redesenha por innerHTML a cada turno, então a escuta é delegada no
// document — os botões podem nem existir quando isto roda. O conteúdo de cada card
// vem de um `resolver(equipId)` que o jogo injeta (ele conhece o arsenal e o estado).

let caixa = null;
let alvoAtual = null;
let resolver = null;
let ligado = false;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function montar() {
  if (caixa) return caixa;
  caixa = document.createElement('div');
  caixa.className = 'fah';
  document.body.appendChild(caixa);
  return caixa;
}

function posicionar(el) {
  const r = el.getBoundingClientRect();
  const c = caixa.getBoundingClientRect();
  const M = 12;
  // Preferência: à ESQUERDA do item (a coluna das Forças fica na direita da tela).
  let x = r.left - c.width - 14;
  if (x < M) x = r.right + 14;                                   // não coube → direita
  let y = r.top + r.height / 2 - c.height / 2;
  y = Math.max(M, Math.min(y, window.innerHeight - c.height - M));
  x = Math.max(M, Math.min(x, window.innerWidth - c.width - M));
  caixa.style.left = `${Math.round(x)}px`;
  caixa.style.top = `${Math.round(y)}px`;
}

function mostrar(el) {
  const d = resolver?.(el.dataset.equip);
  if (!d) return;
  alvoAtual = el;
  montar();
  const origemCls = d.origem === 'nacional' ? 'nac' : d.origem === 'licenca' ? 'lic' : 'imp';
  const origemTxt = d.origem === 'nacional' ? 'Produção nacional'
    : d.origem === 'licenca' ? 'Montado sob licença' : 'Importado';
  caixa.innerHTML = `
    <div class="fah-foto">
      <img src="${esc(d.foto)}" alt="" onerror="this.style.display='none';this.parentNode.classList.add('sem-foto')">
      <span class="fah-emoji">${d.icone || ''}</span>
      <span class="fah-dom">${esc(d.dominio)}</span>
    </div>
    <div class="fah-corpo">
      <div class="fah-nome">${esc(d.nome)}</div>
      <div class="fah-fab">${esc(d.fab || '')}</div>
      <div class="fah-grade">
        <div class="fah-cel"><span>Em serviço</span><b>${(d.qtd || 0).toLocaleString('pt-BR')}</b></div>
        <div class="fah-cel"><span>Poder / un</span><b>${d.poder}</b></div>
        <div class="fah-cel destaque"><span>Peso no seu poder</span><b>${d.contribui}</b></div>
      </div>
      <div class="fah-origem ${origemCls}">${esc(origemTxt)}</div>
      <div class="fah-cta">clique para a ficha completa</div>
    </div>`;
  caixa.className = 'fah on';
  // Posiciona já: ler getBoundingClientRect força o layout na hora, então a largura
  // final está disponível sem esperar frame. (rAF não dispara em aba em segundo plano
  // — o card ficaria preso fora da tela.)
  posicionar(el);
}

function esconder() {
  alvoAtual = null;
  if (caixa) caixa.className = 'fah';
}

export function ligarFaHover(resolveFn) {
  resolver = resolveFn;                        // sempre atualiza o resolver (novo estado)
  if (ligado) return;
  ligado = true;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('.fa-un');
    if (!el || el === alvoAtual) return;
    if (el.title) el.removeAttribute('title');
    mostrar(el);
  });
  document.addEventListener('mouseout', (e) => {
    if (!alvoAtual) return;
    const p = e.relatedTarget?.closest?.('.fa-un');
    if (p === alvoAtual) return;
    esconder();
  });
  document.addEventListener('scroll', esconder, true);
  document.addEventListener('click', esconder, true);
  window.addEventListener('blur', esconder);
}
