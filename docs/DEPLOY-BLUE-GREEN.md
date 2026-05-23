# Deploy blue/green — Yatsunami API

Padrão igual ao [Taikonnect](https://github.com/takaaa1/taikonnect): dois slots Docker (A/B) + proxy Nginx interno sem downtime no swap.

## Arquitectura

```
Nginx sistema (api.yatsunami.com.br:443)
        ↓ proxy_pass
127.0.0.1:3000  ← contentor yatsunami_api_proxy (nginx:alpine)
        ↓ upstream activo
127.0.0.1:3001  ← yatsunami_api_a  (slot A)
127.0.0.1:3002  ← yatsunami_api_b  (slot B)
```

- **Porta 3000** mantém-se (o site Nginx em `/etc/nginx` não precisa mudar de porta).
- Postgres continua em **127.0.0.1:5432** na VPS (fora do Docker).
- Uploads locais (fallback): volume `/var/www/yatsunami/uploads` montado nos contentores.

## Primeira migração (PM2 → blue/green)

Com `yatsunami-api` a correr no PM2:

```bash
cd /var/www/yatsunami/api
git pull origin main
chmod +x deploy.sh scripts/vps-deploy.sh
./deploy.sh
```

O script:
1. Remove o processo PM2 `yatsunami-api`
2. Sobe slot **a** na porta **3001**
3. Cria o proxy na porta **3000**
4. Deploys seguintes alternam a ↔ b

## Deploy manual

```bash
cd /var/www/yatsunami/api
./deploy.sh
```

Forçar sem commits novos:

```bash
FORCE_DEPLOY=true ./deploy.sh
```

## Cron (automático)

```bash
*/5 * * * * /var/www/yatsunami/api/scripts/vps-deploy.sh >> /var/log/yatsunami/deploy.log 2>&1
```

## Variáveis úteis

| Variável | Default | Descrição |
|----------|---------|-----------|
| `API_PUBLIC_PORT` | `3000` | Porta do proxy (entrada do Nginx sistema) |
| `API_PORT_A` | `3001` | Slot A |
| `API_PORT_B` | `3002` | Slot B |
| `UPLOADS_HOST_PATH` | `/var/www/yatsunami/uploads` | Volume de uploads |
| `POSTGRES_HOST_PORT` | `5432` | Postgres na VPS |
| `FORCE_DEPLOY` | — | `true` = deploy sem git novo |
| `SKIP_PRUNE` | `false` | `true` = não faz docker image prune |

## Verificação

```bash
docker ps --filter name=yatsunami_api
cat .deploy-active-slot
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api
curl -sS -o /dev/null -w "%{http_code}\n" https://api.yatsunami.com.br/api
```

## Rollback

O `deploy.sh` faz rollback automático se o slot novo não passar nos health checks.

Manual: repor slot anterior em `deploy/nginx/runtime/active-upstream.inc` e `docker exec yatsunami_api_proxy nginx -s reload`.

## Nginx sistema (opcional)

Se quiser usar `upstream` explícito, ver `deploy/nginx/upstream-snippet.conf`. Na maioria dos setups o `proxy_pass http://127.0.0.1:3000` actual continua válido.
