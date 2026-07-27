// ═══════════════════════════════════════════════════════════════════════
// SALA DE ESPERA — o jogador caiu e quer voltar (#11)
// ═══════════════════════════════════════════════════════════════════════
// A DECISÃO DE PRODUTO, tomada e registrada aqui porque ela é o motivo do arquivo
// existir. As três opções em cima da mesa eram:
//
//   A) Ele volta com o MESMO país, a partida continua de onde parou.
//      Simples de implementar e destrói o jogo: se cair não custa nada, nada do que
//      você faz antes de cair importa. A derrota vira um botão de "tentar de novo".
//
//   B) A Máquina assume o país dele e ele volta com OUTRO país livre.  ← ESCOLHIDA
//      O mundo continua coerente (o país caído não some do mapa nem congela — passa a
//      ser conduzido pela IA, como qualquer NPC), a derrota continua doendo (você
//      PERDEU aquela nação, o seu arsenal, o seu território, a sua história), e o
//      jogador não é expulso da mesa onde os amigos dele ainda estão jogando.
//
//   C) Ele fica de fora até a sala acabar.
//      Coerente e insuportável: numa sala que dura horas, é banir alguém do serão.
//
// O preço de B é este arquivo: um MODO ESPECTADOR enquanto ele escolhe. Sem ele, a
// alternativa seria escolher às cegas — e voltar num país em guerra sem saber é o
// tipo de armadilha que parece bug, não design.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { jogaveis, cartaoDe, NACOES } from '../dados/registro.js';
import { forcaDe } from '../jogo/forcasMundo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || NACOES[iso]?.ficha?.pais || iso;

// ── QUEM AINDA ESTÁ NA PRATELEIRA ──────────────────────────────────────
// Um país só é assumível se ninguém o está jogando E ele ainda existe como nação. As
// três exclusões abaixo não são detalhe: renascer num país anexado ou numa zona
// radioativa seria renascer morto, e o jogador leria isso como bug.
export function nacoesDisponiveis(estado, { ocupados = [], excluir = [] } = {}) {
  const tomados = new Set([...ocupados, ...excluir].filter(Boolean));
  const radioativos = new Set(estado?.zonasRadioativas || []);
  const anexados = new Set(Object.entries(estado?.ocupacoes || {}).filter(([, o]) => o?.anexado).map(([i]) => i));
  return jogaveis()
    .filter((iso) => !tomados.has(iso) && !radioativos.has(iso) && !anexados.has(iso))
    .map((iso) => {
      const c = cartaoDe(iso) || {};
      return {
        iso,
        nome: nomeDe(iso),
        pib: c.pib ?? null,
        militar: Math.round(forcaDe(estado, iso)),
        ogivas: c.ogivas || 0,
        emGuerra: (estado?.emGuerra || []).includes(iso),
        // território dele que já mudou de dono nesta partida: renascer num país
        // pela metade é uma escolha legítima, mas tem de ser uma escolha INFORMADA.
        perdido: Object.entries(estado?.donoEstado || {})
          .filter(([id, dono]) => id.split('-')[0] === iso && dono !== iso).length,
      };
    })
    .sort((a, b) => (b.militar || 0) - (a.militar || 0));
}

// ── A TELA ─────────────────────────────────────────────────────────────
// `onEscolher(iso)` recebe o país escolhido; quem chama é que sabe reiniciar o jogo
// (ui/jogo.js → main.js), porque só o topo tem o `net` e a sala na mão.
export function abrirRenascer(jogo, { ocupados = [], onEscolher, onEspectar } = {}) {
  const caido = jogo.estado.iso || 'USA';
  const lista = nacoesDisponiveis(jogo.estado, { ocupados, excluir: [caido] });

  const modal = document.createElement('div');
  modal.className = 'modal-fundo rnc-fundo';
  document.body.appendChild(modal);
  const fechar = () => modal.remove();

  modal.innerHTML = `<div class="rnc-painel">
    <div class="rnc-cab">
      <div class="rnc-ic">${ico('users-round', 22)}</div>
      <div class="rnc-tit"><h2>ASSUMIR OUTRA NAÇÃO</h2>
        <span>${esc(nomeDe(caido))} caiu — a Máquina assumiu o comando de lá. A sala continua.</span></div>
      <button class="pp-fechar rnc-x">${ico('x', 16)}</button>
    </div>

    <div class="rnc-aviso">${ico('info', 15)}
      <span><b>Você não volta para ${esc(nomeDe(caido))}.</b> Aquele governo era seu e acabou — o arsenal, o território e a
      história ficaram lá, agora sob a Máquina. Você recomeça em outro país, no <b>mesmo mundo e no mesmo mês</b>:
      as guerras que estão acontecendo continuam acontecendo, e quem te derrubou continua na mesa.</span></div>

    <div class="rnc-lista">
      ${lista.length ? lista.map((n) => `<button class="rnc-pais ${n.emGuerra ? 'guerra' : ''}" data-iso="${n.iso}">
        ${ISO2_DE[n.iso] ? `<img class="rnc-flag" src="${bandeira(ISO2_DE[n.iso], 80)}" alt="" onerror="this.style.visibility='hidden'">` : '<span class="rnc-flag"></span>'}
        <span class="rnc-info">
          <b>${esc(n.nome)}</b>
          <small>${n.pib != null ? `PIB ${n.pib} tri · ` : ''}militar ${n.militar}${n.ogivas ? ` · ${n.ogivas} ogivas` : ''}</small>
        </span>
        <span class="rnc-tags">
          ${n.emGuerra ? `<i class="rnc-tag guerra">${ico('swords', 9)} EM GUERRA</i>` : ''}
          ${n.perdido ? `<i class="rnc-tag perdeu">${ico('flag-off', 9)} ${n.perdido} território(s) ocupado(s)</i>` : ''}
          ${!n.emGuerra && !n.perdido ? `<i class="rnc-tag calmo">${ico('check', 9)} em paz</i>` : ''}
        </span>
        <span class="rnc-go">${ico('chevron-right', 15)}</span>
      </button>`).join('') : `<div class="rnc-vazio">${ico('triangle-alert', 16)} Nenhuma nação livre nesta sala. Você segue como espectador até a partida acabar.</div>`}
    </div>

    <div class="rnc-rodape">
      <button class="rnc-espectar" id="rnc-espectar">${ico('eye', 14)} SÓ ASSISTIR POR ENQUANTO</button>
      <div class="rnc-nota">${ico('info', 11)} Escolher um país trava ele na sala — ninguém mais pode pegá-lo depois de você.</div>
    </div>
  </div>`;

  modal.querySelector('.rnc-x').addEventListener('click', () => { fechar(); onEspectar?.(); });
  modal.querySelector('#rnc-espectar').addEventListener('click', () => { fechar(); onEspectar?.(); });
  modal.querySelectorAll('.rnc-pais').forEach((b) => b.addEventListener('click', () => {
    const iso = b.dataset.iso;
    // CONFIRMAÇÃO curta e no lugar: assumir país é irreversível dentro da sala, e a
    // lista é longa o bastante pra um clique errado acontecer.
    modal.querySelector('.rnc-painel').innerHTML = `<div class="rnc-confirma">
      ${ISO2_DE[iso] ? `<img class="rnc-conf-flag" src="${bandeira(ISO2_DE[iso], 160)}" alt="">` : ''}
      <h2>ASSUMIR ${esc(nomeDe(iso).toUpperCase())}?</h2>
      <p>Você entra no comando desta nação a partir de agora, no mês em que a sala está. Não há volta para ${esc(nomeDe(caido))}.</p>
      <div class="rnc-conf-acoes">
        <button class="rnc-conf-nao" id="rnc-nao">VOLTAR À LISTA</button>
        <button class="rnc-conf-sim" id="rnc-sim">${ico('flag', 15)} ASSUMIR O COMANDO</button>
      </div>
    </div>`;
    modal.querySelector('#rnc-nao').addEventListener('click', () => { fechar(); abrirRenascer(jogo, { ocupados, onEscolher, onEspectar }); });
    modal.querySelector('#rnc-sim').addEventListener('click', () => { fechar(); onEscolher?.(iso); });
  }));
}

// ── A FAIXA DE ESPECTADOR ──────────────────────────────────────────────
// Enquanto ele não escolhe, o mundo continua rodando na tela dele — e uma faixa
// permanente diz por que ele não pode agir e como voltar ao jogo. Sem isso, "assistir"
// é indistinguível de "o jogo travou".
export function faixaEspectador(nomeCaido, aoVoltar) {
  document.querySelectorAll('.esp-faixa').forEach((e) => e.remove());
  const el = document.createElement('div');
  el.className = 'esp-faixa';
  el.innerHTML = `<div class="esp-in">
    <span class="esp-ic">${ico('eye', 15)}</span>
    <span class="esp-txt"><b>MODO ESPECTADOR</b> — ${esc(nomeCaido)} caiu e está sob a Máquina. Você vê a sala, mas não comanda ninguém.</span>
    <button class="esp-btn">${ico('flag', 13)} ASSUMIR UMA NAÇÃO</button>
  </div>`;
  document.body.appendChild(el);
  el.querySelector('.esp-btn').addEventListener('click', () => aoVoltar?.());
  return () => el.remove();
}
