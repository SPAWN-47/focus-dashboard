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
} from "./lib/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const META_BASE = "https://graph.facebook.com/v19.0";

const DATE_PRESETS = {
  daily: "yesterday",
  weekly: "last_week_mon_sun",
  monthly: "last_month",
};

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
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://graph.facebook.com"],
      },
    },
  })
);

// Parse JSON body
app.use(express.json({ limit: "10kb" }));

// Rate limit on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: "Muitas tentativas. Aguarde 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

function extractConversions(actions = []) {
  const types = [
    "onsite_conversion.messaging_conversation_started_7d",
    "onsite_conversion.messaging_first_reply",
    "lead",
    "contact",
  ];
  for (const tipo of types) {
    const action = actions.find((a) => a.action_type === tipo);
    if (action && parseInt(action.value) > 0) {
      return { value: parseInt(action.value), type: tipo };
    }
  }
  const total = actions.reduce((sum, a) => {
    if (
      a.action_type.includes("message") ||
      a.action_type.includes("lead") ||
      a.action_type.includes("contact")
    ) {
      return sum + parseInt(a.value || 0);
    }
    return sum;
  }, 0);
  return { value: total, type: total > 0 ? "aggregate" : null };
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
  const { id, name, emoji, color, token: apiToken, accountId } = req.body || {};
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
  delete clients[req.params.id];
  saveClients(clients);
  res.json({ success: true });
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
  const { client: clientId, period } = req.query;
  const clients = loadClients();
  const clientConfig = clients[clientId];
  const datePreset = DATE_PRESETS[period];

  if (!clientConfig || !datePreset) {
    return res.status(400).json({ error: "Invalid client or period" });
  }

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

    const gasto = parseFloat(raw.spend || 0);
    const impressoes = parseInt(raw.impressions || 0);
    const cliques = parseInt(raw.clicks || 0);
    const alcance = parseInt(raw.reach || 0);
    const { value: conversas, type: convType } = extractConversions(
      raw.actions
    );
    const cpl = conversas > 0 ? gasto / conversas : 0;
    const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
    const cpc = cliques > 0 ? gasto / cliques : 0;

    res.json({
      hasData: true,
      client: clientConfig.name,
      clientId,
      period,
      convType,
      metrics: { gasto, impressoes, cliques, alcance, conversas, cpl, ctr, cpc },
    });
  } catch (err) {
    const metaErr = err.response?.data?.error;
    res.status(500).json({ error: metaErr?.message || err.message });
  }
});

// ─── TREND ────────────────────────────────────────────────────────────────────

app.get("/api/trend", async (req, res) => {
  const { client: clientId } = req.query;
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
      const { value: conversas } = extractConversions(d.actions);
      return {
        date: d.date_start,
        gasto: parseFloat(d.spend || 0),
        impressoes: parseInt(d.impressions || 0),
        cliques: parseInt(d.clicks || 0),
        alcance: parseInt(d.reach || 0),
        conversas,
      };
    });

    res.json({ hasData: days.length > 0, days });
  } catch (err) {
    const metaErr = err.response?.data?.error;
    res.status(500).json({ error: metaErr?.message || err.message });
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/health", (req, res) => res.json({ ok: true }));

// ─── SERVE REACT APP ──────────────────────────────────────────────────────────

app.use(express.static(join(__dirname, "dist")));

// SPA fallback (Express 5 requires named wildcard)
app.get("/*path", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n✅  Focus Dashboard rodando na porta ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn(
      "⚠️   JWT_SECRET não definido — usando secret padrão de desenvolvimento.\n" +
        "     Em produção: export JWT_SECRET=$(openssl rand -hex 32)\n"
    );
  }
});
