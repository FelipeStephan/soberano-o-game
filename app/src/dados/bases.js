// ═══════════════════════════════════════════════════════════════════════
// BASES MILITARES — PROJEÇÃO DE PODER
// ═══════════════════════════════════════════════════════════════════════
// Uma superpotência não é quem tem o maior exército. É quem consegue colocar
// esse exército a 8.000 km de casa em 12 horas. Isso se chama base.
//
// COMO ENTRA NO JOGO:
//   • Você só instala base em país PARCEIRO (relação ≥ 40) ou OCUPADO.
//   • A base vira ponto de lançamento: o ataque parte DELA no globo 3D, não de casa.
//   • Perto do alvo = mais poder efetivo e menos custo logístico.
//   • Base custa manutenção TODO turno e o país anfitrião te odeia um pouco por ano.
//
// Os sítios abaixo são reais (Ramstein, Kadena, Al Udeid, Diego Garcia...) com
// coordenadas reais — é o que faz o arco no globo sair do lugar certo.
//
// A dependência de blocos.js é de mão única (bases → blocos → paises), sem ciclo: é o
// que permite o DIREITO DE BASE por aliança militar viver aqui, junto do resto da
// regra, em vez de espalhado pela UI.
import { blocosDoIso } from './blocos.js';
import { jogadorIso } from './paises.js';

// ── TIPOS DE INSTALAÇÃO ────────────────────────────────────────────────
// alcance: raio de projeção em km · poder: multiplicador de força efetiva
export const TIPOS_BASE = {
  posto: {
    id: 'posto', nome: 'Posto Avançado', ic: 'tent',
    custo: 0.08, manutencao: 0.01, alcance: 1200, poder: 1.10, desconto: 0.15,
    intel: 3, atrito: 2,
    desc: 'Uma pista, um radar e cem soldados entediados. Barato, discreto, limitado.',
  },
  aerea: {
    id: 'aerea', nome: 'Base Aérea', ic: 'plane',
    custo: 0.35, manutencao: 0.04, alcance: 3500, poder: 1.30, desconto: 0.30,
    intel: 6, atrito: 5,
    desc: 'Pista de 3 km, hangares blindados e combustível pra manter caças no ar 24h.',
  },
  naval: {
    id: 'naval', nome: 'Base Naval', ic: 'anchor',
    custo: 0.45, manutencao: 0.05, alcance: 5000, poder: 1.35, desconto: 0.35,
    intel: 5, atrito: 6,
    desc: 'Cais de águas profundas. Um porta-aviões atracado aqui muda o cálculo de uma região inteira.',
  },
  comando: {
    id: 'comando', nome: 'Comando Regional', ic: 'radio-tower',
    custo: 0.90, manutencao: 0.10, alcance: 7000, poder: 1.50, desconto: 0.45,
    intel: 12, atrito: 10,
    desc: 'Quartel-general permanente. Daqui se comanda um teatro de operações inteiro — e todo mundo sabe.',
  },
};

// ── SÍTIOS REAIS ───────────────────────────────────────────────────────
// Onde as bases de verdade estão. Se o país tem sítio conhecido, usamos o nome e a
// coordenada real. Se não, cai no centroide do país (ver coordDe()).
export const SITIOS = {
  DEU: { nome: 'Ramstein',          lat: 49.44,  lng: 7.60,   tipo: 'aerea',   nota: 'O maior centro aéreo americano fora dos EUA. Tudo que vai pro Oriente Médio passa aqui.' },
  JPN: { nome: 'Kadena',            lat: 26.35,  lng: 127.77, tipo: 'aerea',   nota: 'Okinawa. A "pedra angular do Pacífico" — e a 640 km de Taiwan.' },
  KOR: { nome: 'Camp Humphreys',    lat: 36.96,  lng: 127.03, tipo: 'comando', nota: 'A maior base americana no exterior. Construída pra encarar Pyongyang de frente.' },
  QAT: { nome: 'Al Udeid',          lat: 25.12,  lng: 51.32,  tipo: 'comando', nota: 'O quartel-general do CENTCOM avançado. De onde se comanda o Oriente Médio.' },
  GBR: { nome: 'Diego Garcia',      lat: -7.31,  lng: 72.41,  tipo: 'naval',   nota: 'Um atol no meio do Índico. Sem população civil, sem jornalista, sem testemunha.' },
  TUR: { nome: 'Incirlik',          lat: 37.00,  lng: 35.42,  tipo: 'aerea',   nota: 'Guarda ogivas nucleares táticas há décadas. E fica a 110 km da Síria.' },
  ITA: { nome: 'Aviano',            lat: 46.03,  lng: 12.60,  tipo: 'aerea',   nota: 'A porta aérea do sul da Europa. Foi de onde saíram os Bálcãs.' },
  ESP: { nome: 'Rota',              lat: 36.64,  lng: -6.35,  tipo: 'naval',   nota: 'Destroieres antimíssil no Atlântico. O escudo da Europa atraca aqui.' },
  BHR: { nome: 'NSA Bahrein',       lat: 26.21,  lng: 50.61,  tipo: 'naval',   nota: 'Casa da Quinta Frota. Vigia Ormuz de dentro do Golfo.' },
  DJI: { nome: 'Camp Lemonnier',    lat: 11.55,  lng: 43.15,  tipo: 'comando', nota: 'A única base permanente na África. Bab el-Mandeb, Iêmen e Somália ao alcance.' },
  AUS: { nome: 'Pine Gap / Darwin', lat: -12.46, lng: 130.85, tipo: 'aerea',   nota: 'Fuzileiros em Darwin e a estação de inteligência mais secreta do hemisfério sul.' },
  PHL: { nome: 'Subic / EDCA',      lat: 14.79,  lng: 120.28, tipo: 'naval',   nota: 'De volta ao Mar do Sul da China depois de 30 anos fora. A China notou.' },
  POL: { nome: 'Redzikowo',         lat: 54.48,  lng: 17.11,  tipo: 'aerea',   nota: 'Escudo antimíssil na cara da Rússia. Moscou chama de provocação — e é.' },
  KWT: { nome: 'Camp Arifjan',      lat: 28.87,  lng: 48.16,  tipo: 'comando', nota: 'O depósito do Golfo. Blindados pré-posicionados esperando uma guerra.' },
  ARE: { nome: 'Al Dhafra',         lat: 24.25,  lng: 54.55,  tipo: 'aerea',   nota: 'Caças de quinta geração e drones a 200 km da costa iraniana.' },
  GRC: { nome: 'Souda Bay',         lat: 35.53,  lng: 24.15,  tipo: 'naval',   nota: 'Creta. O melhor porto natural do Mediterrâneo oriental.' },
  ISR: { nome: 'Site 512',          lat: 30.62,  lng: 34.80,  tipo: 'posto',   nota: 'Radar no deserto do Neguev. Enxerga um lançamento iraniano em segundos.' },
  ROU: { nome: 'Mihail Kogălniceanu', lat: 44.36, lng: 28.49, tipo: 'aerea',   nota: 'A borda leste da OTAN, no Mar Negro. Cresceu muito desde 2022.' },
  NOR: { nome: 'Rygge',             lat: 59.38,  lng: 10.79,  tipo: 'aerea',   nota: 'O flanco ártico. A rota mais curta entre Moscou e Washington passa por cima.' },
  BRA: { nome: 'Alcântara',         lat: -2.37,  lng: -44.40, tipo: 'posto',   nota: 'A 2° do Equador — o melhor sítio de lançamento do hemisfério. Todo mundo quer.' },
  COL: { nome: 'Palanquero',        lat: 5.48,   lng: -74.66, tipo: 'aerea',   nota: 'Vigia a Venezuela e o Orinoco. Muito conveniente, considerando as reservas.' },
  PAN: { nome: 'Howard',            lat: 8.91,   lng: -79.60, tipo: 'posto',   nota: 'Guarda o Canal. Devolvido em 1999 — sempre dá pra pedir de volta.' },
  IRQ: { nome: 'Al Asad',           lat: 33.79,  lng: 42.44,  tipo: 'aerea',   nota: 'Já levou míssil balístico iraniano na cara. E continua lá.' },
  KEN: { nome: 'Manda Bay',         lat: -2.25,  lng: 40.91,  tipo: 'posto',   nota: 'Contraterrorismo no Chifre da África. Pequena, letal, negada.' },
  GRL: { nome: 'Pituffik',          lat: 76.53,  lng: -68.70, tipo: 'posto',   nota: 'A base mais ao norte do planeta. Alerta antecipado de míssil sobre o Polo.' },
};

// Relação mínima pra o país aceitar tropa estrangeira no solo dele.
export const REL_MINIMA_BASE = 40;
// ── DIREITO DE BASE POR ALIANÇA MILITAR ────────────────────────────────
// O QUE ISTO CONSERTA: fundar uma aliança militar não dava NADA de concreto no mapa.
// O jogador criava o pacto, convencia três países a entrar, ligava a Defesa Mútua — e
// continuava sem poder pousar um avião na casa deles. Para atacar longe seguia
// atravessando o oceano de casa, que é exatamente o que uma aliança existe pra evitar.
// Basear tropa no território do aliado é o benefício mais antigo e mais real de um
// pacto militar: é a OTAN inteira, é Ramstein, é Kadena.
//
// MAS SÓ PACTO MILITAR. Bloco econômico não abre base — isso não é detalhe, é a regra
// que impede o direito de base de virar sopa: entrar num acordo de livre comércio não
// autoriza ninguém a instalar um comando regional no seu quintal. O gate tem três
// travas, e as três precisam passar:
//   1. o bloco tem de conter VOCÊ e o país (ser aliado é de mão dupla);
//   2. o bloco tem de ser MILITAR (`militar: true` — nas alianças do jogador isso
//      emerge da regra Defesa Mútua, ver jogo/aliancas.js › ehMilitar);
//   3. o compromisso tem de ser real (`intensidade >= INTENSIDADE_MINIMA_BASE`) — a
//      mesma régua que o resto do jogo usa pra separar pacto de fachada.
// Além disso a relação não pode estar no negativo: aliado que já te detesta não assina
// acordo de status de forças, assina nota de repúdio.
export const INTENSIDADE_MINIMA_BASE = 55;
export const REL_MINIMA_BASE_ALIADO = 0;
// O acordo com um aliado é formalidade, não negociação: instalar sai mais barato.
export const DESCONTO_BASE_ALIADO = 0.25;

export function sitioDe(isoCode) { return SITIOS[isoCode] || null; }

// O pacto militar que me dá direito de base NESTE país (ou null). Fonte única: quem
// quiser saber "posso basear aqui por aliança?" pergunta aqui, não reimplementa.
export function aliancaMilitarComigo(isoCode) {
  const eu = jogadorIso();
  if (!isoCode || isoCode === eu) return null;
  return blocosDoIso(isoCode).find((b) => (
    b.militar === true
    && (b.intensidade || 0) >= INTENSIDADE_MINIMA_BASE
    && (b.isos || []).includes(eu)
  )) || null;
}

// ── ELEGIBILIDADE ──────────────────────────────────────────────────────
// Retorna { pode, motivo, viaOcupacao, viaAlianca } — por que você pode (ou não)
// instalar aqui. A ordem das checagens é a ordem da vida real: ocupação (não se pede
// licença), aliança militar (a licença já está no tratado), parceria (negocia-se).
export function podeInstalarBase(estado, isoCode, relValor) {
  if (isoCode === (estado.iso || 'USA')) return { pode: false, motivo: 'Já é seu território.' };
  if (basesEm(estado, isoCode).length >= 2) {
    return { pode: false, motivo: 'Já há duas instalações aqui. O anfitrião não aceita mais.' };
  }
  const ocupado = (estado.conquistados || []).some((c) => c.iso === isoCode);
  if (ocupado) return { pode: true, viaOcupacao: true, motivo: 'Território sob ocupação — você não pede licença.' };

  const pacto = aliancaMilitarComigo(isoCode);
  if (pacto) {
    if (relValor < REL_MINIMA_BASE_ALIADO) {
      return {
        pode: false, viaOcupacao: false, viaAlianca: null, pacto,
        motivo: `${pacto.nome} prevê o direito de base, mas a relação está em ${relValor}. Um aliado que te detesta não assina acordo de status de forças — recomponha a relação antes.`,
      };
    }
    return {
      pode: true, viaOcupacao: false, viaAlianca: pacto, pacto,
      motivo: `Aliado militar em ${pacto.nome}. O direito de base já está no pacto: o acordo de status de forças é assinado sem negociação, e a instalação sai ${Math.round(DESCONTO_BASE_ALIADO * 100)}% mais barata.`,
    };
  }

  if (relValor >= REL_MINIMA_BASE) {
    return { pode: true, viaOcupacao: false, viaAlianca: null, motivo: `Parceiro (relação ${relValor}). Aceitam negociar o acordo de status de forças.` };
  }
  // A dica de saída importa: sem ela o jogador lê "não pode" e não descobre que fundar
  // uma aliança militar com este país é o caminho — que é justamente a jogada boa.
  const blocoNaoMilitar = blocosDoIso(isoCode).find((b) => (b.isos || []).includes(jogadorIso()));
  return {
    pode: false, viaOcupacao: false, viaAlianca: null,
    motivo: blocoNaoMilitar
      ? `Vocês dividem ${blocoNaoMilitar.nome}, mas ${blocoNaoMilitar.militar ? 'o compromisso do bloco é fraco demais' : 'é um bloco sem cláusula militar'} — acordo econômico não abre quartel. É preciso um pacto com DEFESA MÚTUA, relação ${REL_MINIMA_BASE}+ (parceiro), ou tomar o país à força.`
      : `Relação ${relValor} — insuficiente. É preciso ${REL_MINIMA_BASE}+ (parceiro), uma aliança militar com este país, ou tomá-lo à força.`,
  };
}

// ── ESTADO ─────────────────────────────────────────────────────────────
export function todasBases(estado) { return estado.bases || []; }
export function basesEm(estado, isoCode) { return (estado.bases || []).filter((b) => b.iso === isoCode); }

// O custo real de instalar UM tipo aqui: o aliado militar cobra menos porque não há
// o que negociar — o direito de base já veio no tratado. Fonte única pra a UI mostrar
// o mesmo número que o caixa vai debitar (o preço na tela e o preço pago divergirem é
// o tipo de bug que o jogador chama de roubo).
export function custoInstalacao(tipo, { viaAlianca = false } = {}) {
  const t = TIPOS_BASE[tipo];
  if (!t) return 0;
  return round2(t.custo * (viaAlianca ? 1 - DESCONTO_BASE_ALIADO : 1));
}

export function instalarBase(estado, { iso, nome, lat, lng, tipo, viaOcupacao, viaAlianca }) {
  const t = TIPOS_BASE[tipo];
  if (!t) return { falha: 'Tipo de instalação inválido.' };
  const custo = custoInstalacao(tipo, { viaAlianca: !!viaAlianca });
  if (estado.tesouro < custo) return { falha: `Sem caixa: a instalação custa US$ ${custo} tri.` };

  estado.tesouro = round2(estado.tesouro - custo);
  estado.bases = estado.bases || [];
  const sitio = SITIOS[iso];
  const base = {
    id: `${iso}_${tipo}_${estado.bases.length}`,
    iso, paisNome: nome, tipo,
    nome: sitio?.nome || `Instalação ${nome}`,
    lat: sitio?.lat ?? lat, lng: sitio?.lng ?? lng,
    nota: sitio?.nota || null,
    desde: estado.turno || 0, prontidao: 100,
    viaOcupacao: Boolean(viaOcupacao),
    // guardado na base: se a aliança ROMPER, é por aqui que o jogo sabe quais
    // instalações perderam a base legal de existir (ver expulsarBasesSemPacto).
    viaAlianca: viaAlianca ? String(viaAlianca) : null,
  };
  estado.bases.push(base);
  return { base, tipo: t, custo };
}

// ── QUANDO O PACTO CAI, A BASE CAI JUNTO ───────────────────────────────
// Uma base instalada por direito de aliança existe porque o tratado existe. Se o
// aliado sai do bloco (ou te trai), aquele quartel deixa de ter amparo e o anfitrião
// manda embora — é o que aconteceu com todas as bases americanas nas Filipinas em 92.
// Sem isto, romper uma aliança não teria custo nenhum no mapa e o direito de base
// viraria uma porta que abre e nunca mais fecha.
export function expulsarBasesSemPacto(estado) {
  const antes = (estado.bases || []).length;
  if (!antes) return { expulsas: [] };
  const expulsas = [];
  estado.bases = estado.bases.filter((b) => {
    if (!b.viaAlianca) return true;
    if (aliancaMilitarComigo(b.iso)) return true;
    expulsas.push(b);
    return false;
  });
  return { expulsas };
}

export function removerBase(estado, baseId) {
  estado.bases = (estado.bases || []).filter((b) => b.id !== baseId);
}

// ── BASE EM ESTADO CONQUISTADO ─────────────────────────────────────────
// Você não precisa dominar o PAÍS inteiro pra instalar base: cada território
// ocupado (estado) já pode virar ponto de projeção. A base fica NA coordenada do
// estado (não no sítio do país) e conta igual pras demais (alcance/intel/custo).
export function basesNoEstado(estado, estadoId) { return (estado.bases || []).filter((b) => b.estadoId === estadoId); }
export function instalarBaseEstado(estado, { estadoId, iso, nome, lat, lng, tipo }) {
  const t = TIPOS_BASE[tipo];
  if (!t) return { falha: 'Tipo de instalação inválido.' };
  if (basesNoEstado(estado, estadoId).length >= 1) return { falha: 'Já há uma base neste território.' };
  if (estado.tesouro < t.custo) return { falha: `Sem caixa: a instalação custa US$ ${t.custo} tri.` };
  estado.tesouro = round2(estado.tesouro - t.custo);
  estado.bases = estado.bases || [];
  const base = {
    id: `st_${estadoId}_${tipo}_${estado.bases.length}`,
    iso, estadoId, paisNome: nome, tipo,
    nome: `${t.nome} · ${nome}`, lat, lng,
    nota: `Instalação em território ocupado (${nome}).`,
    desde: estado.turno || 0, prontidao: 100, viaOcupacao: true,
  };
  estado.bases.push(base);
  return { base, tipo: t };
}

// ── GEOMETRIA: a base perto do alvo é a base que importa ───────────────
export function distanciaKm(a, b) {
  const R = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
function rad(d) { return (d * Math.PI) / 180; }

// Bases que conseguem alcançar um alvo, ordenadas da mais próxima pra mais longe.
// Cada uma vem com o bônus que dá SE você lançar de lá.
export function basesQueAlcancam(estado, alvoCoord) {
  if (!alvoCoord) return [];
  return (estado.bases || [])
    .map((b) => {
      const t = TIPOS_BASE[b.tipo];
      const dist = distanciaKm(b, alvoCoord);
      const dentro = dist <= t.alcance;
      // O bônus decai com a distância dentro do raio: colado no alvo = bônus cheio.
      const prox = dentro ? 1 - (dist / t.alcance) * 0.45 : 0;
      return {
        ...b, tipoInfo: t, dist, dentro,
        poder: dentro ? 1 + (t.poder - 1) * prox : 1,
        desconto: dentro ? t.desconto * prox : 0,
      };
    })
    .filter((b) => b.dentro)
    .sort((a, b) => a.dist - b.dist);
}

// Custo de manutenção de todas as bases por turno (entra na economia).
export function custoBases(estado) {
  let t = 0;
  for (const b of estado.bases || []) t += TIPOS_BASE[b.tipo]?.manutencao || 0;
  return round2(t);
}

// Bônus passivo total das bases (inteligência de presença global).
export function bonusBases(estado) {
  let intel = 0;
  for (const b of estado.bases || []) intel += TIPOS_BASE[b.tipo]?.intel || 0;
  return { inteligencia: Math.round(intel) };
}

function round2(n) { return Math.round(n * 100) / 100; }
