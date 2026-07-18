// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE GOVERNANÇA — governar a PRÓPRIA nação
// ═══════════════════════════════════════════════════════════════════════
// v2 (pedido do dono): o painel estava "cheio de coisa" — tudo empilhado numa
// coluna só. Agora é um dashboard com ABAS:
//   EXTRATO   — o coração novo: de onde vem CADA dólar (donut + lista) e pra
//               onde vai (despesas por categoria), com a extração dos países
//               DOMINADOS citada nominalmente. Tudo dado REAL do motor:
//               calcularFluxo + lucroDoTurno (empresas) + petroleo_espolio.
//   IMPOSTOS  — o medidor com zonas + slider de reforma (projeção ao vivo).
//   REFORMAS  — as leis + a mesa de alianças.
// O panorama (PIB/Tesouro/Dívida/Aprovação/Impostos) fica fixo no topo.
//
// Arquitetura: ações saem como AÇÕES SINTÉTICAS com `efeitos` inline — o
// resolverFila genérico aplica; entrada via tr.enfileirar ou filaComando.
//
// Render: o modal é montado por render(). O arrasto do slider NUNCA re-renderiza —
// só atualiza em place os nós da projeção (ver projetar()). Motivo: refazer
// innerHTML no `input` destruía o próprio <input type=range> no meio do
// arrasto e o navegador soltava o drag (o pino "engasgava").
import { calcularFluxo } from '../jogo/economia.js';
import { lucroDoTurno } from '../dados/empresas.js';
import { reservasControladas } from '../jogo/petroleo.js';
import { dinheiro } from '../jogo/formato.js';
import { enfileirarNaFila, filaRegistrada } from '../jogo/filaComando.js';
import { abrirAliancas } from './aliancas.js';
import { minhasAliancas } from '../jogo/aliancas.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── LEIS — dados no topo pra crescer fácil ────────────────────────────
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

const ROT = {
  aprovacao: 'aprovação', estabilidade: 'estabilidade', temp_economia: 'confiança do mercado',
  capacidade_ind: 'indústria', pib: 'PIB', divida: 'dívida', aliquota: 'impostos',
};
function tagsEfeitos(efeitos) {
  return Object.entries(efeitos || {}).map(([k, v]) => {
    if (typeof v !== 'number' || !v) return '';
    const bom = k === 'divida' ? v < 0 : v > 0;
    const val = k === 'pib' ? `${v > 0 ? '+' : ''}${dinheiro(Math.abs(v)).replace('US$ ', v < 0 ? '-' : '')}` : `${v > 0 ? '+' : ''}${v}`;
    return `<span class="gov-ef ${bom ? 'bom' : 'ruim'}">${esc(ROT[k] || k)} ${esc(val)}</span>`;
  }).join('');
}

function zonaDe(x) {
  if (x > 45) return { cls: 'sufoco', rot: 'SUFOCO FISCAL', cor: 'var(--perigo)', aviso: 'O mercado chama isto de confisco. Fuga de capital e revolta à vista.' };
  if (x > 35) return { cls: 'pesada', rot: 'CARGA PESADA', cor: 'var(--ambar)', aviso: 'Arrecada muito, mas o povo e os investidores sentem o aperto.' };
  if (x >= 20) return { cls: 'saudavel', rot: 'ZONA SAUDÁVEL', cor: 'var(--verde)', aviso: 'Equilíbrio entre caixa cheio e economia respirando.' };
  return { cls: 'fraca', rot: 'ARRECADAÇÃO FRACA', cor: 'var(--cyan)', aviso: 'Povo aliviado, cofre magro — o Estado vive de dívida.' };
}

function efeitosImposto(atual, alvo) {
  const delta = alvo - atual;
  const ef = { aliquota: delta };
  if (delta > 0) {
    ef.aprovacao = -Math.round(delta * 0.8);
    ef.temp_economia = -Math.round(delta * 0.5);
  } else if (delta < 0) {
    ef.aprovacao = Math.round(-delta * 0.5);
    ef.temp_economia = Math.round(-delta * 0.3);
  }
  return ef;
}

// ── EXTRATO FISCAL — todas as fontes e ralos, com dado REAL do motor ───
// Junta o que o jogo hoje espalha em três lugares: calcularFluxo (impostos,
// petróleo, dividendo, bloco, despesas), lucroDoTurno (empresas → tesouro no
// motor) e petroleo_espolio (extração dos dominados, já dentro do petróleo).
function extratoFiscal(jogo) {
  const e = jogo.estado;
  const fx = calcularFluxo(e);
  const empresas = Math.max(0, Math.round((lucroDoTurno(jogo.empresas || [], e) || 0) * 100) / 100);
  const receitas = [
    { id: 'impostos', rot: 'Impostos (arrecadação)', v: fx.receita, cor: 'var(--cyan)', nota: `alíquota de ${Math.round(e.aliquota || 0)}% sobre o PIB` },
    { id: 'dividendo', rot: 'Renda de soberania', v: fx.dividendo, cor: 'var(--verde)', nota: 'comércio e investimento — cresce com confiança e parcerias' },
    ...(empresas > 0 ? [{ id: 'empresas', rot: 'Lucro das empresas', v: empresas, cor: '#8fb4ff', nota: 'dividendos das estatais e participações' }] : []),
    ...(fx.petroleo > 0 ? [{ id: 'petroleo', rot: 'Petróleo (exportação líquida)', v: fx.petroleo, cor: 'var(--ambar)', nota: 'excedente vendido ao mercado' }] : []),
    ...(fx.bloco > 0 ? [{ id: 'bloco', rot: 'Comércio do bloco', v: fx.bloco, cor: 'var(--roxo)', nota: 'renda da união econômica da sua aliança' }] : []),
  ].filter((r) => r.v > 0.004);
  const despesas = [
    { id: 'social', rot: 'Gasto social', v: fx.gastoSocial, nota: 'saúde, educação, previdência (12% do PIB/ano)' },
    { id: 'militar', rot: 'Manutenção militar', v: fx.manutencaoMilitar, nota: 'soldo, combustível, peças das forças armadas' },
    { id: 'juros', rot: 'Juros da dívida', v: fx.juros, nota: `o mercado cobra ${(fx.taxa * 100).toFixed(1)}% a.a. pelo seu risco` },
    ...(fx.bases > 0.004 ? [{ id: 'bases', rot: 'Bases no exterior', v: fx.bases, nota: 'presença global custa caro' }] : []),
    ...(fx.petroleo < 0 ? [{ id: 'petroleo', rot: 'Petróleo (importação)', v: -fx.petroleo, nota: 'a diferença entre o que queima e o que bombeia' }] : []),
  ].filter((d) => d.v > 0.004);
  const totalR = receitas.reduce((s, r) => s + r.v, 0);
  const totalD = despesas.reduce((s, d) => s + d.v, 0);
  return { fx, receitas, despesas, totalR, totalD, saldo: Math.round((totalR - totalD) * 100) / 100, espolio: e.petroleo_espolio || [], reservas: reservasControladas(e) };
}

// DONUT SVG — sem lib: um <circle> por fatia com stroke-dasharray proporcional.
function donutSVG(fatias, total) {
  if (!total || !fatias.length) return '';
  const R = 15.915; // raio cujo perímetro = 100 (facilita: dasharray em %)
  let off = 25;      // começa no topo
  const aneis = fatias.map((f) => {
    const pct = (f.v / total) * 100;
    const c = `<circle r="${R}" cx="21" cy="21" fill="transparent" stroke="${f.cor}" stroke-width="5.5"
      stroke-dasharray="${Math.max(0, pct - 1.2)} ${100 - Math.max(0, pct - 1.2)}" stroke-dashoffset="${off}"></circle>`;
    off -= pct;
    return c;
  }).join('');
  return `<svg class="gov-donut" viewBox="0 0 42 42" role="img" aria-label="origem das receitas">${aneis}</svg>`;
}

export function abrirGovernanca(jogo, { tr, onFim, globoCtrl } = {}) {
  function minhaAliancaLabel() {
    const al = minhasAliancas(jogo.estado).find((a) => a.fundador === (jogo.estado.iso || 'USA'));
    return al ? `${esc(al.nome)} — ${al.membros.length} membro(s)` : 'Criar uma aliança';
  }
  const e = jogo.estado;
  const atual = Math.round(e.aliquota || 0);
  let alvo = atual;
  let aba = 'extrato';   // 'extrato' | 'impostos' | 'reformas'

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  function enfileirar(acao) {
    if (tr?.enfileirar) { const r = tr.enfileirar(acao); return r && typeof r === 'object' ? r : { ok: true }; }
    if (filaRegistrada()) return enfileirarNaFila(acao);
    return { ok: false, motivo: 'Fila de comando indisponível.' };
  }

  const fluxoCom = (x) => calcularFluxo({ ...e, aliquota: x });

  // ── conteúdo de cada aba ────────────────────────────────────────────
  function abaExtrato() {
    const x = extratoFiscal(jogo);
    const linhaR = (r) => `<div class="gov-xl"><i class="gov-xl-dot" style="background:${r.cor}"></i>
      <span class="gov-xl-rot">${esc(r.rot)}<small>${esc(r.nota)}</small></span>
      <span class="gov-xl-val bom">+${dinheiro(r.v)}</span>
      <span class="gov-xl-pct">${Math.round((r.v / x.totalR) * 100)}%</span></div>`;
    const linhaD = (d) => `<div class="gov-xl"><i class="gov-xl-dot" style="background:var(--perigo)"></i>
      <span class="gov-xl-rot">${esc(d.rot)}<small>${esc(d.nota)}</small></span>
      <span class="gov-xl-val ruim">−${dinheiro(d.v)}</span>
      <span class="gov-xl-pct">${x.totalD ? Math.round((d.v / x.totalD) * 100) : 0}%</span></div>`;
    return `
      <div class="gov-sec">${ico('arrow-right-left', 11)} Fluxo do mês</div>
      <div class="gov-fluxo compacto">
        <div class="gov-fx"><span>Entra</span><div class="gov-fx-t"><i class="rec" style="width:100%"></i></div><b class="bom">${dinheiro(x.totalR)}</b></div>
        <div class="gov-fx"><span>Sai</span><div class="gov-fx-t"><i class="desp" style="width:${x.totalR ? Math.min(100, (x.totalD / x.totalR) * 100) : 100}%"></i></div><b class="ruim">${dinheiro(x.totalD)}</b></div>
        <div class="gov-fx-saldo"><span>Saldo/mês</span><b class="${x.saldo >= 0 ? 'bom' : 'ruim'}">${x.saldo >= 0 ? '+' : '−'}${dinheiro(Math.abs(x.saldo))}</b></div>
      </div>

      <div class="gov-sec">${ico('chart-pie', 11)} De onde vem o dinheiro</div>
      <div class="gov-origem">
        <div class="gov-origem-donut">
          ${donutSVG(x.receitas, x.totalR)}
          <div class="gov-donut-c"><b>${dinheiro(x.totalR)}</b><small>/mês</small></div>
        </div>
        <div class="gov-origem-lista">${x.receitas.map(linhaR).join('')}</div>
      </div>

      <div class="gov-sec">${ico('trending-down', 11)} Pra onde ele vai</div>
      <div class="gov-origem-lista despesas">${x.despesas.map(linhaD).join('')}</div>

      <div class="gov-sec">${ico('flag', 11)} Extração — territórios dominados</div>
      ${x.espolio.length ? `<div class="gov-espolio">
        ${x.espolio.map((s) => `<div class="gov-esp">
          <b>${esc(s.nome)}</b>
          <span>${s.extraido} mi barris/dia extraídos <small>(${s.eficiencia}% de eficiência — a insurgência sabota o resto)</small></span>
        </div>`).join('')}
        ${x.reservas.conquistadas.length ? `<div class="gov-esp-reservas">${ico('database', 10)} Reservas anexadas: ${x.reservas.conquistadas.map((c) => `${esc(c.nome)} <b>${c.reservas} bi</b>`).join(' · ')}</div>` : ''}
      </div>` : `<div class="gov-esp-vazio">Nenhum território dominado rendendo extração. O mapa é a sua planilha: conquistar um petroestado adiciona a produção dele à sua.</div>`}`;
  }

  function abaImpostos() {
    const zAlvo = zonaDe(alvo);
    const delta0 = alvo - atual;
    return `
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
      </div>`;
  }

  function abaReformas() {
    return `
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
      </button>`;
  }

  function render(flash) {
    const fluxoAtual = fluxoCom(atual);
    const divPct = Math.min(Math.max(e.divida, 0), 150) / 150 * 100;
    const clsDiv = e.divida > 90 ? 'ruim' : e.divida > 60 ? 'aten' : 'ok';
    const aprov = Math.min(Math.max(Math.round(e.aprovacao), 0), 100);
    const clsApr = aprov < 35 ? 'ruim' : aprov < 55 ? 'aten' : 'ok';

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

      <div class="gov-abas">
        <button class="gov-aba ${aba === 'extrato' ? 'on' : ''}" data-aba="extrato">${ico('chart-pie', 12)} EXTRATO</button>
        <button class="gov-aba ${aba === 'impostos' ? 'on' : ''}" data-aba="impostos">${ico('percent', 12)} IMPOSTOS</button>
        <button class="gov-aba ${aba === 'reformas' ? 'on' : ''}" data-aba="reformas">${ico('scroll-text', 12)} REFORMAS</button>
      </div>

      <div class="gov-corpo">
        ${aba === 'extrato' ? abaExtrato() : aba === 'impostos' ? abaImpostos() : abaReformas()}
        ${flash ? `<div class="gov-flash ${flash.ok ? 'ok' : 'ruim'}">${ico(flash.ok ? 'clock' : 'triangle-alert', 13)} <span>${esc(flash.msg)}</span></div>` : ''}
        <div class="gov-rodape">${ico('landmark', 11)} <span>Leis tramitam na <b>fila de comando</b> — os efeitos valem quando o relógio fecha. Guerra e arsenal ficam no rodapé; aqui é governo.</span></div>
      </div>
    </div>`;

    modal.querySelector('.gov-x').addEventListener('click', fechar);
    modal.querySelectorAll('.gov-aba').forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; render(); }));

    modal.querySelector('#gov-alianca')?.addEventListener('click', () => {
      abrirAliancas(jogo, { globoCtrl, onFim: () => render() });
    });

    // ── PROJEÇÃO EM PLACE (aba IMPOSTOS) — o fix do slider continua valendo ──
    const slider = modal.querySelector('.gov-slider');
    if (slider) {
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
        nAlvo.style.left = `${(alvo / 60) * 100}%`;
        nAlvoB.textContent = `${alvo}%`;
        nAlvo.classList.toggle('oculto', delta === 0);
        nZona.textContent = z.rot;
        nZona.style.setProperty('--zc', z.cor);
        nAviso.textContent = z.aviso;
        nRec.textContent = dinheiro(fx.receita);
        if (delta === 0) { nDelta.textContent = 'vigente'; nDelta.className = ''; }
        else { nDelta.textContent = `${ganho >= 0 ? '+' : '−'}${dinheiro(Math.abs(ganho))}/mês`; nDelta.className = ganho >= 0 ? 'bom' : 'ruim'; }
        nEfs.innerHTML = delta === 0 ? '' : tagsEfeitos(efeitosImposto(atual, alvo));
        nEfs.classList.toggle('oculto', delta === 0);
        nDica.classList.toggle('oculto', delta !== 0);
        nAplicar.classList.toggle('oculto', delta === 0);
        nAplicarTxt.textContent = `APLICAR REFORMA → ${alvo}%`;
      }
      slider.addEventListener('input', () => { alvo = Number(slider.value); projetar(); });

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
      projetar();
    }

    // LEIS (aba REFORMAS)
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
  }

  render();
}
