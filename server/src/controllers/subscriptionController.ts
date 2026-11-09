import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { store } from '../services/store.js';
import { SubscriptionTier } from '../types/index.js';

export const PLANS_CONFIG = [
  {
    id: 'free',
    name: 'Plan Gratuito Comunitario',
    target: 'owner',
    priceClp: 0,
    priceLabel: 'Gratis para siempre',
    benefits: [
      'Reportar mascotas vistas en la calle ilimitadamente',
      'Acceso al mapa interactivo y avisos comunitarios',
      'Registro de hasta 1 mascota propia',
      'Alerta básica de pérdida (radio estándar)',
    ],
    maxPets: 1,
  },
  {
    id: 'pro_owner',
    name: 'UbicaDog Pro (Dueños)',
    target: 'owner',
    priceClp: 2990,
    priceLabel: '$2.990 CLP / mes',
    popular: true,
    benefits: [
      'Registro ILIMITADO de mascotas (toda la familia)',
      'Radio dinámico de búsqueda ampliado al doble (x2)',
      'Placa Inteligente QR para el collar descargable',
      'Ficha médica digital con registro de vacunas y desparasitación',
      'Notificaciones push prioritarias a vecinos cercanos',
    ],
    maxPets: 999,
  },
  {
    id: 'store_basic',
    name: 'Plan Comercio Básico',
    target: 'store',
    priceClp: 5000,
    priceLabel: '$5.000 CLP / mes',
    benefits: [
      'Aparición verificada en el mapa comercial de UbicaDog',
      'Ficha de negocio con dirección, teléfono y WhatsApp',
      'Publicación de hasta 5 productos o servicios en vitrina',
      'Acceso al directorio de comercios barriales',
    ],
    maxProducts: 5,
  },
  {
    id: 'store_premium',
    name: 'Plan Comercio Premium',
    target: 'store',
    priceClp: 10000,
    priceLabel: '$10.000 CLP / mes',
    popular: true,
    benefits: [
      'Pin destacado con halo dorado y logo corporativo en el mapa',
      'Catálogo ILIMITADO de artículos, accesorios y alimentos',
      'Emisión de Cupones de Descuento geolocalizados a usuarios',
      'Aparición prioritaria en búsquedas por proximidad',
      'Estadísticas de visualizaciones y clics al WhatsApp',
    ],
    maxProducts: 999,
  },
];

export function getPlans(req: AuthenticatedRequest, res: Response) {
  return res.json({ plans: PLANS_CONFIG });
}

export function getMySubscription(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });

  const currentTier = req.user.subscriptionTier || 'free';
  const planInfo = PLANS_CONFIG.find((p) => p.id === currentTier) || PLANS_CONFIG[0];
  const petCount = store.pets.filter((p) => p.ownerId === req.user?.id).length;

  return res.json({
    subscription: {
      tier: currentTier,
      plan: planInfo,
      currentPetCount: petCount,
      canAddMorePets: currentTier !== 'free' || petCount < 1,
      maxAllowedPets: planInfo.maxPets,
    },
  });
}

export function subscribeToPlan(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });

  const { tier } = req.body;
  const validTiers: SubscriptionTier[] = ['free', 'pro_owner', 'store_basic', 'store_premium'];

  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Plan de suscripción no válido.' });
  }

  // Update user's subscription
  req.user.subscriptionTier = tier;

  // Record subscription transaction
  const plan = PLANS_CONFIG.find((p) => p.id === tier);
  const newSub = {
    id: `sub_${Date.now()}`,
    userId: req.user.id,
    tier,
    status: 'active' as const,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    priceClp: plan?.priceClp || 0,
  };

  store.subscriptions.push(newSub);

  return res.json({
    message: `¡Suscripción actualizada exitosamente a ${plan?.name}!`,
    subscription: newSub,
    user: req.user,
  });
}
