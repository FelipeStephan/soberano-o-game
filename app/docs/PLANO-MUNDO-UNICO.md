# PLANO — MUNDO ÚNICO ONLINE (integração total das ações)

Objetivo do Felipe, nas palavras dele: **"O mundo é um só e todos vão ver ele."**
Se eu ataco a Argentina, o outro jogador VÊ o ataque no globo dele, no feed dele, no
breaking dele — e pode reagir como se fosse a Máquina, só que humano. Um país = um
jogador (trava dura). Frotas no mar visíveis para quem tem alcance. Ações conjuntas.

Estado atual (por que não funciona): cada cliente simula seu próprio mundo; o relay
(`server/lobby.js`) só repassa ALGUNS eventos (X/Twitter, guerra direta). Breaking news,
mercado, Brent, guerras NPC, pandemias, frotas e a maioria das ações NÃO viajam.
A base técnica do diagnóstico é a `AUDITORIA-ONLINE.md` (mesma pasta).

---

## ETAPA 1 — Fundação determinística (sem ela nada é confiável)
1. `src/jogo/rng.js` — PRNG semeado (mulberry32). TODA a lógica de jogo troca
   `Math.random()` por `rand()`. Offline: seed local. Online: seed da sala por batida
   (`hash(salaId, turno)`) → todo cliente que replica um evento chega ao mesmo número.
2. Offset de relógio servidor↔cliente (ping/pong no lobby, média de 3). Todo timestamp
   que viaja é tempo do SERVIDOR (frotas `partiuEm/chegaEm`).

## ETAPA 2 — Um país, um jogador (trava dura)
- O servidor (`lobby.js`) é o dono da lista `pais→jogador`: rejeita `escolherPais` e
  `criar` com país ocupado (hoje só a UI esconde). Broadcast da ocupação para o lobby
  e para o jogo em andamento (entrar tarde = só países livres).

## ETAPA 3 — O mundo NPC é UM (host autoritativo)
- O host da sala roda `beatMundo`; os demais clientes DESLIGAM a simulação própria e
  aplicam o evento `mundo` relayado: Brent, guerras NPC, pandemias, tensão global,
  Pontos Quentes. Queda do host → migração: o jogador mais antigo vira host e assume.

## ETAPA 4 — Toda ação humana ecoa na sala (o coração do pedido)
- Novo contrato de evento no relay: `{tipo, ator, alvo, dados, ts}` para TODAS as ações
  com efeito visível: guerra, ataque naval, nuclear, sanção, aliança, ocupação, anexação,
  mobilização, base, espionagem (resultado), mercado (compras grandes), política.
- Cada cliente aplica o evento no SEU estado como fato (não re-simula): globo (marcador,
  míssil, frota), feed, breaking news e X — tudo pela mesma rota que já existe no modo
  offline (as funções de encenação já existem; passam a ser chamadas pelo evento).
- **Breaking news vira broadcast**: `dispararBreaking` no online publica no relay; todos veem.

## ETAPA 5 — Frotas e detecção no mar
- Frota que zarpa → evento com rota + timestamps do servidor; todos interpolam igual.
- Visibilidade: frota inimiga aparece para quem tem detecção/alcance (regra que já
  existe em `frotasDetectadas`) — aplicada sobre as frotas REAIS dos outros jogadores.
- Combate naval entre humanos: determinístico (já é) + seed da sala para o que rolar dado.

## ETAPA 6 — Defesa humana e ações conjuntas
- Ataque contra país de jogador humano → o DEFENSOR recebe o evento, o Modo Defesa
  abre pra ele decidir (a "Máquina humana" que o Felipe descreveu).
- Guerra PvP resolve com seed do servidor (auditoria, item crítico 2).
- Ações conjuntas: convite via evento `proposta` (atacar junto, intervenção, embargo);
  aceite dentro da janela → os dois entram como coalizão (motor de alianças já existe).

## ETAPA 7 — Anti-trapaça mínimo + reconexão
- Validação no servidor dos eventos caros (nuclear exige ogivas, guerra exige paz antes,
  cooldowns), espelho leve por cliente (auditoria, crítico 3).
- Salas persistidas no store + `reconectar {codigo, perfilId}` + token de perfil.
- Fios narrativos no save/restore (a Máquina não pode esquecer a guerra ao reconectar).

## ETAPA 8 — Endurecer e subir (deploy Hostinger VPS + subdomínio)
- compression, boot que exige ADMIN_PASSWORD em produção, Origin check no WS,
  texturas do globo servidas localmente, docker-compose.
- VPS Hostinger + Caddy (TLS automático, WS transparente) + Neon (Postgres) +
  subdomínio do Felipe via DNS Hostinger. Passo-a-passo já escrito em
  `README-DEPLOY.md` §3.3 da auditoria.

Ordem é dependência: 1→2→3→4 são o núcleo do "mundo é um só"; 5–6 são a experiência;
7 protege; 8 publica. Cada etapa é jogável e testável em duas abas antes da seguinte.
