# SOBERANO — Biblioteca de Componentes

> Documento de referência para recriar a interface do SOBERANO em outra ferramenta.
> Extraído do código real em `app/src/` — nada aqui é aspiracional, tudo está implementado.
>
> **Anexe junto o arquivo `app/src/estilo.css`** (2.209 linhas, 739 classes). Ele é a fonte
> da verdade do CSS; este documento dá a estrutura HTML, o propósito e as variantes que o
> CSS sozinho não conta.

---

## 1. A gramática visual

O SOBERANO é um **centro de comando**, não um dashboard. Três decisões governam tudo:

1. **O fundo é quase preto e o conteúdo flutua.** Painéis são vidro escuro sobre um globo 3D vivo — `backdrop-filter: blur()` em vez de superfícies opacas. O mapa nunca some; ele é o palco.
2. **A cor é semântica, nunca decorativa.** Cinco cores e cada uma tem um único significado. Se algo é ciano, é seu ou é informação. Se é vermelho, é perigo ou perda. Um card não fica âmbar "porque ficou bonito".
3. **Tipografia com três vozes.** Display condensado para números e títulos (autoridade), mono para rótulos técnicos e dados (precisão), sans para prosa (a narrativa da Máquina).

---

## 2. Tokens

### Cores

```css
:root {
  /* superfícies — do mais fundo ao mais próximo */
  --bg: #05070d;             /* o vazio atrás de tudo */
  --bg-2: #0a1120;           /* fundo elevado */
  --painel: #0c1524cc;       /* painel de vidro (note o alpha cc) */
  --painel-solido: #0c1524;  /* painel sem transparência: modais */
  --painel-2: #111e33;       /* superfície interna, um degrau acima */
  --borda: #1c3350;          /* borda padrão, discreta */
  --borda-viva: #35e0ff44;   /* borda de foco/ativo */

  /* texto */
  --texto: #dfe8ff;          /* corpo — branco azulado, nunca #fff puro */
  --fraco: #7488ad;          /* rótulos, legendas, o que não disputa atenção */

  /* semântica — cada cor tem UM significado */
  --cyan:   #35e0ff;   /* VOCÊ / informação / seleção */
  --ambar:  #ffb020;   /* atenção / dinheiro / conquista / nuclear armado */
  --verde:  #22e0a0;   /* bom / defesa / aliado / ganho */
  --perigo: #ff3b5c;   /* guerra / perda / crise / morte */
  --roxo:   #b98cff;   /* pandemia / soft power / o estranho */

  /* aliases */
  --acento: var(--cyan);
  --acento-2: var(--ambar);
  --ok: var(--verde);

  /* profundidade */
  --sombra: 0 10px 40px rgba(0,0,0,.55);
  --glow: 0 0 20px rgba(53,224,255,.25);
}
```

**Regra de uso das cores semânticas** — a mesma cor significa a mesma coisa em qualquer tela:

| Cor | Significa | Aparece em |
|---|---|---|
| Ciano | seu território, sua nação, seleção, informação neutra | país do jogador, estado selecionado, tooltips, defesa |
| Âmbar | dinheiro, atenção, território conquistado, sistema armado | tesouro, alertas, botão nuclear, crise fiscal |
| Verde | bom, ganho, tropa defendendo, aliado | deltas positivos, guarnição própria, relação alta |
| Vermelho | guerra, perda, crise, ameaça | conflito, território perdido, tropa inimiga, MAD |
| Roxo | pandemia, soft power, o fora-de-categoria | anéis de pandemia, medidor de influência |

### Tipografia

```html
<!-- no <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

```css
:root {
  --disp: 'Rajdhani', system-ui, sans-serif;        /* números grandes, títulos, botões */
  --mono: 'IBM Plex Mono', monospace;               /* rótulos, siglas, dados técnicos */
  --corpo: 'IBM Plex Sans', system-ui, sans-serif;  /* prosa, narrativa, descrições */
}
```

**Padrão de rótulo técnico** — aparece em toda a interface, é a assinatura visual do jogo:

```css
.rotulo-tecnico {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .16em;   /* o tracking largo é o que dá o ar de terminal militar */
  text-transform: uppercase;
  color: var(--fraco);
}
```

**Padrão de número de destaque:**

```css
.numero-destaque {
  font-family: var(--disp);
  font-size: 21px;         /* 17-24px conforme a hierarquia */
  font-weight: 700;
}
```

### Raios, espaçamento e movimento

```css
/* Raios: 4px em superfícies grandes, 6-9px em componentes, 20px em pílulas */
--raio-painel: 12px;
--raio-card: 8px;
--raio-pilula: 20px;

/* Movimento: rápido e curto. Nada de easing dramático em UI. */
transition: border-color .15s, transform .1s;
animation: subir .3s ease;     /* entrada de modal */
animation: entrar .12s ease;   /* entrada de tooltip */
```

### Ícones

Biblioteca **Lucide** (`import { icons } from 'lucide'`), renderizada como SVG inline
para herdar `currentColor`. Nada de emoji em UI de sistema — emoji só aparece como
fallback de foto de equipamento.

```js
// ico('swords', 18) → string SVG pronta
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
  stroke-linejoin="round" class="ico">…</svg>`;
```

Vocabulário fixo de ícones: `swords` (militar), `radiation` (arsenal/nuclear), `eye`
(inteligência), `banknote` (economia), `handshake` (diplomacia), `flask-conical` (ciência),
`radio` (mídia), `fuel` (petróleo), `shield` (defesa), `brain` (conselheiro),
`heart-handshake` (ajuda), `trending-down` (crise fiscal).

---

## 3. Animações (`@keyframes`)

O sistema tem 36 keyframes. As reutilizáveis:

```css
@keyframes subir   { from { opacity:0; transform: translateY(14px); } }  /* modais */
@keyframes entrar  { from { opacity:0; } }                               /* tooltips */
@keyframes surgir  { from { opacity:0; transform: translateY(8px); } }   /* blocos da HUD */
@keyframes piscar  { 50% { opacity: .35; } }                             /* alerta crítico (steps(2)) */
@keyframes pop     { 50% { transform: scale(1.15); } }                   /* feedback de valor */
@keyframes marcaIn { from { opacity:0; transform: scale(.5); } }         /* marcador no mapa */
@keyframes pulsoRadar { to { transform: scale(2.4); opacity: 0; } }      /* anel de radar */
@keyframes tremor  { 25% { transform: translate(2px,-1px); } 75% { transform: translate(-2px,1px); } }
```

Uso de `piscar`: sempre com `steps(2)` — pisca duro, como LED de alarme, não respira.
`animation: piscar 1.2s steps(2) infinite;`

---

## 4. Padrão de modal

Todos os modais compartilham o mesmo esqueleto. Quem muda é a cor da borda, que
**anuncia a natureza da decisão** antes de o jogador ler qualquer palavra:

| Modal | Cor da borda | Porque |
|---|---|---|
| Guerra | `--perigo` (2px) | violência |
| Nuclear | `--perigo` (2px) + listras de perigo | violência irreversível |
| Nuclear abatido | `--cyan` | a defesa venceu |
| Ajuda externa | `--verde` | poder brando |
| Crise fiscal | `--ambar` | dinheiro |
| Reforço | `--cyan` | seu território |
| Equipamento | `--cyan` | informação |

```html
<div class="modal-fundo">
  <div class="[nome]-painel">
    <div class="[x]-cab">
      <span class="[x]-simbolo"><!-- ícone --></span>
      <div class="[x]-tit">
        <h2>TÍTULO</h2>
        <div class="[x]-sub">subtítulo técnico em mono</div>
      </div>
      <button class="pp-fechar"><!-- ícone x --></button>
    </div>
    <!-- corpo -->
  </div>
</div>
```

```css
.modal-fundo {
  position: fixed; inset: 0; z-index: 900;
  display: grid; place-items: center;
  background: rgba(2,3,6,.72); backdrop-filter: blur(3px);
}
.pp-fechar {
  display: grid; place-items: center; width: 30px; height: 30px; padding: 0;
  border-radius: 6px; background: transparent; border: 1px solid var(--borda); color: var(--fraco);
}
```

### Scrollbar (global, em tudo)

```css
* { scrollbar-width: thin; scrollbar-color: rgba(120,144,180,.35) transparent; }
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: rgba(120,144,180,.28); border-radius: 20px;
  border: 2px solid transparent; background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:hover { background: rgba(120,144,180,.55); background-clip: padding-box; }
```

---

## 5. Layout da tela de jogo

Grid de três colunas sobre fundo escuro:

```
┌─────────────────────────────────────────────────────────┐
│  TOPO: nação · ciclo · tesouro · PA · destino · brent    │
├──────────────────────┬──────────────┬───────────────────┤
│                      │              │                   │
│   GLOBO 3D           │   HUD        │   FEED DO X       │
│   (área principal)   │   (scroll)   │   (recolhível)    │
│                      │              │                   │
├──────────────────────┴──────────────┤                   │
│  CONSOLE: categorias · fila · ciclo │                   │
└─────────────────────────────────────┴───────────────────┘
```

```css
.jogo { display: grid; grid-template-areas: "globo hud feed"; }
.globo { grid-area: globo; position: relative; border: 1px solid var(--borda);
  border-radius: 12px; overflow: hidden; }
.hud { grid-area: hud; overflow-y: auto; padding-right: 5px; }
.feed { grid-area: feed; background: var(--painel); border: 1px solid var(--borda);
  border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; }
.feed-oculto .feed { display: none; }   /* o feed é recolhível e o estado persiste */
```

**Bloco padrão da HUD** — a unidade de composição de toda a coluna central:

```html
<div class="bloco">
  <h3><!-- ícone --> Título <span class="tri">unidade ou contexto</span></h3>
  <!-- conteúdo -->
</div>
```

```css
.bloco {
  background: var(--painel); border: 1px solid var(--borda); border-radius: 12px;
  padding: 16px 18px; margin-bottom: 10px;
  animation: surgir .4s ease both; overflow: hidden;
  backdrop-filter: blur(14px);   /* o vidro sobre o globo */
}
```

---

## 6. Índice de prefixos do CSS

O `estilo.css` usa prefixo por componente. Este é o mapa para navegar as 739 classes —
se você abrir o CSS procurando algo, comece por aqui:

| Prefixo | Componente | Arquivo de origem | Classes |
|---|---|---|---|
| `gp-` `gpu-` `gpr-` `gb-` | Planejador de guerra / batalha | `ui/guerra.js` | 57 |
| `x-` | Feed do X (rede social) | `ui/jogo.js` | 43 |
| `mkt-` `mk-` `mkp-` `mf-` | Mercado de armas | `ui/mercado.js` | 147 |
| `ref-` | Reforço de território | `ui/reforco.js` | 39 |
| `cs-` | Conselheiro IA | `ui/conselheiro.js` | 39 |
| `emp-` `ed-` | Empresas / complexo econômico | `ui/empresas.js` | 60 |
| `hm-` | Home cinemática | `ui/inicio.js` | 36 |
| `eq-` | Ficha de equipamento | `ui/equipamento.js` | 36 |
| `bp-` | Bases no exterior | `ui/bases.js` | 35 |
| `mv-` | Mundo ao vivo (tensão global) | `ui/jogo.js` | 32 |
| `mm-` | Marcadores no globo 3D | `ui/globo.js` | 32 |
| `gt-` `gtc-` | Tooltips do globo | `ui/globo.js` | 32 |
| `lg-` | Loading de guerra | `ui/loadingGuerra.js` | 29 |
| `fim-` | Tela de fim de jogo | `ui/jogo.js` | 29 |
| `fisc-` `fo-` | Crise fiscal | `ui/fiscal.js` | 28 |
| `pp-` | Painel de país | `ui/jogo.js` | 26 |
| `nk-` `nkd-` | Lançamento nuclear | `ui/nuclear.js` | 26 |
| `aj-` `aja-` `ajf-` | Ajuda externa | `ui/ajuda.js` | 49 |
| `acao-` `ac-` | Chips de ação | `ui/jogo.js` | 25 |
| `urg-` | Popup urgente | `ui/urgente.js` | — |
| `jrn-` `jp` | Jornada de consequências | `ui/jogo.js` | — |
| `fa-` | Forças Armadas | `ui/jogo.js` | — |
| `pt-` `ptc-` `ptp-` | Petróleo | `ui/jogo.js` | — |

---

<!-- SEÇÕES INJETADAS PELOS AGENTES ABAIXO -->
