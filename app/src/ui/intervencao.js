// ═══════════════════════════════════════════════════════════════════════
// INTERVENÇÃO — mexer no que acontece no resto do mundo
// ═══════════════════════════════════════════════════════════════════════
// Clicar num conflito (Rússia×Ucrânia) ou numa pandemia abre isto. Você não é só
// espectador do Mundo Vivo — pode enviar ajuda, propor mediação, apoiar um lado, ou
// mandar pesquisa. O impacto é SUTIL e de RPG: mexe no seu soft_power, aprovação e
// relações, custa um pouco de caixa, e às vezes muda o próprio conflito/pandemia.
import { ico } from './icones.js';
import { PAISES } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { dinheiro } from '../jogo/formato.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { FRENTES, chanceTentativa, podeTentar, metaDe } from '../jogo/intervencaoConflito.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const relKey = (iso) => PAISES[iso]?.rel || `rel_${String(iso).toLowerCase()}`;
const pct = (v) => `${Math.round(v * 100)}%`;

export function abrirIntervencao(dados, jogo, { onFim, globoCtrl, tr } = {}) {
  if (document.querySelector('.intv-modal')) return;
  const e = jogo.estado;
  const modal = document.createElement('div');
  modal.className = 'modal-fundo intv-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); onFim?.(); };
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  // As opções, por tipo. Cada uma é { rot, desc, ic, custo, efeitos, mundo } — `mundo`
  // é o efeito no próprio conflito/pandemia (reduz intensidade, contém etc.).
  const opcoes = dados.tipo === 'conflito' ? opcoesConflito(dados) : opcoesPandemia(dados);

  function corpo() {
    if (dados.tipo === 'conflito') {
      const med = dados.ref?.mediacao;
      const p = med ? Math.min(100, (med.pontos / med.meta) * 100) : 0;
      return `<div class="intv-alvo conflito">
        <img src="${bandeira(ISO2_DE[dados.a], 40) || ''}" onerror="this.style.display='none'">
        <div><b>${esc(dados.nomeA)} × ${esc(dados.nomeB)}</b><span>Guerra por ${esc(dados.tema)} · intensidade ${Math.round(dados.ref?.intensidade ?? dados.intensidade)}/100</span></div>
        <img src="${bandeira(ISO2_DE[dados.b], 40) || ''}" onerror="this.style.display='none'">
      </div>
      ${med ? `<div class="intv-paz"><div class="intv-paz-rot">${ico('handshake', 12)} RUMO AO CESSAR-FOGO <b>${med.pontos}/${med.meta}</b></div>
        <div class="intv-paz-barra"><div style="width:${p}%"></div></div></div>` : ''}`;
    }
    return `<div class="intv-alvo pandemia">
      <span class="intv-bio">${ico('biohazard', 20)}</span>
      <div><b>${esc(dados.nome)}</b><span>Patógeno ${esc(dados.patogeno)} · ${dados.paises} país(es) · fase ${esc(dados.fase)}</span></div>
    </div>`;
  }

  function render() {
    modal.innerHTML = `<div class="intv-painel ${dados.tipo}">
      <div class="intv-cab">
        <div class="intv-ic">${ico(dados.tipo === 'conflito' ? 'swords' : 'biohazard', 20)}</div>
        <div class="intv-tit"><h2>${dados.tipo === 'conflito' ? 'INTERVIR NO CONFLITO' : 'RESPOSTA À PANDEMIA'}</h2>
          <span>Você tem <b>${dinheiro(e.tesouro)}</b> em caixa</span></div>
        <button class="pp-fechar intv-x">${ico('x', 16)}</button>
      </div>
      ${corpo()}
      <div class="intv-ops">
        ${opcoes.map((o, i) => `<button class="intv-op ${o.enfileira ? 'frente' : ''}" data-i="${i}" ${(o.custo > e.tesouro || o.bloqueio) ? 'disabled' : ''}>
          <div class="iop-ic">${ico(o.ic, 17)}</div>
          <div class="iop-txt"><b>${esc(o.rot)}</b><span>${esc(o.desc)}</span></div>
          <div class="iop-custo">${o.custo > 0 ? dinheiro(o.custo) : 'grátis'}${o.enfileira ? `<i class="iop-t">${ico('clock', 9)} ${o.tempo}s</i>` : ''}</div>
        </button>`).join('')}
      </div>
    </div>`;
    modal.querySelector('.intv-x').addEventListener('click', fechar);
    modal.querySelectorAll('.intv-op').forEach((b) => b.addEventListener('click', () => aplicar(opcoes[Number(b.dataset.i)])));
  }

  function aplicar(op) {
    // FRENTE DE MEDIAÇÃO: não resolve na hora — vira uma ordem na fila do tempo real que
    // acumula pontos até o cessar-fogo.
    if (op.enfileira) {
      if (op.bloqueio) return;
      const c = dados.ref;
      const acao = {
        id: `med_${op.frente}_${c.id}_${Date.now()}`, nome: `${op.rot} — ${dados.nomeA}×${dados.nomeB}`,
        icone: '🕊️', categoria: 'Diplomacia', custo: op.custo, custoPA: op.custoPA || 1, tempo: op.tempo, prob: 1,
        _conflitoId: c.id, _frente: op.frente,
      };
      const r = tr?.enfileirar(acao);
      if (r && !r.ok) return;
      modal.querySelector('.intv-painel').innerHTML = `<div class="intv-feito">
        <div class="intv-ok">${ico('clock', 30)}</div>
        <h2>ORDEM ENFILEIRADA</h2>
        <p>${esc(op.rot)} está a caminho — o resultado chega em ${op.tempo}s na fila de comando. Cada avanço aproxima o cessar-fogo.</p>
        <button class="dist-aplicar" id="intv-fim">${ico('check', 15)} PRONTO</button>
      </div>`;
      modal.querySelector('#intv-fim').addEventListener('click', fechar);
      return;
    }
    if (op.custo > e.tesouro) return;
    if (op.custo) e.tesouro = Math.round((e.tesouro - op.custo) * 100) / 100;
    const mud = aplicarEfeitos(e, op.efeitos || {});
    op.mundo?.();                       // efeito no conflito/pandemia em si
    globoCtrl?.atualizar?.();
    jogo._empilharFeed?.([{ tipo: 'sistema', handle: dados.tipo === 'conflito' ? 'Diplomacia' : 'Saúde global',
      cor: dados.tipo === 'conflito' ? '#35e0ff' : '#b98cff', texto: op.manchete }]);

    modal.querySelector('.intv-painel').innerHTML = `<div class="intv-feito">
      <div class="intv-ok">${ico('check-circle', 30)}</div>
      <h2>${esc(op.rotFeito || 'FEITO')}</h2>
      <p>${esc(op.resultado)}</p>
      <button class="dist-aplicar" id="intv-fim">${ico('check', 15)} PRONTO</button>
    </div>`;
    modal.querySelector('#intv-fim').addEventListener('click', fechar);
  }

  // ── conjuntos de opções ──
  function opcoesConflito(d) {
    const c = d.ref;
    if (c && !c.id) c.id = `cf_${d.a || ''}${d.b || ''}${jogo.estado.turno || 0}`;
    if (c && !c.mediacao) c.mediacao = { pontos: 0, meta: metaDe(c), tentativas: 0 };
    // As 3 FRENTES de mediação — custam TEMPO (fila) e ACUMULAM pontos até o cessar-fogo.
    const frentes = Object.entries(FRENTES).map(([id, f]) => {
      const chk = podeTentar(jogo.estado, id);
      const chance = c ? chanceTentativa(jogo.estado, c, id) : 0;
      return {
        rot: f.nome, ic: f.ic, custo: f.custo, enfileira: true, frente: id, tempo: f.tempo, custoPA: f.custoPA,
        chance, bloqueio: chk.ok ? '' : chk.motivo,
        desc: `Chance de progredir ${pct(chance)} · ${f.tempo}s na fila${chk.ok ? '' : ` · ${chk.motivo}`}`,
      };
    });
    return [
      { rot: 'Ajuda humanitária', ic: 'heart-handshake', custo: 0.15,
        desc: 'Corredores, comida, remédio pros dois lados. O mundo vê e aplaude.',
        efeitos: { soft_power: 6, aprovacao: 3, [relKey(d.a)]: 4, [relKey(d.b)]: 4 },
        manchete: `${meu()} envia ajuda humanitária à guerra ${esc(d.nomeA)}×${esc(d.nomeB)}. Gesto pequeno no campo, grande na tribuna.`,
        rotFeito: 'AJUDA A CAMINHO', resultado: 'Sua influência subiu e os dois lados registraram o gesto. É o tipo de crédito que se cobra depois.' },
      ...frentes,
      { rot: `Apoiar ${d.nomeA}`, ic: 'flag', custo: 0.2,
        desc: `Armas e verba pro lado de ${d.nomeA}. Ganha um aliado, ganha um inimigo.`,
        efeitos: { [relKey(d.a)]: 18, [relKey(d.b)]: -22, temp_guerra: 4, soft_power: -5 },
        manchete: `${meu()} escolhe lado na guerra ${esc(d.nomeA)}×${esc(d.nomeB)}: apoio aberto a ${esc(d.nomeA)}. ${esc(d.nomeB)} promete "consequências".`,
        rotFeito: 'LADO ESCOLHIDO', resultado: `${esc(d.nomeA)} agora é próximo de você. ${esc(d.nomeB)}, nem tanto — e não vai esquecer.` },
      { rot: `Apoiar ${d.nomeB}`, ic: 'flag', custo: 0.2,
        desc: `Armas e verba pro lado de ${d.nomeB}. Ganha um aliado, ganha um inimigo.`,
        efeitos: { [relKey(d.b)]: 18, [relKey(d.a)]: -22, temp_guerra: 4, soft_power: -5 },
        manchete: `${meu()} escolhe lado na guerra ${esc(d.nomeA)}×${esc(d.nomeB)}: apoio aberto a ${esc(d.nomeB)}. ${esc(d.nomeA)} promete "consequências".`,
        rotFeito: 'LADO ESCOLHIDO', resultado: `${esc(d.nomeB)} agora é próximo de você. ${esc(d.nomeA)}, nem tanto — e não vai esquecer.` },
    ];
  }

  function opcoesPandemia(d) {
    const pd = d.ref;
    return [
      { rot: 'Enviar recursos médicos', ic: 'cross', custo: 0.2,
        desc: 'Hospitais de campanha, insumos, equipe. Contém o avanço e salva vidas.',
        efeitos: { soft_power: 7, aprovacao: 4 },
        mundo: () => { if (pd && pd.paises?.length > 1 && Math.random() < 0.5) pd.paises.pop(); },
        manchete: `${meu()} manda força-tarefa médica contra ${esc(d.nome)}. A curva num país já começou a ceder.`,
        rotFeito: 'RECURSOS ENVIADOS', resultado: 'Sua ajuda conteve o avanço em pelo menos uma frente. Aprovação e prestígio subiram.' },
      { rot: 'Financiar a pesquisa', ic: 'flask-conical', custo: 0.35,
        desc: 'Dinheiro na vacina/tratamento. Caro, mas acelera o fim — e o crédito é seu.',
        efeitos: { soft_power: 10, aprovacao: 5, inteligencia: 3 },
        mundo: () => { if (pd) { const ordem = ['surgindo', 'espalhando', 'pico', 'declínio', 'contida']; const i = ordem.indexOf(pd.fase); if (i >= 0 && i < ordem.length - 1) pd.fase = ordem[Math.min(ordem.length - 1, i + 1)]; } },
        manchete: `Laboratórios financiados por ${meu()} anunciam avanço contra ${esc(d.nome)}. O mundo respira — e sabe quem pagou a conta.`,
        rotFeito: 'CIÊNCIA FINANCIADA', resultado: 'A pesquisa avançou uma fase rumo à contenção. Sua influência e inteligência agradecem.' },
    ];
  }

  function meu() { return PAISES[e.iso]?.nome || 'Nossa nação'; }
  render();
}
