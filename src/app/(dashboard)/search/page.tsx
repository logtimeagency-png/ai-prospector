import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SearchForm } from '@/components/search/SearchForm'
import type { Profile } from '@/types'

export default async function SearchPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile) redirect('/login')

  const p = profile as Profile
  const creditsLeft = p.credits_total - p.credits_used

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nueva búsqueda</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Encuentra negocios locales con problemas digitales detectables
        </p>
      </div>
      <SearchForm creditsLeft={creditsLeft} />
    </div>
  )
}
