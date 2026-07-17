# AUDITORIA — PRONTIDÃO ONLINE · PERFORMANCE · DEPLOY

Data: 2026-07-17 · Lote D (só análise; nenhum código alterado).
Convenção: **CRÍTICO** = bloqueia o online/derruba a experiência · **ALTO** = corrigir antes de escalar · **MÉDIO** = dívida controlada.
Todos os caminhos são relativos a `app/`.

---

## 1. PRONTIDÃO PARA O ONLINE

### 1.1 O que já está CERTO (não mexer)

- **Estado é JSON puro.** `src/jogo/save.js:1-60` — `jogo.estado` não tem classe, DOM nem função. `server/saves.js:47-60` já aceita o mesmo objeto. Save local e sync de rede são a mesma operação. ✔
- **Trânsito de frotas por timestamp.** `src/jogo/frotas.js:28-52` — `origem/destino/partiuEm/chegaEm` no próprio objeto; qualquer cliente interpola a mesma rota a partir dos mesmos números. É o modelo correto para online. ✔
- **Combate naval determinístico.** `src/jogo/frotas.js:108-127` — `resolverBatalhaNaval` sem dado; dois clientes calculam o mesmo resultado. ✔
- **Servidor único (HTTP+WS na mesma porta).** `server/index.js:64-65` — sem CORS em produção, WS em `/ws` no mesmo processo. ✔

### 1.2 Achados

**CRÍTICO — `src/jogo/acoes.js:19` — resolução de ação usa `Math.random()` local.**
`const sucesso = Math.random() < a.prob` é o dado central do jogo. No online, cada cliente rolaria um resultado diferente para a mesma ação.
Correção: criar `src/jogo/rng.js` com PRNG semeado (mulberry32, ~10 linhas). Toda a lógica de jogo importa `rand()` de lá em vez de `Math.random()`. No single-player a seed é local; no online a seed vem do servidor por sala+batida (`hash(salaId, turno)`), então todo cliente que replicar o evento chega ao mesmo número.

**CRÍTICO — `src/jogo/guerra.js:176,181-182,209` — combate terrestre não determinístico.**
`defensor = av.inimigo * (0.95 + Math.random()*0.3)`, os 5 rounds e as baixas usam RNG do atacante. Se o defensor humano re-simular (Modo Defesa do ONLINE.md), o resultado diverge.
Correção: no online a guerra jogador×jogador resolve **no servidor** (ou no cliente atacante com seed do servidor + o resultado relayado como fato). O `resolverGuerra` já é função pura de `(estado, feature, deploy, opts)` — basta injetar o RNG semeado via `opts.rng` e mandar a seed no evento `guerra` do lobby.

**CRÍTICO — `docs/ONLINE.md:75-97` + `server/lobby.js:155-167` — o relay aceita QUALQUER evento sem validação.**
`evento` repassa `tipo/alvo/dados` sem checar se o remetente PODE fazer aquilo (tesouro, PA, distância, guerra declarada). Um cliente modificado manda `{tipo:'nuclear', alvo:'BRA'}` de graça. O próprio ONLINE.md admite ("sem anti-trapaça"), mas para retenção multiplayer é a primeira coisa que mata a sala.
Correção mínima (sem virar autoritativo de vez): o servidor guarda por cliente um espelho leve `{tesouro, ogivas, emGuerra}` enviado no `ola`/autosave e valida os eventos caros (nuclear exige ogivas>0; guerra exige não estar já em guerra; cooldown por tipo). Correção de verdade (fase 2): resolver guerra/nuclear no servidor com o RNG semeado do item anterior.

**ALTO — `src/jogo/espionagem.js:93` — vazamento sorteado no cliente do espião.**
`if (Math.random() > chanceVazamento(...))`. No online, o segredo é do OUTRO jogador: quem decide se vaza não pode ser o espião.
Correção: no online, o `tickEspionagem` do alvo (ou do servidor) rola o dado e emite o evento `espionagem` com o resultado; o espião só recebe. O módulo já separa `chanceVazamento()` (pura) de `tickEspionagem()` (rola o dado) — mover só a rolagem.

**ALTO — `src/jogo/motor.js:485,504` + `src/jogo/ofensiva.js:75` — detecção de mobilização rolada no cliente errado.**
A chance de a MINHA inteligência flagrar a mobilização inimiga é rolada por quem mobiliza (motor) ou por quem ataca (ofensiva). No online (T4 do tempo real: "intel detecta ataque iminente"), o dado tem de ser do defensor ou do servidor — senão o atacante trapaceia escondendo a própria detecção.
Correção: evento `guerra_preparo` relayado com timestamp de maturação; o cliente DEFENSOR rola `chanceDeteccao` localmente por batida (a informação é dele; trapacear só o prejudica) — esta é a única rolagem que pode ficar no cliente sem risco.

**ALTO — `Date.now()` + clock skew — `src/jogo/frotas.js:28-37`, `src/ui/naval.js:233-239`, `src/ui/globo.js:1002`.**
`partiuEm/chegaEm` usam o relógio local de quem ordena. Entre clientes com skew de ±dezenas de segundos, a frota do outro aparece adiantada/atrasada, e `emTransito()` pode divergir no momento do combate (um cliente acha que chegou, o outro não).
Correção (barata e suficiente): handshake de offset no lobby — o cliente manda `ping` com `tCliente`, o servidor responde `pong` com `tServidor`; offset = média de 3 medições. Todo timestamp que viaja na rede é tempo do SERVIDOR; cada cliente converte com o offset ao interpolar. `frotas.js` não muda: `posicaoAtual(fr, agoraServidor)` já recebe `agora` por parâmetro (bem desenhado).

**ALTO — `src/jogo/motor.js:67` — os FIOS narrativos não sobrevivem ao save/restore.**
`this.fios = (ficha.fiosSemente || []).map(criarFio)` roda SEMPRE, mesmo com `saveRestaurado` — a memória narrativa (guerras em curso, escândalos) zera ao recarregar. `salvarPartida` (`src/jogo/save.js`) também não grava `fios`. No online, reconectar = Máquina amnésica.
Correção: incluir `fios: jogo.fios` no save e, no construtor, `this.fios = this._saveRestaurado?.fios?.map(reidratar) || (ficha.fiosSemente||[]).map(criarFio)`. Fios já são objetos planos.

**MÉDIO — mundo NPC não determinístico — `src/jogo/mundo.js:8,37-58,100-144`, `src/jogo/mundoVivo.js:24-25,119,155,196-238,358`, `src/jogo/petroleo.js:132`, `src/jogo/agressao.js:106-150`, `src/jogo/paz.js:106,131,178`, `src/jogo/compras.js:155`, `src/jogo/nuclear.js:92,147`, `src/jogo/intervencaoConflito.js:57-77`.**
Cada cliente simula um mundo NPC próprio (o modelo do ONLINE.md aceita isso: "mundo compartilhado" = só interações humanas). MAS: o Brent, as guerras NPC e as pandemias aparecem no feed/globo compartilhado — dois jogadores da mesma sala verão mundos contraditórios ("a China invadiu Taiwan" só na tela de um).
Correção: eleger o HOST da sala como dono do mundo NPC — o `beatMundo` dele emite `evento {tipo:'mundo', dados:{conflitosNPC, pandemias, brent}}` e os demais aplicam em vez de simular. Com o `rng.js` semeado (mesma seed de sala), dá até para cada cliente simular idêntico sem tráfego.

**MÉDIO — `server/lobby.js:96-99` — identidade por `perfilId` declarado, sem prova.**
Qualquer um entra com o `perfilId` de outro e "é" ele (rouba a sala, o país, o nome). Aceitável no protótipo, letal com ranking/persistência.
Correção: token aleatório emitido no primeiro `PUT /api/profile` e exigido no `ola`; guarda no registro do perfil (o `store.js` já serve).

**MÉDIO — `server/lobby.js:112-125` — `criar` não valida país e `evento` não tem rate-limit nem limite de `dados`.**
No `criar`, `c.pais` é aceito sem checar colisão (só a mensagem `pais` checa); `dados: msg.dados || null` aceita payload de qualquer tamanho até o teto do frame WS — um cliente pode inundar a sala.
Correção: reusar a checagem de país ocupado no `criar`; limitar `JSON.stringify(msg.dados).length` (ex.: 4 KB) e aplicar rate-limit simples por cliente (ex.: 10 eventos/10 s, senão desconecta).

**MÉDIO — `server/lobby.js:94` — WebSocketServer sem checagem de `Origin` (CSWSH).**
Qualquer site aberto no navegador do jogador pode conectar no lobby com os cookies/contexto dele.
Correção: `new WebSocketServer({ server, path:'/ws', verifyClient: ({origin}) => !origin || origin === process.env.PUBLIC_URL })`.

**MÉDIO — salas em memória — `server/lobby.js:22-24`.**
Deploy/restart derruba todas as salas (Render free reinicia ao dormir). O ONLINE.md já lista "persistência da sala" como Depois; registrando aqui o gatilho: persistir `{codigo, hostId, jogadores}` no `store.js` e aceitar `reconectar {codigo, perfilId}`.

---

## 2. PERFORMANCE / ANIMAÇÕES

O loop `anima()` (`src/ui/globo.js:903-1014`) está saudável no geral (arrays varridos de trás pra frente, throttle de frota a ~22 fps, tooltip reaproveitado). Os 5 maiores custos, em ordem:

**1. CRÍTICO — `src/ui/globo.js:1557` — `montarSatelites()` roda em TODO `atualizar()` e recria geometria sem dispose.**
`atualizar()` roda a cada batida (30 s), toast, seleção, chegada de frota — e toda vez destrói e recria N satélites + N `TorusGeometry(…, 6, 100)` (trilhas de 100 segmentos). `orbitas.remove()` NÃO libera GPU: sem `geometry.dispose()/material.dispose()` é vazamento de VRAM contínuo; com dezenas de atualizações por minuto no multiplayer, o frame time degrada sessão adentro.
Correção: guardar `satsN` e só reconstruir quando `Math.min(4, inteligencia/25)` MUDAR; ao reconstruir, chamar `dispose()` em geometria e material dos removidos. 3 linhas.

**2. ALTO — `src/ui/globo.js:1209-1560` — `atualizar()` recria TODOS os marcadores (menos frotas), destruindo os nós DOM.**
O pool (`poolFrota`/`poolInimiga`, linha 194) prova que o padrão certo existe — mas capital, guerras, ocupações, bases, tensões, badges de domínio, conflitos NPC e pandemias são objetos NOVOS a cada chamada (`novos.push({...})`). O globe.gl compara por identidade: cada `atualizar()` remove e recria dezenas de `<div>` com `<img>` de bandeira (re-decode de imagem), listeners e HTML de tooltip re-stringificado. Com dezenas de movimentos simultâneos (visão multiplayer), é o maior custo recorrente.
Correção: generalizar o pool — um `Map` chaveado por id estável (`guerra:RUS`, `base:${b.id}`, `npc:${c.id}`) com `Object.assign` no objeto existente, igual às frotas. Os tooltips (`tip`) devem ser montados sob demanda no `mouseenter`, não pré-stringificados para todos os marcadores.

**3. ALTO — `src/ui/globo.js:1002-1004` — alocação de array por FRAME no tique de frotas.**
`[...(frotas||[]), ...(frotasInimigas||[])]` + `.some()` rodam a 60 fps mesmo sem nenhuma frota em trânsito — o throttle de 45 ms só protege o `tickTransito`, não a alocação.
Correção: guarda de saída barata antes do spread: `if (!estado.frotas?.length && !estado.frotasInimigas?.length) …`; manter um flag `algumaEmTransito` atualizado quando um trânsito inicia/termina, e só montar o array quando ele for `true`.

**4. MÉDIO — `src/ui/globo.js:1732-1775` — `pintarCamada()` refaz `filter`+spread de ~200 features e `montarPontos()` a cada `atualizar()`.**
`paisesLisos = features.filter(...)`, `mistura = [...]`, `labelsData(features.filter(...))` e `pointsData(montarPontos(...))` recomputam mesmo quando `abertos` não mudou (o caso comum: `atualizar()` por batida sem seleção nova). O globe.gl reprocessa a camada de polígonos inteira.
Correção: memoizar por chave `(selecionado, teatro, emGuerra.join())` — se a chave não mudou, só reexecutar os accessors de cor (`globe.polygonCapColor(globe.polygonCapColor())` força repintura barata) em vez de `polygonsData(mistura)` novo.

**5. MÉDIO — `src/ui/tempoReal.js:86-108` — `renderFila()` reconstrói innerHTML e re-registra listeners a CADA segundo.**
`alvo.innerHTML = fila.map(...)` + `querySelectorAll('.ft-chip').forEach(addEventListener)` rodam no tick de 1 s mesmo com a fila parada — churn de DOM e de listeners (os antigos morrem com os nós, não vaza, mas gera GC).
Correção: delegação de evento (um listener no `#fila-tempo`, `e.target.closest('.ft-chip')`) registrado uma vez; no tick, só atualizar `textContent`/`style.width` dos chips existentes; reconstruir o HTML apenas quando `fila.length` mudar.

Menores (registrar, não urgente):
- **MÉDIO — `src/ui/globo.js:1052-1055`** — `window.addEventListener('resize', resize)` + `ResizeObserver` nunca são removidos; remontar o globo (voltar à home e entrar de novo) acumula listeners órfãos segurando o closure inteiro (globo antigo não é coletado). Correção: devolver um `destruir()` que faz `ro.disconnect()`, `removeEventListener` e `cancelAnimationFrame` do `anima()` (hoje o rAF do globo antigo roda para sempre — **é um loop órfão de verdade**, o `anima()` não tem condição de parada).
- **MÉDIO — `src/ui/globo.js:34`** — texturas do globo vêm de CDN (`cdn.jsdelivr.net`) em runtime; primeira pintura depende de rede externa. Copiar `earth-blue-marble.jpg/earth-dark.jpg/earth-topology.png` para `public/` (~1,5 MB) e servir local.
- **MÉDIO — imagens de bandeira/foto nos marcadores sem `loading="lazy"` e recriadas no item 2** — resolvido de graça pelo pool.
- `alertaTemporario` (`globo.js:735-745`) chama `atualizar()` completo duas vezes por cosmético — com o pool do item 2 fica barato; sem ele, é mais um gatilho do custo 2.

---

## 3. DEPLOY

### 3.1 O que já está pronto

| Peça | Estado |
|---|---|
| Build do cliente servido pelo server | ✔ `server/index.js:51-55` (`dist/` + SPA fallback) |
| CORS | ✔ desnecessário — mesma origem em prod; dev usa proxy Vite (`vite.config.js`) |
| WS na mesma porta | ✔ `server/index.js:64-65` (`/ws`) |
| Health check | ✔ `GET /api/health` com estado do store (`server/index.js:38-40`) |
| Persistência na nuvem | ✔ `server/store.js` — Postgres (Neon) se `DATABASE_URL`, senão JSON local |
| Dockerfile multi-stage | ✔ `Dockerfile` (imagem enxuta, `EXPOSE 8787`) |
| Blueprint Render | ✔ `render.yaml` |
| Env de exemplo | ✔ `.env.example` |
| Shutdown limpo | ✔ SIGTERM/SIGINT (`server/index.js:83-85`) |

### 3.2 O que FALTA

- **ALTO — compressão ausente.** O bundle (three + globe.gl) e os geojson saem sem gzip/brotli do Express (`server/index.js:52`). Atrás de proxy (Caddy/nginx) o proxy resolve; em exposição direta, `npm i compression` + `app.use(compression())`. Alternativa zero-dep: pré-comprimir no build e servir `.br` com `express-static-gzip`.
- **ALTO — variáveis obrigatórias não bloqueiam o boot.** Sem `ADMIN_PASSWORD` o server sobe com admin destrancado (só loga aviso, `server/index.js:75`). Em produção, falhar o boot se `NODE_ENV==='production'` e faltar `ADMIN_PASSWORD`.
- **MÉDIO — Dockerfile roda como root e sem `HEALTHCHECK`.** Adicionar `USER node` (após `chown` do `server/data`) e `HEALTHCHECK CMD wget -qO- http://localhost:8787/api/health || exit 1`.
- **MÉDIO — sem `docker-compose.yml`.** Para VPS genérica, um compose com o serviço + volume nomeado em `/app/server/data` (fallback sem Neon) documenta o deploy inteiro num arquivo.
- **MÉDIO — WS atrás de proxy exige upgrade configurado.** Documentar no README: nginx precisa de `proxy_set_header Upgrade/Connection` em `/ws`; Caddy faz sozinho.
- **MÉDIO — `PUBLIC_URL` precisa ser setada em prod** (Referer do OpenRouter e, após a correção 1.2, checagem de Origin do WS).

### 3.3 Passo-a-passo — VPS genérica com Docker (não executado)

```
# 0. Pré-requisitos: VPS Ubuntu 22+, domínio apontado (A record), Docker instalado.

# 1. Código na VPS
git clone <repo> soberano && cd soberano/app

# 2. Banco (recomendado): criar projeto no Neon (free) → copiar a connection string
#    postgresql://...?sslmode=require   (sem isso, saves morrem a cada deploy)

# 3. Variáveis
cp .env.example .env
#    preencher: OPENROUTER_API_KEY, ADMIN_PASSWORD (forte), DATABASE_URL,
#    PUBLIC_URL=https://soberano.seudominio.com, PORT=8787

# 4. Build e subida
docker build -t soberano .
docker run -d --name soberano --restart unless-stopped \
  --env-file .env -p 127.0.0.1:8787:8787 \
  -v soberano_data:/app/server/data \
  soberano
#    (-v só importa se não houver DATABASE_URL; com Neon é redundante mas inofensivo)

# 5. TLS + proxy (Caddy — 2 linhas, WebSocket automático)
#    /etc/caddy/Caddyfile:
#      soberano.seudominio.com {
#          reverse_proxy 127.0.0.1:8787
#      }
sudo systemctl reload caddy

# 6. Verificação
curl https://soberano.seudominio.com/api/health
#    → {"ok":true, "store":{"backend":"postgres","persistente":true}}  ← TEM de dizer postgres
#    abrir /admin, logar com ADMIN_PASSWORD, conferir "IA ligada"
#    abrir o jogo em duas abas → criar sala → entrar por código → evento chega na outra aba

# 7. Atualizar
git pull && docker build -t soberano . && docker rm -f soberano && (repetir o run do passo 4)
```

Armadilhas conhecidas: (a) `store` respondendo `"arquivo"` em prod = `DATABASE_URL` não chegou — o save evapora no próximo deploy; (b) Render free dorme em 15 min e derruba o lobby (salas em memória, ver 1.2) — para multiplayer de verdade, VPS ou plano pago; (c) sem `PUBLIC_URL`, o OpenRouter recebe Referer localhost.

---

## TOP 10 DO PRÓXIMO CICLO (impacto em jogabilidade/retenção)

Critério: ansiedade boa (ameaça legível e iminente) > espera que gera desejo (timers, preparo visível) > conquista visível (o mapa conta a vitória).

1. **RNG semeado compartilhado (`src/jogo/rng.js`) + guerra PvP resolvida com seed do servidor** (1.2 crítico 1-2). É o alicerce: sem ele, nenhuma interação humana×humana é confiável — e a confiança é a retenção do multiplayer.
2. **Validação mínima de eventos no lobby** (`server/lobby.js:155`) — nuclear/guerra sem lastro mata a sala em 1 partida. Trapaça impune = jogador honesto nunca volta.
3. **Pool universal de marcadores no globo** (`globo.js`, perf 2) — o globo é o palco da ansiedade; engasgo durante um ataque quebra o clímax exatamente no pico emocional.
4. **`montarSatelites` só quando muda + dispose** (perf 1) — sessões longas (as que você QUER) não podem degradar; retenção mora na sessão de 2 h que continua lisa.
5. **Offset de relógio servidor→cliente para frotas** (1.2 clock skew) — "a frota dele chegou antes na tela dele" é a discussão que destrói a percepção de justiça; frota cruzando o mapa em sincronia é espera-que-gera-desejo funcionando entre humanos.
6. **Detecção de ataque no cliente do DEFENSOR (T4 do tempo real)** — é a mecânica de ansiedade nº 1 do ONLINE.md ("algo se move no sul, não sei o quê"); rola o dado localmente por batida, com nitidez proporcional à Inteligência.
7. **Fios no save/restore** (`motor.js:67`) — a Máquina lembrar da SUA guerra ao reconectar é o que faz a narrativa parecer viva; amnésia narrativa quebra o drama que é a alma do jogo.
8. **Mundo NPC do host relayado à sala** (1.2 médio) — Brent, guerras NPC e pandemias iguais para todos: o "mundo compartilhado" prometido; sem isso, os jogadores nem conseguem conversar sobre a partida.
9. **Reconexão de sala (persistir salas no store) + token de perfil** — cair da sala e perder tudo é o churn mais barato de evitar; a espera de voltar para a MESMA guerra é desejo, não fricção.
10. **Deploy endurecido: compression, boot que exige ADMIN_PASSWORD, Origin check no WS, texturas locais, docker-compose** — primeiro carregamento rápido e primeiro acesso seguro; a primeira impressão do link compartilhado é uma feature de retenção.
