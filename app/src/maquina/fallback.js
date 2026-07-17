// ═══════════════════════════════════════════════════════════════════════
// BIBLIOTECA DE RESERVA — agora MOLDADA PELA FICHA, não escrita para os EUA
// ═══════════════════════════════════════════════════════════════════════
// O que este arquivo era: 4 cartas fixas de EUA-2026 (protesto em Chicago, a ata do
// Fed, centrífugas iranianas). Jogando de Brasil, o jogador recebia crise sobre
// Chicago — e como a queda pro fallback é silenciosa, aquilo parecia "a IA sem
// contexto". Não era a IA: era o plano B se passando por ela.
//
// O que é agora: um punhado de ARQUÉTIPOS de crise (o vizinho hostil, o preço da
// comida, a rua, o convite da potência, o quartel) preenchidos em tempo de execução
// com a ficha DAQUELE país — quem é o rival de verdade (a relação mais baixa do
// estado ATUAL), quem é o parceiro, como se chama a capital, quem é o presidente, e
// que jornais existem naquele país. O gabinete resolve sozinho porque os ids são
// estáveis entre as 20 nações (sec_defesa, dir_cia...) — decisão da 22ª leva que
// paga dividendo aqui.
//
// O que ele NÃO é: a Máquina. Isto é reserva. Continua mais pobre e mais previsível
// que a IA — de propósito. A meta não é substituir a IA, é nunca mais mentir sobre
// qual país o jogador está governando.
//
// Formato de saída (contrato com o gerador): { carta, feed, fios_update }.
import { nomeDeRelacao, dePais, comPais } from '../dados/paises.js';

// ── Lendo o mundo a partir do estado ──────────────────────────────────
// O rival não é uma constante: é quem está pior comigo AGORA. Se eu jogo de Brasil e
// passei três turnos hostilizando a Argentina, o arquétipo do vizinho hostil fala da
// Argentina. É o mínimo de contexto que o fallback deve honrar.
function lerRelacoes(estado) {
  const pares = Object.entries(estado || {})
    .filter(([k, v]) => k.startsWith('rel_') && typeof v === 'number')
    .map(([k, v]) => ({ chave: k, nome: nomeDeRelacao(k), valor: v }));
  if (!pares.length) return { rival: null, parceiro: null };
  const ordenado = [...pares].sort((a, b) => a.valor - b.valor);
  return { rival: ordenado[0], parceiro: ordenado[ordenado.length - 1] };
}

// Um veículo da imprensa DAQUELE país para assinar o post. Sem isto, o fallback
// inventava "GNN" e "A Voz Livre" — nomes que não existem em catálogo nenhum, então
// a UI nunca achava o logo e degradava o post pra cidadão anônimo.
function doisVeiculos(veiculos) {
  if (!Array.isArray(veiculos) || !veiculos.length) return [];
  const locais = veiculos.filter((v) => v.pais && v.pais !== 'Internacional');
  const resto = veiculos.filter((v) => !locais.includes(v));
  return [locais[0] || resto[0], resto[0] || locais[1] || locais[0]].filter(Boolean);
}

const pct = (n) => Math.round(n);

// ── ARQUÉTIPOS ────────────────────────────────────────────────────────
// Cada um é uma função (ctx) → { carta, feed } ou null quando não faz sentido no
// estado atual (ex.: sem rival identificável, não há crise de fronteira). Devolver
// null é o jeito de um arquétipo dizer "não sou eu agora".
const ARQUETIPOS = [
  // O vizinho hostil — só aparece se existe alguém realmente mal comigo.
  ({ pais, presidente, rival, v1, v2 }) => {
    if (!rival || rival.valor > -10) return null;
    return {
      chaves: ['fronteira', 'guerra', 'tensão', rival.nome.toLowerCase()],
      carta: {
        pressiona: 'seguranca',
        personagem: 'sec_defesa',
        titulo: `Movimento na fronteira ${comPais(rival.nome)}`,
        narrativa: `O Ministro da Defesa não senta. "Presidente ${presidente}, ${rival.nome} moveu tropas para perto da nossa linha nas últimas 40 horas. Pode ser exercício. Pode ser ensaio. A relação está em ${pct(rival.valor)} — no nível em que países param de avisar antes de agir. O senhor quer descobrir junto com o jornal da noite?"`,
        opcoes: [
          {
            texto: 'Mobilizar tropas para a fronteira — que vejam o aço',
            efeitos: { [rival.chave]: -12, seguranca: 8, temp_guerra: 14, tesouro: -0.08 },
            politico: { autoridade: 5 },
            reacao_feed: 'o país inteiro entende que algo sério começou',
            efeito_no_fio: { intensidade: 20 },
          },
          {
            texto: `Abrir canal direto ${comPais(rival.nome)} antes que alguém atire`,
            efeitos: { [rival.chave]: 16, seguranca: -4, aprovacao: -6 },
            politico: { autoridade: -3 },
            reacao_feed: 'aliviados chamam de prudência; falcões, de covardia',
            efeito_no_fio: { intensidade: -18, pode_mutar: true },
          },
          {
            texto: 'Silêncio público, satélite ligado e ordem de não reagir',
            efeitos: { inteligencia: 6, seguranca: 3 },
            reacao_feed: 'ninguém fica sabendo — por enquanto',
            efeito_no_fio: { intensidade: 4 },
            requer_capacidade: { inteligencia: '>40' },
          },
        ],
      },
      feed: [
        { tipo: 'cidadao', handle: '@fronteira_viva', texto: `tem comboio militar passando na estrada aqui desde ontem. alguém explica?`, tom: 'medo' },
        v1 && { tipo: 'veiculo', veiculo: v1.nome, handle: v1.handle, texto: `URGENTE: movimentação militar ${dePais(rival.nome)} próxima à fronteira. Governo ${dePais(pais)} não se pronuncia.`, tom: 'alarme',
          manchete: `${rival.nome} desloca tropas para a fronteira e governo ${dePais(pais)} evita comentar` },
        v2 && { tipo: 'veiculo', veiculo: v2.nome, handle: v2.handle, texto: `Analistas veem risco de erro de cálculo. Relação bilateral no pior momento em anos.`, tom: 'analise',
          manchete: `Sem canal aberto, especialistas temem escalada por acidente na fronteira` },
      ].filter(Boolean),
    };
  },

  // O preço da comida — a crise que não precisa de inimigo.
  ({ pais, presidente, v1, v2 }) => ({
    chaves: ['inflação', 'economia', 'preço', 'custo'],
    carta: {
      pressiona: 'temp_economia',
      personagem: 'sec_tesouro',
      titulo: 'O número que sai na sexta',
      narrativa: `O Tesouro trouxe a prévia da inflação antes da imprensa. Não é boa. "Presidente ${presidente}, comida e combustível puxaram tudo. Sai sexta de manhã. O senhor tem dois dias para decidir se chega nela como quem resolve ou como quem foi pego."`,
      opcoes: [
        {
          texto: 'Congelar o preço do combustível — o povo primeiro',
          efeitos: { aprovacao: 12, tesouro: -0.35, temp_economia: -8 },
          politico: { economico: -7 },
          reacao_feed: 'alívio na rua, pânico no mercado',
          efeito_no_fio: { intensidade: -10 },
        },
        {
          texto: 'Deixar o mercado corrigir e aguentar o tranco político',
          efeitos: { aprovacao: -14, temp_economia: 10, estabilidade: -6 },
          politico: { economico: 8 },
          reacao_feed: 'o mercado aplaude; a rua, não',
          efeito_no_fio: { intensidade: 12 },
        },
        {
          texto: 'Sair na frente do número: pronunciamento em cadeia nacional',
          efeitos: { aprovacao: 5, soft_power: 3 },
          reacao_feed: 'metade acredita; a outra metade já ouviu isso antes',
          efeito_no_fio: { intensidade: -4 },
        },
      ],
    },
    feed: [
      { tipo: 'cidadao', handle: '@contas_do_mes', texto: 'fui no mercado e voltei com meia sacola pelo mesmo dinheiro do mês passado. alguém sente isso ou sou só eu', tom: 'raiva' },
      v1 && { tipo: 'veiculo', veiculo: v1.nome, handle: v1.handle, texto: `Prévia da inflação em ${pais} vem acima do esperado. Governo estuda resposta.`, tom: 'seco',
        manchete: `Inflação surpreende para cima e pressiona o governo antes do dado oficial` },
      v2 && { tipo: 'veiculo', veiculo: v2.nome, handle: v2.handle, texto: `Terceiro mês seguido de alta em alimentos. E o governo ainda discute o comunicado.`, tom: 'critico',
        manchete: `Alimentos sobem pelo terceiro mês e corroem a renda de quem ganha menos` },
    ].filter(Boolean),
  }),

  // A rua — pressiona quando a aprovação já está sangrando.
  ({ pais, capital, presidente, v1, v2, estado }) => {
    if ((estado?.aprovacao ?? 50) > 42) return null;
    return {
      chaves: ['protesto', 'rua', 'revolta', 'estabilidade'],
      carta: {
        pressiona: 'estabilidade',
        personagem: 'chefe_gabinete',
        titulo: `Terceira noite em ${capital}`,
        narrativa: `Seu Chefe de Gabinete fecha a porta antes de falar. "Presidente ${presidente}, a praça não esvaziou de novo. Começou por preço, mas agora estão gritando o seu nome. A aprovação está em ${pct(estado?.aprovacao ?? 0)}. Polícia quer ordem escrita. Se o senhor assinar, ela vira manchete; se não assinar, a praça vira acampamento."`,
        opcoes: [
          {
            texto: 'Ordem de dispersão — restabelecer a ordem antes que cresça',
            efeitos: { estabilidade: 8, aprovacao: -10, liberdades: -12, soft_power: -8 },
            politico: { autoridade: 8 },
            reacao_feed: 'imagens da noite correm o mundo',
            efeito_no_fio: { intensidade: 22 },
          },
          {
            texto: 'Descer até a praça e ouvir, com as câmeras juntas',
            efeitos: { aprovacao: 10, estabilidade: -4, soft_power: 6 },
            politico: { autoridade: -5 },
            reacao_feed: 'gesto raro; parte da rua desarma, parte vaia',
            efeito_no_fio: { intensidade: -16, pode_mutar: true },
          },
          {
            texto: 'Anunciar pacote de alívio imediato e esperar esvaziar',
            efeitos: { aprovacao: 7, tesouro: -0.28, estabilidade: 4 },
            politico: { economico: -5 },
            reacao_feed: 'compra tempo — e todo mundo sabe que é isso',
            efeito_no_fio: { intensidade: -8 },
          },
        ],
      },
      feed: [
        { tipo: 'cidadao', handle: '@na_praca_agora', texto: `terceira noite aqui. não vim por partido nenhum, vim porque não fecha a conta em casa`, tom: 'raiva' },
        v1 && { tipo: 'veiculo', veiculo: v1.nome, handle: v1.handle, texto: `AO VIVO: manifestantes ocupam o centro de ${capital} pela terceira noite. Governo avalia resposta.`, tom: 'alarme',
          manchete: `Terceira noite de protestos em ${capital}; polícia aguarda ordem do Palácio` },
        v2 && { tipo: 'veiculo', veiculo: v2.nome, handle: v2.handle, texto: `A pergunta que ${presidente} terá de responder amanhã: negociar ou dispersar?`, tom: 'critico',
          manchete: `Sem resposta do governo, protesto por preços vira crise política` },
      ].filter(Boolean),
    };
  },

  // O convite — a potência amiga cobrando o preço da amizade.
  ({ pais, presidente, parceiro, rival, v1, v2 }) => {
    if (!parceiro || parceiro.valor < 30) return null;
    return {
      chaves: ['acordo', 'aliança', 'comércio', parceiro.nome.toLowerCase()],
      carta: {
        pressiona: 'soft_power',
        personagem: 'sec_estado',
        titulo: `O convite ${dePais(parceiro.nome)}`,
        narrativa: `A Chancelaria trouxe a proposta em mãos, sem e-mail. "${parceiro.nome} quer assinar um pacote grande conosco — dinheiro, tecnologia, acesso. Vem com uma cláusula que não está escrita: escolher um lado.${rival ? ` E o lado que ficaria de fora é ${rival.nome}.` : ''} Presidente ${presidente}, amizade dessa gente sempre teve preço. Este é o boleto."`,
        opcoes: [
          {
            texto: `Assinar — dinheiro agora vale mais que equilíbrio depois`,
            efeitos: { [parceiro.chave]: 18, tesouro: 0.4, soft_power: -6, ...(rival ? { [rival.chave]: -14 } : {}) },
            politico: { economico: 6 },
            reacao_feed: 'o mercado comemora; a vizinhança estranha',
            efeito_no_fio: { intensidade: 14 },
          },
          {
            texto: 'Recusar a cláusula e manter as duas portas abertas',
            efeitos: { [parceiro.chave]: -8, soft_power: 10 },
            reacao_feed: 'diplomatas chamam de habilidade; o Tesouro, de prejuízo',
            efeito_no_fio: { intensidade: -6 },
          },
          {
            texto: 'Aceitar o dinheiro e adiar a cláusula indefinidamente',
            efeitos: { [parceiro.chave]: 6, tesouro: 0.25, soft_power: -3 },
            politico: { autoridade: 3 },
            reacao_feed: 'ninguém acredita que vai colar — mas colou desta vez',
            efeito_no_fio: { intensidade: 6, pode_mutar: true },
          },
        ],
      },
      feed: [
        v1 && { tipo: 'veiculo', veiculo: v1.nome, handle: v1.handle, texto: `Fontes: negociação avançada ${comPais(parceiro.nome)}. Palácio nega exclusividade.`, tom: 'seco',
          manchete: `Pacote ${dePais(parceiro.nome)} prevê cláusula de alinhamento, dizem fontes` },
        { tipo: 'cidadao', handle: '@geopolitica_diaria', texto: `todo acordo desse tamanho vem com letra miúda. a pergunta é quem lê antes de assinar`, tom: 'ironia' },
        v2 && { tipo: 'veiculo', veiculo: v2.nome, handle: v2.handle, texto: `Analistas: aproximação ${comPais(parceiro.nome)} teria custo diplomático no médio prazo.`, tom: 'analise',
          manchete: `O preço escondido da parceria: o que ${pais} entrega em troca do dinheiro` },
      ].filter(Boolean),
    };
  },

  // O quartel — o risco que vem de dentro.
  ({ presidente, v1, v2, estado }) => ({
    chaves: ['militar', 'quartel', 'golpe', 'purga'],
    carta: {
      pressiona: 'estabilidade',
      personagem: 'dir_cia',
      titulo: 'A conversa que não devia ter acontecido',
      narrativa: `A Inteligência pede a sala vazia. "Presidente ${presidente}, três oficiais de alta patente jantaram juntos anteontem. Não é crime jantar. Só que um deles ligou para gente que o senhor demitiu. Temos o registro, não temos o conteúdo. O senhor quer que eu continue ouvindo — ou quer que eu esqueça o jantar?"`,
      opcoes: [
        {
          texto: 'Afastar os três hoje, antes do café da manhã',
          efeitos: { estabilidade: -6, poder_militar: -8, seguranca: 6, liberdades: -6 },
          politico: { autoridade: 9 },
          reacao_feed: 'o quartel inteiro entende o recado — e nem todo mundo gosta',
          efeito_no_fio: { intensidade: 24 },
        },
        {
          texto: 'Deixar correr e ouvir tudo — quero saber quem mais está na mesa',
          efeitos: { inteligencia: 10, estabilidade: -3 },
          reacao_feed: 'nada público; o risco continua andando solto',
          efeito_no_fio: { intensidade: 12, pode_mutar: true },
          requer_capacidade: { inteligencia: '>45' },
        },
        {
          texto: 'Chamar os três para conversar de frente, sem registro',
          efeitos: { estabilidade: 5, poder_militar: 3, aprovacao: -3 },
          politico: { autoridade: -2 },
          reacao_feed: 'ou o senhor comprou lealdade, ou comprou tempo',
          efeito_no_fio: { intensidade: -10 },
        },
      ],
    },
    feed: [
      { tipo: 'cidadao', handle: '@radar_do_poder', texto: `boato forte circulando sobre mudança no alto comando. ninguém confirma nada, como sempre`, tom: 'suspeita' },
      v1 && { tipo: 'veiculo', veiculo: v1.nome, handle: v1.handle, texto: `Fontes militares relatam clima tenso no alto comando. Governo não comenta.`, tom: 'seco',
        manchete: `Encontro de oficiais fora da agenda oficial acende alerta no Palácio` },
      v2 && { tipo: 'veiculo', veiculo: v2.nome, handle: v2.handle, texto: `Estabilidade em ${pct(estado?.estabilidade ?? 50)}: o governo tem margem para uma crise interna agora?`, tom: 'critico',
        manchete: `Governo enfrenta ruído com o alto comando no pior momento político` },
    ].filter(Boolean),
  }),
];

let ultimoTitulo = null;

// ── A porta de entrada ────────────────────────────────────────────────
// ctx é opcional de propósito: se alguém chamar sem ficha (teste, caminho velho), o
// fallback ainda entrega carta jogável — só que genérica. Degradar é aceitável;
// quebrar, não.
export function puxarFallback(fioTema, ctx = {}) {
  const { ficha = {}, estado = {}, veiculos = [] } = ctx;
  const { rival, parceiro } = lerRelacoes(estado);
  const [v1, v2] = doisVeiculos(veiculos);

  const dados = {
    pais: ficha.pais || 'a nação',
    capital: ficha.capital || 'a capital',
    presidente: ficha.presidente || 'Presidente',
    rival, parceiro, v1, v2, estado,
  };

  // Monta só os arquétipos que fazem sentido no estado atual.
  const vivos = ARQUETIPOS.map((f) => f(dados)).filter(Boolean);
  if (!vivos.length) return cartaMinima(dados, fioTema);

  // O fio-tema tem preferência: se há uma tensão viva sobre guerra, a reserva tenta
  // falar de guerra. É o mesmo princípio da IA — o fallback só é mais burro nele.
  let pool = vivos;
  if (fioTema?.tema) {
    const tema = String(fioTema.tema).toLowerCase();
    const casados = vivos.filter((c) => c.chaves.some((k) => tema.includes(k)));
    if (casados.length) pool = casados;
  }
  const semRepetir = pool.filter((c) => c.carta.titulo !== ultimoTitulo);
  const escolha = (semRepetir.length ? semRepetir : pool)[Math.floor(Math.random() * (semRepetir.length ? semRepetir.length : pool.length))];
  ultimoTitulo = escolha.carta.titulo;

  return {
    carta: { ...escolha.carta, id: `fb_${Date.now()}`, fio: fioTema?.id || null },
    feed: escolha.feed.map((p) => ({ ...p })),
    fios_update: [],
  };
}

// Rede embaixo da rede: nenhum arquétipo serviu (estado exótico). Ainda assim, com
// o nome certo do país e do presidente.
function cartaMinima({ pais, presidente }, fioTema) {
  return {
    carta: {
      id: `fb_min_${Date.now()}`,
      fio: fioTema?.id || null,
      pressiona: 'aprovacao',
      personagem: 'chefe_gabinete',
      titulo: 'A pauta da manhã',
      narrativa: `"Presidente ${presidente}, a imprensa de ${pais} quer uma posição sobre o rumo do governo até o fim do dia. Não é crise. Ainda."`,
      opcoes: [
        { texto: 'Falar com firmeza sobre o que já foi feito', efeitos: { aprovacao: 4, soft_power: 2 }, reacao_feed: 'discurso morno, recepção morna' },
        { texto: 'Anunciar uma meta ambiciosa e cobrar o próprio governo', efeitos: { aprovacao: 7, estabilidade: -3 }, politico: { autoridade: 2 }, reacao_feed: 'promessa alta gera esperança e dívida' },
        { texto: 'Não comentar — deixar o trabalho falar', efeitos: { aprovacao: -3, estabilidade: 2 }, reacao_feed: 'o silêncio também é resposta' },
      ],
    },
    feed: [],
    fios_update: [],
  };
}
