/**
 * server.js — Production server for Focus Dashboard
 *
 * Usage:
 *   npm run build          # build React app to dist/
 *   node server.js         # start production server
 *
 * Environment variables:
 *   PORT        Port to listen on (default: 3000)
 *   JWT_SECRET  Secret key for JWT signing (REQUIRED in production)
 *               Generate: openssl rand -hex 32
 */

import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import cron from "node-cron";
import { META_BASE, DATE_PRESETS, extractConversions, computeMetrics } from "./lib/meta.js";
import { DATE_RANGES as GOOGLE_DATE_RANGES, queryGoogleAds, computeGoogleMetrics } from "./lib/google.js";
import { getGmbAccessToken, getGmbAccounts, getGmbLocations, getGmbReviews, getGmbInsights, computeGmbMetrics, getGmbDateRange, resolveLocationId } from "./lib/gmb.js";

import {
  checkRateLimit,
  loadClients,
  loadUsers,
  saveClients,
  saveUsers,
  verifyPassword,
  signToken,
  verifyToken,
  hashPassword,
  initDb,
} from "./lib/auth.js";

import * as dbModule from "./lib/db.js";
import {
  migrateFromJson,
  seedClients,
  getCachedInsights,
  setCachedInsights,
  saveInsightHistory,
  logAnomaly,
  getAnomalyHistory,
  getLastCollectionTime,
  getClient,
  getPreviousPeriodMetrics,
  getRecentCplStats,
  getSchedules,
  saveSchedule,
  updateScheduleActive,
  deleteSchedule,
  markScheduleSent,
  getSchedulesDueToday,
  updateClientNotes,
  getAlertRules,
  saveAlertRule,
  updateAlertRuleActive,
  deleteAlertRule,
} from "./lib/db.js";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── APP SETUP ───────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (nginx) for correct client IPs
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://graph.facebook.com", "https://googleads.googleapis.com", "https://oauth2.googleapis.com", "https://mybusiness.googleapis.com", "https://mybusinessreviews.googleapis.com", "https://mybusinessaccountmanagement.googleapis.com", "https://mybusinessbusinessinformation.googleapis.com", "https://businessprofileperformance.googleapis.com"],
      },
    },
  })
);

// Parse JSON body
app.use(express.json({ limit: "10kb" }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// Rate limit on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: "Muitas tentativas. Aguarde 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function requireAuth(req, res) {
  const user = verifyToken(req.headers["authorization"]);
  if (!user) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = verifyToken(req.headers["authorization"]);
  if (!user) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Acesso negado" });
    return null;
  }
  return user;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const ip = req.ip;
  if (!checkRateLimit(ip)) {
    return res
      .status(429)
      .json({ error: "Muitas tentativas. Aguarde 15 minutos." });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Usuário e senha são obrigatórios" });
  }

  const users = loadUsers();
  const user = users[username];

  if (!user || !(await verifyPassword(password, user.password))) {
    return res.status(401).json({ error: "Usuário ou senha incorretos" });
  }

  const payload = {
    username,
    name: user.name,
    role: user.role,
    clientId: user.clientId || null,
  };

  return res.json({ token: signToken(payload), user: payload });
});

// ─── CLIENTS (public) ────────────────────────────────────────────────────────

app.get("/api/clients", (req, res) => {
  const clients = loadClients();
  const list = Object.entries(clients).map(([id, c]) => ({
    id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
  }));
  res.json(list);
});

// ─── CONFIG (admin only) ─────────────────────────────────────────────────────

app.get("/api/config/clients", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const clients = loadClients();
  res.json(Object.entries(clients).map(([id, c]) => ({ id, ...c })));
});

app.post("/api/config/clients", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const {
    id, name, emoji, color, token: apiToken, accountId,
    ticket_medio, target_cpl_max, target_conversas, target_spend,
    google_ads_customer_id, gmb_location_id,
  } = req.body || {};
  if (!id || !name || !apiToken || !accountId) {
    return res
      .status(400)
      .json({ error: "id, name, token e accountId são obrigatórios" });
  }

  const clients = loadClients();
  if (clients[id]) {
    return res.status(409).json({ error: "ID já existe" });
  }

  clients[id] = {
    name,
    emoji: emoji || "🏢",
    color: color || "#6B7280",
    token: apiToken,
    accountId,
    ticket_medio: parseFloat(ticket_medio) || 0,
    target_cpl_max: parseFloat(target_cpl_max) || 0,
    target_conversas: parseInt(target_conversas) || 0,
    target_spend: parseFloat(target_spend) || 0,
    google_ads_customer_id: google_ads_customer_id || null,
    gmb_location_id: gmb_location_id || null,
  };
  saveClients(clients);

  // Auto-create user with hashed password
  const users = loadUsers();
  const username = id.replace(/-/g, "");
  const plainPassword = username;
  if (!users[username]) {
    users[username] = {
      name,
      password: await hashPassword(plainPassword),
      role: "client",
      clientId: id,
    };
    saveUsers(users);
  }

  res.json({ success: true, id, username, password: plainPassword });
});

app.put("/api/config/clients/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const clients = loadClients();
  if (!clients[req.params.id]) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }
  const updated = { ...clients[req.params.id], ...req.body };
  delete updated.id;
  clients[req.params.id] = updated;
  saveClients(clients);
  res.json({ success: true });
});

app.delete("/api/config/clients/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const clients = loadClients();
  if (!clients[req.params.id]) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }
  dbModule.deleteClient(req.params.id);
  res.json({ success: true });
});

app.patch("/api/config/clients/:id/notes", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { notes } = req.body || {};
  updateClientNotes(req.params.id, notes || "");
  res.json({ ok: true });
});

app.post("/api/config/test-connection", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { token: apiToken, accountId } = req.body || {};
  if (!apiToken || !accountId) {
    return res
      .status(400)
      .json({ error: "token e accountId são obrigatórios" });
  }
  try {
    const r = await axios.get(`${META_BASE}/${accountId}/insights`, {
      params: {
        fields: "spend",
        date_preset: "yesterday",
        level: "account",
        access_token: apiToken,
      },
    });
    res.json({ success: true, data: r.data.data?.[0] || null });
  } catch (err) {
    const metaErr = err.response?.data?.error;
    res
      .status(400)
      .json({ success: false, error: metaErr?.message || err.message });
  }
});

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────

app.get("/api/insights", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const { client: clientId, period } = req.query;

  // Clients can only access their own data
  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const datePreset = DATE_PRESETS[period];

  if (!clientConfig || !datePreset) {
    return res.status(400).json({ error: "Invalid client or period" });
  }

  // Serve from cache if available
  const cached = getCachedInsights(clientId, period);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const response = await axios.get(
      `${META_BASE}/${clientConfig.accountId}/insights`,
      {
        params: {
          fields:
            "spend,impressions,clicks,reach,actions,cost_per_action_type",
          date_preset: datePreset,
          level: "account",
          access_token: clientConfig.token,
        },
      }
    );

    const raw = response.data.data?.[0] || null;
    if (!raw) {
      return res.json({ hasData: false, client: clientConfig.name, period });
    }

    const { gasto, impressoes, cliques, alcance, conversas, convType, cpl, ctr, cpc, cpm, frequencia } = computeMetrics(raw);

    // ROAS requires ticket_medio configured on client
    const clientData = getClient(clientId);
    const roas =
      clientData?.ticket_medio > 0 && conversas > 0 && gasto > 0
        ? (conversas * clientData.ticket_medio) / gasto
        : null;

    const targets = {
      ticket_medio: clientData?.ticket_medio || 0,
      target_conversas: clientData?.target_conversas || 0,
      target_cpl_max: clientData?.target_cpl_max || 0,
      target_spend: clientData?.target_spend || 0,
    };

    // Period-over-period delta from history
    const prev = getPreviousPeriodMetrics(clientId, period);
    const delta = prev
      ? {
          gasto: prev.gasto > 0 ? ((gasto - prev.gasto) / prev.gasto) * 100 : null,
          impressoes: prev.impressoes > 0 ? ((impressoes - prev.impressoes) / prev.impressoes) * 100 : null,
          cliques: prev.cliques > 0 ? ((cliques - prev.cliques) / prev.cliques) * 100 : null,
          conversas: prev.conversas > 0 ? ((conversas - prev.conversas) / prev.conversas) * 100 : null,
          cpl: prev.cpl > 0 ? ((cpl - prev.cpl) / prev.cpl) * 100 : null,
          cpm: prev.cpm > 0 ? ((cpm - prev.cpm) / prev.cpm) * 100 : null,
        }
      : null;

    const payload = {
      hasData: true,
      client: clientConfig.name,
      clientId,
      period,
      convType,
      targets,
      delta,
      metrics: { gasto, impressoes, cliques, alcance, conversas, cpl, ctr, cpc, cpm, frequencia, roas },
    };
    setCachedInsights(clientId, period, payload);
    res.json(payload);
  } catch (err) {
    const metaErr = err.response?.data?.error;
    res.status(500).json({ error: metaErr?.message || err.message });
  }
});

// ─── TREND ────────────────────────────────────────────────────────────────────

app.get("/api/trend", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const { client: clientId } = req.query;

  // Clients can only access their own data
  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];

  if (!clientConfig) {
    return res.status(400).json({ error: "Invalid client" });
  }

  try {
    const response = await axios.get(
      `${META_BASE}/${clientConfig.accountId}/insights`,
      {
        params: {
          fields: "spend,impressions,clicks,reach,actions",
          date_preset: "last_30d",
          level: "account",
          time_increment: 1,
          access_token: clientConfig.token,
        },
      }
    );

    const days = (response.data.data || []).map((d) => {
      const m = computeMetrics(d);
      saveInsightHistory(clientId, d.date_start, m);
      return { date: d.date_start, gasto: m.gasto, impressoes: m.impressoes, cliques: m.cliques, alcance: m.alcance, conversas: m.conversas };
    });

    res.json({ hasData: days.length > 0, days });
  } catch (err) {
    const metaErr = err.response?.data?.error;
    res.status(500).json({ error: metaErr?.message || err.message });
  }
});

// ─── ALERT RULES endpoints ───────────────────────────────────────────────────

app.get("/api/alert-rules", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { client } = req.query;
  res.json(getAlertRules(client || null));
});

app.post("/api/alert-rules", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { clientId, metric, operator, threshold, severity } = req.body || {};
  if (!clientId || !metric || !operator || threshold === undefined) {
    return res.status(400).json({ error: "clientId, metric, operator e threshold são obrigatórios" });
  }
  const id = saveAlertRule({ clientId, metric, operator, threshold, severity: severity || "warning" });
  res.json({ id });
});

app.patch("/api/alert-rules/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { active } = req.body;
  updateAlertRuleActive(Number(req.params.id), active);
  res.json({ ok: true });
});

app.delete("/api/alert-rules/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  deleteAlertRule(Number(req.params.id));
  res.json({ ok: true });
});

// Evaluate custom alert rules against live metrics
function evaluateCustomRules(clientId, metrics, delta, base) {
  const rules = getAlertRules(clientId).filter((r) => r.active);
  const results = [];

  const METRIC_LABELS = {
    cpl: "CPL", conversas: "Conversas", gasto: "Investimento",
    ctr: "CTR", cpm: "CPM", conversas_delta: "Queda de conversas",
  };

  for (const rule of rules) {
    let value;
    if (rule.metric === "conversas_delta") {
      value = delta?.conversas ?? null;
    } else {
      value = metrics[rule.metric] ?? null;
    }
    if (value === null) continue;

    const passes = rule.operator === "gt" ? value > rule.threshold : value < rule.threshold;
    if (!passes) continue;

    const label = METRIC_LABELS[rule.metric] || rule.metric;
    const sign = rule.operator === "gt" ? ">" : "<";
    const fmt = ["cpl", "gasto", "cpm"].includes(rule.metric)
      ? `R$ ${value.toFixed(2)}`
      : rule.metric === "ctr" || rule.metric === "conversas_delta"
      ? `${value.toFixed(1)}%`
      : value;
    const fmtT = ["cpl", "gasto", "cpm"].includes(rule.metric)
      ? `R$ ${rule.threshold.toFixed(2)}`
      : rule.metric === "ctr" || rule.metric === "conversas_delta"
      ? `${rule.threshold}%`
      : rule.threshold;

    results.push({
      ...base,
      type: `custom_${rule.metric}`,
      severity: rule.severity,
      message: `${label} ${fmt} ${sign} ${fmtT} (regra personalizada)`,
      ruleId: rule.id,
    });
  }
  return results;
}

// ─── ANOMALIES (admin only) ───────────────────────────────────────────────────

app.get("/api/anomalies", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const clients = loadClients();
  const entries = Object.entries(clients);
  if (entries.length === 0) return res.json([]);

  const results = await Promise.allSettled(
    entries.map(async ([id, c]) => {
      const base = { clientId: id, name: c.name, emoji: c.emoji, color: c.color };
      try {
        const r = await axios.get(`${META_BASE}/${c.accountId}/insights`, {
          params: {
            fields: "spend,impressions,actions",
            date_preset: "yesterday",
            level: "account",
            access_token: c.token,
          },
          timeout: 10000,
        });
        const raw = r.data.data?.[0] || null;
        if (!raw) {
          return [{ ...base, type: "parada", severity: "critical", message: "Sem atividade registrada ontem" }];
        }
        const spend = parseFloat(raw.spend || 0);
        const impressions = parseInt(raw.impressions || 0);
        const { value: conversas } = extractConversions(raw.actions || []);
        const anomalies = [];
        const liveMetrics = computeMetrics(raw);
        const prev = getPreviousPeriodMetrics(id, "daily");
        const liveDelta = prev ? {
          conversas: prev.conversas > 0 ? ((liveMetrics.conversas - prev.conversas) / prev.conversas) * 100 : null,
          cpl: prev.cpl > 0 ? ((liveMetrics.cpl - prev.cpl) / prev.cpl) * 100 : null,
        } : {};

        // Use target_spend to derive a spend threshold; fallback to R$15
        const spendThreshold = c.target_spend > 0 ? c.target_spend * 0.005 : 15;

        if (spend === 0 && impressions === 0) {
          const a = { ...base, type: "parada", severity: "critical", message: "Campanha sem atividade ontem" };
          anomalies.push(a);
          logAnomaly(id, a.type, a.severity, a.message);
        } else if (spend > spendThreshold && conversas === 0) {
          const msg = `R$ ${spend.toFixed(2)} investidos sem conversas`;
          const a = { ...base, type: "sem_conversas", severity: "warning", message: msg };
          anomalies.push(a);
          logAnomaly(id, a.type, a.severity, a.message);
        }

        // CPL above configured target
        if (c.target_cpl_max > 0 && conversas > 0) {
          const cpl = spend / conversas;
          if (cpl > c.target_cpl_max) {
            const msg = `CPL R$ ${cpl.toFixed(2)} acima do target R$ ${c.target_cpl_max.toFixed(2)}`;
            anomalies.push({ ...base, type: "cpl_alto", severity: "warning", message: msg });
            logAnomaly(id, "cpl_alto", "warning", msg);
          }
        }

        // Statistical anomaly: CPL > mean + 2 stddev over last 14 days
        if (conversas > 0 && anomalies.every((a) => a.type !== "cpl_alto")) {
          const cpl = spend / conversas;
          const stats = getRecentCplStats(id, 14);
          if (stats && stats.stddev > 0 && cpl > stats.mean + 2 * stats.stddev) {
            const msg = `CPL R$ ${cpl.toFixed(2)} é +2σ acima da média histórica (R$ ${stats.mean.toFixed(2)})`;
            anomalies.push({ ...base, type: "cpl_anomalia", severity: "warning", message: msg });
            logAnomaly(id, "cpl_anomalia", "warning", msg);
          }
        }

        // Custom rules evaluation
        anomalies.push(...evaluateCustomRules(id, liveMetrics, liveDelta, base));

        return anomalies;
      } catch (err) {
        const code = err.response?.data?.error?.code;
        if (code === 190 || code === 100) {
          logAnomaly(id, "token", "critical", "Token expirado ou inválido");
          return [{ ...base, type: "token", severity: "critical", message: "Token expirado ou inválido" }];
        }
        return [{ ...base, type: "erro", severity: "warning", message: "Não foi possível buscar dados" }];
      }
    })
  );

  const flat = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
  res.json(flat);
});

// ─── CAMPAIGNS (per-campaign breakdown) ──────────────────────────────────────

app.get("/api/campaigns", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const { client: clientId, period } = req.query;
  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const datePreset = DATE_PRESETS[period] || "yesterday";

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  try {
    const response = await axios.get(
      `${META_BASE}/${clientConfig.accountId}/insights`,
      {
        params: {
          fields: "campaign_name,spend,impressions,clicks,reach,actions",
          date_preset: datePreset,
          level: "campaign",
          access_token: clientConfig.token,
        },
        timeout: 15000,
      }
    );

    const campaigns = (response.data.data || []).map((d) => {
      const m = computeMetrics(d);
      return {
        name: d.campaign_name || "—",
        gasto: m.gasto,
        impressoes: m.impressoes,
        cliques: m.cliques,
        conversas: m.conversas,
        cpl: m.cpl,
        ctr: m.ctr,
        cpm: m.cpm,
      };
    });

    // Sort by spend descending
    campaigns.sort((a, b) => b.gasto - a.gasto);
    res.json({ hasData: campaigns.length > 0, campaigns });
  } catch (err) {
    const metaErr = err.response?.data?.error;
    res.status(500).json({ error: metaErr?.message || err.message });
  }
});

// ─── CREATIVES (top performing ads) ──────────────────────────────────────────

app.get("/api/creatives", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const { client: clientId, period } = req.query;
  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const datePreset = DATE_PRESETS[period] || "yesterday";

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  try {
    const response = await axios.get(
      `${META_BASE}/${clientConfig.accountId}/insights`,
      {
        params: {
          fields: "ad_id,ad_name,spend,impressions,clicks,reach,actions",
          date_preset: datePreset,
          level: "ad",
          access_token: clientConfig.token,
          limit: 50,
        },
        timeout: 15000,
      }
    );

    const ads = (response.data.data || [])
      .filter((d) => parseFloat(d.spend || 0) > 0)
      .map((d) => {
        const m = computeMetrics(d);
        return {
          adId: d.ad_id,
          name: d.ad_name || "—",
          gasto: m.gasto,
          impressoes: m.impressoes,
          cliques: m.cliques,
          conversas: m.conversas,
          cpl: m.cpl,
          ctr: m.ctr,
          cpm: m.cpm,
          thumbnail: null,
          creativeTitle: null,
        };
      });

    ads.sort((a, b) => b.conversas - a.conversas || b.gasto - a.gasto);
    const top = ads.slice(0, 10);

    // Enrich with creative thumbnails (parallel, best-effort)
    await Promise.allSettled(
      top.map(async (ad) => {
        try {
          const r = await axios.get(`${META_BASE}/${ad.adId}`, {
            params: {
              fields: "creative{thumbnail_url,title,body}",
              access_token: clientConfig.token,
            },
            timeout: 5000,
          });
          const creative = r.data.creative;
          if (creative) {
            ad.thumbnail = creative.thumbnail_url || null;
            ad.creativeTitle = creative.title || creative.body?.slice(0, 60) || null;
          }
        } catch {
          // silent — thumbnail is best-effort
        }
      })
    );

    res.json({ hasData: top.length > 0, ads: top });
  } catch (err) {
    const metaErr = err.response?.data?.error;
    res.status(500).json({ error: metaErr?.message || err.message });
  }
});

// ─── GOOGLE ADS — INSIGHTS ────────────────────────────────────────────────────

app.get("/api/google/insights", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  // If Google Ads is not configured at all, return gracefully
  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId, period } = req.query;

  // Clients can only access their own data
  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const dateRange = GOOGLE_DATE_RANGES[period];

  if (!clientConfig || !dateRange) {
    return res.status(400).json({ error: "Invalid client or period" });
  }

  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  // Serve from cache if available (key prefixed with google_ to avoid collision)
  const cacheKey = `google_${clientId}`;
  const cached = getCachedInsights(cacheKey, period);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const gaql = `
      SELECT metrics.cost_micros, metrics.impressions, metrics.clicks,
             metrics.conversions, metrics.ctr, metrics.average_cpc,
             metrics.average_cpm, metrics.search_impression_share
      FROM customer
      WHERE segments.date DURING ${dateRange}
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, gaql);

    if (!rows || rows.length === 0) {
      return res.json({ configured: true, hasData: false, client: clientConfig.name, period });
    }

    const { gasto, impressoes, cliques, conversas, cpl, ctr, cpm, cpc, impressionShare } = computeGoogleMetrics(rows);

    const clientData = getClient(clientId);
    const targets = {
      ticket_medio:      clientData?.ticket_medio      || 0,
      target_conversas:  clientData?.target_conversas  || 0,
      target_cpl_max:    clientData?.target_cpl_max    || 0,
      target_spend:      clientData?.target_spend      || 0,
    };

    // ROAS — only when ticket_medio is configured
    const roas = targets.ticket_medio > 0 && gasto > 0
      ? (conversas * targets.ticket_medio) / gasto
      : null;

    // Period-over-period delta via a second GAQL query for the previous window
    let delta = null;
    try {
      const prevRange = getGooglePrevDateRange(period);
      const prevGaql = `
        SELECT metrics.cost_micros, metrics.impressions, metrics.clicks,
               metrics.conversions, metrics.ctr, metrics.average_cpc,
               metrics.average_cpm, metrics.search_impression_share
        FROM customer
        WHERE segments.date ${prevRange}
      `;
      const prevRows = await queryGoogleAds(clientConfig.google_ads_customer_id, prevGaql);
      if (prevRows && prevRows.length > 0) {
        const prev = computeGoogleMetrics(prevRows);
        delta = {
          gasto:      prev.gasto      > 0 ? ((gasto      - prev.gasto)      / prev.gasto)      * 100 : null,
          impressoes: prev.impressoes > 0 ? ((impressoes - prev.impressoes) / prev.impressoes) * 100 : null,
          cliques:    prev.cliques    > 0 ? ((cliques    - prev.cliques)    / prev.cliques)    * 100 : null,
          conversas:  prev.conversas  > 0 ? ((conversas  - prev.conversas)  / prev.conversas)  * 100 : null,
          cpl:        prev.cpl        > 0 ? ((cpl        - prev.cpl)        / prev.cpl)        * 100 : null,
          roas:       prev.roas       > 0 ? ((roas       - prev.roas)       / prev.roas)       * 100 : null,
        };
      }
    } catch (deltaErr) {
      console.warn("[google/insights] delta query failed:", deltaErr.message);
    }

    const payload = {
      configured: true,
      hasData:    true,
      client:     clientConfig.name,
      clientId,
      period,
      targets,
      delta,
      metrics:    { gasto, impressoes, cliques, conversas, cpl, ctr, cpm, cpc, impressionShare, roas },
    };

    setCachedInsights(cacheKey, period, payload);

    // Anomaly detection — same rules as Meta (runs only for daily period to avoid false positives)
    if (period === "daily") {
      try {
        const spendThreshold = targets.target_spend > 0 ? targets.target_spend * 0.005 : 15;
        if (gasto === 0 && impressoes === 0) {
          logAnomaly(clientId, "google_parada", "critical", "Google Ads sem atividade ontem");
        } else if (gasto > spendThreshold && conversas === 0) {
          logAnomaly(clientId, "google_sem_conversas", "warning", `Google Ads: R$ ${gasto.toFixed(2)} investidos sem conversões`);
        }
        if (targets.target_cpl_max > 0 && cpl > 0 && cpl > targets.target_cpl_max) {
          logAnomaly(clientId, "google_cpl_alto", "warning", `Google Ads CPL R$ ${cpl.toFixed(2)} acima do target R$ ${targets.target_cpl_max.toFixed(2)}`);
        }
      } catch (anomalyErr) {
        console.warn("[google/insights] anomaly check failed:", anomalyErr.message);
      }
    }

    res.json(payload);
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/insights]", googleErr);
    res.status(500).json({ error: googleErr });
  }
});

// ─── GOOGLE ADS — PREVIOUS PERIOD HELPER ─────────────────────────────────────

function getGooglePrevDateRange(period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d) => d.toISOString().split("T")[0];

  if (period === "daily") {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    const s = fmt(d);
    return `BETWEEN '${s}' AND '${s}'`;
  } else if (period === "weekly") {
    const end = new Date(today);
    end.setDate(end.getDate() - 8);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return `BETWEEN '${fmt(start)}' AND '${fmt(end)}'`;
  } else {
    // monthly — previous 30-day window
    const end = new Date(today);
    end.setDate(end.getDate() - 31);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return `BETWEEN '${fmt(start)}' AND '${fmt(end)}'`;
  }
}

// ─── GOOGLE ADS — TREND ───────────────────────────────────────────────────────

app.get("/api/google/trend", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId } = req.query;

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  const trendCacheKey = `google_trend_${clientId}`;
  const cachedTrend = getCachedInsights(trendCacheKey, "monthly");
  if (cachedTrend) return res.json({ ...cachedTrend, fromCache: true });

  try {
    const gaql = `
      SELECT segments.date, metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY segments.date ASC
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, gaql);

    const days = (rows || []).map((row) => {
      const m = row.metrics   || {};
      const s = row.segments  || {};
      return {
        date:       s.date,
        gasto:      Number(m.costMicros  ?? m.cost_micros  ?? 0) / 1_000_000,
        impressoes: Number(m.impressions ?? 0),
        cliques:    Number(m.clicks      ?? 0),
        conversas:  Number(m.conversions ?? 0),
      };
    });

    const trendPayload = { configured: true, hasData: days.length > 0, days };
    setCachedInsights(trendCacheKey, "monthly", trendPayload);
    res.json(trendPayload);
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/trend]", googleErr);
    res.status(500).json({ error: googleErr });
  }
});

// ─── GOOGLE ADS — CAMPAIGNS ───────────────────────────────────────────────────

app.get("/api/google/campaigns", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId, period } = req.query;

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const dateRange = GOOGLE_DATE_RANGES[period] || GOOGLE_DATE_RANGES.monthly;

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  try {
    const gaql = `
      SELECT campaign.name, campaign.status, metrics.cost_micros,
             metrics.impressions, metrics.clicks, metrics.conversions,
             metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING ${dateRange}
        AND metrics.cost_micros > 0
      ORDER BY metrics.cost_micros DESC
      LIMIT 20
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, gaql);

    const campaigns = (rows || []).map((row) => {
      const m  = row.metrics  || {};
      const c  = row.campaign || {};
      const costMicros = Number(m.costMicros  ?? m.cost_micros  ?? 0);
      const cpcMicros  = Number(m.averageCpc  ?? m.average_cpc  ?? 0);
      const ctrRaw     = Number(m.ctr         ?? 0);
      const impressoes = Number(m.impressions ?? 0);
      const cliques    = Number(m.clicks      ?? 0);
      const conversas  = Number(m.conversions ?? 0);
      const gasto      = costMicros / 1_000_000;
      const cpc        = cpcMicros  / 1_000_000;
      const ctr        = ctrRaw * 100;
      const cpl        = conversas > 0 ? gasto / conversas : null;

      return {
        name:      c.name           || "—",
        status:    c.status         || "UNKNOWN",
        gasto,
        impressoes,
        cliques,
        conversas,
        ctr,
        cpc,
        cpl,
      };
    });

    res.json({ configured: true, hasData: campaigns.length > 0, campaigns });
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/campaigns]", googleErr);
    res.status(500).json({ error: googleErr });
  }
});

// ─── GOOGLE ADS — AD GROUPS ────────────────────────────────────────────────────

app.get("/api/google/adgroups", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId, period } = req.query;

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const dateRange = GOOGLE_DATE_RANGES[period] || GOOGLE_DATE_RANGES.monthly;

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  try {
    const gaql = `
      SELECT campaign.name,
             ad_group.name, ad_group.status,
             ad_group.cpc_bid_micros,
             metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions,
             metrics.ctr, metrics.average_cpc,
             ad_group_criterion.quality_info.quality_score,
             ad_group_criterion.quality_info.search_predicted_ctr,
             ad_group_criterion.quality_info.creative_quality_score,
             ad_group_criterion.quality_info.post_click_quality_score
      FROM ad_group_criterion
      WHERE segments.date DURING ${dateRange}
        AND ad_group_criterion.type = KEYWORD
        AND ad_group_criterion.status != REMOVED
        AND metrics.impressions > 0
      ORDER BY metrics.clicks DESC
      LIMIT 50
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, gaql);

    // Aggregate per ad group (multiple keyword rows per group)
    const groupMap = new Map();
    for (const row of rows || []) {
      const ag  = row.adGroup   || row.ad_group   || {};
      const cam = row.campaign  || {};
      const m   = row.metrics   || {};
      const crit = row.adGroupCriterion || row.ad_group_criterion || {};
      const qi  = crit.qualityInfo || crit.quality_info || {};

      const key = ag.name || "—";
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          campaign:    cam.name  || "—",
          name:        ag.name   || "—",
          status:      ag.status || "UNKNOWN",
          costMicros:  0, impressoes: 0, cliques: 0, conversas: 0,
          ctrSum: 0, cpcMicros: 0, rowCount: 0,
          qualityScore: Number(qi.qualityScore ?? qi.quality_score ?? 0) || null,
          predCtr:      qi.searchPredictedCtr   ?? qi.search_predicted_ctr   ?? null,
          adRelevance:  qi.creativeQualityScore  ?? qi.creative_quality_score  ?? null,
          landingPage:  qi.postClickQualityScore ?? qi.post_click_quality_score ?? null,
        });
      }
      const g = groupMap.get(key);
      g.costMicros  += Number(m.costMicros  ?? m.cost_micros  ?? 0);
      g.impressoes  += Number(m.impressions ?? 0);
      g.cliques     += Number(m.clicks      ?? 0);
      g.conversas   += Number(m.conversions ?? 0);
      g.ctrSum      += Number(m.ctr         ?? 0);
      g.cpcMicros   += Number(m.averageCpc  ?? m.average_cpc  ?? 0);
      g.rowCount++;
    }

    const adGroups = Array.from(groupMap.values()).map((g) => {
      const gasto = g.costMicros / 1_000_000;
      const cpc   = g.rowCount > 0 ? (g.cpcMicros / g.rowCount) / 1_000_000 : 0;
      const ctr   = g.rowCount > 0 ? (g.ctrSum    / g.rowCount) * 100        : 0;
      const cpl   = g.conversas > 0 ? gasto / g.conversas : null;
      return {
        campaign:    g.campaign,
        name:        g.name,
        status:      g.status,
        gasto, impressoes: g.impressoes, cliques: g.cliques,
        conversas: g.conversas, ctr, cpc, cpl,
        qualityScore: g.qualityScore,
        predCtr:      g.predCtr,
        adRelevance:  g.adRelevance,
        landingPage:  g.landingPage,
      };
    });

    res.json({ configured: true, hasData: adGroups.length > 0, adGroups });
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/adgroups]", googleErr);
    res.status(500).json({ error: googleErr });
  }
});

// ─── GOOGLE ADS — DEVICE BREAKDOWN ────────────────────────────────────────────

app.get("/api/google/devices", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId, period } = req.query;

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const dateRange = GOOGLE_DATE_RANGES[period] || GOOGLE_DATE_RANGES.monthly;

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  try {
    const gaql = `
      SELECT segments.device,
             metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions,
             metrics.ctr, metrics.average_cpc
      FROM customer
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, gaql);

    const DEVICE_LABELS = {
      MOBILE:  { label: "Mobile",  emoji: "📱", color: "#4285F4" },
      DESKTOP: { label: "Desktop", emoji: "💻", color: "#10b981" },
      TABLET:  { label: "Tablet",  emoji: "⬜", color: "#f97316" },
      OTHER:   { label: "Outros",  emoji: "📡", color: "#8b5cf6" },
    };

    const devices = (rows || []).map((row) => {
      const m  = row.metrics  || {};
      const s  = row.segments || {};
      const deviceKey = (s.device || "OTHER").toUpperCase();
      const info = DEVICE_LABELS[deviceKey] || DEVICE_LABELS.OTHER;
      const costMicros = Number(m.costMicros  ?? m.cost_micros  ?? 0);
      const cpcMicros  = Number(m.averageCpc  ?? m.average_cpc  ?? 0);
      const gasto      = costMicros / 1_000_000;
      const cpc        = cpcMicros  / 1_000_000;
      const ctr        = Number(m.ctr ?? 0) * 100;
      const cliques    = Number(m.clicks      ?? 0);
      const impressoes = Number(m.impressions ?? 0);
      const conversas  = Number(m.conversions ?? 0);
      return { device: deviceKey, label: info.label, emoji: info.emoji, color: info.color, gasto, impressoes, cliques, conversas, ctr, cpc };
    });

    // Compute totals for share % calculation
    const totalCliques = devices.reduce((s, d) => s + d.cliques, 0);
    const totalGasto   = devices.reduce((s, d) => s + d.gasto,   0);
    const result = devices.map((d) => ({
      ...d,
      shareCliques: totalCliques > 0 ? (d.cliques / totalCliques) * 100 : 0,
      shareGasto:   totalGasto   > 0 ? (d.gasto   / totalGasto)   * 100 : 0,
    }));

    res.json({ configured: true, hasData: result.length > 0, devices: result });
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/devices]", googleErr);
    res.status(500).json({ error: googleErr });
  }
});

// ─── GOOGLE ADS — ADS / RSA COPY ──────────────────────────────────────────────

app.get("/api/google/ads", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId, period } = req.query;

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const dateRange = GOOGLE_DATE_RANGES[period] || GOOGLE_DATE_RANGES.monthly;

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  try {
    const gaql = `
      SELECT campaign.name,
             ad_group.name,
             ad_group_ad.ad.id,
             ad_group_ad.ad.type,
             ad_group_ad.status,
             ad_group_ad.ad.responsive_search_ad.headlines,
             ad_group_ad.ad.responsive_search_ad.descriptions,
             ad_group_ad.ad.expanded_text_ad.headline_part1,
             ad_group_ad.ad.expanded_text_ad.headline_part2,
             ad_group_ad.ad.expanded_text_ad.description,
             ad_group_ad.ad.final_urls,
             metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions,
             metrics.ctr, metrics.average_cpc
      FROM ad_group_ad
      WHERE segments.date DURING ${dateRange}
        AND ad_group_ad.status != REMOVED
        AND metrics.impressions > 0
      ORDER BY metrics.clicks DESC
      LIMIT 20
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, gaql);

    const ads = (rows || []).map((row, i) => {
      const m   = row.metrics     || {};
      const aga = row.adGroupAd   || row.ad_group_ad || {};
      const ad  = aga.ad          || {};
      const cam = row.campaign    || {};
      const ag  = row.adGroup     || row.ad_group    || {};

      const costMicros = Number(m.costMicros ?? m.cost_micros ?? 0);
      const cpcMicros  = Number(m.averageCpc ?? m.average_cpc ?? 0);
      const gasto      = costMicros / 1_000_000;
      const cpc        = cpcMicros  / 1_000_000;
      const ctr        = Number(m.ctr ?? 0) * 100;
      const cliques    = Number(m.clicks      ?? 0);
      const impressoes = Number(m.impressions ?? 0);
      const conversas  = Number(m.conversions ?? 0);

      // Extract headlines/descriptions depending on ad type
      const rsa = ad.responsiveSearchAd   || ad.responsive_search_ad   || {};
      const eta = ad.expandedTextAd       || ad.expanded_text_ad       || {};

      const headlines = (rsa.headlines || [])
        .map((h) => h.text || h)
        .filter(Boolean)
        .slice(0, 3);

      const descriptions = (rsa.descriptions || [])
        .map((d) => d.text || d)
        .filter(Boolean)
        .slice(0, 2);

      // ETA fallback
      if (headlines.length === 0 && eta.headlinePart1) {
        headlines.push(eta.headlinePart1 ?? eta.headline_part1);
        if (eta.headlinePart2 ?? eta.headline_part2) headlines.push(eta.headlinePart2 ?? eta.headline_part2);
      }
      if (descriptions.length === 0 && (eta.description || eta.descriptionPart1)) {
        descriptions.push(eta.description || eta.descriptionPart1 || eta.description_part1 || "");
      }

      const finalUrl = (ad.finalUrls ?? ad.final_urls ?? [])[0] || null;

      return {
        id:           ad.id || String(i),
        type:         ad.type || aga.adType || "UNKNOWN",
        status:       aga.status || "UNKNOWN",
        campaign:     cam.name || "—",
        adGroup:      ag.name  || "—",
        headlines,
        descriptions,
        finalUrl,
        gasto, impressoes, cliques, conversas, ctr, cpc,
      };
    });

    res.json({ configured: true, hasData: ads.length > 0, ads });
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/ads]", googleErr);
    res.status(500).json({ error: googleErr });
  }
});

// ─── GOOGLE ADS — SEARCH TERMS ─────────────────────────────────────────────────

app.get("/api/google/keywords", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId, period } = req.query;

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  const dateRange = GOOGLE_DATE_RANGES[period] || GOOGLE_DATE_RANGES.monthly;

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });

  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  try {
    const gaql = `
      SELECT search_term_view.search_term,
             metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions,
             metrics.ctr, metrics.average_cpc
      FROM search_term_view
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
      ORDER BY metrics.clicks DESC
      LIMIT 10
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, gaql);

    const keywords = (rows || []).map((row) => {
      const m    = row.metrics         || {};
      const st   = row.searchTermView  || row.search_term_view || {};
      const costMicros = Number(m.costMicros  ?? m.cost_micros  ?? 0);
      const cpcMicros  = Number(m.averageCpc  ?? m.average_cpc  ?? 0);
      const ctrRaw     = Number(m.ctr         ?? 0);
      const impressoes = Number(m.impressions ?? 0);
      const cliques    = Number(m.clicks      ?? 0);
      const conversas  = Number(m.conversions ?? 0);
      const gasto      = costMicros / 1_000_000;
      const cpc        = cpcMicros  / 1_000_000;
      const ctr        = ctrRaw * 100;

      return {
        termo:     st.searchTerm ?? st.search_term ?? "—",
        gasto,
        impressoes,
        cliques,
        conversas,
        ctr,
        cpc,
      };
    });

    res.json({ configured: true, hasData: keywords.length > 0, keywords });
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/keywords]", googleErr);
    res.status(500).json({ error: googleErr });
  }
});

// ─── GMB HELPER: auto-upgrade bare location ID → full path ───────────────────
// Saves "accounts/xxx/locations/yyy" back to clients.json so future requests
// never need to call mybusinessaccountmanagement.googleapis.com again.

async function upgradeGmbLocationId(clientId, currentRaw) {
  // Already a full path — nothing to do
  if (/^accounts\/\d+\/locations\/\d+$/.test((currentRaw || "").trim())) return;

  try {
    const { locationName } = await resolveLocationId(currentRaw);
    if (locationName && locationName !== currentRaw) {
      const clients = loadClients();
      if (clients[clientId]) {
        clients[clientId].gmb_location_id = locationName;
        saveClients(clients);
        console.log(`[gmb] Auto-upgraded location ID for ${clientId}: ${currentRaw} → ${locationName}`);
      }
    }
  } catch (e) {
    // Non-fatal — just log, don't block the request
    console.warn("[gmb] Could not auto-upgrade location ID:", e.message);
  }
}

// ─── GOOGLE BUSINESS PROFILE — INSIGHTS ────────────────────────────────────────

app.get("/api/gmb/insights", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GMB_CLIENT_ID) {
    return res.json({ configured: false, reason: "no_credentials" });
  }

  const clientId = user.role === "admin" ? (req.query.clientId || user.clientId) : user.clientId;
  const period   = req.query.period || "monthly";

  const clients     = loadClients();
  const clientConfig = clients[clientId];

  if (!clientConfig) return res.status(404).json({ error: "Cliente não encontrado" });

  if (!clientConfig.gmb_location_id) {
    return res.json({ configured: false, reason: "no_location" });
  }

  // ── Cache: serve dados salvos antes de chamar a API do Google
  const cacheKey = `gmb_insights_${period}`;
  const cached = getCachedInsights(clientId, cacheKey);
  if (cached) return res.json(cached);

  // Fire-and-forget: upgrade bare numeric ID to full path in background.
  // On success, future calls skip mybusinessaccountmanagement entirely.
  upgradeGmbLocationId(clientId, clientConfig.gmb_location_id);

  try {
    const { startDate, endDate } = getGmbDateRange(period);

    // Re-read clientConfig in case upgradeGmbLocationId already saved the full path
    const freshClients = loadClients();
    const freshLocation = freshClients[clientId]?.gmb_location_id || clientConfig.gmb_location_id;

    const series  = await getGmbInsights(freshLocation, startDate, endDate);
    const metrics = computeGmbMetrics(series);

    const payload = { configured: true, period, metrics, startDate, endDate };
    setCachedInsights(clientId, cacheKey, payload);
    res.json(payload);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error("[gmb/insights]", errMsg);
    // Se é quota exceeded, retorna cache antigo (stale) se existir
    const isQuota = errMsg?.includes("Quota exceeded") || errMsg?.includes("quota");
    if (isQuota) {
      // Serve stale cache when quota is hit instead of returning empty
      const stale = getCachedInsights(clientId, cacheKey);
      if (stale) return res.json({ ...stale, fromStaleCache: true });
      return res.status(429).json({ configured: false, reason: "quota_exceeded", error: "Limite de requisições da API do Google atingido. Tente novamente em alguns minutos." });
    }
    res.status(500).json({ configured: false, reason: "api_error", error: errMsg });
  }
});

// ─── GOOGLE BUSINESS PROFILE — REVIEWS ────────────────────────────────────────

app.get("/api/gmb/reviews", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GMB_CLIENT_ID) {
    return res.json({ configured: false, reason: "no_credentials" });
  }

  const clientId = user.role === "admin" ? (req.query.clientId || user.clientId) : user.clientId;

  const clients      = loadClients();
  const clientConfig = clients[clientId];

  if (!clientConfig) return res.status(404).json({ error: "Cliente não encontrado" });

  if (!clientConfig.gmb_location_id) {
    return res.json({ configured: false, reason: "no_location" });
  }

  // Cache reviews for 30 min — reviews don't change that often and this API
  // has very low quota on mybusinessaccountmanagement (needed when location ID is bare numeric)
  const reviewsCacheKey = `gmb_reviews_${clientId}`;
  const cachedReviews = getCachedInsights(clientId, reviewsCacheKey);
  if (cachedReviews) return res.json({ ...cachedReviews, fromCache: true });

  try {
    // Re-read in case upgradeGmbLocationId (triggered by insights) already saved full path
    const freshClients = loadClients();
    const freshLocation = freshClients[clientId]?.gmb_location_id || clientConfig.gmb_location_id;

    const { reviews, averageRating, totalReviewCount } = await getGmbReviews(
      freshLocation,
      10
    );

    const reviewsPayload = {
      configured: true,
      averageRating,
      totalReviewCount,
      reviews: reviews.map(r => ({
        name:       r.name,
        rating:     r.starRating,
        comment:    r.comment || "",
        author:     r.reviewer?.displayName || "Anônimo",
        date:       r.createTime,
        replyText:  r.reviewReply?.comment || null,
      })),
    };

    setCachedInsights(clientId, reviewsCacheKey, reviewsPayload);
    res.json(reviewsPayload);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    const statusCode = err.response?.status;
    console.error("[gmb/reviews]", statusCode, errMsg);

    // API still pending Google approval (mybusinessreviews.googleapis.com requires special access)
    const isRestricted = errMsg?.includes("has not been used in project")
      || errMsg?.includes("SERVICE_DISABLED")
      || errMsg?.includes("API has not been used");

    if (isRestricted) {
      return res.json({ configured: false, reason: "api_unavailable", error: errMsg });
    }

    // Return the actual error so the UI can show it instead of hiding silently
    res.json({ configured: false, reason: "api_error", error: errMsg });
  }
});

// ─── GOOGLE BUSINESS PROFILE — LIST LOCATIONS (admin) ────────────────────────

app.get("/api/gmb/locations", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  if (!process.env.GMB_CLIENT_ID) {
    return res.json({ configured: false });
  }

  try {
    const accounts  = await getGmbAccounts();
    const result    = [];

    for (const account of accounts) {
      const locations = await getGmbLocations(account.name);
      for (const loc of locations) {
        result.push({
          locationName:  loc.name,   // "accounts/.../locations/..."
          title:         loc.title || loc.locationName,
          accountName:   account.accountName || account.name,
          websiteUri:    loc.websiteUri || "",
        });
      }
    }

    res.json({ configured: true, locations: result });
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error("[gmb/locations]", errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// ─── ANOMALY HISTORY (admin only) ─────────────────────────────────────────────

app.get("/api/anomalies/history", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  res.json(getAnomalyHistory(limit));
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  const clients = loadClients();
  const lastCollection = getLastCollectionTime();
  res.json({
    ok: true,
    clients: Object.keys(clients).length,
    lastCollection,
    uptime: Math.floor(process.uptime()),
  });
});

// ─── SERVE REACT APP ──────────────────────────────────────────────────────────

app.use(express.static(join(__dirname, "dist")));

// SPA fallback (Express 5 requires named wildcard)
app.get("/*path", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ─── REPORT SCHEDULES ─────────────────────────────────────────────────────────

const REPORT_FROM = process.env.REPORT_FROM_EMAIL || "relatorios@focusdashboard.com.br";
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function buildReportEmailHtml(clientName, clientEmoji, clientColor, period, metrics, targets, delta) {
  const PERIOD_LABELS = { daily: "Ontem", weekly: "Última semana", monthly: "Este mês" };
  const periodLabel = PERIOD_LABELS[period] || period;
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const m = metrics || {};
  const t = targets || {};
  const d = delta || {};

  const fBRL0 = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  const fBRL2 = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const deltaStr = (val, li = false) => {
    if (val == null) return "";
    const good = li ? val < 0 : val >= 0;
    const color = good ? "#16a34a" : "#dc2626";
    return ` <span style="font-size:11px;font-weight:700;color:${color};">${val >= 0 ? "+" : ""}${val.toFixed(1)}%</span>`;
  };

  const kpis = [
    { label: "Investimento", value: fBRL0(m.gasto), delta: deltaStr(d.gasto) },
    { label: "Conversas", value: m.conversas ?? 0, delta: deltaStr(d.conversas) },
    { label: "CPL", value: m.cpl > 0 ? fBRL2(m.cpl) : "—", delta: deltaStr(d.cpl, true) },
    { label: "CTR", value: `${(m.ctr || 0).toFixed(2)}%`, delta: "" },
    { label: "CPM", value: fBRL2(m.cpm), delta: deltaStr(d.cpm, true) },
    { label: "Impressões", value: (m.impressoes || 0).toLocaleString("pt-BR"), delta: "" },
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">

  <!-- Header -->
  <tr><td style="background:#09090b;padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div style="display:inline-flex;align-items:center;gap:12px;">
          <span style="font-size:28px;line-height:1;">${clientEmoji}</span>
          <div>
            <div style="color:#ffffff;font-size:18px;font-weight:700;">${clientName}</div>
            <div style="color:#a1a1aa;font-size:12px;margin-top:2px;">Relatório de Performance · ${periodLabel}</div>
          </div>
        </div>
      </td>
      <td align="right">
        <div style="width:8px;height:8px;border-radius:50%;background:${clientColor};display:inline-block;margin-right:6px;"></div>
        <span style="color:#71717a;font-size:11px;">${now}</span>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- KPIs -->
  <tr><td style="padding:28px 32px 8px;">
    <p style="color:#71717a;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 16px;">Métricas do período</p>
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
    ${kpis.slice(0, 3).map((k) => `
      <td width="33%" style="padding:0 6px 12px 0;">
        <div style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:12px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">${k.label}</div>
          <div style="font-size:20px;font-weight:800;color:#09090b;">${k.value}${k.delta}</div>
        </div>
      </td>`).join("")}
    </tr>
    <tr>
    ${kpis.slice(3).map((k) => `
      <td width="33%" style="padding:0 6px 12px 0;">
        <div style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:12px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">${k.label}</div>
          <div style="font-size:20px;font-weight:800;color:#09090b;">${k.value}${k.delta}</div>
        </div>
      </td>`).join("")}
    </tr>
    </table>
  </td></tr>

  ${t.target_spend > 0 ? `
  <!-- Budget progress -->
  <tr><td style="padding:0 32px 24px;">
    <p style="color:#71717a;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px;">Acompanhamento de metas</p>
    ${[
      t.target_spend > 0 ? { label: "Budget mensal", value: m.gasto, target: t.target_spend, fmt: fBRL0, color: "#7c3aed" } : null,
      t.target_conversas > 0 ? { label: "Meta de conversas", value: m.conversas, target: t.target_conversas, fmt: (v) => v, color: "#059669" } : null,
    ].filter(Boolean).map((bar) => {
      const pct = Math.min(100, Math.round((bar.value / bar.target) * 100));
      const over = pct > 100;
      const barColor = over ? "#dc2626" : bar.color;
      return `
      <div style="margin-bottom:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
          <tr>
            <td style="font-size:12px;font-weight:600;color:#374151;">${bar.label}</td>
            <td align="right" style="font-size:12px;font-weight:700;color:${over ? "#dc2626" : "#111827"};">${bar.fmt(bar.value)} / ${bar.fmt(bar.target)} (${pct}%)</td>
          </tr>
        </table>
        <div style="height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:999px;"></div>
        </div>
      </div>`;
    }).join("")}
  </td></tr>` : ""}

  <!-- Footer -->
  <tr><td style="background:#f9fafb;border-top:1px solid #e4e4e7;padding:20px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-size:12px;color:#a1a1aa;">Focus Dashboard · Relatório automático</td>
      <td align="right" style="font-size:11px;color:#d4d4d8;">Para cancelar, acesse o painel Admin.</td>
    </tr>
    </table>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

async function sendScheduledReport(schedule) {
  const clients = loadClients();
  const clientConfig = clients[schedule.client_id];
  if (!clientConfig) return;

  // Fetch current insights
  try {
    const response = await axios.get(
      `${META_BASE}/${clientConfig.accountId}/insights`,
      {
        params: {
          fields: "spend,impressions,clicks,reach,actions,cost_per_action_type",
          date_preset: DATE_PRESETS[schedule.period] || "yesterday",
          level: "account",
          access_token: clientConfig.token,
        },
        timeout: 15000,
      }
    );
    const raw = response.data.data?.[0];
    if (!raw) return;

    const { gasto, impressoes, cliques, alcance, conversas, cpl, ctr, cpm } = computeMetrics(raw);
    const metrics = { gasto, impressoes, cliques, alcance, conversas, cpl, ctr, cpm };
    const clientData = getClient(schedule.client_id);
    const targets = {
      target_spend: clientData?.target_spend || 0,
      target_conversas: clientData?.target_conversas || 0,
    };
    const prev = getPreviousPeriodMetrics(schedule.client_id, schedule.period);
    const delta = prev ? {
      gasto: prev.gasto > 0 ? ((gasto - prev.gasto) / prev.gasto) * 100 : null,
      conversas: prev.conversas > 0 ? ((conversas - prev.conversas) / prev.conversas) * 100 : null,
      cpl: prev.cpl > 0 ? ((cpl - prev.cpl) / prev.cpl) * 100 : null,
      cpm: prev.cpm > 0 ? ((cpm - prev.cpm) / prev.cpm) * 100 : null,
    } : {};

    const PERIOD_LABELS = { daily: "Ontem", weekly: "Última semana", monthly: "Este mês" };
    const html = buildReportEmailHtml(
      clientConfig.name, clientConfig.emoji || "🏢", clientConfig.color || "#7c3aed",
      schedule.period, metrics, targets, delta
    );

    const resend = getResend();
    if (!resend) {
      console.warn("[reports] RESEND_API_KEY not set — skipping email send.");
      return;
    }
    await resend.emails.send({
      from: REPORT_FROM,
      to: schedule.email,
      subject: `📊 ${clientConfig.name} · ${PERIOD_LABELS[schedule.period] || schedule.period}`,
      html,
    });

    markScheduleSent(schedule.id);
    console.log(`[reports] Sent to ${schedule.email} for client ${schedule.client_id}`);
  } catch (err) {
    console.error(`[reports] Failed for schedule ${schedule.id}:`, err.message);
  }
}

// GET /api/report-schedules
app.get("/api/report-schedules", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(getSchedules());
});

// POST /api/report-schedules
app.post("/api/report-schedules", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { clientId, email, period, dayOfWeek } = req.body;
  if (!clientId || !email || !period || dayOfWeek === undefined) {
    return res.status(400).json({ error: "clientId, email, period e dayOfWeek são obrigatórios" });
  }
  const id = saveSchedule({ clientId, email, period, dayOfWeek: Number(dayOfWeek) });
  res.json({ id });
});

// PATCH /api/report-schedules/:id
app.patch("/api/report-schedules/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { active } = req.body;
  updateScheduleActive(Number(req.params.id), active);
  res.json({ ok: true });
});

// DELETE /api/report-schedules/:id
app.delete("/api/report-schedules/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  deleteSchedule(Number(req.params.id));
  res.json({ ok: true });
});

// POST /api/report-schedules/:id/send-now (test send)
app.post("/api/report-schedules/:id/send-now", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const schedules = getSchedules();
  const schedule = schedules.find((s) => s.id === Number(req.params.id));
  if (!schedule) return res.status(404).json({ error: "Agendamento não encontrado" });
  if (!process.env.RESEND_API_KEY) {
    return res.status(400).json({ error: "RESEND_API_KEY não configurada" });
  }
  try {
    await sendScheduledReport(schedule);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DAILY DATA COLLECTION (cron) ─────────────────────────────────────────────

async function collectDailyData() {
  const clients = loadClients();
  const entries = Object.entries(clients);
  if (entries.length === 0) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  let success = 0, errors = 0;
  for (const [clientId, c] of entries) {
    try {
      const r = await axios.get(`${META_BASE}/${c.accountId}/insights`, {
        params: {
          fields: "spend,impressions,clicks,reach,actions",
          date_preset: "yesterday",
          level: "account",
          access_token: c.token,
        },
        timeout: 15000,
      });
      const raw = r.data.data?.[0] || null;
      if (!raw) continue;

      const metrics = computeMetrics(raw);

      saveInsightHistory(clientId, dateStr, metrics);
      setCachedInsights(clientId, "daily", { hasData: true, client: c.name, clientId, period: "daily", metrics, targets: {}, delta: null });
      success++;
    } catch (err) {
      console.error(`[cron] Error fetching ${clientId}:`, err.message);
      errors++;
    }
  }
  console.log(`[cron] Daily collection: ${success} ok, ${errors} errors`);
}

// Run daily at 06:00
cron.schedule("0 6 * * *", () => {
  console.log("[cron] Starting daily data collection...");
  collectDailyData();
});

// Run report dispatch daily at 08:00 (after data collection)
cron.schedule("0 8 * * *", async () => {
  if (!process.env.RESEND_API_KEY) return;
  const due = getSchedulesDueToday();
  if (due.length === 0) return;
  console.log(`[reports] Dispatching ${due.length} scheduled report(s)...`);
  for (const schedule of due) {
    await sendScheduledReport(schedule);
  }
});

// ─── START ────────────────────────────────────────────────────────────────────

// Initialize DB, migrate from JSON files, and seed base clients
initDb(dbModule);
migrateFromJson();
seedClients();

app.listen(PORT, () => {
  console.log(`\n✅  Focus Dashboard rodando na porta ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn(
      "⚠️   JWT_SECRET não definido — usando secret padrão de desenvolvimento.\n" +
        "     Em produção: export JWT_SECRET=$(openssl rand -hex 32)\n"
    );
  }
  if (!process.env.GMB_CLIENT_ID || !process.env.GMB_CLIENT_SECRET || !process.env.GMB_REFRESH_TOKEN) {
    console.warn(
      "⚠️   Credenciais do Google Meu Negócio ausentes.\n" +
        "     Configure GMB_CLIENT_ID, GMB_CLIENT_SECRET e GMB_REFRESH_TOKEN\n" +
        "     nas Environment Variables do Coolify para ativar o Google Meu Negócio.\n"
    );
  } else {
    console.log("✅  Google Meu Negócio: credenciais configuradas.");
  }
});
