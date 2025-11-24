import { getConnection } from "../config/database.js";

export async function getHistory(req, res) {
  const pool = await getConnection();
  try {
    const { id } = req.user;

    // Busca doações realizadas (confirmadas)
    const [doacoes] = await pool.query(
        `SELECT
            id_doacao as id,
            data_doacao as date,
            local_doacao as local,
            'Doação Realizada' as type,
            volume_coletado
         FROM doacoes
         WHERE id_usuario = ?
         ORDER BY data_doacao DESC`,
        [id]
    );

    // Busca agendamentos (futuros e passados)
    const [agendamentos] = await pool.query(
        `SELECT
            id_agendamento as id,
            data_agendamento as date,
            local_agendamento as local,
            CONCAT('Agendamento - ', status_agendamento) as type
         FROM agendamentos
         WHERE id_usuario = ?
         ORDER BY data_agendamento DESC`,
        [id]
    );

    // Unifica e ordena
    // Normaliza datas para ISO antes de unificar
    // Normalize dates to ISO-like without timezone suffix (YYYY-MM-DDTHH:mm:ss)
    const normDoacoes = doacoes.map(d => {
      let dateStr = null;
      if (d.date instanceof Date) {
        const D = d.date;
        const YYYY = D.getFullYear();
        const MM = String(D.getMonth() + 1).padStart(2, '0');
        const DD = String(D.getDate()).padStart(2, '0');
        const hh = String(D.getHours()).padStart(2, '0');
        const mm = String(D.getMinutes()).padStart(2, '0');
        const ss = String(D.getSeconds()).padStart(2, '0');
        dateStr = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
      } else if (typeof d.date === 'string') {
        dateStr = d.date.replace(' ', 'T').replace(/Z$/, '');
      }
      return { ...d, date: dateStr, origin: 'donation' };
    });

    const normAgend = agendamentos.map(a => {
      let dateStr = null;
      if (a.date instanceof Date) {
        const D = a.date;
        const YYYY = D.getFullYear();
        const MM = String(D.getMonth() + 1).padStart(2, '0');
        const DD = String(D.getDate()).padStart(2, '0');
        const hh = String(D.getHours()).padStart(2, '0');
        const mm = String(D.getMinutes()).padStart(2, '0');
        const ss = String(D.getSeconds()).padStart(2, '0');
        dateStr = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
      } else if (typeof a.date === 'string') {
        dateStr = a.date.replace(' ', 'T').replace(/Z$/, '');
      }
      return { ...a, date: dateStr, origin: 'appointment' };
    });

    const history = [...normDoacoes, ...normAgend].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(history);

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ error: "Erro interno ao buscar histórico." });
  }
}
