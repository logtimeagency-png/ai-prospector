import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { isValidPaidPlan } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const plan = (body as Record<string, unknown>).plan

  // Strict whitelist — only 'starter' or 'agency' reach Stripe
  if (!isValidPaidPlan(plan)) {
    return NextResponse.json({ error: 'Plan no válido.' }, { status: 422 })
  }

  const priceId = STRIPE_PLANS[plan]
  if (!priceId) return NextResponse.json({ error: 'Plan no configurado en Stripe.' }, { status: 503 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('stripe_customer_id, email').eq('id', user.id).single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? '',
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await adminSupabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    } catch (err) {
      console.error('[billing/checkout] Stripe customer error:', err)
      return NextResponse.json({ error: 'Error al crear sesión de pago.' }, { status: 503 })
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
      locale: 'es',
      allow_promotion_codes: true,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/checkout] Stripe session error:', err)
    return NextResponse.json({ error: 'Error al crear sesión de pago.' }, { status: 503 })
  }
}
