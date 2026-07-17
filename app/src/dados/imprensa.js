// A IMPRENSA POR PAÍS — marcas reais (protótipo local, sem fins comerciais).
//
// Mesmo formato de veiculos.js, e isso não é coincidência: as funções alinhamento(),
// tomDaCobertura(), investirNaMidia() e decairSimpatia() de lá esperam exatamente
// { nome, handle, dominio, cor, pais, posicao, eixo: { economico, autoridade }, simpatia, vies }.
// Qualquer objeto daqui pode ser passado direto para tomDaCobertura(v, estado).
//
// `eixo`: onde o veículo se situa (economico -100..+100, autoridade -100..+100).
//   NÃO é a opinião dele sobre você — é a linha editorial dele. Um jornal de esquerda
//   te elogia se você é estatista; um de direita, se é liberal. tomDaCobertura() faz a conta.
// `simpatia`: 0 hostil · 50 neutro · 100 comprado.
//
// ── SOBRE A SIMPATIA INICIAL ──────────────────────────────────────────
// A imprensa de casa começa acima de 50 (60–75) quando é estatal ou dócil por lei, e
// abaixo quando é imprensa de oposição sobrevivente. Estrangeiro começa em 50: ninguém
// no exterior te conhece ainda. Estatal russo, chinês, iraniano e norte-coreano começa
// alto por construção — não porque gostam de você, mas porque não têm alternativa.

const eixo = (economico, autoridade) => ({ economico, autoridade });

export const IMPRENSA_POR_PAIS = {
  // ═══ USA ═══
  USA: [
    { nome: 'The New York Times', handle: '@nytimes', dominio: 'nytimes.com', cor: '#000000', pais: 'EUA',
      posicao: 'Centro-esquerda', eixo: eixo(-20, -40), simpatia: 50,
      vies: 'Institucional, extenso, moralmente confiante. Defende direitos, instituições e norma democrática. Investiga com paciência e publica no pior dia possível pra você.' },
    { nome: 'The Washington Post', handle: '@washingtonpost', dominio: 'washingtonpost.com', cor: '#231f20', pais: 'EUA',
      posicao: 'Centro-esquerda', eixo: eixo(-10, -40), simpatia: 50,
      vies: 'Obcecado por Washington: fonte anônima, vazamento e briga interna de gabinete. Se alguém aqui falar com a imprensa, é com eles.' },
    { nome: 'The Wall Street Journal', handle: '@WSJ', dominio: 'wsj.com', cor: '#0274b6', pais: 'EUA',
      posicao: 'Direita econômica', eixo: eixo(75, 15), simpatia: 50,
      vies: 'Redação seca e página de opinião conservadora — duas revistas grampeadas juntas. Aplaude corte de imposto e desregulação; despreza gasto, tarifa e populismo.' },
    { nome: 'MSNBC', handle: '@MSNBC', dominio: 'msnbc.com', cor: '#6460aa', pais: 'EUA',
      posicao: 'Esquerda', eixo: eixo(-50, -55), simpatia: 45,
      vies: 'Opinião em horário nobre, indignação como formato. Progressista, alérgico a autoritarismo e a aventura militar. Fala pra base, não pro centro.' },
    { nome: 'The New York Post', handle: '@nypost', dominio: 'nypost.com', cor: '#c60800', pais: 'EUA',
      posicao: 'Direita popular', eixo: eixo(50, 50), simpatia: 50,
      vies: 'Tabloide. Manchete de trocadilho, crime na capa, escândalo sem contexto. Não te derruba com argumento — te derruba com apelido que gruda.' },
  ],

  // ═══ CHN ═══
  CHN: [
    { nome: 'Xinhua', handle: '@XHNews', dominio: 'news.cn', cor: '#c8102e', pais: 'China',
      posicao: 'Estatal', eixo: eixo(-25, 85), simpatia: 75,
      vies: 'Agência oficial. Não noticia, promulga. Tom de comunicado: harmonia, desenvolvimento, estabilidade. O que ela omite é a notícia.' },
    { nome: 'Global Times', handle: '@globaltimesnews', dominio: 'globaltimes.cn', cor: '#e60012', pais: 'China',
      posicao: 'Nacionalista estatal', eixo: eixo(-15, 80), simpatia: 70,
      vies: 'O punho do Partido quando o Partido quer bater sem assinar. Nacionalista, sarcástico, provocador. Ameaça em editorial o que a chancelaria nega em coletiva.' },
    { nome: 'People’s Daily', handle: '@PDChina', dominio: 'people.cn', cor: '#b01116', pais: 'China',
      posicao: 'Órgão do Partido', eixo: eixo(-35, 90), simpatia: 78,
      vies: 'Órgão oficial do Comitê Central. A ordem em que os nomes aparecem na primeira página é a única informação real. Ilegível de propósito.' },
    { nome: 'Caixin', handle: '@caixin', dominio: 'caixinglobal.com', cor: '#00559a', pais: 'China',
      posicao: 'Liberal econômico (tolerado)', eixo: eixo(55, 20), simpatia: 45,
      vies: 'O jornalismo econômico que o sistema tolera porque precisa de números reais. Publica dívida provincial e fraude corporativa até a linha onde some do ar por uns dias.' },
    { nome: 'South China Morning Post', handle: '@SCMPNews', dominio: 'scmp.com', cor: '#00457c', pais: 'Hong Kong',
      posicao: 'Centro (Hong Kong)', eixo: eixo(30, 15), simpatia: 50,
      vies: 'Hong Kong: explica a China ao mundo em inglês, dentro do limite. Bem informado, cauteloso, cada vez mais cuidadoso. O que sobrou do meio-termo.' },
  ],

  // ═══ RUS ═══
  RUS: [
    { nome: 'RT', handle: '@RT_com', dominio: 'rt.com', cor: '#33aa00', pais: 'Rússia',
      posicao: 'Estatal / propaganda externa', eixo: eixo(-20, 75), simpatia: 78,
      vies: 'Não te informa, te confunde. Existe pra dizer que o Ocidente é hipócrita e que a verdade é inacessível. Fala com o estrangeiro descontente, não com o russo.' },
    { nome: 'TASS', handle: '@tassagency_en', dominio: 'tass.com', cor: '#0057b8', pais: 'Rússia',
      posicao: 'Agência estatal', eixo: eixo(-25, 80), simpatia: 80,
      vies: 'Agência do Estado desde 1904 e nunca precisou mudar o método. Seca, protocolar, e a frase "segundo o Ministério da Defesa" faz todo o trabalho pesado.' },
    { nome: 'Novaya Gazeta', handle: '@novaya_gazeta', dominio: 'novayagazeta.eu', cor: '#d0021b', pais: 'Rússia (exílio)',
      posicao: 'Oposição liberal', eixo: eixo(20, -70), simpatia: 20,
      vies: 'Enterrou seis jornalistas e publica de fora do país. Não faz oposição: faz necrologia. Custa caro ler e custou mais escrever.' },
    { nome: 'Kommersant', handle: '@kommersant', dominio: 'kommersant.ru', cor: '#003a70', pais: 'Rússia',
      posicao: 'Econômico / elite', eixo: eixo(50, 30), simpatia: 55,
      vies: 'Jornal dos donos do dinheiro. Sabe onde estão os ativos e quem perdeu o quê. Não critica o Kremlin — critica quem no Kremlin está atrapalhando o negócio.' },
    { nome: 'Meduza', handle: '@meduzaproject', dominio: 'meduza.io', cor: '#1f6feb', pais: 'Rússia (Letônia)',
      posicao: 'Oposição / exílio', eixo: eixo(30, -65), simpatia: 25,
      vies: 'Redação russa em Riga, declarada "indesejável" — ler já é risco. Rápida, digital, sem ilusão de retorno. Fala pra quem ficou e não pode dizer nada.' },
  ],

  // ═══ IND ═══
  IND: [
    { nome: 'The Times of India', handle: '@timesofindia', dominio: 'timesofindia.indiatimes.com', cor: '#c00000', pais: 'Índia',
      posicao: 'Centro-direita popular', eixo: eixo(45, 30), simpatia: 55,
      vies: 'O maior jornal em inglês do mundo e nunca deixou isso subir à cabeça — celebridade, crime e patriotismo na mesma página. Publieditorial disfarçado é modelo de negócio.' },
    { nome: 'The Hindu', handle: '@the_hindu', dominio: 'thehindu.com', cor: '#00478f', pais: 'Índia',
      posicao: 'Centro-esquerda', eixo: eixo(-40, -35), simpatia: 45,
      vies: 'Sóbrio, quase acadêmico, com uma tradição de esquerda nehruviana que nunca abandonou. Cobra política pública e checa número. Chato de propósito e orgulhoso disso.' },
    { nome: 'NDTV', handle: '@ndtv', dominio: 'ndtv.com', cor: '#e4002b', pais: 'Índia',
      posicao: 'Centro (pós-aquisição)', eixo: eixo(35, 20), simpatia: 55,
      vies: 'Já foi a redação mais independente da TV indiana. Comprada por um conglomerado próximo do poder e ainda ajustando a voz. O que sobrou do incômodo é de bom nível.' },
    { nome: 'Republic TV', handle: '@republic', dominio: 'republicworld.com', cor: '#f5a623', pais: 'Índia',
      posicao: 'Direita nacionalista', eixo: eixo(40, 65), simpatia: 65,
      vies: 'Gritaria com sete telas simultâneas e o Paquistão como convidado permanente. Não entrevista, julga. Mede lealdade nacional em decibéis.' },
    { nome: 'The Wire', handle: '@thewire_in', dominio: 'thewire.in', cor: '#c72026', pais: 'Índia',
      posicao: 'Esquerda / independente', eixo: eixo(-55, -60), simpatia: 30,
      vies: 'Digital, sem dono e por isso sem anunciante. Vive de processo, batida da polícia fiscal e doação de leitor. Publica o que os grandes já sabiam.' },
  ],

  // ═══ BRA ═══
  BRA: [
    { nome: 'O Globo', handle: '@JornalOGlobo', dominio: 'oglobo.globo.com', cor: '#0d4c8f', pais: 'Brasil',
      posicao: 'Centro-direita', eixo: eixo(40, 10), simpatia: 50,
      vies: 'Liberal na economia, institucionalista na política. Cobra responsabilidade fiscal e critica aventura militar. Tem a memória mais longa da imprensa brasileira e usa.' },
    { nome: 'Folha de S.Paulo', handle: '@folha', dominio: 'folha.uol.com.br', cor: '#0a5fa8', pais: 'Brasil',
      posicao: 'Centro', eixo: eixo(30, -20), simpatia: 50,
      vies: 'Apartidarismo como doutrina e como escudo: bate nos dois lados e chama isso de método. Boa apuração, editorial ambíguo. Vaza gabinete melhor que ninguém.' },
    { nome: 'Veja', handle: '@VEJA', dominio: 'veja.abril.com.br', cor: '#e8112d', pais: 'Brasil',
      posicao: 'Direita', eixo: eixo(60, 35), simpatia: 50,
      vies: 'Capa como sentença. Anticorrupção quando é do outro lado, liberal na economia, dura com a esquerda. Publica primeiro e verifica no processo.' },
    { nome: 'O Estado de S. Paulo', handle: '@Estadao', dominio: 'estadao.com.br', cor: '#00539f', pais: 'Brasil',
      posicao: 'Centro-direita liberal', eixo: eixo(55, 0), simpatia: 50,
      vies: 'Liberal clássico, quase vitoriano. Defende mercado, Constituição e boas maneiras institucionais. Escreve bem e se importa mais com isso do que com clique.' },
    { nome: 'CartaCapital', handle: '@cartacapital', dominio: 'cartacapital.com.br', cor: '#d8232a', pais: 'Brasil',
      posicao: 'Esquerda', eixo: eixo(-60, -35), simpatia: 45,
      vies: 'Esquerda intelectual. Defende Estado indutor, política social e soberania nacional. Vê a grande imprensa como parte do problema e diz isso toda semana.' },
    { nome: 'Brasil 247', handle: '@brasil247', dominio: 'brasil247.com', cor: '#d40000', pais: 'Brasil',
      posicao: 'Esquerda militante', eixo: eixo(-70, -25), simpatia: 45,
      vies: 'Militante, digital, sem pretensão de equilíbrio. Anti-imperialista, pró-BRICS, hostil ao mercado. Manchete é palavra de ordem.' },
  ],

  // ═══ DEU ═══
  DEU: [
    { nome: 'Der Spiegel', handle: '@derspiegel', dominio: 'spiegel.de', cor: '#e64415', pais: 'Alemanha',
      posicao: 'Centro-esquerda', eixo: eixo(-30, -45), simpatia: 45,
      vies: 'Investigação pesada e tom de censor moral. Cem checadores de fato e nenhuma paciência. Quando publica sobre você, já falou com todos nesta sala.' },
    { nome: 'Frankfurter Allgemeine (FAZ)', handle: '@faznet', dominio: 'faz.net', cor: '#1a1a1a', pais: 'Alemanha',
      posicao: 'Centro-direita', eixo: eixo(60, 10), simpatia: 50,
      vies: 'Conservador-liberal, denso, econômico. Freio da dívida é artigo de fé. Escreve frases longas de propósito, pra separar o leitor sério do resto.' },
    { nome: 'Bild', handle: '@BILD', dominio: 'bild.de', cor: '#e30613', pais: 'Alemanha',
      posicao: 'Direita popular', eixo: eixo(40, 55), simpatia: 50,
      vies: 'Tabloide de maior tiragem da Europa. Manchete de três palavras, letra garrafal. Faz e destrói chanceler com base no humor da semana. Ninguém admite ler.' },
    { nome: 'Süddeutsche Zeitung', handle: '@SZ', dominio: 'sueddeutsche.de', cor: '#003c76', pais: 'Alemanha',
      posicao: 'Centro-esquerda', eixo: eixo(-35, -40), simpatia: 45,
      vies: 'Social-liberal, munique. Especialista em vazamento internacional gigante. Defende Estado social e liberdades civis; desconfia de qualquer coisa com uniforme.' },
    { nome: 'Die Zeit', handle: '@DIEZEIT', dominio: 'zeit.de', cor: '#c8102e', pais: 'Alemanha',
      posicao: 'Centro liberal', eixo: eixo(10, -30), simpatia: 50,
      vies: 'Semanal, ensaístico, ponderado até o limite da inércia. Publica os dois lados lado a lado e deixa a conclusão pro leitor. Nunca teve pressa na vida.' },
  ],

  // ═══ FRA ═══
  FRA: [
    { nome: 'Le Monde', handle: '@lemondefr', dominio: 'lemonde.fr', cor: '#1a1a1a', pais: 'França',
      posicao: 'Centro-esquerda', eixo: eixo(-25, -35), simpatia: 45,
      vies: 'Jornal de referência, tom professoral. Não dá manchete, dá análise. Propriedade dos jornalistas o bastante pra morder a mão do Eliseu quando quer.' },
    { nome: 'Le Figaro', handle: '@Le_Figaro', dominio: 'lefigaro.fr', cor: '#1c3f94', pais: 'França',
      posicao: 'Direita', eixo: eixo(60, 40), simpatia: 50,
      vies: 'Direita gaulista e burguesa. Ordem, nação, mercado e boa mesa. Defende as forças armadas, a laicidade dura e a França como ideia. O jornal mais antigo do país.' },
    { nome: 'Libération', handle: '@libe', dominio: 'liberation.fr', cor: '#e2001a', pais: 'França',
      posicao: 'Esquerda', eixo: eixo(-60, -55), simpatia: 45,
      vies: 'Nascido de 1968 e nunca curado disso. Capa com trocadilho, causa social e desconfiança de polícia. Defende migrante, greve e liberdade de imprensa — a própria, primeiro.' },
    { nome: 'Mediapart', handle: '@mediapart', dominio: 'mediapart.fr', cor: '#e94e1b', pais: 'França',
      posicao: 'Esquerda / investigativo', eixo: eixo(-65, -50), simpatia: 35,
      vies: 'Só assinatura, zero anúncio, zero medo. Especializado em derrubar ministro com documento escaneado. Não pede entrevista — informa que vai publicar.' },
    { nome: 'France 24', handle: '@FRANCE24', dominio: 'france24.com', cor: '#0055a4', pais: 'França',
      posicao: 'Centro / estatal externa', eixo: eixo(15, -10), simpatia: 60,
      vies: 'Financiada pelo Estado pra explicar a França ao mundo em quatro línguas. Profissional, factual, e nunca contra o interesse francês por acidente.' },
  ],

  // ═══ GBR ═══
  GBR: [
    { nome: 'BBC News', handle: '@BBCWorld', dominio: 'bbc.com', cor: '#bb1919', pais: 'Reino Unido',
      posicao: 'Centro', eixo: eixo(0, -15), simpatia: 50,
      vies: 'Sóbrio, britânico, factual. Não se empolga nem se revolta: contextualiza, pondera e cobra provas. Alérgico a retórica.' },
    { nome: 'The Guardian', handle: '@guardian', dominio: 'theguardian.com', cor: '#052962', pais: 'Reino Unido',
      posicao: 'Esquerda', eixo: eixo(-55, -50), simpatia: 45,
      vies: 'Esquerda progressista. Defende liberdades civis, meio ambiente e Estado social. Detesta vigilância, repressão e guerra. Moralista quando quer.' },
    { nome: 'The Times', handle: '@thetimes', dominio: 'thetimes.co.uk', cor: '#1a1a1a', pais: 'Reino Unido',
      posicao: 'Centro-direita', eixo: eixo(55, 20), simpatia: 50,
      vies: 'Estabelecimento puro. Fala com quem decide e é lido por quem decide. Conservador sem estridência: prefere o memorando ao megafone.' },
    { nome: 'Daily Mail', handle: '@DailyMailUK', dominio: 'dailymail.co.uk', cor: '#004db3', pais: 'Reino Unido',
      posicao: 'Direita popular', eixo: eixo(45, 60), simpatia: 50,
      vies: 'Tabloide de classe média irritada. Migração, crime e imposto, nessa ordem, todo dia. Persegue alvo por semanas. Mais poder eleitoral que qualquer editorial sério.' },
    { nome: 'Financial Times', handle: '@FT', dominio: 'ft.com', cor: '#e5b98a', pais: 'Reino Unido',
      posicao: 'Liberal econômico', eixo: eixo(70, -10), simpatia: 50,
      vies: 'Econômico e frio. Só se importa com mercados, dívida, juros e risco. Aplaude reforma e disciplina fiscal; despreza populismo de qualquer lado.' },
  ],

  // ═══ JPN ═══
  JPN: [
    { nome: 'NHK', handle: '@NHK_PR', dominio: 'nhk.or.jp', cor: '#0072bc', pais: 'Japão',
      posicao: 'Público / centro', eixo: eixo(10, 20), simpatia: 62,
      vies: 'Emissora pública financiada por taxa e sensível a quem aprova o orçamento dela. Impecável em desastre natural, cautelosa em política. Nunca constrange ninguém.' },
    { nome: 'Asahi Shimbun', handle: '@asahi', dominio: 'asahi.com', cor: '#c8102e', pais: 'Japão',
      posicao: 'Centro-esquerda', eixo: eixo(-35, -45), simpatia: 45,
      vies: 'Liberal, pacifista, guardião do Artigo 9. Cada rearmamento é editorial de primeira página. A direita o odeia com uma constância comovente.' },
    { nome: 'Yomiuri Shimbun', handle: '@Yomiuri_Online', dominio: 'yomiuri.co.jp', cor: '#003f88', pais: 'Japão',
      posicao: 'Centro-direita', eixo: eixo(45, 40), simpatia: 58,
      vies: 'Maior tiragem do planeta e conservador sem pedir licença. Defende aliança com os EUA, defesa robusta e revisão constitucional. Alinhado ao governo por convicção, não por medo.' },
    { nome: 'Nikkei', handle: '@nikkei', dominio: 'nikkei.com', cor: '#1e4e79', pais: 'Japão',
      posicao: 'Liberal econômico', eixo: eixo(70, 5), simpatia: 50,
      vies: 'Só negócio, e o melhor do mundo nisso. Cadeia de suprimento, semicondutor, iene, dívida. Trata política como variável que afeta o balanço.' },
    { nome: 'Mainichi Shimbun', handle: '@mainichi', dominio: 'mainichi.jp', cor: '#00a0e9', pais: 'Japão',
      posicao: 'Centro-esquerda', eixo: eixo(-25, -35), simpatia: 48,
      vies: 'Liberal e investigativo, o menor dos três grandes e o mais disposto a chatear. Escândalo de gabinete é a especialidade da casa.' },
  ],

  // ═══ KOR ═══
  KOR: [
    { nome: 'Chosun Ilbo', handle: '@chosun', dominio: 'chosun.com', cor: '#003876', pais: 'Coreia do Sul',
      posicao: 'Direita', eixo: eixo(60, 45), simpatia: 55,
      vies: 'Conservador e influente até o desconforto. Linha dura com Pyongyang, aliança americana como dogma, desconfiança de tudo que venha de Pequim. Faz e desfaz reputação.' },
    { nome: 'The Hankyoreh', handle: '@hankyoreh', dominio: 'hani.co.kr', cor: '#e6002d', pais: 'Coreia do Sul',
      posicao: 'Esquerda', eixo: eixo(-55, -55), simpatia: 42,
      vies: 'Fundado por jornalistas demitidos pela ditadura, com dinheiro de leitor. Progressista, pró-diálogo com o Norte, crítico dos chaebols e do Japão. Carrega a origem como bandeira.' },
    { nome: 'JoongAng Ilbo', handle: '@joongangilbo', dominio: 'joongang.co.kr', cor: '#0067b1', pais: 'Coreia do Sul',
      posicao: 'Centro-direita', eixo: eixo(50, 25), simpatia: 52,
      vies: 'Conservador de tom moderado, nascido na órbita da Samsung. Aplaude exportação e estabilidade. Cuidadoso com o que afeta o índice.' },
    { nome: 'KBS', handle: '@KBS', dominio: 'kbs.co.kr', cor: '#1c4b9c', pais: 'Coreia do Sul',
      posicao: 'Público', eixo: eixo(5, 15), simpatia: 60,
      vies: 'Emissora pública cuja direção muda de cor a cada eleição, e a cobertura junto. Todo mundo sabe disso, inclusive ela.' },
    { nome: 'Yonhap', handle: '@YonhapNews', dominio: 'yna.co.kr', cor: '#0b4ea2', pais: 'Coreia do Sul',
      posicao: 'Agência / semi-oficial', eixo: eixo(15, 20), simpatia: 60,
      vies: 'Agência com subvenção estatal. Primeira a dar qualquer coisa sobre o Norte, sempre com "segundo fontes militares". Seca por obrigação.' },
  ],

  // ═══ ISR ═══
  ISR: [
    { nome: 'Haaretz', handle: '@haaretzcom', dominio: 'haaretz.com', cor: '#1a1a1a', pais: 'Israel',
      posicao: 'Esquerda', eixo: eixo(-30, -70), simpatia: 30,
      vies: 'A consciência incômoda do país e o jornal mais odiado dentro dele. Chama ocupação de ocupação. Lido religiosamente pela elite que finge não ler.' },
    { nome: 'The Jerusalem Post', handle: '@Jerusalem_Post', dominio: 'jpost.com', cor: '#003c71', pais: 'Israel',
      posicao: 'Centro-direita', eixo: eixo(50, 35), simpatia: 58,
      vies: 'Escreve em inglês pro apoiador lá fora. Segurança primeiro, contexto depois, dúvida nunca. É a versão de Israel que Israel quer exportar.' },
    { nome: 'Channel 12 (N12)', handle: '@N12News', dominio: 'n12.co.il', cor: '#e30613', pais: 'Israel',
      posicao: 'Centro popular', eixo: eixo(30, 15), simpatia: 50,
      vies: 'A TV que o país inteiro assiste às 20h. Faz e destrói governo com pesquisa de audiência. Emocional, rápida, e o comentarista militar dela tem mais influência que ministro.' },
    { nome: 'Yedioth Ahronoth', handle: '@YediothNews', dominio: 'ynetnews.com', cor: '#c8102e', pais: 'Israel',
      posicao: 'Centro', eixo: eixo(25, 10), simpatia: 48,
      vies: 'Popular e onipresente, com uma rixa de décadas contra a direita midiática. Manchete grande, luto nacional bem produzido, campanha pessoal quando quer.' },
    { nome: 'Israel Hayom', handle: '@Israel_Hayom', dominio: 'israelhayom.com', cor: '#0057a8', pais: 'Israel',
      posicao: 'Direita', eixo: eixo(45, 55), simpatia: 68,
      vies: 'Gratuito, financiado por mecenas, distribuído em cada esquina. Existe pra apoiar um lado e não faz mistério. O preço é zero e o valor editorial também.' },
  ],

  // ═══ IRN ═══
  IRN: [
    { nome: 'IRNA', handle: '@irna_1313', dominio: 'irna.ir', cor: '#006633', pais: 'Irã',
      posicao: 'Agência estatal', eixo: eixo(-20, 80), simpatia: 72,
      vies: 'Agência oficial ligada ao governo. Protocolar, previsível, útil só pelo que decide publicar. Discurso na íntegra, contexto zero.' },
    { nome: 'Press TV', handle: '@PressTV', dominio: 'presstv.ir', cor: '#0e7c3a', pais: 'Irã',
      posicao: 'Estatal / propaganda externa', eixo: eixo(-30, 75), simpatia: 78,
      vies: 'Em inglês, pro exterior. Anti-imperialista, anti-Israel, com convidados que ninguém mais convida. Banida em metade do Ocidente, o que ela usa como credencial.' },
    { nome: 'Fars News', handle: '@FarsNews_Agency', dominio: 'farsnews.ir', cor: '#004c99', pais: 'Irã',
      posicao: 'Linha dura (IRGC)', eixo: eixo(-25, 88), simpatia: 65,
      vies: 'Perto da Guarda Revolucionária, e a Guarda não responde ao presidente. Publica ameaça antes de virar política. Quando ela ataca o governo, o governo é o iraniano.' },
    { nome: 'Etemad', handle: '@EtemadOnline', dominio: 'etemadonline.com', cor: '#8b0000', pais: 'Irã',
      posicao: 'Reformista', eixo: eixo(25, -30), simpatia: 38,
      vies: 'Reformista dentro do espaço que sobra, e o espaço encolhe. Defende negociação e abertura em linguagem cifrada. Já foi fechado e reaberto mais de uma vez.' },
    { nome: 'Iran International', handle: '@IranIntl', dominio: 'iranintl.com', cor: '#00a3e0', pais: 'Irã (exílio)',
      posicao: 'Oposição / exílio', eixo: eixo(40, -70), simpatia: 12,
      vies: 'Transmite de Londres com dinheiro do Golfo e Teerã chama de operação hostil. Fala direto com a rua iraniana por satélite e celular. Hostil por definição de existência.' },
  ],

  // ═══ TUR ═══
  TUR: [
    { nome: 'Anadolu Agency', handle: '@anadoluagency', dominio: 'aa.com.tr', cor: '#005baa', pais: 'Turquia',
      posicao: 'Agência estatal', eixo: eixo(10, 65), simpatia: 74,
      vies: 'Agência do Estado com ambição global. Boa em Síria, Líbia e Cáucaso porque está lá. Nunca contraria Ancara e não vê nisso um problema.' },
    { nome: 'Daily Sabah', handle: '@DailySabah', dominio: 'dailysabah.com', cor: '#0a3d62', pais: 'Turquia',
      posicao: 'Pró-governo', eixo: eixo(20, 70), simpatia: 72,
      vies: 'Em inglês, pro leitor estrangeiro. Explica por que a Turquia sempre está certa. Chama a oposição de golpista e o Ocidente de hipócrita — às vezes tem razão.' },
    { nome: 'Hürriyet', handle: '@Hurriyet', dominio: 'hurriyet.com.tr', cor: '#e30613', pais: 'Turquia',
      posicao: 'Centro-direita (alinhado)', eixo: eixo(40, 45), simpatia: 62,
      vies: 'Já foi o jornal de referência kemalista. Mudou de dono, mudou de tom, e agora é secular no discurso e obediente na prática.' },
    { nome: 'Cumhuriyet', handle: '@cumhuriyetgzt', dominio: 'cumhuriyet.com.tr', cor: '#b3001b', pais: 'Turquia',
      posicao: 'Kemalista / oposição', eixo: eixo(-30, -50), simpatia: 25,
      vies: 'Fundado em 1924 e nunca soube ficar quieto. Secularista, republicano, e com metade da redação já processada. Cada edição é um ato de teimosia.' },
    { nome: 'Sözcü', handle: '@gazetesozcu', dominio: 'sozcu.com.tr', cor: '#d81e05', pais: 'Turquia',
      posicao: 'Oposição nacionalista', eixo: eixo(-20, -20), simpatia: 28,
      vies: 'Nacionalista, laico e furiosamente anti-governo — combinação que só existe aqui. Popular, direto, sem sutileza. Vive de multa.' },
  ],

  // ═══ SAU ═══
  SAU: [
    { nome: 'Al Arabiya', handle: '@AlArabiya_Eng', dominio: 'alarabiya.net', cor: '#004b87', pais: 'Arábia Saudita',
      posicao: 'Alinhado ao Reino', eixo: eixo(45, 60), simpatia: 74,
      vies: 'Criada pra ser a resposta saudita à Al Jazeera e cumpre o papel. Hostil ao Irã, hostil à Irmandade, elegante na produção. O Reino nunca erra na tela dela.' },
    { nome: 'Saudi Press Agency (SPA)', handle: '@spagov', dominio: 'spa.gov.sa', cor: '#006c35', pais: 'Arábia Saudita',
      posicao: 'Agência estatal', eixo: eixo(35, 75), simpatia: 82,
      vies: 'Agência do Estado. Decreto real, recepção de dignitário, corte de fita. Não há notícia, há registro. A ordem dos nomes é a única informação.' },
    { nome: 'Arab News', handle: '@arabnews', dominio: 'arabnews.com', cor: '#00553a', pais: 'Arábia Saudita',
      posicao: 'Alinhado / vitrine internacional', eixo: eixo(50, 45), simpatia: 70,
      vies: 'Em inglês, pra investidor e diplomata. Vende reforma, megaprojeto e modernização. Bem escrito e cuidadosamente incompleto.' },
    { nome: 'Asharq Al-Awsat', handle: '@aawsat_News', dominio: 'aawsat.com', cor: '#1b5e20', pais: 'Arábia Saudita (Londres)',
      posicao: 'Pan-árabe / conservador', eixo: eixo(45, 40), simpatia: 65,
      vies: 'Editado em Londres, financiado em Riade, lido em todo mundo árabe. Sofisticado, conservador, e a linha vermelha é sempre a mesma família.' },
  ],

  // ═══ EGY ═══
  EGY: [
    { nome: 'Al-Ahram', handle: '@AlAhramGate', dominio: 'ahram.org.eg', cor: '#00693e', pais: 'Egito',
      posicao: 'Estatal', eixo: eixo(-10, 70), simpatia: 76,
      vies: 'Fundado em 1875 e estatal desde 1960. O jornal mais influente do mundo árabe virou boletim. A primeira página é uma foto e um adjetivo.' },
    { nome: 'Egypt Independent', handle: '@EgIndependent', dominio: 'egyptindependent.com', cor: '#1a5276', pais: 'Egito',
      posicao: 'Centro / tolerado', eixo: eixo(25, 10), simpatia: 45,
      vies: 'Em inglês, mais espaço que a imprensa árabe local porque quase ninguém lê em casa. Cobre economia e sociedade; para no portão do quartel.' },
    { nome: 'Mada Masr', handle: '@MadaMasr', dominio: 'madamasr.com', cor: '#e74c3c', pais: 'Egito',
      posicao: 'Independente / oposição', eixo: eixo(-40, -65), simpatia: 18,
      vies: 'Bloqueada dentro do país e lida por VPN. Publica sobre os negócios do exército, que é a única matéria proibida de verdade. Redação já foi presa inteira e voltou.' },
    { nome: 'Al-Masry Al-Youm', handle: '@AlMasryAlYoum', dominio: 'almasryalyoum.com', cor: '#c0392b', pais: 'Egito',
      posicao: 'Privado / cauteloso', eixo: eixo(30, 25), simpatia: 50,
      vies: 'Privado e outrora ousado; aprendeu onde é a linha e memorizou. Bom em preço de pão e câmbio paralelo — os dois números que importam aqui.' },
  ],

  // ═══ UKR ═══
  UKR: [
    { nome: 'Ukrainska Pravda', handle: '@ukrpravda_news', dominio: 'pravda.com.ua', cor: '#c8102e', pais: 'Ucrânia',
      posicao: 'Independente', eixo: eixo(30, -45), simpatia: 42,
      vies: 'Fundada por um jornalista que foi decapitado por isso. Investiga corrupção em plena guerra e é chamada de traidora por fazê-lo. Não para.' },
    { nome: 'Kyiv Independent', handle: '@KyivIndependent', dominio: 'kyivindependent.com', cor: '#0057b7', pais: 'Ucrânia',
      posicao: 'Independente / anglófono', eixo: eixo(35, -40), simpatia: 45,
      vies: 'Nasceu de uma redação demitida em bloco por se recusar a obedecer o dono. Fala com o Ocidente em inglês e cobra o Ocidente em inglês.' },
    { nome: 'Suspilne', handle: '@suspilne_news', dominio: 'suspilne.media', cor: '#00539f', pais: 'Ucrânia',
      posicao: 'Público', eixo: eixo(5, -15), simpatia: 58,
      vies: 'Emissora pública construída às pressas pra ser o oposto da TV de oligarca. Sóbria, factual, subfinanciada. A única que dá o número de baixas sem adjetivo.' },
    { nome: 'RBC-Ukraine', handle: '@rbc_ua', dominio: 'rbc.ua', cor: '#1c3f94', pais: 'Ucrânia',
      posicao: 'Econômico / centro', eixo: eixo(45, 0), simpatia: 50,
      vies: 'Negócios e energia num país onde negócios e energia são a guerra por outros meios. Sabe qual tranche do FMI atrasou antes do ministro saber.' },
  ],

  // ═══ PRK ═══
  // Quatro veículos porque, honestamente, é o que existe — e três deles são o mesmo.
  PRK: [
    { nome: 'KCNA', handle: '@KCNA_WATCH', dominio: 'kcna.kp', cor: '#ed1c27', pais: 'Coreia do Norte',
      posicao: 'Órgão estatal', eixo: eixo(-80, 95), simpatia: 92,
      vies: 'Não é imprensa, é escritura. Adjetivo superlativo obrigatório, insulto barroco a inimigos, e um vocabulário próprio. O que ela não menciona aconteceu.' },
    { nome: 'Rodong Sinmun', handle: '@RodongSinmun', dominio: 'rodong.rep.kp', cor: '#c00000', pais: 'Coreia do Norte',
      posicao: 'Órgão do Partido', eixo: eixo(-85, 95), simpatia: 95,
      vies: 'Jornal do Partido dos Trabalhadores. Editorial de ano-novo define a política econômica do país inteiro. Ler é obrigação cívica, literalmente.' },
    { nome: 'Korean Central TV', handle: '@KCTV', dominio: 'kctv.kp', cor: '#b3131b', pais: 'Coreia do Norte',
      posicao: 'Estatal', eixo: eixo(-80, 92), simpatia: 90,
      vies: 'A locutora de casaco rosa que anuncia o teste de míssil com a voz embargada. Produção dos anos 80 por escolha. Quando ela chora, é notícia mundial.' },
    { nome: 'Daily NK', handle: '@dailynk', dominio: 'dailynk.com', cor: '#2b6cb0', pais: 'Coreia do Norte (Seul)',
      posicao: 'Oposição / exílio', eixo: eixo(50, -75), simpatia: 5,
      vies: 'Fontes dentro do país, celular chinês contrabandeado, informação que custa a vida de quem a passa. Preço do arroz em Chongjin é manchete — e é a manchete que importa.' },
  ],

  // ═══ PAK ═══
  PAK: [
    { nome: 'Dawn', handle: '@dawn_com', dominio: 'dawn.com', cor: '#00573f', pais: 'Paquistão',
      posicao: 'Centro-liberal', eixo: eixo(20, -45), simpatia: 38,
      vies: 'Fundado por Jinnah e hoje acusado de traição por escrever sobre o exército. Liberal, laico, bem escrito, com distribuição misteriosamente interrompida quando incomoda.' },
    { nome: 'The Express Tribune', handle: '@etribune', dominio: 'tribune.com.pk', cor: '#c8102e', pais: 'Paquistão',
      posicao: 'Centro', eixo: eixo(30, -10), simpatia: 45,
      vies: 'Urbano, jovem, em inglês. Aprendeu autocensura depois que a redação foi atacada três vezes. Cobre economia e Índia com cuidado calculado.' },
    { nome: 'Geo News', handle: '@geonews_urdu', dominio: 'geo.tv', cor: '#0057b8', pais: 'Paquistão',
      posicao: 'Popular / centro', eixo: eixo(25, 10), simpatia: 48,
      vies: 'A TV que o Paquistão assiste, tirada do ar sempre que erra o alvo. Talk show noturno com general aposentado explicando a Índia. Emocional e onipresente.' },
    { nome: 'ARY News', handle: '@ARYNEWSOFFICIAL', dominio: 'arynews.tv', cor: '#e30613', pais: 'Paquistão',
      posicao: 'Direita nacionalista', eixo: eixo(35, 55), simpatia: 55,
      vies: 'Nacionalista, religioso quando convém, e alinhado a quem estiver por cima naquele mês. Muda de lado com uma agilidade que quase merece respeito.' },
  ],

  // ═══ VEN ═══
  VEN: [
    { nome: 'Telesur', handle: '@teleSURtv', dominio: 'telesurtv.net', cor: '#e30613', pais: 'Venezuela',
      posicao: 'Estatal / bolivariano', eixo: eixo(-80, 60), simpatia: 85,
      vies: 'Projeto continental financiado por Caracas. Anti-imperialismo em tempo integral, com sotaque de toda a América Latina. O bloqueio explica tudo, sempre.' },
    { nome: 'VTV', handle: '@VTVcanal8', dominio: 'vtv.gob.ve', cor: '#f8c300', pais: 'Venezuela',
      posicao: 'Estatal', eixo: eixo(-85, 70), simpatia: 90,
      vies: 'Canal do Estado. Cadeia nacional de quatro horas, transmissão obrigatória. Não noticia oposição — denuncia conspiração.' },
    { nome: 'El Nacional', handle: '@ElNacionalWeb', dominio: 'elnacional.com', cor: '#003da5', pais: 'Venezuela (exílio)',
      posicao: 'Oposição', eixo: eixo(60, -60), simpatia: 12,
      vies: 'Perdeu a sede num processo, imprime nada e publica de fora. Oposição histórica, liberal, e sem nenhuma ilusão restante. Existir já é a linha editorial.' },
    { nome: 'Efecto Cocuyo', handle: '@EfectoCocuyo', dominio: 'efectococuyo.com', cor: '#f5a623', pais: 'Venezuela',
      posicao: 'Independente', eixo: eixo(25, -55), simpatia: 22,
      vies: 'Digital, financiado por doação, feito por jornalistas que ficaram. Checagem de fato num país sem estatística oficial há uma década. Trabalha no escuro por escolha.' },
    { nome: 'Últimas Noticias', handle: '@UNoticias', dominio: 'ultimasnoticias.com.ve', cor: '#d0021b', pais: 'Venezuela',
      posicao: 'Popular / alinhado', eixo: eixo(-55, 40), simpatia: 65,
      vies: 'Popular, de rua, comprado por interesses próximos ao governo. Crime e futebol na capa, política na página doze. É como o poder prefere.' },
  ],

  // ═══ IDN ═══
  IDN: [
    { nome: 'Kompas', handle: '@hariankompas', dominio: 'kompas.com', cor: '#1a5eb8', pais: 'Indonésia',
      posicao: 'Centro', eixo: eixo(20, -10), simpatia: 50,
      vies: 'O jornal de referência do arquipélago. Moderado por doutrina, quase à indiferença. Sobreviveu à Nova Ordem sendo cuidadoso e nunca perdeu o hábito.' },
    { nome: 'Tempo', handle: '@tempodotco', dominio: 'tempo.co', cor: '#c8102e', pais: 'Indonésia',
      posicao: 'Independente / investigativo', eixo: eixo(10, -50), simpatia: 35,
      vies: 'Fechada duas vezes pela ditadura e voltou as duas. Investiga níquel, floresta e general com sócio. Capa ilustrada que vira crise diplomática sozinha.' },
    { nome: 'The Jakarta Post', handle: '@jakpost', dominio: 'thejakartapost.com', cor: '#0a4b78', pais: 'Indonésia',
      posicao: 'Centro-liberal', eixo: eixo(35, -30), simpatia: 45,
      vies: 'Em inglês, pra investidor e embaixada. Liberal, laico, preocupado com direitos — o que aqui é uma posição de minoria e ele sabe.' },
    { nome: 'Republika', handle: '@republikaonline', dominio: 'republika.co.id', cor: '#00843d', pais: 'Indonésia',
      posicao: 'Islâmico / conservador', eixo: eixo(20, 45), simpatia: 52,
      vies: 'Voz da classe média muçulmana urbana. Economia islâmica, moral pública, Palestina na capa. Consegue encher rua e nunca deixa ninguém esquecer.' },
    { nome: 'Detik', handle: '@detikcom', dominio: 'detik.com', cor: '#0066cc', pais: 'Indonésia',
      posicao: 'Popular / digital', eixo: eixo(25, 15), simpatia: 50,
      vies: 'Velocidade acima de tudo: publica em três parágrafos e corrige depois. Define o que o país está falando antes do almoço. Sem linha editorial além do clique.' },
  ],
};

// ── OS INTERNACIONAIS ─────────────────────────────────────────────────
// Aparecem para TODOS os países. Jogando de Brasil, a CNN ainda existe e ainda te cobre —
// só que agora ela é o olhar de fora, não o jornal de casa. Simpatia inicial 50: ninguém
// no exterior te conhece o bastante pra gostar ou odiar. Ainda.
export const IMPRENSA_INTERNACIONAL = [
  { nome: 'CNN', handle: '@CNN', dominio: 'cnn.com', cor: '#cc0000', pais: 'EUA',
    posicao: 'Centro-liberal', eixo: eixo(15, -25), simpatia: 50,
    vies: 'Cobertura 24h, urgência, "BREAKING NEWS". Liberal-centrista: defende instituições e direitos, dramatiza crises e desconfia de mão-de-ferro.' },
  { nome: 'Fox News', handle: '@FoxNews', dominio: 'foxnews.com', cor: '#003366', pais: 'EUA',
    posicao: 'Direita', eixo: eixo(60, 45), simpatia: 50,
    vies: 'Conservador, hawkish, nacionalista. Aplaude força militar, corte de impostos e lei-e-ordem. Ataca fraqueza, gastança e "globalismo".' },
  { nome: 'Reuters', handle: '@Reuters', dominio: 'reuters.com', cor: '#ff8000', pais: 'Global',
    posicao: 'Neutro / agência', eixo: eixo(10, 0), simpatia: 50,
    vies: 'Agência: seco, direto, sem adjetivo. Só fatos, números, mercados. Nunca opina — o que é uma opinião em si.' },
  { nome: 'Associated Press', handle: '@AP', dominio: 'apnews.com', cor: '#ff322e', pais: 'Global',
    posicao: 'Neutro / agência', eixo: eixo(0, -5), simpatia: 50,
    vies: 'Cooperativa de jornais, um século de manual de estilo. Escreve a primeira versão que dois mil veículos vão republicar sem checar. O erro dela viaja o mundo.' },
  { nome: 'Bloomberg', handle: '@business', dominio: 'bloomberg.com', cor: '#000000', pais: 'Global',
    posicao: 'Liberal econômico', eixo: eixo(70, 0), simpatia: 50,
    vies: 'Escreve pro terminal, não pro leitor. Mede tudo em pontos-base e volatilidade. Não julga seu regime — precifica.' },
  { nome: 'Al Jazeera', handle: '@AJEnglish', dominio: 'aljazeera.com', cor: '#fa9000', pais: 'Catar',
    posicao: 'Progressista / anti-hegemônico', eixo: eixo(-30, -35), simpatia: 45,
    vies: 'Perspectiva do Oriente Médio/Sul Global. Crítico feroz do intervencionismo ocidental, ocupação e sanções. Dá voz a quem apanha.' },
];

// Os do país + os internacionais. Fallback pros EUA, igual gabineteDe().
// Devolve CÓPIAS: simpatia é mutável (investirNaMidia escreve nela) e o catálogo
// não pode carregar o estado de uma partida pra outra.
export function imprensaDe(iso) {
  const locais = IMPRENSA_POR_PAIS[iso] || IMPRENSA_POR_PAIS.USA;
  return [...locais, ...IMPRENSA_INTERNACIONAL].map((v) => ({ ...v, eixo: { ...v.eixo } }));
}

// Espelho de VEICULO_POR_NOME, mas por país — a UI referencia veículo por nome.
export function imprensaPorNome(iso) {
  return Object.fromEntries(imprensaDe(iso).map((v) => [v.nome, v]));
}

// Gêmeo de decairSimpatia() de veiculos.js, que só sabe iterar o VEICULOS global.
// Este opera sobre a lista viva da partida (a que imprensaDe() devolveu).
export function decairSimpatiaLista(veiculos) {
  for (const v of veiculos) {
    if (v.simpatia == null) v.simpatia = 50;
    v.simpatia += v.simpatia > 50 ? -2 : v.simpatia < 50 ? 1 : 0;
  }
}
