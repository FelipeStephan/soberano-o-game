// ═══════════════════════════════════════════════════════════════════════
// ATAQUE NAVAL — mísseis no globo, sem nada fixo na tela, e baixas no fim
// ═══════════════════════════════════════════════════════════════════════
// O dono foi claro (duas vezes): durante o ataque, NADA de janela na frente —
// ele quer ver os ícones batendo no planeta, com um tempo de combate que se
// sinta. E o RELATÓRIO DE BAIXAS não é um modal no meio da tela: é um cartão
// que nasce ANCORADO no ponto da batalha e gira junto com o globo, como tudo
// que é diegético neste jogo. Aqui moram também os DIÁLOGOS de intimação — as
// frotas se xingando pelo rádio antes de decidir se o mar pega fogo.
import { ico } from './icones.js';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── RESOLUÇÃO DE BAIXAS (força atacante × força defensora) ─────────────
// Determinística no resultado (quem vence), com as PERDAS proporcionais à razão de
// forças: esmagar custa pouco, empatar custa caro. Serve pra frota e pra guarnição.
export function resolverBaixas(poderAtaque, poderDefesa) {
  const venceu = poderAtaque >= poderDefesa;
  // piso 0.1 (não 1): as forças navais vivem numa escala pequena (fração a ~poucas
  // dezenas); um piso de 1 distorcia frotas fracas em vitórias sangrentas irreais.
  const razao = venceu ? poderDefesa / Math.max(0.1, poderAtaque) : poderAtaque / Math.max(0.1, poderDefesa);
  const perdaAtacante = venceu ? clamp(razao * 0.5, 0.02, 0.6) : clamp(0.35 + razao * 0.35, 0.35, 0.9);
  const perdaDefensor = venceu ? clamp(0.7 + (1 - razao) * 0.3, 0.7, 1) : clamp(razao * 0.5, 0.05, 0.6);
  return {
    venceu,
    perdaAtacantePct: Math.round(perdaAtacante * 100),
    perdaDefensorPct: Math.round(perdaDefensor * 100),
  };
}

// ── ANIMAÇÃO NO GLOBO (sem nenhuma janela) ─────────────────────────────
// Salvas de mísseis com CADÊNCIA de combate: cada rodada dispara, viaja, impacta.
// ~5s no total — o dono reclamou que o ataque era "extremamente rápido"; agora o
// duelo respira entre uma salva e outra, com o revide entrando no meio.
export async function animarAtaqueNaval(helpers, origem, alvo, { rounds = 4, revide = true } = {}) {
  helpers.desenharLinha?.(alvo, 'ataque', rounds * 1250 + 800, origem);
  for (let r = 0; r < rounds; r += 1) {
    helpers.salvaMisseis?.(alvo, 3, origem);                                 // você atira (o som mora em salvaMisseis)
    await espera(520);
    helpers.impacto?.(alvo);
    if (revide && r < rounds - 1) {
      await espera(300);
      helpers.salvaMisseis?.(origem, 2, alvo);                               // ele revida
      await espera(430);
      helpers.impacto?.(origem);
    }
    await espera(320);
  }
  await espera(350);
}

// ── DIÁLOGOS DE INTIMAÇÃO — o rádio aberto entre as pontes ─────────────
// O pedido: "textos criativos, com xingamentos, pra deixar intenso e imersivo".
// Rádio naval não é diplomacia: é ameaça com sotaque. Três pools — a sua ordem,
// a recusa (quando eles têm casco pra bancar a pose) e a rendição (quando não têm).
const INTIMACAO_ORDEM = [
  '📡 "Aqui é a Marinha. Vocês têm 10 minutos pra sumir dessas águas — ou viram recife artificial."',
  '📡 "Última chamada: recuem AGORA. Meu radar já escolheu por onde a sua esquadra afunda primeiro."',
  '📡 "Saiam do nosso caminho. O fundo do mar tá cheio de capitão teimoso."',
  '📡 "Deem meia-volta, ou o próximo comunicado de vocês vai ser em bolhas."',
];
const RESPOSTA_RECUSA = [
  '🛳️ "Recuar uma ova! Vão mandar nesse mar quando ele tiver a bandeira de vocês, seus engomadinhos!"',
  '🛳️ "O oceano não tem dono, otário. Se quer a gente fora daqui, vem tirar no braço."',
  '🛳️ "Hah! Esse monte de lata flutuante não assusta nem gaivota. Ficamos ONDE QUISERMOS."',
  '🛳️ "Vai ameaçar a mãe, comandante. Nossos canhões também sabem responder rádio."',
];
const RESPOSTA_RENDICAO = [
  '🏳️ "Tá bom, tá bom, maldição... zarpar já! Não aponta essa desgraça pra gente."',
  '🏳️ "Recuando, recuando! Mas escreve aí: isso não acaba aqui, seu arrogante de convés."',
  '🏳️ "Que inferno... motores a todo vapor, saindo. Um dia essa conta chega pra vocês."',
  '🏳️ "Entendido... droga de dia. A esquadra recua — o rancor, não."',
];
const sorteio = (pool) => pool[Math.floor(Math.random() * pool.length)];

// A sequência do "afastem-se": balões alternando entre os DOIS pinos, no globo,
// com tempo de rádio entre um e outro. Retorna se obedeceu (quem chama já decidiu).
export async function encenarIntimacao(helpers, minha, inimiga, obedece) {
  helpers.balao?.(minha, sorteio(INTIMACAO_ORDEM), 'conflito');
  await espera(1500);
  helpers.balao?.(inimiga, obedece ? sorteio(RESPOSTA_RENDICAO) : sorteio(RESPOSTA_RECUSA), obedece ? 'neutro' : 'conflito');
  await espera(1300);
  if (obedece) helpers.balao?.(inimiga, '⚓ A esquadra levanta âncora e se afasta…', 'neutro');
  else helpers.ondaRadar?.(inimiga, { cor: 0xff3b5c, max: 34 });
  return obedece;
}

// ── RELATÓRIO DE BAIXAS — ancorado no ponto da batalha, girando com o globo ──
// Nada de inset:0 nem tela escurecida: o cartão nasce ao lado de onde o combate
// aconteceu (telaDe + rAF, o mesmo truque do painel da frota) e some sozinho.
export function mostrarRelatorioBaixas({ palco, telaDe, coord, venceu, meuNome, iniNome, res, perdasMinhas = [], alvoTipo = 'frota' }) {
  const el = document.createElement('div');
  el.className = 'nrel-flut';
  el.innerHTML = `<div class="nrel-card ${venceu ? 'bom' : 'ruim'}">
    <div class="nrel-cab">${ico('clipboard-list', 13)} RELATÓRIO DE BAIXAS <button class="nrel-x">${ico('x', 13)}</button></div>
    <div class="nrel-vered ${venceu ? 'bom' : 'ruim'}">${venceu ? (alvoTipo === 'frota' ? '⚓ ALVO AFUNDADO' : '🎯 ALVO NEUTRALIZADO') : '☠️ ATAQUE REPELIDO'}</div>
    <div class="nrel-linhas">
      <div class="nrel-l meu"><span>${esc(meuNome)}</span><b>−${res.perdaAtacantePct}%</b>
        <small>${perdasMinhas.length ? perdasMinhas.map((p) => `${p.icone} ${p.perdeu}`).join(' · ') : 'baixas na esquadra'}</small></div>
      <div class="nrel-l ini"><span>${esc(iniNome)}</span><b>−${res.perdaDefensorPct}%</b>
        <small>${venceu ? (alvoTipo === 'frota' ? 'esquadra destruída' : 'defesa arrasada') : 'aguentou o golpe'}</small></div>
    </div>
  </div>`;
  (palco || document.body).appendChild(el);

  let raf = null;
  const fim = () => { if (raf) cancelAnimationFrame(raf); el.remove(); };
  // segue o ponto da batalha; sem telaDe/coord, ancora no canto inferior-esquerdo do palco
  if (telaDe && coord) {
    const seguir = () => {
      const t = telaDe(coord.lat, coord.lng);
      if (t) {
        const w = el.offsetWidth || 300; const h = el.offsetHeight || 170;
        let x = t.x + 26; if (x + w > t.w - 8) x = t.x - w - 26;
        const y = clamp(t.y - h / 2, 8, Math.max(8, t.h - h - 8));
        el.style.left = `${Math.round(clamp(x, 8, Math.max(8, t.w - w - 8)))}px`;
        el.style.top = `${Math.round(y)}px`;
        el.style.opacity = t.frente ? '1' : '0.15';
      }
      raf = requestAnimationFrame(seguir);
    };
    requestAnimationFrame(seguir);
  } else { el.classList.add('canto'); }

  el.querySelector('.nrel-x').addEventListener('click', fim);
  setTimeout(() => { if (el.isConnected) el.classList.add('some'); }, 9000);
  setTimeout(fim, 9800);
  return el;
}
