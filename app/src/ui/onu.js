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

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;
const flagUrl = (iso, w = 160) => (ISO2_DE[iso] ? bandeira(ISO2_DE[iso], w) : null);
const flagImg = (iso, cls = 'onu-flag') => {
  const u = flagUrl(iso, 80);
  return u ? `<img class="${cls}" src="${u}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="${cls} sem">${esc(iso)}</span>`;
};

// Duração da sessão em segundos. 90s é o tempo de UMA discussão quente: dá pra
// acusar, se defender e votar — e curto o bastante pra a sala não esfriar.
const DURACAO = 90;

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
  const encerradas = new Set(); // ids já julgados: um `onu_convocar` repetido não ressuscita a mesa

  const globo = () => (typeof globoCtrl === 'function' ? globoCtrl() : globoCtrl);
  const palco = () => document.getElementById('globo-wrap') || document.body;
  const meuNome = () => (onlineCtrl?.jogadores?.() || []).find((j) => j.pais === meuIso)?.nome || 'Você';
  // Só HUMANOS podem ser réus: a cena inteira depende do acusado estar na mesa pra
  // se defender. Sancionar um NPC seria aplicar dano num estado que ninguém habita.
  const humanos = () => (onlineCtrl?.jogadores?.() || []).filter((j) => j.pais && j.pais !== meuIso);

  // ── ESTADO DA SESSÃO ────────────────────────────────────────────────
  function novaSessao(d, dePais, deNome) {
    return {
      id: d.id, titulo: d.titulo || 'Sessão extraordinária',
      acusado: d.acusado, pena: PENAS[d.pena] ? d.pena : 'sancao_economica',
      turnos: Number(d.turnos) || PENAS[d.pena]?.turnos || 6,
      duracao: Number(d.duracao) || DURACAO,
      inicio: Number(d.inicio) || agoraServidor(),
      presidente: dePais, presidenteNome: deNome || nomeDe(dePais),
      presentes: new Map(),   // iso → nome do jogador
      votos: new Map(),       // iso → 'sim' | 'nao'
      falas: [],              // { iso, nome, texto }
      palavra: [],            // fila de oradores (isos), na ordem do pedido
      entrei: false, encerrada: false, veredito: null,
    };
  }

  const souPresidente = () => !!sessao && sessao.presidente === meuIso;
  const souReu = () => !!sessao && sessao.acusado === meuIso;
  const restanteS = () => (sessao ? Math.max(0, Math.ceil((sessao.inicio + sessao.duracao * 1000 - agoraServidor()) / 1000)) : 0);

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

    function render() {
      const def = PENAS[pena];
      modal.innerHTML = `<div class="onu-painel">
        <div class="onu-cab">
          <div class="onu-ic">${ico('gavel', 20)}</div>
          <div class="onu-tit"><h2>CONVOCAR O CONSELHO</h2><span>Sessão extraordinária — a sala inteira é notificada</span></div>
          <button class="pp-fechar onu-x">${ico('x', 16)}</button>
        </div>
        ${alvos.length ? `
        <div class="onu-corpo">
          <label class="onu-rot">${ico('file-text', 11)} TEMA DA SESSÃO</label>
          <input class="onu-input" id="onu-titulo" maxlength="90" placeholder="Ex.: ofensiva não provocada contra a Ucrânia" autocomplete="off">

          <label class="onu-rot">${ico('crosshair', 11)} PAÍS-FOCO — QUEM SENTA NO BANCO DOS RÉUS</label>
          <div class="onu-alvos">
            ${alvos.map((j) => `<button class="onu-alvo ${j.pais === foco ? 'on' : ''}" data-iso="${esc(j.pais)}">
              ${flagImg(j.pais, 'onu-alvo-flag')}
              <span><b>${esc(nomeDe(j.pais))}</b><i>${esc(j.nome || 'presidente')}</i></span>
            </button>`).join('')}
          </div>

          <label class="onu-rot">${ico('scale', 11)} AÇÃO PROPOSTA — A PENA QUE VAI A VOTO</label>
          <div class="onu-penas">
            ${Object.entries(PENAS).map(([k, p]) => `<button class="onu-pena ${k === pena ? 'on' : ''}" data-pena="${k}" style="--pc:${p.cor}">
              <span class="onu-pena-ic">${ico(p.ic, 15)}</span>
              <span class="onu-pena-txt"><b>${esc(p.rot)}</b><i>${esc(p.curta)}</i></span>
              <span class="onu-pena-dur">${p.turnos} meses</span>
            </button>`).join('')}
          </div>

          <div class="onu-nota" style="--pc:${def.cor}">${ico('info', 13)} <span>${esc(def.longa)}</span></div>
          <div class="onu-aviso">${ico('users', 12)} <span>Maioria simples dos <b>presentes</b> decide. Empate rejeita a pena — e o réu senta à mesa, fala, mas não vota contra si mesmo.</span></div>
          <button class="onu-convocar" id="onu-go">${ico('gavel', 15)} CONVOCAR A SESSÃO</button>
        </div>` : `
        <div class="onu-vazio">${ico('users', 16)} Não há outro chefe de Estado na sala. O Conselho existe pra julgar gente de carne e osso — chame alguém pra partida.</div>`}
      </div>`;

      modal.querySelector('.onu-x').addEventListener('click', fechar);
      modal.querySelectorAll('.onu-alvo').forEach((b) => b.addEventListener('click', () => { foco = b.dataset.iso; render(); }));
      modal.querySelectorAll('.onu-pena').forEach((b) => b.addEventListener('click', () => { pena = b.dataset.pena; render(); }));
      modal.querySelector('#onu-go')?.addEventListener('click', () => {
        const titulo = modal.querySelector('#onu-titulo').value.trim()
          || `Conduta de ${nomeDe(foco)} perante o Conselho`;
        fechar();
        convocar({ titulo, acusado: foco, pena });
      });
    }
    render();
  }

  // Dispara a sessão: eu viro o PRESIDENTE dela e a sala inteira recebe o chamado.
  function convocar({ titulo, acusado, pena }) {
    if (!acusado || acusado === meuIso) return;   // ninguém convoca contra si mesmo
    const d = {
      id: `onu_${agoraServidor().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      titulo, acusado, pena, turnos: PENAS[pena]?.turnos || 6,
      inicio: agoraServidor(), duracao: DURACAO,
    };
    sessao = novaSessao(d, meuIso, meuNome());
    net.evento('onu_convocar', acusado, `convocou o Conselho de Segurança contra ${nomeDe(acusado)}: ${titulo}`, d);
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#35e0ff',
      texto: `Sessão extraordinária convocada contra ${nomeDe(acusado)}. Pena proposta: ${PENAS[pena].rot.toLowerCase()}. O mundo tem ${DURACAO}s pra decidir.` }]);
    abrirSala();           // quem convoca senta primeiro — e é o relógio dele que crava o fim
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
        sessao = novaSessao(d, ev.dePais, ev.deNome);
        sessao.presentes.set(ev.dePais, ev.deNome || nomeDe(ev.dePais));   // o presidente já está lá
        iniciarCronometro();
        chamado(ev);
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

  // O canal `direto` não é usado por aqui (a sessão é pública por natureza — é uma
  // MESA, não um bilhete). Fica exportado só pra o contrato do controlador fechar.
  function aoDireto() { return false; }

  const casa = (d) => !!(sessao && !sessao.encerrada && d && d.id === sessao.id);

  // ── O CHAMADO: o cartão que puxa todo mundo pra mesa ─────────────────
  function chamado(ev) {
    document.querySelectorAll('.onu-chamado').forEach((e) => e.remove());
    const def = PENAS[sessao.pena];
    const contraMim = sessao.acusado === meuIso;
    const el = document.createElement('div');
    el.className = `onu-chamado ${contraMim ? 'reu' : ''}`;
    el.innerHTML = `
      <div class="onu-ch-cab">${ico('gavel', 15)} <b>CONSELHO DE SEGURANÇA</b> <span>${contraMim ? 'VOCÊ É O RÉU' : 'SESSÃO ABERTA'}</span></div>
      <div class="onu-ch-corpo">
        ${flagImg(sessao.acusado, 'onu-ch-flag')}
        <div class="onu-ch-txt">
          <b>${esc(nomeDe(sessao.acusado))}</b>
          <span>${esc(sessao.titulo)}</span>
          <i style="--pc:${def.cor}">${ico(def.ic, 11)} ${esc(def.rot)}</i>
        </div>
      </div>
      <div class="onu-ch-quem">convocada por ${esc(ev.deNome || nomeDe(ev.dePais))} (${esc(nomeDe(ev.dePais))})</div>
      <div class="onu-acoes">
        <button class="onu-sim">${ico('log-in', 14)} ${contraMim ? 'ENCARAR A MESA' : 'TOMAR ASSENTO'}</button>
        <button class="onu-nao">${ico('x', 14)} IGNORAR</button>
      </div>`;
    document.body.appendChild(el);
    try { tocarEfeito('radar', { volume: 0.45 }); } catch { /* sem áudio */ }
    if (contraMim) {
      // O ALARME É SAGRADO: faixa vermelha, sem sirene. Ser acusado não é o mesmo que
      // levar um míssil — o som fica reservado pro impacto.
      alertaUrgente({
        titulo: '⚖ VOCÊ FOI LEVADO AO CONSELHO',
        texto: `${ev.deNome || nomeDe(ev.dePais)} convocou o Conselho de Segurança contra você: "${sessao.titulo}". A pena proposta é ${def.rot.toLowerCase()}. Você tem direito à palavra — mas não vota.`,
        tom: 'ataque', comSom: false,
      });
    }
    jogo._empilharFeed?.([{ tipo: 'jogador', handle: `⚖ ${ev.deNome || nomeDe(ev.dePais)}`, paisOrigem: ev.dePais, paisAlvo: sessao.acusado,
      texto: `Conselho de Segurança convocado contra ${nomeDe(sessao.acusado)}: ${sessao.titulo}`, cor: '#35e0ff' }]);
    const g = globo();
    g?.ondaRadar?.(g.ondeEsta?.(sessao.acusado), { cor: 0x35e0ff, max: 45 });
    el.querySelector('.onu-sim').addEventListener('click', () => { el.remove(); abrirSala(); });
    el.querySelector('.onu-nao').addEventListener('click', () => el.remove());
    // A sessão dura 90s: um cartão que sobrevive ao julgamento é só lixo na tela.
    setTimeout(() => el.remove(), Math.max(4000, restanteS() * 1000));
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
          ${sessao.palavra.length ? `<div class="onu-fila-oradores">${sessao.palavra.map((iso, i) => `<span class="onu-orador ${i === 0 ? 'agora' : ''}">${flagImg(iso, 'onu-or-flag')} ${esc(nomeDe(iso))}${i === 0 ? ' <i>com a palavra</i>' : ''}</span>`).join('')}</div>` : ''}
          <div class="onu-falas" id="onu-falas">
            ${sessao.falas.length ? sessao.falas.map((f) => `<div class="onu-fala ${f.iso === meuIso ? 'meu' : ''} ${f.iso === sessao.acusado ? 'do-reu' : ''}">
                <b>${flagImg(f.iso, 'onu-fl-flag')} ${esc(nomeDe(f.iso))}</b><span>${esc(f.texto)}</span>
              </div>`).join('')
              : `<div class="onu-falas-vazio">${ico('message-square', 12)} A mesa está em silêncio. Alguém precisa começar — acusação ou defesa.</div>`}
          </div>
          <form class="onu-form" id="onu-form"><input id="onu-msg" maxlength="240" placeholder="Falar à mesa…" autocomplete="off"><button type="submit">${ico('send', 14)}</button></form>
          <div class="onu-semvoz">${ico('mic-off', 10)} microfone da sala indisponível nesta versão — a palavra corre por aqui</div>
        </aside>
      </div>
    </div>`;

    over.querySelector('.onu-sair').addEventListener('click', fecharSala);
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
    if (!sessao || sessao.encerrada) return;
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
    };
    net.evento('onu_veredito', sessao.acusado, d.aprovada ? 'O Conselho aprovou a pena.' : 'O Conselho rejeitou a pena.', d);
    aplicarVeredito(d);
  }

  function dissolver() {
    if (!sessao) return;
    encerradas.add(sessao.id);
    sessao.encerrada = true;
    clearInterval(tique); tique = null;
    fecharSala();
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: '#7488ad',
      texto: `A sessão contra ${nomeDe(sessao.acusado)} se dissolveu sem veredito. Sem mesa, não há pena — e ${nomeDe(sessao.acusado)} sai de pé.` }]);
    sessao = null;
  }

  // ── O VEREDITO E A PENA QUE MORDE ───────────────────────────────────
  function aplicarVeredito(d) {
    if (!sessao || sessao.id !== d.id || sessao.encerrada) return;
    sessao.encerrada = true;
    sessao.veredito = d;
    encerradas.add(d.id);
    clearInterval(tique); tique = null;
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
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Conselho de Segurança', cor: d.aprovada ? '#ff3b5c' : '#22e0a0',
      texto: d.aprovada
        ? `Por ${d.sim} a ${d.nao}, o Conselho aprovou ${def.rot.toLowerCase()} contra ${nomeAcusado}. A pena vale por ${d.turnos} meses.`
        : `Por ${d.sim} a ${d.nao}, o Conselho REJEITOU a pena contra ${nomeAcusado}. A mesa se dividiu e o réu sai de pé.` }]);
    const g = globo();
    g?.ondaRadar?.(g.ondeEsta?.(d.acusado), { cor: d.aprovada ? 0xff3b5c : 0x22e0a0, max: 55 });
    g?.balao?.(g.ondeEsta?.(d.acusado), d.aprovada ? def.rot : 'ABSOLVIDO', d.aprovada ? 'ruim' : 'aviso');
    sessao = null;
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
