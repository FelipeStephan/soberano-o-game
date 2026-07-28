// ═══════════════════════════════════════════════════════════════════════
// O FIM DA ERA — a cinemática antes do dossiê
// ═══════════════════════════════════════════════════════════════════════
// O PEDIDO DO DONO: "a tela de fim da era poderia ser um carrossel, uma coisa meio
// épica cinemática igual fizemos no conselho da ONU".
//
// O QUE ISTO CONSERTA: o momento mais importante da partida — dez anos de governo
// chegando ao fim — entrava como um cartão de rolagem com dezesseis números, um
// obituário e dois botões. Tudo o que havia de dramático estava lá, mas chegava de
// uma vez só e por baixo de uma barra de scroll. O jogador rolava até o fim
// procurando o botão e nunca lia o que tinha construído.
//
// A cinemática NÃO substitui o dossiê: ela o ANTECEDE. As cinco cenas contam a
// história em ordem dramática (parou → o que ficou de pé → o que você prometeu →
// quanto valeu → o veredito) e então o cartão completo entra, com todos os números
// para quem quiser reler com calma. Cena para sentir, cartão para conferir.
//
// ── POR QUE O LEGADO É A PENÚLTIMA E NÃO A ÚLTIMA ─────────────────────
// Mesma lógica do réu do Conselho vir depois do motivo: o número sozinho não
// significa nada. A cena 3 lembra o que você PROMETEU ser, a 4 mostra quanto isso
// valeu, e só então a 5 dá o nome que a História usou. Invertendo a ordem, o
// veredito vira só mais um rótulo.
//
// ── ELA TAMBÉM SERVE À QUEDA ──────────────────────────────────────────
// `mostrarFim` é chamada nos três desfechos (império, legado, deposição). Uma
// cinemática só de vitória seria um insulto de design — quem é deposto no Ano III
// merece a mesma cerimônia, com outro tom. Todo texto aqui pergunta o `tom` antes
// de escolher a palavra.
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { ico } from './icones.js';
import { tocarTrilha } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 15 segundos. Um a menos que a abertura do Conselho de propósito: aqui o jogador já
// sabe que acabou e quer ver o resultado — a tensão é de expectativa, não de mistério,
// e expectativa cansa mais rápido.
export const DUR_FIM_MS = 15000;

// Ritmo das cenas. O LEGADO tem a maior fatia: é o único número que ele nunca viu
// antes, e a contagem crescendo precisa de tempo pra virar suspense em vez de enfeite.
const RITMO = { relogio: 2800, balanco: 3100, doutrina: 2600, legado: 3900, veredito: 2600 };

function flagHTML(iso, largura, classe) {
  const url = bandeira(ISO2_DE[iso], largura);
  const sigla = esc(String(iso || '??').slice(0, 3).toUpperCase());
  if (!url) return `<div class="cab-flag ${classe} sem">${sigla}</div>`;
  return `<img class="cab-flag ${classe}" src="${esc(url)}" alt="" data-sigla="${sigla}">`;
}

// ── AS CENAS ───────────────────────────────────────────────────────────
// Cada uma devolve só o HTML do palco, como no onuAbertura: trocar a ordem tem de
// ser mover uma linha do array lá embaixo.

function cenaRelogio(d) {
  const caiu = d.tom === 'derrota';
  return `<div class="cab-cena fe-relogio">
    <div class="cab-selo fe-selo">${ico(caiu ? 'skull' : d.tom === 'vitoria' ? 'crown' : 'hourglass', 46)}</div>
    <div class="cab-rot ${caiu ? 'cab-perigo' : 'cab-cyan'}">
      ${ico('clock', 12)} ${caiu ? 'O RELÓGIO PAROU ANTES DA HORA' : 'CENTO E VINTE MESES'}</div>
    <h1 class="cab-tit">${caiu ? 'O GOVERNO CAIU' : 'A DÉCADA ACABOU'}</h1>
    <div class="fe-marco">
      ${flagHTML(d.iso, 160, 'media')}
      <div class="fe-marco-txt">
        <b>${esc(d.pais || '')}</b>
        <i>${esc(d.presidente || '')} · ${d.meses | 0} ${d.meses === 1 ? 'MÊS' : 'MESES'} NO PODER</i>
      </div>
    </div>
    <p class="cab-sub">${caiu
      ? 'Não houve despedida oficial. Alguém já está sentado na sua cadeira.'
      : 'O mandato terminou com você de pé. Agora a História faz as contas.'}</p>
  </div>`;
}

function cenaBalanco(d) {
  // Quatro números, não dezesseis. O cartão completo vem depois e tem todos; aqui
  // entram só os que contam uma HISTÓRIA de uma década: o tamanho, a riqueza, o
  // apoio e a força. Um quinto número já seria tabela.
  const n = d.numeros || {};
  const item = (rot, val, cor) => `<div class="fe-num" style="--nc:${cor}"><i>${esc(rot)}</i><b>${esc(String(val))}</b></div>`;
  return `<div class="cab-cena">
    <div class="cab-rot cab-cyan">${ico('landmark', 12)} O QUE FICOU DE PÉ</div>
    <div class="fe-numeros">
      ${item('TERRITÓRIOS', n.territorio, n.territorio > 1 ? 'var(--verde)' : 'var(--fraco)')}
      ${item('PIB', n.pib, 'var(--ambar)')}
      ${item('APROVAÇÃO', n.aprovacao, n.aprovacaoBaixa ? 'var(--perigo)' : 'var(--verde)')}
      ${item('FORÇA MILITAR', n.forca, 'var(--cyan)')}
    </div>
    <p class="cab-sub">${esc(d.frasePatrimonio || 'É o país que você entrega — números fechados, sem arredondamento a seu favor.')}</p>
  </div>`;
}

function cenaDoutrina(d) {
  const dt = d.doutrina;
  return `<div class="cab-cena fe-doutrina-cena" style="--dc:${esc(dt.cor)}">
    <div class="cab-rot fe-dc">${ico('scroll', 12)} O QUE VOCÊ PROMETEU SER</div>
    <div class="fe-doutrina">
      <div class="fe-dic">${ico(dt.ic, 40)}</div>
      <b>${esc(dt.nome)}</b>
      <i>“${esc(dt.lema)}”</i>
    </div>
    <p class="cab-sub">${esc(dt.promessa)}</p>
  </div>`;
}

function cenaLegado(d) {
  const L = d.legado;
  return `<div class="cab-cena fe-legado-cena" style="--dc:${esc(d.doutrina?.cor || 'var(--cyan)')}">
    <div class="cab-rot fe-dc">${ico('award', 12)} O LEGADO DA DÉCADA</div>
    <div class="fe-legado">
      <div class="fe-leg-num" data-alvo="${L.total | 0}">0</div>
      <div class="fe-leg-quebra">
        <span><i>NA SUA DOUTRINA</i><b>+${L.dentro | 0}</b></span>
        <span><i>FORA DELA</i><b>${(L.fora | 0) >= 0 ? '+' : ''}${L.fora | 0}</b></span>
        <span><i>DESTINO</i><b>+${L.destino | 0}</b></span>
      </div>
    </div>
    <p class="cab-sub">${esc(d.fraseLegado || '')}</p>
  </div>`;
}

function cenaVeredito(d) {
  return `<div class="cab-cena fe-veredito-cena" style="--vc:${esc(d.acento)}">
    <div class="cab-rot fe-vc">${ico('gavel', 12)} ${esc(d.tag || 'O VEREDITO')}</div>
    <h1 class="cab-tit fe-vtit">${esc(d.titulo || '')}</h1>
    ${d.epiteto ? `<div class="fe-epiteto">${ico('bookmark', 14)} ${esc(d.epiteto)}</div>` : ''}
    <p class="cab-sub fe-chamada">${ico('file-text', 13)} ABRINDO O DOSSIÊ COMPLETO</p>
  </div>`;
}

// ── A CINEMÁTICA ───────────────────────────────────────────────────────
// Mesmo contrato do onuAbertura: devolve um CANCELADOR. Se a partida for desmontada
// no meio (renascimento, sala caiu), quem chamou cancela e tudo some — timers, trilha
// e DOM — sem disparar o `aoFim` numa tela que já não existe.
export function abrirFimDaEra(dados, aoFim) {
  const d = dados || {};
  const timers = [];
  const emT = (fn, ms) => timers.push(setTimeout(fn, ms));
  let encerrado = false;
  let trilha = null;

  // A cena da doutrina só existe se houver doutrina (save antigo, ou partida
  // começada antes da Fase 1). O tempo dela é REDISTRIBUÍDO nas outras em vez de
  // encurtar a cinemática: um fim de era de 12s e outro de 15s pareceria bug.
  const temDoutrina = !!d.doutrina && !!d.legado;
  const ordem = temDoutrina
    ? [['relogio', cenaRelogio], ['balanco', cenaBalanco], ['doutrina', cenaDoutrina], ['legado', cenaLegado], ['veredito', cenaVeredito]]
    : [['relogio', cenaRelogio], ['balanco', cenaBalanco], ['veredito', cenaVeredito]];
  const bruto = ordem.reduce((a, [k]) => a + RITMO[k], 0);
  const fator = DUR_FIM_MS / bruto;
  const duracoes = ordem.map(([k]) => Math.round(RITMO[k] * fator));

  const raiz = document.createElement('div');
  raiz.className = `cab-over fe-over tom-${esc(d.tom || 'legado')}`;
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-live', 'polite');
  raiz.setAttribute('aria-label', 'Fim da era');
  raiz.innerHTML = `
    <div class="cab-grade" aria-hidden="true"></div>
    <div class="cab-palco"></div>
    <div class="cab-pe">
      <div class="cab-prog"><i></i></div>
      <div class="cab-conta"><b>15</b><span>SEG</span></div>
      <button class="cab-pular" type="button">VER O DOSSIÊ ${ico('chevron-right', 13)}</button>
    </div>`;
  document.body.appendChild(raiz);

  const palco = raiz.querySelector('.cab-palco');
  const barra = raiz.querySelector('.cab-prog i');
  const conta = raiz.querySelector('.cab-conta b');
  const naTecla = (ev) => { if (ev.key === 'Escape') fim(); };

  const limpar = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    clearInterval(raiz._tick);
    clearInterval(raiz._conta);
    window.removeEventListener('keydown', naTecla);
    trilha?.parar();
    trilha = null;
    raiz.remove();
  };
  const fim = () => {
    if (encerrado) return;      // pular + estouro do tempo podem colidir no mesmo frame
    encerrado = true;
    limpar();
    try { aoFim?.(); } catch (e) { console.error('[fimAbertura] aoFim falhou', e); }
  };

  raiz.querySelector('.cab-pular').addEventListener('click', fim);
  window.addEventListener('keydown', naTecla);
  trilha = tocarTrilha('conselho-suspense');

  let t = 0;
  ordem.forEach(([chave, cena], i) => {
    const entrar = () => {
      palco.innerHTML = cena(d);
      palco.dataset.etapa = String(i + 1);
      palco.querySelectorAll('img.cab-flag').forEach((im) => {
        im.addEventListener('error', () => {
          const ph = document.createElement('div');
          ph.className = `${im.className} sem`;
          ph.textContent = im.dataset.sigla || '??';
          im.replaceWith(ph);
        }, { once: true });
      });
      // O NÚMERO QUE SOBE. É a única animação com trabalho de verdade aqui, e existe
      // por um motivo: um Legado que aparece pronto é um dado; um Legado que sobe de
      // 0 a 322 na frente do jogador é o placar de uma década passando na tela. A
      // contagem termina 400ms antes da cena virar, pra o número final ficar parado
      // tempo suficiente pra ser lido.
      if (chave === 'legado') contar(palco.querySelector('.fe-leg-num'), Math.max(600, duracoes[i] - 400), raiz);
    };
    if (i === 0) entrar(); else emT(entrar, t);
    t += duracoes[i];
  });

  // Barra e contador pelo relógio de parede, e não por transição CSS: no frame em que
  // o overlay entra no DOM o estilo inicial ainda não foi resolvido, e a transição
  // vira salto. Medir o tempo também não mente quando o navegador estrangula a aba.
  const inicio = Date.now();
  raiz._tick = setInterval(() => {
    const passou = Date.now() - inicio;
    barra.style.width = `${Math.max(0, Math.min(100, (passou / DUR_FIM_MS) * 100)).toFixed(2)}%`;
    conta.textContent = String(Math.max(0, Math.ceil((DUR_FIM_MS - passou) / 1000)));
  }, 100);

  emT(fim, DUR_FIM_MS);

  return () => {
    if (encerrado) return;
    encerrado = true;          // cancelado de fora NÃO chama aoFim
    limpar();
  };
}

// Contagem com desaceleração (easing cúbico de saída): sobe rápido e freia no fim.
// Linear pareceria um contador de posto de gasolina; a freada é o que faz os últimos
// dígitos criarem expectativa. O id vai em `raiz._conta` pra o cancelador matar junto.
function contar(el, ms, raiz) {
  if (!el) return;
  const alvo = Number(el.dataset.alvo) || 0;
  if (!alvo) { el.textContent = '0'; return; }
  const inicio = Date.now();
  raiz._conta = setInterval(() => {
    const p = Math.min(1, (Date.now() - inicio) / ms);
    const eased = 1 - (1 - p) ** 3;
    el.textContent = String(Math.round(alvo * eased));
    if (p >= 1) { clearInterval(raiz._conta); raiz._conta = null; }
  }, 40);
}
