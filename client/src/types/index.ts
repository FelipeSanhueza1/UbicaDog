export type Role = 'user' | 'employee' | 'admin';
export type Species = 'dog' | 'cat' | 'other';
export type PetSize = 'small' | 'medium' | 'large';
export type CollarStatus = 'with_collar' | 'no_collar' | 'unknown';
export type AnimalCondition = 'healthy' | 'injured' | 'scared' | 'wandering';
export type SubscriptionTier = 'free' | 'pro_owner' | 'store_basic' | 'store_premium';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
}

export interface PetRadar {
  daysLost: number;
  radiusMeters: number;
  formattedRadius: string;
}

export interface PetMedicalRecord {
  vaccines: string[];
  allergies?: string;
  sterilized: boolean;
  notes?: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: Species;
  breed: string;
  age?: number;
  size: PetSize;
  color: string;
  microchipNumber?: string;
  collarDetails?: string;
  photoUrl: string;
  homeLatitude: number;
  homeLongitude: number;
  homeAddress: string;
  isLost: boolean;
  lostSince?: string;
  description?: string;
  rewardAmount?: number;
  medicalRecord?: PetMedicalRecord;
  qrCodeUrl?: string;
  radar?: PetRadar;
  createdAt: string;
}

export interface LostRadarPet {
  petId: string;
  petName: string;
  species: Species;
  breed: string;
  photoUrl: string;
  centerLatitude: number;
  centerLongitude: number;
  homeAddress: string;
  daysLost: number;
  radiusMeters: number;
  formattedRadius: string;
  lostSince: string;
  collarDetails?: string;
  rewardAmount?: number;
  ownerId: string;
}

export interface Sighting {
  id: string;
  reporterId?: string;
  reporterName?: string;
  species: Species;
  breed?: string;
  collarStatus: CollarStatus;
  condition: AnimalCondition;
  photoUrl: string;
  latitude: number;
  longitude: number;
  address?: string;
  seenAt: string;
  notes?: string;
  contactPhone?: string;
  status: 'active' | 'resolved' | 'hidden';
  createdAt: string;
}

export interface RadarWaveAlert {
  id: string;
  type: 'lost_pet' | 'sighting' | 'admin_broadcast';
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  data?: any;
  timestamp: number;
}

export interface Veterinary {
  id: string;
  clinicName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp?: string;
  rating: number;
  reviewCount: number;
  isEmergency24h: boolean;
  openingHours: string;
  photoUrl: string;
  services: string[];
  distanceMeters?: number;
  formattedDistance?: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
}

export interface StorePromotion {
  id: string;
  title: string;
  discountPercent: number;
  code: string;
  validUntil: string;
}

export interface PetStore {
  id: string;
  businessName: string;
  tier: 'store_basic' | 'store_premium';
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp?: string;
  logoUrl: string;
  description: string;
  openingHours: string;
  websiteUrl?: string;
  catalog: StoreProduct[];
  promotions: StorePromotion[];
  distanceMeters?: number;
  formattedDistance?: string;
  isPromoted: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  target: 'owner' | 'store';
  priceClp: number;
  priceLabel: string;
  popular?: boolean;
  benefits: string[];
  maxPets?: number;
  maxProducts?: number;
}
