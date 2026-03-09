/**
 * init-data.js
 * Initializes persistent data directory on first deploy.
 * If ADMIN_PASSWORD is set, always syncs the admin password (even on redeploy).
 *
 * On Railway: DATA_DIR=/data (persistent volume)
 * Locally: DATA_DIR is not set — skips entirely.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { resolve } from "path";
import { createRequire } from "module";

const DATA_DIR = process.env.DATA_DIR;

// Only run when DATA_DIR is set (production platform)
if (!DATA_DIR) {
  process.exit(0);
}

mkdirSync(DATA_DIR, { recursive: true });

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

// ─── clients.json ────────────────────────────────────────────────────────────

const clientsDest = resolve(DATA_DIR, "clients.json");
if (!existsSync(clientsDest)) {
  writeFileSync(clientsDest, "{}\n", "utf8");
  console.log("✅  Criado: clients.json (vazio)");
}

// ─── users.json ──────────────────────────────────────────────────────────────

const usersDest = resolve(DATA_DIR, "users.json");
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD;

if (!existsSync(usersDest)) {
  // First boot — create users.json
  const password = adminPassword || randomBytes(8).toString("hex");
  const hash = await bcrypt.hash(password, 10);

  const users = {
    [adminUsername]: { name: "Administrador", password: hash, role: "admin" },
  };
  writeFileSync(usersDest, JSON.stringify(users, null, 2), "utf8");

  if (adminPassword) {
    console.log(`✅  Admin criado com senha definida em ADMIN_PASSWORD.`);
  } else {
    console.log("\n" + "=".repeat(50));
    console.log("🔑  CREDENCIAIS INICIAIS DO ADMIN");
    console.log("=".repeat(50));
    console.log(`   Usuário: ${adminUsername}`);
    console.log(`   Senha:   ${password}`);
    console.log("=".repeat(50));
    console.log("⚠️   Anote esta senha — ela não será exibida novamente.\n");
  }
} else if (adminPassword) {
  // users.json exists but ADMIN_PASSWORD is set — update admin password
  const users = JSON.parse(readFileSync(usersDest, "utf8"));
  const hash = await bcrypt.hash(adminPassword, 10);

  if (!users[adminUsername]) {
    users[adminUsername] = { name: "Administrador", role: "admin" };
  }
  users[adminUsername].password = hash;
  writeFileSync(usersDest, JSON.stringify(users, null, 2), "utf8");
  console.log(`✅  Senha do admin "${adminUsername}" atualizada via ADMIN_PASSWORD.`);
} else {
  console.log("ℹ️   users.json já existe.");
}
