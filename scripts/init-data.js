/**
 * init-data.js
 * Copies initial config files to the persistent DATA_DIR on first deploy.
 * Run before starting the server: node scripts/init-data.js
 *
 * On Render: DATA_DIR=/data (persistent disk mounted at /data)
 * Locally: DATA_DIR is not set, so lib/auth.js uses config/ directly.
 */

import { existsSync, mkdirSync, copyFileSync } from "fs";
import { resolve } from "path";

const DATA_DIR = process.env.DATA_DIR;

// Only run when DATA_DIR is explicitly set (i.e., on Render)
if (!DATA_DIR) {
  process.exit(0);
}

const files = ["users.json", "clients.json"];
const sourceDir = resolve("config");

mkdirSync(DATA_DIR, { recursive: true });

for (const file of files) {
  const dest = resolve(DATA_DIR, file);
  const src = resolve(sourceDir, file);

  if (!existsSync(dest)) {
    if (existsSync(src)) {
      copyFileSync(src, dest);
      console.log(`✅  Copiado: ${file} → ${DATA_DIR}/${file}`);
    } else {
      console.error(`❌  Arquivo de origem não encontrado: ${src}`);
      process.exit(1);
    }
  } else {
    console.log(`ℹ️   Já existe: ${DATA_DIR}/${file} (nada a fazer)`);
  }
}
