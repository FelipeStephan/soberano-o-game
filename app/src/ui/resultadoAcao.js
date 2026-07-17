// ═══════════════════════════════════════════════════════════════════════
// RESULTADO VIVO — o veredito de cada ação quando o relógio a resolve
// ═══════════════════════════════════════════════════════════════════════
// No tempo real ninguém "passa o turno" — então o momento em que a Propina cola
// (ou estoura) precisa GRITAR sozinho. Este módulo empilha cards no canto inferior
// ESQUERDO do globo (breaking fica no centro, notificações à direita): ícone, nome,
// veredito em cor semântica e os impactos que a jogada deixou na mesa.
//
// FUNÇÃO PURA DE UI: recebe o objeto `resultado` que resolverFila devolve
// (id, nome, icone, categoria, custo, sucesso, prob, mudancas, ganhoForcas, alvo,
// major) e só pinta. Amanhã o servidor empurra o MESMO objeto pro online e nada
// aqui muda. A escolha de frase é por hash do id — reproduzível, sem Math.random.
import { VARS } from '../jogo/vars.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── Copy emocional (2 variantes por categoria × desfecho; hash do id decide) ──
// Tom de jogo: sucesso exalta, falha dói e cobra revanche. Nada burocrático.
const COPY = {
  'Militar': {
    sucesso: ['Operação cumprida. Os quartéis batem continência — hoje o país dorme maior.', 'Vitória limpa. O Estado-Maior já pendura o mapa novo na parede.'],
    falha: ['Recuo. As baixas doem no telejornal — e a farda cobra revanche.', 'A ofensiva travou na lama. Silêncio no gabinete; o inimigo ri por rádio.'],
  },
  'Economia': {
    sucesso: ['O mercado engoliu — e pediu mais. O caixa respira e a manchete é sua.', 'Os números fecharam no azul. Até seus críticos conferiram duas vezes.'],
    falha: ['O plano derreteu na tela dos investidores. Alguém vai pagar essa conta — que não seja você.', 'Furo no caixa. O mercado viu, precificou e cobrou juros da sua reputação.'],
  },
  'Diplomacia': {
    sucesso: ['Aperto de mão, flash de câmeras. A mesa do mundo abriu uma cadeira pra você.', 'A chancelaria venceu sem disparar um tiro. É assim que impérios duram.'],
    falha: ['Portas fechadas em três capitais. O telefone vermelho hoje só dá ocupado.', 'O acordo morreu na antessala. Sorrisos protocolares, punhal no comunicado.'],
  },
  'Inteligência': {
    sucesso: ['Ninguém viu. Ninguém vai ver. O envelope chegou limpo à sua mesa.', 'A rede funcionou no escuro — exatamente onde ela vive.'],
    falha: ['Agente queimado. Torça para o rastro não subir a escada até o seu gabinete.', 'A operação vazou. Em algum porão, alguém já negocia o seu segredo.'],
  },
  'Mídia': {
    sucesso: ['A narrativa pegou. Amanhã o país repete as suas palavras achando que são dele.', 'Manchetes alinhadas, editoriais dóceis. A tela agora joga no seu time.'],
    falha: ['O feitiço virou meme. A imprensa farejou a mão do governo — e mordeu.', 'A campanha naufragou no deboche. Comprar caneta é fácil; comprar fé, não.'],
  },
  'Arsenal': {
    sucesso: ['O arsenal cresceu em silêncio. Os vizinhos vão notar — e é pra notar.', 'Aço novo no inventário. A dissuasão fala baixo e todo mundo escuta.'],
    falha: ['Falha no programa. Bilhões em fumaça e um galpão de sucata cara.', 'O teste fracassou — e satélite alheio fotografou tudo.'],
  },
  'Ciência': {
    sucesso: ['Os laboratórios entregaram. O futuro chegou primeiro na sua bandeira.', 'Avanço confirmado. A História anota quem financiou a descoberta.'],
    falha: ['O projeto implodiu na bancada. Anos de verba, um relatório de desculpas.', 'A pesquisa bateu no muro. O rival publica primeiro — e agradece.'],
  },
  'Política': {
    sucesso: ['A jogada colou. O gabinete comemora em silêncio — cúmplice sorri de porta fechada.', 'Costura fina: os votos apareceram e ninguém perguntou de onde.'],
    falha: ['Estourou. O mundo viu — e vai cobrar. Recomponha-se antes da próxima manchete.', 'O esquema vazou feio. Hoje você é o escândalo; sobreviva até virar nota de rodapé.'],
  },
  _: {
    sucesso: ['Feito. A ordem desceu, o resultado subiu — o comando funciona.', 'Executado sem ruído. O poder é isso: acontecer.'],
    falha: ['Não colou. O custo ficou; o resultado, não. Ajuste a mira.', 'Fracassou. O mundo não perdoa intenção — só entrega.'],
  },
};

const PARCIAL = ['Colou — mas deixou lascas. Vitória com asterisco também conta.', 'Deu certo no grosso; o troco veio junto. Administre o dano.'];

// Chaves em que DESCER é bom (pra pintar a seta com a cor certa).
const INVERTIDAS = new Set(['divida', 'temp_guerra']);

// Hash determinístico (mesmo id → mesma frase, aqui e no online de amanhã).
function hashId(s) {
  const t = String(s);
  let h = 0;
  for (let i = 0; i < t.length; i++) h = ((h * 31) + t.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rotuloDe(chave) {
  if (VARS[chave]) return VARS[chave].rotulo;
  if (String(chave).startsWith('rel_')) return `Relação ${String(chave).slice(4)}`;
  return chave;
}

function linhaImpacto(m) {
  if (!m || (!m.delta && !m.valor)) return '';
  if (m.valor !== undefined && !m.delta) {
    return `<div class="resac-imp neutro"><i>◆</i><span>${esc(rotuloDe(m.chave))}</span><b>${esc(m.valor)}</b></div>`;
  }
  const sobe = m.delta > 0;
  const bom = INVERTIDAS.has(m.chave) ? !sobe : sobe;
  const val = Math.abs(m.delta) < 10 ? (Math.round(m.delta * 10) / 10) : Math.round(m.delta);
  return `<div class="resac-imp ${bom ? 'bom' : 'ruim'}"><i>${sobe ? '▲' : '▼'}</i><span>${esc(rotuloDe(m.chave))}</span><b>${sobe ? '+' : ''}${val}</b></div>`;
}

function linhaForca(g) {
  return `<div class="resac-imp bom"><i>${esc(g.icone || '▲')}</i><span>${esc(g.nome)}</span><b>+${g.delta}</b></div>`;
}

// ── A pilha: máx 3 cards visíveis; os demais aguardam a vez ──────────────
const VISIVEIS_MAX = 3;
const VIDA_MS = 7000;
const filaEspera = [];
let visiveis = 0;

function pilhaEl(container) {
  const alvo = container
    || document.querySelector('#globo-wrap')
    || document.querySelector('.globo')
    || document.body;
  let p = alvo.querySelector(':scope > .resac-pilha');
  if (!p) { p = document.createElement('div'); p.className = 'resac-pilha'; alvo.appendChild(p); }
  return p;
}

/**
 * Anuncia o resultado de UMA ação resolvida no tempo real.
 * `resultado`: objeto de resolverFila (ou merge equivalente vindo do servidor).
 * `opts.container`: onde ancorar a pilha (default: .globo da tela do jogo).
 */
export function anunciarResultado(resultado, opts = {}) {
  if (!resultado || (!resultado.nome && !resultado.id)) return;
  if (visiveis >= VISIVEIS_MAX) { filaEspera.push([resultado, opts]); return; }
  mostrarCard(resultado, opts);
}

function mostrarCard(r, opts) {
  const pilha = pilhaEl(opts.container);
  visiveis += 1;

  const mudancas = (r.mudancas || []).filter((m) => m && (m.delta || m.valor !== undefined));
  const forcas = r.ganhoForcas || [];
  const totalImp = mudancas.length + forcas.length;

  // Desfecho: verde (êxito), vermelho (fracasso), âmbar (êxito com troco ruim).
  const falhou = r.sucesso === false;
  const temTroco = !falhou && mudancas.some((m) => m.delta && (INVERTIDAS.has(m.chave) ? m.delta > 0 : m.delta < 0));
  const tom = falhou ? 'falha' : temTroco ? 'parcial' : 'sucesso';
  const veredito = falhou ? 'FRACASSOU' : temTroco ? 'ÊXITO PARCIAL' : 'ÊXITO';

  const h = hashId(r.id || r.nome);
  const banco = COPY[r.categoria] || COPY._;
  const frase = tom === 'parcial' ? PARCIAL[h % PARCIAL.length]
    : (falhou ? banco.falha : banco.sucesso)[h % 2];

  const linhas = [...mudancas.map(linhaImpacto), ...forcas.map(linhaForca)].filter(Boolean);

  const card = document.createElement('div');
  card.className = `resac-card resac-${tom}${r.major ? ' resac-major' : ''}`;
  card.innerHTML = `
    <div class="resac-topo">
      <span class="resac-ic">${esc(r.icone || '◈')}</span>
      <span class="resac-nome">${esc(r.nome || r.id)}</span>
      <span class="resac-veredito">${veredito}</span>
    </div>
    <p class="resac-frase">${esc(frase)}</p>
    ${linhas.length ? `<div class="resac-imps">${linhas.join('')}</div>` : ''}
    ${totalImp > 4 ? `<div class="resac-mais">+${totalImp - 4} impactos — clique para ver</div>` : ''}
    <i class="resac-vida"></i>`;
  pilha.appendChild(card);

  // Clique expande para TODOS os impactos (CSS esconde além do 4º quando fechado).
  card.addEventListener('click', () => {
    card.classList.toggle('resac-aberto');
    const mais = card.querySelector('.resac-mais');
    if (mais) mais.textContent = card.classList.contains('resac-aberto') ? 'clique para recolher' : `+${totalImp - 4} impactos — clique para ver`;
  });

  // Vida de ~7s com PAUSA no hover (o timer congela enquanto o mouse lê).
  let resta = VIDA_MS;
  let desde = Date.now();
  let tmr = setTimeout(sair, resta);
  card.addEventListener('mouseenter', () => {
    clearTimeout(tmr); tmr = null;
    resta -= Date.now() - desde;
    card.classList.add('resac-pausado');
  });
  card.addEventListener('mouseleave', () => {
    desde = Date.now();
    card.classList.remove('resac-pausado');
    if (!tmr) tmr = setTimeout(sair, Math.max(600, resta));
  });

  function sair() {
    card.classList.add('resac-sai');
    setTimeout(() => {
      card.remove();
      visiveis = Math.max(0, visiveis - 1);
      const prox = filaEspera.shift();
      if (prox) mostrarCard(prox[0], prox[1]);
    }, 380);
  }
}
