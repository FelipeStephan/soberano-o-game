// RISCOS POR INDICADOR — o aviso sutil (⚠) que aparece quando um medidor entra
// em zona perigosa, e o que acontece se você ignorar.
// `perigoSe`: retorna true quando o indicador está em risco.

export const RISCOS = {
  aprovacao: {
    perigoSe: (v) => v <= 30,
    titulo: 'Aprovação em queda livre',
    texto: 'Abaixo de 30 o gabinete começa a conspirar. Chegando a zero, você é deposto — fim de jogo. Propaganda, subsídio ou uma vitória rápida seguram a onda.',
  },
  estabilidade: {
    perigoSe: (v) => v <= 30,
    titulo: 'A nação está rachando',
    texto: 'Coesão baixa vira protesto, protesto vira revolta. Em zero, o país se parte e seu reinado acaba. Guarnição, integração e pão na mesa acalmam.',
  },
  soft_power: {
    perigoSe: (v) => v <= 30,
    titulo: 'Isolamento internacional',
    texto: 'Sem influência, ninguém te ouve nem te ajuda. Alianças esfriam, sanções colam mais fácil e seu Destino trava. Cúpulas e ajuda externa recuperam.',
  },
  seguranca: {
    perigoSe: (v) => v <= 35,
    titulo: 'Defesas vulneráveis',
    texto: 'Segurança baixa convida ataque cibernético, espionagem e sabotagem. Cada flash urgente fica mais caro. Escudo, cyber e inteligência tapam o buraco.',
  },
  temp_guerra: {
    perigoSe: (v) => v >= 65,
    titulo: 'O mundo acha que você vai atacar',
    texto: 'Temperatura de guerra alta afasta TODAS as relações a cada turno, acelera o rearmamento dos rivais e derruba seu PIB. Diplomacia e tempo esfriam.',
  },
  temp_economia: {
    perigoSe: (v) => v <= 30,
    titulo: 'Confiança econômica no chão',
    texto: 'Mercado sem confiança encolhe o PIB todo turno e encarece sua dívida. Reforma pró-mercado ou estímulo revertem — cada um com seu preço político.',
  },
  liberdades: {
    perigoSe: (v) => v <= 30,
    titulo: 'Estado policial',
    texto: 'Liberdades no chão destroem seu soft power e alimentam insurgência. O mundo passa a te tratar como pária. Ampliar liberdades custa controle, mas salva a imagem.',
  },
  poder_militar: {
    perigoSe: (v) => v <= 35,
    titulo: 'Forças desgastadas',
    texto: 'Poder militar baixo derruba sua moral em combate (multiplica sua força enviada). Rivais notam fraqueza. Reponha unidades antes de qualquer ofensiva.',
  },
};

export function riscoDe(chave, valor) {
  const r = RISCOS[chave];
  if (!r || !r.perigoSe(valor)) return null;
  return r;
}
