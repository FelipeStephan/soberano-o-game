// ═══════════════════════════════════════════════════════════════════════
// ONLINE — as interações entre humanos, em tempo real
// ═══════════════════════════════════════════════════════════════════════
// Modelo em docs/ONLINE.md. Este módulo é a ponte entre a sala (net/lobby.js) e o
// jogo: quando OUTRO humano age contra você, o golpe chega AGORA — vira post no X,
// balão no globo, e, se for guerra, dispara o MODO DEFESA. É o coração da ansiedade
// online: você não espera turno pra sentir que alguém se moveu.
//
// Também expõe o caminho de SAÍDA: quando VOCÊ age sobre um país controlado por um
// humano, o jogo chama notificar() e o alvo recebe o alerta.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { abrirDefesa } from './defesa.js';
import { alertaUrgente } from './efeitos.js';
import { breakingRemoto } from './breaking.js';
import { tentarIntervencao } from '../jogo/intervencaoConflito.js';
import { techDaFrota } from '../dados/forcas.js';
import { tocarEfeito } from './audio.js';
import { offsetServidor } from '../net/lobby.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;

// Como cada tipo de evento se anuncia: cor, se é urgente (banner INCOMING), e o verbo.
const ESTILO = {
  guerra:     { cor: '#ff3b5c', urgente: true,  rot: 'DECLAROU GUERRA', ic: 'swords' },
  ataque_estado: { cor: '#ff3b5c', urgente: true, rot: 'ATACOU SEU TERRITÓRIO', ic: 'crosshair' },
  naval:      { cor: '#35e0ff', urgente: true,  rot: 'ATAQUE NAVAL', ic: 'ship' },
  nuclear:    { cor: '#ff3b5c', urgente: true,  rot: 'LANÇAMENTO NUCLEAR', ic: 'radiation' },
  sancao:     { cor: '#ffb020', urgente: false, rot: 'IMPÔS SANÇÕES', ic: 'ban' },
  mediacao:   { cor: '#35e0ff', urgente: false, rot: 'MEDIA UM CONFLITO', ic: 'handshake' },
  espionagem: { cor: '#b98cff', urgente: false, rot: 'OPERAÇÃO DE ESPIONAGEM', ic: 'eye' },
  alianca:    { cor: '#22e0a0', urgente: true,  rot: 'PROPÔS ALIANÇA', ic: 'handshake' },
  comercio:   { cor: '#22e0a0', urgente: true,  rot: 'PROPÔS ACORDO COMERCIAL', ic: 'coins' },
  ajuda:      { cor: '#22e0a0', urgente: false, rot: 'ENVIOU AJUDA', ic: 'heart-handshake' },
  resposta:   { cor: '#35e0ff', urgente: false, rot: 'RESPONDEU', ic: 'reply' },
};

export function ligarOnline(jogo, net, hooks) {
  const meuIso = jogo.estado.iso || jogo.ficha?.iso;
  let jogadores = [];                 // [{ id, nome, pais, host }]
  const porPais = new Map();          // iso → jogador (quem é humano)

  const badge = hooks.container?.querySelector('#online-badge');

  // Recalcula quem é humano a partir de uma lista de jogadores da sala.
  function absorverJogadores(lista) {
    jogadores = (lista || []).filter((j) => j.pais);
    porPais.clear();
    for (const j of jogadores) if (j.pais && j.pais !== meuIso) porPais.set(j.pais, j);
    pintarBadge();
  }

  // BUG QUE ISTO CONSERTA: quem ENTRAVA por último no jogo começava com jogadores=[]
  // e só populava no PRÓXIMO broadcast de sala — que nunca vinha se ninguém mais mexia.
  // Resultado: o convidado não "via" o host como humano (sem botão de contato, ligação
  // só funcionava num sentido). O cliente do lobby JÁ guarda o último roster em
  // net.estado().jogadores — semeamos dele na hora de ligar.
  absorverJogadores(net.estado().jogadores);

  function pintarBadge() {
    if (!badge) return;
    const est = net.estado();
    const n = jogadores.length;
    badge.innerHTML = `${ico('users', 12)} <b>${n}</b> na sala${est.sala ? ` · <span class="ob-sala">${esc(est.sala)}</span>` : ''}`;
    badge.classList.add('online-ativo');
  }

  function humano(iso) { return porPais.get(iso) || null; }

  // ── EVENTO CHEGANDO de outro humano ────────────────────────────────
  function receber(ev) {
    if (!ev || ev.dePais === meuIso) return;   // ignora eco do próprio
    // MUNDO COMPARTILHADO: o host é a autoridade do "mundo ao vivo". Ele retransmite os
    // posts do X, plantões e o período; os convidados APLICAM (em vez de gerar os seus,
    // que divergiam). Assim a sala inteira vê a MESMA timeline e o mesmo relógio.
    if (ev.tipo === 'mundo') { aplicarMundo(ev.dados || {}); return; }
    // A BATIDA do host: o convidado avança o próprio mês em sincronia e aplica o
    // mundo compartilhado (Brent, guerras NPC, pandemias). É o coração do mundo único.
    if (ev.tipo === 'beat') { hooks.aoBeatHost?.(ev.dados || {}); return; }
    // FROTA de outro jogador no mar: aparece no SEU globo (e some quando recolhe).
    if (ev.tipo === 'frota_pos') { upsertFrotaHumana(ev); return; }
    if (ev.tipo === 'frota_out') { removerFrotaHumana(ev); return; }
    // RESULTADO DE COMBATE NAVAL: o dono da frota atacada SENTE o golpe (afundou/
    // baixas) e todos removem o pino — acabou o "navio fantasma".
    if (ev.tipo === 'naval_resultado') { aplicarResultadoNaval(ev); return; }
    // CONQUISTA TERRITORIAL: os estados atingidos mudam de dono/entram em conflito
    // no mapa de TODOS — o atacado vê o próprio território marcado, como o atacante.
    if (ev.tipo === 'guerra_resultado') { aplicarImpactoTerritorial(ev); return; }
    // PLANTÃO de outro jogador: o mesmo breaking, o mesmo texto, na tela de todos.
    if (ev.tipo === 'breaking') { breakingRemoto(jogo, ev.dados || {}); return; }
    // MEDIAÇÃO: a diplomacia de um jogador MOVE o conflito da sala — o host aplica os
    // pontos no mundo autoritativo e a próxima batida espalha o avanço pra todos.
    if (ev.tipo === 'mediacao' && ev.dados?.conflitoId && net.estado().host) {
      try { tentarIntervencao(jogo.estado, ev.dados.conflitoId, ev.dados.frente || 'mediar'); } catch { /* conflito já acabou */ }
    }
    // Ataque a UM estado: o território atingido marca no mapa de todos (e segue
    // para o fluxo normal — alerta/Modo Defesa se o alvo for você).
    if (ev.tipo === 'ataque_estado' && ev.dados?.estadoId) {
      aplicarImpactoTerritorial({ ...ev, dados: { caem: ev.dados.tomou ? [ev.dados.estadoId] : [], conflito: [ev.dados.estadoId] } }, { silencioso: true });
    }
    const est = ESTILO[ev.tipo] || { cor: '#7488ad', urgente: false, rot: (ev.tipo || 'AGIU').toUpperCase(), ic: 'radio' };
    const origem = ev.deNome ? `${ev.deNome} (${nomeDe(ev.dePais)})` : nomeDe(ev.dePais);

    // 1) sempre vira notícia no X — é o feed compartilhado da sala. Marcado com o país
    //    de origem pra o filtro (Minha Nação × World Trends) funcionar.
    jogo._empilharFeed?.([{
      tipo: 'jogador', handle: origem, paisOrigem: ev.dePais, paisAlvo: ev.alvo || null,
      texto: ev.texto || `${est.rot.toLowerCase()}`, cor: est.cor,
    }]);
    hooks.renderFeed?.();

    // 2) O ATAQUE APARECE NO GLOBO DE TODOS: linha + mísseis do agressor ao alvo
    //    (som só se o alvo for VOCÊ — guerra alheia anima muda). Balão em quem agiu.
    const g = hooks.globoCtrl?.();
    if (g && (ev.tipo === 'guerra' || ev.tipo === 'ataque_estado' || ev.tipo === 'naval' || ev.tipo === 'nuclear')) {
      const de = ev.dados?.de || g.ondeEsta?.(ev.dePais);
      const para = ev.dados?.para || (ev.alvo ? g.ondeEsta?.(ev.alvo) : null);
      if (de && para) {
        g.desenharLinha?.(para, 'ataque', 9000, de);
        g.salvaMisseis?.(para, ev.tipo === 'nuclear' ? 1 : 3, de, { som: ev.alvo === meuIso });
        g.ondaRadar?.(para, { cor: ev.tipo === 'nuclear' ? 0xff3b5c : 0xffb020, max: 45 });
      }
    }
    g?.balao?.(g.ondeEsta?.(ev.dePais), ev.texto || est.rot, est.urgente ? 'ruim' : 'aviso');

    // 3) se a bomba é COM VOCÊ, alerta urgente — e, se for guerra/ataque, MODO DEFESA
    if (ev.paraVoce || ev.alvo === meuIso) {
      if (ev.tipo === 'guerra' || ev.tipo === 'ataque_estado') {
        alertaUrgente({ titulo: 'VOCÊ ESTÁ SOB ATAQUE', texto: `${ev.deNome || nomeDe(ev.dePais)} lançou uma ofensiva contra você.`, tom: 'ataque' });
        abrirDefesa(jogo, {
          agressor: { iso: ev.dePais, nome: ev.deNome || nomeDe(ev.dePais) },
          dados: ev.dados || null,
          onFim: () => hooks.atualizar?.(),
        });
      } else if (ev.tipo === 'naval' || ev.tipo === 'nuclear') {
        alertaUrgente({
          titulo: ev.tipo === 'nuclear' ? '☢ ATAQUE NUCLEAR CONTRA VOCÊ' : 'ATAQUE NAVAL CONTRA VOCÊ',
          texto: ev.texto || `${ev.deNome || nomeDe(ev.dePais)} atacou você.`, tom: 'ataque',
        });
      } else if (ev.tipo === 'alianca' || ev.tipo === 'comercio') {
        propostaRecebida(ev, est);
      } else {
        alertaIncoming(origem, est, ev.texto);
      }
    }
  }

  // ── PROPOSTA recebida (aliança/comércio) — aceitar/recusar com timer ──
  function propostaRecebida(ev, est) {
    fecharAlerta();
    const el = document.createElement('div');
    el.className = 'onl-alerta proposta';
    el.style.setProperty('--oc', est.cor);
    el.innerHTML = `
      <div class="onl-cab">${ico(est.ic, 15)} <b>${esc(ev.deNome || nomeDe(ev.dePais))}</b> <span>${est.rot}</span></div>
      <div class="onl-txt">${esc(ev.texto || 'Quer estreitar laços com você.')}</div>
      <div class="onl-timer"><i></i></div>
      <div class="onl-acoes">
        <button class="onl-sim">${ico('check', 14)} ACEITAR</button>
        <button class="onl-nao">${ico('x', 14)} RECUSAR</button>
      </div>`;
    document.body.appendChild(el);
    const responder = (aceito) => {
      net.evento('resposta', ev.dePais, aceito ? 'Aceitou a proposta.' : 'Recusou a proposta.', { sobre: ev.tipo, aceito });
      if (aceito) {
        // aceitar melhora a relação localmente
        const k = `rel_${ev.dePais?.toLowerCase()}`;
        if (k in jogo.estado) jogo.estado[k] = Math.min(100, (jogo.estado[k] || 0) + 20);
        hooks.atualizar?.();
      }
      fecharAlerta();
    };
    el.querySelector('.onl-sim').addEventListener('click', () => responder(true));
    el.querySelector('.onl-nao').addEventListener('click', () => responder(false));
    // timer de 20s: deixar expirar recusa por omissão — decidir rápido É a ansiedade
    autoFechar = setTimeout(() => responder(false), 20000);
  }

  // ── ALERTA urgente simples (sanção, espionagem, etc.) ──
  function alertaIncoming(origem, est, texto) {
    fecharAlerta();
    const el = document.createElement('div');
    el.className = `onl-alerta ${est.urgente ? 'urgente' : ''}`;
    el.style.setProperty('--oc', est.cor);
    el.innerHTML = `
      <div class="onl-cab">${ico(est.ic, 15)} <b>${esc(origem)}</b> <span>${est.rot}</span></div>
      <div class="onl-txt">${esc(texto || '')}</div>
      <button class="onl-ok">ENTENDIDO</button>`;
    document.body.appendChild(el);
    el.querySelector('.onl-ok').addEventListener('click', fecharAlerta);
    autoFechar = setTimeout(fecharAlerta, 8000);
  }

  let autoFechar = null;
  function fecharAlerta() {
    clearTimeout(autoFechar);
    document.querySelectorAll('.onl-alerta').forEach((e) => e.remove());
  }

  // ── FROTAS DE OUTROS JOGADORES no seu globo ─────────────────────────
  // A frota humana entra como "frota inimiga" (o pino hostil que o globo já sabe
  // renderizar) com id estável por jogador — mover atualiza, recolher remove.
  const frotasAvisadas = new Set();   // 1 alerta de detecção por frota (senão vira spam)
  function upsertFrotaHumana(ev) {
    const d = ev.dados || {};
    if (!ev.dePais || d.lat == null) return;
    const e = jogo.estado;
    e.frotasInimigas = e.frotasInimigas || [];
    const id = `hum_${ev.dePais}_${d.id || 1}`;
    const atual = e.frotasInimigas.find((f) => f.id === id);
    const frota = {
      id, code: ev.dePais, humana: true, lat: d.lat, lng: d.lng,
      unidades: d.unidades || { navios: 4 }, presenca: d.presenca ?? 6,
    };
    // EM TRÂNSITO: a esquadra NAVEGA no seu globo igual no do dono — mesma rota,
    // mesmos horários (convertidos do relógio do servidor pro seu). O tique de
    // trânsito do globo interpola sozinho e crava no destino na hora certa.
    if (d.destino && Number.isFinite(d.chegaEm)) {
      const off = offsetServidor();
      frota.origem = { lat: d.lat, lng: d.lng };
      frota.destino = { lat: d.destino.lat, lng: d.destino.lng };
      frota.partiuEm = (d.partiuEm ?? Date.now()) - off;
      frota.chegaEm = d.chegaEm - off;
      if (Array.isArray(d.rota) && d.rota.length >= 2) frota.rota = d.rota;
    }
    if (atual) {
      // atualização de posição: limpa um trânsito antigo antes de aplicar o novo
      delete atual.origem; delete atual.destino; delete atual.partiuEm; delete atual.chegaEm; delete atual.rota;
      Object.assign(atual, frota);
    } else e.frotasInimigas.push(frota);
    const g = hooks.globoCtrl?.();
    g?.atualizar?.();
    // ÁGUAS TERRITORIAIS: frota humana perto da SUA costa → a sua defesa costeira
    // DETECTA e grita — alerta, notícia e radar no ponto. Furtividade conta: esquadra
    // só de submarinos encurta (e muito) o alcance em que você a enxerga.
    const minha = g?.ondeEsta?.(meuIso);
    if (!minha) return;
    const dist = Math.hypot(frota.lat - minha.lat, (frota.lng - minha.lng) * 0.7);
    const furt = techDaFrota(frota.unidades).furtividade ?? 30;
    const alcanceDeteccao = Math.max(4, 16 * (1 - furt / 140));
    if (dist <= alcanceDeteccao && !frotasAvisadas.has(id)) {
      frotasAvisadas.add(id);
      const nomeDono = ev.deNome ? `${ev.deNome} (${nomeDe(ev.dePais)})` : nomeDe(ev.dePais);
      alertaUrgente({ titulo: 'ESQUADRA DETECTADA NA SUA COSTA', texto: `A marinha de ${nomeDono} entrou nas suas águas territoriais.`, tom: 'ataque' });
      tocarEfeito('radar', { volume: 0.5 });
      g?.ondaRadar?.({ lat: frota.lat, lng: frota.lng }, { cor: 0xff3b5c, max: 45 });
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚓ Defesa Costeira', cor: '#ff3b5c',
        texto: `Radar litorâneo detectou a esquadra de ${nomeDono} a ${dist.toFixed(0)}° da costa. Presença estimada: ${frota.presenca}.` }]);
      hooks.renderFeed?.();
    }
  }
  // ── RESULTADO NAVAL chega: o DONO da frota sente o golpe ────────────
  function aplicarResultadoNaval(ev) {
    const d = ev.dados || {};
    const donoIso = ev.alvo;
    if (!donoIso || !d.frotaId) return;
    const e = jogo.estado;
    const g = hooks.globoCtrl?.();
    // TODOS removem/atualizam o pino da frota atacada (adeus, navio fantasma)
    if (d.venceu && e.frotasInimigas) {
      e.frotasInimigas = e.frotasInimigas.filter((f) => f.id !== `hum_${donoIso}_${d.frotaId}`);
    }
    // O DONO aplica no próprio estado: afundou (some + tropa perdida) ou baixas
    if (donoIso === meuIso) {
      const fr = (e.frotas || []).find((f) => f.id === d.frotaId);
      if (fr) {
        if (d.venceu) {
          if (fr.guarnKey && e.guarnicoes) delete e.guarnicoes[fr.guarnKey];   // a tropa AFUNDOU junto
          e.frotas = e.frotas.filter((f) => f.id !== fr.id);
          alertaUrgente({ titulo: 'SUA FROTA FOI AFUNDADA', texto: ev.texto || `${ev.deNome || nomeDe(ev.dePais)} destruiu a sua esquadra.`, tom: 'ataque' });
          jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚓ Marinha', cor: '#ff3b5c', texto: `Perdemos a esquadra em combate contra ${nomeDe(ev.dePais)}. As unidades a bordo afundaram com ela.` }]);
        } else {
          const pct = Math.max(0, Math.min(95, d.perdaPct || 30));
          for (const k of Object.keys(fr.unidades || {})) {
            fr.unidades[k] = Math.max(0, Math.floor(fr.unidades[k] * (1 - pct / 100)));
            if (!fr.unidades[k]) delete fr.unidades[k];
          }
          if (fr.guarnKey && e.guarnicoes) e.guarnicoes[fr.guarnKey] = { ...fr.unidades };
          alertaUrgente({ titulo: 'SUA FROTA FOI ATACADA', texto: `${ev.deNome || nomeDe(ev.dePais)} atacou sua esquadra — ela resistiu com ${pct}% de baixas.`, tom: 'ataque' });
        }
        hooks.renderFeed?.();
      }
    }
    g?.atualizar?.();
  }

  // ── IMPACTO TERRITORIAL chega: o mapa de TODOS marca a conquista/conflito ──
  function aplicarImpactoTerritorial(ev, { silencioso = false } = {}) {
    const d = ev.dados || {};
    const e = jogo.estado;
    const atacante = ev.dePais;
    if (!atacante) return;
    e.donoEstado = e.donoEstado || {};
    e.conflitosEstado = e.conflitosEstado || {};
    for (const id of (d.caem || [])) {
      e.donoEstado[id] = atacante;                     // o estado MUDOU DE DONO no mapa de todos
      e.conflitosEstado[id] = { por: atacante, intensidade: 45, turnos: 0 };
    }
    for (const id of (d.conflito || [])) {
      if (!e.conflitosEstado[id]) e.conflitosEstado[id] = { por: atacante, intensidade: 30, turnos: 0 };
    }
    const g = hooks.globoCtrl?.();
    // o país atacado abre em estados no globo de quem olha (pra marca aparecer)
    if (ev.alvo) g?.carregarPais?.(ev.alvo)?.then?.(() => g?.atualizar?.());
    g?.atualizar?.();
    if (silencioso) return;
    // veio do desfecho de uma OFENSIVA (guerra_resultado): alerta o dono + feed geral
    if (ev.alvo === meuIso) {
      alertaUrgente({ titulo: 'TERRITÓRIO PERDIDO', texto: ev.texto || `${ev.deNome || nomeDe(atacante)} tomou ${d.caem?.length || 0} território(s) seu(s). Clique no seu país para ver o estrago.`, tom: 'ataque' });
    }
    jogo._empilharFeed?.([{ tipo: 'jogador', handle: ev.deNome || nomeDe(atacante), paisOrigem: atacante, paisAlvo: ev.alvo || null,
      texto: ev.texto || `Ofensiva concluída: ${d.caem?.length || 0} território(s) tomado(s).`, cor: '#ff3b5c' }]);
    hooks.renderFeed?.();
  }

  function removerFrotaHumana(ev) {
    const e = jogo.estado;
    if (!e.frotasInimigas) return;
    const prefixo = `hum_${ev.dePais}_`;
    e.frotasInimigas = e.frotasInimigas.filter((f) => !String(f.id).startsWith(prefixo));
    hooks.globoCtrl?.()?.atualizar?.();
  }

  // ── MUNDO recebido do host (convidado aplica) ──────────────────────────
  function aplicarMundo(d) {
    if (Array.isArray(d.posts) && d.posts.length) { jogo._empilharFeed?.(d.posts); hooks.renderFeed?.(); }
    // animação no globo espelhando o host (escaramuça/petróleo)
    const g = hooks.globoCtrl?.();
    if (d.anim && g) {
      const de = g.ondeEsta?.(d.anim.de); const para = g.ondeEsta?.(d.anim.para || d.anim.iso);
      if (d.anim.tipo === 'escaramuca' && de && para) { g.desenharLinha?.(para, 'ataque', 6000, de); g.salvaMisseis?.(para, 2, de, { som: false }); }
      else if (d.anim.tipo === 'petroleo' && para) g.ondaRadar?.(para, { cor: 0xffb020, max: 55 });
    }
    // relógio da sala: o período do HOST vira o período mostrado (sem mexer no turno local)
    if (Number.isFinite(d.turno)) { jogo._periodoSala = d.turno; hooks.sincronizarPeriodo?.(d.turno); }
  }

  // Reassume os callbacks da conexão que a home abriu (sem reconectar).
  net.setHandlers({
    onSala: (msg) => { absorverJogadores(msg.jogadores); hooks.onRoster?.(jogadores); },
    onEvento: receber,
    onConexao: (ok) => { if (badge && !ok) badge.classList.remove('online-ativo'); },
  });
  pintarBadge();

  return {
    humano,
    jogadores: () => jogadores.slice(),
    // AUTORIDADE DO MUNDO: quem é host gera o mundo ao vivo e o retransmite; convidado só aplica.
    souHost: () => !!net.estado().host,
    relayMundo: (dados) => net.evento('mundo', null, '', dados),
    // A BATIDA do host viaja pra sala (e o servidor a cacheia pro próximo que entrar).
    relayBeat: (dados) => net.evento('beat', null, '', dados),
    // A SUA frota no mar, visível pra sala: posição/composição resumida — e a saída.
    // Horários de trânsito viajam em TEMPO DO SERVIDOR (cada cliente converte de volta).
    relayFrota: (dados) => {
      const d = { ...dados };
      const off = offsetServidor();
      if (Number.isFinite(d.partiuEm)) d.partiuEm += off;
      if (Number.isFinite(d.chegaEm)) d.chegaEm += off;
      net.evento('frota_pos', null, '', d);
    },
    relayFrotaSaiu: (frotaId) => net.evento('frota_out', null, '', { id: frotaId }),
    // VOCÊ agiu sobre um país. Se for humano, dispara o alerta pra ele. Sempre publica
    // no feed da sala (todos veem o impacto — é o World Trends).
    notificar: (tipo, alvoIso, texto, dados) => {
      net.evento(tipo, alvoIso, texto, dados);
    },
    ehHumano: (iso) => porPais.has(iso),
  };
}
