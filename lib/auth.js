import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
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

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error(
    "\n❌  ERRO: JWT_SECRET não definido em produção!\n" +
      "   Execute: export JWT_SECRET=$(openssl rand -hex 32)\n"
  );
  process.exit(1);
}

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

// ─── FILE I/O ─────────────────────────────────────────────────────────────────

const DATA_DIR = process.env.DATA_DIR || resolve("config");

export function loadUsers() {
  return JSON.parse(readFileSync(resolve(DATA_DIR, "users.json"), "utf8"));
}

export function saveUsers(data) {
  writeFileSync(
    resolve(DATA_DIR, "users.json"),
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

export function loadClients() {
  return JSON.parse(readFileSync(resolve(DATA_DIR, "clients.json"), "utf8"));
}

export function saveClients(data) {
  writeFileSync(
    resolve(DATA_DIR, "clients.json"),
    JSON.stringify(data, null, 2),
    "utf8"
  );
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
