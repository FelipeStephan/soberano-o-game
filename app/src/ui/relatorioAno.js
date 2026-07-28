// ═══════════════════════════════════════════════════════════════════════
// RETROSPECTIVA DO ANO — o que o mundo fez em doze meses
// ═══════════════════════════════════════════════════════════════════════
// O pedido do dono: "a cada 1 ano que passar, ter um relatório onde seria interessante
// ver o que cada país fez. Uma tela bonita, tipo conquistas de 1 ano, com títulos
// criativos tipo 'Dominador de terras'."
//
// ── AS TRÊS DECISÕES DE DESIGN ────────────────────────────────────────
//
// 1. NÃO PAUSA O MUNDO. Numa sala de 8 pessoas, travar todo mundo por 30s a cada 12
//    batidas seria o jogo parando 8 vezes numa partida de 10 anos — e sempre no meio
//    de outra coisa. O relógio segue; a tela é um overlay que o jogador fecha quando
//    quiser. Quem estava no meio de uma ofensiva não perde a ofensiva.
//
// 2. MAS CHEGA COMO EVENTO, não como aba escondida. Entra sozinha, com selo e som.
//    A diferença entre "relatório disponível" e "acabou o ano" é a diferença entre
//    uma feature que ninguém abre e uma que vira ritual da mesa.
//
// 3. O SEU FEITO PRIMEIRO. A tela abre no que VOCÊ fez, não num ranking geral onde
//    você se procura. O ranking vem depois, na mesma rolagem. Isso é o que separa
//    "retrospectiva" de "tabela" — e foi o pedido explícito: ver o feito dele na
//    tela dele.
//
// ── COMO NÃO VIRAR TELA IGNORADA NO 3º ANO ────────────────────────────
// O inimigo aqui é a repetição. Três defesas embutidas: (a) os títulos mudam de faixa
// conforme os números crescem, então o mesmo jogador raramente lê o mesmo rótulo duas
// vezes; (b) a tela lidera com o que MUDOU em relação ao ano anterior, não com o
// acumulado; (c) anos sem nada relevante entram em modo compacto — um cartão curto
// em vez da tela cheia. Ano morno não merece cerimônia.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { rotuloAno } from '../jogo/feitos.js';
import { tocarEfeito } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const flag = (iso, w = 80, cls = 'ra-flag') => (ISO2_DE[iso]
  ? `<img class="${cls}" src="${bandeira(ISO2_DE[iso], w)}" alt="" onerror="this.style.visibility='hidden'">`
  : `<span class="${cls} sem">${esc(String(iso || '??').slice(0, 3))}</span>`);

// Um ano só merece a tela cheia se aconteceu alguma coisa. O corte é baixo de
// propósito (um título já basta) — mas um ano absolutamente vazio vira uma linha.
function valeCerimonia(titulos, meus) {
  return (titulos?.length || 0) >= 1 || (meus?.length || 0) >= 1;
}

export function abrirRelatorioAno(jogo, { ano, placar, titulos = [], meuIso, onFim } = {}) {
  if (document.querySelector('.ra-over')) return () => {};
  const meus = titulos.filter((t) => t.iso === meuIso);
  const outros = titulos.filter((t) => t.iso !== meuIso);
  const meuPlacar = placar?.[meuIso] || {};
  const cheio = valeCerimonia(titulos, meus);

  const over = document.createElement('div');
  over.className = `ra-over ${cheio ? '' : 'compacto'}`;
  document.body.appendChild(over);
  try { tocarEfeito('radar', { volume: 0.4 }); } catch { /* sem áudio */ }

  const fechar = () => {
    over.classList.add('saindo');
    setTimeout(() => { over.remove(); onFim?.(); }, 320);
    document.removeEventListener('keydown', tecla);
  };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);

  // ── ANO MORNO: um cartão, não uma cerimônia ────────────────────────
  if (!cheio) {
    over.innerHTML = `<div class="ra-magro">
      <span class="ra-magro-ic">${ico('calendar-check', 15)}</span>
      <div><b>${esc(rotuloAno(ano))} encerrado</b>
        <span>Doze meses sem nada que a história vá anotar. Às vezes governar bem é isso.</span></div>
      <button class="ra-magro-x">${ico('x', 14)}</button>
    </div>`;
    over.querySelector('.ra-magro-x').addEventListener('click', fechar);
    setTimeout(fechar, 9000);
    return fechar;
  }

  const cartaoTitulo = (t, destaque = false) => `
    <div class="ra-titulo ${t.tom || 'neutro'} ${t.coroa ? 'coroa' : ''} ${destaque ? 'meu' : ''}">
      <div class="ra-tit-cab">${flag(t.iso)}<div class="ra-tit-quem">
        <b>${esc(t.pais || nomeDe(t.iso))}</b>
        <i>${t.coroa ? 'PRÊMIO DO ANO' : 'MENÇÃO'}</i></div>
        ${t.numero != null ? `<span class="ra-tit-num">${esc(String(t.numero))}</span>` : ''}</div>
      <div class="ra-tit-nome">${esc(t.titulo)}</div>
      <div class="ra-tit-sub">${esc(t.subtitulo || '')}</div>
    </div>`;

  // A linha de números do jogador: só o que teve movimento no ano. Mostrar zerado é
  // encher a tela com o que não aconteceu.
  const meusNumeros = Object.entries(meuPlacar)
    .filter(([k, v]) => typeof v === 'number' && v > 0 && k !== 'iso')
    .sort((a, b) => b[1] - a[1]).slice(0, 8);

  over.innerHTML = `<div class="ra-painel">
    <div class="ra-cab">
      <div class="ra-selo">${ico('calendar-check', 22)}</div>
      <div class="ra-tit"><h2>RETROSPECTIVA · ${esc(rotuloAno(ano)).toUpperCase()}</h2>
        <span>Doze meses fechados. O que o mundo vai lembrar deste ano.</span></div>
      <button class="pp-fechar ra-x">${ico('x', 16)}</button>
    </div>

    <div class="ra-corpo">
      <section class="ra-eu">
        <div class="ra-lab">${ico('user', 11)} O SEU ANO · ${esc(nomeDe(meuIso))}</div>
        ${meus.length
          ? `<div class="ra-meus">${meus.map((t) => cartaoTitulo(t, true)).join('')}</div>`
          : `<div class="ra-vazio">${ico('info', 14)} Nenhum título este ano. Você governou sem chamar atenção — o que não é pouco, e não rende manchete.</div>`}
        ${meusNumeros.length ? `<div class="ra-numeros">${meusNumeros.map(([k, v]) => `
          <span class="ra-num"><b>${typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(1) : v}</b><i>${esc(k.replace(/_/g, ' '))}</i></span>`).join('')}</div>` : ''}
      </section>

      ${outros.length ? `<section class="ra-mundo">
        <div class="ra-lab">${ico('globe', 11)} O RESTO DO MUNDO</div>
        <div class="ra-lista">${outros.map((t) => cartaoTitulo(t)).join('')}</div>
      </section>` : ''}
    </div>

    <div class="ra-rodape">
      <span class="ra-nota">${ico('info', 11)} O mundo não parou para isto — o relógio continua correndo enquanto você lê.</span>
      <button class="ra-ok">${ico('chevron-right', 15)} SEGUIR PARA ${esc(rotuloAno(ano + 1)).toUpperCase()}</button>
    </div>
  </div>`;

  over.querySelector('.ra-x').addEventListener('click', fechar);
  over.querySelector('.ra-ok').addEventListener('click', fechar);
  over.addEventListener('click', (ev) => { if (ev.target === over) fechar(); });
  return fechar;
}
