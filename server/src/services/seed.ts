import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { PetStore } from '../types/index.js';

const baseLat = -33.4489;
const baseLng = -70.6693;

export const DEFAULT_STORES: PetStore[] = [
  {
    id: 'store_01',
    businessName: 'Mundo Canino & Felino Gourmet',
    tier: 'store_premium',
    address: 'Av. Providencia 2150, Providencia',
    latitude: baseLat + 0.007,
    longitude: baseLng + 0.015,
    phone: '+56987651234',
    whatsapp: '+56987651234',
    logoUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=200&q=80',
    description: 'Tienda premium de alimentos balanceados, antiparasitarios, snacks naturales y accesorios.',
    openingHours: 'Lun a Sáb 09:30 - 20:00',
    websiteUrl: 'https://mundocanino.cl',
    catalog: [
      { id: 'prod_1', name: 'Alimento Super Premium Dog 15kg', price: 54990 },
      { id: 'prod_2', name: 'Arnés Táctico Anti-tirones con Reflectante', price: 18990 },
      { id: 'prod_3', name: 'Placa Grabada Láser de Acero Inox', price: 6990 },
      { id: 'prod_4', name: 'Antipulgas Pipeta Triple Acción', price: 12990 },
    ],
    promotions: [
      {
        id: 'promo_1',
        title: '15% Descuento para Comunidad UbicaDog',
        discountPercent: 15,
        code: 'UBICADOG15',
        validUntil: '2026-12-31',
      },
    ],
  },
  {
    id: 'store_02',
    businessName: 'Pet Shop Barrio Parque',
    tier: 'store_basic',
    address: 'Av. Bustamante 112, Providencia',
    latitude: baseLat - 0.004,
    longitude: baseLng + 0.005,
    phone: '+56991234567',
    whatsapp: '+56991234567',
    logoUrl: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=200&q=80',
    description: 'Venta de correas, juguetes mordedores y arena sanitaria para gatos.',
    openingHours: 'Lun a Sáb 10:00 - 19:30',
    catalog: [
      { id: 'p_1', name: 'Arena Sanitaria Aglomerante 10kg', price: 9990 },
      { id: 'p_2', name: 'Collar de Nylon con Cascabel', price: 3990 },
    ],
    promotions: [],
  },
  {
    id: 'store_03',
    businessName: 'Boutique & Farmacia Mascotas San Cristóbal',
    tier: 'store_premium',
    address: 'Pio Nono 350, Recoleta',
    latitude: baseLat + 0.016,
    longitude: baseLng - 0.002,
    phone: '+56955443322',
    whatsapp: '+56955443322',
    logoUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=200&q=80',
    description: 'Medicamentos veterinarios, alimento medicado Prescription Diet y accesorios ortopédicos.',
    openingHours: 'Lun a Dom 09:00 - 21:00',
    catalog: [
      { id: 'prod_10', name: 'Collar GPS Bluetooth para Perro/Gato', price: 29990 },
      { id: 'prod_11', name: 'Alimento Hipoalergénico 10kg', price: 46990 },
    ],
    promotions: [
      {
        id: 'promo_2',
        title: '10% OFF en Farmacia Veterinaria',
        discountPercent: 10,
        code: 'FARMAUBICA',
        validUntil: '2026-12-31',
      },
    ],
  },
];

/**
 * Ensures the PostgreSQL database always has the Super Admin account and initial B2B stores.
 * Safe and idempotent to call on every server boot.
 */
export async function ensureSeedData(): Promise<void> {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (!existingAdmin) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ubicadog.com').toLowerCase();
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'UbicaDogAdmin2026!';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'admin', subscriptionTier: 'pro_owner' },
      create: {
        id: 'usr_admin',
        email: adminEmail,
        password: adminHash,
        name: 'Super Administrador UbicaDog',
        role: 'admin',
        phone: '+56912345678',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        subscriptionTier: 'pro_owner',
      },
    });
    console.log(`✅ [Seed] Super Administrador verificado (${adminEmail})`);
  }

  const storeCount = await prisma.petStore.count();
  if (storeCount === 0) {
    for (const s of DEFAULT_STORES) {
      await prisma.petStore.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          businessName: s.businessName,
          tier: s.tier,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          phone: s.phone,
          whatsapp: s.whatsapp ?? null,
          logoUrl: s.logoUrl,
          description: s.description,
          openingHours: s.openingHours,
          websiteUrl: s.websiteUrl ?? null,
          catalog: s.catalog as unknown as Prisma.InputJsonValue,
          promotions: s.promotions as unknown as Prisma.InputJsonValue,
        },
      });
    }
    console.log(`✅ [Seed] ${DEFAULT_STORES.length} comercios asociados cargados en PostgreSQL.`);
  }
}

/**
 * One-time helper to import records from legacy local JSON store (server/data/ubica_store.json)
 * into PostgreSQL without duplicating existing IDs or test pollution records.
 */
export async function importLegacyJsonStore(jsonFilePath?: string): Promise<{ users: number; pets: number; sightings: number }> {
  const targetPath = jsonFilePath || path.resolve(process.cwd(), 'data', 'ubica_store.json');
  if (!fs.existsSync(targetPath)) {
    return { users: 0, pets: 0, sightings: 0 };
  }

  const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
  let importedUsers = 0;
  let importedPets = 0;
  let importedSightings = 0;

  for (const u of parsed.users || []) {
    if (u.id === 'usr_regular') continue; // Skip old test artifact user
    const existing = await prisma.user.findUnique({ where: { email: u.email.toLowerCase() } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email.toLowerCase(),
          password: u.password ?? null,
          name: u.name,
          role: u.role || 'user',
          phone: u.phone ?? null,
          avatarUrl: u.avatarUrl ?? null,
          homeAddress: u.homeAddress ?? null,
          homeLatitude: u.homeLatitude ?? null,
          homeLongitude: u.homeLongitude ?? null,
          googleId: u.googleId ?? null,
          subscriptionTier: u.subscriptionTier || 'free',
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        },
      });
      importedUsers++;
    }
  }

  for (const p of parsed.pets || []) {
    const owner = await prisma.user.findUnique({ where: { id: p.ownerId } });
    if (!owner) continue;

    const existingPet = await prisma.pet.findUnique({ where: { id: p.id } });
    if (!existingPet) {
      const chip = p.microchipNumber && String(p.microchipNumber).trim() !== '' ? String(p.microchipNumber).trim() : null;
      await prisma.pet.create({
        data: {
          id: p.id,
          ownerId: p.ownerId,
          name: p.name,
          species: p.species || 'dog',
          breed: p.breed || 'Mestizo',
          age: p.age ?? null,
          size: p.size || 'medium',
          color: p.color || 'No especificado',
          microchipNumber: chip,
          collarDetails: p.collarDetails || null,
          photoUrl: p.photoUrl,
          homeLatitude: Number(p.homeLatitude),
          homeLongitude: Number(p.homeLongitude),
          homeAddress: p.homeAddress || 'Dirección registrada',
          isLost: Boolean(p.isLost),
          lostSince: p.lostSince ? new Date(p.lostSince) : null,
          lastSeenLatitude: p.lastSeenLatitude ?? null,
          lastSeenLongitude: p.lastSeenLongitude ?? null,
          description: p.description || null,
          rewardAmount: p.rewardAmount ?? null,
          qrCodeUrl: p.qrCodeUrl ?? null,
          hasPurchasedPlate: Boolean(p.hasPurchasedPlate),
          vaccines: p.medicalRecord?.vaccines || [],
          allergies: p.medicalRecord?.allergies ?? null,
          sterilized: Boolean(p.medicalRecord?.sterilized),
          medicalNotes: p.medicalRecord?.notes ?? null,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        },
      });
      importedPets++;
    }
  }

  for (const s of parsed.sightings || []) {
    const existingSighting = await prisma.sighting.findUnique({ where: { id: s.id } });
    if (!existingSighting) {
      await prisma.sighting.create({
        data: {
          id: s.id,
          reporterId: s.reporterId ?? null,
          reporterName: s.reporterName ?? null,
          species: s.species || 'dog',
          breed: s.breed ?? null,
          collarStatus: s.collarStatus || 'unknown',
          condition: s.condition || 'wandering',
          photoUrl: s.photoUrl,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          address: s.address ?? null,
          seenAt: s.seenAt ? new Date(s.seenAt) : new Date(),
          notes: s.notes ?? null,
          contactPhone: s.contactPhone ?? null,
          status: s.status || 'active',
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        },
      });
      importedSightings++;
    }
  }

  return { users: importedUsers, pets: importedPets, sightings: importedSightings };
}

// CLI execution entrypoint (`npx tsx src/services/seed.ts [--import-json]`)
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.ts');
if (isDirectRun) {
  (async () => {
    try {
      await ensureSeedData();
      if (process.argv.includes('--import-json')) {
        const result = await importLegacyJsonStore();
        console.log(`📦 [Import] Migrados desde JSON local:`, result);
      }
      process.exit(0);
    } catch (err) {
      console.error('❌ Error ejecutando seed:', err);
      process.exit(1);
    }
  })();
}
