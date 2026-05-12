#!/usr/bin/env bash
# Migração única na VPS: remove yatsunami-api e draftpro-api do PM2 do utilizador atual
# (ex.: takaaa1) e volta a subir cada API com o seu próprio ecosystem no utilizador yatsunami
# (PM2_HOME partilhado).
#
# Requisitos: executar como utilizador com sudo (ex.: takaaa1).
# Variáveis:
#   DRAFTPRO_REPO_DIR — pasta do clone Draftpro (default: /var/www/draftpro/app)
#   DRAFTPRO_ECOSYSTEM — caminho absoluto do ficheiro PM2 do Draftpro (opcional; senão
#     usa ecosystem.config.js ou ecosystem.config.cjs dentro de DRAFTPRO_REPO_DIR)
#
# Depois: correr o comando que `pm2 startup` imprimir para o utilizador yatsunami (reboot).

set -euo pipefail

PM2_HOME_YAT="${PM2_HOME:-/var/www/yatsunami/.pm2}"
YATSUNAMI_USER="${YATSUNAMI_USER:-yatsunami}"
REPO_DIR="${VPS_REPO_DIR:-/var/www/yatsunami/api}"
DRAFTPRO_REPO_DIR="${DRAFTPRO_REPO_DIR:-${DRAFTPRO_API_DIR:-/var/www/draftpro/app}}"

log() { echo "[$(date -Iseconds)] $*"; }

run_as_yatsunami() {
  sudo -u "$YATSUNAMI_USER" env PM2_HOME="$PM2_HOME_YAT" PATH="$PATH" "$@"
}

resolve_draftpro_ecosystem() {
  if [ -n "${DRAFTPRO_ECOSYSTEM:-}" ]; then
    if [ -f "$DRAFTPRO_ECOSYSTEM" ]; then
      echo "$DRAFTPRO_ECOSYSTEM"
      return 0
    fi
    log "ERRO: DRAFTPRO_ECOSYSTEM=$DRAFTPRO_ECOSYSTEM não é um ficheiro existente."
    return 1
  fi
  if [ -f "$DRAFTPRO_REPO_DIR/ecosystem.config.js" ]; then
    echo "$DRAFTPRO_REPO_DIR/ecosystem.config.js"
    return 0
  fi
  if [ -f "$DRAFTPRO_REPO_DIR/ecosystem.config.cjs" ]; then
    echo "$DRAFTPRO_REPO_DIR/ecosystem.config.cjs"
    return 0
  fi
  return 1
}

DRAFTPRO_ECOSYSTEM_FILE=""
if DRAFTPRO_ECOSYSTEM_FILE="$(resolve_draftpro_ecosystem)"; then
  :
else
  DRAFTPRO_ECOSYSTEM_FILE=""
fi

log "PM2_HOME (yatsunami): $PM2_HOME_YAT"
log "Repo yatsunami_api: $REPO_DIR"
log "Repo draftpro (referência): $DRAFTPRO_REPO_DIR"
log "Ecosystem draftpro: ${DRAFTPRO_ECOSYSTEM_FILE:-<não encontrado>}"

if [ ! -f "$REPO_DIR/ecosystem.config.js" ]; then
  log "ERRO: não existe $REPO_DIR/ecosystem.config.js (clone atualizado?)"
  exit 1
fi

if [ -z "$DRAFTPRO_ECOSYSTEM_FILE" ]; then
  log "ERRO: não foi encontrado ecosystem do Draftpro em $DRAFTPRO_REPO_DIR (ecosystem.config.js/.cjs) nem DRAFTPRO_ECOSYSTEM."
  exit 1
fi

if [ ! -d "$DRAFTPRO_REPO_DIR" ] && [ -z "${DRAFTPRO_ECOSYSTEM:-}" ]; then
  log "ERRO: pasta $DRAFTPRO_REPO_DIR não existe. Exporte DRAFTPRO_REPO_DIR=/caminho/real ou DRAFTPRO_ECOSYSTEM=/caminho/ecosystem.config.js"
  exit 1
fi

log "1) Parar apps no PM2 do utilizador atual ($(whoami))…"
pm2 delete yatsunami-api 2>/dev/null || true
pm2 delete draftpro-api 2>/dev/null || true
pm2 save 2>/dev/null || true

log "2) Limpar entradas antigas no PM2 do utilizador $YATSUNAMI_USER…"
run_as_yatsunami pm2 delete yatsunami-api 2>/dev/null || true
run_as_yatsunami pm2 delete draftpro-api 2>/dev/null || true

log "3a) Arrancar yatsunami-api (ecosystem deste repo)…"
run_as_yatsunami bash -lc "cd \"$REPO_DIR\" && pm2 start ecosystem.config.js"

log "3b) Arrancar draftpro (ecosystem próprio do Draftpro)…"
DRAFTPRO_ECO_DIR=$(dirname "$DRAFTPRO_ECOSYSTEM_FILE")
DRAFTPRO_ECO_NAME=$(basename "$DRAFTPRO_ECOSYSTEM_FILE")
run_as_yatsunami bash -lc "cd $(printf '%q' "$DRAFTPRO_ECO_DIR") && pm2 start $(printf '%q' "$DRAFTPRO_ECO_NAME")"

log "4) pm2 save (utilizador $YATSUNAMI_USER)…"
run_as_yatsunami pm2 save

log "Concluído. Verifique: sudo -u $YATSUNAMI_USER env PM2_HOME=$PM2_HOME_YAT pm2 list"
log "Passo manual: sudo -u $YATSUNAMI_USER env PM2_HOME=$PM2_HOME_YAT pm2 startup"
log "  (execute a linha systemd que o comando acima imprimir, com sudo, se ainda não tiver startup para este PM2_HOME.)"
