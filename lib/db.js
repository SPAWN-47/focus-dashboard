/**
 * lib/db.js — SQLite data layer for Focus Dashboard
 *
 * Uses better-sqlite3 (synchronous API — no async/await needed).
 * DB file: DATA_DIR/dashboard.db
 */

import { createRequire } from "module";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

// ─── PATH ────────────────────────────────────────────────────────────────────

const DATA_DIR = process.env.DATA_DIR || resolve("config");
const DB_PATH = resolve(DATA_DIR, "dashboard.db");

// ─── SINGLETON ────────────────────────────────────────────────────────────────

let _db = null;

export function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      client_id TEXT
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '🏢',
      color TEXT DEFAULT '#6B7280',
      token TEXT NOT NULL,
      account_id TEXT NOT NULL,
      ticket_medio REAL DEFAULT 0,
      target_conversas INTEGER DEFAULT 0,
      target_cpl_max REAL DEFAULT 0,
      target_spend REAL DEFAULT 0,
      google_ads_customer_id TEXT,
      google_ads_token TEXT,
      ga4_property_id TEXT,
      ga4_token TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS insights_cache (
      client_id TEXT NOT NULL,
      period TEXT NOT NULL,
      data TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (client_id, period)
    );

    CREATE TABLE IF NOT EXISTS insights_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      date TEXT NOT NULL,
      spend REAL DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      conversas INTEGER DEFAULT 0,
      cpl REAL DEFAULT 0,
      ctr REAL DEFAULT 0,
      cpc REAL DEFAULT 0,
      UNIQUE(client_id, date)
    );

    CREATE TABLE IF NOT EXISTS anomaly_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      logged_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS report_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      email TEXT NOT NULL,
      period TEXT NOT NULL DEFAULT 'weekly',
      day_of_week INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      last_sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      operator TEXT NOT NULL,
      threshold REAL NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe migrations — add columns that may not exist yet
  try { _db.exec("ALTER TABLE clients ADD COLUMN notes TEXT DEFAULT ''"); } catch {}
  try { _db.exec("ALTER TABLE clients ADD COLUMN gmb_location_id TEXT"); } catch {}

  return _db;
}

// ─── SEED FROM COMMITTED FILE ────────────────────────────────────────────────

/**
 * Seeds clients from config/clients.seed.json ONLY when the DB has no clients at all.
 * This ensures fresh deploys start with base clients, but admin deletions are respected.
 */
export function seedClients() {
  const seedPath = resolve("config", "clients.seed.json");
  if (!existsSync(seedPath)) return;

  try {
    const db = getDb();
    const clients = JSON.parse(readFileSync(seedPath, "utf8"));

    // ── STEP 1: ALWAYS sync gmb_location_id & google_ads_customer_id from seed
    // into existing rows where those fields are NULL.
    // (INSERT OR IGNORE skips existing rows, so this is the only way to backfill
    //  these IDs when they were added to the seed after the initial deploy.)
    const syncIds = db.prepare(`
      UPDATE clients
      SET
        gmb_location_id        = COALESCE(gmb_location_id, NULLIF(@gmb_location_id, '')),
        google_ads_customer_id = COALESCE(google_ads_customer_id, NULLIF(@google_ads_customer_id, ''))
      WHERE id = @id
        AND (gmb_location_id IS NULL OR google_ads_customer_id IS NULL)
    `);
    const syncAll = db.transaction((entries) => {
      for (const [id, c] of entries) {
        syncIds.run({
          id,
          gmb_location_id:        c.gmb_location_id || "",
          google_ads_customer_id: c.google_ads_customer_id || "",
        });
      }
    });
    syncAll(Object.entries(clients));

    // ── STEP 2: Only seed when there are zero clients (fresh DB / first deploy)
    const count = db.prepare("SELECT COUNT(*) as n FROM clients").get();
    if (count.n > 0) return;

    const insert = db.prepare(`
      INSERT OR IGNORE INTO clients
        (id, name, emoji, color, token, account_id, google_ads_customer_id, gmb_location_id)
      VALUES
        (@id, @name, @emoji, @color, @token, @account_id, @google_ads_customer_id, @gmb_location_id)
    `);
    const seed = db.transaction((entries) => {
      for (const [id, c] of entries) {
        insert.run({
          id,
          name: c.name || id,
          emoji: c.emoji || "🏢",
          color: c.color || "#6B7280",
          token: c.token || "placeholder",
          account_id: c.accountId || c.account_id || "0",
          google_ads_customer_id: c.google_ads_customer_id || null,
          gmb_location_id: c.gmb_location_id || null,
        });
      }
    });
    seed(Object.entries(clients));
    console.log(`  [db] Seeded ${Object.keys(clients).length} clients from clients.seed.json`);

  } catch (err) {
    console.warn("  [db] Could not seed clients:", err.message);
  }
}

// ─── MIGRATION FROM JSON ──────────────────────────────────────────────────────

export function migrateFromJson() {
  const db = getDb();

  // Migrate users.json
  const usersPath = resolve(DATA_DIR, "users.json");
  if (existsSync(usersPath)) {
    try {
      const users = JSON.parse(readFileSync(usersPath, "utf8"));
      const insert = db.prepare(`
        INSERT OR IGNORE INTO users (username, name, password, role, client_id)
        VALUES (@username, @name, @password, @role, @client_id)
      `);
      const insertMany = db.transaction((entries) => {
        for (const [username, u] of entries) {
          insert.run({
            username,
            name: u.name || username,
            password: u.password || "",
            role: u.role || "client",
            client_id: u.clientId || null,
          });
        }
      });
      insertMany(Object.entries(users));
      console.log("  [db] users.json migrated to SQLite");
    } catch (err) {
      console.warn("  [db] Could not migrate users.json:", err.message);
    }
  }

  // Migrate clients.json
  const clientsPath = resolve(DATA_DIR, "clients.json");
  if (existsSync(clientsPath)) {
    try {
      const clients = JSON.parse(readFileSync(clientsPath, "utf8"));
      const insert = db.prepare(`
        INSERT OR IGNORE INTO clients
          (id, name, emoji, color, token, account_id,
           ticket_medio, target_conversas, target_cpl_max, target_spend)
        VALUES
          (@id, @name, @emoji, @color, @token, @account_id,
           @ticket_medio, @target_conversas, @target_cpl_max, @target_spend)
      `);
      const insertMany = db.transaction((entries) => {
        for (const [id, c] of entries) {
          insert.run({
            id,
            name: c.name || id,
            emoji: c.emoji || "🏢",
            color: c.color || "#6B7280",
            token: c.token || "",
            account_id: c.accountId || c.account_id || "",
            ticket_medio: c.ticket_medio || 0,
            target_conversas: c.target_conversas || 0,
            target_cpl_max: c.target_cpl_max || 0,
            target_spend: c.target_spend || 0,
          });
        }
      });
      insertMany(Object.entries(clients));
      console.log("  [db] clients.json migrated to SQLite");
    } catch (err) {
      console.warn("  [db] Could not migrate clients.json:", err.message);
    }
  }
}

// ─── USER CRUD ────────────────────────────────────────────────────────────────

export function getUsers() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM users").all();
  const result = {};
  for (const row of rows) {
    result[row.username] = {
      name: row.name,
      password: row.password,
      role: row.role,
      clientId: row.client_id || undefined,
    };
  }
  return result;
}

export function getUser(username) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!row) return null;
  return {
    name: row.name,
    password: row.password,
    role: row.role,
    clientId: row.client_id || undefined,
  };
}

export function saveUser(username, data) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (username, name, password, role, client_id)
    VALUES (@username, @name, @password, @role, @client_id)
    ON CONFLICT(username) DO UPDATE SET
      name = excluded.name,
      password = excluded.password,
      role = excluded.role,
      client_id = excluded.client_id
  `).run({
    username,
    name: data.name || username,
    password: data.password || "",
    role: data.role || "client",
    client_id: data.clientId || null,
  });
}

export function deleteUser(username) {
  const db = getDb();
  db.prepare("DELETE FROM users WHERE username = ?").run(username);
}

// ─── CLIENT CRUD ──────────────────────────────────────────────────────────────

function rowToClient(row) {
  if (!row) return null;
  return {
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    token: row.token,
    accountId: row.account_id,
    ticket_medio: row.ticket_medio,
    target_conversas: row.target_conversas,
    target_cpl_max: row.target_cpl_max,
    target_spend: row.target_spend,
    google_ads_customer_id: row.google_ads_customer_id || undefined,
    google_ads_token: row.google_ads_token || undefined,
    ga4_property_id: row.ga4_property_id || undefined,
    ga4_token: row.ga4_token || undefined,
    gmb_location_id: row.gmb_location_id || undefined,
    notes: row.notes || "",
  };
}

export function updateClientNotes(id, notes) {
  const db = getDb();
  db.prepare("UPDATE clients SET notes = ? WHERE id = ?").run(notes || "", id);
}

export function getClients() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM clients").all();
  const result = {};
  for (const row of rows) {
    result[row.id] = rowToClient(row);
  }
  return result;
}

export function getClient(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  return rowToClient(row);
}

export function saveClient(id, data) {
  const db = getDb();
  db.prepare(`
    INSERT INTO clients
      (id, name, emoji, color, token, account_id,
       ticket_medio, target_conversas, target_cpl_max, target_spend,
       google_ads_customer_id, google_ads_token, ga4_property_id, ga4_token,
       gmb_location_id)
    VALUES
      (@id, @name, @emoji, @color, @token, @account_id,
       @ticket_medio, @target_conversas, @target_cpl_max, @target_spend,
       @google_ads_customer_id, @google_ads_token, @ga4_property_id, @ga4_token,
       @gmb_location_id)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      emoji = excluded.emoji,
      color = excluded.color,
      token = excluded.token,
      account_id = excluded.account_id,
      ticket_medio = excluded.ticket_medio,
      target_conversas = excluded.target_conversas,
      target_cpl_max = excluded.target_cpl_max,
      target_spend = excluded.target_spend,
      google_ads_customer_id = excluded.google_ads_customer_id,
      google_ads_token = excluded.google_ads_token,
      ga4_property_id = excluded.ga4_property_id,
      ga4_token = excluded.ga4_token,
      gmb_location_id = excluded.gmb_location_id
  `).run({
    id,
    name: data.name || id,
    emoji: data.emoji || "🏢",
    color: data.color || "#6B7280",
    token: data.token || "",
    account_id: data.accountId || data.account_id || "",
    ticket_medio: data.ticket_medio ?? 0,
    target_conversas: data.target_conversas ?? 0,
    target_cpl_max: data.target_cpl_max ?? 0,
    target_spend: data.target_spend ?? 0,
    google_ads_customer_id: data.google_ads_customer_id || null,
    google_ads_token: data.google_ads_token || null,
    ga4_property_id: data.ga4_property_id || null,
    ga4_token: data.ga4_token || null,
    gmb_location_id: data.gmb_location_id || null,
  });
}

export function updateClient(id, data) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  if (!existing) return;

  // Merge only the provided fields
  const merged = {
    id,
    name: data.name ?? existing.name,
    emoji: data.emoji ?? existing.emoji,
    color: data.color ?? existing.color,
    token: data.token ?? existing.token,
    account_id: data.accountId ?? data.account_id ?? existing.account_id,
    ticket_medio: data.ticket_medio ?? existing.ticket_medio,
    target_conversas: data.target_conversas ?? existing.target_conversas,
    target_cpl_max: data.target_cpl_max ?? existing.target_cpl_max,
    target_spend: data.target_spend ?? existing.target_spend,
    google_ads_customer_id: data.google_ads_customer_id ?? existing.google_ads_customer_id,
    google_ads_token: data.google_ads_token ?? existing.google_ads_token,
    ga4_property_id: data.ga4_property_id ?? existing.ga4_property_id,
    ga4_token: data.ga4_token ?? existing.ga4_token,
    gmb_location_id: data.gmb_location_id ?? existing.gmb_location_id,
  };

  db.prepare(`
    UPDATE clients SET
      name = @name, emoji = @emoji, color = @color, token = @token,
      account_id = @account_id, ticket_medio = @ticket_medio,
      target_conversas = @target_conversas, target_cpl_max = @target_cpl_max,
      target_spend = @target_spend,
      google_ads_customer_id = @google_ads_customer_id,
      google_ads_token = @google_ads_token,
      ga4_property_id = @ga4_property_id,
      ga4_token = @ga4_token,
      gmb_location_id = @gmb_location_id
    WHERE id = @id
  `).run(merged);
}

export function deleteClient(id) {
  const db = getDb();
  db.prepare("DELETE FROM clients WHERE id = ?").run(id);
}

// ─── INSIGHTS CACHE ───────────────────────────────────────────────────────────

// Yesterday data is static after Meta processes it — cache longer
const CACHE_TTL = {
  daily: 60 * 60 * 1000,         // 1 hour
  weekly: 6 * 60 * 60 * 1000,    // 6 hours
  monthly: 12 * 60 * 60 * 1000,  // 12 hours
  default: 60 * 60 * 1000,
};

export function getCachedInsights(clientId, period) {
  const db = getDb();
  const row = db
    .prepare("SELECT data, fetched_at FROM insights_cache WHERE client_id = ? AND period = ?")
    .get(clientId, period);

  if (!row) return null;

  const ttl = CACHE_TTL[period] ?? CACHE_TTL.default;
  const age = Date.now() - new Date(row.fetched_at).getTime();
  if (age > ttl) return null;

  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export function setCachedInsights(clientId, period, data) {
  const db = getDb();
  db.prepare(`
    INSERT INTO insights_cache (client_id, period, data, fetched_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(client_id, period) DO UPDATE SET
      data = excluded.data,
      fetched_at = excluded.fetched_at
  `).run(clientId, period, JSON.stringify(data), new Date().toISOString());
}

// ─── INSIGHTS HISTORY ─────────────────────────────────────────────────────────

export function saveInsightHistory(clientId, date, metrics) {
  const db = getDb();
  db.prepare(`
    INSERT INTO insights_history
      (client_id, date, spend, impressions, clicks, reach, conversas, cpl, ctr, cpc)
    VALUES
      (@client_id, @date, @spend, @impressions, @clicks, @reach, @conversas, @cpl, @ctr, @cpc)
    ON CONFLICT(client_id, date) DO UPDATE SET
      spend = excluded.spend,
      impressions = excluded.impressions,
      clicks = excluded.clicks,
      reach = excluded.reach,
      conversas = excluded.conversas,
      cpl = excluded.cpl,
      ctr = excluded.ctr,
      cpc = excluded.cpc
  `).run({
    client_id: clientId,
    date,
    spend: metrics.gasto ?? metrics.spend ?? 0,
    impressions: metrics.impressoes ?? metrics.impressions ?? 0,
    clicks: metrics.cliques ?? metrics.clicks ?? 0,
    reach: metrics.alcance ?? metrics.reach ?? 0,
    conversas: metrics.conversas ?? 0,
    cpl: metrics.cpl ?? 0,
    ctr: metrics.ctr ?? 0,
    cpc: metrics.cpc ?? 0,
  });
}

export function getInsightHistory(clientId, days = 30) {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  return db
    .prepare(`
      SELECT date, spend, impressions, clicks, reach, conversas, cpl, ctr, cpc
      FROM insights_history
      WHERE client_id = ? AND date >= ?
      ORDER BY date ASC
    `)
    .all(clientId, sinceStr);
}

// ─── ANOMALY LOG ──────────────────────────────────────────────────────────────

export function logAnomaly(clientId, type, severity, message) {
  const db = getDb();
  db.prepare(`
    INSERT INTO anomaly_log (client_id, type, severity, message)
    VALUES (?, ?, ?, ?)
  `).run(clientId, type, severity, message);
}

export function getAnomalyHistory(limit = 100) {
  const db = getDb();
  return db
    .prepare(`
      SELECT a.*, c.name as client_name, c.emoji, c.color
      FROM anomaly_log a
      LEFT JOIN clients c ON c.id = a.client_id
      ORDER BY a.logged_at DESC
      LIMIT ?
    `)
    .all(limit);
}

export function getLastCollectionTime() {
  const db = getDb();
  const row = db
    .prepare("SELECT MAX(fetched_at) as last FROM insights_cache")
    .get();
  return row?.last || null;
}

// ─── PERIOD COMPARISON ────────────────────────────────────────────────────────

export function getPreviousPeriodMetrics(clientId, period) {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d) => d.toISOString().split("T")[0];

  let startDate, endDate;
  if (period === "daily") {
    const d = new Date(today);
    d.setDate(d.getDate() - 2); // day before yesterday
    startDate = endDate = fmt(d);
  } else if (period === "weekly") {
    const end = new Date(today);
    end.setDate(end.getDate() - 8); // end of previous week
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    startDate = fmt(start);
    endDate = fmt(end);
  } else {
    const end = new Date(today);
    end.setDate(end.getDate() - 32); // end of previous month window
    const start = new Date(end);
    start.setDate(start.getDate() - 27);
    startDate = fmt(start);
    endDate = fmt(end);
  }

  const rows = db
    .prepare(`
      SELECT spend, impressions, clicks, reach, conversas
      FROM insights_history
      WHERE client_id = ? AND date >= ? AND date <= ?
    `)
    .all(clientId, startDate, endDate);

  if (rows.length === 0) return null;

  const agg = rows.reduce(
    (a, r) => ({
      gasto: a.gasto + r.spend,
      impressoes: a.impressoes + r.impressions,
      cliques: a.cliques + r.clicks,
      alcance: a.alcance + r.reach,
      conversas: a.conversas + r.conversas,
    }),
    { gasto: 0, impressoes: 0, cliques: 0, alcance: 0, conversas: 0 }
  );

  agg.cpl = agg.conversas > 0 ? agg.gasto / agg.conversas : 0;
  agg.ctr = agg.impressoes > 0 ? (agg.cliques / agg.impressoes) * 100 : 0;
  agg.cpm = agg.impressoes > 0 ? (agg.gasto / agg.impressoes) * 1000 : 0;
  return agg;
}

// ─── STATISTICAL ANOMALY SUPPORT ─────────────────────────────────────────────

export function getRecentCplStats(clientId, days = 14) {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const rows = db
    .prepare(`
      SELECT cpl FROM insights_history
      WHERE client_id = ? AND date >= ? AND spend > 0 AND cpl > 0
      ORDER BY date ASC
    `)
    .all(clientId, sinceStr);

  if (rows.length < 3) return null;

  const cpls = rows.map((r) => r.cpl);
  const mean = cpls.reduce((a, b) => a + b, 0) / cpls.length;
  const variance = cpls.reduce((a, b) => a + (b - mean) ** 2, 0) / cpls.length;
  const stddev = Math.sqrt(variance);
  return { mean, stddev, count: cpls.length };
}

// ─── REPORT SCHEDULES ─────────────────────────────────────────────────────────

export function getSchedules() {
  const db = getDb();
  return db.prepare("SELECT * FROM report_schedules ORDER BY created_at DESC").all();
}

export function getSchedulesByClient(clientId) {
  const db = getDb();
  return db.prepare("SELECT * FROM report_schedules WHERE client_id = ?").all(clientId);
}

export function saveSchedule({ clientId, email, period, dayOfWeek }) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO report_schedules (client_id, email, period, day_of_week)
    VALUES (?, ?, ?, ?)
  `).run(clientId, email, period, dayOfWeek);
  return result.lastInsertRowid;
}

export function updateScheduleActive(id, active) {
  const db = getDb();
  db.prepare("UPDATE report_schedules SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}

export function deleteSchedule(id) {
  const db = getDb();
  db.prepare("DELETE FROM report_schedules WHERE id = ?").run(id);
}

export function markScheduleSent(id) {
  const db = getDb();
  db.prepare("UPDATE report_schedules SET last_sent_at = datetime('now') WHERE id = ?").run(id);
}

// ─── ALERT RULES ──────────────────────────────────────────────────────────────

export function getAlertRules(clientId) {
  const db = getDb();
  const q = clientId
    ? db.prepare("SELECT * FROM alert_rules WHERE client_id = ? ORDER BY created_at DESC")
    : db.prepare("SELECT * FROM alert_rules ORDER BY created_at DESC");
  return clientId ? q.all(clientId) : q.all();
}

export function saveAlertRule({ clientId, metric, operator, threshold, severity }) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO alert_rules (client_id, metric, operator, threshold, severity)
    VALUES (?, ?, ?, ?, ?)
  `).run(clientId, metric, operator, Number(threshold), severity);
  return result.lastInsertRowid;
}

export function updateAlertRuleActive(id, active) {
  const db = getDb();
  db.prepare("UPDATE alert_rules SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}

export function deleteAlertRule(id) {
  const db = getDb();
  db.prepare("DELETE FROM alert_rules WHERE id = ?").run(id);
}

export function getSchedulesDueToday() {
  const db = getDb();
  const todayDow = new Date().getDay(); // 0 = Sunday
  return db.prepare(`
    SELECT * FROM report_schedules
    WHERE active = 1
    AND day_of_week = ?
    AND (last_sent_at IS NULL OR date(last_sent_at) < date('now'))
  `).all(todayDow);
}
