# Deploy blue/green — Yatsunami API

Padrão igual ao [Taikonnect](https://github.com/takaaa1/taikonnect): dois slots Docker (A/B) + proxy Nginx interno sem downtime no swap.

## Arquitectura

```
Nginx sistema (api.yatsunami.com.br:443)
        ↓ proxy_pass
127.0.0.1:3070  ← contentor yatsunami_api_proxy (nginx:alpine)
        ↓ upstream activo
127.0.0.1:3001  ← yatsunami_api_a  (slot A)
127.0.0.1:3002  ← yatsunami_api_b  (slot B)
```

- **Porta 3070** — entrada do proxy (evita conflito com outras apps na 3000).
- O **Nginx do sistema** (`/etc/nginx/sites-enabled/`) deve fazer `proxy_pass http://127.0.0.1:3070` (não `:3000`).
- Postgres continua em **127.0.0.1:5432** na VPS (fora do Docker).
- O `.env` deve ter **`DATABASE_URL`** e **`DIRECT_URL`** (mesmo valor, `postgresql://...`) — o Prisma exige os dois.
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
3. Cria o proxy na porta **3070**
4. Deploys seguintes alternam a ↔ b

**Importante:** após o primeiro deploy, actualize o site Nginx da API:

```nginx
proxy_pass http://127.0.0.1:3070;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Deploy manual

```bash
cd /var/www/yatsunami/api
./deploy.sh
```

Sem commits novos, o script pergunta **Executar deploy mesmo assim? [s/N]** (TTY). Responda `s` para rebuild manual.

Para cron (sem TTY), use `FORCE_DEPLOY=true` no ambiente ou só corre quando houver push novo.

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
| `API_PUBLIC_PORT` | `3070` | Porta do proxy (entrada do Nginx sistema) |
| `API_PORT_A` | `3001` | Slot A |
| `API_PORT_B` | `3002` | Slot B |
| `UPLOADS_HOST_PATH` | `/var/www/yatsunami/uploads` | Volume de uploads |
| `POSTGRES_HOST_PORT` | `5432` | Postgres na VPS |
| `FORCE_DEPLOY` | — | `true` = deploy sem git novo (cron) |
| `SKIP_PRUNE` | `false` | `true` = não faz docker image prune |

## Verificação

```bash
docker ps --filter name=yatsunami_api
cat .deploy-active-slot
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3070/api
curl -sS -o /dev/null -w "%{http_code}\n" https://api.yatsunami.com.br/api
```

## Rollback

O `deploy.sh` faz rollback automático se o slot novo não passar nos health checks.

Manual: repor slot anterior em `deploy/nginx/runtime/active-upstream.inc` e `docker exec yatsunami_api_proxy nginx -s reload`.

## Nginx sistema (opcional)

Se quiser usar `upstream` explícito, ver `deploy/nginx/upstream-snippet.conf`. O `proxy_pass` do vhost deve apontar para **127.0.0.1:3070**.
