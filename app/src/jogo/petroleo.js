// ═══════════════════════════════════════════════════════════════════════
// O MERCADO DE PETRÓLEO — o preço é político
// ═══════════════════════════════════════════════════════════════════════
// O preço do barril não é um número aleatório: é o termômetro do medo do mundo.
// Bombardeou um petroestado? O preço salta. Ocupou a Venezuela? O mercado precifica
// 303 bilhões de barris mudando de dono. A OPEP corta? Você paga.
//
// Isso fecha o turno do jogo:
//   você invade → o preço sobe → se você importa, o próprio ataque te empobrece.
// Guerra por petróleo tem um custo embutido que a maioria dos jogos esquece.
import { PRECO_BASE, PETROLEO, ehPetroestado, ESTREITOS } from '../dados/petroleo.js';
import { EMPRESAS_POR_PAIS } from '../dados/empresas.js';
import { rand } from './rng.js';
import { PAISES } from '../dados/paises.js';
import { paisesAnexados } from './territorio.js';

// Produção ORIGINAL de uma empresa (do catálogo, imutável). Serve de régua pra
// medir o quanto ela cresceu por investimento — o objeto em jogo é uma cópia mutável.
function basePetroleoDaEmpresa(iso, id) {
  return (EMPRESAS_POR_PAIS[iso] || []).find((e) => e.id === id)?.petroleo || 0;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// ── SINCRONIZA A PRODUÇÃO ──────────────────────────────────────────────
// ERRO QUE QUASE PASSOU: a primeira versão calculava a produção nacional como
// "o que as empresas bombeiam × a SUA FATIA nelas". Os EUA saíam com 1,5 Mb/d
// em vez de 13,2 — porque o Estado só tem 8% da Exxon.
//
// Isso é confundir duas coisas diferentes: o país produz 13,2 Mb/d
// independentemente de quem é o dono das empresas. A fatia decide quanto do
// LUCRO cai no Tesouro (isso é lucroDoTurno), não quantos barris saem do chão.
//
// O modelo certo:
//   produção nacional = base real do país
//                     × fator de investimento (aportar numa petroleira abre poço)
//                     + espólio dos territórios ocupados
export function sincronizarPetroleo(estado, empresas) {
  const iso = estado.iso || 'USA';
  const base = PETROLEO[iso]?.producao || 0;

  // Fator de investimento: quanto as petroleiras cresceram desde o início.
  // e.petroleo sobe 12% a cada aporte (ver ui/empresas.js) — a razão entre o
  // total de hoje e o total original vira o multiplicador da produção nacional.
  let atual = 0; let original = 0;
  for (const e of empresas || []) {
    if (!e.petroleo) continue;
    atual += e.petroleo;
    original += basePetroleoDaEmpresa(iso, e.id) || e.petroleo;
  }
  const fator = original > 0 ? atual / original : 1;

  // FATOR DE TECNOLOGIA (tec_petroleo, ver vars.js): fraturamento, recuperação
  // terciária, sísmica 4D e digitalização de campo arrancam mais barril do MESMO
  // poço — não abrem poço novo (isso é o `fator` de investimento acima). Escala
  // de 1x a 1.45x (tec 100 = +45% na produção): perceptível — quase metade a mais
  // de barril num campo maduro é o que operações reais de EOR entregam — mas sem
  // deixar um país médio virar Arábia Saudita só de ciência.
  const fatorTec = 1 + (estado.tec_petroleo || 0) / 100 * 0.45;
  let producao = base * fator * fatorTec;

  // O saque dos territórios ocupados: você não fica com tudo — a insurgência
  // sabota dutos e o campo não bombeia sob fogo. Quanto mais revolta, menos petróleo.
  const espolio = [];
  // ANEXADO BOMBEIA 100%: sem insurgência sabotando duto, o campo é seu de verdade —
  // e SUA tecnologia de extração vale lá também (é território seu, poço seu).
  // `paisesAnexados` (e não um filtro cru por `.anexado`): `ocupacoes` acumula as
  // anexações de TODA a sala, então ler o flag direto fazia o petróleo de uma província
  // conquistada por OUTRO jogador entrar na minha produção nacional.
  for (const iso of paisesAnexados(estado)) {
    const p = PETROLEO[iso];
    if (!p) continue;
    const extraido = round1(p.producao * fatorTec);
    producao += extraido;
    espolio.push({ iso, nome: PAISES[iso]?.nome || iso, bruto: p.producao, extraido, eficiencia: 100, anexado: true });
  }
  // OCUPADO NÃO GANHA o bônus de tecnologia: o limite ali é a insurgência sabotando
  // duto, não o quanto sua ciência sabe extrair — sua equipe técnica nem opera em
  // segurança um campo em revolta. A tecnologia é sua; o poço ainda não é de verdade.
  for (const c of estado.conquistados || []) {
    const p = PETROLEO[c.iso];
    if (!p) continue;
    const eficiencia = clamp(1 - (c.insurgencia || 0) / 110, 0.15, 1);
    const extraido = round1(p.producao * eficiencia);
    producao += extraido;
    espolio.push({ iso: c.iso, nome: c.nome, bruto: p.producao, extraido, eficiencia: Math.round(eficiencia * 100) });
  }

  estado.petroleo_producao = round1(producao);
  estado.petroleo_espolio = espolio;
  return { producao: estado.petroleo_producao, espolio };
}

// Reservas totais sob seu controle (as suas + as dos territórios ocupados).
export function reservasControladas(estado) {
  const iso = estado.iso || 'USA';
  let t = PETROLEO[iso]?.reservas || 0;
  const de = [];
  for (const c of estado.conquistados || []) {
    const p = PETROLEO[c.iso];
    if (!p) continue;
    t += p.reservas;
    de.push({ nome: c.nome, reservas: p.reservas });
  }
  return { total: Math.round(t), conquistadas: de };
}

// ── O PREÇO SE MOVE ────────────────────────────────────────────────────
// Retorna { preco, delta, motivos[] } — a UI mostra POR QUE o preço mexeu.
export function tickPreco(estado) {
  const antes = estado.preco_petroleo || PRECO_BASE;
  const motivos = [];
  let alvo = PRECO_BASE;

  // 1) Guerra no mundo aquece o barril. Guerra num PETROESTADO incendeia.
  const guerras = estado.emGuerra || [];
  const petroGuerra = guerras.filter(ehPetroestado);
  if (petroGuerra.length) {
    const salto = petroGuerra.length * 34;
    alvo += salto;
    motivos.push({ tom: 'ruim', txt: `Conflito ativo em ${petroGuerra.length} produtor(es) de peso: prêmio de risco de +US$ ${salto}/barril.` });
  } else if (guerras.length) {
    alvo += guerras.length * 6;
    motivos.push({ tom: 'aviso', txt: 'Conflitos abertos mantêm o mercado nervoso.' });
  }

  // 2) A temperatura de guerra global é medo puro precificado
  const medo = Math.max(0, (estado.temp_guerra || 0) - 45);
  if (medo > 0) {
    alvo += medo * 0.7;
    motivos.push({ tom: 'aviso', txt: `Tensão global em ${estado.temp_guerra}: traders precificam o pior.` });
  }

  // 3) Ocupar um petroestado inunda o mercado — você bombeia o que é dele
  const ocupadosPetro = (estado.conquistados || []).filter((c) => ehPetroestado(c.iso));
  if (ocupadosPetro.length) {
    alvo -= ocupadosPetro.length * 12;
    motivos.push({ tom: 'bom', txt: `${ocupadosPetro.map((c) => c.nome).join(', ')} sob seu controle: oferta extra pressiona o preço pra baixo.` });
  }

  // 4) Estreito bloqueado = pânico imediato (setado por ação/evento)
  for (const id of estado.estreitos_bloqueados || []) {
    const e = ESTREITOS[id];
    if (!e) continue;
    alvo += e.fluxo * 4;
    motivos.push({ tom: 'ruim', txt: `${e.nome} interditado: ${e.fluxo} Mb/d fora do mercado.` });
  }

  // 5) Economia fria derruba a demanda
  if ((estado.temp_economia || 50) <= 35) {
    alvo -= 14;
    motivos.push({ tom: 'aviso', txt: 'Desaceleração econômica corta a demanda por combustível.' });
  }

  // 6) Ruído de mercado — o barril nunca fica parado
  alvo += (rand() * 10 - 5);

  // O preço não teleporta: converge ~35% ao alvo por turno (mercado tem inércia)
  const novo = clamp(round2(antes + (alvo - antes) * 0.35), 18, 240);
  estado.preco_petroleo = novo;
  const delta = round2(novo - antes);

  if (!motivos.length) {
    motivos.push({ tom: 'neutro', txt: 'Sem choque de oferta. O barril oscila no ruído de sempre.' });
  }
  return { preco: novo, antes, delta, motivos };
}

// Manchete pro feed — o petróleo precisa aparecer no jornal, não só na planilha.
export function manchetePreco(r, fluxo) {
  const dir = r.delta > 0 ? 'sobe' : r.delta < 0 ? 'cai' : 'estável';
  const sinal = r.delta > 0 ? `+${r.delta}` : `${r.delta}`;
  const base = `Brent ${dir} para US$ ${r.preco.toFixed(2)} (${sinal}).`;
  if (Math.abs(r.delta) < 2) return { tom: 'neutro', texto: `${base} ${r.motivos[0].txt}` };
  if (r.delta > 0 && !fluxo.autossuficiente) {
    return { tom: 'ruim', texto: `${base} ${r.motivos[0].txt} Com ${fluxo.dependencia}% do nosso consumo vindo de fora, cada dólar no barril sai do nosso bolso.` };
  }
  if (r.delta > 0 && fluxo.autossuficiente) {
    return { tom: 'bom', texto: `${base} ${r.motivos[0].txt} Somos exportadores líquidos — o pânico alheio é a nossa receita.` };
  }
  return { tom: fluxo.autossuficiente ? 'aviso' : 'bom', texto: `${base} ${r.motivos[0].txt}` };
}
