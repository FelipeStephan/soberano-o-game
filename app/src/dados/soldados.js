// ═══════════════════════════════════════════════════════════════════════
// SOLDADO POR PAÍS — a foto e o fuzil-padrão do infante de cada nação
// ═══════════════════════════════════════════════════════════════════════
// A "Infantaria" do jogo virou "Soldados" (dados/forcas.js) e ganhou número real por
// país. Faltava o ROSTO: assim como cada tanque/caça tem foto, cada exército tem o seu
// soldado. Cada entrada nomeia o combatente + o fuzil de serviço REAL daquele país
// (M4, IA2, G36, HK416, Tavor…) e aponta uma foto do Wikimedia Commons.
//
// Isto é FALLBACK: um país cujo arquivo (dados/paises/<iso>.js) já traz `infantaria`
// própria (CHN, IND, RUS) mantém a sua — a fusão em registro.js só preenche quem falta.
// Foto quebrada degrada de boa: o <img onerror> do jogo cai no ícone 🪖.
// URLs verificadas (HTTP 200 + image/jpeg, página do Commons conferida e imagem olhada).
export const SOLDADO_POR_PAIS = {
  USA: { nome: 'Fuzileiro do Exército (M4)',              foto: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Colt_M4_MWS_Carbine_Iraq.jpg' },
  CHN: { nome: 'Fuzileiro do EPL (QBZ-95)',               foto: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Honor_guard_of_the_People%27s_Liberation_Army.jpg' },
  RUS: { nome: 'Fuzileiro do Exército (AK-12)',           foto: 'https://upload.wikimedia.org/wikipedia/commons/4/43/An_AK-15_carried_by_Russian_soldier.jpg' },
  IND: { nome: 'Fuzileiro do Exército Indiano (INSAS)',   foto: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Indian_Army_soldier_at_Camp_Babina.jpg' },
  BRA: { nome: 'Fuzileiro (IA2 5,56)',                    foto: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Exerc%C3%ADcio_conjunto_de_enfrentamento_ao_terrorismo_%2827103014582%29.jpg' },
  DEU: { nome: 'Fuzileiro da Bundeswehr (G36)',           foto: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Bundeswehr_G36.jpg' },
  FRA: { nome: 'Fuzileiro do Exército (HK416F)',          foto: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/HK416_F_French_military.jpg' },
  GBR: { nome: 'Fuzileiro do Exército (L85A2)',           foto: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Soldier_firing_L85A2_in_Afghanistan_%28MoD%29.jpg' },
  JPN: { nome: 'Fuzileiro da JGSDF (Howa Type 89)',       foto: 'https://upload.wikimedia.org/wikipedia/commons/3/37/36IR_soldier_Type_89.jpg' },
  KOR: { nome: 'Fuzileiro do Exército (K2)',              foto: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/DMZ_2585.jpg' },
  ISR: { nome: 'Fuzileiro da IDF (Tavor X95)',            foto: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Flickr_-_Israel_Defense_Forces_-_Givati_Brigade_Drill_%281%29.jpg' },
  IRN: { nome: 'Soldado do Artesh (G3/Fajr)',             foto: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Artesh_Iran_Army_003.jpg' },
  TUR: { nome: 'Soldado do Exército Turco (MPT-76)',      foto: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Turkish_Infantry_Company_provides_vital_mission_capabilities_to_Kosovo_Force_%284692801%29.jpg' },
  SAU: { nome: 'Soldado do Exército Saudita (G3)',        foto: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saudi_Soldier_with_G3.JPEG' },
  EGY: { nome: 'Soldado do Exército Egípcio (M4/Maadi)',  foto: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Egyptian_infantry_at_Bright_Star_Operations_2005.jpg' },
  UKR: { nome: 'Soldado do Exército Ucraniano (AK-74)',   foto: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/153rd_Mechanised_Brigade_undergoing_small_arms_training_-_5_February_2024.jpg' },
  PRK: { nome: 'Soldado do Exército Popular (Type 88)',   foto: 'https://upload.wikimedia.org/wikipedia/commons/3/38/North_Korean_Soldier.jpg' },
  PAK: { nome: 'Soldado do Exército Paquistanês (G3)',    foto: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Pak-army-sol.jpg' },
  VEN: { nome: 'Soldado do Exército Bolivariano (AK-103)', foto: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Chavez_Vive_Militar.jpg' },
  IDN: { nome: 'Soldado da TNI-AD (Pindad SS2)',          foto: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Indonesian_Army_%28TNI_AD%29_330th_Infantry_Battalion%2C_17th_Infantry_Brigade%2C_1st_Infantry_Division%2C_Army_Strategic_Reserve_Command_%28KOSTRAD%29.jpg' },
};

export function soldadoDoPais(iso) { return SOLDADO_POR_PAIS[iso] || SOLDADO_POR_PAIS.USA; }
