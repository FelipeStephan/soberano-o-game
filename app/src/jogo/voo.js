// ═══════════════════════════════════════════════════════════════════════
// A OGIVA EM VOO — os doze segundos entre apertar o botão e o clarão
// ═══════════════════════════════════════════════════════════════════════
// O PEDIDO DO DONO: "a bomba nuclear quando é jogada, ela não mostra a bomba caindo.
// Seria muito foda ter um tempo pra bomba cair e VER no mapa ela. Pense num formato
// pra mim para o online também."
//
// ── O QUE ESTAVA ERRADO ───────────────────────────────────────────────
// A ogiva JÁ voava em 3D (globo.lancarOgiva), mas por ~2,8 segundos — e a câmera
// pulava direto para o alvo no instante do lançamento, então o míssil entrava no
// quadro vindo de fora, meio segundo antes de explodir. Na prática o jogador via o
// cogumelo, não a bomba.
//
// E no ONLINE era pior, de um jeito que ninguém tinha notado: o cliente do ALVO
// aplicava a zona morta no instante em que o bilhete chegava (ui/online.js), enquanto
// desenhava uma salva genérica de mísseis por cima. Ou seja: o país já estava apagado
// no mapa enquanto o míssil ainda "voava". A contagem regressiva de 6s que existia
// era teatro puro — ela não segurava nada, porque o efeito já tinha acontecido.
//
// ── O FORMATO (a parte que o dono pediu para eu pensar) ───────────────
//
// 1. O TEMPO É O MESMO PARA TODO MUNDO, E VEM DO RELÓGIO DO SERVIDOR.
//    O voo não é "12 segundos a partir de quando o seu cliente recebeu" — é "impacto
//    no instante T". Quem recebe o bilhete 300ms depois vê 11,7s de voo, não 12. É o
//    mesmo princípio que as frotas em trânsito já usam. Sem isso, o clarão acontece em
//    horas diferentes em cada tela e a sala inteira discorda do que viu.
//
// 2. O EFEITO ACONTECE NO IMPACTO, NUNCA NA CHEGADA DO BILHETE.
//    É a correção do bug acima e a regra que dá sentido aos doze segundos: durante o
//    voo, o país alvo ainda existe, ainda aparece no mapa, ainda tem governo.
//
// 3. QUEM LANÇA CONTINUA RESOLVENDO O RESULTADO.
//    Mesma regra do resto do jogo (a batalha resolve no cliente de quem ataca). Não
//    inventei uma segunda autoridade — duas autoridades é como uma sala passa a ter
//    duas versões da mesma explosão.
//
// 4. MAS O ALVO TEM UMA JOGADA DENTRO DA JANELA.
//    Doze segundos de espera passiva é um atraso, não uma cena. O alvo pode gastar
//    caixa numa INTERCEPTAÇÃO DE EMERGÊNCIA e mandar um bilhete de volta; quem lançou
//    incorpora o reforço se ele chegar antes do impacto. Se não chegar a tempo, vale o
//    cálculo original — e isso é honesto num jogo de rede: quem hesitou, perdeu a
//    janela. É o que transforma a espera em decisão.
//
// 5. QUEM CHEGA ATRASADO NÃO VÊ CINEMA.
//    Bilhete com impacto já no passado (jogador entrou na sala depois, ou a aba estava
//    em segundo plano) aplica o efeito na hora, sem animação. Um cogumelo de um
//    lançamento de três minutos atrás confundiria mais do que informa.
//
// Este módulo é PURO: só números, tempo e JSON. Ele não desenha nada e não fala com a
// rede — quem faz isso é ui/nuclear.js e ui/online.js. Ele existe para que as duas
// pontas leiam o MESMO relógio e a MESMA régua de fases.

// Doze segundos. Um ICBM real leva meia hora; dois segundos e meio (o que o jogo tinha)
// não dá tempo de o jogador nem virar a cabeça. Doze é o ponto em que dá para ver o
// arco cruzar o planeta, ler o alerta, decidir se gasta caixa na interceptação — e
// ainda assim não é tempo o bastante para ir buscar café. Testei descendo para 8 (curto
// demais para caber a decisão) e subindo para 20 (a sala inteira parada, olhando).
export const DUR_VOO_MS = 12000;

// As quatro fases, em fração do voo. Elas existem para a UI narrar ("REENTRADA") e
// para o motor saber quando a interceptação é decidida — não são enfeite de texto.
export const FASES = [
  { id: 'lancamento', ate: 0.16, rot: 'LANÇAMENTO', txt: 'A tampa do silo abriu. Não há mais o que decidir deste lado.' },
  { id: 'trajetoria', ate: 0.62, rot: 'TRAJETÓRIA BALÍSTICA', txt: 'A ogiva deixou a atmosfera. Todo radar do planeta está vendo isto.' },
  { id: 'reentrada', ate: 0.90, rot: 'REENTRADA', txt: 'Voltando à atmosfera. É a última janela em que uma defesa consegue tocá-la.' },
  { id: 'terminal', ate: 1.01, rot: 'FASE TERMINAL', txt: 'Sem retorno.' },
];

// A janela em que o reforço de defesa ainda vale. Depois da reentrada não adianta mais
// gastar dinheiro: o interceptador não teria tempo de subir. É o que impede o alvo de
// esperar 11,9s e comprar a salvação no último frame.
export const FIM_DA_JANELA = 0.62;

export function faseDoVoo(pct) {
  const p = Math.max(0, Math.min(1, Number(pct) || 0));
  return FASES.find((f) => p < f.ate) || FASES[FASES.length - 1];
}

// ── O REGISTRO ────────────────────────────────────────────────────────
// Os voos vivem no ESTADO (JSON puro) e não numa variável de módulo, por dois motivos
// que já morderam este projeto antes: o save precisa sobreviver a um F5 no meio do
// voo, e `iniciarJogo` roda mais de uma vez na mesma aba (o renascimento) — variável
// de módulo sobreviveria à partida morta segurando um voo fantasma.
export function cofreVoos(estado) {
  if (!Array.isArray(estado.ogivasEmVoo)) estado.ogivasEmVoo = [];
  return estado.ogivasEmVoo;
}

export function registrarVoo(estado, voo) {
  const c = cofreVoos(estado);
  if (!voo?.id || c.some((v) => v.id === voo.id)) return null;  // o relay ecoa; id repetido não voa duas vezes
  c.push(voo);
  if (c.length > 8) c.splice(0, c.length - 8);
  return voo;
}

export function acharVoo(estado, id) { return cofreVoos(estado).find((v) => v.id === id) || null; }
export function removerVoo(estado, id) {
  const c = cofreVoos(estado);
  const i = c.findIndex((v) => v.id === id);
  if (i >= 0) c.splice(i, 1);
}

// ── O RELÓGIO COMPARTILHADO ───────────────────────────────────────────
// `impactoEm` é um instante em milissegundos do relógio de QUEM LANÇOU. Cada cliente
// converte para o próprio relógio somando o desvio que o lobby já mede — o mesmo
// caminho das frotas em trânsito. Sem `desvio`, dois computadores com 4 segundos de
// diferença veem duas explosões em horas diferentes.
export function restanteMs(voo, { agora = Date.now(), desvio = 0 } = {}) {
  if (!voo?.impactoEm) return 0;
  return Math.max(0, (voo.impactoEm + desvio) - agora);
}
export function progresso(voo, opts = {}) {
  const dur = voo?.duracaoMs || DUR_VOO_MS;
  return Math.max(0, Math.min(1, 1 - restanteMs(voo, opts) / dur));
}
// Bilhete que chegou tarde demais para virar cena. O corte é generoso (meio segundo):
// abaixo disso a animação seria um piscar, e o jogador acharia que travou.
export function chegouTarde(voo, opts = {}) { return restanteMs(voo, opts) < 500; }

// ── A INTERCEPTAÇÃO DE EMERGÊNCIA ─────────────────────────────────────
// CALIBRAGEM: a chance base do escudo já vem de `chanceInterceptacao` (jogo/nuclear.js)
// e vale entre 0 e ~0,45 nas potências com defesa antimíssil. O reforço de emergência
// soma até 25 pontos percentuais — o bastante para virar um lançamento apertado, longe
// de tornar o arsenal inútil. Custa caro de propósito: é dinheiro que sai do orçamento
// de uma década inteira para comprar um dado, e um dado que ainda pode dar errado.
//
// O custo escala com o tanto de escudo que o país JÁ tem: quem investiu em defesa paga
// menos para acionar o extra (a infraestrutura está lá), quem nunca investiu paga o
// preço de improvisar sob fogo. É a mesma lógica que o jogo usa em todo o resto —
// preparação prévia sai mais barato que reação.
export const REFORCO_MAX = 0.25;
export function custoInterceptacao(estado, chanceBase = 0) {
  const preparo = Math.max(0, Math.min(1, Number(chanceBase) || 0));
  const bruto = 2.6 - preparo * 2.2;                // 2,6 tri sem escudo · 0,4 tri com escudo pleno
  return Math.round(bruto * 100) / 100;
}
export function reforcoDe(chanceBase = 0) {
  // Quem já tem escudo aproveita melhor o reforço — não faz sentido um país sem
  // radar nem interceptador comprar a mesma vantagem de quem tem a rede montada.
  const preparo = Math.max(0, Math.min(1, Number(chanceBase) || 0));
  return Math.round((0.08 + preparo * (REFORCO_MAX - 0.08)) * 100) / 100;
}

// A decisão final do abate, num lugar só. Quem lança chama isto no IMPACTO (e não no
// lançamento) exatamente para que o reforço que chegou durante o voo entre na conta.
export function decidirAbate(chanceBase, reforco = 0, sorteio = Math.random()) {
  const p = Math.max(0, Math.min(0.95, (Number(chanceBase) || 0) + (Number(reforco) || 0)));
  return { interceptado: sorteio < p, chance: Math.round(p * 100) };
}
