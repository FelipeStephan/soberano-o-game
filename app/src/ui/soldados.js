// ═══════════════════════════════════════════════════════════════════════
// DOSSIÊ DO SOLDADO — gente não se encomenda, se RECRUTA
// ═══════════════════════════════════════════════════════════════════════
// O que isto conserta: clicar no fuzileiro abria a ficha de EQUIPAMENTO — "Fabricante",
// "Encomendar mais", slider de quantidade — como se soldado fosse tanque saído de uma
// linha de montagem. Soldado é PESSOA. Tem teto humano (o país só sustenta tantos em
// pé), vem de RECRUTAMENTO (voluntário, reserva, conscrição) e cada leva cobra um preço
// político. Esta tela mostra o efetivo, a reserva, e os caminhos reais de encher as
// fileiras — sem um único "fabricante" à vista.
import { UNIDADE_POR_ID } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { ACAO_POR_ID, tempoDe } from '../dados/acoes.js';
import { tetoSoldados } from '../dados/efetivoMilitar.js';
import { estaDesbloqueada } from '../jogo/desbloqueios.js';
import { dinheiro } from '../jogo/formato.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RECRUTAS = ['alistamento_voluntario', 'convocar_reserva', 'alistamento_obrigatorio'];
const nf = (n) => Number(n || 0).toLocaleString('pt-BR');

// Rótulo curto do efeito de uma política de recrutamento, pra ler num piscar.
function resumoEfeito(a) {
  const partes = [];
  const q = a.recruta?.infantaria;
  if (q) partes.push({ txt: `+${nf(q)} soldados`, cls: 'bom' });
  const ef = a.efeitos || {};
  const ROT = { aprovacao: 'aprovação', estabilidade: 'estabilidade', liberdades: 'liberdades', temp_guerra: 'clima de guerra' };
  for (const [k, v] of Object.entries(ef)) {
    if (typeof v !== 'number' || !v) continue;
    partes.push({ txt: `${ROT[k] || k} ${v > 0 ? '+' : ''}${v}`, cls: v > 0 ? 'bom' : 'ruim' });
  }
  return partes.slice(0, 4);
}

export function abrirSoldados(jogo, { tr, onFim } = {}) {
  const e = jogo.estado;
  const iso = jogo.ficha.iso || 'USA';
  const u = UNIDADE_POR_ID.infantaria;
  const eq = equipamentosDoPais(iso)?.infantaria || {};

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  function render(flash) {
    const sold = e.forcas?.infantaria || 0;
    const teto = tetoSoldados(iso);
    const reserva = e.reservaMilitar || 0;
    const pct = Math.min(100, Math.round((sold / teto) * 100));
    const noTeto = sold >= teto;
    // rótulo do fuzil de serviço: tira o "Fuzileiro" do nome, sobra a arma
    const fuzil = (eq.nome || 'Fuzil de assalto').replace(/^fuzileiro[^(]*/i, '').replace(/[()]/g, '').trim() || eq.nome;

    modal.innerHTML = `<div class="sol-painel">
      <div class="sol-foto">
        <img src="${eq.foto || ''}" alt="" onerror="this.parentElement.innerHTML='<span class=\\'sol-emoji\\'>${u.icone}</span>'">
        <button class="pp-fechar sol-x">${ico('x', 15)}</button>
        <div class="sol-titulo">
          <div class="sol-dom">${ico('users', 10)} Infantaria · o efetivo humano do país</div>
          <div class="sol-nome">Soldados</div>
          ${fuzil ? `<div class="sol-fuzil">🔫 Fuzil de serviço: <b>${esc(fuzil)}</b>${eq.fab ? ` · ${esc(eq.fab)}` : ''}</div>` : ''}
        </div>
      </div>

      <div class="sol-corpo">
        <div class="sol-stats">
          <div class="sol-s grande">
            <span>Efetivo ativo</span>
            <b class="${noTeto ? 'amb' : ''}">${nf(sold)} <i>/ ${nf(teto)}</i></b>
            <div class="sol-barra"><i style="width:${pct}%"></i></div>
            <small>${noTeto ? 'no teto humano do país' : `${pct}% do limite — cabem mais ${nf(teto - sold)}`}</small>
          </div>
          <div class="sol-s"><span>Reserva mobilizável</span><b class="cy">${nf(reserva)}</b><small>convocáveis às armas</small></div>
          <div class="sol-s"><span>Peso de combate</span><b>${u.poder}</b><small>por soldado</small></div>
        </div>

        <div class="sol-sec">${ico('flag', 11)} Recrutamento</div>
        <div class="sol-recrutas">
          ${RECRUTAS.map((id) => {
            const a = ACAO_POR_ID[id];
            if (!a) return '';
            const desbloq = estaDesbloqueada(a, e);
            const pode = jogo.podeEnfileirar(id);
            const efs = resumoEfeito(a);
            const bloqueado = !pode.ok;
            return `<div class="sol-card ${!desbloq ? 'travada' : ''} ${bloqueado && desbloq ? 'bloq' : ''}">
              <div class="sol-card-top"><span class="sol-ic">${a.icone}</span><b>${esc(a.nome)}</b>
                ${a.usaReserva ? '<span class="sol-tag res">usa reserva</span>' : ''}${a.major ? '<span class="sol-tag maj">custa caro</span>' : ''}</div>
              <div class="sol-desc">${esc(a.descricao)}</div>
              <div class="sol-efs">${efs.map((f) => `<span class="sol-ef ${f.cls}">${esc(f.txt)}</span>`).join('')}</div>
              ${!desbloq
                ? `<div class="sol-lock">🔒 ${esc(a.dica || 'Requisito a cumprir')}</div>`
                : `<button class="sol-go" data-id="${id}" ${bloqueado ? 'disabled' : ''}>
                    ${bloqueado ? `<span>${esc(pode.motivo || 'indisponível')}</span>` : `<span>Recrutar</span><i>${a.custo ? dinheiro(a.custo) + ' · ' : ''}⚡${a.custoPA || 1} · ${tempoDe(a)}s</i>`}
                  </button>`}
            </div>`;
          }).join('')}
        </div>

        ${flash ? `<div class="sol-flash ${flash.ok ? 'ok' : 'ruim'}">${ico(flash.ok ? 'clock' : 'triangle-alert', 13)} <span>${esc(flash.msg)}</span></div>` : ''}

        <div class="sol-rodape">${ico('shield', 12)} <span>Para posicionar soldados num estado seu, use <b>Reforçar</b>. Para lançá-los contra um alvo, o <b>Teatro de Operações</b>.</span></div>
      </div>
    </div>`;

    modal.querySelector('.sol-x').addEventListener('click', fechar);
    modal.querySelectorAll('.sol-go[data-id]').forEach((b) => b.addEventListener('click', () => {
      const a = ACAO_POR_ID[b.dataset.id];
      const r = tr?.enfileirar(a);
      if (r && !r.ok) { render({ ok: false, msg: r.motivo || 'Não deu para enfileirar.' }); return; }
      render({ ok: true, msg: `${a.nome} na fila de comando — a leva chega em ${tempoDe(a)}s.` });
      onFim?.();
    }));
  }

  render();
}
