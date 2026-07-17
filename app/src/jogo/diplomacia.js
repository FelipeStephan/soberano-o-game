// Ações direcionadas a um país (geradas ao clicar no globo). Cada uma vira uma ação
// avulsa que o jogador enfileira no turno. A "recomendada" varia com a relação atual.
import { chaveRelacao, nomePais, relacaoAtual } from '../dados/paises.js';

export function acoesPais(feature, estado) {
  const k = chaveRelacao(feature);
  const nome = nomePais(feature);
  const rel = relacaoAtual(estado, feature);

  const acoes = [
    { id: `dip_alianca_${k}`, icone: '🤝', nome: 'Propor Aliança', custo: 0.1, custoPA: 1, prob: rel > 0 ? 0.85 : 0.45,
      descricao: `Formalizar aliança estratégica com ${nome}.`, efeitos: { [k]: 22, soft_power: 6 }, efeitos_falha: { soft_power: -4 } },
    { id: `dip_comercio_${k}`, icone: '💱', nome: 'Acordo Comercial', custo: 0.08, custoPA: 1, prob: 0.9,
      descricao: `Abrir comércio bilateral com ${nome}.`, efeitos: { [k]: 12, pib: 0.4, temp_economia: 3 }, politico: { economico: 4 } },
    { id: `dip_ajuda_${k}`, icone: '🎁', nome: 'Enviar Ajuda', custo: 0.15, custoPA: 1, prob: 1,
      descricao: `Ajuda humanitária e financeira a ${nome}.`, efeitos: { [k]: 15, soft_power: 5 }, politico: { economico: -3 } },
    { id: `dip_sancao_${k}`, icone: '🚫', nome: 'Impor Sanções', custo: 0.03, custoPA: 1, prob: 0.85,
      descricao: `Estrangular a economia de ${nome}.`, efeitos: { [k]: -18, temp_economia: -2 }, efeitos_falha: { soft_power: -4 }, politico: { autoridade: 3 } },
    { id: `dip_espiar_${k}`, icone: '🕵️', nome: 'Espionar', custo: 0.03, custoPA: 1, prob: 0.75, requer: { inteligencia: '>40' },
      descricao: `Operação de inteligência contra ${nome}.`, efeitos: { inteligencia: 5, [k]: -4 }, efeitos_falha: { [k]: -12, risco_exposicao: 'alto' } },
    { id: `dip_golpe_${k}`, icone: '♟️', nome: 'Financiar Golpe', custo: 0.2, custoPA: 2, prob: 0.4, requer: { inteligencia: '>55' },
      descricao: `Desestabilizar o governo de ${nome}.`, efeitos: { [k]: -30, seguranca: 5 }, efeitos_falha: { soft_power: -15, [k]: -10, risco_exposicao: 'alto' }, politico: { autoridade: 6 } },
  ];
  // (A guerra tem planejador próprio — ver ui/guerra.js)

  let rec;
  if (rel >= 40) rec = `dip_alianca_${k}`;
  else if (rel >= 0) rec = `dip_comercio_${k}`;
  else if (rel >= -40) rec = `dip_sancao_${k}`;
  else rec = `dip_espiar_${k}`;

  // metadados pra a Máquina reagir ao alvo (guerra/golpe geram acontecimento próprio)
  acoes.forEach((a) => {
    a.recomendada = a.id === rec;
    a.alvo = nome;
    a.relKey = k;
    if (a.id.startsWith('dip_golpe') || a.id.startsWith('dip_sabotar')) a.major = true;
  });

  return { nome, rel, acoes };
}
