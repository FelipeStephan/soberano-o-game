// ═══════════════════════════════════════════════════════════════════════
// CATÁLOGO MILITAR — a ficha técnica de cada máquina de guerra
// ═══════════════════════════════════════════════════════════════════════
// O que isto resolve: o jogo tratava "porta-aviões" como um número genérico —
// 1 carrier americano valia o mesmo que 1 carrier turco, e a capacidade de
// aeronaves era um 70 fixo hardcoded na UI naval. Aqui mora a VERDADE TÉCNICA
// de cada equipamento: um Gerald R. Ford embarca ~75 aeronaves; um Cavour
// italiano, ~20; o TCG Anadolu turco nem opera caça — é navio de drones.
//
// Arquitetura (pensada pra crescer):
//   • FICHA_PADRAO[slot]  → specs genéricas do TIPO de unidade (fallback).
//   • FICHAS[iso][slot]   → specs do equipamento REAL que aquele país opera
//                           (mesmas chaves de equipamentos.js / paises/<iso>.js).
//   • fichaDe(iso, slot)  → merge: padrão do tipo + ficha do país por cima.
// Novos veículos/tecnologias/mísseis no futuro: adicionar a ficha aqui e ela
// vale em toda UI que consultar — nada de constante mágica espalhada.
//
// Fontes das capacidades (aproximações públicas): Ford ~75+ aeronaves,
// Nimitz ~60-90, Queen Elizabeth ~40 (surge 72), Charles de Gaulle ~40,
// Fujian ~60, Vikrant ~30, Cavour ~20, Anadolu ~12 VANTs, PHM Atlântico
// só asa rotativa/drones.

// ── Specs genéricas por TIPO de unidade ───────────────────────────────
// Chaves de spec (todas opcionais — a UI mostra o que houver):
//   capAeronaves   → quantas aeronaves UM casco embarca (porta-aviões)
//   soAsaRotativa  → true = convés sem catapulta/ski-jump pra caça (heli/drone)
//   alcanceKm      → raio de ação / alcance operacional
//   velocidade     → nós (naval) ou km/h (aéreo/terrestre), como string legível
//   tripulacao     → gente a bordo (dá escala humana ao brinquedo)
export const FICHA_PADRAO = {
  porta_avioes: { capAeronaves: 40, alcanceKm: 15000, velocidade: '30 nós', tripulacao: 3000 },
  navios:       { alcanceKm: 8000,  velocidade: '30 nós', tripulacao: 300 },
  submarinos:   { alcanceKm: 12000, velocidade: '25 nós', tripulacao: 130 },
  cacas:        { alcanceKm: 1200,  velocidade: 'Mach 1.6', tripulacao: 1 },
  bombardeiros: { alcanceKm: 5500,  velocidade: 'Mach 0.9', tripulacao: 4 },
  drones:       { alcanceKm: 1800,  velocidade: '300 km/h', tripulacao: 0 },
  helicopteros: { alcanceKm: 480,   velocidade: '290 km/h', tripulacao: 2 },
  blindados:    { alcanceKm: 425,   velocidade: '67 km/h',  tripulacao: 4 },
  artilharia:   { alcanceKm: 40,    velocidade: '56 km/h',  tripulacao: 4 },
  misseis:      { alcanceKm: 1600,  velocidade: 'Mach 0.74' },
  defesa_aerea: { alcanceKm: 160 },
};

// ── Fichas do equipamento REAL por país ───────────────────────────────
// Só o que difere do padrão do tipo. O nome/foto/fabricante seguem morando em
// equipamentos.js e dados/paises/<iso>.js — aqui é SÓ número de engenharia.
export const FICHAS = {
  USA: {
    porta_avioes: { capAeronaves: 75, alcanceKm: Infinity, velocidade: '30+ nós', tripulacao: 4539 }, // Gerald R. Ford — nuclear: alcance "ilimitado"
    cacas:        { alcanceKm: 1240, velocidade: 'Mach 1.6', tripulacao: 1 },      // F-35 Lightning II
    bombardeiros: { alcanceKm: 9400, velocidade: 'Mach 1.2', tripulacao: 4 },      // B-1B Lancer
    drones:       { alcanceKm: 1900, velocidade: '480 km/h', tripulacao: 0 },      // MQ-9 Reaper
    navios:       { alcanceKm: 8100, velocidade: '30+ nós', tripulacao: 329 },     // Arleigh Burke
    submarinos:   { alcanceKm: Infinity, velocidade: '25+ nós', tripulacao: 135 }, // Virginia — nuclear
  },
  CHN: { porta_avioes: { capAeronaves: 60, tripulacao: 5000 } },                   // Fujian
  FRA: { porta_avioes: { capAeronaves: 40, alcanceKm: Infinity, tripulacao: 1950 } }, // Charles de Gaulle — nuclear
  GBR: { porta_avioes: { capAeronaves: 40, alcanceKm: 19000, tripulacao: 1600 } }, // Queen Elizabeth (surge 72)
  IND: { porta_avioes: { capAeronaves: 30, tripulacao: 1645 } },                   // INS Vikrant
  ITA: { porta_avioes: { capAeronaves: 20, tripulacao: 1210 } },                   // Cavour
  TUR: { porta_avioes: { capAeronaves: 12, soAsaRotativa: true, tripulacao: 1400 } }, // TCG Anadolu — navio de drones (TB-3)
  BRA: { porta_avioes: { capAeronaves: 8,  soAsaRotativa: true, tripulacao: 1000 } }, // PHM Atlântico — só helicóptero/drone
};

// Ficha completa do que ESTE país opera naquele slot: padrão do tipo + país por cima.
export function fichaDe(iso, slot) {
  return { ...(FICHA_PADRAO[slot] || {}), ...(FICHAS[iso]?.[slot] || {}) };
}

// Quantas aeronaves UM porta-aviões deste país embarca. É o número que a UI
// naval usa pra travar a matemática — sem ele voltava o "1000 aviões num carrier".
export function capacidadePorCarrier(iso) {
  return fichaDe(iso, 'porta_avioes').capAeronaves || FICHA_PADRAO.porta_avioes.capAeronaves;
}

// Convés sem catapulta: caça e bombardeiro NÃO decolam — só drone (asa rotativa/VANT).
// É o que separa um supercarrier de um "porta-helicópteros com marketing".
export function carrierSoAsaRotativa(iso) {
  return !!fichaDe(iso, 'porta_avioes').soAsaRotativa;
}
