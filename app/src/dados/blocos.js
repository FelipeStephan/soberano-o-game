// ═══════════════════════════════════════════════════════════════════════
// BLOCOS GEOPOLÍTICOS — agora relativos ao JOGADOR, e com dentes
// ═══════════════════════════════════════════════════════════════════════
// DOIS BUGS ESTRUTURAIS QUE ESTE ARQUIVO CARREGAVA:
//
// 1. O MUNDO ERA VISTO DE WASHINGTON. `OTAN: ['DEU','FRA','GBR','CAN']` — sem os EUA.
//    O "jogador padrão" tinha sido subtraído do próprio bloco, porque na época o jogador
//    era sempre americano e a lista servia só pra responder "quem se irrita quando EU
//    ataco?". Quando 20 nações viraram jogáveis, isso quebrou calado: atacar os EUA não
//    gerava reação de ninguém — o país mais aliado do mapa ficou órfão. E `reacaoDeBloco`
//    excluía o ALVO mas nunca o JOGADOR: o Brasil atacando o Irã penalizava `rel_brasil`,
//    ou seja, o jogador piorava a relação consigo mesmo.
//
// 2. A REAÇÃO ERA SÓ FOFOCA. Atacar um membro derrubava −18 de relação com os outros. Só.
//    Nenhum país mandava tropa, dinheiro ou embargo. O mundo COMENTAVA.
//
// A correção conceitual: bloco não é rótulo, é COMPROMISSO — e compromisso tem grau.
// A OTAN tem Artigo 5 (ataque a um é ataque a todos) e responde forte; o BRICS é um
// arranjo econômico sem cláusula militar e responde com nota de repúdio e pouco mais.
// `intensidade` é onde essa diferença vive, e é ela que decide quanto aço realmente sai
// de casa. Sem ela, "BRICS" e "OTAN" seriam a mesma coisa com nomes diferentes.
import { PAISES, chaveRelacao, jogadorIso, souEu } from './paises.js';

// `intensidade` 0–100: quanto o bloco realmente se mexe por um membro atacado.
//   90+ = pacto militar com cláusula de defesa mútua (a OTAN)
//   ~55 = aliança militar de fato, sem tratado automático
//   ~30 = arranjo político/econômico; solidariedade retórica, ajuda tímida (o BRICS)
export const BLOCOS = {
  OTAN: {
    nome: 'OTAN', intensidade: 92, militar: true,
    // Os EUA de volta ao próprio bloco, e a Turquia — que paises.js já rotulava "OTAN"
    // e a lista de membros ignorava.
    isos: ['USA', 'DEU', 'FRA', 'GBR', 'CAN', 'TUR'],
  },
  UE: {
    nome: 'União Europeia', intensidade: 48, militar: false,
    isos: ['DEU', 'FRA'],
  },
  BRICS: {
    nome: 'BRICS', intensidade: 34, militar: false,
    // Composição de 2026: aos fundadores somam-se Irã, Egito e Indonésia.
    isos: ['BRA', 'RUS', 'IND', 'CHN', 'IRN', 'EGY', 'IDN'],
  },
  IndoPac: {
    nome: 'Aliados do Indo-Pacífico', intensidade: 60, militar: true,
    isos: ['USA', 'JPN', 'KOR', 'TWN', 'AUS'],
  },
};

// Fornecedores de armas: se você tem boa relação, ganha desconto militar.
export const FORNECEDORES = ['USA', 'DEU', 'FRA', 'GBR', 'KOR', 'ISR', 'JPN'];

export function blocosDoIso(iso) {
  return Object.values(BLOCOS).filter((b) => b.isos.includes(iso));
}

// Os blocos a que EU pertenço. É isto que responde "quem são os meus?" — e a resposta
// muda conforme quem joga, que era exatamente o que faltava.
export function meusBlocos() {
  return blocosDoIso(jogadorIso());
}

// Quem reage quando o alvo é atacado. `isoAlvo` é quem apanhou.
// Exclui o alvo (óbvio) E o jogador (não óbvio, e era o bug: você não se penaliza por
// atacar alguém, mesmo que dividam bloco).
export function reacaoDeBloco(isoAlvo) {
  const nomes = new Set();
  const relKeys = new Set();
  const isos = new Set();
  let blocoNome = null;
  let intensidade = 0;
  for (const b of blocosDoIso(isoAlvo)) {
    // O bloco só reage se ele é MAIS forte que o anterior encontrado — um país em dois
    // blocos (a Turquia é OTAN, o Egito é BRICS) é defendido pelo mais comprometido.
    if (b.intensidade > intensidade) { intensidade = b.intensidade; blocoNome = b.nome; }
    for (const iso of b.isos) {
      if (iso === isoAlvo || souEu(iso)) continue;
      const info = PAISES[iso];
      if (info) { nomes.add(info.nome); relKeys.add(info.rel); isos.add(iso); }
    }
  }
  return { blocoNome, intensidade, paises: [...nomes], relKeys: [...relKeys], isos: [...isos] };
}

// Meus aliados de bloco — quem responderia se ALGUÉM me atacasse. Era o caminho que não
// existia: `reacaoDeBloco` só sabia o sentido "eu ataquei", nunca "eu apanhei".
export function meusAliadosDeBloco() {
  const out = new Map();
  for (const b of meusBlocos()) {
    for (const iso of b.isos) {
      if (souEu(iso)) continue;
      const atual = out.get(iso);
      if (!atual || b.intensidade > atual.intensidade) {
        out.set(iso, { iso, nome: PAISES[iso]?.nome || iso, rel: PAISES[iso]?.rel, bloco: b.nome, intensidade: b.intensidade });
      }
    }
  }
  return [...out.values()];
}

// Desconto militar por alianças com fornecedores (rel >= 50). Máx 30%.
export function descontoMilitar(estado) {
  let desc = 0;
  const aliados = [];
  for (const iso of FORNECEDORES) {
    if (souEu(iso)) continue;   // você não se vende arma com desconto
    const info = PAISES[iso];
    if (!info) continue;
    const rel = Number(estado[info.rel] ?? 0);
    if (rel >= 50) { desc += 0.08; aliados.push(info.nome); }
  }
  return { fracao: Math.min(0.3, desc), aliados };
}

export { chaveRelacao };
