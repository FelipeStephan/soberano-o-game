// ÍCONES — Lucide, SVG de verdade. Chega de emoji de carrinho de supermercado.
// Uso: ico('swords', 18) → string SVG pronta pra injetar no HTML.
import { icons } from 'lucide';

const pascal = (n) => n.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');

// Cache: monta o SVG uma vez por (nome, tamanho, cor).
const cache = new Map();

export function ico(nome, tam = 18, cor = 'currentColor', extra = '') {
  const chave = `${nome}|${tam}|${cor}|${extra}`;
  if (cache.has(chave)) return cache.get(chave);
  const node = icons[pascal(nome)];
  if (!node) { cache.set(chave, ''); return ''; }
  // node = [[tag, attrs], [tag, attrs], ...] (só os filhos do <svg>)
  const corpo = node.map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')} />`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 24 24"
    fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    class="ico ${extra}">${corpo}</svg>`;
  cache.set(chave, svg);
  return svg;
}

// ── VOCABULÁRIO VISUAL DO JOGO ────────────────────────────────────────
// Um lugar só pra decidir o ícone de cada conceito.
export const ICO = {
  // categorias do console
  Militar: 'swords', Arsenal: 'radiation', 'Inteligência': 'eye', Economia: 'banknote',
  Diplomacia: 'handshake', 'Ciência': 'flask-conical', 'Mídia': 'radio', 'Política': 'landmark',
  // unidades
  infantaria: 'users', blindados: 'truck', artilharia: 'crosshair', helicopteros: 'helicopter',
  cacas: 'plane', bombardeiros: 'plane', drones: 'radar', navios: 'ship',
  submarinos: 'anchor', porta_avioes: 'ship', misseis: 'rocket', ogivas: 'radiation',
  // domínios
  Terra: 'truck', Ar: 'plane', Mar: 'anchor', 'Estratégico': 'radiation',
  // ações do jogo
  comprar: 'package', vender: 'tag', mercado: 'store', guerra: 'swords', ficha: 'file-text',
  dinheiro: 'circle-dollar-sign', destino: 'crown', regime: 'landmark', indicadores: 'chart-line',
  forcas: 'shield', capacidades: 'microscope', feed: 'radio', alerta: 'triangle-alert',
  urgente: 'siren', vitoria: 'crown', derrota: 'skull', mundo: 'globe', ocupacao: 'flag',
  bloco: 'users', empresa: 'building-2', universidade: 'graduation-cap', energia: 'zap',
  acao: 'zap', tempo: 'clock', proximo: 'chevron-right', config: 'settings',
};

export function icoDe(chave, tam = 18, cor = 'currentColor') {
  return ico(ICO[chave] || 'circle', tam, cor);
}
