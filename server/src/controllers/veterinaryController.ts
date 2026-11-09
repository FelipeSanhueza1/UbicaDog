import { Request, Response } from 'express';
import { store } from '../services/store.js';
import { calculateDistanceMeters } from '../services/geoService.js';

/**
 * Controller for Veterinary Directory
 * Filters by proximity GPS and orders by Rating (5.0 to 1.0) or Distance
 */
export function getNearbyVeterinaries(req: Request, res: Response) {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : -33.4489;
    const lng = req.query.lng ? Number(req.query.lng) : -70.6693;

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas de usuario fuera de rango válido.' });
    }

    const radiusMeters = req.query.radiusMeters ? Number(req.query.radiusMeters) : 25000;
    const onlyEmergency24h = req.query.onlyEmergency24h === 'true';
    const sortBy = (req.query.sortBy as string) || 'rating'; // 'rating' or 'distance'

    let list = store.veterinaries.map((v) => {
      const distance = calculateDistanceMeters(lat, lng, v.latitude, v.longitude);
      return {
        ...v,
        distanceMeters: distance,
        formattedDistance:
          distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`,
      };
    });

    // 1. Proximity geofence filter
    list = list.filter((v) => v.distanceMeters <= radiusMeters);

    // 2. Emergency 24h filter
    if (onlyEmergency24h) {
      list = list.filter((v) => v.isEmergency24h);
    }

    // 3. Sorting criterion: Highest rated to lowest (or distance)
    if (sortBy === 'rating') {
      list.sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating; // Highest rating first
        }
        return b.reviewCount - a.reviewCount; // Secondary tie-breaker: review count
      });
    } else {
      list.sort((a, b) => a.distanceMeters - b.distanceMeters); // Closest first
    }

    return res.json({
      count: list.length,
      userLocation: { lat, lng },
      veterinaries: list,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar clínicas veterinarias.' });
  }
}
