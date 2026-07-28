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
import { DOUTRINAS, ORDEM_DOUTRINAS, definirDoutrina, epitetoDaDecada } from '../jogo/doutrinas.js';
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

// ═══════════════════════════════════════════════════════════════════════
// TELA 2 — O LEGADO, na tela de fim de partida
// ═══════════════════════════════════════════════════════════════════════
// Devolve HTML para ser INJETADO no cartão de fim que já existe (ui/jogo.js), em vez
// de abrir um segundo modal por cima. Dois modais empilhados no momento mais dramático
// do jogo é como se perde o momento: o jogador fecha um sem ler e o outro vira ruído.
//
// A ORDEM DE LEITURA foi desenhada para responder três perguntas nesta sequência —
// "quanto eu fiz?", "onde eu ganhei ponto?", "eu ganhei?". Trocar a ordem transforma
// a tela num extrato: o número sozinho não significa nada até o jogador ver de onde
// veio, e o pódio não significa nada até ele saber quanto valeu.
export function blocoLegadoHTML(legado, ranking, { anos = 10 } = {}) {
  if (!legado?.doutrina) return '';
  const d = legado.doutrina;
  const pos = ranking?.linhas?.find((l) => l.eu)?.pos || 1;
  const epiteto = epitetoDaDecada(d.id, pos, !!ranking?.disputado);

  const linha = (l) => {
    const rot = ROTULO[l.tipo] || l.tipo;
    return `<div class="lgd-linha ${l.naDoutrina ? 'dentro' : ''} ${l.negativo ? 'ruim' : ''}">
      <span class="lgd-rot">${esc(rot)}</span>
      <span class="lgd-qtd">${l.qtd}</span>
      ${l.naDoutrina ? `<i class="lgd-x3">×3</i>` : ''}
      <b class="lgd-pts">${l.pontos > 0 ? '+' : ''}${l.pontos}</b>
    </div>`;
  };

  return `
    <div class="fim-sec">${ico(d.ic, 13)} O LEGADO DA DÉCADA</div>
    <div class="lgd-bloco" style="--cd:${d.cor}">
      <div class="lgd-topo">
        <div class="lgd-doutrina">
          <div class="lgd-ic">${ico(d.ic, 22)}</div>
          <div><b>${esc(d.nome)}</b><span>${esc(d.mede)}</span></div>
        </div>
        <div class="lgd-total"><i>LEGADO</i><b>${legado.total}</b></div>
      </div>
      <div class="lgd-epiteto">${ico('award', 14)} <span>${esc(epiteto)}</span></div>

      <div class="lgd-somas">
        <div class="lgd-soma dentro"><i>NA SUA DOUTRINA</i><b>+${legado.dentro}</b><small>peso ×3</small></div>
        <div class="lgd-soma"><i>FORA DELA</i><b>${legado.fora >= 0 ? '+' : ''}${legado.fora}</b><small>peso ×1</small></div>
        <div class="lgd-soma"><i>DESTINO FINAL</i><b>+${legado.destino}</b><small>de 100</small></div>
      </div>

      ${legado.linhas.length ? `<div class="lgd-detalhe">${legado.linhas.slice(0, 10).map(linha).join('')}</div>`
        : `<div class="lgd-vazio">Dez anos e nenhum feito que o mundo tenha registrado. O Legado é o Destino, e mais nada.</div>`}

      ${ranking?.disputado ? `
      <div class="lgd-lab">${ico('trophy', 11)} O PÓDIO DA DÉCADA</div>
      <div class="lgd-rank">
        ${ranking.linhas.slice(0, 8).map((l) => `
          <div class="lgd-r ${l.eu ? 'eu' : ''} ${l.pos === 1 ? 'primeiro' : ''}">
            <span class="lgd-pos">${l.pos}</span>
            ${flag(l.iso, 40)}
            <div class="lgd-quem"><b>${esc(l.nome)}</b><i>${esc(DOUTRINAS[l.doutrina]?.nome || 'SEM DOUTRINA')}</i></div>
            <b class="lgd-rleg">${l.legado}</b>
          </div>`).join('')}
      </div>
      ${ranking.coroas.length ? `
      <div class="lgd-lab">${ico('crown', 11)} AS COROAS — o maior de cada caminho</div>
      <div class="lgd-coroas">
        ${ranking.coroas.map((c) => `
          <div class="lgd-coroa" style="--cd:${c.cor}">
            <div class="lgd-cic">${ico(c.ic, 15)}</div>
            <div><i>${esc(c.nome)}</i><b>${esc(c.vencedor.nome)}</b></div>
            <span>${c.vencedor.legado}</span>
          </div>`).join('')}
      </div>` : ''}` : `
      <div class="lgd-solo">${ico('info', 12)} Partida contra a Máquina: não há pódio a disputar.
        O Legado é a sua marca — e a régua para a próxima década, com outra doutrina.</div>`}
    </div>`;
}

// Os rótulos do detalhamento. Vêm daqui e não de `feitos.js` porque lá o rótulo é do
// FEITO ("Territórios tomados", voz de jornal) e aqui é da LINHA DE PLACAR — texto
// curto que precisa caber numa coluna e ser lido de relance.
const ROTULO = {
  conquista: 'Territórios tomados', anexacao: 'Nações anexadas', libertacao: 'Soberanias devolvidas',
  ofensiva: 'Ofensivas lançadas', invasao_repelida: 'Invasões repelidas', territorio_perdido: 'Territórios perdidos',
  nuclear: 'Ogivas detonadas', cura_invest: 'Investido em saúde (tri)', cura_final: 'Pandemias curadas',
  mediacao: 'Rodadas de mediação', paz_final: 'Guerras encerradas', ajuda: 'Ajuda enviada (tri)',
  alianca: 'Pactos selados', sancao_aplicada: 'Sanções impostas', sancao_sofrida: 'Sanções sofridas',
  espionagem: 'Segredos roubados', armas_vendidas: 'Armas vendidas (tri)', pib_delta: 'Riqueza gerada (%)',
};

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
