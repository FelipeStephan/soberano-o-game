# SOBERANO — Protótipo (A Máquina)

Protótipo do motor emergente do jogo. A **Máquina** (IA) gera cada acontecimento
em tempo real a partir do ano, da ficha do país e das suas ações.

## Como rodar

Você precisa do **Node.js** instalado (https://nodejs.org — versão LTS).

```bash
cd app
npm install
npm run dev
```

Abre sozinho em `http://localhost:5173`.

## Ligar a IA (OpenRouter)

O jogo roda **sem chave** em **Modo Demonstração** (usa a biblioteca de eventos
de reserva) — dá pra ver o loop funcionando na hora.

Pra ligar a **Máquina de verdade** (geração por IA), tem dois caminhos:

- **Fácil:** clique na engrenagem ⚙ no canto, cole sua chave do OpenRouter e o
  modelo. Fica salvo no navegador. Nenhum arquivo pra editar.
- **Arquivo:** copie `.env.example` para `.env` e preencha `VITE_OPENROUTER_API_KEY`.

> A chave fica só no seu navegador/máquina. Este protótipo chama o OpenRouter
> direto do front — ótimo pra desenvolver localmente. Antes de publicar o jogo
> pra internet, a chamada migra pra um pequeno servidor (proxy) pra não expor a
> chave. Todo o código de IA está isolado em `src/maquina/` justamente pra essa
> troca ser indolor.

## Mapa do código

```
src/
  config.js            Lê a chave/modelo (do .env ou da engrenagem)
  main.js              Ponto de entrada; liga tudo

  maquina/             ← A MÁQUINA (toda a IA vive aqui)
    openrouter.js        Único ponto que fala com a IA. Trocar de provedor = só aqui.
    contrato.js          Monta o prompt (contexto estático + delta do turno) e parseia a saída
    validador.js         Guarda-corpos: vocabulário fechado de efeitos + tetos
    fios.js              Camada 1 — Fios de Tensão (memória, em código, sem IA)
    gerador.js           Camada 2 — escolhe o fio quente, chama a IA, valida, faz fallback
    fallback.js          Biblioteca de eventos de reserva (Modo Demonstração / API caiu)

  jogo/
    estado.js            O Estado do Mundo (vocabulário fechado de variáveis)
    efeitos.js           Aplica efeitos com teto e limites
    motor.js             Controlador do jogo: próxima carta, resolver opção, avançar turno

  dados/
    eua-2026.js          Ficha do Mundo feita à mão (país + ano)
    elenco.js            Gabinete fixo (papéis + personalidades)
    veiculos.js          Os 5 veículos de mídia ficcionais

  ui/                    Tela: início, globo (placeholder), HUDs, feed, carta
```

## Estado atual

Fatia vertical: EUA-2026, Fios de Tensão rodando, geração pela Máquina com
validação e fallback, feed estilo X como radar de crise, HUDs de estado.
O **globo 3D** está como placeholder — pronto pra receber o seu.
