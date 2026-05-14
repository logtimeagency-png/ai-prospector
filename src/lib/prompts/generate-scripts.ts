import type { PainPoint } from '@/types'

const PAIN_DESCRIPTIONS: Record<PainPoint, (data: { speed?: number | null; reviews?: number; rating?: number | null }) => string> = {
  no_website:          () => 'no tiene sitio web',
  slow_website:        ({ speed }) => `su sitio web es muy lento (puntuación ${speed ?? '?'}/100)`,
  no_ssl:              () => 'su sitio web no tiene certificado SSL (aparece como "No seguro")',
  not_mobile_friendly: () => 'su sitio web no está optimizado para móviles',
  no_booking:          () => 'no tiene sistema de reservas o citas online',
  few_reviews:         ({ reviews }) => `tiene muy pocas reseñas en Google (solo ${reviews ?? '?'})`,
  low_rating:          ({ rating }) => `tiene una calificación baja en Google (${rating ?? '?'} ⭐)`,
  no_meta_description: () => 'no tiene descripción SEO optimizada (no aparece bien en Google)',
}

export function buildSystemPrompt(): string {
  return `Eres un experto en ventas digitales B2B especializado en vender servicios web y de IA a pequeños negocios locales en España.

Tu tarea es generar 3 scripts de venta CORTOS, DIRECTOS y MUY PERSONALIZADOS basados en los problemas reales detectados en el negocio.

REGLAS CRÍTICAS:
- Nunca mencionar que eres IA ni que has analizado su web automáticamente
- Usa siempre el nombre real del negocio
- Menciona SOLO los 1-2 problemas más importantes (no listar todos)
- Tono: cercano, directo, como si fuera un mensaje de un profesional conocido
- NO uses saludos corporativos ("Estimado", "Me pongo en contacto")
- Email: máximo 120 palabras, asunto incluido
- WhatsApp: máximo 70 palabras, informal, emojis permitidos
- DM Instagram: máximo 50 palabras, muy casual

Responde SIEMPRE en JSON con este formato exacto (sin markdown, solo JSON puro):
{
  "ai_email": "Asunto: ...\\n\\nCuerpo del email...",
  "ai_whatsapp": "Texto del mensaje de WhatsApp...",
  "ai_dm": "Texto del DM de Instagram..."
}`
}

export function buildUserPrompt(lead: {
  name: string
  niche: string
  location: string
  rating: number | null
  reviews_count: number
  pain_points: PainPoint[]
  has_website: boolean
  website_speed_score: number | null
  opportunity_score: number
}): string {
  const painList = lead.pain_points
    .slice(0, 3)
    .map(p => `- ${PAIN_DESCRIPTIONS[p]({ speed: lead.website_speed_score, reviews: lead.reviews_count, rating: lead.rating })}`)
    .join('\n')

  return `Negocio: ${lead.name}
Sector: ${lead.niche}
Ubicación: ${lead.location}
Calificación Google: ${lead.rating ?? 'sin dato'} ⭐ (${lead.reviews_count} reseñas)
Opportunity Score: ${lead.opportunity_score}/100

Problemas detectados:
${painList}

Genera los 3 scripts de venta personalizados para este negocio.`
}
