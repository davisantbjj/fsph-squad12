import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const router = express.Router();

// Dev-only helper: decode the token and return payload and raw header
// Usage: GET /api/debug/me  (sets no auth middleware to show exactly what arrives)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const result = { authorization: authHeader || null };

  if (!authHeader) {
    return res.status(200).json({ ...result, message: 'No Authorization header present' });
  }

  const parts = authHeader.split(' ');
  const token = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ ...result, ok: false, error: 'JWT_SECRET não configurada no servidor.' });
    }
    const decoded = jwt.verify(token, secret);
    return res.status(200).json({ ...result, ok: true, decoded });
  } catch (err) {
    return res.status(200).json({ ...result, ok: false, error: err.message });
  }
});

export default router;
