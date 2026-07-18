// ═══════════════════════════════════════════════════════════════════════
// SAIR DA GUERRA / PAZ — recuar com peso
// ═══════════════════════════════════════════════════════════════════════
// guerra.js começa e conduz o conflito; aqui ele TERMINA. Três saídas: tentar selar a
// paz, devolver território (oferta), ou sair unilateralmente. A aceitação do inimigo NÃO
// é garantida — depende do PODER RELATIVO e do CONTEXTO dele (está perdendo? capital
// tomada? em outra guerra? sem apoio?). País mais forte que você não engole desculpa —
// exceto se estiver num cenário ruim. Fórmulas puras (mesma no preview e no dado).
import { PAISES, oPais, dePais } from '../dados/paises.js';
import { forcaCombate } from '../dados/forcas.js';
import { forcaDe, fichaForca } from './forcasMundo.js';
import { coalizaoDefensiva } from './coalizao.js';
import { estadosCarregados, estadosDe, donoDe } from './territorio.js';
import { ordemDeQueda } from './campanha.js';
import { aplicarEfeitos } from './efeitos.js';
import { resolverAgressao } from './agressao.js';
import { rand } from './rng.js';

const BONUS_OGIVA = 3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (n) => Math.round(n * 100) / 100;

// PODER RELATIVO nesta guerra (R = minha força / a dele + coalizão dele).
export function poderRelativo(estado, iso) {
  const meu = forcaCombate(estado.forcas) + (estado.ogivas || 0) * BONUS_OGIVA;
  const coalizao = coalizaoDefensiva(estado, iso, null);
  const inimigo = forcaDe(estado, iso) + coalizao.poderExtra;
  return { R: round2(meu / Math.max(1, inimigo)), meu, inimigo, coalizao };
}

// CONTEXTO do rival: está numa fase ruim? (perdendo território, desgastado, em outra
// guerra, sem apoio, capital tomada). score 0..1 — quanto maior, mais ele topa a paz.
export function contextoDoRival(estado, iso) {
  const eu = estado.iso || 'USA';
  const doPais = estadosCarregados() ? estadosDe(iso) : [];
  const meus = doPais.filter((s) => donoDe(estado, s.id) === eu).length;
  const fracaoPerdida = doPais.length ? meus / doPais.length : 0;

  const ordem = doPais.length ? ordemDeQueda(estado, iso, null, null) : [];
  const capEstado = ordem.find((e) => e.ehCapital);
  const capitalTomada = capEstado ? donoDe(estado, capEstado.id) === eu : false;

  const ficha = fichaForca(estado, iso);
  const baseOriginal = PAISES[iso]?.forca || ficha.base;
  const desgaste = clamp(1 - ficha.base / Math.max(1, baseOriginal), 0, 1);

  const emOutraGuerra = (estado.conflitosNPC || []).some((c) => c.a === iso || c.b === iso);
  const semApoio = !(ficha.apoios || []).length;

  const score = clamp(
    fracaoPerdida * 0.45 + desgaste * 0.25 + (emOutraGuerra ? 0.20 : 0)
    + (semApoio ? 0.10 : 0) + (capitalTomada ? 0.15 : 0), 0, 1,
  );
  return { fracaoPerdida, capitalTomada, desgaste, emOutraGuerra, semApoio, score };
}

export const TERMOS_PAZ = {
  cessar_fogo: { nome: 'Tentar Selar a Paz', tempo: 18, custoBase: 0.15, tetoRelacao: -45 },
  devolver_area: { nome: 'Devolver Território', tempo: 26, custoBase: 0.10, tetoRelacaoParcial: -30, tetoRelacaoTotal: -20 },
};

// CHANCE DE ACEITAÇÃO — a fórmula, usada no preview E no roll.
export function chanceAceitarPaz(estado, iso, termos) {
  const { R } = poderRelativo(estado, iso);
  const ctx = contextoDoRival(estado, iso);
  const rel = Number(estado[PAISES[iso]?.rel] ?? 0);
  const poderTermo = clamp((R - 1) * 0.32, -0.32, 0.32);
  const odioExtra = rel <= -70 ? clamp((-rel - 70) / 150, 0, 0.12) : 0;

  let chance;
  if (termos.tipo === 'devolver_area') {
    const fracaoDevolvida = termos.fracaoDevolvida || 0;
    const bonusDevolucao = fracaoDevolvida * 0.20;
    const custoRef = Math.max(0.5, (PAISES[iso]?.forca || 60) / 60);
    const bonusReparacoes = clamp((termos.reparacoes || 0) / (custoRef * 2), 0, 0.15);
    chance = 0.30 + poderTermo + ctx.score * 0.55 - odioExtra + bonusDevolucao + bonusReparacoes;
  } else {
    chance = 0.16 + poderTermo + ctx.score * 0.55 - odioExtra;
  }
  return { chance: clamp(chance, 0.03, 0.95), R, ctx, poderTermo, odioExtra };
}

// Risco de ele PRESSIONAR a vantagem (recusa negociada, ou saída unilateral).
export function chanceContraAtaque(estado, iso, { negociado = true } = {}) {
  const { R } = poderRelativo(estado, iso);
  const ctx = contextoDoRival(estado, iso);
  const base = negociado ? 0.34 : 0.5;
  return clamp(base - Math.min(0.3, Math.max(0, R - 1) * 0.25) - ctx.score * 0.3, 0.04, 0.6);
}

// Previsão de aprovação ao SAIR da guerra (o contexto decide se é alívio ou covardia).
export function previsaoSaidaGuerra(estado, iso) {
  const { R } = poderRelativo(estado, iso);
  const ctx = contextoDoRival(estado, iso);
  const impopular = (estado.temp_guerra || 30) >= 55;
  const vencendo = R >= 1.25 && ctx.fracaoPerdida >= 0.15;
  const aprovacao = vencendo ? -14 : (impopular && !vencendo ? 6 : -5);
  return { aprovacao, vencendo, impopular, R, ctx };
}

// RESOLVE um pedido de paz (cessar_fogo ou devolver_area) — chamado quando a ordem
// enfileirada amadurece no tempo real.
export function resolverPedidoDePaz(estado, iso, termos) {
  const relKey = PAISES[iso]?.rel;
  const nome = PAISES[iso]?.nome || iso;
  const { chance } = chanceAceitarPaz(estado, iso, termos);
  const aceito = rand() < chance;

  if (aceito) {
    if (termos.tipo === 'devolver_area') aplicarDevolucaoTerritorio(estado, iso, termos.estados || []);
    estado.emGuerra = (estado.emGuerra || []).filter((i) => i !== iso);
    const delta = termos.tipo === 'devolver_area'
      ? 14 + Math.round((termos.fracaoDevolvida || 0) * 14) + Math.round((termos.reparacoes || 0) * 10)
      : 8;
    const mudancas = aplicarEfeitos(estado, {
      ...(relKey ? { [relKey]: delta } : {}), temp_guerra: -12, aprovacao: 3, soft_power: termos.tipo === 'devolver_area' ? 4 : 2,
    });
    // AINDA HOSTIL — teto duro pós-clamp, não vira aliado de graça.
    const teto = termos.tipo === 'devolver_area'
      ? ((termos.fracaoDevolvida || 0) >= 0.95 && (termos.reparacoes || 0) > 0
        ? TERMOS_PAZ.devolver_area.tetoRelacaoTotal : TERMOS_PAZ.devolver_area.tetoRelacaoParcial)
      : TERMOS_PAZ.cessar_fogo.tetoRelacao;
    if (relKey && estado[relKey] > teto) estado[relKey] = teto;
    return { aceito: true, iso, nome, mudancas,
      manchete: `CESSAR-FOGO: ${oPais(nome)} aceita encerrar a guerra${termos.tipo === 'devolver_area' ? ', em troca do território devolvido' : ''}. A hostilidade recua — a confiança, não.` };
  }

  // RECUSADO — a guerra continua, a relação piora, e ele pode pressionar agora.
  const mudancas = aplicarEfeitos(estado, { ...(relKey ? { [relKey]: -10 } : {}), temp_guerra: 10, aprovacao: -4 });
  const risco = chanceContraAtaque(estado, iso, { negociado: true });
  let contraAtaque = null;
  if (rand() < risco) {
    contraAtaque = resolverAgressao(estado, { iso, nome, forca: forcaDe(estado, iso), rel: Number(estado[relKey] ?? 0), motivo: 'recusou seu pedido de paz e pressiona a vantagem' });
  }
  return { aceito: false, iso, nome, mudancas, contraAtaque,
    manchete: `${oPais(nome)} REJEITA sua proposta de paz${contraAtaque ? ' — e revida na hora' : '. A guerra continua.'}` };
}

// DEVOLVER ÁREA: aplica no mapa/inventário (tropa da guarnição volta pro quartel).
function aplicarDevolucaoTerritorio(estado, iso, idsEstados) {
  const eu = estado.iso || 'USA';
  let devolvidos = 0;
  for (const id of idsEstados) {
    if (donoDe(estado, id) !== eu) continue;
    const g = estado.guarnicoes?.[id];
    if (g) { for (const [u, q] of Object.entries(g)) estado.forcas[u] = (estado.forcas[u] || 0) + (q || 0); delete estado.guarnicoes[id]; }
    delete estado.donoEstado[id];
    devolvidos += 1;
  }
  const doPais = estadosCarregados() ? estadosDe(iso) : [];
  if (devolvidos && doPais.length) {
    estado.territorio = Math.max(0, estado.territorio - Math.max(1, Math.round((devolvidos / doPais.length) * 2)));
  }
  estado.conquistados = (estado.conquistados || []).filter((c) => c.iso !== iso);
  return devolvidos;
}

// SAIR DA GUERRA (unilateral — não pede aceitação; você só recua, com o peso disso).
export function sairDaGuerra(estado, iso) {
  const relKey = PAISES[iso]?.rel;
  const nome = PAISES[iso]?.nome || iso;
  const prev = previsaoSaidaGuerra(estado, iso);

  estado.emGuerra = (estado.emGuerra || []).filter((i) => i !== iso);
  // cancela ofensivas minhas em preparo contra este alvo (devolve tropa/caixa)
  for (const op of [...(estado.operacoes || [])].filter((o) => o.alvoIso === iso)) {
    for (const [id, q] of Object.entries(op.deploy || {})) if (q) estado.forcas[id] = (estado.forcas[id] || 0) + q;
    estado.operacoes = estado.operacoes.filter((o) => o !== op);
  }

  const mudancas = aplicarEfeitos(estado, {
    ...(relKey ? { [relKey]: -6 } : {}), temp_guerra: -6, aprovacao: prev.aprovacao,
    ...(prev.vencendo ? { poder_militar: -6 } : {}),
    ...(prev.impopular && !prev.vencendo ? { estabilidade: 3 } : {}),
  });

  const risco = chanceContraAtaque(estado, iso, { negociado: false });
  let contraAtaque = null;
  if (rand() < risco) {
    contraAtaque = resolverAgressao(estado, { iso, nome, forca: forcaDe(estado, iso), rel: Number(estado[relKey] ?? 0), motivo: 'sentiu a retirada como fraqueza e atacou' });
  }
  return { iso, nome, mudancas, prev, contraAtaque,
    manchete: prev.vencendo
      ? `RECUO: retiramos as tropas ${dePais(nome)} mesmo vencendo. A oposição chama de covardia.`
      : `SAÍMOS DA GUERRA ${dePais(nome)}. ${prev.impopular ? 'O país respira — essa guerra já custava caro demais.' : 'Nem vitória, nem paz — só o fim do desgaste.'}${contraAtaque ? ' Só que ele não parou.' : ''}` };
}
