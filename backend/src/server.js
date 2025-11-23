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
  console.error("FATAL: JWT_SECRET não encontrada nas variáveis de ambiente. Crie um arquivo .env a partir de .env.example e defina JWT_SECRET antes de iniciar o servidor.");
  // Abort early para evitar aceitar/verificar tokens com fallback inseguro
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// MIDDLEWARES BÁSICOS
// ==========================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/posts", postsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ranking", rankingRoutes);
// Dev debug route: returns raw header e decoded payload (faz sua própria verificação)
app.use("/api/debug", debugRoutes);

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

// Envolve a chamada em uma função autoinvocada para não bloquear o event loop
(async () => {
  try {
    await startImportSchedule();
    console.log("Script de atualização de estoque iniciado com sucesso.");
  } catch (err) {
    console.warn(`Atenção: Falha ao iniciar o script de estoque: ${err.message}`);
    console.warn("Isso pode ser esperado se o banco de dados não estiver disponível no momento da inicialização.");
  }
})();

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

startServer();

export default app;
