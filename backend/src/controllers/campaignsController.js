import { getConnection } from "../config/database.js";

// Função para listar as campanhas a partir do banco de dados
export const getCampaigns = async (req, res) => {
  try {
    const pool = await getConnection();
    const query = `
      SELECT
        id_campanha,
        nome_campanha,
        descricao,
        data_inicio,
        data_fim,
        local_campanha,
        cidade,
        estado,
        vagas_disponiveis,
        status_campanha
      FROM campanhas
      WHERE status_campanha IS NULL OR status_campanha = ?
      ORDER BY data_inicio DESC
    `;

    const [rows] = await pool.query(query, ["Ativa"]);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};
