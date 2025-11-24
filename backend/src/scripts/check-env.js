#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = [
  'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME',
  'JWT_SECRET'
];

const missing = required.filter(k => !process.env[k]);

if (missing.length > 0) {
  console.error('FATAL: variáveis de ambiente obrigatórias ausentes:', missing.join(', '));
  console.error('Por favor preencha o arquivo .env na raiz do backend com essas chaves.');
  process.exit(1);
}

console.log('OK: todas as variáveis de ambiente obrigatórias estão definidas.');
process.exit(0);
