// O MUNDO SE MOVE. A cada fechamento de turno o planeta age sozinho: a insurgência
// ferve nos territórios ocupados, os rivais rearmam, e as relações derivam conforme
// a sua postura (belicosa afasta, soft power aproxima).
import { meusConquistados, guarnicao, forcaGuarnicao, estadoPorId } from './territorio.js';
import { PAISES } from '../dados/paises.js';
import { upkeepDe, garantirOcupacao } from './manutencao.js';
import { rand } from './rng.js';

const sorteioDe = (arr) => arr[Math.floor(rand() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nomePais = (iso) => PAISES[iso]?.nome || iso;

// ── RECONQUISTA: a máquina joga como um adversário ────────────────────
// O pedido do dono: território tomado NÃO é troféu permanente. Se você conquista
// estados e não deixa guarnição, a milícia/o dono original se reorganiza e vem
// retomar — a Máquina agindo como um outro jogador. Isso cria a MANUTENÇÃO: pra
// ficar no topo você tem que segurar o que tomou, não só tomar.
//
// Modelo (mora no save): estado.conflitosEstado = { 'BRA-RJ': { por, intensidade, turnos } }.
// A guarnição é a variável de controle: forte, sufoca a revolta; fraca ou zero, a
// pressão sobe até o território cair de volta ao dono natural.
const LIMIAR_SEGURA = 2.0;     // força de guarnição que sossega a região

export function tickReconquista(estado) {
  const eventos = [];
  estado.conflitosEstado = estado.conflitosEstado || {};
  estado.donoEstado = estado.donoEstado || {};

  for (const e of meusConquistados(estado)) {
    e.nome = e.nome || e.id;   // catálogo pode não ter sido carregado ainda (pós-reload)
    const forca = forcaGuarnicao(guarnicao(estado, e.id));
    const natural = estadoPorId(e.id)?.pais || e.id.split('-')[0];
    const conf = estado.conflitosEstado[e.id];

    // Guarnição forte: segura. Se havia revolta, ela recua e some.
    if (forca >= LIMIAR_SEGURA) {
      if (conf) {
        conf.intensidade -= 25 + Math.round(rand() * 18);
        if (conf.intensidade <= 0) {
          delete estado.conflitosEstado[e.id];
          eventos.push({ tom: 'bom', texto: `Sua guarnição sufocou a revolta em ${e.nome}. O território está firme.` });
        }
      }
      continue;
    }

    // Guarnição fraca/zero: a milícia avança.
    if (!conf) {
      const chance = forca <= 0 ? 0.6 : 0.35;
      if (rand() < chance) {
        estado.conflitosEstado[e.id] = { por: natural, intensidade: 22 + Math.round(rand() * 20), turnos: 1 };
        eventos.push({
          tom: 'aviso', novoConflito: true, estadoId: e.id, estadoNome: e.nome, por: natural, porNome: nomePais(natural),
          texto: `⚔ ${nomePais(natural)} tenta retomar ${e.nome}. Sem reforço, o território vai cair.`,
        });
      }
    } else {
      conf.turnos = (conf.turnos || 0) + 1;
      conf.intensidade += (forca <= 0 ? 22 : 12) + Math.round(rand() * 12);
      if (conf.intensidade >= 100) {
        if (natural === e.id.split('-')[0]) delete estado.donoEstado[e.id];  // volta a ser implícito do dono
        else estado.donoEstado[e.id] = natural;
        delete estado.conflitosEstado[e.id];
        if (estado.guarnicoes) delete estado.guarnicoes[e.id];
        estado.territorio = Math.max(1, (estado.territorio || 1) - 0.15);
        eventos.push({
          tom: 'ruim', perdaEstado: true, estadoId: e.id, estadoNome: e.nome, por: natural, porNome: nomePais(natural),
          texto: `Perdemos ${e.nome} — sem guarnição, ${nomePais(natural)} retomou o território.`,
        });
      } else {
        eventos.push({
          tom: 'aviso', estadoId: e.id, estadoNome: e.nome, por: natural,
          texto: `${e.nome} sob pressão: reconquista em ${Math.round(conf.intensidade)}%. Reforce ou perca.`,
        });
      }
    }
  }
  return eventos;
}

export function tickMundo(estado) {
  const eventos = [];

  // 1) Insurgência nos territórios ocupados — SEMPRE reporta
  for (const c of estado.conquistados || []) {
    c.desde = (c.desde || 0) + 1;
    const oc = garantirOcupacao(estado, c.iso);
    // COBRA O UPKEEP: pagar em dia amortece a insurgência; sem caixa, ela acelera.
    const uk = upkeepDe(estado, c);
    let pagou = false;
    if ((estado.tesouro || 0) >= uk.total) {
      estado.tesouro = Math.round((estado.tesouro - uk.total) * 100) / 100;
      oc.upkeepPago = Math.round((oc.upkeepPago + uk.total) * 100) / 100;
      oc.turnosSemPagar = 0; pagou = true;
      c.insurgencia = Math.max(0, c.insurgencia - 4);
    } else {
      oc.turnosSemPagar = (oc.turnosSemPagar || 0) + 1;
      eventos.push({ tom: 'ruim', texto: `Sem caixa para manter ${c.nome}: a guarnição não foi paga e a insurgência acelera.` });
    }
    const antes = c.insurgencia;
    c.insurgencia = Math.min(100, c.insurgencia + (pagou ? 4 : 10) + Math.round(rand() * 5));
    // GATILHO DE ANEXAÇÃO: só conta batida estável se pagou E a insurgência está baixa.
    oc.turnosEstavel = (c.insurgencia < 25 && oc.turnosSemPagar === 0) ? (oc.turnosEstavel || 0) + 1 : 0;
    const sobe = c.insurgencia - antes;
    if (c.insurgencia >= 100) {
      eventos.push({ tom: 'ruim', texto: `Perdemos ${c.nome} — a insurgência tomou o controle e expulsou nossas tropas.` });
      estado.territorio = Math.max(1, estado.territorio - 1);
      estado.aprovacao = clamp(estado.aprovacao - 8, 0, 100);
      estado.soft_power = clamp(estado.soft_power - 5, 0, 100);
    } else if (c.insurgencia >= 70) {
      eventos.push({ tom: 'ruim', texto: `${c.nome} ferve: insurgência em ${c.insurgencia}% (+${sobe}). Sem ação, perdemos o território.` });
      estado.estabilidade = clamp(estado.estabilidade - 3, 0, 100);
    } else {
      eventos.push({ tom: 'aviso', texto: `${c.nome} ocupado há ${c.desde} turno(s): insurgência em ${c.insurgencia}% (+${sobe}).` });
    }
  }
  estado.conquistados = (estado.conquistados || []).filter((c) => c.insurgencia < 100);

  // 2) Rivais rearmam com o tempo (o mundo não te espera) — SEMPRE reporta
  const antesRival = estado.crescimentoRival || 1;
  estado.crescimentoRival = round2(antesRival + 0.015 + (estado.temp_guerra > 60 ? 0.015 : 0));
  const pctRival = Math.round((estado.crescimentoRival - 1) * 100);
  eventos.push({
    tom: estado.temp_guerra > 60 ? 'aviso' : 'neutro',
    texto: estado.temp_guerra > 60
      ? `🛰️ Rivais aceleram o rearmamento em resposta à nossa postura belicosa — já estão ${pctRival}% mais fortes que no início.`
      : `🛰️ O mundo rearma em silêncio: rivais ${pctRival}% mais fortes que no início do seu reinado.`,
  });

  // 3) Relações derivam conforme sua postura no mundo — SEMPRE reporta
  const pressao = ((estado.soft_power - 50) / 50) * 1.4 - ((estado.temp_guerra - 40) / 50) * 2.2;
  let mexeu = 0;
  for (const k of Object.keys(estado)) {
    if (!k.startsWith('rel_')) continue;
    const d = Math.round(pressao + (rand() * 1.6 - 0.8));
    if (!d) continue;
    estado[k] = clamp(estado[k] + d, -100, 100);
    mexeu += d;
  }
  if (mexeu <= -3) eventos.push({ tom: 'ruim', texto: `O mundo se afasta de nós (${mexeu} em relações). Chancelarias esfriam, portas se fecham.` });
  else if (mexeu >= 3) eventos.push({ tom: 'bom', texto: `Nossa imagem melhora (+${mexeu} em relações). O mundo volta a atender nossas ligações.` });
  else eventos.push({ tom: 'neutro', texto: '🌍 As chancelarias seguem mornas. Ninguém se aproxima, ninguém se afasta.' });

  // 4) Sopro ocasional de acontecimento global
  if (rand() < 0.45) {
    eventos.push({ tom: 'neutro', texto: sorteioDe([
      '📉 Commodities oscilam: petróleo e grãos sacodem os mercados globais.',
      '🌐 Cúpula internacional redesenha rotas comerciais sem nos consultar.',
      '🛢️ Um estreito estratégico volta a ser ponto de tensão naval.',
      '🦠 Alerta sanitário em circulação: OMS monitora um novo surto regional.',
      '💱 Bancos centrais mexem nos juros e o capital corre pelo planeta.',
      '🛰️ Nova constelação de satélites muda o jogo da vigilância global.',
    ]) });
  }

  return eventos;
}

function round2(n) { return Math.round(n * 100) / 100; }
