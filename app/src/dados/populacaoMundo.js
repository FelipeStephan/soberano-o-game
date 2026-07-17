// População aproximada (milhões) — só o suficiente pra escalar mortos/gravidade de
// pandemia. Protótipo acadêmico; números redondos do mundo real. `mundoVivo.js` não
// pode depender da UI/GeoJSON, então a tabela mora aqui, estática e serializável.
export const POPULACAO_MI = {
  USA: 335, CHN: 1410, IND: 1430, IDN: 277, PAK: 240, NGA: 223, BRA: 216, BGD: 173,
  RUS: 144, MEX: 128, JPN: 124, ETH: 126, PHL: 117, EGY: 111, VNM: 98, IRN: 89,
  TUR: 85, DEU: 84, THA: 72, GBR: 68, FRA: 68, ITA: 59, ZAF: 60, KOR: 52, COL: 52,
  ESP: 48, ARG: 46, DZA: 45, UKR: 38, IRQ: 44, POL: 38, MAR: 37, SAU: 37, PER: 34,
  MYS: 34, AGO: 35, KEN: 55, CAN: 39, AUS: 26, TWN: 24, ROU: 19, KAZ: 20, ARE: 10,
  QAT: 3, KWT: 4.3, JOR: 11, GRC: 10, SWE: 10, ISR: 9.7, PRK: 26, VEN: 28,
};
export function populacaoDe(iso) { return POPULACAO_MI[iso] || 25; }
