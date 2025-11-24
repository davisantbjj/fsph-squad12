import { getConnection } from "../config/database.js";

// Cria um novo agendamento e salva a pré-triagem
export async function createAppointment(req, res) {
  const pool = await getConnection();
  // Para transações, precisamos de uma conexão dedicada
  const connection = await pool.getConnection();

  try {
    const { id } = req.user; // ID do usuário vindo do token
    const {
      // Dados do agendamento
      data_agendamento, // various formats accepted
      tipo_agendamento, // 'individual', 'campaign', 'boneMarrow'
      local_agendamento,
      // Informações opcionais do doador (provenientes do front)
      donor_info,
      // Dados da pré-triagem
      pre_triagem
    } = req.body;

    // Log do payload para auxiliar debugging (não logar em produção sensível)
    console.info('[createAppointment] recebendo agendamento de usuarioId:', id, 'payload:', req.body);

    // Helper: parse multiple date/time input formats into MySQL DATETIME 'YYYY-MM-DD HH:mm:ss'
    function parseDateTime(value) {
      if (!value) return null;
      if (value instanceof Date) {
        const d = value;
        const YYYY = d.getFullYear();
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        const DD = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
      }
      let s = String(value).trim();

      // If contains 'T' or ISO-like, try Date parsing
      if (s.includes('T')) {
        const d = new Date(s);
        if (!isNaN(d)) return parseDateTime(d);
      }

      // If contains space, split into date and time
      let datePart = s;
      let timePart = '';
      if (s.includes(' ')) {
        const parts = s.split(' ');
        datePart = parts[0];
        timePart = parts.slice(1).join(' ');
      }

      // Normalize datePart
      let day, month, year;
      if (/^\d{8}$/.test(datePart)) {
        // DDMMYYYY
        day = datePart.slice(0,2);
        month = datePart.slice(2,4);
        year = datePart.slice(4,8);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
        // DD/MM/YYYY
        [day, month, year] = datePart.split('/');
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        // YYYY-MM-DD
        [year, month, day] = datePart.split('-');
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(datePart)) {
        // DD-MM-YYYY
        [day, month, year] = datePart.split('-');
      } else {
        // Try Date parse fallback
        const d = new Date(datePart);
        if (!isNaN(d)) return parseDateTime(d);
      }

      // Normalize timePart
      let hh = '00', mm = '00', ss = '00';
      if (timePart) {
        const t = timePart.trim();
        if (/^\d{4}$/.test(t)) {
          hh = t.slice(0,2);
          mm = t.slice(2,4);
        } else if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) {
          const parts = t.split(':');
          hh = parts[0].padStart(2,'0');
          mm = parts[1].padStart(2,'0');
          if (parts[2]) ss = parts[2].padStart(2,'0');
        } else if (/^\d{3,6}$/.test(t)) {
          // Unexpected numeric like 900 or 0900 or 090000
          if (t.length === 3) { hh = '0' + t[0]; mm = t.slice(1,3); }
          if (t.length === 4) { hh = t.slice(0,2); mm = t.slice(2,4); }
          if (t.length === 6) { hh = t.slice(0,2); mm = t.slice(2,4); ss = t.slice(4,6); }
        } else if (/^\d{1,2}$/.test(t)) {
          hh = t.padStart(2,'0');
        } else {
          // try parse
          const pd = new Date(`1970-01-01T${t}`);
          if (!isNaN(pd)) {
            hh = String(pd.getHours()).padStart(2,'0');
            mm = String(pd.getMinutes()).padStart(2,'0');
            ss = String(pd.getSeconds()).padStart(2,'0');
          }
        }
      }

      // Build and validate
      if (!year || !month || !day) return null;
      const formatted = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')} ${hh.padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')}`;
      const test = new Date(formatted.replace(' ', 'T') + 'Z');
      if (isNaN(test)) return null;
      return formatted;
    }

    // Normalize and validate data_agendamento before inserting
    let normalizedDateTime = null;
    try {
      normalizedDateTime = parseDateTime(data_agendamento);
    } catch (e) {
      normalizedDateTime = null;
    }

    if (!normalizedDateTime) {
      // if invalid, respond 400
      res.status(400).json({ error: 'data_agendamento inválida. Aceito: DD/MM/YYYY, DDMMYYYY, YYYY-MM-DD HH:MM:SS, ISO, etc.' });
      connection.release();
      return;
    }

    await connection.beginTransaction();

    // 1. Inserir Agendamento
    // Preparar campos de donor caso enviados
    let nome_doador = null;
    let cpf_doador = null;
    let telefone_doador = null;
    let email_doador = null;
    let data_nascimento_doador = null;

    if (donor_info) {
      nome_doador = donor_info.nome_completo || null;
      cpf_doador = donor_info.cpf ? String(donor_info.cpf).replace(/\D/g, '') : null;
      telefone_doador = donor_info.telefone ? String(donor_info.telefone).replace(/\D/g, '') : null;
      email_doador = donor_info.email || null;
      // data_nascimento: aceita YYYY-MM-DD ou dd/mm/YYYY
      if (donor_info.data_nascimento) {
        const v = String(donor_info.data_nascimento);
        if (v.includes('/')) {
          const [dd, mm, yyyy] = v.split('/');
          data_nascimento_doador = `${yyyy}-${mm}-${dd}`;
        } else {
          data_nascimento_doador = v;
        }
      }
    }

    // Use the normalized datetime when inserting to ensure consistent DB format
    const [resultAgendamento] = await connection.query(
      `INSERT INTO agendamentos
      (id_usuario, data_agendamento, tipo_agendamento, local_agendamento, nome_doador, cpf_doador, telefone_doador, email_doador, data_nascimento_doador, status_agendamento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')`,
      [id, normalizedDateTime, tipo_agendamento, local_agendamento, nome_doador, cpf_doador, telefone_doador, email_doador, data_nascimento_doador]
    );

    const idAgendamento = resultAgendamento.insertId;

    // 2. Inserir Pré-Triagem (se houver dados)
    if (pre_triagem) {
        const { peso, altura, pressao_arterial, apto_doacao, observacoes, perguntas_respostas } = pre_triagem;

        const obsFinal = observacoes || JSON.stringify(perguntas_respostas || {});

        await connection.query(
            `INSERT INTO pre_triagem
            (id_agendamento, peso, altura, pressao_arterial, apto_doacao, observacoes)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [idAgendamento, peso || null, altura || null, pressao_arterial || null, apto_doacao || true, obsFinal]
        );
    }

    await connection.commit();

    res.status(201).json({
        message: "Agendamento realizado com sucesso!",
        id_agendamento: idAgendamento
    });

  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar agendamento:", error);
    res.status(500).json({ error: "Erro interno ao processar agendamento." });
  } finally {
    // Libera a conexão de volta pro pool
    connection.release();
  }
}

// Lista agendamentos do usuário
export async function getMyAppointments(req, res) {
  const pool = await getConnection();
  try {
    const { id } = req.user;

    // Query simples pode usar o pool direto
    const [rows] = await pool.query(
        `SELECT id_agendamento as id, id_usuario, id_campanha, data_agendamento, tipo_agendamento, local_agendamento,
                nome_doador, cpf_doador, telefone_doador, email_doador, data_nascimento_doador, status_agendamento, data_criacao
         FROM agendamentos
         WHERE id_usuario = ?
         ORDER BY data_agendamento DESC`,
        [id]
    );

    // Normaliza o formato de data para uma string ISO-like SEM fuso ('YYYY-MM-DDTHH:mm:ss')
    // Isto evita que parsers client-side interpretem erroneamente como UTC (com 'Z') e
    // faz com que `new Date(string)` no cliente trate o tempo como local.
    const normalized = rows.map(r => {
      const out = { ...r };
      const d = r.data_agendamento;
      if (d instanceof Date) {
        const YYYY = d.getFullYear();
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        const DD = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        out.data_agendamento = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
      } else if (typeof d === 'string') {
        // converte 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DDTHH:MM:SS' (sem timezone suffix)
        out.data_agendamento = d.replace(' ', 'T').replace(/Z$/, '');
      } else {
        out.data_agendamento = null;
      }
      return out;
    });

    res.json(normalized);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    res.status(500).json({ error: "Erro interno ao buscar agendamentos." });
  }
  // Não precisa liberar pool.query
}
