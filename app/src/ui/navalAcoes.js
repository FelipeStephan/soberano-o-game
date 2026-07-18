// ═══════════════════════════════════════════════════════════════════════
// AÇÕES DA FROTA — a janela que gruda no pino e anda com o planeta
// ═══════════════════════════════════════════════════════════════════════
// Clicar num pino de frota (SUA ou INIMIGA) abre o MESMO formato de cartão:
// translúcido, ancorado ao lado do pino, seguindo a rotação do globo. O dono
// reclamou (com razão) que o pino inimigo abria um popup diferente, fixo — agora
// os dois mundos falam a mesma língua visual.
//
//   • Sua frota   → a bordo, reposicionar, varrer/atacar, voltar pra casa.
//   • Frota inimiga → a bordo DELES, atacar (escolhendo a força da SUA esquadra
//     em alcance) e intimar a recuar — com o rádio aberto trocando insultos.
//
// Quando entra em VARREDURA ou na TELA DE ATAQUE, o cartão fica COMPACTO: as
// barras, o "a bordo" e os abates somem — sobra a decisão (força, atacar, voltar).
// Era o "menu extenso" que o dono pediu pra encolher.
import { PAISES } from '../dados/paises.js';
import { techDaFrota, UNIDADE_POR_ID } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { FOTO_UNIDADE } from '../dados/imagens.js';
import { frotasDetectadas, poderNaval, distGraus, forcaFrota, recolherFrota } from '../jogo/frotas.js';
import { todosEstados, guarnicaoDefensiva } from '../jogo/territorio.js';
import { forcaDe } from '../jogo/forcasMundo.js';
import { resolverBaixas, animarAtaqueNaval, mostrarRelatorioBaixas, encenarIntimacao } from './batalhaNaval.js';
import { dispararBreaking } from './breaking.js';
import { ico } from './icones.js';

const COMPO_ORDEM = ['porta_avioes', 'navios', 'submarinos', 'cacas', 'bombardeiros', 'drones'];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Poder de combate NAVAL de uma composição — mesma escala de forcaFrota (~0.3 a ~2).
const poderDe = (unidades) => Object.entries(unidades || {}).reduce((s, [k, q]) => s + (q || 0) * (UNIDADE_POR_ID[k]?.poder || 0), 0);
// BOMBARDEIO: contra alvo EM TERRA a frota projeta a ala aérea + mísseis de cruzeiro —
// sem esse multiplicador a escala naval (pequena) nunca venceria guarnição terrestre.
const BOMBARDEIO_MULT = 12;
const poderAtaqueDe = (selecao, tipo) => poderDe(selecao) * (tipo === 'frota' ? 1 : BOMBARDEIO_MULT);

const pctDe = (v, max) => Math.max(0, Math.min(100, Math.round((v / max) * 100)));
const classeAlcance = (v) => (v < 10 ? 'costeiro' : v < 22 ? 'regional' : 'global');
const classeDeteccao = (v) => (v < 8 ? 'curto' : v < 14 ? 'médio' : 'forte');
const classeFurtiv = (v) => (v < 30 ? 'visível' : v < 70 ? 'discreta' : 'fantasma');
const barra = (rotulo, pct, palavra, extra = '') => `<div class="nva-barra ${extra}">
  <i>${rotulo}</i>
  <div class="nva-barra-trilha"><b style="width:${pct}%"></b></div>
  <em>${esc(palavra)}</em>
</div>`;

// ── PAINEL ANCORADO (compartilhado pelos dois mundos) ──────────────────
// Cria o cartão no #globo-wrap e o faz SEGUIR uma coordenada viva do globo via
// rAF (helpers.telaDe). `coordDe` é função — a frota se move, o cartão acompanha.
function criarPainelAncorado(coordDe, helpers, onFechar) {
  const palco = document.getElementById('globo-wrap') || document.body;
  const modal = document.createElement('div');
  modal.className = 'nva-flut';
  palco.appendChild(modal);
  let raf = null;
  const seguir = () => {
    const c = coordDe();
    const t = helpers.telaDe?.(c.lat, c.lng);
    if (t) {
      const pw = modal.offsetWidth || 300; const ph = modal.offsetHeight || 200;
      let x = t.x + 24; let y = t.y - ph / 2;
      if (x + pw > t.w - 8) x = t.x - pw - 24;
      x = clamp(x, 8, Math.max(8, t.w - pw - 8));
      y = clamp(y, 8, Math.max(8, t.h - ph - 8));
      modal.style.left = `${Math.round(x)}px`;
      modal.style.top = `${Math.round(y)}px`;
      modal.style.opacity = t.frente ? '1' : '0.12';
    }
    raf = requestAnimationFrame(seguir);
  };
  const fechar = () => { if (raf) cancelAnimationFrame(raf); modal.remove(); document.removeEventListener('keydown', tecla); onFechar?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  requestAnimationFrame(seguir);
  return { modal, palco, fechar };
}

// Grid "A BORDO" com as fotos do equipamento REAL do país dono das unidades.
function gridCompo(unidades, isoDono, baixas = null) {
  const equip = equipamentosDoPais(isoDono);
  return COMPO_ORDEM.filter((k) => (unidades[k] || 0) > 0).map((k) => {
    const eqk = equip?.[k]; const fk = eqk?.foto || FOTO_UNIDADE[k];
    const nome = eqk?.nome || UNIDADE_POR_ID[k]?.nome || k;
    const perdeu = baixas?.[k] || 0;   // −N no canto: o que já caiu deste tipo
    return `<div class="nva-cu" data-tip="${esc(nome)}${perdeu ? ` · já perdi ${perdeu.toLocaleString('pt-BR')}` : ''}">
      ${perdeu ? `<i class="nva-cu-perda">−${perdeu.toLocaleString('pt-BR')}</i>` : ''}
      <span class="nva-cu-foto">${fk ? `<img src="${fk}" alt="" loading="lazy" onerror="this.parentElement.textContent='${UNIDADE_POR_ID[k]?.icone || '•'}'">` : (UNIDADE_POR_ID[k]?.icone || '•')}</span>
      <b>${unidades[k].toLocaleString('pt-BR')}</b><small>${esc(nome)}</small></div>`;
  }).join('');
}

// ── TELA DE ATAQUE (seleção de força) — usada nos dois painéis ─────────
// Compacta por natureza: alvo, atalhos Tudo/50%/Limpar, sliders, balanço, atacar/voltar.
function renderSeletorForca(corpo, { minhaU, isoMeu, alvoNome, defesa, tipoAlvo, onVoltar, onAtacar }) {
  const equip = equipamentosDoPais(isoMeu);
  const combatentes = COMPO_ORDEM.filter((k) => (minhaU[k] || 0) > 0);
  const sel = {};
  for (const k of combatentes) sel[k] = minhaU[k];

  const linhaU = (k) => {
    const eqk = equip?.[k]; const fk = eqk?.foto || FOTO_UNIDADE[k];
    return `<div class="nvu-item" data-u="${k}">
      <span class="nvu-foto">${fk ? `<img src="${fk}" alt="" onerror="this.parentElement.textContent='${UNIDADE_POR_ID[k]?.icone || '•'}'">` : (UNIDADE_POR_ID[k]?.icone || '•')}</span>
      <span class="nvu-nome">${esc(eqk?.nome || UNIDADE_POR_ID[k]?.nome || k)}<small>${minhaU[k].toLocaleString('pt-BR')} a bordo</small></span>
      <input type="range" class="nvu-slider" min="0" max="${minhaU[k]}" step="${UNIDADE_POR_ID[k]?.passo || 1}" value="${minhaU[k]}">
      <b class="nvu-q">${minhaU[k].toLocaleString('pt-BR')}</b>
    </div>`;
  };

  corpo.innerHTML = `<div class="nvu-sel">
    <div class="nvu-alvo">${ico('crosshair', 12)} <b>${esc(alvoNome)}</b><em>defesa ${Math.round(defesa)}</em></div>
    <div class="nvu-quick">
      <button class="nvu-qk" data-q="tudo">${ico('check-check', 12)} Tudo</button>
      <button class="nvu-qk" data-q="metade">${ico('divide', 12)} 50%</button>
      <button class="nvu-qk" data-q="zero">${ico('x', 12)} Limpar</button>
    </div>
    <div class="nvu-lista">${combatentes.map(linhaU).join('')}</div>
    <div class="nvu-balanco" id="nvu-bal"></div>
    <div class="nvu-acoes">
      <button class="nvu-voltar" id="nvu-voltar">${ico('arrow-left', 13)} voltar</button>
      <button class="nvu-atacar" id="nvu-atacar">${ico('rocket', 14)} ATACAR</button>
    </div>
  </div>`;

  const bal = corpo.querySelector('#nvu-bal');
  const recalc = () => {
    let n = 0;
    for (const it of corpo.querySelectorAll('.nvu-item')) {
      const k = it.dataset.u; const v = Number(it.querySelector('.nvu-slider').value) || 0;
      sel[k] = v; it.querySelector('.nvu-q').textContent = v.toLocaleString('pt-BR'); n += v;
    }
    const poder = poderAtaqueDe(sel, tipoAlvo);
    const prev = resolverBaixas(poder, defesa);
    const cls = prev.venceu ? (prev.perdaAtacantePct < 25 ? 'esmaga' : 'vence') : 'perde';
    bal.className = `nvu-balanco ${cls}`;
    bal.innerHTML = n <= 0
      ? `${ico('info', 12)} Selecione ao menos uma unidade.`
      : `${ico(prev.venceu ? 'trending-up' : 'trending-down', 12)} Ataque <b>${Math.round(poder)}</b> vs defesa <b>${Math.round(defesa)}</b> — <b>${prev.venceu ? (prev.perdaAtacantePct < 25 ? 'vitória folgada' : 'vitória, mas custa') : 'arriscado'}</b> · baixas previstas ~${prev.perdaAtacantePct}%`;
    corpo.querySelector('#nvu-atacar').disabled = n <= 0;
  };
  corpo.querySelectorAll('.nvu-slider').forEach((s) => s.addEventListener('input', recalc));
  corpo.querySelectorAll('.nvu-qk').forEach((b) => b.addEventListener('click', () => {
    for (const it of corpo.querySelectorAll('.nvu-item')) {
      const k = it.dataset.u; const s = it.querySelector('.nvu-slider');
      s.value = b.dataset.q === 'tudo' ? minhaU[k] : b.dataset.q === 'metade' ? Math.floor(minhaU[k] / 2) : 0;
    }
    recalc();
  }));
  corpo.querySelector('#nvu-voltar').addEventListener('click', onVoltar);
  corpo.querySelector('#nvu-atacar').addEventListener('click', () => onAtacar({ ...sel }));
  recalc();
}

// ── NÚCLEO DO ATAQUE — mísseis no globo, baixas, relatório ancorado ────
// Compartilhado: tanto o painel da sua frota quanto o da esquadra inimiga chamam
// isto. Quem chama FECHA o cartão antes (nada fixo na tela durante o combate).
async function executarAtaqueNucleo({ fr, a, selecao, defesa, jogo, helpers, palco }) {
  const e = jogo.estado;
  if (poderDe(selecao) <= 0) return;
  const res = resolverBaixas(poderAtaqueDe(selecao, a.tipo), defesa);
  const coordAlvo = a.tipo === 'frota' ? { lat: a.frota.lat, lng: a.frota.lng }
    : a.tipo === 'estado' ? { lat: a.estado.lat, lng: a.estado.lng }
      : (helpers.ondeEsta?.(a.code) || { lat: fr.lat, lng: fr.lng });
  const origem = { lat: fr.lat, lng: fr.lng };
  const eu = e.iso || 'USA';
  const meuNome = PAISES[eu]?.nome || 'Sua Marinha';
  const iniNome = a.tipo === 'frota' ? `Esquadra de ${PAISES[a.frota.code]?.nome || a.frota.code}`
    : a.tipo === 'estado' ? `${a.estado.nome} · ${PAISES[a.estado.pais]?.nome || a.estado.pais}` : `${PAISES[a.code]?.nome || a.code}`;
  const codigoAlvo = a.tipo === 'frota' ? a.frota.code : a.tipo === 'estado' ? a.estado.pais : a.code;

  // todo ataque a não-parceiro é ato de guerra
  e.emGuerra = e.emGuerra || []; if (codigoAlvo && !e.emGuerra.includes(codigoAlvo)) e.emGuerra.push(codigoAlvo);
  const chave = PAISES[codigoAlvo]?.rel; if (chave) e[chave] = Math.max(-100, (e[chave] || 0) - 35);
  e.temp_guerra = Math.min(100, (e.temp_guerra || 0) + 14);

  await animarAtaqueNaval(helpers, origem, coordAlvo, { rounds: 4, revide: !res.venceu || res.perdaAtacantePct > 20 });
  helpers.ondaRadar?.(coordAlvo, { cor: res.venceu ? 0x22e0a0 : 0xff3b5c, max: 55 });

  // baixas SÓ nas unidades que participaram — e AGORA registradas na frota (fr.baixas)
  // pra o jogador ver DEPOIS, ao clicar no pino, o que aquele combate custou.
  const perdasMinhas = [];
  const registroBaixas = {};
  for (const [k, q] of Object.entries(selecao)) {
    if (!q) continue;
    const perdeu = Math.round(q * res.perdaAtacantePct / 100);
    if (perdeu > 0) {
      fr.unidades[k] = Math.max(0, (fr.unidades[k] || 0) - perdeu);
      if (!fr.unidades[k]) delete fr.unidades[k];
      perdasMinhas.push({ icone: UNIDADE_POR_ID[k]?.icone || '•', perdeu: perdeu.toLocaleString('pt-BR') });
      registroBaixas[k] = perdeu;
    }
  }
  if (Object.keys(registroBaixas).length) {
    fr.baixas = fr.baixas || [];
    fr.baixas.push({ contra: iniNome, perdas: registroBaixas, turno: e.turno || 0, venceu: res.venceu });
  }
  fr.presenca = Math.max(0, Math.round(forcaFrota(fr) * 10));
  const esvaziou = !Object.values(fr.unidades).some((q) => q > 0);
  if (esvaziou) { e.frotas = (e.frotas || []).filter((f) => f.id !== fr.id); if (fr.guarnKey) delete e.guarnicoes?.[fr.guarnKey]; }
  else if (fr.guarnKey && e.guarnicoes) e.guarnicoes[fr.guarnKey] = { ...fr.unidades };

  // efeito no alvo
  if (a.tipo === 'frota') {
    if (res.venceu) {
      e.frotasInimigas = (e.frotasInimigas || []).filter((f) => f.id !== a.frota.id);
      fr.abates = fr.abates || []; fr.abates.push({ nome: PAISES[a.frota.code]?.nome || a.frota.code, code: a.frota.code, poder: poderNaval(a.frota), turno: e.turno || 0 });
      helpers.balao?.(coordAlvo, '☠️ FROTA AFUNDADA', 'perda');
    } else {
      for (const k of Object.keys(a.frota.unidades || {})) { a.frota.unidades[k] = Math.max(0, Math.floor(a.frota.unidades[k] * (1 - res.perdaDefensorPct / 100))); if (!a.frota.unidades[k]) delete a.frota.unidades[k]; }
    }
  }

  jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Marinha', cor: res.venceu ? '#22e0a0' : '#ff3b5c',
    texto: res.venceu
      ? `${a.tipo === 'frota' ? '⚓' : '🎯'} ${meuNome} ${a.tipo === 'frota' ? 'afundou a esquadra de' : 'bombardeou'} ${iniNome}. Baixas suas: ${res.perdaAtacantePct}%.`
      : `☠️ O ataque de ${meuNome} contra ${iniNome} foi repelido. Baixas suas: ${res.perdaAtacantePct}%.` }]);
  // combate no mar É plantão — e o breaking ecoa no X sozinho
  dispararBreaking(jogo, {
    assunto: res.venceu
      ? (a.tipo === 'frota' ? `${meuNome} afunda esquadra de ${PAISES[codigoAlvo]?.nome || codigoAlvo}` : `${meuNome} bombardeia ${iniNome}`)
      : `Ataque naval de ${meuNome} é repelido por ${PAISES[codigoAlvo]?.nome || codigoAlvo}`,
    contexto: `Combate naval: baixas do atacante ${res.perdaAtacantePct}%, do defensor ${res.perdaDefensorPct}%.`,
    tom: 'quente', iso: codigoAlvo,
  });
  helpers.atualizar?.();
  mostrarRelatorioBaixas({ palco, telaDe: helpers.telaDe, coord: coordAlvo, venceu: res.venceu, meuNome, iniNome, res, perdasMinhas, alvoTipo: a.tipo });
}

// ═══════════════════════════════════════════════════════════════════════
// PAINEL DA SUA FROTA
// ═══════════════════════════════════════════════════════════════════════
export function abrirAcoesNaval(fr, jogo, helpers = {}) {
  if (document.querySelector('.nva-flut')) return;
  const e = jogo.estado;
  const u = fr.unidades || {};
  const dom = u.porta_avioes ? 'porta_avioes' : u.navios ? 'navios' : 'submarinos';
  const soSub = !u.navios && !u.porta_avioes && u.submarinos;
  const tech = techDaFrota(u);
  const equipTudo = equipamentosDoPais(e.iso || 'USA');
  const eq = equipTudo?.[dom];
  const foto = eq?.foto || FOTO_UNIDADE[dom];
  const nomeReal = eq?.nome || 'Força naval';
  const perto = (helpers.paisesProximos?.(fr) || []).slice(0, 3);
  const alvo = perto.find((p) => p.hostil) || perto[0] || null;

  const { modal, palco, fechar } = criarPainelAncorado(() => ({ lat: fr.lat, lng: fr.lng }), helpers, helpers.onFim);
  const abates = fr.abates || [];
  // BAIXAS acumuladas desta frota, agregadas por tipo — o "o que eu perdi" que faltava.
  const baixasTotais = {};
  for (const b of (fr.baixas || [])) for (const [k, q] of Object.entries(b.perdas || {})) baixasTotais[k] = (baixasTotais[k] || 0) + q;
  const temBaixas = Object.keys(baixasTotais).length > 0;

  modal.innerHTML = `<div class="nva-painel">
    <div class="nva-cab">
      <div class="nva-foto">${foto ? `<img src="${foto}" alt="" onerror="this.parentElement.innerHTML='${ico('ship', 22)}'">` : ico('ship', 22)}</div>
      <div class="nva-tit"><h2>${esc(nomeReal)}</h2><span>${Object.values(u).reduce((s, q) => s + (q || 0), 0).toLocaleString('pt-BR')} unidades a bordo</span></div>
      <button class="pp-fechar nva-x">${ico('x', 16)}</button>
    </div>
    <div class="nva-extra">
      <div class="nva-forca-hero">
        <div class="nva-fh-cel"><small>PODER NAVAL</small><b>${poderNaval(fr)}</b></div>
        <div class="nva-fh-cel"><small>PRESENÇA</small><b>${fr.presenca}</b></div>
        ${abates.length ? `<div class="nva-fh-cel abate"><small>ABATES</small><b>${abates.length}</b></div>` : ''}
        ${temBaixas ? `<div class="nva-fh-cel baixa"><small>BAIXAS</small><b>${Object.values(baixasTotais).reduce((s, q) => s + q, 0).toLocaleString('pt-BR')}</b></div>` : ''}
      </div>
      <div class="nva-barras">
        ${barra('Alcance', pctDe(tech.alcance, 40), classeAlcance(tech.alcance))}
        ${barra('Detecção', pctDe(tech.deteccao, 20), `radar ${classeDeteccao(tech.deteccao)}`)}
        ${barra('Furtividade', pctDe(tech.furtividade, 100), classeFurtiv(tech.furtividade) + (soSub ? ' 🥷' : ''), 'furtiva')}
      </div>
      <div class="nva-compo-rot">${ico('layout-grid', 10)} A BORDO</div>
      <div class="nva-compo">${gridCompo(u, e.iso || 'USA', baixasTotais) || `<span class="nva-vazio">frota vazia</span>`}</div>
      ${temBaixas ? `<div class="nva-baixas">${ico('heart-crack', 11)} <span>Já perdi: ${Object.entries(baixasTotais).map(([k, q]) => `${UNIDADE_POR_ID[k]?.icone || '•'} −${q.toLocaleString('pt-BR')}`).join(' · ')}</span></div>` : ''}
      ${abates.length ? `<div class="nva-abates" data-tip="Esquadras que esta frota afundou">${ico('skull', 11)} <span>${abates.length} abate${abates.length > 1 ? 's' : ''}: ${abates.map((a) => esc(a.nome)).join(', ')}</span></div>` : ''}
      ${alvo ? `<div class="nva-alvo ${alvo.hostil ? 'hostil' : alvo.parceiro ? 'amigo' : 'neutro'}">
        ${ico(alvo.hostil ? 'swords' : alvo.parceiro ? 'handshake' : 'radar', 14)}
        <span><b>${esc(alvo.nome)}</b> a ${alvo.d.toFixed(0)}° · relação ${alvo.rel} — ${alvo.hostil ? 'HOSTIL, um estopim' : alvo.parceiro ? 'parceiro, presença amistosa' : 'neutro, observando'}</span>
      </div>` : ''}
    </div>
    <div id="nva-corpo">
      <div class="nva-acoes">
        <button class="nva-btn mover" id="nva-mover">${ico('move', 15)} <span>Reposicionar<small>arraste o pino no globo</small></span></button>
        <button class="nva-btn atacar" id="nva-atacar">${ico('crosshair', 15)} <span>Iniciar ataque<small>varredura de radar: revela o que a frota enxerga</small></span></button>
        <button class="nva-btn casa" id="nva-casa">${ico('home', 15)} <span>Mandar de volta pra casa<small>libera as tropas e esfria o clima</small></span></button>
      </div>
    </div>
  </div>`;

  const painel = modal.querySelector('.nva-painel');
  // COMPACTO: em varredura/ataque, o dossiê (barras, a bordo, abates, vizinho) sai de
  // cena — sobra o cabeçalho e a decisão. Voltar ao menu principal restaura.
  const compacta = (liga) => painel.classList.toggle('compacta', liga);

  modal.querySelector('.nva-x').addEventListener('click', fechar);
  modal.querySelector('#nva-mover').addEventListener('click', fechar);
  if (helpers.alvoIso) setTimeout(() => modal.querySelector('#nva-atacar')?.click(), 120);

  modal.querySelector('#nva-casa').addEventListener('click', () => {
    recolherFrota(e, fr.id);
    e.temp_guerra = Math.max(0, (e.temp_guerra || 0) - 4);
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `Frota recolhida ao porto. Tropas de volta ao quartel e um grau a menos de tensão no mar.`, cor: '#22e0a0' }]);
    helpers.atualizar?.();
    fechar();
  });

  modal.querySelector('#nva-atacar')?.addEventListener('click', () => varrer());

  function colherAlvos() {
    const eu = e.iso || 'USA';
    const alvos = [];
    for (const v of frotasDetectadas([fr], e.frotasInimigas || [])) alvos.push({ tipo: 'frota', d: v.distancia, frota: v.frota });
    // estados costeiros no alcance (não-parceiros) agrupados por PAÍS
    const estados = todosEstados()
      .map((s) => ({ s, d: distGraus(s, fr) }))
      .filter((x) => x.d <= tech.alcance && x.s.pais !== eu && x.s.lat != null)
      .filter((x) => { const info = PAISES[x.s.pais]; return info && Number(e[info.rel] ?? 0) < 30; })
      .sort((a, b) => a.d - b.d);
    const porPais = new Map();
    for (const x of estados) { if (!porPais.has(x.s.pais)) porPais.set(x.s.pais, []); porPais.get(x.s.pais).push(x); }
    // Pra cada país alcançável: SEMPRE oferece "atacar o país inteiro (distribuído)" E as
    // cidades. Antes só aparecia um OU outro — o dono pediu os dois juntos.
    for (const [iso, lista] of porPais) {
      const dMin = Math.min(...lista.map((x) => x.d));
      const hostilPais = Number(e[PAISES[iso]?.rel] ?? 0) <= -20;
      alvos.push({ tipo: 'pais', d: dMin, code: iso, nEstados: lista.length, hostil: hostilPais });
      for (const x of lista.slice(0, 5)) alvos.push({ tipo: 'estado', d: x.d, estado: x.s, hostil: Number(e[PAISES[x.s.pais].rel] ?? 0) <= -20 });
    }
    // país hostil próximo SEM estado costeiro detectado (ilha, sem território carregado)
    if (alvo && alvo.hostil && !porPais.has(alvo.code)) alvos.push({ tipo: 'pais', d: alvo.d, code: alvo.code, nEstados: 0, hostil: true });
    return alvos.sort((a, b) => a.d - b.d);
  }

  function linhaAlvo(a, i) {
    const delay = `style="animation-delay:${(420 + i * 160)}ms"`;
    if (a.tipo === 'frota') {
      const nomeF = PAISES[a.frota.code]?.nome || a.frota.nome || a.frota.code;
      return `<button class="nvr-item frota" data-i="${i}" ${delay}>${ico('ship', 15)}
        <span><b>Esquadra de ${esc(nomeF)}</b><small>poder naval ${poderNaval(a.frota)} · escolha as unidades e ataque</small></span>
        <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
    }
    if (a.tipo === 'pais') {
      const nome = PAISES[a.code]?.nome || a.code;
      return `<button class="nvr-item pais ${a.hostil ? 'hostil' : 'neutro'}" data-i="${i}" ${delay}>${ico('swords', 15)}
        <span><b>Atacar ${esc(nome)} inteiro</b><small>${a.nEstados ? `bombardeio distribuído pelos ${a.nEstados} estados costeiros` : 'assalto ao litoral'}</small></span>
        <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
    }
    const nomeP = PAISES[a.estado.pais]?.nome || a.estado.pais;
    return `<button class="nvr-item cidade ${a.hostil ? 'hostil' : 'neutro'}" data-i="${i}" ${delay}>${ico('crosshair', 15)}
      <span><b>${esc(a.estado.nome)}</b><small>alvo pontual · ${esc(nomeP)}${a.hostil ? ' · hostil' : ''}</small></span>
      <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
  }

  function menuPrincipal() {
    compacta(false);
    const corpo = modal.querySelector('#nva-corpo');
    corpo.innerHTML = `<div class="nva-acoes">
      <button class="nva-btn mover" id="nva-mover2">${ico('move', 15)} <span>Reposicionar<small>arraste o pino no globo</small></span></button>
      <button class="nva-btn atacar" id="nva-atacar2">${ico('crosshair', 15)} <span>Iniciar ataque<small>varredura de radar</small></span></button>
      <button class="nva-btn casa" id="nva-casa2">${ico('home', 15)} <span>Voltar pra casa<small>libera as tropas</small></span></button>
    </div>`;
    corpo.querySelector('#nva-mover2').addEventListener('click', fechar);
    corpo.querySelector('#nva-atacar2').addEventListener('click', () => varrer());
    corpo.querySelector('#nva-casa2').addEventListener('click', () => { recolherFrota(e, fr.id); helpers.atualizar?.(); fechar(); });
  }

  function varrer() {
    compacta(true);
    helpers.ondaRadar?.({ lat: fr.lat, lng: fr.lng }, { cor: 0x35e0ff, max: 40 });
    const corpo = modal.querySelector('#nva-corpo');
    const alvos = colherAlvos();
    corpo.innerHTML = `<div class="nvr-scan">
      <div class="nvr-radar"><i class="nvr-anel"></i><i class="nvr-anel a2"></i><i class="nvr-sweep"></i></div>
      <div class="nvr-status" id="nvr-status">VARRENDO O MAR…</div>
      <div class="nvr-lista">${alvos.map((a, i) => linhaAlvo(a, i)).join('')}</div>
      <button class="nvu-voltar nvr-voltar" id="nvr-menu">${ico('arrow-left', 12)} voltar</button>
    </div>`;
    corpo.querySelector('#nvr-menu').addEventListener('click', () => menuPrincipal());
    setTimeout(() => {
      if (!modal.isConnected) return;
      const st = modal.querySelector('#nvr-status'); const radar = modal.querySelector('.nvr-radar');
      radar?.classList.add('fim');
      if (alvos.length) { if (st) st.textContent = `${alvos.length} CONTATO${alvos.length > 1 ? 'S' : ''} — ESCOLHA O ALVO`; }
      else {
        if (st) st.textContent = 'VARREDURA CONCLUÍDA';
        modal.querySelector('.nvr-scan')?.insertAdjacentHTML('beforeend',
          `<div class="nvr-vazio">Mar vazio no alcance. Aproxime a frota e varra de novo.</div>
           <button class="nvr-acao" id="nvr-refazer">${ico('radar', 13)} VARRER DE NOVO</button>`);
        modal.querySelector('#nvr-refazer')?.addEventListener('click', () => varrer());
      }
    }, 1500);
    corpo.querySelectorAll('.nvr-item').forEach((btn) => btn.addEventListener('click', () => {
      const a = alvos[Number(btn.dataset.i)];
      if (a) telaAtaque(a);
    }));
  }

  function defesaDe(a) {
    if (a.tipo === 'frota') return Math.max(0.05, forcaFrota(a.frota));
    if (a.tipo === 'estado') return Math.max(0.5, guarnicaoDefensiva(e, a.estado.id));
    // país inteiro: defesa costeira consolidada (maior que uma cidade só)
    return Math.max(0.5, forcaDe(e, a.code) * 0.3);
  }
  function nomeAlvo(a) {
    if (a.tipo === 'frota') return `Esquadra de ${PAISES[a.frota.code]?.nome || a.frota.code}`;
    if (a.tipo === 'estado') return `${a.estado.nome} · ${PAISES[a.estado.pais]?.nome || a.estado.pais}`;
    return `${PAISES[a.code]?.nome || a.code} (país inteiro)`;
  }

  function telaAtaque(a) {
    compacta(true);
    const defesa = defesaDe(a);
    renderSeletorForca(modal.querySelector('#nva-corpo'), {
      minhaU: u, isoMeu: e.iso || 'USA', alvoNome: nomeAlvo(a), defesa, tipoAlvo: a.tipo,
      onVoltar: () => varrer(),
      onAtacar: (selecao) => { fechar(); executarAtaqueNucleo({ fr, a, selecao, defesa, jogo, helpers, palco }); },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PAINEL DA FROTA INIMIGA — mesmo cartão, do outro lado do periscópio
// ═══════════════════════════════════════════════════════════════════════
// `atacante` é a SUA esquadra em alcance (globo.js resolve a mais próxima) —
// null quando nenhuma alcança: o ataque desabilita com o motivo na cara.
export function abrirAcoesFrotaInimiga(fi, atacante, jogo, helpers = {}) {
  if (document.querySelector('.nva-flut')) return;
  const e = jogo.estado;
  const uI = fi.unidades || {};
  const domI = uI.porta_avioes ? 'porta_avioes' : uI.navios ? 'navios' : 'submarinos';
  const equipI = equipamentosDoPais(fi.code);
  const fotoI = equipI?.[domI]?.foto || FOTO_UNIDADE[domI];
  const nomeIni = PAISES[fi.code]?.nome || fi.nome || fi.code;

  const { modal, palco, fechar } = criarPainelAncorado(() => ({ lat: fi.lat, lng: fi.lng }), helpers, helpers.onFim);

  modal.innerHTML = `<div class="nva-painel inimiga">
    <div class="nva-cab">
      <div class="nva-foto">${fotoI ? `<img src="${fotoI}" alt="" onerror="this.parentElement.innerHTML='${ico('ship', 22)}'">` : ico('ship', 22)}</div>
      <div class="nva-tit"><h2>Esquadra de ${esc(nomeIni)}</h2><span class="hostil">FORÇA HOSTIL · poder naval ${poderNaval(fi)}</span></div>
      <button class="pp-fechar nva-x">${ico('x', 16)}</button>
    </div>
    <div class="nva-extra">
      <div class="nva-compo-rot">${ico('layout-grid', 10)} A BORDO (DELES)</div>
      <div class="nva-compo">${gridCompo(uI, fi.code) || `<span class="nva-vazio">composição desconhecida</span>`}</div>
    </div>
    <div id="nva-corpo">
      <div class="nva-acoes">
        <button class="nva-btn atacar" id="nvi-atacar" ${atacante ? '' : 'disabled'}>${ico('crosshair', 15)}
          <span>Atacar<small>${atacante ? 'escolha a força da sua esquadra' : 'nenhuma esquadra sua no alcance — aproxime uma frota'}</small></span></button>
        <button class="nva-btn intimar" id="nvi-intimar">${ico('hand', 15)} <span>Intimar a recuar<small>rádio aberto — eles podem obedecer ou mandar você àquele lugar</small></span></button>
      </div>
    </div>
  </div>`;

  const painel = modal.querySelector('.nva-painel');
  modal.querySelector('.nva-x').addEventListener('click', fechar);

  // ATACAR → tela de força (compacta), usando as unidades da SUA esquadra em alcance
  modal.querySelector('#nvi-atacar')?.addEventListener('click', () => {
    if (!atacante) return;
    painel.classList.add('compacta');
    const a = { tipo: 'frota', d: 0, frota: fi };
    const defesa = Math.max(0.05, forcaFrota(fi));
    renderSeletorForca(modal.querySelector('#nva-corpo'), {
      minhaU: atacante.unidades || {}, isoMeu: e.iso || 'USA',
      alvoNome: `Esquadra de ${nomeIni}`, defesa, tipoAlvo: 'frota',
      onVoltar: () => { painel.classList.remove('compacta'); modal.querySelector('#nva-corpo').innerHTML = ''; fechar(); abrirAcoesFrotaInimiga(fi, atacante, jogo, helpers); },
      onAtacar: (selecao) => { fechar(); executarAtaqueNucleo({ fr: atacante, a, selecao, defesa, jogo, helpers, palco }); },
    });
  });

  // INTIMAR → o rádio aberto: balões trocando provocações entre os dois pinos
  modal.querySelector('#nvi-intimar').addEventListener('click', async () => {
    fechar();   // a cena é no globo, não no cartão
    const minha = atacante ? { lat: atacante.lat, lng: atacante.lng } : (helpers.ondeEsta?.(e.iso || 'USA') || { lat: fi.lat, lng: fi.lng });
    const obedece = atacante ? poderNaval(atacante) >= poderNaval(fi) * 0.9 : false;
    await encenarIntimacao(helpers, minha, { lat: fi.lat, lng: fi.lng }, obedece);
    if (obedece) {
      const dx = fi.lng - minha.lng, dy = fi.lat - minha.lat; const n = Math.hypot(dx, dy) || 1;
      fi.lat += (dy / n) * 6; fi.lng += (dx / n) * 6;
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Marinha', cor: '#22e0a0', texto: `A esquadra de ${nomeIni} engoliu o orgulho e se afastou. Presença fala mais alto que tiro.` }]);
    } else {
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Marinha', cor: '#ffb020', texto: `${nomeIni} respondeu à intimação com deboche — a esquadra deles não arreda. Reforce ou ataque.` }]);
    }
    // o bate-boca no rádio vira notícia (e post no X, via breaking)
    dispararBreaking(jogo, {
      assunto: obedece ? `Esquadra de ${nomeIni} recua após ultimato no mar` : `${nomeIni} desafia ultimato naval`,
      contexto: obedece
        ? `Rádio aberto: a intimação funcionou e a esquadra levantou âncora resmungando. Dissuasão sem um tiro.`
        : `A ponte inimiga respondeu ao ultimato com insultos e ficou onde estava. O mar segue tenso.`,
      tom: obedece ? 'tenso' : 'quente', iso: fi.code,
    });
    helpers.atualizar?.();
  });
}
