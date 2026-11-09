import { Request, Response } from 'express';
import { store } from '../services/store.js';
import { calculateDistanceMeters } from '../services/geoService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PetStore } from '../types/index.js';

export function getNearbyStores(req: Request, res: Response) {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : -33.4489;
    const lng = req.query.lng ? Number(req.query.lng) : -70.6693;
    const radiusMeters = req.query.radiusMeters ? Number(req.query.radiusMeters) : 30000;

    let list = store.stores.map((s) => {
      const distance = calculateDistanceMeters(lat, lng, s.latitude, s.longitude);
      return {
        ...s,
        distanceMeters: distance,
        formattedDistance:
          distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`,
        isPromoted: s.tier === 'store_premium', // $10.000 tier gets promoted flag & halo
      };
    });

    list = list.filter((s) => s.distanceMeters <= radiusMeters);

    // Premium tier stores appear first, then sorted by distance
    list.sort((a, b) => {
      if (a.tier === 'store_premium' && b.tier !== 'store_premium') return -1;
      if (b.tier === 'store_premium' && a.tier !== 'store_premium') return 1;
      return a.distanceMeters - b.distanceMeters;
    });

    return res.json({
      count: list.length,
      stores: list,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar tiendas de mascotas.' });
  }
}

export function registerStore(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });

  try {
    const {
      businessName,
      tier,
      address,
      latitude,
      longitude,
      phone,
      whatsapp,
      logoUrl,
      description,
      openingHours,
      websiteUrl,
      catalog,
      promotions,
    } = req.body;

    if (!businessName || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Nombre comercial, dirección y coordenadas son requeridos.' });
    }

    const selectedTier = tier === 'store_premium' ? 'store_premium' : 'store_basic';

    // Store Basic ($5.000 CLP): max 5 products, no promotions
    let finalCatalog = Array.isArray(catalog) ? catalog : [];
    let finalPromotions = Array.isArray(promotions) ? promotions : [];

    if (selectedTier === 'store_basic') {
      finalCatalog = finalCatalog.slice(0, 5);
      finalPromotions = []; // Promotions only available on $10.000 Premium tier
    }

    const newStore: PetStore = {
      id: `store_${Date.now()}`,
      ownerId: req.user.id,
      businessName,
      tier: selectedTier,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      phone: phone || '',
      whatsapp: whatsapp || phone || '',
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=200&q=80',
      description: description || 'Local de venta de artículos y alimentos para mascotas.',
      openingHours: openingHours || 'Lun a Sáb 09:30 - 20:00',
      websiteUrl,
      catalog: finalCatalog,
      promotions: finalPromotions,
    };

    store.stores.push(newStore);

    // Update user subscription tier to store owner
    req.user.subscriptionTier = selectedTier;

    return res.status(201).json({
      message: `Comercio registrado con éxito en el Plan ${selectedTier === 'store_premium' ? 'Premium ($10.000 CLP/mes)' : 'Básico ($5.000 CLP/mes)'}.`,
      store: newStore,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar la tienda.' });
  }
}
