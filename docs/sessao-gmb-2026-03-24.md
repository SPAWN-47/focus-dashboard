# Sessão de Trabalho — Google My Business Integration
**Data:** 2026-03-24

---

## ✅ O que foi feito nessa sessão

### 1. OAuth Flow — Google Business Profile
- Acessamos o OAuth Playground (`developers.google.com/oauthplayground`)
- Usamos as mesmas credenciais do Google Ads (Client ID/Secret)
- Scope selecionado: `https://www.googleapis.com/auth/business.manage`
- Conta autenticada: `pgui.fdelima@gmail.com`
- **Refresh Token obtido:**
  ```
  REDACTED_SALVO_NO_COOLIFY
  ```

---

### 2. Código implementado e deployado no GitHub (commit `c23bd54`)

#### `lib/gmb.js` (arquivo novo)
- `getGmbAccessToken()` — troca refresh token por access token (cache em memória)
- `getGmbAccounts()` — lista contas via `mybusinessaccountmanagement.googleapis.com`
- `getGmbLocations(accountName)` — lista locais via `mybusinessbusinessinformation.googleapis.com`
- `getGmbReviews(locationName, pageSize)` — busca reviews via `mybusiness.googleapis.com/v4`
- `getGmbInsights(locationId, startDate, endDate)` — métricas via `businessprofileperformance.googleapis.com`
- `computeGmbMetrics(series)` — agrega série temporal em `{impressoes, buscas, mapas, ligacoes, cliquessite, direcoes}`
- `getGmbDateRange(period)` — retorna `{startDate, endDate}` para daily/weekly/monthly

#### `server.js` (modificado)
- Import das funções GMB adicionado
- CSP `connectSrc` atualizado com os 4 domínios das APIs GMB
- Rotas adicionadas:
  - `GET /api/gmb/insights` — métricas de performance
  - `GET /api/gmb/reviews` — avaliações
  - `GET /api/gmb/locations` — lista de locais (admin only)
- `POST /api/config/clients` agora aceita `google_ads_customer_id` e `gmb_location_id`

#### `src/pages/GmbDashboardPage.jsx` (arquivo novo)
- KPI cards: Impressões, Buscas, Mapas, Ligações, Site, Direções
- Seção de reviews com StarRating, averageRating, totalReviewCount
- ReviewCard com expand/collapse para reviews longos + exibição de resposta do proprietário
- Seletor de período (diário/semanal/mensal)
- Estado "não configurado" quando `gmb_location_id` não está setado
- Seção educativa "o que significam essas métricas"

#### `src/components/PlatformNav.jsx` (modificado)
- Aba "Meu Negócio" (`/dashboard/gmb`, emoji 📍) adicionada
- Aba "Google" renomeada para "Google Ads"

#### `src/App.jsx` (modificado)
- Import de `GmbDashboardPage` adicionado
- Rota `/dashboard/gmb` adicionada

#### `src/pages/AdminPage.jsx` (modificado)
- Campo `gmb_location_id` adicionado no formulário de clientes (seção Google)

#### `.env.coolify.example` (modificado)
- Variáveis GMB adicionadas (com placeholders para o GitHub):
  ```
  GMB_CLIENT_ID=YOUR_GMB_CLIENT_ID.apps.googleusercontent.com
  GMB_CLIENT_SECRET=YOUR_GMB_CLIENT_SECRET
  GMB_REFRESH_TOKEN=YOUR_GMB_REFRESH_TOKEN
  ```

---

## ⏳ Tarefas pendentes

### Alta prioridade

1. **Adicionar variáveis de ambiente no Coolify**
   - App UUID: `qk4ckggcgk04kgkog48sgg04`
   - URL: `https://coolify.atenachat.com.br`
   - Variáveis a adicionar:
     | Variável | Valor |
     |---|---|
     | `GMB_CLIENT_ID` | (mesmo Client ID do Google Ads) |
     | `GMB_CLIENT_SECRET` | (mesmo Client Secret do Google Ads) |
     | `GMB_REFRESH_TOKEN` | `REDACTED_SALVO_NO_COOLIFY` |
   - Adicionar manualmente em: `https://coolify.atenachat.com.br` → aplicação focus-dashboard → Environment Variables
   - Após adicionar, fazer **redeploy**

2. **Ativar APIs no GCP Console** (`console.cloud.google.com`)
   - My Business Account Management API
   - My Business Business Information API
   - Business Profile Performance API

3. **Adicionar `gmb_location_id` para os clientes** via painel Admin
   - Primeiro usar a rota `GET /api/gmb/locations` para descobrir os IDs de cada cliente
   - Acesse: `https://seu-dashboard.com/api/gmb/locations` (requer login admin)

### Média prioridade

4. **Adicionar Google Ads Customer IDs** (estava pausado)
   | Cliente | Customer ID |
   |---|---|
   | Top Car | 336-716-6992 |
   | SOS Panelas | 890-563-4560 |
   | Vila Odonto | 945-272-2968 |
   | Atena CHAT | 713-435-5452 |

5. **Aguardar aprovação do Google Developer Token** (~3 dias úteis)
   - E-mail de contato: `pgui.fdelima@gmail.com`

---

## 🔑 Credenciais e IDs importantes

| Item | Valor |
|---|---|
| App UUID no Coolify | `qk4ckggcgk04kgkog48sgg04` |
| Conta Google autenticada | `pgui.fdelima@gmail.com` |
| GMB Refresh Token | `REDACTED_SALVO_NO_COOLIFY` |

---

## 📋 Como adicionar as env vars no Coolify manualmente

1. Acesse `https://coolify.atenachat.com.br`
2. Vá em **Applications** → **focus-dashboard**
3. Clique na aba **Environment Variables**
4. Adicione as 3 variáveis:
   - `GMB_CLIENT_ID` = seu Client ID (termina em `.apps.googleusercontent.com`)
   - `GMB_CLIENT_SECRET` = seu Client Secret
   - `GMB_REFRESH_TOKEN` = o token acima
5. Salve e clique em **Deploy** / **Redeploy**

---

## 🔗 Links úteis

- GCP Console: https://console.cloud.google.com
- OAuth Playground: https://developers.google.com/oauthplayground
- Coolify: https://coolify.atenachat.com.br
- Commit da integração: `c23bd54`
