# Deploy no Coolify

Este projeto pode ser publicado no Coolify sem Railway usando o buildpack do Node/Nixpacks.

## Configuracao da aplicacao

- Source: repositório Git deste projeto
- Build Pack: `Nixpacks`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

## Variaveis de ambiente

Use estas variaveis no Coolify:

```env
DATA_DIR=/data
JWT_SECRET=gere-um-segredo-longo-e-aleatorio
ADMIN_USERNAME=admin
ADMIN_PASSWORD=defina-uma-senha-forte
```

Observacoes:

- `DATA_DIR=/data` faz o app gravar `users.json` e `clients.json` fora do codigo.
- `ADMIN_PASSWORD` recria ou atualiza a senha do admin no bootstrap.
- `PORT` nao precisa ser fixado manualmente se o Coolify injetar a porta de runtime.

## Volume persistente

Crie um volume persistente no Coolify e monte em `/data`.

Arquivos esperados nesse volume:

- `/data/users.json`
- `/data/clients.json`

No primeiro deploy, `npm start` executa `scripts/init-data.js` e cria esses arquivos se eles nao existirem.

## Primeiro acesso

1. Faça o deploy.
2. Aguarde o healthcheck responder em `/health`.
3. Acesse `/login`.
4. Entre com `ADMIN_USERNAME` e `ADMIN_PASSWORD`.
5. Va para `/admin` e recrie os clientes.

## Recriacao dos dados

Sem o volume antigo do Railway, os dados precisam ser recriados.

- Usuarios admin: sao inicializados por `ADMIN_USERNAME` e `ADMIN_PASSWORD`.
- Usuarios cliente: sao gerados automaticamente ao criar um cliente no painel admin.
- Clientes: precisam ser cadastrados novamente com `id`, `name`, `token` e `accountId`.

Estruturas de referencia:

- `config/users.example.json`
- `config/clients.example.json`
- `.env.coolify.example`

## Validacao rapida

Depois do deploy, confirme:

- `GET /health` retorna `200` com `{\"ok\":true}`
- `POST /api/auth/login` aceita o admin configurado
- o login redireciona para `/admin`
- reiniciar a aplicacao nao apaga `users.json` e `clients.json`
