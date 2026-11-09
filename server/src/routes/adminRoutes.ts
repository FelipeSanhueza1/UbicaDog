import { Router } from 'express';
import {
  getSystemStats,
  getAllUsers,
  updateUserRole,
  getAllSightingsAdmin,
  deleteSightingAdmin,
  sendEmergencyBroadcast,
} from '../controllers/adminController.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

// Restricted to employees and admins
router.use(requireAuth, requireRoles(['admin', 'employee']));

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.patch('/users/:userId/role', requireRoles(['admin']), updateUserRole);
router.get('/sightings', getAllSightingsAdmin);
router.delete('/sightings/:id', deleteSightingAdmin);
router.post('/broadcast', sendEmergencyBroadcast);

export default router;
