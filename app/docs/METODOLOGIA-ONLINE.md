# METODOLOGIA DO ONLINE — as regras do mundo único

Escrito com o dono (2026-07-18). É o contrato de COMO o multiplayer se comporta.
Complementa `PLANO-MUNDO-UNICO.md` (o roteiro técnico) e `ONLINE.md` (o protocolo).

## Princípio nº 1 — A DESCOBERTA REGE A INFORMAÇÃO

Nada vira notícia, alerta ou pino no mapa só porque aconteceu. Vira quando é VISTO.

| Situação | O que acontece |
|---|---|
| Frota em mar aberto, longe de todos | NADA. Sem breaking, sem alerta. Mar deserto não rende manchete. |
| Frota EM TRÂNSITO para um destino | Todos os jogadores da sala veem a esquadra NAVEGANDO (mesma rota, mesmos horários — relógio do servidor). A NOTÍCIA só sai quando ela CHEGA. |
| Frota chega perto de costa alheia (zona de peso ≥ 0.4) | AGORA sim: breaking na sala + o país costeiro DETECTA (alerta "esquadra na sua costa", radar, boletim ⚓). |
| Frota entra em águas territoriais de país em guerra | Breaking "invade águas" na chegada. |
| Submarinos puros (furtividade alta) | Encurtam MUITO o raio em que são detectados — podem chegar perto sem alarde. |
| Ataque (naval, terrestre, nuclear) | SEMPRE é notícia — combate não se esconde. |

## Princípio nº 2 — O RESULTADO É DE TODOS

- Ataquei a frota de um jogador e venci → a frota SOME do jogo dele (com as tropas),
  ele é alertado, e o pino sai do mapa de todos. Sem navio-fantasma.
- Tomei territórios → eles mudam de dono/conflito no mapa de TODOS. O atacado vê o
  próprio país marcado (visão detalhada é dele); terceiros veem só a marca.
- Breaking news: a MESMA manchete para a sala inteira.
- Mediação/ajuda humanitária: registrada na sala; o host aplica os pontos no conflito
  compartilhado — jogadores diferentes podem SOMAR esforços no mesmo cessar-fogo.

## Princípio nº 3 — O ALARME É SAGRADO

O alarme sonoro grande (faixa vermelha + som) é reservado para UMA coisa: **o seu
país sendo atacado ou dominado** (ofensiva ao país, invasão, nuclear, território
perdido). Todo o resto — ataque a uma cidade, a uma frota, avistamento na costa,
mobilização detectada — usa a **faixa vermelha SEM som** (notificação forte, muda).
Urgência que toca o tempo todo deixa de ser urgência.

## Autoridade e sincronia (como funciona por baixo)

- O HOST é o dono do relógio e do mundo NPC: a batida dele (30s = 1 mês) viaja pra
  sala; convidados avançam em sincronia (seed da sala ⇒ mesmos dados) e aplicam o
  retrato (Brent, guerras NPC, pandemias) por cima.
- O servidor guarda a última batida: quem ENTRA na sala nasce no mês/mundo atual.
- Timestamps que viajam (frotas) são tempo do SERVIDOR; cada cliente converte.

## ANOTADO PARA O FUTURO (pedidos do dono, ainda não implementados)

1. **Aliança arrastada pra guerra**: se um aliado MEU entra na guerra, ele passa a
   ver a visão DETALHADA do conflito (estados atingidos, forças), não só a marca.
2. **Migração de host**: se o host sair, o jogador mais antigo assume o relógio da
   sala (hoje o mundo pausa).
3. **Validação anti-trapaça no servidor**: eventos caros (nuclear, guerra) checados
   contra um espelho leve do estado de cada cliente (Etapa 7 do plano).
4. **Detecção contínua de frota em trânsito**: hoje o país costeiro detecta quando a
   frota CHEGA; detectar DURANTE a passagem (rota cruzando águas) fica pro futuro.
5. **Visão de aliado no mar**: frota aliada poderia compartilhar o que o radar dela
   vê (visão conjunta de sensores).
