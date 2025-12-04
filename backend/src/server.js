// ==========================
// SERVIDOR EXPRESS PRINCIPAL
// ==========================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";

// Carrega variáveis do .env
dotenv.config();

// Verifica configuração crítica
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET não encontrada nas variáveis de ambiente. Defina JWT_SECRET no arquivo .env antes de iniciar o servidor.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// MIDDLEWARES BÁSICOS
// ==========================
app.use(helmet());
app.use(cors());
// Aumenta o limite do body parser para permitir uploads base64 maiores (ex: PDFs)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ==========================
// ROTA DE VERIFICAÇÃO
// ==========================
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API FSPH Squad 12 está rodando 🚀" });
});

// ==========================
// ROTAS PRINCIPAIS
// ==========================
import routes from "./routes/index.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import estoqueRoutes from "./routes/estoque.js";
import profileRoutes from "./routes/profile.js";
import postsRoutes from "./routes/posts.js";
import campaignsRoutes from "./routes/campaigns.js";
import appointmentsRoutes from "./routes/appointments.js";
import historyRoutes from "./routes/history.js";
import rankingRoutes from "./routes/ranking.js";
import debugRoutes from "./routes/debug.js";
import authorizationRoutes from "./routes/authorization.js";
import uploadsRoutes from "./routes/uploads.js";

app.use("/api", routes);
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/estoque", estoqueRoutes);
app.use("/api/profile", profileRoutes);
// Serve uploads (fotos de perfil)
import fs from 'fs';
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.warn('Não foi possível criar uploads dir:', err.message);
}
app.use('/uploads', express.static(uploadsDir));
// Serve static docs (e.g. authorization PDF). The project `docs` folder may live
// in the repository root, not inside the `backend` folder when the server is
// started from `backend`. Try a list of candidate locations and serve the
// first one that exists.
// Try several likely locations for a top-level `docs` folder. We include
// process.cwd(), one level up, two levels up and three levels up to handle
// different working-directory setups when the server is launched.
const candidateDocs = [
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), '..', 'docs'),
  path.join(process.cwd(), '..', '..', 'docs'),
  path.join(process.cwd(), '..', '..', '..', 'docs'),
]
let servedDocsDir = null
for (const d of candidateDocs) {
  try {
    console.log('Checking docs candidate:', d)
    if (fs.existsSync(d)) {
      servedDocsDir = d
      break
    }
  } catch (err) {
    console.warn('Error while checking docs candidate', d, err && err.message)
  }
}
if (servedDocsDir) {
  app.use('/docs', express.static(servedDocsDir))
  console.log('Servindo /docs a partir de', servedDocsDir)
} else {
  console.warn('Aviso: nenhum diretório `docs` encontrado nas localizações esperadas. /docs ficará indisponível.')
}
app.use("/api/posts", postsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/uploads", uploadsRoutes);
// Dev debug route: returns raw header and decoded payload (does its own verification)
app.use("/api/debug", debugRoutes);
// Rota para download do modelo de autorização (ex: /authorization-model)
app.use("/authorization-model", authorizationRoutes);

// ==========================
// MIDDLEWARE GLOBAL DE ERRO
// ==========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno no servidor" });
});

// ===============================
// EXECUTA O SCRIPT DE ATUALIZAÇÃO DE FORMA SEGURA
// ===============================
import startImportSchedule from "./scripts/importarEstoque.js";
import initDB from "./scripts/init-db.js";

// Bootstrap: garante DB/tabelas, inicia scheduler e servidor
(async () => {
  try {
    // Garante que o banco e as tabelas definidas em db/schema.sql existam
    await initDB();
    console.log('Banco verificado/aplicado via init-db.');
  } catch (err) {
    console.warn('Atenção: falha ao garantir o schema do banco (init-db):', err.message || err);
    console.warn('O backend tentará continuar, mas a falta de tabelas pode causar erros em runtime.');
  }

  // ===========================================
  // FUNÇÃO PARA INICIAR O SERVIDOR COM TENTATIVAS
  // ===========================================
  function startServer(port = PORT, attempts = 5) {
    const server = app.listen(port, () => {
      console.log(`✅ Servidor rodando na porta ${port}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`⚠️ Porta ${port} ocupada.`);
        if (attempts > 0) {
          const nextPort = port + 1;
          console.log(`Tentando porta ${nextPort} (${attempts} tentativas restantes)...`);
          setTimeout(() => startServer(nextPort, attempts - 1), 500);
        } else {
          console.error("❌ Não foi possível iniciar o servidor: todas as portas tentadas estão ocupadas.");
          console.error("Se quiser liberar a porta 3000 rode no PowerShell:");
          console.error("  netstat -ano | findstr :3000");
          console.error("  taskkill /PID <pid> /F");
          process.exit(1);
        }
      } else {
        console.error("Erro no servidor:", err);
        process.exit(1);
      }
    });
  }

  try {
    await startImportSchedule();
    console.log("Script de atualização de estoque iniciado com sucesso.");
  } catch (err) {
    console.warn(`Atenção: Falha ao iniciar o script de estoque: ${err.message}`);
    console.warn("Isso pode ser esperado se o banco de dados não estiver disponível no momento da inicialização.");
  }

  // Finalmente inicia o servidor
  startServer();
})();

export default app;
