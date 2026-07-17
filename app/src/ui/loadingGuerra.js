// ═══════════════════════════════════════════════════════════════════════
// LOADING DE OFENSIVA — o mapa é o palco, não o modal
// ═══════════════════════════════════════════════════════════════════════
// O pedido: "um loading para eu visualizar os ataques no mapa sem a tela de ataque
// em curso ocupando a animação", com status "saindo do país atingido".
//
// ── AS TRÊS CORREÇÕES DESTA VERSÃO ───────────────────────────────────
// 1. TEMPO. Era 8s: os despachos apareciam um atrás do outro e a cena piscava.
//    Agora são ~58s, com intervalo de noticiário entre cada um. A ofensiva respira.
//
// 2. PESO VISUAL. Os balões eram caixas preenchidas que tapavam a animação — o
//    oposto do objetivo. Agora são translúcidos, sem fundo sólido, com borda só de
//    um lado. Você lê e continua vendo o caça passar por trás.
//
// 3. IA EM LOTE. Uma chamada no segundo zero traz os 9 despachos de uma vez
//    (ver maquina/despachos.js). A cena consome no ritmo dela, sem tocar na rede
//    de novo. Zero risco de travar no meio esperando a IA.
import { gerarDespachos, despachosLocais, reacoesLocais } from '../maquina/despachos.js';
import { temChave } from '../config.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function rodarLoading({
  globo, coord, iso, nome, deploy, venceu, petro, dur = 58000,
  atacante = 'Nossa nação', presidente = 'O presidente', reagentes = [],
}) {
  // O fallback local já nasce pronto. Se a IA vier, ela SUBSTITUI — e a cena nunca
  // fica esperando: os primeiros despachos já estão rodando enquanto ela responde.
  let fila = despachosLocais({ alvoIso: iso, alvoNome: nome, deploy, venceu, petro });
  let reacoes = reacoesLocais(reagentes);
  let fonteIA = false;

  if (temChave()) {
    gerarDespachos({ atacante, alvoIso: iso, alvoNome: nome, deploy, venceu, presidente, reagentes })
      .then((r) => {
        if (r?.despachos?.length) {
          // Troca só o que ainda não foi mostrado — o que já apareceu, apareceu.
          fila = r.despachos;
          if (r.reacoes?.length) reacoes = r.reacoes;
          fonteIA = true;
          const b = document.querySelector('.lg-fonte');
          if (b) { b.textContent = 'IA'; b.classList.add('ia'); }
        }
      })
      .catch(() => {});
  }

  const barra = document.createElement('div');
  barra.className = 'lg-barra';
  barra.innerHTML = `
    <div class="lg-cab">
      <span class="lg-pulso"></span>
      <b>OFENSIVA EM CURSO</b>
      <span class="lg-alvo">${ico('crosshair', 12)} ${esc(nome)}</span>
      <span class="lg-fonte ${temChave() ? '' : 'local'}">${temChave() ? '···' : 'LOCAL'}</span>
      <span class="lg-dica">${ico('move', 11)} arraste o globo — acompanhe de qualquer ângulo</span>
      <button class="lg-pular" id="lg-pular" title="Pular para o resultado">${ico('chevrons-right', 13)} pular</button>
    </div>
    <div class="lg-trilho"><div class="lg-fill" style="animation-duration:${dur}ms"></div></div>`;
  document.body.appendChild(barra);

  // Botão de pular: 58s é a duração CERTA pra quem quer ver. Quem já viu dez vezes
  // precisa poder sair. Prender o jogador na sua cena é desrespeito com o tempo dele.
  let pulado = false;
  barra.querySelector('#lg-pular').addEventListener('click', () => { pulado = true; });

  const n = 9;
  const passo = dur / (n + 1);
  for (let i = 0; i < n; i += 1) {
    if (pulado) break;
    // Espera em fatias pra o "pular" responder na hora, não só no fim do intervalo.
    for (let w = 0; w < passo && !pulado; w += 120) await espera(120);
    if (pulado) break;
    const d = fila[i % fila.length];
    if (d) globo?.balao?.(coord, d.txt, d.tom);
    // A cada 3 despachos do alvo, UMA reação do mundo — do território de quem reage.
    // Intercalar (e não despejar) mantém a cena legível: alvo fala, mundo responde.
    if (i >= 2 && i % 3 === 2 && reacoes.length) {
      const rx = reacoes.shift();
      const onde = globo?.ondeEsta?.(rx.iso);
      if (onde) globo?.balao?.(onde, rx.txt, rx.tom || 'aviso');
    }
  }

  if (!pulado) await espera(passo);
  barra.classList.add('saindo');
  await espera(400);
  barra.remove();
  return { fonteIA, pulado };
}
