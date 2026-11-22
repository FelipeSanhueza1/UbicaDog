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
 * Search places, streets, and communes in Chile/Latin America
 */
export async function searchPlaces(query: string): Promise<GeocodedPlace[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&countrycodes=cl&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es',
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));
  } catch (error) {
    console.warn('Error in searchPlaces:', error);
    return [];
  }
}
