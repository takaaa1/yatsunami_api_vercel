#!/usr/bin/env bash
# Deploy na VPS: atualiza o código e reinicia a API.
#
# Uso típico (cron):
#   */5 * * * * PM2_SUDO_USER=yatsunami PM2_HOME=/var/www/yatsunami/.pm2 /var/www/yatsunami/api/scripts/vps-deploy.sh >> /var/log/yatsunami/deploy.log 2>&1
#
# Variáveis opcionais:
#   VPS_REPO_DIR   — pasta do clone (default: /var/www/yatsunami/api)
#   DEPLOY_BRANCH  — branch (default: main)
#   PM2_APP_NAME   — nome no PM2 (default: yatsunami-api)
#   PM2_HOME       — PM2_HOME (default: /var/www/yatsunami/.pm2)
#   PM2_SUDO_USER  — se definido, executa pm2 como esse utilizador (ex.: yatsunami)
#   SKIP_MIGRATIONS — se "true", pula o prisma migrate deploy
#
# ATENÇÃO — um só daemon PM2 por app:
#   Cada utilizador tem PM2 em ~/.pm2 (ou PM2_HOME). Se existir yatsunami-api no PM2 do
#   takaaa1 E outro no PM2 do yatsunami, o deploy reinicia um e o tráfego continua no outro.
#   Confirme com: pm2 list  vs  sudo -u yatsunami env PM2_HOME=… pm2 list
#
# Migração (2 APIs só no utilizador yatsunami; Draftpro usa ecosystem na pasta dele): após git pull:
#   chmod +x scripts/vps-pm2-consolidate-yatsunami.sh
#   DRAFTPRO_REPO_DIR=/var/www/draftpro/app ./scripts/vps-pm2-consolidate-yatsunami.sh
# Opcional: DRAFTPRO_ECOSYSTEM=/caminho/ecosystem.config.js

set -euo pipefail

REPO_DIR="${VPS_REPO_DIR:-/var/www/yatsunami/api}"
BRANCH="${DEPLOY_BRANCH:-main}"
PM2_NAME="${PM2_APP_NAME:-yatsunami-api}"
PM2_HOME_VAR="${PM2_HOME:-/var/www/yatsunami/.pm2}"
PM2_SUDO_USER="${PM2_SUDO_USER:-}"
SKIP_MIGRATIONS="${SKIP_MIGRATIONS:-false}"

log() { echo "[$(date -Iseconds)] $*"; }

cd "$REPO_DIR"

git fetch origin "$BRANCH" || git fetch origin

if ! git rev-parse "origin/$BRANCH" >/dev/null 2>&1; then
  log "ERRO: origin/$BRANCH não existe após fetch."
  exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  log "Sem alterações (HEAD = origin/$BRANCH = ${LOCAL:0:8})."
  exit 0
fi

log "Deploy: ${LOCAL:0:8} -> ${REMOTE:0:8}"
git reset --hard "origin/$BRANCH"

log "npm ci…"
# Evita relatório de audit a cada install (as vulnerabilidades vêm do lockfile;
# corrige-as no dev com npm audit / upgrades; não faz sentido “exigir” audit fix no deploy).
npm ci --no-audit --no-fund

log "prisma generate…"
npx prisma generate

log "npm run build…"
npm run build

if [ "$SKIP_MIGRATIONS" != "true" ]; then
  log "prisma migrate deploy…"
  npx prisma migrate deploy
else
  log "Migrations ignoradas (SKIP_MIGRATIONS=true)."
fi

pm2_run() {
  if [ -n "$PM2_SUDO_USER" ]; then
    sudo -u "$PM2_SUDO_USER" env PM2_HOME="$PM2_HOME_VAR" "$@"
  else
    env PM2_HOME="$PM2_HOME_VAR" "$@"
  fi
}

warn_duplicate_pm2() {
  # Deploy corre no PM2 do yatsunami; tráfego pode ir para outro PM2 (ex.: ~/.pm2 do takaaa1).
  if [ -n "$PM2_SUDO_USER" ] && [ "$(whoami)" != "$PM2_SUDO_USER" ]; then
    if env -u PM2_HOME pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
      log "AVISO: existe também '$PM2_NAME' no PM2 de $(whoami) (PM2_HOME=${PM2_HOME:-$HOME/.pm2})."
      log "  Se a API em produção não atualizar, pare esse processo: pm2 delete $PM2_NAME"
      log "  e use só: sudo -u $PM2_SUDO_USER env PM2_HOME=$PM2_HOME_VAR pm2 list"
      log "  Migração única: ./scripts/vps-pm2-consolidate-yatsunami.sh"
    fi
  fi
}

restart_pm2() {
  local eco="$REPO_DIR/ecosystem.config.js"
  if [ ! -f "$eco" ]; then
    log "ERRO: não existe $eco"
    exit 1
  fi

  log "PM2: app=$PM2_NAME PM2_HOME=$PM2_HOME_VAR user=${PM2_SUDO_USER:-$(whoami)}"

  # delete + start garante dist/main.js novo (restart às vezes mantém processo antigo em setups duplicados)
  if pm2_run pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
    log "pm2 delete $PM2_NAME (recarregar build)…"
    pm2_run pm2 delete "$PM2_NAME" || true
  fi

  log "pm2 start $eco…"
  pm2_run pm2 start "$eco" --update-env
  pm2_run pm2 save || true

  pm2_run pm2 describe "$PM2_NAME" 2>/dev/null | grep -E 'status|exec cwd|script path' || true
}

warn_duplicate_pm2
restart_pm2
warn_duplicate_pm2

log "Concluído."
