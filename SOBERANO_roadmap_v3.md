# SOBERANO — Roadmap v3

> Consolidado das três mensagens. Ordenado por **dor real do jogador**, não por
> facilidade de implementação. Bug que quebra imersão vem antes de feature nova.

---

## P0 — BUGS QUE QUEBRAM O JOGO

### 1. A Máquina acha que você é os EUA
**Sintoma:** jogando de Brasil, o ciclo gerou "Diretora da CIA, Diane Okoro" e uma crise
sobre centrífugas iranianas.
**Causa:** `main.js` passa `elenco: ELENCO_EUA_2026` para os 20 países. Eu escrevi isso e
comentei no código — dívida assumida que virou bug visível.
**Correção:** elenco (gabinete) por país + o `systemContexto` da IA precisa carregar
a ficha do país jogado, não a dos EUA.

### 2. Instalar base não consome ponto de ação nem dá retorno
**Sintoma:** clica em instalar, nada acontece visualmente, PA não baixa.
**Correção:** consumir PA, fechar o painel, mostrar confirmação, atualizar HUD.

### 3. Toda ação dispara um jato até o país
**Sintoma:** acordo comercial manda caça. Só ataque deveria.
**Correção:** mapear tipo de ação → animação (comércio = arco suave, espionagem = pulso,
ataque = esquadrilha).

### 4. Navios voam pelo ar
**Sintoma:** frota segue a mesma curva aérea dos caças.
**Correção:** navios/submarinos precisam de rota MARÍTIMA rasante (alt ~0), aviões por cima.

### 5. Jornais só funcionam para os EUA
**Correção:** veículos de imprensa por país (Globo/Folha/Veja para BRA; BBC/Guardian para
GBR; RT para RUS; Xinhua para CHN...), mantendo CNN/Reuters como internacionais.

---

## P1 — O ATAQUE (a cena principal do jogo)

### 6. Duração e suspense
De 8s para **~60s**. O ataque é o clímax — tem que respirar.

### 7. Mensagens sutis, sem fill, que não tapam a animação
Hoje são caixas preenchidas empilhadas rápido demais. Viram: balões translúcidos, sem
fundo sólido, nascendo devagar (a cada ~6-8s), fora do centro da tela.

### 8. IA gera os despachos EM LOTE, antes
**Decisão de arquitetura:** uma chamada de IA no início do ataque gera 8-10 despachos de
uma vez. Eles são então "spawnados" gradualmente ao longo dos 60s. Isso mata o risco de
latência no meio da cena e ainda dá texto único por ataque.
Fallback local se a IA falhar ou estiver desligada.

### 9. Modelos 3D do `militaryModels.js`
Substituir os meus por eles: jet, submarine, drone, missile, tank, nuke, warship, carrier
— mais detalhados, com `createThruster()` (chama + partículas + fumaça) e
`createExplosion()`. Requerem luz na cena (já temos `luzes()`).

### 10. Radar de conflito bonito
Anéis existem, mas o usuário quer o efeito mais forte e permanente enquanto durar guerra
ou ocupação.

---

## P2 — EVENTOS ALEATÓRIOS (estão repetitivos e no lugar errado)

### 11. Frequência e contexto
- Reduzir a frequência (hoje é um atrás do outro).
- A IA gera com **contexto das ações passadas** e do que está acontecendo.
- **Nunca durante um ataque.** Flash urgente no meio da ofensiva é quebra de cena.

---

## P3 — UI / UX (estudo de design)

### 12. HUD desorganizada
- Painéis com **recolher/expandir**.
- Informação-chave migra para o **cabeçalho** (hoje vazio: Nação, ciclo, PA, tesouro).
- Painéis **arrastáveis** para fora da coluna.

### 13. Opinião Pública vira **X**
- Logo do X, tom de rede social real.
- **Alertas de sistema saem de lá** e vão para um toggle ao lado.
- Tom brasileiro de verdade quando o país é o Brasil — xingamento incluso.

### 14. Home estilo Destiny
Globo 3D animado de fundo, aba de países + **botão aleatório**, entregar a vida na tela.
**Regra permanente registrada: a referência de UI do projeto é Destiny.**

### 15. Nome do presidente
O jogador cadastra o próprio nome. A IA e a Máquina usam ele nas mensagens.

---

## P4 — CONTEÚDO E INFRA

### 16. Mais ações e desbloqueios
Para as 6 abas: Militar, Inteligência, Economia, Diplomacia, Ciência, Mídia.

### 17. Mercado: status dos pedidos
Pendente / aprovado / negado / produzido, com origem, valor, turno e **o porquê**.

### 18. Login + save
Preparar para online. Perfil, save persistente, estrutura pronta para multiplayer.

### 19. Auditoria da estrutura de IA
Revisar `maquina/` como desenvolvedor: organização limpa, ferramentas bem separadas,
prompt/contrato/validador/telemetria com fronteiras claras.

---

## Ordem de execução

1. **P0 inteiro** — o jogo está mentindo pro jogador
2. **P1 (6, 7, 8)** — a cena principal
3. **P2 (11)** — parar o spam
4. **P1 (9, 10)** — modelos e radar
5. **P4 (17)** — mercado
6. **P3 (13, 12)** — X e HUD
7. **P3 (14, 15)** — home e nome
8. **P4 (16, 18, 19)** — conteúdo e infra
