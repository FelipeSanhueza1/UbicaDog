import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { User, Pet, Sighting, Veterinary, PetStore, Subscription } from '../types/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ubica_store.json');

class DataStore {
  public users: User[] = [];
  public pets: Pet[] = [];
  public sightings: Sighting[] = [];
  public veterinaries: Veterinary[] = [];
  public stores: PetStore[] = [];
  public subscriptions: Subscription[] = [];

  constructor() {
    this.load();
  }

  public load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.pets = parsed.pets || [];
        this.sightings = parsed.sightings || [];
        this.veterinaries = parsed.veterinaries || [];
        this.stores = parsed.stores || [];
        this.subscriptions = parsed.subscriptions || [];

        // Ensure super admin always exists in the user database
        if (!this.users.some((u) => u.role === 'admin')) {
          this.seedSuperAdmin();
          this.save();
        }
        return;
      }
    } catch (err) {
      console.warn('⚠️ [DataStore] Error reading local store file, falling back to seed:', err);
    }

    this.seedInitialData();
    this.save();
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const payload = {
        users: this.users,
        pets: this.pets,
        sightings: this.sightings,
        veterinaries: this.veterinaries,
        stores: this.stores,
        subscriptions: this.subscriptions,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('⚠️ [DataStore] Error persisting database to disk:', err);
    }
  }

  private seedSuperAdmin() {
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'UbicaDogAdmin2026!';
    const adminHash = bcrypt.hashSync(adminPassword, 10);
    this.users.push({
      id: 'usr_admin',
      email: process.env.ADMIN_EMAIL || 'admin@ubicadog.com',
      password: adminHash,
      name: 'Super Administrador UbicaDog',
      role: 'admin',
      phone: '+56912345678',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      subscriptionTier: 'pro_owner',
      createdAt: new Date().toISOString(),
    });
  }

  private seedInitialData() {
    this.users = [];
    this.seedSuperAdmin();

    // Cleaned arrays for actual user test data
    this.pets = [];
    this.sightings = [];
    this.veterinaries = [];

    // Reference center coordinates: Santiago, Chile (-33.4489, -70.6693)
    const baseLat = -33.4489;
    const baseLng = -70.6693;

    // Seed Pet Stores (Basic $5.000 vs Premium $10.000 with promo coupons & catalogs)
    this.stores = [
      {
        id: 'store_01',
        businessName: 'Mundo Canino & Felino Gourmet',
        tier: 'store_premium', // $10.000 CLP tier: promoted, golden pin, catalog & coupons
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
        tier: 'store_basic', // $5.000 CLP tier: basic storefront
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
  }
}

export const store = new DataStore();
