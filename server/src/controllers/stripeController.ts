import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { store } from '../services/store.js';
import { SubscriptionTier, Subscription } from '../types/index.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(stripeSecret);

export async function createCheckoutSession(req: AuthenticatedRequest, res: Response) {
  try {
    const { amount, description, type, petId, tier } = req.body;

    const selectedTier = (tier || type || 'pro_owner') as SubscriptionTier;
    const defaultAmounts: Record<string, number> = {
      pro_owner: 2990,
      store_basic: 5000,
      store_premium: 10000,
      boost: 3000,
    };

    const parsedAmount = Number(amount) || defaultAmounts[selectedTier] || 5000;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // In demo / test mode without active live keys, return simulated checkout confirmation
    if (stripeSecret.includes('placeholder')) {
      return res.json({
        sessionId: `cs_simulated_${Date.now()}`,
        url: `${clientUrl}/pricing?checkout_success=true&tier=${selectedTier}&amount=${parsedAmount}`,
        simulated: true,
        message: 'Sesión de pago Stripe iniciada (Modo de demostración seguro).',
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'clp',
            product_data: {
              name: description || `UbicaDog - Suscripción ${selectedTier.toUpperCase()}`,
              description: `Plan UbicaDog para usuario ID: ${req.user?.id || 'Invitado'}`,
            },
            unit_amount: parsedAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientUrl}/pricing?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/pricing?checkout_cancel=true`,
      customer_email: req.user?.email,
      metadata: {
        userId: req.user?.id || 'guest',
        petId: petId || '',
        tier: selectedTier,
        type: selectedTier,
      },
    });

    return res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Error al procesar pasarela Stripe.' });
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } else {
      // In development / testing or simulated mode
      const rawPayload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
      event = JSON.parse(rawPayload);
    }
  } catch (err: any) {
    console.error('⚠️ Error al verificar firma de webhook Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific Stripe events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = (session.metadata?.tier || session.metadata?.type) as SubscriptionTier;

      if (userId && tier && ['pro_owner', 'store_basic', 'store_premium'].includes(tier)) {
        const user = store.users.find((u) => u.id === userId);
        if (user) {
          user.subscriptionTier = tier;
          const newSub: Subscription = {
            id: `sub_${session.id}`,
            userId: user.id,
            tier,
            status: 'active',
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            priceClp: session.amount_total || (tier === 'pro_owner' ? 2990 : tier === 'store_basic' ? 5000 : 10000),
          };
          store.subscriptions.push(newSub);
          console.log(`✅ Suscripción activada vía Stripe para usuario ${user.email} -> ${tier}`);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const subRecord = store.subscriptions.find((s) => s.stripeSubscriptionId === subscription.id);
      if (subRecord) {
        subRecord.status = 'canceled';
        const user = store.users.find((u) => u.id === subRecord.userId);
        if (user) {
          user.subscriptionTier = 'free';
          console.log(`ℹ️ Suscripción cancelada vía Stripe para ${user.email}, revertido a Free`);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`⚠️ Pago fallido para invoice ${invoice.id}, cliente: ${invoice.customer_email}`);
      break;
    }

    default:
      console.log(`ℹ️ Evento Stripe no manejado: ${event.type}`);
  }

  return res.json({ received: true });
}
