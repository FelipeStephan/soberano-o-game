# ENREDO E CAMPANHA — o rumo que falta ao SOBERANO

> Documento de DECISÃO, escrito em 2026-07-28. Nada aqui está implementado.
> É para ser lido, discutido e batido — depois vira código.
> Complementa `PROXIMOS-PASSOS.md` (o que fazer) explicando **por que jogar**.

---

## 1. O DIAGNÓSTICO

O dono resumiu assim: *"o jogo tem milhares de funcionalidades, milhares de funções,
mas sem rumo, sem história."*

Está certo, mas o problema é mais preciso do que "falta história":

> **O jogador não consegue dizer, numa frase, o que está tentando fazer.**

Ele abre o jogo e tem ~60 ações disponíveis, todas igualmente válidas. A barra de
Destino sobe quando as coisas vão genericamente bem. Isso não cria **escolha**, cria
**otimização** — e otimização sem trade-off vira tarefa doméstica. O jogador não sente
que está escolhendo um caminho; sente que está zelando por planilhas.

Faltam quatro coisas, nesta ordem de importância:

1. **Um objetivo nomeável** — "sobreviver dez anos e terminar como a maior potência"
2. **Um rumo que é seu e não do vizinho** — o "cada um segue um rumo"
3. **Pressão recorrente** que force decisão em vez de acúmulo
4. **Um placar visível o tempo todo**, não só no fim

O jogo já tem os materiais dos quatro. Eles nunca foram amarrados.

---

## 2. A ESPINHA: A DÉCADA

**Um dado que já está no código e nunca foi nomeado:**

```
ERA_TURNO_MAX = 120 batidas   (jogo/motor.js:51)
BEAT_S        = 30 segundos   (ui/tempoReal.js:24)
120 × 30s     = 3.600s        = EXATAMENTE 60 MINUTOS
```

**Uma partida = 10 anos de jogo = 1 hora real.** Essa é a espinha. Ela já existe;
só precisa ser dita ao jogador na primeira tela.

### Os três desfechos (todos já implementados)

| Desfecho | Quando | O que acontece | Onde já está |
|---|---|---|---|
| **Império** | Destino ≥ 95 | Fechou o tabuleiro. Encerra a partida para todos. | `jogo/destino.js` → `checarDestino` |
| **Legado** | Chegou aos 120 meses de pé | Entra no ranking final. É aqui que se decide "o melhor país". | `checarDestino` (tipo `legado`) |
| **Queda** | Aprovação ou estabilidade zeram | Fora. A Máquina assume o país; você recomeça com outro. | `jogo/efeitos.js` → `checarFim` + `ui/renascer.js` |

---

## 3. AS DOUTRINAS — o "rumo" de cada um

**A peça central.** No começo da partida você escolhe uma Doutrina. Ela **não trava
nada** — você continua podendo fazer tudo. O que ela muda é **como você é medido**.

Cinco doutrinas, cada uma amarrada a um sistema que **já existe e está subutilizado**:

| Doutrina | O que te faz grande | Sistemas que ela finalmente usa |
|---|---|---|
| **O CONQUISTADOR** | Território sob a sua bandeira | guerra, campanha por estados, anexação, bases militares |
| **O INDUSTRIAL** | PIB, petróleo e o arsenal do mundo | empresas, mercado, encomendas, `tec_petroleo` |
| **O ARQUITETO** | O bloco que você construiu e manteve de pé | alianças, Conselho de Segurança, socorro a aliado |
| **O FAROL** | Vidas salvas e guerras encerradas | cura de pandemia, mediação, ajuda humanitária, paz global |
| **A SOMBRA** | O que você conseguiu sem assinar nada | espionagem, fake news, golpes, sanções |

**Por que essas cinco:** cada uma consome um subsistema inteiro que hoje quase ninguém
toca. O FAROL sozinho justifica todo o motor de pandemia e mediação. A SOMBRA dá
propósito à espionagem, hoje a mecânica mais órfã do jogo.

### Regra de ouro
**Doutrina é PÚBLICA. Objetivo é SECRETO.**
Todos veem que o Brasil é Industrial — isso permite aliança, rivalidade e chantagem.
Ninguém sabe que o objetivo específico dele é *controlar três estados petrolíferos*.
É a mesma lógica do envelope selado da ONU, que já provou funcionar em jogo.

---

## 4. O MANDATO — a pressão que vira enredo

O que transforma a Doutrina de regra de pontuação em **história**.

**A cada 2 anos (24 batidas), o seu próprio país te cobra.** Cinco Mandatos por década,
escalando em dificuldade, sempre derivados da sua Doutrina.

```
MANDATO II · O CONQUISTADOR
"O Estado-Maior não aceita mais promessa. Ou a bandeira sobe em mais quatro
 territórios até o Ano IV, ou eles procuram alguém que faça."

 CUMPRIR  → +estabilidade, +aprovação, o próximo Mandato é mais ambicioso
 FALHAR   → −estabilidade, −aprovação, e o gabinete começa a conspirar
```

Resolve três problemas de uma vez:
- dá **rumo minuto a minuto**
- cria **fracasso parcial** (dá pra falhar um Mandato e se recuperar)
- faz a **queda ter causa narrativa** em vez de ser uma barra que zerou

**Ritmo:** relatório anual nos anos ímpares, Mandato nos pares. Nunca dois eventos na
mesma virada de ano.

---

## 5. OS TRÊS ATOS

Sessenta minutos pedem estrutura. O mundo **muda de comportamento** ao longo da década:

**ATO I — Anos 1 a 3 (18 min). O mundo frio.**
Agressão automática quase zero — o rebalanceamento de `agressao.js`/`mundoVivo.js` já
entrega isso. Tempo de escolher aliados, montar economia e aprender sem morrer. O
primeiro Mandato é fácil de propósito.

**ATO II — Anos 4 a 7 (24 min). O mundo endurece.**
NPCs ficam ambiciosos, pandemias aparecem, o Brent oscila mais. É onde as alianças são
testadas e onde a maioria das quedas acontece.

**ATO III — Anos 8 a 10 (18 min). A Corrida.**
O Índice Mundial vira **público e permanente** na tela de todos. Todo mundo vê quem
está ganhando — e vira contra o líder. O cooldown do Conselho de Segurança cai pela
metade: é a hora de sabotar quem está na frente por via institucional.

O Ato III é o que dá **clímax** em vez de a partida simplesmente acabar.

---

## 6. COMO O JOGO DECIDE "O MELHOR PAÍS"

Com doutrinas assimétricas é preciso um denominador comum — senão é comparar laranja
com tanque.

```
LEGADO = feitos da SUA doutrina  (peso 3)
       + feitos das outras       (peso 1)
       + Destino final
```

**O motor já existe:** `jogo/feitos.js` registra tudo por categoria e já entrega títulos
anuais. Falta a soma final e a ponderação por doutrina.

A tela final entrega **duas coisas ao mesmo tempo**:
- **Um campeão único** — o maior Legado. É a resposta a "quem foi o melhor".
- **Uma coroa por doutrina** — "o maior Conquistador da década", "o maior Farol".

Assim ninguém sai de mãos vazias, e quem foi ótimo no próprio caminho e perdeu no geral
ainda tem o que contar. É o modelo do Civilization: uma pontuação, várias vitórias.

---

## 7. SOBREVIVER — e o preço de cair

Hoje cair custa pouco: vira espectador e assume outro país (`ui/renascer.js`). Para uma
campanha de dez anos isso precisa **doer sem expulsar ninguém da mesa**.

**Proposta: quem cai volta, mas não disputa mais o título.**
Você reentra com um país livre, joga os anos que sobraram, e recebe um papel novo:

> **O ESTRAGA-PRAZERES**
> Seu Legado está zerado. Mas você pode derrubar quem está na frente: entrar em guerra,
> votar na ONU, quebrar alianças, vender armas para o segundo colocado.

**Por que é bom:** mantém a pessoa jogando com poder real, cria uma ameaça que os
líderes precisam gerenciar, e preserva o peso da derrota. Quem cai no Ano 2 tem oito
anos de vingança pela frente — e isso é mais divertido que "tentar de novo".

---

## 8. A ABERTURA: história e tutorial na mesma cena

**Não fazer tutorial separado.** Ninguém lê. A história **é** o tutorial.

**Cena 1 — O mundo (20s).** Globo girando, manchetes de 2026 subindo.
*"Dez anos. Vinte nações. Uma vai ser lembrada."*

**Cena 2 — A escolha do país** (tela que já existe), com enquadramento novo: você não
escolhe um avatar, **herda um problema**.

**Cena 3 — A Doutrina.** Cinco cartas, cada uma com uma promessa:
*"O FAROL — o mundo vai lembrar do que você curou, não do que você conquistou."*

**Cena 4 — O Primeiro Conselho de Ministros.** *Aqui mora o tutorial.* O gabinete
apresenta **três decisões obrigatórias**, uma por vez, e cada uma ensina uma tela:
- uma que exige distribuir tropa → ensina o Estado-Maior
- uma que exige gastar dinheiro → ensina a fila de comando e o custo em tempo
- uma que exige falar com outro país → ensina diplomacia (ou o telefone, no online)

Sem overlay de setas, sem "clique aqui". Você aprende **fazendo a primeira jogada de
verdade**, e ela já é irreversível. Usa `dados/dramaturgia.js`, que já tem esse tom.

**Cena 5 — O Mandato I.** Seu país diz o que espera de você. A partida começa.

---

## 9. O CAMINHO OFFLINE — A Campanha da Década

O online tem rivalidade humana de graça. **O offline precisa de outra fonte de tensão** —
senão é você contra planilhas. Três peças resolvem.

### 9.1 O RIVAL — a Máquina escolhe um antagonista

No início da campanha, a Máquina elege **um país NPC com a MESMA doutrina que a sua** e
o promove a Rival. Ele não é um inimigo genérico: ele **corre a mesma corrida**.

- O Rival aparece no topo, ao lado do seu Legado, com o Legado dele.
- Ele age de acordo com a doutrina (o Conquistador invade, o Farol cura, o Industrial
  compra petróleo) — reusando `mundoVivo.js` e `agressao.js`.
- Ele **comenta você** no X, com a voz dele, via `dados/vozesX.js` (já existe).
- No Ato III ele fica desesperado e joga sujo.

Isso dá offline a coisa que o online tem de graça: **alguém para vencer**.

### 9.2 AS MISSÕES — o enredo em etapas

A campanha offline é uma **cadeia de missões da sua doutrina**, distribuída pelos três
atos. Todas são checáveis contra o estado que o jogo já mantém.

**Estrutura por ato:** 2 missões obrigatórias (a linha principal) + 1 opcional (que
melhora o final). Nove missões por campanha, cinco campanhas.

#### Exemplo completo — O CONQUISTADOR

| Ato | # | Missão | Verificação (estado já existente) |
|---|---|---|---|
| I | 1 | **A Primeira Fronteira** — tome 3 territórios de um vizinho | `donoEstado` |
| I | 2 | **Bota no Chão** — instale uma base militar fora do seu país | `estado.bases` |
| I | ★ | *A Doutrina Declarada* — chegue ao Ano III sem perder território* | `meusPerdidos` |
| II | 3 | **A Capital Cai** — tome a capital de uma nação | `campanha.tomouCapital` |
| II | 4 | **Província** — anexe um país inteiro | `ocupacoes[x].anexado` |
| II | ★ | *Sem Testemunhas* — faça isso sem ser condenado na ONU | `penasONU` |
| III | 5 | **Três Bandeiras** — três nações anexadas ao mesmo tempo | `paisesAnexados` |
| III | 6 | **O Bloco Rival Quebrado** — derrote o Rival ou destrua a aliança dele | `aliancas` |
| III | ★ | *Imperador* — Destino ≥ 95 | `calcularDestino` |

#### As outras quatro linhas, em resumo

**O INDUSTRIAL** — dobrar o PIB → controlar 3 estados petrolíferos → virar fornecedor de
3 países (encomendas) → 60+ de `tec_petroleo` → terminar a década como maior PIB do mundo.

**O ARQUITETO** — fundar uma aliança → 4 membros → honrar um socorro sem desertar →
aprovar uma pena no Conselho → chegar ao Ano X com o bloco intacto.

**O FAROL** — financiar a primeira cura → mediar um conflito alheio até o fim → uma
década sem iniciar guerra → derrubar a tensão global abaixo de 10 → **PAZ MUNDIAL**
(`climaGlobal().nivel === 'paz'`).

**A SOMBRA** — rede de espionagem em 3 países → derrubar um governo sem declarar guerra →
plantar uma fake news que mude o Índice → conseguir tudo isso sem nunca aparecer no
Conselho de Segurança.

### 9.3 OS FINAIS — o "tendo um final" que o dono pediu

O final offline **não é um só**. Depende de quanto da cadeia você fechou:

| Final | Condição | Tom |
|---|---|---|
| **O IMPÉRIO** | Todas as obrigatórias + todas as ★ + Destino ≥ 95 | O melhor final. Raro. |
| **A DÉCADA É SUA** | Todas as obrigatórias + Legado maior que o do Rival | O final "bom" padrão |
| **O SEGUNDO NOME** | Obrigatórias cumpridas, mas o Rival te superou | Amargo. Você fez tudo e não bastou. |
| **MANDATO CUMPRIDO** | Chegou aos 10 anos, cadeia incompleta | Honesto. Nem herói, nem fracasso. |
| **A QUEDA** | Deposto antes do Ano X | Já implementado, com a vigília explicando o porquê |

**Cada final tem um epílogo escrito** — o que aconteceu com o seu país nos vinte anos
seguintes. É o que faz o jogador querer jogar de novo com outra doutrina.

### 9.4 Por que missões funcionam offline e não engessam o online

No online, missão fixa seria camisa de força (o mundo é imprevisível, os outros jogadores
estragam qualquer roteiro). Offline, a Máquina controla o mundo — dá para garantir que a
missão seja possível. Por isso:

- **Offline:** cadeia de missões + Rival + finais múltiplos
- **Online:** Doutrina + Mandatos + ranking de Legado entre humanos

A espinha (Década, Doutrina, Legado, três atos) é **a mesma nos dois**. Só a fonte de
tensão muda: Máquina offline, gente online.

---

## 10. ORDEM DE IMPLEMENTAÇÃO

**Fase 1 — A espinha. 🟢 FEITA em 2026-07-28.** Escolha de Doutrina + cálculo de
Legado no fim (reusa `feitos.js`) + tela final com campeão e coroas.
*Sozinha, já dá rumo ao jogo inteiro.* É a fase de maior retorno por linha de código.

> **O que entrou:** `jogo/doutrinas.js` (motor puro: as cinco doutrinas, o acumulador
> de dez anos, o cálculo de Legado, o pódio e as coroas), `ui/doutrina.js` (as cinco
> cartas na abertura + o bloco de Legado injetado na tela de fim + a insígnia no topo)
> e `estilo-doutrina.css`. Amarrado em `ui/jogo.js` (abertura, virada de ano, tela
> final, topo) e em `jogo/indiceMundial.js` — a doutrina, o Legado e o Destino de cada
> humano viajam dentro do pacote `statsVivos` que já saía a cada batida, sem evento
> novo no relay.
>
> **Detalhes que valem lembrar antes de mexer:**
> - O Legado NÃO pode ser calculado lendo `feitos.registros`: `limparAno` apaga os
>   registros crus todo ano. Por isso existe `estado.doutrina.tally`, somado na virada
>   de ano **antes** do `limparAno`, com trava por ano contra a batida em dobro do online.
> - Feito negativo (ogiva, sanção sofrida, território perdido) **não** ganha o ×3 da
>   doutrina. Punição com desconto não é punição.
> - O relógio local pausa enquanto as cartas estão abertas (`.dt-over` entrou na mesma
>   lista de `ui/tempoReal.js` que já pausava para modal e cena).
> - O fim da partida abre com uma **cinemática de 15s** em cinco cenas
>   (`ui/fimAbertura.js`), no mesmo chassi visual da abertura do Conselho — o dossiê
>   completo entra depois dela, inalterado. Cena para sentir, cartão para conferir.
>   Ela serve aos três desfechos: o tom (cor, selo, texto) pergunta a `tomDoFim`.
> - A calibragem está no comentário de `VALOR` em `doutrinas.js`: uma década ativa
>   fecha entre 200 e 300, na mesma ordem de grandeza do Destino, para que nenhuma das
>   duas metades da conta vire decoração.

**Fase 2 — O ritmo.** Os cinco Mandatos e os três Atos.

**Fase 3 — A abertura.** As cinco cenas com o tutorial embutido.

**Fase 4 — A campanha offline.** Rival + cadeia de missões + finais múltiplos.

**Fase 5 — O Estraga-Prazeres.** O papel de quem caiu, no online.

---

## 11. RISCOS — o que pode dar errado

**Sessenta minutos pode ser longo demais para uma sala online.**
Juntar seis pessoas por uma hora inteira é difícil. Oferecer na criação da sala:
**Década** (10 anos, 60 min) e **Meia-Década** (5 anos, 30 min), mesma estrutura com os
três atos comprimidos.

**Doutrina pode virar camisa de força.**
Se o Conquistador sentir que não pode fazer diplomacia, o jogo empobrece. Por isso feitos
fora da doutrina contam **peso 1, não zero** — desviar custa eficiência, não legitimidade.

**O single-player pode ficar mais fraco que o online.**
É o risco que a seção 9 existe para cobrir. Decidir se o offline é o *tutorial da
campanha online* ou um modo com valor próprio. A recomendação deste documento é a
segunda: com Rival e finais múltiplos, o offline tem motivo para ser rejogado cinco
vezes — uma por doutrina.

**Missões podem virar checklist.**
O antídoto é o Rival: se a missão é "anexe um país" e o Rival está anexando ao mesmo
tempo, deixa de ser tarefa e vira corrida.

---

## 12. O QUE JÁ EXISTE E SERÁ REUSADO

| Peça | Arquivo | Para quê |
|---|---|---|
| Relógio de 120 batidas | `jogo/motor.js`, `ui/tempoReal.js` | A Década |
| Destino + bandas + fim de era | `jogo/destino.js` | Os três desfechos |
| Registro de feitos e títulos | `jogo/feitos.js` | O cálculo de Legado |
| Retrospectiva anual | `ui/relatorioAno.js` | O ritmo dos anos ímpares |
| Índice Mundial | `jogo/indiceMundial.js` | O placar do Ato III |
| Vozes do X com reputação | `dados/vozesX.js` | A voz do Rival |
| Clima global e paz | `jogo/mundoVivo.js` | Missão final do FAROL |
| Conselho de Segurança | `ui/onu.js` | Missões do ARQUITETO e da SOMBRA |
| Encomendas | `jogo/encomendas.js` | Missões do INDUSTRIAL |
| Socorro a aliado | `jogo/coalizao.js` | Missões do ARQUITETO |
| Espectador e renascer | `ui/renascer.js` | O Estraga-Prazeres |
| Veredito e tom | `dados/dramaturgia.js` | A abertura e os epílogos |

**Quase nada precisa ser construído do zero.** O que falta é a amarração — e é
exatamente por isso que o jogo parece rico e sem rumo ao mesmo tempo.

---

## 13. DECISÕES QUE PRECISAM DO DONO

Duas foram **batidas na implementação da Fase 1** porque o código não podia esperar por
elas — as duas seguiram a recomendação deste documento, e as duas são reversíveis:

2. ~~**Doutrina pública ou secreta?**~~ → **PÚBLICA.** Ela aparece como insígnia no topo
   e no pódio final. É o que permite aliança, rivalidade e chantagem: informação que só
   aparece na tela final não é pública, é surpresa. *Para tornar secreta:* apagar a
   chamada a `insigniaDoutrinaHTML` em `renderTopo` e o campo `dout` de `statsVivos`.
5. ~~**Cinco doutrinas é o número certo?**~~ → **CINCO**, como no documento. *Mexer é
   barato:* `DOUTRINAS` e `ORDEM_DOUTRINAS` em `jogo/doutrinas.js` são declarativos, e
   a tela usa `auto-fit` — tirar ou acrescentar uma não quebra layout nenhum.

As três que continuam abertas, e que só importam a partir da Fase 2:

1. **Década (60 min) ou Meia-Década (30 min) como padrão?**
3. **Quem cai vira Estraga-Prazeres ou volta disputando normalmente?**
4. **O offline é modo próprio ou tutorial do online?** (a recomendação é modo próprio)
