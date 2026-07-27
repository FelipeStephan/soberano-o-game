# BACKLOG LOTE 3 — pedidos do dono (2026-07-18, sessão longa)

Status: `🔴 a fazer` · `🟡 em execução` · `🟢 feito`
Complementa `BACKLOG-ONLINE.md` e `METODOLOGIA-ONLINE.md`.

---

## GRUPO 1 — ALIANÇAS EM CASCATA

### #1.1 Atacar membro de aliança → TODOS ficam hostis 🔴
Se eu ataco um país que pertence a uma aliança (online), **todos os membros daquela
aliança** ficam hostis comigo (relação despenca, vermelho no meu mapa).
E para os aliados do atacado: **o atacante fica vermelho no mapa de todos eles** —
mas só quando a aliança tem **apoio militar (defesa mútua)** ativado.

---

## GRUPO 2 — ANEXAÇÃO COMPLETA (o país vira MEU de verdade)

### #2.1 País anexado adere ao país-mãe 🔴
- Pintado com a **cor do país-mãe** (verde/minha cor), como se fosse eu.
- **Sem milícia/insurgência** — acabou a ocupação, é território nacional.
- **Hover diferente**: "antigo **[País X]** · DOMINADO POR [mãe]" (com risco no nome).
- **Clicar nele = clicar no meu próprio país**: consigo destinar tropa a partir dali.

### #2.2 Unir forças de verdade (investigar TUDO que deve impactar) 🔴
Ao anexar, somar ao país-mãe: **arsenal militar**, **PIB**, petróleo, território,
população/efetivo. A jogabilidade precisa estar minuciosamente conectada.

### #2.3 País anexado NÃO tem mais "planejar ofensiva" nem "espionar" 🔴
É meu país — essas opções somem do painel dele.

### #2.4 Anexação visível no online com hover próprio 🔴
Outros jogadores veem o país como parte do conquistador, com hover:
"conquistado — [risco no nome original] — por [país de origem]".

### #2.5 DEVOLVER território anexado 🔴
Poder devolver a soberania (com impacto no online: todos veem voltar).

---

## GRUPO 3 — DEFESA E DISTRIBUIÇÃO (reforma da UI de tropas)

### #3.1 Modo Defesa: MAPA em vez de lista 🔴
Ao ser atacado: **mapa do meu país** com os estados **pulsando suavemente** onde o
ataque está caindo. Ações rápidas:
- "REFORÇAR TODAS AS REGIÕES" com **barra de tamanho da força**
- ou seleção manual por estado, com barra — sempre consumindo a reserva.

### #3.2 Ataque via frota marinha tem comportamento diferente 🔴
Ataque naval (sem o modal de declaração de guerra) → resposta defensiva distinta.

### #3.3 Distribuir tropas: começar VAZIO + doutrina + barra 🔴
Por padrão **sem forças posicionadas**; o jogador escolhe a **doutrina** e ajusta o
**tamanho da força** numa barra (o restante fica na reserva, visível).
Rever o termo "reserva" — a ideia é posicionar força no geral (soldados, navios…).

### #3.4 Inputs do modal de estado mostram a QUANTIDADE REAL 🔴
Hoje os `+/-` mostram sempre **0**. Devem mostrar **quanto já existe naquela região**
(por item: terra/ar/mar), para eu aumentar/diminuir sabendo onde estão meus caças.
Manter "recolher tudo". Vale também durante guerra/dominação.

---

## GRUPO 4 — GUERRA

### #4.1 Botão "SAIR DA GUERRA" em Decidir 🔴
Hoje só existe "manter a ordem". Precisa de um botão bonito para encerrar a guerra.

### #4.2 Ataque em SEGREDO + inteligência revela 🔴
Investigar: hoje a ofensiva fica secreta durante o preparo?
Desejado: **mísseis só aparecem quando o tempo da ação termina**; para o atacante,
apenas **linha vermelha com status "preparação" + tempo**. Se um país tem
**inteligência alta**, descobre e **divulga para todos** — o mapa mostra a intenção
de ataque de X para Y.

---

## GRUPO 5 — BASES MILITARES COM SENTIDO

### #5.1 Escolher base de origem do ataque 🔴
Ao atacar, escolher **de qual base** sai a força. Ataque de país distante custa
**mais recursos e dinheiro**; de base próxima, **bem menos**. Investigar a integração
(já existe `basesQueAlcancam` e desconto por ponto de lançamento) e reforçar.

---

## GRUPO 6 — NUCLEAR

### #6.1 Zona morta visível para TODOS no online 🔴
País atingido vira **zona morta no mapa de todo mundo**.

### #6.2 Jogador nuclearizado tem status de MORTO 🔴
"Não sobrou nada" — e todos veem.

### #6.3 Urânio acaba (anti-roubo) 🔴
Cada ogiva consome urânio; para fazer outra, precisa **produzir mais urânio**.

### #6.4 Opção de partida SEM armas nucleares automáticas 🔴
Ao iniciar o jogo, poder desligar o arsenal nuclear inicial dos países.

---

## GRUPO 7 — CIÊNCIA E ECONOMIA

### #7.1 Ações de ciência para PETRÓLEO 🔴
Aumentar produção de petróleo: opções **caras** (salto grande) e **baratas**
(aumento sutil). Estudar junto com a economia do jogo.

---

## GRUPO 8 — MÍDIA

### #8.1 FAKE NEWS pelo perfil "Choquei" 🔴
Nova ação em MÍDIA: o jogador **escreve a própria notícia**, paga (~US$ 1 mi) e ela
**aparece para todo mundo** no X com o perfil **Choquei** (logo própria).
Efeito aleatório: influência sobe sutil; aprovação sobe **ou** desce.

---

## GRUPO 9 — ONU (só no online) 🔴

Sala de reunião do Conselho:
- Solicitar reunião: **título/tema**, **país-foco**, **ação proposta**.
- Notifica todos os jogadores online; janela mostra quem aceitou participar.
- **Votação**: cada país tem um botão (aceita/rejeita); maioria decide.
- **Microfone aberto** (WebRTC já existe na telefonia) + chat; botão "pedir a palavra".
- UI **intimidadora**: foto e nome do país sancionado no centro, título da reunião,
  a pena proposta em destaque.
- Penas que impactem de verdade: **sanções econômicas**, **congelar recursos**
  (o país perde acesso ao caixa), embargo de armas, suspensão de comércio.
- Caso de uso: espionagem descobre um ataque → convoca a ONU → congela os recursos.

---

## GRUPO 10 — BLOCOS

### #10.1 Bloco criado entra no menu "Blocos" do cabeçalho 🔴
Junto dos blocos existentes, ao lado de "Índice".

### #10.2 Mensagens para o bloco 🔴
Mandar mensagem para todos os membros (chat do bloco).

---

## GRUPO 11 — ESTUDO DE COMPORTAMENTO

### #11.1 O que fazer quando o jogador perde e quer voltar? 🔴
Perguntas a responder no estudo:
- Ele volta com o mesmo país? A Máquina assume o país dele?
- Se voltar com outro país, o que acontece com o antigo (para não quebrar o mundo
  daquela sala)?
- Como reentrar sem bagunçar a partida em andamento.
Entregar como **documento de decisão**, não código.
