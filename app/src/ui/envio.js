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
import { guarnicaoDefensivaDetalhe, tropaLivre, donoDe } from '../jogo/territorio.js';
import { temIntel } from '../jogo/espionagem.js';
import { resolverEnvio } from '../jogo/campanha.js';
import { UNIDADES, UNIDADE_POR_ID, DOMINIOS, poderDeploy, custoDeploy } from '../dados/forcas.js';
import { equipamentosDoPais } from '../dados/registro.js';
import { FOTO_UNIDADE, bandeira, ISO2_DE } from '../dados/imagens.js';
import { PAISES } from '../dados/paises.js';
import { reacaoDeBloco } from '../dados/blocos.js';
import { dinheiro } from '../jogo/formato.js';
import { sirene } from './efeitos.js';
import { ico, ICO } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nomeDe = (i) => PAISES[i]?.nome || i;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

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
    const equip = equipamentosDoPais(e.iso || 'USA');
    const def = guarnicaoDefensivaDetalhe(e, p.id);   // guarnição REAL (sua) ou ESTIMADA (do NPC)
    // SEGREDO: a defesa do inimigo por estado é oculta — só aparece se você ESPIONAR o dono.
    const ocultoDef = def.estimada && !temIntel(e, alvoIso, 'forcas_estado');
    const defesa = ocultoDef ? null : def.forca;
    const defUnid = ocultoDef ? [] : Object.entries(def.g || {}).filter(([, q]) => q > 0)
      .sort((a, b) => (UNIDADE_POR_ID[b[0]]?.poder || 0) * b[1] - (UNIDADE_POR_ID[a[0]]?.poder || 0) * a[1]).slice(0, 4);
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
        ${ocultoDef ? '' : `<div class="env-cel">
          <span>Guarnição de ${esc(p.nome)}${def.estimada && defesa > 0 ? ' <small class="env-est">intel</small>' : ''}</span>
          <b class="${defesa > 0 ? 'ruim' : 'bom'}">${defesa || 'nenhuma'}</b>
          <i>${defesa ? (defUnid.length
            ? defUnid.map(([u, q]) => `${UNIDADE_POR_ID[u]?.icone || ''} ${Number(q).toLocaleString('pt-BR')}`).join(' · ')
            : 'força defendendo') : 'território aberto'}</i>
        </div>`}
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
        prog.innerHTML = `${ico('info', 13)} <span>Escolha o que vai. O defensor luta entrincheirado — o desfecho só se conhece no terreno.</span>`;
        return;
      }
      // SEM PROGNÓSTICO: o jogo não prevê "cai / não cai / perde X%". O jogador vê a
      // força que ELE manda, o custo e as consequências diplomáticas — o resto é guerra.
      prog.className = 'env-prog';
      prog.innerHTML = `${ico('swords', 13)}
        <span>Força enviada: <b>${poder}</b>.${defesa != null && defesa > 0 ? ` Guarnição conhecida: <b>${defesa}</b>.` : ''}
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

  // A EXECUÇÃO. Antes esta função só desenhava um arco bonito e chamava onFim com
  // um objeto que ninguém consumia — o envio não declarava guerra, não mudava
  // relação, não tomava território. Era teatro no pior sentido. Agora resolve.
  async function onConfirmar(dep) {
    const r = resolverEnvio(jogo.estado, p.id, alvoIso, dep);
    if (r.falha) {
      modal.querySelector('#env-prog').innerHTML = `<b class="ruim">${esc(r.falha)}</b>`;
      return;
    }
    // o modal sai de cena: o palco é o globo
    modal.querySelector('.env-painel').style.display = 'none';
    modal.classList.add('so-globo');

    globoCtrl?.desenharLinha?.({ lat: p.lat, lng: p.lng }, 'ataque', 7000);
    globoCtrl?.lancarEsquadrilha?.({ lat: p.lat, lng: p.lng }, 'ataque');
    if (dep.navios || dep.porta_avioes) globoCtrl?.lancarEsquadrilha?.({ lat: p.lat, lng: p.lng }, 'naval');
    if (dep.misseis) globoCtrl?.salvaMisseis?.({ lat: p.lat, lng: p.lng }, Math.min(6, Math.ceil(dep.misseis / 40)));
    globoCtrl?.focar?.({ lat: p.lat, lng: p.lng });

    // o mundo fica sabendo
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: r.tomou ? 'Frente de Batalha' : 'Comando', texto: r.manchete, cor: r.tomou ? '#ffb020' : '#ff3b5c' }]);
    // os aliados do alvo acendem no mapa
    if (r.bloco?.isos?.length) globoCtrl?.alertaTemporario?.(r.bloco.isos.slice(0, 4), 20000);

    await espera(4200);   // a esquadrilha chega
    if (r.tomou) {
      globoCtrl?.ondaRadar?.({ lat: p.lat, lng: p.lng }, { cor: 0xffb020, max: 40 });
      globoCtrl?.balao?.({ lat: p.lat, lng: p.lng }, `${p.nome} caiu`, 'aviso');
    } else {
      globoCtrl?.balao?.({ lat: p.lat, lng: p.lng }, `${p.nome} resistiu`, 'ruim');
    }
    globoCtrl?.atualizar?.();
    await espera(1400);

    modal.classList.remove('so-globo');
    mostrarDesfecho(r);
  }

  function mostrarDesfecho(r) {
    const painel = modal.querySelector('.env-painel');
    painel.style.display = '';
    painel.innerHTML = `
      <div class="env-cab">
        <span class="env-simbolo ${r.tomou ? 'ok' : ''}">${ico(r.tomou ? 'flag' : 'shield-off', 22)}</span>
        <div class="env-tit">
          <h2>${r.tomou ? `${esc(p.nome.toUpperCase())} É SEU` : `${esc(p.nome.toUpperCase())} RESISTIU`}</h2>
          <div class="env-sub">${r.jaEmGuerra ? 'ofensiva numa guerra aberta' : 'primeira bota no chão'}</div>
        </div>
      </div>
      <div class="env-prog ${r.tomou ? 'bom' : 'ruim'}">
        ${ico(r.tomou ? 'trending-up' : 'triangle-alert', 13)}
        <span>${esc(r.manchete)}</span>
      </div>
      <div class="env-quadro">
        <div class="env-cel"><span>Sua força</span><b>${r.res.ataque}</b><i>enviada</i></div>
        <div class="env-cel"><span>Defesa efetiva</span><b class="${r.tomou ? 'bom' : 'ruim'}">${r.res.defesa}</b><i>guarnição × 1,6</i></div>
        <div class="env-cel"><span>Baixas suas</span><b class="ruim">${r.res.perdaAtacante}%</b><i>da força enviada</i></div>
      </div>
      ${r.perdas.length ? `<div class="env-perdas">${r.perdas.map((x) => `<span class="mud ruim">${esc(x.nome)} <b>−${x.perdido.toLocaleString('pt-BR')}</b></span>`).join('')}</div>` : ''}
      <div class="env-grade">${r.mudancas.filter((m) => m.delta).map((m) => `<span class="mud ${m.delta > 0 ? 'bom' : 'ruim'}">${esc(m.rotulo || m.chave)} ${m.delta > 0 ? '+' : ''}${m.delta}</span>`).join('')}</div>
      ${r.reacaoBloco.length ? `<div class="env-jaguerra">${ico('users', 14)} <span><b>${esc(r.bloco.blocoNome || 'O bloco')}</b> reagiu — ${r.reacaoBloco.length} relação(ões) despencaram junto.</span></div>` : ''}
      <button class="avancar" id="env-ok">CONTINUAR ${ico('chevron-right', 15)}</button>`;
    painel.querySelector('#env-ok').addEventListener('click', sair);
  }
}
