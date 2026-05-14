import Link from 'next/link'
import { Star, Globe, Phone } from 'lucide-react'
import { OpportunityBadge } from './OpportunityBadge'
import { Badge } from '@/components/ui/badge'
import { PAIN_POINT_LABELS } from '@/types'
import type { Lead } from '@/types'

interface LeadRowProps {
  lead: Lead
  showScripts: boolean
}

export function LeadRow({ lead, showScripts }: LeadRowProps) {
  const isAnalyzing = lead.analysis_status === 'analyzing' || lead.analysis_status === 'pending'
  const isDone = lead.analysis_status === 'done'

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-sm">{lead.name}</div>
        {lead.address && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">{lead.address}</div>
        )}
      </td>

      <td className="px-4 py-3 text-center">
        {isDone ? (
          <OpportunityBadge score={lead.opportunity_score} />
        ) : isAnalyzing ? (
          <span className="text-xs text-muted-foreground animate-pulse">Analizando...</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-3">
        {lead.rating !== null && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span>{lead.rating}</span>
            <span className="text-muted-foreground text-xs">({lead.reviews_count})</span>
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1 max-w-48">
          {lead.pain_points.slice(0, 2).map(pp => (
            <Badge key={pp} variant="secondary" className="text-xs py-0">
              {PAIN_POINT_LABELS[pp]}
            </Badge>
          ))}
          {lead.pain_points.length > 2 && (
            <Badge variant="outline" className="text-xs py-0">
              +{lead.pain_points.length - 2}
            </Badge>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-2">
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer" title="Abrir web">
              <Globe className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} title="Llamar">
              <Phone className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </a>
          )}
        </div>
      </td>

      <td className="px-4 py-3 text-right">
        {isDone && showScripts && (
          <Link
            href={`/lead/${lead.id}`}
            className="text-xs text-primary font-medium hover:underline"
          >
            Ver scripts →
          </Link>
        )}
        {isDone && !showScripts && (
          <Link
            href="/settings"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 justify-end"
          >
            🔒 Mejorar plan
          </Link>
        )}
        {!isDone && !isAnalyzing && (
          <span className="text-xs text-red-400">Error</span>
        )}
      </td>
    </tr>
  )
}
