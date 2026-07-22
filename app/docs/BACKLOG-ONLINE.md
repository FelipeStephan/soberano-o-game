# BACKLOG ONLINE — pedidos do dono (2026-07-18, pós-merge da branch `matheus`)

Complementa `METODOLOGIA-ONLINE.md` (as regras) e `AJUSTES-ONLINE-MATHEUS.md` (os 10 dele).
Status: `🔴 a fazer` · `🟡 em execução` · `🟢 feito`

---

## LOTE ATUAL (executando)

### #A1 — Convite de aliança com ACEITE do humano 🔴
Hoje: convidar país humano cai na regra de IA e **recusa automaticamente**.
Quero: se o membro está online, ele recebe o convite e **decide** (aceitar/recusar).
Base: `online.js` já tem `propostaRecebida()` com timer 20s para `alianca`/`comercio` —
falta o fluxo de criação de bloco (`ui/aliancas.js`) usar esse canal quando o alvo é humano.

### #A2 — Aliados VISÍVEIS no mapa (verde) 🔴
Aliado deve ser inconfundível: país aliado pintado de **verde vivo** no globo, distinto
de neutro/hostil. Vale para blocos militares aceitos no online.

### #A3 — Aliança militar: guerra do aliado é MINHA guerra 🔴
Quando um aliado entra em guerra ou é atacado → **notificação forte** para mim, com
opção de visualizar o conflito (como se fosse um ataque a mim). Só para blocos de
categoria militar.

### #A4 — Aliado que TE ATACA quebra o pacto 🔴
Se um membro da aliança te ataca: sai do bloco automaticamente + vira hostil + notícia.
(No online, manter simples: quebra + aviso a todos os membros.)

### #B1 — Anexação MUDA o dono de verdade 🔴
Ao anexar, o país deve virar **meu**: cor do meu país no globo e, se possível, a bandeira.
Hoje continua marcado como "ocupado", não incorporado.

### #B2 — Ver território sendo tomado em TEMPO REAL (qualquer jogador) 🔴
Mesmo não sendo parte do conflito, quero ver no mapa o território que outro está tomando,
ao vivo. Já existe base (`guerra_resultado`/`ataque_estado` marcam `donoEstado`).

### #B3 — Anexação atualiza o MUNDO INTEIRO 🔴
Assim que anexar, todos os clientes atualizam (dono + cor + status).

### #B4 — Status "territórios dominados por X" 🔴
Um lugar para ver tudo que cada país domina.

### #B5 — Governar mostra o território ATUALIZADO 🔴
Clicar no meu país → painel de governança reflete o território anexado (área/PIB).

### #C1 — Notícia de anexação/conquista é PÚBLICA 🔴
Território dominado, início de ataque e anexação → **X + jornais para todos**, nunca
privado. (A regra da metodologia: descoberta rege a notícia — conquista é sempre pública.)

### #D1/#D2 — QUEDA DO GOVERNANTE com relatório de IA 🔴
Se o jogador é deposto/perde, hoje ele não sabe **por quê**.
Quero: tela de queda com **motivo claro** + um **relatório gerado por IA** contando a
história da queda — irônico, engraçado, às vezes cruel. Criativo, com personalidade.

### #E1 — Sem modelo 3D de navio no ataque 🔴
Remover a esquadrilha/modelo 3D de navios da animação de ataque. **Só mísseis.**

### #F1 — Índice Mundial sincronizado (EM ANDAMENTO) 🟡
O ranking deve usar os números REAIS dos outros jogadores (PIB, militar, petróleo,
território), não a tabela estática. Já criado `statsVivos()` em `indiceMundial.js`;
falta transmitir por batida e consumir em `_statsHumanos`.

### #F2 — Forças dos jogadores sincronizadas 🟡
O poder militar que eu vejo de outro jogador precisa ser o real dele (mesma via do #F1).

---

## JÁ ENTREGUE (não regredir)

- Mundo único: calendário/Brent/NPCs do host, late-join com o mundo atual
- Ações ecoam: guerra, naval (em fases, do Matheus), nuclear, ataque a estado
- Frotas: trânsito sincronizado + detecção costeira + tom por relação
- Breaking compartilhado; mediação registrada na sala
- Alarme sonoro só para ataque/dominação do próprio país
- Estado autoritativo por sala, país único, pandemia com cura, bandeira correta (Matheus)

## ANOTADO PARA DEPOIS (fora deste lote)

- Aliado arrastado pra guerra vê a visão DETALHADA do conflito
- Migração de host (host sai → sala pausa hoje)
- Validação anti-trapaça no servidor (eventos caros)
- Detecção de frota DURANTE a travessia (hoje só na chegada)
- Sensores compartilhados entre aliados (visão conjunta)
- Áreas mudas no online: Economia (sanção dirigida), Mídia (propaganda de convidado),
  Arsenal (sinal de rearmamento), Política (golpe/exceção) — ver #4 do Matheus
