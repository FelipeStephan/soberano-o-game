// OS GABINETES — um elenco curado por nação jogável.
//
// Mesma decisão de design de elenco.js: papéis e personalidades são FIXOS. A IA dá
// VOZ a estes personagens, não os inventa. O que muda por país é o CARGO (o Estado
// real tem os órgãos que tem) e a TENSÃO INTERNA (o general paquistanês pensa em
// Déli; o alemão pensa em gasoduto; o do IRGC não pensa no presidente).
//
// ── OS IDs SÃO ESTÁVEIS (e isto é contrato) ──────────────────────────
// O resto do código referencia conselheiro por `id`, não por cargo. maquina/fallback.js
// tem 'dir_cia' e 'chefe_gabinete' cravados no fonte, e elenco.js já usava 'dir_cia'.
// Então o id do chefe de espionagem é 'dir_cia' em TODOS os países — inclusive onde o
// órgão se chama SVR, Mossad ou ABIN. O id é uma chave de banco, não um cargo:
//
//   sec_defesa · dir_cia · sec_tesouro · sec_estado · chefe_gabinete
//
// Quem lê a tela vê `papel`. Quem lê o código vê `id`. Não confunda os dois.
//
// ── NOMES ─────────────────────────────────────────────────────────────
// TODOS os nomes são FICTÍCIOS. Nenhum é de pessoa viva, e isto não é preferência
// estética: o jogo tem missão de assassinato. Personagem inventado, sempre.

export const GABINETES = {
  // ═══ USA ═══
  // Idêntico ao ELENCO_EUA_2026 original — o elenco fundador não se mexe.
  USA: [
    { id: 'sec_defesa', papel: 'Secretário de Defesa', nome: 'General Marcus Hale',
      personalidade: 'Falcão. Vê ameaça em tudo, quer projeção de força. Lema: "Fraqueza convida invasão."' },
    { id: 'dir_cia', papel: 'Diretora da CIA', nome: 'Diane Okoro',
      personalidade: 'Fria, calculista, adora soluções nos bastidores. Prefere o bisturi da espionagem à marreta da guerra.' },
    { id: 'sec_tesouro', papel: 'Secretário do Tesouro', nome: 'Arthur Feld',
      personalidade: 'Cauteloso, obcecado por mercados e disciplina fiscal. Enxerga toda decisão como uma linha numa planilha.' },
    { id: 'sec_estado', papel: 'Secretária de Estado', nome: 'Elena Vásquez',
      personalidade: 'Diplomata paciente. Prioriza alianças e a narrativa internacional. "Toda porta que fechamos é uma que não reabre."' },
    { id: 'chefe_gabinete', papel: 'Chefe de Gabinete', nome: 'Ray Sullivan',
      personalidade: 'Operador político. Só pensa em aprovação, eleições e no humor das ruas. Traz as más notícias internas.' },
  ],

  // ═══ CHN ═══
  CHN: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa Nacional', nome: 'General Xu Jianguo',
      personalidade: 'Fala pouco e sempre em plural. Sabe que o Exército não é do Estado, é do Partido — e que ele responde ao Partido, não a você. Só se anima quando o assunto é Taiwan, e aí é difícil calá-lo.' },
    { id: 'dir_cia', papel: 'Ministro da Segurança do Estado', nome: 'Cheng Weilin',
      personalidade: 'Pensa em décadas, não em mandatos. Considera assassinato uma falha de planejamento: quem precisa matar é porque não conseguiu comprar. Já tem dossiê de todos nesta sala. Inclusive o seu.' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Liang Ruomei',
      personalidade: 'Sabe o tamanho real da dívida dos governos provinciais e o número lhe tira o sono. Defende estímulo e teme o dia em que o mundo parar de comprar. "Crescimento é legitimidade. Sem crescimento, não somos nada."' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Zhao Minghe',
      personalidade: 'Da velha escola, antes da diplomacia do lobo guerreiro. Acha que gritar na TV custou uma década de paciência acumulada. Prefere porto, ferrovia e empréstimo — comprar um país sai mais barato que invadi-lo.' },
    { id: 'chefe_gabinete', papel: 'Diretor do Gabinete Geral do Partido', nome: 'Fang Zhilei',
      personalidade: 'Não mede aprovação, mede estabilidade — e a diferença é o cassetete. Conta quem está subindo e quem sumiu das fotos. A única pessoa aqui que fala do Comitê Permanente em voz baixa.' },
  ],

  // ═══ RUS ═══
  RUS: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'General Iúri Voronin',
      personalidade: 'Mente sobre baixas por hábito, não por ordem. Acredita sinceramente que a Rússia está cercada e sempre esteve. Fala em "operação especial" mesmo em reunião fechada — já não sabe dizer de outro jeito.' },
    { id: 'dir_cia', papel: 'Diretor do SVR', nome: 'Konstantin Levada',
      personalidade: 'Cortês, culto, fala quatro línguas e envenena gente. Vê a política ocidental como um mecanismo com peças soltas — só precisa saber qual sacudir. Despreza generais: "Tanque é o que se usa quando o serviço falhou."' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Anatóli Griazev',
      personalidade: 'O único adulto na sala e sabe disso, o que o torna insuportável. Manteve o rublo de pé sob sanção com truque, ouro e força de vontade. Fala em anos de reserva restantes como quem lê um relógio de bomba.' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Guennadi Ochakov',
      personalidade: 'Cínico profissional. Não tenta mais convencer o Ocidente, tenta cansá-lo. Trata a Índia e a China como público, não como aliados: "Ninguém nos ama. Alguns só precisam do nosso gás."' },
    { id: 'chefe_gabinete', papel: 'Chefe da Administração Presidencial', nome: 'Vadim Terekhin',
      personalidade: 'Gerencia realidade, não opinião — pesquisa é insumo, TV é ferramenta. O único que sabe quais oligarcas ainda têm dinheiro e quais só têm medo. Traz a má notícia interna, sempre com um culpado já embalado.' },
  ],

  // ═══ IND ═══
  IND: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Arvind Rathore',
      personalidade: 'Obcecado por duas fronteiras ao mesmo tempo e humilhado por depender de peça russa para brigar com a China. "Autossuficiência" é a palavra que mais repete e a que menos entrega. Tem opinião sobre o Paquistão que não cabe em ata.' },
    { id: 'dir_cia', papel: 'Chefe da RAW', nome: 'Nikhil Sarangi',
      personalidade: 'Trabalha por procuração — nunca a Índia, sempre alguém que devia um favor. Sabe que operação no exterior virou notícia duas vezes e que o custo diplomático valeu a pena. Sorri quando pergunta se você quer negação plausível.' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Priya Venkataraman',
      personalidade: 'Vê 1,4 bilhão de pessoas como um cronômetro: emprego ou revolta, escolha. Alérgica a subsídio e refém dele. Cita o FMI e a safra de monções na mesma frase, sem ironia.' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Rohan Menon',
      personalidade: 'Chama de "autonomia estratégica" o que os outros chamam de comer nos dois pratos, e acha os outros ingênuos. Compra petróleo russo, exercita com americano, dorme bem. "Não somos de ninguém. É por isso que todos ligam."' },
    { id: 'chefe_gabinete', papel: 'Secretário Principal do Primeiro-Ministro', nome: 'Devendra Kaul',
      personalidade: 'Conta cadeiras estado por estado, casta por casta. Sabe que uma coalizão cai mais rápido que um governo perde uma guerra. Traduz geopolítica em voto e devolve a conta.' },
  ],

  // ═══ BRA ═══
  BRA: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'General Ubiratan Salgueiro',
      personalidade: 'Comanda 360 mil homens sem inimigo há 150 anos e sente o ridículo disso todo dia. Quer submarino nuclear desde antes de nascer. O verdadeiro assunto dele é interno, e é aí que fica perigoso: "Presidente, o Exército não é polícia. Não peça isso duas vezes."' },
    { id: 'dir_cia', papel: 'Diretor-Geral da ABIN', nome: 'Hélio Nascimento',
      personalidade: 'Chefia um serviço pequeno, mal pago e sempre suspeito de espionar quem não devia — porque já espionou. Sabe mais sobre o Congresso do que sobre a Venezuela e tem vergonha disso. "Ninguém aqui quer inteligência. Querem grampo com carimbo."' },
    { id: 'sec_tesouro', papel: 'Ministro da Fazenda', nome: 'Renata Bicalho',
      personalidade: 'Vive entre o juro real mais alto do planeta e um Congresso que só sabe gastar. Trata cada anúncio seu como um evento de risco: fala e o dólar responde antes da coletiva. "O mercado não te odeia, presidente. O mercado não te conhece — e isso é pior."' },
    { id: 'sec_estado', papel: 'Ministro das Relações Exteriores', nome: 'Embaixador Aurélio Pontes',
      personalidade: 'Itamaraty puro: acha que não-alinhamento é sofisticação, não covardia, e que quem não entende isso não leu Rio Branco. Fala com Washington, Pequim, Moscou e Teerã na mesma semana e considera isso o maior ativo do país. Trata pressa como deselegância.' },
    { id: 'chefe_gabinete', papel: 'Ministro-Chefe da Casa Civil', nome: 'Sérgio Damaceno',
      personalidade: 'Sabe o preço de cada voto no plenário e não acha isso escandaloso, acha terça-feira. Traz a pesquisa ruim e a emenda cara no mesmo envelope. "Governabilidade não se compra à vista."' },
  ],

  // ═══ DEU ═══
  DEU: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Generalin Katrin Vollmer',
      personalidade: 'Herdou uma força que já não tinha munição para uma semana e passou anos implorando por dinheiro que virou manchete e não virou obus. Carrega a culpa histórica como colete: cada decisão sua passa por 1945 antes de chegar ao mapa.' },
    { id: 'dir_cia', papel: 'Presidente do BND', nome: 'Jörg Steinbrück',
      personalidade: 'Serviço acorrentado por lei, tribunal e memória da Stasi — e ele defende essas correntes até quando o atrapalham. Avisou sobre a dependência do gás e foi chamado de alarmista. Nunca deixou ninguém esquecer.' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Hendrik Baumgartner',
      personalidade: 'O freio da dívida é religião, não política. Diz "não" antes de ouvir o pedido inteiro, e está certo com uma frequência irritante. Vê a indústria alemã perdendo energia barata e mercado chinês ao mesmo tempo e não tem plano B.' },
    { id: 'sec_estado', papel: 'Ministra dos Negócios Estrangeiros', nome: 'Annika Reuter',
      personalidade: 'Trauma energético virou doutrina: nunca mais depender de um autocrata para aquecer casa. Prega "política externa de valores" e depois assina contrato com quem tem lítio. Sabe da contradição — só não sabe o que fazer com ela.' },
    { id: 'chefe_gabinete', papel: 'Chefe da Chancelaria Federal', nome: 'Matthias Krohn',
      personalidade: 'Coalizão de três partidos é o inferno dele, e ele conhece o inferno pelo primeiro nome. Traduz cada decisão sua em quantos parceiros ameaçam sair. "Não temos maioria. Temos um acordo de convivência."' },
  ],

  // ═══ FRA ═══
  FRA: [
    { id: 'sec_defesa', papel: 'Ministro das Forças Armadas', nome: 'Général Pascal Duvernois',
      personalidade: 'A única força expedicionária de verdade da Europa, e ele lembra a todos disso semanalmente. A retirada do Sahel foi ferida aberta: perdeu o continente para mercenários e não perdoou ninguém. Fala em dissuasão nuclear como quem fala em soberania — porque, para ele, é a mesma palavra.' },
    { id: 'dir_cia', papel: 'Diretor-Geral da DGSE', nome: 'Rémy Charlebois',
      personalidade: 'Herdeiro de uma casa que afundou navio e derrubou governo e nunca pediu desculpa por nada. Trata a África como arquivo aberto e a Comissão Europeia como alvo legítimo de escuta. "Aliado é uma condição temporária, monsieur. Interesse é permanente."' },
    { id: 'sec_tesouro', papel: 'Ministra da Economia e Finanças', nome: 'Claire Deschamps',
      personalidade: 'Sabe que qualquer corte real põe um milhão de pessoas na rua em três dias, porque já pôs. Defende campeões nacionais contra fundo americano com o fervor de quem defende catedral. Bruxelas manda uma carta por mês; ela responde uma por trimestre.' },
    { id: 'sec_estado', papel: 'Ministro da Europa e dos Negócios Estrangeiros', nome: 'Olivier Marchand',
      personalidade: 'Acredita em "autonomia estratégica europeia" e sabe que é ele sozinho falando alto num salão vazio. Trata a OTAN como seguro que não se quer usar e o assento no Conselho de Segurança como último móvel de família. Cita De Gaulle sem avisar que está citando.' },
    { id: 'chefe_gabinete', papel: 'Secretário-Geral do Eliseu', nome: 'Bruno Lacombe',
      personalidade: 'Conta sindicato, não pesquisa. Sabe que na França a rua tem poder de veto e que ela usa. Traz a data da próxima greve como quem traz previsão do tempo: inevitável, e você vai se molhar.' },
  ],

  // ═══ GBR ═══
  GBR: [
    { id: 'sec_defesa', papel: 'Secretário de Estado da Defesa', nome: 'Sir Alistair Renwick',
      personalidade: 'Dois porta-aviões e escolta insuficiente para os dois — ele sabe, e reza para ninguém perguntar. Dissuasão nuclear que depende de manutenção americana, o que ele chama de "parceria" e trata como constrangimento. "Ainda sabemos lutar. Só não por muito tempo."' },
    { id: 'dir_cia', papel: 'Chefe do MI6 ("C")', nome: 'Miriam Ashcroft',
      personalidade: 'Assina em tinta verde e acha o resto folclore. A relação com Langley é a joia da coroa e a coleira: recebe mais do que dá e finge que é troca. Frio, elegante, e nunca disse "sim" a nada em voz alta na vida.' },
    { id: 'sec_tesouro', papel: 'Chanceler do Tesouro', nome: 'Nigel Hartwell',
      personalidade: 'Viu um governo evaporar em 49 dias por causa de uma planilha e nunca mais dormiu. Trata o mercado de gilts como divindade menor e vingativa. "Podemos anunciar isso, primeiro-ministro. Mas eles precificam antes do senhor terminar a frase."' },
    { id: 'sec_estado', papel: 'Secretário do Foreign Office', nome: 'Edward Blackwood',
      personalidade: 'Vende influência que já não tem, com uma competência que quase compensa. Chama a Commonwealth de "rede", o Brexit de "reposicionamento" e Washington de "parceiro" — três eufemismos por parágrafo. Genuinamente bom nisso.' },
    { id: 'chefe_gabinete', papel: 'Chefe de Gabinete do Nº 10', nome: 'Fiona Crawley',
      personalidade: 'Sobrevive a manchete de tabloide como quem sobrevive a intempérie: agasalhando-se. Sabe qual backbencher está vendendo você e por quanto. Trata a própria bancada como ameaça principal — porque é.' },
  ],

  // ═══ JPN ═══
  JPN: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Kenji Morisawa',
      personalidade: 'Comanda forças que a Constituição diz não existirem e que agora compram míssil de ataque. Cada aquisição é uma briga jurídica e um trauma nacional. Olha para o estreito de Taiwan e faz a conta em minutos de aviso.' },
    { id: 'dir_cia', papel: 'Diretor do Naicho', nome: 'Hiroshi Tateyama',
      personalidade: 'Chefia um serviço que quase não pode recrutar fora e depende de satélite alheio — e trata isso com uma serenidade que assusta. Analista antes de espião: prevê em vez de agir. "Não precisamos entrar na sala, senhor. Precisamos saber o que foi dito nela."' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Sadao Kurihara',
      personalidade: 'Administra a maior dívida/PIB do mundo desenvolvido com a calma de quem convive com um tumor estável há trinta anos. Vê a população encolher e sabe que nenhum número seu conserta isso. "Não temos problema de dinheiro. Temos problema de gente."' },
    { id: 'sec_estado', papel: 'Ministra dos Negócios Estrangeiros', nome: 'Yuki Nagahama',
      personalidade: 'Cortês até o osso e implacável por baixo. Sabe que Seul nunca vai esquecer e que Washington pode um dia ir embora — e prepara os dois cenários em silêncio. Cada frase sua tem duas leituras, e a segunda é a verdadeira.' },
    { id: 'chefe_gabinete', papel: 'Secretário-Chefe do Gabinete', nome: 'Takumi Oshiro',
      personalidade: 'É a voz do governo no púlpito diário e o coveiro das crises internas. Sabe qual facção do partido quer sua cabeça neste trimestre. Nunca demonstra nada — o que, no Japão, é a forma mais alta de aviso.' },
  ],

  // ═══ KOR ═══
  KOR: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa Nacional', nome: 'General Han Do-jin',
      personalidade: 'Vinte mil peças de artilharia apontadas para uma cidade de dez milhões, a trinta e cinco quilômetros. Ele acorda com esse número. Em guerra, o comando operacional passa para um americano — e ele não sabe se isso é seguro ou humilhante. Provavelmente os dois.' },
    { id: 'dir_cia', papel: 'Diretor do NIS', nome: 'Yoon Chae-won',
      personalidade: 'Herdou uma casa com histórico de derrubar presidentes e sequestrar opositores, e passa metade do tempo provando que não faz mais isso. Sabe o que se passa em Pyongyang melhor que Pyongyang. "Temos gente lá dentro, senhor. Não pergunte quem — pergunte por quanto tempo mais."' },
    { id: 'sec_tesouro', papel: 'Ministro da Estratégia e Finanças', nome: 'Park Seung-ho',
      personalidade: 'Quatro conglomerados são o país, e o país é refém deles — ele diz isso à noite e nega de manhã. Vê a demografia coreana como colapso agendado. Um chip mal exportado apaga um trimestre.' },
    { id: 'sec_estado', papel: 'Ministra dos Negócios Estrangeiros', nome: 'Lim Ha-eun',
      personalidade: 'Segurança em Washington, dinheiro em Pequim, e a conta chega dos dois lados todo mês. Trata o Japão com um profissionalismo que custa sangue. "Não podemos escolher, senhor. Escolher é a única coisa que não podemos fazer."' },
    { id: 'chefe_gabinete', papel: 'Chefe de Gabinete Presidencial', nome: 'Cho Min-seok',
      personalidade: 'Sabe que todo presidente coreano termina indiciado, e planeja o mandato com essa certeza embutida. Conta praça, não pesquisa: aqui a rua muda governo. Traz a má notícia com a data já marcada.' },
  ],

  // ═══ ISR ═══
  ISR: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'General Amichai Bar-Lev',
      personalidade: 'Doutrina do vizinho, não do horizonte: quem estiver a três horas de carro é o problema. Não acredita em contenção, acredita em prevenção — e acha "prevenção" uma palavra bonita para o que faz. "Ninguém nos deu país. Tiramos, e seguramos."' },
    { id: 'dir_cia', papel: 'Diretor do Mossad', nome: 'Eitan Rozenberg',
      personalidade: 'A pergunta dele nunca é "podemos?", é "vale a manchete?". Opera em território soberano alheio como quem atravessa a rua. Fala de assassinato com o vocabulário de um contador. "Cientista não é um homem, senhor. É um cronograma. E cronograma se atrasa."' },
    { id: 'sec_tesouro', papel: 'Ministra das Finanças', nome: 'Noa Shternberg',
      personalidade: 'Sustenta o país com startup e transferência americana e sabe qual das duas pode acabar primeiro. Cada convocação de reservistas esvazia um escritório de engenharia em Tel Aviv, e ela mede isso em pontos de PIB. Chama guerra de "custo recorrente".' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Dov Halperin',
      personalidade: 'Perdeu a opinião pública do mundo e finge que ainda joga esse jogo. Conta abstenções na ONU como quem conta buracos de bala. Depende de um único veto no Conselho de Segurança e reza para que a mão que o levanta não canse.' },
    { id: 'chefe_gabinete', papel: 'Chefe de Gabinete do Primeiro-Ministro', nome: 'Tamar Feldbaum',
      personalidade: 'A coalizão dela cai se um rabino se ofender. Sabe que a rua israelense já derrubou governo em plena guerra. "Nossos inimigos não vão nos destruir esta semana, senhor. Nossos parceiros, talvez."' },
  ],

  // ═══ IRN ═══
  IRN: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Mansour Rahimian',
      personalidade: 'Ministro do exército regular — o que, aqui, é ser o segundo exército do próprio país. Tem caça dos anos 70 mantido com peça de contrabando. Sabe que a força de verdade está na sala e não responde a ele.' },
    { id: 'dir_cia', papel: 'Comandante do IRGC', nome: 'General Hossein Zarrinkoub',
      personalidade: 'Não responde ao presidente e sabe disso — trata suas ordens como sugestões que ele avalia. Tem milícia em quatro países, petroleiro clandestino e uma empresa de construção. Fala em nome do Líder Supremo quando lhe convém, e ninguém checa. "O senhor governa o orçamento. Eu governo o eixo."' },
    { id: 'sec_tesouro', papel: 'Ministro da Economia e Finanças', nome: 'Kamran Sadeghi',
      personalidade: 'Faz malabarismo com quatro taxas de câmbio e uma inflação que come salário em três meses. Sabe exatamente quanto o IRGC tira do orçamento e não pode escrever isso em lugar nenhum. "A sanção não nos matou. Nos ensinou a viver doentes."' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Javad Nasseri',
      personalidade: 'Educado no Ocidente, negocia melhor que qualquer um na sala e é sabotado toda vez que quase consegue algo. Sabe que um acordo assinado dura até o próximo teste de míssil que ele não autorizou. Sorri para Viena e envelhece por dentro.' },
    { id: 'chefe_gabinete', papel: 'Chefe do Gabinete Presidencial', nome: 'Behrouz Ansari',
      personalidade: 'Mede o que o Conselho de Guardiões pensa, não o que o povo pensa — o povo é um risco, não um eleitorado. Lembra de 2022 toda vez que sugerem apertar. "Presidente, o senhor tem mandato. O Líder tem o país."' },
  ],

  // ═══ TUR ═══
  TUR: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa Nacional', nome: 'General Kemal Ardıç',
      personalidade: 'Segundo maior exército da OTAN e comprou antiaéreo russo — e ele defende as duas coisas na mesma frase, sem piscar. O drone turco virou política externa exportável e ele fala disso como pai coruja. Purgado o suficiente para ser leal, competente o bastante para incomodar.' },
    { id: 'dir_cia', papel: 'Diretor do MİT', nome: 'Serkan Bozkurt',
      personalidade: 'Opera na Síria, na Líbia e no Cáucaso ao mesmo tempo, e sequestra gente em três continentes com passaporte diplomático. Trata a diáspora como jurisdição. "Fronteira é uma opinião do cartógrafo, senhor."' },
    { id: 'sec_tesouro', papel: 'Ministro do Tesouro e Finanças', nome: 'Orhan Yalçın',
      personalidade: 'Sobreviveu a mais chefes que qualquer um nesta sala e todos caíram por causa de juros. Sabe qual é a política monetária certa e sabe que dizer isso em voz alta o demite. A lira o ensinou a falar em código.' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Deniz Karaosman',
      personalidade: 'Chantageia a OTAN com veto de adesão e vende drone para os dois lados de duas guerras. Chama isso de política externa multivetorial; o resto do mundo chama de outra coisa. Vinte anos de fila na União Europeia lhe deram um rancor bem organizado.' },
    { id: 'chefe_gabinete', papel: 'Chefe do Gabinete Presidencial', nome: 'Yasin Demirtaş',
      personalidade: 'Sabe qual juiz decide o quê e qual jornal fecha na quinta. Lembra de 2016 toda vez que um general fala mais alto. Traz a inflação e a pesquisa juntas: "As duas doem, senhor. Só uma vira voto."' },
  ],

  // ═══ SAU ═══
  SAU: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Príncipe Faisal bin Turki al-Sabah',
      personalidade: 'Comprou o material mais caro do mundo e o Iêmen provou que dinheiro não faz doutrina. Sabe que a defesa do reino, no fim, é um telefonema para Washington. "Temos tudo, senhor. Menos o hábito de vencer."' },
    { id: 'dir_cia', papel: 'Chefe da Presidência Geral de Inteligência (GIP)', nome: 'Nawaf al-Duraiwish',
      personalidade: 'Vigia mais príncipe que estrangeiro, porque a ameaça de verdade tem sobrenome. Conhece de cor o custo reputacional de uma operação mal feita em consulado — e não repete erro. Fala em "estabilidade da Casa" como quem fala em segurança nacional. É a mesma coisa.' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Bandar al-Rashoud',
      personalidade: 'Todo o país é uma aposta contra o próprio produto que o sustenta. Vê megaprojeto queimar caixa e não pode dizer não a quem o encomendou. "O petróleo não vai acabar, senhor. A vontade de comprá-lo, sim. E isso é pior."' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Príncipe Khalid bin Ayman al-Sabah',
      personalidade: 'Fala com Teerã, corteja Pequim e chantageia Washington com barril — tudo antes do almoço. Descobriu que ser imprescindível vale mais que ser aliado. Trata normalização com Israel como ativo à venda, não como convicção.' },
    { id: 'chefe_gabinete', papel: 'Chefe da Corte Real', nome: 'Sultan al-Marzouq',
      personalidade: 'Não mede aprovação, mede lealdade dentro da família — e há milhares de membros. Sabe que 70% do país tem menos de 35 anos e nenhum deles votou em nada. "O contrato é simples: nós pagamos, eles calam. O preço subiu."' },
  ],

  // ═══ EGY ═══
  EGY: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa e Produção Militar', nome: 'Marechal Tarek Abdel-Ghani',
      personalidade: 'O exército não defende a economia, o exército É a economia — macarrão, cimento, resort, e ele preside tudo. Sabe que o cargo dele fabricou os últimos presidentes. Educadíssimo com você, do jeito que se é educado com hóspede.' },
    { id: 'dir_cia', papel: 'Diretor do Serviço Geral de Inteligência (GIS)', nome: 'Ashraf Mansour',
      personalidade: 'Media entre Israel e o Hamas há décadas e ganha relevância exatamente por isso — a crise alheia é o produto que ele exporta. Conhece cada célula islamista do Sinai pelo primeiro nome. "Estabilidade não é ausência de fogo. É saber quem acende."' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Hisham El-Qassabi',
      personalidade: 'Importa trigo com dólar que não tem, subsidia pão que não pode cortar, e sabe o que acontece quando o pão sobe — 1977 está no manual. Vive de pacote do FMI e de transferência do Golfo. "Somos solventes até o próximo telefonema, senhor."' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Yasser Fahmy',
      personalidade: 'Vende a passagem do canal, a paz fria com Israel e a contenção migratória — três produtos, três clientes, nenhum amigo. Perde uma briga sobre a água do Nilo há quinze anos e não pode chamá-la pelo nome. "A Etiópia não nos declarou guerra. Só fechou a torneira."' },
    { id: 'chefe_gabinete', papel: 'Chefe do Gabinete Presidencial', nome: 'Mostafa El-Bakry',
      personalidade: 'Conta cem milhões de bocas e o preço do pão em quatro governadorias. Sabe que aqui a rua já derrubou dois presidentes em três anos e que ninguém esqueceu o caminho. Traz o número da inflação como quem traz radiografia.' },
  ],

  // ═══ UKR ═══
  UKR: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'General Taras Kovalenko',
      personalidade: 'Conta projétil, não batalhão — e a conta nunca fecha. Sabe quantos dias de defesa antiaérea restam e arredonda para cima quando fala com você. Não teme os russos; teme o calendário eleitoral de países onde não vota. "Não perdemos a guerra. Podemos perder o interesse deles."' },
    { id: 'dir_cia', papel: 'Chefe da HUR', nome: 'Coronel Mykhailo Ostapchuk',
      personalidade: 'Explode ponte, refinaria e gente atrás das linhas e chama isso de terça-feira. Novo, sorridente, e absolutamente sem freio moral — a guerra tirou o freio dele em 2022 e ninguém pôs de volta. "Eles nos ensinaram que retaguarda não existe. Aprendemos."' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Andrii Prylutskyi',
      personalidade: 'O orçamento do país é um donativo estrangeiro com prazo de validade e ele sabe a data. Cada tranche atrasada é salário de professor não pago. "Não administro uma economia, senhor. Administro a paciência de outras pessoas."' },
    { id: 'sec_estado', papel: 'Ministra dos Negócios Estrangeiros', nome: 'Oksana Vyshnevska',
      personalidade: 'Passou anos agradecendo por menos do que precisava, com um sorriso que já lhe custou o esmalte dos dentes. Sabe que "quanto for preciso" tem letra miúda. Chama neutralidade — a brasileira, a indiana — de cumplicidade, e não se desculpa por isso.' },
    { id: 'chefe_gabinete', papel: 'Chefe do Gabinete do Presidente', nome: 'Ihor Zabuzhko',
      personalidade: 'Segura a unidade nacional com propaganda, lei marcial e funeral bem produzido. Sabe qual general está popular demais para o próprio bem. Traz o escândalo de corrupção antes que o parceiro estrangeiro o traga. "A rachadura vem de dentro, senhor. Sempre veio."' },
  ],

  // ═══ PRK ═══
  PRK: [
    { id: 'sec_defesa', papel: 'Ministro das Forças Armadas do Povo', nome: 'Marechal Ri Chol-min',
      personalidade: 'Um milhão de soldados desnutridos e vinte mil canhões apontados para Seul — a única frase que precisa dizer, e diz sempre. Sabe que a artilharia convencional é o verdadeiro seguro, não a bomba. Aplaude antes de você terminar a frase. Todos aqui aplaudem.' },
    { id: 'dir_cia', papel: 'Diretor do Reconnaissance General Bureau (RGB)', nome: 'Kang Yong-sik',
      personalidade: 'Financia o Estado com roubo de criptomoeda e ransomware — o serviço de inteligência que virou centro de lucro. Assassina desertor em aeroporto de país terceiro e não perde o sono. "Não precisamos de fronteira aberta, senhor. Precisamos de conexão de internet."' },
    { id: 'sec_tesouro', papel: 'Presidente do Comitê de Planejamento do Estado', nome: 'Pak Ui-chon',
      personalidade: 'Apresenta números que ele mesmo inventou e sabe que você sabe. A economia real é mercado informal que a lei proíbe e o Estado depende. Fala em autossuficiência com a China pagando a conta. "O plano foi cumprido em 148%, senhor." Ele não pisca ao dizer isso.' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Choe Kwang-hyok',
      personalidade: 'A diplomacia dele é um teste de míssil com hora marcada para o noticiário americano. Aprendeu que promessa de desarmamento é a mercadoria mais rentável do país porque pode ser vendida de novo. Vende tropa e munição a Moscou e cobra em comida.' },
    { id: 'chefe_gabinete', papel: 'Diretor do Departamento de Organização e Orientação', nome: 'Jong Hyok-chol',
      personalidade: 'Não mede aprovação; mede quem faltou à sessão de estudo. Purga é planilha, e a planilha é dele. É o homem mais perigoso desta sala e o único que nunca ergue a voz. "Lealdade é um recurso renovável, senhor. Basta lembrar às pessoas."' },
  ],

  // ═══ PAK ═══
  PAK: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'General Asim Gulzar',
      personalidade: 'Tem opinião sobre a Índia do jeito que se tem opinião sobre um diagnóstico terminal: constante, detalhada e insone. "Paridade" é a palavra que organiza a vida dele, mesmo com um quinto do PIB do outro lado. Doutrina de primeiro uso nuclear porque não há profundidade estratégica — e ele repete isso como quem reza.' },
    { id: 'dir_cia', papel: 'Diretor-Geral do ISI', nome: 'Tenente-General Shahzad Iqbal',
      personalidade: 'Faz e desfaz primeiro-ministro e é a única pessoa aqui que não teme perder o cargo. Cultiva grupo armado como jardim e depois nega o jardim. Trata o Afeganistão como quintal e Cabul como decepção pessoal. "O senhor governa porque decidimos que sim."' },
    { id: 'sec_tesouro', papel: 'Ministro das Finanças', nome: 'Rehan Chaudhry',
      personalidade: 'Vive de pacote do FMI para pagar o pacote anterior, e já perdeu a conta de qual número é este. A dívida chinesa dos portos e estradas venceu e ninguém quer falar disso alto. "Não temos economia, senhor. Temos um calendário de vencimentos."' },
    { id: 'sec_estado', papel: 'Ministra dos Negócios Estrangeiros', nome: 'Sana Barlas',
      personalidade: 'Aliada de Pequim, ex-aliada de Washington, financiada por Riade — e cobrada pelos três. Sabe que a Caxemira fecha toda porta antes de ela entrar. Trata cada visita ao exterior como pedido de empréstimo com bandeira.' },
    { id: 'chefe_gabinete', papel: 'Secretário Principal do Primeiro-Ministro', nome: 'Faraz Noorani',
      personalidade: 'Conta apagões, não pesquisas — dez horas sem luz derrubam mais governo que oposição. Sabe que todo premiê aqui termina exilado, preso ou pior, e nenhum terminou o mandato. Traz a má notícia olhando para o general antes de olhar para você.' },
  ],

  // ═══ VEN ═══
  VEN: [
    { id: 'sec_defesa', papel: 'Ministro do Poder Popular para a Defesa', nome: 'General Néstor Piñango',
      personalidade: 'Comanda mais generais que qualquer exército do mundo, porque general promovido é general comprado. Controla distribuição de alimento e uma mina de ouro, e chama isso de missão cívico-militar. "O senhor tem o poder enquanto tiver a nossa lealdade. E lealdade tem cotação."' },
    { id: 'dir_cia', papel: 'Diretor do SEBIN', nome: 'Wilmer Escalante',
      personalidade: 'Sabe qual coronel conversou com qual adido americano na semana passada. A contrainteligência cubana lhe ensinou tudo e ainda vem checar o dever de casa. Vigia para dentro, sempre para dentro. "A invasão não vem do mar, senhor. Vem do quartel."' },
    { id: 'sec_tesouro', papel: 'Ministro da Economia e Finanças', nome: 'Ovidio Berrizbeitia',
      personalidade: 'Sobreviveu a uma hiperinflação de um milhão por cento e fala dela como veterano de guerra. Dolarizou o país sem admitir e finge que o bolívar existe. Vende petróleo com desconto de sanção para intermediário que rouba metade — e isso é o plano.' },
    { id: 'sec_estado', papel: 'Ministro do Poder Popular para Relações Exteriores', nome: 'Argenis Colmenares',
      personalidade: 'Anti-imperialista de púlpito e negociador discreto de licença petrolífera com as mesmas pessoas que xinga. Tem Moscou, Teerã e Havana como amigos que não pagam. O Essequibo é o assunto que ele levanta toda vez que a inflação sai no jornal.' },
    { id: 'chefe_gabinete', papel: 'Chefe do Gabinete Presidencial', nome: 'Yolimar Castejón',
      personalidade: 'Oito milhões de pessoas foram embora e ela chama isso de válvula de escape, não de fracasso — friamente, porque quem sai não protesta. Conta caixa de comida distribuída, não voto. "Eleição a gente organiza, senhor. Fome, não."' },
  ],

  // ═══ IDN ═══
  IDN: [
    { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Jenderal Bagus Wirasena',
      personalidade: 'Defende dezessete mil ilhas com uma marinha para umas trezentas. Compra caça de quatro fornecedores diferentes e chama isso de diversificação; a manutenção chama de pesadelo. Olha para os barcos chineses em Natuna e não pode dizer "China" em voz alta.' },
    { id: 'dir_cia', papel: 'Chefe da BIN', nome: 'Rizky Purnawan',
      personalidade: 'Vigia célula jihadista, separatista papuano e político ambicioso — nessa ordem de esforço e na ordem inversa de perigo real. Herdou os métodos da Nova Ordem e uma democracia que os proíbe. "Somos um país que fingiu ser um país até virar um. Isso dá trabalho, senhor."' },
    { id: 'sec_tesouro', papel: 'Ministra das Finanças', nome: 'Ratna Sulistyowati',
      personalidade: 'A pessoa mais competente desta sala e sabe que a competência dela é o que segura o rating do país. Proibiu exportar níquel bruto e ganhou a briga — quer repetir o truque com tudo. "Não vendemos pedra, senhor. Vendemos o que a pedra vira. Ou não vendemos nada."' },
    { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Bimo Hardjanto',
      personalidade: 'Doutrina "livre e ativa" desde 1948: não-alinhamento é herança de família, não estratégia de ocasião. Preside a ASEAN e sabe que a ASEAN não decide nada — e defende isso mesmo assim. Segura Malaca, a artéria de metade do comércio da Ásia, e nunca precisa mencionar.' },
    { id: 'chefe_gabinete', papel: 'Secretário de Estado', nome: 'Agus Prabowo Nainggolan',
      personalidade: 'Duzentos e oitenta milhões de pessoas, a maior população muçulmana do planeta e uma coalizão de sete partidos que ele remenda toda semana. Sabe qual clérigo consegue encher a rua. Traz a fatura da subvenção do combustível: "Ninguém aqui cai por política externa, senhor. Caem pelo preço da gasolina."' },
  ],
};

// Fallback para os EUA: o elenco fundador é o único que nunca falta.
export function gabineteDe(iso) {
  return GABINETES[iso] || GABINETES.USA;
}

// Conveniência para a IA e para a UI: pega um conselheiro pelo id contratual.
export function conselheiro(iso, id) {
  const g = gabineteDe(iso);
  return g.find((c) => c.id === id) || g[0];
}
