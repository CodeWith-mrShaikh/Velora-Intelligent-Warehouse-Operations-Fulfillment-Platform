import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, loginSchema } from '../validators';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);

export default router;
