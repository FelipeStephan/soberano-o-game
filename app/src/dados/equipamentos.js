// EQUIPAMENTO REAL POR PAÍS — cada nação usa o que ela de fato opera.
// `proprio: true`  → produção nacional: mais barato, sem depender de ninguém.
// `proprio: 'licenca'` → montado sob licença: preço médio.
// `proprio: false` → importado: mais caro E refém da relação com o país de origem.
//
// Pesquisa feita com dados/imagens do Wikimedia Commons. O que não achei está
// marcado com `sugerido: true` (usa foto genérica até acharmos a real).
import { FOTO_UNIDADE } from './imagens.js';

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const EQUIPAMENTOS = {
  USA: {
    _nome: 'Estados Unidos',
    blindados:    { nome: 'M1A2 Abrams',        fab: 'General Dynamics',      origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.blindados },
    cacas:        { nome: 'F-35 Lightning II',  fab: 'Lockheed Martin',       origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.cacas },
    helicopteros: { nome: 'AH-64 Apache',       fab: 'Boeing',                origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.helicopteros },
    bombardeiros: { nome: 'B-1B Lancer',        fab: 'Rockwell',              origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.bombardeiros },
    drones:       { nome: 'MQ-9 Reaper',        fab: 'General Atomics',       origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.drones },
    navios:       { nome: 'Destróier Arleigh Burke', fab: 'HII / Bath Iron Works', origem: 'USA', proprio: true, foto: FOTO_UNIDADE.navios },
    submarinos:   { nome: 'Submarino Virginia', fab: 'General Dynamics EB',   origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.submarinos },
    porta_avioes: { nome: 'Classe Gerald R. Ford', fab: 'Newport News',       origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.porta_avioes },
    misseis:      { nome: 'Tomahawk',           fab: 'Raytheon',              origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.misseis },
    artilharia:   { nome: 'M109 Paladin',       fab: 'BAE Systems',           origem: 'USA', proprio: true,  foto: FOTO_UNIDADE.artilharia },
  },

  BRA: {
    _nome: 'Brasil',
    blindados:    { nome: 'VBTP-MR Guarani',    fab: 'Iveco / Exército Brasileiro', origem: 'BRA', proprio: true,
      foto: `${W}/a/a9/19_04_2022-_Dia_do_Ex%C3%A9rcito_Brasileiro_%2852016606453%29.jpg/330px-19_04_2022-_Dia_do_Ex%C3%A9rcito_Brasileiro_%2852016606453%29.jpg` },
    cacas:        { nome: 'F-39 Gripen E',      fab: 'Saab / Embraer',        origem: 'SWE', proprio: 'licenca',
      foto: `${W}/e/e3/Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg/330px-Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg` },
    artilharia:   { nome: 'ASTROS II',          fab: 'Avibras',               origem: 'BRA', proprio: true,
      foto: `${W}/3/31/Avibras_ASTROS-II_SS-30.JPEG/330px-Avibras_ASTROS-II_SS-30.JPEG` },
    navios:       { nome: 'Fragata Tamandaré',  fab: 'thyssenkrupp / Emgepron', origem: 'BRA', proprio: 'licenca',
      foto: `${W}/d/de/Fragata_%E2%80%9CTamandar%C3%A9%E2%80%9D_chega_pela_primeira_vez_ao_Rio_de_Janeiro_%2855336643549%29_%28cropped%29.jpg/330px-Fragata_%E2%80%9CTamandar%C3%A9%E2%80%9D_chega_pela_primeira_vez_ao_Rio_de_Janeiro_%2855336643549%29_%28cropped%29.jpg` },
    submarinos:   { nome: 'Submarino Riachuelo', fab: 'Naval Group / Itaguaí', origem: 'BRA', proprio: 'licenca',
      foto: `${W}/1/12/Submarino_Riachuelo_%28S40%29_%2852816921064%29_%28cropped%29.jpg/330px-Submarino_Riachuelo_%28S40%29_%2852816921064%29_%28cropped%29.jpg` },
    // Fotos verificadas no Commons (mesmas de dados/paises/bra.js — a fonte única;
    // aqui é só o fallback do catálogo antigo, mantido em sincronia).
    helicopteros: { nome: 'HM-4 Jaguar',        fab: 'Helibras / Airbus',     origem: 'FRA', proprio: 'licenca',
      foto: `${W}/b/bb/Opera%C3%A7%C3%A3o_Poseidon_2022_H-36_%22Caracal%22%2C_For%C3%A7a_A%C3%A9rea_Brasileira_%2851999931963%29.jpg/330px-Opera%C3%A7%C3%A3o_Poseidon_2022_H-36_%22Caracal%22%2C_For%C3%A7a_A%C3%A9rea_Brasileira_%2851999931963%29.jpg` },
    drones:       { nome: 'Nauru 1000C',        fab: 'XMobots',               origem: 'BRA', proprio: true,
      foto: `${W}/0/0e/Nauru_1000C_A.jpg/330px-Nauru_1000C_A.jpg` },
    porta_avioes: { nome: 'PHM Atlântico',      fab: 'ex-Royal Navy',         origem: 'GBR', proprio: false,
      foto: `${W}/d/db/Marinha_do_Brasil_-_Navio-Aer%C3%B3dromo_Multiprop%C3%B3sito_Atl%C3%A2ntico_%28A140%29_%2852604542492%29.jpg/330px-Marinha_do_Brasil_-_Navio-Aer%C3%B3dromo_Multiprop%C3%B3sito_Atl%C3%A2ntico_%28A140%29_%2852604542492%29.jpg` },
    misseis:      { nome: 'MANSUP',             fab: 'Avibras / Marinha',     origem: 'BRA', proprio: true,
      foto: `${W}/1/16/Fragata_Liberal_%28F43%29_durante_lan%C3%A7amento_do_m%C3%ADssil_MANSUP_-_2023_%2852853180946%29.jpg/330px-Fragata_Liberal_%28F43%29_durante_lan%C3%A7amento_do_m%C3%ADssil_MANSUP_-_2023_%2852853180946%29.jpg` },
    bombardeiros: { nome: 'KC-390 (transporte)', fab: 'Embraer',              origem: 'BRA', proprio: true,
      foto: `${W}/2/29/Embraer_KC-390_Millennium_For%C3%A7a_A%C3%A9rea_Brasileira.PT-ZNG_5D4_1837_%2853920573206%29.jpg/330px-Embraer_KC-390_Millennium_For%C3%A7a_A%C3%A9rea_Brasileira.PT-ZNG_5D4_1837_%2853920573206%29.jpg` },
  },

  CHN: {
    _nome: 'China',
    blindados:    { nome: 'ZTZ-99A',            fab: 'Norinco',               origem: 'CHN', proprio: true,
      foto: `${W}/7/77/ZTZ-99A_tank_front_20170902.jpg/330px-ZTZ-99A_tank_front_20170902.jpg` },
    cacas:        { nome: 'Chengdu J-20',       fab: 'Chengdu Aerospace',     origem: 'CHN', proprio: true,
      foto: `${W}/7/73/J-20_at_CCAS2022_%2820220827103424%29.jpg/330px-J-20_at_CCAS2022_%2820220827103424%29.jpg` },
    navios:       { nome: 'Destróier Type 055', fab: 'CSSC',                  origem: 'CHN', proprio: true,  foto: FOTO_UNIDADE.navios, sugerido: true },
    porta_avioes: { nome: 'Porta-aviões Fujian', fab: 'Jiangnan',             origem: 'CHN', proprio: true,  foto: FOTO_UNIDADE.porta_avioes, sugerido: true },
    misseis:      { nome: 'DF-21D',             fab: 'CASIC',                 origem: 'CHN', proprio: true,  foto: FOTO_UNIDADE.misseis, sugerido: true },
    drones:       { nome: 'CH-5 Rainbow',       fab: 'CASC',                  origem: 'CHN', proprio: true,  foto: FOTO_UNIDADE.drones, sugerido: true },
  },

  RUS: {
    _nome: 'Rússia',
    blindados:    { nome: 'T-90M Proryv',       fab: 'Uralvagonzavod',        origem: 'RUS', proprio: true,
      foto: `${W}/d/d9/T-90M.jpg/330px-T-90M.jpg` },
    cacas:        { nome: 'Sukhoi Su-57',       fab: 'Sukhoi / UAC',          origem: 'RUS', proprio: true,
      foto: `${W}/0/0e/Sukhoi_Design_Bureau%2C_054%2C_Sukhoi_T-50_%28Su-57_prototype%29_%2849581303977%29.jpg/330px-Sukhoi_Design_Bureau%2C_054%2C_Sukhoi_T-50_%28Su-57_prototype%29_%2849581303977%29.jpg` },
    misseis:      { nome: 'Iskander-M',         fab: 'KBM',                   origem: 'RUS', proprio: true,
      foto: `${W}/2/2f/Army2016demo-075.jpg/330px-Army2016demo-075.jpg` },
    submarinos:   { nome: 'Classe Yasen',       fab: 'Sevmash',               origem: 'RUS', proprio: true,
      foto: `${W}/4/40/%D0%9A-560_%C2%AB%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BE%D0%B4%D0%B2%D0%B8%D0%BD%D1%81%D0%BA%C2%BB.jpg/330px-%D0%9A-560_%C2%AB%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BE%D0%B4%D0%B2%D0%B8%D0%BD%D1%81%D0%BA%C2%BB.jpg` },
  },

  DEU: {
    _nome: 'Alemanha',
    blindados:    { nome: 'Leopard 2A7',        fab: 'KNDS / Rheinmetall',    origem: 'DEU', proprio: true,
      foto: `${W}/a/a7/Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG/330px-Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG` },
    cacas:        { nome: 'Eurofighter Typhoon', fab: 'Airbus / BAE / Leonardo', origem: 'DEU', proprio: true,
      foto: `${W}/3/3c/RAF_Eurofighter_EF-2000_Typhoon_F2_Lofting-1.jpg/330px-RAF_Eurofighter_EF-2000_Typhoon_F2_Lofting-1.jpg` },
    submarinos:   { nome: 'U-Boot Type 212',    fab: 'thyssenkrupp Marine',   origem: 'DEU', proprio: true,
      foto: `${W}/a/af/U_34_in_Fahrt.jpg/330px-U_34_in_Fahrt.jpg` },
  },

  FRA: {
    _nome: 'França',
    blindados:    { nome: 'AMX Leclerc',        fab: 'KNDS France',           origem: 'FRA', proprio: true,
      foto: `${W}/f/fc/Leclerc-openphotonet_PICT6015.JPG/330px-Leclerc-openphotonet_PICT6015.JPG` },
    cacas:        { nome: 'Dassault Rafale',    fab: 'Dassault Aviation',     origem: 'FRA', proprio: true,
      foto: `${W}/6/64/Rafale_-_RIAT_2009_%283751416421%29.jpg/330px-Rafale_-_RIAT_2009_%283751416421%29.jpg` },
    porta_avioes: { nome: 'Charles de Gaulle',  fab: 'Naval Group',           origem: 'FRA', proprio: true,
      foto: `${W}/f/fe/French_aircraft_carrier_Charles_de_Gaulle_%28R91%29_underway_in_the_Ionian_Sea_on_17_March_2022_%28220317-N-DH793-1322%29cropped.JPG/330px-French_aircraft_carrier_Charles_de_Gaulle_%28R91%29_underway_in_the_Ionian_Sea_on_17_March_2022_%28220317-N-DH793-1322%29cropped.JPG` },
  },

  GBR: {
    _nome: 'Reino Unido',
    blindados:    { nome: 'Challenger 2',       fab: 'BAE Systems',           origem: 'GBR', proprio: true,
      foto: `${W}/3/30/Challenger_2_Main_Battle_Tank_patrolling_outside_Basra%2C_Iraq_MOD_45148325.jpg/330px-Challenger_2_Main_Battle_Tank_patrolling_outside_Basra%2C_Iraq_MOD_45148325.jpg` },
    porta_avioes: { nome: 'HMS Queen Elizabeth', fab: 'Aircraft Carrier Alliance', origem: 'GBR', proprio: true,
      foto: `${W}/8/81/HMS_Queen_Elizabeth_in_Gibraltar_-_2018_%2828386226189%29.jpg/330px-HMS_Queen_Elizabeth_in_Gibraltar_-_2018_%2828386226189%29.jpg` },
    submarinos:   { nome: 'Classe Astute',      fab: 'BAE Systems',           origem: 'GBR', proprio: true,
      foto: `${W}/f/f9/HMS_Ambush_long.jpg/330px-HMS_Ambush_long.jpg` },
  },

  IND: {
    _nome: 'Índia',
    blindados:    { nome: 'Arjun Mk1A',         fab: 'DRDO / HVF',            origem: 'IND', proprio: true,
      foto: `${W}/b/b7/Arjun_MK1A_field_trials.jpg/330px-Arjun_MK1A_field_trials.jpg` },
    cacas:        { nome: 'HAL Tejas',          fab: 'HAL',                   origem: 'IND', proprio: true,
      foto: `${W}/6/6f/HAL_Tejas_%28LA-5018%29_of_Squadron_18_Flying_Bullets.jpg/330px-HAL_Tejas_%28LA-5018%29_of_Squadron_18_Flying_Bullets.jpg` },
    misseis:      { nome: 'BrahMos',            fab: 'BrahMos Aerospace',     origem: 'IND', proprio: true,
      foto: `${W}/c/ce/The_Brahmos_Missile_system_passes_through_the_Rajpath_during_the_full_dress_rehearsal_for_the_Republic_Day_Parade_in_New_Delhi_on_January_23%2C2006.jpg/330px-The_Brahmos_Missile_system_passes_through_the_Rajpath_during_the_full_dress_rehearsal_for_the_Republic_Day_Parade_in_New_Delhi_on_January_23%2C2006.jpg` },
    porta_avioes: { nome: 'INS Vikrant',        fab: 'Cochin Shipyard',       origem: 'IND', proprio: true,
      foto: `${W}/9/9d/IAC1_Vikrant_at_Cochin.jpg/330px-IAC1_Vikrant_at_Cochin.jpg` },
  },

  JPN: {
    _nome: 'Japão',
    blindados:    { nome: 'Type 10',            fab: 'Mitsubishi Heavy',      origem: 'JPN', proprio: true,
      foto: `${W}/7/76/Type10MBT.jpg/330px-Type10MBT.jpg` },
    navios:       { nome: 'Classe Izumo',       fab: 'JMU',                   origem: 'JPN', proprio: true,
      foto: `${W}/2/23/JS_Izumo%EF%BC%88DDH-183%EF%BC%89seen_from_the_sky_10-03-2021.jpg/330px-JS_Izumo%EF%BC%88DDH-183%EF%BC%89seen_from_the_sky_10-03-2021.jpg` },
    submarinos:   { nome: 'Classe Sōryū',       fab: 'Mitsubishi / Kawasaki', origem: 'JPN', proprio: true,  foto: FOTO_UNIDADE.submarinos, sugerido: true },
  },

  KOR: {
    _nome: 'Coreia do Sul',
    blindados:    { nome: 'K2 Black Panther',   fab: 'Hyundai Rotem',         origem: 'KOR', proprio: true,
      foto: `${W}/4/41/U.S.%2C_ROK_forces_forge_interoperability_with_combined_arms_exercise_-_8_of_8.jpg/330px-U.S.%2C_ROK_forces_forge_interoperability_with_combined_arms_exercise_-_8_of_8.jpg` },
    artilharia:   { nome: 'K9 Thunder',         fab: 'Hanwha Defense',        origem: 'KOR', proprio: true,
      foto: `${W}/e/ed/2011.2.17_%EC%9C%A1%EA%B5%B06%ED%8F%AC%EB%B3%91%EC%97%AC%EB%8B%A8_k-9%2Ck-55_%EC%9E%90%EC%A3%BC%ED%8F%AC%EC%82%AC%EA%B2%A9_%287633864346%29.jpg/330px-2011.2.17_%EC%9C%A1%EA%B5%B06%ED%8F%AC%EB%B3%91%EC%97%AC%EB%8B%A8_k-9%2Ck-55_%EC%9E%90%EC%A3%BC%ED%8F%AC%EC%82%AC%EA%B2%A9_%287633864346%29.jpg` },
    cacas:        { nome: 'KF-21 Boramae',      fab: 'KAI',                   origem: 'KOR', proprio: true,  foto: FOTO_UNIDADE.cacas, sugerido: true },
  },

  ISR: {
    _nome: 'Israel',
    blindados:    { nome: 'Merkava Mk.4',       fab: 'IDF / MANTAK',          origem: 'ISR', proprio: true,
      foto: `${W}/4/43/Merkava-Mk4m-whiteback01.jpg/330px-Merkava-Mk4m-whiteback01.jpg` },
    misseis:      { nome: 'Iron Dome',          fab: 'Rafael',                origem: 'ISR', proprio: true,
      foto: `${W}/0/08/IDF_Iron_Dome_2021.jpg/330px-IDF_Iron_Dome_2021.jpg` },
    cacas:        { nome: 'F-35I Adir',         fab: 'Lockheed / IAI',        origem: 'USA', proprio: 'licenca', foto: FOTO_UNIDADE.cacas },
  },

  TUR: {
    _nome: 'Turquia',
    blindados:    { nome: 'Altay',              fab: 'BMC / Otokar',          origem: 'TUR', proprio: true,
      foto: `${W}/e/eb/Altay_Tank.jpg/330px-Altay_Tank.jpg` },
    drones:       { nome: 'Bayraktar TB2',      fab: 'Baykar',                origem: 'TUR', proprio: true,
      foto: `${W}/4/4d/Bayraktar_TB2_Runway.jpg/330px-Bayraktar_TB2_Runway.jpg` },
    porta_avioes: { nome: 'TCG Anadolu',        fab: 'Sedef Shipyard',        origem: 'TUR', proprio: true,  foto: FOTO_UNIDADE.porta_avioes, sugerido: true },
  },

  IRN: {
    _nome: 'Irã',
    drones:       { nome: 'Shahed-136',         fab: 'HESA',                  origem: 'IRN', proprio: true,
      foto: `${W}/3/37/2023_IRGC_Aerospace_Force_achievements_Exhibition_in_Qom_%2833%29.jpg/330px-2023_IRGC_Aerospace_Force_achievements_Exhibition_in_Qom_%2833%29.jpg` },
    misseis:      { nome: 'Bavar-373',          fab: 'Ind. de Defesa do Irã', origem: 'IRN', proprio: true,  foto: FOTO_UNIDADE.misseis, sugerido: true },
    blindados:    { nome: 'Karrar',             fab: 'DIO',                   origem: 'IRN', proprio: true,  foto: FOTO_UNIDADE.blindados, sugerido: true },
  },

  ITA: {
    _nome: 'Itália',
    blindados:    { nome: 'C1 Ariete',          fab: 'Iveco / Oto Melara',    origem: 'ITA', proprio: true,
      foto: `${W}/5/52/Italian_Army_-_4th_Tank_Regiment_-_Ariete_tanks_during_an_exercise_at_Capo_Teulada_October_2022.jpg/330px-Italian_Army_-_4th_Tank_Regiment_-_Ariete_tanks_during_an_exercise_at_Capo_Teulada_October_2022.jpg` },
    porta_avioes: { nome: 'Cavour',             fab: 'Fincantieri',           origem: 'ITA', proprio: true,  foto: FOTO_UNIDADE.porta_avioes, sugerido: true },
  },

  SWE: {
    _nome: 'Suécia',
    cacas:        { nome: 'JAS 39 Gripen E',    fab: 'Saab',                  origem: 'SWE', proprio: true,
      foto: `${W}/e/e3/Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg/330px-Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg` },
    navios:       { nome: 'Corveta Visby',      fab: 'Saab Kockums',          origem: 'SWE', proprio: true,
      foto: `${W}/c/c8/Fo182640-14AF.jpg/330px-Fo182640-14AF.jpg` },
  },
};

// Genérico quando o país não tem entrada própria pra aquele slot.
function generico(unidadeId) {
  return { nome: null, fab: 'Fornecedor internacional', origem: null, proprio: false, foto: FOTO_UNIDADE[unidadeId], generico: true };
}

// Equipamento que ESTE país opera naquele slot.
export function equipamentoDe(isoPais, unidadeId) {
  const e = EQUIPAMENTOS[isoPais]?.[unidadeId];
  return e || generico(unidadeId);
}

// Modificador de preço pela cadeia produtiva:
//   próprio 0.8x · licença 1.0x · importado 1.25x (e pior se a relação com a origem for ruim)
export function fatorProducao(estado, equip, relacaoOrigem) {
  if (equip.proprio === true) return { fator: 0.8, rot: 'Produção nacional', cor: '#22e0a0' };
  if (equip.proprio === 'licenca') return { fator: 1.0, rot: 'Montado sob licença', cor: '#ffb020' };
  const penal = relacaoOrigem != null && relacaoOrigem < 0 ? 0.35 : 0;
  return { fator: 1.25 + penal, rot: penal ? 'Importado de país hostil' : 'Importado', cor: penal ? '#ff3b5c' : '#ffb020' };
}

export const PAISES_COM_EQUIP = Object.keys(EQUIPAMENTOS);
