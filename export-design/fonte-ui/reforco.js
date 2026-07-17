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
import { UNIDADES, DOMINIOS } from '../dados/forcas.js';
import { EQUIPAMENTOS } from '../dados/equipamentos.js';
import { FOTO_UNIDADE, bandeira, ISO2_DE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { ico, ICO } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
    const equip = EQUIPAMENTOS[e.iso || 'USA'] || EQUIPAMENTOS.USA;
    const cls = classificar(e, p.id);

    // Só mostramos o que existe: unidade sem nenhuma no país inteiro é ruído.
    const uteis = UNIDADES.filter((u) => (livre[u.id] || 0) > 0 || (g[u.id] || 0) > 0);

    modal.innerHTML = `<div class="ref-painel">
      <div class="ref-cab">
        <span class="ref-simbolo">${ico('shield', 22)}</span>
        <div class="ref-tit"><h2>${esc(p.nome)}</h2>
          <div class="ref-sub">${esc(p.tipo)} · ${cls === 'conquistado' ? 'conquistado por você' : 'seu território'}</div></div>
        <span class="ref-forca">força <b id="ref-fc">${forcaGuarnicao(g)}</b></span>
        <button class="pp-fechar" id="ref-x">${ico('x', 16)}</button>
      </div>

      <div class="ref-legenda">
        <span>${ico('warehouse', 12)} <b>Quartel central</b>: tropa sem posição definida</span>
        <span>${ico('map-pin', 12)} <b>Aqui</b>: tropa defendendo ${esc(p.nome)}</span>
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
                  <button class="ref-btn" data-d="-1" title="trazer de volta ao quartel">−</button>
                  <input class="ref-qtd" data-u="${u.id}" type="number" value="0" step="${u.passo}">
                  <button class="ref-btn" data-d="1" title="enviar para cá">+</button>
                </div>
              </div>`;
            }).join('')}
          </div>`;
        }).join('')}
      </div>` : `<div class="ref-alheio">${ico('info', 15)} <span>Seu arsenal está vazio. Compre unidades no mercado antes de posicionar tropa.</span></div>`}

      <div class="ref-prev" id="ref-prev"></div>
      ${uteis.length ? `<button class="ref-confirmar" id="ref-ok">${ico('send', 15)} <span>CONFIRMAR MOVIMENTAÇÃO</span></button>` : ''}
    </div>`;

    modal.querySelector('#ref-x').addEventListener('click', sair);

    const prev = modal.querySelector('#ref-prev');
    const recalc = () => {
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
      modal.querySelector('#ref-fc').textContent = fcNova;
      const delta = Math.round((fcNova - fcAtual) * 100) / 100;
      prev.innerHTML = (manda || traz)
        ? `${ico('trending-up', 12)} ${manda ? `<b class="bom">${manda.toLocaleString('pt-BR')}</b> chegando` : ''}${manda && traz ? ' · ' : ''}${traz ? `<b class="ruim">${traz.toLocaleString('pt-BR')}</b> saindo` : ''} — força ${fcAtual} → <b>${fcNova}</b> ${delta ? `<span class="${delta > 0 ? 'bom' : 'ruim'}">(${delta > 0 ? '+' : ''}${delta})</span>` : ''}`
        : `${ico('info', 12)} Use + para mandar tropa do quartel pra cá, − para trazer de volta.`;
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
      if (Object.keys(trazer).length) {
        const r = recolher(e, p.id, trazer);
        if (r.falha) { prev.innerHTML = `<b class="ruim">${esc(r.falha)}</b>`; return; }
      }
      if (Object.keys(mandar).length) {
        const r = reforcar(e, p.id, mandar);
        if (r.falha) { prev.innerHTML = `<b class="ruim">${esc(r.falha)}</b>`; return; }
      }
      // o comboio cruza o mapa até o território
      globoCtrl?.desenharLinha?.({ lat: p.lat, lng: p.lng }, 'comercio', 4000);
      globoCtrl?.atualizar?.();
      sair();
    });
  }
}
