import { Response } from 'express';
import { prisma } from '../services/prisma.js';
import { mapUser, sanitizeUser, mapSighting } from '../services/dbMappers.js';
import { isValidCoordinates } from '../services/geoService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { broadcastRadarWave } from '../services/socketService.js';
import { Role } from '../types/index.js';

export async function getSystemStats(req: AuthenticatedRequest, res: Response) {
  try {
    const [totalUsers, totalPets, activeLostPets, totalSightings, activeSightings] =
      await Promise.all([
        prisma.user.count(),
        prisma.pet.count(),
        prisma.pet.count({ where: { isLost: true } }),
        prisma.sighting.count(),
        prisma.sighting.count({ where: { status: 'active' } }),
      ]);

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
  } catch (error) {
    console.error('getSystemStats error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al consultar estadísticas del sistema.' });
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const userRows = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const safeUsers = userRows.map((row) => sanitizeUser(mapUser(row)));
    return res.json({ users: safeUsers });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al listar usuarios.' });
  }
}

export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = String(req.params.userId);
    const { role } = req.body;

    if (!['user', 'employee', 'admin'].includes(String(role))) {
      return res.status(400).json({ code: 'INVALID_ROLE', error: 'Rol de usuario no válido.' });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Usuario no encontrado.' });
    }

    const updatedRow = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    return res.json({
      message: 'Rol de usuario actualizado.',
      user: sanitizeUser(mapUser(updatedRow)),
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al actualizar rol.' });
  }
}

export async function getAllSightingsAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await prisma.sighting.findMany({
      orderBy: { seenAt: 'desc' },
    });
    return res.json({ sightings: rows.map(mapSighting) });
  } catch (error) {
    console.error('getAllSightingsAdmin error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al listar avistamientos.' });
  }
}

export async function deleteSightingAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const existing = await prisma.sighting.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Avistamiento no encontrado.' });
    }

    await prisma.sighting.delete({ where: { id } });
    return res.json({ message: 'Avistamiento eliminado por el moderador.' });
  } catch (error) {
    console.error('deleteSightingAdmin error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al eliminar avistamiento.' });
  }
}

export function sendEmergencyBroadcast(req: AuthenticatedRequest, res: Response) {
  const { title, message, latitude, longitude, radiusMeters } = req.body;

  if (!title || !message || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Título, mensaje y coordenadas requeridos.' });
  }

  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  if (!isValidCoordinates(latNum, lngNum)) {
    return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas fuera de rango válido.' });
  }

  broadcastRadarWave({
    type: 'admin_broadcast',
    title: `[COMUNICADO OFICIAL] ${title}`,
    message,
    latitude: latNum,
    longitude: lngNum,
    radiusMeters: Number(radiusMeters) || 5000,
    data: {
      sentBy: req.user?.name,
      sentAt: new Date().toISOString(),
    },
  });

  return res.json({ message: 'Transmisión de emergencia emitida por la red de UbicaDog con éxito.' });
}
