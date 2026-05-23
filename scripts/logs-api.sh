#!/usr/bin/env bash
# Logs da API no slot blue/green activo (VPS: git pull traz este script).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

STATE_FILE="${DEPLOY_STATE_FILE:-.deploy-active-slot}"
API_PORT_A="${API_PORT_A:-3001}"
API_PORT_B="${API_PORT_B:-3002}"
API_PUBLIC_PORT="${API_PUBLIC_PORT:-3070}"
API_PROXY_NAME="${API_PROXY_NAME:-yatsunami_api_proxy}"

slot=$(cat "$STATE_FILE" 2>/dev/null || echo "a")
case "$slot" in
  a | b) ;;
  *)
    echo "AVISO: slot inválido em ${STATE_FILE}: '${slot}' — a assumir 'a'." >&2
    slot=a
    ;;
esac

container="yatsunami_api_${slot}"
if [ "$slot" = "a" ]; then
  port="$API_PORT_A"
else
  port="$API_PORT_B"
fi

echo "Slot ativo: ${slot}"
echo "Container:  ${container}"
echo "Porta API:  ${port} (proxy em :${API_PUBLIC_PORT} → ${API_PROXY_NAME})"
echo "---"

case "${1:-}" in
  -s | --status)
    docker ps --filter "name=${container}" --filter "name=${API_PROXY_NAME}" \
      --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null || true
    exit 0
    ;;
  -f | --follow)
    exec docker logs -f "$container"
    ;;
  -h | --help)
    cat <<EOF
Uso: bash scripts/logs-api.sh [opção]

  (sem opção)     docker logs do slot activo (histórico completo, sem --tail)
  -f, --follow    docker logs -f (tempo real)
  -s, --status    só mostra slot + estado dos containers
  -h, --help      esta ajuda

Proxy: docker logs ${API_PROXY_NAME}
Postgres (VPS nativo): journalctl -u postgresql ou pg_isready -h 127.0.0.1 -p 5432
EOF
    exit 0
    ;;
  "")
    exec docker logs "$container"
    ;;
  *)
    echo "Opção desconhecida: $1 (use --help)" >&2
    exit 1
    ;;
esac
