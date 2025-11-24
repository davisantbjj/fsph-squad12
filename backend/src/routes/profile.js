import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// configura multer: salva em ./uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { console.warn(e); }
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const name = `user_${Date.now()}${ext}`;
		cb(null, name);
	}
});
const upload = multer({ storage });

const router = express.Router();

// Aplica o middleware de autenticação a todas as rotas deste arquivo
router.use(authMiddleware);

// Rota para obter os dados do perfil do usuário logado
router.get('/', getProfile);

// Rota para atualizar os dados do perfil do usuário logado
router.put('/', updateProfile);
// Rota para upload de foto de perfil
router.post('/photo', upload.single('photo'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
		// Monta URL pública
		const host = req.get('host');
		const protocol = req.protocol;
		const url = `${protocol}://${host}/uploads/${req.file.filename}`;
		// Reaproveita controller/service para atualizar user
		// Atualiza campo foto_perfil no usuário (req.user.id vem do authMiddleware)
		const { updateUserById } = await import('../services/userService.js');
		const updatedUser = await updateUserById(req.user.id, { foto_perfil: url });
		const { senha, ...userProfile } = updatedUser;
		res.status(200).json({ message: 'Foto enviada com sucesso!', user: userProfile });
	} catch (error) {
		console.error('Erro no upload de foto:', error);
		res.status(500).json({ error: 'Erro interno ao processar upload.' });
	}
});

export default router;
