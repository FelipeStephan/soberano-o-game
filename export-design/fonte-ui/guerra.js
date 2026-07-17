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
import { UNIDADES, DOMINIOS, poderDeploy, custoDeploy } from '../dados/forcas.js';
import { basesQueAlcancam } from '../dados/bases.js';
import { PAISES, dePais } from '../dados/paises.js';
import { bandeira, ISO2_DE, FOTO_UNIDADE } from '../dados/imagens.js';
import { EQUIPAMENTOS } from '../dados/equipamentos.js';
import { dinheiro } from '../jogo/formato.js';
import { sirene, flashTela } from './efeitos.js';
import { rodarLoading } from './loadingGuerra.js';
import { ico, ICO } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const PA_GUERRA = 2;
// A CENA PRINCIPAL DO JOGO. 8s era um piscar — o jogador mal via o que tinha feito.
// 60s deixa a ofensiva RESPIRAR: os caças cruzam o oceano, os navios navegam devagar,
// os despachos chegam com intervalo de noticiário, e a tensão acumula.
const DUR_VOO = 58000;

export function abrirGuerra(feature, jogo, { onFim } = {}) {
  const av = avaliarGuerra(jogo.estado, feature);
  const semPA = jogo.estado.pontos_acao < PA_GUERRA;
  let deploy = { ...av.sugestao };

  const disponiveis = UNIDADES.filter((u) => (jogo.estado.forcas?.[u.id] || 0) > 0);
  // O que ESTE país opera de verdade (F-35 se EUA, Gripen se Brasil).
  const equip = EQUIPAMENTOS[jogo.estado.iso || 'USA'] || EQUIPAMENTOS.USA;

  // ── PONTOS DE LANÇAMENTO ────────────────────────────────────────────
  // Território nacional é sempre uma opção. Bases que alcançam o alvo são melhores:
  // mais poder efetivo, menos custo logístico. É pra isso que servem bases.
  const alvoCoord = coordDe(feature);
  const bases = basesQueAlcancam(jogo.estado, alvoCoord);
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

    modal.querySelector('#gp-poder').textContent = poder;
    modal.querySelector('#gp-custo').textContent = dinheiro(custo);
    const elC = modal.querySelector('#gp-comb');
    elC.textContent = comb.custoExtra > 0 ? dinheiro(comb.custoExtra) : '—';
    elC.className = comb.estrangulado ? 'ruim' : comb.importador ? 'amb' : 'bom';

    const oleo = modal.querySelector('#gp-oleo');
    if (comb.consumo > 0) {
      oleo.style.display = '';
      oleo.className = `gp-oleo ${comb.estrangulado ? 'falta' : comb.importador ? 'aviso' : ''}`;
      const escala = `A campanha consome <b>${comb.consumo} milhões de barris/dia</b> de combustível — com o petróleo a US$ ${comb.preco.toFixed(0)} o barril${comb.inflacao > 5 ? ` (<b>+${comb.inflacao}%</b> acima do normal)` : ''}.`;
      oleo.innerHTML = comb.estrangulado
        ? `${ico('fuel', 13)} <span>${escala} Você importa ${Math.abs(comb.folga).toFixed(1)} milhões de barris/dia e o barril está caro: <b>${dinheiro(comb.custoExtra)}</b> só de combustível, e a <b>moral cai 18%</b> — o comboio de reabastecimento virou o gargalo da campanha. Rommel parou no Egito por falta de diesel, não por falta de tanque.</span>`
        : comb.importador
          ? `${ico('fuel', 13)} <span>${escala} Como importamos ${Math.abs(comb.folga).toFixed(1)} milhões de barris/dia, cada gota vem de fora e paga mais caro: <b>${dinheiro(comb.custoExtra)}</b> de combustível. Se o petróleo passar de US$ 120, a moral começa a sangrar.</span>`
          : `${ico('fuel', 13)} <span>${escala} Somos autossuficientes — o combustível sai do nosso próprio poço: <b>${dinheiro(comb.custoExtra)}</b>. Guerra de quem tem petróleo é mais barata, e sempre foi.</span>`;
    } else oleo.style.display = 'none';

    const semGrana = custoTotal > jogo.estado.tesouro;
    const semForca = poder <= 0;

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
    else if (semGrana) { erro.style.display = ''; erro.innerHTML = `${ico('ban', 14)} Sem recursos: logística ${dinheiro(custo)} + combustível ${dinheiro(comb.custoExtra)} = ${dinheiro(custoTotal)}, e você tem ${dinheiro(jogo.estado.tesouro)}.`; }
    else erro.style.display = 'none';
    btn.disabled = semPA || semForca || semGrana;

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
  modal.querySelector('#gp-lancar')?.addEventListener('click', async () => {
    const custoFinal = round2(custoDeploy(deploy) * (1 - ponto.desconto));
    const res = resolverGuerra(jogo.estado, feature, deploy, { multPoder: ponto.poder, custo: custoFinal });
    if (res.falha) {
      const e = modal.querySelector('#gp-erro');
      e.style.display = ''; e.innerHTML = `${ico('ban', 14)} ${esc(res.falha)}`;
      return;
    }
    emBatalha = true;
    jogo.estado.pontos_acao -= PA_GUERRA;
    modal.querySelector('#gp-plano').remove();

    await cinematica(res);

    jogo.aplicarGuerra(feature, res);
    const ruim = !res.venceu;
    sirene({ ruim }); flashTela(ruim);
    modal.querySelector('#gp-batalha').insertAdjacentHTML('beforeend', desfechoHTML(res));
    emBatalha = false;
    modal.querySelector('#gp-ok')?.addEventListener('click', () => { fechar(); onFim?.(); });
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

    // Os despachos rodam NO MAPA, com o globo livre pra você arrastar e olhar.
    await rodarLoading({
      globo: g, coord: alvoCoord, iso: av.iso, nome: av.nome,
      deploy, venceu: res.venceu, petro: res.petroleo, dur: DUR_VOO,
      reagentes,
      // A IA precisa saber QUEM está atacando pra escrever a cobertura certa.
      atacante: jogo.ficha.pais,
      presidente: jogo.estado.presidenteNome || jogo.ficha.presidente,
    });

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

function desfechoHTML(res) {
  const titulos = { vitoria_total: 'VITÓRIA ESMAGADORA', vitoria: 'VITÓRIA', derrota: 'DERROTA', derrota_total: 'ANIQUILAÇÃO' };
  const perdas = res.perdas.map((p) => `<span class="mud ruim">${ico(ICO[p.id] || 'circle', 12)} ${esc(p.nome)} <b>−${p.perdido.toLocaleString('pt-BR')}</b><span class="pd-de">de ${p.enviado.toLocaleString('pt-BR')}</span></span>`).join('');
  const bloco = res.reacaoBloco.length
    ? `<div class="gd-bloco">${ico('triangle-alert', 14)} <b>${esc(res.bloco.blocoNome)}</b> reagiu — relações com ${esc(res.bloco.paises.join(', '))} despencaram.</div>` : '';
  const ocup = res.venceu
    ? `<div class="gd-ocup">${ico('flag', 14)} <b>${esc(res.av.nome)}</b> está sob sua ocupação. Clique no país no globo para administrar o território — e instalar uma base permanente.</div>` : '';
  const oleo = res.venceu && res.petroleo
    ? `<div class="gd-oleo">${ico('fuel', 14)} <b>${res.petroleo.reservas} bi de barris</b> em reservas provadas mudaram de dono. ${esc(res.petroleo.nota)}</div>` : '';
  return `<div class="gd ${res.venceu ? 'ok' : 'fail'}">
    <div class="gd-tit">${titulos[res.resultado]}</div>
    ${ocup}${oleo}
    <div class="gd-sec">Baixas na força expedicionária</div>
    <div class="gd-perdas">${perdas || '<span class="sem-mud">sem baixas relevantes</span>'}</div>
    ${bloco}
    <button class="avancar" id="gp-ok">CONTINUAR ${ico('chevron-right', 15)}</button>
  </div>`;
}

function round2(n) { return Math.round(n * 100) / 100; }
