import { Router } from 'express';
import {
  getMyPets,
  registerPet,
  toggleLostStatus,
  getLostPetsRadar,
  getPublicPetProfile,
  getPetPrintablePass,
  purchasePetPlate,
} from '../controllers/petController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/my-pets', requireAuth, getMyPets);
router.post('/register', requireAuth, registerPet);
router.patch('/:petId/toggle-lost', requireAuth, toggleLostStatus);
router.get('/:petId/qr-pass', requireAuth, getPetPrintablePass);
router.post('/:petId/purchase-plate', requireAuth, purchasePetPlate);
router.get('/radar-active', getLostPetsRadar);
router.get('/public/:petId', getPublicPetProfile);

export default router;
