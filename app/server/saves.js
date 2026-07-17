// ═══════════════════════════════════════════════════════════════════════
// PERFIL + SAVE NA NUVEM — a partida deixa de morrer com o navegador
// ═══════════════════════════════════════════════════════════════════════
// Hoje o save é localStorage: some se o jogador troca de máquina, limpa o cache
// ou joga do celular. Pra "online" isso não serve — a partida tem de viver no
// servidor, atrelada a um PERFIL.
//
// O perfil é o embrião do login (o cliente já gera um id estável em save.js). Aqui
// ele vira um registro no servidor: { id, nome, criadoEm }. Autenticação real
// (senha/OAuth) entra depois SEM mudar este contrato — o id só passa a ser provado
// em vez de declarado. Por ora, confiança no id do cliente: é protótipo, e o que
// está em jogo é um save de jogo single-player, não dado sensível.
//
// Cada jogador tem UMA partida na nuvem (a mais recente). Múltiplos slots é só
// trocar a chave de `${perfilId}` pra `${perfilId}:${slot}`.
import { Router } from 'express';
import { buscar, salvar, listar } from './store.js';

const idValido = (s) => typeof s === 'string' && /^[a-z0-9_-]{6,64}$/i.test(s);

export function rotasSaves() {
  const r = Router();

  // ── PERFIL ───────────────────────────────────────────────────────────
  // Cria/atualiza o perfil. Idempotente: o cliente manda o mesmo id sempre.
  r.put('/profile/:id', async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ erro: 'id inválido' });
    const existente = await buscar('perfis', id);
    const perfil = await salvar('perfis', id, {
      nome: String(req.body?.nome || existente?.nome || '').slice(0, 40),
      criadoEm: existente?.criadoEm || new Date().toISOString(),
      ultimoAcesso: new Date().toISOString(),
    });
    res.json(perfil);
  });

  r.get('/profile/:id', async (req, res) => {
    const p = await buscar('perfis', req.params.id);
    if (!p) return res.status(404).json({ erro: 'perfil não encontrado' });
    res.json(p);
  });

  // ── SAVE ─────────────────────────────────────────────────────────────
  // O estado do jogo é JSON puro (foi desenhado assim de propósito em jogo/save.js):
  // gravar na nuvem é o MESMO objeto que grava no localStorage. Zero adaptação.
  r.put('/save/:perfilId', async (req, res) => {
    const { perfilId } = req.params;
    if (!idValido(perfilId)) return res.status(400).json({ erro: 'perfil inválido' });
    const save = req.body?.save;
    if (!save || typeof save !== 'object' || !save.estado) {
      return res.status(400).json({ erro: 'save inválido (falta estado)' });
    }
    // Trava de tamanho: um save legítimo tem alguns KB; recusa payload absurdo.
    const bytes = Buffer.byteLength(JSON.stringify(save));
    if (bytes > 2_000_000) return res.status(413).json({ erro: 'save grande demais' });

    const salvo = await salvar('saves', perfilId, { perfilId, save });
    res.json({ ok: true, salvoEm: salvo.atualizadoEm });
  });

  r.get('/save/:perfilId', async (req, res) => {
    const s = await buscar('saves', req.params.perfilId);
    if (!s) return res.status(404).json({ erro: 'sem save na nuvem' });
    res.json(s.save);
  });

  // Placar simples — quem chegou mais longe no Destino. Já é conteúdo de "mundo
  // compartilhado" sem precisar de multiplayer em tempo real.
  r.get('/placar', async (req, res) => {
    const saves = await listar('saves');
    const linhas = saves
      .map((s) => s.save?.resumo && ({
        pais: s.save.resumo.pais,
        presidente: s.save.presidente,
        destino: s.save.resumo.destino,
        turno: s.save.turno,
      }))
      .filter(Boolean)
      .sort((a, b) => (b.destino || 0) - (a.destino || 0))
      .slice(0, 20);
    res.json(linhas);
  });

  return r;
}
