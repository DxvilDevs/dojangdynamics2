import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

export const ordersRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const CheckoutSchema = z.object({
  cart: z.array(CartItemSchema).min(1),
  customerEmail: z.string().email().optional(),
});

// POST /orders/create-checkout-session
ordersRouter.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const parsed = CheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { cart, customerEmail } = parsed.data;

    // Fetch all products from DB to get authoritative prices
    const productIds = cart.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found or unavailable' });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        price_data: {
          currency: product.currency,
          unit_amount: product.priceCents,
          product_data: {
            name: product.name,
            description: product.description.substring(0, 255),
            images: product.images.slice(0, 1),
            metadata: { productId: product.id, slug: product.slug },
          },
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: customerEmail,
      success_url: `${process.env.STRIPE_SUCCESS_URL}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      payment_intent_data: {
        metadata: {
          cartItems: JSON.stringify(
            cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceCents: products.find((p) => p.id === item.productId)!.priceCents,
            }))
          ),
        },
      },
      metadata: {
        source: 'dojang-dynamics-store',
      },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout session error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// GET /orders - admin only
ordersRouter.get('/', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true, slug: true } } },
        },
      },
    });
    return res.json({ orders });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});
