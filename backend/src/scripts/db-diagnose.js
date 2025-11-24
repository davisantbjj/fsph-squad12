import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- DB DIAGNOSE ---');
console.log(`DB_HOST=${process.env.DB_HOST || '<missing>'}`);
console.log(`DB_PORT=${process.env.DB_PORT || '<missing>'}`);
console.log(`DB_USER=${process.env.DB_USER || '<missing>'}`);
console.log(`DB_NAME=${process.env.DB_NAME || process.env.DB_DATABASE || '<missing>'}`);

async function tryConnect() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    });
    await conn.end();
    console.log('Conexão MySQL bem sucedida (credenciais aceitas).');
    process.exit(0);
  } catch (err) {
    console.error('Falha ao conectar ao MySQL:', err.message || err);
    process.exit(2);
  }
}

if (process.argv[1] && process.argv[1].endsWith('db-diagnose.js')) {
  tryConnect();
}

export default tryConnect;
