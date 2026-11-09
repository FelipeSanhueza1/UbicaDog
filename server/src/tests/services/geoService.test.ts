import { describe, it, expect } from 'vitest';
import { calculateDistanceMeters, calculateEstimatedRadius } from '../../services/geoService.js';

describe('GeoService - Geospatial and Animal Dispersion Logic', () => {
  describe('calculateDistanceMeters (Haversine Formula)', () => {
    it('should return 0 meters for identical coordinates', () => {
      const dist = calculateDistanceMeters(-33.4489, -70.6693, -33.4489, -70.6693);
      expect(dist).toBe(0);
    });

    it('should calculate approximate distance between Plaza Baquedano and Costanera Center (~2.5-3 km)', () => {
      const baquedano = { lat: -33.4372, lng: -70.6345 };
      const costanera = { lat: -33.4174, lng: -70.6067 };
      const dist = calculateDistanceMeters(baquedano.lat, baquedano.lng, costanera.lat, costanera.lng);
      // Expected distance in meters: ~3.3km +/- 400m
      expect(dist).toBeGreaterThan(2800);
      expect(dist).toBeLessThan(3800);
    });

    it('should handle antipodal or long distances correctly', () => {
      // Santiago to Buenos Aires is approximately 1140 km
      const santiago = { lat: -33.4489, lng: -70.6693 };
      const buenosAires = { lat: -34.6037, lng: -58.3816 };
      const dist = calculateDistanceMeters(santiago.lat, santiago.lng, buenosAires.lat, buenosAires.lng);
      expect(dist).toBeGreaterThan(1100000);
      expect(dist).toBeLessThan(1200000);
    });
  });

  describe('calculateEstimatedRadius (Animal Wandering Model)', () => {
    it('should calculate day 0 initial radius for a medium dog (~600m)', () => {
      const lostNow = new Date().toISOString();
      const result = calculateEstimatedRadius('dog', 'medium', lostNow);

      expect(result.daysLost).toBe(0);
      expect(result.radiusMeters).toBeGreaterThanOrEqual(550);
      expect(result.radiusMeters).toBeLessThanOrEqual(650);
      expect(result.formattedRadius).toMatch(/m$/);
    });

    it('should scale wander radius based on dog size (small < medium < large)', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const smallDog = calculateEstimatedRadius('dog', 'small', twoDaysAgo);
      const mediumDog = calculateEstimatedRadius('dog', 'medium', twoDaysAgo);
      const largeDog = calculateEstimatedRadius('dog', 'large', twoDaysAgo);

      expect(smallDog.radiusMeters).toBeLessThan(mediumDog.radiusMeters);
      expect(mediumDog.radiusMeters).toBeLessThan(largeDog.radiusMeters);
      expect(resultInKm(largeDog.formattedRadius)).toBe(true);
    });

    it('should model feline territorial freeze behaviour for cats within 48h (< 350m)', () => {
      const halfDayAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const catDay0 = calculateEstimatedRadius('cat', 'small', halfDayAgo);

      // Cats freeze or hide within 300m for the first 24h
      expect(catDay0.radiusMeters).toBe(300);
      expect(catDay0.formattedRadius).toBe('300 m');

      // After 4 days, cat cautiously expands
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      const catDay4 = calculateEstimatedRadius('cat', 'small', fourDaysAgo);
      expect(catDay4.radiusMeters).toBeGreaterThan(1000);
    });
  });
});

function resultInKm(formatted: string): boolean {
  return formatted.endsWith('km');
}
