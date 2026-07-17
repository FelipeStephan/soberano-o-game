// ═══════════════════════════════════════════════════════════════════════
// SAVE — persistência local, com a espinha dorsal do multiplayer já pronta
// ═══════════════════════════════════════════════════════════════════════
// O pedido: "uma espécie de login, não perder o save, pois futuramente vamos
// trabalhar com online e quero que esteja preparado já."
//
// ── A DECISÃO QUE PREPARA O ONLINE ───────────────────────────────────
// O jogo inteiro é `jogo.estado` — um objeto JSON puro. Nada de classes com métodos
// dentro do estado, nada de referências a DOM, nada de funções. Isso não é acidente:
// é o que torna o estado SERIALIZÁVEL, e serializável é o que torna save local e
// sincronização de rede a MESMA operação.
//
// Hoje: JSON.stringify → localStorage.
// Amanhã: JSON.stringify → WebSocket → servidor autoritativo.
//
// O `perfil` (nome + id) é o embrião do login: um identificador estável por jogador.
// Local agora, credencial de servidor depois. A interface `carregarPerfil/salvarPerfil`
// não muda quando a fonte vira a nuvem — só a implementação por baixo.
const CHAVE_SAVE = 'soberano_save_v1';
const CHAVE_PERFIL = 'soberano_perfil_v1';

// ── PERFIL (o embrião do login) ───────────────────────────────────────
export function carregarPerfil() {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE_PERFIL) || 'null');
    if (p?.id) return p;
  } catch { /* corrompido: recria */ }
  // Um id estável, gerado uma vez. Vira a chave do jogador no servidor um dia.
  const perfil = {
    id: `sob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    nome: localStorage.getItem('soberano_nome') || '',
    criadoEm: new Date().toISOString(),
  };
  salvarPerfil(perfil);
  return perfil;
}

export function salvarPerfil(perfil) {
  try { localStorage.setItem(CHAVE_PERFIL, JSON.stringify(perfil)); } catch { /* cota cheia */ }
}

// ── SAVE DA PARTIDA ───────────────────────────────────────────────────
// Guarda só o necessário pra reconstruir: quem é o país, quantos turnos, o estado
// bruto, e um resumo pro cartão "Continuar" na home (sem ter de carregar tudo).
export function salvarPartida(jogo) {
  try {
    const save = {
      versao: 1,
      salvoEm: new Date().toISOString(),
      iso: jogo.ficha.iso,
      presidente: jogo.ficha.presidente,
      turno: jogo.turno,
      estado: jogo.estado,        // JSON puro — é isto que viaja pra rede um dia
      empresas: jogo.empresas,
      feed: (jogo.feed || []).slice(0, 30),
      // resumo pro cartão da home (leitura barata, sem desserializar a partida)
      resumo: {
        pais: jogo.ficha.pais,
        destino: jogo.destino,
        banda: jogo.banda?.nome,
        tesouro: jogo.estado.tesouro,
        rotulo: jogo.rotulo?.label,
      },
    };
    localStorage.setItem(CHAVE_SAVE, JSON.stringify(save));
    // Segunda cópia na nuvem (fire-and-forget). Import dinâmico pra não criar
    // dependência circular save ↔ nuvem, e pra o save funcionar mesmo offline.
    import('./nuvem.js').then((m) => m.empurrarParaNuvem(save)).catch(() => {});
    return true;
  } catch (e) {
    // localStorage tem ~5MB. Se estourar, o feed é a primeira gordura a cortar.
    // eslint-disable-next-line no-console
    console.warn('[save] falhou:', e.message);
    return false;
  }
}

export function carregarPartida() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE_SAVE) || 'null');
    return s?.estado ? s : null;
  } catch { return null; }
}

export function temSave() {
  return Boolean(carregarPartida());
}

export function apagarSave() {
  localStorage.removeItem(CHAVE_SAVE);
}

// Resumo leve pro cartão "Continuar" — sem desserializar a partida inteira.
export function resumoSave() {
  const s = carregarPartida();
  if (!s) return null;
  return {
    iso: s.iso, ...s.resumo, turno: s.turno,
    presidente: s.presidente,
    quando: s.salvoEm,
  };
}
