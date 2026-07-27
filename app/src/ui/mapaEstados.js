// ═══════════════════════════════════════════════════════════════════════
// MAPA DE ESTADOS — escolher a estratégia no mapa, não num dropdown
// ═══════════════════════════════════════════════════════════════════════
// Abre o país ACHATADO na tela (SVG, mesma linguagem da cabine) com os estados
// desenhados. Você clica pra selecionar QUAIS quer tomar primeiro — na ordem em que
// clica — e pode marcar um como ALVO PRINCIPAL (o eixo do avanço). É o "eixo de
// avanço" do modal de ofensiva, agora tátil.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
// A projeção mora em `projecao.js` desde que o MODO DEFESA passou a desenhar o MEU
// país com a mesma matemática. Duas cópias = duas verdades sobre a forma do mapa.
import { projetar, geoParaPath, carregarMalha } from './projecao.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function abrirMapaEstados(iso, nomePais, { atual = [], dominados = [], onConfirmar } = {}) {
  const jaMeus = new Set(dominados);   // estados que já conquistei num ataque anterior
  const modal = document.createElement('div');
  modal.className = 'modal-fundo mestados-modal';
  modal.innerHTML = `<div class="mest-painel"><div class="mest-carregando">${ico('loader', 20)} carregando o mapa de ${esc(nomePais)}…</div></div>`;
  document.body.appendChild(modal);
  const fechar = () => modal.remove();
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  const feats = await carregarMalha(iso);

  if (!feats.length) {
    modal.querySelector('.mest-painel').innerHTML = `<div class="mest-vazio">${ico('info', 18)} ${esc(nomePais)} não tem estados mapeados — a ofensiva avança pela fronteira mais próxima.</div>
      <button class="dist-aplicar" id="mest-fim">ENTENDIDO</button>`;
    modal.querySelector('#mest-fim').addEventListener('click', fechar);
    return;
  }

  const { toXY, W, H } = projetar(feats);
  const nomeCap = (PAISES[iso]?.capital || '').toLowerCase();
  const selecionados = [...atual];   // ordem = prioridade de queda

  function svg() {
    return `<svg class="mest-svg" viewBox="0 0 ${W} ${H.toFixed(0)}" preserveAspectRatio="xMidYMid meet">
      ${feats.map((f) => {
        const p = f.properties; const id = p.id;
        const cap = nomeCap && p.nome && nomeCap.includes(String(p.nome).toLowerCase());
        const meu = jaMeus.has(id);
        return `<path class="mest-e ${cap ? 'cap' : ''} ${meu ? 'meu' : ''}" data-id="${id}" data-nome="${esc(p.nome)}" ${meu ? 'data-meu="1"' : ''} d="${geoParaPath(f.geometry, toXY)}"></path>`;
      }).join('')}
    </svg>`;
  }

  function render() {
    modal.querySelector('.mest-painel').innerHTML = `
      <div class="mest-cab">
        <div class="mest-ic">${ico('target', 20)}</div>
        <div class="mest-tit"><h2>EIXO DE AVANÇO · ${esc(nomePais.toUpperCase())}</h2>
          <span>Clique nos estados que quer tomar primeiro. A ordem do clique é a ordem da conquista.${jaMeus.size ? ` <b class="mest-jm">${jaMeus.size} já sob seu controle</b> — o avanço parte deles.` : ''}</span></div>
        <button class="pp-fechar mest-x">${ico('x', 16)}</button>
      </div>
      <div class="mest-corpo">
        <div class="mest-mapa">${svg()}</div>
        <div class="mest-painel-lat">
          <div class="mest-rot">${ico('list-ordered', 12)} ALVOS ESCOLHIDOS <b>${selecionados.length}</b></div>
          <div class="mest-lista" id="mest-lista">${listaHTML()}</div>
          <div class="mest-legenda">
            <span><i class="mest-sw sel"></i> alvo (cai na ordem)</span>
            <span><i class="mest-sw meu"></i> já é seu</span>
            <span><i class="mest-sw cap"></i> capital</span>
            <span>${ico('info', 10)} sem escolha = avanço pela fronteira</span>
          </div>
        </div>
      </div>
      <div class="mest-rodape">
        <button class="mest-limpar" id="mest-limpar">${ico('rotate-ccw', 13)} Limpar</button>
        <button class="dist-aplicar mest-ok" id="mest-ok">${ico('check', 15)} CONFIRMAR ESTRATÉGIA</button>
      </div>`;
    pintar();
    modal.querySelector('.mest-x').addEventListener('click', fechar);
    modal.querySelector('#mest-limpar').addEventListener('click', () => { selecionados.length = 0; render(); });
    modal.querySelector('#mest-ok').addEventListener('click', () => { onConfirmar?.(selecionados.slice()); fechar(); });
    modal.querySelectorAll('.mest-e').forEach((path) => path.addEventListener('click', () => toggle(path.dataset.id)));
    modal.querySelectorAll('.mest-rm').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.id)));
    modal.querySelectorAll('.mest-star').forEach((b) => b.addEventListener('click', () => tornarPrincipal(b.dataset.id)));
  }

  function listaHTML() {
    if (!selecionados.length) return `<div class="mest-nada">Nenhum estado escolhido. Clique no mapa — ou confirme vazio para o avanço padrão.</div>`;
    return selecionados.map((id, i) => {
      const nome = feats.find((f) => f.properties.id === id)?.properties.nome || id;
      return `<div class="mest-item ${i === 0 ? 'principal' : ''}">
        <span class="mest-n">${i + 1}</span>
        <span class="mest-nome">${esc(nome)}${i === 0 ? ' <i class="mest-tag">ALVO PRINCIPAL</i>' : ''}</span>
        ${i !== 0 ? `<button class="mest-star" data-id="${id}" title="Tornar alvo principal">${ico('star', 12)}</button>` : ''}
        <button class="mest-rm" data-id="${id}" title="Remover">${ico('x', 12)}</button>
      </div>`;
    }).join('');
  }

  function toggle(id) {
    if (jaMeus.has(id)) return;   // já é meu — não re-seleciono o que já dominei
    const i = selecionados.indexOf(id);
    if (i >= 0) selecionados.splice(i, 1); else selecionados.push(id);
    render();
  }
  // O alvo principal é o primeiro da lista (o eixo do avanço). "Priorizar" = mandar
  // pro topo, e é onde o grosso da força incide.
  function tornarPrincipal(id) {
    const i = selecionados.indexOf(id);
    if (i > 0) { selecionados.splice(i, 1); selecionados.unshift(id); }
    render();
  }
  function pintar() {
    modal.querySelectorAll('.mest-e').forEach((path) => {
      const i = selecionados.indexOf(path.dataset.id);
      path.classList.toggle('on', i >= 0);
      path.classList.toggle('principal', i === 0);
    });
  }

  render();
}
