import { findUserById, updateUserById } from "../services/userService.js";

async function getUserProfile(req, res) {
  try {
    // O ID do usuário é extraído do token JWT pelo authMiddleware
    const userId = req.user.id;

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Remove a senha do objeto antes de enviá-lo na resposta
    const { senha, ...userProfile } = user;

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
}

async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Debug: log payload recebido
    console.info('[updateUserProfile] payload:', updateData);

    // Remove campos que não devem ser atualizados diretamente pelo usuário
    delete updateData.id_usuario;
    delete updateData.email; // O email geralmente requer um processo de verificação para ser alterado
    delete updateData.google_id;
    delete updateData.senha;
    delete updateData.data_criacao;

    // Sanitize campos esperados: CPF e telefone (remove qualquer caractere não numérico)
    if (updateData.cpf && typeof updateData.cpf === 'string') {
      updateData.cpf = updateData.cpf.replace(/\D/g, '');
    }
    if (updateData.telefone && typeof updateData.telefone === 'string') {
      updateData.telefone = updateData.telefone.replace(/\D/g, '');
    }

    let updatedUser;
    try {
      updatedUser = await updateUserById(userId, updateData);
    } catch (dbError) {
      console.error('[updateUserProfile] DB error:', dbError && dbError.code, dbError && dbError.sqlMessage || dbError.message);
      // Tratamento de erro de entrada duplicada (ex: CPF ou outro campo UNIQUE)
      if (dbError && dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Valor já cadastrado no sistema (provavelmente CPF ou outro campo único).' });
      }
      throw dbError; // rethrow para ser tratado no catch abaixo
    }

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const { senha, ...userProfile } = updatedUser;
    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
}

export { getUserProfile, updateUserProfile };
