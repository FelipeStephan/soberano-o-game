// ═══════════════════════════════════════════════════════════════════════
// ALIANÇAS — a mesa onde o jogador funda e comanda o próprio bloco
// ═══════════════════════════════════════════════════════════════════════
// Uma tela, dois estados: se você ainda não fundou nada, é a FORJA (nome, cor,
// regras que acendem o caráter do bloco ao vivo, objetivo). Se já fundou, é o
// COMANDO (membros, convites com a chance de aceite na cara, pendentes/recusados,
// sair/dissolver). A decisão da IA e os bônus moram no motor (jogo/aliancas.js);
// aqui é só apresentação + roleplay (plantão no globo quando algo acontece).
import {
  REGRAS_ALIANCA, OBJETIVOS_ALIANCA, intensidadeDe, caraterDe, ehMilitar, ehEconomica,
  chanceAceite, criarAlianca, convidar, sairAlianca, minhasAliancas, bonusAoEntrar,
} from '../jogo/aliancas.js';
import { PAISES, jogadorIso } from '../dados/paises.js';
import { bandeira, ISO2_DE } from '../dados/imagens.js';
import { aplicarEfeitos } from '../jogo/efeitos.js';
import { dispararBreaking } from './breaking.js';
import { ico } from './icones.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CORES = ['#35e0ff', '#22e0a0', '#ff8c42', '#b98cff', '#ffcc4f', '#ff5a6e'];
const flag = (iso) => (ISO2_DE[iso] ? `<img class="alc-flag" src="${bandeira(ISO2_DE[iso], 40)}" alt="" onerror="this.style.display='none'">` : '');

export function abrirAliancas(jogo, { onFim, globoCtrl } = {}) {
  if (document.querySelector('.alc-modal')) return;
  const estado = jogo.estado;
  const eu = estado.iso || jogadorIso();

  // rascunho da forja (só usado quando ainda não há aliança fundada por mim)
  const rascunho = {
    nome: '', tag: '', cor: CORES[0],
    regras: { defesa_mutua: true, nao_agressao: true },
    objetivo: 'defesa', alvoContencao: null,
  };

  const modal = document.createElement('div');
  modal.className = 'modal-fundo alc-modal';
  document.body.appendChild(modal);
  const fechar = () => { modal.remove(); document.removeEventListener('keydown', tecla); onFim?.(); };
  function tecla(ev) { if (ev.key === 'Escape') fechar(); }
  document.addEventListener('keydown', tecla);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });

  // a aliança que EU fundei (só uma aliança-mãe por jogador, pra clareza)
  const minha = () => minhasAliancas(estado).find((a) => a.fundador === eu) || null;

  function render(flash) {
    const al = minha();
    modal.innerHTML = `<div class="alc-painel">
      <div class="alc-cab">
        <div class="alc-ic">${ico('handshake', 20)}</div>
        <div class="alc-tit"><h2>${al ? esc(al.nome.toUpperCase()) : 'FUNDAR UMA ALIANÇA'}</h2>
          <span>${al ? 'Comando do bloco · ' + caraterDe(al).rot : 'Reúna nações sob a sua bandeira'}</span></div>
        <button class="pp-fechar alc-x">${ico('x', 16)}</button>
      </div>
      ${al ? comando(al) : forja()}
      ${flash ? `<div class="alc-flash ${flash.tom}">${ico(flash.tom === 'bom' ? 'check' : flash.tom === 'ruim' ? 'x' : 'info', 13)} <span>${esc(flash.msg)}</span></div>` : ''}
    </div>`;
    modal.querySelector('.alc-x').addEventListener('click', fechar);
    if (al) ligarComando(al); else ligarForja();
  }

  // ── FORJA (criar) ────────────────────────────────────────────────────
  function forja() {
    const al = { regras: rascunho.regras, membros: [eu] };
    const car = caraterDe(al); const intens = intensidadeDe(al);
    return `<div class="alc-corpo">
      <div class="alc-forja">
        <div class="alc-linha-nome">
          <input class="alc-in nome" id="alc-nome" maxlength="40" placeholder="Nome da aliança (ex.: Pacto do Atlântico)" value="${esc(rascunho.nome)}">
          <input class="alc-in tag" id="alc-tag" maxlength="4" placeholder="TAG" value="${esc(rascunho.tag)}">
        </div>
        <div class="alc-cores">${CORES.map((c) => `<button class="alc-cor ${rascunho.cor === c ? 'on' : ''}" data-cor="${c}" style="--c:${c}"></button>`).join('')}</div>

        <div class="alc-sec">${ico('scroll-text', 11)} REGRAS DO PACTO <span class="alc-hint">cada regra molda o caráter e o peso do bloco</span></div>
        <div class="alc-regras">
          ${Object.entries(REGRAS_ALIANCA).map(([k, r]) => `<button class="alc-regra ${rascunho.regras[k] ? 'on' : ''}" data-regra="${k}">
            <span class="alc-regra-ic">${ico(r.ic, 15)}</span>
            <span class="alc-regra-txt"><b>${esc(r.nome)} <i class="alc-regra-tag">${esc(r.tag)}</i></b><small>${esc(r.desc)}</small></span>
            <i class="alc-regra-ck">${ico('check', 13)}</i>
          </button>`).join('')}
        </div>

        <div class="alc-sec">${ico('crosshair', 11)} OBJETIVO DECLARADO</div>
        <select class="alc-select" id="alc-obj">
          ${Object.entries(OBJETIVOS_ALIANCA).map(([k, o]) => `<option value="${k}" ${rascunho.objetivo === k ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
        </select>
        ${rascunho.objetivo === 'contencao' ? `<select class="alc-select" id="alc-alvo">
          <option value="">— país a conter —</option>
          ${Object.entries(PAISES).filter(([iso]) => iso !== eu).map(([iso, p]) => `<option value="${iso}" ${rascunho.alvoContencao === iso ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}
        </select>` : ''}
      </div>

      <div class="alc-forja-lado">
        <div class="alc-carater" style="--c:${car.cor}">
          <div class="alc-car-ic">${ico(car.ic, 22)}</div>
          <div class="alc-car-rot">${car.rot}</div>
          <div class="alc-car-barra"><i style="width:${intens}%"></i></div>
          <div class="alc-car-int">intensidade ${intens}<small>${intens >= 80 ? 'pacto de ferro' : intens >= 55 ? 'compromisso sério' : intens >= 35 ? 'arranjo firme' : 'entendimento leve'}</small></div>
        </div>
        <ul class="alc-car-efeitos">
          ${ehMilitar(al) ? `<li class="mil">${ico('shield', 12)} Coalizão te defende · desconto de armas</li>` : ''}
          ${ehEconomica(al) ? `<li class="eco">${ico('coins', 12)} Renda de comércio · confiança do mercado</li>` : ''}
          ${!ehMilitar(al) && !ehEconomica(al) ? `<li>${ico('handshake', 12)} Peso diplomático e não-agressão</li>` : ''}
          <li class="pri">${ico('sparkles', 12)} Cada país que entra te dá um salto de força na hora</li>
        </ul>
        <button class="alc-criar" id="alc-criar">${ico('flag', 14)} FUNDAR ALIANÇA</button>
      </div>
    </div>`;
  }

  function ligarForja() {
    const nomeIn = modal.querySelector('#alc-nome');
    const tagIn = modal.querySelector('#alc-tag');
    nomeIn?.addEventListener('input', () => { rascunho.nome = nomeIn.value; });
    tagIn?.addEventListener('input', () => { rascunho.tag = tagIn.value; });
    modal.querySelectorAll('.alc-cor').forEach((b) => b.addEventListener('click', () => { rascunho.cor = b.dataset.cor; render(); }));
    modal.querySelectorAll('.alc-regra').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.regra; rascunho.regras[k] = !rascunho.regras[k];
      // guarda o que o input tem antes de re-renderizar
      rascunho.nome = nomeIn?.value ?? rascunho.nome; rascunho.tag = tagIn?.value ?? rascunho.tag;
      render();
    }));
    modal.querySelector('#alc-obj')?.addEventListener('change', (e) => {
      rascunho.objetivo = e.target.value; rascunho.nome = nomeIn?.value ?? rascunho.nome; rascunho.tag = tagIn?.value ?? rascunho.tag; render();
    });
    modal.querySelector('#alc-alvo')?.addEventListener('change', (e) => { rascunho.alvoContencao = e.target.value || null; });
    modal.querySelector('#alc-criar')?.addEventListener('click', () => {
      const nome = (nomeIn?.value || '').trim();
      if (!nome) { render({ tom: 'ruim', msg: 'Dê um nome à sua aliança.' }); return; }
      if (!Object.values(rascunho.regras).some(Boolean)) { render({ tom: 'ruim', msg: 'Escolha ao menos uma regra — um pacto sem cláusula não é nada.' }); return; }
      rascunho.nome = nome; rascunho.tag = tagIn?.value || '';
      const al = criarAlianca(estado, rascunho);
      // roleplay: plantão + pulso no globo
      const car = caraterDe(al);
      dispararBreaking(jogo, { assunto: `Nasce a ${al.nome}`, contexto: `${jogo.ficha.pais} funda ${car.rot.toLowerCase()} com objetivo de ${OBJETIVOS_ALIANCA[al.objetivo]?.nome?.toLowerCase() || 'cooperação'}.`, tom: 'quente' });
      const c = globoCtrl?.ondeEsta?.(eu); if (c) globoCtrl?.ondaRadar?.(c, { cor: parseInt(al.cor.slice(1), 16), max: 50 });
      globoCtrl?.atualizar?.();
      render({ tom: 'bom', msg: `${al.nome} fundada. Agora convide nações para o bloco.` });
    });
  }

  // ── COMANDO (gerir) ──────────────────────────────────────────────────
  function comando(al) {
    const car = caraterDe(al); const intens = intensidadeDe(al);
    const parceiros = al.membros.filter((m) => m !== eu);
    const convidaveis = Object.entries(PAISES).filter(([iso]) => iso !== eu && !al.membros.includes(iso));
    // ordena os convidáveis pela chance (os mais prováveis no topo)
    const comChance = convidaveis.map(([iso, p]) => ({ iso, p, ...chanceAceite(estado, iso, al) }))
      .sort((a, b) => b.chance - a.chance);
    const recusados = (al.convites || []).filter((c) => c.status === 'recusou');

    return `<div class="alc-corpo alc-comando">
      <div class="alc-com-topo" style="--c:${al.cor}">
        <span class="alc-badge-car">${ico(car.ic, 12)} ${car.rot}</span>
        <span class="alc-com-int">intensidade <b>${intens}</b></span>
        <span class="alc-com-obj">${ico(OBJETIVOS_ALIANCA[al.objetivo]?.ic || 'flag', 11)} ${esc(OBJETIVOS_ALIANCA[al.objetivo]?.nome || '')}${al.alvoContencao ? ` · ${esc(PAISES[al.alvoContencao]?.nome || '')}` : ''}</span>
      </div>

      <div class="alc-membros">
        <div class="alc-sec">${ico('users', 11)} MEMBROS (${al.membros.length})</div>
        <div class="alc-membros-grade">
          ${al.membros.map((iso) => `<div class="alc-membro ${iso === eu ? 'fundador' : ''}">${flag(iso)}<span>${esc(PAISES[iso]?.nome || iso)}</span>${iso === eu ? '<i class="alc-tag-fund">fundador</i>' : ''}</div>`).join('')}
        </div>
      </div>

      <div class="alc-convidar">
        <div class="alc-sec">${ico('user-plus', 11)} CONVIDAR NAÇÕES <span class="alc-hint">a chance vem da relação, do alinhamento e de quem já está dentro</span></div>
        <div class="alc-lista-conv">
          ${comChance.map((x) => {
            const pct = Math.round(x.chance * 100);
            const cls = pct >= 55 ? 'alta' : pct >= 30 ? 'media' : 'baixa';
            return `<div class="alc-conv-item">
              ${flag(x.iso)}
              <span class="alc-conv-nome"><b>${esc(x.p.nome)}</b><small>${esc(x.motivo)}</small></span>
              <span class="alc-conv-chance ${cls}">${pct}%</span>
              <button class="alc-conv-btn" data-iso="${x.iso}">${ico('user-plus', 13)} convidar</button>
            </div>`;
          }).join('')}
        </div>
      </div>

      ${recusados.length ? `<div class="alc-recusados"><div class="alc-sec">${ico('x', 11)} RECUSARAM</div>
        ${recusados.map((c) => `<div class="alc-recusa">${flag(c.iso)} <b>${esc(PAISES[c.iso]?.nome || c.iso)}</b> <small>${esc(c.motivo)}</small></div>`).join('')}</div>` : ''}

      <div class="alc-rodape">
        <button class="alc-sair" id="alc-sair">${ico('log-out', 12)} <span>DISSOLVER A ALIANÇA</span></button>
        <div class="alc-rod-nota">${ico('info', 11)} Você é o fundador — sair dissolve o bloco. Os bônus valem enquanto ele existir.</div>
      </div>
    </div>`;
  }

  function ligarComando(al) {
    modal.querySelectorAll('.alc-conv-btn').forEach((b) => b.addEventListener('click', () => {
      const iso = b.dataset.iso;
      // PAÍS DE UM HUMANO: o convite NÃO é decidido pela IA — vai pela rede e o
      // jogador de lá aceita ou recusa (era isso que "recusava automaticamente").
      if (jogo.ehOnline && jogo._ehHumanoOnline?.(iso)) {
        jogo._relayOnline?.('alianca', iso,
          `${jogo.ficha.presidente || jogo.ficha.pais} convida você para ${al.nome} — ${caraterDe(al).rot}.`,
          { alianca: { id: al.id, nome: al.nome, tag: al.tag, cor: al.cor, fundador: al.fundador, membros: al.membros, regras: al.regras, objetivo: al.objetivo } });
        const nomeH = PAISES[iso]?.nome || iso;
        render({ tom: 'bom', msg: `Convite enviado a ${nomeH}. Aguardando a resposta do presidente de lá…` });
        return;
      }
      const r = convidar(estado, al.id, iso);
      if (r.erro) { render({ tom: 'ruim', msg: r.erro }); return; }
      const nome = PAISES[iso]?.nome || iso;
      const c = globoCtrl?.ondeEsta?.(iso);
      if (r.aceito) {
        if (r.bonus) aplicarEfeitos(estado, r.bonus);   // o salto de força de RPG
        const ganho = r.bonus?.poder_militar ? `+${r.bonus.poder_militar} poder militar` : r.bonus?.temp_economia ? `mercado mais confiante` : 'prestígio';
        dispararBreaking(jogo, { assunto: `${nome} entra na ${al.nome}`, contexto: `${nome} aceita o convite e se junta ao bloco de ${jogo.ficha.pais}. ${ganho}.`, tom: 'quente', iso });
        if (c) globoCtrl?.ondaRadar?.(c, { cor: parseInt(al.cor.slice(1), 16), max: 45 });
        if (c) globoCtrl?.desenharLinha?.(c, 'foco', 4000, globoCtrl?.ondeEsta?.(eu));
        render({ tom: 'bom', msg: `${nome} entrou! ${ganho ? ganho.charAt(0).toUpperCase() + ganho.slice(1) : ''}.` });
      } else {
        dispararBreaking(jogo, { assunto: `${nome} recusa a ${al.nome}`, contexto: `${nome} declina o convite: ${r.motivo}.`, tom: 'frio', iso });
        if (c) globoCtrl?.ondaRadar?.(c, { cor: 0xff5a6e, max: 30 });
        render({ tom: 'ruim', msg: `${nome} recusou: ${r.motivo}.` });
      }
      globoCtrl?.atualizar?.();
    }));
    modal.querySelector('#alc-sair')?.addEventListener('click', () => {
      const r = sairAlianca(estado, al.id);
      globoCtrl?.atualizar?.();
      jogo._empilharFeed?.([{ tipo: 'sistema', handle: '⚙ Chancelaria', cor: '#ff8c42', texto: `A ${al.nome} foi dissolvida.` }]);
      render({ tom: 'info', msg: `${r.nome} dissolvida.` });
    });
  }

  render();
}
