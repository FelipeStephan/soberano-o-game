// MERCADO DE ARMAS — comprar avulso e VENDER o que você tem.
// Vender é a decisão suculenta: o inimigo paga MAIS pelo seu material (ele quer sua
// tecnologia), mas você acaba de armar quem vai te enfrentar. O aliado paga menos.
import { UNIDADES, UNIDADE_POR_ID } from './forcas.js';
import { PAISES } from './paises.js';

// Preço unitário de compra (US$ trilhões), coerente com o catálogo de ações.
export const PRECO = {
  infantaria: 0.0000013,
  blindados: 0.000125,
  artilharia: 0.00009,
  helicopteros: 0.00133,
  cacas: 0.0075,
  bombardeiros: 0.02,
  drones: 0.00375,
  navios: 0.03,
  submarinos: 0.04,
  porta_avioes: 0.4,
  misseis: 0.00367,
};

export const DEPRECIACAO = 0.65; // material usado vale 65% do novo

export function precoCompra(id, qtd) {
  return round4((PRECO[id] || 0) * qtd);
}
export function precoVendaBase(id, qtd) {
  return round4((PRECO[id] || 0) * qtd * DEPRECIACAO);
}

// Reserva de segurança: abaixo disso o jogo te avisa que está torrando o caixa.
export function reservaMinima(estado) {
  return round2(estado.pib * 0.03); // ~3% do PIB
}

// Gera compradores para uma venda. O rival paga mais — e fica mais forte.
export function compradores(estado, unidadeId) {
  const out = [];
  for (const [iso, info] of Object.entries(PAISES)) {
    const rel = Number(estado[info.rel] ?? 0);
    let mult; let perfil; let nota; let efeitos;
    if (rel >= 30) {
      mult = 0.85; perfil = 'aliado';
      nota = 'Aliado. Paga pouco, mas fortalece a parceria.';
      efeitos = { [info.rel]: 6, soft_power: 2 };
    } else if (rel <= -30) {
      mult = 1.35; perfil = 'rival';
      nota = 'RIVAL. Paga caro pela sua tecnologia — e vai apontá-la para você.';
      efeitos = { [info.rel]: 8, soft_power: -10, temp_guerra: 4 };
    } else {
      mult = 1.0; perfil = 'neutro';
      nota = 'Neutro. Preço de mercado, sem drama.';
      efeitos = { [info.rel]: 4 };
    }
    // humor do comprador: às vezes lowball, às vezes desespero
    const humor = 0.85 + Math.random() * 0.35;
    out.push({
      iso, nome: info.nome, perfil, nota,
      mult: round2(mult * humor),
      efeitos,
      forcaGanha: perfil === 'rival',
    });
  }
  // 3 ofertas: melhor rival, melhor aliado, melhor neutro (quando existirem)
  const porPerfil = (p) => out.filter((o) => o.perfil === p).sort((a, b) => b.mult - a.mult)[0];
  return [porPerfil('rival'), porPerfil('neutro'), porPerfil('aliado')].filter(Boolean);
}

// A Máquina "sugere" a melhor oferta em dinheiro (nem sempre a mais sábia).
export function melhorOferta(ofertas) {
  return ofertas.slice().sort((a, b) => b.mult - a.mult)[0];
}

export const VENDIVEIS = UNIDADES.filter((u) => PRECO[u.id] != null);
export { UNIDADE_POR_ID };

function round2(n) { return Math.round(n * 100) / 100; }
function round4(n) { return Math.round(n * 10000) / 10000; }
