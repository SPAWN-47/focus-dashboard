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
  initDb,
} from "./lib/auth.js";
import * as dbModule from "./lib/db.js";
import {
  migrateFromJson,
  getCachedInsights,
  setCachedInsights,
  saveInsightHistory,
  getClient,
  getPreviousPeriodMetrics,
  logAnomaly,
  getAnomalyHistory,
  getRoiPlans,
  getRoiPlan,
  saveRoiPlan,
  deleteRoiPlan,
  createRoiPlanShareToken,
  revokeRoiPlanShareToken,
  getRoiPlanByShareToken,
} from "./lib/db.js";
import { META_BASE, DATE_PRESETS, extractConversions, computeMetrics } from "./lib/meta.js";

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
  // Initialize db once when plugin is loaded
  initDb(dbModule);
  migrateFromJson();

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

        const getUser = () => verifyToken(req.headers["authorization"]);

        const requireAuth = () => {
          const user = getUser();
          if (!user) { json({ error: "Não autenticado" }, 401); return null; }
          return user;
        };

        const requireAdmin = () => {
          const user = getUser();
          if (!user) { json({ error: "Não autenticado" }, 401); return null; }
          if (user.role !== "admin") { json({ error: "Acesso negado" }, 403); return null; }
          return user;
        };

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
            if (!requireAdmin()) return;

            if (path === "/api/config/clients" && method === "GET") {
              const clients = loadClients();
              return json(Object.entries(clients).map(([id, c]) => ({ id, ...c })));
            }

            if (path === "/api/config/clients" && method === "POST") {
              const body = await parseBody(req);
              const {
                id, name, emoji, color, token: apiToken, accountId,
                ticket_medio, target_cpl_max, target_conversas, target_spend,
              } = body;
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
                ticket_medio: parseFloat(ticket_medio) || 0,
                target_cpl_max: parseFloat(target_cpl_max) || 0,
                target_conversas: parseInt(target_conversas) || 0,
                target_spend: parseFloat(target_spend) || 0,
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

            const clientIdMatch = path.match(/^\/api\/config\/clients\/(.+)$/);
            if (clientIdMatch && method === "PUT") {
              const clientId = clientIdMatch[1];
              const body = await parseBody(req);
              const clients = loadClients();
              if (!clients[clientId]) return json({ error: "Cliente não encontrado" }, 404);
              const updated = { ...clients[clientId], ...body };
              delete updated.id;
              clients[clientId] = updated;
              saveClients(clients);
              return json({ success: true });
            }

            if (clientIdMatch && method === "DELETE") {
              const clientId = clientIdMatch[1];
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
                  params: { fields: "spend", date_preset: "yesterday", level: "account", access_token: apiToken },
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
            const user = requireAuth();
            if (!user) return;

            const clientId = url.searchParams.get("client");
            const period = url.searchParams.get("period");

            if (user.role === "client" && user.clientId !== clientId) {
              return json({ error: "Acesso negado" }, 403);
            }

            const clients = loadClients();
            const clientConfig = clients[clientId];
            const datePreset = DATE_PRESETS[period];

            if (!clientConfig || !datePreset) return json({ error: "Invalid client or period" }, 400);

            const cached = getCachedInsights(clientId, period);
            if (cached) return json({ ...cached, fromCache: true });

            const response = await axios.get(`${META_BASE}/${clientConfig.accountId}/insights`, {
              params: {
                fields: "spend,impressions,clicks,reach,actions,cost_per_action_type",
                date_preset: datePreset,
                level: "account",
                access_token: clientConfig.token,
              },
            });

            const raw = response.data.data?.[0] || null;
            if (!raw) return json({ hasData: false, client: clientConfig.name, period });

            const { gasto, impressoes, cliques, alcance, conversas, convType, cpl, ctr, cpc, cpm, frequencia } = computeMetrics(raw);

            const clientData = getClient(clientId);
            const roas = clientData?.ticket_medio > 0 && conversas > 0 && gasto > 0
              ? (conversas * clientData.ticket_medio) / gasto
              : null;

            const targets = {
              ticket_medio: clientData?.ticket_medio || 0,
              target_conversas: clientData?.target_conversas || 0,
              target_cpl_max: clientData?.target_cpl_max || 0,
              target_spend: clientData?.target_spend || 0,
            };

            const prev = getPreviousPeriodMetrics(clientId, period);
            const delta = prev ? {
              gasto: prev.gasto > 0 ? ((gasto - prev.gasto) / prev.gasto) * 100 : null,
              impressoes: prev.impressoes > 0 ? ((impressoes - prev.impressoes) / prev.impressoes) * 100 : null,
              cliques: prev.cliques > 0 ? ((cliques - prev.cliques) / prev.cliques) * 100 : null,
              conversas: prev.conversas > 0 ? ((conversas - prev.conversas) / prev.conversas) * 100 : null,
              cpl: prev.cpl > 0 ? ((cpl - prev.cpl) / prev.cpl) * 100 : null,
              cpm: prev.cpm > 0 ? ((cpm - prev.cpm) / prev.cpm) * 100 : null,
            } : null;

            const payload = {
              hasData: true, client: clientConfig.name, clientId, period, convType,
              targets, delta,
              metrics: { gasto, impressoes, cliques, alcance, conversas, cpl, ctr, cpc, cpm, frequencia, roas },
            };
            setCachedInsights(clientId, period, payload);
            return json(payload);
          }

          // ─── TREND ─────────────────────────────────────────────
          if (path === "/api/trend" && method === "GET") {
            const user = requireAuth();
            if (!user) return;

            const clientId = url.searchParams.get("client");
            if (user.role === "client" && user.clientId !== clientId) {
              return json({ error: "Acesso negado" }, 403);
            }

            const clients = loadClients();
            const clientConfig = clients[clientId];
            if (!clientConfig) return json({ error: "Invalid client" }, 400);

            const response = await axios.get(`${META_BASE}/${clientConfig.accountId}/insights`, {
              params: {
                fields: "spend,impressions,clicks,reach,actions",
                date_preset: "last_30d",
                level: "account",
                time_increment: 1,
                access_token: clientConfig.token,
              },
            });

            const days = (response.data.data || []).map((d) => {
              const m = computeMetrics(d);
              saveInsightHistory(clientId, d.date_start, m);
              return { date: d.date_start, gasto: m.gasto, impressoes: m.impressoes, cliques: m.cliques, alcance: m.alcance, conversas: m.conversas };
            });

            return json({ hasData: days.length > 0, days });
          }

          // ─── CAMPAIGNS ────────────────────────────────────────
          if (path === "/api/campaigns" && method === "GET") {
            const user = requireAuth();
            if (!user) return;

            const clientId = url.searchParams.get("client");
            const period = url.searchParams.get("period");
            if (user.role === "client" && user.clientId !== clientId) {
              return json({ error: "Acesso negado" }, 403);
            }

            const clients = loadClients();
            const clientConfig = clients[clientId];
            const datePreset = DATE_PRESETS[period] || "yesterday";
            if (!clientConfig) return json({ error: "Invalid client" }, 400);

            const response = await axios.get(`${META_BASE}/${clientConfig.accountId}/insights`, {
              params: {
                fields: "campaign_name,spend,impressions,clicks,reach,actions",
                date_preset: datePreset,
                level: "campaign",
                access_token: clientConfig.token,
              },
              timeout: 15000,
            });

            const campaigns = (response.data.data || []).map((d) => {
              const m = computeMetrics(d);
              return { name: d.campaign_name || "—", gasto: m.gasto, impressoes: m.impressoes, cliques: m.cliques, conversas: m.conversas, cpl: m.cpl, ctr: m.ctr, cpm: m.cpm };
            });
            campaigns.sort((a, b) => b.gasto - a.gasto);
            return json({ hasData: campaigns.length > 0, campaigns });
          }

          // ─── CREATIVES ────────────────────────────────────────
          if (path === "/api/creatives" && method === "GET") {
            const user = requireAuth();
            if (!user) return;

            const clientId = url.searchParams.get("client");
            const period = url.searchParams.get("period");
            if (user.role === "client" && user.clientId !== clientId) {
              return json({ error: "Acesso negado" }, 403);
            }

            const clients = loadClients();
            const clientConfig = clients[clientId];
            const datePreset = DATE_PRESETS[period] || "yesterday";
            if (!clientConfig) return json({ error: "Invalid client" }, 400);

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
                  // silent
                }
              })
            );

            return json({ hasData: top.length > 0, ads: top });
          }

          // ─── ANOMALIES (admin only) ────────────────────────────
          if (path === "/api/anomalies" && method === "GET") {
            if (!requireAdmin()) return;

            const clients = loadClients();
            const entries = Object.entries(clients);
            if (entries.length === 0) return json([]);

            const results = await Promise.allSettled(
              entries.map(async ([id, c]) => {
                const base = { clientId: id, name: c.name, emoji: c.emoji, color: c.color };
                try {
                  const r = await axios.get(`${META_BASE}/${c.accountId}/insights`, {
                    params: { fields: "spend,impressions,actions", date_preset: "yesterday", level: "account", access_token: c.token },
                    timeout: 10000,
                  });
                  const raw = r.data.data?.[0] || null;
                  if (!raw) return [{ ...base, type: "parada", severity: "critical", message: "Sem atividade registrada ontem" }];

                  const { gasto: spend, impressoes: impressions, conversas } = computeMetrics(raw);
                  const anomalies = [];
                  const spendThreshold = c.target_spend > 0 ? c.target_spend * 0.005 : 15;

                  if (spend === 0 && impressions === 0) {
                    const a = { ...base, type: "parada", severity: "critical", message: "Campanha sem atividade ontem" };
                    anomalies.push(a); logAnomaly(id, a.type, a.severity, a.message);
                  } else if (spend > spendThreshold && conversas === 0) {
                    const msg = `R$ ${spend.toFixed(2)} investidos sem conversas`;
                    const a = { ...base, type: "sem_conversas", severity: "warning", message: msg };
                    anomalies.push(a); logAnomaly(id, a.type, a.severity, a.message);
                  }

                  if (c.target_cpl_max > 0 && conversas > 0) {
                    const cpl = spend / conversas;
                    if (cpl > c.target_cpl_max) {
                      const msg = `CPL R$ ${cpl.toFixed(2)} acima do target R$ ${c.target_cpl_max.toFixed(2)}`;
                      anomalies.push({ ...base, type: "cpl_alto", severity: "warning", message: msg });
                      logAnomaly(id, "cpl_alto", "warning", msg);
                    }
                  }

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

            return json(results.filter((r) => r.status === "fulfilled").flatMap((r) => r.value));
          }

          // ─── ANOMALY HISTORY (admin only) ─────────────────────
          if (path === "/api/anomalies/history" && method === "GET") {
            if (!requireAdmin()) return;
            const limit = Math.min(parseInt(url.searchParams.get("limit")) || 100, 500);
            return json(getAnomalyHistory(limit));
          }

          // ─── ROI PLANS ───────────────────────────────────────────
          if (path === "/api/roi/plans" && method === "GET") {
            if (!requireAdmin()) return;
            const clientId = url.searchParams.get("client") || null;
            return json(getRoiPlans(clientId ? { clientId } : {}));
          }

          if (path === "/api/roi/plans" && method === "POST") {
            const user = requireAdmin();
            if (!user) return;
            try {
              const body = await parseBody(req);
              if (!body.nome || !body.parametros) {
                return json({ error: "Campos obrigatórios: nome, parametros" }, 400);
              }
              const id = saveRoiPlan(body, user.username || null);
              return json(getRoiPlan(id), 201);
            } catch (err) {
              return json({ error: err.message || "Falha ao salvar plano" }, 500);
            }
          }

          // Public share view — sem auth
          const shareMatch = path.match(/^\/api\/roi\/share\/([^/]+)$/);
          if (shareMatch && method === "GET") {
            const plan = getRoiPlanByShareToken(shareMatch[1]);
            if (!plan) return json({ error: "Plano não encontrado ou link revogado" }, 404);
            return json(plan);
          }

          // Share token management (admin)
          const shareMgmtMatch = path.match(/^\/api\/roi\/plans\/([^/]+)\/share$/);
          if (shareMgmtMatch) {
            const planId = shareMgmtMatch[1];
            if (method === "POST") {
              if (!requireAdmin()) return;
              const result = createRoiPlanShareToken(planId);
              if (!result) return json({ error: "Plano não encontrado" }, 404);
              return json(result, result.alreadyExisted ? 200 : 201);
            }
            if (method === "DELETE") {
              if (!requireAdmin()) return;
              revokeRoiPlanShareToken(planId);
              return json({ ok: true });
            }
          }

          // Match /api/roi/plans/:id (GET, PUT, DELETE)
          const roiPlanMatch = path.match(/^\/api\/roi\/plans\/([^/]+)$/);
          if (roiPlanMatch) {
            const planId = roiPlanMatch[1];

            if (method === "GET") {
              if (!requireAdmin()) return;
              const plan = getRoiPlan(planId);
              if (!plan) return json({ error: "Plano não encontrado" }, 404);
              return json(plan);
            }

            if (method === "PUT") {
              const user = requireAdmin();
              if (!user) return;
              const existing = getRoiPlan(planId);
              if (!existing) return json({ error: "Plano não encontrado" }, 404);
              try {
                const body = await parseBody(req);
                const merged = { ...existing, ...body, id: planId };
                saveRoiPlan(merged, user.username || null);
                return json(getRoiPlan(planId));
              } catch (err) {
                return json({ error: err.message || "Falha ao atualizar" }, 500);
              }
            }

            if (method === "DELETE") {
              if (!requireAdmin()) return;
              deleteRoiPlan(planId);
              return json({ ok: true });
            }
          }

          // ─── HEALTH ────────────────────────────────────────────
          if (path === "/health" && method === "GET") {
            const clients = loadClients();
            return json({ ok: true, clients: Object.keys(clients).length, env: "dev" });
          }

          next();
        } catch (err) {
          const metaError = err.response?.data?.error;
          res.statusCode = 500;
          res.end(JSON.stringify({ error: metaError?.message || err.message, code: metaError?.code }));
        }
      });
    },
  };
}
