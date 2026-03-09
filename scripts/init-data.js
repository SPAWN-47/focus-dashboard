/**
 * init-data.js
 * Initializes persistent data directory on first deploy.
 * Run before starting the server: node scripts/init-data.js
 *
 * On Railway: DATA_DIR=/data (persistent volume mounted at /data)
 * Locally: DATA_DIR is not set — skips entirely.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { resolve } from "path";
import { createRequire } from "module";

const DATA_DIR = process.env.DATA_DIR;

// Only run when DATA_DIR is set (production platform)
if (!DATA_DIR) {
  process.exit(0);
}

mkdirSync(DATA_DIR, { recursive: true });

// ─── clients.json ────────────────────────────────────────────────────────────

const clientsDest = resolve(DATA_DIR, "clients.json");
if (!existsSync(clientsDest)) {
  writeFileSync(clientsDest, "{}\n", "utf8");
  console.log("✅  Criado: clients.json (vazio)");
} else {
  console.log("ℹ️   clients.json já existe.");
}

// ─── users.json ──────────────────────────────────────────────────────────────

const usersDest = resolve(DATA_DIR, "users.json");
if (!existsSync(usersDest)) {
  const require = createRequire(import.meta.url);
  const bcrypt = require("bcryptjs");

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = randomBytes(8).toString("hex"); // e.g. "a3f2c1d4e5b6a7f8"
  const hash = await bcrypt.hash(password, 10);

  const users = {
    [username]: {
      name: "Administrador",
      password: hash,
      role: "admin",
    },
  };

  writeFileSync(usersDest, JSON.stringify(users, null, 2), "utf8");

  console.log("\n" + "=".repeat(50));
  console.log("🔑  CREDENCIAIS INICIAIS DO ADMIN");
  console.log("=".repeat(50));
  console.log(`   Usuário: ${username}`);
  console.log(`   Senha:   ${password}`);
  console.log("=".repeat(50));
  console.log("⚠️   Anote esta senha — ela não será exibida novamente.\n");
} else {
  console.log("ℹ️   users.json já existe.");
}
