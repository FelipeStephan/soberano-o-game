// ═══════════════════════════════════════════════════════════════════════
// NEGOCIAR SAÍDA DA GUERRA — o painel de paz
// ═══════════════════════════════════════════════════════════════════════
// Três saídas: selar a paz, devolver território, ou sair unilateralmente. A chance de
// o inimigo aceitar é mostrada AO VIVO (mesma fórmula do dado) e depende do poder
// relativo + do contexto dele. Cada opção é uma ordem no tempo real (tr.enfileirar).
import { ico } from './icones.js';
import { PAISES, iso as isoDe } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { dinheiro } from '../jogo/formato.js';
import { meusConquistados } from '../jogo/territorio.js';
import { poderRelativo, contextoDoRival, chanceAceitarPaz, chanceContraAtaque, previsaoSaidaGuerra, TERMOS_PAZ } from '../jogo/paz.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (v) => `${Math.round(v * 100)}%`;

export function abrirPaz(feature, jogo, { tr, onFim } = {}) {
  const iso = isoDe(feature);
  const e = jogo.estado;
  const nome = PAISES[iso]?.nome || iso;
  const meusEstados = meusConquistados(e).filter((s) => s.pais === iso);
  const maxRep = Math.max(0, Math.floor((e.tesouro || 0) * 3) / 10);

  const modal = document.createElement('div');
  modal.className = 'modal-fundo paz-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); onFim?.(); };
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  const selec = new Set();
  let reparacoes = 0;

  function render() {
    if (!(e.emGuerra || []).includes(iso)) { modal.innerHTML = `<div class="paz-painel"><div class="paz-fim">${ico('circle-check', 24)} A guerra com ${esc(nome)} já terminou.</div><button class="dist-aplicar" id="paz-ok">FECHAR</button></div>`; modal.querySelector('#paz-ok').addEventListener('click', fechar); return; }
    const rel = poderRelativo(e, iso);
    const ctx = contextoDoRival(e, iso);
    const fracaoDev = selec.size / Math.max(1, meusEstados.length);
    const chCF = chanceAceitarPaz(e, iso, { tipo: 'cessar_fogo' }).chance;
    const chDA = chanceAceitarPaz(e, iso, { tipo: 'devolver_area', fracaoDevolvida: fracaoDev, reparacoes }).chance;
    const prevSaida = previsaoSaidaGuerra(e, iso);
    const riscoSaida = chanceContraAtaque(e, iso, { negociado: false });

    const badges = [
      ctx.fracaoPerdida >= 0.15 ? `PERDENDO ${Math.round(ctx.fracaoPerdida * 100)}% DO TERRITÓRIO` : null,
      ctx.capitalTomada ? 'CAPITAL TOMADA' : null,
      ctx.desgaste >= 0.2 ? 'FORÇAS DESGASTADAS' : null,
      ctx.emOutraGuerra ? 'EM OUTRA GUERRA' : null,
      ctx.semApoio ? 'SEM APOIO EXTERNO' : null,
    ].filter(Boolean);
    const corCh = (c) => c >= 0.6 ? 'var(--verde,#22e0a0)' : c >= 0.35 ? 'var(--ambar)' : 'var(--perigo)';

    modal.innerHTML = `<div class="paz-painel">
      <div class="paz-cab">
        <div class="paz-ic">${ico('handshake', 20)}</div>
        <div class="paz-tit"><h2>NEGOCIAR SAÍDA DA GUERRA</h2><span>com ${esc(nome)} · você tem ${dinheiro(e.tesouro)}</span></div>
        ${ISO2_DE[iso] ? `<img class="paz-flag" src="${bandeira(ISO2_DE[iso], 60)}" alt="">` : ''}
        <button class="pp-fechar paz-x">${ico('x', 16)}</button>
      </div>
      <div class="paz-dossie">
        <div class="paz-poder"><span>PODER RELATIVO</span><b class="${rel.R >= 1 ? 'bom' : 'ruim'}">${rel.R}×</b><i>${rel.R >= 1.15 ? 'você domina' : rel.R <= 0.85 ? 'ele é mais forte' : 'equilíbrio'}</i></div>
        <div class="paz-badges">${badges.length ? badges.map((b) => `<span class="paz-badge">${esc(b)}</span>`).join('') : `<span class="paz-badge frio">ele não está sob pressão — vai custar convencer</span>`}</div>
      </div>

      <div class="paz-ops">
        <button class="paz-op" data-tipo="cessar_fogo">
          <div class="paz-op-ic">${ico('handshake', 16)}</div>
          <div class="paz-op-txt"><b>Tentar Selar a Paz</b><span>Um cessar-fogo puro. Sem devolver nada — só convencer.</span></div>
          <div class="paz-op-meta"><i class="paz-ch" style="color:${corCh(chCF)}">${pct(chCF)}</i><small>${dinheiro(TERMOS_PAZ.cessar_fogo.custoBase)} · ${TERMOS_PAZ.cessar_fogo.tempo}s</small></div>
        </button>

        <div class="paz-op-bloco">
          <button class="paz-op destaque" data-tipo="devolver_area" ${meusEstados.length ? '' : 'disabled'}>
            <div class="paz-op-ic">${ico('flag', 16)}</div>
            <div class="paz-op-txt"><b>Devolver Território</b><span>${meusEstados.length ? `Oferte de volta ${selec.size}/${meusEstados.length} estado(s)${reparacoes ? ` + ${dinheiro(reparacoes)} de reparações` : ''}.` : 'Você não tomou nenhum estado dele.'}</span></div>
            <div class="paz-op-meta"><i class="paz-ch" style="color:${corCh(chDA)}">${pct(chDA)}</i><small>${dinheiro(TERMOS_PAZ.devolver_area.custoBase + reparacoes)} · ${TERMOS_PAZ.devolver_area.tempo}s</small></div>
          </button>
          ${meusEstados.length ? `<div class="paz-estados">${meusEstados.map((s) => `<button class="paz-est ${selec.has(s.id) ? 'on' : ''}" data-id="${s.id}">${selec.has(s.id) ? ico('check', 12) : ''} ${esc(s.nome)}</button>`).join('')}</div>
          <div class="paz-rep"><span>Reparações</span><input type="range" id="paz-rep-sl" min="0" max="${maxRep}" step="0.1" value="${reparacoes}"><b>${dinheiro(reparacoes)}</b></div>` : ''}
        </div>

        <button class="paz-op saida" data-tipo="sair_guerra">
          <div class="paz-op-ic">${ico('flag-off', 16)}</div>
          <div class="paz-op-txt"><b>Sair da Guerra (unilateral)</b><span>${prevSaida.vencendo ? 'Você está VENCENDO — recuar agora será visto como covardia (aprovação cai).' : prevSaida.impopular ? 'Guerra impopular — recuar ALIVIA o país (aprovação sobe).' : 'Só encerra o desgaste. Ele pode revidar (' + pct(riscoSaida) + ' de contra-ataque).'}</span></div>
          <div class="paz-op-meta"><i class="paz-ch ${prevSaida.aprovacao >= 0 ? 'bom' : 'ruim'}">${prevSaida.aprovacao >= 0 ? '+' : ''}${prevSaida.aprovacao} aprov.</i><small>grátis · 10s</small></div>
        </button>
      </div>
      <div class="paz-rodape" id="paz-rodape">${ico('info', 12)} A ordem roda na fila de comando. Reparações são pagas na hora — se ele recusar, o dinheiro já era. País continua hostil mesmo aceitando.</div>
    </div>`;

    modal.querySelector('.paz-x').addEventListener('click', fechar);
    modal.querySelectorAll('.paz-est').forEach((b) => b.addEventListener('click', (ev) => { ev.stopPropagation(); const id = b.dataset.id; if (selec.has(id)) selec.delete(id); else selec.add(id); render(); }));
    const sl = modal.querySelector('#paz-rep-sl');
    if (sl) sl.addEventListener('input', (ev) => { reparacoes = Number(ev.target.value) || 0; render(); });
    modal.querySelectorAll('.paz-op[data-tipo]').forEach((b) => b.addEventListener('click', () => confirmar(b.dataset.tipo)));
  }

  function confirmar(tipo) {
    if (tipo === 'devolver_area' && !meusEstados.length) return;
    const custo = tipo === 'devolver_area' ? TERMOS_PAZ.devolver_area.custoBase + reparacoes
      : tipo === 'sair_guerra' ? 0 : TERMOS_PAZ.cessar_fogo.custoBase;
    const acao = {
      id: `paz_${tipo}_${iso}_${Date.now()}`,
      nome: tipo === 'sair_guerra' ? `Sair da guerra — ${nome}` : `${TERMOS_PAZ[tipo]?.nome || 'Paz'} — ${nome}`,
      icone: '🕊️', categoria: 'Diplomacia', custo, custoPA: 1,
      tempo: tipo === 'sair_guerra' ? 10 : TERMOS_PAZ[tipo].tempo, prob: 1,
      _pazIso: iso, _pazTipo: tipo,
      _pazTermos: tipo === 'devolver_area'
        ? { tipo, estados: [...selec], fracaoDevolvida: selec.size / Math.max(1, meusEstados.length), reparacoes }
        : { tipo },
    };
    const r = tr?.enfileirar(acao);
    if (r && !r.ok) { const rod = modal.querySelector('#paz-rodape'); if (rod) rod.innerHTML = `<b style="color:var(--perigo)">${ico('triangle-alert', 12)} ${esc(r.motivo || 'Não deu para enfileirar.')}</b>`; return; }
    modal.querySelector('.paz-painel').innerHTML = `<div class="paz-fim ok">${ico('clock', 26)}<h2>ORDEM ENFILEIRADA</h2><p>${tipo === 'sair_guerra' ? 'A retirada' : 'A proposta'} está na fila de comando — o resultado chega em ${acao.tempo}s.</p><button class="dist-aplicar" id="paz-ok">PRONTO</button></div>`;
    modal.querySelector('#paz-ok').addEventListener('click', fechar);
  }
  render();
}
