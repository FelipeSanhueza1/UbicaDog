import { Router } from 'express';
import { getPlans, getMySubscription, subscribeToPlan } from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/plans', getPlans);
router.get('/me', requireAuth, getMySubscription);
router.post('/subscribe', requireAuth, subscribeToPlan);

export default router;
