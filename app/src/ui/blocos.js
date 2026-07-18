// ═══════════════════════════════════════════════════════════════════════
// VISOR DE BLOCOS — o mapa-múndi das alianças, num painel só
// ═══════════════════════════════════════════════════════════════════════
// O pedido: um lugar no cabeçalho pra ver os blocos ativos — militares e
// econômicos — com os detalhes. Aqui listamos TODOS: os de fábrica (OTAN, BRICS…)
// e os que o jogador criou, no mesmo formato, cada um com membros (bandeiras),
// poder militar somado, PIB somado, intensidade e caráter. É a leitura estratégica
// do tabuleiro: quem está com quem, e o quanto isso pesa.
import { BLOCOS, aliancasSync } from '../dados/blocos.js';
import { poderDoBloco, sincronizarBlocos } from '../jogo/aliancas.js';
import { PAISES, jogadorIso } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const flag = (iso) => (ISO2_DE[iso] ? `<img class="blv-flag" src="${bandeira(ISO2_DE[iso], 40)}" alt="" title="${esc(PAISES[iso]?.nome || iso)}" onerror="this.style.display='none'">` : `<span class="blv-flag-x">${esc(iso)}</span>`);

// classifica o bloco em militar / econômico pela intensidade + flag militar
function caraterBloco(b) {
  if (b.militar && b.intensidade >= 55) return { rot: 'MILITAR', cor: 'var(--ambar)', tipo: 'militar', ic: 'shield' };
  if (b.militar) return { rot: 'DEFESA', cor: 'var(--ambar)', tipo: 'militar', ic: 'shield' };
  return { rot: 'ECONÔMICO', cor: 'var(--verde)', tipo: 'economico', ic: 'coins' };
}

export function abrirBlocosVisor(jogo) {
  if (document.querySelector('.blv-modal')) return;
  const estado = jogo.estado;
  sincronizarBlocos(estado);   // saves carregados: garante que as alianças estejam no registro
  const eu = estado.iso || jogadorIso();
  let filtro = 'todos';   // todos | militar | economico

  const modal = document.createElement('div');
  modal.className = 'modal-fundo blv-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  function todosBlocos() {
    // de fábrica + criados pelo jogador (aliancasSync tem os normalizados)
    const fabrica = Object.values(BLOCOS).map((b) => ({ ...b, _criado: false }));
    const criados = aliancasSync().map((b) => ({ ...b, _criado: true }));
    return [...criados, ...fabrica];   // os do jogador primeiro
  }

  function render() {
    const lista = todosBlocos()
      .map((b) => ({ b, car: caraterBloco(b), pod: poderDoBloco(estado, b.isos), sou: b.isos.includes(eu) }))
      .filter((x) => filtro === 'todos' || x.car.tipo === filtro)
      // os blocos de que EU faço parte primeiro (o meu bloco no topo), depois por poder
      .sort((a, b) => (Number(b.sou) - Number(a.sou)) || (b.pod.militar - a.pod.militar));

    modal.innerHTML = `<div class="blv-painel">
      <div class="blv-cab">
        <div class="blv-ic">${ico('globe', 20)}</div>
        <div class="blv-tit"><h2>BLOCOS ATIVOS</h2><span>O tabuleiro das alianças — quem está com quem</span></div>
        <button class="pp-fechar blv-x">${ico('x', 16)}</button>
      </div>
      <div class="blv-filtros">
        <button class="blv-fil ${filtro === 'todos' ? 'on' : ''}" data-fil="todos">Todos</button>
        <button class="blv-fil ${filtro === 'militar' ? 'on' : ''}" data-fil="militar">${ico('shield', 11)} Militares</button>
        <button class="blv-fil ${filtro === 'economico' ? 'on' : ''}" data-fil="economico">${ico('coins', 11)} Econômicos</button>
      </div>
      <div class="blv-lista">
        ${lista.map(({ b, car, pod }) => {
          const sou = b.isos.includes(eu);
          return `<div class="blv-bloco ${sou ? 'meu' : ''} ${b._criado ? 'criado' : ''}" style="--c:${b.cor || (car.tipo === 'militar' ? '#ff8c42' : '#22e0a0')}">
            <div class="blv-b-cab">
              <span class="blv-b-nome">${esc(b.nome)}${b._criado ? ` <i class="blv-b-tag">seu bloco</i>` : ''}${sou && !b._criado ? ` <i class="blv-b-tag membro">você é membro</i>` : ''}</span>
              <span class="blv-b-car" style="color:${car.cor}">${ico(car.ic, 11)} ${car.rot}</span>
            </div>
            <div class="blv-b-membros">${b.isos.map((iso) => flag(iso)).join('')}</div>
            <div class="blv-b-stats">
              <span title="Poder militar somado">${ico('swords', 11)} <b>${pod.militar}</b> poder</span>
              <span title="PIB somado (estimado)">${ico('circle-dollar-sign', 11)} <b>US$ ${pod.pib} tri</b></span>
              <span title="Grau de compromisso">${ico('link', 11)} <b>${b.intensidade}</b> intensidade</span>
              <span title="Membros">${ico('users', 11)} <b>${b.isos.length}</b></span>
            </div>
            <div class="blv-b-barra"><i style="width:${b.intensidade}%"></i></div>
          </div>`;
        }).join('')}
        ${lista.length ? '' : `<div class="blv-vazio">${ico('info', 15)} Nenhum bloco ${filtro === 'militar' ? 'militar' : 'econômico'} ativo.</div>`}
      </div>
    </div>`;

    modal.querySelector('.blv-x').addEventListener('click', fechar);
    modal.querySelectorAll('.blv-fil').forEach((b) => b.addEventListener('click', () => { filtro = b.dataset.fil; render(); }));
  }

  render();
}
