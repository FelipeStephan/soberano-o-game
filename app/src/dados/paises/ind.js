// FICHA DO MUNDO — Índia, era 2026. Mesmo formato do eua-2026.js.
//
// LÍDER FICTÍCIO: Arvind Rathore. Personagem inventado.

export const PAIS_IND = {
  ficha: {
    ano: 2026,
    pais: 'Índia',
    iso: 'IND',
    presidente: 'Arvind Rathore',
    capital: 'Nova Délhi',
    bandeira: '🕉️',
    pino: { lat: 28.6, lng: 77.2 },

    resumo: `País mais populoso do planeta desde 2023 e a economia grande que mais cresce — o que
ainda deixa a renda por pessoa abaixo da do Vietnã. Pousou uma sonda no polo sul lunar por menos
do que custou o filme sobre ir à Lua, e tem meio bilhão de pessoas sem saneamento. A doutrina é
não-alinhamento e a prática é oportunismo de alto nível: compra caça francês, S-400 russo, faz
exercício com a Marinha americana e petróleo russo com desconto, tudo no mesmo trimestre, e
consegue que ninguém puna. Faz fronteira armada com a China e com o Paquistão ao mesmo tempo —
dois vizinhos nucleares, um deles fabricando o outro. Importa 85% do petróleo que consome:
toda essa autonomia depende de um barril que vem de fora.`,

    // Ponto de vista DA ÍNDIA. Sem rel_india. Não-alinhamento: quase ninguém no vermelho fundo.
    relacoes: {
      // as duas fronteiras que importam
      rel_paquistao: -75,  // três guerras, Caxemira, e Pequim armando o outro lado
      rel_china: -40,      // Galwan, 2020: mortos a pau e pedra porque arma de fogo violaria o acordo
      // parceiro histórico que nunca cobrou lado
      rel_russia: 65,      // 60% do arsenal é soviético/russo; comprar barril sancionado foi pragmatismo
      // o Ocidente que corteja sem conseguir domesticar
      rel_eua: 40,         // Quad, iCET e a memória de quem armou o Paquistão na Guerra Fria
      rel_japao: 62,       // Quad e o dinheiro que construiu o metrô de Délhi
      rel_australia: 58,   // Quad; e críquete, o que aqui não é piada
      rel_ue: 45,
      rel_reino: 40,       // 200 anos de colônia e a maior diáspora indiana da Europa
      rel_israel: 55,      // maior comprador de armas israelenses
      rel_ira: 35,         // porto de Chabahar: a rota que contorna o Paquistão
      rel_arabia: 45,      // 8 milhões de indianos trabalham no Golfo e mandam remessa
      rel_egito: 38,
      rel_indonesia: 42,
      rel_brasil: 50,      // BRICS e IBAS; nenhum atrito em 500 anos
      rel_turquia: -10,    // Ancara defende o Paquistão na Caxemira em todo fórum que encontra
      rel_canada: -20,     // rompimento diplomático de 2023 sobre o assassinato do ativista sikh
      rel_coreia: 40,
      rel_norte: -15,      // fornecedor de tecnologia de míssil pro Paquistão
      rel_ucrania: 10,     // neutralidade pragmática: não condena Moscou e manda remédio pra Kiev
      rel_taiwan: 25,      // sem relação formal, mas a TSMC virou assunto de política industrial
      rel_mexico: 25,
      rel_venezuela: 30,   // outro barril com desconto, quando Washington deixa
    },

    tensoes: [
      'Caxemira e escalada nuclear com o Paquistão',
      'Fronteira contestada com a China no Himalaia',
      'Dependência de 85% do petróleo importado',
      'Tensão comunal e erosão do secularismo',
    ],

    estadoInicial: {
      aprovacao: 60,
      estabilidade: 55,
      // soft_power alto e barato: Bollywood, ioga, diáspora de 32 milhões e a maior democracia
      // do mundo como argumento. Rende mais que o orçamento de defesa.
      soft_power: 52,
      seguranca: 45,      // duas fronteiras nucleares vivas e insurgência interna em três regiões
      temp_guerra: 40,
      temp_economia: 62,  // a economia grande que mais cresce — de uma base baixa
      liberdades: 45,     // eleição de verdade, imprensa sob pressão real: democracia com asterisco
      poder_militar: 62,
      // economia (US$ trilhões)
      pib: 3.9,
      tesouro: 0.7,       // reservas ~US$ 690 bi
      divida: 82,
      aliquota: 18,       // arrecada pouco: a base formal é estreita demais pro tamanho do país
      // capacidades (0–100)
      inteligencia: 55,   // RAW competente na vizinhança, limitada fora dela
      capacidade_ind: 60, // "Make in India" real na farmácia e no software; na defesa, ainda importa
      uranio: 40,         // reserva pequena e minério pobre — daí a obsessão com o turno do tório
      territorio: 1,
      ogivas: 170,        // doutrina de não-primeiro-uso, ao contrário do vizinho
    },

    fiosSemente: [
      { tema: 'Caxemira e o Paquistão', intensidade: 58, alvo_pressao: 'temp_guerra', atores: ['paquistao', 'china'] },
      { tema: 'Fronteira do Himalaia', intensidade: 50, alvo_pressao: 'seguranca', atores: ['china'] },
      { tema: 'Fome energética e barril importado', intensidade: 52, alvo_pressao: 'temp_economia', atores: ['russia', 'arabia'] },
      { tema: 'Tensão comunal interna', intensidade: 45, alvo_pressao: 'estabilidade', atores: [] },
    ],
  },

  // Ordem de batalha aproximada. Efetivo enorme, muito material de era soviética.
  forcas: {
    infantaria: 1200000,  // segundo maior exército do mundo
    blindados: 4600,      // T-72 e T-90 em massa; o Arjun nacional é minoria no próprio país
    artilharia: 3300,
    helicopteros: 800,
    cacas: 600,           // frota de zoológico: Su-30MKI russo, Rafale francês, MiG-29, Tejas nacional
    bombardeiros: 0,      // não opera bombardeiro estratégico; o Su-30MKI faz o papel de ataque
    drones: 200,
    navios: 130,
    submarinos: 18,       // um deles nuclear (Arihant): a perna marítima da tríade
    porta_avioes: 2,      // Vikramaditya (ex-soviético) e Vikrant (o primeiro construído em casa)
    misseis: 800,         // BrahMos, o mais rápido de cruzeiro em serviço, feito com a Rússia
    defesa_aerea: 40,    // S-400 russo, Akash nacional e Barak-8 com Israel: três fornecedores, um céu
    ogivas: 170,
  },

  // Reaproveitadas de dados/empresas.js (chave IND).
  empresas: [
    { id: 'ongc', nome: 'ONGC', setor: 'Energia', estatal: true, participacao: 58, valor: 0.03, margem: 0.07,
      petroleo: 0.7, logo: null, bonus: { pib: 0.1 },
      desc: 'Estatal do petróleo indiano. Produz pouco pro tamanho da fome do país — a Índia importa 85% do que queima.' },
    { id: 'hal', nome: 'Hindustan Aeronautics', setor: 'Aeroespacial', estatal: true, participacao: 71, valor: 0.03, margem: 0.08,
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Hindustan_Aeronautics_Limited_Logo.svg/330px-Hindustan_Aeronautics_Limited_Logo.svg.png',
      bonus: { capacidade_ind: 3 },
      desc: 'Estatal que faz o Tejas — projeto iniciado em 1984, primeiro esquadrão em 2016. Orgulho nacional e atraso crônico na mesma fábrica.' },
  ],

  equipamentos: {
    _nome: 'Índia',
    infantaria:   { nome: 'Fuzileiro do Exército Indiano', fab: 'Ordnance Factory Board', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Woman_pins_flower_on_Indian_soldier.jpg/330px-Woman_pins_flower_on_Indian_soldier.jpg' },
    blindados:    { nome: 'Arjun Mk1A', fab: 'DRDO / HVF', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Arjun_MK1A_field_trials.jpg/330px-Arjun_MK1A_field_trials.jpg' },
    artilharia:   { nome: 'Dhanush', fab: 'Ordnance Factory Board', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Dhanush_howitzer_during_Republic_Day_Parade_2017.jpg/330px-Dhanush_howitzer_during_Republic_Day_Parade_2017.jpg' },
    helicopteros: { nome: 'HAL Rudra', fab: 'HAL', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Rudra_attack_helicopter.jpg/330px-Rudra_attack_helicopter.jpg' },
    cacas:        { nome: 'HAL Tejas', fab: 'HAL', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/HAL_Tejas_%28LA-5018%29_of_Squadron_18_Flying_Bullets.jpg/330px-HAL_Tejas_%28LA-5018%29_of_Squadron_18_Flying_Bullets.jpg' },
    // Não há bombardeiro estratégico na força: o Su-30MKI é quem leva a carga pesada.
    bombardeiros: { nome: 'Su-30MKI (ataque)', fab: 'Sukhoi / HAL', origem: 'RUS', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/SU-30MKI_India.jpg/330px-SU-30MKI_India.jpg' },
    navios:       { nome: 'Destróier INS Kolkata', fab: 'Mazagon Dock', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Sideview_of_INS_Kolkata_%28D63%29.jpg/330px-Sideview_of_INS_Kolkata_%28D63%29.jpg' },
    submarinos:   { nome: 'Classe Kalvari', fab: 'Mazagon Dock / Naval Group', origem: 'IND', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/INS_Kalvari_Sea_Trial.JPG/330px-INS_Kalvari_Sea_Trial.JPG' },
    porta_avioes: { nome: 'INS Vikrant', fab: 'Cochin Shipyard', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/IAC1_Vikrant_at_Cochin.jpg/330px-IAC1_Vikrant_at_Cochin.jpg' },
    misseis:      { nome: 'BrahMos', fab: 'BrahMos Aerospace', origem: 'IND', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/The_Brahmos_Missile_system_passes_through_the_Rajpath_during_the_full_dress_rehearsal_for_the_Republic_Day_Parade_in_New_Delhi_on_January_23%2C2006.jpg/330px-The_Brahmos_Missile_system_passes_through_the_Rajpath_during_the_full_dress_rehearsal_for_the_Republic_Day_Parade_in_New_Delhi_on_January_23%2C2006.jpg' },
    // Não achei no Commons foto que eu pudesse confirmar como Heron em serviço indiano.
    drones:       { nome: 'IAI Heron', fab: 'Israel Aerospace Industries', origem: 'ISR', proprio: false, foto: null, sugerido: true },
  },
};
