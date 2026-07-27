// ═══════════════════════════════════════════════════════════════════════
// SALA DE VOZ — o microfone aberto do Conselho de Segurança (malha WebRTC)
// ═══════════════════════════════════════════════════════════════════════
// A telefonia 1:1 (net/chamada.js) não serve para o Conselho: ela guarda UMA
// RTCPeerConnection e a sinalização dela (`tel-*`) já é consumida pelo telefone
// vermelho em ui/telefone.js — reusar aqueles tipos faria a UI do telefone
// pipocar "CHAMADA RECEBIDA" no meio da sessão da ONU. Então aqui existe um
// namespace próprio (`voz-*`) e uma MALHA: cada participante mantém uma conexão
// com cada outro. Para uma sala de 3–8 presidentes são no máximo 7 conexões por
// cabeça — perfeitamente viável e sem servidor de mídia (que não temos).
//
// ANTI-GLARE (oferta dupla): se os dois lados oferecem ao mesmo tempo, a
// negociação embaralha. A regra aqui é determinística e não precisa de acordo:
// QUEM TEM O ISO MENOR LEXICOGRAFICAMENTE CRIA A OFERTA. 'BRA' < 'USA', então o
// Brasil oferece e os EUA respondem. Como todos rodam a mesma comparação, nunca
// há dois ofertantes para o mesmo par. Se ainda assim uma oferta cruzada chegar
// (reentrada, reconexão), o lado ofertante — o "impolido" — ignora a oferta do
// outro e mantém a sua; o lado respondedor sempre aceita.
//
// DESCOBERTA: `net.direto` só fala com UM país, não existe broadcast. Quem entra
// avisa `voz-entrou` a todos os jogadores da sala (net.estado().jogadores); quem
// já está na voz responde com `voz-entrou` de volta (resposta: true) e aí os dois
// se conhecem. Quem não está na voz simplesmente ignora — sem ninguém falando
// para o vazio.
import { audioCtx, cadeiaTelefone, estaticaDeLinha } from './chamada.js';

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
const T_QUEDA_PAR = 8000;   // 'disconnected' passageiro não expulsa ninguém da mesa
const HZ_NIVEL = 100;       // ~10 Hz: o suficiente pra UI acender quem fala

export function criarSalaVoz({ net, meuIso, meuNome, onEstado }) {
  let ac = null;
  let micStream = null;       // captura crua
  let destProc = null;        // saída com efeito de linha — é ISTO que vai pra rede
  let minhaTrack = null;
  let meuAnalyser = null;
  let estatica = null;
  let medidor = null;
  let viva = false;
  let modo = 'todos';         // 'todos' | 'fila'
  let comPalavra = null;      // no modo 'fila', o ISO que está com o microfone
  let mudoLocal = false;
  let meusNos = [];           // nós WebAudio da MINHA cadeia (desligados no sair)

  // iso → { iso, nome, pc, mudo, nivel, nivelUlt, audioEl, nos, analyser, buf, queda }
  const pares = new Map();
  const pendIce = new Map();  // iso → [candidatos] chegados antes do remoteDescription

  const emitir = (t, d) => { try { onEstado?.(t, d || {}); } catch { /* UI que estourou não derruba a voz */ } };
  const outros = () => (net.estado?.().jogadores || [])
    .map((j) => j.pais).filter((p) => p && p !== meuIso);

  // Regra anti-glare em uma linha. Documentada no topo do arquivo.
  const devoOferecer = (iso) => String(meuIso) < String(iso);

  // ── MINHA VOZ ────────────────────────────────────────────────────────
  // Só posso falar se: a sessão está viva, não estou mudo, e — no modo fila —
  // a palavra é minha. Desabilitar a TRACK (e não só baixar volume) é o que
  // garante que nada vaza: o pacote nem sai da máquina.
  function podeFalar() {
    if (!viva || mudoLocal) return false;
    if (modo === 'fila') return comPalavra === meuIso;
    return true;
  }
  function aplicarEnvio() {
    const on = podeFalar();
    micStream?.getAudioTracks().forEach((t) => { t.enabled = on; });
    if (minhaTrack) minhaTrack.enabled = on;
  }

  function medirDe(analyser, buf) {
    if (!analyser) return 0;
    analyser.getByteTimeDomainData(buf);
    let soma = 0;
    for (let i = 0; i < buf.length; i += 1) { const v = (buf[i] - 128) / 128; soma += v * v; }
    // RMS ×4 porque voz de telefone é fraca em amplitude; teto em 1.
    return Math.min(1, Math.sqrt(soma / buf.length) * 4);
  }

  function ligarMedidor() {
    clearInterval(medidor);
    medidor = setInterval(() => {
      const conta = (iso, nivel, reg) => {
        reg.nivel = nivel;
        // Só emite quando MUDA de verdade: 8 participantes × 10 Hz viraria 80
        // eventos por segundo de UI redesenhando sem motivo.
        const antes = reg.nivelUlt ?? 0;
        if (Math.abs(nivel - antes) > 0.03 || (nivel > 0.06) !== (antes > 0.06)) {
          reg.nivelUlt = nivel;
          emitir('nivel', { iso, nivel });
        }
      };
      if (meuAnalyser) conta(meuIso, podeFalar() ? medirDe(meuAnalyser, meuAnalyser._buf) : 0, euReg);
      for (const p of pares.values()) conta(p.iso, p.mudo ? 0 : medirDe(p.analyser, p.buf), p);
    }, HZ_NIVEL);
  }

  // Meu próprio registro, pra `participantes()` me incluir e a UI me acender também.
  const euReg = { iso: meuIso, nome: meuNome || meuIso, mudo: false, nivel: 0, nivelUlt: 0 };

  // ── ENTRAR / SAIR ────────────────────────────────────────────────────
  async function entrar(micId, { modo: modoInicial = 'todos' } = {}) {
    modo = modoInicial === 'fila' ? 'fila' : 'todos';
    if (viva) { aplicarEnvio(); return { ok: true }; }   // entrar duas vezes não duplica captura
    try {
      ac = audioCtx();
      try { ac.resume?.(); } catch { /* ok */ }   // entrar é gesto do usuário: destrava aqui
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: micId
          ? { deviceId: { exact: micId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          : { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      limparTudo();
      emitir('erro', { motivo: 'Microfone indisponível — o Conselho segue por texto.' });
      return { erro: 'mic' };
    }
    const fonte = ac.createMediaStreamSource(micStream);
    const cadeia = cadeiaTelefone(ac, fonte);
    destProc = ac.createMediaStreamDestination();
    cadeia.saida.connect(destProc);
    meusNos = [...cadeia.nos, destProc];
    minhaTrack = destProc.stream.getAudioTracks()[0] || null;

    meuAnalyser = ac.createAnalyser(); meuAnalyser.fftSize = 512;
    meuAnalyser._buf = new Uint8Array(meuAnalyser.fftSize);
    cadeia.saida.connect(meuAnalyser);   // mede o que EU mando, já com o filtro de linha
    meusNos.push(meuAnalyser);

    // A estática é UMA por sessão, não uma por par: oito chiados somados viravam
    // vento. É o fundo de sala de rádio que o Conselho pediu.
    estatica = estaticaDeLinha(ac, ac.destination, 0.008);

    viva = true;
    mudoLocal = false;
    aplicarEnvio();
    ligarMedidor();
    // Bate na porta de todo mundo da sala. Quem está na voz responde; quem não
    // está, ignora — e me encontra quando entrar.
    for (const iso of outros()) net.direto('voz-entrou', iso, { nome: meuNome || meuIso, modo });
    emitir('pronto', { modo, iso: meuIso });
    return { ok: true };
  }

  function limparTudo() {
    clearInterval(medidor); medidor = null;
    for (const iso of [...pares.keys()]) fecharPar(iso, false);
    pares.clear(); pendIce.clear();
    estatica?.parar(); estatica = null;
    micStream?.getTracks().forEach((t) => t.stop()); micStream = null;
    for (const n of meusNos) { try { n.disconnect(); } catch { /* ok */ } }
    meusNos = []; destProc = null; minhaTrack = null; meuAnalyser = null;
    comPalavra = null; mudoLocal = false; euReg.nivel = 0; euReg.nivelUlt = 0; euReg.mudo = false;
  }

  function sair() {
    if (!viva) { limparTudo(); return; }   // idempotente: chamar duas vezes não explode
    viva = false;
    for (const iso of [...pares.keys()]) net.direto('voz-saiu', iso, {});
    limparTudo();
  }

  // ── UM PAR DA MALHA ──────────────────────────────────────────────────
  function garantirPar(iso, nome) {
    let p = pares.get(iso);
    if (p && p.pc && p.pc.connectionState !== 'failed' && p.pc.connectionState !== 'closed') {
      if (nome) p.nome = nome;
      return p;
    }
    if (p) fecharPar(iso, false);   // par podre: refaz do zero em vez de remendar

    const pc = new RTCPeerConnection({ iceServers: STUN });
    p = { iso, nome: nome || iso, pc, mudo: false, nivel: 0, nivelUlt: 0, audioEl: null, nos: [], analyser: null, buf: null, queda: null };
    pares.set(iso, p);

    if (minhaTrack) pc.addTrack(minhaTrack, destProc.stream);

    pc.onicecandidate = (ev) => { if (ev.candidate) net.direto('voz-ice', iso, { ice: ev.candidate }); };
    pc.ontrack = (ev) => {
      // Renegociação redispara ontrack. Sem desligar a cadeia anterior, o áudio
      // do mesmo presidente ficava tocando duas vezes (e a antiga nunca morria).
      for (const n of p.nos) { try { n.disconnect(); } catch { /* ok */ } }
      p.nos = [];
      const fonte = ac.createMediaStreamSource(ev.streams[0]);
      const cadeia = cadeiaTelefone(ac, fonte);
      cadeia.saida.connect(ac.destination);
      p.analyser = ac.createAnalyser(); p.analyser.fftSize = 512;
      p.buf = new Uint8Array(p.analyser.fftSize);
      cadeia.saida.connect(p.analyser);
      p.nos = [...cadeia.nos, p.analyser];
      // <audio> mudo: em alguns navegadores o stream remoto só flui se estiver
      // atado a um elemento de mídia, mesmo que quem toque seja o WebAudio.
      p.audioEl = new Audio(); p.audioEl.srcObject = ev.streams[0]; p.audioEl.muted = true;
      p.audioEl.play().catch(() => { /* ok */ });
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') {
        clearTimeout(p.queda); p.queda = null;
        emitir('entrou', { iso, nome: p.nome, mudo: p.mudo });
      } else if (s === 'disconnected') {
        // Tolerância: trocar de Wi-Fi para 4G derrubava o presidente da mesa.
        if (!p.queda) p.queda = setTimeout(() => { p.queda = null; if (pares.get(iso) === p && pc.connectionState !== 'connected') { fecharPar(iso, true); } }, T_QUEDA_PAR);
      } else if (s === 'failed' || s === 'closed') {
        fecharPar(iso, true);
      }
    };
    return p;
  }

  function fecharPar(iso, avisarUI) {
    const p = pares.get(iso);
    if (!p) return;
    pares.delete(iso);
    pendIce.delete(iso);
    clearTimeout(p.queda);
    for (const n of p.nos) { try { n.disconnect(); } catch { /* ok */ } }
    if (p.audioEl) { try { p.audioEl.pause(); } catch { /* ok */ } p.audioEl.srcObject = null; }
    try { p.pc.close(); } catch { /* ok */ }
    if (avisarUI) emitir('saiu', { iso, nome: p.nome });
  }

  async function oferecer(iso) {
    const p = pares.get(iso);
    if (!p) return;
    try {
      const oferta = await p.pc.createOffer({ offerToReceiveAudio: true });
      await p.pc.setLocalDescription(oferta);
      net.direto('voz-oferta', iso, { sdp: p.pc.localDescription, nome: meuNome || meuIso });
    } catch { fecharPar(iso, true); }
  }

  function guardarIce(iso, ice) {
    const f = pendIce.get(iso) || [];
    if (f.length > 80) return;
    f.push(ice); pendIce.set(iso, f);
  }
  async function drenarIce(iso) {
    const p = pares.get(iso);
    if (!p || !p.pc.remoteDescription) return;
    const f = pendIce.get(iso);
    if (!f || !f.length) return;
    pendIce.delete(iso);
    for (const c of f) { try { await p.pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* candidato velho */ } }
  }

  // ── MODERAÇÃO E MODO ─────────────────────────────────────────────────
  function mutarMe() {
    mudoLocal = !mudoLocal;
    euReg.mudo = mudoLocal;
    aplicarEnvio();
    // Anuncia (ordem: false) só pra UI dos outros pintar o ícone certo.
    for (const iso of pares.keys()) net.direto('voz-mudo', iso, { mudo: mudoLocal, ordem: false });
    emitir('mudo', { iso: meuIso, mudo: mudoLocal });
    return mudoLocal;
  }
  const estouMudo = () => mudoLocal;

  // DECISÃO DE DESIGN, explícita: `mutarOutro` não é enfeite visual — o alvo recebe
  // `voz-mudo` com ordem: true e SE MUTA DE VERDADE (a track dele é desabilitada).
  // É poder de moderação da presidência do Conselho: sem isso, quem grita por cima
  // de todo mundo inviabiliza a sessão. E o alvo É INFORMADO — a UI dele recebe
  // 'mudo' com quem deu a ordem; nada acontece às escondidas.
  function mutarOutro(iso, mudo) {
    const p = pares.get(iso);
    if (p) p.mudo = !!mudo;
    net.direto('voz-mudo', iso, { mudo: !!mudo, ordem: true });
    emitir('mudo', { iso, mudo: !!mudo, porMim: true });
  }

  // Local: quem troca o modo pra sala inteira é a UI do Conselho, pelos eventos
  // dela (`onu_*`), que já chegam a todos. Duplicar broadcast aqui só criaria
  // duas fontes de verdade discordando.
  function definirModo(novo) {
    modo = novo === 'fila' ? 'fila' : 'todos';
    aplicarEnvio();
    emitir('mudo', { iso: meuIso, mudo: !podeFalar(), porModo: modo });
  }

  // Modo 'fila': só quem tem a palavra fala. Cada cliente aplica a regra em si
  // mesmo, então TODOS precisam saber quem é — daí o broadcast.
  function daPalavra(iso) {
    comPalavra = iso || null;
    for (const outro of pares.keys()) net.direto('voz-palavra', outro, { iso: comPalavra });
    aplicarEnvio();
    emitir('mudo', { iso: meuIso, mudo: !podeFalar(), porPalavra: comPalavra });
  }
  const quemFala = () => comPalavra;

  function participantes() {
    return [
      { iso: euReg.iso, nome: euReg.nome, mudo: mudoLocal || !podeFalar(), nivel: euReg.nivel },
      ...[...pares.values()].map((p) => ({ iso: p.iso, nome: p.nome, mudo: p.mudo, nivel: p.nivel })),
    ];
  }

  // ── SINALIZAÇÃO ──────────────────────────────────────────────────────
  // Consome só os bilhetes `voz-*`. Devolve false pra qualquer outra coisa, pra
  // o telefone 1:1 e as DMs continuarem passando pelo mesmo canal `direto`.
  function aoDireto(msg) {
    const tipo = msg?.tipo || '';
    if (!tipo.startsWith('voz-')) return false;
    const d = msg.dados || {};
    const de = msg.dePais;
    // Fora da sessão, os bilhetes são consumidos e descartados: sem isto, quem
    // não entrou na voz começaria a montar peers fantasma.
    if (!viva || !de || de === meuIso) return true;

    switch (tipo) {
      case 'voz-entrou': {
        const p = garantirPar(de, d.nome || msg.deNome);
        if (!d.resposta) net.direto('voz-entrou', de, { nome: meuNome || meuIso, resposta: true });
        emitir('entrou', { iso: de, nome: p.nome, mudo: p.mudo });
        if (devoOferecer(de)) oferecer(de);
        return true;
      }
      case 'voz-oferta': {
        // Glare: se EU sou o ofertante do par e já tenho oferta local pendente,
        // ignoro a oferta cruzada dele. A minha vai vencer nos dois lados.
        const jaTenho = pares.get(de);
        if (jaTenho && devoOferecer(de) && jaTenho.pc.signalingState === 'have-local-offer') return true;
        const p = garantirPar(de, d.nome || msg.deNome);
        (async () => {
          try {
            await p.pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
            const resp = await p.pc.createAnswer();
            await p.pc.setLocalDescription(resp);
            net.direto('voz-resposta', de, { sdp: p.pc.localDescription, nome: meuNome || meuIso });
            await drenarIce(de);
          } catch { fecharPar(de, true); }
        })();
        return true;
      }
      case 'voz-resposta': {
        const p = pares.get(de);
        if (!p || !d.sdp) return true;
        if (p.pc.signalingState !== 'have-local-offer') return true;   // resposta atrasada de uma oferta morta
        (async () => {
          try {
            await p.pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
            await drenarIce(de);
          } catch { fecharPar(de, true); }
        })();
        return true;
      }
      case 'voz-ice': {
        if (!d.ice) return true;
        const p = pares.get(de);
        // Mesmo bug que travava o telefone: candidato que chega antes do
        // remoteDescription tem que ESPERAR, não virar pó no catch.
        if (p && p.pc.remoteDescription) {
          p.pc.addIceCandidate(new RTCIceCandidate(d.ice)).catch(() => { /* candidato inválido */ });
        } else {
          guardarIce(de, d.ice);
        }
        return true;
      }
      case 'voz-mudo': {
        if (d.ordem) {
          // Ordem da presidência: me muto de verdade e a UI diz quem mandou.
          mudoLocal = !!d.mudo;
          euReg.mudo = mudoLocal;
          aplicarEnvio();
          emitir('mudo', { iso: meuIso, mudo: mudoLocal, por: de });
        } else {
          const p = pares.get(de);
          if (p) p.mudo = !!d.mudo;
          emitir('mudo', { iso: de, mudo: !!d.mudo });
        }
        return true;
      }
      case 'voz-palavra': {
        comPalavra = d.iso || null;
        aplicarEnvio();
        emitir('mudo', { iso: meuIso, mudo: !podeFalar(), porPalavra: comPalavra });
        return true;
      }
      case 'voz-saiu': {
        fecharPar(de, true);
        return true;
      }
      default: return true;   // bilhete voz-* que ainda não existe: engole, não vaza pro telefone
    }
  }

  return {
    entrar,
    sair,
    mutarMe,
    estouMudo,
    mutarOutro,
    definirModo,
    daPalavra,
    quemFala,
    participantes,
    aoDireto,
    ativa: () => viva,
  };
}
