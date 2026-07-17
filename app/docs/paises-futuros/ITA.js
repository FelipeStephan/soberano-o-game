// FICHA DO MUNDO — Itália, era 2026. Mesmo formato EXATO do bra.js.
// MÓDULO FUTURO: pronto para virar src/dados/paises/ita.js quando a Itália entrar no jogo.
//
// ⚠️ A Itália é o ÚNICO dos quatro que NÃO existe sequer como NPC em src/dados/paises.js hoje.
// Ao integrá-la, é preciso INTRODUZIR a chave de relação 'rel_italia' (ver AUXILIARES) e,
// idealmente, semear rel_italia nas relacoes dos outros países. Sem isso, o jogo cai no
// fallback rel_<iso> automático (funciona, mas fica genérico).
//
// LÍDER FICTÍCIO: Presidente do Conselho Aurora Malaspina. Personagem inventada — regra do
// projeto (o jogo tem missão de assassinato; nunca modelamos violência contra pessoa real).
// "Presidente do Conselho" é o cargo real do chefe de governo italiano (o presidente da
// República é figura cerimonial e separada).
//
// Fotos: URLs verificadas na hora contra o Wikimedia (upload.wikimedia.org resolve). O que
// não foi confirmado do item certo vai com foto:null + sugerido:true, como no bra.js.

export const PAIS_ITA = {
  ficha: {
    ano: 2026,
    pais: 'Itália',
    iso: 'ITA',
    presidente: 'Presidente do Conselho Aurora Malaspina', // FICTÍCIA — ver nota no topo
    capital: 'Roma',
    bandeira: '🇮🇹',
    pino: { lat: 41.90, lng: 12.50 },

    resumo: `Oitava economia do mundo e a mais subestimada da Europa: potência industrial que exporta
máquina, moda, comida e Ferrari, escondida atrás de uma dívida de 137% do PIB e de um governo que,
historicamente, dura menos que um contrato de aluguel. Segunda manufatura da União Europeia depois da
Alemanha, dona de uma marinha de verdade — dois porta-aviões, oito submarinos e fragatas que fabrica em
casa e vende para o mundo. Guarda a passagem central do Mediterrâneo, recebe a migração que atravessa da
Líbia e depende de gás que vem do outro lado desse mesmo mar. Sem ogivas próprias, hospeda as bombas
americanas em Ghedi e Aviano. O soft power é planetário e quase de graça: ninguém precisa de tradução
para entender por que o mundo quer ser um pouco italiano. O poder é real; é a política que raramente
deixa usá-lo.`,

    // Ponto de vista DA ITÁLIA. Sem rel_italia. Núcleo da UE — por isso não há rel_ue aqui
    // (como Alemanha e França, a Itália É a UE no que a mesa decide).
    relacoes: {
      rel_eua: 60,        // aliada de OTAN, base de Aviano e Sigonella; o guarda-chuva que ninguém discute alto
      rel_china: 5,       // entrou na Nova Rota da Seda em 2019 e saiu em 2023 — a única do G7 a fazer as duas coisas
      rel_russia: -55,    // dependia do gás russo e teve de trocá-lo às pressas pelo argelino e o GNL
      rel_reino: 45,      // parceira no caça de 6ª geração (GCAP) com Japão e Reino Unido
      rel_ira: -20,
      rel_brasil: 40,     // a maior colônia italiana fora da Itália mora em São Paulo e no Sul
      rel_israel: 35,
      rel_taiwan: 12,
      rel_arabia: 30,
      rel_india: 35,
      rel_japao: 55,      // sócia do programa GCAP; o caça do futuro é feito a três mãos
      rel_coreia: 42,
      rel_norte: -45,
      rel_mexico: 30,
      rel_canada: 55,     // G7 e OTAN, relação cordial e sem atrito
      rel_australia: 40,
      rel_turquia: 20,    // rival no Mediterrâneo e na Líbia, sócia obrigatória na OTAN
      rel_paquistao: 12,
      rel_venezuela: -10,
      rel_indonesia: 28,
      rel_egito: 25,      // sócio migratório e energético, e a sombra do caso Regeni sobre tudo
      rel_ucrania: 55,
    },

    tensoes: [
      'Dívida pública de 137% do PIB e crescimento anêmico crônico',
      'Migração pelo Mediterrâneo central vinda da Líbia e da Tunísia',
      'Dependência de gás importado após a ruptura com a Rússia',
      'Demografia em colapso: a população mais envelhecida da Europa',
    ],

    estadoInicial: {
      aprovacao: 40,
      estabilidade: 50,    // governo italiano de vida curta é o estado natural das coisas
      soft_power: 80,      // cultura, cozinha, moda, design, história — o maior ativo do país, e de graça
      seguranca: 55,       // estável, mas com máfia territorial e uma fronteira marítima sob pressão
      temp_guerra: 32,     // longe do front leste, mas na linha de frente do Mediterrâneo e da Líbia
      temp_economia: 35,   // estagnação de duas décadas: o país cresce menos que quase toda a UE
      liberdades: 80,
      // poder_militar 55: marinha e indústria de defesa de primeira linha (Leonardo, Fincantieri),
      // mas exército pequeno e sucateado por anos abaixo dos 2% da OTAN. O mar puxa a nota pra cima.
      poder_militar: 55,
      // economia (US$ trilhões)
      pib: 2.3,
      tesouro: 0.22,       // reservas + ouro: a Itália guarda ~2.450 t de ouro, a terceira maior do mundo
      divida: 137,         // uma das maiores dívidas/PIB do planeta
      aliquota: 43,        // carga tributária altíssima e uma evasão fiscal de proporção nacional
      // capacidades (0–100)
      inteligencia: 55,    // AISE (externa) e AISI (interna), coordenadas pelo DIS
      capacidade_ind: 72,  // segunda manufatura da UE: máquina-ferramenta, naval, aeroespacial, luxo
      uranio: 10,          // saiu do nuclear em referendo (1987, reforçado em 2011); sem programa
      territorio: 1,
      ogivas: 0,           // sem arma própria; hospeda ~40 bombas B61 americanas em Ghedi e Aviano
    },

    fiosSemente: [
      { tema: 'Dívida pública e o olhar dos mercados e de Bruxelas', intensidade: 55, alvo_pressao: 'temp_economia', atores: ['ue'] },
      { tema: 'Migração pelo Mediterrâneo central', intensidade: 52, alvo_pressao: 'estabilidade', atores: ['ue'] },
      { tema: 'Segurança energética após o gás russo', intensidade: 48, alvo_pressao: 'seguranca', atores: ['russia'] },
      { tema: 'Colapso demográfico e o encolhimento da força de trabalho', intensidade: 44, alvo_pressao: 'temp_economia', atores: [] },
    ],
  },

  // Ordem de batalha aproximada. Uma potência NAVAL de verdade num corpo de exército médio:
  // dois navios de aviação (Cavour + Trieste operam o F-35B), oito submarinos, fragatas de exportação.
  forcas: {
    infantaria: 95000,    // Esercito enxuto; total ativo das três forças ~165 mil
    blindados: 200,       // Ariete C1 (poucos operacionais, em modernização) mais Centauro e Freccia sobre rodas
    artilharia: 150,      // PzH2000 e FH70
    helicopteros: 200,    // frota grande da Leonardo: AW129 Mangusta, NH90, AW101
    cacas: 95,            // Eurofighter Typhoon mais F-35A/B; sócia do caça de 6ª geração GCAP
    bombardeiros: 0,
    drones: 10,           // MQ-9 Reaper e Predator; o Piaggio P.1HH nacional
    navios: 55,           // destroieres Orizzonte, fragatas FREMM/Bergamini, patrulha PPA
    submarinos: 8,        // classe Todaro (Type 212) e a antiga classe Sauro
    porta_avioes: 2,      // Cavour (CVH) e o novo Trieste (LHD) — os dois embarcam o F-35B
    misseis: 40,          // Teseo/Otomat antinavio e o Aster para defesa de área
    defesa_aerea: 8,      // SAMP/T com míssil Aster 30, franco-italiano, de longo alcance
    ogivas: 0,
  },

  empresas: [
    { id: 'eni', nome: 'Eni', setor: 'Energia', estatal: true, participacao: 30, valor: 0.05, margem: 0.10,
      petroleo: 1.6, logo: null, bonus: { pib: 0.12 },
      desc: 'A supermajor italiana, com o Estado (Tesouro + CDP) segurando cerca de 30%. Depois que o gás russo secou, foi ela que costurou às pressas os contratos com Argélia, Líbia, Egito e Congo. Política externa com balanço trimestral.' },
    { id: 'enel', nome: 'Enel', setor: 'Energia', estatal: true, participacao: 24, valor: 0.07, margem: 0.10,
      logo: null, bonus: { pib: 0.08, capacidade_ind: 2 },
      desc: 'Uma das maiores elétricas do mundo, com o Estado ainda dono de quase um quarto. Presente em três continentes — quem acende a luz de meia Europa e de boa parte da América Latina sabe onde aperta.' },
    { id: 'leonardo', nome: 'Leonardo', setor: 'Defesa', estatal: true, participacao: 30, valor: 0.03, margem: 0.09,
      logo: null, bonus: { capacidade_ind: 3 },
      desc: 'O campeão nacional de defesa, ~30% do Estado. Faz helicóptero, radar e eletrônica, é sócia do Eurofighter e do caça GCAP. A ação disparou quando a Europa toda resolveu rearmar de uma vez.' },
    { id: 'fincantieri', nome: 'Fincantieri', setor: 'Naval', estatal: true, participacao: 71, valor: 0.01, margem: 0.05,
      logo: null, bonus: { capacidade_ind: 3 },
      desc: 'Um dos maiores estaleiros do planeta, controlado pelo Estado via CDP. Constrói o cruzeiro de luxo do mundo inteiro e a fragata que a marinha italiana vende de Doha a Jacarta. Aço soberano com carteira de exportação.' },
    { id: 'ferrari', nome: 'Ferrari', setor: 'Automotivo', estatal: false, participacao: 0, valor: 0.08, margem: 0.25,
      logo: null, bonus: { soft_power: 3 },
      desc: 'Vale mais que montadoras que fazem mil vezes mais carros — porque não vende carro, vende o mito. Margem de artigo de luxo e uma marca que projeta a Itália em cada Grande Prêmio. Soft power com motor V12.' },
  ],

  equipamentos: {
    _nome: 'Itália',
    infantaria:   { nome: 'Fuzileiro (Beretta ARX-160)', fab: 'Beretta', origem: 'ITA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Beretta_ARX-160%2C_Interpolitex_2012.jpg/330px-Beretta_ARX-160%2C_Interpolitex_2012.jpg' },
    blindados:    { nome: 'Carro Armato C1 Ariete', fab: 'Consorzio Iveco-OTO Melara (CIO)', origem: 'ITA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Italian_Army_-_4th_Tank_Regiment_-_Ariete_tanks_during_an_exercise_at_Capo_Teulada_October_2022.jpg/330px-Italian_Army_-_4th_Tank_Regiment_-_Ariete_tanks_during_an_exercise_at_Capo_Teulada_October_2022.jpg' },
    cacas:        { nome: 'Eurofighter Typhoon', fab: 'Leonardo / Airbus / BAE', origem: 'ITA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RAF_Eurofighter_EF-2000_Typhoon_F2_Lofting-1.jpg/330px-RAF_Eurofighter_EF-2000_Typhoon_F2_Lofting-1.jpg' },
    porta_avioes: { nome: 'Porta-aviões ITS Cavour', fab: 'Fincantieri', origem: 'ITA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Cavour_%28550%29.jpg/330px-Cavour_%28550%29.jpg' },
    helicopteros: { nome: 'AW129 Mangusta', fab: 'Leonardo (AgustaWestland)', origem: 'ITA', proprio: true,
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/20150506052017%21Agusta_A129A_Mangusta%2C_Italy_-_Army_%28cropped%29.jpg/330px-20150506052017%21Agusta_A129A_Mangusta%2C_Italy_-_Army_%28cropped%29.jpg' },
    artilharia:   { nome: 'Panzerhaubitze 2000', fab: 'KNDS / Rheinmetall', origem: 'DEU', proprio: 'licenca',
      foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Panzerhaubitze_2000_-_Bundeswehr_Military_History_Museum%2C_Dresden.jpg/330px-Panzerhaubitze_2000_-_Bundeswehr_Military_History_Museum%2C_Dresden.jpg' },
    navios:       { nome: 'Fragata FREMM classe Bergamini', fab: 'Fincantieri', origem: 'ITA', proprio: true, foto: null, sugerido: true },
    submarinos:   { nome: 'Submarino classe Todaro (Type 212)', fab: 'Fincantieri (licença tkMS)', origem: 'DEU', proprio: 'licenca', foto: null, sugerido: true },
    drones:       { nome: 'MQ-9A Reaper', fab: 'General Atomics', origem: 'USA', proprio: false, foto: null, sugerido: true },
    misseis:      { nome: 'Teseo Mk-2 (antinavio)', fab: 'MBDA Italia', origem: 'ITA', proprio: true, foto: null, sugerido: true },
    defesa_aerea: { nome: 'SAMP/T (Aster 30)', fab: 'MBDA (Eurosam)', origem: 'ITA', proprio: 'licenca', foto: null, sugerido: true },
  },
};

/* ══════════════════════════ AUXILIARES (colar nos arquivos de src/dados) ══════════════════════════

// ── src/dados/paises.js  →  PAISES ── (NOVO: a Itália não existe hoje; introduz rel_italia)
ITA: { nome: 'Itália',           rel: 'rel_italia',  bloco: 'OTAN / UE',       forca: 58 },
// E, idealmente, semear "rel_italia: <valor>" nas relacoes dos demais países (bra, deu, fra, gbr...).
// Sem isso o jogo usa o fallback rel_<iso> — funcional, porém genérico.

// ── src/dados/efetivoMilitar.js ──
EFETIVO_ATIVO:   ITA: 175000,    // teto de fardados sustentáveis (Forze Armate)
RESERVA_MILITAR: ITA: 18000,     // reserva mobilizável (pequena — fim do serviço obrigatório em 2005)

// ── src/dados/petroleo.js  →  PETROLEO ── (NOVO: adicionar. Importadora — quase não produz)
ITA: { reservas: 1,   producao: 0.1,  consumo: 1.2,  custo: 30, tipo: 'Val d\\'Agri',    campo: 'Val d\\'Agri (Basilicata)',
       nota: 'Quase sem petróleo próprio e refém do que vem do outro lado do Mediterrâneo. A Eni troca contrato com Argélia, Líbia e Egito como quem troca de fornecedor num sábado. A dependência é a política externa.' },

// ── src/dados/soldados.js  →  SOLDADO_POR_PAIS ──
ITA: { nome: 'Fuzileiro (Beretta ARX-160)', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Beretta_ARX-160%2C_Interpolitex_2012.jpg/330px-Beretta_ARX-160%2C_Interpolitex_2012.jpg' },

// ── src/dados/gabinetes.js  →  GABINETES ── (nomes FICTÍCIOS; ids estáveis; cargos reais da Itália)
ITA: [
  { id: 'sec_defesa', papel: 'Ministro da Defesa', nome: 'Ammiraglio Corrado Ventimiglia',
    personalidade: 'Almirante num país onde o poder de verdade está no mar, e ele sabe: dois navios de aviação, fragata de exportação, submarino que a Alemanha licenciou. O exército é a parte pobre da conta, e passou anos abaixo dos 2% da OTAN. "Presidente, a Itália não tem forças armadas medíocres. Tem uma marinha ótima e um exército esquecido."' },
  { id: 'dir_cia', papel: 'Diretor da AISE', nome: 'Isabella Contarini',
    personalidade: 'Chefia a inteligência externa num país que faz espionagem com a discrição de quem inventou a diplomacia. Opera na Líbia, no Sahel e nos Bálcãs, onde o gás e a migração se decidem. O caso Regeni no Egito ainda assombra cada reunião. "Sabemos onde o gás nasce e onde a máfia atraca, senhora. O resto é literatura."' },
  { id: 'sec_tesouro', papel: 'Ministro da Economia e Finanças', nome: 'Gianmarco Ferraris',
    personalidade: 'Administra a terceira maior dívida do mundo desenvolvido e um spread que sobe cada vez que Roma espirra. Sabe que Bruxelas conta cada euro e que o mercado precifica antes de ele terminar a coletiva. "Não temos crise, presidente. Temos 137% de dívida e a boa educação de fingir que é normal."' },
  { id: 'sec_estado', papel: 'Ministro dos Negócios Estrangeiros', nome: 'Lorenzo Da Ponte',
    personalidade: 'Faz malabarismo entre a lealdade atlântica, o coração europeu e um Mediterrâneo em chamas. Saiu da Rota da Seda chinesa sem romper com Pequim, contém migração fazendo acordo com quem não devia, e chama tudo isso de pragmatismo. "Somos a ponte entre a Europa e o caos, senhora. Ponte se atravessa nos dois sentidos."' },
  { id: 'chefe_gabinete', papel: 'Subsecretário da Presidência do Conselho', nome: 'Fulvio Mastrangelo',
    personalidade: 'Conta cadeira numa coalizão que muda de forma a cada estação — o governo italiano médio dura pouco mais de um ano, e ele planeja com essa certeza. Sabe qual pequeno partido ameaça sair nesta semana. "Não gerimos um governo, presidente. Gerimos a próxima crise de governo."' },
],
════════════════════════════════════════════════════════════════════════════════════════════════ */
