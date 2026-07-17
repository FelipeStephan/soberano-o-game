# SOBERANO — Roadmap da noite (v4) · execução autônoma

> Prioridade cumprida: **projeto no GitHub** (privado, `FelipeStephan/soberano-o-game`, sem segredos).
> Abaixo, o plano em lotes — cada lote é um agente. Ao final de cada lote: build + commit.

## LOTE A — Limpeza de UX invasiva (espionagem discreta + copy)
1. **Remover textos/emojis de espionagem forçada.** A névoa deve ser SILENCIOSA:
   - `ui/tatico.js`: nada de "🕵️ Guarnição secreta / espione para revelar". Estado inimigo sem intel → simplesmente NÃO mostra guarnição (como se não houvesse dado). Com intel → mostra.
   - `ui/envio.js`: célula "Guarnição de X" só aparece COM intel. Sem intel → célula some (fica só relação/vantagem).
2. **Remover a previsão de resultado do ataque** ("força 4 contra defesa 3.78 — Rio cai e você perde 25%"). Isso mata a ansiedade. Manter SÓ a consequência diplomática (relação, guerra, bloco). Com intel de espionagem, pode mostrar a força da guarnição — nunca o desfecho.
3. **"batidas" → "meses"** em toda copy visível (o beat É o mês agora).
4. **Uma fila só**: fundir a fila de "ofensivas em preparo" na fila única de comando (ui/tempoReal.js / ui/jogo.js — classes `fila-barra tempo` e `fila-barra tempo operacoes`).

## LOTE B — Naval UX (hover digno + medidores legíveis)
5. Hover da frota: **foto de capa** (o veículo dominante) em cima, **lista com miniaturas** dos demais veículos embarcados, sem o badge azul "MAR" tapando a foto.
6. "Alcance 34° / Detecção 18°" → **barras visuais** (0–100%) com rótulo simples ("alcance longo", "radar médio"). Também no modal de clique (navalAcoes.js).

## LOTE C — Movimento real + tempos coerentes
7. **Rota marítima que desvia de terra**: usar `jogo/rotasMar.js` (rotaMaritima/construirMalha — já existe!) no `navegarFrota` (drag) e no trânsito porto→destino (`jogo/frotas.js`). Frota navega por waypoints, nunca cruza país.
8. **Radar do mar menor ainda** (o efeito no globo segue grande).
9. **Tempo de ofensiva ∝ escopo**: atacar 3 estados < atacar o país inteiro. Escalar `tempo` da operação pelo nº de estados selecionados (jogo/ofensiva.js + ui/guerra.js), com piso/teto.

## LOTE D — Auditoria online + performance (doc executável)
10. Analisar TODO o fluxo pensando no multiplayer (estado determinístico, interpolação por tempo, o que precisa ir pro servidor) + otimização de animações (throttles, pools, rebuilds de marcadores) + deploy checklist (Docker, env, admin). Produto: `docs/AUDITORIA-ONLINE.md` com problemas repetidos, sugestões e o que já foi corrigido.

## Psicologia de retenção (norte de design)
- Nunca contar o desfecho antes — mostrar risco, não resultado (ansiedade boa).
- Intel é privilégio conquistado (espionagem), não texto pedindo pra usar feature.
- Tudo que se move no globo leva TEMPO visível — esperar é desejar.
