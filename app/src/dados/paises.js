// Mapa de países relevantes para o globo. Liga o ISO_A3 do GeoJSON à chave de
// relação usada no estado (rel_<x>) e a metadados. Países fora do mapa recebem
// uma relação neutra e uma chave sintetizada rel_<iso>.

// ── QUEM É VOCÊ ───────────────────────────────────────────────────────
// Isto ERA uma const fixa em 'USA', importada em 12 lugares. Com 20 países jogáveis
// ela precisa mudar em tempo de execução — mas exportar um `let` significa que quem
// importa recebe uma cópia congelada no momento do import (bindings de ES module são
// vivos só na exportação, não em quem re-exporta valor primitivo por engano).
//
// Por isso: uma função `souEu(iso)` e um getter. Nada de comparar contra a constante.
let _jogadorIso = 'USA';
export function definirJogador(isoCode) { _jogadorIso = isoCode; }
export function jogadorIso() { return _jogadorIso; }
export function souEu(isoCode) { return isoCode === _jogadorIso; }

// Compatibilidade: código antigo importa PAIS_JOGADOR_ISO. Mantido como getter
// de objeto pra não quebrar, mas o certo é usar souEu()/jogadorIso().
export const PAIS_JOGADOR_ISO = 'USA';

// A chave de relação de um país é sempre a MESMA, independente de quem joga:
// rel_brasil é "relação com o Brasil". Quem joga com o Brasil simplesmente não
// tem essa chave no estado (você não tem relação consigo mesmo).
export const PAISES = {
  USA: { nome: 'Estados Unidos',   rel: 'rel_eua',     bloco: 'Superpotência',   forca: 254 },
  CHN: { nome: 'China',            rel: 'rel_china',   bloco: 'Rival sistêmico', forca: 235 },
  IRN: { nome: 'Irã',              rel: 'rel_ira',     bloco: 'Adversário',      forca: 55 },
  RUS: { nome: 'Rússia',           rel: 'rel_russia',  bloco: 'Adversário',      forca: 165 },
  BRA: { nome: 'Brasil',           rel: 'rel_brasil',  bloco: 'Não-alinhado',    forca: 48 },
  ISR: { nome: 'Israel',           rel: 'rel_israel',  bloco: 'Aliado',          forca: 70 },
  TWN: { nome: 'Taiwan',           rel: 'rel_taiwan',  bloco: 'Parceiro',        forca: 45 },
  SAU: { nome: 'Arábia Saudita',   rel: 'rel_arabia',  bloco: 'Parceiro',        forca: 52 },
  DEU: { nome: 'Alemanha',         rel: 'rel_ue',      bloco: 'OTAN / UE',       forca: 60 },
  FRA: { nome: 'França',           rel: 'rel_ue',      bloco: 'OTAN / UE',       forca: 75 },
  GBR: { nome: 'Reino Unido',      rel: 'rel_reino',   bloco: 'OTAN',            forca: 78 },
  UKR: { nome: 'Ucrânia',          rel: 'rel_ucrania', bloco: 'Parceiro',        forca: 40 },
  IND: { nome: 'Índia',            rel: 'rel_india',   bloco: 'Não-alinhado',    forca: 130 },
  JPN: { nome: 'Japão',            rel: 'rel_japao',   bloco: 'Aliado',          forca: 68 },
  KOR: { nome: 'Coreia do Sul',    rel: 'rel_coreia',  bloco: 'Aliado',          forca: 62 },
  PRK: { nome: 'Coreia do Norte',  rel: 'rel_norte',   bloco: 'Adversário',      forca: 58 },
  MEX: { nome: 'México',           rel: 'rel_mexico',  bloco: 'Vizinho',         forca: 28 },
  CAN: { nome: 'Canadá',           rel: 'rel_canada',  bloco: 'Aliado',          forca: 35 },
  AUS: { nome: 'Austrália',        rel: 'rel_australia', bloco: 'Aliado',        forca: 42 },
  TUR: { nome: 'Turquia',          rel: 'rel_turquia', bloco: 'OTAN',            forca: 66 },
  PAK: { nome: 'Paquistão',        rel: 'rel_paquistao', bloco: 'Não-alinhado',  forca: 72 },
  VEN: { nome: 'Venezuela',        rel: 'rel_venezuela', bloco: 'Adversário',    forca: 22 },
  IDN: { nome: 'Indonésia',        rel: 'rel_indonesia', bloco: 'Não-alinhado',  forca: 38 },
  EGY: { nome: 'Egito',            rel: 'rel_egito',   bloco: 'Parceiro',        forca: 45 },
};

// Estima a força de combate de um país (majors têm tabela; resto deriva do PIB do GeoJSON).
export function estimaForca(feature) {
  const info = PAISES[iso(feature)];
  if (info?.forca) return info.forca;
  const gdp = Number(feature?.properties?.GDP_MD || 0); // milhões
  return Math.max(12, Math.round(gdp / 45000));
}

// Nome legível de uma chave de relação (rel_ira → "Irã"). Nada de variável crua na tela.
const NOME_POR_REL = {};
for (const info of Object.values(PAISES)) if (!NOME_POR_REL[info.rel]) NOME_POR_REL[info.rel] = info.nome;
NOME_POR_REL.rel_ue = 'União Europeia';
NOME_POR_REL.rel_reino = 'Reino Unido';
NOME_POR_REL.rel_aliados = 'Aliados';

// Só o NOME do país por trás da chave (rel_ira → "Irã"). Quem escreve frase precisa
// disto: "fronteira com Irã", não "fronteira com Relação: Irã".
export function nomeDeRelacao(chave) {
  const n = NOME_POR_REL[chave];
  if (n) return n;
  const bruto = String(chave).replace(/^rel_/, '').replace(/_/g, ' ');
  return `${bruto.charAt(0).toUpperCase()}${bruto.slice(1)}`;
}

// O rótulo da PÍLULA do HUD ("Relação: Irã  -12"). Deriva do nome — uma fonte só.
export function rotuloRelacao(chave) {
  return `Relação: ${nomeDeRelacao(chave)}`;
}

// ── Gramática dos nomes de país ───────────────────────────────────────
// "O convite de China" é a frase que denuncia que um humano não escreveu aquilo. Num
// jogo cuja alma é texto, concordância não é preciosismo — é a diferença entre um
// despacho diplomático e um placeholder. Nome de país em português carrega artigo, e
// o artigo é irregular: A China, O Brasil, OS Estados Unidos, e Israel sem nenhum.
const ARTIGO = {
  Alemanha: 'a', 'Arábia Saudita': 'a', Austrália: 'a', China: 'a', 'Coreia do Norte': 'a',
  'Coreia do Sul': 'a', França: 'a', Indonésia: 'a', Rússia: 'a', Turquia: 'a',
  Ucrânia: 'a', Venezuela: 'a', Índia: 'a', 'União Europeia': 'a',
  Brasil: 'o', Canadá: 'o', Egito: 'o', Irã: 'o', Japão: 'o', México: 'o',
  Paquistão: 'o', 'Reino Unido': 'o',
  'Estados Unidos': 'os', Aliados: 'os',
  Israel: '', Taiwan: '',   // sem artigo — "de Israel", não "do Israel"
};

export function artigoDe(nome) { return ARTIGO[nome] ?? ''; }

// "de" + país → "da China" · "do Brasil" · "dos Estados Unidos" · "de Israel"
export function dePais(nome) {
  return { a: `da ${nome}`, o: `do ${nome}`, os: `dos ${nome}` }[artigoDe(nome)] || `de ${nome}`;
}

// "com" + país → "com a China" · "com o Irã" · "com Israel"
export function comPais(nome) {
  const art = artigoDe(nome);
  return art ? `com ${art} ${nome}` : `com ${nome}`;
}

// país com artigo → "o Brasil" · "a China" · "os Estados Unidos" · "Israel"
export function oPais(nome) {
  const art = artigoDe(nome);
  return art ? `${art} ${nome}` : nome;
}

// "os Estados Unidos INVADIU" foi o que saiu quando montei frase sem olhar o número.
// Nome de país em português pode ser plural, e o verbo tem de concordar. Só os Estados
// Unidos (e "Aliados") são plurais no nosso catálogo — mas basta um pra estragar a frase.
export function ehPlural(nome) { return artigoDe(nome) === 'os'; }

// verbo(nome, 'invadiu', 'invadiram') → concorda sozinho.
export function verbo(nome, singular, plural) {
  return ehPlural(nome) ? plural : singular;
}

export function iso(feature) {
  const p = feature?.properties || {};
  // O Natural Earth marca alguns países (França, Noruega…) com ISO_A3 = '-99' por
  // causa da forma como codifica soberania/territórios. '-99' é uma string TRUTHY, então
  // o `||` a devolvia como se fosse um código válido — e a França virava "-99": sem
  // bandeira, sem ficha, com o líder e a linha de conexão indo pro lugar errado.
  // O código real desses casos mora em ADM0_A3 ('FRA', 'NOR'…).
  const a = p.ISO_A3;
  return (a && a !== '-99') ? a : (p.ADM0_A3 || p.SOV_A3 || '');
}

export function nomePais(feature) {
  const p = feature?.properties || {};
  const info = PAISES[iso(feature)];
  return info?.nome || p.NAME_PT || p.NAME || p.ADMIN || 'País';
}

export function chaveRelacao(feature) {
  const info = PAISES[iso(feature)];
  return info?.rel || `rel_${iso(feature).toLowerCase()}`;
}

export function relacaoAtual(estado, feature) {
  return Number(estado[chaveRelacao(feature)] ?? 0);
}
