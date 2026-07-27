# PRÓXIMOS PASSOS — SOBERANO

> Documento-mapa. Atualizado em 2026-07-27. Se você (ou outra IA) pegar o projeto
> agora, comece por aqui. Os detalhes técnicos de cada item estão nos docs citados.

---

## ONDE O PROJETO ESTÁ

**No ar:** https://soberano.uxstephan.com (VPS Hostinger KVM2, Docker + Caddy/HTTPS)
**Repo:** github.com/FelipeStephan/soberano-o-game — branch `main`
**Atualizar a VPS:** `cd /opt/soberano && git pull && cd app && docker compose up -d --build`

**Funciona hoje:** single-player completo; online com mundo único (mesmo calendário,
Brent, crises e feed para a sala), ataques/frotas/anexação ecoando entre jogadores,
alianças com aceite humano e cascata de hostilidade, telefone/voz 1:1, obituário de
IA na queda, Fake News (@Choquei). Desta rodada: Modo Defesa em MAPA com resposta
naval própria (`ui/defesa.js` + `ui/projecao.js`); distribuição de tropas com barra
de força e reserva visível (`ui/distribuir.js`); ofensiva SECRETA até a inteligência
do alvo flagrar (`jogo/ofensiva.js`); sair da guerra unilateral; nuclear com zona
morta e "nação morta" ecoando pra sala inteira, urânio consumido de verdade, e opção
de partida sem armas nucleares (`jogo/nuclear.js`); ciência aplicada a petróleo;
Conselho de Segurança da ONU com votação, chat e penas reais (`ui/onu.js`); chat de
bloco (`ui/blocoChat.js`); direito de base por aliança militar; e o jogador que cai
renasce em outro país na MESMA sala sem recarregar a página (`ui/renascer.js`).

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

## 2. O QUE VEM A SEGUIR NO CÓDIGO

O `BACKLOG-LOTE3.md` (11 grupos, 2 rodadas) está praticamente inteiro entregue —
só sobrou o microfone em grupo da ONU, listado abaixo junto com a dívida técnica de
infraestrutura que nunca esteve no backlog de feature, mas que segue precisando de
dono. Não há mais ordem "1º, 2º, 3º" de prioridade de jogabilidade: o que resta é
mais estrutural, e cada item é independente dos outros.

### Microfone de voz em grupo na ONU
O Conselho de Segurança (`ui/onu.js`) tem sessão, votação, chat de texto e fila de
"pedir a palavra" — mas nada de voz aberta. `criarTelefonia` (`net/chamada.js`)
guarda uma única `RTCPeerConnection` e recusa a segunda chamada; a sinalização dela
(`tel-convite`, `tel-ice`...) já está consumida pela telefonia 1:1
(`ui/telefone.js`, canal `direto`). Voz de SALA (N participantes) pede uma malha
N-1 — uma conexão WebRTC por participante — e um namespace de sinalização próprio no
servidor, porque reaproveitar o da telefonia faria "chamada recebida" pipocar no
meio da sessão. É trabalho de rede de verdade, não um encaixe de tarde.

### Migração de host
Se o host sai da sala, o relógio do mundo (o `setInterval` central que bate a cada
30s — ver `soberano-tempo-real.md`) PARA. Ninguém assume o papel. Precisa de uma
eleição simples (o próximo jogador com socket aberto vira host) e o convidado que
assumir precisa herdar o cache do `snapshotMundo` pra não perder retrato do turno.

### Sem validação anti-trapaça no servidor
O servidor (`server/lobby.js`) é relay, não autoridade: repassa bilhetes, não
confere se fazem sentido. Um cliente modificado pode declarar nuclear sem ogiva,
anexar sem ocupação estável, ou inventar `guarn`/`intel` nos `statsVivos` que
`forcaDefensivaNPC` consulta. Resolver de verdade significa o servidor guardar pelo
menos um resumo do estado de cada jogador e recusar eventos que não batem — hoje
ele não guarda nada.

### Detecção contínua de frota em trânsito
A inteligência só flagra a frota inimiga quando ela CHEGA perto da costa
(`vetoresAmeaca()` em `ui/distribuir.js`, `frotasInimigas` no estado). Não há
detecção durante a travessia — uma esquadra cruzando o Atlântico é invisível até
estar quase encostando. Seria o mesmo princípio do `chanceDeteccaoAlvo` da ofensiva
terrestre (`jogo/ofensiva.js`), aplicado à frota.

### Áreas ainda mudas no online
Quatro categorias de ação não ecoam pra sala: **Economia** (sanção dirigida a um
jogador específico), **Mídia** (propaganda direcionada a um convidado), **Arsenal**
(sinal de rearmamento visível pros outros) e **Política** (golpe/interferência
eleitoral). Hoje essas ações só afetam o próprio estado — no online, ninguém mais
vê ou sente o efeito.

### Teto diário de IA em memória e `DATABASE_URL` (Neon) vazia
O teto (`AI_TETO_DIARIO`) é contado em memória do processo Node — reiniciar o
servidor zera o contador, então um restart no meio do dia reabre o gasto. E os
saves funcionam pelo volume do Docker, não por um banco de verdade: `DATABASE_URL`
(Neon, Postgres serverless) está prevista no `.env` mas nunca foi preenchida. Sem
ela não há "nuvem" — se o volume do VPS se perder, os saves vão junto.

---

## 3. DECISÕES DE PRODUTO PENDENTES (não é código — é escolha sua)

### #11 — O jogador que perde e quer voltar — RESOLVIDO
Decisão tomada: **opção B**. Quem cai vira espectador, a Máquina assume o país
dele, e ele assume outra nação livre na mesma sala sem recarregar a página.
Implementado em `ui/renascer.js` (a tela de escolha + a faixa de espectador) e
`main.js` (a função `renascer()` reconstrói a partida reusando a mesma conexão
`net`, sem `location.reload()` — é o mesmo caminho de quem entra tarde numa sala em
curso). O raciocínio completo da escolha está no comentário de topo de
`ui/renascer.js`: a opção A (mesmo país) destrói a consequência de perder; a C
(fica de fora) bane alguém de um serão de horas.

### Aliado arrastado para a guerra — AINDA PENDENTE
Quando um aliado entra em guerra, ele passa a ver a **visão detalhada** do conflito
(estados atingidos, forças) ou só a marca no mapa? Decidir antes de codar.

---

## 4. MAPA DOS DOCUMENTOS

| Documento | O que tem |
|---|---|
| **PROXIMOS-PASSOS.md** | este arquivo — por onde continuar |
| `CUSTO-IA.md` | auditoria de consumo de IA e os controles aplicados |
| `BACKLOG-LOTE3.md` | os 11 grupos pedidos, com causa-raiz mapeada — hoje quase todo 🟢 |
| `METODOLOGIA-ONLINE.md` | as regras do mundo único (descoberta rege informação; o resultado é de todos; o alarme é sagrado) |
| `BACKLOG-ONLINE.md` | backlog do online anterior |
| `PLANO-MUNDO-UNICO.md` | o plano de 8 etapas do multiplayer (etapas 1-4 feitas) |
| `AJUSTES-ONLINE-MATHEUS.md` | os 10 ajustes do colaborador + veredito arquitetural |
| `README-DEPLOY.md` | como o deploy funciona |

---

## 5. REGRA DE OURO PARA QUEM CONTINUAR

**Antes de mudanças grandes, rode `git branch -r`.** Já houve trabalho paralelo neste
projeto (branch `matheus`) que quase virou conflito. Integrar cedo é barato; tarde, não.
