/**
 * lib/gmb.js — Google Business Profile (Meu Negócio) API helpers
 *
 * Uses OAuth2 refresh token to fetch:
 *   - Performance metrics (impressions, clicks, calls, directions)
 *   - Reviews (rating, count, recent reviews)
 *   - Location info
 *
 * Credentials via environment variables:
 *   GMB_CLIENT_ID, GMB_CLIENT_SECRET, GMB_REFRESH_TOKEN
 */

import axios from "axios";

// ─── TOKEN CACHE ─────────────────────────────────────────────────────────────

let _gmbTokenCache  = null; // { accessToken, expiresAt }
let _gmbAccountName = null; // "accounts/123456789" — cached after first call

/**
 * Exchanges the GMB refresh token for a short-lived access token.
 * Caches result in memory until 60s before expiry.
 */
export async function getGmbAccessToken() {
  const now = Date.now();

  if (_gmbTokenCache && now < _gmbTokenCache.expiresAt) {
    return _gmbTokenCache.accessToken;
  }

  const { GMB_CLIENT_ID, GMB_CLIENT_SECRET, GMB_REFRESH_TOKEN } = process.env;

  if (!GMB_CLIENT_ID || !GMB_CLIENT_SECRET || !GMB_REFRESH_TOKEN) {
    throw new Error("GMB credentials not configured (GMB_CLIENT_ID, GMB_CLIENT_SECRET, GMB_REFRESH_TOKEN)");
  }

  const params = new URLSearchParams({
    client_id:     GMB_CLIENT_ID,
    client_secret: GMB_CLIENT_SECRET,
    refresh_token: GMB_REFRESH_TOKEN,
    grant_type:    "refresh_token",
  });

  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, expires_in } = response.data;

  _gmbTokenCache = {
    accessToken: access_token,
    expiresAt:   now + (expires_in - 60) * 1000,
  };

  return access_token;
}

// ─── ACCOUNTS & LOCATIONS ────────────────────────────────────────────────────

/**
 * Returns the "accounts/{id}" name for the first GMB account accessible with
 * the current credentials. Result is cached in memory for the process lifetime.
 */
export async function getDefaultAccountName() {
  if (_gmbAccountName) return _gmbAccountName;
  const accounts = await getGmbAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error("Nenhuma conta Google Meu Negócio encontrada para as credenciais configuradas.");
  }
  _gmbAccountName = accounts[0].name; // e.g. "accounts/123456789"
  return _gmbAccountName;
}

/**
 * Resolves a gmb_location_id (bare numeric OR full "accounts/xxx/locations/yyy")
 * into two forms needed by different APIs:
 *   - locationId:   just the numeric string (for performance insights API)
 *   - locationName: full "accounts/{acctId}/locations/{locationId}" (for reviews API)
 */
export async function resolveLocationId(raw) {
  const trimmed = (raw || "").trim();

  // Full path already stored: "accounts/xxx/locations/yyy"
  const fullMatch = trimmed.match(/^(accounts\/\d+\/locations\/(\d+))$/);
  if (fullMatch) {
    return { locationId: fullMatch[2], locationName: fullMatch[1] };
  }

  // Bare numeric ID saved by admin panel
  if (/^\d+$/.test(trimmed)) {
    const accountName = await getDefaultAccountName();
    return {
      locationId:   trimmed,
      locationName: `${accountName}/locations/${trimmed}`,
    };
  }

  throw new Error(
    `gmb_location_id inválido: "${trimmed}". Use o ID numérico da localização ou o formato accounts/{id}/locations/{id}.`
  );
}

/**
 * Lists all Google Business accounts accessible with the current credentials.
 * Returns array of { name, accountName, type, ... }
 */
export async function getGmbAccounts() {
  const token = await getGmbAccessToken();

  const response = await axios.get(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    }
  );

  return response.data.accounts || [];
}

/**
 * Lists all locations for a given account.
 * @param {string} accountName - e.g. "accounts/123456789"
 * Returns array of { name, title, websiteUri, ... }
 */
export async function getGmbLocations(accountName) {
  const token = await getGmbAccessToken();

  const response = await axios.get(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        readMask: "name,title,websiteUri,phoneNumbers,storefrontAddress,regularHours,metadata,profile",
      },
      timeout: 15000,
    }
  );

  return response.data.locations || [];
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

/**
 * Fetches reviews for a location.
 * @param {string} locationRaw - bare numeric ID OR "accounts/xxx/locations/yyy"
 * @param {number} pageSize    - number of reviews to return (default 10)
 * Returns { reviews, averageRating, totalReviewCount }
 */
export async function getGmbReviews(locationRaw, pageSize = 10) {
  const token = await getGmbAccessToken();

  // Reviews API needs full "accounts/.../locations/..." path
  const trimmed = (locationRaw || "").trim();
  let locationName;

  if (trimmed.includes("accounts/")) {
    // Already a full path
    locationName = trimmed;
  } else if (/^\d+$/.test(trimmed)) {
    // Bare numeric ID — need account prefix from GMB accounts API
    const accountName = await getDefaultAccountName();
    locationName = `${accountName}/locations/${trimmed}`;
  } else {
    throw new Error(`gmb_location_id inválido: "${trimmed}".`);
  }

  const response = await axios.get(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { pageSize, orderBy: "updateTime desc" },
      timeout: 15000,
    }
  );

  const data = response.data;
  return {
    reviews:          data.reviews || [],
    averageRating:    data.averageRating || 0,
    totalReviewCount: data.totalReviewCount || 0,
  };
}

// ─── PERFORMANCE INSIGHTS ────────────────────────────────────────────────────

/**
 * Fetches multi-daily performance metrics for a location.
 * @param {string} locationRaw - bare numeric ID OR "accounts/xxx/locations/yyy"
 * @param {Date}   startDate
 * @param {Date}   endDate
 * Returns raw API response data
 *
 * NOTE: businessprofileperformance API only needs the numeric location ID —
 * no account prefix and no extra API calls needed.
 */
export async function getGmbInsights(locationRaw, startDate, endDate) {
  // Extract numeric ID without calling accounts API (avoids quota issues)
  const trimmed = (locationRaw || "").trim();
  let locationId;
  if (/^\d+$/.test(trimmed)) {
    locationId = trimmed;
  } else {
    const m = trimmed.match(/locations\/(\d+)$/);
    if (!m) throw new Error(`gmb_location_id inválido: "${trimmed}". Use o ID numérico (ex: 17414490206052773930).`);
    locationId = m[1];
  }

  const token = await getGmbAccessToken();

  const fmt = (d) => ({
    year:  d.getFullYear(),
    month: d.getMonth() + 1,
    day:   d.getDate(),
  });

  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "CALL_CLICKS",
    "WEBSITE_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS",
  ];

  // Build query string with repeated dailyMetrics params
  const params = new URLSearchParams({
    "dailyRange.startDate.year":  fmt(startDate).year,
    "dailyRange.startDate.month": fmt(startDate).month,
    "dailyRange.startDate.day":   fmt(startDate).day,
    "dailyRange.endDate.year":    fmt(endDate).year,
    "dailyRange.endDate.month":   fmt(endDate).month,
    "dailyRange.endDate.day":     fmt(endDate).day,
  });

  // Append each metric separately (repeated parameter)
  metrics.forEach(m => params.append("dailyMetrics", m));

  const response = await axios.get(
    `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
      timeout: 15000,
    }
  );

  return response.data.multiDailyMetricTimeSeries || [];
}

// ─── METRIC AGGREGATION ───────────────────────────────────────────────────────

/**
 * Aggregates raw performance time series into totals.
 * @param {Array} series - multiDailyMetricTimeSeries from API
 * Returns { impressoes, buscas, mapas, ligacoes, cliquessite, direcoes }
 */
export function computeGmbMetrics(series) {
  const totals = {
    BUSINESS_IMPRESSIONS_DESKTOP_MAPS:    0,
    BUSINESS_IMPRESSIONS_DESKTOP_SEARCH:  0,
    BUSINESS_IMPRESSIONS_MOBILE_MAPS:     0,
    BUSINESS_IMPRESSIONS_MOBILE_SEARCH:   0,
    CALL_CLICKS:                          0,
    WEBSITE_CLICKS:                       0,
    BUSINESS_DIRECTION_REQUESTS:          0,
  };

  for (const entry of series) {
    const metric = entry.dailyMetric;
    const points = entry.timeSeries?.datedValues || [];
    for (const pt of points) {
      totals[metric] = (totals[metric] || 0) + Number(pt.value || 0);
    }
  }

  return {
    impressoes: totals.BUSINESS_IMPRESSIONS_DESKTOP_MAPS
              + totals.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH
              + totals.BUSINESS_IMPRESSIONS_MOBILE_MAPS
              + totals.BUSINESS_IMPRESSIONS_MOBILE_SEARCH,
    buscas:     totals.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH
              + totals.BUSINESS_IMPRESSIONS_MOBILE_SEARCH,
    mapas:      totals.BUSINESS_IMPRESSIONS_DESKTOP_MAPS
              + totals.BUSINESS_IMPRESSIONS_MOBILE_MAPS,
    ligacoes:   totals.CALL_CLICKS,
    cliquessite: totals.WEBSITE_CLICKS,
    direcoes:   totals.BUSINESS_DIRECTION_REQUESTS,
  };
}

/**
 * Builds start/end date pair for a given period keyword.
 * @param {"daily"|"weekly"|"monthly"} period
 * Returns { startDate: Date, endDate: Date }
 */
export function getGmbDateRange(period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "daily") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return { startDate: d, endDate: d };
  }

  if (period === "weekly") {
    const end = new Date(today);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { startDate: start, endDate: end };
  }

  // monthly (default)
  const end = new Date(today);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { startDate: start, endDate: end };
}
