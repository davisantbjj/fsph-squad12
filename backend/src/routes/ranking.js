import express from 'express';
import { getRanking } from '../controllers/rankingController.js';
// Ranking pode ser público ou privado. Vamos deixar privado por enquanto.
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getRanking);

export default router;
