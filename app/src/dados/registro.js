// ═══════════════════════════════════════════════════════════════════════
// REGISTRO DE NAÇÕES JOGÁVEIS
// ═══════════════════════════════════════════════════════════════════════
// Uma porta única pra todos os países. Cada módulo em dados/paises/<iso>.js traz
// { ficha, forcas, empresas, equipamentos } e este arquivo os costura no jogo.
//
// ── A FONTE ÚNICA (decisão de arquitetura) ───────────────────────────
// Os arquivos de país trazem cópias de empresas/equipamentos que também existem em
// dados/empresas.js e dados/equipamentos.js. Duplicação garante divergência na
// primeira edição. A regra aqui, e ela é dura:
//
//   dados/paises/<iso>.js é a FONTE ÚNICA de qualquer país que tenha arquivo.
//   dados/empresas.js e equipamentos.js viram FALLBACK — valem só pra quem
//   ainda não tem arquivo próprio.
//
// `empresasDoPais()` e `equipamentosDoPais()` abaixo implementam essa precedência.
// Se você editar a Petrobras, edite em dados/paises/bra.js.
import { FICHA_EUA_2026 } from './eua-2026.js';
import { FORCAS_EUA } from './forcas.js';
import { EMPRESAS_POR_PAIS, empresasDe } from './empresas.js';
import { EQUIPAMENTOS } from './equipamentos.js';
import { soldadoDoPais } from './soldados.js';
import { gabineteDe } from './gabinetes.js';

import { PAIS_BRA } from './paises/bra.js';
import { PAIS_CHN } from './paises/chn.js';
import { PAIS_RUS } from './paises/rus.js';
import { PAIS_IND } from './paises/ind.js';
import { PAIS_DEU } from './paises/deu.js';
import { PAIS_FRA } from './paises/fra.js';
import { PAIS_GBR } from './paises/gbr.js';
import { PAIS_JPN } from './paises/jpn.js';
import { PAIS_KOR } from './paises/kor.js';
import { PAIS_ISR } from './paises/isr.js';
import { PAIS_IRN } from './paises/irn.js';
import { PAIS_TUR } from './paises/tur.js';
import { PAIS_SAU } from './paises/sau.js';
import { PAIS_EGY } from './paises/egy.js';
import { PAIS_UKR } from './paises/ukr.js';
import { PAIS_PRK } from './paises/prk.js';
import { PAIS_PAK } from './paises/pak.js';
import { PAIS_VEN } from './paises/ven.js';
import { PAIS_IDN } from './paises/idn.js';

// Os EUA vieram antes do formato de módulo de país — são montados aqui pra
// caber no mesmo molde, sem reescrever a ficha original feita à mão.
const PAIS_USA = {
  ficha: FICHA_EUA_2026,
  forcas: FORCAS_EUA,
  empresas: EMPRESAS_POR_PAIS.USA,
  equipamentos: EQUIPAMENTOS.USA,
};

export const NACOES = {
  USA: PAIS_USA,
  CHN: PAIS_CHN,
  RUS: PAIS_RUS,
  IND: PAIS_IND,
  BRA: PAIS_BRA,
  DEU: PAIS_DEU,
  FRA: PAIS_FRA,
  GBR: PAIS_GBR,
  JPN: PAIS_JPN,
  KOR: PAIS_KOR,
  ISR: PAIS_ISR,
  IRN: PAIS_IRN,
  TUR: PAIS_TUR,
  SAU: PAIS_SAU,
  EGY: PAIS_EGY,
  UKR: PAIS_UKR,
  PRK: PAIS_PRK,
  PAK: PAIS_PAK,
  VEN: PAIS_VEN,
  IDN: PAIS_IDN,
};

// ── ORDEM DO MENU ─────────────────────────────────────────────────────
// Agrupada por arquétipo de partida, não por PIB. Quem abre o jogo quer saber
// que tipo de partida vai jogar, não quem é mais rico.
export const GRUPOS = [
  {
    rot: 'Superpotências',
    nota: 'Você já tem tudo. A pergunta é o que fazer com isso — e por quanto tempo consegue segurar.',
    isos: ['USA', 'CHN', 'RUS'],
  },
  {
    rot: 'Grandes potências',
    nota: 'Peso real, autonomia limitada. Você joga entre gigantes e precisa escolher lados sem virar vassalo.',
    isos: ['IND', 'GBR', 'FRA', 'DEU', 'JPN'],
  },
  {
    rot: 'Potências regionais',
    nota: 'Você manda no seu quintal e é peça no tabuleiro dos outros. O jogo é converter geografia em poder.',
    isos: ['BRA', 'KOR', 'TUR', 'SAU', 'ISR', 'EGY'],
  },
  {
    rot: 'Estados sob cerco',
    nota: 'Sancionado, cercado ou invadido. Partida difícil: sobreviver já é vitória, e vencer é impensável.',
    isos: ['IRN', 'UKR', 'PRK', 'VEN'],
  },
  {
    rot: 'Encruzilhadas',
    nota: 'Sentados em cima de algo que o mundo precisa atravessar. Pequenos no papel, decisivos no mapa.',
    isos: ['PAK', 'IDN'],
  },
];

export function nacao(isoCode) { return NACOES[isoCode] || NACOES.USA; }
export function existe(isoCode) { return Boolean(NACOES[isoCode]); }
export function jogaveis() { return Object.keys(NACOES); }

export function fichaDe(isoCode) {
  const n = nacao(isoCode);
  // Garante que a ficha carrega as forças (o motor lê ficha.forcasIniciais).
  return { ...n.ficha, forcasIniciais: n.ficha.forcasIniciais || n.forcas };
}

// PRECEDÊNCIA: arquivo do país primeiro; catálogo antigo só como fallback.
export function empresasDoPais(isoCode) {
  const n = NACOES[isoCode];
  if (n?.empresas?.length) return n.empresas.map((e) => ({ ...e }));
  return empresasDe(isoCode);
}

// O GABINETE do país. Isto conserta o bug que o usuário pegou: jogando de Brasil,
// a Máquina narrava uma crise pela "Diretora da CIA" porque o elenco era fixo dos EUA.
// Agora o Brasil tem ABIN e Itamaraty, e a Rússia tem SVR.
export function elencoDoPais(isoCode) {
  return gabineteDe(isoCode);
}

export function equipamentosDoPais(isoCode) {
  const n = NACOES[isoCode];
  const base = n?.equipamentos || EQUIPAMENTOS[isoCode] || EQUIPAMENTOS.USA;
  // A foto do SOLDADO por país (dados/soldados.js) preenche quem não tem `infantaria`
  // própria. Países com ficha própria de infantaria (CHN/IND/RUS) mantêm a sua.
  if (base?.infantaria) return base;
  return { ...base, infantaria: soldadoDoPais(isoCode) };
}

// Cartão do menu inicial: o resumo de uma linha e o número que define a partida.
export function cartaoDe(isoCode) {
  const n = NACOES[isoCode];
  if (!n) return null;
  const e = n.ficha.estadoInicial;
  return {
    iso: isoCode,
    nome: n.ficha.pais,
    lider: n.ficha.presidente,
    capital: n.ficha.capital,
    pib: e.pib,
    ogivas: e.ogivas,
    militar: e.poder_militar,
    liberdades: e.liberdades,
    resumo: n.ficha.resumo,
  };
}
