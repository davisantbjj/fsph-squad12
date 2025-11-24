import express from 'express';
import { createAppointment, getMyAppointments } from '../controllers/appointmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createAppointment);
router.get('/', getMyAppointments);

export default router;
