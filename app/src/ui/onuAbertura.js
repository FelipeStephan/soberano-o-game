// ═══════════════════════════════════════════════════════════════════════
// ABERTURA DO CONSELHO — os 15 segundos antes da votação
// ═══════════════════════════════════════════════════════════════════════
// O PEDIDO DO DONO: "a ideia é fazer com que o sancionado possa ser surpreendido.
// Ninguém sabe quem vai ser sancionado. (...) nesses quinze segundos criar essa
// narrativa bonitinha, passando de etapa por etapa, pra pessoa ler."
//
// O QUE ISTO CONSERTA: hoje o Conselho abre DIRETO na tela de votação. O nome do
// réu aparece junto com os botões de voto — a informação mais dramática do jogo
// entregue como um campo de formulário. Sem suspense, sem tensão, e sem ninguém
// saber quem armou a sessão.
//
// A ORDEM DAS ETAPAS É A PIADA INTEIRA: o réu é o penúltimo a aparecer. Antes
// dele o jogador já sabe que a mesa se formou, quem convocou e por quê — então
// ele passa cinco segundos se perguntando "sou eu?". Se a bandeira do réu viesse
// na etapa 1 não haveria cinemática nenhuma, só uma abertura mais lenta.
//
// A etapa 2 (QUEM CONVOCOU) é pedido explícito: "pelo menos a gente saber quem
// criou o conselho, acho válido até pra comunicação dentro do jogo, de parcerias
// e tal." É informação POLÍTICA — quem convoca contra quem é o que gera aliança
// e vingança na sala.
//
// Regra de leitura que guiou o CSS: o texto é o herói, a animação é moldura.
// Nada de cor sozinha carregando sentido (o rótulo escrito e o ícone dizem o
// mesmo que a cor — daltônico lê a cena igual).
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { ico } from './icones.js';
import { tocarConselho } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// O contrato com o onu.js: 15s cravados. Quem chama agenda a votação em cima
// disto, então o número vive aqui e não duplicado lá.
export const DUR_ABERTURA_MS = 15000;

// Ritmo das 5 etapas — soma EXATA de DUR_ABERTURA_MS.
// Calibragem: o réu (4ª) ganha a maior fatia porque é o clímax e o jogador
// precisa de tempo pra reconhecer a bandeira antes de ler o nome. O motivo (3ª)
// vem em segundo lugar porque é a única etapa com texto livre, escrito pelo
// convocador, que pode ser longo. O selo (1ª) e a pena (5ª) são placas: leem-se
// num relance.
const ETAPAS_MS = [2600, 2600, 3200, 3800, 2800];

// Bandeira grande com degrau de fallback: se o flagcdn não responder (ou o país
// não tiver ISO no mapa), sobra uma placa com a sigla. Nunca um buraco na tela —
// a etapa do réu não pode ficar vazia justamente no clímax.
function flagHTML(iso, largura, classe) {
  const url = bandeira(ISO2_DE[iso], largura);
  const sigla = esc(String(iso || '??').slice(0, 3).toUpperCase());
  if (!url) return `<div class="cab-flag ${classe} sem">${sigla}</div>`;
  return `<img class="cab-flag ${classe}" src="${esc(url)}" alt="" data-sigla="${sigla}">`;
}

// ── AS CINCO CENAS ─────────────────────────────────────────────────────
// Cada uma devolve só o HTML do palco. Separadas em funções porque o ritmo é
// coisa que o dono vai querer mexer — trocar a ordem tem de ser mover linha.
function cenaSelo(d) {
  return `<div class="cab-cena cab-selo-cena">
    <div class="cab-selo">${ico('landmark', 46)}</div>
    <div class="cab-rot cab-cyan">${ico('gavel', 12)} SESSÃO EXTRAORDINÁRIA</div>
    <h1 class="cab-tit">O CONSELHO FOI CONVOCADO</h1>
    <div class="cab-adesao">
      <span class="cab-ad sim"><b>${d.sim | 0}</b><i>A FAVOR</i></span>
      <span class="cab-ad nao"><b>${d.nao | 0}</b><i>CONTRA</i></span>
      <span class="cab-ad tot"><b>${d.total | 0}</b><i>NAÇÕES</i></span>
    </div>
    <p class="cab-sub">A mesa está formada. O nome do acusado ainda é secreto.</p>
  </div>`;
}

function cenaConvocador(d) {
  return `<div class="cab-cena">
    <div class="cab-rot cab-cyan">${ico('user-check', 12)} QUEM CONVOCOU</div>
    <div class="cab-cartao">
      ${flagHTML(d.convocadorIso, 160, 'media')}
      <div class="cab-cartao-txt">
        <b>${esc(d.convocadorNome || d.convocadorIso || 'DELEGAÇÃO ANÔNIMA')}</b>
        <i>${ico('flag', 11)} ${esc(String(d.convocadorIso || '—').toUpperCase())} · PRESIDE A SESSÃO</i>
      </div>
    </div>
    <p class="cab-sub">Pediu a palavra e arrastou a mesa. A pauta é dele.</p>
  </div>`;
}

function cenaMotivo(d) {
  const corpo = String(d.motivo || '').trim();
  return `<div class="cab-cena">
    <div class="cab-rot cab-ambar">${ico('file-text', 12)} DOCUMENTO DESCLASSIFICADO</div>
    <div class="cab-doc">
      <div class="cab-doc-cab"><span>PAUTA · ITEM ÚNICO</span><span class="cab-doc-sel">CONFIDENCIAL</span></div>
      <h2>${esc(d.titulo || 'ACUSAÇÃO SEM TÍTULO')}</h2>
      <p>${corpo ? esc(corpo) : 'Nenhuma exposição de motivos anexada. A acusação falará na tribuna.'}</p>
    </div>
  </div>`;
}

function cenaReu(d) {
  // O CLÍMAX. A bandeira entra grande e o nome só se firma depois dela — quem
  // reconhece a bandeira descobre meio segundo antes de quem precisa ler. Essa
  // meia respiração é exatamente o "susto" que o dono descreveu.
  return `<div class="cab-cena cab-reu-cena">
    <div class="cab-rot cab-perigo">${ico('crosshair', 12)} O BANCO DOS RÉUS</div>
    <div class="cab-reu">
      ${flagHTML(d.acusadoIso, 320, 'gigante')}
      <div class="cab-reu-nome">${esc(d.acusadoNome || d.acusadoIso || 'RÉU DESCONHECIDO')}</div>
      <div class="cab-reu-iso">${ico('flag', 11)} ${esc(String(d.acusadoIso || '—').toUpperCase())} · ACUSADO</div>
    </div>
  </div>`;
}

function cenaPena(d) {
  const cor = d.penaCor || 'var(--perigo)';
  return `<div class="cab-cena cab-pena-cena" style="--pc: ${esc(cor)}">
    <div class="cab-rot cab-pc">${ico('scale', 12)} A PENA EM JOGO</div>
    <div class="cab-pena">
      <span class="cab-pena-ic">${ico(d.penaIc || 'gavel', 34)}</span>
      <b>${esc(d.penaRot || 'SANÇÃO')}</b>
      <i>proposta contra ${esc(d.acusadoNome || d.acusadoIso || 'o réu')}</i>
    </div>
    <p class="cab-sub cab-chamada">${ico('vote', 13)} ABRINDO PARA VOTAÇÃO</p>
  </div>`;
}

const CENAS = [cenaSelo, cenaConvocador, cenaMotivo, cenaReu, cenaPena];

// ── A CINEMÁTICA ───────────────────────────────────────────────────────
// Devolve um CANCELADOR, não um objeto: se a sessão morrer no meio (host caiu,
// jogador saiu da sala), quem chamou chama a função e TUDO some — timers,
// música e DOM. Sem isso um relay instável deixava a tela preta pendurada por
// cima do globo, e o `aoFim` disparava depois numa sala que já não existe.
export function abrirAberturaConselho(dados, aoFim) {
  const d = dados || {};
  const timers = [];
  const emT = (fn, ms) => timers.push(setTimeout(fn, ms));
  let encerrado = false;
  let trilha = null;

  const raiz = document.createElement('div');
  raiz.className = 'cab-over';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-live', 'polite');
  raiz.setAttribute('aria-label', 'Abertura do Conselho de Segurança');
  raiz.innerHTML = `
    <div class="cab-grade" aria-hidden="true"></div>
    <div class="cab-palco"></div>
    <div class="cab-pe">
      <div class="cab-prog"><i></i></div>
      <div class="cab-conta"><b>15</b><span>SEG</span></div>
      <button class="cab-pular" type="button">PULAR ${ico('chevron-right', 13)}</button>
    </div>`;
  document.body.appendChild(raiz);

  const palco = raiz.querySelector('.cab-palco');
  const barra = raiz.querySelector('.cab-prog i');
  const conta = raiz.querySelector('.cab-conta b');

  // Esc pula igual ao botão — quem já viu a cinemática não quer caçar botão.
  const naTecla = (ev) => { if (ev.key === 'Escape') fim(); };

  // Limpeza única e idempotente. Ela é o cancelador E o caminho normal de saída,
  // então não pode importar quantas vezes é chamada. O listener de teclado sai
  // AQUI (e não só no cancelador): ele mora no window, não no nó removido, e
  // ficaria escutando Esc pra sempre depois da cinemática.
  const limpar = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    clearInterval(raiz._tick);
    window.removeEventListener('keydown', naTecla);
    trilha?.parar();
    trilha = null;
    raiz.remove();
  };
  const fim = () => {
    if (encerrado) return;   // pular + estouro dos 15s podem colidir no mesmo frame
    encerrado = true;
    limpar();
    try { aoFim?.(); } catch (e) { console.error('[onuAbertura] aoFim falhou', e); }
  };

  // PULAR: discreto de propósito. Na 1ª sessão ninguém pula; na 12ª todo mundo
  // pula. O botão existe pra não transformar a cena bonita em pedágio.
  raiz.querySelector('.cab-pular').addEventListener('click', fim);
  window.addEventListener('keydown', naTecla);

  trilha = tocarConselho();

  // Sequência: cada etapa entra no seu tempo acumulado. Um setTimeout por cena
  // em vez de um loop com estado — assim o cancelador só precisa varrer a lista.
  let t = 0;
  CENAS.forEach((cena, i) => {
    const entrar = () => {
      palco.innerHTML = cena(d);
      palco.dataset.etapa = String(i + 1);
      // Segundo degrau do fallback de bandeira: o flagcdn é CDN público e às
      // vezes 404 num ISO exótico. Se a imagem morrer, ela vira a placa da
      // sigla no lugar — nada de ícone de imagem quebrada no clímax.
      palco.querySelectorAll('img.cab-flag').forEach((im) => {
        im.addEventListener('error', () => {
          const ph = document.createElement('div');
          ph.className = `${im.className} sem`;
          ph.textContent = im.dataset.sigla || '??';
          im.replaceWith(ph);
        }, { once: true });
      });
    };
    if (i === 0) entrar(); else emT(entrar, t);
    t += ETAPAS_MS[i];
  });

  // Barra + contador existem por um motivo só: sem eles 15s de tela cheia
  // parecem um travamento, e o jogador vai de F5 no meio da própria cinemática.
  //
  // A barra é dirigida por ESTE tick, não por uma transição CSS de 15s. Já tentei
  // com transição: no frame em que o overlay entra no DOM o estilo inicial ainda
  // não foi resolvido, então o `width: 100%` virava salto sem animação — a barra
  // ficava colada no zero os 15 segundos inteiros. Medir Date.now() a cada 100ms
  // também não mente quando o navegador estrangula a aba em segundo plano.
  const inicio = Date.now();
  raiz._tick = setInterval(() => {
    const passou = Date.now() - inicio;
    const pct = Math.max(0, Math.min(100, (passou / DUR_ABERTURA_MS) * 100));
    barra.style.width = `${pct.toFixed(2)}%`;
    conta.textContent = String(Math.max(0, Math.ceil((DUR_ABERTURA_MS - passou) / 1000)));
  }, 100);

  emT(fim, DUR_ABERTURA_MS);

  return () => {
    if (encerrado) return;
    encerrado = true;               // cancelado de fora NÃO chama aoFim
    limpar();
  };
}
