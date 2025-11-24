// Mock data para simular postagens
const mockPosts = [
  { id: 1, id_usuario: 1, conteudo_texto: 'Primeira postagem do feed!', imagem_url: null, curtidas: 10, data_postagem: new Date() },
  { id: 2, id_usuario: 2, conteudo_texto: 'Olá, mundo!', imagem_url: null, curtidas: 5, data_postagem: new Date() }
];

// Função para listar as postagens
export const getPosts = async (req, res) => {
  try {
    // Por enquanto, retorna os dados mockados
    res.json(mockPosts);
  } catch (error) {
    console.error('Erro ao buscar postagens:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

// Função para criar uma nova postagem
export const createPost = async (req, res) => {
  try {
    const { conteudo_texto, imagem_url } = req.body;
    const newPost = {
      id: mockPosts.length + 1,
      id_usuario: req.user.id, // ID do usuário logado
      conteudo_texto,
      imagem_url,
      curtidas: 0,
      data_postagem: new Date()
    };
    mockPosts.push(newPost);
    res.status(201).json({ message: 'Postagem criada com sucesso!', post: newPost });
  } catch (error) {
    console.error('Erro ao criar postagem:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
