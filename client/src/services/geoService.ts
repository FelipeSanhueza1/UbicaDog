/**
 * Geolocation & Reverse Geocoding Service for UbicaDog
 * Provides high-accuracy GPS detection and Nominatim OpenStreetMap geocoding
 */

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeocodedPlace {
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

/**
 * Get device GPS coordinates with high accuracy and sensible timeouts
 */
export function getUserCoordinates(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no soporta geolocalización GPS.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let errorMsg = 'No pudimos obtener tu ubicación GPS.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Permiso de ubicación denegado. Activa los permisos de GPS en tu navegador.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'La señal de ubicación no está disponible en este momento.';
            break;
          case err.TIMEOUT:
            errorMsg = 'Tiempo de espera agotado al consultar tu GPS. Intenta nuevamente.';
            break;
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  });
}

/**
 * Convert lat/lng to a human-readable street address using OpenStreetMap Nominatim
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es',
        },
      }
    );

    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();

    const address = data.address || {};
    const road = address.road || address.pedestrian || address.suburb || '';
    const houseNumber = address.house_number ? ` ${address.house_number}` : '';
    const city = address.city || address.town || address.municipality || address.county || '';

    if (road && city) {
      return `${road}${houseNumber}, ${city}`;
    }
    return data.display_name?.split(',').slice(0, 3).join(',') || `Ubicación (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch (error) {
    return `Coordenadas (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

/**
 * Search places, streets, and communes in Chile with high precision for house numbers
 */
export async function searchPlaces(query: string): Promise<GeocodedPlace[]> {
  if (!query || query.trim().length < 2) return [];

  const rawQuery = query.trim();
  const numberMatch = rawQuery.match(/\b\d+\b/);
  const houseNumber = numberMatch ? numberMatch[0] : null;

  try {
    let res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        rawQuery
      )}&countrycodes=cl&limit=6&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es',
          'User-Agent': 'UbicaDogApp/1.0 (contacto@ubicadog.com)',
        },
      }
    );

    let data: any[] = res.ok ? await res.json() : [];

    // Fallback if 0 results and a house number was included (retry with street/commune and attach number)
    if (data.length === 0 && houseNumber) {
      const strippedQuery = rawQuery
        .replace(new RegExp(`\\b${houseNumber}\\b`, 'g'), '')
        .replace(/\s+/g, ' ')
        .trim();
      if (strippedQuery.length >= 3) {
        res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            strippedQuery
          )}&countrycodes=cl&limit=6&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'es',
              'User-Agent': 'UbicaDogApp/1.0 (contacto@ubicadog.com)',
            },
          }
        );
        if (res.ok) {
          data = await res.json();
        }
      }
    }

    return data.map((item: any) => {
      const addr = item.address || {};
      const road = addr.road || addr.pedestrian || addr.street || addr.residential || '';
      const num = addr.house_number || houseNumber || '';
      const suburb = addr.suburb || addr.neighbourhood || addr.quarter || '';
      const city = addr.city || addr.town || addr.municipality || addr.county || '';
      const state = addr.state || '';

      let formattedTitle = '';
      if (road) {
        formattedTitle = num ? `${road} ${num}` : road;
      } else {
        formattedTitle = item.display_name.split(',')[0];
        if (num && !formattedTitle.includes(num)) {
          formattedTitle = `${formattedTitle} ${num}`;
        }
      }

      const rawParts = [suburb, city, state].filter(
        (p) => Boolean(p) && p !== road && !formattedTitle.includes(p)
      );
      const secondaryParts = Array.from(new Set(rawParts));
      const cleanDisplayName =
        secondaryParts.length > 0 ? `${formattedTitle}, ${secondaryParts.join(', ')}` : formattedTitle;

      return {
        displayName: cleanDisplayName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      };
    });
  } catch (error) {
    console.warn('Error in searchPlaces:', error);
    return [];
  }
}

/**
 * Haversine formula to calculate geographical distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

