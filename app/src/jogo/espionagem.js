// ═══════════════════════════════════════════════════════════════════════
// ESPIONAGEM — o que é SECRETO, e como você vaza o segredo dos outros
// ═══════════════════════════════════════════════════════════════════════
// A premissa que faltava: você NÃO deveria saber a força que um país guarda em cada
// estado. Isso é segredo de Estado. Por padrão, o inimigo é uma névoa — você vê que ele
// tem exército, não ONDE. Para enxergar o mapa dele, você ESPIONA.
//
// Como funciona (pensado para tempo real e para o online):
//   • Você INVESTE espionagem contra um alvo → sobe o seu `nivel` contra ele.
//   • A cada batida do mundo há uma CHANCE PEQUENA de um VAZAMENTO — racionado: no máximo
//     um por alvo por batida. A chance cresce com o seu nível + inteligência e CAI com a
//     contra-inteligência do alvo. Continuar investindo aumenta as chances.
//   • Cada vazamento LIBERA uma camada de intel (do mais fácil ao mais difícil): o gasto
//     secreto dele → as forças por estado → os movimentos navais → os planos de ataque.
//   • Intel ESFRIA: cada vazamento expira em N batidas. Sem sustentar o investimento, a
//     névoa volta. Se você investe pesado e o alvo não se defende, vaza tudo até não sobrar
//     segredo. Contra-espionagem é a defesa — blinda os SEUS segredos (crucial no online).
import { PAISES } from '../dados/paises.js';
import { rand } from './rng.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// As camadas de intel, do vazamento mais fácil ao mais difícil (nivelMin = investimento
// mínimo pra aquela camada poder vazar; dur = batidas até a intel esfriar).
export const VAZAMENTOS = [
  { tipo: 'gastos',        nivelMin: 12, dur: 14, rot: 'Orçamento secreto',  ico: '💰' },
  { tipo: 'forcas_estado', nivelMin: 35, dur: 12, rot: 'Forças por estado',  ico: '🗺️' },
  { tipo: 'naval',         nivelMin: 55, dur: 10, rot: 'Movimentos navais',  ico: '⚓' },
  { tipo: 'mobilizacao',   nivelMin: 78, dur: 8,  rot: 'Planos de ataque',   ico: '🎯' },
];
export const VAZAMENTO_POR_TIPO = Object.fromEntries(VAZAMENTOS.map((v) => [v.tipo, v]));

// Contra-inteligência de cada país (0–100): quão difícil é espioná-lo. Serviço forte
// (CIA/MSS/SVR/Mossad/MI6) blinda; o resto vaza mais fácil. É a resistência do alvo.
const CONTRA_INTEL = {
  USA: 80, CHN: 78, RUS: 76, ISR: 84, GBR: 70, FRA: 62, IRN: 60, PRK: 72, IND: 52, DEU: 55,
  JPN: 54, KOR: 58, TUR: 46, SAU: 40, PAK: 50, UKR: 42, EGY: 36, IDN: 30, VEN: 28, BRA: 34,
};
export function contraIntelDe(iso) { return CONTRA_INTEL[iso] ?? 34; }

export function fichaEsp(estado, alvo) {
  estado.espionagem = estado.espionagem || {};
  if (!estado.espionagem[alvo]) estado.espionagem[alvo] = { nivel: 0, vazamentos: {} };
  return estado.espionagem[alvo];
}

// Invisto: sobe o meu nível de espionagem contra o alvo (teto 100).
export function investirEspionagem(estado, alvo, ganho) {
  const f = fichaEsp(estado, alvo);
  f.nivel = clamp((f.nivel || 0) + ganho, 0, 100);
  return f.nivel;
}

// Tenho intel `tipo` sobre `alvo` AGORA (vazamento ativo, não esfriado)?
export function temIntel(estado, alvo, tipo) {
  const exp = estado?.espionagem?.[alvo]?.vazamentos?.[tipo];
  return !!(exp && (estado.turno || 0) <= exp);
}

// Todos os alvos sob os quais tenho ALGUMA intel ativa (pro globo saber o que revelar).
export function alvosComIntel(estado, tipo) {
  const out = [];
  for (const alvo of Object.keys(estado?.espionagem || {})) if (temIntel(estado, alvo, tipo)) out.push(alvo);
  return out;
}

// O nível efetivo de espionagem contra um alvo (0–100).
export function nivelEsp(estado, alvo) { return Math.round(estado?.espionagem?.[alvo]?.nivel || 0); }

// A CHANCE, nesta batida, de um vazamento novo (0–1). Cresce com nível + inteligência;
// cai com a contra-inteligência do alvo. Pequena de propósito — intel é paciência.
export function chanceVazamento(estado, alvo) {
  const f = estado?.espionagem?.[alvo]; if (!f || f.nivel <= 0) return 0;
  const minhaIntel = estado.inteligencia || 30;
  const contra = contraIntelDe(alvo);
  return clamp(((f.nivel * 0.55 + minhaIntel * 0.45) - contra) / 210, 0, 0.42);
}

// O próximo vazamento que PODE cair (nível suficiente e ainda não ativo), ou null.
export function proximoVazamento(estado, alvo) {
  const f = estado?.espionagem?.[alvo]; if (!f) return null;
  return VAZAMENTOS.find((v) => f.nivel >= v.nivelMin && !temIntel(estado, alvo, v.tipo)) || null;
}

// O TIQUE (roda no beatMundo): tenta vazar UMA camada por alvo espionado. Racionado e
// aleatório. Também esfria o nível devagar (intel exige sustentação). Devolve os vazamentos
// novos desta batida, pra virarem manchete.
export function tickEspionagem(estado) {
  const novos = [];
  const turno = estado.turno || 0;
  for (const [alvo, f] of Object.entries(estado.espionagem || {})) {
    if ((f.nivel || 0) <= 0) continue;
    f.nivel = Math.max(0, f.nivel - 0.6);                       // a intel esfria sem sustento
    if (rand() > chanceVazamento(estado, alvo)) continue;
    const disp = proximoVazamento(estado, alvo);
    if (!disp) continue;
    f.vazamentos[disp.tipo] = turno + disp.dur;                 // expira em `dur` batidas
    novos.push({ alvo, tipo: disp.tipo, def: disp });
  }
  return novos;
}

// A MANCHETE de um vazamento — o que o espião trouxe. No online/IA, dá pra extrair das
// AÇÕES reais do alvo (o que ele gastou); offline, deriva do estado do país.
export function mancheteVazamento(estado, alvo, tipo) {
  const nome = PAISES[alvo]?.nome || alvo;
  const forca = PAISES[alvo]?.forca || 30;
  if (tipo === 'gastos') {
    const perfil = forca >= 90 ? 'despeja fortunas no complexo militar' : forca >= 55 ? 'reforça as Forças Armadas com folga' : 'aperta o cinto e investe pouco na defesa';
    return `🕵️ VAZAMENTO · ${nome}: sua rede confirma que o país ${perfil}. O orçamento secreto está na sua mesa.`;
  }
  if (tipo === 'forcas_estado') return `🗺️ VAZAMENTO · ${nome}: seus espiões mapearam a ordem de batalha. Agora você vê a guarnição de CADA estado dele no globo.`;
  if (tipo === 'naval') return `⚓ VAZAMENTO · ${nome}: você grampeou a rede naval — as frotas dele aparecem no seu mapa mesmo fora do seu radar.`;
  if (tipo === 'mobilizacao') return `🎯 VAZAMENTO · ${nome}: fonte interna entrega os planos — você saberá antes se ${nome} preparar um ataque.`;
  return `Vazamento de ${nome}.`;
}
