import {
  User as PrismaUser,
  Pet as PrismaPet,
  Sighting as PrismaSighting,
  Veterinary as PrismaVeterinary,
  PetStore as PrismaPetStore,
  Subscription as PrismaSubscription,
} from '@prisma/client';
import {
  User,
  Pet,
  Sighting,
  Veterinary,
  PetStore,
  Subscription,
  StoreProduct,
  StorePromotion,
} from '../types/index.js';

/**
 * Maps a Prisma User row into the application's User interface.
 */
export function mapUser(row: PrismaUser): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password ?? undefined,
    name: row.name,
    role: row.role,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    homeAddress: row.homeAddress ?? undefined,
    homeLatitude: row.homeLatitude ?? undefined,
    homeLongitude: row.homeLongitude ?? undefined,
    googleId: row.googleId ?? undefined,
    subscriptionTier: row.subscriptionTier,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Strips the password hash before returning a User object to clients.
 */
export function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Maps a Prisma Pet row (flat medical fields) into the domain Pet interface.
 */
export function mapPet(row: PrismaPet): Pet {
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    species: row.species,
    breed: row.breed,
    age: row.age ?? undefined,
    size: row.size,
    color: row.color,
    microchipNumber: row.microchipNumber ?? undefined,
    collarDetails: row.collarDetails ?? undefined,
    photoUrl: row.photoUrl,
    homeLatitude: row.homeLatitude,
    homeLongitude: row.homeLongitude,
    homeAddress: row.homeAddress,
    isLost: row.isLost,
    lostSince: row.lostSince ? row.lostSince.toISOString() : undefined,
    lastSeenLatitude: row.lastSeenLatitude ?? undefined,
    lastSeenLongitude: row.lastSeenLongitude ?? undefined,
    description: row.description ?? undefined,
    rewardAmount: row.rewardAmount ?? undefined,
    medicalRecord: {
      vaccines: row.vaccines || [],
      allergies: row.allergies ?? undefined,
      sterilized: row.sterilized,
      notes: row.medicalNotes ?? undefined,
    },
    qrCodeUrl: row.qrCodeUrl ?? undefined,
    hasPurchasedPlate: row.hasPurchasedPlate,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Maps a Prisma Sighting row into the domain Sighting interface.
 */
export function mapSighting(row: PrismaSighting): Sighting {
  return {
    id: row.id,
    reporterId: row.reporterId ?? undefined,
    reporterName: row.reporterName ?? undefined,
    species: row.species,
    breed: row.breed ?? undefined,
    collarStatus: row.collarStatus,
    condition: row.condition,
    photoUrl: row.photoUrl,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address ?? undefined,
    seenAt: row.seenAt.toISOString(),
    notes: row.notes ?? undefined,
    contactPhone: row.contactPhone ?? undefined,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Maps a Prisma Veterinary row into the domain Veterinary interface.
 */
export function mapVeterinary(row: PrismaVeterinary): Veterinary {
  return {
    id: row.id,
    clinicName: row.clinicName,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    rating: row.rating,
    reviewCount: row.reviewCount,
    isEmergency24h: row.isEmergency24h,
    openingHours: row.openingHours,
    photoUrl: row.photoUrl,
    services: row.services || [],
  };
}

/**
 * Maps a Prisma PetStore row into the domain PetStore interface.
 */
export function mapPetStore(row: PrismaPetStore): PetStore {
  return {
    id: row.id,
    ownerId: row.ownerId ?? undefined,
    businessName: row.businessName,
    tier: row.tier === 'store_premium' ? 'store_premium' : 'store_basic',
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    logoUrl: row.logoUrl,
    coverUrl: row.coverUrl ?? undefined,
    description: row.description,
    openingHours: row.openingHours,
    websiteUrl: row.websiteUrl ?? undefined,
    catalog: Array.isArray(row.catalog) ? (row.catalog as unknown as StoreProduct[]) : [],
    promotions: Array.isArray(row.promotions) ? (row.promotions as unknown as StorePromotion[]) : [],
  };
}

/**
 * Maps a Prisma Subscription row into the domain Subscription interface.
 */
export function mapSubscription(row: PrismaSubscription): Subscription {
  return {
    id: row.id,
    userId: row.userId,
    tier: row.tier,
    status:
      row.status === 'canceled' || row.status === 'past_due' ? row.status : 'active',
    stripeSubscriptionId: row.stripeSubscriptionId ?? undefined,
    currentPeriodEnd: row.currentPeriodEnd.toISOString(),
    priceClp: row.priceClp,
  };
}
