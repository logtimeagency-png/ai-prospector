import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Globe, Phone, Star, MapPin } from 'lucide-react'
import Link from 'next/link'
import { OpportunityBadge } from '@/components/leads/OpportunityBadge'
import { MessageModal } from '@/components/leads/MessageModal'
import { Badge } from '@/components/ui/badge'
import { PAIN_POINT_LABELS } from '@/types'
import type { Lead, Profile } from '@/types'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: lead }, { data: profile }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
  ])

  if (!lead) notFound()
  if (!profile) redirect('/login')

  const l = lead as Lead

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold">{l.name}</h1>
        <OpportunityBadge score={l.opportunity_score} />
      </div>

      {/* Info del negocio */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Información</h2>
        <div className="grid grid-cols-1 gap-2 text-sm">
          {l.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>{l.address}</span>
            </div>
          )}
          {l.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`tel:${l.phone}`} className="hover:text-primary">{l.phone}</a>
            </div>
          )}
          {l.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={l.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                {l.website}
              </a>
            </div>
          )}
          {l.rating !== null && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
              <span>{l.rating} ({l.reviews_count} reseñas)</span>
            </div>
          )}
        </div>
      </div>

      {/* Problemas detectados */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Problemas detectados</h2>
        {l.pain_points.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {l.pain_points.map(pp => (
              <Badge key={pp} variant="secondary">{PAIN_POINT_LABELS[pp]}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin problemas detectados (lead poco prioritario).</p>
        )}
        {l.website_speed_score !== null && (
          <p className="text-xs text-muted-foreground">
            Velocidad web: <strong>{l.website_speed_score}/100</strong> ·
            SSL: {l.has_ssl ? '✅' : '❌'} ·
            Mobile: {l.is_mobile_friendly ? '✅' : '❌'} ·
            Reservas: {l.has_booking_system ? '✅' : '❌'}
          </p>
        )}
      </div>

      {/* Scripts de venta */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Scripts de venta personalizados
        </h2>
        <MessageModal lead={l} plan={profile.plan} />
      </div>
    </div>
  )
}
