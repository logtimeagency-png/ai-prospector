'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw, Lock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Lead, Plan } from '@/types'

interface MessageModalProps {
  lead: Lead
  plan: Plan
}

type TabKey = 'email' | 'whatsapp' | 'dm'

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'email',    label: 'Email',     emoji: '📧' },
  { key: 'whatsapp', label: 'WhatsApp',  emoji: '💬' },
  { key: 'dm',       label: 'DM / Insta', emoji: '📸' },
]

export function MessageModal({ lead, plan }: MessageModalProps) {
  const [copied, setCopied] = useState<TabKey | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const canSeeScripts = plan !== 'free'
  const isAnalyzing = lead.analysis_status === 'analyzing' || lead.analysis_status === 'pending'

  const scriptMap: Record<TabKey, string | null> = {
    email:    lead.ai_email,
    whatsapp: lead.ai_whatsapp,
    dm:       lead.ai_dm,
  }

  async function handleCopy(key: TabKey) {
    const text = scriptMap[key]
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate' }),
    })
    setTimeout(() => {
      setRegenerating(false)
      window.location.reload()
    }, 3000)
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (!canSeeScripts) {
    return (
      <div className="border rounded-xl p-8 text-center space-y-4 bg-gray-50">
        <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
        <div>
          <p className="font-semibold">Scripts de venta bloqueados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Este negocio tiene {lead.pain_points.length} problema(s) detectado(s).<br />
            Actualiza al plan Starter para ver y copiar los scripts personalizados.
          </p>
        </div>
        <a href="/settings">
          <Button className="w-full max-w-xs">
            🚀 Actualizar — 9€/mes
          </Button>
        </a>
        <p className="text-xs text-muted-foreground">100 análisis/mes · Filtros avanzados · Sin límite de copia</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="email">
        <TabsList className="w-full">
          {TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="flex-1">
              {t.emoji} {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t.key} value={t.key}>
            {scriptMap[t.key] ? (
              <div className="space-y-3">
                <div className="bg-gray-50 border rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[120px]">
                  {scriptMap[t.key]}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleCopy(t.key)}
                >
                  {copied === t.key
                    ? <><Check className="h-3.5 w-3.5 text-green-500" /> ¡Copiado!</>
                    : <><Copy className="h-3.5 w-3.5" /> Copiar {t.label}</>
                  }
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Script no disponible.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-xs text-muted-foreground">Regenerar consume 1 crédito adicional</p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerando...' : 'Regenerar'}
        </Button>
      </div>
    </div>
  )
}
