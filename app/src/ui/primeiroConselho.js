// ═══════════════════════════════════════════════════════════════════════
// O PRIMEIRO CONSELHO DE MINISTROS — o tutorial que não parece tutorial
// ═══════════════════════════════════════════════════════════════════════
// Fase 3 de ENREDO-E-CAMPANHA.md, Cena 4. A instrução do documento era explícita:
// "não fazer tutorial separado — ninguém lê. A história É o tutorial."
//
// Então o gabinete apresenta TRÊS DECISÕES OBRIGATÓRIAS, uma por vez, e cada uma
// existe por dois motivos ao mesmo tempo:
//   • ela é uma jogada de verdade, com efeito real no estado, irreversível;
//   • ela apresenta uma ferramenta da cabine — e, no fim, ACENDE essa ferramenta na
//     tela, para o jogador saber onde ela mora a partir de agora.
//
// ── POR QUE ACENDER É MELHOR QUE EXPLICAR ─────────────────────────────
// A alternativa clássica é o overlay de setas com "clique aqui". Recusei por dois
// motivos práticos: ele obriga o jogador a executar um clique que ele não quer dar
// (e trava o jogo até ele dar), e envelhece mal — qualquer mudança de layout deixa a
// seta apontando para o vazio. Aqui a decisão é tomada no cartão, e o holofote só
// diz "isto que você acabou de fazer mora ali". Se o botão mudar de lugar, o holofote
// segue: ele lê a posição real do elemento no momento em que acende.
//
// ── POR QUE AS ESCOLHAS SÃO REAIS ─────────────────────────────────────
// Decisão de tutorial sem consequência ensina a coisa errada: ensina que decidir não
// importa. As seis opções aqui mexem em aprovação, estabilidade, caixa, segurança e
// soft power de verdade, e duas partidas que escolhem diferente NÃO começam iguais.
// É o mesmo princípio da Doutrina: a primeira jogada já é jogada.
import { ico } from './icones.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { tocarEfeito } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── AS TRÊS DECISÕES ──────────────────────────────────────────────────
// Genéricas de propósito: elas precisam fazer sentido governando a Noruega ou o
// Paquistão. O que muda entre partidas é o EFEITO (que incide sobre os números
// herdados daquele país), não o texto.
//
// `ensina` é o par (seletor, frase) do holofote. Os seletores são de elementos que
// existem na cabine desde o primeiro render — se algum sumir, o holofote simplesmente
// não acende e o resto continua.
const DECISOES = [
  {
    id: 'tropa',
    quem: 'O ESTADO-MAIOR',
    ic: 'shield',
    cor: 'var(--perigo)',
    titulo: 'O EXÉRCITO QUE VOCÊ HERDOU',
    texto: 'As tropas estão onde o governo anterior deixou: espalhadas, cobrindo tudo e protegendo nada. '
      + 'O comando quer uma ordem antes do fim da semana — e vai obedecer qualquer uma das duas.',
    opcoes: [
      {
        rot: 'CONCENTRAR NAS FRONTEIRAS',
        sub: 'Fecha o perímetro. As capitais do interior ficam com menos gente na rua.',
        efeitos: { seguranca: 6, poder_militar: 3, aprovacao: -3 },
        eco: 'O comando concentrou as divisões nas fronteiras. Quem mora longe delas percebeu na mesma noite.',
      },
      {
        rot: 'MANTER DISTRIBUÍDO',
        sub: 'Presença em todo o território. Ninguém se sente abandonado — e ninguém está realmente defendido.',
        efeitos: { aprovacao: 5, estabilidade: 3, seguranca: -3 },
        eco: 'O governo manteve a tropa espalhada pelo país inteiro. Popular por dentro, frágil por fora.',
      },
    ],
    ensina: { alvo: '#btn-teatro', frase: 'Onde a guerra começa: o mapa se abre em estados e cada clique vira um alvo.' },
  },
  {
    id: 'caixa',
    quem: 'A FAZENDA',
    ic: 'banknote',
    cor: 'var(--ambar)',
    titulo: 'O PRIMEIRO CHEQUE',
    texto: 'Existe uma folga no orçamento deste ano — uma só. Ela some se não for usada, e o ministro '
      + 'avisa que qualquer decisão daqui em diante leva TEMPO para sair do papel.',
    opcoes: [
      {
        rot: 'INVESTIR NA INDÚSTRIA',
        sub: 'Cresce o PIB e a capacidade de produzir. O caixa fica curto por um tempo.',
        efeitos: { pib: 0.6, capacidade_ind: 5, tesouro: -0.4 },
        eco: 'O governo abriu crédito para a indústria. A conta chega antes do resultado, como sempre.',
      },
      {
        rot: 'SEGURAR O CAIXA',
        sub: 'Reserva no cofre para o que vier. Nada de novo é construído.',
        efeitos: { tesouro: 0.5, estabilidade: 4, aprovacao: -2 },
        eco: 'O governo optou por reserva. Prudente, dizem uns; parado, dizem os outros.',
      },
    ],
    ensina: { alvo: '#acoes', frase: 'A fila de comando: toda ordem custa dinheiro E tempo. O mundo não espera a fila esvaziar.' },
  },
  {
    id: 'vizinho',
    quem: 'O ITAMARATY',
    ic: 'handshake',
    cor: 'var(--cyan)',
    titulo: 'O TELEFONE TOCOU',
    texto: 'Uma potência vizinha quer abrir um canal direto com o seu governo, logo na primeira semana. '
      + 'Não é um pacto: é uma conversa. Mas toda conversa cria expectativa dos dois lados.',
    opcoes: [
      {
        rot: 'ATENDER',
        sub: 'O mundo registra que você fala. E passa a esperar que você fale sempre.',
        efeitos: { soft_power: 6, estabilidade: -2 },
        eco: 'A chancelaria abriu canal direto com a vizinhança. O gesto foi notado — e cobrado desde então.',
      },
      {
        rot: 'ADIAR',
        sub: 'Primeiro a casa. O recado é claro: este governo não vai ser conduzido de fora.',
        efeitos: { estabilidade: 5, aprovacao: 3, soft_power: -4 },
        eco: 'O governo adiou o contato e sinalizou prioridade interna. Lá fora, anotaram.',
      },
    ],
    ensina: { alvo: '#btn-blocos', frase: 'O tabuleiro das alianças: é aqui que um bloco nasce, e onde você vê quem já tem o seu.' },
  },
];

// ── O HOLOFOTE ────────────────────────────────────────────────────────
// Lê a posição REAL do elemento no instante em que acende — por isso sobrevive a
// mudanças de layout, a HUD recolhida e a telas de tamanhos diferentes. Se o alvo
// não existir (ou estiver escondido), nada acontece e a sequência segue: um tutorial
// nunca pode ser o motivo de o jogo travar.
function acender(seletor, frase, aoFim) {
  const alvo = document.querySelector(seletor);
  const r = alvo?.getBoundingClientRect?.();
  if (!r || r.width < 4 || r.height < 4) { aoFim?.(); return; }
  const pad = 8;
  const el = document.createElement('div');
  el.className = 'pc-holo';
  el.innerHTML = `
    <div class="pc-anel" style="left:${r.left - pad}px; top:${r.top - pad}px; width:${r.width + pad * 2}px; height:${r.height + pad * 2}px"></div>
    <div class="pc-dica" style="left:${Math.max(12, Math.min(window.innerWidth - 330, r.left + r.width / 2 - 160))}px;
      top:${r.top > window.innerHeight / 2 ? r.top - 96 : r.top + r.height + 14}px">
      ${ico('mouse-pointer-click', 13)}<span>${esc(frase)}</span>
    </div>`;
  document.body.appendChild(el);
  const sair = () => { el.classList.add('saindo'); setTimeout(() => { el.remove(); aoFim?.(); }, 320); };
  el.addEventListener('click', sair);          // clicar em qualquer lugar pula o holofote
  setTimeout(sair, 3600);
}

// ── A SEQUÊNCIA ───────────────────────────────────────────────────────
// Devolve um cancelador. `aoFim` é chamado depois da terceira decisão — é ele que
// encadeia o Mandato I (Cena 5) em ui/jogo.js.
export function abrirPrimeiroConselho(jogo, { onFim, onDecidiu } = {}) {
  if (document.querySelector('.pc-over')) { onFim?.(); return () => {}; }
  let i = 0;
  let cancelado = false;

  const over = document.createElement('div');
  over.className = 'pc-over';
  over.setAttribute('role', 'dialog');
  document.body.appendChild(over);

  function pintar() {
    const d = DECISOES[i];
    over.innerHTML = `
      <div class="pc-card" style="--cd:${esc(d.cor)}">
        <div class="pc-cab">
          <div class="pc-ic">${ico(d.ic, 22)}</div>
          <div class="pc-cab-txt">
            <span class="pc-k">PRIMEIRO CONSELHO DE MINISTROS · ${i + 1} DE ${DECISOES.length}</span>
            <b>${esc(d.quem)}</b>
          </div>
          <div class="pc-passos">${DECISOES.map((_, k) => `<i class="${k < i ? 'visto' : k === i ? 'on' : ''}"></i>`).join('')}</div>
        </div>
        <h2 class="pc-tit">${esc(d.titulo)}</h2>
        <p class="pc-txt">${esc(d.texto)}</p>
        <div class="pc-opcoes">
          ${d.opcoes.map((o, k) => `
            <button class="pc-op" data-k="${k}">
              <b>${esc(o.rot)}</b>
              <span>${esc(o.sub)}</span>
              <div class="pc-efeitos">${efeitosHTML(o.efeitos)}</div>
            </button>`).join('')}
        </div>
        <div class="pc-nota">${ico('lock', 11)} Não há como voltar atrás. É a sua primeira jogada de verdade.</div>
      </div>`;

    over.querySelectorAll('.pc-op').forEach((b) => b.addEventListener('click', () => escolher(d, Number(b.dataset.k))));
  }

  function escolher(d, k) {
    const o = d.opcoes[k];
    if (!o) return;
    try { tocarEfeito('click', { volume: 0.5 }); } catch { /* sem áudio */ }
    try { aplicarEfeitos(jogo.estado, o.efeitos); } catch { /* a decisão vale mesmo sem o efeito entrar */ }
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: `⚙ ${d.quem}`, cor: '#8ea4c4', texto: o.eco }]);
    onDecidiu?.();

    // O cartão SOME antes do holofote acender. Acender por baixo de um modal seria
    // apontar para um botão que o jogador não pode nem ver.
    over.classList.add('escondido');
    acender(d.ensina.alvo, d.ensina.frase, () => {
      if (cancelado) return;
      i += 1;
      if (i >= DECISOES.length) { encerrar(); return; }
      over.classList.remove('escondido');
      pintar();
    });
  }

  function encerrar() {
    over.classList.add('saindo');
    setTimeout(() => over.remove(), 300);
    onFim?.();
  }

  pintar();
  return () => { cancelado = true; over.remove(); document.querySelector('.pc-holo')?.remove(); };
}

// Os efeitos aparecem NO BOTÃO, antes do clique. É a diferença entre uma escolha e um
// chute — e o jogo inteiro já mostra impacto antes de agir; a primeira decisão dele
// não podia ser a exceção.
const ROT = {
  aprovacao: 'Aprovação', estabilidade: 'Estabilidade', seguranca: 'Segurança',
  poder_militar: 'Militar', soft_power: 'Soft power', tesouro: 'Caixa',
  pib: 'PIB', capacidade_ind: 'Indústria',
};
function efeitosHTML(ef) {
  return Object.entries(ef || {}).map(([k, v]) => {
    const n = k === 'tesouro' || k === 'pib' ? `${v > 0 ? '+' : ''}${v} tri` : `${v > 0 ? '+' : ''}${v}`;
    return `<span class="pc-ef ${v >= 0 ? 'bom' : 'ruim'}">${esc(ROT[k] || k)} <b>${n}</b></span>`;
  }).join('');
}
