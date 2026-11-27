import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { mapVeterinary } from '../services/dbMappers.js';
import { calculateDistanceMeters, isValidCoordinates } from '../services/geoService.js';
import { fetchOsmVeterinaries } from '../services/osmService.js';

/**
 * Controller for Veterinary Directory
 * Dynamically queries real OpenStreetMap clinics around user coordinates,
 * merged with registered partner clinics from PostgreSQL and sorted by rating or distance.
 */
export async function getNearbyVeterinaries(req: Request, res: Response) {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : -33.4489;
    const lng = req.query.lng ? Number(req.query.lng) : -70.6693;

    if (!isValidCoordinates(lat, lng)) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas de usuario fuera de rango válido.' });
    }

    const radiusMeters = req.query.radiusMeters ? Number(req.query.radiusMeters) : 25000;
    const onlyEmergency24h = req.query.onlyEmergency24h === 'true';
    const sortBy = (req.query.sortBy as string) || 'distance'; // Default to closest clinics

    // 1. Fetch real clinics from OpenStreetMap + partner clinics from PostgreSQL in parallel
    const [osmClinics, dbVetRows] = await Promise.all([
      fetchOsmVeterinaries(lat, lng, radiusMeters),
      prisma.veterinary.findMany(),
    ]);

    // 2. Calculate distance for registered partner clinics
    const localClinics = dbVetRows
      .map((row) => {
        const v = mapVeterinary(row);
        const distance = calculateDistanceMeters(lat, lng, v.latitude, v.longitude);
        return {
          ...v,
          distanceMeters: distance,
          formattedDistance: distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`,
        };
      })
      .filter((v) => v.distanceMeters <= radiusMeters);

    // 3. Deduplicate and merge
    const clinicMap = new Map<string, any>();
    for (const c of [...localClinics, ...osmClinics]) {
      const key = `${c.clinicName.toLowerCase().trim()}_${c.latitude.toFixed(3)}`;
      if (!clinicMap.has(key)) {
        clinicMap.set(key, c);
      }
    }

    let result = Array.from(clinicMap.values());

    if (onlyEmergency24h) {
      result = result.filter((v) => v.isEmergency24h);
    }

    // 4. Sort according to request: closest or highest rating
    if (sortBy === 'rating') {
      result.sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.reviewCount - a.reviewCount;
      });
    } else {
      result.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    }

    return res.json({
      count: result.length,
      userLocation: { lat, lng },
      radiusMeters,
      veterinaries: result,
    });
  } catch (error) {
    console.error('getNearbyVeterinaries error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al consultar clínicas veterinarias.' });
  }
}
