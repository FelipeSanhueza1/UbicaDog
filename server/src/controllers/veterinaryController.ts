import { Request, Response } from 'express';
import { store } from '../services/store.js';
import { calculateDistanceMeters } from '../services/geoService.js';
import { fetchOsmVeterinaries } from '../services/osmService.js';

/**
 * Controller for Veterinary Directory
 * Dynamically queries real OpenStreetMap clinics around user coordinates,
 * merged with registered partner clinics and sorted by rating or distance.
 */
export async function getNearbyVeterinaries(req: Request, res: Response) {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : -33.4489;
    const lng = req.query.lng ? Number(req.query.lng) : -70.6693;

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas de usuario fuera de rango válido.' });
    }

    const radiusMeters = req.query.radiusMeters ? Number(req.query.radiusMeters) : 25000;
    const onlyEmergency24h = req.query.onlyEmergency24h === 'true';
    const sortBy = (req.query.sortBy as string) || 'distance'; // Default to closest clinics

    // 1. Fetch real clinics from OpenStreetMap around the actual GPS coordinates
    const osmClinics = await fetchOsmVeterinaries(lat, lng, radiusMeters);

    // 2. Fetch locally stored partner clinics and calculate distance
    const localClinics = store.veterinaries
      .map((v) => {
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
    return res.status(500).json({ error: 'Error al consultar clínicas veterinarias.' });
  }
}
