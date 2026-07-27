// ═══════════════════════════════════════════════════════════════════════
// FAKE NEWS — o jogador escreve a mentira, o mundo inteiro lê
// ═══════════════════════════════════════════════════════════════════════
// A ação mais suja do jogo, e a mais barata: por US$ 1 mi você planta uma notícia
// falsa no @Choquei — o agregador que republica qualquer coisa que engaje. O texto
// é SEU: você digita, paga, e ele aparece no X de todos os jogadores da sala.
//
// O preço não é o dinheiro, é o dado: a influência sobe (mentira circula), mas a
// aprovação é um cara-ou-coroa — às vezes o povo compra, às vezes cheira a armação
// e a conta volta pra você. Ninguém sabe qual dos dois antes de apertar PUBLICAR.
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { rand } from '../jogo/rng.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CUSTO = 0.001;          // US$ 1 milhão (o jogo conta em trilhões)
const MAX = 220;

export function abrirFakeNews(jogo, { onFim } = {}) {
  if (document.querySelector('.fkn-modal')) return;
  const e = jogo.estado;

  const modal = document.createElement('div');
  modal.className = 'modal-fundo fkn-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  modal.innerHTML = `<div class="fkn-painel">
    <div class="fkn-cab">
      <div class="fkn-ic">${ico('megaphone', 20)}</div>
      <div class="fkn-tit"><h2>OPERAÇÃO DE DESINFORMAÇÃO</h2>
        <span>Você escreve. O @Choquei publica. O mundo acredita — ou não.</span></div>
      <button class="pp-fechar fkn-x">${ico('x', 16)}</button>
    </div>

    <div class="fkn-corpo">
      <div class="fkn-aviso">${ico('triangle-alert', 14)}
        <span>Sem apuração, sem fonte, sem volta. Depois de publicada, a notícia é da internet —
        e a internet não emite retratação.</span></div>

      <div class="fkn-sec">${ico('pen-line', 11)} A MANCHETE QUE VOCÊ QUER QUE O MUNDO LEIA</div>
      <textarea class="fkn-txt" id="fkn-txt" maxlength="${MAX}" rows="3"
        placeholder="Ex.: Documentos vazados mostram que o presidente vizinho negociou em segredo com um cartel."></textarea>
      <div class="fkn-conta"><i id="fkn-n">0</i>/${MAX}</div>

      <div class="fkn-preview">
        <div class="fkn-pv-rot">${ico('eye', 10)} COMO VAI APARECER NO X</div>
        <div class="fkn-pv-card">
          <img class="fkn-pv-avatar" src="https://static.wikia.nocookie.net/logopedia/images/d/da/Choquei.jpg/revision/latest?cb=20230111183711" alt="" onerror="this.style.display='none'">
          <div class="fkn-pv-corpo">
            <div class="fkn-pv-top"><b>Choquei</b> <span class="fkn-pv-verif">${ico('badge-check', 11)}</span> <span class="fkn-pv-h">@choquei</span></div>
            <div class="fkn-pv-txt" id="fkn-pv">—</div>
          </div>
        </div>
      </div>

      <div class="fkn-preco">
        <span>${ico('banknote', 12)} Custo da operação</span>
        <b>US$ 1 mi</b>
        <i>influência sobe · a aprovação é um dado que você não controla</i>
      </div>

      <button class="fkn-publicar" id="fkn-go" disabled>${ico('send', 15)} <span>PUBLICAR NO CHOQUEI</span></button>
    </div>
  </div>`;

  modal.querySelector('.fkn-x').addEventListener('click', fechar);
  const txt = modal.querySelector('#fkn-txt');
  const btn = modal.querySelector('#fkn-go');
  const pv = modal.querySelector('#fkn-pv');
  const n = modal.querySelector('#fkn-n');

  txt.addEventListener('input', () => {
    const v = txt.value.trim();
    n.textContent = String(txt.value.length);
    pv.textContent = v || '—';
    btn.disabled = v.length < 12 || e.tesouro < CUSTO;
    if (e.tesouro < CUSTO) btn.querySelector('span').textContent = 'SEM CAIXA PARA A OPERAÇÃO';
  });
  txt.focus();

  btn.addEventListener('click', () => {
    const texto = txt.value.trim();
    if (texto.length < 12) return;
    e.tesouro = Math.round((e.tesouro - CUSTO) * 1000) / 1000;

    // O DADO: a mentira sempre circula (influência sobe), mas o efeito na aprovação
    // é sorte — o povo compra a história ou fareja a armação e cobra a conta.
    const colou = rand() < 0.55;
    const mud = aplicarEfeitos(e, {
      soft_power: 3 + Math.round(rand() * 4),
      aprovacao: colou ? 3 + Math.round(rand() * 5) : -(3 + Math.round(rand() * 5)),
      ...(colou ? {} : { estabilidade: -2 }),
    });

    // Vai pro X como POST DE VEÍCULO (o Choquei tem logo e selo — parece verdade).
    const post = { tipo: 'veiculo', veiculo: 'Choquei', handle: '@choquei', texto, manchete: texto };
    jogo._empilharFeed?.([post]);
    // MUNDO ÚNICO: a mentira aparece no X de TODOS os jogadores da sala.
    jogo._relayOnline?.('fakenews', null, texto, { texto });

    modal.querySelector('.fkn-corpo').innerHTML = `<div class="fkn-feito ${colou ? 'colou' : 'furou'}">
      <div class="fkn-feito-ic">${ico(colou ? 'flame' : 'shield-alert', 30)}</div>
      <h3>${colou ? 'A MENTIRA PEGOU' : 'CHEIROU A ARMAÇÃO'}</h3>
      <p>${colou
        ? 'Compartilhamentos aos milhares antes do primeiro desmentido. Ninguém vai ler a correção.'
        : 'Checadores acharam a costura em horas. O tiro saiu pela culatra — e sobrou pra você.'}</p>
      <div class="fkn-mud">${mud.filter((m) => m.delta).map((m) => `<span class="fkn-m ${m.delta > 0 ? 'bom' : 'ruim'}">${esc(m.chave)} <b>${m.delta > 0 ? '+' : ''}${Math.round(m.delta * 100) / 100}</b></span>`).join('')}</div>
      <button class="fkn-publicar" id="fkn-ok">${ico('check', 15)} PRONTO</button>
    </div>`;
    modal.querySelector('#fkn-ok').addEventListener('click', fechar);
  });
}
