// ═══════════════════════════════════════════════════════════════════════
// PLANEJADOR DE OFENSIVA
// ═══════════════════════════════════════════════════════════════════════
// Você monta a força expedicionária (quais unidades, quantas), escolhe DE ONDE ela
// parte, vê poder/custo/prognóstico ao vivo, e assiste à batalha rodada a rodada.
//
// TRÊS COISAS QUE ESTAVAM QUEBRADAS E FORAM CONSERTADAS AQUI:
//
// 1. NÃO DAVA PRA SAIR. Sem X, sem Esc, sem clique-fora. A janela era uma armadilha.
//    Agora: X no topo, Esc, e clique no fundo — todos travados só durante a batalha,
//    que é o único momento em que sair no meio quebraria o estado.
//
// 2. VOCÊ NUNCA VIA O ATAQUE. A esquadrilha 3D decolava atrás de um modal opaco que
//    cobria o globo inteiro. Estava tudo lá e ninguém nunca viu. Agora o painel se
//    recolhe pro canto (classe .assistindo) e você ASSISTE os caças saindo, os mísseis
//    riscando o planeta e o impacto no alvo. Depois ele volta com a batalha.
//
// 3. EMOJI. ⚔️🚫🪖 num jogo que quer ser um centro de comando. Tudo Lucide agora.
import { avaliarGuerra, resolverGuerra, sugerirDeploy, combustivelDaGuerra } from '../jogo/guerra.js';
import { iniciarOperacaoGuerra } from '../jogo/ofensiva.js';
import { UNIDADES, DOMINIOS, poderDeploy, custoDeploy, alcanceDoDeploy } from '../dados/forcas.js';
import { basesQueAlcancam } from '../dados/bases.js';
import { PAISES, dePais } from '../dados/paises.js';
import { bandeira, ISO2_DE, FOTO_UNIDADE, FOTO_RECURSO } from '../dados/imagens.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { dinheiro } from '../jogo/formato.js';
import { upkeepDe, ANEXACAO_TURNOS_ESTAVEL, ANEXACAO_INSURGENCIA_MAX } from '../jogo/manutencao.js';
import { sirene, flashTela } from './efeitos.js';
import { rodarLoading } from './loadingGuerra.js';
import { ico, ICO } from './icones.js';
import { q } from './tip.js';
import { bandeiraDeFeature } from '../dados/imagens.js';
import { liderDe } from '../dados/lideres.js';
import { chamarIA } from '../maquina/openrouter.js';
import { estadosDe, estadosCarregados } from '../jogo/territorio.js';
import { planoDeCampanha } from '../jogo/campanha.js';
import { iso as isoDe } from '../dados/paises.js';
import { abrirMapaEstados } from './mapaEstados.js';
import { dispararBreaking } from './breaking.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const PA_GUERRA = 2;
// A CENA PRINCIPAL DO JOGO. 8s era um piscar — o jogador mal via o que tinha feito.
// 60s deixa a ofensiva RESPIRAR: os caças cruzam o oceano, os navios navegam devagar,
// os despachos chegam com intervalo de noticiário, e a tensão acumula.
const DUR_VOO = 58000;

export function abrirGuerra(feature, jogo, { onFim, onLancar, origemCasa } = {}) {
  const av = avaliarGuerra(jogo.estado, feature);
  const semPA = jogo.estado.pontos_acao < PA_GUERRA;
  let deploy = { ...av.sugestao };

  const disponiveis = UNIDADES.filter((u) => (jogo.estado.forcas?.[u.id] || 0) > 0);
  // O que ESTE país opera de verdade (F-35 se EUA, Gripen se Brasil).
  const equip = equipamentosDoPais(jogo.estado.iso || 'USA');

  // ── PONTOS DE LANÇAMENTO ────────────────────────────────────────────
  // Território nacional é sempre uma opção. Bases que alcançam o alvo são melhores:
  // mais poder efetivo, menos custo logístico. É pra isso que servem bases.
  const alvoCoord = coordDe(feature);
  const bases = basesQueAlcancam(jogo.estado, alvoCoord);
  // ── ALCANCE: dá pra CHEGAR no alvo? ─────────────────────────────────
  // Distância de casa até o alvo (km). Se uma base avançada alcança, resolvido. Senão,
  // depende dos ativos enviados: sem porta-aviões/mísseis/bombardeiro, você não cruza
  // um oceano — só ataca vizinho. É o que impede "atacar o Japão com 3 caças".
  const distAlvo = origemCasa && alvoCoord ? distanciaKmSimples(origemCasa, alvoCoord) : 0;
  const alcancarComDeploy = (d) => {
    if (bases.length) return { ok: true, via: 'base' };
    const r = alcanceDoDeploy(d);
    return { ok: distAlvo <= r, via: 'casa', reach: r, dist: Math.round(distAlvo) };
  };
  const pontos = [
    { id: 'casa', nome: 'Território Nacional', sub: 'Travessia completa · sem bônus',
      ic: 'home', poder: 1, desconto: 0, coord: null },
    ...bases.map((b) => ({
      id: b.id, nome: b.nome, iso: b.iso,
      sub: `${b.tipoInfo.nome} · ${b.paisNome} · ${b.dist.toLocaleString('pt-BR')} km do alvo`,
      ic: b.tipoInfo.ic, poder: b.poder, desconto: b.desconto,
      coord: { lat: b.lat, lng: b.lng }, nota: b.nota,
    })),
  ];
  // A melhor base já vem escolhida — ninguém ataca de casa tendo base ao lado.
  let ponto = pontos[1] || pontos[0];
  // ALVO PRIORITÁRIO: os estados do país-alvo, pra o jogador definir a estratégia no
  // MAPA — quais estados tomar primeiro. Só existe se os estados já foram carregados.
  const estadosAlvo = estadosDe(isoDe(feature));
  const nomeEstado = (id) => estadosAlvo.find((e) => e.id === id)?.nome || id;
  let prioridades = [];

  const modal = document.createElement('div');
  modal.className = 'modal-fundo guerra-modal';
  modal.innerHTML = `<div class="guerra-painel">
    <div class="gp-cab">
      <span class="gp-ic">${ico('swords', 24)}</span>
      <div class="gp-tit">
        <h2>Ofensiva contra ${esc(av.nome)}</h2>
        <div class="gp-sub">Monte a força expedicionária</div>
      </div>
      ${av.iso && ISO2_DE[av.iso] ? `<img class="gp-flag" src="${bandeira(ISO2_DE[av.iso], 80)}" alt="">` : ''}
      <button class="pp-fechar" id="gp-x" title="Fechar (Esc)">${ico('x', 16)}</button>
    </div>

    <div class="gp-forcas">
      <div class="gp-lado meu">
        <div class="gpl-rot">Força enviada</div>
        <div class="gpl-num" id="gp-poder">0</div>
        <div class="gpl-det">de ${av.forcaTotal} · moral ${av.moral}%</div>
      </div>
      <div class="gp-vs" id="gp-odds">VS</div>
      <div class="gp-lado dele">
        <div class="gpl-rot">${esc(av.nome)}</div>
        <div class="gpl-num">${av.inimigo}</div>
        <div class="gpl-det">${av.coalizao.poderExtra > 0
          ? `${av.soAlvo} dele <b class="gpl-mais">+ ${av.coalizao.poderExtra} de aliados</b>`
          : 'defensor em casa, sozinho'}</div>
      </div>
    </div>

    ${/* A COALIZÃO, item por item. Isto tinha de estar ANTES do botão de lançar: o
         planejador mostrava só a força do alvo, e o bloco aparecia como um aviso vago
         de "suas relações vão despencar". O jogador atacava o Brasil achando que
         enfrentaria 48. Agora ele lê, linha por linha, quem vem e POR QUÊ — e o porquê
         é sempre uma relação que ele mesmo construiu. É o que torna a coalizão jogável:
         dá pra desmontá-la com diplomacia antes de atirar. */''}
    ${av.coalizao.membros.length ? `<div class="gp-coalizao">
      <div class="gp-coa-cab">${ico('users', 14)} <b>${esc(av.coalizao.blocoNome || 'Aliados')}</b> entra na guerra ao lado ${esc(dePais(av.nome))}
        <span class="gp-coa-tot">+${av.coalizao.poderExtra}</span></div>
      ${av.coalizao.membros.map((m) => `<div class="gp-coa-item">
        <img class="gp-coa-flag" src="${bandeira(ISO2_DE[m.iso], 40) || ''}" alt="" onerror="this.style.visibility='hidden'">
        <span class="gp-coa-nome">${esc(m.nome)}</span>
        <span class="gp-coa-motivo">${esc(m.motivo)}</span>
        <span class="gp-coa-poder">+${m.poder}</span>
      </div>`).join('')}
    </div>` : ''}

    ${av.bloco.paises.length ? `<div class="gp-alerta">${ico('triangle-alert', 15)}
      <span><b>${esc(av.bloco.blocoNome)}</b> vai reagir: ${av.bloco.paises.map(esc).join(', ')} — suas relações com todos eles vão despencar.</span></div>` : ''}

    <div id="gp-plano">
      <div class="gp-sec">
        <span class="gp-lab2">${ico('crosshair', 12)} Ponto de lançamento</span>
        ${bases.length ? `<span class="gp-hint">${bases.length} base(s) ao alcance</span>`
          : `<span class="gp-hint fraco">Nenhuma base ao alcance</span>`}
      </div>
      <div class="gp-pontos" id="gp-pontos">${pontos.map((p, i) => cardPonto(p, i)).join('')}</div>

      ${estadosAlvo.length ? `<div class="gp-sec">
        <span class="gp-lab2">${ico('target', 12)} Eixo de avanço ${q('Abra o mapa do país e escolha QUAIS estados tomar primeiro — na ordem que clicar. Marque um como alvo principal (o eixo do avanço). Sem escolha, a ofensiva avança pela fronteira mais próxima.', { t: 'Estratégia da campanha', k: 'ESCOLHER NO MAPA', cor: 'perigo' })}</span>
      </div>
      <button class="gp-eixo" id="gp-eixo" type="button">
        <span class="gpe-ic">${ico('map', 15)}</span>
        <span class="gpe-txt" id="gpe-txt">Definir estratégia no mapa</span>
        <span class="gpe-seta">${ico('chevron-right', 14)}</span>
      </button>` : ''}

      <div class="gp-sec">
        <span class="gp-lab2">${ico('shield', 12)} Composição da força</span>
        <div class="gp-presets">
          <button class="gp-preset" data-p="sug">Sugerida</button>
          <button class="gp-preset" data-p="tudo">Tudo</button>
          <button class="gp-preset" data-p="zero">Zerar</button>
        </div>
      </div>
      <div class="gp-unidades">${DOMINIOS.map((d) => {
        const us = disponiveis.filter((u) => u.dominio === d);
        if (!us.length) return '';
        return `<div class="gpu-dom"><div class="gpu-dom-rot">${ico(ICO[d] || 'circle', 11)} ${d}</div>
          ${us.map((u) => {
            const disp = jogo.estado.forcas[u.id];
            // FOTO REAL do que o país opera, não um ícone genérico. O pedido foi
            // literal: "aparecesse a foto do meu arsenal, veículos como cadastrado
            // já no sistema" — então puxamos de equipamentos.js, que sabe que o
            // caça dos EUA é F-35 e o do Brasil é Gripen.
            const eq = equip?.[u.id];
            const foto = eq?.foto || FOTO_UNIDADE[u.id];
            return `<div class="gpu-linha">
              <span class="gpu-foto">${foto ? `<img src="${foto}" alt="" loading="lazy">` : ico(ICO[u.id] || 'circle', 14)}</span>
              <span class="gpu-nome">
                <b>${esc(eq?.nome || u.nome)}</b>
                <small>${esc(eq ? u.nome : '—')}</small>
              </span>
              <input type="range" class="gpu-slider" data-u="${u.id}" min="0" max="${disp}" step="${u.passo}" value="${deploy[u.id] || 0}" />
              <span class="gpu-qtd" id="q-${u.id}">0</span>
              <span class="gpu-disp">/ ${disp.toLocaleString('pt-BR')}</span>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}</div>

      <div class="gp-rodape">
        <div class="gpr-item"><span>Custo de transporte</span><b id="gp-custo">—</b></div>
        <div class="gpr-item"><span>Combustível</span><b id="gp-comb">—</b></div>
        <div class="gpr-item"><span>Seu caixa</span><b>${dinheiro(jogo.estado.tesouro)}</b></div>
        <div class="gpr-item"><span>Previsão</span><b id="gp-prog">—</b></div>
      </div>
      <div class="gp-previa" id="gp-previa"></div>
      <div class="gp-oleo" id="gp-oleo"></div>
      ${semPA ? `<div class="gp-bloqueio">${ico('ban', 14)} Sem pontos de ação — a ofensiva custa ${PA_GUERRA} PA.</div>` : ''}
      <div class="gp-bloqueio" id="gp-erro" style="display:none"></div>
      <button class="gp-lancar" id="gp-lancar" ${semPA ? 'disabled' : ''}>
        ${ico('swords', 17)} <span>LANÇAR OFENSIVA</span>
      </button>
    </div>

    <div id="gp-voo" class="gp-voo"></div>
    <div id="gp-batalha" class="gp-batalha"></div>
  </div>`;
  document.body.appendChild(modal);

  // ── SAÍDA ───────────────────────────────────────────────────────────
  // Travada só durante a batalha: sair no meio deixaria o estado pela metade.
  let emBatalha = false;
  const timers = [];   // ondas agendadas — precisam morrer se o modal fechar
  const fechar = () => {
    modal.remove();
    document.removeEventListener('keydown', aoTeclar);
    for (const t of timers) clearTimeout(t);
  };
  const sair = () => { if (!emBatalha) { fechar(); onFim?.(); } };
  function aoTeclar(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', aoTeclar);
  modal.querySelector('#gp-x').addEventListener('click', sair);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) sair(); });

  function cardPonto(p, i) {
    const bonus = p.poder > 1;
    return `<button class="gp-ponto ${i === pontos.indexOf(ponto) ? 'sel' : ''}" data-i="${i}">
      <span class="gpp-ic">${ico(p.ic, 16)}</span>
      <span class="gpp-txt">
        <b>${esc(p.nome)}</b>
        <small>${esc(p.sub)}</small>
      </span>
      ${bonus ? `<span class="gpp-bonus">+${Math.round((p.poder - 1) * 100)}% força<br><i>−${Math.round(p.desconto * 100)}% custo</i></span>` : ''}
    </button>`;
  }

  function renderPontos() {
    const cont = modal.querySelector('#gp-pontos');
    cont.innerHTML = pontos.map((p, i) => cardPonto(p, i)).join('');
    cont.querySelectorAll('.gp-ponto').forEach((b) => b.addEventListener('click', () => {
      ponto = pontos[Number(b.dataset.i)];
      renderPontos(); atualizar();
    }));
  }

  function atualizar() {
    const poderBruto = poderDeploy(deploy);
    const poder = Math.round(poderBruto * ponto.poder);            // a base multiplica
    const custo = round2(custoDeploy(deploy) * (1 - ponto.desconto)); // e desconta a logística

    // COMBUSTÍVEL: fatura que escala com o Brent (ver jogo/guerra.js).
    const comb = combustivelDaGuerra(jogo.estado, deploy, custo);
    const custoTotal = round2(custo + comb.custoExtra);
    const moralEfetiva = (av.moral / 100) * (comb.estrangulado ? 0.82 : 1);
    const efetiva = poder * moralEfetiva + (jogo.estado.ogivas || 0) * 3;
    const razao = efetiva / Math.max(1, av.inimigo);

    // ── PRÉVIA DO ALVO ──────────────────────────────────────────────
    // "O que será atacado": com ESTA força, quantos territórios você tende a tomar, e se
    // a capital cai ou resiste (a reserva do inimigo a blinda até você vir esmagador).
    const previa = modal.querySelector('#gp-previa');
    if (previa) {
      if (poder <= 0 || !estadosCarregados() || !estadosDe(av.iso).length) previa.innerHTML = '';
      else {
        const pl = planoDeCampanha(jogo.estado, av.iso, razao, ponto.coord || null, prioridades.length ? prioridades : null);
        const capTxt = pl.tomouCapital ? '<b class="bom">a capital cai</b>'
          : pl.capitalResistiu ? '<b class="ruim">a capital resiste</b> — reserva do inimigo'
            : 'capital exposta';
        const total = pl.tomouCapital && pl.caem.length >= pl.total && pl.total > 0;
        previa.innerHTML = `${ico('crosshair', 12)} <b>Prévia:</b> você tende a tomar <b>${pl.caem.length}</b> de <b>${pl.total}</b> territórios · ${capTxt}${total ? ' · <b class="bom">CONQUISTA TOTAL!</b>' : ''}`;
      }
    }

    modal.querySelector('#gp-poder').textContent = poder;
    modal.querySelector('#gp-custo').textContent = dinheiro(custo);
    const elC = modal.querySelector('#gp-comb');
    elC.textContent = comb.custoExtra > 0 ? dinheiro(comb.custoExtra) : '—';
    elC.className = comb.estrangulado ? 'ruim' : comb.importador ? 'amb' : 'bom';

    const oleo = modal.querySelector('#gp-oleo');
    if (comb.consumo > 0) {
      oleo.style.display = '';
      oleo.className = `gp-oleo ${comb.estrangulado ? 'falta' : comb.importador ? 'aviso' : ''}`;
      // ENXUTO: uma linha direta (consumo · origem · custo) + um "?" que abre o detalhe.
      // O texto longo que ele reclamou virou o tooltip, não o modal.
      const rot = comb.estrangulado ? 'GARGALO DE COMBUSTÍVEL' : comb.importador ? 'COMBUSTÍVEL IMPORTADO' : 'COMBUSTÍVEL PRÓPRIO';
      const origem = comb.importador ? `importa ${Math.abs(comb.folga).toFixed(1)} mi/dia` : 'autossuficiente';
      const detalhe = comb.estrangulado
        ? `A campanha queima ${comb.consumo} Mb/d com o barril a US$ ${comb.preco.toFixed(0)}${comb.inflacao > 5 ? ` (+${comb.inflacao}% acima do normal)` : ''}. Você importa ${Math.abs(comb.folga).toFixed(1)} Mb/d e o preço está alto: ${dinheiro(comb.custoExtra)} só de combustível, e a moral cai 18% — o comboio de reabastecimento virou o gargalo. Rommel parou no Egito por falta de diesel, não de tanque.`
        : comb.importador
          ? `A campanha queima ${comb.consumo} Mb/d com o barril a US$ ${comb.preco.toFixed(0)}. Como importamos ${Math.abs(comb.folga).toFixed(1)} Mb/d, cada gota paga mais caro: ${dinheiro(comb.custoExtra)}. Acima de US$ 120 o barril, a moral começa a sangrar.`
          : `A campanha queima ${comb.consumo} Mb/d com o barril a US$ ${comb.preco.toFixed(0)}. O combustível sai do nosso próprio poço: ${dinheiro(comb.custoExtra)}. Guerra de quem tem petróleo é mais barata, e sempre foi.`;
      oleo.innerHTML = `${ico('fuel', 14)}
        <span class="gpo-l"><b>${comb.consumo} mi barris/dia</b> · ${origem} · <b>${dinheiro(comb.custoExtra)}</b></span>
        <span class="gpo-rot">${rot}</span>
        ${q(detalhe, { t: 'Combustível da campanha', k: 'LOGÍSTICA', cor: comb.estrangulado ? 'perigo' : 'ambar' })}`;
    } else oleo.style.display = 'none';

    const semGrana = custoTotal > jogo.estado.tesouro;
    const semForca = poder <= 0;
    // ALCANCE: dá pra chegar com ESTA composição? (recalcula porque depende do que enviou —
    // botar um porta-aviões/míssil na força destrava o ataque transoceânico)
    const chega = alcancarComDeploy(deploy);
    const semAlcance = !semForca && !chega.ok;

    let prog = '—'; let cls = '';
    if (!semForca) {
      if (razao >= 2) { prog = 'Rolo compressor'; cls = 'bom'; }
      else if (razao >= 1.3) { prog = 'Favorável'; cls = 'bom'; }
      else if (razao >= 0.9) { prog = 'No fio da navalha'; cls = 'medio'; }
      else { prog = 'Suicídio'; cls = 'ruim'; }
    }
    const el = modal.querySelector('#gp-prog');
    el.textContent = prog; el.className = cls;
    modal.querySelector('#gp-odds').textContent = semForca ? 'VS' : `${razao.toFixed(1)}×`;
    modal.querySelector('#gp-custo').className = semGrana ? 'ruim' : '';

    const erro = modal.querySelector('#gp-erro');
    const btn = modal.querySelector('#gp-lancar');
    if (semForca) { erro.style.display = ''; erro.innerHTML = `${ico('ban', 14)} Designe ao menos uma unidade para a ofensiva.`; }
    else if (semAlcance) { erro.style.display = ''; erro.innerHTML = `${ico('ban', 14)} FORA DE ALCANCE: o alvo está a ${chega.dist.toLocaleString('pt-BR')} km e sua força chega a ${chega.reach.toLocaleString('pt-BR')} km. Inclua porta-aviões, mísseis ou bombardeiros — ou tome uma base mais perto.`; }
    else if (semGrana) { erro.style.display = ''; erro.innerHTML = `${ico('ban', 14)} Sem recursos: logística ${dinheiro(custo)} + combustível ${dinheiro(comb.custoExtra)} = ${dinheiro(custoTotal)}, e você tem ${dinheiro(jogo.estado.tesouro)}.`; }
    else erro.style.display = 'none';
    btn.disabled = semPA || semForca || semGrana || semAlcance;

    for (const u of UNIDADES) {
      const q = modal.querySelector(`#q-${u.id}`);
      if (q) q.textContent = (deploy[u.id] || 0).toLocaleString('pt-BR');
    }
  }

  modal.querySelectorAll('.gpu-slider').forEach((s) => s.addEventListener('input', (ev) => {
    deploy[ev.target.dataset.u] = Number(ev.target.value);
    atualizar();
  }));
  modal.querySelectorAll('.gp-preset').forEach((b) => b.addEventListener('click', () => {
    const p = b.dataset.p;
    if (p === 'sug') deploy = sugerirDeploy(jogo.estado, av.inimigo);
    else if (p === 'tudo') { deploy = {}; for (const u of disponiveis) deploy[u.id] = jogo.estado.forcas[u.id]; }
    else deploy = {};
    modal.querySelectorAll('.gpu-slider').forEach((s) => { s.value = deploy[s.dataset.u] || 0; });
    atualizar();
  }));
  renderPontos();
  atualizar();

  // ── LANÇAR ──────────────────────────────────────────────────────────
  modal.querySelector('#gp-eixo')?.addEventListener('click', () => {
    // Estados que JÁ são meus neste país (de um ataque anterior) — o mapa mostra e não
    // deixa re-selecionar: um 2º ataque parte do que já domino.
    const euIso = jogo.estado.iso || 'USA';
    const alvoIso = isoDe(feature);
    const dominados = Object.entries(jogo.estado.donoEstado || {})
      .filter(([id, dono]) => dono === euIso && id.split('-')[0] === alvoIso)
      .map(([id]) => id);
    abrirMapaEstados(alvoIso, av.nome, {
      atual: prioridades, dominados,
      onConfirmar: (ids) => {
        prioridades = ids;
        const txt = modal.querySelector('#gpe-txt');
        const eixo = modal.querySelector('#gp-eixo');
        if (txt) txt.textContent = ids.length ? `${ids.length} alvo(s) · principal: ${nomeEstado(ids[0])}` : 'Definir estratégia no mapa';
        eixo?.classList.toggle('ativo', ids.length > 0);
      },
    });
  });

  modal.querySelector('#gp-lancar')?.addEventListener('click', () => {
    if ((jogo.estado.pontos_acao || 0) < PA_GUERRA) {
      const e = modal.querySelector('#gp-erro'); e.style.display = ''; e.innerHTML = `${ico('ban', 14)} Sem pontos de ação.`; return;
    }
    const custoFinal = round2(custoDeploy(deploy) * (1 - ponto.desconto));
    // OFENSIVA COM TEMPO: não resolve na hora — vira uma OPERAÇÃO que se monta em N batidas.
    // O alvo pode detectar e reforçar; a batalha resolve quando o preparo amadurece (motor).
    const r = iniciarOperacaoGuerra(jogo.estado, feature, deploy, {
      multPoder: ponto.poder, custo: custoFinal,
      origem: ponto.coord || null,
      prioridade: prioridades.length ? prioridades : null,
    });
    if (r.falha) {
      const e = modal.querySelector('#gp-erro'); e.style.display = ''; e.innerHTML = `${ico('ban', 14)} ${esc(r.falha)}`; return;
    }
    jogo.estado.pontos_acao -= PA_GUERRA;
    onLancar?.({ op: r.op, alvoEstado: null, duracaoTotal: r.op.total });
    onFim?.();   // atualiza HUD (caixa/forças debitados)
    fechar();
  });

  // ── A CINEMÁTICA ────────────────────────────────────────────────────
  // O modal SOME por completo. O globo fica sozinho no palco com a barra de loading
  // embaixo e os despachos nascendo em cima do país atingido. Só quando a poeira
  // baixa o painel volta com o resultado.
  //
  // A versão anterior encolhia o modal pro canto — melhor que cobrir o globo, mas
  // ainda era uma janela disputando atenção com a animação. Agora não disputa nada.
  async function cinematica(res) {
    const g = window.__globo;
    modal.classList.add('oculto');

    if (g) {
      g.focar?.(feature);                                  // a câmera vai pro alvo
      g.desenharLinha?.(feature, 'ataque', DUR_VOO + 2000, ponto.coord);
      // Mísseis primeiro: o soco. Depois a esquadrilha: a ocupação do ar.
      if (deploy.misseis) g.salvaMisseis?.(feature, Math.min(10, Math.ceil(deploy.misseis / 30)), ponto.coord);
      await espera(400);
      if (deploy.cacas || deploy.bombardeiros) g.lancarEsquadrilha?.(feature, 'ataque', ponto.coord);
      // Navio vai pelo MAR (rasante, seguindo a curvatura) e demora — por isso sai
      // primeiro. Submarino vai por baixo. Cada um no seu domínio (ver DOMINIO em globo.js).
      if (deploy.navios) g.lancarEsquadrilha?.(feature, 'naval', ponto.coord);
      if (deploy.porta_avioes) g.lancarEsquadrilha?.(feature, 'frota', ponto.coord);
      if (deploy.submarinos) g.lancarEsquadrilha?.(feature, 'submarino', ponto.coord);
      // Se você só mandou tropa terrestre, ainda assim tem de sair algo do chão.
      if (!deploy.cacas && !deploy.bombardeiros && !deploy.navios && !deploy.misseis) {
        g.lancarEsquadrilha?.(feature, 'ataque', ponto.coord);
      }

      // ONDAS: a cena dura ~1 minuto. Um único disparo no segundo zero deixaria 55s
      // de globo vazio. Então a ofensiva vem em levas, como uma campanha de verdade.
      const ondas = [];
      for (let i = 1; i <= 4; i += 1) {
        ondas.push(setTimeout(() => {
          if (deploy.misseis) g.salvaMisseis?.(feature, Math.min(6, Math.ceil(deploy.misseis / 60)), ponto.coord);
          if (deploy.cacas) g.lancarEsquadrilha?.(feature, 'ataque', ponto.coord);
          g.desenharLinha?.(feature, 'ataque', 12000, ponto.coord);
        }, i * (DUR_VOO / 5)));
      }
      timers.push(...ondas);
    }

    // O MUNDO REAGE EM CENA: os aliados do alvo entram em modo alerta no mapa
    // (anéis âmbar + marcador de sirene) e soltam reações dos próprios territórios.
    const reagentes = (av.bloco.isos || []).slice(0, 4).map((code) => ({
      iso: code,
      nome: PAISES[code]?.nome || code,
      alvoNome: av.nome,
      postura: 'condena',
    }));
    if (reagentes.length) g?.alertaTemporario?.(reagentes.map((r) => r.iso), DUR_VOO + 4000);

    // A LINHA DE FRENTE AVANÇA EM CENA, junto com os despachos — não depois deles.
    // Cada estado que cai acende âmbar no mapa e dispara um radar. O jogador assiste
    // a conquista acontecer em vez de ler "territórios +1" no fim. Os dois rodam em
    // paralelo de propósito: a manchete de rádio e a bota no chão são o mesmo evento.
    const nQueda = res.campanha?.caem?.length || 0;
    const revelacao = nQueda
      ? g?.revelarConquista?.(res.campanha, {
        // espalha as quedas ao longo da cinemática, com piso pra não virar estroboscópio
        intervalo: Math.max(420, Math.floor((DUR_VOO * 0.75) / nQueda)),
        aoCair: (e) => g?.balao?.({ lat: e.lat, lng: e.lng }, `${e.nome} caiu`, 'aviso'),
      })
      : null;

    // Os despachos rodam NO MAPA, com o globo livre pra você arrastar e olhar.
    await rodarLoading({
      globo: g, coord: alvoCoord, iso: av.iso, nome: av.nome,
      deploy, venceu: res.venceu, petro: res.petroleo, dur: DUR_VOO,
      reagentes,
      // A IA precisa saber QUEM está atacando pra escrever a cobertura certa.
      atacante: jogo.ficha.pais,
      presidente: jogo.estado.presidenteNome || jogo.ficha.presidente,
    });
    await revelacao;
    // o modelo já mudou de dono em resolverGuerra; a partir daqui quem pinta é o
    // `tatico.js` com as cores de verdade, então o overlay da revelação sai
    g?.limparRevelacao?.();

    modal.classList.remove('oculto');
    await animarBatalha(modal.querySelector('#gp-batalha'), res, av);
  }
}

// Coordenada de um alvo (feature do GeoJSON tem LABEL_X/LABEL_Y).
function coordDe(feature) {
  const p = feature?.properties;
  if (!p) return null;
  const lat = Number(p.LABEL_Y); const lng = Number(p.LABEL_X);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

// Distância em km entre dois {lat,lng} (haversine) — pra decidir se o ataque ALCANÇA.
function distanciaKmSimples(a, b) {
  if (!a || !b) return 0;
  const R = 6371; const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

async function animarBatalha(alvo, res, av) {
  alvo.innerHTML = `<div class="gb-cab">${ico('swords', 14)} Ofensiva em curso</div>
    <div class="gb-barras">
      <div class="gb-b meu"><span>Sua força</span><div class="gb-track"><div class="gb-fill meu" id="gb-meu" style="width:100%"></div></div></div>
      <div class="gb-b dele"><span>${esc(av.nome)}</span><div class="gb-track"><div class="gb-fill dele" id="gb-ini" style="width:100%"></div></div></div>
    </div>
    <div class="gb-log" id="gb-log"></div>`;
  const log = alvo.querySelector('#gb-log');
  const bMeu = alvo.querySelector('#gb-meu');
  const bIni = alvo.querySelector('#gb-ini');
  const meu0 = res.rounds[0] ? res.rounds[0].meu + res.rounds[0].baixasMinhas : 1;
  const ini0 = res.rounds[0] ? res.rounds[0].ini + res.rounds[0].baixasDele : 1;

  for (const r of res.rounds) {
    await espera(850);
    bMeu.style.width = `${Math.max(0, (r.meu / meu0) * 100)}%`;
    bIni.style.width = `${Math.max(0, (r.ini / ini0) * 100)}%`;
    log.insertAdjacentHTML('beforeend',
      `<div class="gb-linha"><b>Rodada ${r.n}</b> · você perde <span class="neg">−${r.baixasMinhas}</span> · inimigo perde <span class="pos">−${r.baixasDele}</span></div>`);
    log.scrollTop = log.scrollHeight;
  }
  await espera(600);
}

// ── DESFECHO EM CARROSSEL ──────────────────────────────────────────────
// O que isto substitui: um modal único com mil informações empilhadas. Agora é uma
// prestação de contas encenada, na linguagem do turno — veredito forte, PLACAR de
// territórios (dominados × os que ainda resistem), espólio, e a RESPOSTA do país
// atacado gerada por IA com tom de comunicado moderno. Pouco por página, clímax no fim.
// "Baque": a cada página os cards CAEM na tela e a moldura leva um tranco. É só um
// gatilho — as animações de entrada moram no CSS (.gdw-super/.gws-cel/.gdw-baixa),
// disparadas naturalmente porque cada passo() reescreve o innerHTML. Aqui só somamos
// o tremor da moldura pra dar o "boom".
function baque(page) {
  const q = page?.closest?.('.gdw');
  if (!q) return;
  q.classList.remove('gdw-baque');
  // força reflow pra a animação re-disparar mesmo no mesmo elemento
  void q.offsetWidth;
  q.classList.add('gdw-baque');
}

export function desfechoCarrossel(container, res, jogo, feature, aoFim) {
  const cmp = res.campanha || { caem: [], resistem: [], total: 0, fracao: res.venceu ? 1 : 0 };
  const leitura = res.leitura || { rot: res.venceu ? 'VITÓRIA' : 'DERROTA', cls: res.venceu ? 'ok' : 'fail', txt: '' };
  const pct = Math.round((cmp.fracao || 0) * 100);
  const defensor = res.av.nome;
  const bd = bandeiraDeFeature(feature, 80);

  // Dispara a resposta do país JÁ — enquanto o jogador lê as primeiras páginas, a IA
  // escreve. Na página final, o texto (ou o fallback forte) já está pronto.
  const respostaP = gerarRespostaPais(res, jogo).catch(() => null);

  // Cada baixa é um CHIP com a foto real do equipamento (tanque, caça, bateria…) e
  // fallback pro ícone se a imagem falhar. As baixas caem na tela em sequência (stagger).
  const chipBaixa = (p, k, lado) => {
    const foto = FOTO_UNIDADE[p.id];
    return `<span class="gdw-baixa ${lado}" style="animation-delay:${(0.1 + k * 0.08).toFixed(2)}s">
      <span class="gbx-foto">${foto
        ? `<img src="${foto}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="gbx-emoji" style="display:none">${ico(ICO[p.id] || 'circle', 15)}</span>`
        : `<span class="gbx-emoji" style="display:grid">${ico(ICO[p.id] || 'circle', 15)}</span>`}</span>
      <span class="gbx-info"><b class="gbx-n">−${p.perdido.toLocaleString('pt-BR')}</b> <span class="gbx-nome">${esc(p.nome)}</span>${p.enviado ? ` <i>de ${p.enviado.toLocaleString('pt-BR')}</i>` : ''}</span>
    </span>`;
  };
  const perdas = res.perdas.map((p, k) => chipBaixa(p, k, 'meu')).join('');
  const perdasIni = (res.perdasInimigo || []).map((p, k) => chipBaixa(p, k, 'ini')).join('');
  const totalBaixas = res.perdas.reduce((s, p) => s + (p.perdido || 0), 0);
  const totalEnviado = res.perdas.reduce((s, p) => s + (p.enviado || 0), 0);
  const totalBaixasIni = (res.perdasInimigo || []).reduce((s, p) => s + (p.perdido || 0), 0);

  const paginas = [];

  // 0 · OCUPAÇÃO TOTAL — o país caiu POR INTEIRO (todos os estados são seus). Mas isto é
  // DOMÍNIO MILITAR, não posse: o país entra em ocupação (insurgência + upkeep) e só a
  // ANEXAÇÃO — depois de segurar o controle estável — o torna seu de vez. A tela é âmbar
  // (alerta operacional), não dourada (o ouro fica pra cena de anexação, o clímax real).
  if (res.conquistaTotal) {
    const oc = jogo.estado.ocupacoes?.[res.av.iso] || {};
    const conq = (jogo.estado.conquistados || []).find((c) => c.iso === res.av.iso) || { iso: res.av.iso, insurgencia: 35, desde: 0 };
    const uk = upkeepDe(jogo.estado, conq);
    const turnosEstavel = oc.turnosEstavel || 0;
    const pctEstavel = Math.min(100, Math.round((turnosEstavel / ANEXACAO_TURNOS_ESTAVEL) * 100));
    const insOk = (conq.insurgencia || 0) <= ANEXACAO_INSURGENCIA_MAX;
    paginas.push({
      classe: 'gdw-vrd gdw-ok gdw-conq',
      cab: `${ico('flag', 13)} DOMÍNIO MILITAR TOTAL · ${esc(defensor.toUpperCase())}`,
      btn: 'VER O RELATÓRIO',
      corpo: `
        <div class="gdw-selo">${ico('flag', 44)}</div>
        <div class="gdw-super ok">${esc(defensor.toUpperCase())} ESTÁ OCUPADO — AINDA NÃO É SEU</div>
        <h1 class="gdw-tit">A bandeira caiu. O país, ainda não.</h1>
        ${bd ? `<div class="gdw-flagcai"><img src="${bd}" alt=""></div>` : ''}
        <div class="gdw-linha">Nenhum exército de ${esc(defensor)} resiste — todos os territórios, capital inclusa, estão sob seu controle militar. Mas isto é <b>OCUPAÇÃO</b>, não posse: o país entra em regime de insurgência e custo de manutenção. Só a <b>ANEXAÇÃO</b> — depois de segurar o controle — torna ${esc(defensor)} seu de vez.</div>
        <div class="gdw-prox">
          <div class="gdw-prox-tit">${ico('landmark', 13)} PRÓXIMO PASSO · CAMINHO PARA A ANEXAÇÃO</div>
          <div class="gdw-prox-barra"><div style="width:${pctEstavel}%"></div></div>
          <div class="gdw-prox-linha"><span>Batidas estáveis</span><b>${turnosEstavel}/${ANEXACAO_TURNOS_ESTAVEL}</b></div>
          <div class="gdw-prox-linha"><span>Insurgência agora</span><b class="${insOk ? 'ok' : 'ruim'}">${conq.insurgencia}%<i> · precisa ≤${ANEXACAO_INSURGENCIA_MAX}%</i></b></div>
          <div class="gdw-prox-linha"><span>Upkeep projetado</span><b>${dinheiro(uk.total)}<i>/turno</i></b></div>
          <div class="gdw-prox-nota">${ico('info', 11)} Abra ${esc(defensor)} no globo e MANTENHA A ORDEM para acelerar — sem manutenção, a insurgência sobe e você pode perder o que tomou antes de anexar.</div>
        </div>`,
      aoMostrar: (page) => { sirene(); flashTela(false); baque(page); },
    });
  }

  // 1 · VEREDITO
  paginas.push({
    classe: `gdw-vrd gdw-${leitura.cls}`,
    cab: `${ico('scroll-text', 13)} RELATÓRIO DA OFENSIVA · ${esc(defensor.toUpperCase())}`,
    btn: 'VER O PLACAR',
    corpo: `
      <div class="gdw-super ${res.venceu ? 'ok' : 'fail'}">${res.venceu ? 'VOCÊ VENCEU' : 'VOCÊ PERDEU'}</div>
      <div class="gdw-placar">${cmp.caem.length}<i>/${cmp.total || '—'}</i><small>territórios tomados</small></div>
      <h1 class="gdw-tit">${esc(leitura.rot)}</h1>
      <div class="gdw-linha">${esc(leitura.txt)}</div>`,
    aoMostrar: (page) => { if (leitura.cls === 'fail') flashTela(true); baque(page); },
  });

  // 2 · PLACAR DE TERRITÓRIOS — dominados × ainda resistindo (o pedido do dono)
  paginas.push({
    cab: `${ico('map', 13)} PLACAR DE TERRITÓRIOS`,
    btn: cmp.caem.length ? 'VER O ESPÓLIO' : 'CONTINUAR',
    corpo: `
      <div class="gdw-barra"><i style="width:${pct}%"></i><span>${pct}%</span></div>
      <div class="gdw-score">
        <div class="gws-cel dom" style="animation-delay:.10s"><span>${ico('flag', 11)} SOB SEU CONTROLE</span><b>${cmp.caem.length}</b></div>
        <div class="gws-cel res" style="animation-delay:.22s"><span>${ico('shield', 11)} AINDA COM ${esc(defensor.toUpperCase())}</span><b>${cmp.resistem?.length ?? Math.max(0, cmp.total - cmp.caem.length)}</b></div>
      </div>
      ${cmp.tomouCapital ? `<div class="gdw-cap">${ico('landmark', 13)} A CAPITAL caiu — o governo de ${esc(defensor)} não tem mais onde se sentar.</div>` : res.capitalResistiu ? `<div class="gdw-cap resiste">${ico('shield', 13)} A CAPITAL RESISTIU — ${esc(defensor)} recuou a reserva pro coração do país. Só cai com força esmagadora: volte mais forte.</div>` : ''}
      ${cmp.caem.length ? `<div class="gdw-lista">${cmp.caem.slice(0, 12).map((e) => `<span class="gdw-e${e.ehCapital ? ' cap' : ''}">${e.ehCapital ? '★ ' : ''}${esc(e.nome)}</span>`).join('')}${cmp.caem.length > 12 ? `<span class="gdw-mais">+${cmp.caem.length - 12}</span>` : ''}</div>` : ''}
      ${(cmp.resistem?.length || (cmp.total - cmp.caem.length)) > 0
        ? `<div class="gdw-resiste">${ico('info', 12)} <b>${cmp.resistem?.length ?? (cmp.total - cmp.caem.length)}</b> territórios ainda erguem a bandeira de ${esc(defensor)}. Mais tropa na próxima ofensiva = mais mapa na sua mão.</div>` : ''}`,
    aoMostrar: (page) => baque(page),
  });

  // 3 · ESPÓLIO E CUSTO — o que ganhou × o que custou em SANGUE. A reação do bloco
  // (BRICS etc.) FOI TIRADA daqui de propósito: o modal pré-ataque já avisou, repetir
  // aqui roubava espaço do que importa no relatório — o espólio e as baixas.
  if (cmp.caem.length || res.custo || perdasIni) {
    // PETRÓLEO com FOTO real do poço — o espólio tem cara, não só número.
    const oleo = cmp.caem.length && res.petroleo
      ? `<div class="gdw-recurso oleo">
          <span class="gdw-rec-foto"><img src="${FOTO_RECURSO.petroleo}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="gbx-emoji" style="display:none">${ico('fuel', 15)}</span></span>
          <div><b>${Math.round(res.petroleo.reservas * (cmp.fracao || 1))} bi de barris</b> mudaram de dono${cmp.fracao < 1 ? ` — a fatia dos ${cmp.caem.length} territórios tomados` : ''}<small>${esc(res.petroleo.nota || '')}</small></div>
        </div>` : '';
    // O QUE O INIMIGO PERDEU — com a foto de cada item destruído. A queda é REAL: a força
    // militar do alvo cai de verdade (ver ajustarBase em jogo/guerra.js), então ele terá
    // que reconstruir esse arsenal nos próximos turnos.
    const blocoInimigo = perdasIni
      ? `<div class="gdw-baixas-bloco inimigo">
          <div class="gdw-baixas-topo">
            <span class="gbt-rot ini">${ico('crosshair', 13)} DESTRUÍDO EM ${esc(defensor.toUpperCase())}</span>
            <span class="gdw-baixas-total ini">−${totalBaixasIni.toLocaleString('pt-BR')}<i>peças do arsenal inimigo</i></span>
          </div>
          <div class="gdw-baixas">${perdasIni}</div>
          <div class="gdw-baixas-nota">${ico('trending-down', 11)} A força militar de ${esc(defensor)} caiu — ele vai gastar turnos reconstruindo.</div>
        </div>` : '';
    paginas.push({
      cab: `${ico('coins', 13)} ESPÓLIO E BAIXAS`,
      btn: 'A RESPOSTA DE ' + esc(defensor.toUpperCase()),
      corpo: `
        ${oleo}
        <div class="gdw-recurso custo">${ico('banknote', 15)}<div>A campanha custou <b>${dinheiro(res.custo)}</b> em logística e combustível.</div></div>
        ${blocoInimigo}
        <div class="gdw-baixas-bloco ${totalBaixas > 0 ? 'sangue' : 'limpo'}">
          <div class="gdw-baixas-topo">
            <span class="gbt-rot">${ico('skull', 13)} SUAS BAIXAS</span>
            <span class="gdw-baixas-total">−${totalBaixas.toLocaleString('pt-BR')}<i>de ${totalEnviado.toLocaleString('pt-BR')} homens e máquinas</i></span>
          </div>
          <div class="gdw-baixas">${perdas || '<span class="gdw-nada">Nenhuma baixa relevante — foi um passeio.</span>'}</div>
        </div>`,
      aoMostrar: (page) => baque(page),
    });
  }

  // 4 · A RESPOSTA DO PAÍS (IA, com fallback)
  paginas.push({
    classe: 'gdw-resposta',
    cab: `${ico('radio', 13)} ${esc(defensor.toUpperCase())} RESPONDE`,
    btnFim: 'ENCERRAR OPERAÇÃO',
    corpo: `
      <div class="gdw-nota">
        <div class="gdw-nota-cab">${bd ? `<img src="${bd}" alt="">` : ''}<div><b>Comunicado oficial</b><span>${esc(liderDe(res.av.iso, defensor)?.nome || 'Chefe de Estado')} · ${esc(defensor)}</span></div></div>
        <p class="gdw-nota-txt" id="gdw-nota-txt"><i class="gdw-carregando">${ico('loader', 14)} interceptando o comunicado…</i></p>
      </div>`,
    aoMostrar: async (page) => {
      const alvoTxt = page.querySelector('#gdw-nota-txt');
      const texto = await respostaP;
      if (alvoTxt) alvoTxt.innerHTML = `"${esc(texto || respostaFallback(res))}"`;
    },
  });

  // ── navegador ──
  let i = 0;
  const passo = () => {
    if (i >= paginas.length) return aoFim();
    const p = paginas[i]; i += 1;
    const ultima = i >= paginas.length;
    container.innerHTML = `<div class="gdw ${p.classe || ''}">
      <div class="gdw-topo">
        <div class="gdw-cab">${p.cab}</div>
        <div class="gdw-passos">${paginas.map((_, k) => `<span class="gp-dot ${k < i ? 'on' : ''}"></span>`).join('')}</div>
      </div>
      <div class="gdw-corpo">${p.corpo}</div>
      <button class="avancar gdw-go" id="gdw-go">${ultima ? (p.btnFim || 'ENCERRAR') : (p.btn || 'PRÓXIMO')} ${ico('chevron-right', 15)}</button>
    </div>`;
    container.querySelector('#gdw-go').addEventListener('click', passo);
    p.aoMostrar?.(container.querySelector('.gdw-corpo'));
  };
  passo();
}

// A RESPOSTA DO PAÍS, por IA — um comunicado oficial no tom do mundo de hoje: seco,
// afiado, com o vocabulário que um governo moderno usaria mesmo (sanções, "resposta
// proporcional", tribunal internacional, congelamento de ativos). Fallback forte se a
// IA estiver desligada — o jogo nunca depende dela pra ter voz.
async function gerarRespostaPais(res, jogo) {
  const defensor = res.av.nome;
  const meu = jogo.ficha?.pais || 'a potência agressora';
  const lider = liderDe(res.av.iso, defensor);
  const cmp = res.campanha || {};
  const situacao = cmp.tomouCapital ? 'a capital caiu e o governo foi forçado a se deslocar'
    : cmp.caem?.length ? `${cmp.caem.length} territórios foram ocupados`
      : 'a ofensiva foi repelida na fronteira';
  const system = 'Você escreve UM comunicado oficial curto (2 a 3 frases) de um governo nacional FICTÍCIO reagindo a um ataque militar. Tom: mundo de hoje — seco, institucional, afiado, com vocabulário diplomático real (resposta proporcional, sanções, congelamento de ativos, foro internacional, integridade territorial). Sem clichê de filme, sem emoji, sem aspas. Português do Brasil. Devolva só o texto do comunicado.';
  const user = `País: ${defensor}. Líder (fictício): ${lider?.nome}. Agressor: ${meu}. Situação: ${situacao}. Escreva o comunicado oficial de ${defensor} reagindo AGORA.`;
  try {
    const { texto } = await chamarIA({ system, user, temperature: 0.95, jsonMode: false });
    const limpo = String(texto || '').trim().replace(/^["']|["']$/g, '');
    return limpo.length > 8 ? limpo : respostaFallback(res);
  } catch { return respostaFallback(res); }
}

function respostaFallback(res) {
  const cmp = res.campanha || {};
  const meu = 'o agressor';
  if (cmp.tomouCapital) return `Este governo não reconhece a ocupação e considera o ataque uma violação flagrante da nossa integridade territorial. Acionaremos todos os foros internacionais e a resposta será proporcional — no tempo e no lugar que escolhermos.`;
  if (cmp.caem?.length) return `Denunciamos a agressão de ${meu} como um ato ilegal sob o direito internacional. Já solicitamos sanções e o congelamento de ativos, e reservamo-nos o direito de retomar cada palmo do nosso território.`;
  return `A ofensiva foi contida e o inimigo pagou caro por sua aventura. Nossas forças seguram a linha, e quem cruzar nossa fronteira de novo encontrará a mesma resposta.`;
}

function round2(n) { return Math.round(n * 100) / 100; }
