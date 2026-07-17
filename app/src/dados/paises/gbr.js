// FICHA DO MUNDO — Reino Unido, era 2026. Mesmo esquema do FICHA_EUA_2026.
// Líder FICTÍCIO por regra do projeto (o jogo tem missões de assassinato).

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const PAIS_GBR = {
  ficha: {
    ano: 2026,
    pais: 'Reino Unido',
    iso: 'GBR',
    presidente: 'Primeiro-Ministro Edward Marchmont', // FICTÍCIO
    capital: 'Londres',
    pino: { lat: 51.51, lng: -0.13 },

    resumo: `Um império que virou ilha e ainda não desmarcou os compromissos. Saiu da União
Europeia prometendo Global Britain e descobriu que perder o mercado do lado de casa não é
compensado por acordos comerciais com a Austrália. Tem duas cartas de verdade: a inteligência —
o GCHQ e o MI6 são a razão pela qual Washington ainda atende o telefone — e a bomba, embora a
bomba seja meio emprestada: os mísseis Trident vêm de um pool comum mantido na Geórgia,
Estados Unidos, e a Grã-Bretanha só põe a ogiva. Dois porta-aviões novos e caros, e escoltas de
menos para os dois navegarem juntos com segurança. A Escócia pergunta de novo sobre independência,
e por acaso é lá que a frota nuclear inteira fica ancorada.`,

    relacoes: {
      // O país é o Reino Unido — por isso não há rel_reino aqui.
      rel_eua: 85,        // a "relação especial": a inteligência é compartilhada de verdade
      rel_china: -25,     // baniu a Huawei do 5G depois de pressão americana, e Hong Kong azedou o resto
      rel_russia: -70,    // Salisbury: novichok numa cidadezinha inglesa, e ninguém esqueceu
      rel_ira: -40,
      rel_brasil: 30,
      rel_israel: 45,
      rel_taiwan: 15,
      rel_arabia: 40,     // Al-Yamamah: o maior contrato de armas da história britânica, e o mais sujo
      rel_ue: 35,         // divorciado e obrigado a jantar junto toda semana
      rel_ucrania: 72,    // o mais entusiasta da Europa: treinou os soldados e mandou tanque primeiro
      rel_india: 45,
      rel_japao: 60,      // o GCAP: os dois vão construir o caça de sexta geração juntos, com a Itália
      rel_coreia: 40,
      rel_norte: -55,
      rel_mexico: 25,
      rel_canada: 75,     // Commonwealth, Five Eyes, e o mesmo chefe de Estado
      rel_australia: 80,  // AUKUS, Five Eyes. O submarino australiano vai sair de Barrow-in-Furness
      rel_turquia: 25,
      rel_paquistao: 25,
      rel_venezuela: -25, // Londres treina os guianenses e Caracas percebeu
      rel_indonesia: 25,
      rel_egito: 25,
    },

    tensoes: [
      'Custo do Brexit: comércio menor e mão de obra que não volta',
      'Serviço de saúde e serviços públicos em colapso lento',
      'Independência escocesa — e a base nuclear de Faslane fica lá',
      'Frota de superfície pequena demais para escoltar dois porta-aviões',
      'Dependência americana no Trident, que é dissuasão alugada',
    ],

    estadoInicial: {
      aprovacao: 32,
      estabilidade: 55,
      soft_power: 78,      // BBC, Premier League, universidades e o idioma. Ainda rende
      seguranca: 60,
      temp_guerra: 36,
      temp_economia: 36,
      poder_militar: 60,
      liberdades: 79,
      pib: 3.4,
      tesouro: 0.2,
      divida: 101,         // passou de 100% e não desce desde a pandemia
      aliquota: 35,
      // inteligencia 82: quase nível americano, e é o ativo real do país. Os Five Eyes
      // nasceram do acordo UKUSA de 1946 — a Grã-Bretanha é sócia fundadora, não convidada.
      inteligencia: 82,
      capacidade_ind: 55,  // desindustrializou nos anos 80 e trocou a fábrica pela City
      uranio: 45,
      territorio: 1,
      ogivas: 225,         // só componente naval: quatro SSBN, um sempre no mar, desde 1969 sem falhar
    },

    fiosSemente: [
      { tema: 'A conta do Brexit e o comércio que não voltou', intensidade: 55, alvo_pressao: 'temp_economia', atores: ['ue'] },
      { tema: 'Serviços públicos em colapso lento', intensidade: 58, alvo_pressao: 'aprovacao', atores: [] },
      { tema: 'Independência escocesa e a base de Faslane', intensidade: 45, alvo_pressao: 'estabilidade', atores: [] },
      { tema: 'Dissuasão alugada: o Trident é americano', intensidade: 40, alvo_pressao: 'seguranca', atores: ['eua'] },
    ],
  },

  // 4 SSBN classe Vanguard + 5 SSN classe Astute = 9. Como a França, só opera nuclear.
  forcas: {
    infantaria: 140000,  // o menor exército britânico desde as guerras napoleônicas
    blindados: 210,
    artilharia: 90,
    helicopteros: 200,
    cacas: 150,
    bombardeiros: 0,     // aposentou o bombardeiro estratégico com o Vulcan, em 1984
    drones: 20,
    navios: 25,
    submarinos: 9,
    porta_avioes: 2,     // Queen Elizabeth e Prince of Wales
    misseis: 120,
    defesa_aerea: 8,     // Sky Sabre substituiu o Rapier; a ilha aposta na Marinha, não em bateria em terra
    ogivas: 225,
  },

  empresas: [
    { id: 'bae', nome: 'BAE Systems', setor: 'Defesa', estatal: false, participacao: 0, valor: 0.05, margem: 0.09,
      logo: null, bonus: { capacidade_ind: 3 },
      desc: 'O Estado britânico tem uma golden share: pode vetar qualquer estrangeiro que queira comprar. Submarino nuclear não se vende.' },
    { id: 'rr', nome: 'Rolls-Royce', setor: 'Aeroespacial', estatal: false, participacao: 0, valor: 0.08, margem: 0.07,
      logo: null, bonus: { capacidade_ind: 3 },
      desc: 'Faz o reator que move todo submarino nuclear britânico — por isso o Estado guarda uma golden share aqui também. Quebrou em 1971 e foi nacionalizada de emergência; o governo aprendeu a lição e nunca mais soltou a coleira de vez.' },
    { id: 'gbe', nome: 'Great British Energy', setor: 'Energia', estatal: true, participacao: 100, valor: 0.01, margem: 0.02,
      logo: null, bonus: { pib: 0.04, aprovacao: 2 },
      desc: 'Estatal de energia criada em 2025, sediada em Aberdeen, capitalizada com 8,3 bilhões de libras. Depois de quarenta anos privatizando tudo que Thatcher tocou, o Estado voltou a ser dono de usina — e a oposição chama de socialismo enquanto a conta de luz não desce.' },
    { id: 'sellafield', nome: 'Sellafield Ltd', setor: 'Energia', estatal: true, participacao: 100, valor: 0.01, margem: -0.04,
      logo: null, bonus: { uranio: 4, capacidade_ind: 1 },
      desc: 'Cem por cento do Estado, e o depósito de lixo nuclear mais complicado da Europa: 140 toneladas de plutônio civil e um passivo de limpeza estimado em 130 bilhões de libras até 2120. Aqui nasceu a bomba britânica. Agora é uma conta que os bisnetos vão pagar.' },
    { id: 'nats', nome: 'NATS', setor: 'Infraestrutura', estatal: true, participacao: 49, valor: 0.005, margem: 0.05,
      logo: null, bonus: { pib: 0.03, seguranca: 2 },
      desc: 'Controle de tráfego aéreo, 49% do Estado numa parceria público-privada dos anos 2000 que ninguém consegue explicar em uma frase. Quando o sistema caiu em 2023, meio milhão de passageiros descobriu de quem era a culpa: de todo mundo e de ninguém.' },
  ],

  equipamentos: {
    _nome: 'Reino Unido',
    blindados:    { nome: 'Challenger 2',       fab: 'BAE Systems',           origem: 'GBR', proprio: true,
      foto: `${W}/3/30/Challenger_2_Main_Battle_Tank_patrolling_outside_Basra%2C_Iraq_MOD_45148325.jpg/330px-Challenger_2_Main_Battle_Tank_patrolling_outside_Basra%2C_Iraq_MOD_45148325.jpg` },
    porta_avioes: { nome: 'HMS Queen Elizabeth', fab: 'Aircraft Carrier Alliance', origem: 'GBR', proprio: true,
      foto: `${W}/8/81/HMS_Queen_Elizabeth_in_Gibraltar_-_2018_%2828386226189%29.jpg/330px-HMS_Queen_Elizabeth_in_Gibraltar_-_2018_%2828386226189%29.jpg` },
    submarinos:   { nome: 'Classe Astute',      fab: 'BAE Systems',           origem: 'GBR', proprio: true,
      foto: `${W}/f/f9/HMS_Ambush_long.jpg/330px-HMS_Ambush_long.jpg` },
    cacas:        { nome: 'Eurofighter Typhoon FGR4', fab: 'BAE / Airbus / Leonardo', origem: 'GBR', proprio: true,
      foto: `${W}/5/53/RAF_Typhoon_inflight.jpg/330px-RAF_Typhoon_inflight.jpg` },
    artilharia:   { nome: 'AS-90 Braveheart',   fab: 'BAE Systems',           origem: 'GBR', proprio: true,
      foto: `${W}/f/f0/AS-90_self-propelled_artillery.JPG/330px-AS-90_self-propelled_artillery.JPG` },
    navios:       { nome: 'Destróier Type 45',  fab: 'BAE Systems',           origem: 'GBR', proprio: true,
      foto: `${W}/d/de/Royal_Navy_Type_45_destroyer_HMS_Daring_MOD_45154175.jpg/330px-Royal_Navy_Type_45_destroyer_HMS_Daring_MOD_45154175.jpg` },
    helicopteros: { nome: 'Apache AH-64E',      fab: 'Boeing / Leonardo',     origem: 'USA', proprio: 'licenca',
      foto: `${W}/1/10/UK_Army_Air_Corps_AHDT_WAH-64D_Longbow_Apache_AH1_ZJ203_ILA_Berlin_2016_02.jpg/330px-UK_Army_Air_Corps_AHDT_WAH-64D_Longbow_Apache_AH1_ZJ203_ILA_Berlin_2016_02.jpg` },
    // O Trident é o caso mais estranho do inventário ocidental: o míssil é americano e sai
    // de um estoque comum em King's Bay, na Geórgia. A ogiva é britânica. `proprio: false`
    // é literal aqui — a dissuasão soberana depende de um depósito no exterior.
    misseis:      { nome: 'Trident II D5',      fab: 'Lockheed Martin',       origem: 'USA', proprio: false,
      foto: `${W}/9/99/Trident_II_missile_image.jpg/330px-Trident_II_missile_image.jpg` },
  },
};
