import { Router } from 'express';
import { createCheckoutSession, handleStripeWebhook } from '../controllers/stripeController.js';

const router = Router();

router.post('/create-checkout-session', createCheckoutSession);
router.post('/webhook', handleStripeWebhook);

export default router;
