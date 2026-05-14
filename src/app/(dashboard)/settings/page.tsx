'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle } from 'lucide-react'
import type { Profile } from '@/types'

const PLAN_FEATURES = {
  free:    ['5 análisis/mes', 'Opportunity Score', 'Exportar CSV'],
  starter: ['100 análisis/mes', 'Scripts de IA completos', 'Filtros avanzados', 'Exportar CSV', 'Soporte por email'],
  agency:  ['500 análisis/mes', 'Todo el Starter', 'Multi-localidad', 'Soporte prioritario'],
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded') === 'true'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile(data as Profile)
        setLoading(false)
      })
    })
  }, [])

  async function handleUpgrade(plan: 'starter' | 'agency') {
    setCheckoutLoading(plan)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setCheckoutLoading(null)
  }

  async function handlePortal() {
    setPortalLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    setPortalLoading(false)
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando...</div>
  }

  if (!profile) return null

  const creditsLeft = profile.credits_total - profile.credits_used

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Cuenta y facturación</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
      </div>

      {upgraded && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          ¡Plan actualizado correctamente! Tus créditos ya están disponibles.
        </div>
      )}

      {/* Plan actual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plan actual</CardTitle>
            <Badge variant={profile.plan === 'free' ? 'secondary' : 'default'} className="capitalize">
              {profile.plan}
            </Badge>
          </div>
          <CardDescription>
            {creditsLeft} de {profile.credits_total} créditos disponibles este mes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.round(((profile.credits_total - profile.credits_used) / profile.credits_total) * 100)}%` }}
            />
          </div>
          <ul className="space-y-1">
            {PLAN_FEATURES[profile.plan].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {profile.plan !== 'free' && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortal}
                disabled={portalLoading}
              >
                {portalLoading ? 'Redirigiendo...' : 'Gestionar suscripción'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade */}
      {profile.plan !== 'agency' && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Mejorar plan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.plan === 'free' && (
                <Card className="border-primary ring-1 ring-primary">
                  <CardHeader className="pb-2">
                    <Badge className="w-fit text-xs mb-1">Más popular</Badge>
                    <CardTitle className="text-base">Starter</CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold text-foreground">9€</span>/mes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-1">
                      {PLAN_FEATURES.starter.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade('starter')}
                      disabled={checkoutLoading === 'starter'}
                    >
                      {checkoutLoading === 'starter' ? 'Redirigiendo...' : 'Actualizar a Starter'}
                    </Button>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Agency</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">49€</span>/mes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1">
                    {PLAN_FEATURES.agency.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpgrade('agency')}
                    disabled={checkoutLoading === 'agency'}
                  >
                    {checkoutLoading === 'agency' ? 'Redirigiendo...' : 'Actualizar a Agency'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
