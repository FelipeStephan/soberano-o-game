// Aplica efeitos ao Estado do Mundo, respeitando os limites de cada variável (vars.js).
import { VARS, QUALITATIVOS, limitesDe } from './vars.js';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Retorna um registro das mudanças, para a UI mostrar "+8 aprovação" etc.
export function aplicarEfeitos(estado, efeitos) {
  const mudancas = [];
  for (const [chave, valor] of Object.entries(efeitos || {})) {
    if (QUALITATIVOS[chave]) {
      estado[chave] = valor;
      mudancas.push({ chave, delta: 0, valor });
      continue;
    }
    if (VARS[chave] || chave.startsWith('rel_')) {
      const { min, max } = limitesDe(chave);
      const antes = estado[chave] ?? 0;
      estado[chave] = clamp(antes + Number(valor), min, max);
      mudancas.push({ chave, delta: estado[chave] - antes });
    }
  }
  return mudancas;
}

// Derrotas "duras" (as suaves ficam em destino.js via a barra de Destino).
//
// O QUE SAIU DAQUI E POR QUÊ: existia um `if (estado.divida >= 200) → derrota
// 'Falência'`. Era irreal e frustrante — o caixa zerava, o rombo virava dívida
// sozinho, a dívida cruzava 200% e a partida acabava sem o jogador ter feito
// nada de catastrófico. Mas nenhum país deixa de existir por dever demais: o
// Japão vive com ~250% do PIB, a Grécia bateu 180% e sobreviveu. Quem quebra é
// quem perde a confiança e depois o governo.
//
// Agora a dívida ESTRANGULA em vez de matar (ver fiscal.js e a espiral em
// economia.js): encarece o juro, corrói a confiança, derruba o PIB e a aprovação
// — e é a APROVAÇÃO no chão que te depõe. A morte passou a ser política, que é
// como acontece de verdade. Dívida é o caminho, não a sentença.
export function checarFim(estado) {
  if (estado.aprovacao <= 0) {
    return { tipo: 'derrota', titulo: 'Deposto', texto: 'Sua aprovação chegou a zero. O gabinete se voltou contra você — um golpe silencioso encerra seu reinado.' };
  }
  if (estado.estabilidade <= 0) {
    return { tipo: 'derrota', titulo: 'O país se partiu', texto: 'A coesão social ruiu. As instituições não seguram mais a nação — o caos toma conta.' };
  }
  return null;
}
