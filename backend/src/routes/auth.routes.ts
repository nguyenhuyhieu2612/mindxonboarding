import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// POST /auth/login
router.post('/login', AuthController.login);

// POST /auth/register
router.post('/register', AuthController.register);

export default router;
