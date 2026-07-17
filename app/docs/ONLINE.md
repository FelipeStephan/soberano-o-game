# SOBERANO ONLINE — o modelo

Como o multiplayer funciona, por quê, e o que fica pra depois. Escrito para orientar a
implementação (server/lobby.js, net/lobby.js, ui/lobby.js, ui/defesa.js, feed X).

## A tese: **Mundo Compartilhado, Turnos Assíncronos, Interações em Tempo Real**

Cada jogador joga o **seu próprio turno** no motor single-player que já existe. O que é
*compartilhado* e viaja em tempo real é a **interação entre humanos** — e é aí que mora a
ansiedade que o jogo quer causar. Ninguém espera o turno do outro pra sentir o golpe: o
golpe chega **agora**, na sua tela, enquanto você planejava outra coisa.

Não é (ainda) um servidor autoritativo que simula o mundo pra todos. É um **relay** que
garante entrega e presença. Para um trabalho acadêmico e partidas entre amigos, isso
entrega o essencial sem o custo de um servidor de simulação. A limitação (sem anti-trapaça,
sem estado de mundo persistido no servidor) está registrada em "Depois".

## Peças

### 1. Salas (partidas)
- Um jogador **hospeda** → recebe um código curto (`SOBER-4821`).
- Outros entram pelo código ou pela **lista de partidas abertas**.
- Cada jogador escolhe um país **livre** (um país por jogador; o resto é NPC/Máquina).
- O host define: máx. de jogadores, aberta (listada) ou privada (só por código).

### 2. Turnos
- Turno é local. A Máquina segue gerando crise/notícia pra cada jogador e movendo os NPCs.
- **Compartilhado:** ações inter-jogador + o feed do X + a presença.

### 3. Interações — o coração
Quando o jogador **A** age sobre o **B**, B recebe um **alerta em tempo real** (não no
próximo turno), com urgência:

| Ação | B responde? | O que B sente |
|---|---|---|
| Propor aliança | sim (aceitar/recusar) | convite com timer |
| Acordo comercial | sim (aceitar/contrapor/recusar) | oferta com timer |
| Declarar guerra | **ativa Modo Defesa** | INCOMING em tela cheia + sirene |
| Sanção / espionagem / ajuda | não (unilateral) | notificação + efeito |
| Lançamento nuclear | não | clarão + luto |

O timer de resposta é de propósito: **decidir rápido é a ansiedade**. Deixar expirar tem
custo (aliança perdida, guerra começa sem você posicionar tropa).

### 4. Modo Defesa — o clímax
Quando um humano declara/executa guerra contra você:
- Tela dedicada pra **distribuir tropas** pelos seus estados (usa `jogo/territorio.js`
  guarnições + `jogo/campanha.js` na resolução).
- **Dividendo de inteligência:** sua stat **Inteligência** compra **RECON** — você enxerga
  (parcialmente) onde o atacante concentrou forças ("os EUA massaram tropas apontadas para
  o **Rio de Janeiro**") e recebe **sugestão** ("reforce o Rio"). Mais inteligência =
  imagem mais nítida e aviso mais cedo. Pouca inteligência = "algo se move no sul, não
  sei o quê" — o pavor do escuro.
- Você aloca; o ataque resolve contra a sua distribuição.

### 5. Papel da IA
- Máquina: crises e notícias por jogador; conduz os NPCs (como hoje).
- **Editor do mundo:** transforma as ações cruas dos jogadores em **posts/opiniões** no X,
  no tom brasileiro que o dono elogiou. Pode curar o que sobe pro World Trends.
- (Depois) IA sugerindo defesa/represália a partir do recon.

### 6. Twitter / X compartilhado + filtro
- **Cada impacto de cada jogador** vira post no feed da sala; todos veem.
- Dois filtros: **Minha Nação** (o que fala de/afeta você) e **World Trends** (a sala
  inteira, todos os jogadores). Sugestão do dono, adotada.
- O servidor pode limitar o volume (só impactos relevantes sobem).

## Ansiedade / clímax — os princípios (o norte do dono)
1. Tempo real: outro humano pode atacar enquanto você planeja.
2. Timers nas propostas: decida rápido.
3. Recon parcial: o pavor de não saber onde vem o golpe.
4. O feed te nomeando em público: pressão social.
5. Modo Defesa como mini-jogo de alto risco.

## Protocolo (server/lobby.js)
Mensagens do cliente → servidor:
```
ola      { perfilId, nome }
criar    { pais, nome, aberta, max }         → servidor devolve { sala, codigo, host:true }
entrar   { codigo }                          → { sala, jogadores[] } ou { erro }
listar                                        → { salas: [{codigo, host, jogadores, max, aberta}] }
pais     { sala, pais }                       trava o país (recusa se ocupado)
evento   { sala, tipo, alvo, texto, dados }  interação relayada aos outros
sair     { sala }
ping
```
Servidor → cliente:
```
bemvindo { id }
sala     { codigo, host, jogadores:[{id,nome,pais}], max, aberta }   estado da sala mudou
salas    { salas }                                                    resposta de listar
evento   { de, deNome, dePais, tipo, alvo, texto, dados }             ação de outro humano
erro     { motivo }
pong
```
`tipo` de evento: `guerra | alianca | comercio | sancao | espionagem | ajuda | nuclear |
ataque_estado | resposta` (resposta carrega `aceito:bool` para propostas).

## Depois (fora do MVP)
- Servidor **autoritativo**: valida regra, resolve combate no server, guarda o mundo.
- Sincronização de turno (todos avançam juntos, ou janela de tempo).
- Persistência da sala (reconectar e continuar).
- Matchmaking público, ranking, anti-trapaça.
- IA editor rodando no server pra curar o World Trends.
