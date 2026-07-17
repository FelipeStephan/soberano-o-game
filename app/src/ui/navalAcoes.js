// ═══════════════════════════════════════════════════════════════════════
// AÇÕES RÁPIDAS DA FROTA — o popup pra decidir na hora
// ═══════════════════════════════════════════════════════════════════════
// Clicar num pino de frota abre isto: o que dá pra fazer com ela AGORA. Reposicionar
// (arrastar), mandar de volta pra casa (libera as tropas e esfria o clima), ou — se tem
// um hostil por perto — partir pra cima. Uma IA lê a situação (quem está perto, a
// relação) e sugere a jogada rápida. É a ferramenta de decisão veloz que o dono pediu.
import { PAISES } from '../dados/paises.js';
import { techDaFrota } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { FOTO_UNIDADE } from '../dados/imagens.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function abrirAcoesNaval(fr, jogo, helpers = {}) {
  if (document.querySelector('.nva-modal')) return;
  const e = jogo.estado;
  const u = fr.unidades || {};
  const dom = u.porta_avioes ? 'porta_avioes' : u.navios ? 'navios' : 'submarinos';
  const soSub = !u.navios && !u.porta_avioes && u.submarinos;
  const tech = techDaFrota(u);
  const eq = equipamentosDoPais(e.iso || 'USA')?.[dom];
  const foto = eq?.foto || FOTO_UNIDADE[dom];
  const nomeReal = eq?.nome || 'Força naval';
  const perto = (helpers.paisesProximos?.(fr) || []).slice(0, 3);
  const alvo = perto.find((p) => p.hostil) || perto[0] || null;

  const modal = document.createElement('div');
  modal.className = 'modal-fundo nva-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); helpers.onFim?.(); };
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  const linhas = ['porta_avioes', 'navios', 'submarinos'].filter((k) => u[k])
    .map((k) => `${u[k]} × ${({ porta_avioes: 'Porta-aviões', navios: 'Navio', submarinos: 'Submarino' })[k]}`).join(' · ');

  modal.innerHTML = `<div class="nva-painel">
    <div class="nva-cab">
      <div class="nva-foto">${foto ? `<img src="${foto}" alt="" onerror="this.parentElement.innerHTML='${ico('ship', 22)}'">` : ico('ship', 22)}</div>
      <div class="nva-tit"><h2>${esc(nomeReal)}</h2><span>${esc(linhas || 'força naval')} · presença ${fr.presenca}</span></div>
      <button class="pp-fechar nva-x">${ico('x', 16)}</button>
    </div>
    <div class="nva-grade">
      <span><i>Alcance</i><b>${tech.alcance}°</b></span>
      <span><i>Detecção</i><b>${tech.deteccao}°</b></span>
      <span class="${soSub ? 'furtivo' : ''}"><i>Furtividade</i><b>${tech.furtividade}${soSub ? ' 🥷' : ''}</b></span>
    </div>
    ${alvo ? `<div class="nva-alvo ${alvo.hostil ? 'hostil' : alvo.parceiro ? 'amigo' : 'neutro'}">
      ${ico(alvo.hostil ? 'swords' : alvo.parceiro ? 'handshake' : 'radar', 14)}
      <span><b>${esc(alvo.nome)}</b> a ${alvo.d.toFixed(0)}° · relação ${alvo.rel} — ${alvo.hostil ? 'HOSTIL, um estopim' : alvo.parceiro ? 'parceiro, presença amistosa' : 'neutro, observando'}</span>
    </div>` : ''}
    <div class="nva-acoes">
      <button class="nva-btn mover" id="nva-mover">${ico('move', 15)} <span>Reposicionar<small>arraste o pino no globo</small></span></button>
      ${alvo && alvo.hostil ? `<button class="nva-btn atacar" id="nva-atacar">${ico('swords', 15)} <span>Partir pra cima de ${esc(alvo.nome)}<small>vira guerra aberta</small></span></button>` : ''}
      <button class="nva-btn casa" id="nva-casa">${ico('home', 15)} <span>Mandar de volta pra casa<small>libera as tropas e esfria o clima</small></span></button>
    </div>
  </div>`;

  modal.querySelector('.nva-x').addEventListener('click', fechar);
  modal.querySelector('#nva-mover').addEventListener('click', fechar);

  // MANDAR DE VOLTA PRA CASA: some com a frota, devolve as tropas ao quartel e reduz a
  // tensão. É o "reduzir conflito" que o dono pediu como alternativa ao ataque.
  modal.querySelector('#nva-casa').addEventListener('click', () => {
    e.frotas = (e.frotas || []).filter((f) => f.id !== fr.id);
    // devolve a guarnição naval "comprometida" (a entrada MAR_ de composição igual)
    for (const [k, g] of Object.entries(e.guarnicoes || {})) {
      if (k.startsWith('MAR_') && JSON.stringify(g) === JSON.stringify(fr.unidades)) { delete e.guarnicoes[k]; break; }
    }
    e.temp_guerra = Math.max(0, (e.temp_guerra || 0) - 4);
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `Frota recolhida ao porto. Tropas de volta ao quartel e um grau a menos de tensão no mar.`, cor: '#22e0a0' }]);
    helpers.atualizar?.();
    fechar();
  });

  // ATACAR o hostil próximo: declara guerra e parte a ofensiva pelo mar.
  modal.querySelector('#nva-atacar')?.addEventListener('click', () => {
    if (!alvo) return;
    e.emGuerra = e.emGuerra || [];
    if (!e.emGuerra.includes(alvo.code)) e.emGuerra.push(alvo.code);
    const chave = PAISES[alvo.code]?.rel; if (chave) e[chave] = Math.max(-100, (e[chave] || 0) - 40);
    e.temp_guerra = Math.min(100, (e.temp_guerra || 0) + 20);
    helpers.ondaRadar?.({ lat: fr.lat, lng: fr.lng }, { cor: 0xff3b5c, max: 60 });
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Estado-Maior', texto: `⚔️ Sua frota abriu fogo contra ${esc(alvo.nome)}. É guerra no mar.`, cor: '#ff3b5c' }]);
    helpers.atualizar?.();
    fechar();
  });
}
