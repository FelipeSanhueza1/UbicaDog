import { Router } from 'express';
import { getNearbyVeterinaries } from '../controllers/veterinaryController.js';

const router = Router();

router.get('/', getNearbyVeterinaries);

export default router;
