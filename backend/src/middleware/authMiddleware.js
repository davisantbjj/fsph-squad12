import jwt from "jsonwebtoken";
import "dotenv/config";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Debug: log the incoming Authorization header to help diagnose invalid token issues
  try {
    console.warn('[authMiddleware] Authorization header received:', authHeader);
  } catch (e) {
    // ignore logging errors
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acesso negado. Nenhum token fornecido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[authMiddleware] JWT_SECRET não encontrada no ambiente. Verifique seu .env.');
      return res.status(500).json({ error: 'Configuração do servidor inválida.' });
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Adiciona o payload do token (id, nome, email) ao request
    next();
  } catch (error) {
    console.warn('[authMiddleware] token verification error:', error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado." });
    }
    return res.status(401).json({ error: "Token inválido." });
  }
}

export default authMiddleware;
