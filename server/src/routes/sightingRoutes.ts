import { Router } from 'express';
import { getAllSightings, createSighting, updateSightingStatus } from '../controllers/sightingController.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyRecaptcha } from '../middleware/recaptcha.js';

const router = Router();

router.get('/', getAllSightings);
router.post('/', verifyRecaptcha, createSighting);
router.patch('/:id/status', requireAuth, updateSightingStatus);

export default router;
