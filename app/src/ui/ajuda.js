// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE AJUDA EXTERNA — escolher um lado na guerra dos outros
// ═══════════════════════════════════════════════════════════════════════
// A ergonomia é o oposto da nuclear: aqui não há trava nem horror, há CÁLCULO.
// Você olha um país sangrando, decide se vale comprar a gratidão dele — com caixa
// ou com ferro — e o painel te mostra na hora quanto sobe a relação e quem, do outro
// lado, vai anotar o seu nome. Poder brando também é poder.
import { alvosDeAjuda, ajudarComDinheiro, ajudarComArsenal, mancheteAjuda } from '../jogo/ajuda.js';
import { UNIDADES, DOMINIOS } from '../dados/forcas.js';
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE, FOTO_UNIDADE } from '../dados/imagens.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { dinheiro } from '../jogo/formato.js';
import { ico, ICO } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (i) => PAISES[i]?.nome || i;

export function abrirAjuda(feature, jogo, { onFim, globoCtrl } = {}) {
  const iso = feature?.properties?.ISO_A3 || feature?.properties?.ADM0_A3 || '';
  const alvo = alvosDeAjuda(jogo.estado).find((a) => a.iso === iso);

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
  const sair = () => { fechar(); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', tecla);

  if (!alvo) {
    modal.innerHTML = `<div class="ajuda-painel">
      <div class="aj-cab"><span class="aj-simbolo">${ico('heart-handshake', 24)}</span>
        <div class="aj-tit"><h2>AJUDA EXTERNA</h2><div class="aj-sub">Sem conflito ativo</div></div>
        <button class="pp-fechar" id="aj-x">${ico('x', 16)}</button></div>
      <div class="aj-vazio">${ico('info', 16)} ${esc(nomeDe(iso))} não está numa guerra agora. Você só pode socorrer países sob fogo — quem está em paz não precisa das suas armas.</div>
    </div>`;
    modal.querySelector('#aj-x').addEventListener('click', sair);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) sair(); });
    return;
  }

  const inimigo = alvo.inimigo;
  let aba = 'dinheiro';   // dinheiro | arsenal
  const deploy = {};       // seleção de unidades

  render();

  function render() {
    const teto = Math.max(0, Math.floor((jogo.estado.tesouro || 0) * 100) / 100);
    modal.innerHTML = `<div class="ajuda-painel">
      <div class="aj-cab">
        <span class="aj-simbolo">${ico('heart-handshake', 24)}</span>
        <div class="aj-tit"><h2>APOIAR ${esc(alvo.nome.toUpperCase())}</h2>
          <div class="aj-sub">Escolher um lado tem preço — e testemunhas</div></div>
        ${ISO2_DE[iso] ? `<img class="gp-flag" src="${bandeira(ISO2_DE[iso], 80)}" alt="">` : ''}
        <button class="pp-fechar" id="aj-x">${ico('x', 16)}</button>
      </div>

      <div class="aj-conflito">
        <div class="ajc-lado ajc-amigo"><span>APOIAR</span><b>${esc(alvo.nome)}</b></div>
        <span class="ajc-vs">${ico('swords', 15)}</span>
        <div class="ajc-lado ajc-inimigo"><span>CONTRA</span><b>${esc(nomeDe(inimigo))}</b></div>
      </div>
      <div class="aj-ctx">${ico('info', 13)} ${esc(alvo.contexto)}. Relação atual com ${esc(alvo.nome)}: <b>${alvo.rel}</b>.</div>

      <div class="aj-abas">
        <button class="aj-aba ${aba === 'dinheiro' ? 'on' : ''}" data-aba="dinheiro">${ico('banknote', 14)} Dinheiro</button>
        <button class="aj-aba ${aba === 'arsenal' ? 'on' : ''}" data-aba="arsenal">${ico('swords', 14)} Arsenal</button>
      </div>

      ${aba === 'dinheiro' ? painelDinheiro(teto) : painelArsenal()}
    </div>`;

    modal.querySelector('#aj-x').addEventListener('click', sair);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) sair(); });
    modal.querySelectorAll('.aj-aba').forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; render(); }));

    if (aba === 'dinheiro') ligarDinheiro(teto);
    else ligarArsenal();
  }

  // ── DINHEIRO ────────────────────────────────────────────────────────
  function painelDinheiro(teto) {
    const val = Math.min(1, teto);
    return `<div class="aj-corpo">
      <div class="aj-dinheiro">
        <div class="ajd-linha"><span>Caixa disponível</span><b>${dinheiro(teto)}</b></div>
        <input type="range" id="aj-slider" min="0" max="${teto}" step="0.05" value="${val}">
        <div class="ajd-valor">Enviar <b id="aj-valtxt">${dinheiro(val)}</b></div>
        <div class="ajd-prev" id="aj-prev"></div>
      </div>
      <button class="aj-confirmar" id="aj-conf" ${teto <= 0 ? 'disabled' : ''}>${ico('send', 15)} <span>TRANSFERIR AJUDA FINANCEIRA</span></button>
      ${teto <= 0 ? `<div class="aj-vazio">${ico('ban', 14)} Sem caixa para ajudar agora.</div>` : ''}
    </div>`;
  }

  function ligarDinheiro(teto) {
    const slider = modal.querySelector('#aj-slider');
    const valtxt = modal.querySelector('#aj-valtxt');
    const prev = modal.querySelector('#aj-prev');
    if (!slider) return;
    const atualizar = () => {
      const v = Number(slider.value);
      valtxt.textContent = dinheiro(v);
      const ganho = Math.round(Math.max(4, Math.min(30, v * 60)));
      prev.innerHTML = `${ico('trending-up', 12)} Gratidão de ${esc(alvo.nome)}: <b class="bom">+${ganho}</b> na relação · inclina a guerra a favor deles`;
    };
    slider.addEventListener('input', atualizar);
    atualizar();
    modal.querySelector('#aj-conf')?.addEventListener('click', () => {
      const v = Number(slider.value);
      if (v <= 0) return;
      const res = ajudarComDinheiro(jogo.estado, iso, v);
      if (res.falha) { prev.innerHTML = `<b class="ruim">${esc(res.falha)}</b>`; return; }
      finalizar(res);
    });
  }

  // ── ARSENAL ─────────────────────────────────────────────────────────
  function painelArsenal() {
    const disp = UNIDADES.filter((u) => (jogo.estado.forcas?.[u.id] || 0) > 0);
    if (!disp.length) {
      return `<div class="aj-corpo"><div class="aj-vazio">${ico('ban', 14)} Você não tem unidades no arsenal para transferir.</div></div>`;
    }
    // As fotos REAIS do que a sua nação opera — o mesmo catálogo da tela de guerra
    // (equipamentos.js sabe que o caça russo é Su-57, não um ícone genérico).
    const equip = equipamentosDoPais(jogo.estado.iso || 'USA');
    const bandOrigem = (u) => {
      const org = equip?.[u.id]?.origem;
      return org && ISO2_DE[org] ? `<img class="aja-flag" src="${bandeira(ISO2_DE[org], 40)}" alt="" onerror="this.style.display='none'">` : '';
    };
    // agrupado por domínio (Terra / Ar / Mar / Estratégico / Defesa) pra dar ordem visual
    const grupos = DOMINIOS.map((d) => {
      const us = disp.filter((u) => u.dominio === d);
      if (!us.length) return '';
      return `<div class="aja-grupo">
        <div class="aja-dom">${ico(ICO[d] || 'circle', 11)} ${d}</div>
        ${us.map((u) => {
          const tem = jogo.estado.forcas[u.id] || 0;
          const eq = equip?.[u.id];
          const foto = eq?.foto || FOTO_UNIDADE[u.id];
          return `<div class="aja-item" data-id="${u.id}">
            <span class="aja-foto">${foto ? `<img src="${foto}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${u.icone}'">` : u.icone}</span>
            <span class="aja-info">
              <b>${esc(eq?.nome || u.nome)}</b>
              <small>${eq ? esc(u.nome) : ''} · você tem ${tem.toLocaleString('pt-BR')}</small>
            </span>
            ${bandOrigem(u)}
            <div class="aja-ctrl">
              <button class="aja-btn" data-d="-1" aria-label="menos">−</button>
              <input class="aja-qtd" data-id="${u.id}" type="number" min="0" max="${tem}" step="${u.passo}" value="0">
              <button class="aja-btn" data-d="1" aria-label="mais">+</button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('');
    return `<div class="aj-corpo">
      <div class="aj-arsenal">${grupos}</div>
      <div class="ajd-prev" id="aj-prev">${ico('info', 12)} Selecione o que doar. Arsenal inclina o campo mais que dinheiro — e provoca mais.</div>
      <button class="aj-confirmar aj-arm" id="aj-conf">${ico('send', 15)} <span>ENVIAR ARMAMENTO</span></button>
    </div>`;
  }

  function ligarArsenal() {
    const prev = modal.querySelector('#aj-prev');
    const recalc = () => {
      let peso = 0, total = 0;
      for (const inp of modal.querySelectorAll('.aja-qtd')) {
        const u = UNIDADES.find((x) => x.id === inp.dataset.id);
        const q = Math.max(0, Math.min(Number(inp.value) || 0, jogo.estado.forcas[u.id] || 0));
        deploy[u.id] = q; total += q; peso += q * u.poder;
      }
      const ganho = Math.round(Math.max(6, Math.min(35, peso * 30 + 6)));
      prev.innerHTML = total > 0
        ? `${ico('trending-up', 12)} Gratidão: <b class="bom">+${ganho}</b> · ${esc(nomeDe(inimigo))}: <b class="ruim">−12</b> (você tomou lado)`
        : `${ico('info', 12)} Selecione o que doar. Arsenal inclina o campo mais que dinheiro — e provoca mais.`;
    };
    modal.querySelectorAll('.aja-item').forEach((item) => {
      const inp = item.querySelector('.aja-qtd');
      item.querySelectorAll('.aja-btn').forEach((b) => b.addEventListener('click', () => {
        const u = UNIDADES.find((x) => x.id === inp.dataset.id);
        const passo = u.passo * Number(b.dataset.d);
        inp.value = Math.max(0, Math.min((Number(inp.value) || 0) + passo, jogo.estado.forcas[u.id] || 0));
        recalc();
      }));
      inp.addEventListener('input', recalc);
    });
    recalc();
    modal.querySelector('#aj-conf')?.addEventListener('click', () => {
      const res = ajudarComArsenal(jogo.estado, iso, deploy);
      if (res.falha) { prev.innerHTML = `<b class="ruim">${esc(res.falha)}</b>`; return; }
      finalizar(res);
    });
  }

  // ── DESFECHO ────────────────────────────────────────────────────────
  function finalizar(res) {
    // comboio de ajuda cruza o mapa até o beneficiado
    globoCtrl?.desenharLinha?.(feature, 'comercio', 5000);
    // o mundo registra o gesto
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: 'Ajuda Externa', texto: mancheteAjuda(jogo.estado, res), cor: '#22e0a0' }]);

    modal.innerHTML = `<div class="ajuda-painel aj-fim">
      <div class="ajf-simbolo">${ico('heart-handshake', 38)}</div>
      <h2>APOIO ENTREGUE A ${esc(alvo.nome.toUpperCase())}</h2>
      <p class="ajf-lead">${res.tipo === 'dinheiro'
        ? `${dinheiro(res.valor)} saíram do seu caixa. ${esc(alvo.nome)} não esquece quem apareceu na hora do aperto.`
        : `Seu ferro agora está na linha de frente de ${esc(alvo.nome)}. ${inimigo ? `${esc(nomeDe(inimigo))} sabe de que lado você está.` : 'O mundo reparou.'}`}</p>
      <div class="ajf-grade">
        <div class="ajf-cel bom"><span>Relação com ${esc(alvo.nome)}</span><b>+${res.ganhoRel}</b></div>
        ${res.tipo === 'arsenal' && inimigo ? `<div class="ajf-cel ruim"><span>Relação com ${esc(nomeDe(inimigo))}</span><b>−12</b></div>` : ''}
      </div>
      <button class="avancar" id="ajf-ok">CONTINUAR ${ico('chevron-right', 15)}</button>
    </div>`;
    modal.querySelector('#ajf-ok').addEventListener('click', sair);
  }
}
