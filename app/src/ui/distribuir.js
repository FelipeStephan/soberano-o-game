// ═══════════════════════════════════════════════════════════════════════
// PENTÁGONO — a mesa de guerra da distribuição de forças
// ═══════════════════════════════════════════════════════════════════════
// O que isto resolve: "distribuir tropas" era um modal de 3 botões que cuspia
// tudo nos estados e FECHAVA — o jogador ficava sem reserva, sem ver onde a tropa
// foi parar e sem caminho de trazer de volta ("não tem tropa em reserva"). Aqui é
// a sala de comando: a RESERVA viva no topo, os VETORES DE AMEAÇA (por onde o
// inimigo vem), as DOUTRINAS (incluindo o CONTRA-ATAQUE que concentra na ameaça),
// e a MESA — cada estado guarnecido, com força, composição e botões de reforçar/
// recolher na própria linha. Nada some da tela; tudo se ajusta ao vivo.
import { ico } from './icones.js';
import {
  distribuirAuto, tropaLivre, estadosDe, guarnicao, forcaGuarnicao,
  recolher, recolherTudo, meusConquistados, estadoPorId,
} from '../jogo/territorio.js';
import { UNIDADE_POR_ID, UNIDADES } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { FOTO_UNIDADE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { abrirReforco } from './reforco.js';
import { silhuetaDe } from './territorioSvg.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

const DOUTRINAS = [
  { id: 'counter', ic: 'crosshair', rot: 'CONTRA-ATAQUE', desc: 'Descobre por onde o inimigo vem — guerra, revolta ou frota no mar — e empilha tropa exatamente ali para segurar a linha.' },
  { id: 'fronteira', ic: 'shield', rot: 'DEFESA DE FRONTEIRA', desc: 'Concentra a tropa perto de quem você está em guerra. Sem ameaça, protege o coração do país.' },
  { id: 'uniforme', ic: 'grid-3x3', rot: 'COBERTURA UNIFORME', desc: 'Espalha igual por todos os estados. Ninguém fica descoberto, ninguém fica forte.' },
  { id: 'capital', ic: 'landmark', rot: 'MURALHA DA CAPITAL', desc: 'Empilha o grosso na capital e no núcleo. Aposta tudo em segurar o centro do poder.' },
];

// Direção cardinal de um alvo em relação ao meu centro (dá o "SUL", "NORDESTE").
function cardeal(dLat, dLng) {
  const ns = dLat > 3 ? 'N' : dLat < -3 ? 'S' : '';
  const lo = dLng > 3 ? 'L' : dLng < -3 ? 'O' : '';
  return (ns + lo) || '·';
}

export function abrirDistribuir(jogo, { onFim, globoCtrl } = {}) {
  if (document.querySelector('.pen-modal')) return;
  const estado = jogo.estado;
  const meuIso = estado.iso || 'USA';
  const ondeEsta = (iso) => globoCtrl?.ondeEsta?.(iso);
  let modo = 'counter';
  let aba = meuIso;                 // aba ativa: meu país ou um país conquistado
  let ordenar = 'ameaca';          // ameaca | forca | nome
  let confirmandoReset = false;    // 2 cliques pro "recolher tudo"

  const modal = document.createElement('div');
  modal.className = 'modal-fundo pen-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  // ── contadores de reserva / posicionado (vivos) ─────────────────────
  function reservaTotal() {
    const l = tropaLivre(estado);
    return Object.entries(l).reduce((t, [u, q]) => t + (u === 'ogivas' ? 0 : (q || 0)), 0);
  }
  function posicionadoTotal() {
    let t = 0;
    for (const [id, g] of Object.entries(estado.guarnicoes || {})) {
      if (id.startsWith('MAR_')) continue;
      if ((estadoPorId(id)?.pais || id.split('-')[0]) !== meuIso && estado.donoEstado?.[id] !== meuIso) continue;
      for (const [u, q] of Object.entries(g || {})) if (u !== 'ogivas') t += (q || 0);
    }
    return t;
  }

  // ── VETORES DE AMEAÇA — por onde a facada vem ───────────────────────
  function vetoresAmeaca() {
    const out = [];
    const meu = ondeEsta(meuIso);
    // 1) países em guerra
    for (const iso of (estado.emGuerra || [])) {
      const c = ondeEsta(iso); if (!c) { out.push({ tipo: 'guerra', nome: PAISES[iso]?.nome || iso, dir: '·', grau: 3 }); continue; }
      const dir = meu ? cardeal(c.lat - meu.lat, c.lng - meu.lng) : '·';
      out.push({ tipo: 'guerra', nome: PAISES[iso]?.nome || iso, dir, grau: 3 });
    }
    // 2) estados sob pressão (revolta/reconquista em curso)
    for (const [id, cf] of Object.entries(estado.conflitosEstado || {})) {
      const nome = estadoPorId(id)?.nome || id;
      out.push({ tipo: 'pressao', nome, intensidade: Math.round(cf.intensidade || 0), grau: 2 });
    }
    // 3) frotas hostis no mar, perto da costa
    const meusEstados = estadosDe(meuIso);
    for (const f of (estado.frotasInimigas || [])) {
      let dMin = Infinity;
      for (const e of meusEstados) { const d = Math.hypot(e.lat - f.lat, (e.lng - f.lng) * 0.7); if (d < dMin) dMin = d; }
      if (dMin <= 20) out.push({ tipo: 'frota', nome: PAISES[f.code]?.nome || f.code, d: dMin, grau: dMin <= 10 ? 3 : 1 });
    }
    return out.sort((a, b) => b.grau - a.grau).slice(0, 5);
  }

  // estados da aba ativa, com guarnição e ameaça, ordenados
  function estadosDaAba() {
    const base = aba === meuIso ? estadosDe(meuIso)
      : meusConquistados(estado).filter((e) => (e.pais === aba)).map((e) => estadoPorId(e.id) || e);
    const conf = estado.conflitosEstado || {};
    const lista = base.map((e) => {
      const g = guarnicao(estado, e.id);
      return { e, g, forca: forcaGuarnicao(g), ameaca: conf[e.id]?.intensidade || 0, tem: Object.keys(g).length > 0 };
    });
    lista.sort((a, b) => {
      if (ordenar === 'nome') return String(a.e.nome).localeCompare(String(b.e.nome));
      if (ordenar === 'forca') return b.forca - a.forca;
      // ameaca (default): ameaçados primeiro, depois força
      return (b.ameaca - a.ameaca) || (b.forca - a.forca);
    });
    // sem guarnição vai pro fim
    return lista.sort((a, b) => (a.tem === b.tem ? 0 : a.tem ? -1 : 1));
  }

  // resumo de composição de uma guarnição: as 3 maiores unidades, com ícone
  function resumoComp(g) {
    const its = Object.entries(g).filter(([, q]) => q > 0)
      .sort((a, b) => (UNIDADE_POR_ID[b[0]]?.poder || 0) * b[1] - (UNIDADE_POR_ID[a[0]]?.poder || 0) * a[1])
      .slice(0, 3);
    if (!its.length) return '<i class="pen-vazio">sem tropa</i>';
    return its.map(([u, q]) => `<span class="pen-u">${UNIDADE_POR_ID[u]?.icone || '•'} ${fmt(q)}</span>`).join('');
  }

  function render() {
    const nEstados = estadosDe(meuIso).length;
    const reserva = reservaTotal();
    const posic = posicionadoTotal();
    const somaBar = Math.max(1, reserva + posic);
    const ameacas = vetoresAmeaca();
    const conquistadosPaises = [...new Set(meusConquistados(estado).map((e) => e.pais))];

    if (nEstados === 0) {
      modal.innerHTML = `<div class="pen-painel"><div class="pen-cab">
        <div class="pen-ic">${ico('network', 20)}</div>
        <div class="pen-tit"><h2>ESTADO-MAIOR</h2><span>${esc(jogo.ficha.pais)}</span></div>
        <button class="pp-fechar pen-x">${ico('x', 16)}</button></div>
        <div class="pen-semmapa">${ico('info', 16)} Seu país não tem estados mapeados — a defesa aqui é no agregado.</div></div>`;
      modal.querySelector('.pen-x').addEventListener('click', fechar);
      return;
    }

    const lista = estadosDaAba();
    const equip = equipamentosDoPais(meuIso);

    modal.innerHTML = `<div class="pen-painel">
      <div class="pen-cab">
        <div class="pen-ic">${ico('network', 20)}</div>
        <div class="pen-tit"><h2>ESTADO-MAIOR · DISTRIBUIÇÃO DE FORÇAS</h2>
          <span>${esc(jogo.ficha.pais)} · ${nEstados} estados sob comando</span></div>
        <button class="pp-fechar pen-x">${ico('x', 16)}</button>
      </div>

      <div class="pen-posturas">
        <span class="pen-post-rot">${ico('gauge', 11)} POSTURA</span>
        <button class="pen-post normal ${posic === 0 ? 'on' : ''}" data-post="normal"
          data-tip="Tropas de volta ao quartel. País operando normal: custo mínimo, e TODA a força fica disponível para posições navais e ofensivas." data-tip-t="Postura Normal">
          ${ico('home', 13)} <b>NORMAL</b><small>tudo na reserva</small></button>
        <button class="pen-post defesa" data-post="defesa"
          data-tip="Contra-ataque: a tropa vai exatamente para onde a ameaça está — guerra, revolta, frota hostil na costa." data-tip-t="Postura de Defesa">
          ${ico('shield', 13)} <b>DEFESA</b><small>cobre as ameaças</small></button>
        <button class="pen-post ataque" data-post="ataque"
          data-tip="Preparação ofensiva: concentra na fronteira do inimigo, mas SEGURA metade na reserva para a invasão e as frotas." data-tip-t="Postura de Ataque">
          ${ico('swords', 13)} <b>ATAQUE</b><small>fronteira + reserva de assalto</small></button>
      </div>

      <div class="pen-reserva">
        <div class="pen-res-nums">
          <span class="pen-res-a">${ico('warehouse', 12)} RESERVA <b>${fmt(reserva)}</b></span>
          <span class="pen-res-b">${ico('map-pin', 12)} POSICIONADO <b>${fmt(posic)}</b></span>
        </div>
        <div class="pen-res-bar">
          <i class="res" style="width:${(reserva / somaBar) * 100}%"></i>
          <i class="pos" style="width:${(posic / somaBar) * 100}%"></i>
        </div>
      </div>

      <div class="pen-corpo">
        <div class="pen-col-esq">
          <div class="pen-sec">${ico('radar', 11)} VETORES DE AMEAÇA</div>
          <div class="pen-ameacas">
            ${ameacas.length ? ameacas.map((a) => {
              if (a.tipo === 'guerra') return `<div class="pen-am grau-${a.grau}">${ico('swords', 12)} <b>${esc(a.nome)}</b><em>GUERRA · ${a.dir}</em></div>`;
              if (a.tipo === 'pressao') return `<div class="pen-am grau-${a.grau}">${ico('flame', 12)} <b>${esc(a.nome)}</b><em>REVOLTA ${a.intensidade}%</em></div>`;
              return `<div class="pen-am grau-${a.grau}">${ico('ship', 12)} <b>${esc(a.nome)}</b><em>FROTA A ${a.d.toFixed(0)}°</em></div>`;
            }).join('') : `<div class="pen-am-vazio">${ico('shield-check', 13)} Nenhum vetor hostil identificado — o mundo observa em silêncio.</div>`}
          </div>

          <div class="pen-sec">${ico('layout-grid', 11)} DOUTRINA DE DISTRIBUIÇÃO</div>
          <div class="pen-doutrinas">
            ${DOUTRINAS.map((d) => `<button class="pen-dop ${modo === d.id ? 'on' : ''}" data-modo="${d.id}">
              <span class="pen-dop-ic">${ico(d.ic, 15)}</span>
              <span class="pen-dop-txt"><b>${d.rot}</b><small>${esc(d.desc)}</small></span>
              <i class="pen-dop-ck">${ico('check', 13)}</i>
            </button>`).join('')}
          </div>
          <button class="pen-aplicar" id="pen-go" ${reserva <= 0 ? 'disabled' : ''}>
            ${ico('send', 14)} <span>${reserva > 0 ? `APLICAR DOUTRINA · ${fmt(reserva)} em reserva` : 'RESERVA VAZIA'}</span>
          </button>
        </div>

        <div class="pen-col-dir">
          <div class="pen-mesa-top">
            <div class="pen-abas">
              <button class="pen-aba ${aba === meuIso ? 'on' : ''}" data-aba="${meuIso}">${esc(jogo.ficha.pais)}</button>
              ${conquistadosPaises.map((iso) => `<button class="pen-aba ${aba === iso ? 'on' : ''}" data-aba="${iso}">${ico('flag', 10)} ${esc(PAISES[iso]?.nome || iso)}</button>`).join('')}
            </div>
            <div class="pen-ord">
              <button class="${ordenar === 'ameaca' ? 'on' : ''}" data-ord="ameaca" data-tip="Ordenar por ameaça">${ico('radar', 12)}</button>
              <button class="${ordenar === 'forca' ? 'on' : ''}" data-ord="forca" data-tip="Ordenar por força">${ico('shield', 12)}</button>
              <button class="${ordenar === 'nome' ? 'on' : ''}" data-ord="nome" data-tip="Ordenar por nome">${ico('arrow-down-a-z', 12)}</button>
            </div>
          </div>
          <div class="pen-mesa">
            ${lista.map(({ e, g, forca, ameaca, tem }) => `<div class="pen-est ${tem ? '' : 'vazio'} ${ameaca > 0 ? 'ameacado' : ''}" data-id="${e.id}">
              <span class="pen-est-mapa">${silhuetaDe(globoCtrl?.geometriaDe?.(e.id), { id: e.id, tam: 30 }) || ''}</span>
              <div class="pen-est-info">
                <div class="pen-est-nome">${esc(e.nome)} ${ameaca > 0 ? `<span class="pen-badge">${ico('flame', 9)} ${Math.round(ameaca)}%</span>` : ''}</div>
                <div class="pen-est-comp">${resumoComp(g)}</div>
              </div>
              <div class="pen-est-forca"><b>${forca}</b><small>força</small></div>
              <div class="pen-est-acoes">
                <button class="pen-est-btn reforcar" data-id="${e.id}" data-tip="Ajustar tropa deste estado">${ico('sliders-horizontal', 13)}</button>
                ${tem ? `<button class="pen-est-btn recolher" data-id="${e.id}" data-tip="Recolher toda a guarnição para a reserva">${ico('undo-2', 13)}</button>` : ''}
              </div>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="pen-rodape">
        <button class="pen-reset ${confirmandoReset ? 'confirmar' : ''}" id="pen-reset">
          ${ico('undo-2', 13)} <span>${confirmandoReset ? 'CONFIRMAR RECOLHIMENTO GERAL?' : 'RECOLHER TUDO À RESERVA'}</span>
        </button>
        <div class="pen-rod-nota">${ico('info', 11)} Reforçar/recolher é grátis em tropa, custa cobertura. Clique num estado no mapa também abre este ajuste.</div>
      </div>
    </div>`;

    // ligações
    modal.querySelector('.pen-x').addEventListener('click', fechar);
    // POSTURAS — o comando de um clique: normal (quartel), defesa (counter), ataque
    // (fronteira com metade segurada pra ofensiva). O jogador VÊ a reserva subir/descer
    // na barra logo abaixo, no mesmo render.
    modal.querySelectorAll('.pen-post').forEach((b) => b.addEventListener('click', () => {
      const post = b.dataset.post;
      if (post === 'normal') {
        const r = recolherTudo(estado);
        estado.temp_guerra = Math.max(0, (estado.temp_guerra || 0) - 2);
        if (r.ok) jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', cor: '#22e0a0', texto: `Postura NORMAL: ${fmt(r.total)} unidades de volta ao quartel. Custo mínimo — e força total disponível para o mar e a ofensiva.` }]);
      } else {
        recolherTudo(estado);   // zera antes: a postura é um retrato, não uma soma
        const r = distribuirAuto(estado, {
          modo: post === 'defesa' ? 'counter' : 'fronteira',
          fracao: post === 'ataque' ? 0.5 : 1,
          ondeEsta, frotasInimigas: estado.frotasInimigas || [], conflitos: estado.conflitosEstado || {},
        });
        if (r.ok) jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', cor: post === 'ataque' ? '#ff3b5c' : '#35e0ff', texto: post === 'ataque'
          ? `Postura de ATAQUE: fronteira reforçada em ${r.estados} estado(s) — metade da força segue na reserva, pronta pra invasão.`
          : `Postura de DEFESA: contra-ataque armado em ${r.estados} estado(s), tropa em cima de cada vetor de ameaça.` }]);
      }
      globoCtrl?.atualizar?.();
      render();
    }));
    modal.querySelectorAll('.pen-dop').forEach((b) => b.addEventListener('click', () => { modo = b.dataset.modo; render(); }));
    modal.querySelectorAll('.pen-aba').forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; render(); }));
    modal.querySelectorAll('.pen-ord button').forEach((b) => b.addEventListener('click', () => { ordenar = b.dataset.ord; render(); }));
    modal.querySelector('#pen-go')?.addEventListener('click', aplicarDoutrina);

    modal.querySelectorAll('.pen-est-btn.reforcar').forEach((b) => b.addEventListener('click', (ev) => {
      ev.stopPropagation(); abrirAjuste(b.dataset.id);
    }));
    modal.querySelectorAll('.pen-est-btn.recolher').forEach((b) => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const g = { ...guarnicao(estado, b.dataset.id) };
      if (!Object.keys(g).length) return;
      recolher(estado, b.dataset.id, g);
      globoCtrl?.atualizar?.();
      render();
    }));
    // clicar na linha (fora dos botões) também abre o ajuste fino
    modal.querySelectorAll('.pen-est').forEach((row) => row.addEventListener('click', () => abrirAjuste(row.dataset.id)));

    // RECOLHER TUDO — 2 cliques (confirmação inline)
    const btnReset = modal.querySelector('#pen-reset');
    btnReset?.addEventListener('click', () => {
      if (!confirmandoReset) { confirmandoReset = true; render();
        setTimeout(() => { if (modal.isConnected && confirmandoReset) { confirmandoReset = false; const b = modal.querySelector('#pen-reset'); if (b) { b.classList.remove('confirmar'); b.querySelector('span').textContent = 'RECOLHER TUDO À RESERVA'; } } }, 3000);
        return;
      }
      confirmandoReset = false;
      const r = recolherTudo(estado);
      globoCtrl?.atualizar?.();
      render();
      if (r.ok) jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', cor: '#ffb020', texto: `Recolhimento geral: ${fmt(r.total)} unidades voltaram à reserva de ${r.estados} estado(s). O quartel está cheio de novo.` }]);
    });
  }

  // abre o ajuste fino por estado reusando o painel de reforço (não reimplementa)
  function abrirAjuste(id) {
    const meta = estadoPorId(id);
    if (!meta) return;
    const feature = { properties: { id: meta.id, nome: meta.nome, tipo: meta.tipo, pais: meta.pais, lat: meta.lat, lng: meta.lng } };
    abrirReforco(feature, jogo, { globoCtrl, onFim: () => render() });
  }

  function aplicarDoutrina() {
    const r = distribuirAuto(estado, {
      modo, ondeEsta,
      frotasInimigas: estado.frotasInimigas || [],
      conflitos: estado.conflitosEstado || {},
    });
    if (!r.ok) {
      const go = modal.querySelector('#pen-go span');
      if (go) go.textContent = r.motivo || 'Não deu para distribuir.';
      return;
    }
    globoCtrl?.atualizar?.();
    const resumo = Object.entries(r.movido).map(([u, q]) => `${fmt(q)} ${UNIDADE_POR_ID[u]?.nome || u}`).join(' · ');
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', cor: '#22e0a0', texto: `${DOUTRINAS.find((d) => d.id === r.modo)?.rot}: reforço espalhado por ${r.estados} estado(s). ${resumo}` }]);
    render();   // re-renderiza mostrando o novo estado da mesa (não fecha!)
  }

  render();
}
