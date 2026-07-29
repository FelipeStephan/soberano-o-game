// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE LANÇAMENTO NUCLEAR — a decisão com a conta à vista
// ═══════════════════════════════════════════════════════════════════════
// A ergonomia aqui é deliberadamente PESADA. Comprar um caça é um clique; lançar
// uma ogiva tem de doer no dedo. Duas etapas obrigatórias — a conta e a confirmação
// com trava — porque o jogo quer que você HESITE. O horror de depois começa aqui,
// na fricção de antes.
import { avaliarOgiva, podeDispararOgiva, dispararOgiva, manchetesNucleares, partidaSemNucleares } from '../jogo/nuclear.js';
// O VOO DE DOZE SEGUNDOS (pedido do dono: "ter um tempo pra bomba cair e ver no mapa
// ela"). O motor puro mora em jogo/voo.js — aqui fica só o palco.
import { DUR_VOO_MS, faseDoVoo, registrarVoo, removerVoo, decidirAbate } from '../jogo/voo.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { sirene, flashTela } from './efeitos.js';
import { ico } from './icones.js';
import { tocarNuclear, tocarEfeito } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export function abrirNuclear(feature, jogo, { onFim, globoCtrl } = {}) {
  const iso = feature?.properties?.ISO_A3 || feature?.properties?.ADM0_A3 || '';
  const pode = podeDispararOgiva(jogo.estado, iso);
  const av = avaliarOgiva(jogo.estado, iso);
  // PARTIDA SEM NUCLEARES: o painel abre e EXPLICA em vez de sumir. Botão que
  // desaparece sem motivo vira suporte ("cadê o nuclear?"); regra que aparece
  // escrita vira acordo — o jogador entende que o mundo é assim, não que quebrou.
  const semNuke = partidaSemNucleares(jogo.estado);
  // O alvo é uma PESSOA na sala? A resposta muda o texto do desfecho inteiro: não
  // se derrota um jogador com uma ogiva, se apaga.
  const alvoHumano = !!(jogo.ehOnline && jogo._ehHumanoOnline?.(iso));

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

    ${semNuke ? `<div class="nk-sem-nuke">
      <div class="nk-sem-cab">${ico('ban', 15)} MUNDO SEM ARMAS NUCLEARES</div>
      <p>Esta partida foi criada com o arsenal atômico desligado — e não só o seu: <b>nenhum país do mundo tem ogivas</b>, nem a Rússia, nem os Estados Unidos, nem quem você teme.</p>
      <p>Não há botão a apertar, não há dissuasão a comprar e não há chantagem a fazer. Esta guerra se decide com exército, dinheiro e conversa — que é exatamente o ponto.</p>
    </div>` : !pode.pode ? `<div class="nk-bloqueio">${ico('ban', 16)} ${esc(pode.motivo)}</div>` : `
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
    tocarEfeito('alerta-nuclear', { volume: 0.6 });   // a chave girou — o aviso soa
    const acoes = modal.querySelector('#nk-acoes');
    acoes.innerHTML = `
      <div class="nk-armado">${ico('radiation', 13)} SISTEMA ARMADO — a chave girou. Não há desfazer depois disto.</div>
      <button class="nk-lancar" id="nk-lancar">${ico('radiation', 17)} <span>LANÇAR CONTRA ${esc(av.nome.toUpperCase())}</span></button>
      <button class="nk-abortar" id="nk-abortar">Abortar</button>`;
    acoes.querySelector('#nk-abortar').addEventListener('click', sair);
    acoes.querySelector('#nk-lancar').addEventListener('click', () => executar());
  });

  // ── A EXECUÇÃO ────────────────────────────────────────────────────────
  // O QUE MUDOU AQUI (pedido do dono): a ogiva agora VOA por doze segundos visíveis em
  // vez de ~2,8s com a câmera parada no alvo. E, mais importante, o RESULTADO deixa de
  // ser decidido no instante do lançamento: ele é resolvido no impacto, para que a
  // interceptação de emergência que o alvo pode comprar durante o voo ainda valha.
  //
  // A ordem importa e é o coração do formato online (ver jogo/voo.js):
  //   1. avisa a sala IMEDIATAMENTE, com o INSTANTE do impacto — todos veem o mesmo voo;
  //   2. anima os doze segundos;
  //   3. só então aplica o efeito, com o dado rolado agora.
  // Fazer o efeito primeiro (como era) significava o país já estar apagado no mapa do
  // alvo enquanto o míssil dele ainda estava no ar.
  let reforcoDefesa = 0;   // preenchido se o alvo comprar interceptação durante o voo

  async function executar() {
    // fecha o painel: a partir daqui o palco é o globo — com trilha própria
    // (a música de fundo abaixa sozinha enquanto a da bomba toca).
    tocarNuclear();
    modal.classList.add('lancando');
    modal.querySelector('.nuke-painel').style.display = 'none';

    // A TRAVA VEM ANTES DO VOO. Doze segundos de cinema por cima de um lançamento que
    // o motor vai recusar é a pior mentira que esta tela poderia contar.
    if (partidaSemNucleares(jogo.estado) || (jogo.estado.ogivas || 0) <= 0) {
      modal.classList.remove('lancando');
      const p = modal.querySelector('.nuke-painel');
      const motivo = partidaSemNucleares(jogo.estado)
        ? 'Esta partida foi criada sem armas nucleares. Não há ogiva a lançar.'
        : 'Sem ogivas operacionais no arsenal.';
      if (p) { p.style.display = ''; p.innerHTML = `<div class="nk-bloqueio">${ico('ban', 16)} ${esc(motivo)}</div>`; }
      setTimeout(sair, 2600);
      return;
    }

    const de = globoCtrl?.ondeEsta?.(jogo.estado.iso || 'USA') || null;
    const para = feature?.properties ? { lat: feature.properties.LABEL_Y, lng: feature.properties.LABEL_X } : null;
    const voo = {
      id: `nk_${jogo.estado.iso || 'X'}_${iso}_${Date.now()}`,
      de: jogo.estado.iso || null, alvo: iso, alvoNome: av.nome,
      porNome: jogo.ficha?.presidente || jogo.ficha?.pais || null,
      impactoEm: Date.now() + DUR_VOO_MS, duracaoMs: DUR_VOO_MS,
      chanceIntercept: av.chanceIntercept, alvoHumano,
      coordDe: de, coordPara: para,
    };
    registrarVoo(jogo.estado, voo);

    // 1 · A SALA SABE AGORA. O bilhete leva o INSTANTE do impacto, não "12 segundos":
    // quem receber com 300ms de atraso vê 11,7s de voo e o clarão cai na mesma hora
    // para todo mundo. Leva também as coordenadas, para o arco ser o mesmo arco.
    jogo._relayOnline?.('nuclear', iso,
      `${voo.porNome || 'Um jogador'} LANÇOU UMA OGIVA NUCLEAR contra ${av.nome}.`,
      {
        id: voo.id, iso, emVoo: true,
        impactoEm: voo.impactoEm, duracaoMs: DUR_VOO_MS,
        chanceIntercept: av.chanceIntercept,
        alvoHumano, porIso: jogo.estado.iso || null, porNome: voo.porNome,
        de, para,
      });

    // 2 · O VOO. `interceptado` é uma FUNÇÃO: ela só roda quando o míssil chega ao
    // ponto de reentrada, e é aí que o reforço comprado pelo alvo entra na conta.
    let veredito = null;
    const decidir = () => {
      veredito = decidirAbate(av.chanceIntercept, reforcoDefesa);
      return veredito.interceptado;
    };
    globoCtrl?.lancarOgiva?.(feature, null, null, {
      duracaoMs: DUR_VOO_MS,
      interceptado: decidir,
      aoInterceptar: () => { sirene({ ruim: true }); },
    });
    const painelVoo = abrirPainelVoo(voo);
    await espera(DUR_VOO_MS + 250);
    painelVoo?.fechar?.();
    removerVoo(jogo.estado, voo.id);

    // Se o míssil nunca chegou à reentrada (aba em segundo plano congela o
    // requestAnimationFrame e a animação não avança), o veredito não foi rolado. Rola
    // aqui: o resultado não pode depender de o jogador ter deixado a aba na frente.
    if (!veredito) veredito = decidirAbate(av.chanceIntercept, reforcoDefesa);

    // 3 · O EFEITO, agora. Mesma função de sempre — só com o dado já rolado.
    const relato = dispararOgiva(jogo.estado, iso, { alvoHumano, forcarIntercepcao: veredito.interceptado });
    if (relato.bloqueado) { fechar(); onFim?.(); return; }

    if (!veredito.interceptado) {
      sirene({ ruim: true });
      flashTela(true);
      // um clarão branco em tela cheia no instante da detonação
      const clarao = document.createElement('div');
      clarao.className = 'nk-clarao';
      document.body.appendChild(clarao);
      setTimeout(() => clarao.remove(), 1400);
    }

    // O RESULTADO ecoa em separado do lançamento: a sala precisa saber se a ogiva
    // chegou ao chão, e essa informação só passa a existir agora.
    jogo._relayOnline?.('nuclear_impacto', iso,
      veredito.interceptado
        ? `A ogiva contra ${av.nome} foi ABATIDA no ar.`
        : `A ogiva atingiu ${av.nome}.`,
      { id: voo.id, iso, zonaMorta: !veredito.interceptado, interceptado: !!veredito.interceptado,
        alvoHumano, porIso: jogo.estado.iso || null, porNome: voo.porNome, chance: veredito.chance });

    // o mundo grita: manchetes nucleares entram no feed
    for (const m of manchetesNucleares(jogo.estado, relato)) {
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'ALERTA NUCLEAR', texto: m.texto, cor: '#ff3b5c' }]);
    }
    // aliados horrorizados entram em modo alerta no mapa
    globoCtrl?.alertaTemporario?.(relato.reacoes.map((r) => isoDaRel(r.chave)).filter(Boolean), 30000);
    // A CRATERA APARECE AGORA, não na próxima batida. `zonasRadioativas` só é lido
    // quando o globo se atualiza — sem este empurrão o país continuava normal no
    // mapa de quem acabou de apagá-lo, por até meio minuto.
    globoCtrl?.atualizar?.();

    fechar();
    mostrarDesfecho(relato);
  }

  // ── O PAINEL DE VOO (de quem lançou) ─────────────────────────────────
  // Quem aperta o botão também precisa TESTEMUNHAR. Antes o lançador ficava olhando um
  // globo mudo, sem saber o que estava acontecendo nem quanto faltava. Este painel não
  // tem botão nenhum, de propósito: a chave já girou, ele é a consequência — não uma
  // segunda chance de decidir.
  function abrirPainelVoo(voo) {
    const el = document.createElement('div');
    el.className = 'nk-voo';
    document.body.appendChild(el);
    const t0 = Date.now();
    const pinta = () => {
      const pct = Math.min(1, (Date.now() - t0) / voo.duracaoMs);
      const f = faseDoVoo(pct);
      const seg = Math.max(0, Math.ceil((voo.duracaoMs - (Date.now() - t0)) / 1000));
      el.innerHTML = `
        <div class="nk-voo-cab">${ico('radiation', 14)} <b>OGIVA EM VOO</b>
          <span>${esc(String(voo.alvoNome || voo.alvo).toUpperCase())}</span></div>
        <div class="nk-voo-fase">${esc(f.rot)}</div>
        <div class="nk-voo-txt">${esc(f.txt)}</div>
        <div class="nk-voo-trilho"><i style="width:${(pct * 100).toFixed(1)}%"></i></div>
        <div class="nk-voo-conta">IMPACTO EM <b>${seg}s</b></div>`;
    };
    pinta();
    const t = setInterval(pinta, 120);
    return { fechar: () => { clearInterval(t); el.classList.add('saindo'); setTimeout(() => el.remove(), 400); } };
  }

  // O ALVO COMPROU INTERCEPTAÇÃO durante o voo. O bilhete dele chega pelo relay
  // (ui/online.js) e é incorporado à decisão que ainda não foi tomada. Se chegar depois
  // da reentrada, o `veredito` já existe e este valor simplesmente não é usado — que é
  // exatamente a regra da janela: quem hesitou, perdeu.
  jogo._reforcoNuclear = (id, valor) => {
    if (Number.isFinite(valor)) reforcoDefesa = Math.max(reforcoDefesa, Number(valor));
  };

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
        <div class="nkd-reversivel">${ico('shield', 12)} Não há cratera, não há zona morta, não há território perdido. <b>Nada aqui é permanente</b> — só a memória do mundo, que cobra juros.</div>
        <button class="avancar" id="nkd-ok">ENGOLIR O FRACASSO ${ico('chevron-right', 15)}</button>
      </div>`;
      document.body.appendChild(d);
      d.querySelector('#nkd-ok').addEventListener('click', () => { d.remove(); onFim?.(); });
      return;
    }

    // ── O QUE NÃO VOLTA ────────────────────────────────────────────────
    // A grade de medidores conta a conjuntura — números que sobem de novo com o
    // tempo. Esta lista conta o que é PERMANENTE, e o jogador precisa ler os dois
    // separados: perder soft power é caro; apagar um país é para sempre.
    const permanente = (relato.zona?.linhas || []);
    d.innerHTML = `<div class="nuke-desfecho">
      <div class="nkd-simbolo">${ico('radiation', 40)}</div>
      <h2>${esc(av.nome).toUpperCase()} FOI APAGADO DO MAPA</h2>
      <p class="nkd-lead">Você cruzou a linha que 80 anos de humanidade tiveram medo de cruzar. O que vem agora não é vitória — é o depois.</p>

      ${relato.alvoHumano ? `<div class="nkd-apagado">${ico('skull', 16)}
        <span><b>Havia uma pessoa jogando ${esc(av.nome)}.</b> Ela não foi derrotada — foi <b>APAGADA</b>. Não há governo para render, capital para tomar nem acordo para assinar: aquele país saiu da partida, e você foi quem tirou.</span>
      </div>` : ''}

      <div class="nkd-grade">
        ${relato.mudancas.filter((m) => m.delta).slice(0, 6).map((m) => `<span class="mud ${m.delta > 0 ? 'bom' : 'ruim'}">${esc(m.rotulo || m.chave)} ${m.delta > 0 ? '+' : ''}${m.delta}</span>`).join('')}
      </div>

      <div class="nkd-permanente">
        <div class="nkd-perm-cab">${ico('radiation', 12)} ISTO NÃO TEM VOLTA</div>
        <ul>
          <li>${esc(av.nome)} é uma <b>zona morta permanente</b>. Não se ocupa, não se reconstrói, não se anexa — nunca mais, nesta partida.</li>
          ${permanente.map((l) => `<li>${esc(l)}</li>`).join('')}
        </ul>
        <p class="nkd-perm-nota">Os medidores acima voltam a subir com o tempo. A cratera, não.</p>
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
