// ═══════════════════════════════════════════════════════════════════════
// RNG SEMEADO — o dado único do mundo (Etapa 1 do MUNDO ÚNICO ONLINE)
// ═══════════════════════════════════════════════════════════════════════
// POR QUE EXISTE: no online, cada cliente re-simula eventos. Se cada um rolar o
// próprio Math.random(), a MESMA ação dá resultados diferentes em cada tela — e
// nenhuma interação humana×humana é confiável. Este módulo é a resposta: TODA a
// lógica de jogo rola dado por `rand()` daqui.
//
//   • OFFLINE: seed aleatória no boot — o jogo continua imprevisível como sempre.
//   • ONLINE:  todos os clientes da sala semeiam IGUAL por batida:
//       semear(seedDaSala(codigoSala, turno))
//     → quem replicar o mesmo evento no mesmo turno chega ao MESMO número.
//
// mulberry32: 32 bits, ~10 linhas, estatisticamente bom pro que um jogo precisa.
// SEM dependências (nem de dados/ nem de ui/) — importável por qualquer módulo.

let _estado = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;

function mulberry32() {
  _estado = (_estado + 0x6D2B79F5) >>> 0;
  let t = _estado;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// O dado do jogo — assinatura idêntica a Math.random(): [0, 1).
export function rand() { return mulberry32(); }

// Re-semeia o fluxo. Aceita número ou string (hasheia).
export function semear(seed) {
  _estado = (typeof seed === 'number' ? seed : hashStr(String(seed))) >>> 0;
  // primeiros giros descartados: seeds vizinhas produzem inícios correlacionados
  mulberry32(); mulberry32();
}

// Seed determinística de SALA por batida: hash(codigo, turno). Todo cliente da
// sala que chamar isto com os mesmos argumentos entra no MESMO fluxo de dados.
export function seedDaSala(codigoSala, turno) {
  return hashStr(`${codigoSala}|${turno}`) >>> 0;
}

// FNV-1a 32 bits — hash de string estável entre clientes/plataformas.
function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Açúcares usados pela lógica (mesma matemática que o código já fazia inline).
export const randEntre = (min, max) => min + rand() * (max - min);
export const randInt = (min, max) => Math.floor(min + rand() * (max - min + 1));
export const sorteio = (arr) => arr[Math.floor(rand() * arr.length)];
export const chance = (p) => rand() < p;
