// Telemetria das chamadas de IA — guarda no navegador as últimas chamadas
// (modelo, tokens, latência, sucesso) pra a Área Administrativa mostrar dados.
const LS = 'soberano.telemetria';

function bruto() {
  try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; }
}

export function registrar(chamada) {
  const arr = bruto();
  arr.unshift({ ts: Date.now(), ...chamada });
  if (arr.length > 50) arr.length = 50;
  localStorage.setItem(LS, JSON.stringify(arr));
}

export function ler() {
  const arr = bruto();
  const ok = arr.filter((x) => x.ok);
  const totalPt = ok.reduce((a, b) => a + (b.pt || 0), 0);
  const totalCt = ok.reduce((a, b) => a + (b.ct || 0), 0);
  const avgLat = ok.length ? Math.round(ok.reduce((a, b) => a + (b.latenciaMs || 0), 0) / ok.length) : 0;
  return { chamadas: arr.length, sucessos: ok.length, falhas: arr.length - ok.length, totalPt, totalCt, avgLat, recentes: arr.slice(0, 15) };
}

export function limpar() { localStorage.removeItem(LS); }
