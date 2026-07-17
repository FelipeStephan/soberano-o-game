# SOBERANO — ESCOPO DO PROJETO E POLÍTICA DE MARCAS

> **Documento normativo.** Vale mais que preferência de implementação. Se algum outro
> documento do projeto contradisser este, **este manda**.
> Última revisão: 2026-07-15.

---

## 1. O QUE ESTE PROJETO É

**SOBERANO — O Grande Jogo** é um **protótipo acadêmico**, desenvolvido como trabalho de
faculdade de tecnologia. Não é produto. Não é comercializado. Não tem fins lucrativos e
não terá. Roda localmente e, quando muito, num deploy pequeno de demonstração para
avaliação acadêmica e portfólio.

Toda decisão de escopo abaixo deriva desse enquadramento. Se o projeto um dia mudar de
natureza — virar produto, ter monetização, ser distribuído em loja, ganhar base de
usuários real — **este documento inteiro precisa ser revisto antes**, não depois.

---

## 2. MARCAS REAIS DE IMPRENSA — AUTORIZADAS

**Decisão do dono do projeto, registrada aqui de forma direta: o jogo USA marcas reais
de veículos de imprensa, com nome exato e logo.** Isto é deliberado, não um descuido.

**Está autorizado e é para permanecer:**

- **Citar o nome exato** dos veículos: CNN, Fox News, BBC News, Reuters, Associated
  Press, Bloomberg, Al Jazeera, Financial Times, The Guardian, The New York Times,
  The Washington Post, The Wall Street Journal, O Globo, Folha de S.Paulo, Veja,
  Estadão, CartaCapital, Xinhua, Global Times, RT, TASS, IRNA, Press TV, e os demais
  cadastrados em `app/src/dados/imprensa.js`.
- **Exibir o logo real** de cada veículo (fonte: Wikimedia Commons), no avatar do post e
  no card de preview de link do feed estilo X.
- **Exibir o domínio real** (cnn.com, oglobo.globo.com, folha.uol.com.br…) no card de link.
- **Atribuir a esses veículos posts e manchetes FICCIONAIS**, gerados pela IA a partir do
  estado do jogo, com a linha editorial e o viés que a ficha do veículo descreve.

**A razão de design (não é enfeite):** o feed é o termômetro político do jogo. A mecânica
`tomDaCobertura()` faz cada veículo cobrir você segundo o eixo ideológico dele contra o
seu regime — a Fox elogiando um liberal e atacando um estatista, o Guardian fazendo o
inverso, a Xinhua sendo dócil por construção. **Isso só funciona se o jogador reconhecer
a marca de imediato.** Um "GNN" fictício não carrega bagagem editorial nenhuma; a CNN
carrega. A marca real É a mecânica.

### 2.1 Onde ficam os limites (e por quê)

Estas não são restrições de estilo — são o que mantém o enquadramento acadêmico honesto:

1. **O conteúdo é ficção e o jogo diz isso.** Toda build publicada exibe um aviso visível
   de que se trata de um trabalho acadêmico ficcional, que as marcas pertencem aos seus
   titulares e que nenhum veículo endossa ou participa do projeto.
2. **Nada de fabricar declaração de pessoa real viva.** O veículo é real; o repórter, a
   manchete e o fato são inventados pelo jogo. Um post da CNN no feed é a *CNN do
   SOBERANO*, não a CNN.
3. **Líderes políticos são fictícios** — regra que já vem de levas anteriores e continua
   valendo (`dados/lideres.js`, `dados/paises/*.js`). O Brasil do jogo é governado por
   Otávio Brandão Ferraz, não por quem quer que governe o Brasil de verdade. **Não há
   missão de assassinato, golpe ou difamação contra político real vivo.** O país é real;
   quem senta na cadeira, não.
4. **Sem monetização.** No instante em que houver dinheiro envolvido, o uso de marca de
   terceiro deixa de ser uso acadêmico e vira outra conversa.
5. **Logos por hotlink do Wikimedia, sem redistribuição.** O projeto não hospeda nem
   revende asset de marca alheia.

### 2.2 Regra dura herdada, que continua valendo

**Logo genérico é melhor que logo errado.** Veículo sem logo validado (HTTP 200) NÃO entra
em `LOGO_VEICULO` — cai no wordmark colorido de duas letras, que a UI já trata. O projeto
já exibiu o logo da Apple no card da Lockheed Martin; não repetimos.

---

## 3. EQUIPAMENTO, EMPRESAS E PAÍSES REAIS — AUTORIZADOS

Mesmo enquadramento, mesma razão: **realismo é a mecânica**.

- **Equipamento militar real** com nome, fabricante e foto (M1 Abrams, F-35, VBTP-MR
  Guarani, J-20, Su-57, Bayraktar TB2…). A cadeia produtiva do jogo depende disso: produção
  própria custa 0.8×, licença 1.0×, importado 1.25× e mais caro ainda se a relação com o
  país de origem for ruim. Sem marca real, não há cadeia produtiva — há tabela abstrata.
- **Empresas e estatais reais** (Petrobras, Vale, Embraer, Lockheed Martin, Gazprom,
  Rheinmetall…), com participação estatal aproximada da realidade. Privatizar a Petrobras
  tem peso dramático que "Estatal de Petróleo Nº 1" jamais teria.
- **Países, fronteiras, PIB, reservas, ordem de batalha e geografia reais.** A ficha real é
  o chão que ancora a geração da IA e impede alucinação. É o pilar do projeto desde o v1.

---

## 4. A IA — O QUE É PERMITIDO A ELA

A Máquina (IA via OpenRouter) **inventa o texto e é presa pelas regras nos números**
(`maquina/validador.js`: vocabulário fechado de efeitos + tetos + fallback). Isso não muda.

Além disso, valem para a IA as mesmas linhas da seção 2.1: ela escreve *como* a CNN
escreveria, sobre fatos que não existem, num mundo governado por presidentes fictícios.
O prompt (`maquina/contrato.js`) transporta a lista de veículos com viés e tom; é ele que
faz a imprensa ter personalidade — e é ele que carrega estas regras.

---

## 5. SE O PROJETO SAIR DO ESCOPO ACADÊMICO

Gatilhos que obrigam revisão **antes** de seguir: cobrar por acesso, publicar em loja,
abrir cadastro público amplo, receber patrocínio, ou usar o jogo para qualquer coisa que
não seja avaliação acadêmica e portfólio.

Nesse cenário, o caminho normal é substituir as marcas de imprensa por análogas ficcionais
— **e o código já está pronto para isso**: os veículos são dados (`dados/imprensa.js`), não
estão hardcoded na lógica. Trocar o catálogo troca o jogo inteiro sem tocar em mecânica.
Foi desenhado assim de propósito.

---

## 6. RESUMO EM UMA LINHA

**Marcas reais de imprensa, equipamento, empresas e países: SIM, com nome e logo, porque
são a mecânica — num protótipo acadêmico, sem fins lucrativos, com aviso de ficção, sem
declaração fabricada de pessoa real e com líderes políticos fictícios.**
