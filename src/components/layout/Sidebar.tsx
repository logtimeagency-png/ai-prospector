'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Settings, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import { PLAN_CONFIG } from '@/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search',    label: 'Nueva búsqueda', icon: Search },
  { href: '/settings',  label: 'Cuenta',   icon: Settings },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const creditsLeft = profile.credits_total - profile.credits_used
  const creditsPercent = Math.round((creditsLeft / profile.credits_total) * 100)
  const planCfg = PLAN_CONFIG[profile.plan]

  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">AI Prospector</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">by LogTime</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Credits */}
      <div className="px-4 py-4 border-t space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">Créditos</span>
          <span className="text-xs text-muted-foreground">
            {creditsLeft}/{profile.credits_total}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              creditsPercent > 30 ? 'bg-green-500' : creditsPercent > 10 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${creditsPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs capitalize text-muted-foreground">
            Plan {profile.plan}
          </span>
          {profile.plan === 'free' && (
            <Link
              href="/settings"
              className="text-xs text-primary font-medium hover:underline"
            >
              Mejorar →
            </Link>
          )}
        </div>
        {profile.plan === 'free' && creditsLeft <= 1 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            Casi sin créditos. Actualiza para no parar.
          </p>
        )}
      </div>
    </aside>
  )
}
