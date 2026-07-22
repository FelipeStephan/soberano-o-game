# AJUSTES ONLINE — planejamento e rastreio (branch `matheus`)

> Documento vivo. Registra os 10 ajustes pedidos, a causa-raiz encontrada e o plano de
> execução por frente. Cada item tem **Status**, **Causa-raiz** e **Plano**.
> Atualize o Status conforme avança: `🔴 a fazer` · `🟡 investigando` · `🟢 feito`.

---

## O VEREDITO ARQUITETURAL (leia primeiro)

O online **não é um servidor autoritativo**. Hoje é um **relay** (`server/lobby.js`):
ele só entrega mensagens e cuida de presença/salas. **A regra do jogo roda no cliente de
cada jogador**, e cada cliente simula o mundo inteiro por conta própria. O host transmite
uma "batida" (`beat`) com o retrato do mundo (mês, Brent, guerras NPC), e os convidados
tentam se alinhar a ela.

Isso está **documentado como limitação conhecida** em `docs/ONLINE.md` → seção "Depois
(fora do MVP)": *servidor autoritativo, resolver combate no server, guardar o mundo,
persistência, sincronização de turno*. **Praticamente tudo que o Matheus está pedindo é
exatamente essa lista.** Ou seja: os problemas 1, 2, 5, 8 e 10 não são "bugs" soltos — são
o sintoma de um único buraco: **não existe uma fonte da verdade (estado autoritativo) que
diga quem controla cada país e o que já aconteceu no mundo.**

### As duas causas-raiz que explicam 6 dos 10 problemas

1. **A simulação não sabe quem é humano.** O conceito `ehHumano`/`porPais` só existe na
   camada de UI de notificação (`src/ui/online.js`). O motor (`src/jogo/motor.js`,
   `src/jogo/mundoVivo.js`) **não recebe o roster de jogadores** — então a máquina de cada
   cliente toma decisões (inclusive atacar) por TODOS os países, incluindo os controlados
   por outros humanos. → **causa direta do #2**, e contribui para #1, #8, #10.

2. **Não há estado de mundo persistido/autoritativo.** O que o servidor guarda
   (`sala.mundoAtual`) é só a última `beat` do host — um retrato de NPCs/Brent, **não** o
   que os jogadores fizeram uns aos outros (ataques, territórios tomados, guerras, mortes
   por vírus). Ações inter-jogador viajam como eventos efêmeros: quem não estava conectado
   na hora **nunca fica sabendo**. → **causa direta do #8 (ataque não persiste / quem entra
   depois não vê a explosão)** e do #10 (ações sem consequência lógica durável).

> **Decisão de projeto a tomar com o Matheus:** para resolver de verdade #8 e #10, o
> servidor precisa guardar um **estado de mundo autoritativo por sala** (donos de
> território, guerras ativas, relações, saúde/vírus, frotas) e reenviá-lo a quem (re)entra.
> É a evolução de relay → semi-autoritativo. É a maior peça de engenharia do pacote.

---

## OS 10 AJUSTES

### #1 — Bandeira errada no online (aparece a do host/EUA em vez do país escolhido)
- **Status:** ✅ **IMPLEMENTADO E VERIFICADO** (jogo bootado como Ucrânia mostra bandeira
  `ua`, antes mostrava `us`).
- **Causa-raiz REAL (≠ hipótese):** o `estado.iso` do convidado ESTAVA correto. O bug era
  um mapa de bandeiras LOCAL e incompleto `ISO2_MAPA` em `jogo.js:94` com só 15 países —
  faltavam UKR/SAU/EGY/PRK/PAK/VEN/IDN, que caíam no fallback `'us'` (`jogo.js:117`). Ocorria
  offline também. Coincidência: o host costuma ser EUA, então "parecia" bandeira do host.
- **Correção:** `jogo.js` passou a usar o mapa canônico `ISO2_DE` (de `imagens.js`, já
  importado e completo); a const duplicada `ISO2_MAPA` foi removida.

### #2 — Países de outros jogadores agem sozinhos (como se fossem a máquina)
- **Status:** ✅ **IMPLEMENTADO** (falta validar em partida com 2 humanos).
- **Causa-raiz (confirmada):** a simulação não conhecia o roster humano — a máquina de cada
  cliente movia/atacava por todos os países, inclusive os de outros jogadores.
- **Correção:** o roster humano é stampado em `estado._humanos` (`online.js absorverJogadores`);
  a simulação pula esses países: `agressao.js` (não elege país humano como agressor) e
  `mundoVivo.js` (semente RUS×UKR, conflito novo, pactos e pulso ao vivo). Offline
  `_humanos` é undefined → single-player 100% intacto (verificado: jogo offline roda normal).

### #3 — Sistema de gastos e lucros ao clicar em "Governar"
- **Status:** ✅ **IMPLEMENTADO E VERIFICADO** (painel abre com tendência "POUPANDO",
  sparkline e linha de sanções renderizando).
- **O que foi feito (baixo risco, aditivo — sem mexer em onde o dinheiro é aplicado):**
  (a) **Sanções como prejuízo:** `custoSancoes()` em `economia.js` drena o caixa por sanção
  sofrida (`estado.sancoesSofridas`), entra no fluxo e aparece como linha "Prejuízo de
  sanções" no extrato; o evento online `sancao` popula a lista (`online.js`). (b)
  **Tendência:** anel `_histSaldo` (12 meses) em `aplicarFluxo` + `tendenciaFiscal()` +
  **sparkline** e selo "POUPANDO / NO VERMELHO há N meses" na aba EXTRATO. Dívida/juros já
  eram sólidos e continuam.
- **Não feito (evitado o risco de crédito em dobro):** o refactor que move
  empresas/pedágio para dentro de `aplicarFluxo`. O extrato já mostra empresas; pedágio
  segue creditado direto. Fica como melhoria futura de coerência fina.
- **Investigação (Frente C) abaixo.**
- **DESCOBERTA-CHAVE:** o painel **já existe ~70%**. `abrirGovernanca()`
  (`ui/governanca.js:131`) já é um modal com 3 abas (EXTRATO/IMPOSTOS/REFORMAS) + panorama
  (PIB, Tesouro, Dívida, Aprovação). A aba EXTRATO (`governanca.js:158-196`) já mostra
  receitas×despesas×saldo com donut, via `extratoFiscal(jogo)` (`:93-114`). Dívida+juros
  já é sólida (`fiscal.js:35-43` juro dinâmico; `economia.js:42,65-70` serviço/emissão).
  **#3 é completar, não criar do zero.**
- **Lacunas a preencher (Frente C):** (1) sanções não existem como linha econômica —
  criar `estado.sancoesSofridas` + `custoSancoes()`; (2) pedágio de estreitos
  (`geografia.js:157`) e escolta (`:167`) creditam direto no tesouro e somem do extrato;
  (3) **dois saldos divergentes** — `calcularFluxo.saldo` (`economia.js:53`) ≠
  `extratoFiscal.saldo` (`governanca.js:113`); unificar tudo em `calcularFluxo` e remover
  crédito duplicado de empresas (`motor.js:284-285`) e pedágio (`geografia.js:157,167`);
  (4) sem TENDÊNCIA — criar anel `_histSaldo` (últimos 12 meses) + `tendenciaFiscal()` +
  sparkline; (5) selo "POUPANDO / NO VERMELHO há N meses" no panorama.
- **Fallback single-player p/ sanções:** derivar de `pressoes` com `alvo_pressao:'temp_economia'`
  (IRN/VEN/RUS já nascem com isso) — não bloqueia na Frente A.
- **⚠ Risco crítico:** ao unificar créditos em `aplicarFluxo`, REMOVER os créditos avulsos
  de `motor.js:284-285` e `geografia.js:157,167` senão o tesouro é creditado em dobro.

### #4 — Auditoria das 8 áreas (Militar, Arsenal, Inteligência, Economia, Diplomacia,
Ciência, Mídia, Política): cada uma tem função definida? Está ligada no online?
- **Status:** 🟡 auditado + 1º wiring feito. **Inteligência LIGADA** (botão ESPIONAR avisa
  o alvo humano). Falta: Economia (embargo/sanção econômica dirigida), Mídia (propaganda de
  convidado subir pro feed de todos), Arsenal (sinal de que rival se arma). Essas exigem
  novos tipos de evento + seleção de alvo e um teste com 2 clientes — próximo bloco dedicado.
- **DESCOBERTA-CHAVE:** o painel de ações (`renderAcoes`, `ui/jogo.js:996-1000`) executa
  TODO chip das 8 abas só com `tr.enfileirar(...)` e **nunca chama `notificar`**. O online
  só acontece por fluxos PARALELOS dedicados (carta do país, modal de guerra, naval,
  nuclear). Por isso a maioria das áreas é "muda" no multiplayer.

| Área | Tem online? | Buraco principal |
|---|---|---|
| **Militar** | Parcial | Só ofensiva/território viaja (`jogo.js:1303,1076`, `envio.js:210`). Compra de equipamento e mobilização são mudas. IA move país humano (#2). |
| **Arsenal** | Parcial | Só o lançamento nuclear viaja (`nuclear.js:96`). Construir ogiva/ICBM/escudo é invisível ao rival. |
| **Inteligência** | Frágil | **Botão "ESPIONAR ESTE PAÍS" (`jogo.js:1317-1326`) NÃO notifica** — espionar humano é invisível. Sabotagem/cyber mexem em `rel_*` hardcoded. |
| **Economia** | **NÃO** | Área muda. Nenhuma sanção/embargo/choque atinge outro jogador. É também o #3. |
| **Diplomacia** | **SIM** (a mais fiada) | aliança/comércio/sanção/ajuda/mediação viajam. Mas aceitar proposta só ajusta relação de UM lado, local (`online.js:168-170`) → é o #10. |
| **Ciência** | NÃO | Muda por natureza (auto-desenvolvimento). Sem reflexo no mundo. |
| **Mídia** | Quase não | "X compartilhado" só o HOST publica (`jogo.js:361`); propaganda de convidado não sobe. Contradiz `ONLINE.md §6`. |
| **Política** | NÃO | Muda. Golpe/estado de exceção/recrutamento invisíveis aos demais. |

- **Wiring prioritário (barato→caro):** 1º INTELIGÊNCIA (só falta um `notificar('espionagem',...)`
  no botão `#pp-espiao`, o estilo já existe em `online.js:32`); 2º ECONOMIA (novo evento
  `sancao_economica` + painel #3); 3º MÍDIA (relayar posts de qualquer jogador, não só host);
  4º ARSENAL (sinal de inteligência de que rival se arma); Política/Ciência = baixa prioridade.

### #5 — Dois jogadores conseguem escolher o mesmo país (proibido)
- **Status:** ✅ **IMPLEMENTADO** (falta validar em partida com 2 humanos).
- **Correção (cliente `inicio.js`):** o servidor já recusava país ocupado (handler `pais`),
  mas o cliente ignorava a recusa e iniciava assim mesmo. Agora: (1) botão INICIAR/ASSUMIR
  só habilita com país CONFIRMADO pelo servidor e não-ocupado (senão mostra "CONFIRMANDO
  PAÍS…"/"PAÍS JÁ OCUPADO"); (2) `garantirPaisLivre()` move o jogador para um país livre ao
  entrar e registra no servidor; (3) guard defensivo no clique. Reflexo de ocupados na
  seleção já existia.
- **Investigação (Frente A) abaixo.**
- **Causa-raiz (parcial):** o servidor JÁ recusa país ocupado no handler `pais`
  (`server/lobby.js:152`), mas **não** revalida no `criar`, e o **cliente provavelmente não
  bloqueia** o start quando a recusa chega (segue pro jogo mesmo assim). Precisa checar o
  fluxo de `onErro` no `inicio.js`.
- **Plano:** trava dupla — servidor autoritativo na escolha (rejeita e confirma) + cliente
  que só deixa iniciar com país CONFIRMADO livre; refletir ocupados na tela de seleção.

### #6 — Vírus/pandemia sem fim: financiar a cura não reduz mortes nem encontra a cura
- **Status:** ✅ **IMPLEMENTADO** (single-player + online).
- **Single-player (`mundoVivo.js`):** (a) resistência pesa cura 1:1 e freio 0.28 → doença
  deixa de ser imortal; (b) gatilho `curaAcumulada>=100 ⇒ declínio`; (c) encerramento com
  manchete de "vacina/cura encontrada".
- **Online:** o convidado que financia a cura relaya `pandemia_cura` (`motor.js`); o HOST
  acumula na pandemia autoritativa (`online.js`) e reespalha via snapshot — antes a
  contribuição do convidado era apagada a cada batida ("financiar junto não tinha impacto").
- **Investigação (Frente D) abaixo.**
- **Causa-raiz (CONFIRMADA):** pandemia matematicamente imortal. Em `mundoVivo.js:250-252`
  o `empurrao` (crescimento, escala com r0 e nº de países) quase sempre supera a redução
  máxima da resistência (teto `resistencia*0.11` = 11/turno). Gravidade nunca cai a ≤8,
  então a fase `declinio` (única saída, `mundoVivo.js:254,259-265`) nunca dispara; mortos
  são cumulativos (`:289`) e só sobem. O contador `curaAcumulada` EXISTE e realimenta a
  resistência (`pandemiaAcoes.js:81`), mas com peso `*0.6` — fraco demais. **Online:**
  `motor.js:400` faz `e.pandemias = d.pandemias` (substitui pelo snapshot do host) →
  apaga o progresso de cura dos convidados a cada batida; contribuições não somam.
- **Plano (Frente D):** (a) rebalancear resistência (peso da cura 1.0, fator 0.28) em
  `mundoVivo.js:250-252`; (b) gatilho explícito `curaAcumulada>=100 ⇒ declinio/fim`;
  (c) online: convidado emite evento `pandemia_cura`, o HOST soma no estado autoritativo e
  reespalha via snapshot (`ui/online.js` roteador ~l.94 + `motor.js:513-515`); (d) UI mostra
  "mortes/mês" (taxa) e marco "cura global" em `ui/pandemia.js`.

### #7 — Frotas no mar "pulam"/spawnam em pontos diferentes em vez de navegar em tempo real
- **Status:** ✅ **IMPLEMENTADO** (`globo.js:1157` — o tick agora sincroniza também
  `d.frotaInimigaRef`). Falta validar no build + em partida. Investigação abaixo.
- **Causa-raiz (CONFIRMADA):** o tick de interpolação por frame (`globo.js:1151-1172`)
  atualiza `lat/lng` do dado de TODAS as frotas, mas a linha que sincroniza o MARCADOR
  visível (`globo.js:1157`) só toca `d.frotaRef` (minhas frotas). As frotas de outros
  jogadores usam `d.frotaInimigaRef` e **nunca entram nesse loop** → o pino só se move
  quando um `atualizar()` completo reconstrói tudo. Como o tween HTML está desligado
  (`htmlElementsTransitionDuration=0`, `globo.js:337-341`), o pino inimigo **congela** na
  travessia e **salta** para o destino. (Descartado: não há reamostragem de `frota_pos`;
  tick é ~30fps; não recria mesh.) Bate exatamente com o sintoma: minhas frotas navegam
  liso, as dos outros pulam.
- **Plano (Frente B):** em `globo.js:1157`, sincronizar também `d.frotaInimigaRef`:
  `else if (d.frotaInimigaRef) { d.lat = d.frotaInimigaRef.lat; d.lng = d.frotaInimigaRef.lng; }`.
  Opcional: `atualizar()` com throttle ~1s enquanto houver frota alheia em trânsito (para a
  detecção/névoa de guerra acompanhar). Risco baixo — simétrico ao que já funciona.

### #8 — Ataque de um jogador online não afeta o outro; sem tempo de reação; não persiste
- **Status:** 🟡 **IMPLEMENTADO (base)** — persistência + janela de reação nuclear. Falta
  validar em partida com 2 humanos e estender a janela ao ataque terrestre/naval.
- **8a Persistência (`server/lobby.js` + `net/lobby.js` + `online.js` + `jogo.js`):** o
  servidor agora ACUMULA os fatos inter-jogador duráveis num `mundoSala` (donos de
  território, conflitos, frotas no mar) e reenvia via `estado_sala` a quem (re)entra. O boot
  do convidado chama `onlineCtrl.aplicarEstadoSala()` e reconstrói o mapa — a explosão/
  conquista que rolou antes dele entrar agora APARECE (cura do "pra ele não tá explodido").
- **8b Janela de reação (`online.js` + `estilo.css`):** ataque nuclear ao jogador agora
  mostra uma contagem "☢ OGIVA A CAMINHO — 6s" enquanto a ogiva voa no globo, ANTES do
  impacto registrar — o "tempo pra ser notificado e reagir" que faltava. Verificado o CSS.
- **Falta:** estender a janela a guerra/naval (reaprovável) e uma reação ativa (interceptar).
- **Causa-raiz:** relay efêmero + sem estado autoritativo. O impacto depende de o alvo
  estar conectado NAQUELE instante; quem entra depois não vê a explosão porque o estado
  não foi persistido. O "tempo para reagir" (janela antes do impacto) não existe no
  protocolo de nuclear/guerra.
- **Plano:** (a) janela de reação: ataque vira "em voo" com contagem antes de resolver;
  (b) estado autoritativo por sala guarda dano/território/perdas e reenvia a quem (re)entra.

### #9 — Combate naval online: precisa avisar o outro e mostrar a animação do míssil/combate
- **Status:** 🟢 investigado (plano pronto — Frente B)
- **Causa-raiz (CONFIRMADA):** o atacante resolve TUDO na hora (`navalAcoes.js:144`
  `resolverBaixas`) e a animação (`animarAtaqueNaval`, ~5s) toca **só na tela do atacante**
  (`:160`). O defensor recebe `naval_resultado` já final (`:201-207`) e
  `aplicarResultadoNaval` (`online.js:254-286`) aplica **instantâneo** — vê a frota sumir
  sem animação nem janela. Pior: `naval_resultado` é enviado ANTES do evento `naval`
  (`:219`), então o defensor vê a frota afundar e só depois os mísseis voando (ordem
  invertida).
- **Plano (Frente B):** fluxo em fases reaproveitando a janela de reação do #8 —
  (1) atacante emite `naval_incoming` ANTES de resolver, com `janelaMs~5000`, e adia
  `resolverBaixas`/aplicação para depois da janela; (2) novo handler `naval_incoming` em
  `online.js` desenha os mísseis inbound no globo do defensor + abre janela com timer
  (estilo `propostaRecebida`) com opção Evadir/Contramedidas; (3) reação volta como
  `naval_reacao` e modula o resultado; (4) só então `naval_resultado` aplica o desfecho.
  Higiene: evitar animar/alertar em dobro; `naval` só para espectadores.

### #10 — Toda ação precisa ter consequência lógica (ex.: atacar frota do BRA e ele seguir
"parceiro" em vez de hostil)
- **Status:** ✅ **IMPLEMENTADO (base)** (falta validar em partida + persistência p/ quem
  reconecta, que depende do #8).
- **Causa-raiz:** a postura (Aliado/Parceiro/Tenso/Hostil) deriva do número `rel_<x>`, mas
  sofrer ação hostil de outro humano nunca rebaixava esse número no estado do alvo.
- **Correção (`online.js receber`):** eventos hostis rebaixam `rel_<agressor>` de forma
  durável e proporcional no ALVO (guerra/nuclear −60, guerra_resultado −50, ataque_estado
  −40, naval −30, sanção −20, espionagem −15), persistido no autosave. Assim o país atacado
  passa a tratar o agressor como hostil.
- **Causa-raiz:** relações (`rel_xxx`) e postura (parceiro/hostil) não são recalculadas a
  partir das ações inter-jogador de forma autoritativa/simétrica. Atacar não rebaixa a
  relação no estado do alvo de forma durável.
- **Plano:** modelo de relação/postura reativo: cada ação hostil ajusta a relação nos DOIS
  lados e persiste; parceria/hostilidade derivam desse número. Investigar o melhor método
  de infra (o quanto dá pra ver em tempo real e se a infra atual aguenta).

---

## FRENTES DE TRABALHO (agentes)

| Frente | Cobre | Investigação | Implementação |
|---|---|---|---|
| **A · Núcleo de Autoridade** | #1, #2, #5, #8, #10 | ✅ concluída | #1✅ #2✅ #5✅ #10✅ · **#8 pendente** |
| **B · Naval em tempo real** | #7, #9 | ✅ concluída | #7✅ · **#9 pendente** |
| **C · Economia / Governar** | #3 | ✅ concluída | **pendente** |
| **D · Pandemia / Cura** | #6 | ✅ concluída | #6✅ |
| **E · Auditoria das 8 áreas** | #4 | ✅ concluída | wiring **pendente** |

### PLACAR: 9 de 10 implementados (base) — só falta o wiring amplo do #4
✅ **Completos e verificados:** #1 (bandeira), #3 (painel finanças), #6 (pandemia full),
#7 (frota navegando).
✅ **Implementados (base sólida, validar em partida 2 humanos):** #2 (IA não controla
humano), #5 (país duplicado), #8 (persistência + janela nuclear), #9 (naval em fases),
#10 (relação reage a ataque).
🟡 **Parcial:** #4 — Inteligência ligada; falta wiring de Economia/Mídia/Arsenal.

### ⏭ PRÓXIMO PASSO
1. **Teste com 2 clientes** para validar #2/#5/#8/#9/#10 no fluxo real (só dá pra ver com
   dois humanos numa sala).
2. **#4 restante** — novo bloco dedicado: sanção econômica dirigida, propaganda de mídia no
   feed compartilhado, sinal de inteligência do arsenal rival.
3. **Refinos do #8:** estender a janela de reação a guerra/terrestre e adicionar uma reação
   ATIVA (interceptar a ogiva) usando a defesa antiaérea já modelada em `nuclear.js`.

> **Por que os agentes investigam antes de editar:** as frentes tocam os MESMOS arquivos
> (`ui/jogo.js`, `ui/online.js`, `server/lobby.js`, `ui/defesa.js`). Editar em paralelo se
> atropela. Os agentes mapeiam e devolvem patches precisos (arquivo:linha); a implementação
> é aplicada de forma coordenada, uma frente por vez, começando pela A (que destrava mais).

---

## ORDEM DE EXECUÇÃO RECOMENDADA

1. **Frente A primeiro** — resolve/destrava #1, #2, #5 e prepara o terreno (roster + estado
   autoritativo) que #8 e #10 precisam.
2. **#8/#10** sobre o estado autoritativo criado na Frente A.
3. **Frente B (naval)** reaproveita a janela de reação criada no #8.
4. **#3 e #6** em paralelo (isolados do núcleo).
5. **#4 (auditoria)** fecha, validando que tudo ficou fiado no online.
