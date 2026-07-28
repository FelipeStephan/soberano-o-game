// ═══════════════════════════════════════════════════════════════════════
// FEITOS — a memória do que cada nação fez no ano
// ═══════════════════════════════════════════════════════════════════════
// O PEDIDO DO DONO: "a cada 1 ano que passar ter um relatório de 1 ano onde seria
// interessante ver o que cada país fez (...) trazer um texto criativo como 'Dominador
// de terras'". E junto: "utiliza o meio de notícia pra divulgar os países que
// investiram em determinado conflito e ajudou a acabar com a guerra (...) mesma coisa
// com doenças que achou a cura".
//
// ── POR QUE ISTO É UM MÓDULO PURO, SEM DOM ────────────────────────────
// Ele vive DENTRO de `estado.feitos`, e `estado` é o que o save serializa e o que
// viaja pela rede (ver save.js). Se um único nó de DOM, função ou classe entrasse
// aqui, o JSON.stringify da partida quebraria e o relatório sumiria no F5. Tudo
// aqui é número, string e array — nada mais.
//
// ── A DECISÃO CENTRAL: EVENTO CRU, AGREGAÇÃO NO FIM ───────────────────
// `registrarFeito` grava um evento cru e barato (iso, tipo, valor, turno). Ninguém
// calcula título na hora. A alternativa — manter contadores incrementais por país —
// parecia mais leve e é uma armadilha: no online os feitos chegam FORA DE ORDEM e
// duplicados (o mesmo ataque volta como `guerra_resultado` no relay), e contador
// incremental não sabe desduplicar. Lista de eventos sabe: tem turno e alvo, dá pra
// comparar. E dá pra reprocessar um ano inteiro se eu mudar a régua dos títulos.
//
// ── O QUE NÃO ENTRA AQUI (o ruído que eu recusei) ─────────────────────
// Cada ação enfileirada, cada post do X, cada tick de economia, cada compra de
// arsenal. São dezenas por ano por país — encheriam o registro, estourariam o save
// e não viram título nenhum. A régua que usei: **se não dá manchete, não é feito.**
// Ninguém abre o jornal por "o Brasil treinou infantaria em março".
import { PAISES } from '../dados/paises.js';

// 1 mês = 1 batida do mundo (30s). 12 batidas fecham o ano.
export const BATIDAS_POR_ANO = 12;

// Teto do registro. 12 meses × ~20 países ativos × alguns feitos = não passa disso
// numa partida normal; o teto existe pro caso patológico (uma sala de 8 pessoas em
// guerra total) não inchar o localStorage e derrubar o autosave.
const TETO_REGISTROS = 600;

// ── AS CATEGORIAS ─────────────────────────────────────────────────────
// A cor é SEMÂNTICA e vale como agrupamento na tela: quem varre o relatório de
// olho já separa conquista (âmbar/perigo) de cura (verde) sem ler uma palavra.
// Mas nenhuma informação depende SÓ da cor — todo título carrega rótulo escrito.
export const CATEGORIAS = {
  conquista:  { rot: 'CONQUISTA',   cor: 'var(--ambar)',  ic: 'map' },
  guerra:     { rot: 'GUERRA',      cor: 'var(--perigo)', ic: 'swords' },
  defesa:     { rot: 'DEFESA',      cor: 'var(--cyan)',   ic: 'shield' },
  cura:       { rot: 'SAÚDE',       cor: 'var(--verde)',  ic: 'heart-pulse' },
  paz:        { rot: 'PAZ',         cor: 'var(--verde)',  ic: 'dove' },
  diplomacia: { rot: 'DIPLOMACIA',  cor: 'var(--cyan)',   ic: 'handshake' },
  economia:   { rot: 'ECONOMIA',    cor: 'var(--verde)',  ic: 'banknote' },
  sombra:     { rot: 'SOMBRA',      cor: 'var(--roxo)',   ic: 'eye' },
  infamia:    { rot: 'INFÂMIA',     cor: 'var(--perigo)', ic: 'skull' },
};

// ── OS TIPOS DE FEITO ─────────────────────────────────────────────────
// `un` documenta o que `valor` significa em cada tipo — é o contrato com quem
// chama `registrarFeito`, e a fonte de erro mais provável se alguém errar a mão
// (mandar "3 estados" onde se espera "0.8 tri" bagunça o pódio inteiro).
// `publico: true` = merece manchete no jornal na hora que acontece (pedido do dono).
export const TIPOS = {
  // ── território ──
  conquista:      { rot: 'Territórios tomados',   cat: 'conquista', un: 'estados',   publico: true },
  anexacao:       { rot: 'Nações anexadas',       cat: 'conquista', un: 'países',    publico: true },
  territorio_perdido: { rot: 'Territórios perdidos', cat: 'defesa',  un: 'estados',  publico: false },
  libertacao:     { rot: 'Soberanias devolvidas', cat: 'paz',       un: 'países',    publico: true },
  // ── guerra ──
  ofensiva:       { rot: 'Ofensivas lançadas',    cat: 'guerra',    un: 'operações', publico: false },
  baixas:         { rot: 'Mortos em combate',     cat: 'guerra',    un: 'milhares',  publico: false },
  nuclear:        { rot: 'Ogivas detonadas',      cat: 'infamia',   un: 'ogivas',    publico: true },
  invasao_repelida: { rot: 'Invasões repelidas',  cat: 'defesa',    un: 'ataques',   publico: true },
  // ── saúde ──
  cura_invest:    { rot: 'Investido em saúde',    cat: 'cura',      un: 'tri US$',   publico: false },
  cura_final:     { rot: 'Pandemias curadas',     cat: 'cura',      un: 'doenças',   publico: true },
  // ── paz e diplomacia ──
  mediacao:       { rot: 'Rodadas de mediação',   cat: 'paz',       un: 'rodadas',   publico: false },
  paz_final:      { rot: 'Guerras encerradas',    cat: 'paz',       un: 'conflitos', publico: true },
  ajuda:          { rot: 'Ajuda enviada',         cat: 'paz',       un: 'tri US$',   publico: true },
  alianca:        { rot: 'Pactos selados',        cat: 'diplomacia', un: 'pactos',   publico: true },
  sancao_aplicada:{ rot: 'Sanções impostas',      cat: 'diplomacia', un: 'sanções',  publico: false },
  sancao_sofrida: { rot: 'Sanções sofridas',      cat: 'infamia',   un: 'sanções',   publico: false },
  // ── sombra e comércio ──
  espionagem:     { rot: 'Segredos roubados',     cat: 'sombra',    un: 'vazamentos', publico: false },
  armas_vendidas: { rot: 'Armas vendidas',        cat: 'economia',  un: 'tri US$',   publico: false },
  // ── economia (derivado do índice, não registrado à mão) ──
  pib_delta:      { rot: 'Riqueza gerada',        cat: 'economia',  un: '% do PIB',  publico: false },
};

const round2 = (n) => Math.round(n * 100) / 100;

// ── O CALENDÁRIO ──────────────────────────────────────────────────────
// O turno 1 é o primeiro mês do Ano I. Turno 12 FECHA o Ano I; o turno 13 abre o II.
export function anoDoTurno(turno) { return Math.floor((Math.max(1, turno | 0) - 1) / BATIDAS_POR_ANO) + 1; }
export function mesDoAno(turno) { return ((Math.max(1, turno | 0) - 1) % BATIDAS_POR_ANO) + 1; }

// O gatilho do relatório: só é verdade no 12º, 24º, 36º mês. Quem chama a cada
// batida usa ISTO em vez de guardar contador próprio — um contador paralelo
// dessincroniza na hora em que um convidado adota o mês do host (aplicarMundoCompartilhado).
export function fechouAno(turno) { return turno > 0 && turno % BATIDAS_POR_ANO === 0; }

export function rotuloAno(ano) {
  const rom = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return `ANO ${rom[ano] || ano}`;
}

function cofre(estado) {
  if (!estado.feitos || Array.isArray(estado.feitos)) estado.feitos = { registros: [], historico: [] };
  estado.feitos.registros = estado.feitos.registros || [];
  estado.feitos.historico = estado.feitos.historico || [];
  return estado.feitos;
}

// ── REGISTRAR ─────────────────────────────────────────────────────────
// Devolve o feito gravado (ou null se foi recusado/deduplicado) — quem chama usa o
// retorno pra decidir se manda a manchete: feito duplicado não vira notícia duas vezes.
//
// A DEDUPLICAÇÃO É O CORAÇÃO DISTO NO ONLINE. O mesmo fato chega por dois caminhos:
// o meu cliente registra quando eu ataco, e o relay do adversário registra de novo
// quando o `guerra_resultado` volta. Chave = iso+tipo+turno+alvo. Se bater, SOMA o
// valor em vez de criar linha nova quando o tipo é acumulável (dinheiro, baixas), e
// ignora quando é contável (uma anexação é uma anexação).
const ACUMULAVEIS = new Set(['cura_invest', 'armas_vendidas', 'ajuda', 'baixas', 'pib_delta']);

export function registrarFeito(estado, { iso, tipo, valor = 1, alvo = null, turno, detalhe = '' }) {
  if (!estado || !iso || !TIPOS[tipo]) return null;
  const t = Number.isFinite(turno) ? (turno | 0) : (estado.turno | 0) || 1;
  const v = round2(Number(valor) || 0);
  if (!v) return null;                       // feito de valor zero não existe
  const c = cofre(estado);
  const gemeo = c.registros.find((r) => r.iso === iso && r.tipo === tipo && r.turno === t && (r.alvo || null) === (alvo || null));
  if (gemeo) {
    if (!ACUMULAVEIS.has(tipo)) return null; // já contado — o relay só ecoou
    gemeo.valor = round2(gemeo.valor + v);
    return null;                             // e também não repete a manchete
  }
  const feito = { iso, tipo, valor: v, alvo: alvo || null, turno: t, ano: anoDoTurno(t) };
  if (detalhe) feito.detalhe = String(detalhe).slice(0, 140);
  c.registros.push(feito);
  if (c.registros.length > TETO_REGISTROS) c.registros.splice(0, c.registros.length - TETO_REGISTROS);
  return feito;
}

export function feitosDoAno(estado, ano) {
  const alvo = ano != null ? ano : anoDoTurno(estado?.turno || 1);
  return cofre(estado).registros.filter((r) => r.ano === alvo);
}

// ── O PLACAR ──────────────────────────────────────────────────────────
// `isos` é opcional: sem ele, só entram os países que FIZERAM alguma coisa. Passar a
// lista importa no online (quero a linha do jogador humano mesmo que ele tenha
// passado o ano parado — "não fez nada" também é um retrato do ano dele).
//
// `pibDelta` entra por fora porque a variação de PIB não é um evento, é uma foto
// comparada: quem chama tira do índice (statsVivos/_rankSnap) e injeta aqui.
export function placarDoAno(estado, { isos = null, ano = null, pibDelta = null } = {}) {
  const alvo = ano != null ? ano : anoDoTurno(estado?.turno || 1);
  const regs = feitosDoAno(estado, alvo);
  const out = {};
  const garantir = (iso) => {
    if (!out[iso]) out[iso] = { iso, nome: PAISES[iso]?.nome || iso, ano: alvo, total: 0, marcos: [] };
    return out[iso];
  };
  for (const iso of isos || []) garantir(iso);
  for (const r of regs) {
    const p = garantir(r.iso);
    p[r.tipo] = round2((p[r.tipo] || 0) + r.valor);
    p.total += 1;
    // Os MARCOS são os feitos que a tela cita nominalmente ("curou a Febre de Lagos").
    // Só os públicos entram: são os que têm alvo/detalhe e viram frase legível.
    if (TIPOS[r.tipo]?.publico && p.marcos.length < 6) p.marcos.push({ tipo: r.tipo, alvo: r.alvo, detalhe: r.detalhe || '', turno: r.turno });
  }
  for (const [iso, d] of Object.entries(pibDelta || {})) {
    if (Number.isFinite(d)) garantir(iso).pib_delta = round2(d);
  }
  // `ativo` separa quem JOGOU o ano de quem só existiu no mapa. É o que impede o
  // "Ano de Mãos Limpas" (pacifismo) de premiar 150 NPCs que nunca foram simulados.
  for (const p of Object.values(out)) p.ativo = p.total > 0 || Number.isFinite(p.pib_delta);
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// O CATÁLOGO DE TÍTULOS — o coração da coisa
// ═══════════════════════════════════════════════════════════════════════
// Dois modos, e a diferença entre eles é a diferença entre "eu fiz" e "eu venci":
//
//   'faixa' → limiar. TODO país que cruzou a marca recebe. É o reconhecimento do
//             esforço: quem tomou 1 território leva "Dominador de Terras", quem tomou
//             12 leva outra coisa inteiramente. Faixa é o que garante que o relatório
//             do 3º ano de uma partida morna ainda tenha o que mostrar.
//   'coroa' → só o PRIMEIRO. É o pódio, e é escasso de propósito: se todo mundo é
//             pacificador, ninguém é. A coroa exige um `min` também — não quero
//             coroar "o maior vendedor de armas do ano" com 0,2 tri vendidos.
//
// TÍTULOS NEGATIVOS SÃO METADE DA GRAÇA. O dono foi explícito: "ser apontado como o
// carniceiro do ano é tão divertido quanto ser o pacificador". Eles têm `tom: 'mau'`
// e a tela pinta em perigo — e a recompensa deles é NEGATIVA em influência e positiva
// em medo. Ninguém que detona uma ogiva sai do ano mais querido.
//
// A ORDEM DAS FAIXAS É DECRESCENTE em cada eixo: o resolvedor pega a PRIMEIRA que o
// valor alcança. Escrevi assim porque adicionar uma faixa nova no meio é só inserir
// uma linha — o dono vai querer mexer nisto, e mexer tem de ser barato.
const CATALOGO = [
  // ── TERRITÓRIO ──────────────────────────────────────────────────────
  { id: 'terra', campo: 'conquista', modo: 'faixa', cat: 'conquista', ic: 'map', tom: 'bom', faixas: [
    { min: 12, titulo: 'IMPERADOR DE FATO',        sub: 'Doze fronteiras redesenhadas em doze meses. Já não é guerra, é geografia.' },
    { min: 7,  titulo: 'DEVORADOR DE FRONTEIRAS',  sub: 'O mapa do ano passado não serve mais para nada.' },
    { min: 4,  titulo: 'O ROLO COMPRESSOR',        sub: 'Quatro territórios. Ninguém conseguiu segurar a linha.' },
    { min: 2,  titulo: 'REDESENHADOR DE MAPAS',    sub: 'Duas bandeiras vieram abaixo. Os cartógrafos já foram avisados.' },
    { min: 1,  titulo: 'DOMINADOR DE TERRAS',      sub: 'Um território mudou de cor este ano. E foi para a sua.' },
  ] },
  { id: 'anexa', campo: 'anexacao', modo: 'faixa', cat: 'conquista', ic: 'flag', tom: 'mau', faixas: [
    { min: 2, titulo: 'O APAGADOR DE NAÇÕES', sub: 'Duas bandeiras saíram do mapa este ano. Ninguém as viu descer.' },
    { min: 1, titulo: 'COLECIONADOR DE BANDEIRAS', sub: 'Um país inteiro deixou de existir sob a sua assinatura.' },
  ] },
  { id: 'liberta', campo: 'libertacao', modo: 'faixa', cat: 'paz', ic: 'unlock', tom: 'bom', faixas: [
    { min: 2, titulo: 'O DESOCUPANTE',       sub: 'Devolveu o que tomou. Duas vezes. Isso quase nunca acontece.' },
    { min: 1, titulo: 'MÃO QUE SOLTA',       sub: 'Uma nação voltou a se governar porque você abriu os dedos.' },
  ] },
  // ── SAÚDE — o pedido literal do dono ────────────────────────────────
  { id: 'curou', campo: 'cura_final', modo: 'faixa', cat: 'cura', ic: 'heart-pulse', tom: 'bom', faixas: [
    { min: 2, titulo: 'O FIM DAS PRAGAS',    sub: 'Duas doenças foram enterradas com dinheiro seu. O mundo respira.' },
    { min: 1, titulo: 'A CURA TEM SOBRENOME', sub: 'A doença acabou. Os frascos saíram dos seus laboratórios.' },
  ] },
  { id: 'saude', campo: 'cura_invest', modo: 'faixa', cat: 'cura', ic: 'syringe', tom: 'bom', faixas: [
    { min: 6, titulo: 'O BRAÇO QUE VACINOU O MUNDO', sub: 'Gastou uma fortuna em gente que nunca vai saber o seu nome.' },
    { min: 2, titulo: 'MECENAS DOS HOSPITAIS',       sub: 'Enquanto outros compravam tanques, você comprou leitos.' },
    { min: 0.4, titulo: 'FINANCIADOR DA ESPERANÇA',  sub: 'Pôs dinheiro onde a doença estava. Alguém sobreviveu por isso.' },
  ] },
  // ── PAZ ─────────────────────────────────────────────────────────────
  { id: 'encerrou', campo: 'paz_final', modo: 'faixa', cat: 'paz', ic: 'dove', tom: 'bom', faixas: [
    { min: 3, titulo: 'O HOMEM QUE CANSOU AS GUERRAS', sub: 'Três frentes silenciaram. Nenhuma por falta de munição.' },
    { min: 2, titulo: 'CORRETOR DE TRÉGUAS',           sub: 'Duas guerras terminaram numa mesa que você montou.' },
    { min: 1, titulo: 'MÃO ESTENDIDA',                 sub: 'Uma guerra acabou porque alguém insistiu em falar.' },
  ] },
  { id: 'pacific', campo: 'paz_final', modo: 'coroa', cat: 'paz', ic: 'award', tom: 'bom', min: 1,
    titulo: 'O PACIFICADOR DO ANO', sub: 'Nenhum país encerrou mais guerras. Nem tentou.' },
  { id: 'mediador', campo: 'mediacao', modo: 'coroa', cat: 'paz', ic: 'messages-square', tom: 'bom', min: 4,
    titulo: 'O DIPLOMATA INCANSÁVEL', sub: 'Sentou-se à mesa mais vezes que qualquer outro. Nem sempre funcionou.' },
  { id: 'ajuda', campo: 'ajuda', modo: 'faixa', cat: 'paz', ic: 'hand-heart', tom: 'bom', faixas: [
    { min: 3,   titulo: 'A MÃO QUE ALIMENTA', sub: 'Mandou comida, dinheiro e remédio para quem não podia devolver.' },
    { min: 0.5, titulo: 'BOM VIZINHO',        sub: 'Ajudou sem cobrar. Notaram.' },
  ] },
  // ── DEFESA ──────────────────────────────────────────────────────────
  { id: 'muro', campo: 'invasao_repelida', modo: 'faixa', cat: 'defesa', ic: 'shield', tom: 'bom', faixas: [
    { min: 4, titulo: 'O MURO QUE NINGUÉM FUROU', sub: 'Quatro exércitos vieram. Quatro voltaram menores.' },
    { min: 2, titulo: 'BIGORNA',                  sub: 'Bateram duas vezes. Quebraram o martelo nas duas.' },
    { min: 1, titulo: 'DE PÉ',                    sub: 'Invadiram. Você continua aqui.' },
  ] },
  { id: 'teimoso', campo: 'territorio_perdido', modo: 'faixa', cat: 'defesa', ic: 'anvil', tom: 'neutro', faixas: [
    { min: 4, titulo: 'SOBREVIVENTE TEIMOSO', sub: 'Perdeu quatro territórios e não assinou nada. Ainda respira.' },
    { min: 2, titulo: 'SANGRANDO EM PÉ',      sub: 'O mapa encolheu. O governo, não.' },
  ] },
  // ── GUERRA (o lado feio) ────────────────────────────────────────────
  { id: 'carniceiro', campo: 'baixas', modo: 'coroa', cat: 'infamia', ic: 'skull', tom: 'mau', min: 20,
    titulo: 'O CARNICEIRO DO ANO', sub: 'Nenhum governo matou mais gente em doze meses. O número está aí.' },
  { id: 'cao', campo: 'ofensiva', modo: 'faixa', cat: 'guerra', ic: 'swords', tom: 'mau', faixas: [
    { min: 5, titulo: 'O CÃO DE GUERRA',    sub: 'Cinco ofensivas em um ano. A diplomacia desistiu de te ligar.' },
    { min: 3, titulo: 'INCENDIÁRIO SERIAL', sub: 'Onde havia fronteira calma, você levou fogo.' },
    { min: 1, titulo: 'PROVOCADOR',         sub: 'Deu o primeiro tiro. Alguém sempre tem de dar.' },
  ] },
  { id: 'botao', campo: 'nuclear', modo: 'faixa', cat: 'infamia', ic: 'radiation', tom: 'mau', faixas: [
    { min: 2, titulo: 'O FIM DO MUNDO EM PRESTAÇÕES', sub: 'Mais de uma. Deliberadamente. Não há explicação que caiba aqui.' },
    { min: 1, titulo: 'AQUELE QUE APERTOU O BOTÃO',   sub: 'Existe um antes e um depois deste ano. Você desenhou a linha.' },
  ] },
  { id: 'paria', campo: 'sancao_sofrida', modo: 'coroa', cat: 'infamia', ic: 'ban', tom: 'mau', min: 2,
    titulo: 'O PÁRIA DO ANO', sub: 'Ninguém colecionou tantas sanções. O mundo fechou a porta e trancou.' },
  { id: 'xerife', campo: 'sancao_aplicada', modo: 'coroa', cat: 'diplomacia', ic: 'gavel', tom: 'neutro', min: 2,
    titulo: 'O XERIFE', sub: 'Puniu mais que todo mundo. Ninguém pediu, mas ele foi.' },
  // ── COMÉRCIO E SOMBRA ───────────────────────────────────────────────
  { id: 'balcao', campo: 'armas_vendidas', modo: 'coroa', cat: 'economia', ic: 'package', tom: 'neutro', min: 1,
    titulo: 'O BALCÃO DO MUNDO', sub: 'Vendeu para todos os lados e não perguntou o endereço de entrega.' },
  { id: 'ouvido', campo: 'espionagem', modo: 'coroa', cat: 'sombra', ic: 'ear', tom: 'neutro', min: 2,
    titulo: 'OUVIDO EM TODA PAREDE', sub: 'Sabe o que os outros ainda não decidiram contar.' },
  // ── ECONOMIA ────────────────────────────────────────────────────────
  { id: 'milagre', campo: 'pib_delta', modo: 'coroa', cat: 'economia', ic: 'trending-up', tom: 'bom', min: 4,
    titulo: 'O MILAGRE DO ANO', sub: 'Cresceu mais que qualquer nação do planeta. Sem tomar um metro de terra.' },
  { id: 'naufragio', campo: 'pib_delta', modo: 'coroa', cat: 'infamia', ic: 'trending-down', tom: 'mau', min: 4, inverso: true,
    titulo: 'O NAUFRÁGIO', sub: 'Nenhuma economia encolheu tanto. E não foi bombardeada.' },
  // ── DIPLOMACIA ──────────────────────────────────────────────────────
  { id: 'tecelao', campo: 'alianca', modo: 'faixa', cat: 'diplomacia', ic: 'handshake', tom: 'bom', faixas: [
    { min: 2, titulo: 'O CENTRO DE GRAVIDADE', sub: 'Dois pactos em um ano. O mapa agora se organiza em volta de você.' },
    { min: 1, titulo: 'TECELÃO DE PACTOS',     sub: 'Selou uma aliança. Alguém confiou o suficiente para assinar.' },
  ] },
];

// TÍTULOS DE CONDIÇÃO — os que não saem de um número só. Ficam separados porque a
// regra deles é uma FUNÇÃO, e enfiar função no catálogo declarativo acima só ia
// tornar o catálogo mais difícil de editar pra quem só quer trocar uma frase.
const CONDICIONAIS = [
  {
    id: 'limpo', cat: 'paz', ic: 'feather', tom: 'bom',
    titulo: 'ANO DE MÃOS LIMPAS', sub: 'Doze meses no poder e nenhum tiro dado. Sabe quantos conseguem isso?',
    // Exige país ATIVO: sem isso, todo NPC que o motor nunca simulou ganharia o
    // prêmio de pacifismo e o troféu viraria piada.
    quando: (p) => p.ativo && !p.ofensiva && !p.nuclear && !p.baixas && !p.conquista && (p.total >= 3),
    valor: () => 12,
  },
  {
    id: 'espada_arado', cat: 'cura', ic: 'sprout', tom: 'bom',
    titulo: 'TROCOU A ESPADA PELO ARADO', sub: 'Gastou mais em curar do que em conquistar. Uma escolha rara.',
    quando: (p) => p.ativo && (p.cura_invest || 0) >= 1 && (p.cura_invest || 0) > (p.armas_vendidas || 0) && !p.conquista,
    valor: (p) => p.cura_invest,
  },
  {
    id: 'duas_caras', cat: 'infamia', ic: 'venetian-mask', tom: 'mau',
    titulo: 'AS DUAS CARAS', sub: 'Mediou a paz numa guerra e lançou a sua na outra. Ninguém percebeu? Percebeu.',
    quando: (p) => (p.mediacao || 0) >= 1 && (p.ofensiva || 0) >= 1,
    valor: (p) => (p.mediacao || 0) + (p.ofensiva || 0),
  },
  {
    id: 'sozinho', cat: 'infamia', ic: 'user-x', tom: 'mau',
    titulo: 'SOZINHO CONTRA O MUNDO', sub: 'Atacou, foi sancionado e não fez um único aliado. Corajoso. Ou outra coisa.',
    quando: (p) => (p.ofensiva || 0) >= 1 && (p.sancao_sofrida || 0) >= 1 && !p.alianca,
    valor: (p) => (p.ofensiva || 0) + (p.sancao_sofrida || 0),
  },
];

// ── RESOLVER OS TÍTULOS DO ANO ────────────────────────────────────────
// Devolve a lista ORDENADA pra tela: coroas primeiro (é o pódio), depois faixas por
// intensidade. `limitePorPais` existe porque um jogador que faz tudo levaria 9
// títulos e transformaria a tela num extrato bancário — 4 é o teto que mantém cada
// título significando alguma coisa.
export function titulosDoAno(placar, { ano = null, limitePorPais = 4 } = {}) {
  const paises = Object.values(placar || {});
  const saida = [];

  for (const def of CATALOGO) {
    if (def.modo === 'coroa') {
      // O sinal do `inverso` é o que faz "O Naufrágio" existir sem um segundo catálogo:
      // é a mesma coroa de PIB lida de trás pra frente.
      const cands = paises
        .map((p) => ({ p, v: def.inverso ? -(p[def.campo] || 0) : (p[def.campo] || 0) }))
        .filter((x) => x.v >= (def.min ?? 1))
        .sort((a, b) => b.v - a.v);
      if (!cands.length) continue;
      // EMPATE NÃO COROA NINGUÉM DUAS VEZES, mas também não escolhe no dado: se dois
      // países empatam no topo, ambos levam. Melhor duas coroas do que uma coroa que
      // o jogador vai jurar que foi roubada.
      const topo = cands[0].v;
      for (const c of cands.filter((x) => x.v === topo)) {
        saida.push(montar(def, c.p, def.inverso ? -c.v : c.v, def.titulo, def.sub, true));
      }
      continue;
    }
    for (const p of paises) {
      const v = p[def.campo] || 0;
      const fx = def.faixas.find((f) => v >= f.min);
      if (!fx) continue;
      saida.push(montar(def, p, v, fx.titulo, fx.sub, false));
    }
  }

  for (const def of CONDICIONAIS) {
    for (const p of paises) {
      let ok = false;
      try { ok = !!def.quando(p); } catch { ok = false; }
      if (ok) saida.push(montar(def, p, def.valor(p) || 1, def.titulo, def.sub, false));
    }
  }

  // Poda por país. A ordem da poda é a mesma da tela: coroa vale mais que faixa, e
  // entre faixas o que tem mais "peso relativo" (valor sobre o mínimo da faixa) fica.
  const porPais = {};
  for (const t of saida) (porPais[t.iso] = porPais[t.iso] || []).push(t);
  const podado = [];
  for (const lista of Object.values(porPais)) {
    lista.sort((a, b) => (b.coroa - a.coroa) || (b.peso - a.peso));
    podado.push(...lista.slice(0, limitePorPais));
  }

  podado.sort((a, b) => (b.coroa - a.coroa) || (b.peso - a.peso) || a.titulo.localeCompare(b.titulo));
  if (ano != null) for (const t of podado) t.ano = ano;
  return podado;
}

function montar(def, p, valor, titulo, subtitulo, coroa) {
  const cat = CATEGORIAS[def.cat] || CATEGORIAS.diplomacia;
  const un = TIPOS[def.campo]?.un || '';
  return {
    iso: p.iso, pais: p.nome, id: def.id, titulo, subtitulo,
    categoria: def.cat, catRot: cat.rot, cor: cat.cor, ic: def.ic || cat.ic,
    tom: def.tom || 'neutro', coroa: coroa ? 1 : 0,
    valor: round2(valor), unidade: un, campo: def.campo,
    // `peso` é só ordenação: normaliza "3 territórios" e "6 tri em saúde" na mesma régua.
    peso: coroa ? 1000 + Math.abs(valor) : Math.abs(valor),
    numero: un ? `${round2(valor)} ${un}` : String(round2(valor)),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// RECOMPENSA — o feito tem de VALER alguma coisa, ou é só texto bonito
// ═══════════════════════════════════════════════════════════════════════
// CALIBRAGEM (o porquê dos números): as variáveis de medidor vão de 0 a 100 e uma
// ação forte do catálogo mexe ~5 pontos. Um ANO tem 12 batidas e dezenas de ações.
// Se o relatório desse +20 de influência, ele viraria a estratégia dominante: o
// caminho ótimo seria farmar título em vez de jogar.
//
// Então: nenhum título passa de +6 num medidor, e o teto de 4 títulos por país
// fecha o ano em ~+15 no melhor caso absurdo — sensível (dá pra virar uma votação
// da ONU) e longe de quebrar. O PIB nunca é recompensa direta: dar PIB por título
// realimentaria a coroa "Milagre do Ano" e faria o líder se coroar sozinho todo ano.
// O que os títulos dão é REPUTAÇÃO (soft_power) e POLÍTICA INTERNA (aprovação,
// estabilidade) — as duas coisas que o jogador não compra com dinheiro.
//
// Títulos maus são LÍQUIDOS NEGATIVOS: a aprovação em casa até sobe (o público
// nacionalista gosta de vitória), mas a influência despenca. É exatamente o trade
// que o jogo já cobra em toda ação militar — o relatório só torna público.
const RECOMPENSA_TITULO = {
  terra:      { soft_power: 1,  aprovacao: 4,  estabilidade: 1 },
  anexa:      { soft_power: -5, aprovacao: 5 },
  liberta:    { soft_power: 6,  aprovacao: -1 },
  curou:      { soft_power: 6,  aprovacao: 3 },
  saude:      { soft_power: 4,  aprovacao: 3 },
  encerrou:   { soft_power: 5,  aprovacao: 2, estabilidade: 1 },
  pacific:    { soft_power: 6,  aprovacao: 3, estabilidade: 1 },
  mediador:   { soft_power: 3 },
  ajuda:      { soft_power: 4,  aprovacao: 1 },
  muro:       { soft_power: 2,  aprovacao: 5, estabilidade: 3 },
  teimoso:    { aprovacao: 2,   estabilidade: 2 },
  carniceiro: { soft_power: -6, aprovacao: 2, estabilidade: -2 },
  cao:        { soft_power: -4, aprovacao: 2 },
  botao:      { soft_power: -6, aprovacao: -2, estabilidade: -3 },
  paria:      { soft_power: -5, estabilidade: -2 },
  xerife:     { soft_power: 2,  aprovacao: 1 },
  balcao:     { soft_power: -2, aprovacao: 2 },
  ouvido:     { inteligencia: 4, soft_power: -1 },
  milagre:    { aprovacao: 5,  estabilidade: 3, soft_power: 2 },
  naufragio:  { aprovacao: -4, estabilidade: -3 },
  tecelao:    { soft_power: 4,  estabilidade: 1 },
  limpo:      { soft_power: 5,  estabilidade: 3 },
  espada_arado: { soft_power: 5, aprovacao: 2 },
  duas_caras: { soft_power: -4 },
  sozinho:    { soft_power: -3, estabilidade: -2 },
};

export function recompensaDoTitulo(t) {
  const base = RECOMPENSA_TITULO[t?.id];
  if (!base) return {};
  // Coroa vale 1,5× — ser o MAIOR do ano tem de pesar mais do que ter cruzado a marca.
  const m = t.coroa ? 1.5 : 1;
  const out = {};
  for (const [k, v] of Object.entries(base)) out[k] = Math.round(v * m);
  return out;
}

// ── RECONHECIMENTO IMEDIATO ───────────────────────────────────────────
// Não é o mesmo que o título: isto é o "o mundo VIU você fazer isso", na hora, junto
// com a manchete. É pequeno de propósito (1 a 3 pontos) — o prêmio grande fica pro
// fim do ano, senão o relatório de dezembro seria a segunda vez que o jogador é pago
// pela mesma coisa e ele sentiria o troco.
const RECOMPENSA_FEITO = {
  cura_final:       { soft_power: 3, aprovacao: 2 },
  paz_final:        { soft_power: 3, aprovacao: 1 },
  libertacao:       { soft_power: 3 },
  invasao_repelida: { aprovacao: 2, estabilidade: 1 },
  ajuda:            { soft_power: 1 },
  alianca:          { soft_power: 1, estabilidade: 1 },
  anexacao:         { soft_power: -3, aprovacao: 2 },
  nuclear:          { soft_power: -4, estabilidade: -1 },
};

// `valor` entra na assinatura porque alguns feitos escalam (ajuda de 5 tri não vale
// o mesmo que 0,5). O escalonamento é raiz quadrada e vai só até 3× — linear faria
// um único cheque gigante comprar reputação, que é exatamente o que o jogo não quer.
export function recompensaDoFeito(tipo, valor = 1) {
  const base = RECOMPENSA_FEITO[tipo];
  if (!base) return {};
  const m = Math.min(3, Math.max(1, Math.sqrt(Math.max(1, Number(valor) || 1))));
  const out = {};
  for (const [k, v] of Object.entries(base)) out[k] = Math.round(v * m) || (v > 0 ? 1 : -1);
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// AS MANCHETES — "faça a divulgação para todos" (palavras do dono)
// ═══════════════════════════════════════════════════════════════════════
// Texto pronto, sem IA. Isto roda no instante do fato, no online, potencialmente em
// 8 clientes ao mesmo tempo — chamar o gerador aqui seria pagar 8 vezes por uma
// frase que já sabemos escrever, e ainda arriscar 8 versões diferentes do MESMO
// fato na sala (o que estraga a ilusão de mundo único mais do que qualquer coisa).
const MANCHETES = {
  cura_final:  (n, a) => `🧬 A CURA EXISTE: ${n} anuncia o fim de ${a || 'a epidemia'}. Os frascos saíram dos laboratórios financiados por eles — e serão distribuídos ao mundo inteiro.`,
  paz_final:   (n, a) => `🕊 CESSAR-FOGO: a guerra ${a ? `em ${a}` : 'no continente'} acabou. Foi ${n} quem sentou os dois lados na mesa e não deixou ninguém levantar.`,
  libertacao:  (n, a) => `🏳 SOBERANIA DEVOLVIDA: ${n} retirou-se de ${a || 'território ocupado'} e devolveu o governo. Isso praticamente não acontece.`,
  invasao_repelida: (n, a) => `🛡 REPELIDO: ${n} segurou a ofensiva${a ? ` de ${a}` : ''}. A fronteira continua onde estava.`,
  ajuda:       (n, a) => `🤝 SOCORRO: ${n} enviou ajuda a ${a || 'quem precisava'}. Sem contrapartida anunciada — e o mundo está reparando.`,
  alianca:     (n, a) => `📜 PACTO SELADO: ${n} assinou aliança${a ? ` com ${a}` : ''}. O tabuleiro tem um bloco a mais.`,
  conquista:   (n, a) => `⚔ FRONTEIRA MOVIDA: ${n} tomou ${a || 'território'}. O mapa desta manhã não é o de ontem.`,
  anexacao:    (n, a) => `☠ NAÇÃO APAGADA: ${n} anexou ${a || 'um país inteiro'}. Uma bandeira desceu hoje e não volta a subir.`,
  nuclear:     (n, a) => `☢ O IMPENSÁVEL: ${n} detonou um artefato nuclear${a ? ` sobre ${a}` : ''}. Não há comunicado que explique isto.`,
};

// Devolve `{ texto, cor, handle }` pronto pro `_empilharFeed`, ou null se o tipo não
// merece jornal. Quem chama não precisa saber quais tipos são públicos.
export function mancheteDoFeito(feito, { nomePais = null, nomeAlvo = null } = {}) {
  if (!feito || !TIPOS[feito.tipo]?.publico) return null;
  const fn = MANCHETES[feito.tipo];
  if (!fn) return null;
  const nome = nomePais || PAISES[feito.iso]?.nome || feito.iso;
  const alvo = nomeAlvo || feito.detalhe || (feito.alvo ? (PAISES[feito.alvo]?.nome || feito.alvo) : null);
  const cat = CATEGORIAS[TIPOS[feito.tipo].cat];
  return {
    tipo: 'sistema',
    handle: cat.rot === 'INFÂMIA' || cat.rot === 'GUERRA' ? '⚙ Estado-Maior' : '🌍 Mundo',
    texto: fn(nome, alvo),
    cor: cat.cor === 'var(--verde)' ? '#22e0a0' : cat.cor === 'var(--perigo)' ? '#ff3b5c'
      : cat.cor === 'var(--ambar)' ? '#ffb020' : cat.cor === 'var(--roxo)' ? '#b98cff' : '#35e0ff',
  };
}

// A manchete do TÍTULO (vai ao feed quando o ano fecha — é o "prêmio" virando notícia).
export function mancheteDoTitulo(t) {
  if (!t) return null;
  const marca = t.coroa ? 'PRÊMIO DO ANO' : 'MENÇÃO DO ANO';
  return {
    tipo: 'sistema', handle: '🏅 Retrospectiva',
    texto: `${marca} · ${t.pais} — "${t.titulo}". ${t.subtitulo}`,
    cor: t.tom === 'mau' ? '#ff3b5c' : t.tom === 'bom' ? '#22e0a0' : '#7488ad',
  };
}

// ── FECHAR O CICLO ────────────────────────────────────────────────────
// Arquiva o ano no histórico (leve — só o que a tela de fim de partida vai querer
// reler) e DESCARTA os registros crus daquele ano. É a única coisa que impede o save
// de crescer para sempre numa partida de 10 anos.
export function limparAno(estado, { ano = null, placar = null, titulos = null } = {}) {
  const c = cofre(estado);
  const alvo = ano != null ? ano : anoDoTurno(estado?.turno || 1);
  if (placar || titulos) {
    c.historico.push({
      ano: alvo,
      // Só os títulos entram no histórico. O placar cru é grande e ninguém relê
      // "quantos tri o Chade gastou em saúde no Ano II" — o título é o que sobra na memória.
      titulos: (titulos || []).map((t) => ({ iso: t.iso, pais: t.pais, titulo: t.titulo, tom: t.tom, coroa: t.coroa, numero: t.numero })),
      campeao: (titulos || []).find((t) => t.coroa)?.pais || null,
    });
    if (c.historico.length > 12) c.historico.splice(0, c.historico.length - 12);
  }
  c.registros = c.registros.filter((r) => r.ano > alvo);
  c.ultimoAnoFechado = alvo;
  return c.historico[c.historico.length - 1] || null;
}

// Guarda que impede o relatório de abrir duas vezes no mesmo ano — no online, a
// batida do host e a batida local do convidado podem cair no mesmo mês.
export function jaFechou(estado, ano) { return (cofre(estado).ultimoAnoFechado || 0) >= ano; }
