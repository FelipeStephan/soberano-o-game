// ═══════════════════════════════════════════════════════════════════════
// SOCORRO AO ALIADO — o dia em que a assinatura vira sangue
// ═══════════════════════════════════════════════════════════════════════
// O pedido do dono: "quando um país tomar [território do aliado], você ajudar na
// guerra e atacar também. (...) quando clicado na nação aliada atacada, você poder
// recuperar território. E no online manter a opção de permitir ou não — ou se aliado
// militar ter um comportamento direto de ir lá e ajudar. Pense."
//
// ── A DECISÃO, E POR QUÊ ──────────────────────────────────────────────
// Nem automático, nem opcional puro. Automático rouba a decisão, e honrar um pacto
// QUANDO DÓI é a única jogada dramática que uma aliança oferece — se o jogo decide
// por você, a Defesa Mútua vira um número numa planilha. Mas opcional puro esvazia a
// cláusula: se recusar não custa nada, "defesa mútua" é decoração.
//
// O híbrido que ficou: **com Defesa Mútua o socorro é PRESUMIDO** — o chamado abre
// sozinho, com prazo, e o silêncio conta como abandono (mais caro que recusar na
// cara, porque cala é pior que negar). **Sem Defesa Mútua é convite**: você é avisado,
// e não ir não quebra nada. A assimetria entre RECUSAR e SUMIR está no motor
// (jogo/coalizao.js · abandonarSocorro) e é o que dá peso à cláusula sem tirar o
// volante da mão do jogador.
//
// ── E A TENTAÇÃO ──────────────────────────────────────────────────────
// Território retomado VOLTA pro aliado — senão socorro é só oportunismo com boa
// imprensa. Mas existe o botão de FICAR COM ELE, e ele é a melhor jogada do sistema:
// você libertou o chão e plantou a sua bandeira nele na frente do dono. Ganha
// território, perde o bloco. A tela mostra as duas contas antes do clique porque a
// traição só é interessante quando é escolhida de olhos abertos.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import {
  territoriosRetomaveis, atenderSocorro, abandonarSocorro,
  restituirAoAliado, ficarComTerritorio, socorroDe, resumoSocorro,
} from '../jogo/coalizao.js';
import { resolverEnvio } from '../jogo/campanha.js';
import { tropaLivre } from '../jogo/territorio.js';
import { alertaUrgente } from './efeitos.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
const flag = (iso, w = 80, cls = 'soc-flag') => (ISO2_DE[iso]
  ? `<img class="${cls}" src="${bandeira(ISO2_DE[iso], w)}" alt="" onerror="this.style.visibility='hidden'">`
  : `<span class="${cls} sem">${esc(String(iso || '??').slice(0, 3))}</span>`);

// ── O CHAMADO ─────────────────────────────────────────────────────────
// As duas colunas de consequência lado a lado. É de propósito: a pergunta não é "você
// quer ajudar?" (todo mundo quer), é "você aceita entrar numa guerra por isso?".
export function abrirChamadoSocorro(jogo, socorro, { onFim, onAtender } = {}) {
  if (!socorro || document.querySelector('.soc-chamado')) return;
  const el = document.createElement('div');
  el.className = `soc-chamado ${socorro.defesaMutua ? 'pacto' : ''}`;
  const jaEmGuerra = (jogo.estado.emGuerra || []).includes(socorro.agressor);
  const n = socorro.estados?.length || 0;

  el.innerHTML = `
    <div class="soc-cab">${ico('shield-alert', 15)} <b>${socorro.defesaMutua ? 'A DEFESA MÚTUA FOI ACIONADA' : 'UM ALIADO PEDE SOCORRO'}</b></div>
    <div class="soc-corpo">
      <div class="soc-duo">${flag(socorro.aliado)}<span class="soc-vs">${ico('swords', 13)}</span>${flag(socorro.agressor)}</div>
      <div class="soc-txt">
        <b>${esc(nomeDe(socorro.agressor))}</b> tomou ${n ? `<b>${n}</b> território(s) de ` : 'território de '}<b>${esc(nomeDe(socorro.aliado))}</b>,
        ${socorro.defesaMutua ? `seu aliado em <b>${esc(socorro.alianca?.nome || 'pacto militar')}</b> — e o pacto tem cláusula de defesa mútua.`
          : `seu aliado em ${esc(socorro.alianca?.nome || 'aliança')}.`}
      </div>
      <div class="soc-contas">
        <div class="soc-conta sim">
          <div class="soc-conta-rot">${ico('check', 11)} SE ATENDER</div>
          <span>${jaEmGuerra ? 'Você já está em guerra com ele — só fica pior.' : `Você entra em <b>guerra com ${esc(nomeDe(socorro.agressor))}</b>.`}</span>
          <span>Relação com o agressor despenca; clima de guerra sobe.</span>
          <span class="bom">O pacto é honrado: ${esc(nomeDe(socorro.aliado))} e o bloco inteiro veem.</span>
        </div>
        <div class="soc-conta nao">
          <div class="soc-conta-rot">${ico('x', 11)} SE RECUSAR</div>
          ${socorro.defesaMutua
            ? `<span class="ruim">A Defesa Mútua morre. O artigo que fazia o bloco valer alguma coisa vira letra.</span>
               <span>Todos os membros ficam sabendo — e recalculam o que a sua assinatura vale.</span>`
            : `<span>Sem cláusula militar, ninguém pode te cobrar formalmente.</span>
               <span>Mas ${esc(nomeDe(socorro.aliado))} vai lembrar de quem não veio.</span>`}
          <span class="ruim">Sumir sem responder custa mais que recusar na cara.</span>
        </div>
      </div>
    </div>
    <div class="soc-acoes">
      <button class="soc-sim">${ico('swords', 14)} ATENDER O CHAMADO</button>
      <button class="soc-nao">${ico('x', 14)} RECUSAR</button>
    </div>`;
  document.body.appendChild(el);
  const fechar = () => { el.remove(); onFim?.(); };

  el.querySelector('.soc-sim').addEventListener('click', () => {
    const r = atenderSocorro(jogo.estado, socorro.id);
    fechar();
    if (r.falha) return;
    jogo._empilharFeed?.((r.linhas || []).map((t) => ({ tipo: 'sistema', handle: '🤝 Pacto honrado', cor: '#22e0a0', texto: t })));
    onAtender?.(socorro);
  });
  el.querySelector('.soc-nao').addEventListener('click', () => {
    const r = abandonarSocorro(jogo.estado, socorro.id);
    fechar();
    if (r.falha) return;
    jogo._empilharFeed?.((r.linhas || []).map((t) => ({ tipo: 'sistema', handle: '⚖ Chancelaria', cor: '#ff3b5c', texto: t })));
    onFim?.();
  });
}

// ── A OPERAÇÃO DE RETOMADA ────────────────────────────────────────────
// Aberta pelo clique no aliado atacado. Escolhe QUAIS territórios retomar e com que
// fatia da reserva — a mesma linguagem do Modo Defesa, porque é a mesma decisão
// (quanto do meu exército eu comprometo) e duas gramáticas para a mesma coisa só
// confundiriam.
export function abrirOperacaoRetomada(jogo, isoAliado, { onFim, globoCtrl } = {}) {
  if (document.querySelector('.soc-op')) return;
  const e = jogo.estado;
  const socorro = socorroDe(e, isoAliado);
  let fracao = 0.4;
  const escolhidos = new Set();

  const modal = document.createElement('div');
  modal.className = 'modal-fundo soc-op';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); onFim?.(); };
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  function unidadesLivres() {
    const l = tropaLivre(e);
    return Object.entries(l).reduce((t, [u, q]) => t + (u === 'ogivas' ? 0 : (q || 0)), 0);
  }
  function pacote(f) {
    const l = tropaLivre(e); const out = {};
    for (const [u, q] of Object.entries(l)) {
      if (u === 'ogivas') continue;
      const n = Math.floor((q || 0) * f);
      if (n > 0) out[u] = n;
    }
    return out;
  }

  function render() {
    const alvos = territoriosRetomaveis(e, isoAliado);
    const livres = unidadesLivres();
    const porOperacao = Math.floor(livres * fracao);
    const ocupados = alvos.filter((t) => !t.meu);
    const meusDele = alvos.filter((t) => t.meu);

    modal.innerHTML = `<div class="soc-painel">
      <div class="soc-op-cab">
        <div class="soc-op-ic">${ico('handshake', 20)}</div>
        <div class="soc-op-tit"><h2>OPERAÇÃO DE SOCORRO · ${esc(nomeDe(isoAliado)).toUpperCase()}</h2>
          <span>${socorro ? `Chamado aberto contra ${esc(nomeDe(socorro.agressor))}` : 'Território do aliado em mãos alheias'}</span></div>
        <button class="pp-fechar soc-x">${ico('x', 16)}</button>
      </div>

      ${ocupados.length ? `
      <div class="soc-lab">${ico('crosshair', 11)} TERRITÓRIOS A RETOMAR <b>${escolhidos.size}/${ocupados.length}</b></div>
      <div class="soc-lista">
        ${ocupados.map((t) => `<button class="soc-alvo ${escolhidos.has(t.id) ? 'on' : ''}" data-id="${esc(t.id)}">
          ${escolhidos.has(t.id) ? ico('check', 12) : ico('circle', 12)}
          <span class="soc-alvo-n">${esc(t.nome)}</span>
          <span class="soc-alvo-d">${ico('flag', 9)} ${esc(nomeDe(t.dono))}</span>
        </button>`).join('')}
      </div>

      <div class="soc-forca">
        <label>${ico('gauge', 11)} FORÇA POR TERRITÓRIO <b id="soc-frac-v">${Math.round(fracao * 100)}%</b>
          <span class="soc-frac-un">${fmt(porOperacao)} unidades em cada</span></label>
        <input type="range" id="soc-frac" min="5" max="100" step="5" value="${Math.round(fracao * 100)}" ${livres <= 0 ? 'disabled' : ''}>
        <div class="soc-frac-nota">${ico('info', 10)} Reserva disponível: <b>${fmt(livres)}</b> unidades. Cada território é uma operação separada, com o seu próprio combate e as suas próprias baixas.</div>
      </div>

      <div class="soc-aviso">${ico('triangle-alert', 12)}
        <span>Retomar solo do aliado é <b>ato de guerra contra quem o ocupa</b>. O território volta para ${esc(nomeDe(isoAliado))} — a menos que você decida ficar com ele, e aí a conta é outra.</span></div>

      <button class="soc-lancar" id="soc-go" ${escolhidos.size && livres > 0 ? '' : 'disabled'}>
        ${ico('swords', 15)} <span>${escolhidos.size ? `LIBERTAR ${escolhidos.size} TERRITÓRIO(S)` : 'ESCOLHA O QUE RETOMAR'}</span>
      </button>` : `
      <div class="soc-vazio">${ico('check', 16)} Nenhum território de ${esc(nomeDe(isoAliado))} está em mãos alheias agora.</div>`}

      ${meusDele.length ? `
      <div class="soc-lab devolver">${ico('flag-off', 11)} SOLO DELE QUE ESTÁ COM VOCÊ <b>${meusDele.length}</b></div>
      <div class="soc-devolver">
        ${meusDele.map((t) => `<div class="soc-dev">
          <span>${esc(t.nome)}</span>
          <button class="soc-restituir" data-id="${esc(t.id)}">${ico('undo-2', 11)} DEVOLVER</button>
          <button class="soc-ficar" data-id="${esc(t.id)}">${ico('flag', 11)} FICAR</button>
        </div>`).join('')}
        <div class="soc-dev-nota">${ico('info', 10)} Devolver honra o socorro. Ficar racha a aliança e o mundo vê — mas o chão é seu.</div>
      </div>` : ''}
    </div>`;

    modal.querySelector('.soc-x').addEventListener('click', fechar);
    modal.querySelectorAll('.soc-alvo').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.id;
      if (escolhidos.has(id)) escolhidos.delete(id); else escolhidos.add(id);
      render();
    }));
    const sl = modal.querySelector('#soc-frac');
    sl?.addEventListener('input', (ev) => {
      fracao = Math.max(0.05, Number(ev.target.value) / 100);
      modal.querySelector('#soc-frac-v').textContent = `${Math.round(fracao * 100)}%`;
      modal.querySelector('.soc-frac-un').textContent = `${fmt(Math.floor(unidadesLivres() * fracao))} unidades em cada`;
    });
    modal.querySelector('#soc-go')?.addEventListener('click', executar);
    modal.querySelectorAll('.soc-restituir').forEach((b) => b.addEventListener('click', () => {
      const r = restituirAoAliado(e, b.dataset.id, isoAliado);
      if (r.falha) return;
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '🤝 Socorro', cor: '#22e0a0', texto: r.linha }]);
      globoCtrl?.atualizar?.(); render();
    }));
    modal.querySelectorAll('.soc-ficar').forEach((b) => b.addEventListener('click', () => {
      const r = ficarComTerritorio(e, b.dataset.id, isoAliado, socorro);
      if (r.falha) return;
      jogo._empilharFeed?.((r.linhas || []).map((t) => ({ tipo: 'sistema', handle: '🗡 Oportunismo', cor: '#ff3b5c', texto: t })));
      globoCtrl?.atualizar?.(); render();
    }));
  }

  // Cada território é uma operação separada — combate próprio, baixas próprias. É o
  // mesmo `resolverEnvio` da retomada do próprio solo, com `resgate: true`: o jogo já
  // sabe que recuperar chão não é aventura imperial e cobra menos por isso.
  function executar() {
    const ids = [...escolhidos];
    if (!ids.length) return;
    const alvos = territoriosRetomaveis(e, isoAliado);
    const linhas = []; let retomados = 0;
    for (const id of ids) {
      const t = alvos.find((x) => x.id === id);
      if (!t || t.meu) continue;
      const dep = pacote(fracao);
      if (!Object.keys(dep).length) { linhas.push('A reserva acabou no meio da operação — o resto da lista não saiu do quartel.'); break; }
      const r = resolverEnvio(e, id, t.dono, dep, { resgate: true });
      if (r.falha) { linhas.push(r.falha); break; }
      if (r.tomou) {
        retomados += 1;
        // O CHÃO É DO ALIADO. `resolverEnvio` grava a conquista como MINHA (é o que ele
        // faz com qualquer território tomado); devolver é apagar essa exceção na hora,
        // senão o socorro nasceria como ocupação e o jogador teria de desfazer à mão.
        const dev = restituirAoAliado(e, id, isoAliado);
        linhas.push(dev.ok ? dev.linha : r.manchete);
      } else {
        linhas.push(`${t.nome} resistiu — ${nomeDe(t.dono)} segurou a linha e a nossa coluna voltou menor.`);
      }
    }
    if (socorro) socorro.retomados = [...new Set([...(socorro.retomados || []), ...ids])];
    jogo._empilharFeed?.(linhas.map((txt) => ({ tipo: 'sistema', handle: '🤝 Socorro', cor: '#22e0a0', texto: txt })));
    // O ALIADO PRECISA VER QUE ALGUÉM VEIO — metade da recompensa de uma aliança é essa
    // notificação chegando na tela dele.
    jogo._relayOnline?.('socorro_resultado', isoAliado,
      resumoSocorro(socorro || { aliado: isoAliado }, { retomados, mantidos: 0 }),
      { aliado: isoAliado, agressor: socorro?.agressor || null, retomados, ids });
    globoCtrl?.atualizar?.();
    escolhidos.clear();
    render();
  }

  render();
}

// ── O ALIADO SOCORRIDO RECEBE A NOTÍCIA ───────────────────────────────
export function avisarSocorroRecebido(jogo, ev) {
  const quem = ev.deNome || nomeDe(ev.dePais);
  alertaUrgente({
    titulo: '🤝 ALGUÉM VEIO',
    texto: `${quem} entrou na guerra pelo seu lado e retomou ${ev.dados?.retomados || 0} território(s) seu(s). O pacto valeu alguma coisa.`,
    tom: 'bom', comSom: false,
  });
  jogo._empilharFeed?.([{ tipo: 'jogador', handle: `🤝 ${quem}`, paisOrigem: ev.dePais, texto: ev.texto || 'veio em socorro.', cor: '#22e0a0' }]);
}

