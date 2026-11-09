import { Response } from 'express';
import { store } from '../services/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { broadcastRadarWave } from '../services/socketService.js';

export function getSystemStats(req: AuthenticatedRequest, res: Response) {
  const totalUsers = store.users.length;
  const totalPets = store.pets.length;
  const activeLostPets = store.pets.filter((p) => p.isLost).length;
  const totalSightings = store.sightings.length;
  const activeSightings = store.sightings.filter((s) => s.status === 'active').length;

  return res.json({
    stats: {
      totalUsers,
      totalPets,
      activeLostPets,
      totalSightings,
      activeSightings,
      reunitedPets: totalPets - activeLostPets,
      systemHealth: 'OPERATIONAL',
      serverTime: new Date().toISOString(),
    },
  });
}

export function getAllUsers(req: AuthenticatedRequest, res: Response) {
  const safeUsers = store.users.map(({ password, ...u }) => u);
  return res.json({ users: safeUsers });
}

export function updateUserRole(req: AuthenticatedRequest, res: Response) {
  const { userId } = req.params;
  const { role } = req.body;

  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  user.role = role;
  const { password, ...safeUser } = user;
  return res.json({ message: 'Rol de usuario actualizado.', user: safeUser });
}

export function getAllSightingsAdmin(req: AuthenticatedRequest, res: Response) {
  return res.json({ sightings: store.sightings });
}

export function deleteSightingAdmin(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const index = store.sightings.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Avistamiento no encontrado.' });
  }

  store.sightings.splice(index, 1);
  return res.json({ message: 'Avistamiento eliminado por el moderador.' });
}

export function sendEmergencyBroadcast(req: AuthenticatedRequest, res: Response) {
  const { title, message, latitude, longitude, radiusMeters } = req.body;

  if (!title || !message || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Título, mensaje y coordenadas requeridos.' });
  }

  broadcastRadarWave({
    type: 'admin_broadcast',
    title: `[COMUNICADO OFICIAL] ${title}`,
    message,
    latitude: Number(latitude),
    longitude: Number(longitude),
    radiusMeters: Number(radiusMeters) || 5000,
    data: {
      sentBy: req.user?.name,
      sentAt: new Date().toISOString(),
    },
  });

  return res.json({ message: 'Transmisión de emergencia emitida por la red de UbicaDog con éxito.' });
}
