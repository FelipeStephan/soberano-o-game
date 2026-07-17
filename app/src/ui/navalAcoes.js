// ═══════════════════════════════════════════════════════════════════════
// AÇÕES RÁPIDAS DA FROTA — o popup pra decidir na hora
// ═══════════════════════════════════════════════════════════════════════
// Clicar num pino de frota abre isto: o que dá pra fazer com ela AGORA. Reposicionar
// (arrastar), mandar de volta pra casa (libera as tropas e esfria o clima), ou — se tem
// um hostil por perto — partir pra cima. Uma IA lê a situação (quem está perto, a
// relação) e sugere a jogada rápida. É a ferramenta de decisão veloz que o dono pediu.
import { PAISES } from '../dados/paises.js';
import { techDaFrota } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { FOTO_UNIDADE } from '../dados/imagens.js';
import { frotasDetectadas, poderNaval, distGraus } from '../jogo/frotas.js';
import { todosEstados } from '../jogo/territorio.js';
import { abrirEnvio } from './envio.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── MEDIDORES LEGÍVEIS ─────────────────────────────────────────────────
// "Alcance 34°" não diz nada pro jogador. Cada atributo vira uma barra
// normalizada + uma palavra-classe ("global", "radar forte", "fantasma").
const pctDe = (v, max) => Math.max(0, Math.min(100, Math.round((v / max) * 100)));
const classeAlcance = (v) => (v < 10 ? 'costeiro' : v < 22 ? 'regional' : 'global');
const classeDeteccao = (v) => (v < 8 ? 'curto' : v < 14 ? 'médio' : 'forte');
const classeFurtiv = (v) => (v < 30 ? 'visível' : v < 70 ? 'discreta' : 'fantasma');
const barra = (rotulo, pct, palavra, extra = '') => `<div class="nva-barra ${extra}">
  <i>${rotulo}</i>
  <div class="nva-barra-trilha"><b style="width:${pct}%"></b></div>
  <em>${esc(palavra)}</em>
</div>`;

export function abrirAcoesNaval(fr, jogo, helpers = {}) {
  if (document.querySelector('.nva-modal')) return;
  const e = jogo.estado;
  const u = fr.unidades || {};
  const dom = u.porta_avioes ? 'porta_avioes' : u.navios ? 'navios' : 'submarinos';
  const soSub = !u.navios && !u.porta_avioes && u.submarinos;
  const tech = techDaFrota(u);
  const eq = equipamentosDoPais(e.iso || 'USA')?.[dom];
  const foto = eq?.foto || FOTO_UNIDADE[dom];
  const nomeReal = eq?.nome || 'Força naval';
  const perto = (helpers.paisesProximos?.(fr) || []).slice(0, 3);
  const alvo = perto.find((p) => p.hostil) || perto[0] || null;

  const modal = document.createElement('div');
  modal.className = 'modal-fundo nva-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); helpers.onFim?.(); };
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  const linhas = ['porta_avioes', 'navios', 'submarinos'].filter((k) => u[k])
    .map((k) => `${u[k]} × ${({ porta_avioes: 'Porta-aviões', navios: 'Navio', submarinos: 'Submarino' })[k]}`).join(' · ');

  modal.innerHTML = `<div class="nva-painel">
    <div class="nva-cab">
      <div class="nva-foto">${foto ? `<img src="${foto}" alt="" onerror="this.parentElement.innerHTML='${ico('ship', 22)}'">` : ico('ship', 22)}</div>
      <div class="nva-tit"><h2>${esc(nomeReal)}</h2><span>${esc(linhas || 'força naval')} · presença ${fr.presenca}</span></div>
      <button class="pp-fechar nva-x">${ico('x', 16)}</button>
    </div>
    <div class="nva-barras">
      ${barra('Alcance', pctDe(tech.alcance, 40), classeAlcance(tech.alcance))}
      ${barra('Detecção', pctDe(tech.deteccao, 20), `radar ${classeDeteccao(tech.deteccao)}`)}
      ${barra('Furtividade', pctDe(tech.furtividade, 100), classeFurtiv(tech.furtividade) + (soSub ? ' 🥷' : ''), 'furtiva')}
    </div>
    <div id="nva-corpo">
      ${alvo ? `<div class="nva-alvo ${alvo.hostil ? 'hostil' : alvo.parceiro ? 'amigo' : 'neutro'}">
        ${ico(alvo.hostil ? 'swords' : alvo.parceiro ? 'handshake' : 'radar', 14)}
        <span><b>${esc(alvo.nome)}</b> a ${alvo.d.toFixed(0)}° · relação ${alvo.rel} — ${alvo.hostil ? 'HOSTIL, um estopim' : alvo.parceiro ? 'parceiro, presença amistosa' : 'neutro, observando'}</span>
      </div>` : ''}
      <div class="nva-acoes">
        <button class="nva-btn mover" id="nva-mover">${ico('move', 15)} <span>Reposicionar<small>arraste o pino no globo</small></span></button>
        <button class="nva-btn atacar" id="nva-atacar">${ico('crosshair', 15)} <span>Iniciar ataque<small>varredura de radar: revela o que a frota enxerga</small></span></button>
        <button class="nva-btn casa" id="nva-casa">${ico('home', 15)} <span>Mandar de volta pra casa<small>libera as tropas e esfria o clima</small></span></button>
      </div>
    </div>
  </div>`;

  modal.querySelector('.nva-x').addEventListener('click', fechar);
  modal.querySelector('#nva-mover').addEventListener('click', fechar);

  // MANDAR DE VOLTA PRA CASA: some com a frota, devolve as tropas ao quartel e reduz a
  // tensão. É o "reduzir conflito" que o dono pediu como alternativa ao ataque.
  modal.querySelector('#nva-casa').addEventListener('click', () => {
    e.frotas = (e.frotas || []).filter((f) => f.id !== fr.id);
    // devolve a guarnição naval "comprometida" (a entrada MAR_ de composição igual)
    for (const [k, g] of Object.entries(e.guarnicoes || {})) {
      if (k.startsWith('MAR_') && JSON.stringify(g) === JSON.stringify(fr.unidades)) { delete e.guarnicoes[k]; break; }
    }
    e.temp_guerra = Math.max(0, (e.temp_guerra || 0) - 4);
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `Frota recolhida ao porto. Tropas de volta ao quartel e um grau a menos de tensão no mar.`, cor: '#22e0a0' }]);
    helpers.atualizar?.();
    fechar();
  });

  // ── INICIAR ATAQUE → MODO VARREDURA ─────────────────────────────────────
  // O botão não atira em nada: ele LIGA O RADAR. Um sweep cônico gira ~1.6s (CSS puro,
  // prefixo .nvr-) + a onda no globo, e os CONTATOS vão pingando na lista com stagger —
  // frotas inimigas dentro da detecção e estados costeiros dentro do alcance. Só então
  // o jogador escolhe o alvo, com o custo dito na cara (hostil = guerra aberta; neutro
  // = ato de guerra). O velho "partir pra cima do hostil" sobrevive como um dos alvos.
  modal.querySelector('#nva-atacar')?.addEventListener('click', () => varrer());

  // Comportamento ANTIGO do botão de ataque: guerra aberta contra o país hostil próximo.
  function atacarPais(p) {
    e.emGuerra = e.emGuerra || [];
    if (!e.emGuerra.includes(p.code)) e.emGuerra.push(p.code);
    const chave = PAISES[p.code]?.rel; if (chave) e[chave] = Math.max(-100, (e[chave] || 0) - 40);
    e.temp_guerra = Math.min(100, (e.temp_guerra || 0) + 20);
    helpers.ondaRadar?.({ lat: fr.lat, lng: fr.lng }, { cor: 0xff3b5c, max: 60 });
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `⚔️ Sua frota abriu fogo contra ${esc(p.nome)}. É guerra no mar.`, cor: '#ff3b5c' }]);
    helpers.atualizar?.();
    fechar();
  }

  // O que o radar ENXERGA agora: frotas inimigas (detecção × furtividade, jogo/frotas.js)
  // e estados costeiros de países não-parceiros dentro do ALCANCE da frota (territorio.js).
  function colherAlvos() {
    const eu = e.iso || 'USA';
    const alvos = [];
    for (const v of frotasDetectadas([fr], e.frotasInimigas || [])) {
      alvos.push({ tipo: 'frota', d: v.distancia, frota: v.frota });
    }
    if (alvo && alvo.hostil) alvos.push({ tipo: 'pais', d: alvo.d, pais: alvo });
    const estados = todosEstados()
      .map((s) => ({ s, d: distGraus(s, fr) }))
      .filter((x) => x.d <= tech.alcance && x.s.pais !== eu && x.s.lat != null)
      .filter((x) => {
        const info = PAISES[x.s.pais]; if (!info) return false;
        return Number(e[info.rel] ?? 0) < 30;   // parceiro não é alvo
      })
      .sort((a, b) => a.d - b.d).slice(0, 6);
    for (const x of estados) {
      const rel = Number(e[PAISES[x.s.pais].rel] ?? 0);
      alvos.push({ tipo: 'estado', d: x.d, estado: x.s, hostil: rel <= -20 });
    }
    return alvos.sort((a, b) => a.d - b.d);
  }

  function linhaAlvo(a, i) {
    const delay = `style="animation-delay:${(420 + i * 190)}ms"`;
    if (a.tipo === 'frota') {
      const nomeF = PAISES[a.frota.code]?.nome || a.frota.nome || a.frota.code;
      return `<button class="nvr-item frota" data-i="${i}" ${delay}>${ico('ship', 15)}
        <span><b>Esquadra de ${esc(nomeF)}</b><small>poder naval ${poderNaval(a.frota)} — engajar: briga de esquadra em mar aberto</small></span>
        <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
    }
    if (a.tipo === 'pais') {
      return `<button class="nvr-item hostil" data-i="${i}" ${delay}>${ico('swords', 15)}
        <span><b>Partir pra cima de ${esc(a.pais.nome)}</b><small>hostil — vira guerra aberta no mar</small></span>
        <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
    }
    const nomeP = PAISES[a.estado.pais]?.nome || a.estado.pais;
    return `<button class="nvr-item ${a.hostil ? 'hostil' : 'neutro'}" data-i="${i}" ${delay}>${ico('crosshair', 15)}
      <span><b>${esc(a.estado.nome)} · ${esc(nomeP)}</b><small>${a.hostil ? 'hostil — desembarcar é guerra aberta' : 'neutro — ato de guerra, e o mundo reage'}</small></span>
      <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
  }

  function varrer() {
    helpers.ondaRadar?.({ lat: fr.lat, lng: fr.lng }, { cor: 0x35e0ff, max: 40 });
    const corpo = modal.querySelector('#nva-corpo');
    const alvos = colherAlvos();
    corpo.innerHTML = `<div class="nvr-scan">
      <div class="nvr-radar"><i class="nvr-anel"></i><i class="nvr-anel a2"></i><i class="nvr-sweep"></i></div>
      <div class="nvr-status" id="nvr-status">VARRENDO O MAR…</div>
      <div class="nvr-lista">${alvos.map((a, i) => linhaAlvo(a, i)).join('')}</div>
    </div>`;
    setTimeout(() => {
      if (!modal.isConnected) return;
      const st = modal.querySelector('#nvr-status');
      const radar = modal.querySelector('.nvr-radar');
      radar?.classList.add('fim');
      if (alvos.length) { if (st) st.textContent = `${alvos.length} CONTATO${alvos.length > 1 ? 'S' : ''} NO ALCANCE — ESCOLHA O ALVO`; }
      else {
        if (st) st.textContent = 'VARREDURA CONCLUÍDA';
        modal.querySelector('.nvr-scan')?.insertAdjacentHTML('beforeend',
          `<div class="nvr-vazio">Mar vazio no alcance. Aproxime a frota e varra de novo.</div>
           <button class="nvr-acao" id="nvr-refazer">${ico('radar', 13)} VARRER DE NOVO</button>`);
        modal.querySelector('#nvr-refazer')?.addEventListener('click', () => varrer());
      }
    }, 1600);
    corpo.querySelectorAll('.nvr-item').forEach((btn) => btn.addEventListener('click', () => {
      const a = alvos[Number(btn.dataset.i)];
      if (!a) return;
      if (a.tipo === 'pais') { atacarPais(a.pais); return; }
      if (a.tipo === 'frota') {
        // Engajar de verdade é papel do globo (onFrotaInimigaClick). Sem o helper, o
        // caminho continua existindo: feche e clique no pino inimigo.
        if (helpers.engajarFrota) { fechar(); helpers.engajarFrota(a.frota); return; }
        fechar();
        jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Marinha', cor: '#ffb020',
          texto: `Contato marcado: esquadra de ${esc(PAISES[a.frota.code]?.nome || a.frota.code)}. Aproxime-se e clique no pino inimigo para engajar.` }]);
        return;
      }
      // ESTADO COSTEIRO → o fluxo existente de DESIGNAR ALVO (envio.js) — desembarque pelo mar.
      fechar();
      abrirEnvio({ properties: { ...a.estado } }, jogo, { onFim: () => helpers.atualizar?.() });
    }));
  }
}
