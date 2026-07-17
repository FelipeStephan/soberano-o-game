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
import { calcularFluxo } from '../jogo/economia.js';
import { dinheiro } from '../jogo/formato.js';
import { enfileirarNaFila, filaRegistrada } from '../jogo/filaComando.js';
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

export function abrirGovernanca(jogo, { tr, onFim } = {}) {
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
    const fluxoAlvo = fluxoCom(alvo);
    const zAtual = zonaDe(atual);
    const zAlvo = zonaDe(alvo);
    const delta = alvo - atual;
    const ganho = Math.round((fluxoAlvo.receita - fluxoAtual.receita) * 100) / 100;
    const efImp = efeitosImposto(atual, alvo);

    modal.innerHTML = `<div class="gov-painel">
      <div class="gov-cab">
        <div class="gov-cab-tit">
          <div class="gov-dom">${ico('landmark', 11)} GABINETE CIVIL · ${esc(jogo.ficha.pais || 'Sua nação')}</div>
          <div class="gov-nome">Painel de Governança</div>
        </div>
        <button class="pp-fechar gov-x" type="button">${ico('x', 15)}</button>
      </div>

      <div class="gov-panorama">
        <span>${ico('circle-dollar-sign', 10)} PIB <b>${dinheiro(e.pib)}</b></span>
        <span>${ico('vault', 10)} Tesouro <b>${dinheiro(e.tesouro)}</b></span>
        <span>${ico('trending-down', 10)} Dívida <b class="${e.divida > 90 ? 'ruim' : ''}">${Math.round(e.divida)}% do PIB</b></span>
        <span>${ico('percent', 10)} Impostos <b>${atual}%</b></span>
        <span>${ico('users', 10)} Aprovação <b class="${e.aprovacao < 35 ? 'ruim' : ''}">${Math.round(e.aprovacao)}%</b></span>
      </div>

      <div class="gov-corpo">
        <div class="gov-sec">${ico('percent', 11)} Impostos — carga tributária</div>
        <div class="gov-imposto">
          <div class="gov-medidor">
            <div class="gov-zonas">
              <i class="z-fraca" style="width:${(20 / 60) * 100}%"></i><i class="z-saudavel" style="width:${(15 / 60) * 100}%"></i><i class="z-pesada" style="width:${(10 / 60) * 100}%"></i><i class="z-sufoco" style="width:${(15 / 60) * 100}%"></i>
            </div>
            <div class="gov-pino atual" style="left:${(atual / 60) * 100}%" title="alíquota vigente">
              <b>${atual}%</b>
            </div>
            ${delta !== 0 ? `<div class="gov-pino alvo" style="left:${(alvo / 60) * 100}%"><b>${alvo}%</b></div>` : ''}
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
              <b>${dinheiro(fluxoAlvo.receita)}</b>
              ${delta !== 0 ? `<i class="${ganho >= 0 ? 'bom' : 'ruim'}">${ganho >= 0 ? '+' : ''}${dinheiro(Math.abs(ganho)).replace('US$ ', ganho < 0 ? '-US$ ' : 'US$ ')}/mês</i>` : `<i>vigente</i>`}
            </div>
          </div>
          ${delta !== 0 ? `<div class="gov-custo-pol">${tagsEfeitos(efImp)}</div>
          <button class="gov-aplicar" type="button">${ico('gavel', 12)} <span>APLICAR REFORMA → ${alvo}%</span> <i>⚡1 · 20s</i></button>`
          : `<div class="gov-custo-pol vazio">Arraste o cursor para propor uma nova alíquota — a projeção responde ao vivo.</div>`}
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

        ${flash ? `<div class="gov-flash ${flash.ok ? 'ok' : 'ruim'}">${ico(flash.ok ? 'clock' : 'triangle-alert', 13)} <span>${esc(flash.msg)}</span></div>` : ''}

        <div class="gov-rodape">${ico('landmark', 11)} <span>Leis tramitam na <b>fila de comando</b> — os efeitos valem quando o relógio fecha. Guerra e arsenal ficam no rodapé; aqui é governo.</span></div>
      </div>
    </div>`;

    modal.querySelector('.gov-x').addEventListener('click', fechar);

    // slider: só a projeção re-renderiza (estado `alvo` vive fora do render)
    const slider = modal.querySelector('.gov-slider');
    slider.addEventListener('input', () => { alvo = Number(slider.value); render(); });

    // APLICAR — reforma tributária como ação sintética com efeitos inline
    modal.querySelector('.gov-aplicar')?.addEventListener('click', () => {
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
  }

  render();
}
