/**
 * migrate-passwords.js
 * Hashes all plaintext passwords in config/users.json using bcrypt.
 * Run once before going to production:
 *   node scripts/migrate-passwords.js
 */

import { loadUsers, saveUsers, hashPassword } from "../lib/auth.js";

async function migrate() {
  const users = loadUsers();
  let count = 0;

  for (const [username, user] of Object.entries(users)) {
    if (!user.password.startsWith("$2")) {
      console.log(`  Hashing: ${username}`);
      user.password = await hashPassword(user.password);
      count++;
    } else {
      console.log(`  Already hashed: ${username}`);
    }
  }

  if (count > 0) {
    saveUsers(users);
    console.log(`\n✅  ${count} senha(s) convertida(s) para bcrypt.`);
  } else {
    console.log("\n✅  Todas as senhas já estão com hash. Nada a fazer.");
  }
}

migrate().catch((err) => {
  console.error("Erro na migração:", err.message);
  process.exit(1);
});
