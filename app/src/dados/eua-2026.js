// FICHA DO MUNDO — Estados Unidos, era 2026. Feita à mão (alta qualidade).
// É o snapshot que a Máquina é OBRIGADA a respeitar: ela só gera o que é plausível
// aqui. Trocar de país/ano no futuro = trocar este objeto.
//
// Valores ilustrativos/aproximados — o pipeline de dados reais vem depois.
import { FORCAS_EUA } from './forcas.js';

export const FICHA_EUA_2026 = {
  forcasIniciais: FORCAS_EUA,
  ano: 2026,
  pais: 'Estados Unidos',
  iso: 'USA',
  presidente: 'Franklin P. Vane',
  capital: 'Washington, D.C.',
  bandeira: '🦅',
  pino: { lat: 38.9, lng: -77.0 },

  // Texto que entra no prompt da Máquina (o "resumo da ficha").
  resumo: `Superpotência ainda nº 1 em PIB e força militar, mas contestada. Economia gigante
sob pressão de inflação persistente e juros altos. Sociedade polarizada, imigração como
ferida aberta. Líder mundial em tecnologia, IA e poder naval (porta-aviões). Arsenal nuclear.
Rivalidade estratégica com a China (comércio, tecnologia, Taiwan), atrito com Irã e Rússia,
alianças fortes com OTAN e aliados do Pacífico. Dependente de importações de terras raras.`,

  // Relações bilaterais (-100 a +100). Chaves no formato rel_<pais>.
  // Toda chave rel_ declarada em PAISES precisa existir aqui, senão o país cai em 0
  // (neutro) e o jogo trata o Japão como se fosse a Suíça. Faltavam nove — e o buraco
  // só apareceu quando as bases militares passaram a exigir relação ≥ 40: nenhum
  // aliado real dos EUA aceitava base, porque nenhum tinha relação definida.
  relacoes: {
    // adversários e rivais
    rel_china: -40,
    rel_ira: -60,
    rel_russia: -55,
    rel_norte: -70,   // Coreia do Norte: tecnicamente ainda em guerra desde 1953
    // aliados de tratado
    rel_ue: 65,
    rel_reino: 80,    // relação especial, a mais antiga da lista
    rel_israel: 70,
    rel_japao: 75,    // Tratado de Segurança de 1960 — Kadena, Yokosuka, Misawa
    rel_coreia: 72,   // 28 mil soldados em Camp Humphreys
    rel_canada: 82,   // NORAD: defesa aérea literalmente compartilhada
    rel_australia: 78, // AUKUS, Pine Gap, fuzileiros em Darwin
    // parceiros e não-alinhados
    rel_taiwan: 55,
    rel_ucrania: 60,
    rel_arabia: 30,
    rel_india: 35,    // não-alinhada por doutrina, compra petróleo russo sem pedir desculpa
    rel_brasil: 25,
    rel_mexico: 40,   // vizinho, sócio comercial, e assunto eleitoral permanente
  },

  // Tensões reais do recorte histórico (alimentam os fios-semente e o prompt).
  tensoes: [
    'Rivalidade tecnológica e comercial com a China; risco sobre Taiwan',
    'Programa nuclear e proxies do Irã no Oriente Médio',
    'Inflação persistente e pressão sobre o custo de vida',
    'Polarização interna e disputa sobre imigração',
    'Guerra na Ucrânia e coesão da OTAN',
  ],

  // Estado inicial do mundo (o vocabulário fechado — ver jogo/vars.js).
  estadoInicial: {
    // medidores (0–100)
    aprovacao: 48,
    estabilidade: 55,
    soft_power: 70,
    seguranca: 62,
    temp_guerra: 30,
    temp_economia: 45,
    liberdades: 68,
    poder_militar: 78,  // a maior força do mundo
    // economia (US$ trilhões)
    pib: 28,            // ~US$ 28 tri, maior economia do planeta
    tesouro: 3.2,       // caixa/reservas em trilhões
    divida: 122,        // dívida/PIB ~122%
    aliquota: 27,       // carga tributária média
    // capacidades (0–100)
    inteligencia: 80,   // CIA/NSA de ponta
    capacidade_ind: 66, // base industrial/militar
    uranio: 45,         // estoque estratégico (minere pra destravar ogivas)
    // poder territorial / arsenal
    territorio: 1,      // território-mãe (expandir rumo a Imperador)
    ogivas: 0,          // arsenal a reconstruir (destrave o programa)
  },

  // Fios de Tensão iniciais (a Máquina começa com o mundo já "quente").
  fiosSemente: [
    { tema: 'Escalada estratégica com o Irã', intensidade: 55, alvo_pressao: 'seguranca', atores: ['ira', 'israel'] },
    { tema: 'Inflação e custo de vida', intensidade: 50, alvo_pressao: 'temp_economia', atores: [] },
    { tema: 'Fratura interna sobre imigração', intensidade: 45, alvo_pressao: 'estabilidade', atores: [] },
    { tema: 'Rivalidade com a China', intensidade: 48, alvo_pressao: 'soft_power', atores: ['china', 'taiwan'] },
  ],
};
