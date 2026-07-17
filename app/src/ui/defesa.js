// ═══════════════════════════════════════════════════════════════════════
// MODO DEFESA — o clímax de levar um ataque de outro humano
// ═══════════════════════════════════════════════════════════════════════
// Modelo em docs/ONLINE.md. Quando um humano declara/faz guerra contra você, esta
// tela abre: você distribui tropas pelos seus estados antes do golpe cair. A tese do
// dono: a INTELIGÊNCIA é o herói silencioso — quanto mais você investiu nela, mais
// nítido o recon ("os EUA massaram forças apontadas para o Rio") e mais cedo o aviso.
// Pouca inteligência = "algo se move no sul, não sei o quê". O pavor do escuro.
import { ico } from './icones.js';
import { estadosDe, guarnicao, forcaGuarnicao, tropaLivre, reforcar } from '../jogo/territorio.js';
import { UNIDADE_POR_ID } from '../dados/forcas.js';
import { PAISES } from '../dados/paises.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

// O RECON: o que a sua inteligência consegue ler da movimentação inimiga.
// dados.alvoEstado = id do estado que o atacante mirou (vem do evento, quando existe).
function lerRecon(estado, agressorIso, dados) {
  const intel = estado.inteligencia ?? 0;
  const meus = estadosDe(estado.iso || 'USA');
  const alvoReal = dados?.alvoEstado && meus.find((e) => e.id === dados.alvoEstado);

  if (intel >= 70) {
    // leitura nítida: nome do estado + direção
    const alvo = alvoReal || meus[0];
    return { nivel: 'nítido', cor: '#22e0a0', alvoId: alvo?.id || null,
      txt: `A sua inteligência é de primeira. Interceptamos os planos: <b>${esc(nomeDe(agressorIso))}</b> concentrou o grosso das forças apontadas para <b>${esc(alvo?.nome || 'a capital')}</b>. Reforce lá — é por ali que vem o golpe.` };
  }
  if (intel >= 40) {
    const alvo = alvoReal || meus[0];
    // parcial: dá a região, não a certeza
    return { nivel: 'parcial', cor: '#ffb020', alvoId: alvo?.id || null,
      txt: `Os satélites captaram movimentação: parece que <b>${esc(nomeDe(agressorIso))}</b> mira a região de <b>${esc(alvo?.nome || 'uma fronteira')}</b> — mas pode ser finta. Reforce, sem descuidar do resto.` };
  }
  return { nivel: 'cego', cor: '#ff3b5c', alvoId: null,
    txt: `Sua inteligência está fraca demais para ler o inimigo. Sabemos que <b>${esc(nomeDe(agressorIso))}</b> vem, não sabemos por onde. Espalhe a defesa e reze. <i>(Invista em Inteligência e da próxima vez você enxerga o golpe antes.)</i>` };
}

export function abrirDefesa(jogo, { agressor, dados, onFim } = {}) {
  if (document.querySelector('.defesa-modal')) return;   // um de cada vez
  const estado = jogo.estado;
  const meuIso = estado.iso || 'USA';
  const recon = lerRecon(estado, agressor?.iso, dados);

  const modal = document.createElement('div');
  modal.className = 'modal-fundo defesa-modal';
  document.body.appendChild(modal);

  function forcaLivreTotal() {
    const livre = tropaLivre(estado);
    return Object.entries(livre).reduce((t, [id, q]) => t + (q || 0) * (UNIDADE_POR_ID[id]?.poder || 0), 0);
  }

  // Um "pacote" de reforço tira uma fatia proporcional das tropas livres e joga num
  // estado. Simples de operar sob pressão — é defesa, não planilha.
  function pacoteReforco(fracao) {
    const livre = tropaLivre(estado);
    const envio = {};
    for (const [id, q] of Object.entries(livre)) {
      const n = Math.floor((q || 0) * fracao);
      if (n > 0) envio[id] = n;
    }
    return envio;
  }

  function render() {
    const meus = estadosDe(meuIso);
    const livreTot = forcaLivreTotal();
    const semTerritorio = meus.length === 0;

    modal.innerHTML = `<div class="defesa-painel">
      <div class="def-cab">
        <div class="def-selo">${ico('shield-alert', 22)}</div>
        <div class="def-tit"><h2>MODO DEFESA</h2>
          <span><b>${esc(agressor?.nome || 'Um inimigo')}</b> declarou guerra. Posicione suas tropas antes do impacto.</span></div>
        <button class="pp-fechar def-fechar">${ico('x', 16)}</button>
      </div>

      <div class="def-recon" style="--rc:${recon.cor}">
        <div class="dr-cab">${ico('radar', 14)} RECONHECIMENTO · INTELIGÊNCIA ${estado.inteligencia ?? 0}/100 · leitura ${recon.nivel}</div>
        <p>${recon.txt}</p>
      </div>

      <div class="def-livre">${ico('users', 13)} Tropa em reserva (sem posição): <b>força ${fmt(livreTot)}</b>
        <div class="def-quick">
          <button class="dq" data-f="0.5" ${livreTot <= 0 ? 'disabled' : ''}>Mobilizar 50%</button>
          <button class="dq" data-f="1" ${livreTot <= 0 ? 'disabled' : ''}>Mobilização total</button>
        </div>
      </div>

      ${semTerritorio ? `<div class="def-vazio">${ico('info', 16)} Seu país não tem estados mapeados — a defesa aqui é no agregado. Feche e responda pela sua força total.</div>` : `
      <div class="def-estados">
        ${(() => { const maxF = Math.max(1, ...meus.map((x) => forcaGuarnicao(guarnicao(estado, x.id)))); return meus.map((e) => {
          const f = forcaGuarnicao(guarnicao(estado, e.id));
          const alvo = e.id === recon.alvoId;
          const pct = Math.min(100, (f / maxF) * 100);
          return `<div class="def-estado ${alvo ? 'alvo' : ''}" data-id="${e.id}">
            <div class="de-top"><b>${esc(e.nome)}</b>${alvo ? `<span class="de-alvo">${ico('crosshair', 10)} ALVO PROVÁVEL</span>` : ''}</div>
            <div class="de-barra"><i style="width:${pct}%"></i></div>
            <div class="de-baixo"><span>guarnição <b>${fmt(f)}</b></span>
              <button class="de-reforcar" data-id="${e.id}" ${livreTot <= 0 ? 'disabled' : ''}>${ico('plus', 12)} reforçar aqui</button></div>
          </div>`;
        }).join(''); })()}
      </div>`}

      <div class="def-rodape">
        <div class="def-nota">${ico('info', 12)} Onde a guarnição for maior que a força que o inimigo mandar, o território segura.</div>
        <button class="def-pronto">${ico('shield-check', 15)} DEFESA POSICIONADA</button>
      </div>
    </div>`;

    modal.querySelector('.def-fechar').addEventListener('click', fechar);
    modal.querySelector('.def-pronto').addEventListener('click', fechar);
    modal.querySelectorAll('.dq').forEach((b) => b.addEventListener('click', () => {
      // mobilização rápida: joga a fatia no estado-alvo do recon (ou no primeiro).
      const alvoId = recon.alvoId || estadosDe(meuIso)[0]?.id;
      if (alvoId) reforcar(estado, alvoId, pacoteReforco(Number(b.dataset.f)));
      render();
    }));
    modal.querySelectorAll('.de-reforcar').forEach((b) => b.addEventListener('click', () => {
      reforcar(estado, b.dataset.id, pacoteReforco(0.34));   // um terço da reserva por clique
      render();
    }));
  }

  function fechar() { modal.remove(); onFim?.(); }
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
  render();
}
