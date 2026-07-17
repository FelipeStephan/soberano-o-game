// A BÚSSOLA POLÍTICA. Duas dimensões emergem das suas ações:
//   • eixo_economico:  -100 (Estatista/Coletivista) ↔ +100 (Mercado/Liberal)
//   • eixo_autoridade: -100 (Libertário) ↔ +100 (Autoritário)
// A combinação vira um RÓTULO que o jogo mostra na HUD: "Você é um(a) ___".

const F = 35;   // limiar "forte"
const X = 70;   // limiar "extremo"

// Classifica um ponto (econ, auth) em um rótulo ideológico.
export function classificar(econ, auth) {
  // extremos primeiro
  if (econ <= -X && auth >= F)  return rot('Comunista', '☭', 'Estado total e economia coletivizada.');
  if (econ >= F && auth >= X)   return rot('Fascista', '⛓️', 'Nacionalismo autoritário e capital dirigido.');
  if (auth >= X)                return rot('Ditador', '👊', 'O poder acima de tudo e de todos.');
  if (auth <= -X && econ <= -F) return rot('Anarco-socialista', '🅰️', 'Sem Estado, sem mercado, só a comuna.');
  if (auth <= -X && econ >= F)  return rot('Anarco-capitalista', '💸', 'O mercado resolve tudo; o Estado, nada.');

  // quadrantes fortes
  if (econ >= F && auth >= F)   return rot('Extrema-direita', '🦂', 'Ordem, mercado e mão de ferro.');
  if (econ <= -F && auth >= F)  return rot('Socialista Autoritário', '🚩', 'Igualdade imposta de cima.');
  if (econ <= -F && auth <= -F) return rot('Libertário de Esquerda', '🌱', 'Solidariedade sem coerção.');
  if (econ >= F && auth <= -F)  return rot('Libertário', '🗽', 'Liberdade individual e livre mercado.');

  // eixos isolados
  if (econ >= F)                return rot('Neoliberal', '📈', 'Mercado livre, Estado mínimo.');
  if (econ <= -F)              return rot('Socialista', '⚒️', 'Estado forte a serviço do povo.');
  if (auth >= F)                return rot('Autoritário', '🪖', 'Segurança e ordem antes de liberdade.');
  if (auth <= -F)              return rot('Progressista Libertário', '🕊️', 'Liberdades civis em primeiro lugar.');

  // centro
  if (econ <= -10)              return rot('Social-democrata', '🌹', 'Mercado com forte rede de proteção.');
  return rot('Tecnocrata Centrista', '⚙️', 'Pragmatismo acima de ideologia.');
}

function rot(label, icone, descricao) { return { label, icone, descricao }; }
