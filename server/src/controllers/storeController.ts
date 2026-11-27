import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../services/prisma.js';
import { mapPetStore } from '../services/dbMappers.js';
import { calculateDistanceMeters, isValidCoordinates } from '../services/geoService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getNearbyStores(req: Request, res: Response) {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : -33.4489;
    const lng = req.query.lng ? Number(req.query.lng) : -70.6693;

    if (!isValidCoordinates(lat, lng)) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas fuera de rango válido.' });
    }

    const radiusMeters = req.query.radiusMeters ? Number(req.query.radiusMeters) : 30000;
    const storeRows = await prisma.petStore.findMany();

    let list = storeRows.map((row) => {
      const s = mapPetStore(row);
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
    console.error('getNearbyStores error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al consultar tiendas de mascotas.' });
  }
}

export async function registerStore(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });

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
      return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Nombre comercial, dirección y coordenadas son requeridos.' });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (!isValidCoordinates(latNum, lngNum)) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas de tienda fuera de rango válido.' });
    }

    const selectedTier = tier === 'store_premium' ? 'store_premium' : 'store_basic';

    // Store Basic ($5.000 CLP): max 5 products, no promotions
    let finalCatalog = Array.isArray(catalog) ? catalog : [];
    let finalPromotions = Array.isArray(promotions) ? promotions : [];

    if (selectedTier === 'store_basic') {
      finalCatalog = finalCatalog.slice(0, 5);
      finalPromotions = []; // Promotions only available on $10.000 Premium tier
    }

    const userId = req.user.id;
    const [createdRow] = await prisma.$transaction([
      prisma.petStore.create({
        data: {
          id: `store_${Date.now()}`,
          ownerId: userId,
          businessName: String(businessName).trim(),
          tier: selectedTier,
          address: String(address).trim(),
          latitude: latNum,
          longitude: lngNum,
          phone: phone ? String(phone) : '',
          whatsapp: whatsapp || phone || null,
          logoUrl: logoUrl || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=200&q=80',
          description: description || 'Local de venta de artículos y alimentos para mascotas.',
          openingHours: openingHours || 'Lun a Sáb 09:30 - 20:00',
          websiteUrl: websiteUrl ?? null,
          catalog: finalCatalog as unknown as Prisma.InputJsonValue,
          promotions: finalPromotions as unknown as Prisma.InputJsonValue,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: selectedTier },
      }),
    ]);

    return res.status(201).json({
      message: `Comercio registrado con éxito en el Plan ${selectedTier === 'store_premium' ? 'Premium ($10.000 CLP/mes)' : 'Básico ($5.000 CLP/mes)'}.`,
      store: mapPetStore(createdRow),
    });
  } catch (error) {
    console.error('registerStore error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al registrar la tienda.' });
  }
}
