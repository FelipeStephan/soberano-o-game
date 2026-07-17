// ═══════════════════════════════════════════════════════════════════════
// PORTOS NAVAIS — a SAÍDA PARA O MAR de cada país costeiro
// ═══════════════════════════════════════════════════════════════════════
// Uma frota não nasce no meio do oceano: ela ZARPA de um porto. Este é o ponto de
// embarque de cada país — a base naval real de onde a esquadra sai. É daqui que o motor
// calcula a distância (e o tempo) até onde você mandou a frota. País sem costa não tem
// porto (portoDe devolve null) — e, portanto, não projeta poder naval.
export const PORTOS = {
  USA: { lat: 36.95, lng: -76.33, nome: 'Norfolk' },
  CHN: { lat: 36.07, lng: 120.38, nome: 'Qingdao' },
  RUS: { lat: 44.62, lng: 33.53, nome: 'Sevastopol' },
  IND: { lat: 18.95, lng: 72.83, nome: 'Mumbai' },
  BRA: { lat: -22.90, lng: -43.15, nome: 'Rio de Janeiro' },
  DEU: { lat: 53.51, lng: 8.14, nome: 'Wilhelmshaven' },
  FRA: { lat: 43.12, lng: 5.93, nome: 'Toulon' },
  GBR: { lat: 50.80, lng: -1.10, nome: 'Portsmouth' },
  JPN: { lat: 35.29, lng: 139.67, nome: 'Yokosuka' },
  KOR: { lat: 35.10, lng: 129.04, nome: 'Busan' },
  ISR: { lat: 32.83, lng: 34.98, nome: 'Haifa' },
  IRN: { lat: 27.15, lng: 56.21, nome: 'Bandar Abbas' },
  TUR: { lat: 40.72, lng: 29.83, nome: 'Gölcük' },
  SAU: { lat: 21.50, lng: 39.17, nome: 'Jeddah' },
  EGY: { lat: 31.20, lng: 29.92, nome: 'Alexandria' },
  UKR: { lat: 46.48, lng: 30.74, nome: 'Odesa' },
  PRK: { lat: 39.15, lng: 127.45, nome: 'Wonsan' },
  PAK: { lat: 24.80, lng: 66.98, nome: 'Karachi' },
  VEN: { lat: 10.60, lng: -66.93, nome: 'La Guaira' },
  IDN: { lat: -7.20, lng: 112.73, nome: 'Surabaya' },
  // candidatos (para quando virarem jogáveis)
  MEX: { lat: 19.18, lng: -96.14, nome: 'Veracruz' },
  CAN: { lat: 44.65, lng: -63.57, nome: 'Halifax' },
  AUS: { lat: -33.85, lng: 151.22, nome: 'Sydney' },
  ITA: { lat: 40.47, lng: 17.24, nome: 'Taranto' },
  POL: { lat: 54.52, lng: 18.55, nome: 'Gdynia' },
  ARG: { lat: -38.90, lng: -62.10, nome: 'Puerto Belgrano' },
  VNM: { lat: 11.92, lng: 109.22, nome: 'Cam Ranh' },
  TWN: { lat: 22.62, lng: 120.28, nome: 'Kaohsiung' },
};

// País mediterrâneo/sem litoral fica de fora — não tem por onde a frota sair.
export function portoDe(iso) { return PORTOS[iso] || null; }
export function temPorto(iso) { return !!PORTOS[iso]; }
