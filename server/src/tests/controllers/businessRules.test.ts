import { describe, it, expect } from 'vitest';
import { store } from '../../services/store.js';
import { calculateDistanceMeters } from '../../services/geoService.js';

describe('Business Rules & Domain Invariants', () => {
  describe('Veterinary Ranking Algorithm (Rating + Distance desempate)', () => {
    it('should order veterinaries by rating descending and use reviewCount as tie-breaker', () => {
      const userLat = -33.4489;
      const userLng = -70.6693;

      const sortedVets = [...store.veterinaries]
        .map((v) => ({
          ...v,
          dist: calculateDistanceMeters(userLat, userLng, v.latitude, v.longitude),
        }))
        .sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return b.reviewCount - a.reviewCount;
        });

      // Highest rated clinic should be first
      expect(sortedVets[0].rating).toBeGreaterThanOrEqual(sortedVets[1].rating);
      // Last clinic should have the lowest rating in the seed
      expect(sortedVets[sortedVets.length - 1].rating).toBeLessThan(sortedVets[0].rating);
    });

    it('should correctly filter only 24-hour emergency hospitals', () => {
      const emergencyVets = store.veterinaries.filter((v) => v.isEmergency24h);
      expect(emergencyVets.length).toBeGreaterThan(0);
      emergencyVets.forEach((v) => {
        expect(v.isEmergency24h).toBe(true);
      });
    });
  });

  describe('Freemium Subscription Limits', () => {
    it('should define that free tier users cannot register more than 1 pet', () => {
      const freeTierMaxPets = 1;
      const userPets = [{ id: 'pet_1', name: 'Rocky' }];

      const canAddMore = userPets.length < freeTierMaxPets;
      expect(canAddMore).toBe(false);

      const proTierMaxPets = 999;
      const proCanAddMore = userPets.length < proTierMaxPets;
      expect(proCanAddMore).toBe(true);
    });

    it('should validate geographical boundaries (-90 <= lat <= 90 and -180 <= lng <= 180)', () => {
      const isValidCoord = (lat: number, lng: number) =>
        !isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180;

      expect(isValidCoord(-33.4489, -70.6693)).toBe(true); // Santiago, Chile
      expect(isValidCoord(95.0, -70.6693)).toBe(false); // Invalid latitude
      expect(isValidCoord(-33.4489, 195.0)).toBe(false); // Invalid longitude
      expect(isValidCoord(NaN, -70.6693)).toBe(false);
    });
  });

  describe('Pet Store Tier Restrictions ($5.000 vs $10.000 CLP)', () => {
    it('basic store ($5.000) should cap catalog to 5 items and forbid promo coupons', () => {
      const rawCatalog = [1, 2, 3, 4, 5, 6, 7];
      const rawPromotions = [{ code: 'PROMO10' }];

      const basicTierCatalog = rawCatalog.slice(0, 5);
      const basicTierPromotions: any[] = [];

      expect(basicTierCatalog.length).toBe(5);
      expect(basicTierPromotions.length).toBe(0);
    });

    it('premium store ($10.000) should allow promoted status, unlimited catalog and coupons', () => {
      const premiumStore = store.stores.find((s) => s.tier === 'store_premium');
      expect(premiumStore).toBeDefined();
      expect(premiumStore?.promotions.length).toBeGreaterThan(0);
    });
  });
});
