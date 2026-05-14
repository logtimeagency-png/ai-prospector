'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NICHES = [
  'Dentistas', 'Abogados', 'Médicos', 'Psicólogos', 'Fisioterapeutas',
  'Restaurantes', 'Peluquerías', 'Gimnasios', 'Inmobiliarias', 'Gestoría / Asesoría',
  'Fontaneros', 'Electricistas', 'Clínicas estéticas', 'Academias', 'Veterinarios',
]

const CITIES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
  'Málaga', 'Bilbao', 'Murcia', 'Valladolid', 'Alicante',
]

interface SearchFormProps {
  creditsLeft: number
}

export function SearchForm({ creditsLeft }: SearchFormProps) {
  const router = useRouter()
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')
  const [customNiche, setCustomNiche] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'failed'>('idle')
  const [leadsFound, setLeadsFound] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  function startPolling(searchId: string) {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/search/${searchId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.leads_found) setLeadsFound(data.leads_found)
        if (data.status === 'done') {
          clearInterval(intervalRef.current!)
          setStatus('done')
          setTimeout(() => router.push('/dashboard'), 800)
        } else if (data.status === 'failed') {
          clearInterval(intervalRef.current!)
          setStatus('failed')
          setError(data.error_msg ?? 'La búsqueda falló. Inténtalo de nuevo.')
        }
      } catch { /* network error — seguir reintentando */ }
    }, 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (creditsLeft <= 0) {
      setError('Sin créditos. Actualiza tu plan para continuar.')
      return
    }
    setError(null)
    setStatus('processing')

    const finalNiche = niche === '__custom__' ? customNiche : niche

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: finalNiche, location }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('failed')
        setError(data.error ?? 'Error al lanzar la búsqueda.')
        return
      }

      startPolling(data.search_id)
    } catch {
      setStatus('failed')
      setError('Error de conexión. Inténtalo de nuevo.')
    }
  }

  if (status === 'processing' || status === 'done') {
    return (
      <div className="bg-white border rounded-xl p-8 text-center space-y-4">
        <div className="text-4xl animate-pulse">{status === 'done' ? '✅' : '🔍'}</div>
        <h2 className="text-lg font-semibold">
          {status === 'done' ? '¡Búsqueda completada!' : 'Analizando negocios...'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {status === 'done'
            ? `${leadsFound} leads encontrados. Redirigiendo...`
            : `Buscando y auditando ${niche === '__custom__' ? customNiche : niche} en ${location}. Esto tarda ~30 segundos.`}
        </p>
        {leadsFound > 0 && status === 'processing' && (
          <p className="text-sm text-green-600 font-medium">{leadsFound} leads encontrados hasta ahora...</p>
        )}
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-5 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold">Nueva búsqueda de leads</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cada búsqueda consume ~5-10 créditos (1 por lead analizado). Tienes <strong>{creditsLeft}</strong> restantes.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="space-y-1">
        <Label>Sector / Nicho</Label>
        <Select value={niche} onValueChange={v => setNiche(v ?? '')} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un sector..." />
          </SelectTrigger>
          <SelectContent>
            {NICHES.map(n => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
            <SelectItem value="__custom__">Otro (escribir)</SelectItem>
          </SelectContent>
        </Select>
        {niche === '__custom__' && (
          <Input
            placeholder="Ej: Clínicas veterinarias"
            value={customNiche}
            onChange={e => setCustomNiche(e.target.value)}
            className="mt-2"
            required
          />
        )}
      </div>

      <div className="space-y-1">
        <Label>Ciudad / Ubicación</Label>
        <Select value={location} onValueChange={v => setLocation(v ?? '')} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una ciudad..." />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!niche || !location || (niche === '__custom__' && !customNiche) || creditsLeft <= 0}
      >
        🔍 Buscar leads
      </Button>
    </form>
  )
}
