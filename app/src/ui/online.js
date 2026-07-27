// ═══════════════════════════════════════════════════════════════════════
// ONLINE — as interações entre humanos, em tempo real
// ═══════════════════════════════════════════════════════════════════════
// Modelo em docs/ONLINE.md. Este módulo é a ponte entre a sala (net/lobby.js) e o
// jogo: quando OUTRO humano age contra você, o golpe chega AGORA — vira post no X,
// balão no globo, e, se for guerra, dispara o MODO DEFESA. É o coração da ansiedade
// online: você não espera turno pra sentir que alguém se moveu.
//
// Também expõe o caminho de SAÍDA: quando VOCÊ age sobre um país controlado por um
// humano, o jogo chama notificar() e o alvo recebe o alerta.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { abrirDefesa } from './defesa.js';
import { alertaUrgente } from './efeitos.js';
import { breakingRemoto } from './breaking.js';
import { tentarIntervencao } from '../jogo/intervencaoConflito.js';
import { aplicarAcaoPandemia } from '../jogo/pandemiaAcoes.js';
import { techDaFrota } from '../dados/forcas.js';
import { tocarEfeito } from './audio.js';
import { offsetServidor } from '../net/lobby.js';
import { estadosDe } from '../jogo/territorio.js';
import { aliancaCom, ehAliadoMilitar, quebrarPorTraicao, sincronizarBlocos, aliancaDe, registrarAliancaConhecida, ehMilitar } from '../jogo/aliancas.js';
import { aplicarZonaMorta, marcarNacaoMorta } from '../jogo/nuclear.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (iso) => PAISES[iso]?.nome || iso;

// Como cada tipo de evento se anuncia: cor, se é urgente (banner INCOMING), e o verbo.
const ESTILO = {
  guerra:     { cor: '#ff3b5c', urgente: true,  rot: 'DECLAROU GUERRA', ic: 'swords' },
  ataque_estado: { cor: '#ff3b5c', urgente: true, rot: 'ATACOU SEU TERRITÓRIO', ic: 'crosshair' },
  // #4.2 — a intenção descoberta pela inteligência, ANTES do primeiro tiro
  ofensiva_detectada: { cor: '#ff6a45', urgente: true, rot: 'PREPARA UMA OFENSIVA', ic: 'radar' },
  naval:      { cor: '#35e0ff', urgente: true,  rot: 'ATAQUE NAVAL', ic: 'ship' },
  nuclear:    { cor: '#ff3b5c', urgente: true,  rot: 'LANÇAMENTO NUCLEAR', ic: 'radiation' },
  sancao:     { cor: '#ffb020', urgente: false, rot: 'IMPÔS SANÇÕES', ic: 'ban' },
  mediacao:   { cor: '#35e0ff', urgente: false, rot: 'MEDIA UM CONFLITO', ic: 'handshake' },
  espionagem: { cor: '#b98cff', urgente: false, rot: 'OPERAÇÃO DE ESPIONAGEM', ic: 'eye' },
  alianca:    { cor: '#22e0a0', urgente: true,  rot: 'PROPÔS ALIANÇA', ic: 'handshake' },
  comercio:   { cor: '#22e0a0', urgente: true,  rot: 'PROPÔS ACORDO COMERCIAL', ic: 'coins' },
  ajuda:      { cor: '#22e0a0', urgente: false, rot: 'ENVIOU AJUDA', ic: 'heart-handshake' },
  resposta:   { cor: '#35e0ff', urgente: false, rot: 'RESPONDEU', ic: 'reply' },
};

export function ligarOnline(jogo, net, hooks) {
  const meuIso = jogo.estado.iso || jogo.ficha?.iso;
  let jogadores = [];                 // [{ id, nome, pais, host }]
  const porPais = new Map();          // iso → jogador (quem é humano)
  // #11 — países cujo GOVERNO HUMANO CAIU. Continuam no mapa, mas voltam a ser NPC:
  // é a opção B da decisão de produto (ver ui/renascer.js) — o país não some nem
  // congela, a Máquina assume. Enquanto o servidor não souber disso (o socket do
  // jogador segue aberto até ele escolher outra nação), somos nós que temos de
  // subtraí-los do roster de humanos — senão a simulação continua pulando aquele país
  // e ele vira um buraco morto no mundo: não age, não reage, não pode ser jogado.
  const caidos = new Set();

  const badge = hooks.container?.querySelector('#online-badge');

  // Recalcula quem é humano a partir de uma lista de jogadores da sala.
  function absorverJogadores(lista) {
    jogadores = (lista || []).filter((j) => j.pais);
    porPais.clear();
    for (const j of jogadores) if (j.pais && j.pais !== meuIso) porPais.set(j.pais, j);
    // ROSTER PARA A SIMULAÇÃO: a máquina (agressão/mundo vivo) não pode decidir guerra/ação
    // por país controlado por OUTRO humano. Stampamos os ISOs humanos no estado (inclui o
    // local) — os módulos do motor leem `estado._humanos` e pulam esses países. Offline
    // fica undefined → comportamento single-player intacto.
    jogo.estado._humanos = jogadores.map((j) => j.pais).filter(Boolean).filter((iso) => !caidos.has(iso));
    pintarBadge();
  }

  // BUG QUE ISTO CONSERTA: quem ENTRAVA por último no jogo começava com jogadores=[]
  // e só populava no PRÓXIMO broadcast de sala — que nunca vinha se ninguém mais mexia.
  // Resultado: o convidado não "via" o host como humano (sem botão de contato, ligação
  // só funcionava num sentido). O cliente do lobby JÁ guarda o último roster em
  // net.estado().jogadores — semeamos dele na hora de ligar.
  absorverJogadores(net.estado().jogadores);

  function pintarBadge() {
    if (!badge) return;
    const est = net.estado();
    const n = jogadores.length;
    badge.innerHTML = `${ico('users', 12)} <b>${n}</b> na sala${est.sala ? ` · <span class="ob-sala">${esc(est.sala)}</span>` : ''}`;
    badge.classList.add('online-ativo');
  }

  function humano(iso) { return porPais.get(iso) || null; }

  // ── EVENTO CHEGANDO de outro humano ────────────────────────────────
  function receber(ev) {
    if (!ev || ev.dePais === meuIso) return;   // ignora eco do próprio
    // MÓDULOS QUE FALAM PELA SALA (hoje: o Conselho de Segurança). Eles têm o próprio
    // vocabulário de eventos; se um deles reconhece o bilhete, o assunto é dele e o
    // fluxo genérico abaixo não precisa nem saber que existiu.
    if (hooks.aoEventoExtra?.(ev)) return;
    // #10 — CONSEQUÊNCIA DURÁVEL: sofrer uma ação hostil de outro humano REBAIXA a sua
    // relação com ele. Sem isto, você afundava a frota de um país e ele seguia te tratando
    // como "parceiro" — a postura (Aliado/Parceiro/Tenso/Hostil) deriva desse número.
    // Só o ALVO rebaixa (via paraVoce/alvo); persiste no autosave.
    // `ofensiva_detectada` entra aqui de propósito: descobrir que alguém está montando
    // uma invasão contra você É um fato diplomático — e, se ele era seu aliado, é
    // TRAIÇÃO antes do primeiro tiro (quebrarPorTraicao rompe o pacto na hora).
    const QUEDA_REL = { guerra: 60, nuclear: 60, guerra_resultado: 50, ataque_estado: 40, ofensiva_detectada: 25, naval: 30, naval_resultado: 30, sancao: 20, espionagem: 15 };
    if ((ev.paraVoce || ev.alvo === meuIso) && QUEDA_REL[ev.tipo]) {
      const k = PAISES[ev.dePais]?.rel || `rel_${String(ev.dePais).toLowerCase()}`;
      jogo.estado[k] = Math.max(-100, Math.min(100, (jogo.estado[k] || 0) - QUEDA_REL[ev.tipo]));
      // TRAIÇÃO: se quem me atacou era MEU ALIADO, o pacto se rompe na hora — ele sai
      // do bloco, perde o desconto e a defesa mútua. Um aliado que atira vira inimigo.
      const rompeu = quebrarPorTraicao(jogo.estado, ev.dePais);
      if (rompeu) {
        alertaUrgente({ titulo: '🗡 TRAIÇÃO', texto: `${ev.deNome || nomeDe(ev.dePais)} era seu aliado em ${rompeu.alianca} — e atacou você. O pacto está rompido.`, tom: 'ataque' });
        jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Chancelaria', cor: '#ff3b5c',
          texto: `${nomeDe(ev.dePais)} rompeu ${rompeu.alianca} com um ataque pelas costas. Expulso do bloco — e agora é só mais um inimigo.` }]);
        hooks.renderFeed?.();
      }
      hooks.atualizar?.();
    }
    // CASCATA: quem ataca um aliado meu fica VERMELHO no meu mapa (a relação despenca).
    if (HOSTIL.has(ev.tipo)) cascataAoVerAtaque(ev);
    // DEFESA MÚTUA: a guerra do meu ALIADO MILITAR é a minha guerra — sou avisado com
    // força quando ele é atacado (mesmo que o alvo não seja eu).
    if (ev.alvo && ev.alvo !== meuIso && ehAliadoMilitar(jogo.estado, ev.alvo)
        && ['guerra', 'ataque_estado', 'nuclear', 'naval'].includes(ev.tipo)) {
      alertaUrgente({
        titulo: '⚔ SEU ALIADO ESTÁ SOB ATAQUE',
        texto: `${nomeDe(ev.alvo)} — seu aliado por defesa mútua — foi atacado por ${ev.deNome || nomeDe(ev.dePais)}. O pacto te chama.`,
        tom: 'ataque', comSom: false,
      });
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚔ Defesa Mútua', cor: '#ffb020',
        texto: `${nomeDe(ev.alvo)} pediu socorro: ${nomeDe(ev.dePais)} abriu fogo contra um membro da nossa aliança.` }]);
      hooks.renderFeed?.();
      const g = hooks.globoCtrl?.();
      g?.ondaRadar?.(g.ondeEsta?.(ev.alvo), { cor: 0xffb020, max: 50 });
    }
    // #3 — SANÇÃO SOFRIDA vira custo econômico recorrente (aparece no painel Governar).
    if (ev.tipo === 'sancao' && (ev.paraVoce || ev.alvo === meuIso)) {
      const e = jogo.estado;
      e.sancoesSofridas = e.sancoesSofridas || [];
      if (!e.sancoesSofridas.some((s) => s.por === ev.dePais)) {
        e.sancoesSofridas.push({ por: ev.dePais, nome: ev.deNome || ev.dePais, intensidade: 30, desde: Date.now() });
      }
    }
    // MUNDO COMPARTILHADO: o host é a autoridade do "mundo ao vivo". Ele retransmite os
    // posts do X, plantões e o período; os convidados APLICAM (em vez de gerar os seus,
    // que divergiam). Assim a sala inteira vê a MESMA timeline e o mesmo relógio.
    if (ev.tipo === 'mundo') { aplicarMundo(ev.dados || {}); return; }
    // A BATIDA do host: o convidado avança o próprio mês em sincronia e aplica o
    // mundo compartilhado (Brent, guerras NPC, pandemias). É o coração do mundo único.
    if (ev.tipo === 'beat') { hooks.aoBeatHost?.(ev.dados || {}); return; }
    // CURA COMPARTILHADA: um convidado financiou pesquisa/contenção. Só o HOST (autoridade
    // do mundo) acumula na pandemia autoritativa; a próxima batida reespalha o total a todos.
    if (ev.tipo === 'pandemia_cura' && net.estado().host && ev.dados?.pandemiaId) {
      try {
        aplicarAcaoPandemia(jogo.estado, {
          pandemiaId: ev.dados.pandemiaId, tipo: ev.dados.tipo,
          valor: ev.dados.valor, alvoIso: ev.dados.alvoIso,
        }, true);
      } catch { /* pandemia já encerrada */ }
      return;
    }
    // FROTA de outro jogador no mar: aparece no SEU globo (e some quando recolhe).
    if (ev.tipo === 'frota_pos') { upsertFrotaHumana(ev); return; }
    if (ev.tipo === 'frota_out') { removerFrotaHumana(ev); return; }
    // RESULTADO DE COMBATE NAVAL: o dono da frota atacada SENTE o golpe (afundou/
    // baixas) e todos removem o pino — acabou o "navio fantasma".
    if (ev.tipo === 'naval_resultado') { aplicarResultadoNaval(ev); return; }
    // CONQUISTA TERRITORIAL: os estados atingidos mudam de dono/entram em conflito
    // no mapa de TODOS — o atacado vê o próprio território marcado, como o atacante.
    if (ev.tipo === 'guerra_resultado') { aplicarImpactoTerritorial(ev); return; }
    // PLANTÃO de outro jogador: o mesmo breaking, o mesmo texto, na tela de todos.
    if (ev.tipo === 'breaking') { breakingRemoto(jogo, ev.dados || {}); return; }
    // FAKE NEWS: a mentira plantada por outro jogador aparece no X de todos, com a
    // cara do @Choquei — ninguém sabe quem pagou por ela (é esse o ponto).
    if (ev.tipo === 'fakenews' && ev.dados?.texto) {
      jogo._empilharFeed?.([{ tipo: 'veiculo', veiculo: 'Choquei', handle: '@choquei',
        texto: ev.dados.texto, manchete: ev.dados.texto }]);
      hooks.renderFeed?.();
      return;
    }
    // ALIANÇA ANUNCIADA: todo mundo passa a conhecer o bloco (mesmo sem fazer parte).
    // É o que permite a cascata "atacar um é atacar todos" pra quem está de fora.
    if (ev.tipo === 'alianca_publica' && ev.dados?.alianca) {
      registrarAliancaConhecida(jogo.estado, ev.dados.alianca);
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '🤝 Diplomacia', cor: '#22e0a0',
        texto: `${ev.dados.alianca.nome} anunciada: ${(ev.dados.alianca.membros || []).map((m) => nomeDe(m)).join(' · ')}.` }]);
      hooks.renderFeed?.(); hooks.globoCtrl?.()?.atualizar?.();
      return;
    }
    // ANEXAÇÃO: o país anexado vira território do conquistador NO MAPA DE TODOS —
    // cor, dono dos estados e status. O mundo inteiro atualiza na hora.
    if (ev.tipo === 'anexacao' && ev.dados?.iso) {
      const e = jogo.estado;
      const alvo = ev.dados.iso;
      e.donoEstado = e.donoEstado || {};
      for (const est of estadosDe(alvo)) e.donoEstado[est.id] = ev.dePais;
      e.ocupacoes = e.ocupacoes || {};
      e.ocupacoes[alvo] = { ...(e.ocupacoes[alvo] || {}), anexado: true, por: ev.dePais };
      if (alvo === meuIso) {
        alertaUrgente({ titulo: '☠ SEU PAÍS FOI ANEXADO', texto: `${ev.deNome || nomeDe(ev.dePais)} incorporou a sua nação.`, tom: 'ataque' });
      }
      hooks.globoCtrl?.()?.atualizar?.();
    }
    // DEVOLUÇÃO: o país volta ao mapa como nação soberana — em todos os clientes.
    if (ev.tipo === 'devolucao' && ev.dados?.iso) {
      const e = jogo.estado; const alvo = ev.dados.iso;
      for (const est of estadosDe(alvo)) if (e.donoEstado?.[est.id] === ev.dePais) delete e.donoEstado[est.id];
      delete e.ocupacoes?.[alvo];
      hooks.globoCtrl?.()?.atualizar?.();
    }
    // STATS VIVOS de outro jogador (PIB, militar, petróleo, território): alimentam o
    // ÍNDICE MUNDIAL e a força que eu vejo dele — números REAIS, não tabela estática.
    if (ev.tipo === 'stats') {
      if (ev.dePais && ev.dados) {
        jogo.estado._statsHumanos = jogo.estado._statsHumanos || {};
        jogo.estado._statsHumanos[ev.dePais] = ev.dados;
      }
      return;
    }
    // MEDIAÇÃO: a diplomacia de um jogador MOVE o conflito da sala — o host aplica os
    // pontos no mundo autoritativo e a próxima batida espalha o avanço pra todos.
    if (ev.tipo === 'mediacao' && ev.dados?.conflitoId && net.estado().host) {
      try { tentarIntervencao(jogo.estado, ev.dados.conflitoId, ev.dados.frente || 'mediar'); } catch { /* conflito já acabou */ }
    }
    // #4.2 — A INTENÇÃO DESCOBERTA. A ofensiva estava em segredo; a inteligência do
    // alvo a flagrou e o fato virou público. O mapa de TODOS ganha a linha de
    // preparação (intenção, sem ferro no ar) e o alvo entra em Modo Defesa AGORA —
    // esta é a janela de reação, não o instante do impacto.
    if (ev.tipo === 'ofensiva_detectada') { intencaoDeAtaque(ev); return; }
    // ── #6.1/#6.2 · A CRATERA É A MESMA EM TODO MAPA ───────────────────
    // Antes, `dispararOgiva` marcava a zona radioativa SÓ no cliente de quem lançou:
    // o resto da sala continuava vendo um país normal, negociando com um cemitério e
    // planejando ofensiva contra escombros. O evento traz tudo pronto (iso, quem
    // lançou), então cada cliente aplica a MESMA função do motor — uma verdade só.
    // Sem `return`: o fluxo normal abaixo ainda precisa desenhar a ogiva no globo e
    // alertar o alvo, que é outra coisa.
    if (ev.tipo === 'nuclear' && ev.dados?.zonaMorta && ev.dados?.iso) {
      const alvoIso = ev.dados.iso;
      const porIso = ev.dePais || ev.dados.porIso || null;
      const porNome = ev.deNome || ev.dados.porNome || null;
      const zona = aplicarZonaMorta(jogo.estado, alvoIso, { porIso, porNome });
      const morte = marcarNacaoMorta(jogo.estado, alvoIso, { porIso, porNome });
      if (zona.inedito) {
        jogo._empilharFeed?.([...(zona.linhas || []), ...(morte.linhas || [])].map((t) => ({
          tipo: 'sistema', handle: '☢ ZONA MORTA', texto: t, cor: '#78e65a',
        })));
        hooks.renderFeed?.();
      }
      const gz = hooks.globoCtrl?.();
      Promise.resolve(gz?.carregarPais?.(alvoIso)).then(() => gz?.atualizar?.()).catch(() => gz?.atualizar?.());
      hooks.atualizar?.();
    }
    // #4.1 — O OUTRO LADO SAIU DA GUERRA. Retirada é decisão dele, mas o fim da guerra
    // é decisão dos dois: as tropas dele pararam, as suas não pararam sozinhas. Você
    // escolhe encerrar (o conflito some do seu mapa) ou continuar em cima de um inimigo
    // que já recuou — que é uma jogada legítima, e cara na reputação.
    if (ev.tipo === 'saida_guerra') { retiradaRecebida(ev); return; }
    // #11 — UM GOVERNO CAIU. O país não sai do mapa: passa à Máquina, e quem o
    // derrubou (ou quem só assistiu) precisa VER isso acontecer — inclusive porque a
    // partir daqui aquele país volta a agir sozinho contra todo mundo.
    if (ev.tipo === 'queda' && ev.dados?.iso) {
      const iso = ev.dados.iso;
      caidos.add(iso);
      porPais.delete(iso);
      jogo.estado._humanos = (jogo.estado._humanos || []).filter((i) => i !== iso);
      jogo.estado._caidos = [...caidos];
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Chancelaria', cor: '#ffb020',
        texto: `O governo de ${nomeDe(iso)} CAIU — ${esc(ev.dados.motivo || 'fim do reinado')}. O país segue no mapa, agora conduzido pela Máquina.` }]);
      hooks.renderFeed?.();
      const g = hooks.globoCtrl?.();
      g?.ondaRadar?.(g.ondeEsta?.(iso), { cor: 0xffb020, max: 50 });
      g?.balao?.(g.ondeEsta?.(iso), 'GOVERNO CAIU', 'aviso');
      g?.atualizar?.();
      return;
    }
    // Ataque a UM estado: o território atingido marca no mapa de todos (e segue
    // para o fluxo normal — alerta/Modo Defesa se o alvo for você).
    if (ev.tipo === 'ataque_estado' && ev.dados?.estadoId) {
      aplicarImpactoTerritorial({ ...ev, dados: { caem: ev.dados.tomou ? [ev.dados.estadoId] : [], conflito: [ev.dados.estadoId] } }, { silencioso: true });
    }
    const est = ESTILO[ev.tipo] || { cor: '#7488ad', urgente: false, rot: (ev.tipo || 'AGIU').toUpperCase(), ic: 'radio' };
    const origem = ev.deNome ? `${ev.deNome} (${nomeDe(ev.dePais)})` : nomeDe(ev.dePais);

    // 1) sempre vira notícia no X — é o feed compartilhado da sala. Marcado com o país
    //    de origem pra o filtro (Minha Nação × World Trends) funcionar.
    jogo._empilharFeed?.([{
      tipo: 'jogador', handle: origem, paisOrigem: ev.dePais, paisAlvo: ev.alvo || null,
      texto: ev.texto || `${est.rot.toLowerCase()}`, cor: est.cor,
    }]);
    hooks.renderFeed?.();

    // 2) O ATAQUE APARECE NO GLOBO DE TODOS: linha + mísseis do agressor ao alvo
    //    (som só se o alvo for VOCÊ — guerra alheia anima muda). Balão em quem agiu.
    const g = hooks.globoCtrl?.();
    if (g && (ev.tipo === 'guerra' || ev.tipo === 'ataque_estado' || ev.tipo === 'naval' || ev.tipo === 'nuclear')) {
      const de = ev.dados?.de || g.ondeEsta?.(ev.dePais);
      const para = ev.dados?.para || (ev.alvo ? g.ondeEsta?.(ev.alvo) : null);
      if (de && para) {
        g.desenharLinha?.(para, 'ataque', 9000, de);
        g.salvaMisseis?.(para, ev.tipo === 'nuclear' ? 1 : 3, de, { som: ev.alvo === meuIso });
        g.ondaRadar?.(para, { cor: ev.tipo === 'nuclear' ? 0xff3b5c : 0xffb020, max: 45 });
      }
    }
    g?.balao?.(g.ondeEsta?.(ev.dePais), ev.texto || est.rot, est.urgente ? 'ruim' : 'aviso');

    // 3) se a bomba é COM VOCÊ, alerta urgente — e, se for guerra/ataque, MODO DEFESA
    if (ev.paraVoce || ev.alvo === meuIso) {
      if (ev.tipo === 'guerra' || ev.tipo === 'ataque_estado') {
        const surpresa = ev.dados?.impacto && ev.dados?.surpresa;
        alertaUrgente({
          titulo: surpresa ? 'ATAQUE SURPRESA' : 'VOCÊ ESTÁ SOB ATAQUE',
          texto: surpresa
            ? `${ev.deNome || nomeDe(ev.dePais)} montou esta ofensiva em segredo e a sua inteligência não viu nada. A bomba chegou antes do aviso.`
            : `${ev.deNome || nomeDe(ev.dePais)} lançou uma ofensiva contra você.`,
          tom: 'ataque', comSom: true,
        });
        // #4.2 — O MODAL DE DEFESA É A JANELA DE REAÇÃO, e ela vem ANTES do soco (no
        // `ofensiva_detectada`). No IMPACTO não há mais o que posicionar: abrir a tela
        // aqui seria pedir pro jogador arrumar a casa depois do incêndio. Quem não
        // detectou a tempo paga com a surpresa — é esse o preço de não ter inteligência.
        if (!ev.dados?.impacto) {
          abrirDefesa(jogo, {
            agressor: { iso: ev.dePais, nome: ev.deNome || nomeDe(ev.dePais) },
            dados: ev.dados || null,
            onFim: () => hooks.atualizar?.(),
          });
        }
      } else if (ev.tipo === 'nuclear') {
        // JANELA DE REAÇÃO: a ogiva voa ~6s com contagem antes do clarão registrar.
        contagemIncoming({
          titulo: '☢ OGIVA A CAMINHO',
          sub: `${ev.deNome || nomeDe(ev.dePais)} lançou uma ogiva contra você. Impacto iminente.`,
          segundos: 6,
        }, () => {
          alertaUrgente({ titulo: '☢ ATAQUE NUCLEAR CONTRA VOCÊ', texto: ev.texto || `${ev.deNome || nomeDe(ev.dePais)} atacou você.`, tom: 'ataque', comSom: true });
          // #6.2 — VOCÊ FOI APAGADO. O motor já zerou tudo (forças, guarnições, guerras)
          // e gravou `estado.nacaoMorta` com o retrato do que você era. Aqui a UI precisa
          // PARAR de fingir que você ainda governa: quem toma essa decisão é o ui/jogo.js,
          // que tem o relógio e a tela de fim na mão. É a mesma porta do #11 — a sala
          // continua, e você pode assumir outra nação nela.
          if (ev.dados?.zonaMorta && jogo.estado.nacaoMorta) {
            hooks.aoSerApagado?.({
              por: ev.dePais, porNome: ev.deNome || nomeDe(ev.dePais),
              registro: jogo.estado.nacaoMorta,
            });
          }
        });
      } else if (ev.tipo === 'naval') {
        alertaUrgente({ titulo: 'ATAQUE NAVAL CONTRA VOCÊ', texto: ev.texto || `${ev.deNome || nomeDe(ev.dePais)} atacou você.`, tom: 'ataque', comSom: false });
        // #3.2 — ATAQUE PELO MAR PEDE OUTRA DEFESA. Não houve declaração nem fronteira
        // rompida: veio uma esquadra. O Modo Defesa abre no modo naval — a ameaça é o
        // LITORAL mais perto da frota, e a ação rápida é cobrir a costa, não a fronteira.
        // Bombardeio de esquadra contra esquadra não abre nada (não há solo a defender).
        if (!ev.dados?.alvoFrota) {
          abrirDefesa(jogo, {
            agressor: { iso: ev.dePais, nome: ev.deNome || nomeDe(ev.dePais) },
            dados: ev.dados || null, via: 'naval',
            onFim: () => hooks.atualizar?.(),
          });
        }
      } else if (ev.tipo === 'resposta' && ev.dados?.sobre === 'alianca') {
        // O CONVIDADO RESPONDEU: se aceitou, ele entra na MINHA aliança de verdade.
        if (ev.dados.aceito) {
          const al = (jogo.estado.aliancas || []).find((x) => x.id === ev.dados.alianca?.id);
          if (al && !al.membros.includes(ev.dePais)) {
            al.membros.push(ev.dePais); sincronizarBlocos(jogo.estado);
            net.evento('alianca_publica', null, `${al.nome} foi selada.`, { alianca: al });   // o mundo fica sabendo
          }
          const k = PAISES[ev.dePais]?.rel || `rel_${String(ev.dePais).toLowerCase()}`;
          jogo.estado[k] = Math.min(100, (jogo.estado[k] || 0) + 20);
          jogo._empilharFeed?.([{ tipo: 'sistema', handle: '🤝 Chancelaria', cor: '#22e0a0',
            texto: `${nomeDe(ev.dePais)} ACEITOU entrar em ${al?.nome || 'nossa aliança'}. O bloco cresce.` }]);
        } else {
          jogo._empilharFeed?.([{ tipo: 'sistema', handle: '🤝 Chancelaria', cor: '#ffb020',
            texto: `${nomeDe(ev.dePais)} recusou o convite de aliança.` }]);
        }
        hooks.renderFeed?.(); hooks.atualizar?.();
      } else if (ev.tipo === 'alianca' || ev.tipo === 'comercio') {
        propostaRecebida(ev, est);
      } else {
        alertaIncoming(origem, est, ev.texto);
      }
    }
  }

  // ── #4.2 · A INTENÇÃO DE ATAQUE, DESCOBERTA ──────────────────────────
  // Enquanto a ofensiva está em preparo ela não existe pra ninguém — é esse o ataque
  // surpresa que o jogo não tinha. Quando a inteligência do alvo flagra a montagem, o
  // segredo cai PARA TODOS: o mapa da sala inteira ganha a linha de preparação
  // (intenção — nenhum míssil voa ainda) e o alvo entra em Modo Defesa com o eixo real
  // do avanço na mão. É a diferença entre saber que vem e saber POR ONDE vem.
  function intencaoDeAtaque(ev) {
    const g = hooks.globoCtrl?.();
    const de = ev.dados?.de || g?.ondeEsta?.(ev.dePais);
    const para = ev.dados?.para || (ev.alvo ? g?.ondeEsta?.(ev.alvo) : null);
    if (g && de && para) {
      g.desenharLinha?.(para, 'preparacao', 15000, de);
      g.ondaRadar?.(para, { cor: 0xff6a45, max: 40 });
    }
    jogo._empilharFeed?.([{
      tipo: 'jogador', handle: `🛰 ${ev.deNome || nomeDe(ev.dePais)}`, paisOrigem: ev.dePais, paisAlvo: ev.alvo || null,
      texto: ev.texto || `${nomeDe(ev.dePais)} prepara uma ofensiva contra ${nomeDe(ev.alvo)}.`, cor: '#ff6a45',
    }]);
    hooks.renderFeed?.();
    if (!(ev.paraVoce || ev.alvo === meuIso)) return;
    // O ALARME É SAGRADO (METODOLOGIA, princípio 3): mobilização detectada é faixa
    // vermelha MUDA. O som fica reservado pro momento em que a bomba realmente cai.
    const meses = Math.max(1, Number(ev.dados?.restante) || 1);
    alertaUrgente({
      titulo: '🛰 OFENSIVA DETECTADA CONTRA VOCÊ',
      texto: `A sua inteligência interceptou a mobilização de ${ev.deNome || nomeDe(ev.dePais)}. Lançamento estimado em ${meses} ${meses > 1 ? 'meses' : 'mês'} — você ainda tem tempo de posicionar a defesa.`,
      tom: 'ataque', comSom: false,
    });
    abrirDefesa(jogo, {
      agressor: { iso: ev.dePais, nome: ev.deNome || nomeDe(ev.dePais) },
      dados: ev.dados || null,
      onFim: () => hooks.atualizar?.(),
    });
  }

  // ── #4.1 · A RETIRADA DO OUTRO LADO ──────────────────────────────────
  function retiradaRecebida(ev) {
    const quem = ev.deNome || nomeDe(ev.dePais);
    jogo._empilharFeed?.([{
      tipo: 'jogador', handle: quem, paisOrigem: ev.dePais, paisAlvo: ev.alvo || null,
      texto: ev.texto || `${nomeDe(ev.dePais)} retirou as tropas e encerrou a guerra.`, cor: '#ffb020',
    }]);
    hooks.renderFeed?.();
    if (!(ev.paraVoce || ev.alvo === meuIso)) return;
    if (!(jogo.estado.emGuerra || []).includes(ev.dePais)) return;   // já não estávamos em guerra
    fecharAlerta();
    const el = document.createElement('div');
    el.className = 'onl-alerta proposta';
    el.style.setProperty('--oc', '#ffb020');
    el.innerHTML = `
      <div class="onl-cab">${ico('flag-off', 15)} <b>${esc(quem)}</b> <span>RETIROU AS TROPAS</span></div>
      <div class="onl-txt">${esc(ev.dados?.vencendo
        ? `${nomeDe(ev.dePais)} estava vencendo e recuou mesmo assim. A guerra acabou para ele — acaba para você?`
        : `${nomeDe(ev.dePais)} encerrou a guerra unilateralmente. Você pode aceitar o fim ou continuar avançando sobre quem já recuou.`)}</div>
      <div class="onl-acoes">
        <button class="onl-sim">${ico('check', 14)} ENCERRAR TAMBÉM</button>
        <button class="onl-nao">${ico('swords', 14)} A GUERRA CONTINUA</button>
      </div>`;
    document.body.appendChild(el);
    const decidir = (encerrar) => {
      if (encerrar) {
        jogo.estado.emGuerra = (jogo.estado.emGuerra || []).filter((i) => i !== ev.dePais);
        const k = PAISES[ev.dePais]?.rel || `rel_${String(ev.dePais).toLowerCase()}`;
        jogo.estado[k] = Math.min(-20, (jogo.estado[k] || 0) + 15);   // trégua não é amizade
        jogo.estado.temp_guerra = Math.max(0, (jogo.estado.temp_guerra || 0) - 10);
        jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Chancelaria', cor: '#22e0a0',
          texto: `Armas silenciadas com ${nomeDe(ev.dePais)}. Não há tratado, não há confiança — há um mapa que parou de se mexer.` }]);
        net.evento('resposta', ev.dePais, 'Encerrou a guerra também.', { sobre: 'saida_guerra', aceito: true });
      } else {
        jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚔ Estado-Maior', cor: '#ff3b5c',
          texto: `${nomeDe(ev.dePais)} recuou e nós NÃO paramos. O mundo está vendo — e vai lembrar de quem seguiu atirando.` }]);
        jogo.estado.soft_power = Math.max(0, (jogo.estado.soft_power || 0) - 6);
        net.evento('resposta', ev.dePais, 'Recusou encerrar — a guerra continua.', { sobre: 'saida_guerra', aceito: false });
      }
      hooks.renderFeed?.(); hooks.atualizar?.(); hooks.globoCtrl?.()?.atualizar?.();
      fecharAlerta();
    };
    el.querySelector('.onl-sim').addEventListener('click', () => decidir(true));
    el.querySelector('.onl-nao').addEventListener('click', () => decidir(false));
    autoFechar = setTimeout(() => decidir(false), 25000);   // não decidir É continuar a guerra
  }

  // ── PROPOSTA recebida (aliança/comércio) — aceitar/recusar com timer ──
  function propostaRecebida(ev, est) {
    fecharAlerta();
    const el = document.createElement('div');
    el.className = 'onl-alerta proposta';
    el.style.setProperty('--oc', est.cor);
    el.innerHTML = `
      <div class="onl-cab">${ico(est.ic, 15)} <b>${esc(ev.deNome || nomeDe(ev.dePais))}</b> <span>${est.rot}</span></div>
      <div class="onl-txt">${esc(ev.texto || 'Quer estreitar laços com você.')}</div>
      <div class="onl-timer"><i></i></div>
      <div class="onl-acoes">
        <button class="onl-sim">${ico('check', 14)} ACEITAR</button>
        <button class="onl-nao">${ico('x', 14)} RECUSAR</button>
      </div>`;
    document.body.appendChild(el);
    const responder = (aceito) => {
      net.evento('resposta', ev.dePais, aceito ? 'Aceitou a proposta.' : 'Recusou a proposta.',
        { sobre: ev.tipo, aceito, alianca: ev.dados?.alianca || null });
      if (aceito) {
        // aceitar melhora a relação localmente
        const k = `rel_${ev.dePais?.toLowerCase()}`;
        if (k in jogo.estado) jogo.estado[k] = Math.min(100, (jogo.estado[k] || 0) + 20);
        // ALIANÇA DE VERDADE: o bloco entra no MEU estado com os dois membros — a partir
        // daqui ele é meu aliado no mapa (verde), na defesa mútua e nos descontos.
        if (ev.tipo === 'alianca' && ev.dados?.alianca) entrarNaAliancaRemota(ev.dados.alianca, ev.dePais);
        hooks.atualizar?.();
      }
      fecharAlerta();
    };
    el.querySelector('.onl-sim').addEventListener('click', () => responder(true));
    el.querySelector('.onl-nao').addEventListener('click', () => responder(false));
    // timer de 20s: deixar expirar recusa por omissão — decidir rápido É a ansiedade
    autoFechar = setTimeout(() => responder(false), 20000);
  }

  // ── CASCATA DE ALIANÇA — atacar um membro é atacar o bloco inteiro ────
  // Eventos hostis que disparam a cascata (mesma régua da queda de relação).
  const HOSTIL = new Set(['guerra', 'guerra_resultado', 'ataque_estado', 'naval', 'nuclear', 'anexacao']);

  // EU ATAQUEI alguém: se o alvo pertence a um bloco, TODO o bloco me vira as costas —
  // cada membro fica hostil no MEU mapa (vermelho). Roda no cliente do agressor.
  function cascataAoAtacar(alvoIso) {
    const al = aliancaDe(jogo.estado, alvoIso);
    if (!al) return;
    const outros = (al.membros || []).filter((m) => m !== alvoIso && m !== meuIso);
    if (!outros.length) return;
    const peso = ehMilitar(al) ? 45 : 22;   // pacto militar reage muito mais forte
    for (const m of outros) {
      const k = PAISES[m]?.rel || `rel_${String(m).toLowerCase()}`;
      jogo.estado[k] = Math.max(-100, Math.min(100, (jogo.estado[k] || 0) - peso));
    }
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚖ Chancelaria', cor: '#ff3b5c',
      texto: `Atacar ${nomeDe(alvoIso)} foi atacar ${al.nome}: ${outros.map((m) => nomeDe(m)).join(', ')} ${outros.length > 1 ? 'romperam' : 'rompeu'} com você.` }]);
    hooks.renderFeed?.(); hooks.atualizar?.();
  }

  // ALGUÉM ATACOU UM ALIADO MEU: o agressor fica vermelho no MEU mapa. Com defesa
  // mútua, a queda é brutal — o pacto militar transforma a guerra dele na minha.
  function cascataAoVerAtaque(ev) {
    if (!ev.alvo || ev.alvo === meuIso || ev.dePais === meuIso) return;
    const al = aliancaCom(jogo.estado, ev.alvo);          // o alvo é MEU aliado?
    if (!al) return;
    const militar = ehMilitar(al);
    const k = PAISES[ev.dePais]?.rel || `rel_${String(ev.dePais).toLowerCase()}`;
    jogo.estado[k] = Math.max(-100, Math.min(100, (jogo.estado[k] || 0) - (militar ? 55 : 25)));
    hooks.atualizar?.();
  }

  // ── ALIANÇA MATERIALIZADA (os dois lados ficam com o MESMO bloco) ──────
  // Recebe o desenho da aliança do proponente e a grava no meu estado, comigo dentro.
  // É o que faz o aceite virar aliança de verdade (antes só mexia na relação).
  function entrarNaAliancaRemota(al, isoFundador) {
    if (!al?.id) return;
    const e = jogo.estado;
    e.aliancas = e.aliancas || [];
    const membros = [...new Set([...(al.membros || [isoFundador]), meuIso])];
    const existente = e.aliancas.find((x) => x.id === al.id);
    if (existente) existente.membros = [...new Set([...existente.membros, ...membros])];
    else e.aliancas.push({ ...al, membros, convites: al.convites || [] });
    sincronizarBlocos(e);
    // o pacto vira público: a sala inteira passa a conhecer o bloco (cascata)
    net.evento('alianca_publica', null, `${al.nome} foi selada.`, { alianca: { ...al, membros } });
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '🤝 Chancelaria', cor: '#22e0a0',
      texto: `Pacto assinado: ${al.nome} agora reúne ${membros.map((m) => nomeDe(m)).join(' e ')}.` }]);
    hooks.renderFeed?.();
    hooks.globoCtrl?.()?.atualizar?.();
  }

  // ── ALERTA urgente simples (sanção, espionagem, etc.) ──
  function alertaIncoming(origem, est, texto) {
    fecharAlerta();
    const el = document.createElement('div');
    el.className = `onl-alerta ${est.urgente ? 'urgente' : ''}`;
    el.style.setProperty('--oc', est.cor);
    el.innerHTML = `
      <div class="onl-cab">${ico(est.ic, 15)} <b>${esc(origem)}</b> <span>${est.rot}</span></div>
      <div class="onl-txt">${esc(texto || '')}</div>
      <button class="onl-ok">ENTENDIDO</button>`;
    document.body.appendChild(el);
    el.querySelector('.onl-ok').addEventListener('click', fecharAlerta);
    autoFechar = setTimeout(fecharAlerta, 8000);
  }

  let autoFechar = null;
  let incomingTick = null;
  function fecharAlerta() {
    clearTimeout(autoFechar);
    clearInterval(incomingTick);
    document.querySelectorAll('.onl-alerta').forEach((e) => e.remove());
  }

  // ── JANELA DE REAÇÃO (#8): a ameaça CHEGA com contagem ANTES do impacto ──
  // Era o que faltava: "deveria ter tempo pra eu ser notificado e reagir". Enquanto a ogiva
  // voa no globo, o defensor vê uma contagem regressiva; ao zerar, o impacto (onFim) resolve.
  function contagemIncoming({ titulo, sub, segundos = 6, cor = '#ff3b5c' }, onFim) {
    fecharAlerta();
    const el = document.createElement('div');
    el.className = 'onl-alerta urgente incoming';
    el.style.setProperty('--oc', cor);
    let restante = segundos;
    const pinta = () => { el.innerHTML = `
      <div class="onl-cab">${ico('radiation', 15)} <b>${esc(titulo)}</b></div>
      <div class="onl-txt">${esc(sub || '')}</div>
      <div class="onl-contagem">IMPACTO EM <b>${restante}s</b></div>`; };
    pinta();
    document.body.appendChild(el);
    try { tocarEfeito('alerta-nuclear', { volume: 0.5 }); } catch { /* sem áudio */ }
    incomingTick = setInterval(() => {
      restante -= 1;
      if (restante <= 0) { clearInterval(incomingTick); el.remove(); onFim?.(); return; }
      pinta();
    }, 1000);
  }

  // ── FROTAS DE OUTROS JOGADORES no seu globo ─────────────────────────
  // A frota humana entra como "frota inimiga" (o pino hostil que o globo já sabe
  // renderizar) com id estável por jogador — mover atualiza, recolher remove.
  const frotasAvisadas = new Set();   // 1 alerta de detecção por frota (senão vira spam)
  function upsertFrotaHumana(ev) {
    const d = ev.dados || {};
    if (!ev.dePais || d.lat == null) return;
    const e = jogo.estado;
    e.frotasInimigas = e.frotasInimigas || [];
    const id = `hum_${ev.dePais}_${d.id || 1}`;
    const atual = e.frotasInimigas.find((f) => f.id === id);
    const frota = {
      id, code: ev.dePais, humana: true, lat: d.lat, lng: d.lng,
      unidades: d.unidades || { navios: 4 }, presenca: d.presenca ?? 6,
    };
    // EM TRÂNSITO: a esquadra NAVEGA no seu globo igual no do dono — mesma rota,
    // mesmos horários (convertidos do relógio do servidor pro seu). O tique de
    // trânsito do globo interpola sozinho e crava no destino na hora certa.
    if (d.destino && Number.isFinite(d.chegaEm)) {
      const off = offsetServidor();
      frota.origem = { lat: d.lat, lng: d.lng };
      frota.destino = { lat: d.destino.lat, lng: d.destino.lng };
      frota.partiuEm = (d.partiuEm ?? Date.now()) - off;
      frota.chegaEm = d.chegaEm - off;
      if (Array.isArray(d.rota) && d.rota.length >= 2) frota.rota = d.rota;
    }
    if (atual) {
      // atualização de posição: limpa um trânsito antigo antes de aplicar o novo
      delete atual.origem; delete atual.destino; delete atual.partiuEm; delete atual.chegaEm; delete atual.rota;
      Object.assign(atual, frota);
    } else e.frotasInimigas.push(frota);
    const g = hooks.globoCtrl?.();
    g?.atualizar?.();
    // ÁGUAS TERRITORIAIS: frota humana perto da SUA costa → a sua defesa costeira
    // DETECTA e grita — alerta, notícia e radar no ponto. Furtividade conta: esquadra
    // só de submarinos encurta (e muito) o alcance em que você a enxerga.
    const minha = g?.ondeEsta?.(meuIso);
    if (!minha) return;
    const dist = Math.hypot(frota.lat - minha.lat, (frota.lng - minha.lng) * 0.7);
    const furt = techDaFrota(frota.unidades).furtividade ?? 30;
    const alcanceDeteccao = Math.max(4, 16 * (1 - furt / 140));
    if (dist <= alcanceDeteccao && !frotasAvisadas.has(id)) {
      frotasAvisadas.add(id);
      const nomeDono = ev.deNome ? `${ev.deNome} (${nomeDe(ev.dePais)})` : nomeDe(ev.dePais);
      alertaUrgente({ titulo: 'ESQUADRA DETECTADA NA SUA COSTA', texto: `A marinha de ${nomeDono} entrou nas suas águas territoriais.`, tom: 'ataque', comSom: false });
      tocarEfeito('radar', { volume: 0.5 });
      g?.ondaRadar?.({ lat: frota.lat, lng: frota.lng }, { cor: 0xff3b5c, max: 45 });
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚓ Defesa Costeira', cor: '#ff3b5c',
        texto: `Radar litorâneo detectou a esquadra de ${nomeDono} a ${dist.toFixed(0)}° da costa. Presença estimada: ${frota.presenca}.` }]);
      hooks.renderFeed?.();
    }
  }
  // ── RESULTADO NAVAL chega: o DONO da frota sente o golpe ────────────
  function aplicarResultadoNaval(ev) {
    const d = ev.dados || {};
    const donoIso = ev.alvo;
    if (!donoIso || !d.frotaId) return;
    const e = jogo.estado;
    const g = hooks.globoCtrl?.();
    // TODOS removem/atualizam o pino da frota atacada (adeus, navio fantasma)
    if (d.venceu && e.frotasInimigas) {
      e.frotasInimigas = e.frotasInimigas.filter((f) => f.id !== `hum_${donoIso}_${d.frotaId}`);
    }
    // O DONO aplica no próprio estado: afundou (some + tropa perdida) ou baixas — mas o
    // combate agora DEMORA (#9): ele vê os mísseis chegando na esquadra e só depois o desfecho.
    if (donoIso === meuIso) {
      const fr = (e.frotas || []).find((f) => f.id === d.frotaId);
      if (fr) {
        // JANELA DE REAÇÃO NAVAL: mísseis inbound + contagem antes do resultado registrar.
        const alvoC = g?.ondeEsta?.(meuIso); const deC = g?.ondeEsta?.(ev.dePais);
        if (alvoC && deC) { g?.desenharLinha?.(alvoC, 'ataque', 4500, deC); g?.salvaMisseis?.(alvoC, 3, deC, { som: true }); g?.ondaRadar?.(alvoC, { cor: 0x35e0ff, max: 40 }); }
        contagemIncoming({ titulo: '🚀 COMBATE NAVAL', sub: `${ev.deNome || nomeDe(ev.dePais)} atacou sua esquadra. Mísseis a caminho.`, segundos: 4, cor: '#35e0ff' }, () => {
          if (d.venceu) {
            if (fr.guarnKey && e.guarnicoes) delete e.guarnicoes[fr.guarnKey];   // a tropa AFUNDOU junto
            e.frotas = e.frotas.filter((f) => f.id !== fr.id);
            alertaUrgente({ titulo: 'SUA FROTA FOI AFUNDADA', texto: ev.texto || `${ev.deNome || nomeDe(ev.dePais)} destruiu a sua esquadra.`, tom: 'ataque', comSom: false });
            jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚓ Marinha', cor: '#ff3b5c', texto: `Perdemos a esquadra em combate contra ${nomeDe(ev.dePais)}. As unidades a bordo afundaram com ela.` }]);
          } else {
            const pct = Math.max(0, Math.min(95, d.perdaPct || 30));
            for (const k of Object.keys(fr.unidades || {})) {
              fr.unidades[k] = Math.max(0, Math.floor(fr.unidades[k] * (1 - pct / 100)));
              if (!fr.unidades[k]) delete fr.unidades[k];
            }
            if (fr.guarnKey && e.guarnicoes) e.guarnicoes[fr.guarnKey] = { ...fr.unidades };
            alertaUrgente({ titulo: 'SUA FROTA FOI ATACADA', texto: `${ev.deNome || nomeDe(ev.dePais)} atacou sua esquadra — ela resistiu com ${pct}% de baixas.`, tom: 'ataque', comSom: false });
          }
          hooks.renderFeed?.();
          hooks.globoCtrl?.()?.atualizar?.();
        });
      }
    }
    g?.atualizar?.();
  }

  // ── IMPACTO TERRITORIAL chega: o mapa de TODOS marca a conquista/conflito ──
  function aplicarImpactoTerritorial(ev, { silencioso = false } = {}) {
    const d = ev.dados || {};
    const e = jogo.estado;
    const atacante = ev.dePais;
    if (!atacante) return;
    e.donoEstado = e.donoEstado || {};
    e.conflitosEstado = e.conflitosEstado || {};
    for (const id of (d.caem || [])) {
      e.donoEstado[id] = atacante;                     // o estado MUDOU DE DONO no mapa de todos
      e.conflitosEstado[id] = { por: atacante, intensidade: 45, turnos: 0 };
    }
    for (const id of (d.conflito || [])) {
      if (!e.conflitosEstado[id]) e.conflitosEstado[id] = { por: atacante, intensidade: 30, turnos: 0 };
    }
    const g = hooks.globoCtrl?.();
    // o país atacado abre em estados no globo de quem olha (pra marca aparecer)
    if (ev.alvo) g?.carregarPais?.(ev.alvo)?.then?.(() => g?.atualizar?.());
    g?.atualizar?.();
    if (silencioso) return;
    // veio do desfecho de uma OFENSIVA (guerra_resultado): alerta o dono + feed geral
    if (ev.alvo === meuIso) {
      alertaUrgente({ titulo: 'TERRITÓRIO PERDIDO', texto: ev.texto || `${ev.deNome || nomeDe(atacante)} tomou ${d.caem?.length || 0} território(s) seu(s). Clique no seu país para ver o estrago.`, tom: 'ataque' });
    }
    jogo._empilharFeed?.([{ tipo: 'jogador', handle: ev.deNome || nomeDe(atacante), paisOrigem: atacante, paisAlvo: ev.alvo || null,
      texto: ev.texto || `Ofensiva concluída: ${d.caem?.length || 0} território(s) tomado(s).`, cor: '#ff3b5c' }]);
    hooks.renderFeed?.();
  }

  function removerFrotaHumana(ev) {
    const e = jogo.estado;
    if (!e.frotasInimigas) return;
    const prefixo = `hum_${ev.dePais}_`;
    e.frotasInimigas = e.frotasInimigas.filter((f) => !String(f.id).startsWith(prefixo));
    hooks.globoCtrl?.()?.atualizar?.();
  }

  // ── MUNDO recebido do host (convidado aplica) ──────────────────────────
  function aplicarMundo(d) {
    if (Array.isArray(d.posts) && d.posts.length) { jogo._empilharFeed?.(d.posts); hooks.renderFeed?.(); }
    // animação no globo espelhando o host (escaramuça/petróleo)
    const g = hooks.globoCtrl?.();
    if (d.anim && g) {
      const de = g.ondeEsta?.(d.anim.de); const para = g.ondeEsta?.(d.anim.para || d.anim.iso);
      if (d.anim.tipo === 'escaramuca' && de && para) { g.desenharLinha?.(para, 'ataque', 6000, de); g.salvaMisseis?.(para, 2, de, { som: false }); }
      else if (d.anim.tipo === 'petroleo' && para) g.ondaRadar?.(para, { cor: 0xffb020, max: 55 });
    }
    // relógio da sala: o período do HOST vira o período mostrado (sem mexer no turno local)
    if (Number.isFinite(d.turno)) { jogo._periodoSala = d.turno; hooks.sincronizarPeriodo?.(d.turno); }
  }

  // ── MEMÓRIA DA SALA (#8): o recém-chegado ADOTA o que já aconteceu ─────
  // Territórios tomados, conflitos e frotas no mar que rolaram ANTES dele entrar. Aplica em
  // silêncio (sem alertas/sirene — é histórico, não um ataque acontecendo agora) e reconstrói
  // o mapa. É o que faz a explosão "existir" pra quem chega depois — e pro próprio dono.
  function aplicarEstadoSala(dados) {
    if (!dados) return;
    const e = jogo.estado;
    e.donoEstado = e.donoEstado || {};
    e.conflitosEstado = e.conflitosEstado || {};
    for (const [id, iso] of Object.entries(dados.donoEstado || {})) e.donoEstado[id] = iso;
    for (const [id, c] of Object.entries(dados.conflitos || {})) {
      e.conflitosEstado[id] = { por: c.por, intensidade: c.intensidade ?? 40, turnos: 0 };
    }
    // ANEXAÇÕES QUE JÁ ROLARAM. Sem isto, quem chega tarde (ou renasce na sala com
    // outra nação, #11) via as províncias conquistadas como países soberanos: o
    // servidor mandava territórios e frotas, mas nunca "este país deixou de existir".
    // `donoDe` resolve a posse estado a estado a partir daqui, mesmo que o catálogo
    // daquele país só carregue muito depois.
    e.ocupacoes = e.ocupacoes || {};
    for (const [iso, a] of Object.entries(dados.anexacoes || {})) {
      if (iso === meuIso) continue;                       // a minha própria queda tem outro caminho
      e.ocupacoes[iso] = { ...(e.ocupacoes[iso] || {}), anexado: true, por: a.por };
      for (const est of estadosDe(iso)) e.donoEstado[est.id] = a.por;
    }
    for (const f of Object.values(dados.frotas || {})) {
      if (f?.dados && f.dePais !== meuIso) upsertFrotaHumana({ dePais: f.dePais, deNome: f.deNome, dados: f.dados });
    }
    const g = hooks.globoCtrl?.();
    // carrega em estados os países atingidos, pra as marcas aparecerem no globo de quem chega
    const atingidos = new Set([meuIso, ...Object.values(dados.donoEstado || {})]);
    Promise.all([...atingidos].filter(Boolean).map((iso) => g?.carregarPais?.(iso))).then(() => g?.atualizar?.()).catch(() => g?.atualizar?.());
  }

  // Reassume os callbacks da conexão que a home abriu (sem reconectar).
  net.setHandlers({
    onSala: (msg) => { absorverJogadores(msg.jogadores); hooks.onRoster?.(jogadores); },
    onEvento: receber,
    onConexao: (ok) => { if (badge && !ok) badge.classList.remove('online-ativo'); },
  });
  pintarBadge();

  return {
    humano,
    jogadores: () => jogadores.slice(),
    // AUTORIDADE DO MUNDO: quem é host gera o mundo ao vivo e o retransmite; convidado só aplica.
    souHost: () => !!net.estado().host,
    // MEMÓRIA DA SALA: o boot chama isto com o estado_sala que o servidor entregou no entrar.
    aplicarEstadoSala,
    relayMundo: (dados) => net.evento('mundo', null, '', dados),
    // A BATIDA do host viaja pra sala (e o servidor a cacheia pro próximo que entrar).
    relayBeat: (dados) => net.evento('beat', null, '', dados),
    // MEUS números reais (PIB/militar/petróleo/território) — todo jogador emite por
    // batida; alimenta o Índice Mundial e a força que os outros veem de mim.
    relayStats: (dados) => net.evento('stats', null, '', dados),
    // A SUA frota no mar, visível pra sala: posição/composição resumida — e a saída.
    // Horários de trânsito viajam em TEMPO DO SERVIDOR (cada cliente converte de volta).
    relayFrota: (dados) => {
      const d = { ...dados };
      const off = offsetServidor();
      if (Number.isFinite(d.partiuEm)) d.partiuEm += off;
      if (Number.isFinite(d.chegaEm)) d.chegaEm += off;
      net.evento('frota_pos', null, '', d);
    },
    relayFrotaSaiu: (frotaId) => net.evento('frota_out', null, '', { id: frotaId }),
    // VOCÊ agiu sobre um país. Se for humano, dispara o alerta pra ele. Sempre publica
    // no feed da sala (todos veem o impacto — é o World Trends).
    notificar: (tipo, alvoIso, texto, dados) => {
      // CASCATA LOCAL: se o que eu fiz foi hostil e o alvo tem bloco, o bloco inteiro
      // me vira as costas AQUI (os países ficam vermelhos no meu mapa na hora).
      if (HOSTIL.has(tipo) && alvoIso) cascataAoAtacar(alvoIso);
      net.evento(tipo, alvoIso, texto, dados);
    },
    // PACTO É FATO PÚBLICO: anuncia a aliança pra sala inteira (todos passam a saber
    // quem é aliado de quem — é o que faz a cascata funcionar pros não-membros).
    anunciarAlianca: (al) => net.evento('alianca_publica', null, `${al.nome} foi selada.`, { alianca: al }),
    ehHumano: (iso) => porPais.has(iso),
  };
}
