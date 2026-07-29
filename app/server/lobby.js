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

// ESTADO AUTORITATIVO POR SALA (#8): o relay é efêmero — quem não estava conectado quando
// a bomba caiu nunca via o estrago. Aqui o servidor ACUMULA os fatos inter-jogador que são
// DURÁVEIS (quem tomou qual território, quais frotas estão no mar) e reenvia a quem (re)entra.
// Não é simulação: é a memória do que os humanos fizeram uns aos outros.
function acumularMundoSala(sala, ev) {
  const ms = sala.mundoSala || (sala.mundoSala = { donoEstado: {}, conflitos: {}, frotas: {}, anexacoes: {}, mortas: {} });
  if (!ms.anexacoes) ms.anexacoes = {};   // salas criadas antes deste campo existir
  const atacante = ev.dePais;
  const d = ev.dados || {};
  if (!atacante) return;
  // ANEXAÇÃO É O FATO MAIS DURÁVEL QUE EXISTE AQUI — um país deixou de existir. E era
  // justamente o que NÃO estava sendo guardado: quem entrava depois (ou renascia na
  // sala com outra nação, ver #11) recebia territórios e frotas, mas via a província
  // anexada como uma nação soberana no mapa. Guardamos o par país→anexador; a
  // devolução de soberania apaga o registro, que é a operação inversa exata.
  if (ev.tipo === 'anexacao' && d.iso) { ms.anexacoes[d.iso] = { por: atacante, nome: d.nome || d.iso }; return; }
  if (ev.tipo === 'devolucao' && d.iso) { delete ms.anexacoes[d.iso]; return; }
  // ── NAÇÃO APAGADA POR OGIVA — o fato mais irreversível de todos ────
  // BUG QUE ISTO CONSERTA (relato do dono): "os EUA haviam sido atacados por uma bomba
  // nuclear e o país tá vivo para quem retornou com outro país". Estava certo. A
  // anexação era guardada aqui desde o #8, mas a ZONA MORTA nunca foi — então quem
  // renascia na sala (#11) ou entrava depois recebia um mundo onde a ogiva nunca caiu:
  // território, frotas e anexações chegavam, e os EUA apareciam soberanos e intactos,
  // com governo, exército e diplomacia disponíveis. Duas salas dentro da mesma sala.
  //
  // Não tem operação inversa: `devolucao` desfaz uma anexação porque devolver soberania
  // é uma jogada real. Ninguém desirradia um país.
  if (!ms.mortas) ms.mortas = {};                 // salas criadas antes deste campo existir
  if ((ev.tipo === 'nuclear_impacto' || ev.tipo === 'nuclear') && d.iso && d.zonaMorta) {
    ms.mortas[d.iso] = { por: d.porIso || atacante, porNome: d.porNome || ev.deNome || null };
    return;
  }
  if (ev.tipo === 'guerra_resultado') {
    for (const id of (d.caem || [])) { ms.donoEstado[id] = atacante; ms.conflitos[id] = { por: atacante, intensidade: 45 }; }
  } else if (ev.tipo === 'ataque_estado' && d.estadoId) {
    if (d.tomou) ms.donoEstado[d.estadoId] = atacante;
    ms.conflitos[d.estadoId] = { por: atacante, intensidade: d.tomou ? 45 : 30 };
  } else if (ev.tipo === 'frota_pos' && d.id != null) {
    ms.frotas[`${atacante}_${d.id}`] = { dePais: atacante, deNome: ev.deNome, dados: d };
  } else if (ev.tipo === 'frota_out') {
    for (const k of Object.keys(ms.frotas)) if (k.startsWith(`${atacante}_`)) delete ms.frotas[k];
  } else if (ev.tipo === 'naval_resultado' && d.venceu && ev.alvo) {
    // frota afundada some da memória da sala também
    for (const k of Object.keys(ms.frotas)) if (k.startsWith(`${ev.alvo}_`)) delete ms.frotas[k];
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
          // MUNDO ÚNICO: quem chega tarde recebe o RETRATO ATUAL do mundo da sala
          // (mês, Brent, guerras NPC…) — nasce em outubro/2028 se a sala está lá,
          // não em janeiro/2026. O retrato é a última batida que o host transmitiu.
          if (sala.mundoAtual) enviar(ws, { t: 'mundo_atual', dados: sala.mundoAtual });
          // MEMÓRIA DA SALA: o recém-chegado recebe o que os humanos já fizeram entre si
          // (territórios tomados, conflitos, frotas no mar) — a explosão que rolou antes
          // dele entrar agora APARECE pra ele. É a cura do "pra ele não tá explodido".
          if (sala.mundoSala) enviar(ws, { t: 'estado_sala', dados: sala.mundoSala });
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
          // A BATIDA do host é cacheada: é o que o servidor entrega ao próximo que entrar.
          if (msg.tipo === 'beat' && c.id === sala.hostId && msg.dados) sala.mundoAtual = msg.dados;
          const evt = {
            t: 'evento', de: c.id, deNome: c.nome, dePais: c.pais,
            tipo: nada(msg.tipo, 30) || 'msg',
            alvo: msg.alvo ? nada(msg.alvo, 3).toUpperCase() : null,
            texto: nada(msg.texto, 500),
            dados: msg.dados || null,
            ts: Date.now(),
          };
          // PERSISTÊNCIA: fatos inter-jogador duráveis vão pra memória da sala (#8).
          acumularMundoSala(sala, evt);
          difundirEvento(sala, evt, ws);
          break;
        }

        // MENSAGEM DIRETA a UM jogador (pelo país dele): é o canal da TELEFONIA e dos
        // DMs — sinalização WebRTC (offer/answer/ICE), convite/recusa de chamada e chat
        // privado. Diferente de 'evento', NÃO é difundido: só o alvo recebe. `dados`
        // passa íntegro (SDP tem quilobytes; truncar quebraria a chamada).
        case 'direto': {
          const sala = salas.get(c.sala);
          if (!sala) break;
          const alvoPais = nada(msg.alvo, 3).toUpperCase();
          const alvoWs = [...sala.jogadores].find((w) => clientes.get(w)?.pais === alvoPais);
          if (!alvoWs) { enviar(ws, { t: 'direto_falhou', alvo: alvoPais, motivo: 'offline' }); break; }
          enviar(alvoWs, {
            t: 'direto', de: c.id, deNome: c.nome, dePais: c.pais,
            tipo: nada(msg.tipo, 30) || 'dm',
            dados: msg.dados ?? null,
            ts: Date.now(),
          });
          break;
        }

        case 'sair':
          sairDaSala(ws);
          break;

        case 'ping':
          c.vivo = true;
          // RELÓGIO DO MUNDO ÚNICO: devolve o tCliente (pro cliente medir a viagem)
          // e o tServidor (a hora oficial). O cliente calcula o offset e TODO timestamp
          // que viaja na rede (frotas, eventos) passa a ser tempo do SERVIDOR.
          enviar(ws, { t: 'pong', tc: msg.tc ?? null, ts: Date.now() });
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
