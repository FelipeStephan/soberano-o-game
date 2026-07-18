# SOBERANO — Registro da sessão (2026-07)

Uma leva grande de recursos e correções. Resumo por sistema; detalhes vivem nos
comentários "O QUE ISTO CONSERTA / o porquê" de cada arquivo.

## 🚢 Naval — o combate ganhou corpo
- **Catálogo militar** (`dados/catalogoMilitar.js`): ficha técnica por classe. Cada
  porta-aviões carrega o que a classe real carrega (Ford 75 aeronaves, Cavour 20, Anadolu
  só drone…). É a fonte única pra specs de veículos/mísseis futuros.
- **Posição naval** (`ui/naval.js`): capacidade por classe (fim do "70 fixo"); embarca
  **helicópteros** (asa rotativa, voa até de convés sem catapulta) e **fuzileiros**
  (teto = navios×150 + carriers×1600). Cartão **ancorado no ponto do mar**, girando com o
  globo. Custo operacional debitado do tesouro. Sem tropa livre → **atalho pro Distribuir**
  (não mais a lista feia de recolher).
- **Painel da frota** (`ui/navalAcoes.js`): ancorado no pino, segue a rotação; composição
  com **fotos**; **força-herói** (Poder Naval/Presença/Abates/Baixas); **baixas visíveis**
  (o que perdi, badge −N por unidade). Ataque usa a **composição da frota** (seletor
  Tudo/50%/manual), não a força do país. Alvos: **país inteiro (distribuído) OU por cidade**.
- **Frota inimiga** (`abrirAcoesFrotaInimiga`): mesmo cartão ancorado, com Atacar/Intimar.
- **Batalha** (`ui/batalhaNaval.js`): sem overlay — **mísseis no globo** + **relatório de
  baixas** ancorado. Baixas equilibradas por força. **Intimação com diálogos de rádio**
  (provocações/xingamentos). Arrasto de frota **para na costa** (não entra em terra).

## 🤝 Alianças (`jogo/aliancas.js` + `ui/aliancas.js` + `ui/blocos.js`)
Aliança **única flexível**: nome/cor à escolha, **regras** que fazem o caráter emergir
(Pacto Militar / União Econômica / Estratégica). A IA **aceita ou recusa** por relação +
discordância com membros + alinhamento + medo, com motivo legível. A aliança **vira um
bloco de verdade** (coalizão/mercado/reação leem de graça). Bônus RPG ao entrar. Botão
**BLOCOS** no cabeçalho: visor de todos os blocos (poder, PIB, intensidade, filtros).

## ⚔️ Tropas terrestres
- **Motor de recolher** (`jogo/territorio.js`, `jogo/frotas.js`): `recolherTudo`,
  `recolherFrota`, `ondeComprometidas`; `tropaLivre` agora desconta frotas (MAR_). Resolveu
  o "não tenho tropa em reserva".
- **Painel Pentágono** (`ui/distribuir.js`): reserva viva, **vetores de ameaça**, doutrina
  de **Contra-ataque**, mesa de estados com reforçar/recolher, silhueta do estado.
- **Reforço** (`ui/reforco.js`): compacto, **Poder Vivo** (número salta ao mexer), sem a
  fileira de emojis, silhueta do estado, base militar colapsada.

## 🌐 Governança & Economia
- **Painel de Governança** redesenhado (tiles, fluxo de caixa, slider consertado).
- **Indústria** virou indicador visível na HUD (com Inteligência/Urânio).

## 🦠 Pandemias (`jogo/mundoVivo.js`)
Doenças reais como novas variantes (Covid-19 Cérbero-Σ, Ebola Makona-2, Febre Amarela
urbana, H5N1, Marburg…), cada uma com **texto de história** exibido no painel.

## 🧠 Hover de país
Ícone ⚡ → **espadas/mira**; texto de tensão **escrito por IA** na voz do país (cacheado
por patamar de relação; fallback sem chave).

## 📞 Online — Telefone Vermelho + mundo compartilhado
- **Telefonia** (`net/chamada.js`, `ui/telefone.js`): chamada de voz **WebRTC P2P** com
  seleção de microfone, **efeito de telefone** (banda 300–3400 Hz) + estática de fundo,
  tons de chamada, animação de "linha segura", **modo avião**, chat privado (DM).
  Sinalização pelo canal `direto` do lobby (`server/lobby.js`). Toque audível
  (destrava de autoplay) + vibração + notificação de DM.
- **Contato no dock** do país (embaixo de DECIDIR), 4 botões padronizados.
- **Mundo compartilhado (1ª fatia)**: host é autoridade do "mundo ao vivo" — retransmite
  posts do X, animações e **período** pra sala; convidados aplicam (fim da divergência de
  timeline/relógio). Prognóstico de ofensiva **velado no online** (sem "23 de 25 territórios").

## 🖱️ Diversos
- **Botão direito fecha modais** (e não posiciona frota).
- **Zoom em países pequenos** pela bounding box.
- Silhueta vetorial de estado reusável (`ui/territorioSvg.js`).

> ⚠️ Servidor: `server/lobby.js` mudou (canal `direto`) — reiniciar o `:8787` pra ativar
> a telefonia. Áudio bruto em `MUSICA E EFEITO SONORO/` fica fora do repo (grande);
> plugar via `setSomChamando()` e efeitos quando processado.
