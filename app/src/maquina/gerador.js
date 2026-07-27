// CAMADA 2 — O GERADOR.
// Orquestra um turno: escolhe o fio-tema (Camada 1) → chama a IA (contrato) →
// parseia e valida (guarda-corpos) → se falhar, cai no fallback. Sempre entrega
// algo jogável.
import { chamarIA, SemChaveError, IAOfflineError, LimiteError } from './openrouter.js';
import { montarSystem, montarUser, extrairJSON } from './contrato.js';
import { validarCarta } from './validador.js';
import { escolherFioTema } from './fios.js';
import { puxarFallback } from './fallback.js';

// 2 tentativas dobravam o custo da chamada MAIS CARA do jogo quando o JSON
// vinha torto. A reserva local é boa o bastante para valer 1 tentativa.
const MAX_TENTATIVAS = 1;

// Contexto estático montado uma vez por partida (candidato a cache).
export function prepararContexto({ ficha, elenco, veiculos }) {
  return montarSystem({ ficha, elenco, veiculos });
}

function sanearFeed(feed) {
  if (!Array.isArray(feed)) return [];
  return feed.slice(0, 6).map((p) => ({
    tipo: p?.tipo === 'veiculo' ? 'veiculo' : 'cidadao',
    veiculo: p?.veiculo ? String(p.veiculo) : null,
    handle: String(p?.handle || '@anonimo').trim(),
    texto: String(p?.texto || '').trim(),
    tom: String(p?.tom || '').trim(),
    // A manchete da matéria linkada. Sem preservá-la aqui, o campo morria no saneamento
    // e o card de link voltava a exibir o tuíte cortado em 72 caracteres fingindo ser
    // manchete — que era o que a UI fazia por não ter nada melhor.
    manchete: p?.manchete ? String(p.manchete).trim() : null,
  })).filter((p) => p.texto);
}

function sanearFiosUpdate(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 3).map((u) => ({
    id: u?.id ? String(u.id) : null,
    tema: u?.tema ? String(u.tema) : null,
    intensidade: u?.intensidade != null ? Number(u.intensidade) : null,
    alvo_pressao: u?.alvo_pressao ? String(u.alvo_pressao) : null,
    status: u?.status ? String(u.status) : null,
    novo: Boolean(u?.novo),
  }));
}

// Gera o próximo turno.
//   deps: { systemContexto, ficha... } — systemContexto vem de prepararContexto()
//   mundo: { estado, fios, ultimaAcao, turno, ultimoFioId }
// Retorna { carta, feed, fios_update, fioTema, origem, log }.
export async function gerarTurno({ systemContexto, estado, fios, ultimaAcao, turno, ultimoFioId, acoesResumo, destino, banda, rotulo, imprensa, ficha, veiculos, signal }) {
  const fioTema = escolherFioTema(fios, estado, ultimoFioId);
  const log = [];
  // Contexto da reserva: se a IA cair, o fallback ainda sabe QUAL país é este.
  const ctx = { ficha, estado, veiculos: veiculos || imprensa };

  // Tenta a Máquina (IA)
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa += 1) {
    try {
      const user = montarUser({ estado, fios, fioTema, ultimaAcao, turno, acoesResumo, destino, banda, rotulo, imprensa });
      const { texto } = await chamarIA({ system: systemContexto, user, signal });
      const bruto = extrairJSON(texto);
      if (!bruto) { log.push(`tentativa ${tentativa}: JSON não parseável`); continue; }

      const { ok, carta, log: logVal } = validarCarta(bruto.carta || bruto);
      log.push(...logVal);
      if (!ok) { log.push(`tentativa ${tentativa}: carta inválida`); continue; }

      if (!carta.fio && fioTema) carta.fio = fioTema.id;
      return {
        carta,
        feed: sanearFeed(bruto.feed),
        fios_update: sanearFiosUpdate(bruto.fios_update),
        fioTema,
        origem: 'maquina',
        log,
      };
    } catch (err) {
      if (err instanceof SemChaveError) {
        // Sem chave → Modo Demonstração. Esperado, mas não mais mudo: quem abrir o
        // console precisa saber POR QUE está vendo carta de reserva.
        log.push('servidor sem OPENROUTER_API_KEY — Modo Demonstração');
        avisar('demonstracao', log);
        return { ...puxarFallback(fioTema, ctx), fioTema, origem: 'demonstracao', log };
      }
      if (err instanceof LimiteError) {
        // Insistir bate no mesmo muro. Reserva na hora, sem queimar a 2ª tentativa.
        log.push(`limite do servidor: ${err.message}`);
        avisar('limite', log);
        return { ...puxarFallback(fioTema, ctx), fioTema, origem: 'limite', log };
      }
      if (err instanceof IAOfflineError) {
        // O backend não está de pé. A causa nº 1 em dev — e a que mais parecia "a IA
        // é burra", porque falhava exatamente como uma IA ruim: entregando fallback.
        log.push('backend fora do ar — rode `npm run dev:tudo` (Vite + servidor)');
        avisar('offline', log);
        return { ...puxarFallback(fioTema, ctx), fioTema, origem: 'offline', log };
      }
      log.push(`tentativa ${tentativa}: ${err.message}`);
    }
  }

  // A Máquina falhou → biblioteca de reserva
  log.push('caiu no fallback após falhas da IA');
  avisar('fallback', log);
  return { ...puxarFallback(fioTema, ctx), fioTema, origem: 'fallback', log };
}

// Toda queda pra reserva GRITA. O bug que motivou isto: o log existia, era retornado,
// e `motor.js` o descartava — então três camadas de diagnóstico morriam em silêncio e
// o sintoma que sobrava era "a IA não tem contexto". Um console.warn teria economizado
// a investigação inteira.
function avisar(origem, log) {
  const comoResolver = {
    offline: 'O servidor (8787) não respondeu. Em dev: `npm run dev:tudo`.',
    demonstracao: 'O servidor está de pé, mas sem chave. Preencha OPENROUTER_API_KEY no app/.env e reinicie.',
    fallback: 'O servidor respondeu, mas a IA falhou/validou mal. Veja o log abaixo.',
    limite: 'O servidor recusou por rate-limit ou teto diário. Ajuste AI_LIMITE_POR_MINUTO / AI_TETO_DIARIO.',
  }[origem];
  // eslint-disable-next-line no-console
  console.warn(`[SOBERANO] A Máquina NÃO gerou este turno (origem: ${origem}).\n${comoResolver}\n  · ${log.join('\n  · ')}`);
}
