// O ESTADO DO MUNDO — a fonte da verdade. Só contém chaves do registro (vars.js)
// + relações + qualitativos + pontos de ação (recurso de turno gerido pelo motor).
import { VARS } from './vars.js';
import { PETROLEO, PRECO_BASE } from '../dados/petroleo.js';
import { reservaInicial } from '../dados/efetivoMilitar.js';

// PONTOS DE AÇÃO — APOSENTADO. No tempo real o ritmo é governado pela FILA DE COMANDO
// (capacidade + tamanho) e pelo CAIXA; o PA nunca recarregava e travava telas de vez.
// Mantido como pool "infinito" só pra não quebrar telas que ainda decrementam — não
// bloqueia nada e não aparece mais na UI. (Ver decisão em soberano-tempo-real.)
export const PA_POR_TURNO = 9999;

export function criarEstado(ficha, opcoes = {}) {
  const estado = {};
  for (const k of Object.keys(VARS)) {
    estado[k] = ficha.estadoInicial[k] ?? padrao(k);
  }
  for (const [k, v] of Object.entries(ficha.relacoes || {})) estado[k] = v;
  estado.risco_exposicao = 'baixo';
  estado.pontos_acao = PA_POR_TURNO; // fora do vocabulário da IA (só o motor mexe)
  estado.forcas = { ...(ficha.forcasIniciais || {}) }; // ordem de batalha (inventário militar)
  estado.reservaMilitar = reservaInicial(ficha.iso || ficha.estadoInicial?.iso || 'USA'); // reservistas convocáveis
  estado.conquistados = [];      // territórios ocupados [{iso, nome, insurgencia, desde}]
  estado.ocupacoes = {};         // dados ricos por país ocupado (upkeep/insurgência/anexação)
  estado.emGuerra = [];          // isos com conflito ativo (o mapa pulsa)
  // ── AGRESSÃO GUIADA POR DIPLOMACIA + MOBILIZAÇÃO DETECTÁVEL ──────────
  // O mundo só te ataca se VOCÊ provocar (ataques recentes / clima de guerra alto). Um
  // ataque não é instantâneo: vira uma MOBILIZAÇÃO com contagem que a sua inteligência
  // pode flagrar antes (intel alta = aviso; intel baixa = surpresa).
  estado.minhasOfensivas = [];   // [{turno, alvo}] — ataques que EU disparei (janela de 6 turnos)
  estado.turnosDeCalmaria = 10;  // começa em PAZ: sem provocação, o mundo te deixa quieto
  estado.mobilizacoes = [];      // ataques se montando [{iso, nome, forca, restante, total, detectado}]
  estado.operacoes = [];         // MINHAS ofensivas em preparo (espelho: guerra leva tempo e o alvo detecta)
  estado.crescimentoRival = 1;   // o mundo rearma com o tempo
  estado.bases = [];             // projeção de poder: instalações no exterior
  estado.zonasRadioativas = [];  // territórios apagados por ogiva (cicatriz permanente)

  // ── REGRA DE PARTIDA: O MUNDO SEM A BOMBA ───────────────────────────
  // Ligada ao criar a sala, esta flag apaga a arma nuclear do jogo INTEIRO — não
  // só do seu inventário. Precisa morar no estado (e não numa constante de módulo)
  // por dois motivos: entra no save junto com tudo, e viaja no snapshot do host pro
  // convidado no online. Quem lê isto NUNCA lê `estado.ogivas` pra decidir: a ficha
  // dos NPCs é estática e não sabe nada da sua partida — a fonte única é
  // partidaSemNucleares() em jogo/nuclear.js.
  estado.semNucleares = !!opcoes.semNucleares;
  if (estado.semNucleares) estado.ogivas = 0;   // ninguém começa armado, nem você

  // ── QUEM SAIU DO MAPA ───────────────────────────────────────────────
  // `nacoesMortas` é a lista de países apagados por ogiva — a UI consulta pra parar
  // de oferecer diplomacia, guerra e comércio a um cemitério. `nacaoMorta` é o caso
  // que dói: VOCÊ foi apagado. É o registro (não a tela) de que esta partida acabou
  // pra você; quem desenha a derrota e a volta ao jogo é a UI. Ver jogo/nuclear.js.
  estado.nacoesMortas = [];
  estado.nacaoMorta = null;

  // ── TERRITÓRIO EM NÍVEL DE ESTADO ───────────────────────────────────
  // Onde as tropas ESTÃO, não só quantas são. Guarnição por estado (chave = id do
  // território, ex.: 'BRA-RJ') e o dono de cada estado que mudou de mão. Só a
  // EXCEÇÃO entra em donoEstado: quem não está aqui pertence ao país do prefixo,
  // senão gravaríamos 892 estados no save à toa. Ver jogo/territorio.js.
  estado.guarnicoes = {};
  estado.donoEstado = {};

  // ── PETRÓLEO ────────────────────────────────────────────────────────
  // A produção é RECALCULADA todo turno a partir das empresas + territórios
  // ocupados (ver sincronizarPetroleo). O consumo é a fome estrutural do país:
  // não muda sozinho, e é o que te obriga a olhar pro mapa com fome.
  const iso = ficha.iso || 'USA';
  const p = PETROLEO[iso];
  estado.iso = iso;
  estado.petroleo_producao = p?.producao || 0;
  estado.petroleo_consumo = p?.consumo || 0;
  estado.petroleo_custo = p?.custo || 30;
  estado.preco_petroleo = PRECO_BASE;
  estado.petroleo_espolio = [];
  estado.estreitos_bloqueados = [];
  return estado;
}

function padrao(k) {
  if (k === 'territorio') return 1;
  if (VARS[k].min < 0) return 0; // eixos políticos começam no centro
  return 0;
}

// Rótulos amigáveis vêm do próprio registro.
export { VARS as REGISTRO } from './vars.js';
