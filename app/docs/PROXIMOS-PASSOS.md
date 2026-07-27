# PRÓXIMOS PASSOS — SOBERANO

> Documento-mapa. Atualizado em 2026-07-18. Se você (ou outra IA) pegar o projeto
> agora, comece por aqui. Os detalhes técnicos de cada item estão nos docs citados.

---

## ONDE O PROJETO ESTÁ

**No ar:** https://soberano.uxstephan.com (VPS Hostinger KVM2, Docker + Caddy/HTTPS)
**Repo:** github.com/FelipeStephan/soberano-o-game — branch `main`
**Atualizar a VPS:** `cd /opt/soberano && git pull && cd app && docker compose up -d --build`

**Funciona hoje:** single-player completo; online com mundo único (mesmo calendário,
Brent, crises e feed para a sala), ataques/frotas/anexação ecoando entre jogadores,
alianças com aceite humano e cascata de hostilidade, telefone/voz, obituário de IA
na queda, Fake News (@Choquei).

---

## 1. AÇÕES IMEDIATAS DO DONO (5 minutos, no /admin)

1. **Recuperar a senha:** `grep ADMIN_PASSWORD /opt/soberano/app/.env` no terminal da VPS.
2. **Entrar em** https://soberano.uxstephan.com/admin **e trocar o modelo de IA.**
   Hoje é `anthropic/claude-3.5-sonnet` para TUDO, inclusive manchetes de 12 palavras.
   É a maior economia que ainda sobra (ver `CUSTO-IA.md`).
3. **Conferir o consumo** (chamadas/tokens no painel) depois de uma partida, para saber
   se os cortes já resolveram ou se é preciso baixar `AI_TETO_DIARIO` no `.env`.
4. **Tirar um snapshot** do VPS no painel da Hostinger agora que está tudo funcionando.

---

## 2. O QUE VEM A SEGUIR NO CÓDIGO (ordem recomendada)

A ordem abaixo não é arbitrária: começa pelo que o jogador toca toda partida e
termina no que é grande e isolado. Detalhe completo de cada item em `BACKLOG-LOTE3.md`.

### 🥇 PRÓXIMO — Grupo 3: Defesa e distribuição de tropas
*Por que primeiro:* é a tela que o jogador usa toda partida, e está mapeada linha a linha.

- **#3.4 — Inputs mostram a quantidade REAL** (hoje sempre `0`).
  Causa já identificada: o input representa a *movimentação* do turno, não o estoque
  (`ui/reforco.js:144-148`, `value="0"` literal). A correção é `value="${aqui}"` +
  `envio[u] = v - aqui` no recalc + clamp `0..aqui+noQuartel`.
- **#3.1 — Modo Defesa vira MAPA** com os estados pulsando, em vez de lista.
  Reusar a projeção de `ui/mapaEstados.js` (extrair `projetar`+`geoParaPath` para um
  helper). ⚠️ Bug a corrigir junto: `ui/defesa.js:23` lê só `dados.alvoEstado`, mas
  `ataque_estado` manda `estadoId` e `guerra` manda `alvoEstado: null` **hardcoded**
  (`ui/guerra.js:444`) — hoje o "ALVO PROVÁVEL" é sempre o primeiro estado da lista.
- **#3.3 — Distribuir começa VAZIO** + doutrina + barra de fração.
  `distribuirAuto` **já aceita `fracao`** (`jogo/territorio.js:365`) — é só expor a barra.

### 🥈 Grupo 4: Guerra
- **#4.1 — Botão "SAIR DA GUERRA"** no painel do país. `sairDaGuerra(estado, iso)` já
  existe pronto em `jogo/paz.js:159`. É só o botão + o eco no online.
- **#4.2 — Ataque em segredo:** mísseis só quando o preparo termina; para o atacante,
  linha vermelha de "preparação". Inteligência alta descobre e divulga.

### 🥉 Grupo 5: Bases militares com sentido
Hoje a distância **só reduz** custo (`ui/guerra.js:291` e `:431` — duas fórmulas
duplicadas, cuidado) e atacar do outro lado do mundo saindo de casa **não tem
penalidade**. Falta o multiplicador de distância. `distAlvo` já está calculado.

### Grupo 6: Nuclear
- Zona morta visível para todos no online + status de "morto" do jogador atingido.
- **Urânio acaba:** a var `uranio` já existe (`jogo/vars.js:27`) e a ogiva já exige
  `uranio >= 60`. Falta **consumir** ao fabricar.
- **Partida sem nucleares:** ⚠️ o gate não é só o estado do jogador — `ogivasDoAlvo`
  (`jogo/nuclear.js:29`) lê a ficha **estática** dos NPCs. Precisa de um flag global
  (`estado.semNucleares`) consultado em 4 lugares.

### Grupo 7: Ciência → petróleo
⚠️ `efeitos: { petroleo_producao: N }` é **silenciosamente descartado** (a chave não
está em `VARS`) e `sincronizarPetroleo` sobrescreve tudo no turno seguinte. O caminho
certo: criar var `tec_petroleo` em `jogo/vars.js` e multiplicar em `jogo/petroleo.js:52`.

### Grupo 10: Blocos
Bloco criado **já aparece** no visor (`ui/blocos.js:40`). Falta o **chat do bloco** —
não existe broadcast por grupo no servidor; o caminho barato é iterar os membros com
`net.direto('bloco', iso, {...})` reusando a UI de `ui/telefone.js:233`.

### Grupo 9: ONU (o maior — deixar por último)
Sala de reunião: convocação, país-foco, votação por jogador, microfone (o WebRTC da
telefonia já existe em `net/chamada.js`), chat, UI intimidadora, e penas que impactem
de verdade (congelar recursos, embargo). É a feature mais cara do backlog.

---

## 3. DECISÕES DE PRODUTO PENDENTES (não é código — é escolha sua)

### #11 — O jogador que perde e quer voltar
Precisa de uma decisão antes de implementar. As opções:
- **A)** Ele volta com o MESMO país (a partida continua de onde parou). Simples, mas
  quebra a consequência: perder deixa de doer.
- **B)** A Máquina assume o país dele e ele **volta com outro país livre**. Mantém o
  mundo coerente (o país não some nem congela) e preserva o peso da derrota.
  *É a recomendação* — mas exige um "modo espectador" enquanto ele escolhe.
- **C)** Ele fica de fora até a sala acabar. Mais duro, provavelmente frustrante.

### Aliado arrastado para a guerra
Quando um aliado entra em guerra, ele passa a ver a **visão detalhada** do conflito
(estados atingidos, forças) ou só a marca no mapa? Decidir antes de codar.

---

## 4. DÍVIDAS TÉCNICAS CONHECIDAS (não urgentes, mas registradas)

- **Migração de host:** se o host sai da sala, o relógio do mundo PARA. Ninguém assume.
- **Sem validação anti-trapaça:** o servidor é relay, não autoridade. Um cliente
  modificado pode declarar o que quiser (nuclear sem ogiva, etc.).
- **Teto diário de IA em memória:** reiniciar o servidor zera o contador.
- **Saves em arquivo:** `DATABASE_URL` (Neon) não está preenchida — funciona pelo
  volume do Docker, mas não é "nuvem de verdade".
- **Detecção de frota só na chegada**, não durante a travessia.
- **Áreas mudas no online:** Economia (sanção dirigida), Mídia (propaganda de
  convidado), Arsenal (sinal de rearmamento), Política (golpe).

---

## 5. MAPA DOS DOCUMENTOS

| Documento | O que tem |
|---|---|
| **PROXIMOS-PASSOS.md** | este arquivo — por onde continuar |
| `CUSTO-IA.md` | auditoria de consumo de IA e os controles aplicados |
| `BACKLOG-LOTE3.md` | os 11 grupos pedidos, com causa-raiz mapeada |
| `METODOLOGIA-ONLINE.md` | as regras do mundo único (descoberta rege informação; o resultado é de todos; o alarme é sagrado) |
| `BACKLOG-ONLINE.md` | backlog do online anterior |
| `PLANO-MUNDO-UNICO.md` | o plano de 8 etapas do multiplayer (etapas 1-4 feitas) |
| `AJUSTES-ONLINE-MATHEUS.md` | os 10 ajustes do colaborador + veredito arquitetural |
| `README-DEPLOY.md` | como o deploy funciona |

---

## 6. REGRA DE OURO PARA QUEM CONTINUAR

**Antes de mudanças grandes, rode `git branch -r`.** Já houve trabalho paralelo neste
projeto (branch `matheus`) que quase virou conflito. Integrar cedo é barato; tarde, não.
