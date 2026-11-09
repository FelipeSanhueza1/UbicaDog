import { Species, PetSize } from '../types/index.js';

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculates behavioral wandering radius based on species, size, and elapsed days.
 * Based on empirical animal behavior & search protocols (e.g. Missing Animal Response Network):
 * - Dogs tend to move further over time, influenced by size and stamina.
 * - Cats typically freeze or hide close to home during the first 48 hours, then cautiously explore.
 */
export function calculateEstimatedRadius(
  species: Species,
  size: PetSize = 'medium',
  lostSinceISO: string
): { daysLost: number; radiusMeters: number; formattedRadius: string } {
  const lostDate = new Date(lostSinceISO).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - lostDate);
  const daysFraction = diffMs / (1000 * 60 * 60 * 24);
  const daysLost = Math.floor(daysFraction);

  let sizeMultiplier = 1.0;
  if (size === 'small') sizeMultiplier = 0.75;
  if (size === 'large') sizeMultiplier = 1.35;

  let radiusMeters = 500;

  if (species === 'dog') {
    // Initial wander on Day 0: 600m
    // Progression: Day 1 ~ 1.5km, expanding daily
    const baseInitial = 600 * sizeMultiplier;
    const dailyGrowth = 1200 * sizeMultiplier;
    radiusMeters = Math.min(25000, Math.round(baseInitial + daysFraction * dailyGrowth));
  } else if (species === 'cat') {
    // Cats hide within 150m-300m for first 24-48h, then expand slowly
    if (daysFraction < 1) {
      radiusMeters = 300;
    } else if (daysFraction < 3) {
      radiusMeters = Math.round(300 + (daysFraction - 1) * 350);
    } else {
      radiusMeters = Math.min(8000, Math.round(1000 + (daysFraction - 3) * 450));
    }
  } else {
    // Other species (birds, ferrets, etc.)
    radiusMeters = Math.min(10000, Math.round(500 + daysFraction * 800));
  }

  const formattedRadius =
    radiusMeters >= 1000
      ? `${(radiusMeters / 1000).toFixed(1)} km`
      : `${radiusMeters} m`;

  return {
    daysLost,
    radiusMeters,
    formattedRadius,
  };
}
