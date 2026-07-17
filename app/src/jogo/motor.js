// O CONTROLADOR DO JOGO. Amarra Máquina (IA), Fios, Estado, Economia, Destino e Ações.
// A UI conversa só com isto.
//
// LOOP DE UM TURNO:
//   fase 'planejamento' → jogador enfileira N ações (custam tesouro + PA)
//   passarTurno()       → resolve as ações (dado) → a Máquina lança um acontecimento
//   fase 'carta'        → jogador decide a crise
//   resolverCarta()     → aplica a decisão → FECHA o turno (economia, destino) → próximo
import { criarEstado, PA_POR_TURNO } from './estado.js';
import { aplicarEfeitos, checarFim } from './efeitos.js';
import { aplicarFluxo, calcularFluxo } from './economia.js';
import { precisaDecidir as criseFiscalPendente } from './fiscal.js';
import { calcularDestino, bandaDe, checarDestino } from './destino.js';
import { aplicarPolitico, rotuloPolitico } from './politico.js';
import { resolverFila } from './acoes.js';
import { tickMundo, tickReconquista } from './mundo.js';
import { snapshotIndice } from './indiceMundial.js';
import { temaDoTurno, reacoesSociais } from '../dados/opiniao.js';
import { tickForcasMundo } from './forcasMundo.js';
import { tickEspionagem, mancheteVazamento, investirEspionagem } from './espionagem.js';
import { PAISES } from '../dados/paises.js';
import { sortearAgressao, resolverAgressao, duracaoMobilizacao, chanceDeteccao } from './agressao.js';
import { idsDesbloqueados, novasDesbloqueadas } from './desbloqueios.js';
import { prepararContexto, gerarTurno } from '../maquina/gerador.js';
import { criarFio, atualizarFios, anotarNoFio } from '../maquina/fios.js';
import { cumpreRequisito } from '../maquina/validador.js';
import { espacoSoldados, tetoSoldados, reservaInicial } from '../dados/efetivoMilitar.js';
import { aplicarForcas, UNIDADE_POR_ID } from '../dados/forcas.js';
import { ACAO_POR_ID } from '../dados/acoes.js';
import { descontoMilitar } from '../dados/blocos.js';
import { criarPresidente } from '../dados/lideres.js';
import { lucroDoTurno, bonusDoTurno, descontoIndustrial } from '../dados/empresas.js';
import { empresasDoPais } from '../dados/registro.js';
import { sincronizarPetroleo, tickPreco, manchetePreco } from './petroleo.js';
import { fluxoPetroleo, impactoPreco } from '../dados/petroleo.js';
import { bonusBases } from '../dados/bases.js';
import { resolverPedidos } from './compras.js';
import { salvarPartida } from './save.js';
import { tickGeografia } from './geografia.js';
import { tickMundoVivo, semearMundoVivo } from './mundoVivo.js';
import { aplicarAcaoPandemia } from './pandemiaAcoes.js';
import { tentarIntervencao } from './intervencaoConflito.js';
import { processarOperacoes } from './ofensiva.js';
import { resolverPedidoDePaz, sairDaGuerra } from './paz.js';
import { mancheteDaInvasao } from './agressao.js';
import { VEICULO_POR_NOME, tomDaCobertura } from '../dados/veiculos.js';
import { decairSimpatiaLista } from '../dados/imprensa.js';
import { VARS } from './vars.js';

const ERA_TURNO_MAX = 120; // agora cada batida é 1 MÊS → 120 meses = uma DÉCADA no poder
function round2(n) { return Math.round(n * 100) / 100; }

export class Jogo {
  constructor({ ficha, elenco, veiculos, presidente, saveRestaurado }) {
    // O jogador assina com o próprio nome. Se não assinar, herda o líder fictício
    // da ficha. Este nome viaja pra IA e sai nas manchetes — é o jogador dentro da ficção.
    this.ficha = presidente ? { ...ficha, presidente } : ficha;
    ficha = this.ficha;
    this._saveRestaurado = saveRestaurado || null;
    this.elenco = elenco;
    this.veiculos = veiculos;

    // Continuar partida: o estado inteiro vem do save (JSON puro — a mesma coisa
    // que um dia chega pela rede). Senão, cria do zero pela ficha.
    this.estado = this._saveRestaurado?.estado || criarEstado(ficha);
    // Save antigo (anterior aos soldados/reserva): reconstitui a reserva sem quebrar nada.
    if (this.estado.reservaMilitar == null) this.estado.reservaMilitar = reservaInicial(this.estado.iso || ficha.iso || 'USA');
    this.fios = (ficha.fiosSemente || []).map(criarFio);
    this.turno = this._saveRestaurado?.turno || 0;
    this.eraTurnoMax = ERA_TURNO_MAX;
    this.fase = 'planejamento';
    this.fila = [];
    this.feed = this._saveRestaurado?.feed || [];
    this.historico = [];
    this.ultimaAcao = null;
    this.acoesResumo = null;
    this.ultimoFioId = null;
    this.cartaAtual = null;
    this.fioTemaAtual = null;
    this._pendente = null;

    // Você é o chefe de Estado — as manchetes citam o SEU nome.
    this.presidente = criarPresidente({ nome: ficha.presidente, isoCode: ficha.iso || 'USA' });
    // PRECEDÊNCIA: dados/paises/<iso>.js é a fonte única; empresas.js é fallback.
    this.empresas = this._saveRestaurado?.empresas || empresasDoPais(ficha.iso || 'USA');
    // A produção de petróleo NASCE das empresas: sua fatia na Exxon/SPR é o que você bombeia.
    sincronizarPetroleo(this.estado, this.empresas);
    semearMundoVivo(this.estado);   // o mundo já está em movimento antes do seu 1º clique
    this.systemContexto = prepararContexto({ ficha, elenco, veiculos });
    this._desbloq = idsDesbloqueados(this.estado);
    this.recomputar();
    this.iniciarTurno();
  }

  // Detecta novas ações desbloqueadas desde a última checagem (pra popup de surpresa).
  _checarDesbloqueios() {
    const depois = idsDesbloqueados(this.estado);
    const novas = novasDesbloqueadas(this._desbloq, depois);
    this._desbloq = depois;
    return novas;
  }

  personagem(id) { return this.elenco.find((p) => p.id === id) || null; }

  // Recalcula os valores derivados (Destino + rótulo político).
  recomputar() {
    this.destino = calcularDestino(this.estado);
    this.banda = bandaDe(this.destino);
    this.rotulo = rotuloPolitico(this.estado);
  }

  fluxoPreview() { return calcularFluxo(this.estado); }

  // Como cada jornal está te tratando agora (vai no prompt da IA e na HUD).
  imprensa() {
    return this.veiculos.map((v) => {
      const t = tomDaCobertura(v, this.estado);
      return { nome: v.nome, posicao: v.posicao, simpatia: v.simpatia ?? 50, tom: t.rot, valor: t.valor, cor: t.cor };
    });
  }

  // ── Fase de planejamento ─────────────────────────────────────────────
  iniciarTurno() {
    this.turno += 1;
    this.estado.pontos_acao = PA_POR_TURNO;
    this.fila = [];
    this.fase = 'planejamento';
  }

  // Custo efetivo: aliados fornecedores + sua própria base industrial dão desconto.
  custoDe(a) {
    let c = a?.custo || 0;
    if (a?.categoria === 'Militar' || a?.categoria === 'Arsenal') {
      const alianca = descontoMilitar(this.estado).fracao;
      const industria = descontoIndustrial(this.empresas);
      c = round2(c * (1 - Math.min(0.45, alianca + industria)));
    }
    return c;
  }

  podeEnfileirar(acaoId) {
    const a = ACAO_POR_ID[acaoId];
    if (!a) return { ok: false, motivo: 'ação inexistente' };
    if (this.estado.pontos_acao < a.custoPA) return { ok: false, motivo: 'sem pontos de ação' };
    if (this.estado.tesouro < this.custoDe(a)) return { ok: false, motivo: 'tesouro insuficiente' };
    if (!cumpreRequisito(a.requer, this.estado)) return { ok: false, motivo: 'requisito não atendido' };
    if ((a.recruta?.infantaria || a.forcas?.infantaria) && espacoSoldados(this.estado) <= 0) {
      return { ok: false, motivo: `efetivo no teto (${tetoSoldados(this.estado.iso || 'USA').toLocaleString('pt-BR')})` };
    }
    return { ok: true };
  }

  enfileirar(acaoId) {
    const pode = this.podeEnfileirar(acaoId);
    if (!pode.ok) return pode;
    const a = ACAO_POR_ID[acaoId];
    const custoPago = this.custoDe(a);
    this.estado.tesouro = round2(this.estado.tesouro - custoPago);
    this.estado.pontos_acao -= a.custoPA;
    this.fila.push({ acao: a, custoPago });
    return { ok: true };
  }

  // Enfileira uma ação avulsa (ex.: vinda do globo, direcionada a um país).
  enfileirarCustom(acao) {
    if (this.fase !== 'planejamento') return { ok: false, motivo: 'não é fase de planejamento' };
    if (this.estado.pontos_acao < acao.custoPA) return { ok: false, motivo: 'sem pontos de ação' };
    if (this.estado.tesouro < acao.custo) return { ok: false, motivo: 'tesouro insuficiente' };
    if (!cumpreRequisito(acao.requer, this.estado)) return { ok: false, motivo: 'requisito não atendido' };
    this.estado.tesouro = round2(this.estado.tesouro - acao.custo);
    this.estado.pontos_acao -= acao.custoPA;
    this.fila.push({ acao, custoPago: acao.custo });
    return { ok: true };
  }

  cancelar(index) {
    const item = this.fila[index];
    if (!item) return;
    this.estado.tesouro = round2(this.estado.tesouro + (item.custoPago ?? item.acao.custo ?? 0));
    this.estado.pontos_acao += item.acao.custoPA;
    this.fila.splice(index, 1);
  }

  // ── Passar o turno: resolve ações → Máquina lança acontecimento ───────
  async passarTurno({ signal } = {}) {
    // 1. resolve as ações enfileiradas (dado de RPG)
    const resultados = resolverFila(this.estado, this.fila, this.veiculos);
    this._empilharFeed(resultados.map((r) => this._acaoParaPost(r)));
    this._reagirAcoes(resultados); // ações grandes viram o tema do próximo acontecimento
    // OPINIÃO PÚBLICA: perfis com viés (esquerda/direita/populista/centrão) reagem às
    // suas ações. A mesma jogada vaia de um lado e aplaude do outro — é o cabo de guerra
    // do X. Templates fortes por país (a IA pode enriquecer por cima no gerarTurno).
    if (resultados.length) {
      const mudTurno = resultados.flatMap((r) => r.mudancas || []);
      const tema = temaDoTurno(resultados, mudTurno);
      const posts = reacoesSociais(this.estado.iso || 'USA', tema, this.ficha?.pais, this.turno);
      if (posts.length) this._empilharFeed(posts);
    }
    this.acoesResumo = this._resumoAcoes(resultados);
    this.recomputar();
    const desbloqueiosAcoes = this._checarDesbloqueios();

    // 2. a Máquina reage e lança um acontecimento
    const res = await gerarTurno({
      systemContexto: this.systemContexto,
      estado: this.estado,
      fios: this.fios,
      ultimaAcao: this.ultimaAcao,
      turno: this.turno,
      ultimoFioId: this.ultimoFioId,
      acoesResumo: this.acoesResumo,
      destino: this.destino,
      banda: this.banda,
      rotulo: this.rotulo,
      imprensa: this.imprensa(),
      // A reserva precisa saber quem é este país. Sem isto ela contava crise de
      // Chicago pra quem governa o Brasil.
      ficha: this.ficha,
      veiculos: this.veiculos,
      signal,
    });

    this.cartaAtual = res.carta;
    this.fioTemaAtual = res.fioTema;
    this._pendente = res;
    this._empilharFeed(res.feed);
    this.fase = 'carta';

    const opcoesDisponiveis = res.carta.opcoes.map((op) => ({
      ...op, bloqueada: !cumpreRequisito(op.requer_capacidade, this.estado),
    }));
    // `diagnostico` sobe junto: era o log do gerador que morria aqui. Quem consome
    // (a UI) agora pode dizer ao jogador POR QUE a carta veio da reserva.
    return {
      resultados, carta: res.carta, opcoesDisponiveis, origem: res.origem,
      desbloqueios: desbloqueiosAcoes, diagnostico: res.log || [],
    };
  }

  // ── Resolver a crise e FECHAR o turno ────────────────────────────────
  resolverCarta(indiceOpcao) {
    const carta = this.cartaAtual;
    const op = carta?.opcoes[indiceOpcao];
    if (!op) throw new Error('Opção inválida.');

    const mudancas = aplicarEfeitos(this.estado, op.efeitos);
    aplicarPolitico(this.estado, op.politico);

    if (this.fioTemaAtual) {
      anotarNoFio(this.fios.find((f) => f.id === this.fioTemaAtual.id),
        `t${this.turno}: "${carta.titulo}" → "${op.texto}"`);
    }
    this.fios = atualizarFios({
      fios: this.fios, fioTema: this.fioTemaAtual,
      efeitoNoFio: op.efeito_no_fio, fiosUpdate: this._pendente?.fios_update, turno: this.turno,
    });

    this.ultimaAcao = `${carta.titulo} → "${op.texto}"`;
    this.ultimoFioId = this.fioTemaAtual?.id || null;
    this.historico.push({ turno: this.turno, carta: carta.titulo, escolha: op.texto });
    this._empilharFeed(this._reacaoParaPosts(op.reacao_feed));

    // FECHAMENTO DO TURNO
    // 1) PETRÓLEO PRIMEIRO — o preço tem de estar formado antes de a economia fechar,
    //    porque é ele que decide se a linha de energia é receita ou hemorragia.
    const petro = this._fecharPetroleo();

    // 2) OS FORNECEDORES RESPONDEM. Vem antes da economia porque um pedido negado
    //    devolve dinheiro ao caixa, e o caixa precisa estar certo antes de fechar.
    const respostas = resolverPedidos(this.estado);
    for (const r of respostas) {
      this._empilharFeed([{
        tipo: 'sistema', handle: 'Aquisições', texto: r.texto,
        cor: r.ok ? '#22e0a0' : '#ff3b5c',
      }]);
    }

    // 3) economia + destino
    const economia = aplicarFluxo(this.estado);
    // AS EMPRESAS PAGAM: lucro no caixa + bônus estruturais proporcionais à sua fatia.
    // Petroleira lucra conforme o barril — por isso o estado vai junto.
    const lucroEmp = lucroDoTurno(this.empresas, this.estado);
    if (lucroEmp) this.estado.tesouro = round2(this.estado.tesouro + lucroEmp);
    const bonusEmp = bonusDoTurno(this.empresas);
    if (Object.keys(bonusEmp).length) aplicarEfeitos(this.estado, bonusEmp);
    // Presença global: cada base é um par de olhos a mais no planeta.
    const bBases = bonusBases(this.estado);
    if (bBases.inteligencia) aplicarEfeitos(this.estado, bBases);
    economia.lucroEmpresas = lucroEmp;
    economia.petro = petro;
    // GEOGRAFIA: o pedágio dos estreitos que você controla. Dinheiro que vem do
    // MAPA, não do exército — quem senta em Ormuz cobra de quem não tem alternativa.
    const eventosGeo = tickGeografia(this.estado);
    for (const e of eventosGeo) {
      this._empilharFeed([{ tipo: 'sistema', handle: 'Estreitos', texto: e.texto,
        cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'bom' ? '#22e0a0' : '#7488ad' }]);
    }
    // Decai a imprensa DESTA partida (a que a IA lê e a UI mostra). Antes chamava
    // decairSimpatia(), que só sabe iterar o catálogo global de veiculos.js — então a
    // simpatia que a partida usa nunca decaía, e a que decaía ninguém via.
    decairSimpatiaLista(this.veiculos);
    // O MUNDO SE MOVE: insurgência, rivais rearmando, relações derivando
    const eventosMundo = tickMundo(this.estado);
    // Tropa emprestada volta pra casa quando o prazo acaba. Sem isto, o boost de uma
    // coalizão seria eterno e duas guerras bastariam pra inflar o mapa inteiro.
    for (const t of tickForcasMundo(this.estado)) {
      this._empilharFeed([{ tipo: 'sistema', handle: 'Mundo', texto: t, cor: '#7488ad' }]);
    }
    // O MUNDO VIVO: guerras entre NPCs, pactos, pandemias — com ou sem você.
    // Os `visual` de cada evento voltam pra UI animar no globo.
    const eventosVivos = tickMundoVivo(this.estado);
    for (const e of eventosVivos) {
      this._empilharFeed([{
        tipo: 'sistema', handle: 'Mundo', texto: e.texto,
        cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'aviso' ? '#ffb020' : e.tom === 'bom' ? '#22e0a0' : '#7488ad',
      }]);
    }
    this._empilharFeed(eventosMundo.map((e) => ({
      tipo: 'sistema', handle: 'Mundo', texto: e.texto,
      cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'aviso' ? '#ffb020' : e.tom === 'bom' ? '#22e0a0' : '#7488ad',
    })));
    // RECONQUISTA: a Máquina tenta retomar o que você tomou e não guarneceu. Os avisos
    // vão pro feed com a cor do Estado-Maior; os eventos de VIRADA (novo conflito ou
    // território perdido) viram TOAST na área do globo — o dono pediu esse alarme.
    const eventosRec = tickReconquista(this.estado);
    this.estado._toastsGlobo = this.estado._toastsGlobo || [];
    for (const e of eventosRec) {
      this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: e.texto,
        cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'aviso' ? '#ffb020' : '#22e0a0' }]);
      if (e.novoConflito || e.perdaEstado) {
        this.estado._toastsGlobo.push({
          tom: e.perdaEstado ? 'perda' : 'conflito', estadoId: e.estadoId,
          nome: e.estadoNome, por: e.por,
          titulo: e.perdaEstado ? 'TERRITÓRIO PERDIDO' : 'RECONQUISTA EM CURSO',
          texto: e.perdaEstado
            ? `${e.estadoNome} voltou às mãos de ${e.porNome}.`
            : `${e.porNome} avança sobre ${e.estadoNome}. Reforce antes que caia.`,
        });
      }
    }
    // ── ALGUÉM PODE TE INVADIR ───────────────────────────────────────
    // A metade que faltava da guerra: até aqui, 100% dos conflitos do jogador começavam
    // com ele clicando em "lançar ofensiva". Agora o mundo tem iniciativa — e é aqui que
    // a coalizão de defesa (o BRICS respondendo por você) finalmente acontece.
    const invasao = this._checarInvasao();

    this.recomputar();
    const desbloqueios = this._checarDesbloqueios();

    const fim = checarDestino(this.estado, this.destino, this.turno, this.eraTurnoMax)
      || checarFim(this.estado);

    // A dívida não encerra mais a partida — ela CONVOCA uma decisão. Só cobramos
    // isso de quem continua no jogo: quem já perdeu não precisa escolher entre
    // austeridade e calote.
    const criseFiscal = !fim && criseFiscalPendente(this.estado);

    this.cartaAtual = null;
    if (fim) { this.fase = 'fim'; this.fim = fim; }
    else this.iniciarTurno();

    // Fotografa o ÍNDICE MUNDIAL pro Δ do próximo turno (quem subiu/caiu no ranking).
    snapshotIndice(this.estado);

    // AUTOSAVE por turno: o estado é JSON puro, salvar é barato. É a rede de
    // segurança do jogador e o ensaio geral da sincronização online.
    salvarPartida(this);

    return { mudancas, economia, destino: this.destino, banda: this.banda, rotulo: this.rotulo, fim, criseFiscal, desbloqueios, eventosMundo, eventosVivos, petro, invasao };
  }

  // ═══════════════════════════════════════════════════════════════════
  // MODO TEMPO REAL — o mundo anda sozinho num relógio, sem "passar turno"
  // ═══════════════════════════════════════════════════════════════════
  // `beatMundo()` é a "batida do mundo": a metade de fechamento do turno (economia,
  // mundo vivo, invasão, petróleo…) rodando num timer, SEM a carta de crise e SEM
  // resolver a fila (as ações resolvem sozinhas quando o tempo delas acaba). Uma batida
  // conta como um "turno" pro resto do sistema (fios, ids, era). Devolve o que mudou pra
  // a UI reagir (toasts, feed, fim de jogo).
  beatMundo() {
    const petro = this._fecharPetroleo();
    for (const r of resolverPedidos(this.estado)) this._empilharFeed([{ tipo: 'sistema', handle: 'Aquisições', texto: r.texto, cor: r.ok ? '#22e0a0' : '#ff3b5c' }]);
    const economia = aplicarFluxo(this.estado);
    const lucroEmp = lucroDoTurno(this.empresas, this.estado);
    if (lucroEmp) this.estado.tesouro = round2(this.estado.tesouro + lucroEmp);
    const bonusEmp = bonusDoTurno(this.empresas);
    if (Object.keys(bonusEmp).length) aplicarEfeitos(this.estado, bonusEmp);
    const bBases = bonusBases(this.estado);
    if (bBases.inteligencia) aplicarEfeitos(this.estado, bBases);
    economia.lucroEmpresas = lucroEmp; economia.petro = petro;
    for (const e of tickGeografia(this.estado)) this._empilharFeed([{ tipo: 'sistema', handle: 'Estreitos', texto: e.texto, cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'bom' ? '#22e0a0' : '#7488ad' }]);
    decairSimpatiaLista(this.veiculos);
    const eventosMundo = tickMundo(this.estado);
    for (const t of tickForcasMundo(this.estado)) this._empilharFeed([{ tipo: 'sistema', handle: 'Mundo', texto: t, cor: '#7488ad' }]);
    const eventosVivos = tickMundoVivo(this.estado);
    for (const e of eventosVivos) this._empilharFeed([{ tipo: 'sistema', handle: 'Mundo', texto: e.texto, cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'aviso' ? '#ffb020' : e.tom === 'bom' ? '#22e0a0' : '#7488ad' }]);
    this._empilharFeed(eventosMundo.map((e) => ({ tipo: 'sistema', handle: 'Mundo', texto: e.texto, cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'aviso' ? '#ffb020' : e.tom === 'bom' ? '#22e0a0' : '#7488ad' })));
    // SINAIS SOCIAIS de pré-surto de pandemia: entram no X (feed) antes de a doença ser oficial.
    if (this.estado._pandemiaPosts?.length) { this._empilharFeed(this.estado._pandemiaPosts); this.estado._pandemiaPosts = []; }
    const eventosRec = tickReconquista(this.estado);
    this.estado._toastsGlobo = this.estado._toastsGlobo || [];
    for (const e of eventosRec) {
      this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: e.texto, cor: e.tom === 'ruim' ? '#ff3b5c' : e.tom === 'aviso' ? '#ffb020' : '#22e0a0' }]);
      if (e.novoConflito || e.perdaEstado) this.estado._toastsGlobo.push({ tom: e.perdaEstado ? 'perda' : 'conflito', estadoId: e.estadoId, nome: e.estadoNome, por: e.por, titulo: e.perdaEstado ? 'TERRITÓRIO PERDIDO' : 'RECONQUISTA EM CURSO', texto: e.perdaEstado ? `${e.estadoNome} voltou às mãos de ${e.porNome}.` : `${e.porNome} avança sobre ${e.estadoNome}. Reforce antes que caia.` });
    }
    const invasao = this._checarInvasao();
    const ofensivas = processarOperacoes(this.estado);   // MINHAS ofensivas que amadureceram (a UI resolve)
    this.turno += 1;                 // uma batida = um "turno" pro resto do sistema
    this.estado.turno = this.turno;  // mantém estado.turno em sincronia (espionagem, frotas, pedidos leem daqui)
    // ESPIONAGEM: tenta vazar segredos dos países que você espiona (intel esfria sozinha).
    for (const vz of tickEspionagem(this.estado)) {
      this._empilharFeed([{ tipo: 'sistema', handle: '🕵️ Inteligência', cor: '#b98cff', texto: mancheteVazamento(this.estado, vz.alvo, vz.tipo) }]);
      this.estado._toastsGlobo = this.estado._toastsGlobo || [];
      this.estado._toastsGlobo.push({ tom: 'intel', titulo: `VAZAMENTO · ${vz.def.rot}`, texto: mancheteVazamento(this.estado, vz.alvo, vz.tipo).replace(/^🕵️ VAZAMENTO · /, '') });
    }
    this.recomputar();
    const desbloqueios = this._checarDesbloqueios();
    const fim = checarDestino(this.estado, this.destino, this.turno, this.eraTurnoMax) || checarFim(this.estado);
    if (fim) { this.fase = 'fim'; this.fim = fim; }
    snapshotIndice(this.estado);
    salvarPartida(this);
    return { economia, eventosMundo, eventosVivos, invasao, ofensivas, fim, petro, destino: this.destino, banda: this.banda, desbloqueios };
  }

  // Resolve UMA ação na hora (quando o tempo dela acaba na fila do tempo real). Reusa o
  // resolvedor de fila com um item só, empilha o post, reage e gera repercussão social.
  executarAcaoTempo(acao, custoPago) {
    // ENCOMENDA DE ARSENAL: ação sintética criada pela ficha de equipamento ou
    // pelo mercado (produção nacional). O caixa já saiu ao enfileirar; aqui a
    // linha de produção TERMINA e o material entra na ordem de batalha. Soldados
    // respeitam o teto humano do país: entra só o que cabe (espacoSoldados).
    if (acao._compraArsenal) {
      const { unidadeId, qtd, nomeItem } = acao._compraArsenal;
      let entrega = qtd;
      if (unidadeId === 'infantaria') entrega = Math.max(0, Math.min(qtd, espacoSoldados(this.estado)));
      this.estado.forcas = this.estado.forcas || {};
      const mudancas = entrega > 0 ? aplicarForcas(this.estado.forcas, { [unidadeId]: entrega }) : [];
      const nome = nomeItem || UNIDADE_POR_ID[unidadeId]?.nome || unidadeId;
      const texto = entrega >= qtd
        ? `📦 Entrega: ${nome} ×${qtd.toLocaleString('pt-BR')} incorporado ao arsenal.`
        : entrega > 0
          ? `📦 Entrega parcial: ${nome} ×${entrega.toLocaleString('pt-BR')} incorporado — o teto de efetivo barrou o resto (${(qtd - entrega).toLocaleString('pt-BR')} dispensados).`
          : `📦 Entrega frustrada: ${nome} ×${qtd.toLocaleString('pt-BR')} chegou com o efetivo no teto — ninguém foi incorporado.`;
      this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Arsenal', texto, cor: entrega > 0 ? '#22e0a0' : '#ffb020' }]);
      this.recomputar();
      return { sucesso: true, acao, mudancas, entrega: { unidadeId, qtd: entrega } };
    }
    // PAZ / SAIR DA GUERRA: ação sintética diplomática. Resolve o pedido (aceito/recusado)
    // ou a saída unilateral; pode disparar contra-ataque do rival.
    if (acao._pazIso) {
      const r = acao._pazTipo === 'sair_guerra'
        ? sairDaGuerra(this.estado, acao._pazIso)
        : resolverPedidoDePaz(this.estado, acao._pazIso, acao._pazTermos);
      this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Chancelaria', texto: r.manchete, cor: (r.aceito || acao._pazTipo === 'sair_guerra') ? '#22e0a0' : '#ff3b5c' }]);
      if (r.contraAtaque) this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: mancheteDaInvasao(r.contraAtaque), cor: r.contraAtaque.repeliu ? '#ffb020' : '#ff3b5c' }]);
      this.recomputar();
      return { sucesso: r.aceito !== false, mudancas: r.mudancas || [], paz: r };
    }
    // ESPIONAGEM: injeta agentes contra um alvo — sobe o nível da rede (as chances de
    // vazamento sobem no tickEspionagem das próximas batidas). Um empurrão de inteligência.
    if (acao._espiaoIso) {
      const nivel = investirEspionagem(this.estado, acao._espiaoIso, acao._espiaoGanho || 25);
      aplicarEfeitos(this.estado, { inteligencia: 2 });
      const nomeAlvo = PAISES?.[acao._espiaoIso]?.nome || acao._espiaoIso;
      this._empilharFeed([{ tipo: 'sistema', handle: '🕵️ Inteligência', cor: '#b98cff', texto: `Rede de agentes reforçada contra ${nomeAlvo} (nível ${nivel}/100). Agora é esperar o vazamento — quanto maior a rede, maior a chance.` }]);
      this.recomputar();
      return { sucesso: true, mudancas: [], espionagem: { alvo: acao._espiaoIso, nivel } };
    }
    // MEDIAÇÃO DE GUERRA NPC: ação sintética que não resolve na fila comum — muta o
    // conflito e, se cruzar a meta, encerra a guerra.
    if (acao._conflitoId) {
      const r = tentarIntervencao(this.estado, acao._conflitoId, acao._frente);
      this._empilharFeed([{ tipo: 'sistema', handle: 'Diplomacia', texto: r.texto, cor: r.terminou ? '#22e0a0' : r.sucesso ? '#35e0ff' : '#7488ad' }]);
      this.recomputar();
      return { sucesso: !!r.sucesso, mudancas: [], intervencao: r };
    }
    const [resultado] = resolverFila(this.estado, [{ acao, custoPago: custoPago ?? acao.custo ?? 0 }], this.veiculos);
    // AÇÃO DE PANDEMIA: além dos efeitos genéricos (soft_power etc.), muta a doença-alvo.
    if (acao.pandemiaAlvo) {
      const r = aplicarAcaoPandemia(this.estado, acao.pandemiaAlvo, resultado.sucesso !== false);
      if (r?.texto) this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Saúde', texto: r.texto, cor: r.tom === 'bom' ? '#22e0a0' : r.tom === 'aviso' ? '#ffb020' : '#7488ad' }]);
    }
    this._empilharFeed([this._acaoParaPost(resultado)]);
    this._reagirAcoes([resultado]);
    const tema = temaDoTurno([resultado], resultado.mudancas || []);
    const posts = reacoesSociais(this.estado.iso || 'USA', tema, this.ficha?.pais, this.turno);
    if (posts.length) this._empilharFeed(posts);
    this.recomputar();
    return resultado;
  }

  // Alguém invadiu? Resolve, alimenta o feed e o fio, e conta pra Máquina — a invasão
  // tem de virar o assunto do próximo acontecimento, não uma linha perdida no feed.
  _checarInvasao() {
    const est = this.estado;
    est.mobilizacoes = est.mobilizacoes || [];
    // CALMARIA: se eu não estou em guerra nem ataquei ninguém neste turno, o mundo esfria
    // (o contador sobe e abaixa meu "risco"); atacar/estar em guerra zera.
    const euAgrediHoje = (est.minhasOfensivas || []).some((o) => o.turno === this.turno);
    est.turnosDeCalmaria = (est.emGuerra?.length || euAgrediHoje) ? 0 : (est.turnosDeCalmaria ?? 10) + 1;

    // 1) PROGRIDE as mobilizações em curso — a inteligência tenta flagrar; quando a
    //    contagem zera, o ataque acontece de verdade.
    for (const mob of est.mobilizacoes) {
      mob.restante -= 1;
      if (!mob.detectado && Math.random() < chanceDeteccao(est, mob)) {
        mob.detectado = true; mob.novoAviso = true;
        est._toastsGlobo = est._toastsGlobo || [];
        est._toastsGlobo.push({ tom: 'conflito', titulo: 'INTELIGÊNCIA', texto: `${mob.nome} está mobilizando forças contra você. Ataque em ~${Math.max(1, mob.restante)} ${Math.max(1, mob.restante) > 1 ? 'meses' : 'mês'}. Reforce a defesa.` });
        this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Inteligência', texto: `ALERTA: ${mob.nome} concentra tropas na nossa direção — ataque iminente.`, cor: '#ffb020' }]);
      }
    }
    const pronta = est.mobilizacoes.find((m) => m.restante <= 0);
    if (pronta) {
      est.mobilizacoes = est.mobilizacoes.filter((m) => m !== pronta);
      return this._resolverInvasao({ iso: pronta.iso, nome: pronta.nome, forca: pronta.forca, rel: pronta.rel, motivo: pronta.motivo });
    }

    // 2) NOVO agressor? Não ataca na hora — começa a se MOBILIZAR (a inteligência ganha
    //    uma janela pra detectar antes). Um agressor por vez.
    const agressor = sortearAgressao(est);
    if (agressor && !est.mobilizacoes.some((m) => m.iso === agressor.iso) && !est.emGuerra?.includes?.(agressor.iso)) {
      const total = duracaoMobilizacao(agressor);
      const mob = { iso: agressor.iso, nome: agressor.nome, forca: agressor.forca, rel: agressor.rel, motivo: agressor.motivo, total, restante: total, detectado: false, novoAviso: false };
      if (Math.random() < chanceDeteccao(est, mob)) {
        mob.detectado = true; mob.novoAviso = true;
        est._toastsGlobo = est._toastsGlobo || [];
        est._toastsGlobo.push({ tom: 'conflito', titulo: 'INTELIGÊNCIA', texto: `${mob.nome} iniciou uma mobilização militar na nossa direção. Ataque em ~${total} ${total > 1 ? 'meses' : 'mês'}.` });
        this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Inteligência', texto: `ALERTA: ${mob.nome} inicia mobilização militar — os satélites já veem o movimento.`, cor: '#ffb020' }]);
      }
      est.mobilizacoes.push(mob);
    }
    return null;
  }

  // Resolve de fato o ataque (quando a mobilização amadurece). Extraído pra ser reusado.
  _resolverInvasao(agressor) {
    const res = resolverAgressao(this.estado, agressor);

    const tema = `Guerra com ${agressor.nome}`;
    let fio = this.fios.find((f) => f.tema === tema);
    if (!fio) { fio = criarFio({ tema, intensidade: 100, alvo_pressao: 'seguranca', atores: [agressor.nome] }); this.fios.unshift(fio); }
    else fio.intensidade = 100;
    anotarNoFio(fio, `t${this.turno}: ${res.resumo}`);

    this._empilharFeed([{
      tipo: 'sistema', handle: '⚙ Estado-Maior',
      texto: `INVASÃO: ${agressor.nome} atacou nosso território. ${res.repeliu ? 'Repelida.' : 'Perdemos terreno.'}`,
      cor: res.repeliu ? '#ffb020' : '#ff3b5c',
    }]);
    if (res.apoios.length) {
      this._empilharFeed([{
        tipo: 'sistema', handle: '⚙ Chancelaria',
        texto: `Nossos aliados responderam: ${res.apoios.map((a) => `${a.nomeDe} (+${a.poder})`).join(', ')}.`,
        cor: '#22e0a0',
      }]);
    }
    // A Máquina PRECISA saber disto — é o acontecimento mais importante do turno.
    this.acoesResumo = `${this.acoesResumo && this.acoesResumo !== '(nenhuma)' ? `${this.acoesResumo} · ` : ''}${res.resumo}`;
    return res;
  }

  // ── internos ─────────────────────────────────────────────────────────

  // O TURNO DO PETRÓLEO, uma vez por turno:
  //   produção (empresas + espólio de guerra) → preço (medo do mundo) → impacto (inflação/aprovação)
  _fecharPetroleo() {
    sincronizarPetroleo(this.estado, this.empresas);
    semearMundoVivo(this.estado);   // o mundo já está em movimento antes do seu 1º clique
    const preco = tickPreco(this.estado);
    const fluxo = fluxoPetroleo(this.estado);
    // O topo lê isto pra mostrar a SETA (▲/▼) e o MOTIVO no hover do Brent. O motivo
    // mais forte (ruim > aviso > bom > neutro) é o que vale a manchete do barril.
    const ordemTom = { ruim: 3, aviso: 2, bom: 1, neutro: 0 };
    const motivoTop = (preco.motivos || []).slice().sort((a, b) => (ordemTom[b.tom] || 0) - (ordemTom[a.tom] || 0))[0];
    this.estado.brent_delta = preco.delta;
    this.estado.brent_motivo = motivoTop?.txt || '';
    // HISTÓRICO DO BARRIL — a listinha que o topo abre no clique. Só registra turno com
    // movimento real (|Δ|≥1) ou motivo forte; fila curta (últimos 12).
    if (Math.abs(preco.delta) >= 1 || (motivoTop && motivoTop.tom !== 'neutro')) {
      this.estado.brent_hist = this.estado.brent_hist || [];
      this.estado.brent_hist.unshift({ turno: this.turno, preco: Math.round(preco.preco), delta: preco.delta, motivo: motivoTop?.txt || '', tom: motivoTop?.tom || 'neutro' });
      this.estado.brent_hist = this.estado.brent_hist.slice(0, 12);
    }

    // Barril caro é gasolina cara é gente com raiva — se você depende de fora.
    const imp = impactoPreco(this.estado);
    if (imp.aprovacao || imp.pib) {
      aplicarEfeitos(this.estado, { aprovacao: imp.aprovacao, pib: imp.pib });
    }

    const m = manchetePreco(preco, fluxo);
    this._empilharFeed([{
      tipo: 'sistema', handle: 'Mercado de Energia', texto: m.texto,
      cor: m.tom === 'ruim' ? '#ff3b5c' : m.tom === 'aviso' ? '#ffb020' : m.tom === 'bom' ? '#22e0a0' : '#7488ad',
    }]);

    // O espólio precisa ser VISÍVEL: conquistar poço tem de aparecer no jornal.
    for (const e of this.estado.petroleo_espolio || []) {
      this._empilharFeed([{
        tipo: 'sistema', handle: 'Espólio de Guerra', cor: e.eficiencia > 60 ? '#22e0a0' : '#ffb020',
        texto: `${e.nome}: extraímos ${e.extraido} de ${e.bruto} Mb/d (${e.eficiencia}% de eficiência). ${
          e.eficiencia < 60 ? 'A insurgência sabota os dutos mais rápido do que consertamos.' : 'Os campos operam sob nossa administração.'}`,
      }]);
    }

    return { preco, fluxo, impacto: imp, manchete: m };
  }
  _empilharFeed(posts) {
    for (const p of posts || []) {
      // A lista viva da partida primeiro; o catálogo global só como rede (mesma
      // correção do renderFeed — a IA fala os nomes de imprensa.js, não os de veiculos.js).
      const v = p.veiculo ? (this.veiculos?.find((x) => x.nome === p.veiculo) || VEICULO_POR_NOME[p.veiculo]) : null;
      this.feed.unshift({ ...p, cor: v?.cor || p.cor || null, turno: this.turno });
    }
    if (this.feed.length > 80) this.feed.length = 80;
  }

  // Registra uma jogada no complexo econômico (investir/privatizar/estatizar).
  registrarEmpresa(t) {
    const txt = {
      investir: `${t.e.nome}: aporte de ${t.valor.toFixed(3)} tri. Valor de mercado sobe.`,
      privatizar: `${t.e.nome}: ${t.pct}% privatizados por ${t.valor.toFixed(3)} tri. O mercado comemora, a esquerda grita.`,
      estatizar: `${t.e.nome}: Estado recompra ${t.pct}% por ${t.valor.toFixed(3)} tri. Investidores em pânico.`,
      nacionalizar: `${t.e.nome} NACIONALIZADA. O Estado tomou os ${t.pct}% restantes por ${t.valor.toFixed(3)} tri — bem abaixo do valor de mercado. Os acionistas gritam confisco; os advogados já estão em Haia. O capital estrangeiro está reavaliando cada contrato que tem neste país.`,
    }[t.tipo];
    const cor = t.tipo === 'privatizar' ? '#ffb020' : t.tipo === 'nacionalizar' ? '#b98cff' : t.tipo === 'estatizar' ? '#ff3b5c' : '#22e0a0';
    this._empilharFeed([{ tipo: 'sistema', handle: 'Economia', texto: `${txt}`, cor }]);
    this.acoesResumo = `${this.acoesResumo && this.acoesResumo !== '(nenhuma)' ? `${this.acoesResumo} · ` : ''}${txt}`;
    this.recomputar();
  }

  // Registra uma solicitação de compra de armamento (ou produção nacional).
  registrarPedido(r) {
    if (r.imediato) {
      this._empilharFeed([{ tipo: 'sistema', handle: 'Indústria', cor: '#35e0ff',
        texto: `Linha de produção nacional acionada: ${r.qtd.toLocaleString('pt-BR')}× ${r.item.nome} por ${r.total.toFixed(3)} tri. Sai da nossa fábrica, entra no nosso arsenal, e ninguém no mundo pode vetar.` }]);
      this.acoesResumo = `${this.acoesResumo && this.acoesResumo !== '(nenhuma)' ? `${this.acoesResumo} · ` : ''}Produziu ${r.qtd} ${r.item.nome}`;
    } else {
      this._empilharFeed([{ tipo: 'sistema', handle: 'Aquisições', cor: '#ffb020',
        texto: `Pedido formal enviado: ${r.qtd.toLocaleString('pt-BR')}× ${r.item.nome} (${r.total.toFixed(3)} tri) a ${r.item.origem}. Chance de aprovação estimada em ${Math.round(r.chance * 100)}%. Agora é esperar eles decidirem se somos aliados o bastante.` }]);
      this.acoesResumo = `${this.acoesResumo && this.acoesResumo !== '(nenhuma)' ? `${this.acoesResumo} · ` : ''}Solicitou ${r.qtd} ${r.item.nome} a ${r.item.origem}`;
    }
    this.recomputar();
  }

  // Registra uma jogada de projeção de poder (instalar/desativar base).
  // A IA precisa saber disso: botar tropa no solo de outro país é o tipo de coisa
  // que gera crise dois turnos depois.
  registrarBase(t) {
    if (t.tipo === 'instalar') {
      const txt = `${t.base.nome}: ${t.tipoInfo.nome} operacional em ${t.paisNome}. ${
        t.base.viaOcupacao
          ? 'Instalada em território sob ocupação — nem fingimos que pedimos licença.'
          : 'Acordo de status de forças assinado. Nossas tropas agora dormem no quintal deles.'}`;
      this._empilharFeed([{ tipo: 'sistema', handle: 'Comando', texto: txt, cor: '#35e0ff' }]);
      this.acoesResumo = `${this.acoesResumo && this.acoesResumo !== '(nenhuma)' ? `${this.acoesResumo} · ` : ''}Instalou ${t.tipoInfo.nome} em ${t.paisNome}`;
    } else {
      this._empilharFeed([{ tipo: 'sistema', handle: 'Comando', cor: '#ffb020',
        texto: `Instalação desativada em ${t.paisNome}. Recuo estratégico — ou derrota admitida, dependendo de quem escreve a manchete.` }]);
    }
    this.recomputar();
  }

  // Registra uma transação de mercado (compra/venda de arsenal).
  registrarMercado(t) {
    if (t.tipo === 'compra') {
      this._empilharFeed([{ tipo: 'sistema', handle: 'Mercado', cor: '#22e0a0',
        texto: `Adquiridas ${t.qtd.toLocaleString('pt-BR')} unidades de ${t.unidade.nome} por ${t.valor.toFixed(2)} tri.` }]);
    } else {
      const rival = t.comprador.perfil === 'rival';
      this._empilharFeed([{ tipo: 'sistema', handle: 'Mercado', cor: rival ? '#ff3b5c' : '#ffb020',
        texto: `Vendidas ${t.qtd.toLocaleString('pt-BR')} unidades de ${t.unidade.nome} a ${t.comprador.nome}${rival ? ' — um RIVAL. O mundo reparou.' : '.'}` }]);
      this.acoesResumo = `${this.acoesResumo && this.acoesResumo !== '(nenhuma)' ? `${this.acoesResumo} · ` : ''}Vendeu ${t.qtd} ${t.unidade.nome} para ${t.comprador.nome} (${t.comprador.perfil})`;
    }
    this.recomputar();
  }

  // Registra um flash urgente resolvido (popup com cronômetro).
  registrarFlash(flash, i, nota) {
    this._empilharFeed([{
      tipo: 'sistema', handle: 'Flash Urgente', texto: `${flash.titulo} — ${nota}`,
      cor: i === null ? '#ff3b5c' : '#ffb020',
    }]);
    this.acoesResumo = `${this.acoesResumo && this.acoesResumo !== '(nenhuma)' ? `${this.acoesResumo} · ` : ''}Flash urgente "${flash.titulo}": ${nota}`;
    this.recomputar();
  }

  // Registra uma guerra resolvida: cria o fio quente e alimenta o feed, para que o
  // próximo acontecimento gerado seja sobre ela.
  aplicarGuerra(feature, res) {
    if (!res || res.falha) return;
    const nome = res.av.nome;
    const tema = `Guerra com ${nome}`;
    let fio = this.fios.find((f) => f.tema === tema);
    if (!fio) { fio = criarFio({ tema, intensidade: 95, alvo_pressao: 'seguranca', atores: [nome] }); this.fios.unshift(fio); }
    else fio.intensidade = Math.min(100, fio.intensidade + 50);
    anotarNoFio(fio, `t${this.turno}: ofensiva contra ${nome} → ${res.resultado.toUpperCase()} (empenho ${res.empenho}%, orçamento ${res.orcamento} tri)`);

    this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Estado-Maior',
      texto: `⚔️ Ofensiva contra ${nome}: ${res.venceu ? 'VITÓRIA' : 'DERROTA'}.`,
      cor: res.venceu ? '#22e0a0' : '#ff3b5c' }]);
    if (res.reacaoBloco?.length) {
      this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Chancelaria',
        texto: `⚠️ ${res.bloco.blocoNome} condena a ofensiva. Relações com ${res.bloco.paises.join(', ')} despencaram.`,
        cor: '#ffb020' }]);
    }
    // A coalizão que ENTROU NA GUERRA: fato militar, não nota diplomática. Vai pro feed
    // com o peso de Estado-Maior porque é o que muda a conta da próxima batalha.
    if (res.apoiosEnviados?.length) {
      this._empilharFeed([{ tipo: 'sistema', handle: '⚙ Estado-Maior',
        texto: `${res.coalizao.blocoNome} reforçou ${nome}: ${res.apoiosEnviados.map((a) => `${a.nomeDe} (+${a.poder})`).join(', ')}. As tropas permanecem posicionadas.`,
        cor: '#ff3b5c' }]);
      anotarNoFio(fio, `t${this.turno}: ${res.resumoCoalizao}`);
    }
    // O resumo que a Máquina lê. Sem a coalizão aqui, a IA narrava uma guerra bilateral
    // enquanto o jogador tinha acabado de ver "China +37" na tela — mecânica e narrativa
    // contando histórias diferentes é o pior defeito possível num jogo cuja alma é texto.
    this.acoesResumo = `Lançou ofensiva militar contra ${nome} → ${res.venceu ? 'VITÓRIA' : 'DERROTA'}`
      + `${res.reacaoBloco?.length ? ` (${res.bloco.blocoNome} reagiu contra nós)` : ''}`
      + `${res.apoiosEnviados?.length ? `. ${res.resumoCoalizao}` : ''}`;
    this.recomputar();
  }

  // Ações grandes (guerra, golpe, sabotagem, nuclear, purga) criam/esquentam um
  // fio de tensão para que a Máquina gere um acontecimento SOBRE aquilo no próximo turno.
  _reagirAcoes(resultados) {
    for (const r of resultados) {
      if (!r.major) continue;
      let tema; let alvoP = 'seguranca';
      if (/guerra|conquista/.test(r.id)) tema = r.alvo ? `Guerra com ${r.alvo}` : 'Guerra em curso';
      else if (/golpe/.test(r.id)) tema = r.alvo ? `Golpe encoberto contra ${r.alvo}` : 'Operação de golpe';
      else if (/sabotar/.test(r.id)) tema = r.alvo ? `Sabotagem contra ${r.alvo}` : 'Sabotagem exposta';
      else if (/ogiva|nuclear/.test(r.id)) tema = 'Escalada nuclear global';
      else if (/purga|perseguir_opositor|estado_excecao/.test(r.id)) { tema = 'Repressão e resistência interna'; alvoP = 'estabilidade'; }
      else if (/alistamento_obrigatorio/.test(r.id)) { tema = 'Revolta contra a conscrição'; alvoP = 'estabilidade'; }
      // Escândalo político: se a jogada suja FALHOU, o fio é o vazamento; se deu certo,
      // o rumor ferve mais baixo. A Máquina escreve a CPI/manchete no turno seguinte.
      else if (/comprar_congresso|propina|caixa_dois|anticorrupcao/.test(r.id)) {
        tema = r.sucesso ? 'Rumores de corrupção no governo' : 'Escândalo de corrupção estourou';
        alvoP = 'estabilidade';
      } else tema = r.nome;

      let fio = this.fios.find((f) => f.tema === tema);
      if (!fio) { fio = criarFio({ tema, intensidade: 90, alvo_pressao: alvoP, atores: r.alvo ? [r.alvo] : [] }); this.fios.unshift(fio); }
      else fio.intensidade = Math.min(100, fio.intensidade + 45);
      anotarNoFio(fio, `t${this.turno}: jogador ${r.sucesso ? 'teve SUCESSO' : 'FRACASSOU'} em "${r.nome}"${r.alvo ? ` (alvo: ${r.alvo})` : ''}`);
    }
  }

  _acaoParaPost(r) {
    const rot = VARS; // (não usado; mantido por clareza)
    const status = r.sucesso ? 'concluída com sucesso' : 'FALHOU';
    return {
      tipo: 'sistema',
      handle: '⚙ Gabinete',
      texto: `${r.icone} ${r.nome}: ${status}.`,
      cor: r.sucesso ? '#47e0a0' : '#ff5a6e',
    };
  }

  _resumoAcoes(resultados) {
    if (!resultados.length) return '(nenhuma)';
    return resultados.map((r) => `${r.nome} (${r.sucesso ? 'sucesso' : 'falha'})`).join(', ');
  }

  _reacaoParaPosts(instrucao) {
    if (!instrucao) return [];
    const txt = instrucao.toLowerCase();
    const posts = [];
    for (const v of this.veiculos) {
      const tokens = [
        v.nome.toLowerCase(),
        ...v.nome.toLowerCase().split(' ').filter((w) => w.length >= 4),
        v.handle.replace('@', '').toLowerCase(),
      ];
      if (tokens.some((t) => txt.includes(t))) {
        posts.push({ tipo: 'veiculo', veiculo: v.nome, handle: v.handle, texto: instrucao, tom: 'reacao' });
      }
    }
    if (posts.length === 0) posts.push({ tipo: 'cidadao', handle: '@opiniao_publica', texto: instrucao, tom: 'reacao' });
    return posts.slice(0, 2);
  }
}
