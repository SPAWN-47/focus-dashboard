# Deploy no Coolify

Este projeto roda no Coolify usando o buildpack Nixpacks (recomendado) ou o
`Dockerfile` incluído.

## Configuracao da aplicacao

- Source: repositório Git deste projeto
- Build Pack: `Nixpacks`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

## Volume persistente — **CRÍTICO**

Crie um volume persistente no Coolify e **monte em `/data`**.

O `lib/db.js` resolve o diretório do banco nesta ordem:

1. `process.env.DATA_DIR` (se setada)
2. `/data` (auto-detecta se o volume existir) ← **convenção recomendada**
3. `/app/config` (Dockerfile fallback)
4. `./config` (dev local)

No log de boot, a app loga onde está o banco:

```
[db] Data directory: /data (/data (Coolify volume))
[db] Database path: /data/dashboard.db
```

Arquivos persistidos:

- `/data/dashboard.db` (SQLite — users, clients, ROI plans, insights cache)
- `/data/dashboard.db-wal` e `/data/dashboard.db-shm` (journal WAL)

## Variaveis de ambiente

```env
DATA_DIR=/data
JWT_SECRET=gere-um-segredo-longo-e-aleatorio
ADMIN_USERNAME=admin
ADMIN_PASSWORD=defina-uma-senha-forte
NODE_ENV=production
```

Observacoes:

- `DATA_DIR=/data` é **opcional** se o volume estiver em `/data` (auto-detect),
  mas recomendado pra ser explícito.
- `ADMIN_PASSWORD` recria ou atualiza a senha do admin no bootstrap.
- `PORT` é injetada pelo Coolify automaticamente.

## Primeiro acesso

1. Faça o deploy.
2. Aguarde o healthcheck responder em `/health`.
3. Acesse `/login`.
4. Entre com `ADMIN_USERNAME` e `ADMIN_PASSWORD`.
5. Va para `/admin` e cadastre os clientes.

## Validacao rapida pos-deploy

- `GET /health` retorna `200` com `{"ok":true}`
- No log da aplicação aparece `[db] Data directory: /data (...)`
- `POST /api/auth/login` aceita o admin configurado
- O login redireciona para `/admin`
- **Reiniciar a aplicação não apaga os dados** (volume persistente OK)

## Troubleshooting

### "Dados sumiram depois de redeploy"

Significa que o volume não está montado ou não está em `/data`. Verifique:

1. O log de boot mostra qual path está sendo usado (`Data directory: ...`)
2. No painel Coolify, confirme o volume montado em `/data`
3. Se necessário, force `DATA_DIR=/data` nas env vars

### "Permission denied" no volume

Garanta que o volume foi criado pelo Coolify (com owner correto) e não manualmente.
