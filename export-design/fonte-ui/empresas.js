// PAINEL DE EMPRESAS — o poder econômico da nação.
// Investir, privatizar (caixa agora, lucro nunca mais) ou estatizar (caro e o mercado odeia).
import {
  custoInvestir, ganhoPrivatizar, custoEstatizar, custoNacionalizar,
  lucroDoTurno, descontoIndustrial, resumoEstatal, ehEstatal,
} from '../dados/empresas.js';
import { sincronizarPetroleo } from '../jogo/petroleo.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { aplicarPolitico } from '../jogo/politico.js';
import { dinheiro } from '../jogo/formato.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PA = 1;
const ICO_SETOR = {
  Defesa: 'swords', Energia: 'zap', Tecnologia: 'cpu', 'Mineração': 'mountain',
  Aeroespacial: 'plane', Industrial: 'factory', Infraestrutura: 'train-front', Financeiro: 'landmark',
};

export function abrirEmpresas(jogo, { onFim } = {}) {
  let sel = null;
  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);

  const fechar = () => { modal.remove(); onFim?.(); };

  function render() {
    const emp = jogo.empresas;
    const lucro = lucroDoTurno(emp, jogo.estado);
    const desc = descontoIndustrial(emp);
    const rs = resumoEstatal(emp);
    modal.innerHTML = `<div class="emp-painel">
      <div class="emp-cab">
        <span class="emp-ic">${ico('landmark', 24)}</span>
        <div class="emp-tit">
          <h2>Complexo Estatal</h2>
          <div class="emp-sub">${esc(jogo.ficha.pais)} · ${rs.estatais} estatais de ${rs.total} ativos estratégicos</div>
        </div>
        <div class="emp-lucro"><span>Lucro / ciclo</span><b class="${lucro >= 0 ? 'bom' : 'ruim'}">${dinheiro(lucro)}</b></div>
        <button class="pp-fechar">${ico('x', 15)}</button>
      </div>
      <div class="emp-resumo">
        <div class="er"><span>Patrimônio da União</span><b class="amb">${dinheiro(rs.patrimonio)}</b></div>
        <div class="er"><span>Petróleo próprio</span><b class="bom">${rs.petroleo}<small>Mb/d</small></b></div>
        <div class="er"><span>Brent</span><b>US$ ${(jogo.estado.preco_petroleo || 78).toFixed(2)}</b></div>
      </div>
      ${desc > 0 ? `<div class="emp-faixa">${ico('shield', 14)} Sua base de defesa nacional dá <b>${Math.round(desc * 100)}% de desconto</b> em compras militares.</div>` : ''}
      <div class="emp-corpo">
        <div class="emp-lista">${emp.map((e, i) => cardEmpresa(e, i)).join('')}</div>
        <div class="emp-detalhe" id="emp-det"></div>
      </div>
    </div>`;
    modal.querySelector('.pp-fechar').addEventListener('click', fechar);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });
    modal.querySelectorAll('.emp-card').forEach((b) => b.addEventListener('click', () => {
      sel = jogo.empresas[Number(b.dataset.i)]; render(); detalhe();
    }));
    if (sel) detalhe();
  }

  function cardEmpresa(e, i) {
    const estatal = ehEstatal(e);
    return `<button class="emp-card ${sel?.id === e.id ? 'sel' : ''} ${estatal ? 'estatal' : ''}" data-i="${i}">
      <div class="emp-logo ${e.logo ? '' : 'sem'}">${e.logo
        ? `<img src="${e.logo}" alt="" loading="lazy" onerror="this.parentElement.classList.add('sem');this.parentElement.innerHTML='${ico(ICO_SETOR[e.setor] || 'building-2', 26).replace(/"/g, '&quot;')}'">`
        : ico(ICO_SETOR[e.setor] || 'building-2', 26)}</div>
      <div class="emp-info">
        <div class="emp-nome">${esc(e.nome)}${e.sigla ? ` <i>${esc(e.sigla)}</i>` : ''}</div>
        <div class="emp-setor">${ico(ICO_SETOR[e.setor] || 'building-2', 11)} ${esc(e.setor)}
          ${estatal ? '<span class="emp-tag est">ESTATAL</span>' : '<span class="emp-tag priv">PRIVADA</span>'}
          ${e.petroleo ? `<span class="emp-tag oleo">${e.petroleo} Mb/d</span>` : ''}</div>
        <div class="emp-barra"><div class="emp-fill ${estatal ? 'est' : ''}" style="width:${e.participacao}%"></div></div>
        <div class="emp-meta"><span>sua fatia <b>${e.participacao}%</b></span><span>vale ${dinheiro(e.valor)}</span></div>
      </div>
    </button>`;
  }

  function detalhe() {
    const e = sel; if (!e) return;
    const alvo = modal.querySelector('#emp-det');
    const cInv = custoInvestir(e);
    const pctVenda = Math.min(e.participacao, 25);
    const gVenda = ganhoPrivatizar(e, pctVenda);
    const pctComp = Math.min(100 - e.participacao, 25);
    const cComp = custoEstatizar(e, pctComp);
    const cNac = custoNacionalizar(e);
    const lucroDela = e.valor * e.margem * (e.participacao / 100);

    alvo.innerHTML = `
      <div class="ed-cab">${esc(e.nome)}</div>
      <div class="ed-desc">${esc(e.desc)}</div>
      <div class="ed-stats">
        <div class="ed-s"><span>Sua fatia</span><b>${e.participacao}%</b></div>
        <div class="ed-s"><span>Valor</span><b class="amb">${dinheiro(e.valor)}</b></div>
        <div class="ed-s"><span>Margem</span><b>${Math.round(e.margem * 100)}%</b></div>
        <div class="ed-s"><span>Te rende</span><b class="bom">${dinheiro(lucroDela)}<small>/ciclo</small></b></div>
      </div>
      ${e.petroleo ? `<div class="ed-oleo">${ico('fuel', 13)}
        <span>Bombeia <b>${e.petroleo} Mb/d</b> · você recebe <b>${(e.petroleo * e.participacao / 100).toFixed(1)} Mb/d</b> pela sua fatia de ${e.participacao}%.
        <i>Investir aqui aumenta a produção nacional. Privatizar derruba.</i></span></div>` : ''}

      ${e.bonus && e.participacao >= 20 ? `<div class="ed-bonus">${ico('sparkles', 12)} Enquanto você tem ≥20%: ${Object.entries(e.bonus).map(([k, v]) => `<span class="mud bom">${k} +${(v * e.participacao / 100).toFixed(1)}/ciclo</span>`).join(' ')}</div>` : ''}

      <div class="ed-acoes">
        <button class="ed-btn inv" id="ed-inv" ${jogo.estado.tesouro < cInv || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
          ${ico('trending-up', 15)} <span><b>Investir</b><small>${dinheiro(cInv)} → +valor, +margem</small></span>
        </button>
        <button class="ed-btn priv" id="ed-priv" ${e.participacao < 5 || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
          ${ico('tag', 15)} <span><b>Privatizar ${pctVenda}%</b><small>+${dinheiro(gVenda)} agora · perde lucro</small></span>
        </button>
        <button class="ed-btn est" id="ed-est" ${e.participacao >= 100 || jogo.estado.tesouro < cComp || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
          ${ico('landmark', 15)} <span><b>Estatizar +${pctComp}%</b><small>${dinheiro(cComp)} · mercado reage mal</small></span>
        </button>
        <button class="ed-btn nac" id="ed-nac" ${e.participacao >= 100 || jogo.estado.tesouro < cNac || jogo.estado.pontos_acao < PA ? 'disabled' : ''}>
          ${ico('gavel', 15)} <span><b>Nacionalizar 100%</b><small>${dinheiro(cNac)} · confisco · o capital foge</small></span>
        </button>
      </div>
      <div class="ed-aviso">${ico('triangle-alert', 12)} Privatizar enche o caixa hoje e te deixa sem renda amanhã. Estatizar custa prêmio e assusta o mercado. <b>Nacionalizar é confisco</b>: você paga 60% do valor, fica com tudo, e o mundo passa a te tratar como quem toma o que quer. Escolha o seu veneno.</div>`;

    // Toda jogada RESSINCRONIZA o petróleo: é o elo entre a planilha e o mapa.
    // Sem isso, investir na Exxon não mudaria a produção nacional e o sistema
    // inteiro seria decorativo.
    const depois = () => {
      sincronizarPetroleo(jogo.estado, jogo.empresas);
      sel = e; render(); detalhe();
    };

    alvo.querySelector('#ed-inv')?.addEventListener('click', () => {
      jogo.estado.tesouro = r2(jogo.estado.tesouro - cInv);
      jogo.estado.pontos_acao -= PA;
      e.valor = r3(e.valor * 1.22); e.margem = Math.min(0.25, r3(e.margem * 1.08));
      // Aporte em petroleira abre poço: mais barris por dia, de verdade.
      if (e.petroleo) e.petroleo = r2(e.petroleo * 1.12);
      aplicarEfeitos(jogo.estado, { capacidade_ind: 2, temp_economia: 2 });
      jogo.registrarEmpresa?.({ tipo: 'investir', e, valor: cInv });
      depois();
    });
    alvo.querySelector('#ed-priv')?.addEventListener('click', () => {
      jogo.estado.tesouro = r2(jogo.estado.tesouro + gVenda);
      jogo.estado.pontos_acao -= PA;
      e.participacao = Math.max(0, e.participacao - pctVenda);
      aplicarEfeitos(jogo.estado, { temp_economia: 5, aprovacao: -3 });
      aplicarPolitico(jogo.estado, { economico: 8 });
      jogo.registrarEmpresa?.({ tipo: 'privatizar', e, valor: gVenda, pct: pctVenda });
      depois();
    });
    alvo.querySelector('#ed-est')?.addEventListener('click', () => {
      jogo.estado.tesouro = r2(jogo.estado.tesouro - cComp);
      jogo.estado.pontos_acao -= PA;
      e.participacao = Math.min(100, e.participacao + pctComp);
      aplicarEfeitos(jogo.estado, { temp_economia: -7, aprovacao: 4 });
      aplicarPolitico(jogo.estado, { economico: -9 });
      jogo.registrarEmpresa?.({ tipo: 'estatizar', e, valor: cComp, pct: pctComp });
      depois();
    });
    alvo.querySelector('#ed-nac')?.addEventListener('click', () => {
      // O confisco: barato no caixa, caríssimo em tudo o mais.
      const pct = 100 - e.participacao;
      jogo.estado.tesouro = r2(jogo.estado.tesouro - cNac);
      jogo.estado.pontos_acao -= PA;
      e.participacao = 100; e.estatal = true;
      aplicarEfeitos(jogo.estado, { temp_economia: -18, aprovacao: 7, soft_power: -10, estabilidade: -5 });
      aplicarPolitico(jogo.estado, { economico: -22, autoridade: 12 });
      jogo.registrarEmpresa?.({ tipo: 'nacionalizar', e, valor: cNac, pct });
      depois();
    });
  }

  render();
}

function r2(n) { return Math.round(n * 100) / 100; }
function r3(n) { return Math.round(n * 1000) / 1000; }
