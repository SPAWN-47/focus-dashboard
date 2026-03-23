import { createRequire } from "module";

// Use createRequire so these CJS packages resolve correctly
// even when loaded from Vite's temp directory context
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─── JWT CONFIG ──────────────────────────────────────────────────────────────

const JWT_SECRET =
  process.env.JWT_SECRET || "focus-dev-secret-CHANGE-IN-PRODUCTION";
const JWT_EXPIRES = "7d";
const BCRYPT_ROUNDS = 10;

// ─── RATE LIMITING (in-memory) ───────────────────────────────────────────────

const loginAttempts = new Map(); // ip → { count, resetAt }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

export function checkRateLimit(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || now > rec.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX_ATTEMPTS) return false;
  rec.count++;
  return true;
}

// ─── DB-BACKED DATA ACCESS ────────────────────────────────────────────────────

// Lazy import to avoid circular dependency issues at module load time.
// db.js is imported on first call, not at module init.
let _db = null;
function db() {
  if (!_db) {
    // Dynamic require-style: use createRequire for synchronous ESM interop.
    // We cannot use top-level await here, so we do a synchronous workaround
    // by importing the already-initialized singleton via the module cache.
    // The actual import is handled by importing db.js functions directly below.
    const { getUsers, getUser, saveUser, getClients, getClient, saveClient, deleteClient, deleteUser } = _getDbModule();
    _db = { getUsers, getUser, saveUser, getClients, getClient, saveClient, deleteClient, deleteUser };
  }
  return _db;
}

// This function is replaced at runtime after the first call to avoid circular deps.
let _dbModule = null;
function _getDbModule() {
  if (!_dbModule) {
    throw new Error(
      "[auth] db module not yet initialized. Call initDb() before using auth data functions."
    );
  }
  return _dbModule;
}

/**
 * Call this once at app startup (after importing db.js) to inject the db module.
 * This avoids circular ESM dependency issues.
 */
export function initDb(dbModule) {
  _dbModule = dbModule;
}

export function loadUsers() {
  return _getDbModule().getUsers();
}

export function saveUsers(data) {
  const { saveUser } = _getDbModule();
  for (const [username, userData] of Object.entries(data)) {
    saveUser(username, userData);
  }
}

export function loadClients() {
  return _getDbModule().getClients();
}

export function saveClients(data) {
  const { saveClient } = _getDbModule();
  for (const [id, clientData] of Object.entries(data)) {
    saveClient(id, clientData);
  }
}

// ─── PASSWORD ─────────────────────────────────────────────────────────────────

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Supports both bcrypt hashes ($2a/b/y) and legacy plaintext
 * (for migration period — remove plaintext branch after migrating all users)
 */
export async function verifyPassword(plain, stored) {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(plain, stored);
  }
  // Legacy plaintext fallback
  return plain === stored;
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
