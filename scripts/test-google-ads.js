/**
 * scripts/test-google-ads.js
 *
 * Script de diagnóstico para verificar a integração com Google Ads API.
 * Roda localmente com: node scripts/test-google-ads.js
 *
 * Requer as variáveis de ambiente configuradas em .env ou exportadas no terminal.
 */

import axios from "axios";

// ─── 1. Verifica variáveis de ambiente ───────────────────────────────────────

const REQUIRED_VARS = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID", // ID da conta do cliente (ex: 123-456-7890)
];

console.log("\n=== DIAGNÓSTICO GOOGLE ADS API ===\n");
console.log("📋 Verificando variáveis de ambiente...");

let missingVars = false;
for (const v of REQUIRED_VARS) {
  const val = process.env[v];
  if (!val || val.startsWith("YOUR_")) {
    console.log(`  ❌ ${v} — NÃO CONFIGURADA`);
    missingVars = true;
  } else {
    const preview = val.length > 10 ? val.slice(0, 6) + "..." + val.slice(-4) : "***";
    console.log(`  ✅ ${v} = ${preview}`);
  }
}

if (missingVars) {
  console.log("\n⛔ Configure as variáveis acima e rode novamente.\n");
  process.exit(1);
}

// ─── 2. Obtém Access Token ───────────────────────────────────────────────────

async function getAccessToken() {
  console.log("\n🔑 Obtendo access token via refresh token...");

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type:    "refresh_token",
  });

  const res = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  console.log(`  ✅ Access token obtido (expira em ${res.data.expires_in}s)`);
  return res.data.access_token;
}

// ─── 3. Testa query básica na conta ─────────────────────────────────────────

async function testQuery(accessToken) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  console.log(`\n📊 Testando query na conta ${customerId}...`);

  const query = `
    SELECT
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions
    FROM customer
    WHERE segments.date DURING LAST_7_DAYS
  `;

  const res = await axios.post(
    `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:search`,
    { query },
    {
      headers: {
        Authorization:     `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type":    "application/json",
      },
      timeout: 20000,
    }
  );

  const rows = res.data.results || [];

  if (rows.length === 0) {
    console.log("  ⚠️  Query retornou 0 linhas (conta sem dados nos últimos 7 dias, ou sem campanhas ativas)");
    return;
  }

  // Agrega métricas
  let costMicros = 0, impressoes = 0, cliques = 0, conversas = 0;
  for (const row of rows) {
    const m = row.metrics || {};
    costMicros += Number(m.costMicros  ?? m.cost_micros  ?? 0);
    impressoes += Number(m.impressions ?? 0);
    cliques    += Number(m.clicks      ?? 0);
    conversas  += Number(m.conversions ?? 0);
  }

  const gasto = (costMicros / 1_000_000).toFixed(2);
  console.log(`  ✅ Dados encontrados (últimos 7 dias):`);
  console.log(`     Gasto:      R$ ${gasto}`);
  console.log(`     Impressões: ${impressoes.toLocaleString("pt-BR")}`);
  console.log(`     Cliques:    ${cliques.toLocaleString("pt-BR")}`);
  console.log(`     Conversões: ${conversas}`);
}

// ─── 4. Testa listagem de campanhas ─────────────────────────────────────────

async function testCampaigns(accessToken) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  console.log(`\n📣 Listando campanhas ativas...`);

  const query = `
    SELECT campaign.id, campaign.name, campaign.status
    FROM campaign
    WHERE campaign.status = 'ENABLED'
    LIMIT 10
  `;

  const res = await axios.post(
    `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:search`,
    { query },
    {
      headers: {
        Authorization:     `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type":    "application/json",
      },
      timeout: 20000,
    }
  );

  const rows = res.data.results || [];

  if (rows.length === 0) {
    console.log("  ⚠️  Nenhuma campanha ENABLED encontrada");
    return;
  }

  console.log(`  ✅ ${rows.length} campanha(s) ativa(s):`);
  for (const row of rows) {
    const c = row.campaign || {};
    console.log(`     - [${c.id}] ${c.name} (${c.status})`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const accessToken = await getAccessToken();
    await testQuery(accessToken);
    await testCampaigns(accessToken);
    console.log("\n✅ DIAGNÓSTICO CONCLUÍDO — API funcionando!\n");
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.log("\n❌ ERRO:");
    console.log(JSON.stringify(detail, null, 2));

    // Dicas de erro comuns
    if (err.response?.status === 403) {
      console.log("\n💡 Dica: Erro 403 pode indicar:");
      console.log("   - Developer token em modo TESTE tentando acessar conta de produção");
      console.log("   - Token aprovado mas conta não vinculada ao projeto OAuth");
    }
    if (err.response?.status === 401) {
      console.log("\n💡 Dica: Erro 401 = credenciais inválidas (refresh token ou client secret errado)");
    }
    process.exit(1);
  }
})();
