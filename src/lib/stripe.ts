import Stripe from 'stripe'
import type { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const STRIPE_PLANS: Record<Exclude<Plan, 'free'>, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  agency:  process.env.STRIPE_PRICE_AGENCY!,
}

export const PLAN_CREDITS: Record<Plan, number> = {
  free:    5,
  starter: 100,
  agency:  500,
}
