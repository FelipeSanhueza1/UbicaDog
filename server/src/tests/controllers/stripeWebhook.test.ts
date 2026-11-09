import { describe, it, expect, beforeEach } from 'vitest';
import { handleStripeWebhook } from '../../controllers/stripeController.js';
import { store } from '../../services/store.js';
import { Request, Response } from 'express';

describe('Stripe Webhook Controller', () => {
  const testUserId = 'usr_regular';

  beforeEach(() => {
    // Reset test user to free tier before each test
    const user = store.users.find((u) => u.id === testUserId);
    if (user) {
      user.subscriptionTier = 'free';
    }
  });

  it('should upgrade user to pro_owner on checkout.session.completed', async () => {
    const payload = {
      id: 'evt_test_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_12345',
          subscription: 'sub_test_stripe_999',
          amount_total: 2990,
          metadata: {
            userId: testUserId,
            tier: 'pro_owner',
          },
        },
      },
    };

    const req = {
      headers: {},
      body: Buffer.from(JSON.stringify(payload)),
    } as unknown as Request;

    let responseJson: any = null;
    let statusCode: number = 200;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseJson = data;
        return res;
      },
      send: (data: any) => {
        responseJson = data;
        return res;
      },
    } as unknown as Response;

    await handleStripeWebhook(req, res);

    expect(responseJson).toEqual({ received: true });
    const user = store.users.find((u) => u.id === testUserId);
    expect(user?.subscriptionTier).toBe('pro_owner');

    const addedSub = store.subscriptions.find((s) => s.id === 'sub_cs_test_12345');
    expect(addedSub).toBeDefined();
    expect(addedSub?.tier).toBe('pro_owner');
    expect(addedSub?.status).toBe('active');
  });

  it('should revert user to free on customer.subscription.deleted', async () => {
    // First, set up active subscription
    const user = store.users.find((u) => u.id === testUserId);
    if (user) {
      user.subscriptionTier = 'pro_owner';
    }

    const subId = 'sub_stripe_cancel_target';
    store.subscriptions.push({
      id: 'sub_rec_123',
      userId: testUserId,
      tier: 'pro_owner',
      status: 'active',
      stripeSubscriptionId: subId,
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
      priceClp: 2990,
    });

    const payload = {
      id: 'evt_test_deleted',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: subId,
        },
      },
    };

    const req = {
      headers: {},
      body: Buffer.from(JSON.stringify(payload)),
    } as unknown as Request;

    let responseJson: any = null;
    const res = {
      status: () => res,
      json: (data: any) => {
        responseJson = data;
        return res;
      },
      send: () => res,
    } as unknown as Response;

    await handleStripeWebhook(req, res);

    expect(responseJson).toEqual({ received: true });
    expect(user?.subscriptionTier).toBe('free');

    const updatedSub = store.subscriptions.find((s) => s.stripeSubscriptionId === subId);
    expect(updatedSub?.status).toBe('canceled');
  });

  it('should return 400 for corrupted payload', async () => {
    const req = {
      headers: {},
      body: Buffer.from('non-json-content-malformed'),
    } as unknown as Request;

    let responseStatus = 200;
    let responseBody = '';

    const res = {
      status: (code: number) => {
        responseStatus = code;
        return res;
      },
      send: (body: string) => {
        responseBody = body;
        return res;
      },
      json: () => res,
    } as unknown as Response;

    await handleStripeWebhook(req, res);

    expect(responseStatus).toBe(400);
    expect(responseBody).toContain('Webhook Error:');
  });
});
