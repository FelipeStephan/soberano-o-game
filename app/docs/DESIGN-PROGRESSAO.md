# DESIGN — PROGRESSÃO: MARCOS, IDH E LINHAS DE PRODUÇÃO

**Problema que este documento mata:** hoje toda ação é um efeito pontual — `laser_dew` soma `seguranca:+14` e desaparece. O jogador de RPG não sente que CONSTRUIU nada; sente que apertou um botão que somou números. A visão do dono é direta: ações precisam gerar **facilidades permanentes** — o laser vira um desbloqueio que barateia ações para sempre; investir em extração de petróleo aumenta a produção todo mês; investir em indústria + educação desbloqueia **fabricar o próprio caça** e o preço dele despenca. Este doc especifica os três sistemas (MARCOS, IDH, LINHAS DE PRODUÇÃO), ancorados no código que já existe, e fecha com a FATIA 1 executável.

O terreno já está preparado — o jogo JÁ tem três ganchos de desconto permanente que provam o padrão:
- `motor.js:130 custoDe()` — desconto de aliança (`descontoMilitar`, blocos.js) + indústria (`descontoIndustrial`, empresas.js), cap 45%.
- `arsenal.js:363 precoEfetivo()` — produção nacional paga `preco * 0.8` e `podeComprar()` devolve `nacional:true` (sem veto, entrega imediata em `compras.js:65`).
- `equipamentos.js:184 fatorProducao()` — `proprio:true` → fator 0.8.

Marcos e linhas de produção são **a versão jogável desses ganchos**: em vez de nascer com eles (EUA), você os CONQUISTA.

---

## 1. SISTEMA DE MARCOS (tecnologia permanente)

### 1.1 Conceito

Uma ação com `marco: true` só pode ser executada **uma vez por partida**. Resolvida com **sucesso**, grava o id em `estado.marcos[]` (array de strings, JSON puro) e passa a emitir um **bônus passivo declarativo** para sempre. Falhou no dado? Não grava — pode tentar de novo (o custo pago é o preço da tentativa). A ação some do catálogo depois de conquistada (ou aparece com selo "CONQUISTADO").

### 1.2 Schema

No catálogo (`src/dados/acoes.js`), campos novos na ação:

```js
marco: true,
bonus: {
  // TODOS opcionais. Tudo declarativo — o motor lê, o dado nunca mente.
  custoCategoria:  { Militar: -0.10, Arsenal: -0.10 },  // fração no custoDe() por categoria
  probCategoria:   { 'Inteligência': +0.08 },           // soma na prob das ações da categoria (cap 0.97)
  tempoCategoria:  { 'Ciência': -0.20 },                // fração no tempoDe() por categoria
  precoUnidade:    { cacas: -0.25, drones: -0.30 },     // fração no precoEfetivo() por unidade do arsenal
  petroleoProducao: +0.4,     // Mb/d somados a estado.petroleo_producao (aplicado 1x ao gravar)
  petroleoCusto:    -2,       // US$/barril subtraídos de estado.petroleo_custo (1x ao gravar)
  fluxoMes:        { inteligencia: +0.3, seguranca: +0.3 }, // efeitos aplicados TODA batida (beatMundo)
  dividendo:       +0.15,     // fração multiplicativa no dividendoSoberania (economia.js:29)
  agioMercado:     -0.10,     // fração no ágio de importação do precoEfetivo (nunca abaixo de 1.0x → 0.9x)
  idhMes:          +0.15,     // pontos de IDH por batida (ver §2)
},
```

Novo módulo `src/jogo/marcos.js` (funções puras, sem estado próprio):

```js
temMarco(estado, id)                       // estado.marcos?.includes(id)
registrarMarco(estado, acao)               // push + aplica bônus one-shot (petroleoProducao/Custo)
fatorCusto(estado, categoria)              // Π(1 + custoCategoria[cat]) dos marcos ativos, piso 0.55
bonusProb(estado, categoria)               // Σ probCategoria[cat]
fatorTempo(estado, categoria)              // Π(1 + tempoCategoria[cat]), piso 0.5
fatorPrecoUnidade(estado, unidadeId)       // Π(1 + precoUnidade[uid]), piso 0.5
fluxoMesDosMarcos(estado)                  // merge dos fluxoMes → objeto de efeitos
fatorDividendo(estado) / fatorAgio(estado) / idhMesDosMarcos(estado)
```

### 1.3 Onde cada bônus se aplica (arquivo e linha do gancho)

| Bônus | Gancho existente |
|---|---|
| `custoCategoria` | `motor.js custoDe()` (linha 130): `c = c * fatorCusto(this.estado, a.categoria)` — entra ANTES do cap 0.45 de aliança+indústria e se compõe com ele (piso global 0.55 do lado dos marcos evita ação de graça). |
| `probCategoria` | `jogo/acoes.js resolverFila()` (linha 19): `Math.random() < Math.min(0.97, a.prob + bonusProb(estado, a.categoria))`. |
| `tempoCategoria` | `dados/acoes.js tempoDe()` — passa a receber `estado` opcional: `return Math.round(clampT(base * ... * fatorTempo(estado, a.categoria), 6, 120))`. Únicos chamadores: `ui/tempoReal.js` e `ui/jogo.js`. |
| `precoUnidade` | `dados/arsenal.js precoEfetivo()` (linha 363) — ganha parâmetro `estado`; multiplica no final. Chamadores: `jogo/compras.js:54,` UI do mercado. |
| `petroleoProducao/Custo` | one-shot em `registrarMarco`: muta `estado.petroleo_producao` / `estado.petroleo_custo` — `fluxoPetroleo()` (petroleo.js:198) já lê essas chaves, zero mudança lá. |
| `fluxoMes` / `idhMes` | `motor.js beatMundo()` (linha 379), junto de `bonusDoTurno(this.empresas)` (linha 385): `aplicarEfeitos(this.estado, fluxoMesDosMarcos(this.estado))`. Mesmo padrão das empresas — o precedente já existe. |
| `dividendo` | `jogo/economia.js dividendoSoberania()` — multiplica `* fatorDividendo(estado)`. |
| `agioMercado` | `precoEfetivo()`, no ramo de importação. |

Trava de repetição: `motor.js podeEnfileirar()` (linha 140) ganha `if (a.marco && temMarco(this.estado, a.id)) return { ok:false, motivo:'marco já conquistado' };`. Gravação: nos DOIS caminhos de resolução — após `resolverFila` em `passarTurno` e em `executarAcaoTempo` — `if (r.sucesso && acao.marco) registrarMarco(estado, acao)`.

### 1.4 Conversão de ações existentes em marcos (10 ações, bônus concretos)

| Ação (id) | Bônus permanente | Leitura de fantasia |
|---|---|---|
| `laser_dew` Arma de Energia Dirigida | `custoCategoria:{Militar:-0.10, Arsenal:-0.10}`, `fluxoMes:{seguranca:+0.3}` | "A defesa que sai mais barata que o ataque" vira literalmente isso: todo o seu complexo militar fica 10% mais barato para sempre. É o exemplo canônico do dono. |
| `quantico` Computação Quântica | `probCategoria:{'Inteligência':+0.08}`, `custoCategoria:{'Inteligência':-0.15}` | Quebrar criptografia = suas operações de espionagem falham menos e custam menos. |
| `fusao` Reator de Fusão | `petroleoCusto:-4`, `fluxoMes:{temp_economia:+0.4}`, `idhMes:+0.10` | Energia quase infinita: extrair fica mais barato, o mercado confia, o país desenvolve. |
| `espacial` Programa Espacial | `fluxoMes:{inteligencia:+0.3}`, `tempoCategoria:{'Ciência':-0.15}` | Infraestrutura orbital: intel pinga todo mês, projetos científicos andam mais rápido. |
| `satelite` Satélite de Reconhecimento | `fluxoMes:{inteligencia:+0.25}` | "Olhos permanentes" deixa de ser slogan: é renda mensal de inteligência. |
| `ia_militar` Enxame de Drones com IA | `precoUnidade:{drones:-0.30}` | Você dominou a tecnologia — todo drone que comprar/produzir custa 30% menos. |
| `triade` Escudo Antimísseis | `fluxoMes:{seguranca:+0.4}` | O escudo fica LIGADO — não é um pico de segurança que a maré leva. |
| `bloco` Fundar Bloco Comercial | `agioMercado:-0.12`, `dividendo:+0.10` | O bloco negocia por você: importações mais baratas, comércio rendendo todo mês. |
| `fundo_soberano` Fundo Soberano | `dividendo:+0.15` | O cofre que rende — direto no `dividendoSoberania`, a linha que mantém o jogador líquido. |
| `biotec` Programa de Biotecnologia | `idhMes:+0.15`, `fluxoMes:{aprovacao:+0.2}` | Saúde estrutural: alimenta o IDH mês após mês (ver §2). |

Regra editorial: ações repetíveis por natureza (`uranio`, `ogiva`, `infra`, os 5 investimentos escaláveis) **não** viram marcos. Marco é o que no mundo real se constrói uma vez: reator, escudo, programa espacial.

---

## 2. IDH COMO RECURSO — sim, vale, e é assim

**Resposta à pergunta do dono: sim.** O jogo já tem `capacidade_ind` (o que suas fábricas conseguem fazer) e `inteligencia` (o que seus espiões sabem). Falta o terceiro pilar: **o que o seu POVO sabe fazer** — e é ele que gata a fantasia de "meu país fabrica o próprio caça". Não se monta linha de F-35 com mão de obra sem escola. IDH é a barra de longo prazo que faz Ciência/Educação — hoje a categoria mais "flavor" — virar a espinha da partida.

### 2.1 Registro (src/jogo/vars.js)

```js
idh: { rotulo: 'Desenvolvimento (IDH)', grupo: 'capacidade', min: 0, max: 100, cap: 6,
       dica: 'Educação, saúde e qualidade de vida do povo. Sobe devagar, cai com guerra e repressão — e desbloqueia produzir tecnologia própria.' },
```

`cap: 6` deliberadamente baixo: IDH não pode ser comprável num turno — a IA validadora (que já usa `tetoDe`) fica automaticamente impedida de despejar +25 nele. Valor inicial por país na ficha (`dados/paises.js` / ficha da partida): aproxima o IDH real ×100 (USA 92, BRA 76, CHN 79, IND 64, IRN 78, PRK 40...). Default 60.

### 2.2 O que alimenta e o que corrói (tique em `beatMundo`, novo bloco junto ao fluxo dos marcos)

```
POR BATIDA (mês):
 + 0.10  se aliquota >= 20 (Estado que arrecada, financia escola — o gastoSocial de 12% do PIB em economia.js:37 já existe; isto o torna visível)
 + idhMesDosMarcos(estado)            (biotec, fusao...)
 + efeitos diretos de ações           (universidades, subsidio e as novas do §3 ganham `idh` no efeitos)
 − 0.30  se temp_guerra >= 70         (guerra come geração)
 − 0.20  se liberdades <= 35          (repressão expulsa cérebros)
 − 0.15  se aprovacao <= 25           (caos social)
clamp 0..100
```

Ações existentes que ganham `idh` nos `efeitos` (mexer só no catálogo): `universidades` `idh:+2`, `subsidio` `idh:+1`, `biotec` `idh:+1` (além do marco), `purga` `idh:-2`, `censura_imprensa` `idh:-1`, `estado_excecao` `idh:-2`, `alistamento_obrigatorio` `idh:-1`. `aplicarEfeitos` já lida com qualquer chave registrada em VARS — custo de implementação zero.

### 2.3 O que o IDH desbloqueia — LINHAS DE PRODUÇÃO por faixa

O sistema de `desbloqueio` (desbloqueios.js + `cumpreRequisito`) já entrega o popup-surpresa de graça. Novas ações (categoria **Ciência**, ícone 🏭), cada uma um **marco** com pré-requisito de IDH + indústria:

| Faixa | Ação (id novo) | Desbloqueio | Custo | Tempo (tempo real) | Efeito ao concluir |
|---|---|---|---|---|---|
| IDH ≥ 55 | `linha_blindados` | `idh>=55, capacidade_ind>=45` | 0.20 tri, 2 PA | 60 s (~2 meses) | `estado.linhas += 'blindados'` |
| IDH ≥ 65 | `linha_drones` | `idh>=65, capacidade_ind>=55` | 0.30 tri, 2 PA | 75 s | `estado.linhas += 'drones'` |
| IDH ≥ 75 | `linha_cacas` | `idh>=75, capacidade_ind>=65` | 0.55 tri, 2 PA | 100 s (~3 meses) | `estado.linhas += 'cacas'` |
| IDH ≥ 85 | `linha_stealth` | `idh>=85, capacidade_ind>=75, inteligencia>=60` | 0.90 tri, 2 PA | 120 s | `estado.linhas += 'stealth'` (habilita `precoUnidade` de itens 5ª geração e `bombardeiros`) |

`dica` de cada uma escreve o caminho na cara do jogador: "Eleve o IDH a 75 (universidades, saúde, biotec) e a Indústria a 65 — e o país monta o próprio caça."

### 2.4 O efeito de TER a linha

`estado.linhas` (array de strings) entra em dois pontos:

- **`arsenal.js podeComprar()`** (linha 339): antes do teste de política, `if (estado.linhas?.includes(linhaDaUnidade(item)) && item.politica !== 'nunca') return { pode:true, chance:1, nacional:true, motivo:'Linha de produção própria — a fábrica é sua.' };`. Resultado herdado de graça: `compras.js:65` entrega **imediato, sem veto de fornecedor, sem dado de aprovação**. Itens `politica:'nunca'` (F-22, J-20, B-2) continuam intocáveis — linha própria fabrica a SUA versão da categoria, não o segredo alheio.
- **`arsenal.js precoEfetivo()`**: mesmo teste → `preco * 0.8` (o `fatorProducao 0.8` de equipamentos.js aplicado a quem CONQUISTOU a linha, não só a quem nasceu com ela). Com `linha_stealth`, os 5ª geração compráveis caem para 0.8 também — "o preço dele despenca pra você".

Mapa `linhaDaUnidade`: `blindados→blindados/artilharia`, `drones→drones`, `cacas→cacas/helicopteros`, `stealth→cacas 5ª ger./bombardeiros/misseis`.

**Contra-onda (drama grátis):** ganhar linha de caça derruba `rel_*` do seu antigo fornecedor em −6 (você saiu da carteira de clientes dele) e rende post no X. Uma linha só, um efeito, e a decisão deixa de ser puramente positiva.

---

## 3. CIÊNCIA APLICADA — 6 ações novas de investimento contínuo

Todas repetíveis (SEM `marco`), categoria Ciência salvo indicado, alimentando exatamente as engrenagens dos §1–2:

1. **`extracao_petroleo` — Investir em Extração de Petróleo** (🛢️, 0.25 tri, 1 PA, prob 0.85, `requer:{petroleo_producao:'>0'}` — precisa ter onde furar)
   `efeitos: { petroleo_producao: +0.4, petroleo_custo: -1 }`, `efeitos_falha: { petroleo_producao: +0.1 }`. Todo mês o `fluxoPetroleo()` devolve o investimento — nos EUA (+0.4 Mb/d a Brent 78, custo 34) são ~+0.06 tri/mês para sempre. `petroleo_producao` e `petroleo_custo` entram no VARS (grupo `capacidade`, cap 2) para o validador aceitar as chaves. 15% de chance embutida (texto do sucesso) de a Máquina narrar "nova reserva descoberta" com `petroleo_producao:+0.8` — o pedido explícito do dono de "chance de descobrir petróleo".
2. **`doutrina_industrial` — Doutrina Industrial** (⚙️, 0.30 tri, 1 PA, prob 0.9)
   `efeitos: { capacidade_ind: 6, idh: 1, temp_economia: 2 }`. O adubo das linhas de produção: empurra os DOIS requisitos.
3. **`rede_tecnica` — Rede de Escolas Técnicas** (📐, 0.25 tri, 1 PA, prob 0.95)
   `efeitos: { idh: 2, capacidade_ind: 3 }`. O alimentador padrão de IDH — barato, confiável, sem drama. É a ação que o jogador spamma quando decide "vou construir meu caça".
4. **`saude_publica` — Sistema Nacional de Saúde** (🏥, 0.35 tri, 1 PA, prob 0.95)
   `efeitos: { idh: 2, aprovacao: 4, estabilidade: 2 }`, `politico: { economico: -5 }`. IDH pelo caminho da esquerda; `rede_tecnica`+`doutrina` é o caminho tecnocrata — a bússola política diferencia.
5. **`escola_guerra` — Escola Superior de Guerra** (🎖️, 0.20 tri, 1 PA, prob 0.9, **marco**, `desbloqueio:{poder_militar:'>=50'}`)
   `bonus: { probCategoria:{Militar:+0.05}, tempoCategoria:{Militar:-0.15} }`. Doutrina não se compra duas vezes.
6. **`polo_semicondutores` — Polo de Semicondutores** (💾, 0.50 tri, 2 PA, prob 0.75, **marco**, `desbloqueio:{idh:'>=65', capacidade_ind:'>=60'}`)
   `bonus: { precoUnidade:{drones:-0.20, misseis:-0.15}, fluxoMes:{capacidade_ind:+0.3} }`. O chip é o petróleo do século — e é pré-história narrativa da `linha_stealth`.

---

## 4. O LOOP PSICOLÓGICO — "estou construindo algo"

**A gramática do loop:** toda batida o jogador vê três relógios andando — o caixa (já existe), o IDH subindo 0.1 a 0.1 (novo) e a coleção de marcos (novo). Marcos são **compra de identidade** ("sou a potência que tem fusão"); IDH é **poupança com meta visível** ("faltam 4 pontos pra minha linha de caças"); linhas são **o payoff que muda as regras** (o mercado inteiro reprecifica na sua tela). A composição é o segredo: `rede_tecnica` (imediato) → IDH 75 (médio prazo) → `linha_cacas` (marco) → caça a 0.8x sem veto (permanente) → esquadrões baratos → guerra que antes era impagável. Cada camada dá vontade de "mais um mês" porque a próxima está SEMPRE a 2–4 batidas de distância. E o custo de oportunidade é real: o 0.55 tri da `linha_cacas` são dois esquadrões de F-35 que você NÃO comprou hoje para nunca mais pagar preço de cliente — a escolha clássica de estratégia (consumo vs. investimento) que o jogo hoje não oferece.

**HUD (ui/jogo.js):** faixa de insígnias de marcos sob os medidores — um chip chanfrado por marco conquistado (identidade visual de terminal militar: chanfro, cor semântica), tooltip via `data-tip` (motor tip.js) mostrando o bônus vivo ("−10% custo Militar · ativo há 14 meses"). IDH entra como barra no grupo capacidades com um marcador na PRÓXIMA faixa de linha (75 ▸ caças) — a barra com meta desenhada é o que transforma número em desejo.

**Painel de ações:** ações `marco` ganham selo `◆ MARCO — PERMANENTE` no card (a tag de impacto colorida já existe; é mais uma). Conquistada, o card vira estado "CONQUISTADO" com o bônus escrito — o catálogo vira vitrine de troféus e mapa do que falta. As dicas de desbloqueio (`dica`) já fazem o resto.

**Índice Mundial (topo):** coluna nova no ranking — nº de marcos e IDH por país (NPCs recebem marcos estáticos na ficha: EUA 4, China 3...). Comparação com rivais é o combustível competitivo: "a China tem o polo de semicondutores e eu não".

**Feed/X e Máquina:** conquistar marco ou linha empilha post de sistema + reações sociais (`reacoesSociais` já recebe tema) — o operário celebrando a linha de montagem, o rival minimizando. A Máquina recebe `estado.marcos` no prompt e passa a citar ("a nação que domou a fusão não teme embargo").

**Globo:** linha de produção acende um ícone 🏭 permanente no seu território — progressão LITERALMENTE visível no mapa.

---

## 5. ONLINE

`estado.marcos` (string[]), `estado.idh` (number), `estado.linhas` (string[]) são JSON puro dentro do `estado` que o autosave e o relay já serializam (motor.js:364 — "o estado é JSON puro"). Nada novo no transporte.

O servidor valida (mesma filosofia da AUDITORIA-ONLINE: cliente propõe, servidor confere contra o catálogo):
1. **Marco é write-once:** rejeitar estado onde `marcos` perdeu itens ou ganhou id que não existe em `ACOES` com `marco:true`; um marco novo por vez, e só acompanhado do débito do custo da ação.
2. **Bônus nunca trafega:** fatores são SEMPRE recalculados de `estado.marcos` + catálogo no receptor. Cliente que mandar "custo com desconto" tem o custo recomputado server-side (`custoDe` é determinístico dado o estado).
3. **IDH com física:** delta máximo por batida = `cap` do VARS (6) via ações + 0.5 de tique; qualquer salto maior é rollback. Clamp 0–100.
4. **Linha exige a faixa:** `linhas` só aceita entrada se `idh`/`capacidade_ind` do estado ATUAL cumprirem o `desbloqueio` da ação correspondente e o marco dela estiver em `marcos`.
5. **Recon de intel:** marcos e linhas do oponente são informação espionável (camada no Modo Defesa) — entram no payload de recon, não no estado público.

---

## 6. FATIA 1 — a menor implementação que entrega a sensação

**Escopo:** só MARCOS, 4 ações convertidas, bônus `custoCategoria` + `fluxoMes`, trava de repetição, selo no card e chips na HUD. Sem IDH, sem linhas (são a Fatia 2/3). Um jogador dispara o laser UMA vez e vê o custo de toda ação Militar cair 10% para sempre, com o chip aceso na HUD. ~150 linhas.

**Passo 1 — `src/dados/acoes.js`:** adicionar a 4 ações existentes os campos `marco: true` e `bonus`:
- `laser_dew`: `bonus: { custoCategoria: { Militar: -0.10, Arsenal: -0.10 }, fluxoMes: { seguranca: 0.3 } }`
- `quantico`: `bonus: { custoCategoria: { 'Inteligência': -0.15 }, fluxoMes: { inteligencia: 0.2 } }`
- `triade`: `bonus: { fluxoMes: { seguranca: 0.4 } }`
- `fundo_soberano`: `bonus: { fluxoMes: { temp_economia: 0.3 } }`  *(a variante `dividendo` fica pra Fatia 2 — fluxoMes não toca economia.js)*
Nenhuma outra chave muda.

**Passo 2 — criar `src/jogo/marcos.js`:**
```js
import { ACAO_POR_ID } from '../dados/acoes.js';
export function temMarco(estado, id) { return (estado.marcos || []).includes(id); }
export function marcosAtivos(estado) { return (estado.marcos || []).map((id) => ACAO_POR_ID[id]).filter((a) => a?.bonus); }
export function registrarMarco(estado, acao) {
  estado.marcos = estado.marcos || [];
  if (!estado.marcos.includes(acao.id)) estado.marcos.push(acao.id);
}
export function fatorCusto(estado, categoria) {
  let f = 1;
  for (const a of marcosAtivos(estado)) f *= 1 + (a.bonus.custoCategoria?.[categoria] || 0);
  return Math.max(0.55, f);
}
export function fluxoMesDosMarcos(estado) {
  const out = {};
  for (const a of marcosAtivos(estado))
    for (const [k, v] of Object.entries(a.bonus.fluxoMes || {})) out[k] = (out[k] || 0) + v;
  return out;
}
```

**Passo 3 — `src/jogo/motor.js`** (4 toques):
1. Import: `import { temMarco, registrarMarco, fatorCusto, fluxoMesDosMarcos } from './marcos.js';`
2. `custoDe(a)` (linha ~130): antes do `return c;`, inserir `c = round2(c * fatorCusto(this.estado, a?.categoria));`
3. `podeEnfileirar(acaoId)` (linha ~140): após o teste de `custoPA`, inserir `if (a.marco && temMarco(this.estado, a.id)) return { ok: false, motivo: 'marco já conquistado — o bônus é permanente' };`
4. Gravação nos dois caminhos de resolução:
   - em `passarTurno` (linha ~186), logo após `const resultados = resolverFila(...)`: `for (const r of resultados) if (r.sucesso && ACAO_POR_ID[r.id]?.marco) registrarMarco(this.estado, ACAO_POR_ID[r.id]);`
   - em `executarAcaoTempo`, no caminho comum (onde a ação normal resolve via `resolverFila` de item único — mesmo laço, mesmo teste).
5. `beatMundo()` (linha ~385, junto do `bonusDoTurno`): `const bMarcos = fluxoMesDosMarcos(this.estado); if (Object.keys(bMarcos).length) aplicarEfeitos(this.estado, bMarcos);`

**Passo 4 — `src/ui/jogo.js`** (2 toques):
1. No card de ação: se `a.marco`, renderizar selo `◆ MARCO` (classe nova `.tag-marco`, dourado `#ffb020`, chanfro padrão); se `temMarco(jogo.estado, a.id)`, card em estado desabilitado com rótulo `CONQUISTADO` e o texto do bônus (gerar de `a.bonus`: "−10% custo Militar/Arsenal · +0.3 Segurança/mês").
2. Na HUD, sob os medidores: linha de chips `estado.marcos.map(...)` com ícone da ação e `data-tip` descrevendo o bônus. Zero marcos = linha oculta.

**Passo 5 — `src/estilo.css`:** classes `.tag-marco` e `.chip-marco` seguindo a identidade (chanfro via clip-path já usado, borda 1px, cor `#ffb020`).

**Passo 6 — teste manual:** partida nova → subir `capacidade_ind` a 70 → executar `laser_dew` → conferir: (a) custo de `blindados` caiu de 0.05 para 0.045 no card; (b) chip na HUD com tooltip; (c) `laser_dew` recusa segunda execução; (d) salvar/recarregar preserva `estado.marcos` (autosave já serializa o estado inteiro — deve passar sem toque); (e) `seguranca` sobe +0.3 por batida no tempo real.

**Fatia 2** (na sequência, sem depender de UI nova): IDH no VARS + tique no `beatMundo` + `idh` nos efeitos das ações listadas em §2.2. **Fatia 3:** linhas de produção (`podeComprar`/`precoEfetivo` ganham `estado`). **Fatia 4:** `probCategoria`/`tempoCategoria`/`precoUnidade`/`dividendo` + Índice Mundial + ciência aplicada completa do §3.
