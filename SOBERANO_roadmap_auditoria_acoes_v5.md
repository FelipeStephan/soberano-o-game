# SOBERANO — Auditoria das 8 categorias de ação + Resultado Vivo (v5)

> Missão do dono: cada ação (Militar, Arsenal, Inteligência, Economia, Diplomacia,
> Ciência, Mídia, Política) tem que IMPACTAR de verdade e DEVOLVER um resultado visível
> e emocional quando resolve — como era nos turnos, agora no tempo real. Pensado online:
> o resultado é um objeto puro que amanhã chega pela rede igual chega do motor local.

## ETAPA 1 — Auditoria completa (read-only → docs/AUDITORIA-ACOES.md)
Para cada uma das ~74 ações do catálogo: (a) os `efeitos`/`politico`/`recruta`/`forcas`
realmente aplicam e são sentidos no jogo? (b) tem imagem (FOTO_ACAO)? (c) está na
categoria certa? (d) o `prob`/custo fazem sentido? Saída: tabela com veredito + lista
de correções priorizada.

## ETAPA 2 — RESULTADO VIVO (o coração)
Novo `ui/resultadoAcao.js`: pilha de cards de resultado no canto inferior ESQUERDO da
tela do globo (breaking é no centro; notificações à direita — sem sobreposição).
- Fila organizada: máx. 3 visíveis, os demais aguardam; cada card ~7s; hover pausa.
- Card: ícone/foto da ação, nome, VEREDITO (SUCESSO/FALHOU) com cor semântica, e os
  impactos (▲▼ com números) — clicável para expandir.
- COPY EMOCIONAL por categoria e desfecho (sucesso exalta, falha provoca revanche).
- Fonte: o objeto `resultado` de resolverFila (via aposAcaoTempo) — função pura,
  pronta pro online (servidor empurra o mesmo objeto).

## ETAPA 3 — Correções da auditoria (depende da Etapa 1)
Aplicar: efeitos quebrados/mortos, recategorizações, rebalanceios óbvios.

## ETAPA 4 — Imagens das ações
FOTO_ACAO completo: uma imagem real (Wikimedia, verificada) por ação sem foto.

## ETAPA 5 — Build + verificação + commit por etapa + push.
