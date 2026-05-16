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
import crypto from "crypto";
import cron from "node-cron";
import { META_BASE, DATE_PRESETS, extractConversions, computeMetrics } from "./lib/meta.js";
import { DATE_RANGES as GOOGLE_DATE_RANGES, queryGoogleAds, computeGoogleMetrics } from "./lib/google.js";
import { getGmbAccessToken, getGmbAccounts, getGmbLocations, getGmbReviews, getGmbInsights, computeGmbMetrics, extractGmbDailySeries, getGmbDateRange, resolveLocationId, getDefaultAccountName, seedAccountNameFromFullPath } from "./lib/gmb.js";

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
  getUserByEmail,
  updateUserPassword,
  saveResetToken,
  getResetToken,
  markTokenUsed,
  getRoiPlans,
  getRoiPlan,
  saveRoiPlan,
  deleteRoiPlan,
  createRoiPlanShareToken,
  revokeRoiPlanShareToken,
  getRoiPlanByShareToken,
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

// ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email obrigatório" });

  try {
    const user = getUserByEmail(email.toLowerCase().trim());
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      saveResetToken(token, user.username, expiresAt);

      const baseUrl = process.env.APP_URL || "https://dashboard.focusmidia.com.br";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "Focus Dashboard <noreply@focusmidia.com.br>",
          to: email,
          subject: "Recuperação de senha — Focus Dashboard",
          html: `
            <div style="font-family:system-ui,sans-serif;background:#09090b;color:#f4f4f5;padding:40px;border-radius:12px;max-width:480px;margin:0 auto">
              <div style="margin-bottom:24px">
                <span style="font-size:20px;font-weight:700;color:#fff">Focus</span>
                <span style="font-size:20px;font-weight:700;color:#C9F80D">Dashboard</span>
              </div>
              <h2 style="color:#f4f4f5;margin:0 0 8px">Recuperação de senha</h2>
              <p style="color:#a1a1aa;margin:0 0 24px">Clique no botão abaixo para criar uma nova senha. O link é válido por 1 hora.</p>
              <a href="${resetLink}" style="display:inline-block;background:#C9F80D;color:#09090b;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">Criar nova senha</a>
              <p style="color:#52525b;font-size:12px;margin-top:24px">Se você não solicitou a recuperação, ignore este email.</p>
              <p style="color:#3f3f46;font-size:12px">Focus Mídia | Marketing e Performance</p>
            </div>
          `,
        });
      }
    }
    // Always return 200 to not reveal if email exists
    res.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "Token e senha obrigatórios" });
  if (password.length < 6) return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres" });

  try {
    const record = getResetToken(token);
    if (!record) return res.status(400).json({ error: "Token inválido ou já utilizado" });
    if (Date.now() > record.expires_at) return res.status(400).json({ error: "Token expirado. Solicite uma nova recuperação." });

    const hashed = await hashPassword(password);
    updateUserPassword(record.username, hashed);
    markTokenUsed(token);
    res.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    res.status(500).json({ error: "Erro interno" });
  }
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
      taxa_conversao: clientData?.taxa_conversao ?? 0.1,
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

// ─── ADMIN USERS MANAGEMENT (admin-only) ────────────────────────────────────

import { getUsers as dbGetUsers, saveUser as dbSaveUser, deleteUser as dbDeleteUser } from "./lib/db.js";

app.get("/api/admin/users", (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const users = dbGetUsers();
    const safe = Object.entries(users).map(([username, u]) => ({
      username,
      name: u.name,
      role: u.role,
      clientId: u.clientId || null,
    }));
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/users", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { username, name, password, role = "client", clientId = null } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username e password obrigatórios" });
  }
  if (!["admin", "client"].includes(role)) {
    return res.status(400).json({ error: "role inválido (admin|client)" });
  }
  try {
    const hash = await hashPassword(password);
    dbSaveUser(username, {
      name: name || username,
      password: hash,
      role,
      clientId: role === "client" ? clientId : null,
    });
    res.status(201).json({ username, name: name || username, role, clientId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/users/:username", (req, res) => {
  const requester = requireAdmin(req, res);
  if (!requester) return;
  const target = req.params.username;
  if (target === requester.username) {
    return res.status(400).json({ error: "Não é possível deletar a si mesmo" });
  }
  try {
    dbDeleteUser(target);
    res.json({ ok: true, deleted: target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROI PLANS (Calculadora de ROI) ─────────────────────────────────────────
// Admin-only: lista, cria, atualiza, deleta planos de mídia

app.get("/api/roi/plans", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const clientId = req.query.client || null;
  try {
    const plans = getRoiPlans(clientId ? { clientId } : {});
    res.json(plans);
  } catch (err) {
    console.error("[roi] list error:", err.message);
    res.status(500).json({ error: "Falha ao listar planos" });
  }
});

app.get("/api/roi/plans/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const plan = getRoiPlan(req.params.id);
  if (!plan) return res.status(404).json({ error: "Plano não encontrado" });
  res.json(plan);
});

app.post("/api/roi/plans", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  const body = req.body || {};
  if (!body.nome || !body.parametros) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, parametros" });
  }
  try {
    const id = saveRoiPlan(body, user.username || null);
    const plan = getRoiPlan(id);
    res.status(201).json(plan);
  } catch (err) {
    console.error("[roi] create error:", err.message);
    res.status(500).json({ error: "Falha ao salvar plano" });
  }
});

app.put("/api/roi/plans/:id", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  const existing = getRoiPlan(req.params.id);
  if (!existing) return res.status(404).json({ error: "Plano não encontrado" });
  try {
    const merged = { ...existing, ...req.body, id: req.params.id };
    saveRoiPlan(merged, user.username || null);
    res.json(getRoiPlan(req.params.id));
  } catch (err) {
    console.error("[roi] update error:", err.message);
    res.status(500).json({ error: "Falha ao atualizar plano" });
  }
});

app.delete("/api/roi/plans/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    deleteRoiPlan(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[roi] delete error:", err.message);
    res.status(500).json({ error: "Falha ao remover plano" });
  }
});

// Share token management (admin)
app.post("/api/roi/plans/:id/share", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const result = createRoiPlanShareToken(req.params.id);
  if (!result) return res.status(404).json({ error: "Plano não encontrado" });
  res.status(result.alreadyExisted ? 200 : 201).json(result);
});

app.delete("/api/roi/plans/:id/share", (req, res) => {
  if (!requireAdmin(req, res)) return;
  revokeRoiPlanShareToken(req.params.id);
  res.json({ ok: true });
});

// Public share view (sem auth)
app.get("/api/roi/share/:token", (req, res) => {
  const plan = getRoiPlanByShareToken(req.params.token);
  if (!plan) return res.status(404).json({ error: "Plano não encontrado ou link revogado" });
  res.json(plan);
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
      taxa_conversao:    clientData?.taxa_conversao    ?? 0.1,
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

// ─── GOOGLE ADS — YOUTUBE VIDEO CAMPAIGNS ────────────────────────────────────

app.get("/api/google/youtube", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_ADS_CLIENT_ID) {
    return res.json({ configured: false });
  }

  const { client: clientId, period } = req.query;

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients      = loadClients();
  const clientConfig = clients[clientId];
  const dateRange    = GOOGLE_DATE_RANGES[period] || GOOGLE_DATE_RANGES.monthly;

  if (!clientConfig) return res.status(400).json({ error: "Invalid client" });
  if (!clientConfig.google_ads_customer_id) {
    return res.json({ configured: false, hasData: false });
  }

  try {
    // ── Campaign-level YouTube metrics ────────────────────────────────────────
    const campGaql = `
      SELECT campaign.name, campaign.status,
             metrics.cost_micros, metrics.impressions,
             metrics.video_views, metrics.video_view_rate,
             metrics.average_cpv, metrics.clicks,
             metrics.conversions, metrics.ctr
      FROM campaign
      WHERE segments.date DURING ${dateRange}
        AND campaign.advertising_channel_type = VIDEO
        AND metrics.impressions > 0
      ORDER BY metrics.video_views DESC
      LIMIT 20
    `;

    const rows = await queryGoogleAds(clientConfig.google_ads_customer_id, campGaql);

    if (!rows || rows.length === 0) {
      return res.json({ configured: true, hasData: false });
    }

    // ── Normalize per-campaign ────────────────────────────────────────────────
    const campaigns = (rows || []).map((row) => {
      const m   = row.metrics  || {};
      const c   = row.campaign || {};
      const gasto      = Number(m.costMicros  ?? m.cost_micros  ?? 0) / 1_000_000;
      const cpv        = Number(m.averageCpv  ?? m.average_cpv  ?? 0) / 1_000_000;
      const ctr        = Number(m.ctr         ?? 0) * 100;
      const viewRate   = Number(m.videoViewRate ?? m.video_view_rate ?? 0) * 100;
      const views      = Number(m.videoViews  ?? m.video_views  ?? 0);
      const impressoes = Number(m.impressions ?? 0);
      const cliques    = Number(m.clicks      ?? 0);
      const conversas  = Number(m.conversions ?? 0);
      const cpconv     = conversas > 0 ? gasto / conversas : null;

      return {
        name:      c.name   || "—",
        status:    c.status || "UNKNOWN",
        gasto, views, viewRate, cpv, impressoes, cliques, conversas, ctr, cpconv,
      };
    });

    // ── Account-level totals (sum across all VIDEO campaigns) ─────────────────
    const totals = campaigns.reduce((acc, c) => ({
      gasto:      acc.gasto      + c.gasto,
      views:      acc.views      + c.views,
      impressoes: acc.impressoes + c.impressoes,
      cliques:    acc.cliques    + c.cliques,
      conversas:  acc.conversas  + c.conversas,
    }), { gasto: 0, views: 0, impressoes: 0, cliques: 0, conversas: 0 });

    totals.viewRate = totals.impressoes > 0
      ? (totals.views / totals.impressoes) * 100
      : 0;
    totals.cpv   = totals.views > 0 ? totals.gasto / totals.views : null;
    totals.cpconv = totals.conversas > 0 ? totals.gasto / totals.conversas : null;

    res.json({ configured: true, hasData: true, totals, campaigns });
  } catch (err) {
    const googleErr = err.response?.data?.error?.message || err.message;
    console.error("[google/youtube]", googleErr);
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

// Per-client lock so concurrent requests don't each fire a separate upgrade attempt
const _upgradeGmbInProgress = new Set();

async function upgradeGmbLocationId(clientId, currentRaw) {
  // Already a full path — nothing to do
  if (/^accounts\/\d+\/locations\/\d+$/.test((currentRaw || "").trim())) return;

  // Another request for this client is already upgrading — skip duplicate
  if (_upgradeGmbInProgress.has(clientId)) return;
  _upgradeGmbInProgress.add(clientId);

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
  } finally {
    _upgradeGmbInProgress.delete(clientId);
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

    // Delta vs período anterior (mesmo tamanho de janela)
    let delta = null;
    try {
      const periodDays = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
      const prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - periodDays + 1);
      const fmt = (d) => d.toISOString().split("T")[0];
      const prevSeries = await getGmbInsights(freshLocation, fmt(prevStart), fmt(prevEnd));
      const prev = computeGmbMetrics(prevSeries);
      delta = {
        impressoes:  prev.impressoes  > 0 ? ((metrics.impressoes  - prev.impressoes)  / prev.impressoes)  * 100 : null,
        buscas:      prev.buscas      > 0 ? ((metrics.buscas      - prev.buscas)      / prev.buscas)      * 100 : null,
        mapas:       prev.mapas       > 0 ? ((metrics.mapas       - prev.mapas)       / prev.mapas)       * 100 : null,
        ligacoes:    prev.ligacoes    > 0 ? ((metrics.ligacoes    - prev.ligacoes)    / prev.ligacoes)    * 100 : null,
        cliquessite: prev.cliquessite > 0 ? ((metrics.cliquessite - prev.cliquessite) / prev.cliquessite) * 100 : null,
        direcoes:    prev.direcoes    > 0 ? ((metrics.direcoes    - prev.direcoes)    / prev.direcoes)    * 100 : null,
      };
    } catch (deltaErr) {
      console.warn("[gmb/insights] delta query failed:", deltaErr.message);
    }

    const targets = {
      ticket_medio:      clientConfig?.ticket_medio      || 0,
      target_conversas:  clientConfig?.target_conversas  || 0,
      taxa_conversao:    clientConfig?.taxa_conversao    ?? 0.1,
    };

    const dailySeries = extractGmbDailySeries(series);

    const payload = {
      configured: true,
      client: clientConfig?.name,
      period,
      metrics,
      delta,
      dailySeries,
      targets,
      startDate,
      endDate,
    };
    setCachedInsights(clientId, cacheKey, payload);
    res.json(payload);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error("[gmb/insights]", errMsg, err.response?.data || "");
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
    console.error("[gmb/reviews]", statusCode, errMsg, err.response?.data || "");

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
    // Usa getDefaultAccountName (que tem backoff de quota) em vez de chamar
    // getGmbAccounts diretamente, para não furar o rate-limit de 2 RPM
    const accountName = await getDefaultAccountName();
    const accounts    = [{ name: accountName }];
    const result      = [];

    for (const account of accounts) {
      const locations = await getGmbLocations(account.name);
      for (const loc of locations) {
        result.push({
          locationName: loc.name,
          title:        loc.title || loc.locationName,
          accountName:  account.name,
          websiteUri:   loc.websiteUri || "",
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

// ─── MONTHLY REPORT — client-accessible export ───────────────────────────────
// Returns a print-optimised HTML page. Frontend opens it as a blob URL so the
// client can print-to-PDF without needing a server-side PDF library.

// Builds a standalone, print-optimised HTML page for the monthly report.
// Receives { metaData, googleData, gmbData, targets } — each section is optional.
function buildMonthlyReportPage(clientName, clientEmoji, clientColor, { metaData, googleData, gmbData, targets }) {
  const now  = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const t    = targets || {};

  // ── helpers ──────────────────────────────────────────────────────────────────
  const fBRL0 = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  const fBRL2 = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fNum  = (v) => Math.round(v || 0).toLocaleString("pt-BR");
  const fPct  = (v) => `${(v || 0).toFixed(2)}%`;

  const dHtml = (val, lower = false) => {
    if (val == null) return "";
    const good  = lower ? val < 0 : val >= 0;
    const color = good ? "#16a34a" : "#dc2626";
    return `<span style="font-size:10px;font-weight:700;color:${color};margin-left:5px;">${val >= 0 ? "+" : ""}${val.toFixed(1)}%</span>`;
  };

  const kpiCard = (icon, label, value, delta = "") =>
    `<div class="kpi-card"><div class="kpi-label">${icon} ${label}</div><div class="kpi-value">${value}${delta}</div></div>`;

  const progressBar = (label, value, target, fmt, color) => {
    const pct = Math.min(100, Math.round(((value || 0) / target) * 100));
    const bc  = pct >= 100 ? "#dc2626" : color;
    return `<div class="bar-row">
      <div class="bar-meta"><span>${label}</span><span style="color:${pct >= 100 ? "#dc2626" : "#111827"};">${fmt(value)} / ${fmt(target)} (${pct}%)</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${bc};"></div></div>
    </div>`;
  };

  const table = (headers, rows) => `
    <table class="camp-table">
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;

  const sectionDivider = (label, color = clientColor) =>
    `<div class="section-divider" style="border-color:${color}30;"><span class="section-divider-label" style="background:${color}18;color:${color};">${label}</span></div>`;

  const starRating = (r) => {
    const STAR_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    const n = typeof r === "string" ? (STAR_MAP[r] || 0) : Math.round(r || 0);
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  // ── META ADS SECTION ─────────────────────────────────────────────────────────
  let metaSection = "";
  if (metaData) {
    const m = metaData.metrics || {};
    const d = metaData.delta   || {};
    const roas = t.ticket_medio > 0 && m.gasto > 0 ? (m.conversas * t.ticket_medio) / m.gasto : null;

    const kpis = [
      kpiCard("💰", "Investimento",   fBRL0(m.gasto),                            dHtml(d.gasto)),
      kpiCard("💬", "Conversas",      fNum(m.conversas),                          dHtml(d.conversas)),
      kpiCard("🎯", "CPL",            m.cpl > 0 ? fBRL2(m.cpl) : "—",           dHtml(d.cpl, true)),
      kpiCard("👆", "CTR",            fPct(m.ctr),                                ""),
      kpiCard("📢", "CPM",            fBRL2(m.cpm),                               dHtml(d.cpm, true)),
      kpiCard("👁️", "Impressões",     fNum(m.impressoes),                         ""),
      kpiCard("🖱️", "Cliques",        fNum(m.cliques),                            ""),
      kpiCard("👥", "Alcance",        fNum(m.alcance),                            ""),
      kpiCard("💵", "CPC",            m.cliques > 0 ? fBRL2(m.cpc) : "—",       ""),
      ...(roas !== null ? [kpiCard("📈", "ROAS", `${roas.toFixed(2)}x`, "")] : []),
    ];

    const progBars = [
      t.target_spend     > 0 ? progressBar("Budget mensal",    m.gasto,     t.target_spend,     fBRL0, "#7c3aed") : "",
      t.target_conversas > 0 ? progressBar("Meta de conversas", m.conversas, t.target_conversas, fNum,  "#059669") : "",
    ].filter(Boolean).join("");

    const campTable = metaData.campaigns && metaData.campaigns.length > 0
      ? table(
          ["Campanha", "Investimento", "Impressões", "Cliques", "Conversas", "CPL"],
          metaData.campaigns.map((c) => [
            `<span style="font-weight:600;">${c.name}</span>`,
            fBRL0(c.gasto), fNum(c.impressoes), fNum(c.cliques),
            fNum(c.conversas),
            c.cpl != null ? fBRL2(c.cpl) : "—",
          ])
        )
      : "";

    metaSection = `
    ${sectionDivider("📘 Meta Ads — Facebook & Instagram", "#1877f2")}
    <div class="section">
      <div class="section-label">KPIs Meta Ads</div>
      <div class="kpi-grid kpi-grid-5">${kpis.join("")}</div>
    </div>
    ${progBars ? `<div class="section" style="padding-top:0;"><div class="section-label">Metas</div>${progBars}</div>` : ""}
    ${campTable ? `<div class="section" style="padding-top:0;"><div class="section-label">Top campanhas</div>${campTable}</div>` : ""}`;
  }

  // ── GOOGLE ADS SECTION ───────────────────────────────────────────────────────
  let googleSection = "";
  if (googleData) {
    const gm = googleData.metrics || {};

    const gKpis = [
      kpiCard("💰", "Investimento",      fBRL0(gm.gasto),                                   ""),
      kpiCard("💬", "Conversões",        fNum(gm.conversas),                                 ""),
      kpiCard("🎯", "CPL",               gm.cpl != null ? fBRL2(gm.cpl) : "—",             ""),
      kpiCard("👆", "CTR",               fPct(gm.ctr),                                       ""),
      kpiCard("📢", "CPM",               fBRL2(gm.cpm),                                      ""),
      kpiCard("👁️", "Impressões",        fNum(gm.impressoes),                                ""),
      kpiCard("🖱️", "Cliques",           fNum(gm.cliques),                                   ""),
      kpiCard("💵", "CPC",               gm.cliques > 0 ? fBRL2(gm.cpc) : "—",             ""),
      ...(gm.roas != null ? [kpiCard("📈", "ROAS", `${gm.roas.toFixed(2)}x`, "")] : []),
      ...(gm.impressionShare != null ? [kpiCard("🔍", "Imp. Share", `${(gm.impressionShare * 100).toFixed(1)}%`, "")] : []),
    ];

    const gCampTable = googleData.campaigns && googleData.campaigns.length > 0
      ? table(
          ["Campanha", "Investimento", "Impressões", "Cliques", "Conversões", "CPL", "CTR"],
          googleData.campaigns.map((c) => [
            `<span style="font-weight:600;">${c.name}</span>`,
            fBRL0(c.gasto), fNum(c.impressoes), fNum(c.cliques),
            fNum(c.conversas),
            c.cpl != null ? fBRL2(c.cpl) : "—",
            fPct(c.ctr || 0),
          ])
        )
      : "";

    googleSection = `
    ${sectionDivider("🔵 Google Ads", "#4285f4")}
    <div class="section">
      <div class="section-label">KPIs Google Ads</div>
      <div class="kpi-grid kpi-grid-5">${gKpis.join("")}</div>
    </div>
    ${gCampTable ? `<div class="section" style="padding-top:0;"><div class="section-label">Top campanhas</div>${gCampTable}</div>` : ""}`;
  }

  // ── GMB SECTION ──────────────────────────────────────────────────────────────
  let gmbSection = "";
  if (gmbData) {
    const gm = gmbData.metrics || {};
    const rv = gmbData.reviews;

    const gmbKpis = [
      kpiCard("👁️", "Impressões",     fNum(gm.impressoes), ""),
      kpiCard("🔍", "Buscas",         fNum(gm.buscas),     ""),
      kpiCard("🗺️", "Mapas",         fNum(gm.mapas),      ""),
      kpiCard("📞", "Ligações",       fNum(gm.ligacoes),   ""),
      kpiCard("🌐", "Cliques site",   fNum(gm.cliquessite),""),
      kpiCard("🧭", "Direções",       fNum(gm.direcoes),   ""),
    ];

    const ratingNum  = Number(rv?.averageRating) || 0;
    const reviewBlock = rv
      ? `<div class="review-box">
           <div class="review-rating">${ratingNum > 0 ? ratingNum.toFixed(1) : "—"} <span style="color:#f59e0b;font-size:18px;">${starRating(ratingNum)}</span></div>
           <div class="review-count">${fNum(rv.totalReviewCount)} avaliações no Google</div>
         </div>`
      : "";

    gmbSection = `
    ${sectionDivider("📍 Google Meu Negócio", "#34a853")}
    <div class="section">
      <div class="section-label">Presença local</div>
      <div class="kpi-grid kpi-grid-3">${gmbKpis.join("")}</div>
      ${reviewBlock}
    </div>`;
  }

  // ── HTML ──────────────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relatório Mensal · ${clientName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f0f2; color: #111827; }
    .page { max-width: 820px; margin: 28px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; }
    /* ── header ── */
    .header { background: #09090b; padding: 26px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-emoji { font-size: 30px; }
    .header-title { color: #fff; font-size: 19px; font-weight: 700; }
    .header-sub { color: #a1a1aa; font-size: 11px; margin-top: 2px; }
    .header-date { color: #71717a; font-size: 11px; display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: ${clientColor}; display: inline-block; }
    /* ── sections ── */
    .section { padding: 24px 32px; }
    .section-label { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; margin-bottom: 14px; }
    .section-divider { border-top: 2px solid #e5e7eb; margin: 0 32px; padding: 16px 0 4px; }
    .section-divider-label { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; }
    /* ── kpi grid ── */
    .kpi-grid { display: grid; gap: 10px; }
    .kpi-grid-5 { grid-template-columns: repeat(5, 1fr); }
    .kpi-grid-3 { grid-template-columns: repeat(3, 1fr); }
    .kpi-card { background: #f9fafb; border: 1px solid #e4e4e7; border-radius: 10px; padding: 13px 14px; }
    .kpi-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
    .kpi-value { font-size: 18px; font-weight: 800; color: #09090b; display: flex; align-items: baseline; flex-wrap: wrap; gap: 3px; }
    /* ── progress bars ── */
    .bar-row { margin-bottom: 12px; }
    .bar-meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; margin-bottom: 5px; color: #374151; }
    .bar-track { height: 6px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; }
    /* ── campaign table ── */
    .camp-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .camp-table th { text-align: left; padding: 7px 10px; background: #f3f4f6; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; font-size: 9px; border-bottom: 1px solid #e5e7eb; }
    .camp-table td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
    .camp-table tr:last-child td { border-bottom: none; }
    .camp-table tr:hover td { background: #f9fafb; }
    /* ── reviews ── */
    .review-box { margin-top: 14px; padding: 14px 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; display: flex; align-items: center; gap: 16px; }
    .review-rating { font-size: 26px; font-weight: 800; color: #09090b; }
    .review-count { font-size: 12px; color: #6b7280; }
    /* ── footer ── */
    .footer { background: #f9fafb; border-top: 1px solid #e4e4e7; padding: 18px 32px; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 12px; color: #a1a1aa; }
    .footer-brand strong { color: #7c3aed; }
    /* ── print bar ── */
    .print-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; background: ${clientColor}; color: #fff; border: none; border-radius: 9px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .print-btn:hover { opacity: .88; }
    .print-bar { background: #09090b; padding: 11px 32px; display: flex; justify-content: space-between; align-items: center; }
    .print-bar-text { color: #a1a1aa; font-size: 11px; }
    /* ── responsive ── */
    @media (max-width: 680px) {
      .section { padding: 18px 16px; }
      .section-divider { margin: 0 16px; }
      .header { padding: 18px 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
      .kpi-grid-5 { grid-template-columns: repeat(2, 1fr); }
      .kpi-grid-3 { grid-template-columns: repeat(2, 1fr); }
      .footer { flex-direction: column; gap: 10px; }
      .print-bar { padding: 11px 16px; }
    }
    /* ── print ── */
    @media print {
      body { background: #fff; }
      .page { margin: 0; border: none; border-radius: 0; box-shadow: none; max-width: 100%; }
      .print-bar { display: none !important; }
      .kpi-grid-5 { grid-template-columns: repeat(5, 1fr); }
      .kpi-grid-3 { grid-template-columns: repeat(3, 1fr); }
      .camp-table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span class="print-bar-text">Relatório Mensal · ${clientName} · ${now}</span>
    <button class="print-btn" onclick="window.print()">🖨️ Salvar como PDF</button>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <span class="header-emoji">${clientEmoji}</span>
        <div>
          <div class="header-title">${clientName}</div>
          <div class="header-sub">Relatório de Performance · Mensal</div>
        </div>
      </div>
      <div class="header-date"><span class="dot"></span>${now}</div>
    </div>

    ${metaSection}
    ${googleSection}
    ${gmbSection}

    <!-- Footer -->
    <div class="footer">
      <span class="footer-brand">Focus<strong>Dashboard</strong> · Relatório mensal</span>
      <span style="font-size:11px;color:#d4d4d8;">${now}</span>
    </div>
  </div>
</body>
</html>`;
}

app.get("/api/report/monthly", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const clientId = user.role === "client"
    ? user.clientId
    : (req.query.client || user.clientId);

  if (!clientId) return res.status(400).json({ error: "Cliente não especificado" });

  if (user.role === "client" && user.clientId !== clientId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const clients = loadClients();
  const clientConfig = clients[clientId];
  if (!clientConfig) return res.status(404).json({ error: "Cliente não encontrado" });

  const clientData = getClient(clientId);
  const targets = {
    target_spend:      clientData?.target_spend      || 0,
    target_conversas:  clientData?.target_conversas  || 0,
    target_cpl_max:    clientData?.target_cpl_max    || 0,
    ticket_medio:      clientData?.ticket_medio      || 0,
  };

  // ── Fetch all platforms in PARALLEL ─────────────────────────────────────────
  const fetchMeta = async () => {
    try {
      const [insRes, campRes] = await Promise.all([
        axios.get(`${META_BASE}/${clientConfig.accountId}/insights`, {
          params: {
            fields: "spend,impressions,clicks,reach,actions,cost_per_action_type",
            date_preset: DATE_PRESETS.monthly || "last_30d",
            level: "account",
            access_token: clientConfig.token,
          },
          timeout: 20000,
        }),
        axios.get(`${META_BASE}/${clientConfig.accountId}/insights`, {
          params: {
            fields: "campaign_name,spend,impressions,clicks,actions",
            date_preset: DATE_PRESETS.monthly || "last_30d",
            level: "campaign",
            access_token: clientConfig.token,
            limit: 10,
          },
          timeout: 20000,
        }).catch(() => ({ data: { data: [] } })),
      ]);

      const raw = insRes.data.data?.[0] || {};
      const m   = computeMetrics(raw);

      const campaigns = (campRes.data.data || []).map((c) => {
        const conv = (c.actions || [])
          .filter((a) => ["onsite_conversion.messaging_conversation_started_7d", "lead", "offsite_conversion.fb_pixel_lead"].includes(a.action_type))
          .reduce((s, a) => s + Number(a.value || 0), 0);
        return {
          name:       c.campaign_name || "—",
          gasto:      Number(c.spend || 0),
          impressoes: Number(c.impressions || 0),
          cliques:    Number(c.clicks || 0),
          conversas:  conv,
          cpl:        conv > 0 ? Number(c.spend || 0) / conv : null,
        };
      }).sort((a, b) => b.gasto - a.gasto).slice(0, 8);

      const prev  = getPreviousPeriodMetrics(clientId, "monthly");
      const delta = prev ? {
        gasto:     prev.gasto     > 0 ? ((m.gasto     - prev.gasto)     / prev.gasto)     * 100 : null,
        conversas: prev.conversas > 0 ? ((m.conversas - prev.conversas) / prev.conversas) * 100 : null,
        cpl:       prev.cpl       > 0 ? ((m.cpl       - prev.cpl)       / prev.cpl)       * 100 : null,
        cpm:       prev.cpm       > 0 ? ((m.cpm       - prev.cpm)       / prev.cpm)       * 100 : null,
      } : {};

      return { metrics: m, delta, campaigns };
    } catch (err) {
      console.error("[report/monthly] meta:", err.response?.data?.error?.message || err.message);
      return null;
    }
  };

  const fetchGoogle = async () => {
    if (!clientConfig.google_ads_customer_id || !process.env.GOOGLE_ADS_CLIENT_ID) return null;
    try {
      const [rows, campRows] = await Promise.all([
        queryGoogleAds(clientConfig.google_ads_customer_id, `
          SELECT metrics.cost_micros, metrics.impressions, metrics.clicks,
                 metrics.conversions, metrics.ctr, metrics.average_cpc,
                 metrics.average_cpm, metrics.search_impression_share
          FROM customer WHERE segments.date DURING LAST_MONTH
        `),
        queryGoogleAds(clientConfig.google_ads_customer_id, `
          SELECT campaign.name, metrics.cost_micros, metrics.impressions,
                 metrics.clicks, metrics.conversions, metrics.ctr
          FROM campaign
          WHERE segments.date DURING LAST_MONTH AND metrics.impressions > 0
          ORDER BY metrics.cost_micros DESC LIMIT 8
        `).catch(() => []),
      ]);

      if (!rows || rows.length === 0) return null;

      const gm   = computeGoogleMetrics(rows);
      const roas = targets.ticket_medio > 0 && gm.gasto > 0
        ? (gm.conversas * targets.ticket_medio) / gm.gasto : null;

      const campaigns = (campRows || []).map((r) => {
        const cm = r.metrics  || {};
        const cc = r.campaign || {};
        const g  = Number(cm.costMicros ?? cm.cost_micros ?? 0) / 1_000_000;
        const c  = Number(cm.conversions ?? 0);
        return {
          name:       cc.name || "—",
          gasto:      g,
          impressoes: Number(cm.impressions ?? 0),
          cliques:    Number(cm.clicks ?? 0),
          conversas:  c,
          cpl:        c > 0 ? g / c : null,
          ctr:        Number(cm.ctr ?? 0) * 100,
        };
      });

      return { metrics: { ...gm, roas }, campaigns };
    } catch (err) {
      console.error("[report/monthly] google:", err.message);
      return null;
    }
  };

  const fetchGmb = async () => {
    if (!clientConfig.gmb_location_id || !process.env.GMB_CLIENT_ID) return null;
    try {
      const freshClients  = loadClients();
      const freshLocation = freshClients[clientId]?.gmb_location_id || clientConfig.gmb_location_id;
      const { startDate, endDate } = getGmbDateRange("monthly");

      const [series, rvData] = await Promise.all([
        getGmbInsights(freshLocation, startDate, endDate),
        getGmbReviews(freshLocation, 5).catch(() => null),
      ]);

      const gmbMetrics = computeGmbMetrics(series);
      const reviews    = rvData
        ? { averageRating: Number(rvData.averageRating) || 0, totalReviewCount: rvData.totalReviewCount || 0 }
        : null;

      return { metrics: gmbMetrics, reviews };
    } catch (err) {
      console.error("[report/monthly] gmb:", err.message);
      return null;
    }
  };

  // Run all 3 in parallel
  const [metaData, googleData, gmbData] = await Promise.all([
    fetchMeta(),
    fetchGoogle(),
    fetchGmb(),
  ]);

  if (!metaData && !googleData && !gmbData) {
    return res.status(500).json({ error: "Nenhuma plataforma retornou dados. Verifique as credenciais e tente novamente." });
  }

  try {
    const html = buildMonthlyReportPage(
      clientConfig.name,
      clientConfig.emoji || "🏢",
      clientConfig.color || "#7c3aed",
      { metaData, googleData, gmbData, targets }
    );
    res.json({ html });
  } catch (buildErr) {
    console.error("[report/monthly] buildMonthlyReportPage threw:", buildErr);
    res.status(500).json({ error: `Erro ao montar o relatório: ${buildErr.message}` });
  }
});

// ─── SERVE REACT APP ──────────────────────────────────────────────────────────

app.use(express.static(join(__dirname, "dist")));

// SPA fallback (Express 5 requires named wildcard)
app.get("/*path", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ─── REPORT SCHEDULES ─────────────────────────────────────────────────────────
// NOTE: /api/report/monthly endpoint is defined ABOVE the SPA catch-all.

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

// ─── GMB STARTUP WARMUP ───────────────────────────────────────────────────────
// Resolves bare numeric gmb_location_id values to full "accounts/xxx/locations/yyy"
// paths on server start. Saves permanently to clients.json so subsequent restarts
// never need to call mybusinessaccountmanagement.googleapis.com again.
async function initGmbAccountCache() {
  const clients = loadClients();

  // Seed account name cache from any client that already has a full path saved.
  // This avoids calling mybusinessaccountmanagement.googleapis.com for upgrades.
  for (const c of Object.values(clients)) {
    if (/^accounts\/\d+\/locations\/\d+$/.test((c.gmb_location_id || "").trim())) {
      seedAccountNameFromFullPath(c.gmb_location_id);
      break;
    }
  }

  const needsUpgrade = Object.entries(clients).filter(([, c]) =>
    c.gmb_location_id && /^\d+$/.test((c.gmb_location_id || "").trim())
  );
  if (needsUpgrade.length === 0) return;
  try {
    const accountName = await getDefaultAccountName();
    let changed = false;
    for (const [clientId, config] of needsUpgrade) {
      const fullPath = `${accountName}/locations/${config.gmb_location_id.trim()}`;
      clients[clientId].gmb_location_id = fullPath;
      changed = true;
      console.log(`[gmb] Upgraded ${clientId}: ${config.gmb_location_id} → ${fullPath}`);
    }
    if (changed) saveClients(clients);
    console.log(`[gmb] initGmbAccountCache: upgraded ${needsUpgrade.length} location ID(s)`);
  } catch (err) {
    console.warn("[gmb] initGmbAccountCache failed (will retry on first GMB request):", err.message);
  }
}
initGmbAccountCache();

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
