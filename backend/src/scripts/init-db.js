import mysql from 'mysql2/promise';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config(); // lê o .env

// Corrige __dirname no ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho para o arquivo schema.sql
const schemaPath = join(__dirname, '../../db/schema.sql');

async function initDB() {
  try {
    // Conexão com MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      multipleStatements: true
    });

    // Lê o schema SQL
    let schema = fs.readFileSync(schemaPath, 'utf-8');

    // Normalize schema: remove/replace any CREATE DATABASE / USE statements inside the file
    // to ensure tables are created in the database configured by env (process.env.DB_NAME).
    // Remove any CREATE DATABASE ...; statements
    schema = schema.replace(/CREATE\s+DATABASE[\s\S]*?;\s*/gi, '');
    // Replace any USE ...; with USE `DB_NAME`;
    schema = schema.replace(/USE\s+[^;]+;\s*/gi, `USE \`${process.env.DB_NAME}\`;\n`);

    // Cria o banco se não existir (usando a configuração do ambiente)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    // Make CREATE TABLE statements idempotent by ensuring IF NOT EXISTS is present
    schema = schema.replace(/CREATE\s+TABLE(\s+IF\s+NOT\s+EXISTS)?/gi, 'CREATE TABLE IF NOT EXISTS');

    // Executa o schema (tabelas) no banco correto statement-by-statement
    // para podermos ignorar erros benignos como tabela já existente
    const statements = schema
      .split(/;\s*\n|;\s*$/g)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (e) {
        // Ignora erro de tabela já existente (caso o schema contenha CREATE sem IF NOT EXISTS)
        const msg = (e && e.message) ? e.message.toLowerCase() : '';
        if (msg.includes('already exists') || msg.includes('er_table_exists_error')) {
          console.warn('Aviso init-db: tabela já existe, pulando statement.');
          continue;
        }
        // Para outros erros, rethrow
        throw e;
      }
    }

    console.log('✅ Banco inicializado com sucesso!');
    await connection.end();
  } catch (err) {
    console.error(' Erro ao inicializar o banco:', err.message || err);
    // Propaga o erro para que o chamador (ex: server.js) saiba que a inicialização falhou
    throw err;
  }
}

// Exporta a função para uso programático (import) e também suporta execução CLI
export default initDB;

// Se executado diretamente via CLI (node src/scripts/init-db.js), chama initDB()
if (process.argv[1] === __filename) {
  initDB();
}
