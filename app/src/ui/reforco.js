// ═══════════════════════════════════════════════════════════════════════
// REFORÇAR TERRITÓRIO — decidir ONDE o seu exército está
// ═══════════════════════════════════════════════════════════════════════
// A tela que faz a guarnição existir para o jogador. Do lado de cá o quartel
// central (o que ainda não tem endereço); do lado de lá o estado. Mover tropa é
// a decisão mais barata e mais decisiva do jogo: não custa dinheiro, custa
// COBERTURA — cada soldado que vai pro Rio é um soldado que não está em Manaus.
import {
  guarnicao, forcaGuarnicao, tropaLivre, reforcar, recolher, donoDe,
} from '../jogo/territorio.js';
import { classificar } from './tatico.js';
import { UNIDADES, UNIDADE_POR_ID, DOMINIOS } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { FOTO_UNIDADE, bandeira, ISO2_DE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { TIPOS_BASE, instalarBaseEstado, basesNoEstado } from '../dados/bases.js';
import { silhuetaDe } from './territorioSvg.js';
import { ico, ICO } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// O CUSTO DA MOVIMENTAÇÃO — mover tropa deixou de ser grátis (pedido do dono). Uma
// operação de deslocamento tem logística (por unidade) + combustível (escalado pelo
// Brent) + uma base de mobilização. É o que faz "segurar o território" ser uma
// DECISÃO econômica, não um clique sem consequência.
function custoMovimento(e, envio) {
  let unidades = 0; let log = 0;
  for (const [u, v] of Object.entries(envio)) {
    const n = Math.abs(v || 0); if (!n) continue;
    unidades += n;
    log += n * (UNIDADE_POR_ID[u]?.custoLog || 0);
  }
  if (!unidades) return { total: 0, base: 0, log: 0, comb: 0, unidades: 0 };
  const barril = e.preco_petroleo || 78;
  const base = 0.04;                                   // mobilização (comando, transporte)
  const comb = Math.round(log * 0.6 * (barril / 78) * 100) / 100;   // combustível pelo Brent
  const total = Math.round((base + log + comb) * 100) / 100;
  return { total, base: Math.round(base * 100) / 100, log: Math.round(log * 100) / 100, comb, unidades };
}

export function abrirReforco(feature, jogo, { onFim, globoCtrl } = {}) {
  const p = feature.properties;
  const e = jogo.estado;
  const meu = donoDe(e, p.id) === (e.iso || 'USA');

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
  const sair = () => { fechar(); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) sair(); });

  // Território de outro: aqui não se reforça, se planeja retomada.
  if (!meu) {
    const dono = donoDe(e, p.id);
    const perdido = (p.pais === (e.iso || 'USA'));
    modal.innerHTML = `<div class="ref-painel">
      <div class="ref-cab">
        <span class="ref-simbolo ${perdido ? 'perdido' : ''}">${ico(perdido ? 'flag-off' : 'map-pin', 22)}</span>
        <div class="ref-tit"><h2>${esc(p.nome)}</h2>
          <div class="ref-sub">${esc(p.tipo)} · ${esc(PAISES[dono]?.nome || dono)}</div></div>
        ${ISO2_DE[dono] ? `<img class="ref-flag" src="${bandeira(ISO2_DE[dono], 80)}" alt="">` : ''}
        <button class="pp-fechar" id="ref-x">${ico('x', 16)}</button>
      </div>
      <div class="ref-alheio ${perdido ? 'perdido' : ''}">${ico(perdido ? 'triangle-alert' : 'info', 16)}
        <span>${perdido
          ? `<b>Este território era seu.</b> ${esc(PAISES[dono]?.nome || dono)} o tomou. Enquanto estiver nas mãos deles, a bandeira no mapa é vermelha — e todo mundo vê.`
          : `Território de ${esc(PAISES[dono]?.nome || dono)}. Você não posiciona tropa em solo alheio: primeiro se conquista, depois se guarnece.`}</span></div>
    </div>`;
    modal.querySelector('#ref-x').addEventListener('click', sair);
    return;
  }

  const envio = {};    // positivo = mandar pra lá; negativo = trazer de volta
  render();

  function render() {
    const g = guarnicao(e, p.id);
    const livre = tropaLivre(e);
    const equip = equipamentosDoPais(e.iso || 'USA');
    const cls = classificar(e, p.id);
    const conf = e.conflitosEstado?.[p.id];
    const fc = forcaGuarnicao(g);
    // Está segurando? A guarnição vale 1,6× na defesa (terreno, trincheira). Abaixo do
    // limiar que sossega a revolta (2.0), você está perdendo o território.
    const segurando = fc >= 2.0;

    // Só mostramos o que existe: unidade sem nenhuma no país inteiro é ruído.
    const uteis = UNIDADES.filter((u) => (livre[u.id] || 0) > 0 || (g[u.id] || 0) > 0);

    // total de tropas guarnecendo (pro resumo do topo, SEM fileira de emojis)
    const totalAqui = Object.values(g).reduce((s, q) => s + (q || 0), 0);
    // a SILHUETA do estado — o vetor da forma, direto da feature do globo
    const silhueta = silhuetaDe(feature.geometry, { id: p.id, tam: 40 });

    modal.innerHTML = `<div class="ref-painel v2">
      <div class="ref-cab">
        <span class="ref-simbolo ${silhueta ? 'com-mapa' : ''}">${silhueta || ico('shield', 22)}</span>
        <div class="ref-tit"><h2>${esc(p.nome)}</h2>
          <div class="ref-sub">${esc(p.tipo)} · ${cls === 'conquistado' ? 'conquistado por você' : 'seu território'}</div></div>
        <div class="ref-forca-hero"><small>FORÇA</small><b id="ref-fc-cab">${fc}</b></div>
        <button class="pp-fechar" id="ref-x">${ico('x', 16)}</button>
      </div>

      ${conf ? `<div class="ref-conflito ${segurando ? 'ok' : 'perigo'}">
        <div class="ref-conf-topo">
          <span class="ref-conf-tag">${ico('swords', 14)} ${esc(PAISES[conf.por]?.nome || conf.por)} TENTA RETOMAR</span>
          <span class="ref-conf-vered ${segurando ? 'ok' : 'perigo'}">${segurando ? '✔ SEGURANDO A LINHA' : '✕ PERDENDO O TERRITÓRIO'}</span>
        </div>
        <div class="ref-conf-barras">
          <div class="ref-conf-b"><span>Sua defesa · força ${fc}</span><i class="def" style="width:${Math.min(100, fc * 20)}%"></i></div>
          <div class="ref-conf-b"><span>Pressão inimiga · ${Math.round(conf.intensidade || 0)}%</span><i class="atk" style="width:${Math.min(100, Math.round(conf.intensidade || 0))}%"></i></div>
        </div>
        <div class="ref-conf-nota">${segurando
          ? 'Sua guarnição sufoca a revolta. Reforce ainda mais para encerrar a disputa neste turno.'
          : 'Sem reforço, o território cai no fechamento do turno. Mande tropa AGORA — cada unidade empurra a pressão pra baixo.'}</div>
      </div>` : ''}

      <div class="ref-topo-linha">
        ${fc > 0
          ? `<span>${ico('shield', 12)} <b>${totalAqui.toLocaleString('pt-BR')}</b> unidades guarnecendo — os números "aqui" estão em cada linha</span>
             <button class="ref-recolher-tudo" id="ref-recall" data-tip="Recolher toda a guarnição de volta ao quartel">${ico('undo-2', 12)} recolher tudo</button>`
          : `<span>${ico('info', 12)} Nenhuma tropa designada aqui — puxe do quartel nas linhas abaixo</span>`}
      </div>

      ${uteis.length ? `<div class="ref-lista">
        ${DOMINIOS.map((d) => {
          const us = uteis.filter((u) => u.dominio === d);
          if (!us.length) return '';
          return `<div class="ref-grupo"><div class="ref-dom">${ico(ICO[d] || 'circle', 11)} ${d}</div>
            ${us.map((u) => {
              const aqui = g[u.id] || 0;
              const noQuartel = livre[u.id] || 0;
              const eq = equip?.[u.id];
              const foto = eq?.foto || FOTO_UNIDADE[u.id];
              return `<div class="ref-item" data-u="${u.id}">
                <span class="ref-foto">${foto ? `<img src="${foto}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${u.icone}'">` : u.icone}</span>
                <span class="ref-info">
                  <b>${esc(eq?.nome || u.nome)}</b>
                  <small><i class="rq">${noQuartel.toLocaleString('pt-BR')}</i> no quartel · <i class="ra">${aqui.toLocaleString('pt-BR')}</i> aqui</small>
                </span>
                <div class="ref-ctrl">
                  <button class="ref-btn" data-d="-1" data-tip="Trazer de volta ao quartel central">−</button>
                  <input class="ref-qtd" data-u="${u.id}" type="number" value="0" step="${u.passo}">
                  <button class="ref-btn" data-d="1" data-tip="Enviar tropa para cá">+</button>
                </div>
              </div>`;
            }).join('')}
          </div>`;
        }).join('')}
      </div>` : `<div class="ref-alheio">${ico('info', 15)} <span>Seu arsenal está vazio. Compre unidades no mercado antes de posicionar tropa.</span></div>`}

      ${uteis.length ? `<div class="ref-poder" id="ref-poder">
        <div class="ref-poder-l"><small>PODER DA GUARNIÇÃO</small>
          <div class="ref-poder-n"><b id="ref-fc">${fc}</b><i class="ref-poder-delta" id="ref-delta"></i></div>
          <div class="ref-poder-barra"><i id="ref-poder-fill" style="width:${Math.min(100, fc * 10)}%"></i></div>
        </div>
        <div class="ref-poder-r" id="ref-prev"></div>
      </div>
      <button class="ref-confirmar" id="ref-ok">${ico('send', 15)} <span>CONFIRMAR MOVIMENTAÇÃO</span></button>` : ''}

      ${secaoBase()}
    </div>`;

    modal.querySelector('#ref-x').addEventListener('click', sair);

    // RECOLHER TODA A GUARNIÇÃO — o atalho direto pra liberar a tropa deste estado.
    // É o "como eu tiro a tropa daqui?" resolvido em um clique.
    modal.querySelector('#ref-recall')?.addEventListener('click', () => {
      const toda = { ...guarnicao(e, p.id) };
      if (!Object.keys(toda).length) return;
      const r = recolher(e, p.id, toda);
      if (r.falha) return;
      const conf3 = e.conflitosEstado?.[p.id];
      globoCtrl?.atualizar?.();
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', cor: '#ffb020', texto: `Guarnição de ${esc(p.nome)} recolhida ao quartel. ${conf3 ? 'CUIDADO: o território ficou descoberto sob pressão inimiga.' : 'A tropa está livre para ser realocada.'}` }]);
      render();
    });

    const prev = modal.querySelector('#ref-prev');
    // O PODER VIVO — o pedido do dono: "quando eu colocar um caça, embaixo vai crescendo
    // o número". O rodapé é o herói: o número salta, o delta pisca, a barra estica.
    const recalc = () => {
      if (!prev) return;   // arsenal vazio: não há rodapé de poder
      let manda = 0; let traz = 0;
      for (const inp of modal.querySelectorAll('.ref-qtd')) {
        const u = inp.dataset.u;
        const aqui = g[u] || 0;
        const noQuartel = livre[u] || 0;
        // trava nos dois sentidos: não mando o que não tenho, não trago o que não está lá
        let v = Math.round(Number(inp.value) || 0);
        v = Math.max(-aqui, Math.min(v, noQuartel));
        inp.value = v;
        envio[u] = v;
        if (v > 0) manda += v; else traz += -v;
      }
      const simulada = { ...g };
      for (const [u, v] of Object.entries(envio)) simulada[u] = Math.max(0, (simulada[u] || 0) + v);
      const fcNova = forcaGuarnicao(simulada);
      const fcAtual = forcaGuarnicao(g);
      const delta = Math.round((fcNova - fcAtual) * 100) / 100;
      const nFc = modal.querySelector('#ref-fc');
      nFc.textContent = fcNova;
      nFc.classList.toggle('subiu', delta > 0); nFc.classList.toggle('caiu', delta < 0);
      const nCab = modal.querySelector('#ref-fc-cab'); if (nCab) nCab.textContent = fcNova;
      const nDelta = modal.querySelector('#ref-delta');
      if (nDelta) { nDelta.textContent = delta ? `${delta > 0 ? '+' : ''}${delta}` : ''; nDelta.className = `ref-poder-delta ${delta > 0 ? 'bom' : delta < 0 ? 'ruim' : ''}`; }
      const nFill = modal.querySelector('#ref-poder-fill');
      if (nFill) nFill.style.width = `${Math.min(100, fcNova * 10)}%`;
      const custo = custoMovimento(e, envio);
      const semGrana = custo.total > (e.tesouro || 0);
      const btn = modal.querySelector('#ref-ok');
      if (btn) {
        btn.classList.toggle('sem-grana', semGrana && custo.total > 0);
        btn.querySelector('span').textContent = custo.total > 0
          ? `MOVIMENTAR · custa ${custo.total} tri` : 'CONFIRMAR MOVIMENTAÇÃO';
      }
      prev.innerHTML = (manda || traz)
        ? `${manda ? `<b class="bom">▲ ${manda.toLocaleString('pt-BR')}</b> chegando` : ''}${manda && traz ? ' · ' : ''}${traz ? `<b class="ruim">▼ ${traz.toLocaleString('pt-BR')}</b> saindo` : ''}
          <div class="ref-custo ${semGrana ? 'ruim' : ''}">${ico('fuel', 11)} log ${custo.log} + comb ${custo.comb} + mob ${custo.base} = <b>${custo.total} tri</b>${semGrana ? ' · <b class="ruim">sem caixa</b>' : ''}</div>`
        : `<span class="ref-poder-dica">mexa nas linhas — o poder responde aqui</span>`;
    };

    modal.querySelectorAll('.ref-item').forEach((item) => {
      const inp = item.querySelector('.ref-qtd');
      const u = UNIDADES.find((x) => x.id === item.dataset.u);
      item.querySelectorAll('.ref-btn').forEach((b) => b.addEventListener('click', () => {
        inp.value = (Number(inp.value) || 0) + u.passo * Number(b.dataset.d);
        recalc();
      }));
      inp.addEventListener('input', recalc);
    });
    recalc();

    modal.querySelector('#ref-ok')?.addEventListener('click', () => {
      const mandar = {}; const trazer = {};
      for (const [u, v] of Object.entries(envio)) {
        if (v > 0) mandar[u] = v; else if (v < 0) trazer[u] = -v;
      }
      if (!Object.keys(mandar).length && !Object.keys(trazer).length) return;
      const custo = custoMovimento(e, envio);
      if (custo.total > (e.tesouro || 0)) { prev.innerHTML = `<b class="ruim">${ico('triangle-alert', 12)} Tesouro insuficiente: a operação custa ${custo.total} tri e você tem ${Math.round((e.tesouro || 0) * 100) / 100} tri.</b>`; return; }
      if (Object.keys(trazer).length) {
        const r = recolher(e, p.id, trazer);
        if (r.falha) { prev.innerHTML = `<b class="ruim">${esc(r.falha)}</b>`; return; }
      }
      if (Object.keys(mandar).length) {
        const r = reforcar(e, p.id, mandar);
        if (r.falha) { prev.innerHTML = `<b class="ruim">${esc(r.falha)}</b>`; return; }
      }
      // Paga a conta (tesouro).
      e.tesouro = Math.round(((e.tesouro || 0) - custo.total) * 100) / 100;

      // Se o estado estava em CONFLITO, o reforço EMPURRA a pressão pra baixo na hora —
      // o jogador vê o efeito agora, não só no fechamento do turno. Guarnição forte
      // (≥2.0) sufoca a revolta de vez.
      const conf2 = e.conflitosEstado?.[p.id];
      let statusMsg = 'Tropas a caminho — a coluna cruza o mapa até a posição.';
      if (conf2) {
        const fcAgora = forcaGuarnicao(guarnicao(e, p.id));
        if (fcAgora >= 2.0) { delete e.conflitosEstado[p.id]; statusMsg = `Revolta em ${esc(p.nome)} SUFOCADA. O território está firme.`; }
        else { conf2.intensidade = Math.max(0, (conf2.intensidade || 0) - 30); statusMsg = `Reforço chegou a ${esc(p.nome)}. A pressão inimiga recuou, mas a disputa continua.`; }
      }

      // o comboio cruza o mapa até o território
      globoCtrl?.desenharLinha?.({ lat: p.lat, lng: p.lng }, 'comercio', 4000);
      globoCtrl?.atualizar?.();
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `${statusMsg} Custo: ${custo.total} tri.`, cor: conf2 ? '#ffb020' : '#22e0a0' }]);
      mostrarStatusEnvio(statusMsg);
      setTimeout(sair, 1600);
    });

    // INSTALAR BASE no território conquistado (não precisa dominar o país inteiro).
    modal.querySelectorAll('.ref-base-op').forEach((b) => b.addEventListener('click', () => {
      const r = instalarBaseEstado(e, { estadoId: p.id, iso: p.pais, nome: p.nome, lat: p.lat, lng: p.lng, tipo: b.dataset.tipo });
      if (r.falha) { const prevEl = modal.querySelector('#ref-prev'); if (prevEl) prevEl.innerHTML = `<b class="ruim">${ico('triangle-alert', 12)} ${esc(r.falha)}</b>`; return; }
      globoCtrl?.desenharLinha?.({ lat: p.lat, lng: p.lng }, 'comercio', 3500);
      globoCtrl?.atualizar?.();
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `Base instalada em ${esc(p.nome)}: ${esc(r.base.nome)}. O território agora projeta poder na região.`, cor: '#22e0a0' }]);
      render();
    }));
  }

  // Base militar no estado — agora COLAPSADA num <details>: a tela é sobre mover tropa,
  // e a base é decisão rara (estava roubando um terço do painel). ANÁLISE que o dono
  // pediu: no seu território de ORIGEM a base vale pouco (você já opera de casa — o
  // bônus de proximidade é marginal); em território CONQUISTADO/fronteira é onde ela
  // brilha. Mantemos a opção nos dois, com a copy dizendo essa verdade.
  function secaoBase() {
    const jaTem = basesNoEstado(e, p.id).length > 0;
    if (jaTem) {
      const b = basesNoEstado(e, p.id)[0];
      return `<div class="ref-base tem"><div class="ref-base-tit">${ico('radio-tower', 12)} BASE INSTALADA</div>
        <div class="ref-base-ok">${ico('check', 13)} <b>${esc(b.nome)}</b> — este território projeta poder na região.</div></div>`;
    }
    const emCasa = classificar(e, p.id) !== 'conquistado';
    return `<details class="ref-base-det">
      <summary>${ico('radio-tower', 12)} <span>Instalar base militar aqui</span> <i>${ico('chevron-down', 13)}</i></summary>
      <div class="ref-base-nota">${emCasa
        ? 'No seu próprio território a base vale menos — você já opera de casa. Ela brilha em ESTADO DE FRONTEIRA (alcance extra) ou em território conquistado.'
        : 'Território conquistado: a base ancora sua presença — o ataque passa a partir DAQUI, com bônus de proximidade.'}</div>
      <div class="ref-base-tipos">
        ${Object.values(TIPOS_BASE).map((t) => `<button class="ref-base-op" data-tipo="${t.id}" ${(e.tesouro || 0) < t.custo ? 'disabled' : ''} data-tip="${esc(t.desc)}" data-tip-t="${esc(t.nome)}" data-tip-k="ALCANCE ${t.alcance} KM">
          ${ico(t.ic, 15)}<span>${esc(t.nome)}</span><i>US$ ${t.custo} tri</i></button>`).join('')}
      </div>
    </details>`;
  }

  // STATUS IMERSIVO — antes o confirmar fechava calado. Agora a movimentação vira uma
  // cena curta ("TROPAS A CAMINHO") antes de sair, com o comboio riscando o globo.
  function mostrarStatusEnvio(msg) {
    modal.querySelector('.ref-painel').innerHTML = `<div class="ref-enviado">
      <div class="ref-env-ic">${ico('send', 30)}</div>
      <h2>TROPAS A CAMINHO</h2>
      <p>${msg}</p>
      <div class="ref-env-linha"><i></i></div>
    </div>`;
  }
}
