// ═══════════════════════════════════════════════════════════════════════
// CLIENTE DO LOBBY — a conexão viva com a sala e os outros jogadores
// ═══════════════════════════════════════════════════════════════════════
// A ponta cliente do server/lobby.js. Modelo em docs/ONLINE.md. Se não houver
// servidor, a conexão falha em silêncio e o jogo segue offline — nada quebra.
//
// Uso: const net = conectarLobby({ onSala, onEvento, onErro, onConexao });
//   net.criar({ pais, aberta, max })   → cria sala (você vira host)
//   net.entrar(codigo)                 → entra numa sala
//   net.listar()                       → pede a lista de salas abertas (chega em onSalas)
//   net.escolherPais(iso)              → trava seu país na sala
//   net.evento(tipo, alvo, texto, dados) → age sobre outro jogador (relay)
//   net.sair()                          → sai da sala
//   net.estado()                        → { conectado, sala, host, jogadores }
import { BASE } from './api.js';

const URL_WS = (BASE || location.origin).replace(/^http/, 'ws') + '/ws';

// ── RELÓGIO DO SERVIDOR (Etapa 1 do MUNDO ÚNICO) ──────────────────────
// Clientes têm relógios com skew de segundos — uma frota "chega" na tela de um e
// ainda navega na do outro. A cura: medir o offset local↔servidor via ping/pong
// (média das 3 melhores amostras, ponderada pela viagem) e converter TODO timestamp
// de rede pra tempo do SERVIDOR. `agoraServidor()` é o Date.now() oficial da sala.
let _offsetServidor = 0;          // ts_servidor − ts_cliente (ms)
const _amostras = [];
function registrarPong(tc, ts) {
  if (tc == null || ts == null) return;
  const agora = Date.now();
  const viagem = (agora - tc) / 2;                    // metade do round-trip
  const offset = ts + viagem - agora;                 // estimativa deste pong
  _amostras.push({ offset, viagem });
  if (_amostras.length > 8) _amostras.shift();
  // as 3 amostras de MENOR viagem são as mais confiáveis (menos fila na rede)
  const boas = [..._amostras].sort((a, b) => a.viagem - b.viagem).slice(0, 3);
  _offsetServidor = Math.round(boas.reduce((s, x) => s + x.offset, 0) / boas.length);
}
export function agoraServidor() { return Date.now() + _offsetServidor; }
export function offsetServidor() { return _offsetServidor; }

export function conectarLobby({ nome = 'Anônimo', perfilId = null, onSala, onSalas, onEvento, onErro, onConexao } = {}) {
  // Handlers mutáveis: a HOME cria a conexão com os seus callbacks; quando o jogo
  // começa, ele REASSUME a mesma conexão (net.setHandlers) sem reconectar — a sala e
  // a presença continuam de pé na transição da tela.
  const h = { onSala, onSalas, onEvento, onErro, onConexao };
  let ws = null;
  let tentativa = 0;
  let vivo = false;
  let pingTimer = null;
  let entrou = false;          // fila de mensagens antes do socket abrir
  const fila = [];
  const estado = { conectado: false, sala: null, host: false, jogadores: [] };

  function enviar(obj) {
    if (ws?.readyState === 1) ws.send(JSON.stringify(obj));
    else fila.push(obj);
  }

  function abrir() {
    try { ws = new WebSocket(URL_WS); } catch { return agendarReconexao(); }

    ws.onopen = () => {
      vivo = true; tentativa = 0; estado.conectado = true;
      h.onConexao?.(true);
      ws.send(JSON.stringify({ t: 'ola', perfilId, nome }));
      while (fila.length) ws.send(JSON.stringify(fila.shift()));
      clearInterval(pingTimer);
      pingTimer = setInterval(() => { if (ws?.readyState === 1) ws.send(JSON.stringify({ t: 'ping', tc: Date.now() })); }, 25000);
      // rajada inicial de 3 pings pra calibrar o relógio da sala logo na entrada
      for (const atraso of [200, 900, 2200]) {
        setTimeout(() => { if (ws?.readyState === 1) ws.send(JSON.stringify({ t: 'ping', tc: Date.now() })); }, atraso);
      }
    };

    ws.onmessage = (ev) => {
      let msg; try { msg = JSON.parse(ev.data); } catch { return; }
      switch (msg.t) {
        case 'bemvindo': estado.id = msg.id; break;
        case 'pong': registrarPong(msg.tc, msg.ts); break;
        // O retrato do mundo da sala (mês/Brent/NPCs) — guardado pra o jogo adotar no boot.
        case 'mundo_atual': estado.mundoAtual = msg.dados || null; h.onMundoAtual?.(msg.dados); break;
        case 'entrou':
          estado.sala = msg.codigo; estado.host = !!msg.host; entrou = true;
          break;
        case 'sala':
          estado.sala = msg.codigo; estado.host = msg.host === estado.id; estado.jogadores = msg.jogadores || [];
          estado.max = msg.max; estado.aberta = msg.aberta;
          h.onSala?.(msg);
          break;
        case 'salas': h.onSalas?.(msg.salas || []); break;
        case 'evento': h.onEvento?.(msg); break;
        // canal 1:1 (telefonia/DM): entregue SÓ a você — não passa pelo feed público
        case 'direto': h.onDireto?.(msg); break;
        case 'direto_falhou': h.onDiretoFalhou?.(msg); break;
        case 'erro': h.onErro?.(msg.motivo || "Erro na sala."); break;
        default: break;
      }
    };

    ws.onclose = () => { vivo = false; estado.conectado = false; h.onConexao?.(false); clearInterval(pingTimer); agendarReconexao(); };
    ws.onerror = () => { try { ws.close(); } catch { /* já fechando */ } };
  }

  function agendarReconexao() {
    if (tentativa > 6) return;
    const espera = Math.min(30000, 1000 * 2 ** tentativa);
    tentativa += 1;
    setTimeout(abrir, espera);
  }

  abrir();

  return {
    criar: ({ pais, aberta = true, max = 8 } = {}) => enviar({ t: 'criar', pais, aberta, max }),
    entrar: (codigo) => enviar({ t: 'entrar', codigo }),
    listar: () => enviar({ t: 'listar' }),
    escolherPais: (iso) => enviar({ t: 'pais', pais: iso }),
    evento: (tipo, alvo, texto, dados) => enviar({ t: 'evento', tipo, alvo, texto, dados }),
    // mensagem dirigida a UM país (sinalização de chamada, DM) — só o alvo recebe
    direto: (tipo, alvoPais, dados) => enviar({ t: 'direto', tipo, alvo: alvoPais, dados }),
    sair: () => { enviar({ t: 'sair' }); estado.sala = null; estado.host = false; estado.jogadores = []; },
    estado: () => ({ ...estado }),
    online: () => vivo,
    // O jogo reassume os callbacks da home sem reconectar (a sala continua de pé).
    setHandlers: (novos) => { Object.assign(h, novos); },
    fechar: () => { try { ws?.close(); } catch { /* nada */ } clearInterval(pingTimer); },
  };
}
