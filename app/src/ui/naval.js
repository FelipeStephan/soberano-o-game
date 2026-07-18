// ═══════════════════════════════════════════════════════════════════════
// POSIÇÃO NAVAL — a força que não atira e muda tudo
// ═══════════════════════════════════════════════════════════════════════
// Clicar no oceano com o Teatro armado posiciona a frota ali. E isto NÃO é um
// ataque — é o contrário: é a coisa que os países fazem justamente para não
// precisar atacar. Um grupo de porta-aviões parado no Golfo não dispara um tiro
// e reescreve a agenda de três chancelarias.
//
// Por isso a mecânica é deliberadamente diferente do envio a um estado:
//   • Não declara guerra. Ninguém invadiu nada — o mar é de todos.
//   • DERRUBA a relação de quem está por perto, proporcional à distância. Frota
//     na porta de casa é ameaça, mesmo sem ordem de fogo.
//   • Sobe o clima de guerra e a SUA segurança. É dissuasão: custa amizade e
//     compra respeito.
//   • Fica no mapa. A frota posicionada vira ponto de partida de ofensiva — é o
//     que transforma "eu tenho navios" em "eu tenho navios ALI".
import { UNIDADES } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { FOTO_UNIDADE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { tropaLivre, ondeComprometidas, recolher } from '../jogo/territorio.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { portoDe } from '../dados/portosNavais.js';
import { iniciarTransito, duracaoTransito, distGraus, recolherFrota } from '../jogo/frotas.js';
import { capacidadePorCarrier, carrierSoAsaRotativa } from '../dados/catalogoMilitar.js';
import { dinheiro } from '../jogo/formato.js';
import { dispararBreaking } from './breaking.js';
import { abrirDistribuir } from './distribuir.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const round2 = (n) => Math.round(n * 100) / 100;

// Só o que flutua por conta própria. O resto EMBARCA em quem flutua.
const NAVAIS = ['navios', 'submarinos', 'porta_avioes'];
// Aeronaves EMBARCADAS: precisam de PORTA-AVIÕES na força. Helicóptero entrou na lista
// (pedido do dono): é ASA ROTATIVA — decola até de carrier sem catapulta (Anadolu, PHM).
const AEREOS_EMBARCADOS = ['cacas', 'drones', 'bombardeiros', 'helicopteros'];
// Asa rotativa/VANT não precisa de catapulta — voa de qualquer convés.
const SEM_CATAPULTA_OK = new Set(['drones', 'helicopteros']);
// FUZILEIROS EMBARCADOS: soldados vão junto (força de desembarque + presença). O teto é
// o TRANSPORTE da esquadra: cada navio leva ~150 homens; cada carrier, ~1.600.
const FUZILEIROS_POR_NAVIO = 150;
const FUZILEIROS_POR_CARRIER = 1600;
// CAPACIDADE do porta-aviões: agora vem do CATÁLOGO MILITAR (dados/catalogoMilitar.js),
// por CLASSE — um Gerald R. Ford embarca ~75 aeronaves; um Cavour, ~20; o TCG Anadolu
// nem opera caça (convés só de drone). Nada de "70 fixo" pra todo mundo.

// ── ZONAS DE PROXIMIDADE ───────────────────────────────────────────────
// O mar perto da costa é território sentido como próprio. Quanto mais perto do país,
// mais a frota vira provocação — até virar, de fato, um ato hostil. As faixas (em
// graus de distância no globo) dão o vocabulário: "no quintal" ≠ "águas internacionais".
function zonaDe(d) {
  if (d <= 6) return { id: 'territorial', rot: 'ÁGUAS TERRITORIAIS', peso: 1, provoca: true };
  if (d <= 12) return { id: 'quintal', rot: 'NO QUINTAL', peso: 0.7, provoca: false };
  if (d <= 20) return { id: 'zee', rot: 'ZONA ECONÔMICA', peso: 0.4, provoca: false };
  return { id: 'aberto', rot: 'ÁGUAS INTERNACIONAIS', peso: 0.15, provoca: false };
}

// Quem sente a sua frota: todo país num raio de ~28° do ponto, classificado por zona.
// A reação depende TAMBÉM da relação: aliado tolera no quintal; hostil já vê ameaça
// de longe. Território dele + relação ruim = quase um ato de guerra.
function quemSente(estado, coord, globoCtrl) {
  const perto = [];
  for (const [code, info] of Object.entries(PAISES)) {
    if (code === (estado.iso || 'USA')) continue;
    const c = globoCtrl?.ondeEsta?.(code);
    if (!c) continue;
    const d = Math.hypot(c.lat - coord.lat, (c.lng - coord.lng) * 0.7);
    if (d > 28) continue;
    const zona = zonaDe(d);
    const rel = Number(estado[info.rel] ?? 0);
    // postura: aliado (rel alto) num quintal = tenso mas ok; hostil no quintal = ataque
    const hostil = rel <= -20;
    const parceiro = rel >= 30;
    const ataque = zona.provoca && !parceiro;     // águas territoriais de um não-parceiro = ofensiva
    perto.push({ code, nome: info.nome, relKey: info.rel, rel, d, zona, hostil, parceiro, ataque });
  }
  return perto.sort((a, b) => a.d - b.d).slice(0, 5);
}

export function abrirPosicaoNaval(coord, jogo, { onFim, globoCtrl } = {}) {
  // BUG QUE ISTO CONSERTA: clicar em outro ponto do mar abria um SEGUNDO cartão de
  // posição naval sem fechar o primeiro — empilhava. Um por vez: mata o anterior.
  document.querySelectorAll('.nvp-anc').forEach((m) => m.remove());
  const e = jogo.estado;
  const livre = tropaLivre(e);
  // A física do SEU porta-aviões, vinda do catálogo: quantas aeronaves cabem por
  // casco e se o convés lança asa fixa (caça/bombardeiro) ou só drone.
  const iso = e.iso || 'USA';
  const capPorCarrier = capacidadePorCarrier(iso);
  const conveSoDrone = carrierSoAsaRotativa(iso);
  // Distância porto→ponto em graus: alimenta o CUSTO OPERACIONAL (frota longe queima
  // mais óleo) e o ETA da travessia. Calculado uma vez, reusado no resumo e no confirmar.
  const porto = portoDe(iso);
  const dgPorto = porto ? distGraus(porto, coord) : 0;

  // CUSTO OPERACIONAL (US$ tri): combustível + logística de zarpar e sustentar a frota.
  // É SENTIDO — sai do tesouro na hora — mas é uma fração do que uma guerra drena:
  // posicionar dissuade barato; lutar é que sangra o caixa. Escala com a PRESENÇA (o
  // porta-aviões pesa) e com a TRAVESSIA (mandar a esquadra pro outro lado do mundo dobra o óleo).
  const custoOperacional = (pres) => round2(pres * 0.0032 * (1 + Math.min(1, dgPorto / 110)));
  // Textos do tooltip num lugar só — o recalc() liga/desliga conforme o estado real.
  const TIP_SEM_CARRIER = { t: 'AERONAVE SEM CONVÉS', txt: 'Aeronaves precisam de um PORTA-AVIÕES na mesma frota para decolar em mar aberto. Adicione um porta-aviões acima e esta unidade acende.' };
  const TIP_SEM_CATAPULTA = { t: 'CONVÉS SEM CATAPULTA', txt: 'O seu porta-aviões só opera drones e asa rotativa — não tem catapulta nem ski-jump para lançar este tipo de aeronave em mar aberto.' };
  const TIP_SEM_TRANSPORTE = { t: 'FUZILEIROS SEM TRANSPORTE', txt: 'Soldado não nada até a zona de operação: precisa de NAVIOS ou PORTA-AVIÕES na frota. Cada navio leva ~150 fuzileiros; cada carrier, ~1.600.' };
  // Se você tem porta-aviões livre, aeronaves entram na lista (decolam do carrier).
  // Aéreos SEMPRE aparecem na lista — mas ficam APAGADOS (desabilitados) até haver um
  // porta-aviões na frota, com o motivo no hover. Acendem ao vivo quando você adiciona
  // um porta-aviões na composição. (Antes eles sumiam da lista sem explicar por quê.)
  const permitidos = [...NAVAIS, ...AEREOS_EMBARCADOS, 'infantaria'];
  const disp = UNIDADES.filter((u) => permitidos.includes(u.id) && (livre[u.id] || 0) > 0);
  const vizinhos = quemSente(e, coord, globoCtrl);
  const envio = {};

  // ANCORADO NO PONTO DO MAR (pedido do dono): não é mais um modal na frente da tela —
  // o cartão nasce ao lado de onde você clicou e gira junto com o globo, igual ao
  // painel da frota. O fundo fica livre; Esc ou o ✕ fecham.
  const palco = document.getElementById('globo-wrap') || document.body;
  const modal = document.createElement('div');
  modal.className = 'nva-flut nvp-anc';
  palco.appendChild(modal);
  let raf = null;
  const seguir = () => {
    const t = globoCtrl?.telaDe?.(coord.lat, coord.lng);
    if (t) {
      const pw = modal.offsetWidth || 340; const ph = modal.offsetHeight || 300;
      let x = t.x + 26; let y = t.y - ph / 2;
      if (x + pw > t.w - 8) x = t.x - pw - 26;
      x = Math.max(8, Math.min(x, Math.max(8, t.w - pw - 8)));
      y = Math.max(8, Math.min(y, Math.max(8, t.h - ph - 8)));
      modal.style.left = `${Math.round(x)}px`; modal.style.top = `${Math.round(y)}px`;
      modal.style.opacity = t.frente ? '1' : '0.12';
    }
    raf = requestAnimationFrame(seguir);
  };
  requestAnimationFrame(seguir);
  const fechar = () => { if (raf) cancelAnimationFrame(raf); modal.remove(); document.removeEventListener('keydown', tecla); };
  const sair = () => { fechar(); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', tecla);

  if (!disp.length) { renderSemLivre(); return; }

  render();

  // SEM EMBARCAÇÃO LIVRE — em vez da lista feia de cidades+recolher (que o dono
  // detestou), UM caminho limpo: ir ao Distribuir e reduzir a reserva de onde quiser.
  // Se há frota no mar, um atalho pra recolher a mais próxima direto.
  function renderSemLivre() {
    const NAVAIS_SET = new Set(NAVAIS);
    const emFrota = (e.frotas || []).length;
    const emEstados = ondeComprometidas(e).some((c) => c.tipo === 'estado' && Object.keys(c.g).some((u) => NAVAIS_SET.has(u)));
    modal.innerHTML = `<div class="env-painel nvsl">
      <div class="env-cab">
        <span class="env-simbolo naval">${ico('anchor', 22)}</span>
        <div class="env-tit"><h2>POSIÇÃO NAVAL</h2><div class="env-sub">mar aberto · ${coord.lat.toFixed(1)}°, ${coord.lng.toFixed(1)}°</div></div>
        <button class="pp-fechar" id="nv-x">${ico('x', 16)}</button>
      </div>
      <div class="env-jaguerra">${ico('info', 15)} <span>Toda a sua frota já está <b>designada</b> — em estados ou no mar. Libere navios ajustando a distribuição, e volte a posicionar aqui.</span></div>
      <div class="nvsl-acoes">
        ${emEstados ? `<button class="nvsl-cta principal" id="nvsl-dist">${ico('network', 16)} <span>AJUSTAR DISTRIBUIÇÃO DE TROPAS<small>reduza a reserva de um estado — os navios voltam ao quartel</small></span></button>` : ''}
        ${emFrota ? `<button class="nvsl-cta" id="nvsl-frota">${ico('ship', 15)} <span>Recolher uma frota do mar<small>clique num pino de frota no globo pra trazê-la de volta</small></span></button>` : ''}
        ${!emEstados && !emFrota ? `<div class="env-jaguerra">${ico('info', 14)} <span>Você não tem navios — compre no mercado para projetar poder no mar.</span></div>` : ''}
      </div>
    </div>`;
    modal.querySelector('#nv-x').addEventListener('click', sair);
    modal.querySelector('#nvsl-dist')?.addEventListener('click', () => {
      sair();
      abrirDistribuir(jogo, { globoCtrl, onFim: () => {} });
    });
    modal.querySelector('#nvsl-frota')?.addEventListener('click', () => sair());
  }

  function render() {
    const equip = equipamentosDoPais(e.iso || 'USA');
    modal.innerHTML = `<div class="env-painel">
      <div class="env-cab">
        <span class="env-simbolo naval">${ico('anchor', 22)}</span>
        <div class="env-tit">
          <h2>POSIÇÃO NAVAL</h2>
          <div class="env-sub">mar aberto · ${coord.lat.toFixed(1)}°, ${coord.lng.toFixed(1)}°</div>
        </div>
        <button class="pp-fechar" id="nv-x">${ico('x', 16)}</button>
      </div>

      <div class="env-jaguerra nv-nota">${ico('info', 15)}
        <span><b>Isto não é um ataque.</b> É a coisa que se faz para não precisar atacar. Ninguém declara guerra — mas quem está na costa vai dormir sabendo que você está ali.</span></div>

      ${vizinhos.length ? `<div class="nv-viz">
        <div class="nv-viz-rot">${ico('radar', 11)} Quem vai sentir esta frota</div>
        ${vizinhos.map((v) => `<div class="nv-v zona-${v.zona.id} ${v.ataque ? 'ataque' : v.parceiro ? 'parceiro' : v.hostil ? 'hostil' : ''}">
          <span class="nv-v-nome">${esc(v.nome)}${v.parceiro ? ` ${ico('handshake', 9)}` : v.hostil ? ` ${ico('swords', 9)}` : ''}</span>
          <span class="nv-v-medidor"><i style="width:${Math.round(v.zona.peso * 100)}%"></i></span>
          <span class="nv-v-d">${v.zona.rot}</span>
        </div>`).join('')}
        ${vizinhos.some((v) => v.ataque) ? `<div class="nv-alerta-atk">${ico('triangle-alert', 12)} Você está nas <b>águas territoriais</b> de um país que não é seu parceiro — isso será tratado como <b>ato de guerra</b>.</div>` : ''}
        ${vizinhos.some((v) => v.parceiro && v.zona.provoca) ? `<div class="nv-alerta-req">${ico('handshake', 12)} Frota em águas de um <b>parceiro</b> — vai como <b>pedido de acesso</b>, não como ameaça. Se a relação azedar, aí muda.</div>` : ''}
      </div>` : `<div class="env-jaguerra">${ico('info', 14)} <span>Mar deserto. Ninguém por perto para se importar — a frota aqui é só combustível queimado.</span></div>`}

      <div class="env-lista">
        ${disp.map((u) => {
          const eq = equip?.[u.id];
          const foto = eq?.foto || FOTO_UNIDADE[u.id];
          const d = livre[u.id] || 0;
          const aereo = AEREOS_EMBARCADOS.includes(u.id);
          const fuzileiro = u.id === 'infantaria';
          const bloq = aereo || fuzileiro; // começa travado; recalc() destrava com convés/transporte
          // porta-aviões mostra a ficha da CLASSE: quantas aeronaves cabem por casco
          const subCarrier = u.id === 'porta_avioes'
            ? ` · ${conveSoDrone ? `convés só de drone · ${capPorCarrier} VANTs` : `${capPorCarrier} aeronaves`}/casco`
            : '';
          return `<div class="env-item ${bloq ? 'bloqueado' : ''}" data-aereo="${aereo ? 1 : 0}" data-fuz="${fuzileiro ? 1 : 0}"
              ${bloq ? `data-tip="${fuzileiro ? TIP_SEM_TRANSPORTE.txt : TIP_SEM_CARRIER.txt}" data-tip-t="${fuzileiro ? TIP_SEM_TRANSPORTE.t : TIP_SEM_CARRIER.t}" data-tip-cor="perigo"` : ''}>
            <span class="env-foto">${foto ? `<img src="${foto}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${u.icone}'">` : u.icone}</span>
            <span class="env-info"><b>${esc(eq?.nome || u.nome)}</b><small class="env-disp">${bloq ? (fuzileiro ? 'requer navios na frota (transporte)' : 'requer porta-aviões na frota') : `${d.toLocaleString('pt-BR')} disponíveis${subCarrier}`}</small></span>
            <input type="range" class="env-slider nv-slider" data-u="${u.id}" data-max="${d}" min="0" max="${bloq ? 0 : d}" step="${u.passo}" value="0" ${bloq ? 'disabled' : ''}>
            <span class="env-qtd" id="nq-${u.id}">0</span>
          </div>`;
        }).join('')}
      </div>

      <div class="env-prog" id="nv-prog"></div>
      <div class="env-acoes">
        <button class="env-lancar nv-lancar" id="nv-ok" disabled>${ico('anchor', 15)} <span>POSICIONAR FROTA</span></button>
        <button class="env-abortar" id="nv-no">Cancelar</button>
      </div>
    </div>`;

    modal.querySelector('#nv-x').addEventListener('click', sair);
    modal.querySelector('#nv-no').addEventListener('click', sair);
    const prog = modal.querySelector('#nv-prog');
    const btn = modal.querySelector('#nv-ok');

    const recalc = () => {
      // AÉREOS acendem/apagam ao vivo conforme há PORTA-AVIÕES — e respeitam a CAPACIDADE
      // DA CLASSE (catálogo militar): a soma de caças+drones+bombardeiros embarcados não
      // passa de (carriers × capacidade do SEU carrier). Convés só de drone (Anadolu,
      // PHM Atlântico) mantém caça/bombardeiro travados mesmo com carrier na frota.
      const carriers = Number(modal.querySelector('.nv-slider[data-u="porta_avioes"]')?.value) || 0;
      const naviosSel = Number(modal.querySelector('.nv-slider[data-u="navios"]')?.value) || 0;
      const capAvioes = carriers * capPorCarrier;
      modal.querySelectorAll('.env-item[data-aereo="1"]').forEach((it) => {
        const s = it.querySelector('.nv-slider'); const dmax = Number(s.dataset.max) || 0;
        // asa ROTATIVA (helicóptero) e VANT decolam de qualquer convés; só asa fixa exige catapulta
        const asaFixa = !SEM_CATAPULTA_OK.has(s.dataset.u);
        const semCatapulta = conveSoDrone && asaFixa;
        const lib = carriers > 0 && dmax > 0 && !semCatapulta;
        const teto = lib ? Math.min(dmax, capAvioes) : 0;   // um tipo sozinho não passa da capacidade
        if (Number(s.value) > teto) { s.value = teto; it.querySelector('.env-qtd').textContent = Number(teto).toLocaleString('pt-BR'); }
        s.disabled = !lib; s.max = teto;
        it.classList.toggle('bloqueado', !lib);
        it.classList.toggle('quase', lib);
        // BUG QUE ISTO CONSERTA: o tooltip "AERONAVE SEM CONVÉS" era gravado no render e
        // NUNCA removido — mesmo com porta-aviões na frota o hover seguia acusando falta
        // de convés. Agora o tip acompanha o estado real (e explica o motivo certo).
        if (lib) {
          it.removeAttribute('data-tip'); it.removeAttribute('data-tip-t'); it.removeAttribute('data-tip-cor');
        } else {
          const tip = semCatapulta && carriers > 0 ? TIP_SEM_CATAPULTA : TIP_SEM_CARRIER;
          it.setAttribute('data-tip', tip.txt); it.setAttribute('data-tip-t', tip.t); it.setAttribute('data-tip-cor', 'perigo');
        }
        const disp = it.querySelector('.env-disp');
        if (disp) disp.textContent = lib
          ? `${dmax.toLocaleString('pt-BR')} disponíveis · cabem ${capAvioes.toLocaleString('pt-BR')} (${carriers} × ${capPorCarrier})`
          : (semCatapulta && carriers > 0 ? 'este porta-aviões só opera drones e helicópteros' : dmax > 0 ? 'requer porta-aviões na frota' : 'nenhum disponível');
      });
      // FUZILEIROS: destravam com TRANSPORTE na frota (navios/carriers) até o teto de praças
      const capFuzileiros = naviosSel * FUZILEIROS_POR_NAVIO + carriers * FUZILEIROS_POR_CARRIER;
      modal.querySelectorAll('.env-item[data-fuz="1"]').forEach((it) => {
        const s = it.querySelector('.nv-slider'); const dmax = Number(s.dataset.max) || 0;
        const lib = capFuzileiros > 0 && dmax > 0;
        const teto = lib ? Math.min(dmax, capFuzileiros) : 0;
        if (Number(s.value) > teto) { s.value = teto; it.querySelector('.env-qtd').textContent = Number(teto).toLocaleString('pt-BR'); }
        s.disabled = !lib; s.max = teto;
        it.classList.toggle('bloqueado', !lib);
        it.classList.toggle('quase', lib);
        if (lib) { it.removeAttribute('data-tip'); it.removeAttribute('data-tip-t'); it.removeAttribute('data-tip-cor'); }
        else { it.setAttribute('data-tip', TIP_SEM_TRANSPORTE.txt); it.setAttribute('data-tip-t', TIP_SEM_TRANSPORTE.t); it.setAttribute('data-tip-cor', 'perigo'); }
        const disp = it.querySelector('.env-disp');
        if (disp) disp.textContent = lib
          ? `${dmax.toLocaleString('pt-BR')} disponíveis · transporte p/ ${capFuzileiros.toLocaleString('pt-BR')} fuzileiros`
          : (dmax > 0 ? 'requer navios na frota (transporte)' : 'nenhum disponível');
      });
      let n = 0;
      for (const s of modal.querySelectorAll('.nv-slider')) {
        envio[s.dataset.u] = Number(s.value) || 0;
        n += envio[s.dataset.u];
        modal.querySelector(`#nq-${s.dataset.u}`).textContent = Number(s.value).toLocaleString('pt-BR');
      }
      // total de aeronaves embarcadas vs. capacidade dos porta-aviões
      const totalAereo = AEREOS_EMBARCADOS.reduce((s, k) => s + (envio[k] || 0), 0);
      const excedeCap = totalAereo > capAvioes;
      const excedeFuz = (envio.infantaria || 0) > capFuzileiros;
      btn.disabled = n <= 0 || excedeCap || excedeFuz;
      if (!n) {
        prog.className = 'env-prog';
        prog.innerHTML = `${ico('info', 13)} <span>Escolha o que zarpa. Navios e submarinos flutuam sozinhos; aeronaves pedem convés; fuzileiros pedem transporte.</span>`;
        return;
      }
      if (excedeCap) {
        prog.className = 'env-prog';
        prog.innerHTML = `<b class="ruim">${ico('triangle-alert', 13)} ${totalAereo.toLocaleString('pt-BR')} aeronaves para ${capAvioes.toLocaleString('pt-BR')} de capacidade (${carriers} porta-aviões × ${capPorCarrier}). Reduza os aviões ou leve mais um carrier.</b>`;
        return;
      }
      if (excedeFuz) {
        prog.className = 'env-prog';
        prog.innerHTML = `<b class="ruim">${ico('triangle-alert', 13)} ${(envio.infantaria || 0).toLocaleString('pt-BR')} fuzileiros para ${capFuzileiros.toLocaleString('pt-BR')} de transporte. Leve mais navios ou reduza a tropa.</b>`;
        return;
      }
      const pres = presenca(envio);
      // BUG QUE ISTO CONSERTA: lia vizinhos[0].peso (não existe → NaN). O peso mora em .zona.peso.
      const quedaRel = vizinhos.length ? Math.round(pres * (vizinhos[0].zona?.peso || 0) * 0.9) : 0;
      // Os mesmos números que confirmar() vai aplicar — agora VISÍVEIS antes de assinar,
      // como bullets de balanço: o que a frota compra (segurança) e o que ela cobra
      // (dinheiro, influência, relação). O jogador sente o custo antes, não depois.
      const custo = custoOperacional(pres);
      const seg = Math.min(10, Math.round(pres * 0.4));
      const infl = Math.min(8, Math.round(pres * 0.3));
      const v0 = vizinhos[0];
      const bullets = [
        { ic: 'ship', rot: 'embarcações', val: `${n}`, cls: 'info' },
        { ic: 'radar', rot: totalAereo > 0 ? `presença · aviões ${totalAereo}/${capAvioes}` : 'presença', val: `${pres}`, cls: 'info' },
        { ic: 'banknote', rot: 'custo operacional', val: dinheiro(custo), cls: 'custo' },
        { ic: 'shield', rot: 'segurança', val: `+${seg}`, cls: 'bom' },
        { ic: 'globe', rot: 'influência', val: `−${infl}`, cls: 'custo' },
        ...(v0 ? [{ ic: v0.ataque ? 'swords' : v0.parceiro ? 'handshake' : 'radar', rot: `relação · ${v0.nome}`, val: v0.parceiro ? 'acesso' : `−${quedaRel}`, cls: v0.ataque ? 'ruim' : v0.parceiro ? 'aten' : 'ruim' }] : []),
      ];
      prog.className = 'env-prog';
      prog.innerHTML = `<div class="nv-bullets">
        ${bullets.map((b) => `<span class="nv-b ${b.cls}">${ico(b.ic, 12)}<i>${esc(b.rot)}</i><b>${esc(b.val)}</b></span>`).join('')}
      </div>`;
    };
    modal.querySelectorAll('.nv-slider').forEach((s) => s.addEventListener('input', recalc));
    recalc();
    btn.addEventListener('click', () => confirmar());
  }

  // "Presença" é o peso diplomático da frota. O porta-aviões pesa muito mais que a
  // soma dos cascos: ele é uma base aérea que ninguém pode sancionar.
  function presenca(dep) {
    return Math.round((dep.navios || 0) * 0.6 + (dep.submarinos || 0) * 0.4 + (dep.porta_avioes || 0) * 6
      + (dep.cacas || 0) * 0.5 + (dep.bombardeiros || 0) * 1.2 + (dep.drones || 0) * 0.3
      + (dep.helicopteros || 0) * 0.35 + (dep.infantaria || 0) * 0.0004);   // fuzileiros impõem: é gente pronta pra desembarcar
  }

  async function confirmar() {
    // Aeronaves sem porta-aviões NA FROTA não têm de onde decolar — bloqueia.
    const temAereo = AEREOS_EMBARCADOS.some((k) => (envio[k] || 0) > 0);
    if (temAereo && !(envio.porta_avioes > 0)) {
      const aviso = modal.querySelector('#nv-prog');
      if (aviso) aviso.innerHTML = `<b class="ruim">${ico('triangle-alert', 12)} Aeronaves precisam de um porta-aviões na mesma frota para decolar.</b>`;
      return;
    }
    const pres = presenca(envio);
    if (pres <= 0) return;

    // a frota ZARPA DO PORTO e NAVEGA até o ponto — não teleporta. O tempo sai da distância
    // (jogo/frotas.js). Sem porto (país sem litoral no catálogo), aparece no ponto mesmo.
    // `porto` já foi resolvido no topo (mesma referência que calculou o custo operacional).
    const agora = Date.now();
    const fr = {
      id: `f_${agora}`, lat: porto?.lat ?? coord.lat, lng: porto?.lng ?? coord.lng,
      unidades: { ...envio }, presenca: pres, desde: e.turno || 0, portoNome: porto?.nome || null,
    };
    let etaSeg = 0;
    if (porto) { const ms = iniciarTransito(fr, coord, agora); etaSeg = Math.round(ms / 1000); }
    e.frotas = e.frotas || [];
    e.frotas.push(fr);
    e.guarnicoes = e.guarnicoes || {};
    fr.guarnKey = `MAR_${fr.id}`;                         // LIGA a frota à tropa comprometida
    e.guarnicoes[fr.guarnKey] = { ...envio };            // ocupa a tropa (sai de tropaLivre)

    // O preço agora depende da ZONA e da RELAÇÃO, não é mais um número fixo:
    //   • parceiro → é um pedido de acesso: quase não custa relação, dá até soft_power.
    //   • neutro   → irrita proporcional à proximidade (o comportamento antigo).
    //   • hostil / águas territoriais de não-parceiro → declara GUERRA de fato.
    // CUSTO OPERACIONAL debitado do tesouro na hora (aplicarEfeitos trava em 0 — deploy
    // com o cofre vazio zera o caixa, e o rombo vira dívida no fechamento como qualquer gasto).
    const custoOp = custoOperacional(pres);
    const efeitos = { tesouro: -custoOp, temp_guerra: Math.min(14, Math.round(pres * 0.5)), seguranca: Math.min(10, Math.round(pres * 0.4)), soft_power: -Math.min(8, Math.round(pres * 0.3)) };
    const guerras = [];
    for (const v of vizinhos) {
      const base = Math.round(pres * v.zona.peso * 0.9);
      if (v.ataque) {                                         // vira guerra com esse país
        efeitos[v.relKey] = -(base + 25);
        e.emGuerra = e.emGuerra || [];
        if (!e.emGuerra.includes(v.code)) { e.emGuerra.push(v.code); guerras.push(v.nome); }
      } else if (v.parceiro) {                                // pedido amigável: custo baixo
        efeitos[v.relKey] = -Math.round(base * 0.2);
        efeitos.soft_power = (efeitos.soft_power || 0) + 2;   // coordenação naval rende prestígio
      } else if (base > 0) {                                  // neutro/tenso: irritação normal
        efeitos[v.relKey] = -(base + (v.hostil ? 6 : 0));
      }
    }
    const mudancas = aplicarEfeitos(e, efeitos);

    fechar();
    // A frota chega como RADAR, não como objeto 3D de navio: o pino no mar (ver
    // atualizar() em globo.js) + o pulso de radar. É o que o dono pediu.
    globoCtrl?.focar?.(coord);
    globoCtrl?.ondaRadar?.(coord, { cor: 0x8fb4ff, max: 55 });
    const meuNome = PAISES[e.iso]?.nome || 'Nossa nação';
    const zarpe = etaSeg > 0 ? ` A esquadra zarpa de ${esc(fr.portoNome || 'porto')} — travessia estimada em ${etaSeg}s.` : '';
    jogo._empilharFeed?.([{
      tipo: 'sistema', handle: 'Marinha', cor: guerras.length ? '#ff3b5c' : '#8fb4ff',
      texto: guerras.length
        ? `GUERRA: a frota de ${meuNome} entrou nas águas territoriais de ${esc(guerras.join(', '))}. Cruzar aquela linha sem ser aliado não é presença — é invasão, e foi assim que ${esc(guerras[0])} tratou.${zarpe}`
        : vizinhos.length
          ? `${meuNome} posiciona ${pres >= 12 ? 'um grupo de batalha' : 'uma força naval'} a poucas horas da costa de ${esc(vizinhos[0].nome)}. Nenhum tiro foi dado. Nenhum era necessário.${zarpe}`
          : `${meuNome} desloca frota para o mar aberto. Analistas procuram no mapa o que exatamente está sendo ameaçado.${zarpe}`,
    }]);
    // REPERCUSSÃO (pedido do dono): frota perto de costa alheia É notícia — plantão no
    // globo + eco no X (todo breaking vira post). Mar deserto não rende manchete.
    if (guerras.length) {
      dispararBreaking(jogo, { assunto: `Frota de ${meuNome} invade águas de ${guerras[0]}`, contexto: `A esquadra cruzou o mar territorial sem ser aliada — tratado como ato de guerra. Presença: ${pres}.`, tom: 'quente', iso: vizinhos.find((v) => v.ataque)?.code });
    } else if (vizinhos.length && (vizinhos[0].zona?.peso || 0) >= 0.4) {
      dispararBreaking(jogo, { assunto: `${meuNome} estaciona frota diante da costa de ${vizinhos[0].nome}`, contexto: `${pres >= 12 ? 'Grupo de batalha' : 'Força naval'} com presença ${pres} a ${vizinhos[0].zona.rot.toLowerCase()}. Nenhum tiro — e ninguém dorme.`, tom: 'tenso', iso: vizinhos[0].code });
    }
    globoCtrl?.atualizar?.();
    await espera(600);
    onFim?.({ tipo: 'naval', coord, presenca: pres, mudancas });
  }
}
