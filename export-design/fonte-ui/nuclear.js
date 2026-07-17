// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE LANÇAMENTO NUCLEAR — a decisão com a conta à vista
// ═══════════════════════════════════════════════════════════════════════
// A ergonomia aqui é deliberadamente PESADA. Comprar um caça é um clique; lançar
// uma ogiva tem de doer no dedo. Duas etapas obrigatórias — a conta e a confirmação
// com trava — porque o jogo quer que você HESITE. O horror de depois começa aqui,
// na fricção de antes.
import { avaliarOgiva, podeDispararOgiva, dispararOgiva, manchetesNucleares } from '../jogo/nuclear.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { sirene, flashTela } from './efeitos.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export function abrirNuclear(feature, jogo, { onFim, globoCtrl } = {}) {
  const iso = feature?.properties?.ISO_A3 || feature?.properties?.ADM0_A3 || '';
  const pode = podeDispararOgiva(jogo.estado, iso);
  const av = avaliarOgiva(jogo.estado, iso);

  const modal = document.createElement('div');
  modal.className = 'modal-fundo nuke-modal';
  document.body.appendChild(modal);

  let armado = false;   // a trava de segurança: só dispara depois de "armar"
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
  const sair = () => { fechar(); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', tecla);

  modal.innerHTML = `<div class="nuke-painel">
    <div class="nk-cab">
      <span class="nk-simbolo">${ico('radiation', 26)}</span>
      <div class="nk-tit">
        <h2>LANÇAMENTO NUCLEAR</h2>
        <div class="nk-sub">Autorização de nível estratégico</div>
      </div>
      ${ISO2_DE[iso] ? `<img class="gp-flag" src="${bandeira(ISO2_DE[iso], 80)}" alt="">` : ''}
      <button class="pp-fechar" id="nk-x">${ico('x', 16)}</button>
    </div>

    <div class="nk-alvo">
      <span>ALVO CONFIRMADO</span>
      <b>${esc(av.nome)}</b>
    </div>

    ${!pode.pode ? `<div class="nk-bloqueio">${ico('ban', 16)} ${esc(pode.motivo)}</div>` : `
    <div class="nk-arsenal">${ico('radiation', 13)} Ogivas operacionais: <b>${jogo.estado.ogivas}</b> — esta jogada gasta <b>1</b>.</div>

    <div class="nk-conta">
      <div class="nk-conta-cab">${ico('triangle-alert', 14)} O QUE ACONTECE QUANDO VOCÊ APERTA O BOTÃO</div>
      <ul>
        <li><b>${esc(av.nome)}</b> deixa de existir como adversário. Vira zona radioativa — inabitável por gerações.</li>
        <li>O <b>tabu nuclear quebra</b>. Todo país recua de você: relações despencam no mundo inteiro, o soft power colapsa.</li>
        <li>O medo global explode: temperatura de guerra ao máximo, o petróleo em pânico.</li>
        ${av.riscoRetaliacao ? `<li class="nk-mad">${ico('skull', 12)} <b>RISCO DE RETALIAÇÃO:</b> ${av.ogivasAlvo > 0 ? `${esc(av.nome)} tem ${av.ogivasAlvo} ogivas` : `os aliados nucleares (${av.guardioes.map(esc).join(', ')})`} podem revidar. Destruição Mútua Assegurada.</li>` : `<li>${esc(av.nome)} não tem como revidar em espécie. Desta vez.</li>`}
        ${av.chanceIntercept > 0.08 ? `<li class="${av.escudoForte ? 'nk-mad' : ''}">${ico('shield', 12)} <b>ESCUDO ANTIMÍSSIL:</b> ${esc(av.nome)} tem <b>${Math.round(av.chanceIntercept * 100)}% de chance</b> de abater a ogiva na reentrada.${av.escudoForte ? ' Uma defesa dessas gasta a sua ogiva e te deixa com a vergonha — sem nada em troca.' : ''}</li>` : ''}
      </ul>
    </div>

    <div class="nk-acoes" id="nk-acoes">
      <button class="nk-armar" id="nk-armar">${ico('lock', 15)} <span>ARMAR O SISTEMA</span></button>
    </div>
    `}
  </div>`;

  modal.querySelector('#nk-x').addEventListener('click', sair);
  modal.addEventListener('click', (ev) => { if (ev.target === modal && !armado) sair(); });

  // ── ARMAR → DISPARAR (a trava de duas etapas) ─────────────────────────
  modal.querySelector('#nk-armar')?.addEventListener('click', () => {
    armado = true;
    const acoes = modal.querySelector('#nk-acoes');
    acoes.innerHTML = `
      <div class="nk-armado">${ico('radiation', 13)} SISTEMA ARMADO — a chave girou. Não há desfazer depois disto.</div>
      <button class="nk-lancar" id="nk-lancar">${ico('radiation', 17)} <span>LANÇAR CONTRA ${esc(av.nome.toUpperCase())}</span></button>
      <button class="nk-abortar" id="nk-abortar">Abortar</button>`;
    acoes.querySelector('#nk-abortar').addEventListener('click', sair);
    acoes.querySelector('#nk-lancar').addEventListener('click', () => executar());
  });

  // ── A EXECUÇÃO ────────────────────────────────────────────────────────
  async function executar() {
    // fecha o painel: a partir daqui o palco é o globo
    modal.classList.add('lancando');
    modal.querySelector('.nuke-painel').style.display = 'none';

    const relato = dispararOgiva(jogo.estado, iso);

    // o 3D: a ogiva sobe, reentra e — se o escudo do alvo for bom — é ABATIDA no ar.
    // Interceptada: clarão ciano no céu + radar defensivo gigante, sem clarão de tela.
    // Não interceptada: cogumelo, sirene e o mundo apagando junto.
    globoCtrl?.lancarOgiva?.(feature, null, () => {
      sirene({ ruim: true });
      flashTela(true);
      // um clarão branco em tela cheia no instante da detonação
      const clarao = document.createElement('div');
      clarao.className = 'nk-clarao';
      document.body.appendChild(clarao);
      setTimeout(() => clarao.remove(), 1400);
    }, {
      interceptado: relato.interceptado,
      aoInterceptar: () => { sirene({ ruim: true }); },
    });

    // enquanto o míssil voa (~4s), deixa o globo respirar
    await espera(6500);

    // o mundo grita: manchetes nucleares entram no feed
    for (const m of manchetesNucleares(jogo.estado, relato)) {
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'ALERTA NUCLEAR', texto: m.texto, cor: '#ff3b5c' }]);
    }
    // aliados horrorizados entram em modo alerta no mapa
    globoCtrl?.alertaTemporario?.(relato.reacoes.map((r) => isoDaRel(r.chave)).filter(Boolean), 30000);

    fechar();
    mostrarDesfecho(relato);
  }

  // ── O DESFECHO — a tela do que você fez ──────────────────────────────
  function mostrarDesfecho(relato) {
    const d = document.createElement('div');
    d.className = 'modal-fundo';

    // ── ABATIDA: o escudo do alvo venceu ──────────────────────────────
    if (relato.interceptado) {
      d.innerHTML = `<div class="nuke-desfecho nkd-abatida">
        <div class="nkd-simbolo nkd-escudo">${ico('shield', 40)}</div>
        <h2>A OGIVA FOI ABATIDA</h2>
        <p class="nkd-lead">O escudo antimíssil de ${esc(av.nome)} interceptou a ogiva na reentrada. Nenhuma cidade morreu — e é essa a única boa notícia que você tem.</p>
        <div class="nkd-grade">
          ${relato.mudancas.filter((m) => m.delta).slice(0, 6).map((m) => `<span class="mud ${m.delta > 0 ? 'bom' : 'ruim'}">${esc(m.rotulo || m.chave)} ${m.delta > 0 ? '+' : ''}${m.delta}</span>`).join('')}
        </div>
        <div class="nkd-mad">${ico('eye', 16)} <b>O mundo viu.</b> Você apertou o botão e falhou. ${esc(av.nome)} virou vítima diante de todos, e você virou o Estado que tenta o impensável — e erra.</div>
        <div class="nkd-mundo">${ico('globe', 13)} <b>${relato.reacoes.length} nações</b> despencaram nas relações com você. Ninguém esquece uma tentativa.</div>
        <div class="nkd-restante">${ico('radiation', 12)} Ogiva gasta à toa. Restam no arsenal: <b>${relato.ogivasRestantes}</b></div>
        <button class="avancar" id="nkd-ok">ENGOLIR O FRACASSO ${ico('chevron-right', 15)}</button>
      </div>`;
      document.body.appendChild(d);
      d.querySelector('#nkd-ok').addEventListener('click', () => { d.remove(); onFim?.(); });
      return;
    }

    d.innerHTML = `<div class="nuke-desfecho">
      <div class="nkd-simbolo">${ico('radiation', 40)}</div>
      <h2>${esc(av.nome).toUpperCase()} FOI APAGADO DO MAPA</h2>
      <p class="nkd-lead">Você cruzou a linha que 80 anos de humanidade tiveram medo de cruzar. O que vem agora não é vitória — é o depois.</p>

      <div class="nkd-grade">
        ${relato.mudancas.filter((m) => m.delta).slice(0, 6).map((m) => `<span class="mud ${m.delta > 0 ? 'bom' : 'ruim'}">${esc(m.rotulo || m.chave)} ${m.delta > 0 ? '+' : ''}${m.delta}</span>`).join('')}
      </div>

      <div class="nkd-mundo">${ico('globe', 13)} <b>${relato.reacoes.length} nações</b> despencaram nas relações com você. Você é, oficialmente, um pária.</div>

      ${relato.retaliacao ? (relato.retaliacao.dano
        ? `<div class="nkd-mad">${ico('skull', 16)} <b>${esc(relato.retaliacao.vingadorNome)} RETALIOU.</b> Uma das suas cidades também é cinza agora. Destruição Mútua Assegurada deixou de ser teoria — e ninguém venceu.</div>`
        : `<div class="nkd-quase">${ico('shield', 16)} ${esc(relato.retaliacao.vingadorNome)} lançou a resposta. Interceptada por segundos. Estivemos no fio da navalha.</div>`) : ''}

      <div class="nkd-restante">${ico('radiation', 12)} Ogivas restantes no arsenal: <b>${relato.ogivasRestantes}</b></div>
      <button class="avancar" id="nkd-ok">VIVER COM ISSO ${ico('chevron-right', 15)}</button>
    </div>`;
    document.body.appendChild(d);
    d.querySelector('#nkd-ok').addEventListener('click', () => { d.remove(); onFim?.(); });
  }
}

// rel_<x> → ISO, pra acender o alerta no mapa nos aliados horrorizados
function isoDaRel(chave) {
  const alvo = Object.entries(PAISES).find(([, p]) => p.rel === chave);
  return alvo ? alvo[0] : null;
}
