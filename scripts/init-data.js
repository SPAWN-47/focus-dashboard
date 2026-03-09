/**
 * init-data.js
 * Initializes persistent data directory on first deploy.
 * Run before starting the server: node scripts/init-data.js
 *
 * On Railway/Render: DATA_DIR=/data (persistent volume)
 * Locally: DATA_DIR is not set — skips entirely.
 *
 * Env vars used for first-time admin setup:
 *   ADMIN_USERNAME  (default: "admin")
 *   ADMIN_PASSWORD  (required — set in Railway Variables)
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createRequire } from "module";

const DATA_DIR = process.env.DATA_DIR;

// Only run when DATA_DIR is explicitly set (i.e., on production platform)
if (!DATA_DIR) {
  process.exit(0);
}

mkdirSync(DATA_DIR, { recursive: true });

// ─── clients.json ────────────────────────────────────────────────────────────

const clientsDest = resolve(DATA_DIR, "clients.json");
if (!existsSync(clientsDest)) {
  writeFileSync(clientsDest, "{}\n", "utf8");
  console.log("✅  Criado: clients.json (vazio — adicione clientes pelo painel admin)");
} else {
  console.log("ℹ️   clients.json já existe.");
}

// ─── users.json ──────────────────────────────────────────────────────────────

const usersDest = resolve(DATA_DIR, "users.json");
if (!existsSync(usersDest)) {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error(
      "\n❌  ERRO: users.json não encontrado e ADMIN_PASSWORD não definido!\n" +
        "   Adicione a variável ADMIN_PASSWORD nas configurações do Railway.\n"
    );
    process.exit(1);
  }

  const require = createRequire(import.meta.url);
  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash(adminPassword, 10);

  const users = {
    [adminUsername]: {
      name: "Administrador",
      password: hash,
      role: "admin",
    },
  };

  writeFileSync(usersDest, JSON.stringify(users, null, 2), "utf8");
  console.log(`✅  Criado: users.json com usuário admin "${adminUsername}"`);
  console.log("⚠️   Altere a senha pelo painel assim que possível.");
} else {
  console.log("ℹ️   users.json já existe.");
}
