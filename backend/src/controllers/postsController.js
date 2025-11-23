import { getConnection } from '../config/database.js';

// Função para listar as postagens (do DB)
export const getPosts = async (req, res) => {
  try {
    const pool = await getConnection();
    const [rows] = await pool.query(
      `SELECT
         id_postagem as id,
         id_usuario,
         conteudo_texto,
         imagem_url,
         curtidas,
         data_postagem
       FROM postagens
       ORDER BY data_postagem DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar postagens:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

// Função para criar uma nova postagem
export const createPost = async (req, res) => {
  try {
    const { conteudo_texto, imagem_url } = req.body;
    const pool = await getConnection();
    const [result] = await pool.query(
      'INSERT INTO postagens (id_usuario, conteudo_texto, imagem_url, curtidas) VALUES (?, ?, ?, ?)',
      [req.user.id, conteudo_texto || null, imagem_url || null, 0]
    );

    const insertedId = result.insertId;
    const [rows] = await pool.query('SELECT id_postagem as id, id_usuario, conteudo_texto, imagem_url, curtidas, data_postagem FROM postagens WHERE id_postagem = ?', [insertedId]);
    const post = rows.length > 0 ? rows[0] : null;

    res.status(201).json({ message: 'Postagem criada com sucesso!', post });
  } catch (error) {
    console.error('Erro ao criar postagem:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
