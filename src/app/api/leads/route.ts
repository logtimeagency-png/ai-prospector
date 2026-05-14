import { createClient } from '@/lib/supabase/server'
import { isValidUUID, safeInt } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const searchId = searchParams.get('search_id')
  const limit  = safeInt(searchParams.get('limit'),  50, 1, 100)
  const offset = safeInt(searchParams.get('offset'), 0,  0)

  // Validate UUID format before hitting DB
  if (searchId && !isValidUUID(searchId)) {
    return NextResponse.json({ error: 'Parámetro inválido.' }, { status: 422 })
  }

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('opportunity_score', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchId) query = query.eq('search_id', searchId)

  const { data, error } = await query

  // Never expose raw DB error messages
  if (error) {
    console.error('[GET /api/leads] DB error:', error.code)
    return NextResponse.json({ error: 'Error al obtener leads.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
