#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# SOBERANO — instalação de UM comando na VPS (Ubuntu 24.04, Hostinger KVM 2)
# ═══════════════════════════════════════════════════════════════════════
# Rode como root no terminal da VPS (o "Terminal do navegador" do painel serve):
#   curl -fsSL https://raw.githubusercontent.com/FelipeStephan/soberano-o-game/main/app/deploy/instalar-vps.sh | bash
# (repo privado? clone à mão com token e rode: bash app/deploy/instalar-vps.sh)
#
# O script é IDEMPOTENTE: rodar de novo atualiza, não quebra.
set -euo pipefail

REPO="https://github.com/FelipeStephan/soberano-o-game.git"
DIR=/opt/soberano

echo "── 1/5 · Docker ─────────────────────────────────────────────"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
docker --version

echo "── 2/5 · Código ─────────────────────────────────────────────"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only
else
  # Repo privado: o git vai pedir usuário/senha — use um Personal Access Token
  # do GitHub como senha (Settings → Developer settings → Tokens, escopo `repo`).
  git clone "$REPO" "$DIR"
fi
cd "$DIR/app"

echo "── 3/5 · Variáveis de ambiente ──────────────────────────────"
if [ ! -f .env ]; then
  cat > .env << 'ENV'
# ── PREENCHA E SALVE (nano .env) ─────────────────────────────────────
# Chave do OpenRouter — sem ela o jogo roda em modo demonstração
OPENROUTER_API_KEY=
# Senha do painel /admin — INVENTE UMA FORTE
ADMIN_PASSWORD=
# Postgres do Neon (postgresql://...?sslmode=require) — sem ela, saves em arquivo
DATABASE_URL=
# A URL pública do jogo (Referer do OpenRouter + origem do WebSocket)
PUBLIC_URL=https://soberano.uxstephan.com
# Freios de custo da IA
AI_LIMITE_POR_MINUTO=12
AI_TETO_DIARIO=600
ENV
  echo "⚠  .env criado VAZIO em $DIR/app/.env — preencha antes de continuar:"
  echo "   nano $DIR/app/.env   e rode este script de novo."
  exit 0
fi

echo "── 4/5 · Build + subida (app + Caddy/HTTPS) ─────────────────"
docker compose up -d --build

echo "── 5/5 · Verificação ────────────────────────────────────────"
sleep 4
docker compose ps
echo
echo "Health local:"; curl -fsS http://localhost:80 -H "Host: soberano.uxstephan.com" -o /dev/null -w "HTTP %{http_code}\n" || true
echo
echo "✔ Pronto. Abra:  https://soberano.uxstephan.com"
echo "  Health:        https://soberano.uxstephan.com/api/health  (tem de dizer \"backend\":\"postgres\")"
echo "  Admin:         https://soberano.uxstephan.com/admin"
echo "  Logs:          cd $DIR/app && docker compose logs -f soberano"
