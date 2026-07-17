// Aplica "tags políticas" das ações/opções aos eixos e deriva o rótulo atual.
import { classificar } from '../dados/ideologias.js';

// politico = { economico: ±n, autoridade: ±n }
export function aplicarPolitico(estado, politico) {
  if (!politico) return;
  if (typeof politico.economico === 'number') {
    estado.eixo_economico = clamp(estado.eixo_economico + politico.economico, -100, 100);
  }
  if (typeof politico.autoridade === 'number') {
    estado.eixo_autoridade = clamp(estado.eixo_autoridade + politico.autoridade, -100, 100);
  }
}

export function rotuloPolitico(estado) {
  return classificar(estado.eixo_economico, estado.eixo_autoridade);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
