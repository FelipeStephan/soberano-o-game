// ═══════════════════════════════════════════════════════════════════════
// A ESCOLHA DA DOUTRINA — a primeira decisão da década
// ═══════════════════════════════════════════════════════════════════════
// Duas telas moram aqui, e moram juntas de propósito: a que ABRE a partida (as cinco
// cartas) e a que a FECHA (o Legado, o pódio e as coroas). São as duas pontas da
// mesma promessa — o que a carta prometeu no minuto 0 é exatamente o que a tela final
// cobra no minuto 60. Separar em dois arquivos garantiria que uma mudasse sem a outra.
//
// ── POR QUE A ESCOLHA VEM DEPOIS DE ASSUMIR O PAÍS ────────────────────
// A tentação era pôr as cartas na home, junto da escolha de nação. Recusei: na home
// o jogador ainda não viu nada do mundo dele, e escolher "O INDUSTRIAL" sem saber que
// herdou 2 tri de caixa e dívida de 180% é escolher no escuro. Aqui ele já está na
// cabine, com a HUD atrás do vidro — a decisão acontece OLHANDO para o país que ele
// vai governar. É a mesma lógica da Cena 2 do documento de enredo: você não escolhe
// um avatar, herda um problema.
//
// ── E POR QUE NÃO DÁ PARA PULAR ──────────────────────────────────────
// Não há botão de fechar. Uma década sem rumo é exatamente o jogo que existia antes
// desta tela — e o jogador que pula a escolha é o que vai reclamar que falta rumo.
import { ico } from './icones.js';
import { DOUTRINAS, ORDEM_DOUTRINAS, definirDoutrina } from '../jogo/doutrinas.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { tocarEfeito } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const flag = (iso, w = 60) => (ISO2_DE[iso]
  ? `<img class="dt-flag" src="${bandeira(ISO2_DE[iso], w)}" alt="" onerror="this.style.visibility='hidden'">`
  : `<span class="dt-flag sem">${esc(String(iso || '??').slice(0, 3))}</span>`);

// ═══════════════════════════════════════════════════════════════════════
// TELA 1 — AS CINCO CARTAS
// ═══════════════════════════════════════════════════════════════════════
export function abrirEscolhaDoutrina(jogo, { onEscolher } = {}) {
  if (document.querySelector('.dt-over')) return () => {};
  const pais = jogo.ficha?.pais || jogo.estado?.iso || '';
  const iso = jogo.estado?.iso || 'USA';
  let sel = null;

  const over = document.createElement('div');
  over.className = 'dt-over';
  over.innerHTML = `
    <div class="dt-painel">
      <header class="dt-cab">
        ${flag(iso, 120)}
        <div class="dt-cab-txt">
          <span class="dt-k">// DEZ ANOS · CENTO E VINTE MESES · UMA DÉCADA</span>
          <h2>Que tipo de potência ${esc(pais)} vai ser?</h2>
          <p>A doutrina <b>não bloqueia nada</b> — você continua podendo fazer tudo. Ela decide
             <b>como o mundo vai te medir</b> no fim da década. Feito fora dela conta;
             feito dentro dela conta três vezes.</p>
        </div>
      </header>
      <div class="dt-cartas" id="dt-cartas">
        ${ORDEM_DOUTRINAS.map((id, i) => {
          const d = DOUTRINAS[id];
          return `<button class="dt-carta" data-id="${id}" style="--cd:${d.cor};animation-delay:${90 + i * 70}ms">
            <div class="dt-ic">${ico(d.ic, 24)}</div>
            <b class="dt-nome">${esc(d.nome)}</b>
            <i class="dt-lema">“${esc(d.lema)}”</i>
            <p class="dt-promessa">${esc(d.promessa)}</p>
            <div class="dt-mede"><span>MEDE</span>${esc(d.mede)}</div>
            <div class="dt-usa">${esc(d.usa)}</div>
            <div class="dt-check">${ico('check', 13)}</div>
          </button>`;
        }).join('')}
      </div>
      <footer class="dt-rodape">
        <span class="dt-aviso" id="dt-aviso">${ico('lock', 12)} A escolha é definitiva e <b>pública</b>: todos vão saber qual caminho você seguiu.</span>
        <button class="dt-confirmar" id="dt-ok" disabled>${ico('crown', 16)} <span>ESCOLHA UMA DOUTRINA</span></button>
      </footer>
    </div>`;
  document.body.appendChild(over);
  try { tocarEfeito('radar', { volume: 0.35 }); } catch { /* sem áudio */ }

  const btn = over.querySelector('#dt-ok');
  over.querySelectorAll('.dt-carta').forEach((c) => c.addEventListener('click', () => {
    over.querySelectorAll('.dt-carta').forEach((o) => o.classList.toggle('sel', o === c));
    sel = c.dataset.id;
    btn.disabled = false;
    btn.querySelector('span').textContent = `SEGUIR ${DOUTRINAS[sel].nome}`;
    btn.style.setProperty('--cd', DOUTRINAS[sel].cor);
    try { tocarEfeito('click', { volume: 0.5 }); } catch { /* sem áudio */ }
  }));

  const fechar = () => { over.classList.add('saindo'); setTimeout(() => over.remove(), 280); };
  btn.addEventListener('click', () => {
    if (!sel) return;
    const d = definirDoutrina(jogo.estado, sel);
    if (!d) return;
    try { tocarEfeito('swoosh'); } catch { /* sem áudio */ }
    fechar();
    onEscolher?.(d);
  });
  return fechar;
}

// A TELA DO LEGADO NÃO MORA MAIS AQUI. Ela era um bloco de HTML injetado no cartão
// de fim — e o cartão de fim virou um carrossel de sete etapas (ui/fimDaEra.js), onde
// o Legado tem uma tela inteira só pra ele. Manter uma segunda versão do mesmo bloco
// aqui garantiria que uma das duas ficasse para trás na primeira mudança de copy.

// ── A INSÍGNIA NO TOPO ────────────────────────────────────────────────
// Um selo permanente ao lado do nome do país. Existe por um motivo prático: a
// doutrina é PÚBLICA (é o que permite aliança, rivalidade e chantagem), e informação
// pública que só aparece na tela final não é pública — é surpresa.
export function insigniaDoutrinaHTML(estado) {
  const id = estado?.doutrina?.id;
  const d = id ? DOUTRINAS[id] : null;
  if (!d) return '';
  return `<span class="dt-insig" style="--cd:${d.cor}" data-tip="${esc(d.promessa)}"
    data-tip-t="${esc(d.nome)}" data-tip-k="DOUTRINA">${ico(d.ic, 12)} ${esc(d.nome)}</span>`;
}
