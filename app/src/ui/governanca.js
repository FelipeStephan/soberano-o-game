// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE GOVERNANÇA — governar a PRÓPRIA nação
// ═══════════════════════════════════════════════════════════════════════
// O que isto resolve: clicar no seu país só oferecia "distribuir tropas" — como
// se governar fosse só mover soldado. Este painel é a mesa do gabinete civil:
// IMPOSTOS (medidor com zonas + projeção ao vivo da receita), LEIS (reformas com
// tempo de tramitação e preço político declarado) e o PANORAMA fiscal do país.
// Nada aqui repete o rodapé (Militar/Arsenal/...): é governo, não guerra.
//
// Arquitetura: as ações saem como AÇÕES SINTÉTICAS com `efeitos` inline — o
// resolverFila genérico (jogo/acoes.js) já aplica `efeitos` de qualquer ação da
// fila, então NENHUM marcador novo no motor. A entrada na fila vai por
// tr.enfileirar quando o controlador é passado, ou pela ponte filaComando
// (mesma usada pela ficha de equipamento/mercado) quando não é.
//
// Render: o modal é montado UMA vez. O arrasto do slider NUNCA re-renderiza —
// só atualiza em place os nós da projeção (ver projetar()). Motivo: refazer
// innerHTML no `input` destruía o próprio <input type=range> no meio do
// arrasto e o navegador soltava o drag (o pino "engasgava").
import { calcularFluxo } from '../jogo/economia.js';
import { dinheiro } from '../jogo/formato.js';
import { enfileirarNaFila, filaRegistrada } from '../jogo/filaComando.js';
import { abrirAliancas } from './aliancas.js';
import { minhasAliancas } from '../jogo/aliancas.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── LEIS — dados no topo pra crescer fácil ────────────────────────────
// Cada lei vira uma ação sintética: custo pago na hora, tempo tramitando na
// fila de comando, efeitos aplicados quando o relógio fecha. Os efeitos são
// DECLARADOS no card — o jogador sabe o preço político antes de assinar.
const LEIS = [
  {
    chave: 'incentivo_industrial', nome: 'Lei de Incentivo Industrial', icone: '🏭', tempo: 30, custo: 0.1,
    desc: 'Crédito barato e encomendas públicas para o parque fabril. As fábricas respondem — e o mercado gosta de ver chaminé fumegando.',
    efeitos: { capacidade_ind: 6, temp_economia: 3 },
  },
  {
    chave: 'marco_saneamento', nome: 'Marco do Saneamento e Infraestrutura', icone: '🚰', tempo: 40, custo: 0.2,
    desc: 'Água, esgoto, estradas e energia onde não chegava. Caro e lento — mas PIB cresce em cima de concreto, e povo com torneira aprova governo.',
    efeitos: { pib: 0.6, aprovacao: 3 },
  },
  {
    chave: 'desburocratizacao', nome: 'Desburocratização', icone: '📋', tempo: 25, custo: 0,
    desc: 'Corta carimbo, guichê e alvará. O mercado celebra a agilidade; o funcionalismo e quem vivia do balcão, não.',
    efeitos: { temp_economia: 6, estabilidade: -2, aprovacao: -2 },
  },
  {
    chave: 'responsabilidade_fiscal', nome: 'Lei de Responsabilidade Fiscal', icone: '⚖️', tempo: 35, custo: 0,
    desc: 'Teto de gasto e amortização forçada da dívida. Os credores respiram; o povo sente o cinto apertar.',
    efeitos: { divida: -6, aprovacao: -4 },
  },
];

// Rótulos legíveis dos efeitos (pro card não cuspir nome de variável).
const ROT = {
  aprovacao: 'aprovação', estabilidade: 'estabilidade', temp_economia: 'confiança do mercado',
  capacidade_ind: 'indústria', pib: 'PIB', divida: 'dívida', aliquota: 'impostos',
};
function tagsEfeitos(efeitos) {
  return Object.entries(efeitos || {}).map(([k, v]) => {
    if (typeof v !== 'number' || !v) return '';
    // dívida cair é BOM — sinal invertido na cor
    const bom = k === 'divida' ? v < 0 : v > 0;
    const val = k === 'pib' ? `${v > 0 ? '+' : ''}${dinheiro(Math.abs(v)).replace('US$ ', v < 0 ? '-' : '')}` : `${v > 0 ? '+' : ''}${v}`;
    return `<span class="gov-ef ${bom ? 'bom' : 'ruim'}">${esc(ROT[k] || k)} ${esc(val)}</span>`;
  }).join('');
}

// Zona da alíquota — a leitura semântica do medidor.
function zonaDe(x) {
  if (x > 45) return { cls: 'sufoco', rot: 'SUFOCO FISCAL', cor: 'var(--perigo)', aviso: 'O mercado chama isto de confisco. Fuga de capital e revolta à vista.' };
  if (x > 35) return { cls: 'pesada', rot: 'CARGA PESADA', cor: 'var(--ambar)', aviso: 'Arrecada muito, mas o povo e os investidores sentem o aperto.' };
  if (x >= 20) return { cls: 'saudavel', rot: 'ZONA SAUDÁVEL', cor: 'var(--verde)', aviso: 'Equilíbrio entre caixa cheio e economia respirando.' };
  return { cls: 'fraca', rot: 'ARRECADAÇÃO FRACA', cor: 'var(--cyan)', aviso: 'Povo aliviado, cofre magro — o Estado vive de dívida.' };
}

// O preço político da reforma tributária — calculado no clique, declarado antes.
function efeitosImposto(atual, alvo) {
  const delta = alvo - atual;
  const ef = { aliquota: delta };
  if (delta > 0) {
    ef.aprovacao = -Math.round(delta * 0.8);
    ef.temp_economia = -Math.round(delta * 0.5);
  } else if (delta < 0) {
    // aliviar imposto devolve carinho do povo (e um sopro de confiança)
    ef.aprovacao = Math.round(-delta * 0.5);
    ef.temp_economia = Math.round(-delta * 0.3);
  }
  return ef;
}

export function abrirGovernanca(jogo, { tr, onFim, globoCtrl } = {}) {
  // Rótulo do botão de aliança: mostra a que você fundou, ou o convite a fundar.
  function minhaAliancaLabel() {
    const al = minhasAliancas(jogo.estado).find((a) => a.fundador === (jogo.estado.iso || 'USA'));
    return al ? `${esc(al.nome)} — ${al.membros.length} membro(s)` : 'Criar uma aliança';
  }
  const e = jogo.estado;
  const atual = Math.round(e.aliquota || 0);
  let alvo = atual;   // o que o slider aponta agora

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  // Entrada única na fila: controlador quando veio, ponte quando não.
  function enfileirar(acao) {
    if (tr?.enfileirar) { const r = tr.enfileirar(acao); return r && typeof r === 'object' ? r : { ok: true }; }
    if (filaRegistrada()) return enfileirarNaFila(acao);
    return { ok: false, motivo: 'Fila de comando indisponível.' };
  }

  // Projeta a receita com uma alíquota HIPOTÉTICA sem tocar o estado real.
  const fluxoCom = (x) => calcularFluxo({ ...e, aliquota: x });

  function render(flash) {
    const fluxoAtual = fluxoCom(atual);
    const zAlvo = zonaDe(alvo);
    const delta0 = alvo - atual;

    // ── panorama como TILES de dashboard — cada métrica com leitura visual ──
    // A cor do tile é SEMÂNTICA (--sc): a barra e o número contam a mesma história.
    const divPct = Math.min(Math.max(e.divida, 0), 150) / 150 * 100;   // escala até 150% do PIB
    const clsDiv = e.divida > 90 ? 'ruim' : e.divida > 60 ? 'aten' : 'ok';
    const aprov = Math.min(Math.max(Math.round(e.aprovacao), 0), 100);
    const clsApr = aprov < 35 ? 'ruim' : aprov < 55 ? 'aten' : 'ok';

    // ── fluxo de caixa: receita × despesa como barras opostas ──
    const maxFx = Math.max(fluxoAtual.receita, fluxoAtual.despesa, 0.01);
    const wRec = fluxoAtual.receita / maxFx * 100;
    const wDesp = fluxoAtual.despesa / maxFx * 100;

    modal.innerHTML = `<div class="gov-painel">
      <div class="gov-cab">
        <div class="gov-cab-tit">
          <div class="gov-dom">${ico('landmark', 11)} GABINETE CIVIL · ${esc(jogo.ficha.pais || 'Sua nação')}</div>
          <div class="gov-nome">Painel de Governança</div>
        </div>
        <button class="pp-fechar gov-x" type="button">${ico('x', 15)}</button>
      </div>

      <div class="gov-panorama">
        <div class="gov-stat">
          <span class="gov-stat-rot">${ico('circle-dollar-sign', 9)} PIB</span>
          <b class="gov-stat-val">${dinheiro(e.pib)}</b>
        </div>
        <div class="gov-stat">
          <span class="gov-stat-rot">${ico('vault', 9)} Tesouro</span>
          <b class="gov-stat-val">${dinheiro(e.tesouro)}</b>
        </div>
        <div class="gov-stat ${clsDiv}">
          <span class="gov-stat-rot">${ico('trending-down', 9)} Dívida</span>
          <b class="gov-stat-val">${Math.round(e.divida)}<small>% do PIB</small></b>
          <div class="gov-stat-barra" title="a marca é o limite: 100% do PIB"><i style="width:${divPct}%"></i><u style="left:${100 / 150 * 100}%"></u></div>
        </div>
        <div class="gov-stat ${clsApr}">
          <span class="gov-stat-rot">${ico('users', 9)} Aprovação</span>
          <b class="gov-stat-val">${aprov}<small>%</small></b>
          <div class="gov-stat-barra" title="abaixo de 35% é zona de crise; acima de 55%, conforto"><i style="width:${aprov}%"></i><u style="left:35%"></u><u style="left:55%"></u></div>
        </div>
        <div class="gov-stat">
          <span class="gov-stat-rot">${ico('percent', 9)} Impostos</span>
          <b class="gov-stat-val">${atual}<small>%</small></b>
          <div class="gov-stat-zonas"><i class="z-fraca"></i><i class="z-saudavel"></i><i class="z-pesada"></i><i class="z-sufoco"></i><u style="left:${atual / 60 * 100}%"></u></div>
        </div>
      </div>

      <div class="gov-corpo">
        <div class="gov-sec">${ico('arrow-right-left', 11)} Fluxo de caixa — mês corrente</div>
        <div class="gov-fluxo">
          <div class="gov-fx"><span>Receita</span><div class="gov-fx-t"><i class="rec" style="width:${wRec}%"></i></div><b class="bom">${dinheiro(fluxoAtual.receita)}</b></div>
          <div class="gov-fx"><span>Despesa</span><div class="gov-fx-t"><i class="desp" style="width:${wDesp}%"></i></div><b class="ruim">${dinheiro(fluxoAtual.despesa)}</b></div>
          <div class="gov-fx-saldo">
            <span>Saldo/mês <small>inclui petróleo e dividendos</small></span>
            <b class="${fluxoAtual.saldo >= 0 ? 'bom' : 'ruim'}">${fluxoAtual.saldo >= 0 ? '+' : '−'}${dinheiro(Math.abs(fluxoAtual.saldo))}</b>
          </div>
        </div>

        <div class="gov-sec">${ico('percent', 11)} Impostos — carga tributária</div>
        <div class="gov-imposto">
          <div class="gov-medidor">
            <div class="gov-zonas">
              <i class="z-fraca" style="width:${(20 / 60) * 100}%"></i><i class="z-saudavel" style="width:${(15 / 60) * 100}%"></i><i class="z-pesada" style="width:${(10 / 60) * 100}%"></i><i class="z-sufoco" style="width:${(15 / 60) * 100}%"></i>
            </div>
            <div class="gov-pino atual" style="left:${(atual / 60) * 100}%" title="alíquota vigente"><b>${atual}%</b></div>
            <div class="gov-pino alvo ${delta0 === 0 ? 'oculto' : ''}" style="left:${(alvo / 60) * 100}%" title="alíquota proposta"><b>${alvo}%</b></div>
            <div class="gov-escala"><span>0</span><span>20</span><span>35</span><span>45</span><span>60%</span></div>
          </div>
          <input class="gov-slider" type="range" min="0" max="60" step="1" value="${alvo}">
          <div class="gov-proj">
            <div class="gov-proj-l">
              <span class="gov-zona" style="--zc:${zAlvo.cor}">${esc(zAlvo.rot)}</span>
              <small>${esc(zAlvo.aviso)}</small>
            </div>
            <div class="gov-proj-r">
              <span>Receita/mês</span>
              <b>${dinheiro(fluxoCom(alvo).receita)}</b>
              <i>vigente</i>
            </div>
          </div>
          <div class="gov-custo-pol ${delta0 === 0 ? 'oculto' : ''}">${delta0 === 0 ? '' : tagsEfeitos(efeitosImposto(atual, alvo))}</div>
          <div class="gov-dica ${delta0 !== 0 ? 'oculto' : ''}">Arraste o cursor para propor uma nova alíquota — a projeção responde ao vivo.</div>
          <button class="gov-aplicar ${delta0 === 0 ? 'oculto' : ''}" type="button">${ico('gavel', 12)} <span>APLICAR REFORMA → ${alvo}%</span> <i>⚡1 · 20s</i></button>
        </div>

        <div class="gov-sec">${ico('scroll-text', 11)} Leis — reformas de governo</div>
        <div class="gov-leis">
          ${LEIS.map((l) => `<div class="gov-lei">
            <div class="gov-lei-top"><span class="gov-lei-ic">${l.icone}</span><b>${esc(l.nome)}</b></div>
            <div class="gov-lei-desc">${esc(l.desc)}</div>
            <div class="gov-lei-efs">${tagsEfeitos(l.efeitos)}</div>
            <button class="gov-lei-go" data-lei="${l.chave}" type="button">
              <span>Sancionar</span><i>${l.custo ? `${dinheiro(l.custo)} · ` : ''}⚡1 · ${l.tempo}s</i>
            </button>
          </div>`).join('')}
        </div>

        <div class="gov-sec">${ico('handshake', 11)} Diplomacia — blocos e alianças</div>
        <button class="gov-alianca" id="gov-alianca" type="button">
          <span class="gov-al-ic">${ico('handshake', 18)}</span>
          <span class="gov-al-txt"><b>${minhaAliancaLabel()}</b><small>Funde um bloco sob a sua bandeira, convide nações e ganhe força militar ou econômica.</small></span>
          <span class="gov-al-seta">${ico('chevron-right', 15)}</span>
        </button>

        ${flash ? `<div class="gov-flash ${flash.ok ? 'ok' : 'ruim'}">${ico(flash.ok ? 'clock' : 'triangle-alert', 13)} <span>${esc(flash.msg)}</span></div>` : ''}

        <div class="gov-rodape">${ico('landmark', 11)} <span>Leis tramitam na <b>fila de comando</b> — os efeitos valem quando o relógio fecha. Guerra e arsenal ficam no rodapé; aqui é governo.</span></div>
      </div>
    </div>`;

    modal.querySelector('.gov-x').addEventListener('click', fechar);

    // Abrir a mesa de alianças (o motor + roleplay moram em ui/aliancas.js).
    modal.querySelector('#gov-alianca')?.addEventListener('click', () => {
      abrirAliancas(jogo, { globoCtrl, onFim: () => render() });
    });

    // ── PROJEÇÃO EM PLACE — o coração do fix do slider ──────────────────
    // O PORQUÊ: o listener antigo chamava render() a cada `input` — o innerHTML
    // novo destruía o próprio <input type=range> no MEIO do arrasto e o
    // navegador soltava o drag (o pino "engasgava" e largava o mouse). Agora
    // todos os nós que a projeção toca são capturados uma vez e o arrasto só
    // mexe em textContent/style/classList. O modal inteiro nunca é refeito.
    const slider = modal.querySelector('.gov-slider');
    const nAlvo = modal.querySelector('.gov-pino.alvo');
    const nAlvoB = nAlvo.querySelector('b');
    const nZona = modal.querySelector('.gov-zona');
    const nAviso = modal.querySelector('.gov-proj-l small');
    const nRec = modal.querySelector('.gov-proj-r b');
    const nDelta = modal.querySelector('.gov-proj-r i');
    const nEfs = modal.querySelector('.gov-custo-pol');
    const nDica = modal.querySelector('.gov-dica');
    const nAplicar = modal.querySelector('.gov-aplicar');
    const nAplicarTxt = nAplicar.querySelector('span');

    function projetar() {
      const delta = alvo - atual;
      const fx = fluxoCom(alvo);
      const z = zonaDe(alvo);
      const ganho = Math.round((fx.receita - fluxoAtual.receita) * 100) / 100;
      // pino alvo desliza junto com o polegar — mesmo eixo, sem re-render
      nAlvo.style.left = `${(alvo / 60) * 100}%`;
      nAlvoB.textContent = `${alvo}%`;
      nAlvo.classList.toggle('oculto', delta === 0);
      // leitura da zona + receita projetada ao vivo
      nZona.textContent = z.rot;
      nZona.style.setProperty('--zc', z.cor);
      nAviso.textContent = z.aviso;
      nRec.textContent = dinheiro(fx.receita);
      if (delta === 0) { nDelta.textContent = 'vigente'; nDelta.className = ''; }
      else { nDelta.textContent = `${ganho >= 0 ? '+' : '−'}${dinheiro(Math.abs(ganho))}/mês`; nDelta.className = ganho >= 0 ? 'bom' : 'ruim'; }
      // preço político + botão (sempre no DOM; só alterna visibilidade)
      nEfs.innerHTML = delta === 0 ? '' : tagsEfeitos(efeitosImposto(atual, alvo));
      nEfs.classList.toggle('oculto', delta === 0);
      nDica.classList.toggle('oculto', delta !== 0);
      nAplicar.classList.toggle('oculto', delta === 0);
      nAplicarTxt.textContent = `APLICAR REFORMA → ${alvo}%`;
    }
    slider.addEventListener('input', () => { alvo = Number(slider.value); projetar(); });

    // APLICAR — reforma tributária como ação sintética com efeitos inline
    nAplicar.addEventListener('click', () => {
      const ef = efeitosImposto(atual, alvo);
      const acao = {
        id: `gov_imposto_${Date.now()}`,
        nome: `Reforma tributária → ${alvo}%`,
        icone: '🏛️', categoria: 'Política',
        custo: 0, custoPA: 1, tempo: 20, prob: 1,
        efeitos: ef,
        descricao: `Alíquota de ${atual}% para ${alvo}%. ${alvo > atual ? 'O povo vai sentir no bolso.' : 'O cofre vai sentir a folga.'}`,
      };
      const r = enfileirar(acao);
      if (!r.ok) { render({ ok: false, msg: r.motivo || 'Não deu para enfileirar.' }); return; }
      render({ ok: true, msg: 'Reforma tributária na fila de comando — tramita em 20s.' });
      setTimeout(fechar, 900);
    });

    // LEIS — cada card enfileira sua ação sintética
    modal.querySelectorAll('.gov-lei-go[data-lei]').forEach((b) => b.addEventListener('click', () => {
      const l = LEIS.find((x) => x.chave === b.dataset.lei);
      if (!l) return;
      const acao = {
        id: `gov_lei_${l.chave}_${Date.now()}`,
        nome: l.nome, icone: l.icone, categoria: 'Política',
        custo: l.custo || 0, custoPA: 1, tempo: l.tempo, prob: 1,
        efeitos: { ...l.efeitos },
        descricao: l.desc,
      };
      const r = enfileirar(acao);
      if (!r.ok) { render({ ok: false, msg: r.motivo || 'Não deu para enfileirar.' }); return; }
      render({ ok: true, msg: `${l.nome} na fila de comando — sanção em ${l.tempo}s.` });
      setTimeout(fechar, 900);
    }));

    // sincroniza a projeção com o alvo atual (importante no re-render do flash)
    projetar();
  }

  render();
}
