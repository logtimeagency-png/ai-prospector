import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import type { Plan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await request.json() as { plan: Plan }
  if (!plan || plan === 'free') {
    return NextResponse.json({ error: 'Plan no válido.' }, { status: 422 })
  }

  const priceId = STRIPE_PLANS[plan as Exclude<Plan, 'free'>]
  if (!priceId) return NextResponse.json({ error: 'Plan no configurado.' }, { status: 422 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('stripe_customer_id, email').eq('id', user.id).single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? '',
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await adminSupabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    locale: 'es',
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
