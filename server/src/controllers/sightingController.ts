import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { mapSighting } from '../services/dbMappers.js';
import { isValidCoordinates } from '../services/geoService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Species, CollarStatus, AnimalCondition } from '../types/index.js';
import { broadcastRadarWave } from '../services/socketService.js';

export async function getAllSightings(req: Request, res: Response) {
  try {
    const { species, collarStatus, status } = req.query;

    const whereClause: {
      status: 'active' | 'resolved' | 'hidden';
      species?: Species;
      collarStatus?: CollarStatus;
    } = {
      status:
        status === 'resolved' || status === 'hidden' || status === 'active'
          ? status
          : 'active',
    };

    if (species && species !== 'all' && ['dog', 'cat', 'other'].includes(String(species))) {
      whereClause.species = String(species) as Species;
    }

    if (
      collarStatus &&
      collarStatus !== 'all' &&
      ['with_collar', 'no_collar', 'unknown'].includes(String(collarStatus))
    ) {
      whereClause.collarStatus = String(collarStatus) as CollarStatus;
    }

    const rows = await prisma.sighting.findMany({
      where: whereClause,
      orderBy: { seenAt: 'desc' },
    });

    return res.json({ sightings: rows.map(mapSighting) });
  } catch (error) {
    console.error('getAllSightings error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al consultar avistamientos.' });
  }
}

export async function createSighting(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      species,
      breed,
      collarStatus,
      condition,
      photoUrl,
      latitude,
      longitude,
      address,
      seenAt,
      notes,
      contactPhone,
      reporterName,
    } = req.body;

    if (!species || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Especie y ubicación del avistamiento son obligatorias.' });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (!isValidCoordinates(latNum, lngNum)) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas geográficas fuera de rango válido.' });
    }

    const createdRow = await prisma.sighting.create({
      data: {
        id: `sight_${Date.now()}`,
        reporterId: req.user?.id ?? null,
        reporterName: reporterName || req.user?.name || 'Comunidad UbicaDog',
        species: species as Species,
        breed: breed || 'Mestizo no identificado',
        collarStatus: (collarStatus as CollarStatus) || 'unknown',
        condition: (condition as AnimalCondition) || 'wandering',
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
        latitude: latNum,
        longitude: lngNum,
        address: address || 'Ubicación en mapa',
        seenAt: seenAt ? new Date(seenAt) : new Date(),
        notes: notes ?? null,
        contactPhone: contactPhone || req.user?.phone || null,
        status: 'active',
      },
    });

    const newSighting = mapSighting(createdRow);

    // Emit live radar wave pulse centered at sighting
    broadcastRadarWave({
      type: 'sighting',
      title: `Nuevo avistamiento: ${newSighting.species === 'dog' ? 'Perro' : newSighting.species === 'cat' ? 'Gato' : 'Mascota'}`,
      message: `Avistado en ${newSighting.address || 'tu zona'} (${newSighting.collarStatus === 'with_collar' ? 'Con collar' : 'Sin collar visible'}).`,
      latitude: newSighting.latitude,
      longitude: newSighting.longitude,
      radiusMeters: 1000,
      data: newSighting,
    });

    return res.status(201).json({
      message: 'Avistamiento reportado con éxito y difundido en la red.',
      sighting: newSighting,
    });
  } catch (error) {
    console.error('createSighting error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al reportar avistamiento.' });
  }
}

export async function updateSightingStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['active', 'resolved', 'hidden'].includes(String(status))) {
      return res.status(400).json({ code: 'INVALID_STATUS', error: 'Estado de avistamiento no válido.' });
    }

    const sightingRow = await prisma.sighting.findUnique({ where: { id } });
    if (!sightingRow) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Avistamiento no encontrado.' });
    }

    // Allow reporter, employee or admin
    const isOwner = req.user && sightingRow.reporterId === req.user.id;
    const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'employee');

    if (!isOwner && !isStaff) {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'No autorizado para modificar este reporte.' });
    }

    const updatedRow = await prisma.sighting.update({
      where: { id },
      data: { status },
    });

    return res.json({
      message: 'Estado del avistamiento actualizado.',
      sighting: mapSighting(updatedRow),
    });
  } catch (error) {
    console.error('updateSightingStatus error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al actualizar avistamiento.' });
  }
}
