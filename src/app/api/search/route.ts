import { createClient } from '@/lib/supabase/server'
import { n8n } from '@/lib/n8n'
import { NextRequest, NextResponse } from 'next/server'

// Chars allowed in niche/location — blocks injection attempts
const SAFE_INPUT = /^[a-záéíóúüñàèìòùâêîôûçäëïöüA-ZÁÉÍÓÚÜÑ0-9 ,.()\-'&/]+$/i
const MAX_LEN = 80

function sanitize(val: unknown): string | null {
  if (typeof val !== 'string') return null
  const trimmed = val.trim().slice(0, MAX_LEN)
  if (!trimmed || !SAFE_INPUT.test(trimmed)) return null
  return trimmed
}

export async function POST(request: NextRequest) {
  // Content-type guard
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const niche    = sanitize((body as Record<string, unknown>).niche)
  const location = sanitize((body as Record<string, unknown>).location)

  if (!niche || !location) {
    return NextResponse.json(
      { error: 'Nicho y ubicación son obligatorios y solo pueden contener letras, números y espacios.' },
      { status: 422 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_total, credits_used, plan')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.credits_total - profile.credits_used) <= 0) {
    return NextResponse.json(
      { error: 'Sin créditos disponibles. Actualiza tu plan para continuar.', code: 'NO_CREDITS' },
      { status: 402 }
    )
  }

  const query = `${niche} en ${location}`
  const { data: search, error: searchError } = await supabase
    .from('searches')
    .insert({ user_id: user.id, query, niche, location })
    .select()
    .single()

  if (searchError || !search) {
    return NextResponse.json({ error: 'Error al crear la búsqueda.' }, { status: 500 })
  }

  n8n.triggerSearch({ search_id: search.id, user_id: user.id, niche, location, query })
    .catch(err => {
      console.error('[n8n triggerSearch error]', err)
      supabase.from('searches').update({ status: 'failed', error_msg: err.message }).eq('id', search.id)
    })

  return NextResponse.json({ search_id: search.id, message: 'Búsqueda iniciada.' }, { status: 202 })
}
