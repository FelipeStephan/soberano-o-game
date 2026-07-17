# DESBLOQUEIOS — condições encadeadas

O que trava cada ação escondida (`desbloqueio` em `src/dados/acoes.js`) e por que a condição
conta uma história. Regra de ouro: **nenhum par de ações tem condição idêntica** — cada
desbloqueio estoura sozinho, num momento próprio, e o popup vira um marco da campanha
(como urânio ≥60 → ogiva → silo/SSBN). Teste de unicidade: ver "Verificação" no fim.

## Tabela (id → condição → cadeia narrativa)

| id | Condição | Cadeia narrativa (por que conta uma história) |
|---|---|---|
| `satelite` | Cap. Industrial ≥50 | Primeiro degrau tecnológico: o país que aprende a fabricar, aprende a olhar de cima. |
| `espacial` | Cap. Industrial ≥62 | O satélite abriu o apetite; agora a indústria pesada ergue o foguete inteiro. |
| `hipersonico` | Cap. Industrial ≥70 · Inteligência ≥50 | A fábrica constrói o míssil, mas é a telemetria roubada dos rivais que o guia. |
| `laser_dew` | Cap. Industrial ≥75 · Segurança ≥55 | Defesa de energia dirigida só nasce em país que já leva defesa a sério — o laser protege o que você já defende. |
| `fusao` | Cap. Industrial ≥80 · Inteligência ≥60 | O topo da escada industrial: acender um sol exige a maior fábrica e os melhores cérebros do planeta. |
| `quantico` | Inteligência ≥80 · Cap. Industrial ≥55 | O caminho inverso do hipersônico: aqui a espionagem lidera e a indústria só monta o laboratório. |
| `cyber_arma` | Inteligência ≥70 | O Programa Cyber amadurece a rede até ela conseguir atacar sem disparar um tiro. |
| `ia_militar` | Inteligência ≥75 · Cap. Industrial ≥65 | Depois da arma cibernética, o algoritmo ganha corpo: drones saindo da linha de montagem. |
| `ogiva` | Urânio ≥60 · Cap. Industrial ≥55 | A cadeia nuclear clássica: enriquecer primeiro, montar depois. |
| `silo_icbm` | Ogivas ≥1 · Cap. Industrial ≥60 | A ogiva existe; agora ela precisa alcançar qualquer capital em 30 minutos. |
| `ssbn` | Ogivas ≥1 · Cap. Industrial ≥65 | O passo final da tríade: esconder a segunda-capacidade no fundo do oceano. |
| `triade` | Cap. Industrial ≥65 · Inteligência ≥60 | Interceptar míssil exige radar (indústria) e aviso antecipado (inteligência). |
| `forcas_especiais` | Inteligência ≥45 | A primeira rede de informação já aponta onde a lâmina deve entrar. |
| `falsa_bandeira` | Inteligência ≥55 | Fabricar um pretexto crível exige uma rede que já sabe mentir bem. |
| `golpe_encoberto` | Inteligência ≥65 | O ápice da carreira encoberta: derrubar um governo sem deixar digital. |
| `bloco` | Soft Power ≥70 | Ninguém funda uma ordem econômica sem antes ser admirado por ela. |
| `mediar_global` | Soft Power ≥60 | Só senta as partes à mesa quem tem voz que o mundo ouve. |
| `fundo_soberano` | Temp. Econômica ≥55 | Só guarda excedente quem tem economia aquecida o bastante pra gerar um. |
| `alistamento_obrigatorio` | Clima de Guerra ≥45 | Situacional: conscrição só se sustenta com ameaça real batendo à porta. |
| `estado_excecao` | Estabilidade ≤35 | Situacional: a exceção só se justifica quando a ordem já desabou. |

Cadeias visíveis ao jogador:
- **Industrial:** satelite (50) → espacial (62) → hipersonico (70) → laser (75) → fusao (80).
- **Espionagem:** forcas_especiais (45) → falsa_bandeira (55) → golpe_encoberto (65) → cyber_arma (70) → ia_militar (75) → quantico (80).
- **Nuclear:** uranio ≥60 → ogiva → silo_icbm / ssbn.
- **Prestígio:** mediar_global (60) → bloco (70).

## Proposta futura: condição por AÇÃO EXECUTADA (`_acao`)

O suporte já está implementado em `src/jogo/desbloqueios.js`: dentro de `desbloqueio`, a
chave especial `_acao` exige que o jogador tenha EXECUTADO uma ação com sucesso antes:

```js
// desbloqueia só depois de rodar espionar com sucesso 1x:
desbloqueio: { _acao: 'espionar' }
// 3 execuções + atributo, combinados:
desbloqueio: { _acao: { id: 'cyber_prog', vezes: 3 }, inteligencia: '>=60' }
```

Leitura: `estado.acoesFeitas` (mapa `id → nº de execuções bem-sucedidas`). Enquanto o motor
não preencher esse mapa, condições `_acao` simplesmente não batem — nada quebra e nenhuma
ação usa `_acao` hoje. Quando o motor passar a registrar (incrementar em `resolverFila` no
sucesso), boas candidatas:

| id | `_acao` proposta | História |
|---|---|---|
| `cyber_arma` | `{ id: 'cyber_prog', vezes: 2 }` | A arma nasce do programa, não do nada. |
| `ogiva` | `{ id: 'uranio', vezes: 3 }` | Cada rodada de enriquecimento é um passo físico até a bomba. |
| `golpe_encoberto` | `{ id: 'espionar', vezes: 3 }` | Só derruba governo quem já operou dentro dele. |
| `bloco` | `{ id: 'cupula', vezes: 2 }` | O bloco é assinado na terceira foto de família. |
| `ia_militar` | `{ id: 'pd_militar', vezes: 2 }` | O enxame sai do laboratório da DARPA. |

## Verificação

- `npm run build` sem erros.
- Unicidade das condições (nenhum par idêntico), comparando JSON com chaves ordenadas:

```js
node -e "import('./src/dados/acoes.js').then(({ACOES})=>{const n=(d)=>JSON.stringify(Object.fromEntries(Object.entries(d).sort()));const m={};let dup=0;for(const a of ACOES.filter(a=>a.desbloqueio)){const k=n(a.desbloqueio);if(m[k]){console.log('DUPLICADA:',m[k],'=',a.id,k);dup=1}m[k]=a.id}process.exit(dup)})"
```
