// OCUPAÇÃO — o que fazer com o território conquistado. Cada ocupação tem INSURGÊNCIA
// (0–100) que sobe a cada turno. Deixar apodrecer custa caro; perder para a insurgência
// devolve o território.
export function ocupacaoDe(estado, isoCode) {
  return (estado.conquistados || []).find((c) => c.iso === isoCode) || null;
}

export function estaOcupado(estado, isoCode) {
  return Boolean(ocupacaoDe(estado, isoCode));
}

// Ações disponíveis num território ocupado (enfileiráveis no turno).
export function acoesOcupacao(estado, conq) {
  const alvo = { iso: conq.iso };
  return [
    { id: `oc_integrar_${conq.iso}`, icone: '🏛️', nome: 'Integrar Território', custo: 0.4, custoPA: 1, prob: 0.85,
      descricao: `Investir em administração e infraestrutura em ${conq.nome}. Acalma a população.`,
      efeitos: { pib: 0.5, estabilidade: 4, soft_power: 3 }, efeitos_falha: { pib: 0.1 },
      ocupacao: { ...alvo, insurgencia: -28 }, politico: { economico: -3 } },

    { id: `oc_extrair_${conq.iso}`, icone: '⛏️', nome: 'Extrair Recursos', custo: 0.05, custoPA: 1, prob: 0.9,
      descricao: `Explorar as riquezas de ${conq.nome}. Lucrativo e odiado.`,
      efeitos: { tesouro: 0.55, soft_power: -8 }, efeitos_falha: { tesouro: 0.1 },
      ocupacao: { ...alvo, insurgencia: 18 }, politico: { economico: 6 } },

    { id: `oc_guarnicao_${conq.iso}`, icone: '🪖', nome: 'Reforçar Guarnição', custo: 0.12, custoPA: 1, prob: 0.95,
      descricao: `Manter tropas permanentes em ${conq.nome}.`,
      efeitos: { seguranca: 4, poder_militar: -2 }, efeitos_falha: {},
      ocupacao: { ...alvo, insurgencia: -18 }, politico: { autoridade: 4 } },

    { id: `oc_repressao_${conq.iso}`, icone: '⛓️', nome: 'Repressão Dura', custo: 0.06, custoPA: 1, prob: 0.7,
      descricao: `Esmagar a resistência em ${conq.nome} na marra.`,
      efeitos: { liberdades: -10, soft_power: -10, estabilidade: 3 }, efeitos_falha: { estabilidade: -8, soft_power: -14 },
      ocupacao: { ...alvo, insurgencia: -35 }, politico: { autoridade: 9 } },

    { id: `oc_libertar_${conq.iso}`, icone: '🕊️', nome: 'Conceder Independência', custo: 0, custoPA: 1, prob: 1,
      descricao: `Devolver a soberania de ${conq.nome}. O mundo aplaude, os falcões cospem.`,
      efeitos: { territorio: -1, soft_power: 16, aprovacao: -5 },
      ocupacao: { ...alvo, libertar: true }, politico: { autoridade: -7 } },
  ];
}

// Aplica o efeito de uma ação sobre a ocupação (chamado no resolverFila).
export function aplicarOcupacao(estado, oc) {
  if (!oc) return;
  if (oc.libertar) {
    estado.conquistados = (estado.conquistados || []).filter((c) => c.iso !== oc.iso);
    return;
  }
  const c = ocupacaoDe(estado, oc.iso);
  if (c && typeof oc.insurgencia === 'number') {
    c.insurgencia = Math.max(0, Math.min(100, c.insurgencia + oc.insurgencia));
  }
}
