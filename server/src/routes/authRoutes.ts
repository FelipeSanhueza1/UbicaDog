import { Router } from 'express';
import { register, login, employeeLogin, googleLogin, getProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyRecaptcha } from '../middleware/recaptcha.js';

const router = Router();

router.post('/register', verifyRecaptcha, register);
router.post('/login', verifyRecaptcha, login);
router.post('/employee-login', employeeLogin);
router.post('/google', googleLogin);
router.get('/me', requireAuth, getProfile);

export default router;
