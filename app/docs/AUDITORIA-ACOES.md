# AUDITORIA DO CATÁLOGO DE AÇÕES (73 ações, 8 categorias)

Data: 2026-07-17. Fontes: `src/dados/acoes.js` (catálogo), `src/jogo/acoes.js` (resolverFila),
`src/jogo/efeitos.js` + `vars.js` + `politico.js` (chaves reais), `src/jogo/motor.js`
(executarAcaoTempo/_reagirAcoes), `src/dados/imagens.js` (FOTO_ACAO), `src/ui/jogo.js` (chipAcao),
`src/ui/tempoReal.js` (fila do tempo real), `src/ui/equipamento.js`, `src/jogo/desbloqueios.js`.

## Fatos estruturais que valem para o catálogo inteiro

1. **Chaves de efeito**: `aplicarEfeitos` aceita toda chave em `VARS`, qualquer `rel_*` e o
   qualitativo `risco_exposicao`. **Nenhuma ação do catálogo usa chave inexistente** — zero efeito
   morto por chave inválida. Chaves `rel_*` ausentes no estado nascem em 0 (`estado[chave] ?? 0`).
2. **AÇÕES COM `forcas` SÃO MORTAS COMO AÇÃO**: em `ui/jogo.js:829-840`, qualquer ação com
   `a.forcas` vira um chip "FICHA ▸" (`data-equip`) que abre `ui/equipamento.js`/`ui/soldados.js`.
   A compra ali usa `aplicarForcas` direto (equipamento.js:115) — **os `efeitos`, `efeitos_falha`,
   `prob`, `politico`, `custo` e `requer` dessas 7 ações nunca executam**: `blindados`, `helis`,
   `cacas`, `porta_avioes`, `submarino`, `hipersonico`, `ia_militar`.
3. **Tags `politico` aplicam SEMPRE** (sucesso ou falha) — por design ("a intenção define quem
   você é"). Documentado, ok.
4. **Regex de major em `jogo/acoes.js:65`**: `/ogiva|conquista|guerra|golpe|nuclear|purga/`
   marca **`guerra_cambial` como major** (contém "guerra") → `motor._reagirAcoes` cria o fio
   **"Guerra em curso"** por causa de uma ação ECONÔMICA. Bug narrativo grave.
5. **`ui/tempoReal.js.enfileirar` não valida `requer` nem `desbloqueio`** — só caixa e tamanho da
   fila. A proteção é só o `disabled` do chip; qualquer chamada programática (ou UI defasada) fura o gate.
6. **Categoria Mídia tem efeito extra**: sucesso de qualquer ação `categoria: 'Mídia'` chama
   `investirNaMidia` em todos os veículos (jogo/acoes.js:27-32) — inclui o investimento livre
   `inv_midia` (a ação custom herda a categoria). Correto.
7. **Desconto indevido no investimento livre**: a ação custom de `inv_militar` herda
   `categoria: 'Militar'`; `tr.enfileirar` → `jogo.custoDe` aplica desconto de aliança/indústria
   sobre o valor do slider — o jogador paga menos do que definiu, mas o efeito é calculado sobre o
   valor cheio (favorece o jogador, inconsistente).

## Tabela por ação

Legenda: cat = categoria adequada; efeitos = todas as chaves aplicam; falha = efeitos_falha
diferenciado (— quando prob=1, não precisa); foto = FOTO_ACAO ou foto de equipamento no chip.

### Investimentos escaláveis (valor livre)

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| inv_militar | ✓ | ✓ (poder_militar, seguranca) | — (prob 1) | ✗ | OK | desconto militar indevido (fato 7) |
| inv_economia | ✓ | ✓ (pib, temp_economia, aprovacao) | — | ✗ | OK | |
| inv_ciencia | ✓ | ✓ (capacidade_ind, inteligencia) | — | ✗ | OK | |
| inv_intel | ✓ | ✓ (inteligencia, seguranca) | — | ✗ | OK | |
| inv_midia | ✓ | ✓ (aprovacao, soft_power) + investirNaMidia | — | ✗ | OK | |

### Militar

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| blindados | ✓ | **NUNCA RODAM** (fato 2) | n/a | ✓ (equip) | MORTO | vira ficha de equipamento |
| helis | ✓ | NUNCA RODAM | n/a | ✓ (equip) | MORTO | idem |
| cacas | ✓ | NUNCA RODAM | falha dá **+0.05 tesouro** (sinal suspeito) | ✓ (equip) | MORTO | `requer` capacidade_ind>40 ignorado pelo chip equip |
| porta_avioes | ✓ | NUNCA RODAM | n/a | ✓ (equip) | MORTO | `requer` >55 ignorado |
| submarino | ✓ | NUNCA RODAM | n/a | ✓ (equip) | MORTO | |
| mobilizar | ✓ | ✓ (poder_militar, temp_guerra, aprovacao) | — (prob 1) | ✓ | OK | |
| bateria_aa | ✓ | ✓ (seguranca, poder_militar) | ✓ | ✗ | OK | |
| forcas_especiais | ✓ | ✓ | ✓ | ✗ | OK | |
| doutrina_dissuasao | ✓ | ✓ | ✓ | ✗ | OK | |

### Arsenal

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| hipersonico | ✓ | NUNCA RODAM (fato 2) | n/a | ✓ (equip) | MORTO | desbloqueio ainda funciona (trava o chip) |
| ogiva | ✓ | ✓ (ogivas, seguranca, soft_power, temp_guerra) | ✓ | ✓ | OK | major via regex (intencional) |
| triade | ✓ | ✓ | ✓ | ✗ | OK | nome "triade" ≠ "Escudo Antimísseis" (cosmético) |
| silo_icbm | ✓ | ✓ | ✓ | ✗ | OK | major:true → fio com tema = nome, ok |
| ssbn | ✓ | ✓ | ✓ | ✗ | OK | |

### Inteligência

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| espionar | ✓ | ✓ | ✓ | ✗ | OK | |
| sabotar | ✓ | ✓, mas `rel_china` fixo | ✓ | ✗ | CORRIGIR | alvo hardcoded — jogando de China, pune relação consigo mesmo |
| aviao_espiao | ✓ | ✓ | ✓ | ✓ | OK | foto é MQ-9 Reaper, não U-2 (trocar) |
| satelite | ✓ | ✓ | ✓ | ✗ | OK | |
| vigilancia | ✓ | ✓ | **✗** (prob 0.95 sem efeitos_falha → falha "nada acontece", mas politico +7 aplica) | ✗ | CORRIGIR | dar falha (vazamento do programa) |
| cyber_arma | ✓ | ✓, mas `rel_ira` fixo | ✓ | ✗ | CORRIGIR | alvo hardcoded (USA-cêntrico) |
| desinfo | ✓ | ✓ | ✓ | ✗ | OK | |
| uranio | **✗** | ✓ (uranio) | ✓ | ✗ | RECATEGORIZAR | é programa nuclear → Arsenal |
| purga | **✗** | ✓ | ✓ | ✗ | RECATEGORIZAR | repressão interna → Política (já é major via regex) |
| contraintel | ✓ | ✓ (inclui reset qualitativo risco_exposicao:'baixo') | ✓ | ✗ | OK | |
| golpe_encoberto | ✓ | ✓ (rel_ue na falha) | ✓ | ✗ | OK | major, fio "Golpe encoberto" ok |
| falsa_bandeira | ✓ | ✓ | ✓ (explode bem) | ✗ | OK | |

### Economia

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| imposto_up | ✓ | ✓ (aliquota, aprovacao, temp_economia) | — | ✗ | OK | |
| imposto_down | ✓ | ✓ | — | ✗ | OK | |
| divida | ✓ | ✓ (tesouro, divida, temp_economia) | — | ✗ | OK | |
| infra | ✓ | ✓ | ✓ | ✗ | OK | |
| reforma | ✓ | ✓ | ✓ | ✗ | OK | |
| subsidio | ✓ | ✓ | — | ✗ | OK | |
| fundo_soberano | ✓ | ✓ | ✓ | ✗ | OK | "rende no longo prazo" é só flavor — efeito one-shot |
| guerra_cambial | ✓ | ✓ | ✓ | ✗ | **CORRIGIR** | regex marca como MAJOR → cria fio "Guerra em curso" (fato 4) |
| nacionalizar | ✓ | ✓ | ✓ | ✗ | OK | major:true, tema = nome |

### Diplomacia

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| cupula | ✓ | ✓ (rel_ue) | ✓ | ✗ | OK | rel_ hardcoded (nota geral) |
| ajuda | ✓ | ✓ (rel_brasil, rel_india) | — | ✗ | OK | idem |
| sancoes | ✓ | ✓ (rel_russia, rel_ira) | ✓ | ✗ | CORRIGIR | alvo fixo; sem alvo escolhível, sanção é sempre contra RUS/IRN |
| bloco | ✓ | ✓ (rel_ue, rel_japao) | ✓ | ✗ | OK | |
| pacto_defesa | ✓ | ✓ | ✓ | ✗ | OK | não cria pacto mecânico (só stats) — flavor > mecânica |
| mediar_global | ✓ | ✓ | ✓ | ✗ | OK | |
| diplomacia_petro | ✓ | ✓ (rel_ira, rel_russia) | ✓ | ✗ | OK | |

### Ciência

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| universidades | ✓ | ✓ | — | ✗ | OK | |
| pd_militar | ✓ | ✓ | ✓ | ✗ | OK | |
| cyber_prog | ✓ | ✓ | ✓ | ✗ | OK | |
| espacial | ✓ | ✓ | ✓ | ✗ | OK | |
| ia_militar | ? | NUNCA RODAM (fato 2) | n/a | ✓ (equip) | MORTO | chip de FICHA DE DRONE aparece na aba Ciência — estranho |
| quantico | ✓ | ✓ | ✓ | ✗ | OK | |
| fusao | ✓ | ✓ | ✓ | ✗ | OK | |
| laser_dew | ✓ | ✓ | ✓ | ✗ | OK | |
| biotec | ✓ | ✓ | ✓ | ✗ | OK | |

### Mídia

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| publicidade | ✓ | ✓ + investirNaMidia | ✓ | ✗ | OK | |
| influen | ✓ | ✓ + investirNaMidia | ✓ | ✗ | OK | |
| propaganda | ✓ | ✓ + investirNaMidia (força 16) | **✗** (prob 0.9 sem efeitos_falha) | ✗ | CORRIGIR | falha silenciosa; politico +7 aplica mesmo assim |

### Política

| id | cat ok? | efeitos aplicam? | falha? | foto? | veredito | nota |
|---|---|---|---|---|---|---|
| pronunciamento | ✓ | ✓ | ✓ | ✗ | OK | |
| pacote_congresso | ✓ | ✓ | ✓ | ✗ | OK | |
| reforma_impopular | ✓ | ✓ | ✓ | ✗ | OK | |
| anticorrupcao | ✓ | ✓ | ✓ | ✗ | OK | major → fio de corrupção ok |
| base_aliada | ✓ | ✓ | ✓ | ✗ | OK | |
| alistamento_voluntario | ✓ | ✓ + recruta 20k (teto ok) | falha dá aprovacao **+1** (by design: "rende pouco") | ✗ | OK | |
| convocar_reserva | ✓ | ✓ + recruta 60k da reserva (usaReserva ok) | ✓ | ✗ | OK | requer temp_guerra≥25 — mas tempoReal não revalida (fato 5) |
| alistamento_obrigatorio | ✓ | ✓ + recruta 150k | ✓ | ✗ | OK | major → fio "Revolta contra a conscrição" ok |
| comprar_congresso | ✓ | ✓ | ✓ | ✗ | OK | major → fio corrupção ok |
| caixa_dois | ✓ | ✓ (tesouro) | ✓ | ✗ | OK | |
| propina | ✓ | ✓ | ✓ | ✗ | OK | |
| perseguir_opositor | ✓ | ✓ | ✓ | ✗ | OK | major → fio repressão ok |
| censura_imprensa | ✓ | ✓ | ✓ | ✗ | OK | não mexe na simpatia dos veículos (só stats) — oportunidade |
| estado_excecao | ✓ | ✓ | ✓ | ✗ | OK | desbloqueio invertido (estabilidade ≤35) funciona no validador |

**Placar: 59 OK · 5 CORRIGIR (guerra_cambial, propaganda, vigilancia, sabotar/cyber_arma+sancoes) ·
7 MORTAS (blindados, helis, cacas, porta_avioes, submarino, hipersonico, ia_militar) ·
2 RECATEGORIZAR (uranio, purga).**

---

## (1) LISTA DE CORREÇÕES — priorizada e executável

1. **[P0] `guerra_cambial` vira "Guerra em curso"** — `src/jogo/acoes.js` linha 65:
   trocar
   `const major = a.major || /ogiva|conquista|guerra|golpe|nuclear|purga/.test(a.id);`
   por
   `const major = a.major || (/ogiva|conquista|guerra|golpe|nuclear|purga/.test(a.id) && a.id !== 'guerra_cambial');`
   (Opcional, mais limpo: adicionar `major: true` explícito onde se quer e reduzir a regex; mas a
   exclusão pontual resolve sem efeito colateral.)
2. **[P0] Decidir as 7 ações mortas** — `src/dados/acoes.js`: REMOVER do array `ACOES` as entradas
   `blindados`, `helis`, `cacas`, `porta_avioes`, `submarino`, `hipersonico`, `ia_militar` (a compra
   real já vive em `ui/equipamento.js`/`jogo/compras.js`). Se preferir mantê-las como atalho de
   ficha, remover delas `efeitos`, `efeitos_falha`, `prob`, `politico` e `requer` (código morto que
   engana o leitor e o `tagsImpacto`). ATENÇÃO: `ui/jogo.js:829` depende de `a.forcas` para o chip
   de ficha — se remover as ações, garantir que a aba Militar continue expondo as fichas de outra
   forma (ex.: grid de equipamento próprio).
3. **[P1] `propaganda` sem falha** — `src/dados/acoes.js` linha ~126: adicionar
   `efeitos_falha: { aprovacao: -5, soft_power: -4, risco_exposicao: 'medio' }` (a "verdade
   oficial" desmascarada).
4. **[P1] `vigilancia` sem falha** — linha ~67: adicionar
   `efeitos_falha: { aprovacao: -6, liberdades: -4, risco_exposicao: 'alto' }` (programa vazou) —
   ou subir `prob` para 1 se a intenção é ação garantida.
5. **[P1] `tempoReal.enfileirar` não valida gates** — `src/ui/tempoReal.js` função
   `podeEnfileirar`: importar `cumpreRequisito` de `../maquina/validador.js` e `estaDesbloqueada`
   de `../jogo/desbloqueios.js`; antes do retorno ok, adicionar:
   `if (!estaDesbloqueada(acao, jogo.estado) || !cumpreRequisito(acao.requer, jogo.estado)) return { ok:false, motivo:'Requisito não atendido.' };`
6. **[P2] Alvos `rel_` hardcoded (USA-cêntricos)** — `sabotar` (rel_china), `cyber_arma` (rel_ira),
   `sancoes` (rel_russia/rel_ira), `guerra_cambial` (rel_china). Jogando de China/Irã/Rússia a ação
   pune a "relação consigo mesmo" (chave inútil que o mundo.js até deriva). Correção mínima:
   em `src/jogo/efeitos.js`, dentro de `aplicarEfeitos`, ignorar a chave se
   `chave === PAISES[estado.iso]?.rel` (importar de `../dados/paises.js`). Correção ideal (maior):
   dar `alvo` escolhível a essas ações via fluxo do globo (`enfileirarCustom`).
7. **[P2] Desconto sobre investimento livre** — `src/jogo/motor.js` `custoDe`: pular o desconto
   quando a ação é sintética de investimento — ex.: `if (a?.escalavelOrigem) return c;` e em
   `ui/jogo.js:1292` acrescentar `escalavelOrigem: true` ao objeto da ação custom. (Hoje o jogador
   define 1 tri no slider, paga ~0.85 e recebe efeito de 1 tri.)
8. **[P3] `cacas.efeitos_falha = { tesouro: 0.05 }`** — se a ação for mantida: sinal positivo
   credita caixa na falha; trocar para `-0.05` (multa) ou remover. Moot se o item 2 remover a ação.
9. **[P3] `FOTO_ACAO.inf`** — `src/dados/imagens.js` linha 56: chave `inf` não corresponde a
   nenhum id de ação (não existe ação `inf`). Remover a linha.
10. **[P3] Foto errada de `aviao_espiao`** — `src/dados/imagens.js` linha 65: URL é o MQ-9 Reaper
    (drone), não um U-2/Global Hawk. Substituir por foto de U-2 do Wikimedia Commons.

## (2) RECATEGORIZAÇÕES propostas

| id | de → para | justificativa |
|---|---|---|
| uranio | Inteligência → **Arsenal** | enriquecer urânio é programa nuclear, não espionagem; fica ao lado de `ogiva` que o consome. |
| purga | Inteligência → **Política** | repressão da oposição interna é o jogo de dentro de casa; irmã de `perseguir_opositor`/`estado_excecao`. |
| ia_militar | Ciência → **Militar** (se mantida) | renderiza como ficha de equipamento (drones) no meio da aba Ciência; equipamento pertence à aba Militar. |

## (3) AÇÕES SEM FOTO (para busca de imagens)

Com foto hoje (chip normal): `mobilizar`, `ogiva`, `aviao_espiao` (errada, ver correção 10).
Chips de equipamento usam a foto da ficha (não precisam de FOTO_ACAO).

Sem foto (60): `inv_militar`, `inv_economia`, `inv_ciencia`, `inv_intel`, `inv_midia`,
`bateria_aa`, `forcas_especiais`, `doutrina_dissuasao`, `triade`, `silo_icbm`, `ssbn`,
`espionar`, `sabotar`, `satelite`, `vigilancia`, `cyber_arma`, `desinfo`, `uranio`, `purga`,
`contraintel`, `golpe_encoberto`, `falsa_bandeira`, `imposto_up`, `imposto_down`, `divida`,
`infra`, `reforma`, `subsidio`, `fundo_soberano`, `guerra_cambial`, `nacionalizar`, `cupula`,
`ajuda`, `sancoes`, `bloco`, `pacto_defesa`, `mediar_global`, `diplomacia_petro`,
`universidades`, `pd_militar`, `cyber_prog`, `espacial`, `quantico`, `fusao`, `laser_dew`,
`biotec`, `publicidade`, `influen`, `propaganda`, `pronunciamento`, `pacote_congresso`,
`reforma_impopular`, `anticorrupcao`, `base_aliada`, `alistamento_voluntario`,
`convocar_reserva`, `alistamento_obrigatorio`, `comprar_congresso`, `caixa_dois`, `propina`,
`perseguir_opositor`, `censura_imprensa`, `estado_excecao`.

## (4) NOTA ONLINE — o resultado de resolverFila está pronto pra vir do servidor?

**O objeto de retorno em si é JSON-puro e serializável**: `{ id, nome, icone, categoria, custo,
sucesso, prob, mudancas[{chave,delta,valor?}], ganhoForcas[{id,nome,icone,delta}], alvo, relKey,
major }` — só primitivos e arrays simples. Pode viajar pela rede como está.

Pontos NÃO-determinísticos / locais que impedem replicar o resultado no cliente:

1. **`Math.random()` no dado** (`jogo/acoes.js:19`) e no **jitter de mídia**
   (`forca * (0.6 + Math.random() * 0.8)`, linha 30) — dois clientes rolam resultados diferentes.
   Para online, o SERVIDOR precisa rolar e mandar `sucesso` (e o fator de mídia) prontos, ou o
   jogo precisa de um RNG semeado compartilhado.
2. **`resolverFila` MUTA `estado` e `veiculos` por efeito colateral** (aplicarEfeitos,
   aplicarPolitico, aplicarForcas, investirNaMidia, reservaMilitar). O retorno descreve as
   mudanças (`mudancas`/`ganhoForcas`), mas a mutação de mídia (simpatia dos veículos) NÃO está no
   retorno — um cliente remoto que só receba `resultados` não consegue reconstituir a simpatia.
   Incluir `midia: [{veiculo, delta}]` no resultado se for replicar via rede.
3. **Ids sintéticos com `Date.now()`** — ação de investimento livre
   (`ui/jogo.js:1292: id: \`${a.id}_${Date.now()}\``): id diverge entre máquinas; usar contador
   determinístico do jogo (turno+seq).
4. **Dependências de tabela local**: `UNIDADE_POR_ID`, `tetoSoldados(estado.iso)`, `VEICULOS` —
   determinísticos (dados estáticos), ok, desde que cliente e servidor rodem a mesma versão.
5. **`tempoReal.tick` pausa lendo o DOM** (`document.querySelector('.modal-fundo')` etc.) —
   o relógio é inerentemente local; num relay, o servidor precisa ser o metrônomo (beat autoritativo)
   e ignorar pausas de modal do cliente.
6. **`executarAcaoTempo` ramifica por campos sintéticos** (`_pazIso`, `_espiaoIso`, `_conflitoId`)
   cujos retornos (`paz`, `espionagem`, `intervencao`) também são JSON-puros — serializáveis, mas
   os resolvedores internos usam `Math.random` (mesma exigência do item 1).
