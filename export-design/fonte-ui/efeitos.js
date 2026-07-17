// Efeitos audiovisuais: sirene (Web Audio, sem arquivos) e flash de tela.
// A sirene só toca depois de uma interação do usuário (política de autoplay).

let ctx = null;
function audio() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
  return ctx;
}

// Sirene tática: varredura de frequência sobe/desce algumas vezes.
export function sirene({ ruim = false } = {}) {
  const ac = audio();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const dur = 1.8;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  const baixo = ruim ? 380 : 440;
  const alto = ruim ? 720 : 880;
  // 3 varreduras
  for (let i = 0; i < 3; i++) {
    const t = t0 + i * (dur / 3);
    osc.frequency.setValueAtTime(baixo, t);
    osc.frequency.linearRampToValueAtTime(alto, t + dur / 6);
    osc.frequency.linearRampToValueAtTime(baixo, t + dur / 3);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.05);
  gain.gain.setValueAtTime(0.14, t0 + dur - 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

// Flash de tela (vermelho pra ruim, cyan pra bom).
export function flashTela(ruim = false) {
  const div = document.createElement('div');
  div.className = `flash-tela ${ruim ? 'ruim' : 'bom'}`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 900);
}
