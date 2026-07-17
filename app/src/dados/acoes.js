// CATÁLOGO DE AÇÕES — o arsenal do WAR RPG. Tecnologia do mundo atual.
// Campos: custo (US$ trilhões), custoPA (pontos de ação), prob (chance de sucesso),
// efeitos / efeitos_falha, politico (tags de bússola), requer (gate pra enfileirar),
// desbloqueio (fica OCULTA/travada até a condição bater — vira surpresa), dica (como destravar).

export const CATEGORIAS = [
  { nome: 'Militar', icone: '🎖️' },
  { nome: 'Arsenal', icone: '☢️' },
  { nome: 'Inteligência', icone: '🕶️' },
  { nome: 'Economia', icone: '💵' },
  { nome: 'Diplomacia', icone: '🕊️' },
  { nome: 'Ciência', icone: '🔬' },
  { nome: 'Mídia', icone: '📡' },
  { nome: 'Política', icone: '🏛️' },
];

export const ACOES = [
  // ── INVESTIMENTOS DE VALOR LIVRE (você define quanto injetar) ────────
  { id: 'inv_militar', categoria: 'Militar', icone: '💰', nome: 'Investir nas Forças Armadas', custoPA: 1, descricao: 'Você define quanto injetar. Mais dinheiro, mais poderio.',
    escalavel: { chave: 'poder_militar', rotulo: 'Poder Militar', porTri: 8, extra: { seguranca: 2 } } },
  { id: 'inv_economia', categoria: 'Economia', icone: '💰', nome: 'Injetar na Economia', custoPA: 1, descricao: 'Você define o pacote de estímulo. Cresce o PIB.',
    escalavel: { chave: 'pib', rotulo: 'PIB', porTri: 1.6, extra: { temp_economia: 3, aprovacao: 2 } } },
  { id: 'inv_ciencia', categoria: 'Ciência', icone: '💰', nome: 'Financiar Ciência & Tecnologia', custoPA: 1, descricao: 'Você define o orçamento. Ergue a capacidade industrial.',
    escalavel: { chave: 'capacidade_ind', rotulo: 'Cap. Industrial', porTri: 6, extra: { inteligencia: 2 } } },
  { id: 'inv_intel', categoria: 'Inteligência', icone: '💰', nome: 'Reforçar a Inteligência', custoPA: 1, descricao: 'Você define o valor. Amplia sua rede de espionagem.',
    escalavel: { chave: 'inteligencia', rotulo: 'Inteligência', porTri: 6, extra: { seguranca: 2 } } },
  { id: 'inv_midia', categoria: 'Mídia', icone: '💰', nome: 'Bombardeio de Propaganda', custoPA: 1, descricao: 'Você define o quanto gastar moldando a narrativa.',
    escalavel: { chave: 'aprovacao', rotulo: 'Aprovação', porTri: 5, extra: { soft_power: 3 } } },

  // ── MILITAR ─────────────────────────────────────────────────────────
  // (Não há "Brigada de Infantaria" para encomendar: soldado é GENTE, recrutada em
  // Política ▸ Alistamento/Reserva/Conscrição e no dossiê de Soldados — ver ui/soldados.js.)
  //
  // FICHAS DE EQUIPAMENTO (compras de material): toda ação com `forcas` vira um chip
  // "FICHA ▸" na UI (ui/jogo.js) que abre ui/equipamento.js — a compra real acontece lá,
  // via aplicarForcas. Por isso estas entradas NÃO carregam efeitos/prob/politico/requer:
  // esses campos nunca rodariam (auditoria 2026-07-17, fato 2 — "ações mortas"). São
  // fichas puras: id, categoria, icone, nome, custo, custoPA, descricao, forcas
  // (+ desbloqueio/dica quando houver).
  { id: 'blindados', categoria: 'Militar', icone: '🚜', nome: 'Divisão Blindada (M1 Abrams)', custo: 0.05, custoPA: 1,
    descricao: 'Tanques de batalha principal.', forcas: { blindados: 400 } },
  { id: 'helis', categoria: 'Militar', icone: '🚁', nome: 'Esquadrão de Apache', custo: 0.08, custoPA: 1,
    descricao: 'Helicópteros de ataque. Mobilidade tática.', forcas: { helicopteros: 60 } },
  { id: 'cacas', categoria: 'Militar', icone: '✈️', nome: 'Esquadrão F-35', custo: 0.18, custoPA: 1,
    descricao: 'Caça furtivo de 5ª geração.', forcas: { cacas: 24 } },
  { id: 'porta_avioes', categoria: 'Militar', icone: '🛳️', nome: 'Porta-aviões Nuclear', custo: 0.45, custoPA: 2,
    descricao: 'Projeção de poder global.', forcas: { porta_avioes: 1, cacas: 40 } },
  { id: 'submarino', categoria: 'Militar', icone: '🌊', nome: 'Submarino de Ataque', custo: 0.16, custoPA: 1,
    descricao: 'Silencioso e letal sob as ondas.', forcas: { submarinos: 4 } },
  // ia_militar veio de Ciência → Militar (auditoria: renderiza como ficha de drones —
  // equipamento pertence à aba Militar). Id preservado; desbloqueio segue travando o chip.
  { id: 'ia_militar', categoria: 'Militar', icone: '🤖', nome: 'Enxame de Drones com IA', custo: 0.45, custoPA: 2,
    descricao: 'Guerra autônoma. O futuro chegou.', desbloqueio: { inteligencia: '>=75', capacidade_ind: '>=65' }, dica: 'Leve a Inteligência a 75 com Cap. Industrial 65 — o algoritmo pronto e a linha de montagem também.',
    forcas: { drones: 120 } },
  { id: 'mobilizar', categoria: 'Militar', icone: '📣', nome: 'Mobilização Geral', custo: 0.06, custoPA: 1, prob: 1,
    descricao: 'Prontidão máxima — assusta o mundo.', efeitos: { poder_militar: 8, temp_guerra: 8, aprovacao: -3 }, politico: { autoridade: 4 } },

  // ── ARSENAL (estratégico / desbloqueável) ───────────────────────────
  // hipersonico é FICHA DE EQUIPAMENTO (ver nota no bloco Militar): sem efeitos/prob —
  // o desbloqueio continua valendo (trava o chip até a condição bater).
  { id: 'hipersonico', categoria: 'Arsenal', icone: '🚀', nome: 'Míssil Hipersônico', custo: 0.22, custoPA: 1,
    descricao: 'Rápido demais para ser interceptado.', desbloqueio: { capacidade_ind: '>=70', inteligencia: '>=50' }, dica: 'Eleve a Cap. Industrial a 70 com Inteligência 50 — a fábrica constrói, a telemetria roubada guia.',
    forcas: { misseis: 60 } },
  // uranio veio de Inteligência → Arsenal (auditoria: enriquecer urânio é programa
  // nuclear, não espionagem; fica ao lado da ogiva que o consome). Id preservado.
  { id: 'uranio', categoria: 'Arsenal', icone: '⛏️', nome: 'Enriquecer Urânio', custo: 0.06, custoPA: 1, prob: 0.9,
    descricao: 'Combustível da dissuasão nuclear.', efeitos: { uranio: 10 }, efeitos_falha: { uranio: 3, risco_exposicao: 'medio' } },
  { id: 'ogiva', categoria: 'Arsenal', icone: '☢️', nome: 'Construir Ogiva Nuclear', custo: 0.35, custoPA: 2, prob: 0.8,
    descricao: 'A carta da dissuasão absoluta.', desbloqueio: { uranio: '>=60', capacidade_ind: '>=55' }, dica: 'Acumule Urânio ≥60 e Cap. Industrial ≥55.',
    efeitos: { ogivas: 1, seguranca: 12, soft_power: -6, temp_guerra: 5 }, efeitos_falha: { soft_power: -8, risco_exposicao: 'alto' }, politico: { autoridade: 6 } },
  { id: 'triade', categoria: 'Arsenal', icone: '🛡️', nome: 'Escudo Antimísseis', custo: 0.4, custoPA: 2, prob: 0.85,
    descricao: 'Interceptação de mísseis balísticos.', desbloqueio: { capacidade_ind: '>=65', inteligencia: '>=60' }, dica: 'Cap. Industrial ≥65 e Inteligência ≥60.',
    efeitos: { seguranca: 16, poder_militar: 6 }, efeitos_falha: { seguranca: 2 }, politico: { autoridade: 3 } },

  // ── INTELIGÊNCIA / CIBERNÉTICA ──────────────────────────────────────
  { id: 'espionar', categoria: 'Inteligência', icone: '🕵️', nome: 'Operação de Espionagem', custo: 0.02, custoPA: 1, prob: 0.8,
    descricao: 'Roubar segredos de um rival.', efeitos: { inteligencia: 4, seguranca: 4 }, efeitos_falha: { seguranca: -2, risco_exposicao: 'medio' } },
  { id: 'sabotar', categoria: 'Inteligência', icone: '💥', nome: 'Sabotagem de Infraestrutura', custo: 0.05, custoPA: 1, prob: 0.6,
    descricao: 'Golpe cirúrgico — ou escândalo.', efeitos: { seguranca: 8, rel_china: -10 }, efeitos_falha: { soft_power: -10, rel_china: -15, risco_exposicao: 'alto' }, politico: { autoridade: 3 } },
  { id: 'aviao_espiao', categoria: 'Inteligência', icone: '🛩️', nome: 'Avião-espião (U-2/Global Hawk)', custo: 0.09, custoPA: 1, prob: 0.9,
    descricao: 'Reconhecimento de alta altitude.', efeitos: { inteligencia: 7, seguranca: 3 }, efeitos_falha: { inteligencia: 1, risco_exposicao: 'medio' } },
  { id: 'satelite', categoria: 'Inteligência', icone: '🛰️', nome: 'Satélite de Reconhecimento', custo: 0.12, custoPA: 1, prob: 0.9,
    descricao: 'Olhos permanentes sobre o planeta.', desbloqueio: { capacidade_ind: '>=50' }, dica: 'Cap. Industrial ≥50.',
    efeitos: { inteligencia: 10, seguranca: 4 }, efeitos_falha: { inteligencia: 2 } },
  { id: 'vigilancia', categoria: 'Inteligência', icone: '👁️', nome: 'Software de Vigilância em Massa', custo: 0.06, custoPA: 1, prob: 0.95,
    descricao: 'Monitorar tudo — a que custo?', efeitos: { inteligencia: 6, seguranca: 6, liberdades: -10 },
    efeitos_falha: { aprovacao: -6, risco_exposicao: 'medio' }, politico: { autoridade: 7 } },
  { id: 'cyber_arma', categoria: 'Inteligência', icone: '🦠', nome: 'Arma Cibernética (tipo Stuxnet)', custo: 0.14, custoPA: 1, prob: 0.7,
    descricao: 'Destruir sistemas inimigos sem um tiro.', desbloqueio: { inteligencia: '>=70' }, dica: 'Inteligência ≥70 (Programa Cyber).',
    efeitos: { seguranca: 10, rel_ira: -12, temp_guerra: -3 }, efeitos_falha: { soft_power: -8, risco_exposicao: 'alto' }, politico: { autoridade: 4 } },
  { id: 'desinfo', categoria: 'Inteligência', icone: '🌫️', nome: 'Campanha de Desinformação', custo: 0.04, custoPA: 1, prob: 0.7,
    descricao: 'Semear o caos alheio.', efeitos: { soft_power: 6, aprovacao: 3 }, efeitos_falha: { soft_power: -8, liberdades: -3, risco_exposicao: 'alto' }, politico: { autoridade: 5 } },
  // (uranio → Arsenal e purga → Política: recategorizadas pela auditoria, ids preservados.)

  // ── ECONOMIA ────────────────────────────────────────────────────────
  { id: 'imposto_up', categoria: 'Economia', icone: '⬆️', nome: 'Aumentar Impostos', custo: 0, custoPA: 1, prob: 1,
    descricao: 'Mais caixa amanhã, menos amor hoje.', efeitos: { aliquota: 3, aprovacao: -6, temp_economia: -2 }, politico: { economico: -6 } },
  { id: 'imposto_down', categoria: 'Economia', icone: '⬇️', nome: 'Reduzir Impostos', custo: 0, custoPA: 1, prob: 1,
    descricao: 'Alívio popular, menos arrecadação.', efeitos: { aliquota: -3, aprovacao: 6, temp_economia: 3 }, politico: { economico: 6 } },
  { id: 'divida', categoria: 'Economia', icone: '🏦', nome: 'Emitir Títulos da Dívida', custo: 0, custoPA: 1, prob: 1,
    descricao: 'Caixa agora, juros depois.', efeitos: { tesouro: 1.2, divida: 8, temp_economia: -3 } },
  { id: 'infra', categoria: 'Economia', icone: '🏗️', nome: 'Investir em Infraestrutura', custo: 0.6, custoPA: 1, prob: 0.9,
    descricao: 'Cresce o PIB no médio prazo.', efeitos: { pib: 1.5, capacidade_ind: 4, aprovacao: 2 }, efeitos_falha: { pib: 0.3 } },
  { id: 'reforma', categoria: 'Economia', icone: '📈', nome: 'Reforma Pró-Mercado', custo: 0.1, custoPA: 1, prob: 0.9,
    descricao: 'Cresce a economia, dói no bolso do povo.', efeitos: { pib: 1.2, temp_economia: 5, aprovacao: -6 }, efeitos_falha: { temp_economia: 1 }, politico: { economico: 9 } },
  { id: 'subsidio', categoria: 'Economia', icone: '🍞', nome: 'Subsídio Social', custo: 0.35, custoPA: 1, prob: 1,
    descricao: 'Compra paz social a peso de ouro.', efeitos: { aprovacao: 8, estabilidade: 4, temp_economia: -1 }, politico: { economico: -8 } },

  // ── DIPLOMACIA ──────────────────────────────────────────────────────
  { id: 'cupula', categoria: 'Diplomacia', icone: '🤝', nome: 'Cúpula Internacional', custo: 0.08, custoPA: 1, prob: 0.9,
    descricao: 'Reúne aliados, molda a narrativa global.', efeitos: { soft_power: 10, rel_ue: 6 }, efeitos_falha: { soft_power: 2 } },
  { id: 'ajuda', categoria: 'Diplomacia', icone: '🎁', nome: 'Pacote de Ajuda Externa', custo: 0.25, custoPA: 1, prob: 1,
    descricao: 'Ganha corações, mentes e votos na ONU.', efeitos: { soft_power: 12, rel_brasil: 8, rel_india: 8 }, politico: { economico: -4 } },
  { id: 'sancoes', categoria: 'Diplomacia', icone: '🚫', nome: 'Regime de Sanções', custo: 0.05, custoPA: 1, prob: 0.85,
    descricao: 'Estrangula a economia de um rival.', efeitos: { rel_russia: -15, rel_ira: -10, temp_economia: -3 }, efeitos_falha: { soft_power: -5 }, politico: { autoridade: 3 } },
  { id: 'bloco', categoria: 'Diplomacia', icone: '🌐', nome: 'Fundar Bloco Comercial', custo: 0.3, custoPA: 2, prob: 0.85,
    descricao: 'Uma ordem econômica sob sua liderança.', desbloqueio: { soft_power: '>=70' }, dica: 'Soft Power ≥70.',
    efeitos: { soft_power: 14, pib: 1, rel_ue: 8, rel_japao: 8 }, efeitos_falha: { soft_power: 3 }, politico: { economico: 4 } },

  // ── CIÊNCIA ─────────────────────────────────────────────────────────
  { id: 'universidades', categoria: 'Ciência', icone: '🎓', nome: 'Investir em Universidades', custo: 0.3, custoPA: 1, prob: 1,
    descricao: 'Cérebros hoje, potência amanhã.', efeitos: { inteligencia: 5, pib: 0.6, liberdades: 2 }, politico: { economico: -2 } },
  { id: 'pd_militar', categoria: 'Ciência', icone: '🔧', nome: 'P&D Militar (DARPA)', custo: 0.35, custoPA: 1, prob: 0.9,
    descricao: 'Tecnologia de ponta pra guerra.', efeitos: { capacidade_ind: 8, poder_militar: 3 }, efeitos_falha: { capacidade_ind: 2 } },
  { id: 'cyber_prog', categoria: 'Ciência', icone: '🖥️', nome: 'Programa Cyber', custo: 0.2, custoPA: 1, prob: 0.85,
    descricao: 'Defesa e ataque digital.', efeitos: { inteligencia: 8, seguranca: 5 }, efeitos_falha: { inteligencia: 1 } },
  { id: 'espacial', categoria: 'Ciência', icone: '🚀', nome: 'Programa Espacial', custo: 0.7, custoPA: 2, prob: 0.85,
    descricao: 'Domínio orbital e prestígio nacional.', desbloqueio: { capacidade_ind: '>=62' }, dica: 'Erga a Cap. Industrial a 62 — indústria pesada antes do foguete.',
    efeitos: { capacidade_ind: 8, soft_power: 8, inteligencia: 5 }, efeitos_falha: { soft_power: 2 } },
  { id: 'quantico', categoria: 'Ciência', icone: '⚛️', nome: 'Computação Quântica', custo: 0.6, custoPA: 2, prob: 0.75,
    descricao: 'Quebra qualquer criptografia inimiga.', desbloqueio: { inteligencia: '>=80', capacidade_ind: '>=55' }, dica: 'Leve a Inteligência a 80 com Cap. Industrial 55 — mentes de elite com laboratório à altura.',
    efeitos: { inteligencia: 14, seguranca: 8 }, efeitos_falha: { inteligencia: 3 } },

  // ── MÍDIA ───────────────────────────────────────────────────────────
  { id: 'publicidade', categoria: 'Mídia', icone: '📺', nome: 'Campanha de Publicidade', custo: 0.06, custoPA: 1, prob: 0.85,
    descricao: 'Molda a narrativa a seu favor.', efeitos: { aprovacao: 8, soft_power: 4 }, efeitos_falha: { aprovacao: 1 } },
  { id: 'influen', categoria: 'Mídia', icone: '📱', nome: 'Exército de Influenciadores', custo: 0.05, custoPA: 1, prob: 0.75,
    descricao: 'Domina o feed — se não for pego.', efeitos: { soft_power: 8, aprovacao: 3 }, efeitos_falha: { soft_power: -4, risco_exposicao: 'medio' }, politico: { autoridade: 1 } },
  { id: 'propaganda', categoria: 'Mídia', icone: '📢', nome: 'Propaganda Estatal', custo: 0.04, custoPA: 1, prob: 0.9,
    descricao: 'A verdade oficial — custa liberdade.', efeitos: { aprovacao: 6, estabilidade: 3, liberdades: -6 },
    efeitos_falha: { aprovacao: -4, soft_power: -4 }, politico: { autoridade: 7 } },

  // ═══════════════════════════════════════════════════════════════════
  // LOTE R — AÇÕES DE ALTO IMPACTO (as jogadas "foda" de cada eixo)
  // ═══════════════════════════════════════════════════════════════════
  // As de topo ficam TRAVADAS (desbloqueio) até você merecer — vira surpresa e recompensa
  // por ter construído indústria, inteligência ou reputação. Cada uma cobra um preço real.

  // ── MILITAR ──
  { id: 'bateria_aa', categoria: 'Militar', icone: '🛡️', nome: 'Rede de Defesa Aérea (Patriot/S-400)', custo: 0.14, custoPA: 1, prob: 0.95,
    descricao: 'Sem ela, todo o seu arsenal caro vira alvo caro. Fecha o céu sobre o país.', efeitos: { seguranca: 11, poder_militar: 4 }, efeitos_falha: { seguranca: 2 }, politico: { autoridade: 2 } },
  { id: 'forcas_especiais', categoria: 'Militar', icone: '🥷', nome: 'Comando de Operações Especiais', custo: 0.16, custoPA: 1, prob: 0.9,
    descricao: 'Poucos homens, alto impacto. A lâmina que age antes da guerra começar.', desbloqueio: { inteligencia: '>=45' }, dica: 'Inteligência ≥45.',
    efeitos: { seguranca: 10, inteligencia: 6, poder_militar: 3 }, efeitos_falha: { seguranca: 2, risco_exposicao: 'medio' }, politico: { autoridade: 4 } },
  { id: 'doutrina_dissuasao', categoria: 'Militar', icone: '⚔️', nome: 'Doutrina de Dissuasão', custo: 0.1, custoPA: 1, prob: 0.9,
    descricao: 'Deixa claro o preço de mexer com você. A paz armada assusta — e funciona.', efeitos: { poder_militar: 6, seguranca: 6, temp_guerra: 6, soft_power: -2 }, efeitos_falha: { temp_guerra: 3 }, politico: { autoridade: 5 } },

  // ── ARSENAL ──
  { id: 'silo_icbm', categoria: 'Arsenal', icone: '🗼', nome: 'Silo de ICBM', custo: 0.5, custoPA: 2, prob: 0.85,
    descricao: 'Míssil balístico intercontinental. Alcança qualquer capital do planeta em 30 minutos.', desbloqueio: { ogivas: '>=1', capacidade_ind: '>=60' }, dica: 'Tenha ao menos 1 ogiva e Cap. Industrial ≥60.',
    efeitos: { poder_militar: 10, seguranca: 14, temp_guerra: 6, soft_power: -8 }, efeitos_falha: { soft_power: -6, risco_exposicao: 'alto' }, politico: { autoridade: 6 }, major: true },
  { id: 'ssbn', categoria: 'Arsenal', icone: '🌊', nome: 'Submarino Nuclear Balístico (SSBN)', custo: 0.6, custoPA: 2, prob: 0.8,
    descricao: 'A segunda-capacidade que ninguém localiza. Some no oceano e garante que você revida — sempre.', desbloqueio: { ogivas: '>=1', capacidade_ind: '>=65' }, dica: 'Tenha ogiva e Cap. Industrial ≥65.',
    efeitos: { seguranca: 20, poder_militar: 8, soft_power: -4 }, efeitos_falha: { seguranca: 4 }, politico: { autoridade: 5 }, major: true },

  // ── INTELIGÊNCIA ──
  { id: 'contraintel', categoria: 'Inteligência', icone: '🔐', nome: 'Contrainteligência (caça-toupeiras)', custo: 0.05, custoPA: 1, prob: 0.9,
    descricao: 'Varre a casa por infiltrados. Fecha as frestas por onde vazam os seus segredos.', efeitos: { seguranca: 8, inteligencia: 4, risco_exposicao: 'baixo' }, efeitos_falha: { seguranca: 2 }, politico: { autoridade: 3 } },
  { id: 'golpe_encoberto', categoria: 'Inteligência', icone: '🎭', nome: 'Operação de Mudança de Regime', custo: 0.18, custoPA: 2, prob: 0.5,
    descricao: 'Derruba um governo hostil por dentro — sem uma digital sua. Quando dá certo. Quando não, é capa de jornal no mundo todo.', desbloqueio: { inteligencia: '>=65' }, dica: 'Inteligência ≥65 (rede madura).',
    efeitos: { seguranca: 10, soft_power: 4, temp_guerra: -4 }, efeitos_falha: { soft_power: -18, rel_ue: -12, risco_exposicao: 'alto' }, politico: { autoridade: 6 }, major: true },
  { id: 'falsa_bandeira', categoria: 'Inteligência', icone: '🚩', nome: 'Operação de Falsa Bandeira', custo: 0.08, custoPA: 2, prob: 0.45,
    descricao: 'Fabrica o pretexto perfeito pra agir. Se vazar, o pretexto vira a sua sentença.', desbloqueio: { inteligencia: '>=55' }, dica: 'Inteligência ≥55.',
    efeitos: { temp_guerra: 8, aprovacao: 6, estabilidade: 4 }, efeitos_falha: { aprovacao: -20, soft_power: -14, estabilidade: -10, risco_exposicao: 'alto' }, politico: { autoridade: 7 }, major: true },

  // ── ECONOMIA ──
  { id: 'fundo_soberano', categoria: 'Economia', icone: '🏛️', nome: 'Fundo Soberano', custo: 0.4, custoPA: 1, prob: 0.9,
    descricao: 'Guarda o excedente do país num cofre que rende. Riqueza que trabalha por você — no longo prazo.', desbloqueio: { temp_economia: '>=55' }, dica: 'Economia aquecida (≥55) pra ter o que guardar.',
    efeitos: { pib: 0.8, temp_economia: 4, soft_power: 3 }, efeitos_falha: { pib: 0.2 }, politico: { economico: 5 } },
  { id: 'guerra_cambial', categoria: 'Economia', icone: '💱', nome: 'Guerra Cambial', custo: 0, custoPA: 1, prob: 0.8,
    descricao: 'Desvaloriza a moeda pra explodir as exportações. O mundo reclama, o exportador aplaude, o consumidor paga.', efeitos: { pib: 1.4, temp_economia: 5, aprovacao: -5, rel_china: -8 }, efeitos_falha: { temp_economia: -4, aprovacao: -6 }, politico: { economico: 6 } },
  { id: 'nacionalizar', categoria: 'Economia', icone: '✊', nome: 'Nacionalizar Recurso Estratégico', custo: 0.05, custoPA: 2, prob: 0.7,
    descricao: 'Toma o controle do que é do país. Enche o cofre e a praça — e esvazia a confiança do investidor estrangeiro.', efeitos: { tesouro: 1.5, pib: 0.6, aprovacao: 8, temp_economia: -6, soft_power: -8 }, efeitos_falha: { temp_economia: -12, soft_power: -10, risco_exposicao: 'alto' }, politico: { economico: -12 }, major: true },

  // ── DIPLOMACIA ──
  { id: 'pacto_defesa', categoria: 'Diplomacia', icone: '🛡️', nome: 'Pacto de Defesa Mútua', custo: 0.12, custoPA: 1, prob: 0.85,
    descricao: 'Um ataque a um é um ataque a todos. Amarra aliados ao seu destino — e o seu ao deles.', efeitos: { seguranca: 10, soft_power: 6, rel_ue: 8, rel_japao: 6 }, efeitos_falha: { soft_power: 2 }, politico: { autoridade: 3 } },
  { id: 'mediar_global', categoria: 'Diplomacia', icone: '🕊️', nome: 'Mediar Conflito Global', custo: 0.1, custoPA: 1, prob: 0.8,
    descricao: 'Senta as partes à mesa e assina a paz que o mundo assistia sangrar. Prestígio que não se compra.', desbloqueio: { soft_power: '>=60' }, dica: 'Soft Power ≥60 (voz que o mundo ouve).',
    efeitos: { soft_power: 16, aprovacao: 6, temp_guerra: -6 }, efeitos_falha: { soft_power: 2 }, politico: { autoridade: 2 } },
  { id: 'diplomacia_petro', categoria: 'Diplomacia', icone: '🛢️', nome: 'Diplomacia do Petróleo', custo: 0.06, custoPA: 1, prob: 0.85,
    descricao: 'Usa o barril como arma e como afago. Quem controla a torneira, controla a conversa.', efeitos: { soft_power: 8, rel_ira: 8, rel_russia: 6, temp_economia: 2 }, efeitos_falha: { soft_power: -4 }, politico: { autoridade: 3 } },

  // ── CIÊNCIA ──
  { id: 'fusao', categoria: 'Ciência', icone: '⚛️', nome: 'Reator de Fusão Nuclear', custo: 0.9, custoPA: 2, prob: 0.7,
    descricao: 'Energia quase infinita e limpa. O país que acender esse sol primeiro reescreve o mapa do poder.', desbloqueio: { capacidade_ind: '>=80', inteligencia: '>=60' }, dica: 'Leve a Cap. Industrial a 80 com Inteligência 60 — o último degrau da escada industrial.',
    efeitos: { pib: 2, capacidade_ind: 10, soft_power: 10, temp_economia: 6 }, efeitos_falha: { capacidade_ind: 3 }, politico: { economico: 4 }, major: true },
  { id: 'laser_dew', categoria: 'Ciência', icone: '🔦', nome: 'Arma de Energia Dirigida (laser)', custo: 0.4, custoPA: 2, prob: 0.8,
    descricao: 'Derruba drone e míssil ao custo de alguns dólares por tiro. A defesa que finalmente sai mais barata que o ataque.', desbloqueio: { capacidade_ind: '>=75', seguranca: '>=55' }, dica: 'Erga a Cap. Industrial a 75 com Segurança 55 — o laser nasce protegendo o que você já defende.',
    efeitos: { seguranca: 14, poder_militar: 6 }, efeitos_falha: { seguranca: 3 }, politico: { autoridade: 3 } },
  { id: 'biotec', categoria: 'Ciência', icone: '🧬', nome: 'Programa de Biotecnologia', custo: 0.3, custoPA: 1, prob: 0.85,
    descricao: 'Cura o que adoecia o povo e a produtividade junto. Ciência que vira voto e vira PIB.', efeitos: { aprovacao: 6, pib: 0.7, inteligencia: 4, estabilidade: 3 }, efeitos_falha: { pib: 0.2 }, politico: { economico: -1 } },

  // ── POLÍTICA ────────────────────────────────────────────────────────
  // O jogo de dentro de casa. Nada aqui é de graça: agradar uns é irritar outros, e as
  // ações "espertas" (comprar voto, caixa 2, propina, perseguir opositor) têm efeitos_falha
  // que EXPLODEM — escândalo, CPI, queda de aprovação. `major:true` acende um fio de
  // tensão pra Máquina escrever a consequência no turno seguinte. O poder é uma faca.
  { id: 'pronunciamento', categoria: 'Política', icone: '🎤', nome: 'Pronunciamento à Nação', custo: 0.01, custoPA: 1, prob: 0.85,
    descricao: 'Fala à nação em rede. Se emplacar, o povo abraça.', efeitos: { aprovacao: 7, estabilidade: 3 }, efeitos_falha: { aprovacao: -3 }, politico: { autoridade: 1 } },
  { id: 'pacote_congresso', categoria: 'Política', icone: '📜', nome: 'Pacote ao Congresso', custo: 0.06, custoPA: 1, prob: 0.85,
    descricao: 'Negocia apoio na base. Governabilidade custa emenda.', efeitos: { estabilidade: 9, aprovacao: 2 }, efeitos_falha: { estabilidade: -3 }, politico: { economico: -2 } },
  { id: 'reforma_impopular', categoria: 'Política', icone: '⚖️', nome: 'Reforma Impopular', custo: 0, custoPA: 2, prob: 0.7,
    descricao: 'Dói agora, paga depois. O mercado aplaude, a rua vaia.', efeitos: { pib: 1.2, temp_economia: 6, aprovacao: -10, estabilidade: 4 }, efeitos_falha: { aprovacao: -16, estabilidade: -8 }, politico: { economico: 9 } },
  { id: 'anticorrupcao', categoria: 'Política', icone: '🔍', nome: 'Operação Anticorrupção', custo: 0.03, custoPA: 1, prob: 0.6,
    descricao: 'Prende os grandes. Vira herói — ou mexe com quem não devia.', efeitos: { aprovacao: 12, soft_power: 6, estabilidade: -4 }, efeitos_falha: { estabilidade: -12, aprovacao: -6 }, politico: { autoridade: 3 }, major: true },
  { id: 'base_aliada', categoria: 'Política', icone: '🤝', nome: 'Ampliar a Base Aliada', custo: 0.05, custoPA: 1, prob: 0.8,
    descricao: 'Loteia o governo por apoio. Estável, mas caro e feio.', efeitos: { estabilidade: 8, soft_power: -2 }, efeitos_falha: { estabilidade: -4, aprovacao: -5 }, politico: { autoridade: 2 } },
  // ── RECRUTAMENTO (soldados) — encher as fileiras tem preço político ──
  // Três caminhos até o teto de efetivo (dados/efetivoMilitar.js): a campanha voluntária
  // agrada mas rende pouco; a reserva reforça o front tirando gente do trabalho; a
  // conscrição enche o exército e esvazia a paciência do povo.
  { id: 'alistamento_voluntario', categoria: 'Política', icone: '🪖', nome: 'Alistamento Voluntário', custo: 0.01, custoPA: 1, prob: 0.95,
    descricao: 'Campanha de recrutamento espontâneo. Poucos vêm — mas o gesto agrada a nação.',
    efeitos: { aprovacao: 3 }, efeitos_falha: { aprovacao: 1 }, recruta: { infantaria: 20000 }, politico: { autoridade: 1 } },
  { id: 'convocar_reserva', categoria: 'Política', icone: '📯', nome: 'Convocar a Reserva', custo: 0.02, custoPA: 2, prob: 0.9,
    descricao: 'Chama os reservistas às armas. Reforça o front — e tira gente do trabalho e de casa.',
    requer: { temp_guerra: '>=25' }, efeitos: { aprovacao: -2, estabilidade: 2 }, efeitos_falha: { aprovacao: -5 },
    recruta: { infantaria: 60000 }, usaReserva: true, politico: { autoridade: 3 } },
  { id: 'alistamento_obrigatorio', categoria: 'Política', icone: '⚠️', nome: 'Alistamento Obrigatório', custo: 0.04, custoPA: 2, prob: 0.75,
    descricao: 'Serviço militar forçado. Enche as fileiras — e esvazia a paciência do povo.',
    desbloqueio: { temp_guerra: '>=45' }, dica: 'Só quando o Clima de Guerra subir (≥45): conscrição exige ameaça real.',
    efeitos: { liberdades: -14, aprovacao: -10, estabilidade: -6, temp_guerra: 5 }, efeitos_falha: { aprovacao: -16, estabilidade: -12, liberdades: -8 },
    recruta: { infantaria: 150000 }, politico: { autoridade: 10 }, major: true },
  // ── as arriscadas (podem dar MUITO ruim) ──
  // purga veio de Inteligência → Política (auditoria: repressão da oposição interna é o
  // jogo de dentro de casa — irmã de perseguir_opositor/estado_excecao). Id preservado
  // (segue major via regex de resolverFila).
  { id: 'purga', categoria: 'Política', icone: '⚖️', nome: 'Purga Interna', custo: 0.03, custoPA: 2, prob: 0.5,
    descricao: 'Esmaga a oposição — ou explode.', efeitos: { estabilidade: 12, liberdades: -15, aprovacao: -5 }, efeitos_falha: { estabilidade: -20, aprovacao: -15 }, politico: { autoridade: 10 } },
  { id: 'comprar_congresso', categoria: 'Política', icone: '💼', nome: 'Comprar o Congresso', custo: 0.08, custoPA: 2, prob: 0.55,
    descricao: 'Mala de dinheiro em gabinete. Se vazar, é CPI e capa de jornal.', efeitos: { estabilidade: 14, aprovacao: 4 }, efeitos_falha: { aprovacao: -16, estabilidade: -10, soft_power: -8, liberdades: -4, risco_exposicao: 'alto' }, politico: { autoridade: 4 }, major: true },
  { id: 'caixa_dois', categoria: 'Política', icone: '💸', nome: 'Caixa Dois', custo: 0, custoPA: 1, prob: 0.55,
    descricao: 'Financia o esquema por fora do olhar público. Alto risco.', efeitos: { tesouro: 0.4, estabilidade: 3 }, efeitos_falha: { aprovacao: -14, estabilidade: -10, risco_exposicao: 'alto' }, politico: { economico: 3 }, major: true },
  { id: 'propina', categoria: 'Política', icone: '🩸', nome: 'Rede de Propina', custo: 0, custoPA: 2, prob: 0.5,
    descricao: 'Suborno vira máquina de poder — até estourar na sua mão.', efeitos: { tesouro: 0.6, estabilidade: 5 }, efeitos_falha: { aprovacao: -18, estabilidade: -14, soft_power: -6, risco_exposicao: 'alto' }, politico: { autoridade: 3 }, major: true },
  { id: 'perseguir_opositor', categoria: 'Política', icone: '🎯', nome: 'Perseguir Opositor', custo: 0.02, custoPA: 1, prob: 0.55,
    descricao: 'Usa a máquina contra o inimigo. O tiro pode sair pela culatra.', efeitos: { estabilidade: 9, liberdades: -8 }, efeitos_falha: { aprovacao: -12, soft_power: -10, estabilidade: -6, risco_exposicao: 'alto' }, politico: { autoridade: 8 }, major: true },
  { id: 'censura_imprensa', categoria: 'Política', icone: '🚫', nome: 'Censurar a Imprensa', custo: 0.03, custoPA: 1, prob: 0.75,
    descricao: 'Cala o barulho. O mundo vê e não gosta.', efeitos: { estabilidade: 8, aprovacao: 4, liberdades: -12, soft_power: -6 }, efeitos_falha: { aprovacao: -8, soft_power: -8 }, politico: { autoridade: 7 } },
  { id: 'estado_excecao', categoria: 'Política', icone: '🚨', nome: 'Estado de Exceção', custo: 0, custoPA: 2, prob: 0.7,
    descricao: 'Suspende as regras pra "restaurar a ordem". Ponto sem volta.', desbloqueio: { estabilidade: '<=35' }, dica: 'Só quando a estabilidade despenca (≤35).',
    efeitos: { estabilidade: 16, seguranca: 10, liberdades: -18, soft_power: -10 }, efeitos_falha: { estabilidade: -12, aprovacao: -10 }, politico: { autoridade: 12 }, major: true },
];

export const ACAO_POR_ID = Object.fromEntries(ACOES.map((a) => [a.id, a]));

// ── TEMPO DE EXECUÇÃO (modo tempo real) ───────────────────────────────
// No modo tempo real, cada ação leva SEGUNDOS pra concluir na fila (com barra). O tempo
// deriva do PESO (custoPA) e da categoria — logística e arsenal demoram, mídia e
// diplomacia são rápidas. Uma ação pode sobrescrever com `tempo`. É o custo de tempo que
// dá espaço pra inteligência/sabotagem reagirem antes de algo grande acontecer.
const TEMPO_BASE = { Militar: 16, Arsenal: 26, 'Inteligência': 18, Economia: 12, Diplomacia: 10, 'Ciência': 20, 'Mídia': 9, 'Política': 14 };
const clampT = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function tempoDe(a) {
  if (a?.tempo) return a.tempo;
  const base = TEMPO_BASE[a?.categoria] || 14;
  const pa = a?.custoPA || 1;
  // MAGNITUDE do impacto: quanto mais a ação mexe no mundo, mais ela DEMORA — dá tempo
  // do alvo desconfiar e se preparar (uma mobilização não é instantânea). Soma dos
  // |efeitos| numéricos como proxy do peso.
  let mag = 0; for (const v of Object.values(a?.efeitos || {})) if (typeof v === 'number') mag += Math.abs(v);
  const fatorImpacto = 1 + Math.min(1.3, mag / 38);     // até +130% para ações de grande impacto
  const fatorMajor = a?.major ? 1.6 : 1;                // ações "major" (ponto sem volta) são lentas
  return Math.round(clampT(base * pa * fatorImpacto * fatorMajor, 6, 120));
}
