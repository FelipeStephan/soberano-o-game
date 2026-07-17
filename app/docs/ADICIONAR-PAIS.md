# COMO ADICIONAR UM NOVO PAÍS AO SOBERANO

Mapa de execução. Não é ensaio: é a lista fechada de tudo que um país precisa para
existir como **nação jogável** no jogo, arquivo por arquivo, campo por campo.

> **Convenção de ISO:** o jogo usa **ISO 3166-1 alfa-3** em MAIÚSCULAS como chave única
> (`BRA`, `USA`, `DEU`). A chave de *relação* (`rel_brasil`, `rel_eua`) é outra coisa —
> ver seção 3.1. Não confunda as duas.

> **Regra de ouro da arquitetura (registro.js):** o arquivo `src/dados/paises/<iso>.js`
> é a **FONTE ÚNICA** de qualquer país que tenha módulo. `empresas.js` e `equipamentos.js`
> viram apenas *fallback* para quem ainda não tem arquivo. Se você criar o módulo do país,
> edite empresas/equipamentos **dentro do módulo**, nunca nos catálogos antigos.

---

## 1. CHECKLIST DE ARQUIVOS (na ordem correta)

Seja `XXX` o ISO-3 do novo país (ex.: `POL`) e `xxx` o minúsculo (`pol`).

| # | Arquivo | Obrigatório? | O que fazer |
|---|---------|:---:|-------------|
| 1 | `src/dados/paises/<xxx>.js` | **SIM** | Criar o módulo `PAIS_XXX = { ficha, forcas, empresas, equipamentos }`. É o coração. Ver seção 2. |
| 2 | `src/dados/registro.js` | **SIM** | (a) `import { PAIS_XXX } from './paises/<xxx>.js';` junto dos outros imports; (b) adicionar `XXX: PAIS_XXX,` no objeto `NACOES`; (c) incluir `'XXX'` no array `isos` de um grupo em `GRUPOS`. |
| 3 | `src/dados/paises.js` | **SIM** | Adicionar/ajustar `PAISES.XXX = { nome, rel: 'rel_<pais>', bloco, forca }`. Ver seção 3.1. Se já existe como NPC, revisar `forca`. |
| 4 | `src/dados/efetivoMilitar.js` | **SIM** | `EFETIVO_ATIVO.XXX = <teto ativo real>` e `RESERVA_MILITAR.XXX = <reserva real>`. Ver 3.2. |
| 5 | `src/dados/petroleo.js` | **SIM** | Adicionar `PETROLEO.XXX = { ... }` **mesmo que seja tudo zero** (país sem petróleo). Zero omitido é bug (o jogo declara o país exportador). Ver 3.5. |
| 6 | `src/dados/gabinetes.js` | **SIM** | `GABINETES.XXX = [5 conselheiros]` com ids estáveis e **nomes fictícios**. Ver 3.4. |
| 7 | `src/dados/imagens.js` | **SIM** | `ISO2_DE.XXX = '<iso2>'` (ex.: `POL: 'pl'`) para a bandeira sair no flagcdn. Muitos candidatos já têm. |
| 8 | `src/dados/soldados.js` | Opcional* | `SOLDADO_POR_PAIS.XXX = { nome, foto }` (o fuzileiro-padrão). *Opcional se o módulo já traz `equipamentos.infantaria` própria — mas recomendado. Ver 3.3. |
| 9 | `src/dados/populacaoMundo.js` | Recomendado | `POPULACAO_MI.XXX = <milhões>`. Sem isso, cai no default 25 mi (escala mal mortos/pandemia). |
| 10 | `src/dados/mundoStats.js` | Recomendado | `MUNDO_STATS.XXX = { pib, area }` para o Índice Mundial (ranking global). |
| 11 | `src/jogo/mundoVivo.js` | Opcional | Incluir o ISO em `REGIOES` (contágio por vizinhança) e, se fizer sentido, em `RIVALIDADES`/`EIXOS`. Ver 3.6. |
| 12 | **Território** (`public/estados/*.geojson`, `public/estados/_index.json`, `public/cidades.json`) | **NADA A FAZER** | Já cobrem os ~199 países do mundo. Ver 3.7. |

\* Verifique também que **não** existe entrada conflitante no catálogo antigo. Como o
módulo tem precedência (`empresasDoPais`/`equipamentosDoPais` em registro.js), sobras em
`empresas.js`/`equipamentos.js` para esse ISO viram código morto — pode limpar.

**Teste mínimo depois de tudo:** o país aparece no menu inicial (GRUPOS), o cartão mostra
PIB/militar/líder, e a auditoria de petróleo (`auditarCobertura(jogaveis())`) retorna vazio.

---

## 2. DICIONÁRIO DE CAMPOS — o módulo `paises/<xxx>.js`

O módulo exporta um único objeto `PAIS_XXX` com quatro chaves: `ficha`, `forcas`,
`empresas`, `equipamentos`. O canônico de referência é `src/dados/paises/bra.js`.

### 2.1 `ficha` — a ficha do mundo

| Campo | Tipo | Significado / faixa |
|-------|------|---------------------|
| `ano` | número | Sempre `2026` (o recorte histórico do jogo). |
| `pais` | string | Nome em português exibido na tela (`'Brasil'`, `'Polônia'`). |
| `iso` | string | ISO-3 maiúsculo. **Deve bater com a chave em NACOES.** |
| `presidente` | string | Líder — **SEMPRE FICTÍCIO** (ver seção 5). Nome inventado, plausível para o país. |
| `capital` | string | Capital real (`'Brasília'`, `'Varsóvia'`). |
| `bandeira` | string (emoji) | Emoji simbólico do país (🌎, 🦅, 🛢️). É decorativo — a bandeira real vem do flagcdn via `ISO2_DE`. |
| `pino` | `{ lat, lng }` | Coordenadas da capital para o pino no globo. Latitude −90..90, longitude −180..180. |
| `resumo` | string (parágrafo) | Texto que **entra no prompt da Máquina (IA)**. É o retrato estratégico. Denso, factual, com tensões e ativos reais. A IA só gera o que é plausível aqui. |
| `relacoes` | objeto `rel_*` | Relações bilaterais **do ponto de vista deste país**. Ver 2.2. |
| `tensoes` | array de strings | 4–5 tensões reais do país. Alimentam prompt e fios-semente. |
| `estadoInicial` | objeto | O estado numérico inicial do mundo. Ver 2.3. **Vocabulário fechado** — não invente chaves. |
| `fiosSemente` | array de objetos | Fios de Tensão iniciais (o mundo já começa "quente"). Ver 2.4. |

### 2.2 `relacoes` — relações bilaterais (−100 a +100)

- Chaves no formato `rel_<pais>` (`rel_eua`, `rel_china`, `rel_russia`, `rel_ue`,
  `rel_reino`, `rel_israel`, `rel_ira`, `rel_norte`, etc.). **Não use `rel_<iso>`** —
  use o mesmo nome-longo que os outros módulos usam (ver as chaves em `bra.js`/`eua-2026.js`).
- **Regra crítica:** o país **não** declara relação consigo mesmo (o Brasil não tem
  `rel_brasil`). Quem joga com ele simplesmente não tem essa chave no estado.
- Escala: `+100` aliado de sangue, `+60..+80` aliado de tratado, `+30..+50` parceiro,
  `0` neutro, `−40..−60` rival, `−70..−100` inimigo declarado.
- **Cubra todas as chaves relevantes.** Uma chave `rel_` faltante cai em 0 (neutro) e o
  jogo trata um aliado real como a Suíça. Copie o conjunto completo de chaves de um módulo
  existente e ajuste os valores.

### 2.3 `estadoInicial` — o estado numérico (vocabulário fechado)

**Medidores (0–100):**

| Chave | O que mede | Faixa típica |
|-------|-----------|--------------|
| `aprovacao` | Aprovação do governo. | 25 (crise) – 70 (lua de mel) |
| `estabilidade` | Coesão do Estado / funcionamento institucional. | 25 (falido) – 85 (sólido) |
| `soft_power` | Simpatia e influência cultural/diplomática. | 15 (pária) – 75 (potência cultural) |
| `seguranca` | Segurança **interna** (crime, controle territorial), não fronteira. | 25 – 80 |
| `temp_guerra` | "Termômetro" de belicosidade/mobilização. | 8 (pacífico há 150 anos) – 40+ (mobilizado) |
| `temp_economia` | Saúde/aquecimento da economia. | 15 (colapso) – 55 (pujante) |
| `liberdades` | Liberdades civis. | 20 (autoritário) – 70 (democracia plena) |
| `poder_militar` | Força militar percebida (0–100, separado de `forcas`). | 28 (frágil) – 78 (superpotência) |

**Economia (US$ trilhões, exceto onde indicado):**

| Chave | Unidade | Nota |
|-------|---------|------|
| `pib` | US$ trilhões | PIB nominal. Ex.: EUA 28, Brasil 2.3, Venezuela 0.10. |
| `tesouro` | US$ trilhões | Caixa/reservas internacionais. Ex.: EUA 3.2, Brasil 0.36. |
| `divida` | **% do PIB** | Dívida bruta/PIB. Ex.: EUA 122, Brasil 78, Japão ~250. |
| `aliquota` | **%** | Carga tributária média. Ex.: EUA 27, Brasil 33, Venezuela 14. |

**Capacidades (0–100):**

| Chave | O que mede |
|-------|-----------|
| `inteligencia` | Qualidade do aparato de espionagem (CIA/Mossad alto; ABIN baixo). |
| `capacidade_ind` | Base industrial-militar (capacidade de produzir armamento). |
| `uranio` | Reserva/estoque estratégico de urânio (destrava programa nuclear). `0` = sem programa. |

**Território / arsenal:**

| Chave | Valor |
|-------|-------|
| `territorio` | Sempre `1` no início (território-mãe; expande rumo ao objetivo "Imperador"). |
| `ogivas` | Nº absoluto de ogivas nucleares. `0` para não-nucleares. Nota: aparece **também** em `forcas` — mantenha os dois iguais. |

### 2.4 `fiosSemente` — fios de tensão iniciais

Array de objetos, tipicamente 4:

```js
{ tema: 'Crime organizado e domínio territorial',  // string curta
  intensidade: 60,                                  // 0–100, quão "quente" começa
  alvo_pressao: 'seguranca',                         // uma chave de estadoInicial que o fio pressiona
  atores: ['eua', 'ue'] }                            // ISOs/atores minúsculos envolvidos (pode ser [])
```

`alvo_pressao` deve ser uma chave válida de medidor (`seguranca`, `soft_power`,
`temp_economia`, `estabilidade`, `aprovacao`…).

### 2.5 `forcas` — ordem de batalha (as 13 chaves fechadas)

Espelha a lista de `UNIDADES` em `src/dados/forcas.js`. Cada número é a **quantidade real
de unidades** daquele tipo. Ordens de grandeza reais (militarybalance-style).

| Chave | Representa na realidade | Ordem de grandeza (referência) |
|-------|------------------------|-------------------------------|
| `infantaria` | Efetivo de tropa (soldados). É "Soldados" na UI. | EUA 450k, Brasil 360k, China ~2M |
| `blindados` | Tanques + blindados de combate principais. | Brasil 400, EUA 5.500 |
| `artilharia` | Peças de artilharia (rebocada + autopropulsada + foguetes). | Brasil 700, EUA 5.200 |
| `helicopteros` | Helicópteros militares (ataque + transporte). | Brasil 180, EUA 900 |
| `cacas` | Caças de combate operacionais. | Brasil 40, EUA 1.300 |
| `bombardeiros` | Bombardeiros estratégicos. **A maioria dos países tem 0** (só EUA/RUS/CHN). | 0 na maioria |
| `drones` | UAVs militares de emprego. | Brasil 30, EUA 400 |
| `navios` | Navios de guerra de superfície (fragatas, contratorpedeiros, corvetas). | Brasil 40, EUA 90 |
| `submarinos` | Submarinos (convencionais + nucleares). | Brasil 6, EUA 66 |
| `porta_avioes` | Porta-aviões / porta-helicópteros de assalto. **Raro: quase todos 0.** | 0 na maioria, EUA 11 |
| `misseis` | Sistemas de mísseis (cruzeiro/balístico/antinavio). | Brasil 60, EUA 900 |
| `defesa_aerea` | Baterias de defesa antiaérea (SAM). | Brasil 4, EUA 60 |
| `ogivas` | Ogivas nucleares (redundante com `estadoInicial.ogivas`). | 0 para não-nucleares |

> Combate: cada unidade tem um `poder` (peso) definido em `forcas.js`. A força total é
> `Σ quantidade × poder`. Você só preenche as **quantidades** aqui; os pesos são globais.

### 2.6 `empresas` — as estatais e campeãs nacionais

Array de objetos. É o Estado como empresário: investir/privatizar/estatizar/nacionalizar.

| Campo | Tipo | Significado |
|-------|------|-------------|
| `id` | string | Identificador curto único no país (`'petro'`, `'vale'`). |
| `nome` | string | Nome real da empresa (marcas reais **são permitidas**). |
| `sigla` | string (opcional) | Sigla exibida (`'BNDES'`, `'PDVSA'`). |
| `setor` | string | Um de `SETORES`: Energia, Defesa, Tecnologia, Mineração, Aeroespacial, Industrial, Infraestrutura, Financeiro. |
| `estatal` | bool | `true` se controlada pelo Estado. |
| `participacao` | número (0–100) | **% que o Estado detém.** 100 = estatal pura; 51 = controle; 5–10 = golden share/minoritária. |
| `valor` | US$ trilhões | Valor de mercado/patrimonial da fatia relevante. Ex.: Petrobras 0.11, Vale 0.06. |
| `margem` | fração (0–1) | Margem de lucro (0.11 = 11%). Pode ser **negativa** para estatal deficitária (Corpoelec −0.06). |
| `petroleo` | Mb/d (opcional) | Se presente, a empresa bombeia N milhões de barris/dia **proporcional à fatia**. Liga economia↔petróleo. |
| `logo` | URL ou `null` | Logo (Wikimedia/URL). `null` cai em fallback de sigla. |
| `bonus` | objeto | Bônus por investir, mapeando chave-de-estado → delta. Ex.: `{ pib: 0.2, capacidade_ind: 2 }`. |
| `desc` | string | Descrição narrativa (entra no card da empresa). |

### 2.7 `equipamentos` — a foto e a ficha de cada unidade

Objeto com uma chave `_nome` (nome do país) + uma entrada por tipo de unidade. Cada
entrada descreve **o equipamento real** que aquele país usa para aquela unidade.

```js
equipamentos: {
  _nome: 'Brasil',
  blindados: {
    nome: 'VBTP-MR Guarani',            // modelo real
    fab: 'Iveco / Exército Brasileiro', // fabricante(s) real(is)
    origem: 'BRA',                       // ISO-3 do país de origem do projeto
    proprio: true,                       // true=nacional | 'licenca'=produção licenciada | false=importado
    foto: 'https://upload.wikimedia.org/...330px-....jpg',  // URL Wikimedia verificada, ou null
    sugerido: true,                      // (opcional) marca que a foto/dado é aproximado, não verificado
  },
  // ... uma entrada por unidade militar
}
```

| Campo | Significado |
|-------|-------------|
| `nome` | Modelo real do equipamento (marcas reais permitidas). |
| `fab` | Fabricante(s) real(is). |
| `origem` | ISO-3 do país de projeto (`'BRA'`, `'SWE'`, `'RUS'`). |
| `proprio` | `true` (nacional), `'licenca'` (licenciado), `false` (importado). |
| `foto` | URL de imagem (Wikimedia Commons, sufixo `330px` ideal). `null` se não houver imagem **comprovadamente correta** — foto errada é pior que foto nenhuma. |
| `sugerido` | `true` opcional: sinaliza dado/foto aproximado (ex.: foto de exemplar de outro país). |

> **Regra de qualidade (do bra.js/ven.js):** não use foto que você não confirmou ser do
> item certo. Prefira `foto: null, sugerido: true` a uma imagem errada.

---

## 3. FONTES AUXILIARES — o que preencher em cada arquivo

### 3.1 `paises.js` — a entrada NPC e a escala de `forca`

```js
PAISES.XXX = { nome: 'Polônia', rel: 'rel_polonia', bloco: 'OTAN', forca: 74 };
```

- `nome`: nome em português (bate com `ficha.pais`).
- `rel`: a **chave de relação** desse país no estado dos outros. Para países já com chave
  consolidada, reuse (`DEU`/`FRA` usam `rel_ue`). Para novos, `rel_<pais>` minúsculo sem acento.
- `bloco`: rótulo curto (`'OTAN / UE'`, `'Não-alinhado'`, `'Adversário'`, `'Parceiro'`).
- `forca`: **escalar de força de combate** (número abstrato de comparação no globo).

**Escala de `forca` (calibrada pelos valores existentes):**

| forca | Referência real |
|------:|-----------------|
| 254 | EUA |
| 235 | China |
| 165 | Rússia |
| 130 | Índia |
| 70–78 | Israel / França / Reino Unido / Paquistão |
| 60–68 | Alemanha / Japão / Turquia / Coreia do Sul |
| 45–52 | Brasil / Arábia / Egito / Taiwan |
| 28–42 | México / Canadá / Austrália / Indonésia |
| 22 | Venezuela |

> Se você **não** definir `forca`, `estimaForca()` deriva do PIB do GeoJSON
> (`GDP_MD/45000`, mínimo 12). Para país relevante, **defina à mão.**

Se você criar uma chave `rel_` nova, considere também dar a ela um nome legível em
`NOME_POR_REL`/gramática de artigo (`ARTIGO`) no mesmo arquivo, para as frases da IA
saírem certas ("da Polônia", "com a Polônia").

### 3.2 `efetivoMilitar.js` — teto de soldados + reserva

```js
EFETIVO_ATIVO.XXX = 200000;   // efetivo ATIVO real (teto que o país sustenta em pé de guerra)
RESERVA_MILITAR.XXX = 500000; // reserva mobilizável real (convocável de volta às armas)
```

- Use números reais (IISS Military Balance). Ex.: Coreia do Sul ativo 600k / reserva 3.1M.
- **O teto ativo deve ficar ACIMA de `forcas.infantaria`** do módulo, para sobrar margem
  real de recrutamento. Sem ficha aqui, cai no `_default` (150k ativo / 100k reserva).

### 3.3 `soldados.js` — o rosto do fuzileiro

```js
SOLDADO_POR_PAIS.XXX = {
  nome: 'Fuzileiro do Exército (Beryl wz.96)',  // combatente + fuzil de serviço REAL
  foto: 'https://upload.wikimedia.org/...jpg',
};
```

- Opcional se o módulo já traz `equipamentos.infantaria` própria (registro.js só preenche
  quem falta). Recomendado preencher para consistência.
- Foto quebrada degrada para o ícone 🪖 (o jogo tem `<img onerror>`).

### 3.4 `gabinetes.js` — os 5 conselheiros

```js
GABINETES.XXX = [
  { id: 'sec_defesa',    papel: '<cargo real>', nome: '<FICTÍCIO>', personalidade: '...' },
  { id: 'dir_cia',       papel: '<cargo real>', nome: '<FICTÍCIO>', personalidade: '...' },
  { id: 'sec_tesouro',   papel: '<cargo real>', nome: '<FICTÍCIO>', personalidade: '...' },
  { id: 'sec_estado',    papel: '<cargo real>', nome: '<FICTÍCIO>', personalidade: '...' },
  { id: 'chefe_gabinete',papel: '<cargo real>', nome: '<FICTÍCIO>', personalidade: '...' },
];
```

- **Os 5 `id` são CONTRATO — estáveis e obrigatórios**, exatamente estes:
  `sec_defesa`, `dir_cia`, `sec_tesouro`, `sec_estado`, `chefe_gabinete`. O código
  referencia por `id`, não por cargo (o chefe de espionagem é `dir_cia` mesmo onde o
  órgão se chama ABIN, SVR, Mossad…).
- `papel`: o **cargo real** do país (Ministro da Defesa, Diretor-Geral da ABIN…). É o que
  aparece na tela.
- `nome`: **SEMPRE FICTÍCIO** (o jogo tem missão de assassinato — nunca pessoa viva real).
- `personalidade`: 1–3 frases dando voz e tensão interna ao personagem. A IA dá voz a
  este perfil, não o inventa.

### 3.5 `petroleo.js` — OBRIGATÓRIO mesmo sem petróleo

```js
// Petroestado:
PETROLEO.XXX = { reservas: 111, producao: 3.2, consumo: 1.0, custo: 4,
                 tipo: 'Leve doce', campo: 'Zakum', nota: '...' };

// País sem petróleo (declare zero — omitir é BUG):
PETROLEO.XXX = { reservas: 0, producao: 0.0, consumo: 2.3, custo: 0,
                 tipo: 'Nenhum', campo: '—', nota: '...' };
```

| Campo | Unidade |
|-------|---------|
| `reservas` | bilhões de barris provados |
| `producao` | milhões de barris/dia |
| `consumo` | milhões de barris/dia |
| `custo` | US$/barril para extrair (Arábia 3, areia betuminosa canadense 40) |
| `tipo`, `campo`, `nota` | descrição narrativa |

> **Por que é obrigatório:** sem ficha, produção e consumo caem a 0, o teste
> `producao >= consumo` passa trivialmente e o jogo declara o país **exportador** de
> petróleo (foi o que aconteceu com o Japão). `auditarCobertura(jogaveis())` deve retornar
> `[]`. Se o país controla um estreito (Ormuz, Malaca, Suez, Bósforo…), adicione o ISO ao
> `controle`/`depende` do estreito em `ESTREITOS`; se for OPEP/OPEP+, aos arrays `OPEP`/`OPEP_MAIS`.

### 3.6 `populacaoMundo.js` e `mundoStats.js`

```js
POPULACAO_MI.XXX = 38;              // milhões (default é 25 se ausente)
MUNDO_STATS.XXX = { pib: 0.81, area: 0.31 };  // pib US$ tri, area milhões de km²
```

- `MUNDO_STATS` alimenta o **Índice Mundial** (ranking global). O poder militar vem de
  `PAISES.forca` e as reservas de petróleo de `PETROLEO` — aqui mora só PIB e área.

### 3.7 Território (estados/cidades) — NADA A FAZER

**Descoberta importante:** o território já está pronto para todos os países do mundo.

- `public/estados/_index.json` — mapa `ISO3 → nº de estados admin-1` (cobre ~199 países).
- `public/estados/<ISO>.geojson` — polígonos dos estados/províncias (um arquivo por país,
  já existentes: `POL.geojson`, `ITA.geojson`, `NGA.geojson`…).
- `public/cidades.json` — 1.266 cidades de 199 países, cada uma com
  `{ nome, pais (ISO3), estado, pop, lat, lng, capitalPais, capitalEstado }`.

As guarnições dos estados são **derivadas automaticamente** dessas fontes + da `forca` do
país (ver `composicaoPlausivel` em `forcas.js` e `jogo/forcasMundo.js`/`territorio.js`).
**Um país novo não precisa de nenhum arquivo de território** — basta que o ISO-3 já exista
nesses datasets, o que é o caso para qualquer país reconhecido. Só verifique que o ISO
do seu país aparece em `_index.json` (praticamente todos aparecem).

### 3.8 `mundoVivo.js` — integração opcional na simulação de fundo

- `REGIOES`: adicione o ISO ao continente certo para o contágio de pandemia se espalhar por
  vizinhança (senão o país fica fora da malha de contágio regional).
- `RIVALIDADES` / `EIXOS`: opcionalmente registre rivalidades e alianças reais (`{ a, b,
  tensao, tema }`), usadas pela IA de fundo para gerar eventos entre NPCs.
- Não há **ação exclusiva** de país no código: todas as mecânicas são genéricas e keyed por
  `estado.iso` (com fallback `'USA'`). A única coisa hardcoded é o par RUS/UKR (guerra em
  curso é injetada como fio quando você **não** joga com nenhum dos dois). Adicionar um país
  não exige tocar em nenhuma lógica de ação.

---

## 4. TEMPLATE EM BRANCO — `src/dados/paises/xxx.js`

Copie, renomeie o arquivo e o `PAIS_XXX`, e preencha. Comentários explicam cada campo.

```js
// FICHA DO MUNDO — <País>, era 2026. Molde de eua-2026.js / bra.js.
// LÍDER E CONSELHEIROS SEMPRE FICTÍCIOS (o jogo tem missão de assassinato).

export const PAIS_XXX = {
  ficha: {
    ano: 2026,
    pais: '<Nome em português>',
    iso: 'XXX',                       // ISO-3 maiúsculo — bate com a chave em NACOES
    presidente: '<Nome FICTÍCIO>',    // inventado, plausível para o país
    capital: '<Capital>',
    bandeira: '🏳️',                   // emoji simbólico (a bandeira real vem do flagcdn)
    pino: { lat: 0.0, lng: 0.0 },     // coordenadas da capital

    resumo: `<Retrato estratégico denso e factual — entra no prompt da IA. Economia,
militar, tensões, ativos e vulnerabilidades reais. 4–8 linhas.>`,

    // Ponto de vista DESTE país. Sem a própria chave. Copie o conjunto completo de
    // chaves de um módulo existente e ajuste os valores (-100 a +100).
    relacoes: {
      rel_eua: 0, rel_china: 0, rel_ue: 0, rel_reino: 0, rel_russia: 0,
      rel_india: 0, rel_japao: 0, rel_canada: 0, rel_australia: 0, rel_coreia: 0,
      rel_israel: 0, rel_ira: 0, rel_arabia: 0, rel_turquia: 0, rel_egito: 0,
      rel_indonesia: 0, rel_mexico: 0, rel_venezuela: 0, rel_ucrania: 0,
      rel_taiwan: 0, rel_paquistao: 0, rel_norte: 0, rel_brasil: 0,
      // remova a chave do PRÓPRIO país
    },

    tensoes: [
      '<tensão 1>', '<tensão 2>', '<tensão 3>', '<tensão 4>',
    ],

    estadoInicial: {
      // medidores 0–100
      aprovacao: 50, estabilidade: 50, soft_power: 50, seguranca: 50,
      temp_guerra: 20, temp_economia: 45, liberdades: 50, poder_militar: 50,
      // economia (US$ trilhões, exceto divida=%PIB e aliquota=%)
      pib: 0.0, tesouro: 0.0, divida: 60, aliquota: 30,
      // capacidades 0–100
      inteligencia: 40, capacidade_ind: 40, uranio: 0,
      // território / arsenal
      territorio: 1, ogivas: 0,
    },

    fiosSemente: [
      { tema: '<tema>', intensidade: 50, alvo_pressao: 'temp_economia', atores: [] },
      { tema: '<tema>', intensidade: 50, alvo_pressao: 'estabilidade',  atores: [] },
      { tema: '<tema>', intensidade: 50, alvo_pressao: 'seguranca',     atores: [] },
      { tema: '<tema>', intensidade: 50, alvo_pressao: 'soft_power',    atores: [] },
    ],
  },

  // Ordem de batalha — quantidades reais. As 13 chaves fechadas.
  forcas: {
    infantaria: 0, blindados: 0, artilharia: 0, helicopteros: 0, cacas: 0,
    bombardeiros: 0, drones: 0, navios: 0, submarinos: 0, porta_avioes: 0,
    misseis: 0, defesa_aerea: 0, ogivas: 0,
  },

  // Estatais e campeãs nacionais (marcas reais permitidas). 3–5 entradas.
  empresas: [
    { id: '<id>', nome: '<Empresa>', setor: 'Energia', estatal: true, participacao: 100,
      valor: 0.0, margem: 0.05, /* petroleo: 0.0, */ logo: null,
      bonus: { pib: 0.1 },
      desc: '<descrição narrativa>' },
  ],

  // Equipamento real por unidade. Foto null > foto errada.
  equipamentos: {
    _nome: '<País>',
    infantaria:   { nome: '', fab: '', origem: 'XXX', proprio: true,  foto: null },
    blindados:    { nome: '', fab: '', origem: 'XXX', proprio: true,  foto: null },
    artilharia:   { nome: '', fab: '', origem: 'XXX', proprio: true,  foto: null },
    helicopteros: { nome: '', fab: '', origem: '',    proprio: false, foto: null },
    cacas:        { nome: '', fab: '', origem: '',    proprio: false, foto: null },
    bombardeiros: { nome: '—', fab: '—', origem: '—', proprio: false, foto: null },
    drones:       { nome: '', fab: '', origem: '',    proprio: false, foto: null },
    navios:       { nome: '', fab: '', origem: '',    proprio: false, foto: null },
    submarinos:   { nome: '', fab: '', origem: '',    proprio: false, foto: null },
    porta_avioes: { nome: '—', fab: '—', origem: '—', proprio: false, foto: null },
    misseis:      { nome: '', fab: '', origem: '',    proprio: false, foto: null },
    defesa_aerea: { nome: '', fab: '', origem: '',    proprio: false, foto: null },
  },
};
```

E no `registro.js`, os três toques:

```js
import { PAIS_XXX } from './paises/xxx.js';   // (1) topo, junto dos outros
export const NACOES = { /* ... */ XXX: PAIS_XXX };  // (2) no objeto NACOES
// (3) em GRUPOS, incluir 'XXX' no array isos do grupo/arquétipo apropriado
```

---

## 5. REGRAS INVIOLÁVEIS

1. **Líder e conselheiros SEMPRE fictícios.** Nunca uma pessoa viva real — o jogo tem
   missão de assassinato. Nome inventado, plausível para o país. Vale para `ficha.presidente`
   e para os 5 nomes em `gabinetes.js`.
2. **Marcas e equipamentos reais SÃO permitidos.** Petrobras, Vale, Gripen, Leopard,
   Su-30, PDVSA — nomes de empresas e de armamento devem ser reais.
3. **Números o mais próximo da realidade.** Efetivo, PIB, dívida, reservas de petróleo,
   ordem de batalha — use fontes reais (IISS Military Balance, FMI/Banco Mundial, EIA/OPEP,
   BP Statistical Review). Aproximação realista, não invenção.
4. **Zero declarado é dado; zero por omissão é bug.** Vale sobretudo para `petroleo.js`:
   país sem petróleo precisa de ficha com tudo zerado.
5. **Foto null é melhor que foto errada.** Só cadastre imagem que você confirmou ser do
   item certo; senão `foto: null` (opcionalmente `sugerido: true`).
6. **Os 5 ids de gabinete são contrato** — não renomeie `sec_defesa`, `dir_cia`,
   `sec_tesouro`, `sec_estado`, `chefe_gabinete`.
7. **O módulo do país é a fonte única.** Edite empresas/equipamentos dele dentro do
   próprio arquivo, não nos catálogos `empresas.js`/`equipamentos.js`.

---

## 6. LISTA DE CANDIDATOS — ~15 países fortes para adicionar

Todos hoje existem só como NPC (ou nem isso) — sem módulo próprio. Distribuídos geografica
e estrategicamente. Os quatro primeiros já estão em `PAISES` com `forca` definida.

| # | ISO | País | Por que vale a pena |
|---|-----|------|---------------------|
| 1 | `TWN` | Taiwan | O flashpoint com a China e o gargalo dos semicondutores do planeta. Partida "Estado sob cerco" perfeita. Já é NPC (forca 45). |
| 2 | `MEX` | México | 2ª maior economia latino-americana, fronteira e comércio com os EUA, cartéis como crise interna. Já NPC (forca 28). |
| 3 | `CAN` | Canadá | G7, NORAD, petróleo de areia betuminosa (170 bi bbl), vizinho dos EUA. Já NPC (forca 35). |
| 4 | `AUS` | Austrália | AUKUS, minério de ferro, âncora ocidental no Pacífico e no Índico. Já NPC (forca 42). |
| 5 | `ITA` | Itália | G7, 3ª economia da zona do euro, marinha no Mediterrâneo. Já em `mundoStats` (PIB 2.3). |
| 6 | `ESP` | Espanha | Economia da UE, OTAN, Gibraltar e porta para o norte da África. |
| 7 | `POL` | Polônia | O exército terrestre que mais cresce na Europa, flanco leste da OTAN diante da Rússia. |
| 8 | `NGA` | Nigéria | Gigante africano, membro da OPEP, maior população da África (223 mi) — âncora que falta no continente. |
| 9 | `ZAF` | África do Sul | BRICS, economia mais industrializada da África, minérios estratégicos. |
| 10 | `ARG` | Argentina | G20, lítio, celeiro agrícola e o shale de Vaca Muerta. Peso sul-americano ao lado do Brasil. |
| 11 | `VNM` | Vietnã | Hub manufatureiro emergente e contestante no Mar do Sul da China. Peça-chave da rivalidade EUA-China. |
| 12 | `ARE` | Emirados Árabes | Petróleo (111 bi bbl), fundo soberano, hub logístico, guarda de Ormuz. Já tem petróleo cadastrado. |
| 13 | `IRQ` | Iraque | 5ª maior reserva de petróleo (145 bi bbl), falha sectária aberta, OPEP. Já tem petróleo cadastrado. |
| 14 | `KAZ` | Cazaquistão | Maior produtor de urânio do mundo + petróleo, encravado entre Rússia e China. Peça central da Ásia Central. |
| 15 | `THA` | Tailândia | Economia relevante do Sudeste Asiático e aliado de tratado dos EUA — completa o tabuleiro da ASEAN ao lado da Indonésia. |

**Extras de reserva** se quiser passar de 15: `COL` (Colômbia — guerrilha, petróleo, aliado
dos EUA na América do Sul), `MAR` (Marrocos — Saara Ocidental, ponte Europa-África),
`ETH` (Etiópia — barragem do Nilo, 2ª maior população da África), `PHL` (Filipinas — disputa
com a China no Mar do Sul, aliado dos EUA).

> Para qualquer um deles, `PETROLEO`, `POPULACAO_MI`, `MUNDO_STATS`, os `.geojson` de
> estados e as cidades **já existem** ou são triviais — o trabalho real é o módulo
> `paises/<iso>.js` (seção 2), o gabinete (3.4) e os retoques em `registro.js`/`paises.js`.
```
