import bcrypt from 'bcryptjs';
import { User, Pet, Sighting, Veterinary, PetStore, Subscription } from '../types/index.js';

class DataStore {
  public users: User[] = [];
  public pets: Pet[] = [];
  public sightings: Sighting[] = [];
  public veterinaries: Veterinary[] = [];
  public stores: PetStore[] = [];
  public subscriptions: Subscription[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'UbicaDogAdmin2026!';
    const adminHash = bcrypt.hashSync(adminPassword, 10);

    // Initial Users: ONLY Super Admin configured for secure administration & testing
    this.users = [
      {
        id: 'usr_admin',
        email: process.env.ADMIN_EMAIL || 'admin@ubicadog.com',
        password: adminHash,
        name: 'Super Administrador UbicaDog',
        role: 'admin',
        phone: '+56912345678',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        subscriptionTier: 'pro_owner',
        createdAt: new Date().toISOString(),
      },
    ];

    // Reference center coordinates: Santiago, Chile (-33.4489, -70.6693)
    const baseLat = -33.4489;
    const baseLng = -70.6693;

    // Reset pets and street sightings for clean testing
    this.pets = [];
    this.sightings = [];

    // Seed Veterinaries (Ranked with diverse ratings and 24h emergency filters)
    this.veterinaries = [
      {
        id: 'vet_01',
        clinicName: 'Hospital Veterinario Central 24 Horas',
        address: 'Av. Francisco Bilbao 1820, Providencia',
        latitude: baseLat + 0.006,
        longitude: baseLng + 0.012,
        phone: '+56223456789',
        whatsapp: '+56911223344',
        rating: 4.9,
        reviewCount: 382,
        isEmergency24h: true,
        openingHours: 'Abierto 24 horas (Urgencias y Cuidados Intensivos)',
        photoUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80',
        services: ['Urgencias 24h', 'Cirugía', 'Ecografía', 'Pabellón Quirúrgico', 'Banco de Sangre'],
      },
      {
        id: 'vet_02',
        clinicName: 'Clínica Veterinaria Andes Pet',
        address: 'Calle Manuel Montt 640, Providencia',
        latitude: baseLat + 0.002,
        longitude: baseLng - 0.003,
        phone: '+56228765432',
        whatsapp: '+56922334455',
        rating: 4.8,
        reviewCount: 215,
        isEmergency24h: false,
        openingHours: 'Lun a Sáb 09:00 - 20:30',
        photoUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80',
        services: ['Consulta General', 'Vacunación', 'Microchip Oficial', 'Odontología Canina'],
      },
      {
        id: 'vet_03',
        clinicName: 'Centro Médico Veterinario San Francisco (24/7)',
        address: 'Av. Matta 980, Santiago Centro',
        latitude: baseLat - 0.012,
        longitude: baseLng - 0.005,
        phone: '+56226543210',
        whatsapp: '+56933445566',
        rating: 4.7,
        reviewCount: 420,
        isEmergency24h: true,
        openingHours: 'Abierto 24 Horas continuas',
        photoUrl: 'https://images.unsplash.com/photo-1628009368231-7bb3cfc3829c?auto=format&fit=crop&w=600&q=80',
        services: ['Traumatología', 'Radiografías', 'Hospitalización', 'Cirugías de Urgencia'],
      },
      {
        id: 'vet_04',
        clinicName: 'Clínica Veterinaria Santa Isabel',
        address: 'Santa Isabel 420, Santiago',
        latitude: baseLat - 0.005,
        longitude: baseLng + 0.008,
        phone: '+56227654321',
        rating: 4.4,
        reviewCount: 98,
        isEmergency24h: false,
        openingHours: 'Lun a Vie 10:00 - 19:00, Sáb 10:00 - 14:00',
        photoUrl: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=600&q=80',
        services: ['Medicina Preventiva', 'Farmacia Veterinaria', 'Vacunas'],
      },
      {
        id: 'vet_05',
        clinicName: 'Consultorio Veterinario La Esquina',
        address: 'Calle Vicuña Mackenna 150',
        latitude: baseLat + 0.008,
        longitude: baseLng - 0.015,
        phone: '+56221122334',
        rating: 3.9,
        reviewCount: 45,
        isEmergency24h: false,
        openingHours: 'Lun a Vie 11:00 - 18:00',
        photoUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80',
        services: ['Atención básica', 'Desparasitación'],
      },
      {
        id: 'vet_valpo_01',
        clinicName: 'Hospital Veterinario Costa Central (24 Horas)',
        address: 'Av. Libertad 780, Viña del Mar / Valparaíso',
        latitude: -33.0153,
        longitude: -71.5518,
        phone: '+56322334455',
        whatsapp: '+56944556677',
        rating: 4.9,
        reviewCount: 380,
        isEmergency24h: true,
        openingHours: 'Urgencias 24/7',
        photoUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80',
        services: ['Urgencias 24h', 'Cirugías Complejas', 'Pabellón Quirúrgico', 'Ecografía'],
      },
      {
        id: 'vet_conce_01',
        clinicName: 'Clínica Veterinaria Sur Biobío (24/7)',
        address: 'Av. O Higgins 1200, Concepción',
        latitude: -36.827,
        longitude: -73.0503,
        phone: '+56412889900',
        whatsapp: '+56955667788',
        rating: 4.8,
        reviewCount: 290,
        isEmergency24h: true,
        openingHours: 'Atención continuada 24 Horas',
        photoUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80',
        services: ['UCI Veterinaria', 'Banco de Sangre Canina', 'Traumatología', 'Ambulancia'],
      },
    ];

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
