// ═══════════════════════════════════════════════════════════════════════
// CHAMADA DE VOZ — a linha direta entre presidentes (WebRTC ponto a ponto)
// ═══════════════════════════════════════════════════════════════════════
// O pedido do dono: ligar pro outro jogador e CONVERSAR de verdade, com voz —
// pra alinhar expectativa, fechar acordo, ameaçar com educação. A voz vai
// DIRETO de um navegador ao outro (WebRTC P2P); o servidor da sala só carrega
// os bilhetes de sinalização (convite, SDP, ICE) pelo canal `direto` que já
// entrega mensagem a um país específico.
//
// O EFEITO DE TELEFONE (o "parecendo rádio" pedido): a voz passa por uma cadeia
// WebAudio antes de sair E ao chegar — passa-banda 300–3400 Hz (a banda do
// telefone real), leve saturação (waveshaper) e compressor. No que você OUVE
// entra ainda um chiado de estática baixinho: é o fundo que vende a ilusão de
// linha internacional. Tons de chamando/tocando são sintetizados (padrão
// brasileiro 425 Hz); `setSomChamando(url)` troca pelo áudio que o dono mandar.
//
// Estados: idle → chamando → tocando(recebe) → estabelecendo → conectada →
// encerrada. Modo avião mora na UI (telefone.js): aqui só existe o duto.

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

// Relógios da telefonia. Nada aqui pode ser infinito: toque eterno e "DISCANDO"
// eterno foram DOIS dos bugs relatados pelo dono.
const T_TOQUE = 35000;      // quanto tempo o telefone toca antes de desistir sozinho
const T_CHAMANDO = 40000;   // quanto tempo quem liga espera antes de "sem resposta"
const T_QUEDA = 8000;       // janela de tolerância para um 'disconnected' passageiro
const T_SEM_AUDIO = 7000;   // conectado mas sem ontrack: alguém está falando pro vazio

// ── DESTRAVA DE ÁUDIO (política de autoplay) ───────────────────────────
// Um AudioContext criado sem gesto do usuário nasce 'suspended' — e o TOQUE de uma
// chamada recebida chega pela REDE, não por clique, então ficava mudo. Solução: um
// contexto compartilhado destravado no PRIMEIRO gesto do jogador (ele já clica mil
// vezes no jogo). Depois disso, qualquer toque/estática toca na hora.
let _ctx = null;
export function audioCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}
let _primed = false;
export function primeAudio() {
  if (_primed) return;
  const desbloquear = () => { try { audioCtx(); } catch { /* sem áudio */ } };
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(ev, desbloquear, { once: false, passive: true });
  }
  _primed = true;
}

// ── MICROFONES ─────────────────────────────────────────────────────────
// Lista os microfones do computador (o dono pediu: "perguntando qual microfone
// devo utilizar"). Os rótulos só aparecem depois de uma permissão — pedimos uma
// captura curta e soltamos na hora, só pra destravar os nomes.
export async function listarMicrofones() {
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
    tmp.getTracks().forEach((t) => t.stop());
  } catch { return { erro: 'Permissão de microfone negada.', mics: [] }; }
  const devs = await navigator.mediaDevices.enumerateDevices();
  const mics = devs.filter((d) => d.kind === 'audioinput')
    .map((d, i) => ({ id: d.deviceId, nome: d.label || `Microfone ${i + 1}` }));
  return { mics };
}

// ── EFEITO DE VOZ (cadeia WebAudio) ────────────────────────────────────
// entrada → passa-alta 300 Hz → passa-baixa 3400 Hz → saturação leve → compressor.
// É a assinatura sonora de uma linha telefônica: sem graves de estúdio, sem
// brilho — voz de gabinete de crise.
// Devolve TAMBÉM a lista de nós: sem isso a cadeia do remoto ficava pendurada em
// ac.destination pra sempre (o "ruído que não para" que o dono relatou). Quem
// monta a cadeia é obrigado a guardar `nos` e desconectar tudo no fim.
// Exportada porque a sala de voz do Conselho (net/salaVoz.js) usa a MESMA cadeia —
// a sessão da ONU tem que soar como sala de rádio, não como podcast.
export function cadeiaTelefone(ctx, entrada) {
  const alta = ctx.createBiquadFilter(); alta.type = 'highpass'; alta.frequency.value = 300;
  const baixa = ctx.createBiquadFilter(); baixa.type = 'lowpass'; baixa.frequency.value = 3400;
  const shaper = ctx.createWaveShaper();
  const curva = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) { const x = (i / 128) - 1; curva[i] = Math.tanh(x * 1.8) / Math.tanh(1.8); }
  shaper.curve = curva;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.12;
  entrada.connect(alta); alta.connect(baixa); baixa.connect(shaper); shaper.connect(comp);
  return { saida: comp, nos: [entrada, alta, baixa, shaper, comp] };
}

// Estática de linha: ruído branco filtrado, BEM baixo — o fundo de "ligação de verdade".
// `parar()` é idempotente e também DESCONECTA: um `src.stop()` sozinho deixava o
// grafo colado no destino.
export function estaticaDeLinha(ctx, destino, ganho = 0.012) {
  const dur = 2;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i += 1) ch[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const filtro = ctx.createBiquadFilter(); filtro.type = 'bandpass'; filtro.frequency.value = 1800; filtro.Q.value = 0.4;
  const g = ctx.createGain(); g.gain.value = ganho;
  src.connect(filtro); filtro.connect(g); g.connect(destino);
  src.start();
  let morto = false;
  return {
    nos: [src, filtro, g],
    parar: () => {
      if (morto) return; morto = true;
      try { src.stop(); } catch { /* já parou */ }
      for (const n of [src, filtro, g]) { try { n.disconnect(); } catch { /* ok */ } }
    },
  };
}

// ── TONS DE CHAMADA ────────────────────────────────────────────────────
// Padrão nacional: 425 Hz, 1s tocando / 4s de silêncio (chamando); o toque de quem
// RECEBE é mais insistente. Sintetizados — trocáveis pelo áudio do dono via URL.
let SOM_CHAMANDO_URL = null;
export function setSomChamando(url) { SOM_CHAMANDO_URL = url; }

function tocarTom(ctx, { freq = 425, on = 1000, off = 4000 } = {}) {
  const g = ctx.createGain(); g.gain.value = 0;
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
  osc.connect(g); g.connect(ctx.destination); osc.start();
  let vivo = true;
  const ciclo = () => {
    if (!vivo) return;
    g.gain.setTargetAtTime(0.12, ctx.currentTime, 0.02);
    setTimeout(() => { if (vivo) g.gain.setTargetAtTime(0, ctx.currentTime, 0.03); }, on);
    timer = setTimeout(ciclo, on + off);
  };
  let timer = setTimeout(ciclo, 60);
  return {
    parar: () => {
      if (!vivo) return; vivo = false;
      clearTimeout(timer);
      try { osc.stop(); } catch { /* ok */ }
      // desconectar também: o oscilador parado ainda deixava o gain colado no destino
      for (const n of [osc, g]) { try { n.disconnect(); } catch { /* ok */ } }
    },
  };
}

function tocarAudioUrl(url) {
  const el = new Audio(url); el.loop = true; el.volume = 0.5;
  el.play().catch(() => { /* autoplay bloqueado: o tom sintético cobre */ });
  return { parar: () => { el.pause(); el.src = ''; } };
}

// ── A CHAMADA ──────────────────────────────────────────────────────────
// criarTelefonia({ net, meuIso, onEstado }) → um controlador único por sessão.
// onEstado(estado, extra) alimenta a UI: 'chamando' | 'tocando' | 'estabelecendo' |
// 'conectada' | 'sem_audio' | 'encerrada' | 'recusada' | 'ocupado' | 'aviao' |
// 'sem_resposta' | 'offline' | 'erro'.
export function criarTelefonia({ net, meuIso, onEstado }) {
  let ctx = null;              // AudioContext (criado no primeiro uso — política de autoplay)
  let pc = null;               // RTCPeerConnection ativa
  let micStream = null;        // captura crua do microfone
  let processadoDest = null;   // MediaStreamDestination com o efeito aplicado
  let estatica = null;
  let tom = null;
  let audioRemoto = null;      // <audio> tocando o outro lado
  let alvoAtual = null;        // ISO do outro presidente
  let recebendo = null;        // { dePais, deNome, sdp } enquanto toca
  let mudo = false;
  let jaConectou = false;      // 'connected' dispara várias vezes; a UI só precisa saber uma
  let encerrando = false;      // `pc.close()` pode reentrar no onconnectionstatechange ('closed')
  let recebeuTrilha = false;   // ontrack chegou? sem isso o jogador fala pro vazio

  // TODOS os nós WebAudio criados nesta chamada. O `limpar()` desliga um a um.
  // Sem esta lista, um segundo `ontrack` sobrescrevia a cadeia anterior e o chiado
  // ficava tocando pra sempre — exatamente o "som de ruído do telefone" relatado.
  let nosAudio = [];

  // Candidatos ICE que chegam ANTES de existir `pc` (ou antes do remoteDescription).
  // Este é o bug que travava a tela em DISCANDO: quem liga já dispara ICE no
  // `setLocalDescription`, mas quem recebe só monta o peer quando ATENDE — todo
  // candidato do intervalo era jogado fora e o ICE nunca fechava. Guardados por ISO.
  const pendIce = new Map();

  // Relógios. Cada um mata um travamento diferente; todos morrem no `limpar()`.
  let timerToque = null;     // toque eterno de quem recebe
  let timerChamando = null;  // "DISCANDO" eterno de quem liga
  let timerQueda = null;     // 'disconnected' passageiro não pode derrubar a linha
  let timerSemAudio = null;  // conectado, mas nenhuma trilha remota chegou

  primeAudio();                                  // instala a destrava no 1º gesto
  const audio = () => { ctx = audioCtx(); return ctx; };   // contexto compartilhado e resumido
  const estado = (s, extra) => onEstado?.(s, extra || {});

  function pararTons() { tom?.parar(); tom = null; }
  function pararRelogios() {
    for (const t of [timerToque, timerChamando, timerQueda, timerSemAudio]) clearTimeout(t);
    timerToque = null; timerChamando = null; timerQueda = null; timerSemAudio = null;
  }

  function guardarIce(iso, ice) {
    const f = pendIce.get(iso) || [];
    if (f.length > 60) return;   // teto de sanidade: ninguém precisa de 60 candidatos
    f.push(ice); pendIce.set(iso, f);
  }
  // Só dá pra aplicar candidato DEPOIS do remoteDescription — antes disso o
  // addIceCandidate lança e o candidato se perde no catch vazio.
  async function drenarIce(iso) {
    if (!pc || !pc.remoteDescription) return;
    const f = pendIce.get(iso);
    if (!f || !f.length) return;
    pendIce.delete(iso);
    for (const c of f) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* candidato velho */ }
    }
  }

  // Monta o peer: microfone → efeito → track; o remoto chega, ganha estática e toca.
  async function montarPeer(micId) {
    const ac = audio();
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: micId ? { deviceId: { exact: micId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
    });
    const fonte = ac.createMediaStreamSource(micStream);
    const efeito = cadeiaTelefone(ac, fonte);
    nosAudio.push(...efeito.nos);
    processadoDest = ac.createMediaStreamDestination();
    nosAudio.push(processadoDest);
    efeito.saida.connect(processadoDest);

    pc = new RTCPeerConnection({ iceServers: STUN });
    for (const track of processadoDest.stream.getAudioTracks()) pc.addTrack(track, processadoDest.stream);

    pc.onicecandidate = (ev) => { if (ev.candidate && alvoAtual) net.direto('tel-ice', alvoAtual, { ice: ev.candidate }); };
    pc.ontrack = (ev) => {
      recebeuTrilha = true;
      clearTimeout(timerSemAudio); timerSemAudio = null;
      // Um renegociado dispara ontrack DE NOVO. Antes, a estática velha ficava
      // órfã e tocando; agora tudo entra em `nosAudio` e a anterior é parada.
      estatica?.parar(); estatica = null;
      // O que chega também passa pelo filtro de linha + ganha a ESTÁTICA de fundo.
      const remoto = ac.createMediaStreamSource(ev.streams[0]);
      const efeitoR = cadeiaTelefone(ac, remoto);
      efeitoR.saida.connect(ac.destination);
      nosAudio.push(...efeitoR.nos);
      estatica = estaticaDeLinha(ac, ac.destination);
      // truque de compat: um <audio> mudo mantém o stream vivo em alguns navegadores
      audioRemoto = new Audio(); audioRemoto.srcObject = ev.streams[0]; audioRemoto.muted = true;
      audioRemoto.play().catch(() => { /* ok */ });
    };
    pc.onconnectionstatechange = () => {
      if (!pc) return;
      const s = pc.connectionState;
      if (s === 'connected') {
        clearTimeout(timerChamando); timerChamando = null;
        clearTimeout(timerQueda); timerQueda = null;
        pararTons();
        if (jaConectou) return;      // a UI não pode remontar a tela a cada reconexão
        jaConectou = true;
        estado('conectada', { alvo: alvoAtual });
        // Conectou mas nenhuma trilha veio: o jogador ficaria falando sozinho
        // achando que está tudo bem. Avisa em vez de fingir.
        timerSemAudio = setTimeout(() => {
          if (pc && !recebeuTrilha) estado('sem_audio', { alvo: alvoAtual });
        }, T_SEM_AUDIO);
      } else if (s === 'disconnected') {
        // 'disconnected' é rotineiramente transitório (troca de rede, ICE ressincronizando).
        // Derrubar na hora cortava conversa boa. Dá uma janela e só então encerra.
        if (!timerQueda) {
          timerQueda = setTimeout(() => {
            timerQueda = null;
            if (pc && pc.connectionState !== 'connected') encerrar(false);
          }, T_QUEDA);
        }
      } else if (s === 'failed' || s === 'closed') {
        encerrar(false);
      }
    };
  }

  function limpar() {
    pararTons();
    pararRelogios();
    estatica?.parar(); estatica = null;
    micStream?.getTracks().forEach((t) => t.stop()); micStream = null;
    // Desliga TODO nó criado — inclusive a cadeia do remoto, que antes ficava
    // colada em ac.destination depois de encerrada a chamada.
    for (const n of nosAudio) { try { n.disconnect(); } catch { /* ok */ } }
    nosAudio = [];
    processadoDest = null;
    try { pc?.close(); } catch { /* ok */ } pc = null;
    if (audioRemoto) { try { audioRemoto.pause(); } catch { /* ok */ } audioRemoto.srcObject = null; audioRemoto = null; }
    pendIce.clear();
    alvoAtual = null; recebendo = null; mudo = false; jaConectou = false; recebeuTrilha = false;
  }

  // VOCÊ liga: convite → (aceito) → offer/answer → conectada.
  async function ligar(alvoIso, micId) {
    if (pc || alvoAtual) return { erro: 'Já existe uma chamada em curso.' };
    try { audioCtx().resume?.(); } catch { /* ok */ }   // gesto do usuário: destrava o áudio aqui
    alvoAtual = alvoIso;
    try { await montarPeer(micId); } catch { limpar(); estado('erro', { motivo: 'Microfone indisponível.' }); return { erro: 'mic' }; }
    estado('chamando', { alvo: alvoIso });
    tom = SOM_CHAMANDO_URL ? tocarAudioUrl(SOM_CHAMANDO_URL) : tocarTom(audio(), { on: 1000, off: 4000 });
    // Sem isto o discador ficava girando pra sempre quando o outro simplesmente sumia.
    timerChamando = setTimeout(() => {
      timerChamando = null;
      if (jaConectou) return;
      const quem = alvoAtual;
      if (quem) net.direto('tel-fim', quem, {});   // para o telefone do outro lado também
      limpar();
      estado('sem_resposta', { alvo: quem });
    }, T_CHAMANDO);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    net.direto('tel-convite', alvoIso, { sdp: pc.localDescription });
    return { ok: true };
  }

  // O OUTRO atende (você é quem recebeu): monta o peer, responde o SDP.
  async function atender(micId) {
    if (!recebendo) return { erro: 'Nenhuma chamada tocando.' };
    const { dePais, sdp } = recebendo;
    pararTons();
    clearTimeout(timerToque); timerToque = null;
    try { audioCtx().resume?.(); } catch { /* ok */ }   // gesto do usuário: destrava o áudio aqui
    // `alvoAtual` PRECISA estar setado antes de montarPeer: o onicecandidate
    // dispara já no setLocalDescription e sem alvo o candidato era descartado.
    alvoAtual = dePais;
    // A UI não pode ficar sem tela nenhuma enquanto o ICE trabalha — era o relato
    // "eu atendo e não tem mais nada, nem popup, nem nada para desligar".
    estado('estabelecendo', { alvo: dePais });
    try { await montarPeer(micId); } catch { limpar(); estado('erro', { motivo: 'Microfone indisponível.' }); return { erro: 'mic' }; }
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    net.direto('tel-atendeu', dePais, { sdp: pc.localDescription });
    recebendo = null;
    await drenarIce(dePais);   // agora sim: os candidatos que chegaram durante o toque
    // Quem atende também precisa de um teto: se o ICE não fechar, não fica preso.
    timerChamando = setTimeout(() => {
      timerChamando = null;
      if (jaConectou) return;
      const quem = alvoAtual;
      if (quem) net.direto('tel-fim', quem, {});
      limpar();
      estado('sem_resposta', { alvo: quem });
    }, T_CHAMANDO);
    return { ok: true };
  }

  function recusar(motivo = 'recusou') {
    if (!recebendo) return;
    net.direto('tel-recusou', recebendo.dePais, { motivo });
    pararTons();
    clearTimeout(timerToque); timerToque = null;
    pendIce.delete(recebendo.dePais);
    recebendo = null;
    estado('encerrada', {});
  }

  function encerrar(avisar = true) {
    if (encerrando) return;      // reentrância: fechar o peer redispara 'closed' aqui dentro
    encerrando = true;
    if (avisar && alvoAtual) net.direto('tel-fim', alvoAtual, {});
    limpar();
    encerrando = false;
    estado('encerrada', {});
  }

  function mutar() {
    mudo = !mudo;
    micStream?.getAudioTracks().forEach((t) => { t.enabled = !mudo; });
    return mudo;
  }

  // Dispatcher dos bilhetes de sinalização que chegam pelo canal `direto`.
  async function receber(msg, { modoAviao = false } = {}) {
    const d = msg.dados || {};
    switch (msg.tipo) {
      case 'tel-convite': {
        if (modoAviao || pc || recebendo) {   // ocupado ou de avião: recusa na hora
          net.direto('tel-recusou', msg.dePais, { motivo: modoAviao ? 'aviao' : 'ocupado' });
          return true;
        }
        recebendo = { dePais: msg.dePais, deNome: msg.deNome, sdp: d.sdp };
        tom = tocarTom(audio(), { freq: 425, on: 500, off: 500 });   // toque insistente
        estado('tocando', { de: msg.dePais, deNome: msg.deNome });
        // Ignorar a chamada não pode deixar o telefone tocando pra sempre NEM
        // travar `recebendo` — era isso que fazia a ligação seguinte cair em "ocupado".
        clearTimeout(timerToque);
        timerToque = setTimeout(() => {
          timerToque = null;
          if (!recebendo) return;
          net.direto('tel-recusou', recebendo.dePais, { motivo: 'nao_atendeu' });
          pararTons();
          pendIce.delete(recebendo.dePais);
          recebendo = null;
          estado('encerrada', { semAtender: true });
        }, T_TOQUE);
        return true;
      }
      case 'tel-atendeu':
        if (pc && d.sdp) {
          estado('estabelecendo', { alvo: alvoAtual });
          await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
          await drenarIce(msg.dePais);   // o outro lado já mandou ICE antes da resposta
        }
        return true;
      case 'tel-recusou':
        limpar();
        estado(d.motivo === 'aviao' ? 'aviao'
          : d.motivo === 'ocupado' ? 'ocupado'
            : d.motivo === 'nao_atendeu' ? 'sem_resposta' : 'recusada', { de: msg.dePais, alvo: msg.dePais });
        return true;
      case 'tel-ice':
        if (!d.ice) return true;
        // A fila é a correção do bug 1: candidato que chega cedo demais fica
        // esperando o peer/remoteDescription em vez de virar pó.
        if (pc && pc.remoteDescription && msg.dePais === alvoAtual) {
          try { await pc.addIceCandidate(new RTCIceCandidate(d.ice)); } catch { /* candidato inválido */ }
        } else {
          guardarIce(msg.dePais, d.ice);
        }
        return true;
      case 'tel-fim':
        limpar();
        estado('encerrada', { peloOutro: true });
        return true;
      default: return false;   // não é bilhete de telefonia
    }
  }

  return {
    ligar, atender, recusar, encerrar, mutar, receber,
    emChamada: () => !!pc, tocando: () => !!recebendo,
    estouMudo: () => mudo,
    falhouEntrega: (msg) => { if (msg?.alvo === alvoAtual && !pc?.remoteDescription) { limpar(); estado('offline', { alvo: msg.alvo }); } },
  };
}
