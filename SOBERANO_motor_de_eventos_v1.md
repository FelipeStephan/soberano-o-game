# SOBERANO — O Motor de Eventos
### Documento de Design v1 · A Máquina como Diretora Narrativa

> Complementa a **Bíblia de Design v1**. Foco: drama narrativo. Premissa central: a Máquina é uma **Diretora** — no dia 1 ela roda por regras e templates; os encaixes de IA já estão desenhados, mas desligados.

---

## PARTE 0 — OS NOVOS PRÓXIMOS PASSOS (roadmap revisado)

A ordem antiga misturava "planilha de 190 países" com "protótipo jogável". Reordenamos pra servir ao objetivo real: **sentir o drama funcionando o quanto antes.**

| Fase | Entrega | Estado |
|---|---|---|
| **0. Design do motor** | Este documento: schema da Carta, a Diretora, a máquina de arcos, os 4 encaixes de IA, e 1 arco piloto completo | ← você está aqui |
| **1. Núcleo jogável** | Loop mínimo: relógio → Diretora puxa carta → decisão → feed reage → medidores movem → repete. Só 1 país jogável, dados fixos, sem IA | próximo |
| **2. O arco piloto rodando** | "A Guerra por Procuração" totalmente jogável, com personagens e ramificação real | |
| **3. Ligar o 1º encaixe de IA** | O Narrador: LLM transforma cartas + instruções de feed em prosa viva. Fallback pra template se a API falhar | |
| **4. Expandir** | Mais arcos, mais medidores, ficha de país real (aí sim o pipeline de dados), militar/espionagem | |
| **5. Multiplayer / temporadas** | Só depois que uma partida solo já vicia | |

**Princípio-mestre:** cada peça de IA é *upgrade*, nunca *dependência*. O jogo tem que ser jogável e divertido com a API desligada. Se cair, ficar cara ou alucinar, a partida continua.

---

## PARTE 1 — A DIRETORA (o coração do motor)

### O que ela faz, a cada tique do relógio

```
1. LER      → tira uma foto do Estado do Mundo (ver Parte 4)
2. FILTRAR  → de todas as Cartas, quais têm os gatilhos satisfeitos AGORA?
3. PONTUAR  → dá um score a cada carta candidata (peso × tensão × novidade)
4. ESCOLHER → puxa a de maior score (com um tempero de aleatoriedade)
5. ENTREGAR → renderiza a carta: narrativa + personagem + opções + feed
6. RESOLVER → jogador decide → aplica efeitos → atualiza o Estado do Mundo
7. LEMBRAR  → grava a decisão no histórico (arcos e cartas futuras leem isto)
```

Os passos 3 e 5 são exatamente os **encaixes de IA** (Parte 3). No dia 1, o passo 3 é uma fórmula de peso e o passo 5 é preenchimento de template. Trocar por LLM depois **não muda mais nada no motor** — é o mesmo contrato de dados.

### A regra de ouro do drama

A Diretora não sorteia à toa. Ela busca **tensão dramática**: prefere a carta que mexe no que o jogador *mais teme perder no momento*. Se sua aprovação está por um fio, ela puxa a crise que ameaça a aprovação. Isso é o que separa "slot machine" de "história sobre mim".

No dia 1 modelamos isso de forma simples: cada carta declara em qual eixo ela pressiona (`pressiona: "aprovacao"`), e a Diretora dá bônus de score às cartas que pressionam o eixo mais frágil do jogador. Barato, e já parece inteligente.

---

## PARTE 2 — A CARTA (o formato universal de dados)

Tudo — autor humano ou LLM — produz Cartas neste schema. O motor não sabe nem se importa quem escreveu.

```json
{
  "id": "guerra_proc_01",
  "arco": "fronteira_em_chamas",
  "peso": 100,
  "unica": true,
  "pressiona": "estabilidade",

  "gatilhos": {
    "requer": [],
    "proibe": ["fronteira_em_chamas.iniciado"],
    "estado": { "tem_vizinho_hostil": true }
  },

  "personagem": "min_defesa",
  "titulo": "Tanques ao amanhecer",
  "narrativa": "General {min_defesa.nome} entra sem bater. 'Soberano — a {NACAO_VIZINHA} cruzou a fronteira da {NACAO_VITIMA} às 4h. Colunas blindadas. Isto é uma invasão em larga escala. O mundo inteiro vai perguntar de que lado você está — e vai perguntar hoje.'",

  "opcoes": [
    {
      "texto": "Condenar publicamente a agressão",
      "efeitos": { "rel_vizinho": -20, "rel_vitima": +25, "aprovacao": +5, "soft_power": +10 },
      "reacao_feed": "tom:orgulho,tensao; OGloboTerrestre aprova firmeza; GNN quer mais que palavras; Capital&Mercado teme retaliacao comercial",
      "abre_arco": "fronteira_em_chamas.condenou"
    },
    {
      "texto": "Declarar neutralidade estrita",
      "efeitos": { "rel_vizinho": +5, "rel_vitima": -15, "aprovacao": -3, "soft_power": -8 },
      "reacao_feed": "tom:frustracao,alivio; AVozLivre elogia nao-intervencao; CornetaDiaria chama de covardia; mercado respira",
      "abre_arco": "fronteira_em_chamas.neutro"
    },
    {
      "texto": "Oferecer apoio secreto à vítima (armas, inteligência)",
      "efeitos": { "rel_vitima": +30, "risco_exposicao": "alto", "tesouro": -8 },
      "requer_capacidade": { "inteligencia": ">40" },
      "reacao_feed": "tom:nada_publico; feed segue normal — por enquanto",
      "abre_arco": "fronteira_em_chamas.apoio_secreto"
    }
  ]
}
```

### Anatomia — por que cada campo existe

- **`arco`** — liga a carta a uma storyline. Sem arcos, eventos são ruído. Com arcos, o jogo *lembra*.
- **`peso` / `pressiona`** — matéria-prima do score da Diretora (Parte 1).
- **`gatilhos`** — `requer` (flags que precisam existir), `proibe` (flags que impedem), `estado` (condições numéricas do mundo). É o que faz a carta certa aparecer na hora certa.
- **`unica`** — carta de arco não se repete; carta de ambiente (ex.: "escândalo de corrupção") pode repetir.
- **`personagem`** — quem *entrega* a crise. **Este é o campo mais importante pro drama.** Uma crise entregue por um ministro que você conhece, contratou, e pode demitir vira história pessoal. Uma crise anônima vira planilha.
- **`narrativa`** — texto com slots `{...}`. No dia 1 os slots são preenchidos por substituição simples. Com o Narrador ligado, o LLM reescreve tudo com voz e contexto.
- **`reacao_feed`** — **é uma instrução, não texto pronto.** No dia 1 um gerador de templates transforma `"CornetaDiaria chama de covardia"` em um post fixo por veículo. Com IA, viram 5 posts vivos e únicos. Mesma instrução, dois níveis de qualidade.
- **`efeitos`** — o que muda no Estado do Mundo. Sempre numérico e explícito → o motor aplica sem ambiguidade (e um LLM-autor nunca inventa efeito fora deste vocabulário; ver Parte 3, guarda-corpos).
- **`requer_capacidade`** — a opção só aparece se o jogador tiver o recurso (ex.: apoio secreto exige inteligência > 40). Escolhas destravadas por *quem você é*.
- **`abre_arco`** — grava uma flag no histórico → habilita as próximas cartas. É a máquina de estados da história.

---

## PARTE 3 — OS 4 ENCAIXES DE IA (desenhados agora, ligados depois)

O motor expõe 4 pontos de extensão. Cada um tem um **contrato**: entrada fixa → saída fixa. No dia 1, cada contrato é cumprido por uma função-template. Ligar IA = trocar a implementação daquela função, nada mais.

| # | Encaixe | Entrada | Saída | Dia-1 (template) | Prioridade de ligar |
|---|---|---|---|---|---|
| 1 | **Narrador** | Carta + Estado do Mundo | Prosa da narrativa + posts do feed | Substituição de slots + 1 post fixo/veículo | **Primeiro** (maior drama/custo) |
| 2 | **Conselheiro** | Opções da carta + personalidade do ministro | Comentário enviesado de cada ministro | Frase pré-escrita por arquétipo | Segundo |
| 3 | **Diretor** | Estado do Mundo + histórico | *Qual* carta puxar / que score | Fórmula de peso × tensão | Terceiro |
| 4 | **Autor** | Estado do Mundo + tema | Uma Carta nova (JSON válido) | — (não existe no dia 1) | Por último |

### Guarda-corpos (por que o modelo A é seguro e o B é arriscado)

O motor **valida toda Carta** contra um schema antes de aceitá-la, venha de onde vier:
- `efeitos` só podem usar chaves do **vocabulário fechado** de variáveis do mundo (Parte 4). LLM não pode inventar `"efeitos": {"exercito_vira_zumbi": 999}` — o validador rejeita.
- Cada efeito tem um **teto** (ex.: aprovação não muda mais que ±25 por carta). Impede o LLM de detonar o balanço.
- `gatilhos` e `abre_arco` referenciam flags conhecidas; referências órfãs são logadas e a carta é descartada.

Resultado: mesmo quando o **Encaixe 4 (Autor)** for ligado, um LLM que alucina produz no máximo uma carta *rejeitada*, nunca uma carta que quebra o jogo. **É por isso que desenhar o schema agora, com IA desligada, é o que "prepara o ambiente pra IA" de verdade.**

### O contrato, em pseudocódigo

```
// Dia 1 — template. Trocar o corpo por chamada de LLM não muda a assinatura.
function narrar(carta, mundo) -> { narrativa: string, posts: Post[] }
function aconselhar(opcoes, ministros) -> Comentario[]
function dirigir(mundo, historico, cartasCandidatas) -> carta
function autorar(mundo, tema) -> Carta   // valida contra schema antes de retornar
```

Enquanto todas as 4 forem template, **nenhuma chave de API é necessária e nenhum centavo é gasto.** O jogo é 100% jogável.

---

## PARTE 4 — O ESTADO DO MUNDO (o vocabulário fechado)

Tudo que gatilhos leem e efeitos escrevem vive aqui. Manter isto **pequeno e fechado** é o que dá segurança pra IA e clareza pro balanço. Começamos enxuto:

```
MEDIDORES DE OPINIÃO (0–100)          RECURSOS
  aprovacao          // do líder        tesouro           // caixa
  estabilidade       // coesão interna  divida
  soft_power         // influência ext. inteligencia      // força de espionagem
  temp_guerra        // apetite bélico  capacidade_ind    // p/ construir/produzir
  temp_economia      // confiança econ.
  liberdades         // clima civil    FLAGS DE HISTÓRICO (booleanas)
                                         <arco>.<marco>    // ex: fronteira_em_chamas.condenou
RELAÇÕES (-100 a +100)                   ministro_X.demitido
  rel_<pais>                             usou_nuclear (reputação permanente)

RÓTULOS DE ESTADO (derivados, p/ gatilhos legíveis)
  tem_vizinho_hostil   risco_exposicao:{baixo|medio|alto}   em_guerra
```

Regra: **um efeito só pode tocar chaves desta lista.** Quer uma variável nova? Adiciona aqui primeiro, conscientemente. Isso impede o inchaço que mata grand strategy — e é a fronteira que a IA nunca cruza.

---

## PARTE 5 — ARCO PILOTO COMPLETO: "A FRONTEIRA EM CHAMAS"

Uma guerra por procuração num país vizinho. Testa **ramificação real**: o caminho muda conforme sua opinião pública, seu bloco e suas fronteiras. Mostra como ~10 cartas viram uma história pessoal.

### Elenco (personagens do gabinete que entregam as cartas)

- **General Vargas** (`min_defesa`) — *falcão*. Vê ameaça em tudo, quer projeção de força. "Fraqueza convida invasão."
- **Chanceler Adaya** (`min_exterior`) — *cautelosa*. Prioriza posição internacional e comércio. "Toda porta que fechamos é uma que não reabre."
- **Facção: A Praça** — a opinião pública organizada (protestos). Não é pessoa, é pressão.

### O mapa do arco (máquina de estados)

```
                          [01] A INVASÃO
                     ┌─────────┼──────────────┐
               condenou     neutro        apoio_secreto
                   │           │                │
            [02] Refugiados  [03] O ultimato  [04] Contrabando
            batem à porta    do agressor      exposto?
                   │           │            ┌───┴───┐
            [05] A Praça    [06] Lucro de   pego   impune
            exige mais      neutro (vender    │       │
                   │        armas aos dois) [07] Escândalo
            [08] Voluntários     │          internacional
            ou tropas?           │              │
                   └─────────┬───┴──────────────┘
                        [09] O PONTO DE VIRAGEM
                   (a guerra chega à sua fronteira)
                             │
                     ┌───────┴────────┐
              [10a] Entrar na    [10b] Fechar a
              guerra            fronteira e aguentar
```

### As cartas

---

**[01] A invasão** — *abertura, `pressiona: estabilidade`*
Gatilho: `tem_vizinho_hostil == true`. (A carta-semente, já escrita como exemplo na Parte 2.)
Entregue por **General Vargas**. Três opções: **Condenar** / **Neutralidade** / **Apoio secreto** (esta só aparece se `inteligencia > 40`).

---

**[02] Os refugiados** — *ramo `condenou`, `pressiona: estabilidade`*
Gatilho: `requer: fronteira_em_chamas.condenou`.
Entregue por **Chanceler Adaya**.
> "Cinquenta mil cruzaram a fronteira esta semana. Mães, crianças, o que couber numa mala. A imprensa já está lá. O que fazemos com eles define quem somos aos olhos do mundo — e do nosso próprio povo."

| Opção | Efeitos | Feed |
|---|---|---|
| Acolher com portas abertas | `soft_power +15, tesouro -10, estabilidade -8` | O Globo aplaude humanidade; Corneta grita "e o nosso povo?"; A Praça se divide |
| Acolher em campos controlados | `soft_power +5, estabilidade -3, tesouro -4` | reação morna, ninguém feliz, ninguém furioso |
| Fechar a fronteira | `soft_power -20, estabilidade +5, rel_vitima -15` | A Voz Livre em choque; GNN aprova "ordem"; imagem internacional afunda |

---

**[03] O ultimato** — *ramo `neutro`, `pressiona: soft_power`*
Gatilho: `requer: fronteira_em_chamas.neutro`.
Entregue por **Chanceler Adaya**, pálida.
> "A {NACAO_VIZINHA} agradeceu nossa neutralidade… e exige que ela seja *demonstrada*. Querem que fechemos nosso espaço aéreo a voos de ajuda humanitária à {NACAO_VITIMA}. Recusar é escolher um lado — o oposto do que você disse querer."

| Opção | Efeitos | Feed |
|---|---|---|
| Ceder — fechar o espaço aéreo | `rel_vizinho +15, soft_power -25, aprovacao -10` | Corneta chama de fantoche; mercado alivia; A Praça começa a fervilhar |
| Recusar e manter a ajuda | `rel_vizinho -30, soft_power +15, temp_guerra +10` | GNN: "linha na areia!"; risco de escalada sobe |
| Blefar: dizer sim, deixar voar mesmo assim | `risco_exposicao: alto, rel_vizinho +5` | feed calmo — até alguém descobrir |

---

**[04] Contrabando exposto?** — *ramo `apoio_secreto`, `pressiona: soft_power`*
Gatilho: `requer: fronteira_em_chamas.apoio_secreto`.
Um teste de inteligência nos bastidores: `sucesso = inteligencia vs. 60`.
- **Passou:** carta [06] fica disponível (você lucra em silêncio).
- **Falhou:** dispara **[07] Escândalo internacional** — `soft_power -30, rel_vizinho -40, aprovacao -15`, e o feed explode: "SOBERANO PEGO ARMANDO A GUERRA". Vira pária parcial.

---

**[05] A Praça exige mais** — *ramo `condenou`, `pressiona: estabilidade`*
Gatilho: `requer: fronteira_em_chamas.condenou`, `estado: { soft_power > 60 }`.
Não há personagem-ministro; a carta é entregue *pelo feed* — multidões nas ruas.
> "Sua firmeza inspirou o país — firmeza demais. Cem mil pessoas na praça central com as cores da {NACAO_VITIMA}, exigindo que você faça mais que discursar. Aprovação alta é uma corda: ela puxa nos dois sentidos."

| Opção | Efeitos |
|---|---|
| Anunciar sanções econômicas ao agressor | `rel_vizinho -35, temp_economia -10, aprovacao +8` |
| Enviar ajuda militar aberta | `temp_guerra +20, rel_vizinho -50` → torna [09] quase inevitável |
| Pedir calma, segurar a onda | `aprovacao -12, estabilidade -10` (a Praça se sente traída) |

---

**[06] O lucro do neutro** — *ramos `neutro`/`apoio_secreto` bem-sucedido, `pressiona: temp_economia`*
Entregue por um **novo personagem: o industrial Kessler** (sabor: cínico, encantador).
> "Soberano, guerra é a pior notícia do mundo — e o melhor negócio dele. Ambos os lados precisam de aço, remédio, combustível. Podemos vender para os dois e sair desta guerra mais ricos do que entramos. A moral custa caro. Quanto você quer pagar?"

| Opção | Efeitos |
|---|---|
| Vender para os dois lados | `tesouro +40, soft_power -15, liberdades -5` (se descoberto, custa caro depois) |
| Vender só para a vítima | `tesouro +20, rel_vizinho -20, rel_vitima +15` |
| Recusar — não lucrar com sangue | `aprovacao +10, soft_power +10` (limpo, mas pobre) |

---

**[09] O ponto de viragem** — *convergência de todos os ramos, `pressiona: estabilidade`*
Gatilho: entra quando `temp_guerra > 60` **ou** após N tiques no arco.
Entregue por **General Vargas**, sem rodeios.
> "Acabou o tempo de escolher com palavras. Um projétil caiu do nosso lado da fronteira — {mortos} mortos, todos nossos. Não importa mais o que você quis ser nesta guerra. Ela chegou. Agora só há duas perguntas: lutamos, ou aguentamos?"

| Opção | Requisito | Efeitos |
|---|---|---|
| **[10a] Entrar na guerra** | — | `em_guerra: true, temp_guerra +30, tesouro -30`, abre o **arco militar** (fora do escopo deste piloto) |
| **[10b] Fechar a fronteira e aguentar** | — | `estabilidade -20, aprovacao -15, soft_power +5` — sobrevive, humilhado ou prudente conforme seu histórico |

**Fecho do arco:** o epílogo lê o histórico e resume *quem você foi* — o firme que arrastou o país à guerra, o mercador que enriqueceu na desgraça, o prudente que aguentou a vergonha. **Nenhuma dessas frases é fixa: é o primeiro lugar onde o Narrador (Encaixe 1) vai brilhar.**

---

### Por que este arco valida o motor inteiro

- **Ramificação por estado, não por sorte** — o caminho depende de opinião pública, bloco e inteligência. Prova que os `gatilhos` funcionam.
- **Personagens recorrentes** — Vargas abre e fecha o arco; Adaya carrega o meio; Kessler é a tentação. Prova o valor do campo `personagem`.
- **O feed como pressão mecânica** — A Praça (carta 05) é a opinião pública *virando gatilho de carta*. Prova o loop opinião → ação.
- **Escolhas destravadas por quem você é** — apoio secreto só existe com inteligência alta. Prova `requer_capacidade`.
- **Um final que lembra** — o epílogo lê o histórico. Prova que a máquina de arcos guarda estado.

---

## PARTE 6 — O QUE PRECISO PRA COMEÇAR A FASE 1 (núcleo jogável)

Quando você quiser sair do papel, começo o núcleo mínimo com:
- 1 país jogável de dados fixos (proponho o **Brasil 2026** da bíblia).
- Os 6 medidores + tesouro da Parte 4.
- A Diretora em modo template (fórmula de peso).
- O arco "Fronteira em Chamas" + umas 3 cartas de ambiente pra ter ritmo.
- Feed com os 5 veículos ficcionais, gerando posts por template.

Sem stack decidida ainda — o motor é dados + regras puras, roda igual em arquivo único ou em React. A decisão de stack só importa na hora de desenhar a *tela*.

---

*Fim do v1. Próxima decisão sua: revisar/ajustar este motor, ou mandar eu começar a Fase 1.*
