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
import { tocarEfeito } from './audio.js';

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
    const perdeu = baixas?.[k] || 0;   // as perdas moram no TIP, não em badge sobre o chip
    return `<div class="nva-cu" data-tip="${esc(nome)}${perdeu ? ` · já perdi ${perdeu.toLocaleString('pt-BR')}` : ''}">
      <span class="nva-cu-foto"><i class="nva-cu-ico">${UNIDADE_POR_ID[k]?.icone || '•'}</i>${fk ? `<img src="${fk}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>
      <b>${unidades[k].toLocaleString('pt-BR')}</b><small>${esc(nome)}</small></div>`;
  }).join('');
}

// ── TELA DE ATAQUE — a FROTA INTEIRA vai junto ─────────────────────────
// O dono voltou atrás nos sliders (com razão): uma força-tarefa no mar não deixa
// metade da esquadra "de fora" — quem ataca é o grupo de batalha completo. A tela
// agora só APRESENTA a força (veículos + quantidades) e o confronto, e o botão
// ATACAR compromete tudo. Menos decisão burocrática, mais peso na decisão real.
function renderSeletorForca(corpo, { minhaU, isoMeu, alvoNome, defesa, tipoAlvo, onVoltar, onAtacar }) {
  const equip = equipamentosDoPais(isoMeu);
  const combatentes = COMPO_ORDEM.filter((k) => (minhaU[k] || 0) > 0);
  const sel = {};
  for (const k of combatentes) sel[k] = minhaU[k];

  const linhaU = (k) => {
    const eqk = equip?.[k]; const fk = eqk?.foto || FOTO_UNIDADE[k];
    return `<div class="nvu-item so-mostra" data-u="${k}">
      <span class="nvu-foto"><i class="nva-cu-ico">${UNIDADE_POR_ID[k]?.icone || '•'}</i>${fk ? `<img src="${fk}" alt="" onerror="this.remove()">` : ''}</span>
      <span class="nvu-nome">${esc(eqk?.nome || UNIDADE_POR_ID[k]?.nome || k)}</span>
      <b class="nvu-q">×${minhaU[k].toLocaleString('pt-BR')}</b>
    </div>`;
  };

  const poder = poderAtaqueDe(sel, tipoAlvo);
  const prev = resolverBaixas(poder, defesa);
  const cls = prev.venceu ? (prev.perdaAtacantePct < 25 ? 'esmaga' : 'vence') : 'perde';
  const veredito = prev.venceu ? (prev.perdaAtacantePct < 25 ? 'VITÓRIA FOLGADA' : 'VITÓRIA, MAS CUSTA') : 'ARRISCADO';

  corpo.innerHTML = `<div class="nvu-sel">
    <div class="nvu-alvo">${ico('crosshair', 12)} <b>${esc(alvoNome)}</b></div>
    <div class="nvu-rot">${ico('anchor', 10)} FORÇA-TAREFA COMPLETA</div>
    <div class="nvu-lista">${combatentes.map(linhaU).join('')}</div>
    <div class="nvu-confronto ${cls}">
      <div class="nvu-lado"><small>SEU ATAQUE</small><b>${Math.round(poder)}</b></div>
      <div class="nvu-vs">${ico('swords', 14)}</div>
      <div class="nvu-lado"><small>DEFESA</small><b>${Math.round(defesa)}</b></div>
    </div>
    <div class="nvu-veredito ${cls}">${ico(prev.venceu ? 'trending-up' : 'trending-down', 12)} ${veredito} <em>· baixas previstas ~${prev.perdaAtacantePct}%</em></div>
    <div class="nvu-acoes">
      <button class="nvu-voltar" id="nvu-voltar">${ico('arrow-left', 13)} voltar</button>
      <button class="nvu-atacar" id="nvu-atacar" ${combatentes.length ? '' : 'disabled'}>${ico('rocket', 14)} ATACAR</button>
    </div>
  </div>`;

  corpo.querySelector('#nvu-voltar').addEventListener('click', onVoltar);
  corpo.querySelector('#nvu-atacar').addEventListener('click', () => onAtacar({ ...sel }));
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
    : a.tipo === 'estado' ? `${a.estado.nome} · ${PAISES[a.estado.pais]?.nome || a.estado.pais}` : `${a.nome || PAISES[a.code]?.nome || a.code}`;
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

  // efeito no alvo — o bombardeio DEIXA MARCA no território, no MESMO registro da
  // ofensiva terrestre (conflitosEstado + guarnição dizimada). É o que integra os dois
  // caminhos: o mapa de estados mostra o estrago venha ele do mar ou da campanha.
  if (a.tipo === 'estado' && res.venceu) {
    const id = a.estado.id;
    e.conflitosEstado = e.conflitosEstado || {};
    const c = e.conflitosEstado[id] || { por: eu, intensidade: 0, turnos: 0 };
    c.por = eu; c.intensidade = Math.min(100, (c.intensidade || 0) + 30);
    e.conflitosEstado[id] = c;
    const g = e.guarnicoes?.[id];
    if (g) for (const k of Object.keys(g)) { g[k] = Math.max(0, Math.floor((g[k] || 0) * (1 - res.perdaDefensorPct / 100))); if (!g[k]) delete g[k]; }
  }
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
        <div class="nva-fh-cel abate" data-tip="${abates.length ? esc(`Esquadras afundadas: ${abates.map((a) => a.nome).join(', ')}`) : 'Nenhuma esquadra afundada ainda'}" data-tip-t="ABATES"><small>ABATES</small><b>${abates.length}</b></div>
        <div class="nva-fh-cel baixa" data-tip="${temBaixas ? esc(`Já perdi: ${Object.entries(baixasTotais).map(([k, q]) => `${UNIDADE_POR_ID[k]?.nome || k} −${q.toLocaleString('pt-BR')}`).join(' · ')}`) : 'Nenhuma baixa nesta frota'}" data-tip-t="BAIXAS"><small>BAIXAS</small><b>${temBaixas ? Object.values(baixasTotais).reduce((s, q) => s + q, 0).toLocaleString('pt-BR') : 0}</b></div>
      </div>
      <div class="nva-barras">
        ${barra('Alcance', pctDe(tech.alcance, 40), classeAlcance(tech.alcance))}
        ${barra('Detecção', pctDe(tech.deteccao, 20), `radar ${classeDeteccao(tech.deteccao)}`)}
        ${barra('Furtividade', pctDe(tech.furtividade, 100), classeFurtiv(tech.furtividade) + (soSub ? ' 🥷' : ''), 'furtiva')}
      </div>
      <div class="nva-compo-rot">${ico('layout-grid', 10)} A BORDO</div>
      <div class="nva-compo">${gridCompo(u, e.iso || 'USA', baixasTotais) || `<span class="nva-vazio">frota vazia</span>`}</div>
      ${alvo ? `<div class="nva-alvo ${alvo.hostil ? 'hostil' : alvo.parceiro ? 'amigo' : 'neutro'}">
        ${ico(alvo.hostil ? 'swords' : alvo.parceiro ? 'handshake' : 'radar', 14)}
        <span><b>${esc(alvo.nome)}</b> a ${alvo.d.toFixed(0)}° · relação ${alvo.rel} — ${alvo.hostil ? 'HOSTIL, um estopim' : alvo.parceiro ? 'parceiro, presença amistosa' : 'neutro, observando'}</span>
      </div>` : ''}
    </div>
    <div id="nva-corpo">
      <div class="nva-acoes">
        <button class="nva-btn atacar" id="nva-atacar">${ico('crosshair', 15)} <span>Iniciar ataque<small>varredura: países e esquadras no alcance</small></span></button>
        <button class="nva-btn sonar" id="nva-sonar">${ico('radar', 15)} <span>Sonar<small>só embarcações — navios, submarinos, esquadras</small></span></button>
        <button class="nva-btn casa" id="nva-casa">${ico('home', 15)} <span>Mandar de volta pra casa<small>a frota navega até o porto e só então recolhe</small></span></button>
      </div>
    </div>
  </div>`;

  const painel = modal.querySelector('.nva-painel');
  // COMPACTO: em varredura/ataque, o dossiê (barras, a bordo, abates, vizinho) sai de
  // cena — sobra o cabeçalho e a decisão. Voltar ao menu principal restaura.
  const compacta = (liga) => painel.classList.toggle('compacta', liga);

  modal.querySelector('.nva-x').addEventListener('click', fechar);
  if (helpers.alvoIso) setTimeout(() => modal.querySelector('#nva-atacar')?.click(), 120);

  // CASA: nada de sumir no clique — a frota NAVEGA até o porto (globo anima a rota)
  // e é recolhida quando ATRACA. Fallback: sem helper, recolhe direto como antes.
  const mandarPraCasa = () => {
    if (helpers.voltarPraCasa) helpers.voltarPraCasa(fr);
    else {
      recolherFrota(e, fr.id);
      e.temp_guerra = Math.max(0, (e.temp_guerra || 0) - 4);
      helpers.atualizar?.();
    }
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `Ordem dada: a frota levantou âncora rumo ao porto de origem.`, cor: '#35e0ff' }]);
    fechar();
  };
  modal.querySelector('#nva-casa').addEventListener('click', mandarPraCasa);

  modal.querySelector('#nva-atacar')?.addEventListener('click', () => varrer());
  modal.querySelector('#nva-sonar')?.addEventListener('click', () => varrer('sonar'));

  // O RADAR DETECTA PAÍSES, não listas de cidades. A varredura mostra frotas e as
  // NAÇÕES no alcance (por proximidade REAL — a costa de Cuba a 3° aparece; as cidades
  // do Brasil a 20° não vazam mais na lista). Clicar no país é que abre as cidades
  // dele — carregando o território sob demanda, como o globo faz.
  function colherAlvos() {
    const eu = e.iso || 'USA';
    const alvos = [];
    for (const v of frotasDetectadas([fr], e.frotasInimigas || [])) alvos.push({ tipo: 'frota', d: v.distancia, frota: v.frota });
    // países no alcance por proximidade geográfica de verdade (litoral/capital),
    // independente do catálogo de estados já ter sido carregado ou não
    for (const p of (helpers.paisesProximos?.(fr) || [])) {
      if (p.d > tech.alcance || p.parceiro) continue;
      alvos.push({ tipo: 'pais', d: p.d, code: p.code, nome: p.nome, hostil: p.hostil });
    }
    return alvos.sort((a, b) => a.d - b.d);
  }

  function linhaAlvo(a, i) {
    const delay = `style="animation-delay:${(420 + i * 160)}ms"`;
    if (a.tipo === 'frota') {
      const nomeF = PAISES[a.frota.code]?.nome || a.frota.nome || a.frota.code;
      return `<button class="nvr-item frota" data-i="${i}" ${delay}>${ico('ship', 15)}
        <span><b>Esquadra de ${esc(nomeF)}</b><small>poder naval ${poderNaval(a.frota)} · engajar</small></span>
        <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
    }
    const nome = a.nome || PAISES[a.code]?.nome || a.code;
    return `<button class="nvr-item pais ${a.hostil ? 'hostil' : 'neutro'}" data-i="${i}" ${delay}>${ico(a.hostil ? 'swords' : 'radar', 15)}
      <span><b>${esc(nome)}</b><small>${a.hostil ? 'hostil · ' : ''}clique para abrir o país inteiro ou as cidades</small></span>
      <em class="nvr-d">${a.d.toFixed(0)}°</em></button>`;
  }

  // Sub-lista de um país detectado: PAÍS INTEIRO no topo + as cidades costeiras no
  // alcance. O território carrega aqui, na hora — a Venezuela não precisa ter sido
  // "visitada" antes pra virar alvo.
  async function telaCidades(a) {
    const corpo = modal.querySelector('#nva-corpo');
    const nome = a.nome || PAISES[a.code]?.nome || a.code;
    corpo.innerHTML = `<div class="nvr-scan"><div class="nvr-status">${ico('loader', 12)} ABRINDO CARTAS DE ${esc(nome).toUpperCase()}…</div></div>`;
    await helpers.carregarPais?.(a.code);
    if (!modal.isConnected) return;
    const cidades = todosEstados()
      .filter((s) => s.pais === a.code && s.lat != null)
      .map((s) => ({ s, d: distGraus(s, fr) }))
      .filter((x) => x.d <= tech.alcance)
      .sort((x, y) => x.d - y.d)
      .slice(0, 8);
    const subAlvos = [
      { tipo: 'pais', d: a.d, code: a.code, nome: a.nome, hostil: a.hostil },
      ...cidades.map((x) => ({ tipo: 'estado', d: x.d, estado: x.s, hostil: a.hostil })),
    ];
    corpo.innerHTML = `<div class="nvr-scan">
      <div class="nvr-status">${esc(nome).toUpperCase()} — PAÍS INTEIRO OU ALVO PONTUAL</div>
      <div class="nvr-lista">
        <button class="nvr-item pais ${a.hostil ? 'hostil' : 'neutro'}" data-i="0">${ico('swords', 15)}
          <span><b>Atacar ${esc(nome)} inteiro</b><small>bombardeio distribuído pelo litoral</small></span>
          <em class="nvr-d">${a.d.toFixed(0)}°</em></button>
        ${cidades.map((x, i) => `<button class="nvr-item cidade ${a.hostil ? 'hostil' : 'neutro'}" data-i="${i + 1}">${ico('crosshair', 15)}
          <span><b>${esc(x.s.nome)}</b><small>alvo pontual</small></span>
          <em class="nvr-d">${x.d.toFixed(0)}°</em></button>`).join('')}
        ${!cidades.length ? `<div class="nvr-vazio">Nenhuma cidade costeira no alcance — só o assalto ao litoral.</div>` : ''}
      </div>
      <button class="nvu-voltar nvr-voltar" id="nvr-volta-paises">${ico('arrow-left', 12)} voltar aos contatos</button>
    </div>`;
    corpo.querySelectorAll('.nvr-item').forEach((btn) => btn.addEventListener('click', () => {
      const s = subAlvos[Number(btn.dataset.i)];
      if (s) telaAtaque(s);
    }));
    corpo.querySelector('#nvr-volta-paises').addEventListener('click', () => varrer());
  }

  function menuPrincipal() {
    compacta(false);
    const corpo = modal.querySelector('#nva-corpo');
    corpo.innerHTML = `<div class="nva-acoes">
      <button class="nva-btn atacar" id="nva-atacar2">${ico('crosshair', 15)} <span>Iniciar ataque<small>varredura: países e esquadras</small></span></button>
      <button class="nva-btn sonar" id="nva-sonar2">${ico('radar', 15)} <span>Sonar<small>só embarcações</small></span></button>
      <button class="nva-btn casa" id="nva-casa2">${ico('home', 15)} <span>Voltar pra casa<small>navega até o porto</small></span></button>
    </div>`;
    corpo.querySelector('#nva-atacar2').addEventListener('click', () => varrer());
    corpo.querySelector('#nva-sonar2').addEventListener('click', () => varrer('sonar'));
    corpo.querySelector('#nva-casa2').addEventListener('click', mandarPraCasa);
  }

  // modo 'ataque' (default): países + esquadras no alcance. modo 'sonar': SÓ embarcações
  // — a escuta do mar. Submarino furtivo é a condição especial: só aparece se a sua
  // detecção vencer a furtividade dele (regra de frotasDetectadas); senão, nem no sonar.
  function varrer(modo = 'ataque') {
    compacta(true);
    tocarEfeito('radar');   // o som da varredura — o radar girando sobre o mar
    helpers.ondaRadar?.({ lat: fr.lat, lng: fr.lng }, { cor: modo === 'sonar' ? 0x22e0a0 : 0x35e0ff, max: 40 });
    const corpo = modal.querySelector('#nva-corpo');
    const alvos = modo === 'sonar' ? colherAlvos().filter((a) => a.tipo === 'frota') : colherAlvos();
    corpo.innerHTML = `<div class="nvr-scan">
      <div class="nvr-radar"><i class="nvr-anel"></i><i class="nvr-anel a2"></i><i class="nvr-sweep"></i></div>
      <div class="nvr-status" id="nvr-status">${modo === 'sonar' ? 'SONAR ATIVO — ESCUTANDO O MAR…' : 'VARRENDO O MAR…'}</div>
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
        if (st) st.textContent = modo === 'sonar' ? 'SONAR LIMPO' : 'VARREDURA CONCLUÍDA';
        modal.querySelector('.nvr-scan')?.insertAdjacentHTML('beforeend',
          `<div class="nvr-vazio">${modo === 'sonar'
            ? `Nenhuma embarcação no alcance de escuta (detecção ${tech.deteccao}). Submarinos furtivos podem estar aí — sem detecção forte, o sonar não os pega.`
            : 'Mar vazio no alcance. Aproxime a frota e varra de novo.'}</div>
           <button class="nvr-acao" id="nvr-refazer">${ico('radar', 13)} VARRER DE NOVO</button>`);
        modal.querySelector('#nvr-refazer')?.addEventListener('click', () => varrer(modo));
      }
    }, 1500);
    corpo.querySelectorAll('.nvr-item').forEach((btn) => btn.addEventListener('click', () => {
      const a = alvos[Number(btn.dataset.i)];
      if (!a) return;
      if (a.tipo === 'pais') telaCidades(a);   // país detectado → abre país inteiro OU cidades
      else telaAtaque(a);                       // frota → engaja direto
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
    return `${a.nome || PAISES[a.code]?.nome || a.code} (país inteiro)`;
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
