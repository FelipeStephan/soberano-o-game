// FICHA DO MUNDO — Vietnã, era 2026. Mesmo formato EXATO de src/dados/paises/bra.js.
//
// LÍDER FICTÍCIO: Trần Quốc Hưng. Personagem inventado (regra do projeto: o jogo tem
// missões de assassinato e não se modela violência contra pessoa viva real).
//
// País hoje NPC — este módulo é o rascunho pronto para promovê-lo a jogável.

export const PAIS_VNM = {
  ficha: {
    ano: 2026,
    pais: 'Vietnã',
    iso: 'VNM',
    presidente: 'Presidente Trần Quốc Hưng',
    capital: 'Hanói',
    bandeira: '⭐',
    pino: { lat: 21.03, lng: 105.85 },

    resumo: `O país que derrotou a França, os Estados Unidos e a China em três guerras num único
século — e depois virou a fábrica preferida das empresas americanas fugindo da China. Cem milhões
de pessoas, a economia que mais cresce no Sudeste Asiático, e uma diplomacia que os próprios
vietnamitas apelidam de "bambu": raiz firme no Partido Comunista, tronco sólido, e galhos que se
dobram para qualquer lado do vento sem quebrar. Comercia com Washington, compra arma de Moscou,
faz negócio com Pequim e briga com Pequim no mesmo mês pelas ilhas do Mar do Sul da China. Tem o
maior exército terrestre ativo do Sudeste Asiático, seis submarinos Kilo comprados da Rússia para
dar a Pequim o que pensar, e uma dependência quase total do fornecedor russo justo quando esse
fornecedor está ocupado numa guerra. O Partido caça a própria corrupção numa "fornalha ardente"
que já derrubou dois presidentes — e ninguém do lado de fora sabe direito quem manda de verdade.`,

    // Ponto de vista DO VIETNÃ. Sem chave própria (não há rel_vietna no catálogo padrão).
    relacoes: {
      rel_eua: 55,        // de inimigo mortal a "parceria estratégica abrangente": o comércio uniu o que a guerra separou
      rel_china: -20,     // maior parceiro comercial E o vizinho que toma ilha e afunda barco de pesca no Mar do Sul
      rel_ue: 45,         // acordo de livre comércio e mercado ávido por têxtil e eletrônico vietnamita
      rel_reino: 35,
      rel_russia: 60,     // o fornecedor histórico de arma: Kilo, Su-30, Bastion. A guerra na Ucrânia complicou tudo
      rel_india: 55,      // parceiro estratégico que treina submarinista vietnamita e vende o BrahMos
      rel_japao: 60,      // maior investidor e financiador de infraestrutura, sem passivo político
      rel_canada: 30,
      rel_australia: 45,
      rel_coreia: 55,     // Samsung fabrica metade dos seus celulares aqui; investimento gigante
      rel_israel: 40,     // fornece tecnologia militar e a licença do fuzil Galil que o Vietnã produz
      rel_ira: 15,
      rel_arabia: 20,
      rel_turquia: 20,
      rel_egito: 20,
      rel_indonesia: 45,  // sócios na ASEAN e rivais amistosos na pesca e no Mar do Sul
      rel_mexico: 20,
      rel_venezuela: 15,
      rel_ucrania: 5,     // equilíbrio delicado: depende da arma russa e não quer ofender ninguém
      rel_taiwan: 25,     // grande investidor em fábrica, sem relação formal — a política de "uma só China" pesa
      rel_paquistao: 20,
      rel_norte: 20,      // camaradas comunistas históricos, hoje um constrangimento discreto
      rel_brasil: 35,     // café, agro e Sul Global; comércio crescente, distância geográfica enorme
    },

    tensoes: [
      'Mar do Sul da China: ilhas artificiais e barco de pesca afundado',
      'Dependência da arma russa com o fornecedor preso numa guerra',
      'A "fornalha ardente" anticorrupção que derruba os próprios líderes',
      'Preso entre a fábrica americana e o vizinho e sócio chinês',
    ],

    estadoInicial: {
      aprovacao: 60,       // legitimidade via crescimento; Estado de partido único mede diferente
      estabilidade: 62,    // estável na superfície, purgas internas por baixo
      soft_power: 42,      // gastronomia, resiliência histórica e uma diplomacia admirada — subindo
      seguranca: 52,       // sem guerra ativa, mas o Mar do Sul da China ferve toda semana
      temp_guerra: 30,     // fricção naval constante com Pequim, sem tiro trocado
      temp_economia: 62,   // o boom manufatureiro do "China+1": todo mundo mudando a fábrica pra cá
      liberdades: 22,      // partido único, imprensa censurada, dissidente preso
      poder_militar: 52,   // o maior exército ativo do Sudeste Asiático, arsenal russo envelhecendo
      // economia (US$ trilhões)
      pib: 0.47,
      tesouro: 0.09,       // reservas ~US$ 90 bi
      divida: 37,          // dívida/PIB baixa e sob controle
      aliquota: 20,
      // capacidades (0–100)
      inteligencia: 45,    // a Tổng cục II, focada em China e em dissidência interna
      capacidade_ind: 50,  // montagem de eletrônico de ponta (Samsung, Apple) — mas ainda montagem
      uranio: 30,
      territorio: 1,
      ogivas: 0,
    },

    fiosSemente: [
      { tema: 'Mar do Sul da China: ilhas e frota pesqueira', intensidade: 58, alvo_pressao: 'seguranca', atores: ['china'] },
      { tema: 'Dependência da arma russa em guerra', intensidade: 50, alvo_pressao: 'poder_militar', atores: ['russia', 'eua'] },
      { tema: 'A fornalha ardente anticorrupção', intensidade: 48, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'China+1: o boom manufatureiro e seus gargalos', intensidade: 45, alvo_pressao: 'temp_economia', atores: ['eua', 'china', 'coreia'] },
    ],
  },

  // ORDEM DE BATALHA (aproximada). Exército terrestre grande e barato, marinha e aviação
  // de porte médio quase 100% de origem russa/soviética — e envelhecendo enquanto Moscou,
  // ocupada na Ucrânia, entrega peça e reposição a conta-gotas.
  forcas: {
    infantaria: 470000,   // um dos maiores efetivos ativos da Ásia; doutrina de defesa popular total
    blindados: 1500,      // massa de T-54/55 e T-62 soviéticos + ~64 T-90S modernos
    artilharia: 2000,     // vasto acervo rebocado e BM-21 Grad
    helicopteros: 140,    // Mi-8/17 e Mi-24 russos
    cacas: 75,            // Su-30MK2 (~35), Su-27 e Su-22 legados
    bombardeiros: 0,
    drones: 20,
    navios: 65,           // fragatas Gepard 3.9, corvetas Molniya, patrulheiros — frota costeira
    submarinos: 6,        // os seis Kilo classe 636 "Hanói": a resposta submersa a Pequim
    porta_avioes: 0,
    misseis: 100,         // Bastion costeiro (P-800 Oniks), Scud, Kh-35 antinavio
    defesa_aerea: 15,     // S-300PMU1, Spyder israelense, S-125 modernizado
    ogivas: 0,
  },

  empresas: [
    { id: 'pvn', nome: 'PetroVietnam', sigla: 'PVN', setor: 'Energia', estatal: true, participacao: 100, valor: 0.02, margem: 0.09,
      petroleo: 0.2, logo: null, bonus: { pib: 0.12, seguranca: 3 },
      desc: 'A estatal que bombeia petróleo dos campos offshore vietnamitas — muitos deles em blocos que Pequim reivindica no Mar do Sul da China. Cada plataforma é uma afirmação de soberania além de um poço, e mais de um contrato de exploração já foi cancelado sob pressão naval chinesa. Energia e geopolítica na mesma sonda.' },
    { id: 'viettel', nome: 'Viettel', setor: 'Telecom', estatal: true, participacao: 100, valor: 0.03, margem: 0.14,
      logo: null, bonus: { capacidade_ind: 4, inteligencia: 3 },
      desc: 'A maior teleco do país é do Exército — literalmente, propriedade do Ministério da Defesa. Opera em uma dúzia de países da África à América Latina, faz radar e rádio militar, e desenvolve o próprio 5G para não depender da Huawei nem de ninguém. O braço comercial das Forças Armadas, e o mais lucrativo.' },
    { id: 'vingroup', nome: 'Vingroup', sigla: 'VIC', setor: 'Conglomerado', estatal: false, participacao: 0, valor: 0.015, margem: 0.04,
      logo: null, bonus: { temp_economia: 3, capacidade_ind: 3 },
      desc: 'O conglomerado privado que faz de shopping a hospital, e apostou tudo na VinFast — a montadora de carro elétrico que abriu fábrica nos EUA e desafia a Tesla com dívida colossal. É a cara da ambição vietnamita de subir na cadeia de valor: parar de montar o produto dos outros e vender o próprio.' },
    { id: 'vcb', nome: 'Vietcombank', setor: 'Financeiro', estatal: true, participacao: 74, valor: 0.02, margem: 0.1,
      logo: null, bonus: { temp_economia: 3, estabilidade: 2 },
      desc: 'O banco mais valioso do país, com o Estado dono de três quartos. É por ele que passa o dinheiro do boom manufatureiro e o investimento estrangeiro que inunda o Vietnã. Quando o Partido quer que o crédito vá para onde importa, é aqui que decide.' },
    { id: 'hpg', nome: 'Hoa Phat', sigla: 'HPG', setor: 'Siderurgia', estatal: false, participacao: 0, valor: 0.008, margem: 0.08,
      logo: null, bonus: { capacidade_ind: 3, pib: 0.04 },
      desc: 'A maior siderúrgica do Sudeste Asiático, privada e faminta por crescer. Faz o aço que constrói a fábrica, a ponte e o arranha-céu do boom vietnamita — e sonha em fornecer chapa naval para a Marinha parar de depender de estaleiro estrangeiro. Aço é a espinha de qualquer país que queira industrializar de verdade.' },
  ],

  equipamentos: {
    _nome: 'Vietnã',
    // FOTOS VERIFICADAS no Wikimedia Commons (páginas de arquivo abertas e URL direta conferida):
    cacas:        { nome: 'Su-30MK2', fab: 'Sukhoi', origem: 'RUS', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Vietnamese_Su-30MK2.jpg' },
    navios:       { nome: 'Fragata Gepard 3.9', fab: 'Zelenodolsk', origem: 'RUS', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Gepard_3.9_frigate_Quang_Trung_%28016%29_of_Vietnam_People%27s_Navy_in_MILAN2022_-_1.jpg' },
    submarinos:   { nome: 'Submarino classe Kilo (Projeto 636 "Hanói")', fab: 'Estaleiros do Almirantado', origem: 'RUS', proprio: false,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Submarine_Kilo_class.jpg' },
    // SEM foto verificada — regra do projeto: não se inventa URL:
    blindados:    { nome: 'T-90S/SK', fab: 'Uralvagonzavod', origem: 'RUS', proprio: false, foto: null, sugerido: true },
    artilharia:   { nome: 'BM-21 Grad', fab: 'Splav', origem: 'RUS', proprio: false, foto: null, sugerido: true },
    infantaria:   { nome: 'Fuzileiro (STV-380, Galil ACE sob licença)', fab: 'Fábrica Z111', origem: 'ISR', proprio: 'licenca', foto: null, sugerido: true },
    helicopteros: { nome: 'Mi-171', fab: 'Kazan Helicopters', origem: 'RUS', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'K-300P Bastion-P (P-800 Oniks)', fab: 'NPO Mashinostroyeniya', origem: 'RUS', proprio: false, foto: null, sugerido: true },
    defesa_aerea: { nome: 'S-300PMU1', fab: 'Almaz-Antey', origem: 'RUS', proprio: false, foto: null, sugerido: true },
    drones:       { nome: 'VUA-SC-3G', fab: 'Viettel / Academia Militar', origem: 'VNM', proprio: true, foto: null, sugerido: true },
  },
};

/* AUXILIARES — snippets prontos pra colar nos arquivos de src/dados/ quando VNM virar jogável.
   (NÃO editar src/ neste lote — só referência.)

// ── src/dados/paises.js → PAISES ──────────────────────────────────────
VNM: { nome: 'Vietnã',           rel: 'rel_vietna', bloco: 'Não-alinhado',     forca: 50 },
// Artigo (paises.js → ARTIGO): 'Vietnã': 'o'  → "do Vietnã", "com o Vietnã"

// ── src/dados/efetivoMilitar.js ───────────────────────────────────────
// Efetivo ativo enorme + doutrina de defesa popular: reserva/milícia mobilizável na casa dos milhões
VNM: 470000,   // em EFETIVO_ATIVO
VNM: 2000000,  // em RESERVA_MILITAR (reserva + força de autodefesa; teto de mobilização muito maior)

// ── src/dados/petroleo.js → PETROLEO ──────────────────────────────────
// Produtor offshore em declínio; consumo cresce com a indústria; campos em blocos disputados no Mar do Sul
VNM: { reservas: 4.4, producao: 0.2, consumo: 0.5, custo: 30, tipo: 'Leve doce', campo: 'Bạch Hổ (Tigre Branco)',
       nota: 'Produz petróleo offshore desde os anos 80 no campo Tigre Branco, mas a produção cai e o consumo da indústria sobe — virou importador líquido. E muitos blocos novos ficam em águas que Pequim reivindica: cada perfuração é um teste de nervos naval.' },

// ── src/dados/gabinetes.js → GABINETES (5 conselheiros, ids estáveis, NOMES FICTÍCIOS) ──
VNM: [
  { id: 'sec_defesa', papel: 'Ministro da Defesa Nacional', nome: 'General Phạm Văn Cường',
    personalidade: 'Comanda o maior exército terrestre da região e o arsenal russo que envelhece na sua mão. Sabe que os seis Kilo são o que faz Pequim pensar duas vezes — e que Moscou, atolada na Ucrânia, não entrega mais peça no prazo. "A defesa do povo é infinita, presidente. O estoque de sobressalente, não."' },
  { id: 'dir_cia', papel: 'Diretor da Tổng cục II (Inteligência de Defesa)', nome: 'Lê Minh Đức',
    personalidade: 'Vigia dois inimigos ao mesmo tempo: o vizinho do norte que reivindica o mar, e o dissidente interno que o Partido teme mais que qualquer marinha. Conhece cada movimento da frota pesqueira chinesa e cada blogueiro que precisa desaparecer. "O senhor pergunta de onde vem a ameaça. A resposta é: das duas direções, sempre."' },
  { id: 'sec_tesouro', papel: 'Ministra das Finanças', nome: 'Trần Thị Hồng',
    personalidade: 'Administra a economia que mais cresce no Sudeste Asiático e reza para o dinheiro da fábrica americana continuar chegando. Sabe que o "China+1" é oportunidade e armadilha: montar iPhone paga a conta, mas não faz o Vietnã dono de nada. "Crescemos montando o produto dos outros, presidente. A próxima década é sobre ter o nosso."' },
  { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Nguyễn Hoàng Nam',
    personalidade: 'O mestre da diplomacia do bambu: dobra-se para Washington, Moscou e Pequim sem quebrar com nenhum. Recebe porta-aviões americano numa semana e ministro chinês na outra, e considera isso a maior arte de Estado do país. "Não escolhemos lado, senhor. Escolher lado é como um país pequeno morre."' },
  { id: 'chefe_gabinete', papel: 'Chefe do Gabinete do Comitê Central do Partido', nome: 'Đỗ Quang Huy',
    personalidade: 'A pessoa que sabe onde a "fornalha ardente" vai queimar em seguida — a campanha anticorrupção que já derrubou dois presidentes e reorganiza o poder por baixo do pano. Não mede aprovação, mede quem subiu e quem sumiu do Politburo. Fala do Secretário-Geral em voz baixa. "O senhor preside o Estado. O Partido é outra conversa."' },
],
*/
