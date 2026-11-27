import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { mapPet } from '../services/dbMappers.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Species, PetSize } from '../types/index.js';
import { calculateEstimatedRadius, isValidCoordinates } from '../services/geoService.js';
import { broadcastRadarWave } from '../services/socketService.js';

export async function getMyPets(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });

  try {
    const petRows = await prisma.pet.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedPets = petRows.map((row) => {
      const pet = mapPet(row);
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
      canAddMore: req.user.subscriptionTier !== 'free' || petRows.length < 1,
    });
  } catch (error) {
    console.error('getMyPets error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al consultar tus mascotas.' });
  }
}

export async function registerPet(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });

  try {
    // ENFORCE FREEMIUM BUSINESS RULE:
    // Free tier users can ONLY register up to 1 pet.
    const userTier = req.user.subscriptionTier || 'free';
    const currentPetCount = await prisma.pet.count({
      where: { ownerId: req.user.id },
    });

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
    if (!isValidCoordinates(latNum, lngNum)) {
      return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas del hogar fuera de rango válido.' });
    }

    const normalizedChip =
      microchipNumber && String(microchipNumber).trim() !== '' ? String(microchipNumber).trim() : null;

    if (normalizedChip) {
      const existingChip = await prisma.pet.findUnique({
        where: { microchipNumber: normalizedChip },
      });
      if (existingChip) {
        return res.status(409).json({
          code: 'DUPLICATE_MICROCHIP',
          error: 'Ya existe una mascota registrada en UbicaDog con ese número de microchip.',
        });
      }
    }

    const petId = `pet_${Date.now()}`;
    // Generate Smart QR Code URL pointing to public emergency profile
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `https://ubicadog.com/p/${petId}`
    )}`;

    const createdRow = await prisma.pet.create({
      data: {
        id: petId,
        ownerId: req.user.id,
        name: String(name).trim(),
        species: species as Species,
        breed: breed ? String(breed).trim() : 'Mestizo',
        age: age !== undefined && age !== '' ? Number(age) : null,
        size: (size as PetSize) || 'medium',
        color: color ? String(color).trim() : 'No especificado',
        microchipNumber: normalizedChip,
        collarDetails: collarDetails ? String(collarDetails) : null,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
        homeLatitude: latNum,
        homeLongitude: lngNum,
        homeAddress: homeAddress || 'Dirección registrada',
        isLost: false,
        description: description ? String(description) : null,
        rewardAmount: rewardAmount !== undefined && rewardAmount !== '' ? Number(rewardAmount) : null,
        vaccines: Array.isArray(vaccines) ? vaccines : ['Antirrábica al día', 'Óctuple al día'],
        allergies: allergies ? String(allergies) : null,
        sterilized: Boolean(sterilized),
        qrCodeUrl,
        hasPurchasedPlate: false,
      },
    });

    return res.status(201).json({
      message: 'Mascota registrada exitosamente.',
      pet: mapPet(createdRow),
    });
  } catch (error) {
    console.error('registerPet error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al registrar mascota.' });
  }
}

export async function toggleLostStatus(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });

  try {
    const petId = String(req.params.petId);
    const petRow = await prisma.pet.findUnique({ where: { id: petId } });

    if (!petRow) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Mascota no encontrada.' });
    }

    if (petRow.ownerId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'No tiene permisos para modificar esta mascota.' });
    }

    const nextIsLost = !petRow.isLost;
    const nowDate = new Date();

    const updatedRow = await prisma.pet.update({
      where: { id: petId },
      data: nextIsLost
        ? {
            isLost: true,
            lostSince: nowDate,
            lastSeenLatitude: petRow.homeLatitude,
            lastSeenLongitude: petRow.homeLongitude,
          }
        : {
            isLost: false,
            lostSince: null,
          },
    });

    const pet = mapPet(updatedRow);

    if (nextIsLost && pet.lostSince) {
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
    }

    return res.json({
      message: `¡Qué gran noticia! ${pet.name} ha sido marcado como recuperado y seguro en casa.`,
      pet,
    });
  } catch (error) {
    console.error('toggleLostStatus error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al actualizar estado de pérdida.' });
  }
}

export async function getLostPetsRadar(req: Request, res: Response) {
  try {
    const lostRows = await prisma.pet.findMany({
      where: {
        isLost: true,
        lostSince: { not: null },
      },
      orderBy: { lostSince: 'desc' },
    });

    const radarList = lostRows.map((row) => {
      const lostSinceIso = row.lostSince!.toISOString();
      const radiusInfo = calculateEstimatedRadius(row.species, row.size, lostSinceIso);
      return {
        petId: row.id,
        petName: row.name,
        species: row.species,
        breed: row.breed,
        photoUrl: row.photoUrl,
        centerLatitude: row.lastSeenLatitude ?? row.homeLatitude,
        centerLongitude: row.lastSeenLongitude ?? row.homeLongitude,
        homeAddress: row.homeAddress,
        daysLost: radiusInfo.daysLost,
        radiusMeters: radiusInfo.radiusMeters,
        formattedRadius: radiusInfo.formattedRadius,
        lostSince: lostSinceIso,
        collarDetails: row.collarDetails ?? undefined,
        rewardAmount: row.rewardAmount ?? undefined,
        ownerId: row.ownerId,
      };
    });

    return res.json({ radarPets: radarList });
  } catch (error) {
    console.error('getLostPetsRadar error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al obtener mascotas en radar.' });
  }
}

/**
 * Public Emergency Profile when someone scans the Smart QR Collar on the street!
 */
export async function getPublicPetProfile(req: Request, res: Response) {
  try {
    const petId = String(req.params.petId);
    const petRow = await prisma.pet.findUnique({
      where: { id: petId },
      include: { owner: true },
    });

    if (!petRow) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Mascota no encontrada en el registro nacional de UbicaDog.' });
    }

    const pet = mapPet(petRow);

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
        ownerName: petRow.owner?.name || 'Tutor Registrado',
        ownerPhone: petRow.owner?.phone || '+56 9 9988 7766',
      },
    });
  } catch (error) {
    console.error('getPublicPetProfile error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al consultar ficha pública.' });
  }
}

/**
 * Physical Security: High-Resolution Printable QR Collar Pass & Metal Engraving Kit
 * Domain invariant: Restricted to paid subscribers (pro_owner, store_premium), plate buyers, or super admin
 */
export async function getPetPrintablePass(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });
  }

  try {
    const petId = String(req.params.petId);
    const petRow = await prisma.pet.findUnique({
      where: { id: petId },
      include: { owner: true },
    });

    if (!petRow) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Mascota no encontrada.' });
    }

    if (petRow.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'No tienes permisos sobre esta mascota.' });
    }

    const userTier = req.user.subscriptionTier;
    const isPaidSubscriber = userTier && userTier !== 'free';
    const isAdmin = req.user.role === 'admin';
    const hasPurchasedPlate = Boolean(petRow.hasPurchasedPlate);

    if (!isPaidSubscriber && !isAdmin && !hasPurchasedPlate) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        error: 'La descarga e impresión del Kit Oficial de Placa QR requiere una suscripción Pro activa ($2.990 CLP/mes) o la compra de la Placa Oficial ($4.500 CLP).',
        requiresUpgrade: true,
        priceClp: 4500,
      });
    }

    return res.json({
      authorized: true,
      passKit: {
        petId: petRow.id,
        petName: petRow.name,
        species: petRow.species,
        breed: petRow.breed,
        photoUrl: petRow.photoUrl,
        microchipNumber: petRow.microchipNumber || 'No registrado',
        qrCodeUrl: petRow.qrCodeUrl,
        publicUrl: `https://ubicadog.vercel.app/p/${petRow.id}`,
        emergencyContactName: petRow.owner?.name || 'Tutor',
        emergencyPhone: petRow.owner?.phone || '+56 9 1234 5678',
        medicalSummary: petRow.allergies || 'Sin alergias registradas',
        generatedAt: new Date().toISOString(),
        dimensionsMm: {
          collarPlate: '30mm x 30mm',
          printableCard: '85mm x 54mm (ID-1 / Tarjeta estándar)',
        },
      },
    });
  } catch (error) {
    console.error('getPetPrintablePass error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al generar kit de placa QR.' });
  }
}

/**
 * Purchase an individual engraved QR plate for a single pet ($4.500 CLP)
 */
export async function purchasePetPlate(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });
  }

  try {
    const petId = String(req.params.petId);
    const petRow = await prisma.pet.findUnique({ where: { id: petId } });

    if (!petRow) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Mascota no encontrada.' });
    }

    if (petRow.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'No tienes permisos sobre esta mascota.' });
    }

    const updatedRow = await prisma.pet.update({
      where: { id: petId },
      data: { hasPurchasedPlate: true },
    });

    return res.json({
      message: `¡Placa QR oficial activada para ${updatedRow.name}!`,
      priceClp: 4500,
      pet: mapPet(updatedRow),
    });
  } catch (error) {
    console.error('purchasePetPlate error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al procesar activación de placa.' });
  }
}
