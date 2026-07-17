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
import { tropaLivre } from '../jogo/territorio.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { portoDe } from '../dados/portosNavais.js';
import { iniciarTransito, duracaoTransito, distGraus } from '../jogo/frotas.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Só o que flutua. Mandar infantaria pro meio do Atlântico não é estratégia, é afogamento.
const NAVAIS = ['navios', 'submarinos', 'porta_avioes'];
// Aeronaves EMBARCADAS: só entram no mar se houver um PORTA-AVIÕES na força — é ele o
// aeroporto flutuante. Sem carrier, avião não tem de onde decolar no meio do oceano.
const AEREOS_EMBARCADOS = ['cacas', 'drones', 'bombardeiros'];
// CAPACIDADE do porta-aviões: um supercarrier real leva ~70 aeronaves no convés/hangar.
// Não dá pra pôr 1000 aviões no mar com 1 carrier — a esquadra só embarca o que cabe.
const CAP_AVIOES_POR_CARRIER = 70;

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
  const e = jogo.estado;
  const livre = tropaLivre(e);
  // Se você tem porta-aviões livre, aeronaves entram na lista (decolam do carrier).
  // Aéreos SEMPRE aparecem na lista — mas ficam APAGADOS (desabilitados) até haver um
  // porta-aviões na frota, com o motivo no hover. Acendem ao vivo quando você adiciona
  // um porta-aviões na composição. (Antes eles sumiam da lista sem explicar por quê.)
  const permitidos = [...NAVAIS, ...AEREOS_EMBARCADOS];
  const disp = UNIDADES.filter((u) => permitidos.includes(u.id) && (livre[u.id] || 0) > 0);
  const vizinhos = quemSente(e, coord, globoCtrl);
  const envio = {};

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
  const sair = () => { fechar(); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) sair(); });

  if (!disp.length) {
    modal.innerHTML = `<div class="env-painel">
      <div class="env-cab">
        <span class="env-simbolo naval">${ico('anchor', 22)}</span>
        <div class="env-tit"><h2>POSIÇÃO NAVAL</h2><div class="env-sub">mar aberto · ${coord.lat.toFixed(1)}°, ${coord.lng.toFixed(1)}°</div></div>
        <button class="pp-fechar" id="nv-x">${ico('x', 16)}</button>
      </div>
      <div class="env-jaguerra">${ico('info', 15)} <span>Você não tem nenhuma embarcação livre para posicionar. Navios, submarinos e porta-aviões que já estão guarnecendo território precisam ser recolhidos antes.</span></div>
    </div>`;
    modal.querySelector('#nv-x').addEventListener('click', sair);
    return;
  }

  render();

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
          const bloq = aereo; // começa travado; recalc() destrava se houver porta-aviões na composição
          return `<div class="env-item ${bloq ? 'bloqueado' : ''}" data-aereo="${aereo ? 1 : 0}"
              ${bloq ? `data-tip="Aeronaves precisam de um PORTA-AVIÕES na mesma frota para decolar em mar aberto. Adicione um porta-aviões acima e esta unidade acende." data-tip-t="AERONAVE SEM CONVÉS" data-tip-cor="perigo"` : ''}>
            <span class="env-foto">${foto ? `<img src="${foto}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${u.icone}'">` : u.icone}</span>
            <span class="env-info"><b>${esc(eq?.nome || u.nome)}</b><small class="env-disp">${bloq ? 'requer porta-aviões na frota' : `${d.toLocaleString('pt-BR')} disponíveis`}</small></span>
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
      // AÉREOS acendem/apagam ao vivo conforme há PORTA-AVIÕES — e agora respeitam a
      // CAPACIDADE: cada carrier leva ~70 aeronaves, então a soma de caças+drones+bombardeiros
      // embarcados não passa de (carriers × 70). Sem isso dava pra "1000 aviões com 1 carrier".
      const carriers = Number(modal.querySelector('.nv-slider[data-u="porta_avioes"]')?.value) || 0;
      const capAvioes = carriers * CAP_AVIOES_POR_CARRIER;
      modal.querySelectorAll('.env-item[data-aereo="1"]').forEach((it) => {
        const s = it.querySelector('.nv-slider'); const dmax = Number(s.dataset.max) || 0;
        const lib = carriers > 0 && dmax > 0;
        const teto = lib ? Math.min(dmax, capAvioes) : 0;   // um tipo sozinho não passa da capacidade
        if (Number(s.value) > teto) { s.value = teto; it.querySelector('.env-qtd').textContent = Number(teto).toLocaleString('pt-BR'); }
        s.disabled = !lib; s.max = teto;
        it.classList.toggle('bloqueado', !lib);
        it.classList.toggle('quase', lib);
        const disp = it.querySelector('.env-disp');
        if (disp) disp.textContent = lib ? `${dmax.toLocaleString('pt-BR')} disponíveis · cabem ${capAvioes.toLocaleString('pt-BR')}` : (dmax > 0 ? 'requer porta-aviões na frota' : 'nenhum disponível');
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
      btn.disabled = n <= 0 || excedeCap;
      if (!n) {
        prog.className = 'env-prog';
        prog.innerHTML = `${ico('info', 13)} <span>Escolha o que vai flutuar. Só navios, submarinos e porta-aviões — infantaria no meio do oceano é afogamento, não estratégia.</span>`;
        return;
      }
      if (excedeCap) {
        prog.className = 'env-prog';
        prog.innerHTML = `<b class="ruim">${ico('triangle-alert', 13)} ${totalAereo.toLocaleString('pt-BR')} aeronaves para ${capAvioes.toLocaleString('pt-BR')} de capacidade (${carriers} porta-aviões × ${CAP_AVIOES_POR_CARRIER}). Reduza os aviões ou leve mais um carrier.</b>`;
        return;
      }
      const pres = presenca(envio);
      // BUG QUE ISTO CONSERTA: lia vizinhos[0].peso (não existe → NaN). O peso mora em .zona.peso.
      const quedaRel = vizinhos.length ? Math.round(pres * (vizinhos[0].zona?.peso || 0) * 0.9) : 0;
      const capInfo = totalAereo > 0 ? ` · aviões ${totalAereo}/${capAvioes}` : '';
      prog.className = 'env-prog bom';
      prog.innerHTML = `${ico('radar', 13)} <span><b>${n}</b> embarcações · presença <b>${pres}</b>${capInfo}${vizinhos.length ? ` · relação com ${esc(vizinhos[0].nome)} <b class="ruim">−${quedaRel}</b>` : ''}. Segurança sobe, influência custa.</span>`;
    };
    modal.querySelectorAll('.nv-slider').forEach((s) => s.addEventListener('input', recalc));
    recalc();
    btn.addEventListener('click', () => confirmar());
  }

  // "Presença" é o peso diplomático da frota. O porta-aviões pesa muito mais que a
  // soma dos cascos: ele é uma base aérea que ninguém pode sancionar.
  function presenca(dep) {
    return Math.round((dep.navios || 0) * 0.6 + (dep.submarinos || 0) * 0.4 + (dep.porta_avioes || 0) * 6
      + (dep.cacas || 0) * 0.5 + (dep.bombardeiros || 0) * 1.2 + (dep.drones || 0) * 0.3);
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
    const porto = portoDe(e.iso || 'USA');
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
    const efeitos = { temp_guerra: Math.min(14, Math.round(pres * 0.5)), seguranca: Math.min(10, Math.round(pres * 0.4)), soft_power: -Math.min(8, Math.round(pres * 0.3)) };
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
    globoCtrl?.atualizar?.();
    await espera(600);
    onFim?.({ tipo: 'naval', coord, presenca: pres, mudancas });
  }
}
