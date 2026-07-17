// ═══════════════════════════════════════════════════════════════════════
// HOME CINEMÁTICA — a primeira tela É o jogo
// ═══════════════════════════════════════════════════════════════════════
// Antes: um formulário sobre fundo escuro. Funcional e morto.
// Agora: o PLANETA gira em tela cheia atrás de tudo, e a UI flutua sobre ele
// no vocabulário Destiny — navegação vertical fina à esquerda, painel de vidro
// à direita, tipografia espaçada, nada de caixa opaca.
//
// O momento que faz a tela: CLICAR NUM PAÍS VOA A CÂMERA ATÉ ELE. Escolher a
// Coreia do Norte e ver o globo girar até a península já é jogar. E "ASSUMIR"
// mergulha a câmera no território antes do fade — a transição é diegética,
// não um corte de tela.
import Globe from 'globe.gl';
import { temChave } from '../config.js';
import { GRUPOS, cartaoDe, existe, jogaveis, fichaDe } from '../dados/registro.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { resumoSave, apagarSave } from '../jogo/save.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TEX = 'https://cdn.jsdelivr.net/npm/three-globe/example/img';

export function mostrarInicio(container, onStart) {
  const modo = temChave() ? 'MÁQUINA · IA ATIVA' : 'DEMONSTRAÇÃO · SEM CHAVE';
  let sel = 'USA';
  let nomeJogador = localStorage.getItem('soberano_nome') || '';
  let globo = null;
  let timerRotacao = null;
  let saindo = false;

  container.innerHTML = `
    <div class="hm" id="hm">
      <div class="hm-globo" id="hm-globo"></div>
      <div class="hm-veu"></div>

      <header class="hm-topo">
        <h1 class="marca hm-marca">SOBERANO</h1>
        <div class="hm-sub">O GRANDE JOGO — A MÁQUINA OBSERVA</div>
      </header>

      <div class="hm-continuar" id="hm-continuar"></div>

      <nav class="hm-nav" id="hm-nav" aria-label="Nações"></nav>

      <aside class="hm-ficha" id="hm-ficha"></aside>

      <footer class="hm-rodape">
        <span class="hm-modo"><i class="hm-dot ${temChave() ? 'on' : ''}"></i> ${modo}</span>
        <!-- Aviso de ficção: exigido pela seção 2.1 de SOBERANO_marcas_e_escopo.md. O jogo
             usa marcas reais de imprensa porque o reconhecimento da marca É a mecânica
             (a Fox cobre um liberal diferente de como cobre um estatista) — e o preço
             disso é deixar explícito, onde o jogador vê, que o conteúdo é inventado. -->
        <span class="hm-aviso">Trabalho acadêmico ficcional. Países e veículos de imprensa são reais;
          líderes, declarações e acontecimentos são inventados. Marcas pertencem aos seus titulares,
          que não endossam nem participam deste projeto.</span>
        <span class="hm-versao">SOBERANO · PROTÓTIPO</span>
      </footer>
    </div>`;

  // ── O PLANETA DE FUNDO ────────────────────────────────────────────────
  // Um globo dedicado, minimalista: só a Terra, atmosfera e rotação lenta.
  // Sem polígonos, sem marcadores — aqui ele é cenografia, não interface.
  function montarGloboHome() {
    const el = container.querySelector('#hm-globo');
    globo = Globe()(el)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl(`${TEX}/earth-blue-marble.jpg`)
      .bumpImageUrl(`${TEX}/earth-topology.png`)
      .showAtmosphere(true)
      .atmosphereColor('#4aa8ff')
      .atmosphereAltitude(0.28);
    const c = globo.controls();
    c.autoRotate = true;
    c.autoRotateSpeed = 0.42;
    c.enableZoom = false;       // a distância é direção de arte, não escolha do usuário
    globo.pointOfView({ lat: 14, lng: -40, altitude: 2.4 }, 0);
    const resize = () => { globo.width(el.clientWidth); globo.height(el.clientHeight); };
    resize();
    window.addEventListener('resize', resize);
  }

  // Voa até o país selecionado. A pausa na rotação automática é essencial:
  // sem ela, o autoRotate briga com a transição e a câmera "escorrega" do alvo.
  function voarPara(iso) {
    if (!globo) return;
    const pino = fichaDe(iso)?.pino;
    if (!pino) return;
    const c = globo.controls();
    c.autoRotate = false;
    globo.pointOfView({ lat: pino.lat, lng: pino.lng, altitude: 1.75 }, 1300);
    clearTimeout(timerRotacao);
    timerRotacao = setTimeout(() => { if (!saindo) c.autoRotate = true; }, 5200);
  }

  // ── NAVEGAÇÃO (Destiny: colunas finas, uppercase, barra no hover) ────
  function navHTML() {
    return GRUPOS.map((g, gi) => {
      const disp = g.isos.filter(existe);
      if (!disp.length) return '';
      return `<section class="hm-grupo" style="animation-delay:${120 + gi * 90}ms">
        <header title="${esc(g.nota)}">${esc(g.rot)}</header>
        ${disp.map((iso) => {
          const c = cartaoDe(iso);
          return `<button class="hm-item ${sel === iso ? 'sel' : ''}" data-i="${iso}">
            ${ISO2_DE[iso] ? `<img src="${bandeira(ISO2_DE[iso], 40)}" alt="">` : ''}
            <b>${esc(c.nome)}</b>
            <span>${c.pib} tri${c.ogivas ? ` · ${c.ogivas} ogv` : ''}</span>
          </button>`;
        }).join('')}
      </section>`;
    }).join('') + `<button class="hm-dado" id="hm-dado">${ico('dices', 14)} DESTINO ALEATÓRIO</button>`;
  }

  // ── FICHA (painel de vidro) ──────────────────────────────────────────
  function fichaHTML(iso) {
    const c = cartaoDe(iso);
    if (!c) return '';
    const barra = (v, cor) => `<span class="hmf-barra"><i style="width:${Math.max(2, Math.min(100, v))}%;background:${cor}"></i></span>`;
    return `<div class="hmf">
      <div class="hmf-cab">
        ${ISO2_DE[iso] ? `<img class="hmf-flag" src="${bandeira(ISO2_DE[iso], 160)}" alt="">` : ''}
        <div>
          <h2>${esc(c.nome)}</h2>
          <div class="hmf-lider">${ico('crown', 11)} ${esc(c.lider)} · ${esc(c.capital)}</div>
        </div>
      </div>
      <p class="hmf-resumo">${esc(c.resumo)}</p>
      <div class="hmf-linhas">
        <div class="hmf-l"><span>PIB</span>${barra((c.pib / 28) * 100, 'var(--ambar)')}<b>${c.pib} tri</b></div>
        <div class="hmf-l"><span>Militar</span>${barra(c.militar, 'var(--perigo)')}<b>${c.militar}</b></div>
        <div class="hmf-l"><span>Liberdades</span>${barra(c.liberdades, 'var(--cyan)')}<b>${c.liberdades}</b></div>
        <div class="hmf-l"><span>Ogivas</span>${barra((c.ogivas / 55) * 100, 'var(--roxo)')}<b>${c.ogivas || '—'}</b></div>
      </div>
      <div class="hmf-nome">
        <label>${ico('user', 11)} SEU NOME NO COMANDO</label>
        <input type="text" id="hmf-presidente" maxlength="38" value="${esc(nomeJogador || c.lider)}"
          placeholder="${esc(c.lider)}" spellcheck="false" autocomplete="off">
        <small>É este nome que a Máquina cita nas manchetes, nos boletins e nos xingamentos.</small>
      </div>
      <button class="hmf-assumir" id="hmf-assumir">
        ${ico('crown', 17)} <span>ASSUMIR ${esc(c.nome.toUpperCase())}</span>
      </button>
    </div>`;
  }

  function bannerContinuar() {
    const r = resumoSave();
    const alvo = container.querySelector('#hm-continuar');
    if (!r) { alvo.innerHTML = ''; return; }
    alvo.innerHTML = `<div class="hm-save">
      ${ISO2_DE[r.iso] ? `<img src="${bandeira(ISO2_DE[r.iso], 80)}" alt="">` : ''}
      <div class="hms-txt">
        <b>${esc(r.presidente || r.pais)}</b>
        <span>${esc(r.pais)} · ciclo ${r.turno} · Destino ${r.destino}/100</span>
      </div>
      <button class="hms-retomar" id="hms-retomar">${ico('play', 14)} RETOMAR</button>
      <button class="hms-apagar" id="hms-apagar" title="Descartar">${ico('trash-2', 13)}</button>
    </div>`;
    alvo.querySelector('#hms-retomar').addEventListener('click', () => partir({ continuar: true }));
    alvo.querySelector('#hms-apagar').addEventListener('click', () => { apagarSave(); bannerContinuar(); });
  }

  // ── A SAÍDA CINEMÁTICA ──────────────────────────────────────────────
  // Mergulha a câmera no país e funde. O jogador ENTRA no território que escolheu —
  // a transição conta a mesma história que o botão prometeu.
  function partir(args) {
    if (saindo) return;
    saindo = true;
    container.querySelector('#hm').classList.add('saindo');
    const alvo = args.continuar ? resumoSave()?.iso : sel;
    const pino = alvo ? fichaDe(alvo)?.pino : null;
    if (globo && pino) {
      globo.controls().autoRotate = false;
      globo.pointOfView({ lat: pino.lat, lng: pino.lng, altitude: 0.65 }, 1050);
    }
    setTimeout(() => {
      // globe.gl roda um rAF interno pra sempre — pausar antes de destruir o DOM,
      // senão o loop continua renderizando um canvas órfão em background.
      globo?.pauseAnimation?.();
      onStart(args);
    }, 1100);
  }

  function render() {
    container.querySelector('#hm-nav').innerHTML = navHTML();
    container.querySelector('#hm-ficha').innerHTML = fichaHTML(sel);
    bannerContinuar();

    container.querySelectorAll('.hm-item').forEach((b) => b.addEventListener('click', () => {
      if (sel === b.dataset.i) return;
      sel = b.dataset.i;
      voarPara(sel);
      // troca só o necessário: seleção no nav, ficha inteira (com fade próprio no CSS)
      container.querySelectorAll('.hm-item').forEach((x) => x.classList.toggle('sel', x.dataset.i === sel));
      container.querySelector('#hm-ficha').innerHTML = fichaHTML(sel);
      ligarFicha();
    }));
    container.querySelector('#hm-dado').addEventListener('click', () => {
      const todos = jogaveis().filter((i) => i !== sel);
      sel = todos[Math.floor(Math.random() * todos.length)];
      voarPara(sel);
      container.querySelectorAll('.hm-item').forEach((x) => x.classList.toggle('sel', x.dataset.i === sel));
      container.querySelector('.hm-item.sel')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      container.querySelector('#hm-ficha').innerHTML = fichaHTML(sel);
      ligarFicha();
    });
    ligarFicha();
  }

  function ligarFicha() {
    const campo = container.querySelector('#hmf-presidente');
    campo?.addEventListener('input', () => { nomeJogador = campo.value.trim(); });
    container.querySelector('#hmf-assumir')?.addEventListener('click', () => {
      const nome = (campo?.value || '').trim() || cartaoDe(sel).lider;
      localStorage.setItem('soberano_nome', nome === cartaoDe(sel).lider ? '' : nome);
      partir({ pais: sel, ano: '2026', presidente: nome });
    });
  }

  montarGloboHome();
  render();
}
