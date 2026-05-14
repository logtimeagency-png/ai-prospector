import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ─── In-memory rate limiter (resets on Vercel function restart) ───────────────
// For production scale, replace with Upstash Redis. This handles typical SaaS abuse.
const rateMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= limit) return false // blocked

  entry.count++
  return true // allowed
}

// Clean up old entries every 100 requests to avoid memory leak
let cleanupCounter = 0
function maybeCleanup() {
  if (++cleanupCounter < 100) return
  cleanupCounter = 0
  const now = Date.now()
  for (const [key, val] of rateMap) {
    if (now > val.resetAt) rateMap.delete(key)
  }
}

// ─── Limits ───────────────────────────────────────────────────────────────────
const LIMITS = {
  // Auth endpoints: 10 attempts per 15 min per IP
  auth: { limit: 10, windowMs: 15 * 60 * 1000 },
  // Search API: 20 searches per hour per IP
  search: { limit: 20, windowMs: 60 * 60 * 1000 },
  // Billing: 5 checkout attempts per hour per IP (prevents card testing)
  billing: { limit: 5, windowMs: 60 * 60 * 1000 },
  // General API: 200 req per minute per IP
  api: { limit: 200, windowMs: 60 * 1000 },
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? 'unknown'

  maybeCleanup()

  // ── Rate limiting ────────────────────────────────────────────────────────────

  // Auth endpoints — strictest limit
  if (pathname.startsWith('/api/auth') ||
      pathname === '/login' ||
      pathname === '/register') {
    if (!rateLimit(`auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.windowMs)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera 15 minutos.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      )
    }
  }

  // Search endpoint — per IP + moderate limit
  if (pathname === '/api/search') {
    if (!rateLimit(`search:${ip}`, LIMITS.search.limit, LIMITS.search.windowMs)) {
      return NextResponse.json(
        { error: 'Límite de búsquedas alcanzado. Vuelve en 1 hora.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      )
    }
  }

  // Billing endpoints — prevent card testing / checkout abuse
  if (pathname.startsWith('/api/billing/')) {
    if (!rateLimit(`billing:${ip}`, LIMITS.billing.limit, LIMITS.billing.windowMs)) {
      return NextResponse.json(
        { error: 'Demasiados intentos de pago. Espera 1 hora.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      )
    }
  }

  // All API routes — general protection
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/')) {
    if (!rateLimit(`api:${ip}`, LIMITS.api.limit, LIMITS.api.windowMs)) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  // ── Auth guard for dashboard routes ─────────────────────────────────────────
  if (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/search') ||
      pathname.startsWith('/lead') ||
      pathname.startsWith('/settings')) {

    const response = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  }

  // ── Block common attack paths ─────────────────────────────────────────────
  const blockedPaths = [
    '/wp-admin', '/wp-login', '/.env', '/phpMyAdmin',
    '/admin.php', '/xmlrpc.php', '/.git', '/config.php',
  ]
  if (blockedPaths.some(p => pathname.toLowerCase().startsWith(p))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
