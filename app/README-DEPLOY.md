# SOBERANO — Modo Online e Deploy

Este documento cobre como o jogo virou **online-ready** e como colocá-lo no ar.

---

## O que mudou (e por quê)

O jogo era single-player com a chave da IA no navegador. Três problemas para produção,
todos resolvidos:

| Antes | Agora |
|---|---|
| Chave OpenRouter no `localStorage` do jogador (qualquer um copiava no DevTools) | Chave só no **servidor** (`OPENROUTER_API_KEY`); o cliente chama um proxy `/api/ai/*` e nunca vê o segredo |
| Config de IA em `#admin`, dentro do bundle, acessível por qualquer jogador | **Página separada `/admin`**, servida só pelo servidor, atrás de senha (`ADMIN_PASSWORD`) |
| Save só no navegador (sumia ao trocar de máquina) | Save também na **nuvem**, atrelado a um perfil; o local continua funcionando offline |
| Mundo sem outros humanos | **Lobby WebSocket**: presença + eventos entre jogadores em tempo real (esqueleto do multiplayer) |

**A arquitetura é um processo só.** Um `node server/index.js` sobe o jogo, o proxy de IA,
o admin e o WebSocket — tudo na mesma porta. Deploy sem microsserviço, fila ou orquestração.

---

## Rodar localmente

### Desenvolvimento
```bash
npm install
npm run dev          # sobe o Vite (5173) E o backend (8787) juntos
```
Abra **http://localhost:5173**. O Vite faz proxy de `/api` e `/ws` pro backend, então o
cliente usa caminho relativo — igualzinho a produção.

> **Isto era uma armadilha e custou caro.** Antes, `npm run dev` subia **só** o Vite. O
> backend ficava morto, toda chamada de IA falhava por rede, e o jogo caía **em silêncio**
> nas cartas de reserva — que na época eram fixas dos EUA. O sintoma que chegava ao
> jogador era "a IA não sabe de que país eu jogo", e o culpado era um comando que ninguém
> tinha rodado. Hoje um comando sobe os dois, se um cair o outro morre junto, e toda queda
> pra reserva grita no console com a cura.

Se precisar dos processos separados: `npm run dev:so-vite` e `npm run dev:server`.

### Produção local (um processo, como no deploy)
```bash
cp .env.example .env    # preencha OPENROUTER_API_KEY e ADMIN_PASSWORD
npm run serve           # build + node server/index.js → http://localhost:8787
```

---

## Variáveis de ambiente (`.env`)

| Variável | Obrigatória | O que faz |
|---|---|---|
| `OPENROUTER_API_KEY` | para a IA | Chave do OpenRouter. Sem ela, o jogo roda em modo demonstração (textos locais). |
| `OPENROUTER_MODEL` | não | Modelo padrão (trocável no admin). Padrão: `anthropic/claude-3.5-sonnet`. |
| `ADMIN_PASSWORD` | para o admin | Senha do painel `/admin`. Sem ela, o painel fica trancado. |
| `DATABASE_URL` | em produção | Postgres (Neon). **Sem ela o store cai em arquivo JSON** — ótimo em dev, fatal num container (o disco é efêmero: cada deploy apaga os saves). |
| `AI_LIMITE_POR_MINUTO` | não | Gerações por IP/minuto. Padrão `12`. |
| `AI_TETO_DIARIO` | não | Gerações totais por dia. Padrão `600`. O freio de mão do seu bolso. |
| `PORT` | não | Porta HTTP + WebSocket. Padrão `8787`. |
| `PUBLIC_URL` | não | URL pública (vira o Referer no OpenRouter). |

> **Chave e orçamento são problemas diferentes.** O proxy resolve o primeiro: a chave mora
> no servidor e ninguém a rouba. Mas qualquer um com o endereço do jogo pode chamar
> `/api/ai/generate` num laço e torrar seus créditos — cada geração é uma chamada paga.
> `AI_LIMITE_POR_MINUTO` e `AI_TETO_DIARIO` são o que impede isso. Ao estourar, o jogo não
> quebra: cai na reserva local e o badge mostra "● NO LIMITE".

---

## A área administrativa

Acesse **`/admin`** (ex.: `https://seu-jogo.com/admin`). Ela **não existe dentro do jogo** —
o jogador nunca chega nela pelo app. Pede a senha (`ADMIN_PASSWORD`), e então permite:

- ver o estado da IA (conectada? qual modelo? quantas chamadas, tokens, latência);
- carregar a biblioteca de modelos do OpenRouter e trocar o modelo em runtime;
- rodar um teste de geração de ponta a ponta.

A sessão dura 12h (cookie httpOnly). Nada da configuração de IA passa pelo cliente do jogo.

---

## ▶ COLOCAR NO AR: Render + Neon (o caminho escolhido)

### Por que não Vercel
O backend é Express **com WebSocket de processo longo** (`server/lobby.js` — presença e
relay entre jogadores). Vercel é serverless: cada request é uma função efêmera e conexão
persistente não sobrevive. O multiplayer não existiria lá. Render, Railway e Fly rodam o
container inteiro — e o `Dockerfile` já existe.

### Passo 1 — Banco no Neon (5 min, grátis, não expira)
1. Crie a conta em **https://neon.tech** → **New Project** → nome `soberano`, região
   `US East (Ohio)` (mesma costa do Render free = menos latência).
2. Copie a **Connection String** (`postgresql://...?sslmode=require`). Guarde-a: ela é uma
   senha. Não comite, não cole em chat, não bote em print.

> **Por que Neon e não o Postgres do próprio Render:** o Postgres free do Render **expira
> em 30 dias** e leva os saves junto. Um trabalho de faculdade que perde os dados no meio
> do semestre é um problema que não precisa existir. O Neon free não expira.

Não há passo de migração: a tabela nasce sozinha no primeiro boot (`store.js`).

### Passo 2 — Repositório
O Render faz deploy a partir de um repositório Git. O projeto ainda **não é um repo**:
```bash
cd app
git init && git add -A
git commit -m "SOBERANO — protótipo jogável"
```
Depois crie um repositório (privado) no GitHub e dê `git push`. O `.gitignore` já protege
`.env`, `node_modules`, `dist` e `server/data`. **Confira que o `.env` não foi junto:**
```bash
git ls-files | grep -c "^\.env$"     # tem de responder 0
```

### Passo 3 — Render
1. **https://render.com** → **New +** → **Blueprint** → aponte pro repositório.
2. Ele lê o `render.yaml` e monta o serviço sozinho. Vai **perguntar** os três segredos:
   - `OPENROUTER_API_KEY` — sua chave
   - `ADMIN_PASSWORD` — invente uma forte (é a sala de máquinas)
   - `DATABASE_URL` — a string do Neon do Passo 1
3. Deploy. O primeiro leva ~5 min (build do Docker).

### Passo 4 — Conferir que subiu de verdade
```bash
curl https://SEU-APP.onrender.com/api/health
```
Tem de responder `"store":{"backend":"postgres","persistente":true}`.
**Se vier `"backend":"arquivo"`, o `DATABASE_URL` não chegou** — o jogo funciona, mas cada
deploy apaga os saves. É o erro mais comum e o mais silencioso; por isso o health o expõe.

Depois: abra o jogo, confirme o badge **"● IA ATIVA"** (não "SEM CHAVE"), e entre em
`/admin` com a senha pra ver as chamadas e o custo real.

### O que esperar do free tier
- **O serviço dorme após 15 min sem acesso** e leva ~50s pra acordar. Na apresentação da
  faculdade, abra o jogo **5 minutos antes** — ou a primeira impressão vai ser uma tela
  branca de 50 segundos.
- 512 MB de RAM. O bundle é ~3 MB (three.js/globe.gl); folgado.
- Se for demonstrar ao vivo, considere o plano pago de US$ 7/mês só no mês da entrega:
  não dorme, e não há nada mais caro que um deploy grátis falhando na hora da nota.

---

## Deploy com Docker (genérico)

```bash
docker build -t soberano .
docker run -d -p 8787:8787 \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  -e ADMIN_PASSWORD=uma-senha-forte \
  -e PUBLIC_URL=https://seu-jogo.com \
  -v soberano-data:/app/server/data \
  soberano
```
O volume em `/app/server/data` preserva perfis e saves entre reinícios.

---

## Deploy em host gerenciado (Render / Railway / Fly)

Todos suportam Docker ou Node direto. O essencial:

1. **Build command**: `npm run build`
2. **Start command**: `npm start`
3. **Variáveis de ambiente**: as da tabela acima (o host injeta em `process.env` — o
   `.env` nem precisa existir na nuvem).
4. **Porta**: o host define `PORT`; o servidor já respeita.
5. **Persistência**: monte um disco em `server/data` (ou troque `server/store.js` por um
   banco — a interface `buscar/salvar/listar/apagar` já está pronta para isso).

O WebSocket sobe na mesma porta HTTP, então nenhum host precisa de config extra para ele.

---

## Segurança — o que ainda vale endurecer antes de abrir ao público

Isto é um protótipo funcional, não um produto blindado. Se for abrir a estranhos:

- **Rate limit** no `/api/ai/generate` (hoje qualquer um pode gerar à vontade e gastar a
  sua cota — o proxy protege a chave, não o orçamento).
- **Perfil autenticado**: hoje o `id` do perfil é declarado pelo cliente, não provado.
  Para saves realmente privados, adicionar login (o contrato de `saves.js` não muda).
- **CORS**: hoje a API responde na mesma origem; se separar cliente e API em domínios
  diferentes, configurar CORS explícito.

Nenhum desses bloqueia o deploy — são a lista do "próximo passo" quando deixar de ser teste.

---

## Estrutura

```
server/
  env.js      carrega o .env antes de tudo
  index.js    junta tudo, serve o jogo, sobe HTTP+WS
  ai.js       proxy de IA (a chave vive aqui)
  admin.js    login + página /admin + rotas protegidas
  saves.js    perfil, save na nuvem, placar
  lobby.js    WebSocket: presença, salas, relay de eventos
  store.js    persistência (arquivo JSON hoje, banco depois)
src/net/
  api.js      cliente REST (o único que fala com o backend)
  lobby.js    cliente WebSocket
```
```
