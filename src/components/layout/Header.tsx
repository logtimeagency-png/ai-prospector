import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" size="sm" type="submit" className="gap-1.5">
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </Button>
        </form>
      </div>
    </header>
  )
}
