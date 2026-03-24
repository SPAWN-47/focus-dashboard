/**
 * lib/google.js — Google Ads API helpers for Focus Dashboard
 *
 * Handles OAuth token exchange, GAQL queries and metric normalization.
 * All credentials are read from environment variables — never hardcoded.
 */

import axios from "axios";

// ─── DATE RANGES ──────────────────────────────────────────────────────────────

export const DATE_RANGES = {
  daily:   "YESTERDAY",
  weekly:  "LAST_7_DAYS",
  monthly: "LAST_30_DAYS",
};

// ─── ACCESS TOKEN CACHE ───────────────────────────────────────────────────────

let _tokenCache = null; // { accessToken, expiresAt }

/**
 * Exchanges the configured refresh_token for a short-lived access_token.
 * Result is cached in memory until 60s before expiry.
 */
export async function getGoogleAccessToken() {
  const now = Date.now();

  if (_tokenCache && now < _tokenCache.expiresAt) {
    return _tokenCache.accessToken;
  }

  const { GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN } = process.env;

  const params = new URLSearchParams({
    client_id:     GOOGLE_ADS_CLIENT_ID,
    client_secret: GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
    grant_type:    "refresh_token",
  });

  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, expires_in } = response.data;

  // Cache with 60s safety margin
  _tokenCache = {
    accessToken: access_token,
    expiresAt:   now + (expires_in - 60) * 1000,
  };

  return access_token;
}

// ─── GAQL QUERY ───────────────────────────────────────────────────────────────

/**
 * Executes a GAQL query against a Google Ads customer account.
 * @param {string} customerId - Google Ads customer ID (digits only, no dashes)
 * @param {string} query      - GAQL query string
 * @returns {Array} rows from the API response
 */
export async function queryGoogleAds(customerId, query) {
  const accessToken    = await getGoogleAccessToken();
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  // Normalize customer ID — remove dashes if present
  const cid = customerId.replace(/-/g, "");

  const response = await axios.post(
    `https://googleads.googleapis.com/v18/customers/${cid}/googleAds:search`,
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

  return response.data.results || [];
}

// ─── METRIC NORMALIZATION ─────────────────────────────────────────────────────

/**
 * Normalizes raw GAQL rows (aggregated account-level) into a unified metrics object.
 *
 * Google Ads quirks:
 *   - cost_micros / 1_000_000 = BRL spend
 *   - average_cpc and average_cpm are also in micros
 *   - ctr is already a decimal fraction (0.05 = 5%) — we multiply by 100
 *   - conversions maps to "conversas" (same field name used throughout the app)
 *
 * @param {Array} rows - results array from queryGoogleAds
 * @returns {{ gasto, impressoes, cliques, conversas, cpl, ctr, cpm, cpc }}
 */
export function computeGoogleMetrics(rows) {
  let costMicros   = 0;
  let impressoes   = 0;
  let cliques      = 0;
  let conversas    = 0;
  let ctrSum       = 0;
  let cpcMicros    = 0;
  let cpmMicros    = 0;
  let rowCount     = 0;

  for (const row of rows) {
    const m = row.metrics || {};
    costMicros += Number(m.costMicros   ?? m.cost_micros   ?? 0);
    impressoes += Number(m.impressions  ?? 0);
    cliques    += Number(m.clicks       ?? 0);
    conversas  += Number(m.conversions  ?? 0);
    ctrSum     += Number(m.ctr          ?? 0);
    cpcMicros  += Number(m.averageCpc   ?? m.average_cpc   ?? 0);
    cpmMicros  += Number(m.averageCpm   ?? m.average_cpm   ?? 0);
    rowCount++;
  }

  const gasto = costMicros / 1_000_000;

  // Average aggregated CTR across rows (already a fraction 0–1 in the API)
  const ctrRaw = rowCount > 0 ? ctrSum / rowCount : 0;
  const ctr    = ctrRaw * 100; // convert to percentage (e.g. 0.05 → 5.0)

  // average_cpc and average_cpm are in micros
  const cpc = rowCount > 0 ? (cpcMicros / rowCount) / 1_000_000 : 0;
  const cpm = rowCount > 0 ? (cpmMicros / rowCount) / 1_000_000 : 0;

  const cpl = conversas > 0 ? gasto / conversas : 0;

  return { gasto, impressoes, cliques, conversas, cpl, ctr, cpm, cpc };
}
