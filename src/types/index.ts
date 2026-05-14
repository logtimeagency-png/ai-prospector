// ============================================================
// AI Prospector — Tipos globales del dominio
// Mirrors exactos del schema SQL de Supabase
// ============================================================

// ----- Enums -----

export type Plan = 'free' | 'starter' | 'agency'
export type SearchStatus = 'pending' | 'processing' | 'done' | 'failed'
export type AnalysisStatus = 'pending' | 'analyzing' | 'done' | 'failed'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'
export type CreditAction = 'lead_analysis' | 'message_regenerate'

export type PainPoint =
  | 'no_website'
  | 'slow_website'
  | 'no_ssl'
  | 'not_mobile_friendly'
  | 'no_booking'
  | 'few_reviews'
  | 'low_rating'
  | 'no_meta_description'

export type OpportunityLabel = 'hot' | 'warm' | 'cold' | 'skip'

// ----- DB Rows -----

export interface Profile {
  id: string
  email: string
  plan: Plan
  credits_total: number
  credits_used: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Search {
  id: string
  user_id: string
  query: string
  niche: string
  location: string
  status: SearchStatus
  leads_found: number
  error_msg: string | null
  created_at: string
}

export interface Lead {
  id: string
  search_id: string
  user_id: string
  place_id: string
  name: string
  address: string | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  rating: number | null
  reviews_count: number
  has_website: boolean
  website_speed_score: number | null
  has_ssl: boolean | null
  is_mobile_friendly: boolean | null
  has_booking_system: boolean
  meta_title: string | null
  meta_description: string | null
  opportunity_score: number
  pain_points: PainPoint[]
  ai_email: string | null
  ai_whatsapp: string | null
  ai_dm: string | null
  ai_generated_at: string | null
  analysis_status: AnalysisStatus
  is_cached: boolean
  created_at: string
}

export interface CreditUsage {
  id: string
  user_id: string
  lead_id: string | null
  credits_consumed: number
  action: CreditAction
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  plan: Exclude<Plan, 'free'>
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  created_at: string
}

// ----- API Request/Response -----

export interface SearchRequest {
  niche: string
  location: string
}

export interface SearchResponse {
  search_id: string
  message: string
}

export interface ApiError {
  error: string
  code?: string
}

// ----- Configuración de Planes -----

export interface PlanConfig {
  price_monthly: number
  credits: number
  stripe_price_id: string | null
  features: {
    csv_export: boolean
    filters: boolean
    ai_scripts_visible: boolean
  }
}

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  free: {
    price_monthly: 0,
    credits: 5,
    stripe_price_id: null,
    features: {
      csv_export: true,
      filters: false,
      ai_scripts_visible: false,
    },
  },
  starter: {
    price_monthly: 9,
    credits: 100,
    stripe_price_id: process.env.STRIPE_PRICE_STARTER ?? null,
    features: {
      csv_export: true,
      filters: true,
      ai_scripts_visible: true,
    },
  },
  agency: {
    price_monthly: 49,
    credits: 500,
    stripe_price_id: process.env.STRIPE_PRICE_AGENCY ?? null,
    features: {
      csv_export: true,
      filters: true,
      ai_scripts_visible: true,
    },
  },
}

// ----- UI Helpers -----

export interface OpportunityLabelConfig {
  label: OpportunityLabel
  emoji: string
  text: string
  color: string
  bgColor: string
}

export const OPPORTUNITY_LABELS: Record<OpportunityLabel, OpportunityLabelConfig> = {
  hot:  { label: 'hot',  emoji: '🔥', text: 'Caliente', color: 'text-red-600',    bgColor: 'bg-red-50' },
  warm: { label: 'warm', emoji: '🟡', text: 'Tibio',    color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  cold: { label: 'cold', emoji: '🟢', text: 'Frío',     color: 'text-green-600',  bgColor: 'bg-green-50' },
  skip: { label: 'skip', emoji: '⚪', text: 'Skip',     color: 'text-gray-400',   bgColor: 'bg-gray-50' },
}

export const PAIN_POINT_LABELS: Record<PainPoint, string> = {
  no_website:         'Sin web',
  slow_website:       'Web lenta',
  no_ssl:             'Sin SSL',
  not_mobile_friendly:'No mobile',
  no_booking:         'Sin reservas',
  few_reviews:        'Pocas reseñas',
  low_rating:         'Mala nota',
  no_meta_description:'Sin SEO',
}
