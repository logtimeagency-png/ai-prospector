import type { OpportunityLabel, PainPoint } from '@/types'

export interface LeadMetrics {
  has_website: boolean
  website_speed_score: number | null
  reviews_count: number
  rating: number | null
  has_ssl: boolean | null
  is_mobile_friendly: boolean | null
  has_booking_system: boolean
  meta_description: string | null
  niche: string
}

const PREMIUM_NICHES = [
  'dentistas', 'dentista', 'clínica dental',
  'abogados', 'abogado', 'despacho',
  'médicos', 'médico', 'clínica',
  'psicólogos', 'psicólogo',
  'contadores', 'gestoría', 'asesoría',
  'inmobiliaria', 'agencia inmobiliaria',
  'notarios', 'notario',
]

export function calculateOpportunityScore(metrics: LeadMetrics): {
  score: number
  painPoints: PainPoint[]
} {
  let score = 0
  const painPoints: PainPoint[] = []

  if (!metrics.has_website) {
    score += 35
    painPoints.push('no_website')
  } else {
    if (metrics.website_speed_score !== null) {
      if (metrics.website_speed_score < 50) {
        score += 20
        painPoints.push('slow_website')
      } else if (metrics.website_speed_score <= 70) {
        score += 10
        painPoints.push('slow_website')
      }
    }
    if (metrics.has_ssl === false) {
      score += 8
      painPoints.push('no_ssl')
    }
    if (metrics.is_mobile_friendly === false) {
      score += 8
      painPoints.push('not_mobile_friendly')
    }
    if (!metrics.has_booking_system) {
      score += 10
      painPoints.push('no_booking')
    }
    if (!metrics.meta_description) {
      score += 5
      painPoints.push('no_meta_description')
    }
  }

  if (metrics.reviews_count < 10) {
    score += 15
    painPoints.push('few_reviews')
  } else if (metrics.reviews_count <= 50) {
    score += 8
    painPoints.push('few_reviews')
  }

  if (metrics.rating !== null && metrics.rating < 3.5) {
    score += 10
    painPoints.push('low_rating')
  }

  // Multiplicador por nicho premium
  const nicheNorm = metrics.niche.toLowerCase().trim()
  const isPremium = PREMIUM_NICHES.some(n => nicheNorm.includes(n))
  if (isPremium) score = Math.round(score * 1.2)

  return { score: Math.min(score, 100), painPoints }
}

export function getOpportunityLabel(score: number): OpportunityLabel {
  if (score >= 75) return 'hot'
  if (score >= 50) return 'warm'
  if (score >= 25) return 'cold'
  return 'skip'
}
