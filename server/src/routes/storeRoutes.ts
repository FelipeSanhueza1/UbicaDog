import { Router } from 'express';
import { getNearbyStores, registerStore } from '../controllers/storeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', getNearbyStores);
router.post('/', requireAuth, registerStore);

export default router;
