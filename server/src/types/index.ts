export type Role = 'user' | 'employee' | 'admin';

export type Species = 'dog' | 'cat' | 'other';

export type PetSize = 'small' | 'medium' | 'large';

export type CollarStatus = 'with_collar' | 'no_collar' | 'unknown';

export type AnimalCondition = 'healthy' | 'injured' | 'scared' | 'wandering';

export type SubscriptionTier = 'free' | 'pro_owner' | 'store_basic' | 'store_premium';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due';
  stripeSubscriptionId?: string;
  currentPeriodEnd: string;
  priceClp: number;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  googleId?: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
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
  lastSeenLatitude?: number;
  lastSeenLongitude?: number;
  description?: string;
  rewardAmount?: number;
  medicalRecord?: PetMedicalRecord;
  qrCodeUrl?: string;
  createdAt: string;
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

export interface LostRadarData {
  petId: string;
  petName: string;
  species: Species;
  photoUrl: string;
  centerLatitude: number;
  centerLongitude: number;
  daysLost: number;
  estimatedRadiusMeters: number;
  lostSince: string;
  rewardAmount?: number;
}

export interface Veterinary {
  id: string;
  clinicName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp?: string;
  rating: number; // 1.0 to 5.0
  reviewCount: number;
  isEmergency24h: boolean;
  openingHours: string;
  photoUrl: string;
  services: string[];
  distanceMeters?: number; // Calculated dynamically relative to user GPS
}

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  photoUrl?: string;
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
  ownerId?: string;
  businessName: string;
  tier: 'store_basic' | 'store_premium';
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp?: string;
  logoUrl: string;
  coverUrl?: string;
  description: string;
  openingHours: string;
  websiteUrl?: string;
  catalog: StoreProduct[];
  promotions: StorePromotion[];
  distanceMeters?: number;
}
