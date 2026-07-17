// FLASHES URGENTES — acontecem SEM AVISO durante o planejamento, com cronômetro.
// Se você não decidir a tempo, a opção padrão (quase sempre a pior) é aplicada sozinha.
// Tom cru, adulto. O mundo não espera você pensar.

const rand = (a) => a[Math.floor(Math.random() * a.length)];

export const FLASHES = [
  {
    id: 'radar',
    gatilho: (e) => e.temp_guerra >= 35,
    tempo: 12,
    tag: 'NORAD · PRIORIDADE MÁXIMA',
    titulo: 'Contato não identificado no radar',
    texto: 'Objeto em rota de aproximação pelo Ártico. Pode ser um bombardeiro de teste. Pode não ser. Você tem segundos, não minutos.',
    opcoes: [
      { texto: 'Interceptar com caças agora', efeitos: { temp_guerra: 6, seguranca: 6, rel_russia: -8 } },
      { texto: 'Só monitorar e não escalar', efeitos: { seguranca: -5, temp_guerra: -2 } },
    ],
    padrao: 1,
    padraoTexto: 'Você congelou. O objeto entrou no espaço aéreo e saiu impune. A imprensa vai saber.',
    efeitosPadrao: { seguranca: -10, aprovacao: -6 },
  },
  {
    id: 'vazamento',
    tempo: 14,
    tag: 'GABINETE · CONTENÇÃO DE DANOS',
    titulo: 'Um dossiê vazou para a imprensa',
    texto: 'Documentos internos com operações encobertas estão na mão de um jornalista. Ele publica em uma hora. O telefone está tocando agora.',
    opcoes: [
      { texto: 'Negar tudo e atacar a credibilidade dele', efeitos: { liberdades: -8, aprovacao: 3, soft_power: -5 }, politico: { autoridade: 6 } },
      { texto: 'Assumir na frente e controlar a narrativa', efeitos: { aprovacao: -7, soft_power: 5, liberdades: 3 } },
      { texto: 'Comprar o silêncio dele', efeitos: { tesouro: -0.08, risco_exposicao: 'alto' }, politico: { autoridade: 4 } },
    ],
    padrao: 0,
    padraoTexto: 'O silêncio foi lido como culpa. A matéria saiu sem a sua versão.',
    efeitosPadrao: { aprovacao: -10, soft_power: -8 },
  },
  {
    id: 'refem',
    tempo: 12,
    tag: 'CRISE EM CURSO · REFÉNS',
    titulo: 'Nossa embaixada foi tomada',
    texto: 'Homens armados invadiram a embaixada. Trinta funcionários nossos lá dentro. A TV já está transmitindo ao vivo. O mundo assiste você decidir.',
    opcoes: [
      { texto: 'Operação de resgate militar imediata', efeitos: { temp_guerra: 12, seguranca: 5, aprovacao: 4 }, politico: { autoridade: 5 } },
      { texto: 'Negociar. Vidas acima de orgulho.', efeitos: { soft_power: 6, aprovacao: -5, seguranca: -4 } },
    ],
    padrao: 1,
    padraoTexto: 'A hesitação virou manchete. Reféns seguem lá dentro e a sua imagem sangra ao vivo.',
    efeitosPadrao: { aprovacao: -12, soft_power: -8, estabilidade: -5 },
  },
  {
    id: 'mercado',
    gatilho: (e) => e.temp_economia <= 55,
    tempo: 10,
    tag: 'MERCADOS · TEMPO REAL',
    titulo: 'O mercado está derretendo',
    texto: 'Queda livre nos índices. Os bancos estão ligando. Cada minuto sem resposta são bilhões evaporando.',
    opcoes: [
      { texto: 'Injetar liquidez de emergência', efeitos: { tesouro: -0.4, temp_economia: 12, divida: 4 }, politico: { economico: -4 } },
      { texto: 'Deixar o mercado se corrigir sozinho', efeitos: { temp_economia: -8, aprovacao: -4 }, politico: { economico: 8 } },
    ],
    padrao: 1,
    padraoTexto: 'Você não atendeu. O fechamento foi um banho de sangue.',
    efeitosPadrao: { temp_economia: -14, tesouro: -0.2, aprovacao: -5 },
  },
  {
    id: 'cyber',
    tempo: 11,
    tag: 'CYBER COMMAND · INTRUSÃO ATIVA',
    titulo: 'Estão dentro da nossa rede AGORA',
    texto: 'Intrusão ativa na infraestrutura elétrica. Não sabemos quem. Sabemos que estão copiando tudo enquanto conversamos.',
    opcoes: [
      { texto: 'Derrubar a rede e cortar o acesso', efeitos: { seguranca: 8, temp_economia: -6, aprovacao: -3 } },
      { texto: 'Deixar rodar e rastrear a origem', efeitos: { inteligencia: 8, seguranca: -6, risco_exposicao: 'medio' } },
    ],
    padrao: 0,
    padraoTexto: 'Enquanto você pensava, eles levaram tudo e sumiram.',
    efeitosPadrao: { seguranca: -12, inteligencia: -5 },
  },
  {
    id: 'protesto',
    gatilho: (e) => e.aprovacao <= 55,
    tempo: 12,
    tag: 'RUAS · SITUAÇÃO CRÍTICA',
    titulo: 'A capital está pegando fogo',
    texto: 'Cem mil pessoas cercando o palácio. A polícia pede ordem de dispersão. Uma decisão errada agora vira massacre no noticiário.',
    opcoes: [
      { texto: 'Dispersar com força', efeitos: { estabilidade: 6, liberdades: -14, soft_power: -10 }, politico: { autoridade: 9 } },
      { texto: 'Descer e falar com eles', efeitos: { aprovacao: 8, estabilidade: -3, liberdades: 5 }, politico: { autoridade: -5 } },
      { texto: 'Recuar e esperar cansarem', efeitos: { estabilidade: -8, aprovacao: -4 } },
    ],
    padrao: 2,
    padraoTexto: 'A ausência foi lida como fuga. As ruas ficaram com eles.',
    efeitosPadrao: { estabilidade: -10, aprovacao: -8 },
  },
  {
    id: 'traidor',
    tempo: 13,
    tag: 'CONTRAINTELIGÊNCIA · URGENTE',
    titulo: 'Temos um traidor no gabinete',
    texto: 'A contrainteligência aponta um vazamento vindo de dentro. Três nomes na mesa, nenhuma prova definitiva. Agir errado destrói um inocente.',
    opcoes: [
      { texto: 'Prender os três agora', efeitos: { seguranca: 6, liberdades: -10, estabilidade: -5 }, politico: { autoridade: 8 } },
      { texto: 'Vigiar em silêncio e deixar se entregar', efeitos: { inteligencia: 6, seguranca: -3 } },
    ],
    padrao: 1,
    padraoTexto: 'Você demorou. O vazamento continuou e a fonte sumiu do país.',
    efeitosPadrao: { seguranca: -8, inteligencia: -6 },
  },
];

// Sorteia um flash aplicável ao estado atual.
export function sortearFlash(estado) {
  const aptos = FLASHES.filter((f) => !f.gatilho || f.gatilho(estado));
  if (!aptos.length) return null;
  return rand(aptos);
}
