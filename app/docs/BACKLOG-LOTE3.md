# BACKLOG LOTE 3 — pedidos do dono (2026-07-18, sessão longa)

> **ENTREGUE na 1ª rodada (commit 9359259):** #1.1 (cascata de alianças),
> #2.1/#2.2/#2.3/#2.5 (anexação vira província, forças unidas, painel próprio,
> devolver soberania), #2.4 parcial (hover "ANEXADO POR X"), #8.1 (Fake News).
> **Bugs graves achados e corrigidos no caminho:** anexar fazia PERDER o petróleo do
> país anexado; a milícia despedaçava o território anexado estado por estado; o
> índice mundial nunca contava as reservas conquistadas (NaN).
>
> **ENTREGUE na 2ª rodada (2026-07-27):** #3 inteiro (defesa vira mapa, ataque naval
> tem resposta própria, distribuir tropa ganha barra de força e para de semear
> guarnição sozinho, o input do estado mostra o estoque real), #4 inteiro (sair da
> guerra + ofensiva secreta com detecção por inteligência), #5 (penalidade de
> distância pra quem ataca de casa), #6 inteiro (zona morta e nação morta ecoando
> pra sala, urânio consumido pela ogiva, opção de partida sem nucleares), #7
> (ciência → petróleo), #10.2 (chat do bloco), #11 (decisão tomada — opção B — E
> implementada). **Fora do backlog original:** direito de base por aliança militar.
> **FALTA de verdade:** só o microfone em grupo da ONU (#9), que ficou fora por
> custo de infraestrutura — ver `docs/PROXIMOS-PASSOS.md`.
>
> **Bugs achados na revisão do diff e corrigidos junto (2ª rodada):** `ocupacoes`
> guarda as anexações de TODA a sala (o evento traz `por`), mas metade do código lia
> só o flag `.anexado` — então uma província anexada pela Rússia era pintada de
> dourado no meu mapa, abria o painel "SUA NAÇÃO" com o botão de devolver a soberania,
> e o petróleo dela entrava na MINHA produção nacional. Agora a fonte única é
> `anexadoPor`/`paisAnexado` (`jogo/territorio.js`). No mesmo caminho: `donoDe` nunca
> consultou a anexação, apesar de `acaoAnexar` prometer no comentário que ela
> "resolve a posse quando o catálogo chegar" — quem recebia o evento `anexacao` de
> outro jogador quase nunca tinha aquele país carregado, e a província voltava a
> aparecer como nação soberana. E o servidor não guardava anexação nenhuma em
> `mundoSala`, então quem entrava tarde (ou renascia na sala, #11) nunca ficava
> sabendo — agora guarda, e `aplicarEstadoSala` aplica.

Status: `🔴 a fazer` · `🟡 em execução/parcial` · `🟢 feito`
Complementa `BACKLOG-ONLINE.md` e `METODOLOGIA-ONLINE.md`.

---

## GRUPO 1 — ALIANÇAS EM CASCATA

### #1.1 Atacar membro de aliança → TODOS ficam hostis 🟢
Se eu ataco um país que pertence a uma aliança (online), **todos os membros daquela
aliança** ficam hostis comigo (relação despenca, vermelho no meu mapa).
E para os aliados do atacado: **o atacante fica vermelho no mapa de todos eles** —
mas só quando a aliança tem **apoio militar (defesa mútua)** ativado.

---

## GRUPO 2 — ANEXAÇÃO COMPLETA (o país vira MEU de verdade)

### #2.1 País anexado adere ao país-mãe 🟢
### #2.2 Unir forças de verdade (investigar TUDO que deve impactar) 🟢
### #2.3 País anexado NÃO tem mais "planejar ofensiva" nem "espionar" 🟢
### #2.4 Anexação visível no online com hover próprio 🟡
Hover "ANEXADO POR X" entregue na 1ª rodada. Ainda falta o texto completo pedido
("conquistado — [risco no nome original] — por [país de origem]") em todos os
lugares onde o país anexado aparece no online, não só no hover principal.
### #2.5 DEVOLVER território anexado 🟢

---

## GRUPO 3 — DEFESA E DISTRIBUIÇÃO (reforma da UI de tropas) 🟢

### #3.1 Modo Defesa: MAPA em vez de lista 🟢
Reescrito em `app/src/ui/defesa.js`. Ao ser atacado, abre o mapa do seu país com os
estados ameaçados **pulsando** (`.def-pulso`), barra de **TAMANHO DA FORÇA** e clique
por estado para reforçar exatamente ali. A projeção (achatar o país num SVG) foi
extraída para `app/src/ui/projecao.js` — módulo novo, compartilhado com
`ui/mapaEstados.js`, pra não ter duas matemáticas diferentes sobre a forma do mesmo
país.
**Bug corrigido no caminho:** o "ALVO PROVÁVEL" lia só `dados.alvoEstado`; o evento
`guerra` mandava `alvoEstado: null` cravado (`ui/guerra.js`) e `ataque_estado` mandava
`estadoId` — então o crosshair caía sempre no primeiro estado da lista. A função
`alvosProvaveis()` em `ui/defesa.js` agora lê todas as chaves reais e, na ausência de
declaração, deduz pela mesma `ordemDeQueda()` que o motor usa pra derrubar território.

### #3.2 Ataque via frota marinha tem comportamento diferente 🟢
Ataque naval abre o Modo Defesa em modo naval (`via: 'naval'`): a ameaça acende no
**litoral** mais perto da frota (não na fronteira terrestre) e a ação rápida vira
"COBRIR O LITORAL" (`cobrirLitoral()` em `ui/defesa.js`). Disparado a partir de
`ui/online.js` quando chega um evento `naval` sem `alvoFrota`.

### #3.3 Distribuir tropas: começar VAZIO + doutrina + barra 🟢
`ui/distribuir.js` ganhou a barra de **TAMANHO DA FORÇA** (a `fracao` que
`distribuirAuto` já aceitava em `jogo/territorio.js` — só faltava expor). E o jogo
parou de semear guarnição sozinho no início: `semearGuarnicoes(estado, { fracao = 0 })`
em `jogo/territorio.js:368` agora só semeia se alguém passar `fracao > 0` — por
padrão a tropa inteira nasce na reserva, e o jogador escolhe onde ela vai.

### #3.4 Inputs do modal de estado mostram a QUANTIDADE REAL 🟢
`ui/reforco.js`: o campo `+/-` de cada unidade agora nasce com `value="${aqui}"` (o
estoque REAL daquela região), não `0`. O `recalc()` (linha ~185) trata o número
digitado como o **estoque final desejado**, não o delta — `envio[u] = v - aqui` — com
clamp em `0..aqui+noQuartel`. "Recolher tudo" continua funcionando.

---

## GRUPO 4 — GUERRA 🟢

### #4.1 Botão "SAIR DA GUERRA" em Decidir 🟢
`sairDaGuerra(estado, iso)` (já existia em `jogo/paz.js:159`) ganhou porta: botão em
`ui/jogo.js` (`abrirPainelPais`, ~linha 1210), tanto no painel do país em guerra
quanto no painel de ocupação — nos dois lugares onde só havia "MANTER A ORDEM". Abre
painel de confirmação com a conta (aprovação, "vencendo = covardia" vs. "impopular =
alívio"). Ecoa na sala via evento `saida_guerra` (`ui/online.js`); o outro lado
recebe a proposta (`retiradaRecebida()`) e decide se encerra também ou continua
avançando sobre quem recuou.

### #4.2 Ataque em SEGREDO + inteligência revela 🟢
Reescrito o ciclo de ofensiva. Durante o preparo (`jogo/ofensiva.js`): nada é
publicado, o atacante vê só a linha de "preparação" (`iniciarPreparoOfensiva()` em
`ui/guerra.js`) com boletins de mobilização. `chanceDeteccaoAlvo(estado, op)`
(`jogo/ofensiva.js:35`) roda a cada batida usando a **inteligência real do alvo
humano** (via `estado._statsHumanos`, transmitida em `statsVivos`) — quando detecta,
sobe o evento público `ofensiva_detectada` (`ui/jogo.js:avisarOperacoesDetectadas`,
`ui/online.js:intencaoDeAtaque`) e o alvo entra em Modo Defesa com o eixo real do
avanço. Os mísseis e a esquadrilha só existem no impacto
(`cenaOfensivasResolvidas` em `ui/jogo.js`), onde sai o evento `guerra` de verdade.

---

## GRUPO 5 — BASES MILITARES COM SENTIDO 🟢

### #5.1 Escolher base de origem do ataque 🟢
Penalidade de distância pra quem ataca de casa: `multiplicadorDistanciaCasa()` em
`ui/guerra.js` (curva quadrática, sem penalidade até 2.000 km, teto 2,2× a 15.000 km)
compõe com o desconto de cada base em `custoFinalDeploy()` — uma fórmula única usada
no painel e no clique de lançar (antes eram duas fórmulas que podiam divergir).
CSS isolado em `estilo-bases.css`.

### NOVO (fora do backlog original) — Direito de base por aliança militar 🟢
Fundar uma aliança militar não dava nada de concreto no mapa. Agora, dá pra instalar
base em país de um bloco de que você participa **desde que o bloco seja militar**
(`militar: true` e `intensidade >= INTENSIDADE_MINIMA_BASE` = 55, `dados/bases.js`) e
a relação não esteja negativa — sai 25% mais barato
(`DESCONTO_BASE_ALIADO`/`custoInstalacao()`), e o preço na tela é o mesmo que o caixa
debita. Se o pacto cair, a base é expulsa: `expulsarBasesSemPacto()` é varrida a cada
batida em `jogo/motor.js`.

---

## GRUPO 6 — NUCLEAR 🟢

### #6.1 Zona morta visível para TODOS no online 🟢
`aplicarZonaMorta(estado, isoAlvo, opts)` em `jogo/nuclear.js` é a fonte única: uma
função pura, idempotente, que qualquer cliente roda ao saber do impacto (quem lançou,
quem levou, a plateia) — antes a cratera só existia no cliente de quem apertou o
botão. Aplica a marca no mapa, tira o país da guerra, libera ocupações/guarnições/
bases que estavam lá, cancela operações e mobilizações em trânsito e rompe alianças
com o país apagado. Propaga via evento `nuclear` com `dados.zonaMorta` em
`ui/online.js`.

### #6.2 Jogador nuclearizado tem status de MORTO 🟢
`marcarNacaoMorta(estado, iso, opts)` em `jogo/nuclear.js`: todo país apagado entra
em `estado.nacoesMortas` (a UI para de oferecer diplomacia/comércio/guerra contra
ele). Se o apagado for VOCÊ, sobe pra `estado.nacaoMorta` — arsenal, exército e
ocupações zerados na hora (quem morre não revida no turno seguinte) — com o espólio
do que você era guardado pra tela de derrota. A UI decide o que fazer com isso
(`hooks.aoSerApagado` em `ui/online.js`) — ver #11.

### #6.3 Urânio acaba (anti-roubo) 🟢
Bug que isto conserta: o desbloqueio da ogiva exigia `uranio >= 60` mas nada
consumia o estoque — a mesma leva de urânio destravava ogiva pra sempre. Agora
`efeitos: { uranio: -60 }` em `dados/acoes.js` (ação `ogiva`) tira do estoque no
sucesso; o jogador precisa voltar em "Enriquecer Urânio" antes da próxima bomba.

### #6.4 Opção de partida SEM armas nucleares automáticas 🟢
Checkbox na home (`ui/inicio.js`, offline e no lobby — só o host decide no online).
`estado.semNucleares` é regra de SALA (viaja no `snapshotMundo`/`aplicarSnapshotMundo`
de `jogo/motor.js`), não do cliente — senão um convidado sem marcar a caixa jogaria
com bomba num mundo sem bomba. `partidaSemNucleares(estado)` em `jogo/nuclear.js` é a
única checagem válida em todo o jogo: ela também zera `ogivasDoAlvo()` dos NPCs, que
antes lia a ficha ESTÁTICA (`NACOES[iso].ficha.estadoInicial.ogivas`) e ignorava a
regra da partida.

---

## GRUPO 7 — CIÊNCIA E ECONOMIA 🟢

### #7.1 Ações de ciência para PETRÓLEO 🟢
Bug que isto conserta: `efeitos: { petroleo_producao: N }` existia em ações antigas e
era **descartado em silêncio** — a chave nunca esteve registrada em `VARS`, e mesmo
se estivesse, `sincronizarPetroleo()` recalcula tudo do zero a cada turno e apagaria
o valor. A alavanca certa é `tec_petroleo` (nova var em `jogo/vars.js`, insumo — não
resultado — então sobrevive ao turno), lida em `sincronizarPetroleo()`
(`jogo/petroleo.js:52`) como um multiplicador de eficiência de extração (1× a 1,45×
com tec 100). Duas ações novas em `dados/acoes.js`: **Recuperação Terciária (EOR)**
(cara, salto de +24) e **Sísmica 4D & Digitalização de Campo** (barata, +4).
Território anexado ganha o bônus (é poço seu); ocupado não (insurgência sabota duto
antes da ciência valer alguma coisa).

---

## GRUPO 8 — MÍDIA 🟢

### #8.1 FAKE NEWS pelo perfil "Choquei" 🟢
Entregue na 1ª rodada — sem mudanças nesta.

---

## GRUPO 9 — ONU (só no online) 🟡

Implementado em `ui/onu.js` + `estilo-onu.css`, chamado a partir de `ui/jogo.js`.

- Convocação com título/tema, país-foco e pena proposta 🟢
- Notifica todos os jogadores online 🟢
- Votação por jogador, veredito cravado pelo **presidente da sessão** (quem convocou
  — evita vereditos divergentes se um pacote de rede se perder) 🟢
- Chat de texto + fila de "pedir a palavra" 🟢
- UI intimidadora (réu no centro, bandeira grande, retrato do líder, pena em
  destaque) 🟢
- Penas com efeito real: congelar caixa (`caixaCongelado()`), embargo de armas
  (`armasEmbargadas()`), sanções econômicas, suspensão de comércio — todas com
  predicado exportado em `ui/onu.js` pro resto do jogo consultar 🟢
- **Microfone aberto (voz em grupo) 🔴** — `criarTelefonia` (`net/chamada.js`) guarda
  uma única `RTCPeerConnection` e a sinalização dela já é consumida pela telefonia
  1:1 (`ui/telefone.js`, canal `direto`). Voz de SALA pede malha N-1 (uma conexão por
  participante) e um namespace de sinalização próprio — reaproveitar a de 1:1 faria
  "chamada recebida" pipocar no meio da sessão. Ficou de fora de propósito; ver
  `docs/PROXIMOS-PASSOS.md`.

---

## GRUPO 10 — BLOCOS 🟢

### #10.1 Bloco criado entra no menu "Blocos" do cabeçalho 🟢
Já estava feito antes desta rodada (`ui/blocos.js`).

### #10.2 Mensagens para o bloco 🟢
`ui/blocoChat.js` (novo). Sem broadcast de grupo no servidor (`server/lobby.js` só
conhece `evento` — sala inteira — e `direto` — 1:1): o cliente itera os membros do
bloco e manda um `direto` pra cada um. Botão "FALAR COM O BLOCO" em `ui/blocos.js`,
só em bloco de que o jogador é membro.

---

## GRUPO 11 — ESTUDO DE COMPORTAMENTO 🟢

### #11.1 O que fazer quando o jogador perde e quer voltar? 🟢
**DECISÃO TOMADA E IMPLEMENTADA: opção B.** Quem cai vira espectador, a Máquina
assume o país dele (`marcarNacaoMorta`/evento `queda` em `ui/online.js`), e ele
assume outra nação livre na MESMA sala **sem recarregar a página** — `ui/renascer.js`
(novo: lista de nações disponíveis, faixa de espectador) + o fechamento em
`main.js` (`renascer(novoIso, novoPresidente)` reconstrói a partida reusando a mesma
conexão `net`, sem `location.reload()`). Motivo da escolha documentado no topo de
`ui/renascer.js`: a A quebra a consequência de perder, a C bane alguém de um serão de
horas; a B mantém o mundo coerente e a derrota doendo.

---

## RESUMO — O QUE AINDA FALTA DE VERDADE

Só o **microfone em grupo da ONU** (dentro do #9) segue como item de código aberto
— e ficou de fora por custo de infraestrutura (malha N-1 + namespace de sinalização
próprio), não por falta de tempo. Tudo o mais deste backlog está entregue. As
pendências que sobram para o projeto (migração de host, validação anti-trapaça,
teto de IA em memória, `DATABASE_URL` vazia, detecção contínua de frota, áreas
mudas no online) são dívida técnica de infraestrutura, não itens deste backlog —
ver `docs/PROXIMOS-PASSOS.md`.
