// ═══════════════════════════════════════════════════════════════════════
// ALIANÇAS — o jogador funda o próprio bloco
// ═══════════════════════════════════════════════════════════════════════
// O pedido: poder CRIAR uma aliança, dar nome, escolher regras, convidar países
// — e que a decisão deles de entrar leve em conta a relação com você E a
// discordância com quem já está no bloco. E que entrar RENDA (força militar ou
// economia), como um bônus de RPG que o jogador sente e acha vantajoso.
//
// A jogada de arquitetura: uma aliança criada VIRA UM BLOCO DE VERDADE. Ela é
// normalizada (comoBloco) e injetada em blocos.js via registrarAliancas — então
// a coalizão que te defende, o desconto de armas e a reação mundial a um ataque
// já funcionam pra ela SEM UMA LINHA NOVA nesses sistemas. O bloco é a interface;
// a aliança é só mais um bloco que nasceu do jogador em vez de vir de fábrica.
//
// Modelo de ALIANÇA ÚNICA FLEXÍVEL (decisão do dono): não há "tipos" fixos. O
// jogador liga REGRAS, e o CARÁTER (militar/econômico/híbrido) e a INTENSIDADE
// EMERGEM das regras escolhidas. Um pacto com Defesa Mútua é a OTAN; um só de
// Livre Comércio é a UE — sem o jogador escolher um rótulo, só o que o bloco FAZ.
import { PAISES, jogadorIso } from '../dados/paises.js';
import { forcaDe } from './forcasMundo.js';
import { registrarAliancas } from '../dados/blocos.js';

// ── REGRAS: cada uma soma intensidade e define o caráter ───────────────
// `intens` = quanto de compromisso a regra injeta no bloco (a mesma escala 0–100
// de blocos.js: Defesa Mútua sozinha já leva perto do patamar OTAN). `militar`/
// `economico` marcam de que natureza a regra é — é o que faz o caráter emergir.
export const REGRAS_ALIANCA = {
  defesa_mutua: {
    nome: 'Defesa Mútua', tag: 'Artigo 5', ic: 'shield', intens: 40, militar: true,
    desc: 'Ataque a um é ataque a todos. Os membros mandam tropa quando você apanha — e você quando eles apanham.',
  },
  livre_comercio: {
    nome: 'Livre Comércio Interno', tag: 'Mercado', ic: 'coins', intens: 14, economico: true,
    desc: 'Tarifas zeradas entre membros. PIB e confiança do mercado sobem enquanto o bloco existir.',
  },
  coord_sancoes: {
    nome: 'Coordenação de Sanções', tag: 'Diplomacia', ic: 'ban', intens: 10, economico: true,
    desc: 'O bloco sanciona junto. Peso diplomático coletivo — e o inimigo comum sente no bolso.',
  },
  nao_agressao: {
    nome: 'Pacto de Não-Agressão', tag: 'Paz interna', ic: 'handshake', intens: 6,
    desc: 'Membros não se atacam. Fácil de aceitar — quase todo mundo topa não levar facada.',
  },
  veto_saida: {
    nome: 'Cláusula de Permanência', tag: 'Coesão', ic: 'lock', intens: 8,
    desc: 'Sair exige alto custo político. Dá coesão ao bloco, mas assusta quem preza autonomia.',
  },
};

// Objetivos declarados — sabor + efeito na decisão de aceite (contenção afasta amigos do alvo).
export const OBJETIVOS_ALIANCA = {
  defesa: { nome: 'Defesa Coletiva', ic: 'shield' },
  comercio: { nome: 'Prosperidade Compartilhada', ic: 'coins' },
  contencao: { nome: 'Contenção de um Rival', ic: 'crosshair', exigeAlvo: true },
  nao_agressao: { nome: 'Estabilidade Regional', ic: 'handshake' },
  ideologico: { nome: 'Afinidade Ideológica', ic: 'landmark' },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ── CARÁTER E INTENSIDADE (derivados das regras) ───────────────────────
export function intensidadeDe(al) {
  let i = 22;   // um clube existe mesmo sem cláusula: 22 é o piso "arranjo político"
  for (const k of Object.keys(al?.regras || {})) if (al.regras[k]) i += REGRAS_ALIANCA[k]?.intens || 0;
  return Math.min(95, i);
}
export function ehMilitar(al) { return !!al?.regras?.defesa_mutua; }
export function ehEconomica(al) { return !!(al?.regras?.livre_comercio || al?.regras?.coord_sancoes); }
export function caraterDe(al) {
  const m = ehMilitar(al); const e = ehEconomica(al);
  if (m && e) return { rot: 'ALIANÇA ESTRATÉGICA', cor: '#b98cff', ic: 'swords' };
  if (m) return { rot: 'PACTO MILITAR', cor: '#ff8c42', ic: 'shield' };
  if (e) return { rot: 'UNIÃO ECONÔMICA', cor: '#22e0a0', ic: 'coins' };
  return { rot: 'ENTENDIMENTO DIPLOMÁTICO', cor: '#35e0ff', ic: 'handshake' };
}

// Normaliza a aliança pro shape que blocos.js entende. É a ponte que faz coalizão,
// mercado e reação mundial tratarem o bloco do jogador como qualquer outro.
export function comoBloco(al) {
  return { nome: al.nome, intensidade: intensidadeDe(al), militar: ehMilitar(al), isos: [...al.membros], _aliancaId: al.id, cor: al.cor };
}

// Ressincroniza TODAS as alianças do estado com blocos.js. Chamar após qualquer
// mutação (criar/convidar/sair) e no carregamento/render.
export function sincronizarBlocos(estado) {
  registrarAliancas((estado?.aliancas || []).map(comoBloco));
}

// ── ALINHAMENTO (proxy de "discordância") ──────────────────────────────
// Não temos matriz completa de relação entre NPCs, mas PAISES[iso].bloco é um
// rótulo que já classifica cada país num eixo. Traduzimos pra um número -1..+1
// (ocidental/aliado ↔ oriental/adversário); a distância entre dois países aproxima
// o quanto eles "discordam" — o suficiente pra decisão de aceite ser legível.
const EIXO_BLOCO = {
  'Superpotência': 0.8, 'Aliado': 1, 'Parceiro': 0.7, 'OTAN': 1, 'OTAN / UE': 1,
  'Rival sistêmico': -0.8, 'Adversário': -1, 'Não-alinhado': 0, 'Vizinho': 0.3,
};
function alinhamento(iso) { return EIXO_BLOCO[PAISES[iso]?.bloco] ?? 0; }

// ── A DECISÃO DE ACEITAR O CONVITE ─────────────────────────────────────
// Mesmo espírito de coalizao.js: relação é o motor, discordância e compromisso
// puxam pra baixo, apelo puxa pra cima. Retorna chance 0..1 + motivo legível (o
// jogador precisa entender POR QUE a Argentina recusou — pra jogar em cima disso).
export function chanceAceite(estado, iso, al) {
  const info = PAISES[iso];
  if (!info) return { chance: 0, motivo: 'país desconhecido', rel: 0 };
  if (al.membros.includes(iso)) return { chance: 1, motivo: 'já é membro', rel: 100, jaMembro: true };
  const rel = Number(estado[info.rel] ?? 0);

  let c = 0.18 + (rel / 100) * 0.6;                    // relação: rel +100 → +0.6 · -100 → -0.6
  const detalhes = [];

  // compromisso pedido: quanto mais forte o pacto, mais o país pensa duas vezes
  c -= (intensidadeDe(al) / 100) * 0.22;

  // apelo: pacto militar seduz o fraco e o ameaçado; comércio seduz quase todo mundo
  if (ehMilitar(al) && (info.forca || 60) < 60) { c += 0.14; detalhes.push('busca guarda-chuva militar'); }
  if (ehEconomica(al)) c += 0.07;

  // DISCORDÂNCIA com quem já está no bloco (o pedido central do dono)
  const alinCand = alinhamento(iso);
  let atrito = 0;
  for (const m of al.membros) {
    if (m === iso) continue;
    if (Math.abs(alinCand - alinhamento(m)) >= 1.5) atrito += 0.14;   // lados opostos do tabuleiro
  }
  if (atrito > 0) { c -= Math.min(0.42, atrito); detalhes.unshift(`discorda de membros já no bloco`); }

  // objetivo de CONTENÇÃO de um país próximo do candidato → ele não entra pra atacar um amigo
  if (al.objetivo === 'contencao' && al.alvoContencao && al.alvoContencao !== iso) {
    if (Math.abs(alinCand - alinhamento(al.alvoContencao)) < 0.7) {
      c -= 0.35; detalhes.unshift(`não vai conter ${PAISES[al.alvoContencao]?.nome || 'o alvo'} — são próximos`);
    }
  }
  if (al.objetivo === 'contencao' && al.alvoContencao === iso) return { chance: 0.01, motivo: 'é o próprio alvo da contenção', rel };

  // orgulho/medo: potência muito maior que o bloco todo não se curva a entrar
  const poderBloco = al.membros.reduce((s, m) => s + forcaDe(estado, m), 0) || 1;
  if ((info.forca || 60) > poderBloco * 1.25) { c -= 0.22; detalhes.push('poderoso demais pra se subordinar ao bloco'); }

  c = clamp(c, 0.02, 0.96);

  let motivo;
  if (rel <= -20) motivo = `relação hostil (${Math.round(rel)}) — nem senta à mesa`;
  else if (detalhes.length) motivo = detalhes[0];
  else if (rel >= 55) motivo = `aliado próximo (relação ${Math.round(rel)})`;
  else motivo = ehEconomica(al) ? 'interessado no comércio' : 'pesa o convite';
  return { chance: c, motivo, rel };
}

// ── BÔNUS DE RPG AO ENTRAR (o "ganhar força") ──────────────────────────
// Punchy e vantajoso, como o dono pediu: entrar/receber um membro dá um salto
// SENTIDO na hora. Pacto militar → poder militar; união econômica → mercado/PIB.
// Devolve o objeto de efeitos (quem chama aplica com aplicarEfeitos).
export function bonusAoEntrar(estado, al, isoNovo) {
  const ef = { soft_power: 3 };
  const f = forcaDe(estado, isoNovo) || PAISES[isoNovo]?.forca || 40;
  if (ehMilitar(al)) ef.poder_militar = clamp(Math.round(f / 35) + 2, 2, 9);
  if (ehEconomica(al)) { ef.temp_economia = 4; ef.pib = 0.2; }
  if (al.objetivo === 'ideologico') ef.soft_power += 3;
  return ef;
}

// ── RENDA PASSIVA DO BLOCO (lida pela economia a cada tick) ─────────────
// União econômica rende comércio interno todo mês: cada PARCEIRO acrescenta uma
// fatia do seu PIB. É o bônus que faz o jogador querer crescer o bloco — e ele
// aparece como uma linha do fluxo de caixa (economia.js), não um número mágico.
export function rendaAlianca(estado) {
  const eu = estado.iso || jogadorIso();
  let r = 0;
  for (const al of (estado.aliancas || [])) {
    if (!al.membros.includes(eu)) continue;
    if (!ehEconomica(al)) continue;
    const parceiros = al.membros.length - 1;
    if (parceiros <= 0) continue;
    const taxa = al.regras.livre_comercio ? 0.0012 : 0.0006;   // livre comércio rende o dobro
    r += parceiros * taxa * (estado.pib || 0);
  }
  return Math.round(r * 100) / 100;
}

// Membros do meu bloco militar que também fabricam armas → desconto extra (usado
// por blocos.descontoMilitar). Poder de fogo compartilhado é vantagem concreta.
export function fornecedoresDeAlianca(estado) {
  const eu = estado.iso || jogadorIso();
  const out = new Set();
  for (const al of (estado.aliancas || [])) {
    if (!ehMilitar(al) || !al.membros.includes(eu)) continue;
    for (const m of al.membros) if (m !== eu) out.add(m);
  }
  return [...out];
}

// ── MUTAÇÕES ───────────────────────────────────────────────────────────
export function criarAlianca(estado, { nome, tag, cor, regras, objetivo, alvoContencao }) {
  estado.aliancas = estado.aliancas || [];
  const eu = estado.iso || jogadorIso();
  // já sou fundador de uma? o jogo permite uma aliança-mãe do jogador por vez (clareza).
  const al = {
    id: `al_${estado.turno || 0}_${estado.aliancas.length}`,
    nome: (nome || '').trim().slice(0, 40) || 'Nova Aliança',
    tag: ((tag || nome || 'ALI').replace(/[^A-Za-zÀ-ÿ0-9]/g, '') || 'ALI').toUpperCase().slice(0, 4),
    cor: cor || '#35e0ff',
    fundador: eu, membros: [eu], convites: [],
    regras: { ...(regras || {}) },
    objetivo: objetivo || 'defesa',
    alvoContencao: alvoContencao || null,
    criadaEm: estado.turno || 0,
  };
  estado.aliancas.push(al);
  sincronizarBlocos(estado);
  return al;
}

// Convidar = rolar a decisão AGORA (a chance é mostrada antes, no preview). Se aceita,
// entra e recebe o bônus; o registro do convite guarda o desfecho e o motivo.
export function convidar(estado, alId, iso) {
  const al = (estado.aliancas || []).find((a) => a.id === alId);
  if (!al) return { erro: 'aliança não encontrada' };
  if (al.membros.includes(iso)) return { erro: 'já é membro' };
  const prev = chanceAceite(estado, iso, al);
  const aceito = Math.random() < prev.chance;
  al.convites = (al.convites || []).filter((c) => c.iso !== iso);
  al.convites.push({ iso, status: aceito ? 'aceitou' : 'recusou', motivo: prev.motivo, quando: estado.turno || 0 });
  let bonus = null;
  if (aceito) {
    al.membros.push(iso);
    bonus = bonusAoEntrar(estado, al, iso);
    sincronizarBlocos(estado);
  }
  return { aceito, motivo: prev.motivo, chance: prev.chance, bonus, alianca: al };
}

export function sairAlianca(estado, alId, iso = null) {
  const eu = iso || estado.iso || jogadorIso();
  const al = (estado.aliancas || []).find((a) => a.id === alId);
  if (!al) return { erro: 'aliança não encontrada' };
  al.membros = al.membros.filter((m) => m !== eu);
  // fundador saiu ou bloco esvaziou → dissolve
  if (eu === al.fundador || al.membros.length === 0) {
    estado.aliancas = estado.aliancas.filter((a) => a.id !== alId);
    sincronizarBlocos(estado);
    return { dissolvido: true, nome: al.nome };
  }
  sincronizarBlocos(estado);
  return { saiu: true, nome: al.nome };
}

// Poder militar e PIB somados de um bloco (pro visor de blocos).
export function poderDoBloco(estado, isos) {
  let mil = 0; let pib = 0;
  for (const iso of isos) {
    mil += forcaDe(estado, iso);
    // PIB: só o do jogador é preciso; NPC estimamos pela força (proxy suficiente pro visor)
    pib += (iso === (estado.iso || jogadorIso())) ? (estado.pib || 0) : (PAISES[iso]?.forca || 40) * 0.12;
  }
  return { militar: Math.round(mil), pib: Math.round(pib * 10) / 10 };
}

// Alianças de que EU faço parte (pra HUD/atalhos).
export function minhasAliancas(estado) {
  const eu = estado.iso || jogadorIso();
  return (estado.aliancas || []).filter((a) => a.membros.includes(eu));
}
