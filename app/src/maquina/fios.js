// CAMADA 1 — OS FIOS DE TENSÃO.
// A memória e a coerência do mundo. Roda 100% em código (sem IA): é barato.
// Um fio é uma pressão de fundo que NASCE das ações/estado, SOBE e DESCE,
// pode MUTAR e MORRE. É o que substitui os "arcos" — arcos cultivados, não escritos.
//
// Fios são OCULTOS do jogador. Ele os sente pelo feed.

const TETO_FIOS_ATIVOS = 5;   // o mundo tem foco; não vira sopa de crises
const MORTE_POR_FRIO = 12;    // abaixo disto por tempo demais, o fio morre
const DECAIMENTO = 3;         // todo turno os fios esfriam um pouco sozinhos

let contador = 0;
function novoId(tema) {
  contador += 1;
  const slug = tema.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').slice(0, 20);
  return `fio_${slug}_${contador}`;
}

export function criarFio({ tema, intensidade = 40, alvo_pressao = 'estabilidade', atores = [] }) {
  return {
    id: novoId(tema),
    tema,
    intensidade: Math.max(0, Math.min(100, intensidade)),
    alvo_pressao,
    atores,
    status: 'ativo',
    memoria: [],
    turnosFrio: 0,
  };
}

// Qual medidor está mais frágil agora? (a Máquina ataca onde dói)
// Para estes eixos, valor BAIXO = frágil.
const EIXOS_FRAGEIS = ['aprovacao', 'estabilidade', 'seguranca', 'temp_economia'];
export function eixoMaisFragil(estado) {
  let pior = EIXOS_FRAGEIS[0];
  for (const eixo of EIXOS_FRAGEIS) {
    if (Number(estado[eixo]) < Number(estado[pior])) pior = eixo;
  }
  return pior;
}

// Pontua e escolhe o fio-tema do próximo acontecimento.
export function escolherFioTema(fios, estado, ultimoFioId) {
  const ativos = fios.filter((f) => f.status === 'ativo' || f.status === 'esfriando');
  if (ativos.length === 0) return null;

  const fragil = eixoMaisFragil(estado);
  let melhor = null;
  let melhorScore = -Infinity;

  for (const f of ativos) {
    const bonusDrama = f.alvo_pressao === fragil ? 1.5 : 1;
    const penalRepeticao = f.id === ultimoFioId ? 0.6 : 1; // evita puxar sempre o mesmo
    const score = f.intensidade * bonusDrama * penalRepeticao;
    if (score > melhorScore) {
      melhorScore = score;
      melhor = f;
    }
  }
  return melhor;
}

// Registra na memória do fio o que aconteceu (a IA lê isto depois).
export function anotarNoFio(fio, texto) {
  if (!fio) return;
  fio.memoria.push(texto);
  if (fio.memoria.length > 8) fio.memoria.shift();
}

// Depois da decisão do jogador: aplica efeito_no_fio, absorve fios_update da IA,
// faz decaimento, mata fios frios e respeita o teto. Retorna a nova lista.
export function atualizarFios({ fios, fioTema, efeitoNoFio, fiosUpdate, turno }) {
  let lista = [...fios];

  // 1. efeito da opção escolhida sobre o fio-tema
  if (fioTema && efeitoNoFio) {
    const f = lista.find((x) => x.id === fioTema.id);
    if (f) {
      if (typeof efeitoNoFio.intensidade === 'number') {
        f.intensidade = Math.max(0, Math.min(100, f.intensidade + efeitoNoFio.intensidade));
      }
      if (efeitoNoFio.status) f.status = efeitoNoFio.status;
      if (efeitoNoFio.pode_mutar) f.status = 'mutou';
    }
  }

  // 2. fios_update propostos pela IA (nascer / alterar) — já vêm saneados
  for (const u of fiosUpdate || []) {
    if (u.novo || !lista.find((x) => x.id === u.id)) {
      if (lista.filter((x) => x.status === 'ativo').length < TETO_FIOS_ATIVOS) {
        lista.push(criarFio({
          tema: u.tema || 'Nova tensão',
          intensidade: u.intensidade ?? 45,
          alvo_pressao: u.alvo_pressao || 'estabilidade',
        }));
      }
    } else {
      const f = lista.find((x) => x.id === u.id);
      if (u.intensidade != null) f.intensidade = Math.max(0, Math.min(100, u.intensidade));
      if (u.status) f.status = u.status;
    }
  }

  // 3. decaimento natural + contagem de frio
  for (const f of lista) {
    if (f.id === fioTema?.id) { f.turnosFrio = 0; continue; }
    f.intensidade = Math.max(0, f.intensidade - DECAIMENTO);
    f.turnosFrio = f.intensidade < MORTE_POR_FRIO ? (f.turnosFrio + 1) : 0;
  }

  // 4. morte: resolvidos, ou frios demais
  lista = lista.filter((f) => {
    if (f.status === 'resolvido') return false;
    if (f.turnosFrio >= 3) return false;
    return true;
  });

  return lista;
}
