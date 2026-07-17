# Prompt para o Claude Design

> Copie tudo abaixo da linha e cole. Anexe os arquivos listados na seção "O que estou anexando".

---

## Contexto

Estou construindo **SOBERANO — O Grande Jogo**: um RPG de grande estratégia geopolítica que roda no navegador. O jogador assume uma das 20 nações reais, comanda economia, exército, diplomacia e arsenal nuclear ao longo de 40 ciclos, sobre um **globo 3D vivo** (globe.gl + three.js). Uma IA gera as crises e a imprensa reage às decisões.

O jogo **já existe e funciona**. Não estou pedindo para você inventar um produto — estou pedindo para você transformar a interface existente numa **biblioteca de componentes** bem construída, e elevar o acabamento visual ao nível de um jogo AAA.

## O que estou anexando

**Documentação (leia primeiro, nesta ordem):**
1. `DESIGN-SYSTEM.md` — a gramática visual, os tokens, a tipografia, o padrão de modal, o layout e o **índice dos 739 seletores CSS por prefixo**. Comece por aqui.
2. `DESIGN-GLOBO-3D.md` — tudo do globo 3D: os modelos three.js construídos à mão (caça, navio, submarino, porta-aviões, míssil, satélite), as camadas do globe.gl, a detonação nuclear fase a fase, o radar de conflito, os marcadores CSS2D e os tooltips.

**O design system cru:**
3. `estilo.css` — **a fonte da verdade**. 2.209 linhas, 739 classes, todos os tokens no `:root`. Se houver conflito entre a documentação e este arquivo, **o arquivo vence**.

**O código-fonte da interface** (pasta `fonte-ui/`) — é daqui que sai a estrutura HTML real de cada componente. Cada arquivo monta seu HTML em template literals:

| Arquivo | Componentes |
|---|---|
| `jogo.js` | Cabeçalho/topo, HUD lateral (Nação à Beira/Destino, Perfil do Regime, Economia, Petróleo, Indicadores, Capacidades, Forças Armadas), console de ações, feed do X, carta de decisão, jornada de consequências, painel de país, tela de fim de jogo |
| `mercado.js` | Mercado de armas (catálogo, ficha, pedidos, venda) |
| `empresas.js` | Complexo econômico |
| `equipamento.js` | Ficha de equipamento militar |
| `guerra.js` | Planejador de ofensiva + batalha animada |
| `nuclear.js` | Lançamento nuclear (trava de 2 etapas) + desfecho |
| `ajuda.js` | Ajuda externa (dinheiro/arsenal) |
| `fiscal.js` | Crise fiscal (austeridade/impostos/imprimir/FMI/calote) |
| `conselheiro.js` | Conselheiro IA |
| `reforco.js` / `envio.js` | Reforço de território / designação de alvo |
| `bases.js` | Bases militares no exterior |
| `urgente.js` | Popup de crise com cronômetro |
| `inicio.js` | Home cinemática |
| `globo.js` / `tatico.js` / `modelos3d.js` / `efeitos.js` | Globo 3D |
| `icones.js` | O vocabulário de ícones (Lucide) |
| `vars.js` | Os rótulos e as dicas de todos os indicadores |

**Referências visuais:** as fotos que anexei. Siga a direção estética delas.

## A missão

Reconstrua os componentes como uma **biblioteca organizada**, respeitando o design system existente e elevando o acabamento.

### 1. Respeite o que já está decidido

O design system tem três decisões que governam tudo. **Não as reinvente:**

- **O fundo é quase preto e o conteúdo flutua.** Painéis são vidro escuro (`backdrop-filter: blur()`) sobre um globo 3D vivo. O mapa nunca some — ele é o palco. Nada de superfícies opacas cobrindo o planeta.
- **A cor é semântica, nunca decorativa.** Cinco cores, cada uma com um único significado:
  - **ciano `#35e0ff`** = você / sua nação / seleção / informação
  - **âmbar `#ffb020`** = dinheiro / atenção / território conquistado / sistema armado
  - **verde `#22e0a0`** = bom / ganho / tropa defendendo / aliado
  - **vermelho `#ff3b5c`** = guerra / perda / crise / ameaça
  - **roxo `#b98cff`** = pandemia / influência / o fora-de-categoria

  Um card **não** fica âmbar "porque ficou bonito". Se algo é vermelho, é perigo.
- **Três vozes tipográficas:** Rajdhani (números grandes, títulos, botões — autoridade), IBM Plex Mono (rótulos técnicos e dados — precisão, sempre com `letter-spacing: .16em` e caixa alta), IBM Plex Sans (prosa e narrativa).

Use os tokens do `:root`. Não introduza cores fora da paleta sem um motivo semântico novo.

### 2. A direção estética: Destiny / Starfield

Quero o acabamento de **UI de jogo AAA**, não de dashboard corporativo:

- **Sofisticação, não decoração.** Cada elemento gráfico deve carregar informação ou hierarquia. Nada de ornamento vazio.
- **Densidade com respiro.** Interface de comando é densa por natureza — mas a hierarquia tem que deixar o olho pousar. O número importante grande, o rótulo pequeno, o resto sumindo.
- **Materialidade.** Bisel sutil, luz que vem de algum lugar, superfícies com peso. Painel de vidro sobre o planeta, não retângulo cinza.
- **Motion curto e funcional.** Nada de easing dramático em UI. Entradas de 120–300ms. O drama fica para os momentos épicos (detonação nuclear, crise, fim de jogo).
- **Estados diegéticos.** Um sistema armado *parece* armado (listras de perigo, pulso). Uma crise *parece* crise (o selo pisca em `steps(2)` — liga/desliga digital de alarme, não respiração).

Estude as fotos anexadas e traga essa linguagem.

### 3. Iconografia temática

- Hoje o jogo usa **Lucide** (`icones.js`), renderizado como SVG inline herdando `currentColor`. Funciona, mas é genérico.
- **Quero iconografia própria, temática**: geopolítica, militar, econômica, nuclear, diplomática. Ícones que pertencem a *este* jogo.
- **Nada de emoji em UI de sistema.** Emoji é aceito hoje apenas como fallback quando a foto de um equipamento não carrega — e nem isso é ideal. Todo ícone deve ser SVG vetorial, com peso de traço consistente, herdando `currentColor`, legível em 11px.
- Vocabulário atual a cobrir (e melhorar): militar, arsenal/nuclear, inteligência/espionagem, economia/dinheiro, diplomacia, ciência, mídia, petróleo, defesa/escudo, conselheiro, ajuda, crise fiscal, alvo/mira, frota, força aérea, radar, pandemia, ocupação, revolta, base.

### 4. Os componentes a construir

Organize por família (os prefixos estão no índice do `DESIGN-SYSTEM.md`):

**Tela de jogo** — cabeçalho, HUD lateral, console de ações, feed do X, globo.
**HUD** — Nação à Beira (o card de Destino, 0–100 com escala ☠ COLAPSO → IMPERADOR 👑, 7 bandas de cor), Perfil do Regime (rótulo ideológico + 2 eixos políticos), Economia (PIB/Tesouro/Endividamento/Impostos + fluxo), Petróleo (preço + 6 bandas de mercado, da CRISE ao COLAPSO), Indicadores (8 medidores 0–100, cada um com cor própria e alerta ⚠), Capacidades, Forças Armadas (inventário por domínio com **foto real do equipamento nacional**).
**Modais** — a cor da borda anuncia a natureza da decisão antes de o jogador ler qualquer palavra: guerra = vermelho, ajuda = verde, fiscal = âmbar, equipamento/reforço = ciano, nuclear = vermelho com listras de perigo, nuclear abatido = ciano (a defesa venceu).
**Feed do X** — rede social com logos reais de imprensa, selo verificado, card de preview de link.
**Momentos** — carta de decisão, jornada de consequências, popup urgente com cronômetro, popup épico, fim de jogo.
**Globo 3D** — marcadores, tooltips, e (se conseguir) refinar os modelos three.js.

### 5. O que entregar

- Componentes com **HTML + CSS** (o jogo é Vite + vanilla JS, sem framework — nada de React).
- **Tokens organizados** (podem ser refinados, mas mantendo os significados semânticos).
- **Estados e variantes** de cada componente, explícitos.
- **A iconografia** em SVG.
- Se propuser mudar algo do sistema atual, **diga por quê** — eu quero a opinião, não obediência.

## Regras finais

- **Português do Brasil** em toda a copy. Público a partir de 16 anos: pode ser técnico, não pode ser hermético. Nada de jargão sem tradução (já corrigi "Mb/d" para "milhões de barris/dia", "Soft Power" para "Influência").
- **A voz do jogo é dramática e seca**, nunca fofa. Exemplos reais do produto: *"Você cruzou a linha que 80 anos de humanidade tiveram medo de cruzar."* · *"Assinaram sorrindo — pergunte-se contra quem."* · *"Na prática, o céu brasileiro é aberto."* Mantenha esse registro.
- **Não invente dados.** Se um componente precisa de número, use os exemplos reais que estão na documentação.
- Projeto **acadêmico** (faculdade de tecnologia), não comercial. Marcas e nomes reais de imprensa/equipamento são intencionais.

---

### Dívidas técnicas conhecidas (não repita ao recriar)

Estão documentadas no fim de cada MD. As principais:
- **147 classes `.mkt-*` são CSS morto** — nenhum JS as usa. É o mercado da v1. Não recrie.
- `.globo-tip`, `.gt-cab span`, `.gt-corpo` são CSS legado do tooltip v1.
- Há **declarações duplicadas** em `.gpu-linha`, `.gp-rodape`, `.aja-item`, `.aj-arsenal` (a segunda vence).
- `.mm-in.alerta` não tem regra CSS — cai no estilo padrão.
- Três limiares de relação diferentes convivem (`±30` no mapa, `±30/±60/-20` no tooltip, `-55/-75` no marcador). Unifique se fizer sentido.
