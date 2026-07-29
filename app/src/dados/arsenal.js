// ═══════════════════════════════════════════════════════════════════════
// O ARSENAL DO MUNDO — catálogo de armamento real
// ═══════════════════════════════════════════════════════════════════════
// Antes o mercado vendia "Caças" genéricos por um preço. Agora vende o F-35, o Su-57,
// o Rafale e o J-20 — cada um com fabricante, país de origem, geração e um preço que
// reflete o que ele custa de verdade. Comprar caça deixou de ser uma linha de planilha
// e virou uma decisão geopolítica: de QUEM você compra.
//
// ── A MECÂNICA QUE FAZ ISSO IMPORTAR: POLÍTICA DE EXPORTAÇÃO ──────────
// Nem tudo está à venda pra qualquer um. Cada item tem uma `politica`:
//
//   'livre'    → qualquer um compra. Kalashnikov, drone turco, blindado chinês.
//   'aliado'   → precisa de relação ≥ 30. A maior parte do hardware ocidental.
//   'restrito' → precisa de relação ≥ 65. Tecnologia sensível: furtivo, nuclear-capaz.
//   'nunca'    → NUNCA foi exportado por decisão política do fabricante.
//                F-22, B-2, J-20 — só existe pra quem os constrói.
//
// Você não "compra": você SOLICITA. O pedido é avaliado no fechamento do turno,
// contra a relação real com o país de origem, e pode ser NEGADO. É assim que o mundo
// real funciona — a Turquia pagou pelos F-35 e foi expulsa do programa mesmo assim.
//
// `preco` em US$ TRILHÕES por unidade (0.00008 = US$ 80 milhões).
// `poder` sobrescreve o poder genérico de dados/forcas.js — um F-35 não é um MiG-21.
// `foto: null` → a UI cai na foto genérica da categoria (FOTO_UNIDADE). É deliberado:
// foto errada já apareceu neste projeto (a Lockheed exibiu o logo da Apple) e é pior
// que foto genérica.

// O PISO DA HOSTILIDADE, acima do fundo da escala de propósito. `livre` tem
// `relMin: -100`, que é o fundo — e por isso "venda livre" significava literalmente
// "vende para todos", incluindo quem está em guerra com o fornecedor. Este piso é a
// regra que vale para TODAS as políticas: ninguém arma quem o odeia. Calibrado em -25
// e não em 0 porque comércio de armas entre países que se detestam existe no mundo
// real — o que não existe é comércio de armas com quem te chama de inimigo declarado.
export const REL_HOSTIL = -25;

export const POLITICAS = {
  livre:    { rot: 'Venda livre',      relMin: -100, ic: 'globe',      cor: '#22e0a0',
              txt: 'Vendem pra quem pagar. Não fazem perguntas — mas nem eles armam um inimigo declarado.' },
  aliado:   { rot: 'Só para aliados',  relMin: 30,   ic: 'handshake',  cor: '#ffb020',
              txt: 'Exige relação diplomática saudável e um acordo de uso final.' },
  restrito: { rot: 'Altamente restrito', relMin: 65, ic: 'lock',       cor: '#ff8c1a',
              txt: 'Tecnologia sensível. Só sai com aval político do mais alto nível.' },
  nunca:    { rot: 'Jamais exportado', relMin: 999,  ic: 'ban',        cor: '#ff3b5c',
              txt: 'Proibido por lei ou doutrina. Só quem fabrica opera.' },
};

export const ARSENAL = [
  // ═══ CAÇAS ═════════════════════════════════════════════════════════
  { id: 'f35', nome: 'F-35A Lightning II', unidade: 'cacas', origem: 'USA', fab: 'Lockheed Martin',
    preco: 0.00008, poder: 0.038, geracao: '5ª geração', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/F-35A_flight_%28cropped%29.jpg/330px-F-35A_flight_%28cropped%29.jpg',
    desc: 'O caça mais caro da história e o mais vendido da sua geração ao mesmo tempo. Furtivo, cheio de software, e cada hora de voo custa uma fortuna. Comprar um F-35 é assinar um casamento de 40 anos com Washington — eles controlam as atualizações.' },
  { id: 'f22', nome: 'F-22 Raptor', unidade: 'cacas', origem: 'USA', fab: 'Lockheed Martin',
    preco: 0.00035, poder: 0.055, geracao: '5ª geração', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/F-22_Raptor_edit1.jpg/500px-F-22_Raptor_edit1.jpg',
    desc: 'Superioridade aérea absoluta e proibido por lei federal de ser exportado — nem pra Israel, nem pro Japão. A linha de montagem foi fechada em 2011. Ninguém nunca vai comprar um. Nem você.' },
  { id: 'f16', nome: 'F-16V Fighting Falcon', unidade: 'cacas', origem: 'USA', fab: 'Lockheed Martin',
    preco: 0.00006, poder: 0.024, geracao: '4ª geração+', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Turkish_air_force_F-16_in_Jordan.jpg/330px-Turkish_air_force_F-16_in_Jordan.jpg',   // sugerido: variante próxima verificada — trocar pela exata depois
    desc: 'O caça mais produzido do Ocidente — mais de 4.600 unidades, voando em 25 países. Barato, confiável e atualizado até virar outro avião. É o Toyota Corolla da guerra aérea.' },
  { id: 'f15ex', nome: 'F-15EX Eagle II', unidade: 'cacas', origem: 'USA', fab: 'Boeing',
    preco: 0.00009, poder: 0.032, geracao: '4ª geração++', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Boeing_F-15SA_Eagle_Royal_Saudi_Air_Force_5D4_2291_%2853919688252%29.jpg/330px-Boeing_F-15SA_Eagle_Royal_Saudi_Air_Force_5D4_2291_%2853919688252%29.jpg',   // sugerido: variante próxima verificada — trocar pela exata depois
    desc: 'Um projeto dos anos 1970 que se recusa a morrer, porque carrega mais mísseis que qualquer furtivo. Não é invisível — é um caminhão de munição com asas.' },
  { id: 'fa18', nome: 'F/A-18E Super Hornet', unidade: 'cacas', origem: 'USA', fab: 'Boeing',
    preco: 0.00007, poder: 0.026, geracao: '4ª geração+', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/F-A-18E_Super_Hornet_-_RIAT_2016_%2828997654202%29.jpg/500px-F-A-18E_Super_Hornet_-_RIAT_2016_%2828997654202%29.jpg',
    desc: 'A espinha dorsal da aviação naval americana. Feito pra pousar num convés em movimento à noite, no mar agitado — o trabalho mais difícil da aviação.' },
  { id: 'su57', nome: 'Su-57 Felon', unidade: 'cacas', origem: 'RUS', fab: 'Sukhoi',
    preco: 0.00005, poder: 0.033, geracao: '5ª geração', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Sukhoi_Design_Bureau%2C_054%2C_Sukhoi_T-50_%28Su-57_prototype%29_%2849581303977%29.jpg/330px-Sukhoi_Design_Bureau%2C_054%2C_Sukhoi_T-50_%28Su-57_prototype%29_%2849581303977%29.jpg',
    desc: 'A resposta russa ao F-35, produzida em dezenas em vez de centenas. Manobrabilidade brutal, furtividade discutível, e um programa que a Índia abandonou depois de pagar por ele.' },
  { id: 'su35', nome: 'Su-35S Flanker-E', unidade: 'cacas', origem: 'RUS', fab: 'Sukhoi',
    preco: 0.00004, poder: 0.028, geracao: '4ª geração++', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Sukhoi_Su-30MK2_de_Venezuela.jpg/330px-Sukhoi_Su-30MK2_de_Venezuela.jpg',   // sugerido: variante próxima verificada — trocar pela exata depois
    desc: 'Vetorização de empuxo que faz manobras impossíveis em air show. Em combate real vale menos que um radar melhor — mas impressiona quem compra.' },
  { id: 'mig29', nome: 'MiG-29 Fulcrum', unidade: 'cacas', origem: 'RUS', fab: 'Mikoyan',
    preco: 0.00002, poder: 0.014, geracao: '4ª geração', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Ukrainian_Falcons_Mig-29.jpg/330px-Ukrainian_Falcons_Mig-29.jpg',
    desc: 'Barato, resistente e espalhado por meio planeta. Consome combustível como se odiasse você e tem alcance de um fim de semana. Ainda assim, é o que muita força aérea pode pagar.' },
  { id: 'j20', nome: 'J-20 Mighty Dragon', unidade: 'cacas', origem: 'CHN', fab: 'Chengdu',
    preco: 0.00011, poder: 0.036, geracao: '5ª geração', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/J-20_at_CCAS2022_%2820220827103424%29.jpg/330px-J-20_at_CCAS2022_%2820220827103424%29.jpg',
    desc: 'O furtivo chinês. Nunca exportado, nunca exposto de perto, e ninguém fora de Pequim sabe o que ele realmente faz. A opacidade é parte da arma.' },
  { id: 'j10c', nome: 'J-10C Vigorous Dragon', unidade: 'cacas', origem: 'CHN', fab: 'Chengdu',
    preco: 0.00004, poder: 0.023, geracao: '4ª geração++', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/J-10CE_for_Pakistan_air_force_in_Zhuhai_airshow_2024.jpg/500px-J-10CE_for_Pakistan_air_force_in_Zhuhai_airshow_2024.jpg',
    desc: 'Radar AESA e míssil PL-15 de longo alcance por um terço do preço ocidental. A China vende pra quem os EUA recusam — e essa é exatamente a estratégia.' },
  { id: 'jf17', nome: 'JF-17 Thunder', unidade: 'cacas', origem: 'PAK', fab: 'PAC / Chengdu',
    preco: 0.00003, poder: 0.016, geracao: '4ª geração', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Black_Panther_JF-17.jpg/330px-Black_Panther_JF-17.jpg',
    desc: 'Coprodução sino-paquistanesa feita pra ser barata acima de tudo. É o caça de quem não tem dinheiro pra caça — e por isso vende bem na África e na Ásia Central.' },
  { id: 'rafale', nome: 'Rafale F4', unidade: 'cacas', origem: 'FRA', fab: 'Dassault',
    preco: 0.00009, poder: 0.030, geracao: '4ª geração++', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Rafale_-_RIAT_2009_%283751416421%29.jpg/330px-Rafale_-_RIAT_2009_%283751416421%29.jpg',
    desc: 'A França vende sem as amarras políticas americanas — sem pedir alinhamento, sem exigir voto na ONU. Custa caro, e a soberania está inclusa no preço.' },
  { id: 'typhoon', nome: 'Eurofighter Typhoon', unidade: 'cacas', origem: 'DEU', fab: 'Airbus / BAE / Leonardo',
    preco: 0.00010, poder: 0.029, geracao: '4ª geração++', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Eurofighter_Typhoon_of_the_Royal_Saudi_Air_Force_at_Airpower_11.jpg/330px-Eurofighter_Typhoon_of_the_Royal_Saudi_Air_Force_at_Airpower_11.jpg',
    desc: 'Quatro países construíram juntos e cada venda precisa do aval dos quatro — a Alemanha já vetou negócios que Londres queria fechar. Excelente avião, pesadelo diplomático.' },
  { id: 'gripen', nome: 'JAS 39E Gripen', unidade: 'cacas', origem: 'SWE', fab: 'Saab',
    preco: 0.00006, poder: 0.024, geracao: '4ª geração++', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg/330px-Saab_JAS_39_Gripen_at_Kaivopuisto_Air_Show%2C_June_2017_%28altered%29_copy.jpg',
    desc: 'Pousa em estrada, é rearmado por seis conscritos em dez minutos, e custa a metade da hora de voo de um F-35. E a Saab transfere tecnologia de verdade — coisa que americano nunca ofereceu.' },
  { id: 'kf21', nome: 'KF-21 Boramae', unidade: 'cacas', origem: 'KOR', fab: 'KAI',
    preco: 0.00007, poder: 0.027, geracao: '4.5ª geração', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/KF-21_Boramae_First_Production.jpg/330px-KF-21_Boramae_First_Production.jpg',
    desc: 'A Coreia do Sul construiu o próprio caça porque cansou de depender. A Indonésia entrou como sócia e depois atrasou os pagamentos — o de sempre.' },

  // ═══ BOMBARDEIROS ══════════════════════════════════════════════════
  { id: 'b2', nome: 'B-2 Spirit', unidade: 'bombardeiros', origem: 'USA', fab: 'Northrop Grumman',
    preco: 0.0021, poder: 0.14, geracao: 'Furtivo estratégico', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/B-2_Spirit_original.jpg/500px-B-2_Spirit_original.jpg',
    desc: 'Vinte e um foram construídos, cada um custando mais que o próprio peso em ouro. Voa 11 mil km sem reabastecer e ninguém vê. Nunca foi exportado e nunca será.' },
  { id: 'b21', nome: 'B-21 Raider', unidade: 'bombardeiros', origem: 'USA', fab: 'Northrop Grumman',
    preco: 0.0008, poder: 0.16, geracao: 'Furtivo estratégico', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/B-21_Raider_Refueling.jpg/500px-B-21_Raider_Refueling.jpg',
    desc: 'O sucessor do B-2, e o primeiro bombardeiro projetado para voar tanto com piloto quanto sem. Feito para penetrar defesas que ainda não existem.' },
  { id: 'b1b', nome: 'B-1B Lancer', unidade: 'bombardeiros', origem: 'USA', fab: 'Rockwell',
    preco: 0.0003, poder: 0.09, geracao: 'Supersônico', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/B-1B_air_refueling.jpg/330px-B-1B_air_refueling.jpg',
    desc: 'Asa de geometria variável e a maior carga de bombas da frota americana. Foi projetado pra furar a defesa soviética a baixa altitude e acabou bombardeando o deserto por vinte anos.' },
  { id: 'tu160', nome: 'Tu-160 Blackjack', unidade: 'bombardeiros', origem: 'RUS', fab: 'Tupolev',
    preco: 0.0005, poder: 0.11, geracao: 'Supersônico estratégico', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Tupolev_Tu-160_overflying_Moscow_fix.jpg/330px-Tupolev_Tu-160_overflying_Moscow_fix.jpg',
    desc: 'O maior e mais pesado avião de combate já construído. Os pilotos o chamam de "Cisne Branco". Carrega mísseis de cruzeiro nucleares e é usado principalmente pra fazer o que faz melhor: aparecer no radar da OTAN.' },
  { id: 'h6k', nome: 'H-6K', unidade: 'bombardeiros', origem: 'CHN', fab: 'Xian',
    preco: 0.0002, poder: 0.07, geracao: 'Estratégico', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Xian_H-6_bombers%2C_China_Aviation_Museum.jpg/330px-Xian_H-6_bombers%2C_China_Aviation_Museum.jpg',
    desc: 'Um Tu-16 soviético dos anos 1950 reconstruído com eletrônica moderna e mísseis de cruzeiro. A fuselagem é uma antiguidade; a carga que ela leva, não.' },

  // ═══ DRONES ════════════════════════════════════════════════════════
  { id: 'mq9', nome: 'MQ-9B Reaper', unidade: 'drones', origem: 'USA', fab: 'General Atomics',
    preco: 0.00003, poder: 0.024, geracao: 'MALE armado', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/MQ-9_Reaper_UAV_%28cropped%29.jpg/330px-MQ-9_Reaper_UAV_%28cropped%29.jpg',
    desc: 'Fica 27 horas no ar esperando. Transformou "guerra" em turno de trabalho: o operador mata no Afeganistão e janta em casa no Nevada. O MTCR restringe a venda — e os EUA usam isso como alavanca.' },
  { id: 'tb2', nome: 'Bayraktar TB2', unidade: 'drones', origem: 'TUR', fab: 'Baykar',
    preco: 0.000005, poder: 0.014, geracao: 'MALE armado', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/BayraktarTB2_Teknofest2019_%282%29.jpg/330px-BayraktarTB2_Teknofest2019_%282%29.jpg',
    desc: 'Custa 5 milhões e destruiu bilhões em blindados na Líbia, no Cáucaso e na Ucrânia. Mudou a guerra moderna provando que o barato descartável vence o caro insubstituível. A Turquia vende pra quase todo mundo.' },
  { id: 'akinci', nome: 'Bayraktar Akinci', unidade: 'drones', origem: 'TUR', fab: 'Baykar',
    preco: 0.00002, poder: 0.026, geracao: 'HALE armado', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Bayraktar_Ak%C4%B1nc%C4%B1_UCAV.jpg/500px-Bayraktar_Ak%C4%B1nc%C4%B1_UCAV.jpg',
    desc: 'O irmão grande do TB2: voa a 12 km de altitude e carrega míssil de cruzeiro. A Turquia virou potência de drones enquanto o Ocidente discutia ética de exportação.' },
  { id: 'wingloong', nome: 'Wing Loong II', unidade: 'drones', origem: 'CHN', fab: 'AVIC',
    preco: 0.000008, poder: 0.016, geracao: 'MALE armado', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Wing_Loong_I_at_Dubai_Airshow_2017.jpg/330px-Wing_Loong_I_at_Dubai_Airshow_2017.jpg',
    desc: 'Uma cópia funcional do Reaper por um décimo do preço e sem nenhuma pergunta sobre direitos humanos. Voa nos céus do Golfo e da África exatamente por isso.' },
  { id: 'shahed', nome: 'Shahed-136', unidade: 'drones', origem: 'IRN', fab: 'HESA',
    preco: 0.000002, poder: 0.008, geracao: 'Munição vagante', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/2023_IRGC_Aerospace_Force_achievements_Exhibition_in_Qom_%2833%29.jpg/330px-2023_IRGC_Aerospace_Force_achievements_Exhibition_in_Qom_%2833%29.jpg',
    desc: 'Vinte mil dólares de motocicleta com asas e uma ogiva. Não volta — não foi feito pra voltar. Obriga o inimigo a gastar um míssil de dois milhões pra derrubar. A matemática é a arma.' },
  { id: 'heron', nome: 'Heron TP', unidade: 'drones', origem: 'ISR', fab: 'IAI',
    preco: 0.00002, poder: 0.022, geracao: 'MALE armado', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/IAI_Heron_TP_GAF_92%2B52_at_Schleswig_AB_2025.JPG/330px-IAI_Heron_TP_GAF_92%2B52_at_Schleswig_AB_2025.JPG',
    desc: 'Israel foi o primeiro país a levar drone a sério, nos anos 1980, quando todo mundo achava brinquedo. Trinta anos de vantagem não se recuperam com dinheiro.' },
  { id: 'switchblade', nome: 'Switchblade 600', unidade: 'drones', origem: 'USA', fab: 'AeroVironment',
    preco: 0.0000001, poder: 0.004, geracao: 'Munição vagante', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Switchblade_600_Loitering_Munitions_Training_%288767610%29.jpg/500px-Switchblade_600_Loitering_Munitions_Training_%288767610%29.jpg',
    desc: 'Cabe numa mochila, é lançado por um soldado e destrói um tanque. A infantaria virou artilharia de precisão sem precisar pedir autorização a ninguém.' },

  // ═══ HELICÓPTEROS ══════════════════════════════════════════════════
  { id: 'apache', nome: 'AH-64E Apache Guardian', unidade: 'helicopteros', origem: 'USA', fab: 'Boeing',
    preco: 0.00005, poder: 0.022, geracao: 'Ataque pesado', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/AH-64D_Apache_Longbow.jpg/330px-AH-64D_Apache_Longbow.jpg',
    desc: 'Radar no topo do rotor que enxerga por cima da colina sem se expor, e 16 Hellfire pra resolver o que enxergou. O helicóptero de ataque contra o qual todos os outros são medidos.' },
  { id: 'ka52', nome: 'Ka-52 Alligator', unidade: 'helicopteros', origem: 'RUS', fab: 'Kamov',
    preco: 0.00003, poder: 0.019, geracao: 'Ataque pesado', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/AH-64D_Apache_Longbow.jpg/330px-AH-64D_Apache_Longbow.jpg',
    desc: 'Rotores coaxiais (sem rotor de cauda) e assentos ejetáveis — únicos no mundo em helicóptero. Provou ser letal contra blindados na Ucrânia e vulnerável a MANPADS na mesma semana.' },
  { id: 'tiger', nome: 'Eurocopter Tiger', unidade: 'helicopteros', origem: 'FRA', fab: 'Airbus Helicopters',
    preco: 0.00004, poder: 0.017, geracao: 'Ataque médio', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/French_Army%2C_6010%2C_Eurocopter_EC_665_Tiger_HAD_%2849580123847%29.jpg/330px-French_Army%2C_6010%2C_Eurocopter_EC_665_Tiger_HAD_%2849580123847%29.jpg',
    desc: 'Franco-alemão, sofisticado e caro de manter. A Austrália desistiu dele e comprou Apache — o veredito mais duro que um projeto europeu já recebeu.' },
  { id: 'z10', nome: 'Z-10ME', unidade: 'helicopteros', origem: 'CHN', fab: 'CAIC',
    preco: 0.00002, poder: 0.015, geracao: 'Ataque médio', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Changhe_Z-10_helicopter_armament.jpg/330px-Changhe_Z-10_helicopter_armament.jpg',
    desc: 'O primeiro helicóptero de ataque dedicado da China. O projeto original saiu de uma consultoria russa que Pequim contratou e depois dispensou.' },

  // ═══ BLINDADOS ═════════════════════════════════════════════════════
  { id: 'abrams', nome: 'M1A2 SEPv3 Abrams', unidade: 'blindados', origem: 'USA', fab: 'General Dynamics',
    preco: 0.00001, poder: 0.014, geracao: 'MBT 3ª geração', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/M1A2_SEP_v3.jpg/330px-M1A2_SEP_v3.jpg',
    desc: 'Turbina a gás que bebe combustível como um avião e exige uma cauda logística do tamanho de um exército. Em compensação, tripulação dentro dele sobrevive a coisas que não deveriam ser sobrevivíveis.' },
  { id: 'leopard2', nome: 'Leopard 2A7+', unidade: 'blindados', origem: 'DEU', fab: 'KNDS / Rheinmetall',
    preco: 0.000012, poder: 0.015, geracao: 'MBT 3ª geração', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG/330px-Leopard_2_A7V_313_Bad_Frankenhausen_2024.JPG',
    desc: 'O melhor tanque do Ocidente e o mais vendido — 19 países operam. Mas Berlim precisa aprovar cada reexportação, e já travou negócios por meses. O tanque é alemão; a política, também.' },
  { id: 'challenger3', nome: 'Challenger 3', unidade: 'blindados', origem: 'GBR', fab: 'RBSL',
    preco: 0.000013, poder: 0.014, geracao: 'MBT 3ª geração', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Challenger_2_Main_Battle_Tank_patrolling_outside_Basra%2C_Iraq_MOD_45148325.jpg/330px-Challenger_2_Main_Battle_Tank_patrolling_outside_Basra%2C_Iraq_MOD_45148325.jpg',   // sugerido: variante próxima verificada — trocar pela exata depois
    desc: 'O Challenger 2 detém o recorde de tiro de tanque mais longo da história (5.100 m). O 3 é uma reforma profunda de um chassi antigo — a Grã-Bretanha não constrói tanque novo há décadas.' },
  { id: 'leclerc', nome: 'Leclerc XLR', unidade: 'blindados', origem: 'FRA', fab: 'KNDS France',
    preco: 0.000014, poder: 0.014, geracao: 'MBT 3ª geração', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Leclerc-openphotonet_PICT6015.JPG/330px-Leclerc-openphotonet_PICT6015.JPG',
    desc: 'Carregador automático, tripulação de três e um preço que só os Emirados toparam pagar. Excelente e comercialmente fracassado.' },
  { id: 't90m', nome: 'T-90M Proryv', unidade: 'blindados', origem: 'RUS', fab: 'Uralvagonzavod',
    preco: 0.000005, poder: 0.010, geracao: 'MBT 3ª geração', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/T-90M.jpg/330px-T-90M.jpg',
    desc: 'Barato, baixo, e com o defeito congênito do projeto soviético: a munição fica no compartimento da tripulação. Quando pega, a torre voa. O mundo inteiro viu isso acontecer, repetidamente.' },
  { id: 't14', nome: 'T-14 Armata', unidade: 'blindados', origem: 'RUS', fab: 'Uralvagonzavod',
    preco: 0.00001, poder: 0.017, geracao: 'MBT 4ª geração', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/T-14_%22Armata%22_during_%22Armiya_2020%22_exhibition.jpg/500px-T-14_%22Armata%22_during_%22Armiya_2020%22_exhibition.jpg',
    desc: 'Torre não tripulada — a tripulação fica numa cápsula blindada no casco, resolvendo o defeito de 50 anos. Revolucionário no papel; produzido em unidades contáveis nos dedos.' },
  { id: 'type99', nome: 'Type 99A', unidade: 'blindados', origem: 'CHN', fab: 'Norinco',
    preco: 0.000006, poder: 0.013, geracao: 'MBT 3ª geração', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/ZTZ-99A_tank_front_20170902.jpg/330px-ZTZ-99A_tank_front_20170902.jpg',
    desc: 'A China pegou o chassi soviético, colocou eletrônica ocidental copiada e um laser ofuscante na torre. O melhor tanque que Pequim já fez, e não exporta o modelo bom.' },
  { id: 'merkava4', nome: 'Merkava Mk.4 Barak', unidade: 'blindados', origem: 'ISR', fab: 'IDF / MANTAK',
    preco: 0.000011, poder: 0.015, geracao: 'MBT 3ª geração', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Merkava-Mk4m-whiteback01.jpg/330px-Merkava-Mk4m-whiteback01.jpg',
    desc: 'Motor na FRENTE — invertendo o projeto de todo mundo — porque Israel decidiu que blindar a tripulação vale mais que otimizar peso. Único tanque do mundo com compartimento traseiro pra feridos.' },
  { id: 'k2', nome: 'K2 Black Panther', unidade: 'blindados', origem: 'KOR', fab: 'Hyundai Rotem',
    preco: 0.000009, poder: 0.015, geracao: 'MBT 3.5ª geração', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/U.S.%2C_ROK_forces_forge_interoperability_with_combined_arms_exercise_-_8_of_8.jpg/330px-U.S.%2C_ROK_forces_forge_interoperability_with_combined_arms_exercise_-_8_of_8.jpg',
    desc: 'Suspensão hidropneumática que faz o tanque agachar e inclinar. A Polônia encomendou 1.000 porque a Coreia entrega em meses enquanto a Alemanha entrega em anos.' },
  { id: 'altay', nome: 'Altay', unidade: 'blindados', origem: 'TUR', fab: 'BMC',
    preco: 0.000008, poder: 0.012, geracao: 'MBT 3ª geração', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Altay_Tank.jpg/330px-Altay_Tank.jpg',
    desc: 'Projetado com ajuda coreana pra dar independência à Turquia. Ficou anos parado porque a Alemanha não vendia o motor — a lição que fez Ancara industrializar defesa a marteladas.' },
  { id: 'guarani', nome: 'VBTP-MR Guarani', unidade: 'blindados', origem: 'BRA', fab: 'Iveco / Exército Brasileiro',
    preco: 0.000002, poder: 0.006, geracao: 'Blindado de transporte 6x6', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/19_04_2022-_Dia_do_Ex%C3%A9rcito_Brasileiro_%2852016606453%29.jpg/330px-19_04_2022-_Dia_do_Ex%C3%A9rcito_Brasileiro_%2852016606453%29.jpg',
    desc: 'Anfíbio, feito pra Amazônia e pro Pantanal, onde tanque pesado afunda. O Brasil não precisa de MBT — precisa de algo que atravesse rio e não quebre a 400 km da oficina mais próxima.' },

  // ═══ ARTILHARIA ════════════════════════════════════════════════════
  { id: 'himars', nome: 'M142 HIMARS', unidade: 'artilharia', origem: 'USA', fab: 'Lockheed Martin',
    preco: 0.000005, poder: 0.020, geracao: 'Lança-foguetes múltiplo', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/HIMARS_-_missile_launched.jpg/500px-HIMARS_-_missile_launched.jpg',
    desc: 'Atira e some em 30 segundos antes do contra-fogo chegar. Redesenhou a logística russa na Ucrânia obrigando os depósitos a recuarem 80 km. A arma que virou substantivo.' },
  { id: 'm109', nome: 'M109A7 Paladin', unidade: 'artilharia', origem: 'USA', fab: 'BAE Systems',
    preco: 0.000004, poder: 0.010, geracao: 'Obuseiro autopropulsado', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kings_of_battle_keep_the_fire%3B_1-9_FA_fires_its_last_rounds_140910-A-CW513-046.jpg/330px-Kings_of_battle_keep_the_fire%3B_1-9_FA_fires_its_last_rounds_140910-A-CW513-046.jpg',
    desc: 'Um projeto dos anos 1960 na sua sétima reencarnação. Artilharia não precisa ser elegante — precisa estar lá quando a infantaria grita no rádio.' },
  { id: 'pzh2000', nome: 'PzH 2000', unidade: 'artilharia', origem: 'DEU', fab: 'KNDS Deutschland',
    preco: 0.000007, poder: 0.014, geracao: 'Obuseiro autopropulsado', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Panzerhaubitze_2000_-_Bundeswehr_Military_History_Museum%2C_Dresden.jpg/330px-Panzerhaubitze_2000_-_Bundeswehr_Military_History_Museum%2C_Dresden.jpg',
    desc: 'Detém o recorde de alcance com projétil convencional e dispara três tiros que caem juntos no mesmo alvo. Também superaqueceu o cano na Ucrânia por atirar mais do que o manual previa.' },
  { id: 'caesar', nome: 'CAESAR 8x8', unidade: 'artilharia', origem: 'FRA', fab: 'KNDS France',
    preco: 0.000005, poder: 0.012, geracao: 'Obuseiro sobre rodas', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/French_Army_CAESAR_self-propelled_wheeled_howitzer%2C_2021.jpg/330px-French_Army_CAESAR_self-propelled_wheeled_howitzer%2C_2021.jpg',
    desc: 'Um canhão de 155 mm em cima de um caminhão. Sem lagarta, sem blindagem, sem desculpa: chega rápido, atira e vaza. A escola francesa de fazer mais com menos.' },
  { id: 'k9', nome: 'K9A2 Thunder', unidade: 'artilharia', origem: 'KOR', fab: 'Hanwha',
    preco: 0.000004, poder: 0.013, geracao: 'Obuseiro autopropulsado', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/2011.2.17_%EC%9C%A1%EA%B5%B06%ED%8F%AC%EB%B3%91%EC%97%AC%EB%8B%A8_k-9%2Ck-55_%EC%9E%90%EC%A3%BC%ED%8F%AC%EC%82%AC%EA%B2%A9_%287633864346%29.jpg/330px-2011.2.17_%EC%9C%A1%EA%B5%B06%ED%8F%AC%EB%B3%91%EC%97%AC%EB%8B%A8_k-9%2Ck-55_%EC%9E%90%EC%A3%BC%ED%8F%AC%EC%82%AC%EA%B2%A9_%287633864346%29.jpg',
    desc: 'O obuseiro mais exportado do planeta. A Coreia do Sul vive apontada por 13 mil peças de artilharia norte-coreanas — eles levam esse assunto a sério de um jeito que ninguém mais leva.' },
  { id: 'astros', nome: 'ASTROS II MK6', unidade: 'artilharia', origem: 'BRA', fab: 'Avibras',
    preco: 0.000003, poder: 0.011, geracao: 'Lança-foguetes múltiplo', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Avibras_ASTROS-II_SS-30.JPEG/330px-Avibras_ASTROS-II_SS-30.JPEG',
    desc: 'Brasileiro, usado em combate real na Guerra do Golfo pelo Iraque. A Avibras quase faliu várias vezes e o sistema continua sendo o melhor produto de defesa que o país já vendeu.' },
  { id: 'smerch', nome: 'BM-30 Smerch', unidade: 'artilharia', origem: 'RUS', fab: 'Splav',
    preco: 0.000003, poder: 0.012, geracao: 'Lança-foguetes múltiplo', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/BM-30_Smerch_ARMY-2018.jpg/500px-BM-30_Smerch_ARMY-2018.jpg',
    desc: 'Doze foguetes de 300 mm que apagam um quilômetro quadrado. Precisão é um conceito que não se aplica aqui — a doutrina soviética prefere volume.' },

  // ═══ NAVIOS ════════════════════════════════════════════════════════
  { id: 'burke', nome: 'Destróier Arleigh Burke Flight III', unidade: 'navios', origem: 'USA', fab: 'HII / Bath Iron Works',
    preco: 0.0022, poder: 0.060, geracao: 'Destróier Aegis', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/US_Navy_080906-N-1082Z-067_The_guided-missile_destroyer_USS_Roosevelt_%28DDG_80%29_transits_the_Atlantic_Ocean.jpg/330px-US_Navy_080906-N-1082Z-067_The_guided-missile_destroyer_USS_Roosevelt_%28DDG_80%29_transits_the_Atlantic_Ocean.jpg',
    desc: 'Noventa e seis células de lançamento vertical e um radar que rastreia míssil balístico. Setenta e três foram construídos — a classe de grandes navios de guerra mais numerosa desde a Segunda Guerra.' },
  { id: 'type055', nome: 'Cruzador Type 055 Renhai', unidade: 'navios', origem: 'CHN', fab: 'Jiangnan',
    preco: 0.0018, poder: 0.058, geracao: 'Cruzador', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/PLANS_Nanchang_%28DDG-101%29_20210427.jpg/330px-PLANS_Nanchang_%28DDG-101%29_20210427.jpg',
    desc: 'Cento e doze células — mais que qualquer navio americano de superfície. A China construiu oito em seis anos, num ritmo que os estaleiros ocidentais não conseguem sequer imitar.' },
  { id: 'gorshkov', nome: 'Fragata Almirante Gorshkov', unidade: 'navios', origem: 'RUS', fab: 'Severnaya Verf',
    preco: 0.0009, poder: 0.040, geracao: 'Fragata', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Admiral_Gorshkov_frigate_03.jpg/330px-Admiral_Gorshkov_frigate_03.jpg',
    desc: 'Carrega o míssil hipersônico Tsirkon. É o navio mais moderno da Rússia e demorou 12 anos pra ficar pronto — a indústria naval russa nunca se recuperou de 1991.' },
  { id: 'type45', nome: 'Destróier Type 45 Daring', unidade: 'navios', origem: 'GBR', fab: 'BAE Systems',
    preco: 0.0015, poder: 0.048, geracao: 'Destróier antiaéreo', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Royal_Navy_Type_45_destroyer_HMS_Daring_MOD_45154175.jpg/330px-Royal_Navy_Type_45_destroyer_HMS_Daring_MOD_45154175.jpg',
    desc: 'A melhor defesa antiaérea do mundo montada numa planta de propulsão que quebrava em água quente. A Marinha Real passou anos com metade da frota atracada por causa disso.' },
  { id: 'fremm', nome: 'Fragata FREMM', unidade: 'navios', origem: 'FRA', fab: 'Naval Group / Fincantieri',
    preco: 0.0008, poder: 0.038, geracao: 'Fragata multimissão', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Fr%C3%A9gate_Aquitaine_1.jpg/330px-Fr%C3%A9gate_Aquitaine_1.jpg',
    desc: 'Franco-italiana, vendida pro Egito, Marrocos e até pros EUA (que a rebatizaram de classe Constellation). Raro caso de europeu vendendo navio pra americano.' },
  { id: 'sejong', nome: 'Destróier Sejong o Grande', unidade: 'navios', origem: 'KOR', fab: 'Hyundai Heavy',
    preco: 0.0013, poder: 0.052, geracao: 'Destróier Aegis', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/ROKS_Sejong_the_Great_%28DDG-991%29%2C_broadside_view_in_July_2010.jpg/330px-ROKS_Sejong_the_Great_%28DDG-991%29%2C_broadside_view_in_July_2010.jpg',
    desc: 'Cento e vinte e oito células — o destróier Aegis mais armado do mundo, mais que os americanos. A Coreia constrói navio melhor e mais barato que quase todo mundo.' },

  // ═══ SUBMARINOS ════════════════════════════════════════════════════
  { id: 'virginia', nome: 'Submarino Classe Virginia', unidade: 'submarinos', origem: 'USA', fab: 'General Dynamics EB',
    preco: 0.0035, poder: 0.075, geracao: 'SSN nuclear de ataque', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg/330px-US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg',
    desc: 'Nuclear, silencioso a ponto de o oceano não perceber, e capaz de ficar submerso até a comida acabar. Os EUA só concordaram em compartilhar essa tecnologia uma vez em 60 anos — com a Austrália, no AUKUS.' },
  { id: 'astute', nome: 'Submarino Classe Astute', unidade: 'submarinos', origem: 'GBR', fab: 'BAE Systems',
    preco: 0.0032, poder: 0.070, geracao: 'SSN nuclear de ataque', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/HMS_Ambush_long.jpg/330px-HMS_Ambush_long.jpg',
    desc: 'Tão silencioso que dizem detectar um navio saindo de Nova York estando no Canal da Mancha. A Grã-Bretanha quase perdeu a capacidade de construí-los por deixar a linha parada tempo demais.' },
  { id: 'yasen', nome: 'Submarino Classe Yasen-M', unidade: 'submarinos', origem: 'RUS', fab: 'Sevmash',
    preco: 0.0028, poder: 0.068, geracao: 'SSGN nuclear', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg/330px-US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg',
    desc: 'O único submarino russo que tira o sono da Marinha americana. Silencioso, armado com Kalibr e Oniks, e produzido devagar demais pra mudar o equilíbrio.' },
  { id: 'scorpene', nome: 'Submarino Scorpène', unidade: 'submarinos', origem: 'FRA', fab: 'Naval Group',
    preco: 0.0008, poder: 0.032, geracao: 'SSK diesel-elétrico', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/INS_Kalvari_Sea_Trial.JPG/330px-INS_Kalvari_Sea_Trial.JPG',   // sugerido: variante próxima verificada — trocar pela exata depois
    desc: 'Convencional, exportado pra Chile, Malásia, Índia e Brasil. Teve 22 mil páginas de documentação vazadas em 2016 — o maior vazamento da história da indústria naval.' },
  { id: 'type214', nome: 'Submarino Type 214', unidade: 'submarinos', origem: 'DEU', fab: 'TKMS',
    preco: 0.0007, poder: 0.034, geracao: 'SSK com AIP', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg/330px-US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg',
    desc: 'Célula de combustível que permite ficar duas semanas submerso sem subir — um diesel-elétrico que se comporta quase como nuclear. A Alemanha é a maior exportadora de submarino convencional do mundo.' },
  { id: 'dolphin', nome: 'Submarino Classe Dolphin', unidade: 'submarinos', origem: 'ISR', fab: 'TKMS / Israel',
    preco: 0.0009, poder: 0.038, geracao: 'SSK com AIP', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/INS_Tanin%2C_Dolphin_AIP_submarine.jpg/330px-INS_Tanin%2C_Dolphin_AIP_submarine.jpg',
    desc: 'Construído na Alemanha, modificado em Israel, e amplamente tido como a perna naval do arsenal nuclear israelense — o que garante retaliação mesmo se o país inteiro for destruído. Ninguém confirma nada.' },
  { id: 'soryu', nome: 'Submarino Classe Sōryū', unidade: 'submarinos', origem: 'JPN', fab: 'Mitsubishi / Kawasaki',
    preco: 0.0006, poder: 0.036, geracao: 'SSK com íon-lítio', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/JMSDF-S%C5%8Dry%C5%AB-class_submarine_in_Kure_Naval_Base-3.jpg/330px-JMSDF-S%C5%8Dry%C5%AB-class_submarine_in_Kure_Naval_Base-3.jpg',
    desc: 'Primeiro submarino do mundo com bateria de íon-lítio. O Japão perdeu o contrato australiano por não saber vender — engenharia impecável, diplomacia comercial desastrosa.' },

  // ═══ PORTA-AVIÕES ══════════════════════════════════════════════════
  { id: 'ford', nome: 'Porta-aviões Classe Gerald R. Ford', unidade: 'porta_avioes', origem: 'USA', fab: 'Newport News',
    preco: 0.013, poder: 0.55, geracao: 'CVN nuclear', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bow_view_of_USS_Gerald_R._Ford_%28CVN-78%29_underway_on_8_April_2017.JPG/330px-Bow_view_of_USS_Gerald_R._Ford_%28CVN-78%29_underway_on_8_April_2017.JPG',
    desc: 'Treze bilhões de dólares, cem mil toneladas, dois reatores nucleares e catapulta eletromagnética. Uma cidade flutuante de 4.500 pessoas que projeta poder em qualquer costa do planeta. Os EUA têm onze. O resto do mundo somado tem menos.' },
  { id: 'queenelizabeth', nome: 'Porta-aviões Classe Queen Elizabeth', unidade: 'porta_avioes', origem: 'GBR', fab: 'Aircraft Carrier Alliance',
    preco: 0.005, poder: 0.34, geracao: 'CV convencional (STOVL)', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/HMS_Queen_Elizabeth_in_Gibraltar_-_2018_%2828386226189%29.jpg/330px-HMS_Queen_Elizabeth_in_Gibraltar_-_2018_%2828386226189%29.jpg',
    desc: 'Rampa de salto em vez de catapulta — barato de construir, limitante de operar. A Grã-Bretanha construiu dois e passou anos sem aviões suficientes pra encher um.' },
  { id: 'degaulle', nome: 'Porta-aviões Charles de Gaulle', unidade: 'porta_avioes', origem: 'FRA', fab: 'Naval Group',
    preco: 0.006, poder: 0.38, geracao: 'CVN nuclear', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/French_aircraft_carrier_Charles_de_Gaulle_%28R91%29_underway_in_the_Ionian_Sea_on_17_March_2022_%28220317-N-DH793-1322%29cropped.JPG/330px-French_aircraft_carrier_Charles_de_Gaulle_%28R91%29_underway_in_the_Ionian_Sea_on_17_March_2022_%28220317-N-DH793-1322%29cropped.JPG',
    desc: 'O único porta-aviões nuclear fora dos EUA. Na primeira viagem a hélice quebrou e teve que voltar. Hoje funciona, e é o que permite à França bombardear sozinha, sem pedir base a ninguém.' },
  { id: 'fujian', nome: 'Porta-aviões Fujian', unidade: 'porta_avioes', origem: 'CHN', fab: 'Jiangnan',
    preco: 0.008, poder: 0.42, geracao: 'CV com catapulta eletromagnética', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bow_view_of_USS_Gerald_R._Ford_%28CVN-78%29_underway_on_8_April_2017.JPG/330px-Bow_view_of_USS_Gerald_R._Ford_%28CVN-78%29_underway_on_8_April_2017.JPG',
    desc: 'A China pulou a geração da catapulta a vapor e foi direto pra eletromagnética — a mesma do Ford. Terceiro porta-aviões em 12 anos. Ninguém na história construiu tão rápido.' },
  { id: 'vikrant', nome: 'Porta-aviões INS Vikrant', unidade: 'porta_avioes', origem: 'IND', fab: 'Cochin Shipyard',
    preco: 0.003, poder: 0.24, geracao: 'CV convencional (STOBAR)', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/IAC1_Vikrant_at_Cochin.jpg/330px-IAC1_Vikrant_at_Cochin.jpg',
    desc: 'Levou 17 anos e virou símbolo nacional do "fazemos em casa". A Índia é o sexto país capaz de construir um porta-aviões — e faz questão de lembrar disso.' },

  // ═══ MÍSSEIS ═══════════════════════════════════════════════════════
  { id: 'tomahawk', nome: 'Tomahawk Block V', unidade: 'misseis', origem: 'USA', fab: 'Raytheon',
    preco: 0.0000019, poder: 0.045, geracao: 'Cruzeiro subsônico', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tomahawk_Block_IV_cruise_missile_-crop.jpg/330px-Tomahawk_Block_IV_cruise_missile_-crop.jpg',
    desc: 'Mil e seiscentos quilômetros de alcance voando a 50 metros do chão. É o telefonema americano: quando o Tomahawk sai, a conversa diplomática já acabou.' },
  { id: 'jassm', nome: 'AGM-158 JASSM-ER', unidade: 'misseis', origem: 'USA', fab: 'Lockheed Martin',
    preco: 0.0000014, poder: 0.040, geracao: 'Cruzeiro furtivo', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/AGM-158_JASSM_cruise_missile.jpg/500px-AGM-158_JASSM_cruise_missile.jpg',
    desc: 'Furtivo, lançado do ar a 900 km do alvo. Permite atacar sem o avião entrar no alcance da defesa antiaérea — a doutrina inteira de standoff cabe nessa frase.' },
  { id: 'kalibr', nome: '3M-14 Kalibr', unidade: 'misseis', origem: 'RUS', fab: 'Novator',
    preco: 0.0000012, poder: 0.038, geracao: 'Cruzeiro subsônico', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/3M-14E_submarine_launched_land_attack_cruise_missile_from_Kalibr-PLE-Club-S_system_01.jpg/500px-3M-14E_submarine_launched_land_attack_cruise_missile_from_Kalibr-PLE-Club-S_system_01.jpg',
    desc: 'A resposta russa ao Tomahawk, lançada de submarino, navio ou até de um cargueiro disfarçado em contêiner. A versão de exportação em contêiner é uma das ideias mais sinistras já colocadas à venda.' },
  { id: 'iskander', nome: '9K720 Iskander-M', unidade: 'misseis', origem: 'RUS', fab: 'KBM',
    preco: 0.000003, poder: 0.050, geracao: 'Balístico tático', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Army2016demo-075.jpg/330px-Army2016demo-075.jpg',
    desc: 'Manobra na reentrada pra confundir interceptadores e pode carregar ogiva nuclear tática. Estacionado em Kaliningrad, alcança meia Europa a partir de dentro dela.' },
  { id: 'kinzhal', nome: 'Kh-47M2 Kinzhal', unidade: 'misseis', origem: 'RUS', fab: 'MKB Raduga',
    preco: 0.00001, poder: 0.065, geracao: 'Hipersônico aerobalístico', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Kh-47M2_Kinzhal_Army-2022.jpg/500px-Kh-47M2_Kinzhal_Army-2022.jpg',
    desc: 'Anunciado como imparável. Um Patriot americano em Kiev derrubou vários em 2023, o que encerrou a propaganda com uma eficácia que nenhum discurso teria.' },
  { id: 'df21d', nome: 'DF-21D', unidade: 'misseis', origem: 'CHN', fab: 'CASC',
    preco: 0.000008, poder: 0.058, geracao: 'Balístico antinavio', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/DF-21A_TEL_-_Chinese_Military_Museum_Beijing.jpg/330px-DF-21A_TEL_-_Chinese_Military_Museum_Beijing.jpg',
    desc: 'O "matador de porta-aviões": míssil balístico que persegue navio em movimento a 1.500 km. Existe pra tornar caro demais aproximar uma frota americana de Taiwan. Nunca foi testado num alvo real.' },
  { id: 'df26', nome: 'DF-26', unidade: 'misseis', origem: 'CHN', fab: 'CASC',
    preco: 0.00001, poder: 0.062, geracao: 'Balístico de alcance intermediário', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Dong-Feng_26.JPG/500px-Dong-Feng_26.JPG',
    desc: 'Apelidado de "expresso de Guam" porque alcança exatamente a principal base americana no Pacífico. Convencional ou nuclear — e o inimigo não sabe qual está vindo.' },
  { id: 'brahmos', nome: 'BrahMos', unidade: 'misseis', origem: 'IND', fab: 'BrahMos Aerospace',
    preco: 0.0000035, poder: 0.048, geracao: 'Cruzeiro supersônico', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/The_Brahmos_Missile_system_passes_through_the_Rajpath_during_the_full_dress_rehearsal_for_the_Republic_Day_Parade_in_New_Delhi_on_January_23%2C2006.jpg/330px-The_Brahmos_Missile_system_passes_through_the_Rajpath_during_the_full_dress_rehearsal_for_the_Republic_Day_Parade_in_New_Delhi_on_January_23%2C2006.jpg',
    desc: 'Indo-russo, Mach 3, e o primeiro produto de defesa que a Índia realmente exportou (Filipinas, 2022). Chega antes do operador do radar terminar de processar o que viu.' },
  { id: 'stormshadow', nome: 'Storm Shadow / SCALP', unidade: 'misseis', origem: 'GBR', fab: 'MBDA',
    preco: 0.0000025, poder: 0.042, geracao: 'Cruzeiro furtivo', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Storm_Shadow_p1220865.jpg/330px-Storm_Shadow_p1220865.jpg',
    desc: 'Anglo-francês, furou bunkers russos na Crimeia depois de meses de hesitação política em Londres e Paris. A arma estava pronta muito antes da decisão de usá-la.' },
  { id: 'fattah', nome: 'Fattah-1', unidade: 'misseis', origem: 'IRN', fab: 'IRGC Aerospace',
    preco: 0.0000008, poder: 0.036, geracao: 'Balístico hipersônico (alegado)', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Fateh-110_Missile_by_YPA.IR_02.jpg/330px-Fateh-110_Missile_by_YPA.IR_02.jpg',   // sugerido: variante próxima verificada — trocar pela exata depois
    desc: 'O Irã afirma ser hipersônico manobrável. Analistas ocidentais duvidam da manobrabilidade e não duvidam do alcance. De todo jeito, o Irã vende míssil pra quem os outros não vendem.' },
  { id: 'hwasong17', nome: 'Hwasong-17', unidade: 'misseis', origem: 'PRK', fab: 'Academia de Ciências de Defesa',
    preco: 0.00002, poder: 0.070, geracao: 'ICBM', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/North_Korea%27s_ballistic_missile_-_North_Korea_Victory_Day-2013_01.jpg/330px-North_Korea%27s_ballistic_missile_-_North_Korea_Victory_Day-2013_01.jpg',   // sugerido: variante próxima verificada — trocar pela exata depois
    desc: 'Um ICBM de 25 metros num país onde falta comida. Alcança o território continental americano — que é, literalmente, o único propósito do regime ao construí-lo: garantir que ninguém invada.' },

  // ═══ DEFESA AÉREA — categoria nova ═════════════════════════════════
  // Não estava no jogo e é metade da guerra moderna: sem defesa antiaérea,
  // seu arsenal caro vira alvo caro.
  { id: 'patriot', nome: 'MIM-104 Patriot PAC-3', unidade: 'defesa_aerea', origem: 'USA', fab: 'Raytheon',
    preco: 0.0011, poder: 0.055, geracao: 'SAM de longo alcance', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tomahawk_Block_IV_cruise_missile_-crop.jpg/330px-Tomahawk_Block_IV_cruise_missile_-crop.jpg',
    desc: 'Derruba avião e míssil balístico. Custa dois milhões por interceptador pra abater um drone de vinte mil — a assimetria econômica que está quebrando todo mundo.' },
  { id: 'thaad', nome: 'THAAD', unidade: 'defesa_aerea', origem: 'USA', fab: 'Lockheed Martin',
    preco: 0.0018, poder: 0.062, geracao: 'Antibalístico de alta altitude', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/THAAD_missile_launch_in_2005_-2.jpg/500px-THAAD_missile_launch_in_2005_-2.jpg',
    desc: 'Intercepta na borda da atmosfera batendo direto no alvo, sem explosivo — pura energia cinética. Quando os EUA instalaram um na Coreia do Sul, a China retaliou economicamente por dois anos.' },
  { id: 's400', nome: 'S-400 Triumf', unidade: 'defesa_aerea', origem: 'RUS', fab: 'Almaz-Antey',
    preco: 0.0006, poder: 0.050, geracao: 'SAM de longo alcance', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/S-400_Triumf_%2827102989027%29.jpg/500px-S-400_Triumf_%2827102989027%29.jpg',
    desc: 'A Rússia vende pra quem os EUA não vendem, e cada venda racha uma aliança: a Turquia comprou e foi expulsa do programa F-35. O S-400 é tanto arma quanto cunha diplomática.' },
  { id: 's500', nome: 'S-500 Prometey', unidade: 'defesa_aerea', origem: 'RUS', fab: 'Almaz-Antey',
    preco: 0.0012, poder: 0.060, geracao: 'Antibalístico / antissatélite', politica: 'nunca', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/%D0%A1-500_%D1%80%D0%BE%D1%81%D1%81%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9_%D0%B7%D0%B5%D0%BD%D0%B8%D1%82%D0%BD%D1%8B%D0%B9_%D1%80%D0%B0%D0%BA%D0%B5%D1%82%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D0%BC%D0%BF%D0%BB%D0%B5%D0%BA%D1%81.jpg/500px-%D0%A1-500_%D1%80%D0%BE%D1%81%D1%81%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9_%D0%B7%D0%B5%D0%BD%D0%B8%D1%82%D0%BD%D1%8B%D0%B9_%D1%80%D0%B0%D0%BA%D0%B5%D1%82%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D0%BC%D0%BF%D0%BB%D0%B5%D0%BA%D1%81.jpg',
    desc: 'Projetado pra abater satélite em órbita baixa e ogiva hipersônica. Existe em quantidade simbólica — a Rússia anuncia mais rápido do que produz.' },
  { id: 'irondome', nome: 'Iron Dome', unidade: 'defesa_aerea', origem: 'ISR', fab: 'Rafael',
    preco: 0.0001, poder: 0.028, geracao: 'C-RAM de curto alcance', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/IDF_Iron_Dome_2021.jpg/330px-IDF_Iron_Dome_2021.jpg',
    desc: 'Calcula em segundos se o foguete vai cair em área habitada e só gasta interceptador se for. A inteligência não está em derrubar — está em decidir o que ignorar.' },
  { id: 'davidsling', nome: "David's Sling", unidade: 'defesa_aerea', origem: 'ISR', fab: 'Rafael / Raytheon',
    preco: 0.0004, poder: 0.044, geracao: 'SAM de médio alcance', politica: 'restrito', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/David-Sling-0001.jpg/500px-David-Sling-0001.jpg',
    desc: 'A camada do meio do escudo israelense, entre o Iron Dome e o Arrow. Israel é o único país que opera defesa antiaérea em três camadas integradas — porque é o único que precisa.' },
  { id: 'hq9', nome: 'HQ-9B', unidade: 'defesa_aerea', origem: 'CHN', fab: 'CPMIEC',
    preco: 0.0003, poder: 0.040, geracao: 'SAM de longo alcance', politica: 'livre', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/HQ-9B_20250921.jpg/500px-HQ-9B_20250921.jpg',
    desc: 'Inspirado no S-300 com eletrônica chinesa. Vendido ao Paquistão e ao Turcomenistão por um preço que a Rússia não consegue cobrir.' },
  { id: 'irist', nome: 'IRIS-T SLM', unidade: 'defesa_aerea', origem: 'DEU', fab: 'Diehl Defence',
    preco: 0.0002, poder: 0.036, geracao: 'SAM de médio alcance', politica: 'aliado', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Iris-T_SLM%2C_ILA_2024%2C_Schoenefeld_%28ILA45484%29.jpg/500px-Iris-T_SLM%2C_ILA_2024%2C_Schoenefeld_%28ILA45484%29.jpg',
    desc: 'Alcançou quase 100% de interceptação na Ucrânia — o melhor desempenho de qualquer sistema ocidental na guerra. A Diehl não dá conta das encomendas.' },
];

export const ARSENAL_POR_ID = Object.fromEntries(ARSENAL.map((a) => [a.id, a]));

// Itens que uma categoria (unidade) oferece.
export function arsenalDaUnidade(unidadeId) {
  return ARSENAL.filter((a) => a.unidade === unidadeId);
}

// O que um país FABRICA — produção nacional é 20% mais barata e ninguém corta.
export function fabricaDe(isoCode) {
  return ARSENAL.filter((a) => a.origem === isoCode);
}

// ── A DECISÃO DE VENDA ────────────────────────────────────────────────
// Retorna { pode, motivo, chance } — se o país de origem topa vender pra você.
// `chance` é a probabilidade de o pedido ser aprovado no fechamento do turno:
// mesmo com relação boa, venda de armamento sensível não é automática.
// ── QUEM VENDE PARA VOCÊ, E POR QUÊ NÃO ───────────────────────────────
// BUG QUE ISTO CONSERTA (relato do dono): "as relações com países e compras de
// armamento não tá conectado... basicamente eu compro qualquer coisa de um país
// hostil! Tá tudo bugado."
//
// Estava mesmo, e a causa era uma linha: a política `livre` tem `relMin: -100`. Ou
// seja, "vende pra quem pagar" era literal — o país com quem você estava TROCANDO
// TIRO continuava te vendendo caça, porque -100 é o fundo da escala e ninguém está
// abaixo dele. E não havia nenhuma outra checagem: nem guerra, nem embargo do
// Conselho, nem se o fornecedor ainda existia depois de uma ogiva.
//
// Agora existem quatro TRAVAS ABSOLUTAS, avaliadas antes da política do item. Elas
// não são "relação insuficiente" — são recusas que nenhum preço e nenhuma política de
// exportação resolve, porque não são sobre confiança, são sobre o mundo:
//
//   1. o fornecedor não existe mais (foi apagado do mapa);
//   2. você está em GUERRA ABERTA com ele;
//   3. o Conselho de Segurança te pôs sob embargo de armas;
//   4. a relação está em território hostil — abaixo de -25 ninguém arma quem o odeia,
//      por mais liberal que seja a política de exportação. É o piso que faltava para
//      "venda livre" parar de significar "venda para todos, inclusive inimigos".
//
// A trava 4 é a que mais muda o jogo no dia a dia: ela transforma a diplomacia em
// pré-requisito de logística. Azedar com quem te fornece passa a ter preço militar.
export function podeComprar(item, estado, relValor, meuIso) {
  const p = POLITICAS[item.politica];

  // Produção nacional: você fabrica. Não precisa pedir licença a ninguém.
  if (item.origem === meuIso) {
    return { pode: true, chance: 1, nacional: true, motivo: 'Produção nacional — a linha de montagem é sua.' };
  }

  const e = estado || {};
  // 1 · O FORNECEDOR SAIU DO MAPA. Sem isto, o jogo oferecia um Su-57 de uma Rússia
  // que tinha virado zona radioativa três meses antes.
  const morto = (e.nacoesMortas || []).some((m) => (m?.iso || m) === item.origem)
    || (e.zonasRadioativas || []).some((z) => (z?.iso || z) === item.origem);
  if (morto) {
    return { pode: false, chance: 0, bloqueio: 'morto',
      motivo: 'Não há mais indústria nem governo ali. Este fornecedor deixou de existir.' };
  }
  // 2 · GUERRA ABERTA. A trava mais óbvia, e a que o dono viu faltando.
  if ((e.emGuerra || []).includes(item.origem)) {
    return { pode: false, chance: 0, bloqueio: 'guerra',
      motivo: 'Vocês estão em guerra aberta. Ninguém vende arma para quem está apontando uma.' };
  }
  // 3 · EMBARGO DO CONSELHO DE SEGURANÇA contra você. A pena existia e o mercado não
  // a consultava — a sala votava um embargo de armas e o embargado seguia comprando.
  const embargo = (e.penasONU || []).find((x) => x?.tipo === 'embargo_armas' && x?.contra === meuIso && Number(x?.turnos) > 0);
  if (embargo) {
    return { pode: false, chance: 0, bloqueio: 'embargo',
      motivo: `Embargo de armas do Conselho de Segurança — ${embargo.turnos} mês(es) restantes. Nenhum fornecedor estrangeiro assina contrato com você.` };
  }
  // 4 · O PISO DA HOSTILIDADE. Abaixo disto, nem "venda livre" vende.
  if (relValor <= REL_HOSTIL) {
    return { pode: false, chance: 0, bloqueio: 'hostil',
      motivo: `Relação ${relValor}: vocês são hostis. Nenhuma política de exportação cobre venda a um adversário declarado.` };
  }

  if (item.politica === 'nunca') {
    return { pode: false, chance: 0, motivo: `${p.txt} Não há preço que resolva isto.` };
  }
  if (relValor < p.relMin) {
    return {
      pode: false, chance: 0,
      motivo: `Relação ${relValor} — insuficiente. ${p.rot}: exige ${p.relMin}+.`,
    };
  }
  // Acima do mínimo, a chance cresce com a relação — mas nunca é certa.
  const folga = (relValor - p.relMin) / (100 - p.relMin);
  const base = item.politica === 'livre' ? 0.9 : item.politica === 'aliado' ? 0.62 : 0.4;
  const chance = Math.min(0.97, base + folga * 0.35);
  return { pode: true, chance: Math.round(chance * 100) / 100, motivo: p.txt };
}

// Preço efetivo: produção nacional é mais barata; relação ruim encarece (ágio de risco).
export function precoEfetivo(item, relValor, meuIso) {
  if (item.origem === meuIso) return round6(item.preco * 0.8);
  if (relValor >= 60) return item.preco;                 // amigo paga tabela
  if (relValor >= 30) return round6(item.preco * 1.12);  // conhecido paga ágio
  return round6(item.preco * 1.3);                        // desconhecido paga caro
}

function round6(n) { return Math.round(n * 1e6) / 1e6; }
