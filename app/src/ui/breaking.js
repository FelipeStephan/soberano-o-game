// ═══════════════════════════════════════════════════════════════════════
// BREAKING NEWS — a barra de plantão que estoura depois das ações
// ═══════════════════════════════════════════════════════════════════════
// O que resolve: o mundo reagia às suas ações só no feed lateral, que é fácil de
// ignorar. Isto é o oposto — uma faixa vermelha de PLANTÃO que desliza no alto do
// globo, com a LOGO de um veículo real e uma manchete no tom dele. Some sozinha.
//
// A manchete é escrita por IA (curta, no estilo do jornal escolhido) quando há chave;
// sem IA, cai num molde forte. O jogo nunca depende da IA pra ter voz — ela só afia.
//
// Uso: dispararBreaking(jogo, { assunto, contexto, tom, iso }). `assunto` é o gancho
// curto ("Ataque ao Irã"), `contexto` alimenta a IA, `tom` colore a faixa.
import { imprensaDe, IMPRENSA_INTERNACIONAL } from '../dados/imprensa.js';
import { logoDe } from '../dados/imagens.js';
import { ico } from './icones.js';
import { chamarIA } from '../maquina/openrouter.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Uma fila: dois plantões nunca se atropelam. Cada um vive ~8s.
const fila = [];
let mostrando = false;
let camada = null;

function garantirCamada() {
  if (camada && document.body.contains(camada)) return camada;
  camada = document.createElement('div');
  camada.className = 'breaking-camada';
  // DENTRO da tela do mundo, não na viewport. Como filho de .globo (position:relative,
  // overflow:hidden), a faixa vive no canto inferior do GLOBO — e fica naturalmente
  // ATRÁS de modais e da barra de ações, que moram fora desse container. Era isto que
  // o position:fixed no body nunca ia conseguir fazer.
  const globo = document.querySelector('.globo') || document.body;
  globo.appendChild(camada);
  return camada;
}

// Escolhe um veículo pra assinar a manchete. Vira e mexe é internacional (dá peso de
// "o mundo está vendo"); às vezes é da imprensa do próprio país.
function escolherVeiculo(iso, i = 0) {
  const locais = imprensaDe(iso || 'USA');
  const pool = Math.random() < 0.55 ? IMPRENSA_INTERNACIONAL : locais;
  return pool[(i + Math.floor(Math.random() * pool.length)) % pool.length] || locais[0];
}

// A MANCHETE por IA — curta, plantão, no tom do veículo. Fallback forte se offline.
async function gerarManchete(veiculo, ctx) {
  const fb = () => moldeFallback(ctx);
  try {
    const system = `Você é o editor de plantão do veículo "${veiculo.nome}". Escreva UMA manchete de BREAKING NEWS, curta (no máximo 12 palavras), afiada, no tom editorial do veículo. Sem aspas, sem emoji, sem ponto final. Português do Brasil.`;
    const user = `Fato: ${ctx.assunto}. Contexto: ${ctx.contexto || ctx.assunto}. Escreva a manchete de plantão.`;
    const { texto } = await chamarIA({ system, user, temperature: 1, jsonMode: false });
    const limpo = String(texto || '').trim().replace(/^["'“”]|["'“”.]$/g, '').split('\n')[0];
    return limpo.length > 6 ? limpo : fb();
  } catch { return fb(); }
}

function moldeFallback(ctx) {
  return ctx.manchete || ctx.assunto || 'Plantão: o tabuleiro global se mexe';
}

export async function dispararBreaking(jogo, ctx = {}) {
  const veiculo = ctx.veiculo || escolherVeiculo(ctx.iso || jogo?.estado?.iso, fila.length);
  // A IA escreve enquanto a fila anda; quando chegar a vez, o texto já está pronto.
  const texto = await gerarManchete(veiculo, ctx);
  // MUNDO ÚNICO: o plantão ecoa na sala com o MESMO texto — todos leem a mesma
  // manchete. `remoto` impede o eco de ecoar de volta (loop).
  if (!ctx.remoto) jogo?._relayOnline?.('breaking', null, texto,
    { veiculoNome: veiculo.nome, handle: veiculo.handle, texto, tom: ctx.tom || 'quente' });
  fila.push({ veiculo, texto, tom: ctx.tom || 'quente' });
  // ECO NO X: a regra editorial da casa — nem toda notícia do X é breaking, mas TODO
  // breaking aparece no X. A faixa some em ~7,5s; o post fica, com o card de link do
  // veículo, pra quem perdeu o plantão poder reler (e pro online, pro mundo comentar).
  jogo?._empilharFeed?.([{
    tipo: 'veiculo', veiculo: veiculo.nome, handle: veiculo.handle,
    texto: `🔴 PLANTÃO — ${texto}`, manchete: texto, tom: 'breaking',
  }]);
  bombear();
}

// PLANTÃO VINDO DA SALA: outro jogador disparou um breaking — mostramos o MESMO
// texto aqui (sem re-gerar pela IA, sem re-ecoar). É o "todos veem a mesma notícia".
export function breakingRemoto(jogo, { veiculoNome, handle, texto, tom = 'quente' } = {}) {
  if (!texto) return;
  fila.push({ veiculo: { nome: veiculoNome || 'PLANTÃO', handle: handle || '@plantao' }, texto, tom });
  jogo?._empilharFeed?.([{
    tipo: 'veiculo', veiculo: veiculoNome || 'PLANTÃO', handle: handle || '@plantao',
    texto: `🔴 PLANTÃO — ${texto}`, manchete: texto, tom: 'breaking',
  }]);
  bombear();
}

function bombear() {
  if (mostrando || !fila.length) return;
  mostrando = true;
  const item = fila.shift();
  const cam = garantirCamada();
  const logo = logoDe(item.veiculo);

  const el = document.createElement('div');
  el.className = `breaking ${item.tom}`;
  el.innerHTML = `
    <span class="brk-pill">${ico('radio', 12)} BREAKING</span>
    <span class="brk-veic">${logo ? `<img src="${logo}" alt="" onerror="this.style.display='none'">` : ''}<b>${esc(item.veiculo.nome)}</b></span>
    <span class="brk-txt">${esc(item.texto)}</span>
    <i class="brk-x">${ico('x', 12)}</i>`;
  cam.appendChild(el);

  const fechar = () => {
    el.classList.add('sai');
    setTimeout(() => { el.remove(); mostrando = false; bombear(); }, 480);
  };
  el.querySelector('.brk-x').addEventListener('click', fechar);
  el.addEventListener('click', fechar);
  // Entra, respira ~7,5s, sai. Se o jogador clicar, sai antes.
  setTimeout(fechar, 7500);
}
