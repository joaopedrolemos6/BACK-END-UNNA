// src/config/database.ts

import mysql from "mysql2/promise"; 
import env from "./env"; 

// Configuração do Pool de Conexões MySQL
// É a maneira correta para um backend de e-commerce que precisa gerenciar várias requisições.
export const pool = mysql.createPool({
  // CORREÇÃO: Usando os nomes padronizados (DB_HOST, DB_USER, etc.)
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  
  // Opções de Pool recomendadas
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Nota: A variável DB_PASSWORD é opcional no seu schema do Zod, 
// o que é bom para ambientes sem senha (como testes ou dev local sem Docker).