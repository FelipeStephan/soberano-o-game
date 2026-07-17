# ═══════════════════════════════════════════════════════════════════════
# SOBERANO — imagem de produção (build multi-stage)
# ═══════════════════════════════════════════════════════════════════════
# Estágio 1 constrói o cliente (Vite). Estágio 2 fica só com o runtime + o build,
# sem as devDependencies — imagem final enxuta. Um container, uma porta, tudo dentro:
# o mesmo processo Node serve o jogo, proxia a IA, hospeda o admin e abre o lobby.

# ── build do cliente ──────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# só as deps de produção (express, ws) — nada de vite no runtime
COPY package*.json ./
RUN npm ci --omit=dev
# o servidor e o build pronto
COPY server ./server
COPY --from=build /app/dist ./dist
# os dados persistentes (perfis, saves) vivem aqui — monte um volume nesta pasta
RUN mkdir -p server/data
EXPOSE 8787
CMD ["node", "server/index.js"]
