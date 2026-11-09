import { Request, Response } from 'express';
import { store } from '../services/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Sighting, Species, CollarStatus, AnimalCondition } from '../types/index.js';
import { broadcastRadarWave } from '../services/socketService.js';

export function getAllSightings(req: Request, res: Response) {
  const { species, collarStatus, status } = req.query;

  let filtered = store.sightings;

  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  } else {
    // default to active
    filtered = filtered.filter((s) => s.status === 'active');
  }

  if (species && species !== 'all') {
    filtered = filtered.filter((s) => s.species === species);
  }

  if (collarStatus && collarStatus !== 'all') {
    filtered = filtered.filter((s) => s.collarStatus === collarStatus);
  }

  // Sort descending by seen date
  filtered.sort((a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime());

  return res.json({ sightings: filtered });
}

export function createSighting(req: AuthenticatedRequest, res: Response) {
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
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas geográficas fuera de rango válido.' });
    }

    const newSighting: Sighting = {
      id: `sight_${Date.now()}`,
      reporterId: req.user?.id,
      reporterName: reporterName || req.user?.name || 'Comunidad UbicaDog',
      species: species as Species,
      breed: breed || 'Mestizo no identificado',
      collarStatus: (collarStatus as CollarStatus) || 'unknown',
      condition: (condition as AnimalCondition) || 'wandering',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
      latitude: latNum,
      longitude: lngNum,
      address: address || 'Ubicación en mapa',
      seenAt: seenAt || new Date().toISOString(),
      notes,
      contactPhone: contactPhone || req.user?.phone,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    store.sightings.unshift(newSighting);

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
    return res.status(500).json({ error: 'Error al reportar avistamiento.' });
  }
}

export function updateSightingStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  const sighting = store.sightings.find((s) => s.id === id);
  if (!sighting) {
    return res.status(404).json({ error: 'Avistamiento no encontrado.' });
  }

  // Allow reporter, employee or admin
  const isOwner = req.user && sighting.reporterId === req.user.id;
  const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'employee');

  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: 'No autorizado para modificar este reporte.' });
  }

  sighting.status = status;
  return res.json({ message: 'Estado del avistamiento actualizado.', sighting });
}
