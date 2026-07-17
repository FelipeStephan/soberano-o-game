// ═══════════════════════════════════════════════════════════════════════
// AÇÕES DO JOGADOR CONTRA UMA PANDEMIA
// ═══════════════════════════════════════════════════════════════════════
// Puro (sem DOM). Gera as opções disponíveis (custo/tempo/chance escalam com a
// GRAVIDADE) e aplica o efeito QUANDO a ação termina na fila do tempo real. Doença
// pequena mina com um aporte; grande exige campanha sustentada ao longo de batidas.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (n) => Math.round(n * 100) / 100;

export function dificuldadeDe(g) {
  return g < 20 ? { rot: 'BAIXA', cor: '#22e0a0' }
    : g < 45 ? { rot: 'MODERADA', cor: '#ffb020' }
      : g < 70 ? { rot: 'ALTA', cor: '#ff8c3c' }
        : { rot: 'CRÍTICA', cor: '#ff3b5c' };
}

// As opções PRA ESTA pandemia agora. `valorSlider` alimenta a pesquisa escalável.
export function opcoesPandemia(pd, estado, valorSlider = 0.1) {
  const g = pd.gravidade || 0;
  const presurto = pd.fase === 'presurto';
  const ops = [];

  ops.push({
    id: 'ajuda', rot: presurto ? 'Investigar e conter o rumor' : 'Ajuda humanitária', ic: 'heart-handshake',
    custo: round2(0.03 + g * 0.0025),
    tempo: Math.round(clamp(10 + g * 0.4, 10, 45)), prob: 1,
    desc: presurto ? 'Manda equipe discreta checar o foco antes que vire manchete — muito mais barato agora.'
      : 'Hospitais de campanha, insumos e equipe médica no terreno.',
    pandemiaAlvo: { tipo: 'ajuda', valor: presurto ? 20 : 8 },
    efeitos: { soft_power: presurto ? 10 : 5, aprovacao: 3 },
  });

  const custoPorPonto = 0.008 * (1 + g / 35);
  const pontos = valorSlider / custoPorPonto;
  ops.push({
    id: 'pesquisa', rot: 'Financiar pesquisa / cura', ic: 'flask-conical',
    custo: round2(valorSlider),
    tempo: Math.round(clamp(18 + g * 0.9 + valorSlider * 30, 15, 140)),
    prob: clamp(0.98 - g / 500, 0.75, 0.98),
    desc: `Aporte escalável. Cada ponto de cura custa ~${round2(custoPorPonto)} tri (mais caro quanto pior a doença).`,
    pandemiaAlvo: { tipo: 'pesquisa', valor: pontos },
    efeitos: { soft_power: Math.round(clamp(4 + valorSlider * 20, 4, 14)), inteligencia: 2 },
    efeitos_falha: { soft_power: 1 },
    escalavel: true,
  });

  if (pd.paises?.length) {
    const alvo = pd.paises.includes(estado.iso) ? estado.iso : pd.paises[pd.paises.length - 1];
    const meu = alvo === estado.iso;
    ops.push({
      id: 'lockdown', rot: meu ? 'Lockdown nacional' : `Conter foco em ${alvo}`, ic: 'shield-half',
      custo: round2(0.02 + g * 0.003),
      tempo: Math.round(clamp(14 + g * 0.5, 14, 70)), prob: 1,
      desc: meu ? 'Trava a economia do SEU país pra estancar o contágio local.' : 'Financia a contenção territorial de um foco no exterior.',
      pandemiaAlvo: { tipo: 'lockdown', valor: 14, alvoIso: alvo },
      efeitos: meu ? { temp_economia: -Math.round(6 + g * 0.08), aprovacao: -2 } : { soft_power: 4 },
    });
  }

  const podeVacinar = (pd.curaAcumulada || 0) >= 50;
  ops.push({
    id: 'vacinacao', rot: 'Campanha de vacinação em massa', ic: 'syringe',
    custo: round2(0.15 + g * 0.006),
    tempo: Math.round(clamp(40 + g * 1.1, 40, 160)),
    prob: clamp(0.9 - Math.max(0, g - 70) / 300, 0.7, 0.9),
    desc: podeVacinar ? 'O golpe de misericórdia: derruba a gravidade de uma vez.' : `Requer 50% de cura acumulada (hoje: ${Math.round(pd.curaAcumulada || 0)}%).`,
    pandemiaAlvo: { tipo: 'vacinacao', valor: 0 },
    efeitos: { soft_power: 15, aprovacao: 8 },
    bloqueada: !podeVacinar,
  });

  return { ops, dificuldade: dificuldadeDe(g) };
}

// Chamado por Jogo.executarAcaoTempo quando a ação de pandemia termina na fila.
export function aplicarAcaoPandemia(estado, alvo, sucesso) {
  const pd = (estado.pandemias || []).find((p) => p.id === alvo.pandemiaId);
  if (!pd) return { tom: 'neutro', texto: 'A situação já havia se resolvido antes da ordem chegar.' };
  const fator = sucesso ? 1 : 0.4;
  if (alvo.tipo === 'ajuda') pd.contencaoAcumulada = clamp((pd.contencaoAcumulada || 0) + alvo.valor * fator, 0, 100);
  if (alvo.tipo === 'pesquisa') pd.curaAcumulada = clamp((pd.curaAcumulada || 0) + alvo.valor * fator, 0, 100);
  if (alvo.tipo === 'lockdown') {
    pd.contencaoAcumulada = clamp((pd.contencaoAcumulada || 0) + alvo.valor * fator, 0, 100);
    if (alvo.alvoIso) { pd.contidoEm = pd.contidoEm || {}; pd.contidoEm[alvo.alvoIso] = true; }
  }
  if (alvo.tipo === 'vacinacao' && sucesso) {
    pd.gravidade = clamp(pd.gravidade - (18 + (pd.curaAcumulada || 0) * 0.25), 0, 100);
    pd.contencaoAcumulada = clamp((pd.contencaoAcumulada || 0) + 25, 0, 100);
  }
  return {
    tom: sucesso ? 'bom' : 'aviso',
    texto: sucesso ? `Resposta a ${pd.nome} avança: gravidade em ${Math.round(pd.gravidade)}/100 · cura ${Math.round(pd.curaAcumulada || 0)}%.`
      : `Revés na resposta a ${pd.nome} — parte do esforço se perdeu.`,
  };
}
