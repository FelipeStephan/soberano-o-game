// ═══════════════════════════════════════════════════════════════════════
// A FORÇA DOS OUTROS — agora um ESTADO, não um número recalculado
// ═══════════════════════════════════════════════════════════════════════
// O QUE ISTO CONSERTA: até aqui, a força de qualquer país que não fosse o jogador
// vinha de `estimaForca(feature)` — uma tabela FIXA em paises.js, lida do zero a cada
// chamada. O único modificador era `estado.crescimentoRival`, um escalar GLOBAL que
// rearmava todo mundo igual, ao mesmo tempo.
//
// A consequência: nada que acontecesse a um país podia MARCAR esse país. O BRICS podia
// "condenar" um ataque ao Brasil, mas não tinha onde escrever que o Brasil ficou mais
// forte. Não era falta de regra — era falta de LUGAR. Sem estado persistente, toda ajuda
// é narração.
//
// Aqui nasce esse lugar: `estado.forcasMundo[iso]`. É JSON puro, como todo o resto do
// estado — então entra no save, e no dia do multiplayer sincroniza pela rede sem
// tratamento especial (a decisão da 24ª leva pagando dividendo).
//
//   estado.forcasMundo = {
//     BRA: { base: 48, boost: 12, apoios: [ { de:'CHN', poder:8, motivo:'BRICS', restam:3 } ] }
//   }
//
// `base` = o que o país tem de si. `boost` = o que ganhou por decisão de alguém.
// `apoios` = de ONDE veio cada pedaço do boost — porque o jogador precisa poder ler
// "a China mandou 8" e não só ver um número maior sem explicação.
import { PAISES, estimaForca, jogadorIso } from '../dados/paises.js';

// ── Semeadura preguiçosa ──────────────────────────────────────────────
// Não pré-populamos os ~180 países do GeoJSON: só ganha registro quem entrou na
// história. Um país que ninguém tocou não precisa ocupar espaço no save.
export function fichaForca(estado, iso, feature = null) {
  estado.forcasMundo = estado.forcasMundo || {};
  if (!estado.forcasMundo[iso]) {
    const base = PAISES[iso]?.forca || (feature ? estimaForca(feature) : 20);
    estado.forcasMundo[iso] = { base, boost: 0, apoios: [] };
  }
  return estado.forcasMundo[iso];
}

// A força REAL de um país agora: base (rearmada pelo tempo) + o que aliados emprestaram.
export function forcaDe(estado, iso, feature = null) {
  const f = fichaForca(estado, iso, feature);
  const cresc = estado.crescimentoRival || 1;
  return Math.max(1, Math.round(f.base * cresc + f.boost));
}

// Detalhamento pra UI: o jogador tem de VER de onde veio a força que o surpreendeu.
// "Inimigo: 48" não ensina nada. "48 dele + 22 que o BRICS mandou" ensina a jogar.
export function detalheForca(estado, iso, feature = null) {
  const f = fichaForca(estado, iso, feature);
  const cresc = estado.crescimentoRival || 1;
  const base = Math.round(f.base * cresc);
  return {
    base,
    boost: Math.round(f.boost),
    total: Math.max(1, base + Math.round(f.boost)),
    apoios: (f.apoios || []).map((a) => ({ ...a, nome: PAISES[a.de]?.nome || a.de })),
  };
}

// ── Empréstimo de tropas ──────────────────────────────────────────────
// O ato material que faltava. Quem empresta PERDE força (não é de graça — um país que
// manda 8 de poder pro vizinho fica com 8 a menos pra si), e quem recebe ganha um apoio
// com prazo. Sem esse débito dos dois lados, ajudar seria almoço grátis e todo mundo
// ajudaria todo mundo sempre.
export function emprestarTropas(estado, { de, para, poder, motivo, turnos = 4, featureDe = null, featurePara = null }) {
  if (!poder || poder <= 0 || de === para) return null;
  const doador = fichaForca(estado, de, featureDe);
  const alvo = fichaForca(estado, para, featurePara);

  // Ninguém esvazia a própria casa: no máximo 35% da base sai por vez.
  const teto = Math.round(doador.base * 0.35);
  const enviado = Math.max(1, Math.min(Math.round(poder), teto));

  doador.base = Math.max(1, doador.base - enviado);
  alvo.boost += enviado;
  alvo.apoios.push({ de, poder: enviado, motivo: motivo || 'aliança', restam: turnos });

  return { de, para, poder: enviado, motivo, nomeDe: PAISES[de]?.nome || de, nomePara: PAISES[para]?.nome || para };
}

// ── O tique ───────────────────────────────────────────────────────────
// Apoio é temporário: tropa emprestada volta pra casa. Se o boost fosse eterno, duas
// guerras bastariam pra deixar o mapa inteiro inflado e o jogo perderia a escala.
export function tickForcasMundo(estado) {
  const eventos = [];
  const mundo = estado.forcasMundo || {};
  for (const [iso, f] of Object.entries(mundo)) {
    if (!f.apoios?.length) continue;
    const restantes = [];
    for (const a of f.apoios) {
      a.restam -= 1;
      if (a.restam > 0) { restantes.push(a); continue; }
      // Expirou: a tropa volta pro dono. O boost cai e a base do doador se recompõe.
      f.boost = Math.max(0, f.boost - a.poder);
      const doador = mundo[a.de];
      if (doador) doador.base += a.poder;
      eventos.push(`${PAISES[a.de]?.nome || a.de} retirou o apoio militar ${PAISES[iso]?.nome ? `a ${PAISES[iso].nome}` : ''}: as tropas voltaram pra casa.`);
    }
    f.apoios = restantes;
  }
  return eventos;
}

// Registra dano/ganho estrutural na base de um país (guerra perdida, rearmamento).
// É o que faz uma derrota MARCAR o mapa em vez de sumir no fim da animação.
export function ajustarBase(estado, iso, delta, feature = null) {
  const f = fichaForca(estado, iso, feature);
  f.base = Math.max(1, Math.round(f.base + delta));
  return f.base;
}

// A minha própria força total, na mesma unidade dos outros — pra comparar maçã com maçã
// quando ALGUÉM me ataca. O jogador tem inventário real (estado.forcas); os NPCs têm
// escalar. Esta é a ponte.
export function meuBoost(estado) {
  const f = estado.forcasMundo?.[jogadorIso()];
  return f ? Math.round(f.boost) : 0;
}
