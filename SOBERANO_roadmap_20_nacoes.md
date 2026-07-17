# SOBERANO — Roadmap das 20 Nações

> Estudo e plano de produção para levar tudo que foi construído com os EUA
> para mais 19 nações jogáveis. **Status: EXECUTADO** (2026-07-15).

---

## 1. O estudo — por que estes 20

A seleção não é por PIB. É por **arquétipo de partida**: cada nação precisa oferecer
um jogo estruturalmente diferente, não os mesmos botões com números menores.

Os cinco arquétipos, e o que cada um força o jogador a fazer:

| Arquétipo | Nações | A pergunta da partida |
|---|---|---|
| **Superpotências** | EUA, China, Rússia | Você já tem tudo. Por quanto tempo segura? |
| **Grandes potências** | Índia, Reino Unido, França, Alemanha, Japão | Como ter autonomia entre gigantes sem virar vassalo? |
| **Potências regionais** | Brasil, Coreia do Sul, Turquia, Arábia Saudita, Israel, Egito | Como converter geografia em poder? |
| **Estados sob cerco** | Irã, Ucrânia, Coreia do Norte, Venezuela | Sobreviver já é vitória. |
| **Encruzilhadas** | Paquistão, Indonésia | Pequeno no papel, decisivo no mapa. |

### O que faz cada partida ser diferente de verdade

Não é o PIB — é a **combinação de restrições**. Alguns exemplos do que a ficha produz:

- **Japão**: 4,1 tri de PIB, dívida de **255% do PIB** (a maior do mundo), **zero petróleo**,
  e o Artigo 9 impedindo forças ofensivas. Rico, avançado e amarrado.
- **Rússia**: PIB de **2,2 tri** (menor que o do Brasil) e **5.500 ogivas**. A partida é
  sobre converter arsenal em influência quando você não tem economia pra sustentar.
- **Ucrânia**: devolveu **todas** as ogivas no Memorando de Budapeste de 1994 em troca de
  garantias de segurança. `temp_guerra: 95`. A ironia é o jogo.
- **Venezuela**: **303 bi de barris**, a maior reserva do planeta, e produz menos que a
  Colômbia. Consertar a PDVSA é a partida inteira.
- **Coreia do Norte**: PIB de 0,03 tri, `liberdades: 2`, 50 ogivas, o 4º maior exército
  em efetivo. Aprovação de 85% que não é apoio, é medo.
- **Irã**: `ogivas: 0` e `uranio: 85`. Toda a partida gira em torno desse par — e do
  Estreito de Ormuz.

---

## 2. A produção — como foi executado

Quatro agentes em paralelo, cada um com 4–5 países, todos com o mesmo contrato duro:

### Regras inegociáveis aplicadas

1. **Líder fictício obrigatório.** Nenhum político real vivo em nenhum campo. O jogo tem
   missões de assassinato — não modelamos violência contra pessoas reais. Auditado: **0 ocorrências**.
2. **Foto verificada ou `null`.** Toda URL saiu do `imageinfo.thumburl` da própria API do
   Commons, nunca montada à mão. Sem verificação → `null` + `sugerido: true` → cai na foto
   genérica da categoria. Motivo: a Lockheed já exibiu o logo da Apple neste projeto.
3. **Temas sensíveis com seriedade adulta.** Ucrânia, Coreia do Norte, Venezuela, Israel/Irã
   são conflitos com mortos reais. O cinismo é com **governos e incentivos**, nunca com
   populações que sofrem.
4. **Esquema validado por script**: 17 chaves de `estadoInicial`, 22 de `relacoes` (cada país
   sem a própria chave), 12 de `forcas`, `alvo_pressao` sempre apontando pra chave real.

### Resultado

| Lote | Países | Fotos verificadas |
|---|---|---|
| 1 | CHN, RUS, BRA, IND | 36/44 |
| 2 | DEU, FRA, GBR, JPN, KOR | 39/39 |
| 3 | ISR, IRN, TUR, SAU, EGY | 16/43 |
| 4 | UKR, PRK, PAK, VEN, IDN | 20/50 |

**Nota de método descoberta na execução:** o Wikimedia devolve **HTTP 429 (throttle), não 404**.
O primeiro round de checagem acusou 31 "falhas" que eram só rate-limit. Com backoff, todas
passaram. Quem rodar checagem em lote no futuro: **429 não é prova de ausência**.

---

## 3. O refactor que destravou tudo

Ter 20 fichas não serve de nada se o jogo só sabe ser os EUA. Três mudanças estruturais:

### 3.1 `PAIS_JOGADOR_ISO` era uma constante

Fixa em `'USA'`, importada em 12 lugares. Trocada por `definirJogador(iso)` + `souEu(iso)`.
Exportar um `let` não resolveria: quem importa recebe uma cópia congelada.

### 3.2 Fonte única de dados

Os arquivos de país trazem cópias de empresas/equipamentos que também vivem em
`empresas.js`/`equipamentos.js`. Duplicação garante divergência na primeira edição.

**A regra, e ela é dura:** `dados/paises/<iso>.js` é a **fonte única** de qualquer país que
tenha arquivo. Os catálogos antigos viram **fallback**. Implementado em
`empresasDoPais()` / `equipamentosDoPais()`.

### 3.3 Ficha de petróleo é obrigatória — inclusive quando é zero

**Bug que só apareceu ao rodar os 20:** países sem entrada em `PETROLEO` recebiam
produção 0 **e** consumo 0. O teste `producao >= consumo` passava trivialmente e o jogo
declarava o **Japão exportador de petróleo** — o país que importa 99% do que queima e cuja
política externa gira em torno disso desde 1941. Mesmo caso: Alemanha, Coreia, Israel,
França, Turquia.

**Zero declarado é dado; zero por omissão é bug.** Há agora `auditarCobertura()` pra pegar
isso na próxima vez.

---

## 4. A geografia como recurso

O pedido: *"cada país pode ter um recurso diferente devido geolocalização, como o Irã taxar
Ormuz — se alguém dominar, vai ter esse direito."*

Implementado em `jogo/geografia.js`. Seis estreitos reais, com quem os controla:

| Estreito | Fluxo | Controlado por |
|---|---|---|
| Ormuz | 21 Mb/d | Irã, Omã, Emirados |
| Malaca | 16 Mb/d | Malásia, Indonésia, Singapura |
| Suez / SUMED | 9 Mb/d | Egito |
| Bab el-Mandeb | 8 Mb/d | Iêmen, Djibuti, Eritreia |
| Bósforo | 3 Mb/d | Turquia |
| Panamá | 1 Mb/d | Panamá |

Quatro regimes: **livre**, **pedágio** (4% do valor que passa, receita todo turno,
soft power −6), **escolta** (custa caro, compra gratidão), **bloqueio** (o Brent explode,
quem depende vira inimigo mortal).

Isso muda o cálculo de conquista: invadir Omã não é sobre Omã — é sobre sentar na saída
de Ormuz. O Egito não tem petróleo relevante; tem o Canal, e vale mais.

---

## 5. Estado final

**20 nações jogáveis, 0 erros de validação.** Cada uma inicia com ficha própria, ordem de
batalha real, estatais reais, equipamento real e posição energética real:

```
USA importa 34%   CHN importa 74%   RUS EXPORTA +5.8   IND importa 87%
BRA EXPORTA +1.0  DEU importa 100%  FRA importa 99%    GBR importa 53%
JPN importa 100%  KOR importa 100%  ISR importa 100%   IRN EXPORTA +1.5
TUR importa 93%   SAU EXPORTA +5.9  EGY importa 33%    UKR importa 75%
PRK importa 100%  PAK importa 86%   VEN EXPORTA +0.3   IDN importa 67%
```

---

## 6. O que fica pendente

- **Elenco por país.** O gabinete (as vozes que a Máquina usa) ainda é o dos EUA para todos.
  Os nomes vêm da ficha, mas os personagens não. É o próximo passo natural.
- **Fotos `null`**: 30 slots caem na foto genérica da categoria (deliberado — melhor que
  foto errada). Vale um segundo passe de curadoria.
- **Índia com 2 empresas** — ficha mais magra que as outras.
- **`lideres.js` nunca foi ligado**: sem painel de líder, sem missão de assassinato.
- **Multiplayer + contrainteligência** (item 5 do roadmap original).
- **Blocos por país**: `blocos.js` ainda pensa o mundo do ponto de vista americano.
