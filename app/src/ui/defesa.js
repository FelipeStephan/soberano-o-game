// ═══════════════════════════════════════════════════════════════════════
// MODO DEFESA — o clímax de levar um ataque de outro humano
// ═══════════════════════════════════════════════════════════════════════
// Modelo em docs/ONLINE.md. Quando um humano declara/faz guerra contra você, esta
// tela abre: você distribui tropas pelos seus estados antes do golpe cair. A tese do
// dono: a INTELIGÊNCIA é o herói silencioso — quanto mais você investiu nela, mais
// nítido o recon ("os EUA massaram forças apontadas para o Rio") e mais cedo o aviso.
// Pouca inteligência = "algo se move no sul, não sei o quê". O pavor do escuro.
//
// ── O QUE MUDOU (#3.1 / #3.2) ─────────────────────────────────────────
// 1. ERA UMA LISTA. Sob ataque, ninguém lê uma lista de 27 linhas: procura no MAPA
//    onde está pegando fogo. Agora é o seu país achatado, os estados ameaçados
//    PULSANDO, e o clique é a ordem — a mesma projeção do eixo de avanço
//    (ui/projecao.js), pra o mapa da defesa e o do ataque falarem a mesma língua.
// 2. O "ALVO PROVÁVEL" ERA MENTIRA. A tela lia só `dados.alvoEstado`; o evento de
//    guerra mandava `null` e o de ataque mandava `estadoId` — então o crosshair caía
//    SEMPRE no primeiro estado da lista, e o jogador reforçava o lugar errado com a
//    convicção de quem viu inteligência. Agora: lê todas as chaves que os eventos
//    realmente mandam e, quando não vem nada, DEDUZ pela mesma `ordemDeQueda` que o
//    motor usa pra derrubar território — palpite honesto, marcado como palpite.
// 3. FROTA É OUTRA GUERRA. Ataque naval não vem por fronteira: vem do mar, sem modal
//    de declaração. O recon fala de esquadra, a ameaça acende no LITORAL mais perto
//    da frota, e a ação rápida vira "cobrir a costa".
import { ico } from './icones.js';
import {
  estadosDe, guarnicao, forcaGuarnicao, tropaLivre, reforcar, donoDe,
} from '../jogo/territorio.js';
import { ordemDeQueda } from '../jogo/campanha.js';
import { UNIDADE_POR_ID } from '../dados/forcas.js';
import { PAISES } from '../dados/paises.js';
import { projetar, geoParaPath, centroProjetado, carregarMalha } from './projecao.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

// ── DE ONDE VEM O GOLPE ────────────────────────────────────────────────
// Os eventos da sala não falam a mesma língua: `guerra` manda `prioridades` (os
// estados que o atacante escolheu no eixo de avanço), `ataque_estado` manda
// `estadoId`, e um ataque sem eixo definido não manda nada. Esta função é o tradutor
// único — e, no silêncio, deduz pelo motor em vez de chutar o primeiro da lista.
function alvosProvaveis(estado, meuIso, dados) {
  const meus = estadosDe(meuIso).filter((e) => donoDe(estado, e.id) === meuIso);
  if (!meus.length) return { ids: [], deduzido: false };
  const validos = (lista) => (lista || []).filter((id) => meus.some((e) => e.id === id));

  // 1. o atacante DECLAROU o eixo — é a informação mais dura que existe
  const declarados = validos([
    ...(Array.isArray(dados?.prioridades) ? dados.prioridades : []),
    dados?.alvoEstado, dados?.estadoId,
  ].filter(Boolean));
  if (declarados.length) return { ids: [...new Set(declarados)], deduzido: false };

  // 2. sem declaração: a MESMA ordem de queda que o motor vai aplicar, partindo de
  //    onde o inimigo está (ou da frota, no ataque naval). Palpite, mas o palpite certo.
  const origem = dados?.de && Number.isFinite(dados.de.lat) ? dados.de : null;
  try {
    const ordem = ordemDeQueda(estado, meuIso, origem, null)
      .filter((e) => donoDe(estado, e.id) === meuIso);
    return { ids: ordem.slice(0, 3).map((e) => e.id), deduzido: true };
  } catch { return { ids: [], deduzido: true }; }
}

// O RECON: o que a sua inteligência consegue LER da movimentação inimiga — e quanto
// dela ela tem direito de te mostrar. Intel baixa não ganha o mapa de presente.
function lerRecon(estado, agressorIso, dados, alvos, naval) {
  const intel = estado.inteligencia ?? 0;
  const nomeAlvo = (id) => estadosDe(estado.iso || 'USA').find((e) => e.id === id)?.nome || id;
  const vetor = naval ? 'a esquadra' : 'o grosso das forças';

  if (intel >= 70 && alvos.ids.length) {
    const foco = alvos.ids.slice(0, 2);
    return {
      nivel: 'nítido', cor: '#22e0a0', mostrar: foco, precisao: 'exato',
      txt: `A sua inteligência é de primeira. Interceptamos os planos: <b>${esc(nomeDe(agressorIso))}</b> concentrou ${vetor} sobre <b>${foco.map((id) => esc(nomeAlvo(id))).join('</b> e <b>')}</b>${alvos.deduzido ? ' — leitura do Estado-Maior, não confissão do inimigo' : ''}. Reforce lá: é por ali que vem o golpe.`,
    };
  }
  if (intel >= 40 && alvos.ids.length) {
    return {
      nivel: 'parcial', cor: '#ffb020', mostrar: alvos.ids.slice(0, 3), precisao: 'setor',
      txt: `Os satélites captaram movimentação: <b>${esc(nomeDe(agressorIso))}</b> mira o setor de <b>${esc(nomeAlvo(alvos.ids[0]))}</b> e adjacências — mas pode ser finta. Reforce o setor sem descuidar do resto.`,
    };
  }
  return {
    nivel: 'cego', cor: '#ff3b5c', mostrar: [], precisao: 'nenhuma',
    txt: `Sua inteligência está fraca demais para ler o inimigo. Sabemos que <b>${esc(nomeDe(agressorIso))}</b> vem${naval ? ' pelo mar' : ''}, não sabemos por onde. Espalhe a defesa e reze. <i>(Invista em Inteligência e da próxima vez você enxerga o golpe antes.)</i>`,
  };
}

export function abrirDefesa(jogo, { agressor, dados, onFim, via } = {}) {
  if (document.querySelector('.defesa-modal')) return;   // um de cada vez
  const estado = jogo.estado;
  const meuIso = estado.iso || 'USA';
  const naval = via === 'naval' || dados?.via === 'naval';
  const alvos = alvosProvaveis(estado, meuIso, dados);
  const recon = lerRecon(estado, agressor?.iso, dados, alvos, naval);
  const ameacados = new Set(recon.mostrar);

  let fracao = 0.34;        // o "tamanho da força" da barra — fatia da reserva por ordem
  let selecionado = null;   // estado clicado no mapa
  let feats = [];
  let proj = null;
  let ultimaOrdem = null;   // texto do último reforço, pra a tela confirmar o que fez

  const modal = document.createElement('div');
  modal.className = 'modal-fundo defesa-modal';
  document.body.appendChild(modal);

  function forcaLivreTotal() {
    const livre = tropaLivre(estado);
    return Object.entries(livre).reduce((t, [id, q]) => t + (q || 0) * (UNIDADE_POR_ID[id]?.poder || 0), 0);
  }
  function unidadesLivres() {
    const livre = tropaLivre(estado);
    return Object.entries(livre).reduce((t, [id, q]) => t + (id === 'ogivas' ? 0 : (q || 0)), 0);
  }

  // Um "pacote" de reforço tira uma fatia proporcional das tropas livres e joga num
  // estado. Simples de operar sob pressão — é defesa, não planilha.
  function pacoteReforco(f) {
    const livre = tropaLivre(estado);
    const envio = {};
    for (const [id, q] of Object.entries(livre)) {
      if (id === 'ogivas') continue;
      const n = Math.floor((q || 0) * f);
      if (n > 0) envio[id] = n;
    }
    return envio;
  }

  function meusEstados() {
    return estadosDe(meuIso).filter((e) => donoDe(estado, e.id) === meuIso);
  }

  // ── AS ORDENS ────────────────────────────────────────────────────────
  function reforcarEstado(id) {
    const pacote = pacoteReforco(fracao);
    const total = Object.values(pacote).reduce((a, b) => a + b, 0);
    if (!total) { ultimaOrdem = { erro: true, txt: 'A reserva acabou — não há tropa sem posição para mandar.' }; render(); return; }
    const r = reforcar(estado, id, pacote);
    if (r.falha) { ultimaOrdem = { erro: true, txt: r.falha }; render(); return; }
    const nome = meusEstados().find((e) => e.id === id)?.nome || id;
    ultimaOrdem = { txt: `${fmt(total)} unidades entraram em ${nome}. Guarnição agora vale força ${r.forca}.` };
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', cor: '#35e0ff',
      texto: `DEFESA: ${fmt(total)} unidades reposicionadas para ${nome}. A linha está sendo montada.` }]);
    render();
  }

  // REFORÇAR TODAS AS REGIÕES — a fatia é dividida entre os estados, com peso duplo
  // nos ameaçados. Cobertura ampla sem abandonar o setor que está queimando.
  function reforcarTodas() {
    const alvosLista = meusEstados();
    if (!alvosLista.length) return;
    const pacote = pacoteReforco(fracao);
    const totalPacote = Object.values(pacote).reduce((a, b) => a + b, 0);
    if (!totalPacote) { ultimaOrdem = { erro: true, txt: 'A reserva acabou — não há tropa sem posição para mandar.' }; render(); return; }
    const pesos = alvosLista.map((e) => ({ e, w: ameacados.has(e.id) ? 2.4 : 1 }));
    const soma = pesos.reduce((a, x) => a + x.w, 0) || 1;
    let movido = 0;
    for (const { e, w } of pesos) {
      const envio = {};
      for (const [u, q] of Object.entries(pacote)) {
        const n = Math.floor(q * (w / soma));
        if (n > 0) { envio[u] = n; movido += n; }
      }
      if (Object.keys(envio).length) reforcar(estado, e.id, envio);
    }
    ultimaOrdem = { txt: `${fmt(movido)} unidades espalhadas por ${alvosLista.length} regiões — dose dupla onde a inteligência aponta.` };
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', cor: '#35e0ff',
      texto: `DEFESA GERAL: ${fmt(movido)} unidades cobriram ${alvosLista.length} regiões do país.` }]);
    render();
  }

  // COBRIR O LITORAL (#3.2) — resposta específica ao ataque naval: a tropa vai para os
  // estados mais próximos da esquadra, não para a fronteira terrestre.
  function cobrirLitoral() {
    const frota = dados?.de;
    const lista = meusEstados();
    if (!lista.length) return;
    const ordenados = frota && Number.isFinite(frota.lat)
      ? [...lista].sort((a, b) => Math.hypot(a.lat - frota.lat, (a.lng - frota.lng) * 0.7) - Math.hypot(b.lat - frota.lat, (b.lng - frota.lng) * 0.7))
      : lista;
    const costa = ordenados.slice(0, Math.max(1, Math.ceil(lista.length * 0.3)));
    const pacote = pacoteReforco(fracao);
    let movido = 0;
    for (const e of costa) {
      const envio = {};
      for (const [u, q] of Object.entries(pacote)) {
        const n = Math.floor(q / costa.length);
        if (n > 0) { envio[u] = n; movido += n; }
      }
      if (Object.keys(envio).length) reforcar(estado, e.id, envio);
    }
    ultimaOrdem = movido
      ? { txt: `${fmt(movido)} unidades para o litoral: ${costa.map((e) => e.nome).slice(0, 3).join(', ')}${costa.length > 3 ? '…' : ''}. Desembarque encontra praia defendida.` }
      : { erro: true, txt: 'A reserva acabou — não há tropa sem posição para mandar.' };
    render();
  }

  // ── O MAPA ───────────────────────────────────────────────────────────
  function svgMapa() {
    if (!feats.length || !proj) return '';
    const lista = meusEstados();
    const forcas = new Map(lista.map((e) => [e.id, forcaGuarnicao(guarnicao(estado, e.id))]));
    const maxF = Math.max(1, ...forcas.values());
    const conf = estado.conflitosEstado || {};
    return `<svg class="def-svg" viewBox="0 0 ${proj.W} ${proj.H.toFixed(0)}" preserveAspectRatio="xMidYMid meet">
      ${feats.map((f) => {
        const id = f.properties?.id;
        const meu = donoDe(estado, id) === meuIso;
        const fc = forcas.get(id) || 0;
        // opacidade = quanto de guarnição há ali. O mapa vira um mapa de calor da
        // sua própria defesa: os buracos aparecem sozinhos.
        const carga = Math.min(1, fc / maxF);
        const cls = [
          'def-e',
          meu ? '' : 'perdido',
          ameacados.has(id) ? (recon.precisao === 'exato' ? 'alvo' : 'setor') : '',
          conf[id] ? 'conflito' : '',
          selecionado === id ? 'sel' : '',
        ].filter(Boolean).join(' ');
        return `<path class="${cls}" data-id="${id}" style="--carga:${carga.toFixed(2)}" d="${geoParaPath(f.geometry, proj.toXY)}"><title>${esc(f.properties?.nome || id)} · guarnição ${fc}</title></path>`;
      }).join('')}
      ${feats.filter((f) => ameacados.has(f.properties?.id)).map((f) => {
        const c = centroProjetado(f.geometry, proj.toXY);
        if (!c) return '';
        return `<g class="def-pulso ${recon.precisao === 'exato' ? 'exato' : 'setor'}" transform="translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})">
          <circle r="6"></circle><circle class="onda" r="6"></circle><circle class="onda o2" r="6"></circle>
        </g>`;
      }).join('')}
    </svg>`;
  }

  function ligarMapa() {
    modal.querySelectorAll('.def-e').forEach((p) => {
      p.addEventListener('click', () => {
        if (p.classList.contains('perdido')) return;
        selecionado = selecionado === p.dataset.id ? null : p.dataset.id;
        render();
      });
    });
  }

  function render() {
    const lista = meusEstados();
    const livreTot = forcaLivreTotal();
    const livreUn = unidadesLivres();
    const semTerritorio = lista.length === 0;
    const sel = selecionado ? lista.find((e) => e.id === selecionado) : null;
    const gSel = sel ? guarnicao(estado, sel.id) : null;
    const enviaAgora = Math.floor(livreUn * fracao);

    modal.innerHTML = `<div class="defesa-painel v2">
      <div class="def-cab">
        <div class="def-selo">${ico(naval ? 'ship' : 'shield-alert', 22)}</div>
        <div class="def-tit"><h2>MODO DEFESA</h2>
          <span><b>${esc(agressor?.nome || 'Um inimigo')}</b> ${naval ? 'atacou pelo mar — não houve declaração, houve esquadra' : 'declarou guerra'}. Posicione suas tropas antes do impacto.</span></div>
        <button class="pp-fechar def-fechar">${ico('x', 16)}</button>
      </div>

      <div class="def-recon" style="--rc:${recon.cor}">
        <div class="dr-cab">${ico('radar', 14)} RECONHECIMENTO · INTELIGÊNCIA ${estado.inteligencia ?? 0}/100 · leitura ${recon.nivel}</div>
        <p>${recon.txt}</p>
      </div>

      ${semTerritorio ? `<div class="def-vazio">${ico('info', 16)} Seu país não tem estados mapeados — a defesa aqui é no agregado. Feche e responda pela sua força total.</div>` : `
      <div class="def-corpo">
        <div class="def-mapa">
          ${feats.length ? svgMapa() : `<div class="def-carregando">${ico('loader', 18)} desenhando o mapa do país…</div>`}
          <div class="def-legenda">
            <span><i class="dl alvo"></i> ${recon.precisao === 'exato' ? 'alvo confirmado' : recon.precisao === 'setor' ? 'setor provável' : 'sem leitura'}</span>
            <span><i class="dl carga"></i> guarnição</span>
            <span><i class="dl conflito"></i> em conflito</span>
          </div>
        </div>

        <div class="def-lado">
          <div class="def-livre">
            <div class="dfl-topo">${ico('warehouse', 13)} RESERVA SEM POSIÇÃO
              <b>${fmt(livreUn)} un.</b><i>força ${fmt(livreTot)}</i></div>
            <div class="def-forca-barra">
              <label>TAMANHO DA FORÇA <b id="def-frac-v">${Math.round(fracao * 100)}%</b>
                <span class="dfb-un">${fmt(enviaAgora)} unidades por ordem</span></label>
              <input type="range" id="def-frac" min="5" max="100" step="5" value="${Math.round(fracao * 100)}" ${livreUn <= 0 ? 'disabled' : ''}>
            </div>
            <div class="def-quick">
              <button class="dq todas" id="def-todas" ${livreUn <= 0 ? 'disabled' : ''}>${ico('shield', 13)} REFORÇAR TODAS AS REGIÕES</button>
              ${naval ? `<button class="dq costa" id="def-costa" ${livreUn <= 0 ? 'disabled' : ''}>${ico('anchor', 13)} COBRIR O LITORAL</button>` : ''}
            </div>
          </div>

          ${sel ? `<div class="def-sel">
            <div class="dfs-cab">${ico('map-pin', 13)} <b>${esc(sel.nome)}</b>
              ${ameacados.has(sel.id) ? `<span class="de-alvo">${ico('crosshair', 10)} ${recon.precisao === 'exato' ? 'ALVO' : 'SETOR'}</span>` : ''}</div>
            <div class="dfs-forca">guarnição <b>${forcaGuarnicao(gSel)}</b></div>
            <div class="dfs-comp">${Object.entries(gSel || {}).filter(([, q]) => q > 0)
              .sort((a, b) => b[1] - a[1]).slice(0, 4)
              .map(([u, q]) => `<span>${UNIDADE_POR_ID[u]?.icone || '•'} ${fmt(q)}</span>`).join('') || '<i>sem tropa posicionada aqui</i>'}</div>
            <button class="dfs-go" id="def-go" ${livreUn <= 0 ? 'disabled' : ''}>${ico('plus', 13)} MANDAR ${fmt(enviaAgora)} PARA ${esc(sel.nome.toUpperCase())}</button>
          </div>` : `<div class="def-dica">${ico('info', 12)} Clique numa região do mapa para mandar tropa exatamente ali — ou use a ação rápida acima.</div>`}

          ${ultimaOrdem ? `<div class="def-ordem ${ultimaOrdem.erro ? 'erro' : ''}">${ico(ultimaOrdem.erro ? 'triangle-alert' : 'check', 12)} ${esc(ultimaOrdem.txt)}</div>` : ''}
        </div>
      </div>`}

      <div class="def-rodape">
        <div class="def-nota">${ico('info', 12)} Onde a guarnição for maior que a força que o inimigo mandar, o território segura.</div>
        <button class="def-pronto">${ico('shield-check', 15)} DEFESA POSICIONADA</button>
      </div>
    </div>`;

    modal.querySelector('.def-fechar').addEventListener('click', fechar);
    modal.querySelector('.def-pronto').addEventListener('click', fechar);
    const sl = modal.querySelector('#def-frac');
    if (sl) sl.addEventListener('input', (ev) => {
      fracao = Math.max(0.05, Number(ev.target.value) / 100);
      // atualização barata: só os números, sem re-render (o slider não pode perder o foco)
      const v = modal.querySelector('#def-frac-v'); if (v) v.textContent = `${Math.round(fracao * 100)}%`;
      const un = modal.querySelector('.dfb-un'); if (un) un.textContent = `${fmt(Math.floor(unidadesLivres() * fracao))} unidades por ordem`;
      const go = modal.querySelector('#def-go'); if (go) go.innerHTML = `${ico('plus', 13)} MANDAR ${fmt(Math.floor(unidadesLivres() * fracao))} PARA ${esc((sel?.nome || '').toUpperCase())}`;
    });
    modal.querySelector('#def-todas')?.addEventListener('click', reforcarTodas);
    modal.querySelector('#def-costa')?.addEventListener('click', cobrirLitoral);
    modal.querySelector('#def-go')?.addEventListener('click', () => reforcarEstado(selecionado));
    ligarMapa();
  }

  function fechar() { modal.remove(); onFim?.(); }
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
  render();

  // A malha chega depois (fetch): quando chegar, o mapa entra no lugar do "carregando".
  carregarMalha(meuIso).then((f) => {
    if (!modal.isConnected || !f.length) return;
    feats = f;
    proj = projetar(feats, 560, 12);
    render();
  });
}
