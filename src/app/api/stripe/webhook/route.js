import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Use the latest API version
});

// Initialize Supabase Admin Client
// Note: Use environment variables for Supabase URL and Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Stripe webhook secret is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  let event;

  try {
    const rawBody = await req.text(); // Read the raw request body for signature verification
    const signature = req.headers.get('stripe-signature');

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);

      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;
      const stripeSubscriptionId = session.subscription;
      const paymentStatus = session.payment_status;

      if (!userId) {
        console.error('User ID (client_reference_id) not found in checkout session.');
        // Still return 200 to Stripe to acknowledge receipt, but log error
        return NextResponse.json({ received: true, error: 'User ID missing' });
      }

      if (paymentStatus === 'paid') {
        try {
          const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              current_subscription_plan: 'Pro', // Assuming this webhook is for Pro plan
              subscription_status: 'active',
            })
            .eq('id', userId);

          if (error) {
            console.error('Supabase update error:', error.message);
            // Consider how to handle this error. Retry? Log for manual intervention?
            // For now, return 200 to Stripe, but log the issue.
            return NextResponse.json({ received: true, error: 'Supabase update failed' });
          }

          console.log('Successfully updated profile for user:', userId, 'to Pro plan.');
          // You could also trigger other post-subscription actions here, like sending a welcome email.

        } catch (dbError) {
          console.error('Supabase client error during update:', dbError.message);
          return NextResponse.json({ received: true, error: 'Supabase client error' });
        }
      } else {
        console.log('Checkout session completed but payment status is not "paid":', paymentStatus);
        // Handle cases like trial periods or other non-immediate payment scenarios if needed
      }
      break;
    
    // TODO: Handle other event types as needed for your application
    // For example, 'customer.subscription.updated', 'customer.subscription.deleted'
    // to manage plan changes, cancellations, etc.
    // case 'invoice.payment_succeeded': {
    //   const invoice = event.data.object;
    //   // Handle successful recurring payment
    //   // Update subscription end date, etc.
    //   break;
    // }
    // case 'customer.subscription.deleted': {
    //   const subscription = event.data.object;
    //   // Handle subscription cancellation
    //   // Update user's plan to 'free' or 'canceled' in your DB
    //   break;
    // }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 