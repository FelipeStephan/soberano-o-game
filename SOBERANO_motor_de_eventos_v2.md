# SOBERANO — O Motor de Eventos
### Documento de Design v2 · A Máquina como Geradora Emergente

> **Supersede o v1.** O v1 tratava eventos como um baralho escrito à mão que a IA *curava*. O v2 assume a visão real do projeto: **não há arco pré-escrito.** A Máquina é uma **IA geradora** que inventa o próximo acontecimento em tempo real, olhando três coisas — **o ano** (dados históricos reais), **o país** (ficha real) e **as suas ações**. A história é o rastro das suas decisões.
>
> Decisões travadas (2026-07-14): **IA é o motor, sem volta** · geração por **Fios de Tensão** (recomendação) · contexto vindo de **fichas de dados reais por ano**.

---

## PARTE 0 — O PRINCÍPIO

**Não existe história. Existe um mundo, uma ficha e você. A história acontece.**

O jogador escolhe um **país** e um **ano** (ou sorteia). Isso carrega uma **Ficha do Mundo** — dados reais daquele recorte histórico. A partir daí, a Máquina gera acontecimentos que:
1. são **plausíveis** dado o ano e a ficha (o Irã ameaça os EUA em 2026 porque os dados dizem que essa tensão existe — não do nada);
2. **reagem** ao que você faz (investiu em espionagem? o fio muda);
3. **pressionam** onde você é frágil (drama = ameaçar o que você teme perder).

O antigo "arco A Fronteira em Chamas" (v1) **não é mais um trilho**. Vira duas coisas: um **exemplo do tipo de coisa que a Máquina gera** e uma **biblioteca de reserva** (fallback) pra quando a API cair.

---

## PARTE 1 — A DIRETORA DE TRÊS CAMADAS

O erro a evitar tem nome: IA que gera evento por evento **esquece o passado** e se contradiz. A solução é separar a Máquina em três camadas, cada uma com um trabalho.

```
┌─ CAMADA 1 · ESTRATÉGICA — os FIOS DE TENSÃO ────────────────┐
│  A memória e a coerência do mundo.                          │
│  Um punhado de tensões vivas (ex: "Escalada com o Irã").    │
│  Nascem do estado+ações, sobem/descem de intensidade,       │
│  morrem. NÃO são roteirizadas — são cultivadas.             │
└──────────────────────────┬─────────────────────────────────┘
                           │  a cada tique, escolhe o fio mais dramático
┌─ CAMADA 2 · TÁTICA — o GERADOR DE EVENTOS ──────────────────┐
│  Pega o fio mais quente + a ficha real do ano →             │
│  gera UM acontecimento concreto (uma Carta válida).         │
│  É aqui que a chamada de IA acontece.                       │
└──────────────────────────┬─────────────────────────────────┘
                           │  a Carta gerada
┌─ CAMADA 3 · SUPERFÍCIE — o NARRADOR + FEED ─────────────────┐
│  Transforma a Carta em prosa viva + posts do feed.          │
│  (Pode ser a mesma chamada ou um modelo mais barato.)       │
└─────────────────────────────────────────────────────────────┘
```

### Camada 1 — Os Fios de Tensão (o que substitui os "arcos")

Um **Fio** é o objeto que dá memória e continuidade emergente ao mundo:

```json
{
  "id": "fio_ira_2026",
  "tema": "Escalada militar com o Irã",
  "intensidade": 55,          // 0–100; quando passa de um limiar, vira crise aberta
  "origem": "Relação EUA–Irã baixa na ficha 2026 + incidente no Golfo",
  "alvo_pressao": "seguranca", // qual eixo do jogador este fio ameaça
  "atores": ["ira", "israel"],
  "status": "ativo",           // ativo | esfriando | resolvido | mutou
  "memoria": [                 // o que já aconteceu neste fio (a IA LÊ isto)
    "t12: jogador aumentou espionagem contra o Irã (+15 defesa)",
    "t14: Irã capturou um agente americano — incidente público"
  ]
}
```

**Como os fios evoluem (as regras da Camada 1):**
- **Nascem** quando o estado do mundo cruza um limiar (relação < -50 + programa nuclear ativo → nasce um fio de escalada) ou quando uma ação sua provoca (invadiu alguém → nasce "condenação internacional").
- **Sobem/descem** conforme suas ações e os eventos que resolvem. Ignorar um fio quente = ele esquenta. Agir sobre ele = ele esfria, resolve, **ou muta** ("Escalada com o Irã" resolvida por força pode mutar em "Irã busca aliança com a China").
- **Morrem** quando resolvidos ou quando ficam frios tempo demais.
- **Teto de fios ativos** (ex.: 4–6). O mundo tem foco; não vira sopa de 30 crises. Fio novo forte pode empurrar um fio fraco pra fora.

> É isto que entrega o "enredo pelas ações, sem arco inicial": o arco **é** o fio, e o fio é escrito pela sua conduta, turno a turno.

### Camada 2 — O Gerador (a Diretora escolhe e cria)

A cada tique:
```
1. PONTUAR FIOS → cada fio recebe score = intensidade × (bônus se alvo_pressao
                  == eixo mais frágil do jogador) × novidade
2. ESCOLHER     → o fio de maior score é o "tema" do próximo evento
                  (com tempero de aleatoriedade p/ não ser previsível)
3. GERAR        → a IA cria UMA Carta que empurra aquele fio, ancorada na
                  Ficha do Mundo (Parte 3) e na memória do fio
4. VALIDAR      → a Carta passa pelo schema + tetos (Parte 4). Falhou? regenera
                  ou cai no fallback
5. ENTREGAR     → jogador decide → efeitos aplicados → estado e fio atualizados
6. ATUALIZAR FIOS → a decisão realimenta a Camada 1 (fios sobem/descem/nascem/morrem)
```

O passo 1 é a "regra de ouro do drama": a Máquina te ataca onde dói. É barato e parece inteligente.

### Camada 3 — Narrador + Feed

Recebe a Carta (dados) e produz a experiência: a narrativa em voz do personagem que a entrega + os posts do feed dos veículos ficcionais. Detalhe na Parte 5.

---

## PARTE 2 — A CARTA (o que a IA produz, e o contrato de saída)

A IA **não escreve texto solto** — ela preenche este schema. Isso é o que a torna segura e integrável ao motor. Mesmo formato do v1; o que mudou é *quem preenche* (agora a IA, em tempo real) e o campo `fio`.

```json
{
  "id": "gen_t15_a1b2",
  "fio": "fio_ira_2026",
  "pressiona": "seguranca",
  "personagem": "dir_cia",
  "titulo": "O pacote na embaixada",
  "narrativa": "{dir_cia.nome} coloca uma pasta na sua mesa. 'Interceptamos planos do Irã para um ataque cibernético à nossa malha elétrica. Temos 72 horas antes que eles saibam que sabemos. Isso não vai sair no jornal — a menos que você deixe.'",
  "opcoes": [
    {
      "texto": "Ataque cibernético preventivo às centrífugas iranianas",
      "efeitos": { "rel_ira": -30, "seguranca": +15, "soft_power": -10, "risco_exposicao": "alto" },
      "reacao_feed": "tom:nada_publico; se exposto: mundo em choque",
      "efeito_no_fio": { "intensidade": +20 }
    },
    {
      "texto": "Reforçar defesa cibernética e alertar aliados",
      "efeitos": { "seguranca": +8, "tesouro": -12, "rel_aliados": +10 },
      "reacao_feed": "tom:tensao_contida; GNN cobra dureza",
      "efeito_no_fio": { "intensidade": -10 }
    },
    {
      "texto": "Canal secreto: negociar com Teerã",
      "efeitos": { "rel_ira": +20, "seguranca": -5, "aprovacao": -8 },
      "requer_capacidade": { "inteligencia": ">40" },
      "reacao_feed": "tom:nada_publico; falcões furiosos se vazar",
      "efeito_no_fio": { "intensidade": -25, "pode_mutar": true }
    }
  ]
}
```

Campos-chave (o resto está no v1):
- **`fio`** — a qual Fio de Tensão este evento pertence. Liga a Carta à memória de longo prazo.
- **`efeito_no_fio`** — como a escolha do jogador realimenta a Camada 1. É o laço que faz suas ações *escreverem* a história.
- **`efeitos`** — **só chaves do vocabulário fechado (Parte 4), com teto.** A IA gera *dentro* dos trilhos das regras, nunca por cima.
- **`requer_capacidade`** — opções destravadas por quem você é (espionagem alta abre o canal secreto).

---

## PARTE 3 — A FICHA DO MUNDO (o chão da geração)

O que impede a IA de virar fantasia sem pé nem cabeça. Ao escolher **país + ano**, carrega-se um snapshot de **dados reais** que a Máquina é obrigada a respeitar. Ele é **estático a partida inteira** → candidato perfeito a *prompt caching* (Parte 6).

```
FICHA DO MUNDO = SNAPSHOT DO ANO  ⊕  FICHA DO PAÍS ESCOLHIDO

SNAPSHOT DO ANO (ex.: 2026)
  - tensões geopolíticas reais (EUA–Irã, Rússia–OTAN, China–Taiwan...)
  - tecnologia disponível (drones, cyber, nuclear — SIM; em 1891, NÃO)
  - baralho de temas plausíveis daquele recorte
  - atores globais e seus interesses

FICHA DO PAÍS (ex.: EUA-2026) — o schema de 10 categorias da Bíblia:
  identidade · economia · militar · recursos · ciência ·
  diplomacia (relações -100..+100) · estabilidade · opinião ·
  inteligência · geografia
```

**Como a ficha ancora a geração:** a Máquina só gera o Irã como ameaça porque `rel_ira` está baixa E o snapshot 2026 marca o programa nuclear iraniano como tensão ativa. Trocou pra Brasil-1891? Não existe "ataque cibernético" — a tecnologia não está na ficha do ano. A ficha é a **fronteira do plausível**.

> A construção dessas fichas reais (pipeline de dados: Banco Mundial, SIPRI, etc.) é uma entrega própria — mas para o **protótipo** começamos com **1 ficha feita à mão de alta qualidade** (proposta: EUA-2026), suficiente pra provar o motor.

---

## PARTE 4 — GUARDA-CORPOS: por que a geração não quebra o jogo

A IA é criativa no **texto e na situação**, mas **presa às regras** no que importa. Toda Carta gerada passa por validação antes de chegar a você:

1. **Vocabulário fechado de efeitos** — `efeitos` só podem tocar as chaves da lista abaixo. A IA não pode inventar `"exercito_x10": true`. Fora do vocabulário = Carta rejeitada e regenerada.
2. **Tetos por efeito** — nenhum efeito único move um medidor mais que um limite (ex.: ±25). Impede a IA de detonar o balanço num evento só.
3. **Coerência com a memória** — a IA recebe a `memoria` do fio e o estado atual; é instruída a não se contradizer. O estado é a fonte da verdade, não o texto.
4. **Fallback** — se a geração falhar/validar N vezes, ou a API cair, o motor puxa uma Carta da **biblioteca de reserva** (ex.: as cartas do arco v1). O jogo nunca trava.

### O Estado do Mundo (o vocabulário fechado)

```
MEDIDORES (0–100)                RECURSOS               NOVO NO v2
  aprovacao                        tesouro                fios[]  (Camada 1)
  estabilidade                     divida                 historico[] (rastro
  soft_power                       inteligencia             de decisões)
  seguranca      ← novo            capacidade_ind
  temp_guerra                      uranio    ← novo
  temp_economia
  liberdades                     RELAÇÕES (-100..+100)   FLAGS
                                   rel_<pais>              usou_nuclear
                                                           <pais>.em_guerra
```

Regra inalterada: **um efeito só toca chaves desta lista.** Quer variável nova? Adiciona aqui conscientemente. É a fronteira que a IA nunca cruza — e o que mantém o jogo balanceável.

---

## PARTE 5 — O NARRADOR E O FEED (Camada 3)

A Carta gerada carrega instruções, não texto final de feed. O Narrador transforma:
- **`narrativa`** → prosa na voz do `personagem` (o diretor da CIA fala diferente do secretário do Tesouro).
- **`reacao_feed`** (ex.: `"tom:tensao_contida; GNN cobra dureza"`) → posts vivos dos 5 veículos ficcionais (GNN hawkish, O Globo Terrestre moderado, Corneta Diária populista, Capital & Mercado econômico, A Voz Livre libertário) + cidadãos procedurais.
- Os posts **empurram os medidores de opinião**, que **destravam/travam** suas próximas ações. O feed não é enfeite — é mecânica.

Como IA é o motor (sem volta), Narrador e Gerador podem ser a **mesma chamada** (a IA devolve Carta + narrativa + posts de uma vez) para economizar, ou separados se quisermos um modelo mais barato só pro texto do feed.

---

## PARTE 6 — ARQUITETURA DE CUSTO (pagar pouco por partida)

IA em tempo real não precisa ser cara. Três alavancas:

1. **Prompt caching do contexto estático** — a Ficha do Mundo (país + ano) não muda a partida inteira. Manda uma vez, fica em cache; a cada tique só viaja o que mudou (estado atual, última ação, fios). Corte de ~80–90% no custo por turno.
2. **Uma chamada por tique** — Gerador + Narrador juntos. Um turno = uma ida à IA.
3. **Camada 1 é local** — os fios são pontuados/atualizados por regra em código, sem IA. Só a *geração do evento* usa o modelo.

Ordem de grandeza: uma partida de ~50–150 turnos ≈ 50–150 chamadas, a maioria com contexto cacheado. Com um modelo de custo médio e o cache, é barato o bastante pra rodar de verdade.

> O motor é desenhado agnóstico de fornecedor de IA — o contrato é "texto de contexto entra → Carta JSON válida sai". Trocar de modelo/fornecedor não mexe no jogo.

---

## PARTE 7 — O CONTRATO DE GERAÇÃO (o que entra e o que sai da IA)

Isto é o "preparar o ambiente pra IA" na prática — a interface exata:

**ENTRA (o prompt):**
```
[CACHEADO — uma vez por partida]
  · Regras do jogo + schema da Carta + vocabulário fechado de efeitos + tetos
  · Ficha do Mundo: snapshot do ano + ficha do país
  · Elenco: personagens do gabinete e suas personalidades
  · Os 5 veículos de mídia e seus vieses

[POR TIQUE — só o que mudou]
  · Estado do Mundo atual (medidores, recursos, relações)
  · Fios ativos + memória do fio escolhido como tema
  · Última ação do jogador
  · Instrução: "Gere UMA Carta que empurra o fio X, pressiona o eixo Y,
    respeita a ficha e as regras. Devolva JSON válido."
```

**SAI (validado antes de usar):**
```
  · Uma Carta (schema Parte 2) — título, narrativa, personagem, 2–3 opções
    com efeitos (vocabulário fechado), reacao_feed e efeito_no_fio
  · [opcional] atualização proposta dos fios (nascer/mutar) — também validada
```

Se o JSON é inválido, viola o vocabulário ou estoura um teto → regenera (1–2 tentativas) → senão, fallback da biblioteca. **O jogador nunca vê uma Carta quebrada.**

---

## PARTE 8 — PRÓXIMO PASSO: A FATIA VERTICAL

Pra sair do papel, a menor coisa que já mostra a fantasia funcionando:

- **1 país, 1 ano:** EUA-2026, ficha feita à mão de alta qualidade.
- **Estado do Mundo** + 7 medidores + tesouro/urânio/inteligência.
- **Camada 1 (Fios)** rodando em código, começando com 2–3 fios semente (ex.: Irã, economia, fratura interna).
- **Camada 2 (Gerador)** chamando a IA com o contrato da Parte 7 + validação + fallback.
- **Camada 3:** narrativa + feed dos 5 veículos.
- **A tela:** globo 3D (`globe.gl`, com alternância textura/marcações) no centro, país selecionado; console de HUDs à direita (PIB, opinião, militar, espionagem, missões, urânio, publicidade, políticas); feed rolando no rodapé.

Stack ainda em aberto — o motor é dados+regras+contrato de IA, indiferente a arquivo único ou React. A stack só pesa na hora de montar a tela.

---

*Fim do v2. Próxima decisão sua: revisar esta arquitetura, ou mandar eu começar a fatia vertical (e aí escolhemos stack + você me manda seu globo).*
