# CUSTO DE IA — auditoria e controles (2026-07-18)

O dono reportou gasto alto demais no OpenRouter. Auditoria completa + correções.

## O que estava sangrando (por ordem de impacto)

| # | Problema | Por que doía |
|---|---|---|
| 1 | **Nenhuma chamada tinha `max_tokens`** | Uma manchete de 12 palavras podia devolver 800 tokens de saída — e ser cobrada como tal. Valia para as 8 chamadas do jogo. |
| 2 | **Breaking automático usava IA** | Dois gatilhos por timer (pulso de 24s, batida de 30s) geravam manchete por IA para um texto 100% previsível ("Brent dispara para US$ 96"). |
| 3 | **No online, TODOS geravam a mesma manchete** | O convidado também roda `aposBeatTempo` → cada cliente pagava a própria manchete do MESMO evento. Com 4 jogadores, 4×. |
| 4 | **`enriquecerTensaoIA` em rajada** | Rodava para TODO país hostil dentro de `atualizar()` (que tem 46 call-sites). 10+ chamadas simultâneas — acima do próprio rate-limit — por um texto que só aparece num tooltip. E ainda estava **quebrado**: mostrava JSON cru e cacheava assim. |
| 5 | **Sem cache no servidor** | Perguntas idênticas pagavam sempre. |
| 6 | **`gerarTurno` com 2 tentativas** | A chamada mais cara (~2.400 tokens de entrada) dobrava quando o JSON vinha torto. |

## O que foi feito

- **`max_tokens` em toda a cadeia** (cliente → `/api/ai/generate` → OpenRouter), com teto
  por tipo: breaking 90 · tensão 80 · índice 110 · guerra 220 · obituário 520 ·
  despachos/conselheiro 700 · default 700. Clamp 32–2000 no servidor.
- **Cache de resposta no servidor** (10 min, hash de `system+user+temperature`, teto de
  400 entradas). Mata a duplicação do online quase de graça.
- **Breaking automático sem IA**: usa o molde local (`ctx.auto` + `ctx.manchete`).
- **Breaking automático só do host** no online (`jogo._souHostOnline()`).
- **Tensão só do país selecionado** + parse correto do JSON.
- **`MAX_TENTATIVAS = 1`** no gerador de turno.

## Medição

Partida rodando, 40s ociosos com o mundo vivo produzindo posts: **0 chamadas de IA**.
Antes o piso ocioso era ~1/min — multiplicado por jogador no online.

## Se ainda achar caro (próximos passos)

1. **Trocar o modelo padrão** no `/admin`: `claude-3.5-sonnet` para microtarefas é
   desperdício. Um modelo barato para manchete/tensão/índice e o bom só para
   `gerarTurno` cortaria a maior parte do que sobrou. (Exige passar `model` por
   chamada — hoje o servidor usa sempre `cfg.model`.)
2. **Prompt caching** da Anthropic no system de `gerarTurno` (~2.000 tokens fixos
   reenviados a cada chamada).
3. **Baixar `AI_TETO_DIARIO`** no `.env` da VPS para um número que caiba no bolso —
   ao estourar, o jogo cai na reserva local e **continua jogável**.
4. O contador de teto diário vive em memória: reiniciar o servidor zera. Se virar
   problema, persistir no store.
