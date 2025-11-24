import { getConnection } from "../config/database.js";
import initDB from "./init-db.js";
import fs from "fs";
import path from "path";
import "dotenv/config";

// ====================== CONFIGURAÇÕES ======================
const API_URL = "https://api.fsph.se.gov.br/apiinterface/estoque";
const SAVE_PATH = path.join(process.cwd(), "estoque.json");
// Intervalo de atualização em milissegundos (6 horas)
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000;
const SAVE_LOCAL = (process.env.SAVE_LOCAL || 'false').toLowerCase() === 'true';
// NOTE: Este script NÃO cria nem altera schema. A responsabilidade por criar/atualizar
// a estrutura do banco (tabelas, colunas) é do `init-db.js` / migrations.
// ============================================================

// Nota: não há função de criação/alteração de tabelas aqui.

// Insere ou atualiza os dados
async function inserirDados(dados, _retried = false) {
  const pool = await getConnection(); // Agora retorna o pool

  const sql = `
      INSERT INTO estoque (grupoabo, fatorrh, updated, situacao, cobertura)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        updated = VALUES(updated),
        situacao = VALUES(situacao),
        cobertura = VALUES(cobertura)
    `;

  const valores = dados.map(item => [
    item.grupoabo,
    item.fatorrh,
    new Date(item.updated).toISOString().slice(0, 19).replace("T", " "),
    item.situacao,
    item.cobertura,
  ]);

  try {
    const [resultado] = await pool.query(sql, [valores]);
    console.log(`Inseridos/Atualizados ${resultado.affectedRows} registros.`);
  } catch (erro) {
    // Se a tabela não existir, tente criar o schema via init-db e tente novamente uma vez
    const isNoSuchTable = erro && (erro.code === 'ER_NO_SUCH_TABLE' || /doesn't exist|no such table/i.test(erro.message || ''));
    if (isNoSuchTable && !_retried) {
      console.warn("Tabela 'estoque' ausente — executando init-db para aplicar schema e tentando novamente...");
      try {
        await initDB();
        // tenta inserir de novo uma vez
        await inserirDados(dados, true);
        return;
      } catch (initErr) {
        console.error('Falha ao executar init-db durante importacao:', initErr.message || initErr);
        return;
      }
    }

    // Caso contrário, apenas loga o erro
    console.error("Erro ao inserir dados:", erro.message || erro);
  }
  // NÃO chamar connection.release() aqui porque estamos usando pool.query() diretamente,
  // que gerencia a conexão internamente.
}

// Busca dados da API e salva localmente
async function fetchAndSave() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();

    if (SAVE_LOCAL) {
      fs.writeFileSync(
        SAVE_PATH,
        JSON.stringify({ data: data.data, updatedAt: new Date().toISOString() }, null, 2)
      );
    }

    console.log(`[${new Date().toLocaleString()}] Estoque atualizado com sucesso.`);
    return data.data;
  } catch (err) {
    console.error(`[${new Date().toLocaleString()}] Falha ao atualizar estoque:`, err.message);

    if (fs.existsSync(SAVE_PATH)) {
      const last = JSON.parse(fs.readFileSync(SAVE_PATH, "utf8"));
      console.log(`Usando última atualização salva: ${last.updatedAt}`);
      return last.data;
    } else {
      console.log("Nenhum estoque salvo disponível.");
      return null;
    }
  }
}

// Importação principal
async function importarEstoque() {
  const dados = await fetchAndSave();
  if (dados && Array.isArray(dados)) {
    await inserirDados(dados);
    // console.log("Importação concluída com sucesso!");
  } else {
    console.log("Nenhum dado para importar.");
  }
}

// Função que inicia o agendamento e executa imediatamente
function startImportSchedule() {
  console.log("Agendamento de atualização de estoque iniciado.");
  // execução imediata
  importarEstoque();
  // agendamento periódico
  const handle = setInterval(importarEstoque, UPDATE_INTERVAL);
  return () => clearInterval(handle);
}

// Se executado diretamente via CLI (node src/scripts/importarEstoque.js), inicia o scheduler
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  startImportSchedule();
}

export default startImportSchedule;
