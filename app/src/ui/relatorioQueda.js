// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DA QUEDA — a Máquina escreve o seu obituário político
// ═══════════════════════════════════════════════════════════════════════
// O dono: "se o jogador é deposto, ele precisa SABER POR QUÊ — e seria ótimo se a IA
// contasse a história da queda, irônica, engraçada, às vezes mais pesada."
//
// Duas camadas, nesta ordem:
//   1. O DIAGNÓSTICO (determinístico, sempre existe): a causa formal + os números que
//      cavaram a cova, lidos do estado. Isto NUNCA depende da IA.
//   2. O OBITUÁRIO (IA, opcional): um necrológio político com sarcasmo de colunista.
//      Se a IA estiver desligada/falhar, cai num fallback escrito à mão que continua
//      afiado — o jogador jamais fica sem explicação.
import { chamarIA } from '../maquina/openrouter.js';
import { situacaoDoFim, obituarioLocal } from '../dados/copyFim.js';
import { lacunasDeDestino, proximaBanda, bandaDe } from '../jogo/destino.js';
import { resumoVigilia } from '../jogo/efeitos.js';

const CAUSA_ROT = {
  aprovacao: { rot: 'DEPOSTO PELO PRÓPRIO GABINETE', dica: 'aprovação zerada' },
  estabilidade: { rot: 'O PAÍS SE PARTIU NA SUA MÃO', dica: 'estabilidade zerada' },
  colapso: { rot: 'COLAPSO TOTAL DO REINADO', dica: 'destino no fundo' },
  tempo: { rot: 'BALANÇO DA DÉCADA', dica: 'a era chegou ao fim com você no comando' },
  dominio: { rot: 'DOMÍNIO ABSOLUTO', dica: 'destino máximo' },
};

const num = (v) => Math.round(Number(v) || 0);
const tri = (v) => `US$ ${(Number(v) || 0).toFixed(2)} tri`;

// ── O DIAGNÓSTICO — culpa E crédito, porque só metade disso é mentira ──
// O DEFEITO QUE ISTO CONSERTA: esta função só sabia acusar. Ela varria o estado
// atrás de indicadores RUINS e montava a lista de culpados; numa nação que foi bem,
// a varredura não achava nada, a lista voltava vazia e a tela imprimia "nenhum
// indicador isolado explica: foi o conjunto da obra". Para quem governou uma década
// com competência, isso é um insulto sem informação — e para quem foi mal, é pior:
// é sair do jogo sem saber o que fazer diferente na próxima partida.
//
// Agora o diagnóstico tem três eixos e nenhum deles pode vir vazio de conteúdo:
//   • culpados  — o que afundou (só aparece se de fato afundou);
//   • feitos    — o que você CONSTRUIU, lido do mesmo estado com a mesma régua;
//   • lacunas   — quantos pontos de Destino cada alavanca ainda tinha pra dar.
// E `explicacao` é a frase que a UI imprime SEMPRE, no lugar do antigo "nada
// explica". Ela é montada dos três eixos e é obrigada a dizer algo acionável.
export function diagnosticoQueda(jogo, fim) {
  const e = jogo.estado;
  const destino = Number.isFinite(jogo.destino) ? jogo.destino : (fim?.destino ?? 0);
  const banda = jogo.banda || fim?.banda || bandaDe(destino);
  const guerras = (e.emGuerra || []).length;
  const conquistas = (e.conquistados || []).length;
  const anexados = Object.values(e.ocupacoes || {}).filter((o) => o?.anexado).length;

  // ── CULPADOS ─────────────────────────────────────────────────────────
  const culpados = [];
  if (num(e.aprovacao) <= 15) culpados.push({ k: 'Aprovação', v: `${num(e.aprovacao)}%`, txt: 'o povo deixou de te querer', peso: 3 });
  if (num(e.estabilidade) <= 20) culpados.push({ k: 'Estabilidade', v: `${num(e.estabilidade)}`, txt: 'as instituições rangeram até quebrar', peso: 3 });
  if (num(e.divida) >= 120) culpados.push({ k: 'Dívida', v: `${num(e.divida)}% do PIB`, txt: 'você hipotecou o país', peso: 2 });
  if (num(e.temp_guerra) >= 65) culpados.push({ k: 'Clima de guerra', v: `${num(e.temp_guerra)}`, txt: 'viveu em pé de guerra o tempo todo', peso: 2 });
  if (guerras >= 2) culpados.push({ k: 'Guerras abertas', v: `${guerras}`, txt: 'brigou com meio mundo ao mesmo tempo', peso: 2 });
  if (num(e.soft_power) <= 25) culpados.push({ k: 'Soft power', v: `${num(e.soft_power)}`, txt: 'ninguém mais atendia seu telefonema', peso: 1 });
  if (num(e.tesouro) <= 0.5) culpados.push({ k: 'Caixa', v: tri(e.tesouro), txt: 'o cofre secou', peso: 2 });
  culpados.sort((a, b) => b.peso - a.peso);

  // ── FEITOS ───────────────────────────────────────────────────────────
  // Mesma régua dos culpados, virada do avesso. Peso alto = manchete de legado.
  const feitos = [];
  if (destino >= 45) feitos.push({ k: 'Destino final', v: `${destino}/100`, txt: `a nação fecha a era como ${banda.nome}`, peso: 5 });
  if ((Number(e.territorio) || 1) > 1) feitos.push({ k: 'Território', v: `${e.territorio}`, txt: 'você redesenhou o mapa e obrigou o mundo a atualizar os atlas', peso: 5 });
  if (anexados > 0) feitos.push({ k: 'Anexações', v: `${anexados}`, txt: 'não só ocupou: incorporou, e a bandeira ficou', peso: 4 });
  else if (conquistas > 0) feitos.push({ k: 'Ocupações', v: `${conquistas}`, txt: 'manteve território estrangeiro sob sua bota até o fim', peso: 3 });
  if (num(e.aprovacao) >= 60) feitos.push({ k: 'Aprovação', v: `${num(e.aprovacao)}%`, txt: 'saiu com o povo ainda do seu lado — quase ninguém consegue isso', peso: 4 });
  if (num(e.estabilidade) >= 70) feitos.push({ k: 'Estabilidade', v: `${num(e.estabilidade)}`, txt: 'entregou instituições de pé, o ativo mais caro de qualquer país', peso: 3 });
  if (num(e.soft_power) >= 65) feitos.push({ k: 'Soft power', v: `${num(e.soft_power)}`, txt: 'o mundo te ouvia antes de você precisar levantar a voz', peso: 3 });
  if (Number(e.tesouro) >= 3) feitos.push({ k: 'Tesouro', v: tri(e.tesouro), txt: 'deixou o cofre cheio para quem vier depois', peso: 3 });
  if (Number(e.pib) >= 30) feitos.push({ k: 'PIB', v: tri(e.pib), txt: 'a economia terminou maior do que você encontrou', peso: 3 });
  if (num(e.divida) <= 90) feitos.push({ k: 'Dívida', v: `${num(e.divida)}% do PIB`, txt: 'governou sem hipotecar as próximas gerações', peso: 2 });
  if (guerras === 0 && num(e.temp_guerra) <= 35) feitos.push({ k: 'Paz', v: 'sem guerras abertas', txt: 'atravessou a era sem mandar uma geração para o abate', peso: 3 });
  if (num(e.ogivas) > 0) feitos.push({ k: 'Arsenal', v: `${num(e.ogivas)} ogivas`, txt: 'ninguém invade quem pode responder', peso: 2 });
  if (num(e.seguranca) >= 70) feitos.push({ k: 'Segurança', v: `${num(e.seguranca)}`, txt: 'o país dormia tranquilo, e isso aparece em tudo', peso: 2 });
  feitos.sort((a, b) => b.peso - a.peso);

  // ── LACUNAS + VIGÍLIA ────────────────────────────────────────────────
  const lacunas = lacunasDeDestino(e, destino).slice(0, 3);
  const prox = proximaBanda(destino);
  const vigilia = resumoVigilia(e);

  return {
    tipo: fim?.tipo || 'derrota',
    nivel: fim?.nivel || null,
    causaRot: CAUSA_ROT[fim?.causa]?.rot || (fim?.tipo === 'vitoria' ? 'REINADO ENCERRADO' : fim?.tipo === 'legado' ? 'BALANÇO DA DÉCADA' : 'FIM DE LINHA'),
    causaDica: CAUSA_ROT[fim?.causa]?.dica || '',
    culpados: culpados.slice(0, 4),
    feitos: feitos.slice(0, 6),
    lacunas,
    vigilia,
    explicacao: montarExplicacao({ fim, destino, banda, prox, culpados, feitos, lacunas, vigilia }),
    proxima: prox,
    destino,
    banda,
    conquistas,
    anexados,
    guerras,
    meses: jogo.turno || 0,
  };
}

// A frase que a UI imprime SEMPRE. Regra de ouro: nunca dizer "nada explica".
// Se houve culpado, ela aponta o culpado e há quanto tempo ele estava lá. Se não
// houve, ela vira coaching honesto: quantos pontos faltaram e onde estavam.
function montarExplicacao({ fim, destino, banda, prox, culpados, feitos, lacunas, vigilia }) {
  const alvo = prox.proxima;
  const ondeFaltou = lacunas.length
    ? lacunas.map((l) => `${l.k.toLowerCase()} em ${l.v} (valia até +${l.ganho} de Destino)`).join(', ')
    : '';

  // Deposto: a causa é dura e conhecida — o valor aqui é o TEMPO e o socorro.
  if (fim?.tipo === 'derrota' && fim?.causa !== 'colapso') {
    const principal = vigilia[0];
    const base = principal
      ? `${principal.rot} estava no vermelho há ${principal.meses} ${principal.meses === 1 ? 'mês' : 'meses'} antes do fim.`
      : 'A queda veio do indicador que zerou — não há registro de por quanto tempo ele vinha se arrastando, então esta é a leitura do momento.';
    return `${base}${principal ? ` O que teria segurado: ${principal.socorro}.` : ''}${ondeFaltou ? ` Fora isso, o que mais pesava contra a nação: ${ondeFaltou}.` : ''}`;
  }

  if (fim?.causa === 'colapso') {
    return `Não foi um indicador: foi a nação inteira abaixo da linha d'água, Destino em ${destino}/100.${ondeFaltou ? ` O que estava mais longe de aceitável: ${ondeFaltou}.` : ''} Recuperar isso exigia parar de agir em três frentes ao mesmo tempo e reconstruir uma delas até o fim.`;
  }

  if (fim?.tipo === 'vitoria') {
    return `Destino ${destino}/100. Não há o que explicar: você fechou o tabuleiro.${feitos.length ? ` O que sustentou o império: ${feitos.slice(0, 3).map((f) => `${f.k.toLowerCase()} ${f.v}`).join(', ')}.` : ''}`;
  }

  // FIM DE ERA — o caso que gerou esta reforma. Aqui o jogador NÃO caiu: ele
  // terminou. O texto tem de ser um balanço, e a única cobrança legítima é
  // aritmética — quantos pontos faltavam e em quais alavancas eles estavam.
  const construiu = feitos.length
    ? `Você terminou como ${banda.nome} (Destino ${destino}/100) com ${feitos.slice(0, 3).map((f) => `${f.k.toLowerCase()} em ${f.v}`).join(', ')}.`
    : `Você terminou como ${banda.nome}, com Destino em ${destino}/100.`;
  const subir = alvo
    ? ` Para chegar a ${alvo.nome} faltaram ${prox.faltam} pontos de Destino${ondeFaltou ? `, e eles estavam aqui: ${ondeFaltou}` : ''}.`
    : ' Acima desta faixa só existe o trono, e ele estava ao alcance da mão.';
  const cobranca = culpados.length
    ? ` O que puxou para baixo até o último mês: ${culpados.slice(0, 2).map((c) => `${c.k.toLowerCase()} ${c.v}`).join(' e ')}.`
    : '';
  return `${construiu}${subir}${cobranca}`;
}

// ── OS TEXTOS PARA PUBLICAR — breaking news e o post do X ──────────────
// O dono quer o motivo da queda NA CARA do jogador, e não só na tela final: ele
// tem de vazar no plantão e no X, como vazaria na vida real. A publicação é da UI
// (ui/jogo.js); aqui mora só a escrita, para as duas vozes ficarem coerentes com o
// diagnóstico em vez de cada tela inventar a sua versão do mesmo governo.
//
// `alvo` aceita o objeto do jogo (com .estado e .ficha) ou o estado cru — a UI já
// chama estas funções dos dois jeitos em pontos diferentes do código.
export function textosDaQueda(alvo, fim, diag) {
  const jogo = alvo?.estado ? alvo : { estado: alvo || {}, ficha: alvo?.ficha || {} };
  const e = jogo.estado || {};
  const pais = jogo.ficha?.pais || 'a nação';
  const nome = jogo.ficha?.presidente || 'O presidente';
  const d = diag || { culpados: [], feitos: [], vigilia: [], lacunas: [], destino: 0, banda: { nome: '—' }, meses: 0, explicacao: '' };
  const principal = d.culpados?.[0];
  const vig = d.vigilia?.[0];
  const feito = d.feitos?.[0];
  const anos = Math.max(1, Math.round((d.meses || 0) / 12));

  // O MOTIVO CURTO: uma linha, sem enfeite. Serve de subtítulo, de tooltip e de
  // aviso na sala online — em todo lugar onde não cabe um parágrafo.
  let motivoCurto;
  if (fim?.tipo === 'legado') {
    motivoCurto = `Fim da era: ${pais} encerra a década como ${d.banda?.nome} (Destino ${d.destino}/100).`;
  } else if (fim?.tipo === 'vitoria') {
    motivoCurto = `${pais} fecha o tabuleiro: Destino ${d.destino}/100 e nenhum rival de pé.`;
  } else if (vig) {
    motivoCurto = `${vig.rot} no vermelho há ${vig.meses} ${vig.meses === 1 ? 'mês' : 'meses'} — e ninguém puxou o freio.`;
  } else if (principal) {
    motivoCurto = `${principal.k} em ${principal.v}: ${principal.txt}.`;
  } else {
    motivoCurto = fim?.motivo ? `Causa: ${fim.motivo}.` : 'O governo acabou antes das explicações.';
  }

  // A MANCHETE DE PLANTÃO: voz de emissora, caixa alta no gancho, fato depois.
  let manchete;
  if (fim?.tipo === 'legado') {
    manchete = `PLANTÃO · FIM DE UMA ERA: ${nome} entrega ${pais} depois de ${anos} ano${anos > 1 ? 's' : ''} — ${d.banda?.nome}, Destino ${d.destino}/100${feito ? `, ${feito.k.toLowerCase()} em ${feito.v}` : ''}. A década tem dono e agora tem balanço.`;
  } else if (fim?.tipo === 'vitoria') {
    manchete = `PLANTÃO · ${String(pais).toUpperCase()} NO TOPO DO MUNDO: ${nome} encerra o reinado com Destino ${d.destino}/100. As demais capitais convocam reuniões de emergência para discutir o que fazer com isso.`;
  } else {
    manchete = `URGENTE · ${String(nome).toUpperCase()} CAI: ${fim?.titulo || 'governo encerrado'} em ${pais}. Motivo apurado: ${motivoCurto}${principal ? ` Nos últimos meses, ${principal.k.toLowerCase()} marcava ${principal.v}.` : ''}`;
  }

  // O POST DO X: a voz que ninguém edita. Ácido com quem afundou o país; seco e
  // respeitoso — nunca bajulador — com quem entregou uma nação de pé.
  let postX; let handle;
  if (fim?.tipo === 'legado') {
    const alto = ['imperio', 'triunfo', 'solido'].includes(d.nivel);
    handle = alto ? '@MesaRedondaBR' : '@PautaLivre';
    postX = alto
      ? `acabou a era de ${nome}. ${pais} sai ${d.banda?.nome}, destino ${d.destino}/100. dá pra discordar de cada decisão e ainda assim admitir: o país que ele devolveu é maior do que o que ele pegou. isso é raro o suficiente pra registrar.`
      : `${nome} chega ao fim do mandato sem ser derrubado, o que já é currículo. ${pais} termina ${d.banda?.nome}, destino ${d.destino}/100.${d.proxima?.proxima ? ` faltaram ${d.proxima.faltam} pontos pra virar ${d.proxima.proxima.nome} — e a fila de desculpas já começou a se formar.` : ''}`;
  } else if (fim?.tipo === 'vitoria') {
    handle = '@MesaRedondaBR';
    postX = `então é isso. ${nome} terminou com destino ${d.destino}/100 e o resto do planeta virou nota de rodapé no próprio noticiário. daqui a dez anos vão jurar que sempre apoiaram.`;
  } else {
    handle = '@PautaLivre';
    postX = vig
      ? `${nome} caiu e o gabinete finge surpresa. ${vig.rot.toLowerCase()} estava no vermelho há ${vig.meses} ${vig.meses === 1 ? 'mês' : 'meses'}. ninguém foi pego de surpresa — foi todo mundo pego fingindo que não via.`
      : principal
        ? `${nome} caiu com ${principal.k.toLowerCase()} em ${principal.v}. ${principal.txt}. e ainda teve gente no palanque chamando isso de projeto de nação.`
        : `${nome} caiu. ${d.explicacao || 'o governo acabou antes das explicações.'} a Máquina embaralha as cartas e o próximo já está prometendo as mesmas coisas.`;
  }

  // O VEREDITO: a linha única do selo de legado, no lugar do antigo ternário da UI
  // que mandava todo fim de era para "Esquecido. Nem herói, nem vilão".
  const veredito = vereditoDe(fim, d, e);

  return { manchete, postX, motivoCurto, veredito, handle };
}

function vereditoDe(fim, d, e) {
  if (fim?.tipo === 'vitoria') return 'Imperador. O mapa mudou de dono e o dono é você.';
  if (fim?.tipo === 'legado') {
    if (d.nivel === 'imperio' || d.nivel === 'triunfo') return 'Hegemon. A era leva o seu nome e o próximo governo vai gastar o mandato inteiro sendo comparado a você.';
    if (d.nivel === 'solido') return 'Construtor. Recebeu um país e devolveu uma potência — inteira, e com o dono ainda de pé.';
    if (d.nivel === 'respeitavel') return 'Estadista. Nem conquistou o mundo, nem deixou o mundo te conquistar: entregou uma nação dona de si.';
    if (d.nivel === 'modesto') return 'Guardião. Segurou o país firme na própria região por uma década inteira, e isso não é pouco — só não é tudo.';
    return 'Sobrevivente. Governou a década toda sem ser derrubado, num país que passou a maior parte dela pedindo socorro.';
  }
  if (Number(e.aprovacao) <= 5) return 'Deposto. O povo que te aplaudiu foi o mesmo que te arrancou da cadeira.';
  if (Number(e.divida) >= 200) return 'Quebrado. Você tinha o maior PIB do planeta e ainda assim deixou a conta na mesa.';
  if (Number(e.estabilidade) <= 5) return 'Rachado. O país se partiu na sua mão e cada pedaço passou a mandar em si mesmo.';
  return 'Interrompido. Havia um projeto ali — ele só não sobreviveu ao próprio governo.';
}

// ── O OBITUÁRIO — a IA escreve o necrológio político ──────────────────
export async function obituarioDaQueda(jogo, fim, diag) {
  const e = jogo.estado;
  const vitoria = fim?.tipo === 'vitoria';
  const manchetes = (jogo.feed || []).filter((p) => p.manchete || p.texto).slice(0, 8)
    .map((p) => `- ${String(p.manchete || p.texto).slice(0, 120)}`).join('\n');

  // ── TRÊS PROMPTS, PORQUE SÃO TRÊS HISTÓRIAS ─────────────────────────
  // BUG QUE ISTO CONSERTA (o dono colou o texto): "Franklin P. Vane governou os
  // Estados Unidos por 120 MESES e saiu pela porta dos fundos". Cento e vinte meses é
  // a década inteira — aquele governo não caiu, ele TERMINOU. Havia só dois prompts
  // (venceu / não venceu), e tudo que não era império recebia o necrológio de deposto.
  // Quem entregou o mandato no prazo levava um texto de derrubado.
  //
  // Agora o fim de era tem voz própria: nem triunfo, nem execução — balanço. É a mesma
  // correção que `tomDoFim` fez no visual, aplicada ao texto.
  const system = vitoria
    ? 'Você é um colunista político veterano escrevendo o RETRATO FINAL de um governante que terminou o mandato no topo. Tom: irônico, elegante, com admiração relutante — elogio que ainda alfineta. 3 parágrafos curtos. Português do Brasil. Sem emoji, sem títulos, sem aspas na abertura. Devolva só o texto.'
    : fim?.tipo === 'legado'
      ? 'Você é um colunista político veterano escrevendo o BALANÇO DE UMA DÉCADA de governo que chegou ao fim NO PRAZO — o governante NÃO foi deposto, NÃO caiu, NÃO fugiu: ele cumpriu o mandato inteiro e entregou o cargo. NUNCA use imagens de queda, fuga, porta dos fundos, deposição ou sucessor apressado. Tom: seco, adulto, sem bajulação e sem deboche — reconhece o que foi construído e cobra o que ficou pendente, sempre com os números que te derem. 3 parágrafos curtos. Português do Brasil. Sem emoji, sem títulos, sem aspas na abertura. Devolva só o texto.'
      : 'Você é um colunista político mordaz escrevendo o OBITUÁRIO POLÍTICO de um governante que acabou de cair. Tom: sarcástico e cruel na medida, com humor negro e frases curtas que doem — mas ancorado nos NÚMEROS que te derem. Nada de clichê motivacional. 3 parágrafos curtos. Português do Brasil. Sem emoji, sem títulos, sem aspas na abertura. Devolva só o texto.';

  const user = `Governante: ${jogo.ficha?.presidente || 'O presidente'} — país: ${jogo.ficha?.pais}.
Desfecho oficial: ${fim?.titulo} (${fim?.tipo}). Causa formal: ${diag.causaRot} (${diag.causaDica}).
Tempo no poder: ${diag.meses} meses. Destino final: ${jogo.destino}/100 (${jogo.banda?.nome || '—'}).
Números do fim: aprovação ${Math.round(e.aprovacao)}%, estabilidade ${Math.round(e.estabilidade)}, dívida ${Math.round(e.divida)}% do PIB, tesouro US$ ${Number(e.tesouro || 0).toFixed(2)} tri, PIB ${Number(e.pib || 0).toFixed(1)} tri, soft power ${Math.round(e.soft_power)}, clima de guerra ${Math.round(e.temp_guerra)}.
Guerras abertas: ${(e.emGuerra || []).length}. Territórios ocupados: ${diag.conquistas}. Países anexados: ${diag.anexados}.
O que mais pesou: ${diag.culpados.map((c) => `${c.k} ${c.v} (${c.txt})`).join('; ') || 'nada em particular — apenas o tempo'}.
Manchetes do reinado:
${manchetes || '- (o noticiário mal registrou este governo)'}

Escreva o texto final sobre a queda/encerramento deste governo.`;

  try {
    const { texto } = await chamarIA({ system, user, temperature: 1, jsonMode: false, maxTokens: 520 });
    const limpo = String(texto || '').trim().replace(/^["']|["']$/g, '');
    return limpo.length > 40 ? limpo : fallbackObituario(jogo, fim, diag);
  } catch { return fallbackObituario(jogo, fim, diag); }
}

// ── O FALLBACK, AGORA VINDO DO BANCO ──────────────────────────────────
// Sem IA (desligada, sem cota, fora do ar) o jogador AINDA recebe uma narrativa com
// personalidade — e a última tela da partida não pode ser a que denuncia que a IA
// caiu. Antes eram dois textos fixos escritos aqui; agora são três famílias × 3
// aberturas × 3 meios × 3 fechos em `dados/copyFim.js`, sorteados por uma semente da
// partida. Vinte e sete combinações por família, e nenhuma frase de queda alcançando
// quem terminou o mandato.
function fallbackObituario(jogo, fim, diag) {
  const e = jogo.estado || {};
  const situacao = situacaoDoFim({
    tipo: fim?.tipo, nivel: fim?.nivel, aprovacao: e.aprovacao, divida: e.divida,
    estabilidade: e.estabilidade, guerras: (e.emGuerra || []).length,
  });
  return obituarioLocal(situacao, {
    nome: jogo.ficha?.presidente || 'O presidente',
    pais: jogo.ficha?.pais || 'a nação',
    meses: diag.meses,
    destino: jogo.destino,
    causa: diag.causaDica || 'o próprio governo',
    principal: diag.culpados?.[0] || null,
    feito: diag.feitos?.[0] || null,
    conquistas: diag.conquistas || 0,
    semente: `${e.iso}|${jogo.ficha?.presidente}|${diag.meses}|${jogo.destino}`,
  });
}
