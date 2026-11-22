import { Request, Response } from 'express';
import { store } from '../services/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Pet, Species, PetSize } from '../types/index.js';
import { calculateEstimatedRadius } from '../services/geoService.js';
import { broadcastRadarWave } from '../services/socketService.js';

export function getMyPets(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });

  const userPets = store.pets.filter((p) => p.ownerId === req.user?.id);

  const enrichedPets = userPets.map((pet) => {
    if (pet.isLost && pet.lostSince) {
      const radiusData = calculateEstimatedRadius(pet.species, pet.size, pet.lostSince);
      return {
        ...pet,
        radar: radiusData,
      };
    }
    return pet;
  });

  return res.json({
    pets: enrichedPets,
    subscriptionTier: req.user.subscriptionTier,
    canAddMore: req.user.subscriptionTier !== 'free' || userPets.length < 1,
  });
}

export function registerPet(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });

  try {
    // ENFORCE FREEMIUM BUSINESS RULE:
    // Free tier users can ONLY register up to 1 pet.
    const userTier = req.user.subscriptionTier || 'free';
    const currentPetCount = store.pets.filter((p) => p.ownerId === req.user?.id).length;

    if (userTier === 'free' && currentPetCount >= 1) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        error:
          'Has alcanzado el límite de 1 mascota del Plan Gratuito. Suscríbete a UbicaDog Pro ($2.990 CLP/mes) para registrar mascotas ilimitadas, ficha médica y generar la placa QR para el collar.',
      });
    }

    const {
      name,
      species,
      breed,
      age,
      size,
      color,
      microchipNumber,
      collarDetails,
      photoUrl,
      homeLatitude,
      homeLongitude,
      homeAddress,
      description,
      rewardAmount,
      vaccines,
      allergies,
      sterilized,
    } = req.body;

    if (!name || !species || homeLatitude === undefined || homeLongitude === undefined) {
      return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Nombre, especie y ubicación de casa son requeridos.' });
    }

    const latNum = Number(homeLatitude);
    const lngNum = Number(homeLongitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas del hogar fuera de rango válido.' });
    }

    const petId = `pet_${Date.now()}`;
    // Generate Smart QR Code URL pointing to public emergency profile
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `https://ubicadog.com/p/${petId}`
    )}`;

    const newPet: Pet = {
      id: petId,
      ownerId: req.user.id,
      name,
      species: species as Species,
      breed: breed || 'Mestizo',
      age: age ? Number(age) : undefined,
      size: (size as PetSize) || 'medium',
      color: color || 'No especificado',
      microchipNumber,
      collarDetails,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
      homeLatitude: latNum,
      homeLongitude: lngNum,
      homeAddress: homeAddress || 'Dirección registrada',
      isLost: false,
      description,
      rewardAmount: rewardAmount ? Number(rewardAmount) : undefined,
      medicalRecord: {
        vaccines: Array.isArray(vaccines) ? vaccines : ['Antirrábica al día', 'Óctuple al día'],
        allergies: allergies || undefined,
        sterilized: Boolean(sterilized),
      },
      qrCodeUrl,
      createdAt: new Date().toISOString(),
    };

    store.pets.push(newPet);
    store.save();

    return res.status(201).json({
      message: 'Mascota registrada exitosamente.',
      pet: newPet,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar mascota.' });
  }
}

export function toggleLostStatus(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });

  const { petId } = req.params;
  const pet = store.pets.find((p) => p.id === petId);

  if (!pet) {
    return res.status(404).json({ error: 'Mascota no encontrada.' });
  }

  if (pet.ownerId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'employee') {
    return res.status(403).json({ error: 'No tiene permisos para modificar esta mascota.' });
  }

  pet.isLost = !pet.isLost;
  store.save();

  if (pet.isLost) {
    pet.lostSince = new Date().toISOString();
    pet.lastSeenLatitude = pet.homeLatitude;
    pet.lastSeenLongitude = pet.homeLongitude;

    const radiusData = calculateEstimatedRadius(pet.species, pet.size, pet.lostSince);

    broadcastRadarWave({
      type: 'lost_pet',
      title: `¡ALERTA URGENTE: ${pet.name.toUpperCase()} SE HA EXTRAVIADO!`,
      message: `${pet.name} (${pet.breed}) se extravió cerca de ${pet.homeAddress}. Radio inicial estimado: ${radiusData.formattedRadius}.`,
      latitude: pet.homeLatitude,
      longitude: pet.homeLongitude,
      radiusMeters: radiusData.radiusMeters,
      data: {
        petId: pet.id,
        petName: pet.name,
        photoUrl: pet.photoUrl,
        species: pet.species,
        rewardAmount: pet.rewardAmount,
      },
    });

    return res.json({
      message: `¡Alerta de búsqueda activada para ${pet.name}! Se ha generado la onda de alerta y notificado a los vecinos.`,
      pet: {
        ...pet,
        radar: radiusData,
      },
    });
  } else {
    pet.lostSince = undefined;
    return res.json({
      message: `¡Qué gran noticia! ${pet.name} ha sido marcado como recuperado y seguro en casa.`,
      pet,
    });
  }
}

export function getLostPetsRadar(req: Request, res: Response) {
  const lostPets = store.pets.filter((p) => p.isLost && p.lostSince);

  const radarList = lostPets.map((pet) => {
    const radiusInfo = calculateEstimatedRadius(pet.species, pet.size, pet.lostSince!);
    return {
      petId: pet.id,
      petName: pet.name,
      species: pet.species,
      breed: pet.breed,
      photoUrl: pet.photoUrl,
      centerLatitude: pet.lastSeenLatitude || pet.homeLatitude,
      centerLongitude: pet.lastSeenLongitude || pet.homeLongitude,
      homeAddress: pet.homeAddress,
      daysLost: radiusInfo.daysLost,
      radiusMeters: radiusInfo.radiusMeters,
      formattedRadius: radiusInfo.formattedRadius,
      lostSince: pet.lostSince!,
      collarDetails: pet.collarDetails,
      rewardAmount: pet.rewardAmount,
      ownerId: pet.ownerId,
    };
  });

  return res.json({ radarPets: radarList });
}

/**
 * Public Emergency Profile when someone scans the Smart QR Collar on the street!
 */
export function getPublicPetProfile(req: Request, res: Response) {
  const { petId } = req.params;
  const pet = store.pets.find((p) => p.id === petId);

  if (!pet) {
    return res.status(404).json({ error: 'Mascota no encontrada en el registro nacional de UbicaDog.' });
  }

  const owner = store.users.find((u) => u.id === pet.ownerId);

  return res.json({
    pet: {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      color: pet.color,
      collarDetails: pet.collarDetails,
      photoUrl: pet.photoUrl,
      isLost: pet.isLost,
      rewardAmount: pet.rewardAmount,
      medicalRecord: pet.medicalRecord,
      homeAddress: pet.homeAddress,
      ownerName: owner?.name || 'Tutor Registrado',
      ownerPhone: owner?.phone || '+56 9 9988 7766',
    },
  });
}

/**
 * Physical Security: High-Resolution Printable QR Collar Pass & Metal Engraving Kit
 * Domain invariant: Restricted to paid subscribers (pro_owner, store_premium) or super admin
 */
export function getPetPrintablePass(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });
  }

  const { petId } = req.params;
  const pet = store.pets.find((p) => p.id === petId);

  if (!pet) {
    return res.status(404).json({ code: 'NOT_FOUND', error: 'Mascota no encontrada.' });
  }

  if (pet.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ code: 'FORBIDDEN', error: 'No tienes permisos sobre esta mascota.' });
  }

  const userTier = req.user.subscriptionTier;
  const isPaidSubscriber = userTier && userTier !== 'free';
  const isAdmin = req.user.role === 'admin';
  const hasPurchasedPlate = Boolean(pet.hasPurchasedPlate);

  if (!isPaidSubscriber && !isAdmin && !hasPurchasedPlate) {
    return res.status(403).json({
      code: 'SUBSCRIPTION_LIMIT_REACHED',
      error: 'La descarga e impresión del Kit Oficial de Placa QR requiere una suscripción Pro activa ($2.990 CLP/mes) o la compra de la Placa Oficial ($4.500 CLP).',
      requiresUpgrade: true,
      priceClp: 4500,
    });
  }

  const owner = store.users.find((u) => u.id === pet.ownerId);

  return res.json({
    authorized: true,
    passKit: {
      petId: pet.id,
      petName: pet.name,
      species: pet.species,
      breed: pet.breed,
      photoUrl: pet.photoUrl,
      microchipNumber: pet.microchipNumber || 'No registrado',
      qrCodeUrl: pet.qrCodeUrl,
      publicUrl: `https://ubicadog.vercel.app/p/${pet.id}`,
      emergencyContactName: owner?.name || 'Tutor',
      emergencyPhone: owner?.phone || '+56 9 1234 5678',
      medicalSummary: pet.medicalRecord?.allergies || 'Sin alergias registradas',
      generatedAt: new Date().toISOString(),
      dimensionsMm: {
        collarPlate: '30mm x 30mm',
        printableCard: '85mm x 54mm (ID-1 / Tarjeta estándar)',
      },
    },
  });
}

/**
 * Purchase an individual engraved QR plate for a single pet ($4.500 CLP)
 */
export async function purchasePetPlate(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });
  }

  const { petId } = req.params;
  const pet = store.pets.find((p) => p.id === petId);

  if (!pet) {
    return res.status(404).json({ code: 'NOT_FOUND', error: 'Mascota no encontrada.' });
  }

  if (pet.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ code: 'FORBIDDEN', error: 'No tienes permisos sobre esta mascota.' });
  }

  pet.hasPurchasedPlate = true;
  await store.save();

  return res.json({
    message: `¡Placa QR oficial activada para ${pet.name}!`,
    priceClp: 4500,
    pet,
  });
}

