// ═══════════════════════════════════════════════════════════════════════
// PONTOS QUENTES — o mundo em chamas numa lista, com voo até o local
// ═══════════════════════════════════════════════════════════════════════
// Era só um número no topo ("Focos: 3"). Agora é uma porta: passa o mouse (ou clica)
// e abre a lista animada de tudo que está pegando fogo no planeta — guerras entre
// países, as SUAS guerras, pandemias e os territórios seus sob reconquista. Clicar
// num item VOA a câmera do globo até lá e abre a ação cabível (intervir/reforçar).
import { PAISES } from '../dados/paises.js';
import { ico } from './icones.js';
import { abrirIntervencao } from './intervencao.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nome = (iso) => PAISES[iso]?.nome || iso;

// Junta TODOS os pontos quentes do estado num formato uniforme pro painel.
export function listarPontosQuentes(estado) {
  const out = [];

  for (const c of estado.conflitosNPC || []) {
    out.push({
      tipo: 'guerra', ic: 'swords', cor: 'perigo',
      titulo: `${nome(c.a)} × ${nome(c.b)}`,
      sub: `Guerra por ${c.tema || 'território'}`,
      intensidade: Math.round(c.intensidade || 50), iso: c.a,
      intervir: { tipo: 'conflito', a: c.a, b: c.b, nomeA: nome(c.a), nomeB: nome(c.b), tema: c.tema, intensidade: c.intensidade, ref: c },
    });
  }
  for (const iso of estado.emGuerra || []) {
    out.push({
      tipo: 'minha-guerra', ic: 'crosshair', cor: 'perigo',
      titulo: `Você × ${nome(iso)}`, sub: 'Sua ofensiva em curso', intensidade: 90, iso,
      abrir: iso,
    });
  }
  for (const pd of estado.pandemias || []) {
    out.push({
      tipo: 'pandemia', ic: 'biohazard', cor: 'roxo',
      titulo: esc(pd.nome || 'Surto'), sub: `${pd.paises?.length || 1} país(es) · fase ${pd.fase || '—'}`,
      intensidade: Math.min(100, (pd.paises?.length || 1) * 18), iso: pd.origem || pd.paises?.[0],
      intervir: { tipo: 'pandemia', nome: pd.nome, patogeno: pd.tipo, fase: pd.fase, paises: pd.paises?.length || 1, ref: pd },
    });
  }
  for (const [id, c] of Object.entries(estado.conflitosEstado || {})) {
    out.push({
      tipo: 'reconquista', ic: 'flame', cor: 'ambar',
      titulo: `Reconquista em ${id}`, sub: `${nome(c.por)} avança · pressão ${Math.round(c.intensidade || 0)}%`,
      intensidade: Math.round(c.intensidade || 0), iso: id.split('-')[0], abrir: id.split('-')[0],
    });
  }
  return out.sort((a, b) => b.intensidade - a.intensidade);
}

let painelAberto = null;

export function abrirPontosQuentes(ancora, jogo, globoCtrl, { onIntervir } = {}) {
  fecharPontosQuentes();
  const itens = listarPontosQuentes(jogo.estado);

  ancora.classList.add('aberto');
  const pnl = document.createElement('div');
  pnl.className = 'pq-painel';
  pnl.innerHTML = `
    <div class="pq-cab">${ico('flame', 13)} CRISES NO MUNDO <b>${itens.length}</b></div>
    <div class="pq-lista">
      ${itens.length ? itens.map((h, i) => `
        <button class="pq-item ${h.cor}" data-i="${i}" style="animation-delay:${(i * 0.045).toFixed(2)}s">
          <span class="pq-ic">${ico(h.ic, 15)}</span>
          <span class="pq-txt"><b>${esc(h.titulo)}</b><span>${esc(h.sub)}</span></span>
          <span class="pq-int"><i style="width:${Math.max(6, h.intensidade)}%"></i></span>
        </button>`).join('')
      : `<div class="pq-vazio">${ico('check-circle', 15)} O mundo respira. Nenhum foco ativo agora.</div>`}
    </div>
    <div class="pq-rodape">${ico('mouse-pointer-click', 10)} clique num foco para voar até ele</div>`;

  // Ancorar logo abaixo do stat no topo.
  const r = ancora.getBoundingClientRect();
  pnl.style.top = `${r.bottom + 8}px`;
  pnl.style.left = `${Math.max(12, r.left - 40)}px`;
  document.body.appendChild(pnl);
  painelAberto = pnl;

  pnl.querySelectorAll('.pq-item').forEach((b) => b.addEventListener('click', () => {
    const h = itens[Number(b.dataset.i)];
    // 1) VOA a câmera até o local.
    const c = h.iso ? globoCtrl?.ondeEsta?.(h.iso) : null;
    if (c) globoCtrl?.focar?.(c);
    if (h.abrir) globoCtrl?.selecionarPais?.(h.abrir);
    fecharPontosQuentes();
    // 2) Abre a ação cabível — intervir (guerra NPC/pandemia) ou deixa o jogador agir no país.
    if (h.intervir) {
      if (onIntervir) onIntervir(h.intervir);
      else abrirIntervencao(h.intervir, jogo, { globoCtrl });
    }
  }));

  // Fecha ao clicar fora.
  setTimeout(() => document.addEventListener('click', foraDoPainel, true), 0);
}

function foraDoPainel(ev) {
  if (painelAberto && !painelAberto.contains(ev.target) && !ev.target.closest?.('#t-focos-stat')) {
    fecharPontosQuentes();
  }
}

export function fecharPontosQuentes() {
  if (painelAberto) { painelAberto.remove(); painelAberto = null; }
  document.querySelector('#t-focos-stat')?.classList.remove('aberto');
  document.removeEventListener('click', foraDoPainel, true);
}
