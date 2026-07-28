// ═══════════════════════════════════════════════════════════════════════
// O FIM DO REINADO — o dossiê em etapas, no ritmo do jogador
// ═══════════════════════════════════════════════════════════════════════
// O PEDIDO DO DONO, na ordem em que ele veio:
//   1. "poderia ser um carrossel, uma coisa meio épica cinemática igual fizemos no
//      conselho da ONU"
//   2. "pra mim ficar aparecendo em uma única tela um monte de informação, pra dar
//      rolagem... então por etapa, eu vou passando próximo, próximo e próximo. Aí eu
//      vejo as informações relacionadas ao fim do jogo, o fim do reinado, quando você
//      é deposto. Só que com o tom E A COPY no estilo."
//
// A PRIMEIRA VERSÃO ERRAVA A MÃO: eu fiz uma cinemática automática de 15s ANTES do
// cartão — e o cartão continuou lá, com dezesseis números e barra de rolagem. Ou
// seja, entreguei o carrossel E mantive o problema. Duas telas onde o pedido era uma.
//
// Agora existe UMA coisa só: o dossiê É o carrossel. Sete etapas, uma tela cada,
// nenhuma rolagem, e o jogador avança quando quiser. Nada é automático — no fim de
// uma década de uma hora, ninguém quer ler no relógio de outra pessoa.
//
// ── AS TRÊS REGRAS QUE GOVERNAM O QUE ENTRA EM CADA ETAPA ─────────────
//
// 1. UMA PERGUNTA POR TELA. Cada etapa responde exatamente uma: "acabou como?",
//    "o que ficou?", "por quê?", "o que eu prometi?", "quanto valeu?", "eu ganhei?",
//    "como vão me lembrar?". Duas perguntas numa tela é o que produz rolagem.
//
// 2. O QUE NÃO TEM RESPOSTA NÃO VIRA ETAPA. Sem doutrina (save antigo), sem pódio
//    (partida offline), sem histórico — a etapa simplesmente não existe, e os pontos
//    embaixo mostram o total verdadeiro. Etapa vazia é pior que etapa a menos.
//
// 3. O TOM VEM DO DESFECHO, SEMPRE. Deposição, fim de mandato e império não podem
//    dividir a mesma copy. Todo texto aqui passa por `T` (o dicionário de tom lá
//    embaixo) antes de ir pra tela — elogiar o patrimônio de quem acabou de ser
//    arrancado da cadeira é o tipo de erro que o dono já flagrou nesta mesma tela.
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { ico } from './icones.js';
import { tocarTrilha, tocarEfeito } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function flagHTML(iso, largura, classe) {
  const url = bandeira(ISO2_DE[iso], largura);
  const sigla = esc(String(iso || '??').slice(0, 3).toUpperCase());
  if (!url) return `<div class="fe-flag ${classe} sem">${sigla}</div>`;
  return `<img class="fe-flag ${classe}" src="${esc(url)}" alt="" data-sigla="${sigla}">`;
}

// ── DE ONDE VEM CADA PALAVRA DESTA TELA ───────────────────────────────
// De `dados/copyFim.js`, e não daqui. Antes eu tinha um dicionário de três colunas
// cravado neste arquivo — o dono leu e disse: "não gosto desses textos não
// humanizados e ruim (...) quero uma copy mais criativa, e um banco de frases pré
// prontas para cada situação".
//
// Ele tinha razão em dois níveis. O óbvio: três frases fixas viram piada interna no
// terceiro reinado, e esta é a tela que o jogador mais relê. O menos óbvio: três
// colunas não bastavam. Cair com o povo na rua, cair quebrado e cair na guerra são
// três histórias diferentes, e todas recebiam o mesmo "alguém já está sentado na sua
// cadeira". Agora são NOVE situações, cada uma com três variantes por slot, sorteadas
// por uma semente da partida — estável enquanto o jogador lê, diferente na próxima.
//
// A tela virou o que devia ser: layout. Quem escreve mora em dados/.
import { VEREDITO, BALANCO, DIAGNOSTICO, IMPRENSA, FECHAR, escolher, familiaDe } from '../dados/copyFim.js';

// Cada slot leva um SAL diferente. Sem isso, todos cairiam no mesmo índice do array e
// a tela inteira andaria em bloco — o jogador veria sempre a variante 1 de tudo, ou
// sempre a 3, e o banco de frases não teria servido para nada.
function copyDaTela(d) {
  const s = d.semente;
  const V = VEREDITO[d.situacao] || VEREDITO.generico;
  const fam = familiaDe(d.situacao);
  return {
    rot1: escolher(V.rot, s, 1), tit1: escolher(V.tit, s, 2), sub1: escolher(V.sub, s, 3),
    rot2: escolher(BALANCO.rot[fam], s, 4), sub2: escolher(BALANCO.sub[fam], s, 5),
    rot3: escolher(DIAGNOSTICO.rot[fam], s, 6),
    sub7: escolher(IMPRENSA.sub[fam], s, 7),
    fechar: escolher(FECHAR[fam], s, 8),
  };
}
const tomDe = (d) => d.copy;

// ═══════════════════════════════════════════════════════════════════════
// AS ETAPAS
// ═══════════════════════════════════════════════════════════════════════
// Cada uma devolve `{ chave, rot, html }` ou null (não se aplica a esta partida).
// Separadas em funções porque a ordem é a primeira coisa que o dono vai querer
// mexer — reordenar tem de ser mover uma linha do array `montarEtapas`.

function etapaVeredito(d) {
  const t = tomDe(d);
  return { chave: 'veredito', rot: 'VEREDITO', html: `
    <div class="fe-cena fe-c-veredito">
      <div class="fe-selo">${ico(d.icone, 44)}</div>
      <div class="fe-rot fe-acento">${ico('clock', 12)} ${esc(t.rot1)}</div>
      <h1 class="fe-tit">${esc(t.tit1)}</h1>
      <div class="fe-marco">
        ${flagHTML(d.iso, 160, 'media')}
        <div class="fe-marco-txt">
          <b>${esc(d.pais)}</b>
          <i>${esc(d.presidente)} · ${esc(d.tempoNoPoder)} NO PODER</i>
        </div>
      </div>
      <div class="fe-sentenca">${esc(d.titulo)}</div>
      <p class="fe-corpo">${esc(d.texto)}</p>
      <p class="fe-sub">${esc(t.sub1)}</p>
    </div>` };
}

function etapaBalanco(d) {
  const t = tomDe(d);
  const p = (rot, val, cor) => `<div class="fe-pill" style="--pc:${cor || 'var(--texto)'}"><i>${esc(rot)}</i><b>${esc(String(val))}</b></div>`;
  const n = d.numeros;
  return { chave: 'balanco', rot: 'BALANÇO', html: `
    <div class="fe-cena">
      <div class="fe-rot fe-acento">${ico('landmark', 12)} ${esc(t.rot2)}</div>
      <h2 class="fe-tit2">${esc(d.pais)}, no dia em que você saiu</h2>
      <div class="fe-pills">
        ${p('TEMPO NO PODER', d.tempoNoPoder, 'var(--cyan)')}
        ${p('DESTINO FINAL', `${n.destino}/100`, d.corBanda)}
        ${p('REGIME', n.regime, 'var(--roxo)')}
        ${p('PIB', n.pib, 'var(--ambar)')}
        ${p('TESOURO', n.tesouro, 'var(--ambar)')}
        ${p('DÍVIDA / PIB', `${n.divida}%`, n.divida >= 150 ? 'var(--perigo)' : 'var(--texto)')}
        ${p('TERRITÓRIOS', n.territorio, n.territorio > 1 ? 'var(--verde)' : 'var(--texto)')}
        ${p('OGIVAS', n.ogivas, n.ogivas ? 'var(--perigo)' : 'var(--fraco)')}
        ${p('FORÇA MILITAR', n.forca, 'var(--cyan)')}
        ${p('APROVAÇÃO', `${n.aprovacao}%`, n.aprovacao < 30 ? 'var(--perigo)' : 'var(--verde)')}
        ${p('SOFT POWER', n.softPower, 'var(--roxo)')}
        ${p('OCUPAÇÕES', n.ocupacoes, n.ocupacoes ? '#ff9628' : 'var(--fraco)')}
      </div>
      <p class="fe-sub">${esc(t.sub2)}</p>
    </div>` };
}

function etapaDiagnostico(d) {
  const t = tomDe(d);
  const g = d.diag;
  if (!g) return null;
  const bloco = (lista, classe) => lista.map((c) => `
    <div class="fe-lin ${classe}"><i>${esc(c.k)}</i><b>${esc(c.v)}</b><small>${esc(c.txt || '')}</small></div>`).join('');
  return { chave: 'diagnostico', rot: 'DIAGNÓSTICO', html: `
    <div class="fe-cena">
      <div class="fe-rot fe-acento">${ico('search', 12)} ${esc(t.rot3)}</div>
      <h2 class="fe-tit2">${esc(g.causaRot || 'O balanço da conta')}</h2>
      <p class="fe-corpo">${esc(g.explicacao || '')}</p>
      <div class="fe-colunas">
        ${g.feitos?.length ? `<div class="fe-col">
          <div class="fe-lab bom">${ico('award', 11)} O QUE VOCÊ CONSTRUIU</div>
          ${bloco(g.feitos.slice(0, 5), 'bom')}</div>` : ''}
        ${g.culpados?.length ? `<div class="fe-col">
          <div class="fe-lab ruim">${ico('trending-down', 11)} O QUE PESOU CONTRA</div>
          ${bloco(g.culpados.slice(0, 5), 'ruim')}</div>` : ''}
      </div>
      <p class="fe-sub">${esc(d.rotuloLegado)}</p>
    </div>` };
}

function etapaDoutrina(d) {
  const dt = d.doutrina;
  if (!dt) return null;
  return { chave: 'doutrina', rot: 'DOUTRINA', html: `
    <div class="fe-cena fe-c-doutrina" style="--dc:${esc(dt.cor)}">
      <div class="fe-rot fe-dc">${ico('scroll', 12)} O QUE VOCÊ PROMETEU SER</div>
      <div class="fe-dic">${ico(dt.ic, 40)}</div>
      <h1 class="fe-tit">${esc(dt.nome)}</h1>
      <i class="fe-lema">“${esc(dt.lema)}”</i>
      <p class="fe-corpo">${esc(dt.promessa)}</p>
      <div class="fe-mede">${ico('ruler', 12)} MEDIDO POR: ${esc(dt.mede)}</div>
      ${d.mandatos ? `<div class="fe-mandatos">
        <span>${ico('scroll', 12)} MANDATOS CUMPRIDOS</span>
        <b>${d.mandatos.cumpridos} de ${d.mandatos.total}</b>
        <i>${esc(fraseDeMandatos(d.mandatos))}</i>
      </div>` : ''}
    </div>` };
}

// ── ETAPA 5 · O LEGADO ────────────────────────────────────────────────
// O DONO OLHOU ESTA TELA E PERGUNTOU: "o que seria esses números? não é pontos? é o
// que precisa de número certo? recorde? não sei..."
//
// Ele estava certo em não saber. A tela mostrava "480" grande, sem UNIDADE e sem
// RÉGUA — e número sem escala não é informação, é um enfeite grande. Faltavam três
// coisas, todas acrescentadas aqui:
//   • a unidade escrita ("PONTOS DE LEGADO"), porque nada dizia o que aquilo era;
//   • a FAIXA (LENDA DA DÉCADA, DÉCADA HISTÓRICA…) e quanto faltou para a seguinte —
//     é o que responde "isso é bom?", a única pergunta que o jogador tem ali;
//   • um CABEÇALHO nas colunas: "14 ×3 +210" é ilegível sem saber que 14 é a
//     quantidade, ×3 é o peso da doutrina e +210 é o resultado.
// O ×1 também passou a aparecer nas linhas de fora da doutrina: mostrar o peso só
// quando ele é 3 faz parecer que as outras linhas não têm peso nenhum.
// A régua dos Mandatos na tela final. Cinco cobranças ao longo da década, e o que
// o jogador fez com elas é metade da história de como ele chegou até aqui — a outra
// metade é o Legado. Sem esta linha, os Mandatos somem no instante em que a partida
// acaba, e um sistema que só existe durante o jogo é um sistema que ninguém lembra.
function fraseDeMandatos(m) {
  if (!m.total) return 'Nenhuma cobrança chegou a vencer.';
  if (m.cumpridos === m.total) return 'Todas as cobranças entregues no prazo. Isso praticamente não acontece.';
  if (m.cumpridos === 0) return 'Nenhuma entregue. O gabinete parou de perguntar em algum momento.';
  if (m.cumpridos >= m.total - 1) return 'Quase tudo entregue. A falha que sobrou é a que vão citar.';
  return 'Metade do que o país pediu virou realidade. A outra metade virou discurso.';
}

function etapaLegado(d) {
  const L = d.legado;
  if (!L) return null;
  const f = d.faixaLegado;
  const linha = (l) => `<div class="fe-lg ${l.naDoutrina ? 'dentro' : ''} ${l.negativo ? 'ruim' : ''}">
    <span>${esc(l.rotulo)}</span><i>${l.qtd}</i><em>${l.naDoutrina ? '×3' : '×1'}</em><b>${l.pontos > 0 ? '+' : ''}${l.pontos}</b></div>`;
  return { chave: 'legado', rot: 'LEGADO', html: `
    <div class="fe-cena fe-c-legado" style="--dc:${esc(d.doutrina?.cor || 'var(--cyan)')}">
      <div class="fe-rot fe-dc">${ico('award', 12)} O LEGADO DA DÉCADA</div>
      <div class="fe-leg-num" data-alvo="${L.total | 0}">0</div>
      <div class="fe-leg-un">PONTOS DE LEGADO</div>
      ${f ? `<div class="fe-faixa">
        <b>${esc(f.atual.nome)}</b>
        <span>${esc(f.atual.nota)}${f.proxima ? ` Faltaram ${f.faltam} pontos para ${esc(f.proxima.nome)}.` : ''}</span>
      </div>` : ''}
      <div class="fe-leg-quebra">
        <span class="dentro"><i>NA SUA DOUTRINA</i><b>+${L.dentro | 0}</b></span>
        <span><i>FORA DELA</i><b>${(L.fora | 0) >= 0 ? '+' : ''}${L.fora | 0}</b></span>
        <span><i>DESTINO FINAL</i><b>+${L.destino | 0}</b></span>
      </div>
      ${L.linhas?.length ? `
      <div class="fe-lg-cab"><span>O QUE VOCÊ FEZ</span><i>QUANTO</i><em>PESO</em><b>PONTOS</b></div>
      <div class="fe-lgs">${L.linhas.slice(0, 8).map(linha).join('')}</div>`
        : `<div class="fe-sub">Uma década inteira e nenhum feito que o mundo tenha registrado. O Legado é o Destino, e nada mais.</div>`}
      <p class="fe-sub">Feito da sua doutrina vale <b>três vezes</b>; o resto vale uma. Desviar custa eficiência, nunca legitimidade — e ogiva detonada desconta de qualquer um.</p>
    </div>` };
}

function etapaPodio(d) {
  const r = d.ranking;
  if (!r?.disputado) return null;
  return { chave: 'podio', rot: 'PÓDIO', html: `
    <div class="fe-cena">
      <div class="fe-rot fe-acento">${ico('trophy', 12)} O PÓDIO DA DÉCADA</div>
      <h2 class="fe-tit2">${esc(r.campeao?.eu ? 'Ninguém nesta sala fez mais que você.' : `${r.campeao?.nome} terminou na frente.`)}</h2>
      <div class="fe-rank">
        ${r.linhas.slice(0, 8).map((l) => `
          <div class="fe-r ${l.eu ? 'eu' : ''} ${l.pos === 1 ? 'primeiro' : ''}">
            <span class="fe-pos">${l.pos}</span>
            ${flagHTML(l.iso, 40, 'mini')}
            <div class="fe-quem"><b>${esc(l.nome)}</b><i>${esc(l.doutrinaNome || 'SEM DOUTRINA')}</i></div>
            <b class="fe-rleg">${l.legado}</b>
          </div>`).join('')}
      </div>
      ${r.coroas?.length ? `<div class="fe-lab">${ico('crown', 11)} AS COROAS — o maior de cada caminho</div>
      <div class="fe-coroas">
        ${r.coroas.map((c) => `<div class="fe-coroa" style="--dc:${esc(c.cor)}">
          ${ico(c.ic, 14)}<i>${esc(c.nome)}</i><b>${esc(c.vencedor.nome)}</b><span>${c.vencedor.legado}</span>
        </div>`).join('')}
      </div>` : ''}
    </div>` };
}

function etapaImprensa(d) {
  const t = tomDe(d);
  return { chave: 'imprensa', rot: 'IMPRENSA', html: `
    <div class="fe-cena">
      <div class="fe-rot fe-acento">${ico('feather', 12)} O OBITUÁRIO POLÍTICO</div>
      <div class="fe-obito" id="fe-obito"><i class="fe-carregando">${ico('loader', 13)} a imprensa está escrevendo sobre você…</i></div>
      <div class="fe-jornais">
        <div class="fe-jor"><b style="color:${esc(d.amiga.cor)}">${esc(d.amiga.nome)}</b><span>${esc(d.amiga.tom)}</span></div>
        <div class="fe-jor"><b style="color:${esc(d.inimiga.cor)}">${esc(d.inimiga.nome)}</b><span>${esc(d.inimiga.tom)}</span></div>
      </div>
      ${d.historico?.length ? `<div class="fe-lab">${ico('scale', 11)} DECISÕES QUE TE DEFINIRAM</div>
      <div class="fe-hist">${d.historico.map((h) => `
        <div class="fe-h"><span>MÊS ${h.turno}</span><b>${esc(h.carta)}</b><i>${esc(h.escolha)}</i></div>`).join('')}</div>` : ''}
      <p class="fe-sub">${esc(t.sub7)}</p>
    </div>` };
}

function montarEtapas(d) {
  return [etapaVeredito(d), etapaBalanco(d), etapaDiagnostico(d), etapaDoutrina(d),
    etapaLegado(d), etapaPodio(d), etapaImprensa(d)].filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════
// O CARROSSEL
// ═══════════════════════════════════════════════════════════════════════
// `onObituario` recebe uma promessa: a IA escreve enquanto o jogador lê as primeiras
// etapas, e o texto entra na etapa 7 quando chegar. Se ele já tiver passado por ela,
// o HTML fica guardado e é reaplicado toda vez que a etapa é montada — sem isso,
// voltar uma tela apagava o obituário que já tinha chegado.
export function abrirFimDaEra(dados, { onNovo, onRenascer, obituario } = {}) {
  const d = dados || {};
  // A copy é sorteada UMA VEZ, aqui: se fosse sorteada a cada `pintar()`, a frase
  // mudaria quando o jogador voltasse uma etapa — e ele acharia que leu errado.
  d.copy = copyDaTela(d);
  const etapas = montarEtapas(d);
  if (!etapas.length) return () => {};
  let i = 0;
  let trilha = null;
  let obitoHTML = null;

  const raiz = document.createElement('div');
  raiz.className = `fe-over tom-${esc(d.tom || 'legado')}`;
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-label', 'Fim do reinado');
  raiz.innerHTML = `
    <div class="fe-grade" aria-hidden="true"></div>
    <div class="fe-quadro">
      <div class="fe-palco" id="fe-palco"></div>
      <footer class="fe-pe">
        <button class="fe-nav fe-voltar" id="fe-voltar" type="button">${ico('chevron-left', 15)} VOLTAR</button>
        <div class="fe-pontos" id="fe-pontos"></div>
        <button class="fe-nav fe-proximo" id="fe-proximo" type="button">PRÓXIMO ${ico('chevron-right', 15)}</button>
      </footer>
    </div>`;
  document.body.appendChild(raiz);

  const palco = raiz.querySelector('#fe-palco');
  const pontos = raiz.querySelector('#fe-pontos');
  const bVoltar = raiz.querySelector('#fe-voltar');
  const bProximo = raiz.querySelector('#fe-proximo');

  // Os pontos são CLICÁVEIS e trazem o rótulo da etapa. Numa tela de sete passos, o
  // jogador que quer reler o Legado não deveria ter de voltar quatro vezes.
  pontos.innerHTML = etapas.map((et, k) => `<button class="fe-ponto" data-k="${k}" type="button"
    title="${esc(et.rot)}"><span></span><i>${esc(et.rot)}</i></button>`).join('');
  pontos.querySelectorAll('.fe-ponto').forEach((b) => b.addEventListener('click', () => irPara(Number(b.dataset.k))));

  function pintar() {
    palco.innerHTML = etapas[i].html;
    palco.dataset.etapa = etapas[i].chave;
    palco.classList.remove('entrando');
    void palco.offsetWidth;            // força o reflow: sem isso a animação não reinicia
    palco.classList.add('entrando');

    palco.querySelectorAll('img.fe-flag').forEach((im) => {
      im.addEventListener('error', () => {
        const ph = document.createElement('div');
        ph.className = `${im.className} sem`;
        ph.textContent = im.dataset.sigla || '??';
        im.replaceWith(ph);
      }, { once: true });
    });
    if (etapas[i].chave === 'legado') contar(palco.querySelector('.fe-leg-num'), 1600, raiz);
    if (etapas[i].chave === 'imprensa' && obitoHTML) aplicarObito();

    pontos.querySelectorAll('.fe-ponto').forEach((b, k) => {
      b.classList.toggle('on', k === i);
      b.classList.toggle('visto', k < i);
    });
    bVoltar.disabled = i === 0;
    // A ÚLTIMA ETAPA NÃO TEM "PRÓXIMO" — tem a saída. Um "próximo" que fecha a tela
    // é como um jogador perde a partida sem querer: ele estava só avançando.
    const ultima = i === etapas.length - 1;
    bProximo.className = `fe-nav ${ultima ? 'fe-sair' : 'fe-proximo'}`;
    bProximo.innerHTML = ultima
      ? `${ico('rotate-ccw', 15)} ${esc(tomDe(d).fechar)}`
      : `PRÓXIMO ${ico('chevron-right', 15)}`;
    // O renascimento (assumir outra nação, no online) só aparece no fim, ao lado da
    // saída: oferecê-lo na etapa 1 seria convidar o jogador a pular o próprio dossiê.
    raiz.querySelector('#fe-renascer')?.remove();
    if (ultima && onRenascer) {
      const b = document.createElement('button');
      b.id = 'fe-renascer'; b.type = 'button'; b.className = 'fe-nav fe-renascer';
      b.innerHTML = `${ico('users-round', 15)} ASSUMIR OUTRA NAÇÃO`;
      b.addEventListener('click', () => { fechar(); onRenascer(); });
      bProximo.insertAdjacentElement('beforebegin', b);
    }
  }

  function aplicarObito() {
    const alvo = palco.querySelector('#fe-obito');
    if (alvo && obitoHTML) alvo.innerHTML = obitoHTML;
  }

  function irPara(k) {
    const n = Math.max(0, Math.min(etapas.length - 1, k));
    if (n === i) return;
    i = n;
    try { tocarEfeito('click', { volume: 0.4 }); } catch { /* sem áudio */ }
    pintar();
  }
  const avancar = () => { if (i === etapas.length - 1) { fechar(); onNovo?.(); } else irPara(i + 1); };

  bProximo.addEventListener('click', avancar);
  bVoltar.addEventListener('click', () => irPara(i - 1));

  // Setas e Enter navegam. Esc NÃO fecha: esta tela é o resultado da partida, não um
  // modal de consulta — fechar sem querer aqui custa a única leitura que o jogador vai
  // fazer dos seus dez anos.
  const naTecla = (ev) => {
    if (ev.key === 'ArrowRight' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); avancar(); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); irPara(i - 1); }
  };
  window.addEventListener('keydown', naTecla);

  function fechar() {
    window.removeEventListener('keydown', naTecla);
    clearInterval(raiz._conta);
    trilha?.parar();
    trilha = null;
    raiz.classList.add('saindo');
    setTimeout(() => raiz.remove(), 300);
  }

  trilha = tocarTrilha('conselho-suspense');
  pintar();

  Promise.resolve(obituario).then((txt) => {
    if (!txt) return;
    obitoHTML = String(txt).split(/\n{2,}/).map((p) => `<p>${esc(p.trim())}</p>`).join('');
    if (etapas[i].chave === 'imprensa') aplicarObito();
  }).catch(() => {});

  return fechar;
}

// Contagem com desaceleração (easing cúbico de saída): sobe rápido e freia no fim.
// Linear pareceria bomba de posto; a freada é o que faz os últimos dígitos criarem
// expectativa. O id mora em `raiz._conta` pra o fechar() matar junto.
function contar(el, ms, raiz) {
  if (!el) return;
  clearInterval(raiz._conta);
  const alvo = Number(el.dataset.alvo) || 0;
  if (!alvo) { el.textContent = '0'; return; }
  const inicio = Date.now();
  raiz._conta = setInterval(() => {
    const p = Math.min(1, (Date.now() - inicio) / ms);
    el.textContent = String(Math.round(alvo * (1 - (1 - p) ** 3)));
    if (p >= 1) { clearInterval(raiz._conta); raiz._conta = null; }
  }, 40);
}
