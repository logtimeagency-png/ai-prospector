import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadsTable } from '@/components/leads/LeadsTable'
import type { Lead, Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: leads }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('opportunity_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (!profile) redirect('/login')

  const p = profile as Profile
  const creditsLeft = p.credits_total - p.credits_used

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {leads?.length ?? 0} leads totales · {creditsLeft} créditos restantes
          </p>
        </div>
      </div>

      <LeadsTable
        leads={(leads ?? []) as Lead[]}
        plan={p.plan}
      />
    </div>
  )
}
