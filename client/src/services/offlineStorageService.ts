import { Pet } from '../types';

/**
 * Offline Storage Service for UbicaDog
 * Caches pet profiles and medical records in localStorage for offline consultation in clinics or areas without 4G
 */

const OFFLINE_PETS_KEY = 'ubicadog_offline_pets';
const OFFLINE_TIMESTAMP_KEY = 'ubicadog_offline_pets_updated_at';

export function saveOfflinePets(pets: Pet[]): void {
  try {
    localStorage.setItem(OFFLINE_PETS_KEY, JSON.stringify(pets));
    localStorage.setItem(OFFLINE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Could not cache pets offline:', err);
  }
}

export function getOfflinePets(): Pet[] {
  try {
    const raw = localStorage.getItem(OFFLINE_PETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read offline pets:', err);
    return [];
  }
}

export function getOfflinePetsLastUpdated(): string | null {
  try {
    return localStorage.getItem(OFFLINE_TIMESTAMP_KEY);
  } catch {
    return null;
  }
}
