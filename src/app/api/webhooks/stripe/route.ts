import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLAN_CREDITS } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[Stripe webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0].price.id
        const plan = getPlanFromPriceId(priceId)
        if (!plan) break

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        await supabase.from('profiles').update({
          plan,
          credits_total: PLAN_CREDITS[plan],
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)

        const period = sub.items.data[0]?.current_period_start
          ? { start: sub.items.data[0].current_period_start, end: sub.items.data[0].current_period_end }
          : { start: Math.floor(Date.now() / 1000), end: Math.floor(Date.now() / 1000) + 2592000 }

        await supabase.from('subscriptions').upsert({
          user_id: profile.id,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_start: new Date(period.start * 1000).toISOString(),
          current_period_end: new Date(period.end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        await supabase.from('profiles').update({
          plan: 'free',
          credits_total: PLAN_CREDITS['free'],
          credits_used: 0,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)

        await supabase.from('subscriptions').update({
          status: 'cancelled',
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        if (!invoice.subscription) break

        const sub = await stripe.subscriptions.retrieve(invoice.subscription)
        const customerId = sub.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        // Reset mensual de créditos
        await supabase.from('profiles').update({
          credits_used: 0,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        if (!invoice.subscription) break

        await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('stripe_subscription_id', invoice.subscription)
        break
      }
    }
  } catch (err) {
    console.error('[Stripe webhook] Processing error:', err)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function getPlanFromPriceId(priceId: string): 'starter' | 'agency' | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter'
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return 'agency'
  return null
}
