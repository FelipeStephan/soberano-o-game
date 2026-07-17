// ═══════════════════════════════════════════════════════════════════════
// ENVIO DE FORÇA — o briefing antes do ato de guerra
// ═══════════════════════════════════════════════════════════════════════
// Este painel abre quando o jogador, com o Teatro de Operações armado, designa um
// alvo em solo alheio. Mandar tropa para o território de outro país NÃO é uma ação
// entre outras: é o ato de guerra. E é por isso que ele não pode ser um "tem certeza?".
//
// O modelo é o mesmo da tela nuclear, que funcionou: a CONTA À VISTA antes do
// gatilho. Um "tem certeza?" genérico só ensina o jogador a clicar em sim sem ler.
// Um briefing — quem te espera lá, quem vai reagir, o que a sua relação vira, quanto
// custa — faz ele hesitar com informação, que é a hesitação que interessa.
//
// A regra que dá a espinha: DEFENDER É MAIS BARATO QUE ATACAR (ver territorio.js).
// Mandar pouco contra guarnição forte não é "um ataque fraco", é um massacre do seu
// lado. O painel diz isso na cara, antes.
import { resolverAtaqueAoEstado, guarnicao, forcaGuarnicao, tropaLivre, donoDe } from '../jogo/territorio.js';
import { UNIDADES, DOMINIOS, poderDeploy, custoDeploy } from '../dados/forcas.js';
import { EQUIPAMENTOS } from '../dados/equipamentos.js';
import { FOTO_UNIDADE, bandeira, ISO2_DE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { reacaoDeBloco } from '../dados/blocos.js';
import { dinheiro } from '../jogo/formato.js';
import { sirene } from './efeitos.js';
import { ico, ICO } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (i) => PAISES[i]?.nome || i;

export function abrirEnvio(feature, jogo, { onFim, globoCtrl } = {}) {
  const p = feature.properties;
  const e = jogo.estado;
  const alvoIso = donoDe(e, p.id);
  const jaEmGuerra = (e.emGuerra || []).includes(alvoIso);
  const bloco = reacaoDeBloco(alvoIso);
  const relKey = PAISES[alvoIso]?.rel;
  const relAtual = relKey ? Number(e[relKey] ?? 0) : 0;

  const deploy = {};
  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); };
  const sair = () => { fechar(); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') sair(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) sair(); });

  render();

  function render() {
    const livre = tropaLivre(e);
    const equip = EQUIPAMENTOS[e.iso || 'USA'] || EQUIPAMENTOS.USA;
    const g = guarnicao(e, p.id);
    const defesa = forcaGuarnicao(g);
    const uteis = UNIDADES.filter((u) => (livre[u.id] || 0) > 0 && u.id !== 'defesa_aerea');

    modal.innerHTML = `<div class="env-painel">
      <div class="env-cab">
        <span class="env-simbolo">${ico('crosshair', 24)}</span>
        <div class="env-tit">
          <h2>DESIGNAR ALVO · ${esc(p.nome.toUpperCase())}</h2>
          <div class="env-sub">Teatro de Operações · ${esc(nomeDe(alvoIso))}</div>
        </div>
        ${ISO2_DE[alvoIso] ? `<img class="env-flag" src="${bandeira(ISO2_DE[alvoIso], 80)}" alt="">` : ''}
        <button class="pp-fechar" id="env-x">${ico('x', 16)}</button>
      </div>

      ${!jaEmGuerra ? `<div class="env-guerra">${ico('triangle-alert', 18)}
        <div><b>Isto declara guerra a ${esc(nomeDe(alvoIso))}.</b>
        Não existe meia-invasão: no instante em que a sua bota toca o solo deles, vocês estão em guerra —
        e o mundo vai assistir você começar.</div></div>`
        : `<div class="env-jaguerra">${ico('swords', 16)} <span>Vocês já estão em guerra. Esta é mais uma ofensiva de uma campanha aberta.</span></div>`}

      <div class="env-quadro">
        <div class="env-cel">
          <span>Guarnição de ${esc(p.nome)}</span>
          <b class="${defesa > 0 ? 'ruim' : 'bom'}">${defesa || 'nenhuma'}</b>
          <i>${defesa ? 'força defendendo' : 'território aberto'}</i>
        </div>
        <div class="env-cel">
          <span>Vantagem do defensor</span><b class="amb">1,6×</b>
          <i>ele está entrincheirado</i>
        </div>
        <div class="env-cel">
          <span>Relação atual</span><b class="${relAtual < 0 ? 'ruim' : 'bom'}">${relAtual}</b>
          <i>com ${esc(nomeDe(alvoIso))}</i>
        </div>
      </div>

      <div class="env-lista">
        ${DOMINIOS.map((d) => {
          const us = uteis.filter((u) => u.dominio === d);
          if (!us.length) return '';
          return `<div class="env-grupo"><div class="env-dom">${ico(ICO[d] || 'circle', 11)} ${d}</div>
            ${us.map((u) => {
              const eq = equip?.[u.id];
              const foto = eq?.foto || FOTO_UNIDADE[u.id];
              const disp = livre[u.id] || 0;
              return `<div class="env-item">
                <span class="env-foto">${foto ? `<img src="${foto}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${u.icone}'">` : u.icone}</span>
                <span class="env-info">
                  <b>${esc(eq?.nome || u.nome)}</b>
                  <small>${disp.toLocaleString('pt-BR')} disponíveis</small>
                </span>
                <input type="range" class="env-slider" data-u="${u.id}" min="0" max="${disp}" step="${u.passo}" value="0">
                <span class="env-qtd" id="q-${u.id}">0</span>
              </div>`;
            }).join('')}
          </div>`;
        }).join('')}
      </div>

      <div class="env-prog" id="env-prog"></div>
      <div class="env-acoes">
        <button class="env-lancar" id="env-ok" disabled>${ico('swords', 15)} <span>${jaEmGuerra ? 'LANÇAR OFENSIVA' : 'DECLARAR GUERRA E INVADIR'}</span></button>
        <button class="env-abortar" id="env-no">Recuar</button>
      </div>
    </div>`;

    modal.querySelector('#env-x').addEventListener('click', sair);
    modal.querySelector('#env-no').addEventListener('click', sair);

    const prog = modal.querySelector('#env-prog');
    const btn = modal.querySelector('#env-ok');

    const recalc = () => {
      for (const s of modal.querySelectorAll('.env-slider')) {
        deploy[s.dataset.u] = Number(s.value) || 0;
        modal.querySelector(`#q-${s.dataset.u}`).textContent = Number(s.value).toLocaleString('pt-BR');
      }
      const poder = poderDeploy(deploy);
      const custo = custoDeploy(deploy);
      const total = Object.values(deploy).reduce((a, b) => a + b, 0);
      btn.disabled = total <= 0 || custo > e.tesouro;

      if (!total) {
        prog.className = 'env-prog';
        prog.innerHTML = `${ico('info', 13)} <span>Escolha o que vai. A força enviada é comparada com a guarnição local — e o defensor vale 1,6× o número dele.</span>`;
        return;
      }
      const sim = resolverAtaqueAoEstado(e, p.id, poder);
      const vence = !sim.segurou;
      prog.className = `env-prog ${vence ? 'bom' : 'ruim'}`;
      prog.innerHTML = `${ico(vence ? 'trending-up' : 'triangle-alert', 13)}
        <span><b>${poder}</b> de força contra <b>${sim.defesa}</b> de defesa efetiva.
        ${vence
          ? `<b class="bom">${esc(p.nome)} cai.</b> Você perde ~${sim.perdaAtacante}% da força enviada tomando o território.`
          : `<b class="ruim">Eles seguram.</b> Você perde ~${sim.perdaAtacante}% da força enviada e não toma nada. Mande mais, ou não mande.`}
        ${custo > e.tesouro ? `<br><b class="ruim">Sem caixa:</b> o transporte custa ${dinheiro(custo)} e você tem ${dinheiro(e.tesouro)}.` : `<br>Transporte: <b>${dinheiro(custo)}</b>.`}
        ${!jaEmGuerra ? `<br>Consequência diplomática: relação com ${esc(nomeDe(alvoIso))} despenca${bloco.isos.length ? `, e ${bloco.isos.length} aliado(s) do bloco reagem` : ''}.` : ''}
        </span>`;
    };

    modal.querySelectorAll('.env-slider').forEach((s) => s.addEventListener('input', recalc));
    recalc();

    btn.addEventListener('click', () => {
      sirene({ ruim: true });
      onConfirmar(deploy);
    });
  }

  // A execução fica com quem já sabe fazer guerra: reaproveitamos o motor de
  // agressão do jogo em vez de inventar uma segunda regra de combate.
  function onConfirmar(dep) {
    fechar();
    globoCtrl?.lancarEsquadrilha?.({ lat: p.lat, lng: p.lng }, 'ataque');
    globoCtrl?.desenharLinha?.({ lat: p.lat, lng: p.lng }, 'ataque', 6000);
    onFim?.({ tipo: 'envio', alvoEstado: p.id, alvoIso, deploy: dep });
  }
}
