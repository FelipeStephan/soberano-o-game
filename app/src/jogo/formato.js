// Formatação de números do jogo. Dinheiro é medido em TRILHÕES de dólares (float).

export function dinheiro(tri) {
  const n = Number(tri) || 0;
  const s = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1) return `${s}US$ ${a.toFixed(2)} tri`;
  if (a >= 0.001) return `${s}US$ ${Math.round(a * 1000)} bi`;
  if (a > 0) return `${s}US$ ${Math.round(a * 1e6)} mi`;
  return 'US$ 0';
}

// Versão curta pra topo (ex.: "3,2 tri"). Mesma unidade em PT do resto do jogo —
// nada de "T"/"B" em inglês pra não confundir quem tem 16 anos.
export function dinheiroCurto(tri) {
  const n = Number(tri) || 0;
  if (Math.abs(n) >= 1) return `US$ ${n.toFixed(1)} tri`;
  return `US$ ${Math.round(n * 1000)} bi`;
}

// Delta com sinal (+/-) pra HUD.
export function comSinal(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v}` : `${v}`;
}
