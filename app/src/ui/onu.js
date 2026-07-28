// ═══════════════════════════════════════════════════════════════════════
// CONSELHO DE SEGURANÇA — o tribunal da sala (só no online)
// ═══════════════════════════════════════════════════════════════════════
// O pedido do dono: "espionagem descobre um ataque → convoca a ONU → congela os
// recursos do agressor". Era a peça que faltava pra punição coletiva existir: até
// aqui, quem apanhava só podia revidar com ferro (ou sancionar sozinho, um contra
// um). Agora a sala inteira senta na mesma mesa, olha pro réu e VOTA uma pena que
// dói de verdade — o caixa congelado, o embargo, o comércio suspenso.
//
// POR QUE A CENA É ASSIM: o réu fica NO CENTRO, com bandeira grande, retrato do
// líder e a pena proposta em placa vermelha por cima. Não é um formulário de
// votação — é um banco dos réus. O acusado ENTRA na sessão e FALA (não vota a
// própria pena): é o que transforma isto numa cena de mesa, com defesa e ataque,
// em vez de um botão que aplica dano.
//
// COMO ISTO SOBREVIVE A UM RELAY BURRO: o servidor (server/lobby.js) só repassa
// bilhetes — não arbitra nada. Então a contagem de votos é LOCAL (derivada dos
// `onu_voto` que chegaram + o meu), mas quem CRAVA o resultado é um só: o
// PRESIDENTE DA SESSÃO (quem convocou). Ele emite `onu_veredito` e todo mundo
// aplica esse número — nunca o próprio. Sem isso, um pacote perdido daria
// vereditos diferentes em telas diferentes, e a pena existiria pra uns e não
// pra outros. Se o presidente cair no meio, a sessão se DISSOLVE sem pena
// (benefício da dúvida é do acusado, como no empate).
//
// A VOZ FICOU DE FORA — DE PROPÓSITO. `criarTelefonia` (net/chamada.js) guarda UMA
// RTCPeerConnection e recusa a segunda chamada; e a sinalização dela ('tel-convite',
// 'tel-ice'…) já é consumida por ui/telefone.js no canal `direto`. Microfone de SALA
// pede malha N-1 (uma conexão por participante) e um namespace de sinalização
// próprio — reaproveitar a telefonia 1:1 aqui daria "chamada recebida" pipocando no
// meio da sessão. Em vez de meio-quebrado: PEDIR A PALAVRA (fila de oradores real,
// pela rede) + chat de texto funcionando. O que faltaria está no relatório.
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { liderDe } from '../dados/lideres.js';
import { ico } from './icones.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { alertaUrgente } from './efeitos.js';
import { tocarEfeito } from './audio.js';
import { agoraServidor } from '../net/lobby.js';
// A abertura de 15s com trilha (revela convocador → motivo → réu → pena) e a voz de
// sala (malha N-1, namespace `voz-*`) moram fora daqui de propósito: este arquivo é a
// REGRA do Conselho, não a cinemática nem o WebRTC.
import { abrirAberturaConselho, DUR_ABERTURA_MS } from './onuAbertura.js';
import { criarSalaVoz } from '../net/salaVoz.js';
import { listarMicrofones } from '../net/chamada.js';
import { dispararBreaking } from './breaking.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const flagUrl = (iso, w = 160) => (ISO2_DE[iso] ? bandeira(ISO2_DE[iso], w) : null);
const flagImg = (iso, cls = 'onu-flag') => {
  const u = flagUrl(iso, 80);
  return u ? `<img class="${cls}" src="${u}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="${cls} sem">${esc(iso)}</span>`;
};

// ── OS TEMPOS DA MESA ──────────────────────────────────────────────────
// Havia UM tempo cravado (90s) e o dono reclamou com razão: "pelo menos três opções
// de tempo do conselho, pra não ficar algo tão rápido mas também não tão devagar".
// Faz sentido porque a duração certa depende do que está em jogo — um congelamento de
// caixa merece debate; uma sanção óbvia contra quem acabou de invadir alguém não.
// Quem convoca escolhe, e a escolha viaja com a sessão (todo cliente crava o mesmo fim).
export const DURACOES = [
  { s: 60, rot: 'RELÂMPAGO', sub: '1 minuto', desc: 'Sessão de emergência. Tempo de acusar, ouvir uma defesa curta e votar. Quem hesita perde o voto.' },
  { s: 150, rot: 'ORDINÁRIA', sub: '2m30', desc: 'O ritmo padrão: dá pra acusação construir, a defesa responder e a mesa mudar de ideia no meio.' },
  { s: 300, rot: 'EXTENSA', sub: '5 minutos', desc: 'Debate longo, para penas graves. Espaço pra barganha nos bastidores — e pra a sala se dividir de verdade.' },
];
const DURACAO_PADRAO = 150;

// ── A JANELA DE ADESÃO ─────────────────────────────────────────────────
// O Conselho não abre porque alguém quis: abre porque a MAIORIA aceitou abrir. Este é
// o tempo que a sala tem pra responder ao chamado — curto de propósito, porque a
// tensão está em decidir no escuro (ninguém sabe ainda contra quem é a sessão).
const ADESAO_S = 25;

// ── O INTERVALO ENTRE SESSÕES ──────────────────────────────────────────
// Pedido do dono: "preciso que o conselho ao ser feito possa ter um timing de pelo
// menos 2 MESES pra fazer novamente". Sem isso o Conselho vira metralhadora: convoca,
// perde, convoca de novo, até a sala cansar e aprovar por desgaste. O intervalo vale
// mesmo quando a convocação é NEGADA — senão bastava perder pra tentar outra vez.
// 1 mês = 1 batida do mundo (30s), então 2 meses é ~1 minuto real.
const COOLDOWN_MESES = 2;

// ── AS PENAS ───────────────────────────────────────────────────────────
// Cada uma tem de DOER em algum lugar que o jogador já sente. `efeitos` é o golpe
// no impacto (medidores, via aplicarEfeitos); `porTurno` é o sangramento mensal
// enquanto a pena estiver de pé; `trava` é o que o resto do jogo precisa checar
// (as duas travas têm predicado exportado no fim do arquivo — não invente checagem
// nova, importe daqui).
export const PENAS = {
  congelar_recursos: {
    rot: 'CONGELAR RECURSOS', ic: 'snowflake', cor: 'var(--cyan)', turnos: 6, trava: 'caixa',
    curta: 'O caixa do país é congelado. Nenhuma ordem que custe dinheiro sai do papel.',
    longa: 'Os ativos do Estado no exterior são bloqueados e os bancos centrais fecham a torneira. O tesouro continua no lugar — e continua intocável.',
    efeitos: { temp_economia: -12, aprovacao: -6, estabilidade: -4 },
  },
  sancao_economica: {
    rot: 'SANÇÕES ECONÔMICAS', ic: 'ban', cor: 'var(--ambar)', turnos: 10,
    curta: 'Prejuízo mensal: comércio perdido e capital fugindo.',
    longa: 'Entra na mesma conta das sanções que outros jogadores impõem (o dreno recorrente do painel Governar) — só que assinada pelo mundo inteiro.',
    efeitos: { temp_economia: -8, soft_power: -8 },
  },
  embargo_armas: {
    rot: 'EMBARGO DE ARMAS', ic: 'shield-off', cor: 'var(--perigo)', turnos: 8, trava: 'armas',
    curta: 'Nenhum fornecedor vende. O arsenal para de crescer.',
    longa: 'O Mercado fecha as portas: nada de caça, tanque ou navio enquanto o embargo durar. Quem já tem, mantém; quem precisava repor, não repõe.',
    efeitos: { poder_militar: -4, seguranca: -6 },
  },
  suspensao_comercio: {
    rot: 'SUSPENSÃO DE COMÉRCIO', ic: 'container', cor: 'var(--roxo)', turnos: 8,
    curta: 'As rotas fecham. O PIB encolhe todo mês enquanto durar.',
    longa: 'Portos e alfândegas param de despachar. É a pena mais lenta e a mais cruel: não dá um golpe, dá uma hemorragia.',
    efeitos: { temp_economia: -6, pib: -0.5 },
    porTurno: { pib: -0.35, temp_economia: -1.5 },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// PREDICADOS PÚBLICOS — o resto do jogo pergunta AQUI se a pena morde
// ═══════════════════════════════════════════════════════════════════════
// Ficam fora do controlador de propósito: quem precisa checar (a fila de comando,
// a compra de arsenal) não tem — e não deveria ter — acesso ao `onuCtrl`. Basta
// importar a função e passar o estado.

// O caixa está congelado por decisão do Conselho? → { bloqueado, por, restante }
export function caixaCongelado(estado) {
  const p = penaAtiva(estado, 'congelar_recursos');
  return p ? { bloqueado: true, por: p.por, restante: p.turnos } : { bloqueado: false };
}

// A compra de armamento está embargada? → { bloqueado, por, restante }
export function armasEmbargadas(estado) {
  const p = penaAtiva(estado, 'embargo_armas');
  return p ? { bloqueado: true, por: p.por, restante: p.turnos } : { bloqueado: false };
}

// Todas as penas de pé contra MIM (pra HUD/painéis mostrarem).
export function penasContraMim(estado) {
  const meu = estado?.iso;
  return (estado?.penasONU || []).filter((p) => p.contra === meu && p.turnos > 0);
}

function penaAtiva(estado, tipo) {
  const meu = estado?.iso;
  if (!meu) return null;
  return (estado?.penasONU || []).find((p) => p.tipo === tipo && p.contra === meu && Number(p.turnos) > 0) || null;
}

// ═══════════════════════════════════════════════════════════════════════
export function montarONU(jogo, net, { onlineCtrl, globoCtrl } = {}) {
  const meuIso = jogo.estado.iso || jogo.ficha?.iso || 'USA';
  let sessao = null;            // a sessão ativa (uma por vez — ver regra abaixo)
  let tique = null;             // cronômetro da sessão (1s)
  let cancelarAbertura = null;  // corta a cinemática de 15s se a mesa morrer no meio
  let voz = null;               // controlador da voz de sala (montado ao entrar na mesa)
  let niveis = new Map();       // iso → 0..1 (volume instantâneo, pra acender quem fala)
  const encerradas = new Set(); // ids já julgados: um `onu_convocar` repetido não ressuscita a mesa

  const globo = () => (typeof globoCtrl === 'function' ? globoCtrl() : globoCtrl);
  const palco = () => document.getElementById('globo-wrap') || document.body;
  const meuNome = () => (onlineCtrl?.jogadores?.() || []).find((j) => j.pais === meuIso)?.nome || 'Você';
  // Só HUMANOS podem ser réus: a cena inteira depende do acusado estar na mesa pra
  // se defender. Sancionar um NPC seria aplicar dano num estado que ninguém habita.
  const humanos = () => (onlineCtrl?.jogadores?.() || []).filter((j) => j.pais && j.pais !== meuIso);

  // ── ESTADO DA SESSÃO ────────────────────────────────────────────────
  // `fase` é a novidade que organiza tudo:
  //   'adesao'  → a sala decide SE o Conselho acontece. Ninguém sabe contra quem é.
  //   'abertura'→ aprovado: roda a cinemática de 15s revelando réu, motivo e pena.
  //   'mesa'    → a sessão de verdade: voz, tribuna e voto da pena.
  // O réu, o tema e o motivo só existem no objeto DEPOIS da revelação — em quem não
  // convocou eles chegam vazios de propósito (ver `convocar`).
  function novaSessao(d, dePais, deNome) {
    return {
      id: d.id,
      fase: 'adesao',
      titulo: d.titulo || '',
      motivo: d.motivo || '',
      acusado: d.acusado || null,
      pena: PENAS[d.pena] ? d.pena : null,
      turnos: Number(d.turnos) || 6,
      duracao: Number(d.duracao) || DURACAO_PADRAO,
      inicio: Number(d.inicio) || agoraServidor(),      // início da MESA (setado na revelação)
      adesaoAte: Number(d.adesaoAte) || (agoraServidor() + ADESAO_S * 1000),
      presidente: dePais, presidenteNome: deNome || nomeDe(dePais),
      adesoes: new Map(),     // iso → true (aceitou) | false (recusou)
      presentes: new Map(),   // iso → nome do jogador
      votos: new Map(),       // iso → 'sim' | 'nao'
      falas: [],              // { iso, nome, texto }
      palavra: [],            // fila de oradores (isos), na ordem do pedido
      modoVoz: 'fila',        // 'todos' = microfone aberto · 'fila' = um de cada vez
      mutados: new Set(),     // quem o presidente calou
      comPalavra: null,       // no modo 'fila', quem está com o microfone agora
      entrei: false, encerrada: false, veredito: null,
      // guardado só no cliente de QUEM CONVOCOU, até a sala aprovar
      segredo: null,
    };
  }

  const souPresidente = () => !!sessao && sessao.presidente === meuIso;
  const souReu = () => !!sessao && sessao.acusado === meuIso;
  const restanteS = () => (sessao ? Math.max(0, Math.ceil((sessao.inicio + sessao.duracao * 1000 - agoraServidor()) / 1000)) : 0);
  const restanteAdesaoS = () => (sessao ? Math.max(0, Math.ceil((sessao.adesaoAte - agoraServidor()) / 1000)) : 0);

  // ── O INTERVALO ENTRE SESSÕES (cooldown de 2 meses) ─────────────────
  // Vive no estado (viaja no save) e conta em TURNOS do mundo, não em segundos de
  // relógio: assim ele significa "dois meses de jogo", que é o que o dono pediu, e não
  // "um minuto do seu cronômetro" — que mudaria de sentido se a batida mudar de ritmo.
  const turnoAgora = () => Number(jogo.turno ?? jogo.estado?.turno ?? 0);
  function mesesAtePoderConvocar() {
    const ate = Number(jogo.estado?.onuProximaSessao ?? 0);
    return Math.max(0, ate - turnoAgora());
  }
  function marcarCooldown() {
    jogo.estado.onuProximaSessao = turnoAgora() + COOLDOWN_MESES;
  }

  // Quem pode votar: todos os presentes MENOS o réu. Ele fala, não julga a própria pena.
  function votantes() { return [...sessao.presentes.keys()].filter((iso) => iso !== sessao.acusado); }
  function contagem() {
    let sim = 0; let nao = 0;
    for (const iso of votantes()) {
      const v = sessao.votos.get(iso);
      if (v === 'sim') sim += 1; else if (v === 'nao') nao += 1;
    }
    return { sim, nao, total: votantes().length };
  }
  // MAIORIA DOS PRESENTES, não dos que votaram: quem se cala está protegendo o réu.
  // Empate (e abstenção em massa) = pena REJEITADA — o benefício da dúvida é do acusado.
  const aprovaria = () => { const c = contagem(); return c.sim > c.total / 2; };

  // ── SAÍDA: CONVOCAR ─────────────────────────────────────────────────
  function abrirConvocacao() {
    if (!net || !onlineCtrl) return;
    if (document.querySelector('.onu-modal')) return;
    if (sessao && !sessao.encerrada) { abrirSala(); return; }
    const alvos = humanos();

    const modal = document.createElement('div');
    modal.className = 'modal-fundo onu-modal';
    document.body.appendChild(modal);
    const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
    function tecla(ev) { if (ev.key === 'Escape') fechar(); }
    document.addEventListener('keydown', tecla);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

    let foco = alvos[0]?.pais || null;
    let pena = 'congelar_recursos';
    let duracao = DURACAO_PADRAO;
    const espera = mesesAtePoderConvocar();
    // ── O TEXTO NÃO PODE MORRER NUM CLIQUE ────────────────────────────
    // BUG QUE ISTO CONSERTA: cada escolha (país, pena, duração) chama `render()`, que
    // reescreve o innerHTML — e levava embora o TEMA e o MOTIVO que o jogador acabou de
    // escrever. Digitar um parágrafo de acusação e perdê-lo porque você trocou a duração
    // depois é o tipo de coisa que faz alguém desistir da feature. Agora o texto vive
    // FORA do DOM: o render lê daqui, e cada tecla escreve aqui.
    const rascunho = { titulo: '', motivo: '' };

    function render() {
      const def = PENAS[pena];
      modal.innerHTML = `<div class="onu-painel">
        <div class="onu-cab">
          <div class="onu-ic">${ico('gavel', 20)}</div>
          <div class="onu-tit"><h2>CONVOCAR O CONSELHO</h2><span>Sessão extraordinária — a sala é chamada, mas não sabe contra quem</span></div>
          <button class="pp-fechar onu-x">${ico('x', 16)}</button>
        </div>
        ${espera > 0 ? `
        <div class="onu-vazio">${ico('hourglass', 16)} <span>O Conselho acabou de se reunir. Uma nova sessão só pode ser convocada em <b>${espera} ${espera > 1 ? 'meses' : 'mês'}</b>.<br><i>O intervalo existe pra o Conselho não virar metralhadora: sem ele, bastaria convocar até a sala aprovar por cansaço.</i></span></div>`
        : alvos.length ? `
        <div class="onu-corpo">
          ${/* O SIGILO É A FEATURE. O que você escreve aqui NÃO viaja no chamado: a sala
               vota no escuro se abre ou não a sessão, e só depois de aprovada é que o
               réu, o tema e o motivo são revelados — com música e cinemática de 15s.
               É o que transforma o Conselho num evento em vez de um formulário. */''}
          <div class="onu-sigilo">${ico('eye-off', 14)}
            <span><b>Isto é um envelope selado.</b> Ao convocar, a sala recebe só o seu nome e o seu país —
            <b>ninguém descobre quem é o réu, o tema ou a pena</b> antes de a maioria aceitar abrir a sessão.
            Quem vota a favor está votando no escuro. Inclusive o acusado.</span></div>

          <label class="onu-rot">${ico('crosshair', 11)} PAÍS-FOCO — QUEM SENTA NO BANCO DOS RÉUS</label>
          <div class="onu-alvos">
            ${alvos.map((j) => `<button class="onu-alvo ${j.pais === foco ? 'on' : ''}" data-iso="${esc(j.pais)}">
              ${flagImg(j.pais, 'onu-alvo-flag')}
              <span><b>${esc(nomeDe(j.pais))}</b><i>${esc(j.nome || 'presidente')}</i></span>
            </button>`).join('')}
          </div>

          <label class="onu-rot">${ico('file-text', 11)} TEMA DA SESSÃO <i class="onu-rot-sel">revelado só após a aprovação</i></label>
          <input class="onu-input" id="onu-titulo" maxlength="90" placeholder="Ex.: ofensiva não provocada contra a Ucrânia" autocomplete="off" value="${esc(rascunho.titulo)}">

          <label class="onu-rot">${ico('scroll-text', 11)} MOTIVO — A ACUSAÇÃO, COM SUAS PALAVRAS</label>
          <textarea class="onu-area" id="onu-motivo" maxlength="320" rows="3"
            placeholder="O que este país fez. É este texto que a mesa vai ler na abertura, em nome seu.">${esc(rascunho.motivo)}</textarea>

          <label class="onu-rot">${ico('scale', 11)} AÇÃO PROPOSTA — A PENA QUE VAI A VOTO</label>
          <div class="onu-penas">
            ${Object.entries(PENAS).map(([k, p]) => `<button class="onu-pena ${k === pena ? 'on' : ''}" data-pena="${k}" style="--pc:${p.cor}">
              <span class="onu-pena-ic">${ico(p.ic, 15)}</span>
              <span class="onu-pena-txt"><b>${esc(p.rot)}</b><i>${esc(p.curta)}</i></span>
              <span class="onu-pena-dur">${p.turnos} meses</span>
            </button>`).join('')}
          </div>
          <div class="onu-nota" style="--pc:${def.cor}">${ico('info', 13)} <span>${esc(def.longa)}</span></div>

          <label class="onu-rot">${ico('timer', 11)} DURAÇÃO DA SESSÃO</label>
          <div class="onu-duracoes">
            ${DURACOES.map((d) => `<button class="onu-dur ${d.s === duracao ? 'on' : ''}" data-s="${d.s}">
              <b>${d.rot}</b><i>${d.sub}</i><small>${esc(d.desc)}</small></button>`).join('')}
          </div>

          <div class="onu-aviso">${ico('users', 12)} <span>Primeiro a sala decide <b>se</b> a sessão acontece (maioria de quem responder, em ${ADESAO_S}s).
            Depois vota a <b>pena</b>: maioria dos presentes, empate absolve. O réu fala e usa o microfone, mas <b>não vota a própria pena</b>.
            Convocar consome o intervalo de <b>${COOLDOWN_MESES} meses</b> — mesmo se a sala recusar.</span></div>
          <button class="onu-convocar" id="onu-go">${ico('gavel', 15)} SELAR O ENVELOPE E CONVOCAR</button>
        </div>` : `
        <div class="onu-vazio">${ico('users', 16)} Não há outro chefe de Estado na sala. O Conselho existe pra julgar gente de carne e osso — chame alguém pra partida.</div>`}
      </div>`;

      modal.querySelector('.onu-x').addEventListener('click', fechar);
      // cada tecla vai pro rascunho ANTES de qualquer re-render poder acontecer
      const elT = modal.querySelector('#onu-titulo');
      const elM = modal.querySelector('#onu-motivo');
      elT?.addEventListener('input', () => { rascunho.titulo = elT.value; });
      elM?.addEventListener('input', () => { rascunho.motivo = elM.value; });
      modal.querySelectorAll('.onu-alvo').forEach((b) => b.addEventListener('click', () => { foco = b.dataset.iso; render(); }));
      modal.querySelectorAll('.onu-pena').forEach((b) => b.addEventListener('click', () => { pena = b.dataset.pena; render(); }));
      modal.querySelectorAll('.onu-dur').forEach((b) => b.addEventListener('click', () => { duracao = Number(b.dataset.s); render(); }));
      modal.querySelector('#onu-go')?.addEventListener('click', () => {
        const titulo = (elT?.value || rascunho.titulo).trim()
          || `Conduta de ${nomeDe(foco)} perante o Conselho`;
        const motivo = (elM?.value || rascunho.motivo).trim();
        fechar();
        convocar({ titulo, motivo, acusado: foco, pena, duracao });
      });
    }
    render();
  }

  // ── CONVOCAR: o envelope selado ─────────────────────────────────────
  // O bilhete que sai daqui é DELIBERADAMENTE pobre: id, quem convocou, quanto dura a
  // adesão e quanto vai durar a mesa. O réu, o tema, o motivo e a pena ficam GUARDADOS
  // no meu cliente (`sessao.segredo`) e só viajam no `onu_revelar`, depois de a sala
  // aprovar. Não é teatro de UI — o dado não existe do outro lado, então não há devtools
  // que estrague a surpresa. É o pedido do dono: "a ideia é fazer com que o sancionado
  // possa ser surpreendido; ninguém sabe quem vai ser sancionado".
  function convocar({ titulo, motivo, acusado, pena, duracao }) {
    if (!acusado || acusado === meuIso) return;   // ninguém convoca contra si mesmo
    if (mesesAtePoderConvocar() > 0) return;
    const publico = {
      id: `onu_${agoraServidor().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      duracao: Number(duracao) || DURACAO_PADRAO,
      adesaoAte: agoraServidor() + ADESAO_S * 1000,
    };
    sessao = novaSessao(publico, meuIso, meuNome());
    sessao.segredo = { titulo, motivo, acusado, pena, turnos: PENAS[pena]?.turnos || 6 };
    sessao.adesoes.set(meuIso, true);            // quem convoca já é um sim
    marcarCooldown();                            // vale mesmo se a sala recusar
    net.evento('onu_convocar', null,
      `convocou uma sessão extraordinária do Conselho de Segurança — o motivo está selado.`, publico);
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#35e0ff',
      texto: `Você convocou o Conselho. A sala tem ${ADESAO_S}s pra aceitar abrir a sessão — sem saber contra quem ela é.` }]);
    iniciarCronometro();
    painelAdesao();
  }

  // ── A CONTAGEM DA ADESÃO ────────────────────────────────────────────
  // Quem decide são os HUMANOS da sala. Maioria de quem RESPONDEU (aceitou ou recusou),
  // porque no escuro o silêncio não é proteção de ninguém — é só ausência. Empate cai:
  // abrir um tribunal exige maioria de verdade, não sorte de moeda.
  function elegiveisAdesao() {
    const todos = new Set([meuIso, ...(onlineCtrl?.jogadores?.() || []).map((j) => j.pais).filter(Boolean)]);
    return [...todos];
  }
  function contagemAdesao() {
    let sim = 0; let nao = 0;
    for (const v of sessao.adesoes.values()) { if (v) sim += 1; else nao += 1; }
    return { sim, nao, responderam: sim + nao, sala: elegiveisAdesao().length };
  }
  const adesaoAprovada = () => { const a = contagemAdesao(); return a.responderam > 0 && a.sim > a.responderam / 2; };

  function responderAdesao(aceito) {
    if (!sessao || sessao.fase !== 'adesao') return;
    if (sessao.adesoes.get(meuIso) === aceito) return;
    sessao.adesoes.set(meuIso, aceito);
    net.evento('onu_adesao', null, '', { id: sessao.id, aceito });
    painelAdesao();
    checarAdesao();
  }

  // Só o PRESIDENTE crava o resultado da adesão — mesma autoridade única do veredito.
  // Se ele evaporar, a janela expira e a sessão morre sem mesa (ninguém julga por ele).
  function checarAdesao() {
    if (!sessao || sessao.fase !== 'adesao' || sessao.encerrada) return;
    const a = contagemAdesao();
    const zerou = restanteAdesaoS() <= 0;
    if (!souPresidente()) {
      if (zerou && agoraServidor() > sessao.adesaoAte + 8000) dissolver('a janela de adesão fechou sem resposta do presidente');
      return;
    }
    const todosResponderam = a.responderam >= a.sala;
    if (!zerou && !todosResponderam) return;
    if (adesaoAprovada()) {
      const s = sessao.segredo || {};
      const d = {
        id: sessao.id,
        titulo: s.titulo, motivo: s.motivo, acusado: s.acusado, pena: s.pena, turnos: s.turnos,
        duracao: sessao.duracao,
        // A MESA COMEÇA DEPOIS DA CINEMÁTICA. Se o cronômetro partisse agora, os 15s de
        // abertura comeriam um quarto de uma sessão relâmpago — e o réu perderia tempo
        // de defesa por causa de uma animação.
        inicio: agoraServidor() + DUR_ABERTURA_MS,
        sim: a.sim, nao: a.nao, total: a.responderam,
      };
      net.evento('onu_revelar', s.acusado, 'O Conselho foi aceito. A sessão vai começar.', d);
      revelar(d, meuIso, meuNome());
    } else {
      const d = { id: sessao.id, sim: a.sim, nao: a.nao };
      net.evento('onu_negado', null, 'A sala recusou abrir o Conselho.', d);
      negado(d);
    }
  }

  // ── ENTRADA: EVENTOS DA SALA ────────────────────────────────────────
  // Devolve true se consumiu (o roteador de online.js não deve seguir adiante).
  function aoEvento(ev) {
    if (!ev || !String(ev.tipo || '').startsWith('onu_')) return false;
    const d = ev.dados || {};
    switch (ev.tipo) {
      case 'onu_convocar': {
        // UMA MESA POR VEZ: uma segunda convocação no meio de uma sessão viva é ruído
        // (dois tribunais simultâneos deixariam a contagem de presentes sem sentido).
        if (encerradas.has(d.id)) return true;
        if (sessao && !sessao.encerrada) {
          jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#7488ad',
            texto: `${ev.deNome || nomeDe(ev.dePais)} tentou abrir uma segunda sessão — a mesa já está ocupada.` }]);
          return true;
        }
        // O bilhete vem POBRE de propósito (sem réu, sem tema, sem pena): quem recebe
        // monta uma sessão em fase de adesão e vota no escuro. Ver `convocar`.
        sessao = novaSessao(d, ev.dePais, ev.deNome);
        sessao.adesoes.set(ev.dePais, true);           // quem convoca é um sim implícito
        // O intervalo de 2 meses vale pra TODOS: com a mesa ocupada, ninguém mais
        // convoca — e quando ela fechar, a sala inteira ainda espera o intervalo.
        marcarCooldown();
        iniciarCronometro();
        painelAdesao();
        jogo._empilharFeed?.([{ tipo: 'jogador', handle: `⚖ ${ev.deNome || nomeDe(ev.dePais)}`, paisOrigem: ev.dePais,
          texto: `convocou uma sessão extraordinária do Conselho de Segurança. O motivo está selado — a sala decide se abre.`, cor: '#35e0ff' }]);
        return true;
      }
      case 'onu_adesao': {
        if (!sessao || sessao.id !== d.id || sessao.fase !== 'adesao') return true;
        sessao.adesoes.set(ev.dePais, d.aceito !== false);
        painelAdesao();
        checarAdesao();
        return true;
      }
      case 'onu_revelar': {
        if (!sessao || sessao.id !== d.id) return true;
        // AUTORIDADE ÚNICA: só o presidente revela. Um envelope aberto por outro assento
        // é pacote fora de ordem — ou trapaça de quem quer plantar um réu falso.
        if (ev.dePais !== sessao.presidente) return true;
        revelar(d, ev.dePais, ev.deNome);
        return true;
      }
      case 'onu_negado': {
        if (!sessao || sessao.id !== d.id) return true;
        if (ev.dePais !== sessao.presidente) return true;
        negado(d);
        return true;
      }
      // MODO DO MICROFONE E MODERAÇÃO: quem preside a sessão comanda a palavra. O bilhete
      // é público (a sala precisa VER quem foi calado — moderação secreta é censura).
      case 'onu_voz': {
        if (!casa(d)) return true;
        if (ev.dePais !== sessao.presidente) return true;
        if (d.modo) { sessao.modoVoz = d.modo === 'todos' ? 'todos' : 'fila'; voz?.definirModo(sessao.modoVoz); }
        // A lista de calados é o retrato oficial da mesa. O silenciamento EM SI é
        // aplicado pelo motor de voz (salaVoz manda `voz-mudo` direto ao alvo, que se
        // muta de verdade) — aqui só guardamos o que a sala tem de ver na tela.
        if (Array.isArray(d.mutados)) sessao.mutados = new Set(d.mutados);
        if (d.palavraDe !== undefined) { voz?.daPalavra(d.palavraDe || null); sessao.comPalavra = d.palavraDe || null; }
        pintar();
        return true;
      }
      case 'onu_presenca': {
        if (!casa(d)) return true;
        if (d.entrou === false) sessao.presentes.delete(ev.dePais);
        else sessao.presentes.set(ev.dePais, ev.deNome || nomeDe(ev.dePais));
        // ECO DE UM SALTO: quem já está na mesa responde a chegada de um novato pra ele
        // enxergar quem estava lá antes dele. `eco` corta o pingue-pongue infinito.
        if (d.entrou !== false && !d.eco && sessao.entrei) {
          net.evento('onu_presenca', null, '', { id: sessao.id, entrou: true, eco: true });
        }
        pintar();
        return true;
      }
      case 'onu_fala': {
        if (!casa(d) || !d.texto) return true;
        sessao.falas.push({ iso: ev.dePais, nome: ev.deNome || nomeDe(ev.dePais), texto: String(d.texto).slice(0, 240) });
        // quem fala perde o lugar na fila de oradores — a palavra foi usada
        sessao.palavra = sessao.palavra.filter((i) => i !== ev.dePais);
        pintar();
        return true;
      }
      case 'onu_palavra': {
        if (!casa(d)) return true;
        sessao.palavra = sessao.palavra.filter((i) => i !== ev.dePais);
        if (d.pedindo !== false) sessao.palavra.push(ev.dePais);
        pintar();
        return true;
      }
      case 'onu_voto': {
        if (!casa(d) || !['sim', 'nao'].includes(d.voto)) return true;
        if (ev.dePais === sessao.acusado) return true;              // o réu não vota a própria pena
        sessao.presentes.set(ev.dePais, ev.deNome || nomeDe(ev.dePais));
        sessao.votos.set(ev.dePais, d.voto);
        pintar();
        checarFechamento();
        return true;
      }
      case 'onu_veredito': {
        if (!sessao || sessao.id !== d.id) { encerradas.add(d.id); return true; }
        // AUTORIDADE ÚNICA: só o presidente crava. Um veredito vindo de outro assento é
        // pacote fora de ordem (ou trapaça) — descartar é mais barato que divergir.
        if (ev.dePais !== sessao.presidente) return true;
        aplicarVeredito(d);
        return true;
      }
      default: return false;
    }
  }

  // ── O CANAL `direto` E A VOZ DA SALA ────────────────────────────────
  // A sessão em si é pública (é uma MESA, não um bilhete), mas a SINALIZAÇÃO da voz é
  // ponto a ponto por natureza: SDP e ICE são conversa entre dois navegadores. Ela vive
  // no namespace `voz-*` justamente pra não colidir com o `tel-*` do telefone vermelho —
  // se dividissem prefixo, cada oferta da mesa faria pipocar "chamada recebida" na tela
  // de todos. O roteador em ui/jogo.js oferece o bilhete aqui PRIMEIRO; se a voz não
  // reconhecer, ele segue pro chat de bloco e pro telefone.
  function aoDireto(msg) {
    if (!String(msg?.tipo || '').startsWith('voz-')) return false;
    return !!voz?.aoDireto(msg);
  }

  const casa = (d) => !!(sessao && !sessao.encerrada && d && d.id === sessao.id);

  // ── O CHAMADO: aceitar ou recusar ABRIR a sessão ─────────────────────
  // O que isto substitui: um cartão que já entregava réu, tema e pena, com um botão
  // "TOMAR ASSENTO" e outro "IGNORAR". Dois problemas de uma vez — a surpresa morria no
  // primeiro pixel, e "ignorar" não é uma resposta: quem fechava o cartão simplesmente
  // desaparecia da conta. Agora o cartão é uma CÉDULA: você aceita ou RECUSA abrir o
  // tribunal, e não sabe contra quem está votando. O dono pediu as duas coisas —
  // "mudar a UI de ao invés de ignorar clicar em recusar" e o sigilo do acusado.
  function painelAdesao() {
    if (!sessao || sessao.fase !== 'adesao') return;
    document.querySelectorAll('.onu-chamado').forEach((e) => e.remove());
    const a = contagemAdesao();
    const meu = sessao.adesoes.get(meuIso);
    const el = document.createElement('div');
    el.className = 'onu-chamado adesao';
    el.innerHTML = `
      <div class="onu-ch-cab">${ico('gavel', 15)} <b>CONSELHO DE SEGURANÇA</b> <span>CONVOCAÇÃO SELADA</span></div>
      <div class="onu-ch-selado">
        <div class="onu-ch-envelope">${ico('mail', 26)}</div>
        <div class="onu-ch-txt">
          <b>${esc(sessao.presidenteNome)}</b>
          <span>${esc(nomeDe(sessao.presidente))} pede uma sessão extraordinária</span>
          <i>${ico('eye-off', 11)} o país-foco, o motivo e a pena estão lacrados até a mesa abrir</i>
        </div>
      </div>
      <div class="onu-ch-placar">
        <span class="sim">${ico('check', 11)} <b>${a.sim}</b> a favor</span>
        <span class="nao">${ico('x', 11)} <b>${a.nao}</b> contra</span>
        <span class="rel">${ico('timer', 11)} <b id="onu-ad-cron">${restanteAdesaoS()}s</b></span>
      </div>
      ${souPresidente()
        ? `<div class="onu-ch-quem">${ico('user', 10)} você convocou — aguardando a sala responder</div>`
        : `<div class="onu-acoes">
            <button class="onu-sim ${meu === true ? 'on' : ''}">${ico('check', 14)} ACEITAR ABRIR</button>
            <button class="onu-nao ${meu === false ? 'on' : ''}">${ico('x', 14)} RECUSAR</button>
          </div>
          <div class="onu-ch-aviso">${ico('info', 10)} Maioria de quem responder decide. Você está votando no escuro — pode ser contra você.</div>`}`;
    document.body.appendChild(el);
    try { tocarEfeito('radar', { volume: 0.45 }); } catch { /* sem áudio */ }
    el.querySelector('.onu-sim')?.addEventListener('click', () => responderAdesao(true));
    el.querySelector('.onu-nao')?.addEventListener('click', () => responderAdesao(false));
  }

  function fecharAdesao() { document.querySelectorAll('.onu-chamado').forEach((e) => e.remove()); }

  // ── A SALA RECUSOU ──────────────────────────────────────────────────
  function negado(d) {
    if (!sessao || sessao.id !== d.id) return;
    encerradas.add(d.id);
    fecharAdesao();
    const quem = sessao.presidenteNome;
    const euConvoquei = souPresidente();
    sessao.encerrada = true;
    clearInterval(tique); tique = null;
    sessao = null;
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#7488ad',
      texto: euConvoquei
        ? `A sala RECUSOU abrir a sua sessão por ${d.nao} a ${d.sim}. O envelope voltou lacrado — e ninguém nunca vai saber o que tinha dentro.`
        : `A sala recusou abrir a sessão pedida por ${quem}, por ${d.nao} a ${d.sim}. O que estava no envelope morreu lacrado.` }]);
    if (euConvoquei) {
      // Convocar e perder tem preço: você mostrou a mão sem ganhar nada, e o mundo viu.
      aplicarEfeitos(jogo.estado, { soft_power: -4 });
    }
  }

  // ── A REVELAÇÃO: a mesa foi aceita ──────────────────────────────────
  // Aqui o segredo finalmente vira público — e é o gatilho da cinemática de 15s com a
  // trilha do Conselho. A mesa só abre quando a abertura termina; até lá o cronômetro
  // da sessão nem começou (ver `inicio` em checarAdesao).
  function revelar(d, dePais, deNome) {
    if (!sessao || sessao.id !== d.id || sessao.encerrada) return;
    fecharAdesao();
    sessao.fase = 'abertura';
    sessao.titulo = d.titulo || 'Sessão extraordinária';
    sessao.motivo = d.motivo || '';
    sessao.acusado = d.acusado;
    sessao.pena = PENAS[d.pena] ? d.pena : 'sancao_economica';
    sessao.turnos = Number(d.turnos) || PENAS[sessao.pena]?.turnos || 6;
    sessao.duracao = Number(d.duracao) || sessao.duracao;
    sessao.inicio = Number(d.inicio) || (agoraServidor() + DUR_ABERTURA_MS);
    sessao.presidente = dePais || sessao.presidente;
    sessao.presidenteNome = deNome || sessao.presidenteNome;
    sessao.presentes.set(sessao.presidente, sessao.presidenteNome);

    const def = PENAS[sessao.pena];
    const contraMim = souReu();
    jogo._empilharFeed?.([{ tipo: 'jogador', handle: `⚖ ${sessao.presidenteNome}`, paisOrigem: sessao.presidente, paisAlvo: sessao.acusado,
      texto: `Conselho de Segurança ABERTO por ${d.sim} a ${d.nao} — o país-foco é ${nomeDe(sessao.acusado)}: ${sessao.titulo}`, cor: '#35e0ff' }]);
    const g = globo();
    g?.ondaRadar?.(g.ondeEsta?.(sessao.acusado), { cor: 0x35e0ff, max: 45 });

    cancelarAbertura = abrirAberturaConselho({
      convocadorIso: sessao.presidente, convocadorNome: sessao.presidenteNome,
      acusadoIso: sessao.acusado, acusadoNome: nomeDe(sessao.acusado),
      titulo: sessao.titulo, motivo: sessao.motivo,
      penaRot: def.rot, penaIc: def.ic, penaCor: def.cor,
      sim: d.sim, nao: d.nao, total: d.total,
    }, () => {
      cancelarAbertura = null;
      if (!sessao || sessao.encerrada) return;
      sessao.fase = 'mesa';
      if (contraMim) {
        // O ALARME É SAGRADO: faixa vermelha, sem sirene. Ser acusado não é o mesmo que
        // levar um míssil — o som fica reservado pro impacto.
        alertaUrgente({
          titulo: '⚖ VOCÊ É O PAÍS-FOCO',
          texto: `${sessao.presidenteNome} lacrou o seu nome num envelope e a sala aceitou abrir. A pena proposta é ${def.rot.toLowerCase()}. Você tem a palavra e o microfone — mas não vota a própria pena.`,
          tom: 'ataque', comSom: false,
        });
      }
      abrirSala();
    });
  }

  // ── A SALA ──────────────────────────────────────────────────────────
  function abrirSala() {
    if (!sessao || sessao.encerrada) return;
    if (document.querySelector('.onu-sala')) return;
    entrarNaSessao();
    const over = document.createElement('div');
    over.className = 'onu-sala';
    palco().appendChild(over);
    pintar();
    iniciarCronometro();
  }

  // O CRONÔMETRO RODA MESMO COM A SALA FECHADA. Motivo: o veredito não pode depender
  // de o presidente estar olhando pra tela — e quem minimizou a mesa ainda precisa do
  // resgate que dissolve a sessão se o presidente evaporar.
  function iniciarCronometro() {
    clearInterval(tique);
    tique = setInterval(() => {
      if (!sessao || sessao.encerrada) { clearInterval(tique); tique = null; return; }
      // O MESMO tique serve as duas janelas: a de adesão (decidir se abre) e a da mesa
      // (votar a pena). Dois intervalos seriam duas fontes de verdade sobre o tempo.
      if (sessao.fase === 'adesao') {
        const el = document.querySelector('#onu-ad-cron');
        if (el) el.textContent = `${restanteAdesaoS()}s`;
        checarAdesao();
        return;
      }
      if (sessao.fase !== 'mesa') return;   // durante a abertura o relógio da mesa não corre
      pintarRelogio();
      checarFechamento();
    }, 1000);
  }

  function fecharSala() {
    document.querySelectorAll('.onu-sala').forEach((e) => e.remove());
  }

  function entrarNaSessao() {
    if (!sessao || sessao.entrei) return;
    sessao.entrei = true;
    sessao.presentes.set(meuIso, meuNome());
    net.evento('onu_presenca', null, '', { id: sessao.id, entrou: true });
  }

  // ── PINTURA DA SALA ─────────────────────────────────────────────────
  function pintar() {
    const over = document.querySelector('.onu-sala');
    if (!over || !sessao) return;
    const def = PENAS[sessao.pena];
    const c = contagem();
    const lider = liderDe(sessao.acusado, nomeDe(sessao.acusado));
    // O RÉU TEM DONO: se o acusado já sentou à mesa, o nome que aparece é o DELE, não o
    // do chefe de Estado sorteado. Encarar o apelido de quem está do outro lado da sala
    // é metade da cena — o retrato genérico só entra enquanto a cadeira está vazia.
    const nomeReu = sessao.presentes.get(sessao.acusado);
    const bandeirao = flagUrl(sessao.acusado, 320);
    const meuVoto = sessao.votos.get(meuIso) || null;
    const pedindo = sessao.palavra.includes(meuIso);

    over.innerHTML = `<div class="onu-mesa ${souReu() ? 'sou-reu' : ''}">
      <div class="onu-mesa-cab">
        <div class="onu-selo">${ico('gavel', 17)}</div>
        <div class="onu-mesa-tit">
          <h2>CONSELHO DE SEGURANÇA</h2>
          <span>${esc(sessao.titulo)}</span>
        </div>
        <div class="onu-cron" id="onu-cron"><b>${fmt(restanteS())}</b><i>até o veredito</i></div>
        <button class="pp-fechar onu-sair" title="Sair da sala (a sessão continua)">${ico('minimize-2', 15)}</button>
      </div>

      <div class="onu-corpo-mesa">
        <aside class="onu-bancada">
          <div class="onu-lab">${ico('users', 11)} ASSENTOS OCUPADOS <b>${sessao.presentes.size}</b></div>
          <div class="onu-assentos">
            ${[...sessao.presentes.entries()].map(([iso, nome]) => {
              const v = sessao.votos.get(iso);
              const reu = iso === sessao.acusado;
              return `<div class="onu-assento ${reu ? 'reu' : ''} ${v || ''}">
                ${flagImg(iso, 'onu-as-flag')}
                <div class="onu-as-txt"><b>${esc(nomeDe(iso))}</b><i>${esc(nome || '')}${iso === sessao.presidente ? ' · preside' : ''}</i></div>
                <span class="onu-as-voto">${reu ? 'RÉU' : v === 'sim' ? 'A FAVOR' : v === 'nao' ? 'CONTRA' : '—'}</span>
              </div>`;
            }).join('')}
          </div>
          <div class="onu-placar">
            <div class="onu-pl sim"><b>${c.sim}</b><span>a favor</span></div>
            <div class="onu-pl nao"><b>${c.nao}</b><span>contra</span></div>
            <div class="onu-pl falta"><b>${Math.max(0, c.total - c.sim - c.nao)}</b><span>calados</span></div>
          </div>
          <div class="onu-barra"><i class="sim" style="width:${c.total ? (c.sim / c.total) * 100 : 0}%"></i><i class="nao" style="width:${c.total ? (c.nao / c.total) * 100 : 0}%"></i></div>
          <div class="onu-regra">${ico('scale', 10)} maioria dos ${c.total} presentes com direito a voto · empate absolve</div>
        </aside>

        <section class="onu-centro">
          <div class="onu-reu-rot">${ico('crosshair', 12)} PAÍS-FOCO DESTA SESSÃO</div>
          <div class="onu-reu-palco">
            ${bandeirao ? `<img class="onu-reu-bandeirao" src="${bandeirao}" alt="" onerror="this.style.display='none'">` : ''}
            <img class="onu-reu-retrato" src="${esc(lider.retrato)}" alt="" onerror="this.style.display='none'">
            <div class="onu-reu-nome">${esc(nomeDe(sessao.acusado))}</div>
            <div class="onu-reu-lider">${nomeReu
              ? `${esc(nomeReu)} · <i>presente à mesa</i>`
              : `${esc(lider.nome)} · ${esc(lider.arquetipo?.nome || 'chefe de Estado')} · <i>cadeira vazia</i>`}</div>
          </div>
          <div class="onu-placa" style="--pc:${def.cor}">
            <span class="onu-placa-rot">${ico(def.ic, 13)} AÇÃO PROPOSTA</span>
            <b>${esc(def.rot)}</b>
            <i>${esc(def.curta)} Duração: ${sessao.turnos} meses.</i>
          </div>
          ${souReu()
            ? `<div class="onu-defesa">${ico('shield', 14)} <span>Você está no banco dos réus. Não vota a própria pena — mas tem a palavra, e a mesa está ouvindo.</span></div>`
            : `<div class="onu-voto">
                <button class="onu-v sim ${meuVoto === 'sim' ? 'on' : ''}" id="onu-v-sim">${ico('check', 15)} A FAVOR DA PENA</button>
                <button class="onu-v nao ${meuVoto === 'nao' ? 'on' : ''}" id="onu-v-nao">${ico('x', 15)} CONTRA</button>
              </div>`}
          <div class="onu-preside">${ico('user', 10)} preside ${esc(sessao.presidenteNome)} (${esc(nomeDe(sessao.presidente))})</div>
        </section>

        <aside class="onu-tribuna">
          <div class="onu-lab">${ico('mic', 11)} TRIBUNA</div>
          <button class="onu-palavra ${pedindo ? 'on' : ''}" id="onu-palavra">${ico('hand', 14)} ${pedindo ? 'RETIRAR O PEDIDO' : 'PEDIR A PALAVRA'}</button>
          ${/* NO MODO "UM DE CADA VEZ" A FILA DEIXA DE SER DECORATIVA: quem preside
               CLICA no orador e o microfone abre pra ele. Antes a fila era só uma lista
               de quem levantou a mão, e a palavra nunca era efetivamente dada — o que
               fazia o botão "pedir a palavra" parecer quebrado. */''}
          ${sessao.palavra.length ? `<div class="onu-fila-oradores">${sessao.palavra.map((iso, i) => {
            const dele = sessao.comPalavra === iso;
            const clicavel = souPresidente() && sessao.modoVoz === 'fila';
            return `<span class="onu-orador ${dele ? 'agora' : ''} ${clicavel ? 'clicavel' : ''}" ${clicavel ? `data-dar="${esc(iso)}" title="Dar a palavra a ${esc(nomeDe(iso))}"` : ''}>
              ${flagImg(iso, 'onu-or-flag')} ${esc(nomeDe(iso))}${dele ? ' <i>com a palavra</i>' : i === 0 ? ' <i>próximo</i>' : ''}</span>`;
          }).join('')}</div>` : ''}
          ${painelMicrofoneHTML()}
          <div class="onu-falas" id="onu-falas">
            ${sessao.falas.length ? sessao.falas.map((f) => `<div class="onu-fala ${f.iso === meuIso ? 'meu' : ''} ${f.iso === sessao.acusado ? 'do-reu' : ''}">
                <b>${flagImg(f.iso, 'onu-fl-flag')} ${esc(nomeDe(f.iso))}</b><span>${esc(f.texto)}</span>
              </div>`).join('')
              : `<div class="onu-falas-vazio">${ico('message-square', 12)} A mesa está em silêncio. Alguém precisa começar — acusação ou defesa.</div>`}
          </div>
          <form class="onu-form" id="onu-form"><input id="onu-msg" maxlength="240" placeholder="Falar à mesa…" autocomplete="off"><button type="submit">${ico('send', 14)}</button></form>
        </aside>
      </div>
    </div>`;

    over.querySelector('.onu-sair').addEventListener('click', fecharSala);
    ligarMicrofone(over);
    over.querySelector('#onu-v-sim')?.addEventListener('click', () => votar('sim'));
    over.querySelector('#onu-v-nao')?.addEventListener('click', () => votar('nao'));
    over.querySelector('#onu-palavra').addEventListener('click', pedirPalavra);
    over.querySelector('#onu-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const inp = over.querySelector('#onu-msg');
      const texto = inp.value.trim();
      if (!texto) return;
      inp.value = '';
      falar(texto);
    });
    const fs = over.querySelector('#onu-falas');
    if (fs) fs.scrollTop = fs.scrollHeight;
  }

  // ═══════════════════════════════════════════════════════════════════
  // O MICROFONE DA MESA
  // ═══════════════════════════════════════════════════════════════════
  // O pedido do dono, literal: "a ideia é funcionar o microfone, com a opção pra todos
  // falarem, ou opção um de cada vez. Talvez o presidente que convocou a reunião possa
  // realizar a ação de mutar".
  //
  // Pensei junto e as regras que ficaram são estas — cada uma resolve um problema real
  // de sala de voz, e nenhuma delas é decoração:
  //
  //   • ENTRAR É OPT-IN. Ninguém tem o microfone aberto sem clicar. Voz que liga sozinha
  //     é como o jogador descobre, tarde, que a sala ouviu a casa dele.
  //   • MODO "UM DE CADA VEZ" É O PADRÃO. Numa mesa de julgamento, 6 pessoas falando ao
  //     mesmo tempo não é debate, é ruído — e quem perde é sempre a defesa, que é quem
  //     tem menos aliados pra gritar. Quem quiser bagunça liga o modo aberto.
  //   • QUEM PRESIDE COMANDA A PALAVRA. Ele alterna o modo, passa a palavra pra quem
  //     pediu, e pode calar quem atrapalha. Isso é poder de verdade e pode ser abusado —
  //     por isso a lista de calados é PÚBLICA na tela de todos: moderação secreta é
  //     censura, moderação à vista é presidência.
  //   • O RÉU NUNCA PODE SER CALADO. Ele já não vota a própria pena; tirar a voz dele
  //     também transformaria o Conselho num paredão. Direito de defesa é o que separa
  //     um tribunal de um linchamento — e o botão de mutar respeita isso.
  function painelMicrofoneHTML() {
    const ativa = !!voz?.ativa();
    const modo = sessao.modoVoz;
    const comPalavra = sessao.comPalavra || null;
    const mudoMeu = !!voz?.estouMudo();
    const parts = ativa ? (voz.participantes() || []) : [];
    return `<div class="onu-voz ${ativa ? 'on' : ''}">
      <div class="onu-voz-cab">${ico(ativa ? 'mic' : 'mic-off', 12)} MICROFONE DA SALA
        <span class="onu-voz-modo">${modo === 'todos' ? 'TODOS FALAM' : 'UM DE CADA VEZ'}</span></div>
      ${ativa ? `
        <div class="onu-voz-gente">
          ${parts.length ? parts.map((p) => {
            const nivel = Math.min(1, Number(niveis.get(p.iso)) || 0);
            const calado = sessao.mutados.has(p.iso) || p.mudo;
            const falando = !calado && nivel > 0.08;
            return `<div class="onu-vz ${falando ? 'falando' : ''} ${calado ? 'calado' : ''} ${p.iso === comPalavra ? 'palavra' : ''}">
              ${flagImg(p.iso, 'onu-vz-flag')}
              <span class="onu-vz-nome">${esc(nomeDe(p.iso))}</span>
              <span class="onu-vz-medidor"><i data-iso="${esc(p.iso)}" style="width:${Math.round(nivel * 100)}%"></i></span>
              ${souPresidente() && p.iso !== meuIso && p.iso !== sessao.acusado
                ? `<button class="onu-vz-mutar" data-iso="${esc(p.iso)}" title="${calado ? 'Devolver a voz' : 'Calar na mesa'}">${ico(calado ? 'mic-off' : 'mic', 11)}</button>`
                : p.iso === sessao.acusado ? `<i class="onu-vz-reu" title="O réu não pode ser calado — é o direito de defesa">${ico('shield', 10)}</i>` : ''}
            </div>`;
          }).join('') : `<div class="onu-voz-so">${ico('info', 11)} Você é o único com o microfone aberto.</div>`}
        </div>
        <div class="onu-voz-ctl">
          <button class="onu-voz-b ${mudoMeu ? 'mudo' : ''}" id="onu-voz-mudo">${ico(mudoMeu ? 'mic-off' : 'mic', 13)} ${mudoMeu ? 'NO MUDO' : 'AO VIVO'}</button>
          <button class="onu-voz-b sair" id="onu-voz-sair">${ico('phone-off', 13)} SAIR DA VOZ</button>
        </div>
        ${souPresidente() ? `<div class="onu-voz-preside">
          <button class="onu-voz-modo-b ${modo === 'fila' ? 'on' : ''}" data-modo="fila">${ico('list-ordered', 11)} UM DE CADA VEZ</button>
          <button class="onu-voz-modo-b ${modo === 'todos' ? 'on' : ''}" data-modo="todos">${ico('users', 11)} TODOS FALAM</button>
        </div>` : ''}
        ${modo === 'fila' ? `<div class="onu-voz-fila">${comPalavra
          ? `${ico('mic', 10)} com a palavra: <b>${esc(nomeDe(comPalavra))}</b>`
          : `${ico('info', 10)} ninguém com a palavra${souPresidente() ? ' — passe a palavra na tribuna abaixo' : ' — aguarde a presidência'}`}</div>` : ''}`
      : `<button class="onu-voz-entrar" id="onu-voz-entrar">${ico('mic', 14)} ABRIR O MEU MICROFONE</button>
         <div class="onu-voz-nota">${ico('info', 10)} A voz vai direto de navegador a navegador. Ninguém ouve nada seu antes de você clicar.</div>`}
    </div>`;
  }

  function ligarMicrofone(over) {
    over.querySelector('#onu-voz-entrar')?.addEventListener('click', entrarNaVoz);
    over.querySelector('#onu-voz-sair')?.addEventListener('click', () => { voz?.sair(); voz = null; niveis = new Map(); pintar(); });
    over.querySelector('#onu-voz-mudo')?.addEventListener('click', () => { voz?.mutarMe(); pintar(); });
    over.querySelectorAll('.onu-voz-modo-b').forEach((b) => b.addEventListener('click', () => {
      if (!souPresidente()) return;
      sessao.modoVoz = b.dataset.modo;
      voz?.definirModo(sessao.modoVoz);
      net.evento('onu_voz', null, '', { id: sessao.id, modo: sessao.modoVoz });
      pintar();
    }));
    over.querySelectorAll('.onu-orador[data-dar]').forEach((s) => s.addEventListener('click', () => {
      if (!souPresidente() || sessao.modoVoz !== 'fila') return;
      const alvo = s.dataset.dar;
      sessao.comPalavra = sessao.comPalavra === alvo ? null : alvo;
      voz?.daPalavra(sessao.comPalavra);            // salaVoz já difunde o `voz-palavra`
      net.evento('onu_voz', null, '', { id: sessao.id, palavraDe: sessao.comPalavra });
      pintar();
    }));
    over.querySelectorAll('.onu-vz-mutar').forEach((b) => b.addEventListener('click', () => {
      if (!souPresidente()) return;
      const alvo = b.dataset.iso;
      if (alvo === sessao.acusado) return;             // o réu não se cala
      const calado = sessao.mutados.has(alvo);
      if (calado) sessao.mutados.delete(alvo); else sessao.mutados.add(alvo);
      voz?.mutarOutro(alvo, !calado);
      net.evento('onu_voz', null, '', { id: sessao.id, mutados: [...sessao.mutados] });
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Presidência', cor: '#ffb020',
        texto: calado ? `A presidência devolveu a palavra a ${nomeDe(alvo)}.` : `A presidência CALOU ${nomeDe(alvo)} na mesa. Todos na sala viram.` }]);
      pintar();
    }));
  }

  async function entrarNaVoz() {
    if (!sessao || sessao.fase !== 'mesa' || voz) return;
    const { mics, erro } = await listarMicrofones();
    if (erro || !mics.length) {
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#ff3b5c',
        texto: `Sem microfone: ${erro || 'nenhum dispositivo de entrada encontrado'}. A palavra segue pela tribuna escrita.` }]);
      return;
    }
    voz = criarSalaVoz({
      net, meuIso, meuNome: meuNome(),
      onEstado: (tipo, dados) => {
        if (tipo === 'nivel') { niveis.set(dados.iso, dados.nivel); pintarNiveis(); return; }
        if (tipo === 'erro') {
          jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#ff3b5c',
            texto: `Falha na voz da sala: ${dados?.motivo || 'linha caiu'}. A tribuna escrita continua de pé.` }]);
        }
        pintar();
      },
    });
    const r = await voz.entrar(mics[0].id, { modo: sessao.modoVoz });
    if (r?.erro) { voz = null; }
    pintar();
  }

  // Os medidores mudam 10× por segundo: repintar a mesa inteira nesse ritmo mataria o
  // navegador e ainda faria o campo de texto perder o foco no meio de uma frase.
  function pintarNiveis() {
    for (const [iso, n] of niveis) {
      const el = document.querySelector(`.onu-vz-medidor i[data-iso="${CSS.escape(iso)}"]`);
      if (el) el.style.width = `${Math.round(Math.min(1, n) * 100)}%`;
    }
  }

  function pintarRelogio() {
    const el = document.querySelector('#onu-cron b');
    if (el) el.textContent = fmt(restanteS());
    const cron = document.querySelector('#onu-cron');
    if (cron) cron.classList.toggle('urgente', restanteS() <= 15);
  }

  // ── AÇÕES DO JOGADOR NA MESA ────────────────────────────────────────
  function votar(v) {
    if (!sessao || sessao.encerrada || souReu()) return;
    if (sessao.votos.get(meuIso) === v) return;     // um país, um voto (trocar de ideia vale; martelar não)
    sessao.votos.set(meuIso, v);
    net.evento('onu_voto', null, '', { id: sessao.id, voto: v });
    pintar();
    checarFechamento();
  }

  function falar(texto) {
    if (!sessao || sessao.encerrada) return;
    sessao.falas.push({ iso: meuIso, nome: meuNome(), texto });
    sessao.palavra = sessao.palavra.filter((i) => i !== meuIso);
    net.evento('onu_fala', null, '', { id: sessao.id, texto });
    pintar();
  }

  function pedirPalavra() {
    if (!sessao || sessao.encerrada) return;
    const jaPedi = sessao.palavra.includes(meuIso);
    sessao.palavra = sessao.palavra.filter((i) => i !== meuIso);
    if (!jaPedi) sessao.palavra.push(meuIso);
    net.evento('onu_palavra', null, '', { id: sessao.id, pedindo: !jaPedi });
    pintar();
  }

  // ── FECHAMENTO: só o PRESIDENTE crava ───────────────────────────────
  function checarFechamento() {
    if (!sessao || sessao.encerrada || sessao.fase !== 'mesa') return;
    const zerou = restanteS() <= 0;
    if (!souPresidente()) {
      // O presidente sumiu (aba fechada, saiu da sala) e o relógio passou da conta:
      // ninguém julga por ele. A mesa se dissolve SEM pena — como no empate.
      if (zerou && agoraServidor() > sessao.inicio + (sessao.duracao + 8) * 1000) dissolver();
      return;
    }
    const c = contagem();
    const todosFalaram = c.total > 0 && (c.sim + c.nao) >= c.total;
    if (!zerou && !todosFalaram) return;
    if (c.total === 0) { dissolver(); return; }      // ninguém apareceu: não há Conselho
    const d = {
      id: sessao.id, aprovada: aprovaria(), sim: c.sim, nao: c.nao, total: c.total,
      acusado: sessao.acusado, pena: sessao.pena, turnos: sessao.turnos, titulo: sessao.titulo,
      // A CHAMADA NOMINAL VIAJA COM O VEREDITO. Sem ela, cada cliente contava os votos
      // que por acaso recebeu e a imprensa de cada um citava uma lista diferente — o
      // pior tipo de divergência, porque ninguém percebe que está lendo outra história.
      // Com o rol fechado pelo presidente, a manchete é a MESMA na sala inteira, e
      // "quem votou como" vira fato público — que é metade da diplomacia daqui pra frente.
      votos: [...sessao.votos.entries()].map(([iso, v]) => ({ iso, v })),
      presidente: sessao.presidente, presidenteNome: sessao.presidenteNome,
      motivo: sessao.motivo || '',
    };
    net.evento('onu_veredito', sessao.acusado, d.aprovada ? 'O Conselho aprovou a pena.' : 'O Conselho rejeitou a pena.', d);
    aplicarVeredito(d);
  }

  function dissolver(motivo = 'sem veredito') {
    if (!sessao) return;
    encerradas.add(sessao.id);
    sessao.encerrada = true;
    clearInterval(tique); tique = null;
    cancelarAbertura?.(); cancelarAbertura = null;
    voz?.sair(); voz = null; niveis = new Map();
    fecharAdesao();
    fecharSala();
    const quem = sessao.acusado ? nomeDe(sessao.acusado) : 'o país-foco';
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#7488ad',
      texto: sessao.acusado
        ? `A sessão contra ${quem} se dissolveu (${motivo}). Sem mesa, não há pena — e ${quem} sai de pé.`
        : `A convocação de ${sessao.presidenteNome} morreu antes de abrir (${motivo}). O envelope nunca foi lido.` }]);
    sessao = null;
  }

  // ── O VEREDITO E A PENA QUE MORDE ───────────────────────────────────
  function aplicarVeredito(d) {
    if (!sessao || sessao.id !== d.id || sessao.encerrada) return;
    sessao.encerrada = true;
    sessao.veredito = d;
    encerradas.add(d.id);
    clearInterval(tique); tique = null;
    // A MESA FECHOU: o microfone fecha com ela. Deixar a malha de voz de pé depois do
    // martelo é o mesmo bug do ruído que assombrava a telefonia — sala vazia com gente
    // falando pro nada, e o indicador do navegador aceso sem motivo.
    cancelarAbertura?.(); cancelarAbertura = null;
    voz?.sair(); voz = null; niveis = new Map();
    fecharAdesao();
    const def = PENAS[d.pena] || PENAS.sancao_economica;
    const nomeAcusado = nomeDe(d.acusado);

    if (d.aprovada && d.acusado === meuIso) registrarPenaContraMim(d, def);

    // O REGISTRO PÚBLICO: TODO cliente guarda a pena (com `contra`), não só o réu. É o
    // que permite a qualquer painel mostrar "quem está sob sanção do Conselho" — e é de
    // graça, porque só as penas com contra === meuIso travam alguma coisa.
    if (d.aprovada && d.acusado !== meuIso) {
      const e = jogo.estado;
      e.penasONU = e.penasONU || [];
      e.penasONU.push({ tipo: d.pena, por: 'ONU', contra: d.acusado, desde: Date.now(), turnos: d.turnos, titulo: d.titulo });
    }

    telaVeredito(d, def, nomeAcusado);
    publicarImprensa(d, def, nomeAcusado);
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: d.aprovada ? '#ff3b5c' : '#22e0a0',
      texto: d.aprovada
        ? `Por ${d.sim} a ${d.nao}, o Conselho aprovou ${def.rot.toLowerCase()} contra ${nomeAcusado}. A pena vale por ${d.turnos} meses.`
        : `Por ${d.sim} a ${d.nao}, o Conselho REJEITOU a pena contra ${nomeAcusado}. A mesa se dividiu e o réu sai de pé.` }]);
    const g = globo();
    g?.ondaRadar?.(g.ondeEsta?.(d.acusado), { cor: d.aprovada ? 0xff3b5c : 0x22e0a0, max: 55 });
    g?.balao?.(g.ondeEsta?.(d.acusado), d.aprovada ? def.rot : 'ABSOLVIDO', d.aprovada ? 'ruim' : 'aviso');
    sessao = null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // A IMPRENSA DO CONSELHO
  // ═══════════════════════════════════════════════════════════════════
  // O pedido do dono: "criar um destaque maior para o breaking news quando usado a ONU,
  // criar mensagens criativas para o país que emitiu a reunião e os países que votaram".
  //
  // A regra que orienta o texto: uma sessão do Conselho não é um placar, é uma FOTOGRAFIA
  // DIPLOMÁTICA. Quem convocou expôs a mão; quem votou a favor fez um inimigo; quem votou
  // contra fez uma promessa; quem se calou disse tudo. É isso que os textos abaixo contam —
  // e é por isso que a chamada nominal viaja no veredito. Daqui pra frente, na sala,
  // todo mundo lembra quem levantou a mão.
  const RAJADA_APROVADA = [
    (a, p, r) => `O martelo desceu em ${r}. ${a} construiu a maioria e ${r} sai da sala com ${p} carimbado na testa.`,
    (a, p, r) => `${r} entrou como potência e saiu como réu condenado. ${a} contou os votos antes de abrir o envelope — e contou certo.`,
    (a, p, r) => `Não foi unanimidade, foi o suficiente. ${p} contra ${r}, com a assinatura de ${a} embaixo.`,
    (a, p, r) => `${a} pediu a cabeça de ${r} e a mesa entregou. ${p} entra em vigor antes de a poeira assentar.`,
  ];
  const RAJADA_REJEITADA = [
    (a, p, r) => `${a} abriu o envelope, apontou para ${r} — e a mesa virou as costas. ${p} morreu na votação.`,
    (a, p, r) => `${r} sai de pé. ${a} gastou o capital político da sessão e levou de volta o envelope vazio.`,
    (a, p, r) => `A acusação não convenceu ninguém além de quem a escreveu. ${r} absolvido, ${a} exposto.`,
    (a, p, r) => `O Conselho preferiu o benefício da dúvida. ${p} rejeitada — e agora ${r} sabe exatamente quem quis afundá-lo.`,
  ];

  function nomesDe(lista) {
    if (!lista.length) return '';
    if (lista.length === 1) return lista[0];
    return `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}`;
  }

  // O rol de quem votou o quê, em prosa — é o que vira fofoca e vingança depois.
  function chamadaNominal(d) {
    const favor = (d.votos || []).filter((x) => x.v === 'sim').map((x) => nomeDe(x.iso));
    const contra = (d.votos || []).filter((x) => x.v === 'nao').map((x) => nomeDe(x.iso));
    const partes = [];
    if (favor.length) partes.push(`${nomesDe(favor)} ${favor.length > 1 ? 'votaram' : 'votou'} pela condenação`);
    if (contra.length) partes.push(`${nomesDe(contra)} ${contra.length > 1 ? 'seguraram' : 'segurou'} a mão do acusado`);
    const calados = Math.max(0, (d.total || 0) - favor.length - contra.length);
    if (calados > 0) partes.push(`${calados} ${calados > 1 ? 'delegações preferiram' : 'delegação preferiu'} o silêncio — que numa mesa dessas também é voto`);
    return partes.join('; ') + '.';
  }

  // O PLANTÃO DO CONSELHO tem tratamento próprio (`tom: 'onu'`): faixa maior, selo de
  // martelo e o texto inteiro, sem corte. Uma sessão da ONU não pode passar na tela com
  // o mesmo peso de "Brent sobe 2 dólares".
  function publicarImprensa(d, def, nomeAcusado) {
    const quem = d.presidenteNome || 'uma delegação';
    const rajada = d.aprovada ? RAJADA_APROVADA : RAJADA_REJEITADA;
    const idx = Math.abs(String(d.id).split('').reduce((h, ch) => h + ch.charCodeAt(0), 0)) % rajada.length;
    const manchete = rajada[idx](quem, def.rot.toLowerCase(), nomeAcusado);

    dispararBreaking(jogo, {
      assunto: d.aprovada
        ? `Conselho de Segurança aprova ${def.rot.toLowerCase()} contra ${nomeAcusado}`
        : `Conselho de Segurança rejeita punição a ${nomeAcusado}`,
      contexto: `${manchete} Placar: ${d.sim} a ${d.nao}. Sessão convocada por ${quem} (${nomeDe(d.presidente)}) sob o tema "${d.titulo}".${d.motivo ? ` Motivo alegado: ${d.motivo}` : ''} ${chamadaNominal(d)}`,
      tom: 'onu', iso: d.acusado,
    });

    // O X cobre por outro ângulo: a manchete conta o QUE aconteceu, o feed conta QUEM
    // fez acontecer. As duas peças juntas é que fazem a sala se lembrar da sessão.
    jogo._empilharFeed?.([
      { tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: d.aprovada ? '#ff3b5c' : '#22e0a0', texto: manchete },
      { tipo: 'sistema', handle: '⚖ Chamada nominal', cor: '#35e0ff', texto: chamadaNominal(d) },
    ]);
    if (d.motivo) {
      jogo._empilharFeed?.([{ tipo: 'jogador', handle: `⚖ ${quem}`, paisOrigem: d.presidente, paisAlvo: d.acusado,
        texto: `"${d.motivo}" — a acusação lida na abertura da sessão contra ${nomeAcusado}.`, cor: '#35e0ff' }]);
    }
  }

  // A pena entra no MEU estado e passa a doer.
  function registrarPenaContraMim(d, def) {
    const e = jogo.estado;
    e.penasONU = e.penasONU || [];
    // Reincidência não empilha duas penas iguais: RENOVA o prazo. Empilhar viraria
    // congelamento eterno com dois cliques, e a pena perderia o peso de ser uma decisão.
    const igual = e.penasONU.find((p) => p.tipo === d.pena && p.contra === meuIso && p.turnos > 0);
    if (igual) igual.turnos = Math.max(igual.turnos, d.turnos);
    else e.penasONU.push({ tipo: d.pena, por: 'ONU', contra: meuIso, desde: Date.now(), turnos: d.turnos, titulo: d.titulo });

    aplicarEfeitos(e, def.efeitos || {});
    // SANÇÃO ECONÔMICA reusa o dreno que já existe (jogo/economia.js · custoSancoes),
    // o mesmo que uma sanção de jogador alimenta — a linha aparece no painel Governar
    // com a assinatura do Conselho em vez de um país.
    if (d.pena === 'sancao_economica') {
      e.sancoesSofridas = e.sancoesSofridas || [];
      if (!e.sancoesSofridas.some((s) => s.por === 'ONU')) {
        e.sancoesSofridas.push({ por: 'ONU', nome: 'Conselho de Segurança', intensidade: 45, desde: Date.now() });
      }
    }
    sincronizarTravas();
    alertaUrgente({
      titulo: `⚖ ${def.rot} CONTRA VOCÊ`,
      texto: `O Conselho decidiu por ${d.sim} a ${d.nao}. ${def.longa} A pena vale por ${d.turnos} meses.`,
      tom: 'ataque', comSom: false,
    });
  }

  // A CENA DO MARTELO: o veredito merece uma tela, não uma linha no feed.
  function telaVeredito(d, def, nomeAcusado) {
    fecharSala();
    const over = document.createElement('div');
    over.className = `onu-veredito ${d.aprovada ? 'condena' : 'absolve'}`;
    over.innerHTML = `<div class="onu-ver-card" style="--pc:${d.aprovada ? def.cor : 'var(--verde)'}">
      <div class="onu-ver-selo">${ico('gavel', 26)}</div>
      <div class="onu-ver-rot">${d.aprovada ? 'PENA APROVADA' : 'PENA REJEITADA'}</div>
      <div class="onu-ver-alvo">${flagImg(d.acusado, 'onu-ver-flag')} <b>${esc(nomeAcusado)}</b></div>
      <div class="onu-ver-pena">${ico(def.ic, 15)} ${esc(def.rot)}${d.aprovada ? ` · ${d.turnos} meses` : ''}</div>
      <div class="onu-ver-placar"><b>${d.sim}</b> a favor · <b>${d.nao}</b> contra · ${d.total} presentes</div>
      <div class="onu-ver-txt">${esc(d.aprovada ? def.longa : 'A mesa não alcançou maioria. O réu sai de pé — e todos na sala sabem quem votou como.')}</div>
      <button class="onu-ver-ok">ENTENDIDO</button>
    </div>`;
    palco().appendChild(over);
    over.querySelector('.onu-ver-ok').addEventListener('click', () => over.remove());
    setTimeout(() => over.remove(), 12000);
  }

  // ── O TEMPO CORROI A PENA ───────────────────────────────────────────
  // Chamado a cada batida do mundo (1 mês). Decrementa prazos, sangra as penas
  // recorrentes e apaga o que expirou — sem isto, uma pena era prisão perpétua.
  function aplicarPenasNoBeat() {
    const e = jogo.estado;
    if (!Array.isArray(e.penasONU) || !e.penasONU.length) return;
    const vivas = [];
    const expiradas = [];
    for (const p of e.penasONU) {
      p.turnos = (Number(p.turnos) || 0) - 1;
      if (p.turnos > 0) vivas.push(p); else expiradas.push(p);
    }
    e.penasONU = vivas;
    for (const p of vivas) {
      if (p.contra !== meuIso) continue;
      const def = PENAS[p.tipo];
      if (def?.porTurno) aplicarEfeitos(e, def.porTurno);
    }
    for (const p of expiradas) {
      if (p.contra !== meuIso) continue;
      if (p.tipo === 'sancao_economica' && Array.isArray(e.sancoesSofridas)) {
        e.sancoesSofridas = e.sancoesSofridas.filter((s) => s.por !== 'ONU');
      }
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#22e0a0',
        texto: `${PENAS[p.tipo]?.rot || 'A pena'} contra a nossa nação expirou. O prazo do Conselho acabou — e ninguém pediu renovação.` }]);
    }
    sincronizarTravas();
  }

  // ESPELHO LEGÍVEL DAS TRAVAS: `penasONU` é a verdade, mas quem checa lá fora quer uma
  // pergunta curta. Estes dois campos são derivados — nunca escritos à mão em outro lugar.
  function sincronizarTravas() {
    const e = jogo.estado;
    const turnoAtual = Number(jogo.turno ?? e.turno ?? 0);
    const cong = penaAtiva(e, 'congelar_recursos');
    const emb = penaAtiva(e, 'embargo_armas');
    if (cong) e.recursosCongelados = { ate: turnoAtual + cong.turnos, por: 'ONU', turnos: cong.turnos };
    else delete e.recursosCongelados;
    if (emb) e.embargoArmas = { ate: turnoAtual + emb.turnos, por: 'ONU', turnos: emb.turnos };
    else delete e.embargoArmas;
  }
  sincronizarTravas();   // save carregado com pena de pé: o espelho nasce coerente

  return {
    abrirConvocacao,
    abrirSala,
    // O botão do cabeçalho chama ISTO: com mesa aberta vai pra sessão, sem mesa convoca.
    abrir: () => (sessao && !sessao.encerrada ? abrirSala() : abrirConvocacao()),
    aoEvento,
    aoDireto,
    temReuniaoAtiva: () => !!(sessao && !sessao.encerrada),
    aplicarPenasNoBeat,
  };
}

function fmt(s) {
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
