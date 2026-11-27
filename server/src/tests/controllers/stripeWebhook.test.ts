import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';

// In-memory mock store for Prisma unit testing without touching production/local PostgreSQL
const mockUsers = new Map<string, any>();
const mockSubscriptions = new Map<string, any>();

vi.mock('../../services/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: any) => mockUsers.get(where.id) || null),
      update: vi.fn(async ({ where, data }: any) => {
        const user = mockUsers.get(where.id);
        if (!user) throw new Error('User not found');
        const updated = { ...user, ...data };
        mockUsers.set(where.id, updated);
        return updated;
      }),
    },
    subscription: {
      findFirst: vi.fn(async ({ where }: any) => {
        for (const sub of mockSubscriptions.values()) {
          if (where.stripeSubscriptionId && sub.stripeSubscriptionId === where.stripeSubscriptionId) {
            return sub;
          }
        }
        return null;
      }),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const existing = mockSubscriptions.get(where.id);
        const next = existing ? { ...existing, ...update } : { ...create };
        mockSubscriptions.set(where.id, next);
        return next;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const existing = mockSubscriptions.get(where.id);
        if (!existing) throw new Error('Subscription not found');
        const next = { ...existing, ...data };
        mockSubscriptions.set(where.id, next);
        return next;
      }),
    },
    $transaction: vi.fn(async (operations: Promise<any>[]) => Promise.all(operations)),
  },
}));

import { handleStripeWebhook } from '../../controllers/stripeController.js';

describe('Stripe Webhook Controller (Prisma Mocked Unit Tests)', () => {
  const testUserId = 'usr_regular';

  beforeEach(() => {
    mockUsers.clear();
    mockSubscriptions.clear();
    mockUsers.set(testUserId, {
      id: testUserId,
      email: 'test_regular@ubicadog.com',
      name: 'Usuario Regular Test',
      role: 'user',
      subscriptionTier: 'free',
      createdAt: new Date(),
    });
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
    let statusCode = 200;

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

    expect(statusCode).toBe(200);
    expect(responseJson).toEqual({ received: true });
    expect(mockUsers.get(testUserId)?.subscriptionTier).toBe('pro_owner');

    const addedSub = mockSubscriptions.get('sub_cs_test_12345');
    expect(addedSub).toBeDefined();
    expect(addedSub?.tier).toBe('pro_owner');
    expect(addedSub?.status).toBe('active');
  });

  it('should revert user to free on customer.subscription.deleted', async () => {
    mockUsers.set(testUserId, {
      ...mockUsers.get(testUserId),
      subscriptionTier: 'pro_owner',
    });

    const subId = 'sub_stripe_cancel_target';
    mockSubscriptions.set('sub_rec_123', {
      id: 'sub_rec_123',
      userId: testUserId,
      tier: 'pro_owner',
      status: 'active',
      stripeSubscriptionId: subId,
      currentPeriodEnd: new Date(Date.now() + 86400000),
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
    expect(mockUsers.get(testUserId)?.subscriptionTier).toBe('free');
    expect(mockSubscriptions.get('sub_rec_123')?.status).toBe('canceled');
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
