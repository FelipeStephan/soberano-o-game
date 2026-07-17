// OS LÍDERES DO MUNDO — personagens FICTÍCIOS.
//
// Decisão de design (deliberada): os chefes de Estado do jogo são inventados, nunca
// políticos reais vivos. Além de ser a linha que não cruzamos (missão de assassinato
// contra pessoa real, não), é melhor jogo: estes líderes têm arquétipo, evoluem,
// caem em golpes, são substituídos — e você pode caçá-los sem apontar para ninguém real.
import { retrato } from './imagens.js';

const NOMES = {
  CHN: ['Wei Zhang', 'Li Chen', 'Hua Lin'],
  RUS: ['Viktor Sorokin', 'Dmitri Volkov', 'Anna Karelin'],
  IRN: ['Reza Farhadi', 'Kian Nazari', 'Darius Ahmadi'],
  BRA: ['Otávio Mendes', 'Beatriz Cardoso', 'Rui Barcelos'],
  IND: ['Arjun Mehta', 'Priya Nair', 'Vikram Desai'],
  DEU: ['Klaus Bergmann', 'Ingrid Vogel', 'Anton Reuter'],
  FRA: ['Émile Rochas', 'Camille Duret', 'Henri Lambert'],
  GBR: ['Edward Ashcroft', 'Margaret Hollis', 'Nigel Crane'],
  JPN: ['Kenji Arata', 'Yuki Morimoto', 'Hana Kudo'],
  KOR: ['Jin-ho Park', 'Seo-yeon Lim', 'Min-jun Ha'],
  PRK: ['Chol Nam-gi', 'Sung-il Ryu'],
  ISR: ['Ariel Ben-Zvi', 'Noa Hadar'],
  SAU: ['Faisal al-Rashid', 'Khalid al-Muhanna'],
  MEX: ['Rodrigo Salazar', 'Lucía Vega'],
  CAN: ['Grace Thornton', 'Liam Beaumont'],
  UKR: ['Taras Kovalenko', 'Oksana Bondar'],
  TWN: ['Chen Wei-ting', 'Mei-ling Kuo'],
  AUS: ['Harold Kingsley', 'Sienna Marsh'],
  USA: ['Franklin Pierce Vane', 'Eleanor Ashford', 'Dale Rutherford'],
};

const ARQUETIPOS = [
  { id: 'falcao',     nome: 'Falcão',        desc: 'Resolve tudo na força. Não recua de uma ameaça.',            traco: 'agressivo' },
  { id: 'tecnocrata', nome: 'Tecnocrata',    desc: 'Governa por planilha. Frio, calculista, previsível.',        traco: 'racional' },
  { id: 'populista',  nome: 'Populista',     desc: 'Vive da multidão. Imprevisível e teatral.',                  traco: 'volátil' },
  { id: 'raposa',     nome: 'Raposa',        desc: 'Diplomata astuto. Nunca mostra a mão inteira.',              traco: 'manipulador' },
  { id: 'autocrata',  nome: 'Autocrata',     desc: 'Manda porque pode. Oposição não é problema há anos.',        traco: 'brutal' },
  { id: 'reformista', nome: 'Reformista',    desc: 'Quer mudar o país. Faz inimigos poderosos por isso.',        traco: 'idealista' },
];

// Hash determinístico: o mesmo país sempre gera o mesmo líder na mesma partida.
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Pools para gerar um líder fictício plausível aos ~150 países sem nome fixo — pra
// nenhum país aparecer como "ARG Chefe de Estado". Neutros de propósito: é um jogo,
// e o líder é inventado. Estável pelo ISO (mesmo país → mesmo nome na partida).
const PRENOMES = [
  'Aloísio', 'Beatriz', 'Cornélio', 'Dara', 'Emílio', 'Farida', 'Gunnar', 'Helena',
  'Ivo', 'Júlia', 'Kadir', 'Lena', 'Milo', 'Nadia', 'Oskar', 'Petra', 'Rashid',
  'Sonia', 'Tobias', 'Ursula', 'Viktor', 'Wanda', 'Yara', 'Zoran', 'Amara', 'Bruno',
  'Celeste', 'Dmitri', 'Esther', 'Faisal',
];
const SOBRENOMES = [
  'Adler', 'Barros', 'Castellan', 'Dubois', 'Espósito', 'Falk', 'Grigor', 'Haziri',
  'Ilves', 'Jansen', 'Kovač', 'Lindqvist', 'Marchetti', 'Novak', 'Okonkwo', 'Petrov',
  'Quaranta', 'Reyes', 'Salgado', 'Tavares', 'Ustinov', 'Varga', 'Weiss', 'Ximenes',
  'Yilmaz', 'Zajac', 'Amín', 'Bauer', 'Cardoso', 'Delacroix',
];

function nomeFicticio(isoCode) {
  const h = hash(`lider-${isoCode}`);
  // >>> (não >>): o shift com sinal vira negativo quando o bit alto está setado, e
  // índice negativo devolve undefined ("Lena undefined"). O sem sinal mantém no range.
  return `${PRENOMES[h % PRENOMES.length]} ${SOBRENOMES[(h >>> 5) % SOBRENOMES.length]}`;
}

export function liderDe(isoCode, nomePais) {
  const h = hash(isoCode || nomePais || 'X');
  const pool = NOMES[isoCode];
  const nome = pool ? pool[h % pool.length] : nomeFicticio(isoCode || nomePais || 'X');
  const arq = ARQUETIPOS[h % ARQUETIPOS.length];
  return {
    iso: isoCode,
    nome,
    arquetipo: arq,
    idade: 45 + (h % 30),
    popularidade: 30 + (h % 55),
    retrato: retrato(`${isoCode}-${nome}`),
    vivo: true,
  };
}

// O SEU presidente (você é o chefe de Estado, não uma "vontade" abstrata).
export function criarPresidente({ nome, isoCode }) {
  return {
    nome: nome || 'Presidente',
    iso: isoCode,
    retrato: retrato(`presidente-${nome || isoCode}`),
    mandato: 1,
  };
}

export { ARQUETIPOS };
