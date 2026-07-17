// ═══════════════════════════════════════════════════════════════════════
// INSTALAR BASE MILITAR
// ═══════════════════════════════════════════════════════════════════════
// Só aparece onde faz sentido: país PARCEIRO (relação ≥ 40, que aceita negociar um
// acordo de status de forças) ou território OCUPADO (onde você não pede licença).
//
// Instalar uma base é a jogada mais estratégica do jogo e a mais barata de errar:
// custa manutenção todo turno, o anfitrião se ressente, e a imprensa te chama de
// imperialista. Em troca, os seus ataques passam a sair de 800 km do alvo em vez
// de atravessar um oceano.
import { TIPOS_BASE, podeInstalarBase, instalarBase, basesEm, sitioDe, removerBase, distanciaKm } from '../dados/bases.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { aplicarPolitico } from '../jogo/politico.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { dinheiro } from '../jogo/formato.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PA = 1;

export function abrirBases(feature, jogo, { relValor, nome, onFim, onAtualizar } = {}) {
  const code = feature?.properties?.ISO_A3 || feature?.properties?.ADM0_A3 || '';
  const coord = { lat: Number(feature?.properties?.LABEL_Y), lng: Number(feature?.properties?.LABEL_X) };
  const eleg = podeInstalarBase(jogo.estado, code, relValor ?? 0);
  const sitio = sitioDe(code);
  const jaTem = basesEm(jogo.estado, code);
  let sel = sitio ? TIPOS_BASE[sitio.tipo] : TIPOS_BASE.aerea;
  let confirmado = null;   // recibo da última instalação, pro jogador VER que funcionou

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);

  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);

  function render() {
    const bd = ISO2_DE[code] ? bandeira(ISO2_DE[code], 80) : null;
    modal.innerHTML = `<div class="base-painel">
      <div class="bp-cab">
        <span class="bp-ic">${ico('radio-tower', 24)}</span>
        <div class="bp-tit">
          <h2>Presença Militar em ${esc(nome || code)}</h2>
          <div class="bp-sub">Projeção de poder permanente</div>
        </div>
        ${bd ? `<img class="gp-flag" src="${bd}" alt="">` : ''}
        <button class="pp-fechar" id="bp-x" title="Fechar (Esc)">${ico('x', 16)}</button>
      </div>

      ${confirmado ? `<div class="bp-recibo">
        ${ico('circle-check', 18)}
        <div>
          <b>${esc(confirmado.base.nome)} operacional</b>
          <span>${esc(confirmado.tipo.nome)} instalada · ${dinheiro(confirmado.custo)} debitados · 1 ponto de ação consumido</span>
        </div>
      </div>` : ''}

      ${jaTem.length ? `<div class="bp-atuais">
        <div class="bp-lab">${ico('check', 12)} Instalações ativas aqui</div>
        ${jaTem.map((b) => `<div class="bp-atual">
          <span class="bpa-ic">${ico(TIPOS_BASE[b.tipo]?.ic || 'tent', 15)}</span>
          <span class="bpa-txt"><b>${esc(b.nome)}</b><small>${TIPOS_BASE[b.tipo]?.nome} · ativa há ${(jogo.turno || 0) - (b.desde || 0)} ciclo(s) · custa ${dinheiro(TIPOS_BASE[b.tipo]?.manutencao || 0)}/ciclo</small></span>
          <button class="bpa-fechar" data-id="${b.id}" title="Desativar">${ico('trash-2', 13)}</button>
        </div>`).join('')}
      </div>` : ''}

      ${!eleg.pode
        ? `<div class="bp-bloqueio">${ico('ban', 16)}<div><b>Não é possível instalar aqui</b><span>${esc(eleg.motivo)}</span></div></div>`
        : `<div class="bp-ok ${eleg.viaOcupacao ? 'forca' : ''}">${ico(eleg.viaOcupacao ? 'flag' : 'handshake', 15)} ${esc(eleg.motivo)}</div>

        ${sitio ? `<div class="bp-sitio">
          <div class="bps-cab">${ico('map-pin', 13)} <b>${esc(sitio.nome)}</b><span>sítio histórico</span></div>
          <div class="bps-nota">${esc(sitio.nota)}</div>
        </div>` : `<div class="bp-sitio novo">
          <div class="bps-cab">${ico('map-pin', 13)} <b>Instalação nova</b><span>sem sítio prévio</span></div>
          <div class="bps-nota">Não há infraestrutura militar herdada aqui. Vai ser construído do zero, no meio do nada, com concreto e dinheiro.</div>
        </div>`}

        <div class="bp-lab">${ico('layers', 12)} Tipo de instalação</div>
        <div class="bp-tipos">${Object.values(TIPOS_BASE).map((t) => cardTipo(t)).join('')}</div>

        <div class="bp-custos">
          <div class="bpc"><span>Instalação</span><b class="${jogo.estado.tesouro < sel.custo ? 'ruim' : ''}">${dinheiro(sel.custo)}</b></div>
          <div class="bpc"><span>Manutenção</span><b class="amb">${dinheiro(sel.manutencao)}<small>/ciclo</small></b></div>
          <div class="bpc"><span>Alcance</span><b>${sel.alcance.toLocaleString('pt-BR')} km</b></div>
          <div class="bpc"><span>Bônus de ataque</span><b class="bom">+${Math.round((sel.poder - 1) * 100)}%</b></div>
        </div>

        <div class="bp-preco-pol">${ico('triangle-alert', 12)}
          ${eleg.viaOcupacao
            ? 'Base em território ocupado alimenta a narrativa de ocupação permanente: <b>a insurgência acelera</b>.'
            : `Tropa estrangeira no solo é ferida aberta em qualquer país. <b>A relação com ${esc(nome)} cai</b> e o mundo chama de imperialismo.`}
        </div>

        <div class="bp-bloqueio" id="bp-erro" style="display:none"></div>
        <button class="bp-instalar" id="bp-go" ${jogo.estado.tesouro < sel.custo || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
          ${ico(sel.ic, 17)} <span>INSTALAR ${sel.nome.toUpperCase()} — ${dinheiro(sel.custo)} + 1 PA</span>
        </button>
        ${jogo.estado.pontos_acao < PA ? `<div class="bp-bloqueio pequeno">${ico('ban', 13)} Sem pontos de ação neste ciclo.</div>` : ''}`}
    </div>`;

    modal.querySelector('#bp-x').addEventListener('click', fechar);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });
    modal.querySelectorAll('.bp-tipo').forEach((b) => b.addEventListener('click', () => {
      sel = TIPOS_BASE[b.dataset.t]; render();
    }));
    modal.querySelectorAll('.bpa-fechar').forEach((b) => b.addEventListener('click', () => {
      removerBase(jogo.estado, b.dataset.id);
      jogo.registrarBase?.({ tipo: 'remover', paisNome: nome });
      onAtualizar?.();
      render();
    }));
    modal.querySelector('#bp-go')?.addEventListener('click', () => {
      // BUG QUE ISTO CONSERTA: `if (r.falha) return;` fazia o botão falhar EM SILÊNCIO.
      // O jogador clicava, nada acontecia, e não havia como saber por quê. Falha
      // silenciosa é o pior tipo de bug de UI: parece que o jogo travou.
      const r = instalarBase(jogo.estado, { iso: code, nome, lat: coord.lat, lng: coord.lng, tipo: sel.id, viaOcupacao: eleg.viaOcupacao });
      if (r.falha) {
        const el = modal.querySelector('#bp-erro');
        if (el) { el.style.display = ''; el.innerHTML = `${ico('ban', 14)} ${esc(r.falha)}`; }
        return;
      }
      jogo.estado.pontos_acao -= PA;

      // O preço político: ninguém gosta de tropa estrangeira em casa.
      if (eleg.viaOcupacao) {
        const oc = (jogo.estado.conquistados || []).find((c) => c.iso === code);
        if (oc) oc.insurgencia = Math.min(100, oc.insurgencia + 12);
        aplicarEfeitos(jogo.estado, { seguranca: 4, soft_power: -6 });
      } else {
        const relKey = chaveRel(jogo.estado, code);
        if (relKey) jogo.estado[relKey] = Math.max(-100, (jogo.estado[relKey] || 0) - 10);
        aplicarEfeitos(jogo.estado, { seguranca: 5, soft_power: -4 });
      }
      aplicarPolitico(jogo.estado, { autoridade: 5 });
      jogo.registrarBase?.({ tipo: 'instalar', base: r.base, tipoInfo: r.tipo, paisNome: nome });
      // A HUD vive FORA deste modal — sem avisar, o PA e o caixa lá em cima ficavam
      // congelados até fechar o painel, e parecia que nada tinha acontecido.
      onAtualizar?.();
      confirmado = { base: r.base, tipo: r.tipo, custo: r.tipo.custo };
      render();
    });
    // O recibo: some sozinho, mas o jogador VIU que a jogada aconteceu.
    if (confirmado) setTimeout(() => { confirmado = null; }, 4000);
  }

  function cardTipo(t) {
    const recomendado = sitio && sitio.tipo === t.id;
    return `<button class="bp-tipo ${sel.id === t.id ? 'sel' : ''}" data-t="${t.id}">
      <span class="bpt-ic">${ico(t.ic, 18)}</span>
      <span class="bpt-nome">${esc(t.nome)}${recomendado ? '<i>sítio existente</i>' : ''}</span>
      <span class="bpt-desc">${esc(t.desc)}</span>
      <span class="bpt-meta">${dinheiro(t.custo)} · ${t.alcance.toLocaleString('pt-BR')} km · +${Math.round((t.poder - 1) * 100)}%</span>
    </button>`;
  }

  render();
}

// Descobre a chave rel_<x> do país. Países do mapa têm chave nomeada (rel_brasil);
// o resto cai numa chave sintetizada a partir do ISO, igual ao resto do jogo.
function chaveRel(estado, code) {
  const nomeada = PAISES[code]?.rel;
  if (nomeada && nomeada in estado) return nomeada;
  const k = `rel_${String(code).toLowerCase()}`;
  return k in estado ? k : null;
}

// Resumo pra HUD: quantas bases, onde, quanto custam.
export function resumoBases(estado) {
  const bs = estado.bases || [];
  const custo = bs.reduce((a, b) => a + (TIPOS_BASE[b.tipo]?.manutencao || 0), 0);
  return { total: bs.length, custo: Math.round(custo * 100) / 100, lista: bs };
}

export { distanciaKm };
