import { createClient } from '@/lib/supabase/server'
import { n8n } from '@/lib/n8n'
import { isValidUUID } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 422 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('leads').select('*').eq('id', id).eq('user_id', user.id).single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 422 })
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action !== 'regenerate') {
    return NextResponse.json({ error: 'Acción no válida.' }, { status: 422 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: lead } = await supabase
    .from('leads').select('id, analysis_status').eq('id', id).eq('user_id', user.id).single()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })
  if (lead.analysis_status !== 'done') {
    return NextResponse.json({ error: 'El lead aún no está analizado.' }, { status: 422 })
  }

  try {
    await n8n.triggerMessages({ lead_id: id, user_id: user.id })
  } catch (err) {
    console.error('[PATCH /api/leads/:id] n8n error:', err)
    return NextResponse.json({ error: 'Error al regenerar. Inténtalo de nuevo.' }, { status: 503 })
  }

  return NextResponse.json({ message: 'Regenerando scripts...' }, { status: 202 })
}
