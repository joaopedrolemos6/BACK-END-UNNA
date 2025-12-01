import { pool } from "../config/database";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

async function seedAdmin() {
  console.log("🌱 Iniciando Seed de Admin...");

  const adminEmail = "admin@unna.com";
  const adminPassword = "admin123456"; // Você pode mudar isso depois ou usar env
  const adminName = "Administrador UNNA";

  try {
    // 1. Verificar se já existe
    const [rows]: any = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [adminEmail]
    );

    if (rows.length > 0) {
      console.log("⚠ Usuário Admin já existe!");
      process.exit(0); // Sai com sucesso
    }

    // 2. Criar Hash da senha
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 3. Inserir no banco (Forçando a role ADMIN)
    await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
       VALUES (?, ?, ?, 'ADMIN', NOW(), NOW())`,
      [adminName, adminEmail, passwordHash]
    );

    console.log("✅ Usuário Admin criado com sucesso!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Senha: ${adminPassword}`);

  } catch (error) {
    console.error("❌ Erro ao criar admin:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedAdmin();