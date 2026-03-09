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

const META_BASE = "https://graph.facebook.com/v19.0";

const DATE_PRESETS = {
  daily: "yesterday",
  weekly: "last_week_mon_sun",
  monthly: "last_month",
};

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

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export function metaApiPlugin() {
  return {
    name: "meta-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, "http://localhost");
        const path = url.pathname;
        const method = req.method;

        res.setHeader("Content-Type", "application/json");

        if (method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const json = (data, status = 200) => {
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };

        // Get authenticated user from JWT
        const getUser = () => verifyToken(req.headers["authorization"]);

        try {
          // ─── AUTH ──────────────────────────────────────────────
          if (path === "/api/auth/login" && method === "POST") {
            const body = await parseBody(req);
            const { username, password } = body;
            const ip = req.socket?.remoteAddress || "unknown";

            if (!checkRateLimit(ip)) {
              return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);
            }

            const users = loadUsers();
            const user = users[username];

            if (!user || !(await verifyPassword(password, user.password))) {
              return json({ error: "Usuário ou senha incorretos" }, 401);
            }

            const payload = {
              username,
              name: user.name,
              role: user.role,
              clientId: user.clientId || null,
            };

            return json({ token: signToken(payload), user: payload });
          }

          // ─── CLIENTS (public) ──────────────────────────────────
          if (path === "/api/clients" && method === "GET") {
            const clients = loadClients();
            const list = Object.entries(clients).map(([id, c]) => ({
              id,
              name: c.name,
              emoji: c.emoji,
              color: c.color,
            }));
            return json(list);
          }

          // ─── CONFIG (admin only) ───────────────────────────────
          if (path.startsWith("/api/config/")) {
            const user = getUser();
            if (!user || user.role !== "admin") {
              return json({ error: "Acesso negado" }, 403);
            }

            if (path === "/api/config/clients" && method === "GET") {
              const clients = loadClients();
              return json(Object.entries(clients).map(([id, c]) => ({ id, ...c })));
            }

            if (path === "/api/config/clients" && method === "POST") {
              const body = await parseBody(req);
              const { id, name, emoji, color, token: apiToken, accountId } = body;
              if (!id || !name || !apiToken || !accountId) {
                return json({ error: "id, name, token e accountId são obrigatórios" }, 400);
              }
              const clients = loadClients();
              if (clients[id]) return json({ error: "ID já existe" }, 409);

              clients[id] = {
                name,
                emoji: emoji || "🏢",
                color: color || "#6B7280",
                token: apiToken,
                accountId,
              };
              saveClients(clients);

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

              return json({ success: true, id, username, password: plainPassword });
            }

            const putMatch = path.match(/^\/api\/config\/clients\/(.+)$/);
            if (putMatch && method === "PUT") {
              const clientId = putMatch[1];
              const body = await parseBody(req);
              const clients = loadClients();
              if (!clients[clientId]) return json({ error: "Cliente não encontrado" }, 404);
              clients[clientId] = { ...clients[clientId], ...body };
              delete clients[clientId].id;
              saveClients(clients);
              return json({ success: true });
            }

            const deleteMatch = path.match(/^\/api\/config\/clients\/(.+)$/);
            if (deleteMatch && method === "DELETE") {
              const clientId = deleteMatch[1];
              const clients = loadClients();
              if (!clients[clientId]) return json({ error: "Cliente não encontrado" }, 404);
              delete clients[clientId];
              saveClients(clients);
              return json({ success: true });
            }

            if (path === "/api/config/test-connection" && method === "POST") {
              const body = await parseBody(req);
              const { token: apiToken, accountId } = body;
              if (!apiToken || !accountId) {
                return json({ error: "token e accountId são obrigatórios" }, 400);
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
                return json({ success: true, data: r.data.data?.[0] || null });
              } catch (err) {
                const metaErr = err.response?.data?.error;
                return json({ success: false, error: metaErr?.message || err.message }, 400);
              }
            }
          }

          // ─── INSIGHTS ──────────────────────────────────────────
          if (path === "/api/insights" && method === "GET") {
            const clientId = url.searchParams.get("client");
            const period = url.searchParams.get("period");
            const clients = loadClients();
            const clientConfig = clients[clientId];
            const datePreset = DATE_PRESETS[period];

            if (!clientConfig || !datePreset) {
              return json({ error: "Invalid client or period" }, 400);
            }

            const response = await axios.get(
              `${META_BASE}/${clientConfig.accountId}/insights`,
              {
                params: {
                  fields: "spend,impressions,clicks,reach,actions,cost_per_action_type",
                  date_preset: datePreset,
                  level: "account",
                  access_token: clientConfig.token,
                },
              }
            );

            const raw = response.data.data?.[0] || null;
            if (!raw) {
              return json({ hasData: false, client: clientConfig.name, period });
            }

            const gasto = parseFloat(raw.spend || 0);
            const impressoes = parseInt(raw.impressions || 0);
            const cliques = parseInt(raw.clicks || 0);
            const alcance = parseInt(raw.reach || 0);
            const { value: conversas, type: convType } = extractConversions(raw.actions);
            const cpl = conversas > 0 ? gasto / conversas : 0;
            const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
            const cpc = cliques > 0 ? gasto / cliques : 0;

            return json({
              hasData: true,
              client: clientConfig.name,
              clientId,
              period,
              convType,
              metrics: { gasto, impressoes, cliques, alcance, conversas, cpl, ctr, cpc },
            });
          }

          // ─── TREND ─────────────────────────────────────────────
          if (path === "/api/trend" && method === "GET") {
            const clientId = url.searchParams.get("client");
            const clients = loadClients();
            const clientConfig = clients[clientId];

            if (!clientConfig) return json({ error: "Invalid client" }, 400);

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

            return json({ hasData: days.length > 0, days });
          }

          // ─── ANOMALIES (admin only) ────────────────────────────
          if (path === "/api/anomalies" && method === "GET") {
            const user = getUser();
            if (!user || user.role !== "admin") {
              return json({ error: "Acesso negado" }, 403);
            }
            const clients = loadClients();
            const entries = Object.entries(clients);
            if (entries.length === 0) return json([]);

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
                  if (spend === 0 && impressions === 0) {
                    anomalies.push({ ...base, type: "parada", severity: "critical", message: "Campanha sem atividade ontem" });
                  } else if (spend > 15 && conversas === 0) {
                    anomalies.push({ ...base, type: "sem_conversas", severity: "warning",
                      message: `R$ ${spend.toFixed(2)} investidos sem conversas` });
                  }
                  return anomalies;
                } catch (err) {
                  const code = err.response?.data?.error?.code;
                  if (code === 190 || code === 100) {
                    return [{ ...base, type: "token", severity: "critical", message: "Token expirado ou inválido" }];
                  }
                  return [{ ...base, type: "erro", severity: "warning", message: "Não foi possível buscar dados" }];
                }
              })
            );

            const flat = results
              .filter((r) => r.status === "fulfilled")
              .flatMap((r) => r.value);
            return json(flat);
          }

          next();
        } catch (err) {
          const metaError = err.response?.data?.error;
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: metaError?.message || err.message,
              code: metaError?.code,
            })
          );
        }
      });
    },
  };
}
