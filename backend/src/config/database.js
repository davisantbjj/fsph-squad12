import mysql from "mysql2/promise";
import "dotenv/config";

// Leitura estrita das variáveis de ambiente: não usar defaults em código.
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

// Valida presença das variáveis necessárias de DB — falha imediata para evitar comportamento indefinido
function validateDbEnv() {
  const missing = [];
  if (!DB_CONFIG.host) missing.push('DB_HOST');
  if (!DB_CONFIG.user) missing.push('DB_USER');
  if (!DB_CONFIG.password) missing.push('DB_PASS');
  if (!DB_CONFIG.database) missing.push('DB_NAME');
  if (missing.length > 0) {
    console.error('FATAL: Variáveis de ambiente do banco ausentes:', missing.join(', '));
    console.error('Defina essas variáveis no arquivo .env antes de iniciar o servidor.');
    process.exit(1);
  }
}

// Garante que o banco de dados exista antes de tentar conectar
async function ensureDatabaseExists() {
  const { host, user, password, database } = DB_CONFIG;
  let connection;
  try {
    // Conecta sem selecionar o banco para poder criá-lo
    connection = await mysql.createConnection({ host, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    // console.log(`Banco de dados '${database}' verificado/criado com sucesso.`);
  } catch (error) {
    console.error("Erro ao verificar/criar o banco de dados:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Cria o pool se não existir
async function initializePool() {
  if (!pool) {
      // valida env antes de qualquer tentativa de criar DB/Pool
      validateDbEnv();
      await ensureDatabaseExists();
      pool = mysql.createPool(DB_CONFIG);
  }
}

// Retorna o pool para executar queries diretamente
async function getConnection() {
  try {
    if (!pool) {
        await initializePool();
    }
    // Retorna o pool. Métodos como pool.query() gerenciam conexões automaticamente.
    // Se precisar de uma conexão dedicada (para transações), use pool.getConnection().
    return pool;
  } catch (error) {
    console.error("Não foi possível conectar ao banco de dados:", error);
    process.exit(1);
  }
}

export { getConnection };
