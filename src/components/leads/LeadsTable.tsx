'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LeadRow } from './LeadRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getOpportunityLabel } from '@/lib/opportunity-score'
import { PAIN_POINT_LABELS } from '@/types'
import type { Lead, Plan, PainPoint } from '@/types'

interface LeadsTableProps {
  leads: Lead[]
  plan: Plan
  loading?: boolean
}

export function LeadsTable({ leads, plan, loading }: LeadsTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [problemFilter, setProblemFilter] = useState<string>('all')
  const canFilter = plan !== 'free'
  const canSeeScripts = plan !== 'free'

  const filtered = leads.filter(lead => {
    if (search && !lead.name.toLowerCase().includes(search.toLowerCase())) return false
    if (canFilter && scoreFilter !== 'all') {
      if (getOpportunityLabel(lead.opportunity_score) !== scoreFilter) return false
    }
    if (canFilter && problemFilter !== 'all') {
      if (!lead.pain_points.includes(problemFilter as PainPoint)) return false
    }
    return true
  })

  const handleExportCSV = useCallback(() => {
    const rows = [
      ['Nombre', 'Dirección', 'Teléfono', 'Web', 'Puntuación', 'Reseñas', 'Rating', 'Problemas'],
      ...filtered.map(l => [
        l.name, l.address ?? '', l.phone ?? '', l.website ?? '',
        l.opportunity_score, l.reviews_count, l.rating ?? '',
        l.pain_points.map(p => PAIN_POINT_LABELS[p]).join(' | ')
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de controles */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Buscar negocio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48 h-8 text-sm"
          />
          {canFilter ? (
            <>
              <Select value={scoreFilter} onValueChange={v => setScoreFilter(v ?? 'all')}>
                <SelectTrigger className="h-8 text-sm w-36">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los scores</SelectItem>
                  <SelectItem value="hot">🔥 Caliente</SelectItem>
                  <SelectItem value="warm">🟡 Tibio</SelectItem>
                  <SelectItem value="cold">🟢 Frío</SelectItem>
                </SelectContent>
              </Select>
              <Select value={problemFilter} onValueChange={v => setProblemFilter(v ?? 'all')}>
                <SelectTrigger className="h-8 text-sm w-40">
                  <SelectValue placeholder="Problema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los problemas</SelectItem>
                  {(Object.entries(PAIN_POINT_LABELS) as [PainPoint, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs opacity-60 cursor-not-allowed"
              title="Disponible en plan Starter"
              disabled
            >
              🔒 Filtros (Starter)
            </Button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">{filtered.length} leads</span>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
            Exportar CSV
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => router.push('/search')}>
            + Nueva búsqueda
          </Button>
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No hay leads aún.</p>
          <Button variant="link" className="text-sm mt-1" onClick={() => router.push('/search')}>
            Lanzar tu primera búsqueda →
          </Button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Negocio</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Rating</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Problemas</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Links</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <LeadRow key={lead.id} lead={lead} showScripts={canSeeScripts} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
