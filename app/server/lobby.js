// ═══════════════════════════════════════════════════════════════════════
// LOBBY WEBSOCKET — salas hospedadas + relay de interações
// ═══════════════════════════════════════════════════════════════════════
// O modelo está em docs/ONLINE.md. Resumo: MUNDO COMPARTILHADO, TURNOS ASSÍNCRONOS,
// INTERAÇÕES EM TEMPO REAL. Este servidor é um RELAY (não autoritativo): garante
// presença, salas e entrega de eventos — a ansiedade de "outro humano acabou de te
// atacar AGORA" vem daqui. A regra de jogo roda no cliente (por ora).
//
// O que mudou em relação ao esqueleto anterior:
//   • SALAS HOSPEDADAS: um jogador cria (vira host, recebe código), outros entram por
//     código ou pela lista de salas abertas.
//   • PAÍS TRAVADO: um país por sala. O servidor recusa quem tentar pegar um já ocupado.
//   • EVENTOS RICOS: guerra/aliança/comércio/sanção/espionagem/ajuda/nuclear/ataque_estado
//     e RESPOSTA (aceite de proposta). O servidor carimba o remetente e entrega ao alvo
//     (ou a todos, pro feed).
//
// Protocolo completo em docs/ONLINE.md.
import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';

// ws → { id, perfilId, nome, pais, sala, vivo }
const clientes = new Map();
// codigo → { codigo, hostId, aberta, max, criada, jogadores:Set<ws> }
const salas = new Map();

const nada = (s, n) => String(s || '').slice(0, n);

function enviar(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

// Código curto e legível: SOBER-4821. Colisão é improvável no volume de uma aula, mas
// checamos mesmo assim.
function novoCodigo() {
  let c;
  do { c = `SOBER-${Math.floor(1000 + Math.random() * 9000)}`; } while (salas.has(c));
  return c;
}

function jogadoresDe(sala) {
  return [...sala.jogadores]
    .map((ws) => clientes.get(ws))
    .filter(Boolean)
    .map((c) => ({ id: c.id, nome: c.nome, pais: c.pais, host: c.id === sala.hostId }));
}

// Resumo público de uma sala (pra lista de partidas abertas).
function resumoSala(sala) {
  return {
    codigo: sala.codigo,
    aberta: sala.aberta,
    max: sala.max,
    jogadores: sala.jogadores.size,
    paises: jogadoresDe(sala).map((j) => j.pais).filter(Boolean),
    host: clientes.get([...sala.jogadores].find((ws) => clientes.get(ws)?.id === sala.hostId))?.nome || '—',
  };
}

function salasAbertas() {
  return [...salas.values()].filter((s) => s.aberta && s.jogadores.size < s.max).map(resumoSala);
}

// Anuncia o estado atual da sala a todos os seus membros.
function difundirSala(sala) {
  const payload = { t: 'sala', codigo: sala.codigo, host: sala.hostId, max: sala.max, aberta: sala.aberta, jogadores: jogadoresDe(sala) };
  for (const ws of sala.jogadores) enviar(ws, payload);
}

// Relay de evento a todos da sala (menos o remetente por padrão). Alvo opcional: se o
// evento é dirigido a um país específico, ainda mandamos a todos (o feed é público),
// mas marcamos `paraVoce` pro cliente do alvo saber que a bomba é com ele.
function difundirEvento(sala, obj, exceto) {
  for (const ws of sala.jogadores) {
    if (ws === exceto) continue;
    const c = clientes.get(ws);
    enviar(ws, { ...obj, paraVoce: !!(obj.alvo && c?.pais && c.pais === obj.alvo) });
  }
}

function sairDaSala(ws) {
  const c = clientes.get(ws);
  if (!c?.sala) return;
  const sala = salas.get(c.sala);
  c.sala = null;
  if (!sala) return;
  sala.jogadores.delete(ws);
  if (sala.jogadores.size === 0) { salas.delete(sala.codigo); return; }
  // host saiu? passa o bastão pro próximo.
  if (sala.hostId === c.id) sala.hostId = clientes.get([...sala.jogadores][0])?.id || sala.hostId;
  difundirSala(sala);
}

export function montarLobby(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const cliente = { id: randomUUID().slice(0, 8), perfilId: null, nome: 'Anônimo', pais: null, sala: null, vivo: true };
    clientes.set(ws, cliente);
    enviar(ws, { t: 'bemvindo', id: cliente.id });

    ws.on('message', (raw) => {
      let msg; try { msg = JSON.parse(raw); } catch { return; }
      const c = clientes.get(ws);
      if (!c) return;

      switch (msg.t) {
        case 'ola':
          c.perfilId = nada(msg.perfilId, 64) || null;
          c.nome = nada(msg.nome, 40) || 'Anônimo';
          break;

        case 'criar': {
          sairDaSala(ws);
          const sala = {
            codigo: novoCodigo(), hostId: c.id,
            aberta: msg.aberta !== false, max: Math.max(2, Math.min(20, Number(msg.max) || 8)),
            criada: Date.now(), jogadores: new Set([ws]),
          };
          salas.set(sala.codigo, sala);
          c.sala = sala.codigo;
          c.pais = nada(msg.pais, 3).toUpperCase() || null;
          enviar(ws, { t: 'entrou', codigo: sala.codigo, host: true });
          difundirSala(sala);
          break;
        }

        case 'entrar': {
          const sala = salas.get(nada(msg.codigo, 20).toUpperCase());
          if (!sala) { enviar(ws, { t: 'erro', motivo: 'Sala não encontrada.' }); break; }
          if (sala.jogadores.size >= sala.max) { enviar(ws, { t: 'erro', motivo: 'Sala cheia.' }); break; }
          sairDaSala(ws);
          sala.jogadores.add(ws);
          c.sala = sala.codigo;
          enviar(ws, { t: 'entrou', codigo: sala.codigo, host: c.id === sala.hostId });
          difundirSala(sala);
          break;
        }

        case 'listar':
          enviar(ws, { t: 'salas', salas: salasAbertas() });
          break;

        case 'pais': {
          const sala = salas.get(c.sala);
          if (!sala) break;
          const pais = nada(msg.pais, 3).toUpperCase();
          // um país por sala: recusa se outro jogador já o tomou
          const ocupado = jogadoresDe(sala).some((j) => j.pais === pais && j.id !== c.id);
          if (ocupado) { enviar(ws, { t: 'erro', motivo: `${pais} já foi escolhido nesta partida.` }); break; }
          c.pais = pais || null;
          difundirSala(sala);
          break;
        }

        case 'evento': {
          const sala = salas.get(c.sala);
          if (!sala) break;
          difundirEvento(sala, {
            t: 'evento', de: c.id, deNome: c.nome, dePais: c.pais,
            tipo: nada(msg.tipo, 30) || 'msg',
            alvo: msg.alvo ? nada(msg.alvo, 3).toUpperCase() : null,
            texto: nada(msg.texto, 500),
            dados: msg.dados || null,
            ts: Date.now(),
          }, ws);
          break;
        }

        case 'sair':
          sairDaSala(ws);
          break;

        case 'ping':
          c.vivo = true;
          enviar(ws, { t: 'pong' });
          break;

        default: break;
      }
    });

    ws.on('close', () => { sairDaSala(ws); clientes.delete(ws); });
    ws.on('error', () => { sairDaSala(ws); clientes.delete(ws); });
    ws.on('pong', () => { const c = clientes.get(ws); if (c) c.vivo = true; });
  });

  // Heartbeat: derruba conexões mortas (aba fechada sem close limpo).
  const bat = setInterval(() => {
    for (const [ws, c] of clientes) {
      if (!c.vivo) { try { ws.terminate(); } catch { /* já morto */ } sairDaSala(ws); clientes.delete(ws); continue; }
      c.vivo = false;
      try { ws.ping(); } catch { /* já morto */ }
    }
  }, 30000);
  wss.on('close', () => clearInterval(bat));

  return {
    online: () => clientes.size,
    salas: () => salasAbertas(),
  };
}
