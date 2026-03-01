import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma/client';

export const webhookRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

webhookRouter.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig) {
    console.error('Webhook: Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  console.log(`Webhook received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.json({ received: true });
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Check if order already exists (idempotency)
    const existing = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      console.log(`Order for session ${session.id} already exists, skipping`);
      return;
    }

    // Get cart items from payment intent metadata
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    let cartItems: Array<{ productId: string; quantity: number; priceCents: number }> = [];

    if (paymentIntent.metadata?.cartItems) {
      cartItems = JSON.parse(paymentIntent.metadata.cartItems);
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        email: session.customer_email || session.customer_details?.email || 'unknown',
        totalCents: session.amount_total || 0,
        status: 'PAID',
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
        },
      },
      include: { items: true },
    });

    console.log(`✅ Order created: ${order.id} for ${order.email}`);
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err);
    throw err; // Re-throw so Stripe retries the webhook
  }
}
