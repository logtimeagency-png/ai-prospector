import { createClient } from '@/lib/supabase/server'
import { n8n } from '@/lib/n8n'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { niche, location } = body

  if (!niche?.trim() || !location?.trim()) {
    return NextResponse.json({ error: 'Nicho y ubicación son obligatorios.' }, { status: 422 })
  }

  // Verificar créditos
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

  // Crear registro de búsqueda
  const query = `${niche.trim()} en ${location.trim()}`
  const { data: search, error: searchError } = await supabase
    .from('searches')
    .insert({ user_id: user.id, query, niche: niche.trim(), location: location.trim() })
    .select()
    .single()

  if (searchError || !search) {
    return NextResponse.json({ error: 'Error al crear la búsqueda.' }, { status: 500 })
  }

  // Lanzar n8n en background (sin await — responder inmediatamente)
  n8n.triggerSearch({
    search_id: search.id,
    user_id: user.id,
    niche: niche.trim(),
    location: location.trim(),
    query,
  }).catch(err => {
    console.error('[n8n triggerSearch error]', err)
    supabase.from('searches').update({ status: 'failed', error_msg: err.message }).eq('id', search.id)
  })

  return NextResponse.json({ search_id: search.id, message: 'Búsqueda iniciada.' }, { status: 202 })
}
