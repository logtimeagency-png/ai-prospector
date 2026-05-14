import { createClient } from '@/lib/supabase/server'
import { n8n } from '@/lib/n8n'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (body.action !== 'regenerate') {
    return NextResponse.json({ error: 'Acción no válida.' }, { status: 422 })
  }

  // Verificar que el lead pertenece al usuario y está en estado 'done'
  const { data: lead } = await supabase
    .from('leads').select('id, analysis_status').eq('id', id).eq('user_id', user.id).single()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })
  if (lead.analysis_status !== 'done') {
    return NextResponse.json({ error: 'El lead aún no está analizado.' }, { status: 422 })
  }

  // Lanzar regeneración (consume 1 crédito via RPC en el workflow de n8n)
  await n8n.triggerMessages({ lead_id: id, user_id: user.id })

  return NextResponse.json({ message: 'Regenerando scripts...' }, { status: 202 })
}
