import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  // Fail fast: token generation/verification without a secret is insecure
  console.error("FATAL: process.env.JWT_SECRET não está definida. Defina JWT_SECRET no seu .env antes de iniciar o servidor.");
}

/**
 * Gera um token JWT para um usuário.
 * @param {object} payload - Os dados para incluir no token (ex: id, nome).
 * @returns {string} - O token JWT gerado.
 */
function generateToken(payload) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET não configurada");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica a validade de um token JWT.
 * @param {string} token - O token JWT a ser verificado.
 * @returns {object | null} - O payload decodificado se o token for válido, senão null.
 */
function verifyToken(token) {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET não configurada — impossível verificar token.");
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Erro na verificação do token:", error.message);
    return null;
  }
}

export { generateToken, verifyToken };
