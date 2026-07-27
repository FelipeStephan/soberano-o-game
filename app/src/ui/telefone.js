// ═══════════════════════════════════════════════════════════════════════
// TELEFONE VERMELHO — entrar em contato com outro presidente (online)
// ═══════════════════════════════════════════════════════════════════════
// Clicar num país controlado por HUMANO ganha "ENTRAR EM CONTATO": mandar
// MENSAGEM (DM privada, fora do feed público) ou LIGAR — chamada de voz de
// verdade (net/chamada.js). O fluxo de ligar é cinema de gabinete: escolha do
// microfone → "ESTABELECENDO LINHA SEGURA" com a animação de criptografia →
// tocando do outro lado (aceita/recusa num cartão) → conversa com efeito de
// telefone e estática de fundo → encerrar.
//
// MODO AVIÃO: o famoso "deixar o telefone desligado". Liga/desliga no próprio
// painel, persiste no navegador, e quem ligar ouve "o telefone está desligado".
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { criarTelefonia, listarMicrofones, audioCtx } from '../net/chamada.js';
import { ico } from './icones.js';

// Um blip curto (WebAudio) pra anunciar mensagem — sem depender de arquivo.
function blip(freq = 880, dur = 0.09) {
  try {
    const ac = audioCtx(); const o = ac.createOscillator(); const g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = freq; g.gain.value = 0.0001;
    o.connect(g); g.connect(ac.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.stop(ac.currentTime + dur + 0.02);
  } catch { /* áudio bloqueado: só visual */ }
}
function vibrar(padrao) { try { navigator.vibrate?.(padrao); } catch { /* sem suporte */ } }

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const flagDe = (iso) => (ISO2_DE[iso] ? `<img class="tel-flag" src="${bandeira(ISO2_DE[iso], 80)}" alt="" onerror="this.style.display='none'">` : '');
const CHAVE_AVIAO = 'soberano_modo_aviao';

export function montarTelefonia(jogo, net, { globoCtrl } = {}) {
  const meuIso = jogo.estado.iso || 'USA';
  let modoAviao = localStorage.getItem(CHAVE_AVIAO) === '1';
  const dms = new Map();          // iso → [{de, texto, ts}]
  let cronometro = null; let segundos = 0;

  // ── o motor de chamada, com a UI reagindo a cada estado ──────────────
  const tel = criarTelefonia({
    net, meuIso,
    onEstado: (s, extra) => {
      if (s === 'chamando') telaChamada(extra.alvo, 'DISCANDO — LINHA SEGURA', 'chamando');
      else if (s === 'tocando') telaRecebendo(extra.de, extra.deNome);
      // ESTABELECENDO: a tela que faltava. Quem atendia ficava sem UI nenhuma
      // enquanto o ICE negociava — sem status, sem botão de abortar, sem saída.
      else if (s === 'estabelecendo') telaChamada(extra.alvo, 'ESTABELECENDO LINHA', 'chamando');
      else if (s === 'conectada') telaConectada(extra.alvo);
      // Conectou e nenhuma voz chegou: dizer isso é melhor que deixar o jogador
      // falando pro vazio. Não derruba a chamada — só troca o rótulo.
      else if (s === 'sem_audio') avisarSemAudio();
      else if (s === 'sem_resposta') telaFim(`${nomeDe(extra.alvo || extra.de)} não atendeu — a linha caiu por tempo.`, 'ruim');
      else if (s === 'recusada') telaFim(`${nomeDe(extra.de)} recusou a chamada.`, 'ruim');
      else if (s === 'ocupado') telaFim(`A linha de ${nomeDe(extra.de)} está ocupada.`, 'ruim');
      else if (s === 'aviao') telaFim(`O telefone do outro lado está DESLIGADO (modo avião).`, 'ruim');
      else if (s === 'offline') telaFim(`${nomeDe(extra.alvo)} não está na sala agora.`, 'ruim');
      else if (s === 'erro') telaFim(extra.motivo || 'Falha na linha.', 'ruim');
      // encerrada também precisa matar a vibração: o auto-recusa por tempo esgotado
      // fecha o cartão pela rede, sem ninguém clicar em nada.
      else if (s === 'encerrada') { pararCronometro(); pararVibra(); fecharOverlays(); }
    },
  });

  const nomeDe = (iso) => PAISES[iso]?.nome || iso;

  // recebe os bilhetes do canal `direto` (chamada + DM). Retorna true se consumiu.
  async function aoDireto(msg) {
    if (await tel.receber(msg, { modoAviao })) return true;
    if (msg.tipo === 'dm') {
      const th = dms.get(msg.dePais) || []; th.push({ de: msg.dePais, texto: msg.dados?.texto || '', ts: msg.ts });
      dms.set(msg.dePais, th);
      const aberto = document.querySelector(`.tel-chat[data-iso="${msg.dePais}"]`);
      if (aberto) { pintarThread(aberto, msg.dePais); blip(660, 0.07); }
      else notifDM(msg.dePais, msg.deNome, msg.dados?.texto || '');   // cartão clicável + blip + vibra
      return true;
    }
    return false;
  }

  function fecharOverlays() { document.querySelectorAll('.tel-over, .tel-toque').forEach((e) => e.remove()); }
  function pararCronometro() { clearInterval(cronometro); cronometro = null; segundos = 0; }
  const palco = () => document.getElementById('globo-wrap') || document.body;

  // ── PAINEL "ENTRAR EM CONTATO" ───────────────────────────────────────
  function abrirContato(alvoIso) {
    fecharOverlays();
    const nome = nomeDe(alvoIso);
    const over = document.createElement('div');
    over.className = 'tel-over';
    over.innerHTML = `<div class="tel-painel">
      <div class="tel-cab">${flagDe(alvoIso)}
        <div class="tel-tit"><h2>ENTRAR EM CONTATO</h2><span>${esc(nome)} · canal reservado entre chefes de Estado</span></div>
        <button class="pp-fechar tel-x">${ico('x', 15)}</button>
      </div>
      <div class="tel-opcoes">
        <button class="tel-op msg" id="tel-msg">${ico('message-square', 17)} <span>Mensagem<small>linha de texto privada — só vocês dois leem</small></span></button>
        <button class="tel-op ligar" id="tel-ligar">${ico('phone', 17)} <span>Ligar<small>voz ao vivo, linha criptografada</small></span></button>
      </div>
      <button class="tel-aviao ${modoAviao ? 'on' : ''}" id="tel-aviao">${ico('plane', 13)}
        <span>${modoAviao ? 'MODO AVIÃO LIGADO — ninguém te liga' : 'Modo avião desligado — você pode receber chamadas'}</span>
        <i>${modoAviao ? 'tocar para atender de novo' : 'tocar para ficar incomunicável'}</i></button>
    </div>`;
    palco().appendChild(over);
    over.addEventListener('click', (ev) => { if (ev.target === over) over.remove(); });
    over.querySelector('.tel-x').addEventListener('click', () => over.remove());
    over.querySelector('#tel-aviao').addEventListener('click', () => {
      modoAviao = !modoAviao;
      localStorage.setItem(CHAVE_AVIAO, modoAviao ? '1' : '0');
      over.remove(); abrirContato(alvoIso);
    });
    over.querySelector('#tel-msg').addEventListener('click', () => { over.remove(); abrirChat(alvoIso); });
    over.querySelector('#tel-ligar').addEventListener('click', () => { over.remove(); escolherMicELigar(alvoIso); });
  }

  // ── ESCOLHER MICROFONE → LIGAR ───────────────────────────────────────
  async function escolherMicELigar(alvoIso) {
    const over = document.createElement('div');
    over.className = 'tel-over';
    over.innerHTML = `<div class="tel-painel"><div class="tel-cab">
      <div class="tel-tit"><h2>PREPARANDO A LINHA</h2><span>autorizando o microfone…</span></div>
      <button class="pp-fechar tel-x">${ico('x', 15)}</button></div>
      <div class="tel-mics" id="tel-mics"><div class="tel-aguarde">${ico('mic', 14)} pedindo permissão ao navegador…</div></div></div>`;
    palco().appendChild(over);
    over.querySelector('.tel-x').addEventListener('click', () => over.remove());
    const { mics, erro } = await listarMicrofones();
    const cx = over.querySelector('#tel-mics');
    if (erro || !mics.length) { cx.innerHTML = `<div class="tel-aguarde ruim">${ico('mic-off', 14)} ${esc(erro || 'Nenhum microfone encontrado.')}</div>`; return; }
    cx.innerHTML = `<div class="tel-mics-rot">${ico('mic', 11)} QUAL MICROFONE O GABINETE USA?</div>
      ${mics.map((m, i) => `<button class="tel-mic" data-id="${esc(m.id)}">${ico('mic', 13)} <span>${esc(m.nome)}</span>${i === 0 ? '<i>padrão</i>' : ''}</button>`).join('')}`;
    cx.querySelectorAll('.tel-mic').forEach((b) => b.addEventListener('click', async () => {
      over.remove();
      await tel.ligar(alvoIso, b.dataset.id || undefined);
    }));
  }

  // ── AS TELAS DA CHAMADA (cinema de gabinete) ─────────────────────────
  function telaChamada(alvoIso, statusTxt, cls) {
    fecharOverlays();
    const over = document.createElement('div');
    over.className = 'tel-over chamada';
    over.innerHTML = `<div class="tel-linha ${cls}">
      <div class="tel-cript"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="tel-alvo">${flagDe(alvoIso)}<div><b>${esc(nomeDe(alvoIso))}</b><span>PALÁCIO PRESIDENCIAL</span></div></div>
      <div class="tel-status" id="tel-status">${esc(statusTxt)}<span class="tel-pontos"><i>.</i><i>.</i><i>.</i></span></div>
      <div class="tel-sub">canal criptografado · protocolo SOBERANO-1</div>
      <button class="tel-desligar" id="tel-desligar">${ico('phone-off', 15)} ABORTAR</button>
    </div>`;
    palco().appendChild(over);
    // ABORTAR serve nos dois papéis: se a chamada ainda está TOCANDO aqui (atendi e
    // desisti antes de a linha subir), o certo é recusar — assim o outro lado sabe.
    over.querySelector('#tel-desligar').addEventListener('click', () => {
      if (tel.tocando()) tel.recusar('recusou'); else tel.encerrar();
    });
  }

  // Aviso dentro da tela de conversa: linha aberta, mas nenhuma voz chegando.
  // Sem isto o jogador jurava estar conectado enquanto falava pro vazio.
  function avisarSemAudio() {
    const alvo = document.querySelector('.tel-over.conectada .tel-alvo span');
    if (alvo) { alvo.className = 'ruim'; alvo.textContent = 'LINHA ABERTA — MAS SEM ÁUDIO DO OUTRO LADO'; }
  }

  function telaConectada(alvoIso) {
    fecharOverlays(); pararCronometro();
    const over = document.createElement('div');
    over.className = 'tel-over conectada';
    over.innerHTML = `<div class="tel-linha viva">
      <div class="tel-ondas"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="tel-alvo">${flagDe(alvoIso)}<div><b>${esc(nomeDe(alvoIso))}</b><span class="bom">LINHA ABERTA — FALE, PRESIDENTE</span></div></div>
      <div class="tel-timer" id="tel-timer">00:00</div>
      <div class="tel-controles">
        <button class="tel-ctl" id="tel-mute">${ico('mic', 15)} <span>mudo</span></button>
        <button class="tel-ctl encerrar" id="tel-fim">${ico('phone-off', 15)} <span>encerrar</span></button>
      </div>
    </div>`;
    palco().appendChild(over);
    const timerEl = over.querySelector('#tel-timer');
    cronometro = setInterval(() => { segundos += 1; timerEl.textContent = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`; }, 1000);
    over.querySelector('#tel-mute').addEventListener('click', (ev) => {
      const m = tel.mutar();
      ev.currentTarget.classList.toggle('on', m);
      ev.currentTarget.innerHTML = `${ico(m ? 'mic-off' : 'mic', 15)} <span>${m ? 'mudo (ligado)' : 'mudo'}</span>`;
    });
    over.querySelector('#tel-fim').addEventListener('click', () => tel.encerrar());
  }

  // chamada RECEBIDA: cartãozinho urgente — aceitar/recusar (o pedido: "um pequeno na tela")
  function telaRecebendo(dePais, deNome) {
    document.querySelectorAll('.tel-toque').forEach((e) => e.remove());
    const el = document.createElement('div');
    el.className = 'tel-toque';
    el.innerHTML = `<div class="tel-toque-in">
      <div class="tel-toque-anel"><i></i>${flagDe(dePais)}</div>
      <div class="tel-toque-txt"><b>${esc(deNome || nomeDe(dePais))}</b><span>${esc(nomeDe(dePais))} · CHAMADA NA LINHA SEGURA</span></div>
      <div class="tel-toque-acoes">
        <button class="tel-atender" id="tel-sim">${ico('phone', 15)}</button>
        <button class="tel-rejeitar" id="tel-nao">${ico('phone-off', 15)}</button>
      </div>
    </div>`;
    document.body.appendChild(el);
    el.querySelector('#tel-sim').addEventListener('click', async () => {
      el.remove(); pararVibra();
      // A tela vem ANTES de pedir o microfone: a permissão do navegador pode
      // demorar (ou ficar pendente) e o jogador não pode ficar olhando pro nada.
      telaChamada(dePais, 'AUTORIZANDO O MICROFONE', 'chamando');
      // atender também pergunta o microfone (uma vez; rápido)
      const { mics } = await listarMicrofones();
      await tel.atender(mics?.[0]?.id);
    });
    el.querySelector('#tel-nao').addEventListener('click', () => { el.remove(); pararVibra(); tel.recusar(); });
    // VIBRAÇÃO enquanto toca (mobile): padrão de telefone até atender/recusar/timeout
    vibrar([500, 300, 500, 300, 500]);
    vibraTimer = setInterval(() => vibrar([500, 300, 500]), 2200);
    clearTimeout(vibraFim); vibraFim = setTimeout(pararVibra, 30000);
  }
  let vibraTimer = null; let vibraFim = null;
  function pararVibra() { clearInterval(vibraTimer); clearTimeout(vibraFim); vibrar(0); }

  // Notificação de MENSAGEM: cartão no canto, clicável (abre o chat), com blip + vibra.
  function notifDM(iso, deNome, texto) {
    document.querySelectorAll(`.tel-dm-notif[data-iso="${iso}"]`).forEach((e) => e.remove());
    blip(720, 0.08); vibrar(120);
    const el = document.createElement('div');
    el.className = 'tel-dm-notif'; el.dataset.iso = iso;
    el.innerHTML = `<div class="tdn-in">${flagDe(iso)}
      <div class="tdn-txt"><b>${esc(deNome || nomeDe(iso))}</b><span>${esc(texto).slice(0, 90)}</span></div>
      ${ico('message-square', 15)}</div>`;
    document.body.appendChild(el);
    el.addEventListener('click', () => { el.remove(); abrirChat(iso); });
    setTimeout(() => el.remove(), 9000);
  }

  function telaFim(msg, tom) {
    fecharOverlays(); pararCronometro();
    const over = document.createElement('div');
    over.className = 'tel-over';
    over.innerHTML = `<div class="tel-painel fim"><div class="tel-fim-ic ${tom}">${ico(tom === 'ruim' ? 'phone-off' : 'phone', 22)}</div>
      <p>${esc(msg)}</p><button class="tel-ok">ENTENDIDO</button></div>`;
    palco().appendChild(over);
    over.querySelector('.tel-ok').addEventListener('click', () => over.remove());
    setTimeout(() => over.remove(), 5000);
  }

  // ── DM: a linha de texto privada ─────────────────────────────────────
  function pintarThread(el, iso) {
    const corpo = el.querySelector('.tel-chat-corpo');
    const th = dms.get(iso) || [];
    corpo.innerHTML = th.length
      ? th.map((m) => `<div class="tel-dm ${m.de === meuIso ? 'meu' : ''}"><span>${esc(m.texto)}</span></div>`).join('')
      : `<div class="tel-chat-vazio">${ico('lock', 12)} Canal privado. Só vocês dois leem — nada disto sai no X.</div>`;
    corpo.scrollTop = corpo.scrollHeight;
  }

  function abrirChat(alvoIso) {
    document.querySelectorAll('.tel-chat').forEach((e) => e.remove());
    const el = document.createElement('div');
    el.className = 'tel-chat';
    el.dataset.iso = alvoIso;
    el.innerHTML = `<div class="tel-chat-cab">${flagDe(alvoIso)} <b>${esc(nomeDe(alvoIso))}</b><span>linha privada</span>
      <button class="pp-fechar tel-x">${ico('x', 13)}</button></div>
      <div class="tel-chat-corpo"></div>
      <form class="tel-chat-form"><input maxlength="280" placeholder="Escreva ao presidente…" autocomplete="off"><button type="submit">${ico('send', 14)}</button></form>`;
    palco().appendChild(el);
    pintarThread(el, alvoIso);
    el.querySelector('.tel-x').addEventListener('click', () => el.remove());
    el.querySelector('.tel-chat-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const inp = el.querySelector('input');
      const texto = inp.value.trim();
      if (!texto) return;
      net.direto('dm', alvoIso, { texto });
      const th = dms.get(alvoIso) || []; th.push({ de: meuIso, texto, ts: Date.now() }); dms.set(alvoIso, th);
      inp.value = '';
      pintarThread(el, alvoIso);
    });
  }

  return { abrirContato, aoDireto, emAviao: () => modoAviao };
}
